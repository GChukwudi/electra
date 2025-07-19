/**
 * Deploy to Testnet Script
 * Automated deployment and setup for Sepolia testnet with comprehensive validation
 * @author God's Favour Chukwudi
 */

const { execSync } = require('child_process');
const Web3 = require('web3');
require('dotenv').config();

// Configuration
const CONFIG = {
  NETWORK: 'sepolia',
  REQUIRED_ETH: '0.1', // Minimum ETH required for deployment
  GAS_PRICE_LIMIT: '50000000000', // 50 Gwei max
  CONFIRMATION_BLOCKS: 2,
  TIMEOUT: 300000 // 5 minutes
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}`);
  console.log(`${colors.bright}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

function logStep(step, description) {
  console.log(`${colors.yellow}[${step}]${colors.reset} ${description}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

// Validate environment variables
function validateEnvironment() {
  logSection('ENVIRONMENT VALIDATION');
  
  const required = [
    'PRIVATE_KEY',
    'INFURA_PROJECT_ID',
    'ETHERSCAN_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logError(`Missing required environment variables: ${missing.join(', ')}`);
    logError('Please check your .env file');
    process.exit(1);
  }
  
  // Validate private key format
  if (!process.env.PRIVATE_KEY.startsWith('0x')) {
    logError('PRIVATE_KEY must start with 0x');
    process.exit(1);
  }
  
  if (process.env.PRIVATE_KEY.length !== 66) {
    logError('PRIVATE_KEY must be 64 characters long (plus 0x prefix)');
    process.exit(1);
  }
  
  logSuccess('Environment variables validated');
}

// Check account balance
async function checkBalance(web3, account) {
  logSection('ACCOUNT BALANCE CHECK');
  
  try {
    const balance = await web3.eth.getBalance(account);
    const balanceEth = web3.utils.fromWei(balance, 'ether');
    
    log(`Account: ${account}`, 'cyan');
    log(`Balance: ${balanceEth} ETH`, 'cyan');
    
    if (parseFloat(balanceEth) < parseFloat(CONFIG.REQUIRED_ETH)) {
      logError(`Insufficient balance. Required: ${CONFIG.REQUIRED_ETH} ETH, Available: ${balanceEth} ETH`);
      logError('Please fund your account with Sepolia testnet ETH from a faucet:');
      logError('- https://sepoliafaucet.com/');
      logError('- https://faucet.sepolia.dev/');
      process.exit(1);
    }
    
    logSuccess(`Account has sufficient balance: ${balanceEth} ETH`);
    return balanceEth;
  } catch (error) {
    logError(`Failed to check balance: ${error.message}`);
    process.exit(1);
  }
}

// Check gas price
async function checkGasPrice(web3) {
  logSection('GAS PRICE CHECK');
  
  try {
    const gasPrice = await web3.eth.getGasPrice();
    const gasPriceGwei = web3.utils.fromWei(gasPrice, 'gwei');
    
    log(`Current gas price: ${gasPriceGwei} Gwei`, 'cyan');
    
    if (parseFloat(gasPrice) > parseFloat(CONFIG.GAS_PRICE_LIMIT)) {
      logWarning(`Gas price is high: ${gasPriceGwei} Gwei`);
      logWarning('Consider waiting for lower gas prices');
    } else {
      logSuccess(`Gas price is acceptable: ${gasPriceGwei} Gwei`);
    }
    
    return gasPrice;
  } catch (error) {
    logError(`Failed to check gas price: ${error.message}`);
    process.exit(1);
  }
}

// Compile contracts
function compileContracts() {
  logSection('CONTRACT COMPILATION');
  
  try {
    logStep('1', 'Cleaning previous builds...');
    execSync('npx truffle compile --all', { stdio: 'pipe' });
    
    logStep('2', 'Compiling contracts...');
    const output = execSync('npx truffle compile', { encoding: 'utf8' });
    
    if (output.includes('Compilation warnings')) {
      logWarning('Compilation completed with warnings');
      console.log(output);
    } else {
      logSuccess('Contracts compiled successfully');
    }
    
    return true;
  } catch (error) {
    logError(`Compilation failed: ${error.message}`);
    return false;
  }
}

// Deploy contracts
async function deployContracts() {
  logSection('CONTRACT DEPLOYMENT');
  
  try {
    logStep('1', 'Starting deployment to Sepolia testnet...');
    
    const deployCommand = `npx truffle migrate --network ${CONFIG.NETWORK} --reset`;
    const output = execSync(deployCommand, { 
      encoding: 'utf8',
      timeout: CONFIG.TIMEOUT 
    });
    
    console.log(output);
    
    // Extract contract address from output
    const addressMatch = output.match(/contract address:\s+(0x[a-fA-F0-9]{40})/i);
    const contractAddress = addressMatch ? addressMatch[1] : null;
    
    if (contractAddress) {
      logSuccess(`Deployment successful!`);
      log(`Contract Address: ${contractAddress}`, 'green');
      return contractAddress;
    } else {
      logError('Could not extract contract address from deployment output');
      return null;
    }
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    return null;
  }
}

// Verify contract on Etherscan
async function verifyContract(contractAddress) {
  logSection('CONTRACT VERIFICATION');
  
  if (!process.env.ETHERSCAN_API_KEY) {
    logWarning('ETHERSCAN_API_KEY not provided, skipping verification');
    return false;
  }
  
  try {
    logStep('1', 'Verifying contract on Etherscan...');
    
    const verifyCommand = `npx truffle run verify Electra --network ${CONFIG.NETWORK}`;
    const output = execSync(verifyCommand, { 
      encoding: 'utf8',
      timeout: 60000 // 1 minute timeout for verification
    });
    
    console.log(output);
    
    if (output.includes('Successfully verified')) {
      logSuccess('Contract verified on Etherscan');
      log(`View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`, 'cyan');
      return true;
    } else {
      logWarning('Verification completed but may need manual review');
      return false;
    }
    
  } catch (error) {
    logWarning(`Verification failed: ${error.message}`);
    logWarning('You can verify manually on Etherscan');
    return false;
  }
}

// Test basic contract functionality
async function testContract(web3, contractAddress) {
  logSection('CONTRACT FUNCTIONALITY TEST');
  
  try {
    const Electra = require('../build/contracts/Electra.json');
    const contract = new web3.eth.Contract(Electra.abi, contractAddress);
    
    logStep('1', 'Testing contract deployment...');
    const code = await web3.eth.getCode(contractAddress);
    if (code === '0x') {
      throw new Error('Contract not deployed at the specified address');
    }
    logSuccess('Contract is deployed');
    
    logStep('2', 'Testing basic contract functions...');
    const totalCandidates = await contract.methods.totalCandidates().call();
    const nextVoterID = await contract.methods.nextVoterID().call();
    logSuccess(`Total candidates: ${totalCandidates}`);
    logSuccess(`Next voter ID: ${nextVoterID}`);
    
    logStep('3', 'Testing owner and commissioner...');
    const owner = await contract.methods.systemOwner().call();
    const commissioner = await contract.methods.currentCommissioner().call();
    log(`System Owner: ${owner}`, 'cyan');
    log(`Commissioner: ${commissioner}`, 'cyan');
    
    logSuccess('Contract functionality test passed');
    return true;
    
  } catch (error) {
    logError(`Contract test failed: ${error.message}`);
    return false;
  }
}

// Setup demo data
async function setupDemo(web3, contractAddress) {
  logSection('DEMO DATA SETUP');
  
  try {
    const Electra = require('../build/contracts/Electra.json');
    const contract = new web3.eth.Contract(Electra.abi, contractAddress);
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    
    logStep('1', 'Creating sample election...');
    
    const currentTime = Math.floor(Date.now() / 1000);
    const registrationDeadline = currentTime + (24 * 60 * 60); // 24 hours
    const startTime = registrationDeadline + (2 * 60 * 60); // 2 hours after registration
    const endTime = startTime + (48 * 60 * 60); // 48 hours voting period
    
    const createElectionTx = await contract.methods.createElection(
      "Nigeria 2027 Presidential Election - Electra Testnet",
      "Demonstration election for Electra blockchain voting system on Sepolia testnet",
      registrationDeadline,
      startTime,
      endTime
    ).send({
      from: account.address,
      gas: 500000
    });
    
    logSuccess(`Election created! Tx: ${createElectionTx.transactionHash}`);
    
    logStep('2', 'Adding sample candidates...');
    
    const candidates = [
      {
        name: "Dr. Amina Hassan",
        party: "Progressive Democratic Party",
        manifesto: "Unity, progress, and digital transformation for Nigeria's future. Focusing on technology-driven governance and inclusive development."
      },
      {
        name: "Engr. Chike Okafor",
        party: "People's Liberation Movement",
        manifesto: "Economic empowerment and social justice for all Nigerians. Championing grassroots development and industrial growth."
      },
      {
        name: "Prof. Fatima Abdullahi",
        party: "National Renewal Alliance",
        manifesto: "Security, infrastructure, and educational excellence. Building a secure and educated Nigeria for the next generation."
      }
    ];
    
    for (const candidate of candidates) {
      const addCandidateTx = await contract.methods.addCandidate(
        candidate.name,
        candidate.party,
        candidate.manifesto
      ).send({
        from: account.address,
        gas: 300000
      });
      
      logSuccess(`Added candidate: ${candidate.name}`);
    }
    
    logStep('3', 'Demo setup completed');
    log(`Election Title: Nigeria 2027 Presidential Election - Electra Testnet`, 'cyan');
    log(`Registration Deadline: ${new Date(registrationDeadline * 1000).toLocaleString()}`, 'cyan');
    log(`Voting Period: ${new Date(startTime * 1000).toLocaleString()} - ${new Date(endTime * 1000).toLocaleString()}`, 'cyan');
    log(`Candidates Added: ${candidates.length}`, 'cyan');
    
    return true;
    
  } catch (error) {
    logError(`Demo setup failed: ${error.message}`);
    return false;
  }
}

// Generate deployment report
function generateReport(contractAddress, balance, gasPrice, verificationStatus) {
  logSection('DEPLOYMENT REPORT');
  
  const report = {
    deployment: {
      network: CONFIG.NETWORK,
      contractAddress: contractAddress,
      timestamp: new Date().toISOString(),
      deployer: process.env.PRIVATE_KEY ? 
        require('web3').eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY).address : 
        'Unknown'
    },
    network: {
      name: 'Sepolia Testnet',
      chainId: 11155111,
      explorer: `https://sepolia.etherscan.io/address/${contractAddress}`
    },
    costs: {
      deployerBalance: balance,
      gasPrice: Web3.utils.fromWei(gasPrice, 'gwei') + ' Gwei'
    },
    verification: {
      etherscan: verificationStatus ? 'Verified' : 'Failed/Skipped'
    },
    nextSteps: [
      'Update your frontend .env with the contract address',
      'Test the contract functionality through the UI',
      'Share the contract address with your team',
      'Monitor the contract on Etherscan for transactions'
    ]
  };
  
  console.log(JSON.stringify(report, null, 2));
  
  // Save report to file
  const fs = require('fs');
  const reportPath = `./deployment-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logSuccess(`Deployment report saved to: ${reportPath}`);
  
  return report;
}

// Main deployment function
async function main() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    ELECTRA TESTNET DEPLOYMENT                ║');
  console.log('║                    Blockchain Voting System                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  let web3, account, contractAddress, balance, gasPrice;
  
  try {
    // Step 1: Validate environment
    validateEnvironment();
    
    // Step 2: Initialize Web3
    logSection('WEB3 INITIALIZATION');
    web3 = new Web3(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
    account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    
    logSuccess(`Connected to Sepolia testnet`);
    logSuccess(`Deployer account: ${account.address}`);
    
    // Step 3: Check balance
    balance = await checkBalance(web3, account.address);
    
    // Step 4: Check gas price
    gasPrice = await checkGasPrice(web3);
    
    // Step 5: Compile contracts
    if (!compileContracts()) {
      process.exit(1);
    }
    
    // Step 6: Deploy contracts
    contractAddress = await deployContracts();
    if (!contractAddress) {
      process.exit(1);
    }
    
    // Step 7: Test contract
    if (!await testContract(web3, contractAddress)) {
      logWarning('Contract tests failed, but deployment may still be valid');
    }
    
    // Step 8: Verify contract
    const verificationStatus = await verifyContract(contractAddress);
    
    // Step 9: Setup demo data
    logStep('OPTIONAL', 'Setting up demo data...');
    try {
      await setupDemo(web3, contractAddress);
    } catch (error) {
      logWarning(`Demo setup failed: ${error.message}`);
      logWarning('You can set up demo data manually later');
    }
    
    // Step 10: Generate report
    generateReport(contractAddress, balance, gasPrice, verificationStatus);
    
    // Success summary
    logSection('DEPLOYMENT COMPLETED SUCCESSFULLY');
    logSuccess('🎉 Electra has been deployed to Sepolia testnet!');
    log(`\n📋 Contract Address: ${colors.green}${contractAddress}${colors.reset}`);
    log(`🔍 Etherscan: ${colors.cyan}https://sepolia.etherscan.io/address/${contractAddress}${colors.reset}`);
    log(`⚡ Network: ${colors.yellow}Sepolia Testnet${colors.reset}`);
    
    console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
    console.log(`1. Update your frontend .env file with:`);
    console.log(`   ${colors.yellow}REACT_APP_CONTRACT_ADDRESS=${contractAddress}${colors.reset}`);
    console.log(`2. Test the application with the deployed contract`);
    console.log(`3. Share the contract address with your team`);
    console.log(`4. Monitor transactions on Etherscan\n`);
    
  } catch (error) {
    logError(`Deployment failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run deployment
if (require.main === module) {
  main().catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };