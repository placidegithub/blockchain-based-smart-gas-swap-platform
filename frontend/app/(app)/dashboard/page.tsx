'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Ticket, HelpCircle, History, CheckCircle2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VoucherListByIds } from '@/components/vouchers';
import { useWallet } from '@/lib/hooks/use-wallet';
import { useActiveVouchers, useCustomerVouchers } from '@/lib/hooks/use-vouchers';
import { useRecentVouchers } from '@/lib/hooks/use-recent-vouchers';
import { usePrimaryRole } from '@/lib/hooks/use-roles';
import { useCurrentStaffInfo } from '@/lib/hooks/use-companies';
import { shortenAddress } from '@/lib/utils';

const quickGuide = [
  {
    step: 1,
    title: 'Deposit Your Cylinder',
    description: 'Visit any participating branch and deposit your empty cylinder',
  },
  {
    step: 2,
    title: 'Receive a Voucher',
    description: 'Get a blockchain-verified voucher for your deposit',
  },
  {
    step: 3,
    title: 'Redeem Anywhere',
    description: 'Exchange your voucher for a full cylinder at any branch',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();
  const { primaryRole } = usePrimaryRole();
  const { activeVoucherIds, isLoading } = useActiveVouchers(address);
  const { voucherIds: allVoucherIds, isLoading: isLoadingAll } = useCustomerVouchers(address);
  const { company: staffCompany, isStaffAssigned } = useCurrentStaffInfo();
  
  // Redirect admin to their dedicated dashboard
  useEffect(() => {
    if (primaryRole === 'admin') {
      router.replace('/admin');
    }
  }, [primaryRole, router]);

  // For staff, get all platform vouchers
  const { transactions: platformTransactions, voucherIds: platformVoucherIds, isLoading: isLoadingPlatform, VoucherMappers } = useRecentVouchers(50);
  const isStaff = primaryRole === 'staff';
  const isStaffOnly = primaryRole === 'staff' && isStaffAssigned;
  
  // Filter platform vouchers by company for staff
  const filteredPlatformVoucherIds = isStaffOnly && staffCompany
    ? platformVoucherIds.filter((id) => {
        const tx = platformTransactions.find((t) => t.voucherId === id);
        return tx?.companyName === staffCompany.name;
      })
    : platformVoucherIds;
  
  // Get redeemed/completed vouchers (all vouchers minus active ones)
  const completedVoucherIds = allVoucherIds.filter(
    (id) => !activeVoucherIds.some((activeId) => activeId === id)
  );

  if (primaryRole === 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mb-6">
          <Wallet className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
        <p className="text-slate-400 text-center max-w-md">
          Connect your wallet to view your dashboard and manage your vouchers
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Welcome back!
        </h1>
        <p className="text-slate-400 flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span className="font-mono">{shortenAddress(address || '', 8)}</span>
        </p>
      </div>

      {/* Hidden voucher mappers - needed to resolve transaction data (company names, etc.) */}
      {isStaff && VoucherMappers}

      {/* Platform Vouchers Section - Only for Staff/Admin */}
      {isStaff && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-400" />
              {isStaffOnly ? `${staffCompany?.name} Vouchers` : 'All Platform Vouchers'}
            </h2>
            {filteredPlatformVoucherIds.length > 0 && (
              <span className="text-sm text-slate-400">
                {filteredPlatformVoucherIds.length} voucher{filteredPlatformVoucherIds.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {isLoadingPlatform ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} variant="default" className="animate-pulse">
                  <CardContent className="py-6">
                    <div className="h-4 w-24 bg-slate-700 rounded mb-4" />
                    <div className="h-8 w-32 bg-slate-700 rounded mb-2" />
                    <div className="h-4 w-full bg-slate-700 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPlatformVoucherIds.length > 0 ? (
            <VoucherListByIds voucherIds={filteredPlatformVoucherIds} />
          ) : (
            <Card variant="default">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                  <Ticket className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Platform Vouchers</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  No vouchers have been created on the platform yet.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Personal Active Vouchers Section - Only for customers */}
      {!isStaff && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Ticket className="h-5 w-5 text-cyan-400" />
              Active Vouchers
            </h2>
            {activeVoucherIds.length > 0 && (
              <span className="text-sm text-slate-400">
                {activeVoucherIds.length} voucher{activeVoucherIds.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} variant="default" className="animate-pulse">
                  <CardContent className="py-6">
                    <div className="h-4 w-24 bg-slate-700 rounded mb-4" />
                    <div className="h-8 w-32 bg-slate-700 rounded mb-2" />
                    <div className="h-4 w-full bg-slate-700 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activeVoucherIds.length > 0 ? (
            <VoucherListByIds voucherIds={activeVoucherIds} />
          ) : (
            <Card variant="default">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                  <Ticket className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Active Vouchers</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  You don&apos;t have any active vouchers. Visit a branch to deposit a cylinder and receive a voucher.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Transaction History - Only for customers */}
      {!isStaff && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <History className="h-5 w-5 text-cyan-400" />
              Transaction History
            </h2>
            {completedVoucherIds.length > 0 && (
              <span className="text-sm text-slate-400">
                {completedVoucherIds.length} completed transaction{completedVoucherIds.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {isLoadingAll ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map((i) => (
                <Card key={i} variant="default" className="animate-pulse">
                  <CardContent className="py-6">
                    <div className="h-4 w-24 bg-slate-700 rounded mb-4" />
                    <div className="h-8 w-32 bg-slate-700 rounded mb-2" />
                    <div className="h-4 w-full bg-slate-700 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : completedVoucherIds.length > 0 ? (
            <VoucherListByIds voucherIds={completedVoucherIds} />
          ) : (
            <Card variant="default">
              <CardContent className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-6 w-6 text-slate-500" />
                </div>
                <h3 className="text-md font-medium text-white mb-1">No Completed Transactions</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  Your completed voucher redemptions will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Quick Guide - Only for customers */}
      {!isStaff && (
        <section>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <HelpCircle className="h-5 w-5 text-cyan-400" />
            Quick Guide
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {quickGuide.map((item) => (
              <Card key={item.step} variant="default">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                      {item.step}
                    </span>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
