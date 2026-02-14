'use client';

import { RoleGuard } from '@/components/wallet/role-guard';
import { StaffDashboard } from '@/components/staff';

export default function StaffPage() {
  return (
    <RoleGuard role="staff-only">
      <StaffDashboard />
    </RoleGuard>
  );
}
