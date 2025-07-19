const Electra = artifacts.require("Electra");

module.exports = async function (deployer, network, accounts) {
  console.log("Deploying Electra to network:", network);
  console.log("Deployer account:", accounts[0]);
  
  try {
    // Deploy the Electra contract
    await deployer.deploy(Electra);
    const electraInstance = await Electra.deployed();
    
    console.log("✅ Electra deployed successfully!");
    console.log("📍 Contract address:", electraInstance.address);
    console.log("👤 Election Commissioner:", accounts[0]);
    
    // Initial setup for development/testing networks
    if (network === "development" || network === "test") {
      console.log("\n🔧 Setting up development environment...");
      
      // Create a sample election
      const currentTime = Math.floor(Date.now() / 1000);
      const registrationDeadline = currentTime + (24 * 60 * 60); // 24 hours
      const startTime = registrationDeadline + (1 * 60 * 60); // 1 hour after registration
      const endTime = startTime + (48 * 60 * 60); // 48 hours voting period
      
      await electraInstance.createElection(
        "Nigeria 2027 Presidential Election - Electra POC",
        "Proof of concept election demonstrating blockchain voting capabilities",
        registrationDeadline,
        startTime,
        endTime
      );
      
      console.log("🗳️  Sample election created:");
      console.log("   Title: Nigeria 2027 Presidential Election - Electra POC");
      console.log("   Registration deadline:", new Date(registrationDeadline * 1000).toLocaleString());
      console.log("   Voting starts:", new Date(startTime * 1000).toLocaleString());
      console.log("   Voting ends:", new Date(endTime * 1000).toLocaleString());
      
      // Add sample candidates
      await electraInstance.addCandidate(
        "Amina Hassan",
        "Progressive Democratic Party",
        "Unity, progress, and digital transformation for Nigeria's future."
      );
      
      await electraInstance.addCandidate(
        "Chike Okafor",
        "People's Liberation Movement",
        "Economic empowerment and social justice for all Nigerians."
      );
      
      await electraInstance.addCandidate(
        "Fatima Abdullahi",
        "National Renewal Alliance",
        "Security, infrastructure, and educational excellence."
      );
      
      console.log("👥 Sample candidates added:");
      console.log("   1. Amina Hassan (Progressive Democratic Party)");
      console.log("   2. Chike Okafor (People's Liberation Movement)");
      console.log("   3. Fatima Abdullahi (National Renewal Alliance)");
      
      // Register some sample voters (using available accounts)
      const votersToRegister = Math.min(5, accounts.length - 1);
      for (let i = 1; i <= votersToRegister; i++) {
        await electraInstance.registerVoter(accounts[i]);
      }
      
      console.log(`👤 ${votersToRegister} sample voters registered`);
      console.log("✅ Development setup complete!");
    }
    
    // Display deployment summary
    console.log("\n📋 Deployment Summary:");
    console.log("======================");
    console.log("Contract: Electra");
    console.log("Address:", electraInstance.address);
    console.log("Network:", network);
    console.log("Gas used: ~", web3.utils.fromWei(await web3.eth.getGasPrice(), 'gwei'), "Gwei");
    console.log("Deployer:", accounts[0]);
    
    if (network === "sepolia" || network === "goerli") {
      console.log("\n🔍 Verify contract on Etherscan:");
      console.log(`https://${network}.etherscan.io/address/${electraInstance.address}`);
      console.log("\nTo verify the contract source code, run:");
      console.log("truffle run verify Electra --network", network);
    }
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
};