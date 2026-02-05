'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Calendar, MapPin, Ticket } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useVoucher, useVerifyVoucher, VoucherStatus as VoucherStatusEnum } from '@/lib/hooks/use-vouchers';
import { useCylinderType, useCylinder, useCompany, useBranch } from '@/lib/hooks';
import { useVoucherCustomerInfo } from '@/lib/hooks/use-recent-vouchers';
import { getVoucherPaymentStatus } from '@/lib/payment';
import { VoucherQRCode } from './voucher-qr-code';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface VoucherListByIdsProps {
  voucherIds: bigint[];
  className?: string;
}

function VoucherSkeleton() {
  return (
    <Card variant="default" className="animate-pulse">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-white/10 rounded" />
            <div className="h-5 w-32 bg-white/10 rounded" />
            <div className="h-3 w-16 bg-white/10 rounded" />
          </div>
          <div className="h-5 w-16 bg-white/10 rounded-full" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div className="h-4 w-20 bg-white/10 rounded" />
            <div className="h-4 w-12 bg-white/10 rounded" />
          </div>
          <div className="h-4 w-40 bg-white/10 rounded" />
        </div>
        <div className="h-9 w-full bg-white/10 rounded-lg" />
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-white/5 p-4 mb-4">
        <Ticket className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">No Vouchers Found</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
    </div>
  );
}

type VoucherStatusLabel = 'Active' | 'Redeemed' | 'Expired' | 'Cancelled';

const statusStyles: Record<VoucherStatusLabel, string> = {
  Active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Redeemed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Expired: 'bg-red-500/20 text-red-400 border-red-500/30',
  Cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function getStatusLabel(status: number): VoucherStatusLabel {
  switch (status) {
    case VoucherStatusEnum.ACTIVE:
      return 'Active';
    case VoucherStatusEnum.REDEEMED:
      return 'Redeemed';
    case VoucherStatusEnum.EXPIRED:
      return 'Expired';
    case VoucherStatusEnum.CANCELLED:
      return 'Cancelled';
    default:
      return 'Active';
  }
}

function getDaysRemaining(expiresAt: bigint): number {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const diff = expiresAt - now;
  return Math.max(0, Math.ceil(Number(diff) / (60 * 60 * 24)));
}

function getDaysRemainingColor(days: number): string {
  if (days > 10) return 'text-emerald-400';
  if (days >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

interface VoucherCardByIdProps {
  voucherId: bigint;
  onShowQR: (id: bigint) => void;
  className?: string;
}

function VoucherCardById({ voucherId, onShowQR, className }: VoucherCardByIdProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { voucher, isLoading } = useVoucher(voucherId);
  const { verification } = useVerifyVoucher(voucherId);
  const { cylinderType } = useCylinderType(voucher?.cylinderTypeId);
  const { company } = useCompany(voucher?.companyId);
  const { branch } = useBranch(voucher?.sourceBranchId);
  const { customerInfo } = useVoucherCustomerInfo(voucherId);
  const { cylinder } = useCylinder(voucher?.depositedCylinderId);

  if (isLoading || !voucher) {
    return <VoucherSkeleton />;
  }

  const statusLabel = getStatusLabel(voucher.status);
  const daysRemaining = getDaysRemaining(voucher.expiresAt);
  const daysColor = getDaysRemainingColor(daysRemaining);

  // Get cylinder condition from localStorage
  let cylinderCondition: string | undefined;
  if (cylinder?.serialNumber && typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(`voucher_serial_${cylinder.serialNumber}`);
      if (stored) {
        const metadata = JSON.parse(stored);
        cylinderCondition = metadata.cylinderCondition;
      }
    } catch (e) {
      // Ignore
    }
  }
  
  // Get payment status using centralized function
  const storedPayment = getVoucherPaymentStatus(voucherId.toString());
  const paymentStatus: 'pending' | 'paid' | 'cancelled' = storedPayment?.status || 'pending';

  const paymentStatusStyles = {
    pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    paid: 'bg-green-500/20 text-green-400 border-green-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <Card 
      variant="glow" 
      className={cn('flex flex-col cursor-pointer transition-all', className)}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-mono">
              #{voucherId.toString()}
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {company?.name || 'Loading...'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {company?.code || ''}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                statusStyles[statusLabel]
              )}
            >
              {statusLabel}
            </span>
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                paymentStatusStyles[paymentStatus]
              )}
            >
              {paymentStatus === 'paid' ? 'Paid' : paymentStatus === 'cancelled' ? 'Cancelled' : 'Pending Payment'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cylinder Type</span>
          <span className="text-sm font-medium text-cyan-400">
            {cylinderType?.sizeName || `Type ${voucher.cylinderTypeId.toString()}`}
          </span>
        </div>

        {statusLabel === 'Active' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Days Remaining</span>
            <span className={cn('text-sm font-bold', daysColor)}>
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{branch?.name || `Branch ${voucher.sourceBranchId?.toString() || 'Unknown'}`}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(Number(voucher.createdAt))}</span>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
            {/* Customer Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-cyan-400">Customer Information</h4>
              {customerInfo?.name && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="text-foreground">{customerInfo.name}</span>
                </div>
              )}
              {customerInfo?.email && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="text-foreground">{customerInfo.email}</span>
                </div>
              )}
              {customerInfo?.phoneNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="text-foreground">{customerInfo.phoneNumber}</span>
                </div>
              )}
            </div>

            {/* Cylinder Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-cyan-400">Cylinder Information</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Company:</span>
                <span className="text-foreground">{company?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Branch:</span>
                <span className="text-foreground">{branch?.name || 'N/A'}</span>
              </div>
              {cylinder?.serialNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Serial Number:</span>
                  <span className="text-foreground font-mono">{cylinder.serialNumber}</span>
                </div>
              )}
              {cylinderCondition && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Condition at Deposit:</span>
                  <span className={cylinderCondition === 'full' ? 'text-green-400' : 'text-orange-400'}>
                    {cylinderCondition === 'full' ? 'Full Cylinder' : 'Empty Cylinder'}
                  </span>
                </div>
              )}
            </div>

            {/* Voucher Details */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-cyan-400">Voucher Details</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-foreground">{formatDate(Number(voucher.createdAt))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires:</span>
                <span className="text-foreground">{formatDate(Number(voucher.expiresAt))}</span>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground pt-2">
          {isExpanded ? 'Click to collapse' : 'Click to see all details'}
        </p>
      </CardContent>

      <CardFooter className="pt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onShowQR(voucherId);
          }}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Show QR
        </Button>
      </CardFooter>
    </Card>
  );
}

export function VoucherListByIds({
  voucherIds,
  className,
}: VoucherListByIdsProps) {
  const [selectedVoucherId, setSelectedVoucherId] = useState<bigint | null>(null);

  if (voucherIds.length === 0) {
    return (
      <div className={className}>
        <EmptyState message="You don't have any vouchers yet. Visit a branch to deposit a cylinder and receive a voucher." />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
          className
        )}
      >
        {voucherIds.map((id) => (
          <VoucherCardById
            key={id.toString()}
            voucherId={id}
            onShowQR={setSelectedVoucherId}
          />
        ))}
      </div>

      <Dialog
        open={selectedVoucherId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedVoucherId(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Voucher QR Code</DialogTitle>
          </DialogHeader>
          {selectedVoucherId && (
            <div className="flex flex-col items-center py-4">
              <VoucherQRCode voucherId={selectedVoucherId.toString()} size={200} />
              <p className="mt-4 text-sm text-slate-400 text-center">
                Show this QR code at any branch to redeem your voucher
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
