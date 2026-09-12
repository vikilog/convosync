/** Base URL for the real ConvoSync backend (apps/../backend), run locally via `npm run dev --prefix backend`. */
export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || 'https://api.classivo.app/api'
