'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';
import {
  clearNotificationStatusRecords,
  getNotificationStatusRecords,
  type NotificationStatusRecord,
} from '@/lib/notification-status';
import { Bell, CheckCircle2, Mail, MessageSquare, Trash2, XCircle } from 'lucide-react';

interface NotificationStatusPanelProps {
  className?: string;
}

function ChannelBadge({
  label,
  sent,
  error,
  icon,
}: {
  label: string;
  sent: boolean;
  error: string | null;
  icon: React.ReactNode;
}) {
  return (
    <span
      title={error || undefined}
      className={cn(
        'inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium',
        sent
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border-red-500/30 bg-red-500/10 text-red-400'
      )}
    >
      {icon}
      {label}
      {sent ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
    </span>
  );
}

export function NotificationStatusPanel({ className }: NotificationStatusPanelProps) {
  const [records, setRecords] = useState<NotificationStatusRecord[]>([]);

  useEffect(() => {
    const refresh = () => setRecords(getNotificationStatusRecords(5));
    refresh();

    window.addEventListener('gasswap_notification_status_updated', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('gasswap_notification_status_updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  return (
    <Card variant="glow" className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-cyan-400" />
            Recent Notifications
          </CardTitle>
          <CardDescription>Email and phone SMS delivery status</CardDescription>
        </div>
        {records.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Clear notification history"
            onClick={() => {
              clearNotificationStatusRecords();
              setRecords([]);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {records.length > 0 ? (
          records.map((record) => (
            <div key={record.id} className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {record.eventType === 'voucher_created' ? 'Voucher created' : 'Voucher redeemed'} • {record.voucherId}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {record.customerName || 'Customer'}{record.customerPhone ? ` • ${record.customerPhone}` : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(Math.floor(record.createdAt / 1000))}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <ChannelBadge
                  label="Email"
                  sent={record.email.sent}
                  error={record.email.error}
                  icon={<Mail className="h-3 w-3" />}
                />
                <ChannelBadge
                  label="SMS"
                  sent={record.sms.sent}
                  error={record.sms.error}
                  icon={<MessageSquare className="h-3 w-3" />}
                />
              </div>
              {record.message && (
                <p className={cn('mt-2 text-xs', record.warning ? 'text-yellow-400' : 'text-muted-foreground')}>
                  {record.message}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No notification attempts recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
