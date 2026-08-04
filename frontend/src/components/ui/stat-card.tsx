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

const ACCENT_CLASS: Record<StatCardAccent, string> = {
  green: 'bg-primary-tint text-primary-hover',
  blue: 'bg-accent-blue-bg text-accent-blue',
  purple: 'bg-accent-purple-bg text-accent-purple',
  teal: 'bg-accent-teal-bg text-accent-teal',
  orange: 'bg-accent-orange-bg text-accent-orange',
  pink: 'bg-accent-pink-bg text-accent-pink',
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

  const isFlat = trend && Math.abs(trend.value) < 0.05;
  const isGood = trend && !isFlat && (trend.invert ? trend.value < 0 : trend.value > 0);
  const TrendIcon = isFlat ? Minus : isGood ? TrendingUp : TrendingDown;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3.5">
        {icon && (
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', ACCENT_CLASS[accent])}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-text-secondary">{label}</p>
          <p className={cn('text-kpi tabular-nums', toneClass)}>
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
