import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3 } from './Web3Context';
import { getContract, contractInteraction } from '../utils/contractInteraction';

const ElectionContext = createContext();

export const useElection = () => {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection must be used within an ElectionProvider');
  }
  return context;
};

export const ElectionProvider = ({ children }) => {
  const { web3, account, isConnected } = useWeb3();
  
  // Election state
  const [contract, setContract] = useState(null);
  const [electionInfo, setElectionInfo] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voterInfo, setVoterInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [electionStats, setElectionStats] = useState(null);

  // Initialize contract when Web3 is available
  useEffect(() => {
    if (web3 && isConnected) {
      try {
        const contractInstance = getContract(web3);
        setContract(contractInstance);
      } catch (err) {
        console.error('Error initializing contract:', err);
        setError('Failed to initialize contract');
      }
    }
  }, [web3, isConnected]);

  // Load election data when contract is available
  useEffect(() => {
    if (contract && account) {
      loadElectionData();
      loadUserInfo();
    }
  }, [contract, account]);

  // Load all election data
  const loadElectionData = async () => {
    if (!contract) return;
    
    setIsLoading(true);
    try {
      // Load election info
      const info = await contractInteraction.getElectionInfo(contract);
      setElectionInfo(info);

      // Load candidates
      const candidatesList = await contractInteraction.getAllCandidates(contract);
      setCandidates(candidatesList);

      // Load election statistics
      const stats = await contractInteraction.getElectionStatistics(contract);
      setElectionStats(stats);

      setError(null);
    } catch (err) {
      console.error('Error loading election data:', err);
      setError('Failed to load election data');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user-specific information
  const loadUserInfo = async () => {
    if (!contract || !account) return;

    try {
      // Load voter info
      const voterData = await contractInteraction.getVoterInfo(contract, account);
      setVoterInfo(voterData);

      // Load user role
      const roleData = await contractInteraction.getUserRole(contract, account);
      setUserRole(roleData);
    } catch (err) {
      console.error('Error loading user info:', err);
      // Don't set error here as user might not be registered yet
    }
  };

  // Register a voter (admin function)
  const registerVoter = async (voterAddress = account) => {
    if (!contract || !account) throw new Error('Contract not initialized or wallet not connected');

    setIsLoading(true);
    try {
      const tx = await contractInteraction.registerVoter(contract, voterAddress, account);
      await loadElectionData();
      await loadUserInfo();
      return tx;
    } catch (err) {
      console.error('Error registering voter:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Self-register as voter
  const selfRegister = async () => {
    if (!contract || !account) throw new Error('Contract not initialized or wallet not connected');

    setIsLoading(true);
    try {
      const tx = await contractInteraction.selfRegister(contract, account);
      await loadElectionData();
      await loadUserInfo();
      return tx;
    } catch (err) {
      console.error('Error self-registering:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Cast a vote
  const castVote = async (candidateId) => {
    if (!contract || !account) throw new Error('Contract not initialized or wallet not connected');
    if (!candidateId || candidateId <= 0) throw new Error('Invalid candidate selection');

    setIsLoading(true);
    try {
      const tx = await contractInteraction.vote(contract, candidateId, account);
      await loadElectionData();
      await loadUserInfo();
      return tx;
    } catch (err) {
      console.error('Error casting vote:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Add a candidate (admin function)
  const addCandidate = async (name, party, manifesto) => {
    if (!contract || !account) throw new Error('Contract not initialized or wallet not connected');
    if (!name || !party) throw new Error('Name and party are required');

    setIsLoading(true);
    try {
      const tx = await contractInteraction.addCandidate(contract, name, party, manifesto, account);
      await loadElectionData();
      return tx;
    } catch (err) {
      console.error('Error adding candidate:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Start voting period (commissioner function)
  const startVoting = async () => {
    if (!contract || !account) throw new Error('Contract not initialized or wallet not connected');

    setIsLoading(true);
    try {
      const tx = await contractInteraction.startVoting(contract, account);
      await loadElectionData();
      return tx;
    } catch (err) {
      console.error('Error starting voting:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // End voting period (commissioner function)
  const endVoting = async () => {
    if (!contract || !account) throw new Error('Contract not initialized or wallet not connected');

    setIsLoading(true);
    try {
      const tx = await contractInteraction.endVoting(contract, account);
      await loadElectionData();
      return tx;
    } catch (err) {
      console.error('Error ending voting:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Finalize election (commissioner function)
  const finalizeElection = async () => {
    if (!contract || !account) throw new Error('Contract not initialized or wallet not connected');

    setIsLoading(true);
    try {
      const tx = await contractInteraction.finalizeElection(contract, account);
      await loadElectionData();
      return tx;
    } catch (err) {
      console.error('Error finalizing election:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get current winner
  const getCurrentWinner = async () => {
    if (!contract) return null;

    try {
      return await contractInteraction.getCurrentWinner(contract);
    } catch (err) {
      console.error('Error getting current winner:', err);
      return null;
    }
  };

  // Get election status
  const getElectionStatus = async () => {
    if (!contract) return null;

    try {
      return await contractInteraction.getElectionStatus(contract);
    } catch (err) {
      console.error('Error getting election status:', err);
      return null;
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await loadElectionData();
    if (account) {
      await loadUserInfo();
    }
  };

  // Helper functions for UI
  const isRegistered = voterInfo?.isRegistered || false;
  const hasVoted = voterInfo?.hasVoted || false;
  const isAdmin = userRole?.role === 'ADMIN' || userRole?.role === 'COMMISSIONER';
  const isCommissioner = userRole?.role === 'COMMISSIONER';
  const canVote = isRegistered && !hasVoted && electionInfo?.votingActive;
  const canRegister = electionInfo?.registrationActive && !isRegistered;

  // Format time remaining helper
  const formatTimeRemaining = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const now = Math.floor(Date.now() / 1000);
    const remaining = timestamp - now;
    
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const value = {
    // State
    contract,
    electionInfo,
    candidates,
    voterInfo,
    userRole,
    electionStats,
    isLoading,
    error,
    
    // Actions
    registerVoter,
    selfRegister,
    castVote,
    addCandidate,
    startVoting,
    endVoting,
    finalizeElection,
    getCurrentWinner,
    getElectionStatus,
    refreshData,
    
    // Helpers
    isRegistered,
    hasVoted,
    isAdmin,
    isCommissioner,
    canVote,
    canRegister,
    formatTimeRemaining,
    
    // Setters for manual state updates
    setError
  };

  return (
    <ElectionContext.Provider value={value}>
      {children}
    </ElectionContext.Provider>
  );
};
