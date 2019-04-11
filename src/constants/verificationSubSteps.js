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
const checkOfficialValidationComputeLocalHash = 'checkOfficialValidationComputeLocalHash';
const checkOfficialValidationCompareHashes = 'checkOfficialValidationCompareHashes';
const checkOfficialValidationCheckReceipt = 'checkOfficialValidationCheckReceipt';
const checkOfficialValidationMinistryIdentity = 'checkOfficialValidationMinistryIdentity';
const checkEDSEndorsementComputeLocalHash = 'checkEDSEndorsementComputeLocalHash';
const checkEDSEndorsementCompareHashes = 'checkEDSEndorsementCompareHashes';
const checkEDSEndorsementCheckReceipt = 'checkEDSEndorsementCheckReceipt';
const checkRecipientEndorsementComputeLocalHash = 'checkRecipientEndorsementComputeLocalHash';
const checkRecipientEndorsementCompareHashes = 'checkRecipientEndorsementCompareHashes';
const checkRecipientEndorsementCheckReceipt = 'checkRecipientEndorsementCheckReceipt';

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
    checkOfficialValidationComputeLocalHash,
    checkOfficialValidationCompareHashes,
    checkOfficialValidationCheckReceipt,
    checkOfficialValidationMinistryIdentity
  ],
  [STEPS.edsCheck]: [
    checkEDSEndorsementComputeLocalHash,
    checkEDSEndorsementCompareHashes,
    checkEDSEndorsementCheckReceipt
  ],
  [STEPS.recipientCheck]: [
    checkRecipientEndorsementComputeLocalHash,
    checkRecipientEndorsementCompareHashes,
    checkRecipientEndorsementCheckReceipt
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
  checkOfficialValidationComputeLocalHash,
  checkOfficialValidationCompareHashes,
  checkOfficialValidationCheckReceipt,
  checkOfficialValidationMinistryIdentity,
  checkEDSEndorsementComputeLocalHash,
  checkEDSEndorsementCompareHashes,
  checkEDSEndorsementCheckReceipt,
  checkRecipientEndorsementComputeLocalHash,
  checkRecipientEndorsementCompareHashes,
  checkRecipientEndorsementCheckReceipt,
  language
};
