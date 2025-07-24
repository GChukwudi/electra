import React from 'react';
import { COLORS } from '../utils/constants.js';

const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  const sizeMap = {
    small: {
      spinner: '24px',
      text: '0.875rem'
    },
    medium: {
      spinner: '40px',
      text: '1rem'
    },
    large: {
      spinner: '60px',
      text: '1.125rem'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.medium;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '16px'
  };

  const spinnerStyle = {
    width: currentSize.spinner,
    height: currentSize.spinner,
    border: `3px solid ${COLORS.border}`,
    borderTop: `3px solid ${COLORS.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  const textStyle = {
    fontSize: currentSize.text,
    color: COLORS.textLight,
    textAlign: 'center'
  };

  // Add keyframes for animation
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle}></div>
      {message && <div style={textStyle}>{message}</div>}
    </div>
  );
};

export default LoadingSpinner;
