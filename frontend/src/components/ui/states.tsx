// frontend/src/components/ui/states.tsx
// Shared empty and error states. Every data view uses these so the three states
// (loading skeleton / empty / error+retry) look identical across the whole app.
import { AlertCircle, Inbox } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  icon,
  action,
  illustration,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  /** One of components/illustrations/*. Falls back to the icon-badge treatment when omitted. */
  illustration?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-card px-6 py-14 text-center">
      {illustration ?? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-tint text-primary">
          {icon ?? <Inbox className="h-6 w-6" />}
        </div>
      )}
      <p className={cn('text-sm font-medium text-text-primary', illustration && 'mt-4')}>{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  illustration,
}: {
  message?: string;
  onRetry?: () => void;
  /** Typically <ServerErrorIllustration />. Falls back to the icon-badge treatment when omitted. */
  illustration?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-error-bg bg-error-bg/40 px-6 py-14 text-center">
      {illustration ?? (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error-bg text-error-text">
          <AlertCircle className="h-6 w-6" />
        </div>
      )}
      <p className={cn('text-sm font-medium text-text-primary', illustration && 'mt-4')}>Something went wrong</p>
      <p className="mt-1 max-w-sm text-sm text-text-secondary">{message ?? 'Please try again.'}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
