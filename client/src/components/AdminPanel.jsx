import React, { useState } from 'react';
import { COLORS, USER_ROLES } from '../utils/constants.js';

const AdminPanel = ({ 
  isUserAdmin, 
  isUserCommissioner, 
  isUserOwner,
  systemInfo,
  electionInfo,
  contractHook,
  onRefreshData 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [candidateForm, setCandidateForm] = useState({ name: '', party: '' });
  const [electionForm, setElectionForm] = useState({
    title: '',
    registrationDeadline: '',
    startTime: '',
    endTime: ''
  });
  const [voterAddress, setVoterAddress] = useState('');
  const [roleForm, setRoleForm] = useState({ address: '', role: USER_ROLES.VOTER });

  const cardStyle = {
    background: COLORS.background,
    border: `2px solid ${COLORS.primary}`,
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    marginBottom: isExpanded ? '20px' : '0'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: COLORS.primary,
    margin: 0
  };

  const buttonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.primary,
    color: 'white'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.secondary,
    color: 'white'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.danger,
    color: 'white'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    fontSize: '1rem',
    marginBottom: '12px'
  };

  const sectionStyle = {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: '8px',
    border: `1px solid ${COLORS.border}`
  };

  const sectionTitleStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: '12px'
  };

  // Don't render if user doesn't have admin privileges
  if (!isUserAdmin) {
    return null;
  }

  const handleAction = async (action, params = {}) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      let result;
      switch (action) {
        case 'addCandidate':
          result = await contractHook.addCandidate(params.name, params.party);
          setSuccess(`Candidate "${params.name}" added successfully!`);
          setCandidateForm({ name: '', party: '' });
          break;

        case 'createElection':
          result = await contractHook.createElection(
            params.title,
            params.registrationDeadline,
            params.startTime,
            params.endTime
          );
          setSuccess('Election created successfully!');
          setElectionForm({ title: '', registrationDeadline: '', startTime: '', endTime: '' });
          break;

        case 'registerVoter':
          result = await contractHook.registerVoter(params.address);
          setSuccess(`Voter ${params.address} registered successfully!`);
          setVoterAddress('');
          break;

        case 'startVoting':
          result = await contractHook.startVoting();
          setSuccess('Voting started successfully!');
          break;

        case 'endVoting':
          result = await contractHook.endVoting();
          setSuccess('Voting ended successfully!');
          break;

        case 'finalizeElection':
          result = await contractHook.finalizeElection();
          setSuccess('Election finalized successfully!');
          break;

        case 'pauseSystem':
          result = await contractHook.pauseSystem();
          setSuccess('System pause status toggled!');
          break;

        case 'assignRole':
          result = await contractHook.assignRole(params.address, params.role);
          setSuccess(`Role assigned to ${params.address} successfully!`);
          setRoleForm({ address: '', role: USER_ROLES.VOTER });
          break;

        default:
          throw new Error('Unknown action');
      }

      // Wait for transaction
      if (result && result.wait) {
        await result.wait();
      }

      // Refresh data
      if (onRefreshData) {
        setTimeout(onRefreshData, 2000);
      }

    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      setError(error.message || `Failed to execute ${action}`);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const renderCandidateSection = () => (
    <div style={sectionStyle}>
      <h4 style={sectionTitleStyle}>Add Candidate</h4>
      <input
        style={inputStyle}
        type="text"
        placeholder="Candidate Name"
        value={candidateForm.name}
        onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
      />
      <input
        style={inputStyle}
        type="text"
        placeholder="Party Name"
        value={candidateForm.party}
        onChange={(e) => setCandidateForm(prev => ({ ...prev, party: e.target.value }))}
      />
      <button
        style={primaryButtonStyle}
        onClick={() => handleAction('addCandidate', candidateForm)}
        disabled={loading || !candidateForm.name || !candidateForm.party}
      >
        {loading ? 'Adding...' : 'Add Candidate'}
      </button>
    </div>
  );

  const renderElectionSection = () => {
    if (!isUserCommissioner) return null;

    return (
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}>Election Management</h4>
        
        {!electionInfo?.isActive && (
          <>
            <input
              style={inputStyle}
              type="text"
              placeholder="Election Title"
              value={electionForm.title}
              onChange={(e) => setElectionForm(prev => ({ ...prev, title: e.target.value }))}
            />
            <input
              style={inputStyle}
              type="datetime-local"
              placeholder="Registration Deadline"
              value={electionForm.registrationDeadline}
              onChange={(e) => setElectionForm(prev => ({ ...prev, registrationDeadline: e.target.value }))}
            />
            <input
              style={inputStyle}
              type="datetime-local"
              placeholder="Voting Start Time"
              value={electionForm.startTime}
              onChange={(e) => setElectionForm(prev => ({ ...prev, startTime: e.target.value }))}
            />
            <input
              style={inputStyle}
              type="datetime-local"
              placeholder="Voting End Time"
              value={electionForm.endTime}
              onChange={(e) => setElectionForm(prev => ({ ...prev, endTime: e.target.value }))}
            />
            <button
              style={primaryButtonStyle}
              onClick={() => {
                const params = {
                  title: electionForm.title,
                  registrationDeadline: Math.floor(new Date(electionForm.registrationDeadline).getTime() / 1000),
                  startTime: Math.floor(new Date(electionForm.startTime).getTime() / 1000),
                  endTime: Math.floor(new Date(electionForm.endTime).getTime() / 1000)
                };
                handleAction('createElection', params);
              }}
              disabled={loading || !electionForm.title || !electionForm.registrationDeadline || !electionForm.startTime || !electionForm.endTime}
            >
              {loading ? 'Creating...' : 'Create Election'}
            </button>
          </>
        )}

        {electionInfo?.isActive && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              style={secondaryButtonStyle}
              onClick={() => handleAction('startVoting')}
              disabled={loading}
            >
              Start Voting
            </button>
            <button
              style={dangerButtonStyle}
              onClick={() => handleAction('endVoting')}
              disabled={loading}
            >
              End Voting
            </button>
            <button
              style={primaryButtonStyle}
              onClick={() => handleAction('finalizeElection')}
              disabled={loading}
            >
              Finalize Election
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderVoterSection = () => (
    <div style={sectionStyle}>
      <h4 style={sectionTitleStyle}>Register Voter</h4>
      <input
        style={inputStyle}
        type="text"
        placeholder="Voter Address (0x...)"
        value={voterAddress}
        onChange={(e) => setVoterAddress(e.target.value)}
      />
      <button
        style={secondaryButtonStyle}
        onClick={() => handleAction('registerVoter', { address: voterAddress })}
        disabled={loading || !voterAddress}
      >
        {loading ? 'Registering...' : 'Register Voter'}
      </button>
    </div>
  );

  const renderRoleSection = () => {
    if (!isUserCommissioner) return null;

    return (
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}>Role Management</h4>
        <input
          style={inputStyle}
          type="text"
          placeholder="User Address (0x...)"
          value={roleForm.address}
          onChange={(e) => setRoleForm(prev => ({ ...prev, address: e.target.value }))}
        />
        <select
          style={inputStyle}
          value={roleForm.role}
          onChange={(e) => setRoleForm(prev => ({ ...prev, role: parseInt(e.target.value) }))}
        >
          <option value={USER_ROLES.VOTER}>Voter</option>
          <option value={USER_ROLES.OBSERVER}>Observer</option>
          <option value={USER_ROLES.ADMIN}>Admin</option>
          {isUserOwner && <option value={USER_ROLES.COMMISSIONER}>Commissioner</option>}
        </select>
        <button
          style={primaryButtonStyle}
          onClick={() => handleAction('assignRole', roleForm)}
          disabled={loading || !roleForm.address}
        >
          {loading ? 'Assigning...' : 'Assign Role'}
        </button>
      </div>
    );
  };

  const renderSystemSection = () => {
    if (!isUserCommissioner) return null;

    return (
      <div style={sectionStyle}>
        <h4 style={sectionTitleStyle}>System Controls</h4>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            style={systemInfo.paused ? secondaryButtonStyle : dangerButtonStyle}
            onClick={() => handleAction('pauseSystem')}
            disabled={loading}
          >
            {systemInfo.paused ? 'Unpause System' : 'Pause System'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      <div style={headerStyle} onClick={() => setIsExpanded(!isExpanded)}>
        <h3 style={titleStyle}>
          🔧 Admin Panel
          {isUserCommissioner && ' (Commissioner)'}
          {isUserOwner && ' (Owner)'}
        </h3>
        <button style={buttonStyle}>
          {isExpanded ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>

      {isExpanded && (
        <div>
          {/* Messages */}
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#991b1b',
              marginBottom: '16px'
            }}>
              {error}
              <button
                style={{ float: 'right', background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer' }}
                onClick={clearMessages}
              >
                ✕
              </button>
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              color: '#166534',
              marginBottom: '16px'
            }}>
              {success}
              <button
                style={{ float: 'right', background: 'none', border: 'none', color: '#166534', cursor: 'pointer' }}
                onClick={clearMessages}
              >
                ✕
              </button>
            </div>
          )}

          {/* Admin Sections */}
          {renderCandidateSection()}
          {renderVoterSection()}
          {renderElectionSection()}
          {renderRoleSection()}
          {renderSystemSection()}

          {/* System Info */}
          <div style={sectionStyle}>
            <h4 style={sectionTitleStyle}>System Information</h4>
            <div style={{ fontSize: '0.875rem', color: COLORS.textLight }}>
              <div>Owner: {systemInfo.owner}</div>
              <div>Commissioner: {systemInfo.commissioner}</div>
              <div>System Paused: {systemInfo.paused ? 'Yes' : 'No'}</div>
              <div>Registration Open: {systemInfo.registrationOpen ? 'Yes' : 'No'}</div>
              <div>Voting Open: {systemInfo.votingOpen ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;