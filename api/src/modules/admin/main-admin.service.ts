import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class MainAdminService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get the main admin user (first account created)
   */
  async getMainAdmin() {
    return this.prisma.user.findFirst({
      where: { role: 'main_admin' },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Verify if a user is the main admin
   */
  async isMainAdmin(userId: string): Promise<boolean> {
    const mainAdmin = await this.getMainAdmin();
    return mainAdmin?.id === userId;
  }

  /**
   * Verify main admin approval for sensitive actions
   * Only main_admin can promote/demote other admins or change main_admin status
   */
  async verifyMainAdminApproval(
    requestingUserId: string,
    action: 'promote' | 'demote' | 'promote_to_main_admin',
    targetUserId: string,
  ): Promise<{ approved: boolean; reason?: string }> {
    // Check if requesting user is main admin
    const isMainAdmin = await this.isMainAdmin(requestingUserId);

    if (!isMainAdmin) {
      return {
        approved: false,
        reason: 'Only the main admin can perform this action',
      };
    }

    // Prevent main admin from being demoted
    if (action === 'demote') {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (targetUser?.role === 'main_admin') {
        return {
          approved: false,
          reason: 'Cannot demote the main admin',
        };
      }
    }

    // Prevent promoting multiple main admins
    if (action === 'promote_to_main_admin') {
      const mainAdmin = await this.getMainAdmin();
      if (mainAdmin?.id !== requestingUserId) {
        return {
          approved: false,
          reason: 'Only the current main admin can create a new main admin',
        };
      }
    }

    return { approved: true };
  }

  /**
   * Log admin actions for audit trail
   */
  async logAdminAction(
    actorId: string,
    action: string,
    targetId?: string,
    details?: Record<string, any>,
  ) {
    return this.prisma.auditLog.create({
      data: {
        actorId,
        targetId,
        action,
        detailsJson: details || {},
      },
    });
  }

  /**
   * Get all admin actions for a specific user
   */
  async getAdminAuditLog(
    actorId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    return this.prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        actor: { select: { id: true, username: true, email: true, role: true } },
      },
    });
  }

  /**
   * Get all audit logs
   */
  async getAllAuditLogs(limit: number = 100, offset: number = 0) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        actor: { select: { id: true, username: true, email: true, role: true } },
      },
    });
  }

  /**
   * Get admin action statistics
   */
  async getAdminStats() {
    const totalAdmins = await this.prisma.user.count({
      where: { role: { in: ['admin', 'main_admin'] } },
    });

    const mainAdmin = await this.getMainAdmin();

    const recentActions = await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      select: { action: true },
    });

    const actionCounts: Record<string, number> = {};
    recentActions.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    return {
      totalAdmins,
      mainAdmin: mainAdmin
        ? { id: mainAdmin.id, username: mainAdmin.username, email: mainAdmin.email }
        : null,
      last24HoursActions: actionCounts,
      totalActionsLast24h: recentActions.length,
    };
  }
}
