import {getAdditionalEndorsements, getEndorsementByClaimType} from "./index";

export default function getEDSEndorsement(certificate) {
    let extraEndorsements = getAdditionalEndorsements(certificate);
    if(extraEndorsements) {
        return getEndorsementByClaimType(extraEndorsements, 'EDSClaim');
    }
    return null;
}
