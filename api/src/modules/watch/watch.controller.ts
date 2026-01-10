import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaClient } from '@prisma/client';
import { Inject } from '@nestjs/common';

@Controller('watch')
@UseGuards(RolesGuard)
@Roles('watcher', 'admin', 'main_admin')
export class WatchController {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  @Post('position')
  async position(@Body() body: { episodeId: string; lastPositionSec: number }, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) return { ok: false };
    await this.prisma.watchHistory.upsert({
      where: { userId_episodeId: { userId, episodeId: body.episodeId } as any },
      update: { lastPositionSec: body.lastPositionSec, watchedAt: new Date() },
      create: { userId, episodeId: body.episodeId, lastPositionSec: body.lastPositionSec },
    });
    return { ok: true };
  }
}