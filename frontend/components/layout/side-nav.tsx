'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Cylinder,
  QrCode,
  Ticket,
  Users,
  Building2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCog,
} from 'lucide-react';
import { useRoles, usePrimaryRole } from '@/lib/hooks/use-roles';
import { cn } from '@/lib/utils';

interface SideNavProps {
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiredRole?: 'admin' | 'staff';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function SideNav({
  isOpen,
  onClose,
  collapsed = false,
  onCollapsedChange,
}: SideNavProps) {
  const pathname = usePathname();
  const { isPlatformAdmin, isBranchStaff } = useRoles();
  const { primaryRole } = usePrimaryRole();

  // Strict role-based menu visibility - each role sees only their section
  const hasRole = (role?: 'admin' | 'staff') => {
    if (!role) return true;
    if (role === 'admin') return primaryRole === 'admin';
    if (role === 'staff') return primaryRole === 'staff';
    return false;
  };

  // Dynamic dashboard link based on role
  const getDashboardHref = () => {
    if (primaryRole === 'admin') return '/admin';
    // Staff can view customer dashboard via /dashboard
    return '/dashboard';
  };

  const navSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        {
          href: getDashboardHref(),
          label: 'Dashboard',
          icon: <LayoutDashboard className="h-5 w-5" />,
        },
      ],
    },
    {
      title: 'Staff Tools',
      items: [
        {
          href: '/staff',
          label: 'Staff Dashboard',
          icon: <UserCog className="h-5 w-5" />,
          requiredRole: 'staff',
        },
        {
          href: '/staff/create-voucher',
          label: 'Create Voucher',
          icon: <Ticket className="h-5 w-5" />,
          requiredRole: 'staff',
        },
        {
          href: '/staff/redeem',
          label: 'Redeem Voucher',
          icon: <QrCode className="h-5 w-5" />,
          requiredRole: 'staff',
        },
        {
          href: '/staff/reports',
          label: 'Reports',
          icon: <BarChart3 className="h-5 w-5" />,
          requiredRole: 'staff',
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          href: '/admin',
          label: 'Admin Panel',
          icon: <Shield className="h-5 w-5" />,
          requiredRole: 'admin',
        },
        {
          href: '/admin/companies',
          label: 'Companies',
          icon: <Building2 className="h-5 w-5" />,
          requiredRole: 'admin',
        },
        {
          href: '/admin/branches',
          label: 'Branches',
          icon: <Building2 className="h-5 w-5" />,
          requiredRole: 'admin',
        },
        {
          href: '/admin/cylinders',
          label: 'Cylinders',
          icon: <Cylinder className="h-5 w-5" />,
          requiredRole: 'admin',
        },
        {
          href: '/admin/staff-roles',
          label: 'Staff Roles',
          icon: <Users className="h-5 w-5" />,
          requiredRole: 'admin',
        },
      ],
    },
  ];

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasRole(item.requiredRole)),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-16 bottom-0 z-40 flex flex-col border-r border-white/10 bg-slate-900 transition-all duration-300',
          'lg:sticky lg:top-16 lg:z-0',
          isOpen ? 'left-0' : '-left-72 lg:left-0',
          collapsed ? 'w-16' : 'w-72'
        )}
      >
        <div className="flex-1 overflow-y-auto py-4">
          {filteredSections.map((section) => (
            <div key={section.title} className="mb-6">
              {!collapsed && (
                <div className="px-4 mb-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </span>
                </div>
              )}
              <nav className="space-y-1 px-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-white/5',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="hidden lg:block p-2 border-t border-white/10">
          <button
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
