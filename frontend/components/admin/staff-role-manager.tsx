'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { useVoucherManagerWrite } from '@/lib/hooks/use-contracts';
import { useRoles, BRANCH_STAFF_ROLE } from '@/lib/hooks/use-roles';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, shortenAddress } from '@/lib/utils';

interface StaffRoleManagerProps {
  className?: string;
}

interface StaffMember {
  address: string;
  grantedAt: number;
}

export function StaffRoleManager({ className }: StaffRoleManagerProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

  const { address } = useAccount();
  const { isPlatformAdmin, isLoading: isLoadingRoles } = useRoles();
  const { writeAsync, isPending, reset } = useVoucherManagerWrite();

  const handleGrantRole = useCallback(async () => {
    if (!walletAddress || !isAddress(walletAddress)) {
      setMessage({ type: 'error', text: 'Please enter a valid wallet address' });
      return;
    }

    try {
      setMessage(null);
      await writeAsync('grantRole', [BRANCH_STAFF_ROLE, walletAddress]);
      setMessage({ type: 'success', text: `Successfully granted BRANCH_STAFF_ROLE to ${shortenAddress(walletAddress)}` });
      setStaffMembers((prev) => [
        ...prev,
        { address: walletAddress, grantedAt: Date.now() },
      ]);
      setWalletAddress('');
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to grant role';
      setMessage({ type: 'error', text: errorMessage });
    }
  }, [walletAddress, writeAsync, reset]);

  const handleRevokeRole = useCallback(async (targetAddress: string) => {
    try {
      setMessage(null);
      await writeAsync('revokeRole', [BRANCH_STAFF_ROLE, targetAddress]);
      setMessage({ type: 'success', text: `Successfully revoked BRANCH_STAFF_ROLE from ${shortenAddress(targetAddress)}` });
      setStaffMembers((prev) => prev.filter((s) => s.address !== targetAddress));
      reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to revoke role';
      setMessage({ type: 'error', text: errorMessage });
    }
  }, [writeAsync, reset]);

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

  if (!isPlatformAdmin) {
    return (
      <Card variant="glow" className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-red-400">Access Denied</CardTitle>
          <CardDescription>
            Only platform administrators can manage staff roles.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card variant="glow" className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Staff Role Manager</CardTitle>
        <CardDescription>
          Grant or revoke BRANCH_STAFF_ROLE for wallet addresses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter wallet address (0x...)"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              variant="glow"
              className="flex-1 font-mono"
              error={walletAddress && !isAddress(walletAddress) ? 'Invalid address format' : undefined}
            />
            <Button
              onClick={handleGrantRole}
              disabled={!walletAddress || !isAddress(walletAddress) || isPending}
              loading={isPending}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Grant Role
            </Button>
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
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Current Staff Members</h4>
          {staffMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No staff members added in this session. Staff granted previously are stored on-chain.
            </p>
          ) : (
            <div className="space-y-2">
              {staffMembers.map((staff) => (
                <div
                  key={staff.address}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-mono text-sm text-foreground">
                        {shortenAddress(staff.address, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Granted {new Date(staff.grantedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRevokeRole(staff.address)}
                    disabled={isPending}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> Role changes are recorded on the blockchain and take effect immediately.
            Staff members with BRANCH_STAFF_ROLE can initiate and complete cylinder swaps.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
