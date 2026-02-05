const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CylinderRegistry", function () {
  let cylinderRegistry;
  let owner;
  let staff;
  let otherUser;

  const PLATFORM_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PLATFORM_ADMIN_ROLE"));
  const BRANCH_STAFF_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRANCH_STAFF_ROLE"));

  beforeEach(async function () {
    [owner, staff, otherUser] = await ethers.getSigners();

    const CylinderRegistry = await ethers.getContractFactory("CylinderRegistry");
    cylinderRegistry = await CylinderRegistry.deploy();
    await cylinderRegistry.waitForDeployment();

    // Grant staff role
    await cylinderRegistry.grantRole(BRANCH_STAFF_ROLE, staff.address);
  });

  describe("Deployment", function () {
    it("Should set deployer as admin", async function () {
      expect(await cylinderRegistry.hasRole(PLATFORM_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should have correct NFT name and symbol", async function () {
      expect(await cylinderRegistry.name()).to.equal("GasCylinder");
      expect(await cylinderRegistry.symbol()).to.equal("GCYL");
    });

    it("Should start with zero cylinders", async function () {
      expect(await cylinderRegistry.getTotalCylinders()).to.equal(0);
    });
  });

  describe("Cylinder Registration", function () {
    const companyId = 1;
    const cylinderTypeId = 1;
    const serialNumber = "CYL-001-0001";
    const branchId = 1;
    const manufacturingDate = Math.floor(Date.now() / 1000) - (365 * 24 * 60 * 60);

    it("Should register a cylinder (staff)", async function () {
      const tx = await cylinderRegistry.connect(staff).registerCylinder(
        companyId, cylinderTypeId, serialNumber, branchId, manufacturingDate
      );
      await tx.wait();

      expect(await cylinderRegistry.getTotalCylinders()).to.equal(1);
    });

    it("Should emit CylinderRegistered event", async function () {
      await expect(
        cylinderRegistry.connect(staff).registerCylinder(
          companyId, cylinderTypeId, serialNumber, branchId, manufacturingDate
        )
      ).to.emit(cylinderRegistry, "CylinderRegistered")
        .withArgs(1, companyId, cylinderTypeId, serialNumber, branchId);
    });

    it("Should store cylinder data correctly", async function () {
      await cylinderRegistry.connect(staff).registerCylinder(
        companyId, cylinderTypeId, serialNumber, branchId, manufacturingDate
      );

      const cylinder = await cylinderRegistry.getCylinder(1);
      expect(cylinder.companyId).to.equal(companyId);
      expect(cylinder.cylinderTypeId).to.equal(cylinderTypeId);
      expect(cylinder.serialNumber).to.equal(serialNumber);
      expect(cylinder.currentBranchId).to.equal(branchId);
      expect(cylinder.status).to.equal(0); // IN_BRANCH
    });

    it("Should reject duplicate serial numbers", async function () {
      await cylinderRegistry.connect(staff).registerCylinder(
        companyId, cylinderTypeId, serialNumber, branchId, manufacturingDate
      );

      await expect(
        cylinderRegistry.connect(staff).registerCylinder(
          companyId, cylinderTypeId, serialNumber, 2, manufacturingDate
        )
      ).to.be.revertedWith("Serial number already registered");
    });

    it("Should fail if not staff", async function () {
      await expect(
        cylinderRegistry.connect(otherUser).registerCylinder(
          companyId, cylinderTypeId, serialNumber, branchId, manufacturingDate
        )
      ).to.be.reverted;
    });

    it("Should fail with empty serial number", async function () {
      await expect(
        cylinderRegistry.connect(staff).registerCylinder(
          companyId, cylinderTypeId, "", branchId, manufacturingDate
        )
      ).to.be.revertedWith("Serial number required");
    });
  });

  describe("Cylinder Lookup", function () {
    beforeEach(async function () {
      await cylinderRegistry.connect(staff).registerCylinder(
        1, 1, "CYL-001", 1, Math.floor(Date.now() / 1000)
      );
    });

    it("Should get cylinder by serial number", async function () {
      const [tokenId, cylinder] = await cylinderRegistry.getCylinderBySerial("CYL-001");
      expect(tokenId).to.equal(1);
      expect(cylinder.serialNumber).to.equal("CYL-001");
    });

    it("Should fail for non-existent serial", async function () {
      await expect(
        cylinderRegistry.getCylinderBySerial("INVALID")
      ).to.be.revertedWith("Cylinder not found");
    });
  });

  describe("Status Updates", function () {
    beforeEach(async function () {
      await cylinderRegistry.connect(staff).registerCylinder(
        1, 1, "CYL-001", 1, Math.floor(Date.now() / 1000)
      );
    });

    it("Should update cylinder status", async function () {
      await cylinderRegistry.connect(staff).updateCylinderStatus(1, 2, 1); // WITH_CUSTOMER
      
      const cylinder = await cylinderRegistry.getCylinder(1);
      expect(cylinder.status).to.equal(2); // WITH_CUSTOMER
    });

    it("Should emit CylinderStatusChanged event", async function () {
      await expect(
        cylinderRegistry.connect(staff).updateCylinderStatus(1, 2, 1)
      ).to.emit(cylinderRegistry, "CylinderStatusChanged");
    });

    it("Should record status change in history", async function () {
      await cylinderRegistry.connect(staff).updateCylinderStatus(1, 2, 1);
      
      const history = await cylinderRegistry.getCylinderHistory(1);
      expect(history.length).to.equal(1);
    });
  });

  describe("Cylinder Availability", function () {
    beforeEach(async function () {
      await cylinderRegistry.connect(staff).registerCylinder(
        1, 1, "CYL-001", 1, Math.floor(Date.now() / 1000)
      );
    });

    it("Should return true for available cylinder", async function () {
      expect(await cylinderRegistry.isCylinderAvailable(1)).to.be.true;
    });

    it("Should return false for cylinder with customer", async function () {
      await cylinderRegistry.connect(staff).updateCylinderStatus(1, 2, 1); // WITH_CUSTOMER
      expect(await cylinderRegistry.isCylinderAvailable(1)).to.be.false;
    });

    it("Should check if cylinder is at specific branch", async function () {
      expect(await cylinderRegistry.isCylinderAtBranch(1, 1)).to.be.true;
      expect(await cylinderRegistry.isCylinderAtBranch(1, 2)).to.be.false;
    });
  });

  describe("Cylinder Transfer", function () {
    beforeEach(async function () {
      await cylinderRegistry.connect(staff).registerCylinder(
        1, 1, "CYL-001", 1, Math.floor(Date.now() / 1000)
      );
    });

    it("Should transfer cylinder between branches", async function () {
      await cylinderRegistry.connect(staff).transferCylinder(1, 1, 2);
      
      const cylinder = await cylinderRegistry.getCylinder(1);
      expect(cylinder.currentBranchId).to.equal(2);
    });

    it("Should emit CylinderTransferred event", async function () {
      await expect(
        cylinderRegistry.connect(staff).transferCylinder(1, 1, 2)
      ).to.emit(cylinderRegistry, "CylinderTransferred")
        .withArgs(1, 1, 2, staff.address);
    });

    it("Should fail transfer to same branch", async function () {
      await expect(
        cylinderRegistry.connect(staff).transferCylinder(1, 1, 1)
      ).to.be.revertedWith("Same branch transfer");
    });

    it("Should fail if cylinder not at source branch", async function () {
      await expect(
        cylinderRegistry.connect(staff).transferCylinder(1, 2, 3)
      ).to.be.revertedWith("Cylinder not at source branch");
    });
  });

  describe("Inspection", function () {
    beforeEach(async function () {
      await cylinderRegistry.connect(staff).registerCylinder(
        1, 1, "CYL-001", 1, Math.floor(Date.now() / 1000)
      );
    });

    it("Should record inspection", async function () {
      const beforeCylinder = await cylinderRegistry.getCylinder(1);
      
      await cylinderRegistry.connect(staff).recordInspection(1);
      
      const afterCylinder = await cylinderRegistry.getCylinder(1);
      expect(afterCylinder.lastInspectionDate).to.be.gte(beforeCylinder.lastInspectionDate);
    });

    it("Should emit CylinderInspected event", async function () {
      await expect(
        cylinderRegistry.connect(staff).recordInspection(1)
      ).to.emit(cylinderRegistry, "CylinderInspected");
    });
  });

  describe("Retirement", function () {
    beforeEach(async function () {
      await cylinderRegistry.connect(staff).registerCylinder(
        1, 1, "CYL-001", 1, Math.floor(Date.now() / 1000)
      );
    });

    it("Should retire cylinder (admin only)", async function () {
      await cylinderRegistry.connect(owner).retireCylinder(1);
      
      const cylinder = await cylinderRegistry.getCylinder(1);
      expect(cylinder.status).to.equal(4); // RETIRED
    });

    it("Should fail if non-admin tries to retire", async function () {
      await expect(
        cylinderRegistry.connect(staff).retireCylinder(1)
      ).to.be.reverted;
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause", async function () {
      await cylinderRegistry.connect(owner).pause();
      
      await expect(
        cylinderRegistry.connect(staff).registerCylinder(
          1, 1, "CYL-001", 1, Math.floor(Date.now() / 1000)
        )
      ).to.be.reverted;

      await cylinderRegistry.connect(owner).unpause();
      
      await expect(
        cylinderRegistry.connect(staff).registerCylinder(
          1, 1, "CYL-001", 1, Math.floor(Date.now() / 1000)
        )
      ).to.not.be.reverted;
    });
  });
});
