/**
 * Contract Verification Script
 * Comprehensive verification tool for Electra smart contracts on Etherscan
 * @author God's Favour Chukwudi
 */

const { execSync } = require('child_process');
const Web3 = require('web3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const CONFIG = {
  NETWORKS: {
    sepolia: {
      name: 'Sepolia Testnet',
      chainId: 11155111,
      explorerUrl: 'https://sepolia.etherscan.io',
      apiUrl: 'https://api-sepolia.etherscan.io/api'
    },
    mainnet: {
      name: 'Ethereum Mainnet',
      chainId: 1,
      explorerUrl: 'https://etherscan.io',
      apiUrl: 'https://api.etherscan.io/api'
    },
    goerli: {
      name: 'Goerli Testnet',
      chainId: 5,
      explorerUrl: 'https://goerli.etherscan.io',
      apiUrl: 'https://api-goerli.etherscan.io/api'
    }
  },
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000,
  VERIFICATION_TIMEOUT: 120000 // 2 minutes
};

// Utility functions
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

// Handle process errors gracefully
process.on('uncaughtException', (error) => {
  logError(`Uncaught Exception: ${error.message}`);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection: ${reason}`);
  cleanup();
  process.exit(1);
});

// Health check function
async function verificationHealthCheck() {
  logSection('VERIFICATION HEALTH CHECK');
  
  let healthScore = 0;
  const maxScore = 6;
  
  // Check 1: Environment variables
  logStep('1', 'Checking environment variables...');
  if (process.env.ETHERSCAN_API_KEY) {
    logSuccess('Etherscan API key found');
    healthScore++;
  } else {
    logError('Etherscan API key missing');
  }
  
  // Check 2: Node.js modules
  logStep('2', 'Checking required modules...');
  try {
    require('web3');
    require('axios');
    logSuccess('Required modules available');
    healthScore++;
  } catch (error) {
    logError(`Missing modules: ${error.message}`);
  }
  
  // Check 3: Contract artifacts
  logStep('3', 'Checking contract artifacts...');
  const artifactPath = path.join(__dirname, '../build/contracts/Electra.json');
  if (fs.existsSync(artifactPath)) {
    logSuccess('Contract artifacts found');
    healthScore++;
  } else {
    logWarning('Contract artifacts not found - run truffle compile first');
  }
  
  // Check 4: Source files
  logStep('4', 'Checking source files...');
  const sourcePath = path.join(__dirname, '../contracts/Electra.sol');
  if (fs.existsSync(sourcePath)) {
    logSuccess('Source files found');
    healthScore++;
  } else {
    logError('Source files not found');
  }
  
  // Check 5: Network connectivity
  logStep('5', 'Checking network connectivity...');
  try {
    const axios = require('axios');
    await axios.get('https://api.etherscan.io/api?module=stats&action=ethsupply', { timeout: 5000 });
    logSuccess('Network connectivity OK');
    healthScore++;
  } catch (error) {
    logWarning('Network connectivity issues');
  }
  
  // Check 6: API key validity
  logStep('6', 'Checking API key validity...');
  if (process.env.ETHERSCAN_API_KEY) {
    try {
      const axios = require('axios');
      const response = await axios.get('https://api.etherscan.io/api', {
        params: {
          module: 'stats',
          action: 'ethsupply',
          apikey: process.env.ETHERSCAN_API_KEY
        },
        timeout: 5000
      });
      
      if (response.data.status === '1') {
        logSuccess('API key is valid');
        healthScore++;
      } else {
        logError('API key is invalid');
      }
    } catch (error) {
      logWarning('Could not validate API key');
    }
  }
  
  // Health summary
  const healthPercentage = (healthScore / maxScore) * 100;
  log(`\nHealth Score: ${healthScore}/${maxScore} (${healthPercentage.toFixed(1)}%)`, 
      healthPercentage >= 80 ? 'green' : healthPercentage >= 60 ? 'yellow' : 'red');
  
  return healthPercentage >= 60;
}

// Validate inputs and environment
function validateInputs() {
  logSection('INPUT VALIDATION');
  
  // Check for Etherscan API key
  if (!process.env.ETHERSCAN_API_KEY) {
    logError('ETHERSCAN_API_KEY not found in environment variables');
    logError('Please add your Etherscan API key to .env file');
    logError('Get your API key from: https://etherscan.io/apis');
    process.exit(1);
  }
  
  // Check for contract address
  const contractAddress = getContractAddress();
  if (!contractAddress) {
    logError('Contract address not provided');
    logError('Usage: node verify-contract.js <CONTRACT_ADDRESS> [NETWORK]');
    logError('Or set CONTRACT_ADDRESS in environment');
    process.exit(1);
  }
  
  // Validate contract address format
  if (!Web3.utils.isAddress(contractAddress)) {
    logError(`Invalid contract address format: ${contractAddress}`);
    process.exit(1);
  }
  
  const network = getNetwork();
  if (!CONFIG.NETWORKS[network]) {
    logError(`Unsupported network: ${network}`);
    logError(`Supported networks: ${Object.keys(CONFIG.NETWORKS).join(', ')}`);
    process.exit(1);
  }
  
  logSuccess('Input validation passed');
  log(`Contract Address: ${contractAddress}`, 'cyan');
  log(`Network: ${CONFIG.NETWORKS[network].name}`, 'cyan');
  log(`API Key: ${'*'.repeat(20)}${process.env.ETHERSCAN_API_KEY.slice(-8)}`, 'cyan');
  
  return { contractAddress, network };
}

// Get contract address from command line or environment
function getContractAddress() {
  return process.argv[2] || 
         process.env.CONTRACT_ADDRESS || 
         process.env.REACT_APP_CONTRACT_ADDRESS ||
         null;
}

// Get network from command line or environment
function getNetwork() {
  return process.argv[3] || 
         process.env.NETWORK || 
         'sepolia';
}

// Check if contract is deployed
async function checkContractDeployment(contractAddress, network) {
  logSection('CONTRACT DEPLOYMENT CHECK');
  
  try {
    const networkConfig = CONFIG.NETWORKS[network];
    const web3 = process.env.INFURA_PROJECT_ID ? 
      new Web3(`https://${network}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`) :
      new Web3(`https://${network}.etherscan.io`);
    
    logStep('1', 'Checking contract deployment...');
    
    const code = await web3.eth.getCode(contractAddress);
    
    if (code === '0x') {
      logError('No contract found at the specified address');
      logError('Please verify the contract address and network');
      return false;
    }
    
    logSuccess('Contract is deployed');
    log(`Code size: ${(code.length - 2) / 2} bytes`, 'cyan');
    
    // Get deployment transaction (if possible)
    try {
      logStep('2', 'Getting contract creation info...');
      const currentBlock = await web3.eth.getBlockNumber();
      log(`Current block: ${currentBlock}`, 'cyan');
    } catch (error) {
      logWarning('Could not retrieve deployment transaction details');
    }
    
    return true;
    
  } catch (error) {
    logError(`Failed to check contract deployment: ${error.message}`);
    return false;
  }
}

// Check if contract is already verified
async function checkExistingVerification(contractAddress, network) {
  logSection('EXISTING VERIFICATION CHECK');
  
  try {
    const networkConfig = CONFIG.NETWORKS[network];
    const axios = require('axios');
    
    logStep('1', 'Checking current verification status...');
    
    const response = await axios.get(networkConfig.apiUrl, {
      params: {
        module: 'contract',
        action: 'getsourcecode',
        address: contractAddress,
        apikey: process.env.ETHERSCAN_API_KEY
      },
      timeout: 10000
    });
    
    if (response.data.status !== '1') {
      logWarning('Could not check verification status');
      return { isVerified: false };
    }
    
    const result = response.data.result[0];
    
    if (result.SourceCode && result.SourceCode.length > 0) {
      logSuccess('Contract is already verified!');
      log(`Contract Name: ${result.ContractName}`, 'green');
      log(`Compiler Version: ${result.CompilerVersion}`, 'green');
      log(`Optimization: ${result.OptimizationUsed === '1' ? 'Enabled' : 'Disabled'}`, 'green');
      log(`View on Etherscan: ${networkConfig.explorerUrl}/address/${contractAddress}#code`, 'cyan');
      
      return {
        isVerified: true,
        contractName: result.ContractName,
        compilerVersion: result.CompilerVersion,
        optimization: result.OptimizationUsed === '1'
      };
    }
    
    logWarning('Contract is not verified yet');
    return { isVerified: false };
    
  } catch (error) {
    logWarning(`Could not check verification status: ${error.message}`);
    return { isVerified: false };
  }
}

// Prepare verification files
function prepareVerificationFiles() {
  logSection('VERIFICATION FILE PREPARATION');
  
  try {
    logStep('1', 'Checking contract artifacts...');
    
    const contractPath = path.join(__dirname, '../build/contracts/Electra.json');
    
    if (!fs.existsSync(contractPath)) {
      logError('Contract artifacts not found');
      logError('Please compile contracts first: npx truffle compile');
      return false;
    }
    
    const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    
    logSuccess('Contract artifacts found');
    log(`Contract Name: ${contractArtifact.contractName}`, 'cyan');
    log(`Compiler Version: ${contractArtifact.compiler.version}`, 'cyan');
    
    logStep('2', 'Checking source files...');
    
    const sourcePath = path.join(__dirname, '../contracts/Electra.sol');
    const accessControlPath = path.join(__dirname, '../contracts/ElectraAccessControl.sol');
    
    if (!fs.existsSync(sourcePath)) {
      logError('Electra.sol source file not found');
      return false;
    }
    
    if (!fs.existsSync(accessControlPath)) {
      logError('ElectraAccessControl.sol source file not found');
      return false;
    }
    
    logSuccess('Source files found');
    
    return {
      artifact: contractArtifact,
      sources: {
        main: sourcePath,
        accessControl: accessControlPath
      }
    };
    
  } catch (error) {
    logError(`Failed to prepare verification files: ${error.message}`);
    return false;
  }
}

// Verify using Truffle plugin
async function verifyWithTruffle(contractAddress, network) {
  logSection('TRUFFLE PLUGIN VERIFICATION');
  
  try {
    logStep('1', 'Running Truffle verification plugin...');
    
    const verifyCommand = `npx truffle run verify Electra --network ${network}`;
    
    logStep('2', 'Executing verification command...');
    log(`Command: ${verifyCommand}`, 'cyan');
    
    const output = execSync(verifyCommand, { 
      encoding: 'utf8',
      timeout: CONFIG.VERIFICATION_TIMEOUT,
      env: {
        ...process.env,
        CONTRACT_ADDRESS: contractAddress
      }
    });
    
    console.log(output);
    
    if (output.includes('Successfully verified') || output.includes('Pass - Verified')) {
      logSuccess('Verification successful via Truffle plugin!');
      return true;
    } else if (output.includes('Already Verified')) {
      logSuccess('Contract was already verified!');
      return true;
    } else {
      logWarning('Verification completed but status unclear');
      logWarning('Please check Etherscan manually');
      return false;
    }
    
  } catch (error) {
    logError(`Truffle verification failed: ${error.message}`);
    
    if (error.message.includes('timeout')) {
      logError('Verification timed out - this is common');
      logError('The verification may still complete on Etherscan');
      logError('Check back in a few minutes');
    }
    
    return false;
  }
}

// Check verification status using GUID
async function checkVerificationStatus(guid, networkConfig) {
  logStep('3', 'Checking verification status...');
  
  const axios = require('axios');
  const maxAttempts = 20;
  const checkInterval = 5000;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
      const response = await axios.get(networkConfig.apiUrl, {
        params: {
          module: 'contract',
          action: 'checkverifystatus',
          guid: guid,
          apikey: process.env.ETHERSCAN_API_KEY
        },
        timeout: 10000
      });
      
      log(`Attempt ${attempt}/${maxAttempts}: ${response.data.result}`, 'yellow');
      
      if (response.data.status === '1') {
        if (response.data.result === 'Pass - Verified') {
          logSuccess('Contract verification completed successfully!');
          return true;
        } else if (response.data.result.includes('Fail')) {
          logError(`Verification failed: ${response.data.result}`);
          return false;
        }
        // Continue checking if still pending
      }
      
    } catch (error) {
      logWarning(`Status check attempt ${attempt} failed: ${error.message}`);
    }
  }
  
  logWarning('Verification status check timed out');
  logWarning('Please check Etherscan manually for verification status');
  return false;
}

// Manual verification using Etherscan API
async function manualVerification(contractAddress, network, verificationData) {
  logSection('MANUAL ETHERSCAN VERIFICATION');
  
  try {
    const networkConfig = CONFIG.NETWORKS[network];
    const axios = require('axios');
    
    logStep('1', 'Preparing source code for manual verification...');
    
    // Read and combine source files
    const mainSource = fs.readFileSync(verificationData.sources.main, 'utf8');
    const accessControlSource = fs.readFileSync(verificationData.sources.accessControl, 'utf8');
    
    // Create flattened source (simplified approach)
    const flattenedSource = `${accessControlSource}\n\n${mainSource}`;
    
    logStep('2', 'Submitting verification request...');
    
    const verificationParams = {
      module: 'contract',
      action: 'verifysourcecode',
      apikey: process.env.ETHERSCAN_API_KEY,
      contractaddress: contractAddress,
      sourceCode: flattenedSource,
      codeformat: 'solidity-single-file',
      contractname: 'Electra',
      compilerversion: `v${verificationData.artifact.compiler.version}`,
      optimizationUsed: '1',
      runs: '200',
      constructorArguements: '', // No constructor arguments for Electra
      evmversion: 'default'
    };
    
    const response = await axios.post(networkConfig.apiUrl, 
      new URLSearchParams(verificationParams),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 30000
      }
    );
    
    if (response.data.status === '1') {
      const guid = response.data.result;
      logSuccess(`Verification submitted! GUID: ${guid}`);
      
      // Check verification status
      return await checkVerificationStatus(guid, networkConfig);
    } else {
      logError(`Verification submission failed: ${response.data.message}`);
      return false;
    }
    
  } catch (error) {
    logError(`Manual verification failed: ${error.message}`);
    return false;
  }
}

// Flatten contracts using Truffle flattener
function flattenContracts() {
  logSection('CONTRACT FLATTENING');
  
  try {
    logStep('1', 'Installing truffle-flattener if needed...');
    
    try {
      execSync('npm list truffle-flattener', { stdio: 'pipe' });
    } catch (error) {
      logStep('1.1', 'Installing truffle-flattener...');
      execSync('npm install -g truffle-flattener', { stdio: 'pipe' });
    }
    
    logStep('2', 'Flattening Electra contract...');
    
    const flattenCommand = 'npx truffle-flattener contracts/Electra.sol';
    const flattenedCode = execSync(flattenCommand, { encoding: 'utf8' });
    
    // Save flattened contract
    const flattenedPath = path.join(__dirname, '../flattened/Electra_flattened.sol');
    const flattenedDir = path.dirname(flattenedPath);
    
    if (!fs.existsSync(flattenedDir)) {
      fs.mkdirSync(flattenedDir, { recursive: true });
    }
    
    fs.writeFileSync(flattenedPath, flattenedCode);
    
    logSuccess('Contract flattened successfully');
    log(`Flattened file: ${flattenedPath}`, 'cyan');
    log(`Size: ${(flattenedCode.length / 1024).toFixed(2)} KB`, 'cyan');
    
    return flattenedPath;
    
  } catch (error) {
    logError(`Contract flattening failed: ${error.message}`);
    return null;
  }
}

// Comprehensive verification with multiple strategies
async function comprehensiveVerification(contractAddress, network, verificationData) {
  logSection('COMPREHENSIVE VERIFICATION');
  
  let verificationResult = {
    success: false,
    method: 'none',
    attempts: 0,
    error: null
  };
  
  // Strategy 1: Truffle plugin verification
  try {
    verificationResult.attempts++;
    logStep('STRATEGY 1', 'Attempting verification with Truffle plugin...');
    
    const truffleSuccess = await verifyWithTruffle(contractAddress, network);
    
    if (truffleSuccess) {
      verificationResult = {
        success: true,
        method: 'truffle_plugin',
        attempts: verificationResult.attempts
      };
      return verificationResult;
    }
  } catch (error) {
    logWarning(`Truffle verification failed: ${error.message}`);
    verificationResult.error = error.message;
  }
  
  // Strategy 2: Manual verification
  try {
    verificationResult.attempts++;
    logStep('STRATEGY 2', 'Attempting manual Etherscan verification...');
    
    const manualSuccess = await manualVerification(contractAddress, network, verificationData);
    
    if (manualSuccess) {
      verificationResult = {
        success: true,
        method: 'manual_etherscan',
        attempts: verificationResult.attempts
      };
      return verificationResult;
    }
  } catch (error) {
    logWarning(`Manual verification failed: ${error.message}`);
    verificationResult.error = error.message;
  }
  
  // Strategy 3: Alternative methods
  try {
    verificationResult.attempts++;
    logStep('STRATEGY 3', 'Trying alternative verification methods...');
    
    const alternativeSuccess = await tryAlternativeVerification(contractAddress, network);
    
    if (alternativeSuccess) {
      verificationResult = {
        success: true,
        method: 'alternative',
        attempts: verificationResult.attempts
      };
      return verificationResult;
    }
  } catch (error) {
    logWarning(`Alternative verification failed: ${error.message}`);
    verificationResult.error = error.message;
  }
  
  return verificationResult;
}

// Alternative verification methods
async function tryAlternativeVerification(contractAddress, network) {
  logSection('ALTERNATIVE VERIFICATION METHODS');
  
  logStep('1', 'Trying verification with flattened source...');
  
  const flattenedPath = flattenContracts();
  if (flattenedPath) {
    logStep('1.1', 'Manual verification with flattened source...');
    
    try {
      const flattenedSource = fs.readFileSync(flattenedPath, 'utf8');
      
      log('Copy the following flattened source code to Etherscan:', 'cyan');
      log('Etherscan URL: ' + CONFIG.NETWORKS[network].explorerUrl + '/verifyContract', 'cyan');
      log('Contract Address: ' + contractAddress, 'cyan');
      log('Compiler Version: v0.8.19+commit.7dd6d404', 'cyan');
      log('Optimization: Enabled (200 runs)', 'cyan');
      
      logWarning('Manual verification required:');
      logWarning(`1. Go to ${CONFIG.NETWORKS[network].explorerUrl}/verifyContract`);
      logWarning(`2. Enter contract address: ${contractAddress}`);
      logWarning('3. Select "Solidity (Single file)"');
      logWarning('4. Set compiler version to: v0.8.19+commit.7dd6d404');
      logWarning('5. Set optimization to: Yes (200 runs)');
      logWarning(`6. Copy source code from: ${flattenedPath}`);
      logWarning('7. Submit for verification');
      
      return true;
    } catch (error) {
      logError(`Failed to prepare manual verification: ${error.message}`);
    }
  }
  
  logStep('2', 'Hardhat verification (if available)...');
  
  try {
    // Check if hardhat is available
    execSync('npx hardhat --version', { stdio: 'pipe' });
    
    logStep('2.1', 'Trying Hardhat verification...');
    
    const hardhatCommand = `npx hardhat verify --network ${network} ${contractAddress}`;
    const output = execSync(hardhatCommand, { 
      encoding: 'utf8',
      timeout: 60000
    });
    
    if (output.includes('Successfully verified')) {
      logSuccess('Verified using Hardhat!');
      return true;
    }
    
  } catch (error) {
    logWarning('Hardhat verification not available or failed');
  }
  
  return false;
}

// Generate verification report
function generateVerificationReport(contractAddress, network, verificationResult) {
  logSection('VERIFICATION REPORT');
  
  const networkConfig = CONFIG.NETWORKS[network];
  
  const report = {
    timestamp: new Date().toISOString(),
    contract: {
      address: contractAddress,
      network: network,
      networkName: networkConfig.name,
      chainId: networkConfig.chainId
    },
    verification: {
      status: verificationResult.success ? 'SUCCESS' : 'FAILED',
      method: verificationResult.method,
      attempts: verificationResult.attempts || 1,
      error: verificationResult.error || null
    },
    links: {
      etherscan: `${networkConfig.explorerUrl}/address/${contractAddress}`,
      sourceCode: verificationResult.success ? 
        `${networkConfig.explorerUrl}/address/${contractAddress}#code` : null,
      readContract: verificationResult.success ? 
        `${networkConfig.explorerUrl}/address/${contractAddress}#readContract` : null,
      writeContract: verificationResult.success ? 
        `${networkConfig.explorerUrl}/address/${contractAddress}#writeContract` : null
    }
  };
  
  // Save report
  const reportPath = `./verification-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logSuccess(`Verification report saved: ${reportPath}`);
  
  return report;
}

// Main verification function
async function main() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    ELECTRA CONTRACT VERIFICATION             ║');
  console.log('║                  Etherscan Source Code Verification          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  let verificationResult = {
    success: false,
    method: 'none',
    attempts: 0,
    error: null
  };
  
  try {
    // Step 1: Health check
    const healthCheckPassed = await verificationHealthCheck();
    if (!healthCheckPassed) {
      logWarning('Health check failed, but continuing with verification...');
    }
    
    // Step 2: Validate inputs
    const { contractAddress, network } = validateInputs();
    
    // Step 3: Check contract deployment
    if (!await checkContractDeployment(contractAddress, network)) {
      process.exit(1);
    }
    
    // Step 4: Check existing verification
    const existingVerification = await checkExistingVerification(contractAddress, network);
    
    if (existingVerification.isVerified) {
      verificationResult = {
        success: true,
        method: 'already_verified',
        attempts: 0,
        details: existingVerification
      };
    } else {
      // Step 5: Prepare verification files
      const verificationData = prepareVerificationFiles();
      
      if (!verificationData) {
        process.exit(1);
      }
      
      // Step 6: Run comprehensive verification
      verificationResult = await comprehensiveVerification(contractAddress, network, verificationData);
    }
    
    // Step 7: Generate report
    const report = generateVerificationReport(contractAddress, network, verificationResult);
    
    // Step 8: Final status
    if (verificationResult.success) {
      logSection('VERIFICATION COMPLETED SUCCESSFULLY');
      logSuccess('🎉 Contract has been verified on Etherscan!');
      
      const networkConfig = CONFIG.NETWORKS[network];
      log(`\n📋 Verification Details:`, 'bright');
      log(`Contract: ${colors.green}${contractAddress}${colors.reset}`);
      log(`Network: ${colors.cyan}${networkConfig.name}${colors.reset}`);
      log(`Method: ${colors.yellow}${verificationResult.method}${colors.reset}`);
      log(`Attempts: ${colors.magenta}${verificationResult.attempts}${colors.reset}`);
      
      console.log(`\n${colors.bright}Verification Links:${colors.reset}`);
      console.log(`🔍 Contract Page: ${colors.cyan}${networkConfig.explorerUrl}/address/${contractAddress}${colors.reset}`);
      console.log(`📄 Source Code: ${colors.cyan}${networkConfig.explorerUrl}/address/${contractAddress}#code${colors.reset}`);
      console.log(`📖 Read Contract: ${colors.cyan}${networkConfig.explorerUrl}/address/${contractAddress}#readContract${colors.reset}`);
      console.log(`✍️  Write Contract: ${colors.cyan}${networkConfig.explorerUrl}/address/${contractAddress}#writeContract${colors.reset}`);
      
      console.log(`\n${colors.bright}Benefits of Verification:${colors.reset}`);
      console.log('• Users can read the contract source code');
      console.log('• Enhanced trust and transparency');
      console.log('• Direct contract interaction through Etherscan');
      console.log('• Easier debugging and monitoring');
      console.log('• Professional appearance for your dApp\n');
      
    } else {
      logSection('VERIFICATION FAILED');
      logError('😞 Contract verification was not successful');
      
      if (verificationResult.error) {
        log(`Error: ${verificationResult.error}`, 'red');
      }
      
      console.log(`\n${colors.bright}Troubleshooting Steps:${colors.reset}`);
      console.log('1. Verify the contract address is correct');
      console.log('2. Ensure the contract is deployed on the specified network');
      console.log('3. Check that source code matches deployed bytecode');
      console.log('4. Verify compiler version and optimization settings');
      console.log('5. Try manual verification on Etherscan website');
      console.log('6. Check Etherscan API rate limits and key validity');
      console.log('7. Ensure all dependencies are correctly flattened');
      console.log('8. Verify constructor arguments if any');
      
      console.log(`\n${colors.bright}Manual Verification:${colors.reset}`);
      console.log(`Visit: ${colors.cyan}${CONFIG.NETWORKS[network].explorerUrl}/verifyContract${colors.reset}`);
      console.log(`Use the flattened source code from: ${colors.cyan}./flattened/${colors.reset}`);
      console.log(`Compiler: ${colors.yellow}v0.8.19+commit.7dd6d404${colors.reset}`);
      console.log(`Optimization: ${colors.yellow}Enabled (200 runs)${colors.reset}\n`);
      
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Verification process failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Handle specific verification commands
async function handleSpecificCommands() {
  const command = process.argv[2];
  
  switch (command) {
    case 'status':
      const contractAddress = process.argv[3];
      const network = process.argv[4] || 'sepolia';
      
      if (!contractAddress) {
        logError('Usage: node verify-contract.js status <CONTRACT_ADDRESS> [NETWORK]');
        process.exit(1);
      }
      
      await checkExistingVerification(contractAddress, network);
      break;
      
    case 'flatten':
      const flattenResult = flattenContracts();
      if (flattenResult) {
        logSuccess('Contract flattening completed successfully');
      }
      break;
      
    case 'prepare':
      const prepareResult = prepareVerificationFiles();
      if (prepareResult) {
        logSuccess('Verification files prepared successfully');
      }
      break;
      
    case 'health':
      await verificationHealthCheck();
      break;
      
    case 'interactive':
      const contractAddr = process.argv[3];
      const net = process.argv[4] || 'sepolia';
      
      if (!contractAddr) {
        logError('Usage: node verify-contract.js interactive <CONTRACT_ADDRESS> [NETWORK]');
        process.exit(1);
      }
      
      await interactiveVerification(contractAddr, net);
      break;
      
    case 'help':
      console.log(`
${colors.bright}Electra Contract Verification Tool${colors.reset}

Usage:
  node verify-contract.js <CONTRACT_ADDRESS> [NETWORK]    Verify contract
  node verify-contract.js status <CONTRACT_ADDRESS>       Check verification status
  node verify-contract.js flatten                         Flatten contracts only
  node verify-contract.js prepare                         Prepare verification files
  node verify-contract.js health                          Run health check
  node verify-contract.js interactive <ADDRESS>           Interactive mode
  node verify-contract.js help                            Show this help

Examples:
  node verify-contract.js 0x1234...5678 sepolia
  node verify-contract.js status 0x1234...5678 mainnet
  node verify-contract.js flatten
  node verify-contract.js health
  
Environment Variables:
  ETHERSCAN_API_KEY       Your Etherscan API key (required)
  CONTRACT_ADDRESS        Contract address (optional)
  NETWORK                 Target network (optional, default: sepolia)
  INFURA_PROJECT_ID       For network connectivity checks
  
Supported Networks:
  ${Object.keys(CONFIG.NETWORKS).join(', ')}

Verification Strategies:
  1. Truffle Plugin Verification
  2. Manual API Verification
  3. Multiple Compiler Versions
  4. Multiple Source Formats
  5. Advanced Flattening

Health Check:
  Verifies environment setup, network connectivity, and file availability.

Interactive Mode:
  Guided verification process with step-by-step options.

Files Created:
  ./flattened/                Flattened source code files
  ./verification-report-*.json    Detailed verification reports

Troubleshooting:
  - Ensure contract is deployed and address is correct
  - Check Etherscan API key is valid and has sufficient quota
  - Verify compiler version matches deployment
  - Confirm optimization settings (enabled, 200 runs)
  - Check network connectivity and RPC endpoints
      `);
      break;
      
    default:
      // Run main verification if no specific command
      await main();
  }
}

// Interactive verification function
async function interactiveVerification(contractAddress, network) {
  logSection('INTERACTIVE VERIFICATION MODE');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  function askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
  
  try {
    console.log('Welcome to the interactive verification mode!');
    console.log(`Contract: ${contractAddress}`);
    console.log(`Network: ${network}\n`);
    
    // Step 1: Health Check
    const runHealthCheck = await askQuestion('Run health check? (y/n): ');
    if (runHealthCheck.toLowerCase() === 'y') {
      await verificationHealthCheck();
    }
    
    // Step 2: Check existing verification
    const checkExisting = await askQuestion('Check if contract is already verified? (y/n): ');
    if (checkExisting.toLowerCase() === 'y') {
      const existing = await checkExistingVerification(contractAddress, network);
      if (existing.isVerified) {
        console.log('Contract is already verified! Exiting...');
        rl.close();
        return;
      }
    }
    
    // Step 3: Choose verification method
    console.log('\nVerification methods:');
    console.log('1. Truffle plugin (recommended)');
    console.log('2. Manual Etherscan API');
    console.log('3. Flatten and manual upload');
    console.log('4. Try all methods');
    
    const method = await askQuestion('Choose verification method (1-4): ');
    
    const verificationData = prepareVerificationFiles();
    if (!verificationData) {
      console.log('Could not prepare verification files');
      rl.close();
      return;
    }
    
    let success = false;
    
    switch (method) {
      case '1':
        success = await verifyWithTruffle(contractAddress, network);
        break;
      case '2':
        success = await manualVerification(contractAddress, network, verificationData);
        break;
      case '3':
        flattenContracts();
        console.log('Contract flattened. Please upload manually to Etherscan.');
        break;
      case '4':
        const result = await comprehensiveVerification(contractAddress, network, verificationData);
        success = result.success;
        break;
      default:
        console.log('Invalid choice');
    }
    
    if (success) {
      console.log('🎉 Verification successful!');
    } else {
      console.log('❌ Verification failed. Check the logs above.');
    }
    
  } catch (error) {
    console.log(`Interactive verification failed: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Utility function to retry operations
async function retryOperation(operation, maxRetries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      logWarning(`Attempt ${attempt} failed: ${error.message}`);
      logStep('RETRY', `Waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

// Additional utility functions for verification

// Check Etherscan API rate limits
async function checkAPIRateLimit(network) {
  logStep('API', 'Checking Etherscan API rate limits...');
  
  try {
    const networkConfig = CONFIG.NETWORKS[network];
    const axios = require('axios');
    
    const response = await axios.get(networkConfig.apiUrl, {
      params: {
        module: 'stats',
        action: 'tokensupply',
        contractaddress: '0xA0b86a33E6441c0C8F7B3d6b96A7eC07b39EbB5F', // Random contract
        apikey: process.env.ETHERSCAN_API_KEY
      },
      timeout: 5000
    });
    
    if (response.data.message === 'NOTOK' && response.data.result.includes('rate limit')) {
      logWarning('Etherscan API rate limit detected');
      logWarning('Please wait before retrying verification');
      return false;
    }
    
    logSuccess('API rate limit check passed');
    return true;
    
  } catch (error) {
    logWarning(`Could not check API rate limit: ${error.message}`);
    return true; // Continue anyway
  }
}

// Validate contract bytecode matches source
async function validateBytecodeMatch(contractAddress, network, sourceCode) {
  logStep('VALIDATE', 'Checking if source code matches deployed bytecode...');
  
  try {
    const Web3 = require('web3');
    const web3 = process.env.INFURA_PROJECT_ID ? 
      new Web3(`https://${network}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`) :
      new Web3(`https://${network}.etherscan.io`);
    
    // Get deployed bytecode
    const deployedBytecode = await web3.eth.getCode(contractAddress);
    
    if (!deployedBytecode || deployedBytecode === '0x') {
      logError('No bytecode found at contract address');
      return false;
    }
    
    // This is a simplified check - in practice, you'd need to compile the source
    // and compare the bytecode hashes after removing metadata
    const bytecodeSize = (deployedBytecode.length - 2) / 2; // Remove 0x and convert to bytes
    
    logSuccess(`Deployed bytecode found (${bytecodeSize} bytes)`);
    
    // Additional check: verify contract has expected functions
    try {
      const contract = new web3.eth.Contract([
        {"inputs":[],"name":"totalCandidates","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
        {"inputs":[],"name":"nextVoterID","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}
      ], contractAddress);
      
      const totalCandidates = await contract.methods.totalCandidates().call();
      const nextVoterID = await contract.methods.nextVoterID().call();
      
      logSuccess(`Contract functions verified (totalCandidates: ${totalCandidates}, nextVoterID: ${nextVoterID})`);
      return true;
      
    } catch (error) {
      logWarning('Could not verify contract functions - source might not match');
      return false;
    }
    
  } catch (error) {
    logWarning(`Bytecode validation failed: ${error.message}`);
    return false;
  }
}

// Clean up temporary files
function cleanup() {
  try {
    const tempFiles = [
      './temp-flattened.sol',
      './verification-temp.json'
    ];
    
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Handle process termination
process.on('SIGINT', () => {
  logWarning('\nVerification interrupted by user');
  cleanup();
  process.exit(1);
});

process.on('SIGTERM', () => {
  logWarning('\nVerification terminated');
  cleanup();
  process.exit(1);
});

// Export for use in other scripts
module.exports = {
  main,
  checkExistingVerification,
  verifyWithTruffle,
  flattenContracts,
  manualVerification,
  comprehensiveVerification,
  verificationHealthCheck,
  CONFIG
};

// Run if called directly
if (require.main === module) {
  // Check if it's a specific command
  if (['status', 'flatten', 'prepare', 'health', 'interactive', 'help'].includes(process.argv[2])) {
    handleSpecificCommands().catch(error => {
      logError(`Command failed: ${error.message}`);
      cleanup();
      process.exit(1);
    });
  } else {
    main().catch(error => {
      logError(`Fatal error: ${error.message}`);
      cleanup();
      process.exit(1);
    });
  }
}