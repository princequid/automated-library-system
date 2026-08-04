// frontend/src/components/ui/field.tsx
// Form field wrapper: label + control + inline error, wired for accessibility
// (aria-describedby links the input to its error) and a one-time shake when an
// error first appears.
import * as React from 'react';
import { Label } from './label';
import { cn } from '@/lib/utils';

interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, error, hint, children, className }: FieldProps) {
  const [shake, setShake] = React.useState(false);
  const prevError = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (error && !prevError.current) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 260);
      return () => clearTimeout(t);
    }
    prevError.current = error;
    return undefined;
  }, [error]);

  const errorId = htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn('space-y-1.5', shake && 'animate-shake', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {React.isValidElement(children) && errorId
        ? React.cloneElement(children as React.ReactElement, {
            'aria-describedby': error ? errorId : undefined,
          })
        : children}
      {error ? (
        <p id={errorId} className="text-xs text-error-text" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-text-secondary">{hint}</p>
      )}
    </div>
  );
}
