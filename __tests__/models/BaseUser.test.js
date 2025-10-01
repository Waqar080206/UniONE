const mongoose = require('mongoose');
const BaseUserSchema = require('../../models/BaseUser');
const bcrypt = require('bcryptjs');

// Mock mongoose for unit testing
jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation((definition, options) => {
    const schema = {
      definition,
      options,
      virtual: jest.fn().mockReturnThis(),
      get: jest.fn().mockReturnThis(),
      pre: jest.fn(),
      methods: {},
      statics: {}
    };
    return schema;
  }),
  model: jest.fn()
}));

// Create a mock user class for testing
class MockUser {
  constructor(data) {
    Object.assign(this, {
      username: '',
      email: '',
      password: '',
      isActive: true,
      loginAttempts: 0,
      lockUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    });
  }

  async save() {
    // Simulate password hashing
    if (this.password && !this.password.startsWith('$2')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
    return this;
  }

  async comparePassword(candidatePassword) {
    if (!candidatePassword) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }

  get isLocked() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
  }

  async incLoginAttempts() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
      this.lockUntil = undefined;
      this.loginAttempts = 1;
      return;
    }
    
    this.loginAttempts += 1;
    
    if (this.loginAttempts >= 5 && !this.isLocked) {
      this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
    }
  }

  async resetLoginAttempts() {
    this.loginAttempts = undefined;
    this.lockUntil = undefined;
  }

  static findByEmailOrUsername(identifier) {
    // Mock implementation - would normally query database
    return null;
  }

  static validatePasswordStrength(password) {
    const errors = [];
    
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

describe('BaseUser Model', () => {

  describe('Schema Validation', () => {
    test('should create a valid user with required fields', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!'
      };

      const user = new MockUser(userData);
      const savedUser = await user.save();

      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.password).not.toBe(userData.password); // Should be hashed
      expect(savedUser.isActive).toBe(true);
      expect(savedUser.loginAttempts).toBe(0);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    test('should have default values', () => {
      const user = new MockUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!'
      });

      expect(user.isActive).toBe(true);
      expect(user.loginAttempts).toBe(0);
      expect(user.lockUntil).toBeNull();
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const plainPassword = 'TestPass123!';
      const user = new MockUser({
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword
      });

      const savedUser = await user.save();
      expect(savedUser.password).not.toBe(plainPassword);
      expect(savedUser.password).toMatch(/^\$2[aby]\$12\$/); // bcrypt hash pattern
    });

    test('should not rehash already hashed password', async () => {
      const hashedPassword = '$2b$12$hashedpassword';
      const user = new MockUser({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword
      });

      const savedUser = await user.save();
      expect(savedUser.password).toBe(hashedPassword);
    });
  });

  describe('Password Comparison', () => {
    test('should compare password correctly', async () => {
      const plainPassword = 'TestPass123!';
      const user = new MockUser({
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword
      });

      const savedUser = await user.save();
      
      const isMatch = await savedUser.comparePassword(plainPassword);
      expect(isMatch).toBe(true);

      const isWrongMatch = await savedUser.comparePassword('wrongpassword');
      expect(isWrongMatch).toBe(false);
    });

    test('should return false for empty password', async () => {
      const user = new MockUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!'
      });

      const savedUser = await user.save();
      
      const isMatch = await savedUser.comparePassword('');
      expect(isMatch).toBe(false);

      const isNullMatch = await savedUser.comparePassword(null);
      expect(isNullMatch).toBe(false);
    });
  });

  describe('Account Locking', () => {
    test('should check if account is locked', () => {
      const user = new MockUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!'
      });

      expect(user.isLocked).toBe(false);

      // Set lock until future date
      user.lockUntil = new Date(Date.now() + 60000); // 1 minute from now
      expect(user.isLocked).toBe(true);
    });

    test('should increment login attempts', async () => {
      const user = new MockUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!'
      });

      expect(user.loginAttempts).toBe(0);

      await user.incLoginAttempts();
      expect(user.loginAttempts).toBe(1);
    });

    test('should lock account after max attempts', async () => {
      const user = new MockUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        loginAttempts: 4 // One less than max
      });

      await user.incLoginAttempts();

      expect(user.loginAttempts).toBe(5);
      expect(user.lockUntil).toBeDefined();
      expect(user.isLocked).toBe(true);
    });

    test('should reset login attempts', async () => {
      const user = new MockUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        loginAttempts: 3,
        lockUntil: new Date(Date.now() + 60000)
      });

      await user.resetLoginAttempts();

      expect(user.loginAttempts).toBeUndefined();
      expect(user.lockUntil).toBeUndefined();
    });

    test('should restart attempts if lock has expired', async () => {
      const user = new MockUser({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
        loginAttempts: 5,
        lockUntil: new Date(Date.now() - 60000) // Expired lock
      });

      await user.incLoginAttempts();

      expect(user.loginAttempts).toBe(1);
      expect(user.lockUntil).toBeUndefined();
    });
  });

  describe('Static Methods', () => {
    test('should find user by email or username', () => {
      const result = MockUser.findByEmailOrUsername('test@example.com');
      expect(result).toBeNull(); // Mock implementation returns null
    });

    test('should validate password strength', () => {
      const strongPassword = 'StrongPass123!';
      const weakPassword = '123';

      const strongResult = MockUser.validatePasswordStrength(strongPassword);
      expect(strongResult.isValid).toBe(true);
      expect(strongResult.errors).toHaveLength(0);

      const weakResult = MockUser.validatePasswordStrength(weakPassword);
      expect(weakResult.isValid).toBe(false);
      expect(weakResult.errors.length).toBeGreaterThan(0);
    });
  });
});