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
      version: "0.8.19", // Specify the Solidity version
      settings: {
        optimizer: {
          enabled: true, // Enable the optimizer
          runs: 200, // Set the number of optimization runs
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
        if (MNEMONIC) {
        return new HDWalletProvider({
          mnemonic: MNEMONIC,
          providerOrUrl: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
          numberOfAddresses: 10,
          shareNonce: true,
          derivationPath: "m/44'/60'/0'/0/"
        });
      } else if (PRIVATE_KEY) {
        return new HDWalletProvider({
          privateKeys: [PRIVATE_KEY],
          providerOrUrl: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
          numberOfAddresses: 1,
          shareNonce: true
        });
      } else {
        throw new Error("Please set MNEMONIC or PRIVATE_KEY in your .env file");
      }
    },
    network_id: 11155111,
    gas: 6000000,
    gasPrice: 20000000000,
    confirmations: 2,
    timeoutBlocks: 200,
    skipDryRun: true,
    networkCheckTimeout: 100000, // Increase timeout for network checks
    deploymentPollingInterval: 10000,
    },

    goerli: {
      provider: () => {
        if (MNEMONIC) {
          return new HDWalletProvider({
            mnemonic: MNEMONIC,
            providerOrUrl: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
            numberOfAddresses: 10,
            shareNonce: true,
            derivationPath: "m/44'/60'/0'/0/"
          });
        }
      },
      network_id: 5,
      gas: 6000000,
      gasPrice: 20000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
  },

  mocha: {
    timeout: 100000,
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
