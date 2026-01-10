import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PrismaClient } from '@prisma/client';
import { VideoSourcesModule } from './video-sources.module';

@Module({
  imports: [VideoSourcesModule],
  controllers: [AdminController],
  providers: [
    {
      provide: 'PRISMA',
      useFactory: () => new PrismaClient(),
    },
  ],
})
export class AdminModule {}