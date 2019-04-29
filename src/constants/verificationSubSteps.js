import * as STEPS from './verificationSteps';
import i18n from '../data/i18n';

const getTransactionId = 'getTransactionId';
const computeLocalHash = 'computeLocalHash';
const fetchRemoteHash = 'fetchRemoteHash';
const getIssuerProfile = 'getIssuerProfile';
const parseIssuerKeys = 'parseIssuerKeys';
const compareHashes = 'compareHashes';
const checkMerkleRoot = 'checkMerkleRoot';
const checkReceipt = 'checkReceipt';
const checkIssuerSignature = 'checkIssuerSignature';
const checkAuthenticity = 'checkAuthenticity';
const checkRevokedStatus = 'checkRevokedStatus';
const checkExpiresDate = 'checkExpiresDate';
const checkOfficialValidationIsPresent = 'checkOfficialValidationIsPresent';
const checkOfficialValidationIsForCurrentCertificate = 'checkOfficialValidationIsForCurrentCertificate';
const checkOfficialValidationComputeLocalHash = 'checkOfficialValidationComputeLocalHash';
const checkOfficialValidationCompareHashes = 'checkOfficialValidationCompareHashes';
const checkOfficialValidationCheckReceipt = 'checkOfficialValidationCheckReceipt';
const checkOfficialValidationMinistryIdentity = 'checkOfficialValidationMinistryIdentity';
const checkRecipientEndorsementIsForCurrentCertificate = 'checkRecipientEndorsementIsForCurrentCertificate';
const checkRecipientEndorsementComputeLocalHash = 'checkRecipientEndorsementComputeLocalHash';
const checkRecipientEndorsementCompareHashes = 'checkRecipientEndorsementCompareHashes';
const checkRecipientEndorsementCheckReceipt = 'checkRecipientEndorsementCheckReceipt';
const checkEDSEndorsementIsForCurrentCertificate = 'checkEDSEndorsementIsForCurrentCertificate';
const checkEDSEndorsementComputeLocalHash = 'checkEDSEndorsementComputeLocalHash';
const checkEDSEndorsementCompareHashes = 'checkEDSEndorsementCompareHashes';
const checkEDSEndorsementCheckReceipt = 'checkEDSEndorsementCheckReceipt';

function getTextFor (subStep, status) {
  return i18n['en-US'].subSteps[`${subStep}${status}`];
}

const LABEL = 'Label';
const LABEL_PENDING = 'LabelPending';

const subStepsMap = {
  [STEPS.formatValidation]: [getTransactionId, computeLocalHash, fetchRemoteHash, getIssuerProfile, parseIssuerKeys],
  [STEPS.hashComparison]: [compareHashes, checkMerkleRoot, checkReceipt],
  [STEPS.statusCheck]: [checkIssuerSignature, checkAuthenticity, checkRevokedStatus, checkExpiresDate],
  [STEPS.officialCheck]: [
    checkOfficialValidationIsPresent,
    checkOfficialValidationIsForCurrentCertificate,
    checkOfficialValidationComputeLocalHash,
    checkOfficialValidationCompareHashes,
    checkOfficialValidationCheckReceipt,
    checkOfficialValidationMinistryIdentity
  ],
  [STEPS.recipientCheck]: [
    checkRecipientEndorsementIsForCurrentCertificate,
    checkRecipientEndorsementComputeLocalHash,
    checkRecipientEndorsementCompareHashes,
    checkRecipientEndorsementCheckReceipt
  ],
  [STEPS.edsCheck]: [
    checkEDSEndorsementIsForCurrentCertificate,
    checkEDSEndorsementComputeLocalHash,
    checkEDSEndorsementCompareHashes,
    checkEDSEndorsementCheckReceipt
  ]
};

function generateSubsteps (parentKey) {
  return subStepsMap[parentKey].reduce((acc, curr) => {
    acc[curr] = {
      code: curr,
      label: getTextFor(curr, LABEL),
      labelPending: getTextFor(curr, LABEL_PENDING),
      parentStep: parentKey
    };
    return acc;
  }, {});
}

const language = Object.keys(subStepsMap).reduce((acc, parentStepKey) => {
  return Object.assign(acc, generateSubsteps(parentStepKey));
}, {});

export {
  getTransactionId,
  computeLocalHash,
  fetchRemoteHash,
  getIssuerProfile,
  parseIssuerKeys,
  compareHashes,
  checkMerkleRoot,
  checkReceipt,
  checkIssuerSignature,
  checkAuthenticity,
  checkRevokedStatus,
  checkExpiresDate,
  checkOfficialValidationIsPresent,
  checkOfficialValidationIsForCurrentCertificate,
  checkOfficialValidationComputeLocalHash,
  checkOfficialValidationCompareHashes,
  checkOfficialValidationCheckReceipt,
  checkOfficialValidationMinistryIdentity,
  checkRecipientEndorsementIsForCurrentCertificate,
  checkRecipientEndorsementComputeLocalHash,
  checkRecipientEndorsementCompareHashes,
  checkRecipientEndorsementCheckReceipt,
  checkEDSEndorsementIsForCurrentCertificate,
  checkEDSEndorsementComputeLocalHash,
  checkEDSEndorsementCompareHashes,
  checkEDSEndorsementCheckReceipt,
  language
};
