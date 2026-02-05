'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { Wallet, ChevronDown, LogOut, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/utils';
import { getChainById, supportedChains, localhost } from '@/lib/chains';

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const chain = chainId ? getChainById(chainId) : null;
  const isCorrectNetwork = chainId ? supportedChains.some(c => c.id === chainId) : false;
  const injectedConnector = connectors.find(c => c.id === 'injected') || connectors[0];

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = () => {
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  const handleSwitchNetwork = () => {
    switchChain({ chainId: localhost.id });
  };

  if (!isConnected) {
    return (
      <div className="relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          loading={isPending}
          className="gap-2"
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </Button>

        {isOpen && !isPending && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-white/10 bg-slate-900 p-3 shadow-xl">
              <div className="px-2 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                Connect Wallet
              </div>
              
              {connectError && (
                <div className="px-3 py-2 text-xs text-red-400 bg-red-500/10 rounded-lg mb-2 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{connectError.message || 'Failed to connect'}</span>
                </div>
              )}

              <button
                onClick={handleConnect}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm text-white hover:bg-white/5 transition-colors border border-white/10"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <svg viewBox="0 0 35 33" className="h-6 w-6">
                    <path fill="#E17726" d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z"/>
                    <path fill="#E27625" d="M2.66296 1L15.6778 10.809L13.3547 4.99098L2.66296 1Z"/>
                    <path fill="#E27625" d="M28.2295 23.5335L24.7345 28.872L32.1693 30.9323L34.3211 23.6501L28.2295 23.5335Z"/>
                    <path fill="#E27625" d="M1.31836 23.6501L3.45765 30.9323L10.8799 28.872L7.39749 23.5335L1.31836 23.6501Z"/>
                    <path fill="#E27625" d="M10.4706 14.5149L8.39185 17.6507L15.8168 17.9873L15.5619 9.94189L10.4706 14.5149Z"/>
                    <path fill="#E27625" d="M25.1505 14.5149L19.9718 9.85107L19.8241 17.9873L27.2365 17.6507L25.1505 14.5149Z"/>
                    <path fill="#E27625" d="M10.8799 28.8721L15.3874 26.6855L11.5008 23.7048L10.8799 28.8721Z"/>
                    <path fill="#E27625" d="M20.2339 26.6855L24.7344 28.8721L24.1261 23.7048L20.2339 26.6855Z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium">MetaMask</div>
                  <div className="text-xs text-slate-400">Connect to your wallet</div>
                </div>
              </button>

              <div className="mt-3 px-2 text-xs text-slate-500 space-y-1">
                <p>Make sure MetaMask is installed and unlocked</p>
                <p className="text-yellow-500">💡 If stuck, click MetaMask icon in browser toolbar</p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-slate-800/50 hover:bg-slate-800 transition-all"
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isCorrectNetwork ? 'bg-green-400' : 'bg-yellow-400'
            }`}
          />
          <span className="text-sm text-slate-300">
            {chain?.name || `Chain ${chainId}`}
          </span>
        </div>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Wallet className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-medium text-white">
            {shortenAddress(address || '')}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-white/10 bg-slate-900 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {shortenAddress(address || '', 6)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {chain?.name || `Chain ${chainId}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={handleCopyAddress}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span>{copied ? 'Copied!' : 'Copy Address'}</span>
              </button>

              {!isCorrectNetwork && (
                <button
                  onClick={handleSwitchNetwork}
                  disabled={isSwitching}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-yellow-400 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"
                >
                  <div className="w-4 h-4 rounded-full border-2 border-yellow-400 flex items-center justify-center">
                    <span className="text-xs">!</span>
                  </div>
                  <span>{isSwitching ? 'Switching...' : 'Switch to Localhost'}</span>
                </button>
              )}
            </div>

            <div className="p-2 border-t border-white/10">
              <button
                onClick={() => {
                  disconnect();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
