import React, { useState } from 'react';
import { COLORS } from '../utils/constants.js';
import { getVotePercentage } from '../utils/formatters.js';

const CandidatesList = ({ 
  candidates, 
  electionInfo, 
  electionStatus, 
  voterInfo,
  selectedCandidate,
  onCandidateSelect,
  onVote,
  isVoting 
}) => {
  const [showVoteConfirmation, setShowVoteConfirmation] = useState(false);

  const cardStyle = {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };

  const cardHeaderStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: `1px solid ${COLORS.border}`
  };

  const candidateCardStyle = {
    background: COLORS.background,
    border: `2px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const selectedCandidateCardStyle = {
    ...candidateCardStyle,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight
  };

  const votedCandidateCardStyle = {
    ...candidateCardStyle,
    borderColor: COLORS.secondary,
    backgroundColor: '#f0fdf4',
    cursor: 'default'
  };

  const candidateHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  };

  const candidateNameStyle = {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: COLORS.text,
    margin: 0
  };

  const candidatePartyStyle = {
    fontSize: '1rem',
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginTop: '4px'
  };

  const voteInfoStyle = {
    textAlign: 'right'
  };

  const voteCountStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: COLORS.primary
  };

  const votePercentageStyle = {
    fontSize: '0.875rem',
    color: COLORS.textLight
  };

  const progressBarStyle = {
    width: '100%',
    height: '8px',
    backgroundColor: COLORS.border,
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '8px'
  };

  const progressFillStyle = {
    height: '100%',
    backgroundColor: COLORS.primary,
    transition: 'width 0.3s ease',
    borderRadius: '4px'
  };

  const buttonStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.secondary,
    color: 'white'
  };

  const outlineButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: COLORS.textLight,
    border: `1px solid ${COLORS.border}`
  };

  const canVote = voterInfo?.isRegistered && !voterInfo?.hasVoted && electionStatus?.votingActive;
  const hasVoted = voterInfo?.hasVoted;
  const votedCandidateId = voterInfo?.candidateVoted;

  const handleCandidateClick = (candidate) => {
    if (!canVote) return;
    
    if (selectedCandidate?.id === candidate.id) {
      onCandidateSelect(null); // Deselect if clicking same candidate
    } else {
      onCandidateSelect(candidate);
    }
  };

  const handleVoteConfirmation = () => {
    setShowVoteConfirmation(true);
  };

  const handleConfirmVote = async () => {
    try {
      await onVote();
      setShowVoteConfirmation(false);
    } catch (error) {
      console.error('Voting failed:', error);
    }
  };

  const getCandidateCardStyle = (candidate) => {
    if (hasVoted && candidate.id === votedCandidateId) {
      return votedCandidateCardStyle;
    }
    if (selectedCandidate?.id === candidate.id) {
      return selectedCandidateCardStyle;
    }
    return candidateCardStyle;
  };

  const renderCandidateCard = (candidate) => {
    const percentage = getVotePercentage(candidate.voteCount, electionInfo?.totalVotes || 0);
    const isVotedFor = hasVoted && candidate.id === votedCandidateId;
    const isSelected = selectedCandidate?.id === candidate.id;

    return (
      <div
        key={candidate.id}
        style={getCandidateCardStyle(candidate)}
        onClick={() => handleCandidateClick(candidate)}
        onMouseEnter={(e) => {
          if (canVote && !isSelected) {
            e.target.style.borderColor = COLORS.primaryHover;
          }
        }}
        onMouseLeave={(e) => {
          if (canVote && !isSelected) {
            e.target.style.borderColor = COLORS.border;
          }
        }}
      >
        <div style={candidateHeaderStyle}>
          <div>
            <h4 style={candidateNameStyle}>
              {candidate.name}
              {isVotedFor && (
                <span style={{
                  marginLeft: '8px',
                  fontSize: '0.875rem',
                  color: COLORS.secondary,
                  fontWeight: 'normal'
                }}>
                  ✓ Your Vote
                </span>
              )}
            </h4>
            <p style={candidatePartyStyle}>{candidate.party}</p>
          </div>
          <div style={voteInfoStyle}>
            <div style={voteCountStyle}>{candidate.voteCount.toLocaleString()}</div>
            <div style={votePercentageStyle}>
              {percentage}% ({candidate.voteCount} vote{candidate.voteCount !== 1 ? 's' : ''})
            </div>
          </div>
        </div>
        
        {electionInfo?.totalVotes > 0 && (
          <div style={progressBarStyle}>
            <div 
              style={{
                ...progressFillStyle,
                width: `${percentage}%`,
                backgroundColor: isVotedFor ? COLORS.secondary : COLORS.primary
              }}
            />
          </div>
        )}

        {isSelected && canVote && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: COLORS.primaryLight,
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: COLORS.primary,
            fontWeight: '600'
          }}>
            Click "Cast Vote" below to vote for this candidate
          </div>
        )}
      </div>
    );
  };

  const renderVotingActions = () => {
    if (!canVote || !selectedCandidate) return null;

    if (showVoteConfirmation) {
      return (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#fef3c7',
          border: `2px solid ${COLORS.warning}`,
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            color: '#92400e',
            marginBottom: '8px'
          }}>
            Confirm Your Vote
          </div>
          
          <div style={{
            fontSize: '1rem',
            color: '#92400e',
            marginBottom: '16px'
          }}>
            You are about to vote for: <strong>{selectedCandidate.name}</strong> ({selectedCandidate.party})
          </div>
          
          <div style={{
            fontSize: '0.875rem',
            color: '#92400e',
            marginBottom: '20px',
            fontStyle: 'italic'
          }}>
            ⚠️ This action cannot be undone. You can only vote once.
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              style={{
                ...primaryButtonStyle,
                opacity: isVoting ? 0.7 : 1,
                minWidth: '120px'
              }}
              onClick={handleConfirmVote}
              disabled={isVoting}
              onMouseOver={(e) => !isVoting && (e.target.style.backgroundColor = COLORS.secondaryHover)}
              onMouseOut={(e) => !isVoting && (e.target.style.backgroundColor = COLORS.secondary)}
            >
              {isVoting ? 'Casting Vote...' : 'Confirm Vote'}
            </button>
            
            <button
              style={{
                ...outlineButtonStyle,
                minWidth: '120px'
              }}
              onClick={() => setShowVoteConfirmation(false)}
              disabled={isVoting}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <div style={{
          marginBottom: '16px',
          color: COLORS.text,
          fontSize: '1rem'
        }}>
          You have selected: <strong>{selectedCandidate.name}</strong> ({selectedCandidate.party})
        </div>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            style={primaryButtonStyle}
            onClick={handleVoteConfirmation}
            onMouseOver={(e) => e.target.style.backgroundColor = COLORS.secondaryHover}
            onMouseOut={(e) => e.target.style.backgroundColor = COLORS.secondary}
          >
            Cast Vote
          </button>
          
          <button
            style={outlineButtonStyle}
            onClick={() => onCandidateSelect(null)}
          >
            Cancel Selection
          </button>
        </div>
      </div>
    );
  };

  const renderVotingStatus = () => {
    if (canVote) {
      return (
        <div style={{
          padding: '16px',
          backgroundColor: COLORS.primaryLight,
          border: `1px solid ${COLORS.primary}`,
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{
            color: COLORS.primary,
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            ✓ You can vote in this election
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: COLORS.text
          }}>
            Select a candidate below to cast your vote
          </div>
        </div>
      );
    }

    if (hasVoted) {
      return (
        <div style={{
          padding: '16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{
            color: '#166534',
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            ✓ Thank you for voting!
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#166534'
          }}>
            Your vote has been recorded. You can see the current results below.
          </div>
        </div>
      );
    }

    if (!voterInfo?.isRegistered) {
      return (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{
            color: '#92400e',
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            Registration Required
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#92400e'
          }}>
            You must register to vote before you can participate in this election
          </div>
        </div>
      );
    }

    if (!electionStatus?.votingActive) {
      return (
        <div style={{
          padding: '16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{
            color: '#991b1b',
            fontWeight: '600',
            marginBottom: '4px'
          }}>
            Voting Not Active
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: '#991b1b'
          }}>
            Voting is not currently open for this election
          </div>
        </div>
      );
    }

    return null;
  };

  if (!candidates || candidates.length === 0) {
    return (
      <div style={cardStyle}>
        <h3 style={cardHeaderStyle}>Candidates</h3>
        <div style={{
          textAlign: 'center',
          color: COLORS.textLight,
          padding: '40px 20px',
          fontStyle: 'italic'
        }}>
          No candidates registered yet
        </div>
      </div>
    );
  }

  // Sort candidates by vote count (descending)
  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div style={cardStyle}>
      <h3 style={cardHeaderStyle}>
        Candidates ({candidates.length})
      </h3>
      
      {renderVotingStatus()}
      
      <div>
        {sortedCandidates.map(renderCandidateCard)}
      </div>

      {renderVotingActions()}
      
      {/* Election statistics */}
      {electionInfo?.totalVotes > 0 && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: COLORS.backgroundLight,
          borderRadius: '8px',
          border: `1px solid ${COLORS.border}`
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            fontSize: '0.875rem'
          }}>
            <div>
              <span style={{ color: COLORS.textLight, fontWeight: '600' }}>Total Votes: </span>
              <span style={{ color: COLORS.text, fontWeight: '600' }}>
                {electionInfo.totalVotes.toLocaleString()}
              </span>
            </div>
            
            <div>
              <span style={{ color: COLORS.textLight, fontWeight: '600' }}>Leading by: </span>
              <span style={{ color: COLORS.text, fontWeight: '600' }}>
                {sortedCandidates.length >= 2 
                  ? `${sortedCandidates[0].voteCount - sortedCandidates[1].voteCount} votes`
                  : 'N/A'
                }
              </span>
            </div>

            <div>
              <span style={{ color: COLORS.textLight, fontWeight: '600' }}>Participation: </span>
              <span style={{ color: COLORS.text, fontWeight: '600' }}>
                {electionInfo.totalVoters > 0 
                  ? `${Math.round((electionInfo.totalVotes / electionInfo.totalVoters) * 100)}%`
                  : '0%'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatesList;