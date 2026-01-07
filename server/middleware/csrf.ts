import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * 
 * Implements Double Submit Cookie pattern for CSRF protection
 * Protects against Cross-Site Request Forgery attacks
 */

interface CSRFOptions {
  cookieName?: string;
  headerName?: string;
  tokenLength?: number;
  ignoreMethods?: string[];
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
  };
}

const defaultOptions: Required<CSRFOptions> = {
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  tokenLength: 32,
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 86400000, // 24 hours
  },
};

/**
 * Generate a cryptographically secure CSRF token
 */
function generateToken(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Create CSRF protection middleware
 */
export function csrfProtection(options: CSRFOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip CSRF check for safe methods
    if (config.ignoreMethods.includes(req.method)) {
      // Generate and set token for GET requests
      if (req.method === 'GET') {
        let token = req.cookies?.[config.cookieName];
        
        if (!token) {
          token = generateToken(config.tokenLength);
          res.cookie(config.cookieName, token, config.cookieOptions);
        }
        
        // Attach token to response locals for use in templates
        res.locals.csrfToken = token;
      }
      
      return next();
    }

    // For state-changing methods, verify token
    const tokenFromCookie = req.cookies?.[config.cookieName];
    const tokenFromHeader = req.headers[config.headerName.toLowerCase()] as string;

    if (!tokenFromCookie || !tokenFromHeader) {
      return res.status(403).json({
        error: 'Session expired',
        message: 'Your session has expired. Please refresh the page and try again.',
      });
    }

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(
      Buffer.from(tokenFromCookie),
      Buffer.from(tokenFromHeader)
    )) {
      return res.status(403).json({
        error: 'Session invalid',
        message: 'Your session is invalid. Please refresh the page and try again.',
      });
    }

    // Token is valid, proceed
    next();
  };
}

/**
 * Middleware to expose CSRF token to API
 * Useful for SPA applications
 */
export function csrfTokenEndpoint(options: CSRFOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return (req: Request, res: Response) => {
    let token = req.cookies?.[config.cookieName];

    if (!token) {
      token = generateToken(config.tokenLength);
      res.cookie(config.cookieName, token, config.cookieOptions);
    }

    res.json({
      csrfToken: token,
    });
  };
}

/**
 * Express middleware to add CSRF token to res.locals
 * For use with template engines
 */
export function csrfLocals(options: CSRFOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies?.[config.cookieName];

    if (!token) {
      token = generateToken(config.tokenLength);
      res.cookie(config.cookieName, token, config.cookieOptions);
    }

    res.locals.csrfToken = token;
    next();
  };
}

export default csrfProtection;
