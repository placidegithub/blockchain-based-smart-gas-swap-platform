'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  QrCode,
  Shield,
  User,
} from 'lucide-react';
import { useRoles, usePrimaryRole } from '@/lib/hooks/use-roles';
import { useWallet } from '@/lib/hooks/use-wallet';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiredRole?: 'admin' | 'staff';
}

export function MobileNav() {
  const pathname = usePathname();
  const { isConnected } = useWallet();
  const { isPlatformAdmin, isBranchStaff } = useRoles();
  const { primaryRole } = usePrimaryRole();

  if (!isConnected) {
    return null;
  }

  // Strict role-based menu visibility
  const hasRole = (role?: 'admin' | 'staff') => {
    if (!role) return true;
    if (role === 'admin') return primaryRole === 'admin';
    if (role === 'staff') return primaryRole === 'staff';
    return false;
  };

  // Dynamic home link based on role
  const getHomeHref = () => {
    if (primaryRole === 'admin') return '/admin';
    // Staff can view customer dashboard via /dashboard
    return '/dashboard';
  };

  const navItems: NavItem[] = [
    {
      href: getHomeHref(),
      label: 'Home',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    // Staff-only items
    {
      href: '/staff/create-voucher',
      label: 'Create',
      icon: <Ticket className="h-5 w-5" />,
      requiredRole: 'staff',
    },
    {
      href: '/staff/redeem',
      label: 'Redeem',
      icon: <QrCode className="h-5 w-5" />,
      requiredRole: 'staff',
    },
    // Admin-only items
    {
      href: '/admin/companies',
      label: 'Companies',
      icon: <Shield className="h-5 w-5" />,
      requiredRole: 'admin',
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: <User className="h-5 w-5" />,
    },
  ];

  const filteredItems = navItems.filter((item) => hasRole(item.requiredRole));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
      <div className="border-t border-white/10 bg-slate-900/95 backdrop-blur-xl safe-area-pb">
        <div className="flex items-center justify-around px-2 py-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[64px] transition-all',
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/10'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <div
                  className={cn(
                    'relative',
                    isActive && 'after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-cyan-400'
                  )}
                >
                  {item.icon}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
