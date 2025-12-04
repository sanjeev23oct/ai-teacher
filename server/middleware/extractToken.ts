import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

// Middleware to extract token from FormData before multer processes it
// This allows us to authenticate before file upload
export function extractTokenFromFormData(req: Request, res: Response, next: NextFunction) {
  // Only process multipart/form-data requests
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return next();
  }

  // Use a temporary multer instance to parse just the token field
  const tempUpload = multer().none();
  
  tempUpload(req, res, (err) => {
    if (err) {
      // If there's an error, it might be because there are files
      // Just continue - the main multer middleware will handle it
      return next();
    }
    
    // Token is now in req.body if it was in the FormData
    // The auth middleware can now access it
    next();
  });
}
