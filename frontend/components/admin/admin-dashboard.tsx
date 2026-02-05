'use client';

import { useState } from 'react';
import { usePlatformStatsFormatted } from '@/lib/hooks/use-platform-stats';
import { useRoles } from '@/lib/hooks/use-roles';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';
import { CompanyTable } from './company-table';
import { BranchTable } from './branch-table';
import { CylinderTable } from './cylinder-table';
import { StaffRoleManager } from './staff-role-manager';
import { AddCompanyForm } from './add-company-form';
import { AddBranchForm } from './add-branch-form';
import { AddCylinderForm } from './add-cylinder-form';
import { TransactionHistory } from '@/components/shared';

interface AdminDashboardProps {
  className?: string;
}

type ActiveView = 
  | 'dashboard' 
  | 'companies' 
  | 'branches' 
  | 'cylinders' 
  | 'staff' 
  | 'add-company' 
  | 'add-branch' 
  | 'add-cylinder'
  | 'transactions';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'cyan' | 'purple' | 'blue' | 'green' | 'orange';
}

const colorClasses = {
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  green: 'text-green-400 bg-green-500/10 border-green-500/30',
  orange: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
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

export function AdminDashboard({ className }: AdminDashboardProps) {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedCompanyId, setSelectedCompanyId] = useState<bigint | undefined>();

  const { stats, isLoading: isLoadingStats } = usePlatformStatsFormatted();
  const { isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();

  if (isLoadingRoles) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-red-400">Access Denied</CardTitle>
          <CardDescription>
            You must be a platform administrator to access the admin dashboard.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const renderBackButton = () => (
    <div className="mb-6">
      <Button variant="ghost" onClick={() => setActiveView('dashboard')}>
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Button>
    </div>
  );

  if (activeView === 'companies') {
    return (
      <div className={cn('w-full', className)}>
        {renderBackButton()}
        <CompanyTable
          onViewBranches={(companyId) => {
            setSelectedCompanyId(companyId);
            setActiveView('branches');
          }}
        />
      </div>
    );
  }

  if (activeView === 'branches') {
    return (
      <div className={cn('w-full', className)}>
        {renderBackButton()}
        <BranchTable companyId={selectedCompanyId} />
      </div>
    );
  }

  if (activeView === 'cylinders') {
    return (
      <div className={cn('w-full', className)}>
        {renderBackButton()}
        <CylinderTable />
      </div>
    );
  }

  if (activeView === 'staff') {
    return (
      <div className={cn('w-full', className)}>
        {renderBackButton()}
        <StaffRoleManager />
      </div>
    );
  }

  if (activeView === 'add-company') {
    return (
      <div className={cn('w-full max-w-xl mx-auto', className)}>
        {renderBackButton()}
        <AddCompanyForm onSuccess={() => setActiveView('companies')} />
      </div>
    );
  }

  if (activeView === 'add-branch') {
    return (
      <div className={cn('w-full max-w-xl mx-auto', className)}>
        {renderBackButton()}
        <AddBranchForm onSuccess={() => setActiveView('branches')} />
      </div>
    );
  }

  if (activeView === 'add-cylinder') {
    return (
      <div className={cn('w-full max-w-xl mx-auto', className)}>
        {renderBackButton()}
        <AddCylinderForm onSuccess={() => setActiveView('cylinders')} />
      </div>
    );
  }

  if (activeView === 'transactions') {
    return (
      <div className={cn('w-full', className)}>
        {renderBackButton()}
        <TransactionHistory
          title="Platform Transaction History"
          description="All voucher transactions across the platform"
          limit={20}
          showPaymentActions={true}
        />
      </div>
    );
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform management and oversight</p>
        </div>
        {stats?.launchDate && (
          <div className="text-sm text-muted-foreground">
            Platform launched: {stats.launchDate.toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Companies"
          value={isLoadingStats ? '-' : stats?.totalCompanies ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          color="cyan"
        />
        <StatCard
          title="Branches"
          value={isLoadingStats ? '-' : stats?.totalBranches ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="purple"
        />
        <StatCard
          title="Cylinders"
          value={isLoadingStats ? '-' : stats?.totalCylinders ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
          color="blue"
        />
        <StatCard
          title="Vouchers"
          value={isLoadingStats ? '-' : stats?.totalVouchers ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          }
          color="green"
        />
        <StatCard
          title="Completed Swaps"
          value={isLoadingStats ? '-' : stats?.completedSwaps ?? 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="glow" className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              onClick={() => setActiveView('add-company')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Company
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setActiveView('add-branch')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Branch
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setActiveView('add-cylinder')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Register Cylinder
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setActiveView('transactions')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Transaction History
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setActiveView('staff')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Manage Staff Roles
            </Button>
          </CardContent>
        </Card>

        <Card variant="glow" className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Platform Overview</CardTitle>
              <CardDescription>View and manage platform entities</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveView('companies')}
                className="p-4 rounded-lg bg-white/5 border border-border hover:border-cyan-500/50 transition-colors text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-foreground group-hover:text-cyan-400 transition-colors">
                    Companies
                  </span>
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  View all registered gas companies
                </p>
              </button>

              <button
                onClick={() => {
                  setSelectedCompanyId(undefined);
                  setActiveView('branches');
                }}
                className="p-4 rounded-lg bg-white/5 border border-border hover:border-cyan-500/50 transition-colors text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-foreground group-hover:text-cyan-400 transition-colors">
                    Branches
                  </span>
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  View all branch locations
                </p>
              </button>

              <button
                onClick={() => setActiveView('cylinders')}
                className="p-4 rounded-lg bg-white/5 border border-border hover:border-cyan-500/50 transition-colors text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold text-foreground group-hover:text-cyan-400 transition-colors">
                    Cylinders
                  </span>
                  <svg className="w-5 h-5 text-muted-foreground group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  Search and view cylinder registry
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <Card variant="glass">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">Success Rate:</span>
                <span className="text-foreground font-medium">
                  {stats.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Powered by Blockchain
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
