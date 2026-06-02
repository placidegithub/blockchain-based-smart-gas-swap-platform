# Blockchain-Based Smart Gas Swap Platform

A decentralized gas cylinder exchange platform for Rwanda. Customers deposit a cylinder at one branch, receive a blockchain voucher, and redeem that voucher at another branch of the same gas company.

## Current Network

The current deployed test network is Ethereum Sepolia.

| Contract | Sepolia Address |
| --- | --- |
| CompanyManager | `0x1407272FA1A1559a27e85AF3d9Ab98614F3F34a1` |
| CylinderRegistry | `0xee5ec8E8c7d349438A64E7f8c4751Af50F27ED67` |
| VoucherManager | `0xD12F9740F19Cb95b1a08FBD49F64CC0677853d65` |
| GasSwapPlatform | `0x9C24779f33B450a8e562abbCb10cd5E3D0F2728E` |

Useful explorer links:

- https://sepolia.etherscan.io/address/0x1407272FA1A1559a27e85AF3d9Ab98614F3F34a1
- https://sepolia.etherscan.io/address/0xee5ec8E8c7d349438A64E7f8c4751Af50F27ED67
- https://sepolia.etherscan.io/address/0xD12F9740F19Cb95b1a08FBD49F64CC0677853d65
- https://sepolia.etherscan.io/address/0x9C24779f33B450a8e562abbCb10cd5E3D0F2728E

## Core Workflow

1. A staff member creates a voucher when a customer deposits a cylinder.
2. The voucher is stored on-chain through the smart contracts.
3. The customer receives a QR code by email and an SMS notification by phone.
4. Another branch scans or enters the voucher ID.
5. The destination branch redeems the voucher and gives the customer a replacement cylinder.
6. Admins and staff can review transactions, revenue, inventory, notification status, and Etherscan proof links.

## Implemented Features

- Multi-company gas provider support.
- Branch management across districts.
- Branch manager wallet assignment.
- Cylinder registration and branch inventory visibility.
- Optional cylinder serial entry for deposit and redemption workflows.
- NFT-style voucher creation and redemption.
- Public voucher verification page at `/verify`.
- Transaction explorer page at `/transactions`.
- Admin analytics dashboard with voucher revenue, activity, and platform coverage.
- Etherscan links after blockchain transactions.
- Staff branch inventory dashboard.
- Notification status tracking for email and phone SMS.
- CSV export for staff/admin transaction reports.
- Role-based dashboard routing for admin, staff, and customers.

## Project Structure

```text
contracts/                    Smart contracts
scripts/                      Deploy, setup, and maintenance scripts
test/                         Hardhat tests
frontend/
  app/                        Next.js routes and API routes
  components/                 UI, admin, staff, voucher, and wallet components
  lib/                        Contract hooks, utilities, notifications, storage
frontend/public/              Deployed contract address JSON
hardhat.config.js             Network and deployment configuration
```

## Prerequisites

- Node.js 18+
- npm
- MetaMask
- Sepolia test ETH for admin/staff wallets
- SMTP credentials for email notifications
- httpSMS account and Android app for phone SMS notifications

## Environment Setup

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

For the frontend API routes, create `frontend/.env.local` with notification credentials:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_email_app_password
SMTP_FROM=noreply@gasswap.rw

HTTPSMS_API_KEY=your_httpsms_api_key
HTTPSMS_FROM=+2507XXXXXXXX
```

For httpSMS, install the httpSMS Android app, sign in with your API key, and make sure the sender phone number in `HTTPSMS_FROM` is the same connected device number.

## Install

Install root dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Compile Contracts

```bash
npm run compile
```

## Run Tests

```bash
npm run test
```

## Deploy to Sepolia

Make sure `.env` contains `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, and optionally `ETHERSCAN_API_KEY`.

```bash
npm run deploy:sepolia
```

After deployment, confirm the generated addresses are copied into:

- `frontend/public/deployed-addresses.json`
- `frontend/lib/contracts/deployed-addresses.json`

## Start Frontend

```bash
cd frontend
npm run dev
```

Open:

```text
http://localhost:3000
```

## Useful Commands

Check recent on-chain activity:

```powershell
$env:FROM_BLOCK='10800000'; npx hardhat run scripts/check-chain-activity.js --network sepolia
```

Run TypeScript validation:

```bash
cd frontend
npx tsc --noEmit
```

## Notification Notes

Email notifications are sent from the Next.js API routes using SMTP.

Phone SMS notifications are sent through httpSMS:

- API endpoint: `https://api.httpsms.com/v1/messages/send`
- Authentication header: `x-api-key`
- Required payload values: `content`, `from`, and `to`

Staff can review recent notification delivery status directly from the staff dashboard.

## Security Notes

- Never commit `.env`, `frontend/.env.local`, private keys, or generated branch wallet private keys.
- `staff-registry.json` contains generated manager wallet data and must stay private.
- Keep Sepolia test ETH in staff wallets so branch workflows can confirm MetaMask transactions.

## License

MIT
