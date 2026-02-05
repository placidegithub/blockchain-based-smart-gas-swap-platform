'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, shortenAddress, formatDate } from '@/lib/utils';
import { getCylinderPrice, formatRWF } from '@/lib/payment';
import { Banknote, XCircle, Loader2 } from 'lucide-react';

export interface Transaction {
  voucherId: bigint;
  type: 'deposit' | 'redemption';
  customerAddress: `0x${string}`;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  cylinderType: string;
  cylinderSerial?: string;
  cylinderCondition?: 'empty' | 'full';
  companyName?: string;
  branchName?: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  paymentStatus?: 'unpaid' | 'paid' | 'cancelled';
  txHash?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  onPayment?: (voucherId: bigint, customerPhone: string, cylinderType: string) => void;
  onCancelPayment?: (voucherId: bigint) => void;
  className?: string;
}

const statusColors = {
  pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  completed: 'text-green-400 bg-green-500/10 border-green-500/30',
  failed: 'text-red-400 bg-red-500/10 border-red-500/30',
};

const typeColors = {
  deposit: 'text-cyan-400 bg-cyan-500/10',
  redemption: 'text-purple-400 bg-purple-500/10',
};

const paymentStatusColors = {
  unpaid: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  paid: 'text-green-400 bg-green-500/10 border-green-500/30',
  cancelled: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
};

export function TransactionList({
  transactions,
  isLoading,
  onLoadMore,
  hasMore,
  onPayment,
  onCancelPayment,
  className,
}: TransactionListProps) {
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  if (isLoading && transactions.length === 0) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Loading transaction history...</CardDescription>
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

  if (transactions.length === 0) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>No transactions yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p>No transactions to display</p>
            <p className="text-sm">Transactions will appear here once you process swaps</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glow" className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {transactions.map((tx) => {
            const txKey = `${tx.voucherId.toString()}-${tx.type}`;
            const isExpanded = expandedTxId === txKey;

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
                          {shortenAddress(tx.customerAddress)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex gap-1">
                        <div
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium capitalize border',
                            statusColors[tx.status]
                          )}
                        >
                          {tx.status}
                        </div>
                        {tx.paymentStatus && (
                          <div
                            className={cn(
                              'px-2 py-1 rounded text-xs font-medium capitalize border',
                              paymentStatusColors[tx.paymentStatus]
                            )}
                          >
                            {tx.paymentStatus}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tx.cylinderType} • {formatRWF(getCylinderPrice(tx.cylinderType))}
                      </div>
                    </div>
                  </div>

                  {/* Payment Actions - Only show for deposits with unpaid status */}
                  {tx.type === 'deposit' && tx.paymentStatus === 'unpaid' && (onPayment || onCancelPayment) && (
                    <div className="mt-3 pt-3 border-t border-border flex gap-2">
                      {onPayment && (
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProcessingPayment(txKey);
                            onPayment(tx.voucherId, tx.customerPhone || '', tx.cylinderType);
                          }}
                          disabled={processingPayment === txKey}
                        >
                          {processingPayment === txKey ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Banknote className="h-4 w-4 mr-2" />
                          )}
                          Collect {formatRWF(getCylinderPrice(tx.cylinderType))}
                        </Button>
                      )}
                      {onCancelPayment && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelPayment(tx.voucherId);
                          }}
                          disabled={processingPayment === txKey}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Skip
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Show paid confirmation */}
                  {tx.type === 'deposit' && tx.paymentStatus === 'paid' && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Payment collected: {formatRWF(getCylinderPrice(tx.cylinderType))}
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                      <h4 className="font-semibold text-cyan-400 mb-2">Voucher Details</h4>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Voucher ID:</span>
                        <span className="font-mono">{tx.voucherId.toString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="capitalize">{tx.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{formatDate(tx.timestamp)}</span>
                      </div>

                      <h4 className="font-semibold text-cyan-400 mt-4 mb-2">Customer Information</h4>
                      {tx.customerName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Full Name:</span>
                          <span>{tx.customerName}</span>
                        </div>
                      )}
                      {tx.customerEmail && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{tx.customerEmail}</span>
                        </div>
                      )}
                      {tx.customerPhone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{tx.customerPhone}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Wallet Address:</span>
                        <span className="font-mono">{shortenAddress(tx.customerAddress)}</span>
                      </div>

                      <h4 className="font-semibold text-cyan-400 mt-4 mb-2">Cylinder Information</h4>
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
                          <span className="text-muted-foreground">Serial Number:</span>
                          <span className="font-mono">{tx.cylinderSerial}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cylinder Type:</span>
                        <span>{tx.cylinderType}</span>
                      </div>
                      {tx.cylinderCondition && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Condition at Deposit:</span>
                          <span className={tx.cylinderCondition === 'full' ? 'text-green-400' : 'text-orange-400'}>
                            {tx.cylinderCondition === 'full' ? 'Full Cylinder' : 'Empty Cylinder'}
                          </span>
                        </div>
                      )}

                      <h4 className="font-semibold text-cyan-400 mt-4 mb-2">Payment Information</h4>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-semibold text-cyan-400">{formatRWF(getCylinderPrice(tx.cylinderType))}</span>
                      </div>
                      {tx.paymentStatus && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Status:</span>
                          <span className="capitalize">{tx.paymentStatus}</span>
                        </div>
                      )}
                      {tx.txHash && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Blockchain Tx:</span>
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

        {hasMore && onLoadMore && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={onLoadMore} loading={isLoading}>
              Load More
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Card variant="glow" className="w-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Loading...</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(count)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted/50 rounded-lg h-16" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
