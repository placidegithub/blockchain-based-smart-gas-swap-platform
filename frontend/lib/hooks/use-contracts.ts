import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useChainId } from "wagmi";
import { getContractAddresses, fetchDeployedAddresses, CHAIN_IDS } from "../contracts/addresses";

import VoucherManagerABI from "../contracts/abis/VoucherManager.json";
import GasSwapPlatformABI from "../contracts/abis/GasSwapPlatform.json";
import CompanyManagerABI from "../contracts/abis/CompanyManager.json";
import CylinderRegistryABI from "../contracts/abis/CylinderRegistry.json";

export function useContractAddresses() {
  const chainId = useChainId();
  const [runtimeAddresses, setRuntimeAddresses] = useState<ReturnType<typeof getContractAddresses> | null>(null);

  useEffect(() => {
    // For local and Sepolia deployments, fetch addresses at runtime to avoid stale cache after redeploy
    if (chainId === CHAIN_IDS.LOCALHOST || chainId === CHAIN_IDS.SEPOLIA) {
      fetchDeployedAddresses().then((addrs) => {
        if (addrs) {
          setRuntimeAddresses(addrs);
        }
      });
    }
  }, [chainId]);

  try {
    // For local and Sepolia deployments, prefer runtime-fetched addresses
    if ((chainId === CHAIN_IDS.LOCALHOST || chainId === CHAIN_IDS.SEPOLIA) && runtimeAddresses) {
      return runtimeAddresses;
    }
    return getContractAddresses(chainId);
  } catch {
    return null;
  }
}

export function useVoucherManagerRead<TFunctionName extends string>(
  functionName: TFunctionName,
  args?: readonly unknown[],
  enabled = true
) {
  const addresses = useContractAddresses();

  return useReadContract({
    address: addresses?.voucherManager,
    abi: VoucherManagerABI,
    functionName,
    args,
    query: {
      enabled: enabled && !!addresses,
      refetchInterval: 5000,
    },
  });
}

export function useVoucherManagerWrite() {
  const addresses = useContractAddresses();
  const { writeContract, writeContractAsync, ...rest } = useWriteContract();

  return {
    ...rest,
    write: (functionName: string, args: unknown[]) =>
      writeContract({
        address: addresses!.voucherManager,
        abi: VoucherManagerABI,
        functionName,
        args,
      }),
    writeAsync: (functionName: string, args: unknown[]) =>
      writeContractAsync({
        address: addresses!.voucherManager,
        abi: VoucherManagerABI,
        functionName,
        args,
      }),
  };
}

export function useGasSwapPlatformRead<TFunctionName extends string>(
  functionName: TFunctionName,
  args?: readonly unknown[],
  enabled = true
) {
  const addresses = useContractAddresses();

  return useReadContract({
    address: addresses?.gasSwapPlatform,
    abi: GasSwapPlatformABI,
    functionName,
    args,
    query: {
      enabled: enabled && !!addresses,
      refetchInterval: 5000,
    },
  });
}

export function useGasSwapPlatformWrite() {
  const addresses = useContractAddresses();
  const { writeContract, writeContractAsync, ...rest } = useWriteContract();

  return {
    ...rest,
    write: (functionName: string, args: unknown[]) =>
      writeContract({
        address: addresses!.gasSwapPlatform,
        abi: GasSwapPlatformABI,
        functionName,
        args,
      }),
    writeAsync: (functionName: string, args: unknown[]) =>
      writeContractAsync({
        address: addresses!.gasSwapPlatform,
        abi: GasSwapPlatformABI,
        functionName,
        args,
      }),
  };
}

export function useCompanyManagerRead<TFunctionName extends string>(
  functionName: TFunctionName,
  args?: readonly unknown[],
  enabled = true
) {
  const addresses = useContractAddresses();

  return useReadContract({
    address: addresses?.companyManager,
    abi: CompanyManagerABI,
    functionName,
    args,
    query: {
      enabled: enabled && !!addresses,
      refetchInterval: 5000,
    },
  });
}

export function useCompanyManagerWrite() {
  const addresses = useContractAddresses();
  const { writeContract, writeContractAsync, ...rest } = useWriteContract();

  return {
    ...rest,
    write: (functionName: string, args: unknown[]) =>
      writeContract({
        address: addresses!.companyManager,
        abi: CompanyManagerABI,
        functionName,
        args,
      }),
    writeAsync: (functionName: string, args: unknown[]) =>
      writeContractAsync({
        address: addresses!.companyManager,
        abi: CompanyManagerABI,
        functionName,
        args,
      }),
  };
}

export function useCylinderRegistryRead<TFunctionName extends string>(
  functionName: TFunctionName,
  args?: readonly unknown[],
  enabled = true
) {
  const addresses = useContractAddresses();

  return useReadContract({
    address: addresses?.cylinderRegistry,
    abi: CylinderRegistryABI,
    functionName,
    args,
    query: {
      enabled: enabled && !!addresses,
      refetchInterval: 5000,
    },
  });
}

export function useCylinderRegistryWrite() {
  const addresses = useContractAddresses();
  const { writeContract, writeContractAsync, ...rest } = useWriteContract();

  return {
    ...rest,
    write: (functionName: string, args: unknown[]) =>
      writeContract({
        address: addresses!.cylinderRegistry,
        abi: CylinderRegistryABI,
        functionName,
        args,
      }),
    writeAsync: (functionName: string, args: unknown[]) =>
      writeContractAsync({
        address: addresses!.cylinderRegistry,
        abi: CylinderRegistryABI,
        functionName,
        args,
      }),
  };
}
