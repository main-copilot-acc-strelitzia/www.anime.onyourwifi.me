import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

/**
 * RolesGuard: Enforces role-based access control
 * Usage: @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'main_admin')
 *
 * Security Features:
 * 1. Re-fetches user from DB to prevent role spoofing via token manipulation
 * 2. Prevents non-main_admin from changing roles
 * 3. Validates that user's current role in DB matches required roles
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('PRISMA') private prisma: PrismaClient
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request & { user?: any; body?: any }>();
    const user = req.user;

    // If no roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    if (!user || !user.id) {
      throw new ForbiddenException('User not found');
    }

    // Re-fetch user from DB to get latest role
    // This prevents role spoofing via token manipulation
    const freshUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!freshUser || !freshUser.isActive) {
      throw new ForbiddenException('User is inactive or not found');
    }

    // Security: Prevent non-main_admin from changing roles
    const body = req.body || {};
    if (body.role || body.isAdmin || body.is_admin) {
      if (freshUser.role !== 'main_admin') {
        throw new ForbiddenException(
          'Only main_admin can change user roles'
        );
      }
    }

    // Check if user's role is in required roles
    const hasRole = requiredRoles.includes(freshUser.role as Role);
    if (!hasRole) {
      throw new ForbiddenException(
        `This resource requires one of: ${requiredRoles.join(', ')}`
      );
    }

    // Attach fresh user to request
    req.user = freshUser;
    return true;
  }
}