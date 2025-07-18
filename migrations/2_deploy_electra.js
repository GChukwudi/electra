const Electra = artifacts.require("Electra");

module.exports = async function (deployer, network, accounts) {
  console.log(`\n🚀 Deploying Electra to ${network} network...`);
  console.log(`📋 Deployer account: ${accounts[0]}`);
  
  // Election configuration
  const electionTitle = "Nigeria 2027 Presidential Election - Electra POC";
  const electionDescription = "Proof of concept blockchain-based voting system demonstrating transparent, secure, and tamper-proof elections for Nigeria.";
  const durationHours = 24; // 24 hours voting period for demo
  const maxVoters = 1000;   // Maximum voters for POC
  
  try {
    // Deploy the Electra contract
    console.log('\n📜 Deploying Electra smart contract...');
    await deployer.deploy(
      Electra,
      electionTitle,
      electionDescription,
      durationHours,
      maxVoters
    );
    
    const electraInstance = await Electra.deployed();
    console.log(`✅ Electra deployed at: ${electraInstance.address}`);
    
    // Display deployment information
    console.log('\n📊 Deployment Summary:');
    console.log('═'.repeat(50));
    console.log(`📍 Contract Address: ${electraInstance.address}`);
    console.log(`🏷️  Election Title: ${electionTitle}`);
    console.log(`📝 Description: ${electionDescription}`);
    console.log(`⏱️  Max Duration: ${durationHours} hours`);
    console.log(`👥 Max Voters: ${maxVoters}`);
    console.log(`🔐 Commissioner: ${accounts[0]}`);
    console.log(`🌐 Network: ${network}`);
    console.log('═'.repeat(50));
    
    // Add demo candidates if on development network
    if (network === 'development' || network === 'ganache') {
      console.log('\n🎭 Adding demo candidates...');
      
      const candidates = [
        {
          name: "Adebayo Johnson",
          party: "Progressive Alliance Party (PAP)",
          manifesto: "Economic transformation through technology and innovation. Focus on youth empowerment, job creation, and digital infrastructure development.",
          imageHash: "QmDemo1Hash"
        },
        {
          name: "Fatima Abdullahi",
          party: "National Unity Congress (NUC)",
          manifesto: "Unity in diversity. Education reform, healthcare improvement, and sustainable agriculture. Bringing Nigeria together for prosperity.",
          imageHash: "QmDemo2Hash"
        },
        {
          name: "Chinedu Okwu",
          party: "Democratic Reform Movement (DRM)",
          manifesto: "Good governance and transparency. Anti-corruption drive, judicial reform, and decentralization of power to states.",
          imageHash: "QmDemo3Hash"
        },
        {
          name: "Aisha Bello",
          party: "People's Democratic Alliance (PDA)",
          manifesto: "Social justice and equality. Women empowerment, poverty alleviation, and inclusive economic growth for all Nigerians.",
          imageHash: "QmDemo4Hash"
        }
      ];
      
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        await electraInstance.addCandidate(
          candidate.name,
          candidate.party,
          candidate.manifesto,
          candidate.imageHash,
          { from: accounts[0] }
        );
        console.log(`✅ Added: ${candidate.name} (${candidate.party})`);
      }
      
      console.log(`\n🎉 Successfully added ${candidates.length} demo candidates!`);
      
      // Add some demo admins
      console.log('\n👨‍💼 Adding demo administrators...');
      if (accounts.length > 1) {
        await electraInstance.addAdmin(accounts[1], { from: accounts[0] });
        console.log(`✅ Added admin: ${accounts[1]}`);
      }
      if (accounts.length > 2) {
        await electraInstance.addAdmin(accounts[2], { from: accounts[0] });
        console.log(`✅ Added admin: ${accounts[2]}`);
      }
      
      // Display contract state
      console.log('\n📈 Current Election State:');
      console.log('─'.repeat(30));
      const stats = await electraInstance.getElectionStats();
      console.log(`📊 Total Candidates: ${stats.totalCandidatesCount}`);
      console.log(`👥 Total Voters: ${stats.totalVotersCount}`);
      console.log(`🗳️  Total Votes: ${stats.totalVotesCount}`);
      console.log(`📝 Registration: ${stats.registrationActive ? '✅ Open' : '❌ Closed'}`);
      console.log(`🗳️  Voting: ${stats.votingActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`🏁 Finalized: ${stats.finalized ? '✅ Yes' : '❌ No'}`);
      console.log('─'.repeat(30));
    }
    
    // Save deployment info for frontend
    const deploymentInfo = {
      contractAddress: electraInstance.address,
      network: network,
      deployer: accounts[0],
      electionTitle: electionTitle,
      electionDescription: electionDescription,
      maxVoters: maxVoters,
      deploymentTime: new Date().toISOString(),
      transactionHash: electraInstance.transactionHash,
      blockNumber: electraInstance.receipt ? electraInstance.receipt.blockNumber : 'N/A'
    };
    
    // Write deployment info to file
    const fs = require('fs');
    const path = require('path');
    
    // Ensure client/src directory exists
    const clientSrcDir = path.join(__dirname, '..', 'client', 'src');
    if (!fs.existsSync(clientSrcDir)) {
      fs.mkdirSync(clientSrcDir, { recursive: true });
    }
    
    const deploymentPath = path.join(clientSrcDir, 'deployment.json');
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n💾 Deployment info saved to: ${deploymentPath}`);
    
    // Display next steps
    console.log('\n🎯 Next Steps:');
    console.log('═'.repeat(40));
    console.log('1. 📱 Start the frontend: npm run dev');
    console.log('2. 🔗 Connect MetaMask to the deployed contract');
    console.log('3. 👥 Register voters for testing');
    console.log('4. 🚀 Start voting period when ready');
    console.log('5. 🗳️  Cast test votes');
    console.log('6. 📊 View real-time results');
    console.log('═'.repeat(40));
    
    console.log('\n✨ Electra deployment completed successfully! ✨\n');
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    throw error;
  }
};
