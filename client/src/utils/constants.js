// Contract configuration
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x4D9D77d535f4F50213FbBCB9573935435Cc751b5";
export const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID) || 11155111;
export const NETWORK_NAME = import.meta.env.VITE_NETWORK_NAME || "sepolia";

// Network configurations
export const NETWORKS = {
  11155111: {
    name: "Sepolia Testnet",
    rpcUrl: "https://sepolia.infura.io/v3/",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: {
      name: "SepoliaETH",
      symbol: "ETH",
      decimals: 18
    }
  },
  1: {
    name: "Ethereum Mainnet",
    rpcUrl: "https://mainnet.infura.io/v3/",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
    }
  }
};

export const USER_ROLES = {
  NONE: 0,
  VOTER: 1,
  OBSERVER: 2,
  ADMIN: 3,
  COMMISSIONER: 4
};

export const ROLE_NAMES = {
  0: "None",
  1: "Voter",
  2: "Observer", 
  3: "Admin",
  4: "Commissioner"
};

export const COLORS = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryLight: '#eff6ff',
  secondary: '#059669',
  secondaryHover: '#047857',
  danger: '#dc2626',
  dangerHover: '#b91c1c',
  warning: '#d97706',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
  background: '#ffffff',
  backgroundLight: '#f9fafb'
};

export const STATUS_COLORS = {
  active: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  inactive: {
    backgroundColor: '#fef2f2',
    color: '#991b1b'
  },
  pending: {
    backgroundColor: '#fef3c7',
    color: '#92400e'
  }
};

export const REFRESH_INTERVALS = {
  ELECTION_DATA: 30000,
  WALLET_CHECK: 5000
};

export const GAS_LIMITS = {
  REGISTER: 200000,
  VOTE: 200000,
  ADD_CANDIDATE: 400000,
  CREATE_ELECTION: 500000
};