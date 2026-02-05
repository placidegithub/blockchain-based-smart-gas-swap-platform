'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/wallet/role-guard';
import { StaffRoleManager } from '@/components/admin';

export default function StaffRolesPage() {
  return (
    <RoleGuard role="admin">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Staff Roles</h1>
            <p className="text-slate-400 text-sm">
              Manage staff permissions and role assignments
            </p>
          </div>
        </div>

        <StaffRoleManager />
      </div>
    </RoleGuard>
  );
}
