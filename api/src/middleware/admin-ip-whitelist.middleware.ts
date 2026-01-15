import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface RequestWithUser extends Request {
  user?: any;
  ip: string | undefined;
}

@Injectable()
export class AdminIPWhitelistMiddleware implements NestMiddleware {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    // Only check if accessing admin routes
    if (!req.path.startsWith('/admin')) {
      return next();
    }

    // If not authenticated, let JWT guard handle it
    if (!req.user) {
      return next();
    }

    // Check if user is admin
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });

    if (!user || (user.role !== 'admin' && user.role !== 'main_admin')) {
      return next();
    }

    // Get client IP address
    const clientIP = this.getClientIP(req);

    // Check if IP is whitelisted
    const isWhitelisted = await this.prisma.adminIPWhitelist.findFirst({
      where: {
        userId: req.user.id,
        ipAddress: clientIP,
      },
    });

    if (!isWhitelisted) {
      throw new ForbiddenException(
        `Access denied: Your IP address (${clientIP}) is not whitelisted for admin access. Please contact your main administrator.`,
      );
    }

    // Update last accessed time
    await this.prisma.adminIPWhitelist.update({
      where: { id: isWhitelisted.id },
      data: { lastAccessedAt: new Date() },
    });

    next();
  }

  /**
   * Extract client IP from request
   * Handles proxies and Tailscale IPs
   */
  private getClientIP(req: RequestWithUser): string {
    // Check for Tailscale IP header
    if (req.headers['x-tailscale-ip']) {
      return req.headers['x-tailscale-ip'] as string;
    }

    // Check for forwarded IP
    if (req.headers['x-forwarded-for']) {
      const forwarded = req.headers['x-forwarded-for'] as string;
      return forwarded.split(',')[0].trim();
    }

    // Check for client IP header
    if (req.headers['x-client-ip']) {
      return req.headers['x-client-ip'] as string;
    }

    // Fall back to socket address
    return req.ip || req.socket?.remoteAddress || 'unknown';
  }
}
