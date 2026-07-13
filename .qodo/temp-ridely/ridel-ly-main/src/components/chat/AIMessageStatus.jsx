import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AIMessageStatus({ status, timestamp }) {
  const statusConfig = {
    sending: { icon: Clock, color: 'text-slate-400', label: 'Sending...' },
    sent: { icon: Check, color: 'text-slate-400', label: 'Sent' },
    delivered: { icon: CheckCheck, color: 'text-slate-400', label: 'Delivered' },
    read: { icon: CheckCheck, color: 'text-blue-500', label: 'Read' },
    failed: { icon: AlertCircle, color: 'text-red-500', label: 'Failed' }
  };

  const config = statusConfig[status] || statusConfig.sent;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1 mt-1">
      {timestamp && (
        <span className="text-[10px] text-slate-400">
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
      <Icon className={cn("w-3 h-3", config.color)} />
    </div>
  );
}