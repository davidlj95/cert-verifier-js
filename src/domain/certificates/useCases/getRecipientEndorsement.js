import {getEndorsementByClaimType, getAdditionalEndorsements} from "./index";

export default function getRecipientEndorsement(certificate) {
    let extraEndorsements = getAdditionalEndorsements(certificate);
    if(extraEndorsements) {
        return getEndorsementByClaimType(extraEndorsements, 'RecipientClaim');
    }
    return null;
}
