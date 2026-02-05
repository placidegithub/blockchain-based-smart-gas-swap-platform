# Full Blockchain Conversion Proposal
## Smart Gas Cylinder and Water Bottle Exchange System

**Prepared for:** Project Supervisor  
**Date:** January 24, 2026  
**Status:** Technical Proposal for Full Blockchain Migration

---

## 📋 Executive Summary

This document outlines the comprehensive conversion of the current PHP-based Gas Cylinder Swap Platform into a **fully decentralized blockchain application (dApp)**. The proposal is based on extensive research into existing blockchain gas/LPG distribution systems and modern Web3 development best practices.

---

## 🔍 Research Findings: Existing Blockchain Gas Systems

### 1. Academic Research & Industry Implementations

| Project/Research | Technology | Key Features |
|------------------|------------|--------------|
| **Blockchain for Secure-GaS** (IEEE) | Ethereum + AI + IoT | Secure natural gas transactions, AI-powered prediction, smart contract matching |
| **LPG Distribution Blockchain (Medan, Indonesia)** | Multichain Platform | Subsidised LPG distribution tracking, transparency, fraud prevention |
| **SOCAR Natural Gas Blockchain** (Azerbaijan) | Private Blockchain | Pipeline monitoring, asset lifecycle management, compliance auditing |
| **CATalytics Industrial System** | Hybrid (IoT + Database) | Cylinder asset tracking, turnaround ratio analytics, barcode/QR scanning |
| **IBM Food Trust Model** | Hyperledger Fabric | Supply chain traceability (adaptable to gas distribution) |

### 2. Key Patterns from Existing Systems

Based on research, successful blockchain gas/cylinder systems share these patterns:

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCKCHAIN GAS SYSTEMS                       │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Immutable transaction records for audit trail                │
│ ✓ Smart contracts for automated business logic                 │
│ ✓ IoT integration for real-time cylinder tracking              │
│ ✓ Decentralized identity for customers/businesses              │
│ ✓ Token-based voucher systems                                  │
│ ✓ Cross-company settlement mechanisms                          │
│ ✓ QR/Barcode integration with blockchain verification          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Proposed Full Blockchain Architecture

### Technology Stack (Replacing PHP)

| Layer | Current (PHP) | New Blockchain Stack |
|-------|---------------|----------------------|
| **Frontend** | HTML/CSS/JS + Bootstrap | React.js / Next.js + Ethers.js |
| **Backend** | PHP 8.0 + PDO | Node.js + Express + Web3.js |
| **Database** | MySQL | IPFS (decentralized) + The Graph (indexing) |
| **Smart Contracts** | Mock Service | Solidity on Ethereum/Polygon |
| **Development** | XAMPP | Hardhat + Ganache |
| **Authentication** | Session-based | MetaMask / Web3 Wallet |
| **Notifications** | PHPMailer/Twilio | Push Protocol (decentralized) |
| **File Storage** | Local Server | IPFS / Filecoin |

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                                   │
├────────────────────┬────────────────────┬────────────────────────────────┤
│   Customer dApp    │    Staff dApp      │      Admin Dashboard           │
│   (React/Next.js)  │   (React/Next.js)  │      (React/Next.js)           │
│   + MetaMask       │   + MetaMask       │      + Multi-sig Wallet        │
└─────────┬──────────┴─────────┬──────────┴──────────────┬─────────────────┘
          │                    │                          │
          └────────────────────┼──────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Web3 Provider    │
                    │    (Ethers.js)      │
                    └──────────┬──────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────────┐
│                    BLOCKCHAIN LAYER                                      │
├──────────────────────────────┼──────────────────────────────────────────┤
│                              │                                           │
│  ┌───────────────────────────▼───────────────────────────────────────┐  │
│  │                   SMART CONTRACTS (Solidity)                       │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │  │
│  │  │ CylinderRegistry │  │  VoucherManager  │  │ CompanyManager  │  │  │
│  │  │                  │  │                  │  │                 │  │  │
│  │  │ • registerCyl()  │  │ • createVoucher()│  │ • addCompany()  │  │  │
│  │  │ • transferCyl()  │  │ • redeemVoucher()│  │ • addBranch()   │  │  │
│  │  │ • getCylHistory()│  │ • cancelVoucher()│  │ • getBalance()  │  │  │
│  │  └──────────────────┘  └──────────────────┘  └─────────────────┘  │  │
│  │                                                                    │  │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │  │
│  │  │   UserRegistry   │  │ PaymentProcessor │  │  AccessControl  │  │  │
│  │  │                  │  │                  │  │                 │  │  │
│  │  │ • register()     │  │ • processPayment()│ │ • grantRole()   │  │  │
│  │  │ • getProfile()   │  │ • refund()       │  │ • revokeRole()  │  │  │
│  │  │ • updatePhone()  │  │ • getHistory()   │  │ • hasRole()     │  │  │
│  │  └──────────────────┘  └──────────────────┘  └─────────────────┘  │  │
│  │                                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Network Options: Ethereum Mainnet | Polygon | Arbitrum | Private Chain │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   DECENTRALIZED     │
                    │     STORAGE         │
                    ├─────────────────────┤
                    │ • IPFS (QR images)  │
                    │ • The Graph (index) │
                    │ • Ceramic (profiles)│
                    └─────────────────────┘
```

---

## 🔄 How the Full Blockchain System Works

### Customer Journey (Fully Decentralized)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CUSTOMER DEPOSIT FLOW (Blockchain)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────┐    ┌────────────┐  │
│  │ Customer│───►│ Connect     │───►│ Select       │───►│ Staff Scans│  │
│  │ Arrives │    │ MetaMask    │    │ Company/Size │    │ Cylinder   │  │
│  └─────────┘    └─────────────┘    └──────────────┘    └─────┬──────┘  │
│                                                               │         │
│                                                               ▼         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    SMART CONTRACT EXECUTION                       │  │
│  │                                                                   │  │
│  │  1. VoucherManager.createVoucher() is called                      │  │
│  │  2. Cylinder NFT transferred to escrow                            │  │
│  │  3. Voucher NFT minted to customer wallet                         │  │
│  │  4. Event emitted: VoucherCreated(id, customer, cylinder)         │  │
│  │  5. QR code generated from voucher token ID                       │  │
│  │  6. Transaction recorded immutably on blockchain                  │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                               │         │
│                                                               ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────────────┐    │
│  │ Voucher NFT │───►│ QR Code     │───►│ Push Notification sent   │    │
│  │ in Wallet   │    │ Generated   │    │ via Push Protocol        │    │
│  └─────────────┘    └─────────────┘    └──────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    CUSTOMER REDEMPTION FLOW (Blockchain)                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────────────────────┐    │
│  │ Customer    │───►│ Show QR/    │───►│ Staff Scans & Verifies   │    │
│  │ at Branch   │    │ Voucher NFT │    │ on Blockchain            │    │
│  └─────────────┘    └─────────────┘    └─────────────┬────────────┘    │
│                                                       │                 │
│                                                       ▼                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    SMART CONTRACT VERIFICATION                    │  │
│  │                                                                   │  │
│  │  1. VoucherManager.verifyVoucher(voucherId) called               │  │
│  │  2. Check: Voucher exists? Not expired? Not used?                │  │
│  │  3. Check: Same company? Same cylinder type?                     │  │
│  │  4. Check: Branch has available cylinders?                       │  │
│  │  5. All checks pass → Proceed to redemption                      │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                       │                 │
│                                                       ▼                 │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    REDEMPTION EXECUTION                           │  │
│  │                                                                   │  │
│  │  1. VoucherManager.redeemVoucher() called                        │  │
│  │  2. Voucher NFT burned (marked as used)                          │  │
│  │  3. New Cylinder NFT transferred to customer receipt             │  │
│  │  4. Company balances automatically updated                       │  │
│  │  5. Event emitted: VoucherRedeemed(id, customer, newCylinder)    │  │
│  │  6. Settlement between branches calculated automatically         │  │
│  │                                                                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                       │                 │
│                                                       ▼                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Customer receives physical cylinder + blockchain confirmation   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Smart Contract Architecture (Detailed)

### 1. CylinderRegistry.sol (NFT-based Cylinder Tracking)

```solidity
// Each physical cylinder is represented as an NFT (ERC-721)
contract CylinderRegistry is ERC721, Ownable {
    struct CylinderData {
        uint256 companyId;
        uint256 typeId;        // 6kg, 12kg, 15kg
        string serialNumber;
        uint256 branchId;      // Current location
        CylinderStatus status; // IN_BRANCH, IN_TRANSIT, WITH_CUSTOMER
        uint256 lastInspection;
        uint256 manufacturingDate;
    }
    
    enum CylinderStatus { IN_BRANCH, IN_TRANSIT, WITH_CUSTOMER, MAINTENANCE }
    
    mapping(uint256 => CylinderData) public cylinderData;
    
    function registerCylinder(
        uint256 tokenId,
        uint256 companyId,
        uint256 typeId,
        string memory serialNumber,
        uint256 branchId
    ) external onlyAuthorized { ... }
    
    function transferCylinder(
        uint256 tokenId,
        uint256 newBranchId
    ) external onlyAuthorized { ... }
    
    function getCylinderHistory(uint256 tokenId) 
        external view returns (TransferRecord[] memory) { ... }
}
```

### 2. VoucherManager.sol (Core Swap Logic)

```solidity
contract VoucherManager is ERC721, ReentrancyGuard {
    struct Voucher {
        uint256 cylinderTokenId;  // Deposited cylinder
        uint256 companyId;
        uint256 cylinderTypeId;
        uint256 sourceBranchId;
        address customer;
        uint256 createdAt;
        uint256 expiresAt;
        VoucherStatus status;
    }
    
    enum VoucherStatus { ACTIVE, REDEEMED, EXPIRED, CANCELLED }
    
    uint256 public constant VOUCHER_VALIDITY_DAYS = 30;
    
    mapping(uint256 => Voucher) public vouchers;
    
    event VoucherCreated(
        uint256 indexed voucherId,
        address indexed customer,
        uint256 cylinderTokenId,
        uint256 companyId
    );
    
    event VoucherRedeemed(
        uint256 indexed voucherId,
        address indexed customer,
        uint256 newCylinderTokenId,
        uint256 branchId
    );
    
    function createVoucher(
        uint256 cylinderTokenId,
        uint256 sourceBranchId
    ) external nonReentrant returns (uint256 voucherId) {
        // 1. Verify cylinder ownership
        // 2. Transfer cylinder to escrow
        // 3. Mint voucher NFT to customer
        // 4. Emit event for indexing
    }
    
    function redeemVoucher(
        uint256 voucherId,
        uint256 destinationBranchId,
        uint256 newCylinderTokenId
    ) external nonReentrant {
        // 1. Verify voucher validity
        // 2. Verify branch has matching cylinder
        // 3. Burn voucher NFT
        // 4. Transfer new cylinder to customer
        // 5. Update company balances
        // 6. Emit redemption event
    }
}
```

### 3. CompanyManager.sol (Multi-Company Support)

```solidity
contract CompanyManager is AccessControl {
    struct Company {
        string name;
        string code;           // KIGALIGAS, HASH, etc.
        bool isActive;
        address adminWallet;
    }
    
    struct Branch {
        uint256 companyId;
        string name;
        string district;
        string location;
        bool isActive;
    }
    
    mapping(uint256 => Company) public companies;
    mapping(uint256 => Branch) public branches;
    mapping(uint256 => mapping(uint256 => uint256)) public branchInventory;
    // branchId => cylinderTypeId => count
    
    function addCompany(
        uint256 companyId,
        string memory name,
        string memory code,
        address adminWallet
    ) external onlyRole(ADMIN_ROLE) { ... }
    
    function addBranch(
        uint256 branchId,
        uint256 companyId,
        string memory name,
        string memory district
    ) external onlyRole(COMPANY_ADMIN_ROLE) { ... }
    
    function getCompanyBalance(uint256 companyId) 
        external view returns (int256 netBalance) { ... }
}
```

---

## 🌐 Frontend dApp Structure

### React/Next.js Component Architecture

```
vending-machine-dapp/
├── pages/
│   ├── index.js                 # Landing page
│   ├── _app.js                  # Web3 provider wrapper
│   ├── dashboard/
│   │   ├── index.js             # Main dashboard
│   │   ├── vouchers.js          # Voucher management
│   │   └── analytics.js         # Blockchain analytics
│   ├── swap/
│   │   ├── deposit.js           # Create voucher
│   │   └── redeem.js            # Redeem voucher
│   └── admin/
│       ├── companies.js         # Company management
│       ├── branches.js          # Branch management
│       └── cylinders.js         # Cylinder registry
├── components/
│   ├── ConnectWallet.js         # MetaMask connection
│   ├── VoucherCard.js           # Voucher display
│   ├── QRScanner.js             # QR code scanner
│   ├── CylinderSelector.js      # Cylinder type picker
│   └── TransactionStatus.js     # TX confirmation UI
├── hooks/
│   ├── useWeb3.js               # Web3 connection hook
│   ├── useContracts.js          # Contract instances
│   ├── useVouchers.js           # Voucher operations
│   └── useCylinders.js          # Cylinder operations
├── lib/
│   ├── contracts/
│   │   ├── CylinderRegistry.json
│   │   ├── VoucherManager.json
│   │   └── CompanyManager.json
│   ├── ipfs.js                  # IPFS integration
│   └── graph.js                 # The Graph queries
└── styles/
    └── globals.css
```

### Example: Connect Wallet Component

```javascript
// components/ConnectWallet.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function ConnectWallet({ onConnect }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();
        
        setAccount(address);
        setChainId(network.chainId);
        onConnect({ provider, signer, address });
      } catch (error) {
        console.error("Connection failed:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  return (
    <button onClick={connectWallet} className="connect-btn">
      {account 
        ? `${account.slice(0, 6)}...${account.slice(-4)}` 
        : "Connect Wallet"}
    </button>
  );
}
```

---

## 🔐 Security & Trust Model

### Blockchain Security Features

| Feature | PHP (Current) | Blockchain (Proposed) |
|---------|---------------|----------------------|
| **Data Integrity** | Database backups | Immutable ledger |
| **Audit Trail** | Log files | On-chain events |
| **Authorization** | Session/Roles | Smart contract roles |
| **Voucher Validity** | DB check | Cryptographic proof |
| **Cross-Branch Trust** | Manual reconciliation | Automatic settlement |
| **Fraud Prevention** | Database constraints | Consensus mechanism |

### Access Control Roles

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROLE-BASED ACCESS CONTROL                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PLATFORM_ADMIN (Multi-sig Wallet)                             │
│  ├── Register new companies                                     │
│  ├── Upgrade smart contracts (proxy pattern)                   │
│  └── Emergency pause functionality                              │
│                                                                 │
│  COMPANY_ADMIN (Per Company)                                    │
│  ├── Add/remove branches                                        │
│  ├── Register staff wallets                                     │
│  └── View company analytics                                     │
│                                                                 │
│  BRANCH_STAFF (Per Branch)                                      │
│  ├── Create vouchers                                            │
│  ├── Redeem vouchers                                            │
│  └── Register cylinders                                         │
│                                                                 │
│  CUSTOMER (Public)                                              │
│  ├── Connect wallet                                             │
│  ├── View voucher status                                        │
│  └── Transfer voucher (optional)                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💰 Cost Analysis

### Blockchain Transaction Costs (Polygon Network)

| Operation | Gas Units | Cost (MATIC) | Cost (USD) |
|-----------|-----------|--------------|------------|
| Register Cylinder | ~80,000 | 0.008 | $0.01 |
| Create Voucher | ~150,000 | 0.015 | $0.02 |
| Redeem Voucher | ~120,000 | 0.012 | $0.015 |
| Register Company | ~100,000 | 0.010 | $0.012 |

**Note:** Using Polygon (Layer 2) instead of Ethereum mainnet reduces costs by 99%.

### Infrastructure Costs

| Service | Monthly Cost |
|---------|--------------|
| QuickNode RPC (Polygon) | $49-299 |
| IPFS Pinning (Pinata) | $0-20 |
| The Graph Hosting | $0-100 |
| Domain + SSL | $10-20 |
| **Total** | **$59-439/month** |

---

## 🚀 Migration Roadmap

### Phase 1: Smart Contract Development (4-6 weeks)
- [ ] Develop CylinderRegistry contract
- [ ] Develop VoucherManager contract
- [ ] Develop CompanyManager contract
- [ ] Write comprehensive tests (Hardhat)
- [ ] Deploy to testnet (Polygon Mumbai)
- [ ] Security audit

### Phase 2: Frontend dApp Development (6-8 weeks)
- [ ] Set up Next.js project
- [ ] Implement wallet connection
- [ ] Build staff dashboard
- [ ] Build customer interface
- [ ] Implement QR scanning
- [ ] Connect to smart contracts

### Phase 3: Data Migration (2-3 weeks)
- [ ] Export existing MySQL data
- [ ] Register all cylinders on blockchain
- [ ] Register all companies/branches
- [ ] Migrate active vouchers

### Phase 4: Testing & Launch (3-4 weeks)
- [ ] End-to-end testing
- [ ] User acceptance testing
- [ ] Deploy to mainnet
- [ ] Staff training
- [ ] Go-live support

**Total Timeline: 15-21 weeks**

---

## ✅ Benefits of Full Blockchain Conversion

### For the Business
1. **Immutable Audit Trail** - Every transaction permanently recorded
2. **Cross-Company Trust** - No need for manual reconciliation
3. **Reduced Fraud** - Cryptographic verification of vouchers
4. **Automated Settlement** - Smart contracts handle balance calculations
5. **Scalability** - No single point of failure

### For Customers
1. **Transparency** - View voucher status anytime
2. **Portability** - Voucher in wallet, not dependent on platform
3. **Speed** - Instant verification at any branch
4. **Security** - Cannot be forged or duplicated

### For Regulators
1. **Real-time Monitoring** - View all transactions on-chain
2. **Compliance** - Automatic enforcement of rules
3. **Reporting** - Query historical data via The Graph

---

## 📚 References & Resources

### Research Papers
1. Xiao, W. et al. (2021). "Blockchain for Secure-GaS: Blockchain-Powered Secure Natural Gas IoT System" - IEEE
2. SOCAR Blockchain Case Study (2022) - MDPI Energies
3. "Blockchain Implementation on Subsidised LPG Distribution" (2025) - Indonesia

### Technology Documentation
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [The Graph Protocol](https://thegraph.com/docs)
- [Polygon Documentation](https://docs.polygon.technology)

### Similar Projects
- CATalytics Industrial Cylinder Tracking System
- IBM Food Trust (supply chain model)
- Shell Energy Blockchain Pilots

---

## 🤝 Conclusion

Converting this project to a full blockchain system is **feasible and beneficial**. The existing Solidity contract ([CylinderSwapContract.sol](file:///c:/xampp/htdocs/Smart%20gas%20cylinder%20and%20water%20bottle%20exchange%20system/CylinderSwapContract.sol)) provides a solid foundation that can be expanded into a complete dApp ecosystem.

**Recommendation:** Proceed with blockchain conversion using:
- **Blockchain:** Polygon (for low costs)
- **Smart Contracts:** Solidity + Hardhat
- **Frontend:** React/Next.js + Ethers.js
- **Storage:** IPFS for QR codes, The Graph for indexing

The system will provide Rwanda's gas industry with a modern, transparent, and secure platform for cross-district cylinder exchange.

---

**Document prepared by:** Development Team  
**Version:** 1.0  
**Last Updated:** January 24, 2026
