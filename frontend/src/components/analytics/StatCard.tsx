import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  helper?: string;
}

const toneClasses = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, tone = 'indigo', helper }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-wide text-slate-400">{title}</p>
        <p className="mt-2 truncate text-2xl font-black text-slate-900">{value}</p>
        {helper && <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>}
      </div>
      {icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          {icon}
        </div>
      )}
    </div>
  </div>
);
