// HdevPayment API Integration for MTN Mobile Money
import { addPaymentRecord, isVoucherAlreadyPaid, type PaymentMethod as FundPaymentMethod } from './fund-storage';

export interface PaymentRequest {
  phone: string;
  amount: number;
  transactionRef: string;
  callbackUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  message?: string;
  transactionId?: string;
  status?: string;
  error?: string;
}

export interface PaymentStatus {
  success: boolean;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionRef: string;
  amount?: number;
  phone?: string;
  message?: string;
  error?: string;
}

// Cylinder type pricing in RWF
export const CYLINDER_PRICES: Record<string, number> = {
  '6kg': 1000,
  '12kg': 2000,
  '15kg': 2500,
};

export function getCylinderPrice(cylinderType: string): number {
  // Extract the weight from cylinder type string (e.g., "6 kg Cylinder" -> "6kg")
  const match = cylinderType.match(/(\d+)\s*kg/i);
  if (match) {
    const key = `${match[1]}kg`;
    return CYLINDER_PRICES[key] || 0;
  }
  return 0;
}

export function formatRWF(amount: number): string {
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateTransactionRef(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `GAS-${timestamp}-${random}`.toUpperCase();
}

export async function initiatePayment(data: PaymentRequest): Promise<PaymentResponse> {
  try {
    const response = await fetch('/api/payment/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Payment request failed with status ${response.status}`,
      };
    }

    return result as PaymentResponse;
  } catch (error) {
    console.error('Payment initiation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

export async function checkPaymentStatus(transactionRef: string): Promise<PaymentStatus> {
  try {
    const response = await fetch('/api/payment/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactionRef }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        status: 'failed',
        transactionRef,
        error: result.error || 'Failed to check payment status',
      };
    }

    return result as PaymentStatus;
  } catch (error) {
    console.error('Payment status check error:', error);
    return {
      success: false,
      status: 'failed',
      transactionRef,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

// Voucher Payment Status Persistence
export interface VoucherPaymentData {
  status: 'pending' | 'paid' | 'cancelled';
  transactionRef?: string;
  method?: 'cash' | 'momo';
  amount?: number;
  paidAt?: string;
  cancelledAt?: string;
}

export function saveVoucherPaymentStatus(voucherId: string, data: VoucherPaymentData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`voucher_payment_${voucherId}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save voucher payment status:', e);
  }
}

export function getVoucherPaymentStatus(voucherId: string): VoucherPaymentData | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(`voucher_payment_${voucherId}`);
    if (stored) {
      return JSON.parse(stored) as VoucherPaymentData;
    }
  } catch (e) {
    console.error('Failed to get voucher payment status:', e);
  }
  return null;
}

export function markVoucherAsPaid(voucherId: string, transactionRef: string, method: 'cash' | 'momo', amount?: number, customerPhone?: string, walletAddress?: string): boolean {
  console.log('[markVoucherAsPaid] Called with:', { voucherId, transactionRef, method, amount, customerPhone });
  
  // Check if already in fund storage (most reliable check for duplicate prevention)
  if (isVoucherAlreadyPaid(voucherId)) {
    console.warn(`Voucher ${voucherId} already in fund storage, preventing duplicate payment`);
    return false;
  }
  
  // Check localStorage payment status as well, but allow syncing to fund if needed
  const existingStatus = getVoucherPaymentStatus(voucherId);
  if (existingStatus?.status === 'paid') {
    console.log(`Voucher ${voucherId} marked as paid in localStorage but not in fund storage - syncing...`);
    
    const syncAmount = existingStatus.amount || amount || 0;
    if (syncAmount > 0) {
      const fundMethod: FundPaymentMethod = (existingStatus.method || method) === 'cash' ? 'cash' : 'mobile_money';
      const result = addPaymentRecord({
        voucherId,
        amount: syncAmount,
        method: fundMethod,
        customerPhone,
        transactionRef: existingStatus.transactionRef || transactionRef,
      }, walletAddress);
      console.log('[markVoucherAsPaid] Sync addPaymentRecord result:', result);
    }
    return true;
  }
  
  // Save to localStorage voucher status
  saveVoucherPaymentStatus(voucherId, {
    status: 'paid',
    transactionRef,
    method,
    amount,
    paidAt: new Date().toISOString(),
  });
  
  // Add to fund tracker - always add if we have a valid amount
  const paymentAmount = amount || 0;
  if (paymentAmount > 0) {
    const fundMethod: FundPaymentMethod = method === 'cash' ? 'cash' : 'mobile_money';
    const result = addPaymentRecord({
      voucherId,
      amount: paymentAmount,
      method: fundMethod,
      customerPhone,
      transactionRef,
    }, walletAddress);
    console.log('[markVoucherAsPaid] addPaymentRecord result:', result);
  } else {
    console.warn('[markVoucherAsPaid] Amount is 0 or undefined, not adding to fund tracker');
  }
  
  return true;
}

export function markVoucherAsCancelled(voucherId: string): void {
  saveVoucherPaymentStatus(voucherId, {
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
  });
}
