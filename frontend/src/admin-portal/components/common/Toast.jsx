// src/admin-portal/components/common/Toast.jsx
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SuccessIcon, ErrorIcon, InfoIcon, CloseIcon } from './Icons';
import { useOverlayRoot } from '../../context/OverlayRootContext';

const ToastContext = createContext(null);
const ICON = { success: SuccessIcon, error: ErrorIcon, info: InfoIcon };
const DEFAULT_DURATION_MS = 5000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);
  const overlayRoot = useOverlayRoot();

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { variant = 'info', duration = DEFAULT_DURATION_MS } = {}) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, variant }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const api = {
    push,
    dismiss,
    success: (message, opts) => push(message, { ...opts, variant: 'success' }),
    error: (message, opts) => push(message, { ...opts, variant: 'error' }),
    info: (message, opts) => push(message, { ...opts, variant: 'info' }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {overlayRoot &&
        createPortal(
          <div className="toast-viewport" role="region" aria-label="Notifications">
            {toasts.map((t) => {
              const Icon = ICON[t.variant] ?? InfoIcon;
              return (
                <div key={t.id} className={`toast toast-${t.variant}`} role="status">
                  <Icon size={18} aria-hidden="true" />
                  <span className="toast-message">{t.message}</span>
                  <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
                    <CloseIcon size={14} />
                  </button>
                </div>
              );
            })}
          </div>,
          overlayRoot
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
