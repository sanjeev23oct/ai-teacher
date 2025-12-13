import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if the authenticated user is an admin
 * Requires authMiddleware to be applied first
 */
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access admin features'
      });
    }

    // Get admin emails from environment
    const adminEmails = process.env.ADMIN_EMAILS;
    if (!adminEmails) {
      console.error('[ADMIN] ADMIN_EMAILS not configured in environment');
      return res.status(500).json({ 
        error: 'Admin configuration error',
        message: 'Admin access is not properly configured'
      });
    }

    // Parse admin emails (comma-separated)
    const adminEmailList = adminEmails
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);

    // Check if current user's email is in admin list
    const userEmail = req.user.email?.toLowerCase();
    if (!userEmail || !adminEmailList.includes(userEmail)) {
      console.log(`[ADMIN] Access denied for user: ${userEmail}`);
      return res.status(403).json({ 
        error: 'Admin access required',
        message: 'You do not have permission to access admin features'
      });
    }

    console.log(`[ADMIN] Access granted for admin user: ${userEmail}`);
    next();
  } catch (error: any) {
    console.error('[ADMIN] Error in admin middleware:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to verify admin access'
    });
  }
};

/**
 * Utility function to check if a user is an admin (for use in services)
 */
export const isUserAdmin = (userEmail: string): boolean => {
  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) return false;

  const adminEmailList = adminEmails
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);

  return adminEmailList.includes(userEmail.toLowerCase());
};

export default adminMiddleware;