import {BLOCKCHAINS, SUB_STEPS} from '../constants';
import {VerifierError, TransactionData} from "../models";
import {getText} from "../domain/i18n/useCases";
import {OTHER_BLOCKCHAINS} from "../constants/otherBlockchains";
import {stripHashPrefix} from "./utils/stripHashPrefix";
import {request} from "../services";

export function getEthereumWeb3Fetcher(transactionId, chain) {
    return new Promise((resolve, reject) => {
        // Get web3
        getWeb3FromChain(chain).then((web3) => {
            // Get tx
            getTransactionByHash(web3, transactionId).then((tx) => {
                getBlockByHash(web3, tx.blockHash).then((block) => {
                    resolve(createTransactionData(tx, block))
                }).catch(() => reject(
                    new VerifierError(
                        SUB_STEPS.fetchOtherChainRemoteHash,
                        getText('errors', 'getBlockcypherFetcher'))
                ))
            }).catch(() => reject(
                new VerifierError(
                    SUB_STEPS.fetchOtherChainRemoteHash,
                    getText('errors', 'getBlockcypherFetcher'))
            ));
        }).catch((e) => reject(e));
    });
}

class Web3Eth {

    constructor(web3) {
        this.web3 = web3;
    }

    getTransaction(transactionId) {
        return this.request(
            'getTransactionByHash',
            [transactionId]
        );
    }

    getBlock(blockHash) {
        return this.request(
            'getBlockByHash',
            [blockHash, false]
        ).then((block) => {
            block.timestamp = parseInt(block.timestamp, 16);
            return block;
        })
    }

    request(method, params) {
        return new Promise((resolve, reject) => {
            request({
                method: 'POST',
                url: this.web3.provider,
                contentType: 'application/json',
                body: {
                    jsonrpc: "2.0",
                    method: `eth_${method}`,
                    params: params,
                    id: 1
                }
            }).then((result) => {
                const parsedResult = JSON.parse(result);
                if (parsedResult.result)
                    resolve(parsedResult.result);
                else
                    reject(parsedResult.error);
            }).catch((e) => {
                reject(e);
            })
        });
    }
}

class Web3 {
    constructor(provider) {
        this.provider = provider;
        this.eth = new Web3Eth(this);
    }
}

function getWeb3FromChain(chain) {
    return new Promise((resolve, reject) => {
        const provider = getWeb3ProviderFromChain(chain);
        if (provider === null)
            reject(new VerifierError(SUB_STEPS.fetchOtherChainRemoteHash, getText('errors', 'lookForTxInvalidChain')));
        resolve(new Web3(provider))
    });
}

function getWeb3ProviderFromChain(chain) {
    if (chain === OTHER_BLOCKCHAINS.ethlocal.id) {
        return `http://${getCurrentHost()}:8545`;
    } else {
        return null;
    }
}

function getCurrentHost() {
    return window.location.hostname || 'localhost'
}

function getTransactionByHash(web3, transactionId) {
    return web3.eth.getTransaction(transactionId);
}

function getBlockByHash(web3, blockHash) {
    return web3.eth.getBlock(blockHash)
}

function createTransactionData(tx, block) {
    const opReturnScript = stripHashPrefix(tx.input, BLOCKCHAINS.ethmain.prefixes);
    const issuingAddress = tx.from;
    const date = new Date(block.timestamp * 1000);

    return new TransactionData(
        opReturnScript,
        issuingAddress,
        date,
        undefined
    )
}
