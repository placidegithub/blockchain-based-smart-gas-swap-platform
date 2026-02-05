'use client';

import { Shield, ShieldCheck, User } from 'lucide-react';
import { useRoles } from '@/lib/hooks/use-roles';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export function RoleBadge({ className, showIcon = true }: RoleBadgeProps) {
  const { isPlatformAdmin, isBranchStaff, isLoading } = useRoles();

  if (isLoading) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          'bg-slate-700/50 text-slate-400 animate-pulse',
          className
        )}
      >
        <div className="w-3 h-3 rounded-full bg-slate-600" />
        <span>Loading...</span>
      </div>
    );
  }

  if (isPlatformAdmin) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30',
          className
        )}
      >
        {showIcon && <ShieldCheck className="h-3 w-3" />}
        <span>Admin</span>
      </div>
    );
  }

  if (isBranchStaff) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30',
          className
        )}
      >
        {showIcon && <Shield className="h-3 w-3" />}
        <span>Staff</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        'bg-slate-700/50 text-slate-300 border border-slate-600/50',
        className
      )}
    >
      {showIcon && <User className="h-3 w-3" />}
      <span>Customer</span>
    </div>
  );
}
