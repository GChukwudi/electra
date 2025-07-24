import React, { useState, useCallback } from 'react';
import { useWallet } from './hooks/useWallet.js';
import { useContract } from './hooks/useContract.js';
import { useElectionData } from './hooks/useElectionData.js';

// Components
import Header from './components/Header.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import ElectionOverview from './components/ElectionOverview.jsx';
import VoterStatus from './components/VoterStatus.jsx';
import CurrentLeader from './components/CurrentLeader.jsx';
import CandidatesList from './components/CandidatesList.jsx';
import AdminPanel from './components/AdminPanel.jsx';

// Utils
import { COLORS } from './utils/constants.js';
import { parseContractError } from './utils/web3.js';

function App() {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Hooks
  const wallet = useWallet();
  const contractHook = useContract(wallet.provider, wallet.account);
  const electionData = useElectionData(contractHook, wallet.account);

  // Styles
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: COLORS.background,
    minHeight: '100vh'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  };

  const alertStyle = {
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid'
  };

  const errorAlertStyle = {
    ...alertStyle,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    color: '#991b1b'
  };

  const successAlertStyle = {
    ...alertStyle,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    color: '#166534'
  };

  const welcomeCardStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: '12px',
    border: `1px solid ${COLORS.border}`,
    marginTop: '40px'
  };

  const networkErrorCardStyle = {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: '#fef2f2',
    borderRadius: '12px',
    border: `2px solid ${COLORS.danger}`,
    marginTop: '40px'
  };

  const footerStyle = {
    marginTop: '40px',
    padding: '20px',
    textAlign: 'center',
    borderTop: `1px solid ${COLORS.border}`,
    color: COLORS.textLight,
    fontSize: '0.875rem'
  };

  const buttonStyle = {
    padding: '16px 32px',
    fontSize: '1.125rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.primary,
    color: 'white'
  };

  const warningButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.warning,
    color: 'white'
  };

  // Clear messages after 5 seconds
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle voter registration
  const handleRegisterVoter = useCallback(async () => {
    try {
      setIsRegistering(true);
      setError('');
      
      const tx = await contractHook.selfRegister();
      setSuccess('Registration transaction sent! Please wait for confirmation...');
      
      await tx.wait();
      setSuccess('Successfully registered to vote!');
      
      // Refresh election data
      setTimeout(() => {
        electionData.loadElectionData();
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(parseContractError(error));
    } finally {
      setIsRegistering(false);
    }
  }, [contractHook, electionData]);

  // Handle voting
  const handleVote = useCallback(async () => {
    if (!selectedCandidate) return;

    try {
      setIsVoting(true);
      setError('');
      
      const tx = await contractHook.vote(selectedCandidate.id);
      setSuccess('Vote transaction sent! Please wait for confirmation...');
      
      await tx.wait();
      setSuccess(`Successfully voted for ${selectedCandidate.name}!`);
      
      // Clear selection and refresh data
      setSelectedCandidate(null);
      setTimeout(() => {
        electionData.loadElectionData();
      }, 2000);
      
    } catch (error) {
      console.error('Voting error:', error);
      setError(parseContractError(error));
    } finally {
      setIsVoting(false);
    }
  }, [contractHook, selectedCandidate, electionData]);

  // Handle candidate selection
  const handleCandidateSelect = useCallback((candidate) => {
    setSelectedCandidate(candidate);
  }, []);

  // Handle data refresh
  const handleRefreshData = useCallback(() => {
    electionData.loadElectionData();
  }, [electionData]);

  // Clear error messages
  const clearError = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  // Clear all messages
  const clearAllMessages = useCallback(() => {
    setError('');
    setSuccess('');
    wallet.clearError();
    electionData.clearError();
  }, [wallet, electionData]);

  // Show loading spinner during initial load
  if (electionData.loading && !electionData.hasElection) {
    return (
      <div style={containerStyle}>
        <Header
          account={wallet.account}
          balance={wallet.balance}
          isConnected={wallet.isConnected}
          isConnecting={wallet.isConnecting}
          connectWallet={wallet.connectWallet}
          disconnectWallet={wallet.disconnectWallet}
          isCorrectNetwork={wallet.isCorrectNetwork}
          switchToCorrectNetwork={wallet.switchToCorrectNetwork}
        />
        <LoadingSpinner message="Loading Electra Voting System..." size="large" />
      </div>
    );
  }

  // Show wallet connection prompt if not connected
  if (!wallet.isConnected) {
    return (
      <div style={containerStyle}>
        <Header
          account={wallet.account}
          balance={wallet.balance}
          isConnected={wallet.isConnected}
          isConnecting={wallet.isConnecting}
          connectWallet={wallet.connectWallet}
          disconnectWallet={wallet.disconnectWallet}
          isCorrectNetwork={wallet.isCorrectNetwork}
          switchToCorrectNetwork={wallet.switchToCorrectNetwork}
        />
        
        <div style={welcomeCardStyle}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '24px'
          }}>
            🗳️
          </div>
          <h2 style={{
            fontSize: '2.5rem',
            color: COLORS.text,
            marginBottom: '16px',
            fontWeight: 'bold'
          }}>
            Welcome to Electra
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: COLORS.textLight,
            marginBottom: '8px',
            fontWeight: '500'
          }}>
            Secure Blockchain Voting System
          </p>
          <p style={{
            fontSize: '1.125rem',
            color: COLORS.textLight,
            marginBottom: '40px',
            maxWidth: '600px',
            margin: '0 auto 40px auto',
            lineHeight: '1.6'
          }}>
            Connect your MetaMask wallet to participate in transparent, secure, and decentralized elections powered by blockchain technology.
          </p>
          
          <button
            style={primaryButtonStyle}
            onClick={wallet.connectWallet}
            disabled={wallet.isConnecting}
            onMouseOver={(e) => !wallet.isConnecting && (e.target.style.backgroundColor = COLORS.primaryHover)}
            onMouseOut={(e) => !wallet.isConnecting && (e.target.style.backgroundColor = COLORS.primary)}
          >
            {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          
          {!wallet.isMetaMaskInstalled && (
            <div style={{
              marginTop: '32px',
              padding: '20px',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
              color: '#92400e',
              maxWidth: '500px',
              margin: '32px auto 0 auto'
            }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '12px',
                fontSize: '1.125rem'
              }}>
                ⚠️ MetaMask Not Detected
              </div>
              <div style={{ 
                fontSize: '1rem',
                lineHeight: '1.5',
                marginBottom: '16px'
              }}>
                Please install the MetaMask browser extension to use this application.
              </div>
              <a 
                href="https://metamask.io" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#92400e', 
                  textDecoration: 'underline',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                Download MetaMask →
              </a>
            </div>
          )}

          {/* Features Section */}
          <div style={{
            marginTop: '60px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            maxWidth: '800px',
            margin: '60px auto 0 auto'
          }}>
            <div style={{
              padding: '24px',
              backgroundColor: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔐</div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                color: COLORS.text, 
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                Secure Voting
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: COLORS.textLight,
                lineHeight: '1.4'
              }}>
                Cryptographically secured votes recorded immutably on the blockchain
              </p>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                color: COLORS.text, 
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                Transparent Results
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: COLORS.textLight,
                lineHeight: '1.4'
              }}>
                Real-time vote counting with publicly verifiable results
              </p>
            </div>

            <div style={{
              padding: '24px',
              backgroundColor: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚡</div>
              <h3 style={{ 
                fontSize: '1.125rem', 
                color: COLORS.text, 
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                Instant Access
              </h3>
              <p style={{ 
                fontSize: '0.875rem', 
                color: COLORS.textLight,
                lineHeight: '1.4'
              }}>
                Vote from anywhere with just your wallet and an internet connection
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show network error if on wrong network
  if (!wallet.isCorrectNetwork) {
    return (
      <div style={containerStyle}>
        <Header
          account={wallet.account}
          balance={wallet.balance}
          isConnected={wallet.isConnected}
          isConnecting={wallet.isConnecting}
          connectWallet={wallet.connectWallet}
          disconnectWallet={wallet.disconnectWallet}
          isCorrectNetwork={wallet.isCorrectNetwork}
          switchToCorrectNetwork={wallet.switchToCorrectNetwork}
        />
        
        <div style={networkErrorCardStyle}>
          <div style={{
            fontSize: '4rem',
            marginBottom: '24px'
          }}>
            ⚠️
          </div>
          <h2 style={{
            fontSize: '2.5rem',
            color: COLORS.danger,
            marginBottom: '16px',
            fontWeight: 'bold'
          }}>
            Wrong Network
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: COLORS.textLight,
            marginBottom: '16px'
          }}>
            This application requires Sepolia testnet
          </p>
          <p style={{
            fontSize: '1.125rem',
            color: COLORS.textLight,
            marginBottom: '40px',
            maxWidth: '500px',
            margin: '0 auto 40px auto'
          }}>
            Please switch to Sepolia testnet to use the Electra voting system. The contract is deployed on Sepolia for testing purposes.
          </p>
          
          <button
            style={warningButtonStyle}
            onClick={wallet.switchToCorrectNetwork}
            onMouseOver={(e) => e.target.style.backgroundColor = '#b45309'}
            onMouseOut={(e) => e.target.style.backgroundColor = COLORS.warning}
          >
            Switch to Sepolia Testnet
          </button>

          <div style={{
            marginTop: '32px',
            padding: '20px',
            backgroundColor: '#eff6ff',
            border: '1px solid #3b82f6',
            borderRadius: '12px',
            color: '#1e40af',
            maxWidth: '500px',
            margin: '32px auto 0 auto'
          }}>
            <div style={{ 
              fontWeight: '600', 
              marginBottom: '8px',
              fontSize: '1rem'
            }}>
              Need Sepolia ETH?
            </div>
            <div style={{ fontSize: '0.875rem', marginBottom: '12px' }}>
              Get free testnet ETH from these faucets:
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a 
                href="https://sepoliafaucet.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#1e40af', 
                  textDecoration: 'underline',
                  fontSize: '0.875rem'
                }}
              >
                Sepolia Faucet
              </a>
              <a 
                href="https://faucet.sepolia.dev" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  color: '#1e40af', 
                  textDecoration: 'underline',
                  fontSize: '0.875rem'
                }}
              >
                Alchemy Faucet
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <Header
        account={wallet.account}
        balance={wallet.balance}
        isConnected={wallet.isConnected}
        isConnecting={wallet.isConnecting}
        connectWallet={wallet.connectWallet}
        disconnectWallet={wallet.disconnectWallet}
        isCorrectNetwork={wallet.isCorrectNetwork}
        switchToCorrectNetwork={wallet.switchToCorrectNetwork}
      />

      {/* Alerts */}
      {(error || wallet.error || electionData.error) && (
        <div style={errorAlertStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, paddingRight: '16px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Error
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {error || wallet.error || electionData.error}
              </div>
            </div>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#991b1b',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0',
                lineHeight: '1'
              }}
              onClick={clearAllMessages}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {success && (
        <div style={successAlertStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, paddingRight: '16px' }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Success
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                {success}
              </div>
            </div>
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#166534',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0',
                lineHeight: '1'
              }}
              onClick={() => setSuccess('')}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {wallet.isConnected && contractHook.isContractReady ? (
        <>
          {/* Election Overview */}
          <ElectionOverview
            electionInfo={electionData.electionInfo}
            electionStatus={electionData.electionStatus}
            candidates={electionData.candidates}
            systemInfo={electionData.systemInfo}
          />

          {/* Grid Layout for Status Cards */}
          <div style={gridStyle}>
            {/* Voter Status */}
            <VoterStatus
              voterInfo={electionData.voterInfo}
              electionStatus={electionData.electionStatus}
              candidates={electionData.candidates}
              onRegister={handleRegisterVoter}
              isRegistering={isRegistering}
              userRole={electionData.userRole}
            />

            {/* Current Leader */}
            <CurrentLeader
              currentWinner={electionData.currentWinner}
              electionInfo={electionData.electionInfo}
              electionStatus={electionData.electionStatus}
            />
          </div>

          {/* Candidates List */}
          <CandidatesList
            candidates={electionData.candidates}
            electionInfo={electionData.electionInfo}
            electionStatus={electionData.electionStatus}
            voterInfo={electionData.voterInfo}
            selectedCandidate={selectedCandidate}
            onCandidateSelect={handleCandidateSelect}
            onVote={handleVote}
            isVoting={isVoting}
          />

          {/* Admin Panel */}
          <AdminPanel
            isUserAdmin={electionData.isUserAdmin()}
            isUserCommissioner={electionData.isUserCommissioner()}
            isUserOwner={electionData.isUserOwner()}
            systemInfo={electionData.systemInfo}
            electionInfo={electionData.electionInfo}
            contractHook={contractHook}
            onRefreshData={handleRefreshData}
          />

          {/* Footer */}
          <div style={footerStyle}>
            <div style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: '600', color: COLORS.text }}>
              Electra Blockchain Voting System
            </div>
            <div style={{ marginBottom: '8px' }}>
              Deployed on Sepolia Testnet
            </div>
            {import.meta.env.VITE_CONTRACT_ADDRESS && (
              <div style={{ marginBottom: '8px' }}>
                Contract: {' '}
                <a
                  href={`https://sepolia.etherscan.io/address/${import.meta.env.VITE_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: COLORS.primary, 
                    textDecoration: 'none',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}
                  onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                >
                  {import.meta.env.VITE_CONTRACT_ADDRESS.slice(0, 6)}...{import.meta.env.VITE_CONTRACT_ADDRESS.slice(-4)}
                </a>
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: COLORS.textLight }}>
              Last updated: {new Date().toLocaleTimeString()} • Built with React & Ethers.js
            </div>
            <div style={{ 
              marginTop: '16px', 
              paddingTop: '16px', 
              borderTop: `1px solid ${COLORS.border}`,
              fontSize: '0.75rem',
              color: COLORS.textLight
            }}>
              Secure • Transparent • Decentralized
            </div>
          </div>
        </>
      ) : (
        <div style={{ marginTop: '40px' }}>
          <LoadingSpinner message="Initializing contract connection..." size="large" />
          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            color: COLORS.textLight,
            fontSize: '0.875rem'
          }}>
            Connecting to Electra smart contract...
          </div>
        </div>
      )}
    </div>
  );
}

export default App;