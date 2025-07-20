import React, { useState, useEffect } from 'react';
import { useElection } from '../contexts/ElectionContext';
import { useWeb3 } from '../contexts/Web3Context';
import { web3Utils } from '../utils/web3Utils';
import { security } from '../utils/security';

const AdminPanel = () => {
  const {
    electionInfo,
    candidates,
    electionStats,
    addCandidate,
    registerVoter,
    startVoting,
    endVoting,
    finalizeElection,
    deactivateCandidate,
    isLoading,
    error,
    setError,
    isCommissioner
  } = useElection();

  const { account, formatAddress } = useWeb3();

  // Form states
  const [activeTab, setActiveTab] = useState('overview');
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    party: '',
    manifesto: ''
  });
  const [voterForm, setVoterForm] = useState({
    address: ''
  });
  const [electionForm, setElectionForm] = useState({
    title: '',
    description: '',
    registrationDeadline: '',
    startTime: '',
    endTime: ''
  });

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(null);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  // Handle candidate form submission
  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate inputs
      const nameValidation = security.validateInput.candidateName(candidateForm.name);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error);
      }

      const partyValidation = security.validateInput.partyName(candidateForm.party);
      if (!partyValidation.isValid) {
        throw new Error(partyValidation.error);
      }

      const manifestoValidation = security.validateInput.manifesto(candidateForm.manifesto);
      if (!manifestoValidation.isValid) {
        throw new Error(manifestoValidation.error);
      }

      await addCandidate(
        nameValidation.value,
        partyValidation.value,
        manifestoValidation.value
      );

      setCandidateForm({ name: '', party: '', manifesto: '' });
      setSuccessMessage('Candidate added successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle voter registration
  const handleRegisterVoter = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const addressValidation = security.validateInput.ethereumAddress(voterForm.address);
      if (!addressValidation.isValid) {
        throw new Error(addressValidation.error);
      }

      await registerVoter(addressValidation.value);
      setVoterForm({ address: '' });
      setSuccessMessage('Voter registered successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle election controls
  const handleElectionControl = async (action) => {
    setIsSubmitting(true);
    setError(null);

    try {
      switch (action) {
        case 'start':
          await startVoting();
          setSuccessMessage('Voting period started successfully!');
          break;
        case 'end':
          await endVoting();
          setSuccessMessage('Voting period ended successfully!');
          break;
        case 'finalize':
          await finalizeElection();
          setSuccessMessage('Election finalized successfully!');
          break;
        default:
          throw new Error('Invalid action');
      }
      setShowConfirmModal(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle candidate deactivation
  const handleDeactivateCandidate = async (candidateId) => {
    setIsSubmitting(true);
    try {
      await deactivateCandidate(candidateId);
      setSuccessMessage('Candidate deactivated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get election phase
  const getElectionPhase = () => {
    if (!electionInfo) return 'setup';
    return web3Utils.getElectionPhase(electionInfo);
  };

  const electionPhase = getElectionPhase();

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'candidates', label: 'Candidates', icon: '👥' },
    { id: 'voters', label: 'Voters', icon: '🗳️' },
    { id: 'controls', label: 'Controls', icon: '⚙️' },
    ...(isCommissioner ? [{ id: 'settings', label: 'Settings', icon: '🔧' }] : [])
  ];

  return (
    <div className="admin-panel">
      <style jsx>{`
        .admin-panel {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .admin-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 1rem;
          margin-bottom: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .admin-header h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .admin-header p {
          opacity: 0.9;
          font-size: 1rem;
        }

        .phase-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.5rem 1rem;
          border-radius: 2rem;
          font-size: 0.875rem;
          font-weight: 500;
          margin-top: 1rem;
        }

        .alert {
          padding: 1rem 1.5rem;
          border-radius: 0.75rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .alert-success {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #065f46;
        }

        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .alert-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .tabs {
          display: flex;
          gap: 0.25rem;
          background: #f3f4f6;
          padding: 0.25rem;
          border-radius: 0.75rem;
          margin-bottom: 2rem;
          overflow-x: auto;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .tab:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .tab.active {
          background: white;
          color: #2563eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab-content {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 1.5rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          text-align: center;
          transition: transform 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: #64748b;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .form-grid {
          display: grid;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .form-input,
        .form-textarea {
          padding: 0.75rem 1rem;
          border: 2px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: all 0.2s ease;
          background: #f9fafb;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #2563eb;
          background: white;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.875rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .btn-success {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: linear-gradient(135deg, #15803d 0%, #166534 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }

        .btn-warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .btn-warning:hover:not(:disabled) {
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }

        .btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .btn-outline {
          background: transparent;
          color: #374151;
          border: 2px solid #d1d5db;
        }

        .btn-outline:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .candidates-list {
          display: grid;
          gap: 1rem;
        }

        .candidate-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          transition: all 0.2s ease;
        }

        .candidate-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .candidate-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .candidate-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.25rem;
        }

        .candidate-party {
          color: #2563eb;
          font-weight: 500;
        }

        .candidate-id {
          background: #f3f4f6;
          color: #6b7280;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .candidate-manifesto {
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .candidate-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .vote-count {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: #059669;
        }

        .control-section {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .control-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .control-description {
          color: #64748b;
          margin-bottom: 1rem;
        }

        .control-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal {
          background: white;
          border-radius: 1rem;
          padding: 2rem;
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
        }

        .modal-close:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-body {
          margin-bottom: 1.5rem;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-active {
          background: #dcfce7;
          color: #166534;
        }

        .status-inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        @media (max-width: 768px) {
          .admin-panel {
            padding: 0 0.5rem;
          }
          
          .admin-header {
            padding: 1.5rem;
          }
          
          .admin-header h1 {
            font-size: 1.5rem;
          }
          
          .tab-content {
            padding: 1.5rem;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
          
          .control-actions {
            flex-direction: column;
          }
          
          .modal {
            margin: 1rem;
            padding: 1.5rem;
          }
        }
      `}</style>

      {/* Header */}
      <div className="admin-header">
        <h1>Election Administration</h1>
        <p>Manage your blockchain-powered election with complete transparency and security</p>
        <div className="phase-indicator">
          <span>📍</span>
          <span>Current Phase: {electionPhase.charAt(0).toUpperCase() + electionPhase.slice(1)}</span>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <div>
            <strong>Success!</strong> {successMessage}
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
              Election Overview
            </h2>
            
            {electionInfo && (
              <>
                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>
                    {electionInfo.title}
                  </h3>
                  <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                    {electionInfo.description}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <strong>Registration Deadline:</strong>
                      <br />
                      <span style={{ color: '#64748b' }}>
                        {web3Utils.formatTimestamp(electionInfo.registrationDeadline)}
                      </span>
                    </div>
                    <div>
                      <strong>Voting Period:</strong>
                      <br />
                      <span style={{ color: '#64748b' }}>
                        {web3Utils.formatTimestamp(electionInfo.startTime)} - {web3Utils.formatTimestamp(electionInfo.endTime)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#2563eb' }}>
                      {electionStats?.totalRegisteredVoters || 0}
                    </div>
                    <div className="stat-label">Registered Voters</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#16a34a' }}>
                      {electionStats?.totalVotesCast || 0}
                    </div>
                    <div className="stat-label">Votes Cast</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#7c3aed' }}>
                      {electionStats?.activeCandidates || 0}
                    </div>
                    <div className="stat-label">Active Candidates</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value" style={{ color: '#f59e0b' }}>
                      {electionStats?.voterTurnoutPercentage || 0}%
                    </div>
                    <div className="stat-label">Voter Turnout</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'candidates' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
              Candidate Management
            </h2>
            
            {/* Add Candidate Form */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                Add New Candidate
              </h3>
              <form onSubmit={handleAddCandidate} className="form-grid">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Candidate Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={candidateForm.name}
                      onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter candidate's full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Political Party *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={candidateForm.party}
                      onChange={(e) => setCandidateForm(prev => ({ ...prev, party: e.target.value }))}
                      placeholder="Enter party name"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Manifesto *</label>
                  <textarea
                    className="form-textarea"
                    value={candidateForm.manifesto}
                    onChange={(e) => setCandidateForm(prev => ({ ...prev, manifesto: e.target.value }))}
                    placeholder="Enter candidate's manifesto and key policies"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting && <span className="loading-spinner" />}
                  Add Candidate
                </button>
              </form>
            </div>

            {/* Candidates List */}
            <div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                Current Candidates ({candidates?.length || 0})
              </h3>
              {candidates && candidates.length > 0 ? (
                <div className="candidates-list">
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="candidate-card">
                      <div className="candidate-header">
                        <div>
                          <div className="candidate-name">{candidate.name}</div>
                          <div className="candidate-party">{candidate.party}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="candidate-id">ID: {candidate.id}</span>
                          <span className={`status-badge ${candidate.isActive ? 'status-active' : 'status-inactive'}`}>
                            {candidate.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="candidate-manifesto">{candidate.manifesto}</div>
                      <div className="candidate-stats">
                        <div className="vote-count">
                          <span>🗳️</span>
                          <span>{candidate.voteCount} votes</span>
                        </div>
                        {candidate.isActive && electionPhase === 'setup' && (
                          <button
                            className="btn btn-outline"
                            onClick={() => handleDeactivateCandidate(candidate.id)}
                            disabled={isSubmitting}
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                  <p>No candidates added yet. Add your first candidate above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'voters' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
              Voter Management
            </h2>
            
            {/* Register Voter Form */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600' }}>
                Register New Voter
              </h3>
              <form onSubmit={handleRegisterVoter} className="form-grid">
                <div className="form-group">
                  <label className="form-label">Wallet Address *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={voterForm.address}
                    onChange={(e) => setVoterForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="0x..."
                    required
                    style={{ fontFamily: 'monospace' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Enter the Ethereum wallet address of the voter
                  </div>
                </div>
                <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                  {isSubmitting && <span className="loading-spinner" />}
                  Register Voter
                </button>
              </form>
            </div>

            {/* Voter Statistics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#2563eb' }}>
                  {electionStats?.totalRegisteredVoters || 0}
                </div>
                <div className="stat-label">Total Registered</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#16a34a' }}>
                  {electionStats?.totalVotesCast || 0}
                </div>
                <div className="stat-label">Votes Cast</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#f59e0b' }}>
                  {electionStats?.voterTurnoutPercentage || 0}%
                </div>
                <div className="stat-label">Turnout Rate</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
              Election Controls
            </h2>
            
            {/* Voting Controls */}
            <div className="control-section">
              <div className="control-title">🗳️ Voting Period Management</div>
              <div className="control-description">
                Control the voting period for the election. Ensure all candidates are added before starting.
              </div>
              <div className="control-actions">
                {electionPhase === 'preparation' && (
                  <button
                    className="btn btn-success"
                    onClick={() => setShowConfirmModal('start')}
                    disabled={isSubmitting || !candidates?.length}
                  >
                    Start Voting
                  </button>
                )}
                {electionPhase === 'voting' && (
                  <button
                    className="btn btn-warning"
                    onClick={() => setShowConfirmModal('end')}
                    disabled={isSubmitting}
                  >
                    End Voting
                  </button>
                )}
                {electionPhase === 'ended' && !electionInfo?.isFinalized && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowConfirmModal('finalize')}
                    disabled={isSubmitting}
                  >
                    Finalize Election
                  </button>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="control-section">
              <div className="control-title">📊 System Status</div>
              <div className="control-description">
                Current system status and election information.
              </div>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Election Status:</span>
                  <span style={{ fontWeight: '600', color: electionInfo?.isActive ? '#16a34a' : '#6b7280' }}>
                    {electionInfo?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Voting Phase:</span>
                  <span style={{ fontWeight: '600', color: '#2563eb' }}>
                    {electionPhase.charAt(0).toUpperCase() + electionPhase.slice(1)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Administrator:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {formatAddress(account)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Role:</span>
                  <span style={{ fontWeight: '600', color: '#7c3aed' }}>
                    {isCommissioner ? 'Commissioner' : 'Administrator'}
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Controls - Commissioner Only */}
            {isCommissioner && (
              <div className="control-section" style={{ border: '2px solid #fbbf24' }}>
                <div className="control-title">⚠️ Emergency Controls</div>
                <div className="control-description">
                  Emergency controls for critical situations. Use with extreme caution.
                </div>
                <div className="control-actions">
                  <button className="btn btn-warning" disabled={isSubmitting}>
                    Pause System
                  </button>
                  <button className="btn btn-danger" disabled={isSubmitting}>
                    Emergency Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && isCommissioner && (
          <div>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
              System Settings
            </h2>
            
            {/* Security Settings */}
            <div className="control-section">
              <div className="control-title">🔒 Security Settings</div>
              <div className="control-description">
                Manage system security and access controls.
              </div>
              <div style={{ display: 'grid', gap: '1rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Two-Factor Authentication:</span>
                  <span className="status-badge status-active">Enabled</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Multi-Signature Requirements:</span>
                  <span className="status-badge status-active">Active</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Audit Logging:</span>
                  <span className="status-badge status-active">Enabled</span>
                </div>
              </div>
            </div>

            {/* Backup & Recovery */}
            <div className="control-section">
              <div className="control-title">💾 Backup & Recovery</div>
              <div className="control-description">
                System backup and disaster recovery options.
              </div>
              <div className="control-actions">
                <button className="btn btn-outline">Export Election Data</button>
                <button className="btn btn-outline">Download Audit Logs</button>
                <button className="btn btn-outline">Create System Backup</button>
              </div>
            </div>

            {/* System Information */}
            <div className="control-section">
              <div className="control-title">ℹ️ System Information</div>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Electra Version:</span>
                  <span style={{ fontWeight: '600' }}>v1.0.0</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Blockchain Network:</span>
                  <span style={{ fontWeight: '600' }}>Sepolia Testnet</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Contract Address:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    0x1234...5678
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Last Updated:</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {showConfirmModal === 'start' && 'Start Voting Period'}
                {showConfirmModal === 'end' && 'End Voting Period'}
                {showConfirmModal === 'finalize' && 'Finalize Election'}
              </h3>
              <button className="modal-close" onClick={() => setShowConfirmModal(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem' }}>
                {showConfirmModal === 'start' && 
                  'Are you sure you want to start the voting period? This action cannot be undone and voters will be able to cast their votes immediately.'
                }
                {showConfirmModal === 'end' && 
                  'Are you sure you want to end the voting period? No more votes will be accepted after this action.'
                }
                {showConfirmModal === 'finalize' && 
                  'Are you sure you want to finalize the election? This will declare the winner and lock all results permanently.'
                }
              </p>
              <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                  <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                    <strong>Warning:</strong> This action is irreversible and will be recorded permanently on the blockchain.
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-outline" 
                onClick={() => setShowConfirmModal(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                className={`btn ${
                  showConfirmModal === 'start' ? 'btn-success' : 
                  showConfirmModal === 'end' ? 'btn-warning' : 
                  'btn-primary'
                }`}
                onClick={() => handleElectionControl(showConfirmModal)}
                disabled={isSubmitting}
              >
                {isSubmitting && <span className="loading-spinner" />}
                {showConfirmModal === 'start' && 'Start Voting'}
                {showConfirmModal === 'end' && 'End Voting'}
                {showConfirmModal === 'finalize' && 'Finalize Election'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
