'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Package, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RoleGuard } from '@/components/wallet/role-guard';
import { VoucherScanner } from '@/components/vouchers';
import {
  useVerifyVoucher,
  useVoucher,
} from '@/lib/hooks/use-vouchers';
import { useVoucherCustomerInfo } from '@/lib/hooks/use-recent-vouchers';
import { useCompleteSwap } from '@/lib/hooks/use-swap';
import { useCompany, useBranch, useBranchByCompanyAndDistrict } from '@/lib/hooks/use-companies';
import { useCylinderTypes, useCylinderType, useAvailableCylindersAtBranch } from '@/lib/hooks/use-cylinders';
import { cn, formatVoucherId, saveVoucherIdMapping } from '@/lib/utils';
import { formatRWF, getVoucherPaymentStatus } from '@/lib/payment';
import { getRecentVoucherIds } from '@/lib/hooks/use-recent-vouchers';

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

export default function RedeemVoucherPage() {
  useEffect(() => {
    const recent = getRecentVoucherIds(50);
    recent.forEach((v) => saveVoucherIdMapping(v.voucherId));
  }, []);

  const [scannedVoucherId, setScannedVoucherId] = useState<string | null>(null);
  const [redeemedVoucherIds, setRedeemedVoucherIds] = useState<Set<string>>(new Set());
  const [voucherIdBigInt, setVoucherIdBigInt] = useState<bigint | undefined>();
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [newCylinderSerial, setNewCylinderSerial] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [redemptionSuccess, setRedemptionSuccess] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<{
    sent: boolean;
    message: string;
  } | null>(null);
  const [notificationSent, setNotificationSent] = useState(false);

  const { verification, isLoading: isVerifying } = useVerifyVoucher(voucherIdBigInt);
  const { voucher, isLoading: isLoadingVoucher } = useVoucher(voucherIdBigInt);
  const { customerInfo, isLoading: isLoadingCustomer } = useVoucherCustomerInfo(voucherIdBigInt);
  const { company, isLoading: isLoadingCompany } = useCompany(voucher?.companyId);
  const { branch: sourceBranch, isLoading: isLoadingSourceBranch } = useBranch(voucher?.sourceBranchId);
  // Get the single branch for this company in the selected district
  const { branchId: companyDistrictBranchId, isLoading: isLoadingCompanyBranch } = useBranchByCompanyAndDistrict(
    voucher?.companyId,
    selectedDistrictId ? Number(selectedDistrictId) : undefined
  );
  
  // Auto-select the branch when district is selected (since there's only one per company per district)
  useEffect(() => {
    if (companyDistrictBranchId && selectedDistrictId) {
      setSelectedBranchId(companyDistrictBranchId.toString());
    }
  }, [companyDistrictBranchId, selectedDistrictId]);
  const { cylinderTypes, isLoading: isLoadingCylinderTypes } = useCylinderTypes();
  const { cylinderType: cylinderTypeInfo, isLoading: isLoadingCylinderType } = useCylinderType(voucher?.cylinderTypeId);
  const { branch: destinationBranch } = useBranch(selectedBranchId ? BigInt(selectedBranchId) : undefined);
  const { serialNumbers: availableCylinders, isLoading: isLoadingAvailableCylinders } = useAvailableCylindersAtBranch(
    selectedBranchId ? BigInt(selectedBranchId) : undefined
  );

  const {
    completeSwap,
    isPending: isRedeeming,
    isSuccess: isRedeemSuccess,
    isError: isRedeemError,
    error: redeemError,
    txHash,
    reset: resetSwap,
  } = useCompleteSwap();

  const cylinderType = useMemo(() => {
    if (cylinderTypeInfo) {
      return {
        name: cylinderTypeInfo.sizeName,
        weightKg: cylinderTypeInfo.weightKg,
      };
    }
    if (voucher?.cylinderTypeId && cylinderTypes.length > 0) {
      const found = cylinderTypes.find((t) => t.id === voucher.cylinderTypeId);
      if (found) {
        return {
          name: found.name,
          weightKg: found.weightKg,
        };
      }
    }
    return null;
  }, [cylinderTypeInfo, voucher?.cylinderTypeId, cylinderTypes]);

  // Filter available cylinders to only show ones matching the voucher's cylinder type
  const filteredCylinders = useMemo(() => {
    if (!cylinderType || !availableCylinders.length) return availableCylinders;
    
    const weightKg = Number(cylinderType.weightKg);
    // Filter by matching cylinder type (serial format: CYL-BXXX-Xkg-XX)
    return availableCylinders.filter(serial => {
      const match = serial.match(/(\d+)kg/i);
      if (match) {
        return parseInt(match[1], 10) === weightKg;
      }
      return false;
    });
  }, [availableCylinders, cylinderType]);

  const sourceDistrictName = useMemo(() => {
    if (sourceBranch?.district) {
      return sourceBranch.district;
    }
    return '';
  }, [sourceBranch?.district]);

  const destinationDistrictName = selectedDistrictId
    ? RWANDA_DISTRICTS[Number(selectedDistrictId)]?.name || ''
    : '';

  const formattedVoucherId = scannedVoucherId ? formatVoucherId(scannedVoucherId) : '';

  useEffect(() => {
    if (scannedVoucherId) {
      try {
        setVoucherIdBigInt(BigInt(scannedVoucherId));
      } catch {
        setVoucherIdBigInt(undefined);
      }
    } else {
      setVoucherIdBigInt(undefined);
    }
  }, [scannedVoucherId]);

  const sendRedemptionNotification = useCallback(async () => {
    if (!customerInfo || !company || !sourceBranch || !destinationBranch || !cylinderType || !txHash) {
      return;
    }

    setIsSendingNotification(true);
    try {
      const cylinderTypeLabel = `${cylinderType.name} (${Number(cylinderType.weightKg)}kg)`;
      const paymentData = scannedVoucherId ? getVoucherPaymentStatus(scannedVoucherId) : null;
      
      // Use the stored payment amount from when voucher was created, not recalculated
      const storedAmount = paymentData?.amount;
      const serviceFeeFormatted = storedAmount ? formatRWF(storedAmount) : undefined;
      
      const response = await fetch('/api/notifications/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherId: formattedVoucherId,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phoneNumber,
          companyName: company.name,
          sourceBranchName: sourceBranch.name,
          destinationBranchName: destinationBranch.name,
          destinationDistrict: destinationDistrictName,
          cylinderType: cylinderTypeLabel,
          newCylinderSerial: newCylinderSerial,
          redeemedAt: new Date().toISOString(),
          txHash: txHash,
          serviceFee: serviceFeeFormatted,
          paymentStatus: paymentData?.status === 'paid' ? 'Paid' : 'Pending',
        }),
      });

      const result = await response.json();
      setNotificationStatus({
        sent: result.success,
        message: result.success
          ? 'Customer has been notified via SMS and Email'
          : 'Failed to send notifications',
      });
    } catch {
      setNotificationStatus({
        sent: false,
        message: 'Failed to send notifications',
      });
    } finally {
      setIsSendingNotification(false);
    }
  }, [
    customerInfo,
    company,
    sourceBranch,
    destinationBranch,
    cylinderType,
    txHash,
    formattedVoucherId,
    destinationDistrictName,
    newCylinderSerial,
  ]);

  useEffect(() => {
    if (isRedeemSuccess && txHash && !notificationSent) {
      setRedemptionSuccess(true);
      setNotificationSent(true);
      if (scannedVoucherId) {
        setRedeemedVoucherIds(prev => new Set(prev).add(scannedVoucherId));
      }
      sendRedemptionNotification();
    }
  }, [isRedeemSuccess, txHash, notificationSent, scannedVoucherId, sendRedemptionNotification]);

  const handleScan = (voucherId: string) => {
    if (redeemedVoucherIds.has(voucherId)) {
      setScannedVoucherId(voucherId);
      setRedemptionSuccess(false);
      setNotificationStatus(null);
      setFormErrors({ alreadyRedeemed: 'This voucher has already been redeemed in this session.' });
      resetSwap();
      return;
    }
    setScannedVoucherId(voucherId);
    setRedemptionSuccess(false);
    setNotificationStatus(null);
    setFormErrors({});
    setSelectedDistrictId('');
    setSelectedBranchId('');
    setNewCylinderSerial('');
    resetSwap();
  };

  const handleReset = () => {
    setScannedVoucherId(null);
    setVoucherIdBigInt(undefined);
    setRedemptionSuccess(false);
    setNotificationStatus(null);
    setNotificationSent(false);
    setFormErrors({});
    setSelectedDistrictId('');
    setSelectedBranchId('');
    setNewCylinderSerial('');
    resetSwap();
  };



  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedDistrictId) {
      errors.district = 'Please select a destination district';
    }

    if (!selectedBranchId) {
      errors.branch = 'Please select a destination branch';
    }

    // Validate that selected branch belongs to the selected district
    if (selectedDistrictId && selectedBranchId && destinationBranch && destinationBranch.district) {
      const selectedDistrictName = RWANDA_DISTRICTS[Number(selectedDistrictId)]?.name || '';
      if (destinationBranch.district !== selectedDistrictName) {
        errors.branch = `Branch belongs to ${destinationBranch.district}, but you selected ${selectedDistrictName}. Please select a branch from ${selectedDistrictName}.`;
      }
    }

    if (!newCylinderSerial.trim()) {
      errors.cylinderSerial = 'New cylinder serial number is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !voucherIdBigInt) return;

    try {
      await completeSwap({
        voucherId: voucherIdBigInt,
        newCylinderSerialNumber: newCylinderSerial,
        branchId: BigInt(selectedBranchId),
      });
    } catch (err) {
      console.error('Failed to redeem voucher:', err);
    }
  };

  const isLoading = isVerifying || isLoadingVoucher || isLoadingCustomer || isLoadingCompany || isLoadingSourceBranch;
  const isCylinderTypeLoading = isLoadingCylinderTypes || isLoadingCylinderType;
  const isVoucherValid = verification?.isValid && voucher;

  return (
    <RoleGuard role="staff-only">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/staff">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Redeem Voucher</h1>
            <p className="text-slate-400 text-sm">
              Scan voucher, verify customer info, and complete the redemption
            </p>
          </div>
        </div>

        {redemptionSuccess ? (
          <Card variant="glow" className="max-w-2xl mx-auto border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                Voucher Redeemed Successfully!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-background/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voucher ID:</span>
                  <span className="font-mono text-cyan-400">{formattedVoucherId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="text-foreground">{customerInfo?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination:</span>
                  <span className="text-foreground">{destinationBranch?.name}, {destinationDistrictName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Cylinder:</span>
                  <span className="font-mono text-cyan-400">{newCylinderSerial}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction:</span>
                  <span className="font-mono text-cyan-400 text-sm truncate max-w-[250px]">{txHash}</span>
                </div>
              </div>

              {isSendingNotification && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full" />
                  Sending notification to customer...
                </div>
              )}

              {notificationStatus && (
                <div
                  className={cn(
                    'p-3 rounded-lg text-sm',
                    notificationStatus.sent
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                  )}
                >
                  {notificationStatus.message}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleReset} variant="outline" className="w-full">
                Process Another Redemption
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <VoucherScanner onScan={handleScan} />
            </div>

            <div className="space-y-4">
              {scannedVoucherId && (
                <>
                  {isLoading ? (
                    <Card variant="glow">
                      <CardContent className="py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
                          <p className="text-muted-foreground">Loading voucher details...</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : !isVoucherValid ? (
                    <Card variant="default" className="border-red-500/30">
                      <CardHeader>
                        <CardTitle className="text-red-400">Invalid Voucher</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">
                          {formErrors.alreadyRedeemed
                            ? formErrors.alreadyRedeemed
                            : verification?.status === 'Redeemed'
                            ? 'This voucher has already been redeemed and cannot be used again.'
                            : verification?.status === 'Expired'
                            ? 'This voucher has expired and can no longer be redeemed.'
                            : verification?.status === 'Cancelled'
                            ? 'This voucher has been cancelled.'
                            : 'This voucher is not valid for redemption. It may be expired, already redeemed, or cancelled.'}
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={handleReset} variant="outline" className="w-full">
                          Scan Another Voucher
                        </Button>
                      </CardFooter>
                    </Card>
                  ) : (
                    <>
                      <Card variant="glow" className="border-cyan-500/30">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-5 w-5 text-cyan-400" />
                            Customer Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid gap-3">
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                              <User className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Full Name</p>
                                <p className="text-foreground font-medium">{customerInfo?.name || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                              <Mail className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="text-foreground">{customerInfo?.email || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                              <Phone className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="text-foreground">{customerInfo?.phoneNumber || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card variant="default">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Package className="h-5 w-5 text-cyan-400" />
                            Voucher Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Voucher ID:</span>
                            <span className="font-mono text-cyan-400">{formattedVoucherId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Company:</span>
                            <span className="text-foreground">{company?.name || 'Loading...'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Source Branch:</span>
                            <span className="text-foreground">{sourceBranch?.name || 'Loading...'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Source District:</span>
                            <span className="text-foreground">{sourceDistrictName || 'Loading...'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cylinder Type:</span>
                            <span className="text-cyan-400">
                              {isCylinderTypeLoading
                                ? 'Loading...'
                                : cylinderType
                                ? `${cylinderType.name} (${Number(cylinderType.weightKg)}kg)`
                                : 'Unknown'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Days Remaining:</span>
                            <span
                              className={cn(
                                'font-bold',
                                Number(verification?.daysRemaining) > 10
                                  ? 'text-green-400'
                                  : Number(verification?.daysRemaining) >= 5
                                  ? 'text-yellow-400'
                                  : 'text-red-400'
                              )}
                            >
                              {Number(verification?.daysRemaining)} days
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card variant="glow">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-cyan-400" />
                            Redemption Details
                          </CardTitle>
                        </CardHeader>
                        <form onSubmit={handleRedeem}>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                Destination District
                              </label>
                              <select
                                className={cn(
                                  'w-full px-3 py-2 rounded-lg border bg-background text-foreground',
                                  'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                                  formErrors.district && 'border-red-500'
                                )}
                                value={selectedDistrictId}
                                onChange={(e) => {
                                  setSelectedDistrictId(e.target.value);
                                  setSelectedBranchId('');
                                  setNewCylinderSerial('');
                                }}
                                disabled={isRedeeming}
                              >
                                <option value="">Select a district...</option>
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
                              {formErrors.district && (
                                <p className="text-sm text-red-400">{formErrors.district}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                Destination Branch
                              </label>
                              <CompanyBranchDisplay
                                companyName={company?.name}
                                branchId={companyDistrictBranchId}
                                isLoading={isLoadingCompanyBranch}
                                selectedDistrictId={selectedDistrictId}
                                hasError={!!formErrors.branch}
                              />
                              {formErrors.branch && (
                                <p className="text-sm text-red-400">{formErrors.branch}</p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                New Cylinder Serial Number
                              </label>
                              {!selectedBranchId ? (
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600/30 text-slate-400 text-sm">
                                  Please select a district first to see available cylinders.
                                </div>
                              ) : isLoadingAvailableCylinders ? (
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-cyan-500/30 text-cyan-400 text-sm flex items-center gap-2">
                                  <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full" />
                                  Loading available cylinders...
                                </div>
                              ) : filteredCylinders.length > 0 ? (
                                <>
                                  <select
                                    className={cn(
                                      'w-full px-3 py-2 rounded-lg border bg-background text-foreground',
                                      'focus:outline-none focus:ring-2 focus:ring-cyan-500/50',
                                      formErrors.cylinderSerial && 'border-red-500'
                                    )}
                                    value={newCylinderSerial}
                                    onChange={(e) => setNewCylinderSerial(e.target.value)}
                                    disabled={isRedeeming}
                                  >
                                    <option value="">Select a {cylinderType ? `${Number(cylinderType.weightKg)}kg` : ''} cylinder...</option>
                                    {filteredCylinders.map((serial) => (
                                      <option key={serial} value={serial}>
                                        {serial}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="text-xs text-muted-foreground">
                                    {filteredCylinders.length} matching {cylinderType ? `${Number(cylinderType.weightKg)}kg` : ''} cylinder(s) available
                                  </p>
                                </>
                              ) : (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                  <p className="font-medium">No {cylinderType ? `${Number(cylinderType.weightKg)}kg` : ''} cylinders available at this branch</p>
                                  <p className="text-xs mt-1 text-red-300">
                                    {availableCylinders.length > 0 
                                      ? `There are ${availableCylinders.length} cylinder(s) at this branch, but none match the required ${cylinderType ? `${Number(cylinderType.weightKg)}kg` : ''} type.`
                                      : 'Cylinders must be registered in the system before they can be used for redemption. Contact an administrator to register cylinders for this branch, or select a different district.'}
                                  </p>
                                </div>
                              )}
                            </div>

                            {isRedeemError && redeemError && (
                              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {redeemError.message || 'Failed to redeem voucher'}
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleReset}
                              disabled={isRedeeming}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              loading={isRedeeming}
                              disabled={isRedeeming}
                              className="flex-1"
                            >
                              {isRedeeming ? 'Processing...' : 'Redeem Voucher'}
                            </Button>
                          </CardFooter>
                        </form>
                      </Card>
                    </>
                  )}
                </>
              )}

              {!scannedVoucherId && (
                <Card variant="default">
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <p>Scan a voucher QR code or enter a voucher ID to begin</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}

// Component to display the auto-selected company branch for the selected district
function CompanyBranchDisplay({ 
  companyName,
  branchId,
  isLoading,
  selectedDistrictId,
  hasError 
}: { 
  companyName: string | undefined;
  branchId: bigint | undefined;
  isLoading: boolean;
  selectedDistrictId: string;
  hasError: boolean;
}) {
  const { branch } = useBranch(branchId);
  const selectedDistrictName = selectedDistrictId 
    ? RWANDA_DISTRICTS[Number(selectedDistrictId)]?.name || '' 
    : '';

  if (!selectedDistrictId) {
    return (
      <div className={cn(
        'w-full px-3 py-2 rounded-lg border bg-background/50 text-muted-foreground',
        hasError && 'border-red-500'
      )}>
        Select a district first...
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full px-3 py-2 rounded-lg border bg-background/50 text-muted-foreground flex items-center gap-2">
        <div className="animate-spin h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full" />
        Loading branch...
      </div>
    );
  }

  if (!branch) {
    return (
      <div className={cn(
        'w-full px-3 py-2 rounded-lg border bg-red-500/10 text-red-400',
        hasError && 'border-red-500'
      )}>
        No {companyName} branch found in {selectedDistrictName}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className={cn(
        'w-full px-3 py-2 rounded-lg border bg-cyan-500/10 border-cyan-500/30 text-cyan-400 font-medium',
        hasError && 'border-red-500'
      )}>
        {branch.name}
      </div>
      <p className="text-xs text-muted-foreground">
        ✓ Auto-selected {companyName} branch in {selectedDistrictName} district
      </p>
    </div>
  );
}
