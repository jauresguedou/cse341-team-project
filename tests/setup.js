import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { closeDb, connectToDb, getDb } from '../src/db/connect.js';
import { initializeDatabase } from '../src/db/initialize.js';
import bcrypt from 'bcrypt'
import Role from '../src/models/role.js';

const connectionString = inject('MONGODB_TEST_URI');

beforeAll(async () => {
  await connectToDb({
    connectionString,
    databaseName: 'kizuna-rail-test'
  });

  // Addition to authentication a user
  const db = getDb();
  await initializeDatabase(db);
  const user = await db.collection("users");
  const roles = await Role.findOne({ name: 'admin' });
  await user.insertOne({
    email: 'travis@gmail.com',
    username: 'travisabuton',
    displayName: 'Travis',
    passwordHash: await bcrypt.hash('12345678', 12),
    role: roles._id
  })
});

beforeEach(async () => {
  const db = getDb();
  await db.dropDatabase();
  await initializeDatabase(db);
});

afterAll(async () => {
  await closeDb();
});
