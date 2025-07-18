/**
 * VotingInterface Component - Interface for casting votes
 * Secure voting interface with candidate selection and confirmation
 */

import React, { useState, useEffect } from 'react';
import { useElection } from '../contexts/ElectionContext';
import { web3Utils } from '../utils/web3Utils';
import { security } from '../utils/security';

const VotingInterface = () => {
  const { 
    candidates, 
    castVote, 
    electionInfo,
    isLoading,
    error,
    setError 
  } = useElection();
  
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({});

  // Update time remaining
  useEffect(() => {
    const updateTimes = () => {
      if (electionInfo) {
        setTimeRemaining({
          voting: web3Utils.getTimeRemaining(electionInfo.endTime)
        });
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 60000);
    return () => clearInterval(interval);
  }, [electionInfo]);

  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(candidate);
    setError(null);
  };

  const handleVoteSubmit = () => {
    if (!selectedCandidate) {
      setError('Please select a candidate before voting');
      return;
    }

    // Validate candidate ID
    const validation = security.validateInput.candidateId(selectedCandidate.id);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setShowConfirmation(true);
  };

  const confirmVote = async () => {
    if (!selectedCandidate) return;

    setIsVoting(true);
    setError(null);

    try {
      // Record rate limit attempt
      security.rateLimit.recordAttempt('vote');

      await castVote(selectedCandidate.id);
      
      // Vote successful - component will re-render showing success state
      setShowConfirmation(false);
      setSelectedCandidate(null);
      
    } catch (err) {
      console.error('Voting failed:', err);
      setError(err.message || 'Failed to cast vote. Please try again.');
      setShowConfirmation(false);
    } finally {
      setIsVoting(false);
    }
  };

  const cancelVote = () => {
    setShowConfirmation(false);
    setSelectedCandidate(null);
  };

  // Check if voting is still active
  const isVotingActive = () => {
    if (!electionInfo) return false;
    const now = Math.floor(Date.now() / 1000);
    return now >= electionInfo.startTime && 
           now <= electionInfo.endTime && 
           !electionInfo.isFinalized;
  };

  // Styles
  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem'
    },
    centerContainer: {
      textAlign: 'center'
    },
    icon: {
      fontSize: '4rem',
      marginBottom: '1rem'
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '0.5rem'
    },
    subtitle: {
      color: '#4b5563'
    },
    spinner: {
      width: '2rem',
      height: '2rem',
      border: '2px solid #e5e7eb',
      borderTop: '2px solid #2563eb',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 1rem'
    },
    header: {
      marginBottom: '1.5rem'
    },
    headerTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '0.5rem'
    },
    headerText: {
      color: '#4b5563'
    },
    timeWarning: {
      marginTop: '0.75rem',
      padding: '0.75rem',
      backgroundColor: '#fefce8',
      border: '1px solid #fbbf24',
      borderRadius: '0.5rem'
    },
    errorCard: {
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1.5rem'
    },
    candidatesSection: {
      marginBottom: '1.5rem'
    },
    sectionTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '1rem'
    },
    candidatesList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    },
    candidateCard: {
      border: '2px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    candidateCardSelected: {
      borderColor: '#2563eb',
      backgroundColor: '#eff6ff'
    },
    candidateCardHover: {
      borderColor: '#d1d5db',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    candidateContent: {
      display: 'flex',
      alignItems: 'center'
    },
    radioButton: {
      width: '1rem',
      height: '1rem',
      borderRadius: '50%',
      border: '2px solid #d1d5db',
      marginRight: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    radioButtonSelected: {
      borderColor: '#2563eb',
      backgroundColor: '#2563eb'
    },
    radioButtonInner: {
      width: '0.5rem',
      height: '0.5rem',
      backgroundColor: 'white',
      borderRadius: '50%'
    },
    candidateInfo: {
      flex: 1
    },
    candidateHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    candidateName: {
      fontSize: '1.125rem',
      fontWeight: 'bold',
      color: '#111827'
    },
    candidateParty: {
      color: '#2563eb',
      fontWeight: '500'
    },
    candidateId: {
      fontSize: '0.875rem',
      color: '#6b7280'
    },
    buttonContainer: {
      display: 'flex',
      justifyContent: 'center'
    },
    submitButton: {
      backgroundColor: '#16a34a',
      color: 'white',
      fontWeight: 'bold',
      padding: '0.75rem 2rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    submitButtonDisabled: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      maxWidth: '28rem',
      margin: '1rem'
    },
    modalHeader: {
      textAlign: 'center',
      marginBottom: '1.5rem'
    },
    modalIcon: {
      fontSize: '2.5rem',
      marginBottom: '1rem'
    },
    modalTitle: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '0.5rem'
    },
    modalText: {
      color: '#4b5563'
    },
    selectedCandidateCard: {
      backgroundColor: '#eff6ff',
      border: '1px solid #c3ddfd',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1.5rem'
    },
    warningCard: {
      backgroundColor: '#fefce8',
      border: '1px solid #fbbf24',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '1.5rem'
    },
    warningTitle: {
      fontWeight: '600',
      color: '#92400e',
      marginBottom: '0.5rem'
    },
    warningList: {
      fontSize: '0.875rem',
      color: '#a16207'
    },
    modalButtons: {
      display: 'flex',
      gap: '1rem'
    },
    cancelButton: {
      flex: 1,
      backgroundColor: '#d1d5db',
      color: '#374151',
      fontWeight: '500',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    confirmButton: {
      flex: 1,
      backgroundColor: '#16a34a',
      color: 'white',
      fontWeight: '500',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    securityNotice: {
      marginTop: '2rem',
      padding: '1rem',
      backgroundColor: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem'
    },
    securityTitle: {
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '0.5rem'
    },
    securityList: {
      fontSize: '0.875rem',
      color: '#4b5563'
    }
  };

  if (!isVotingActive()) {
    return (
      <div style={styles.container}>
        <div style={styles.centerContainer}>
          <div style={styles.icon}>⏰</div>
          <h3 style={styles.title}>Voting Not Available</h3>
          <p style={styles.subtitle}>
            Voting is not currently active. Please check the election schedule.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.centerContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.subtitle}>Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.centerContainer}>
          <div style={styles.icon}>🚫</div>
          <h3 style={styles.title}>No Candidates Available</h3>
          <p style={styles.subtitle}>
            There are no active candidates for this election.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.headerTitle}>Cast Your Vote</h2>
        <p style={styles.headerText}>
          Select your preferred candidate and submit your vote securely to the blockchain.
        </p>
        
        {/* Time Remaining */}
        {timeRemaining.voting && !timeRemaining.voting.isExpired && (
          <div style={styles.timeWarning}>
            <p style={{ color: '#92400e', fontSize: '0.875rem' }}>
              ⏰ Voting ends in {web3Utils.formatTimeRemaining(electionInfo.endTime)}
            </p>
          </div>
        )}
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

      {/* Candidates List */}
      <div style={styles.candidatesSection}>
        <h3 style={styles.sectionTitle}>Select a Candidate:</h3>
        
        <div style={styles.candidatesList}>
          {candidates.filter(candidate => candidate.isActive).map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => handleCandidateSelect(candidate)}
              style={{
                ...styles.candidateCard,
                ...(selectedCandidate?.id === candidate.id ? styles.candidateCardSelected : {}),
              }}
              onMouseOver={(e) => {
                if (selectedCandidate?.id !== candidate.id) {
                  Object.assign(e.currentTarget.style, styles.candidateCardHover);
                }
              }}
              onMouseOut={(e) => {
                if (selectedCandidate?.id !== candidate.id) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <div style={styles.candidateContent}>
                <div style={{
                  ...styles.radioButton,
                  ...(selectedCandidate?.id === candidate.id ? styles.radioButtonSelected : {})
                }}>
                  {selectedCandidate?.id === candidate.id && (
                    <div style={styles.radioButtonInner}></div>
                  )}
                </div>
                
                <div style={styles.candidateInfo}>
                  <div style={styles.candidateHeader}>
                    <div>
                      <h4 style={styles.candidateName}>{candidate.name}</h4>
                      <p style={styles.candidateParty}>{candidate.party}</p>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={styles.candidateId}>Candidate #{candidate.id}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vote Button */}
      <div style={styles.buttonContainer}>
        <button
          onClick={handleVoteSubmit}
          disabled={!selectedCandidate || isVoting}
          style={{
            ...styles.submitButton,
            ...(!selectedCandidate || isVoting ? styles.submitButtonDisabled : {})
          }}
          onMouseOver={(e) => {
            if (selectedCandidate && !isVoting) {
              e.target.style.backgroundColor = '#15803d';
            }
          }}
          onMouseOut={(e) => {
            if (selectedCandidate && !isVoting) {
              e.target.style.backgroundColor = '#16a34a';
            }
          }}
        >
          {isVoting ? (
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
              Processing Vote...
            </span>
          ) : (
            'Submit Vote'
          )}
        </button>
      </div>

      {/* Vote Confirmation Modal */}
      {showConfirmation && selectedCandidate && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={styles.modalIcon}>🗳️</div>
              <h3 style={styles.modalTitle}>Confirm Your Vote</h3>
              <p style={styles.modalText}>
                Please confirm that you want to vote for:
              </p>
            </div>

            <div style={styles.selectedCandidateCard}>
              <h4 style={{ fontWeight: 'bold', color: '#1e40af' }}>{selectedCandidate.name}</h4>
              <p style={{ color: '#1d4ed8' }}>{selectedCandidate.party}</p>
              <p style={{ fontSize: '0.75rem', color: '#2563eb', marginTop: '0.25rem' }}>
                Candidate #{selectedCandidate.id}
              </p>
            </div>

            <div style={styles.warningCard}>
              <h4 style={styles.warningTitle}>⚠️ Important Notice</h4>
              <ul style={styles.warningList}>
                <li>• Your vote will be recorded permanently on the blockchain</li>
                <li>• You cannot change your vote once submitted</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>

            <div style={styles.modalButtons}>
              <button
                onClick={cancelVote}
                disabled={isVoting}
                style={{
                  ...styles.cancelButton,
                  ...(isVoting ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                }}
                onMouseOver={(e) => {
                  if (!isVoting) {
                    e.target.style.backgroundColor = '#9ca3af';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isVoting) {
                    e.target.style.backgroundColor = '#d1d5db';
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmVote}
                disabled={isVoting}
                style={{
                  ...styles.confirmButton,
                  ...(isVoting ? { opacity: 0.6, cursor: 'not-allowed' } : {})
                }}
                onMouseOver={(e) => {
                  if (!isVoting) {
                    e.target.style.backgroundColor = '#15803d';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isVoting) {
                    e.target.style.backgroundColor = '#16a34a';
                  }
                }}
              >
                {isVoting ? (
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
                    Voting...
                  </span>
                ) : (
                  'Confirm Vote'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div style={styles.securityNotice}>
        <h4 style={styles.securityTitle}>🔒 Security & Privacy</h4>
        <ul style={styles.securityList}>
          <li>• Your vote is encrypted and securely recorded on the blockchain</li>
          <li>• Vote integrity is guaranteed through cryptographic verification</li>
          <li>• Your identity remains private while ensuring transparency</li>
          <li>• All transactions are publicly auditable</li>
        </ul>
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

export default VotingInterface;