// Server-side: use the configured site URL. Client-side: use origin (for API calls).
export const BASE_URL =
  typeof window !== 'undefined'
    ? window.location.origin
    : (import.meta.env.SITE ?? 'http://localhost:4321')
