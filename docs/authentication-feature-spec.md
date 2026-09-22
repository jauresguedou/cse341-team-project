# Feature Set 1: Core Authentication Specification

## 1. Feature Overview

Core Authentication provides account registration, session-based login, logout, and role-aware access control for the Kizuna Rail application. A visitor can create an account, sign in, and sign out. After a successful login, the server stores the authenticated user's identity and role in the Express session. Protected page routes and JSON API routes use separate middleware so that browser requests receive redirects or rendered error pages while API clients receive JSON and the correct HTTP status codes.

This feature also introduces an admin-only dashboard at `/admin`. The first release has two standard roles:

- `user`: the default role for newly registered accounts.
- `admin`: may access the admin dashboard and any future admin-only operations.

Password values must never be stored in plaintext, returned in responses, or placed in the session. Passwords are hashed with the existing `bcrypt` dependency before persistence.

## 2. Required Deliverables

### Data and persistence

- Add a Mongoose `Role` schema and model for the `roles` collection.
- Add a Mongoose `User` schema and model for the `users` collection.
- Add starter role documents for `user` and `admin` to the database import/initialization scripts.
- Run `npm run db:import` against the team database after the seed changes and verify that both roles are present.
- Add unique indexes or equivalent schema constraints for role names, usernames, and email addresses.

### Authentication and sessions

- Add registration, login, logout, and current-session behavior.
- Configure `express-session` before routes that read or change `req.session`.
- Store only the minimum safe user data in the session: the user's application identifier, display name, username, email, and role name. Do not store `passwordHash`, the complete Mongoose document, or sensitive request data.
- Make the authenticated user available to EJS through `res.locals.currentUser` (or the equivalent established application convention).
- Use `bcrypt.compare` to verify login passwords and a sufficiently strong bcrypt hash for new passwords.

### Middleware

Implement and export the following middleware functions:

- `requireApiLogin()`
- `requirePageLogin()`
- `requireApiRole(role)`
- `requirePageRole(role)`

The middleware must be reusable by both the authentication routes and future protected features. A request is authenticated only when a valid user object exists in the session. A role check must compare the session role with the required role and must not trust a role supplied by the request body, query string, or URL.

### Pages and routes

- Add EJS pages for registration and login.
- Add a logout action that destroys the current session and returns the user to the login page or home page.
- Add an admin dashboard EJS page at `/admin`, protected by `requirePageLogin()` and `requirePageRole('admin')`. Its initial body must say: `Welcome to the Admin Dashboard`.
- Add a `403` error page for authenticated users who lack a required role.

## 3. Data Model

### 3.1 `roles` collection

The `Role` model represents a permission group. The role's application-level `name` is the value stored in the user session and used by role middleware.

| Field | Type | Required | Constraints / purpose |
| --- | --- | --- | --- |
| `name` | String | yes | Trimmed, lowercase, unique; enum: `user`, `admin`. |
| `description` | String | yes | Short human-readable description. |
| `createdAt` | Date | generated | Mongoose timestamp. |
| `updatedAt` | Date | generated | Mongoose timestamp. |

Starter role documents:

```json
[
  {
    "name": "user",
    "description": "Standard authenticated application user"
  },
  {
    "name": "admin",
    "description": "Administrator with access to administrative features"
  }
]
```

The seed operation should upsert these roles by `name` so repeated initialization cannot create duplicates. If the project initializer replaces starter collections, the roles collection must be included in that replacement list and recreated on every import.

### 3.2 `users` collection

The `User` model stores account identity and the bcrypt password hash. The role may be represented as a Mongoose reference to `Role`; authentication code must resolve it to the role name before writing the session.

| Field | Type | Required | Constraints / purpose |
| --- | --- | --- | --- |
| `displayName` | String | yes | Trimmed; the name shown in the UI. |
| `username` | String | yes | Trimmed, normalized consistently, unique; used as the login identifier. |
| `email` | String | yes | Trimmed, normalized to lowercase, unique; valid email format. |
| `passwordHash` | String | yes | Bcrypt output only; never accept a client-provided hash. |
| `role` | ObjectId or String reference | yes | References the `roles` collection; new registrations use `user`. |
| `createdAt` | Date | generated | Mongoose timestamp. |
| `updatedAt` | Date | generated | Mongoose timestamp. |

Example persisted user shape (the actual `passwordHash` value is intentionally omitted):

```json
{
  "displayName": "Jordan Lee",
  "username": "jordanlee",
  "email": "jordan@example.com",
  "passwordHash": "<bcrypt hash>",
  "role": "<user role reference>",
  "createdAt": "2026-09-21T00:00:00.000Z",
  "updatedAt": "2026-09-21T00:00:00.000Z"
}
```

Registration must reject duplicate usernames and email addresses with a client-safe `409 Conflict` response. It must not reveal whether a password or account combination exists through overly specific login errors.

## 4. Session Contract

The application uses a server-side Express session identified by an HTTP-only cookie. The session should be regenerated after successful login to prevent session fixation and destroyed on logout.

Recommended authenticated session value:

```js
req.session.user = {
  id: user._id.toString(),
  displayName: user.displayName,
  username: user.username,
  email: user.email,
  role: role.name
};
```

Session requirements:

- Signed-out requests have no `req.session.user`.
- Successful registration does not log the user in unless the implementation explicitly documents that behavior; the required default is redirecting to `/login` with a success message.
- Successful login creates the session and redirects page clients to `/` (or the requested safe return path).
- Logout destroys the session and clears the session cookie.
- The password hash is never included in `req.session.user`, `res.locals`, HTML, or JSON responses.
- Session cookies must be HTTP-only. In production they should be secure and use an appropriate same-site policy.

## 5. Middleware Contract

### `requireApiLogin()`

- Continue to the next handler when `req.session.user` exists.
- Otherwise stop processing and return `401 Unauthorized`.
- Response content type: `application/json`.
- Response body:

```json
{ "error": "Authentication required" }
```

### `requirePageLogin()`

- Continue when the request is authenticated.
- Otherwise redirect with `302 Found` to `/login`.
- The original path may be included as a validated return URL, for example `/login?returnTo=%2Fadmin`; arbitrary external URLs must not be accepted.

### `requireApiRole(role)`

- This is a middleware factory: `requireApiRole('admin')`.
- Return `401 Unauthorized` with `{ "error": "Authentication required" }` when signed out.
- Return `403 Forbidden` with `{ "error": "Forbidden" }` when signed in but `req.session.user.role !== role`.
- Continue to the next handler only when both authentication and the required role succeed.

### `requirePageRole(role)`

- This is a middleware factory: `requirePageRole('admin')`.
- Redirect signed-out users with `302 Found` to `/login`.
- Render the `errors/403` page with `403 Forbidden` when the user is signed in but lacks the required role.
- Continue only when the authenticated user's session role matches the required role.

## 6. Page Routes

Page routes are rendered with EJS and use URL-encoded form submissions unless otherwise stated.

### 6.1 Registration page

`GET /register`

- Signed-out visitor: `200 OK`, render the registration form.
- Signed-in visitor: `302 Found` to `/` or another established signed-in landing page.
- Form fields: `displayName`, `username`, `email`, `password`, `confirmPassword`.
- Password confirmation is validated by the server; it is never stored.

`POST /register`

Request body (`application/x-www-form-urlencoded`):

```text
displayName=Jordan+Lee&username=jordanlee&email=jordan%40example.com&password=correct-horse-battery-staple&confirmPassword=correct-horse-battery-staple
```

Responses:

- `302 Found` to `/login` after successful creation.
- `400 Bad Request` with the form rendered again and validation errors for missing, malformed, or mismatched fields.
- `409 Conflict` with the form rendered again for a duplicate username or email.
- `500 Internal Server Error` through the existing error handling path for an unexpected database failure.

### 6.2 Login page

`GET /login`

- Signed-out visitor: `200 OK`, render the login form.
- Signed-in visitor: `302 Found` to `/` or another established signed-in landing page.
- Form fields: `username`, `password`.

`POST /login`

Request body (`application/x-www-form-urlencoded`):

```text
username=jordanlee&password=correct-horse-battery-staple
```

Responses:

- `302 Found` to `/` after successful authentication and session creation.
- `401 Unauthorized` or a `200 OK` re-render with a generic `Invalid username or password` message for invalid credentials. The page flow must not disclose whether the username exists.
- `400 Bad Request` for missing required fields.
- `500 Internal Server Error` through the existing error handling path for an unexpected database failure.

### 6.3 Logout

`POST /logout`

- Destroy the current session, clear its cookie, and return `302 Found` to `/login`.
- The operation should be safe to repeat when already signed out.
- A `GET /logout` route should not mutate authentication state; use the form POST action for browser logout.

### 6.4 Admin dashboard

`GET /admin`

Middleware order:

```js
router.get('/admin', requirePageLogin(), requirePageRole('admin'), adminDashboardPage);
```

Responses:

- Authenticated admin: `200 OK`, render `admin/dashboard.ejs` with the text `Welcome to the Admin Dashboard`.
- Signed-out visitor: `302 Found` to `/login`.
- Authenticated non-admin: `403 Forbidden`, render `errors/403.ejs`.

## 7. API Endpoints

API responses use JSON. API authentication failures must never redirect to an HTML page.

### 7.1 Register

`POST /api/auth/register`

Request (`application/json`):

```json
{
  "displayName": "Jordan Lee",
  "username": "jordanlee",
  "email": "jordan@example.com",
  "password": "correct-horse-battery-staple"
}
```

Success: `201 Created`

```json
{
  "message": "Registration successful",
  "user": {
    "id": "<user id>",
    "displayName": "Jordan Lee",
    "username": "jordanlee",
    "email": "jordan@example.com",
    "role": "user"
  }
}
```

Failures:

- `400 Bad Request`: `{ "error": "Invalid registration data" }`.
- `409 Conflict`: `{ "error": "Username or email is already in use" }`.
- `500 Internal Server Error`: `{ "error": "Unable to register user" }`.

The API should not automatically create an admin account or accept a client-supplied role.

### 7.2 Login

`POST /api/auth/login`

Request (`application/json`):

```json
{
  "username": "jordanlee",
  "password": "correct-horse-battery-staple"
}
```

Success: `200 OK`; create the authenticated session and return the same safe user object shown above.

Invalid credentials: `401 Unauthorized`

```json
{ "error": "Invalid username or password" }
```

Malformed input: `400 Bad Request`; unexpected failure: `500 Internal Server Error` with a generic error message. Do not return password hashes.

### 7.3 Current user

`GET /api/auth/me`

Protect with `requireApiLogin()`.

- Authenticated: `200 OK`, return `{ "user": { ...safe session user fields... } }`.
- Signed out: `401 Unauthorized`, return `{ "error": "Authentication required" }`.

### 7.4 Logout

`POST /api/auth/logout`

- Authenticated or signed out: destroy the session if present, clear the cookie, and return `204 No Content` (or a documented `200 OK` JSON message).
- The endpoint must not return user credentials or session secrets.

## 8. User Experience by Authentication State

| User state | Public pages | Protected page `/admin` | Protected API |
| --- | --- | --- | --- |
| Signed out | Can view login and registration pages; can submit either form. | Redirected to `/login`. | Receives JSON `401 Unauthorized`. |
| Signed in as `user` | Can view public pages and sign out; login/register may redirect to the home page. | Receives rendered `403 Forbidden` page. | Authenticated endpoints work; admin endpoints receive JSON `403 Forbidden`. |
| Signed in as `admin` | Can view public pages and sign out. | Sees `200 OK` and `Welcome to the Admin Dashboard`. | Authenticated admin endpoints work. |

All authentication errors should be understandable to the user without revealing account existence, password values, database details, or stack traces.

## 9. Test Plan

Tests should exercise the real Express routes with Supertest and the test database setup already used by the repository.

### Data and password checks

- Database initialization creates exactly one `user` role and one `admin` role.
- Registering a user creates one user document with the `user` role.
- The persisted password is a bcrypt hash and is not equal to the submitted password.
- User responses, session data, EJS locals, and API responses never contain `passwordHash` or the submitted password.
- Duplicate username and duplicate email registration are rejected without creating an additional user.
- A client cannot select `admin` by adding `role: "admin"` to registration input.

### Page flow checks

- `GET /register` and `GET /login` return `200` for signed-out users.
- Valid `POST /register` redirects to `/login` and creates the account.
- Invalid or mismatched registration input returns a validation response and does not create an account.
- Valid `POST /login` creates a session and redirects to the home page.
- Invalid login credentials do not create a session and return the generic credential error.
- `POST /logout` destroys the session; a previously authenticated request is then treated as signed out.
- Signed-out `GET /admin` redirects to `/login`.
- Signed-in non-admin `GET /admin` returns `403` and renders the forbidden page.
- Signed-in admin `GET /admin` returns `200` and includes `Welcome to the Admin Dashboard`.

### API and middleware checks

- Unauthenticated `GET /api/auth/me` returns JSON `401`, never a redirect.
- Valid `POST /api/auth/register` returns `201` and a safe user object.
- Invalid credentials at `POST /api/auth/login` return JSON `401`.
- Valid API login establishes a session that `GET /api/auth/me` can read.
- `requireApiRole('admin')` returns JSON `401` when signed out and JSON `403` for a signed-in regular user.
- `requireApiRole('admin')` allows an admin session through.
- `requirePageRole('admin')` redirects signed-out requests and renders `403` for non-admin requests.
- API responses have the expected JSON content type and status codes.

### Operational verification

- Run `npm test` after implementation.
- Run `npm run lint` after implementation.
- Run `npm run db:import` with the team `.env` configuration and verify the `roles` collection contains both standard roles.
- Manually verify registration, login, logout, and admin access in a browser with one regular account and one admin account created only through a controlled database seed or update.

## 10. Out of Scope

- Password reset and email verification.
- OAuth, social login, multi-factor authentication, and account deletion.
- Fine-grained permissions beyond the `user` and `admin` roles.
- Admin user-management screens.
- Persistent session storage beyond the session mechanism required for this feature set.
