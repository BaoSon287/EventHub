import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface BookingBarChartProps {
  data: Array<{ date: string; bookings: number }>;
}

export const BookingBarChart: React.FC<BookingBarChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
      <Tooltip formatter={(value) => [Number(value), 'Bookings']} />
      <Bar dataKey="bookings" fill="#f97316" radius={[8, 8, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
