// frontend/src/components/illustrations/NoCatalogItemsIllustration.tsx
import { IllustrationBase } from './base';

export function NoCatalogItemsIllustration({ size }: { size?: number }) {
  return (
    <IllustrationBase size={size}>
      <line x1="30" y1="86" x2="90" y2="86" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="38" y="52" width="12" height="34" rx="2" stroke="var(--color-primary)" strokeWidth="2.5" />
      <rect x="52" y="46" width="12" height="40" rx="2" stroke="var(--color-primary)" strokeWidth="2.5" />
      <rect x="66" y="58" width="12" height="28" rx="2" stroke="var(--color-secondary)" strokeWidth="2.5" />
    </IllustrationBase>
  );
}
