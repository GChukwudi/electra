// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ElectraAccessControl {
    
    // ==================== ENUMS ====================
    
    /**
     * @dev User roles in the Electra system
     */
    enum Role {
        NONE,           // No role assigned
        VOTER,          // Can register and vote
        OBSERVER,       // Can view results only
        ADMIN,          // Can manage candidates and view stats
        COMMISSIONER    // Full system control
    }
    
    // ==================== STRUCTS ====================
    
    /**
     * @dev User information structure
     */
    struct User {
        Role role;
        bool isActive;
        uint256 assignedAt;
        address assignedBy;
    }
    
    // ==================== STATE VARIABLES ====================
    
    mapping(address => User) public users;
    address public systemOwner;
    address public currentCommissioner;
    
    // Role counters
    uint256 public totalAdmins;
    uint256 public totalVoters;
    uint256 public totalObservers;
    
    // Emergency controls
    bool public systemPaused = false;
    bool public emergencyMode = false;
    
    // ==================== EVENTS ====================
    
    event RoleAssigned(address indexed user, Role indexed role, address indexed assignedBy);
    event RoleRevoked(address indexed user, Role indexed oldRole, address indexed revokedBy);
    event CommissionerChanged(address indexed oldCommissioner, address indexed newCommissioner);
    event SystemPaused(address indexed pausedBy);
    event SystemUnpaused(address indexed unpausedBy);
    event EmergencyActivated(address indexed activatedBy);
    event EmergencyDeactivated(address indexed deactivatedBy);
    
    // ==================== MODIFIERS ====================
    
    modifier onlyOwner() {
        require(msg.sender == systemOwner, "Only system owner can perform this action");
        _;
    }
    
    modifier onlyCommissioner() {
        require(msg.sender == currentCommissioner, "Only commissioner can perform this action");
        _;
    }
    
    modifier onlyCommissionerOrOwner() {
        require(
            msg.sender == currentCommissioner || msg.sender == systemOwner,
            "Only commissioner or owner can perform this action"
        );
        _;
    }
    
    modifier onlyAdmin() {
        require(
            users[msg.sender].role == Role.ADMIN || 
            users[msg.sender].role == Role.COMMISSIONER ||
            msg.sender == systemOwner,
            "Admin access required"
        );
        _;
    }
    
    modifier hasRole(Role _role) {
        require(users[msg.sender].role == _role, "Insufficient role permissions");
        _;
    }
    
    modifier hasAnyRole(Role _role1, Role _role2) {
        require(
            users[msg.sender].role == _role1 || users[msg.sender].role == _role2,
            "Insufficient role permissions"
        );
        _;
    }
    
    modifier whenNotPaused() {
        require(!systemPaused, "System is currently paused");
        _;
    }
    
    modifier whenPaused() {
        require(systemPaused, "System is not paused");
        _;
    }
    
    modifier whenNotEmergency() {
        require(!emergencyMode, "System is in emergency mode");
        _;
    }
    
    modifier onlyActiveUser() {
        require(users[msg.sender].isActive, "User account is not active");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        systemOwner = msg.sender;
        currentCommissioner = msg.sender;
        
        // Assign owner as commissioner
        users[msg.sender] = User({
            role: Role.COMMISSIONER,
            isActive: true,
            assignedAt: block.timestamp,
            assignedBy: msg.sender
        });
        
        emit RoleAssigned(msg.sender, Role.COMMISSIONER, msg.sender);
    }
    
    // ==================== ROLE MANAGEMENT ====================
    
    /**
     * @dev Assign a role to a user
     * @param _user Address of the user
     * @param _role Role to assign
     */
    function assignRole(address _user, Role _role) 
        external 
        onlyCommissionerOrOwner 
        whenNotPaused 
    {
        require(_user != address(0), "Invalid user address");
        require(_role != Role.NONE, "Cannot assign NONE role");
        require(_user != systemOwner || _role == Role.COMMISSIONER, "Owner must be commissioner");
        
        // Special handling for commissioner role
        if (_role == Role.COMMISSIONER) {
            require(msg.sender == systemOwner, "Only owner can assign commissioner role");
            require(_user != currentCommissioner, "User is already commissioner");
        }
        
        Role oldRole = users[_user].role;
        
        // Update role counters
        _updateRoleCounters(oldRole, _role, true);
        
        // Assign new role
        users[_user] = User({
            role: _role,
            isActive: true,
            assignedAt: block.timestamp,
            assignedBy: msg.sender
        });
        
        // Handle commissioner change
        if (_role == Role.COMMISSIONER && _user != currentCommissioner) {
            address oldCommissioner = currentCommissioner;
            currentCommissioner = _user;
            emit CommissionerChanged(oldCommissioner, _user);
        }
        
        emit RoleAssigned(_user, _role, msg.sender);
    }
    
    /**
     * @dev Revoke a user's role
     * @param _user Address of the user
     */
    function revokeRole(address _user) 
        external 
        onlyCommissionerOrOwner 
        whenNotPaused 
    {
        require(_user != address(0), "Invalid user address");
        require(_user != systemOwner, "Cannot revoke owner's role");
        require(_user != currentCommissioner, "Cannot revoke commissioner's role");
        require(users[_user].role != Role.NONE, "User has no role to revoke");
        
        Role oldRole = users[_user].role;
        
        // Update role counters
        _updateRoleCounters(oldRole, Role.NONE, false);
        
        // Revoke role
        users[_user] = User({
            role: Role.NONE,
            isActive: false,
            assignedAt: 0,
            assignedBy: address(0)
        });
        
        emit RoleRevoked(_user, oldRole, msg.sender);
    }
    
    /**
     * @dev Deactivate a user without changing their role
     * @param _user Address of the user
     */
    function deactivateUser(address _user) 
        external 
        onlyCommissionerOrOwner 
        whenNotPaused 
    {
        require(_user != address(0), "Invalid user address");
        require(_user != systemOwner, "Cannot deactivate owner");
        require(_user != currentCommissioner, "Cannot deactivate commissioner");
        require(users[_user].isActive, "User is already inactive");
        
        users[_user].isActive = false;
    }
    
    /**
     * @dev Reactivate a user
     * @param _user Address of the user
     */
    function reactivateUser(address _user) 
        external 
        onlyCommissionerOrOwner 
        whenNotPaused 
    {
        require(_user != address(0), "Invalid user address");
        require(!users[_user].isActive, "User is already active");
        require(users[_user].role != Role.NONE, "User has no role assigned");
        
        users[_user].isActive = true;
    }
    
    // ==================== SYSTEM CONTROLS ====================
    
    /**
     * @dev Pause the entire system
     */
    function pauseSystem() external onlyCommissionerOrOwner {
        require(!systemPaused, "System is already paused");
        systemPaused = true;
        emit SystemPaused(msg.sender);
    }
    
    /**
     * @dev Unpause the system
     */
    function unpauseSystem() external onlyCommissionerOrOwner {
        require(systemPaused, "System is not paused");
        systemPaused = false;
        emit SystemUnpaused(msg.sender);
    }
    
    /**
     * @dev Activate emergency mode
     */
    function activateEmergency() external onlyCommissionerOrOwner {
        require(!emergencyMode, "Emergency mode is already active");
        emergencyMode = true;
        systemPaused = true; // Auto-pause system in emergency
        emit EmergencyActivated(msg.sender);
    }
    
    /**
     * @dev Deactivate emergency mode
     */
    function deactivateEmergency() external onlyOwner {
        require(emergencyMode, "Emergency mode is not active");
        emergencyMode = false;
        emit EmergencyDeactivated(msg.sender);
    }
    
    /**
     * @dev Transfer system ownership (emergency only)
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        require(_newOwner != systemOwner, "New owner is the same as current owner");
        
        address oldOwner = systemOwner;
        systemOwner = _newOwner;
        
        // Update new owner's role
        users[_newOwner] = User({
            role: Role.COMMISSIONER,
            isActive: true,
            assignedAt: block.timestamp,
            assignedBy: oldOwner
        });
        
        // Update old owner's role
        users[oldOwner] = User({
            role: Role.ADMIN,
            isActive: true,
            assignedAt: block.timestamp,
            assignedBy: _newOwner
        });
        
        currentCommissioner = _newOwner;
        emit CommissionerChanged(oldOwner, _newOwner);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Check if a user has a specific role
     * @param _user Address of the user
     * @param _role Role to check
     * @return Whether the user has the role
     */
    function checkRole(address _user, Role _role) external view returns (bool) {
        return users[_user].role == _role && users[_user].isActive;
    }
    
    /**
     * @dev Check if a user has any of the specified roles
     * @param _user Address of the user
     * @param _roles Array of roles to check
     * @return Whether the user has any of the roles
     */
    function onlyAnyRole(address _user, Role[] memory _roles) external view returns (bool) {
        if (!users[_user].isActive) return false;
        
        Role userRole = users[_user].role;
        for (uint i = 0; i < _roles.length; i++) {
            if (userRole == _roles[i]) return true;
        }
        return false;
    }
    
    // /**
    //  * @dev Get user information
    //  * @param _user Address of the user
    //  * @return User information
    //  */
    function getUserInfo(address _user) 
        external 
        view 
        returns (Role role, bool isActive, uint256 assignedAt, address assignedBy) 
    {
        User memory user = users[_user];
        return (user.role, user.isActive, user.assignedAt, user.assignedBy);
    }
    
    // /**
    //  * @dev Get system statistics
    //  * @return System statistics
    //  */
    function getSystemStats() 
        external 
        view 
        returns (
            uint256 admins,
            uint256 voters,
            uint256 observers,
            bool paused,
            bool emergency,
            address owner,
            address commissioner
        ) 
    {
        return (
            totalAdmins,
            totalVoters,
            totalObservers,
            systemPaused,
            emergencyMode,
            systemOwner,
            currentCommissioner
        );
    }
    
    /**
     * @dev Check if system is operational
     * @return Whether system is operational
     */
    function isSystemOperational() external view returns (bool) {
        return !systemPaused && !emergencyMode;
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @dev Update role counters when roles change
     * @param _oldRole Previous role
     * @param _newRole New role
     * @param _isAssignment Whether this is an assignment (true) or revocation (false)
     */
    function _updateRoleCounters(Role _oldRole, Role _newRole, bool _isAssignment) internal {
        // Decrease old role counter
        if (_oldRole == Role.ADMIN) totalAdmins--;
        else if (_oldRole == Role.VOTER) totalVoters--;
        else if (_oldRole == Role.OBSERVER) totalObservers--;
        
        // Increase new role counter (only for assignments)
        if (_isAssignment) {
            if (_newRole == Role.ADMIN) totalAdmins++;
            else if (_newRole == Role.VOTER) totalVoters++;
            else if (_newRole == Role.OBSERVER) totalObservers++;
        }
    }
}
