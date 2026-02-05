'use client';

import * as React from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CameraOff, Keyboard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoucherScannerProps {
  onScan: (voucherId: string) => void;
  className?: string;
}

type ScanMode = 'camera' | 'manual';
type CameraState = 'idle' | 'starting' | 'active' | 'error';

export function VoucherScanner({ onScan, className }: VoucherScannerProps) {
  const [scanMode, setScanMode] = React.useState<ScanMode>('camera');
  const [cameraState, setCameraState] = React.useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [scannedResult, setScannedResult] = React.useState<string>('');
  const [manualInput, setManualInput] = React.useState('');

  const scannerRef = React.useRef<Html5Qrcode | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const stopCamera = React.useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }
    setCameraState('idle');
  }, []);

  const extractVoucherId = (text: string): string => {
    try {
      const parsed = JSON.parse(text);
      if (parsed.voucherId) return parsed.voucherId;
    } catch {
      // Not JSON, check for URL pattern
    }
    const urlMatch = text.match(/\/verify\/([A-Za-z0-9-]+)/);
    if (urlMatch) return urlMatch[1];
    return text;
  };

  const startCamera = React.useCallback(async () => {
    if (!containerRef.current) return;
    if (scannerRef.current) return; // Already starting/started

    setCameraState('starting');
    setErrorMessage('');

    // Small delay to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      const scanner = new Html5Qrcode('qr-scanner-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
          aspectRatio: 1,
        },
        (decodedText: string) => {
          const voucherId = extractVoucherId(decodedText);
          setScannedResult(voucherId);
          onScan(voucherId);
          stopCamera();
        },
        () => {} // Ignore scan errors (no QR found yet)
      );

      setCameraState('active');
    } catch (err) {
      setCameraState('error');
      scannerRef.current = null;
      const error = err as Error;
      console.error('Camera error:', error);
      if (error.message?.includes('Permission') || error.name === 'NotAllowedError') {
        setErrorMessage('Camera permission denied. Please allow camera access or use manual entry.');
      } else if (error.message?.includes('NotFound') || error.name === 'NotFoundError') {
        setErrorMessage('No camera found. Please use manual entry.');
      } else if (error.message?.includes('NotReadable') || error.name === 'NotReadableError') {
        setErrorMessage('Camera is in use by another application. Please close other apps using the camera.');
      } else {
        setErrorMessage(`Failed to start camera: ${error.message || 'Unknown error'}. Please use manual entry.`);
      }
    }
  }, [onScan, stopCamera]);

  React.useEffect(() => {
    if (scanMode === 'camera' && cameraState === 'idle') {
      const timer = setTimeout(startCamera, 300);
      return () => clearTimeout(timer);
    }
  }, [scanMode, cameraState, startCamera]);

  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      const voucherId = extractVoucherId(manualInput.trim());
      setScannedResult(voucherId);
      onScan(voucherId);
    }
  };

  const handleSwitchMode = (mode: ScanMode) => {
    if (mode !== scanMode) {
      stopCamera();
      setScanMode(mode);
      setScannedResult('');
      setErrorMessage('');
    }
  };

  const handleScanAnother = () => {
    setScannedResult('');
    setManualInput('');
    if (scanMode === 'camera') {
      startCamera();
    }
  };

  return (
    <Card variant="glow" className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="h-5 w-5 text-cyan-400" />
          Scan Voucher QR Code
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={scanMode === 'camera' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSwitchMode('camera')}
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
          <Button
            variant={scanMode === 'manual' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSwitchMode('manual')}
          >
            <Keyboard className="h-4 w-4 mr-2" />
            Manual Entry
          </Button>
        </div>

        {scannedResult ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-emerald-500/20 p-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Scanned Voucher ID</p>
              <p className="font-mono text-foreground break-all">{scannedResult}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleScanAnother}>
              Scan Another
            </Button>
          </div>
        ) : scanMode === 'camera' ? (
          <div className="space-y-4">
            <div
              ref={containerRef}
              className="relative rounded-lg overflow-hidden bg-black/50 aspect-square max-w-[300px] mx-auto"
            >
              <div id="qr-scanner-container" className="w-full h-full" />

              {cameraState === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
                    <p className="text-sm text-muted-foreground">Starting camera...</p>
                  </div>
                </div>
              )}

              {cameraState === 'error' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                  <div className="flex flex-col items-center gap-2 p-4">
                    <CameraOff className="h-8 w-8 text-red-400" />
                    <p className="text-sm text-center text-red-400">{errorMessage}</p>
                  </div>
                </div>
              )}
            </div>

            {cameraState === 'active' && (
              <p className="text-xs text-center text-muted-foreground">
                Position the QR code within the frame
              </p>
            )}

            {cameraState === 'error' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSwitchMode('manual')}
              >
                <Keyboard className="h-4 w-4 mr-2" />
                Use Manual Entry
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <Input
              variant="glow"
              placeholder="Enter voucher ID or paste verification URL"
              value={manualInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualInput(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={!manualInput.trim()}>
              Verify Voucher
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
