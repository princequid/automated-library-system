// frontend/src/components/illustrations/NoLoansIllustration.tsx
import { IllustrationBase } from './base';

export function NoLoansIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <path
        d="M30 50 Q45 42 60 50 V80 Q45 72 30 80 Z"
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M90 50 Q75 42 60 50 V80 Q75 72 90 80 Z"
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="82" cy="40" r="12" fill="var(--color-card)" stroke="var(--color-secondary)" strokeWidth="2.5" />
      <path d="M82 34 V40 L86 43" stroke="var(--color-secondary)" strokeWidth="2" strokeLinecap="round" fill="none" />
    </IllustrationBase>
  );
}
