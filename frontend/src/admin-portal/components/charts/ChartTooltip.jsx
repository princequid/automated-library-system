// src/admin-portal/components/charts/ChartTooltip.jsx
// Shared custom tooltip for the line charts: a small card with a formatted
// label and one colour-dot row per series, instead of recharts' default
// plain-text box. Pass through recharts' own {active, payload, label} props.
export function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{labelFormatter ? labelFormatter(label) : label}</div>
      {payload.map((entry) => (
        <div className="chart-tooltip-row" key={entry.dataKey}>
          <span className="chart-tooltip-dot" style={{ background: entry.color }} aria-hidden="true" />
          <span className="chart-tooltip-name">{entry.name}</span>
          <span className="chart-tooltip-value">{valueFormatter ? valueFormatter(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}
