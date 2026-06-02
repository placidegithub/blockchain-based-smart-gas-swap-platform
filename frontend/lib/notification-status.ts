const NOTIFICATION_STATUS_KEY = 'gasswap_notification_statuses';
const MAX_NOTIFICATION_RECORDS = 50;

export type NotificationEventType = 'voucher_created' | 'voucher_redeemed';

export interface NotificationChannelStatus {
  sent: boolean;
  error: string | null;
}

export interface NotificationStatusRecord {
  id: string;
  voucherId: string;
  eventType: NotificationEventType;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  email: NotificationChannelStatus;
  sms: NotificationChannelStatus;
  message?: string;
  warning?: boolean;
  createdAt: number;
}

function readRecords(): NotificationStatusRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(NOTIFICATION_STATUS_KEY);
    return stored ? JSON.parse(stored) as NotificationStatusRecord[] : [];
  } catch (error) {
    console.error('Failed to read notification status records:', error);
    return [];
  }
}

function writeRecords(records: NotificationStatusRecord[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(NOTIFICATION_STATUS_KEY, JSON.stringify(records.slice(0, MAX_NOTIFICATION_RECORDS)));
    window.dispatchEvent(new CustomEvent('gasswap_notification_status_updated'));
  } catch (error) {
    console.error('Failed to save notification status records:', error);
  }
}

export function getNotificationStatusRecords(limit = 10): NotificationStatusRecord[] {
  return readRecords().slice(0, limit);
}

export function saveNotificationStatusRecord(
  record: Omit<NotificationStatusRecord, 'id' | 'createdAt'>
): NotificationStatusRecord {
  const newRecord: NotificationStatusRecord = {
    ...record,
    id: `notification_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
  };

  const existing = readRecords();
  writeRecords([newRecord, ...existing]);
  return newRecord;
}

export function clearNotificationStatusRecords(): void {
  writeRecords([]);
}
