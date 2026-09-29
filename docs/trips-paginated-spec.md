# Feature Set 2: Paginated Trips Specification

## 1. Feature Overview

Extend the `/trips` catalog so it loads and updates its trip list through client-side JavaScript calling `GET /api/trips`. The API returns a page of trips, and the page provides pagination, region and season filters, and keyword search across trip names and descriptions.

This specification builds on [trips-feature-spec.md](trips-feature-spec.md). Where that document describes `GET /api/trips` as returning all trips in a top-level array, this specification supersedes that contract for the paginated list endpoint. `GET /api/trips/{id}` and the trip details and booking workflows are unchanged.

The work is divided into two pull requests so pagination can be delivered and verified before adding filters and search.

## 2. Pull Request 1: Paginated Trip List

### 2.1 API requirements

Update `GET /api/trips` to accept these query parameters:

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | Positive integer | `1` | One-based page number. |
| `limit` | Positive integer | `10` | Maximum trips in the page. The `/trips` page requests 10. |

The endpoint must apply pagination in the data query rather than loading all trips and slicing them in browser code. The response is a JSON object:

```json
{
  "trips": [
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
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 23,
    "totalPages": 3
  },
  "filterOptions": {
    "regions": ["central", "hokkaido"],
    "seasons": ["autumn", "spring", "summer", "winter"]
  }
}
```

Requirements:

- `trips` contains no more than `limit` trip objects.
- `pagination.totalItems` is the number of matching trips before pagination; `totalPages` is the number of result pages, or `0` when there are no matches.
- `filterOptions.regions` and `filterOptions.seasons` contain distinct values from the full trip catalog, independent of the current page. This lets the existing dropdowns show all options when only one page is loaded.
- `GET /api/trips` with no query parameters returns the first 10 trips in the same response shape.
- Invalid `page` or `limit` values (not positive integers) return `400 Bad Request` with a JSON error. Requests beyond the last page return an empty `trips` array and the requested page in `pagination`.
- Database errors continue to return `500 Internal Server Error` with a JSON error.
- Update the endpoint's Swagger documentation to describe the query parameters, response schema, and `400` response.

### 2.2 Page requirements

- Keep the EJS list page as a shell and card template; it must not iterate over trip records.
- Client-side JavaScript fetches page 1 from `/api/trips?page=1&limit=10` and renders only the returned trips.
- Add Previous and Next controls and a current-page indicator. Disable Previous on the first page and Next on the last page; hide or disable both when there are no results.
- Changing pages requests the corresponding page from `/api/trips`; it must not paginate an in-memory copy of the full catalog.
- Display loading, API error, and no-results states. Keep pagination metadata and controls consistent with the latest response.
- Populate the existing region and season dropdowns from `filterOptions` in the API response.

### 2.3 Acceptance criteria

- With more than 10 trips, the initial page displays at most 10 cards and indicates the correct page count.
- Next and Previous fetch and display adjacent pages, and controls are disabled at their respective boundaries.
- With 10 or fewer trips, Next is unavailable; an empty catalog displays the no-results state.
- The list handles API failures without leaving the loading state visible.
- The API's page contents do not overlap, and its reported total and page count match the catalog.

### 2.4 Test plan

Automated API tests:

- Seed at least 21 trips and verify default parameters return page 1 with 10 trips, the expected total, and 3 total pages.
- Request later pages and verify the correct page size, distinct/non-overlapping trip IDs, and correct final-page size.
- Verify an empty catalog reports zero total items and pages, and a page beyond the last page returns an empty `trips` array.
- Verify zero, negative, fractional, and non-numeric `page` or `limit` values return `400`.
- Verify filter option values are distinct and derived from the full catalog, even when the requested page contains only a subset.
- Verify a database failure returns `500` in the documented JSON shape.

Page verification:

- With more than 10 trips, verify the initial render requests page 1 and shows no more than 10 cards; use Next and Previous to confirm the displayed cards and page indicator update.
- Verify Previous and Next are disabled at the first and last pages, respectively, and that zero results show the empty state without active paging controls.
- Simulate an API error and verify loading ends, the error state appears, and no stale page contents are presented as the latest results.
- Confirm filter dropdown options include values not present on the current page.

## 3. Pull Request 2: Filters and Keyword Search

### 3.1 API requirements

Extend `GET /api/trips` with these optional query parameters:

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `region` | String | omitted | Exact, case-insensitive region match. |
| `season` | String | omitted | Exact, case-insensitive match against `bestSeason`. |
| `search` | String | omitted | Case-insensitive substring match in either `name` or `description`. |

Apply all supplied filters before pagination. When multiple filters are present, a trip must match every selected filter. Trim surrounding whitespace from `search`; an empty search is treated as omitted. Keep `pagination.totalItems` and `totalPages` based on the filtered results. Keep `filterOptions` based on the full catalog so filtering does not remove options from either dropdown.

The response format and pagination behavior from Pull Request 1 remain unchanged. Invalid pagination parameters continue to return `400`; filter values with no matches return `200` with an empty `trips` array.

### 3.2 Page requirements

- Keep the existing region and season dropdowns and add a keyword search input.
- On a filter or search change, request `/api/trips` with the selected criteria and `page=1&limit=10`.
- Include only active filters in the request; the `all` dropdown option means no filter.
- Search trip names and descriptions, but not route metadata such as stations, highlights, or region.
- Keep pagination controls available for the filtered result set. Changing pages retains the active search and filters.
- Reset to page 1 whenever a filter or search value changes, so a previous page cannot leave the user on an empty/out-of-range result page.
- Show the no-results state when no trips match. A later filter/search change must recover normally without reloading the page.

### 3.3 Acceptance criteria

- Selecting a region or season shows only trips matching that selection, with both filters applied together when selected.
- Search matches partial text in either a trip's name or description without regard to letter case.
- Search, region, and season can be combined, and the page count and cards reflect the combined result set.
- Changing any filter or search value returns to page 1; paging afterward retains all active criteria.
- No-match searches and filter combinations display a clear empty state, not an API error.
- The dropdowns continue to include all catalog regions and seasons regardless of the current page or active filters.

### 3.4 Test plan

Automated API tests:

- Verify region and season each match exactly without regard to case, and that unrelated trips are excluded.
- Verify `search` matches partial, case-insensitive text in the name and in the description independently; verify it does not match station names, highlights, or region alone.
- Verify surrounding whitespace is trimmed and an empty `search` behaves like no search parameter.
- Combine region, season, and search; verify matching is conjunctive and pagination totals describe the filtered set before paging.
- Verify filters persist across page requests and a no-match combination returns `200` with empty trips and zero result pages.
- Verify `filterOptions` remains based on the unfiltered catalog when filters are active.

Page verification:

- Select each dropdown option and enter search terms; verify the request includes active criteria and returns to page 1 after each change.
- Combine all three criteria, move to another result page, and verify the criteria remain applied and the next/previous page requests retain them.
- Verify `all` dropdown options and a cleared search omit their respective query parameters.
- Verify no-match results show the empty state, and changing criteria recovers the list without a full-page reload.
- Confirm filter options remain available after narrowing the results and pagination controls reflect the filtered count.

## 4. Verification

Automated API tests should cover default pagination, page boundaries, page size, total counts, invalid pagination input, each filter independently, combined filters, case-insensitive substring search, and empty results. Browser-side tests or focused manual verification should cover rendering, loading/error/empty states, filter option population, control boundaries, and retaining criteria while paging.

The existing trip-by-ID endpoint and trip details page should remain unchanged and continue to pass their existing tests.