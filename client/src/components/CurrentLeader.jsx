import React from 'react';
import { COLORS } from '../utils/constants.js';
import { getVotePercentage } from '../utils/formatters.js';

const CurrentLeader = ({ currentWinner, electionInfo, electionStatus }) => {
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

  const leaderCardStyle = {
    background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.backgroundLight} 100%)`,
    border: `2px solid ${COLORS.primary}`,
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center'
  };

  const leaderNameStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: '8px'
  };

  const leaderPartyStyle = {
    fontSize: '1.1rem',
    color: COLORS.textLight,
    fontStyle: 'italic',
    marginBottom: '16px'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '16px',
    marginTop: '16px'
  };

  const statItemStyle = {
    textAlign: 'center'
  };

  const statValueStyle = {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: COLORS.primary,
    display: 'block'
  };

  const statLabelStyle = {
    fontSize: '0.875rem',
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '600'
  };

  const progressBarStyle = {
    width: '100%',
    height: '12px',
    backgroundColor: COLORS.border,
    borderRadius: '6px',
    overflow: 'hidden',
    marginTop: '12px'
  };

  const progressFillStyle = {
    height: '100%',
    backgroundColor: COLORS.primary,
    transition: 'width 0.3s ease',
    borderRadius: '6px'
  };

  const crownIconStyle = {
    fontSize: '2rem',
    color: '#fbbf24',
    marginBottom: '8px'
  };

  // Don't show if no winner or no votes
  if (!currentWinner || !currentWinner.maxVotes || currentWinner.maxVotes === 0) {
    return (
      <div style={cardStyle}>
        <h3 style={cardHeaderStyle}>Current Leader</h3>
        <div style={{ 
          textAlign: 'center', 
          color: COLORS.textLight, 
          padding: '40px 20px',
          fontStyle: 'italic'
        }}>
          No votes cast yet
        </div>
      </div>
    );
  }

  const votePercentage = getVotePercentage(currentWinner.maxVotes, electionInfo?.totalVotes || 0);
  const isElectionFinalized = electionInfo?.isFinalized;

  return (
    <div style={cardStyle}>
      <h3 style={cardHeaderStyle}>
        {isElectionFinalized ? 'Election Winner' : 'Current Leader'}
      </h3>
      
      <div style={leaderCardStyle}>
        {isElectionFinalized && (
          <div style={crownIconStyle}>👑</div>
        )}
        
        <div style={leaderNameStyle}>
          {currentWinner.winnerName}
        </div>
        
        <div style={leaderPartyStyle}>
          {currentWinner.winnerParty}
        </div>

        {/* Vote progress bar */}
        <div style={progressBarStyle}>
          <div 
            style={{
              ...progressFillStyle,
              width: `${votePercentage}%`
            }}
          />
        </div>

        {/* Statistics */}
        <div style={statsGridStyle}>
          <div style={statItemStyle}>
            <span style={statValueStyle}>
              {currentWinner.maxVotes.toLocaleString()}
            </span>
            <span style={statLabelStyle}>Votes</span>
          </div>

          <div style={statItemStyle}>
            <span style={statValueStyle}>
              {votePercentage}%
            </span>
            <span style={statLabelStyle}>Share</span>
          </div>

          {electionInfo?.totalVotes > 0 && (
            <div style={statItemStyle}>
              <span style={statValueStyle}>
                {Math.max(0, currentWinner.maxVotes - (electionInfo.totalVotes - currentWinner.maxVotes))}
              </span>
              <span style={statLabelStyle}>Lead</span>
            </div>
          )}
        </div>

        {/* Status message */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: isElectionFinalized ? '#dcfce7' : '#fef3c7',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: isElectionFinalized ? '#166534' : '#92400e',
          fontWeight: '600'
        }}>
          {isElectionFinalized ? (
            '🎉 Official Election Winner!'
          ) : electionStatus?.votingActive ? (
            '⏳ Voting in progress - results may change'
          ) : (
            '📊 Preliminary results'
          )}
        </div>
      </div>

      {/* Additional stats */}
      {electionInfo && (
        <div style={{
          marginTop: '16px',
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
                {electionInfo.totalVotes?.toLocaleString() || '0'}
              </span>
            </div>
            
            <div>
              <span style={{ color: COLORS.textLight, fontWeight: '600' }}>Turnout: </span>
              <span style={{ color: COLORS.text, fontWeight: '600' }}>
                {electionInfo.totalVoters > 0 
                  ? `${Math.round((electionInfo.totalVotes / electionInfo.totalVoters) * 100)}%`
                  : '0%'
                }
              </span>
            </div>

            {!isElectionFinalized && electionStatus?.votingActive && electionStatus.timeUntilEnd > 0 && (
              <div>
                <span style={{ color: COLORS.textLight, fontWeight: '600' }}>Time Left: </span>
                <span style={{ color: COLORS.warning, fontWeight: '600' }}>
                  {Math.floor(electionStatus.timeUntilEnd / 3600)}h {Math.floor((electionStatus.timeUntilEnd % 3600) / 60)}m
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentLeader;