'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRoles, useCompanies, useBranches, useBranch, useRecentVouchers, useCurrentStaffInfo } from '@/lib/hooks';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { InitiateSwapForm } from './initiate-swap-form';
import { CompleteSwapForm } from './complete-swap-form';
import { TransactionList, Transaction } from './transaction-list';
import { FundTracker } from './fund-tracker';
import { AnalyticsDashboard } from './analytics-dashboard';
import { PaymentForm } from '@/components/payment';
import { TransactionHistory } from '@/components/shared';
import { getCylinderPrice, formatRWF, getVoucherPaymentStatus, markVoucherAsCancelled, markVoucherAsPaid, resetVoucherPaymentStatus } from '@/lib/payment';


interface StaffDashboardProps {
  className?: string;
}

type ActiveView = 'dashboard' | 'new-deposit' | 'scan-voucher' | 'payment' | 'transaction-history' | 'analytics';

interface PaymentContext {
  voucherId: bigint;
  customerPhone: string;
  customerName?: string;
  cylinderType: string;
}

export function StaffDashboard({ className }: StaffDashboardProps) {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedBranchId, setSelectedBranchId] = useState<bigint | undefined>();
  const [selectedCompanyId, setSelectedCompanyId] = useState<bigint | undefined>();
  const [paymentContext, setPaymentContext] = useState<PaymentContext | null>(null);
  const [paymentStatusCache, setPaymentStatusCache] = useState<Map<string, 'unpaid' | 'paid' | 'cancelled'>>(new Map());
  const [refreshKey, setRefreshKey] = useState(0);

  const { isBranchStaff, isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { companyIds } = useCompanies();
  const { branchIds } = useBranches(selectedCompanyId);
  const { transactions, isLoading: isLoadingTransactions, VoucherMappers } = useRecentVouchers(50);
  const { branch: staffBranch, company: staffCompany, companyId: staffCompanyId, isLoading: isLoadingStaffInfo, isStaffAssigned } = useCurrentStaffInfo();

  useEffect(() => {
    if (isStaffAssigned && !isPlatformAdmin && staffBranch && staffCompany) {
      if (!selectedCompanyId && staffCompany.id > 0n) {
        setSelectedCompanyId(staffCompany.id);
      }
      if (!selectedBranchId && staffBranch.id > 0n) {
        setSelectedBranchId(staffBranch.id);
      }
    }
  }, [isStaffAssigned, isPlatformAdmin, staffBranch, staffCompany, selectedCompanyId, selectedBranchId]);

  const isAuthorized = isBranchStaff || isPlatformAdmin;
  const isStaffView = !isPlatformAdmin && isStaffAssigned;
  
  const dashboardTitle = isStaffAssigned && staffCompany && staffBranch
    ? `${staffCompany.code} ${staffBranch.name}`
    : isPlatformAdmin
    ? 'Admin Staff Dashboard'
    : 'Staff Dashboard';

  // Load payment status from localStorage for all transactions
  useEffect(() => {
    const cache = new Map<string, 'unpaid' | 'paid' | 'cancelled'>();
    transactions.forEach((tx) => {
      const id = tx.voucherId.toString();
      const storedStatus = getVoucherPaymentStatus(id);
      if (storedStatus) {
        cache.set(id, storedStatus.status === 'pending' ? 'unpaid' : storedStatus.status);
      }
    });
    setPaymentStatusCache(cache);
  }, [transactions, refreshKey]);

  const handlePayment = (voucherId: bigint, customerPhone: string, cylinderType: string) => {
    setPaymentContext({
      voucherId,
      customerPhone,
      cylinderType,
    });
    setActiveView('payment');
  };

  const handlePaymentComplete = useCallback((transactionRef: string) => {
    if (paymentContext) {
      const voucherIdStr = paymentContext.voucherId.toString();
      // Update cache immediately
      setPaymentStatusCache(prev => {
        const newCache = new Map(prev);
        newCache.set(voucherIdStr, 'paid');
        return newCache;
      });
      // Refresh to sync with localStorage
      setRefreshKey(prev => prev + 1);
    }
    setPaymentContext(null);
    setActiveView('dashboard');
  }, [paymentContext]);

  const handleCancelPayment = useCallback((voucherId: bigint) => {
    const voucherIdStr = voucherId.toString();
    // Mark as cancelled in localStorage
    markVoucherAsCancelled(voucherIdStr);
    // Update cache immediately
    setPaymentStatusCache(prev => {
      const newCache = new Map(prev);
      newCache.set(voucherIdStr, 'cancelled');
      return newCache;
    });
  }, []);

  const handleRetryPayment = useCallback((voucherId: bigint) => {
    const voucherIdStr = voucherId.toString();
    // Reset cancelled status so payment can be retried
    resetVoucherPaymentStatus(voucherIdStr);
    // Update cache to unpaid
    setPaymentStatusCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(voucherIdStr);
      return newCache;
    });
    setRefreshKey(prev => prev + 1);
  }, []);

  const getPaymentStatus = useCallback((voucherId: bigint): 'unpaid' | 'paid' | 'cancelled' => {
    const id = voucherId.toString();
    // Check cache first (includes localStorage loaded data)
    if (paymentStatusCache.has(id)) {
      return paymentStatusCache.get(id)!;
    }
    // Fallback to localStorage check
    const storedStatus = getVoucherPaymentStatus(id);
    if (storedStatus) {
      return storedStatus.status === 'pending' ? 'unpaid' : storedStatus.status;
    }
    return 'unpaid';
  }, [paymentStatusCache]);
  
  const filteredTransactions = !isPlatformAdmin && isStaffAssigned && staffCompany
    ? transactions.filter((tx) => {
        if (tx.companyName !== staffCompany.name) return false;
        if (staffBranch?.name && tx.branchName) {
          return tx.branchName === staffBranch.name;
        }
        return true;
      })
    : transactions;

  const recentTransactions: Transaction[] = filteredTransactions.map((tx) => ({
    voucherId: tx.voucherId,
    type: tx.type,
    customerAddress: tx.customerAddress,
    customerName: tx.customerName,
    customerEmail: tx.customerEmail,
    customerPhone: tx.customerPhone,
    cylinderType: tx.cylinderType,
    cylinderSerial: tx.cylinderSerial,
    cylinderCondition: tx.cylinderCondition,
    companyName: tx.companyName,
    branchName: tx.branchName,
    timestamp: tx.timestamp,
    status: tx.status,
    paymentStatus: getPaymentStatus(tx.voucherId),
    txHash: tx.txHash,
  }));

  if (isLoadingRoles || isLoadingStaffInfo) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-red-400">Access Denied</CardTitle>
          <CardDescription>
            You must be a branch staff member or platform admin to access this dashboard.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (activeView === 'new-deposit') {
    return (
      <div className={cn('w-full', className)}>
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setActiveView('dashboard')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Button>
        </div>
        <InitiateSwapForm onSuccess={() => setActiveView('dashboard')} />
      </div>
    );
  }

  if (activeView === 'scan-voucher') {
    return (
      <div className={cn('w-full', className)}>
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setActiveView('dashboard')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Button>
        </div>
        <CompleteSwapForm onSuccess={() => setActiveView('dashboard')} />
      </div>
    );
  }

  if (activeView === 'payment' && paymentContext) {
    return (
      <div className={cn('w-full', className)}>
        <div className="mb-6">
          <Button variant="ghost" onClick={() => { setActiveView('dashboard'); setPaymentContext(null); }}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
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
            onSkip={() => { setActiveView('dashboard'); setPaymentContext(null); }}
          />
        </div>
      </div>
    );
  }

  if (activeView === 'transaction-history') {
    return (
      <div className={cn('w-full', className)}>
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setActiveView('dashboard')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Button>
        </div>
        <TransactionHistory
          title={isStaffView ? `${staffCompany?.name} Transactions` : "All Transactions"}
          description={isStaffView ? "Your branch transaction history" : "Complete transaction history with payment management"}
          limit={50}
          showPaymentActions={true}
          companyFilter={isStaffView ? staffCompany?.name : undefined}
          branchFilter={isStaffView ? staffBranch?.name : undefined}
          branchId={staffBranch?.id?.toString() || selectedBranchId?.toString()}
          companyId={staffCompany?.id?.toString() || selectedCompanyId?.toString()}
        />
      </div>
    );
  }

  if (activeView === 'analytics') {
    return (
      <div className={cn('w-full', className)}>
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setActiveView('dashboard')}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Button>
        </div>
        <AnalyticsDashboard
          transactions={recentTransactions}
          isLoading={isLoadingTransactions}
        />
      </div>
    );
  }

  // Derive stats from actual filtered transactions so numbers match what the user sees
  const totalDeposits = filteredTransactions.filter(tx => tx.type === 'deposit').length;
  const totalRedemptions = filteredTransactions.filter(tx => tx.type === 'redemption').length;
  const totalVouchers = filteredTransactions.length;
  const totalCompletedSwaps = filteredTransactions.filter(tx => tx.status === 'redeemed').length;

  return (
    <div className={cn('w-full space-y-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{dashboardTitle}</h1>
          <p className="text-muted-foreground">
            {isStaffAssigned && staffBranch
              ? `Branch Manager Dashboard - ${staffBranch.district || 'District'}`
              : 'Manage gas cylinder swaps'}
          </p>
        </div>
        {isPlatformAdmin ? (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Branch:</label>
            <select
              className="h-9 px-3 rounded-lg bg-input border border-border text-foreground text-sm focus:border-cyan-500"
              value={selectedCompanyId?.toString() ?? ''}
              onChange={(e) => {
                setSelectedCompanyId(e.target.value ? BigInt(e.target.value) : undefined);
                setSelectedBranchId(undefined);
              }}
            >
              <option value="">Select Company</option>
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
                <option value="">Select Branch</option>
                {branchIds.map((id) => (
                  <BranchOption key={id.toString()} branchId={id} />
                ))}
              </select>
            )}
          </div>
        ) : isStaffAssigned ? (
          <div className="flex items-center gap-2">
            <span className="text-sm px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              {staffCompany?.name || 'Company'} — {staffBranch?.name || 'Branch'}
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={isStaffView ? "Company Deposits" : (selectedBranchId ? "Branch Deposits" : "Total Deposits")}
          value={isLoadingTransactions ? '-' : totalDeposits}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          }
          color="cyan"
        />
        <StatCard
          title={isStaffView ? "Company Redemptions" : (selectedBranchId ? "Branch Redemptions" : "Total Redemptions")}
          value={isLoadingTransactions ? '-' : totalRedemptions}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          }
          color="purple"
        />
        <StatCard
          title={isStaffView ? "Company Vouchers" : "Total Vouchers"}
          value={isLoadingTransactions ? '-' : totalVouchers}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title={isStaffView ? "Company Swaps" : "Completed Swaps"}
          value={isLoadingTransactions ? '-' : totalCompletedSwaps}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card variant="glow">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common staff operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant={activeView === 'dashboard' ? 'default' : 'outline'}
                onClick={() => setActiveView('dashboard')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 11l4-4m0 0l4 4m-4-4V8" />
                </svg>
                Overview
              </Button>
              <Button
                className="w-full justify-start"
                onClick={() => setActiveView('new-deposit')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Deposit
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveView('scan-voucher')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                Scan Voucher
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setActiveView('transaction-history')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Transaction History
              </Button>
              <Link href="/staff/reports">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Reports
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setActiveView('analytics')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </Button>
            </CardContent>
          </Card>

          <FundTracker 
            branchId={staffBranch?.id?.toString() || selectedBranchId?.toString()}
            companyId={staffCompany?.id?.toString() || selectedCompanyId?.toString()}
          />
        </div>

        <div className="lg:col-span-2">
          {VoucherMappers}
          <TransactionList 
            transactions={recentTransactions} 
            isLoading={isLoadingTransactions}
            onPayment={handlePayment}
            onCancelPayment={handleCancelPayment}
            onRetryPayment={handleRetryPayment}
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'cyan' | 'purple' | 'blue' | 'green';
}

const colorClasses = {
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  green: 'text-green-400 bg-green-500/10 border-green-500/30',
};

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card variant="glow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
            {icon}
          </div>
        </div>
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
