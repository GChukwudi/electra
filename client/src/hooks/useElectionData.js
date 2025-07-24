import { useState, useEffect } from 'react';
import { useContract } from './useContract';

// Helper function to safely convert BigNumber or regular number to JavaScript number
const safeToNumber = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  if (value.toNumber && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
};

export const useElectionData = () => {
  const { contract: contractHook, account, isConnected, connectWallet } = useContract();
  
  // State for election data
  const [electionInfo, setElectionInfo] = useState(null);
  const [electionStatus, setElectionStatus] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voterInfo, setVoterInfo] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!contractHook || !isConnected) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      await Promise.all([
        loadElectionInfo(),
        loadElectionStatus(),
        loadCandidates(),
        loadVoterInfo(),
        loadUserRole()
      ]);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load election info
  const loadElectionInfo = async () => {
    if (!contractHook) return;
    
    try {
      const election = await contractHook.getElectionInfo();
      setElectionInfo({
        title: election.title,
        startTime: safeToNumber(election.startTime),
        endTime: safeToNumber(election.endTime),
        registrationDeadline: safeToNumber(election.registrationDeadline),
        isActive: election.isActive,
        isFinalized: election.isFinalized,
        totalVoters: safeToNumber(election.totalVotersCount),
        totalVotes: safeToNumber(election.totalVotes),
        winnerID: safeToNumber(election.winnerID)
      });
    } catch (error) {
      console.error('Error loading election info:', error);
    }
  };

  // Load election status
  const loadElectionStatus = async () => {
    if (!contractHook) return;
    
    try {
      const status = await contractHook.getElectionStatus();
      setElectionStatus({
        currentPhase: safeToNumber(status.currentPhase),
        timeUntilStart: safeToNumber(status.timeUntilStart),
        timeUntilEnd: safeToNumber(status.timeUntilEnd),
        timeUntilRegistrationEnd: safeToNumber(status.timeUntilRegistrationEnd)
      });
    } catch (error) {
      console.error('Error loading election status:', error);
    }
  };

  // Load candidates
  const loadCandidates = async () => {
    if (!contractHook) return;
    
    try {
      const totalCandidates = await contractHook.getTotalCandidates();
      const totalCount = safeToNumber(totalCandidates);
      
      const candidateList = [];
      for (let i = 1; i <= totalCount; i++) {
        try {
          const candidate = await contractHook.getCandidate(i);
          candidateList.push({
            id: i,
            name: candidate.name,
            party: candidate.party,
            voteCount: safeToNumber(candidate.voteCount),
            isActive: candidate.isActive
          });
        } catch (err) {
          console.error(`Error loading candidate ${i}:`, err);
        }
      }
      setCandidates(candidateList);
    } catch (error) {
      console.error('Error loading candidates:', error);
    }
  };

  // Load voter info
  const loadVoterInfo = async () => {
    if (!contractHook || !account) return;
    
    try {
      const voter = await contractHook.getVoter(account);
      setVoterInfo({
        isRegistered: voter.isRegistered,
        hasVoted: voter.hasVoted,
        candidateVoted: safeToNumber(voter.candidateVoted),
        registrationTime: safeToNumber(voter.registrationTime)
      });
    } catch (error) {
      console.error('Error loading voter info:', error);
    }
  };

  // Load user role
  const loadUserRole = async () => {
    if (!contractHook || !account) return;
    
    try {
      const role = await contractHook.getUserRole(account);
      setUserRole({
        isAdmin: role.isAdmin,
        isObserver: role.isObserver,
        assignedAt: safeToNumber(role.assignedAt),
        assignedBy: role.assignedBy
      });
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  // Contract functions
  const registerVoter = async () => {
    if (!contractHook) throw new Error('Contract not available');
    
    try {
      const tx = await contractHook.registerVoter();
      await tx.wait();
      await loadVoterInfo(); // Reload voter info
      return tx;
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  };

  const castVote = async (candidateId) => {
    if (!contractHook) throw new Error('Contract not available');
    
    try {
      const tx = await contractHook.vote(candidateId);
      await tx.wait();
      await Promise.all([loadVoterInfo(), loadCandidates()]); // Reload relevant data
      return tx;
    } catch (error) {
      throw new Error(`Voting failed: ${error.message}`);
    }
  };

  const addCandidate = async (name, party) => {
    if (!contractHook) throw new Error('Contract not available');
    
    try {
      const tx = await contractHook.addCandidate(name, party);
      await tx.wait();
      await loadCandidates(); // Reload candidates
      return tx;
    } catch (error) {
      throw new Error(`Adding candidate failed: ${error.message}`);
    }
  };

  const startElection = async () => {
    if (!contractHook) throw new Error('Contract not available');
    
    try {
      const tx = await contractHook.startElection();
      await tx.wait();
      await Promise.all([loadElectionInfo(), loadElectionStatus()]); // Reload election data
      return tx;
    } catch (error) {
      throw new Error(`Starting election failed: ${error.message}`);
    }
  };

  const endElection = async () => {
    if (!contractHook) throw new Error('Contract not available');
    
    try {
      const tx = await contractHook.endElection();
      await tx.wait();
      await Promise.all([loadElectionInfo(), loadElectionStatus()]); // Reload election data
      return tx;
    } catch (error) {
      throw new Error(`Ending election failed: ${error.message}`);
    }
  };

  const finalizeElection = async () => {
    if (!contractHook) throw new Error('Contract not available');
    
    try {
      const tx = await contractHook.finalizeElection();
      await tx.wait();
      await loadElectionInfo(); // Reload election info
      return tx;
    } catch (error) {
      throw new Error(`Finalizing election failed: ${error.message}`);
    }
  };

  // Load data when contract or account changes
  useEffect(() => {
    loadData();
  }, [contractHook, account, isConnected]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!contractHook || !isConnected) return;

    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [contractHook, isConnected]);

  // Helper functions for backward compatibility
  const isUserAdmin = () => {
    return userRole?.isAdmin || false;
  };

  const isUserObserver = () => {
    return userRole?.isObserver || false;
  };

  const isUserCommissioner = () => {
    return userRole?.isAdmin || false; // Assuming commissioner is same as admin
  };

  const isUserOwner = () => {
    return userRole?.isAdmin || false; // Assuming owner is same as admin
  };

  const isUserRegistered = () => {
    return voterInfo?.isRegistered || false;
  };

  const hasUserVoted = () => {
    return voterInfo?.hasVoted || false;
  };

  const canUserVote = () => {
    return isUserRegistered() && !hasUserVoted() && electionInfo?.isActive;
  };

  const getElectionPhase = () => {
    if (!electionStatus) return 'Unknown';
    
    const phase = electionStatus.currentPhase;
    const phases = ['Setup', 'Registration', 'Voting', 'Ended', 'Finalized'];
    return phases[phase] || 'Unknown';
  };

  return {
    // Data
    electionInfo,
    electionStatus,
    candidates,
    voterInfo,
    userRole,
    
    // Loading and error states
    loading,
    error,
    
    // Contract connection
    account,
    isConnected,
    connectWallet,
    
    // Actions
    registerVoter,
    castVote,
    addCandidate,
    startElection,
    endElection,
    finalizeElection,
    
    // Helper functions (backward compatibility)
    isUserAdmin,
    isUserObserver,
    isUserCommissioner,
    isUserOwner,
    isUserRegistered,
    hasUserVoted,
    canUserVote,
    getElectionPhase,
    
    // Utility
    refreshData: loadData
  };
};