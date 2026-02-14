const FUND_STORAGE_KEY = "gasswap_collected_funds";

export type PaymentMethod = "cash" | "mobile_money";

export interface PaymentRecord {
  id: string;
  voucherId: string;
  amount: number;
  method: PaymentMethod;
  timestamp: number;
  customerPhone?: string;
  transactionRef?: string;
  branchId?: string;
  companyId?: string;
  managerAddress?: string;
}

export interface FundSummary {
  totalAmount: number;
  cashAmount: number;
  mobileMoneyAmount: number;
  transactionCount: number;
  cashCount: number;
  mobileMoneyCount: number;
}

function buildStorageKey(walletAddress?: string, branchId?: string): string {
  if (branchId) {
    return `${FUND_STORAGE_KEY}_branch_${branchId}`;
  }
  if (walletAddress) {
    return `${FUND_STORAGE_KEY}_${walletAddress.toLowerCase()}`;
  }
  return FUND_STORAGE_KEY;
}

function getPayments(walletAddress?: string, branchId?: string): PaymentRecord[] {
  if (typeof window === "undefined") return [];
  
  try {
    const key = buildStorageKey(walletAddress, branchId);
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to get payments:", e);
    return [];
  }
}

function savePayments(payments: PaymentRecord[], walletAddress?: string, branchId?: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = buildStorageKey(walletAddress, branchId);
    localStorage.setItem(key, JSON.stringify(payments));
  } catch (e) {
    console.error("Failed to save payments:", e);
  }
}

export function isVoucherAlreadyPaid(voucherId: string, walletAddress?: string): boolean {
  const payments = getPayments(walletAddress);
  return payments.some(p => p.voucherId === voucherId);
}

export function getPaymentByVoucherId(voucherId: string, walletAddress?: string): PaymentRecord | null {
  const payments = getPayments(walletAddress);
  return payments.find(p => p.voucherId === voucherId) || null;
}

export function removePaymentRecord(voucherId: string): boolean {
  if (typeof window === "undefined") return false;
  
  let removed = false;
  
  try {
    // Scan ALL localStorage keys that match fund storage pattern
    // This covers both global and all wallet-specific stores
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(FUND_STORAGE_KEY)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          const payments: PaymentRecord[] = JSON.parse(stored);
          const filtered = payments.filter(p => p.voucherId !== voucherId);
          if (filtered.length !== payments.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
            removed = true;
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to remove payment record:", e);
  }
  
  return removed;
}

export function addPaymentRecord(record: Omit<PaymentRecord, "id" | "timestamp">, walletAddress?: string): PaymentRecord | null {
  // Use branchId-scoped storage if branchId is provided
  const branchId = record.branchId;
  const payments = getPayments(walletAddress, branchId);
  
  // Prevent duplicate payments for the same voucher
  const existingPayment = payments.find(p => p.voucherId === record.voucherId);
  if (existingPayment) {
    console.warn(`Payment already exists for voucher ${record.voucherId}, skipping duplicate`);
    return null;
  }
  
  const newRecord: PaymentRecord = {
    ...record,
    id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  
  payments.unshift(newRecord);
  savePayments(payments, walletAddress, branchId);
  
  // Dispatch custom event to notify components of payment update
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent('gasswap_payment_added', { detail: newRecord }));
  }
  
  return newRecord;
}

export function getRecentPayments(limit: number = 20, walletAddress?: string, branchId?: string): PaymentRecord[] {
  return getPayments(walletAddress, branchId).slice(0, limit);
}

export function getFundSummary(walletAddress?: string, branchId?: string): FundSummary {
  const payments = getPayments(walletAddress, branchId);
  
  let totalAmount = 0;
  let cashAmount = 0;
  let mobileMoneyAmount = 0;
  let cashCount = 0;
  let mobileMoneyCount = 0;
  
  for (const payment of payments) {
    totalAmount += payment.amount;
    if (payment.method === "cash") {
      cashAmount += payment.amount;
      cashCount++;
    } else {
      mobileMoneyAmount += payment.amount;
      mobileMoneyCount++;
    }
  }
  
  return {
    totalAmount,
    cashAmount,
    mobileMoneyAmount,
    transactionCount: payments.length,
    cashCount,
    mobileMoneyCount,
  };
}

export function getTodaysFundSummary(walletAddress?: string, branchId?: string): FundSummary {
  const payments = getPayments(walletAddress, branchId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  
  const todaysPayments = payments.filter(p => p.timestamp >= todayStart);
  
  let totalAmount = 0;
  let cashAmount = 0;
  let mobileMoneyAmount = 0;
  let cashCount = 0;
  let mobileMoneyCount = 0;
  
  for (const payment of todaysPayments) {
    totalAmount += payment.amount;
    if (payment.method === "cash") {
      cashAmount += payment.amount;
      cashCount++;
    } else {
      mobileMoneyAmount += payment.amount;
      mobileMoneyCount++;
    }
  }
  
  return {
    totalAmount,
    cashAmount,
    mobileMoneyAmount,
    transactionCount: todaysPayments.length,
    cashCount,
    mobileMoneyCount,
  };
}

export function formatRWF(amount: number): string {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function clearFundRecords(walletAddress?: string, branchId?: string): void {
  if (typeof window === "undefined") return;
  const key = buildStorageKey(walletAddress, branchId);
  localStorage.removeItem(key);
  
  // Also clear all voucher payment status entries
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('voucher_payment_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent('gasswap_payment_added', { detail: { cleared: true } }));
}

export function deduplicatePayments(walletAddress?: string, branchId?: string): number {
  if (typeof window === "undefined") return 0;
  
  const payments = getPayments(walletAddress, branchId);
  const seen = new Set<string>();
  const uniquePayments: PaymentRecord[] = [];
  
  for (const payment of payments) {
    if (!seen.has(payment.voucherId)) {
      seen.add(payment.voucherId);
      uniquePayments.push(payment);
    }
  }
  
  const removed = payments.length - uniquePayments.length;
  if (removed > 0) {
    savePayments(uniquePayments, walletAddress, branchId);
    window.dispatchEvent(new CustomEvent('gasswap_payment_added', { detail: { deduplicated: removed } }));
  }
  
  return removed;
}

// Remove payment records that don't belong to this branch
// This cleans up records that were incorrectly synced from other branches
export function cleanForeignBranchRecords(branchId: string): number {
  if (typeof window === "undefined" || !branchId) return 0;
  
  const payments = getPayments(undefined, branchId);
  const ownPayments = payments.filter(p => !p.branchId || p.branchId === branchId);
  
  const removed = payments.length - ownPayments.length;
  if (removed > 0) {
    savePayments(ownPayments, undefined, branchId);
    window.dispatchEvent(new CustomEvent('gasswap_payment_added', { detail: { cleaned: removed } }));
  }
  
  return removed;
}

// Sync payment records from voucher payment status to fund storage
// This fixes any inconsistencies between the two storage systems
export function syncPaymentRecordsFromVoucherStatus(walletAddress?: string, branchId?: string): number {
  if (typeof window === "undefined") return 0;
  
  let synced = 0;
  const payments = getPayments(walletAddress, branchId);
  const existingVoucherIds = new Set(payments.map(p => p.voucherId));
  
  // Scan localStorage for voucher payment statuses
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('voucher_payment_')) {
      try {
        const voucherId = key.replace('voucher_payment_', '');
        
        // Skip if already in fund storage
        if (existingVoucherIds.has(voucherId)) continue;
        
        const stored = localStorage.getItem(key);
        if (!stored) continue;
        
        const data = JSON.parse(stored);
        if (data.status === 'paid' && data.amount && data.amount > 0) {
        // When branchId is provided, only sync records that belong to this branch
        if (branchId && data.branchId && data.branchId !== branchId) continue;

          // Add to fund storage
          const method: PaymentMethod = data.method === 'cash' ? 'cash' : 'mobile_money';
          const newRecord: PaymentRecord = {
            id: `payment_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            voucherId,
            amount: data.amount,
            method,
            timestamp: data.paidAt ? new Date(data.paidAt).getTime() : Date.now(),
            transactionRef: data.transactionRef,
            branchId: data.branchId,
            companyId: data.companyId,
          };
          
          payments.unshift(newRecord);
          existingVoucherIds.add(voucherId);
          synced++;
        }
      } catch (e) {
        console.error('Failed to sync payment record:', e);
      }
    }
  }
  
  if (synced > 0) {
    savePayments(payments, walletAddress, branchId);
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('gasswap_payment_added', { detail: { synced } }));
    console.log(`Synced ${synced} payment records to fund storage`);
  }
  
  return synced;
}
