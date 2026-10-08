# Test plan: Trips API (Feature Set 1)

## Description
Before writing any automated tests for `/api/trips`, we inspected the real
routes, controllers, models, seed data, and auth middleware to decide what
each test must prove. This issue records that plan. It lists the endpoints
to test, the seeded data the tests rely on, the expected status codes and
response fields, the auth requirements, and the database checks for write
operations.

The inspection found that the code does not yet match every requirement in
Feature Set 1. Only two read endpoints exist, and the API has no write routes
and no region, season, or keyword filtering. This plan scopes the work to
what exists and marks the rest as blocked rather than inventing routes.

## Overview
| Area | Status | Summary |
|---|---|---|
| Read tests | Ready | `GET /api/trips` and `GET /api/trips/:id`, using seeded data, plus a not-found case |
| Pagination tests | Ready | Full page, partial last page, page beyond the results, invalid `page` and `limit` |
| Write tests (create, update, delete) | Blocked | No POST, PUT, or DELETE routes for trips exist |
| Region / season / keyword search tests | Blocked | The API reads only `page` and `limit`; `filterOptions` just lists values |

**Test stack:** Vitest + Supertest against the exported Express `app`, using an
in-memory MongoDB (`mongodb-memory-server`). The database is dropped and
re-seeded before every test, so tests are independent.

## Tasks
### Planning
- [ ] Inspect `router.js`, `api-routes.js`, the trips controller, the trips model, and the schema
- [ ] Inspect auth routes and middleware (`requireApiLogin`, `requireApiRole`)
- [ ] Confirm the seed data (12 trips) and the test setup (drop and re-seed per test)
- [ ] Record this plan in the issue
- [ ] Ask the instructor or team whether the write routes and Week 05 filters exist on another branch

### Read tests
- [ ] `GET /api/trips` returns 200 with `trips`, `pagination`, and `filterOptions`
- [ ] `GET /api/trips/alpine-panorama` returns 200 and matches the seeded trip
- [ ] `GET /api/trips/does-not-exist` returns 404 with `{ error: "Trip not found" }`

### Pagination tests
- [ ] Page 1 with limit 10 returns 10 trips and the correct metadata
- [ ] Page 2 with limit 10 returns 2 trips (the partial last page)
- [ ] Page 999 returns an empty `trips` array with status 200
- [ ] Invalid `page` and `limit` values (`0`, `-1`, `1.5`, `abc`) return 400
- [ ] Remove the duplicated pagination test file

### Blocked (waiting on implementation)
- [ ] Write tests: create, update, delete, with 401 and 403 cases and database checks
- [ ] Region filter, season filter, and keyword search tests, including a no-match request
- [ ] Create an admin test account once the write routes exist

### Wrap-up
- [ ] Run the full suite from a clean checkout, more than once
- [ ] Link the test pull request to this issue

## Endpoints under test
| Method | URL | Auth |
|---|---|---|
| GET | /api/trips | Public |
| GET | /api/trips/:id | Public |

## Test data
- Starter seed: 12 trips from `seeds/trips.json`, reset before each test
  (`dropDatabase` + `initializeDatabase`) in an in-memory MongoDB.
- Known trip: `alpine-panorama` (central, autumn, 180 km, 3 highlights).
- Sorted by `id`, so page 1 (limit 10) ends at `sakura-valley`
  and page 2 holds `temple-bell-route` and `winter-wetlands`.
- Roles `user` and `admin` are seeded. No users are seeded.

## Expected results
| Request | Status | Key assertions |
|---|---|---|
| GET /api/trips | 200 | 10 trips; pagination {page:1, limit:10, totalItems:12, totalPages:2}; filterOptions regions and seasons sorted |
| GET /api/trips?page=2&limit=10 | 200 | 2 trips (partial page) |
| GET /api/trips?page=999 | 200 | trips = [], page = 999 |
| GET /api/trips?page=0 / -1 / 1.5 / abc (same for limit) | 400 | `error` property |
| GET /api/trips/alpine-panorama | 200 | all 12 Trip fields match the seed |
| GET /api/trips/does-not-exist | 404 | `{ error: "Trip not found" }` |

## Auth / role / ownership
- Both read endpoints are public. No ownership rules.
- Session-cookie auth (`express-session`), `requireApiRole('admin')` available.

## Write operations (POST/PUT/DELETE)
Implemented on branch `jg-week06-trip-routes` (admin only).
- POST /api/trips: 201; 401 no session; 403 regular user; 400 invalid
  body; 409 duplicate id. Tests read the `trips` collection to confirm the
  new document exists and the count went from 12 to 13.
- PUT /api/trips/:id: 200; partial update; 400 for invalid values, an
  empty update, or a changed id; 404 unknown id. Tests confirm the stored
  trip equals the old trip plus exactly the requested changes.
- DELETE /api/trips/:id: 204; 404 unknown id. Tests confirm the trip and
  its schedules are gone and other trips and schedules are untouched.
- Every rejected request is followed by a database check that nothing changed.
- Test accounts: `tests/helpers/auth.js` creates an admin or user from the
  seeded roles and logs in with a session cookie (`request.agent`).

## Region / season / keyword search
Implemented on `main` (Week 05, PR #32). Existing tests in
`tests/trips.test.js` cover case-insensitive region and season filters,
name/description keyword search, trimmed and whitespace-only search,
combined filters, and filtered pagination.
Remaining gaps being checked: a request with no matches, and a filtered
page with fewer results than the limit.

## Notes
- `dropDatabase` may remove the unique index on `trips.id`; call
  `Trip.syncIndexes()` in any duplicate-id test.
- `limit` has no upper bound.