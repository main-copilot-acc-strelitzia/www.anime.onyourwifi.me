import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

/**
 * MainAdminGuard: Only main_admin role can access
 * Usage: @UseGuards(JwtAuthGuard, MainAdminGuard)
 * Prevents admin users from accessing main_admin-only endpoints
 */
@Injectable()
export class MainAdminGuard implements CanActivate {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();
    const user = req.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not found');
    }

    // Re-fetch user from DB to prevent token tampering
    const freshUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!freshUser || !freshUser.isActive) {
      throw new ForbiddenException('User is inactive or not found');
    }

    if (freshUser.role !== 'main_admin') {
      throw new ForbiddenException('Only main_admin can access this resource');
    }

    // Attach fresh user to request for downstream handlers
    req.user = freshUser;
    return true;
  }
}