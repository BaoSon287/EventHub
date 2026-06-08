import React from 'react';

type BadgeStatus = 
  | 'upcoming' | 'ongoing' | 'completed' | 'cancelled' 
  | 'paid' | 'pending_payment'
  | 'attendee' | 'organizer' | 'admin'
  | 'vip' | 'standard';

interface StatusBadgeProps {
  status: BadgeStatus;
  id?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, id }) => {
  const styles: Record<BadgeStatus, { bg: string; text: string; label: string }> = {
    upcoming: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      text: 'emerald-700',
      label: 'Sắp diễn ra'
    },
    ongoing: {
      bg: 'bg-blue-50 border-blue-200 text-blue-700',
      text: 'blue-700',
      label: 'Đang diễn ra'
    },
    completed: {
      bg: 'bg-slate-50 border-slate-200 text-slate-600',
      text: 'slate-600',
      label: 'Đã kết thúc'
    },
    cancelled: {
      bg: 'bg-red-50 border-red-200 text-red-600',
      text: 'red-600',
      label: 'Đã hủy'
    },
    paid: {
      bg: 'bg-green-50 border-green-200 text-green-700 font-semibold',
      text: 'green-700',
      label: 'Đã thanh toán'
    },
    pending_payment: {
      bg: 'bg-amber-50 border-amber-200 text-amber-700 font-semibold animate-pulse',
      text: 'amber-700',
      label: 'Chờ thanh toán'
    },
    attendee: {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      text: 'indigo-700',
      label: 'Người tham gia'
    },
    organizer: {
      bg: 'bg-violet-50 border-violet-200 text-violet-700',
      text: 'violet-700',
      label: 'Ban tổ chức'
    },
    admin: {
      bg: 'bg-teal-50 border-teal-200 text-teal-700',
      text: 'teal-700',
      label: 'Quản trị viên'
    },
    vip: {
      bg: 'bg-rose-50 border-rose-200 text-rose-700 font-bold tracking-wider',
      text: 'rose-700',
      label: 'VIP Ticket'
    },
    standard: {
      bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
      text: 'indigo-700',
      label: 'Standard'
    }
  };

  const current = styles[status] || {
    bg: 'bg-slate-50 border-slate-200 text-slate-600',
    label: status
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg}`}
    >
      {current.label}
    </span>
  );
};
