'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/wallet/role-guard';
import { InitiateSwapForm } from '@/components/staff';

export default function CreateVoucherPage() {
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
            <h1 className="text-2xl font-bold text-white">Create Voucher</h1>
            <p className="text-slate-400 text-sm">
              Issue a new voucher for a customer cylinder deposit
            </p>
          </div>
        </div>

        <div className="max-w-2xl">
          <InitiateSwapForm />
        </div>
      </div>
    </RoleGuard>
  );
}
