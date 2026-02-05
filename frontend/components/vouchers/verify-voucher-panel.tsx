'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type VoucherStatus, type CylinderType } from './voucher-card';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export interface VerificationResult {
  valid: boolean;
  voucherId: string;
  companyName?: string;
  companyCode?: string;
  cylinderType?: CylinderType;
  status?: VoucherStatus;
  daysRemaining?: number;
  sourceBranch?: string;
  errorMessage?: string;
}

interface VerifyVoucherPanelProps {
  voucherId: string;
  result: VerificationResult | null;
  isLoading?: boolean;
  isStaff?: boolean;
  onVerify?: () => void;
  onRedeem?: () => void;
  isRedeeming?: boolean;
  className?: string;
}

const statusStyles: Record<VoucherStatus, string> = {
  Active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Redeemed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Expired: 'bg-red-500/20 text-red-400 border-red-500/30',
  Cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function getDaysRemainingColor(days: number): string {
  if (days > 10) return 'text-emerald-400';
  if (days >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

export function VerifyVoucherPanel({
  voucherId,
  result,
  isLoading = false,
  isStaff = false,
  onVerify,
  onRedeem,
  isRedeeming = false,
  className,
}: VerifyVoucherPanelProps) {
  if (isLoading) {
    return (
      <Card variant="glow" className={cn('animate-pulse', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Verifying voucher...</p>
          <p className="text-xs font-mono text-muted-foreground mt-2">{voucherId}</p>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card variant="default" className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-white/5 p-4 mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Scan a voucher QR code or enter a voucher ID to verify
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!result.valid) {
    return (
      <Card variant="default" className={cn('border-red-500/30', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-red-400">
            <XCircle className="h-5 w-5" />
            Invalid Voucher
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs font-mono text-muted-foreground break-all">
            {voucherId}
          </p>
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">
              {result.errorMessage || 'This voucher could not be verified. It may be invalid, expired, or already redeemed.'}
            </p>
          </div>
        </CardContent>
        {onVerify && (
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={onVerify}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  const canRedeem = result.status === 'Active' && isStaff;

  return (
    <Card variant="glow" className={cn('border-emerald-500/30', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2 text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
          Valid Voucher
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-xs font-mono text-muted-foreground break-all">
          {voucherId}
        </p>

        <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <span
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                statusStyles[result.status!]
              )}
            >
              {result.status}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span className="text-sm">Company</span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {result.companyName}{' '}
              <span className="text-muted-foreground">({result.companyCode})</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Cylinder Type</span>
            <span className="text-sm font-medium text-cyan-400">
              {result.cylinderType}
            </span>
          </div>

          {result.daysRemaining !== undefined && result.status === 'Active' && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Days Remaining</span>
              <span
                className={cn(
                  'text-sm font-bold',
                  getDaysRemainingColor(result.daysRemaining)
                )}
              >
                {result.daysRemaining} {result.daysRemaining === 1 ? 'day' : 'days'}
              </span>
            </div>
          )}

          {result.sourceBranch && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Source Branch</span>
              </div>
              <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                {result.sourceBranch}
              </span>
            </div>
          )}
        </div>

        {result.status === 'Redeemed' && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-400 text-center">
              This voucher has already been redeemed
            </p>
          </div>
        )}

        {result.status === 'Expired' && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400 text-center">
              This voucher has expired
            </p>
          </div>
        )}
      </CardContent>

      {(canRedeem || onVerify) && (
        <CardFooter className="flex gap-2">
          {onVerify && (
            <Button variant="outline" className="flex-1" onClick={onVerify}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Scan Another
            </Button>
          )}
          {canRedeem && onRedeem && (
            <Button
              className="flex-1"
              onClick={onRedeem}
              loading={isRedeeming}
              disabled={isRedeeming}
            >
              Redeem Voucher
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
