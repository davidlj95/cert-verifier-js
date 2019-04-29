export default function isOfficial(certificateJson) {
    return !!certificateJson.badge.official
}
