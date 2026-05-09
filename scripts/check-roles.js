const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function resolveTargetAddress() {
	const cliAddress = process.argv.slice(2).find((arg) => arg.startsWith("0x"));
	const envAddress = process.env.TARGET_ADDRESS;
	const targetAddress = cliAddress || envAddress;

	if (!targetAddress) {
		throw new Error(
			"Missing target address. Pass it as CLI arg after '--' or set TARGET_ADDRESS in env."
		);
	}

	if (!hre.ethers.isAddress(targetAddress)) {
		throw new Error(`Invalid Ethereum address: ${targetAddress}`);
	}

	return hre.ethers.getAddress(targetAddress);
}

async function main() {
	const target = resolveTargetAddress();

	const addressesPath = path.join(__dirname, "../frontend/lib/contracts/deployed-addresses.json");
	const data = fs.readFileSync(addressesPath, "utf8");
	const addresses = JSON.parse(data);

	const voucherManager = await hre.ethers.getContractAt("VoucherManager", addresses.voucherManager);
	const gasSwapPlatform = await hre.ethers.getContractAt("GasSwapPlatform", addresses.gasSwapPlatform);
	const companyManager = await hre.ethers.getContractAt("CompanyManager", addresses.companyManager);

	const PLATFORM_ADMIN_ROLE = await voucherManager.PLATFORM_ADMIN_ROLE();
	const BRANCH_STAFF_ROLE = await voucherManager.BRANCH_STAFF_ROLE();

	const [adminOnVoucher, adminOnPlatform, staffOnVoucher, staffOnPlatform, staffOnCompany] = await Promise.all([
		voucherManager.hasRole(PLATFORM_ADMIN_ROLE, target),
		gasSwapPlatform.hasRole(PLATFORM_ADMIN_ROLE, target),
		voucherManager.hasRole(BRANCH_STAFF_ROLE, target),
		gasSwapPlatform.hasRole(BRANCH_STAFF_ROLE, target),
		companyManager.hasRole(BRANCH_STAFF_ROLE, target),
	]);

	console.log("\n🔎 Role check for:", target);
	console.log("Network:", hre.network.name, "(chainId:", hre.network.config.chainId, ")");
	console.log("\nPLATFORM_ADMIN_ROLE");
	console.log("  VoucherManager:", adminOnVoucher ? "YES" : "NO");
	console.log("  GasSwapPlatform:", adminOnPlatform ? "YES" : "NO");
	console.log("\nBRANCH_STAFF_ROLE");
	console.log("  VoucherManager:", staffOnVoucher ? "YES" : "NO");
	console.log("  GasSwapPlatform:", staffOnPlatform ? "YES" : "NO");
	console.log("  CompanyManager:", staffOnCompany ? "YES" : "NO");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error("❌ Failed:", error.message || error);
		process.exit(1);
	});
