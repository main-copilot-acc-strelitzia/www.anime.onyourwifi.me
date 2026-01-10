import { BadRequestException } from '@nestjs/common';

/**
 * Validation Utilities
 * Server-side input validation for security
 * Prevents SQL injection, XSS, and invalid data
 */

/**
 * Email validation regex (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 255) return false; // Prevent buffer overflow
  return EMAIL_REGEX.test(email);
}

/**
 * Validate password strength
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character (optional for easier UX)
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password must be a string');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Optional: require special character (disabled for UX)
  // if (!/[!@#$%^&*]/.test(password)) {
  //   errors.push('Password must contain at least one special character');
  // }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate username format
 * - 3-32 characters
 * - Alphanumeric and underscore only
 */
export function validateUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 32) return false;
  return /^[a-zA-Z0-9_]+$/.test(username);
}

/**
 * Sanitize string for storage
 * - Trim whitespace
 * - Limit length
 * - Remove control characters
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

/**
 * Validate UUID v4 format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  limit?: number,
  offset?: number
): { limit: number; offset: number } {
  const maxLimit = 100;
  const defaultLimit = 50;

  let validLimit = defaultLimit;
  if (limit !== undefined) {
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      throw new BadRequestException('Limit must be a positive integer');
    }
    validLimit = Math.min(parsedLimit, maxLimit);
  }

  let validOffset = 0;
  if (offset !== undefined) {
    const parsedOffset = Number(offset);
    if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
      throw new BadRequestException('Offset must be a non-negative integer');
    }
    validOffset = parsedOffset;
  }

  return { limit: validLimit, offset: validOffset };
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(
  sizeInBytes: number,
  maxSizeInBytes: number = 100 * 1024 * 1024 * 1024 // 100GB default
): boolean {
  return sizeInBytes > 0 && sizeInBytes <= maxSizeInBytes;
}

/**
 * Validate MIME type for video files
 */
export function validateVideoMimeType(mimeType: string): boolean {
  const allowedTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/webm',
    'video/ogg',
    'video/x-flv',
  ];
  return allowedTypes.includes(mimeType.toLowerCase());
}

/**
 * Sanitize file path to prevent directory traversal
 */
export function sanitizeFilePath(filePath: string): string {
  if (!filePath || typeof filePath !== 'string') return '';

  // Remove leading/trailing slashes and spaces
  let cleaned = filePath.trim();

  // Prevent directory traversal attempts
  cleaned = cleaned
    .replace(/\.\./g, '')
    .replace(/\x00/g, '')
    .replace(/[<>:"|?*]/g, '');

  return cleaned;
}

/**
 * Validate role value
 */
export function validateRole(role: string): boolean {
  const validRoles = ['watcher', 'admin', 'main_admin'];
  return validRoles.includes(role?.toLowerCase());
}

/**
 * Validate video title
 */
export function validateVideoTitle(title: string): boolean {
  if (!title || typeof title !== 'string') return false;
  if (title.length < 3 || title.length > 255) return false;
  return true;
}

/**
 * Validate video description
 */
export function validateVideoDescription(description: string): boolean {
  if (!description || typeof description !== 'string') return true; // Optional
  return description.length <= 2000;
}

/**
 * Validate query parameters for injection attacks
 */
export function validateQueryParam(param: string, maxLength: number = 255): boolean {
  if (!param || typeof param !== 'string') return false;
  if (param.length > maxLength) return false;

  // Check for SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT)\b)/i,
    /(['";][\s]*(OR|AND|WHERE|LIKE))/i,
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(param)) {
      return false;
    }
  }

  return true;
}

/**
 * Validate sort parameter
 */
export function validateSortParam(sort: string): boolean {
  if (!sort || typeof sort !== 'string') return true; // Optional
  const validSorts = ['asc', 'desc'];
  return validSorts.includes(sort.toLowerCase());
}

/**
 * Validate status filter
 */
export function validateStatusFilter(status: string): boolean {
  if (!status || typeof status !== 'string') return true; // Optional
  const validStatuses = ['pending', 'processing', 'completed', 'failed'];
  return validStatuses.includes(status.toLowerCase());
}

/**
 * Comprehensive validation for registration
 */
export function validateRegistration(email: string, password: string, username?: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!validateEmail(email)) {
    errors.push('Invalid email format');
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  if (username && !validateUsername(username)) {
    errors.push('Username must be 3-32 characters, alphanumeric and underscore only');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Comprehensive validation for login
 */
export function validateLogin(email: string, password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!validateEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
