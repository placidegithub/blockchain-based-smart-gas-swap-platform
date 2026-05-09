'use client';

import { useState, useEffect } from 'react';
import { useInitiateSwap, useCompanies, useCompany, useBranches, useBranch, useCylinderTypes, useAvailableCylindersAtBranch, useCurrentStaffInfo, useRoles, useCylinderTypesForCompany, useCylinderType } from '@/lib/hooks';
import { useWallet } from '@/lib/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn, formatVoucherId, saveVoucherIdMapping } from '@/lib/utils';
import { sendVoucherNotification } from '@/lib/notifications';
import { PaymentForm } from '@/components/payment';
import { getCylinderPrice, formatRWF } from '@/lib/payment';
import { saveRecentVoucher } from '@/lib/hooks/use-recent-vouchers';
import QRCode from 'qrcode';

interface InitiateSwapFormProps {
  onSuccess?: (voucherId: bigint) => void;
  className?: string;
}

const CYLINDER_TYPES = [
  { id: 1n, name: '6kg', label: '6 kg Cylinder' },
  { id: 2n, name: '12kg', label: '12 kg Cylinder' },
  { id: 3n, name: '15kg', label: '15 kg Cylinder' },
];

function detectCylinderTypeFromSerial(serial: string): bigint | null {
  const upperSerial = serial.toUpperCase();
  if (upperSerial.includes('15KG') || upperSerial.includes('15-KG')) {
    return 3n;
  } else if (upperSerial.includes('12KG') || upperSerial.includes('12-KG')) {
    return 2n;
  } else if (upperSerial.includes('6KG') || upperSerial.includes('6-KG')) {
    return 1n;
  }
  return null;
}

function getCompanyCodeFromSerial(serial: string): string | null {
  const match = serial.toUpperCase().match(/CYL-C(\d+)-/);
  return match ? match[1] : null;
}

function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  // Rwanda phone format: +250 or 07/08 followed by 8 digits
  return /^(\+250|0)[7-8][0-9]{8}$/.test(phone.replace(/\s/g, ''));
}

function generateWalletFromPhone(phone: string): string {
  // Generate a deterministic wallet address from phone number
  // This creates a pseudo-address for customers without wallets
  const cleanPhone = phone.replace(/\D/g, '');
  const hash = cleanPhone.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  // Create a valid-looking address (not a real wallet, just for tracking)
  return `0x${cleanPhone.padStart(12, '0')}${hexHash}${'0'.repeat(40 - 12 - hexHash.length)}`.slice(0, 42);
}



function saveVoucherMetadata(key: string, metadata: { cylinderSerial: string; cylinderCondition: 'empty' | 'full' }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`voucher_meta_${key}`, JSON.stringify(metadata));
    
    // Also save by cylinder serial for lookup
    localStorage.setItem(`voucher_serial_${metadata.cylinderSerial}`, JSON.stringify(metadata));
  } catch (e) {
    console.error('Failed to save voucher metadata:', e);
  }
}

export function InitiateSwapForm({ onSuccess, className }: InitiateSwapFormProps) {
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cylinderSerial, setCylinderSerial] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<bigint | undefined>();
  const [selectedBranchId, setSelectedBranchId] = useState<bigint | undefined>();
  const [selectedCylinderType, setSelectedCylinderType] = useState<bigint>(1n);
  const [cylinderCondition, setCylinderCondition] = useState<'empty' | 'full'>('empty');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [createdVoucherId, setCreatedVoucherId] = useState<bigint | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notificationStatus, setNotificationStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  
  // Get staff's connected wallet address to prevent using it as customer address
  const { address: staffAddress } = useWallet();
  const [paymentTransactionRef, setPaymentTransactionRef] = useState<string>('');
  const [notificationSent, setNotificationSent] = useState(false);

  const { companyIds, isLoading: isLoadingCompanies } = useCompanies();
  const { branchIds, isLoading: isLoadingBranches } = useBranches(selectedCompanyId);
  const { cylinderTypes, isLoading: isLoadingCylinderTypes } = useCylinderTypes();
  const { typeIds: companyCylinderTypeIds, isLoading: isLoadingCompanyCylinderTypes } = useCylinderTypesForCompany(selectedCompanyId);
  const { cylinderType: selectedCylinderTypeData } = useCylinderType(selectedCylinderType);
  const { serialNumbers: availableCylinders, isLoading: isLoadingCylinders } = useAvailableCylindersAtBranch(selectedBranchId);
  const { initiateSwap, isPending, isSuccess, isError, error, txHash, voucherId: createdVoucherIdFromChain, reset, isAuthorized, isLoadingRoles } = useInitiateSwap();
  const { company: selectedCompanyData } = useCompany(selectedCompanyId);
  const { branch: selectedBranchData } = useBranch(selectedBranchId);
  const { companyId: staffCompanyId, branchId: staffBranchId, company: staffCompany, branch: staffBranch, isStaffAssigned } = useCurrentStaffInfo();
  const { isPlatformAdmin } = useRoles();

  useEffect(() => {
    if (selectedCompanyId === undefined) {
      setSelectedBranchId(undefined);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (companyCylinderTypeIds.length > 0 && !companyCylinderTypeIds.includes(selectedCylinderType)) {
      setSelectedCylinderType(companyCylinderTypeIds[0]);
    }
  }, [companyCylinderTypeIds, selectedCylinderType]);

  useEffect(() => {
    if (selectedBranchId === undefined) {
      setCylinderSerial('');
    }
  }, [selectedBranchId]);

  useEffect(() => {
    if (isStaffAssigned && !isPlatformAdmin) {
      if (staffCompanyId && !selectedCompanyId) {
        setSelectedCompanyId(staffCompanyId);
      }
      if (staffBranchId && !selectedBranchId) {
        setSelectedBranchId(staffBranchId);
      }
    }
  }, [isStaffAssigned, isPlatformAdmin, staffCompanyId, staffBranchId, selectedCompanyId, selectedBranchId]);

  const handleCylinderSerialChange = (serial: string) => {
    setCylinderSerial(serial);
    
    // Auto-detect and set cylinder type from serial number
    const detectedType = detectCylinderTypeFromSerial(serial);
    if (detectedType !== null) {
      const companyTypeId = companyCylinderTypeIds[Number(detectedType) - 1];
      setSelectedCylinderType(companyTypeId ?? detectedType);
    }
  };

  useEffect(() => {
    if (isSuccess && txHash && createdVoucherIdFromChain && !notificationSent) {
      // Use actual voucher ID from blockchain
      setCreatedVoucherId(createdVoucherIdFromChain);
      setNotificationSent(true);
      
      // Save formatted-to-numeric ID mapping for manual redemption
      saveVoucherIdMapping(createdVoucherIdFromChain.toString());
      
      // Save voucher metadata for later display
      saveVoucherMetadata(createdVoucherIdFromChain.toString(), {
        cylinderSerial,
        cylinderCondition,
      });
      
      // Save to recent vouchers for phone-based lookup
      if (customerPhone) {
        saveRecentVoucher(createdVoucherIdFromChain, customerPhone);
      }
      
      handleVoucherCreated(createdVoucherIdFromChain.toString());
      // Show payment form after voucher creation
      setShowPayment(true);
    }
  }, [isSuccess, txHash, createdVoucherIdFromChain, notificationSent, customerPhone]);

  const generateQRCode = async (voucherId: string): Promise<string | null> => {
    try {
      // Generate a verification URL that staff can scan
      const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/vouchers/verify/${voucherId}`;
      const dataUrl = await QRCode.toDataURL(verifyUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0e7490',
          light: '#ffffff',
        },
      });
      setQrCodeDataUrl(dataUrl);
      return dataUrl;
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      return null;
    }
  };

  const handleVoucherCreated = async (voucherId: string) => {
    console.log('handleVoucherCreated called with:', voucherId);
    console.log('Customer info:', { customerEmail, customerPhone, customerName });
    
    const qrDataUrl = await generateQRCode(voucherId);
    const formattedId = formatVoucherId(voucherId);
    
    // Always try to send notification if we have email or phone
    if (customerEmail || customerPhone) {
      setNotificationStatus('sending');
      try {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        const cylinderTypeLabel = getCylinderTypeLabel();
        const serviceFee = getCylinderPrice(cylinderTypeLabel);
        
        const notificationData = {
          voucherId: formattedId,
          customerName: customerName || 'Customer',
          customerEmail: customerEmail || '',
          customerPhone: customerPhone || '',
          companyName: selectedCompanyData?.name || 'Gas Company',
          branchName: selectedBranchData?.name || 'Source Branch',
          cylinderType: cylinderTypeLabel,
          expiresAt,
          qrCodeDataUrl: qrDataUrl || undefined,
          serviceFee: serviceFee > 0 ? formatRWF(serviceFee) : undefined,
          paymentStatus: 'Pending',
        };
        
        console.log('Sending notification with data:', notificationData);
        
        const result = await sendVoucherNotification(notificationData);
        console.log('Notification result:', result);
        
        if (result.success) {
          setNotificationStatus('sent');
        } else {
          console.error('Notification failed:', result.error);
          setNotificationStatus('error');
        }
      } catch (err) {
        console.error('Failed to send notification:', err);
        setNotificationStatus('error');
      }
    } else {
      console.log('No email or phone provided, skipping notification');
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }

    if (!customerEmail) {
      errors.customerEmail = 'Customer email is required';
    } else if (!isValidEmail(customerEmail)) {
      errors.customerEmail = 'Invalid email address';
    }

    if (!customerPhone) {
      errors.customerPhone = 'Customer phone number is required';
    } else if (!isValidPhone(customerPhone)) {
      errors.customerPhone = 'Invalid phone number (format: 07XXXXXXXX or +250XXXXXXXXX)';
    }

    if (customerAddress) {
      if (!isValidAddress(customerAddress)) {
        errors.customerAddress = 'Invalid wallet address (must start with 0x and be 42 characters)';
      } else if (staffAddress && customerAddress.toLowerCase() === staffAddress.toLowerCase()) {
        errors.customerAddress = 'You cannot use your own wallet address as the customer address. Please enter the customer\'s wallet address or leave empty to auto-generate from phone number.';
      }
    }

    if (selectedCompanyId && cylinderSerial.trim()) {
      const serialCompanyCode = getCompanyCodeFromSerial(cylinderSerial);
      if (serialCompanyCode && serialCompanyCode !== selectedCompanyId.toString().padStart(2, '0')) {
        errors.cylinderSerial = `This cylinder belongs to Company ${serialCompanyCode}, not your company. Use a cylinder registered to your company.`;
      }
    }

    if (!selectedCompanyId) {
      errors.company = 'Please select a company';
    }

    if (!selectedBranchId) {
      errors.branch = 'Please select a branch';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedBranchId) return;

    try {
      // Use provided wallet or generate a deterministic address from phone number
      const walletAddress = customerAddress || generateWalletFromPhone(customerPhone);
      
      await initiateSwap({
        customer: walletAddress as `0x${string}`,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        cylinderSerialNumber: cylinderSerial.trim() || undefined,
        companyId: selectedCompanyId,
        cylinderTypeId: selectedCylinderType,
        branchId: selectedBranchId,
      });
    } catch (err: any) {
      console.error('Failed to initiate swap:', err);
      const errorMessage = err?.message || 'An error occurred';
      if (errorMessage.includes('Cylinder not registered')) {
        setFormErrors({ submit: 'This cylinder serial number is not registered in the system. Contact an administrator.' });
      } else if (errorMessage.includes('Company mismatch')) {
        setFormErrors({ submit: 'This cylinder belongs to a different company than the selected branch.' });
      } else if (errorMessage.includes('Invalid branch')) {
        setFormErrors({ submit: 'The selected branch is not valid or active.' });
      } else if (errorMessage.includes('Cylinder is retired')) {
        setFormErrors({ submit: 'This cylinder has been retired and cannot be used.' });
      } else if (errorMessage.includes('Insufficient SepoliaETH') || errorMessage.toLowerCase().includes('insufficient funds')) {
        setFormErrors({ submit: 'The connected staff wallet does not have enough SepoliaETH to pay the network fee. Fund the wallet with Sepolia test ETH and try again.' });
      } else if (errorMessage.includes('AccessControlUnauthorizedAccount') || errorMessage.includes('missing role')) {
        setFormErrors({ submit: 'This staff wallet is missing the required VoucherManager staff role. Ask the admin to grant staff roles again for this branch manager.' });
      } else if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        setFormErrors({ submit: 'Transaction was rejected. Please try again and confirm in MetaMask.' });
      } else {
        setFormErrors({ submit: `Failed to create voucher: ${errorMessage.slice(0, 100)}` });
      }
    }
  };

  const handleReset = () => {
    setCustomerAddress('');
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setCylinderSerial('');
    setSelectedCompanyId(undefined);
    setSelectedBranchId(undefined);
    setSelectedCylinderType(1n);
    setCylinderCondition('empty');
    setQrCodeDataUrl(null);
    setCreatedVoucherId(null);
    setFormErrors({});
    setNotificationStatus('idle');
    setNotificationSent(false);
    setShowPayment(false);
    setPaymentCompleted(false);
    setPaymentTransactionRef('');
    reset();
  };

  const handlePaymentComplete = (transactionRef: string) => {
    setPaymentTransactionRef(transactionRef);
    setPaymentCompleted(true);
    setShowPayment(false);
    if (createdVoucherId) {
      onSuccess?.(createdVoucherId);
    }
  };

  const handleSkipPayment = () => {
    setShowPayment(false);
    if (createdVoucherId) {
      onSuccess?.(createdVoucherId);
    }
  };

  const getCylinderTypeLabel = (): string => {
    if (selectedCylinderTypeData) {
      return `${Number(selectedCylinderTypeData.weightKg)} kg Cylinder`;
    }
    // First try matching from the contract cylinder types (handles per-company IDs)
    const contractType = cylinderTypes.find(t => t.id === selectedCylinderType);
    if (contractType) {
      return `${Number(contractType.weightKg)} kg Cylinder`;
    }
    // Fallback to static list (IDs 1-3)
    const staticType = CYLINDER_TYPES.find(t => t.id === selectedCylinderType);
    if (staticType) {
      return staticType.label;
    }
    // Last resort: detect from cylinder serial
    if (cylinderSerial) {
      if (cylinderSerial.toLowerCase().includes('15kg')) return '15 kg Cylinder';
      if (cylinderSerial.toLowerCase().includes('12kg')) return '12 kg Cylinder';
      if (cylinderSerial.toLowerCase().includes('6kg')) return '6 kg Cylinder';
    }
    return '6 kg Cylinder';
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
          <CardDescription>You must be a branch staff member or platform admin to initiate swaps.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Show payment form after voucher creation
  if (isSuccess && createdVoucherId && showPayment) {
    return (
      <div className={cn('w-full max-w-lg space-y-4', className)}>
        <Card variant="glow">
          <CardHeader>
            <CardTitle className="text-green-400">Voucher Created!</CardTitle>
            <CardDescription>Now collect payment from the customer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span className="text-foreground">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cylinder:</span>
              <span className="text-foreground">{getCylinderTypeLabel()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Due:</span>
              <span className="text-xl font-bold text-cyan-400">{formatRWF(getCylinderPrice(getCylinderTypeLabel()))}</span>
            </div>
          </CardContent>
        </Card>
        
        <PaymentForm
          voucherId={createdVoucherId.toString()}
          customerName={customerName}
          customerPhone={customerPhone}
          cylinderType={getCylinderTypeLabel()}
          branchId={staffBranch?.id?.toString() || selectedBranchId?.toString()}
          companyId={staffCompany?.id?.toString() || selectedCompanyId?.toString()}
          onPaymentComplete={handlePaymentComplete}
          onSkip={handleSkipPayment}
        />
      </div>
    );
  }

  // Show success screen after payment
  if (isSuccess && createdVoucherId && !showPayment) {
    return (
      <Card variant="glow" className={cn('w-full max-w-lg', className)}>
        <CardHeader>
          <CardTitle className="text-green-400">Swap Initiated Successfully!</CardTitle>
          <CardDescription>The voucher has been created and recorded on the blockchain.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-background/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Voucher ID:</span>
              <span className="font-mono text-cyan-400">{formatVoucherId(createdVoucherId)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer:</span>
              <span className="text-foreground">{customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cylinder:</span>
              <span className="text-foreground">{getCylinderTypeLabel()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction:</span>
              <span className="font-mono text-cyan-400 text-sm truncate max-w-[200px]">{txHash}</span>
            </div>
          </div>

          {/* Payment Status */}
          {paymentCompleted && (
            <div className="p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Payment received: {formatRWF(getCylinderPrice(getCylinderTypeLabel()))} (Ref: {paymentTransactionRef})</span>
            </div>
          )}

          {/* Notification Status */}
          <div className={cn(
            'p-3 rounded-lg border text-sm flex items-center gap-2',
            notificationStatus === 'sending' && 'bg-blue-500/10 border-blue-500/30 text-blue-400',
            notificationStatus === 'sent' && 'bg-green-500/10 border-green-500/30 text-green-400',
            notificationStatus === 'error' && 'bg-red-500/10 border-red-500/30 text-red-400',
            notificationStatus === 'idle' && 'bg-gray-500/10 border-gray-500/30 text-gray-400'
          )}>
            {notificationStatus === 'sending' && (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span>Sending notifications to {customerEmail} and {customerPhone}...</span>
              </>
            )}
            {notificationStatus === 'sent' && (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Notifications sent! Customer received email with QR code and SMS.</span>
              </>
            )}
            {notificationStatus === 'error' && (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Failed to send notifications. Voucher was created successfully.</span>
              </>
            )}
          </div>

          {qrCodeDataUrl && (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground">Scan QR Code for Redemption at Destination</p>
              <img src={qrCodeDataUrl} alt="Voucher QR Code" className="rounded-lg border border-border" />
              <p className="text-xs text-muted-foreground text-center">
                This QR code has been sent to the customer&apos;s email for easy redemption.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleReset} variant="outline" className="w-full">
            Create Another Voucher
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card variant="glow" className={cn('w-full max-w-lg', className)}>
      <CardHeader>
        <CardTitle>Initiate Gas Cylinder Swap</CardTitle>
        <CardDescription>Create a new voucher for a customer depositing their empty cylinder.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Customer Information Section */}
          <div className="border border-cyan-500/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400">Customer Information</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name *</label>
              <Input
                variant="glow"
                placeholder="Enter customer full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                error={formErrors.customerName}
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address *</label>
                <Input
                  variant="glow"
                  type="email"
                  placeholder="customer@email.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  error={formErrors.customerEmail}
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number *</label>
                <Input
                  variant="glow"
                  type="tel"
                  placeholder="07XXXXXXXX"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  error={formErrors.customerPhone}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Customer Wallet Address <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input
                variant="glow"
                placeholder="0x... (ask customer for their MetaMask address)"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                error={formErrors.customerAddress}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                <strong>Important:</strong> Ask the customer for their MetaMask wallet address. 
                Do NOT use your own wallet. If customer doesn&apos;t have a wallet, leave empty to auto-generate from phone.
              </p>
            </div>
          </div>

          {/* Cylinder Information Section */}
          <div className="border border-cyan-500/20 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-cyan-400">Cylinder Information</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company</label>
              {isStaffAssigned && !isPlatformAdmin ? (
                <div className="flex w-full h-10 px-4 py-2 rounded-lg bg-input border border-cyan-500/30 text-foreground items-center">
                  <span>{staffCompany?.name || 'Your Company'} ({staffCompany?.code || '...'})</span>
                </div>
              ) : (
                <select
                  className="flex w-full h-10 px-4 py-2 rounded-lg bg-input border border-cyan-500/30 text-foreground focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                  value={selectedCompanyId?.toString() ?? ''}
                  onChange={(e) => setSelectedCompanyId(e.target.value ? BigInt(e.target.value) : undefined)}
                  disabled={isPending || isLoadingCompanies}
                >
                  <option value="">Select a company</option>
                  {companyIds.map((id) => (
                    <CompanyOption key={id.toString()} companyId={id} />
                  ))}
                </select>
              )}
              {formErrors.company && <p className="text-xs text-red-500">{formErrors.company}</p>}
            </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Branch</label>
            {isStaffAssigned && !isPlatformAdmin ? (
              <div className="flex w-full h-10 px-4 py-2 rounded-lg bg-input border border-cyan-500/30 text-foreground items-center">
                <span>{staffBranch?.name || 'Your Branch'}</span>
              </div>
            ) : (
              <select
                className="flex w-full h-10 px-4 py-2 rounded-lg bg-input border border-cyan-500/30 text-foreground focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                value={selectedBranchId?.toString() ?? ''}
                onChange={(e) => setSelectedBranchId(e.target.value ? BigInt(e.target.value) : undefined)}
                disabled={isPending || !selectedCompanyId || isLoadingBranches}
              >
                <option value="">Select a branch</option>
                {branchIds.map((id) => (
                  <BranchOption key={id.toString()} branchId={id} />
                ))}
              </select>
            )}
            {formErrors.branch && <p className="text-xs text-red-500">{formErrors.branch}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Cylinder Serial Number <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            {!selectedBranchId ? (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600/30 text-slate-400 text-sm">
                Please select a branch first to see available cylinders.
              </div>
            ) : isLoadingCylinders ? (
              <div className="p-3 rounded-lg bg-slate-800/50 border border-cyan-500/30 text-cyan-400 text-sm flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full" />
                Loading available cylinders...
              </div>
            ) : availableCylinders.length > 0 ? (
              <>
                <select
                  className="flex w-full h-10 px-4 py-2 rounded-lg bg-input border border-cyan-500/30 text-foreground focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                  value={cylinderSerial}
                  onChange={(e) => handleCylinderSerialChange(e.target.value)}
                  disabled={isPending}
                >
                  <option value="">Select a cylinder</option>
                  {availableCylinders.map((serial) => (
                    <option key={serial} value={serial}>
                      {serial}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {availableCylinders.length} cylinder(s) available at this branch. Cylinder type will be auto-detected.
                </p>
              </>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                  <p className="font-medium">No pre-registered cylinders at this branch</p>
                  <p className="text-xs mt-1 text-yellow-300">
                    You can manually enter the serial number from the customer&apos;s cylinder, or leave it blank and choose the cylinder type below.
                  </p>
                </div>
                <Input
                  variant="glow"
                  placeholder={`Optional serial number (e.g., CYL-C${(selectedCompanyId || 1n).toString().padStart(2, '0')}-B001-12kg-001)`}
                  value={cylinderSerial}
                  onChange={(e) => handleCylinderSerialChange(e.target.value)}
                  disabled={isPending}
                />
              </>
            )}
            {formErrors.cylinderSerial && <p className="text-xs text-red-500">{formErrors.cylinderSerial}</p>}
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cylinder Type</label>
                <select
                  className="flex w-full h-10 px-4 py-2 rounded-lg bg-input border border-cyan-500/30 text-foreground focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                  value={selectedCylinderType.toString()}
                  onChange={(e) => setSelectedCylinderType(BigInt(e.target.value))}
                  disabled={isPending || isLoadingCompanyCylinderTypes || isLoadingCylinderTypes}
                >
                  {companyCylinderTypeIds.length > 0 ? (
                    companyCylinderTypeIds.map((typeId) => (
                      <CylinderTypeOption key={typeId.toString()} typeId={typeId} />
                    ))
                  ) : (
                    (cylinderTypes.length > 0 ? cylinderTypes : CYLINDER_TYPES).map((type) => (
                      <option key={type.id.toString()} value={type.id.toString()}>
                        {'label' in type ? type.label : `${type.name} (${Number(type.weightKg)}kg)`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Cylinder Condition *</label>
                <select
                  className="flex w-full h-10 px-4 py-2 rounded-lg bg-input border border-cyan-500/30 text-foreground focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-50"
                  value={cylinderCondition}
                  onChange={(e) => setCylinderCondition(e.target.value as 'empty' | 'full')}
                  disabled={isPending}
                >
                  <option value="empty">Empty Cylinder</option>
                  <option value="full">Full Cylinder</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Is the customer depositing an empty or full cylinder?
                </p>
              </div>
            </div>
          </div>
          {/* End of Cylinder Information Section */}

          {isError && error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error.message || 'An error occurred while initiating the swap'}
            </div>
          )}

          {formErrors.submit && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {formErrors.submit}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            * Customer will receive notification via email (with QR code) and SMS when voucher is created.
          </p>
        </CardContent>
        <CardFooter>
          <Button type="submit" loading={isPending} className="w-full">
            {isPending ? 'Creating Voucher...' : 'Create Voucher'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function CompanyOption({ companyId }: { companyId: bigint }) {
  const { company, isLoading } = useCompany(companyId);
  
  if (isLoading || !company) {
    return <option value={companyId.toString()}>Loading...</option>;
  }
  
  return (
    <option value={companyId.toString()}>
      {company.name} ({company.code})
    </option>
  );
}

function BranchOption({ branchId }: { branchId: bigint }) {
  const { branch, isLoading } = useBranch(branchId);
  
  if (isLoading || !branch) {
    return <option value={branchId.toString()}>Loading...</option>;
  }
  
  return (
    <option value={branchId.toString()}>
      {branch.name}
    </option>
  );
}

function CylinderTypeOption({ typeId }: { typeId: bigint }) {
  const { cylinderType, isLoading } = useCylinderType(typeId);

  if (isLoading || !cylinderType) {
    return <option value={typeId.toString()}>Loading...</option>;
  }

  const label = `${Number(cylinderType.weightKg)} kg Cylinder`;

  return (
    <option value={typeId.toString()}>
      {label}
    </option>
  );
}
