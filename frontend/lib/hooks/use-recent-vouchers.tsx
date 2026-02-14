import { useEffect, useState, useCallback, useRef } from "react";
import { useVoucherManagerRead } from "./use-contracts";
import { Voucher, VoucherStatus } from "./use-vouchers";
import { useCylinderType, useCylinder } from "./use-cylinders";
import { useCompany, useBranch } from "./use-companies";

const RECENT_VOUCHERS_KEY = "gasswap_recent_vouchers";
const MAX_RECENT_VOUCHERS = 50;

export interface StoredVoucherInfo {
  voucherId: string;
  customerPhone: string;
  createdAt: number;
}

export function saveRecentVoucher(voucherId: bigint, customerPhone: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const stored = localStorage.getItem(RECENT_VOUCHERS_KEY);
    const vouchers: StoredVoucherInfo[] = stored ? JSON.parse(stored) : [];
    
    const exists = vouchers.some(v => v.voucherId === voucherId.toString());
    if (!exists) {
      vouchers.unshift({
        voucherId: voucherId.toString(),
        customerPhone,
        createdAt: Date.now(),
      });
      
      if (vouchers.length > MAX_RECENT_VOUCHERS) {
        vouchers.pop();
      }
      
      localStorage.setItem(RECENT_VOUCHERS_KEY, JSON.stringify(vouchers));
    }
  } catch (e) {
    console.error("Failed to save recent voucher:", e);
  }
}

export function getRecentVoucherIds(limit: number = 10): StoredVoucherInfo[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(RECENT_VOUCHERS_KEY);
    if (!stored) return [];
    
    const vouchers: StoredVoucherInfo[] = JSON.parse(stored);
    return vouchers.slice(0, limit);
  } catch (e) {
    console.error("Failed to get recent vouchers:", e);
    return [];
  }
}

export function getVouchersByPhone(phoneNumber: string): StoredVoucherInfo[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(RECENT_VOUCHERS_KEY);
    if (!stored) return [];
    
    const vouchers: StoredVoucherInfo[] = JSON.parse(stored);
    const normalizedPhone = phoneNumber.replace(/\s/g, "").replace(/^\+?250/, "");
    
    return vouchers.filter(v => {
      const storedPhone = v.customerPhone.replace(/\s/g, "").replace(/^\+?250/, "");
      return storedPhone === normalizedPhone || storedPhone.endsWith(normalizedPhone) || normalizedPhone.endsWith(storedPhone);
    });
  } catch (e) {
    console.error("Failed to get vouchers by phone:", e);
    return [];
  }
}

export function useStoredRecentVouchers(limit: number = 10) {
  const [vouchers, setVouchers] = useState<StoredVoucherInfo[]>([]);
  
  useEffect(() => {
    setVouchers(getRecentVoucherIds(limit));
  }, [limit]);
  
  const refresh = useCallback(() => {
    setVouchers(getRecentVoucherIds(limit));
  }, [limit]);
  
  return { vouchers, refresh };
}

export interface RecentTransaction {
  voucherId: bigint;
  type: "deposit" | "redemption";
  customerAddress: `0x${string}`;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  cylinderType: string;
  cylinderSerial?: string;
  cylinderCondition?: "empty" | "full";
  companyName?: string;
  branchName?: string;
  timestamp: number;
  status: "active" | "redeemed" | "expired";
  txHash?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phoneNumber: string;
}

export function useTotalVouchers() {
  const { data, isLoading, error, refetch } = useVoucherManagerRead(
    "getTotalVouchers",
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

export function useVoucherByIndex(index: bigint | undefined) {
  const { data, isLoading, error, refetch } = useVoucherManagerRead(
    "tokenByIndex",
    [index],
    index !== undefined
  );

  return {
    voucherId: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useVoucherDetails(voucherId: bigint | undefined) {
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

export function useVoucherCustomerInfo(voucherId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useVoucherManagerRead(
    "voucherCustomerInfo",
    [voucherId],
    voucherId !== undefined
  );

  const info = data as [string, string, string] | undefined;

  return {
    customerInfo: info ? {
      name: info[0],
      email: info[1],
      phoneNumber: info[2],
    } : undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useBranchStats(branchId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useVoucherManagerRead(
    "getBranchStats",
    [branchId],
    branchId !== undefined && branchId > 0n
  );

  const stats = data as [bigint, bigint] | undefined;

  return {
    deposits: stats?.[0] ?? 0n,
    redemptions: stats?.[1] ?? 0n,
    isLoading,
    error,
    refetch,
  };
}

function mapVoucherStatus(status: number): "active" | "redeemed" | "expired" {
  switch (status) {
    case VoucherStatus.ACTIVE:
      return "active";
    case VoucherStatus.REDEEMED:
      return "redeemed";
    case VoucherStatus.EXPIRED:
    case VoucherStatus.CANCELLED:
      return "expired";
    default:
      return "active";
  }
}

function VoucherTransactionMapper({
  voucherId,
  onTransaction,
}: {
  voucherId: bigint;
  onTransaction: (tx: RecentTransaction) => void;
}) {
  const { voucher, isLoading } = useVoucherDetails(voucherId);
  const { cylinderType } = useCylinderType(voucher?.cylinderTypeId);
  const { customerInfo } = useVoucherCustomerInfo(voucherId);
  const { company } = useCompany(voucher?.companyId);
  const { branch } = useBranch(voucher?.sourceBranchId);
  const { cylinder } = useCylinder(voucher?.depositedCylinderId);
  const onTransactionRef = useRef(onTransaction);
  onTransactionRef.current = onTransaction;
  const lastEmittedRef = useRef<string>("");

  // Use stable primitive values as dependencies instead of object references
  const voucherStatus = voucher?.status;
  const voucherCustomer = voucher?.customer;
  const voucherCreatedAt = voucher?.createdAt?.toString();
  const voucherRedeemedAt = voucher?.redeemedAt?.toString();
  const cylinderTypeName = cylinderType?.sizeName;
  const customerName = customerInfo?.name;
  const customerEmail = customerInfo?.email;
  const customerPhone = customerInfo?.phoneNumber;
  const companyName = company?.name;
  const branchName = branch?.name;
  const cylinderSerial = cylinder?.serialNumber;

  useEffect(() => {
    if (voucher && !isLoading) {
      const isRedeemed = voucherStatus === VoucherStatus.REDEEMED;
      
      // Try to get condition from localStorage (using cylinder serial as key)
      let cylinderCondition: "empty" | "full" | undefined;
      if (cylinderSerial && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem(`voucher_serial_${cylinderSerial}`);
          if (stored) {
            const metadata = JSON.parse(stored);
            cylinderCondition = metadata.cylinderCondition;
          }
        } catch (e) {
          // Ignore localStorage errors
        }
      }
      
      // Build a fingerprint to avoid emitting the same data repeatedly
      const fingerprint = `${voucherId}-${voucherStatus}-${cylinderTypeName}-${customerName}-${companyName}-${branchName}-${cylinderSerial}`;
      if (fingerprint === lastEmittedRef.current) return;
      lastEmittedRef.current = fingerprint;

      const tx: RecentTransaction = {
        voucherId: voucher.id,
        type: isRedeemed ? "redemption" : "deposit",
        customerAddress: voucherCustomer!,
        customerName,
        customerEmail,
        customerPhone,
        cylinderType: cylinderTypeName ?? `Type ${voucher.cylinderTypeId}`,
        cylinderSerial,
        cylinderCondition,
        companyName,
        branchName,
        timestamp: isRedeemed
          ? Number(voucherRedeemedAt)
          : Number(voucherCreatedAt),
        status: mapVoucherStatus(voucherStatus!),
      };
      onTransactionRef.current(tx);
    }
  }, [voucher, isLoading, voucherId, voucherStatus, voucherCustomer, voucherCreatedAt, voucherRedeemedAt, cylinderTypeName, customerName, customerEmail, customerPhone, companyName, branchName, cylinderSerial]);

  return null;
}

// Helper hook to fetch voucher IDs for a specific set of indices
function useVoucherIdBatch(indices: (bigint | undefined)[]): (bigint | undefined)[] {
  const { voucherId: vid0 } = useVoucherByIndex(indices[0]);
  const { voucherId: vid1 } = useVoucherByIndex(indices[1]);
  const { voucherId: vid2 } = useVoucherByIndex(indices[2]);
  const { voucherId: vid3 } = useVoucherByIndex(indices[3]);
  const { voucherId: vid4 } = useVoucherByIndex(indices[4]);
  const { voucherId: vid5 } = useVoucherByIndex(indices[5]);
  const { voucherId: vid6 } = useVoucherByIndex(indices[6]);
  const { voucherId: vid7 } = useVoucherByIndex(indices[7]);
  const { voucherId: vid8 } = useVoucherByIndex(indices[8]);
  const { voucherId: vid9 } = useVoucherByIndex(indices[9]);
  
  return [vid0, vid1, vid2, vid3, vid4, vid5, vid6, vid7, vid8, vid9];
}

export function useRecentVouchers(limit: number = 10) {
  // Cap the limit to a reasonable maximum (50) for performance
  const effectiveLimit = Math.min(limit, 50);
  
  const { total, isLoading: isLoadingTotal } = useTotalVouchers();
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [voucherIds, setVoucherIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const startIndex =
    total !== undefined && total > BigInt(effectiveLimit)
      ? total - BigInt(effectiveLimit)
      : 0n;
  const count = total !== undefined ? Math.min(Number(total), effectiveLimit) : 0;

  const allIndices: (bigint | undefined)[] = Array.from({ length: count }, (_, i) =>
    startIndex + BigInt(i)
  );

  // Pad indices to fit into 5 batches of 10 (50 max)
  const paddedIndices: (bigint | undefined)[] = [...allIndices];
  while (paddedIndices.length < 50) {
    paddedIndices.push(undefined);
  }

  // Fetch in 5 batches of 10
  const batch0 = useVoucherIdBatch(paddedIndices.slice(0, 10));
  const batch1 = useVoucherIdBatch(paddedIndices.slice(10, 20));
  const batch2 = useVoucherIdBatch(paddedIndices.slice(20, 30));
  const batch3 = useVoucherIdBatch(paddedIndices.slice(30, 40));
  const batch4 = useVoucherIdBatch(paddedIndices.slice(40, 50));

  // Combine all batch results
  const allBatchResults = [
    batch0[0], batch0[1], batch0[2], batch0[3], batch0[4],
    batch0[5], batch0[6], batch0[7], batch0[8], batch0[9],
    batch1[0], batch1[1], batch1[2], batch1[3], batch1[4],
    batch1[5], batch1[6], batch1[7], batch1[8], batch1[9],
    batch2[0], batch2[1], batch2[2], batch2[3], batch2[4],
    batch2[5], batch2[6], batch2[7], batch2[8], batch2[9],
    batch3[0], batch3[1], batch3[2], batch3[3], batch3[4],
    batch3[5], batch3[6], batch3[7], batch3[8], batch3[9],
    batch4[0], batch4[1], batch4[2], batch4[3], batch4[4],
    batch4[5], batch4[6], batch4[7], batch4[8], batch4[9],
  ];

  useEffect(() => {
    const ids = allBatchResults
      .filter((id): id is bigint => id !== undefined)
      .reverse();
    setVoucherIds(ids);
    if (!isLoadingTotal && total !== undefined) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    batch0[0], batch0[1], batch0[2], batch0[3], batch0[4],
    batch0[5], batch0[6], batch0[7], batch0[8], batch0[9],
    batch1[0], batch1[1], batch1[2], batch1[3], batch1[4],
    batch1[5], batch1[6], batch1[7], batch1[8], batch1[9],
    batch2[0], batch2[1], batch2[2], batch2[3], batch2[4],
    batch2[5], batch2[6], batch2[7], batch2[8], batch2[9],
    batch3[0], batch3[1], batch3[2], batch3[3], batch3[4],
    batch3[5], batch3[6], batch3[7], batch3[8], batch3[9],
    batch4[0], batch4[1], batch4[2], batch4[3], batch4[4],
    batch4[5], batch4[6], batch4[7], batch4[8], batch4[9],
    isLoadingTotal, total
  ]);

  const handleTransaction = useCallback((tx: RecentTransaction) => {
    setTransactions((prev) => {
      const exists = prev.some(
        (t) => t.voucherId.toString() === tx.voucherId.toString()
      );
      if (exists) {
        return prev.map((t) =>
          t.voucherId.toString() === tx.voucherId.toString() ? tx : t
        );
      }
      const updated = [...prev, tx].sort(
        (a, b) => b.timestamp - a.timestamp
      );
      return updated.slice(0, effectiveLimit);
    });
  }, [effectiveLimit]);

  return {
    transactions,
    voucherIds,
    isLoading: isLoading || isLoadingTotal,
    total: total ? Number(total) : 0,
    VoucherMappers: voucherIds.map((id) => (
      <VoucherTransactionMapper
        key={id.toString()}
        voucherId={id}
        onTransaction={handleTransaction}
      />
    )),
  };
}
