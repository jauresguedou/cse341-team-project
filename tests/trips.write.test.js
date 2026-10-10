import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import { loginAs } from './helpers/auth.js';

const trips = () => getDb().collection('trips');

const validTrip = {
  id: 'test-ridge-line',
  name: 'Test Ridge Line',
  description: 'A trip created by the write tests.',
  region: 'central',
  startStation: 'nagoya',
  endStation: 'toyama',
  duration: '2 hours',
  distance: 42,
  highlights: ['Ridge views', 'Tunnels'],
  bestSeason: 'autumn',
  operatingMonths: [9, 10, 11],
  imageUrl: '/images/routes/test-ridge-line.png',
};

const withoutField = (field) => {
  const { [field]: _removed, ...rest } = validTrip;
  return rest;
};

describe('POST /api/trips', () => {
  test('an admin creates a trip and the database contains it', async () => {
    const admin = await loginAs('admin');
    const countBefore = await trips().countDocuments();
    expect(countBefore).toBe(12);
    expect(await trips().findOne({ id: validTrip.id })).toBeNull();

    const response = await admin.post('/api/trips').send(validTrip);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(validTrip);

    const stored = await trips().findOne({ id: validTrip.id });
    expect(stored).toMatchObject(validTrip);
    expect(stored.createdAt).toBeInstanceOf(Date);
    expect(await trips().countDocuments()).toBe(countBefore + 1);
  });

  test('the created trip can be read back through GET /api/trips/:id', async () => {
    const admin = await loginAs('admin');
    await admin.post('/api/trips').send(validTrip);

    const response = await request(app).get(`/api/trips/${validTrip.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject(validTrip);
  });

  test('fields outside the trip schema are not stored', async () => {
    const admin = await loginAs('admin');

    const response = await admin
      .post('/api/trips')
      .send({ ...validTrip, isAdmin: true });

    expect(response.status).toBe(201);
    const stored = await trips().findOne({ id: validTrip.id });
    expect(stored).not.toHaveProperty('isAdmin');
  });

  test('rejects a request with no session (401) and writes nothing', async () => {
    const response = await request(app).post('/api/trips').send(validTrip);

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
    expect(await trips().countDocuments()).toBe(12);
    expect(await trips().findOne({ id: validTrip.id })).toBeNull();
  });

  test('rejects a regular user (403) and writes nothing', async () => {
    const user = await loginAs('user');

    const response = await user.post('/api/trips').send(validTrip);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
    expect(await trips().countDocuments()).toBe(12);
    expect(await trips().findOne({ id: validTrip.id })).toBeNull();
  });

  test('rejects a duplicate id (409) and leaves the original untouched', async () => {
    const admin = await loginAs('admin');

    const response = await admin
      .post('/api/trips')
      .send({ ...validTrip, id: 'alpine-panorama', name: 'Imposter' });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('error');
    expect(await trips().countDocuments()).toBe(12);
    const original = await trips().findOne({ id: 'alpine-panorama' });
    expect(original.name).toBe('Alpine Panorama Express');
  });

  test.each([
    ['a missing id', withoutField('id')],
    ['a missing name', withoutField('name')]
    ['a blank name', { ...validTrip, name: ' ' }],
    ['an unknown bestSeason', { ...validTrip, bestSeason: 'monsoon' }],
    ['empty highlights', { ...validTrip, highlights: [] }],
    ['operatingMonths outside 1 to 12', { ...validTrip, operatingMonths: [0, 13] }],
    ['a negative distance', { ...validTrip, distance: -5 }],
    ['a non-numeric distance', { ...validTrip, distance: 'far' }],
    ['an empty body', {}],
  ])('rejects %s (400) and writes nothing', async (_label, body) => {
    const admin = await loginAs('admin');

    const response = await admin.post('/api/trips').send(body);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(await trips().countDocuments()).toBe(12);
  });
});