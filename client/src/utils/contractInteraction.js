import { web3Utils } from './web3Utils';

// ==================== CONFIGURATION ====================

const CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  CACHE_TTL: 30000, // 30 seconds
  MAX_GAS_PRICE: '50000000000', // 50 Gwei
  GAS_BUFFER_MULTIPLIER: 1.2,
  BATCH_SIZE: 10,
  EVENT_POLLING_INTERVAL: 5000
};

// ==================== CACHE MANAGEMENT ====================

class ContractCache {
  constructor(ttl = CONFIG.CACHE_TTL) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const contractCache = new ContractCache();

// ==================== ABI MANAGEMENT ====================

// In production, this should be imported from compiled contract artifacts
// Example: import ElectraABI from '../contracts/Electra.json';
const ELECTRA_ABI = [
  // Core Functions
  {
    "inputs": [
      {"name": "_title", "type": "string"},
      {"name": "_description", "type": "string"},
      {"name": "_registrationDeadline", "type": "uint256"},
      {"name": "_startTime", "type": "uint256"},
      {"name": "_endTime", "type": "uint256"}
    ],
    "name": "createElection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Voting Functions
  {
    "inputs": [{"name": "_candidateID", "type": "uint256"}],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Admin Functions
  {
    "inputs": [
      {"name": "_name", "type": "string"},
      {"name": "_party", "type": "string"},
      {"name": "_manifesto", "type": "string"}
    ],
    "name": "addCandidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  {
    "inputs": [{"name": "_voterAddress", "type": "address"}],
    "name": "registerVoter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "selfRegister",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Control Functions
  {
    "inputs": [],
    "name": "startVoting",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "endVoting",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "finalizeElection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // View Functions
  {
    "inputs": [],
    "name": "getElectionInfo",
    "outputs": [
      {"name": "title", "type": "string"},
      {"name": "description", "type": "string"},
      {"name": "startTime", "type": "uint256"},
      {"name": "endTime", "type": "uint256"},
      {"name": "registrationDeadline", "type": "uint256"},
      {"name": "isActive", "type": "bool"},
      {"name": "isFinalized", "type": "bool"},
      {"name": "totalVoters", "type": "uint256"},
      {"name": "totalVotes", "type": "uint256"},
      {"name": "winnerID", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "getAllCandidates",
    "outputs": [
      {"name": "candidateIDs", "type": "uint256[]"},
      {"name": "names", "type": "string[]"},
      {"name": "parties", "type": "string[]"},
      {"name": "voteCounts", "type": "uint256[]"},
      {"name": "isActiveArray", "type": "bool[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [{"name": "_voterAddress", "type": "address"}],
    "name": "getVoterInfo",
    "outputs": [
      {"name": "isRegistered", "type": "bool"},
      {"name": "hasVoted", "type": "bool"},
      {"name": "candidateVoted", "type": "uint256"},
      {"name": "voterID", "type": "uint256"},
      {"name": "registrationTime", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "getCurrentWinner",
    "outputs": [
      {"name": "winnerID", "type": "uint256"},
      {"name": "winnerName", "type": "string"},
      {"name": "winnerParty", "type": "string"},
      {"name": "maxVotes", "type": "uint256"},
      {"name": "isTie", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [],
    "name": "getElectionStatistics",
    "outputs": [
      {"name": "totalRegisteredVoters", "type": "uint256"},
      {"name": "totalVotesCast", "type": "uint256"},
      {"name": "voterTurnoutPercentage", "type": "uint256"},
      {"name": "activeCandidates", "type": "uint256"},
      {"name": "totalCandidatesCount", "type": "uint256"},
      {"name": "hasWinner", "type": "bool"},
      {"name": "electionComplete", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  {
    "inputs": [{"name": "_user", "type": "address"}],
    "name": "getUserInfo",
    "outputs": [
      {"name": "role", "type": "uint8"},
      {"name": "isActive", "type": "bool"},
      {"name": "assignedAt", "type": "uint256"},
      {"name": "assignedBy", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "voter", "type": "address"},
      {"indexed": true, "name": "candidateID", "type": "uint256"},
      {"indexed": false, "name": "timestamp", "type": "uint256"},
      {"indexed": false, "name": "voteRecordID", "type": "uint256"}
    ],
    "name": "VoteCast",
    "type": "event"
  },
  
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "voter", "type": "address"},
      {"indexed": true, "name": "voterID", "type": "uint256"},
      {"indexed": false, "name": "timestamp", "type": "uint256"}
    ],
    "name": "VoterRegistered",
    "type": "event"
  },
  
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "candidateID", "type": "uint256"},
      {"indexed": false, "name": "name", "type": "string"},
      {"indexed": false, "name": "party", "type": "string"},
      {"indexed": true, "name": "addedBy", "type": "address"}
    ],
    "name": "CandidateAdded",
    "type": "event"
  }
];

// ==================== CONTRACT MANAGEMENT ====================

class ContractManager {
  constructor() {
    this.contracts = new Map();
    this.eventSubscriptions = new Map();
    this.nonces = new Map();
  }

  getContract(web3, address = null) {
    const contractAddress = address || this.getContractAddress();
    
    if (!contractAddress || !web3Utils.isValidAddress(contractAddress)) {
      throw new Error('Invalid contract address');
    }

    const key = `${contractAddress}_${web3.currentProvider.host || 'default'}`;
    
    if (this.contracts.has(key)) {
      return this.contracts.get(key);
    }

    const contract = new web3.eth.Contract(ELECTRA_ABI, contractAddress);
    this.contracts.set(key, contract);
    
    return contract;
  }

  getContractAddress() {
    // Priority order: environment variable, localStorage, default
    return (
      process.env.REACT_APP_CONTRACT_ADDRESS ||
      localStorage.getItem('electra_contract_address') ||
      '0x1234567890123456789012345678901234567890' // Placeholder
    );
  }

  setContractAddress(address) {
    if (!web3Utils.isValidAddress(address)) {
      throw new Error('Invalid contract address format');
    }
    
    localStorage.setItem('electra_contract_address', address);
    this.contracts.clear(); // Clear cached contracts
    contractCache.clear(); // Clear contract cache
  }

  async validateContract(web3, address = null) {
    try {
      const contract = this.getContract(web3, address);
      
      // Test with a simple read operation
      await contract.methods.totalCandidates().call();
      
      // Verify contract has the expected interface
      const requiredMethods = ['vote', 'getElectionInfo', 'addCandidate'];
      for (const method of requiredMethods) {
        if (!contract.methods[method]) {
          throw new Error(`Contract missing required method: ${method}`);
        }
      }
      
      return { isValid: true, contract };
    } catch (error) {
      return { 
        isValid: false, 
        error: web3Utils.parseContractError(error) 
      };
    }
  }
}

const contractManager = new ContractManager();

// ==================== ENHANCED ERROR HANDLING ====================

class ContractError extends Error {
  constructor(message, code = null, data = null) {
    super(message);
    this.name = 'ContractError';
    this.code = code;
    this.data = data;
  }
}

const handleContractError = (error, operation = '') => {
  console.error(`Contract error in ${operation}:`, error);
  
  // Enhanced error parsing
  let message = web3Utils.parseContractError(error);
  let code = null;
  
  // Extract revert reason if available
  if (error.data && typeof error.data === 'string') {
    try {
      const decoded = web3.eth.abi.decodeParameter('string', '0x' + error.data.slice(10));
      message = decoded;
    } catch (decodeError) {
      // Ignore decode errors
    }
  }
  
  // Set error codes for common scenarios
  if (message.includes('User denied')) code = 'USER_REJECTED';
  else if (message.includes('insufficient funds')) code = 'INSUFFICIENT_FUNDS';
  else if (message.includes('gas')) code = 'GAS_ERROR';
  else if (message.includes('nonce')) code = 'NONCE_ERROR';
  else if (message.includes('Unauthorized')) code = 'UNAUTHORIZED';
  
  throw new ContractError(message, code, error.data);
};

// ==================== TRANSACTION MANAGEMENT ====================

class TransactionManager {
  constructor() {
    this.pendingTransactions = new Map();
    this.transactionHistory = [];
  }

  async executeTransaction(web3, contract, methodName, params, fromAddress, options = {}) {
    const txId = this.generateTxId();
    
    try {
      this.pendingTransactions.set(txId, { status: 'pending', methodName, params });
      
      // Get current gas price and nonce
      const [gasPrice, nonce] = await Promise.all([
        this.getOptimalGasPrice(web3),
        this.getNonce(web3, fromAddress)
      ]);
      
      // Estimate gas
      const gasEstimate = await contract.methods[methodName](...params)
        .estimateGas({ from: fromAddress });
      
      const gasLimit = Math.floor(gasEstimate * CONFIG.GAS_BUFFER_MULTIPLIER);
      
      // Execute transaction with retry logic
      const tx = await this.executeWithRetry(
        () => contract.methods[methodName](...params).send({
          from: fromAddress,
          gas: gasLimit,
          gasPrice,
          nonce,
          ...options
        }),
        CONFIG.MAX_RETRIES
      );
      
      this.pendingTransactions.set(txId, { status: 'success', tx });
      this.addToHistory(txId, methodName, params, tx.transactionHash, true);
      
      // Invalidate relevant cache
      this.invalidateCache(methodName);
      
      return {
        success: true,
        txHash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        gasUsed: tx.gasUsed,
        txId
      };
      
    } catch (error) {
      this.pendingTransactions.set(txId, { status: 'failed', error });
      this.addToHistory(txId, methodName, params, null, false, error.message);
      handleContractError(error, methodName);
    }
  }

  async executeWithRetry(operation, maxRetries) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry for certain errors
        if (error.message.includes('User denied') || 
            error.message.includes('insufficient funds')) {
          throw error;
        }
        
        if (attempt < maxRetries - 1) {
          await this.delay(CONFIG.RETRY_DELAY * Math.pow(2, attempt));
        }
      }
    }
    
    throw lastError;
  }

  async getOptimalGasPrice(web3) {
    try {
      const gasPrice = await web3.eth.getGasPrice();
      const maxGasPrice = web3.utils.toBN(CONFIG.MAX_GAS_PRICE);
      const currentGasPrice = web3.utils.toBN(gasPrice);
      
      // Use the minimum of current gas price and max allowed
      return web3.utils.BN.min(currentGasPrice, maxGasPrice).toString();
    } catch (error) {
      console.warn('Failed to get gas price, using default:', error);
      return CONFIG.MAX_GAS_PRICE;
    }
  }

  async getNonce(web3, address) {
    const cacheKey = `nonce_${address}`;
    let nonce = contractCache.get(cacheKey);
    
    if (nonce === null) {
      nonce = await web3.eth.getTransactionCount(address, 'pending');
      contractCache.set(cacheKey, nonce);
    }
    
    return nonce;
  }

  generateTxId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addToHistory(txId, method, params, hash, success, error = null) {
    this.transactionHistory.push({
      txId,
      method,
      params,
      hash,
      success,
      error,
      timestamp: Date.now()
    });
    
    // Keep only last 100 transactions
    if (this.transactionHistory.length > 100) {
      this.transactionHistory.shift();
    }
  }

  invalidateCache(methodName) {
    // Invalidate cache based on method type
    if (methodName.includes('vote') || methodName.includes('Vote')) {
      contractCache.invalidate('election');
      contractCache.invalidate('voter');
      contractCache.invalidate('candidate');
    } else if (methodName.includes('candidate') || methodName.includes('Candidate')) {
      contractCache.invalidate('candidate');
      contractCache.invalidate('election');
    } else if (methodName.includes('register') || methodName.includes('Register')) {
      contractCache.invalidate('voter');
      contractCache.invalidate('election');
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getTransactionStatus(txId) {
    return this.pendingTransactions.get(txId);
  }

  getTransactionHistory(limit = 10) {
    return this.transactionHistory
      .slice(-limit)
      .reverse();
  }
}

const transactionManager = new TransactionManager();

// ==================== ENHANCED CONTRACT INTERACTIONS ====================

export const contractInteraction = {
  
  // ==================== INITIALIZATION ====================
  
  async initialize(web3, contractAddress = null) {
    try {
      const validation = await contractManager.validateContract(web3, contractAddress);
      
      if (!validation.isValid) {
        throw new Error(`Contract validation failed: ${validation.error}`);
      }
      
      return {
        success: true,
        contract: validation.contract,
        address: contractAddress || contractManager.getContractAddress()
      };
    } catch (error) {
      handleContractError(error, 'initialize');
    }
  },

  // ==================== CACHED VIEW FUNCTIONS ====================
  
  async getElectionInfo(contract) {
    const cacheKey = 'election_info';
    let cached = contractCache.get(cacheKey);
    
    if (cached) return cached;
    
    try {
      const result = await contract.methods.getElectionInfo().call();
      
      const electionInfo = {
        title: result.title,
        description: result.description,
        startTime: parseInt(result.startTime),
        endTime: parseInt(result.endTime),
        registrationDeadline: parseInt(result.registrationDeadline),
        isActive: result.isActive,
        isFinalized: result.isFinalized,
        totalVoters: parseInt(result.totalVoters),
        totalVotes: parseInt(result.totalVotes),
        winnerID: parseInt(result.winnerID)
      };
      
      contractCache.set(cacheKey, electionInfo);
      return electionInfo;
    } catch (error) {
      handleContractError(error, 'getElectionInfo');
    }
  },

  async getAllCandidates(contract) {
    const cacheKey = 'all_candidates';
    let cached = contractCache.get(cacheKey);
    
    if (cached) return cached;
    
    try {
      const result = await contract.methods.getAllCandidates().call();
      
      const candidates = [];
      for (let i = 0; i < result.candidateIDs.length; i++) {
        candidates.push({
          id: parseInt(result.candidateIDs[i]),
          name: result.names[i],
          party: result.parties[i],
          voteCount: parseInt(result.voteCounts[i]),
          isActive: result.isActiveArray[i]
        });
      }
      
      contractCache.set(cacheKey, candidates);
      return candidates;
    } catch (error) {
      handleContractError(error, 'getAllCandidates');
    }
  },

  async getVoterInfo(contract, voterAddress) {
    const cacheKey = `voter_info_${voterAddress}`;
    let cached = contractCache.get(cacheKey);
    
    if (cached) return cached;
    
    try {
      const result = await contract.methods.getVoterInfo(voterAddress).call();
      
      const voterInfo = {
        isRegistered: result.isRegistered,
        hasVoted: result.hasVoted,
        candidateVoted: parseInt(result.candidateVoted),
        voterID: parseInt(result.voterID),
        registrationTime: parseInt(result.registrationTime)
      };
      
      contractCache.set(cacheKey, voterInfo);
      return voterInfo;
    } catch (error) {
      handleContractError(error, 'getVoterInfo');
    }
  },

  async getUserRole(contract, userAddress) {
    const cacheKey = `user_role_${userAddress}`;
    let cached = contractCache.get(cacheKey);
    
    if (cached) return cached;
    
    try {
      const result = await contract.methods.getUserInfo(userAddress).call();
      
      const roleNames = ['NONE', 'VOTER', 'OBSERVER', 'ADMIN', 'COMMISSIONER'];
      
      const userRole = {
        role: roleNames[parseInt(result.role)] || 'NONE',
        isActive: result.isActive,
        assignedAt: parseInt(result.assignedAt),
        assignedBy: result.assignedBy
      };
      
      contractCache.set(cacheKey, userRole);
      return userRole;
    } catch (error) {
      console.error('Error getting user role:', error);
      return {
        role: 'NONE',
        isActive: false,
        assignedAt: 0,
        assignedBy: '0x0000000000000000000000000000000000000000'
      };
    }
  },

  async getCurrentWinner(contract) {
    const cacheKey = 'current_winner';
    let cached = contractCache.get(cacheKey);
    
    if (cached) return cached;
    
    try {
      const result = await contract.methods.getCurrentWinner().call();
      
      const winner = {
        winnerID: parseInt(result.winnerID),
        winnerName: result.winnerName,
        winnerParty: result.winnerParty,
        maxVotes: parseInt(result.maxVotes),
        isTie: result.isTie
      };
      
      contractCache.set(cacheKey, winner);
      return winner;
    } catch (error) {
      handleContractError(error, 'getCurrentWinner');
    }
  },

  async getElectionStatistics(contract) {
    const cacheKey = 'election_statistics';
    let cached = contractCache.get(cacheKey);
    
    if (cached) return cached;
    
    try {
      const result = await contract.methods.getElectionStatistics().call();
      
      const stats = {
        totalRegisteredVoters: parseInt(result.totalRegisteredVoters),
        totalVotesCast: parseInt(result.totalVotesCast),
        voterTurnoutPercentage: parseInt(result.voterTurnoutPercentage),
        activeCandidates: parseInt(result.activeCandidates),
        totalCandidatesCount: parseInt(result.totalCandidatesCount),
        hasWinner: result.hasWinner,
        electionComplete: result.electionComplete
      };
      
      contractCache.set(cacheKey, stats);
      return stats;
    } catch (error) {
      handleContractError(error, 'getElectionStatistics');
    }
  },

  // ==================== TRANSACTION FUNCTIONS ====================
  
  async vote(contract, candidateID, fromAddress) {
    return await transactionManager.executeTransaction(
      contract._provider, // Access web3 instance
      contract,
      'vote',
      [candidateID],
      fromAddress
    );
  },

  async selfRegister(contract, fromAddress) {
    return await transactionManager.executeTransaction(
      contract._provider,
      contract,
      'selfRegister',
      [],
      fromAddress
    );
  },

  async registerVoter(contract, voterAddress, fromAddress) {
    return await transactionManager.executeTransaction(
      contract._provider,
      contract,
      'registerVoter',
      [voterAddress],
      fromAddress
    );
  },

  async addCandidate(contract, name, party, manifesto, fromAddress) {
    return await transactionManager.executeTransaction(
      contract._provider,
      contract,
      'addCandidate',
      [name, party, manifesto],
      fromAddress
    );
  },

  async startVoting(contract, fromAddress) {
    return await transactionManager.executeTransaction(
      contract._provider,
      contract,
      'startVoting',
      [],
      fromAddress
    );
  },

  async endVoting(contract, fromAddress) {
    return await transactionManager.executeTransaction(
      contract._provider,
      contract,
      'endVoting',
      [],
      fromAddress
    );
  },

  async finalizeElection(contract, fromAddress) {
    return await transactionManager.executeTransaction(
      contract._provider,
      contract,
      'finalizeElection',
      [],
      fromAddress
    );
  },

  // ==================== BATCH OPERATIONS ====================
  
  async batchGetData(contract, requests) {
    try {
      const promises = requests.map(async (request) => {
        try {
          const result = await this[request.method](contract, ...request.params);
          return { success: true, data: result, method: request.method };
        } catch (error) {
          return { success: false, error: error.message, method: request.method };
        }
      });
      
      return await Promise.allSettled(promises);
    } catch (error) {
      handleContractError(error, 'batchGetData');
    }
  },

  // ==================== EVENT HANDLING ====================
  
  subscribeToEvents(contract, eventName, callback, options = {}) {
    try {
      const subscription = contract.events[eventName]({
        fromBlock: options.fromBlock || 'latest',
        ...options
      });
      
      const subscriptionId = `${eventName}_${Date.now()}`;
      
      subscription.on('data', (event) => {
        try {
          callback({
            ...event,
            parsedReturnValues: this.parseEventData(event.returnValues),
            timestamp: Date.now()
          });
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      });
      
      subscription.on('error', (error) => {
        console.error(`Event subscription error for ${eventName}:`, error);
        this.handleEventError(eventName, error);
      });
      
      contractManager.eventSubscriptions.set(subscriptionId, subscription);
      
      return {
        subscriptionId,
        unsubscribe: () => {
          subscription.unsubscribe();
          contractManager.eventSubscriptions.delete(subscriptionId);
        }
      };
    } catch (error) {
      handleContractError(error, 'subscribeToEvents');
    }
  },

  parseEventData(returnValues) {
    const parsed = {};
    
    for (const [key, value] of Object.entries(returnValues)) {
      if (isNaN(key)) { // Skip numeric indices
        if (typeof value === 'string' && /^\d+$/.test(value)) {
          parsed[key] = parseInt(value);
        } else {
          parsed[key] = value;
        }
      }
    }
    
    return parsed;
  },

  handleEventError(eventName, error) {
    console.error(`Event error for ${eventName}:`, error);
    // Could implement reconnection logic here
  },

  // ==================== UTILITY FUNCTIONS ====================
  
  clearCache() {
    contractCache.clear();
  },

  getTransactionHistory(limit = 10) {
    return transactionManager.getTransactionHistory(limit);
  },

  getTransactionStatus(txId) {
    return transactionManager.getTransactionStatus(txId);
  },

  setContractAddress(address) {
    contractManager.setContractAddress(address);
  }
};

// ==================== EXPORT HELPERS ====================

export const getContract = (web3, address = null) => {
  return contractManager.getContract(web3, address);
};

export const setContractAddress = (address) => {
  contractManager.setContractAddress(address);
};

export const validateContract = async (web3, address = null) => {
  return await contractManager.validateContract(web3, address);
};

// ==================== MULTICALL IMPLEMENTATION ====================

class MulticallManager {
  constructor() {
    this.batchQueue = [];
    this.batchTimer = null;
  }

  async addToBatch(contract, methodName, params = []) {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        contract,
        methodName,
        params,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Auto-execute batch after small delay or when batch is full
      if (this.batchQueue.length >= CONFIG.BATCH_SIZE) {
        this.executeBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.executeBatch();
        }, 100);
      }
    });
  }

  async executeBatch() {
    if (this.batchQueue.length === 0) return;

    const currentBatch = [...this.batchQueue];
    this.batchQueue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      const promises = currentBatch.map(async (item) => {
        try {
          const result = await item.contract.methods[item.methodName](...item.params).call();
          item.resolve(result);
          return { success: true, result };
        } catch (error) {
          item.reject(error);
          return { success: false, error };
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      // Reject all pending items
      currentBatch.forEach(item => item.reject(error));
    }
  }
}

const multicallManager = new MulticallManager();

// ==================== ENHANCED EVENT MANAGEMENT ====================

class EventManager {
  constructor() {
    this.subscriptions = new Map();
    this.eventQueue = [];
    this.processingEvents = false;
  }

  async subscribeToAllEvents(contract, callbacks = {}) {
    const events = ['VoteCast', 'VoterRegistered', 'CandidateAdded', 'ElectionStarted', 'ElectionEnded'];
    const subscriptions = {};

    for (const eventName of events) {
      if (callbacks[eventName]) {
        subscriptions[eventName] = contractInteraction.subscribeToEvents(
          contract,
          eventName,
          callbacks[eventName]
        );
      }
    }

    return subscriptions;
  }

  async getEventHistory(contract, eventName, fromBlock = 0, toBlock = 'latest') {
    try {
      const events = await contract.getPastEvents(eventName, {
        fromBlock,
        toBlock
      });

      return events.map(event => ({
        ...event,
        blockNumber: parseInt(event.blockNumber),
        timestamp: event.returnValues.timestamp ? 
                   parseInt(event.returnValues.timestamp) : null,
        parsedReturnValues: contractInteraction.parseEventData(event.returnValues)
      }));
    } catch (error) {
      handleContractError(error, 'getEventHistory');
    }
  }

  unsubscribeAll() {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    }
    this.subscriptions.clear();
  }
}

const eventManager = new EventManager();

// ==================== ADVANCED UTILITIES ====================

export const advancedUtils = {
  
  /**
   * Monitor election progress in real-time
   */
  async monitorElection(contract, callbacks = {}) {
    const subscriptions = await eventManager.subscribeToAllEvents(contract, {
      VoteCast: (event) => {
        contractCache.invalidate('election');
        contractCache.invalidate('candidate');
        if (callbacks.onVoteCast) callbacks.onVoteCast(event);
      },
      
      VoterRegistered: (event) => {
        contractCache.invalidate('election');
        if (callbacks.onVoterRegistered) callbacks.onVoterRegistered(event);
      },
      
      CandidateAdded: (event) => {
        contractCache.invalidate('candidate');
        if (callbacks.onCandidateAdded) callbacks.onCandidateAdded(event);
      },
      
      ElectionStarted: (event) => {
        contractCache.clear();
        if (callbacks.onElectionStarted) callbacks.onElectionStarted(event);
      },
      
      ElectionEnded: (event) => {
        contractCache.clear();
        if (callbacks.onElectionEnded) callbacks.onElectionEnded(event);
      }
    });

    return {
      subscriptions,
      stop: () => {
        Object.values(subscriptions).forEach(sub => {
          if (sub.unsubscribe) sub.unsubscribe();
        });
      }
    };
  },

  /**
   * Get comprehensive election data in one call
   */
  async getFullElectionData(contract) {
    try {
      const requests = [
        { method: 'getElectionInfo', params: [] },
        { method: 'getAllCandidates', params: [] },
        { method: 'getElectionStatistics', params: [] },
        { method: 'getCurrentWinner', params: [] }
      ];

      const results = await contractInteraction.batchGetData(contract, requests);
      
      return {
        electionInfo: results[0]?.value?.data,
        candidates: results[1]?.value?.data,
        statistics: results[2]?.value?.data,
        winner: results[3]?.value?.data,
        timestamp: Date.now()
      };
    } catch (error) {
      handleContractError(error, 'getFullElectionData');
    }
  },

  /**
   * Validate election integrity
   */
  async validateElectionIntegrity(contract) {
    try {
      const data = await this.getFullElectionData(contract);
      const issues = [];

      // Check vote count consistency
      const totalCandidateVotes = data.candidates.reduce((sum, candidate) => 
        sum + candidate.voteCount, 0);
      
      if (totalCandidateVotes !== data.statistics.totalVotesCast) {
        issues.push({
          type: 'VOTE_COUNT_MISMATCH',
          message: 'Total candidate votes do not match total votes cast',
          expected: data.statistics.totalVotesCast,
          actual: totalCandidateVotes
        });
      }

      // Check turnout calculation
      const expectedTurnout = data.statistics.totalRegisteredVoters > 0 ? 
        Math.floor((data.statistics.totalVotesCast / data.statistics.totalRegisteredVoters) * 100) : 0;
      
      if (Math.abs(expectedTurnout - data.statistics.voterTurnoutPercentage) > 1) {
        issues.push({
          type: 'TURNOUT_CALCULATION_ERROR',
          message: 'Voter turnout percentage calculation is incorrect',
          expected: expectedTurnout,
          actual: data.statistics.voterTurnoutPercentage
        });
      }

      // Check winner consistency
      if (data.statistics.totalVotesCast > 0) {
        const topCandidate = data.candidates
          .filter(c => c.isActive)
          .sort((a, b) => b.voteCount - a.voteCount)[0];
        
        if (topCandidate && !data.winner.isTie && topCandidate.id !== data.winner.winnerID) {
          issues.push({
            type: 'WINNER_MISMATCH',
            message: 'Declared winner does not match candidate with most votes',
            expected: topCandidate.id,
            actual: data.winner.winnerID
          });
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        checkedAt: Date.now(),
        data
      };
    } catch (error) {
      handleContractError(error, 'validateElectionIntegrity');
    }
  },

  /**
   * Export election data for auditing
   */
  async exportElectionData(contract, options = {}) {
    try {
      const data = await this.getFullElectionData(contract);
      
      // Get event history if requested
      if (options.includeEvents) {
        const events = await Promise.all([
          eventManager.getEventHistory(contract, 'VoteCast', options.fromBlock),
          eventManager.getEventHistory(contract, 'VoterRegistered', options.fromBlock),
          eventManager.getEventHistory(contract, 'CandidateAdded', options.fromBlock)
        ]);

        data.events = {
          votes: events[0],
          registrations: events[1],
          candidates: events[2]
        };
      }

      // Add metadata
      data.export = {
        timestamp: Date.now(),
        exportedBy: options.exportedBy || 'unknown',
        version: '1.0.0',
        contractAddress: contract._address,
        includeEvents: !!options.includeEvents
      };

      return data;
    } catch (error) {
      handleContractError(error, 'exportElectionData');
    }
  },

  /**
   * Performance monitoring
   */
  getPerformanceMetrics() {
    return {
      cacheHitRate: contractCache.getHitRate?.() || 'N/A',
      pendingTransactions: transactionManager.pendingTransactions.size,
      transactionHistory: transactionManager.transactionHistory.length,
      activeSubscriptions: contractManager.eventSubscriptions.size,
      cacheSize: contractCache.cache?.size || 0
    };
  }
};

// ==================== DEVELOPMENT HELPERS ====================

export const devUtils = {
  /**
   * Reset all caches and subscriptions
   */
  reset() {
    contractCache.clear();
    eventManager.unsubscribeAll();
    transactionManager.pendingTransactions.clear();
    contractManager.contracts.clear();
    console.log('Contract interaction system reset');
  },

  /**
   * Enable debug mode
   */
  enableDebugMode() {
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog('[CONTRACT DEBUG]', new Date().toISOString(), ...args);
    };
    
    console.log('Debug mode enabled');
  },

  /**
   * Get system status
   */
  getSystemStatus() {
    return {
      config: CONFIG,
      performance: advancedUtils.getPerformanceMetrics(),
      cache: {
        size: contractCache.cache?.size || 0,
        ttl: contractCache.ttl
      },
      transactions: {
        pending: transactionManager.pendingTransactions.size,
        history: transactionManager.transactionHistory.length
      },
      events: {
        subscriptions: contractManager.eventSubscriptions.size
      }
    };
  },

  /**
   * Simulate transaction for testing
   */
  async simulateTransaction(contract, methodName, params, fromAddress) {
    try {
      // Only estimate gas, don't actually send
      const gasEstimate = await contract.methods[methodName](...params)
        .estimateGas({ from: fromAddress });
      
      return {
        success: true,
        gasEstimate: gasEstimate,
        gasEstimateWithBuffer: Math.floor(gasEstimate * CONFIG.GAS_BUFFER_MULTIPLIER),
        method: methodName,
        params
      };
    } catch (error) {
      return {
        success: false,
        error: web3Utils.parseContractError(error),
        method: methodName,
        params
      };
    }
  }
};

// ==================== CLEANUP AND TEARDOWN ====================

// Cleanup function for when component unmounts
export const cleanup = () => {
  eventManager.unsubscribeAll();
  if (multicallManager.batchTimer) {
    clearTimeout(multicallManager.batchTimer);
  }
};

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}

// ==================== DEFAULT EXPORT ====================

export default {
  contractInteraction,
  advancedUtils,
  devUtils,
  getContract,
  setContractAddress,
  validateContract,
  cleanup,
  ContractError
};