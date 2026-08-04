// frontend/src/components/Brand.tsx
// The sage logo mark + wordmark, and a full-page branded loader shown while the
// session is validated on app load (never a flash of the login page).
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-control bg-primary text-inverse',
        className
      )}
      aria-hidden
    >
      <BookOpen className="h-5 w-5" />
    </span>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      {!compact && <span className="text-sm font-medium text-text-primary">University Library</span>}
    </span>
  );
}

export function BrandLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <LogoMark className="h-12 w-12" />
      </motion.div>
    </div>
  );
}
