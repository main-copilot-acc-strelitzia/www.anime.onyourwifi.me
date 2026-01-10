import { Controller, UseGuards, Post, Body, Get, Query, Req, HttpException, HttpStatus } from '@nestjs/common';
import { MainAdminGuard } from '../../common/guards/main-admin.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaClient } from '@prisma/client';
import { Inject } from '@nestjs/common';

interface RequestWithUser extends Request {
  user?: any;
}

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('admin', 'main_admin')
export class AdminController {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get active users with their IPs (for easy admin addition)
   * Only accessible to main_admin
   */
  @UseGuards(MainAdminGuard)
  @Get('active-users')
  async getActiveUsers(@Query('minutesWindow') minutesWindow: string = '30') {
    const minutes = Math.min(parseInt(minutesWindow) || 30, 1440);
    const thresholdTime = new Date(Date.now() - minutes * 60000);

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
        createdAt: true,
      },
      orderBy: {
        lastActivityAt: 'desc',
      },
    });

    return {
      data: activeUsers.map((user) => ({
        id: user.id,
        username: user.username || 'Anonymous',
        email: user.email,
        ipAddress: user.ipAddress || 'No IP recorded',
        role: user.role,
        lastActivityAt: user.lastActivityAt,
        createdAt: user.createdAt,
      })),
      count: activeUsers.length,
      minutesWindow: minutes,
    };
  }

  /**
   * Search active users by username or email
   */
  @UseGuards(MainAdminGuard)
  @Get('search-users')
  async searchUsers(
    @Query('query') query: string,
    @Query('minutesWindow') minutesWindow: string = '30',
  ) {
    if (!query || query.length < 2) {
      throw new HttpException('Query must be at least 2 characters', HttpStatus.BAD_REQUEST);
    }

    const minutes = Math.min(parseInt(minutesWindow) || 30, 1440);
    const thresholdTime = new Date(Date.now() - minutes * 60000);
    const lowerQuery = query.toLowerCase();

    const users = await this.prisma.user.findMany({
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
      take: 10,
    });

    return {
      data: users,
      count: users.length,
    };
  }

  /**
   * Get user stats (online/offline counts)
   */
  @UseGuards(MainAdminGuard)
  @Get('user-stats')
  async getUserStats(@Query('minutesWindow') minutesWindow: string = '30') {
    const minutes = Math.min(parseInt(minutesWindow) || 30, 1440);
    const thresholdTime = new Date(Date.now() - minutes * 60000);

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
      minutesWindow: minutes,
    };
  }

  @UseGuards(MainAdminGuard)
  @Post('promote')
  async promote(
    @Body() body: { targetUserId: string; newRole: 'admin' | 'main_admin' | 'watcher' },
    @Req() req: RequestWithUser,
  ) {
    const actorId = req.user?.id;
    const target = await this.prisma.user.update({
      where: { id: body.targetUserId },
      data: { role: body.newRole },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        actorId,
        targetId: target.id,
        action: 'promote',
        detailsJson: { previousRole: req.user?.role, newRole: body.newRole },
      },
    });

    return {
      success: true,
      user: { id: target.id, username: target.username, role: target.role },
    };
  }

  @UseGuards(MainAdminGuard)
  @Post('demote')
  async demote(
    @Body() body: { targetUserId: string; newRole: 'watcher' | 'admin' },
    @Req() req: RequestWithUser,
  ) {
    const actorId = req.user?.id;
    const target = await this.prisma.user.update({
      where: { id: body.targetUserId },
      data: { role: body.newRole },
    });

    // Log the action
    await this.prisma.auditLog.create({
      data: {
        actorId,
        targetId: target.id,
        action: 'demote',
        detailsJson: { previousRole: req.user?.role, newRole: body.newRole },
      },
    });

    return {
      success: true,
      user: { id: target.id, username: target.username, role: target.role },
    };
  }

  @Get('upload-rate')
  async uploadRate(@Query('window') window = '1m') {
    // Placeholder: implement aggregation from UploadMetric + Redis counters
    return { window, bytesPerMin: 0 };
  }
}