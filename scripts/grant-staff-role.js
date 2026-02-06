const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Grant BRANCH_STAFF_ROLE to a specific address on ALL contracts.
 * 
 * Usage: npx hardhat run scripts/grant-staff-role.js --network localhost
 * 
 * Edit STAFF_ADDRESS below before running.
 */

const STAFF_ADDRESS = "0x802a2638B0d438501d755cbbc48f651FfcEe073C";

async function main() {
  console.log(`\n🔧 Granting BRANCH_STAFF_ROLE to ${STAFF_ADDRESS} on all contracts...\n`);

  const addressesPath = path.join(__dirname, "../frontend/lib/contracts/deployed-addresses.json");
  const data = fs.readFileSync(addressesPath, 'utf8');
  const addresses = JSON.parse(data);

  const voucherManager = await hre.ethers.getContractAt("VoucherManager", addresses.voucherManager);
  const cylinderRegistry = await hre.ethers.getContractAt("CylinderRegistry", addresses.cylinderRegistry);
  const gasSwapPlatform = await hre.ethers.getContractAt("GasSwapPlatform", addresses.gasSwapPlatform);

  const BRANCH_STAFF_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("BRANCH_STAFF_ROLE"));

  // VoucherManager
  const hasV = await voucherManager.hasRole(BRANCH_STAFF_ROLE, STAFF_ADDRESS);
  if (!hasV) {
    const tx = await voucherManager.grantStaffRole(STAFF_ADDRESS);
    await tx.wait();
    console.log("✅ Granted on VoucherManager");
  } else {
    console.log("✅ VoucherManager: already has role");
  }

  // CylinderRegistry
  const hasC = await cylinderRegistry.hasRole(BRANCH_STAFF_ROLE, STAFF_ADDRESS);
  if (!hasC) {
    const tx = await cylinderRegistry.grantRole(BRANCH_STAFF_ROLE, STAFF_ADDRESS);
    await tx.wait();
    console.log("✅ Granted on CylinderRegistry");
  } else {
    console.log("✅ CylinderRegistry: already has role");
  }

  // GasSwapPlatform
  const hasP = await gasSwapPlatform.hasRole(BRANCH_STAFF_ROLE, STAFF_ADDRESS);
  if (!hasP) {
    const tx = await gasSwapPlatform.grantRole(BRANCH_STAFF_ROLE, STAFF_ADDRESS);
    await tx.wait();
    console.log("✅ Granted on GasSwapPlatform");
  } else {
    console.log("✅ GasSwapPlatform: already has role");
  }

  console.log("\n🎉 Done! Staff can now create vouchers.\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
