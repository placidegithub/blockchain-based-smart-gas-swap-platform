'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCompleteSwap, useVerifyVoucher, useCompany, useBranch, useCylinderTypes, useAvailableCylindersAtBranch, useCylinderBySerial } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn, formatDate } from '@/lib/utils';

interface CompleteSwapFormProps {
  initialVoucherId?: string;
  voucherId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function CompleteSwapForm({ initialVoucherId, voucherId, onSuccess, onCancel, className }: CompleteSwapFormProps) {
  const effectiveVoucherId = voucherId ?? initialVoucherId ?? '';
  const [voucherIdInput, setVoucherIdInput] = useState(effectiveVoucherId);
  const [voucherIdToVerify, setVoucherIdToVerify] = useState<bigint | undefined>();
  const [newCylinderSerial, setNewCylinderSerial] = useState('');
  const [branchIdInput, setBranchIdInput] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isVerified, setIsVerified] = useState(false);

  const { verification, isLoading: isVerifying, error: verifyError, refetch: refetchVerification } = useVerifyVoucher(voucherIdToVerify);
  const { completeSwap, isPending, isSuccess, isError, error, txHash, reset, isAuthorized, isLoadingRoles } = useCompleteSwap();

  useEffect(() => {
    const id = voucherId ?? initialVoucherId;
    if (id) {
      setVoucherIdInput(id);
    }
  }, [initialVoucherId, voucherId]);

  useEffect(() => {
    if (verification) {
      setIsVerified(true);
    }
  }, [verification]);

  useEffect(() => {
    if (isSuccess) {
      onSuccess?.();
    }
  }, [isSuccess, onSuccess]);

  const handleVerify = () => {
    if (!voucherIdInput.trim()) {
      setFormErrors({ voucherId: 'Voucher ID is required' });
      return;
    }

    try {
      const id = BigInt(voucherIdInput);
      setVoucherIdToVerify(id);
      setFormErrors({});
    } catch {
      setFormErrors({ voucherId: 'Invalid voucher ID format' });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newCylinderSerial.trim()) {
      errors.newCylinderSerial = 'New cylinder serial number is required';
    }

    if (!branchIdInput.trim()) {
      errors.branchId = 'Branch ID is required';
    } else {
      try {
        BigInt(branchIdInput);
      } catch {
        errors.branchId = 'Invalid branch ID format';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !voucherIdToVerify) return;

    try {
      await completeSwap({
        voucherId: voucherIdToVerify,
        newCylinderSerialNumber: newCylinderSerial,
        branchId: BigInt(branchIdInput),
      });
    } catch (err) {
      console.error('Failed to complete swap:', err);
    }
  };

  const handleReset = () => {
    setVoucherIdInput('');
    setVoucherIdToVerify(undefined);
    setNewCylinderSerial('');
    setBranchIdInput('');
    setFormErrors({});
    setIsVerified(false);
    reset();
  };

  if (isLoadingRoles) {
    return (
      <Card variant="glow" className={cn('w-full max-w-lg', className)}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthorized) {
    return (
      <Card variant="glow" className={cn('w-full max-w-lg', className)}>
        <CardHeader>
          <CardTitle className="text-red-400">Unauthorized</CardTitle>
          <CardDescription>You must be a branch staff member or platform admin to complete swaps.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card variant="glow" className={cn('w-full max-w-lg', className)}>
        <CardHeader>
          <CardTitle className="text-green-400">Swap Completed Successfully!</CardTitle>
          <CardDescription>The voucher has been redeemed and recorded on the blockchain.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-background/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Voucher ID:</span>
              <span className="font-mono text-cyan-400">{voucherIdToVerify?.toString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Cylinder:</span>
              <span className="font-mono text-cyan-400">{newCylinderSerial}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction:</span>
              <span className="font-mono text-cyan-400 text-sm truncate max-w-[200px]">{txHash}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleReset} variant="outline" className="w-full">
            Process Another Redemption
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card variant="glow" className={cn('w-full max-w-lg', className)}>
      <CardHeader>
        <CardTitle>Complete Gas Cylinder Swap</CardTitle>
        <CardDescription>Redeem a voucher and give the customer a filled cylinder.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Voucher ID</label>
            <div className="flex gap-2">
              <Input
                variant="glow"
                placeholder="Enter voucher ID or scan QR"
                value={voucherIdInput}
                onChange={(e) => {
                  setVoucherIdInput(e.target.value);
                  setIsVerified(false);
                  setVoucherIdToVerify(undefined);
                }}
                error={formErrors.voucherId}
                disabled={isPending}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleVerify}
                disabled={isPending || isVerifying}
                loading={isVerifying}
              >
                Verify
              </Button>
            </div>
          </div>

          {verifyError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              Failed to verify voucher: {verifyError.message || 'Unknown error'}
            </div>
          )}

          {verification && (
            <VoucherVerificationResult
              verification={verification}
              companyId={verification.companyId}
              cylinderTypeId={verification.cylinderTypeId}
            />
          )}

          {isVerified && verification?.isValid && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Cylinder Serial Number</label>
                <Input
                  variant="glow"
                  placeholder="Enter serial of the filled cylinder"
                  value={newCylinderSerial}
                  onChange={(e) => setNewCylinderSerial(e.target.value)}
                  error={formErrors.newCylinderSerial}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Branch ID (Redemption Location)</label>
                <Input
                  variant="glow"
                  placeholder="Enter your branch ID"
                  value={branchIdInput}
                  onChange={(e) => setBranchIdInput(e.target.value)}
                  error={formErrors.branchId}
                  disabled={isPending}
                />
              </div>
            </>
          )}

          {isError && error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error.message || 'An error occurred while completing the swap'}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isPending}
            className="flex-1"
          >
            Reset
          </Button>
          <Button
            type="submit"
            loading={isPending}
            disabled={!isVerified || !verification?.isValid}
            className="flex-1"
          >
            {isPending ? 'Processing...' : 'Complete Swap'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

interface VoucherVerificationResultProps {
  verification: {
    isValid: boolean;
    companyId: bigint;
    cylinderTypeId: bigint;
    daysRemaining: bigint;
    status: string;
  };
  companyId: bigint;
  cylinderTypeId: bigint;
}

function VoucherVerificationResult({ verification, companyId, cylinderTypeId }: VoucherVerificationResultProps) {
  const { company, isLoading: isLoadingCompany } = useCompany(companyId);
  const { cylinderTypes } = useCylinderTypes();
  
  const cylinderType = cylinderTypes.find((t) => t.id === cylinderTypeId);

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        verification.isValid
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-red-500/10 border-red-500/30'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        {verification.isValid ? (
          <>
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-green-400">Valid Voucher</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-red-400">Invalid Voucher</span>
          </>
        )}
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Company:</span>
          <span className={verification.isValid ? 'text-foreground' : 'text-red-300'}>
            {isLoadingCompany ? 'Loading...' : company?.name ?? 'Unknown'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cylinder Type:</span>
          <span className={verification.isValid ? 'text-foreground' : 'text-red-300'}>
            {cylinderType ? `${cylinderType.name} (${Number(cylinderType.weightKg)}kg)` : `Type ${cylinderTypeId.toString()}`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Days Remaining:</span>
          <span className={cn(
            verification.isValid ? 'text-foreground' : 'text-red-300',
            Number(verification.daysRemaining) <= 3 && verification.isValid && 'text-yellow-400'
          )}>
            {Number(verification.daysRemaining)} days
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status:</span>
          <span className={verification.isValid ? 'text-cyan-400' : 'text-red-300'}>
            {verification.status}
          </span>
        </div>
      </div>
    </div>
  );
}
