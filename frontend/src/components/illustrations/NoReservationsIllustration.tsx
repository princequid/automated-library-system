// frontend/src/components/illustrations/NoReservationsIllustration.tsx
import { IllustrationBase } from './base';

export function NoReservationsIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <rect x="34" y="40" width="52" height="44" rx="4" stroke="var(--color-primary)" strokeWidth="2.5" />
      <line x1="34" y1="52" x2="86" y2="52" stroke="var(--color-primary)" strokeWidth="2.5" />
      <line x1="46" y1="34" x2="46" y2="44" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="74" y1="34" x2="74" y2="44" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M60 60 L64 68 L73 69 L66 75 L68 84 L60 79 L52 84 L54 75 L47 69 L56 68 Z"
        fill="var(--color-secondary)"
      />
    </IllustrationBase>
  );
}
