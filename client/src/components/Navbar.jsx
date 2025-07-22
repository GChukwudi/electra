import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useElection } from '../contexts/ElectionContext';

const Navbar = () => {
  const location = useLocation();
  const { 
    account, 
    isConnected, 
    connectWallet, 
    disconnectWallet, 
    formatAddress, 
    networkName 
  } = useWeb3();
  
  const { 
    isAdmin, 
    isCommissioner,
    hasVoted,
    canVote,
    electionInfo 
  } = useElection();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  const getElectionStatus = () => {
    if (!electionInfo) return null;
    
    const now = Math.floor(Date.now() / 1000);
    
    if (electionInfo.isFinalized) return { text: 'Finalized', color: '#7c3aed' };
    if (now <= electionInfo.endTime && now >= electionInfo.startTime) return { text: 'Voting Live', color: '#16a34a' };
    if (now < electionInfo.startTime) return { text: 'Upcoming', color: '#2563eb' };
    return { text: 'Ended', color: '#ea580c' };
  };

  const electionStatus = getElectionStatus();

  const navStyles = {
    nav: {
      backgroundColor: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e5e7eb'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem'
    },
    flexContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 0'
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      textDecoration: 'none'
    },
    logoIcon: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#2563eb'
    },
    logoText: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#111827'
    },
    statusBadge: {
      padding: '0.25rem 0.5rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '500',
      backgroundColor: '#f3f4f6'
    },
    desktopNav: {
      display: 'flex',
      alignItems: 'center',
      gap: '1.5rem'
    },
    navLink: {
      fontWeight: '500',
      textDecoration: 'none',
      transition: 'color 0.2s ease',
      position: 'relative'
    },
    activeLink: {
      color: '#ea580c',
      borderBottom: '2px solid #ea580c',
      paddingBottom: '0.25rem'
    },
    inactiveLink: {
      color: '#4b5563'
    },
    walletContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    networkBadge: {
      padding: '0.25rem 0.5rem',
      backgroundColor: '#dcfce7',
      color: '#166534',
      fontSize: '0.75rem',
      borderRadius: '9999px'
    },
    accountInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    statusDot: {
      width: '8px',
      height: '8px',
      backgroundColor: '#22c55e',
      borderRadius: '50%'
    },
    accountText: {
      fontSize: '0.875rem',
      fontFamily: 'monospace',
      color: '#374151'
    },
    connectButton: {
      backgroundColor: '#2563eb',
      color: 'white',
      fontWeight: '500',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease'
    },
    disconnectButton: {
      fontSize: '0.875rem',
      color: '#6b7280',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      transition: 'color 0.2s ease'
    },
    mobileMenuButton: {
      color: '#6b7280',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'none'
    },
    mobileMenu: {
      borderTop: '1px solid #e5e7eb',
      padding: '1rem 0'
    },
    mobileNavLink: {
      display: 'block',
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      fontWeight: '500',
      textDecoration: 'none',
      transition: 'background-color 0.2s ease, color 0.2s ease'
    },
    mobileActiveLink: {
      backgroundColor: '#eff6ff',
      color: '#2563eb'
    },
    mobileInactiveLink: {
      color: '#4b5563'
    }
  };

  // Media query styles for mobile
  const mobileStyles = `
    @media (max-width: 768px) {
      .desktop-nav { display: none !important; }
      .mobile-menu-button { display: block !important; }
    }
    @media (min-width: 769px) {
      .mobile-menu { display: none !important; }
    }
  `;

  return (
    <>
      <style>{mobileStyles}</style>
      <nav style={navStyles.nav}>
        <div style={navStyles.container}>
          <div style={navStyles.flexContainer}>
            {/* Logo and Brand */}
            <div style={navStyles.logoContainer}>
              <Link to="/" style={navStyles.logo}>
                <div style={navStyles.logoIcon}>🗳️</div>
                <span style={navStyles.logoText}>Electra</span>
              </Link>
              
              {/* Election Status Indicator */}
              {electionStatus && (
                <div style={{
                  ...navStyles.statusBadge,
                  color: electionStatus.color
                }}>
                  {electionStatus.text}
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="desktop-nav" style={navStyles.desktopNav}>
              <Link
                to="/"
                style={{
                  ...navStyles.navLink,
                  ...(isActivePage('/') ? navStyles.activeLink : navStyles.inactiveLink)
                }}
              >
                Home
              </Link>
              
              <Link
                to="/vote"
                style={{
                  ...navStyles.navLink,
                  ...(isActivePage('/vote') ? navStyles.activeLink : navStyles.inactiveLink)
                }}
              >
                Vote
                {canVote && <span style={{ color: '#22c55e', marginLeft: '0.25rem' }}>●</span>}
                {hasVoted && <span style={{ color: '#22c55e', marginLeft: '0.25rem' }}>✓</span>}
              </Link>
              
              <Link
                to="/results"
                style={{
                  ...navStyles.navLink,
                  ...(isActivePage('/results') ? navStyles.activeLink : navStyles.inactiveLink)
                }}
              >
                Results
              </Link>
              
              {(isAdmin || isCommissioner) && (
                <Link
                  to="/admin"
                  style={{
                    ...navStyles.navLink,
                    ...(isActivePage('/admin') ? navStyles.activeLink : navStyles.inactiveLink)
                  }}
                >
                  Admin
                  {isCommissioner && <span style={{ color: '#7c3aed', marginLeft: '0.25rem' }}>👑</span>}
                </Link>
              )}
            </div>

            {/* Wallet Connection */}
            <div className="desktop-nav" style={navStyles.walletContainer}>
              {isConnected ? (
                <div style={navStyles.walletContainer}>
                  {/* Network Badge */}
                  <div style={navStyles.networkBadge}>
                    {networkName}
                  </div>
                  
                  {/* Account Info */}
                  <div style={navStyles.accountInfo}>
                    <div style={navStyles.statusDot}></div>
                    <span style={navStyles.accountText}>
                      {formatAddress(account)}
                    </span>
                  </div>
                  
                  {/* Disconnect Button */}
                  <button
                    onClick={disconnectWallet}
                    style={navStyles.disconnectButton}
                    onMouseOver={(e) => e.target.style.color = '#374151'}
                    onMouseOut={(e) => e.target.style.color = '#6b7280'}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  style={navStyles.connectButton}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                  Connect Wallet
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="mobile-menu-button">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={navStyles.mobileMenuButton}
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="mobile-menu" style={navStyles.mobileMenu}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    ...navStyles.mobileNavLink,
                    ...(isActivePage('/') ? navStyles.mobileActiveLink : navStyles.mobileInactiveLink)
                  }}
                >
                  🏠 Home
                </Link>
                
                <Link
                  to="/vote"
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    ...navStyles.mobileNavLink,
                    ...(isActivePage('/vote') ? navStyles.mobileActiveLink : navStyles.mobileInactiveLink)
                  }}
                >
                  🗳️ Vote
                  {canVote && <span style={{ marginLeft: '0.5rem', color: '#22c55e' }}>●</span>}
                  {hasVoted && <span style={{ marginLeft: '0.5rem', color: '#22c55e' }}>✓</span>}
                </Link>
                
                <Link
                  to="/results"
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    ...navStyles.mobileNavLink,
                    ...(isActivePage('/results') ? navStyles.mobileActiveLink : navStyles.mobileInactiveLink)
                  }}
                >
                  📊 Results
                </Link>
                
                {(isAdmin || isCommissioner) && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      ...navStyles.mobileNavLink,
                      ...(isActivePage('/admin') ? navStyles.mobileActiveLink : navStyles.mobileInactiveLink)
                    }}
                  >
                    {isCommissioner ? '👑' : '🔧'} Admin
                  </Link>
                )}
                
                {/* Mobile Wallet Connection */}
                <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  {isConnected ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ padding: '0.5rem 1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Connected to {networkName}
                        </div>
                        <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#374151' }}>
                          {formatAddress(account)}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          disconnectWallet();
                          setIsMenuOpen(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.5rem 1rem',
                          color: '#dc2626',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        connectWallet();
                        setIsMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        fontWeight: '500',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                    >
                      Connect Wallet
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;