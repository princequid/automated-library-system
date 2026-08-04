// frontend/src/components/ui/avatar.tsx
// Initials avatar in a sage tint circle.
import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint text-xs font-medium text-primary-hover',
        className
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
