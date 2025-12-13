/**
 * Utility functions for admin access control
 */

/**
 * Check if the current user is an admin based on their email
 * This is a client-side check for UI purposes only
 * Server-side validation is still required for security
 */
export const isCurrentUserAdmin = (userEmail?: string): boolean => {
  if (!userEmail) return false;
  
  // List of admin emails (should match server-side ADMIN_EMAILS)
  // In a production app, this could be fetched from an API endpoint
  const adminEmails = [
    'sanjeev23oct@gmail.com',
    'admin@example.com'
  ];
  
  return adminEmails.includes(userEmail.toLowerCase());
};

/**
 * Get admin emails list (for display purposes)
 */
export const getAdminEmails = (): string[] => {
  return [
    'sanjeev23oct@gmail.com',
    'admin@example.com'
  ];
};