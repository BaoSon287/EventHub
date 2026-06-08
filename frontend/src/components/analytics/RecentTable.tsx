import React from 'react';
import { EmptyState } from '../EmptyState';
import { StatusBadge } from '../StatusBadge';

export interface RecentTableColumn<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
}

interface RecentTableProps<T> {
  title: string;
  items: T[];
  columns: Array<RecentTableColumn<T>>;
}

export const RecentTable = <T extends { id: string }>({ title, items, columns }: RecentTableProps<T>) => (
  <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-5 py-4">
      <h3 className="text-sm font-black text-slate-900">{title}</h3>
    </div>
    {items.length === 0 ? (
      <EmptyState title="No rows yet" description="Recent activity will appear here." />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-3 font-black">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="text-xs font-semibold text-slate-600">
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4">{column.render(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export const StatusCell: React.FC<{ status: string }> = ({ status }) => <StatusBadge status={status} />;
