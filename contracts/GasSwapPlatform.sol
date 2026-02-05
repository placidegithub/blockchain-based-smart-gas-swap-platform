// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CompanyManager.sol";
import "./CylinderRegistry.sol";
import "./VoucherManager.sol";

/**
 * @title GasSwapPlatform
 * @dev Main orchestrating contract for the Gas Cylinder Swap Platform
 * 
 * This contract coordinates between CompanyManager, CylinderRegistry,
 * and VoucherManager to provide a unified interface for the platform.
 */
contract GasSwapPlatform is GasSwapAccessControl {
    
    // Contract references
    CompanyManager public companyManager;
    CylinderRegistry public cylinderRegistry;
    VoucherManager public voucherManager;
    
    // Platform statistics
    uint256 public totalSwapsCompleted;
    uint256 public platformLaunchDate;
    
    // Events
    event PlatformInitialized(
        address companyManager,
        address cylinderRegistry,
        address voucherManager
    );
    
    event SwapInitiated(
        uint256 indexed voucherId,
        address indexed customer,
        uint256 companyId,
        uint256 cylinderTypeId,
        uint256 sourceBranchId
    );
    
    event SwapCompleted(
        uint256 indexed voucherId,
        address indexed customer,
        uint256 sourceBranchId,
        uint256 redemptionBranchId
    );
    
    constructor(
        address _companyManager,
        address _cylinderRegistry,
        address _voucherManager
    ) {
        require(_companyManager != address(0), "Invalid CompanyManager");
        require(_cylinderRegistry != address(0), "Invalid CylinderRegistry");
        require(_voucherManager != address(0), "Invalid VoucherManager");
        
        companyManager = CompanyManager(_companyManager);
        cylinderRegistry = CylinderRegistry(_cylinderRegistry);
        voucherManager = VoucherManager(_voucherManager);
        
        platformLaunchDate = block.timestamp;
        
        emit PlatformInitialized(_companyManager, _cylinderRegistry, _voucherManager);
    }
    
    /**
     * @dev Initiate a cylinder swap (deposit cylinder, get voucher)
     * @param customer Customer wallet address
     * @param cylinderSerialNumber Serial number of cylinder being deposited
     * @param branchId Branch where deposit occurs
     * @param customerName Customer full name
     * @param customerEmail Customer email address
     * @param customerPhone Customer phone number
     * @return voucherId The created voucher ID
     */
    function initiateSwap(
        address customer,
        string memory cylinderSerialNumber,
        uint256 branchId,
        string memory customerName,
        string memory customerEmail,
        string memory customerPhone
    ) external onlyRole(BRANCH_STAFF_ROLE) whenNotPaused returns (uint256) {
        // Get cylinder by serial number
        (uint256 cylinderId, CylinderRegistry.CylinderData memory cylinder) = 
            cylinderRegistry.getCylinderBySerial(cylinderSerialNumber);
        
        require(cylinderId > 0, "Cylinder not registered");
        require(cylinderRegistry.isCylinderAvailable(cylinderId), "Cylinder not available");
        require(cylinder.currentBranchId == branchId, "Cylinder not at this branch");
        
        // Validate branch
        require(companyManager.isValidBranch(branchId), "Invalid branch");
        CompanyManager.Branch memory branch = companyManager.getBranch(branchId);
        require(branch.companyId == cylinder.companyId, "Company mismatch");
        
        // Update cylinder status to "with customer"
        cylinderRegistry.updateCylinderStatus(
            cylinderId,
            CylinderRegistry.CylinderStatus.WITH_CUSTOMER,
            branchId
        );
        
        // Create voucher
        uint256 voucherId = voucherManager.createVoucher(
            customer,
            cylinder.companyId,
            cylinder.cylinderTypeId,
            branchId,
            cylinderId,
            customerName,
            customerEmail,
            customerPhone
        );
        
        emit SwapInitiated(
            voucherId,
            customer,
            cylinder.companyId,
            cylinder.cylinderTypeId,
            branchId
        );
        
        return voucherId;
    }
    
    /**
     * @dev Complete a swap (redeem voucher, get new cylinder)
     * @param voucherId Voucher to redeem
     * @param newCylinderSerialNumber Serial number of cylinder to give customer
     * @param branchId Branch where redemption occurs
     */
    function completeSwap(
        uint256 voucherId,
        string memory newCylinderSerialNumber,
        uint256 branchId
    ) external onlyRole(BRANCH_STAFF_ROLE) whenNotPaused {
        // Validate voucher
        require(voucherManager.isVoucherValid(voucherId), "Invalid or expired voucher");
        
        VoucherManager.Voucher memory voucher = voucherManager.getVoucher(voucherId);
        
        // Validate branch
        require(companyManager.isValidBranch(branchId), "Invalid branch");
        CompanyManager.Branch memory redemptionBranch = companyManager.getBranch(branchId);
        require(redemptionBranch.companyId == voucher.companyId, "Must redeem at same company");
        
        // Get new cylinder
        (uint256 newCylinderId, CylinderRegistry.CylinderData memory newCylinder) = 
            cylinderRegistry.getCylinderBySerial(newCylinderSerialNumber);
        
        require(newCylinderId > 0, "New cylinder not registered");
        require(cylinderRegistry.isCylinderAtBranch(newCylinderId, branchId), "Cylinder not at this branch");
        require(newCylinder.companyId == voucher.companyId, "Company mismatch");
        require(newCylinder.cylinderTypeId == voucher.cylinderTypeId, "Cylinder type mismatch");
        
        // Update new cylinder status
        cylinderRegistry.updateCylinderStatus(
            newCylinderId,
            CylinderRegistry.CylinderStatus.WITH_CUSTOMER,
            branchId
        );
        
        // Redeem voucher
        voucherManager.redeemVoucher(voucherId, branchId, newCylinderId);
        
        totalSwapsCompleted++;
        
        emit SwapCompleted(
            voucherId,
            voucher.customer,
            voucher.sourceBranchId,
            branchId
        );
    }
    
    /**
     * @dev Verify a voucher (public function for QR code verification)
     * @param voucherId Voucher to verify
     * @return isValid Whether voucher is valid
     * @return companyId Company ID
     * @return cylinderTypeId Cylinder type
     * @return daysRemaining Days until expiration
     * @return status Status string
     */
    function verifyVoucher(uint256 voucherId) external view returns (
        bool isValid,
        uint256 companyId,
        uint256 cylinderTypeId,
        uint256 daysRemaining,
        string memory status
    ) {
        isValid = voucherManager.isVoucherValid(voucherId);
        
        if (voucherId > 0 && voucherId <= voucherManager.getTotalVouchers()) {
            VoucherManager.Voucher memory voucher = voucherManager.getVoucher(voucherId);
            companyId = voucher.companyId;
            cylinderTypeId = voucher.cylinderTypeId;
            daysRemaining = voucherManager.getDaysRemaining(voucherId);
            status = voucherManager.getVoucherStatusString(voucherId);
        }
        
        return (isValid, companyId, cylinderTypeId, daysRemaining, status);
    }
    
    /**
     * @dev Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalCompanies,
        uint256 totalBranches,
        uint256 totalCylinders,
        uint256 totalVouchers,
        uint256 completedSwaps,
        uint256 launchDate
    ) {
        return (
            companyManager.companyCount(),
            companyManager.branchCount(),
            cylinderRegistry.getTotalCylinders(),
            voucherManager.getTotalVouchers(),
            totalSwapsCompleted,
            platformLaunchDate
        );
    }
    
    /**
     * @dev Get company info with branch count
     */
    function getCompanyInfo(uint256 companyId) external view returns (
        string memory name,
        string memory code,
        bool isActive,
        uint256 branchCount,
        uint256 totalDeposits,
        uint256 totalRedemptions,
        int256 netBalance
    ) {
        CompanyManager.Company memory company = companyManager.getCompany(companyId);
        uint256[] memory branches = companyManager.getCompanyBranches(companyId);
        
        (uint256 deposits, uint256 redemptions, int256 balance) = 
            voucherManager.getCompanyBalance(companyId);
        
        return (
            company.name,
            company.code,
            company.isActive,
            branches.length,
            deposits,
            redemptions,
            balance
        );
    }
    
    /**
     * @dev Check if a cylinder type is available at a branch
     */
    function checkAvailability(
        uint256 branchId,
        uint256 cylinderTypeId
    ) external view returns (uint256 available) {
        return companyManager.getBranchInventory(branchId, cylinderTypeId);
    }
    
    /**
     * @dev Get customer's active vouchers
     */
    function getCustomerActiveVouchers(address customer) external view returns (
        uint256[] memory activeVoucherIds
    ) {
        uint256[] memory allVouchers = voucherManager.getCustomerVouchers(customer);
        
        // Count active vouchers
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allVouchers.length; i++) {
            if (voucherManager.isVoucherValid(allVouchers[i])) {
                activeCount++;
            }
        }
        
        // Build array of active voucher IDs
        activeVoucherIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < allVouchers.length; i++) {
            if (voucherManager.isVoucherValid(allVouchers[i])) {
                activeVoucherIds[index] = allVouchers[i];
                index++;
            }
        }
        
        return activeVoucherIds;
    }
    
    /**
     * @dev Update contract references (admin only)
     */
    function updateContracts(
        address _companyManager,
        address _cylinderRegistry,
        address _voucherManager
    ) external onlyRole(PLATFORM_ADMIN_ROLE) {
        if (_companyManager != address(0)) {
            companyManager = CompanyManager(_companyManager);
        }
        if (_cylinderRegistry != address(0)) {
            cylinderRegistry = CylinderRegistry(_cylinderRegistry);
        }
        if (_voucherManager != address(0)) {
            voucherManager = VoucherManager(_voucherManager);
        }
        
        emit PlatformInitialized(
            address(companyManager),
            address(cylinderRegistry),
            address(voucherManager)
        );
    }
}
