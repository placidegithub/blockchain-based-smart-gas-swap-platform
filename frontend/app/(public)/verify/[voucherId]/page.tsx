'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Activity, ArrowLeft, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useVerifyVoucher } from '@/lib/hooks/use-vouchers';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  Active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Redeemed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Expired: 'bg-red-500/20 text-red-400 border-red-500/30',
  Cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function VerifyVoucherPage() {
  const params = useParams();
  const voucherId = params.voucherId as string;
  const [parsedId, setParsedId] = useState<bigint | undefined>(undefined);

  useEffect(() => {
    try {
      if (voucherId) {
        setParsedId(BigInt(voucherId));
      }
    } catch {
      setParsedId(undefined);
    }
  }, [voucherId]);

  const { verification, isLoading, error } = useVerifyVoucher(parsedId);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">GasSwap</span>
        </div>
      </div>

      <Card variant="glow">
        <CardHeader>
          <CardTitle className="text-lg">Voucher Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-white/5 border border-border">
            <p className="text-xs text-slate-400 mb-1">Voucher ID</p>
            <p className="font-mono text-sm text-white break-all">{voucherId}</p>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-4" />
              <p className="text-sm text-slate-400">Verifying on blockchain...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Verification Failed</h3>
              <p className="text-sm text-slate-400 text-center">
                Unable to verify this voucher. It may be invalid or the network is unavailable.
              </p>
            </div>
          )}

          {verification && !isLoading && (
            <>
              {verification.isValid ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center py-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-medium text-emerald-400">Valid Voucher</h3>
                  </div>

                  <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Status</span>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          statusStyles[verification.status] || statusStyles.Pending
                        )}
                      >
                        {verification.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Company ID</span>
                      <span className="text-sm font-mono text-white">
                        {verification.companyId.toString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Cylinder Type ID</span>
                      <span className="text-sm font-mono text-white">
                        {verification.cylinderTypeId.toString()}
                      </span>
                    </div>

                    {Number(verification.daysRemaining) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Days Remaining</span>
                        <span className="text-sm font-bold text-cyan-400">
                          {Number(verification.daysRemaining)} days
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                    <XCircle className="h-8 w-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Invalid Voucher</h3>
                  <p className="text-sm text-slate-400 text-center">
                    This voucher is not valid. It may have expired, been redeemed, or does not exist.
                  </p>
                </div>
              )}
            </>
          )}

          {!isLoading && !verification && !error && parsedId === undefined && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Invalid Voucher ID</h3>
              <p className="text-sm text-slate-400 text-center">
                The voucher ID format is invalid.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-500 mt-6">
        This verification is performed directly on the blockchain.
        <br />
        No wallet connection required.
      </p>
    </div>
  );
}
