// src/admin-portal/services/http.js
// Every admin-portal service module calls through this. It is NOT a new axios
// client - it re-exports the app's existing instance (src/lib/api.ts), which
// already attaches the in-memory bearer token and does a single-flight
// refresh-on-401 against the httpOnly cookie. Building a second client here
// would mean two competing token/refresh sources for the same session; the
// student portal and this portal share one login and must share one client.
export { api as http, apiErrorMessage, unwrap } from '@/lib/api';
