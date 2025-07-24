import React, { useState } from 'react';
import { COLORS, STATUS_COLORS } from '../utils/constants.js';
import { formatTimestamp } from '../utils/formatters.js';

const VoterStatus = ({ 
  voterInfo, 
  electionStatus, 
  candidates,
  onRegister, 
  isRegistering,
  userRole
}) => {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

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

  const buttonStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.secondary,
    color: 'white'
  };

  const getVotedCandidateName = () => {
    if (!voterInfo?.hasVoted || !voterInfo?.candidateVoted || !candidates) return null;
    
    const candidate = candidates.find(c => c.id === voterInfo.candidateVoted);
    return candidate ? `${candidate.name} (${candidate.party})` : `Candidate #${voterInfo.candidateVoted}`;
  };

  const handleRegister = async () => {
    try {
      await onRegister();
      setShowRegistrationForm(false);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const renderRegistrationStatus = () => {
    if (!voterInfo) {
      return (
        <div style={{ color: COLORS.textLight }}>
          Loading voter information...
        </div>
      );
    }

    return (
      <div style={infoGridStyle}>
        <div style={infoItemStyle}>
          <div style={infoLabelStyle}>Registration Status</div>
          <div style={infoValueStyle}>
            {voterInfo.isRegistered ? (
              <span style={{ ...statusBadgeStyle, ...STATUS_COLORS.active }}>
                Registered
              </span>
            ) : (
              <span style={{ ...statusBadgeStyle, ...STATUS_COLORS.inactive }}>
                Not Registered
              </span>
            )}
          </div>
        </div>

        {voterInfo.isRegistered && (
          <>
            <div style={infoItemStyle}>
              <div style={infoLabelStyle}>Voter ID</div>
              <div style={infoValueStyle}>#{voterInfo.voterID}</div>
            </div>

            <div style={infoItemStyle}>
              <div style={infoLabelStyle}>Registered On</div>
              <div style={infoValueStyle}>
                {formatTimestamp(voterInfo.registrationTime)}
              </div>
            </div>

            <div style={infoItemStyle}>
              <div style={infoLabelStyle}>Voting Status</div>
              <div style={infoValueStyle}>
                {voterInfo.hasVoted ? (
                  <span style={{ ...statusBadgeStyle, ...STATUS_COLORS.active }}>
                    Voted
                  </span>
                ) : (
                  <span style={{ ...statusBadgeStyle, ...STATUS_COLORS.pending }}>
                    Not Voted
                  </span>
                )}
              </div>
            </div>

            {voterInfo.hasVoted && voterInfo.candidateVoted > 0 && (
              <div style={infoItemStyle}>
                <div style={infoLabelStyle}>Voted For</div>
                <div style={infoValueStyle}>
                  <div style={{ 
                    fontSize: '1rem', 
                    padding: '8px 12px',
                    backgroundColor: COLORS.primaryLight,
                    borderRadius: '8px',
                    border: `1px solid ${COLORS.primary}`,
                    color: COLORS.primary
                  }}>
                    {getVotedCandidateName()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderRegistrationAction = () => {
    if (voterInfo?.isRegistered) return null;

    if (!electionStatus?.registrationActive) {
      return (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px',
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          color: '#92400e'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            Registration Closed
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            Voter registration is not currently open. Please check back during the registration period.
          </div>
        </div>
      );
    }

    return (
      <div style={{ marginTop: '20px' }}>
        <div style={{
          padding: '16px',
          backgroundColor: COLORS.primaryLight,
          border: `1px solid ${COLORS.primary}`,
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ 
            color: COLORS.primary, 
            fontWeight: '600', 
            marginBottom: '8px' 
          }}>
            Registration Open
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: COLORS.text,
            marginBottom: '12px' 
          }}>
            You can register to vote in this election. Registration is required before you can cast your vote.
          </div>
          
          {showRegistrationForm ? (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                style={{
                  ...primaryButtonStyle,
                  opacity: isRegistering ? 0.7 : 1,
                  flex: 1
                }}
                onClick={handleRegister}
                disabled={isRegistering}
                onMouseOver={(e) => !isRegistering && (e.target.style.backgroundColor = COLORS.secondaryHover)}
                onMouseOut={(e) => !isRegistering && (e.target.style.backgroundColor = COLORS.secondary)}
              >
                {isRegistering ? 'Registering...' : 'Confirm Registration'}
              </button>
              <button
                style={{
                  ...buttonStyle,
                  backgroundColor: 'transparent',
                  color: COLORS.textLight,
                  border: `1px solid ${COLORS.border}`,
                  flex: 1
                }}
                onClick={() => setShowRegistrationForm(false)}
                disabled={isRegistering}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              style={primaryButtonStyle}
              onClick={() => setShowRegistrationForm(true)}
              onMouseOver={(e) => e.target.style.backgroundColor = COLORS.secondaryHover}
              onMouseOut={(e) => e.target.style.backgroundColor = COLORS.secondary}
            >
              Register to Vote
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderUserRoleInfo = () => {
    if (!userRole || userRole.role === 0) return null;

    const roleNames = ['None', 'Voter', 'Observer', 'Admin', 'Commissioner'];
    const roleName = roleNames[userRole.role] || 'Unknown';

    return (
      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px'
      }}>
        <div style={{ 
          fontSize: '0.875rem', 
          color: '#0369a1',
          fontWeight: '600'
        }}>
          System Role: {roleName}
        </div>
        {userRole.assignedAt > 0 && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#0369a1',
            marginTop: '4px'
          }}>
            Assigned: {formatTimestamp(userRole.assignedAt)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      <h3 style={cardHeaderStyle}>Your Voter Status</h3>
      
      {renderRegistrationStatus()}
      {renderRegistrationAction()}
      {renderUserRoleInfo()}
    </div>
  );
};

export default VoterStatus;