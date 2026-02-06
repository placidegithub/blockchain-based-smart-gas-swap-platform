const { ethers } = require("hardhat");

async function main() {
  // Set the wallet address to fund here
  const walletAddress = process.env.FUND_ADDRESS || "0x802a2638B0d438501d755cbbc48f651FfcEe073C";
  
  if (!walletAddress) {
    console.log("Set FUND_ADDRESS environment variable or edit this script");
    process.exit(1);
  }

  // Validate address format
  if (!ethers.isAddress(walletAddress)) {
    console.error("Invalid wallet address:", walletAddress);
    process.exit(1);
  }

  // Get the first Hardhat account (has plenty of test ETH)
  const [funder] = await ethers.getSigners();
  
  console.log("Funding wallet:", walletAddress);
  console.log("From account:", funder.address);
  
  // Check current balance
  const currentBalance = await ethers.provider.getBalance(walletAddress);
  console.log("Current balance:", ethers.formatEther(currentBalance), "ETH");
  
  // Send 10 ETH (plenty for testing)
  const amount = ethers.parseEther("10");
  
  const tx = await funder.sendTransaction({
    to: walletAddress,
    value: amount,
  });
  
  console.log("Transaction hash:", tx.hash);
  await tx.wait();
  
  // Check new balance
  const newBalance = await ethers.provider.getBalance(walletAddress);
  console.log("New balance:", ethers.formatEther(newBalance), "ETH");
  console.log("✅ Wallet funded successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
