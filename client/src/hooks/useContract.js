/**
 * useContract Hook - Contract Management and Interaction
 * Provides a clean interface for managing contract connections and basic operations
 * @author God's Favour Chukwudi
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { contractInteraction, getContract, validateContract } from '../utils/contractInteraction';
import { web3Utils } from '../utils/web3Utils';

/**
 * Contract management hook
 * @param {Object} options - Configuration options
 * @returns {Object} Contract state and methods
 */
export const useContract = (options = {}) => {
  const { web3, account, isConnected } = useWeb3();
  
  // State
  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);
  const [isContractLoaded, setIsContractLoaded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [contractError, setContractError] = useState(null);
  const [gasPrice, setGasPrice] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('disconnected');
  
  // Refs for cleanup
  const mounted = useRef(true);
  const validationCache = useRef(new Map());
  
  // Configuration
  const config = {
    autoValidate: true,
    validateOnMount: true,
    cacheValidation: true,
    ...options
  };

  /**
   * Initialize contract connection
   */
  const initializeContract = useCallback(async (customAddress = null) => {
    if (!web3 || !isConnected) {
      setNetworkStatus('disconnected');
      return null;
    }

    setIsValidating(true);
    setContractError(null);

    try {
      const result = await contractInteraction.initialize(web3, customAddress);
      
      if (mounted.current) {
        setContract(result.contract);
        setContractAddress(result.address);
        setIsContractLoaded(true);
        setNetworkStatus('connected');
        
        // Cache validation result
        if (config.cacheValidation) {
          validationCache.current.set(result.address, {
            isValid: true,
            timestamp: Date.now()
          });
        }
      }
      
      return result.contract;
    } catch (error) {
      if (mounted.current) {
        setContractError(error.message);
        setIsContractLoaded(false);
        setNetworkStatus('error');
      }
      console.error('Contract initialization failed:', error);
      return null;
    } finally {
      if (mounted.current) {
        setIsValidating(false);
      }
    }
  }, [web3, isConnected, config.cacheValidation]);

  /**
   * Validate contract integrity
   */
  const validateContractIntegrity = useCallback(async (address = contractAddress) => {
    if (!web3 || !address) return false;

    // Check cache first
    if (config.cacheValidation) {
      const cached = validationCache.current.get(address);
      if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
        return cached.isValid;
      }
    }

    try {
      const validation = await validateContract(web3, address);
      
      // Cache result
      if (config.cacheValidation) {
        validationCache.current.set(address, {
          isValid: validation.isValid,
          timestamp: Date.now()
        });
      }
      
      return validation.isValid;
    } catch (error) {
      console.error('Contract validation failed:', error);
      return false;
    }
  }, [web3, contractAddress, config.cacheValidation]);

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
   * Execute a contract method with error handling
   */
  const executeMethod = useCallback(async (methodName, params = [], options = {}) => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const result = await contractInteraction[methodName](contract, ...params, account);
      return result;
    } catch (error) {
      console.error(`Error executing ${methodName}:`, error);
      throw error;
    }
  }, [contract, account]);

  /**
   * Call a view method (read-only)
   */
  const callMethod = useCallback(async (methodName, params = []) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await contractInteraction[methodName](contract, ...params);
      return result;
    } catch (error) {
      console.error(`Error calling ${methodName}:`, error);
      throw error;
    }
  }, [contract]);

  /**
   * Estimate gas for a transaction
   */
  const estimateGas = useCallback(async (methodName, params = []) => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      if (!contract.methods[methodName]) {
        throw new Error(`Method ${methodName} not found on contract`);
      }

      const gasEstimate = await contract.methods[methodName](...params)
        .estimateGas({ from: account });
      
      return {
        gasEstimate: parseInt(gasEstimate),
        gasEstimateWithBuffer: Math.floor(parseInt(gasEstimate) * 1.2),
        estimatedCost: gasPrice ? `${parseInt(gasEstimate) * parseInt(gasPrice.replace(/[^\d]/g, ''))} wei` : 'Unknown'
      };
    } catch (error) {
      console.error(`Gas estimation failed for ${methodName}:`, error);
      throw error;
    }
  }, [contract, account, gasPrice]);

  /**
   * Switch to a different contract address
   */
  const switchContract = useCallback(async (newAddress) => {
    if (!web3Utils.isValidAddress(newAddress)) {
      throw new Error('Invalid contract address');
    }

    try {
      setIsValidating(true);
      const newContract = await initializeContract(newAddress);
      
      if (newContract) {
        setContractAddress(newAddress);
        localStorage.setItem('electra_contract_address', newAddress);
      }
      
      return newContract;
    } catch (error) {
      console.error('Failed to switch contract:', error);
      throw error;
    } finally {
      setIsValidating(false);
    }
  }, [initializeContract]);

  /**
   * Get contract information
   */
  const getContractInfo = useCallback(async () => {
    if (!web3 || !contractAddress) return null;

    try {
      const code = await web3.eth.getCode(contractAddress);
      const isDeployed = code !== '0x';
      
      return {
        address: contractAddress,
        isDeployed,
        codeSize: code.length,
        gasPrice: gasPrice,
        networkStatus: networkStatus,
        isValid: isContractLoaded
      };
    } catch (error) {
      console.error('Failed to get contract info:', error);
      return null;
    }
  }, [web3, contractAddress, gasPrice, networkStatus, isContractLoaded]);

  /**
   * Reset contract state
   */
  const resetContract = useCallback(() => {
    setContract(null);
    setContractAddress(null);
    setIsContractLoaded(false);
    setContractError(null);
    setNetworkStatus('disconnected');
    validationCache.current.clear();
  }, []);

  // Effects
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Initialize contract when web3 is available
  useEffect(() => {
    if (web3 && isConnected && config.validateOnMount) {
      initializeContract();
    } else if (!isConnected) {
      resetContract();
    }
  }, [web3, isConnected, initializeContract, resetContract, config.validateOnMount]);

  // Update gas price periodically
  useEffect(() => {
    if (web3 && isConnected) {
      updateGasPrice();
      
      const interval = setInterval(updateGasPrice, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [web3, isConnected, updateGasPrice]);

  // Auto-validate contract periodically
  useEffect(() => {
    if (contract && config.autoValidate) {
      const interval = setInterval(async () => {
        const isValid = await validateContractIntegrity();
        if (!isValid && mounted.current) {
          setContractError('Contract validation failed');
          setNetworkStatus('error');
        }
      }, 300000); // Validate every 5 minutes
      
      return () => clearInterval(interval);
    }
  }, [contract, config.autoValidate, validateContractIntegrity]);

  // Return hook interface
  return {
    // State
    contract,
    contractAddress,
    isContractLoaded,
    isValidating,
    contractError,
    gasPrice,
    networkStatus,
    
    // Methods
    initializeContract,
    validateContractIntegrity,
    executeMethod,
    callMethod,
    estimateGas,
    switchContract,
    getContractInfo,
    resetContract,
    updateGasPrice,
    
    // Utilities
    isReady: isContractLoaded && !contractError,
    canExecute: isContractLoaded && !contractError && account,
    
    // Status helpers
    isConnected: networkStatus === 'connected',
    hasError: !!contractError,
    isLoading: isValidating
  };
};

/**
 * Hook for specific contract method execution
 * @param {string} methodName - Name of the contract method
 * @param {Object} options - Configuration options
 * @returns {Object} Method execution state and function
 */
export const useContractMethod = (methodName, options = {}) => {
  const { contract, account, executeMethod, callMethod, isReady } = useContract();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [lastExecuted, setLastExecuted] = useState(null);
  
  const config = {
    isWrite: true, // Whether this is a write operation
    autoReset: true, // Reset state on new execution
    ...options
  };

  const execute = useCallback(async (...params) => {
    if (!isReady) {
      throw new Error('Contract not ready');
    }

    if (config.autoReset) {
      setError(null);
      setResult(null);
    }

    setIsExecuting(true);

    try {
      const methodResult = config.isWrite 
        ? await executeMethod(methodName, params)
        : await callMethod(methodName, params);
      
      setResult(methodResult);
      setLastExecuted(Date.now());
      
      return methodResult;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, [isReady, executeMethod, callMethod, methodName, config.isWrite, config.autoReset]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setIsExecuting(false);
    setLastExecuted(null);
  }, []);

  return {
    execute,
    reset,
    isExecuting,
    result,
    error,
    lastExecuted,
    canExecute: isReady && !isExecuting
  };
};

/**
 * Hook for batch contract operations
 * @param {Array} methods - Array of method configurations
 * @returns {Object} Batch execution state and function
 */
export const useContractBatch = (methods = []) => {
  const { contract, callMethod, isReady } = useContract();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0);

  const executeBatch = useCallback(async () => {
    if (!isReady || methods.length === 0) {
      throw new Error('Contract not ready or no methods specified');
    }

    setIsExecuting(true);
    setProgress(0);
    setResults({});
    setErrors({});

    const batchResults = {};
    const batchErrors = {};

    try {
      for (let i = 0; i < methods.length; i++) {
        const method = methods[i];
        const { name, params = [], key = name } = method;

        try {
          const result = await callMethod(name, params);
          batchResults[key] = result;
        } catch (error) {
          batchErrors[key] = error.message;
        }

        setProgress(((i + 1) / methods.length) * 100);
      }

      setResults(batchResults);
      setErrors(batchErrors);

      return { results: batchResults, errors: batchErrors };
    } catch (error) {
      console.error('Batch execution failed:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, [isReady, methods, callMethod]);

  return {
    executeBatch,
    isExecuting,
    results,
    errors,
    progress,
    canExecute: isReady && !isExecuting,
    hasResults: Object.keys(results).length > 0,
    hasErrors: Object.keys(errors).length > 0
  };
};

export default useContract;