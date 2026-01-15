import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  Response,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SecurityChallengeService } from './security-challenge.service';

@Controller('security')
export class SecurityChallengeController {
  constructor(private securityService: SecurityChallengeService) {}

  /**
   * Generate a new security challenge
   * GET /security/challenge/new
   */
  @Get('challenge/new')
  generateChallenge(@Request() req: any, @Response() res: any) {
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'No session ID provided',
      });
    }

    const challenge = this.securityService.generateChallenge(sessionId);

    return res.json({
      success: true,
      data: challenge,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get current challenge status
   * GET /security/challenge/status
   */
  @Get('challenge/status')
  getChallengeStatus(@Request() req: any, @Response() res: any) {
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'No session ID provided',
      });
    }

    const isLocked = this.securityService.isSessionLocked(sessionId);
    const cooldown = this.securityService.getRemainingCooldown(sessionId);
    const challenge = this.securityService.getChallenge(sessionId);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'No active challenge. Call /security/challenge/new first.',
      });
    }

    return res.json({
      success: true,
      data: {
        ...challenge,
        isLocked,
        cooldownRemaining: cooldown || undefined,
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Verify answer to security challenge
   * POST /security/challenge/verify
   * Body: { questionId: number, answer: string }
   */
  @Post('challenge/verify')
  verifyAnswer(
    @Request() req: any,
    @Body() body: { questionId: number; answer: string },
    @Response() res: any,
  ) {
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'No session ID provided',
      });
    }

    if (!body.questionId || !body.answer) {
      return res.status(400).json({
        success: false,
        message: 'Missing questionId or answer',
      });
    }

    // Check if already locked
    if (this.securityService.isSessionLocked(sessionId)) {
      const cooldown = this.securityService.getRemainingCooldown(sessionId);
      return res.status(429).json({
        success: false,
        message: `You are locked out. Try again in ${cooldown} seconds.`,
        cooldownRemaining: cooldown,
      });
    }

    const result = this.securityService.verifyAnswer(
      sessionId,
      body.questionId,
      body.answer,
    );

    if (result.success) {
      // Set verification cookie/session
      req.session.securityVerified = true;
      req.session.verifiedAt = new Date();

      return res.json({
        success: true,
        message: 'Challenge passed! Welcome.',
        data: {
          verified: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Wrong answer or other error
    return res.status(403).json({
      success: false,
      message: result.message,
      data: {
        nextCooldown: result.nextCooldown,
        attempts: result.attemptsRemaining,
        isLocked: (result as any).isLocked,
      },
    });
  }

  /**
   * Detect refresh attempts and handle bot-like behavior
   * POST /security/challenge/refresh-detect
   */
  @Post('challenge/refresh-detect')
  detectRefresh(
    @Request() req: any,
    @Body() body: { questionId: number },
    @Response() res: any,
  ) {
    const sessionId = req.sessionID || req.headers['x-session-id'];

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'No session ID provided',
      });
    }

    const isRefresh = this.securityService.detectAndHandleRefresh(
      sessionId,
      body.questionId,
    );

    if (isRefresh) {
      // Record suspicious activity
      this.securityService.recordSuspiciousActivity(
        sessionId,
        'page_refresh',
      );

      const cooldown = this.securityService.getRemainingCooldown(sessionId);

      return res.status(429).json({
        success: false,
        message: 'Bot-like behavior detected. Temporary lockout applied.',
        data: {
          reason: 'Page refresh not allowed',
          cooldownRemaining: cooldown,
          suggestedMessage:
            'You are locked out. Try again after the cooldown.',
        },
      });
    }

    return res.json({
      success: true,
      message: 'No refresh detected.',
    });
  }

  /**
   * Check if user is verified to access the site
   * GET /security/verified
   */
  @Get('verified')
  checkVerification(@Request() req: any, @Response() res: any) {
    const isVerified = req.session?.securityVerified === true;

    return res.json({
      success: true,
      data: {
        verified: isVerified,
        verifiedAt: req.session?.verifiedAt || null,
      },
    });
  }

  /**
   * Clear verification (logout)
   * POST /security/logout
   */
  @Post('logout')
  logout(@Request() req: any, @Response() res: any) {
    const sessionId = req.sessionID;

    if (sessionId) {
      this.securityService.clearSession(sessionId);
    }

    req.session.securityVerified = false;
    req.session.verifiedAt = null;

    return res.json({
      success: true,
      message: 'Logged out. Security verification cleared.',
    });
  }
}
