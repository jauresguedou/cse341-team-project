import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

const getIds = (response) => response.body.trips.map((trip) => trip.id);

const ALL_REGIONS = ['central', 'hokkaido', 'kansai', 'northern'];
const ALL_SEASONS = ['autumn', 'spring', 'summer', 'winter'];

describe('GET /api/trips filters (seeded data)', () => {
  test('region filter returns exactly the matching trips', async () => {
    const response = await request(app).get('/api/trips?region=kansai');

    expect(response.status).toBe(200);
    expect(getIds(response)).toEqual([
      'cedar-valley',
      'romantic-gorge',
      'sakura-valley',
      'temple-bell-route',
    ]);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 4,
      totalPages: 1,
    });
  });

  test('season filter returns exactly the matching trips', async () => {
    const response = await request(app).get('/api/trips?season=summer');

    expect(response.status).toBe(200);
    expect(getIds(response)).toEqual([
      'coastal-breeze',
      'harbor-wind-express',
      'lake-echo',
    ]);
    expect(response.body.pagination.totalItems).toBe(3);
  });

  test('region and season together narrow the results', async () => {
    const response = await request(app).get(
      '/api/trips?region=kansai&season=autumn'
    );

    expect(getIds(response)).toEqual(['romantic-gorge', 'temple-bell-route']);
    expect(response.body.pagination.totalItems).toBe(2);
  });

  test('keyword search matches names and descriptions', async () => {
    // "gorge" is in the name of gorge-explorer and in the description
    // ("gorges") of romantic-gorge.
    const response = await request(app).get('/api/trips?search=gorge');

    expect(response.status).toBe(200);
    expect(getIds(response)).toEqual(['gorge-explorer', 'romantic-gorge']);
  });

  test('a filtered last page holds fewer results than the limit', async () => {
    const pageOne = await request(app).get('/api/trips?region=central&limit=3');
    const pageTwo = await request(app).get(
      '/api/trips?region=central&limit=3&page=2'
    );

    expect(getIds(pageOne)).toEqual([
      'alpine-panorama',
      'gorge-explorer',
      'lake-echo',
    ]);
    expect(getIds(pageTwo)).toEqual(['mountain-spring-journey']);
    expect(pageTwo.body.trips.length).toBeLessThan(3);
    expect(pageTwo.body.pagination).toEqual({
      page: 2,
      limit: 3,
      totalItems: 4,
      totalPages: 2,
    });
  });

  test('a page past the end of a filtered result is empty', async () => {
    const response = await request(app).get('/api/trips?region=central&page=5');

    expect(response.status).toBe(200);
    expect(response.body.trips).toEqual([]);
    expect(response.body.pagination.totalItems).toBe(4);
  });
});

describe('GET /api/trips requests with no matches', () => {
  test.each([
    ['an unknown region', { region: 'atlantis' }],
    ['an unknown season', { season: 'monsoon' }],
    ['a search with no hits', { search: 'zzzz' }],
    ['valid filters that do not overlap', { region: 'hokkaido', season: 'summer' }],
    ['a region prefix (exact match only)', { region: 'cent' }],
    ['regex characters in search (".*")', { search: '.*' }],
    ['a regex character that would be invalid ("(")', { search: '(' }],
  ])('returns an empty 200 result for %s', async (_label, query) => {
    const response = await request(app).get('/api/trips').query(query);

    expect(response.status).toBe(200);
    expect(response.body.trips).toEqual([]);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
    });
    // Filter options always describe the full catalog.
    expect(response.body.filterOptions).toEqual({
      regions: ALL_REGIONS,
      seasons: ALL_SEASONS,
    });
  });
});

describe('GET /api/trips filter input handling', () => {
  test('trims whitespace around a filter value', async () => {
    const response = await request(app)
      .get('/api/trips')
      .query({ region: '  central  ' });

    expect(response.body.pagination.totalItems).toBe(4);
  });

  test('an empty filter value is ignored', async () => {
    const response = await request(app).get('/api/trips?region=&season=');

    expect(response.status).toBe(200);
    expect(response.body.pagination.totalItems).toBe(12);
  });

  test.each(['region', 'season', 'search'])(
    'rejects a repeated %s parameter with 400',
    async (name) => {
      const response = await request(app).get(`/api/trips?${name}=a&${name}=b`);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Region, season, and search must be strings',
      });
    }
  );

  test('invalid pagination is still rejected when filters are present', async () => {
    const response = await request(app).get('/api/trips?region=central&page=0');

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});