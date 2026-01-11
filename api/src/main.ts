import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import { ValidationPipe } from '@nestjs/common';
import Redis from 'ioredis';
import * as rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    }
  });
  app.setGlobalPrefix('api');

  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Redis connection for LAN: localhost:6379
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redisClient = new Redis(redisUrl);

  // Rate limit auth & upload
  app.use(
    '/api/auth',
    rateLimit({
      store: new RedisStore({
        sendCommand: (...args: any[]) => (redisClient as any).call(...args),
      }) as any,
      windowMs: 15 * 60 * 1000,
      max: 100,
    }),
  );

  // CSRF: for browser POST forms; API used by SPA should use double-submit cookie or same-site cookies
  app.use(
    csurf({
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[INFO] API listening on http://localhost:${port}`);
  console.log(`[INFO] CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`[INFO] Redis: ${redisUrl}`);
}
bootstrap();