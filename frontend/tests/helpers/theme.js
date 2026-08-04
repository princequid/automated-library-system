/**
 * Forces the admin portal's theme before first paint, bypassing the
 * ThemeToggle UI - ThemeContext reads localStorage['alms-admin-theme']
 * ('light' | 'dark' | 'system') on mount (see src/admin-portal/context
 * /ThemeContext.jsx), so seeding it via addInitScript before navigation
 * lands the resolved theme on the very first render.
 */
export async function seedTheme(page, theme) {
  await page.addInitScript((t) => window.localStorage.setItem('alms-admin-theme', t), theme);
}
