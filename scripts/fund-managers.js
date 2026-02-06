const { ethers } = require("hardhat");

async function main() {
  // Get the first Hardhat account (has plenty of test ETH)
  const [funder] = await ethers.getSigners();
  
  console.log("=".repeat(60));
  console.log("FUND MANAGER WALLETS");
  console.log("=".repeat(60));
  console.log("\nFunding from:", funder.address);
  
  const funderBalance = await ethers.provider.getBalance(funder.address);
  console.log("Funder balance:", ethers.formatEther(funderBalance), "ETH\n");

  // Add your manager wallet addresses here
  const managerWallets = process.argv.slice(2);
  
  if (managerWallets.length === 0) {
    console.log("No wallet addresses provided!");
    console.log("\nUsage:");
    console.log("  npx hardhat run scripts/fund-managers.js --network localhost <address1> <address2> ...");
    console.log("\nExample:");
    console.log("  npx hardhat run scripts/fund-managers.js --network localhost 0xAbc... 0xDef...");
    console.log("\n" + "=".repeat(60));
    
    // Show all available Hardhat test accounts
    console.log("\nAVAILABLE TEST ACCOUNTS (pre-funded with 10000 ETH each):");
    console.log("-".repeat(60));
    const signers = await ethers.getSigners();
    for (let i = 0; i < Math.min(5, signers.length); i++) {
      const balance = await ethers.provider.getBalance(signers[i].address);
      console.log(`Account ${i}: ${signers[i].address}`);
      console.log(`  Balance: ${ethers.formatEther(balance)} ETH\n`);
    }
    return;
  }

  // Fund each wallet
  const amount = ethers.parseEther("100"); // 100 ETH each
  
  for (const wallet of managerWallets) {
    if (!ethers.isAddress(wallet)) {
      console.log(`❌ Invalid address: ${wallet}`);
      continue;
    }

    console.log(`\nFunding: ${wallet}`);
    
    const before = await ethers.provider.getBalance(wallet);
    console.log(`  Before: ${ethers.formatEther(before)} ETH`);
    
    const tx = await funder.sendTransaction({
      to: wallet,
      value: amount,
    });
    await tx.wait();
    
    const after = await ethers.provider.getBalance(wallet);
    console.log(`  After:  ${ethers.formatEther(after)} ETH`);
    console.log(`  ✅ Funded with 100 ETH`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ All wallets funded successfully!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
