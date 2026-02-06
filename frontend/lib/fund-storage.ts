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
}

export interface FundSummary {
  totalAmount: number;
  cashAmount: number;
  mobileMoneyAmount: number;
  transactionCount: number;
  cashCount: number;
  mobileMoneyCount: number;
}

function getPayments(walletAddress?: string): PaymentRecord[] {
  if (typeof window === "undefined") return [];
  
  try {
    const key = walletAddress ? `${FUND_STORAGE_KEY}_${walletAddress.toLowerCase()}` : FUND_STORAGE_KEY;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to get payments:", e);
    return [];
  }
}

function savePayments(payments: PaymentRecord[], walletAddress?: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = walletAddress ? `${FUND_STORAGE_KEY}_${walletAddress.toLowerCase()}` : FUND_STORAGE_KEY;
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

export function addPaymentRecord(record: Omit<PaymentRecord, "id" | "timestamp">, walletAddress?: string): PaymentRecord | null {
  const payments = getPayments(walletAddress);
  
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
  savePayments(payments, walletAddress);
  
  // Dispatch custom event to notify components of payment update
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent('gasswap_payment_added', { detail: newRecord }));
  }
  
  return newRecord;
}

export function getRecentPayments(limit: number = 20, walletAddress?: string): PaymentRecord[] {
  return getPayments(walletAddress).slice(0, limit);
}

export function getFundSummary(walletAddress?: string): FundSummary {
  const payments = getPayments(walletAddress);
  
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

export function getTodaysFundSummary(walletAddress?: string): FundSummary {
  const payments = getPayments(walletAddress);
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

export function clearFundRecords(walletAddress?: string): void {
  if (typeof window === "undefined") return;
  const key = walletAddress ? `${FUND_STORAGE_KEY}_${walletAddress.toLowerCase()}` : FUND_STORAGE_KEY;
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

export function deduplicatePayments(walletAddress?: string): number {
  if (typeof window === "undefined") return 0;
  
  const payments = getPayments(walletAddress);
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
    savePayments(uniquePayments, walletAddress);
    window.dispatchEvent(new CustomEvent('gasswap_payment_added', { detail: { deduplicated: removed } }));
  }
  
  return removed;
}

// Sync payment records from voucher payment status to fund storage
// This fixes any inconsistencies between the two storage systems
export function syncPaymentRecordsFromVoucherStatus(walletAddress?: string): number {
  if (typeof window === "undefined") return 0;
  
  let synced = 0;
  const payments = getPayments(walletAddress);
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
          // Add to fund storage
          const method: PaymentMethod = data.method === 'cash' ? 'cash' : 'mobile_money';
          const newRecord: PaymentRecord = {
            id: `payment_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            voucherId,
            amount: data.amount,
            method,
            timestamp: data.paidAt ? new Date(data.paidAt).getTime() : Date.now(),
            transactionRef: data.transactionRef,
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
    savePayments(payments, walletAddress);
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('gasswap_payment_added', { detail: { synced } }));
    console.log(`Synced ${synced} payment records to fund storage`);
  }
  
  return synced;
}
