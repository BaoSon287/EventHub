import React from 'react';
import { ArrowRightLeft, CheckCircle, RotateCcw, ShoppingBag } from 'lucide-react';
import { TicketTransferHistory } from '../../types/domain';
import { formatDateTime } from '../../utils/formatters';

const iconByAction = {
  LISTED: <ShoppingBag className="h-4 w-4" />,
  PURCHASED: <CheckCircle className="h-4 w-4" />,
  TRANSFERRED: <ArrowRightLeft className="h-4 w-4" />,
  CANCELLED: <RotateCcw className="h-4 w-4" />,
};

export const TicketHistory: React.FC<{ history: TicketTransferHistory[] }> = ({ history }) => {
  if (history.length === 0) {
    return <p className="rounded-lg border border-slate-100 bg-white p-4 text-sm font-semibold text-slate-500">No transfer history yet.</p>;
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div key={item.id} className="flex gap-3 rounded-lg border border-slate-100 bg-white p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            {iconByAction[item.action]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-black text-slate-900">{item.action.replace(/_/g, ' ')}</p>
              <p className="text-xs font-semibold text-slate-400">{formatDateTime(item.createdAt)}</p>
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              From {item.fromUserId || 'System'} to {item.toUserId || 'System'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
