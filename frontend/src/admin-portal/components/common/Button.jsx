// src/admin-portal/components/common/Button.jsx
import { forwardRef } from 'react';
import { SpinnerIcon } from './Icons';

/**
 * variant: primary (the only gradient-free but "loud" fill - reserve for the
 *   one primary action per view) | secondary | outline | ghost | success |
 *   warning | danger
 * size: xs | sm | md | lg
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, iconOnly = false, block = false, className = '', disabled, children, ...props },
  ref
) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    iconOnly ? 'btn-icon' : '',
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} type="button" className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <SpinnerIcon size={size === 'xs' || size === 'sm' ? 14 : 16} className="btn-spinner" />}
      {children}
    </button>
  );
});
