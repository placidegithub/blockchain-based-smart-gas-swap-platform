'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAddBranch, useCompanies, useCompany } from '@/lib/hooks/use-companies';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const RWANDA_DISTRICTS = [
  { id: 0, name: 'Bugesera', province: 'Eastern' },
  { id: 1, name: 'Burera', province: 'Northern' },
  { id: 2, name: 'Gakenke', province: 'Northern' },
  { id: 3, name: 'Gasabo', province: 'Kigali City' },
  { id: 4, name: 'Gatsibo', province: 'Eastern' },
  { id: 5, name: 'Gicumbi', province: 'Northern' },
  { id: 6, name: 'Gisagara', province: 'Southern' },
  { id: 7, name: 'Huye', province: 'Southern' },
  { id: 8, name: 'Kamonyi', province: 'Southern' },
  { id: 9, name: 'Karongi', province: 'Western' },
  { id: 10, name: 'Kayonza', province: 'Eastern' },
  { id: 11, name: 'Kicukiro', province: 'Kigali City' },
  { id: 12, name: 'Kirehe', province: 'Eastern' },
  { id: 13, name: 'Muhanga', province: 'Southern' },
  { id: 14, name: 'Musanze', province: 'Northern' },
  { id: 15, name: 'Ngoma', province: 'Eastern' },
  { id: 16, name: 'Ngororero', province: 'Western' },
  { id: 17, name: 'Nyabihu', province: 'Western' },
  { id: 18, name: 'Nyagatare', province: 'Eastern' },
  { id: 19, name: 'Nyamagabe', province: 'Southern' },
  { id: 20, name: 'Nyamasheke', province: 'Western' },
  { id: 21, name: 'Nyanza', province: 'Southern' },
  { id: 22, name: 'Nyarugenge', province: 'Kigali City' },
  { id: 23, name: 'Nyaruguru', province: 'Southern' },
  { id: 24, name: 'Rubavu', province: 'Western' },
  { id: 25, name: 'Ruhango', province: 'Southern' },
  { id: 26, name: 'Rulindo', province: 'Northern' },
  { id: 27, name: 'Rusizi', province: 'Western' },
  { id: 28, name: 'Rutsiro', province: 'Western' },
  { id: 29, name: 'Rwamagana', province: 'Eastern' },
];

interface AddBranchFormProps {
  className?: string;
  onSuccess?: () => void;
}

function CompanyOption({ companyId }: { companyId: bigint }) {
  const { company, isLoading } = useCompany(companyId);

  if (isLoading) {
    return <option value={companyId.toString()}>Loading...</option>;
  }

  return (
    <option value={companyId.toString()}>
      {company?.name || `Company ${companyId}`} ({company?.code || '...'})
    </option>
  );
}

export function AddBranchForm({ className, onSuccess }: AddBranchFormProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [branchName, setBranchName] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { companyIds, isLoading: isLoadingCompanies } = useCompanies();
  const {
    addBranch,
    isPending,
    isSuccess,
    isError,
    error,
    txHash,
    reset,
    isAuthorized,
    isLoadingRoles,
  } = useAddBranch();

  useEffect(() => {
    if (isSuccess && txHash) {
      setMessage({
        type: 'success',
        text: `Branch "${branchName}" added successfully!`,
      });
      setBranchName('');
      setSelectedDistrictId('');
      onSuccess?.();
    }
  }, [isSuccess, txHash, branchName, onSuccess]);

  useEffect(() => {
    if (isError && error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to add branch',
      });
    }
  }, [isError, error]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      reset();

      if (!selectedCompanyId) {
        setMessage({ type: 'error', text: 'Please select a company' });
        return;
      }

      if (!branchName.trim()) {
        setMessage({ type: 'error', text: 'Branch name is required' });
        return;
      }

      if (!selectedDistrictId) {
        setMessage({ type: 'error', text: 'Please select a district' });
        return;
      }

      try {
        await addBranch(
          BigInt(selectedCompanyId),
          branchName.trim(),
          BigInt(selectedDistrictId)
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add branch';
        setMessage({ type: 'error', text: errorMessage });
      }
    },
    [selectedCompanyId, branchName, selectedDistrictId, addBranch, reset]
  );

  if (isLoadingRoles) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-red-400">Access Denied</CardTitle>
          <CardDescription>
            Only platform administrators can add new branches.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const groupedDistricts = RWANDA_DISTRICTS.reduce(
    (acc, district) => {
      if (!acc[district.province]) {
        acc[district.province] = [];
      }
      acc[district.province].push(district);
      return acc;
    },
    {} as Record<string, typeof RWANDA_DISTRICTS>
  );

  return (
    <Card variant="glow" className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Add New Branch</CardTitle>
        <CardDescription>
          Add a new branch location for a registered company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Company
            </label>
            <select
              className="flex w-full h-10 px-4 py-2 rounded-lg bg-input border border-cyan-500/30 text-foreground focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              disabled={isPending || isLoadingCompanies}
            >
              <option value="">Select a company</option>
              {companyIds.map((id) => (
                <CompanyOption key={id.toString()} companyId={id} />
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Branch Name
            </label>
            <Input
              placeholder="e.g., Kigali Main Branch"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              variant="glow"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              District
            </label>
            <select
              className="flex w-full h-10 px-4 py-2 rounded-lg bg-input border border-cyan-500/30 text-foreground focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              disabled={isPending}
            >
              <option value="">Select a district</option>
              {Object.entries(groupedDistricts).map(([province, districts]) => (
                <optgroup key={province} label={province}>
                  {districts.map((district) => (
                    <option key={district.id} value={district.id.toString()}>
                      {district.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {message && (
            <div
              className={cn(
                'p-4 rounded-lg border',
                message.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              )}
            >
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>{message.text}</span>
              </div>
              {message.type === 'success' && txHash && (
                <p className="mt-2 text-xs font-mono break-all">
                  TX: {txHash}
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !selectedCompanyId || !branchName.trim() || !selectedDistrictId}
            loading={isPending}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Branch
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
