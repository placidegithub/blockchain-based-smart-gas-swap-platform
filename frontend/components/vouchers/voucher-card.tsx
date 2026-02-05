'use client';

import * as React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Calendar, MapPin, Building2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export type VoucherStatus = 'Active' | 'Redeemed' | 'Expired' | 'Cancelled';

export type CylinderType = '6kg' | '12kg' | '15kg';

export interface Voucher {
  id: string;
  companyName: string;
  companyCode: string;
  cylinderType: CylinderType;
  status: VoucherStatus;
  expiresAt: number;
  sourceBranch: string;
  createdAt: number;
  redeemedAt?: number;
}

interface VoucherCardProps {
  voucher: Voucher;
  onShowQR: (voucher: Voucher) => void;
  className?: string;
}

const statusStyles: Record<VoucherStatus, string> = {
  Active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Redeemed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Expired: 'bg-red-500/20 text-red-400 border-red-500/30',
  Cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function getDaysRemaining(expiresAt: number): number {
  const now = Math.floor(Date.now() / 1000);
  const diff = expiresAt - now;
  return Math.max(0, Math.ceil(diff / (60 * 60 * 24)));
}

function getDaysRemainingColor(days: number): string {
  if (days > 10) return 'text-emerald-400';
  if (days >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

export function VoucherCard({ voucher, onShowQR, className }: VoucherCardProps) {
  const daysRemaining = getDaysRemaining(voucher.expiresAt);
  const daysColor = getDaysRemainingColor(daysRemaining);

  return (
    <Card variant="glow" className={cn('flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-mono">
              {voucher.id}
            </p>
            <h3 className="text-lg font-semibold text-foreground">
              {voucher.companyName}
            </h3>
            <p className="text-xs text-muted-foreground">
              {voucher.companyCode}
            </p>
          </div>
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-xs font-medium border',
              statusStyles[voucher.status]
            )}
          >
            {voucher.status}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cylinder Type</span>
          <span className="text-sm font-medium text-cyan-400">
            {voucher.cylinderType}
          </span>
        </div>

        {voucher.status === 'Active' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Days Remaining</span>
            <span className={cn('text-sm font-bold', daysColor)}>
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{voucher.sourceBranch}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(voucher.createdAt)}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onShowQR(voucher)}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Show QR
        </Button>
      </CardFooter>
    </Card>
  );
}
