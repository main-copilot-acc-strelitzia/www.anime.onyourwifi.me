/**
 * Security Utilities
 * Implements CSRF protection, input validation, secure API calls, and role-based access control
 */

export enum UserRole {
  WATCHER = 'watcher',
  ADMIN = 'admin',
  MAIN_ADMIN = 'main_admin',
}

/**
 * Get CSRF token from meta tag or cookie
 */
export const getCSRFToken = (): string | null => {
  // Try to get from meta tag first
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }

  // Try to get from cookie
  const match = document.cookie.match(/csrf-token=([^;]*)/);
  return match ? match[1] : null;
};

/**
 * Make a secure API call with CSRF token
 */
export const secureApiCall = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const csrfToken = getCSRFToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if user role is admin (admin or main_admin)
 */
export const isAdminRole = (role?: string | null): boolean => {
  return role === UserRole.ADMIN || role === UserRole.MAIN_ADMIN;
};

/**
 * Check if user role is main_admin
 */
export const isMainAdminRole = (role?: string | null): boolean => {
  return role === UserRole.MAIN_ADMIN;
};

/**
 * Check if user role is watcher (regular user)
 */
export const isWatcherRole = (role?: string | null): boolean => {
  return role === UserRole.WATCHER || !role;
};

/**
 * Prevent unauthorized access to admin-only data
 * Throws error if user is not admin
 */
export const requireAdminRole = (role?: string | null): void => {
  if (!isAdminRole(role)) {
    throw new Error('Unauthorized: Admin access required');
  }
};

/**
 * Prevent unauthorized access to main_admin-only operations
 * Throws error if user is not main_admin
 */
export const requireMainAdminRole = (role?: string | null): void => {
  if (!isMainAdminRole(role)) {
    throw new Error('Unauthorized: Main admin access required');
  }
};

/**
 * Sanitize string to prevent XSS attacks
 */
export const sanitizeString = (str: string): string => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Validate video-related data to ensure watchers cannot access admin content
 */
export const validateVideoAccess = (userRole?: string | null, data?: any): boolean => {
  // Watchers can only access public video data
  if (isWatcherRole(userRole)) {
    // Check that data doesn't contain admin-only fields
    const adminOnlyFields = ['adminNotes', 'internalStatus', 'transcodeJobId', 'uploadMetadata'];
    if (data) {
      for (const field of adminOnlyFields) {
        if (field in data) {
          console.warn(`Attempted access to admin field: ${field}`);
          return false;
        }
      }
    }
  }
  return true;
};

/**
 * Filter out admin-only data from API responses for watchers
 */
export const filterAdminData = (data: any, userRole?: string | null): any => {
  if (isAdminRole(userRole)) {
    // Admins get full data
    return data;
  }

  // Watchers get filtered data
  if (Array.isArray(data)) {
    return data.map(item => filterAdminData(item, userRole));
  }

  if (typeof data === 'object' && data !== null) {
    const filtered = { ...data };
    // Remove admin-only fields
    const adminOnlyFields = [
      'adminNotes',
      'internalStatus',
      'transcodeJobId',
      'uploadMetadata',
      'uploadedBy',
      'uploadedAt',
      's3_master_key',
      'filesystem_path',
    ];

    for (const field of adminOnlyFields) {
      delete filtered[field];
    }

    return filtered;
  }

  return data;
};

/**
 * Validate that video streaming URL is local (not external)
 */
export const isLocalStreamUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url, window.location.origin);
    // Accept relative URLs and localhost URLs
    return (
      url.startsWith('/') ||
      urlObj.hostname === 'localhost' ||
      urlObj.hostname === '127.0.0.1' ||
      urlObj.hostname === window.location.hostname
    );
  } catch {
    // If URL parsing fails, accept relative URLs
    return url.startsWith('/');
  }
};

/**
 * Prevent navigation to external URLs (security measure)
 */
export const isLocalUrl = (url: string): boolean => {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  if (url.startsWith('.')) return true;
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === window.location.hostname ||
      urlObj.hostname === 'localhost' ||
      urlObj.hostname === '127.0.0.1'
    );
  } catch {
    return false;
  }
};

/**
 * Safe redirect to local URL only
 */
export const safeRedirect = (url: string, fallback: string = '/'): void => {
  const target = isLocalUrl(url) ? url : fallback;
  if (typeof window !== 'undefined') {
    window.location.href = target;
  }
};

};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  strength: number;
  suggestions: string[];
} => {
  const suggestions: string[] = [];
  let strength = 0;

  if (password.length >= 8) strength++;
  else suggestions.push('Password should be at least 8 characters long');

  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  else suggestions.push('Password should contain both uppercase and lowercase letters');

  if (/\d/.test(password)) strength++;
  else suggestions.push('Password should contain numbers');

  if (/[^a-zA-Z\d]/.test(password)) strength++;
  else suggestions.push('Password should contain special characters');

  return {
    isValid: strength >= 4,
    strength,
    suggestions,
  };
};

/**
 * Sanitize user input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Check for rate limiting headers in response
 */
export const checkRateLimit = (response: Response): {
  isRateLimited: boolean;
  remaining: number;
  resetTime: number;
} => {
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0', 10);
  const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10);

  return {
    isRateLimited: response.status === 429,
    remaining,
    resetTime,
  };
};

/**
 * Generate a random nonce for inline scripts
 */
export const generateNonce = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Hash a string using SHA-256 (for client-side use only)
 */
export const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Create a secure session and clear on tab close
 */
export const setupSecureSession = () => {
  // Clear sensitive data when page unloads
  window.addEventListener('beforeunload', () => {
    // Clear any sensitive session data
    sessionStorage.clear();
  });

  // Detect tab closing and logout
  let isClosing = false;
  window.addEventListener('beforeunload', () => {
    isClosing = true;
  });

  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
      // Tab hidden
      sessionStorage.setItem('tabHidden', 'true');
    } else {
      // Tab visible again
      sessionStorage.removeItem('tabHidden');
    }
  });
};
