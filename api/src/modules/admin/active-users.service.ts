import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

interface ActiveUser {
  id: string;
  username: string;
  email: string;
  ipAddress: string | null;
  role: string;
  lastActivityAt: Date;
}

@Injectable()
export class ActiveUsersService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Update user's last activity timestamp
   */
  async updateUserActivity(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() },
    });
  }

  /**
   * Get all currently active users (active in last 30 minutes)
   */
  async getActiveUsers(minutesWindow: number = 30): Promise<ActiveUser[]> {
    const thresholdTime = new Date(Date.now() - minutesWindow * 60000);

    const activeUsers = await this.prisma.user.findMany({
      where: {
        lastActivityAt: {
          gte: thresholdTime,
        },
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        ipAddress: true,
        role: true,
        lastActivityAt: true,
      },
      orderBy: {
        lastActivityAt: 'desc',
      },
    });

    return activeUsers as ActiveUser[];
  }

  /**
   * Get active users with their IPs (for admin panel)
   * Only accessible to main_admin
   */
  async getActiveUsersWithIPs(minutesWindow: number = 30): Promise<ActiveUser[]> {
    return this.getActiveUsers(minutesWindow);
  }

  /**
   * Check if a user is currently active
   */
  async isUserActive(userId: string, minutesWindow: number = 30): Promise<boolean> {
    const thresholdTime = new Date(Date.now() - minutesWindow * 60000);

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        lastActivityAt: {
          gte: thresholdTime,
        },
        isActive: true,
      },
    });

    return !!user;
  }

  /**
   * Get user count (online and offline)
   */
  async getUserStats(minutesWindow: number = 30) {
    const thresholdTime = new Date(Date.now() - minutesWindow * 60000);

    const totalUsers = await this.prisma.user.count({
      where: { isActive: true },
    });

    const activeUsers = await this.prisma.user.count({
      where: {
        lastActivityAt: {
          gte: thresholdTime,
        },
        isActive: true,
      },
    });

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
    };
  }

  /**
   * Get user by IP address (for quick admin IP addition)
   */
  async getUserByIP(ipAddress: string) {
    return this.prisma.user.findFirst({
      where: { ipAddress },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        lastActivityAt: true,
      },
    });
  }

  /**
   * Search active users by username or email
   */
  async searchActiveUsers(query: string, minutesWindow: number = 30): Promise<ActiveUser[]> {
    const thresholdTime = new Date(Date.now() - minutesWindow * 60000);
    const lowerQuery = query.toLowerCase();

    const activeUsers = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: lowerQuery, mode: 'insensitive' } },
          { email: { contains: lowerQuery, mode: 'insensitive' } },
        ],
        lastActivityAt: {
          gte: thresholdTime,
        },
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        ipAddress: true,
        role: true,
        lastActivityAt: true,
      },
      orderBy: {
        lastActivityAt: 'desc',
      },
    });

    return activeUsers as ActiveUser[];
  }
}
