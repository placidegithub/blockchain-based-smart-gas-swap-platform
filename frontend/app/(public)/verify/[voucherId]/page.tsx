"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Clock,
  Building2,
  MapPin,
  User,
  Cylinder,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getVoucherStatusLabel,
  useVerifyVoucher,
  useVoucher,
  VoucherStatus,
} from "@/lib/hooks/use-vouchers";
import { useCompany, useBranch } from "@/lib/hooks/use-companies";
import { useCylinder, useCylinderType } from "@/lib/hooks/use-cylinders";
import { useVoucherCustomerInfo } from "@/lib/hooks/use-recent-vouchers";
import { useVoucherChainProof } from "@/lib/hooks/use-chain-activity";
import { cn, formatDate, formatVoucherId, shortenAddress } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Redeemed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Expired: "bg-red-500/20 text-red-400 border-red-500/30",
  Cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 py-3 last:border-b-0">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm text-white text-right min-w-0">{value}</div>
    </div>
  );
}

function statusMessage(status: string, isValid: boolean) {
  if (isValid) return "This voucher is active and can be redeemed.";
  if (status === "Redeemed") return "This voucher is genuine, but it has already been redeemed.";
  if (status === "Expired") return "This voucher is genuine, but its validity period has ended.";
  if (status === "Cancelled") return "This voucher is genuine, but it was cancelled.";
  return "This voucher could not be verified as active.";
}

export default function VerifyVoucherPage() {
  const params = useParams();
  const voucherId = params.voucherId as string;
  const [parsedId, setParsedId] = useState<bigint | undefined>(undefined);

  useEffect(() => {
    try {
      if (voucherId && /^\d+$/.test(voucherId)) {
        setParsedId(BigInt(voucherId));
      } else {
        setParsedId(undefined);
      }
    } catch {
      setParsedId(undefined);
    }
  }, [voucherId]);

  const { verification, isLoading: isVerifying, error: verifyError } = useVerifyVoucher(parsedId);
  const { voucher, isLoading: isLoadingVoucher } = useVoucher(
    verification && verification.companyId > 0n ? parsedId : undefined
  );
  const { customerInfo } = useVoucherCustomerInfo(voucher?.id);
  const { company } = useCompany(voucher?.companyId ?? verification?.companyId);
  const { branch: sourceBranch } = useBranch(voucher?.sourceBranchId);
  const { branch: redemptionBranch } = useBranch(
    voucher?.redemptionBranchId && voucher.redemptionBranchId > 0n
      ? voucher.redemptionBranchId
      : undefined
  );
  const { cylinderType } = useCylinderType(voucher?.cylinderTypeId ?? verification?.cylinderTypeId);
  const { cylinder: depositedCylinder } = useCylinder(voucher?.depositedCylinderId);
  const { cylinder: redeemedCylinder } = useCylinder(
    voucher?.redeemedCylinderId && voucher.redeemedCylinderId > 0n
      ? voucher.redeemedCylinderId
      : undefined
  );
  const { data: proof, isLoading: isLoadingProof } = useVoucherChainProof(parsedId);

  const isInvalidId = parsedId === undefined;
  const isLoading = isVerifying || isLoadingVoucher;
  const status = voucher
    ? getVoucherStatusLabel(voucher.status as VoucherStatus)
    : verification?.status;
  const isActive = Boolean(verification?.isValid);
  const displayVoucherId = parsedId ? formatVoucherId(parsedId) : voucherId;
  const createdTxUrl = proof?.createdTxHash && proof.explorerBaseUrl
    ? `${proof.explorerBaseUrl}/tx/${proof.createdTxHash}`
    : "";
  const redeemedTxUrl = proof?.redeemedTxHash && proof.explorerBaseUrl
    ? `${proof.explorerBaseUrl}/tx/${proof.redeemedTxHash}`
    : "";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/verify">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Verify
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
          <CardTitle className="text-lg">Voucher Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg bg-white/5 border border-border p-4">
            <p className="text-xs text-slate-400 mb-1">Voucher</p>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-lg text-white">{displayVoucherId}</p>
              {parsedId && (
                <p className="font-mono text-xs text-slate-500">Numeric ID #{parsedId.toString()}</p>
              )}
            </div>
          </div>

          {isInvalidId && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-yellow-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Invalid Voucher ID</h3>
              <p className="text-sm text-slate-400 text-center">
                Enter a numeric voucher ID or scan a GasSwap QR code.
              </p>
            </div>
          )}

          {isLoading && !isInvalidId && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-4" />
              <p className="text-sm text-slate-400">Verifying on blockchain...</p>
            </div>
          )}

          {verifyError && !isLoading && (
            <div className="flex flex-col items-center py-8">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Verification Failed</h3>
              <p className="text-sm text-slate-400 text-center">
                This voucher does not exist or the Sepolia RPC is unavailable.
              </p>
            </div>
          )}

          {verification && !isLoading && !verifyError && (
            <>
              <div className="flex flex-col items-center py-4">
                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center mb-4",
                    isActive ? "bg-emerald-500/10" : "bg-blue-500/10"
                  )}
                >
                  {isActive ? (
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  ) : (
                    <ShieldCheck className="h-8 w-8 text-blue-400" />
                  )}
                </div>
                <h3 className={cn("text-lg font-medium", isActive ? "text-emerald-400" : "text-blue-400")}>
                  {isActive ? "Valid Active Voucher" : "Voucher Found"}
                </h3>
                <p className="text-sm text-slate-400 text-center mt-1">
                  {statusMessage(status ?? "Unknown", isActive)}
                </p>
              </div>

              <div className="rounded-lg bg-white/5 border border-border p-4">
                <DetailRow
                  label="Status"
                  value={
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        statusStyles[status ?? "Pending"] || statusStyles.Pending
                      )}
                    >
                      {status ?? "Unknown"}
                    </span>
                  }
                />
                <DetailRow
                  label="Company"
                  icon={<Building2 className="h-4 w-4" />}
                  value={company ? `${company.name} (${company.code})` : `Company #${verification.companyId.toString()}`}
                />
                <DetailRow
                  label="Cylinder Type"
                  icon={<Cylinder className="h-4 w-4" />}
                  value={cylinderType?.sizeName ?? `Type #${verification.cylinderTypeId.toString()}`}
                />
                {voucher && (
                  <>
                    <DetailRow
                      label="Customer"
                      icon={<User className="h-4 w-4" />}
                      value={
                        <div className="space-y-1">
                          <p>{customerInfo?.name || "Not recorded"}</p>
                          <p className="font-mono text-xs text-slate-400">
                            {shortenAddress(voucher.customer, 6)}
                          </p>
                        </div>
                      }
                    />
                    <DetailRow
                      label="Source Branch"
                      icon={<MapPin className="h-4 w-4" />}
                      value={sourceBranch ? `${sourceBranch.name}, ${sourceBranch.district}` : `Branch #${voucher.sourceBranchId.toString()}`}
                    />
                    <DetailRow
                      label="Deposited Cylinder"
                      value={depositedCylinder?.serialNumber || `Token #${voucher.depositedCylinderId.toString()}`}
                    />
                    <DetailRow
                      label="Created"
                      icon={<Clock className="h-4 w-4" />}
                      value={formatDate(Number(voucher.createdAt))}
                    />
                    <DetailRow
                      label="Expires"
                      value={formatDate(Number(voucher.expiresAt))}
                    />
                  </>
                )}
                {Number(verification.daysRemaining) > 0 && status === "Active" && (
                  <DetailRow
                    label="Days Remaining"
                    value={
                      <span className="font-bold text-cyan-400">
                        {Number(verification.daysRemaining)} days
                      </span>
                    }
                  />
                )}
                {voucher && voucher.redeemedAt > 0n && (
                  <>
                    <DetailRow
                      label="Redemption Branch"
                      value={redemptionBranch ? `${redemptionBranch.name}, ${redemptionBranch.district}` : `Branch #${voucher.redemptionBranchId.toString()}`}
                    />
                    <DetailRow
                      label="Redeemed Cylinder"
                      value={redeemedCylinder?.serialNumber || `Token #${voucher.redeemedCylinderId.toString()}`}
                    />
                    <DetailRow
                      label="Redeemed By"
                      value={<span className="font-mono">{shortenAddress(voucher.redeemedBy, 6)}</span>}
                    />
                    <DetailRow
                      label="Redeemed At"
                      value={formatDate(Number(voucher.redeemedAt))}
                    />
                  </>
                )}
              </div>

              <div className="rounded-lg bg-slate-900/80 border border-white/10 p-4">
                <h4 className="text-sm font-semibold text-white mb-3">On-chain Evidence</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button asChild variant="outline" disabled={!createdTxUrl}>
                    <a href={createdTxUrl || undefined} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Creation TX
                    </a>
                  </Button>
                  <Button asChild variant="outline" disabled={!redeemedTxUrl}>
                    <a href={redeemedTxUrl || undefined} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Redemption TX
                    </a>
                  </Button>
                </div>
                {isLoadingProof && (
                  <p className="text-xs text-slate-500 mt-3">Loading transaction proof...</p>
                )}
                {!isLoadingProof && !createdTxUrl && (
                  <p className="text-xs text-slate-500 mt-3">
                    Transaction hash not found in the recent RPC scan window. The voucher state above is still read directly from the contract.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-slate-500 mt-6">
        No wallet connection required. Verification reads directly from Sepolia smart contracts.
      </p>
    </div>
  );
}
