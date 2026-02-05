// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CylinderRegistry
 * @dev NFT-based registry for physical gas cylinders
 * 
 * Each physical cylinder is represented as an NFT with metadata
 * tracking its location, status, and history.
 */
contract CylinderRegistry is ERC721, ERC721Enumerable, AccessControl, Pausable {
    
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");
    bytes32 public constant BRANCH_STAFF_ROLE = keccak256("BRANCH_STAFF_ROLE");
    
    // Cylinder status enum
    enum CylinderStatus {
        IN_BRANCH,      // Cylinder is at a branch, available for swap
        IN_TRANSIT,     // Cylinder is being transferred
        WITH_CUSTOMER,  // Cylinder is with a customer (deposited for voucher)
        MAINTENANCE,    // Cylinder is under maintenance/inspection
        RETIRED         // Cylinder is no longer in service
    }
    
    // Cylinder data structure
    struct CylinderData {
        uint256 companyId;
        uint256 cylinderTypeId;    // Reference to cylinder type (6kg, 12kg, 15kg)
        string serialNumber;        // Physical serial number on cylinder
        uint256 currentBranchId;    // Current location (branch ID)
        CylinderStatus status;
        uint256 manufacturingDate;
        uint256 lastInspectionDate;
        uint256 registeredAt;
    }
    
    // Transfer record for history tracking
    struct TransferRecord {
        uint256 fromBranchId;
        uint256 toBranchId;
        address initiatedBy;
        uint256 timestamp;
        string reason;
    }
    
    // State variables
    uint256 private _tokenIdCounter;
    
    // Mappings
    mapping(uint256 => CylinderData) public cylinderData;
    mapping(string => uint256) public serialNumberToTokenId;  // Serial number lookup
    mapping(uint256 => TransferRecord[]) public cylinderHistory;
    
    // Events
    event CylinderRegistered(
        uint256 indexed tokenId,
        uint256 indexed companyId,
        uint256 cylinderTypeId,
        string serialNumber,
        uint256 branchId
    );
    
    event CylinderStatusChanged(
        uint256 indexed tokenId,
        CylinderStatus oldStatus,
        CylinderStatus newStatus,
        uint256 branchId
    );
    
    event CylinderTransferred(
        uint256 indexed tokenId,
        uint256 fromBranchId,
        uint256 toBranchId,
        address initiatedBy
    );
    
    event CylinderInspected(uint256 indexed tokenId, uint256 inspectionDate);
    
    constructor() ERC721("GasCylinder", "GCYL") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Register a new physical cylinder on the blockchain
     * @param companyId Company that owns this cylinder
     * @param cylinderTypeId Type ID (6kg, 12kg, 15kg)
     * @param serialNumber Physical serial number
     * @param branchId Initial branch location
     * @param manufacturingDate Manufacturing date timestamp
     */
    function registerCylinder(
        uint256 companyId,
        uint256 cylinderTypeId,
        string memory serialNumber,
        uint256 branchId,
        uint256 manufacturingDate
    ) external onlyRole(BRANCH_STAFF_ROLE) whenNotPaused returns (uint256) {
        require(companyId > 0, "Invalid company ID");
        require(cylinderTypeId > 0, "Invalid cylinder type");
        require(bytes(serialNumber).length > 0, "Serial number required");
        require(branchId > 0, "Invalid branch ID");
        require(serialNumberToTokenId[serialNumber] == 0, "Serial number already registered");
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        // Store cylinder data
        cylinderData[tokenId] = CylinderData({
            companyId: companyId,
            cylinderTypeId: cylinderTypeId,
            serialNumber: serialNumber,
            currentBranchId: branchId,
            status: CylinderStatus.IN_BRANCH,
            manufacturingDate: manufacturingDate,
            lastInspectionDate: block.timestamp,
            registeredAt: block.timestamp
        });
        
        // Map serial number to token ID
        serialNumberToTokenId[serialNumber] = tokenId;
        
        // Mint NFT to contract (cylinders are owned by the platform)
        // Using _mint instead of _safeMint since we're minting to this contract
        _mint(address(this), tokenId);
        
        emit CylinderRegistered(tokenId, companyId, cylinderTypeId, serialNumber, branchId);
        
        return tokenId;
    }
    
    /**
     * @dev Update cylinder status (used during deposit/redemption)
     * @param tokenId Cylinder token ID
     * @param newStatus New status
     * @param branchId Branch where status change occurs
     */
    function updateCylinderStatus(
        uint256 tokenId,
        CylinderStatus newStatus,
        uint256 branchId
    ) external onlyRole(BRANCH_STAFF_ROLE) whenNotPaused {
        require(_exists(tokenId), "Cylinder does not exist");
        
        CylinderData storage cylinder = cylinderData[tokenId];
        CylinderStatus oldStatus = cylinder.status;
        
        cylinder.status = newStatus;
        cylinder.currentBranchId = branchId;
        
        // Record in history
        cylinderHistory[tokenId].push(TransferRecord({
            fromBranchId: cylinder.currentBranchId,
            toBranchId: branchId,
            initiatedBy: msg.sender,
            timestamp: block.timestamp,
            reason: _statusToString(newStatus)
        }));
        
        emit CylinderStatusChanged(tokenId, oldStatus, newStatus, branchId);
    }
    
    /**
     * @dev Transfer cylinder between branches
     * @param tokenId Cylinder token ID
     * @param fromBranchId Source branch
     * @param toBranchId Destination branch
     */
    function transferCylinder(
        uint256 tokenId,
        uint256 fromBranchId,
        uint256 toBranchId
    ) external onlyRole(BRANCH_STAFF_ROLE) whenNotPaused {
        require(_exists(tokenId), "Cylinder does not exist");
        require(fromBranchId != toBranchId, "Same branch transfer");
        
        CylinderData storage cylinder = cylinderData[tokenId];
        require(cylinder.currentBranchId == fromBranchId, "Cylinder not at source branch");
        require(cylinder.status == CylinderStatus.IN_BRANCH, "Cylinder not available");
        
        cylinder.currentBranchId = toBranchId;
        
        // Record transfer in history
        cylinderHistory[tokenId].push(TransferRecord({
            fromBranchId: fromBranchId,
            toBranchId: toBranchId,
            initiatedBy: msg.sender,
            timestamp: block.timestamp,
            reason: "Inter-branch transfer"
        }));
        
        emit CylinderTransferred(tokenId, fromBranchId, toBranchId, msg.sender);
    }
    
    /**
     * @dev Record cylinder inspection
     * @param tokenId Cylinder token ID
     */
    function recordInspection(uint256 tokenId) external onlyRole(BRANCH_STAFF_ROLE) {
        require(_exists(tokenId), "Cylinder does not exist");
        
        cylinderData[tokenId].lastInspectionDate = block.timestamp;
        
        emit CylinderInspected(tokenId, block.timestamp);
    }
    
    /**
     * @dev Retire a cylinder
     * @param tokenId Cylinder token ID
     */
    function retireCylinder(uint256 tokenId) external onlyRole(PLATFORM_ADMIN_ROLE) {
        require(_exists(tokenId), "Cylinder does not exist");
        
        cylinderData[tokenId].status = CylinderStatus.RETIRED;
        
        emit CylinderStatusChanged(
            tokenId, 
            cylinderData[tokenId].status, 
            CylinderStatus.RETIRED, 
            cylinderData[tokenId].currentBranchId
        );
    }
    
    // View functions
    
    function getCylinder(uint256 tokenId) external view returns (CylinderData memory) {
        require(_exists(tokenId), "Cylinder does not exist");
        return cylinderData[tokenId];
    }
    
    function getCylinderBySerial(string memory serialNumber) external view returns (uint256, CylinderData memory) {
        uint256 tokenId = serialNumberToTokenId[serialNumber];
        require(tokenId > 0, "Cylinder not found");
        return (tokenId, cylinderData[tokenId]);
    }
    
    function getCylinderHistory(uint256 tokenId) external view returns (TransferRecord[] memory) {
        return cylinderHistory[tokenId];
    }
    
    function isCylinderAvailable(uint256 tokenId) public view returns (bool) {
        if (!_exists(tokenId)) return false;
        return cylinderData[tokenId].status == CylinderStatus.IN_BRANCH;
    }
    
    function isCylinderAtBranch(uint256 tokenId, uint256 branchId) public view returns (bool) {
        if (!_exists(tokenId)) return false;
        CylinderData memory cylinder = cylinderData[tokenId];
        return cylinder.currentBranchId == branchId && cylinder.status == CylinderStatus.IN_BRANCH;
    }
    
    function getTotalCylinders() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Get all available cylinders at a specific branch
     * @param branchId Branch to query
     * @return serialNumbers Array of serial numbers of available cylinders
     * @return tokenIds Array of token IDs
     */
    function getAvailableCylindersAtBranch(uint256 branchId) external view returns (
        string[] memory serialNumbers,
        uint256[] memory tokenIds
    ) {
        // First count available cylinders
        uint256 count = 0;
        for (uint256 i = 1; i <= _tokenIdCounter; i++) {
            if (cylinderData[i].currentBranchId == branchId && 
                cylinderData[i].status == CylinderStatus.IN_BRANCH) {
                count++;
            }
        }
        
        // Build arrays
        serialNumbers = new string[](count);
        tokenIds = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= _tokenIdCounter; i++) {
            if (cylinderData[i].currentBranchId == branchId && 
                cylinderData[i].status == CylinderStatus.IN_BRANCH) {
                serialNumbers[index] = cylinderData[i].serialNumber;
                tokenIds[index] = i;
                index++;
            }
        }
        
        return (serialNumbers, tokenIds);
    }
    
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId > 0 && tokenId <= _tokenIdCounter;
    }
    
    function _statusToString(CylinderStatus status) internal pure returns (string memory) {
        if (status == CylinderStatus.IN_BRANCH) return "In Branch";
        if (status == CylinderStatus.IN_TRANSIT) return "In Transit";
        if (status == CylinderStatus.WITH_CUSTOMER) return "With Customer";
        if (status == CylinderStatus.MAINTENANCE) return "Maintenance";
        if (status == CylinderStatus.RETIRED) return "Retired";
        return "Unknown";
    }
    
    // Required overrides
    
    function pause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _unpause();
    }
    
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
