import VerifierError from "../models/verifierError";
import * as SUB_STEPS from "../constants/verificationSubSteps";
import {getText} from "../domain/i18n/useCases";

export default function ensureRecipientEndorsementIsPresent (recipientEndorsement) {
    // Check if recipient endorsement is present
    if(!recipientEndorsement) {
        throw new VerifierError(
            SUB_STEPS.checkRecipientEndorsementIsPresent,
            getText('errors', 'ensureRecipientEndorsementIsPresent')
        );
    }
}
