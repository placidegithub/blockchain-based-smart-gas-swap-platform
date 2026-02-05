'use client';

import { useState, useEffect } from 'react';
import { useCompanies, useCompanyInfo, type CompanyInfo } from '@/lib/hooks/use-companies';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatEther } from '@/lib/utils';

interface CompanyTableProps {
  className?: string;
  onViewBranches?: (companyId: bigint) => void;
}

interface CompanyRowData {
  id: bigint;
  info: CompanyInfo | undefined;
  isLoading: boolean;
}

function CompanyRow({ 
  companyId, 
  onViewBranches 
}: { 
  companyId: bigint; 
  onViewBranches?: (companyId: bigint) => void;
}) {
  const { companyInfo, isLoading } = useCompanyInfo(companyId);

  if (isLoading) {
    return (
      <tr className="border-b border-border/50">
        <td className="py-4 px-4" colSpan={7}>
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </td>
      </tr>
    );
  }

  if (!companyInfo) {
    return null;
  }

  return (
    <tr className="border-b border-border/50 hover:bg-white/5 transition-colors">
      <td className="py-4 px-4 text-foreground font-mono text-sm">
        {companyId.toString()}
      </td>
      <td className="py-4 px-4 text-foreground font-medium">
        {companyInfo.name}
      </td>
      <td className="py-4 px-4 text-muted-foreground font-mono">
        {companyInfo.code}
      </td>
      <td className="py-4 px-4">
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            companyInfo.isActive
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          )}
        >
          {companyInfo.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="py-4 px-4 text-muted-foreground text-center">
        {companyInfo.branchCount.toString()}
      </td>
      <td className="py-4 px-4 text-right">
        <div className="text-sm">
          <div className="text-green-400">
            +{formatEther(companyInfo.totalDeposits, 2)} ETH
          </div>
          <div className="text-red-400">
            -{formatEther(companyInfo.totalRedemptions, 2)} ETH
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-right font-medium text-cyan-400">
        {formatEther(companyInfo.netBalance, 4)} ETH
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewBranches?.(companyId)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Branches
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function CompanyTable({ className, onViewBranches }: CompanyTableProps) {
  const { companyIds, isLoading, error, refetch } = useCompanies();

  if (error) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-400 mb-4">Failed to load companies</p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glow" className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Companies</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  ID
                </th>
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Code
                </th>
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                  Branches
                </th>
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Deposits / Redemptions
                </th>
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Net Balance
                </th>
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="py-8" colSpan={8}>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
                    </div>
                  </td>
                </tr>
              ) : companyIds.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-muted-foreground" colSpan={8}>
                    No companies registered yet
                  </td>
                </tr>
              ) : (
                companyIds.map((id) => (
                  <CompanyRow
                    key={id.toString()}
                    companyId={id}
                    onViewBranches={onViewBranches}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
