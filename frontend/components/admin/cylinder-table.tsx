'use client';

import { useState } from 'react';
import { 
  useTotalCylinders, 
  useCylinderBySerial,
  getCylinderStatusLabel,
  CylinderStatus,
  type CylinderData 
} from '@/lib/hooks/use-cylinders';
import { useCompany, useBranch } from '@/lib/hooks/use-companies';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatDate } from '@/lib/utils';

interface CylinderTableProps {
  className?: string;
  onViewHistory?: (cylinderId: bigint) => void;
}

const CYLINDER_TYPES: Record<number, string> = {
  1: '6kg',
  2: '12kg',
  3: '15kg',
};

const STATUS_COLORS: Record<CylinderStatus, string> = {
  [CylinderStatus.AVAILABLE]: 'bg-green-500/10 text-green-400 border-green-500/30',
  [CylinderStatus.IN_USE]: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  [CylinderStatus.IN_TRANSIT]: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  [CylinderStatus.MAINTENANCE]: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  [CylinderStatus.RETIRED]: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
};

function CylinderDetails({ 
  cylinderData,
  cylinderId,
  onViewHistory 
}: { 
  cylinderData: CylinderData;
  cylinderId: bigint;
  onViewHistory?: (cylinderId: bigint) => void;
}) {
  const { company, isLoading: isLoadingCompany } = useCompany(cylinderData.companyId);
  const { branch, isLoading: isLoadingBranch } = useBranch(cylinderData.currentBranchId);

  const cylinderType = CYLINDER_TYPES[Number(cylinderData.typeId)] || `Type ${cylinderData.typeId}`;
  const statusColor = STATUS_COLORS[cylinderData.status as CylinderStatus] || STATUS_COLORS[CylinderStatus.AVAILABLE];

  return (
    <tr className="border-b border-border/50 hover:bg-white/5 transition-colors">
      <td className="py-4 px-4 text-foreground font-mono text-sm">
        {cylinderId.toString()}
      </td>
      <td className="py-4 px-4 text-foreground font-mono">
        {cylinderData.serialNumber}
      </td>
      <td className="py-4 px-4 text-muted-foreground">
        {isLoadingCompany ? 'Loading...' : company?.name || `Company ${cylinderData.companyId}`}
      </td>
      <td className="py-4 px-4 text-muted-foreground">
        {isLoadingBranch ? 'Loading...' : branch?.name || `Branch ${cylinderData.currentBranchId}`}
      </td>
      <td className="py-4 px-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          {cylinderType}
        </span>
      </td>
      <td className="py-4 px-4">
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
            statusColor
          )}
        >
          {getCylinderStatusLabel(cylinderData.status as CylinderStatus)}
        </span>
      </td>
      <td className="py-4 px-4 text-muted-foreground text-sm">
        {formatDate(Number(cylinderData.lastUpdated))}
      </td>
      <td className="py-4 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewHistory?.(cylinderId)}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </Button>
      </td>
    </tr>
  );
}

function CylinderSearch({ onViewHistory }: { onViewHistory?: (cylinderId: bigint) => void }) {
  const [serialNumber, setSerialNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { cylinderId, cylinderData, isLoading, error } = useCylinderBySerial(searchQuery || undefined);

  const handleSearch = () => {
    setSearchQuery(serialNumber.trim());
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter cylinder serial number..."
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          variant="glow"
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={!serialNumber.trim()}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </Button>
      </div>

      {searchQuery && (
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
          ) : error ? (
            <p className="text-red-400 text-center py-4">Error searching for cylinder</p>
          ) : cylinderData && cylinderId ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Serial</th>
                  <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</th>
                  <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Branch</th>
                  <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Updated</th>
                  <th className="pb-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <CylinderDetails
                  cylinderData={cylinderData}
                  cylinderId={cylinderId}
                  onViewHistory={onViewHistory}
                />
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No cylinder found with serial number: {searchQuery}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function CylinderTable({ className, onViewHistory }: CylinderTableProps) {
  const { total, isLoading, refetch } = useTotalCylinders();

  return (
    <Card variant="glow" className={cn('w-full', className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cylinders</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Total registered: {isLoading ? '...' : total?.toString() ?? '0'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <CylinderSearch onViewHistory={onViewHistory} />
      </CardContent>
    </Card>
  );
}
