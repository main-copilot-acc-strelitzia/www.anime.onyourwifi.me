import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  getRandomQuestion,
  getQuestionById,
  verifyAnswer,
} from './security-questions';

// Types for security challenge management
export interface SecurityChallenge {
  questionId: number;
  question: string;
  attempts: number;
  lastAttempt: Date;
  cooldownExpires?: Date;
  isLocked?: boolean;
}

export interface VerifyAnswerResult {
  success: boolean;
  message?: string;
  nextCooldown?: number;
  attemptsRemaining?: number;
}

@Injectable()
export class SecurityChallengeService {
  // In-memory storage for session challenges (in production, use Redis or database)
  private sessionChallenges = new Map<string, SecurityChallenge>();

  constructor(private prisma: PrismaService) {}

  /**
   * Generate a new security challenge for a session
   */
  generateChallenge(sessionId: string): {
    questionId: number;
    question: string;
  } {
    const randomQuestion = getRandomQuestion();

    this.sessionChallenges.set(sessionId, {
      questionId: randomQuestion.id,
      question: randomQuestion.question,
      attempts: 0,
      lastAttempt: new Date(),
      isLocked: false,
    });

    return {
      questionId: randomQuestion.id,
      question: randomQuestion.question,
    };
  }

  /**
   * Verify user's answer to the security challenge
   * Returns success/failure with cooldown info if needed
   */
  verifyAnswer(
    sessionId: string,
    questionId: number,
    answer: string,
  ): VerifyAnswerResult {
    const challenge = this.sessionChallenges.get(sessionId);

    // Check if session exists
    if (!challenge) {
      return {
        success: false,
        message: 'Session expired. Please refresh to get a new question.',
      };
    }

    // Check if user is in cooldown (exceeded 10 seconds)
    const timeSinceLastAttempt = Date.now() - challenge.lastAttempt.getTime();
    if (timeSinceLastAttempt > 10000) {
      // 10 second window exceeded
      const cooldownDuration = 60000; // 60 seconds base
      const lockoutExpires = new Date(Date.now() + cooldownDuration);

      this.sessionChallenges.set(sessionId, {
        ...challenge,
        isLocked: true,
        cooldownExpires: lockoutExpires,
        lastAttempt: new Date(),
      });

      return {
        success: false,
        message: 'Time exceeded! You are temporarily locked out.',
        nextCooldown: 60,
        isLocked: true,
      };
    }

    // Verify answer correctness
    const isCorrect = verifyAnswer(questionId, answer);

    if (isCorrect) {
      // Success! Remove challenge and mark as solved
      this.sessionChallenges.delete(sessionId);
      return {
        success: true,
        message: 'Correct! Welcome to Strelitzia.',
      };
    }

    // Wrong answer - increment attempts and set cooldown
    const newAttempts = challenge.attempts + 1;
    
    // Cooldown calculation: 60 seconds base, +30 seconds for each wrong attempt after first
    const cooldownDuration = newAttempts === 1 ? 60000 : 60000 + (newAttempts - 1) * 30000;
    const lockoutExpires = new Date(Date.now() + cooldownDuration);

    this.sessionChallenges.set(sessionId, {
      ...challenge,
      attempts: newAttempts,
      isLocked: true,
      cooldownExpires: lockoutExpires,
      lastAttempt: new Date(),
      questionId, // Store original question ID
    });

    return {
      success: false,
      message: `Wrong answer! Cooldown: ${cooldownDuration / 1000} seconds.`,
      nextCooldown: cooldownDuration / 1000,
      attemptsRemaining: newAttempts,
      isLocked: true,
    };
  }

  /**
   * Check if a session is currently locked out
   */
  isSessionLocked(sessionId: string): boolean {
    const challenge = this.sessionChallenges.get(sessionId);
    if (!challenge) return false;

    if (!challenge.isLocked) return false;

    // Check if cooldown has expired
    if (
      challenge.cooldownExpires &&
      new Date() >= challenge.cooldownExpires
    ) {
      // Cooldown expired, unlock
      this.sessionChallenges.delete(sessionId);
      return false;
    }

    return true;
  }

  /**
   * Get remaining cooldown time in seconds
   */
  getRemainingCooldown(sessionId: string): number {
    const challenge = this.sessionChallenges.get(sessionId);
    if (!challenge || !challenge.cooldownExpires) return 0;

    const remaining =
      (challenge.cooldownExpires.getTime() - Date.now()) / 1000;
    return Math.max(0, Math.ceil(remaining));
  }

  /**
   * Detect if user attempted to refresh/reload the challenge page
   * Returns true if refresh is detected
   */
  detectAndHandleRefresh(
    sessionId: string,
    currentQuestionId: number,
  ): boolean {
    const challenge = this.sessionChallenges.get(sessionId);

    if (!challenge) {
      // No challenge in session - this might be a refresh attempt
      return true;
    }

    // If question ID hasn't changed but we're checking again, it's a refresh
    if (
      challenge.questionId === currentQuestionId &&
      Date.now() - challenge.lastAttempt.getTime() < 100
    ) {
      // User attempted to refresh - set bot lockout
      const botLockoutDuration = 120000; // 2 minutes for refresh attempt
      this.sessionChallenges.set(sessionId, {
        ...challenge,
        isLocked: true,
        cooldownExpires: new Date(Date.now() + botLockoutDuration),
        attempts: (challenge.attempts || 0) + 1,
      });

      return true;
    }

    return false;
  }

  /**
   * Record suspicious activity (multiple refreshes, rapid attempts, etc.)
   */
  recordSuspiciousActivity(sessionId: string, activityType: string) {
    const challenge = this.sessionChallenges.get(sessionId);

    if (challenge) {
      // Increase cooldown for suspicious activity
      const increasedCooldown = 180000; // 3 minutes
      this.sessionChallenges.set(sessionId, {
        ...challenge,
        isLocked: true,
        cooldownExpires: new Date(Date.now() + increasedCooldown),
        attempts: (challenge.attempts || 0) + 2,
      });
    }
  }

  /**
   * Get challenge status for a session
   */
  getChallenge(sessionId: string):
    | {
        questionId: number;
        question: string;
        attempts: number;
        isLocked: boolean;
        cooldownRemaining?: number;
      }
    | null {
    const challenge = this.sessionChallenges.get(sessionId);

    if (!challenge) return null;

    const isLocked = this.isSessionLocked(sessionId);
    const cooldownRemaining = isLocked
      ? this.getRemainingCooldown(sessionId)
      : 0;

    return {
      questionId: challenge.questionId,
      question: challenge.question,
      attempts: challenge.attempts,
      isLocked,
      cooldownRemaining: cooldownRemaining || undefined,
    };
  }

  /**
   * Clear all session data (logout)
   */
  clearSession(sessionId: string) {
    this.sessionChallenges.delete(sessionId);
  }

  /**
   * For main_admin bypass - check if user should skip challenge
   */
  shouldSkipChallenge(isMainAdmin: boolean): boolean {
    return isMainAdmin;
  }
}
