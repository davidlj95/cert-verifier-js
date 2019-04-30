import {getEthereumWeb3Fetcher} from "../../../src/explorers/ethereumWeb3";

// Unskip it if you want to test it
describe('Ethereum Web3js fetcher', function () {
    it('Should fetch a hash locally', async function () {
        const fetcher = getEthereumWeb3Fetcher(
            '0x89b8aa5f19e91cbcfa9d2dd5d7a5273e09037db0192945421de90c6528371539',
            'urn:example:local');
        const result = await fetcher;
        expect(result).not.toBeNull();
    });
});
