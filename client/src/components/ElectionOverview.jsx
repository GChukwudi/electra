import React from 'react';
import { COLORS, STATUS_COLORS } from '../utils/constants.js';
import { formatTimestamp, formatElectionStatus } from '../utils/formatters.js';

const ElectionOverview = ({ electionInfo, electionStatus, candidates, systemInfo }) => {
  const cardStyle = {
    background: COLORS.background,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
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

  const infoGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  };

  const infoItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const infoLabelStyle = {
    fontSize: '0.875rem',
    color: COLORS.textLight,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const infoValueStyle = {
    fontSize: '1.125rem',
    color: COLORS.text,
    fontWeight: '600'
  };

  const statusBadgeStyle = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  const getStatusBadge = () => {
    const status = formatElectionStatus(electionStatus);
    const badgeStyle = {
      ...statusBadgeStyle,
      ...STATUS_COLORS[status.type]
    };

    return <span style={badgeStyle}>{status.label}</span>;
  };

  const getSystemStatusInfo = () => {
    const statusItems = [];
    
    // Add null check for systemInfo
    if (systemInfo && systemInfo.paused) {
      statusItems.push(
        <span key="paused" style={{
          ...statusBadgeStyle,
          ...STATUS_COLORS.inactive
        }}>
          System Paused
        </span>
      );
    }

    if (electionInfo?.isFinalized) {
      statusItems.push(
        <span key="finalized" style={{
          ...statusBadgeStyle,
          backgroundColor: '#8b5cf6',
          color: 'white'
        }}>
          Finalized
        </span>
      );
    }

    return statusItems;
  };

  if (!electionInfo) {
    return (
      <div style={cardStyle}>
        <h2 style={cardHeaderStyle}>Election Information</h2>
        <div style={{ textAlign: 'center', color: COLORS.textLight, padding: '40px' }}>
          No active election found
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h2 style={cardHeaderStyle}>
        {electionInfo.title || 'Election Overview'}
      </h2>
      
      <div style={infoGridStyle}>
        <div style={infoItemStyle}>
          <div style={infoLabelStyle}>Status</div>
          <div style={infoValueStyle}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {getStatusBadge()}
              {getSystemStatusInfo()}
            </div>
          </div>
        </div>

        <div style={infoItemStyle}>
          <div style={infoLabelStyle}>Total Voters</div>
          <div style={infoValueStyle}>
            {electionInfo.totalVoters?.toLocaleString() || '0'}
          </div>
        </div>

        <div style={infoItemStyle}>
          <div style={infoLabelStyle}>Total Votes Cast</div>
          <div style={infoValueStyle}>
            {electionInfo.totalVotes?.toLocaleString() || '0'}
          </div>
        </div>

        <div style={infoItemStyle}>
          <div style={infoLabelStyle}>Candidates</div>
          <div style={infoValueStyle}>
            {candidates?.length || 0}
          </div>
        </div>

        <div style={infoItemStyle}>
          <div style={infoLabelStyle}>Turnout Rate</div>
          <div style={infoValueStyle}>
            {electionInfo.totalVoters > 0 
              ? `${Math.round((electionInfo.totalVotes / electionInfo.totalVoters) * 100)}%`
              : '0%'
            }
          </div>
        </div>

        <div style={infoItemStyle}>
          <div style={infoLabelStyle}>Registration Deadline</div>
          <div style={infoValueStyle}>
            {formatTimestamp(electionInfo.registrationDeadline)}
          </div>
        </div>

        <div style={infoItemStyle}>
          <div style={infoLabelStyle}>Voting Period</div>
          <div style={infoValueStyle}>
            <div style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
              <div>Start: {formatTimestamp(electionInfo.startTime)}</div>
              <div>End: {formatTimestamp(electionInfo.endTime)}</div>
            </div>
          </div>
        </div>

        {electionInfo.isFinalized && electionInfo.winnerID > 0 && (
          <div style={infoItemStyle}>
            <div style={infoLabelStyle}>Election Winner</div>
            <div style={infoValueStyle}>
              <span style={{
                ...statusBadgeStyle,
                backgroundColor: '#10b981',
                color: 'white'
              }}>
                Candidate #{electionInfo.winnerID}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Additional election timeline info */}
      {electionStatus && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: COLORS.backgroundLight,
          borderRadius: '8px',
          border: `1px solid ${COLORS.border}`
        }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '1rem', 
            color: COLORS.text,
            fontWeight: '600'
          }}>
            Election Timeline
          </h4>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '12px',
            fontSize: '0.875rem'
          }}>
            <div>
              <span style={{ color: COLORS.textLight, fontWeight: '600' }}>Registration: </span>
              <span style={{ 
                color: electionStatus.registrationActive ? COLORS.secondary : COLORS.textLight 
              }}>
                {electionStatus.registrationActive ? 'Open' : 'Closed'}
              </span>
            </div>
            
            <div>
              <span style={{ color: COLORS.textLight, fontWeight: '600' }}>Voting: </span>
              <span style={{ 
                color: electionStatus.votingActive ? COLORS.secondary : COLORS.textLight 
              }}>
                {electionStatus.votingActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            {electionStatus.timeUntilStart > 0 && (
              <div>
                <span style={{ color: COLORS.textLight, fontWeight: '600' }}>Starts in: </span>
                <span style={{ color: COLORS.text }}>
                  {Math.floor(electionStatus.timeUntilStart / 3600)}h {Math.floor((electionStatus.timeUntilStart % 3600) / 60)}m
                </span>
              </div>
            )}
            
            {electionStatus.votingActive && electionStatus.timeUntilEnd > 0 && (
              <div>
                <span style={{ color: COLORS.textLight, fontWeight: '600' }}>Ends in: </span>
                <span style={{ color: COLORS.warning }}>
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

export default ElectionOverview;