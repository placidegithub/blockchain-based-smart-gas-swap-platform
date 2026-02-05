const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CompanyManager", function () {
  let companyManager;
  let owner;
  let admin;
  let staff;

  const PLATFORM_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PLATFORM_ADMIN_ROLE"));
  const COMPANY_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COMPANY_ADMIN_ROLE"));
  const BRANCH_STAFF_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRANCH_STAFF_ROLE"));

  beforeEach(async function () {
    [owner, admin, staff] = await ethers.getSigners();

    const CompanyManager = await ethers.getContractFactory("CompanyManager");
    companyManager = await CompanyManager.deploy();
    await companyManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should auto-register default Rwanda gas companies", async function () {
      const companyCount = await companyManager.companyCount();
      expect(companyCount).to.equal(7);
    });

    it("Should register default cylinder types for each company", async function () {
      const cylinderTypeCount = await companyManager.cylinderTypeCount();
      expect(cylinderTypeCount).to.equal(21); // 7 companies * 3 types each
    });

    it("Should set deployer as admin", async function () {
      expect(await companyManager.hasRole(PLATFORM_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should register SP Rwanda as first company", async function () {
      const company = await companyManager.getCompany(1);
      expect(company.name).to.equal("SP Rwanda");
      expect(company.code).to.equal("SP");
      expect(company.isActive).to.be.true;
    });

    it("Should be able to get company by code", async function () {
      const company = await companyManager.getCompanyByCode("KIGALIGAS");
      expect(company.name).to.equal("Kigaligas");
    });
  });

  describe("Company Management", function () {
    it("Should register a new company (admin only)", async function () {
      const tx = await companyManager.registerCompany("New Gas Co", "NGC", admin.address);
      await tx.wait();

      const companyCount = await companyManager.companyCount();
      expect(companyCount).to.equal(8);

      const company = await companyManager.getCompanyByCode("NGC");
      expect(company.name).to.equal("New Gas Co");
    });

    it("Should reject duplicate company codes", async function () {
      await expect(
        companyManager.registerCompany("Duplicate SP", "SP", admin.address)
      ).to.be.revertedWith("Company code already exists");
    });

    it("Should fail if non-admin tries to register company", async function () {
      await expect(
        companyManager.connect(staff).registerCompany("Test Co", "TST", staff.address)
      ).to.be.reverted;
    });

    it("Should grant COMPANY_ADMIN_ROLE to admin wallet on registration", async function () {
      await companyManager.registerCompany("Test Gas", "TG", admin.address);
      expect(await companyManager.hasRole(COMPANY_ADMIN_ROLE, admin.address)).to.be.true;
    });
  });

  describe("Branch Management", function () {
    it("Should register a branch (platform admin)", async function () {
      const tx = await companyManager.registerBranch(1, "SP Kigali Main", "Kigali", "KN 1 Street");
      await tx.wait();

      const branchCount = await companyManager.branchCount();
      expect(branchCount).to.equal(1);

      const branch = await companyManager.getBranch(1);
      expect(branch.name).to.equal("SP Kigali Main");
      expect(branch.district).to.equal("Kigali");
    });

    it("Should fail to register branch for inactive company", async function () {
      // First need to make a company inactive - this requires more setup
      // For now, just test with invalid company ID
      await expect(
        companyManager.registerBranch(99, "Invalid Branch", "Kigali", "Location")
      ).to.be.revertedWith("Invalid company");
    });

    it("Should track company branches", async function () {
      await companyManager.registerBranch(1, "Branch 1", "Kigali", "Loc 1");
      await companyManager.registerBranch(1, "Branch 2", "Gasabo", "Loc 2");
      await companyManager.registerBranch(2, "Branch 3", "Huye", "Loc 3");

      const company1Branches = await companyManager.getCompanyBranches(1);
      expect(company1Branches.length).to.equal(2);

      const company2Branches = await companyManager.getCompanyBranches(2);
      expect(company2Branches.length).to.equal(1);
    });

    it("Should update branch status", async function () {
      await companyManager.registerBranch(1, "Test Branch", "Kigali", "Location");
      
      let branch = await companyManager.getBranch(1);
      expect(branch.isActive).to.be.true;

      await companyManager.updateBranchStatus(1, false);
      branch = await companyManager.getBranch(1);
      expect(branch.isActive).to.be.false;
    });
  });

  describe("Cylinder Types", function () {
    it("Should have 3 cylinder types per company", async function () {
      // Company 1 has types 1, 2, 3
      const type1 = await companyManager.getCylinderType(1);
      expect(type1.capacityKg).to.equal(6);
      expect(type1.companyId).to.equal(1);

      const type2 = await companyManager.getCylinderType(2);
      expect(type2.capacityKg).to.equal(12);

      const type3 = await companyManager.getCylinderType(3);
      expect(type3.capacityKg).to.equal(15);
    });

    it("Should validate cylinder type", async function () {
      expect(await companyManager.isValidCylinderType(1)).to.be.true;
      expect(await companyManager.isValidCylinderType(21)).to.be.true;
      expect(await companyManager.isValidCylinderType(22)).to.be.false;
      expect(await companyManager.isValidCylinderType(0)).to.be.false;
    });
  });

  describe("Branch Inventory", function () {
    beforeEach(async function () {
      await companyManager.registerBranch(1, "Test Branch", "Kigali", "Location");
      // Grant staff role to update inventory
      await companyManager.assignBranchStaff(staff.address, 1, 1);
    });

    it("Should update inventory (increase)", async function () {
      await companyManager.connect(staff).updateInventory(1, 1, 10);
      const inventory = await companyManager.getBranchInventory(1, 1);
      expect(inventory).to.equal(10);
    });

    it("Should update inventory (decrease)", async function () {
      await companyManager.connect(staff).updateInventory(1, 1, 10);
      await companyManager.connect(staff).updateInventory(1, 1, -3);
      const inventory = await companyManager.getBranchInventory(1, 1);
      expect(inventory).to.equal(7);
    });

    it("Should fail if decreasing below zero", async function () {
      await companyManager.connect(staff).updateInventory(1, 1, 5);
      await expect(
        companyManager.connect(staff).updateInventory(1, 1, -10)
      ).to.be.revertedWith("Insufficient inventory");
    });
  });

  describe("Validation Functions", function () {
    beforeEach(async function () {
      await companyManager.registerBranch(1, "Active Branch", "Kigali", "Loc");
    });

    it("Should validate company", async function () {
      expect(await companyManager.isValidCompany(1)).to.be.true;
      expect(await companyManager.isValidCompany(7)).to.be.true;
      expect(await companyManager.isValidCompany(8)).to.be.false;
      expect(await companyManager.isValidCompany(0)).to.be.false;
    });

    it("Should validate branch", async function () {
      expect(await companyManager.isValidBranch(1)).to.be.true;
      expect(await companyManager.isValidBranch(2)).to.be.false;
      expect(await companyManager.isValidBranch(0)).to.be.false;
    });

    it("Should get branch company", async function () {
      const companyId = await companyManager.getBranchCompany(1);
      expect(companyId).to.equal(1);
    });
  });
});
