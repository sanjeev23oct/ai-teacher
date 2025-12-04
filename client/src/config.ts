// API Configuration
// In production, API calls go to the same origin (server serves the client)
// In development, proxy through Vite to localhost:3001
export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? '' : 'http://localhost:3001'
);

// Helper function to build API URLs
export const getApiUrl = (path: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};

// Helper function for image URLs
export const getImageUrl = (path: string) => {
  if (!path) return '';
  // If path already includes the domain, return as is
  if (path.startsWith('http')) return path;
  // Otherwise, prepend the API base URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
