import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import seedTrips from '../src/db/seeds/trips.json' with { type: 'json' };

const TRIP_FIELDS = [
  'id',
  'name',
  'description',
  'region',
  'startStation',
  'endStation',
  'duration',
  'distance',
  'highlights',
  'bestSeason',
  'operatingMonths',
  'imageUrl',
];

describe('GET /api/trips (read)', () => {
  test('returns 200 JSON with trips, pagination, and filterOptions', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toHaveProperty('trips');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body).toHaveProperty('filterOptions');
  });

  test('every returned trip has all the documented fields', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.body.trips.length).toBeGreaterThan(0);
    for (const trip of response.body.trips) {
      for (const field of TRIP_FIELDS) {
        expect(trip).toHaveProperty(field);
      }
    }
  });

  test('returns the seeded trips sorted by id', async () => {
    const response = await request(app).get('/api/trips?limit=12');
    const returnedIds = response.body.trips.map((trip) => trip.id);
    const expectedIds = seedTrips.map((trip) => trip.id).sort();

    expect(returnedIds).toEqual(expectedIds);
    expect(returnedIds[0]).toBe('alpine-panorama');
    expect(returnedIds[11]).toBe('winter-wetlands');
  });

  test('filterOptions lists the seeded regions and seasons, sorted', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.body.filterOptions.regions).toEqual([
      'central',
      'hokkaido',
      'kansai',
      'northern',
    ]);
    expect(response.body.filterOptions.seasons).toEqual([
      'autumn',
      'spring',
      'summer',
      'winter',
    ]);
  });
});

describe('GET /api/trips/:id (read)', () => {
  test('returns the known seeded trip alpine-panorama', async () => {
    const response = await request(app).get('/api/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 'alpine-panorama',
      name: 'Alpine Panorama Express',
      region: 'central',
      startStation: 'nagoya',
      endStation: 'toyama',
      distance: 180,
      bestSeason: 'autumn',
    });
    expect(response.body.highlights).toHaveLength(3);
  });

    test.each(seedTrips.map((trip) => [trip.id, trip]))(
    'returns seeded trip %s exactly as seeded',
    async (id, seedTrip) => {
      // The MongoDB driver adds _id to the seed objects during insertMany,
      // so compare only the fields that come from trips.json.
      const { _id, ...expectedFields } = seedTrip;

      const response = await request(app).get(`/api/trips/${id}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(expectedFields);
      expect(typeof response.body._id).toBe('string');
    }
  );

  test('returns 404 with an error message for an unknown id', async () => {
    const response = await request(app).get('/api/trips/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Trip not found' });
  });
});