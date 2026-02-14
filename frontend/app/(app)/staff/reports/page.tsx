'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePlatformStatsFormatted, useRecentVouchers, useRoles, useCompanies, useBranches, useBranch, useBranchStats, useCurrentStaffInfo } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, shortenAddress, formatDate } from '@/lib/utils';
import { PaymentForm } from '@/components/payment';
import { getCylinderPrice, formatRWF, getVoucherPaymentStatus, markVoucherAsCancelled } from '@/lib/payment';
import { Banknote, XCircle, Loader2 } from 'lucide-react';

interface PaymentContext {
  voucherId: bigint;
  customerPhone: string;
  customerName?: string;
  cylinderType: string;
}

export default function ReportsPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<bigint | undefined>();
  const [selectedBranchId, setSelectedBranchId] = useState<bigint | undefined>();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentContext, setPaymentContext] = useState<PaymentContext | null>(null);
  const [paidVouchers, setPaidVouchers] = useState<Set<string>>(new Set());
  const [cancelledVouchers, setCancelledVouchers] = useState<Set<string>>(new Set());
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  const { stats, isLoading: isLoadingStats } = usePlatformStatsFormatted();
  const { isBranchStaff, isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { companyIds } = useCompanies();
  const { branchIds } = useBranches(selectedCompanyId);
  const { transactions, isLoading: isLoadingTransactions, total, VoucherMappers } = useRecentVouchers(20);
  const { deposits: branchDeposits, redemptions: branchRedemptions } = useBranchStats(selectedBranchId);
  const { branch: staffBranch, company: staffCompany, isStaffAssigned } = useCurrentStaffInfo();

  const isAuthorized = isBranchStaff && !isPlatformAdmin;

  const handlePayClick = (voucherId: bigint, customerPhone: string, cylinderType: string, customerName?: string) => {
    setPaymentContext({ voucherId, customerPhone, customerName, cylinderType });
    setShowPaymentForm(true);
  };

  const handlePaymentComplete = (transactionRef: string) => {
    if (paymentContext) {
      setPaidVouchers(prev => new Set(prev).add(paymentContext.voucherId.toString()));
    }
    setShowPaymentForm(false);
    setPaymentContext(null);
    setProcessingPayment(null);
  };

  const handleCancelVoucher = (voucherId: bigint) => {
    const voucherIdStr = voucherId.toString();
    setCancelledVouchers(prev => new Set(prev).add(voucherIdStr));
    markVoucherAsCancelled(voucherIdStr);
  };

  const getPaymentStatusForVoucher = (voucherId: bigint): 'unpaid' | 'paid' | 'cancelled' => {
    const id = voucherId.toString();
    // First check local state
    if (paidVouchers.has(id)) return 'paid';
    if (cancelledVouchers.has(id)) return 'cancelled';
    // Then check localStorage
    const storedStatus = getVoucherPaymentStatus(id);
    if (storedStatus) {
      return storedStatus.status === 'pending' ? 'unpaid' : storedStatus.status;
    }
    return 'unpaid';
  };

  if (isLoadingRoles) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card variant="glow">
          <CardHeader>
            <CardTitle className="text-red-400">Access Denied</CardTitle>
            <CardDescription>
              You must be a branch staff member or platform admin to view reports.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const displayDeposits = selectedBranchId ? Number(branchDeposits) : (stats?.totalVouchers ?? 0);
  const displayRedemptions = selectedBranchId ? Number(branchRedemptions) : (stats?.completedSwaps ?? 0);
  const activeVouchers = displayDeposits - displayRedemptions;

  if (showPaymentForm && paymentContext) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => { setShowPaymentForm(false); setPaymentContext(null); }}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Reports
          </Button>
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-bold mb-4">Collect Payment for Voucher #{paymentContext.voucherId.toString()}</h2>
          <PaymentForm
            voucherId={paymentContext.voucherId.toString()}
            customerName={paymentContext.customerName || 'Customer'}
            customerPhone={paymentContext.customerPhone}
            cylinderType={paymentContext.cylinderType}
            branchId={staffBranch?.id?.toString() || selectedBranchId?.toString()}
            companyId={staffCompany?.id?.toString() || selectedCompanyId?.toString()}
            onPaymentComplete={handlePaymentComplete}
            onSkip={() => { setShowPaymentForm(false); setPaymentContext(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {VoucherMappers}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/staff">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          </div>
          <p className="text-muted-foreground mt-1">Platform statistics and transaction history</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Filter by:</label>
          <select
            className="h-9 px-3 rounded-lg bg-input border border-border text-foreground text-sm focus:border-cyan-500"
            value={selectedCompanyId?.toString() ?? ''}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value ? BigInt(e.target.value) : undefined);
              setSelectedBranchId(undefined);
            }}
          >
            <option value="">All Companies</option>
            {companyIds.map((id) => (
              <option key={id.toString()} value={id.toString()}>
                Company {id.toString()}
              </option>
            ))}
          </select>
          {selectedCompanyId && (
            <select
              className="h-9 px-3 rounded-lg bg-input border border-border text-foreground text-sm focus:border-cyan-500"
              value={selectedBranchId?.toString() ?? ''}
              onChange={(e) => setSelectedBranchId(e.target.value ? BigInt(e.target.value) : undefined)}
            >
              <option value="">All Branches</option>
              {branchIds.map((id) => (
                <BranchOption key={id.toString()} branchId={id} />
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={selectedBranchId ? "Branch Deposits" : "Total Deposits"}
          value={isLoadingStats ? '-' : displayDeposits}
          trend={null}
          color="cyan"
        />
        <StatCard
          title={selectedBranchId ? "Branch Redemptions" : "Total Redemptions"}
          value={isLoadingStats ? '-' : displayRedemptions}
          trend={null}
          color="purple"
        />
        <StatCard
          title="Active Vouchers"
          value={isLoadingStats ? '-' : activeVouchers}
          trend={null}
          color="blue"
        />
        <StatCard
          title="Success Rate"
          value={isLoadingStats ? '-' : `${stats?.successRate?.toFixed(1) ?? 0}%`}
          trend={null}
          color="green"
        />
      </div>

      <Card variant="glow">
        <CardHeader>
          <CardTitle>Platform Summary</CardTitle>
          <CardDescription>Overall platform statistics from the blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
              <p className="text-2xl font-bold text-foreground">{stats?.totalCompanies ?? 0}</p>
              <p className="text-sm text-muted-foreground">Companies</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
              <p className="text-2xl font-bold text-foreground">{stats?.totalBranches ?? 0}</p>
              <p className="text-sm text-muted-foreground">Branches</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
              <p className="text-2xl font-bold text-foreground">{stats?.totalCylinders ?? 0}</p>
              <p className="text-sm text-muted-foreground">Registered Cylinders</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg border border-border">
              <p className="text-2xl font-bold text-foreground">{total}</p>
              <p className="text-sm text-muted-foreground">Total Vouchers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card variant="glow">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {isLoadingTransactions 
              ? 'Loading transactions...'
              : `Showing ${transactions.length} recent transactions`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-muted/50 rounded-lg h-16" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
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
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b border-border">
                    <th className="pb-3 font-medium">Voucher ID</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Cylinder</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Payment</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => {
                    const paymentStatus = getPaymentStatusForVoucher(tx.voucherId);
                    const isActive = tx.status === 'active' && tx.type === 'deposit';
                    const canPay = isActive && paymentStatus === 'unpaid';
                    
                    return (
                      <tr key={tx.voucherId.toString()} className="text-sm">
                        <td className="py-3 font-mono">#{tx.voucherId.toString()}</td>
                        <td className="py-3">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium capitalize',
                            tx.type === 'deposit' 
                              ? 'text-cyan-400 bg-cyan-500/10' 
                              : 'text-purple-400 bg-purple-500/10'
                          )}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="font-mono text-muted-foreground text-xs">
                            {shortenAddress(tx.customerAddress)}
                          </div>
                          {tx.customerName && (
                            <div className="text-foreground text-xs">{tx.customerName}</div>
                          )}
                        </td>
                        <td className="py-3">{tx.cylinderType}</td>
                        <td className="py-3 font-semibold text-cyan-400">
                          {formatRWF(getCylinderPrice(tx.cylinderType))}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {formatDate(tx.timestamp)}
                        </td>
                        <td className="py-3">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium capitalize border',
                            tx.status === 'redeemed' && 'text-green-400 bg-green-500/10 border-green-500/30',
                            tx.status === 'active' && 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
                            tx.status === 'expired' && 'text-red-400 bg-red-500/10 border-red-500/30'
                          )}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3">
                          {tx.type === 'deposit' && (
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium capitalize border',
                              paymentStatus === 'paid' && 'text-green-400 bg-green-500/10 border-green-500/30',
                              paymentStatus === 'unpaid' && 'text-orange-400 bg-orange-500/10 border-orange-500/30',
                              paymentStatus === 'cancelled' && 'text-gray-400 bg-gray-500/10 border-gray-500/30'
                            )}>
                              {paymentStatus}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          {canPay && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handlePayClick(tx.voucherId, tx.customerPhone || '', tx.cylinderType, tx.customerName)}
                                disabled={processingPayment === tx.voucherId.toString()}
                              >
                                {processingPayment === tx.voucherId.toString() ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <Banknote className="h-3 w-3 mr-1" />
                                    Pay
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                                onClick={() => handleCancelVoucher(tx.voucherId)}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          {paymentStatus === 'paid' && (
                            <span className="text-xs text-green-400">✓ Paid</span>
                          )}
                          {paymentStatus === 'cancelled' && (
                            <span className="text-xs text-gray-400">Cancelled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  trend: { value: number; positive: boolean } | null;
  color: 'cyan' | 'purple' | 'blue' | 'green';
}

const colorClasses = {
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
};

function StatCard({ title, value, color }: StatCardProps) {
  return (
    <Card variant="glow">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={cn('text-2xl font-bold', colorClasses[color])}>{value}</p>
      </CardContent>
    </Card>
  );
}

function BranchOption({ branchId }: { branchId: bigint }) {
  const { branch, isLoading } = useBranch(branchId);

  if (isLoading || !branch) {
    return <option value={branchId.toString()}>Loading...</option>;
  }

  return (
    <option value={branchId.toString()}>
      {branch.name}
    </option>
  );
}
