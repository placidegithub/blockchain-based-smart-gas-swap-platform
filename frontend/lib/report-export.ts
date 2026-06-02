import { getCylinderPrice, getVoucherPaymentStatus } from './payment';

export interface ExportableTransaction {
  voucherId: bigint;
  type: 'deposit' | 'redemption';
  customerAddress: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  cylinderType: string;
  cylinderSerial?: string;
  cylinderCondition?: 'empty' | 'full';
  companyName?: string;
  branchName?: string;
  timestamp: number;
  status: 'active' | 'redeemed' | 'expired';
  paymentStatus?: 'unpaid' | 'paid' | 'cancelled';
  txHash?: string;
}

function csvEscape(value: string | number | bigint | undefined | null): string {
  const stringValue = value === undefined || value === null ? '' : value.toString();
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function getCsvDate(timestamp: number): string {
  if (!timestamp) return '';
  const milliseconds = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
  return new Date(milliseconds).toISOString();
}

function getPaymentStatus(tx: ExportableTransaction): 'unpaid' | 'paid' | 'cancelled' | '' {
  if (tx.type !== 'deposit') return '';
  if (tx.paymentStatus) return tx.paymentStatus;

  const storedStatus = getVoucherPaymentStatus(tx.voucherId.toString());
  if (!storedStatus) return 'unpaid';
  return storedStatus.status === 'pending' ? 'unpaid' : storedStatus.status;
}

function getPaymentAmount(tx: ExportableTransaction): number {
  if (tx.type !== 'deposit') return 0;
  const storedStatus = getVoucherPaymentStatus(tx.voucherId.toString());
  if (storedStatus?.status === 'paid' && typeof storedStatus.amount === 'number') {
    return storedStatus.amount;
  }
  return getCylinderPrice(tx.cylinderType);
}

export function exportTransactionsToCsv(
  transactions: ExportableTransaction[],
  filenamePrefix = 'gasswap-transactions'
): void {
  if (typeof window === 'undefined') return;

  const headers = [
    'Voucher ID',
    'Type',
    'Voucher Status',
    'Payment Status',
    'Payment Amount RWF',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Customer Wallet',
    'Company',
    'Branch',
    'Cylinder Type',
    'Cylinder Serial',
    'Cylinder Condition',
    'Date',
    'Transaction Hash',
  ];

  const rows = transactions.map((tx) => [
    tx.voucherId,
    tx.type,
    tx.status,
    getPaymentStatus(tx),
    getPaymentAmount(tx),
    tx.customerName,
    tx.customerEmail,
    tx.customerPhone,
    tx.customerAddress,
    tx.companyName,
    tx.branchName,
    tx.cylinderType,
    tx.cylinderSerial,
    tx.cylinderCondition,
    getCsvDate(tx.timestamp),
    tx.txHash,
  ]);

  const csv = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `${filenamePrefix}-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
