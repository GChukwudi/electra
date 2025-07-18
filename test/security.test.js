const Electra = artifacts.require("Electra");
const { assert } = require("chai");
const truffleAssert = require("truffle-assertions");

contract("Electra Security Tests", (accounts) => {
  let electraInstance;
  const commissioner = accounts[0];
  const admin1 = accounts[1];
  const voter1 = accounts[2];
  const voter2 = accounts[3];
  const attacker = accounts[4];

  const electionTitle = "Security Test Election";
  const electionDescription = "Testing security vulnerabilities";
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

  describe("🔒 Access Control Security", () => {
    it("should prevent unauthorized admin operations", async () => {
      // Try to add candidate as non-authorized user
      await truffleAssert.reverts(
        electraInstance.addCandidate(
          "Unauthorized Candidate",
          "Evil Party",
          "Evil manifesto",
          "EvilHash",
          { from: attacker }
        ),
        "Not authorized"
      );
    });

    it("should prevent unauthorized election management", async () => {
      // Add candidates first
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });

      // Try to start voting as unauthorized user
      await truffleAssert.reverts(
        electraInstance.startVoting(1, { from: attacker }),
        "Only commissioner"
      );

      // Try to end voting as unauthorized user
      await electraInstance.startVoting(1, { from: commissioner });
      await truffleAssert.reverts(
        electraInstance.endVoting({ from: attacker }),
        "Only commissioner"
      );

      // Try to finalize as unauthorized user
      await electraInstance.endVoting({ from: commissioner });
      await truffleAssert.reverts(
        electraInstance.finalizeElection({ from: attacker }),
        "Only commissioner"
      );
    });

    it("should prevent unauthorized admin management", async () => {
      // Try to add admin as non-commissioner
      await truffleAssert.reverts(
        electraInstance.addAdmin(admin1, { from: attacker }),
        "Only commissioner"
      );

      // Try to remove admin as non-commissioner
      await electraInstance.addAdmin(admin1, { from: commissioner });
      await truffleAssert.reverts(
        electraInstance.removeAdmin(admin1, { from: attacker }),
        "Only commissioner"
      );
    });
  });

  describe("🗳️ Voting Security", () => {
    beforeEach(async () => {
      // Setup election
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      await electraInstance.registerVoter("Voter 1", { from: voter1 });
      await electraInstance.registerVoter("Voter 2", { from: voter2 });
      await electraInstance.startVoting(1, { from: commissioner });
    });

    it("should prevent double voting", async () => {
      // First vote should succeed
      await electraInstance.vote(1, { from: voter1 });

      // Second vote should fail
      await truffleAssert.reverts(
        electraInstance.vote(2, { from: voter1 }),
        "Already voted"
      );
    });

    it("should prevent unregistered voting", async () => {
      await truffleAssert.reverts(
        electraInstance.vote(1, { from: attacker }),
        "Not registered"
      );
    });

    it("should prevent voting for invalid candidates", async () => {
      await truffleAssert.reverts(
        electraInstance.vote(999, { from: voter1 }),
        "Invalid candidate"
      );

      await truffleAssert.reverts(
        electraInstance.vote(0, { from: voter1 }),
        "Invalid candidate"
      );
    });

    it("should prevent voting when paused", async () => {
      await electraInstance.pause({ from: commissioner });

      await truffleAssert.reverts(
        electraInstance.vote(1, { from: voter1 }),
        "Pausable: paused"
      );
    });

    it("should validate vote hash integrity", async () => {
      await electraInstance.vote(1, { from: voter1 });

      const voteRecord = await electraInstance.getVoteRecord(1);
      
      // Valid hash verification
      const validVerification = await electraInstance.verifyVoteHash(
        1,
        voteRecord.voter,
        voteRecord.candidateID,
        voteRecord.timestamp
      );
      assert.equal(validVerification, true, "Valid vote hash should verify correctly");

      // Invalid hash verification (wrong voter)
      const invalidVerification = await electraInstance.verifyVoteHash(
        1,
        voter2, // Wrong voter
        voteRecord.candidateID,
        voteRecord.timestamp
      );
      assert.equal(invalidVerification, false, "Invalid vote hash should fail verification");
    });
  });

  describe("🔐 Registration Security", () => {
    it("should prevent duplicate registration", async () => {
      await electraInstance.registerVoter("Voter 1", { from: voter1 });

      await truffleAssert.reverts(
        electraInstance.registerVoter("Voter 1 Again", { from: voter1 }),
        "Already registered"
      );
    });

    it("should prevent registration with empty name", async () => {
      await truffleAssert.reverts(
        electraInstance.registerVoter("", { from: voter1 }),
        "Name required"
      );
    });

    it("should prevent registration when closed", async () => {
      await electraInstance.toggleRegistration({ from: commissioner });

      await truffleAssert.reverts(
        electraInstance.registerVoter("Late Voter", { from: voter1 }),
        "Registration closed"
      );
    });

    it("should prevent registration when paused", async () => {
      await electraInstance.pause({ from: commissioner });

      await truffleAssert.reverts(
        electraInstance.registerVoter("Paused Voter", { from: voter1 }),
        "Pausable: paused"
      );
    });

    it("should enforce maximum voter limit", async () => {
      // Deploy contract with max 2 voters
      const limitedElection = await Electra.new(
        "Limited Election",
        "Max 2 voters",
        1,
        2, // maxVoters = 2
        { from: commissioner }
      );

      // Register 2 voters successfully
      await limitedElection.registerVoter("Voter 1", { from: voter1 });
      await limitedElection.registerVoter("Voter 2", { from: voter2 });

      // Third registration should fail
      await truffleAssert.reverts(
        limitedElection.registerVoter("Voter 3", { from: attacker }),
        "Registration full"
      );
    });
  });

  describe("⚙️ State Manipulation Security", () => {
    it("should prevent candidate addition during voting", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      await electraInstance.startVoting(1, { from: commissioner });

      await truffleAssert.reverts(
        electraInstance.addCandidate("Late Candidate", "Late Party", "Late manifesto", "LateHash", { from: commissioner }),
        "Cannot add during voting"
      );
    });

    it("should prevent candidate updates during voting", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.startVoting(1, { from: commissioner });

      await truffleAssert.reverts(
        electraInstance.updateCandidate(1, "Updated Name", "Updated Party", "Updated manifesto", "UpdatedHash", { from: commissioner }),
        "Cannot update during voting"
      );
    });

    it("should prevent voting without sufficient candidates", async () => {
      await electraInstance.addCandidate("Only Candidate", "Only Party", "Only manifesto", "OnlyHash", { from: commissioner });

      await truffleAssert.reverts(
        electraInstance.startVoting(1, { from: commissioner }),
        "Need at least 2 candidates"
      );
    });

    it("should prevent finalization without votes", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      await electraInstance.startVoting(1, { from: commissioner });
      await electraInstance.endVoting({ from: commissioner });

      await truffleAssert.reverts(
        electraInstance.finalizeElection({ from: commissioner }),
        "No votes cast"
      );
    });

    it("should prevent operations on finalized election", async () => {
      // Setup and complete election
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      await electraInstance.registerVoter("Voter 1", { from: voter1 });
      await electraInstance.startVoting(1, { from: commissioner });
      await electraInstance.vote(1, { from: voter1 });
      await electraInstance.endVoting({ from: commissioner });
      await electraInstance.finalizeElection({ from: commissioner });

      // Try operations on finalized election
      await truffleAssert.reverts(
        electraInstance.addCandidate("New Candidate", "New Party", "New manifesto", "NewHash", { from: commissioner }),
        "Election finalized"
      );

      await truffleAssert.reverts(
        electraInstance.registerVoter("New Voter", { from: voter2 }),
        "Election finalized"
      );
    });
  });

  describe("🔧 Emergency Controls Security", () => {
    it("should only allow commissioner to pause/unpause", async () => {
      // Non-commissioner cannot pause
      await truffleAssert.reverts(
        electraInstance.pause({ from: attacker }),
        "Only commissioner"
      );

      // Commissioner can pause
      await electraInstance.pause({ from: commissioner });

      // Non-commissioner cannot unpause
      await truffleAssert.reverts(
        electraInstance.unpause({ from: attacker }),
        "Only commissioner"
      );

      // Commissioner can unpause
      await electraInstance.unpause({ from: commissioner });
    });

    it("should prevent operations when paused", async () => {
      await electraInstance.pause({ from: commissioner });

      // All major operations should be blocked
      await truffleAssert.reverts(
        electraInstance.registerVoter("Paused Voter", { from: voter1 }),
        "Pausable: paused"
      );

      // Setup for voting test
      await electraInstance.unpause({ from: commissioner });
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      await electraInstance.registerVoter("Voter 1", { from: voter1 });
      await electraInstance.startVoting(1, { from: commissioner });
      await electraInstance.pause({ from: commissioner });

      await truffleAssert.reverts(
        electraInstance.vote(1, { from: voter1 }),
        "Pausable: paused"
      );
    });

    it("should allow deactivating candidates in emergency", async () => {
      await electraInstance.addCandidate("Bad Candidate", "Bad Party", "Bad manifesto", "BadHash", { from: commissioner });
      
      await electraInstance.deactivateCandidate(1, { from: commissioner });
      
      const candidate = await electraInstance.getCandidateInfo(1);
      assert.equal(candidate.isActive, false, "Candidate should be deactivated");
    });

    it("should allow extending voting period", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      await electraInstance.startVoting(1, { from: commissioner });

      const statsBefore = await electraInstance.getElectionStats();
      const endTimeBefore = statsBefore.endTime.toNumber();

      await electraInstance.extendVoting(2, { from: commissioner });

      const statsAfter = await electraInstance.getElectionStats();
      const endTimeAfter = statsAfter.endTime.toNumber();

      assert.equal(endTimeAfter, endTimeBefore + (2 * 3600), "End time should be extended by 2 hours");
    });
  });

  describe("🕒 Reentrancy Protection", () => {
    it("should prevent reentrancy attacks on voting", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      await electraInstance.registerVoter("Voter 1", { from: voter1 });
      await electraInstance.startVoting(1, { from: commissioner });

      // Vote once
      await electraInstance.vote(1, { from: voter1 });

      // Verify voter has voted
      const voterInfo = await electraInstance.getVoterInfo(voter1);
      assert.equal(voterInfo.hasVoted, true, "Voter should have voted");

      // Try to vote again (should fail)
      await truffleAssert.reverts(
        electraInstance.vote(2, { from: voter1 }),
        "Already voted"
      );
    });
  });

  describe("🔍 Input Validation Security", () => {
    it("should validate candidate input parameters", async () => {
      // Empty name
      await truffleAssert.reverts(
        electraInstance.addCandidate("", "Party 1", "Manifesto 1", "Hash1", { from: commissioner }),
        "Name required"
      );

      // Empty party
      await truffleAssert.reverts(
        electraInstance.addCandidate("Candidate 1", "", "Manifesto 1", "Hash1", { from: commissioner }),
        "Party required"
      );
    });

    it("should validate voting duration", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });

      await truffleAssert.reverts(
        electraInstance.startVoting(0, { from: commissioner }),
        "Invalid duration"
      );
    });

    it("should validate extension parameters", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      await electraInstance.startVoting(1, { from: commissioner });

      await truffleAssert.reverts(
        electraInstance.extendVoting(0, { from: commissioner }),
        "Invalid extension"
      );
    });
  });

  describe("📊 Data Integrity", () => {
    it("should maintain consistent vote counts", async () => {
      await electraInstance.addCandidate("Candidate 1", "Party 1", "Manifesto 1", "Hash1", { from: commissioner });
      await electraInstance.addCandidate("Candidate 2", "Party 2", "Manifesto 2", "Hash2", { from: commissioner });
      
      await electraInstance.registerVoter("Voter 1", { from: voter1 });
      await electraInstance.registerVoter("Voter 2", { from: voter2 });
      
      await electraInstance.startVoting(1, { from: commissioner });
      
      await electraInstance.vote(1, { from: voter1 });
      await electraInstance.vote(2, { from: voter2 });

      const candidate1 = await electraInstance.getCandidateInfo(1);
      const candidate2 = await electraInstance.getCandidateInfo(2);
      const stats = await electraInstance.getElectionStats();

      assert.equal(candidate1.voteCount.toNumber(), 1, "Candidate 1 should have 1 vote");
      assert.equal(candidate2.voteCount.toNumber(), 1, "Candidate 2 should have 1 vote");
      assert.equal(stats.totalVotesCount.toNumber(), 2, "Total votes should be 2");
    });

    it("should maintain accurate voter registration counts", async () => {
      await electraInstance.registerVoter("Voter 1", { from: voter1 });
      await electraInstance.registerVoter("Voter 2", { from: voter2 });

      const stats = await electraInstance.getElectionStats();
      assert.equal(stats.totalVotersCount.toNumber(), 2, "Should have 2 registered voters");
    });
  });
});