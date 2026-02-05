const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VoucherManager", function () {
  let voucherManager;
  let owner;
  let staff;
  let customer;

  const BRANCH_STAFF_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRANCH_STAFF_ROLE"));

  beforeEach(async function () {
    [owner, staff, customer] = await ethers.getSigners();

    const VoucherManager = await ethers.getContractFactory("VoucherManager");
    voucherManager = await VoucherManager.deploy();
    await voucherManager.waitForDeployment();

    // Grant staff role
    await voucherManager.grantStaffRole(staff.address);
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await voucherManager.hasRole(await voucherManager.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should set the deployer as platform admin", async function () {
      expect(await voucherManager.hasRole(await voucherManager.PLATFORM_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should have correct voucher validity period", async function () {
      expect(await voucherManager.VOUCHER_VALIDITY_DAYS()).to.equal(30);
    });
  });

  describe("Voucher Creation", function () {
    it("Should create a voucher successfully", async function () {
      const companyId = 1;
      const cylinderTypeId = 2;
      const branchId = 1;
      const cylinderId = 100;

      const tx = await voucherManager.connect(staff).createVoucher(
        customer.address,
        companyId,
        cylinderTypeId,
        branchId,
        cylinderId
      );

      const receipt = await tx.wait();
      
      // Check voucher was created
      expect(await voucherManager.getTotalVouchers()).to.equal(1);
      
      // Check customer owns the voucher NFT
      expect(await voucherManager.ownerOf(1)).to.equal(customer.address);
    });

    it("Should emit VoucherCreated event", async function () {
      const companyId = 1;
      const cylinderTypeId = 2;
      const branchId = 1;
      const cylinderId = 100;

      await expect(
        voucherManager.connect(staff).createVoucher(
          customer.address,
          companyId,
          cylinderTypeId,
          branchId,
          cylinderId
        )
      ).to.emit(voucherManager, "VoucherCreated");
    });

    it("Should fail if caller is not staff", async function () {
      await expect(
        voucherManager.connect(customer).createVoucher(
          customer.address,
          1, 2, 1, 100
        )
      ).to.be.reverted;
    });

    it("Should fail with invalid customer address", async function () {
      await expect(
        voucherManager.connect(staff).createVoucher(
          ethers.ZeroAddress,
          1, 2, 1, 100
        )
      ).to.be.revertedWith("Invalid customer address");
    });

    it("Should track customer vouchers", async function () {
      await voucherManager.connect(staff).createVoucher(
        customer.address, 1, 2, 1, 100
      );
      await voucherManager.connect(staff).createVoucher(
        customer.address, 1, 2, 1, 101
      );

      const vouchers = await voucherManager.getCustomerVouchers(customer.address);
      expect(vouchers.length).to.equal(2);
    });
  });

  describe("Voucher Validation", function () {
    beforeEach(async function () {
      await voucherManager.connect(staff).createVoucher(
        customer.address, 1, 2, 1, 100
      );
    });

    it("Should return true for valid voucher", async function () {
      expect(await voucherManager.isVoucherValid(1)).to.be.true;
    });

    it("Should return false for non-existent voucher", async function () {
      expect(await voucherManager.isVoucherValid(999)).to.be.false;
    });

    it("Should return correct days remaining", async function () {
      const days = await voucherManager.getDaysRemaining(1);
      expect(days).to.be.closeTo(30, 1);
    });
  });

  describe("Voucher Redemption", function () {
    beforeEach(async function () {
      await voucherManager.connect(staff).createVoucher(
        customer.address, 1, 2, 1, 100
      );
    });

    it("Should redeem voucher successfully", async function () {
      const redemptionBranchId = 2;
      const newCylinderId = 200;

      await voucherManager.connect(staff).redeemVoucher(
        1, redemptionBranchId, newCylinderId
      );

      // Check voucher status
      const voucher = await voucherManager.getVoucher(1);
      expect(voucher.status).to.equal(1); // REDEEMED = 1
      expect(voucher.redemptionBranchId).to.equal(redemptionBranchId);
      expect(voucher.redeemedCylinderId).to.equal(newCylinderId);
    });

    it("Should emit VoucherRedeemed event", async function () {
      await expect(
        voucherManager.connect(staff).redeemVoucher(1, 2, 200)
      ).to.emit(voucherManager, "VoucherRedeemed");
    });

    it("Should burn voucher NFT after redemption", async function () {
      await voucherManager.connect(staff).redeemVoucher(1, 2, 200);
      
      await expect(voucherManager.ownerOf(1)).to.be.reverted;
    });

    it("Should fail to redeem already redeemed voucher", async function () {
      await voucherManager.connect(staff).redeemVoucher(1, 2, 200);
      
      await expect(
        voucherManager.connect(staff).redeemVoucher(1, 3, 300)
      ).to.be.revertedWith("Voucher not active");
    });

    it("Should update company balance on redemption", async function () {
      const [deposits1, redemptions1] = await voucherManager.getCompanyBalance(1);
      expect(deposits1).to.equal(1);
      expect(redemptions1).to.equal(0);

      await voucherManager.connect(staff).redeemVoucher(1, 2, 200);

      const [deposits2, redemptions2] = await voucherManager.getCompanyBalance(1);
      expect(deposits2).to.equal(1);
      expect(redemptions2).to.equal(1);
    });
  });

  describe("Voucher Cancellation", function () {
    beforeEach(async function () {
      await voucherManager.connect(staff).createVoucher(
        customer.address, 1, 2, 1, 100
      );
    });

    it("Should cancel voucher (admin only)", async function () {
      await voucherManager.connect(owner).cancelVoucher(1, "Customer requested refund");

      const voucher = await voucherManager.getVoucher(1);
      expect(voucher.status).to.equal(3); // CANCELLED = 3
    });

    it("Should fail if non-admin tries to cancel", async function () {
      await expect(
        voucherManager.connect(staff).cancelVoucher(1, "Test")
      ).to.be.reverted;
    });
  });

  describe("Statistics", function () {
    it("Should track branch deposits and redemptions", async function () {
      const branchId = 1;
      
      await voucherManager.connect(staff).createVoucher(
        customer.address, 1, 2, branchId, 100
      );
      await voucherManager.connect(staff).createVoucher(
        customer.address, 1, 2, branchId, 101
      );

      const [deposits, redemptions] = await voucherManager.getBranchStats(branchId);
      expect(deposits).to.equal(2);
      expect(redemptions).to.equal(0);
    });

    it("Should return correct status string", async function () {
      await voucherManager.connect(staff).createVoucher(
        customer.address, 1, 2, 1, 100
      );

      expect(await voucherManager.getVoucherStatusString(1)).to.equal("Active");

      await voucherManager.connect(staff).redeemVoucher(1, 2, 200);
      
      expect(await voucherManager.getVoucherStatusString(1)).to.equal("Redeemed");
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause", async function () {
      await voucherManager.connect(owner).pause();
      
      await expect(
        voucherManager.connect(staff).createVoucher(
          customer.address, 1, 2, 1, 100
        )
      ).to.be.reverted;

      await voucherManager.connect(owner).unpause();
      
      await expect(
        voucherManager.connect(staff).createVoucher(
          customer.address, 1, 2, 1, 100
        )
      ).to.not.be.reverted;
    });
  });
});
