/**
 * Results Page - Display election results and statistics
 * Complete results interface with real-time updates and detailed analytics
 */

import React, { useState, useEffect } from 'react';
import { useElection } from '../contexts/ElectionContext';
import { web3Utils } from '../utils/web3Utils';
import ResultsDisplay from '../components/ResultsDisplay';

const Results = () => {
  const { 
    electionInfo, 
    candidates, 
    electionStats,
    getCurrentWinner,
    isLoading 
  } = useElection();
  
  const [currentWinner, setCurrentWinner] = useState(null);
  const [sortedCandidates, setSortedCandidates] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Get current winner and sort candidates
  useEffect(() => {
    const fetchResults = async () => {
      if (candidates && candidates.length > 0) {
        // Sort candidates by vote count (descending)
        const sorted = [...candidates]
          .filter(candidate => candidate.isActive)
          .sort((a, b) => b.voteCount - a.voteCount);
        setSortedCandidates(sorted);

        // Get current winner if votes have been cast
        if (electionStats?.totalVotesCast > 0) {
          try {
            const winner = await getCurrentWinner();
            setCurrentWinner(winner);
          } catch (error) {
            console.error('Error fetching winner:', error);
          }
        }
      }
    };

    fetchResults();
  }, [candidates, electionStats, getCurrentWinner]);

  const refreshResults = async () => {
    setRefreshing(true);
    // The data will refresh automatically through the context
    setTimeout(() => setRefreshing(false), 1000);
  };

  const calculatePercentage = (votes, total) => {
    if (!total || total === 0) return 0;
    return ((votes / total) * 100).toFixed(1);
  };

  const getElectionPhase = () => {
    if (!electionInfo) return 'loading';
    
    const now = Math.floor(Date.now() / 1000);
    
    if (electionInfo.isFinalized) return 'finalized';
    if (now < electionInfo.startTime) return 'pending';
    if (now <= electionInfo.endTime) return 'active';
    return 'ended';
  };

  // Styles
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '3rem 0'
    },
    spinner: {
      width: '3rem',
      height: '3rem',
      border: '3px solid #e5e7eb',
      borderTop: '3px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 1rem'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem'
    },
    headerContent: {
      flex: 1
    },
    pageTitle: {
      fontSize: '1.875rem',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '0.5rem'
    },
    pageSubtitle: {
      color: '#4b5563'
    },
    refreshButton: {
      backgroundColor: '#2563eb',
      color: 'white',
      fontWeight: '500',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    refreshButtonDisabled: {
      backgroundColor: '#60a5fa',
      cursor: 'not-allowed'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      marginBottom: '2rem'
    },
    statusBanner: {
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '2rem'
    },
    statusTitle: {
      fontWeight: '600',
      marginBottom: '0.25rem'
    },
    statusText: {
      fontSize: '0.875rem'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      textAlign: 'center'
    },
    statValue: {
      fontSize: '1.875rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem'
    },
    statLabel: {
      color: '#4b5563'
    },
    winnerCard: {
      background: 'linear-gradient(135deg, #eff6ff 0%, #f3e8ff 100%)',
      border: '1px solid #c3ddfd',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      marginBottom: '2rem'
    },
    winnerTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '1rem'
    },
    tieCard: {
      backgroundColor: '#fefce8',
      border: '1px solid #fbbf24',
      borderRadius: '0.5rem',
      padding: '1.5rem'
    },
    winnerContent: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    winnerInfo: {
      flex: 1
    },
    winnerName: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#111827'
    },
    winnerParty: {
      fontSize: '1.125rem',
      color: '#2563eb',
      fontWeight: '500'
    },
    winnerPercentage: {
      fontSize: '0.875rem',
      color: '#4b5563',
      marginTop: '0.25rem'
    },
    winnerVotes: {
      textAlign: 'right'
    },
    winnerVoteCount: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#2563eb'
    },
    winnerVoteLabel: {
      fontSize: '0.875rem',
      color: '#4b5563'
    },
    noDataCard: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '2rem',
      textAlign: 'center'
    },
    noDataIcon: {
      fontSize: '4rem',
      marginBottom: '1rem'
    },
    noDataTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '0.5rem'
    },
    noDataText: {
      color: '#4b5563'
    },
    transparencyCard: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem'
    },
    transparencyTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '1rem'
    },
    transparencyGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem'
    },
    transparencySection: {
      marginBottom: '1rem'
    },
    transparencySectionTitle: {
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '0.75rem'
    },
    transparencyList: {
      fontSize: '0.875rem',
      color: '#4b5563'
    },
    transparencyListItem: {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '0.5rem'
    },
    transparencyIcon: {
      color: '#22c55e',
      marginRight: '0.5rem'
    },
    timelineItem: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0.5rem',
      fontSize: '0.875rem'
    },
    timelineLabel: {
      color: '#4b5563'
    },
    timelineValue: {
      fontWeight: '500'
    },
    finalizedBadge: {
      color: '#22c55e',
      fontWeight: '600'
    },
    noticeCard: {
      backgroundColor: '#eff6ff',
      border: '1px solid #c3ddfd',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginTop: '1.5rem'
    },
    noticeText: {
      fontSize: '0.875rem',
      color: '#1d4ed8'
    }
  };

  if (isLoading && !electionInfo) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#4b5563' }}>Loading election results...</p>
        </div>
      </div>
    );
  }

  if (!electionInfo) {
    return (
      <div style={styles.container}>
        <div style={styles.noDataCard}>
          <div style={styles.noDataIcon}>🚫</div>
          <h2 style={styles.noDataTitle}>No Election Data</h2>
          <p style={styles.noDataText}>
            No election information is available at this time.
          </p>
        </div>
      </div>
    );
  }

  const phase = getElectionPhase();

  // Phase-specific styling
  const getPhaseStyles = () => {
    const phaseStyles = {
      finalized: {
        bg: '#f0fdf4',
        border: '#bbf7d0',
        titleColor: '#166534',
        textColor: '#15803d'
      },
      active: {
        bg: '#eff6ff',
        border: '#c3ddfd',
        titleColor: '#1e40af',
        textColor: '#1d4ed8'
      },
      ended: {
        bg: '#fff7ed',
        border: '#fed7aa',
        titleColor: '#c2410c',
        textColor: '#ea580c'
      },
      pending: {
        bg: '#f9fafb',
        border: '#e5e7eb',
        titleColor: '#1f2937',
        textColor: '#374151'
      }
    };
    return phaseStyles[phase] || phaseStyles.pending;
  };

  const phaseStyles = getPhaseStyles();

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.pageTitle}>Election Results</h1>
          <p style={styles.pageSubtitle}>{electionInfo.title}</p>
        </div>
        
        <button
          onClick={refreshResults}
          disabled={refreshing}
          style={{
            ...styles.refreshButton,
            ...(refreshing ? styles.refreshButtonDisabled : {})
          }}
          onMouseOver={(e) => {
            if (!refreshing) {
              e.target.style.backgroundColor = '#1d4ed8';
            }
          }}
          onMouseOut={(e) => {
            if (!refreshing) {
              e.target.style.backgroundColor = '#2563eb';
            }
          }}
        >
          {refreshing ? (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '1rem',
                height: '1rem',
                border: '2px solid white',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '0.5rem'
              }}></div>
              Refreshing...
            </span>
          ) : (
            '🔄 Refresh Results'
          )}
        </button>
      </div>

      {/* Election Status Banner */}
      <div style={{
        ...styles.statusBanner,
        backgroundColor: phaseStyles.bg,
        border: `1px solid ${phaseStyles.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ ...styles.statusTitle, color: phaseStyles.titleColor }}>
              {phase === 'finalized' && '🏆 Election Complete - Final Results'}
              {phase === 'active' && '🗳️ Voting in Progress - Live Results'}
              {phase === 'ended' && '⏰ Voting Ended - Preliminary Results'}
              {phase === 'pending' && '⏳ Election Pending - No Results Yet'}
            </h3>
            <p style={{ ...styles.statusText, color: phaseStyles.textColor }}>
              {phase === 'finalized' && 'Results have been officially certified and finalized'}
              {phase === 'active' && 'Results update in real-time as votes are cast'}
              {phase === 'ended' && 'Voting has ended, awaiting final certification'}
              {phase === 'pending' && 'Voting has not yet begun'}
            </p>
          </div>
          
          {phase === 'active' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.875rem', color: phaseStyles.textColor }}>
                Ends: {web3Utils.formatTimeRemaining(electionInfo.endTime)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Winner Announcement */}
      {currentWinner && electionStats?.totalVotesCast > 0 && (
        <div style={styles.winnerCard}>
          <h2 style={styles.winnerTitle}>
            {phase === 'finalized' ? '🏆 Election Winner' : '📊 Current Leader'}
          </h2>
          
          {currentWinner.isTie ? (
            <div style={styles.tieCard}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🤝</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>
                  Tied Election
                </h3>
                <p style={{ color: '#a16207' }}>
                  Multiple candidates are currently tied with {currentWinner.maxVotes} votes each
                </p>
              </div>
            </div>
          ) : (
            <div style={styles.winnerContent}>
              <div style={styles.winnerInfo}>
                <h3 style={styles.winnerName}>{currentWinner.winnerName}</h3>
                <p style={styles.winnerParty}>{currentWinner.winnerParty}</p>
                <p style={styles.winnerPercentage}>
                  {calculatePercentage(currentWinner.maxVotes, electionStats.totalVotesCast)}% of votes
                </p>
              </div>
              
              <div style={styles.winnerVotes}>
                <div style={styles.winnerVoteCount}>{currentWinner.maxVotes}</div>
                <div style={styles.winnerVoteLabel}>votes</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Election Statistics */}
      {electionStats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#2563eb' }}>
              {electionStats.totalRegisteredVoters}
            </div>
            <div style={styles.statLabel}>Registered Voters</div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#16a34a' }}>
              {electionStats.totalVotesCast}
            </div>
            <div style={styles.statLabel}>Votes Cast</div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#7c3aed' }}>
              {electionStats.activeCandidates}
            </div>
            <div style={styles.statLabel}>Active Candidates</div>
          </div>
          
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: '#ea580c' }}>
              {electionStats.voterTurnoutPercentage}%
            </div>
            <div style={styles.statLabel}>Voter Turnout</div>
          </div>
        </div>
      )}

      {/* Detailed Results */}
      {sortedCandidates.length > 0 ? (
        <ResultsDisplay 
          candidates={sortedCandidates}
          totalVotes={electionStats?.totalVotesCast || 0}
          isFinalized={phase === 'finalized'}
        />
      ) : (
        <div style={styles.noDataCard}>
          <div style={styles.noDataIcon}>📊</div>
          <h3 style={styles.noDataTitle}>No Results Available</h3>
          <p style={styles.noDataText}>
            {phase === 'pending' 
              ? 'Voting has not yet begun.' 
              : 'No votes have been cast yet.'}
          </p>
        </div>
      )}

      {/* Transparency Information */}
      <div style={styles.transparencyCard}>
        <h3 style={styles.transparencyTitle}>🔍 Transparency & Verification</h3>
        
        <div style={styles.transparencyGrid}>
          <div>
            <div style={styles.transparencySection}>
              <h4 style={styles.transparencySectionTitle}>Blockchain Verification</h4>
              <ul style={styles.transparencyList}>
                <li style={styles.transparencyListItem}>
                  <span style={styles.transparencyIcon}>✓</span>
                  All votes are recorded on the blockchain
                </li>
                <li style={styles.transparencyListItem}>
                  <span style={styles.transparencyIcon}>✓</span>
                  Results are cryptographically verifiable
                </li>
                <li style={styles.transparencyListItem}>
                  <span style={styles.transparencyIcon}>✓</span>
                  No single party can manipulate results
                </li>
                <li style={styles.transparencyListItem}>
                  <span style={styles.transparencyIcon}>✓</span>
                  Complete audit trail available
                </li>
              </ul>
            </div>
          </div>
          
          <div>
            <div style={styles.transparencySection}>
              <h4 style={styles.transparencySectionTitle}>Election Timeline</h4>
              <div>
                <div style={styles.timelineItem}>
                  <span style={styles.timelineLabel}>Registration Deadline:</span>
                  <span style={styles.timelineValue}>
                    {web3Utils.formatTimestamp(electionInfo.registrationDeadline)}
                  </span>
                </div>
                <div style={styles.timelineItem}>
                  <span style={styles.timelineLabel}>Voting Period:</span>
                  <span style={styles.timelineValue}>
                    {web3Utils.formatTimestamp(electionInfo.startTime)} - {web3Utils.formatTimestamp(electionInfo.endTime)}
                  </span>
                </div>
                {phase === 'finalized' && (
                  <div style={styles.timelineItem}>
                    <span style={styles.timelineLabel}>Results Finalized:</span>
                    <span style={{ ...styles.timelineValue, ...styles.finalizedBadge }}>✓ Complete</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div style={styles.noticeCard}>
          <p style={styles.noticeText}>
            <strong>Note:</strong> All election data is stored permanently on the blockchain and can be 
            independently verified. This ensures complete transparency and prevents any form of result manipulation.
          </p>
        </div>
      </div>

      {/* Spinner animation keyframes */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Results;