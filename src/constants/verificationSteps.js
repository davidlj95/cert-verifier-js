const formatValidation = 'formatValidation';
const hashComparison = 'hashComparison';
const statusCheck = 'statusCheck';
const officialCheck = 'officialCheck';
const final = 'final';

const language = {
  [formatValidation]: {
    label: 'Format validation',
    labelPending: 'Validating format',
    subSteps: []
  },
  [hashComparison]: {
    label: 'Hash comparison',
    labelPending: 'Comparing hash',
    subSteps: []
  },
  [statusCheck]: {
    label: 'Status check',
    labelPending: 'Checking record status',
    subSteps: []
  },
  [officialCheck]: {
    label: 'Officiality check',
    labelPending: 'Checking if the record has been officialized',
    subSteps: []
  }
};

export { final, formatValidation, hashComparison, statusCheck, officialCheck, language };
