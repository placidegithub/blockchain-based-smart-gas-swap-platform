import { defineChain } from "viem";
import { polygon, polygonMumbai, sepolia } from "viem/chains";

export const localhost = defineChain({
  id: 31337,
  name: "Localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  testnet: true,
});

export const supportedChains = [polygon, polygonMumbai, sepolia, localhost] as const;

export type SupportedChain = (typeof supportedChains)[number];

export const defaultChain = sepolia;

export function getChainById(chainId: number): SupportedChain | undefined {
  return supportedChains.find((chain) => chain.id === chainId);
}

export function isChainSupported(chainId: number): boolean {
  return supportedChains.some((chain) => chain.id === chainId);
}

export const chainConfig = {
  polygon: {
    ...polygon,
    blockExplorerName: "Polygonscan",
    iconUrl: "/icons/polygon.svg",
  },
  polygonMumbai: {
    ...polygonMumbai,
    blockExplorerName: "Polygonscan Mumbai",
    iconUrl: "/icons/polygon.svg",
  },
  sepolia: {
    ...sepolia,
    blockExplorerName: "Etherscan Sepolia",
    iconUrl: "/icons/ethereum.svg",
  },
  localhost: {
    ...localhost,
    blockExplorerName: "Local Explorer",
    iconUrl: "/icons/hardhat.svg",
  },
} as const;
