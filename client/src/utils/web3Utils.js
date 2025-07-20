export const web3Utils = {

  formatAddress(address) {
    if (!address) return '';
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },
  
  /**
   * Validate Ethereum address
   * @param {string} address - Address to validate
   * @returns {boolean} Whether address is valid
   */
  isValidAddress(address) {
    if (!address) return false;
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },
  
  /**
   * Compare addresses (case-insensitive)
   * @param {string} addr1 - First address
   * @param {string} addr2 - Second address
   * @returns {boolean} Whether addresses are equal
   */
  addressesEqual(addr1, addr2) {
    if (!addr1 || !addr2) return false;
    return addr1.toLowerCase() === addr2.toLowerCase();
  },
  
  // ==================== TIME UTILITIES ====================
  
  /**
   * Format timestamp to readable date string
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted date string
   */
  formatTimestamp(timestamp) {
    if (!timestamp || timestamp === 0) return 'Not set';
    
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Lagos'
    });
  },
  
  /**
   * Format timestamp to short date string
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Short formatted date string
   */
  formatTimestampShort(timestamp) {
    if (!timestamp || timestamp === 0) return 'Not set';
    
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Lagos'
    });
  },
  
  /**
   * Get time remaining until timestamp
   * @param {number} timestamp - Target timestamp
   * @returns {Object} Time remaining object
   */
  getTimeRemaining(timestamp) {
    if (!timestamp) return { isExpired: true, timeString: 'N/A' };
    
    const now = Math.floor(Date.now() / 1000);
    const remaining = timestamp - now;
    
    if (remaining <= 0) {
      return { isExpired: true, timeString: 'Expired' };
    }
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    let timeString = '';
    if (days > 0) {
      timeString = `${days}d ${hours}h`;
    } else if (hours > 0) {
      timeString = `${hours}h ${minutes}m`;
    } else {
      timeString = `${minutes}m`;
    }
    
    return {
      isExpired: false,
      timeString,
      days,
      hours,
      minutes,
      totalSeconds: remaining
    };
  },
  
  /**
   * Format time remaining for display
   * @param {number} timestamp - Target timestamp
   * @param {boolean} detailed - Whether to show detailed format
   * @returns {string} Formatted time remaining
   */
  formatTimeRemaining(timestamp, detailed = false) {
    const timeData = this.getTimeRemaining(timestamp);
    
    if (timeData.isExpired) {
      return 'Ended';
    }
    
    if (detailed) {
      const { days, hours, minutes } = timeData;
      let parts = [];
      
      if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
      if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
      
      if (parts.length === 0) return 'Less than a minute';
      if (parts.length === 1) return parts[0];
      if (parts.length === 2) return parts.join(' and ');
      return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
    }
    
    return timeData.timeString;
  },
  
  /**
   * Check if timestamp is in the past
   * @param {number} timestamp - Timestamp to check
   * @returns {boolean} Whether timestamp is in the past
   */
  isInPast(timestamp) {
    if (!timestamp) return false;
    const now = Math.floor(Date.now() / 1000);
    return timestamp < now;
  },
  
  /**
   * Check if timestamp is in the future
   * @param {number} timestamp - Timestamp to check
   * @returns {boolean} Whether timestamp is in the future
   */
  isInFuture(timestamp) {
    if (!timestamp) return false;
    const now = Math.floor(Date.now() / 1000);
    return timestamp > now;
  },
  
  // ==================== NUMBER UTILITIES ====================
  
  /**
   * Format large numbers with commas
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  formatNumber(num) {
    if (!num && num !== 0) return '0';
    return num.toLocaleString();
  },
  
  /**
   * Format percentage
   * @param {number} num - Number to format as percentage
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted percentage
   */
  formatPercentage(num, decimals = 1) {
    if (!num && num !== 0) return '0%';
    return `${num.toFixed(decimals)}%`;
  },
  
  /**
   * Calculate percentage
   * @param {number} part - Part value
   * @param {number} total - Total value
   * @returns {number} Percentage
   */
  calculatePercentage(part, total) {
    if (!total || total === 0) return 0;
    return (part / total) * 100;
  },
  
  // ==================== WEB3 CONVERSION UTILITIES ====================
  
  /**
   * Convert Wei to Ether
   * @param {string|number} wei - Wei amount
   * @returns {string} Ether amount
   */
  weiToEther(wei) {
    if (!wei) return '0';
    // Simple conversion for display purposes
    // In production, use Web3.utils.fromWei
    return (parseFloat(wei) / Math.pow(10, 18)).toFixed(6);
  },
  
  /**
   * Convert Ether to Wei
   * @param {string|number} ether - Ether amount
   * @returns {string} Wei amount
   */
  etherToWei(ether) {
    if (!ether) return '0';
    // Simple conversion for display purposes
    // In production, use Web3.utils.toWei
    return (parseFloat(ether) * Math.pow(10, 18)).toString();
  },
  
  // ==================== ERROR HANDLING ====================
  
  /**
   * Parse contract error messages
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
  parseContractError(error) {
    if (!error) return 'Unknown error occurred';
    
    const message = error.message || error.toString();
    
    // Common error patterns
    const errorMappings = {
      'User denied transaction signature': 'Transaction was cancelled by user',
      'insufficient funds': 'Insufficient funds to complete transaction',
      'gas required exceeds allowance': 'Transaction would cost too much gas',
      'nonce too low': 'Transaction nonce error - please try again',
      'replacement transaction underpriced': 'Transaction fee too low',
      'execution reverted': 'Transaction failed - check requirements',
      'Only commissioner can perform this action': 'Unauthorized: Commissioner access required',
      'Only system owner can perform this action': 'Unauthorized: Owner access required',
      'Admin access required': 'Unauthorized: Admin access required',
      'You are not registered to vote': 'You must register to vote first',
      'You have already voted': 'You have already cast your vote',
      'Voting is not currently open': 'Voting is not currently active',
      'Registration deadline has passed': 'Voter registration has closed',
      'Candidate name cannot be empty': 'Candidate name is required',
      'Invalid candidate ID': 'Selected candidate is invalid',
      'System is currently paused': 'System is temporarily paused',
      'No active election': 'No election is currently active'
    };
    
    // Check for specific error messages
    for (const [pattern, userMessage] of Object.entries(errorMappings)) {
      if (message.toLowerCase().includes(pattern.toLowerCase())) {
        return userMessage;
      }
    }
    
    // Extract revert reason if available
    const revertMatch = message.match(/revert (.+)/i);
    if (revertMatch) {
      return revertMatch[1];
    }
    
    // Extract error from JSON RPC response
    const jsonMatch = message.match(/"message":"([^"]+)"/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
    
    // Default fallback
    return 'Transaction failed. Please try again.';
  },
  
  /**
   * Format gas price for display
   * @param {string|number} gasPrice - Gas price in Wei
   * @returns {string} Formatted gas price in Gwei
   */
  formatGasPrice(gasPrice) {
    if (!gasPrice) return '0 Gwei';
    const gwei = parseFloat(gasPrice) / Math.pow(10, 9);
    return `${gwei.toFixed(2)} Gwei`;
  },
  
  // ==================== VALIDATION UTILITIES ====================
  
  /**
   * Validate transaction hash
   * @param {string} hash - Transaction hash
   * @returns {boolean} Whether hash is valid
   */
  isValidTxHash(hash) {
    if (!hash) return false;
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  },
  
  /**
   * Validate block number
   * @param {number|string} blockNumber - Block number
   * @returns {boolean} Whether block number is valid
   */
  isValidBlockNumber(blockNumber) {
    const num = parseInt(blockNumber);
    return !isNaN(num) && num >= 0;
  },
  
  // ==================== NETWORK UTILITIES ====================
  
  /**
   * Get network name from chain ID
   * @param {number} chainId - Chain ID
   * @returns {string} Network name
   */
  getNetworkName(chainId) {
    const networks = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Mumbai Testnet',
      1337: 'Local Development',
      5777: 'Ganache'
    };
    
    return networks[chainId] || `Unknown Network (${chainId})`;
  },
  
  /**
   * Check if network is testnet
   * @param {number} chainId - Chain ID
   * @returns {boolean} Whether network is testnet
   */
  isTestnet(chainId) {
    const testnets = [11155111, 80001, 1337, 5777];
    return testnets.includes(chainId);
  },
  
  // ==================== ELECTION UTILITIES ====================
  
  /**
   * Get election phase based on timestamps
   * @param {Object} electionInfo - Election information
   * @returns {string} Current election phase
   */
  getElectionPhase(electionInfo) {
    if (!electionInfo) return 'unknown';
    
    const now = Math.floor(Date.now() / 1000);
    
    if (electionInfo.isFinalized) return 'finalized';
    if (now < electionInfo.registrationDeadline) return 'registration';
    if (now < electionInfo.startTime) return 'preparation';
    if (now <= electionInfo.endTime) return 'voting';
    return 'ended';
  },
  
  /**
   * Get election status indicator
   * @param {Object} electionInfo - Election information
   * @returns {Object} Status with color and text
   */
  getElectionStatusIndicator(electionInfo) {
    const phase = this.getElectionPhase(electionInfo);
    
    const indicators = {
      registration: { text: 'Registration Open', color: '#2563eb', bgColor: '#eff6ff' },
      preparation: { text: 'Preparation', color: '#d97706', bgColor: '#fefce8' },
      voting: { text: 'Voting Live', color: '#16a34a', bgColor: '#f0fdf4' },
      ended: { text: 'Voting Ended', color: '#dc2626', bgColor: '#fef2f2' },
      finalized: { text: 'Results Final', color: '#7c3aed', bgColor: '#faf5ff' },
      unknown: { text: 'Unknown', color: '#6b7280', bgColor: '#f9fafb' }
    };
    
    return indicators[phase] || indicators.unknown;
  },
  
  /**
   * Format candidate position with ordinal suffix
   * @param {number} position - Position number
   * @returns {string} Position with ordinal suffix
   */
  formatPosition(position) {
    if (!position) return '';
    
    const j = position % 10;
    const k = position % 100;
    
    if (j === 1 && k !== 11) return `${position}st`;
    if (j === 2 && k !== 12) return `${position}nd`;
    if (j === 3 && k !== 13) return `${position}rd`;
    return `${position}th`;
  },
  
  // ==================== UI UTILITIES ====================
  
  /**
   * Generate avatar color from address
   * @param {string} address - Ethereum address
   * @returns {string} Hex color
   */
  getAvatarColor(address) {
    if (!address) return '#6b7280';
    
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#22c55e', '#10b981', '#14b8a6',
      '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
      '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
    ];
    
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      hash = address.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  },
  
  /**
   * Generate initials from name
   * @param {string} name - Full name
   * @returns {string} Initials
   */
  getInitials(name) {
    if (!name) return '??';
    
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },
  
  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  },
  
  // ==================== STORAGE UTILITIES ====================
  
  /**
   * Safe localStorage operations
   */
  storage: {
    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} Stored value or default
     */
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.warn('localStorage get error:', error);
        return defaultValue;
      }
    },
    
    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn('localStorage set error:', error);
        return false;
      }
    },
    
    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('localStorage remove error:', error);
        return false;
      }
    }
  }
};
