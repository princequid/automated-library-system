// src/admin-portal/context/OverlayRootContext.jsx
// Modal/Toast portal into a DOM node that must stay a descendant of
// .admin-portal (see AppShell.jsx) so scoped token/component CSS keeps
// applying inside them. That node is rendered BY AppShell, which is an
// ANCESTOR of ToastProvider and every page that opens a Modal - so a plain
// document.getElementById() lookup made during those components' own render
// would run before the node exists in the DOM on first paint and get stuck
// on a stale `null`. Context sidesteps this: AppShell captures the node via
// a ref callback into state, which triggers a re-render that flows the real
// DOM node down through context once it exists.
import { createContext, useContext } from 'react';

const OverlayRootContext = createContext(null);

export const OverlayRootProvider = OverlayRootContext.Provider;

/** Returns the live overlay root node, or null until AppShell has mounted it. */
export function useOverlayRoot() {
  return useContext(OverlayRootContext);
}
