// frontend/src/components/ui/button.tsx
// Premium button. Variants map exactly to the design system. A `loading` prop shows
// a spinner, disables the control, and prevents double-submission automatically.
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-inverse rounded-control hover:bg-primary-hover active:scale-[0.97] shadow-sm',
        secondary:
          'border border-border bg-card text-text-primary rounded-control hover:bg-bg active:scale-[0.98]',
        // Transparent fill, colored border+text - a lighter-weight CTA than `secondary`
        // (which is filled white) for use on tinted/colored backgrounds where a solid
        // white box would look out of place.
        outline:
          'border border-primary text-primary rounded-control bg-transparent hover:bg-primary-tint active:scale-[0.98]',
        danger: 'bg-error text-inverse rounded-control hover:bg-error-hover active:scale-[0.97] shadow-sm',
        ghost: 'text-primary rounded-md hover:bg-primary-tint active:scale-[0.98]',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-sm',
        icon: 'h-10 w-10 rounded-control',
      },
    },
    compoundVariants: [{ variant: 'ghost', size: 'md', class: 'h-9 px-3 py-1.5' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    // Radix's Slot requires exactly one React element child to merge props onto.
    // asChild buttons wrap an arbitrary element (e.g. a Link) and don't support the
    // loading-spinner-as-sibling pattern below, so they get a plain pass-through.
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
