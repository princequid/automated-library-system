// src/admin-portal/components/charts/LoanVolumeChart.jsx
// Recharts renders colour via raw SVG presentation attributes, which don't
// understand CSS var() - so the caller resolves tokens through useCssVars
// FIRST and hands this component plain hex/rgb strings, never var(--x).
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTooltip } from './ChartTooltip';

function formatDay(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function LoanVolumeChart({ data, stroke, gridColor, textColor, surfaceColor }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tickFormatter={formatDay} tick={{ fill: textColor, fontSize: 11 }} axisLine={{ stroke: gridColor }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
        <Tooltip
          cursor={{ stroke: gridColor, strokeDasharray: '3 3' }}
          content={<ChartTooltip labelFormatter={formatDay} valueFormatter={(v) => `${v} loan${v === 1 ? '' : 's'}`} />}
        />
        <Line
          type="monotone"
          dataKey="count"
          name="Loans issued"
          stroke={stroke}
          strokeWidth={2}
          dot={{ r: 3.5, strokeWidth: 2, stroke, fill: surfaceColor }}
          activeDot={{ r: 5, strokeWidth: 2, stroke, fill: surfaceColor }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
