// frontend/src/components/ui/sheet.tsx
// Right-side (or left-side) slide-in drawer, built on the same Radix Dialog
// primitive as `Dialog` - use this instead of a centered modal for filters,
// quick-edit forms, and other "work alongside the page" tasks; reserve Dialog
// for focused confirmations/short forms per the design system's own rule
// (Dialog = confirmation/focused task, Sheet = longer-lived side panel).
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DURATION, EASE } from '@/lib/motion';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

const MotionOverlay = motion(DialogPrimitive.Overlay);
const MotionContent = motion(DialogPrimitive.Content);

interface SheetContentProps {
  className?: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
}

export function SheetContent({ className, children, side = 'right' }: SheetContentProps) {
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
        <MotionContent
          className={cn(
            'fixed inset-y-0 z-50 flex h-full w-full max-w-md flex-col bg-card p-6 shadow-lg',
            side === 'right' ? 'right-0 border-l border-border' : 'left-0 border-r border-border',
            className
          )}
          initial={{ x: side === 'right' ? '100%' : '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: side === 'right' ? '100%' : '-100%' }}
          transition={{ duration: DURATION.medium, ease: EASE.out }}
        >
          <div className="flex-1 overflow-y-auto">{children}</div>
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-md p-1 text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </MotionContent>
      </DialogPrimitive.Portal>
    </AnimatePresence>
  );
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 space-y-1', className)} {...props} />;
}

export function SheetTitle({ className, ...props }: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-lg font-medium text-text-primary', className)} {...props} />;
}

export function SheetDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-sm text-text-secondary', className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex items-center justify-end gap-3 border-t border-border pt-4', className)} {...props} />;
}
