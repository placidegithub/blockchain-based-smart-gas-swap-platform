'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';
import {
  CylinderStatus,
  getCylinderStatusLabel,
  useAvailableCylindersAtBranch,
  useCylinderBySerial,
} from '@/lib/hooks/use-cylinders';
import type { Transaction } from './transaction-list';
import { Box, CheckCircle2, ClipboardList, PackageSearch, RefreshCw, Repeat2 } from 'lucide-react';

interface BranchInventoryDashboardProps {
  branchId?: bigint;
  branchName?: string;
  companyName?: string;
  district?: string;
  transactions: Transaction[];
  isLoadingTransactions?: boolean;
  className?: string;
}

function detectCylinderSize(serial: string): string {
  const match = serial.match(/(\d+)\s*kg/i);
  return match ? `${match[1]}kg` : 'Unknown';
}

function StatCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <Card variant="default">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            <p className="text-xs text-slate-500 mt-2">{detail}</p>
          </div>
          <div className="p-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AvailableCylinderRow({ serial }: { serial: string }) {
  const { cylinderData, isLoading } = useCylinderBySerial(serial);
  const status = cylinderData ? getCylinderStatusLabel(cylinderData.status as CylinderStatus) : 'Available';

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/50 p-3">
      <div className="min-w-0">
        <p className="font-mono text-sm text-foreground truncate">{serial}</p>
        <p className="text-xs text-muted-foreground">
          {detectCylinderSize(serial)}{cylinderData ? ` • Token #${cylinderData.id.toString()}` : ''}
        </p>
      </div>
      <div className="text-right shrink-0">
        <span className="inline-flex rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
          {isLoading ? 'Loading' : status}
        </span>
        {cylinderData?.lastUpdated && (
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(Number(cylinderData.lastUpdated))}</p>
        )}
      </div>
    </div>
  );
}

export function BranchInventoryDashboard({
  branchId,
  branchName,
  companyName,
  district,
  transactions,
  isLoadingTransactions,
  className,
}: BranchInventoryDashboardProps) {
  const {
    serialNumbers,
    isLoading: isLoadingAvailable,
    refetch,
  } = useAvailableCylindersAtBranch(branchId);

  const branchTransactions = useMemo(() => {
    if (!branchName) return transactions;
    return transactions.filter((tx) => tx.branchName === branchName);
  }, [branchName, transactions]);

  const deposits = branchTransactions.filter((tx) => tx.type === 'deposit');
  const redemptions = branchTransactions.filter((tx) => tx.type === 'redemption');
  const activeVouchers = branchTransactions.filter((tx) => tx.status === 'active');

  const sizeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const serial of serialNumbers) {
      const size = detectCylinderSize(serial);
      counts.set(size, (counts.get(size) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [serialNumbers]);

  return (
    <div className={cn('w-full space-y-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Branch Inventory</h2>
          <p className="text-muted-foreground">
            {companyName || 'Company'} • {branchName || 'Selected branch'}{district ? `, ${district}` : ''}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={!branchId || isLoadingAvailable}>
          <RefreshCw className={cn('h-4 w-4 mr-2', isLoadingAvailable && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {!branchId ? (
        <Card variant="glow">
          <CardHeader>
            <CardTitle>Select a Branch</CardTitle>
            <CardDescription>Choose a branch to view available cylinders and recent movement.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Available Cylinders"
              value={isLoadingAvailable ? '-' : serialNumbers.length}
              detail="Ready for redemption at this branch"
              icon={<CheckCircle2 className="h-5 w-5" />}
            />
            <StatCard
              title="Recent Deposits"
              value={isLoadingTransactions ? '-' : deposits.length}
              detail="Recent vouchers created here"
              icon={<ClipboardList className="h-5 w-5" />}
            />
            <StatCard
              title="Recent Redemptions"
              value={isLoadingTransactions ? '-' : redemptions.length}
              detail="Recent swaps completed"
              icon={<Repeat2 className="h-5 w-5" />}
            />
            <StatCard
              title="Active Vouchers"
              value={isLoadingTransactions ? '-' : activeVouchers.length}
              detail="Open vouchers from recent activity"
              icon={<PackageSearch className="h-5 w-5" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card variant="glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-cyan-400" />
                  Cylinder Mix
                </CardTitle>
                <CardDescription>Available cylinders grouped by size</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sizeCounts.length > 0 ? (
                  sizeCounts.map(([size, count]) => (
                    <div key={size} className="flex items-center justify-between rounded-lg bg-background/50 border border-border p-3">
                      <span className="text-sm text-slate-300">{size}</span>
                      <span className="font-mono text-white">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isLoadingAvailable ? 'Loading inventory...' : 'No available cylinders recorded for this branch.'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card variant="glow" className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Available Cylinder Serials</CardTitle>
                <CardDescription>Cylinders registered and ready at this branch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[460px] overflow-y-auto">
                  {isLoadingAvailable ? (
                    [...Array(4)].map((_, index) => (
                      <div key={index} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
                    ))
                  ) : serialNumbers.length > 0 ? (
                    serialNumbers.map((serial) => <AvailableCylinderRow key={serial} serial={serial} />)
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p>No available cylinders at this branch.</p>
                      <p className="text-sm">Register cylinders from the admin panel to populate inventory.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
