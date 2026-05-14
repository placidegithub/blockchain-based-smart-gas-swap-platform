'use client';

import Link from 'next/link';
import { Shield, Zap, Eye, Wallet, ArrowRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConnectButton } from '@/components/wallet/connect-button';
import { useWallet } from '@/lib/hooks/use-wallet';
import { usePrimaryRole } from '@/lib/hooks/use-roles';
import { usePlatformStatsFormatted } from '@/lib/hooks/use-platform-stats';

const features = [
  {
    icon: Shield,
    title: 'Secure',
    description: 'Blockchain-backed security ensures your transactions are tamper-proof',
  },
  {
    icon: Eye,
    title: 'Transparent',
    description: 'All transactions are recorded on-chain for complete auditability',
  },
  {
    icon: Zap,
    title: 'Fast',
    description: 'Quick voucher generation and instant verification at any branch',
  },
];

export default function LandingPage() {
  const { isConnected } = useWallet();
  const { primaryRole, isLoading: isRoleLoading } = usePrimaryRole();
  const { stats, isLoading: statsLoading } = usePlatformStatsFormatted();

  const dashboardPath = primaryRole === 'admin'
    ? '/admin'
    : primaryRole === 'staff'
      ? '/staff'
      : '/dashboard';

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-white/10 bg-slate-950/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">GasSwap</span>
          </div>
          <ConnectButton />
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <section className="text-center max-w-4xl mx-auto mb-16 md:mb-24">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-white">BLOCKCHAIN - </span>
            <span className="text-gradient">BASED SMART GAS CYLINDER SWAP PLATFORM FOR CROSS-DISTRICT EXCHANGE IN RWANDA</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Exchange gas cylinders seamlessly across branches with blockchain-powered vouchers.
            Secure, transparent, and efficient cylinder swaps for a modern Rwanda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isConnected ? (
              <Link href={dashboardPath}>
                <Button size="lg" className="gap-2">
                  {isRoleLoading ? 'Loading dashboard...' : 'Go to Dashboard'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ConnectButton />
                <p className="text-sm text-slate-500">Connect your wallet to get started</p>
              </div>
            )}
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 mb-16 md:mb-24">
          {features.map((feature) => (
            <Card key={feature.title} variant="glow" className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-7 w-7 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        {isConnected && (
          <section className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Platform Stats</h2>
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} variant="default" className="animate-pulse">
                    <CardContent className="py-6 text-center">
                      <div className="h-8 w-16 bg-slate-700 rounded mx-auto mb-2" />
                      <div className="h-4 w-24 bg-slate-700 rounded mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card variant="default">
                  <CardContent className="py-6 text-center">
                    <p className="text-3xl font-bold text-cyan-400">{stats.totalCompanies}</p>
                    <p className="text-sm text-slate-400">Companies</p>
                  </CardContent>
                </Card>
                <Card variant="default">
                  <CardContent className="py-6 text-center">
                    <p className="text-3xl font-bold text-cyan-400">{stats.totalBranches}</p>
                    <p className="text-sm text-slate-400">Branches</p>
                  </CardContent>
                </Card>
                <Card variant="default">
                  <CardContent className="py-6 text-center">
                    <p className="text-3xl font-bold text-cyan-400">{stats.totalVouchers}</p>
                    <p className="text-sm text-slate-400">Vouchers Issued</p>
                  </CardContent>
                </Card>
                <Card variant="default">
                  <CardContent className="py-6 text-center">
                    <p className="text-3xl font-bold text-cyan-400">{stats.completedSwaps}</p>
                    <p className="text-sm text-slate-400">Completed Swaps</p>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </section>
        )}
      </main>

      <footer className="border-t border-white/10 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} GasSwap. Powered by blockchain technology.</p>
        </div>
      </footer>
    </div>
  );
}
