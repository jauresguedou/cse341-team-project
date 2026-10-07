import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import { loginAs } from './helpers/auth.js';

const trips = () => getDb().collection('trips');
const schedules = () => getDb().collection('schedules');

const TARGET = 'alpine-panorama';
const TARGET_URL = `/api/trips/${TARGET}`;

describe('DELETE /api/trips/:id', () => {
  test('an admin deletes a trip and the database no longer has it', async () => {
    const admin = await loginAs('admin');
    const otherBefore = await trips().findOne({ id: 'coastal-breeze' });
    expect(await trips().findOne({ id: TARGET })).not.toBeNull();

    const response = await admin.delete(TARGET_URL);

    expect(response.status).toBe(204);
    expect(response.text).toBe('');

    expect(await trips().findOne({ id: TARGET })).toBeNull();
    expect(await trips().countDocuments()).toBe(11);
    // Other trips are untouched.
    expect(await trips().findOne({ id: 'coastal-breeze' })).toEqual(otherBefore);
  });

  test("the trip's schedules are deleted too, and other schedules stay", async () => {
    const admin = await loginAs('admin');
    const totalBefore = await schedules().countDocuments();
    const targetBefore = await schedules().countDocuments({ tripId: TARGET });
    // Sanity check: the seed really has schedules for this trip.
    expect(targetBefore).toBeGreaterThan(0);

    await admin.delete(TARGET_URL);

    expect(await schedules().countDocuments({ tripId: TARGET })).toBe(0);
    expect(await schedules().countDocuments()).toBe(totalBefore - targetBefore);
  });

  test('a deleted trip disappears from the read endpoints', async () => {
    const admin = await loginAs('admin');
    await admin.delete(TARGET_URL);

    const single = await request(app).get(TARGET_URL);
    const list = await request(app).get('/api/trips?limit=50');

    expect(single.status).toBe(404);
    expect(single.body).toEqual({ error: 'Trip not found' });
    expect(list.body.pagination.totalItems).toBe(11);
    expect(list.body.trips.map((trip) => trip.id)).not.toContain(TARGET);
  });

  test('deleting the same trip twice returns 404 the second time', async () => {
    const admin = await loginAs('admin');

    const first = await admin.delete(TARGET_URL);
    const second = await admin.delete(TARGET_URL);

    expect(first.status).toBe(204);
    expect(second.status).toBe(404);
    expect(second.body).toEqual({ error: 'Trip not found' });
    expect(await trips().countDocuments()).toBe(11);
  });

  test('rejects a request with no session (401) and deletes nothing', async () => {
    const schedulesBefore = await schedules().countDocuments();

    const response = await request(app).delete(TARGET_URL);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
    expect(await trips().findOne({ id: TARGET })).not.toBeNull();
    expect(await trips().countDocuments()).toBe(12);
    expect(await schedules().countDocuments()).toBe(schedulesBefore);
  });

  test('rejects a regular user (403) and deletes nothing', async () => {
    const user = await loginAs('user');
    const schedulesBefore = await schedules().countDocuments();

    const response = await user.delete(TARGET_URL);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
    expect(await trips().findOne({ id: TARGET })).not.toBeNull();
    expect(await trips().countDocuments()).toBe(12);
    expect(await schedules().countDocuments()).toBe(schedulesBefore);
  });

  test('returns 404 for an unknown id and deletes nothing', async () => {
    const admin = await loginAs('admin');
    const schedulesBefore = await schedules().countDocuments();

    const response = await admin.delete('/api/trips/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Trip not found' });
    expect(await trips().countDocuments()).toBe(12);
    expect(await schedules().countDocuments()).toBe(schedulesBefore);
  });
});