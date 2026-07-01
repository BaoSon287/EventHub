import React from 'react';

type KnownBadgeStatus =
  | 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  | 'paid' | 'pending_payment'
  | 'attendee' | 'organizer' | 'admin'
  | 'vip' | 'standard'
  | 'confirmed' | 'pending' | 'expired'
  | 'unpaid' | 'failed' | 'refunded'
  | 'draft' | 'published'
  | 'sent' | 'read';
type TicketBadgeStatus = 'owned' | 'listed_for_sale' | 'sold' | 'transferred' | 'used';

interface StatusBadgeProps {
  status: string;
  id?: string;
}

const styles: Record<KnownBadgeStatus | TicketBadgeStatus, { bg: string; label: string }> = {
  upcoming: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Sắp diễn ra' },
  ongoing: { bg: 'bg-blue-50 border-blue-200 text-blue-700', label: 'Đang diễn ra' },
  completed: { bg: 'bg-slate-50 border-slate-200 text-slate-600', label: 'Đã kết thúc' },
  cancelled: { bg: 'bg-red-50 border-red-200 text-red-600', label: 'Đã hủy' },
  paid: { bg: 'bg-green-50 border-green-200 text-green-700', label: 'Paid' },
  pending_payment: { bg: 'bg-amber-50 border-amber-200 text-amber-700', label: 'Pending payment' },
  attendee: { bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', label: 'Attendee' },
  organizer: { bg: 'bg-violet-50 border-violet-200 text-violet-700', label: 'Organizer' },
  admin: { bg: 'bg-teal-50 border-teal-200 text-teal-700', label: 'Admin' },
  vip: { bg: 'bg-rose-50 border-rose-200 text-rose-700', label: 'VIP' },
  standard: { bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', label: 'Standard' },
  confirmed: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Confirmed' },
  pending: { bg: 'bg-amber-50 border-amber-200 text-amber-700', label: 'Pending' },
  expired: { bg: 'bg-slate-50 border-slate-200 text-slate-600', label: 'Expired' },
  unpaid: { bg: 'bg-amber-50 border-amber-200 text-amber-700', label: 'Unpaid' },
  failed: { bg: 'bg-red-50 border-red-200 text-red-600', label: 'Failed' },
  refunded: { bg: 'bg-blue-50 border-blue-200 text-blue-700', label: 'Refunded' },
  draft: { bg: 'bg-slate-50 border-slate-200 text-slate-600', label: 'Bản nháp' },
  published: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Đã công khai' },
  sent: { bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', label: 'Sent' },
  read: { bg: 'bg-slate-50 border-slate-200 text-slate-600', label: 'Read' },
  owned: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: 'Owned' },
  listed_for_sale: { bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', label: 'Listed for sale' },
  sold: { bg: 'bg-slate-50 border-slate-200 text-slate-600', label: 'Sold' },
  transferred: { bg: 'bg-blue-50 border-blue-200 text-blue-700', label: 'Transferred' },
  used: { bg: 'bg-amber-50 border-amber-200 text-amber-700', label: 'Used' },
};

const humanize = (value: string) => (
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
);

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, id }) => {
  const normalized = String(status || 'neutral').toLowerCase();
  const current = styles[normalized as KnownBadgeStatus] || {
    bg: 'bg-slate-50 border-slate-200 text-slate-600',
    label: humanize(String(status || 'Unknown')),
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${current.bg}`}
    >
      {current.label}
    </span>
  );
};
