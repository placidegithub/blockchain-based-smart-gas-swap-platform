'use client';

import * as React from 'react';
import { VoucherCard, type Voucher } from './voucher-card';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoucherListProps {
  vouchers: Voucher[];
  isLoading?: boolean;
  onShowQR: (voucher: Voucher) => void;
  emptyMessage?: string;
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
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-white/10 rounded" />
            <div className="h-4 w-16 bg-white/10 rounded" />
          </div>
          <div className="h-4 w-40 bg-white/10 rounded" />
          <div className="h-4 w-36 bg-white/10 rounded" />
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

export function VoucherList({
  vouchers,
  isLoading = false,
  onShowQR,
  emptyMessage = 'You don\'t have any vouchers yet. Purchase a cylinder to receive a voucher.',
  className,
}: VoucherListProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
          className
        )}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <VoucherSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className={className}>
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
    >
      {vouchers.map((voucher) => (
        <VoucherCard key={voucher.id} voucher={voucher} onShowQR={onShowQR} />
      ))}
    </div>
  );
}
