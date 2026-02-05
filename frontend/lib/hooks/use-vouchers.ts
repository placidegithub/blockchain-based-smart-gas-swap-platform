import { useVoucherManagerRead, useGasSwapPlatformRead } from "./use-contracts";

export interface Voucher {
  id: bigint;
  depositedCylinderId: bigint;
  companyId: bigint;
  cylinderTypeId: bigint;
  sourceBranchId: bigint;
  customer: `0x${string}`;
  createdAt: bigint;
  expiresAt: bigint;
  status: number;
  redeemedCylinderId: bigint;
  redemptionBranchId: bigint;
  redeemedAt: bigint;
  redeemedBy: `0x${string}`;
}

export enum VoucherStatus {
  ACTIVE = 0,
  REDEEMED = 1,
  EXPIRED = 2,
  CANCELLED = 3,
}

export interface VoucherVerification {
  isValid: boolean;
  companyId: bigint;
  cylinderTypeId: bigint;
  daysRemaining: bigint;
  status: string;
}

export function useCustomerVouchers(customerAddress: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useVoucherManagerRead(
    "getCustomerVouchers",
    [customerAddress],
    !!customerAddress
  );

  return {
    voucherIds: (data as bigint[] | undefined) ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useVoucher(voucherId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useVoucherManagerRead(
    "getVoucher",
    [voucherId],
    voucherId !== undefined
  );

  return {
    voucher: data as Voucher | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useVoucherValidity(voucherId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useVoucherManagerRead(
    "isVoucherValid",
    [voucherId],
    voucherId !== undefined
  );

  return {
    isValid: Boolean(data),
    isLoading,
    error,
    refetch,
  };
}

export function useVerifyVoucher(voucherId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useGasSwapPlatformRead(
    "verifyVoucher",
    [voucherId],
    voucherId !== undefined
  );

  const verification = data as
    | [boolean, bigint, bigint, bigint, string]
    | undefined;

  return {
    verification: verification
      ? {
          isValid: verification[0],
          companyId: verification[1],
          cylinderTypeId: verification[2],
          daysRemaining: verification[3],
          status: verification[4],
        }
      : undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useActiveVouchers(customerAddress: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useGasSwapPlatformRead(
    "getCustomerActiveVouchers",
    [customerAddress],
    !!customerAddress
  );

  return {
    activeVoucherIds: (data as bigint[] | undefined) ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function getVoucherStatusLabel(status: VoucherStatus): string {
  switch (status) {
    case VoucherStatus.ACTIVE:
      return "Active";
    case VoucherStatus.REDEEMED:
      return "Redeemed";
    case VoucherStatus.EXPIRED:
      return "Expired";
    case VoucherStatus.CANCELLED:
      return "Cancelled";
    default:
      return "Unknown";
  }
}

export function isVoucherActive(voucher: Voucher): boolean {
  return voucher.status === VoucherStatus.ACTIVE;
}

export function isVoucherRedeemable(voucher: Voucher): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return voucher.status === VoucherStatus.ACTIVE && voucher.expiresAt > now;
}
