// src/admin-portal/utils/greeting.js
// Time-of-day greeting + full date, both read from the real clock and the
// signed-in user's name - not decorative copy, an honest "as of right now".
export function timeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function greetingLine(name) {
  const firstName = name?.trim().split(' ')[0] || 'there';
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return `${timeOfDayGreeting()}, ${firstName} · ${date}`;
}
