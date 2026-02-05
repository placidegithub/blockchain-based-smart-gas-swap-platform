'use client';

import { useState, useCallback, useEffect } from 'react';
import { useCompanies, useCompany, useBranches, useBranch } from '@/lib/hooks/use-companies';
import { useRegisterCylinder, useCylinderTypes, type CylinderType } from '@/lib/hooks/use-cylinders';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, generateCylinderId } from '@/lib/utils';

interface AddCylinderFormProps {
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
      {company?.name || `Company ${companyId}`}
    </option>
  );
}

function BranchOption({ branchId }: { branchId: bigint }) {
  const { branch, isLoading } = useBranch(branchId);

  if (isLoading) {
    return <option value={branchId.toString()}>Loading...</option>;
  }

  return (
    <option value={branchId.toString()}>
      {branch?.name || `Branch ${branchId}`}
    </option>
  );
}

export function AddCylinderForm({ className, onSuccess }: AddCylinderFormProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [serialNumber, setSerialNumber] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { companyIds, isLoading: isLoadingCompanies } = useCompanies();
  const { branchIds, isLoading: isLoadingBranches } = useBranches(
    selectedCompanyId ? BigInt(selectedCompanyId) : undefined
  );
  const { cylinderTypes, isLoading: isLoadingTypes } = useCylinderTypes();
  const {
    registerCylinder,
    isPending,
    isSuccess,
    isError,
    error,
    txHash,
    reset,
    isAuthorized,
    isLoadingRoles,
  } = useRegisterCylinder();

  useEffect(() => {
    setSelectedBranchId('');
  }, [selectedCompanyId]);

  useEffect(() => {
    if (isSuccess && txHash) {
      setMessage({
        type: 'success',
        text: `Cylinder "${serialNumber}" registered successfully!`,
      });
      setSerialNumber('');
      onSuccess?.();
    }
  }, [isSuccess, txHash, serialNumber, onSuccess]);

  useEffect(() => {
    if (isError && error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to register cylinder',
      });
    }
  }, [isError, error]);

  const handleGenerateSerial = useCallback(() => {
    setSerialNumber(generateCylinderId());
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      reset();

      if (!selectedCompanyId) {
        setMessage({ type: 'error', text: 'Please select a company' });
        return;
      }

      if (!selectedBranchId) {
        setMessage({ type: 'error', text: 'Please select a branch' });
        return;
      }

      if (!selectedTypeId) {
        setMessage({ type: 'error', text: 'Please select a cylinder type' });
        return;
      }

      if (!serialNumber.trim()) {
        setMessage({ type: 'error', text: 'Serial number is required' });
        return;
      }

      try {
        await registerCylinder({
          companyId: BigInt(selectedCompanyId),
          typeId: BigInt(selectedTypeId),
          serialNumber: serialNumber.trim(),
          branchId: BigInt(selectedBranchId),
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to register cylinder';
        setMessage({ type: 'error', text: errorMessage });
      }
    },
    [selectedCompanyId, selectedBranchId, selectedTypeId, serialNumber, registerCylinder, reset]
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
            Only branch staff or platform administrators can register cylinders.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card variant="glow" className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Register New Cylinder</CardTitle>
        <CardDescription>
          Add a new gas cylinder to the blockchain registry
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
              Branch
            </label>
            <select
              className="flex w-full h-10 px-4 py-2 rounded-lg bg-input border border-cyan-500/30 text-foreground focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={isPending || !selectedCompanyId || isLoadingBranches}
            >
              <option value="">
                {!selectedCompanyId
                  ? 'Select a company first'
                  : isLoadingBranches
                  ? 'Loading branches...'
                  : 'Select a branch'}
              </option>
              {branchIds.map((id) => (
                <BranchOption key={id.toString()} branchId={id} />
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Cylinder Type
            </label>
            <select
              className="flex w-full h-10 px-4 py-2 rounded-lg bg-input border border-cyan-500/30 text-foreground focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              disabled={isPending || isLoadingTypes}
            >
              <option value="">Select cylinder type</option>
              {cylinderTypes.map((type: CylinderType) => (
                <option key={type.id.toString()} value={type.id.toString()}>
                  {type.name} - {Number(type.weightKg)}kg ({Number(type.priceRwf).toLocaleString()} RWF)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Serial Number
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., CYL-ABC123-XYZ"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                variant="glow"
                disabled={isPending}
                className="flex-1 font-mono"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateSerial}
                disabled={isPending}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Unique identifier for the cylinder
            </p>
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
            disabled={
              isPending ||
              !selectedCompanyId ||
              !selectedBranchId ||
              !selectedTypeId ||
              !serialNumber.trim()
            }
            loading={isPending}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Register Cylinder
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
