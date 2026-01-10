import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class ActivityTrackingMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaClient) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Only track activity for authenticated users
    if ((req as any).user?.id) {
      const userId = (req as any).user.id;

      // Update lastActivityAt asynchronously without blocking the request
      this.prisma.user
        .update({
          where: { id: userId },
          data: { lastActivityAt: new Date() },
          select: { id: true },
        })
        .catch((err) => {
          // Log error but don't fail the request
          console.error('Failed to update user activity:', err);
        });
    }

    next();
  }
}
