export const CHAIN_IDS = {
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
  LOCALHOST: 31337,
} as const;

export type SupportedChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS];

interface ContractAddresses {
  gasSwapPlatform: `0x${string}`;
  voucherManager: `0x${string}`;
  companyManager: `0x${string}`;
  cylinderRegistry: `0x${string}`;
}

interface DeployedAddresses {
  gasSwapPlatform: string;
  voucherManager: string;
  companyManager: string;
  cylinderRegistry: string;
  deployer?: string;
  chainId?: number;
}

let deployedAddresses: DeployedAddresses | null = null;

try {
  deployedAddresses = require("./deployed-addresses.json");
} catch {
  console.log("No deployed-addresses.json found, using defaults");
}

const DEFAULT_LOCALHOST_ADDRESSES: ContractAddresses = {
  gasSwapPlatform: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  voucherManager: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  companyManager: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  cylinderRegistry: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
};

const getLocalhostAddresses = (): ContractAddresses => {
  if (deployedAddresses) {
    return {
      gasSwapPlatform: deployedAddresses.gasSwapPlatform as `0x${string}`,
      voucherManager: deployedAddresses.voucherManager as `0x${string}`,
      companyManager: deployedAddresses.companyManager as `0x${string}`,
      cylinderRegistry: deployedAddresses.cylinderRegistry as `0x${string}`,
    };
  }
  return DEFAULT_LOCALHOST_ADDRESSES;
};

export const CONTRACT_ADDRESSES: Record<SupportedChainId, ContractAddresses> = {
  [CHAIN_IDS.POLYGON_MAINNET]: {
    gasSwapPlatform: "0x0000000000000000000000000000000000000001",
    voucherManager: "0x0000000000000000000000000000000000000002",
    companyManager: "0x0000000000000000000000000000000000000003",
    cylinderRegistry: "0x0000000000000000000000000000000000000004",
  },
  [CHAIN_IDS.POLYGON_MUMBAI]: {
    gasSwapPlatform: "0x0000000000000000000000000000000000000011",
    voucherManager: "0x0000000000000000000000000000000000000012",
    companyManager: "0x0000000000000000000000000000000000000013",
    cylinderRegistry: "0x0000000000000000000000000000000000000014",
  },
  [CHAIN_IDS.LOCALHOST]: getLocalhostAddresses(),
};

export function getContractAddresses(chainId: number): ContractAddresses {
  if (chainId === CHAIN_IDS.LOCALHOST) {
    return getLocalhostAddresses();
  }
  const addresses = CONTRACT_ADDRESSES[chainId as SupportedChainId];
  if (!addresses) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return addresses;
}

export function getDeployerAddress(): string | undefined {
  return deployedAddresses?.deployer;
}
