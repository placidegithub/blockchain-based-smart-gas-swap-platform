'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, shortenAddress, formatDate } from '@/lib/utils';
import { getCylinderPrice, formatRWF, getVoucherPaymentStatus, markVoucherAsPaid } from '@/lib/payment';
import { isVoucherAlreadyPaid } from '@/lib/fund-storage';
import { useRecentVouchers } from '@/lib/hooks';
import { PaymentForm } from '@/components/payment';
import { History, Banknote, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface TransactionHistoryProps {
  title?: string;
  description?: string;
  limit?: number;
  showPaymentActions?: boolean;
  companyFilter?: string;
  className?: string;
}

export function TransactionHistory({
  title = 'Transaction History',
  description = 'All voucher transactions',
  limit = 20,
  showPaymentActions = false,
  companyFilter,
  className,
}: TransactionHistoryProps) {
  const { transactions: allTransactions, isLoading, VoucherMappers } = useRecentVouchers(limit);
  const transactions = companyFilter
    ? allTransactions.filter((tx) => tx.companyName === companyFilter)
    : allTransactions;
  const [paymentStatusCache, setPaymentStatusCache] = useState<Map<string, 'unpaid' | 'paid' | 'cancelled'>>(new Map());
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{
    voucherId: string;
    customerPhone: string;
    customerName: string;
    cylinderType: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load payment status from localStorage for all transactions
  useEffect(() => {
    const cache = new Map<string, 'unpaid' | 'paid' | 'cancelled'>();
    transactions.forEach((tx) => {
      const id = tx.voucherId.toString();
      // First check fund storage (most reliable)
      if (isVoucherAlreadyPaid(id)) {
        cache.set(id, 'paid');
      } else {
        const storedStatus = getVoucherPaymentStatus(id);
        if (storedStatus) {
          cache.set(id, storedStatus.status === 'pending' ? 'unpaid' : storedStatus.status);
        } else {
          cache.set(id, 'unpaid');
        }
      }
    });
    setPaymentStatusCache(cache);
  }, [transactions, refreshKey]);

  const getPaymentStatus = useCallback((voucherId: bigint): 'unpaid' | 'paid' | 'cancelled' => {
    const id = voucherId.toString();
    if (paymentStatusCache.has(id)) {
      return paymentStatusCache.get(id)!;
    }
    // Double-check fund storage
    if (isVoucherAlreadyPaid(id)) {
      return 'paid';
    }
    const storedStatus = getVoucherPaymentStatus(id);
    if (storedStatus) {
      return storedStatus.status === 'pending' ? 'unpaid' : storedStatus.status;
    }
    return 'unpaid';
  }, [paymentStatusCache]);

  const handlePayment = (voucherId: bigint, customerPhone: string, customerName: string, cylinderType: string) => {
    const voucherIdStr = voucherId.toString();
    
    // Double-check payment status before opening modal
    if (isVoucherAlreadyPaid(voucherIdStr)) {
      alert('This voucher has already been paid.');
      setRefreshKey(prev => prev + 1);
      return;
    }
    
    setPaymentModal({
      voucherId: voucherIdStr,
      customerPhone,
      customerName: customerName || 'Customer',
      cylinderType,
    });
  };

  const handlePaymentComplete = useCallback((transactionRef: string) => {
    if (paymentModal) {
      // Update cache immediately
      setPaymentStatusCache(prev => {
        const newCache = new Map(prev);
        newCache.set(paymentModal.voucherId, 'paid');
        return newCache;
      });
      setRefreshKey(prev => prev + 1);
    }
    setPaymentModal(null);
  }, [paymentModal]);

  const paymentStatusColors = {
    unpaid: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    paid: 'text-green-400 bg-green-500/10 border-green-500/30',
    cancelled: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
  };

  const typeColors = {
    deposit: 'text-cyan-400 bg-cyan-500/10',
    redemption: 'text-purple-400 bg-purple-500/10',
  };

  const statusColors = {
    active: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    redeemed: 'text-green-400 bg-green-500/10 border-green-500/30',
    expired: 'text-red-400 bg-red-500/10 border-red-500/30',
  };

  if (paymentModal) {
    return (
      <div className={cn('w-full', className)}>
        <div className="mb-4">
          <Button variant="ghost" onClick={() => setPaymentModal(null)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Transactions
          </Button>
        </div>
        <div className="flex justify-center">
          <PaymentForm
            voucherId={paymentModal.voucherId}
            customerName={paymentModal.customerName}
            customerPhone={paymentModal.customerPhone}
            cylinderType={paymentModal.cylinderType}
            onPaymentComplete={handlePaymentComplete}
            onSkip={() => setPaymentModal(null)}
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        {/* Render VoucherMappers even while loading - they populate the transactions */}
        {VoucherMappers}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-cyan-400" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-muted/50 rounded-lg h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0 && !isLoading) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        {/* Render VoucherMappers even when empty - they populate the transactions */}
        {VoucherMappers}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-cyan-400" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <History className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p>No transactions to display</p>
            <p className="text-sm">Transactions will appear here once vouchers are created</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glow" className={cn('w-full', className)}>
      {VoucherMappers}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-cyan-400" />
          {title}
        </CardTitle>
        <CardDescription>
          {description} • {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {transactions.map((tx) => {
            const txKey = `${tx.voucherId.toString()}-${tx.type}`;
            const isExpanded = expandedTxId === txKey;
            const paymentStatus = getPaymentStatus(tx.voucherId);

            return (
              <div
                key={txKey}
                className={cn(
                  'bg-background/50 rounded-lg border border-border transition-all duration-200',
                  'hover:border-cyan-500/30 cursor-pointer'
                )}
                onClick={() => setExpandedTxId(isExpanded ? null : txKey)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium capitalize',
                          typeColors[tx.type]
                        )}
                      >
                        {tx.type}
                      </div>
                      <div>
                        <div className="font-mono text-sm text-foreground">
                          #{tx.voucherId.toString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx.customerName || shortenAddress(tx.customerAddress)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex gap-1 items-center">
                        <div
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium capitalize border',
                            statusColors[tx.status]
                          )}
                        >
                          {tx.status}
                        </div>
                        {tx.type === 'deposit' && (
                          <div
                            className={cn(
                              'px-2 py-1 rounded text-xs font-medium capitalize border',
                              paymentStatusColors[paymentStatus]
                            )}
                          >
                            {paymentStatus}
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx.cylinderType} • {formatRWF(getCylinderPrice(tx.cylinderType))}
                      </div>
                    </div>
                  </div>

                  {/* Payment Actions for unpaid deposits */}
                  {showPaymentActions && tx.type === 'deposit' && paymentStatus === 'unpaid' && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePayment(tx.voucherId, tx.customerPhone || '', tx.customerName || '', tx.cylinderType);
                        }}
                      >
                        <Banknote className="h-4 w-4 mr-2" />
                        Help Customer Pay {formatRWF(getCylinderPrice(tx.cylinderType))}
                      </Button>
                    </div>
                  )}

                  {/* Payment confirmed */}
                  {tx.type === 'deposit' && paymentStatus === 'paid' && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Payment collected: {formatRWF(getCylinderPrice(tx.cylinderType))}
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-cyan-400 mb-2">Customer</h4>
                          {tx.customerName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Name:</span>
                              <span>{tx.customerName}</span>
                            </div>
                          )}
                          {tx.customerEmail && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Email:</span>
                              <span className="truncate max-w-[150px]">{tx.customerEmail}</span>
                            </div>
                          )}
                          {tx.customerPhone && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Phone:</span>
                              <span>{tx.customerPhone}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Wallet:</span>
                            <span className="font-mono">{shortenAddress(tx.customerAddress)}</span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-cyan-400 mb-2">Details</h4>
                          {tx.companyName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Company:</span>
                              <span>{tx.companyName}</span>
                            </div>
                          )}
                          {tx.branchName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Branch:</span>
                              <span>{tx.branchName}</span>
                            </div>
                          )}
                          {tx.cylinderSerial && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Serial:</span>
                              <span className="font-mono">{tx.cylinderSerial}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Created:</span>
                            <span>{formatDate(tx.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      {tx.txHash && (
                        <div className="pt-2">
                          <span className="text-muted-foreground">Blockchain Tx: </span>
                          <a
                            href={`https://etherscan.io/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-cyan-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {shortenAddress(tx.txHash)}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
