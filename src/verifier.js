import { STEPS, SUB_STEPS, VERIFICATION_STATUSES } from './constants';
import debug from 'debug';
import CERTIFICATE_VERSIONS from './constants/certificateVersions';
import VerifierError from './models/verifierError';
import domain from './domain';
import * as inspectors from './inspectors';
import {
  isOfficial,
  getOfficialValidationEndorsement,
  getAdditionalEndorsements,
  getRecipientEndorsement,
  getEDSEndorsement,
  getOtherChainsFromSignature
} from "./domain/certificates/useCases";

const log = debug('Verifier');

export default class Verifier {
  constructor ({ certificateJson, chain, expires, id, issuer, receipt, revocationKey, transactionId, version }) {
    this.chain = chain;
    this.expires = expires;
    this.id = id;
    this.issuer = issuer;
    this.receipt = receipt;
    this.revocationKey = revocationKey;
    this.version = version;
    this.transactionId = transactionId;
    this.fullCertificate = JSON.parse(JSON.stringify(certificateJson));

    let document = certificateJson.document;
    if (!document) {
      const certificateCopy = Object.assign({}, certificateJson);
      delete certificateCopy['signature'];
      document = certificateCopy;
    }

    this.documentToVerify = Object.assign({}, document);

    // Final verification result
    // Init status as success, we will update the final status at the end
    this._stepsStatuses = [];
  }

  /**
   * verify
   */
  async verify (stepCallback = () => {}) {
    this._stepCallback = stepCallback;

    if (this.version === CERTIFICATE_VERSIONS.V1_1) {
      throw new VerifierError(
        '',
        'Verification of 1.1 certificates is not supported by this component. See the python cert-verifier for legacy verification'
      );
    }

    if (domain.chains.isMockChain(this.chain)) {
      await this._verifyV2Mock();
    } else {
      await this._verifyMain();
    }

    // Send final callback update for global verification status
    const erroredStep = this._stepsStatuses.find(step => step.status === VERIFICATION_STATUSES.FAILURE);
    return erroredStep ? this._failed(erroredStep.message) : this._succeed();
  }

  /**
   * doAction
   *
   * @param step
   * @param action
   * @returns {*}
   */
  _doAction (step, action) {
    // If not failing already
    if (this._isFailing()) {
      return;
    }

    let label;
    if (step) {
      label = domain.i18n.getText('subSteps', `${step}LabelPending`);
      log(label);
      this._updateStatusCallback(step, label, VERIFICATION_STATUSES.STARTING);
    }

    try {
      let res = action();
      if (step) {
        this._updateStatusCallback(step, label, VERIFICATION_STATUSES.SUCCESS);
        this._stepsStatuses.push({step, label, status: VERIFICATION_STATUSES.SUCCESS});
      }
      return res;
    } catch (err) {
      if (step) {
        this._updateStatusCallback(step, label, VERIFICATION_STATUSES.FAILURE, err.message);
        this._stepsStatuses.push({
          code: step,
          label,
          status: VERIFICATION_STATUSES.FAILURE,
          errorMessage: err.message
        });
      }
    }
  }

  /**
   * doAsyncAction
   *
   * @param step
   * @param action
   * @returns {Promise<*>}
   */
  async _doAsyncAction (step, action) {
    // If not failing already
    if (this._isFailing()) {
      return;
    }

    let label;
    if (step) {
      label = domain.i18n.getText('subSteps', `${step}LabelPending`);
      log(label);
      this._updateStatusCallback(step, label, VERIFICATION_STATUSES.STARTING);
    }

    try {
      let res = await action();
      if (step) {
        this._updateStatusCallback(step, label, VERIFICATION_STATUSES.SUCCESS);
        this._stepsStatuses.push({step, label, status: VERIFICATION_STATUSES.SUCCESS});
      }
      return res;
    } catch (err) {
      if (step) {
        this._updateStatusCallback(step, label, VERIFICATION_STATUSES.FAILURE, err.message);
        this._stepsStatuses.push({
          code: step,
          label,
          status: VERIFICATION_STATUSES.FAILURE,
          errorMessage: err.message
        });
      }
    }
  }

  async _verifyMain () {

    // TODO: Include other chains validation

    // Check transaction id validity
    this._doAction(
      SUB_STEPS.getTransactionId,
      () => inspectors.isTransactionIdValid(this.transactionId)
    );

    // Compute local hash
    let localHash = await this._doAsyncAction(
      SUB_STEPS.computeLocalHash,
      async () => inspectors.computeLocalHash(this.documentToVerify, this.version)
    );

    // Fetch remote hash
    let txData = await this._doAsyncAction(
      SUB_STEPS.fetchRemoteHash,
      async () => domain.verifier.lookForTx(this.transactionId, this.chain.code, this.version)
    );

    // Get issuer profile
    let issuerProfileJson = await this._doAsyncAction(
      SUB_STEPS.getIssuerProfile,
      async () => domain.verifier.getIssuerProfile(this.issuer.id)
    );

    // Parse issuer keys
    let issuerKeyMap = await this._doAsyncAction(
      SUB_STEPS.parseIssuerKeys,
      () => domain.verifier.parseIssuerKeys(issuerProfileJson)
    );

    // Compare hashes
    this._doAction(SUB_STEPS.compareHashes, () => {
      inspectors.ensureHashesEqual(localHash, this.receipt.targetHash);
    });

    // Check merkle root
    this._doAction(SUB_STEPS.checkMerkleRoot, () =>
      inspectors.ensureMerkleRootEqual(this.receipt.merkleRoot, txData.remoteHash)
    );

    // Check receipt
    this._doAction(SUB_STEPS.checkReceipt, () =>
      inspectors.ensureValidReceipt(this.receipt)
    );

    // Check revoked status
    let keys;
    let revokedAddresses;
    if (this.version === CERTIFICATE_VERSIONS.V1_2) {
      revokedAddresses = txData.revokedAddresses;
      keys = [
        domain.verifier.parseRevocationKey(issuerProfileJson),
        this.revocationKey
      ];
    } else {
      // Get revoked assertions
      revokedAddresses = await this._doAsyncAction(
        null,
        async () => domain.verifier.getRevokedAssertions(this.issuer.revocationList)
      );
      keys = this.id;
    }

    this._doAction(SUB_STEPS.checkRevokedStatus, () =>
      inspectors.ensureNotRevoked(revokedAddresses, keys)
    );

    // Check authenticity
    this._doAction(SUB_STEPS.checkAuthenticity, () =>
      inspectors.ensureValidIssuingKey(issuerKeyMap, txData.issuingAddress, txData.time)
    );

    // Check expiration
    this._doAction(SUB_STEPS.checkExpiresDate, () =>
      inspectors.ensureNotExpired(this.expires)
    );
  }

  /**
   * verifyV2Mock
   *
   * Verify a v2 mock certificate
   *
   * @returns {Promise<void>}
   */
  async _verifyV2Mock () {
    // Compute local hash
    let localHash = await this._doAsyncAction(
      SUB_STEPS.computeLocalHash,
      async () =>
        inspectors.computeLocalHash(this.documentToVerify, this.version)
    );

    // Compare hashes
    this._doAction(SUB_STEPS.compareHashes, () =>
      inspectors.ensureHashesEqual(localHash, this.receipt.targetHash)
    );

    // Check receipt
    this._doAction(SUB_STEPS.checkReceipt, () =>
      inspectors.ensureValidReceipt(this.receipt)
    );

    // Check expiration date
    this._doAction(SUB_STEPS.checkExpiresDate, () =>
      inspectors.ensureNotExpired(this.expires)
    );

    // Other blockchain verifications
    let otherChain = getOtherChainsFromSignature(this.fullCertificate.signature);
    if(otherChain) {
      await this._verifyOtherBlockchain(otherChain[0]);
    }

    // Check official validation
    if(isOfficial(this.fullCertificate)) {

      // Endorsement is present
      this._doAction(SUB_STEPS.checkOfficialValidationIsPresent, () =>
          inspectors.ensureOfficializationIsPresent(this.fullCertificate)
      );

      // Verify endorsement
      let officialValidationEndorsement = getOfficialValidationEndorsement(
          this.fullCertificate);

      await this._verifyOfficialValidation(
          ...Verifier._endorsementToDocumentAndSignature(
              officialValidationEndorsement, this.fullCertificate
          )
      );

      // Verify ministry's identity
      // TODO: Move to main verification (that has the tx loaded)
      // this._doAction(SUB_STEPS.checkOfficialValidationMinistryIdentity, () =>
      //     inspectors.ensureMinistryIdentityIsVerified(signature.anchors[0].sourceId)
      // );
    }

    // Check extra endorsements
    let extraEndorsements = getAdditionalEndorsements(this.fullCertificate);
    if(extraEndorsements) {

      let recipientEndorsement = getRecipientEndorsement(this.fullCertificate);
      if(recipientEndorsement)
        await this._verifyRecipientEndorsement(
            ...Verifier._endorsementToDocumentAndSignature(
                recipientEndorsement, this.fullCertificate)
        );

      let edsEndorsement = getEDSEndorsement(this.fullCertificate);
      if(edsEndorsement)
        await this._verifyEDSEndorsement(
            ...Verifier._endorsementToDocumentAndSignature(
                edsEndorsement, this.fullCertificate)
        );

    }

  }

  /**
   * Adds the context of the assertion into the endorsement
   *
   * @param endorsement
   * @param assertion
   * @returns endorsement
   */
  static _addContext(endorsement, assertion) {
    endorsement['@context'] = assertion['@context'];
    return endorsement;
  }


  /**
   * Removes the document signature
   *
   * @param document
   * @returns {*}
   * @private
   */
  static _removeSignature(document) {
    delete document['signature'];
    return document;
  }

  static _endorsementToDocumentAndSignature(endorsement, certificate)  {
    const signature = endorsement.signature;
    const endorsementWithContextButNoSignature = Verifier._removeSignature(
        Verifier._addContext(endorsement, certificate)
    );
    return [endorsementWithContextButNoSignature, signature];
  }

  async _verifyOfficialValidation(endorsement, signature) {

    // Check is claiming about current certificate
    this._doAction(SUB_STEPS.checkOfficialValidationIsForCurrentCertificate, () =>
        inspectors.ensureClaimIsForCurrentCertificate(
            endorsement.claim,
            this.id,
            SUB_STEPS.checkOfficialValidationIsForCurrentCertificate,
            'ensureOfficialValidationIsForCurrentCertificate'
        )
    );

    // Compute local hash
    let localHash = await this._doAsyncAction(
        SUB_STEPS.checkOfficialValidationComputeLocalHash,
        async () =>
            inspectors.computeLocalHash(endorsement, this.version, SUB_STEPS.checkOfficialValidationComputeLocalHash)
    );

    // Compare hashes
    this._doAction(SUB_STEPS.checkOfficialValidationCompareHashes, () =>
        inspectors.ensureHashesEqual(localHash, signature.targetHash, SUB_STEPS.checkOfficialValidationCompareHashes)
    );

    // Check receipt
    this._doAction(SUB_STEPS.checkOfficialValidationCheckReceipt, () =>
        inspectors.ensureValidReceipt(signature, SUB_STEPS.checkOfficialValidationCheckReceipt)
    );

  }

  async _verifyEDSEndorsement(endorsement, signature) {

    // Check is claiming about current certificate
    this._doAction(SUB_STEPS.checkEDSEndorsementIsForCurrentCertificate, () =>
        inspectors.ensureClaimIsForCurrentCertificate(
            endorsement.claim,
            this.id,
            SUB_STEPS.checkEDSEndorsementIsForCurrentCertificate,
            'ensureEDSEndorsementIsForCurrentCertificate'
        )
    );

    // Compute local hash
    let localHash = await this._doAsyncAction(
        SUB_STEPS.checkEDSEndorsementComputeLocalHash,
        async () =>
            inspectors.computeLocalHash(endorsement, this.version, SUB_STEPS.checkEDSEndorsementComputeLocalHash)
    );


    // Compare hashes
    this._doAction(SUB_STEPS.checkEDSEndorsementCompareHashes, () =>
        inspectors.ensureHashesEqual(localHash, signature.targetHash, SUB_STEPS.checkEDSEndorsementCompareHashes)
    );

    // Check receipt
    this._doAction(SUB_STEPS.checkEDSEndorsementCheckReceipt, () =>
        inspectors.ensureValidReceipt(signature, SUB_STEPS.checkEDSEndorsementCheckReceipt)
    );

  }

  async _verifyRecipientEndorsement(endorsement, signature) {

    // Check is claiming about current certificate
    this._doAction(SUB_STEPS.checkRecipientEndorsementIsForCurrentCertificate, () =>
        inspectors.ensureClaimIsForCurrentCertificate(
            endorsement.claim,
            this.id,
            SUB_STEPS.checkRecipientEndorsementIsForCurrentCertificate,
            'ensureRecipientEndorsementIsForCurrentCertificate'
        )
    );

    // Compute local hash
    let localHash = await this._doAsyncAction(
        SUB_STEPS.checkRecipientEndorsementComputeLocalHash,
        async () =>
            inspectors.computeLocalHash(endorsement, this.version, SUB_STEPS.checkRecipientEndorsementComputeLocalHash)
    );

    // Compare hashes
    this._doAction(SUB_STEPS.checkRecipientEndorsementCompareHashes, () =>
        inspectors.ensureHashesEqual(localHash, signature.targetHash, SUB_STEPS.checkRecipientEndorsementCompareHashes)
    );

    // Check receipt
    this._doAction(SUB_STEPS.checkRecipientEndorsementCheckReceipt, () =>
        inspectors.ensureValidReceipt(signature, SUB_STEPS.checkRecipientEndorsementCheckReceipt)
    );

  }

  /**;
   * _failed
   *
   * Returns a failure final step message
   *
   * @param errorMessage
   * @returns {{code: string, status: string, errorMessage: *}}
   * @private
   */
  _failed (errorMessage) {
    log(`failure:${errorMessage}`);
    return {code: STEPS.final, status: VERIFICATION_STATUSES.FAILURE, errorMessage};
  }

  /**
   * _isFailing
   *
   * whether or not the current verification is failing
   *
   * @returns {boolean}
   * @private
   */
  _isFailing () {
    return this._stepsStatuses.some(step => step.status === VERIFICATION_STATUSES.FAILURE);
  }

  /**
   * _succeed
   *
   * Returns a final success message
   */
  _succeed () {
    const logMessage = domain.chains.isMockChain(this.chain)
      ? domain.i18n.getText('success', 'mocknet')
      : domain.i18n.getText('success', 'blockchain');
    log(logMessage);
    return {code: STEPS.final, status: VERIFICATION_STATUSES.SUCCESS};
  }

  /**
   * _updateStatusCallback
   *
   * calls the origin callback to update on a step status
   *
   * @param code
   * @param label
   * @param status
   * @param errorMessage
   * @private
   */
  _updateStatusCallback (code, label, status, errorMessage = '') {
    if (code != null) {
      let update = {code, label, status};
      if (errorMessage) {
        update.errorMessage = errorMessage;
      }
      this._stepCallback(update);
    }
  }

  /**
   * Verifies the certificate against other blockchains other than the
   * accepted by the Blockcerts standard.
   *
   * @private
   */
  async _verifyOtherBlockchain(otherBlockchain) {

    // Check transaction ID if not checked already
    if(domain.chains.isMockChain(this.chain)) {
      // Check transaction id validity
      this._doAction(
          SUB_STEPS.getOtherChainTransactionId,
          () => inspectors.isTransactionIdValid(this.transactionId)
      );
    }

    // Fetch remote hash
    let txData = await this._doAsyncAction(
        SUB_STEPS.fetchOtherChainRemoteHash,
        async () => domain.verifier.lookForTx(
            this.transactionId,
            otherBlockchain.id,
            this.version,
            otherBlockchain.protocol,
            SUB_STEPS.fetchOtherChainRemoteHash)
    );

    // Check merkle root
    this._doAction(SUB_STEPS.checkOtherChainMerkleRoot, () =>
        inspectors.ensureMerkleRootEqual(this.receipt.merkleRoot, txData.remoteHash, SUB_STEPS.checkOtherChainMerkleRoot)
    );

    // Get issuer profile
    let issuerProfileJson = await this._doAsyncAction(
        SUB_STEPS.getOtherChainIssuerProfile,
        async () => domain.verifier.getIssuerProfile(this.issuer.id, SUB_STEPS.getOtherChainIssuerProfile)
    );

    // Parse issuer keys
    let issuerKeyMap = await this._doAsyncAction(
        SUB_STEPS.parseOtherChainIssuerKeys,
        () => domain.verifier.parseIssuerKeys(issuerProfileJson, SUB_STEPS.parseOtherChainIssuerKeys)
    );

    // Get revoked assertions
    let keys;
    let revokedAddresses = await this._doAsyncAction(
        null,
        async () => domain.verifier.getRevokedAssertions(this.issuer.revocationList)
      );
      keys = this.id;

    this._doAction(SUB_STEPS.checkOtherChainRevokedStatus, () =>
      inspectors.ensureNotRevoked(revokedAddresses, keys, SUB_STEPS.checkOtherChainRevokedStatus)
    );

  }
}
