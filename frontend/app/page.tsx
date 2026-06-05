'use client';

import Link from 'next/link';
import { Shield, Zap, Eye, ArrowRight, Activity, Building2, GitBranch, Ticket, CheckCircle2 } from 'lucide-react';
import { ConnectButton } from '@/components/wallet/connect-button';
import { useWallet } from '@/lib/hooks/use-wallet';
import { usePrimaryRole } from '@/lib/hooks/use-roles';
import { usePlatformStatsFormatted } from '@/lib/hooks/use-platform-stats';

const features = [
  {
    icon: Shield,
    title: 'Secure',
    description: 'Smart contract access control and blockchain immutability protect every transaction',
  },
  {
    icon: Eye,
    title: 'Transparent',
    description: 'Every swap is recorded on-chain — fully auditable by all parties at any time',
  },
  {
    icon: Zap,
    title: 'Fast',
    description: 'Instant voucher generation and QR-based verification at any registered branch',
  },
];

const steps = [
  { number: '01', label: 'Visit source branch', sub: 'Present cylinder & wallet' },
  { number: '02', label: 'Staff registers info', sub: 'System mints NFT voucher' },
  { number: '03', label: 'Receive QR voucher', sub: 'Sent to email & SMS' },
  { number: '04', label: 'Redeem at destination', sub: 'NFT burned on swap' },
];

export default function LandingPage() {
  const { isConnected } = useWallet();
  const { primaryRole, isLoading: isRoleLoading } = usePrimaryRole();
  const { stats, isLoading: statsLoading } = usePlatformStatsFormatted();

  const dashboardPath =
    primaryRole === 'admin' ? '/admin' :
    primaryRole === 'staff' ? '/staff' : '/dashboard';

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Navbar ── */}
      <nav className="relative z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">GasSwap</span>
              <span className="ml-2 text-xs text-cyan-400 font-medium hidden sm:inline">on Ethereum Sepolia</span>
            </div>
          </div>
          <ConnectButton />
        </div>
      </nav>

      {/* ═══════════════════════════════════════
          HERO — two-column layout
          Left: text + CTAs   Right: hero image
      ═══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-slate-950">

        {/* Subtle background glow behind the whole hero */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[700px] h-[700px]" style={{
            background: 'radial-gradient(circle at 0% 0%, rgba(6,182,212,0.07) 0%, transparent 60%)'
          }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px]" style={{
            background: 'radial-gradient(circle at 100% 100%, rgba(59,130,246,0.07) 0%, transparent 60%)'
          }} />
        </div>

        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center min-h-[88vh] py-16">

            {/* ── LEFT: Text content ── */}
            <div className="relative z-10 flex flex-col justify-center">

              {/* Live badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-8 w-fit">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs text-cyan-300 font-medium tracking-wide uppercase">Live on Ethereum Sepolia</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.06] mb-6 tracking-tight">
                <span className="text-white">Smart Gas</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Cylinder Swap
                </span>
                <br />
                <span className="text-slate-400 text-3xl md:text-4xl font-bold">across Rwanda</span>
              </h1>

              <p className="text-base md:text-lg text-slate-400 mb-10 max-w-lg leading-relaxed">
                Blockchain-powered NFT vouchers let customers deposit a cylinder at any branch
                and redeem it anywhere — no cash, no trust issues, no fraud.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 items-start mb-14">
                {isConnected ? (
                  <Link href={dashboardPath}>
                    <button className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-base hover:opacity-90 transition-all shadow-lg shadow-cyan-500/25">
                      {isRoleLoading ? 'Loading...' : 'Go to Dashboard'}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2">
                    <ConnectButton />
                    <p className="text-xs text-slate-500 pl-1">MetaMask required · Sepolia testnet</p>
                  </div>
                )}
                <Link href="/verify-voucher">
                  <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/15 text-slate-300 font-medium text-base hover:bg-white/5 hover:border-white/25 transition-all">
                    Verify a Voucher
                  </button>
                </Link>
              </div>

              {/* How it works steps */}
              <div className="grid grid-cols-2 gap-4">
                {steps.map((step) => (
                  <div key={step.number} className="flex items-start gap-3">
                    <span className="text-xl font-black text-cyan-500/50 leading-none mt-0.5 shrink-0 w-7">{step.number}</span>
                    <div>
                      <p className="text-sm font-semibold text-white leading-snug">{step.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{step.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Hero image ── */}
            <div className="relative z-10 flex items-center justify-center lg:justify-end">
              <div className="relative w-full max-w-[520px]">

                {/* Glow ring behind image */}
                <div
                  className="absolute inset-[-2px] rounded-3xl z-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(59,130,246,0.2), transparent)',
                    filter: 'blur(1px)',
                  }}
                />

                {/* Image container */}
                <div className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60">
                  <img
                    src="/hero-gas-cylinder.png"
                    alt="Smart gas cylinder swap station with QR code scanning"
                    className="w-full h-auto object-cover"
                    style={{ display: 'block', maxHeight: '620px', objectFit: 'cover', objectPosition: 'center top' }}
                  />
                  {/* Subtle bottom fade so image blends into page */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-32"
                    style={{ background: 'linear-gradient(to top, rgba(2,6,23,0.7) 0%, transparent 100%)' }}
                  />
                </div>

                {/* Floating stat badge — top left of image */}
                <div className="absolute -top-4 -left-4 z-20 bg-slate-900 border border-white/15 rounded-2xl px-4 py-3 shadow-xl">
                  <p className="text-xs text-slate-400 mb-0.5">Vouchers issued</p>
                  <p className="text-xl font-extrabold text-cyan-400">
                    {stats?.totalVouchers ?? '—'}
                  </p>
                </div>

                {/* Floating badge — bottom right */}
                <div className="absolute -bottom-4 -right-4 z-20 bg-slate-900 border border-white/15 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Network</p>
                    <p className="text-sm font-bold text-white">Ethereum Sepolia</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURES SECTION
      ═══════════════════════════════════════ */}
      <section className="py-24 border-t border-white/8 bg-slate-950">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Built on blockchain. Built for Rwanda.</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Every cylinder swap is a smart contract transaction — verifiable, tamper-proof, and instant.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/8 bg-slate-900/60 p-8 hover:border-cyan-500/30 hover:bg-slate-900 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/15 to-blue-600/15 border border-cyan-500/20 flex items-center justify-center mb-5 group-hover:border-cyan-500/40 transition-colors">
                  <feature.icon className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PLATFORM STATS (only if connected)
      ═══════════════════════════════════════ */}
      {isConnected && (
        <section className="py-20 border-t border-white/8 bg-slate-900/40">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-bold text-white text-center mb-12">Platform Stats</h2>
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {[1,2,3,4].map(i => (
                  <div key={i} className="animate-pulse rounded-2xl bg-slate-800 h-28" />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {[
                  { value: stats.totalCompanies, label: 'Companies', icon: Building2 },
                  { value: stats.totalBranches, label: 'Branches', icon: GitBranch },
                  { value: stats.totalVouchers, label: 'Vouchers Issued', icon: Ticket },
                  { value: stats.completedSwaps, label: 'Completed Swaps', icon: CheckCircle2 },
                ].map(({ value, label, icon: Icon }) => (
                  <div key={label} className="rounded-2xl border border-white/8 bg-slate-900 p-6 text-center">
                    <Icon className="h-5 w-5 text-cyan-400 mx-auto mb-3 opacity-70" />
                    <p className="text-3xl font-extrabold text-cyan-400 mb-1">{value}</p>
                    <p className="text-xs text-slate-500 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer className="border-t border-white/8 bg-slate-950 py-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white">GasSwap</span>
          </div>
          <p className="text-xs text-slate-600 text-center">
            &copy; {new Date().getFullYear()} GasSwap. Blockchain-powered gas cylinder exchange for Rwanda.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-slate-500">Ethereum Sepolia</span>
          </div>
        </div>
      </footer>
    </div>
  );
}