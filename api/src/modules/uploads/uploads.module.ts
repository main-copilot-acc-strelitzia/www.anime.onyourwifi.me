import { Module } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [
    {
      provide: 'PRISMA',
      useFactory: () => new PrismaClient(),
    },
    UploadsService,
  ],
  controllers: [UploadsController],
  exports: [UploadsService],
})
export class UploadsModule {}