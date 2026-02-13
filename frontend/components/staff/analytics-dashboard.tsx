'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getCylinderPrice, formatRWF } from '@/lib/payment';
import type { Transaction } from './transaction-list';

interface AnalyticsDashboardProps {
  transactions: Transaction[];
  isLoading?: boolean;
  className?: string;
}

const COLORS = {
  cyan: '#06b6d4',
  purple: '#a855f7',
  green: '#22c55e',
  orange: '#f97316',
  blue: '#3b82f6',
  red: '#ef4444',
  yellow: '#eab308',
};

const PIE_COLORS = [COLORS.cyan, COLORS.purple, COLORS.green, COLORS.orange, COLORS.blue, COLORS.red, COLORS.yellow];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: '#1a1a2e',
    border: '1px solid rgba(6,182,212,0.3)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '12px',
  },
  labelStyle: { color: '#94a3b8' },
};

export function AnalyticsDashboard({ transactions, isLoading, className }: AnalyticsDashboardProps) {
  // --- Derive all chart data from transactions ---

  const dailyActivity = useMemo(() => {
    const map = new Map<string, { date: string; deposits: number; redemptions: number; revenue: number }>();
    transactions.forEach((tx) => {
      const date = new Date(tx.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map.has(date)) {
        map.set(date, { date, deposits: 0, redemptions: 0, revenue: 0 });
      }
      const entry = map.get(date)!;
      if (tx.type === 'deposit') {
        entry.deposits++;
        entry.revenue += getCylinderPrice(tx.cylinderType);
      } else {
        entry.redemptions++;
      }
    });
    return Array.from(map.values()).reverse();
  }, [transactions]);

  const cylinderDistribution = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      const key = tx.cylinderType || 'Unknown';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const statusBreakdown = useMemo(() => {
    const counts = { active: 0, redeemed: 0, expired: 0 };
    transactions.forEach((tx) => {
      if (tx.status in counts) counts[tx.status as keyof typeof counts]++;
    });
    return [
      { name: 'Active', value: counts.active, color: COLORS.cyan },
      { name: 'Redeemed', value: counts.redeemed, color: COLORS.green },
      { name: 'Expired', value: counts.expired, color: COLORS.red },
    ].filter((d) => d.value > 0);
  }, [transactions]);

  const paymentBreakdown = useMemo(() => {
    let paid = 0, unpaid = 0, cancelled = 0;
    transactions.forEach((tx) => {
      if (tx.type !== 'deposit') return;
      if (tx.paymentStatus === 'paid') paid++;
      else if (tx.paymentStatus === 'cancelled') cancelled++;
      else unpaid++;
    });
    return [
      { name: 'Paid', value: paid, color: COLORS.green },
      { name: 'Unpaid', value: unpaid, color: COLORS.orange },
      { name: 'Cancelled', value: cancelled, color: COLORS.red },
    ].filter((d) => d.value > 0);
  }, [transactions]);

  const cumulativeRevenue = useMemo(() => {
    if (dailyActivity.length === 0) return [];
    let cumulative = 0;
    return dailyActivity.map((day) => {
      cumulative += day.revenue;
      return { date: day.date, revenue: cumulative };
    });
  }, [dailyActivity]);

  const companyComparison = useMemo(() => {
    const map = new Map<string, { company: string; deposits: number; redemptions: number; revenue: number }>();
    transactions.forEach((tx) => {
      const company = tx.companyName || 'Unknown';
      if (!map.has(company)) {
        map.set(company, { company, deposits: 0, redemptions: 0, revenue: 0 });
      }
      const entry = map.get(company)!;
      if (tx.type === 'deposit') {
        entry.deposits++;
        entry.revenue += getCylinderPrice(tx.cylinderType);
      } else {
        entry.redemptions++;
      }
    });
    return Array.from(map.values());
  }, [transactions]);

  // Summary stats
  const totalRevenue = useMemo(
    () => transactions.filter((tx) => tx.type === 'deposit').reduce((sum, tx) => sum + getCylinderPrice(tx.cylinderType), 0),
    [transactions]
  );
  const totalDeposits = transactions.filter((tx) => tx.type === 'deposit').length;
  const totalRedemptions = transactions.filter((tx) => tx.type === 'redemption').length;
  const swapRate = totalDeposits > 0 ? ((totalRedemptions / totalDeposits) * 100).toFixed(1) : '0';

  if (isLoading) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>No transaction data available yet. Charts will appear once transactions are made.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <svg className="mx-auto h-16 w-16 opacity-50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium">No data to display</p>
            <p className="text-sm">Process some transactions and the analytics will update automatically.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Revenue" value={formatRWF(totalRevenue)} color="cyan" />
        <SummaryCard label="Total Deposits" value={totalDeposits} color="purple" />
        <SummaryCard label="Total Redemptions" value={totalRedemptions} color="green" />
        <SummaryCard label="Swap Rate" value={`${swapRate}%`} color="orange" />
      </div>

      {/* Row 1: Daily Activity + Cumulative Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glow">
          <CardHeader>
            <CardTitle className="text-base">Daily Activity</CardTitle>
            <CardDescription>Deposits vs Redemptions per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="deposits" fill={COLORS.cyan} name="Deposits" radius={[4, 4, 0, 0]} />
                <Bar dataKey="redemptions" fill={COLORS.purple} name="Redemptions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card variant="glow">
          <CardHeader>
            <CardTitle className="text-base">Cumulative Revenue</CardTitle>
            <CardDescription>Running total of collected service charges</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cumulativeRevenue}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...tooltipStyle} formatter={(value: unknown) => [formatRWF(Number(value)), 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke={COLORS.cyan} fill="url(#revenueGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Cylinder Distribution + Voucher Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glow">
          <CardHeader>
            <CardTitle className="text-base">Cylinder Type Distribution</CardTitle>
            <CardDescription>Breakdown by cylinder size</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={cylinderDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {cylinderDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card variant="glow">
          <CardHeader>
            <CardTitle className="text-base">Voucher Status</CardTitle>
            <CardDescription>Active vs Redeemed vs Expired</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Payment Status + Company Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="glow">
          <CardHeader>
            <CardTitle className="text-base">Payment Collection Status</CardTitle>
            <CardDescription>Paid vs Unpaid vs Cancelled deposits</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card variant="glow">
          <CardHeader>
            <CardTitle className="text-base">Company Comparison</CardTitle>
            <CardDescription>Deposits and redemptions per company</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={companyComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="company" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={100} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="deposits" fill={COLORS.cyan} name="Deposits" radius={[0, 4, 4, 0]} />
                <Bar dataKey="redemptions" fill={COLORS.purple} name="Redemptions" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Revenue by Day (Line Chart) */}
      <Card variant="glow">
        <CardHeader>
          <CardTitle className="text-base">Daily Revenue Trend</CardTitle>
          <CardDescription>Service charge revenue collected per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => formatRWF(v)} />
              <Tooltip {...tooltipStyle} formatter={(value: unknown) => [formatRWF(Number(value)), 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke={COLORS.green} strokeWidth={2} dot={{ fill: COLORS.green, r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string | number; color: 'cyan' | 'purple' | 'green' | 'orange' }) {
  const colorMap = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    green: 'text-green-400 bg-green-500/10 border-green-500/30',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  };
  return (
    <div className={cn('p-4 rounded-lg border', colorMap[color])}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
