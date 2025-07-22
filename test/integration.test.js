const Electra = artifacts.require("Electra");
const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');

contract("Electra Integration Tests", (accounts) => {
    let electra;
    const [owner, commissioner, admin1, admin2, voter1, voter2, voter3, voter4, voter5, observer] = accounts;
    
    // Role enum values
    const Role = {
        NONE: 0,
        VOTER: 1,
        OBSERVER: 2,
        ADMIN: 3,
        COMMISSIONER: 4
    };

    beforeEach(async () => {
        electra = await Electra.new({ from: owner });
    });

    describe("Complete Election Workflow", () => {
        it("should handle full election lifecycle successfully", async () => {
            // Step 1: Setup roles
            await electra.assignRole(commissioner, Role.COMMISSIONER, { from: owner });
            await electra.assignRole(admin1, Role.ADMIN, { from: owner });
            await electra.assignRole(admin2, Role.ADMIN, { from: owner });
            
            // Verify role assignments
            let stats = await electra.getSystemStats();
            assert.equal(stats.admins.toNumber(), 2);

            // Step 2: Create election
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.minutes(30)),
                start: currentTime.add(time.duration.hours(1)),
                end: currentTime.add(time.duration.hours(3))
            };

            await electra.createElection(
                "Presidential Election 2024",
                "National presidential election",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: commissioner }
            );

            const electionInfo = await electra.getElectionInfo();
            assert.equal(electionInfo.title, "Presidential Election 2024");
            assert.equal(electionInfo.isActive, true);

            // Step 3: Add candidates (by different admins)
            await electra.addCandidate(
                "Alice Johnson",
                "Democratic Party",
                "Healthcare and education reform",
                { from: admin1 }
            );

            await electra.addCandidate(
                "Bob Smith",
                "Republican Party",
                "Economic growth and security",
                { from: admin2 }
            );

            await electra.addCandidate(
                "Charlie Brown",
                "Independent",
                "Environmental protection",
                { from: commissioner }
            );

            const allCandidates = await electra.getAllCandidates();
            assert.equal(allCandidates.names.length, 3);
            assert.equal(allCandidates.names[0], "Alice Johnson");
            assert.equal(allCandidates.names[1], "Bob Smith");
            assert.equal(allCandidates.names[2], "Charlie Brown");

            // Step 4: Register voters
            const voters = [voter1, voter2, voter3, voter4, voter5];
            for (let i = 0; i < voters.length; i++) {
                await electra.assignRole(voters[i], Role.VOTER, { from: commissioner });
                await electra.registerVoter(voters[i], { from: admin1 });
            }

            // Allow self-registration for one voter
            await electra.selfRegister({ from: observer });

            // Verify voter registration
            const finalElectionInfo = await electra.getElectionInfo();
            assert.equal(finalElectionInfo.totalVoters.toNumber(), 6);

            // Step 5: Start voting
            await electra.startVoting({ from: commissioner });
            
            const status = await electra.getElectionStatus();
            assert.equal(status.votingActive, true);
            assert.equal(status.registrationActive, false);

            // Step 6: Cast votes
            await electra.vote(1, { from: voter1 }); // Alice
            await electra.vote(1, { from: voter2 }); // Alice
            await electra.vote(2, { from: voter3 }); // Bob
            await electra.vote(1, { from: voter4 }); // Alice
            await electra.vote(3, { from: voter5 }); // Charlie
            await electra.vote(2, { from: observer }); // Bob

            // Verify votes
            const candidate1 = await electra.getCandidateInfo(1);
            const candidate2 = await electra.getCandidateInfo(2);
            const candidate3 = await electra.getCandidateInfo(3);
            
            assert.equal(candidate1.voteCount.toNumber(), 3); // Alice
            assert.equal(candidate2.voteCount.toNumber(), 2); // Bob
            assert.equal(candidate3.voteCount.toNumber(), 1); // Charlie

            // Step 7: End voting
            await electra.endVoting({ from: commissioner });
            
            const endedStatus = await electra.getElectionStatus();
            assert.equal(endedStatus.votingActive, false);

            // Step 8: Check current winner before finalization
            const currentWinner = await electra.getCurrentWinner();
            assert.equal(currentWinner.winnerID.toNumber(), 1);
            assert.equal(currentWinner.winnerName, "Alice Johnson");
            assert.equal(currentWinner.maxVotes.toNumber(), 3);
            assert.equal(currentWinner.isTie, false);

            // Step 9: Finalize election
            await electra.finalizeElection({ from: commissioner });

            const finalizedElection = await electra.getElectionInfo();
            assert.equal(finalizedElection.isFinalized, true);
            assert.equal(finalizedElection.winnerID.toNumber(), 1);
            assert.equal(finalizedElection.totalVotes.toNumber(), 6);

            // Step 10: Verify election statistics
            const electionStats = await electra.getElectionStatistics();
            assert.equal(electionStats.totalRegisteredVoters.toNumber(), 6);
            assert.equal(electionStats.totalVotesCast.toNumber(), 6);
            assert.equal(electionStats.voterTurnoutPercentage.toNumber(), 100);
            assert.equal(electionStats.hasWinner, true);
            assert.equal(electionStats.electionComplete, true);
        });

        it("should handle tie scenarios correctly", async () => {
            // Setup election
            await electra.assignRole(commissioner, Role.COMMISSIONER, { from: owner });
            
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.minutes(30)),
                start: currentTime.add(time.duration.hours(1)),
                end: currentTime.add(time.duration.hours(3))
            };

            await electra.createElection(
                "Tie Test Election",
                "Testing tie scenarios",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: commissioner }
            );

            // Add candidates
            await electra.addCandidate("Candidate A", "Party A", "Manifesto A", { from: commissioner });
            await electra.addCandidate("Candidate B", "Party B", "Manifesto B", { from: commissioner });

            // Register voters
            await electra.registerVoter(voter1, { from: commissioner });
            await electra.registerVoter(voter2, { from: commissioner });
            await electra.assignRole(voter1, Role.VOTER, { from: commissioner });
            await electra.assignRole(voter2, Role.VOTER, { from: commissioner });

            // Start voting
            await electra.startVoting({ from: commissioner });

            // Create tie scenario
            await electra.vote(1, { from: voter1 }); // Candidate A
            await electra.vote(2, { from: voter2 }); // Candidate B

            // Check for tie
            const currentWinner = await electra.getCurrentWinner();
            assert.equal(currentWinner.isTie, true);
            assert.equal(currentWinner.maxVotes.toNumber(), 1);

            // End and finalize
            await electra.endVoting({ from: commissioner });
            await electra.finalizeElection({ from: commissioner });

            const finalizedElection = await electra.getElectionInfo();
            assert.equal(finalizedElection.isFinalized, true);
        });
    });

    describe("Role-Based Access Control Workflows", () => {
        it("should manage complex role hierarchies and permissions", async () => {
            // Step 1: Owner assigns commissioner
            await electra.assignRole(commissioner, Role.COMMISSIONER, { from: owner });
            
            // Step 2: Commissioner assigns admins
            await electra.assignRole(admin1, Role.ADMIN, { from: commissioner });
            await electra.assignRole(admin2, Role.ADMIN, { from: commissioner });

            // Step 3: Create election (commissioner only)
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };

            await electra.createElection(
                "Role Test Election",
                "Testing role permissions",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: commissioner }
            );

            // Step 4: Admins can add candidates
            await electra.addCandidate("Admin1 Candidate", "Party X", "Manifesto", { from: admin1 });
            await electra.addCandidate("Admin2 Candidate", "Party Y", "Manifesto", { from: admin2 });

            // Step 5: Commissioner can add candidates too
            await electra.addCandidate("Commissioner Candidate", "Party Z", "Manifesto", { from: commissioner });

            // Step 6: Admins can register voters
            await electra.assignRole(voter1, Role.VOTER, { from: commissioner });
            await electra.assignRole(voter2, Role.VOTER, { from: commissioner });
            await electra.registerVoter(voter1, { from: admin1 });
            await electra.registerVoter(voter2, { from: admin2 });

            // Step 7: Only commissioner can start voting
            await expectRevert(
                electra.startVoting({ from: admin1 }),
                "Only commissioner can perform this action"
            );

            await electra.startVoting({ from: commissioner });

            // Step 8: Voters can vote
            await electra.vote(1, { from: voter1 });
            await electra.vote(2, { from: voter2 });

            // Step 9: Only commissioner can end and finalize
            await electra.endVoting({ from: commissioner });
            await electra.finalizeElection({ from: commissioner });

            // Verify final state
            const electionInfo = await electra.getElectionInfo();
            assert.equal(electionInfo.isFinalized, true);
        });

        it("should handle role changes during election lifecycle", async () => {
            // Setup initial roles
            await electra.assignRole(admin1, Role.ADMIN, { from: owner });

            // Create election
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };

            await electra.createElection(
                "Role Change Test",
                "Testing role changes",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );

            // Admin adds candidate
            await electra.addCandidate("Test Candidate", "Test Party", "Test Manifesto", { from: admin1 });
            await electra.addCandidate("Test Candidate 2", "Test Party 2", "Test Manifesto 2", { from: admin1 });

            // Change admin to voter role
            await electra.revokeRole(admin1, { from: owner });
            await electra.assignRole(admin1, Role.VOTER, { from: owner });

            // Former admin can now be registered as voter
            await electra.registerVoter(admin1, { from: owner });

            // Start voting and let former admin vote
            await electra.startVoting({ from: owner });
            await electra.vote(1, { from: admin1 });

            // Verify vote was cast
            const voterInfo = await electra.getVoterInfo(admin1);
            assert.equal(voterInfo.hasVoted, true);
        });
    });

    describe("Emergency and System Control Workflows", () => {
        it("should handle emergency scenarios during active election", async () => {
            // Setup election
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };

            await electra.createElection(
                "Emergency Test Election",
                "Testing emergency controls",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );

            // Add candidates and voters
            await electra.addCandidate("Candidate 1", "Party A", "Manifesto", { from: owner });
            await electra.addCandidate("Candidate 2", "Party B", "Manifesto", { from: owner });
            
            await electra.assignRole(voter1, Role.VOTER, { from: owner });
            await electra.registerVoter(voter1, { from: owner });

            // Start voting
            await electra.startVoting({ from: owner });

            // Cast some votes
            await electra.vote(1, { from: voter1 });

            // Emergency scenario: Extend voting period
            await electra.extendVotingPeriod(2, { from: owner });

            // Emergency scenario: Activate emergency mode
            await electra.activateEmergency({ from: owner });

            // System should be paused
            const systemStats = await electra.getSystemStats();
            assert.equal(systemStats.paused, true);
            assert.equal(systemStats.emergency, true);

            // Emergency reset
            await electra.emergencyResetElection({ from: owner });

            const electionInfo = await electra.getElectionInfo();
            assert.equal(electionInfo.isActive, false);

            // Deactivate emergency
            await electra.deactivateEmergency({ from: owner });
            await electra.unpauseSystem({ from: owner });

            const finalStats = await electra.getSystemStats();
            assert.equal(finalStats.paused, false);
            assert.equal(finalStats.emergency, false);
        });

        it("should handle system pause during different election phases", async () => {
            // Create election
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };

            await electra.createElection(
                "Pause Test Election",
                "Testing system pause",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );

            // Pause during registration phase
            await electra.pauseSystem({ from: owner });

            // Should prevent role assignments
            await expectRevert(
                electra.assignRole(voter1, Role.VOTER, { from: owner }),
                "System is currently paused"
            );

            // Should prevent candidate addition
            await expectRevert(
                electra.addCandidate("Test", "Party", "Manifesto", { from: owner }),
                "System is currently paused"
            );

            // Unpause and continue
            await electra.unpauseSystem({ from: owner });

            // Now operations should work
            await electra.addCandidate("Candidate 1", "Party A", "Manifesto", { from: owner });
            await electra.addCandidate("Candidate 2", "Party B", "Manifesto", { from: owner });
            await electra.assignRole(voter1, Role.VOTER, { from: owner });
            await electra.registerVoter(voter1, { from: owner });

            // Start voting
            await electra.startVoting({ from: owner });

            // Pause during voting phase
            await electra.pauseSystem({ from: owner });

            // Should prevent voting
            await expectRevert(
                electra.vote(1, { from: voter1 }),
                "System is currently paused"
            );

            // Unpause and allow voting
            await electra.unpauseSystem({ from: owner });
            await electra.vote(1, { from: voter1 });

            // Verify vote was cast
            const voterInfo = await electra.getVoterInfo(voter1);
            assert.equal(voterInfo.hasVoted, true);
        });
    });

    describe("Large Scale Election Simulation", () => {
        it("should handle election with maximum candidates and multiple voters", async () => {
            // Create election
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };

            await electra.createElection(
                "Large Scale Election",
                "Testing with many candidates",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );

            // Add multiple candidates (testing up to limit)
            const candidateCount = 10; // Using 10 for test efficiency
            for (let i = 1; i <= candidateCount; i++) {
                await electra.addCandidate(
                    `Candidate ${i}`,
                    `Party ${i}`,
                    `Manifesto for candidate ${i}`,
                    { from: owner }
                );
            }

            // Register multiple voters
            const voterAddresses = accounts.slice(1, 8); // Use 7 voters
            for (let i = 0; i < voterAddresses.length; i++) {
                await electra.assignRole(voterAddresses[i], Role.VOTER, { from: owner });
                await electra.registerVoter(voterAddresses[i], { from: owner });
            }

            // Start voting
            await electra.startVoting({ from: owner });

            // Cast votes (distribute across candidates)
            for (let i = 0; i < voterAddresses.length; i++) {
                const candidateID = (i % candidateCount) + 1; // Distribute votes
                await electra.vote(candidateID, { from: voterAddresses[i] });
            }

            // Get all candidates and verify votes
            const allCandidates = await electra.getAllCandidates();
            assert.equal(allCandidates.names.length, candidateCount);

            let totalVotes = 0;
            for (let i = 0; i < candidateCount; i++) {
                totalVotes += allCandidates.voteCounts[i].toNumber();
            }
            assert.equal(totalVotes, voterAddresses.length);

            // End and finalize election
            await electra.endVoting({ from: owner });
            await electra.finalizeElection({ from: owner });

            // Verify statistics
            const stats = await electra.getElectionStatistics();
            assert.equal(stats.totalVotesCast.toNumber(), voterAddresses.length);
            assert.equal(stats.activeCandidates.toNumber(), candidateCount);
            assert.equal(stats.electionComplete, true);
        });
    });

    describe("Edge Cases and Error Scenarios", () => {
        it("should handle multiple election cycles", async () => {
            // First election cycle
            const currentTime1 = await time.latest();
            const futureTime1 = {
                registration: currentTime1.add(time.duration.minutes(30)),
                start: currentTime1.add(time.duration.hours(1)),
                end: currentTime1.add(time.duration.hours(2))
            };

            await electra.createElection(
                "Election 1",
                "First election",
                futureTime1.registration,
                futureTime1.start,
                futureTime1.end,
                { from: owner }
            );

            await electra.addCandidate("Alice", "Party A", "Manifesto", { from: owner });
            await electra.addCandidate("Bob", "Party B", "Manifesto", { from: owner });
            
            await electra.assignRole(voter1, Role.VOTER, { from: owner });
            await electra.registerVoter(voter1, { from: owner });
            
            await electra.startVoting({ from: owner });
            await electra.vote(1, { from: voter1 });
            await electra.endVoting({ from: owner });
            await electra.finalizeElection({ from: owner });

            // Verify first election is finalized
            let electionInfo = await electra.getElectionInfo();
            assert.equal(electionInfo.isFinalized, true);
            assert.equal(electionInfo.isActive, false);

            // Should be able to create second election after first is finalized
            const currentTime2 = await time.latest();
            const futureTime2 = {
                registration: currentTime2.add(time.duration.minutes(30)),
                start: currentTime2.add(time.duration.hours(1)),
                end: currentTime2.add(time.duration.hours(2))
            };

            await electra.createElection(
                "Election 2",
                "Second election",
                futureTime2.registration,
                futureTime2.start,
                futureTime2.end,
                { from: owner }
            );

            electionInfo = await electra.getElectionInfo();
            assert.equal(electionInfo.title, "Election 2");
            assert.equal(electionInfo.isActive, true);
            assert.equal(electionInfo.isFinalized, false);
        });

        it("should prevent operations on finalized elections", async () => {
            // Create and complete an election
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.minutes(30)),
                start: currentTime.add(time.duration.hours(1)),
                end: currentTime.add(time.duration.hours(2))
            };

            await electra.createElection(
                "Test Election",
                "Description",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );

            await electra.addCandidate("Candidate 1", "Party A", "Manifesto", { from: owner });
            await electra.addCandidate("Candidate 2", "Party B", "Manifesto", { from: owner });
            
            await electra.assignRole(voter1, Role.VOTER, { from: owner });
            await electra.registerVoter(voter1, { from: owner });
            
            await electra.startVoting({ from: owner });
            await electra.vote(1, { from: voter1 });
            await electra.endVoting({ from: owner });
            await electra.finalizeElection({ from: owner });

            // Now try operations that should fail on finalized election
            await expectRevert(
                electra.addCandidate("New Candidate", "New Party", "New Manifesto", { from: owner }),
                "Election has been finalized"
            );

            await expectRevert(
                electra.registerVoter(voter2, { from: owner }),
                "Election has been finalized"
            );

            await expectRevert(
                electra.startVoting({ from: owner }),
                "Election has been finalized"
            );
        });

        it("should handle vote verification and transparency features", async () => {
            // Setup election
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.minutes(30)),
                start: currentTime.add(time.duration.hours(1)),
                end: currentTime.add(time.duration.hours(2))
            };

            await electra.createElection(
                "Verification Test",
                "Testing vote verification",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );

            await electra.addCandidate("Candidate 1", "Party A", "Manifesto", { from: owner });
            await electra.addCandidate("Candidate 2", "Party B", "Manifesto", { from: owner });
            
            await electra.assignRole(voter1, Role.VOTER, { from: owner });
            await electra.assignRole(voter2, Role.VOTER, { from: owner });
            await electra.registerVoter(voter1, { from: owner });
            await electra.registerVoter(voter2, { from: owner });

            // Get verification hashes before voting
            const voter1Info = await electra.getVoterInfo(voter1);
            const voter2Info = await electra.getVoterInfo(voter2);

            await electra.startVoting({ from: owner });

            // Cast votes
            await electra.vote(1, { from: voter1 });
            await electra.vote(2, { from: voter2 });

            // Verify votes using verification hashes
            const isVoter1Valid = await electra.verifyVote(voter1, voter1Info.verificationHash);
            const isVoter2Valid = await electra.verifyVote(voter2, voter2Info.verificationHash);

            assert.equal(isVoter1Valid, true);
            assert.equal(isVoter2Valid, true);

            // Check vote records
            const voteRecord1 = await electra.getVoteRecord(1);
            const voteRecord2 = await electra.getVoteRecord(2);

            assert.equal(voteRecord1.voter, voter1);
            assert.equal(voteRecord1.candidateID.toNumber(), 1);
            assert.equal(voteRecord2.voter, voter2);
            assert.equal(voteRecord2.candidateID.toNumber(), 2);

            // Test invalid verification
            const invalidHash = "0x1234567890123456789012345678901234567890123456789012345678901234";
            const isInvalidValid = await electra.verifyVote(voter1, invalidHash);
            assert.equal(isInvalidValid, false);
        });
    });

    describe("Performance and Gas Optimization Tests", () => {
        it("should efficiently handle batch operations", async () => {
            // Create election
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };

            await electra.createElection(
                "Batch Test Election",
                "Testing batch operations",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );

            // Batch add candidates
            const candidatePromises = [];
            for (let i = 1; i <= 5; i++) {
                candidatePromises.push(
                    electra.addCandidate(
                        `Candidate ${i}`,
                        `Party ${i}`,
                        `Manifesto ${i}`,
                        { from: owner }
                    )
                );
            }
            await Promise.all(candidatePromises);

            // Batch register voters
            const voterPromises = [];
            const testVoters = accounts.slice(1, 6);
            for (let i = 0; i < testVoters.length; i++) {
                voterPromises.push(electra.assignRole(testVoters[i], Role.VOTER, { from: owner }));
            }
            await Promise.all(voterPromises);

            const registrationPromises = [];
            for (let i = 0; i < testVoters.length; i++) {
                registrationPromises.push(electra.registerVoter(testVoters[i], { from: owner }));
            }
            await Promise.all(registrationPromises);

            // Start voting and batch vote
            await electra.startVoting({ from: owner });

            const votePromises = [];
            for (let i = 0; i < testVoters.length; i++) {
                const candidateID = (i % 5) + 1;
                votePromises.push(electra.vote(candidateID, { from: testVoters[i] }));
            }
            await Promise.all(votePromises);

            // Verify all operations completed successfully
            const electionStats = await electra.getElectionStatistics();
            assert.equal(electionStats.totalVotesCast.toNumber(), testVoters.length);
            assert.equal(electionStats.activeCandidates.toNumber(), 5);

            await electra.endVoting({ from: owner });
            await electra.finalizeElection({ from: owner });

            const finalElectionInfo = await electra.getElectionInfo();
            assert.equal(finalElectionInfo.isFinalized, true);
        });
    });
});
