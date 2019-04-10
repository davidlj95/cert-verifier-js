import VerifierError from "../models/verifierError";
import * as SUB_STEPS from "../constants/verificationSubSteps";
import {getText} from "../domain/i18n/useCases";

export default function ensureOfficializationIsPresent (document) {
    // Check if official validation is present
    if(!document.officialValidation) {
        throw new VerifierError(
            SUB_STEPS.checkOfficialValidationIsPresent,
            getText('errors', 'ensureOfficializationIsPresent')
        );
    }
}
