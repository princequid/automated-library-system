// src/admin-portal/components/common/ErrorState.jsx
import { ServerErrorIcon } from './Icons';
import { Button } from './Button';

/**
 * A failed fetch must never fall through to EmptyState - it reads as "there
 * is genuinely nothing" when the truth is "we don't know, the request
 * failed." Always offer retry when the caller can re-run the query.
 */
export function ErrorState({ message = 'Something went wrong while loading this data.', onRetry, className = '' }) {
  return (
    <div className={`error-state ${className}`.trim()} role="alert">
      <ServerErrorIcon size={40} className="error-state-icon" aria-hidden="true" />
      <p className="error-state-title">Couldn&apos;t load this data</p>
      <p className="error-state-description">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="error-state-action">
          Try again
        </Button>
      )}
    </div>
  );
}
