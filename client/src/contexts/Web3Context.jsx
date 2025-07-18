import React, { createContext, useContext, useState, useEffect } from 'react';
import Web3 from 'web3';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkId, setNetworkId] = useState(null);
  const [error, setError] = useState(null);

  // Network configurations
  const networks = {
    1: 'Ethereum Mainnet',
    11155111: 'Sepolia Testnet',
    1337: 'Local Development',
    5777: 'Ganache'
  };

  // Check if wallet is already connected on page load
  const checkIfWalletIsConnected = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        
        const accounts = await web3Instance.eth.getAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          
          const netId = await web3Instance.eth.net.getId();
          setNetworkId(Number(netId));
        }
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
      setError('Failed to check wallet connection');
    }
  };

  // Connect to MetaMask wallet
  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      setAccount(accounts[0]);
      setIsConnected(true);

      // Get network ID
      const netId = await web3Instance.eth.net.getId();
      setNetworkId(Number(netId));

      // Check if we're on the correct network (Sepolia for production, allow local for development)
      const targetNetworkId = import.meta.env.VITE_NETWORK_ID || 11155111;
      if (Number(netId) !== Number(targetNetworkId) && Number(netId) !== 1337 && Number(netId) !== 5777) {
        console.warn(`Connected to network ${netId}, but expected ${targetNetworkId}`);
        // Don't throw error, just warn for development flexibility
      }

    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWeb3(null);
    setAccount(null);
    setIsConnected(false);
    setNetworkId(null);
    setError(null);
  };

  // Switch network
  const switchNetwork = async (targetNetworkId) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetNetworkId.toString(16)}` }]
      });
    } catch (switchError) {
      console.error('Error switching network:', switchError);
      setError('Failed to switch network');
    }
  };

  // Get account balance
  const getBalance = async (address = account) => {
    if (!web3 || !address) return '0';
    
    try {
      const balance = await web3.eth.getBalance(address);
      return web3.utils.fromWei(balance, 'ether');
    } catch (err) {
      console.error('Error getting balance:', err);
      return '0';
    }
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Validate Ethereum address
  const isValidAddress = (address) => {
    if (!web3) return false;
    return web3.utils.isAddress(address);
  };

  // Listen for account and network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = (chainId) => {
        setNetworkId(parseInt(chainId, 16));
        // Reload the page to reset the dapp state
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Check connection on component mount
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const value = {
    web3,
    account,
    isConnected,
    isLoading,
    error,
    networkId,
    networkName: networks[networkId] || 'Unknown Network',
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getBalance,
    formatAddress,
    isValidAddress,
    checkIfWalletIsConnected
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
