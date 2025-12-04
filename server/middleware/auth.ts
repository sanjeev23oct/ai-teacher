import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        grade?: string | null;
        school?: string | null;
      };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Try to get token from multiple sources (standard pattern)
    let token: string | undefined;
    
    // 1. Check cookies (most reliable for browsers)
    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }
    
    // 2. Check Authorization header (for API clients)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // 3. Check request body (for FormData requests)
    if (!token && req.body && req.body.token) {
      token = req.body.token;
    }
    
    // 4. Check query params (for GET requests)
    if (!token && req.query && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await authService.verifyToken(token);

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Optional auth - doesn't fail if no token, just sets user if available
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Try to get token from multiple sources (standard pattern)
    let token: string | undefined;
    
    // 1. Check cookies (most reliable for browsers)
    if (req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }
    
    // 2. Check Authorization header (for API clients)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // 3. Check request body (for FormData requests)
    if (!token && req.body && req.body.token) {
      token = req.body.token;
    }
    
    // 4. Check query params (for GET requests)
    if (!token && req.query && req.query.token) {
      token = req.query.token as string;
    }

    if (token) {
      const user = await authService.verifyToken(token);
      req.user = user;
    }
  } catch (error) {
    // Ignore errors, just continue without user
  }
  next();
}
