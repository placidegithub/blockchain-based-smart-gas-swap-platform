"use client";

import { ExternalLink } from "lucide-react";
import { useChainId } from "wagmi";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/utils";

interface EtherscanTxLinkProps {
  txHash?: string;
  label?: string;
  className?: string;
  compact?: boolean;
}

function explorerBaseUrl(chainId: number) {
  if (chainId === 11155111) return "https://sepolia.etherscan.io";
  if (chainId === 1) return "https://etherscan.io";
  if (chainId === 137) return "https://polygonscan.com";
  if (chainId === 80001) return "https://mumbai.polygonscan.com";
  return "https://sepolia.etherscan.io";
}

export function EtherscanTxLink({
  txHash,
  label = "View on Sepolia Etherscan",
  className,
  compact = false,
}: EtherscanTxLinkProps) {
  const chainId = useChainId();

  if (!txHash) return null;

  const href = `${explorerBaseUrl(chainId)}/tx/${txHash}`;

  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className ?? "inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        <span className="font-mono">{shortenAddress(txHash, 6)}</span>
      </a>
    );
  }

  return (
    <Button asChild variant="outline" size="sm" className={className}>
      <a href={href} target="_blank" rel="noreferrer">
        <ExternalLink className="h-4 w-4 mr-2" />
        {label}
      </a>
    </Button>
  );
}
