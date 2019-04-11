import VerifierError from '../models/verifierError';
import * as SUB_STEPS from '../constants/verificationSubSteps';
import { getText } from '../domain/i18n/useCases';

export default function ensureMinistryIdentityIsVerified (identity) {
    if (identity !==  "0xca7a4cbf4041de7dd70e10f9c4b0994f855f484a") {
        throw new VerifierError(
            SUB_STEPS.checkOfficialValidationMinistryIdentity,
            getText('errors', 'ensureMinistryIdentityIsVerified')
        );
    }
}
