const PasswordService = require('../../services/passwordService');
const bcrypt = require('bcryptjs');

describe('PasswordService', () => {
  describe('hashPassword', () => {
    test('should hash password with default salt rounds', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await PasswordService.hashPassword(password);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$12\$/); // bcrypt hash pattern with 12 rounds
      expect(typeof hashedPassword).toBe('string');
    });

    test('should hash password with custom salt rounds', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await PasswordService.hashPassword(password, 10);

      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$10\$/); // bcrypt hash pattern with 10 rounds
    });

    test('should throw error for empty password', async () => {
      await expect(PasswordService.hashPassword('')).rejects.toThrow('Password is required');
      await expect(PasswordService.hashPassword(null)).rejects.toThrow('Password is required');
      await expect(PasswordService.hashPassword(undefined)).rejects.toThrow('Password is required');
    });

    test('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await PasswordService.hashPassword(password);
      const hash2 = await PasswordService.hashPassword(password);

      expect(hash1).not.toBe(hash2); // Different salts should produce different hashes
    });
  });

  describe('comparePassword', () => {
    test('should return true for matching passwords', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await PasswordService.hashPassword(password);
      
      const isMatch = await PasswordService.comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    test('should return false for non-matching passwords', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hashedPassword = await PasswordService.hashPassword(password);
      
      const isMatch = await PasswordService.comparePassword(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });

    test('should return false for empty inputs', async () => {
      const hashedPassword = await PasswordService.hashPassword('TestPassword123!');
      
      expect(await PasswordService.comparePassword('', hashedPassword)).toBe(false);
      expect(await PasswordService.comparePassword(null, hashedPassword)).toBe(false);
      expect(await PasswordService.comparePassword('password', '')).toBe(false);
      expect(await PasswordService.comparePassword('password', null)).toBe(false);
    });
  });

  describe('generateSecurePassword', () => {
    test('should generate password with default length', () => {
      const password = PasswordService.generateSecurePassword();
      
      expect(password).toHaveLength(12);
      expect(typeof password).toBe('string');
    });

    test('should generate password with custom length', () => {
      const length = 16;
      const password = PasswordService.generateSecurePassword(length);
      
      expect(password).toHaveLength(length);
    });

    test('should generate password with required character types', () => {
      const password = PasswordService.generateSecurePassword(12);
      
      expect(password).toMatch(/[a-z]/); // lowercase
      expect(password).toMatch(/[A-Z]/); // uppercase
      expect(password).toMatch(/\d/); // number
      expect(password).toMatch(/[@$!%*?&]/); // special character
    });

    test('should generate different passwords each time', () => {
      const password1 = PasswordService.generateSecurePassword();
      const password2 = PasswordService.generateSecurePassword();
      
      expect(password1).not.toBe(password2);
    });
  });

  describe('generateTemporaryPassword', () => {
    test('should generate temporary password with correct length', () => {
      const tempPassword = PasswordService.generateTemporaryPassword();
      
      expect(tempPassword).toHaveLength(10);
      expect(typeof tempPassword).toBe('string');
    });

    test('should generate different temporary passwords', () => {
      const temp1 = PasswordService.generateTemporaryPassword();
      const temp2 = PasswordService.generateTemporaryPassword();
      
      expect(temp1).not.toBe(temp2);
    });
  });

  describe('validatePasswordStrength', () => {
    test('should validate strong password', () => {
      const strongPassword = 'MyStr0ngK3y!@#';
      const result = PasswordService.validatePasswordStrength(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBeDefined();
      expect(result.strength.score).toBeGreaterThan(70);
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        '123',
        'password',
        'abc123',
        'PASSWORD',
        '12345678'
      ];

      weakPasswords.forEach(password => {
        const result = PasswordService.validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should require minimum length', () => {
      const shortPassword = 'Aa1!';
      const result = PasswordService.validatePasswordStrength(shortPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    test('should require lowercase letter', () => {
      const noLowercase = 'PASSWORD123!';
      const result = PasswordService.validatePasswordStrength(noLowercase);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    test('should require uppercase letter', () => {
      const noUppercase = 'password123!';
      const result = PasswordService.validatePasswordStrength(noUppercase);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    test('should require number', () => {
      const noNumber = 'Password!';
      const result = PasswordService.validatePasswordStrength(noNumber);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    test('should require special character', () => {
      const noSpecial = 'Password123';
      const result = PasswordService.validatePasswordStrength(noSpecial);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character (@$!%*?&)');
    });

    test('should reject common patterns', () => {
      const commonPatterns = [
        'password123!', // Contains "password"
        'admin123!', // Contains "admin"
        'qwerty123!', // Contains "qwerty"
        'Aaaa123!@#' // Four repeated characters
      ];

      commonPatterns.forEach(password => {
        const result = PasswordService.validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.includes('common patterns') || error.includes('Password contains common patterns')
        )).toBe(true);
      });
    });

    test('should handle empty password', () => {
      const result = PasswordService.validatePasswordStrength('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    test('should reject overly long passwords', () => {
      const longPassword = 'A'.repeat(129) + '1!';
      const result = PasswordService.validatePasswordStrength(longPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password cannot exceed 128 characters');
    });
  });

  describe('calculatePasswordStrength', () => {
    test('should calculate strength for strong password', () => {
      const strongPassword = 'MyVeryStr0ng&SecureK3y!';
      const result = PasswordService.calculatePasswordStrength(strongPassword);
      
      expect(result.score).toBeGreaterThan(70);
      expect(['Good', 'Strong']).toContain(result.level);
    });

    test('should calculate strength for weak password', () => {
      const weakPassword = '123456';
      const result = PasswordService.calculatePasswordStrength(weakPassword);
      
      expect(result.score).toBeLessThan(30);
      expect(result.level).toBe('Very Weak');
    });

    test('should handle empty password', () => {
      const result = PasswordService.calculatePasswordStrength('');
      
      expect(result.score).toBe(0);
      expect(result.level).toBe('Very Weak');
    });

    test('should penalize common patterns', () => {
      const commonPassword = 'password123';
      const result = PasswordService.calculatePasswordStrength(commonPassword);
      
      expect(result.score).toBeLessThan(50);
    });
  });

  describe('generateResetToken', () => {
    test('should generate reset token', () => {
      const token = PasswordService.generateResetToken();
      
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(token).toMatch(/^[a-f0-9]+$/); // hex pattern
    });

    test('should generate different tokens', () => {
      const token1 = PasswordService.generateResetToken();
      const token2 = PasswordService.generateResetToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('hashResetToken', () => {
    test('should hash reset token', () => {
      const token = 'sample-reset-token';
      const hashedToken = PasswordService.hashResetToken(token);
      
      expect(typeof hashedToken).toBe('string');
      expect(hashedToken).toHaveLength(64); // SHA256 = 64 hex characters
      expect(hashedToken).toMatch(/^[a-f0-9]+$/); // hex pattern
      expect(hashedToken).not.toBe(token);
    });

    test('should generate same hash for same token', () => {
      const token = 'sample-reset-token';
      const hash1 = PasswordService.hashResetToken(token);
      const hash2 = PasswordService.hashResetToken(token);
      
      expect(hash1).toBe(hash2);
    });
  });
});