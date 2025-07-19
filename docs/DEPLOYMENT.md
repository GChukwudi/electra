# Electra Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Electra blockchain voting system from smart contract compilation to frontend deployment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Frontend Configuration](#frontend-configuration)
- [Local Development](#local-development)
- [Testnet Deployment](#testnet-deployment)
- [Production Deployment](#production-deployment)
- [Verification and Testing](#verification-and-testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js** (v18.0.0 or higher)
   ```bash
   node --version
   npm --version
   ```

2. **Git**
   ```bash
   git --version
   ```

3. **MetaMask Browser Extension**
   - Install from [metamask.io](https://metamask.io)

### Required Accounts

1. **Ethereum Wallet** (for deployment)
   - Generate via MetaMask or other wallet
   - Fund with testnet ETH for testing

2. **Infura/Alchemy Account** (for network access)
   - Sign up at [infura.io](https://infura.io) or [alchemy.com](https://alchemy.com)
   - Create project and get API key

3. **Etherscan Account** (for contract verification)
   - Sign up at [etherscan.io](https://etherscan.io)
   - Get API key for contract verification

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/electra-voting-system.git
cd electra-voting-system
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install smart contract dependencies
cd contracts
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Configuration

Create environment files for different deployment stages:

**`.env.local` (Local Development):**
```env
# Network Configuration
PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key

# Contract Configuration
REACT_APP_CHAIN_ID=1337
REACT_APP_NETWORK_NAME=Local
REACT_APP_CONTRACT_ADDRESS=

# Frontend Configuration
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
```

**`.env.testnet` (Sepolia Testnet):**
```env
# Network Configuration
PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key

# Contract Configuration
REACT_APP_CHAIN_ID=11155111
REACT_APP_NETWORK_NAME=Sepolia
REACT_APP_CONTRACT_ADDRESS=

# Frontend Configuration
REACT_APP_ENVIRONMENT=testnet
REACT_APP_DEBUG=true
```

**`.env.production` (Mainnet - Future Use):**
```env
# Network Configuration
PRIVATE_KEY=your_private_key_here
INFURA_PROJECT_ID=your_infura_project_id
ETHERSCAN_API_KEY=your_etherscan_api_key

# Contract Configuration
REACT_APP_CHAIN_ID=1
REACT_APP_NETWORK_NAME=Mainnet
REACT_APP_CONTRACT_ADDRESS=

# Frontend Configuration
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
```

## Smart Contract Deployment

### 1. Compile Contracts

```bash
cd contracts
npx truffle compile
```

**Expected Output:**
```
Compiling your contracts...
===========================
> Compiling ./contracts/Electra.sol
> Compiling ./contracts/ElectraAccessControl.sol
> Compiling ./contracts/Migrations.sol

> Compilation warnings encountered:
  - Warning: Contract code size is close to limit (remove unused code)

> Artifacts written to /build/contracts
> Compiled successfully using solc 0.8.19
```

### 2. Configure Truffle Networks

**`truffle-config.js`:**
```javascript
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
      gas: 6721975,
      gasPrice: 20000000000
    },

    sepolia: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,
        `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
      ),
      network_id: 11155111,
      gas: 5500000,
      gasPrice: 20000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },

    mainnet: {
      provider: () => new HDWalletProvider(
        process.env.PRIVATE_KEY,
        `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
      ),
      network_id: 1,
      gas: 5500000,
      gasPrice: 20000000000,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },

  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  plugins: [
    'truffle-plugin-verify'
  ],

  api_keys: {
    etherscan: process.env.ETHERSCAN_API_KEY
  }
};
```

### 3. Deploy to Local Network (Ganache)

**Start Ganache:**
```bash
# Option 1: Ganache CLI
npm install -g ganache-cli
ganache-cli --deterministic --accounts 10 --host 0.0.0.0 --port 8545

# Option 2: Ganache GUI
# Download and start Ganache application
```

**Deploy Contracts:**
```bash
# Load local environment
cp .env.local .env

# Deploy to local network
npx truffle migrate --network development --reset

# Verify deployment
npx truffle console --network development
truffle(development)> Electra.deployed().then(instance => instance.address)
```

### 4. Deploy to Sepolia Testnet

**Get Testnet ETH:**
1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Request test ETH using your wallet address

**Deploy to Sepolia:**
```bash
# Load testnet environment
cp .env.testnet .env

# Deploy to Sepolia
npx truffle migrate --network sepolia --reset

# Save contract address from output
```

**Verify Contract on Etherscan:**
```bash
npx truffle run verify Electra --network sepolia
```

### 5. Deployment Verification

**Check Contract Status:**
```bash
npx truffle console --network sepolia

# Get contract instance
truffle(sepolia)> let electra = await Electra.deployed()

# Verify contract is working
truffle(sepolia)> await electra.systemOwner()
truffle(sepolia)> await electra.totalCandidates()
```

## Frontend Configuration

### 1. Update Contract Address

After successful deployment, update the frontend configuration:

**Update `.env` file:**
```env
REACT_APP_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 2. Verify ABI Compatibility

Ensure the frontend has the correct contract ABI:

```bash
# Copy ABI from compiled contracts
cp contracts/build/contracts/Electra.json frontend/src/abis/
```

### 3. Update Contract Interaction Configuration

**In `frontend/src/utils/contractInteraction.js`:**
```javascript
// Update contract address
const ELECTRA_CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || 
  '0xYourContractAddress';

// Verify ABI is imported correctly
import ElectraABI from '../abis/Electra.json';
```

## Local Development

### 1. Start Local Blockchain

```bash
# Terminal 1: Start Ganache
ganache-cli --deterministic --accounts 10 --host 0.0.0.0 --port 8545
```

### 2. Deploy Contracts Locally

```bash
# Terminal 2: Deploy contracts
cd contracts
cp .env.local .env
npx truffle migrate --network development --reset
```

### 3. Start Frontend Development Server

```bash
# Terminal 3: Start React app
cd frontend
npm start
```

### 4. Configure MetaMask for Local Development

1. **Add Local Network:**
   - Network Name: Local Ganache
   - RPC URL: http://localhost:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

2. **Import Test Account:**
   - Copy private key from Ganache
   - Import into MetaMask

### 5. Test Basic Functionality

1. **Connect Wallet** in the frontend
2. **Create Sample Election** (if you have admin rights)
3. **Register as Voter**
4. **Cast Vote**
5. **View Results**

## Testnet Deployment

### 1. Prepare for Testnet

```bash
# Set testnet environment
cp .env.testnet .env

# Verify testnet ETH balance
npx truffle console --network sepolia
truffle(sepolia)> web3.eth.getBalance('your_wallet_address')
```

### 2. Deploy to Sepolia

```bash
# Deploy contracts
npx truffle migrate --network sepolia --reset

# Record deployment information
echo "Contract deployed at: $(npx truffle networks --network sepolia)"
```

### 3. Verify Contract

```bash
# Verify on Etherscan
npx truffle run verify Electra --network sepolia

# Manual verification (if automatic fails)
# Go to https://sepolia.etherscan.io/verifyContract
# Upload flattened source code
```

### 4. Configure Frontend for Testnet

```bash
# Update environment variables
export REACT_APP_CONTRACT_ADDRESS=0xYourSepoliaContractAddress
export REACT_APP_CHAIN_ID=11155111

# Build and test
npm run build
npm start
```

### 5. Test on Testnet

1. **Switch MetaMask to Sepolia**
2. **Get testnet ETH** from faucet
3. **Test all functionality**
4. **Monitor gas usage** and optimize if needed

## Production Deployment

### 1. Security Checklist

- [ ] Smart contracts audited
- [ ] Private keys secured
- [ ] Environment variables encrypted
- [ ] Access controls verified
- [ ] Gas optimizations implemented
- [ ] Frontend security headers configured

### 2. Smart Contract Deployment to Mainnet

```bash
# CAUTION: This deploys to mainnet with real ETH
cp .env.production .env

# Final security check
npx truffle compile
npx slither contracts/Electra.sol  # Optional: security analysis

# Deploy to mainnet
npx truffle migrate --network mainnet --reset

# Verify immediately
npx truffle run verify Electra --network mainnet
```

### 3. Frontend Production Build

```bash
cd frontend

# Production build
npm run build

# Test production build locally
npm install -g serve
serve -s build -l 3000
```

### 4. Deploy Frontend

**Option A: Netlify Deployment**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --prod --dir=build
```

**Option B: Vercel Deployment**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod
```

**Option C: Traditional Web Server**
```bash
# Upload build folder to web server
scp -r build/* user@server:/var/www/electra/
```

## Verification and Testing

### 1. Contract Verification Checklist

- [ ] Contract deployed successfully
- [ ] Contract verified on Etherscan
- [ ] Owner address is correct
- [ ] Access controls working
- [ ] All functions callable
- [ ] Events emitting correctly

### 2. Frontend Integration Testing

```bash
# Run frontend tests
cd frontend
npm test

# Test contract integration
npm run test:integration
```

### 3. End-to-End Testing

**Test Flow:**
1. Connect wallet
2. Check user role
3. Register voter (if needed)
4. Add candidates (admin)
5. Start voting (commissioner)
6. Cast votes
7. View results
8. End and finalize election

### 4. Performance Testing

```bash
# Test gas usage
npx truffle test --network sepolia

# Test frontend performance
npm run build
npm install -g lighthouse
lighthouse http://localhost:3000 --view
```

## Troubleshooting

### Common Smart Contract Issues

**1. Deployment Fails:**
```bash
# Check gas limit
# Verify private key is correct
# Ensure sufficient ETH balance
# Check network connectivity
```

**2. Contract Verification Fails:**
```bash
# Ensure exact solidity version match
# Check constructor parameters
# Verify contract address
# Try manual verification on Etherscan
```

**3. Transaction Fails:**
```bash
# Check gas limit and price
# Verify function permissions
# Ensure correct parameters
# Check contract state
```

### Common Frontend Issues

**1. Cannot Connect to Contract:**
```bash
# Verify contract address in .env
# Check network ID matches
# Ensure MetaMask is connected
# Verify ABI is correct
```

**2. Transaction Rejected:**
```bash
# Check user has sufficient ETH
# Verify user permissions
# Ensure correct network
# Check contract state
```

**3. Frontend Build Fails:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Verify environment variables
```

### Network-Specific Issues

**Sepolia Testnet:**
- Get testnet ETH from multiple faucets if needed
- Testnet can be slow during high usage
- Some RPC endpoints may be unreliable

**Local Development:**
- Ensure Ganache is running on correct port
- Reset MetaMask account if nonce issues
- Clear browser cache if persistent issues

## Monitoring and Maintenance

### 1. Set Up Monitoring

```bash
# Monitor contract events
node scripts/monitor-events.js

# Check contract health
node scripts/health-check.js
```

### 2. Regular Maintenance Tasks

- Monitor gas prices and optimize
- Update frontend dependencies
- Backup critical data
- Monitor for security vulnerabilities
- Update documentation

### 3. Emergency Procedures

**In case of critical issues:**
1. Activate emergency mode (if implemented)
2. Pause system operations
3. Notify all stakeholders
4. Investigate and fix issues
5. Resume operations safely

## Additional Resources

- [Truffle Documentation](https://trufflesuite.com/docs/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [Etherscan API](https://docs.etherscan.io/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Solidity Documentation](https://docs.soliditylang.org/)

## Support

For deployment support:
1. Check the troubleshooting section
2. Review contract and frontend logs
3. Verify all prerequisites are met
4. Test on local network first
5. Consult the Electra documentation

Remember: Always test thoroughly on testnets before mainnet deployment!
