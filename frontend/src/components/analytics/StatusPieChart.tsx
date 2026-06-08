import React from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { StatusMetric } from '../../utils/analyticsUtils';

interface StatusPieChartProps {
  data: StatusMetric[];
}

const COLORS = ['#4f46e5', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#64748b'];

export const StatusPieChart: React.FC<StatusPieChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        innerRadius={58}
        outerRadius={92}
        paddingAngle={3}
      >
        {data.map((entry, index) => (
          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend wrapperStyle={{ fontSize: 12 }} />
    </PieChart>
  </ResponsiveContainer>
);

export const EventStatusPieChart = StatusPieChart;
export const PaymentStatusPieChart = StatusPieChart;
