import { Controller, Get, UseGuards, Query, Inject } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MainAdminGuard } from '../../common/guards/main-admin.guard';
import { PrismaClient } from '@prisma/client';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('admin', 'main_admin')
export class AuditController {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  // Admins and main_admins can view audit logs; in a stricter setup, main_admin only for some views
  @Get('audit')
  async list(@Query('limit') limit = '100') {
    const l = Math.min(1000, parseInt(limit, 10) || 100);
    const logs = await this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: l });
    return logs;
  }
}