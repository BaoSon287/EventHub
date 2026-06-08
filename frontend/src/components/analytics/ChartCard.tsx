import React from 'react';
import { EmptyState } from '../EmptyState';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  isEmpty?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children, isEmpty = false }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="mb-5">
      <h3 className="text-sm font-black text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-xs font-semibold text-slate-400">{subtitle}</p>}
    </div>
    {isEmpty ? (
      <EmptyState
        title="No analytics data"
        description="This chart will populate when the platform has more activity."
      />
    ) : (
      <div className="h-72">{children}</div>
    )}
  </div>
);
