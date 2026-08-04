// frontend/src/components/ui/page-transition.tsx
// Standard page mount animation: opacity 0->1 + translateY 4px->0, 200ms ease-out.
import { motion } from 'framer-motion';
import { DURATION, EASE } from '@/lib/motion';

export function PageTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: DURATION.medium, ease: EASE.out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** A drawn checkmark (SVG stroke animation) for success confirmations. */
export function DrawnCheck({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" className="text-primary">
      <motion.circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke="var(--color-primary-tint)"
        strokeWidth="3"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
      <motion.path
        d="M16 27 L23 34 L37 19"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.25 }}
      />
    </svg>
  );
}
