// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Electra {    
    enum Role { NONE, VOTER, OBSERVER, ADMIN, COMMISSIONER }
    
    struct User {
        Role role;
        bool isActive;
        uint32 assignedAt;
        address assignedBy;
    }
    
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint32 voterID;
        uint32 candidateVoted;
        uint32 registrationTime;
    }
    
    struct Candidate {
        string name;
        string party;
        uint32 voteCount;
        bool isActive;
        uint32 addedAt;
    }
    
    struct Election {
        string title;
        uint32 startTime;
        uint32 endTime;
        uint32 registrationDeadline;
        bool isActive;
        bool isFinalized;
        uint32 totalVoters;
        uint32 totalVotes;
        uint32 winnerID;
    }
    
    // ==================== STATE VARIABLES ====================
    
    // Access Control
    mapping(address => User) public users;
    address public immutable systemOwner;
    address public currentCommissioner;
    
    // Emergency controls
    bool public systemPaused;
    bool public emergencyMode;
    
    // Core election data
    Election public currentElection;
    mapping(address => Voter) public voters;
    mapping(uint32 => Candidate) public candidates;
    
    // Mappings for efficient access
    mapping(address => uint32) public voterToID;
    mapping(uint32 => address) public idToVoter;
    
    // Counters
    uint32 public totalCandidates;
    uint32 public nextVoterID = 1;
    
    // Election states
    bool public registrationOpen;
    bool public votingOpen;
    
    // Constants
    uint32 public constant MAX_CANDIDATES = 50;
    uint32 public constant MIN_VOTING_DURATION = 1 hours;
    uint32 public constant MAX_VOTING_DURATION = 30 days;
    
    // ==================== EVENTS ====================
    
    event RoleAssigned(address indexed user, Role indexed role, address indexed assignedBy);
    event RoleRevoked(address indexed user, Role indexed oldRole, address indexed revokedBy);
    event CommissionerChanged(address indexed oldCommissioner, address indexed newCommissioner);
    event SystemPaused(address indexed pausedBy);
    event SystemUnpaused(address indexed unpausedBy);
    
    event ElectionCreated(string title, uint32 startTime, uint32 endTime, uint32 registrationDeadline);
    event VoterRegistered(address indexed voter, uint32 indexed voterID, uint32 timestamp);
    event CandidateAdded(uint32 indexed candidateID, string name, string party, address indexed addedBy);
    event VoteCast(address indexed voter, uint32 indexed candidateID, uint32 timestamp);
    event ElectionFinalized(uint32 indexed winnerID, string winnerName, uint32 totalVotes);
        
    modifier onlyOwner() {
        require(msg.sender == systemOwner, "Only owner");
        _;
    }
    
    modifier onlyCommissioner() {
        require(msg.sender == currentCommissioner, "Only commissioner");
        _;
    }
    
    modifier onlyCommissionerOrOwner() {
        require(msg.sender == currentCommissioner || msg.sender == systemOwner, "Only commissioner or owner");
        _;
    }
    
    modifier onlyAdmin() {
        require(
            users[msg.sender].role >= Role.ADMIN || msg.sender == systemOwner,
            "Admin access required"
        );
        _;
    }
    
    modifier whenNotPaused() {
        require(!systemPaused, "System paused");
        _;
    }
    
    modifier registrationIsOpen() {
        require(registrationOpen && block.timestamp <= currentElection.registrationDeadline, "Registration closed");
        _;
    }
    
    modifier votingIsOpen() {
        require(
            votingOpen && 
            currentElection.isActive && 
            block.timestamp >= currentElection.startTime && 
            block.timestamp <= currentElection.endTime,
            "Voting closed"
        );
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
        require(!currentElection.isFinalized, "Election finalized");
        _;
    }
    
    modifier validCandidate(uint32 _candidateID) {
        require(_candidateID > 0 && _candidateID <= totalCandidates, "Invalid candidate");
        require(candidates[_candidateID].isActive, "Candidate inactive");
        _;
    }

    constructor() {
        systemOwner = msg.sender;
        currentCommissioner = msg.sender;
        
        users[msg.sender] = User({
            role: Role.ADMIN,
            isActive: true,
            assignedAt: uint32(block.timestamp),
            assignedBy: msg.sender
        });
        
        emit RoleAssigned(msg.sender, Role.ADMIN, msg.sender);

        users[msg.sender] = User({
            role: Role.COMMISSIONER,
            isActive: true,
            assignedAt: uint32(block.timestamp),
            assignedBy: msg.sender
        });

        emit RoleAssigned(msg.sender, Role.COMMISSIONER, msg.sender);
    }

    function setOwnerAsAdmin() external onlyOwner {
        users[systemOwner] = User({
            role: Role.ADMIN,
            isActive: true,
            assignedAt: uint32(block.timestamp),
            assignedBy: systemOwner
        });
        
        emit RoleAssigned(systemOwner, Role.ADMIN, systemOwner);
    }
        
    function assignRole(address _user, Role _role) 
        external 
        onlyCommissionerOrOwner 
        whenNotPaused 
    {
        require(_user != address(0), "Invalid address");
        require(_role != Role.NONE, "Cannot assign NONE");
        
        if (_role == Role.COMMISSIONER) {
            require(msg.sender == systemOwner, "Only owner can assign commissioner");
            require(_user != currentCommissioner, "Already commissioner");
        }
        
        users[_user] = User({
            role: _role,
            isActive: true,
            assignedAt: uint32(block.timestamp),
            assignedBy: msg.sender
        });
        
        if (_role == Role.COMMISSIONER && _user != currentCommissioner) {
            address oldCommissioner = currentCommissioner;
            currentCommissioner = _user;
            emit CommissionerChanged(oldCommissioner, _user);
        }
        
        emit RoleAssigned(_user, _role, msg.sender);
    }
    
    function revokeRole(address _user) 
        external 
        onlyCommissionerOrOwner 
        whenNotPaused 
    {
        require(_user != address(0), "Invalid address");
        require(_user != systemOwner, "Cannot revoke owner");
        require(_user != currentCommissioner, "Cannot revoke commissioner");
        
        Role oldRole = users[_user].role;
        require(oldRole != Role.NONE, "No role to revoke");
        
        users[_user] = User({
            role: Role.NONE,
            isActive: false,
            assignedAt: 0,
            assignedBy: address(0)
        });
        
        emit RoleRevoked(_user, oldRole, msg.sender);
    }
    
    function pauseSystem() external onlyCommissionerOrOwner {
        systemPaused = !systemPaused;
        if (systemPaused) {
            emit SystemPaused(msg.sender);
        } else {
            emit SystemUnpaused(msg.sender);
        }
    }
    
    function activateEmergency() external onlyCommissionerOrOwner {
        emergencyMode = true;
        systemPaused = true;
    }
    
    function deactivateEmergency() external onlyOwner {
        emergencyMode = false;
    }
    
    // ==================== ELECTION MANAGEMENT ====================
    
    function createElection(
        string calldata _title,
        uint32 _registrationDeadline,
        uint32 _startTime,
        uint32 _endTime
    ) external onlyCommissioner whenNotPaused electionNotFinalized {
        require(bytes(_title).length > 0, "Empty title");
        require(_registrationDeadline > block.timestamp, "Invalid deadline");
        require(_startTime > _registrationDeadline, "Invalid start time");
        require(_endTime > _startTime, "Invalid end time");
        require(_endTime - _startTime >= MIN_VOTING_DURATION, "Duration too short");
        require(_endTime - _startTime <= MAX_VOTING_DURATION, "Duration too long");
        require(!currentElection.isActive, "Election active");
        
        currentElection = Election({
            title: _title,
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
    }
    
    function startVoting() external onlyCommissioner whenNotPaused electionNotFinalized {
        require(currentElection.isActive, "No active election");
        require(!votingOpen, "Voting already open");
        require(totalCandidates >= 2, "Need at least 2 candidates");
        
        registrationOpen = false;
        votingOpen = true;
        
        if (block.timestamp < currentElection.startTime) {
            currentElection.startTime = uint32(block.timestamp);
        }
    }
    
    function endVoting() external onlyCommissioner whenNotPaused electionNotFinalized {
        require(votingOpen, "Voting not open");
        votingOpen = false;
        currentElection.endTime = uint32(block.timestamp);
    }
    
    function finalizeElection() external onlyCommissioner whenNotPaused electionNotFinalized {
        require(!votingOpen, "Close voting first");
        require(currentElection.totalVotes > 0, "No votes");
        require(block.timestamp > currentElection.endTime, "Election not ended");
        
        uint32 winnerID = _calculateWinner();
        
        currentElection.isFinalized = true;
        currentElection.isActive = false;
        currentElection.winnerID = winnerID;
        
        emit ElectionFinalized(winnerID, candidates[winnerID].name, candidates[winnerID].voteCount);
    }
    
    // ==================== CANDIDATE MANAGEMENT ====================
    
    function addCandidate(
        string calldata _name,
        string calldata _party
    ) external onlyAdmin whenNotPaused electionNotFinalized {
        require(bytes(_name).length > 0, "Empty name");
        require(bytes(_party).length > 0, "Empty party");
        require(totalCandidates < MAX_CANDIDATES, "Max candidates reached");
        require(!votingOpen, "Cannot add during voting");
        require(currentElection.isActive, "No active election");
        
        totalCandidates++;
        candidates[totalCandidates] = Candidate({
            name: _name,
            party: _party,
            voteCount: 0,
            isActive: true,
            addedAt: uint32(block.timestamp)
        });
        
        emit CandidateAdded(totalCandidates, _name, _party, msg.sender);
    }
    
    function deactivateCandidate(uint32 _candidateID) 
        external 
        onlyCommissioner 
        whenNotPaused 
        validCandidate(_candidateID) 
        electionNotFinalized 
    {
        require(!votingOpen, "Cannot deactivate during voting");
        candidates[_candidateID].isActive = false;
    }
    
    // ==================== VOTER MANAGEMENT ====================
    
    function registerVoter(address _voterAddress) 
        external 
        onlyAdmin 
        registrationIsOpen 
        whenNotPaused 
        electionNotFinalized 
    {
        require(_voterAddress != address(0), "Invalid address");
        require(!voters[_voterAddress].isRegistered, "Already registered");
        
        voters[_voterAddress] = Voter({
            isRegistered: true,
            hasVoted: false,
            candidateVoted: 0,
            voterID: nextVoterID,
            registrationTime: uint32(block.timestamp)
        });
        
        voterToID[_voterAddress] = nextVoterID;
        idToVoter[nextVoterID] = _voterAddress;
        
        currentElection.totalVoters++;
        
        emit VoterRegistered(_voterAddress, nextVoterID, uint32(block.timestamp));
        nextVoterID++;
    }
    
    function selfRegister() 
        external 
        registrationIsOpen 
        whenNotPaused 
        electionNotFinalized 
    {
        require(!voters[msg.sender].isRegistered, "Already registered");
        
        voters[msg.sender] = Voter({
            isRegistered: true,
            hasVoted: false,
            candidateVoted: 0,
            voterID: nextVoterID,
            registrationTime: uint32(block.timestamp)
        });
        
        voterToID[msg.sender] = nextVoterID;
        idToVoter[nextVoterID] = msg.sender;
        
        currentElection.totalVoters++;
        
        emit VoterRegistered(msg.sender, nextVoterID, uint32(block.timestamp));
        nextVoterID++;
    }
    
    // ==================== VOTING ====================
    
    function vote(uint32 _candidateID) 
        external 
        votingIsOpen 
        onlyRegisteredVoter 
        hasNotVoted 
        validCandidate(_candidateID) 
        whenNotPaused 
        electionNotFinalized 
    {
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].candidateVoted = _candidateID;
        
        candidates[_candidateID].voteCount++;
        currentElection.totalVotes++;
        
        emit VoteCast(msg.sender, _candidateID, uint32(block.timestamp));
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function checkRole(address _user, Role _role) external view returns (bool) {
        return users[_user].role == _role && users[_user].isActive;
    }
    
    function getVoterInfo(address _voterAddress) 
        external 
        view 
        returns (
            bool isRegistered,
            bool hasVoted,
            uint32 candidateVoted,
            uint32 voterID,
            uint32 registrationTime
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
    
    function getCandidateInfo(uint32 _candidateID) 
        external 
        view 
        returns (
            string memory name,
            string memory party,
            uint32 voteCount,
            bool isActive
        ) 
    {
        require(_candidateID > 0 && _candidateID <= totalCandidates, "Invalid candidate");
        Candidate memory candidate = candidates[_candidateID];
        return (candidate.name, candidate.party, candidate.voteCount, candidate.isActive);
    }
    
    function getElectionInfo() 
        external 
        view 
        returns (
            string memory title,
            uint32 startTime,
            uint32 endTime,
            uint32 registrationDeadline,
            bool isActive,
            bool isFinalized,
            uint32 totalVotersCount,
            uint32 totalVotes,
            uint32 winnerID
        ) 
    {
        return (
            currentElection.title,
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
    
    function getElectionStatus() 
        external 
        view 
        returns (
            bool registrationActive,
            bool votingActive,
            uint32 timeUntilStart,
            uint32 timeUntilEnd
        ) 
    {
        registrationActive = registrationOpen && block.timestamp <= currentElection.registrationDeadline;
        votingActive = votingOpen && 
                      block.timestamp >= currentElection.startTime && 
                      block.timestamp <= currentElection.endTime;
        
        timeUntilStart = currentElection.startTime > block.timestamp ? 
                        currentElection.startTime - uint32(block.timestamp) : 0;
        timeUntilEnd = currentElection.endTime > block.timestamp ? 
                      currentElection.endTime - uint32(block.timestamp) : 0;
    }
    
    function getCurrentWinner() 
        external 
        view 
        returns (
            uint32 winnerID,
            string memory winnerName,
            string memory winnerParty,
            uint32 maxVotes
        ) 
    {
        require(totalCandidates > 0, "No candidates");
        
        winnerID = _calculateWinner();
        maxVotes = candidates[winnerID].voteCount;
        
        if (winnerID > 0) {
            winnerName = candidates[winnerID].name;
            winnerParty = candidates[winnerID].party;
        }
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    function _calculateWinner() internal view returns (uint32) {
        require(totalCandidates > 0, "No candidates");
        
        uint32 winnerID = 1;
        uint32 maxVotes = candidates[1].voteCount;
        
        for (uint32 i = 2; i <= totalCandidates; i++) {
            if (candidates[i].isActive && candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winnerID = i;
            }
        }
        
        return winnerID;
    }
}