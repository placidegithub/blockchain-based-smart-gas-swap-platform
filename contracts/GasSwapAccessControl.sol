// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title GasSwapAccessControl
 * @dev Role-based access control for the Gas Cylinder Swap Platform
 * 
 * Roles:
 * - PLATFORM_ADMIN: Can manage companies, pause system
 * - COMPANY_ADMIN: Can manage branches and staff for their company
 * - BRANCH_STAFF: Can create and redeem vouchers
 */
contract GasSwapAccessControl is AccessControl, Pausable {
    
    // Role definitions
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");
    bytes32 public constant COMPANY_ADMIN_ROLE = keccak256("COMPANY_ADMIN_ROLE");
    bytes32 public constant BRANCH_STAFF_ROLE = keccak256("BRANCH_STAFF_ROLE");
    
    // Mapping: staff address => company ID
    mapping(address => uint256) public staffCompany;
    
    // Mapping: staff address => branch ID
    mapping(address => uint256) public staffBranch;
    
    // Events
    event StaffAssigned(address indexed staff, uint256 indexed companyId, uint256 indexed branchId);
    event StaffRemoved(address indexed staff);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Assign a company admin
     * @param admin Address to grant company admin role
     * @param companyId Company ID the admin manages
     */
    function assignCompanyAdmin(address admin, uint256 companyId) 
        external 
        onlyRole(PLATFORM_ADMIN_ROLE) 
    {
        require(admin != address(0), "Invalid address");
        require(companyId > 0, "Invalid company ID");
        
        _grantRole(COMPANY_ADMIN_ROLE, admin);
        staffCompany[admin] = companyId;
        
        emit StaffAssigned(admin, companyId, 0);
    }
    
    /**
     * @dev Assign a branch staff member
     * @param staff Address to grant branch staff role
     * @param companyId Company ID
     * @param branchId Branch ID the staff works at
     */
    function assignBranchStaff(address staff, uint256 companyId, uint256 branchId) 
        external 
    {
        require(staff != address(0), "Invalid address");
        require(companyId > 0, "Invalid company ID");
        require(branchId > 0, "Invalid branch ID");
        
        // Only platform admin or company admin of same company can assign
        require(
            hasRole(PLATFORM_ADMIN_ROLE, msg.sender) ||
            (hasRole(COMPANY_ADMIN_ROLE, msg.sender) && staffCompany[msg.sender] == companyId),
            "Not authorized to assign staff"
        );
        
        _grantRole(BRANCH_STAFF_ROLE, staff);
        staffCompany[staff] = companyId;
        staffBranch[staff] = branchId;
        
        emit StaffAssigned(staff, companyId, branchId);
    }
    
    /**
     * @dev Remove staff member
     * @param staff Address to remove
     */
    function removeStaff(address staff) external {
        uint256 companyId = staffCompany[staff];
        
        require(
            hasRole(PLATFORM_ADMIN_ROLE, msg.sender) ||
            (hasRole(COMPANY_ADMIN_ROLE, msg.sender) && staffCompany[msg.sender] == companyId),
            "Not authorized to remove staff"
        );
        
        _revokeRole(BRANCH_STAFF_ROLE, staff);
        _revokeRole(COMPANY_ADMIN_ROLE, staff);
        
        delete staffCompany[staff];
        delete staffBranch[staff];
        
        emit StaffRemoved(staff);
    }
    
    /**
     * @dev Pause the system (emergency stop)
     */
    function pause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the system
     */
    function unpause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Check if address is staff of a specific company
     */
    function isCompanyStaff(address staff, uint256 companyId) public view returns (bool) {
        return staffCompany[staff] == companyId && 
               (hasRole(BRANCH_STAFF_ROLE, staff) || hasRole(COMPANY_ADMIN_ROLE, staff));
    }
    
    /**
     * @dev Check if address is staff of a specific branch
     */
    function isBranchStaff(address staff, uint256 branchId) public view returns (bool) {
        return staffBranch[staff] == branchId && hasRole(BRANCH_STAFF_ROLE, staff);
    }
    
    /**
     * @dev Get staff's company ID
     */
    function getStaffCompany(address staff) external view returns (uint256) {
        return staffCompany[staff];
    }
    
    /**
     * @dev Get staff's branch ID
     */
    function getStaffBranch(address staff) external view returns (uint256) {
        return staffBranch[staff];
    }
}
