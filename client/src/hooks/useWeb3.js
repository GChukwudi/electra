/**
 * useWeb3 Hook - Web3 Connection and Wallet Management
 * Comprehensive Web3 integration with wallet detection, network management, and utilities
 * @author God's Favour Chukwudi
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Web3 from 'web3';
import { web3Utils } from '../utils/web3Utils';
import { security } from '../utils/security';

/**
 * Supported wallet types
 */
const WALLET_TYPES = {
  METAMASK: 'MetaMask',
  WALLET_CONNECT: 'WalletConnect',
  COINBASE: 'Coinbase Wallet',
  TRUST: 'Trust Wallet',
  INJECTED: 'Injected Wallet'
};

/**
 * Network configurations
 */
const NETWORKS = {
  1: {
    name: 'Ethereum Mainnet',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    isTestnet: false
  },
  11155111: {
    name: 'Sepolia Testnet',
    currency: 'SepoliaETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://sepolia.infura.io/v3/',
    isTestnet: true
  },
  137: {
    name: 'Polygon Mainnet',
    currency: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com',
    isTestnet: false
  },
  80001: {
    name: 'Mumbai Testnet',
    currency: 'MATIC',
    explorerUrl: 'https://mumbai.polygonscan.com',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    isTestnet: true
  },
  1337: {
    name: 'Local Development',
    currency: 'ETH',
    explorerUrl: 'http://localhost:8545',
    rpcUrl: 'http://localhost:8545',
    isTestnet: true
  },
  5777: {
    name: 'Ganache',
    currency: 'ETH',
    explorerUrl: 'http://localhost:7545',
    rpcUrl: 'http://localhost:7545',
    isTestnet: true
  }
};

/**
 * Web3 management hook
 * @param {Object} options - Configuration options
 * @returns {Object} Web3 state and methods
 */
export const useWeb3 = (options = {}) => {
  // Configuration
  const config = {
    autoConnect: true,
    supportedChainIds: [1, 11155111, 137, 80001, 1337, 5777],
    preferredChainId: parseInt(process.env.VITE_NETWORK_ID) || 11155111,
    enableBalancePolling: true,
    balancePollingInterval: 30000,
    enableNetworkDetection: true,
    ...options
  };

  // Core Web3 state
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [walletType, setWalletType] = useState(null);
  
  // Network state
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [isNetworkSupported, setIsNetworkSupported] = useState(true);
  
  // Advanced state
  const [gasPrice, setGasPrice] = useState(null);
  const [blockNumber, setBlockNumber] = useState(null);
  const [lastActivity, setLastActivity] = useState(null);
  
  // Refs for cleanup and timers
  const mounted = useRef(true);
  const balanceTimer = useRef(null);
  const gasTimer = useRef(null);
  const blockTimer = useRef(null);

  /**
   * Detect available wallets
   */
  const detectWallets = useCallback(() => {
    const wallets = [];
    
    if (typeof window !== 'undefined') {
      if (window.ethereum) {
        if (window.ethereum.isMetaMask) {
          wallets.push(WALLET_TYPES.METAMASK);
        } else if (window.ethereum.isCoinbaseWallet) {
          wallets.push(WALLET_TYPES.COINBASE);
        } else if (window.ethereum.isTrust) {
          wallets.push(WALLET_TYPES.TRUST);
        } else {
          wallets.push(WALLET_TYPES.INJECTED);
        }
      }
      
      // Check for WalletConnect
      if (window.WalletConnect) {
        wallets.push(WALLET_TYPES.WALLET_CONNECT);
      }
    }
    
    return wallets;
  }, []);

  /**
   * Initialize Web3 connection
   */
  const initializeWeb3 = useCallback(async (provider = null) => {
    try {
      let web3Provider = provider;
      
      if (!web3Provider) {
        if (typeof window !== 'undefined' && window.ethereum) {
          web3Provider = window.ethereum;
        } else {
          throw new Error('No Web3 provider found. Please install MetaMask or another Web3 wallet.');
        }
      }

      const web3Instance = new Web3(web3Provider);
      
      // Test the connection
      await web3Instance.eth.getChainId();
      
      if (mounted.current) {
        setWeb3(web3Instance);
      }
      
      return web3Instance;
    } catch (error) {
      console.error('Web3 initialization failed:', error);
      throw new Error(`Failed to initialize Web3: ${error.message}`);
    }
  }, []);

  /**
   * Connect to wallet
   */
  const connectWallet = useCallback(async (walletType = null) => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Rate limiting check
      const rateLimitResult = security.rateLimit.check('wallet_connect', 'global', 5, 60000);
      if (!rateLimitResult.allowed) {
        throw new Error('Too many connection attempts. Please wait a moment.');
      }

      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('Web3 wallet not found. Please install MetaMask or another compatible wallet.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      // Initialize Web3
      const web3Instance = await initializeWeb3(window.ethereum);
      
      // Get network information
      const chainId = await web3Instance.eth.getChainId();
      const networkData = NETWORKS[chainId];
      
      if (mounted.current) {
        setAccounts(accounts);
        setAccount(accounts[0]);
        setChainId(chainId);
        setNetworkInfo(networkData);
        setIsConnected(true);
        setWalletType(walletType || detectWallets()[0] || WALLET_TYPES.INJECTED);
        setIsWrongNetwork(!config.supportedChainIds.includes(chainId));
        setIsNetworkSupported(!!networkData);
        setLastActivity(Date.now());
        
        // Store connection info
        localStorage.setItem('electra_wallet_connected', 'true');
        localStorage.setItem('electra_wallet_type', walletType || 'unknown');
        localStorage.setItem('electra_last_account', accounts[0]);
      }

      return accounts[0];
    } catch (error) {
      console.error('Wallet connection failed:', error);
      
      if (mounted.current) {
        setConnectionError(error.message);
        setIsConnected(false);
      }
      
      throw error;
    } finally {
      if (mounted.current) {
        setIsConnecting(false);
      }
    }
  }, [isConnecting, initializeWeb3, detectWallets, config.supportedChainIds]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    if (mounted.current) {
      setWeb3(null);
      setAccount(null);
      setAccounts([]);
      setChainId(null);
      setBalance('0');
      setIsConnected(false);
      setWalletType(null);
      setNetworkInfo(null);
      setIsWrongNetwork(false);
      setConnectionError(null);
      setGasPrice(null);
      setBlockNumber(null);
      setLastActivity(null);
    }

    // Clear stored connection info
    localStorage.removeItem('electra_wallet_connected');
    localStorage.removeItem('electra_wallet_type');
    localStorage.removeItem('electra_last_account');

    // Clear timers
    if (balanceTimer.current) {
      clearInterval(balanceTimer.current);
      balanceTimer.current = null;
    }
    if (gasTimer.current) {
      clearInterval(gasTimer.current);
      gasTimer.current = null;
    }
    if (blockTimer.current) {
      clearInterval(blockTimer.current);
      blockTimer.current = null;
    }
  }, []);

  /**
   * Switch to a different network
   */
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) {
      throw new Error('Wallet not connected');
    }

    const hexChainId = `0x${targetChainId.toString(16)}`;
    const targetNetwork = NETWORKS[targetChainId];

    if (!targetNetwork) {
      throw new Error('Unsupported network');
    }

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }]
      });
    } catch (switchError) {
      // If the network isn't added to the wallet, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: hexChainId,
              chainName: targetNetwork.name,
              nativeCurrency: {
                name: targetNetwork.currency,
                symbol: targetNetwork.currency,
                decimals: 18
              },
              rpcUrls: [targetNetwork.rpcUrl],
              blockExplorerUrls: [targetNetwork.explorerUrl]
            }]
          });
        } catch (addError) {
          throw new Error(`Failed to add network: ${addError.message}`);
        }
      } else {
        throw new Error(`Failed to switch network: ${switchError.message}`);
      }
    }
  }, []);

  /**
   * Get account balance
   */
  const updateBalance = useCallback(async (address = account) => {
    if (!web3 || !address) return '0';

    try {
      const balanceWei = await web3.eth.getBalance(address);
      const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
      
      if (mounted.current && address === account) {
        setBalance(balanceEth);
      }
      
      return balanceEth;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }, [web3, account]);

  /**
   * Get current gas price
   */
  const updateGasPrice = useCallback(async () => {
    if (!web3) return null;

    try {
      const price = await web3.eth.getGasPrice();
      const formattedPrice = web3Utils.formatGasPrice(price);
      
      if (mounted.current) {
        setGasPrice(formattedPrice);
      }
      
      return formattedPrice;
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return null;
    }
  }, [web3]);

  /**
   * Get current block number
   */
  const updateBlockNumber = useCallback(async () => {
    if (!web3) return null;

    try {
      const blockNum = await web3.eth.getBlockNumber();
      
      if (mounted.current) {
        setBlockNumber(blockNum);
      }
      
      return blockNum;
    } catch (error) {
      console.error('Failed to get block number:', error);
      return null;
    }
  }, [web3]);

  /**
   * Check if wallet is still connected
   */
  const checkConnection = useCallback(async () => {
    if (!web3) return false;

    try {
      const accounts = await web3.eth.getAccounts();
      const isStillConnected = accounts && accounts.length > 0;
      
      if (mounted.current) {
        if (!isStillConnected && isConnected) {
          // Connection lost
          disconnectWallet();
        } else if (isStillConnected && accounts[0] !== account) {
          // Account changed
          setAccount(accounts[0]);
          setAccounts(accounts);
          updateBalance(accounts[0]);
        }
      }
      
      return isStillConnected;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  }, [web3, isConnected, account, disconnectWallet, updateBalance]);

  /**
   * Auto-reconnect if previously connected
   */
  const autoReconnect = useCallback(async () => {
    if (!config.autoConnect) return;

    const wasConnected = localStorage.getItem('electra_wallet_connected') === 'true';
    const lastAccount = localStorage.getItem('electra_last_account');
    
    if (wasConnected && lastAccount && typeof window !== 'undefined' && window.ethereum) {
      try {
        // Check if the wallet is still accessible
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts && accounts.includes(lastAccount)) {
          await connectWallet();
        } else {
          // Clear stale connection data
          localStorage.removeItem('electra_wallet_connected');
          localStorage.removeItem('electra_last_account');
        }
      } catch (error) {
        console.warn('Auto-reconnect failed:', error);
        localStorage.removeItem('electra_wallet_connected');
        localStorage.removeItem('electra_last_account');
      }
    }
  }, [config.autoConnect, connectWallet]);

  /**
   * Utility functions
   */
  const utilities = useMemo(() => ({
    formatAddress: web3Utils.formatAddress,
    formatBalance: (balance) => `${parseFloat(balance).toFixed(4)} ${networkInfo?.currency || 'ETH'}`,
    formatGasPrice: web3Utils.formatGasPrice,
    isValidAddress: web3Utils.isValidAddress,
    toWei: (amount) => web3?.utils.toWei(amount, 'ether'),
    fromWei: (amount) => web3?.utils.fromWei(amount, 'ether'),
    getExplorerUrl: (hash, type = 'tx') => {
      if (!networkInfo?.explorerUrl) return null;
      return `${networkInfo.explorerUrl}/${type}/${hash}`;
    },
    copyToClipboard: web3Utils.copyToClipboard,
    generateAvatar: web3Utils.getAvatarColor
  }), [web3, networkInfo]);

  /**
   * Transaction helpers
   */
  const transactionHelpers = useMemo(() => ({
    estimateGas: async (transaction) => {
      if (!web3) throw new Error('Web3 not initialized');
      return await web3.eth.estimateGas(transaction);
    },
    
    sendTransaction: async (transaction) => {
      if (!web3 || !account) throw new Error('Wallet not connected');
      return await web3.eth.sendTransaction({ ...transaction, from: account });
    },
    
    getTransactionReceipt: async (hash) => {
      if (!web3) throw new Error('Web3 not initialized');
      return await web3.eth.getTransactionReceipt(hash);
    },
    
    waitForTransaction: async (hash, timeout = 60000) => {
      if (!web3) throw new Error('Web3 not initialized');
      
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        const receipt = await web3.eth.getTransactionReceipt(hash);
        if (receipt) return receipt;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      throw new Error('Transaction timeout');
    }
  }), [web3, account]);

  // Effects

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      disconnectWallet();
    };
  }, [disconnectWallet]);

  // Auto-reconnect on mount
  useEffect(() => {
    autoReconnect();
  }, [autoReconnect]);

  // Setup wallet event listeners
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          setAccounts(accounts);
          localStorage.setItem('electra_last_account', accounts[0]);
          updateBalance(accounts[0]);
          setLastActivity(Date.now());
        }
      };

      const handleChainChanged = (chainId) => {
        const newChainId = parseInt(chainId, 16);
        setChainId(newChainId);
        
        const networkData = NETWORKS[newChainId];
        setNetworkInfo(networkData);
        setIsWrongNetwork(!config.supportedChainIds.includes(newChainId));
        setIsNetworkSupported(!!networkData);
        
        // Reload the page to reset dapp state on network change
        if (isConnected) {
          window.location.reload();
        }
      };

      const handleConnect = (connectInfo) => {
        console.log('Wallet connected:', connectInfo);
        setLastActivity(Date.now());
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

      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('connect', handleConnect);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, [account, isConnected, disconnectWallet, updateBalance, config.supportedChainIds]);

  // Setup balance polling
  useEffect(() => {
    if (web3 && account && config.enableBalancePolling) {
      updateBalance();
      
      balanceTimer.current = setInterval(() => {
        if (mounted.current) {
          updateBalance();
        }
      }, config.balancePollingInterval);

      return () => {
        if (balanceTimer.current) {
          clearInterval(balanceTimer.current);
        }
      };
    }
  }, [web3, account, config.enableBalancePolling, config.balancePollingInterval, updateBalance]);

  // Setup gas price polling
  useEffect(() => {
    if (web3 && isConnected) {
      updateGasPrice();
      
      gasTimer.current = setInterval(() => {
        if (mounted.current) {
          updateGasPrice();
        }
      }, 60000); // Update every minute

      return () => {
        if (gasTimer.current) {
          clearInterval(gasTimer.current);
        }
      };
    }
  }, [web3, isConnected, updateGasPrice]);

  // Setup block number polling
  useEffect(() => {
    if (web3 && isConnected) {
      updateBlockNumber();
      
      blockTimer.current = setInterval(() => {
        if (mounted.current) {
          updateBlockNumber();
        }
      }, 15000); // Update every 15 seconds

      return () => {
        if (blockTimer.current) {
          clearInterval(blockTimer.current);
        }
      };
    }
  }, [web3, isConnected, updateBlockNumber]);

  // Periodic connection check
  useEffect(() => {
    if (isConnected) {
      const connectionCheckInterval = setInterval(() => {
        if (mounted.current) {
          checkConnection();
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(connectionCheckInterval);
    }
  }, [isConnected, checkConnection]);

  // Return comprehensive Web3 interface
  return {
    // Core Web3 state
    web3,
    account,
    accounts,
    chainId,
    balance,
    
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    walletType,
    
    // Network state
    networkInfo,
    isWrongNetwork,
    isNetworkSupported,
    
    // Advanced state
    gasPrice,
    blockNumber,
    lastActivity,
    
    // Connection methods
    connectWallet,
    disconnectWallet,
    switchNetwork,
    checkConnection,
    
    // Data methods
    updateBalance,
    updateGasPrice,
    updateBlockNumber,
    
    // Utilities
    utilities,
    transactionHelpers,
    
    // Network helpers
    get networkName() { return networkInfo?.name || 'Unknown Network'; },
    get networkCurrency() { return networkInfo?.currency || 'ETH'; },
    get explorerUrl() { return networkInfo?.explorerUrl; },
    get isTestnet() { return networkInfo?.isTestnet || false; },
    get isMainnet() { return !networkInfo?.isTestnet; },
    
    // Account helpers
    get formattedAddress() { return utilities.formatAddress(account); },
    get formattedBalance() { return utilities.formatBalance(balance); },
    get accountAvatar() { return utilities.generateAvatar(account); },
    
    // Status helpers
    get canTransact() { return isConnected && !isWrongNetwork && account; },
    get needsNetworkSwitch() { return isWrongNetwork; },
    get hasError() { return !!connectionError; },
    get isReady() { return isConnected && !isWrongNetwork && !connectionError; },
    
    // Convenience methods
    formatAddress: utilities.formatAddress,
    formatBalance: utilities.formatBalance,
    copyAddress: () => utilities.copyToClipboard(account),
    openInExplorer: (hash, type = 'tx') => {
      const url = utilities.getExplorerUrl(hash, type);
      if (url) window.open(url, '_blank');
    },
    
    // Configuration
    supportedNetworks: config.supportedChainIds.map(id => NETWORKS[id]).filter(Boolean),
    preferredNetwork: NETWORKS[config.preferredChainId],
    
    // Advanced features
    switchToPreferredNetwork: () => switchNetwork(config.preferredChainId),
    addToken: async (tokenAddress, tokenSymbol, tokenDecimals, tokenImage) => {
      if (!window.ethereum) throw new Error('Wallet not connected');
      
      return await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: tokenImage
          }
        }
      });
    },
    
    // Development helpers
    getDebugInfo: () => ({
      web3Available: !!web3,
      ethereumAvailable: !!window.ethereum,
      account,
      chainId,
      networkInfo,
      isConnected,
      balance,
      gasPrice,
      blockNumber,
      lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
      availableWallets: detectWallets(),
      supportedNetworks: config.supportedChainIds
    })
  };
};

/**
 * Hook for managing transaction state
 * @param {Object} options - Configuration options
 * @returns {Object} Transaction state and methods
 */
export const useTransaction = (options = {}) => {
  const { web3, account, isConnected, transactionHelpers } = useWeb3();
  
  const [transactionState, setTransactionState] = useState({
    hash: null,
    receipt: null,
    error: null,
    isLoading: false,
    isPending: false,
    isConfirmed: false,
    confirmations: 0
  });

  const config = {
    requiredConfirmations: 1,
    timeout: 120000, // 2 minutes
    ...options
  };

  const sendTransaction = useCallback(async (transaction) => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    setTransactionState({
      hash: null,
      receipt: null,
      error: null,
      isLoading: true,
      isPending: false,
      isConfirmed: false,
      confirmations: 0
    });

    try {
      // Send transaction
      const result = await transactionHelpers.sendTransaction(transaction);
      const hash = result.transactionHash || result;

      setTransactionState(prev => ({
        ...prev,
        hash,
        isLoading: false,
        isPending: true
      }));

      // Wait for confirmation
      const receipt = await transactionHelpers.waitForTransaction(hash, config.timeout);

      setTransactionState(prev => ({
        ...prev,
        receipt,
        isPending: false,
        isConfirmed: receipt.status === true,
        confirmations: receipt.status === true ? 1 : 0
      }));

      return receipt;
    } catch (error) {
      setTransactionState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
        isPending: false
      }));
      
      throw error;
    }
  }, [isConnected, account, transactionHelpers, config.timeout]);

  const reset = useCallback(() => {
    setTransactionState({
      hash: null,
      receipt: null,
      error: null,
      isLoading: false,
      isPending: false,
      isConfirmed: false,
      confirmations: 0
    });
  }, []);

  return {
    ...transactionState,
    sendTransaction,
    reset,
    explorerUrl: transactionState.hash ? 
      `${web3?.currentProvider?.explorerUrl || 'https://etherscan.io'}/tx/${transactionState.hash}` : 
      null
  };
};

/**
 * Hook for wallet detection and management
 * @returns {Object} Wallet detection state and methods
 */
export const useWalletDetection = () => {
  const [availableWallets, setAvailableWallets] = useState([]);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [recommendedAction, setRecommendedAction] = useState(null);

  useEffect(() => {
    const detectWallets = () => {
      const wallets = [];
      let hasMetaMask = false;

      if (typeof window !== 'undefined') {
        if (window.ethereum) {
          if (window.ethereum.isMetaMask) {
            wallets.push({
              name: WALLET_TYPES.METAMASK,
              detected: true,
              preferred: true,
              icon: '🦊',
              installUrl: 'https://metamask.io'
            });
            hasMetaMask = true;
          } else if (window.ethereum.isCoinbaseWallet) {
            wallets.push({
              name: WALLET_TYPES.COINBASE,
              detected: true,
              preferred: false,
              icon: '🔵',
              installUrl: 'https://wallet.coinbase.com'
            });
          } else if (window.ethereum.isTrust) {
            wallets.push({
              name: WALLET_TYPES.TRUST,
              detected: true,
              preferred: false,
              icon: '🛡️',
              installUrl: 'https://trustwallet.com'
            });
          } else {
            wallets.push({
              name: WALLET_TYPES.INJECTED,
              detected: true,
              preferred: false,
              icon: '💼',
              installUrl: null
            });
          }
        }

        if (!hasMetaMask) {
          wallets.push({
            name: WALLET_TYPES.METAMASK,
            detected: false,
            preferred: true,
            icon: '🦊',
            installUrl: 'https://metamask.io'
          });
        }
      }

      setAvailableWallets(wallets);
      setIsMetaMaskInstalled(hasMetaMask);
      
      // Set recommended action
      if (!hasMetaMask) {
        setRecommendedAction({
          type: 'install',
          message: 'Install MetaMask to get started',
          url: 'https://metamask.io'
        });
      } else {
        setRecommendedAction({
          type: 'connect',
          message: 'Connect your wallet to continue',
          url: null
        });
      }
    };

    detectWallets();

    // Re-detect when window.ethereum changes
    const interval = setInterval(detectWallets, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    availableWallets,
    isMetaMaskInstalled,
    recommendedAction,
    hasAnyWallet: availableWallets.some(w => w.detected),
    preferredWallet: availableWallets.find(w => w.preferred && w.detected)
  };
};

/**
 * Hook for ENS (Ethereum Name Service) resolution
 * @returns {Object} ENS resolution methods
 */
export const useENS = () => {
  const { web3 } = useWeb3();
  
  const resolveAddress = useCallback(async (ensName) => {
    if (!web3 || !ensName.endsWith('.eth')) return null;
    
    try {
      const address = await web3.eth.ens.getAddress(ensName);
      return address;
    } catch (error) {
      console.error('ENS resolution failed:', error);
      return null;
    }
  }, [web3]);

  const reverseLookup = useCallback(async (address) => {
    if (!web3 || !web3Utils.isValidAddress(address)) return null;
    
    try {
      const ensName = await web3.eth.ens.getName(address);
      return ensName;
    } catch (error) {
      console.error('ENS reverse lookup failed:', error);
      return null;
    }
  }, [web3]);

  return {
    resolveAddress,
    reverseLookup,
    isENSSupported: !!web3?.eth?.ens
  };
};

export default useWeb3;