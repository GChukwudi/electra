const Electra = artifacts.require("Electra");
const { expect } = require("chai");
const { time } = require("@openzeppelin/test-helpers");

contract("Electra", function (accounts) {
  let electra;
  const [owner, admin, voter1, voter2, voter3, voter4, voter5] = accounts;
  
  const electionTitle = "Test Election 2025";
  const electionDescription = "Test election for POC";
  
  beforeEach(async function () {
    electra = await Electra.new({ from: owner });
  });
  
  describe("Contract Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(electra.address).to.not.equal("");
      expect(electra.address).to.not.equal(0x0);
    });
    
    it("Should set the correct owner and commissioner", async function () {
      const systemOwner = await electra.systemOwner();
      const commissioner = await electra.currentCommissioner();
      
      expect(systemOwner).to.equal(owner);
      expect(commissioner).to.equal(owner);
    });
    
    it("Should initialize with correct default values", async function () {
      const totalCandidates = await electra.totalCandidates();
      const nextVoterID = await electra.nextVoterID();
      const registrationOpen = await electra.registrationOpen();
      const votingOpen = await electra.votingOpen();
      
      expect(totalCandidates.toNumber()).to.equal(0);
      expect(nextVoterID.toNumber()).to.equal(1);
      expect(registrationOpen).to.equal(false);
      expect(votingOpen).to.equal(false);
    });
  });
  
  describe("Election Management", function () {
    let registrationDeadline, startTime, endTime;
    
    beforeEach(async function () {
      const currentTime = await time.latest();
      registrationDeadline = currentTime.add(time.duration.days(1));
      startTime = registrationDeadline.add(time.duration.hours(1));
      endTime = startTime.add(time.duration.days(2));
    });
    
    it("Should create an election successfully", async function () {
      const tx = await electra.createElection(
        electionTitle,
        electionDescription,
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      // Check event - FIXED: Check actual title instead of hash
      expect(tx.logs[0].event).to.equal("ElectionCreated");
      expect(tx.logs[0].args.title).to.equal(electionTitle);
      
      // Check election info
      const electionInfo = await electra.getElectionInfo();
      expect(electionInfo.title).to.equal(electionTitle);
      expect(electionInfo.description).to.equal(electionDescription);
      expect(electionInfo.isActive).to.equal(true);
      expect(electionInfo.isFinalized).to.equal(false);
    });
    
    it("Should not allow non-commissioner to create election", async function () {
      try {
        await electra.createElection(
          electionTitle,
          electionDescription,
          registrationDeadline,
          startTime,
          endTime,
          { from: voter1 }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Only commissioner can perform this action");
      }
    });
    
    it("Should not allow invalid election parameters", async function () {
      const currentTime = await time.latest();
      
      // Past registration deadline
      try {
        await electra.createElection(
          electionTitle,
          electionDescription,
          currentTime.sub(time.duration.hours(1)),
          startTime,
          endTime,
          { from: owner }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Registration deadline must be in future");
      }
      
      // Start time before registration deadline
      try {
        await electra.createElection(
          electionTitle,
          electionDescription,
          registrationDeadline,
          registrationDeadline.sub(time.duration.hours(1)),
          endTime,
          { from: owner }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Voting must start after registration deadline");
      }
    });
  });
  
  describe("Candidate Management", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.days(1));
      const startTime = registrationDeadline.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(2));
      
      await electra.createElection(
        electionTitle,
        electionDescription,
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
    });
    
    it("Should add candidates successfully", async function () {
      const tx = await electra.addCandidate(
        "John Doe",
        "Test Party",
        "Test manifesto",
        { from: owner }
      );
      
      // Check event - FIXED: Check actual name instead of hash
      expect(tx.logs[0].event).to.equal("CandidateAdded");
      expect(tx.logs[0].args.name).to.equal("John Doe");
      
      // Check candidate info
      const candidateInfo = await electra.getCandidateInfo(1);
      expect(candidateInfo.name).to.equal("John Doe");
      expect(candidateInfo.party).to.equal("Test Party");
      expect(candidateInfo.manifesto).to.equal("Test manifesto");
      expect(candidateInfo.isActive).to.equal(true);
      expect(candidateInfo.voteCount.toNumber()).to.equal(0);
      
      const totalCandidates = await electra.totalCandidates();
      expect(totalCandidates.toNumber()).to.equal(1);
    });
    
    it("Should add multiple candidates", async function () {
      await electra.addCandidate("Ahmed Bonuola", "APC", "To promote economic growth, education reform, and healthcare improvement.", { from: owner });
      await electra.addCandidate("Christopher Ejiofor", "PDP", "Lorem Ipsum Lorem Ipsum Lorem Ipsum", { from: owner });
      await electra.addCandidate("Emenim Pius", "LP", "Lorem Ipsum Lorem Ipsum Lorem Ipsum", { from: owner });
      
      const totalCandidates = await electra.totalCandidates();
      expect(totalCandidates.toNumber()).to.equal(3);
      
      const allCandidates = await electra.getAllCandidates();
      expect(allCandidates.names.length).to.equal(3);
      expect(allCandidates.names[0]).to.equal("Ahmed Bonuola");
      expect(allCandidates.names[1]).to.equal("Christopher Ejiofor");
      expect(allCandidates.names[2]).to.equal("Emenim Pius");
    });
    
    it("Should not allow empty candidate name", async function () {
      try {
        await electra.addCandidate("", "Test Party", "Test manifesto", { from: owner });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Candidate name cannot be empty");
      }
    });
    
    it("Should deactivate candidate", async function () {
      await electra.addCandidate("John Doe", "Test Party", "Test manifesto", { from: owner });
      
      const tx = await electra.deactivateCandidate(1, { from: owner });
      expect(tx.logs[0].event).to.equal("CandidateDeactivated");
      
      const candidateInfo = await electra.getCandidateInfo(1);
      expect(candidateInfo.isActive).to.equal(false);
    });
  });
  
  describe("Voter Registration", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.days(1));
      const startTime = registrationDeadline.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(2));
      
      await electra.createElection(
        electionTitle,
        electionDescription,
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
    });
    
    it("Should register voters successfully", async function () {
      const tx = await electra.registerVoter(voter1, { from: owner });
      
      // Check event
      expect(tx.logs[0].event).to.equal("VoterRegistered");
      expect(tx.logs[0].args.voter).to.equal(voter1);
      
      // Check voter info - FIXED: Handle all return values
      const voterInfo = await electra.getVoterInfo(voter1);
      expect(voterInfo.isRegistered).to.equal(true);
      expect(voterInfo.hasVoted).to.equal(false);
      expect(voterInfo.voterID.toNumber()).to.equal(1);
      expect(voterInfo.verificationHash).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      
      const electionInfo = await electra.getElectionInfo();
      expect(electionInfo.totalVoters.toNumber()).to.equal(1);
    });
    
    it("Should allow self-registration", async function () {
      const tx = await electra.selfRegister({ from: voter1 });
      
      expect(tx.logs[0].event).to.equal("VoterRegistered");
      expect(tx.logs[0].args.voter).to.equal(voter1);
      
      const voterInfo = await electra.getVoterInfo(voter1);
      expect(voterInfo.isRegistered).to.equal(true);
    });
    
    it("Should not allow duplicate registration", async function () {
      await electra.registerVoter(voter1, { from: owner });
      
      try {
        await electra.registerVoter(voter1, { from: owner });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Voter already registered");
      }
    });
    
    it("Should register multiple voters", async function () {
      await electra.registerVoter(voter1, { from: owner });
      await electra.registerVoter(voter2, { from: owner });
      await electra.registerVoter(voter3, { from: owner });
      
      const electionInfo = await electra.getElectionInfo();
      expect(electionInfo.totalVoters.toNumber()).to.equal(3);
      
      const voter1Info = await electra.getVoterInfo(voter1);
      const voter2Info = await electra.getVoterInfo(voter2);
      const voter3Info = await electra.getVoterInfo(voter3);
      
      expect(voter1Info.voterID.toNumber()).to.equal(1);
      expect(voter2Info.voterID.toNumber()).to.equal(2);
      expect(voter3Info.voterID.toNumber()).to.equal(3);
    });
  });
  
  describe("Voting Process", function () {
    beforeEach(async function () {
      // FIXED: Use shorter timeframes and advance time properly
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(24));
      
      await electra.createElection(
        electionTitle,
        electionDescription,
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      // Add candidates
      await electra.addCandidate("Candidate 1", "Party 1", "Manifesto 1", { from: owner });
      await electra.addCandidate("Candidate 2", "Party 2", "Manifesto 2", { from: owner });
      
      // Register voters
      await electra.registerVoter(voter1, { from: owner });
      await electra.registerVoter(voter2, { from: owner });
      await electra.registerVoter(voter3, { from: owner });
    });
    
    it("Should allow voting after voting starts", async function () {
      // FIXED: Start voting manually (commissioner can override timing)
      await electra.startVoting({ from: owner });
      
      // Cast vote
      const tx = await electra.vote(1, { from: voter1 });
      
      // Check event
      expect(tx.logs[0].event).to.equal("VoteCast");
      expect(tx.logs[0].args.voter).to.equal(voter1);
      expect(tx.logs[0].args.candidateID.toNumber()).to.equal(1);
      
      // Check voter status
      const voterInfo = await electra.getVoterInfo(voter1);
      expect(voterInfo.hasVoted).to.equal(true);
      expect(voterInfo.candidateVoted.toNumber()).to.equal(1);
      
      // Check candidate vote count
      const candidateInfo = await electra.getCandidateInfo(1);
      expect(candidateInfo.voteCount.toNumber()).to.equal(1);
      
      // Check total votes
      const electionInfo = await electra.getElectionInfo();
      expect(electionInfo.totalVotes.toNumber()).to.equal(1);
    });
    
    it("Should not allow double voting", async function () {
      // Start voting
      await electra.startVoting({ from: owner });
      
      // Cast first vote
      await electra.vote(1, { from: voter1 });
      
      // Try to vote again
      try {
        await electra.vote(2, { from: voter1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("You have already voted");
      }
    });
    
    it("Should not allow voting before registration", async function () {
      await electra.startVoting({ from: owner });
      
      try {
        await electra.vote(1, { from: voter4 }); // unregistered voter
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("You are not registered to vote");
      }
    });
    
    it("Should not allow voting for invalid candidate", async function () {
      await electra.startVoting({ from: owner });
      
      try {
        await electra.vote(999, { from: voter1 }); // invalid candidate ID
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Invalid candidate ID");
      }
    });
    
    it("Should handle multiple votes correctly", async function () {
      await electra.startVoting({ from: owner });
      
      // Cast multiple votes
      await electra.vote(1, { from: voter1 });
      await electra.vote(2, { from: voter2 });
      await electra.vote(1, { from: voter3 });
      
      // Check vote counts
      const candidate1Info = await electra.getCandidateInfo(1);
      const candidate2Info = await electra.getCandidateInfo(2);
      
      expect(candidate1Info.voteCount.toNumber()).to.equal(2);
      expect(candidate2Info.voteCount.toNumber()).to.equal(1);
      
      // Check total votes
      const electionInfo = await electra.getElectionInfo();
      expect(electionInfo.totalVotes.toNumber()).to.equal(3);
    });
  });
  
  describe("Election Results", function () {
    beforeEach(async function () {
      // FIXED: Use shorter timeframes
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(2));
      
      await electra.createElection(
        electionTitle,
        electionDescription,
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      // Add candidates
      await electra.addCandidate("Alice Johnson", "Party A", "Manifesto A", { from: owner });
      await electra.addCandidate("Bob Smith", "Party B", "Manifesto B", { from: owner });
      await electra.addCandidate("Carol Brown", "Party C", "Manifesto C", { from: owner });
      
      // Register and vote
      await electra.registerVoter(voter1, { from: owner });
      await electra.registerVoter(voter2, { from: owner });
      await electra.registerVoter(voter3, { from: owner });
      await electra.registerVoter(voter4, { from: owner });
      await electra.registerVoter(voter5, { from: owner });
      
      await electra.startVoting({ from: owner });
      
      // Cast votes: Alice=3, Bob=1, Carol=1
      await electra.vote(1, { from: voter1 });
      await electra.vote(1, { from: voter2 });
      await electra.vote(1, { from: voter3 });
      await electra.vote(2, { from: voter4 });
      await electra.vote(3, { from: voter5 });
    });
    
    it("Should calculate winner correctly", async function () {
      const currentWinner = await electra.getCurrentWinner();
      
      expect(currentWinner.winnerID.toNumber()).to.equal(1);
      expect(currentWinner.winnerName).to.equal("Alice Johnson");
      expect(currentWinner.winnerParty).to.equal("Party A");
      expect(currentWinner.maxVotes.toNumber()).to.equal(3);
      expect(currentWinner.isTie).to.equal(false);
    });
    
    it("Should finalize election correctly", async function () {
      // End voting first
      await electra.endVoting({ from: owner });
      
      // Move time forward past election end
      await time.increase(time.duration.hours(3));
      
      // Finalize election
      const tx = await electra.finalizeElection({ from: owner });
      
      // Check event
      expect(tx.logs[0].event).to.equal("ElectionFinalized");
      expect(tx.logs[0].args.winnerID.toNumber()).to.equal(1);
      expect(tx.logs[0].args.winnerName).to.equal("Alice Johnson");
      expect(tx.logs[0].args.totalVotes.toNumber()).to.equal(3);
      
      // Check election status
      const electionInfo = await electra.getElectionInfo();
      expect(electionInfo.isFinalized).to.equal(true);
      expect(electionInfo.isActive).to.equal(false);
      expect(electionInfo.winnerID.toNumber()).to.equal(1);
    });
    
    it("Should provide correct election statistics", async function () {
      const stats = await electra.getElectionStatistics();
      
      expect(stats.totalRegisteredVoters.toNumber()).to.equal(5);
      expect(stats.totalVotesCast.toNumber()).to.equal(5);
      expect(stats.voterTurnoutPercentage.toNumber()).to.equal(100);
      expect(stats.activeCandidates.toNumber()).to.equal(3);
      expect(stats.totalCandidatesCount.toNumber()).to.equal(3);
      expect(stats.hasWinner).to.equal(false); // Not finalized yet
      expect(stats.electionComplete).to.equal(false);
    });
  });
  
  describe("Vote Verification", function () {
    let voterHash;
    
    beforeEach(async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(2));
      
      await electra.createElection(
        electionTitle,
        electionDescription,
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Test Candidate", "Test Party", "Test Manifesto", { from: owner });
      await electra.registerVoter(voter1, { from: owner });
      
      // Get verification hash
      const voterInfo = await electra.getVoterInfo(voter1);
      voterHash = voterInfo.verificationHash;
      
      await electra.startVoting({ from: owner });
      await electra.vote(1, { from: voter1 });
    });
    
    it("Should verify votes correctly", async function () {
      const isValid = await electra.verifyVote(voter1, voterHash);
      expect(isValid).to.equal(true);
    });
    
    it("Should reject invalid verification hash", async function () {
      const invalidHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
      const isValid = await electra.verifyVote(voter1, invalidHash);
      expect(isValid).to.equal(false);
    });
    
    it("Should create vote records", async function () {
      const voteRecord = await electra.getVoteRecord(1);
      
      expect(voteRecord.voter).to.equal(voter1);
      expect(voteRecord.candidateID.toNumber()).to.equal(1);
      expect(voteRecord.timestamp.toNumber()).to.be.greaterThan(0);
    });
  });
  
  describe("Emergency Controls", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(2));
      
      await electra.createElection(
        electionTitle,
        electionDescription,
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Test Candidate 1", "Test Party 1", "Test Manifesto 1", { from: owner });
      await electra.addCandidate("Test Candidate 2", "Test Party 2", "Test Manifesto 2", { from: owner });
      await electra.startVoting({ from: owner });
    });
    
    it("Should extend voting period", async function () {
      const electionInfoBefore = await electra.getElectionInfo();
      const originalEndTime = electionInfoBefore.endTime.toNumber();
      
      const tx = await electra.extendVotingPeriod(2, { from: owner }); // Extend by 2 hours
      
      expect(tx.logs[0].event).to.equal("VotingExtended");
      
      const electionInfoAfter = await electra.getElectionInfo();
      const newEndTime = electionInfoAfter.endTime.toNumber();
      
      expect(newEndTime).to.equal(originalEndTime + (2 * 60 * 60)); // 2 hours added
    });
    
    it("Should pause and unpause system", async function () {
      // Pause system
      await electra.pauseSystem({ from: owner });
      let systemStats = await electra.getSystemStats();
      expect(systemStats.paused).to.equal(true);
      
      // Unpause system
      await electra.unpauseSystem({ from: owner });
      systemStats = await electra.getSystemStats();
      expect(systemStats.paused).to.equal(false);
    });
    
    it("Should activate emergency mode", async function () {
      await electra.activateEmergency({ from: owner });
      
      const systemStats = await electra.getSystemStats();
      expect(systemStats.emergency).to.equal(true);
      expect(systemStats.paused).to.equal(true); // Auto-paused
    });
  });
  
  describe("Edge Cases", function () {
    it("Should handle tie detection", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(2));
      
      await electra.createElection(
        electionTitle,
        electionDescription,
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
      
      // Create a tie
      await electra.vote(1, { from: voter1 });
      await electra.vote(2, { from: voter2 });
      
      const currentWinner = await electra.getCurrentWinner();
      expect(currentWinner.isTie).to.equal(true);
    });
    
    it("Should handle zero votes scenario", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(2));
      
      await electra.createElection(
        electionTitle,
        electionDescription,
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Candidate 1", "Party 1", "Manifesto 1", { from: owner });
      await electra.addCandidate("Candidate 2", "Party 2", "Manifesto 2", { from: owner });
      await electra.startVoting({ from: owner });
      await electra.endVoting({ from: owner });
      
      // Move time forward
      await time.increase(time.duration.hours(3));
      
      try {
        await electra.finalizeElection({ from: owner });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("No votes cast");
      }
    });
  });
});