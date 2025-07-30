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
  // Individual loading states for each action type
  const [loadingStates, setLoadingStates] = useState({});
  
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

  // Don't render if user doesn't have admin privileges
  if (!isUserAdmin) {
    return null;
  }

  // Helper functions
  const setActionLoading = (action, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [action]: isLoading
    }));
  };

  const isActionLoading = (action) => {
    return loadingStates[action] || false;
  };

  const handleAction = async (action, params = {}) => {
    try {
      setActionLoading(action, true);

      let result;
      switch (action) {
        case 'addCandidate':
          result = await contractHook.addCandidate(params.name, params.party);
          setCandidateForm({ name: '', party: '' });
          break;

        case 'createElection':
          result = await contractHook.createElection(
            params.title,
            params.registrationDeadline,
            params.startTime,
            params.endTime
          );
          setElectionForm({ title: '', registrationDeadline: '', startTime: '', endTime: '' });
          break;

        case 'registerVoter':
          result = await contractHook.registerVoter(params.address);
          setVoterAddress('');
          break;

        case 'startVoting':
          result = await contractHook.startVoting();
          break;

        case 'endVoting':
          result = await contractHook.endVoting();
          break;

        case 'finalizeElection':
          result = await contractHook.finalizeElection();
          break;

        case 'pauseSystem':
          result = await contractHook.pauseSystem();
          break;

        case 'assignRole':
          result = await contractHook.assignRole(params.address, params.role);
          setRoleForm({ address: '', role: USER_ROLES.VOTER });
          break;

        default:
          throw new Error('Unknown action');
      }

      if (result && result.wait) {
        await result.wait();
      }

      if (onRefreshData) {
        setTimeout(onRefreshData, 2000);
      }

    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      throw error; // Let parent handle the error display
    } finally {
      setActionLoading(action, false);
    }
  };

  // Grid layout style matching your app's pattern
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  // Shared card style following the app pattern
  const cardStyle = {
    background: COLORS.backgroundLight,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    height: 'fit-content'
  };

  const titleStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: COLORS.text,
    margin: '0 0 8px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const subtitleStyle = {
    fontSize: '0.875rem',
    color: COLORS.textLight,
    marginBottom: '16px',
    lineHeight: '1.4'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: `1px solid ${COLORS.border}`,
    borderRadius: '6px',
    fontSize: '1rem',
    marginBottom: '12px',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  const buttonStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginRight: '8px',
    marginBottom: '8px'
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

  const successButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.success || COLORS.primary,
    color: 'white'
  };

  const infoRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: `1px solid ${COLORS.border}`
  };

  const infoRowLastStyle = {
    ...infoRowStyle,
    borderBottom: 'none'
  };

  const labelStyle = {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: COLORS.text
  };

  const valueStyle = {
    fontSize: '0.875rem',
    color: COLORS.textLight,
    fontFamily: 'monospace'
  };

  const statusValueStyle = {
    fontSize: '0.875rem',
    fontWeight: '600',
    fontFamily: 'inherit'
  };

  // Build cards array for admin functions
  const adminCards = [];

  // Add Candidate Card
  adminCards.push(
    <div key="add-candidate" style={cardStyle}>
      <h3 style={titleStyle}>
        👤 Add Candidate
      </h3>
      <p style={subtitleStyle}>
        Add a new candidate to the current election
      </p>
      <input
        style={inputStyle}
        type="text"
        placeholder="Enter candidate's full name"
        value={candidateForm.name}
        onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
      />
      <input
        style={inputStyle}
        type="text"
        placeholder="Enter party name or affiliation"
        value={candidateForm.party}
        onChange={(e) => setCandidateForm(prev => ({ ...prev, party: e.target.value }))}
      />
      <button
        style={{
          ...primaryButtonStyle,
          opacity: (isActionLoading('addCandidate') || !candidateForm.name || !candidateForm.party) ? 0.6 : 1,
          marginRight: '0'
        }}
        onClick={() => handleAction('addCandidate', candidateForm)}
        disabled={isActionLoading('addCandidate') || !candidateForm.name || !candidateForm.party}
      >
        {isActionLoading('addCandidate') ? 'Adding...' : 'Add Candidate'}
      </button>
    </div>
  );

  // Register Voter Card
  adminCards.push(
    <div key="register-voter" style={cardStyle}>
      <h3 style={titleStyle}>
        🗳️ Register Voter
      </h3>
      <p style={subtitleStyle}>
        Register a new voter by their wallet address
      </p>
      <input
        style={inputStyle}
        type="text"
        placeholder="0x1234567890abcdef..."
        value={voterAddress}
        onChange={(e) => setVoterAddress(e.target.value)}
      />
      <button
        style={{
          ...secondaryButtonStyle,
          opacity: (isActionLoading('registerVoter') || !voterAddress) ? 0.6 : 1,
          marginRight: '0'
        }}
        onClick={() => handleAction('registerVoter', { address: voterAddress })}
        disabled={isActionLoading('registerVoter') || !voterAddress}
      >
        {isActionLoading('registerVoter') ? 'Registering...' : 'Register Voter'}
      </button>
    </div>
  );

  // System Status Card (always show)
  adminCards.push(
    <div key="system-status" style={cardStyle}>
      <h3 style={titleStyle}>
        📊 System Status
      </h3>
      <p style={subtitleStyle}>
        Current system information and contract details
      </p>
      
      <div style={infoRowStyle}>
        <span style={labelStyle}>Contract Owner</span>
        <span style={valueStyle}>
          {systemInfo.owner?.slice(0, 6)}...{systemInfo.owner?.slice(-4)}
        </span>
      </div>
      
      <div style={infoRowStyle}>
        <span style={labelStyle}>Commissioner</span>
        <span style={valueStyle}>
          {systemInfo.commissioner?.slice(0, 6)}...{systemInfo.commissioner?.slice(-4)}
        </span>
      </div>
      
      <div style={infoRowStyle}>
        <span style={labelStyle}>System Status</span>
        <span style={{
          ...statusValueStyle,
          color: systemInfo.paused ? COLORS.danger : COLORS.success || COLORS.primary
        }}>
          {systemInfo.paused ? 'PAUSED' : 'ACTIVE'}
        </span>
      </div>
      
      <div style={infoRowStyle}>
        <span style={labelStyle}>Registration</span>
        <span style={{
          ...statusValueStyle,
          color: systemInfo.registrationOpen ? COLORS.success || COLORS.primary : COLORS.textLight
        }}>
          {systemInfo.registrationOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
      
      <div style={infoRowLastStyle}>
        <span style={labelStyle}>Voting</span>
        <span style={{
          ...statusValueStyle,
          color: systemInfo.votingOpen ? COLORS.success || COLORS.primary : COLORS.textLight
        }}>
          {systemInfo.votingOpen ? 'OPEN' : 'CLOSED'}
        </span>
      </div>
    </div>
  );

  // Commissioner-only cards
  if (isUserCommissioner) {
    // Election Creation Card (only when no active election)
    if (!electionInfo?.isActive) {
      adminCards.push(
        <div key="create-election" style={cardStyle}>
          <h3 style={titleStyle}>
            🏛️ Create Election
          </h3>
          <p style={subtitleStyle}>
            Set up a new election with voting schedule (Commissioner Only)
          </p>
          <input
            style={inputStyle}
            type="text"
            placeholder="Election title"
            value={electionForm.title}
            onChange={(e) => setElectionForm(prev => ({ ...prev, title: e.target.value }))}
          />
          <input
            style={inputStyle}
            type="datetime-local"
            title="Registration Deadline"
            value={electionForm.registrationDeadline}
            onChange={(e) => setElectionForm(prev => ({ ...prev, registrationDeadline: e.target.value }))}
          />
          <input
            style={inputStyle}
            type="datetime-local"
            title="Voting Start Time"
            value={electionForm.startTime}
            onChange={(e) => setElectionForm(prev => ({ ...prev, startTime: e.target.value }))}
          />
          <input
            style={inputStyle}
            type="datetime-local"
            title="Voting End Time"
            value={electionForm.endTime}
            onChange={(e) => setElectionForm(prev => ({ ...prev, endTime: e.target.value }))}
          />
          <button
            style={{
              ...primaryButtonStyle,
              opacity: (isActionLoading('createElection') || !electionForm.title || !electionForm.registrationDeadline || !electionForm.startTime || !electionForm.endTime) ? 0.6 : 1,
              marginRight: '0'
            }}
            onClick={() => {
              const params = {
                title: electionForm.title,
                registrationDeadline: Math.floor(new Date(electionForm.registrationDeadline).getTime() / 1000),
                startTime: Math.floor(new Date(electionForm.startTime).getTime() / 1000),
                endTime: Math.floor(new Date(electionForm.endTime).getTime() / 1000)
              };
              handleAction('createElection', params);
            }}
            disabled={isActionLoading('createElection') || !electionForm.title || !electionForm.registrationDeadline || !electionForm.startTime || !electionForm.endTime}
          >
            {isActionLoading('createElection') ? 'Creating...' : 'Create Election'}
          </button>
        </div>
      );
    }

    // Election Control Card (only when election is active)
    if (electionInfo?.isActive) {
      adminCards.push(
        <div key="election-controls" style={cardStyle}>
          <h3 style={titleStyle}>
            ⚡ Election Controls
          </h3>
          <p style={subtitleStyle}>
            Control the current election state (Commissioner Only)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              style={{
                ...successButtonStyle,
                opacity: isActionLoading('startVoting') ? 0.6 : 1,
                marginRight: '0',
                marginBottom: '0'
              }}
              onClick={() => handleAction('startVoting')}
              disabled={isActionLoading('startVoting')}
            >
              {isActionLoading('startVoting') ? 'Starting...' : 'Start Voting'}
            </button>
            <button
              style={{
                ...dangerButtonStyle,
                opacity: isActionLoading('endVoting') ? 0.6 : 1,
                marginRight: '0',
                marginBottom: '0'
              }}
              onClick={() => handleAction('endVoting')}
              disabled={isActionLoading('endVoting')}
            >
              {isActionLoading('endVoting') ? 'Ending...' : 'End Voting'}
            </button>
            <button
              style={{
                ...primaryButtonStyle,
                opacity: isActionLoading('finalizeElection') ? 0.6 : 1,
                marginRight: '0',
                marginBottom: '0'
              }}
              onClick={() => handleAction('finalizeElection')}
              disabled={isActionLoading('finalizeElection')}
            >
              {isActionLoading('finalizeElection') ? 'Finalizing...' : 'Finalize Election'}
            </button>
          </div>
        </div>
      );
    }

    // Role Management Card
    adminCards.push(
      <div key="role-management" style={cardStyle}>
        <h3 style={titleStyle}>
          🔐 Assign User Role
        </h3>
        <p style={subtitleStyle}>
          Assign or change user roles and permissions (Commissioner Only)
        </p>
        <input
          style={inputStyle}
          type="text"
          placeholder="0x1234567890abcdef..."
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
          style={{
            ...primaryButtonStyle,
            opacity: (isActionLoading('assignRole') || !roleForm.address) ? 0.6 : 1,
            marginRight: '0'
          }}
          onClick={() => handleAction('assignRole', roleForm)}
          disabled={isActionLoading('assignRole') || !roleForm.address}
        >
          {isActionLoading('assignRole') ? 'Assigning...' : 'Assign Role'}
        </button>
      </div>
    );

    // System Control Card
    adminCards.push(
      <div key="system-control" style={cardStyle}>
        <h3 style={titleStyle}>
          🛡️ System Control
        </h3>
        <p style={subtitleStyle}>
          {systemInfo.paused 
            ? 'System is currently paused. Click to resume normal operations (Commissioner Only)' 
            : 'Emergency pause to halt all system operations if needed (Commissioner Only)'}
        </p>
        <button
          style={{
            ...(systemInfo.paused ? successButtonStyle : dangerButtonStyle),
            opacity: isActionLoading('pauseSystem') ? 0.6 : 1,
            marginRight: '0'
          }}
          onClick={() => handleAction('pauseSystem')}
          disabled={isActionLoading('pauseSystem')}
        >
          {isActionLoading('pauseSystem') 
            ? (systemInfo.paused ? 'Resuming...' : 'Pausing...') 
            : (systemInfo.paused ? 'Resume System' : 'Pause System')
          }
        </button>
      </div>
    );
  }

  return (
    <div style={gridStyle}>
      {adminCards}
    </div>
  );
};

export default AdminPanel;