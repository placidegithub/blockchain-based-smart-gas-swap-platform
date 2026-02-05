# 🔗 Blockchain Gas Cylinder Swap Platform

A fully decentralized blockchain-based platform for gas cylinder exchange across districts in Rwanda.

## 📋 Overview

This platform enables customers to:
1. **Deposit** their gas cylinder at any branch
2. **Receive** a digital voucher (NFT) on the blockchain
3. **Travel** without carrying the cylinder
4. **Redeem** the voucher at any branch of the same company

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SMART CONTRACTS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ GasSwapPlatform │──│ CompanyManager  │                   │
│  │   (Main Entry)  │  │  (Companies &   │                   │
│  └────────┬────────┘  │   Branches)     │                   │
│           │           └─────────────────┘                   │
│           │                                                 │
│  ┌────────┴────────┐  ┌─────────────────┐                   │
│  │ VoucherManager  │  │ CylinderRegistry│                   │
│  │  (NFT Vouchers) │  │  (NFT Cylinders)│                   │
│  └─────────────────┘  └─────────────────┘                   │
│                                                             │
│  Network: Polygon (Low-cost, Fast transactions)             │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Smart Contracts

| Contract | Description |
|----------|-------------|
| `GasSwapPlatform.sol` | Main orchestrating contract |
| `CompanyManager.sol` | Manages companies, branches, cylinder types |
| `CylinderRegistry.sol` | NFT registry for physical cylinders |
| `VoucherManager.sol` | NFT vouchers for cylinder exchange |
| `GasSwapAccessControl.sol` | Role-based access control |

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- npm or yarn
- MetaMask wallet (browser extension)

### Installation

```bash
# Navigate to blockchain platform directory
cd blockchain-gas-swap-platform

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your configuration
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test

# With gas reporting
npm run test:gas
```

### Local Deployment (Development)

**Terminal 1: Start local blockchain**
```bash
npm run node
```

**Terminal 2: Deploy contracts**
```bash
npm run deploy:local

# Setup sample data (companies, branches, cylinders)
npm run setup:local
```

### Start Frontend

**Terminal 3: Run the frontend**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### Connect MetaMask to Local Network

1. Open MetaMask
2. Click network dropdown → "Add Network"
3. Add new network:
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
4. Import a test account using private key from Hardhat output

## 🌐 Polygon Mumbai Testnet Deployment

1. Get test MATIC from [Polygon Faucet](https://faucet.polygon.technology/)
2. Configure `.env`:
   ```
   POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
   PRIVATE_KEY=your_private_key
   ```
3. Deploy:
   ```bash
   npm run deploy:mumbai
   ```
4. Update frontend contract addresses in `frontend/.env.local`

## 🎯 Features

### ✅ Implemented

- [x] Multi-company support (Kigaligas, Hash Gas, Meru Gas, Jibu Gas, etc.)
- [x] Multiple cylinder sizes (6kg, 12kg, 15kg)
- [x] Branch management across districts
- [x] NFT-based cylinder tracking
- [x] NFT voucher creation and redemption
- [x] 30-day voucher validity
- [x] Role-based access control
- [x] Company balance tracking
- [x] Emergency pause functionality

### ✅ Frontend (Next.js dApp)

- [x] Landing page with platform stats
- [x] MetaMask wallet connection
- [x] Customer dashboard with voucher list
- [x] Staff interface for deposits/redemptions
- [x] Admin panel for company/branch management
- [x] QR code generation for vouchers
- [x] QR code scanner for redemption
- [x] Role-based access guards

## 📊 Gas Costs (Estimated on Polygon)

| Operation | Gas Units | Cost (MATIC) | Cost (USD) |
|-----------|-----------|--------------|------------|
| Register Cylinder | ~150,000 | 0.015 | ~$0.02 |
| Create Voucher | ~200,000 | 0.020 | ~$0.03 |
| Redeem Voucher | ~180,000 | 0.018 | ~$0.02 |

## 🔐 Security

- OpenZeppelin contracts for battle-tested security
- Role-based access control
- Reentrancy protection
- Pausable for emergencies
- No external calls to untrusted contracts

## 📁 Project Structure

```
blockchain-gas-swap-platform/
├── contracts/                  # Solidity smart contracts
│   ├── GasSwapPlatform.sol
│   ├── CompanyManager.sol
│   ├── CylinderRegistry.sol
│   ├── VoucherManager.sol
│   └── GasSwapAccessControl.sol
├── scripts/                    # Deployment scripts
│   ├── deploy.js
│   └── setup-sample-data.js
├── test/                       # Contract tests
│   └── VoucherManager.test.js
├── frontend/                   # Next.js dApp
│   ├── app/                    # Next.js App Router pages
│   │   ├── (app)/              # Protected routes
│   │   │   ├── dashboard/      # Customer dashboard
│   │   │   ├── staff/          # Staff operations
│   │   │   └── admin/          # Admin panel
│   │   └── (public)/           # Public routes
│   │       └── verify/         # Voucher verification
│   ├── components/             # React components
│   │   ├── admin/              # Admin components
│   │   ├── layout/             # Layout components
│   │   ├── providers/          # Context providers
│   │   ├── staff/              # Staff components
│   │   ├── ui/                 # UI primitives
│   │   ├── vouchers/           # Voucher components
│   │   └── wallet/             # Wallet components
│   └── lib/                    # Utilities and hooks
│       ├── contracts/          # Contract ABIs and addresses
│       └── hooks/              # React hooks for contracts
├── hardhat.config.js
├── package.json
└── README.md
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run specific test file
npx hardhat test test/VoucherManager.test.js

# Run with verbose output
npx hardhat test --verbose

# Run with gas reporting
npm run test:gas
```

## 🔧 Development Workflow

1. **Smart Contract Changes**
   - Edit contracts in `contracts/`
   - Run `npm run compile`
   - Run `npm run test`
   - Deploy with `npm run deploy:local`

2. **Frontend Changes**
   - Edit components in `frontend/`
   - Run `npm run dev` in frontend directory
   - Build with `npm run build`

3. **Update Contract ABIs**
   - After compiling, copy ABIs from `artifacts/contracts/`
   - Paste to `frontend/lib/contracts/abis/`

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

## 👥 Contributors

- Capstone Project Team

## 📞 Support

For questions or issues, please open a GitHub issue.

---

**Built with ❤️ for Rwanda's gas distribution sector**
