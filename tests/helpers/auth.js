import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../../app.js';
import Role from '../../src/models/role.js';
import User from '../../src/models/user.js';

export const TEST_PASSWORD = 'correct-horse-battery';

// Creates a user with the given seeded role ("admin" or "user"), logs in
// through the real login route, and returns a supertest agent that keeps
// the session cookie for later requests.
export async function loginAs(roleName) {
  const role = await Role.findOne({ name: roleName });
  if (!role) {
    throw new Error(`Role "${roleName}" is not seeded`);
  }

  const username = `${roleName}tester`;
  await User.create({
    displayName: `Test ${roleName}`,
    username,
    email: `${username}@example.com`,
    // Cost 4 is the minimum for bcrypt, so tests stay fast.
    passwordHash: await bcrypt.hash(TEST_PASSWORD, 4),
    role: role._id,
  });

  const agent = request.agent(app);
  const response = await agent
    .post('/api/auth/login')
    .send({ username, password: TEST_PASSWORD });

  if (response.status !== 200) {
    throw new Error(`Test login failed for ${roleName}: ${response.status}`);
  }

  return agent;
}