import { Module, Global, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { VideosModule } from './modules/videos/videos.module';
import { AdminModule } from './modules/admin/admin.module';
import { TranscodingModule } from './modules/transcoding/transcoding.module';
import { RedisModule } from './libs/redis.client';
import { initializeStorage } from './libs/local-storage';
import { RateLimitMiddleware } from './common/middleware/rate-limit';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    UploadsModule,
    VideosModule,
    AdminModule,
    TranscodingModule,
    RedisModule,
  ],
  providers: [
    {
      provide: 'PRISMA',
      useFactory: () => {
        const prisma = new PrismaClient();
        return prisma;
      },
    },
  ],
  exports: ['PRISMA'],
})
export class AppModule implements NestModule {
  constructor() {
    // Initialize local storage on app startup
    initializeStorage();
  }

  configure(consumer: MiddlewareConsumer) {
    // Apply rate limiting middleware to critical endpoints
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        '/auth/login',
        '/auth/register',
        '/auth/refresh',
        '/videos'
      );
  }
}
