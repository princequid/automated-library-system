// frontend/src/components/illustrations/NoResultsIllustration.tsx
import { IllustrationBase } from './base';

export function NoResultsIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <line x1="42" y1="46" x2="70" y2="46" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" />
      <line x1="42" y1="56" x2="62" y2="56" stroke="var(--color-border)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="56" cy="62" r="16" stroke="var(--color-primary)" strokeWidth="3" />
      <line x1="67" y1="73" x2="80" y2="86" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
    </IllustrationBase>
  );
}
