import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

const makeTrip = (index) => ({
  id: `pagination-test-${String(index).padStart(2, '0')}`,
  name: `Pagination Test Trip ${index}`,
  description: 'A trip for testing pagination.',
  region: index % 2 === 0 ? 'test-east' : 'test-west',
  startStation: 'start',
  endStation: 'end',
  duration: '1 hour',
  distance: 10,
  highlights: ['Test highlight'],
  bestSeason: index % 2 === 0 ? 'spring' : 'winter',
  operatingMonths: [1],
  imageUrl: '/images/routes/test.png'
});

describe('GET /api/trips', () => {
  test('starter trips span two pages and all 12 are reachable', async () => {
    const firstPage = await request(app).get('/api/trips?page=1&limit=10');
    const secondPage = await request(app).get('/api/trips?page=2&limit=10');

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.pagination).toMatchObject({
      totalItems: 12,
      totalPages: 2
    });
    expect(firstPage.body.trips).toHaveLength(10);
    expect(secondPage.body.trips).toHaveLength(2);
    expect([
      ...firstPage.body.trips,
      ...secondPage.body.trips
    ]).toHaveLength(12);
  });

  test('returns the first page with pagination and full-catalog filter options', async () => {
    await getDb().collection('trips').insertMany(
      Array.from({ length: 21 }, (_, index) => makeTrip(index))
    );
    const totalItems = await getDb().collection('trips').countDocuments();

    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.body.trips).toHaveLength(10);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems,
      totalPages: Math.ceil(totalItems / 10)
    });
    expect(response.body.filterOptions.regions).toEqual(
      expect.arrayContaining(['test-east', 'test-west'])
    );
    expect(response.body.filterOptions.seasons).toEqual(
      expect.arrayContaining(['spring', 'winter'])
    );
  });

  test('returns distinct pages and an appropriately sized final page', async () => {
    await getDb().collection('trips').insertMany(
      Array.from({ length: 21 }, (_, index) => makeTrip(index))
    );

    const firstPage = await request(app).get('/api/trips?page=1&limit=10');
    const secondPage = await request(app).get('/api/trips?page=2&limit=10');
    const finalPage = await request(app).get(
      `/api/trips?page=${firstPage.body.pagination.totalPages}&limit=10`
    );
    const firstPageIds = firstPage.body.trips.map((trip) => trip.id);
    const secondPageIds = secondPage.body.trips.map((trip) => trip.id);
    const expectedFinalPageSize = firstPage.body.pagination.totalItems % 10 || 10;

    expect(secondPage.body.trips).toHaveLength(10);
    expect(finalPage.body.trips).toHaveLength(expectedFinalPageSize);
    expect(secondPage.body.pagination.page).toBe(2);
    expect(new Set([...firstPageIds, ...secondPageIds]).size).toBe(20);
  });

  test('returns an empty page when the requested page is beyond the results', async () => {
    const response = await request(app).get('/api/trips?page=999&limit=10');

    expect(response.status).toBe(200);
    expect(response.body.trips).toEqual([]);
    expect(response.body.pagination.page).toBe(999);
  });

  test('reports zero pages when the catalog is empty', async () => {
    await getDb().collection('trips').deleteMany({});

    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.body.trips).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(0);
    expect(response.body.pagination.totalPages).toBe(0);
    expect(response.body.filterOptions).toEqual({ regions: [], seasons: [] });
  });

  test.each(['0', '-1', '1.5', 'invalid'])(
    'rejects invalid page value %s',
    async (page) => {
      const response = await request(app).get(`/api/trips?page=${page}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    }
  );

  test.each(['0', '-1', '1.5', 'invalid'])(
    'rejects invalid limit value %s',
    async (limit) => {
      const response = await request(app).get(`/api/trips?limit=${limit}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    }
  );
});