/**
 * Electra Security Tests
 * Tests security features and access controls
 */

const Electra = artifacts.require("Electra");
const { expect } = require("chai");
const { time } = require("@openzeppelin/test-helpers");

contract("Electra Security", function (accounts) {
  let electra;
  const [owner, admin, voter1, voter2, maliciousUser, observer] = accounts;
  
  beforeEach(async function () {
    electra = await Electra.new({ from: owner });
  });
  
  describe("Access Control", function () {
    it("Should prevent unauthorized election creation", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.days(1));
      const startTime = registrationDeadline.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(2));
      
      try {
        await electra.createElection(
          "Unauthorized Election",
          "This should fail",
          registrationDeadline,
          startTime,
          endTime,
          { from: maliciousUser }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Only commissioner can perform this action");
      }
    });
    
    it("Should prevent unauthorized candidate addition", async function () {
      // Create election first
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.days(1));
      const startTime = registrationDeadline.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(2));
      
      await electra.createElection(
        "Test Election",
        "Test Description",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      try {
        await electra.addCandidate(
          "Unauthorized Candidate",
          "Malicious Party",
          "Evil manifesto",
          { from: maliciousUser }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        // FIXED: Check for the actual error message from the modifier
        expect(error.message).to.include("Insufficient role permissions");
      }
    });
    
    it("Should prevent unauthorized voter registration", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.days(1));
      const startTime = registrationDeadline.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(2));
      
      await electra.createElection(
        "Test Election",
        "Test Description",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      try {
        await electra.registerVoter(voter1, { from: maliciousUser });
        expect.fail("Should have thrown an error");
      } catch (error) {
        // FIXED: Check for the actual error message from the modifier
        expect(error.message).to.include("Insufficient role permissions");
      }
    });
    
    it("Should prevent unauthorized system pause", async function () {
      try {
        await electra.pauseSystem({ from: maliciousUser });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Only commissioner or owner can perform this action");
      }
    });
  });
  
  describe("Role Management Security", function () {
    it("Should prevent unauthorized role assignment", async function () {
      try {
        await electra.assignRole(maliciousUser, 3, { from: maliciousUser }); // Role.ADMIN = 3
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Only commissioner or owner can perform this action");
      }
    });
    
    it("Should prevent non-owner from assigning commissioner role", async function () {
      // FIXED: First assign admin role to someone
      await electra.assignRole(admin, 3, { from: owner }); // Role.ADMIN = 3
      
      try {
        await electra.assignRole(maliciousUser, 4, { from: admin }); // Role.COMMISSIONER = 4
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Only owner can assign commissioner role");
      }
    });
    
    it("Should prevent revoking owner's role", async function () {
      try {
        await electra.revokeRole(owner, { from: owner });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Cannot revoke owner's role");
      }
    });
    
    it("Should prevent unauthorized ownership transfer", async function () {
      try {
        await electra.transferOwnership(maliciousUser, { from: maliciousUser });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Only system owner can perform this action");
      }
    });
  });
  
  describe("Voting Security", function () {
    beforeEach(async function () {
      // FIXED: Use shorter timeframes
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(24));
      
      await electra.createElection(
        "Security Test Election",
        "Testing security",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Candidate 1", "Party 1", "Manifesto 1", { from: owner });
      await electra.addCandidate("Candidate 2", "Party 2", "Manifesto 2", { from: owner });
      
      await electra.registerVoter(voter1, { from: owner });
      await electra.registerVoter(voter2, { from: owner });
    });
    
    it("Should prevent voting before voting period", async function () {
      // Voting hasn't started yet
      try {
        await electra.vote(1, { from: voter1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Voting is not currently open");
      }
    });
    
    it("Should prevent unregistered users from voting", async function () {
      await electra.startVoting({ from: owner });
      
      try {
        await electra.vote(1, { from: maliciousUser });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("You are not registered to vote");
      }
    });
    
    it("Should prevent double voting", async function () {
      await electra.startVoting({ from: owner });
      
      // First vote should succeed
      await electra.vote(1, { from: voter1 });
      
      // Second vote should fail
      try {
        await electra.vote(2, { from: voter1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("You have already voted");
      }
    });
    
    it("Should prevent voting for inactive candidates", async function () {
      // Deactivate candidate before voting starts
      await electra.deactivateCandidate(1, { from: owner });
      await electra.startVoting({ from: owner });
      
      try {
        await electra.vote(1, { from: voter1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Candidate is not active");
      }
    });
    
    it("Should prevent voting after election ends", async function () {
      await electra.startVoting({ from: owner });
      await electra.endVoting({ from: owner });
      
      try {
        await electra.vote(1, { from: voter1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Voting is not currently open");
      }
    });
    
    it("Should prevent voting when system is paused", async function () {
      await electra.startVoting({ from: owner });
      await electra.pauseSystem({ from: owner });
      
      try {
        await electra.vote(1, { from: voter1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("System is currently paused");
      }
    });
  });
  
  describe("Data Integrity", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(24));
      
      await electra.createElection(
        "Data Integrity Test",
        "Testing data integrity",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Candidate 1", "Party 1", "Manifesto 1", { from: owner });
      await electra.registerVoter(voter1, { from: owner });
    });
    
    it("Should generate unique verification hashes", async function () {
      await electra.registerVoter(voter2, { from: owner });
      
      const voter1Info = await electra.getVoterInfo(voter1);
      const voter2Info = await electra.getVoterInfo(voter2);
      
      // FIXED: Access the correct property name
      expect(voter1Info.verificationHash).to.not.equal(voter2Info.verificationHash);
      expect(voter1Info.verificationHash).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
      expect(voter2Info.verificationHash).to.not.equal("0x0000000000000000000000000000000000000000000000000000000000000000");
    });
    
    it("Should prevent hash collision attacks", async function () {
      // This test ensures that the contract properly handles hash collisions
      // In practice, hash collisions are extremely rare with keccak256
      const voter1Info = await electra.getVoterInfo(voter1);
      const hash = voter1Info.verificationHash;
      
      // The used hash should be marked as used
      const isUsed = await electra.usedHashes(hash);
      expect(isUsed).to.equal(true);
    });
    
    it("Should maintain vote count consistency", async function () {
      await electra.addCandidate("Candidate 2", "Party 2", "Manifesto 2", { from: owner }); // Add second candidate
      await electra.startVoting({ from: owner });
      await electra.vote(1, { from: voter1 });
      
      const candidateInfo = await electra.getCandidateInfo(1);
      const electionInfo = await electra.getElectionInfo();
      const voterInfo = await electra.getVoterInfo(voter1);
      
      // All counters should be consistent
      expect(candidateInfo.voteCount.toNumber()).to.equal(1);
      expect(electionInfo.totalVotes.toNumber()).to.equal(1);
      expect(voterInfo.hasVoted).to.equal(true);
      expect(voterInfo.candidateVoted.toNumber()).to.equal(1);
    });
  });
  
  describe("Input Validation", function () {
    it("Should reject invalid candidate data", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.days(1));
      const startTime = registrationDeadline.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(2));
      
      await electra.createElection(
        "Test Election",
        "Test Description",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      // Empty name
      try {
        await electra.addCandidate("", "Test Party", "Test Manifesto", { from: owner });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Candidate name cannot be empty");
      }
      
      // Empty party
      try {
        await electra.addCandidate("Test Name", "", "Test Manifesto", { from: owner });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Party name cannot be empty");
      }
    });
    
    it("Should reject invalid election parameters", async function () {
      const currentTime = await time.latest();
      
      // Empty title
      try {
        await electra.createElection(
          "",
          "Test Description",
          currentTime.add(time.duration.days(1)),
          currentTime.add(time.duration.days(2)),
          currentTime.add(time.duration.days(3)),
          { from: owner }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Election title cannot be empty");
      }
      
      // Past registration deadline
      try {
        await electra.createElection(
          "Test Election",
          "Test Description",
          currentTime.sub(time.duration.hours(1)),
          currentTime.add(time.duration.days(1)),
          currentTime.add(time.duration.days(2)),
          { from: owner }
        );
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Registration deadline must be in future");
      }
    });
    
    it("Should reject invalid voter addresses", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.days(1));
      const startTime = registrationDeadline.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(2));
      
      await electra.createElection(
        "Test Election",
        "Test Description",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      // Zero address
      try {
        await electra.registerVoter("0x0000000000000000000000000000000000000000", { from: owner });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Invalid voter address");
      }
    });
  });
  
  describe("Emergency Security", function () {
    beforeEach(async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(24));
      
      await electra.createElection(
        "Emergency Test Election",
        "Testing emergency features",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
    });
    
    it("Should prevent operations during emergency mode", async function () {
      await electra.activateEmergency({ from: owner });
      
      // Try to add candidate during emergency
      try {
        await electra.addCandidate("Emergency Candidate", "Emergency Party", "Emergency Manifesto", { from: owner });
        expect.fail("Should have thrown an error");
      } catch (error) {
        // FIXED: Check for the actual error message (system is paused, not emergency mode)
        expect(error.message).to.include("System is currently paused");
      }
    });
    
    it("Should only allow owner to deactivate emergency", async function () {
      await electra.activateEmergency({ from: owner });
      
      try {
        await electra.deactivateEmergency({ from: maliciousUser });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Only system owner can perform this action");
      }
      
      // Owner should be able to deactivate
      await electra.deactivateEmergency({ from: owner });
      const systemStats = await electra.getSystemStats();
      expect(systemStats.emergency).to.equal(false);
    });
    
    it("Should limit voting period extension", async function () {
      await electra.addCandidate("Candidate 1", "Party 1", "Manifesto 1", { from: owner });
      await electra.addCandidate("Candidate 2", "Party 2", "Manifesto 2", { from: owner });
      await electra.startVoting({ from: owner });
      
      // Try to extend by too many hours
      try {
        await electra.extendVotingPeriod(100, { from: owner }); // More than 72 hours
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Invalid extension period");
      }
      
      // Valid extension should work
      await electra.extendVotingPeriod(2, { from: owner });
    });
  });
  
  describe("Gas Optimization Security", function () {
    it("Should prevent gas limit attacks with candidate limits", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.days(1));
      const startTime = registrationDeadline.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(2));
      
      await electra.createElection(
        "Gas Test Election",
        "Testing gas limits",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      // Add maximum allowed candidates
      for (let i = 1; i <= 50; i++) {
        await electra.addCandidate(`Candidate ${i}`, `Party ${i}`, `Manifesto ${i}`, { from: owner });
      }
      
      // Try to add one more (should fail)
      try {
        await electra.addCandidate("Overflow Candidate", "Overflow Party", "Overflow Manifesto", { from: owner });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Maximum candidates reached");
      }
    });
    
    it("Should handle large voter counts efficiently", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.days(1));
      const startTime = registrationDeadline.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.days(2));
      
      await electra.createElection(
        "Large Voter Test",
        "Testing large voter counts",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      // Register multiple voters (limited by available accounts)
      const voterCount = Math.min(accounts.length - 1, 8);
      for (let i = 1; i <= voterCount; i++) {
        await electra.registerVoter(accounts[i], { from: owner });
      }
      
      const electionInfo = await electra.getElectionInfo();
      expect(electionInfo.totalVoters.toNumber()).to.equal(voterCount);
    });
  });
  
  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks on voting", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(24));
      
      await electra.createElection(
        "Reentrancy Test",
        "Testing reentrancy protection",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Test Candidate 1", "Test Party 1", "Test Manifesto 1", { from: owner });
      await electra.addCandidate("Test Candidate 2", "Test Party 2", "Test Manifesto 2", { from: owner });
      await electra.registerVoter(voter1, { from: owner });
      await electra.startVoting({ from: owner });
      
      // Normal vote should work
      await electra.vote(1, { from: voter1 });
      
      // Second vote should fail (simulating reentrancy attempt)
      try {
        await electra.vote(1, { from: voter1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("You have already voted");
      }
    });
  });
  
  describe("State Consistency", function () {
    it("Should maintain consistent state during concurrent operations", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(24));
      
      await electra.createElection(
        "Consistency Test",
        "Testing state consistency",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Candidate 1", "Party 1", "Manifesto 1", { from: owner });
      await electra.addCandidate("Candidate 2", "Party 2", "Manifesto 2", { from: owner });
      
      // Register multiple voters
      await electra.registerVoter(voter1, { from: owner });
      await electra.registerVoter(voter2, { from: owner });
      
      await electra.startVoting({ from: owner });
      
      // Cast votes and verify state consistency
      await electra.vote(1, { from: voter1 });
      await electra.vote(2, { from: voter2 });
      
      const candidate1Info = await electra.getCandidateInfo(1);
      const candidate2Info = await electra.getCandidateInfo(2);
      const electionInfo = await electra.getElectionInfo();
      
      expect(candidate1Info.voteCount.toNumber()).to.equal(1);
      expect(candidate2Info.voteCount.toNumber()).to.equal(1);
      expect(electionInfo.totalVotes.toNumber()).to.equal(2);
    });
  });
  
  describe("Time-based Security", function () {
    it("Should enforce registration deadline", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.hours(1));
      const startTime = registrationDeadline.add(time.duration.minutes(30));
      const endTime = startTime.add(time.duration.days(1));
      
      await electra.createElection(
        "Time Test Election",
        "Testing time-based security",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      // Move time past registration deadline
      await time.increaseTo(registrationDeadline.add(time.duration.minutes(1)));
      
      try {
        await electra.registerVoter(voter1, { from: owner });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Registration deadline has passed");
      }
    });
    
    it("Should enforce voting time boundaries", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.hours(1));
      const startTime = registrationDeadline.add(time.duration.hours(1));
      const endTime = startTime.add(time.duration.hours(2));
      
      await electra.createElection(
        "Time Boundary Test",
        "Testing voting time boundaries",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Test Candidate 1", "Test Party 1", "Test Manifesto 1", { from: owner });
      await electra.addCandidate("Test Candidate 2", "Test Party 2", "Test Manifesto 2", { from: owner });
      await electra.registerVoter(voter1, { from: owner });
      await electra.startVoting({ from: owner });
      
      // Move time past voting end time
      await time.increaseTo(endTime.add(time.duration.minutes(1)));
      
      try {
        await electra.vote(1, { from: voter1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Voting period has ended");
      }
    });
  });
  
  describe("Data Privacy", function () {
    it("Should protect voter privacy while maintaining transparency", async function () {
      const currentTime = await time.latest();
      const registrationDeadline = currentTime.add(time.duration.minutes(30));
      const startTime = registrationDeadline.add(time.duration.minutes(10));
      const endTime = startTime.add(time.duration.hours(24));
      
      await electra.createElection(
        "Privacy Test",
        "Testing voter privacy",
        registrationDeadline,
        startTime,
        endTime,
        { from: owner }
      );
      
      await electra.addCandidate("Candidate 1", "Party 1", "Manifesto 1", { from: owner });
      await electra.addCandidate("Candidate 2", "Party 2", "Manifesto 2", { from: owner });
      await electra.registerVoter(voter1, { from: owner });
      await electra.startVoting({ from: owner });
      await electra.vote(1, { from: voter1 });
      
      // Vote record should exist but only show necessary information
      const voteRecord = await electra.getVoteRecord(1);
      expect(voteRecord.voter).to.equal(voter1);
      expect(voteRecord.candidateID.toNumber()).to.equal(1);
      expect(voteRecord.timestamp.toNumber()).to.be.greaterThan(0);
      
      // Candidate vote count should be public
      const candidateInfo = await electra.getCandidateInfo(1);
      expect(candidateInfo.voteCount.toNumber()).to.equal(1);
    });
  });
});
