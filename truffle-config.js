const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

const {
  MNEMONIC,
  INFURA_PROJECT_ID,
  ETHERSCAN_API_KEY,
  PRIVATE_KEY,
} = process.env;

module.exports = {
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
        viaIR: false,
      }
    }
  },

  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6721975,
      gasPrice: 20000000,
    },

    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 5777,
      gas: 6721975,
      gasPrice: 20000000,
    },

    sepolia: {
      provider: () => {
        let provider;
        
        if (MNEMONIC) {
          provider = new HDWalletProvider({
            mnemonic: MNEMONIC,
            providerOrUrl: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
            numberOfAddresses: 1, // Reduced from 10 to avoid rate limits
            shareNonce: true,
            derivationPath: "m/44'/60'/0'/0/",
            pollingInterval: 15000, // Increased from 8000
            chainId: 11155111
          });
        } else if (PRIVATE_KEY) {
          provider = new HDWalletProvider({
            privateKeys: [PRIVATE_KEY],
            providerOrUrl: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
            numberOfAddresses: 1,
            shareNonce: true,
            pollingInterval: 15000, // Increased from 8000
            chainId: 11155111
          });
        } else {
          throw new Error("Please set MNEMONIC or PRIVATE_KEY in your .env file");
        }

        // Add error handling
        provider.engine.on('error', (err) => {
          console.error('Provider error:', err);
        });

        return provider;
      },
      network_id: 11155111,
      gas: 4000000, // Reduced from 5000000
      gasPrice: 50000000000, // Increased to 50 Gwei for faster confirmation
      confirmations: 2,
      timeoutBlocks: 200, // Increased from 50
      skipDryRun: true,
      networkCheckTimeout: 300000, // Increased to 5 minutes
      deploymentPollingInterval: 15000, // Increased from 8000
      websocket: false,
      disableConfirmationListener: true, // Add this to prevent hanging
    },

    // Alternative Sepolia config using Alchemy (backup)
    sepolia_alchemy: {
      provider: () => {
        let provider;
        
        if (MNEMONIC) {
          provider = new HDWalletProvider({
            mnemonic: MNEMONIC,
            providerOrUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
            numberOfAddresses: 1,
            shareNonce: true,
            derivationPath: "m/44'/60'/0'/0/",
            pollingInterval: 15000,
            chainId: 11155111
          });
        } else if (PRIVATE_KEY) {
          provider = new HDWalletProvider({
            privateKeys: [PRIVATE_KEY],
            providerOrUrl: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
            numberOfAddresses: 1,
            shareNonce: true,
            pollingInterval: 15000,
            chainId: 11155111
          });
        }

        provider.engine.on('error', (err) => {
          console.error('Provider error:', err);
        });

        return provider;
      },
      network_id: 11155111,
      gas: 4000000,
      gasPrice: 50000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 300000,
      deploymentPollingInterval: 15000,
      websocket: false,
      disableConfirmationListener: true,
    },

    // Public RPC backup (no API key needed)
    sepolia_public: {
      provider: () => {
        let provider;
        
        if (MNEMONIC) {
          provider = new HDWalletProvider({
            mnemonic: MNEMONIC,
            providerOrUrl: "https://rpc.ankr.com/eth_sepolia",
            numberOfAddresses: 1,
            shareNonce: true,
            derivationPath: "m/44'/60'/0'/0/",
            pollingInterval: 20000,
            chainId: 11155111
          });
        } else if (PRIVATE_KEY) {
          provider = new HDWalletProvider({
            privateKeys: [PRIVATE_KEY],
            providerOrUrl: "https://rpc.ankr.com/eth_sepolia",
            numberOfAddresses: 1,
            shareNonce: true,
            pollingInterval: 20000,
            chainId: 11155111
          });
        }

        return provider;
      },
      network_id: 11155111,
      gas: 4000000,
      gasPrice: 50000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 300000,
      deploymentPollingInterval: 20000,
      websocket: false,
      disableConfirmationListener: true,
    },

    goerli: {
      provider: () => {
        if (MNEMONIC) {
          return new HDWalletProvider({
            mnemonic: MNEMONIC,
            providerOrUrl: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
            numberOfAddresses: 1, // Reduced from 10
            shareNonce: true,
            derivationPath: "m/44'/60'/0'/0/",
            pollingInterval: 15000,
            chainId: 5
          });
        }
      },
      network_id: 5,
      gas: 4000000, // Reduced
      gasPrice: 20000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 300000,
      deploymentPollingInterval: 15000,
    },
  },

  mocha: {
    timeout: 300000,
    useColors: true,
    reporter: 'spec'
  },

  contracts_directory: './contracts',
  contracts_build_directory: './client/src/contracts',
  migrations_directory: './migrations',

  plugins: [
    'truffle-plugin-verify',
  ],

  api_keys: {
    etherscan: ETHERSCAN_API_KEY
  },

  dashboard: {
    port: 24012,
    host: "localhost"
  }
};
