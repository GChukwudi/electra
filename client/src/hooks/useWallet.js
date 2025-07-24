import { useState, useEffect, useCallback } from 'react';
import { 
  isMetaMaskInstalled, 
  getProvider, 
  requestAccounts, 
  getCurrentChainId, 
  switchNetwork, 
  isOnCorrectNetwork,
  getAccountBalance
} from '../utils/web3.js';
import { CHAIN_ID, REFRESH_INTERVALS } from '../utils/constants.js';

export const useWallet = () => {
  const [account, setAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true);
  const [error, setError] = useState('');

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is required to use this application');
      return false;
    }

    try {
      setIsConnecting(true);
      setError('');
      
      // Request account access
      const accounts = await requestAccounts();
      
      if (accounts.length === 0) {
        setError('No accounts found. Please unlock MetaMask.');
        return false;
      }

      // Get current chain ID
      const currentChainId = await getCurrentChainId();
      setChainId(currentChainId);

      // Check if on correct network
      const correctNetwork = currentChainId === CHAIN_ID;
      setIsCorrectNetwork(correctNetwork);

      if (!correctNetwork) {
        const switched = await switchNetwork(CHAIN_ID);
        if (!switched) {
          setError('Please switch to the correct network in MetaMask');
          return false;
        }
        setIsCorrectNetwork(true);
        setChainId(CHAIN_ID);
      }

      // Initialize provider
      const web3Provider = getProvider();
      if (!web3Provider) {
        setError('Failed to initialize Web3 provider');
        return false;
      }

      setProvider(web3Provider);
      setAccount(accounts[0]);
      
      // Get account balance
      const accountBalance = await getAccountBalance(accounts[0], web3Provider);
      setBalance(accountBalance);

      return true;
      
    } catch (error) {
      console.error('Connection error:', error);
      setError(`Failed to connect: ${error.message}`);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setAccount('');
    setProvider(null);
    setBalance('0');
    setChainId(null);
    setIsCorrectNetwork(true);
    setError('');
  }, []);

  // Switch to correct network
  const switchToCorrectNetwork = useCallback(async () => {
    try {
      const switched = await switchNetwork(CHAIN_ID);
      if (switched) {
        setIsCorrectNetwork(true);
        setChainId(CHAIN_ID);
        setError('');
        return true;
      } else {
        setError('Failed to switch network');
        return false;
      }
    } catch (error) {
      console.error('Network switch error:', error);
      setError(`Failed to switch network: ${error.message}`);
      return false;
    }
  }, []);

  // Update balance
  const updateBalance = useCallback(async () => {
    if (account && provider) {
      try {
        const newBalance = await getAccountBalance(account, provider);
        setBalance(newBalance);
      } catch (error) {
        console.error('Error updating balance:', error);
      }
    }
  }, [account, provider]);

  // Setup event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        // Update balance for new account
        if (provider) {
          getAccountBalance(accounts[0], provider).then(setBalance);
        }
      }
    };

    const handleChainChanged = (chainId) => {
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      setIsCorrectNetwork(newChainId === CHAIN_ID);
      
      if (newChainId !== CHAIN_ID) {
        setError('Please switch to the correct network');
      } else {
        setError('');
      }
    };

    const handleConnect = (connectInfo) => {
      console.log('Wallet connected:', connectInfo);
    };

    const handleDisconnect = (error) => {
      console.log('Wallet disconnected:', error);
      disconnectWallet();
    };

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('connect', handleConnect);
    window.ethereum.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('connect', handleConnect);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [account, provider, disconnectWallet]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        // Check if already connected
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Auto-connect error:', error);
      }
    };

    autoConnect();
  }, [connectWallet]);

  // Periodic balance updates
  useEffect(() => {
    if (!account || !provider) return;

    const interval = setInterval(updateBalance, REFRESH_INTERVALS.WALLET_CHECK);
    return () => clearInterval(interval);
  }, [account, provider, updateBalance]);

  // Check network status periodically
  useEffect(() => {
    if (!account) return;

    const checkNetwork = async () => {
      const correctNetwork = await isOnCorrectNetwork();
      setIsCorrectNetwork(correctNetwork);
      
      if (!correctNetwork && !error) {
        setError('Please switch to the correct network');
      } else if (correctNetwork && error.includes('network')) {
        setError('');
      }
    };

    const interval = setInterval(checkNetwork, REFRESH_INTERVALS.WALLET_CHECK);
    return () => clearInterval(interval);
  }, [account, error]);

  return {
    // State
    account,
    provider,
    chainId,
    balance,
    isConnecting,
    isCorrectNetwork,
    error,
    isConnected: !!account,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    
    // Actions
    connectWallet,
    disconnectWallet,
    switchToCorrectNetwork,
    updateBalance,
    
    // Utilities
    clearError: () => setError(''),
    formatBalance: (decimals = 4) => parseFloat(balance).toFixed(decimals)
  };
};