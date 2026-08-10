// src/admin-portal/components/common/NotificationBell.jsx
// Real in-app notification feed (backend/src/modules/notifications) - polled
// every 30s, same convention as the dashboard's own refetchInterval. Reuses
// KebabMenu's fixed-position-portal pattern since both are "small trigger,
// portalled panel anchored to it" shapes.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOverlayRoot } from '../../context/OverlayRootContext';
import { notificationsService } from '../../services/notificationsService';
import { BellIcon } from './Icons';
import { RelativeDate } from './RelativeDate';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const overlayRoot = useOverlayRoot();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', 'me'],
    queryFn: () => notificationsService.list(),
    refetchInterval: 30_000,
  });
  const notifications = query.data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markRead = useMutation({
    mutationFn: (id) => notificationsService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] }),
  });
  const markAllRead = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] }),
  });

  function toggle() {
    if (!open) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e) {
      if (!panelRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="notification-bell-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        onClick={toggle}
      >
        <BellIcon size={18} />
        {unreadCount > 0 && <span className="notification-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open &&
        overlayRoot &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            className="notification-panel"
            role="menu"
            style={{ position: 'fixed', top: position.top, right: position.right }}
          >
            <div className="notification-panel-header">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button type="button" className="row-actions-view" onClick={() => markAllRead.mutate()}>
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 && <p className="notification-panel-empty">No notifications yet.</p>}
            <ul className="notification-panel-list">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`notification-panel-item ${!n.read_at ? 'is-unread' : ''}`}
                  onClick={() => !n.read_at && markRead.mutate(n.id)}
                >
                  <p className="notification-panel-item-title">{n.title}</p>
                  <p className="notification-panel-item-body">{n.body}</p>
                  <RelativeDate value={n.created_at} className="notification-panel-item-time" />
                </li>
              ))}
            </ul>
          </div>,
          overlayRoot
        )}
    </>
  );
}
