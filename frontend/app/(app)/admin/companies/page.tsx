'use client';

import { useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RoleGuard } from '@/components/wallet/role-guard';
import { CompanyTable, AddCompanyForm } from '@/components/admin';

export default function CompaniesPage() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <RoleGuard role="admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Companies</h1>
              <p className="text-slate-400 text-sm">
                Manage gas companies registered on the platform
              </p>
            </div>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
        </div>

        {showAddForm && (
          <div className="max-w-xl">
            <AddCompanyForm onSuccess={() => setShowAddForm(false)} />
          </div>
        )}

        <CompanyTable />
      </div>
    </RoleGuard>
  );
}
