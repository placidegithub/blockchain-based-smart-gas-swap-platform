export interface VoucherNotificationData {
  voucherId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  branchName: string;
  cylinderType: string;
  expiresAt: string;
  qrCodeDataUrl?: string;
  serviceFee?: string;
  paymentStatus?: string;
}

export interface NotificationResult {
  success: boolean;
  results?: {
    email: { sent: boolean; error: string | null };
    sms: { sent: boolean; error: string | null };
  };
  message?: string;
  error?: string;
}

export async function sendVoucherNotification(
  data: VoucherNotificationData
): Promise<NotificationResult> {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Request failed with status ${response.status}`,
      };
    }

    return result as NotificationResult;
  } catch (error) {
    console.error('Failed to send voucher notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}
