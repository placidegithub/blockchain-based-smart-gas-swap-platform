'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VoucherQRCode } from './voucher-qr-code';
import { type Voucher, type VoucherStatus } from './voucher-card';
import { cn, formatDate } from '@/lib/utils';
import { Building2, MapPin, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface VoucherDetailsDialogProps {
  voucher: Voucher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusStyles: Record<VoucherStatus, string> = {
  Active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Redeemed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Expired: 'bg-red-500/20 text-red-400 border-red-500/30',
  Cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export function VoucherDetailsDialog({
  voucher,
  open,
  onOpenChange,
}: VoucherDetailsDialogProps) {
  if (!voucher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voucher Details</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {voucher.id}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <VoucherQRCode voucherId={voucher.id} size={180} />
        </div>

        <div className="space-y-1 border border-border rounded-lg p-4 bg-white/5">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="text-sm font-medium text-foreground">Status</span>
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                statusStyles[voucher.status]
              )}
            >
              {voucher.status}
            </span>
          </div>

          <DetailRow
            icon={<Building2 className="h-4 w-4" />}
            label="Company"
            value={
              <span>
                {voucher.companyName}{' '}
                <span className="text-muted-foreground">({voucher.companyCode})</span>
              </span>
            }
          />

          <DetailRow
            icon={<span className="text-sm">⛽</span>}
            label="Cylinder Type"
            value={<span className="text-cyan-400">{voucher.cylinderType}</span>}
          />

          <DetailRow
            icon={<MapPin className="h-4 w-4" />}
            label="Source Branch"
            value={voucher.sourceBranch}
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Transaction History
          </h4>
          <div className="space-y-2 pl-6 border-l-2 border-border">
            <div className="relative">
              <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-cyan-500" />
              <div className="text-sm">
                <span className="text-muted-foreground">Created:</span>{' '}
                <span className="text-foreground">{formatDate(voucher.createdAt)}</span>
              </div>
            </div>

            {voucher.status === 'Active' && (
              <div className="relative">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-yellow-500" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Expires:</span>{' '}
                  <span className="text-foreground">{formatDate(voucher.expiresAt)}</span>
                </div>
              </div>
            )}

            {voucher.redeemedAt && (
              <div className="relative">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-emerald-500" />
                <div className="text-sm">
                  <span className="text-muted-foreground">Redeemed:</span>{' '}
                  <span className="text-foreground">{formatDate(voucher.redeemedAt)}</span>
                </div>
              </div>
            )}

            {voucher.status === 'Expired' && (
              <div className="relative">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-red-500" />
                <div className="text-sm text-red-400">Voucher has expired</div>
              </div>
            )}

            {voucher.status === 'Cancelled' && (
              <div className="relative">
                <div className="absolute -left-[25px] top-1 w-2 h-2 rounded-full bg-gray-500" />
                <div className="text-sm text-gray-400">Voucher was cancelled</div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
