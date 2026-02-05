'use client';

import { ReactNode } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/lib/hooks/use-wallet';
import { defaultChain, getChainById } from '@/lib/chains';

interface NetworkGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function NetworkGuard({ children, fallback }: NetworkGuardProps) {
  const { isConnected, chainId, isCorrectNetwork, switchToDefaultChain } = useWallet();

  if (!isConnected) {
    return <>{children}</>;
  }

  if (isCorrectNetwork) {
    return <>{children}</>;
  }

  const currentChain = chainId ? getChainById(chainId) : null;

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">
            Wrong Network
          </h2>

          <p className="text-slate-400 mb-6">
            Please switch to a supported network to use GasSwap.
          </p>

          <div className="w-full p-4 rounded-xl bg-slate-800/50 border border-white/10 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-slate-400">Current</p>
                  <p className="text-sm font-medium text-white">
                    {currentChain?.name || `Chain ${chainId}`}
                  </p>
                </div>
              </div>

              <ArrowRight className="h-5 w-5 text-slate-500" />

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Required</p>
                  <p className="text-sm font-medium text-white">
                    {defaultChain.name}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
              </div>
            </div>
          </div>

          <Button onClick={switchToDefaultChain} className="w-full">
            Switch to {defaultChain.name}
          </Button>
        </div>
      </div>
    </div>
  );
}
