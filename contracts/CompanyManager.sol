// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GasSwapAccessControl.sol";

/**
 * @title CompanyManager
 * @dev Manages gas companies and their branches in Rwanda
 * 
 * Companies: Kigaligas, Hash Gas, Meru Gas, Jibu Gas, SP, Oryx, Tahacel
 * Branches: Physical locations across all 30 districts
 */
contract CompanyManager is GasSwapAccessControl {
    
    // Structs
    struct Company {
        uint256 id;
        string name;
        string code;           // Short code like "KIGALIGAS", "HASH"
        bool isActive;
        address adminWallet;
        uint256 createdAt;
    }
    
    struct Branch {
        uint256 id;
        uint256 companyId;
        string name;
        string district;       // Rwanda district name
        string location;       // Specific address
        bool isActive;
        uint256 createdAt;
    }
    
    struct CylinderType {
        uint256 id;
        uint256 companyId;
        string name;           // "6kg LPG", "12kg LPG", "15kg LPG"
        uint256 capacityKg;    // 6, 12, or 15
        uint256 depositAmount; // Deposit value in wei (optional)
        bool isActive;
    }
    
    // State variables
    uint256 public companyCount;
    uint256 public branchCount;
    uint256 public cylinderTypeCount;
    
    // Mappings
    mapping(uint256 => Company) public companies;
    mapping(uint256 => Branch) public branches;
    mapping(uint256 => CylinderType) public cylinderTypes;
    
    // Company code to ID mapping for quick lookup
    mapping(string => uint256) public companyCodeToId;
    
    // Branch inventory: branchId => cylinderTypeId => count
    mapping(uint256 => mapping(uint256 => uint256)) public branchInventory;
    
    // Company to branches mapping
    mapping(uint256 => uint256[]) public companyBranches;
    
    // Events
    event CompanyRegistered(uint256 indexed companyId, string name, string code);
    event CompanyUpdated(uint256 indexed companyId, bool isActive);
    event BranchRegistered(uint256 indexed branchId, uint256 indexed companyId, string name, string district);
    event BranchUpdated(uint256 indexed branchId, bool isActive);
    event CylinderTypeRegistered(uint256 indexed typeId, uint256 indexed companyId, uint256 capacityKg);
    event InventoryUpdated(uint256 indexed branchId, uint256 indexed cylinderTypeId, uint256 newCount);
    
    // Rwanda districts - 30 districts across all provinces
    string[30] private RWANDA_DISTRICTS = [
        "Bugesera",    // Eastern
        "Burera",      // Northern
        "Gakenke",     // Northern
        "Gasabo",      // Kigali City
        "Gatsibo",     // Eastern
        "Gicumbi",     // Northern
        "Gisagara",    // Southern
        "Huye",        // Southern
        "Kamonyi",     // Southern
        "Karongi",     // Western
        "Kayonza",     // Eastern
        "Kicukiro",    // Kigali City
        "Kirehe",      // Eastern
        "Muhanga",     // Southern
        "Musanze",     // Northern
        "Ngoma",       // Eastern
        "Ngororero",   // Western
        "Nyabihu",     // Western
        "Nyagatare",   // Eastern
        "Nyamagabe",   // Southern
        "Nyamasheke",  // Western
        "Nyanza",      // Southern
        "Nyarugenge",  // Kigali City
        "Nyaruguru",   // Southern
        "Rubavu",      // Western
        "Ruhango",     // Southern
        "Rulindo",     // Northern
        "Rusizi",      // Western
        "Rutsiro",     // Western
        "Rwamagana"    // Eastern
    ];
    
    constructor() {
        // Initialize with default Rwanda gas companies
        _registerDefaultCompanies();
    }
    
    /**
     * @dev Register default gas companies in Rwanda
     * Each company gets branches in all 30 districts = 210 total branches
     */
    function _registerDefaultCompanies() internal {
        _registerCompany("SP Rwanda", "SP", address(0));
        _registerCompany("Oryx Energies", "ORYX", address(0));
        _registerCompany("Tahacel Gas", "TAHACEL", address(0));
        _registerCompany("Kigaligas", "KIGALIGAS", address(0));
        _registerCompany("Hash Gas", "HASH", address(0));
        _registerCompany("Meru Gas", "MERU", address(0));
        _registerCompany("Jibu Gas", "JIBU", address(0));
    }
    
    // Track which companies have had branches initialized
    mapping(uint256 => bool) public companyBranchesInitialized;
    
    /**
     * @dev Internal function to register a company
     */
    function _registerCompany(string memory name, string memory code, address admin) internal {
        companyCount++;
        
        companies[companyCount] = Company({
            id: companyCount,
            name: name,
            code: code,
            isActive: true,
            adminWallet: admin,
            createdAt: block.timestamp
        });
        
        companyCodeToId[code] = companyCount;
        
        // Register default cylinder types for the company
        _registerDefaultCylinderTypes(companyCount);
        
        emit CompanyRegistered(companyCount, name, code);
    }
    
    /**
     * @dev Initialize branches for a company in all 30 districts
     * Called after deployment to avoid gas limits
     * Can be called by platform admin or anyone (one-time initialization)
     */
    function initializeCompanyBranches(uint256 companyId) external {
        require(companyId > 0 && companyId <= companyCount, "Invalid company");
        require(!companyBranchesInitialized[companyId], "Branches already initialized");
        require(companies[companyId].isActive, "Company not active");
        
        string memory companyName = companies[companyId].name;
        
        for (uint256 i = 0; i < 30; i++) {
            branchCount++;
            
            string memory branchName = string(abi.encodePacked(companyName, " - ", RWANDA_DISTRICTS[i], " Branch"));
            
            branches[branchCount] = Branch({
                id: branchCount,
                companyId: companyId,
                name: branchName,
                district: RWANDA_DISTRICTS[i],
                location: string(abi.encodePacked(RWANDA_DISTRICTS[i], " District, Rwanda")),
                isActive: true,
                createdAt: block.timestamp
            });
            
            companyBranches[companyId].push(branchCount);
            
            emit BranchRegistered(branchCount, companyId, branchName, RWANDA_DISTRICTS[i]);
        }
        
        companyBranchesInitialized[companyId] = true;
    }
    
    /**
     * @dev Initialize branches for all companies (convenience function)
     * Calls initializeCompanyBranches for each company
     */
    function initializeAllBranches() external {
        for (uint256 c = 1; c <= companyCount; c++) {
            if (!companyBranchesInitialized[c] && companies[c].isActive) {
                this.initializeCompanyBranches(c);
            }
        }
    }
    
    /**
     * @dev Register default cylinder types (6kg, 12kg, 15kg)
     */
    function _registerDefaultCylinderTypes(uint256 companyId) internal {
        // 6kg cylinder
        cylinderTypeCount++;
        cylinderTypes[cylinderTypeCount] = CylinderType({
            id: cylinderTypeCount,
            companyId: companyId,
            name: "6kg LPG",
            capacityKg: 6,
            depositAmount: 0,
            isActive: true
        });
        emit CylinderTypeRegistered(cylinderTypeCount, companyId, 6);
        
        // 12kg cylinder
        cylinderTypeCount++;
        cylinderTypes[cylinderTypeCount] = CylinderType({
            id: cylinderTypeCount,
            companyId: companyId,
            name: "12kg LPG",
            capacityKg: 12,
            depositAmount: 0,
            isActive: true
        });
        emit CylinderTypeRegistered(cylinderTypeCount, companyId, 12);
        
        // 15kg cylinder
        cylinderTypeCount++;
        cylinderTypes[cylinderTypeCount] = CylinderType({
            id: cylinderTypeCount,
            companyId: companyId,
            name: "15kg LPG",
            capacityKg: 15,
            depositAmount: 0,
            isActive: true
        });
        emit CylinderTypeRegistered(cylinderTypeCount, companyId, 15);
    }
    
    /**
     * @dev Register a new company (Platform Admin only)
     */
    function registerCompany(
        string memory name,
        string memory code,
        address adminWallet
    ) external onlyRole(PLATFORM_ADMIN_ROLE) {
        require(bytes(name).length > 0, "Name required");
        require(bytes(code).length > 0, "Code required");
        require(companyCodeToId[code] == 0, "Company code already exists");
        
        _registerCompany(name, code, adminWallet);
        
        if (adminWallet != address(0)) {
            _grantRole(COMPANY_ADMIN_ROLE, adminWallet);
            staffCompany[adminWallet] = companyCount;
        }
    }
    
    /**
     * @dev Register a new branch
     */
    function registerBranch(
        uint256 companyId,
        string memory name,
        string memory district,
        string memory location
    ) external {
        require(companyId > 0 && companyId <= companyCount, "Invalid company");
        require(companies[companyId].isActive, "Company not active");
        require(bytes(name).length > 0, "Name required");
        require(bytes(district).length > 0, "District required");
        
        // Only platform admin or company admin can register branches
        require(
            hasRole(PLATFORM_ADMIN_ROLE, msg.sender) ||
            (hasRole(COMPANY_ADMIN_ROLE, msg.sender) && staffCompany[msg.sender] == companyId),
            "Not authorized"
        );
        
        branchCount++;
        
        branches[branchCount] = Branch({
            id: branchCount,
            companyId: companyId,
            name: name,
            district: district,
            location: location,
            isActive: true,
            createdAt: block.timestamp
        });
        
        companyBranches[companyId].push(branchCount);
        
        emit BranchRegistered(branchCount, companyId, name, district);
    }
    
    /**
     * @dev Update branch status
     */
    function updateBranchStatus(uint256 branchId, bool isActive) external {
        require(branchId > 0 && branchId <= branchCount, "Invalid branch");
        
        uint256 companyId = branches[branchId].companyId;
        
        require(
            hasRole(PLATFORM_ADMIN_ROLE, msg.sender) ||
            (hasRole(COMPANY_ADMIN_ROLE, msg.sender) && staffCompany[msg.sender] == companyId),
            "Not authorized"
        );
        
        branches[branchId].isActive = isActive;
        
        emit BranchUpdated(branchId, isActive);
    }
    
    /**
     * @dev Update branch inventory (called by VoucherManager)
     */
    function updateInventory(
        uint256 branchId,
        uint256 cylinderTypeId,
        int256 change
    ) external onlyRole(BRANCH_STAFF_ROLE) {
        require(branchId > 0 && branchId <= branchCount, "Invalid branch");
        require(cylinderTypeId > 0 && cylinderTypeId <= cylinderTypeCount, "Invalid cylinder type");
        
        if (change > 0) {
            branchInventory[branchId][cylinderTypeId] += uint256(change);
        } else if (change < 0) {
            uint256 decrease = uint256(-change);
            require(branchInventory[branchId][cylinderTypeId] >= decrease, "Insufficient inventory");
            branchInventory[branchId][cylinderTypeId] -= decrease;
        }
        
        emit InventoryUpdated(branchId, cylinderTypeId, branchInventory[branchId][cylinderTypeId]);
    }
    
    // View functions
    
    function getCompany(uint256 companyId) external view returns (Company memory) {
        return companies[companyId];
    }
    
    function getBranch(uint256 branchId) external view returns (Branch memory) {
        return branches[branchId];
    }
    
    function getCylinderType(uint256 typeId) external view returns (CylinderType memory) {
        return cylinderTypes[typeId];
    }
    
    function getCompanyByCode(string memory code) external view returns (Company memory) {
        uint256 companyId = companyCodeToId[code];
        require(companyId > 0, "Company not found");
        return companies[companyId];
    }
    
    function getCompanyBranches(uint256 companyId) external view returns (uint256[] memory) {
        return companyBranches[companyId];
    }
    
    function getBranchInventory(uint256 branchId, uint256 cylinderTypeId) external view returns (uint256) {
        return branchInventory[branchId][cylinderTypeId];
    }
    
    function isValidBranch(uint256 branchId) public view returns (bool) {
        return branchId > 0 && branchId <= branchCount && branches[branchId].isActive;
    }
    
    function isValidCompany(uint256 companyId) public view returns (bool) {
        return companyId > 0 && companyId <= companyCount && companies[companyId].isActive;
    }
    
    function isValidCylinderType(uint256 typeId) public view returns (bool) {
        return typeId > 0 && typeId <= cylinderTypeCount && cylinderTypes[typeId].isActive;
    }
    
    function getBranchCompany(uint256 branchId) external view returns (uint256) {
        return branches[branchId].companyId;
    }
    
    /**
     * @dev Get all active company IDs
     */
    function getAllActiveCompanies() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // Count active companies
        for (uint256 i = 1; i <= companyCount; i++) {
            if (companies[i].isActive) {
                activeCount++;
            }
        }
        
        // Build array of active company IDs
        uint256[] memory activeCompanyIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= companyCount; i++) {
            if (companies[i].isActive) {
                activeCompanyIds[index] = i;
                index++;
            }
        }
        
        return activeCompanyIds;
    }
    
    /**
     * @dev Get all active branch IDs for a company
     */
    function getAllActiveBranches(uint256 companyId) external view returns (uint256[] memory) {
        uint256[] memory allBranches = companyBranches[companyId];
        uint256 activeCount = 0;
        
        // Count active branches
        for (uint256 i = 0; i < allBranches.length; i++) {
            if (branches[allBranches[i]].isActive) {
                activeCount++;
            }
        }
        
        // Build array of active branch IDs
        uint256[] memory activeBranchIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allBranches.length; i++) {
            if (branches[allBranches[i]].isActive) {
                activeBranchIds[index] = allBranches[i];
                index++;
            }
        }
        
        return activeBranchIds;
    }
    
    /**
     * @dev Get cylinder types for a company
     */
    function getCompanyCylinderTypes(uint256 companyId) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // Count cylinder types for this company
        for (uint256 i = 1; i <= cylinderTypeCount; i++) {
            if (cylinderTypes[i].companyId == companyId && cylinderTypes[i].isActive) {
                count++;
            }
        }
        
        // Build array
        uint256[] memory typeIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= cylinderTypeCount; i++) {
            if (cylinderTypes[i].companyId == companyId && cylinderTypes[i].isActive) {
                typeIds[index] = i;
                index++;
            }
        }
        
        return typeIds;
    }
    
    /**
     * @dev Get all district names
     */
    function getAllDistricts() external view returns (string[30] memory) {
        return RWANDA_DISTRICTS;
    }
    
    /**
     * @dev Get branch by company and district index
     * @param companyId The company ID (1-7)
     * @param districtIndex The district index (0-29)
     * @return branchId The branch ID
     */
    function getBranchByCompanyAndDistrict(uint256 companyId, uint256 districtIndex) external view returns (uint256) {
        require(companyId > 0 && companyId <= companyCount, "Invalid company");
        require(districtIndex < 30, "Invalid district index");
        
        // Calculate branch ID: each company has 30 branches
        // Branch ID = (companyId - 1) * 30 + districtIndex + 1
        uint256 branchId = (companyId - 1) * 30 + districtIndex + 1;
        
        require(branchId <= branchCount, "Branch not found");
        return branchId;
    }
    
    /**
     * @dev Get all branches in a specific district (across all companies)
     * @param districtIndex The district index (0-29)
     * @return branchIds Array of branch IDs in that district
     */
    function getBranchesByDistrict(uint256 districtIndex) external view returns (uint256[] memory) {
        require(districtIndex < 30, "Invalid district index");
        
        uint256[] memory branchIds = new uint256[](companyCount);
        
        for (uint256 c = 1; c <= companyCount; c++) {
            // Each company's branch for this district
            branchIds[c - 1] = (c - 1) * 30 + districtIndex + 1;
        }
        
        return branchIds;
    }
    
    /**
     * @dev Get district name by index
     */
    function getDistrictName(uint256 districtIndex) external view returns (string memory) {
        require(districtIndex < 30, "Invalid district index");
        return RWANDA_DISTRICTS[districtIndex];
    }
    
    /**
     * @dev Get total number of branches (should be 210 for 7 companies × 30 districts)
     */
    function getTotalBranchCount() external view returns (uint256) {
        return branchCount;
    }
}
