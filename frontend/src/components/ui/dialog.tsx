// frontend/src/components/ui/dialog.tsx
// Modal built on Radix Dialog with Framer Motion enter/exit (scale 0.96->1 + fade).
// On mobile widths it behaves like a full-screen sheet rather than a cramped box.
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DURATION, EASE } from '@/lib/motion';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const MotionOverlay = motion(DialogPrimitive.Overlay);
const MotionContent = motion(DialogPrimitive.Content);

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

export function DialogContent({ className, children }: DialogContentProps) {
  return (
    <AnimatePresence>
      <DialogPrimitive.Portal forceMount>
        <MotionOverlay
          className="fixed inset-0 z-50 bg-text-primary/25 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.fast }}
        />
        {/*
          Centering lives on this plain (non-animated) flex wrapper, not on the
          animated element itself. Framer Motion drives MotionContent's `scale` via
          an inline transform, which would silently overwrite any CSS
          transform-based centering (e.g. Tailwind's -translate-x/y-1/2) on the same
          element - the two approaches fight over the single `transform` property
          and Framer always wins, leaving the dialog anchored by its top-left corner
          instead of centered. Flexbox centering on a separate wrapper sidesteps
          this conflict entirely.
        */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 max-sm:items-end max-sm:p-0">
          <MotionContent
            className={cn(
              // max-h + overflow-y-auto so content taller than the viewport scrolls
              // inside the dialog instead of extending off-screen with no way to
              // reach it (e.g. a long form's submit button ending up unreachable).
              'relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-card border border-border bg-card p-6 shadow-lg',
              'max-sm:max-h-[90vh] max-sm:max-w-none max-sm:rounded-b-none',
              className
            )}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: DURATION.medium, ease: EASE.out }}
          >
            {children}
            <DialogPrimitive.Close
              className="absolute right-4 top-4 rounded-md p-1 text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </MotionContent>
        </div>
      </DialogPrimitive.Portal>
    </AnimatePresence>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 space-y-1', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-lg font-medium text-text-primary', className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-sm text-text-secondary', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex items-center justify-end gap-3', className)} {...props} />;
}
