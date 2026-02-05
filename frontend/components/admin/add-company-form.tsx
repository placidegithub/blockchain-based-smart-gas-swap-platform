'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAddCompany } from '@/lib/hooks/use-companies';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AddCompanyFormProps {
  className?: string;
  onSuccess?: () => void;
}

export function AddCompanyForm({ className, onSuccess }: AddCompanyFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    addCompany,
    isPending,
    isSuccess,
    isError,
    error,
    txHash,
    reset,
    isAuthorized,
    isLoadingRoles,
  } = useAddCompany();

  useEffect(() => {
    if (isSuccess && txHash) {
      setMessage({
        type: 'success',
        text: `Company "${companyName}" added successfully!`,
      });
      setCompanyName('');
      setCompanyCode('');
      onSuccess?.();
    }
  }, [isSuccess, txHash, companyName, onSuccess]);

  useEffect(() => {
    if (isError && error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to add company',
      });
    }
  }, [isError, error]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      reset();

      if (!companyName.trim()) {
        setMessage({ type: 'error', text: 'Company name is required' });
        return;
      }

      if (!companyCode.trim()) {
        setMessage({ type: 'error', text: 'Company code is required' });
        return;
      }

      if (companyCode.length > 10) {
        setMessage({ type: 'error', text: 'Company code must be 10 characters or less' });
        return;
      }

      try {
        await addCompany(companyName.trim(), companyCode.trim().toUpperCase());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add company';
        setMessage({ type: 'error', text: errorMessage });
      }
    },
    [companyName, companyCode, addCompany, reset]
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
            Only platform administrators can add new companies.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card variant="glow" className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Add New Company</CardTitle>
        <CardDescription>
          Register a new gas company on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Company Name
            </label>
            <Input
              placeholder="e.g., SafeGas Rwanda"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              variant="glow"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Company Code
            </label>
            <Input
              placeholder="e.g., SAFGAS"
              value={companyCode}
              onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
              variant="glow"
              disabled={isPending}
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Short unique identifier (max 10 characters)
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
            disabled={isPending || !companyName.trim() || !companyCode.trim()}
            loading={isPending}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Company
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
