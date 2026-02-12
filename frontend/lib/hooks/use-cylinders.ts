import { useCallback } from "react";
import { useCylinderRegistryRead, useCylinderRegistryWrite, useCompanyManagerRead } from "./use-contracts";
import { useRoles } from "./use-roles";

export interface CylinderType {
  id: bigint;
  name: string;
  weightKg: bigint;
  priceRwf: bigint;
  isActive: boolean;
}

export interface CylinderData {
  id: bigint;
  companyId: bigint;
  typeId: bigint;
  serialNumber: string;
  currentBranchId: bigint;
  status: number;
  lastUpdated: bigint;
}

export enum CylinderStatus {
  AVAILABLE = 0,
  IN_USE = 1,
  IN_TRANSIT = 2,
  MAINTENANCE = 3,
  RETIRED = 4,
}

export interface CylinderTypeInfo {
  sizeName: string;
  weightKg: bigint;
  priceRwf: bigint;
}

export function useCylinderTypeCount() {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "cylinderTypeCount",
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

export function useCylinderTypeById(typeId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "getCylinderType",
    [typeId],
    typeId !== undefined && typeId > 0n
  );

  const result = data as
    | { id: bigint; companyId: bigint; name: string; capacityKg: bigint; depositAmount: bigint; isActive: boolean }
    | undefined;

  return {
    cylinderType: result
      ? {
          id: result.id,
          name: result.name || `${Number(result.capacityKg)}kg`,
          weightKg: result.capacityKg,
          priceRwf: result.depositAmount,
          isActive: result.isActive,
        }
      : undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useCylinderTypes() {
  const { count, isLoading: isLoadingCount } = useCylinderTypeCount();

  const typeIds: bigint[] = [];
  if (count && count > 0n) {
    for (let i = 1n; i <= count; i++) {
      typeIds.push(i);
    }
  }

  const cylinderTypes: CylinderType[] = [];

  return {
    typeIds,
    cylinderTypes,
    isLoading: isLoadingCount,
    count,
  };
}

export function useCylinderTypesForCompany(companyId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "getCompanyCylinderTypes",
    [companyId],
    companyId !== undefined && companyId > 0n
  );

  return {
    typeIds: (data as bigint[] | undefined) ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useCylinderType(typeId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useCompanyManagerRead(
    "getCylinderType",
    [typeId],
    typeId !== undefined
  );

  // CylinderType struct: { id, companyId, name, capacityKg, depositAmount, isActive }
  const result = data as { id: bigint; companyId: bigint; name: string; capacityKg: bigint; depositAmount: bigint; isActive: boolean } | undefined;

  return {
    cylinderType: result
      ? {
          sizeName: result.name || `${result.capacityKg}kg`,
          weightKg: result.capacityKg,
          priceRwf: result.depositAmount,
        }
      : undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useTotalCylinders() {
  const { data, isLoading, error, refetch } = useCylinderRegistryRead(
    "getTotalCylinders",
    [],
    true
  );

  return {
    total: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useCylinderBySerial(serialNumber: string | undefined) {
  const { data, isLoading, error, refetch } = useCylinderRegistryRead(
    "getCylinderBySerial",
    [serialNumber],
    !!serialNumber
  );

  const result = data as [bigint, CylinderData] | undefined;

  return {
    cylinderId: result?.[0],
    cylinderData: result?.[1],
    isLoading,
    error,
    refetch,
  };
}

export function useCylinder(cylinderId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useCylinderRegistryRead(
    "getCylinder",
    [cylinderId],
    cylinderId !== undefined && cylinderId > 0n
  );

  return {
    cylinder: data as CylinderData | undefined,
    isLoading,
    error,
    refetch,
  };
}

export interface RegisterCylinderParams {
  companyId: bigint;
  typeId: bigint;
  serialNumber: string;
  branchId: bigint;
  manufacturingDate?: bigint;
}

export function useRegisterCylinder() {
  const { isBranchStaff, isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { writeAsync, isPending, isSuccess, isError, error, data, reset } =
    useCylinderRegistryWrite();

  const isAuthorized = isBranchStaff || isPlatformAdmin;

  const registerCylinder = useCallback(
    async (params: RegisterCylinderParams) => {
      if (!isAuthorized) {
        throw new Error("Unauthorized: Must be branch staff or admin");
      }

      const manufacturingDate = params.manufacturingDate ?? BigInt(Math.floor(Date.now() / 1000));

      return writeAsync("registerCylinder", [
        params.companyId,
        params.typeId,
        params.serialNumber,
        params.branchId,
        manufacturingDate,
      ]);
    },
    [writeAsync, isAuthorized]
  );

  return {
    registerCylinder,
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

export function getCylinderStatusLabel(status: CylinderStatus): string {
  switch (status) {
    case CylinderStatus.AVAILABLE:
      return "Available";
    case CylinderStatus.IN_USE:
      return "In Use";
    case CylinderStatus.IN_TRANSIT:
      return "In Transit";
    case CylinderStatus.MAINTENANCE:
      return "Maintenance";
    case CylinderStatus.RETIRED:
      return "Retired";
    default:
      return "Unknown";
  }
}

export function formatCylinderWeight(weightKg: bigint): string {
  return `${Number(weightKg)} kg`;
}

export function formatCylinderPrice(priceRwf: bigint): string {
  return `${Number(priceRwf).toLocaleString()} RWF`;
}

export function useAvailableCylindersAtBranch(branchId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useCylinderRegistryRead(
    "getAvailableCylindersAtBranch",
    [branchId],
    branchId !== undefined && branchId > 0n
  );

  const result = data as [string[], bigint[]] | undefined;

  return {
    serialNumbers: result?.[0] ?? [],
    tokenIds: result?.[1] ?? [],
    isLoading,
    error,
    refetch,
  };
}
