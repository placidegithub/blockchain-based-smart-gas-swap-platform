'use client';

import * as React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoucherQRCodeProps {
  voucherId: string;
  baseUrl?: string;
  size?: number;
  className?: string;
}

export function VoucherQRCode({
  voucherId,
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
  size = 200,
  className,
}: VoucherQRCodeProps) {
  const [copied, setCopied] = React.useState(false);
  const qrRef = React.useRef<HTMLDivElement>(null);

  const verifyUrl = `${baseUrl}/vouchers/verify/${voucherId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `voucher-${voucherId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div
        ref={qrRef}
        className="p-4 bg-white rounded-xl shadow-lg"
      >
        <QRCodeSVG
          value={verifyUrl}
          size={size}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#0f172a"
        />
      </div>

      <p className="text-xs font-mono text-muted-foreground text-center break-all max-w-[200px]">
        {voucherId}
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
