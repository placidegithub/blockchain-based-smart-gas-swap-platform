import { saveNotificationStatusRecord } from './notification-status';

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
  warning?: boolean;
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
      const failedResult = {
        success: false,
        error: result.error || `Request failed with status ${response.status}`,
      };
      saveNotificationStatusRecord({
        voucherId: data.voucherId,
        eventType: 'voucher_created',
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        email: { sent: false, error: failedResult.error },
        sms: { sent: false, error: failedResult.error },
        message: failedResult.error,
        warning: true,
      });
      return failedResult;
    }

    const notificationResult = result as NotificationResult;
    saveNotificationStatusRecord({
      voucherId: data.voucherId,
      eventType: 'voucher_created',
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      email: notificationResult.results?.email ?? { sent: false, error: null },
      sms: notificationResult.results?.sms ?? { sent: false, error: null },
      message: notificationResult.message,
      warning: notificationResult.warning || !notificationResult.success,
    });

    return notificationResult;
  } catch (error) {
    console.error('Failed to send voucher notification:', error);
    saveNotificationStatusRecord({
      voucherId: data.voucherId,
      eventType: 'voucher_created',
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      email: { sent: false, error: error instanceof Error ? error.message : 'Network error occurred' },
      sms: { sent: false, error: error instanceof Error ? error.message : 'Network error occurred' },
      message: error instanceof Error ? error.message : 'Network error occurred',
      warning: true,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}
