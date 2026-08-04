// frontend/src/components/ui/progress-ring.tsx
// SVG circular progress that animates from 0 to its value on mount. The stroke
// colour shifts primary -> warning -> error as usage approaches the limit.
import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '@/lib/motion';

export function ProgressRing({
  value,
  max,
  size = 120,
  stroke = 10,
  label,
  sublabel,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max <= 0 ? 0 : Math.min(1, value / max);
  const color =
    ratio >= 1 ? 'var(--color-error)' : ratio >= 0.8 ? 'var(--color-warning)' : 'var(--color-primary)';
  const reduceMotion = useReducedMotion();
  const finalOffset = circumference * (1 - ratio);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduceMotion ? finalOffset : circumference }}
          animate={{ strokeDashoffset: finalOffset }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.9, ease: EASE.out }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <span className="text-xl font-medium text-text-primary">{label}</span>}
        {sublabel && <span className="text-xs text-text-secondary">{sublabel}</span>}
      </div>
    </div>
  );
}
