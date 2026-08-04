// src/admin-portal/components/charts/OverdueRateChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTooltip } from './ChartTooltip';

function formatDay(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function OverdueRateChart({ data, stroke, gridColor, textColor, surfaceColor }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tickFormatter={formatDay} tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
        <YAxis unit="%" domain={[0, 100]} tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
        <Tooltip
          cursor={{ stroke: gridColor, strokeDasharray: '3 3' }}
          content={<ChartTooltip labelFormatter={formatDay} valueFormatter={(v) => `${v}%`} />}
        />
        <Line
          type="monotone"
          dataKey="rate"
          name="Overdue rate"
          stroke={stroke}
          strokeWidth={2}
          dot={{ r: 3.5, strokeWidth: 2, stroke, fill: surfaceColor }}
          activeDot={{ r: 5, strokeWidth: 2, stroke, fill: surfaceColor }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
