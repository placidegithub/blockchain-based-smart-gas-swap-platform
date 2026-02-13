import { useAccount } from "wagmi";
import { useMemo } from "react";
import { useGasSwapPlatformRead, useVoucherManagerRead, useCompanyManagerRead } from "./use-contracts";
import { keccak256, stringToHex } from "viem";

// Use stringToHex to properly encode strings to bytes (matches Solidity's keccak256("string"))
export const PLATFORM_ADMIN_ROLE = keccak256(stringToHex("PLATFORM_ADMIN_ROLE"));
export const BRANCH_STAFF_ROLE = keccak256(stringToHex("BRANCH_STAFF_ROLE"));

export interface RolesState {
  isPlatformAdmin: boolean;
  isBranchStaff: boolean;
  isLoading: boolean;
  hasAnyRole: boolean;
  hasError: boolean;
}

// Hook to get role constants directly from the contract (for verification)
export function useContractRoles() {
  const { data: adminRole } = useVoucherManagerRead("PLATFORM_ADMIN_ROLE", []);
  const { data: staffRole } = useVoucherManagerRead("BRANCH_STAFF_ROLE", []);
  
  return {
    contractAdminRole: adminRole as `0x${string}` | undefined,
    contractStaffRole: staffRole as `0x${string}` | undefined,
  };
}

export function useRoles(): RolesState {
  const { address, isConnected } = useAccount();

  const enabled = isConnected && !!address;

  const { data: contractAdminRole, isFetched: isFetchedAdminRole } = useVoucherManagerRead(
    "PLATFORM_ADMIN_ROLE",
    [],
    true
  );
  
  const { data: contractStaffRole, isFetched: isFetchedStaffRole } = useVoucherManagerRead(
    "BRANCH_STAFF_ROLE",
    [],
    true
  );

  const adminRoleToUse = (contractAdminRole as `0x${string}`) || PLATFORM_ADMIN_ROLE;
  const staffRoleToUse = (contractStaffRole as `0x${string}`) || BRANCH_STAFF_ROLE;

  const rolesReady = isFetchedAdminRole && isFetchedStaffRole;

  // Check admin role on VoucherManager (admin always has role here from deploy)
  const { data: isAdminOnVoucher, isLoading: isLoadingAdminV, isFetched: isFetchedAdminV, isError: isErrorAdminV } = useVoucherManagerRead(
    "hasRole",
    [adminRoleToUse, address],
    enabled && rolesReady
  );

  // Check admin role on GasSwapPlatform too
  const { data: isAdminOnPlatform, isLoading: isLoadingAdminP, isFetched: isFetchedAdminP, isError: isErrorAdminP } = useGasSwapPlatformRead(
    "hasRole",
    [adminRoleToUse, address],
    enabled && rolesReady
  );

  // Check staff role on VoucherManager (existing staff have role here)
  const { data: isStaffOnVoucher, isLoading: isLoadingStaffV, isFetched: isFetchedStaffV, isError: isErrorStaffV } = useVoucherManagerRead(
    "hasRole",
    [staffRoleToUse, address],
    enabled && rolesReady
  );

  // Check staff role on GasSwapPlatform (new staff get role here via add-branch form)
  const { data: isStaffOnPlatform, isLoading: isLoadingStaffP, isFetched: isFetchedStaffP, isError: isErrorStaffP } = useGasSwapPlatformRead(
    "hasRole",
    [staffRoleToUse, address],
    enabled && rolesReady
  );

  // Check staff role on CompanyManager (assignBranchStaff always grants role here)
  const { data: isStaffOnCompany, isLoading: isLoadingStaffC, isFetched: isFetchedStaffC, isError: isErrorStaffC } = useCompanyManagerRead(
    "hasRole",
    [staffRoleToUse, address],
    enabled && rolesReady
  );

  const hasError = isErrorAdminV || isErrorAdminP || isErrorStaffV || isErrorStaffP || isErrorStaffC;

  const isLoading = !rolesReady
    || isLoadingAdminV || isLoadingAdminP || isLoadingStaffV || isLoadingStaffP || isLoadingStaffC
    || (enabled && (!isFetchedAdminV || !isFetchedAdminP || !isFetchedStaffV || !isFetchedStaffP || !isFetchedStaffC));

  return useMemo(
    () => {
      if (hasError) {
        return {
          isPlatformAdmin: false,
          isBranchStaff: false,
          isLoading: false,
          hasAnyRole: false,
          hasError: true,
        };
      }

      const isPlatformAdmin = Boolean(isAdminOnVoucher) || Boolean(isAdminOnPlatform);
      const isBranchStaff = Boolean(isStaffOnVoucher) || Boolean(isStaffOnPlatform) || Boolean(isStaffOnCompany);
      return {
        isPlatformAdmin,
        isBranchStaff,
        isLoading,
        hasAnyRole: isPlatformAdmin || isBranchStaff,
        hasError: false,
      };
    },
    [isAdminOnVoucher, isAdminOnPlatform, isStaffOnVoucher, isStaffOnPlatform, isStaffOnCompany, isLoading, hasError]
  );
}

export function useHasRole(role: `0x${string}`): { hasRole: boolean; isLoading: boolean } {
  const { address, isConnected } = useAccount();

  const enabled = isConnected && !!address;

  const { data: hasRoleV, isLoading: isLoadingV, isFetched: isFetchedV } = useVoucherManagerRead(
    "hasRole",
    [role, address],
    enabled
  );

  const { data: hasRoleP, isLoading: isLoadingP, isFetched: isFetchedP } = useGasSwapPlatformRead(
    "hasRole",
    [role, address],
    enabled
  );

  const isLoading = isLoadingV || isLoadingP || (enabled && (!isFetchedV || !isFetchedP));

  return {
    hasRole: Boolean(hasRoleV) || Boolean(hasRoleP),
    isLoading,
  };
}

export function useRequireRole(role: "admin" | "staff" | "admin-only" | "staff-only") {
  const roles = useRoles();

  if (roles.isLoading) {
    return { isAuthorized: false, isLoading: true, hasError: false };
  }

  if (roles.hasError) {
    return { isAuthorized: false, isLoading: false, hasError: true };
  }

  // Strict role checks - each role accesses only their dashboard
  if (role === "admin" || role === "admin-only") {
    // Only platform admin can access admin pages
    return { isAuthorized: roles.isPlatformAdmin, isLoading: false, hasError: false };
  }

  if (role === "staff-only") {
    // ONLY staff role (not admin) - strict separation
    return { isAuthorized: roles.isBranchStaff && !roles.isPlatformAdmin, isLoading: false, hasError: false };
  }

  if (role === "staff") {
    // Staff role OR admin (for backwards compatibility)
    return { isAuthorized: roles.isBranchStaff || roles.isPlatformAdmin, isLoading: false, hasError: false };
  }

  return { isAuthorized: false, isLoading: false, hasError: false };
}

// Get the primary role for navigation purposes
export function usePrimaryRole(): { primaryRole: "admin" | "staff" | "customer" | null; isLoading: boolean; hasError: boolean } {
  const { address, isConnected } = useAccount();
  const roles = useRoles();

  if (roles.isLoading) {
    return { primaryRole: null, isLoading: true, hasError: false };
  }

  // Treat contract errors as loading — don't default to "customer"
  if (roles.hasError) {
    return { primaryRole: null, isLoading: false, hasError: true };
  }

  // If wallet is not connected, no role can be determined yet
  if (!isConnected || !address) {
    return { primaryRole: null, isLoading: false, hasError: false };
  }

  // Priority: Admin > Staff > Customer
  if (roles.isPlatformAdmin) {
    return { primaryRole: "admin", isLoading: false, hasError: false };
  }

  if (roles.isBranchStaff) {
    return { primaryRole: "staff", isLoading: false, hasError: false };
  }

  return { primaryRole: "customer", isLoading: false, hasError: false };
}
