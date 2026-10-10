import request from 'supertest';
import { beforeAll, describe, expect, it, test } from 'vitest';
import app from '../app.js'

describe("BOOKING API Tests", () => {
    // Login once for authentication
    const agent = request.agent(app);

    beforeAll(async () => {
        await agent.post("/api/auth/login")
            .send({
                username: 'travisabuton',
                password: '1235678'
            }).expect(200)
    })

    it('returns the profile for a logged-in user', async () => {
        const res = await agent.get('/api/auth/me');
        console.log(res.body)
        expect(res.status).toBe(200)
    });

    test("User Dashboard Bookings page: 200 Status returns an array of bookings", async () => {
        const res = await agent.get("/trips/user-booking");
        console.log(res.body)
        expect(res.status).toBe(200)
        expect(res.body).instanceOf(Array)
    })
})