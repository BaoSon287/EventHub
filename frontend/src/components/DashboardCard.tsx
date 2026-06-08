import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  id?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  id
}) => {
  return (
    <div id={id} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
          <h3 className="text-2xl font-black text-slate-800 mt-1">{value}</h3>
        </div>
        <div className="p-3 bg-slate-50 text-indigo-600 rounded-xl">
          {icon}
        </div>
      </div>
      
      {change && (
        <div className="flex items-center gap-1.5">
          {changeType === 'positive' && (
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
              <ArrowUpRight className="w-3 h-3" />
              {change}
            </span>
          )}
          {changeType === 'negative' && (
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-sm">
              <ArrowDownRight className="w-3 h-3" />
              {change}
            </span>
          )}
          {changeType === 'neutral' && (
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-sm">
              {change}
            </span>
          )}
          <span className="text-xs text-slate-400 font-medium">so với tháng trước</span>
        </div>
      )}
    </div>
  );
};
