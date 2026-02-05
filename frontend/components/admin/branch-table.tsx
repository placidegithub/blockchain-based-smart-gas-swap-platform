'use client';

import { useBranches, useBranch, useCompany, type Branch } from '@/lib/hooks/use-companies';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo',
  'Gicumbi', 'Gisagara', 'Huye', 'Kamonyi', 'Karongi',
  'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga', 'Musanze',
  'Ngoma', 'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe',
  'Nyamasheke', 'Nyanza', 'Nyarugenge', 'Nyaruguru', 'Rubavu',
  'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana',
];

interface BranchTableProps {
  className?: string;
  companyId?: bigint;
  onViewDetails?: (branchId: bigint) => void;
}

function BranchRow({
  branchId,
  onViewDetails,
}: {
  branchId: bigint;
  onViewDetails?: (branchId: bigint) => void;
}) {
  const { branch, isLoading } = useBranch(branchId);
  const { company, isLoading: isLoadingCompany } = useCompany(branch?.companyId);

  if (isLoading) {
    return (
      <tr className="border-b border-border/50">
        <td className="py-4 px-4" colSpan={6}>
          <div className="flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </td>
      </tr>
    );
  }

  if (!branch) {
    return null;
  }

  const districtName = RWANDA_DISTRICTS[Number(branch.districtId)] || `District ${branch.districtId}`;

  return (
    <tr className="border-b border-border/50 hover:bg-white/5 transition-colors">
      <td className="py-4 px-4 text-foreground font-mono text-sm">
        {branchId.toString()}
      </td>
      <td className="py-4 px-4 text-foreground font-medium">
        {branch.name}
      </td>
      <td className="py-4 px-4 text-muted-foreground">
        {isLoadingCompany ? (
          <span className="text-muted-foreground">Loading...</span>
        ) : (
          company?.name || `Company ${branch.companyId}`
        )}
      </td>
      <td className="py-4 px-4 text-muted-foreground">
        {districtName}
      </td>
      <td className="py-4 px-4">
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            branch.isActive
              ? 'bg-green-500/10 text-green-400 border border-green-500/30'
              : 'bg-red-500/10 text-red-400 border border-red-500/30'
          )}
        >
          {branch.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="py-4 px-4 text-center text-muted-foreground">
        -
      </td>
      <td className="py-4 px-4">
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails?.(branchId)}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function BranchTable({ className, companyId, onViewDetails }: BranchTableProps) {
  const { branchIds, isLoading, error, refetch } = useBranches(companyId);

  if (!companyId) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Select a company to view its branches
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-400 mb-4">Failed to load branches</p>
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
        <CardTitle>Branches</CardTitle>
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
                  Company
                </th>
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  District
                </th>
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">
                  Inventory
                </th>
                <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="py-8" colSpan={7}>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
                    </div>
                  </td>
                </tr>
              ) : branchIds.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-muted-foreground" colSpan={7}>
                    No branches registered for this company
                  </td>
                </tr>
              ) : (
                branchIds.map((id) => (
                  <BranchRow
                    key={id.toString()}
                    branchId={id}
                    onViewDetails={onViewDetails}
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
