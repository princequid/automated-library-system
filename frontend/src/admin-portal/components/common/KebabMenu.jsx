// src/admin-portal/components/common/KebabMenu.jsx
// Per-row "more actions" menu for a DataTable's Actions column, alongside a
// primary "View" link. `items`: [{ label, onClick, danger? }]. Stops event
// propagation on its own trigger so opening the menu never also fires the
// row's onRowClick navigation.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useOverlayRoot } from '../../context/OverlayRootContext';

const MoreIcon = (props) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
    <circle cx="8" cy="3.5" r="1.3" fill="currentColor" />
    <circle cx="8" cy="8" r="1.3" fill="currentColor" />
    <circle cx="8" cy="12.5" r="1.3" fill="currentColor" />
  </svg>
);

export function KebabMenu({ items, label = 'More actions' }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const overlayRoot = useOverlayRoot();

  function openMenu(e) {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ top: rect.bottom + 4, left: rect.right });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();

    function handlePointerDown(e) {
      if (!menuRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
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
        className="kebab-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={(e) => (open ? (e.stopPropagation(), setOpen(false)) : openMenu(e))}
      >
        <MoreIcon />
      </button>
      {open &&
        overlayRoot &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className="kebab-menu"
            role="menu"
            style={{ position: 'fixed', top: position.top, left: position.left, transform: 'translateX(-100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={`kebab-menu-item ${item.danger ? 'kebab-menu-item-danger' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>,
          overlayRoot
        )}
    </>
  );
}
