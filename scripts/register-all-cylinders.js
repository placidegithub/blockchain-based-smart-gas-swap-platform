const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔧 Registering cylinders for ALL branches...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  
  // Load addresses
  const addressesPath = path.join(__dirname, "../frontend/lib/contracts/deployed-addresses.json");
  let addresses;
  
  try {
    const data = fs.readFileSync(addressesPath, 'utf8');
    addresses = JSON.parse(data);
    console.log("✅ Loaded contract addresses\n");
  } catch {
    console.log("❌ Could not load deployed-addresses.json");
    console.log("   Run 'npx hardhat run scripts/deploy.js --network localhost' first");
    return;
  }

  // Connect to contracts
  const companyManager = await hre.ethers.getContractAt("CompanyManager", addresses.companyManager);
  const cylinderRegistry = await hre.ethers.getContractAt("CylinderRegistry", addresses.cylinderRegistry);

  const companyCount = await companyManager.companyCount();
  const branchCount = await companyManager.branchCount();
  const initialCylinderCount = await cylinderRegistry.getTotalCylinders();
  
  console.log(`📊 Current Status:`);
  console.log(`   Companies: ${companyCount}`);
  console.log(`   Branches: ${branchCount}`);
  console.log(`   Existing Cylinders: ${initialCylinderCount}`);
  console.log("");

  // Cylinder types: 6kg, 12kg, 15kg (IDs 1, 2, 3 for each company)
  const CYLINDERS_PER_TYPE = 5; // 5 cylinders of each type per branch
  
  let registered = 0;
  let skipped = 0;

  // Register cylinders for each branch
  for (let branchId = 1; branchId <= Number(branchCount); branchId++) {
    try {
      const branch = await companyManager.getBranch(branchId);
      const companyId = Number(branch.companyId);
      
      if (branchId % 20 === 1) {
        console.log(`\n🏪 Processing branches ${branchId} to ${Math.min(branchId + 19, Number(branchCount))}...`);
      }

      // Get cylinder type IDs for this company
      // Each company has 3 cylinder types registered sequentially
      const baseTypeId = (companyId - 1) * 3 + 1;
      
      // Register cylinders for each type (6kg, 12kg, 15kg)
      for (let typeOffset = 0; typeOffset < 3; typeOffset++) {
        const cylinderTypeId = baseTypeId + typeOffset;
        const typeName = ['6kg', '12kg', '15kg'][typeOffset];
        
        for (let i = 1; i <= CYLINDERS_PER_TYPE; i++) {
          const serialNumber = `CYL-C${companyId.toString().padStart(2, '0')}-B${branchId.toString().padStart(3, '0')}-${typeName}-${i.toString().padStart(3, '0')}`;
          
          try {
            const tx = await cylinderRegistry.registerCylinder(
              companyId,
              cylinderTypeId,
              serialNumber,
              branchId,
              Math.floor(Date.now() / 1000) - (180 * 24 * 60 * 60) // 6 months ago
            );
            await tx.wait();
            registered++;
            
            // Progress indicator
            if (registered % 50 === 0) {
              console.log(`   ✅ Registered ${registered} cylinders...`);
            }
          } catch (error) {
            // Serial might already exist or other error
            skipped++;
            if (skipped <= 5) {
              console.log(`   ⚠️ Skip ${serialNumber}: ${error.message?.slice(0, 60)}`);
            }
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Error processing branch ${branchId}: ${error.message?.slice(0, 50)}`);
    }
  }

  const finalCylinderCount = await cylinderRegistry.getTotalCylinders();
  
  console.log("\n" + "=".repeat(60));
  console.log("🎉 CYLINDER REGISTRATION COMPLETE!");
  console.log("=".repeat(60));
  console.log(`\n📊 Results:`);
  console.log(`   New cylinders registered: ${registered}`);
  console.log(`   Skipped (already exist): ${skipped}`);
  console.log(`   Total cylinders now: ${finalCylinderCount}`);
  console.log(`\n   Each branch should have ${CYLINDERS_PER_TYPE * 3} cylinders (${CYLINDERS_PER_TYPE} of each type)`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  });
