import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Controller('auth')
@UseGuards(RolesGuard)
@Roles('watcher', 'admin', 'main_admin')
export class MeController {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  // Return current user profile for account area (does NOT expose role publicly; only returns to the owner)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: any) {
    const userId = req.user?.sub || req.user?.id;
    if (!userId) return { ok: false };
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isActive: true, createdAt: true, profileJson: true },
    });
    return user;
  }
}