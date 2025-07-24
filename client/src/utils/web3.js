import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CHAIN_ID, NETWORKS } from './constants.js';
import ElectraContract from '../contracts/Electra.json';

/**
 * Check if MetaMask is installed
 * @returns {boolean} Is MetaMask available
 */
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

/**
 * Get Web3Provider from MetaMask
 * @returns {ethers.providers.Web3Provider|null} Web3 provider or null
 */
export const getProvider = () => {
  if (!isMetaMaskInstalled()) return null;
  return new ethers.providers.Web3Provider(window.ethereum);
};

/**
 * Get contract instance with signer
 * @param {ethers.providers.Web3Provider} provider - Web3 provider
 * @returns {ethers.Contract|null} Contract instance or null
 */
export const getContract = (provider) => {
  if (!provider) return null;
  
  try {
    const signer = provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, ElectraContract.abi, signer);
  } catch (error) {
    console.error('Error creating contract instance:', error);
    return null;
  }
};

/**
 * Get read-only contract instance
 * @param {ethers.providers.Web3Provider} provider - Web3 provider
 * @returns {ethers.Contract|null} Read-only contract instance
 */
export const getReadOnlyContract = (provider) => {
  if (!provider) return null;
  
  try {
    return new ethers.Contract(CONTRACT_ADDRESS, ElectraContract.abi, provider);
  } catch (error) {
    console.error('Error creating read-only contract instance:', error);
    return null;
  }
};

/**
 * Request account access from MetaMask
 * @returns {Promise<string[]>} Array of account addresses
 */
export const requestAccounts = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }
  
  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    return accounts;
  } catch (error) {
    console.error('Error requesting accounts:', error);
    throw error;
  }
};

/**
 * Get current chain ID
 * @returns {Promise<number>} Chain ID
 */
export const getCurrentChainId = async () => {
  if (!isMetaMaskInstalled()) return null;
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
};

/**
 * Switch to target network
 * @param {number} targetChainId - Target chain ID
 * @returns {Promise<boolean>} Success status
 */
export const switchNetwork = async (targetChainId = CHAIN_ID) => {
  if (!isMetaMaskInstalled()) return false;
  
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${targetChainId.toString(16)}` }]
    });
    return true;
  } catch (error) {
    // If network doesn't exist, try to add it
    if (error.code === 4902) {
      return await addNetwork(targetChainId);
    }
    console.error('Error switching network:', error);
    return false;
  }
};

/**
 * Add network to MetaMask
 * @param {number} chainId - Chain ID to add
 * @returns {Promise<boolean>} Success status
 */
export const addNetwork = async (chainId) => {
  if (!isMetaMaskInstalled()) return false;
  
  const network = NETWORKS[chainId];
  if (!network) {
    console.error('Network configuration not found for chain ID:', chainId);
    return false;
  }
  
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${chainId.toString(16)}`,
        chainName: network.name,
        rpcUrls: [network.rpcUrl],
        blockExplorerUrls: [network.blockExplorer],
        nativeCurrency: network.nativeCurrency
      }]
    });
    return true;
  } catch (error) {
    console.error('Error adding network:', error);
    return false;
  }
};

/**
 * Check if wallet is connected to correct network
 * @returns {Promise<boolean>} Is on correct network
 */
export const isOnCorrectNetwork = async () => {
  const currentChainId = await getCurrentChainId();
  return currentChainId === CHAIN_ID;
};

/**
 * Get account balance
 * @param {string} address - Account address
 * @param {ethers.providers.Web3Provider} provider - Web3 provider
 * @returns {Promise<string>} Balance in ETH
 */
export const getAccountBalance = async (address, provider) => {
  if (!address || !provider) return '0';
  
  try {
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error getting account balance:', error);
    return '0';
  }
};

/**
 * Estimate gas for transaction
 * @param {ethers.Contract} contract - Contract instance
 * @param {string} method - Method name
 * @param {Array} args - Method arguments
 * @returns {Promise<ethers.BigNumber>} Estimated gas
 */
export const estimateGas = async (contract, method, args = []) => {
  if (!contract || !method) return ethers.BigNumber.from(200000);
  
  try {
    return await contract.estimateGas[method](...args);
  } catch (error) {
    console.error('Error estimating gas:', error);
    return ethers.BigNumber.from(200000); // Default gas limit
  }
};

/**
 * Get current gas price
 * @param {ethers.providers.Web3Provider} provider - Web3 provider
 * @returns {Promise<ethers.BigNumber>} Gas price
 */
export const getGasPrice = async (provider) => {
  if (!provider) return ethers.BigNumber.from('20000000000'); // 20 gwei default
  
  try {
    return await provider.getGasPrice();
  } catch (error) {
    console.error('Error getting gas price:', error);
    return ethers.BigNumber.from('20000000000');
  }
};

/**
 * Wait for transaction confirmation
 * @param {string} txHash - Transaction hash
 * @param {ethers.providers.Web3Provider} provider - Web3 provider
 * @param {number} confirmations - Number of confirmations to wait for
 * @returns {Promise<ethers.providers.TransactionReceipt>} Transaction receipt
 */
export const waitForTransaction = async (txHash, provider, confirmations = 1) => {
  if (!txHash || !provider) throw new Error('Missing transaction hash or provider');
  
  try {
    return await provider.waitForTransaction(txHash, confirmations);
  } catch (error) {
    console.error('Error waiting for transaction:', error);
    throw error;
  }
};

/**
 * Parse contract error message
 * @param {Error} error - Contract error
 * @returns {string} User-friendly error message
 */
export const parseContractError = (error) => {
  if (!error) return 'Unknown error occurred';
  
  const errorMessage = error.message || error.toString();
  
  // Common error patterns
  if (errorMessage.includes('Already registered')) {
    return 'You are already registered to vote';
  }
  
  if (errorMessage.includes('Registration closed')) {
    return 'Voter registration is currently closed';
  }
  
  if (errorMessage.includes('Already voted')) {
    return 'You have already cast your vote';
  }
  
  if (errorMessage.includes('Voting closed')) {
    return 'Voting is currently closed';
  }
  
  if (errorMessage.includes('Not registered')) {
    return 'You must register to vote first';
  }
  
  if (errorMessage.includes('Invalid candidate')) {
    return 'Selected candidate is not valid';
  }
  
  if (errorMessage.includes('user rejected transaction')) {
    return 'Transaction was cancelled by user';
  }
  
  if (errorMessage.includes('insufficient funds')) {
    return 'Insufficient funds for transaction';
  }
  
  if (errorMessage.includes('execution reverted')) {
    return 'Transaction failed - please check the conditions and try again';
  }
  
  // Return original message if no pattern matches
  return errorMessage.length > 100 ? 
    'Transaction failed - please try again' : 
    errorMessage;
};

/**
 * Format transaction hash for display
 * @param {string} txHash - Transaction hash
 * @returns {string} Formatted hash
 */
export const formatTxHash = (txHash) => {
  if (!txHash) return '';
  return `${txHash.slice(0, 10)}...${txHash.slice(-8)}`;
};

/**
 * Get transaction explorer URL
 * @param {string} txHash - Transaction hash
 * @param {number} chainId - Chain ID
 * @returns {string} Explorer URL
 */
export const getTxExplorerUrl = (txHash, chainId = CHAIN_ID) => {
  const network = NETWORKS[chainId];
  if (!network || !txHash) return '';
  return `${network.blockExplorer}/tx/${txHash}`;
};

/**
 * Get address explorer URL
 * @param {string} address - Address
 * @param {number} chainId - Chain ID
 * @returns {string} Explorer URL
 */
export const getAddressExplorerUrl = (address, chainId = CHAIN_ID) => {
  const network = NETWORKS[chainId];
  if (!network || !address) return '';
  return `${network.blockExplorer}/address/${address}`;
};
