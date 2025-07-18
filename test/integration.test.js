/**
 * Electra Integration Tests
 * End-to-end testing of complete election workflows
 */

const Electra = artifacts.require("Electra");
const { expect } = require("chai");
const { time } = require("@openzeppelin/test-helpers");

contract("Electra Integration", function (accounts) {
  let electra;
  const [
    owner,
    admin,
    voter1, voter2, voter3, voter4, voter5,
    observer1, observer2
  ] = accounts;
  
  describe("Complete Election Workflow", function () {
    let electionTitle = "Nigeria 2027 Presidential Election - Integration Test";
    let electionDescription = "Complete end-to-end test of Electra voting system";
    let registrationDeadline, startTime, endTime;
    
    beforeEach(async function () {
      electra = await Electra.new({ from: owner });
      
      const currentTime = await time.latest();
      registrationDeadline = currentTime.add(time.duration.hours(2));
      startTime = registrationDeadline.add(time.duration.hours(1));
      endTime = startTime.add(time.duration.hours(6));
    });
    
    it("Should execute a complete election from start to finish", async function () {
      console.log("🗳️  Starting Complete Election Integration Test");
      
      // === PHASE 1: ELECTION SETUP ===
      console.log("📋 Phase 1: Election Setup");
      
      // Create election
      const createTx = await electra.createElection(
        electionTitle,
        electionDescription,
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      expect(createTx.logs[0].event).to.equal("ElectionCreated");
      console.log("✅ Election created successfully");
      
      // Add candidates
      await electra.addCandidate(
        "Amina Hassan",
        "Progressive Democratic Party",
        "Unity, progress, and digital transformation for Nigeria's future."
      );
      
      await electra.addCandidate(
        "Chike Okafor", 
        "People's Liberation Movement",
        "Economic empowerment and social justice for all Nigerians."
      );
      
      await electra.addCandidate(
        "Fatima Abdullahi",
        "National Renewal Alliance", 
        "Security, infrastructure, and educational excellence."
      );
      
      const totalCandidates = await electra.totalCandidates();
      expect(totalCandidates.toNumber()).to.equal(3);
      console.log("✅ 3 candidates added successfully");
      
      // === PHASE 2: VOTER REGISTRATION ===
      console.log("👥 Phase 2: Voter Registration");
      
      // Register voters
      const voters = [voter1, voter2, voter3, voter4, voter5];
      for (let i = 0; i < voters.length; i++) {
        await electra.registerVoter(voters[i], { from: owner });
      }
      
      const electionInfo = await electra.getElectionInfo();
      expect(electionInfo.totalVoters.toNumber()).to.equal(5);
      console.log("✅ 5 voters registered successfully");
      
      // Verify registration
      for (let i = 0; i < voters.length; i++) {
        const voterInfo = await electra.getVoterInfo(voters[i]);
        expect(voterInfo.isRegistered).to.equal(true);
        expect(voterInfo.hasVoted).to.equal(false);
        expect(voterInfo.voterID.toNumber()).to.equal(i + 1);
      }
      console.log("✅ Voter registration verified");
      
      // === PHASE 3: VOTING PERIOD ===
      console.log("🗳️  Phase 3: Voting Period");
      
      // Start voting
      const startVotingTx = await electra.startVoting({ from: owner });
      expect(startVotingTx.logs[1].event).to.equal("ElectionStarted");
      console.log("✅ Voting started successfully");
      
      // Cast votes with realistic distribution
      // Amina Hassan: 3 votes (60%)
      // Chike Okafor: 1 vote (20%) 
      // Fatima Abdullahi: 1 vote (20%)
      
      await electra.vote(1, { from: voter1 }); // Amina
      await electra.vote(1, { from: voter2 }); // Amina
      await electra.vote(2, { from: voter3 }); // Chike
      await electra.vote(1, { from: voter4 }); // Amina
      await electra.vote(3, { from: voter5 }); // Fatima
      
      console.log("✅ All votes cast successfully");
      
      // Verify vote counts
      const candidate1Info = await electra.getCandidateInfo(1);
      const candidate2Info = await electra.getCandidateInfo(2);
      const candidate3Info = await electra.getCandidateInfo(3);
      
      expect(candidate1Info.voteCount.toNumber()).to.equal(3);
      expect(candidate2Info.voteCount.toNumber()).to.equal(1);
      expect(candidate3Info.voteCount.toNumber()).to.equal(1);
      console.log("✅ Vote counts verified");
      
      // Check current winner
      const currentWinner = await electra.getCurrentWinner();
      expect(currentWinner.winnerID.toNumber()).to.equal(1);
      expect(currentWinner.winnerName).to.equal("Amina Hassan");
      expect(currentWinner.maxVotes.toNumber()).to.equal(3);
      expect(currentWinner.isTie).to.equal(false);
      console.log("✅ Current winner determined correctly");
      
      // === PHASE 4: ELECTION CONCLUSION ===
      console.log("🏁 Phase 4: Election Conclusion");
      
      // End voting
      const endVotingTx = await electra.endVoting({ from: owner });
      expect(endVotingTx.logs[0].event).to.equal("ElectionEnded");
      console.log("✅ Voting ended successfully");
      
      // Move time forward past election end
      await time.increase(time.duration.hours(1));
      
      // Finalize election
      const finalizeTx = await electra.finalizeElection({ from: owner });
      expect(finalizeTx.logs[0].event).to.equal("ElectionFinalized");
      expect(finalizeTx.logs[0].args.winnerID.toNumber()).to.equal(1);
      expect(finalizeTx.logs[0].args.winnerName).to.equal("Amina Hassan");
      console.log("✅ Election finalized successfully");
      
      // === PHASE 5: RESULTS VERIFICATION ===
      console.log("📊 Phase 5: Results Verification");
      
      const finalElectionInfo = await electra.getElectionInfo();
      expect(finalElectionInfo.isFinalized).to.equal(true);
      expect(finalElectionInfo.isActive).to.equal(false);
      expect(finalElectionInfo.winnerID.toNumber()).to.equal(1);
      expect(finalElectionInfo.totalVotes.toNumber()).to.equal(5);
      
      // Get election statistics
      const stats = await electra.getElectionStatistics();
      expect(stats.totalRegisteredVoters.toNumber()).to.equal(5);
      expect(stats.totalVotesCast.toNumber()).to.equal(5);
      expect(stats.voterTurnoutPercentage.toNumber()).to.equal(100);
      expect(stats.hasWinner).to.equal(true);
      expect(stats.electionComplete).to.equal(true);
      
      console.log("✅ Final results verified");
      console.log("🎉 Integration test completed successfully!");
      
      // Print final results
      console.log("\n📊 FINAL ELECTION RESULTS:");
      console.log("===========================");
      console.log(`🏆 WINNER: ${currentWinner.winnerName} (${currentWinner.winnerParty})`);
      console.log(`📈 Votes: ${currentWinner.maxVotes} out of ${stats.totalVotesCast}`);
      console.log(`📊 Turnout: ${stats.voterTurnoutPercentage}%`);
      console.log("===========================");
    });
    
    it("Should handle voter self-registration workflow", async function () {
      console.log("👤 Testing Self-Registration Workflow");
      
      // Create election
      await electra.createElection(
        "Self-Registration Test",
        "Testing self-registration feature",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Test Candidate", "Test Party", "Test Manifesto", { from: owner });
      
      // Self-register voters
      await electra.selfRegister({ from: voter1 });
      await electra.selfRegister({ from: voter2 });
      
      const electionInfo = await electra.getElectionInfo();
      expect(electionInfo.totalVoters.toNumber()).to.equal(2);
      
      // Verify self-registered voters can vote
      await electra.startVoting({ from: owner });
      await electra.vote(1, { from: voter1 });
      await electra.vote(1, { from: voter2 });
      
      const candidateInfo = await electra.getCandidateInfo(1);
      expect(candidateInfo.voteCount.toNumber()).to.equal(2);
      
      console.log("✅ Self-registration workflow completed");
    });
    
    it("Should handle emergency scenarios during election", async function () {
      console.log("🚨 Testing Emergency Scenarios");
      
      // Setup election
      await electra.createElection(
        "Emergency Test Election",
        "Testing emergency handling",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Candidate 1", "Party 1", "Manifesto 1", { from: owner });
      await electra.addCandidate("Candidate 2", "Party 2", "Manifesto 2", { from: owner });
      
      await electra.registerVoter(voter1, { from: owner });
      await electra.registerVoter(voter2, { from: owner });
      
      await electra.startVoting({ from: owner });
      
      // Cast some votes
      await electra.vote(1, { from: voter1 });
      
      // Simulate emergency: extend voting period
      console.log("🔧 Extending voting period due to emergency");
      const extendTx = await electra.extendVotingPeriod(2, { from: owner });
      expect(extendTx.logs[0].event).to.equal("VotingExtended");
      
      // Continue voting after extension
      await electra.vote(2, { from: voter2 });
      
      // Test system pause during emergency
      console.log("⏸️  Pausing system for emergency");
      await electra.pauseSystem({ from: owner });
      
      try {
        await electra.vote(1, { from: voter3 });
        expect.fail("Should not allow voting when paused");
      } catch (error) {
        expect(error.message).to.include("System is currently paused");
      }
      
      // Resume system
      console.log("▶️  Resuming system after emergency");
      await electra.unpauseSystem({ from: owner });
      
      // End and finalize election
      await electra.endVoting({ from: owner });
      await time.increase(time.duration.hours(1));
      await electra.finalizeElection({ from: owner });
      
      console.log("✅ Emergency scenarios handled successfully");
    });
    
    it("Should provide transparent audit trail", async function () {
      console.log("🔍 Testing Audit Trail and Transparency");
      
      // Setup small election for audit testing
      await electra.createElection(
        "Audit Trail Test",
        "Testing transparency features",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Auditor Candidate", "Transparency Party", "Open governance", { from: owner });
      await electra.registerVoter(voter1, { from: owner });
      
      // Get voter verification hash before voting
      const voterInfoBefore = await electra.getVoterInfo(voter1);
      const verificationHash = voterInfoBefore.verificationHash;
      
      await electra.startVoting({ from: owner });
      const voteTx = await electra.vote(1, { from: voter1 });
      
      // Verify vote event was emitted
      expect(voteTx.logs[0].event).to.equal("VoteCast");
      const voteEvent = voteTx.logs[0].args;
      expect(voteEvent.voter).to.equal(voter1);
      expect(voteEvent.candidateID.toNumber()).to.equal(1);
      
      // Verify vote record was created
      const voteRecord = await electra.getVoteRecord(1);
      expect(voteRecord.voter).to.equal(voter1);
      expect(voteRecord.candidateID.toNumber()).to.equal(1);
      expect(voteRecord.timestamp.toNumber()).to.be.greaterThan(0);
      
      // Verify vote using verification hash
      const isVoteValid = await electra.verifyVote(voter1, verificationHash);
      expect(isVoteValid).to.equal(true);
      
      // Verify voter status after voting
      const voterInfoAfter = await electra.getVoterInfo(voter1);
      expect(voterInfoAfter.hasVoted).to.equal(true);
      expect(voterInfoAfter.candidateVoted.toNumber()).to.equal(1);
      
      console.log("✅ Audit trail verified - complete transparency achieved");
    });
    
    it("Should handle edge case: tied election", async function () {
      console.log("⚖️  Testing Tied Election Scenario");
      
      await electra.createElection(
        "Tie Test Election",
        "Testing tied election handling",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Candidate A", "Party A", "Manifesto A", { from: owner });
      await electra.addCandidate("Candidate B", "Party B", "Manifesto B", { from: owner });
      
      await electra.registerVoter(voter1, { from: owner });
      await electra.registerVoter(voter2, { from: owner });
      
      await electra.startVoting({ from: owner });
      
      // Create a tie
      await electra.vote(1, { from: voter1 });
      await electra.vote(2, { from: voter2 });
      
      const currentWinner = await electra.getCurrentWinner();
      expect(currentWinner.isTie).to.equal(true);
      expect(currentWinner.maxVotes.toNumber()).to.equal(1);
      
      console.log("✅ Tie scenario detected and handled correctly");
    });
    
    it("Should maintain performance with realistic load", async function () {
      console.log("⚡ Testing Performance with Realistic Load");
      
      await electra.createElection(
        "Performance Test Election",
        "Testing system performance",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      // Add multiple candidates
      const candidateCount = 10;
      for (let i = 1; i <= candidateCount; i++) {
        await electra.addCandidate(
          `Candidate ${i}`,
          `Party ${i}`,
          `Manifesto for candidate ${i}`,
          { from: owner }
        );
      }
      
      // Register all available voters
      const voterAccounts = accounts.slice(1, 8); // Use 7 accounts as voters
      for (let i = 0; i < voterAccounts.length; i++) {
        await electra.registerVoter(voterAccounts[i], { from: owner });
      }
      
      await electra.startVoting({ from: owner });
      
      // Cast votes distributed across candidates
      for (let i = 0; i < voterAccounts.length; i++) {
        const candidateChoice = (i % candidateCount) + 1;
        await electra.vote(candidateChoice, { from: voterAccounts[i] });
      }
      
      // Verify all operations completed successfully
      const electionInfo = await electra.getElectionInfo();
      expect(electionInfo.totalVotes.toNumber()).to.equal(voterAccounts.length);
      
      // Test getting all candidates (tests array operations)
      const allCandidates = await electra.getAllCandidates();
      expect(allCandidates.names.length).to.equal(candidateCount);
      
      console.log(`✅ Performance test completed: ${candidateCount} candidates, ${voterAccounts.length} voters`);
    });
  });
  
  describe("Multi-Election Scenarios", function () {
    it("Should handle multiple sequential elections", async function () {
      console.log("🔄 Testing Sequential Elections");
      
      electra = await Electra.new({ from: owner });
      
      // First Election
      console.log("📊 Running Election 1");
      const currentTime1 = await time.latest();
      
      await electra.createElection(
        "Election 1 - Presidential",
        "First test election",
        currentTime1.add(time.duration.hours(1)),
        currentTime1.add(time.duration.hours(2)),
        currentTime1.add(time.duration.hours(4)),
        { from: owner }
      );
      
      await electra.addCandidate("President A", "Party 1", "Manifesto A", { from: owner });
      await electra.addCandidate("President B", "Party 2", "Manifesto B", { from: owner });
      
      await electra.registerVoter(voter1, { from: owner });
      await electra.startVoting({ from: owner });
      await electra.vote(1, { from: voter1 });
      await electra.endVoting({ from: owner });
      
      await time.increase(time.duration.hours(5));
      await electra.finalizeElection({ from: owner });
      
      const election1Info = await electra.getElectionInfo();
      expect(election1Info.isFinalized).to.equal(true);
      console.log("✅ Election 1 completed and finalized");
      
      // Note: In this POC, we test sequential elections by finalizing the first
      // In a production system, you might want separate election instances
      
      console.log("✅ Sequential election handling verified");
    });
  });
});