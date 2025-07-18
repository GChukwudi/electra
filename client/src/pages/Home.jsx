/**
 * Home Page - Landing page for Electra voting system
 * Main dashboard showing election overview and status
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useElection } from '../contexts/ElectionContext';
import { web3Utils } from '../utils/web3Utils';

const Home = () => {
  const { account, isConnected, connectWallet, networkName } = useWeb3();
  const { 
    electionInfo, 
    candidates, 
    electionStats, 
    isRegistered, 
    hasVoted, 
    canVote, 
    canRegister,
    formatTimeRemaining,
    getCurrentWinner,
    isLoading 
  } = useElection();
  
  const [currentWinner, setCurrentWinner] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState({});

  // Update time remaining every minute
  useEffect(() => {
    const updateTimes = () => {
      if (electionInfo) {
        setTimeRemaining({
          registration: web3Utils.getTimeRemaining(electionInfo.registrationDeadline),
          voting: web3Utils.getTimeRemaining(electionInfo.endTime)
        });
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [electionInfo]);

  // Get current winner
  useEffect(() => {
    const fetchWinner = async () => {
      if (electionInfo && electionStats?.totalVotesCast > 0) {
        try {
          const winner = await getCurrentWinner();
          setCurrentWinner(winner);
        } catch (error) {
          console.error('Error fetching winner:', error);
        }
      }
    };

    fetchWinner();
  }, [electionInfo, electionStats, getCurrentWinner]);

  const getElectionPhase = () => {
    if (!electionInfo) return 'setup';
    
    const now = Math.floor(Date.now() / 1000);
    
    if (now < electionInfo.registrationDeadline) return 'registration';
    if (now < electionInfo.startTime) return 'preparation';
    if (now < electionInfo.endTime && !electionInfo.isFinalized) return 'voting';
    if (electionInfo.isFinalized) return 'completed';
    return 'ended';
  };

  const getPhaseInfo = (phase) => {
    const phases = {
      setup: {
        title: 'Election Setup',
        description: 'Election is being configured',
        color: { bg: '#f3f4f6', text: '#1f2937' },
        icon: '⚙️'
      },
      registration: {
        title: 'Voter Registration Open',
        description: 'Citizens can register to vote',
        color: { bg: '#eff6ff', text: '#1e40af' },
        icon: '📝'
      },
      preparation: {
        title: 'Preparation Phase',
        description: 'Registration closed, preparing for voting',
        color: { bg: '#fefce8', text: '#a16207' },
        icon: '⏳'
      },
      voting: {
        title: 'Voting in Progress',
        description: 'Election is live, votes being cast',
        color: { bg: '#f0fdf4', text: '#166534' },
        icon: '🗳️'
      },
      ended: {
        title: 'Voting Ended',
        description: 'Voting period has concluded',
        color: { bg: '#fff7ed', text: '#c2410c' },
        icon: '⏰'
      },
      completed: {
        title: 'Election Complete',
        description: 'Results have been finalized',
        color: { bg: '#faf5ff', text: '#7c2d12' },
        icon: '🏆'
      }
    };
    
    return phases[phase] || phases.setup;
  };

  const currentPhase = getElectionPhase();
  const phaseInfo = getPhaseInfo(currentPhase);

  // Styles
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh'
    },
    loadingContent: {
      textAlign: 'center'
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
    heroSection: {
      textAlign: 'center',
      marginBottom: '3rem'
    },
    heroTitle: {
      fontSize: '2.25rem',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '1rem'
    },
    heroSubtitle: {
      fontSize: '1.25rem',
      color: '#4b5563',
      marginBottom: '2rem'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      marginBottom: '2rem'
    },
    walletCard: {
      backgroundColor: '#fef3c7',
      border: '1px solid #fbbf24',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      marginBottom: '2rem'
    },
    connectedCard: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #22c55e',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '2rem'
    },
    button: {
      backgroundColor: '#2563eb',
      color: 'white',
      fontWeight: '500',
      padding: '0.5rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    phaseStatus: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '1.5rem'
    },
    phaseBadge: {
      padding: '0.5rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.875rem',
      fontWeight: '500',
      backgroundColor: phaseInfo.color.bg,
      color: phaseInfo.color.text
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    statCard: {
      backgroundColor: '#f9fafb',
      padding: '1rem',
      borderRadius: '0.5rem'
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#2563eb'
    },
    statLabel: {
      fontSize: '0.875rem',
      color: '#4b5563'
    },
    timeline: {
      borderTop: '1px solid #e5e7eb',
      paddingTop: '1.5rem'
    },
    timelineItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem'
    },
    actionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    },
    actionCard: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      borderLeft: '4px solid'
    },
    actionButton: {
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '500',
      textDecoration: 'none',
      display: 'inline-block',
      transition: 'background-color 0.2s ease'
    },
    candidatesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1rem'
    },
    candidateCard: {
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1rem'
    },
    aboutGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem'
    },
    aboutItem: {
      textAlign: 'center'
    },
    aboutIcon: {
      fontSize: '3rem',
      marginBottom: '0.5rem'
    },
    aboutTitle: {
      fontWeight: '600',
      color: '#111827',
      marginBottom: '0.5rem'
    },
    aboutDescription: {
      fontSize: '0.875rem',
      color: '#4b5563'
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingContent}>
            <div style={styles.spinner}></div>
            <p style={{ color: '#4b5563' }}>Loading election data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <div style={styles.heroSection}>
        <h1 style={styles.heroTitle}>
          Welcome to Electra
        </h1>
        <p style={styles.heroSubtitle}>
          Secure, Transparent, Democratic - Blockchain-powered voting for the future
        </p>
        
        {!isConnected ? (
          <div style={styles.walletCard}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>
              Connect Your Wallet to Participate
            </h3>
            <p style={{ color: '#a16207', marginBottom: '1rem' }}>
              You need to connect your MetaMask wallet to register and vote in elections.
            </p>
            <button
              onClick={connectWallet}
              style={{
                ...styles.button,
                backgroundColor: '#ca8a04',
                ':hover': { backgroundColor: '#a16207' }
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#a16207'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ca8a04'}
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div style={styles.connectedCard}>
            <p style={{ color: '#166534' }}>
              ✅ Wallet Connected: {web3Utils.formatAddress(account)} ({networkName})
            </p>
          </div>
        )}
      </div>

      {/* Election Status */}
      {electionInfo && (
        <div style={styles.card}>
          <div style={styles.phaseStatus}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              {electionInfo.title}
            </h2>
            <span style={styles.phaseBadge}>
              {phaseInfo.icon} {phaseInfo.title}
            </span>
          </div>
          
          <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>{electionInfo.description}</p>
          
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h4 style={{ fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Registered Voters</h4>
              <p style={styles.statValue}>
                {electionStats?.totalRegisteredVoters || 0}
              </p>
            </div>
            
            <div style={styles.statCard}>
              <h4 style={{ fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Votes Cast</h4>
              <p style={{ ...styles.statValue, color: '#16a34a' }}>
                {electionStats?.totalVotesCast || 0}
              </p>
            </div>
            
            <div style={styles.statCard}>
              <h4 style={{ fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Candidates</h4>
              <p style={{ ...styles.statValue, color: '#7c3aed' }}>
                {electionStats?.activeCandidates || 0}
              </p>
            </div>
            
            <div style={styles.statCard}>
              <h4 style={{ fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>Turnout</h4>
              <p style={{ ...styles.statValue, color: '#ea580c' }}>
                {electionStats?.voterTurnoutPercentage || 0}%
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div style={styles.timeline}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Election Timeline</h3>
            <div>
              <div style={styles.timelineItem}>
                <span style={{ color: '#4b5563' }}>Registration Deadline:</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: '500' }}>
                    {web3Utils.formatTimestamp(electionInfo.registrationDeadline)}
                  </span>
                  {timeRemaining.registration && !timeRemaining.registration.isExpired && (
                    <div style={{ fontSize: '0.875rem', color: '#2563eb' }}>
                      {web3Utils.formatTimeRemaining(electionInfo.registrationDeadline, true)} remaining
                    </div>
                  )}
                </div>
              </div>
              
              <div style={styles.timelineItem}>
                <span style={{ color: '#4b5563' }}>Voting Starts:</span>
                <span style={{ fontWeight: '500' }}>
                  {web3Utils.formatTimestamp(electionInfo.startTime)}
                </span>
              </div>
              
              <div style={styles.timelineItem}>
                <span style={{ color: '#4b5563' }}>Voting Ends:</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: '500' }}>
                    {web3Utils.formatTimestamp(electionInfo.endTime)}
                  </span>
                  {timeRemaining.voting && !timeRemaining.voting.isExpired && currentPhase === 'voting' && (
                    <div style={{ fontSize: '0.875rem', color: '#16a34a' }}>
                      {web3Utils.formatTimeRemaining(electionInfo.endTime, true)} remaining
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Results Preview */}
      {currentWinner && electionStats?.totalVotesCast > 0 && (
        <div style={styles.card}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
            {electionInfo?.isFinalized ? 'Final Results' : 'Current Leading Candidate'}
          </h3>
          
          {currentWinner.isTie ? (
            <div style={{ backgroundColor: '#fefce8', border: '1px solid #fbbf24', borderRadius: '0.5rem', padding: '1rem' }}>
              <p style={{ color: '#a16207', fontWeight: '500' }}>
                🤝 Currently tied with {currentWinner.maxVotes} votes each
              </p>
            </div>
          ) : (
            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #60a5fa', borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: '#1e40af' }}>{currentWinner.winnerName}</h4>
                  <p style={{ color: '#1d4ed8' }}>{currentWinner.winnerParty}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{currentWinner.maxVotes}</div>
                  <div style={{ fontSize: '0.875rem', color: '#2563eb' }}>votes</div>
                </div>
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link 
              to="/results" 
              style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}
            >
              View Detailed Results →
            </Link>
          </div>
        </div>
      )}

      {/* Action Cards */}
      {isConnected && (
        <div style={styles.actionGrid}>
          {/* Voter Registration Card */}
          {canRegister && (
            <div style={{ ...styles.actionCard, borderLeftColor: '#2563eb' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                📝 Register to Vote
              </h3>
              <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
                Registration is open! Register now to participate in the election.
              </p>
              <Link 
                to="/vote" 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#2563eb',
                  color: 'white'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
              >
                Register Now
              </Link>
            </div>
          )}
          
          {/* Voting Card */}
          {canVote && (
            <div style={{ ...styles.actionCard, borderLeftColor: '#16a34a' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                🗳️ Cast Your Vote
              </h3>
              <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
                Voting is now open! Make your voice heard in this election.
              </p>
              <Link 
                to="/vote" 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#16a34a',
                  color: 'white'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#15803d'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#16a34a'}
              >
                Vote Now
              </Link>
            </div>
          )}
          
          {/* Already Voted Card */}
          {isRegistered && hasVoted && (
            <div style={{ ...styles.actionCard, borderLeftColor: '#7c3aed' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
                ✅ Vote Recorded
              </h3>
              <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
                Thank you for participating! Your vote has been securely recorded.
              </p>
              <Link 
                to="/results" 
                style={{
                  ...styles.actionButton,
                  backgroundColor: '#7c3aed',
                  color: 'white'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#6d28d9'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#7c3aed'}
              >
                View Results
              </Link>
            </div>
          )}
          
          {/* Results Card */}
          <div style={{ ...styles.actionCard, borderLeftColor: '#ea580c' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
              📊 Election Results
            </h3>
            <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
              View real-time election results and candidate standings.
            </p>
            <Link 
              to="/results" 
              style={{
                ...styles.actionButton,
                backgroundColor: '#ea580c',
                color: 'white'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ea580c'}
            >
              View Results
            </Link>
          </div>
        </div>
      )}

      {/* Candidates Preview */}
      {candidates && candidates.length > 0 && (
        <div style={styles.card}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>
            Meet the Candidates
          </h3>
          <div style={styles.candidatesGrid}>
            {candidates.slice(0, 6).map((candidate) => (
              <div key={candidate.id} style={styles.candidateCard}>
                <h4 style={{ fontWeight: 'bold', color: '#111827' }}>{candidate.name}</h4>
                <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{candidate.party}</p>
                {electionStats?.totalVotesCast > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Votes:</span>
                    <span style={{ fontWeight: '600', color: '#2563eb' }}>{candidate.voteCount}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {candidates.length > 6 && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link 
                to="/results" 
                style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}
              >
                View All Candidates →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* About Electra */}
      <div style={styles.card}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
          About Electra
        </h3>
        <div style={styles.aboutGrid}>
          <div style={styles.aboutItem}>
            <div style={styles.aboutIcon}>🔒</div>
            <h4 style={styles.aboutTitle}>Secure</h4>
            <p style={styles.aboutDescription}>
              Cryptographic protection ensures vote integrity and prevents tampering
            </p>
          </div>
          
          <div style={styles.aboutItem}>
            <div style={styles.aboutIcon}>👁️</div>
            <h4 style={styles.aboutTitle}>Transparent</h4>
            <p style={styles.aboutDescription}>
              All votes are publicly verifiable on the blockchain
            </p>
          </div>
          
          <div style={styles.aboutItem}>
            <div style={styles.aboutIcon}>🗳️</div>
            <h4 style={styles.aboutTitle}>Democratic</h4>
            <p style={styles.aboutDescription}>
              Empowering citizens with trustworthy electoral processes
            </p>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          backgroundColor: '#f9fafb', 
          borderRadius: '0.5rem' 
        }}>
          <p style={{ fontSize: '0.875rem', color: '#4b5563', textAlign: 'center' }}>
            <strong>Proof of Concept:</strong> This is a demonstration of blockchain voting technology 
            designed to address electoral integrity challenges in Nigeria and beyond.
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

export default Home;