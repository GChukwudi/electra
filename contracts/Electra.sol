// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ElectraAccessControl.sol";

/**
 * @title Electra
 * @dev Main voting contract for the Electra blockchain voting system
 * @author God's Favour Chukwudi
 * 
 * Electra is a secure, transparent, and immutable voting system designed
 * to address electoral integrity challenges in Nigeria and beyond.
 */
contract Electra is ElectraAccessControl {
    
    // ==================== STRUCTS ====================
    
    /**
     * @dev Voter information structure
     */
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 candidateVoted;
        uint256 voterID;
        uint256 registrationTime;
        bytes32 verificationHash;
    }
    
    /**
     * @dev Candidate information structure
     */
    struct Candidate {
        string name;
        string party;
        string manifesto;
        uint256 voteCount;
        bool isActive;
        uint256 candidateID;
        uint256 addedAt;
    }
    
    /**
     * @dev Election information structure
     */
    struct Election {
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 registrationDeadline;
        bool isActive;
        bool isFinalized;
        uint256 totalVoters;
        uint256 totalVotes;
        uint256 winnerID;
    }
    
    /**
     * @dev Vote record for transparency
     */
    struct VoteRecord {
        address voter;
        uint256 candidateID;
        uint256 timestamp;
        bytes32 transactionHash;
    }
    
    // ==================== STATE VARIABLES ====================
    
    // Core election data
    Election public currentElection;
    mapping(address => Voter) public voters;
    mapping(uint256 => Candidate) public candidates;
    mapping(uint256 => VoteRecord) public voteRecords;
    
    // Mappings for efficient access
    mapping(address => uint256) public voterToID;
    mapping(uint256 => address) public idToVoter;
    
    // Counters
    uint256 public totalCandidates;
    uint256 public nextVoterID;
    uint256 public nextVoteRecord;
    
    // Election states
    bool public registrationOpen;
    bool public votingOpen;
    
    // Security features
    mapping(bytes32 => bool) public usedHashes;
    uint256 public constant MAX_CANDIDATES = 50;
    uint256 public constant MIN_VOTING_DURATION = 1 hours;
    uint256 public constant MAX_VOTING_DURATION = 30 days;
    
    // ==================== EVENTS ====================
    
    event ElectionCreated(
        string indexed title,
        uint256 startTime,
        uint256 endTime,
        uint256 registrationDeadline
    );
    
    event VoterRegistered(
        address indexed voter,
        uint256 indexed voterID,
        uint256 timestamp
    );
    
    event CandidateAdded(
        uint256 indexed candidateID,
        string name,
        string party,
        address indexed addedBy
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed candidateID,
        uint256 timestamp,
        uint256 voteRecordID
    );
    
    event ElectionStarted(uint256 startTime, uint256 endTime);
    event ElectionEnded(uint256 endTime, uint256 totalVotes);
    event ElectionFinalized(uint256 indexed winnerID, string winnerName, uint256 totalVotes);
    
    event RegistrationOpened(uint256 deadline);
    event RegistrationClosed(uint256 totalVoters);
    
    event CandidateDeactivated(uint256 indexed candidateID, address indexed deactivatedBy);
    event VotingExtended(uint256 newEndTime, uint256 extensionBy);
    
    // ==================== MODIFIERS ====================
    
    modifier registrationIsOpen() {
        require(registrationOpen, "Voter registration is not open");
        require(
            block.timestamp <= currentElection.registrationDeadline,
            "Registration deadline has passed"
        );
        _;
    }
    
    modifier votingIsOpen() {
        require(votingOpen, "Voting is not currently open");
        require(currentElection.isActive, "Election is not active");
        require(
            block.timestamp >= currentElection.startTime,
            "Voting has not started yet"
        );
        require(
            block.timestamp <= currentElection.endTime,
            "Voting period has ended"
        );
        _;
    }
    
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "You are not registered to vote");
        _;
    }
    
    modifier hasNotVoted() {
        require(!voters[msg.sender].hasVoted, "You have already voted");
        _;
    }
    
    modifier electionNotFinalized() {
        require(!currentElection.isFinalized, "Election has been finalized");
        _;
    }
    
    modifier validCandidate(uint256 _candidateID) {
        require(_candidateID > 0 && _candidateID <= totalCandidates, "Invalid candidate ID");
        require(candidates[_candidateID].isActive, "Candidate is not active");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() ElectraAccessControl() {
        nextVoterID = 1;
        nextVoteRecord = 1;
    }
    
    // ==================== ELECTION MANAGEMENT ====================
    
    /**
     * @dev Create a new election
     * @param _title Election title
     * @param _description Election description
     * @param _registrationDeadline Registration deadline timestamp
     * @param _startTime Voting start time
     * @param _endTime Voting end time
     */
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _registrationDeadline,
        uint256 _startTime,
        uint256 _endTime
    ) external onlyCommissioner whenNotPaused electionNotFinalized {
        require(bytes(_title).length > 0, "Election title cannot be empty");
        require(_registrationDeadline > block.timestamp, "Registration deadline must be in future");
        require(_startTime > _registrationDeadline, "Voting must start after registration deadline");
        require(_endTime > _startTime, "End time must be after start time");
        require(
            _endTime - _startTime >= MIN_VOTING_DURATION,
            "Voting duration too short"
        );
        require(
            _endTime - _startTime <= MAX_VOTING_DURATION,
            "Voting duration too long"
        );
        require(!currentElection.isActive, "An election is already active");
        
        currentElection = Election({
            title: _title,
            description: _description,
            startTime: _startTime,
            endTime: _endTime,
            registrationDeadline: _registrationDeadline,
            isActive: true,
            isFinalized: false,
            totalVoters: 0,
            totalVotes: 0,
            winnerID: 0
        });
        
        registrationOpen = true;
        votingOpen = false;
        
        emit ElectionCreated(_title, _startTime, _endTime, _registrationDeadline);
        emit RegistrationOpened(_registrationDeadline);
    }
    
    /**
     * @dev Start the voting period manually (before scheduled time)
     */
    function startVoting() 
        external 
        onlyCommissioner 
        whenNotPaused 
        electionNotFinalized 
    {
        require(currentElection.isActive, "No active election");
        require(!votingOpen, "Voting is already open");
        require(totalCandidates >= 2, "Need at least 2 candidates to start voting");
        require(
            block.timestamp >= currentElection.registrationDeadline,
            "Cannot start before registration deadline"
        );
        
        registrationOpen = false;
        votingOpen = true;
        
        // Update start time if starting early
        if (block.timestamp < currentElection.startTime) {
            currentElection.startTime = block.timestamp;
        }
        
        emit RegistrationClosed(currentElection.totalVoters);
        emit ElectionStarted(currentElection.startTime, currentElection.endTime);
    }
    
    /**
     * @dev End the voting period manually
     */
    function endVoting() 
        external 
        onlyCommissioner 
        whenNotPaused 
        electionNotFinalized 
    {
        require(votingOpen, "Voting is not currently open");
        
        votingOpen = false;
        currentElection.endTime = block.timestamp;
        
        emit ElectionEnded(currentElection.endTime, currentElection.totalVotes);
    }
    
    /**
     * @dev Finalize the election and declare winner
     */
    function finalizeElection() 
        external 
        onlyCommissioner 
        whenNotPaused 
        electionNotFinalized 
    {
        require(!votingOpen, "Voting must be closed before finalizing");
        require(currentElection.totalVotes > 0, "No votes cast");
        require(block.timestamp > currentElection.endTime, "Election period not ended");
        
        // Find the winner
        uint256 winnerID = _calculateWinner();
        
        currentElection.isFinalized = true;
        currentElection.isActive = false;
        currentElection.winnerID = winnerID;
        
        emit ElectionFinalized(
            winnerID,
            candidates[winnerID].name,
            candidates[winnerID].voteCount
        );
    }
    
    // ==================== CANDIDATE MANAGEMENT ====================
    
    /**
     * @dev Add a new candidate to the election
     * @param _name Candidate name
     * @param _party Political party
     * @param _manifesto Candidate manifesto
     */
    function addCandidate(
        string memory _name,
        string memory _party,
        string memory _manifesto
    ) external hasAnyRole(Role.ADMIN, Role.COMMISSIONER) whenNotPaused electionNotFinalized {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");
        require(bytes(_party).length > 0, "Party name cannot be empty");
        require(totalCandidates < MAX_CANDIDATES, "Maximum candidates reached");
        require(!votingOpen, "Cannot add candidates while voting is open");
        require(currentElection.isActive, "No active election");
        
        totalCandidates++;
        candidates[totalCandidates] = Candidate({
            name: _name,
            party: _party,
            manifesto: _manifesto,
            voteCount: 0,
            isActive: true,
            candidateID: totalCandidates,
            addedAt: block.timestamp
        });
        
        emit CandidateAdded(totalCandidates, _name, _party, msg.sender);
    }
    
    /**
     * @dev Deactivate a candidate
     * @param _candidateID ID of the candidate to deactivate
     */
    function deactivateCandidate(uint256 _candidateID) 
        external 
        onlyCommissioner 
        whenNotPaused 
        validCandidate(_candidateID) 
        electionNotFinalized 
    {
        require(!votingOpen, "Cannot deactivate candidates while voting is open");
        
        candidates[_candidateID].isActive = false;
        emit CandidateDeactivated(_candidateID, msg.sender);
    }
    
    // ==================== VOTER MANAGEMENT ====================
    
    /**
     * @dev Register a new voter
     * @param _voterAddress Address of the voter to register
     */
    function registerVoter(address _voterAddress) 
        external 
        hasAnyRole(Role.ADMIN, Role.COMMISSIONER) 
        registrationIsOpen 
        whenNotPaused 
        electionNotFinalized 
    {
        require(_voterAddress != address(0), "Invalid voter address");
        require(!voters[_voterAddress].isRegistered, "Voter already registered");
        require(currentElection.isActive, "No active election");
        
        // Generate verification hash
        bytes32 verificationHash = keccak256(
            abi.encodePacked(_voterAddress, nextVoterID, block.timestamp)
        );
        
        require(!usedHashes[verificationHash], "Hash collision detected");
        usedHashes[verificationHash] = true;
        
        voters[_voterAddress] = Voter({
            isRegistered: true,
            hasVoted: false,
            candidateVoted: 0,
            voterID: nextVoterID,
            registrationTime: block.timestamp,
            verificationHash: verificationHash
        });
        
        voterToID[_voterAddress] = nextVoterID;
        idToVoter[nextVoterID] = _voterAddress;
        
        currentElection.totalVoters++;
        
        emit VoterRegistered(_voterAddress, nextVoterID, block.timestamp);
        nextVoterID++;
    }
    
    /**
     * @dev Self-register as a voter (if permitted)
     */
    function selfRegister() 
        external 
        registrationIsOpen 
        whenNotPaused 
        electionNotFinalized 
    {
        require(!voters[msg.sender].isRegistered, "You are already registered");
        require(currentElection.isActive, "No active election");
        
        // For POC, allow self-registration
        // In production, this would require additional verification
        
        bytes32 verificationHash = keccak256(
            abi.encodePacked(msg.sender, nextVoterID, block.timestamp)
        );
        
        require(!usedHashes[verificationHash], "Hash collision detected");
        usedHashes[verificationHash] = true;
        
        voters[msg.sender] = Voter({
            isRegistered: true,
            hasVoted: false,
            candidateVoted: 0,
            voterID: nextVoterID,
            registrationTime: block.timestamp,
            verificationHash: verificationHash
        });
        
        voterToID[msg.sender] = nextVoterID;
        idToVoter[nextVoterID] = msg.sender;
        
        currentElection.totalVoters++;
        
        emit VoterRegistered(msg.sender, nextVoterID, block.timestamp);
        nextVoterID++;
    }
    
    // ==================== VOTING ====================
    
    /**
     * @dev Cast a vote for a candidate
     * @param _candidateID ID of the candidate to vote for
     */
    function vote(uint256 _candidateID) 
        external 
        votingIsOpen 
        onlyRegisteredVoter 
        hasNotVoted 
        validCandidate(_candidateID) 
        whenNotPaused 
        electionNotFinalized 
        onlyActiveUser
    {
        // Record the vote
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].candidateVoted = _candidateID;
        
        // Update candidate vote count
        candidates[_candidateID].voteCount++;
        
        // Update total votes
        currentElection.totalVotes++;
        
        // Create vote record for transparency
        voteRecords[nextVoteRecord] = VoteRecord({
            voter: msg.sender,
            candidateID: _candidateID,
            timestamp: block.timestamp,
            transactionHash: blockhash(block.number - 1)
        });
        
        emit VoteCast(msg.sender, _candidateID, block.timestamp, nextVoteRecord);
        nextVoteRecord++;
    }
    
    // ==================== EMERGENCY CONTROLS ====================
    
    /**
     * @dev Extend voting period in case of emergency
     * @param _additionalHours Additional hours to extend voting
     */
    function extendVotingPeriod(uint256 _additionalHours) 
        external 
        onlyCommissioner 
        whenNotPaused 
        electionNotFinalized 
    {
        require(votingOpen, "Voting is not currently open");
        require(_additionalHours > 0 && _additionalHours <= 72, "Invalid extension period");
        
        uint256 extension = _additionalHours * 1 hours;
        currentElection.endTime += extension;
        
        emit VotingExtended(currentElection.endTime, extension);
    }
    
    /**
     * @dev Emergency reset election (only in emergency mode)
     */
    function emergencyResetElection() 
        external 
        onlyOwner 
        whenPaused 
    {
        require(emergencyMode, "Emergency mode not active");
        
        // Reset election state
        currentElection.isActive = false;
        currentElection.isFinalized = false;
        registrationOpen = false;
        votingOpen = false;
        
        // Note: Vote data is preserved for audit purposes
        // Only the election state is reset
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get voter information
     * @param _voterAddress Address of the voter
     * @return Voter information
     */
    function getVoterInfo(address _voterAddress) 
        external 
        view 
        returns (
            bool isRegistered,
            bool hasVoted,
            uint256 candidateVoted,
            uint256 voterID,
            uint256 registrationTime
        ) 
    {
        Voter memory voter = voters[_voterAddress];
        return (
            voter.isRegistered,
            voter.hasVoted,
            voter.candidateVoted,
            voter.voterID,
            voter.registrationTime
        );
    }
    
    /**
     * @dev Get candidate information
     * @param _candidateID ID of the candidate
     * @return Candidate information
     */
    function getCandidateInfo(uint256 _candidateID) 
        external 
        view 
        returns (
            string memory name,
            string memory party,
            string memory manifesto,
            uint256 voteCount,
            bool isActive
        ) 
    {
        require(_candidateID > 0 && _candidateID <= totalCandidates, "Invalid candidate ID");
        Candidate memory candidate = candidates[_candidateID];
        return (
            candidate.name,
            candidate.party,
            candidate.manifesto,
            candidate.voteCount,
            candidate.isActive
        );
    }
    
    /**
     * @dev Get all candidates information
     * @return Arrays of candidate information
     */
    function getAllCandidates() 
        external 
        view 
        returns (
            uint256[] memory candidateIDs,
            string[] memory names,
            string[] memory parties,
            uint256[] memory voteCounts,
            bool[] memory isActiveArray
        ) 
    {
        candidateIDs = new uint256[](totalCandidates);
        names = new string[](totalCandidates);
        parties = new string[](totalCandidates);
        voteCounts = new uint256[](totalCandidates);
        isActiveArray = new bool[](totalCandidates);
        
        for (uint256 i = 1; i <= totalCandidates; i++) {
            candidateIDs[i-1] = i;
            names[i-1] = candidates[i].name;
            parties[i-1] = candidates[i].party;
            voteCounts[i-1] = candidates[i].voteCount;
            isActiveArray[i-1] = candidates[i].isActive;
        }
    }
    
    /**
     * @dev Get election information
     * @return Election information
     */
    function getElectionInfo() 
        external 
        view 
        returns (
            string memory title,
            string memory description,
            uint256 startTime,
            uint256 endTime,
            uint256 registrationDeadline,
            bool isActive,
            bool isFinalized,
            uint256 totalVoters,
            uint256 totalVotes,
            uint256 winnerID
        ) 
    {
        return (
            currentElection.title,
            currentElection.description,
            currentElection.startTime,
            currentElection.endTime,
            currentElection.registrationDeadline,
            currentElection.isActive,
            currentElection.isFinalized,
            currentElection.totalVoters,
            currentElection.totalVotes,
            currentElection.winnerID
        );
    }
    
    /**
     * @dev Get current election status
     * @return Status information
     */
    function getElectionStatus() 
        external 
        view 
        returns (
            bool registrationActive,
            bool votingActive,
            uint256 timeUntilStart,
            uint256 timeUntilEnd,
            uint256 timeUntilRegistrationDeadline
        ) 
    {
        registrationActive = registrationOpen && 
                           block.timestamp <= currentElection.registrationDeadline;
        
        votingActive = votingOpen && 
                      block.timestamp >= currentElection.startTime && 
                      block.timestamp <= currentElection.endTime;
        
        timeUntilStart = currentElection.startTime > block.timestamp ? 
                        currentElection.startTime - block.timestamp : 0;
        
        timeUntilEnd = currentElection.endTime > block.timestamp ? 
                      currentElection.endTime - block.timestamp : 0;
        
        timeUntilRegistrationDeadline = currentElection.registrationDeadline > block.timestamp ? 
                                       currentElection.registrationDeadline - block.timestamp : 0;
    }
    
    /**
     * @dev Get current winner (can be called during or after election)
     * @return Winner information
     */
    function getCurrentWinner() 
        external 
        view 
        returns (
            uint256 winnerID,
            string memory winnerName,
            string memory winnerParty,
            uint256 maxVotes,
            bool isTie
        ) 
    {
        require(totalCandidates > 0, "No candidates available");
        
        (winnerID, maxVotes, isTie) = _calculateWinnerWithTieCheck();
        
        if (winnerID > 0) {
            winnerName = candidates[winnerID].name;
            winnerParty = candidates[winnerID].party;
        }
    }
    
    /**
     * @dev Get vote record by ID
     * @param _recordID Vote record ID
     * @return Vote record information
     */
    function getVoteRecord(uint256 _recordID) 
        external 
        view 
        returns (
            address voter,
            uint256 candidateID,
            uint256 timestamp,
            bytes32 transactionHash
        ) 
    {
        require(_recordID > 0 && _recordID < nextVoteRecord, "Invalid record ID");
        VoteRecord memory record = voteRecords[_recordID];
        return (record.voter, record.candidateID, record.timestamp, record.transactionHash);
    }
    
    /**
     * @dev Verify a vote using verification hash
     * @param _voter Voter address
     * @param _hash Verification hash
     * @return Whether the vote is valid
     */
    function verifyVote(address _voter, bytes32 _hash) 
        external 
        view 
        returns (bool) 
    {
        return voters[_voter].verificationHash == _hash && voters[_voter].hasVoted;
    }
    
    /**
     * @dev Get election statistics
     * @return Comprehensive election statistics
     */
    function getElectionStatistics() 
        external 
        view 
        returns (
            uint256 totalRegisteredVoters,
            uint256 totalVotesCast,
            uint256 voterTurnoutPercentage,
            uint256 activeCandidates,
            uint256 totalCandidatesCount,
            bool hasWinner,
            bool electionComplete
        ) 
    {
        totalRegisteredVoters = currentElection.totalVoters;
        totalVotesCast = currentElection.totalVotes;
        
        voterTurnoutPercentage = totalRegisteredVoters > 0 ? 
                               (totalVotesCast * 100) / totalRegisteredVoters : 0;
        
        activeCandidates = _countActiveCandidates();
        totalCandidatesCount = totalCandidates;
        
        hasWinner = currentElection.winnerID > 0;
        electionComplete = currentElection.isFinalized;
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @dev Calculate the winner of the election
     * @return Winner candidate ID
     */
    function _calculateWinner() internal view returns (uint256) {
        require(totalCandidates > 0, "No candidates available");
        
        uint256 winnerID = 1;
        uint256 maxVotes = candidates[1].voteCount;
        
        for (uint256 i = 2; i <= totalCandidates; i++) {
            if (candidates[i].isActive && candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerID = i;
            }
        }
        
        return winnerID;
    }
    
    /**
     * @dev Calculate winner with tie detection
     * @return Winner ID, vote count, and tie status
     */
    function _calculateWinnerWithTieCheck() 
        internal 
        view 
        returns (uint256 winnerID, uint256 maxVotes, bool isTie) 
    {
        require(totalCandidates > 0, "No candidates available");
        
        winnerID = 0;
        maxVotes = 0;
        isTie = false;
        
        // Find maximum votes
        for (uint256 i = 1; i <= totalCandidates; i++) {
            if (candidates[i].isActive && candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerID = i;
                isTie = false;
            } else if (candidates[i].isActive && candidates[i].voteCount == maxVotes && maxVotes > 0) {
                isTie = true;
            }
        }
    }
    
    /**
     * @dev Count active candidates
     * @return Number of active candidates
     */
    function _countActiveCandidates() internal view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= totalCandidates; i++) {
            if (candidates[i].isActive) {
                count++;
            }
        }
        return count;
    }
}