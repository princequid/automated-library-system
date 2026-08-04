// frontend/src/components/ui/toast.tsx
// Toast system built on sonner, restyled to the design system: white card, thin
// coloured left accent bar (not a full coloured background), soft shadow, spring
// slide-in from the top-right, auto-dismiss 4s. A thin depleting progress bar is
// rendered via CSS animation keyed to the same duration.
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

const DURATION = 4000;

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      duration={DURATION}
      gap={10}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'relative flex w-[356px] items-start gap-3 overflow-hidden rounded-card border border-border bg-card p-4 pl-5 shadow-md',
        },
      }}
    />
  );
}

type ToastKind = 'success' | 'error' | 'warning' | 'info';

const config: Record<ToastKind, { color: string; Icon: typeof Info }> = {
  success: { color: 'var(--color-success)', Icon: CheckCircle2 },
  error: { color: 'var(--color-error)', Icon: XCircle },
  warning: { color: 'var(--color-warning)', Icon: AlertTriangle },
  info: { color: 'var(--color-primary)', Icon: Info },
};

function render(kind: ToastKind, title: string, description?: string) {
  const { color, Icon } = config[kind];
  sonnerToast.custom(
    () => (
      <div className="relative flex w-[356px] items-start gap-3 overflow-hidden rounded-card border border-border bg-card p-4 pl-5 shadow-md">
        {/* left accent bar */}
        <span className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
        <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">{title}</p>
          {description && <p className="mt-0.5 text-xs text-text-secondary">{description}</p>}
        </div>
        {/* depleting progress bar */}
        <span
          className="absolute bottom-0 left-0 h-0.5"
          style={{
            background: 'var(--color-primary)',
            animation: `toast-deplete ${DURATION}ms linear forwards`,
            width: '100%',
          }}
        />
        <style>{`@keyframes toast-deplete { from { transform: scaleX(1); transform-origin: left; } to { transform: scaleX(0); transform-origin: left; } }`}</style>
      </div>
    ),
    { duration: DURATION }
  );
}

export const toast = {
  success: (title: string, description?: string) => render('success', title, description),
  error: (title: string, description?: string) => render('error', title, description),
  warning: (title: string, description?: string) => render('warning', title, description),
  info: (title: string, description?: string) => render('info', title, description),
};
