/**
 * Vote Page - Voter registration and voting interface
 * Main page for voter interaction with the election system
 */

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useElection } from '../contexts/ElectionContext';
import { web3Utils } from '../utils/web3Utils';
import VoterDashboard from '../components/VoterDashboard';
import VotingInterface from '../components/VotingInterface';

const Vote = () => {
  const { account, isConnected, connectWallet } = useWeb3();
  const { 
    electionInfo, 
    isRegistered, 
    hasVoted, 
    canVote, 
    canRegister,
    selfRegister,
    voterInfo,
    isLoading,
    error,
    setError
  } = useElection();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({});

  // Update time remaining
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
    const interval = setInterval(updateTimes, 60000);
    return () => clearInterval(interval);
  }, [electionInfo]);

  const handleSelfRegister = async () => {
    if (!isConnected || !account) return;
    
    setIsRegistering(true);
    setError(null);
    
    try {
      await selfRegister();
      setRegistrationSuccess(true);
      setTimeout(() => setRegistrationSuccess(false), 5000);
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const getVotingStatus = () => {
    if (!electionInfo) return 'loading';
    
    const now = Math.floor(Date.now() / 1000);
    
    if (now < electionInfo.registrationDeadline) return 'registration';
    if (now < electionInfo.startTime) return 'waiting';
    if (now <= electionInfo.endTime && !electionInfo.isFinalized) return 'voting';
    return 'ended';
  };

  const votingStatus = getVotingStatus();

  // Styles
  const styles = {
    container: {
      maxWidth: '1024px',
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
    card: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '2rem',
      textAlign: 'center'
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
    errorCard: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1.5rem'
    },
    successCard: {
      backgroundColor: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1.5rem'
    },
    icon: {
      fontSize: '4rem',
      marginBottom: '1rem'
    },
    cardTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '1rem'
    },
    cardText: {
      color: '#4b5563',
      marginBottom: '1.5rem'
    },
    infoBadge: {
      backgroundColor: '#eff6ff',
      border: '1px solid #c3ddfd',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1.5rem'
    },
    button: {
      backgroundColor: '#2563eb',
      color: 'white',
      fontWeight: '500',
      padding: '0.75rem 2rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    buttonDisabled: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    }
  };

  // Loading state
  if (isLoading && !electionInfo) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#4b5563' }}>Loading election data...</p>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>🔗</div>
          <h2 style={styles.cardTitle}>Connect Your Wallet</h2>
          <p style={styles.cardText}>
            You need to connect your MetaMask wallet to register and vote in elections.
          </p>
          <button
            onClick={connectWallet}
            style={styles.button}
            onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  // No active election
  if (!electionInfo || !electionInfo.isActive) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.icon}>🚫</div>
          <h2 style={styles.cardTitle}>No Active Election</h2>
          <p style={styles.cardText}>
            There is currently no active election. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={styles.pageTitle}>Voting Portal</h1>
        <p style={styles.pageSubtitle}>{electionInfo.title}</p>
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>⚠️</div>
            <div>
              <h4 style={{ fontWeight: '500', color: '#991b1b' }}>Error</h4>
              <p style={{ color: '#b91c1c' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {registrationSuccess && (
        <div style={styles.successCard}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ fontSize: '1.25rem', marginRight: '0.75rem' }}>✅</div>
            <div>
              <h4 style={{ fontWeight: '500', color: '#166534' }}>Registration Successful!</h4>
              <p style={{ color: '#15803d' }}>You are now registered to vote.</p>
            </div>
          </div>
        </div>
      )}

      {/* Registration Phase */}
      {votingStatus === 'registration' && !isRegistered && (
        <div style={styles.card}>
          <div style={styles.icon}>📝</div>
          <h2 style={styles.cardTitle}>Voter Registration</h2>
          <p style={styles.cardText}>
            Registration is currently open. Register now to participate in the upcoming election.
          </p>
          
          <div style={styles.infoBadge}>
            <h4 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>Registration Deadline</h4>
            <p style={{ color: '#1d4ed8' }}>
              {web3Utils.formatTimestamp(electionInfo.registrationDeadline)}
            </p>
            {timeRemaining.registration && !timeRemaining.registration.isExpired && (
              <p style={{ fontSize: '0.875rem', color: '#2563eb', marginTop: '0.25rem' }}>
                {web3Utils.formatTimeRemaining(electionInfo.registrationDeadline)} remaining
              </p>
            )}
          </div>

          <button
            onClick={handleSelfRegister}
            disabled={isRegistering || !canRegister}
            style={{
              ...styles.button,
              ...(isRegistering || !canRegister ? styles.buttonDisabled : {})
            }}
            onMouseOver={(e) => {
              if (!isRegistering && canRegister) {
                e.target.style.backgroundColor = '#1d4ed8';
              }
            }}
            onMouseOut={(e) => {
              if (!isRegistering && canRegister) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }}
          >
            {isRegistering ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '0.5rem'
                }}></div>
                Registering...
              </span>
            ) : (
              'Register to Vote'
            )}
          </button>
        </div>
      )}

      {/* Waiting Phase */}
      {votingStatus === 'waiting' && isRegistered && (
        <div style={styles.card}>
          <div style={styles.icon}>⏳</div>
          <h2 style={styles.cardTitle}>Voting Starts Soon</h2>
          <p style={styles.cardText}>
            You are registered and ready to vote. Voting will begin shortly.
          </p>
          
          <div style={{
            backgroundColor: '#fefce8',
            border: '1px solid #fbbf24',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <h4 style={{ fontWeight: '600', color: '#92400e', marginBottom: '0.5rem' }}>Voting Starts</h4>
            <p style={{ color: '#a16207' }}>
              {web3Utils.formatTimestamp(electionInfo.startTime)}
            </p>
          </div>
        </div>
      )}

      {/* Voting Phase */}
      {votingStatus === 'voting' && isRegistered && !hasVoted && (
        <VotingInterface />
      )}

      {/* Already Voted */}
      {hasVoted && (
        <div style={styles.card}>
          <div style={styles.icon}>✅</div>
          <h2 style={styles.cardTitle}>Vote Recorded</h2>
          <p style={styles.cardText}>
            Thank you for participating! Your vote has been securely recorded on the blockchain.
          </p>
          
          {voterInfo && (
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '0.5rem',
              padding: '1rem'
            }}>
              <h4 style={{ fontWeight: '600', color: '#166534', marginBottom: '0.5rem' }}>Your Voting Details</h4>
              <div style={{ fontSize: '0.875rem', color: '#15803d' }}>
                <p>Voter ID: #{voterInfo.voterID}</p>
                <p>Registered: {web3Utils.formatTimestamp(voterInfo.registrationTime)}</p>
                <p>Vote Status: Confirmed ✓</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Election Ended */}
      {votingStatus === 'ended' && (
        <div style={styles.card}>
          <div style={styles.icon}>🏁</div>
          <h2 style={styles.cardTitle}>Voting Has Ended</h2>
          <p style={styles.cardText}>
            The voting period for this election has concluded.
          </p>
          
          <div style={{
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <h4 style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>Voting Period</h4>
            <p style={{ color: '#374151' }}>
              Ended: {web3Utils.formatTimestamp(electionInfo.endTime)}
            </p>
          </div>
        </div>
      )}

      {/* Voter Dashboard */}
      {isConnected && <VoterDashboard />}

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

export default Vote;