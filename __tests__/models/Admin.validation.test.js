const Admin = require('../../models/Admin');
const SuperAdmin = require('../../models/SuperAdmin');
const mongoose = require('mongoose');

describe('Admin Model Validation (No DB)', () => {
  describe('Schema Structure', () => {
    test('should have correct schema fields', () => {
      const adminSchema = Admin.schema;
      
      // Check that required fields exist
      expect(adminSchema.paths.firstName).toBeDefined();
      expect(adminSchema.paths.lastName).toBeDefined();
      expect(adminSchema.paths.role).toBeDefined();
      expect(adminSchema.paths.createdBy).toBeDefined();
      expect(adminSchema.paths.isFirstLogin).toBeDefined();
      
      // Check field properties
      expect(adminSchema.paths.firstName.isRequired).toBe(true);
      expect(adminSchema.paths.lastName.isRequired).toBe(true);
      expect(adminSchema.paths.createdBy.isRequired).toBe(true);
      expect(adminSchema.paths.role.defaultValue).toBe('admin');
      expect(adminSchema.paths.isFirstLogin.defaultValue).toBe(true);
    });

    test('should have correct indexes defined', () => {
      const adminSchema = Admin.schema;
      const indexes = adminSchema.indexes();
      
      // Check that indexes are defined
      const indexFields = indexes.map(index => Object.keys(index[0])).flat();
      expect(indexFields).toContain('createdBy');
      expect(indexFields).toContain('isActive');
      expect(indexFields).toContain('createdAt');
    });

    test('should have virtual properties defined', () => {
      const adminSchema = Admin.schema;
      
      expect(adminSchema.virtuals.fullName).toBeDefined();
      expect(adminSchema.virtuals.isNewlyCreated).toBeDefined();
      expect(adminSchema.virtuals.isLocked).toBeDefined(); // From BaseUser
    });

    test('should have static methods defined', () => {
      expect(typeof Admin.findByCreator).toBe('function');
      expect(typeof Admin.findActive).toBe('function');
      expect(typeof Admin.findWithPagination).toBe('function');
      expect(typeof Admin.getStatistics).toBe('function');
      expect(typeof Admin.validateAdminData).toBe('function');
    });

    test('should have instance methods defined', () => {
      const admin = new Admin();
      
      expect(typeof admin.activate).toBe('function');
      expect(typeof admin.deactivate).toBe('function');
      expect(typeof admin.completeFirstLogin).toBe('function');
      expect(typeof admin.getTeacherStats).toBe('function');
      expect(typeof admin.getTeachers).toBe('function');
      expect(typeof admin.updateProfile).toBe('function');
      expect(typeof admin.changePassword).toBe('function');
      
      // Methods from BaseUser
      expect(typeof admin.comparePassword).toBe('function');
      expect(typeof admin.incLoginAttempts).toBe('function');
      expect(typeof admin.resetLoginAttempts).toBe('function');
    });
  });

  describe('Virtual Properties (No DB)', () => {
    test('should generate fullName virtual', () => {
      const admin = new Admin({
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(admin.fullName).toBe('John Doe');
    });

    test('should check isNewlyCreated virtual for new document', () => {
      const admin = new Admin({
        firstName: 'John',
        lastName: 'Doe'
      });

      // Set createdAt to current time to simulate a saved document
      admin.createdAt = new Date();
      
      // For a new document, createdAt should be recent
      expect(admin.isNewlyCreated).toBe(true);
    });

    test('should check isLocked virtual', () => {
      const admin = new Admin({
        firstName: 'John',
        lastName: 'Doe'
      });

      expect(admin.isLocked).toBe(false);

      // Set lock until future date
      admin.lockUntil = new Date(Date.now() + 60000); // 1 minute from now
      expect(admin.isLocked).toBe(true);

      // Set lock until past date
      admin.lockUntil = new Date(Date.now() - 60000); // 1 minute ago
      expect(admin.isLocked).toBe(false);
    });
  });

  describe('Static Method Validation', () => {
    test('validateAdminData should validate admin creation data', () => {
      const validData = {
        username: 'admin3',
        email: 'admin3@unione.edu',
        firstName: 'Bob',
        lastName: 'Johnson',
        createdBy: new mongoose.Types.ObjectId(),
        password: 'AdminPass123!'
      };

      const validation1 = Admin.validateAdminData(validData);
      expect(validation1.isValid).toBe(true);
      expect(validation1.errors.length).toBe(0);

      const invalidData = {
        username: 'ab', // Too short
        email: 'invalid-email', // Invalid format
        firstName: '', // Empty
        lastName: 'Johnson'
        // Missing createdBy
      };

      const validation2 = Admin.validateAdminData(invalidData);
      expect(validation2.isValid).toBe(false);
      expect(validation2.errors.length).toBeGreaterThan(0);
      expect(validation2.errors).toContain('Username must be at least 3 characters long');
      expect(validation2.errors).toContain('Valid email is required');
      expect(validation2.errors).toContain('First name is required');
      expect(validation2.errors).toContain('Admin must be created by a SuperAdmin');
    });
  });

  describe('Schema Validation Rules', () => {
    test('should validate required fields', () => {
      const admin = new Admin();
      const validationError = admin.validateSync();
      
      expect(validationError).toBeDefined();
      expect(validationError.errors.username).toBeDefined();
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.firstName).toBeDefined();
      expect(validationError.errors.lastName).toBeDefined();
      expect(validationError.errors.createdBy).toBeDefined();
    });

    test('should validate email format', () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'invalid-email',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: new mongoose.Types.ObjectId()
      });

      const validationError = admin.validateSync();
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.email.message).toContain('Please enter a valid email');
    });

    test('should validate minimum username length', () => {
      const admin = new Admin({
        username: 'ab', // Too short
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: new mongoose.Types.ObjectId()
      });

      const validationError = admin.validateSync();
      expect(validationError.errors.username).toBeDefined();
      expect(validationError.errors.username.message).toContain('Username must be at least 3 characters long');
    });

    test('should validate minimum password length', () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: '1234567', // Too short
        firstName: 'John',
        lastName: 'Doe',
        createdBy: new mongoose.Types.ObjectId()
      });

      const validationError = admin.validateSync();
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.password.message).toContain('Password must be at least 8 characters long');
    });
  });

  describe('Default Values', () => {
    test('should set default values correctly', () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: new mongoose.Types.ObjectId()
      });

      expect(admin.role).toBe('admin');
      expect(admin.isActive).toBe(true);
      expect(admin.isFirstLogin).toBe(true);
      expect(admin.loginAttempts).toBe(0);
      expect(admin.lastLogin).toBeNull();
    });
  });

  describe('Immutable Fields', () => {
    test('role should have immutable property set', () => {
      const adminSchema = Admin.schema;
      const roleField = adminSchema.paths.role;
      
      // Check that the role field has immutable property
      expect(roleField.options.immutable).toBe(true);
      expect(roleField.defaultValue).toBe('admin');
    });

    test('createdBy should have immutable property set', () => {
      const adminSchema = Admin.schema;
      const createdByField = adminSchema.paths.createdBy;
      
      // Check that the createdBy field has immutable property
      expect(createdByField.options.immutable).toBe(true);
      expect(createdByField.isRequired).toBe(true);
    });
  });
});