import DOMPurify from 'isomorphic-dompurify';

/**
 * Input Sanitization Utilities
 * Prevents XSS, SQL injection, and other injection attacks
 */

/**
 * Sanitize HTML input to prevent XSS attacks
 * @param dirty - Potentially unsafe HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Sanitize plain text - remove all HTML tags
 * @param input - Input string
 * @returns String with all HTML removed
 */
export function sanitizePlainText(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

/**
 * Sanitize email address
 * @param email - Email address to sanitize
 * @returns Sanitized and validated email
 * @throws Error if email is invalid
 */
export function sanitizeEmail(email: string): string {
  const sanitized = sanitizePlainText(email.trim().toLowerCase());
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }
  
  return sanitized;
}

/**
 * Sanitize URL
 * @param url - URL to sanitize
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeURL(url: string): string | null {
  try {
    const sanitized = sanitizePlainText(url.trim());
    const urlObj = new URL(sanitized);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    return urlObj.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitize filename
 * @param filename - Filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  const basename = filename.replace(/^.*[\\\/]/, '');
  
  // Remove dangerous characters
  const safe = basename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  return safe.substring(0, 255);
}

/**
 * Sanitize database search query
 * Prevents SQL injection in LIKE queries
 * @param query - Search query string
 * @returns Sanitized query
 */
export function sanitizeSearchQuery(query: string): string {
  // Remove SQL wildcards and special characters
  return query
    .replace(/[%_\\]/g, '\\$&')
    .trim()
    .substring(0, 200);
}

/**
 * Sanitize object recursively
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizePlainText(value) as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item =>
        typeof item === 'string' ? sanitizePlainText(item) : item
      ) as T[keyof T];
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

/**
 * Escape special characters for safe display
 * @param input - Input string
 * @returns Escaped string
 */
export function escapeSpecialChars(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize phone number
 * @param phone - Phone number string
 * @returns Sanitized phone number or null if invalid
 */
export function sanitizePhoneNumber(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if it's a valid length (7-15 digits)
  if (digits.length < 7 || digits.length > 15) {
    return null;
  }
  
  return digits;
}

/**
 * Sanitize user input for display
 * Prevents XSS while preserving some formatting
 * @param input - User input string
 * @returns Sanitized string safe for display
 */
export function sanitizeUserInput(input: string): string {
  return sanitizeHTML(input);
}
