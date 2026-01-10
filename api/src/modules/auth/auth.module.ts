import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { PrismaClient } from '@prisma/client';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_PRIVATE_KEY || 'dev-key-please-change',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [
    {
      provide: 'PRISMA',
      useFactory: () => new PrismaClient(),
    },
    AuthService,
    JwtStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}