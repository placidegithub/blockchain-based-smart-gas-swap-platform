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

function getPayments(): PaymentRecord[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(FUND_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to get payments:", e);
    return [];
  }
}

function savePayments(payments: PaymentRecord[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(FUND_STORAGE_KEY, JSON.stringify(payments));
  } catch (e) {
    console.error("Failed to save payments:", e);
  }
}

export function addPaymentRecord(record: Omit<PaymentRecord, "id" | "timestamp">): PaymentRecord {
  const payments = getPayments();
  
  const newRecord: PaymentRecord = {
    ...record,
    id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  
  payments.unshift(newRecord);
  savePayments(payments);
  
  return newRecord;
}

export function getRecentPayments(limit: number = 20): PaymentRecord[] {
  return getPayments().slice(0, limit);
}

export function getFundSummary(): FundSummary {
  const payments = getPayments();
  
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

export function getTodaysFundSummary(): FundSummary {
  const payments = getPayments();
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

export function clearFundRecords(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(FUND_STORAGE_KEY);
}
