import { NextRequest, NextResponse } from 'next/server';

interface StatusRequest {
  transactionRef: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: StatusRequest = await request.json();
    const { transactionRef } = body;

    if (!transactionRef) {
      return NextResponse.json(
        { success: false, error: 'Missing transactionRef' },
        { status: 400 }
      );
    }

    const apiId = process.env.HDEV_API_ID;
    const apiKey = process.env.HDEV_API_KEY;

    if (!apiId || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    const apiUrl = `https://payment.hdevtech.cloud/api_pay/api/${apiId}/${apiKey}`;

    const formData = new URLSearchParams();
    formData.append('ref', 'read');
    formData.append('tx_ref', transactionRef);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json();
    console.log('Payment status response:', result);

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false,
          status: 'failed',
          transactionRef,
          error: result.message || 'Failed to get payment status',
        },
        { status: response.status }
      );
    }

    // Map API response to our status format
    let status: 'pending' | 'completed' | 'failed' | 'cancelled' = 'pending';
    
    if (result.status === 'successful' || result.status === 'completed' || result.status === 'success') {
      status = 'completed';
    } else if (result.status === 'failed' || result.status === 'error') {
      status = 'failed';
    } else if (result.status === 'cancelled' || result.status === 'canceled') {
      status = 'cancelled';
    }

    return NextResponse.json({
      success: true,
      status,
      transactionRef,
      amount: result.amount,
      phone: result.tel || result.phone,
      message: result.message || `Payment ${status}`,
      data: result,
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { 
        success: false,
        status: 'failed',
        transactionRef: '',
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
