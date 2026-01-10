import { Module } from '@nestjs/common';
import { TranscodingService } from './transcoding.service';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [
    {
      provide: 'PRISMA',
      useFactory: () => new PrismaClient(),
    },
    TranscodingService,
  ],
  exports: [TranscodingService],
})
export class TranscodingModule {}