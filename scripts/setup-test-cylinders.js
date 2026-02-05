const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Quick setup of test cylinders at commonly used branches
 * Run this after deploy:local and setup:roles
 */
async function main() {
  console.log("🔧 Setting up test cylinders for common branches...\n");
  
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
    console.log("   Run 'npm run deploy:local' first");
    return;
  }

  // Connect to contracts
  const companyManager = await hre.ethers.getContractAt("CompanyManager", addresses.companyManager);
  const cylinderRegistry = await hre.ethers.getContractAt("CylinderRegistry", addresses.cylinderRegistry);

  // Generate branches for ALL 30 districts for each of 7 companies (210 total branches)
  // Branch ID = (companyId - 1) * 30 + districtId + 1
  const DISTRICTS = [
    'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara', 'Huye',
    'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga', 'Musanze', 'Ngoma',
    'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe', 'Nyamasheke', 'Nyanza', 'Nyarugenge',
    'Nyaruguru', 'Rubavu', 'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
  ];
  
  const COMPANIES = [
    'SP Rwanda', 'Oryx Energies', 'Lake Gas', 'Kigaligas', 'Safe Gas', 'Merez', 'Kobil'
  ];
  
  // Generate all branch configurations
  const testBranches = [];
  for (let companyId = 1; companyId <= 7; companyId++) {
    for (let districtId = 0; districtId < 30; districtId++) {
      const branchId = (companyId - 1) * 30 + districtId + 1;
      testBranches.push({
        branchId,
        companyId,
        name: `${COMPANIES[companyId - 1]} - ${DISTRICTS[districtId]}`
      });
    }
  }
  
  console.log(`📋 Will register cylinders at ${testBranches.length} branches (7 companies × 30 districts)`);

  let registered = 0;
  let skipped = 0;
  let currentCompany = 0;

  const manufacturingDate = Math.floor(Date.now() / 1000) - (180 * 24 * 60 * 60); // 6 months ago
  const CYLINDERS_PER_TYPE = 3; // 3 cylinders of each type per branch (9 total per branch)

  for (const branch of testBranches) {
    // Log company progress
    if (branch.companyId !== currentCompany) {
      currentCompany = branch.companyId;
      console.log(`\n🏢 Processing ${COMPANIES[currentCompany - 1]} (Company ${currentCompany}/7)...`);
    }
    
    // Each company has 3 cylinder types, starting at (companyId-1)*3 + 1
    const baseTypeId = (branch.companyId - 1) * 3 + 1;
    const typeNames = ['6kg', '12kg', '15kg'];
    
    // Register cylinders of each type at this branch
    for (let typeOffset = 0; typeOffset < 3; typeOffset++) {
      const cylinderTypeId = baseTypeId + typeOffset;
      const typeName = typeNames[typeOffset];
      
      for (let i = 1; i <= CYLINDERS_PER_TYPE; i++) {
        // Create a unique, readable serial number
        const serialNumber = `CYL-B${branch.branchId.toString().padStart(3, '0')}-${typeName}-${i.toString().padStart(2, '0')}`;
        
        try {
          const tx = await cylinderRegistry.registerCylinder(
            branch.companyId,
            cylinderTypeId,
            serialNumber,
            branch.branchId,
            manufacturingDate
          );
          await tx.wait();
          registered++;
          
          // Progress indicator every 50 cylinders
          if (registered % 50 === 0) {
            console.log(`   ✅ Registered ${registered} cylinders...`);
          }
        } catch (error) {
          skipped++;
        }
      }
    }
  }

  const totalCylinders = await cylinderRegistry.getTotalCylinders();

  console.log("\n" + "=".repeat(60));
  console.log("🎉 CYLINDER REGISTRATION COMPLETE!");
  console.log("=".repeat(60));
  console.log(`\n📊 Results:`);
  console.log(`   New cylinders registered: ${registered}`);
  console.log(`   Skipped (already exist): ${skipped}`);
  console.log(`   Total cylinders in registry: ${totalCylinders}`);
  console.log(`   Branches covered: ${testBranches.length} (all 30 districts × 7 companies)`);
  console.log(`   Cylinders per branch: ${CYLINDERS_PER_TYPE * 3} (${CYLINDERS_PER_TYPE} of each type: 6kg, 12kg, 15kg)`);
  
  console.log("\n💡 Now you can create and redeem vouchers at any district!");
  console.log("   Example cylinder serial format: CYL-B{branchId}-{type}-{number}");
  console.log("   - CYL-B001-6kg-01 (SP Rwanda - Bugesera, 6kg)");
  console.log("   - CYL-B041-12kg-02 (Oryx - Kayonza, 12kg)");
  console.log("   - CYL-B106-15kg-03 (Kigaligas - Ngoma, 15kg)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
