# Milestone 1 — Auth + React Shell

**Days:** May 24–25  
**Owners:** Person A + B (auth backend) · Person C (React shell)  
**Goal:** Users can register, log in, and subscribe to niches via the API. The React app has all pages built as static shells with mock data, ready to be connected to real endpoints in Milestone 4.

> These two tracks run in parallel — they do not depend on each other. The only constraint: JWT middleware (Track 1) must be complete before Milestone 2 can start. If A or B finishes early, help C wire the static pages to real auth endpoints.

---

## Track 1 — Auth Backend (Person A + B)

**Read first:** [`stack-guide.md`](stack-guide.md) — sections on FastAPI, Pydantic, bcrypt, and PyJWT.

### What you are building

Three things:
1. A register endpoint — receives email + password, hashes the password, saves the user, returns a JWT
2. A login endpoint — validates credentials, returns a JWT
3. A reusable FastAPI dependency — extracts and validates the JWT from the `Authorization` header, returning the current user

Plus two user-facing endpoints:
- Subscribe the authenticated user to a niche
- List the authenticated user's subscribed niches

### Concepts to research

**Password hashing with bcrypt:**
- Why passwords must never be stored as plain text
- The difference between hashing (one-way) and encryption (two-way)
- `bcrypt.hashpw` and `bcrypt.checkpw` — how to hash and how to verify
- What a "salt" is and why bcrypt generates one automatically

**JWT authentication:**
- What a JWT is: three base64 parts (header, payload, signature) joined by dots
- What `jwt.encode` and `jwt.decode` do
- The `exp` (expiry) claim — how to set a token to expire in 24 hours using `datetime` and `timedelta`
- What happens when you decode an expired token — what exception is raised?
- Why JWTs are "stateless" (no session table in the database needed)

**FastAPI patterns:**
- Pydantic `BaseModel` for request bodies — how FastAPI validates them automatically
- `HTTPBearer` security scheme — how to extract the `Authorization: Bearer <token>` header
- `Depends()` — how to create a reusable dependency that any route can declare
- HTTP status codes: 201 Created for register, 401 Unauthorized for bad credentials

**Suggested reading:**
- PyJWT docs: https://pyjwt.readthedocs.io/en/stable/usage.html
- FastAPI security intro: https://fastapi.tiangolo.com/tutorial/security/
- FastAPI dependencies: https://fastapi.tiangolo.com/tutorial/dependencies/

### Structure to aim for

```
backend/app/
├── auth.py           ← JWT creation, verification, get_current_user dependency
├── routers/
│   ├── auth.py       ← /auth/register and /auth/login
│   └── users.py      ← /users/me/niches endpoints
└── schemas/
    ├── auth.py       ← request/response Pydantic models for auth
    └── user.py       ← response shapes for user and niche data
```

### Steps

1. Create Pydantic schemas for the register request, login request, and token response. Think about what fields each one needs.
2. Write the JWT utility functions: one to create a token from a user ID, one to decode and verify a token. Handle `ExpiredSignatureError` and `InvalidTokenError`.
3. Write the `get_current_user` dependency. It should extract the token from the request header, decode it, look up the user in the database, and return the user object (or raise a 401 if anything goes wrong).
4. Write the register and login route handlers. Register hashes the password before saving. Login uses `bcrypt.checkpw` to verify.
5. Write the niche subscription endpoints. These should be protected — declare `get_current_user` as a dependency.
6. Register all routers in `app/main.py` using `app.include_router(...)`.

### Test your work with curl or Postman

Suggested test sequence:
1. Register a new user → get a token
2. Try registering the same email again → expect a 400
3. Login with correct password → get a token
4. Login with wrong password → expect a 401
5. List all niches (should be public, no token needed)
6. Subscribe to a niche using the token in the `Authorization: Bearer` header
7. List your subscribed niches
8. Try any protected endpoint without a token → expect a 401

---

## Track 2 — React Shell (Person C)

**Read first:** React Router docs (https://reactrouter.com/start/library/routing) and Axios docs (https://axios-http.com/docs/intro).

### What you are building

A React SPA with four pages built as **static shells** — they look right, have the right form fields and buttons, but use mock data instead of real API calls. The goal is to have all the UI structure in place so that Milestone 4 is just swapping mocks for real calls.

### Concepts to research

**Vite + React:**
- How to create a Vite project with the React template
- The difference between `npm run dev` (development) and `npm run build` (production)
- Environment variables in Vite: variables must be prefixed with `VITE_` and accessed via `import.meta.env.VITE_*`

**React Router:**
- `BrowserRouter`, `Routes`, `Route` — how to define pages and their URL paths
- `useNavigate` hook — programmatic navigation after a form submit
- `Link` component — navigation links between pages
- How to create a "protected route" — a wrapper component that redirects to `/login` if there is no token in `localStorage`

**Axios:**
- Creating an Axios instance with a `baseURL`
- Request interceptors — how to automatically attach the JWT from `localStorage` to every request's `Authorization` header
- Response interceptors — how to intercept 401 responses globally and redirect to login

**State management:**
- `useState` for form field values and loading/error states
- `useEffect` for loading data when a page mounts

**Suggested reading:**
- React quick start: https://react.dev/learn
- React Router tutorial: https://reactrouter.com/start/library/routing
- Axios interceptors: https://axios-http.com/docs/interceptors

### Pages to build

**`/login`** — email + password form. On submit, log to console and navigate to `/niches` (mock).  
**`/register`** — same structure as login but for registration.  
**`/niches`** — list of niches as checkboxes. Use a hardcoded array. "Continue" button navigates to `/promotions`.  
**`/promotions`** — promotion cards with all fields visible: photo (use a placeholder image URL), title, original price, promo price, description text, and a "Buy now" button.

### Steps

1. Create the Vite project inside `frontend/` and install React Router and Axios.
2. Create an Axios client instance with the API base URL from an environment variable.
3. Add a request interceptor that reads the token from `localStorage` and sets the `Authorization` header.
4. Set up the router in `main.jsx` with all four routes.
5. Build a `ProtectedRoute` component. Research how `localStorage.getItem` and React Router's `Navigate` component work together to guard routes.
6. Build all four pages as static shells with mock data. Put `// TODO M4: replace with real API call` comments where the real calls will go.
7. Verify all navigation works and protected routes redirect to `/login` when no token is present (you can test by setting and removing `localStorage.setItem("token", "fake")` in the browser console).

---

## Acceptance Criteria

**Track 1:**
- [ ] `POST /auth/register` creates a user and returns a JWT
- [ ] Registering the same email twice returns 400
- [ ] `POST /auth/login` returns a JWT with valid credentials; returns 401 with wrong password
- [ ] `GET /users/niches` returns all niches without requiring a token
- [ ] `POST /users/me/niches/:id` subscribes the authenticated user to a niche
- [ ] `GET /users/me/niches` returns the user's subscribed niches
- [ ] Any protected route returns 401 when called without a token or with an invalid/expired token

**Track 2:**
- [ ] All four pages render without errors
- [ ] `/niches` and `/promotions` redirect to `/login` when no token is in `localStorage`
- [ ] Navigation between pages works correctly
- [ ] The promotions page shows mock promotion cards with all fields (photo, title, prices, description, button)
- [ ] The Axios client has the request interceptor wired up (verify in browser devtools — check the `Authorization` header when a token exists in localStorage)
