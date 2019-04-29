export default function getAdditionalEndorsements(certificate) {
    if(certificate
    && certificate.signature instanceof Object
    && certificate.signature.endorsements instanceof Array)
        return certificate.signature.endorsements;
    return null;
}
