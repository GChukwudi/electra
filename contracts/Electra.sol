// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Electra - Blockchain Voting System
 * @dev A secure, transparent voting system for Nigerian elections
 * @author God's Favour Chukwudi
 * 
 * Features:
 * - Secure voter registration and authentication
 * - Tamper-proof vote recording
 * - Real-time transparent results
 * - Role-based access control
 * - Emergency controls
 */
contract Electra is ReentrancyGuard, Ownable, Pausable {
    
    // ==================== STRUCTURES ====================
    
    /**
     * @dev Voter information structure
     */
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 candidateVoted;
        uint256 voterID;
        uint256 registrationTime;
        string voterName;
        bytes32 voterHash; // For additional verification
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
        string imageHash; // IPFS hash for candidate image
    }
    
    /**
     * @dev Election configuration structure
     */
    struct ElectionConfig {
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 maxVoters;
        bool isActive;
        address commissioner;
    }
    
    /**
     * @dev Vote structure for transparency
     */
    struct Vote {
        address voter;
        uint256 candidateID;
        uint256 timestamp;
        bytes32 voteHash;
    }
    
    // ==================== STATE VARIABLES ====================
    
    ElectionConfig public electionConfig;
    
    // Mappings
    mapping(address => Voter) public voters;
    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public authorizedAdmins;
    mapping(uint256 => Vote) public voteRecords;
    
    // Arrays for iteration
    address[] public voterAddresses;
    uint256[] public candidateIDs;
    
    // Counters
    uint256 public totalVoters;
    uint256 public totalVotes;
    uint256 public totalCandidates;
    uint256 private nextVoterID;
    uint256 private nextVoteID;
    
    // Election states
    bool public registrationOpen;
    bool public votingOpen;
    bool public electionFinalized;
    
    // ==================== EVENTS ====================
    
    event VoterRegistered(
        address indexed voter,
        uint256 indexed voterID,
        string voterName,
        uint256 timestamp
    );
    
    event VoteCast(
        address indexed voter,
        uint256 indexed candidateID,
        uint256 indexed voteID,
        uint256 timestamp
    );
    
    event CandidateAdded(
        uint256 indexed candidateID,
        string name,
        string party,
        address addedBy
    );
    
    event CandidateUpdated(
        uint256 indexed candidateID,
        string name,
        string party
    );
    
    event ElectionStateChanged(
        string state,
        address changedBy,
        uint256 timestamp
    );
    
    event ElectionFinalized(
        uint256 indexed winnerID,
        string winnerName,
        uint256 totalVotes,
        uint256 timestamp
    );
    
    event AdminAdded(address indexed admin, address addedBy);
    event AdminRemoved(address indexed admin, address removedBy);
    
    // ==================== MODIFIERS ====================
    
    modifier onlyCommissioner() {
        require(msg.sender == electionConfig.commissioner, "Only commissioner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == electionConfig.commissioner || authorizedAdmins[msg.sender],
            "Not authorized"
        );
        _;
    }
    
    modifier registrationIsOpen() {
        require(registrationOpen, "Registration closed");
        _;
    }
    
    modifier votingIsOpen() {
        require(votingOpen, "Voting closed");
        require(block.timestamp >= electionConfig.startTime, "Voting not started");
        require(block.timestamp <= electionConfig.endTime, "Voting ended");
        _;
    }
    
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "Not registered");
        _;
    }
    
    modifier hasNotVoted() {
        require(!voters[msg.sender].hasVoted, "Already voted");
        _;
    }
    
    modifier electionNotFinalized() {
        require(!electionFinalized, "Election finalized");
        _;
    }
    
    modifier validCandidate(uint256 candidateID) {
        require(candidateID > 0 && candidateID <= totalCandidates, "Invalid candidate");
        require(candidates[candidateID].isActive, "Candidate inactive");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor(
        string memory _title,
        string memory _description,
        uint256 _durationHours,
        uint256 _maxVoters
    ) {
        electionConfig = ElectionConfig({
            title: _title,
            description: _description,
            startTime: 0, // Set when voting starts
            endTime: 0,   // Set when voting starts
            maxVoters: _maxVoters,
            isActive: true,
            commissioner: msg.sender
        });
        
        nextVoterID = 1;
        nextVoteID = 1;
        registrationOpen = true;
        votingOpen = false;
        electionFinalized = false;
    }
    
    // ==================== ADMINISTRATIVE FUNCTIONS ====================
    
    /**
     * @dev Add a new candidate
     */
    function addCandidate(
        string memory _name,
        string memory _party,
        string memory _manifesto,
        string memory _imageHash
    ) external onlyAuthorized electionNotFinalized {
        require(bytes(_name).length > 0, "Name required");
        require(bytes(_party).length > 0, "Party required");
        require(!votingOpen, "Cannot add during voting");
        
        totalCandidates++;
        candidateIDs.push(totalCandidates);
        
        candidates[totalCandidates] = Candidate({
            name: _name,
            party: _party,
            manifesto: _manifesto,
            voteCount: 0,
            isActive: true,
            candidateID: totalCandidates,
            imageHash: _imageHash
        });
        
        emit CandidateAdded(totalCandidates, _name, _party, msg.sender);
    }
    
    /**
     * @dev Update candidate information
     */
    function updateCandidate(
        uint256 _candidateID,
        string memory _name,
        string memory _party,
        string memory _manifesto,
        string memory _imageHash
    ) external onlyAuthorized electionNotFinalized validCandidate(_candidateID) {
        require(!votingOpen, "Cannot update during voting");
        
        Candidate storage candidate = candidates[_candidateID];
        candidate.name = _name;
        candidate.party = _party;
        candidate.manifesto = _manifesto;
        candidate.imageHash = _imageHash;
        
        emit CandidateUpdated(_candidateID, _name, _party);
    }
    
    /**
     * @dev Start voting period
     */
    function startVoting(uint256 _durationHours) 
        external 
        onlyCommissioner 
        electionNotFinalized 
    {
        require(!votingOpen, "Voting already open");
        require(totalCandidates >= 2, "Need at least 2 candidates");
        require(_durationHours > 0, "Invalid duration");
        
        registrationOpen = false;
        votingOpen = true;
        
        electionConfig.startTime = block.timestamp;
        electionConfig.endTime = block.timestamp + (_durationHours * 1 hours);
        
        emit ElectionStateChanged("VOTING_STARTED", msg.sender, block.timestamp);
    }
    
    /**
     * @dev End voting period
     */
    function endVoting() external onlyCommissioner electionNotFinalized {
        require(votingOpen, "Voting not open");
        
        votingOpen = false;
        electionConfig.endTime = block.timestamp;
        
        emit ElectionStateChanged("VOTING_ENDED", msg.sender, block.timestamp);
    }
    
    /**
     * @dev Finalize election and declare winner
     */
    function finalizeElection() external onlyCommissioner electionNotFinalized {
        require(!votingOpen, "End voting first");
        require(totalVotes > 0, "No votes cast");
        
        // Find winner
        uint256 winnerID = 1;
        uint256 maxVotes = candidates[1].voteCount;
        
        for (uint256 i = 2; i <= totalCandidates; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerID = i;
            }
        }
        
        electionFinalized = true;
        
        emit ElectionFinalized(
            winnerID,
            candidates[winnerID].name,
            maxVotes,
            block.timestamp
        );
    }
    
    /**
     * @dev Add authorized admin
     */
    function addAdmin(address _admin) external onlyCommissioner {
        require(_admin != address(0), "Invalid address");
        require(!authorizedAdmins[_admin], "Already admin");
        
        authorizedAdmins[_admin] = true;
        emit AdminAdded(_admin, msg.sender);
    }
    
    /**
     * @dev Remove authorized admin
     */
    function removeAdmin(address _admin) external onlyCommissioner {
        require(authorizedAdmins[_admin], "Not admin");
        
        authorizedAdmins[_admin] = false;
        emit AdminRemoved(_admin, msg.sender);
    }
    
    /**
     * @dev Toggle registration status
     */
    function toggleRegistration() external onlyCommissioner electionNotFinalized {
        require(!votingOpen, "Cannot change during voting");
        registrationOpen = !registrationOpen;
        
        string memory state = registrationOpen ? "REGISTRATION_OPENED" : "REGISTRATION_CLOSED";
        emit ElectionStateChanged(state, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Deactivate candidate (emergency)
     */
    function deactivateCandidate(uint256 _candidateID) 
        external 
        onlyCommissioner 
        electionNotFinalized 
        validCandidate(_candidateID) 
    {
        candidates[_candidateID].isActive = false;
    }
    
    /**
     * @dev Extend voting period
     */
    function extendVoting(uint256 _additionalHours) 
        external 
        onlyCommissioner 
        electionNotFinalized 
    {
        require(votingOpen, "Voting not open");
        require(_additionalHours > 0, "Invalid extension");
        
        electionConfig.endTime += (_additionalHours * 1 hours);
    }
    
    // ==================== VOTER FUNCTIONS ====================
    
    /**
     * @dev Register a voter
     */
    function registerVoter(
        string memory _voterName
    ) external registrationIsOpen electionNotFinalized whenNotPaused {
        require(!voters[msg.sender].isRegistered, "Already registered");
        require(bytes(_voterName).length > 0, "Name required");
        require(totalVoters < electionConfig.maxVoters, "Registration full");
        
        bytes32 voterHash = keccak256(abi.encodePacked(msg.sender, _voterName, block.timestamp));
        
        voters[msg.sender] = Voter({
            isRegistered: true,
            hasVoted: false,
            candidateVoted: 0,
            voterID: nextVoterID,
            registrationTime: block.timestamp,
            voterName: _voterName,
            voterHash: voterHash
        });
        
        voterAddresses.push(msg.sender);
        totalVoters++;
        nextVoterID++;
        
        emit VoterRegistered(msg.sender, nextVoterID - 1, _voterName, block.timestamp);
    }
    
    /**
     * @dev Cast a vote
     */
    function vote(uint256 _candidateID) 
        external 
        votingIsOpen 
        onlyRegisteredVoter 
        hasNotVoted 
        electionNotFinalized 
        validCandidate(_candidateID)
        nonReentrant
        whenNotPaused
    {
        // Update voter record
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].candidateVoted = _candidateID;
        
        // Update candidate vote count
        candidates[_candidateID].voteCount++;
        
        // Create vote record for transparency
        bytes32 voteHash = keccak256(abi.encodePacked(
            msg.sender, 
            _candidateID, 
            block.timestamp,
            nextVoteID
        ));
        
        voteRecords[nextVoteID] = Vote({
            voter: msg.sender,
            candidateID: _candidateID,
            timestamp: block.timestamp,
            voteHash: voteHash
        });
        
        totalVotes++;
        
        emit VoteCast(msg.sender, _candidateID, nextVoteID, block.timestamp);
        nextVoteID++;
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get voter information
     */
    function getVoterInfo(address _voter) 
        external 
        view 
        returns (
            bool isRegistered,
            bool hasVoted,
            uint256 candidateVoted,
            uint256 voterID,
            uint256 registrationTime,
            string memory voterName
        ) 
    {
        Voter memory voter = voters[_voter];
        return (
            voter.isRegistered,
            voter.hasVoted,
            voter.candidateVoted,
            voter.voterID,
            voter.registrationTime,
            voter.voterName
        );
    }
    
    /**
     * @dev Get candidate information
     */
    function getCandidateInfo(uint256 _candidateID) 
        external 
        view 
        returns (
            string memory name,
            string memory party,
            string memory manifesto,
            uint256 voteCount,
            bool isActive,
            string memory imageHash
        ) 
    {
        require(_candidateID > 0 && _candidateID <= totalCandidates, "Invalid candidate");
        Candidate memory candidate = candidates[_candidateID];
        return (
            candidate.name,
            candidate.party,
            candidate.manifesto,
            candidate.voteCount,
            candidate.isActive,
            candidate.imageHash
        );
    }
    
    /**
     * @dev Get all candidates
     */
    function getAllCandidates() 
        external 
        view 
        returns (
            uint256[] memory ids,
            string[] memory names,
            string[] memory parties,
            uint256[] memory voteCounts,
            bool[] memory isActiveArray
        ) 
    {
        ids = new uint256[](totalCandidates);
        names = new string[](totalCandidates);
        parties = new string[](totalCandidates);
        voteCounts = new uint256[](totalCandidates);
        isActiveArray = new bool[](totalCandidates);
        
        for (uint256 i = 1; i <= totalCandidates; i++) {
            ids[i-1] = i;
            names[i-1] = candidates[i].name;
            parties[i-1] = candidates[i].party;
            voteCounts[i-1] = candidates[i].voteCount;
            isActiveArray[i-1] = candidates[i].isActive;
        }
    }
    
    /**
     * @dev Get election statistics
     */
    function getElectionStats() 
        external 
        view 
        returns (
            string memory title,
            string memory description,
            uint256 totalVotersCount,
            uint256 totalVotesCount,
            uint256 totalCandidatesCount,
            uint256 startTime,
            uint256 endTime,
            bool registrationActive,
            bool votingActive,
            bool finalized
        ) 
    {
        return (
            electionConfig.title,
            electionConfig.description,
            totalVoters,
            totalVotes,
            totalCandidates,
            electionConfig.startTime,
            electionConfig.endTime,
            registrationOpen,
            votingOpen,
            electionFinalized
        );
    }
    
    /**
     * @dev Get current winner
     */
    function getCurrentWinner() 
        external 
        view 
        returns (
            uint256 winnerID,
            string memory winnerName,
            string memory winnerParty,
            uint256 maxVotes,
            uint256 totalVotesCount
        ) 
    {
        require(totalCandidates > 0, "No candidates");
        
        winnerID = 1;
        maxVotes = candidates[1].voteCount;
        
        for (uint256 i = 2; i <= totalCandidates; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerID = i;
            }
        }
        
        return (
            winnerID,
            candidates[winnerID].name,
            candidates[winnerID].party,
            maxVotes,
            totalVotes
        );
    }
    
    /**
     * @dev Check if voting is currently active
     */
    function isVotingActive() external view returns (bool) {
        return votingOpen && 
               block.timestamp >= electionConfig.startTime && 
               block.timestamp <= electionConfig.endTime;
    }
    
    /**
     * @dev Get remaining voting time
     */
    function getRemainingTime() external view returns (uint256) {
        if (!votingOpen || block.timestamp > electionConfig.endTime) {
            return 0;
        }
        return electionConfig.endTime - block.timestamp;
    }
    
    /**
     * @dev Get vote record by ID (for transparency)
     */
    function getVoteRecord(uint256 _voteID) 
        external 
        view 
        returns (
            address voter,
            uint256 candidateID,
            uint256 timestamp,
            bytes32 voteHash
        ) 
    {
        require(_voteID > 0 && _voteID < nextVoteID, "Invalid vote ID");
        Vote memory voteRecord = voteRecords[_voteID];
        return (
            voteRecord.voter,
            voteRecord.candidateID,
            voteRecord.timestamp,
            voteRecord.voteHash
        );
    }
    
    /**
     * @dev Verify vote hash
     */
    function verifyVoteHash(
        uint256 _voteID,
        address _voter,
        uint256 _candidateID,
        uint256 _timestamp
    ) external view returns (bool) {
        require(_voteID > 0 && _voteID < nextVoteID, "Invalid vote ID");
        
        bytes32 computedHash = keccak256(abi.encodePacked(
            _voter,
            _candidateID,
            _timestamp,
            _voteID
        ));
        
        return voteRecords[_voteID].voteHash == computedHash;
    }
    
    // ==================== EMERGENCY FUNCTIONS ====================
    
    /**
     * @dev Pause contract (emergency)
     */
    function pause() external onlyCommissioner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyCommissioner {
        _unpause();
    }
    
    /**
     * @dev Update election configuration
     */
    function updateElectionConfig(
        string memory _title,
        string memory _description,
        uint256 _maxVoters
    ) external onlyCommissioner electionNotFinalized {
        require(!votingOpen, "Cannot update during voting");
        
        electionConfig.title = _title;
        electionConfig.description = _description;
        electionConfig.maxVoters = _maxVoters;
    }
}