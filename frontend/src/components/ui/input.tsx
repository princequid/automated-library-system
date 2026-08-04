// frontend/src/components/ui/input.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'h-10 w-full rounded-control border bg-card px-3 text-sm text-text-primary transition-colors duration-150 placeholder:text-text-secondary',
            'focus-visible:border-primary',
            icon && 'pl-9',
            invalid ? 'border-error' : 'border-border',
            className
          )}
          aria-invalid={invalid || undefined}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';
