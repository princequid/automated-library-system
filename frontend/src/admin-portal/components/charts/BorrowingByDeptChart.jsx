// src/admin-portal/components/charts/BorrowingByDeptChart.jsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function BorrowingByDeptChart({ data, colors, textColor }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="department" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {/* Recharts' Sector shape unconditionally renders role="img" on
              each slice's <path> (see node_modules/recharts/lib/shape
              /Sector.js) but sets no accessible name of its own - aria-label
              here flows through Cell -> Pie -> Sector's filterProps and
              lands on the path, satisfying axe's svg-img-alt rule per slice. */}
          {data.map((row, i) => (
            <Cell key={row.department} fill={colors[i % colors.length]} aria-label={`${row.department}: ${row.count}`} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value, name) => [value, name]} />
        <Legend wrapperStyle={{ fontSize: 12, color: textColor }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
