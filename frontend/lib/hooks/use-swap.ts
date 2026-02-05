import { useCallback, useState } from "react";
import { useGasSwapPlatformWrite, useContractAddresses } from "./use-contracts";
import { useRoles } from "./use-roles";
import { usePublicClient } from "wagmi";
import { decodeEventLog } from "viem";
import VoucherManagerABI from "../contracts/abis/VoucherManager.json";

export interface InitiateSwapParams {
  customer: `0x${string}`;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cylinderSerialNumber: string;
  branchId: bigint;
}

export interface CompleteSwapParams {
  voucherId: bigint;
  newCylinderSerialNumber: string;
  branchId: bigint;
}

export function useInitiateSwap() {
  const { isBranchStaff, isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { writeAsync, isPending, isSuccess, isError, error, data, reset } =
    useGasSwapPlatformWrite();
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
        const txHash = await writeAsync("initiateSwap", [
          params.customer,
          params.cylinderSerialNumber,
          params.branchId,
          params.customerName,
          params.customerEmail,
          params.customerPhone,
        ]);

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
    [writeAsync, isAuthorized, publicClient, addresses]
  );

  const resetAll = useCallback(() => {
    reset();
    setVoucherId(null);
  }, [reset]);

  return {
    initiateSwap,
    isPending: isPending || isWaitingForReceipt,
    isSuccess,
    isError,
    error,
    txHash: data,
    voucherId,
    reset: resetAll,
    isAuthorized,
    isLoadingRoles,
  };
}

export function useCompleteSwap() {
  const { isBranchStaff, isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { writeAsync, isPending, isSuccess, isError, error, data, reset } =
    useGasSwapPlatformWrite();

  const isAuthorized = isBranchStaff || isPlatformAdmin;

  const completeSwap = useCallback(
    async (params: CompleteSwapParams) => {
      if (!isAuthorized) {
        throw new Error("Unauthorized: Must be branch staff or admin");
      }

      return writeAsync("completeSwap", [
        params.voucherId,
        params.newCylinderSerialNumber,
        params.branchId,
      ]);
    },
    [writeAsync, isAuthorized]
  );

  return {
    completeSwap,
    isPending,
    isSuccess,
    isError,
    error,
    txHash: data,
    reset,
    isAuthorized,
    isLoadingRoles,
  };
}
