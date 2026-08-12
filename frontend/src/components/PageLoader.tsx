// frontend/src/components/PageLoader.tsx
// Branded Suspense fallback for page-to-page navigation (as opposed to
// BrandLoader in Brand.tsx, which only covers the one-time auth-boot check).
// Used at two levels, both wired in App.tsx/AppShell.jsx/StudentLayout.tsx:
//   - size="screen": App.tsx's top-level Suspense - nothing else is on
//     screen yet (first-ever visit to a portal this session).
//   - size="section": a local Suspense around each layout's <Outlet/>, so
//     the sidebar/navbar stay mounted and only the content area shows this
//     while navigating to a not-yet-visited page.
// Built from global tokens only (--color-bg/-primary/-accent/-border/etc,
// declared at :root in globals.css) rather than anything admin-portal-scoped
// - this can render before .admin-portal even exists in the DOM (the very
// first /admin navigation, while AppShell's own chunk is still loading). CSS
// custom properties cascade normally, so once it's nested inside .admin-portal
// (the size="section" case) it picks up that scope's identical values for
// free - no extra logic needed, see tokens.css/globals.css's shared palette.
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from './Brand';
import { cn } from '@/lib/utils';

export function PageLoader({
  size = 'section',
  label = 'Loading…',
}: {
  size?: 'screen' | 'section';
  label?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        size === 'screen' ? 'min-h-screen bg-bg' : 'min-h-[50vh]'
      )}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <LogoMark className="h-11 w-11" />
      </motion.div>
      <div className="flex flex-col items-center gap-2">
        <span className="font-serif text-sm italic text-text-secondary">{label}</span>
        {/* A brass sweep along a hairline rule - the same "ledger line" motif
            as the KPI cards, doing double duty as an indeterminate progress
            cue rather than a generic spinner. */}
        <span className="relative h-[2px] w-12 overflow-hidden rounded-full bg-border">
          {!reduceMotion && (
            <motion.span
              className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-accent"
              animate={{ x: ['-100%', '220%'] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </span>
      </div>
    </motion.div>
  );
}
