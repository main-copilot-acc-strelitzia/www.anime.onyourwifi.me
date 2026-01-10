import { Injectable, BadRequestException, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AdminIPService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get all admin IP whitelist entries
   */
  async getAllAdminIPs() {
    const ips = await this.prisma.adminIPWhitelist.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ips.map((ip) => ({
      id: ip.id,
      ipAddress: ip.ipAddress,
      userId: ip.userId,
      userName: ip.user.username,
      isMainAdmin: ip.user.role === 'main_admin',
      addedAt: ip.createdAt,
      lastAccessed: ip.lastAccessedAt,
    }));
  }

  /**
   * Add a new admin IP
   */
  async addAdminIP(email: string, ipAddress: string, requesterId: string) {
    // Verify the requester is main admin
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (!requester || requester.role !== 'main_admin') {
      throw new UnauthorizedException('Only main admin can add admin IPs');
    }

    // Find the user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if IP is already whitelisted for this user
    const existing = await this.prisma.adminIPWhitelist.findFirst({
      where: {
        userId: user.id,
        ipAddress,
      },
    });

    if (existing) {
      throw new BadRequestException('This IP is already whitelisted for this user');
    }

    // Create the whitelist entry
    const whitelist = await this.prisma.adminIPWhitelist.create({
      data: {
        userId: user.id,
        ipAddress,
        addedById: requesterId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return {
      id: whitelist.id,
      ipAddress: whitelist.ipAddress,
      userId: whitelist.userId,
      userName: whitelist.user.username,
      isMainAdmin: whitelist.user.role === 'main_admin',
      addedAt: whitelist.createdAt,
    };
  }

  /**
   * Remove an admin IP
   */
  async removeAdminIP(whitelistId: string, requesterId: string) {
    // Verify the requester is main admin
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (!requester || requester.role !== 'main_admin') {
      throw new UnauthorizedException('Only main admin can remove admin IPs');
    }

    // Check if this whitelist entry exists
    const whitelist = await this.prisma.adminIPWhitelist.findUnique({
      where: { id: whitelistId },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!whitelist) {
      throw new BadRequestException('IP whitelist entry not found');
    }

    // Prevent removing main admin's IP (to avoid lockout)
    if (whitelist.user.role === 'main_admin') {
      // Count how many IP addresses the main admin has
      const mainAdminIPCount = await this.prisma.adminIPWhitelist.count({
        where: { userId: whitelist.userId },
      });

      if (mainAdminIPCount <= 1) {
        throw new BadRequestException('Cannot remove the only IP address for main admin (prevents lockout)');
      }
    }

    // Delete the whitelist entry
    await this.prisma.adminIPWhitelist.delete({
      where: { id: whitelistId },
    });

    return { success: true };
  }

  /**
   * Check if an IP address is whitelisted for admin access
   */
  async isIPWhitelisted(ipAddress: string): Promise<boolean> {
    const whitelist = await this.prisma.adminIPWhitelist.findFirst({
      where: { ipAddress },
    });

    if (whitelist) {
      // Update last accessed time
      await this.prisma.adminIPWhitelist.update({
        where: { id: whitelist.id },
        data: { lastAccessedAt: new Date() },
      });
      return true;
    }

    return false;
  }

  /**
   * Get whitelisted IPs for a specific user
   */
  async getUserAdminIPs(userId: string) {
    return this.prisma.adminIPWhitelist.findMany({
      where: { userId },
      select: {
        id: true,
        ipAddress: true,
        createdAt: true,
        lastAccessedAt: true,
      },
    });
  }

  /**
   * Log IP address when admin accesses the admin panel
   */
  async logAdminAccess(userId: string, ipAddress: string) {
    // Find or create admin IP whitelist entry
    const existing = await this.prisma.adminIPWhitelist.findFirst({
      where: {
        userId,
        ipAddress,
      },
    });

    if (existing) {
      // Just update the last accessed time
      await this.prisma.adminIPWhitelist.update({
        where: { id: existing.id },
        data: { lastAccessedAt: new Date() },
      });
    }

    return { logged: true };
  }
}
