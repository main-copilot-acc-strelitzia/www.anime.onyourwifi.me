import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS',
      useFactory: () => {
        // LAN-ready: connect to localhost Redis instance
        const url = process.env.REDIS_URL || 'redis://localhost:6379';
        const redisInstance = new Redis(url);
        
        redisInstance.on('error', (err) => {
          console.error('[ERROR] Redis connection failed:', err.message);
        });
        
        redisInstance.on('connect', () => {
          console.log('[INFO] Redis connected:', url);
        });
        
        return redisInstance;
      },
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}