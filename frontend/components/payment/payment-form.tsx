'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  getCylinderPrice, 
  formatRWF, 
  generateTransactionRef,
  initiatePayment,
  checkPaymentStatus,
  markVoucherAsPaid,
} from '@/lib/payment';
import { Banknote, Smartphone, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

interface PaymentFormProps {
  voucherId: string;
  customerName: string;
  customerPhone: string;
  cylinderType: string;
  branchId?: string;
  companyId?: string;
  onPaymentComplete?: (transactionRef: string) => void;
  onSkip?: () => void;
  className?: string;
}

type PaymentMethod = 'cash' | 'momo' | null;
type PaymentStatus = 'idle' | 'initiating' | 'waiting' | 'checking' | 'completed' | 'failed';

export function PaymentForm({
  voucherId,
  customerName,
  customerPhone,
  cylinderType,
  branchId,
  companyId,
  onPaymentComplete,
  onSkip,
  className,
}: PaymentFormProps) {
  const { address } = useAccount();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [statusCheckCount, setStatusCheckCount] = useState(0);

  const amount = getCylinderPrice(cylinderType);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (paymentStatus === 'waiting' && transactionRef) {
      intervalId = setInterval(async () => {
        setStatusCheckCount(prev => prev + 1);
        
        const result = await checkPaymentStatus(transactionRef);
        
        if (result.status === 'completed') {
          setPaymentStatus('completed');
          clearInterval(intervalId);
          // Save to localStorage
          markVoucherAsPaid(voucherId, transactionRef, 'momo', amount, customerPhone, address, branchId, companyId);
          onPaymentComplete?.(transactionRef);
        } else if (result.status === 'failed' || result.status === 'cancelled') {
          setPaymentStatus('failed');
          setErrorMessage(result.message || 'Payment was not completed');
          clearInterval(intervalId);
        }
        
        // Stop checking after 60 attempts (5 minutes)
        if (statusCheckCount >= 60) {
          clearInterval(intervalId);
          setPaymentStatus('failed');
          setErrorMessage('Payment timeout. Please try again.');
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentStatus, transactionRef, statusCheckCount, onPaymentComplete, voucherId, amount, customerPhone, branchId, companyId]);

  const handleCashPayment = () => {
    console.log('[handleCashPayment] voucherId:', voucherId, 'cylinderType:', cylinderType, 'amount:', amount);
    const ref = generateTransactionRef();
    setTransactionRef(ref);
    setPaymentStatus('completed');
    // Save to localStorage and fund tracker
    const result = markVoucherAsPaid(voucherId, ref, 'cash', amount, customerPhone, address, branchId, companyId);
    console.log('[handleCashPayment] markVoucherAsPaid result:', result);
    onPaymentComplete?.(ref);
  };

  const handleMomoPayment = async () => {
    setPaymentStatus('initiating');
    setErrorMessage('');
    
    const ref = generateTransactionRef();
    setTransactionRef(ref);

    const result = await initiatePayment({
      phone: customerPhone,
      amount,
      transactionRef: ref,
    });

    if (result.success) {
      setPaymentStatus('waiting');
      setStatusCheckCount(0);
    } else {
      setPaymentStatus('failed');
      setErrorMessage(result.error || 'Failed to initiate payment');
    }
  };

  const handleRetry = () => {
    setPaymentStatus('idle');
    setPaymentMethod(null);
    setErrorMessage('');
    setTransactionRef('');
  };

  if (paymentStatus === 'completed') {
    return (
      <Card variant="glow" className={cn('w-full max-w-md', className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-emerald-500/20 p-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-emerald-400">Payment Successful!</h3>
            <div className="text-center space-y-1">
              <p className="text-muted-foreground">Amount: <span className="text-foreground font-semibold">{formatRWF(amount)}</span></p>
              <p className="text-muted-foreground">Method: <span className="text-foreground">{paymentMethod === 'cash' ? 'Cash' : 'MTN Mobile Money'}</span></p>
              <p className="text-xs text-muted-foreground font-mono">Ref: {transactionRef}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'waiting') {
    return (
      <Card variant="glow" className={cn('w-full max-w-md', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-400 animate-pulse" />
            Waiting for Payment
          </CardTitle>
          <CardDescription>
            A payment request has been sent to {customerPhone}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-12 w-12 text-cyan-400 animate-spin" />
            <div className="text-center space-y-2">
              <p className="text-foreground">Please check your phone and enter your MTN PIN to confirm payment</p>
              <p className="text-2xl font-bold text-cyan-400">{formatRWF(amount)}</p>
            </div>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-sm text-yellow-400">
              📱 Open your MTN Mobile Money prompt and enter your PIN to complete the payment.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={handleRetry} className="w-full">
            Cancel & Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Card variant="glow" className={cn('w-full max-w-md', className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="rounded-full bg-red-500/20 p-4">
              <XCircle className="h-12 w-12 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-red-400">Payment Failed</h3>
            <p className="text-muted-foreground text-center">{errorMessage}</p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={handleRetry} className="flex-1">
            Try Again
          </Button>
          {onSkip && (
            <Button variant="ghost" onClick={onSkip} className="flex-1">
              Skip Payment
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card variant="glow" className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle>Payment Required</CardTitle>
        <CardDescription>
          Complete payment for {customerName}&apos;s voucher
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-background/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cylinder Type:</span>
            <span className="font-medium">{cylinderType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount Due:</span>
            <span className="text-xl font-bold text-cyan-400">{formatRWF(amount)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Select Payment Method:</p>
          
          <button
            type="button"
            onClick={() => setPaymentMethod('cash')}
            className={cn(
              'w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4',
              paymentMethod === 'cash'
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-border hover:border-cyan-500/50'
            )}
          >
            <div className="rounded-full bg-emerald-500/20 p-3">
              <Banknote className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="text-left">
              <p className="font-medium">Cash Payment</p>
              <p className="text-sm text-muted-foreground">Customer pays in cash</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod('momo')}
            className={cn(
              'w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4',
              paymentMethod === 'momo'
                ? 'border-cyan-400 bg-cyan-500/10'
                : 'border-border hover:border-cyan-500/50'
            )}
          >
            <div className="rounded-full bg-yellow-500/20 p-3">
              <Smartphone className="h-6 w-6 text-yellow-400" />
            </div>
            <div className="text-left">
              <p className="font-medium">MTN Mobile Money</p>
              <p className="text-sm text-muted-foreground">Pay via {customerPhone}</p>
            </div>
          </button>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={paymentMethod === 'cash' ? handleCashPayment : handleMomoPayment}
          disabled={!paymentMethod || paymentStatus === 'initiating'}
          className="flex-1"
        >
          {paymentStatus === 'initiating' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${formatRWF(amount)}`
          )}
        </Button>
        {onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
