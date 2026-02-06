const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Fix Staff Roles - Grants missing BRANCH_STAFF_ROLE on all contracts
 * for staff members who only have the role on some contracts.
 * 
 * Usage: npx hardhat run scripts/fix-staff-roles.js --network localhost
 * 
 * This checks ALL branch staff in CompanyManager and ensures they have
 * the role on VoucherManager, CylinderRegistry, and GasSwapPlatform too.
 */

async function main() {
  console.log("🔧 Fixing staff roles across all contracts...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  
  const addressesPath = path.join(__dirname, "../frontend/lib/contracts/deployed-addresses.json");
  let addresses;
  
  try {
    const data = fs.readFileSync(addressesPath, 'utf8');
    addresses = JSON.parse(data);
    console.log("✅ Loaded contract addresses\n");
  } catch {
    console.log("❌ Could not load deployed-addresses.json");
    console.log("   Run 'npm run deploy:local' first");
    return;
  }

  const companyManager = await hre.ethers.getContractAt("CompanyManager", addresses.companyManager);
  const voucherManager = await hre.ethers.getContractAt("VoucherManager", addresses.voucherManager);
  const cylinderRegistry = await hre.ethers.getContractAt("CylinderRegistry", addresses.cylinderRegistry);
  const gasSwapPlatform = await hre.ethers.getContractAt("GasSwapPlatform", addresses.gasSwapPlatform);

  const BRANCH_STAFF_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("BRANCH_STAFF_ROLE"));

  const branchCount = await companyManager.branchCount();
  console.log(`📊 Total branches: ${branchCount}\n`);

  // Collect all unique staff addresses by checking StaffAssigned events
  const filter = companyManager.filters.StaffAssigned();
  const events = await companyManager.queryFilter(filter);
  
  const staffAddresses = new Set();
  for (const event of events) {
    const staff = event.args?.staff;
    if (staff && staff !== hre.ethers.ZeroAddress) {
      // Check if this address currently has BRANCH_STAFF_ROLE on CompanyManager
      const hasRole = await companyManager.hasRole(BRANCH_STAFF_ROLE, staff);
      if (hasRole) {
        staffAddresses.add(staff);
      }
    }
  }

  console.log(`👥 Found ${staffAddresses.size} active staff member(s)\n`);

  let fixed = 0;

  for (const staffAddress of staffAddresses) {
    console.log(`\n🔍 Checking ${staffAddress}...`);
    
    const hasOnVoucher = await voucherManager.hasRole(BRANCH_STAFF_ROLE, staffAddress);
    const hasOnCylinder = await cylinderRegistry.hasRole(BRANCH_STAFF_ROLE, staffAddress);
    const hasOnPlatform = await gasSwapPlatform.hasRole(BRANCH_STAFF_ROLE, staffAddress);
    
    console.log(`   VoucherManager:    ${hasOnVoucher ? '✅' : '❌ MISSING'}`);
    console.log(`   CylinderRegistry:  ${hasOnCylinder ? '✅' : '❌ MISSING'}`);
    console.log(`   GasSwapPlatform:   ${hasOnPlatform ? '✅' : '❌ MISSING'}`);

    if (!hasOnVoucher) {
      try {
        const tx = await voucherManager.grantStaffRole(staffAddress);
        await tx.wait();
        console.log(`   ✅ Granted on VoucherManager`);
        fixed++;
      } catch (err) {
        console.log(`   ❌ Failed VoucherManager: ${err.message?.slice(0, 50)}`);
      }
    }

    if (!hasOnCylinder) {
      try {
        const tx = await cylinderRegistry.grantRole(BRANCH_STAFF_ROLE, staffAddress);
        await tx.wait();
        console.log(`   ✅ Granted on CylinderRegistry`);
        fixed++;
      } catch (err) {
        console.log(`   ❌ Failed CylinderRegistry: ${err.message?.slice(0, 50)}`);
      }
    }

    if (!hasOnPlatform) {
      try {
        const tx = await gasSwapPlatform.grantRole(BRANCH_STAFF_ROLE, staffAddress);
        await tx.wait();
        console.log(`   ✅ Granted on GasSwapPlatform`);
        fixed++;
      } catch (err) {
        console.log(`   ❌ Failed GasSwapPlatform: ${err.message?.slice(0, 50)}`);
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`🎉 Done! Fixed ${fixed} missing role(s).`);
  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
