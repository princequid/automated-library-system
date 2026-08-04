// frontend/src/components/illustrations/NoFinesIllustration.tsx
import { IllustrationBase } from './base';

export function NoFinesIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <rect x="42" y="34" width="36" height="52" rx="4" stroke="var(--color-primary)" strokeWidth="2.5" />
      <line x1="49" y1="46" x2="71" y2="46" stroke="var(--color-border)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="49" y1="54" x2="71" y2="54" stroke="var(--color-border)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="49" y1="62" x2="63" y2="62" stroke="var(--color-border)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="80" cy="78" r="14" fill="var(--color-card)" stroke="var(--color-secondary)" strokeWidth="2.5" />
      <path
        d="M74 78 L79 83 L87 73"
        stroke="var(--color-secondary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </IllustrationBase>
  );
}
