// src/admin-portal/components/common/Sparkline.jsx
// Full-bleed gradient-area trend strip anchored to a KpiCard's bottom edge.
// Pure SVG (no Recharts - that's reserved for the Dashboard's full charts)
// so it renders synchronously inside a card without pulling in a lazy-loaded
// chart chunk. Scales to its container via viewBox + preserveAspectRatio
// instead of a fixed pixel width, so it stays full-width without a resize
// observer.
import { useId } from 'react';

const VIEW_WIDTH = 240;

export function Sparkline({ data = [], stroke = '#2b7a53', height = 52, className = '' }) {
  const gradientId = useId();
  // A single non-finite point (an incomplete fixture, a field that hasn't
  // loaded yet) would otherwise NaN out every coordinate below and render an
  // invisible/broken path with no error - fail closed to "nothing" instead.
  const clean = Array.isArray(data) ? data.filter((v) => Number.isFinite(v)) : [];
  if (clean.length < 2) return null;
  data = clean;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = VIEW_WIDTH / (data.length - 1);
  // Keep the line off the very top/bottom edge so the peak/trough don't clip.
  const inset = height * 0.12;
  const plotHeight = height - inset * 2;

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = inset + plotHeight - ((v - min) / range) * plotHeight;
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${VIEW_WIDTH},${height} L0,${height} Z`;

  return (
    <svg
      className={`sparkline ${className}`.trim()}
      width="100%"
      height={height}
      viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Trend from ${data[0]} to ${data[data.length - 1]}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.32" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
