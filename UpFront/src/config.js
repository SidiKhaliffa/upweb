// Base URL of the backend API. Defaults to the production .NET API so the
// Vercel build keeps working; set VITE_API_URL (e.g. in .env.local) to
// point the app at UpBack, e.g. http://localhost:3000/api.
export const API_BASE =
  import.meta.env.VITE_API_URL || "https://api.universellepeinture.com/api";
