const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("📦 Setting up sample data for Gas Swap Platform...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  
  // Try to load addresses from deployed-addresses.json first
  let addresses;
  const addressesPath = path.join(__dirname, "../frontend/lib/contracts/deployed-addresses.json");
  
  try {
    const data = fs.readFileSync(addressesPath, 'utf8');
    addresses = JSON.parse(data);
    console.log("✅ Loaded addresses from deployed-addresses.json");
  } catch {
    console.log("⚠️ Could not load deployed-addresses.json, using environment variables...");
    addresses = {
      companyManager: process.env.COMPANY_MANAGER_ADDRESS,
      cylinderRegistry: process.env.CYLINDER_REGISTRY_ADDRESS,
      voucherManager: process.env.VOUCHER_MANAGER_ADDRESS,
    };
  }
  
  if (!addresses.companyManager || !addresses.cylinderRegistry) {
    console.log("❌ Contract addresses not found!");
    console.log("   Run 'npm run deploy:local' first to deploy contracts");
    return;
  }

  // Connect to contracts
  const companyManager = await hre.ethers.getContractAt("CompanyManager", addresses.companyManager);
  const cylinderRegistry = await hre.ethers.getContractAt("CylinderRegistry", addresses.cylinderRegistry);
  const voucherManager = await hre.ethers.getContractAt("VoucherManager", addresses.voucherManager);

  console.log("\n📍 Connected to contracts");
  console.log("   CompanyManager:", addresses.companyManager);
  console.log("   CylinderRegistry:", addresses.cylinderRegistry);
  console.log("   VoucherManager:", addresses.voucherManager);

  // Rwanda Districts
  const districts = [
    "Kigali", "Gasabo", "Kicukiro", "Nyarugenge",
    "Musanze", "Rubavu", "Rusizi", "Huye",
    "Muhanga", "Rwamagana", "Kayonza", "Nyagatare"
  ];

  // Step 1: Check existing companies (auto-registered in constructor)
  console.log("\n🏢 Checking companies...\n");
  
  let companyCount = await companyManager.companyCount();
  console.log(`   Companies already registered: ${companyCount}`);
  
  // List all registered companies
  for (let i = 1; i <= Math.min(Number(companyCount), 7); i++) {
    const company = await companyManager.getCompany(i);
    console.log(`   ${i}. ${company.name} (${company.code})`);
  }

  // Step 2: Check Cylinder Types (auto-registered per company in constructor)
  console.log("\n⛽ Checking cylinder types...\n");
  
  let cylinderTypeCount = await companyManager.cylinderTypeCount();
  console.log(`   Cylinder types already registered: ${cylinderTypeCount}`);
  console.log(`   (Each company has 3 types: 6kg, 12kg, 15kg)`);

  // Step 3: Register Branches
  console.log("\n🏪 Registering branches...\n");
  
  companyCount = await companyManager.companyCount();
  let branchCount = await companyManager.branchCount();
  
  if (branchCount == 0n) {
    for (let companyId = 1; companyId <= Math.min(Number(companyCount), 4); companyId++) {
      const company = await companyManager.getCompany(companyId);
      console.log(`   Company ${companyId}: ${company.name}`);
      
      // Register 3 branches per company
      for (let i = 0; i < 3; i++) {
        const district = districts[((companyId - 1) * 3 + i) % districts.length];
        const branchName = `${company.name} - ${district}`;
        
        try {
          const tx = await companyManager.registerBranch(
            companyId,
            branchName,
            district,
            `${district} City Center`
          );
          await tx.wait();
          console.log(`      ✅ Registered: ${branchName}`);
        } catch (error) {
          console.log(`      ⚠️ Could not register branch: ${error.message?.slice(0, 50)}`);
        }
      }
    }
  } else {
    console.log(`   Branches already registered: ${branchCount}`);
  }

  // Step 4: Register Cylinders (5 of each type per branch = 15 per branch)
  console.log("\n🔧 Registering cylinders for all branches...\n");
  
  branchCount = await companyManager.branchCount();
  cylinderTypeCount = await companyManager.cylinderTypeCount();
  let totalCylinders = await cylinderRegistry.getTotalCylinders();
  
  const CYLINDERS_PER_TYPE = 5; // 5 cylinders of each size (6kg, 12kg, 15kg) = 15 per branch
  
  if (totalCylinders == 0n) {
    let registered = 0;
    
    // Register cylinders at ALL branches
    for (let branchId = 1; branchId <= Number(branchCount); branchId++) {
      const branch = await companyManager.getBranch(branchId);
      const companyId = Number(branch.companyId);
      
      console.log(`   Branch ${branchId}: ${branch.name}`);
      
      // Each company has 3 cylinder types (6kg, 12kg, 15kg)
      // Cylinder types are registered per company, so typeId = (companyId-1)*3 + offset + 1
      const baseTypeId = (companyId - 1) * 3 + 1;
      
      // Register CYLINDERS_PER_TYPE cylinders of each type at each branch
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
            
            // Show progress every 20 cylinders
            if (registered % 20 === 0) {
              console.log(`      ✅ Registered ${registered} cylinders...`);
            }
          } catch (error) {
            // Skip silently if already exists
          }
        }
      }
    }
    console.log(`   ✅ Total registered: ${registered} cylinders`);
  } else {
    console.log(`   Cylinders already registered: ${totalCylinders}`);
  }

  // Display summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 SAMPLE DATA SETUP COMPLETE!");
  console.log("=".repeat(60));
  
  const finalCompanyCount = await companyManager.companyCount();
  const finalBranchCount = await companyManager.branchCount();
  const finalCylinderTypeCount = await companyManager.cylinderTypeCount();
  const finalCylinderCount = await cylinderRegistry.getTotalCylinders();
  
  console.log("\n📊 Summary:");
  console.log(`   Companies: ${finalCompanyCount}`);
  console.log(`   Cylinder Types: ${finalCylinderTypeCount}`);
  console.log(`   Branches: ${finalBranchCount}`);
  console.log(`   Cylinders: ${finalCylinderCount}`);
  
  console.log("\n🔑 Admin/Staff Account:");
  console.log(`   Address: ${deployer.address}`);
  console.log("   This account has PLATFORM_ADMIN_ROLE and BRANCH_STAFF_ROLE");
  
  console.log("\n✨ Platform is ready for testing!");
  console.log("\n📌 To access Staff/Admin dashboards, import this private key into MetaMask:");
  console.log("   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
