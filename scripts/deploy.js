const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Gas Cylinder Swap Platform...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());
  console.log("");

  // 1. Deploy CompanyManager
  console.log("1️⃣  Deploying CompanyManager...");
  const CompanyManager = await hre.ethers.getContractFactory("CompanyManager");
  const companyManager = await CompanyManager.deploy();
  await companyManager.waitForDeployment();
  const companyManagerAddress = await companyManager.getAddress();
  console.log("   ✅ CompanyManager deployed to:", companyManagerAddress);

  // 2. Deploy CylinderRegistry
  console.log("2️⃣  Deploying CylinderRegistry...");
  const CylinderRegistry = await hre.ethers.getContractFactory("CylinderRegistry");
  const cylinderRegistry = await CylinderRegistry.deploy();
  await cylinderRegistry.waitForDeployment();
  const cylinderRegistryAddress = await cylinderRegistry.getAddress();
  console.log("   ✅ CylinderRegistry deployed to:", cylinderRegistryAddress);

  // 3. Deploy VoucherManager
  console.log("3️⃣  Deploying VoucherManager...");
  const VoucherManager = await hre.ethers.getContractFactory("VoucherManager");
  const voucherManager = await VoucherManager.deploy();
  await voucherManager.waitForDeployment();
  const voucherManagerAddress = await voucherManager.getAddress();
  console.log("   ✅ VoucherManager deployed to:", voucherManagerAddress);

  // 4. Deploy GasSwapPlatform
  console.log("4️⃣  Deploying GasSwapPlatform...");
  const GasSwapPlatform = await hre.ethers.getContractFactory("GasSwapPlatform");
  const gasSwapPlatform = await GasSwapPlatform.deploy(
    companyManagerAddress,
    cylinderRegistryAddress,
    voucherManagerAddress
  );
  await gasSwapPlatform.waitForDeployment();
  const gasSwapPlatformAddress = await gasSwapPlatform.getAddress();
  console.log("   ✅ GasSwapPlatform deployed to:", gasSwapPlatformAddress);

  // 5. Grant roles to GasSwapPlatform and deployer
  console.log("\n5️⃣  Setting up permissions...");
  
  const BRANCH_STAFF_ROLE = await voucherManager.BRANCH_STAFF_ROLE();
  
  // Grant BRANCH_STAFF_ROLE to deployer for testing
  await voucherManager.grantStaffRole(deployer.address);
  console.log("   ✅ Granted BRANCH_STAFF_ROLE to deployer in VoucherManager");
  
  await cylinderRegistry.grantRole(BRANCH_STAFF_ROLE, deployer.address);
  console.log("   ✅ Granted BRANCH_STAFF_ROLE to deployer in CylinderRegistry");

  // Grant BRANCH_STAFF_ROLE to GasSwapPlatform contract so it can call child contracts
  await voucherManager.grantStaffRole(gasSwapPlatformAddress);
  console.log("   ✅ Granted BRANCH_STAFF_ROLE to GasSwapPlatform in VoucherManager");
  
  await cylinderRegistry.grantRole(BRANCH_STAFF_ROLE, gasSwapPlatformAddress);
  console.log("   ✅ Granted BRANCH_STAFF_ROLE to GasSwapPlatform in CylinderRegistry");

  // Grant BRANCH_STAFF_ROLE to deployer on GasSwapPlatform so they can call initiateSwap/completeSwap
  await gasSwapPlatform.grantRole(BRANCH_STAFF_ROLE, deployer.address);
  console.log("   ✅ Granted BRANCH_STAFF_ROLE to deployer in GasSwapPlatform");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   CompanyManager:    ", companyManagerAddress);
  console.log("   CylinderRegistry:  ", cylinderRegistryAddress);
  console.log("   VoucherManager:    ", voucherManagerAddress);
  console.log("   GasSwapPlatform:   ", gasSwapPlatformAddress);
  
  console.log("\n📝 Save these addresses to your .env file:");
  console.log(`   COMPANY_MANAGER_ADDRESS=${companyManagerAddress}`);
  console.log(`   CYLINDER_REGISTRY_ADDRESS=${cylinderRegistryAddress}`);
  console.log(`   VOUCHER_MANAGER_ADDRESS=${voucherManagerAddress}`);
  console.log(`   GAS_SWAP_PLATFORM_ADDRESS=${gasSwapPlatformAddress}`);

  // 6. Initialize branches for all companies (30 districts × 7 companies = 210 branches)
  console.log("\n6️⃣  Initializing branches for all companies (210 total)...");
  for (let companyId = 1; companyId <= 7; companyId++) {
    const company = await companyManager.companies(companyId);
    console.log(`   Initializing branches for ${company.name}...`);
    const tx = await companyManager.initializeCompanyBranches(companyId);
    await tx.wait();
  }
  console.log("   ✅ All 210 branches initialized (7 companies × 30 districts)");

  // 7. Register test cylinders for testing
  console.log("\n7️⃣  Registering test cylinders...");
  const testCylinders = [
    // Company 1 (SP Rwanda) - Branch 1 (Bugesera)
    { companyId: 1, typeId: 1, serial: "SP-6KG-001", branchId: 1 },
    { companyId: 1, typeId: 2, serial: "SP-12KG-001", branchId: 1 },
    { companyId: 1, typeId: 3, serial: "SP-15KG-001", branchId: 1 },
    // Company 1 (SP Rwanda) - Branch 4 (Gasabo/Kigali)
    { companyId: 1, typeId: 1, serial: "SP-6KG-002", branchId: 4 },
    { companyId: 1, typeId: 2, serial: "SP-12KG-002", branchId: 4 },
    // Company 2 (Oryx) - Branch 31 (first Oryx branch)
    { companyId: 2, typeId: 4, serial: "ORYX-6KG-001", branchId: 31 },
    { companyId: 2, typeId: 5, serial: "ORYX-12KG-001", branchId: 31 },
    // Company 4 (Kigaligas) - Branch 91-93
    { companyId: 4, typeId: 10, serial: "KGAS-6KG-001", branchId: 91 },
    { companyId: 4, typeId: 11, serial: "KGAS-12KG-001", branchId: 91 },
    { companyId: 4, typeId: 12, serial: "KGAS-15KG-001", branchId: 91 },
  ];

  const manufacturingDate = Math.floor(Date.now() / 1000) - 86400 * 365; // 1 year ago

  for (const cyl of testCylinders) {
    try {
      const tx = await cylinderRegistry.registerCylinder(
        cyl.companyId,
        cyl.typeId,
        cyl.serial,
        cyl.branchId,
        manufacturingDate
      );
      await tx.wait();
      console.log(`   ✅ Registered: ${cyl.serial} at branch ${cyl.branchId}`);
    } catch (err) {
      console.log(`   ⚠️  Skipped ${cyl.serial}: ${err.message?.slice(0, 50)}`);
    }
  }
  console.log("   Test cylinders registered!");

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const companyCount = await companyManager.companyCount();
  console.log("   Companies registered:", companyCount.toString());
  
  const branchCount = await companyManager.branchCount();
  console.log("   Branches registered:", branchCount.toString());
  
  const cylinderTypeCount = await companyManager.cylinderTypeCount();
  console.log("   Cylinder types registered:", cylinderTypeCount.toString());
  
  // Save addresses to frontend
  const addresses = {
    companyManager: companyManagerAddress,
    cylinderRegistry: cylinderRegistryAddress,
    voucherManager: voucherManagerAddress,
    gasSwapPlatform: gasSwapPlatformAddress,
    deployer: deployer.address,
    chainId: hre.network.config.chainId || hre.network.chainId || 31337
  };
  
  const frontendAddressesPath = path.join(__dirname, "../frontend/lib/contracts/deployed-addresses.json");
  fs.writeFileSync(frontendAddressesPath, JSON.stringify(addresses, null, 2));
  console.log("\n📁 Saved addresses to:", frontendAddressesPath);

  const publicDir = path.join(__dirname, "../frontend/public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicAddressesPath = path.join(publicDir, "deployed-addresses.json");
  fs.writeFileSync(publicAddressesPath, JSON.stringify(addresses, null, 2));
  console.log("📁 Saved addresses to:", publicAddressesPath);
  
  console.log("\n✨ Platform is ready to use!");
  if (hre.network.name === 'localhost' || hre.network.name === 'hardhat') {
    console.log("\n🔑 IMPORTANT: Import this private key into MetaMask to access admin/staff features:");
    console.log("   Account: " + deployer.address);
    console.log("   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    console.log("   (This is Hardhat's default Account #0)");
  }
  
  return {
    companyManager: companyManagerAddress,
    cylinderRegistry: cylinderRegistryAddress,
    voucherManager: voucherManagerAddress,
    gasSwapPlatform: gasSwapPlatformAddress
  };
}

main()
  .then((addresses) => {
    console.log("\n📦 Deployment addresses:", addresses);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
