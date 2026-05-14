import { useCallback } from "react";
import { useAccount, useReadContracts } from "wagmi";
import type { Abi } from "viem";
import {
  useContractAddresses,
  useCompanyManagerRead,
  useCompanyManagerWrite,
  useGasSwapPlatformRead,
  useGasSwapPlatformWrite,
  useVoucherManagerWrite,
  useCylinderRegistryWrite,
} from "./use-contracts";
import { useRoles } from "./use-roles";
import CompanyManagerABI from "../contracts/abis/CompanyManager.json";

const companyManagerAbi = CompanyManagerABI as Abi;

export interface Company {
  id: bigint;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: bigint;
}

export interface Branch {
  id: bigint;
  companyId: bigint;
  name: string;
  district: string;
  location: string;
  isActive: boolean;
  createdAt: bigint;
}

export interface CompanyInfo {
  name: string;
  code: string;
  isActive: boolean;
  branchCount: bigint;
  totalDeposits: bigint;
  totalRedemptions: bigint;
  netBalance: bigint;
}

export function useCompanies() {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "getAllActiveCompanies",
    [],
    true
  );

  return {
    companyIds: (data as bigint[] | undefined) ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useCompany(companyId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "getCompany",
    [companyId],
    companyId !== undefined
  );

  return {
    company: data as Company | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useCompanyInfo(companyId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useGasSwapPlatformRead(
    "getCompanyInfo",
    [companyId],
    companyId !== undefined
  );

  const info = data as
    | [string, string, boolean, bigint, bigint, bigint, bigint]
    | undefined;

  return {
    companyInfo: info
      ? {
          name: info[0],
          code: info[1],
          isActive: info[2],
          branchCount: info[3],
          totalDeposits: info[4],
          totalRedemptions: info[5],
          netBalance: info[6],
        }
      : undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useBranches(companyId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "getCompanyBranches",
    [companyId],
    companyId !== undefined
  );

  return {
    branchIds: (data as bigint[] | undefined) ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useBranch(branchId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "getBranch",
    [branchId],
    branchId !== undefined
  );

  return {
    branch: data as Branch | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useCurrentStaffInfo() {
  const { address, isConnected } = useAccount();
  
  const { data: staffBranchId, isLoading: isLoadingBranch } = useCompanyManagerRead(
    "getStaffBranch",
    [address],
    isConnected && !!address
  );

  const { data: staffCompanyId, isLoading: isLoadingCompany } = useCompanyManagerRead(
    "getStaffCompany",
    [address],
    isConnected && !!address
  );

  const branchId = staffBranchId as bigint | undefined;
  const companyId = staffCompanyId as bigint | undefined;

  const { branch, isLoading: isLoadingBranchData } = useBranch(
    branchId && branchId > 0n ? branchId : undefined
  );

  const { company, isLoading: isLoadingCompanyData } = useCompany(
    companyId && companyId > 0n ? companyId : undefined
  );

  const isLoading = isLoadingBranch || isLoadingCompany || isLoadingBranchData || isLoadingCompanyData;

  return {
    branchId: branchId && branchId > 0n ? branchId : undefined,
    companyId: companyId && companyId > 0n ? companyId : undefined,
    branch,
    company,
    isLoading,
    isStaffAssigned: branchId !== undefined && branchId > 0n,
  };
}

export function useCompanyCount() {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "companyCount",
    [],
    true
  );

  return {
    count: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useBranchCount() {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "branchCount",
    [],
    true
  );

  return {
    count: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useAllBranches() {
  const { count, isLoading: isLoadingCount } = useBranchCount();
  
  // Generate array of branch IDs from 1 to count
  const branchIds: bigint[] = [];
  if (count && count > 0n) {
    for (let i = 1n; i <= count; i++) {
      branchIds.push(i);
    }
  }

  return {
    branchIds,
    isLoading: isLoadingCount,
    count,
  };
}

export function useBranchesByDistrict(districtIndex: number | undefined) {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "getBranchesByDistrict",
    [districtIndex !== undefined ? BigInt(districtIndex) : 0n],
    districtIndex !== undefined
  );

  return {
    branchIds: (data as bigint[] | undefined) ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useBranchByCompanyAndDistrict(companyId: bigint | undefined, districtIndex: number | undefined) {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "getBranchByCompanyAndDistrict",
    [companyId ?? 0n, districtIndex !== undefined ? BigInt(districtIndex) : 0n],
    companyId !== undefined && districtIndex !== undefined
  );

  return {
    branchId: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useCompanyBranchInDistrict(companyId: bigint | undefined, district: string | undefined) {
  const addresses = useContractAddresses();
  const { branchIds, isLoading: isLoadingBranchIds } = useBranches(companyId);
  const normalizedDistrict = district?.trim().toLowerCase();

  const { data, isLoading: isLoadingBranches, error, refetch } = useReadContracts({
    contracts: branchIds.map((branchId) => ({
      address: addresses?.companyManager,
      abi: companyManagerAbi,
      functionName: "getBranch",
      args: [branchId],
    })),
    query: {
      enabled: Boolean(addresses?.companyManager && companyId && companyId > 0n && normalizedDistrict && branchIds.length > 0),
      refetchInterval: 5000,
    },
  });

  const branches = (data ?? [])
    .map((item) => item.status === "success" ? item.result as Branch : undefined)
    .filter((branch): branch is Branch => Boolean(branch));

  const branch = branches.find((candidate) =>
    candidate.companyId === companyId &&
    candidate.isActive &&
    candidate.district.trim().toLowerCase() === normalizedDistrict
  );

  return {
    branchId: branch?.id,
    branch,
    isLoading: isLoadingBranchIds || isLoadingBranches,
    error,
    refetch,
  };
}

export function useAddCompany() {
  const { isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { writeAsync, isPending, isSuccess, isError, error, data, reset } =
    useCompanyManagerWrite();

  const addCompany = useCallback(
    async (name: string, code: string, adminWallet: `0x${string}`) => {
      if (!isPlatformAdmin) {
        throw new Error("Unauthorized: Must be platform admin");
      }

      return writeAsync("registerCompany", [name, code, adminWallet]);
    },
    [writeAsync, isPlatformAdmin]
  );

  return {
    addCompany,
    isPending,
    isSuccess,
    isError,
    error,
    txHash: data,
    reset,
    isAuthorized: isPlatformAdmin,
    isLoadingRoles,
  };
}

export function useAddBranch() {
  const { isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { writeAsync, isPending, isSuccess, isError, error, data, reset } =
    useCompanyManagerWrite();

  const addBranch = useCallback(
    async (companyId: bigint, name: string, district: string, location: string) => {
      if (!isPlatformAdmin) {
        throw new Error("Unauthorized: Must be platform admin");
      }

      return writeAsync("registerBranch", [companyId, name, district, location]);
    },
    [writeAsync, isPlatformAdmin]
  );

  return {
    addBranch,
    isPending,
    isSuccess,
    isError,
    error,
    txHash: data,
    reset,
    isAuthorized: isPlatformAdmin,
    isLoadingRoles,
  };
}

export function useAssignBranchStaff() {
  const { isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { writeAsync: writeCompanyManager, isPending: isPendingCM, isSuccess: isSuccessCM, isError: isErrorCM, error: errorCM, data: dataCM, reset: resetCM } =
    useCompanyManagerWrite();

  const assignStaff = useCallback(
    async (staffAddress: `0x${string}`, companyId: bigint, branchId: bigint) => {
      if (!isPlatformAdmin) {
        throw new Error("Unauthorized: Must be platform admin");
      }

      return writeCompanyManager("assignBranchStaff", [staffAddress, companyId, branchId]);
    },
    [writeCompanyManager, isPlatformAdmin]
  );

  return {
    assignStaff,
    isPending: isPendingCM,
    isSuccess: isSuccessCM,
    isError: isErrorCM,
    error: errorCM,
    txHash: dataCM,
    reset: resetCM,
    isAuthorized: isPlatformAdmin,
    isLoadingRoles,
  };
}

export function useGrantVoucherManagerStaffRole() {
  const { isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { writeAsync, isPending, isSuccess, isError, error, data, reset } =
    useVoucherManagerWrite();

  const grantStaffRole = useCallback(
    async (staffAddress: `0x${string}`) => {
      if (!isPlatformAdmin) {
        throw new Error("Unauthorized: Must be platform admin");
      }

      return writeAsync("grantStaffRole", [staffAddress]);
    },
    [writeAsync, isPlatformAdmin]
  );

  return {
    grantStaffRole,
    isPending,
    isSuccess,
    isError,
    error,
    txHash: data,
    reset,
    isAuthorized: isPlatformAdmin,
    isLoadingRoles,
  };
}

const BRANCH_STAFF_ROLE_HASH = "0x45f38dbdf8e6d346f59dbe508e964d6aad44a9632bbdf1d41126e061be782428" as `0x${string}`;

export function useGrantCylinderRegistryStaffRole() {
  const { isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { writeAsync, isPending, isSuccess, isError, error, data, reset } =
    useCylinderRegistryWrite();

  const grantStaffRole = useCallback(
    async (staffAddress: `0x${string}`) => {
      if (!isPlatformAdmin) {
        throw new Error("Unauthorized: Must be platform admin");
      }

      return writeAsync("grantRole", [BRANCH_STAFF_ROLE_HASH, staffAddress]);
    },
    [writeAsync, isPlatformAdmin]
  );

  return {
    grantStaffRole,
    isPending,
    isSuccess,
    isError,
    error,
    txHash: data,
    reset,
    isAuthorized: isPlatformAdmin,
    isLoadingRoles,
  };
}

export function useGrantGasSwapPlatformStaffRole() {
  const { isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { writeAsync, isPending, isSuccess, isError, error, data, reset } =
    useGasSwapPlatformWrite();

  const grantStaffRole = useCallback(
    async (staffAddress: `0x${string}`) => {
      if (!isPlatformAdmin) {
        throw new Error("Unauthorized: Must be platform admin");
      }

      return writeAsync("grantRole", [BRANCH_STAFF_ROLE_HASH, staffAddress]);
    },
    [writeAsync, isPlatformAdmin]
  );

  return {
    grantStaffRole,
    isPending,
    isSuccess,
    isError,
    error,
    txHash: data,
    reset,
    isAuthorized: isPlatformAdmin,
    isLoadingRoles,
  };
}
