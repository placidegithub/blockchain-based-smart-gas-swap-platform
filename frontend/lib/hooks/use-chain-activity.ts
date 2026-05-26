"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient, useChainId } from "wagmi";
import { decodeEventLog, type Abi, type PublicClient } from "viem";
import { useContractAddresses } from "./use-contracts";
import { shortenAddress } from "@/lib/utils";

import CompanyManagerABI from "../contracts/abis/CompanyManager.json";
import CylinderRegistryABI from "../contracts/abis/CylinderRegistry.json";
import VoucherManagerABI from "../contracts/abis/VoucherManager.json";
import GasSwapPlatformABI from "../contracts/abis/GasSwapPlatform.json";

const CHUNK_SIZE = 45_000n;
const DEFAULT_BLOCK_WINDOW = 135_000n;

async function getLogsInChunks(
  publicClient: PublicClient,
  address: `0x${string}`,
  fromBlock: bigint,
  toBlock: bigint
) {
  const logs = [];

  for (let start = fromBlock; start <= toBlock; start += CHUNK_SIZE) {
    const end = start + CHUNK_SIZE - 1n > toBlock ? toBlock : start + CHUNK_SIZE - 1n;
    const chunk = await publicClient.getLogs({
      address,
      fromBlock: start,
      toBlock: end,
    });
    logs.push(...chunk);
  }

  return logs;
}

const CONTRACTS = [
  {
    name: "CompanyManager",
    key: "companyManager",
    abi: CompanyManagerABI as Abi,
  },
  {
    name: "CylinderRegistry",
    key: "cylinderRegistry",
    abi: CylinderRegistryABI as Abi,
  },
  {
    name: "VoucherManager",
    key: "voucherManager",
    abi: VoucherManagerABI as Abi,
  },
  {
    name: "GasSwapPlatform",
    key: "gasSwapPlatform",
    abi: GasSwapPlatformABI as Abi,
  },
] as const;

type ContractKey = (typeof CONTRACTS)[number]["key"];

export interface ChainActivityEvent {
  id: string;
  contractName: string;
  contractAddress: `0x${string}`;
  eventName: string;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  logIndex: number;
  summary: string;
  explorerUrl: string;
}

export interface ChainActivityStats {
  latestBlock: bigint;
  fromBlock: bigint;
  totalEvents: number;
  byContract: Record<string, number>;
  byEvent: Record<string, number>;
}

export interface VoucherChainProof {
  createdTxHash?: `0x${string}`;
  redeemedTxHash?: `0x${string}`;
  createdBlock?: bigint;
  redeemedBlock?: bigint;
  explorerBaseUrl: string;
}

function explorerBaseUrl(chainId: number) {
  if (chainId === 11155111) return "https://sepolia.etherscan.io";
  if (chainId === 1) return "https://etherscan.io";
  if (chainId === 137) return "https://polygonscan.com";
  if (chainId === 80001) return "https://mumbai.polygonscan.com";
  return "";
}

function formatValue(value: unknown): string {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string" && value.startsWith("0x") && value.length === 42) {
    return shortenAddress(value, 6);
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function argValue(args: unknown, key: string): unknown {
  if (!args || typeof args !== "object") return undefined;
  return (args as Record<string, unknown>)[key];
}

function eventSummary(eventName: string, args: unknown): string {
  switch (eventName) {
    case "VoucherCreated":
      return `Voucher #${formatValue(argValue(args, "voucherId"))} created for ${formatValue(argValue(args, "customer"))} at branch #${formatValue(argValue(args, "sourceBranchId"))}`;
    case "VoucherRedeemed":
      return `Voucher #${formatValue(argValue(args, "voucherId"))} redeemed at branch #${formatValue(argValue(args, "redemptionBranchId"))}`;
    case "BranchRegistered":
      return `Branch #${formatValue(argValue(args, "branchId"))} registered for company #${formatValue(argValue(args, "companyId"))}: ${formatValue(argValue(args, "name"))}`;
    case "CompanyRegistered":
      return `Company #${formatValue(argValue(args, "companyId"))} registered: ${formatValue(argValue(args, "name"))}`;
    case "CylinderRegistered":
      return `Cylinder #${formatValue(argValue(args, "tokenId"))} registered: ${formatValue(argValue(args, "serialNumber"))}`;
    case "CylinderStatusChanged":
      return `Cylinder #${formatValue(argValue(args, "tokenId"))} status changed at branch #${formatValue(argValue(args, "branchId"))}`;
    case "StaffAssigned":
      return `${formatValue(argValue(args, "staff"))} assigned to company #${formatValue(argValue(args, "companyId"))}, branch #${formatValue(argValue(args, "branchId"))}`;
    case "PlatformInitialized":
      return "Platform contract references initialized";
    case "RoleGranted":
      return `Role granted to ${formatValue(argValue(args, "account"))}`;
    case "Transfer":
      return `NFT transfer from ${formatValue(argValue(args, "from"))} to ${formatValue(argValue(args, "to"))}`;
    default:
      return eventName;
  }
}

export function useChainActivity(limit = 100) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const addresses = useContractAddresses();

  return useQuery({
    queryKey: ["chain-activity", chainId, addresses, limit],
    enabled: Boolean(publicClient && addresses),
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!publicClient || !addresses) {
        throw new Error("Wallet RPC client or contract addresses are unavailable.");
      }

      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock =
        latestBlock > DEFAULT_BLOCK_WINDOW ? latestBlock - DEFAULT_BLOCK_WINDOW : 0n;
      const baseUrl = explorerBaseUrl(chainId);
      const events: ChainActivityEvent[] = [];

      for (const contract of CONTRACTS) {
        const address = addresses[contract.key as ContractKey];

        for (let start = fromBlock; start <= latestBlock; start += CHUNK_SIZE) {
          const end = start + CHUNK_SIZE - 1n > latestBlock ? latestBlock : start + CHUNK_SIZE - 1n;
          const logs = await publicClient.getLogs({
            address,
            fromBlock: start,
            toBlock: end,
          });

          for (const log of logs) {
            if (!log.transactionHash) continue;

            try {
              const decoded = decodeEventLog({
                abi: contract.abi,
                data: log.data,
                topics: log.topics,
              });
              const eventName = decoded.eventName ?? "Unknown";

              events.push({
                id: `${log.transactionHash}-${log.logIndex}`,
                contractName: contract.name,
                contractAddress: address,
                eventName,
                blockNumber: log.blockNumber ?? 0n,
                transactionHash: log.transactionHash,
                logIndex: log.logIndex ?? 0,
                summary: eventSummary(eventName, decoded.args),
                explorerUrl: baseUrl ? `${baseUrl}/tx/${log.transactionHash}` : "",
              });
            } catch {
              events.push({
                id: `${log.transactionHash}-${log.logIndex}`,
                contractName: contract.name,
                contractAddress: address,
                eventName: "Unknown",
                blockNumber: log.blockNumber ?? 0n,
                transactionHash: log.transactionHash!,
                logIndex: log.logIndex ?? 0,
                summary: "Unrecognized contract log",
                explorerUrl: baseUrl ? `${baseUrl}/tx/${log.transactionHash}` : "",
              });
            }
          }
        }
      }

      const sorted = events
        .sort((a, b) => {
          if (a.blockNumber === b.blockNumber) return b.logIndex - a.logIndex;
          return a.blockNumber > b.blockNumber ? -1 : 1;
        })
        .slice(0, limit);

      const byContract: Record<string, number> = {};
      const byEvent: Record<string, number> = {};

      for (const event of events) {
        byContract[event.contractName] = (byContract[event.contractName] || 0) + 1;
        byEvent[event.eventName] = (byEvent[event.eventName] || 0) + 1;
      }

      return {
        events: sorted,
        stats: {
          latestBlock,
          fromBlock,
          totalEvents: events.length,
          byContract,
          byEvent,
        } satisfies ChainActivityStats,
      };
    },
  });
}

export function useVoucherChainProof(voucherId: bigint | undefined) {
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const addresses = useContractAddresses();

  return useQuery({
    queryKey: ["voucher-chain-proof", chainId, addresses?.voucherManager, voucherId?.toString()],
    enabled: Boolean(publicClient && addresses?.voucherManager && voucherId && voucherId > 0n),
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!publicClient || !addresses?.voucherManager || !voucherId) {
        throw new Error("Voucher proof cannot be loaded yet.");
      }

      const latestBlock = await publicClient.getBlockNumber();
      const fromBlock =
        latestBlock > DEFAULT_BLOCK_WINDOW ? latestBlock - DEFAULT_BLOCK_WINDOW : 0n;
      const baseUrl = explorerBaseUrl(chainId);
      const logs = await getLogsInChunks(
        publicClient,
        addresses.voucherManager,
        fromBlock,
        latestBlock
      );

      const proof: VoucherChainProof = {
        explorerBaseUrl: baseUrl,
      };

      for (const log of logs) {
        if (!log.transactionHash) continue;

        try {
          const decoded = decodeEventLog({
            abi: VoucherManagerABI as Abi,
            data: log.data,
            topics: log.topics,
          });

          const eventVoucherId = argValue(decoded.args, "voucherId");
          if (eventVoucherId !== voucherId) continue;

          if (decoded.eventName === "VoucherCreated") {
            proof.createdTxHash = log.transactionHash;
            proof.createdBlock = log.blockNumber ?? undefined;
          }

          if (decoded.eventName === "VoucherRedeemed") {
            proof.redeemedTxHash = log.transactionHash;
            proof.redeemedBlock = log.blockNumber ?? undefined;
          }
        } catch {
          // Ignore logs that are not part of this proof.
        }
      }

      return proof;
    },
  });
}
