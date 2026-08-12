// src/admin-portal/components/layout/AppShell.jsx
// The scoping root: applies the `.admin-portal` class (see tokens.css) and
// the resolved `data-theme` attribute HERE, never on <html>, so dark mode and
// the token layer can never leak into the Tailwind-based student portal.
import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import '../../styles/index.css';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { OverlayRootProvider } from '../../context/OverlayRootContext';
import { ToastProvider } from '../common/Toast';
import { PageLoader } from '@/components/PageLoader';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

function AppShellInner() {
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Captured via ref callback, not document.getElementById: this node is
  // rendered below, so a lookup made during ToastProvider's own render (an
  // ancestor) would run before the node exists on first paint. The ref
  // callback firing during commit triggers the re-render that flows the
  // real node down through OverlayRootProvider - see that file's comment.
  const [overlayRoot, setOverlayRoot] = useState(null);

  return (
    <div className="admin-portal" data-theme={resolvedTheme}>
      <OverlayRootProvider value={overlayRoot}>
        <ToastProvider>
          <div className="admin-shell">
            <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
            <div className="admin-shell-main">
              <Navbar onOpenMobileNav={() => setMobileNavOpen(true)} />
              <main className="admin-shell-content">
                <Suspense fallback={<PageLoader size="section" />}>
                  {/* Keyed by pathname so each new page replays this fade-in
                      on mount, rather than the swap from the loader (or from
                      the previous page) landing as an instant pop-in. */}
                  <motion.div
                    className="route-transition"
                    key={location.pathname}
                    initial={reduceMotion ? undefined : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  >
                    <Outlet />
                  </motion.div>
                </Suspense>
              </main>
            </div>
          </div>
        </ToastProvider>
      </OverlayRootProvider>
      {/* Portal target for Modal/Toast - MUST stay a descendant of .admin-portal
          (never document.body directly), or every scoped token/component rule
          in tokens.css/components.css silently stops applying inside them. */}
      <div ref={setOverlayRoot} id="admin-portal-overlay-root" />
    </div>
  );
}

export function AppShell() {
  return (
    <ThemeProvider>
      <AppShellInner />
    </ThemeProvider>
  );
}
