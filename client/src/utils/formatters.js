/**
 * Format timestamp to readable date string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleString();
};

/**
 * Format time remaining from seconds
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted time string
 */
export const formatTimeRemaining = (seconds) => {
  if (seconds <= 0) return 'Ended';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Format address to short version
 * @param {string} address - Ethereum address
 * @returns {string} Shortened address
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Calculate vote percentage
 * @param {number} voteCount - Number of votes for candidate
 * @param {number} totalVotes - Total votes cast
 * @returns {number} Percentage (0-100)
 */
export const getVotePercentage = (voteCount, totalVotes) => {
  if (!totalVotes || totalVotes === 0) return 0;
  return Math.round((voteCount / totalVotes) * 100);
};

/**
 * Format large numbers with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  return num.toLocaleString();
};

/**
 * Get relative time string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Relative time string
 */
export const getRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = (timestamp * 1000) - now;
  const diffSeconds = Math.abs(diff) / 1000;
  
  if (diffSeconds < 60) {
    return diff > 0 ? 'in less than a minute' : 'just now';
  }
  
  const diffMinutes = diffSeconds / 60;
  if (diffMinutes < 60) {
    const minutes = Math.floor(diffMinutes);
    return diff > 0 ? `in ${minutes} minute${minutes > 1 ? 's' : ''}` : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  const diffHours = diffMinutes / 60;
  if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    return diff > 0 ? `in ${hours} hour${hours > 1 ? 's' : ''}` : `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  const diffDays = diffHours / 24;
  const days = Math.floor(diffDays);
  return diff > 0 ? `in ${days} day${days > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''} ago`;
};

/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @returns {boolean} Is valid address
 */
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Format election status
 * @param {object} electionStatus - Election status object
 * @returns {object} Status info with label and type
 */
export const formatElectionStatus = (electionStatus) => {
  if (!electionStatus) return { label: 'Unknown', type: 'inactive' };
  
  if (electionStatus.registrationActive) {
    return { label: 'Registration Open', type: 'active' };
  }
  
  if (electionStatus.votingActive) {
    return { label: 'Voting Active', type: 'active' };
  }
  
  return { label: 'Inactive', type: 'inactive' };
};
