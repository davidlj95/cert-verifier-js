import {VerifierError} from "../models";
import { getText } from "../domain/i18n/useCases";

export default function ensureClaimIsForCurrentCertificateId(claim, certificateId, substep, error) {
    if(claim.id !== certificateId) {
        throw new VerifierError(
            substep,
            getText('errors', error)
        );
    }
}
