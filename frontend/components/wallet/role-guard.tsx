'use client';

import { ReactNode } from 'react';
import { ShieldX, Loader2 } from 'lucide-react';
import { useRequireRole } from '@/lib/hooks/use-roles';
import { useWallet } from '@/lib/hooks/use-wallet';
import { Button } from '@/components/ui/button';

interface RoleGuardProps {
  children: ReactNode;
  role: 'admin' | 'staff' | 'admin-only' | 'staff-only';
  fallback?: ReactNode;
  showLoading?: boolean;
}

export function RoleGuard({
  children,
  role,
  fallback,
  showLoading = true,
}: RoleGuardProps) {
  const { isConnected } = useWallet();
  const { isAuthorized, isLoading, hasError } = useRequireRole(role);

  if (!isConnected) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-6">
            <ShieldX className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Wallet Not Connected
          </h2>
          <p className="text-slate-400">
            Please connect your wallet to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && showLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-slate-400">Verifying permissions...</p>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
            <ShieldX className="h-8 w-8 text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Cannot Verify Permissions
          </h2>
          <p className="text-slate-400 mb-4">
            Unable to connect to the smart contracts. This usually means:
          </p>
          <div className="w-full p-4 rounded-xl bg-slate-800/50 border border-white/10 text-left">
            <ul className="text-sm text-slate-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">1.</span>
                <span>Hardhat node was restarted — run <code className="text-cyan-400">npm run setup:all</code> to redeploy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">2.</span>
                <span>Then hard-refresh the browser (<code className="text-cyan-400">Ctrl+Shift+R</code>)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">3.</span>
                <span>Make sure Hardhat node is running: <code className="text-cyan-400">npx hardhat node</code></span>
              </li>
            </ul>
          </div>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const roleLabel = (role === 'admin' || role === 'admin-only') ? 'Platform Administrator' : 'Branch Staff';

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
              <ShieldX className="h-8 w-8 text-red-400" />
            </div>

            <h2 className="text-xl font-semibold text-white mb-2">
              Not Authorized
            </h2>

            <p className="text-slate-400 mb-6">
              You need <span className="text-cyan-400 font-medium">{roleLabel}</span> permissions to access this page.
            </p>

            <div className="w-full p-4 rounded-xl bg-slate-800/50 border border-white/10 text-left">
              <h3 className="text-sm font-medium text-white mb-2">
                How to get access:
              </h3>
              <ul className="text-sm text-slate-400 space-y-2">
                {(role === 'admin' || role === 'admin-only') ? (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>Contact the platform owner to grant admin access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>Admin permissions are managed through the smart contract</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>Ask a platform administrator to add you as branch staff</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400">•</span>
                      <span>Staff roles are assigned per-branch by admins</span>
                    </li>
                    {role === 'staff-only' && (
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400">•</span>
                        <span>Note: Admins should use the Admin Dashboard instead</span>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>

            <Button
              variant="outline"
              className="mt-6"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
