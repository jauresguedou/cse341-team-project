import { describe, expect, test } from 'vitest';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../app.js';
import Role from '../src/models/role.js';
import User from '../src/models/user.js';

const regularUser = {
  displayName: 'Jordan Lee',
  username: 'jordanlee',
  email: 'jordan@example.com',
  password: 'correct-horse-battery',
};

describe('authentication', () => {
  test('rejects unauthenticated API requests with JSON 401', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  test('registers a user with a bcrypt password hash', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(regularUser);

    expect(response.status).toBe(201);
    expect(response.body.user).toEqual(expect.objectContaining({
      username: regularUser.username,
      role: 'user',
    }));
    expect(response.body.user).not.toHaveProperty('passwordHash');

    const savedUser = await User.findOne({ username: regularUser.username }).select('+passwordHash');
    expect(savedUser.passwordHash).not.toBe(regularUser.password);
    expect(await bcrypt.compare(regularUser.password, savedUser.passwordHash)).toBe(true);
  });

  test('logs in and exposes only the safe session user', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(regularUser);

    const loginResponse = await agent.post('/api/auth/login').send({
      username: regularUser.username,
      password: regularUser.password,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user).toEqual(expect.objectContaining({
      username: regularUser.username,
      role: 'user',
    }));
    expect(loginResponse.body.user).not.toHaveProperty('passwordHash');

    const currentUserResponse = await agent.get('/api/auth/me');
    expect(currentUserResponse.status).toBe(200);
    expect(currentUserResponse.body.user.username).toBe(regularUser.username);
  });

  test('protects the admin page for regular users and allows admins', async () => {
    const adminRole = await Role.findOne({ name: 'admin' });
    await request(app).post('/api/auth/register').send(regularUser);
    await User.create({
      ...regularUser,
      username: 'adminuser',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash(regularUser.password, 12),
      role: adminRole._id,
    });

    const regularAgent = request.agent(app);
    await regularAgent.post('/api/auth/login').send({
      username: regularUser.username,
      password: regularUser.password,
    });
    const regularResponse = await regularAgent.get('/admin');
    expect(regularResponse.status).toBe(403);
    expect(regularResponse.text).toContain('Forbidden');

    const adminAgent = request.agent(app);
    await adminAgent.post('/api/auth/login').send({
      username: 'adminuser',
      password: regularUser.password,
    });
    const adminResponse = await adminAgent.get('/admin');
    expect(adminResponse.status).toBe(200);
    expect(adminResponse.text).toContain('Welcome to the Admin Dashboard');
  });
});