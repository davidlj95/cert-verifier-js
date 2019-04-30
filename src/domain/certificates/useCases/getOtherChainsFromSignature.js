export default function getOtherChainsFromSignature(signature) {
    if(signature
        && signature.anchors instanceof Array
    ) {
        let anchors = signature.anchors;

        let otherChains = [];
        anchors.forEach(function(e) {
            // TODO: What if otherChains elements are not objects?
            if(e.otherChains instanceof Array) {
                otherChains = otherChains.concat(e.otherChains)
            }
        });

        if (otherChains.length === 0)
            return null;
        else
            return otherChains;

    }
    return null;
}
