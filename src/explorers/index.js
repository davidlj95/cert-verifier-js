import { getEtherScanFetcher } from './ethereum';
import { getBlockcypherFetcher, getChainSoFetcher } from './bitcoin';
import { getEthereumWeb3Fetcher } from "./ethereumWeb3";

const BitcoinExplorers = [
  (transactionId, chain) => getChainSoFetcher(transactionId, chain),
  (transactionId, chain) => getBlockcypherFetcher(transactionId, chain)
];

const EthereumExplorers = [
  (transactionId, chain) => getEtherScanFetcher(transactionId, chain)
];

const EthereumWeb3Explorers = [
  (transactionId, chain) => getEthereumWeb3Fetcher(transactionId, chain)
];

// for legacy (pre-v2) Blockcerts
const BlockchainExplorersWithSpentOutputInfo = [
  (transactionId, chain) => getBlockcypherFetcher(transactionId, chain)
];

export { BitcoinExplorers, EthereumExplorers, EthereumWeb3Explorers, BlockchainExplorersWithSpentOutputInfo };
