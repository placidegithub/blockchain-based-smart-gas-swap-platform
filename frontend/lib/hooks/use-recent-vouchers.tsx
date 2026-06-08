import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useVoucherManagerRead } from "./use-contracts";
import { Voucher, VoucherStatus } from "./use-vouchers";
import { useCylinderType, useCylinder } from "./use-cylinders";
import { useCompany, useBranch } from "./use-companies";

const RECENT_VOUCHERS_KEY = "gasswap_recent_vouchers";
const LOCAL_REDEMPTIONS_KEY = "gasswap_local_redemption_transactions";
const LOCAL_REDEMPTIONS_UPDATED_EVENT = "gasswap_local_redemptions_updated";
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
  companyId?: bigint;
  companyName?: string;
  branchName?: string;
  sourceBranchId?: bigint;
  sourceBranchName?: string;
  redemptionBranchId?: bigint;
  redemptionBranchName?: string;
  depositedAt?: number;
  redeemedAt?: number;
  timestamp: number;
  status: "active" | "redeemed" | "expired";
  txHash?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phoneNumber: string;
}

export interface LocalRedemptionTransactionInput {
  voucherId: bigint | string;
  customerAddress?: `0x${string}`;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  cylinderType?: string;
  cylinderSerial?: string;
  cylinderCondition?: "empty" | "full";
  companyId?: bigint | string;
  companyName?: string;
  sourceBranchId?: bigint | string;
  sourceBranchName?: string;
  redemptionBranchId: bigint | string;
  redemptionBranchName?: string;
  depositedAt?: number;
  redeemedAt?: number;
  txHash?: string;
}

function normalizeName(value?: string): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function toBigIntOrUndefined(value?: bigint | string): bigint | undefined {
  if (value === undefined || value === "") return undefined;
  try {
    return typeof value === "bigint" ? value : BigInt(value);
  } catch {
    return undefined;
  }
}

function getLocalRedemptionTransactions(limit = MAX_RECENT_VOUCHERS): RecentTransaction[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(LOCAL_REDEMPTIONS_KEY);
    const rows = stored ? JSON.parse(stored) as LocalRedemptionTransactionInput[] : [];

    const transactions: RecentTransaction[] = [];

    for (const row of rows) {
      const voucherId = toBigIntOrUndefined(row.voucherId);
      const redemptionBranchId = toBigIntOrUndefined(row.redemptionBranchId);
      if (!voucherId || !redemptionBranchId) continue;

      const redeemedAt = row.redeemedAt ?? Math.floor(Date.now() / 1000);
      transactions.push({
        voucherId,
        type: "redemption" as const,
        customerAddress: row.customerAddress ?? "0x0000000000000000000000000000000000000000",
        customerName: row.customerName,
        customerEmail: row.customerEmail,
        customerPhone: row.customerPhone,
        cylinderType: row.cylinderType ?? "Cylinder",
        cylinderSerial: row.cylinderSerial,
        cylinderCondition: row.cylinderCondition,
        companyId: toBigIntOrUndefined(row.companyId),
        companyName: row.companyName,
        branchName: row.redemptionBranchName,
        sourceBranchId: toBigIntOrUndefined(row.sourceBranchId),
        sourceBranchName: row.sourceBranchName,
        redemptionBranchId,
        redemptionBranchName: row.redemptionBranchName,
        depositedAt: row.depositedAt,
        redeemedAt,
        timestamp: redeemedAt,
        status: "redeemed" as const,
        txHash: row.txHash,
      });
    }

    return transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  } catch (error) {
    console.error("Failed to read local redemption transactions:", error);
    return [];
  }
}

export function saveLocalRedemptionTransaction(input: LocalRedemptionTransactionInput): void {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(LOCAL_REDEMPTIONS_KEY);
    const rows = stored ? JSON.parse(stored) as LocalRedemptionTransactionInput[] : [];
    const voucherId = input.voucherId.toString();

    const nextRow: LocalRedemptionTransactionInput = {
      ...input,
      voucherId,
      companyId: input.companyId?.toString(),
      sourceBranchId: input.sourceBranchId?.toString(),
      redemptionBranchId: input.redemptionBranchId.toString(),
      redeemedAt: input.redeemedAt ?? Math.floor(Date.now() / 1000),
    };

    const withoutDuplicate = rows.filter((row) => row.voucherId.toString() !== voucherId);
    localStorage.setItem(
      LOCAL_REDEMPTIONS_KEY,
      JSON.stringify([nextRow, ...withoutDuplicate].slice(0, MAX_RECENT_VOUCHERS))
    );
    window.dispatchEvent(new CustomEvent(LOCAL_REDEMPTIONS_UPDATED_EVENT));
  } catch (error) {
    console.error("Failed to save local redemption transaction:", error);
  }
}

function useLocalRedemptionTransactions(limit: number) {
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);

  const refresh = useCallback(() => {
    setTransactions(getLocalRedemptionTransactions(limit));
  }, [limit]);

  useEffect(() => {
    refresh();
    window.addEventListener(LOCAL_REDEMPTIONS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(LOCAL_REDEMPTIONS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return transactions;
}

function mergeTransactionRecords(
  preferred: RecentTransaction,
  fallback?: RecentTransaction
): RecentTransaction {
  if (!fallback) return preferred;

  return {
    ...fallback,
    ...preferred,
    customerAddress: preferred.customerAddress || fallback.customerAddress,
    customerName: preferred.customerName ?? fallback.customerName,
    customerEmail: preferred.customerEmail ?? fallback.customerEmail,
    customerPhone: preferred.customerPhone ?? fallback.customerPhone,
    cylinderType: preferred.cylinderType || fallback.cylinderType,
    cylinderSerial: preferred.cylinderSerial ?? fallback.cylinderSerial,
    cylinderCondition: preferred.cylinderCondition ?? fallback.cylinderCondition,
    companyId: preferred.companyId ?? fallback.companyId,
    companyName: preferred.companyName ?? fallback.companyName,
    branchName: preferred.branchName ?? fallback.branchName,
    sourceBranchId: preferred.sourceBranchId ?? fallback.sourceBranchId,
    sourceBranchName: preferred.sourceBranchName ?? fallback.sourceBranchName,
    redemptionBranchId: preferred.redemptionBranchId ?? fallback.redemptionBranchId,
    redemptionBranchName: preferred.redemptionBranchName ?? fallback.redemptionBranchName,
    depositedAt: preferred.depositedAt ?? fallback.depositedAt,
    redeemedAt: preferred.redeemedAt ?? fallback.redeemedAt,
    timestamp: preferred.timestamp || fallback.timestamp,
    status: preferred.status,
    txHash: preferred.txHash ?? fallback.txHash,
  };
}

export function transactionMatchesCompanyScope(
  tx: Pick<RecentTransaction, "companyId" | "companyName">,
  companyId?: bigint | string,
  companyName?: string
): boolean {
  if (!companyId && !companyName) return true;

  const expectedCompanyId = companyId?.toString();
  if (expectedCompanyId && tx.companyId?.toString() === expectedCompanyId) {
    return true;
  }

  const expectedCompanyName = normalizeName(companyName);
  return Boolean(
    expectedCompanyName &&
    normalizeName(tx.companyName) === expectedCompanyName
  );
}

export function transactionMatchesBranchScope(
  tx: Pick<
    RecentTransaction,
    | "type"
    | "branchName"
    | "sourceBranchId"
    | "sourceBranchName"
    | "redemptionBranchId"
    | "redemptionBranchName"
  >,
  branchId?: bigint | string,
  branchName?: string
): boolean {
  if (!branchId && !branchName) return true;

  const expectedBranchId = branchId?.toString();
  const expectedBranchName = normalizeName(branchName);

  if (tx.type === "deposit") {
    return Boolean(
      (expectedBranchId && tx.sourceBranchId?.toString() === expectedBranchId) ||
      (expectedBranchName && normalizeName(tx.sourceBranchName) === expectedBranchName) ||
      (expectedBranchName && normalizeName(tx.branchName) === expectedBranchName)
    );
  }

  return Boolean(
    (expectedBranchId && tx.redemptionBranchId?.toString() === expectedBranchId) ||
    (expectedBranchName && normalizeName(tx.redemptionBranchName) === expectedBranchName) ||
    (expectedBranchName && normalizeName(tx.branchName) === expectedBranchName)
  );
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

export function useCompanyBalance(companyId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useVoucherManagerRead(
    "getCompanyBalance",
    [companyId],
    companyId !== undefined && companyId > 0n
  );

  const balance = data as [bigint, bigint, bigint] | undefined;

  return {
    totalDeposits: balance?.[0] ?? 0n,
    totalRedemptions: balance?.[1] ?? 0n,
    netBalance: balance?.[2] ?? 0n,
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

function readCylinderCondition(
  voucherId: bigint,
  cylinderSerial?: string
): "empty" | "full" | undefined {
  if (typeof window === "undefined") return undefined;

  const storageKeys = [`voucher_meta_${voucherId.toString()}`];
  if (cylinderSerial) {
    storageKeys.push(`voucher_serial_${cylinderSerial}`);
  }

  for (const key of storageKeys) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      const metadata = JSON.parse(stored) as { cylinderCondition?: unknown };
      if (metadata.cylinderCondition === "empty" || metadata.cylinderCondition === "full") {
        return metadata.cylinderCondition;
      }
    } catch {
      // Ignore malformed local metadata and continue with the next key.
    }
  }

  return undefined;
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
  const { branch: sourceBranch } = useBranch(voucher?.sourceBranchId);
  const { branch: redemptionBranch } = useBranch(
    voucher?.redemptionBranchId && voucher.redemptionBranchId > 0n
      ? voucher.redemptionBranchId
      : undefined
  );
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
  const sourceBranchId = voucher?.sourceBranchId;
  const sourceBranchName = sourceBranch?.name;
  const redemptionBranchId = voucher?.redemptionBranchId;
  const redemptionBranchName = redemptionBranch?.name;
  const cylinderSerial = cylinder?.serialNumber;
  const cylinderCondition = voucher ? readCylinderCondition(voucher.id, cylinderSerial) : undefined;

  useEffect(() => {
    if (voucher && !isLoading) {
      const isRedeemed = voucherStatus === VoucherStatus.REDEEMED;

      // Build a fingerprint to avoid emitting the same data repeatedly
      const fingerprint = `${voucherId}-${voucherStatus}-${cylinderTypeName}-${customerName}-${companyName}-${sourceBranchName}-${redemptionBranchName}-${cylinderSerial}-${cylinderCondition}`;
      if (fingerprint === lastEmittedRef.current) return;
      lastEmittedRef.current = fingerprint;

      const depositedAt = Number(voucherCreatedAt);
      const redeemedAt = Number(voucherRedeemedAt);
      const baseTx = {
        voucherId: voucher.id,
        customerAddress: voucherCustomer!,
        customerName,
        customerEmail,
        customerPhone,
        cylinderType: cylinderTypeName ?? `Type ${voucher.cylinderTypeId}`,
        cylinderSerial,
        cylinderCondition,
        companyId: voucher.companyId,
        companyName,
        status: mapVoucherStatus(voucherStatus!),
      };

      onTransactionRef.current({
        ...baseTx,
        type: "deposit",
        branchName: sourceBranchName,
        sourceBranchId,
        sourceBranchName,
        redemptionBranchId: redemptionBranchId && redemptionBranchId > 0n ? redemptionBranchId : undefined,
        redemptionBranchName,
        depositedAt,
        redeemedAt: redeemedAt > 0 ? redeemedAt : undefined,
        timestamp: depositedAt,
      });

      if (isRedeemed) {
        onTransactionRef.current({
          ...baseTx,
          type: "redemption",
          branchName: redemptionBranchName,
          sourceBranchId,
          sourceBranchName,
          redemptionBranchId,
          redemptionBranchName,
          depositedAt,
          redeemedAt,
          timestamp: redeemedAt,
        });
      }
    }
  }, [voucher, isLoading, voucherId, voucherStatus, voucherCustomer, voucherCreatedAt, voucherRedeemedAt, cylinderTypeName, customerName, customerEmail, customerPhone, companyName, sourceBranchId, sourceBranchName, redemptionBranchId, redemptionBranchName, cylinderSerial, cylinderCondition]);

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
  const [isLoading, setIsLoading] = useState(true);
  const localRedemptions = useLocalRedemptionTransactions(effectiveLimit);

  const startIndex =
    total !== undefined && total > BigInt(effectiveLimit)
      ? total - BigInt(effectiveLimit) + 1n
      : 1n;
  const count = total !== undefined ? Math.min(Number(total), effectiveLimit) : 0;

  const voucherIds: bigint[] = Array.from({ length: count }, (_, i) =>
    startIndex + BigInt(i)
  ).reverse();

  useEffect(() => {
    if (!isLoadingTotal && total !== undefined) {
      setIsLoading(false);
    }
  }, [isLoadingTotal, total]);

  const handleTransaction = useCallback((tx: RecentTransaction) => {
    setTransactions((prev) => {
      const exists = prev.some(
        (t) =>
          t.voucherId.toString() === tx.voucherId.toString() &&
          t.type === tx.type
      );
      if (exists) {
        return prev.map((t) =>
          t.voucherId.toString() === tx.voucherId.toString() && t.type === tx.type
            ? tx
            : t
        );
      }
      const updated = [...prev, tx].sort(
        (a, b) => b.timestamp - a.timestamp
      );
      return updated.slice(0, effectiveLimit);
    });
  }, [effectiveLimit]);

  const mergedTransactions = useMemo(() => {
    const byKey = new Map<string, RecentTransaction>();

    for (const tx of localRedemptions) {
      byKey.set(`${tx.voucherId.toString()}-${tx.type}`, tx);
    }

    for (const tx of transactions) {
      const key = `${tx.voucherId.toString()}-${tx.type}`;
      const existing = byKey.get(key);
      byKey.set(key, mergeTransactionRecords(tx, existing));
    }

    return Array.from(byKey.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, effectiveLimit);
  }, [transactions, localRedemptions, effectiveLimit]);

  return {
    transactions: mergedTransactions,
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
