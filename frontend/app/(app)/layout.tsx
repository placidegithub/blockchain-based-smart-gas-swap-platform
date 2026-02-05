'use client';

import { AppShell } from '@/components/layout';
import { RoleRedirect } from '@/components/wallet';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleRedirect>
      <AppShell>{children}</AppShell>
    </RoleRedirect>
  );
}
