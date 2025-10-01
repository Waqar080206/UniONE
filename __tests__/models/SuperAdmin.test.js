const mongoose = require('mongoose');
const SuperAdmin = require('../../models/SuperAdmin');

// Mock database connection for testing
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('SuperAdmin Model', () => {
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await SuperAdmin.deleteMany({});
  });

  describe('Schema Validation', () => {
    test('should create SuperAdmin with valid data', async () => {
      const superAdminData = {
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      };

      const superAdmin = new SuperAdmin(superAdminData);
      const savedSuperAdmin = await superAdmin.save();

      expect(savedSuperAdmin._id).toBeDefined();
      expect(savedSuperAdmin.username).toBe('superadmin');
      expect(savedSuperAdmin.email).toBe('superadmin@unione.edu');
      expect(savedSuperAdmin.firstName).toBe('Super');
      expect(savedSuperAdmin.lastName).toBe('Admin');
      expect(savedSuperAdmin.role).toBe('superadmin');
      expect(savedSuperAdmin.isActive).toBe(true);
      expect(savedSuperAdmin.password).not.toBe('SuperAdmin123!'); // Should be hashed
    });

    test('should require username', async () => {
      const superAdmin = new SuperAdmin({
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      await expect(superAdmin.save()).rejects.toThrow('Username is required');
    });

    test('should require email', async () => {
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      await expect(superAdmin.save()).rejects.toThrow('Email is required');
    });

    test('should require password', async () => {
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        firstName: 'Super',
        lastName: 'Admin'
      });

      await expect(superAdmin.save()).rejects.toThrow('Password is required');
    });

    test('should require firstName', async () => {
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        lastName: 'Admin'
      });

      await expect(superAdmin.save()).rejects.toThrow('First name is required');
    });

    test('should require lastName', async () => {
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super'
      });

      await expect(superAdmin.save()).rejects.toThrow('Last name is required');
    });

    test('should validate email format', async () => {
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'invalid-email',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      await expect(superAdmin.save()).rejects.toThrow('Please enter a valid email');
    });

    test('should enforce minimum username length', async () => {
      const superAdmin = new SuperAdmin({
        username: 'ab',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      await expect(superAdmin.save()).rejects.toThrow('Username must be at least 3 characters long');
    });

    test('should enforce minimum password length', async () => {
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: '1234567',
        firstName: 'Super',
        lastName: 'Admin'
      });

      await expect(superAdmin.save()).rejects.toThrow('Password must be at least 8 characters long');
    });
  });

  describe('Unique Constraints', () => {
    test('should enforce unique username', async () => {
      const superAdmin1 = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin1@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      const superAdmin2 = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin2@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      await superAdmin1.save();
      await expect(superAdmin2.save()).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      const superAdmin1 = new SuperAdmin({
        username: 'superadmin1',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      const superAdmin2 = new SuperAdmin({
        username: 'superadmin2',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      await superAdmin1.save();
      await expect(superAdmin2.save()).rejects.toThrow();
    });

    test('should allow only one SuperAdmin account', async () => {
      const superAdmin1 = new SuperAdmin({
        username: 'superadmin1',
        email: 'superadmin1@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      const superAdmin2 = new SuperAdmin({
        username: 'superadmin2',
        email: 'superadmin2@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      await superAdmin1.save();
      await expect(superAdmin2.save()).rejects.toThrow('Only one SuperAdmin account is allowed');
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const plainPassword = 'SuperAdmin123!';
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: plainPassword,
        firstName: 'Super',
        lastName: 'Admin'
      });

      const savedSuperAdmin = await superAdmin.save();
      expect(savedSuperAdmin.password).not.toBe(plainPassword);
      expect(savedSuperAdmin.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should compare password correctly', async () => {
      const plainPassword = 'SuperAdmin123!';
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: plainPassword,
        firstName: 'Super',
        lastName: 'Admin'
      });

      const savedSuperAdmin = await superAdmin.save();

      const isMatch = await savedSuperAdmin.comparePassword(plainPassword);
      expect(isMatch).toBe(true);

      const isWrongMatch = await savedSuperAdmin.comparePassword('wrongpassword');
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('Virtual Properties', () => {
    test('should generate fullName virtual', async () => {
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      expect(superAdmin.fullName).toBe('Super Admin');
    });

    test('should check isLocked virtual', async () => {
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      expect(superAdmin.isLocked).toBe(false);

      // Set lock until future date
      superAdmin.lockUntil = new Date(Date.now() + 60000); // 1 minute from now
      expect(superAdmin.isLocked).toBe(true);

      // Set lock until past date
      superAdmin.lockUntil = new Date(Date.now() - 60000); // 1 minute ago
      expect(superAdmin.isLocked).toBe(false);
    });
  });

  describe('Static Methods', () => {
    test('getSuperAdmin should return the SuperAdmin', async () => {
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      await superAdmin.save();

      const foundSuperAdmin = await SuperAdmin.getSuperAdmin();
      expect(foundSuperAdmin).toBeTruthy();
      expect(foundSuperAdmin.username).toBe('superadmin');
    });

    test('getSuperAdmin should return null if no SuperAdmin exists', async () => {
      const foundSuperAdmin = await SuperAdmin.getSuperAdmin();
      expect(foundSuperAdmin).toBeNull();
    });

    test('initializeDefault should create SuperAdmin with default credentials', async () => {
      const superAdmin = await SuperAdmin.initializeDefault();

      expect(superAdmin.username).toBe('superadmin');
      expect(superAdmin.email).toBe('superadmin@unione.edu');
      expect(superAdmin.firstName).toBe('Super');
      expect(superAdmin.lastName).toBe('Admin');
      expect(superAdmin.role).toBe('superadmin');
    });

    test('initializeDefault should create SuperAdmin with custom credentials', async () => {
      const customCredentials = {
        username: 'customadmin',
        email: 'custom@unione.edu',
        password: 'CustomPass123!',
        firstName: 'Custom',
        lastName: 'Admin'
      };

      const superAdmin = await SuperAdmin.initializeDefault(customCredentials);

      expect(superAdmin.username).toBe('customadmin');
      expect(superAdmin.email).toBe('custom@unione.edu');
      expect(superAdmin.firstName).toBe('Custom');
      expect(superAdmin.lastName).toBe('Admin');
    });

    test('initializeDefault should throw error if SuperAdmin already exists', async () => {
      await SuperAdmin.initializeDefault();
      await expect(SuperAdmin.initializeDefault()).rejects.toThrow('SuperAdmin already exists');
    });

    test('validatePasswordStrength should validate password requirements', () => {
      const weakPassword = '123';
      const validation1 = SuperAdmin.validatePasswordStrength(weakPassword);
      expect(validation1.isValid).toBe(false);
      expect(validation1.errors.length).toBeGreaterThan(0);

      const strongPassword = 'SuperAdmin123!';
      const validation2 = SuperAdmin.validatePasswordStrength(strongPassword);
      expect(validation2.isValid).toBe(true);
      expect(validation2.errors.length).toBe(0);
    });
  });

  describe('Instance Methods', () => {
    let superAdmin;

    beforeEach(async () => {
      superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });
      await superAdmin.save();
    });

    test('getSystemOverview should return system statistics', async () => {
      const overview = await superAdmin.getSystemOverview();

      expect(overview).toHaveProperty('admins');
      expect(overview).toHaveProperty('teachers');
      expect(overview).toHaveProperty('lastUpdated');
      expect(overview.admins).toHaveProperty('total');
      expect(overview.admins).toHaveProperty('active');
      expect(overview.admins).toHaveProperty('recentLogins');
    });

    test('validateAdminData should validate admin creation data', () => {
      const validData = {
        username: 'admin1',
        email: 'admin1@unione.edu',
        firstName: 'John',
        lastName: 'Doe',
        password: 'AdminPass123!'
      };

      const validation1 = superAdmin.validateAdminData(validData);
      expect(validation1.isValid).toBe(true);
      expect(validation1.errors.length).toBe(0);

      const invalidData = {
        username: 'ab',
        email: 'invalid-email',
        firstName: '',
        lastName: 'Doe'
      };

      const validation2 = superAdmin.validateAdminData(invalidData);
      expect(validation2.isValid).toBe(false);
      expect(validation2.errors.length).toBeGreaterThan(0);
    });

    test('incLoginAttempts should increment login attempts', async () => {
      expect(superAdmin.loginAttempts).toBe(0);

      await superAdmin.incLoginAttempts();
      const updatedSuperAdmin = await SuperAdmin.findById(superAdmin._id);

      expect(updatedSuperAdmin.loginAttempts).toBe(1);
    });

    test('resetLoginAttempts should reset login attempts', async () => {
      superAdmin.loginAttempts = 3;
      await superAdmin.save();

      await superAdmin.resetLoginAttempts();
      const updatedSuperAdmin = await SuperAdmin.findById(superAdmin._id);

      // After $unset, the field returns to its default value (0)
      expect(updatedSuperAdmin.loginAttempts).toBe(0);
    });
  });

  describe('Role Immutability', () => {
    test('should not allow role to be changed after creation', async () => {
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      await superAdmin.save();
      expect(superAdmin.role).toBe('superadmin');

      // Try to change role
      superAdmin.role = 'admin';
      await superAdmin.save();

      // Role should remain unchanged
      expect(superAdmin.role).toBe('superadmin');
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const superAdmin = new SuperAdmin({
        username: 'superadmin',
        email: 'superadmin@unione.edu',
        password: 'SuperAdmin123!',
        firstName: 'Super',
        lastName: 'Admin'
      });

      const savedSuperAdmin = await superAdmin.save();

      expect(savedSuperAdmin.createdAt).toBeDefined();
      expect(savedSuperAdmin.updatedAt).toBeDefined();
      expect(savedSuperAdmin.createdAt).toBeInstanceOf(Date);
      expect(savedSuperAdmin.updatedAt).toBeInstanceOf(Date);
    });
  });
});