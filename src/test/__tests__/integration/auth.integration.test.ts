import request from 'supertest';
import app from '../../app';
import { db } from '../../database/connection';

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    // In a real scenario, you'd run migrations here
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'integration@test.com',
          password: 'Test1234!',
          role: 'patient',
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test1234!',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with correct credentials', async () => {
      // First register
      await request(app).post('/api/v1/auth/register').send({
        email: 'login@test.com',
        password: 'Test1234!',
      });

      // Then login
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@test.com',
          password: 'Test1234!',
        });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
    });
  });
});

