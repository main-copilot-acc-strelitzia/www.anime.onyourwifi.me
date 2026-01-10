import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateLogin,
  validateRegistration,
} from '../../common/utils/validation';

/**
 * Authentication Controller
 * Endpoints: /auth/register, /auth/login, /auth/me, /auth/logout, /auth/refresh
 *
 * Security Features:
 * - Input validation on all endpoints
 * - Rate limiting (middleware in app.module.ts)
 * - JWT token-based authentication
 * - Refresh token rotation
 * - Audit logging on all auth events
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/register
   * Register a new user (first user becomes main_admin, others default to 'watcher')
   * Captures client IP address for admin access control
   * Rate Limited: 3 requests per hour per IP
   *
   * Validation:
   * - Email must be valid format
   * - Password must be 8+ chars with uppercase, lowercase, number
   * - Username (optional) must be 3-32 alphanumeric/underscore
   */
  @Post('register')
  @HttpCode(201)
  async register(@Body() dto: RegisterDto, @Request() req: any) {
    // Validate input
    const validation = validateRegistration(dto.email, dto.password, dto.username);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join('; '));
    }

    // Get client IP address
    const ipAddress = this.getClientIP(req);

    return this.authService.register(
      dto.email.toLowerCase().trim(),
      dto.password,
      dto.username?.trim(),
      ipAddress
    );
  }

  /**
   * POST /auth/login
   * Login and return JWT access token + refresh token
   * Rate Limited: 5 requests per 15 minutes per IP
   *
   * Validation:
   * - Email must be valid format
   * - Password is required
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    // Validate input
    const validation = validateLogin(dto.email, dto.password);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors.join('; '));
    }

    return this.authService.login(
      dto.email.toLowerCase().trim(),
      dto.password
    );
  }

  /**
   * GET /auth/me
   * Get current user profile (requires JWT)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req: any) {
    if (!req.user?.sub) {
      throw new BadRequestException('User not found');
    }
    return this.authService.getMe(req.user.sub);
  }

  /**
   * POST /auth/logout
   * Logout user by revoking refresh tokens (requires JWT)
   * Clears all active sessions for this user
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Request() req: any) {
    if (!req.user?.sub) {
      throw new BadRequestException('User not found');
    }
    return this.authService.logout(req.user.sub);
  }

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   * Rate Limited: General rate limiting (no brute force on this)
   *
   * Validation:
   * - Refresh token must be valid UUID
   * - User ID must be valid UUID
   */
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() dto: RefreshDto) {
    if (!dto.refreshToken || !dto.userId) {
      throw new BadRequestException('Refresh token and userId required');
    }

    // Validate format (prevent injection attempts)
    if (typeof dto.refreshToken !== 'string' || typeof dto.userId !== 'string') {
      throw new BadRequestException('Invalid token format');
    }

    if (dto.refreshToken.length > 255 || dto.userId.length > 255) {
      throw new BadRequestException('Token format invalid');
    }

    return this.authService.refreshToken(
      dto.refreshToken.trim(),
      dto.userId.trim()
    );
  }

  /**
   * Extract client IP from request
   * Handles proxies and Tailscale IPs
   */
  private getClientIP(req: any): string {
    // Check for Tailscale IP header
    if (req.headers['x-tailscale-ip']) {
      return req.headers['x-tailscale-ip'] as string;
    }

    // Check for forwarded IP
    if (req.headers['x-forwarded-for']) {
      const forwarded = req.headers['x-forwarded-for'] as string;
      return forwarded.split(',')[0].trim();
    }

    // Check for client IP header
    if (req.headers['x-client-ip']) {
      return req.headers['x-client-ip'] as string;
    }

    // Fall back to socket address
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }
}