// frontend/src/components/ui/checkbox.tsx
// Styled native checkbox (no Radix dependency needed - native input semantics
// already give correct keyboard/screen-reader behavior). Supports `indeterminate`
// for a table's "select all on this page" header checkbox.
import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, checked, ...props }, forwardedRef) => {
    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(forwardedRef, () => innerRef.current as HTMLInputElement);
    React.useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = !!indeterminate;
    }, [indeterminate]);

    return (
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          ref={innerRef}
          type="checkbox"
          checked={checked}
          className={cn(
            'peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded border border-border bg-card transition-colors hover:border-primary checked:border-primary checked:bg-primary',
            className
          )}
          {...props}
        />
        {(checked || indeterminate) && (
          <span className="pointer-events-none absolute text-inverse">
            {indeterminate ? <Minus className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          </span>
        )}
      </span>
    );
  }
);
Checkbox.displayName = 'Checkbox';
