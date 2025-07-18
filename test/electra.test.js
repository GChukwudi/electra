const Electra = artifacts.require("Electra");
const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");

contract("Electra Voting System", (accounts) => {
  let electraInstance;
  const commissioner = accounts[0];
  const admin1 = accounts[1];
  const voter1 = accounts[2];
  const voter2 = accounts[3];
  const voter3 = accounts[4];
  const unauthorized = accounts[5];

  const electionTitle = "Test Election 2024";
  const electionDescription = "Test election for Electra voting system";
  const durationHours = 1;
  const maxVoters = 100;

  beforeEach(async () => {
    electraInstance = await Electra.new(
      electionTitle,
      electionDescription,
      durationHours,
      maxVoters,
      { from: commissioner }
    );
  });

  describe("🏗️ Contract Deployment", () => {
    it("should deploy with correct initial values", async () => {
      const stats = await electraInstance.getElectionStats();
      
      assert.equal(stats.title, electionTitle, "Election title should match");
      assert.equal(stats.description, electionDescription, "Description should match");
      assert.equal(stats.totalVotersCount.toNumber(), 0, "Should start with 0 voters");
      assert.equal(stats.totalVotesCount.toNumber(), 0, "Should start with 0 votes");
      assert.equal(stats.totalCandidatesCount.toNumber(), 0, "Should start with 0 candidates");
      assert.equal(stats.registrationActive, true, "Registration should be open initially");
      assert.equal(stats.votingActive, false, "Voting should be closed initially");
      assert.equal(stats.finalized, false, "Election should not be finalized");
    });

    it("should set the correct commissioner", async () => {
      const config = await electraInstance.electionConfig();
      assert.equal(config.commissioner, commissioner, "Commissioner should be deployer");
    });
  });

  describe("👨‍💼 Admin Management", () => {
    it("should allow commissioner to add admins", async () => {
      await electraInstance.addAdmin(admin1, { from: commissioner });
      
      const isAdmin = await electraInstance.authorizedAdmins(admin1);
      assert.equal(isAdmin, true, "Admin should be authorized");
    });

    it("should emit AdminAdded event", async () => {
      const result = await electraInstance.addAdmin(admin1, { from: commissioner });
      
      truffleAssert.eventEmitted(result, "AdminAdded", (ev) => {
        return ev.admin === admin1 && ev.addedBy === commissioner;
      });
    });

    it("should not allow non-commissioner to add admins", async () => {
      await truffleAssert.reverts(
        electraInstance.addAdmin(admin1, { from: unauthorized }),
        "Only commissioner"
      );
    });

    it("should allow commissioner to remove admins", async () => {
      await electraInstance.addAdmin(admin1, { from: commissioner });
      await electraInstance.removeAdmin(admin1, { from: commissioner });
      
      const isAdmin = await electraInstance.authorizedAdmins(admin1);
      assert.equal(isAdmin, false, "Admin should be removed");
    });
  });

  describe("🎭 Candidate Management", () => {
    beforeEach(async () => {
      await electraInstance.addAdmin(admin1, { from: commissioner });
    });

    it("should allow authorized users to add candidates", async () => {
      await electraInstance.addCandidate(
        "John Doe",
        "Democratic Party",
        "Economic reform manifesto",
        "QmTestHash",
        { from: commissioner }
      );

      const candidate = await electraInstance.getCandidateInfo(1);
      assert.equal(candidate.name, "John Doe", "Candidate name should match");
      assert.equal(candidate.party, "Democratic Party", "Party should match");
      assert.equal(candidate.manifesto, "Economic reform manifesto", "Manifesto should match");
      assert.equal(candidate.voteCount.toNumber(), 0, "Vote count should be 0");
      assert.equal(candidate.isActive, true, "Candidate should be active");
      assert.equal(candidate.imageHash, "QmTestHash", "Image hash should match");
    });

    it("should allow admin to add candidates", async () => {
      await electraInstance.addCandidate(
        "Jane Smith",
        "Progressive Party",
        "Education reform manifesto",
        "QmTestHash2",
        { from: admin1 }
      );

      const totalCandidates = await electraInstance.totalCandidates();
      assert.equal(totalCandidates.toNumber(), 1, "Should have 1 candidate");
    });

    it("should emit CandidateAdded event", async () => {
      const result = await electraInstance.addCandidate(
        "John Doe",
        "Democratic Party",
        "Economic reform manifesto",
        "QmTestHash",
        { from: commissioner }
      );

      truffleAssert.eventEmitted(result, "CandidateAdded", (ev) => {
        return ev.candidateID.toNumber() === 1 && 
               ev.name === "John Doe" && 
               ev.party === "Democratic Party" &&
               ev.addedBy === commissioner;
      });
    });

    it("should not allow unauthorized users to add candidates", async () => {
      await truffleAssert.reverts(
        electraInstance.addCandidate(
          "Unauthorized Candidate",
          "Some Party",
          "Some manifesto",
          "QmTestHash",
          { from: unauthorized }
        ),
        "Not authorized"
      );
    });

    it("should not allow adding candidates with empty name", async () => {
      await truffleAssert.reverts(
        electraInstance.addCandidate(
          "",
          "Some Party",
          "Some manifesto",
          "QmTestHash",
          { from: commissioner }
        ),
        "Name required"
      );
    });

    it("should not allow adding candidates during voting", async () => {
      // Add candidates first
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      
      // Start voting
      await electraInstance.startVoting(1, { from: commissioner });

      // Try to add another candidate
      await truffleAssert.reverts(
        electraInstance.addCandidate("Late Candidate", "Late Party", "Late manifesto", "LateHash", { from: commissioner }),
        "Cannot add during voting"
      );
    });

    it("should allow updating candidate information", async () => {
      await electraInstance.addCandidate("John Doe", "Democratic Party", "Old manifesto", "OldHash", { from: commissioner });
      
      await electraInstance.updateCandidate(
        1,
        "John Updated",
        "Updated Party",
        "New manifesto",
        "NewHash",
        { from: commissioner }
      );

      const candidate = await electraInstance.getCandidateInfo(1);
      assert.equal(candidate.name, "John Updated", "Name should be updated");
      assert.equal(candidate.party, "Updated Party", "Party should be updated");
      assert.equal(candidate.manifesto, "New manifesto", "Manifesto should be updated");
      assert.equal(candidate.imageHash, "NewHash", "Image hash should be updated");
    });

    it("should get all candidates correctly", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      
      const candidates = await electraInstance.getAllCandidates();
      
      assert.equal(candidates.ids.length, 2, "Should return 2 candidates");
      assert.equal(candidates.names[0], "Candidate 1", "First candidate name should match");
      assert.equal(candidates.names[1], "Candidate 2", "Second candidate name should match");
      assert.equal(candidates.parties[0], "Party 1", "First party should match");
      assert.equal(candidates.parties[1], "Party 2", "Second party should match");
    });
  });

  describe("👥 Voter Registration", () => {
    it("should allow voter registration", async () => {
      await electraInstance.registerVoter("Alice Johnson", { from: voter1 });
      
      const voterInfo = await electraInstance.getVoterInfo(voter1);
      assert.equal(voterInfo.isRegistered, true, "Voter should be registered");
      assert.equal(voterInfo.hasVoted, false, "Voter should not have voted");
      assert.equal(voterInfo.voterName, "Alice Johnson", "Voter name should match");
      assert.equal(voterInfo.voterID.toNumber(), 1, "Voter ID should be 1");
    });

    it("should emit VoterRegistered event", async () => {
      const result = await electraInstance.registerVoter("Alice Johnson", { from: voter1 });
      
      truffleAssert.eventEmitted(result, "VoterRegistered", (ev) => {
        return ev.voter === voter1 && 
               ev.voterID.toNumber() === 1 && 
               ev.voterName === "Alice Johnson";
      });
    });

    it("should not allow duplicate registration", async () => {
      await electraInstance.registerVoter("Alice Johnson", { from: voter1 });
      
      await truffleAssert.reverts(
        electraInstance.registerVoter("Alice Again", { from: voter1 }),
        "Already registered"
      );
    });

    it("should not allow registration with empty name", async () => {
      await truffleAssert.reverts(
        electraInstance.registerVoter("", { from: voter1 }),
        "Name required"
      );
    });

    it("should not allow registration when closed", async () => {
      await electraInstance.toggleRegistration({ from: commissioner });
      
      await truffleAssert.reverts(
        electraInstance.registerVoter("Alice Johnson", { from: voter1 }),
        "Registration closed"
      );
    });

    it("should increment voter count correctly", async () => {
      await electraInstance.registerVoter("Alice", { from: voter1 });
      await electraInstance.registerVoter("Bob", { from: voter2 });
      
      const stats = await electraInstance.getElectionStats();
      assert.equal(stats.totalVotersCount.toNumber(), 2, "Should have 2 registered voters");
    });
  });

  describe("🗳️ Voting Process", () => {
    beforeEach(async () => {
      // Add candidates
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      
      // Register voters
      await electraInstance.registerVoter("Alice", { from: voter1 });
      await electraInstance.registerVoter("Bob", { from: voter2 });
      await electraInstance.registerVoter("Charlie", { from: voter3 });
    });

    it("should allow voting when period is active", async () => {
      await electraInstance.startVoting(1, { from: commissioner });
      
      await electraInstance.vote(1, { from: voter1 });
      
      const voterInfo = await electraInstance.getVoterInfo(voter1);
      assert.equal(voterInfo.hasVoted, true, "Voter should have voted");
      assert.equal(voterInfo.candidateVoted.toNumber(), 1, "Should have voted for candidate 1");
      
      const candidate = await electraInstance.getCandidateInfo(1);
      assert.equal(candidate.voteCount.toNumber(), 1, "Candidate should have 1 vote");
    });

    it("should emit VoteCast event", async () => {
      await electraInstance.startVoting(1, { from: commissioner });
      
      const result = await electraInstance.vote(1, { from: voter1 });
      
      truffleAssert.eventEmitted(result, "VoteCast", (ev) => {
        return ev.voter === voter1 && ev.candidateID.toNumber() === 1;
      });
    });

    it("should not allow voting before voting starts", async () => {
      await truffleAssert.reverts(
        electraInstance.vote(1, { from: voter1 }),
        "Voting closed"
      );
    });

    it("should not allow unregistered voters to vote", async () => {
      await electraInstance.startVoting(1, { from: commissioner });
      
      await truffleAssert.reverts(
        electraInstance.vote(1, { from: unauthorized }),
        "Not registered"
      );
    });

    it("should not allow double voting", async () => {
      await electraInstance.startVoting(1, { from: commissioner });
      
      await electraInstance.vote(1, { from: voter1 });
      
      await truffleAssert.reverts(
        electraInstance.vote(2, { from: voter1 }),
        "Already voted"
      );
    });

    it("should not allow voting for invalid candidate", async () => {
      await electraInstance.startVoting(1, { from: commissioner });
      
      await truffleAssert.reverts(
        electraInstance.vote(999, { from: voter1 }),
        "Invalid candidate"
      );
    });

    it("should calculate votes correctly", async () => {
      await electraInstance.startVoting(1, { from: commissioner });
      
      await electraInstance.vote(1, { from: voter1 });
      await electraInstance.vote(1, { from: voter2 });
      await electraInstance.vote(2, { from: voter3 });
      
      const candidate1 = await electraInstance.getCandidateInfo(1);
      const candidate2 = await electraInstance.getCandidateInfo(2);
      const stats = await electraInstance.getElectionStats();
      
      assert.equal(candidate1.voteCount.toNumber(), 2, "Candidate 1 should have 2 votes");
      assert.equal(candidate2.voteCount.toNumber(), 1, "Candidate 2 should have 1 vote");
      assert.equal(stats.totalVotesCount.toNumber(), 3, "Total votes should be 3");
    });
  });

  describe("🏆 Election Results", () => {
    beforeEach(async () => {
      // Setup election
      await electraInstance.addCandidate("Winner", "Winning Party", "Winning Manifesto", "WinHash", { from: commissioner });
      await electraInstance.addCandidate("Runner Up", "Second Party", "Second Manifesto", "SecondHash", { from: commissioner });
      await electraInstance.addCandidate("Third Place", "Third Party", "Third Manifesto", "ThirdHash", { from: commissioner });
      
      // Register voters
      await electraInstance.registerVoter("Voter1", { from: voter1 });
      await electraInstance.registerVoter("Voter2", { from: voter2 });
      await electraInstance.registerVoter("Voter3", { from: voter3 });
      
      // Start voting and cast votes
      await electraInstance.startVoting(1, { from: commissioner });
      await electraInstance.vote(1, { from: voter1 }); // Winner gets 2 votes
      await electraInstance.vote(1, { from: voter2 });
      await electraInstance.vote(2, { from: voter3 }); // Runner up gets 1 vote
    });

    it("should identify correct winner", async () => {
      const winner = await electraInstance.getCurrentWinner();
      
      assert.equal(winner.winnerID.toNumber(), 1, "Candidate 1 should be winner");
      assert.equal(winner.winnerName, "Winner", "Winner name should match");
      assert.equal(winner.winnerParty, "Winning Party", "Winner party should match");
      assert.equal(winner.maxVotes.toNumber(), 2, "Winner should have 2 votes");
      assert.equal(winner.totalVotesCount.toNumber(), 3, "Total votes should be 3");
    });

    it("should allow commissioner to finalize election", async () => {
      await electraInstance.endVoting({ from: commissioner });
      
      const result = await electraInstance.finalizeElection({ from: commissioner });
      
      truffleAssert.eventEmitted(result, "ElectionFinalized", (ev) => {
        return ev.winnerID.toNumber() === 1 && 
               ev.winnerName === "Winner" && 
               ev.totalVotes.toNumber() === 2;
      });
      
      const stats = await electraInstance.getElectionStats();
      assert.equal(stats.finalized, true, "Election should be finalized");
    });

    it("should not allow finalization during voting", async () => {
      await truffleAssert.reverts(
        electraInstance.finalizeElection({ from: commissioner }),
        "End voting first"
      );
    });

    it("should not allow non-commissioner to finalize", async () => {
      await electraInstance.endVoting({ from: commissioner });
      
      await truffleAssert.reverts(
        electraInstance.finalizeElection({ from: unauthorized }),
        "Only commissioner"
      );
    });
  });

  describe("🔒 Security Features", () => {
    beforeEach(async () => {
      await electraInstance.addCandidate("Test Candidate", "Test Party", "Test Manifesto", "TestHash", { from: commissioner });
      await electraInstance.registerVoter("Test Voter", { from: voter1 });
    });

    it("should allow commissioner to pause contract", async () => {
      await electraInstance.pause({ from: commissioner });
      
      await truffleAssert.reverts(
        electraInstance.registerVoter("Paused Voter", { from: voter2 }),
        "Pausable: paused"
      );
    });

    it("should allow commissioner to unpause contract", async () => {
      await electraInstance.pause({ from: commissioner });
      await electraInstance.unpause({ from: commissioner });
      
      // Should work after unpause
      await electraInstance.registerVoter("Unpaused Voter", { from: voter2 });
      
      const voterInfo = await electraInstance.getVoterInfo(voter2);
      assert.equal(voterInfo.isRegistered, true, "Voter should be registered after unpause");
    });

    it("should not allow non-commissioner to pause", async () => {
      await truffleAssert.reverts(
        electraInstance.pause({ from: unauthorized }),
        "Only commissioner"
      );
    });

    it("should create verifiable vote hashes", async () => {
      await electraInstance.startVoting(1, { from: commissioner });
      await electraInstance.vote(1, { from: voter1 });
      
      const voteRecord = await electraInstance.getVoteRecord(1);
      assert.equal(voteRecord.voter, voter1, "Vote record should have correct voter");
      assert.equal(voteRecord.candidateID.toNumber(), 1, "Vote record should have correct candidate");
      
      // Verify hash
      const isValid = await electraInstance.verifyVoteHash(
        1,
        voteRecord.voter,
        voteRecord.candidateID,
        voteRecord.timestamp
      );
      assert.equal(isValid, true, "Vote hash should be valid");
    });

    it("should detect invalid vote hashes", async () => {
      await electraInstance.startVoting(1, { from: commissioner });
      await electraInstance.vote(1, { from: voter1 });
      
      // Try to verify with wrong data
      const isValid = await electraInstance.verifyVoteHash(
        1,
        voter2, // Wrong voter
        1,
        Math.floor(Date.now() / 1000) // Wrong timestamp
      );
      assert.equal(isValid, false, "Vote hash should be invalid with wrong data");
    });
  });

  describe("⚙️ Election Management", () => {
    it("should allow starting voting with minimum candidates", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      
      await electraInstance.startVoting(1, { from: commissioner });
      
      const stats = await electraInstance.getElectionStats();
      assert.equal(stats.votingActive, true, "Voting should be active");
      assert.equal(stats.registrationActive, false, "Registration should be closed");
    });

    it("should not allow starting voting with insufficient candidates", async () => {
      await electraInstance.addCandidate("Only Candidate", "Only Party", "Only Manifesto", "OnlyHash", { from: commissioner });
      
      await truffleAssert.reverts(
        electraInstance.startVoting(1, { from: commissioner }),
        "Need at least 2 candidates"
      );
    });

    it("should allow extending voting period", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      
      await electraInstance.startVoting(1, { from: commissioner });
      
      const statsBefore = await electraInstance.getElectionStats();
      const endTimeBefore = statsBefore.endTime.toNumber();
      
      await electraInstance.extendVoting(2, { from: commissioner }); // Extend by 2 hours
      
      const statsAfter = await electraInstance.getElectionStats();
      const endTimeAfter = statsAfter.endTime.toNumber();
      
      assert.equal(endTimeAfter, endTimeBefore + (2 * 3600), "End time should be extended by 2 hours");
    });

    it("should allow deactivating candidates", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      
      await electraInstance.deactivateCandidate(1, { from: commissioner });
      
      const candidate = await electraInstance.getCandidateInfo(1);
      assert.equal(candidate.isActive, false, "Candidate should be deactivated");
    });

    it("should check if voting is currently active", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      
      let isActive = await electraInstance.isVotingActive();
      assert.equal(isActive, false, "Voting should not be active initially");
      
      await electraInstance.startVoting(1, { from: commissioner });
      
      isActive = await electraInstance.isVotingActive();
      assert.equal(isActive, true, "Voting should be active after starting");
    });
  });
});
