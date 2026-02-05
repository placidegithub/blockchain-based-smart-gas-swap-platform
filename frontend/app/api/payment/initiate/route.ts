import { NextRequest, NextResponse } from 'next/server';

interface PaymentRequest {
  phone: string;
  amount: number;
  transactionRef: string;
  callbackUrl?: string;
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\s/g, '').replace(/[^0-9+]/g, '');
  
  if (cleaned.startsWith('+250')) {
    return cleaned.substring(1); // Remove + for API
  }
  if (cleaned.startsWith('250')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '250' + cleaned.substring(1);
  }
  return '250' + cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json();
    const { phone, amount, transactionRef, callbackUrl } = body;

    if (!phone || !amount || !transactionRef) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: phone, amount, transactionRef' },
        { status: 400 }
      );
    }

    const apiId = process.env.HDEV_API_ID;
    const apiKey = process.env.HDEV_API_KEY;

    if (!apiId || !apiKey) {
      console.error('HdevPayment API credentials not configured');
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const formattedPhone = formatPhoneNumber(phone);
    const apiUrl = `https://payment.hdevtech.cloud/api_pay/api/${apiId}/${apiKey}`;

    console.log('=== INITIATING PAYMENT ===');
    console.log(`Phone: ${formattedPhone}`);
    console.log(`Amount: ${amount} RWF`);
    console.log(`Transaction Ref: ${transactionRef}`);
    console.log('==========================');

    const formData = new URLSearchParams();
    formData.append('ref', 'pay');
    formData.append('tel', formattedPhone);
    formData.append('tx_ref', transactionRef);
    formData.append('amount', amount.toString());
    if (callbackUrl) {
      formData.append('link', callbackUrl);
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();
    console.log('Payment API response:', result);

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.message || 'Payment initiation failed',
          details: result 
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment request sent. Please check your phone to confirm.',
      transactionRef,
      transactionId: result.transaction_id || result.tx_ref,
      status: 'pending',
      data: result,
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
