// src/admin-portal/components/common/KpiCard.jsx
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Sparkline } from './Sparkline';
import { TrendUpIcon, TrendDownIcon, FlatIcon } from './Icons';
import { useCssVars } from '../../hooks/useCssVars';

const TREND_ICON = { up: TrendUpIcon, down: TrendDownIcon, flat: FlatIcon };
const MAX_TILT_DEG = 7;

/**
 * accent: primary | success | warning | danger | info | teal - selects the
 * paired soft-tint/icon-fill/text tokens for both the icon badge and the
 * sparkline stroke. Never render this component with a fabricated `value` -
 * pass `value={null}` and it renders "No data" instead of a misleading 0.
 *
 * `trend` and `sparkline` are both optional and independent - only pass them
 * when a real historical series backs the number. Most of this dashboard's
 * KPIs (dashboard-stats' four headline fields) are single point-in-time
 * counts with no daily breakdown behind them, so they render with just the
 * icon badge and description and no trend pill or sparkline - inventing
 * either would be exactly the "plausible-looking figure" the no-fabrication
 * rule forbids.
 *
 * trend.direction: 'up' | 'down' | 'flat'. trend.good: whether that direction
 * is a good outcome for this metric (e.g. down is good for "Overdue items"),
 * so colour reflects meaning, not just arithmetic sign.
 */
export function KpiCard({
  label,
  value,
  unit,
  accent = 'primary',
  icon: Icon,
  description,
  trend,
  sparkline,
  precision = 0,
  className = '',
}) {
  const hasValue = typeof value === 'number' && Number.isFinite(value);
  const animated = useAnimatedNumber(hasValue ? value : 0);
  const vars = useCssVars([`--color-${accent}-text`, `--color-${accent}`]);
  const sparkColor = vars[`--color-${accent}-text`] || vars['--color-primary'];
  const reducedMotion = useReducedMotion();

  const TrendIcon = trend ? TREND_ICON[trend.direction] ?? FlatIcon : null;
  const trendTone = trend ? (trend.direction === 'flat' ? 'neutral' : trend.good ? 'positive' : 'negative') : null;

  // 3D tilt, not a cursor-tracking glow: the card leans away from the
  // pointer like it's being picked up, driven by CSS custom properties
  // written straight to the DOM (not React state) so mousemove never
  // triggers a re-render. Skipped entirely under reduced-motion rather than
  // just losing its transition easing - a card that still snap-rotates
  // instantly on every mouse pixel is exactly the kind of motion that
  // setting disables for.
  function handlePointerMove(e) {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 (left) .. 0.5 (right)
    const py = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 (top) .. 0.5 (bottom)
    e.currentTarget.style.setProperty('--tilt-x', `${(px * MAX_TILT_DEG * 2).toFixed(2)}deg`);
    e.currentTarget.style.setProperty('--tilt-y', `${(-py * MAX_TILT_DEG * 2).toFixed(2)}deg`);
  }

  function handlePointerLeave(e) {
    e.currentTarget.style.setProperty('--tilt-x', '0deg');
    e.currentTarget.style.setProperty('--tilt-y', '0deg');
  }

  return (
    <div
      className={`kpi-card ${sparkline && hasValue ? 'kpi-card-has-spark' : ''} ${className}`.trim()}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
    >
      <div className="kpi-card-content">
        <div className="kpi-card-top">
          <span className="kpi-card-label">{label}</span>
          {Icon && (
            <span className={`kpi-card-icon-badge kpi-card-icon-badge-${accent}`}>
              <Icon size={16} />
            </span>
          )}
        </div>

        {hasValue ? (
          <span className="kpi-value" data-numeric="true">
            {animated.toFixed(precision)}
            {unit ? <span className="kpi-unit">{unit}</span> : null}
          </span>
        ) : (
          <span className="kpi-value kpi-value-empty">No data</span>
        )}

        {(trend || description) && hasValue && (
          <div className="kpi-card-meta">
            {trend && (
              <span className={`kpi-card-trend-pill kpi-card-trend-pill-${trendTone}`}>
                <TrendIcon size={12} />
                {trend.label}
              </span>
            )}
            {description && <span className="kpi-card-description">{description}</span>}
          </div>
        )}
      </div>

      {sparkline && hasValue && <Sparkline data={sparkline} stroke={sparkColor} className="kpi-card-sparkline" />}
    </div>
  );
}
