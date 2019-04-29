import VerifierError from '../models/verifierError';
import * as SUB_STEPS from '../constants/verificationSubSteps';
import { getText } from '../domain/i18n/useCases';

export default function ensureHashesEqual (actual, expected, substep = SUB_STEPS.compareHashes) {
  if (actual !== expected) {
    throw new VerifierError(substep, getText('errors', 'ensureHashesEqual'));
  }
}
