import { Module } from '@nestjs/common';
import { VideosService } from './videos.service';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [
    {
      provide: 'PRISMA',
      useFactory: () => new PrismaClient(),
    },
    VideosService,
  ],
  exports: [VideosService],
})
export class VideosModule {}