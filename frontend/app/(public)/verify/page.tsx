"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolveVoucherId } from "@/lib/utils";

function extractVoucherId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/verify\/([A-Za-z0-9-]+)/);
  return match?.[1] ?? trimmed;
}

export default function VerifyLookupPage() {
  const router = useRouter();
  const [voucherInput, setVoucherInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const extracted = extractVoucherId(voucherInput);
    const resolved = resolveVoucherId(extracted);

    if (!resolved) {
      setError("Enter a numeric voucher ID or paste a GasSwap verification link.");
      return;
    }

    router.push(`/verify/${resolved}`);
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Home
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">GasSwap</span>
        </div>
      </div>

      <Card variant="glow">
        <CardHeader>
          <CardTitle className="text-lg">Verify Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              variant="glow"
              value={voucherInput}
              onChange={(event) => {
                setVoucherInput(event.target.value);
                setError("");
              }}
              placeholder="Enter voucher ID or paste verification link"
            />
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={!voucherInput.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Verify on Blockchain
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-500 mt-6">
        Verification reads directly from the deployed Sepolia smart contracts.
      </p>
    </div>
  );
}
