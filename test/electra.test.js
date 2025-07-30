const Electra = artifacts.require("Electra");
const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract("Electra", (accounts) => {
    let electra;
    const [owner, commissioner, admin, voter1, voter2, voter3, observer, unauthorized] = accounts;
    
    // Helper function to get current timestamp
    const getCurrentTimestamp = async () => {
        const block = await web3.eth.getBlock('latest');
        return block.timestamp;
    };
    
    // Helper function to create a future timestamp
    const getFutureTimestamp = async (offsetSeconds) => {
        const current = await getCurrentTimestamp();
        return current + offsetSeconds;
    };
    
    beforeEach(async () => {
        electra = await Electra.new({ from: owner });
    });

    describe("Contract Deployment", () => {
        it("should set the correct owner", async () => {
            const contractOwner = await electra.systemOwner();
            expect(contractOwner).to.equal(owner);
        });

        it("should set owner as commissioner initially", async () => {
            const currentCommissioner = await electra.currentCommissioner();
            expect(currentCommissioner).to.equal(owner);
        });

        it("should assign owner admin role", async () => {
            const hasAdminRole = await electra.checkRole(owner, 3); // Role.ADMIN = 3
            expect(hasAdminRole).to.be.true;
        });
    });

    describe("Role Management", () => {
        describe("Assign Role", () => {
            it("should allow owner to assign commissioner role", async () => {
                const receipt = await electra.assignRole(commissioner, 4, { from: owner }); // Role.COMMISSIONER = 4
                
                expectEvent(receipt, 'RoleAssigned', {
                    user: commissioner,
                    role: '4',
                    assignedBy: owner
                });
                
                expectEvent(receipt, 'CommissionerChanged', {
                    oldCommissioner: owner,
                    newCommissioner: commissioner
                });
                
                const newCommissioner = await electra.currentCommissioner();
                expect(newCommissioner).to.equal(commissioner);
            });

            it("should allow commissioner to assign admin role", async () => {
                await electra.assignRole(commissioner, 4, { from: owner }); // Make commissioner
                
                const receipt = await electra.assignRole(admin, 3, { from: commissioner }); // Role.ADMIN = 3
                
                expectEvent(receipt, 'RoleAssigned', {
                    user: admin,
                    role: '3',
                    assignedBy: commissioner
                });
                
                const hasAdminRole = await electra.checkRole(admin, 3);
                expect(hasAdminRole).to.be.true;
            });

            it("should allow commissioner to assign voter role", async () => {
                await electra.assignRole(commissioner, 4, { from: owner });
                
                const receipt = await electra.assignRole(voter1, 1, { from: commissioner }); // Role.VOTER = 1
                
                expectEvent(receipt, 'RoleAssigned', {
                    user: voter1,
                    role: '1',
                    assignedBy: commissioner
                });
            });

            it("should not allow non-owner to assign commissioner role", async () => {
                await expectRevert(
                    electra.assignRole(commissioner, 4, { from: admin }),
                    "Only owner can assign commissioner"
                );
            });

            it("should not allow unauthorized users to assign roles", async () => {
                await expectRevert(
                    electra.assignRole(voter1, 1, { from: unauthorized }),
                    "Only commissioner or owner"
                );
            });

            it("should not allow assigning NONE role", async () => {
                await expectRevert(
                    electra.assignRole(voter1, 0, { from: owner }), // Role.NONE = 0
                    "Cannot assign NONE"
                );
            });
        });

        describe("Revoke Role", () => {
            beforeEach(async () => {
                await electra.assignRole(commissioner, 4, { from: owner });
                await electra.assignRole(admin, 3, { from: commissioner });
            });

            it("should allow commissioner to revoke roles", async () => {
                const receipt = await electra.revokeRole(admin, { from: commissioner });
                
                expectEvent(receipt, 'RoleRevoked', {
                    user: admin,
                    oldRole: '3',
                    revokedBy: commissioner
                });
                
                const hasRole = await electra.checkRole(admin, 3);
                expect(hasRole).to.be.false;
            });

            it("should not allow revoking owner role", async () => {
                await expectRevert(
                    electra.revokeRole(owner, { from: commissioner }),
                    "Cannot revoke owner"
                );
            });

            it("should not allow revoking commissioner role", async () => {
                await expectRevert(
                    electra.revokeRole(commissioner, { from: owner }),
                    "Cannot revoke commissioner"
                );
            });
        });
    });

    describe("System Controls", () => {
        beforeEach(async () => {
            await electra.assignRole(commissioner, 4, { from: owner });
        });

        it("should allow commissioner to pause system", async () => {
            const receipt = await electra.pauseSystem({ from: commissioner });
            
            expectEvent(receipt, 'SystemPaused', {
                pausedBy: commissioner
            });
            
            const isPaused = await electra.systemPaused();
            expect(isPaused).to.be.true;
        });

        it("should allow commissioner to unpause system", async () => {
            await electra.pauseSystem({ from: commissioner }); // Pause first
            const receipt = await electra.pauseSystem({ from: commissioner }); // Unpause
            
            expectEvent(receipt, 'SystemUnpaused', {
                unpausedBy: commissioner
            });
            
            const isPaused = await electra.systemPaused();
            expect(isPaused).to.be.false;
        });

        it("should activate emergency mode", async () => {
            await electra.activateEmergency({ from: commissioner });
            
            const emergencyMode = await electra.emergencyMode();
            const systemPaused = await electra.systemPaused();
            
            expect(emergencyMode).to.be.true;
            expect(systemPaused).to.be.true;
        });

        it("should allow only owner to deactivate emergency", async () => {
            await electra.activateEmergency({ from: commissioner });
            await electra.deactivateEmergency({ from: owner });
            
            const emergencyMode = await electra.emergencyMode();
            expect(emergencyMode).to.be.false;
        });
    });

    describe("Election Management", () => {
        beforeEach(async () => {
            await electra.assignRole(commissioner, 4, { from: owner });
        });

        describe("Create Election", () => {
            it("should create election with valid parameters", async () => {
                const currentTime = await getCurrentTimestamp();
                const registrationDeadline = currentTime + 3600; // 1 hour
                const startTime = currentTime + 7200; // 2 hours
                const endTime = currentTime + 10800; // 3 hours
                
                const receipt = await electra.createElection(
                    "Test Election",
                    registrationDeadline,
                    startTime,
                    endTime,
                    { from: commissioner }
                );
                
                expectEvent(receipt, 'ElectionCreated', {
                    title: "Test Election",
                    startTime: startTime.toString(),
                    endTime: endTime.toString(),
                    registrationDeadline: registrationDeadline.toString()
                });
                
                const registrationOpen = await electra.registrationOpen();
                expect(registrationOpen).to.be.true;
            });

            it("should not allow creating election with invalid times", async () => {
                const currentTime = await getCurrentTimestamp();
                const pastTime = currentTime - 3600;
                
                await expectRevert(
                    electra.createElection(
                        "Test Election",
                        pastTime, // Past deadline
                        currentTime + 7200,
                        currentTime + 10800,
                        { from: commissioner }
                    ),
                    "Invalid deadline"
                );
            });

            it("should not allow creating election with empty title", async () => {
                const currentTime = await getCurrentTimestamp();
                
                await expectRevert(
                    electra.createElection(
                        "",
                        currentTime + 3600,
                        currentTime + 7200,
                        currentTime + 10800,
                        { from: commissioner }
                    ),
                    "Empty title"
                );
            });
        });

        describe("Start Voting", () => {
            beforeEach(async () => {
                const currentTime = await getCurrentTimestamp();
                await electra.createElection(
                    "Test Election",
                    currentTime + 3600,
                    currentTime + 7200,
                    currentTime + 10800,
                    { from: commissioner }
                );
                
                // Add candidates
                await electra.assignRole(admin, 3, { from: commissioner });
                await electra.addCandidate("Alice", "Party A", { from: admin });
                await electra.addCandidate("Bob", "Party B", { from: admin });
            });

            it("should start voting with sufficient candidates", async () => {
                await electra.startVoting({ from: commissioner });
                
                const votingOpen = await electra.votingOpen();
                const registrationOpen = await electra.registrationOpen();
                
                expect(votingOpen).to.be.true;
                expect(registrationOpen).to.be.false;
            });

            it("should not start voting without enough candidates", async () => {
                // Create new election with no candidates
                const currentTime = await getCurrentTimestamp();
                await electra.createElection(
                    "Test Election 2",
                    currentTime + 3600,
                    currentTime + 7200,
                    currentTime + 10800,
                    { from: commissioner }
                );
                
                await expectRevert(
                    electra.startVoting({ from: commissioner }),
                    "Need at least 2 candidates"
                );
            });
        });
    });

    describe("Candidate Management", () => {
        beforeEach(async () => {
            await electra.assignRole(commissioner, 4, { from: owner });
            await electra.assignRole(admin, 3, { from: commissioner });
            
            const currentTime = await getCurrentTimestamp();
            await electra.createElection(
                "Test Election",
                currentTime + 3600,
                currentTime + 7200,
                currentTime + 10800,
                { from: commissioner }
            );
        });

        it("should allow admin to add candidate", async () => {
            const receipt = await electra.addCandidate("Alice", "Party A", { from: admin });
            
            expectEvent(receipt, 'CandidateAdded', {
                candidateID: '1',
                name: "Alice",
                party: "Party A",
                addedBy: admin
            });
            
            const candidateInfo = await electra.getCandidateInfo(1);
            expect(candidateInfo.name).to.equal("Alice");
            expect(candidateInfo.party).to.equal("Party A");
            expect(candidateInfo.isActive).to.be.true;
        });

        it("should not allow adding candidate with empty name", async () => {
            await expectRevert(
                electra.addCandidate("", "Party A", { from: admin }),
                "Empty name"
            );
        });

        it("should not allow adding candidate with empty party", async () => {
            await expectRevert(
                electra.addCandidate("Alice", "", { from: admin }),
                "Empty party"
            );
        });

        it("should allow commissioner to deactivate candidate", async () => {
            await electra.addCandidate("Alice", "Party A", { from: admin });
            await electra.deactivateCandidate(1, { from: commissioner });
            
            const candidateInfo = await electra.getCandidateInfo(1);
            expect(candidateInfo.isActive).to.be.false;
        });
    });

    describe("Voter Registration", () => {
        beforeEach(async () => {
            await electra.assignRole(commissioner, 4, { from: owner });
            await electra.assignRole(admin, 3, { from: commissioner });
            
            const currentTime = await getCurrentTimestamp();
            await electra.createElection(
                "Test Election",
                currentTime + 3600,
                currentTime + 7200,
                currentTime + 10800,
                { from: commissioner }
            );
        });

        it("should allow admin to register voter", async () => {
            const receipt = await electra.registerVoter(voter1, { from: admin });
            
            expectEvent(receipt, 'VoterRegistered', {
                voter: voter1,
                voterID: '1'
            });
            
            const voterInfo = await electra.getVoterInfo(voter1);
            expect(voterInfo.isRegistered).to.be.true;
            expect(voterInfo.voterID.toString()).to.equal('1');
        });

        it("should allow self registration", async () => {
            const receipt = await electra.selfRegister({ from: voter1 });
            
            expectEvent(receipt, 'VoterRegistered', {
                voter: voter1,
                voterID: '1'
            });
            
            const voterInfo = await electra.getVoterInfo(voter1);
            expect(voterInfo.isRegistered).to.be.true;
        });

        it("should not allow duplicate registration", async () => {
            await electra.registerVoter(voter1, { from: admin });
            
            await expectRevert(
                electra.registerVoter(voter1, { from: admin }),
                "Already registered"
            );
        });

        it("should not allow registration after deadline", async () => {
            // Fast forward past registration deadline
            const currentTime = await getCurrentTimestamp();
            await time.increaseTo(currentTime + 3700); // Past deadline
            
            await expectRevert(
                electra.registerVoter(voter1, { from: admin }),
                "Registration closed"
            );
        });
    });

    describe("Voting Process", () => {
        beforeEach(async () => {
            await electra.assignRole(commissioner, 4, { from: owner });
            await electra.assignRole(admin, 3, { from: commissioner });
            
            const currentTime = await getCurrentTimestamp();
            await electra.createElection(
                "Test Election",
                currentTime + 3600,
                currentTime + 7200,
                currentTime + 10800,
                { from: commissioner }
            );
            
            // Add candidates
            await electra.addCandidate("Alice", "Party A", { from: admin });
            await electra.addCandidate("Bob", "Party B", { from: admin });
            
            // Register voters
            await electra.registerVoter(voter1, { from: admin });
            await electra.registerVoter(voter2, { from: admin });
            
            // Start voting
            await electra.startVoting({ from: commissioner });
        });

        it("should allow registered voter to vote", async () => {
            const receipt = await electra.vote(1, { from: voter1 });
            
            expectEvent(receipt, 'VoteCast', {
                voter: voter1,
                candidateID: '1'
            });
            
            const voterInfo = await electra.getVoterInfo(voter1);
            expect(voterInfo.hasVoted).to.be.true;
            expect(voterInfo.candidateVoted.toString()).to.equal('1');
            
            const candidateInfo = await electra.getCandidateInfo(1);
            expect(candidateInfo.voteCount.toString()).to.equal('1');
        });

        it("should not allow voting twice", async () => {
            await electra.vote(1, { from: voter1 });
            
            await expectRevert(
                electra.vote(2, { from: voter1 }),
                "Already voted"
            );
        });

        it("should not allow unregistered voter to vote", async () => {
            await expectRevert(
                electra.vote(1, { from: voter3 }),
                "Not registered"
            );
        });

        it("should not allow voting for invalid candidate", async () => {
            await expectRevert(
                electra.vote(999, { from: voter1 }),
                "Invalid candidate"
            );
        });
    });

    describe("Election Finalization", () => {
        beforeEach(async () => {
            await electra.assignRole(commissioner, 4, { from: owner });
            await electra.assignRole(admin, 3, { from: commissioner });
            
            const currentTime = await getCurrentTimestamp();
            await electra.createElection(
                "Test Election",
                currentTime + 100,
                currentTime + 200,
                currentTime + 300,
                { from: commissioner }
            );
            
            // Add candidates
            await electra.addCandidate("Alice", "Party A", { from: admin });
            await electra.addCandidate("Bob", "Party B", { from: admin });
            
            // Register and vote
            await electra.registerVoter(voter1, { from: admin });
            await electra.registerVoter(voter2, { from: admin });
            
            await electra.startVoting({ from: commissioner });
            await electra.vote(1, { from: voter1 }); // Vote for Alice
            await electra.vote(1, { from: voter2 }); // Vote for Alice
            
            await electra.endVoting({ from: commissioner });
        });

        it("should finalize election and determine winner", async () => {
            // Fast forward past election end time
            const currentTime = await getCurrentTimestamp();
            await time.increaseTo(currentTime + 400);
            
            const receipt = await electra.finalizeElection({ from: commissioner });
            
            expectEvent(receipt, 'ElectionFinalized', {
                winnerID: '1',
                winnerName: "Alice",
                totalVotes: '2'
            });
            
            const electionInfo = await electra.getElectionInfo();
            expect(electionInfo.isFinalized).to.be.true;
            expect(electionInfo.winnerID.toString()).to.equal('1');
        });

        it("should get current winner before finalization", async () => {
            const winner = await electra.getCurrentWinner();
            expect(winner.winnerID.toString()).to.equal('1');
            expect(winner.winnerName).to.equal("Alice");
            expect(winner.maxVotes.toString()).to.equal('2');
        });

        it("should not finalize election without votes", async () => {
            // Create new election with no votes
            const currentTime = await getCurrentTimestamp();
            await electra.createElection(
                "Empty Election",
                currentTime + 100,
                currentTime + 200,
                currentTime + 300,
                { from: commissioner }
            );
            
            await electra.addCandidate("Charlie", "Party C", { from: admin });
            await electra.addCandidate("Dave", "Party D", { from: admin });
            await electra.startVoting({ from: commissioner });
            await electra.endVoting({ from: commissioner });
            
            await expectRevert(
                electra.finalizeElection({ from: commissioner }),
                "No votes"
            );
        });
    });

    describe("View Functions", () => {
        beforeEach(async () => {
            await electra.assignRole(commissioner, 4, { from: owner });
            await electra.assignRole(admin, 3, { from: commissioner });
            
            const currentTime = await getCurrentTimestamp();
            await electra.createElection(
                "Test Election",
                currentTime + 3600,
                currentTime + 7200,
                currentTime + 10800,
                { from: commissioner }
            );
        });

        it("should return correct election info", async () => {
            const electionInfo = await electra.getElectionInfo();
            expect(electionInfo.title).to.equal("Test Election");
            expect(electionInfo.isActive).to.be.true;
            expect(electionInfo.isFinalized).to.be.false;
        });

        it("should return correct election status", async () => {
            const status = await electra.getElectionStatus();
            expect(status.registrationActive).to.be.true;
            expect(status.votingActive).to.be.false;
        });

        it("should check roles correctly", async () => {
            const isAdmin = await electra.checkRole(admin, 3);
            expect(isAdmin).to.be.true;
            
            const isVoter = await electra.checkRole(admin, 1);
            expect(isVoter).to.be.false;
        });
    });

    describe("Edge Cases and Security", () => {
        beforeEach(async () => {
            await electra.assignRole(commissioner, 4, { from: owner });
        });

        it("should prevent operations when system is paused", async () => {
            await electra.pauseSystem({ from: commissioner });
            
            const currentTime = await getCurrentTimestamp();
            await expectRevert(
                electra.createElection(
                    "Test Election",
                    currentTime + 3600,
                    currentTime + 7200,
                    currentTime + 10800,
                    { from: commissioner }
                ),
                "System paused"
            );
        });

        it("should handle maximum candidates limit", async () => {
            await electra.assignRole(admin, 3, { from: commissioner });
            
            const currentTime = await getCurrentTimestamp();
            await electra.createElection(
                "Test Election",
                currentTime + 3600,
                currentTime + 7200,
                currentTime + 10800,
                { from: commissioner }
            );
            
            // Add maximum candidates (50)
            for (let i = 1; i <= 50; i++) {
                await electra.addCandidate(`Candidate ${i}`, `Party ${i}`, { from: admin });
            }
            
            // Try to add one more
            await expectRevert(
                electra.addCandidate("Extra Candidate", "Extra Party", { from: admin }),
                "Max candidates reached"
            );
        });

        it("should prevent voting on deactivated candidates", async () => {
            await electra.assignRole(admin, 3, { from: commissioner });
            
            const currentTime = await getCurrentTimestamp();
            await electra.createElection(
                "Test Election",
                currentTime + 3600,
                currentTime + 7200,
                currentTime + 10800,
                { from: commissioner }
            );
            
            await electra.addCandidate("Alice", "Party A", { from: admin });
            await electra.addCandidate("Bob", "Party B", { from: admin });
            await electra.deactivateCandidate(1, { from: commissioner });
            
            await electra.registerVoter(voter1, { from: admin });
            await electra.startVoting({ from: commissioner });
            
            await expectRevert(
                electra.vote(1, { from: voter1 }),
                "Candidate inactive"
            );
        });
    });
});