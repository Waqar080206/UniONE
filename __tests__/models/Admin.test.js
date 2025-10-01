const mongoose = require('mongoose');
const Admin = require('../../models/Admin');
const SuperAdmin = require('../../models/SuperAdmin');

// Mock database connection for testing
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Admin Model', () => {
  let mongoServer;
  let superAdmin;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);
  }, 30000); // 30 second timeout

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear the database before each test
    await Admin.deleteMany({});
    await SuperAdmin.deleteMany({});

    // Create a SuperAdmin for testing relationships
    superAdmin = new SuperAdmin({
      username: 'superadmin',
      email: 'superadmin@unione.edu',
      password: 'SuperAdmin123!',
      firstName: 'Super',
      lastName: 'Admin'
    });
    await superAdmin.save();
  });

  describe('Schema Validation', () => {
    test('should create Admin with valid data', async () => {
      const adminData = {
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      };

      const admin = new Admin(adminData);
      const savedAdmin = await admin.save();

      expect(savedAdmin._id).toBeDefined();
      expect(savedAdmin.username).toBe('admin1');
      expect(savedAdmin.email).toBe('admin1@unione.edu');
      expect(savedAdmin.firstName).toBe('John');
      expect(savedAdmin.lastName).toBe('Doe');
      expect(savedAdmin.role).toBe('admin');
      expect(savedAdmin.isActive).toBe(true);
      expect(savedAdmin.isFirstLogin).toBe(true);
      expect(savedAdmin.createdBy.toString()).toBe(superAdmin._id.toString());
      expect(savedAdmin.password).not.toBe('AdminPass123!'); // Should be hashed
    });

    test('should require username', async () => {
      const admin = new Admin({
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      await expect(admin.save()).rejects.toThrow('Username is required');
    });

    test('should require email', async () => {
      const admin = new Admin({
        username: 'admin1',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      await expect(admin.save()).rejects.toThrow('Email is required');
    });

    test('should require password', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      await expect(admin.save()).rejects.toThrow('Password is required');
    });

    test('should require firstName', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      await expect(admin.save()).rejects.toThrow('First name is required');
    });

    test('should require lastName', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        createdBy: superAdmin._id
      });

      await expect(admin.save()).rejects.toThrow('Last name is required');
    });

    test('should require createdBy', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe'
      });

      await expect(admin.save()).rejects.toThrow('Admin must be created by a SuperAdmin');
    });

    test('should validate email format', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'invalid-email',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      await expect(admin.save()).rejects.toThrow('Please enter a valid email');
    });

    test('should enforce minimum username length', async () => {
      const admin = new Admin({
        username: 'ab',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      await expect(admin.save()).rejects.toThrow('Username must be at least 3 characters long');
    });

    test('should enforce minimum password length', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: '1234567',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      await expect(admin.save()).rejects.toThrow('Password must be at least 8 characters long');
    });

    test('should validate createdBy reference exists', async () => {
      const fakeObjectId = new mongoose.Types.ObjectId();
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: fakeObjectId
      });

      await expect(admin.save()).rejects.toThrow('Invalid SuperAdmin reference');
    });
  });

  describe('Unique Constraints', () => {
    test('should enforce unique username', async () => {
      const admin1 = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      const admin2 = new Admin({
        username: 'admin1',
        email: 'admin2@unione.edu',
        password: 'AdminPass123!',
        firstName: 'Jane',
        lastName: 'Smith',
        createdBy: superAdmin._id
      });

      await admin1.save();
      await expect(admin2.save()).rejects.toThrow();
    });

    test('should enforce unique email', async () => {
      const admin1 = new Admin({
        username: 'admin1',
        email: 'admin@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      const admin2 = new Admin({
        username: 'admin2',
        email: 'admin@unione.edu',
        password: 'AdminPass123!',
        firstName: 'Jane',
        lastName: 'Smith',
        createdBy: superAdmin._id
      });

      await admin1.save();
      await expect(admin2.save()).rejects.toThrow();
    });
  });

  describe('Virtual Properties', () => {
    test('should generate fullName virtual', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      expect(admin.fullName).toBe('John Doe');
    });

    test('should check isNewlyCreated virtual', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      await admin.save();
      expect(admin.isNewlyCreated).toBe(true);

      // Simulate old creation date by updating the document in database
      await Admin.updateOne(
        { _id: admin._id },
        { createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } // 25 hours ago
      );
      
      // Reload the admin to get updated createdAt
      const updatedAdmin = await Admin.findById(admin._id);
      expect(updatedAdmin.isNewlyCreated).toBe(false);
    });

    test('should check isLocked virtual', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
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

  describe('Static Methods', () => {
    let admin1, admin2;

    beforeEach(async () => {
      admin1 = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      admin2 = new Admin({
        username: 'admin2',
        email: 'admin2@unione.edu',
        password: 'AdminPass123!',
        firstName: 'Jane',
        lastName: 'Smith',
        createdBy: superAdmin._id,
        isActive: false
      });

      await admin1.save();
      await admin2.save();
    });

    test('findByCreator should return admins created by specific SuperAdmin', async () => {
      const admins = await Admin.findByCreator(superAdmin._id);
      expect(admins).toHaveLength(2);
      expect(admins[0].createdBy.toString()).toBe(superAdmin._id.toString());
      expect(admins[1].createdBy.toString()).toBe(superAdmin._id.toString());
    });

    test('findActive should return only active admins', async () => {
      const activeAdmins = await Admin.findActive();
      expect(activeAdmins).toHaveLength(1);
      expect(activeAdmins[0].username).toBe('admin1');
      expect(activeAdmins[0].isActive).toBe(true);
    });

    test('findWithPagination should return paginated results', async () => {
      const result = await Admin.findWithPagination({ page: 1, limit: 1 });
      expect(result).toHaveLength(1);
    });

    test('findWithPagination should filter by active status', async () => {
      const activeAdmins = await Admin.findWithPagination({ isActive: true });
      expect(activeAdmins).toHaveLength(1);
      expect(activeAdmins[0].isActive).toBe(true);

      const inactiveAdmins = await Admin.findWithPagination({ isActive: false });
      expect(inactiveAdmins).toHaveLength(1);
      expect(inactiveAdmins[0].isActive).toBe(false);
    });

    test('findWithPagination should search by username, email, firstName, or lastName', async () => {
      const searchResults = await Admin.findWithPagination({ search: 'john' });
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].firstName).toBe('John');

      const emailSearchResults = await Admin.findWithPagination({ search: 'admin1@unione.edu' });
      expect(emailSearchResults).toHaveLength(1);
      expect(emailSearchResults[0].email).toBe('admin1@unione.edu');
    });

    test('findWithPagination should populate createdBy field', async () => {
      const admins = await Admin.findWithPagination();
      expect(admins[0].createdBy).toBeDefined();
      expect(admins[0].createdBy.username).toBe('superadmin');
    });

    test('getStatistics should return admin statistics', async () => {
      const stats = await Admin.getStatistics();
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.inactive).toBe(1);
      expect(stats.firstLoginPending).toBe(2);
      expect(stats.recentLogins).toBe(0);
    });

    test('validateAdminData should validate admin creation data', () => {
      const validData = {
        username: 'admin3',
        email: 'admin3@unione.edu',
        firstName: 'Bob',
        lastName: 'Johnson',
        createdBy: superAdmin._id,
        password: 'AdminPass123!'
      };

      const validation1 = Admin.validateAdminData(validData);
      expect(validation1.isValid).toBe(true);
      expect(validation1.errors.length).toBe(0);

      const invalidData = {
        username: 'ab',
        email: 'invalid-email',
        firstName: '',
        lastName: 'Johnson'
      };

      const validation2 = Admin.validateAdminData(invalidData);
      expect(validation2.isValid).toBe(false);
      expect(validation2.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Instance Methods', () => {
    let admin;

    beforeEach(async () => {
      admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });
      await admin.save();
    });

    test('activate should set isActive to true', async () => {
      admin.isActive = false;
      await admin.save();

      await admin.activate();
      expect(admin.isActive).toBe(true);
    });

    test('deactivate should set isActive to false', async () => {
      await admin.deactivate();
      expect(admin.isActive).toBe(false);
    });

    test('completeFirstLogin should set isFirstLogin to false and update lastLogin', async () => {
      expect(admin.isFirstLogin).toBe(true);
      expect(admin.lastLogin).toBeNull();

      await admin.completeFirstLogin();
      expect(admin.isFirstLogin).toBe(false);
      expect(admin.lastLogin).toBeInstanceOf(Date);
    });

    test('getTeacherStats should return teacher statistics', async () => {
      const stats = await admin.getTeacherStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('inactive');
      expect(stats).toHaveProperty('firstLoginPending');
      expect(stats).toHaveProperty('recentLogins');
    });

    test('getTeachers should return teachers created by this admin', async () => {
      const teachers = await admin.getTeachers();
      expect(Array.isArray(teachers)).toBe(true);
    });

    test('updateProfile should update allowed fields', async () => {
      const updateData = {
        firstName: 'Johnny',
        lastName: 'Doe-Smith',
        email: 'johnny.doe@unione.edu'
      };

      await admin.updateProfile(updateData);
      expect(admin.firstName).toBe('Johnny');
      expect(admin.lastName).toBe('Doe-Smith');
      expect(admin.email).toBe('johnny.doe@unione.edu');
    });

    test('updateProfile should validate email format', async () => {
      const updateData = {
        email: 'invalid-email'
      };

      await expect(admin.updateProfile(updateData)).rejects.toThrow('Invalid email format');
    });

    test('changePassword should update password after validating current password', async () => {
      const currentPassword = 'AdminPass123!';
      const newPassword = 'NewAdminPass456!';

      await admin.changePassword(currentPassword, newPassword);

      // Verify new password works
      const isNewPasswordValid = await admin.comparePassword(newPassword);
      expect(isNewPasswordValid).toBe(true);

      // Verify old password no longer works
      const isOldPasswordValid = await admin.comparePassword(currentPassword);
      expect(isOldPasswordValid).toBe(false);

      // Verify isFirstLogin is set to false
      expect(admin.isFirstLogin).toBe(false);
    });

    test('changePassword should reject invalid current password', async () => {
      const wrongCurrentPassword = 'WrongPassword123!';
      const newPassword = 'NewAdminPass456!';

      await expect(admin.changePassword(wrongCurrentPassword, newPassword))
        .rejects.toThrow('Current password is incorrect');
    });

    test('changePassword should validate new password strength', async () => {
      const currentPassword = 'AdminPass123!';
      const weakNewPassword = '123';

      await expect(admin.changePassword(currentPassword, weakNewPassword))
        .rejects.toThrow('Password validation failed');
    });

    test('changePassword should reset login attempts', async () => {
      admin.loginAttempts = 3;
      admin.lockUntil = new Date(Date.now() + 60000);
      await admin.save();

      const currentPassword = 'AdminPass123!';
      const newPassword = 'NewAdminPass456!';

      await admin.changePassword(currentPassword, newPassword);
      expect(admin.loginAttempts).toBe(0);
      expect(admin.lockUntil).toBeUndefined();
    });
  });

  describe('Password Hashing', () => {
    test('should hash password before saving', async () => {
      const plainPassword = 'AdminPass123!';
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: plainPassword,
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      const savedAdmin = await admin.save();
      expect(savedAdmin.password).not.toBe(plainPassword);
      expect(savedAdmin.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should compare password correctly', async () => {
      const plainPassword = 'AdminPass123!';
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: plainPassword,
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      const savedAdmin = await admin.save();

      const isMatch = await savedAdmin.comparePassword(plainPassword);
      expect(isMatch).toBe(true);

      const isWrongMatch = await savedAdmin.comparePassword('wrongpassword');
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('Role Immutability', () => {
    test('should not allow role to be changed after creation', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      await admin.save();
      expect(admin.role).toBe('admin');

      // Try to change role
      admin.role = 'superadmin';
      await admin.save();

      // Role should remain unchanged
      expect(admin.role).toBe('admin');
    });

    test('should not allow createdBy to be changed after creation', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      await admin.save();
      const originalCreatedBy = admin.createdBy.toString();

      // Try to change createdBy
      const fakeObjectId = new mongoose.Types.ObjectId();
      admin.createdBy = fakeObjectId;
      await admin.save();

      // createdBy should remain unchanged
      expect(admin.createdBy.toString()).toBe(originalCreatedBy);
    });
  });

  describe('Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });

      const savedAdmin = await admin.save();

      expect(savedAdmin.createdAt).toBeDefined();
      expect(savedAdmin.updatedAt).toBeDefined();
      expect(savedAdmin.createdAt).toBeInstanceOf(Date);
      expect(savedAdmin.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Login Attempts and Account Locking', () => {
    let admin;

    beforeEach(async () => {
      admin = new Admin({
        username: 'admin1',
        email: 'admin1@unione.edu',
        password: 'AdminPass123!',
        firstName: 'John',
        lastName: 'Doe',
        createdBy: superAdmin._id
      });
      await admin.save();
    });

    test('incLoginAttempts should increment login attempts', async () => {
      expect(admin.loginAttempts).toBe(0);

      await admin.incLoginAttempts();
      const updatedAdmin = await Admin.findById(admin._id);

      expect(updatedAdmin.loginAttempts).toBe(1);
    });

    test('resetLoginAttempts should reset login attempts', async () => {
      admin.loginAttempts = 3;
      await admin.save();

      await admin.resetLoginAttempts();
      const updatedAdmin = await Admin.findById(admin._id);

      expect(updatedAdmin.loginAttempts).toBe(0);
    });

    test('should lock account after max login attempts', async () => {
      // Simulate 4 failed attempts (5th will lock)
      for (let i = 0; i < 4; i++) {
        await admin.incLoginAttempts();
        admin = await Admin.findById(admin._id);
      }

      expect(admin.loginAttempts).toBe(4);
      expect(admin.isLocked).toBe(false);

      // 5th attempt should lock the account
      await admin.incLoginAttempts();
      admin = await Admin.findById(admin._id);

      expect(admin.loginAttempts).toBe(5);
      expect(admin.lockUntil).toBeDefined();
      expect(admin.isLocked).toBe(true);
    });
  });

  describe('Indexes', () => {
    test('should have proper indexes for efficient querying', async () => {
      const indexes = await Admin.collection.getIndexes();
      
      // Check that indexes exist for key fields
      const indexNames = Object.keys(indexes);
      // email and username indexes come from BaseUser schema (unique: true)
      expect(indexNames.some(name => name.includes('email'))).toBe(true);
      expect(indexNames.some(name => name.includes('username'))).toBe(true);
      // These indexes are explicitly defined in Admin schema
      expect(indexNames.some(name => name.includes('createdBy'))).toBe(true);
      expect(indexNames.some(name => name.includes('isActive'))).toBe(true);
      expect(indexNames.some(name => name.includes('createdAt'))).toBe(true);
    });
  });
});