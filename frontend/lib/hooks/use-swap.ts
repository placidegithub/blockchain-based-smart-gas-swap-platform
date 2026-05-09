import { useCallback, useState } from "react";
import { useGasSwapPlatformWrite, useVoucherManagerWrite, useContractAddresses } from "./use-contracts";
import { useRoles } from "./use-roles";
import { useAccount, usePublicClient } from "wagmi";
import { decodeEventLog, formatEther, parseEther } from "viem";
import VoucherManagerABI from "../contracts/abis/VoucherManager.json";

export interface InitiateSwapParams {
  customer: `0x${string}`;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cylinderSerialNumber?: string;
  companyId?: bigint;
  cylinderTypeId?: bigint;
  branchId: bigint;
}

export interface CompleteSwapParams {
  voucherId: bigint;
  newCylinderSerialNumber?: string;
  branchId: bigint;
}

export function useInitiateSwap() {
  const { isBranchStaff, isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { address } = useAccount();
  const {
    writeAsync: writePlatformAsync,
    isPending: isPlatformPending,
    isSuccess: isPlatformSuccess,
    isError: isPlatformError,
    error: platformError,
    data: platformData,
    reset: resetPlatform,
  } =
    useGasSwapPlatformWrite();
  const {
    writeAsync: writeVoucherAsync,
    isPending: isVoucherPending,
    isSuccess: isVoucherSuccess,
    isError: isVoucherError,
    error: voucherError,
    data: voucherData,
    reset: resetVoucher,
  } = useVoucherManagerWrite();
  const publicClient = usePublicClient();
  const addresses = useContractAddresses();
  const [voucherId, setVoucherId] = useState<bigint | null>(null);
  const [isWaitingForReceipt, setIsWaitingForReceipt] = useState(false);

  const isAuthorized = isBranchStaff || isPlatformAdmin;

  const initiateSwap = useCallback(
    async (params: InitiateSwapParams) => {
      if (!isAuthorized) {
        throw new Error("Unauthorized: Must be branch staff or admin");
      }

      setVoucherId(null);
      setIsWaitingForReceipt(true);

      try {
        if (publicClient && address) {
          const balance = await publicClient.getBalance({ address });
          const minimumBalance = parseEther("0.001");

          if (balance < minimumBalance) {
            throw new Error(
              `Insufficient SepoliaETH for gas. This wallet has ${formatEther(balance)} ETH; fund it with at least 0.001 SepoliaETH and try again.`
            );
          }
        }

        const hasRegisteredSerial = Boolean(params.cylinderSerialNumber?.trim());
        let txHash: `0x${string}`;

        if (hasRegisteredSerial) {
          txHash = await writePlatformAsync("initiateSwap", [
            params.customer,
            params.cylinderSerialNumber!.trim(),
            params.branchId,
            params.customerName,
            params.customerEmail,
            params.customerPhone,
          ]);
        } else {
          if (!params.companyId || !params.cylinderTypeId) {
            throw new Error("Company and cylinder type are required when no cylinder serial is provided");
          }

          const placeholderCylinderId = BigInt(Date.now());
          txHash = await writeVoucherAsync("createVoucher", [
            params.customer,
            params.companyId,
            params.cylinderTypeId,
            params.branchId,
            placeholderCylinderId,
            params.customerName,
            params.customerEmail,
            params.customerPhone,
          ]);
        }

        if (publicClient && txHash) {
          const receipt = await publicClient.waitForTransactionReceipt({
            hash: txHash,
          });

          for (const log of receipt.logs) {
            try {
              if (
                addresses?.voucherManager &&
                log.address.toLowerCase() === addresses.voucherManager.toLowerCase()
              ) {
                const decoded = decodeEventLog({
                  abi: VoucherManagerABI,
                  data: log.data,
                  topics: log.topics,
                });

                if (decoded.eventName === "VoucherCreated" && decoded.args) {
                  const args = decoded.args as unknown as { voucherId: bigint };
                  if (args.voucherId !== undefined) {
                    setVoucherId(args.voucherId);
                    break;
                  }
                }
              }
            } catch {
              // Not the event we're looking for
            }
          }
        }

        return txHash;
      } finally {
        setIsWaitingForReceipt(false);
      }
    },
    [writePlatformAsync, writeVoucherAsync, isAuthorized, publicClient, address, addresses]
  );

  const resetAll = useCallback(() => {
    resetPlatform();
    resetVoucher();
    setVoucherId(null);
  }, [resetPlatform, resetVoucher]);

  return {
    initiateSwap,
    isPending: isPlatformPending || isVoucherPending || isWaitingForReceipt,
    isSuccess: isPlatformSuccess || isVoucherSuccess || voucherId !== null,
    isError: isPlatformError || isVoucherError,
    error: platformError || voucherError,
    txHash: platformData || voucherData,
    voucherId,
    reset: resetAll,
    isAuthorized,
    isLoadingRoles,
  };
}

export function useCompleteSwap() {
  const { isBranchStaff, isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const {
    writeAsync: writePlatformAsync,
    isPending: isPlatformPending,
    isSuccess: isPlatformSuccess,
    isError: isPlatformError,
    error: platformError,
    data: platformData,
    reset: resetPlatform,
  } =
    useGasSwapPlatformWrite();
  const {
    writeAsync: writeVoucherAsync,
    isPending: isVoucherPending,
    isSuccess: isVoucherSuccess,
    isError: isVoucherError,
    error: voucherError,
    data: voucherData,
    reset: resetVoucher,
  } = useVoucherManagerWrite();

  const isAuthorized = isBranchStaff || isPlatformAdmin;

  const completeSwap = useCallback(
    async (params: CompleteSwapParams) => {
      if (!isAuthorized) {
        throw new Error("Unauthorized: Must be branch staff or admin");
      }

      if (publicClient && address) {
        const balance = await publicClient.getBalance({ address });
        const minimumBalance = parseEther("0.001");

        if (balance < minimumBalance) {
          throw new Error(
            `Insufficient SepoliaETH for gas. This wallet has ${formatEther(balance)} ETH; fund it with at least 0.001 SepoliaETH and try again.`
          );
        }
      }

      if (params.newCylinderSerialNumber?.trim()) {
        return writePlatformAsync("completeSwap", [
          params.voucherId,
          params.newCylinderSerialNumber.trim(),
          params.branchId,
        ]);
      }

      const placeholderCylinderId = BigInt(Date.now());
      return writeVoucherAsync("redeemVoucher", [
        params.voucherId,
        params.branchId,
        placeholderCylinderId,
      ]);
    },
    [writePlatformAsync, writeVoucherAsync, isAuthorized, publicClient, address]
  );

  const resetAll = useCallback(() => {
    resetPlatform();
    resetVoucher();
  }, [resetPlatform, resetVoucher]);

  return {
    completeSwap,
    isPending: isPlatformPending || isVoucherPending,
    isSuccess: isPlatformSuccess || isVoucherSuccess,
    isError: isPlatformError || isVoucherError,
    error: platformError || voucherError,
    txHash: platformData || voucherData,
    reset: resetAll,
    isAuthorized,
    isLoadingRoles,
  };
}
