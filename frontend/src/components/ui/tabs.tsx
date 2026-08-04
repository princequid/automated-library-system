// frontend/src/components/ui/tabs.tsx
// Animated tabs. The active underline slides between tabs with a spring transition
// via Framer Motion's layoutId - never a hard cut.
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn('relative flex items-center gap-1 border-b border-border', className)}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  active?: boolean;
  layoutGroup?: string;
}

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, children, active, layoutGroup = 'tab-underline', ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative px-3.5 py-2.5 text-sm font-medium transition-colors data-[state=active]:text-primary text-text-secondary hover:text-text-primary',
      className
    )}
    {...props}
  >
    {children}
    {active && (
      <motion.span
        layoutId={layoutGroup}
        className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      />
    )}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = TabsPrimitive.Content;
