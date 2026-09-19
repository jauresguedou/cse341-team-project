# Feature Set 1: Trips Specification

## 1. Feature Overview

The Trips feature provides a browsable catalog of scenic railway trips. Users can:

- View all available trips on `/trips`.
- Filter trips by region and best season in the browser.
- Open a trip detail page at `/trips/:tripId`.
- View the trip route information, operating months, and schedules.
- Continue from a schedule to the existing booking flow.

Trip catalog data is loaded from the `/api/trips` web service. The list page must use client-side hydration: EJS renders the page shell and a reusable template, and JavaScript fetches the trip data and populates the page. EJS must not iterate over trip records on the list page.

This feature is read-only for trip definitions. Booking is a related existing workflow and is outside the JSON API described here.

## 2. Required Deliverables

### Mongoose and model layer

- Create the Trip schema in `src/models/schemas/trips.js`.
- Create these Mongoose-backed functions in `src/models/trips.js`:
  - `getTripById(id)`
  - `getAllTrips()`
- Both functions must query through the Trip Mongoose model and return query results, preferably as plain objects using `.lean()`.

### API layer

- Create `getTripById` and `getAllTrips` controller functions in `src/controllers/trips.js`.
- Controllers must return JSON and appropriate status codes for success, missing records, and server/database failures.
- Define and document these routes in `src/routes/api-routes.js`, including Swagger documentation:
  - `GET /api/trips`
  - `GET /api/trips/{id}`

### EJS and browser layer

- Refactor the list-page controller out of `src/routes/list.js` into a named function in `src/controllers/trips.js`. It should only render the list page and must not query trips.
- Refactor the details-page controller out of `src/routes/details.js` into a named function in `src/controllers/trips.js`. It must use the new `getTripById` model function.
- Wire the named EJS controllers through `src/routes/ejs-routes.js`.
- Update `src/views/trips/list.ejs` (the assignment text may refer to this as `src/view/trips/list.ejs`) so the trip cards are populated by client-side JavaScript from `/api/trips`.

## 3. Data Model

### 3.1 `trips` collection

The `Trip` Mongoose schema represents one scenic route.

| Field | Type | Required | Constraints / purpose |
| --- | --- | --- | --- |
| `id` | String | yes | Unique application identifier, trimmed. Example: `alpine-panorama`. |
| `name` | String | yes | Display name, trimmed. |
| `description` | String | yes | Route description, trimmed. |
| `region` | String | yes | Region used by the client-side filter. |
| `startStation` | String | yes | Station identifier for the starting point. |
| `endStation` | String | yes | Station identifier for the endpoint. |
| `duration` | String | yes | Display duration such as `4.5 hours`. |
| `distance` | Number | yes | Non-negative distance in kilometres. |
| `highlights` | `[String]` | yes | Must contain at least one highlight. |
| `bestSeason` | String | yes | Enum: `spring`, `summer`, `autumn`, or `winter`. |
| `operatingMonths` | `[Number]` | yes | At least one month; every value must be from 1 through 12. |
| `imageUrl` | String | yes | Public route image path, trimmed. |
| `createdAt` | Date | generated | Mongoose timestamp. |
| `updatedAt` | Date | generated | Mongoose timestamp. |

Schema options must enable timestamps. The application identifier `id` is distinct from MongoDB's generated `_id` and is the identifier used by the API.

Example document:

```json
{
  "id": "alpine-panorama",
  "name": "Alpine Panorama Express",
  "description": "Journey through the Japanese Alps with stunning mountain views and traditional villages.",
  "region": "central",
  "startStation": "nagoya",
  "endStation": "toyama",
  "duration": "4.5 hours",
  "distance": 180,
  "highlights": [
    "Mount Tateyama views",
    "Hida River gorge",
    "Traditional alpine villages"
  ],
  "bestSeason": "autumn",
  "operatingMonths": [4, 5, 6, 7, 8, 9, 10, 11],
  "imageUrl": "/images/routes/alpine-panorama.png"
}
```

### 3.2 Related collections

The API only returns trips, but the details and booking pages use related collections:

#### `schedules`

```json
{
  "id": 1,
  "tripId": "alpine-panorama",
  "departureTime": "08:30",
  "arrivalTime": "13:00",
  "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "status": true
}
```

- `tripId` references `trips.id`.
- `daysOfWeek` contains the recurring operating weekdays.
- `status` indicates whether the schedule is active.

#### `stations`

Stations are referenced by `trips.startStation` and `trips.endStation`.

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | String | Application identifier. |
| `name` | String | Display name. |
| `prefecture` | String | Administrative area. |
| `region` | String | Station region. |
| `facilities` | `[String]` | Available station facilities. |
| `description` | String | Station description. |

#### `ticketClasses`

Used by the existing booking page to calculate prices from trip distance.

| Field | Type | Purpose |
| --- | --- | --- |
| `class` | String | Class identifier such as `standard`, `premium`, or `first`. |
| `name` | String | Display name. |
| `pricePerKm` | Number | Price multiplier in yen per kilometre. |
| `amenities` | `[String]` | Included amenities. |
| `description` | String | Class description. |

#### `confirmations`

Created by the existing booking flow. It is not exposed by the Trips API. A confirmation contains a generated `id`, `createdAt`, selected schedule/trip information, ticket class, selected day, and passenger information.

## 4. Model Functions

### `getAllTrips()`

- Query the `Trip` model with no filter.
- Return all trips as plain JavaScript objects.
- Do not query the MongoDB driver directly from this function.

Conceptual query:

```js
return Trip.find({}).lean();
```

### `getTripById(id)`

- Query the `Trip` model by the application-level `id` field.
- Return one plain trip object or `null` when no matching trip exists.
- Do not query by MongoDB `_id` unless the API contract is changed explicitly.

Conceptual query:

```js
return Trip.findOne({ id }).lean();
```

## 5. API Contract

All API responses use JSON. No request body is required for either endpoint.

### 5.1 Get all trips

`GET /api/trips`

Request:

- Body: none.
- Query parameters: none required or supported for this feature set.

Success: `200 OK`

Response body: a top-level JSON array of Trip objects.

```json
[
  {
    "id": "alpine-panorama",
    "name": "Alpine Panorama Express",
    "description": "Journey through the Japanese Alps with stunning mountain views and traditional villages.",
    "region": "central",
    "startStation": "nagoya",
    "endStation": "toyama",
    "duration": "4.5 hours",
    "distance": 180,
    "highlights": ["Mount Tateyama views"],
    "bestSeason": "autumn",
    "operatingMonths": [4, 5, 6, 7, 8, 9, 10, 11],
    "imageUrl": "/images/routes/alpine-panorama.png"
  }
]
```

Failure: `500 Internal Server Error`

```json
{ "error": "Failed to fetch trips" }
```

The response must be an array, not an object such as `{ "trips": [...] }`, because the list-page JavaScript maps directly over the response.

### 5.2 Get one trip

`GET /api/trips/{id}`

Path parameter:

- `id`: required string application identifier, such as `alpine-panorama`.

Success: `200 OK`

Response body: one Trip object using the schema above.

Not found: `404 Not Found`

```json
{ "error": "Trip not found" }
```

Failure: `500 Internal Server Error`

```json
{ "error": "Failed to fetch trip" }
```

### 5.3 Swagger requirements

`src/routes/api-routes.js` must document:

- Both endpoint paths and HTTP methods.
- The `id` path parameter.
- `200`, `404` where applicable, and `500` responses.
- A reusable `Trip` schema with all required fields.
- Correct property types, including numeric `distance`, numeric `operatingMonths` items, and string-array `highlights` items.

## 6. EJS and Hydration Behavior

### List page: `GET /trips`

1. The EJS controller renders `trips/list` with the page title only.
2. The page contains loading, error, and empty list states.
3. The page contains a template for one trip card, but no EJS loop over trip data.
4. Client-side JavaScript calls `fetch('/api/trips')` after the DOM is ready.
5. JavaScript creates region and season filter options from the response.
6. JavaScript renders trip name, region, stations, duration, distance, season, description, highlights, and a `/trips/{id}` details link.
7. API failure hides loading and displays a user-facing error state.

### Details page: `GET /trips/:tripId`

1. The EJS controller calls `getTripById(tripId)` from the model layer.
2. It loads schedules where `schedule.tripId` equals the requested trip identifier.
3. It renders the trip and schedules.
4. A missing trip must produce a controlled not-found response rather than dereferencing `null`.
5. The generic `/:tripId` route must remain after more specific booking and confirmation routes.

### Route wiring

`src/routes/ejs-routes.js` should import the named EJS controller functions from `src/controllers/trips.js` and register:

- `GET /` for the trip list page.
- `GET /:tripId` for trip details.

The API routes remain mounted through the application router and must not be mixed with the EJS route paths.

## 7. Test Plan

Tests should use Vitest and Supertest with the test database setup already used by the project. Each test should begin with restored seed data.

### Schema and model tests

- A valid seeded trip satisfies the schema.
- Missing each required field causes schema validation failure.
- Duplicate `id` values are rejected by the unique constraint.
- `distance` rejects negative values.
- `bestSeason` rejects values outside the four allowed seasons.
- Empty `highlights` is rejected.
- `operatingMonths` rejects empty arrays and values below 1 or above 12.
- `getAllTrips()` returns all seeded trips as plain objects.
- `getTripById('alpine-panorama')` returns the expected trip.
- `getTripById('missing-trip')` returns `null`.

### API tests

- `GET /api/trips` returns `200`.
- `GET /api/trips` has an `application/json` content type.
- The response body is an array with the expected seeded trip count.
- The response contains a known trip with the expected `id`, `name`, and `region`.
- A trip inserted into the test database appears in `GET /api/trips`.
- `GET /api/trips/alpine-panorama` returns `200` and the correct object.
- `GET /api/trips/does-not-exist` returns `404` and `{ "error": "Trip not found" }`.
- A model/database failure produces `500` and the documented error response.
- API responses do not contain unrelated passenger or confirmation data.

### EJS and browser checks

- `GET /trips` returns `200` and renders the list page shell.
- The list EJS file contains no loop over trips and no server-provided trip collection.
- Browser JavaScript requests `/api/trips` and renders one card per returned trip.
- Region filtering leaves only matching trips.
- Season filtering leaves only matching trips.
- Each details link uses the corresponding trip `id`.
- API failure displays the error state.
- `GET /trips/:tripId` uses the Mongoose model function and renders matching schedules.
- An unknown trip details request returns a controlled `404` response.

### Regression checks

- Existing `/api/trains` tests still pass.
- `npm test` passes.
- `npm run lint` passes.
- The application starts with the normal development command and the seeded trip catalog is visible.

## 8. Implementation Notes and Acceptance Criteria

- Keep changes focused on the Trips feature; do not change the public API response shape without updating the client and Swagger documentation together.
- Use the existing project conventions: ES modules, Express controllers, Mongoose models, EJS views, and Vitest/Supertest tests.
- Keep application `id` values stable because they are used in links and collection references.
- Use `.lean()` for read-only model queries so API responses are serializable plain objects.
- Ensure errors from asynchronous controllers are caught and converted to the documented response rather than becoming unhandled rejections.
- Do not trust MongoDB `_id` as the public trip identifier.
- The feature is complete when all required files and functions exist, the list page is hydrated through `/api/trips`, the EJS routes use the named controllers, Swagger describes both endpoints accurately, and the test plan passes.
