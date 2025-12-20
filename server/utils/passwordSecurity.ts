import zod from 'zod';

/**
 * Password Security Utilities
 * Implements comprehensive password strength validation
 */

export const passwordSchema = zod.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export interface PasswordStrength {
  score: number; // 0-4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  feedback: string[];
  passed: boolean;
}

/**
 * Evaluate password strength
 * @param password - The password to evaluate
 * @returns PasswordStrength object with score and feedback
 */
export function evaluatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length < 8) feedback.push('Password should be at least 8 characters');

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Include both uppercase and lowercase letters');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Include at least one number');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Include at least one special character (!@#$%^&*)');
  }

  // Common patterns to avoid
  const commonPatterns = [
    /^12345/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i,
    /welcome/i,
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common words and patterns');
  }

  // Sequential characters
  if (/(?:abc|bcd|cde|123|234|345)/i.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid sequential characters');
  }

  // Determine label
  let label: PasswordStrength['label'];
  if (score === 0) label = 'Very Weak';
  else if (score === 1) label = 'Weak';
  else if (score === 2) label = 'Fair';
  else if (score === 3) label = 'Good';
  else label = 'Strong';

  const passed = score >= 3;

  return {
    score: Math.min(score, 4),
    label,
    feedback,
    passed,
  };
}

/**
 * Validate password against security requirements
 * @param password - The password to validate
 * @returns Validation result with success status and errors
 */
export function validatePassword(password: string): { success: boolean; errors: string[] } {
  const result = passwordSchema.safeParse(password);
  
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map(e => e.message),
    };
  }

  const strength = evaluatePasswordStrength(password);
  
  if (!strength.passed) {
    return {
      success: false,
      errors: ['Password is too weak', ...strength.feedback],
    };
  }

  return {
    success: true,
    errors: [],
  };
}

/**
 * Check if password has been compromised (placeholder for Have I Been Pwned API)
 * In production, integrate with https://haveibeenpwned.com/API/v3
 */
export async function checkPasswordBreach(password: string): Promise<boolean> {
  // TODO: Implement Have I Been Pwned API integration
  // For now, just check against common passwords
  const commonPasswords = [
    'password', 'password123', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
  ];
  
  return commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  );
}
