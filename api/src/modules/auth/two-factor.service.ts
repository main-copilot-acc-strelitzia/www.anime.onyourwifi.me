import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';

/**
 * 2FA/OTP Service (Optional)
 * Implements Time-based One-Time Password (TOTP) for main_admin users
 * Uses HMAC-SHA1 with 30-second time windows (RFC 6238)
 *
 * Usage (Optional):
 * - Enable 2FA in user profile
 * - Generate secret key with generateSecret()
 * - Verify codes with verifyCode()
 *
 * Database Requirements:
 * - User.twoFactorSecret: String (nullable) - stores encrypted secret
 * - User.twoFactorEnabled: Boolean (default: false)
 *
 * Frontend:
 * - Display QR code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
 * - Generate codes every 30 seconds
 * - Show backup codes for recovery
 */
@Injectable()
export class TwoFactorService {
  private readonly baseEncoding = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  private readonly timeStep = 30; // 30-second intervals (RFC 6238)
  private readonly digits = 6; // 6-digit codes
  private readonly window = 1; // Accept codes from ±1 window

  /**
   * Generate a new random secret (base32 encoded)
   * Should be stored securely in database (encrypted)
   */
  generateSecret(): string {
    const secretBytes = crypto.randomBytes(32); // 256-bit secret
    return this.toBase32(secretBytes);
  }

  /**
   * Generate provisioning URI for QR code
   * Format: otpauth://totp/Strelitzia:user@email.com?secret=SECRET&issuer=Strelitzia
   */
  getProvisioningUri(email: string, secret: string): string {
    const issuer = 'Strelitzia';
    const label = `${issuer}:${email}`;
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: this.digits.toString(),
      period: this.timeStep.toString(),
    });
    return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
  }

  /**
   * Verify a 6-digit code against the secret
   * Accepts codes within ±1 time window for clock skew
   */
  verifyCode(secret: string, code: string): boolean {
    if (!secret || !code) return false;
    if (!/^\d{6}$/.test(code)) return false;

    try {
      const codeNum = parseInt(code, 10);
      const secretBytes = this.fromBase32(secret);
      const currentTime = Math.floor(Date.now() / 1000);
      const counter = Math.floor(currentTime / this.timeStep);

      // Check current time window and ±1 for clock skew
      for (let i = -this.window; i <= this.window; i++) {
        const totp = this.generateTOTP(secretBytes, counter + i);
        if (totp === codeNum) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Generate current 6-digit code (for testing/debugging)
   * NOTE: Do not expose in production
   */
  getCurrentCode(secret: string): string {
    if (!secret) return '';

    try {
      const secretBytes = this.fromBase32(secret);
      const currentTime = Math.floor(Date.now() / 1000);
      const counter = Math.floor(currentTime / this.timeStep);
      const totp = this.generateTOTP(secretBytes, counter);
      return totp.toString().padStart(this.digits, '0');
    } catch {
      return '';
    }
  }

  /**
   * Generate backup codes for account recovery
   * Should be displayed once and stored securely (hashed)
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = crypto
        .randomBytes(4)
        .toString('hex')
        .toUpperCase()
        .match(/.{1,4}/g)
        ?.join('-') || '';
      codes.push(code);
    }
    return codes;
  }

  /**
   * Generate QR code as data URL (PNG format)
   * Local implementation - no external API required
   * Use for offline-capable 2FA setup
   */
  async generateQRCodeDataUrl(email: string, secret: string): Promise<string> {
    try {
      const uri = this.getProvisioningUri(email, secret);
      const qrCode = await QRCode.toDataURL(uri, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 300,
      });
      return qrCode;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Verify backup code (single use)
   * Should check against hashed codes in database
   */
  hashBackupCode(code: string): string {
    return crypto
      .createHash('sha256')
      .update(code.replace(/-/g, ''))
      .digest('hex');
  }

  /**
   * Internal: Generate TOTP value
   */
  private generateTOTP(secretBytes: Buffer, counter: number): number {
    const counterBuffer = Buffer.alloc(8);
    for (let i = 7; i >= 0; i--) {
      counterBuffer[i] = counter & 0xff;
      counter >>= 8;
    }

    const hmac = crypto.createHmac('sha1', secretBytes);
    const digest = hmac.update(counterBuffer).digest();

    const offset = digest[digest.length - 1] & 0x0f;
    const value =
      ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);

    return value % Math.pow(10, this.digits);
  }

  /**
   * Internal: Convert bytes to base32
   */
  private toBase32(buffer: Buffer): string {
    let bits = '';
    for (let i = 0; i < buffer.length; i++) {
      let byte = buffer[i];
      for (let j = 7; j >= 0; j--) {
        bits += (byte >> j) & 1 ? '1' : '0';
      }
    }

    let base32 = '';
    for (let i = 0; i < bits.length; i += 5) {
      const chunk = bits.substr(i, 5).padEnd(5, '0');
      base32 += this.baseEncoding[parseInt(chunk, 2)];
    }

    return base32;
  }

  /**
   * Internal: Convert base32 to bytes
   */
  private fromBase32(str: string): Buffer {
    let bits = '';
    for (const char of str.toUpperCase()) {
      const val = this.baseEncoding.indexOf(char);
      if (val === -1) throw new Error('Invalid base32 character');
      bits += val.toString(2).padStart(5, '0');
    }

    const buffer = Buffer.alloc(Math.ceil(bits.length / 8));
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.substr(i, 8).padEnd(8, '0');
      buffer[i / 8] = parseInt(byte, 2);
    }

    // Trim padding
    return buffer.slice(0, Math.floor(bits.length / 8));
  }
}

/**
 * Integration Example for Auth Service:
 *
 * 1. Enable 2FA (POST /auth/2fa/setup):
 *    const secret = this.twoFactorService.generateSecret();
 *    const uri = this.twoFactorService.getProvisioningUri(user.email, secret);
 *    // Return QR code to user (scan with authenticator app)
 *
 * 2. Verify 2FA and Enable:
 *    const isValid = this.twoFactorService.verifyCode(secret, userProvidedCode);
 *    if (isValid) {
 *      user.twoFactorSecret = encryptedSecret;
 *      user.twoFactorEnabled = true;
 *    }
 *
 * 3. Login with 2FA:
 *    // After password verification:
 *    if (user.twoFactorEnabled) {
 *      // Send OTP verification challenge
 *      // Verify code with: twoFactorService.verifyCode(user.twoFactorSecret, userCode)
 *    }
 *
 * Database Migration:
 * ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;
 * ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN DEFAULT false;
 * ALTER TABLE "User" ADD COLUMN "twoFactorBackupCodes" TEXT;
 */
