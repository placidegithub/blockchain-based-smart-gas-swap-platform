"use client";

import { Activity, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/components/wallet/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useChainActivity } from "@/lib/hooks/use-chain-activity";
import { cn, shortenAddress } from "@/lib/utils";

const importantEvents = [
  "VoucherCreated",
  "VoucherRedeemed",
  "BranchRegistered",
  "CylinderRegistered",
  "StaffAssigned",
];

function eventTone(eventName: string) {
  if (eventName.includes("Redeemed")) return "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
  if (eventName.includes("Created") || eventName.includes("Registered")) return "text-cyan-300 bg-cyan-500/10 border-cyan-500/30";
  if (eventName.includes("Role") || eventName.includes("Staff")) return "text-purple-300 bg-purple-500/10 border-purple-500/30";
  return "text-slate-300 bg-slate-700/40 border-slate-600/40";
}

function TransactionsContent() {
  const { data, isLoading, isFetching, error, refetch } = useChainActivity(100);
  const stats = data?.stats;
  const events = data?.events ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Activity className="h-7 w-7 text-cyan-400" />
            Transaction Explorer
          </h1>
          <p className="text-slate-400 mt-2">
            Recent on-chain activity decoded from the deployed GasSwap contracts.
          </p>
        </div>

        <Button variant="outline" onClick={() => refetch()} loading={isFetching}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card variant="default" className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-5">
            <p className="text-red-300 text-sm">
              Could not load chain activity. Confirm MetaMask is on Sepolia and the RPC URL is working.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card variant="default">
          <CardContent className="py-5">
            <p className="text-sm text-slate-400">Events Scanned</p>
            <p className="text-2xl font-bold text-white mt-2">
              {isLoading ? "..." : stats?.totalEvents ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card variant="default">
          <CardContent className="py-5">
            <p className="text-sm text-slate-400">Latest Block</p>
            <p className="text-2xl font-bold text-white mt-2">
              {stats?.latestBlock?.toString() ?? "..."}
            </p>
          </CardContent>
        </Card>
        <Card variant="default">
          <CardContent className="py-5">
            <p className="text-sm text-slate-400">Voucher Creates</p>
            <p className="text-2xl font-bold text-white mt-2">
              {stats?.byEvent.VoucherCreated ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card variant="default">
          <CardContent className="py-5">
            <p className="text-sm text-slate-400">Voucher Redeems</p>
            <p className="text-2xl font-bold text-white mt-2">
              {stats?.byEvent.VoucherRedeemed ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              Event Types
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {importantEvents.map((name) => (
              <div key={name} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-300">{name}</span>
                <span className="font-mono text-white">{stats?.byEvent[name] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-lg">Recent Contract Events</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="h-16 rounded-lg bg-slate-800/70 animate-pulse" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-white font-medium">No events found in the recent scan window.</p>
                <p className="text-slate-400 text-sm mt-2">
                  Create or redeem a voucher, then refresh this page.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-white/10 bg-slate-900/60 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                              eventTone(event.eventName)
                            )}
                          >
                            {event.eventName}
                          </span>
                          <span className="text-xs text-slate-500">{event.contractName}</span>
                          <span className="text-xs text-slate-500">Block {event.blockNumber.toString()}</span>
                        </div>
                        <p className="text-sm text-white break-words">{event.summary}</p>
                        <p className="text-xs text-slate-500 mt-2 font-mono">
                          {shortenAddress(event.transactionHash, 8)}
                        </p>
                      </div>

                      {event.explorerUrl && (
                        <Button asChild variant="ghost" size="sm" className="shrink-0">
                          <a href={event.explorerUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Etherscan
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <RoleGuard role="staff">
      <TransactionsContent />
    </RoleGuard>
  );
}
