import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../app.js';
import User from '../src/models/user.js';
import Role from '../src/models/role.js';
import { registerUser } from '../src/controllers/auth.js';



const ROUTES = {
    dashboard: '/admin',
    users: '/api/admin/users',
    user: (id) => `/api/admin/users/${id}`,
};

const ADMIN_CREDS = {
    username: 'travisabuton',
    password: '12345678',
};

const PREFIX = `vitest_${Date.now()}`;
const TEST_PASSWORD = 'Password123!';
const createdIds = [];

// Remember created users so afterAll can delete them
const track = (user) => {
    createdIds.push(user._id);
    return user;
};

describe('ADMIN controller tests', () => {
    const adminAgent = request.agent(app);

    beforeAll(async () => {
        const res = await adminAgent.post('/api/auth/login').send(ADMIN_CREDS).expect(200);
    });

    afterAll(async () => {
        await User.deleteMany({ _id: { $in: createdIds } });
    });

    // ---------------------------------------------------------------
    describe('access control', () => {
        it('rejects unauthenticated requests', async () => {
            const res = await request(app).get(ROUTES.users);
            expect([301, 302, 401, 403, 404]).toContain(res.status);
        });

        it('rejects non-admin users', async () => {
            const user = track(
                await registerUser({
                    displayName: 'Vitest regular',
                    username: `${PREFIX}_regular`,
                    email: `${PREFIX}_regular@example.com`,
                    password: TEST_PASSWORD,
                })
            );

            const regularAgent = request.agent(app);
            const login = await regularAgent
                .post('/api/auth/login')
                .send({ username: user.username, password: TEST_PASSWORD });
            expect(login.status).toBe(200);

            const res = await regularAgent.get(ROUTES.users);
            expect([401, 403]).toContain(res.status);
        });
    });

    // ---------------------------------------------------------------
    describe('adminDashboardPage', () => {
        it('renders the admin dashboard', async () => {
            const res = await adminAgent.get(ROUTES.dashboard);
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch(/html/);
            expect(res.text).toContain('Admin Dashboard');
        });
    });

    // ---------------------------------------------------------------
    describe('adminUsers', () => {
        beforeAll(async () => {
            for (const name of ['alpha', 'bravo', 'charlie', 'delta']) {
                track(
                    await registerUser({
                        displayName: `Vitest ${name}`,
                        username: `${PREFIX}_${name}`,
                        email: `${PREFIX}_${name}@example.com`,
                        password: TEST_PASSWORD,
                    })
                );
            }
        });

        it('returns paginated users with the expected shape', async () => {
            const res = await adminAgent.get(ROUTES.users);
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                page: 1,
                limit: 3, // default limit
            });
            expect(Array.isArray(res.body.users)).toBe(true);
            expect(res.body.users.length).toBeLessThanOrEqual(3);
            expect(typeof res.body.total).toBe('number');
            expect(res.body.totalPages).toBe(Math.ceil(res.body.total / res.body.limit));
        });

        // NOTE: fails until the controller selects '-passwordHash' instead of '-password'
        it('never leaks passwordHash or __v', async () => {
            const res = await adminAgent.get(ROUTES.users).query({ limit: 100 });
            expect(res.status).toBe(200);
            for (const u of res.body.users) {
                expect(u).not.toHaveProperty('passwordHash');
                expect(u).not.toHaveProperty('password');
                expect(u).not.toHaveProperty('__v');
            }
        });


        it('sorts newest first', async () => {
            const res = await adminAgent.get(ROUTES.users).query({ q: PREFIX, limit: 100 });
            const dates = res.body.users.map((u) => new Date(u.createdAt).getTime());
            const sorted = [...dates].sort((a, b) => b - a);
            expect(dates).toEqual(sorted);
        });





        it('falls back to page 1 for invalid page values', async () => {
            for (const page of ['abc', '0', '-5']) {
                const res = await adminAgent.get(ROUTES.users).query({ page });
                expect(res.status).toBe(200);
                expect(res.body.page).toBe(1);
            }
        });

        it('clamps limit between 1 and 100', async () => {
            const high = await adminAgent.get(ROUTES.users).query({ limit: 9999 });
            expect(high.body.limit).toBe(100);

            const negative = await adminAgent.get(ROUTES.users).query({ limit: -10 });
            expect(negative.body.limit).toBe(1);

            const junk = await adminAgent.get(ROUTES.users).query({ limit: 'xyz' });
            expect(junk.body.limit).toBe(3); // default
        });

        it('returns an empty list when nothing matches', async () => {
            const res = await adminAgent.get(ROUTES.users).query({ q: `${PREFIX}_nomatch_zzz` });
            expect(res.status).toBe(200);
            expect(res.body.users).toEqual([]);
            expect(res.body.total).toBe(0);
            expect(res.body.totalPages).toBe(0);
        });
    });

    // ---------------------------------------------------------------
    describe('adminDeleteUser', () => {
        it('deletes an existing user', async () => {
            const user = track(
                await registerUser({
                    displayName: 'Vitest to_delete',
                    username: `${PREFIX}_to_delete`,
                    email: `${PREFIX}_to_delete@example.com`,
                    password: TEST_PASSWORD,
                })
            );

            const res = await adminAgent.delete(ROUTES.user(user._id));
            expect(res.status).toBe(200);
            expect(res.body).toEqual({ message: 'User deleted successfully' });

            expect(await User.findById(user._id)).toBeNull();
        });

        it('returns 404 for a valid but non-existent id', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await adminAgent.delete(ROUTES.user(fakeId));
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'User not found' });
        });

        it('returns 500 for a malformed id (current behaviour)', async () => {
            const res = await adminAgent.delete(ROUTES.user('not-a-valid-id'));
            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('error');
        });
    });

    // ---------------------------------------------------------------
    describe('adminUpdateUser', () => {
        it('promotes a user to admin', async () => {
            const user = track(
                await registerUser({
                    displayName: 'Vitest to_promote',
                    username: `${PREFIX}_to_promote`,
                    email: `${PREFIX}_to_promote@example.com`,
                    password: TEST_PASSWORD,
                })
            );
            const adminRole = await Role.findOne({ name: 'admin' });
            expect(adminRole).not.toBeNull();

            const res = await adminAgent.put(ROUTES.user(user._id));
            expect(res.status).toBe(200);
            expect(res.body._id).toBe(user._id.toString());
            expect(res.body.role).toBe(adminRole._id.toString());

            const fromDb = await User.findById(user._id);
            expect(fromDb.role.toString()).toBe(adminRole._id.toString());
        });

        it('is idempotent when the user is already an admin', async () => {
            const user = track(
                await registerUser({
                    displayName: 'Vitest already_admin',
                    username: `${PREFIX}_already_admin`,
                    email: `${PREFIX}_already_admin@example.com`,
                    password: TEST_PASSWORD,
                    roles: 'admin', // registerUser takes "roles", not "role"
                })
            );
            await adminAgent.put(ROUTES.user(user._id)).expect(200);
            const res = await adminAgent.put(ROUTES.user(user._id));
            expect(res.status).toBe(200);
        });

        it('returns 404 for a valid but non-existent id', async () => {
            const fakeId = new mongoose.Types.ObjectId().toString();
            const res = await adminAgent.put(ROUTES.user(fakeId));
            expect(res.status).toBe(404);
            expect(res.body).toEqual({ error: 'User not found' });
        });

        it('returns 400 for a malformed id', async () => {
            const res = await adminAgent.put(ROUTES.user('not-a-valid-id'));
            expect(res.status).toBe(400);
            expect(res.body).toEqual({ error: 'Invalid user id' });
        });
    });
});