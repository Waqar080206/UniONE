const databaseConfig = require('../config/database');

describe('Database Configuration', () => {
  test('should export database config object', () => {
    expect(databaseConfig).toBeDefined();
    expect(typeof databaseConfig.connect).toBe('function');
    expect(typeof databaseConfig.disconnect).toBe('function');
    expect(typeof databaseConfig.getConnectionStatus).toBe('function');
    expect(typeof databaseConfig.healthCheck).toBe('function');
  });

  test('should have correct initial state', () => {
    const status = databaseConfig.getConnectionStatus();
    expect(status).toHaveProperty('isConnected');
    expect(status).toHaveProperty('readyState');
  });
});