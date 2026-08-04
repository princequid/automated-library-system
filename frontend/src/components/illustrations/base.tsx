// frontend/src/components/illustrations/base.tsx
// Shared backdrop for every empty/error illustration in the set, so they read as
// one family: a soft rounded-square plaque + a few accent dots, with the
// scenario-specific line art centered on top. `tone="error"` swaps the backdrop
// to the error tint so a broken state never looks like a neutral empty state.
import * as React from 'react';

interface IllustrationBaseProps {
  size?: number;
  tone?: 'brand' | 'error';
  children: React.ReactNode;
}

export function IllustrationBase({ size = 120, tone = 'brand', children }: IllustrationBaseProps) {
  const backdrop = tone === 'error' ? 'var(--color-error-bg)' : 'var(--color-primary-tint)';
  const dot = tone === 'error' ? 'var(--color-error)' : 'var(--color-border)';
  const dotOpacity = tone === 'error' ? 0.45 : 1;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="112" height="112" rx="24" fill={backdrop} />
      <circle cx="94" cy="30" r="3" fill={dot} opacity={dotOpacity} />
      <circle cx="28" cy="94" r="3" fill={dot} opacity={dotOpacity} />
      <circle cx="100" cy="90" r="2" fill={dot} opacity={dotOpacity} />
      {children}
    </svg>
  );
}
