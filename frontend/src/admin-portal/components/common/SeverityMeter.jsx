// src/admin-portal/components/common/SeverityMeter.jsx
// Overdue severity (days late) is a MAGNITUDE, not a state - rendering it as
// another tinted pill from the same palette Badge uses would make an amber
// "High" severity indistinguishable from an amber "Under review" status
// badge. This is a graded meter of filled ticks instead: a deliberately
// different SHAPE, not just a different colour, and the level is always
// spelled out in text too (never colour alone).
const LEVELS = [
  { max: 3, label: 'Low', className: 'severity-low' },
  { max: 7, label: 'Moderate', className: 'severity-moderate' },
  { max: 14, label: 'High', className: 'severity-high' },
  { max: Infinity, label: 'Critical', className: 'severity-critical' },
];
const TICK_COUNT = 4;

export function severityLevel(daysLate) {
  return LEVELS.find((l) => daysLate <= l.max) ?? LEVELS[LEVELS.length - 1];
}

/** @param {number} daysLate */
export function SeverityMeter({ daysLate, className = '' }) {
  const levelIndex = LEVELS.findIndex((l) => daysLate <= l.max);
  const filled = levelIndex === -1 ? TICK_COUNT : levelIndex + 1;
  const level = severityLevel(daysLate);

  return (
    <div className={`severity-meter ${level.className} ${className}`.trim()} title={`${daysLate} day${daysLate === 1 ? '' : 's'} overdue — ${level.label} severity`}>
      <span className="severity-ticks" aria-hidden="true">
        {Array.from({ length: TICK_COUNT }, (_, i) => (
          <span key={i} className={`severity-tick${i < filled ? ' severity-tick-filled' : ''}`} />
        ))}
      </span>
      <span className="severity-label">
        {daysLate}d late · {level.label}
      </span>
    </div>
  );
}
