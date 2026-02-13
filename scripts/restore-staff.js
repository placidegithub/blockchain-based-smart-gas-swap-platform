const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔄 Restoring saved branch managers...\n");

  const registryPath = path.join(__dirname, "../staff-registry.json");
  if (!fs.existsSync(registryPath)) {
    console.log("   No staff-registry.json found. No branch managers to restore.");
    console.log("   (Branch managers created via admin UI are saved here automatically)");
    return;
  }

  let registry;
  try {
    const data = fs.readFileSync(registryPath, "utf-8");
    registry = JSON.parse(data);
  } catch (e) {
    console.log("   Failed to parse staff-registry.json:", e.message);
    return;
  }

  const entries = registry.entries || [];
  if (entries.length === 0) {
    console.log("   No branch managers to restore.");
    return;
  }

  console.log(`   Found ${entries.length} branch manager(s) to restore.\n`);

  // Load contract addresses
  const addressesPath = path.join(__dirname, "../frontend/lib/contracts/deployed-addresses.json");
  let addresses;
  try {
    addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
  } catch {
    console.log("   ❌ Could not load deployed-addresses.json. Run deploy first.");
    return;
  }

  const voucherManager = await hre.ethers.getContractAt("VoucherManager", addresses.voucherManager);
  const cylinderRegistry = await hre.ethers.getContractAt("CylinderRegistry", addresses.cylinderRegistry);
  const gasSwapPlatform = await hre.ethers.getContractAt("GasSwapPlatform", addresses.gasSwapPlatform);
  const companyManager = await hre.ethers.getContractAt("CompanyManager", addresses.companyManager);

  const BRANCH_STAFF_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("BRANCH_STAFF_ROLE"));

  let restored = 0;
  let failed = 0;

  for (const entry of entries) {
    const { address: staffAddress, companyId, branchId, branchName, district } = entry;
    console.log(`   📌 Restoring ${branchName || 'Branch'} manager: ${staffAddress.slice(0, 10)}...`);

    try {
      // 1. Grant BRANCH_STAFF_ROLE on VoucherManager
      const hasVoucher = await voucherManager.hasRole(BRANCH_STAFF_ROLE, staffAddress);
      if (!hasVoucher) {
        const tx1 = await voucherManager.grantStaffRole(staffAddress);
        await tx1.wait();
        console.log(`      ✅ VoucherManager role granted`);
      } else {
        console.log(`      ✅ VoucherManager role already exists`);
      }

      // 2. Grant BRANCH_STAFF_ROLE on CylinderRegistry
      const hasCylinder = await cylinderRegistry.hasRole(BRANCH_STAFF_ROLE, staffAddress);
      if (!hasCylinder) {
        const tx2 = await cylinderRegistry.grantRole(BRANCH_STAFF_ROLE, staffAddress);
        await tx2.wait();
        console.log(`      ✅ CylinderRegistry role granted`);
      } else {
        console.log(`      ✅ CylinderRegistry role already exists`);
      }

      // 3. Grant BRANCH_STAFF_ROLE on GasSwapPlatform
      const hasPlatform = await gasSwapPlatform.hasRole(BRANCH_STAFF_ROLE, staffAddress);
      if (!hasPlatform) {
        const tx3 = await gasSwapPlatform.grantRole(BRANCH_STAFF_ROLE, staffAddress);
        await tx3.wait();
        console.log(`      ✅ GasSwapPlatform role granted`);
      } else {
        console.log(`      ✅ GasSwapPlatform role already exists`);
      }

      // 4. Assign to branch on CompanyManager
      try {
        const tx4 = await companyManager.assignBranchStaff(staffAddress, companyId, branchId);
        await tx4.wait();
        console.log(`      ✅ Assigned to company ${companyId}, branch ${branchId}`);
      } catch (e) {
        console.log(`      ⚠️  Branch assignment: ${e.message?.slice(0, 60)}`);
      }

      // 5. Fund the wallet with test ETH
      try {
        await hre.network.provider.send("hardhat_setBalance", [
          staffAddress,
          "0x8AC7230489E80000", // 10 ETH
        ]);
        console.log(`      ✅ Funded with 10 ETH`);
      } catch {
        console.log(`      ⚠️  Could not fund wallet (non-Hardhat network?)`);
      }

      restored++;
      console.log(`      ✅ Fully restored!\n`);
    } catch (e) {
      console.log(`      ❌ Failed: ${e.message?.slice(0, 80)}\n`);
      failed++;
    }
  }

  console.log("=".repeat(60));
  console.log(`🎉 Restore complete: ${restored} restored, ${failed} failed`);
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Restore failed:", error);
    process.exit(1);
  });
