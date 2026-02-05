const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Setup Customer Test Account - Creates sample vouchers for a test customer
 * 
 * Hardhat default accounts:
 * 
 * Account #0 (ADMIN): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
 * Account #1 (STAFF): 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
 * Account #2 (STAFF 2): 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
 * 
 * Account #3 (CUSTOMER): 0x90F79bf6EB2c4f870365E785982E1f101E93b906
 * Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
 * 
 * Account #4 (CUSTOMER 2): 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
 * Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
 */

async function main() {
  console.log("👤 Setting up Customer Test Account with Sample Vouchers...\n");
  
  const signers = await hre.ethers.getSigners();
  const [admin, staff1, staff2, customer1, customer2] = signers;
  
  console.log("📋 Accounts:");
  console.log(`   Admin:      ${admin.address}`);
  console.log(`   Staff:      ${staff1.address}`);
  console.log(`   Customer 1: ${customer1.address}`);
  console.log(`   Customer 2: ${customer2.address}`);
  
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

  // Connect to contracts
  const voucherManager = await hre.ethers.getContractAt("VoucherManager", addresses.voucherManager);
  const companyManager = await hre.ethers.getContractAt("CompanyManager", addresses.companyManager);
  const cylinderRegistry = await hre.ethers.getContractAt("CylinderRegistry", addresses.cylinderRegistry);
  
  // Get staff role hash and check if staff1 has the role
  const BRANCH_STAFF_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("BRANCH_STAFF_ROLE"));
  const staffHasRole = await voucherManager.hasRole(BRANCH_STAFF_ROLE, staff1.address);
  
  if (!staffHasRole) {
    console.log("\n⚠️ Staff account doesn't have BRANCH_STAFF_ROLE");
    console.log("   Granting role...");
    const tx = await voucherManager.grantStaffRole(staff1.address);
    await tx.wait();
    console.log("   ✅ Role granted");
  }
  
  // Check if we have branches
  const branchCount = await companyManager.branchCount();
  if (branchCount === 0n) {
    console.log("\n❌ No branches found. Run 'npm run setup:sample' first");
    return;
  }
  
  // Check if we have cylinders
  const totalCylinders = await cylinderRegistry.getTotalCylinders();
  if (totalCylinders === 0n) {
    console.log("\n❌ No cylinders found. Run 'npm run setup:sample' first");
    return;
  }
  
  console.log("\n🎫 Creating sample vouchers for Customer 1...\n");
  
  // Connect voucherManager as staff1 for initiating swaps
  const voucherManagerAsStaff = voucherManager.connect(staff1);
  
  // Create 3 vouchers for customer 1
  const customerVouchers = [];
  
  for (let i = 0; i < 3; i++) {
    try {
      const branchId = BigInt((i % Number(branchCount)) + 1);
      const serialNumber = `CYL-TEST-CUST1-${Date.now()}-${i}`;
      
      console.log(`   Creating voucher ${i + 1}...`);
      console.log(`      Customer: ${customer1.address}`);
      console.log(`      Branch ID: ${branchId}`);
      console.log(`      Serial: ${serialNumber}`);
      
      const tx = await voucherManagerAsStaff.initiateSwap(
        customer1.address,
        serialNumber,
        branchId
      );
      const receipt = await tx.wait();
      
      // Get voucher ID from event
      const event = receipt.logs.find(log => {
        try {
          return voucherManager.interface.parseLog(log)?.name === 'VoucherCreated';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = voucherManager.interface.parseLog(event);
        const voucherId = parsed.args.voucherId;
        customerVouchers.push(voucherId);
        console.log(`      ✅ Voucher created: ID #${voucherId}\n`);
      } else {
        console.log(`      ✅ Voucher created (ID in logs)\n`);
      }
      
      // Small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`      ⚠️ Could not create voucher: ${error.message?.slice(0, 60)}\n`);
    }
  }
  
  // Create 2 vouchers for customer 2
  console.log("\n🎫 Creating sample vouchers for Customer 2...\n");
  
  for (let i = 0; i < 2; i++) {
    try {
      const branchId = BigInt((i % Number(branchCount)) + 1);
      const serialNumber = `CYL-TEST-CUST2-${Date.now()}-${i}`;
      
      console.log(`   Creating voucher ${i + 1}...`);
      
      const tx = await voucherManagerAsStaff.initiateSwap(
        customer2.address,
        serialNumber,
        branchId
      );
      await tx.wait();
      console.log(`      ✅ Voucher created\n`);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`      ⚠️ Could not create voucher: ${error.message?.slice(0, 60)}\n`);
    }
  }
  
  // Display final summary
  console.log("\n" + "=".repeat(70));
  console.log("🎉 CUSTOMER TEST ACCOUNTS READY!");
  console.log("=".repeat(70));
  
  console.log("\n🔑 CUSTOMER MetaMask Import Keys:");
  console.log("─".repeat(70));
  
  console.log("\n   CUSTOMER 1 (has 3 vouchers):");
  console.log(`   Address: ${customer1.address}`);
  console.log("   Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6");
  console.log("   ➤ Import this key in MetaMask to access /dashboard");
  
  console.log("\n   CUSTOMER 2 (has 2 vouchers):");
  console.log(`   Address: ${customer2.address}`);
  console.log("   Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a");
  console.log("   ➤ Import this key in MetaMask to access /dashboard");
  
  console.log("\n" + "─".repeat(70));
  console.log("\n📌 HOW TO USE:");
  console.log("   1. Open MetaMask");
  console.log("   2. Click 'Import Account'");
  console.log("   3. Paste the private key above");
  console.log("   4. Connect to the app and go to /dashboard");
  console.log("   5. You will see all vouchers created by staff!");
  
  console.log("\n" + "=".repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
