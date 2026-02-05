const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GasSwapPlatform", function () {
  let companyManager;
  let cylinderRegistry;
  let voucherManager;
  let gasSwapPlatform;
  let owner;
  let staff;
  let customer;

  const BRANCH_STAFF_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRANCH_STAFF_ROLE"));

  beforeEach(async function () {
    [owner, staff, customer] = await ethers.getSigners();

    // Deploy all contracts
    const CompanyManager = await ethers.getContractFactory("CompanyManager");
    companyManager = await CompanyManager.deploy();
    await companyManager.waitForDeployment();

    const CylinderRegistry = await ethers.getContractFactory("CylinderRegistry");
    cylinderRegistry = await CylinderRegistry.deploy();
    await cylinderRegistry.waitForDeployment();

    const VoucherManager = await ethers.getContractFactory("VoucherManager");
    voucherManager = await VoucherManager.deploy();
    await voucherManager.waitForDeployment();

    const GasSwapPlatform = await ethers.getContractFactory("GasSwapPlatform");
    gasSwapPlatform = await GasSwapPlatform.deploy(
      await companyManager.getAddress(),
      await cylinderRegistry.getAddress(),
      await voucherManager.getAddress()
    );
    await gasSwapPlatform.waitForDeployment();

    // Grant roles to staff
    await voucherManager.grantStaffRole(staff.address);
    await cylinderRegistry.grantRole(BRANCH_STAFF_ROLE, staff.address);
    await gasSwapPlatform.assignBranchStaff(staff.address, 1, 1);

    // Grant roles to GasSwapPlatform contract so it can call child contracts
    const platformAddress = await gasSwapPlatform.getAddress();
    await voucherManager.grantStaffRole(platformAddress);
    await cylinderRegistry.grantRole(BRANCH_STAFF_ROLE, platformAddress);

    // Setup: Create a branch and register a cylinder
    await companyManager.registerBranch(1, "Test Branch", "Kigali", "Location");
    await cylinderRegistry.connect(staff).registerCylinder(
      1, 1, "CYL-TEST-001", 1, Math.floor(Date.now() / 1000)
    );
  });

  describe("Deployment", function () {
    it("Should store contract references", async function () {
      expect(await gasSwapPlatform.companyManager()).to.equal(await companyManager.getAddress());
      expect(await gasSwapPlatform.cylinderRegistry()).to.equal(await cylinderRegistry.getAddress());
      expect(await gasSwapPlatform.voucherManager()).to.equal(await voucherManager.getAddress());
    });

    it("Should set platform launch date", async function () {
      expect(await gasSwapPlatform.platformLaunchDate()).to.be.gt(0);
    });

    it("Should emit PlatformInitialized event", async function () {
      const GasSwapPlatformFactory = await ethers.getContractFactory("GasSwapPlatform");
      const newPlatform = await GasSwapPlatformFactory.deploy(
        await companyManager.getAddress(),
        await cylinderRegistry.getAddress(),
        await voucherManager.getAddress()
      );
      
      // Check the event was emitted by looking at the deployment transaction
      await expect(newPlatform.deploymentTransaction())
        .to.emit(newPlatform, "PlatformInitialized");
    });
  });

  describe("Platform Stats", function () {
    it("Should return correct platform statistics", async function () {
      const stats = await gasSwapPlatform.getPlatformStats();
      
      expect(stats.totalCompanies).to.equal(7);
      expect(stats.totalBranches).to.equal(1);
      expect(stats.totalCylinders).to.equal(1);
      expect(stats.totalVouchers).to.equal(0);
      expect(stats.completedSwaps).to.equal(0);
    });
  });

  describe("Company Info", function () {
    it("Should return company info with branch count", async function () {
      const info = await gasSwapPlatform.getCompanyInfo(1);
      
      expect(info.name).to.equal("SP Rwanda");
      expect(info.code).to.equal("SP");
      expect(info.isActive).to.be.true;
      expect(info.branchCount).to.equal(1);
    });
  });

  describe("Voucher Verification", function () {
    it("Should verify non-existent voucher as invalid", async function () {
      const result = await gasSwapPlatform.verifyVoucher(999);
      expect(result.isValid).to.be.false;
    });
  });

  describe("Customer Active Vouchers", function () {
    it("Should return empty array for customer with no vouchers", async function () {
      const vouchers = await gasSwapPlatform.getCustomerActiveVouchers(customer.address);
      expect(vouchers.length).to.equal(0);
    });
  });

  describe("Check Availability", function () {
    it("Should check cylinder type availability at branch", async function () {
      const available = await gasSwapPlatform.checkAvailability(1, 1);
      expect(available).to.equal(0); // No inventory set
    });
  });

  describe("Full Swap Flow", function () {
    it("Should initiate a swap (create voucher)", async function () {
      const tx = await gasSwapPlatform.connect(staff).initiateSwap(
        customer.address,
        "CYL-TEST-001",
        1
      );
      await tx.wait();

      const stats = await gasSwapPlatform.getPlatformStats();
      expect(stats.totalVouchers).to.equal(1);
    });

    it("Should emit SwapInitiated event", async function () {
      await expect(
        gasSwapPlatform.connect(staff).initiateSwap(
          customer.address,
          "CYL-TEST-001",
          1
        )
      ).to.emit(gasSwapPlatform, "SwapInitiated");
    });

    it("Should fail initiate swap for non-existent cylinder", async function () {
      await expect(
        gasSwapPlatform.connect(staff).initiateSwap(
          customer.address,
          "INVALID-CYL",
          1
        )
      ).to.be.revertedWith("Cylinder not found");
    });

    it("Should fail if not staff", async function () {
      await expect(
        gasSwapPlatform.connect(customer).initiateSwap(
          customer.address,
          "CYL-TEST-001",
          1
        )
      ).to.be.reverted;
    });

    describe("Complete Swap", function () {
      beforeEach(async function () {
        // First initiate a swap
        await gasSwapPlatform.connect(staff).initiateSwap(
          customer.address,
          "CYL-TEST-001",
          1
        );

        // Register a second cylinder for redemption
        await cylinderRegistry.connect(staff).registerCylinder(
          1, 1, "CYL-TEST-002", 1, Math.floor(Date.now() / 1000)
        );
      });

      it("Should complete swap successfully", async function () {
        const tx = await gasSwapPlatform.connect(staff).completeSwap(
          1,
          "CYL-TEST-002",
          1
        );
        await tx.wait();

        const stats = await gasSwapPlatform.getPlatformStats();
        expect(stats.completedSwaps).to.equal(1);
      });

      it("Should emit SwapCompleted event", async function () {
        await expect(
          gasSwapPlatform.connect(staff).completeSwap(1, "CYL-TEST-002", 1)
        ).to.emit(gasSwapPlatform, "SwapCompleted");
      });

      it("Should fail to complete already redeemed voucher", async function () {
        await gasSwapPlatform.connect(staff).completeSwap(1, "CYL-TEST-002", 1);

        // Register another cylinder
        await cylinderRegistry.connect(staff).registerCylinder(
          1, 1, "CYL-TEST-003", 1, Math.floor(Date.now() / 1000)
        );

        await expect(
          gasSwapPlatform.connect(staff).completeSwap(1, "CYL-TEST-003", 1)
        ).to.be.revertedWith("Invalid or expired voucher");
      });

      it("Should fail with mismatched cylinder type", async function () {
        // Register a 12kg cylinder (type 2) for company 1
        await cylinderRegistry.connect(staff).registerCylinder(
          1, 2, "CYL-12KG-001", 1, Math.floor(Date.now() / 1000)
        );

        await expect(
          gasSwapPlatform.connect(staff).completeSwap(1, "CYL-12KG-001", 1)
        ).to.be.revertedWith("Cylinder type mismatch");
      });
    });
  });

  describe("Voucher Verification with Created Voucher", function () {
    beforeEach(async function () {
      await gasSwapPlatform.connect(staff).initiateSwap(
        customer.address,
        "CYL-TEST-001",
        1
      );
    });

    it("Should verify valid voucher", async function () {
      const result = await gasSwapPlatform.verifyVoucher(1);
      expect(result.isValid).to.be.true;
      expect(result.companyId).to.equal(1);
      expect(result.cylinderTypeId).to.equal(1);
      expect(result.status).to.equal("Active");
    });

    it("Should return days remaining", async function () {
      const result = await gasSwapPlatform.verifyVoucher(1);
      expect(result.daysRemaining).to.be.closeTo(30n, 1n);
    });
  });

  describe("Customer Vouchers", function () {
    beforeEach(async function () {
      await gasSwapPlatform.connect(staff).initiateSwap(
        customer.address,
        "CYL-TEST-001",
        1
      );
    });

    it("Should return customer's active vouchers", async function () {
      const vouchers = await gasSwapPlatform.getCustomerActiveVouchers(customer.address);
      expect(vouchers.length).to.equal(1);
      expect(vouchers[0]).to.equal(1n);
    });
  });

  describe("Contract Updates", function () {
    it("Should update contract references (admin only)", async function () {
      const newCompanyManager = await (await ethers.getContractFactory("CompanyManager")).deploy();
      
      await gasSwapPlatform.updateContracts(
        await newCompanyManager.getAddress(),
        ethers.ZeroAddress,
        ethers.ZeroAddress
      );

      expect(await gasSwapPlatform.companyManager()).to.equal(await newCompanyManager.getAddress());
    });

    it("Should fail if non-admin tries to update", async function () {
      await expect(
        gasSwapPlatform.connect(staff).updateContracts(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          ethers.ZeroAddress
        )
      ).to.be.reverted;
    });
  });
});
