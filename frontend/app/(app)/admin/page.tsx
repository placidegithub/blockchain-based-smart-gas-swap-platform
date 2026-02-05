'use client';

import { RoleGuard } from '@/components/wallet/role-guard';
import { AdminDashboard } from '@/components/admin';

export default function AdminPage() {
  return (
    <RoleGuard role="admin">
      <AdminDashboard />
    </RoleGuard>
  );
}
