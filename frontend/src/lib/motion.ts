// frontend/src/lib/motion.ts
// Single source of truth for animation timing. Fast = feedback (hover, press,
// tooltips). Medium = overlays and content transitions (dropdowns, modals,
// drawers, page mounts). Slow is reserved for large contextual transitions and
// deliberately has no default consumer yet - most admin-tool motion should
// never need more than "medium".
export const DURATION = {
  fast: 0.12,
  medium: 0.2,
  slow: 0.32,
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1] as const, // easeOutExpo-ish: snappy start, soft landing
  inOut: [0.65, 0, 0.35, 1] as const,
};
