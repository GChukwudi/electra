import React from 'react';
import { COLORS } from '../utils/constants.js';
import { formatAddress } from '../utils/formatters.js';

const Header = ({ 
  account, 
  balance, 
  isConnected, 
  isConnecting, 
  connectWallet, 
  disconnectWallet,
  isCorrectNetwork,
  switchToCorrectNetwork 
}) => {
  const headerStyle = {
    background: COLORS.background,
    borderBottom: `2px solid ${COLORS.border}`,
    padding: '20px 0',
    marginBottom: '30px'
  };

  const headerContentStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: COLORS.primary,
    margin: 0
  };

  const subtitleStyle = {
    fontSize: '1.1rem',
    color: COLORS.textLight,
    margin: '5px 0 0 0'
  };

  const walletInfoStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px'
  };

  const buttonStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '120px'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.primary,
    color: 'white'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.danger,
    color: 'white'
  };

  const warningButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.warning,
    color: 'white'
  };

  const accountInfoStyle = {
    fontSize: '0.875rem',
    color: COLORS.textLight
  };

  const networkBadgeStyle = {
    fontSize: '0.75rem',
    padding: '4px 8px',
    borderRadius: '12px',
    backgroundColor: isCorrectNetwork ? COLORS.secondary : COLORS.danger,
    color: 'white',
    textTransform: 'uppercase',
    fontWeight: '600'
  };

  const balanceStyle = {
    fontSize: '0.875rem',
    color: COLORS.text,
    fontWeight: '600'
  };

  const renderWalletSection = () => {
    if (!isConnected) {
      return (
        <button 
          style={primaryButtonStyle}
          onClick={connectWallet}
          disabled={isConnecting}
          onMouseOver={(e) => e.target.style.backgroundColor = COLORS.primaryHover}
          onMouseOut={(e) => e.target.style.backgroundColor = COLORS.primary}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <div style={walletInfoStyle}>
          <div style={accountInfoStyle}>
            {formatAddress(account)}
          </div>
          <div style={networkBadgeStyle}>
            Wrong Network
          </div>
          <button 
            style={warningButtonStyle}
            onClick={switchToCorrectNetwork}
            onMouseOver={(e) => e.target.style.backgroundColor = '#b45309'}
            onMouseOut={(e) => e.target.style.backgroundColor = COLORS.warning}
          >
            Switch Network
          </button>
        </div>
      );
    }

    return (
      <div style={walletInfoStyle}>
        <div style={accountInfoStyle}>
          Connected: {formatAddress(account)}
        </div>
        <div style={balanceStyle}>
          Balance: {parseFloat(balance).toFixed(4)} ETH
        </div>
        <div style={networkBadgeStyle}>
          Sepolia Testnet
        </div>
        <button 
          style={dangerButtonStyle}
          onClick={disconnectWallet}
          onMouseOver={(e) => e.target.style.backgroundColor = COLORS.dangerHover}
          onMouseOut={(e) => e.target.style.backgroundColor = COLORS.danger}
        >
          Disconnect
        </button>
      </div>
    );
  };

  return (
    <div style={headerStyle}>
      <div style={headerContentStyle}>
        <div>
          <h1 style={titleStyle}>Electra</h1>
          <p style={subtitleStyle}>Blockchain Voting System</p>
        </div>
        {renderWalletSection()}
      </div>
    </div>
  );
};

export default Header;
