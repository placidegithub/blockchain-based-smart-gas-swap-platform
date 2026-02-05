import { useAccount } from "wagmi";
import { useMemo } from "react";
import { useVoucherManagerRead } from "./use-contracts";
import { keccak256, stringToHex } from "viem";

// Use stringToHex to properly encode strings to bytes (matches Solidity's keccak256("string"))
export const PLATFORM_ADMIN_ROLE = keccak256(stringToHex("PLATFORM_ADMIN_ROLE"));
export const BRANCH_STAFF_ROLE = keccak256(stringToHex("BRANCH_STAFF_ROLE"));

export interface RolesState {
  isPlatformAdmin: boolean;
  isBranchStaff: boolean;
  isLoading: boolean;
  hasAnyRole: boolean;
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

  // Read role constants from the contract to ensure they match
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

  // Use contract role values if available, otherwise fall back to computed values
  const adminRoleToUse = (contractAdminRole as `0x${string}`) || PLATFORM_ADMIN_ROLE;
  const staffRoleToUse = (contractStaffRole as `0x${string}`) || BRANCH_STAFF_ROLE;

  const rolesReady = isFetchedAdminRole && isFetchedStaffRole;

  const { data: isPlatformAdmin, isLoading: isLoadingAdmin, isFetched: isFetchedAdmin } = useVoucherManagerRead(
    "hasRole",
    [adminRoleToUse, address],
    enabled && rolesReady
  );

  const { data: isBranchStaff, isLoading: isLoadingStaff, isFetched: isFetchedStaff } = useVoucherManagerRead(
    "hasRole",
    [staffRoleToUse, address],
    enabled && rolesReady
  );

  // Consider loading if: roles not ready, queries are actively loading, or wallet is connected but data hasn't been fetched yet
  const isLoading = !rolesReady || isLoadingAdmin || isLoadingStaff || (enabled && (!isFetchedAdmin || !isFetchedStaff));

  return useMemo(
    () => ({
      isPlatformAdmin: Boolean(isPlatformAdmin),
      isBranchStaff: Boolean(isBranchStaff),
      isLoading,
      hasAnyRole: Boolean(isPlatformAdmin) || Boolean(isBranchStaff),
    }),
    [isPlatformAdmin, isBranchStaff, isLoading]
  );
}

export function useHasRole(role: `0x${string}`): { hasRole: boolean; isLoading: boolean } {
  const { address, isConnected } = useAccount();

  const enabled = isConnected && !!address;

  const { data: hasRole, isLoading: isQueryLoading, isFetched } = useVoucherManagerRead(
    "hasRole",
    [role, address],
    enabled
  );

  // Consider loading if: query is actively loading OR if wallet is connected but data hasn't been fetched yet
  const isLoading = isQueryLoading || (enabled && !isFetched);

  return {
    hasRole: Boolean(hasRole),
    isLoading,
  };
}

export function useRequireRole(role: "admin" | "staff" | "admin-only" | "staff-only") {
  const roles = useRoles();

  if (roles.isLoading) {
    return { isAuthorized: false, isLoading: true };
  }

  // Strict role checks - each role accesses only their dashboard
  if (role === "admin" || role === "admin-only") {
    // Only platform admin can access admin pages
    return { isAuthorized: roles.isPlatformAdmin, isLoading: false };
  }

  if (role === "staff-only") {
    // ONLY staff role (not admin) - strict separation
    return { isAuthorized: roles.isBranchStaff && !roles.isPlatformAdmin, isLoading: false };
  }

  if (role === "staff") {
    // Staff role OR admin (for backwards compatibility)
    return { isAuthorized: roles.isBranchStaff || roles.isPlatformAdmin, isLoading: false };
  }

  return { isAuthorized: false, isLoading: false };
}

// Get the primary role for navigation purposes
export function usePrimaryRole(): { primaryRole: "admin" | "staff" | "customer" | null; isLoading: boolean } {
  const { address, isConnected } = useAccount();
  const roles = useRoles();

  if (roles.isLoading) {
    return { primaryRole: null, isLoading: true };
  }

  // If wallet is not connected, no role can be determined yet
  if (!isConnected || !address) {
    return { primaryRole: null, isLoading: false };
  }

  // Priority: Admin > Staff > Customer
  if (roles.isPlatformAdmin) {
    return { primaryRole: "admin", isLoading: false };
  }

  if (roles.isBranchStaff) {
    return { primaryRole: "staff", isLoading: false };
  }

  return { primaryRole: "customer", isLoading: false };
}
