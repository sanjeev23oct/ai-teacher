// Utility function to make authenticated API calls
// Handles token from localStorage automatically

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

export async function authenticatedFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const token = localStorage.getItem('auth_token');
  
  // If body is FormData, add token to it
  if (options.body instanceof FormData && token) {
    options.body.append('token', token);
  }
  
  // For JSON requests, add Authorization header
  if (token && !(options.body instanceof FormData)) {
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${token}`);
    options.headers = headers;
  }
  
  // Always include credentials
  options.credentials = 'include';
  
  return fetch(url, options);
}

// For GET requests with token as query param (fallback)
export function addTokenToUrl(url: string): string {
  const token = localStorage.getItem('auth_token');
  if (!token) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}
