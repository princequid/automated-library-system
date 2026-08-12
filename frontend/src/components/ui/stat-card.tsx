// frontend/src/components/ui/stat-card.tsx
// The shared headline-number card used on both dashboards. Count-up on first mount.
// An optional `trend` renders a "+12.4% vs previous period" delta beneath the
// number - only pass one when there's a real time series behind it (see
// lib/series.ts periodDelta); never fabricate a trend for a snapshot metric.
// `accent` drives the icon badge's color from a small rotating palette (see
// globals.css) so a row of KPIs reads as distinct at a glance, not four
// identical gray-icon cards.
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from './card';
import { CountUp } from './count-up';
import { cn } from '@/lib/utils';

export interface StatCardTrend {
  /** Percentage change, e.g. 12.4 or -8.1. */
  value: number;
  /** Set true when a rise is bad news (e.g. overdue rate) so color/icon flip. */
  invert?: boolean;
  /** Defaults to "vs previous period". */
  period?: string;
}

export type StatCardAccent = 'green' | 'blue' | 'purple' | 'teal' | 'orange' | 'pink';

// One restrained brass border/icon across every stat card, not a pastel-fill
// rotation - `tone` (below) is what actually flags a number as good/bad news,
// so the accent prop no longer needs to carry that job. Kept as a prop (all
// values resolving the same way) rather than removed, so call sites don't
// need touching.
const BRASS_BADGE = 'border border-accent text-accent bg-transparent';
const ACCENT_CLASS: Record<StatCardAccent, string> = {
  green: BRASS_BADGE,
  blue: BRASS_BADGE,
  purple: BRASS_BADGE,
  teal: BRASS_BADGE,
  orange: BRASS_BADGE,
  pink: BRASS_BADGE,
};

export function StatCard({
  label,
  value,
  icon,
  accent = 'green',
  tone = 'default',
  decimals = 0,
  prefix = '',
  suffix = '',
  hint,
  trend,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  accent?: StatCardAccent;
  tone?: 'default' | 'error' | 'warning' | 'success';
  decimals?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  trend?: StatCardTrend;
}) {
  const toneClass = {
    default: 'text-text-primary',
    error: 'text-error-text',
    warning: 'text-warning-text',
    success: 'text-success-text',
  }[tone];

  // A genuinely bad-news tone (fines owed, an overdue count) breaks the icon
  // badge out of brass into its real status colour, same rule as KpiCard on
  // the admin side - the one card that needs attention is the one that
  // visually stands out.
  const badgeClass =
    tone === 'error'
      ? 'border border-error-text text-error-text bg-transparent'
      : tone === 'warning'
        ? 'border border-warning-text text-warning-text bg-transparent'
        : ACCENT_CLASS[accent];

  const isFlat = trend && Math.abs(trend.value) < 0.05;
  const isGood = trend && !isFlat && (trend.invert ? trend.value < 0 : trend.value > 0);
  const TrendIcon = isFlat ? Minus : isGood ? TrendingUp : TrendingDown;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3.5">
        {icon && (
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-control', badgeClass)}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-text-secondary">{label}</p>
          <p className={cn('text-kpi tabular-nums border-b border-border pb-1 font-serif', toneClass)}>
            <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
          </p>
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <TrendIcon className={cn('h-3.5 w-3.5', isFlat ? 'text-text-secondary' : isGood ? 'text-success' : 'text-error')} />
          <span className={cn('font-medium', isFlat ? 'text-text-secondary' : isGood ? 'text-success-text' : 'text-error-text')}>
            {trend.value > 0 ? '+' : ''}
            {trend.value.toFixed(1)}%
          </span>
          <span className="text-text-secondary">{trend.period ?? 'vs previous period'}</span>
        </div>
      )}
      {hint && <p className="mt-1 text-xs text-text-secondary">{hint}</p>}
    </Card>
  );
}
