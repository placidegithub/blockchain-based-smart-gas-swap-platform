'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { usePrimaryRole } from '@/lib/hooks/use-roles';
import { useWallet } from '@/lib/hooks/use-wallet';

interface RoleRedirectProps {
  children: React.ReactNode;
}

export function RoleRedirect({ children }: RoleRedirectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isConnected } = useWallet();
  const { primaryRole, isLoading, hasError } = usePrimaryRole();

  useEffect(() => {
    if (!isConnected || isLoading || hasError || !primaryRole) return;

    // Define restricted paths for each role
    const roleRestrictedPaths: Record<string, string[]> = {
      admin: ['/staff'], // Admin should not access staff pages
      staff: ['/admin'], // Staff should not access admin pages
      customer: ['/admin', '/staff'], // Customers should not access admin or staff
    };

    const roleDefaultPaths: Record<string, string> = {
      admin: '/admin',
      staff: '/staff',
      customer: '/dashboard',
    };

    // Check if current path is restricted for this role
    const restrictedPaths = roleRestrictedPaths[primaryRole] || [];
    const isRestricted = restrictedPaths.some(path => pathname.startsWith(path));
    const defaultPath = roleDefaultPaths[primaryRole] || '/dashboard';

    if (pathname === '/dashboard' && primaryRole !== 'customer') {
      router.replace(defaultPath);
      return;
    }

    if (isRestricted) {
      // Redirect to role's default page
      router.replace(defaultPath);
    }
    // Note: Staff and admin can access /dashboard to view customer perspective
  }, [isConnected, isLoading, hasError, primaryRole, pathname, router]);

  return <>{children}</>;
}
