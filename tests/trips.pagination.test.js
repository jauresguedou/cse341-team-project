import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import seedTrips from '../src/db/seeds/trips.json' with { type: 'json' };

const SORTED_IDS = seedTrips.map((trip) => trip.id).sort();

const getIds = (response) => response.body.trips.map((trip) => trip.id);

describe('GET /api/trips pagination (seeded data)', () => {
  test('page 1 with limit 10 returns the first ten trips by id', async () => {
    const response = await request(app).get('/api/trips?page=1&limit=10');

    expect(response.status).toBe(200);
    expect(getIds(response)).toEqual(SORTED_IDS.slice(0, 10));
    expect(getIds(response).at(-1)).toBe('sakura-valley');
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 12,
      totalPages: 2,
    });
  });

  test('page 2 with limit 10 returns only the two remaining trips', async () => {
    const response = await request(app).get('/api/trips?page=2&limit=10');

    expect(response.status).toBe(200);
    expect(getIds(response)).toEqual(['temple-bell-route', 'winter-wetlands']);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 10,
      totalItems: 12,
      totalPages: 2,
    });
  });

  test('limit 5 splits the catalog into pages of 5, 5, and 2', async () => {
    const pageOne = await request(app).get('/api/trips?page=1&limit=5');
    const pageTwo = await request(app).get('/api/trips?page=2&limit=5');
    const pageThree = await request(app).get('/api/trips?page=3&limit=5');

    expect(getIds(pageOne)).toEqual(SORTED_IDS.slice(0, 5));
    expect(getIds(pageTwo)).toEqual(SORTED_IDS.slice(5, 10));
    expect(getIds(pageThree)).toEqual(['temple-bell-route', 'winter-wetlands']);

    // The last page is smaller than the limit.
    expect(pageThree.body.trips.length).toBeLessThan(5);
    expect(pageThree.body.pagination).toEqual({
      page: 3,
      limit: 5,
      totalItems: 12,
      totalPages: 3,
    });
  });

  test('walking every page returns each trip exactly once', async () => {
    const collected = [];

    for (let page = 1; page <= 3; page += 1) {
      const response = await request(app).get(`/api/trips?page=${page}&limit=5`);
      collected.push(...getIds(response));
    }

    expect(collected).toHaveLength(12);
    expect(new Set(collected).size).toBe(12);
    expect(collected).toEqual(SORTED_IDS);
  });

  test('a limit larger than the catalog returns everything on one page', async () => {
    const response = await request(app).get('/api/trips?page=1&limit=50');

    expect(response.status).toBe(200);
    expect(getIds(response)).toEqual(SORTED_IDS);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 50,
      totalItems: 12,
      totalPages: 1,
    });
  });

  test('limit 1 returns a single trip per page', async () => {
    const response = await request(app).get('/api/trips?page=12&limit=1');

    expect(response.status).toBe(200);
    expect(getIds(response)).toEqual(['winter-wetlands']);
    expect(response.body.pagination.totalPages).toBe(12);
  });

  test('page and limit default to 1 and 10 when omitted', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(10);
    expect(response.body.trips).toHaveLength(10);
  });

  test('a page past the end is empty but totalPages stays correct', async () => {
    const response = await request(app).get('/api/trips?page=4&limit=5');

    expect(response.status).toBe(200);
    expect(response.body.trips).toEqual([]);
    expect(response.body.pagination).toEqual({
      page: 4,
      limit: 5,
      totalItems: 12,
      totalPages: 3,
    });
  });

  test.each(['page', 'limit'])(
    'rejects an empty %s value with 400',
    async (param) => {
      const response = await request(app).get(`/api/trips?${param}=`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Page and limit must be positive integers',
      });
    }
  );
});