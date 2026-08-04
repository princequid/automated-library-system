// src/admin-portal/components/layout/AppShell.jsx
// The scoping root: applies the `.admin-portal` class (see tokens.css) and
// the resolved `data-theme` attribute HERE, never on <html>, so dark mode and
// the token layer can never leak into the Tailwind-based student portal.
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import '../../styles/index.css';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { OverlayRootProvider } from '../../context/OverlayRootContext';
import { ToastProvider } from '../common/Toast';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

function AppShellInner() {
  const { resolvedTheme } = useTheme();
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
                <Outlet />
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
