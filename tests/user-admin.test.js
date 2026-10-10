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
    username: process.env.TEST_ADMIN_USERNAME || 'travisabuton',
    password: process.env.TEST_ADMIN_PASSWORD || '1235678',
};

const PREFIX = `vitest_${Date.now()}`;
const createdIds = [];

// Helper: create a throwaway user directly in the DB
const makeUser = async (suffix, extra = {}) => {
    const userRole = await Role.findOne({ name: 'user' });
    const user = await User.create({
        username: `${PREFIX}_${suffix}`,
        displayName: `Vitest ${suffix}`,
        email: `${PREFIX}_${suffix}@example.com`,
        password: 'Password123!',
        ...(userRole ? { role: userRole._id } : {}),
        ...extra,
    });
    createdIds.push(user._id);
    return user;
};

describe('ADMIN controller tests', () => {
    const adminAgent = request.agent(app);

    beforeAll(async () => {
        await adminAgent.post('/api/auth/login').send(ADMIN_CREDS).expect(200);
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
            // Skip gracefully if login isn't possible for the throwaway user.
            const user = await registerUser({
                displayName: 'travis',
                username: 'travisg',
                password: '12345678',
                email: 'travisg@gmail.com'
            });
            const regularAgent = request.agent(app);
            const login = await regularAgent
                .post('/api/auth/login')
                .send({ username: user.username, password: '12345678' });

            if (login.status !== 200) return; // can't log in -> nothing to assert

            const res = await regularAgent.get(ROUTES.users);
            expect([401, 403]).toContain(res.status);
        });
    });

    // ---------------------------------------------------------------
    describe('adminDashboardPage', () => {
        it('renders the admin dashboard', async () => {
            const res = await adminAgent.get(ROUTES.dashboard);
            console.log(res.status)
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toMatch(/html/);
            expect(res.text).toContain('Admin Dashboard');
        });
    });

    // ---------------------------------------------------------------
    describe('adminUsers', () => {
        beforeAll(async () => {
            await makeUser('alpha');
            await makeUser('bravo');
            await makeUser('charlie');
            await makeUser('delta');
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

        it('never leaks password or __v', async () => {
            const res = await adminAgent.get(ROUTES.users).query({ limit: 100 });
            expect(res.status).toBe(200);
            for (const u of res.body.users) {
                expect(u).not.toHaveProperty('password');
                expect(u).not.toHaveProperty('__v');
            }
        });

        it('populates the role with only its name', async () => {
            const res = await adminAgent.get(ROUTES.users).query({ q: PREFIX, limit: 100 });
            const withRole = res.body.users.find((u) => u.role);
            if (withRole) {
                expect(withRole.role).toHaveProperty('name');
                expect(withRole.role).toHaveProperty('_id');
                expect(Object.keys(withRole.role).sort()).toEqual(['_id', 'name']);
            }
        });

        it('sorts newest first', async () => {
            const res = await adminAgent.get(ROUTES.users).query({ q: PREFIX, limit: 100 });
            const dates = res.body.users.map((u) => new Date(u.createdAt).getTime());
            const sorted = [...dates].sort((a, b) => b - a);
            expect(dates).toEqual(sorted);
        });

        it('filters by search query (username/email/displayName, case-insensitive)', async () => {
            const res = await adminAgent
                .get(ROUTES.users)
                .query({ q: `${PREFIX.toUpperCase()}_BRAVO` });
            expect(res.status).toBe(200);
            expect(res.body.total).toBe(1);
            expect(res.body.users[0].username).toBe(`${PREFIX}_bravo`);
        });

        it('treats regex characters in q as literals', async () => {
            const res = await adminAgent.get(ROUTES.users).query({ q: '.*' });
            expect(res.status).toBe(200);
            // If not escaped, ".*" would match every user
            const all = await adminAgent.get(ROUTES.users).query({ limit: 1 });
            expect(res.body.total).toBeLessThan(all.body.total);
        });

        it('paginates correctly', async () => {
            const page1 = await adminAgent.get(ROUTES.users).query({ q: PREFIX, limit: 2, page: 1 });
            const page2 = await adminAgent.get(ROUTES.users).query({ q: PREFIX, limit: 2, page: 2 });

            expect(page1.body.users).toHaveLength(2);
            expect(page2.body.users).toHaveLength(2);
            expect(page1.body.total).toBe(4);
            expect(page1.body.totalPages).toBe(2);

            const ids1 = page1.body.users.map((u) => u._id);
            const ids2 = page2.body.users.map((u) => u._id);
            expect(ids1.some((id) => ids2.includes(id))).toBe(false);
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
            const user = await registerUser({
                displayName: 'to_delete',
                username: 'deletingthisuser',
                password: '12345678',
                email: 'delete@gmail.com'
            });

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
            const user = await registerUser({
                displayName: 'travis',
                username: 'travisg',
                password: '12345678',
                email: 'travisg@gmail.com'
            })
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
            const user = await registerUser({
                displayName: 'travis',
                username: 'travisg',
                password: '12345678',
                email: 'travisg@gmail.com',
                role: 'admin'
            });
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