const Electra = artifacts.require("Electra");
const { expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
const { assert, expect } = require('chai');

contract("Electra Unit Tests", (accounts) => {
    let electra;
    const [owner, commissioner, admin, voter1, voter2, voter3, observer, unauthorized] = accounts;
    
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

    describe("Contract Initialization", () => {
        it("should set correct initial values", async () => {
            const systemOwner = await electra.systemOwner();
            const currentCommissioner = await electra.currentCommissioner();
            const nextVoterID = await electra.nextVoterID();
            const nextVoteRecord = await electra.nextVoteRecord();
            
            assert.equal(systemOwner, owner, "System owner should be deployer");
            assert.equal(currentCommissioner, owner, "Commissioner should be deployer");
            assert.equal(nextVoterID.toNumber(), 1, "Next voter ID should be 1");
            assert.equal(nextVoteRecord.toNumber(), 1, "Next vote record should be 1");
        });

        it("should assign owner as commissioner with correct role", async () => {
            const userInfo = await electra.getUserInfo(owner);
            assert.equal(userInfo.role.toNumber(), Role.COMMISSIONER, "Owner should have commissioner role");
            assert.equal(userInfo.isActive, true, "Owner should be active");
        });
    });

    describe("Access Control", () => {
        describe("Role Assignment", () => {
            it("should allow owner to assign commissioner role", async () => {
                const tx = await electra.assignRole(commissioner, Role.COMMISSIONER, { from: owner });
                
                expectEvent(tx, 'RoleAssigned', {
                    user: commissioner,
                    role: Role.COMMISSIONER.toString(),
                    assignedBy: owner
                });

                const userInfo = await electra.getUserInfo(commissioner);
                assert.equal(userInfo.role.toNumber(), Role.COMMISSIONER);
                assert.equal(userInfo.isActive, true);
            });

            it("should allow commissioner to assign admin role", async () => {
                await electra.assignRole(commissioner, Role.COMMISSIONER, { from: owner });
                const tx = await electra.assignRole(admin, Role.ADMIN, { from: commissioner });
                
                expectEvent(tx, 'RoleAssigned', {
                    user: admin,
                    role: Role.ADMIN.toString(),
                    assignedBy: commissioner
                });
            });

            it("should allow commissioner to assign voter role", async () => {
                const tx = await electra.assignRole(voter1, Role.VOTER, { from: owner });
                
                expectEvent(tx, 'RoleAssigned', {
                    user: voter1,
                    role: Role.VOTER.toString(),
                    assignedBy: owner
                });
            });

            it("should prevent non-owner from assigning commissioner role", async () => {
                await expectRevert(
                    electra.assignRole(admin, Role.COMMISSIONER, { from: admin }),
                    "Only owner can assign commissioner role"
                );
            });

            it("should prevent assigning NONE role", async () => {
                await expectRevert(
                    electra.assignRole(voter1, Role.NONE, { from: owner }),
                    "Cannot assign NONE role"
                );
            });

            it("should prevent unauthorized users from assigning roles", async () => {
                await expectRevert(
                    electra.assignRole(voter1, Role.VOTER, { from: unauthorized }),
                    "Only commissioner or owner can perform this action"
                );
            });
        });

        describe("Role Revocation", () => {
            beforeEach(async () => {
                await electra.assignRole(admin, Role.ADMIN, { from: owner });
                await electra.assignRole(voter1, Role.VOTER, { from: owner });
            });

            it("should allow revoking user roles", async () => {
                const tx = await electra.revokeRole(voter1, { from: owner });
                
                expectEvent(tx, 'RoleRevoked', {
                    user: voter1,
                    oldRole: Role.VOTER.toString(),
                    revokedBy: owner
                });

                const userInfo = await electra.getUserInfo(voter1);
                assert.equal(userInfo.role.toNumber(), Role.NONE);
                assert.equal(userInfo.isActive, false);
            });

            it("should prevent revoking owner's role", async () => {
                await expectRevert(
                    electra.revokeRole(owner, { from: owner }),
                    "Cannot revoke owner's role"
                );
            });

            it("should prevent revoking commissioner's role", async () => {
                await expectRevert(
                    electra.revokeRole(owner, { from: owner }),
                    "Cannot revoke commissioner's role"
                );
            });
        });

        describe("User Management", () => {
            beforeEach(async () => {
                await electra.assignRole(voter1, Role.VOTER, { from: owner });
            });

            it("should allow deactivating users", async () => {
                await electra.deactivateUser(voter1, { from: owner });
                const userInfo = await electra.getUserInfo(voter1);
                assert.equal(userInfo.isActive, false);
            });

            it("should allow reactivating users", async () => {
                await electra.deactivateUser(voter1, { from: owner });
                await electra.reactivateUser(voter1, { from: owner });
                const userInfo = await electra.getUserInfo(voter1);
                assert.equal(userInfo.isActive, true);
            });

            it("should prevent deactivating owner", async () => {
                await expectRevert(
                    electra.deactivateUser(owner, { from: owner }),
                    "Cannot deactivate owner"
                );
            });
        });

        describe("System Controls", () => {
            it("should allow pausing system", async () => {
                const tx = await electra.pauseSystem({ from: owner });
                
                expectEvent(tx, 'SystemPaused', {
                    pausedBy: owner
                });

                const systemPaused = await electra.systemPaused();
                assert.equal(systemPaused, true);
            });

            it("should allow unpausing system", async () => {
                await electra.pauseSystem({ from: owner });
                const tx = await electra.unpauseSystem({ from: owner });
                
                expectEvent(tx, 'SystemUnpaused', {
                    unpausedBy: owner
                });

                const systemPaused = await electra.systemPaused();
                assert.equal(systemPaused, false);
            });

            it("should allow activating emergency mode", async () => {
                const tx = await electra.activateEmergency({ from: owner });
                
                expectEvent(tx, 'EmergencyActivated', {
                    activatedBy: owner
                });

                const emergencyMode = await electra.emergencyMode();
                const systemPaused = await electra.systemPaused();
                assert.equal(emergencyMode, true);
                assert.equal(systemPaused, true);
            });

            it("should prevent non-authorized users from system controls", async () => {
                await expectRevert(
                    electra.pauseSystem({ from: unauthorized }),
                    "Only commissioner or owner can perform this action"
                );
            });
        });
    });

    describe("Election Management", () => {
        let futureTime;

        beforeEach(async () => {
            const currentTime = await time.latest();
            futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };
        });

        describe("Election Creation", () => {
            it("should allow commissioner to create election", async () => {
                const tx = await electra.createElection(
                    "Test Election",
                    "A test election",
                    futureTime.registration,
                    futureTime.start,
                    futureTime.end,
                    { from: owner }
                );

                expectEvent(tx, 'ElectionCreated', {
                    title: "Test Election",
                    startTime: futureTime.start,
                    endTime: futureTime.end,
                    registrationDeadline: futureTime.registration
                });

                const electionInfo = await electra.getElectionInfo();
                assert.equal(electionInfo.title, "Test Election");
                assert.equal(electionInfo.isActive, true);
                assert.equal(electionInfo.isFinalized, false);
            });

            it("should prevent creating election with empty title", async () => {
                await expectRevert(
                    electra.createElection(
                        "",
                        "Description",
                        futureTime.registration,
                        futureTime.start,
                        futureTime.end,
                        { from: owner }
                    ),
                    "Election title cannot be empty"
                );
            });

            it("should prevent creating election with invalid times", async () => {
                const currentTime = await time.latest();
                
                await expectRevert(
                    electra.createElection(
                        "Test",
                        "Description",
                        currentTime.sub(time.duration.hours(1)), // Past registration deadline
                        futureTime.start,
                        futureTime.end,
                        { from: owner }
                    ),
                    "Registration deadline must be in future"
                );
            });

            it("should prevent non-commissioner from creating election", async () => {
                await expectRevert(
                    electra.createElection(
                        "Test Election",
                        "Description",
                        futureTime.registration,
                        futureTime.start,
                        futureTime.end,
                        { from: unauthorized }
                    ),
                    "Only commissioner can perform this action"
                );
            });
        });

        describe("Election State Management", () => {
            beforeEach(async () => {
                await electra.createElection(
                    "Test Election",
                    "Description",
                    futureTime.registration,
                    futureTime.start,
                    futureTime.end,
                    { from: owner }
                );
            });

            it("should allow starting voting manually", async () => {
                // Add candidates first
                await electra.addCandidate("Candidate 1", "Party A", "Manifesto 1", { from: owner });
                await electra.addCandidate("Candidate 2", "Party B", "Manifesto 2", { from: owner });

                const tx = await electra.startVoting({ from: owner });
                
                expectEvent(tx, 'ElectionStarted');
                
                const votingOpen = await electra.votingOpen();
                const registrationOpen = await electra.registrationOpen();
                assert.equal(votingOpen, true);
                assert.equal(registrationOpen, false);
            });

            it("should prevent starting voting without candidates", async () => {
                await expectRevert(
                    electra.startVoting({ from: owner }),
                    "Need at least 2 candidates to start voting"
                );
            });

            it("should allow ending voting", async () => {
                await electra.addCandidate("Candidate 1", "Party A", "Manifesto 1", { from: owner });
                await electra.addCandidate("Candidate 2", "Party B", "Manifesto 2", { from: owner });
                await electra.startVoting({ from: owner });

                const tx = await electra.endVoting({ from: owner });
                
                expectEvent(tx, 'ElectionEnded');
                
                const votingOpen = await electra.votingOpen();
                assert.equal(votingOpen, false);
            });
        });
    });

    describe("Candidate Management", () => {
        beforeEach(async () => {
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };

            await electra.createElection(
                "Test Election",
                "Description",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );
        });

        it("should allow adding candidates", async () => {
            const tx = await electra.addCandidate(
                "John Doe",
                "Democratic Party",
                "Policy manifesto",
                { from: owner }
            );

            expectEvent(tx, 'CandidateAdded', {
                candidateID: "1",
                name: "John Doe",
                party: "Democratic Party",
                addedBy: owner
            });

            const candidateInfo = await electra.getCandidateInfo(1);
            assert.equal(candidateInfo.name, "John Doe");
            assert.equal(candidateInfo.party, "Democratic Party");
            assert.equal(candidateInfo.isActive, true);
        });

        it("should prevent adding candidates with empty name", async () => {
            await expectRevert(
                electra.addCandidate("", "Party", "Manifesto", { from: owner }),
                "Candidate name cannot be empty"
            );
        });

        it("should prevent adding candidates with empty party", async () => {
            await expectRevert(
                electra.addCandidate("Name", "", "Manifesto", { from: owner }),
                "Party name cannot be empty"
            );
        });

        it("should allow admin to add candidates", async () => {
            await electra.assignRole(admin, Role.ADMIN, { from: owner });
            
            await electra.addCandidate(
                "Jane Smith",
                "Republican Party",
                "Conservative manifesto",
                { from: admin }
            );

            const candidateInfo = await electra.getCandidateInfo(1);
            assert.equal(candidateInfo.name, "Jane Smith");
        });

        it("should prevent unauthorized users from adding candidates", async () => {
            await expectRevert(
                electra.addCandidate("Name", "Party", "Manifesto", { from: unauthorized }),
                "Insufficient role permissions"
            );
        });

        it("should allow deactivating candidates", async () => {
            await electra.addCandidate("John Doe", "Party", "Manifesto", { from: owner });
            
            const tx = await electra.deactivateCandidate(1, { from: owner });
            
            expectEvent(tx, 'CandidateDeactivated', {
                candidateID: "1",
                deactivatedBy: owner
            });

            const candidateInfo = await electra.getCandidateInfo(1);
            assert.equal(candidateInfo.isActive, false);
        });
    });

    describe("Voter Management", () => {
        beforeEach(async () => {
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };

            await electra.createElection(
                "Test Election",
                "Description",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );
        });

        it("should allow registering voters", async () => {
            const tx = await electra.registerVoter(voter1, { from: owner });
            
            expectEvent(tx, 'VoterRegistered', {
                voter: voter1,
                voterID: "1"
            });

            const voterInfo = await electra.getVoterInfo(voter1);
            assert.equal(voterInfo.isRegistered, true);
            assert.equal(voterInfo.hasVoted, false);
            assert.equal(voterInfo.voterID.toNumber(), 1);
        });

        it("should allow self-registration", async () => {
            const tx = await electra.selfRegister({ from: voter1 });
            
            expectEvent(tx, 'VoterRegistered', {
                voter: voter1,
                voterID: "1"
            });

            const voterInfo = await electra.getVoterInfo(voter1);
            assert.equal(voterInfo.isRegistered, true);
        });

        it("should prevent duplicate voter registration", async () => {
            await electra.registerVoter(voter1, { from: owner });
            
            await expectRevert(
                electra.registerVoter(voter1, { from: owner }),
                "Voter already registered"
            );
        });

        it("should prevent registering with invalid address", async () => {
            await expectRevert(
                electra.registerVoter("0x0000000000000000000000000000000000000000", { from: owner }),
                "Invalid voter address"
            );
        });
    });

    describe("Voting Process", () => {
        beforeEach(async () => {
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };

            await electra.createElection(
                "Test Election",
                "Description",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );

            // Add candidates
            await electra.addCandidate("Candidate 1", "Party A", "Manifesto 1", { from: owner });
            await electra.addCandidate("Candidate 2", "Party B", "Manifesto 2", { from: owner });

            // Register voters
            await electra.assignRole(voter1, Role.VOTER, { from: owner });
            await electra.registerVoter(voter1, { from: owner });

            // Start voting
            await electra.startVoting({ from: owner });
        });

        it("should allow registered voters to vote", async () => {
            const tx = await electra.vote(1, { from: voter1 });
            
            expectEvent(tx, 'VoteCast', {
                voter: voter1,
                candidateID: "1",
                voteRecordID: "1"
            });

            const voterInfo = await electra.getVoterInfo(voter1);
            assert.equal(voterInfo.hasVoted, true);
            assert.equal(voterInfo.candidateVoted.toNumber(), 1);

            const candidateInfo = await electra.getCandidateInfo(1);
            assert.equal(candidateInfo.voteCount.toNumber(), 1);
        });

        it("should prevent double voting", async () => {
            await electra.vote(1, { from: voter1 });
            
            await expectRevert(
                electra.vote(2, { from: voter1 }),
                "You have already voted"
            );
        });

        it("should prevent unregistered users from voting", async () => {
            await expectRevert(
                electra.vote(1, { from: voter2 }),
                "You are not registered to vote"
            );
        });

        it("should prevent voting for invalid candidates", async () => {
            await expectRevert(
                electra.vote(999, { from: voter1 }),
                "Invalid candidate ID"
            );
        });
    });

    describe("View Functions", () => {
        beforeEach(async () => {
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };

            await electra.createElection(
                "Test Election",
                "Description",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );
        });

        it("should return correct system stats", async () => {
            await electra.assignRole(admin, Role.ADMIN, { from: owner });
            await electra.assignRole(voter1, Role.VOTER, { from: owner });
            await electra.assignRole(observer, Role.OBSERVER, { from: owner });

            const stats = await electra.getSystemStats();
            assert.equal(stats.admins.toNumber(), 1);
            assert.equal(stats.voters.toNumber(), 1);
            assert.equal(stats.observers.toNumber(), 1);
            assert.equal(stats.owner, owner);
            assert.equal(stats.commissioner, owner);
        });

        it("should return correct election status", async () => {
            const status = await electra.getElectionStatus();
            assert.equal(status.registrationActive, true);
            assert.equal(status.votingActive, false);
        });

        it("should check roles correctly", async () => {
            await electra.assignRole(admin, Role.ADMIN, { from: owner });
            
            const hasAdminRole = await electra.checkRole(admin, Role.ADMIN);
            const hasVoterRole = await electra.checkRole(admin, Role.VOTER);
            
            assert.equal(hasAdminRole, true);
            assert.equal(hasVoterRole, false);
        });
    });

    describe("Emergency Functions", () => {
        beforeEach(async () => {
            const currentTime = await time.latest();
            const futureTime = {
                registration: currentTime.add(time.duration.hours(1)),
                start: currentTime.add(time.duration.hours(2)),
                end: currentTime.add(time.duration.hours(4))
            };

            await electra.createElection(
                "Test Election",
                "Description",
                futureTime.registration,
                futureTime.start,
                futureTime.end,
                { from: owner }
            );

            await electra.addCandidate("Candidate 1", "Party A", "Manifesto 1", { from: owner });
            await electra.addCandidate("Candidate 2", "Party B", "Manifesto 2", { from: owner });
            await electra.startVoting({ from: owner });
        });

        it("should allow extending voting period", async () => {
            const tx = await electra.extendVotingPeriod(2, { from: owner });
            
            expectEvent(tx, 'VotingExtended');
        });

        it("should prevent extending voting with invalid hours", async () => {
            await expectRevert(
                electra.extendVotingPeriod(0, { from: owner }),
                "Invalid extension period"
            );

            await expectRevert(
                electra.extendVotingPeriod(100, { from: owner }),
                "Invalid extension period"
            );
        });

        it("should allow emergency reset when in emergency mode", async () => {
            await electra.activateEmergency({ from: owner });
            await electra.emergencyResetElection({ from: owner });

            const electionInfo = await electra.getElectionInfo();
            assert.equal(electionInfo.isActive, false);
            assert.equal(electionInfo.isFinalized, false);
        });
    });

    describe("Pausable Functions", () => {
        it("should prevent operations when paused", async () => {
            await electra.pauseSystem({ from: owner });

            await expectRevert(
                electra.assignRole(voter1, Role.VOTER, { from: owner }),
                "System is currently paused"
            );
        });

        it("should allow operations when unpaused", async () => {
            await electra.pauseSystem({ from: owner });
            await electra.unpauseSystem({ from: owner });

            // Should not revert
            await electra.assignRole(voter1, Role.VOTER, { from: owner });
        });
    });
});
