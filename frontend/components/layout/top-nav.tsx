'use client';

import Link from 'next/link';
import { Menu, Flame } from 'lucide-react';
import { ConnectButton } from '@/components/wallet/connect-button';
import { RoleBadge } from '@/components/wallet/role-badge';
import { usePrimaryRole } from '@/lib/hooks/use-roles';
import { useWallet } from '@/lib/hooks/use-wallet';
import { cn } from '@/lib/utils';

interface TopNavProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function TopNav({ onMenuClick, showMenuButton = true }: TopNavProps) {
  const { isConnected } = useWallet();
  const { primaryRole } = usePrimaryRole();

  // Each role sees only their relevant links - strict separation
  const navLinks = [
    { href: primaryRole === 'admin' ? '/admin' : '/dashboard', label: 'Dashboard', show: true },
    { href: '/staff', label: 'Staff Dashboard', show: primaryRole === 'staff' },
    { href: '/admin', label: 'Admin Panel', show: primaryRole === 'admin' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-900/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white hidden sm:block">
              GasSwap
            </span>
          </Link>

          {isConnected && (
            <nav className="hidden md:flex items-center gap-1 ml-6">
              {navLinks
                .filter((link) => link.show)
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      'text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="hidden sm:block">
              <RoleBadge />
            </div>
          )}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
