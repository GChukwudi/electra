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

export const useElectionData = (contractHook, account) => {
  // Use the passed contract and account instead of useContract hook
  const contract = contractHook;
  const userAccount = account;
  
  // State for election data
  const [electionInfo, setElectionInfo] = useState(null);
  const [electionStatus, setElectionStatus] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voterInfo, setVoterInfo] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [currentWinner, setCurrentWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    if (!contract || !userAccount || !contract.isContractReady) {
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
        loadUserRole(),
        loadSystemInfo(),
        loadCurrentWinner()
      ]);

    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load election info
  const loadElectionInfo = async () => {
    if (!contract || !contract.isContractReady) return;
    
    try {
      const election = await contract.getElectionInfo();
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
    if (!contract || !contract.isContractReady) return;
    
    try {
      const status = await contract.getElectionStatus();
      setElectionStatus({
        registrationActive: status.registrationActive,
        votingActive: status.votingActive,
        timeUntilStart: safeToNumber(status.timeUntilStart),
        timeUntilEnd: safeToNumber(status.timeUntilEnd)
      });
    } catch (error) {
      console.error('Error loading election status:', error);
    }
  };

  // Load candidates
  const loadCandidates = async () => {
    if (!contract || !contract.isContractReady) return;
    
    try {
      const totalCandidates = await contract.getTotalCandidates();
      const totalCount = safeToNumber(totalCandidates);
      
      const candidateList = [];
      for (let i = 1; i <= totalCount; i++) {
        try {
          const candidate = await contract.getCandidateInfo(i);
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
    if (!contract || !contract.isContractReady || !userAccount) return;
    
    try {
      const voter = await contract.getVoterInfo(userAccount);
      setVoterInfo({
        isRegistered: voter.isRegistered,
        hasVoted: voter.hasVoted,
        candidateVoted: safeToNumber(voter.candidateVoted),
        voterID: safeToNumber(voter.voterID),
        registrationTime: safeToNumber(voter.registrationTime)
      });
    } catch (error) {
      console.error('Error loading voter info:', error);
    }
  };

  // Load user role
  const loadUserRole = async () => {
    if (!contract || !contract.isContractReady || !userAccount) return;
    
    try {
      const systemOwner = await contract.getSystemOwner();
      const isOwner = systemOwner.toLowerCase() === userAccount.toLowerCase();
     
      const user = await contract.getUserRole(userAccount);
      const currentRole = safeToNumber(user.role);
      
      // If user is owner but doesn't have admin role, try to set it
      if (isOwner && currentRole < 3) {
        try {
          const tx = await contract.setOwnerAsAdmin();
          await tx.wait();
          console.log('Owner role set successfully');
          // Reload user role after setting
          const updatedUser = await contract.getUserRole(userAccount);
          const updatedRole = safeToNumber(updatedUser.role);
          
          setUserRole({
            role: updatedRole,
            isAdmin: updatedRole >= 3,
            isCommissioner: updatedRole === 4,
            isObserver: updatedRole === 2,
            isOwner: isOwner,
            isActive: updatedUser.isActive,
            assignedAt: safeToNumber(updatedUser.assignedAt),
            assignedBy: updatedUser.assignedBy
          });
        } catch (e) {
          console.warn('Error setting owner role:', e.message);
          // Set role info even if we can't update it
          setUserRole({
            role: currentRole,
            isAdmin: currentRole >= 3 || isOwner,
            isCommissioner: currentRole === 4 || isOwner,
            isObserver: currentRole === 2,
            isOwner: isOwner,
            isActive: user.isActive,
            assignedAt: safeToNumber(user.assignedAt),
            assignedBy: user.assignedBy
          });
        }
      } else {
        setUserRole({
          role: currentRole,
          isAdmin: currentRole >= 3,
          isCommissioner: currentRole === 4,
          isObserver: currentRole === 2,
          isOwner: isOwner,
          isActive: user.isActive,
          assignedAt: safeToNumber(user.assignedAt),
          assignedBy: user.assignedBy
        });
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  // Load system info
  const loadSystemInfo = async () => {
    if (!contract || !contract.isContractReady) return;
    
    try {
      const paused = await contract.getSystemPaused();
      const registrationOpen = await contract.getRegistrationOpen();
      const votingOpen = await contract.getVotingOpen();
      
      setSystemInfo({
        paused: paused,
        registrationOpen: registrationOpen,
        votingOpen: votingOpen,
        version: '1.0.0',
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Error loading system info:', error);
      // Set default values to prevent errors
      setSystemInfo({
        paused: false,
        registrationOpen: false,
        votingOpen: false,
        version: '1.0.0',
        lastUpdated: Date.now()
      });
    }
  };

  // Load current winner
  const loadCurrentWinner = async () => {
    if (!contract || !contract.isContractReady) return;
    
    try {
      // First check if there are any candidates
      const totalCandidates = await contract.getTotalCandidates();
      const totalCount = safeToNumber(totalCandidates);
      
      if (totalCount === 0) {
        // No candidates yet, set winner to null
        setCurrentWinner(null);
        return;
      }
      
      const winner = await contract.getCurrentWinner();
      setCurrentWinner({
        winnerID: safeToNumber(winner.winnerID),
        winnerName: winner.winnerName,
        winnerParty: winner.winnerParty,
        maxVotes: safeToNumber(winner.maxVotes)
      });
    } catch (error) {
      console.error('Error loading current winner:', error);
      setCurrentWinner(null);
    }
  };

  // Contract functions
  const registerVoter = async () => {
    if (!contract) throw new Error('Contract not available');
    
    try {
      const tx = await contract.selfRegister();
      await tx.wait();
      await loadVoterInfo(); // Reload voter info
      return tx;
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  };

  const castVote = async (candidateId) => {
    if (!contract) throw new Error('Contract not available');
    
    try {
      const tx = await contract.vote(candidateId);
      await tx.wait();
      await Promise.all([loadVoterInfo(), loadCandidates(), loadCurrentWinner()]); // Reload relevant data
      return tx;
    } catch (error) {
      throw new Error(`Voting failed: ${error.message}`);
    }
  };

  const addCandidate = async (name, party) => {
    if (!contract) throw new Error('Contract not available');
    
    try {
      const tx = await contract.addCandidate(name, party);
      await tx.wait();
      await loadCandidates(); // Reload candidates
      return tx;
    } catch (error) {
      throw new Error(`Adding candidate failed: ${error.message}`);
    }
  };

  const startElection = async () => {
    if (!contract) throw new Error('Contract not available');
    
    try {
      const tx = await contract.startVoting();
      await tx.wait();
      await Promise.all([loadElectionInfo(), loadElectionStatus(), loadSystemInfo()]); // Reload election data
      return tx;
    } catch (error) {
      throw new Error(`Starting election failed: ${error.message}`);
    }
  };

  const endElection = async () => {
    if (!contract) throw new Error('Contract not available');
    
    try {
      const tx = await contract.endVoting();
      await tx.wait();
      await Promise.all([loadElectionInfo(), loadElectionStatus(), loadSystemInfo()]); // Reload election data
      return tx;
    } catch (error) {
      throw new Error(`Ending election failed: ${error.message}`);
    }
  };

  const finalizeElection = async () => {
    if (!contract) throw new Error('Contract not available');
    
    try {
      const tx = await contract.finalizeElection();
      await tx.wait();
      await Promise.all([loadElectionInfo(), loadCurrentWinner()]); // Reload election info
      return tx;
    } catch (error) {
      throw new Error(`Finalizing election failed: ${error.message}`);
    }
  };

  // Load data when contract or account changes
  useEffect(() => {
    if (contract && contract.isContractReady && userAccount) {
      loadData();
    }
  }, [contract, contract?.isContractReady, userAccount]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!contract || !contract.isContractReady || !userAccount) return;

    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => clearInterval(interval);
  }, [contract, contract?.isContractReady, userAccount]);

  // Helper functions for backward compatibility
  const isUserAdmin = () => {
    if (!userRole) return false;
    return userRole?.isAdmin || false;
  };

  const isUserObserver = () => {
    if (!userRole) return false;
    return userRole?.isObserver || false;
  };

  const isUserCommissioner = () => {
    if (!userRole) return false;
    return userRole?.isCommissioner || false;
  };

  const isUserOwner = () => {
    if (!userRole) return false;
    return userRole?.isOwner || false;
  };

  const isUserRegistered = () => {
    return voterInfo?.isRegistered || false;
  };

  const hasUserVoted = () => {
    return voterInfo?.hasVoted || false;
  };

  const canUserVote = () => {
    return isUserRegistered() && !hasUserVoted() && electionStatus?.votingActive;
  };

  const getElectionPhase = () => {
    if (!electionStatus || !electionInfo) return 'Unknown';
    
    if (electionInfo.isFinalized) return 'Finalized';
    if (electionStatus.votingActive) return 'Voting';
    if (electionStatus.registrationActive) return 'Registration';
    if (electionInfo.isActive) return 'Setup';
    return 'Inactive';
  };

  return {
    // Data
    electionInfo,
    electionStatus,
    candidates,
    voterInfo,
    userRole,
    systemInfo,
    currentWinner,
    
    // Loading and error states
    loading,
    error,
    
    // Contract connection
    account: userAccount,
    isConnected: !!contract && !!userAccount,
    connectWallet: null, // Not available in this version
    
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
    refreshData: loadData,
    clearError: () => setError(null)
  };
};