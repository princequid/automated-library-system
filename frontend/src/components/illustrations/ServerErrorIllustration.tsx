// frontend/src/components/illustrations/ServerErrorIllustration.tsx
import { IllustrationBase } from './base';

export function ServerErrorIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size} tone="error">
      <path d="M60 38 L86 82 H34 Z" stroke="var(--color-error)" strokeWidth="2.5" strokeLinejoin="round" />
      <line x1="60" y1="56" x2="60" y2="68" stroke="var(--color-error)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="75" r="1.8" fill="var(--color-error)" />
    </IllustrationBase>
  );
}
