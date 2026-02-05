import { useCallback } from "react";
import {
  useCompanyManagerRead,
  useCompanyManagerWrite,
  useGasSwapPlatformRead,
} from "./use-contracts";
import { useRoles } from "./use-roles";

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
  districtId: bigint;
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

export function useAddCompany() {
  const { isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { writeAsync, isPending, isSuccess, isError, error, data, reset } =
    useCompanyManagerWrite();

  const addCompany = useCallback(
    async (name: string, code: string) => {
      if (!isPlatformAdmin) {
        throw new Error("Unauthorized: Must be platform admin");
      }

      return writeAsync("addCompany", [name, code]);
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
    async (companyId: bigint, name: string, districtId: bigint) => {
      if (!isPlatformAdmin) {
        throw new Error("Unauthorized: Must be platform admin");
      }

      return writeAsync("addBranch", [companyId, name, districtId]);
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
