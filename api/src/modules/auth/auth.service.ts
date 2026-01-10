import {
  Injectable,
  Inject,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/**
 * Authentication Service
 * Handles user registration, login, token refresh, and logout
 * Uses Argon2 for password hashing and JWT for token management
 */
@Injectable()
export class AuthService {
  private jwtPrivateKey: string;
  private jwtPublicKey: string;

  constructor(@Inject('PRISMA') private prisma: PrismaClient) {
    this.jwtPrivateKey = process.env.JWT_PRIVATE_KEY || 'dev-key-please-change';
    this.jwtPublicKey = process.env.JWT_PUBLIC_KEY || 'dev-key-please-change';
  }

  /**
   * Register a new user
   * First user is automatically main_admin with IP logged
   * Subsequent users default to 'watcher' role
   * Passwords are hashed with Argon2
   */
  async register(email: string, password: string, username?: string, ipAddress?: string) {
    // Validate input
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Invalid email format');
    }
    if (!password || password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    // Check if user already exists
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists (if provided)
    if (username) {
      const existingUsername = await this.prisma.user.findUnique({
        where: { username },
      });
      if (existingUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    try {
      // Hash password using Argon2
      const passwordHash = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });

      // Check if this is the first user
      const userCount = await this.prisma.user.count();
      const isFirstUser = userCount === 0;
      const initialRole = isFirstUser ? 'main_admin' : 'watcher';

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          username: username || undefined,
          passwordHash,
          role: initialRole,
          ipAddress: ipAddress || undefined,
        },
      });

      // If first user, also create the admin IP whitelist entry
      if (isFirstUser && ipAddress) {
        await this.prisma.adminIPWhitelist.create({
          data: {
            userId: user.id,
            ipAddress,
            addedById: user.id, // Self-added for first user
          },
        });
      }

      // Log registration in audit log
      await this.prisma.auditLog.create({
        data: {
          action: 'user_registered',
          targetId: user.id,
          detailsJson: { email, isFirstUser, ipAddress },
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Registration failed');
    }
  }

  /**
   * Login user and return JWT access token + refresh token
   * Validates credentials and re-fetches role from DB (prevents role spoofing)
   */
  async login(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    try {
      const isValid = await argon2.verify(user.passwordHash, password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Re-fetch user from DB to get latest role (prevents role spoofing)
    const freshUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!freshUser || !freshUser.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Generate JWT access token (15 minutes)
    const accessToken = jwt.sign(
      {
        sub: freshUser.id,
        email: freshUser.email,
        role: freshUser.role,
        iat: Math.floor(Date.now() / 1000),
      },
      this.jwtPrivateKey,
      { expiresIn: '15m' }
    );

    // Generate refresh token (30 days)
    const refreshToken = uuidv4();
    const refreshTokenHash = await argon2.hash(refreshToken, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    // Save refresh token to database
    await this.prisma.refreshToken.create({
      data: {
        userId: freshUser.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login time
    await this.prisma.user.update({
      where: { id: freshUser.id },
      data: { lastLogin: new Date() },
    });

    // Log login
    await this.prisma.auditLog.create({
      data: {
        action: 'user_login',
        actorId: freshUser.id,
        targetId: freshUser.id,
      },
    });

    return {
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: freshUser.id,
        email: freshUser.email,
        role: freshUser.role,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string, userId: string) {
    // Find refresh token
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { id: refreshToken },
    });

    if (!tokenRecord || tokenRecord.userId !== userId || tokenRecord.revoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Get fresh user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
      },
      this.jwtPrivateKey,
      { expiresIn: '15m' }
    );

    return {
      success: true,
      accessToken: newAccessToken,
    };
  }

  /**
   * Logout user by revoking refresh tokens
   */
  async logout(userId: string) {
    // Revoke all refresh tokens for this user
    await this.prisma.refreshToken.updateMany(
      {
        where: { userId },
        data: { revoked: true },
      }
    );

    // Log logout
    await this.prisma.auditLog.create({
      data: {
        action: 'user_logout',
        actorId: userId,
        targetId: userId,
      },
    });

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Get current user profile
   */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      success: true,
      data: user,
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtPrivateKey);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}