/**
 * Setup Demo Script
 * Creates comprehensive demo data for testing the Electra voting system
 * @author God's Favour Chukwudi
 */

const Web3 = require('web3');
require('dotenv').config();

// Demo configuration
const DEMO_CONFIG = {
  election: {
    title: "Nigeria 2027 Presidential Election - Demo",
    description: "Comprehensive demonstration of Electra blockchain voting system featuring realistic Nigerian political scenario",
    registrationDuration: 7 * 24 * 60 * 60, // 7 days
    votingDuration: 3 * 24 * 60 * 60, // 3 days
    preparationTime: 2 * 60 * 60 // 2 hours between registration and voting
  },
  candidates: [
    {
      name: "Dr. Amina Hassan",
      party: "Progressive Democratic Party (PDP)",
      manifesto: "Unity Through Technology: Championing digital transformation, inclusive governance, and sustainable development. Committed to bridging the digital divide and creating opportunities for all Nigerians through innovation and progressive policies."
    },
    {
      name: "Engr. Chike Okafor",
      party: "People's Liberation Movement (PLM)",
      manifesto: "Economic Empowerment for All: Focusing on industrialization, job creation, and social justice. Building a Nigeria where every citizen has access to quality education, healthcare, and economic opportunities through grassroots development."
    },
    {
      name: "Prof. Fatima Abdullahi",
      party: "National Renewal Alliance (NRA)",
      manifesto: "Security and Educational Excellence: Prioritizing national security, infrastructure development, and world-class education. Creating a safe, educated, and prosperous Nigeria through strategic investments and institutional reforms."
    },
    {
      name: "Barr. Emeka Nwosu",
      party: "Youth Progressive Congress (YPC)",
      manifesto: "New Generation Leadership: Representing the voice of young Nigerians with focus on technology, entrepreneurship, and good governance. Breaking traditional barriers and building a modern, corruption-free Nigeria."
    },
    {
      name: "Dr. Aisha Bello",
      party: "United Nigeria Party (UNP)",
      manifesto: "National Unity and Development: Fostering unity across all regions, religions, and ethnicities. Promoting sustainable development, environmental protection, and equitable resource distribution for a prosperous Nigeria."
    }
  ],
  sampleVoters: [
    { name: "Lagos Voter 1", description: "Urban professional from Lagos" },
    { name: "Kano Voter 1", description: "Business owner from Kano" },
    { name: "Abuja Voter 1", description: "Civil servant from Abuja" },
    { name: "Port Harcourt Voter 1", description: "Engineer from Port Harcourt" },
    { name: "Ibadan Voter 1", description: "Academic from Ibadan" },
    { name: "Kaduna Voter 1", description: "Farmer from Kaduna" },
    { name: "Enugu Voter 1", description: "Entrepreneur from Enugu" },
    { name: "Calabar Voter 1", description: "Healthcare worker from Calabar" }
  ]
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

// Initialize Web3 and contract
async function initializeWeb3() {
  try {
    const web3 = new Web3(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
    const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    
    const contractAddress = process.env.CONTRACT_ADDRESS || 
                           process.argv[2] || 
                           require('./deployment-latest.json').contractAddress;
    
    if (!contractAddress) {
      throw new Error('Contract address not provided. Use: node setup-demo.js <CONTRACT_ADDRESS>');
    }
    
    const Electra = require('../build/contracts/Electra.json');
    const contract = new web3.eth.Contract(Electra.abi, contractAddress);
    
    // Verify contract is deployed
    const code = await web3.eth.getCode(contractAddress);
    if (code === '0x') {
      throw new Error('No contract deployed at the specified address');
    }
    
    logSuccess(`Connected to Sepolia testnet`);
    logSuccess(`Using account: ${account.address}`);
    logSuccess(`Contract address: ${contractAddress}`);
    
    return { web3, contract, account };
    
  } catch (error) {
    logError(`Web3 initialization failed: ${error.message}`);
    throw error;
  }
}

// Check if election already exists
async function checkExistingElection(contract) {
  try {
    const electionInfo = await contract.methods.getElectionInfo().call();
    
    if (electionInfo.title && electionInfo.title.length > 0) {
      logWarning('An election already exists on this contract:');
      log(`Title: ${electionInfo.title}`, 'yellow');
      log(`Is Active: ${electionInfo.isActive}`, 'yellow');
      log(`Is Finalized: ${electionInfo.isFinalized}`, 'yellow');
      
      console.log('\nOptions:');
      console.log('1. Continue setup (may fail if election is active)');
      console.log('2. Add demo voters to existing election');
      console.log('3. Exit and deploy a new contract');
      
      return electionInfo;
    }
    
    return null;
  } catch (error) {
    // Election probably doesn't exist, which is fine
    return null;
  }
}

// Create demo election
async function createDemoElection(contract, account) {
  logSection('CREATING DEMO ELECTION');
  
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const registrationDeadline = currentTime + DEMO_CONFIG.election.registrationDuration;
    const startTime = registrationDeadline + DEMO_CONFIG.election.preparationTime;
    const endTime = startTime + DEMO_CONFIG.election.votingDuration;
    
    logStep('1', 'Creating election with Nigerian political scenario...');
    
    const createTx = await contract.methods.createElection(
      DEMO_CONFIG.election.title,
      DEMO_CONFIG.election.description,
      registrationDeadline,
      startTime,
      endTime
    ).send({
      from: account.address,
      gas: 500000,
      gasPrice: await contract._provider.eth.getGasPrice()
    });
    
    logSuccess(`Election created! Transaction: ${createTx.transactionHash}`);
    log(`Registration Deadline: ${new Date(registrationDeadline * 1000).toLocaleString()}`, 'cyan');
    log(`Voting Start: ${new Date(startTime * 1000).toLocaleString()}`, 'cyan');
    log(`Voting End: ${new Date(endTime * 1000).toLocaleString()}`, 'cyan');
    
    return {
      registrationDeadline,
      startTime,
      endTime,
      transactionHash: createTx.transactionHash
    };
    
  } catch (error) {
    logError(`Failed to create election: ${error.message}`);
    throw error;
  }
}

// Add demo candidates
async function addDemoCandidates(contract, account) {
  logSection('ADDING DEMO CANDIDATES');
  
  const results = [];
  
  try {
    for (let i = 0; i < DEMO_CONFIG.candidates.length; i++) {
      const candidate = DEMO_CONFIG.candidates[i];
      
      logStep(i + 1, `Adding candidate: ${candidate.name} (${candidate.party})`);
      
      const addTx = await contract.methods.addCandidate(
        candidate.name,
        candidate.party,
        candidate.manifesto
      ).send({
        from: account.address,
        gas: 400000,
        gasPrice: await contract._provider.eth.getGasPrice()
      });
      
      results.push({
        id: i + 1,
        name: candidate.name,
        party: candidate.party,
        transactionHash: addTx.transactionHash
      });
      
      logSuccess(`Added: ${candidate.name}`);
      
      // Small delay to avoid nonce issues
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    logSuccess(`Successfully added ${results.length} candidates`);
    return results;
    
  } catch (error) {
    logError(`Failed to add candidates: ${error.message}`);
    throw error;
  }
}

// Generate demo voter accounts
function generateDemoVoters() {
  logSection('GENERATING DEMO VOTER ACCOUNTS');
  
  const voters = [];
  
  try {
    for (let i = 0; i < DEMO_CONFIG.sampleVoters.length; i++) {
      const web3 = new Web3();
      const voterAccount = web3.eth.accounts.create();
      
      voters.push({
        address: voterAccount.address,
        privateKey: voterAccount.privateKey,
        name: DEMO_CONFIG.sampleVoters[i].name,
        description: DEMO_CONFIG.sampleVoters[i].description
      });
      
      logStep(i + 1, `Generated voter: ${DEMO_CONFIG.sampleVoters[i].name} - ${voterAccount.address}`);
    }
    
    logSuccess(`Generated ${voters.length} demo voter accounts`);
    return voters;
    
  } catch (error) {
    logError(`Failed to generate voters: ${error.message}`);
    throw error;
  }
}

// Register demo voters
async function registerDemoVoters(contract, account, voters) {
  logSection('REGISTERING DEMO VOTERS');
  
  const results = [];
  
  try {
    for (let i = 0; i < voters.length; i++) {
      const voter = voters[i];
      
      logStep(i + 1, `Registering: ${voter.name} (${voter.address})`);
      
      const registerTx = await contract.methods.registerVoter(voter.address).send({
        from: account.address,
        gas: 200000,
        gasPrice: await contract._provider.eth.getGasPrice()
      });
      
      results.push({
        ...voter,
        voterID: i + 1,
        transactionHash: registerTx.transactionHash
      });
      
      logSuccess(`Registered: ${voter.name}`);
      
      // Small delay to avoid nonce issues
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    logSuccess(`Successfully registered ${results.length} voters`);
    return results;
    
  } catch (error) {
    logError(`Failed to register voters: ${error.message}`);
    throw error;
  }
}

// Cast demo votes (optional)
async function castDemoVotes(web3, contract, voters, candidates) {
  logSection('CASTING DEMO VOTES (OPTIONAL)');
  
  logWarning('This will cast random votes for demo purposes');
  logWarning('Only use this if voting period is active and you want sample data');
  
  // Check if voting is active
  try {
    const electionInfo = await contract.methods.getElectionInfo().call();
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime < electionInfo.startTime) {
      logWarning('Voting period has not started yet');
      logWarning(`Voting starts: ${new Date(electionInfo.startTime * 1000).toLocaleString()}`);
      return [];
    }
    
    if (currentTime > electionInfo.endTime) {
      logWarning('Voting period has ended');
      return [];
    }
    
    if (!electionInfo.isActive) {
      logWarning('Election is not active');
      return [];
    }
    
    logStep('INFO', 'Voting is active, proceeding with demo votes...');
    
  } catch (error) {
    logWarning('Could not check election status, skipping demo votes');
    return [];
  }
  
  const voteResults = [];
  
  try {
    // Cast votes for first 5 voters (leave some unvoted for demo)
    const votersToVote = voters.slice(0, Math.min(5, voters.length));
    
    for (let i = 0; i < votersToVote.length; i++) {
      const voter = votersToVote[i];
      
      // Create voter account with their private key
      const voterAccount = web3.eth.accounts.privateKeyToAccount(voter.privateKey);
      web3.eth.accounts.wallet.add(voterAccount);
      
      // Random candidate selection (weighted towards first few candidates)
      const candidateWeights = [3, 2, 2, 1, 1]; // Favor early candidates
      const randomWeight = Math.random() * candidateWeights.reduce((a, b) => a + b, 0);
      let selectedCandidate = 1;
      let weightSum = 0;
      
      for (let j = 0; j < candidateWeights.length && j < candidates.length; j++) {
        weightSum += candidateWeights[j];
        if (randomWeight <= weightSum) {
          selectedCandidate = j + 1;
          break;
        }
      }
      
      logStep(i + 1, `${voter.name} voting for candidate #${selectedCandidate}`);
      
      try {
        const voteTx = await contract.methods.vote(selectedCandidate).send({
          from: voterAccount.address,
          gas: 200000,
          gasPrice: await web3.eth.getGasPrice()
        });
        
        voteResults.push({
          voter: voter.name,
          voterAddress: voter.address,
          candidateId: selectedCandidate,
          candidateName: candidates[selectedCandidate - 1]?.name || 'Unknown',
          transactionHash: voteTx.transactionHash
        });
        
        logSuccess(`Vote cast successfully`);
        
      } catch (voteError) {
        logWarning(`Failed to cast vote for ${voter.name}: ${voteError.message}`);
      }
      
      // Remove from wallet to avoid conflicts
      web3.eth.accounts.wallet.remove(voterAccount.address);
      
      // Delay between votes
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    logSuccess(`Cast ${voteResults.length} demo votes`);
    return voteResults;
    
  } catch (error) {
    logError(`Failed to cast demo votes: ${error.message}`);
    return voteResults;
  }
}

// Generate comprehensive demo report
function generateDemoReport(electionData, candidates, voters, votes, contractAddress) {
  logSection('GENERATING DEMO REPORT');
  
  const report = {
    timestamp: new Date().toISOString(),
    contract: {
      address: contractAddress,
      network: 'Sepolia Testnet',
      explorer: `https://sepolia.etherscan.io/address/${contractAddress}`
    },
    election: {
      title: DEMO_CONFIG.election.title,
      description: DEMO_CONFIG.election.description,
      schedule: {
        registrationDeadline: new Date(electionData.registrationDeadline * 1000).toISOString(),
        votingStart: new Date(electionData.startTime * 1000).toISOString(),
        votingEnd: new Date(electionData.endTime * 1000).toISOString()
      },
      transactionHash: electionData.transactionHash
    },
    candidates: candidates.map(candidate => ({
      id: candidate.id,
      name: candidate.name,
      party: candidate.party,
      transactionHash: candidate.transactionHash
    })),
    voters: voters.map(voter => ({
      name: voter.name,
      address: voter.address,
      description: voter.description,
      voterID: voter.voterID,
      transactionHash: voter.transactionHash
    })),
    votes: votes,
    statistics: {
      totalCandidates: candidates.length,
      totalVoters: voters.length,
      votesCase: votes.length,
      turnoutRate: voters.length > 0 ? ((votes.length / voters.length) * 100).toFixed(1) + '%' : '0%'
    },
    frontendSetup: {
      contractAddress: contractAddress,
      networkId: 11155111,
      networkName: 'Sepolia Testnet',
      explorerUrl: 'https://sepolia.etherscan.io'
    },
    testAccounts: {
      note: "Private keys for demo voter accounts (TESTNET ONLY - DO NOT USE IN PRODUCTION)",
      voters: voters.map(voter => ({
        name: voter.name,
        address: voter.address,
        privateKey: voter.privateKey
      }))
    },
    instructions: {
      frontend: [
        "Update your .env file with the contract address",
        "Start your React application",
        "Use MetaMask to connect with the demo voter accounts",
        "Test voter registration and voting functionality"
      ],
      testing: [
        "Import demo voter private keys into MetaMask (testnet only)",
        "Test self-registration with voter accounts",
        "Test voting process during voting period",
        "Verify results and statistics",
        "Test admin functions with deployer account"
      ]
    }
  };
  
  // Save report to file
  const fs = require('fs');
  const reportPath = `./demo-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logSuccess(`Demo report saved to: ${reportPath}`);
  
  // Display summary
  console.log('\n' + colors.bright + colors.blue + '📋 DEMO SETUP SUMMARY' + colors.reset);
  console.log(`Contract: ${colors.green}${contractAddress}${colors.reset}`);
  console.log(`Election: ${colors.cyan}${DEMO_CONFIG.election.title}${colors.reset}`);
  console.log(`Candidates: ${colors.yellow}${candidates.length}${colors.reset}`);
  console.log(`Voters: ${colors.magenta}${voters.length}${colors.reset}`);
  console.log(`Demo Votes: ${colors.green}${votes.length}${colors.reset}`);
  console.log(`Report: ${colors.cyan}${reportPath}${colors.reset}`);
  
  return report;
}

// Display demo voter credentials
function displayVoterCredentials(voters) {
  logSection('DEMO VOTER CREDENTIALS');
  
  logWarning('These are test accounts for Sepolia testnet only!');
  logWarning('NEVER use these private keys on mainnet or with real funds!');
  
  console.log('\nDemo Voter Accounts:');
  console.log('='.repeat(100));
  
  voters.forEach((voter, index) => {
    console.log(`\n${colors.yellow}${index + 1}. ${voter.name}${colors.reset}`);
    console.log(`   Address: ${colors.cyan}${voter.address}${colors.reset}`);
    console.log(`   Private Key: ${colors.red}${voter.privateKey}${colors.reset}`);
    console.log(`   Description: ${voter.description}`);
  });
  
  console.log('\n' + colors.bright + 'To test voting:' + colors.reset);
  console.log('1. Import any of these private keys into MetaMask');
  console.log('2. Switch to Sepolia testnet');
  console.log('3. Visit your Electra frontend application');
  console.log('4. Test voter registration and voting');
  
  console.log('\n' + colors.red + 'SECURITY WARNING:' + colors.reset);
  console.log('These private keys are for testing only.');
  console.log('Never use them with real funds or on mainnet!');
}

// Interactive setup mode
async function interactiveSetup(contract, account, voters) {
  logSection('INTERACTIVE SETUP OPTIONS');
  
  console.log('Choose setup options:');
  console.log('1. Full setup (election + candidates + voters)');
  console.log('2. Add voters only (election must exist)');
  console.log('3. Cast demo votes (voting must be active)');
  console.log('4. Check current status');
  
  // For automation, we'll do full setup
  // In a real interactive mode, you'd use readline for user input
  return 'full';
}

// Check contract permissions
async function checkPermissions(contract, account) {
  logSection('CHECKING PERMISSIONS');
  
  try {
    const owner = await contract.methods.systemOwner().call();
    const commissioner = await contract.methods.currentCommissioner().call();
    const userRole = await contract.methods.getUserInfo(account.address).call();
    
    log(`Contract Owner: ${owner}`, 'cyan');
    log(`Current Commissioner: ${commissioner}`, 'cyan');
    log(`Your Address: ${account.address}`, 'cyan');
    log(`Your Role: ${['NONE', 'VOTER', 'OBSERVER', 'ADMIN', 'COMMISSIONER'][userRole.role]}`, 'cyan');
    
    const isOwner = owner.toLowerCase() === account.address.toLowerCase();
    const isCommissioner = commissioner.toLowerCase() === account.address.toLowerCase();
    
    if (isOwner || isCommissioner) {
      logSuccess('You have admin permissions');
      return true;
    } else {
      logError('You do not have admin permissions');
      logError('Only the contract owner or commissioner can run this setup');
      return false;
    }
    
  } catch (error) {
    logError(`Failed to check permissions: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.blue}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      ELECTRA DEMO SETUP                      ║');
  console.log('║              Comprehensive Demo Data Generator               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  let web3, contract, account, electionData, candidates, voters, votes;
  
  try {
    // Initialize
    ({ web3, contract, account } = await initializeWeb3());
    
    // Check permissions
    if (!await checkPermissions(contract, account)) {
      process.exit(1);
    }
    
    // Check existing election
    const existingElection = await checkExistingElection(contract);
    
    if (existingElection && existingElection.isActive) {
      logWarning('Active election exists. This setup may modify existing election data.');
    }
    
    // Generate demo voters first
    voters = generateDemoVoters();
    
    // Create election if needed
    if (!existingElection || !existingElection.title) {
      electionData = await createDemoElection(contract, account);
    } else {
      logWarning('Using existing election');
      electionData = {
        registrationDeadline: existingElection.registrationDeadline,
        startTime: existingElection.startTime,
        endTime: existingElection.endTime,
        transactionHash: 'existing'
      };
    }
    
    // Add candidates if needed
    try {
      const currentCandidates = await contract.methods.getAllCandidates().call();
      if (currentCandidates.names.length === 0) {
        candidates = await addDemoCandidates(contract, account);
      } else {
        logWarning('Candidates already exist, skipping candidate setup');
        candidates = currentCandidates.names.map((name, index) => ({
          id: index + 1,
          name: name,
          party: currentCandidates.parties[index],
          transactionHash: 'existing'
        }));
      }
    } catch (error) {
      logWarning('Could not check existing candidates, adding new ones');
      candidates = await addDemoCandidates(contract, account);
    }
    
    // Register voters
    voters = await registerDemoVoters(contract, account, voters);
    
    // Cast demo votes (optional)
    votes = await castDemoVotes(web3, contract, voters, candidates);
    
    // Generate report
    const report = generateDemoReport(electionData, candidates, voters, votes, contract._address);
    
    // Display voter credentials
    displayVoterCredentials(voters);
    
    // Success message
    logSection('DEMO SETUP COMPLETED SUCCESSFULLY');
    logSuccess('🎉 Electra demo environment is ready!');
    
    console.log(`\n${colors.bright}Next Steps:${colors.reset}`);
    console.log(`1. Update your frontend .env with: ${colors.yellow}REACT_APP_CONTRACT_ADDRESS=${contract._address}${colors.reset}`);
    console.log(`2. Import demo voter private keys into MetaMask (testnet only)`);
    console.log(`3. Test the complete voting workflow`);
    console.log(`4. Monitor transactions on Etherscan`);
    console.log(`5. Share demo credentials with your team for testing\n`);
    
  } catch (error) {
    logError(`Demo setup failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Utility function to start voting (for testing)
async function startVotingIfReady(contract, account) {
  try {
    const electionInfo = await contract.methods.getElectionInfo().call();
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (currentTime >= electionInfo.registrationDeadline && 
        currentTime < electionInfo.startTime && 
        electionInfo.isActive) {
      
      logStep('AUTO', 'Registration deadline passed, starting voting period...');
      
      const startTx = await contract.methods.startVoting().send({
        from: account.address,
        gas: 200000
      });
      
      logSuccess(`Voting started! Transaction: ${startTx.transactionHash}`);
      return true;
    }
    
    return false;
  } catch (error) {
    logWarning(`Could not auto-start voting: ${error.message}`);
    return false;
  }
}

// Export for use in other scripts
module.exports = {
  main,
  generateDemoVoters,
  DEMO_CONFIG
};

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}