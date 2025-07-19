/**
 * useElection Hook - Comprehensive Election State Management
 * Provides complete election functionality with real-time updates
 * @author God's Favour Chukwudi
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useContract } from './useContract';
import { contractInteraction, advancedUtils } from '../utils/contractInteraction';
import { web3Utils } from '../utils/web3Utils';
import { security } from '../utils/security';

/**
 * Election management hook with real-time updates
 * @param {Object} options - Configuration options
 * @returns {Object} Election state and methods
 */
export const useElection = (options = {}) => {
  const { account, isConnected } = useWeb3();
  const { contract, isReady, contractError } = useContract();
  
  // Configuration
  const config = {
    enableRealTimeUpdates: true,
    autoRefreshInterval: 30000, // 30 seconds
    enableCaching: true,
    maxRetries: 3,
    ...options
  };

  // Core election state
  const [electionInfo, setElectionInfo] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [electionStats, setElectionStats] = useState(null);
  const [currentWinner, setCurrentWinner] = useState(null);
  
  // User-specific state
  const [voterInfo, setVoterInfo] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Real-time monitoring
  const [eventSubscriptions, setEventSubscriptions] = useState(null);
  const [realtimeEvents, setRealtimeEvents] = useState([]);
  
  // Refs for cleanup and state management
  const mounted = useRef(true);
  const refreshTimer = useRef(null);
  const retryCount = useRef(0);

  /**
   * Load all election data
   */
  const loadElectionData = useCallback(async (forceRefresh = false) => {
    if (!contract || !isReady) return;

    if (!forceRefresh && isLoading) return; // Prevent concurrent loads

    setIsLoading(true);
    setError(null);

    try {
      // Use batch operation for efficiency
      const data = await advancedUtils.getFullElectionData(contract);
      
      if (mounted.current) {
        setElectionInfo(data.electionInfo);
        setCandidates(data.candidates || []);
        setElectionStats(data.statistics);
        setCurrentWinner(data.winner);
        setLastUpdate(Date.now());
        setRefreshCount(prev => prev + 1);
        retryCount.current = 0; // Reset retry count on success
      }
    } catch (err) {
      console.error('Failed to load election data:', err);
      
      if (mounted.current) {
        setError(err.message);
        
        // Implement retry logic
        if (retryCount.current < config.maxRetries) {
          retryCount.current++;
          setTimeout(() => {
            if (mounted.current) {
              loadElectionData(forceRefresh);
            }
          }, 2000 * retryCount.current); // Exponential backoff
        }
      }
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  }, [contract, isReady, isLoading, config.maxRetries]);

  /**
   * Load user-specific data
   */
  const loadUserData = useCallback(async () => {
    if (!contract || !account || !isReady) return;

    try {
      const [voterData, roleData] = await Promise.all([
        contractInteraction.getVoterInfo(contract, account).catch(() => null),
        contractInteraction.getUserRole(contract, account).catch(() => null)
      ]);

      if (mounted.current) {
        setVoterInfo(voterData);
        setUserRole(roleData);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      // Don't set error for user data failures as user might not be registered
    }
  }, [contract, account, isReady]);

  /**
   * Setup real-time event monitoring
   */
  const setupEventMonitoring = useCallback(async () => {
    if (!contract || !config.enableRealTimeUpdates) return;

    try {
      const monitor = await advancedUtils.monitorElection(contract, {
        onVoteCast: (event) => {
          if (mounted.current) {
            setRealtimeEvents(prev => [...prev.slice(-9), { ...event, type: 'VOTE_CAST' }]);
            // Refresh data after vote
            setTimeout(() => loadElectionData(true), 1000);
          }
        },
        
        onVoterRegistered: (event) => {
          if (mounted.current) {
            setRealtimeEvents(prev => [...prev.slice(-9), { ...event, type: 'VOTER_REGISTERED' }]);
            // If it's the current user, refresh their data
            if (event.returnValues.voter.toLowerCase() === account?.toLowerCase()) {
              loadUserData();
            }
            // Refresh election stats
            setTimeout(() => loadElectionData(true), 1000);
          }
        },
        
        onCandidateAdded: (event) => {
          if (mounted.current) {
            setRealtimeEvents(prev => [...prev.slice(-9), { ...event, type: 'CANDIDATE_ADDED' }]);
            // Refresh candidates list
            setTimeout(() => loadElectionData(true), 1000);
          }
        },
        
        onElectionStarted: (event) => {
          if (mounted.current) {
            setRealtimeEvents(prev => [...prev.slice(-9), { ...event, type: 'ELECTION_STARTED' }]);
            loadElectionData(true);
          }
        },
        
        onElectionEnded: (event) => {
          if (mounted.current) {
            setRealtimeEvents(prev => [...prev.slice(-9), { ...event, type: 'ELECTION_ENDED' }]);
            loadElectionData(true);
          }
        }
      });

      if (mounted.current) {
        setEventSubscriptions(monitor);
      }

      return monitor;
    } catch (err) {
      console.error('Failed to setup event monitoring:', err);
    }
  }, [contract, config.enableRealTimeUpdates, account, loadElectionData, loadUserData]);

  /**
   * Vote for a candidate
   */
  const vote = useCallback(async (candidateId) => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    // Validate candidate ID
    const validation = security.validateInput.candidateId(candidateId);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Check if user can vote
    if (!voterInfo?.isRegistered) {
      throw new Error('You must be registered to vote');
    }

    if (voterInfo?.hasVoted) {
      throw new Error('You have already voted');
    }

    // Validate candidate exists and is active
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) {
      throw new Error('Candidate not found');
    }

    if (!candidate.isActive) {
      throw new Error('Candidate is not active');
    }

    try {
      const result = await contractInteraction.vote(contract, candidateId, account);
      
      // Refresh user data and election data after successful vote
      await Promise.all([
        loadUserData(),
        loadElectionData(true)
      ]);
      
      return result;
    } catch (error) {
      console.error('Voting failed:', error);
      throw error;
    }
  }, [contract, account, voterInfo, candidates, loadUserData, loadElectionData]);

  /**
   * Self-register as voter
   */
  const selfRegister = useCallback(async () => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    if (voterInfo?.isRegistered) {
      throw new Error('You are already registered');
    }

    try {
      const result = await contractInteraction.selfRegister(contract, account);
      
      // Refresh user data and election stats after registration
      await Promise.all([
        loadUserData(),
        loadElectionData(true)
      ]);
      
      return result;
    } catch (error) {
      console.error('Self-registration failed:', error);
      throw error;
    }
  }, [contract, account, voterInfo, loadUserData, loadElectionData]);

  /**
   * Register a voter (admin function)
   */
  const registerVoter = useCallback(async (voterAddress) => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    // Validate address
    const validation = security.validateInput.ethereumAddress(voterAddress);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const result = await contractInteraction.registerVoter(contract, validation.value, account);
      
      // Refresh election data after registration
      await loadElectionData(true);
      
      return result;
    } catch (error) {
      console.error('Voter registration failed:', error);
      throw error;
    }
  }, [contract, account, loadElectionData]);

  /**
   * Add a candidate (admin function)
   */
  const addCandidate = useCallback(async (name, party, manifesto) => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    // Validate inputs
    const nameValidation = security.validateInput.candidateName(name);
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error);
    }

    const partyValidation = security.validateInput.partyName(party);
    if (!partyValidation.isValid) {
      throw new Error(partyValidation.error);
    }

    const manifestoValidation = security.validateInput.manifesto(manifesto);
    if (!manifestoValidation.isValid) {
      throw new Error(manifestoValidation.error);
    }

    try {
      const result = await contractInteraction.addCandidate(
        contract,
        nameValidation.value,
        partyValidation.value,
        manifestoValidation.value,
        account
      );
      
      // Refresh candidates after adding
      await loadElectionData(true);
      
      return result;
    } catch (error) {
      console.error('Adding candidate failed:', error);
      throw error;
    }
  }, [contract, account, loadElectionData]);

  /**
   * Start voting period (commissioner function)
   */
  const startVoting = useCallback(async () => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const result = await contractInteraction.startVoting(contract, account);
      
      // Refresh election data after starting voting
      await loadElectionData(true);
      
      return result;
    } catch (error) {
      console.error('Starting voting failed:', error);
      throw error;
    }
  }, [contract, account, loadElectionData]);

  /**
   * End voting period (commissioner function)
   */
  const endVoting = useCallback(async () => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const result = await contractInteraction.endVoting(contract, account);
      
      // Refresh election data after ending voting
      await loadElectionData(true);
      
      return result;
    } catch (error) {
      console.error('Ending voting failed:', error);
      throw error;
    }
  }, [contract, account, loadElectionData]);

  /**
   * Finalize election (commissioner function)
   */
  const finalizeElection = useCallback(async () => {
    if (!contract || !account) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const result = await contractInteraction.finalizeElection(contract, account);
      
      // Refresh election data after finalizing
      await loadElectionData(true);
      
      return result;
    } catch (error) {
      console.error('Finalizing election failed:', error);
      throw error;
    }
  }, [contract, account, loadElectionData]);

  /**
   * Manual refresh function
   */
  const refreshElectionData = useCallback(async () => {
    await Promise.all([
      loadElectionData(true),
      loadUserData()
    ]);
  }, [loadElectionData, loadUserData]);

  /**
   * Get election phase
   */
  const electionPhase = useMemo(() => {
    if (!electionInfo) return 'setup';
    return web3Utils.getElectionPhase(electionInfo);
  }, [electionInfo]);

  /**
   * Permission helpers
   */
  const permissions = useMemo(() => {
    const isRegistered = voterInfo?.isRegistered || false;
    const hasVoted = voterInfo?.hasVoted || false;
    const isAdmin = userRole?.role === 'ADMIN' || userRole?.role === 'COMMISSIONER';
    const isCommissioner = userRole?.role === 'COMMISSIONER';
    
    const now = Math.floor(Date.now() / 1000);
    const canRegister = electionInfo && 
                       !isRegistered && 
                       now <= electionInfo.registrationDeadline &&
                       electionInfo.isActive;
    
    const canVote = electionInfo &&
                   isRegistered && 
                   !hasVoted && 
                   now >= electionInfo.startTime && 
                   now <= electionInfo.endTime && 
                   electionInfo.isActive &&
                   !electionInfo.isFinalized;

    return {
      isRegistered,
      hasVoted,
      isAdmin,
      isCommissioner,
      canRegister,
      canVote,
      canAddCandidates: isAdmin && electionPhase === 'setup',
      canStartVoting: isCommissioner && electionPhase === 'preparation',
      canEndVoting: isCommissioner && electionPhase === 'voting',
      canFinalize: isCommissioner && electionPhase === 'ended' && !electionInfo?.isFinalized
    };
  }, [voterInfo, userRole, electionInfo, electionPhase]);

  /**
   * Time-related helpers
   */
  const timeInfo = useMemo(() => {
    if (!electionInfo) return {};

    return {
      registrationTimeRemaining: web3Utils.getTimeRemaining(electionInfo.registrationDeadline),
      votingTimeRemaining: web3Utils.getTimeRemaining(electionInfo.endTime),
      timeUntilStart: web3Utils.getTimeRemaining(electionInfo.startTime),
      formatTimeRemaining: (timestamp) => web3Utils.formatTimeRemaining(timestamp),
      isRegistrationOpen: web3Utils.isInFuture(electionInfo.registrationDeadline),
      isVotingActive: electionPhase === 'voting'
    };
  }, [electionInfo, electionPhase]);

  /**
   * Statistics helpers
   */
  const statistics = useMemo(() => {
    if (!electionStats) return {};

    return {
      ...electionStats,
      turnoutRate: electionStats.voterTurnoutPercentage,
      votingProgress: electionStats.totalRegisteredVoters > 0 ? 
        (electionStats.totalVotesCast / electionStats.totalRegisteredVoters) * 100 : 0,
      averageVotesPerCandidate: electionStats.activeCandidates > 0 ? 
        electionStats.totalVotesCast / electionStats.activeCandidates : 0,
      remainingVoters: electionStats.totalRegisteredVoters - electionStats.totalVotesCast,
      isHighTurnout: electionStats.voterTurnoutPercentage > 70,
      isModerateTurnout: electionStats.voterTurnoutPercentage > 40 && electionStats.voterTurnoutPercentage <= 70,
      isLowTurnout: electionStats.voterTurnoutPercentage <= 40
    };
  }, [electionStats]);

  /**
   * Candidate helpers
   */
  const candidateHelpers = useMemo(() => {
    if (!candidates.length) return {};

    const sortedCandidates = [...candidates]
      .filter(c => c.isActive)
      .sort((a, b) => b.voteCount - a.voteCount);

    const totalVotes = sortedCandidates.reduce((sum, c) => sum + c.voteCount, 0);
    
    const candidatesWithPercentages = sortedCandidates.map((candidate, index) => ({
      ...candidate,
      position: index + 1,
      percentage: totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : 0,
      isLeading: index === 0 && candidate.voteCount > 0,
      isWinning: candidate.voteCount > 0 && candidate.voteCount > (sortedCandidates[1]?.voteCount || 0)
    }));

    return {
      sortedCandidates: candidatesWithPercentages,
      leadingCandidate: candidatesWithPercentages[0] || null,
      activeCandidatesCount: sortedCandidates.length,
      totalVotes,
      hasVotes: totalVotes > 0,
      isTied: sortedCandidates.length > 1 && 
              sortedCandidates[0]?.voteCount === sortedCandidates[1]?.voteCount &&
              sortedCandidates[0]?.voteCount > 0
    };
  }, [candidates]);

  // Effects

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
      if (eventSubscriptions?.stop) {
        eventSubscriptions.stop();
      }
    };
  }, [eventSubscriptions]);

  // Initialize data loading when contract is ready
  useEffect(() => {
    if (isReady && !contractError) {
      loadElectionData();
      if (account) {
        loadUserData();
      }
    }
  }, [isReady, contractError, loadElectionData, loadUserData, account]);

  // Setup event monitoring when contract is ready
  useEffect(() => {
    if (isReady && config.enableRealTimeUpdates) {
      setupEventMonitoring();
    }

    return () => {
      if (eventSubscriptions?.stop) {
        eventSubscriptions.stop();
      }
    };
  }, [isReady, config.enableRealTimeUpdates, setupEventMonitoring]);

  // Setup auto-refresh timer
  useEffect(() => {
    if (isReady && config.autoRefreshInterval > 0) {
      refreshTimer.current = setInterval(() => {
        if (mounted.current && !isLoading) {
          loadElectionData();
          if (account) {
            loadUserData();
          }
        }
      }, config.autoRefreshInterval);

      return () => {
        if (refreshTimer.current) {
          clearInterval(refreshTimer.current);
        }
      };
    }
  }, [isReady, config.autoRefreshInterval, isLoading, loadElectionData, loadUserData, account]);

  // Clear user data when account changes
  useEffect(() => {
    if (account) {
      loadUserData();
    } else {
      setVoterInfo(null);
      setUserRole(null);
    }
  }, [account, loadUserData]);

  // Return comprehensive election interface
  return {
    // Core data
    electionInfo,
    candidates,
    electionStats,
    currentWinner,
    
    // User data
    voterInfo,
    userRole,
    
    // UI state
    isLoading,
    error,
    lastUpdate,
    refreshCount,
    
    // Real-time data
    realtimeEvents,
    
    // Actions
    vote,
    selfRegister,
    registerVoter,
    addCandidate,
    startVoting,
    endVoting,
    finalizeElection,
    refreshElectionData,
    
    // Helpers and computed values
    permissions,
    timeInfo,
    statistics,
    candidateHelpers,
    electionPhase,
    
    // Status indicators
    isReady: isReady && !contractError,
    hasElection: !!electionInfo,
    hasError: !!error || !!contractError,
    isConnected,
    
    // Convenience getters
    get isRegistered() { return permissions.isRegistered; },
    get hasVoted() { return permissions.hasVoted; },
    get canVote() { return permissions.canVote; },
    get canRegister() { return permissions.canRegister; },
    get isAdmin() { return permissions.isAdmin; },
    get isCommissioner() { return permissions.isCommissioner; },
    get totalVotes() { return electionStats?.totalVotesCast || 0; },
    get totalVoters() { return electionStats?.totalRegisteredVoters || 0; },
    get turnoutPercentage() { return electionStats?.voterTurnoutPercentage || 0; },
    
    // Utility functions
    formatTimeRemaining: timeInfo.formatTimeRemaining,
    setError, // Allow manual error setting
    clearError: () => setError(null),
    
    // Advanced features
    exportElectionData: useCallback(async (options = {}) => {
      if (!contract) throw new Error('Contract not available');
      return await advancedUtils.exportElectionData(contract, {
        exportedBy: account,
        ...options
      });
    }, [contract, account]),
    
    validateElectionIntegrity: useCallback(async () => {
      if (!contract) throw new Error('Contract not available');
      return await advancedUtils.validateElectionIntegrity(contract);
    }, [contract])
  };
};

/**
 * Hook for monitoring specific election events
 * @param {Array} eventTypes - Types of events to monitor
 * @param {Function} onEvent - Callback for when events occur
 * @returns {Object} Event monitoring state
 */
export const useElectionEvents = (eventTypes = [], onEvent = null) => {
  const { contract, isReady } = useContract();
  const [events, setEvents] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const subscriptionsRef = useRef([]);

  const startMonitoring = useCallback(async () => {
    if (!contract || !isReady || eventTypes.length === 0) return;

    setIsMonitoring(true);
    const subscriptions = [];

    try {
      for (const eventType of eventTypes) {
        const subscription = contractInteraction.subscribeToEvents(
          contract,
          eventType,
          (event) => {
            const eventData = {
              ...event,
              type: eventType,
              timestamp: Date.now()
            };
            
            setEvents(prev => [...prev.slice(-49), eventData]); // Keep last 50 events
            
            if (onEvent) {
              onEvent(eventData);
            }
          }
        );
        
        subscriptions.push(subscription);
      }
      
      subscriptionsRef.current = subscriptions;
    } catch (error) {
      console.error('Failed to start event monitoring:', error);
      setIsMonitoring(false);
    }
  }, [contract, isReady, eventTypes, onEvent]);

  const stopMonitoring = useCallback(() => {
    subscriptionsRef.current.forEach(subscription => {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    });
    subscriptionsRef.current = [];
    setIsMonitoring(false);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Auto-start monitoring when ready
  useEffect(() => {
    if (isReady) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isReady, startMonitoring, stopMonitoring]);

  return {
    events,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearEvents,
    eventCount: events.length,
    latestEvent: events[events.length - 1] || null
  };
};

/**
 * Hook for election time management
 * @param {Object} electionInfo - Election information
 * @returns {Object} Time-related state and helpers
 */
export const useElectionTimer = (electionInfo) => {
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const [timeToEvents, setTimeToEvents] = useState({});

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      setCurrentTime(now);
      
      if (electionInfo) {
        setTimeToEvents({
          registrationDeadline: Math.max(0, electionInfo.registrationDeadline - now),
          votingStart: Math.max(0, electionInfo.startTime - now),
          votingEnd: Math.max(0, electionInfo.endTime - now)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [electionInfo]);

  const formatCountdown = useCallback((seconds) => {
    if (seconds <= 0) return 'Ended';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }, []);

  return {
    currentTime,
    timeToEvents,
    formatCountdown,
    
    // Convenience getters
    get registrationCountdown() {
      return formatCountdown(timeToEvents.registrationDeadline || 0);
    },
    get votingStartCountdown() {
      return formatCountdown(timeToEvents.votingStart || 0);
    },
    get votingEndCountdown() {
      return formatCountdown(timeToEvents.votingEnd || 0);
    },
    
    // Status checks
    get isRegistrationOpen() {
      return (timeToEvents.registrationDeadline || 0) > 0;
    },
    get isVotingPeriod() {
      return (timeToEvents.votingStart || 0) <= 0 && (timeToEvents.votingEnd || 0) > 0;
    },
    get isElectionEnded() {
      return (timeToEvents.votingEnd || 0) <= 0;
    }
  };
};

export default useElection;