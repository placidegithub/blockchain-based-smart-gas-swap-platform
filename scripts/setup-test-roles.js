const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Setup Test Roles - Creates separate admin and staff accounts for testing
 * 
 * Hardhat default accounts (use different ones for different roles):
 * 
 * Account #0 (deployer - ADMIN): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
 * Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
 * 
 * Account #1 (STAFF): 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
 * Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
 * 
 * Account #2 (STAFF 2): 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
 * Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
 */

async function main() {
  console.log("🔐 Setting up Role-Based Access Control...\n");
  
  const signers = await hre.ethers.getSigners();
  const [admin, staff1, staff2] = signers;
  
  console.log("📋 Accounts:");
  console.log(`   Admin:   ${admin.address}`);
  console.log(`   Staff 1: ${staff1.address}`);
  console.log(`   Staff 2: ${staff2.address}`);
  
  // Load contract addresses
  const addressesPath = path.join(__dirname, "../frontend/lib/contracts/deployed-addresses.json");
  let addresses;
  
  try {
    const data = fs.readFileSync(addressesPath, 'utf8');
    addresses = JSON.parse(data);
    console.log("\n✅ Loaded contract addresses");
  } catch {
    console.log("\n❌ Could not load deployed-addresses.json");
    console.log("   Run 'npm run deploy:local' first");
    return;
  }

  // Connect to all contracts that have role management
  const voucherManager = await hre.ethers.getContractAt("VoucherManager", addresses.voucherManager);
  const cylinderRegistry = await hre.ethers.getContractAt("CylinderRegistry", addresses.cylinderRegistry);
  const gasSwapPlatform = await hre.ethers.getContractAt("GasSwapPlatform", addresses.gasSwapPlatform);
  const companyManager = await hre.ethers.getContractAt("CompanyManager", addresses.companyManager);
  
  // Role hashes
  const PLATFORM_ADMIN_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("PLATFORM_ADMIN_ROLE"));
  const BRANCH_STAFF_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("BRANCH_STAFF_ROLE"));
  
  console.log("\n🔧 Configuring roles...\n");
  
  // Check current roles for admin
  const adminHasAdmin = await voucherManager.hasRole(PLATFORM_ADMIN_ROLE, admin.address);
  const adminHasStaff = await voucherManager.hasRole(BRANCH_STAFF_ROLE, admin.address);
  
  console.log(`   Admin account (${admin.address.slice(0, 10)}...):`);
  console.log(`      PLATFORM_ADMIN_ROLE: ${adminHasAdmin ? '✅' : '❌'}`);
  console.log(`      BRANCH_STAFF_ROLE: ${adminHasStaff ? '✅' : '❌'}`);
  
  // IMPORTANT: Remove BRANCH_STAFF_ROLE from admin to enforce separation
  if (adminHasStaff) {
    console.log("\n   ⚠️ Admin has Staff role - removing for strict separation...");
    try {
      // Use revokeStaffRole function (admin-only)
      const tx = await voucherManager.revokeStaffRole(admin.address);
      await tx.wait();
      console.log("   ✅ Removed BRANCH_STAFF_ROLE from Admin");
    } catch (error) {
      console.log(`   ⚠️ Could not revoke: ${error.message?.slice(0, 50)}`);
    }
  }
  
  // Grant BRANCH_STAFF_ROLE to staff accounts on ALL contracts
  console.log("\n   Granting roles to staff accounts on all contracts...\n");
  
  for (const [index, staffAccount] of [staff1, staff2].entries()) {
    console.log(`   Setting up Staff ${index + 1} (${staffAccount.address.slice(0, 10)}...):`);
    
    // Grant on VoucherManager
    const hasStaffVoucher = await voucherManager.hasRole(BRANCH_STAFF_ROLE, staffAccount.address);
    if (!hasStaffVoucher) {
      try {
        const tx = await voucherManager.grantStaffRole(staffAccount.address);
        await tx.wait();
        console.log(`      ✅ VoucherManager: BRANCH_STAFF_ROLE granted`);
      } catch (error) {
        console.log(`      ❌ VoucherManager: ${error.message?.slice(0, 40)}`);
      }
    } else {
      console.log(`      ✅ VoucherManager: already has role`);
    }
    
    // Grant on CylinderRegistry
    const hasStaffCylinder = await cylinderRegistry.hasRole(BRANCH_STAFF_ROLE, staffAccount.address);
    if (!hasStaffCylinder) {
      try {
        const tx = await cylinderRegistry.grantRole(BRANCH_STAFF_ROLE, staffAccount.address);
        await tx.wait();
        console.log(`      ✅ CylinderRegistry: BRANCH_STAFF_ROLE granted`);
      } catch (error) {
        console.log(`      ❌ CylinderRegistry: ${error.message?.slice(0, 40)}`);
      }
    } else {
      console.log(`      ✅ CylinderRegistry: already has role`);
    }
    
    // Grant on GasSwapPlatform
    const hasStaffPlatform = await gasSwapPlatform.hasRole(BRANCH_STAFF_ROLE, staffAccount.address);
    if (!hasStaffPlatform) {
      try {
        const tx = await gasSwapPlatform.grantRole(BRANCH_STAFF_ROLE, staffAccount.address);
        await tx.wait();
        console.log(`      ✅ GasSwapPlatform: BRANCH_STAFF_ROLE granted`);
      } catch (error) {
        console.log(`      ❌ GasSwapPlatform: ${error.message?.slice(0, 40)}`);
      }
    } else {
      console.log(`      ✅ GasSwapPlatform: already has role`);
    }
    
    console.log("");
  }
  
  // Display final summary
  console.log("\n" + "=".repeat(70));
  console.log("🎉 ROLE-BASED ACCESS CONTROL CONFIGURED!");
  console.log("=".repeat(70));
  
  console.log("\n📊 Role Assignment:");
  console.log("─".repeat(70));
  console.log("│ Role            │ Wallet Address                             │");
  console.log("─".repeat(70));
  console.log(`│ PLATFORM_ADMIN  │ ${admin.address} │`);
  console.log(`│ BRANCH_STAFF    │ ${staff1.address} │`);
  console.log(`│ BRANCH_STAFF    │ ${staff2.address} │`);
  console.log("─".repeat(70));
  
  console.log("\n🔑 MetaMask Import Keys:");
  console.log("─".repeat(70));
  console.log("\n   ADMIN Account (Platform Administrator):");
  console.log(`   Address: ${admin.address}`);
  console.log("   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  console.log("   ➤ Can access: /admin/* pages only");
  
  console.log("\n   STAFF Account 1 (Branch Staff):");
  console.log(`   Address: ${staff1.address}`);
  console.log("   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  console.log("   ➤ Can access: /staff/* pages only");
  
  console.log("\n   STAFF Account 2 (Branch Staff):");
  console.log(`   Address: ${staff2.address}`);
  console.log("   Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");
  console.log("   ➤ Can access: /staff/* pages only");
  
  console.log("\n" + "=".repeat(70));
  console.log("✨ Now each role has access only to their specific dashboard!");
  console.log("=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
