'use client';

import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

export interface GeneratedWallet {
  address: `0x${string}`;
  privateKey: `0x${string}`;
}

export function generateTestWallet(): GeneratedWallet {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  
  return {
    address: account.address,
    privateKey: privateKey,
  };
}

export function formatWalletForDisplay(wallet: GeneratedWallet): string {
  return `Address: ${wallet.address}\nPrivate Key: ${wallet.privateKey}`;
}

export function downloadWalletCredentials(wallet: GeneratedWallet, branchName: string): void {
  const content = `Branch Manager Wallet Credentials
================================
Branch: ${branchName}
Generated: ${new Date().toISOString()}

WALLET ADDRESS:
${wallet.address}

PRIVATE KEY (KEEP SECRET!):
${wallet.privateKey}

IMPORTANT INSTRUCTIONS:
1. Open MetaMask browser extension
2. Click the account icon (top right)
3. Select "Import Account"
4. Choose "Private Key" as the import type
5. Paste the private key above
6. Click "Import"

WARNING: 
- Never share your private key with anyone
- Store this file securely
- Delete this file after importing to MetaMask
- This wallet needs test ETH for gas fees on Hardhat network
`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${branchName.replace(/\s+/g, '_')}_wallet_credentials.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
