'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  getFundSummary,
  getTodaysFundSummary,
  getRecentPayments,
  formatRWF,
  syncPaymentRecordsFromVoucherStatus,
  deduplicatePayments,
  clearFundRecords,
  FundSummary,
  PaymentRecord,
} from '@/lib/fund-storage';

interface FundTrackerProps {
  className?: string;
}

export function FundTracker({ className }: FundTrackerProps) {
  const { address } = useAccount();
  const [allTimeSummary, setAllTimeSummary] = useState<FundSummary | null>(null);
  const [todaySummary, setTodaySummary] = useState<FundSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([]);
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');

  const refreshData = useCallback(() => {
    // Sync any missing fund records from voucher payment statuses
    // This fixes mismatches when payments were saved under a different wallet key
    syncPaymentRecordsFromVoucherStatus(address);
    deduplicatePayments(address);

    setAllTimeSummary(getFundSummary(address));
    setTodaySummary(getTodaysFundSummary(address));
    setRecentPayments(getRecentPayments(10, address));
  }, [address]);

  useEffect(() => {
    refreshData();
    
    const interval = setInterval(refreshData, 5000);
    
    const storageKey = address ? `gasswap_collected_funds_${address.toLowerCase()}` : 'gasswap_collected_funds';
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        refreshData();
      }
    };
    
    const handlePaymentAdded = () => {
      refreshData();
    };
    
    window.addEventListener('storage', handleStorage);
    window.addEventListener('gasswap_payment_added', handlePaymentAdded);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('gasswap_payment_added', handlePaymentAdded);
    };
  }, [refreshData, address]);

  const summary = viewMode === 'today' ? todaySummary : allTimeSummary;

  return (
    <Card variant="glow" className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Fund Tracker</CardTitle>
            <CardDescription>Collected payments</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Clear all fund records?')) {
                  clearFundRecords(address);
                  refreshData();
                }
              }}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
              title="Clear all records"
            >
              Clear
            </button>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('today')}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-colors',
                viewMode === 'today'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-colors',
                viewMode === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              All Time
            </button>
          </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {summary && (
          <>
            <div className="text-center py-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20">
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-bold text-foreground">
                {formatRWF(summary.totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.transactionCount} transaction{summary.transactionCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-xs text-green-400">Cash</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{formatRWF(summary.cashAmount)}</p>
                <p className="text-xs text-muted-foreground">{summary.cashCount} payment{summary.cashCount !== 1 ? 's' : ''}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-blue-400">Mobile Money</span>
                </div>
                <p className="text-lg font-semibold text-foreground">{formatRWF(summary.mobileMoneyAmount)}</p>
                <p className="text-xs text-muted-foreground">{summary.mobileMoneyCount} payment{summary.mobileMoneyCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </>
        )}

        {recentPayments.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Payments</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      payment.method === 'cash' ? 'bg-green-400' : 'bg-blue-400'
                    )} />
                    <span className="text-foreground">
                      Voucher #{payment.voucherId.slice(-6)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{formatRWF(payment.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(!summary || summary.transactionCount === 0) && (
          <div className="text-center py-6 text-muted-foreground">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No payments collected {viewMode === 'today' ? 'today' : 'yet'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
