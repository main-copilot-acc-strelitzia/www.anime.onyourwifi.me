import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Security Verification Middleware
 * Checks if user has completed the security challenge before accessing protected routes
 * Allows main_admin and security endpoints to bypass
 */
@Injectable()
export class SecurityVerificationMiddleware implements NestMiddleware {
  // Routes that bypass security challenge
  private BYPASS_ROUTES = [
    '/security', // All security endpoints
    '/health', // Health check
    '/api/health',
    '/docs', // Swagger docs
    '/api-docs',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;
    const method = req.method;

    // Allow OPTIONS requests (CORS preflight)
    if (method === 'OPTIONS') {
      return next();
    }

    // Check if this route should bypass security
    if (this.shouldBypassSecurity(path)) {
      return next();
    }

    // Check if user has verified security challenge
    const isVerified = (req.session as any)?.securityVerified === true;

    if (!isVerified) {
      // User not verified - redirect to security challenge page
      return res.status(403).json({
        success: false,
        message: 'Security challenge required',
        data: {
          redirect: '/security-challenge',
        },
      });
    }

    // User verified - allow access
    next();
  }

  /**
   * Check if route should bypass security verification
   */
  private shouldBypassSecurity(path: string): boolean {
    return this.BYPASS_ROUTES.some(
      (route) => path.startsWith(route) || path === route,
    );
  }
}
