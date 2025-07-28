import { useState, useEffect, useCallback } from 'react';
import { getContract, getReadOnlyContract, parseContractError, estimateGas } from '../utils/web3.js';
import { GAS_LIMITS } from '../utils/constants.js';

export const useContract = (provider, account) => {
  const [contract, setContract] = useState(null);
  const [readOnlyContract, setReadOnlyContract] = useState(null);
  const [isContractReady, setIsContractReady] = useState(false);

  // Initialize contracts
  useEffect(() => {
    if (!provider) {
      setContract(null);
      setReadOnlyContract(null);
      setIsContractReady(false);
      return;
    }

    try {
      const contractInstance = getContract(provider);
      const readOnlyInstance = getReadOnlyContract(provider);
      
      setContract(contractInstance);
      setReadOnlyContract(readOnlyInstance);
      setIsContractReady(!!contractInstance && !!readOnlyInstance);
    } catch (error) {
      console.error('Error initializing contracts:', error);
      setContract(null);
      setReadOnlyContract(null);
      setIsContractReady(false);
    }
  }, [provider, account]);

  // Generic contract call function
  const callContract = useCallback(async (method, args = [], options = {}) => {
    if (!contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const { gasLimit, value } = options;
      
      const txOptions = {
        gasLimit: gasLimit || GAS_LIMITS[method.toUpperCase()] || 200000,
      };

      if (value) {
        txOptions.value = value;
      }

      const tx = await contract[method](...args, txOptions);
      return tx;
    } catch (error) {
      console.error(`Error calling ${method}:`, error);
      throw new Error(parseContractError(error));
    }
  }, [contract]);

  // Generic read-only contract call with better error handling
  const readContract = useCallback(async (method, args = []) => {
    const contractToUse = readOnlyContract || contract;
    
    if (!contractToUse) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await contractToUse[method](...args);
      return result;
    } catch (error) {
      console.error(`Error reading ${method}:`, error);
      
      // Handle specific contract revert cases
      if (error.message && error.message.includes('No candidates')) {
        throw new Error('NO_CANDIDATES');
      }
      if (error.message && error.message.includes('Invalid candidate')) {
        throw new Error('INVALID_CANDIDATE');
      }
      if (error.message && error.message.includes('No active election')) {
        throw new Error('NO_ACTIVE_ELECTION');
      }
      
      throw new Error(parseContractError(error));
    }
  }, [contract, readOnlyContract]);

  // Safe read function that doesn't throw for expected reverts
  const safeReadContract = useCallback(async (method, args = [], defaultValue = null) => {
    try {
      return await readContract(method, args);
    } catch (error) {
      // Log the error but return default value for expected contract reverts
      if (error.message === 'NO_CANDIDATES' || 
          error.message === 'INVALID_CANDIDATE' || 
          error.message === 'NO_ACTIVE_ELECTION') {
        console.warn(`Expected revert for ${method}:`, error.message);
        return defaultValue;
      }
      // Re-throw unexpected errors
      throw error;
    }
  }, [readContract]);

  // Self register voter
  const selfRegister = useCallback(async () => {
    return await callContract('selfRegister', [], { gasLimit: GAS_LIMITS.REGISTER });
  }, [callContract]);

  // Cast vote
  const vote = useCallback(async (candidateID) => {
    return await callContract('vote', [candidateID], { gasLimit: GAS_LIMITS.VOTE });
  }, [callContract]);

  // Add candidate (admin only)
  const addCandidate = useCallback(async (name, party) => {
    return await callContract('addCandidate', [name, party], { gasLimit: GAS_LIMITS.ADD_CANDIDATE });
  }, [callContract]);

  // Create election (commissioner only)
  const createElection = useCallback(async (title, registrationDeadline, startTime, endTime) => {
    return await callContract('createElection', [title, registrationDeadline, startTime, endTime], { 
      gasLimit: GAS_LIMITS.CREATE_ELECTION 
    });
  }, [callContract]);

  // Start voting (commissioner only)
  const startVoting = useCallback(async () => {
    return await callContract('startVoting');
  }, [callContract]);

  // End voting (commissioner only)
  const endVoting = useCallback(async () => {
    return await callContract('endVoting');
  }, [callContract]);

  // Finalize election (commissioner only)
  const finalizeElection = useCallback(async () => {
    return await callContract('finalizeElection');
  }, [callContract]);

  // Register voter (admin only)
  const registerVoter = useCallback(async (voterAddress) => {
    return await callContract('registerVoter', [voterAddress], { gasLimit: GAS_LIMITS.REGISTER });
  }, [callContract]);

  // Assign role (commissioner/owner only)
  const assignRole = useCallback(async (userAddress, role) => {
    return await callContract('assignRole', [userAddress, role]);
  }, [callContract]);

  // Revoke role (commissioner/owner only)
  const revokeRole = useCallback(async (userAddress) => {
    return await callContract('revokeRole', [userAddress]);
  }, [callContract]);

  // Pause/unpause system (commissioner/owner only)
  const pauseSystem = useCallback(async () => {
    return await callContract('pauseSystem');
  }, [callContract]);

  // Read functions
  const getElectionInfo = useCallback(async () => {
    return await readContract('getElectionInfo');
  }, [readContract]);

  const getElectionStatus = useCallback(async () => {
    return await readContract('getElectionStatus');
  }, [readContract]);

  const getCandidateInfo = useCallback(async (candidateID) => {
    return await readContract('getCandidateInfo', [candidateID]);
  }, [readContract]);

  const getVoterInfo = useCallback(async (address) => {
    return await readContract('getVoterInfo', [address]);
  }, [readContract]);

  // Safe getCurrentWinner that handles "No candidates" revert
  const getCurrentWinner = useCallback(async () => {
    return await safeReadContract('getCurrentWinner', [], null);
  }, [safeReadContract]);

  const getTotalCandidates = useCallback(async () => {
    return await readContract('totalCandidates');
  }, [readContract]);

  const getNextVoterID = useCallback(async () => {
    return await readContract('nextVoterID');
  }, [readContract]);

  const getUserRole = useCallback(async (address) => {
    return await readContract('users', [address]);
  }, [readContract]);

  const getSystemOwner = useCallback(async () => {
    return await readContract('systemOwner');
  }, [readContract]);

  const getCurrentCommissioner = useCallback(async () => {
    return await readContract('currentCommissioner');
  }, [readContract]);

  const getSystemPaused = useCallback(async () => {
    return await readContract('systemPaused');
  }, [readContract]);

  const getRegistrationOpen = useCallback(async () => {
    return await readContract('registrationOpen');
  }, [readContract]);

  const getVotingOpen = useCallback(async () => {
    return await readContract('votingOpen');
  }, [readContract]);

  // Set owner as admin (owner only)
  const setOwnerAsAdmin = useCallback(async () => {
    return await callContract('setOwnerAsAdmin');
  }, [callContract]);

  // Estimate gas for operations
  const estimateGasForOperation = useCallback(async (method, args = []) => {
    if (!contract) return null;
    
    try {
      return await estimateGas(contract, method, args);
    } catch (error) {
      console.error(`Error estimating gas for ${method}:`, error);
      return null;
    }
  }, [contract]);

  return {
    // Contract instances
    contract,
    readOnlyContract,
    isContractReady,

    // Write functions
    selfRegister,
    vote,
    addCandidate,
    createElection,
    startVoting,
    endVoting,
    finalizeElection,
    registerVoter,
    assignRole,
    revokeRole,
    pauseSystem,
    setOwnerAsAdmin,

    // Read functions
    getElectionInfo,
    getElectionStatus,
    getCandidateInfo,
    getVoterInfo,
    getCurrentWinner,
    getTotalCandidates,
    getNextVoterID,
    getUserRole,
    getSystemOwner,
    getCurrentCommissioner,
    getSystemPaused,
    getRegistrationOpen,
    getVotingOpen,

    // Utilities
    callContract,
    readContract,
    safeReadContract,
    estimateGasForOperation
  };
};