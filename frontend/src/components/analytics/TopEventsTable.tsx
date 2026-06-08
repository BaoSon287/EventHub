import React from 'react';
import { EmptyState } from '../EmptyState';
import { StatusBadge } from '../StatusBadge';
import { formatCurrency } from '../../utils/formatters';

export interface TopEventRow {
  id: string;
  title: string;
  city: string;
  status: string;
  ticketsSold: number;
  revenue: number;
  availableTickets: number;
}

interface TopEventsTableProps {
  events: TopEventRow[];
}

export const TopEventsTable: React.FC<TopEventsTableProps> = ({ events }) => (
  <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-5 py-4">
      <h3 className="text-sm font-black text-slate-900">Top Performing Events</h3>
    </div>
    {events.length === 0 ? (
      <EmptyState title="No event performance yet" description="Performance rows appear after events receive bookings." />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-5 py-3 font-black">Event</th>
              <th className="px-5 py-3 font-black">City</th>
              <th className="px-5 py-3 font-black">Status</th>
              <th className="px-5 py-3 font-black">Tickets Sold</th>
              <th className="px-5 py-3 font-black">Revenue</th>
              <th className="px-5 py-3 font-black">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((event) => (
              <tr key={event.id} className="text-xs font-semibold text-slate-600">
                <td className="max-w-xs px-5 py-4">
                  <p className="truncate font-extrabold text-slate-900">{event.title}</p>
                </td>
                <td className="px-5 py-4">{event.city}</td>
                <td className="px-5 py-4"><StatusBadge status={event.status} /></td>
                <td className="px-5 py-4 font-black text-slate-900">{event.ticketsSold.toLocaleString('vi-VN')}</td>
                <td className="px-5 py-4 font-black text-indigo-700">{formatCurrency(event.revenue)}</td>
                <td className="px-5 py-4">{event.availableTickets.toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
