export default function getEndorsementByClaimType(endorsements, claimType) {
    let foundEndorsement = null;

    // Look by claim type
    for(let i = 0; i<endorsements.length; i++) {

      let currentEndorsement = endorsements[i];

      if(!currentEndorsement.claim instanceof Object)
        return;

      if(currentEndorsement.claim.type === claimType
          || (currentEndorsement.claim.type instanceof Array &&
              currentEndorsement.claim.type.includes(claimType))
      ) {
        foundEndorsement = currentEndorsement;
        break;
      }
    }

    // Return if found
    if(foundEndorsement && foundEndorsement instanceof Object) {
      return foundEndorsement;
    }

    return null;
}
