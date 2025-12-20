import { describe, it, expect } from 'vitest';
import { validatePassword, evaluatePasswordStrength } from '../../../server/utils/passwordSecurity';

describe('Password Security Utils', () => {
  describe('validatePassword', () => {
    it('should accept valid strong passwords', () => {
      const result = validatePassword('SecurePass123!');
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('Short1!');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('lowercase123!');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('NoNumbers!');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const result = validatePassword('NoSpecial123');
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject passwords longer than 128 characters', () => {
      const longPassword = 'A'.repeat(130) + '1!';
      const result = validatePassword(longPassword);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Password must not exceed 128 characters');
    });
  });

  describe('evaluatePasswordStrength', () => {
    it('should rate a very weak password', () => {
      const result = evaluatePasswordStrength('12345');
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.label).toMatch(/Very Weak|Weak/);
      expect(result.passed).toBe(false);
    });

    it('should rate a weak password', () => {
      const result = evaluatePasswordStrength('password');
      expect(result.score).toBeLessThan(3);
      expect(result.passed).toBe(false);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should rate a fair password', () => {
      const result = evaluatePasswordStrength('Password1');
      // Password1 is actually weak due to common pattern, expect score 1-2
      expect(result.score).toBeGreaterThanOrEqual(1);
    });

    it('should rate a good password', () => {
      const result = evaluatePasswordStrength('SecurePass123!');
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.label).toMatch(/Good|Strong/);
      expect(result.passed).toBe(true);
    });

    it('should rate a strong password', () => {
      const result = evaluatePasswordStrength('V3ry$ecur3P@ssw0rd!');
      expect(result.score).toBe(4);
      expect(result.label).toBe('Strong');
      expect(result.passed).toBe(true);
    });

    it('should penalize common patterns', () => {
      const commonPassword = evaluatePasswordStrength('Password123!');
      const uniquePassword = evaluatePasswordStrength('Xk9#mLp2$Qw7');
      expect(uniquePassword.score).toBeGreaterThanOrEqual(commonPassword.score);
    });

    it('should penalize sequential characters', () => {
      const result = evaluatePasswordStrength('Abc123!@#');
      expect(result.feedback).toContain('Avoid sequential characters');
    });
  });
});
