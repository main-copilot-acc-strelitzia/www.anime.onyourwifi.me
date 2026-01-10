import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

/**
 * Users Service
 * Handles user management, role changes, and user queries
 * Only main_admin can change user roles
 */
@Injectable()
export class UsersService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get user by ID
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Update user profile (users can only update their own profile)
   * Prevents role changes via update
   */
  async updateProfile(userId: string, data: any) {
    // Prevent role changes and admin flag changes
    delete data.role;
    delete data.isAdmin;
    delete data.is_admin;

    // Hash password if provided
    if (data.password) {
      if (data.password.length < 8) {
        throw new BadRequestException('Password must be at least 8 characters');
      }
      data.passwordHash = await argon2.hash(data.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });
      delete data.password;
    }

    return this.prisma.user.update({ where: { id: userId }, data });
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(requestingUserId: string) {
    // Verify requesting user is admin or main_admin
    const requester = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requester || (requester.role !== 'admin' && requester.role !== 'main_admin')) {
      throw new ForbiddenException('Only admins can list users');
    }

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: users,
    };
  }

  /**
   * Get user by ID (with authorization checks)
   */
  async getUserById(requestingUserId: string, userId: string) {
    // Users can only view their own profile unless they're admin
    const requester = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requester) {
      throw new NotFoundException('Requesting user not found');
    }

    // Allow admins to view any user, users can only view themselves
    if (requester.role !== 'admin' && requester.role !== 'main_admin' && requestingUserId !== userId) {
      throw new ForbiddenException('You can only view your own profile');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  /**
   * Update user role (main_admin only)
   */
  async updateUserRole(
    requestingUserId: string,
    targetUserId: string,
    newRole: Role
  ) {
    // Only main_admin can change roles
    const requester = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requester || requester.role !== 'main_admin') {
      throw new ForbiddenException('Only main_admin can change user roles');
    }

    // Find target user
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Prevent downgrading main_admin (should not be possible if logic is correct)
    if (targetUser.role === 'main_admin' && newRole !== 'main_admin') {
      throw new ForbiddenException('Cannot downgrade main_admin');
    }

    // Validate role
    const validRoles = ['watcher', 'admin', 'main_admin'];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException('Invalid role');
    }

    // Update role
    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    // Log role change
    await this.prisma.auditLog.create({
      data: {
        action: 'user_role_changed',
        actorId: requestingUserId,
        targetId: targetUserId,
        detailsJson: {
          oldRole: targetUser.role,
          newRole,
        },
      },
    });

    return {
      success: true,
      data: updatedUser,
    };
  }

  /**
   * Deactivate user (admin only)
   */
  async deactivateUser(requestingUserId: string, targetUserId: string) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requester || (requester.role !== 'admin' && requester.role !== 'main_admin')) {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    // Prevent deactivating main_admin
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.role === 'main_admin') {
      throw new ForbiddenException('Cannot deactivate main_admin');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    // Log deactivation
    await this.prisma.auditLog.create({
      data: {
        action: 'user_deactivated',
        actorId: requestingUserId,
        targetId: targetUserId,
      },
    });

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Reactivate user (admin only)
   */
  async reactivateUser(requestingUserId: string, targetUserId: string) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requester || (requester.role !== 'admin' && requester.role !== 'main_admin')) {
      throw new ForbiddenException('Only admins can reactivate users');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive: true },
      select: {
        id: true,
        email: true,
        isActive: true,
      },
    });

    // Log reactivation
    await this.prisma.auditLog.create({
      data: {
        action: 'user_reactivated',
        actorId: requestingUserId,
        targetId: targetUserId,
      },
    });

    return {
      success: true,
      data: updated,
    };
  }

  /**
   * Suspend user (legacy method for backward compatibility)
   */
  async suspend(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  }

  /**
   * Unsuspend user (legacy method for backward compatibility)
   */
  async unsuspend(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive: true } });
  }

  /**
   * Get user statistics (admin only)
   */
  async getUserStats(requestingUserId: string) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requestingUserId },
    });

    if (!requester || (requester.role !== 'admin' && requester.role !== 'main_admin')) {
      throw new ForbiddenException('Only admins can view stats');
    }

    const [totalUsers, activeUsers, watchers, admins, mainAdmins] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'watcher' } }),
      this.prisma.user.count({ where: { role: 'admin' } }),
      this.prisma.user.count({ where: { role: 'main_admin' } }),
    ]);

    return {
      success: true,
      data: {
        totalUsers,
        activeUsers,
        roleDistribution: {
          watchers,
          admins,
          mainAdmins,
        },
      },
    };
  }
}