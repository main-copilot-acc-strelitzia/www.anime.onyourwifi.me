import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * RateLimitStore: In-memory rate limiting for LAN deployments
 * Tracks requests per IP address and endpoint
 * No external dependencies - suitable for USB deployments
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

type RateLimitStore = Record<string, RateLimitEntry>;

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  // In-memory stores for different endpoints
  private loginStore: RateLimitStore = {};
  private registerStore: RateLimitStore = {};
  private videoStore: RateLimitStore = {};
  private generalStore: RateLimitStore = {};

  // Configuration (in milliseconds)
  private readonly config = {
    login: {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    },
    register: {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
    video: {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
    },
    general: {
      maxRequests: 1000,
      windowMs: 60 * 1000, // 1 minute
    },
  };

  use(req: Request, res: Response, next: NextFunction) {
    const ip = this.getClientIp(req);
    const path = req.path;
    const method = req.method;

    // Determine which store and config to use
    if (method === 'POST' && path === '/auth/login') {
      this.checkRateLimit(ip, this.loginStore, this.config.login, res);
    } else if (method === 'POST' && path === '/auth/register') {
      this.checkRateLimit(ip, this.registerStore, this.config.register, res);
    } else if ((method === 'GET' || method === 'POST') && path.includes('/videos')) {
      // Use user ID if available (authenticated) for video endpoints
      const userId = (req as any).user?.id || ip;
      this.checkRateLimit(userId, this.videoStore, this.config.video, res);
    }
    // For general endpoints, optional light rate limiting

    // Add rate limit info to response headers
    const store = this.getStoreForPath(path);
    const config = this.getConfigForPath(path);
    if (store && config) {
      const key = (method === 'POST' && path === '/auth/login') ||
        (method === 'POST' && path === '/auth/register')
        ? ip
        : (req as any).user?.id || ip;
      const entry = store[key];
      if (entry) {
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - entry.count));
        res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
      }
    }

    next();
  }

  /**
   * Check if request is within rate limit
   * Throws if exceeded
   */
  private checkRateLimit(
    key: string,
    store: RateLimitStore,
    config: { maxRequests: number; windowMs: number },
    res: Response
  ) {
    const now = Date.now();

    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      return; // First request, always allow
    }

    const entry = store[key];

    // Reset if window expired
    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + config.windowMs;
      return; // New window, allow
    }

    // Increment counter
    entry.count++;

    // Check if exceeded
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

      const error = new Error(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      );
      (error as any).statusCode = 429;
      throw error;
    }
  }

  /**
   * Extract client IP from request
   * Handles proxy headers (X-Forwarded-For)
   */
  private getClientIp(req: Request): string {
    // Check X-Forwarded-For header (for proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : forwarded[0];
    }

    // Check X-Real-IP header
    const xRealIp = req.headers['x-real-ip'];
    if (xRealIp) {
      return typeof xRealIp === 'string' ? xRealIp : xRealIp[0];
    }

    // Fall back to socket IP
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Helper to get store for path
   */
  private getStoreForPath(path: string): RateLimitStore | null {
    if (path === '/auth/login') return this.loginStore;
    if (path === '/auth/register') return this.registerStore;
    if (path.includes('/videos')) return this.videoStore;
    return null;
  }

  /**
   * Helper to get config for path
   */
  private getConfigForPath(path: string): typeof this.config.login | null {
    if (path === '/auth/login') return this.config.login;
    if (path === '/auth/register') return this.config.register;
    if (path.includes('/videos')) return this.config.video;
    return null;
  }
}
