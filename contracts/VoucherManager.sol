// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VoucherManager
 * @dev Core contract for managing gas cylinder swap vouchers
 * 
 * A voucher is created when a customer deposits a cylinder and can be
 * redeemed at any branch of the same company for an equivalent cylinder.
 */
contract VoucherManager is ERC721, ERC721Enumerable, AccessControl, Pausable, ReentrancyGuard {
    
    bytes32 public constant PLATFORM_ADMIN_ROLE = keccak256("PLATFORM_ADMIN_ROLE");
    bytes32 public constant BRANCH_STAFF_ROLE = keccak256("BRANCH_STAFF_ROLE");
    
    // Voucher status enum
    enum VoucherStatus {
        ACTIVE,     // Voucher is valid and can be redeemed
        REDEEMED,   // Voucher has been used
        EXPIRED,    // Voucher has expired (past validity period)
        CANCELLED   // Voucher was cancelled (refund scenario)
    }
    
    // Voucher data structure
    struct Voucher {
        uint256 id;
        uint256 depositedCylinderId;  // Token ID of deposited cylinder
        uint256 companyId;
        uint256 cylinderTypeId;       // Type of cylinder (6kg, 12kg, 15kg)
        uint256 sourceBranchId;       // Where cylinder was deposited
        address customer;              // Customer wallet address
        uint256 createdAt;
        uint256 expiresAt;
        VoucherStatus status;
        // Redemption details (filled when redeemed)
        uint256 redeemedCylinderId;
        uint256 redemptionBranchId;
        uint256 redeemedAt;
        address redeemedBy;           // Staff who processed redemption
    }
    
    // Customer information structure
    struct CustomerInfo {
        string name;
        string email;
        string phoneNumber;
    }
    
    // Company balance tracking
    struct CompanyBalance {
        uint256 totalDeposits;
        uint256 totalRedemptions;
        int256 netBalance;  // Deposits - Redemptions
    }
    
    // Constants
    uint256 public constant VOUCHER_VALIDITY_DAYS = 30;
    
    // State variables
    uint256 private _voucherIdCounter;
    
    // Mappings
    mapping(uint256 => Voucher) public vouchers;
    mapping(uint256 => CustomerInfo) public voucherCustomerInfo;
    mapping(uint256 => CompanyBalance) public companyBalances;
    mapping(address => uint256[]) public customerVouchers;  // Customer's voucher history
    
    // Branch statistics
    mapping(uint256 => uint256) public branchDeposits;
    mapping(uint256 => uint256) public branchRedemptions;
    
    // Events
    event VoucherCreated(
        uint256 indexed voucherId,
        address indexed customer,
        uint256 indexed companyId,
        uint256 cylinderTypeId,
        uint256 sourceBranchId,
        uint256 depositedCylinderId,
        uint256 expiresAt,
        string customerName
    );
    
    event VoucherRedeemed(
        uint256 indexed voucherId,
        address indexed customer,
        uint256 indexed redemptionBranchId,
        uint256 redeemedCylinderId,
        address redeemedBy
    );
    
    event VoucherCancelled(
        uint256 indexed voucherId,
        address indexed customer,
        string reason
    );
    
    event VoucherExpired(uint256 indexed voucherId);
    
    constructor() ERC721("GasSwapVoucher", "GSV") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new voucher when customer deposits a cylinder
     * @param customer Customer's wallet address
     * @param companyId Company ID
     * @param cylinderTypeId Cylinder type (6kg, 12kg, 15kg)
     * @param sourceBranchId Branch where deposit occurs
     * @param depositedCylinderId Token ID of the deposited cylinder
     * @param customerName Customer full name
     * @param customerEmail Customer email address
     * @param customerPhone Customer phone number
     * @return voucherId The ID of the created voucher
     */
    function createVoucher(
        address customer,
        uint256 companyId,
        uint256 cylinderTypeId,
        uint256 sourceBranchId,
        uint256 depositedCylinderId,
        string memory customerName,
        string memory customerEmail,
        string memory customerPhone
    ) external onlyRole(BRANCH_STAFF_ROLE) whenNotPaused nonReentrant returns (uint256) {
        require(customer != address(0), "Invalid customer address");
        require(companyId > 0, "Invalid company ID");
        require(cylinderTypeId > 0, "Invalid cylinder type");
        require(sourceBranchId > 0, "Invalid branch ID");
        require(depositedCylinderId > 0, "Invalid cylinder ID");
        
        _voucherIdCounter++;
        uint256 voucherId = _voucherIdCounter;
        
        uint256 expiresAt = block.timestamp + (VOUCHER_VALIDITY_DAYS * 1 days);
        
        // Create voucher record
        vouchers[voucherId] = Voucher({
            id: voucherId,
            depositedCylinderId: depositedCylinderId,
            companyId: companyId,
            cylinderTypeId: cylinderTypeId,
            sourceBranchId: sourceBranchId,
            customer: customer,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            status: VoucherStatus.ACTIVE,
            redeemedCylinderId: 0,
            redemptionBranchId: 0,
            redeemedAt: 0,
            redeemedBy: address(0)
        });
        
        // Store customer info
        voucherCustomerInfo[voucherId] = CustomerInfo({
            name: customerName,
            email: customerEmail,
            phoneNumber: customerPhone
        });
        
        // Update statistics
        companyBalances[companyId].totalDeposits++;
        companyBalances[companyId].netBalance++;
        branchDeposits[sourceBranchId]++;
        
        // Track customer's vouchers
        customerVouchers[customer].push(voucherId);
        
        // Mint voucher NFT to customer
        _safeMint(customer, voucherId);
        
        emit VoucherCreated(
            voucherId,
            customer,
            companyId,
            cylinderTypeId,
            sourceBranchId,
            depositedCylinderId,
            expiresAt,
            customerName
        );
        
        return voucherId;
    }
    
    /**
     * @dev Redeem a voucher at a destination branch
     * @param voucherId Voucher to redeem
     * @param redemptionBranchId Branch where redemption occurs
     * @param redeemedCylinderId Token ID of cylinder given to customer
     */
    function redeemVoucher(
        uint256 voucherId,
        uint256 redemptionBranchId,
        uint256 redeemedCylinderId
    ) external onlyRole(BRANCH_STAFF_ROLE) whenNotPaused nonReentrant {
        require(voucherId > 0 && voucherId <= _voucherIdCounter, "Invalid voucher ID");
        
        Voucher storage voucher = vouchers[voucherId];
        
        // Validate voucher
        require(voucher.status == VoucherStatus.ACTIVE, "Voucher not active");
        require(block.timestamp <= voucher.expiresAt, "Voucher expired");
        require(redemptionBranchId > 0, "Invalid branch ID");
        require(redeemedCylinderId > 0, "Invalid cylinder ID");
        
        // Update voucher status
        voucher.status = VoucherStatus.REDEEMED;
        voucher.redeemedCylinderId = redeemedCylinderId;
        voucher.redemptionBranchId = redemptionBranchId;
        voucher.redeemedAt = block.timestamp;
        voucher.redeemedBy = msg.sender;
        
        // Update statistics
        companyBalances[voucher.companyId].totalRedemptions++;
        companyBalances[voucher.companyId].netBalance--;
        branchRedemptions[redemptionBranchId]++;
        
        // Burn the voucher NFT
        _burn(voucherId);
        
        emit VoucherRedeemed(
            voucherId,
            voucher.customer,
            redemptionBranchId,
            redeemedCylinderId,
            msg.sender
        );
    }
    
    /**
     * @dev Cancel a voucher (admin function for refund scenarios)
     * @param voucherId Voucher to cancel
     * @param reason Reason for cancellation
     */
    function cancelVoucher(
        uint256 voucherId,
        string memory reason
    ) external onlyRole(PLATFORM_ADMIN_ROLE) {
        require(voucherId > 0 && voucherId <= _voucherIdCounter, "Invalid voucher ID");
        
        Voucher storage voucher = vouchers[voucherId];
        require(voucher.status == VoucherStatus.ACTIVE, "Voucher not active");
        
        voucher.status = VoucherStatus.CANCELLED;
        
        // Adjust company balance
        companyBalances[voucher.companyId].totalDeposits--;
        companyBalances[voucher.companyId].netBalance--;
        
        // Burn the voucher NFT
        _burn(voucherId);
        
        emit VoucherCancelled(voucherId, voucher.customer, reason);
    }
    
    /**
     * @dev Mark expired vouchers (can be called by anyone)
     * @param voucherId Voucher to check and mark as expired
     */
    function markExpired(uint256 voucherId) external {
        require(voucherId > 0 && voucherId <= _voucherIdCounter, "Invalid voucher ID");
        
        Voucher storage voucher = vouchers[voucherId];
        require(voucher.status == VoucherStatus.ACTIVE, "Voucher not active");
        require(block.timestamp > voucher.expiresAt, "Voucher not expired yet");
        
        voucher.status = VoucherStatus.EXPIRED;
        
        // Burn the voucher NFT if still exists
        if (_ownerOf(voucherId) != address(0)) {
            _burn(voucherId);
        }
        
        emit VoucherExpired(voucherId);
    }
    
    // View functions
    
    /**
     * @dev Get voucher details
     */
    function getVoucher(uint256 voucherId) external view returns (Voucher memory) {
        require(voucherId > 0 && voucherId <= _voucherIdCounter, "Invalid voucher ID");
        return vouchers[voucherId];
    }
    
    /**
     * @dev Get voucher customer info
     */
    function getVoucherCustomerInfo(uint256 voucherId) external view returns (CustomerInfo memory) {
        require(voucherId > 0 && voucherId <= _voucherIdCounter, "Invalid voucher ID");
        return voucherCustomerInfo[voucherId];
    }
    
    /**
     * @dev Check if voucher is valid for redemption
     */
    function isVoucherValid(uint256 voucherId) public view returns (bool) {
        if (voucherId == 0 || voucherId > _voucherIdCounter) return false;
        
        Voucher memory voucher = vouchers[voucherId];
        return voucher.status == VoucherStatus.ACTIVE && 
               block.timestamp <= voucher.expiresAt;
    }
    
    /**
     * @dev Get customer's voucher IDs
     */
    function getCustomerVouchers(address customer) external view returns (uint256[] memory) {
        return customerVouchers[customer];
    }
    
    /**
     * @dev Get company balance
     */
    function getCompanyBalance(uint256 companyId) external view returns (
        uint256 totalDeposits,
        uint256 totalRedemptions,
        int256 netBalance
    ) {
        CompanyBalance memory balance = companyBalances[companyId];
        return (balance.totalDeposits, balance.totalRedemptions, balance.netBalance);
    }
    
    /**
     * @dev Get total vouchers created
     */
    function getTotalVouchers() external view returns (uint256) {
        return _voucherIdCounter;
    }
    
    /**
     * @dev Get branch statistics
     */
    function getBranchStats(uint256 branchId) external view returns (
        uint256 deposits,
        uint256 redemptions
    ) {
        return (branchDeposits[branchId], branchRedemptions[branchId]);
    }
    
    /**
     * @dev Get voucher status as string
     */
    function getVoucherStatusString(uint256 voucherId) external view returns (string memory) {
        require(voucherId > 0 && voucherId <= _voucherIdCounter, "Invalid voucher ID");
        
        VoucherStatus status = vouchers[voucherId].status;
        
        if (status == VoucherStatus.ACTIVE) return "Active";
        if (status == VoucherStatus.REDEEMED) return "Redeemed";
        if (status == VoucherStatus.EXPIRED) return "Expired";
        if (status == VoucherStatus.CANCELLED) return "Cancelled";
        return "Unknown";
    }
    
    /**
     * @dev Calculate days remaining for voucher
     */
    function getDaysRemaining(uint256 voucherId) external view returns (uint256) {
        require(voucherId > 0 && voucherId <= _voucherIdCounter, "Invalid voucher ID");
        
        Voucher memory voucher = vouchers[voucherId];
        
        if (voucher.status != VoucherStatus.ACTIVE) return 0;
        if (block.timestamp >= voucher.expiresAt) return 0;
        
        return (voucher.expiresAt - block.timestamp) / 1 days;
    }
    
    // Admin functions
    
    function pause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PLATFORM_ADMIN_ROLE) {
        _unpause();
    }
    
    function grantStaffRole(address account) external onlyRole(PLATFORM_ADMIN_ROLE) {
        _grantRole(BRANCH_STAFF_ROLE, account);
    }
    
    function revokeStaffRole(address account) external onlyRole(PLATFORM_ADMIN_ROLE) {
        _revokeRole(BRANCH_STAFF_ROLE, account);
    }
    
    // Required overrides
    
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
