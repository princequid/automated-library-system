// src/admin-portal/components/common/Avatar.jsx
// Initials-only circular avatar (no image support - this app has no profile
// picture upload). Shared by Sidebar's footer and Navbar's top-bar strip so
// both read the same identity treatment rather than two separate one-offs.
export function Avatar({ name, size = 'md', className = '' }) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() ?? '?';
  return (
    <span className={`avatar avatar-${size} ${className}`.trim()} aria-hidden="true">
      {initial}
    </span>
  );
}
