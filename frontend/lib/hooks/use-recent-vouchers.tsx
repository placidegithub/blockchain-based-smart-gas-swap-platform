import { useEffect, useState, useCallback } from "react";
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
  status: "pending" | "completed" | "failed";
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

function mapVoucherStatus(status: number): "pending" | "completed" | "failed" {
  switch (status) {
    case VoucherStatus.ACTIVE:
      return "pending";
    case VoucherStatus.REDEEMED:
      return "completed";
    case VoucherStatus.EXPIRED:
    case VoucherStatus.CANCELLED:
      return "failed";
    default:
      return "pending";
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

  useEffect(() => {
    if (voucher && !isLoading) {
      const isRedeemed = voucher.status === VoucherStatus.REDEEMED;
      
      // Get cylinder serial from blockchain data
      const cylinderSerial = cylinder?.serialNumber;
      
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
      
      const tx: RecentTransaction = {
        voucherId: voucher.id,
        type: isRedeemed ? "redemption" : "deposit",
        customerAddress: voucher.customer,
        customerName: customerInfo?.name,
        customerEmail: customerInfo?.email,
        customerPhone: customerInfo?.phoneNumber,
        cylinderType: cylinderType?.sizeName ?? `Type ${voucher.cylinderTypeId}`,
        cylinderSerial,
        cylinderCondition,
        companyName: company?.name,
        branchName: branch?.name,
        timestamp: isRedeemed
          ? Number(voucher.redeemedAt)
          : Number(voucher.createdAt),
        status: mapVoucherStatus(voucher.status),
      };
      onTransaction(tx);
    }
  }, [voucher, cylinderType, customerInfo, company, branch, cylinder, isLoading, onTransaction]);

  return null;
}

export function useRecentVouchers(limit: number = 10) {
  const { total, isLoading: isLoadingTotal } = useTotalVouchers();
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [voucherIds, setVoucherIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const startIndex =
    total !== undefined && total > BigInt(limit)
      ? total - BigInt(limit)
      : 0n;
  const count = total !== undefined ? Math.min(Number(total), limit) : 0;

  const indices = Array.from({ length: count }, (_, i) =>
    startIndex + BigInt(i)
  );

  const index0 = indices[0];
  const index1 = indices[1];
  const index2 = indices[2];
  const index3 = indices[3];
  const index4 = indices[4];
  const index5 = indices[5];
  const index6 = indices[6];
  const index7 = indices[7];
  const index8 = indices[8];
  const index9 = indices[9];

  const { voucherId: vid0 } = useVoucherByIndex(index0);
  const { voucherId: vid1 } = useVoucherByIndex(index1);
  const { voucherId: vid2 } = useVoucherByIndex(index2);
  const { voucherId: vid3 } = useVoucherByIndex(index3);
  const { voucherId: vid4 } = useVoucherByIndex(index4);
  const { voucherId: vid5 } = useVoucherByIndex(index5);
  const { voucherId: vid6 } = useVoucherByIndex(index6);
  const { voucherId: vid7 } = useVoucherByIndex(index7);
  const { voucherId: vid8 } = useVoucherByIndex(index8);
  const { voucherId: vid9 } = useVoucherByIndex(index9);

  useEffect(() => {
    const ids = [vid0, vid1, vid2, vid3, vid4, vid5, vid6, vid7, vid8, vid9]
      .filter((id): id is bigint => id !== undefined)
      .reverse();
    setVoucherIds(ids);
    if (!isLoadingTotal && total !== undefined) {
      setIsLoading(false);
    }
  }, [vid0, vid1, vid2, vid3, vid4, vid5, vid6, vid7, vid8, vid9, isLoadingTotal, total]);

  const handleTransaction = (tx: RecentTransaction) => {
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
      return updated.slice(0, limit);
    });
  };

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
