const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const CONTRACTS = [
  ["CompanyManager", "companyManager"],
  ["CylinderRegistry", "cylinderRegistry"],
  ["VoucherManager", "voucherManager"],
  ["GasSwapPlatform", "gasSwapPlatform"],
];

const BLOCK_CHUNK_SIZE = 50_000;

async function getLogsInChunks(provider, address, fromBlock, toBlock) {
  const logs = [];

  for (let start = fromBlock; start <= toBlock; start += BLOCK_CHUNK_SIZE) {
    const end = Math.min(start + BLOCK_CHUNK_SIZE - 1, toBlock);
    const chunk = await provider.getLogs({
      address,
      fromBlock: start,
      toBlock: end,
    });
    logs.push(...chunk);
  }

  return logs;
}

async function main() {
  const addressesPath = path.join(
    __dirname,
    "../frontend/lib/contracts/deployed-addresses.json"
  );
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  const provider = hre.ethers.provider;
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = process.env.FROM_BLOCK ? Number(process.env.FROM_BLOCK) : 0;

  if (!Number.isInteger(fromBlock) || fromBlock < 0) {
    throw new Error("FROM_BLOCK must be a non-negative integer.");
  }

  console.log(`Network: ${hre.network.name} (chainId: ${hre.network.config.chainId})`);
  console.log(`Latest block: ${latestBlock}`);
  console.log(`Scanning logs from block: ${fromBlock}`);
  console.log("");

  for (const [contractName, addressKey] of CONTRACTS) {
    const address = addresses[addressKey];
    const contract = await hre.ethers.getContractAt(contractName, address);
    const code = await provider.getCode(address);
    const hasCode = code && code !== "0x";

    console.log(`${contractName}`);
    console.log(`  Address: ${address}`);
    console.log(`  Contract code: ${hasCode ? "YES" : "NO"}`);

    if (!hasCode) {
      console.log("");
      continue;
    }

    if (contractName === "CompanyManager") {
      const [companyCount, branchCount, cylinderTypeCount] = await Promise.all([
        contract.companyCount(),
        contract.branchCount(),
        contract.cylinderTypeCount(),
      ]);
      console.log(`  Live state: ${companyCount} companies, ${branchCount} branches, ${cylinderTypeCount} cylinder types`);
    }

    if (contractName === "CylinderRegistry") {
      const totalCylinders = await contract.getTotalCylinders();
      console.log(`  Live state: ${totalCylinders} cylinders`);
    }

    if (contractName === "VoucherManager") {
      const totalVouchers = await contract.getTotalVouchers();
      const activeSupply = await contract.totalSupply();
      console.log(`  Live state: ${totalVouchers} vouchers created, ${activeSupply} active voucher NFTs`);
    }

    if (contractName === "GasSwapPlatform") {
      const stats = await contract.getPlatformStats();
      console.log(
        `  Live state: ${stats[0]} companies, ${stats[1]} branches, ${stats[2]} cylinders, ${stats[3]} vouchers, ${stats[4]} completed platform swaps`
      );
    }

    const logs = await getLogsInChunks(provider, address, fromBlock, latestBlock);

    const txHashes = [...new Set(logs.map((log) => log.transactionHash))];
    const eventCounts = {};

    for (const log of logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        eventCounts[parsed.name] = (eventCounts[parsed.name] || 0) + 1;
      } catch {
        eventCounts.Unknown = (eventCounts.Unknown || 0) + 1;
      }
    }

    console.log(`  Event logs: ${logs.length}`);
    console.log(`  Unique tx hashes with logs: ${txHashes.length}`);

    if (Object.keys(eventCounts).length > 0) {
      console.log("  Events:");
      for (const [name, count] of Object.entries(eventCounts).sort()) {
        console.log(`    ${name}: ${count}`);
      }
    }

    if (txHashes.length > 0) {
      console.log("  Recent tx hashes:");
      for (const hash of txHashes.slice(-5).reverse()) {
        console.log(`    ${hash}`);
      }
    }

    console.log("");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed:", error.message || error);
    process.exit(1);
  });
