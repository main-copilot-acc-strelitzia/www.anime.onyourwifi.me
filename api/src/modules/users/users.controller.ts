import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private svc: UsersService) {}

  /**
   * Get current user profile
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: Request & { user?: any }) {
    const userId = req.user?.id;
    return this.svc.getUserById(userId, userId);
  }

  /**
   * Get user by ID (admin only or self)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUser(
    @Param('id') id: string,
    @Req() req: Request & { user?: any }
  ) {
    const userId = req.user?.id;
    return this.svc.getUserById(userId, id);
  }

  /**
   * List all users (admin only)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'main_admin')
  async list(@Req() req: Request & { user?: any }) {
    return this.svc.getAllUsers(req.user?.id);
  }

  /**
   * Update user role (main_admin only)
   */
  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('main_admin')
  async updateRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @Req() req: Request & { user?: any }
  ) {
    return this.svc.updateUserRole(req.user?.id, id, body.role as any);
  }

  /**
   * Deactivate user (admin only)
   */
  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'main_admin')
  async deactivate(
    @Param('id') id: string,
    @Req() req: Request & { user?: any }
  ) {
    return this.svc.deactivateUser(req.user?.id, id);
  }

  /**
   * Reactivate user (admin only)
   */
  @Post(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'main_admin')
  async reactivate(
    @Param('id') id: string,
    @Req() req: Request & { user?: any }
  ) {
    return this.svc.reactivateUser(req.user?.id, id);
  }

  /**
   * Get user statistics (admin only)
   */
  @Get('stats/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'main_admin')
  async getStats(@Req() req: Request & { user?: any }) {
    return this.svc.getUserStats(req.user?.id);
  }

  /**
   * Suspend user (legacy endpoint for backward compatibility)
   */
  @Post('suspend/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'main_admin')
  async suspend(@Param('id') id: string) {
    return this.svc.suspend(id);
  }

  /**
   * Unsuspend user (legacy endpoint for backward compatibility)
   */
  @Post('unsuspend/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'main_admin')
  async unsuspend(@Param('id') id: string) {
    return this.svc.unsuspend(id);
  }
}