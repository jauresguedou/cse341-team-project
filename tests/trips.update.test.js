import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import { loginAs } from './helpers/auth.js';

const trips = () => getDb().collection('trips');

const TARGET = 'alpine-panorama';
const TARGET_URL = `/api/trips/${TARGET}`;
const findTarget = () => trips().findOne({ id: TARGET });

describe('PUT /api/trips/:id', () => {
  test('an admin updates some fields and the database changes only those', async () => {
    const admin = await loginAs('admin');
    const before = await findTarget();
    const otherBefore = await trips().findOne({ id: 'coastal-breeze' });
    const changes = {
      name: 'Alpine Panorama Express (Updated)',
      distance: 190,
      highlights: ['Updated highlight'],
    };

    const response = await admin.put(TARGET_URL).send(changes);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: TARGET, ...changes });

    // The stored trip is the old trip plus exactly these changes.
    const after = await findTarget();
    expect(after).toMatchObject({ ...before, ...changes });
    expect(after.updatedAt).toBeInstanceOf(Date);

    // No trip was added or removed, and other trips are untouched.
    expect(await trips().countDocuments()).toBe(12);
    expect(await trips().findOne({ id: 'coastal-breeze' })).toEqual(otherBefore);
  });

  test('the update is visible through GET /api/trips/:id', async () => {
    const admin = await loginAs('admin');
    await admin.put(TARGET_URL).send({ bestSeason: 'winter', operatingMonths: [12, 1] });

    const response = await request(app).get(TARGET_URL);

    expect(response.status).toBe(200);
    expect(response.body.bestSeason).toBe('winter');
    expect(response.body.operatingMonths).toEqual([12, 1]);
  });

  test('fields outside the trip schema are ignored and _id never changes', async () => {
    const admin = await loginAs('admin');
    const before = await findTarget();

    const response = await admin.put(TARGET_URL).send({
      name: 'Renamed',
      isAdmin: true,
      _id: '000000000000000000000000',
    });

    expect(response.status).toBe(200);
    const after = await findTarget();
    expect(after.name).toBe('Renamed');
    expect(after._id).toEqual(before._id);
    expect(after).not.toHaveProperty('isAdmin');
  });

  test('sending the same id as the URL is allowed', async () => {
    const admin = await loginAs('admin');

    const response = await admin.put(TARGET_URL).send({ id: TARGET, distance: 181 });

    expect(response.status).toBe(200);
    expect((await findTarget()).distance).toBe(181);
  });

  test('a different id in the body is rejected (400) and nothing changes', async () => {
    const admin = await loginAs('admin');
    const before = await findTarget();

    const response = await admin
      .put(TARGET_URL)
      .send({ id: 'something-else', name: 'Should not be saved' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Trip id cannot be changed' });
    expect(await findTarget()).toEqual(before);
    expect(await trips().findOne({ id: 'something-else' })).toBeNull();
  });

  test('rejects a request with no session (401) and changes nothing', async () => {
    const before = await findTarget();

    const response = await request(app).put(TARGET_URL).send({ name: 'Hacked' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
    expect(await findTarget()).toEqual(before);
  });

  test('rejects a regular user (403) and changes nothing', async () => {
    const user = await loginAs('user');
    const before = await findTarget();

    const response = await user.put(TARGET_URL).send({ name: 'Hacked' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
    expect(await findTarget()).toEqual(before);
  });

  test('returns 404 for an unknown id and creates nothing', async () => {
    const admin = await loginAs('admin');

    const response = await admin
      .put('/api/trips/does-not-exist')
      .send({ name: 'Ghost trip' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Trip not found' });
    expect(await trips().countDocuments()).toBe(12);
    expect(await trips().findOne({ id: 'does-not-exist' })).toBeNull();
  });

  test.each([
    ['an unknown bestSeason', { bestSeason: 'monsoon' }],
    ['empty highlights', { highlights: [] }],
    ['operatingMonths outside 1 to 12', { operatingMonths: [0, 13] }],
    ['a negative distance', { distance: -5 }],
    ['a non-numeric distance', { distance: 'far' }],
    ['a blank name', { name: '   ' }],
  ])('rejects %s (400) and leaves the trip unchanged', async (_label, body) => {
    const admin = await loginAs('admin');
    const before = await findTarget();

    const response = await admin.put(TARGET_URL).send(body);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(await findTarget()).toEqual(before);
  });

  test.each([
    ['an empty body', {}],
    ['only unknown fields', { isAdmin: true }],
  ])('rejects %s (400) because there is nothing to update', async (_label, body) => {
    const admin = await loginAs('admin');
    const before = await findTarget();

    const response = await admin.put(TARGET_URL).send(body);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'No valid trip fields to update' });
    expect(await findTarget()).toEqual(before);
  });
});