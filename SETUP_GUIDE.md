# 🚀 Complete Setup Guide for Blockchain Gas Swap Platform

This guide will help you get the entire blockchain platform running locally.

## Prerequisites

1. **Node.js v18+** installed
2. **MetaMask** browser extension installed
3. **Git** (optional)

---

## Step 1: Start the Hardhat Local Blockchain

Open a **new terminal** and run:

```bash
cd "c:\xampp\htdocs\Smart gas cylinder and water bottle exchange system\blockchain-gas-swap-platform"
npm run node
```

**Keep this terminal open!** You should see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

---

## Step 2: Deploy Smart Contracts

Open a **second terminal** and run:

```bash
cd "c:\xampp\htdocs\Smart gas cylinder and water bottle exchange system\blockchain-gas-swap-platform"
npm run deploy:local
```

You should see:
```
🚀 Deploying Gas Cylinder Swap Platform...
✅ CompanyManager deployed to: 0x...
✅ CylinderRegistry deployed to: 0x...
✅ VoucherManager deployed to: 0x...
✅ GasSwapPlatform deployed to: 0x...
🎉 DEPLOYMENT COMPLETE!
```

---

## Step 3: Setup Sample Data

In the same terminal, run:

```bash
npm run setup:local
```

This registers:
- 6 Gas companies (Kigaligas, Hash Gas, Meru Gas, etc.)
- 3 Cylinder types per company (6kg, 12kg, 15kg)
- Multiple branches across Rwanda districts
- Sample cylinders at each branch

---

## Step 4: Configure MetaMask

### 4.1 Add Hardhat Network

1. Open MetaMask
2. Click the network dropdown (top-left)
3. Click **"Add network"** → **"Add network manually"**
4. Enter these details:
   - **Network Name:** `Hardhat Local`
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
5. Click **Save**

### 4.2 Import Admin Account

To access **Staff** and **Admin** dashboards, you need to import the deployer account:

1. In MetaMask, click the account icon (top-right)
2. Click **"Add account or hardware wallet"**
3. Click **"Import account"**
4. Paste this private key:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
5. Click **Import**

This account has:
- ✅ 10,000 test ETH
- ✅ PLATFORM_ADMIN_ROLE (access to Admin dashboard)
- ✅ BRANCH_STAFF_ROLE (access to Staff dashboard)

---

## Step 5: Start the Frontend

Open a **third terminal** and run:

```bash
cd "c:\xampp\htdocs\Smart gas cylinder and water bottle exchange system\blockchain-gas-swap-platform\frontend"
npm run dev
```

The app will start at: **http://localhost:3000**

---

## Step 6: Connect and Use the Platform

1. Open http://localhost:3000 in your browser
2. Click **"Connect Wallet"**
3. Click **"MetaMask"**
4. Approve the connection in MetaMask popup
5. If on wrong network, click **"Switch to Localhost"**

### Available Dashboards

| Dashboard | URL | Who Can Access |
|-----------|-----|----------------|
| Customer Dashboard | `/dashboard` | Anyone connected |
| Staff Dashboard | `/staff` | Accounts with BRANCH_STAFF_ROLE |
| Admin Panel | `/admin` | Accounts with PLATFORM_ADMIN_ROLE |

---

## Troubleshooting

### "Failed to connect to MetaMask"
- Make sure Hardhat node is running (`npm run node`)
- Clear MetaMask activity: Settings → Advanced → Clear activity tab data
- Re-add the Hardhat network in MetaMask

### "Verifying permissions..." forever
- Make sure you imported the correct private key (Account #0)
- Make sure you're on the "Hardhat Local" network in MetaMask
- Refresh the page

### "Not Authorized" on Staff/Admin pages
- You're using an account without the required role
- Import the admin private key from Step 4.2
- Or have an admin grant you the role

### Contracts not responding
- Restart the Hardhat node (`npm run node`)
- Re-deploy contracts (`npm run deploy:local`)
- Reset MetaMask: Settings → Advanced → Clear activity tab data

### MetaMask stuck loading
- Click the MetaMask extension icon - there may be a pending request
- Or reset MetaMask and try again

---

## User Roles Explained

| Role | Permissions |
|------|-------------|
| **Customer** | View dashboard, see their vouchers |
| **Branch Staff** | Create vouchers (deposit), redeem vouchers, scan QR codes |
| **Platform Admin** | Manage companies, branches, cylinders, assign staff roles |

---

## How the Swap Process Works

1. **Customer visits a branch** with their cylinder
2. **Staff deposits the cylinder** → Creates a blockchain voucher
3. **Customer receives a QR code** for their voucher
4. **Customer travels** to another location
5. **At destination branch**, staff scans QR code
6. **Staff redeems voucher** → Customer gets a new cylinder
7. **Voucher is burned** (marked as used) on blockchain

---

## Quick Reference Commands

```bash
# Start local blockchain
npm run node

# Deploy contracts
npm run deploy:local

# Setup sample data
npm run setup:local

# Start frontend
cd frontend && npm run dev

# Run contract tests
npm run test

# Compile contracts
npm run compile
```

---

## Next Steps

- Try creating a voucher from the Staff dashboard
- Verify a voucher using the QR code
- Check company analytics in the Admin panel
- Add new branches or cylinder types

For more information, see the main [README.md](README.md).
