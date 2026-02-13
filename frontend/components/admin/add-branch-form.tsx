'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAddBranch, useAssignBranchStaff, useGrantVoucherManagerStaffRole, useGrantCylinderRegistryStaffRole, useGrantGasSwapPlatformStaffRole, useCompanies, useCompany, useBranchCount } from '@/lib/hooks/use-companies';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generateTestWallet, downloadWalletCredentials, type GeneratedWallet } from '@/lib/wallet-generator';
import { registerStaff } from '@/lib/staff-registry';
import { useWalletClient } from 'wagmi';
import { parseEther } from 'viem';

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

type FormStep = 'form' | 'creating-branch' | 'granting-voucher-role' | 'granting-cylinder-role' | 'granting-platform-role' | 'assigning-staff' | 'funding-wallet' | 'complete';

export function AddBranchForm({ className, onSuccess }: AddBranchFormProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [branchName, setBranchName] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [generatedWallet, setGeneratedWallet] = useState<GeneratedWallet | null>(null);
  const [step, setStep] = useState<FormStep>('form');
  const [createdBranchId, setCreatedBranchId] = useState<bigint | null>(null);

  const { data: walletClient } = useWalletClient();
  const { companyIds, isLoading: isLoadingCompanies } = useCompanies();
  const { count: branchCount, refetch: refetchBranchCount } = useBranchCount();
  const {
    addBranch,
    isPending: isAddingBranch,
    isSuccess: isBranchCreated,
    isError: isBranchError,
    error: branchError,
    txHash: branchTxHash,
    reset: resetBranch,
    isAuthorized,
    isLoadingRoles,
  } = useAddBranch();

  const {
    assignStaff,
    isPending: isAssigningStaff,
    isSuccess: isStaffAssigned,
    isError: isStaffError,
    error: staffError,
    txHash: staffTxHash,
    reset: resetStaff,
  } = useAssignBranchStaff();

  const {
    grantStaffRole,
    isPending: isGrantingVoucherRole,
    isSuccess: isVoucherRoleGranted,
    isError: isVoucherRoleError,
    error: voucherRoleError,
    txHash: voucherRoleTxHash,
    reset: resetVoucherRole,
  } = useGrantVoucherManagerStaffRole();

  const {
    grantStaffRole: grantCylinderRole,
    isPending: isGrantingCylinderRole,
    isSuccess: isCylinderRoleGranted,
    isError: isCylinderRoleError,
    error: cylinderRoleError,
    txHash: cylinderRoleTxHash,
    reset: resetCylinderRole,
  } = useGrantCylinderRegistryStaffRole();

  const {
    grantStaffRole: grantPlatformRole,
    isPending: isGrantingPlatformRole,
    isSuccess: isPlatformRoleGranted,
    isError: isPlatformRoleError,
    error: platformRoleError,
    txHash: platformRoleTxHash,
    reset: resetPlatformRole,
  } = useGrantGasSwapPlatformStaffRole();

  useEffect(() => {
    if (isBranchCreated && branchTxHash && step === 'creating-branch') {
      refetchBranchCount().then((result) => {
        const newBranchId = result.data as bigint;
        setCreatedBranchId(newBranchId);
        
        if (generatedWallet) {
          setStep('granting-voucher-role');
          grantStaffRole(generatedWallet.address).catch((err) => {
            setMessage({
              type: 'error',
              text: `Branch created but failed to grant voucher role: ${err.message}`,
            });
            setStep('complete');
          });
        } else {
          setStep('complete');
          setMessage({
            type: 'success',
            text: `Branch "${branchName}" created successfully!`,
          });
        }
      });
    }
  }, [isBranchCreated, branchTxHash, step, generatedWallet, branchName, grantStaffRole, refetchBranchCount]);

  useEffect(() => {
    if (isVoucherRoleGranted && voucherRoleTxHash && step === 'granting-voucher-role' && generatedWallet) {
      setStep('granting-cylinder-role');
      grantCylinderRole(generatedWallet.address).catch((err) => {
        setMessage({
          type: 'error',
          text: `Voucher role granted but failed to grant CylinderRegistry role: ${err.message}`,
        });
        setStep('complete');
      });
    }
  }, [isVoucherRoleGranted, voucherRoleTxHash, step, generatedWallet, grantCylinderRole]);

  useEffect(() => {
    if (isCylinderRoleGranted && cylinderRoleTxHash && step === 'granting-cylinder-role' && generatedWallet) {
      setStep('granting-platform-role');
      grantPlatformRole(generatedWallet.address).catch((err) => {
        setMessage({
          type: 'error',
          text: `CylinderRegistry role granted but failed to grant GasSwapPlatform role: ${err.message}`,
        });
        setStep('complete');
      });
    }
  }, [isCylinderRoleGranted, cylinderRoleTxHash, step, generatedWallet, grantPlatformRole]);

  useEffect(() => {
    if (isPlatformRoleGranted && platformRoleTxHash && step === 'granting-platform-role' && generatedWallet && createdBranchId) {
      setStep('assigning-staff');
      assignStaff(
        generatedWallet.address,
        BigInt(selectedCompanyId),
        createdBranchId
      ).catch((err) => {
        setMessage({
          type: 'error',
          text: `Roles granted but failed to assign to branch: ${err.message}`,
        });
        setStep('complete');
      });
    }
  }, [isPlatformRoleGranted, platformRoleTxHash, step, generatedWallet, selectedCompanyId, createdBranchId, assignStaff]);

  useEffect(() => {
    if (isStaffAssigned && staffTxHash && step === 'assigning-staff' && generatedWallet) {
      setStep('funding-wallet');
      (async () => {
        try {
          const response = await fetch('http://127.0.0.1:8545', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'hardhat_setBalance',
              params: [generatedWallet.address, '0x8AC7230489E80000'],
              id: Date.now(),
            }),
          });
          const result = await response.json();
          if (result.error) {
            throw new Error(result.error.message);
          }
          setStep('complete');
          setMessage({
            type: 'success',
            text: `Branch "${branchName}" created, manager wallet assigned and funded with 10 ETH!`,
          });
          registerStaff({
            address: generatedWallet.address,
            privateKey: generatedWallet.privateKey,
            companyId: Number(selectedCompanyId),
            branchId: Number(createdBranchId),
            branchName,
            district: selectedDistrictId ? RWANDA_DISTRICTS[parseInt(selectedDistrictId)]?.name : undefined,
            createdAt: new Date().toISOString(),
          });
        } catch {
          try {
            if (walletClient) {
              await walletClient.sendTransaction({
                to: generatedWallet.address,
                value: parseEther('10'),
              });
              setStep('complete');
              setMessage({
                type: 'success',
                text: `Branch "${branchName}" created, manager wallet assigned and funded with 10 ETH!`,
              });
              registerStaff({
                address: generatedWallet.address,
                privateKey: generatedWallet.privateKey,
                companyId: Number(selectedCompanyId),
                branchId: Number(createdBranchId),
                branchName,
                district: selectedDistrictId ? RWANDA_DISTRICTS[parseInt(selectedDistrictId)]?.name : undefined,
                createdAt: new Date().toISOString(),
              });
              return;
            }
          } catch {}
          setStep('complete');
          setMessage({
            type: 'error',
            text: `Branch "${branchName}" created and manager assigned, but auto-funding failed. Please fund the wallet manually using: FUND_ADDRESS=${generatedWallet.address} npx hardhat run scripts/fund-wallet.js --network localhost`,
          });
        }
      })();
    } else if (isStaffAssigned && staffTxHash && step === 'assigning-staff') {
      setStep('complete');
      setMessage({
        type: 'success',
        text: `Branch "${branchName}" created and manager wallet assigned successfully!`,
      });
    }
  }, [isStaffAssigned, staffTxHash, step, branchName, generatedWallet, walletClient]);

  useEffect(() => {
    if (isBranchError && branchError) {
      setMessage({
        type: 'error',
        text: branchError.message || 'Failed to create branch',
      });
      setStep('form');
    }
  }, [isBranchError, branchError]);

  useEffect(() => {
    if (isStaffError && staffError) {
      setMessage({
        type: 'error',
        text: `Branch created but staff assignment failed: ${staffError.message}`,
      });
      setStep('complete');
    }
  }, [isStaffError, staffError]);

  useEffect(() => {
    if (isVoucherRoleError && voucherRoleError) {
      setMessage({
        type: 'error',
        text: `Branch created but voucher role grant failed: ${voucherRoleError.message}`,
      });
      setStep('complete');
    }
  }, [isVoucherRoleError, voucherRoleError]);

  useEffect(() => {
    if (isCylinderRoleError && cylinderRoleError) {
      setMessage({
        type: 'error',
        text: `Branch created but CylinderRegistry role grant failed: ${cylinderRoleError.message}`,
      });
      setStep('complete');
    }
  }, [isCylinderRoleError, cylinderRoleError]);

  useEffect(() => {
    if (isPlatformRoleError && platformRoleError) {
      setMessage({
        type: 'error',
        text: `Branch created but GasSwapPlatform role grant failed: ${platformRoleError.message}`,
      });
      setStep('complete');
    }
  }, [isPlatformRoleError, platformRoleError]);

  const handleGenerateWallet = useCallback(() => {
    const wallet = generateTestWallet();
    setGeneratedWallet(wallet);
    setMessage({
      type: 'success',
      text: 'Manager wallet generated! Save the credentials before submitting.',
    });
  }, []);

  const handleDownloadCredentials = useCallback(() => {
    if (generatedWallet && branchName) {
      downloadWalletCredentials(generatedWallet, branchName);
    }
  }, [generatedWallet, branchName]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      resetBranch();
      resetStaff();
      resetVoucherRole();

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

      const district = RWANDA_DISTRICTS.find(d => d.id.toString() === selectedDistrictId);
      if (!district) {
        setMessage({ type: 'error', text: 'Invalid district selected' });
        return;
      }

      try {
        setStep('creating-branch');
        await addBranch(
          BigInt(selectedCompanyId),
          branchName.trim(),
          district.name,
          location.trim() || district.name
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add branch';
        setMessage({ type: 'error', text: errorMessage });
        setStep('form');
      }
    },
    [selectedCompanyId, branchName, selectedDistrictId, location, addBranch, resetBranch, resetStaff, resetVoucherRole]
  );

  const handleReset = useCallback(() => {
    setBranchName('');
    setSelectedDistrictId('');
    setLocation('');
    setGeneratedWallet(null);
    setMessage(null);
    setStep('form');
    setCreatedBranchId(null);
    resetBranch();
    resetStaff();
    resetVoucherRole();
  }, [resetBranch, resetStaff, resetVoucherRole]);

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

  const isPending = isAddingBranch || isGrantingVoucherRole || isAssigningStaff;
  const isComplete = step === 'complete' && message?.type === 'success';

  return (
    <Card variant="glow" className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>Add New Branch</CardTitle>
        <CardDescription>
          Add a new branch location for a registered company. A manager wallet will be generated for testing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isComplete ? (
          <div className="space-y-6">
            <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/30 text-green-400">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{message?.text}</span>
              </div>
              {branchTxHash && (
                <p className="text-xs font-mono break-all mt-2">
                  Branch TX: {branchTxHash}
                </p>
              )}
              {voucherRoleTxHash && (
                <p className="text-xs font-mono break-all mt-1">
                  VoucherManager Role TX: {voucherRoleTxHash}
                </p>
              )}
              {staffTxHash && (
                <p className="text-xs font-mono break-all mt-1">
                  Branch Assignment TX: {staffTxHash}
                </p>
              )}
            </div>

            {generatedWallet && (
              <div className="p-4 rounded-lg border bg-purple-500/10 border-purple-500/30">
                <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Branch Manager Wallet
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Address:</span>
                    <p className="font-mono text-foreground break-all">{generatedWallet.address}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Private Key:</span>
                    <p className="font-mono text-foreground break-all text-xs">{generatedWallet.privateKey}</p>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-yellow-400 text-xs">
                    <strong>⚠️ Important:</strong> Download and save these credentials! The private key cannot be recovered.
                    Import this wallet into MetaMask to access the branch manager dashboard.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleDownloadCredentials}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Wallet Credentials
                </Button>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleReset} className="flex-1">
                Add Another Branch
              </Button>
              <Button variant="outline" onClick={onSuccess} className="flex-1">
                Back to Dashboard
              </Button>
            </div>
          </div>
        ) : (
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
                placeholder="e.g., Ngoma Manager"
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Location (Optional)
              </label>
              <Input
                placeholder="e.g., Main Street, Near Market"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                variant="glow"
                disabled={isPending}
              />
            </div>

            <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Branch Manager Wallet
              </h4>
              
              {generatedWallet ? (
                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Generated Address:</span>
                    <p className="font-mono text-green-400 text-xs break-all mt-1">{generatedWallet.address}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadCredentials}
                      disabled={!branchName.trim()}
                      className="flex-1"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateWallet}
                      className="flex-1"
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Generate a test wallet for the branch manager. They will use this to access their dashboard.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateWallet}
                    className="w-full"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Generate Manager Wallet
                  </Button>
                </div>
              )}
            </div>

            {message && step === 'form' && (
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

            {step !== 'form' && step !== 'complete' && (
              <div className="p-4 rounded-lg border bg-cyan-500/10 border-cyan-500/30">
                <div className="flex items-center gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-cyan-500 border-t-transparent rounded-full" />
                  <span className="text-cyan-400">
                    {step === 'creating-branch' && 'Step 1/6: Creating branch on blockchain...'}
                    {step === 'granting-voucher-role' && 'Step 2/6: Granting staff role on VoucherManager...'}
                    {step === 'granting-cylinder-role' && 'Step 3/6: Granting staff role on CylinderRegistry...'}
                    {step === 'granting-platform-role' && 'Step 4/6: Granting staff role on GasSwapPlatform...'}
                    {step === 'assigning-staff' && 'Step 5/6: Assigning manager to branch...'}
                    {step === 'funding-wallet' && 'Step 6/6: Funding manager wallet with test ETH...'}
                  </span>
                </div>
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
              {generatedWallet ? 'Add Branch & Assign Manager' : 'Add Branch'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
