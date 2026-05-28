# Milestone 4 — Frontend Wiring + Polish

**Days:** May 30  
**Owners:** All 3 members  
**Goal:** Replace all mock data in the React frontend with real API calls. Every page works end-to-end against the live backend.

> **Prerequisite:** All backend endpoints from Milestones 1, 2A, and 2B must be working — including `GET /promotions`, `DELETE /users/me/niches/{niche_id}`, and `POST /internal/ml-connect`. The React shell from Milestone 1 (Track 2) must be in place.

---

## What changes in this milestone

Every `// TODO M4` comment left in the static shell gets implemented. Mock data is replaced with real Axios calls.

---

## Concepts to research

**React state and effects:**
- `useState` — storing form values, loaded data, loading flags, error messages
- `useEffect` — running code when a component mounts (the right place to fetch data on page load)
- Dependency array in `useEffect`: `[]` means "run once on mount", `[value]` means "run when value changes"

**Async calls in React:**
- `useEffect` cannot be `async` directly — research the correct pattern for calling async functions inside `useEffect`
- Handling loading state: set a `loading` flag to `true` before the call, `false` after (in a `finally` block)
- Handling errors: catch the error and store a message in state to display to the user

**Axios response and error structure:**
- `response.data` — the parsed JSON body
- `error.response?.data?.detail` — the FastAPI error message (e.g., "Email already registered")
- `error.response?.status` — the HTTP status code

**`Promise.all`:**
- When two API calls are independent, run them in parallel instead of sequentially
- `const [resultA, resultB] = await Promise.all([api.get('/a'), api.get('/b')])`

**CORS:**
- When the React app (port 5173) calls the backend (port 8000), the browser enforces the Same-Origin Policy
- The backend must explicitly allow the frontend's origin via CORS headers
- Research FastAPI's `CORSMiddleware`

**Suggested reading:**
- React `useEffect`: https://react.dev/reference/react/useEffect
- React forms: https://react.dev/learn/reacting-to-input-with-state
- Axios error handling: https://axios-http.com/docs/handling_errors

---

## Task breakdown

### Person C — Register and Login pages

Wire the form submit handlers to real API calls:
- Register: `POST /auth/register` with `{ email, password }` → store the returned token in `localStorage` → navigate to `/niches`
- Login: same flow with `POST /auth/login`

Both pages should:
- Show a loading indicator while the request is in flight (disable the submit button)
- Show the error message from the API response if the request fails (e.g., "Email already registered")
- Not navigate anywhere on error

Add a logout function somewhere accessible (a button in a header or nav): remove the token from `localStorage` and navigate to `/login`.

### Person A — Niches page

Replace the hardcoded niche list with real data:
- On mount, fetch all available niches from `GET /users/niches` **and** the user's current subscriptions from `GET /users/me/niches` in parallel
- Track which niches are subscribed using a `Set` of IDs in state
- When a checkbox is toggled:
  - If the niche was subscribed: call `DELETE /users/me/niches/:id`
  - If not subscribed: call `POST /users/me/niches/:id`
  - Update local state immediately so the UI responds without waiting for a refetch

Think about: what should happen if the toggle call fails? Should the checkbox snap back?

### Person C — Promotions feed

Replace mock promotions with real data from `GET /promotions`:
- On mount, call the endpoint and store the results in state
- Show a loading state while fetching
- Show a "No active promotions for your niches — check back soon!" message if the array is empty
- Render each promotion card with: product photo, title, original price (struck through), promo price, discount percentage, Gemini description, and a "Buy now" link

For the "Buy now" link: open in a new tab. Research why `rel="noopener noreferrer"` should be added to external links that open with `target="_blank"`.

For prices: use `Number(price).toFixed(2)` to format prices as strings with two decimal places.

### Person B — CORS configuration

Add `CORSMiddleware` to `app/main.py`:
- Allow `http://localhost:5173` for local development
- Allow your Vercel URL (add it after Milestone 5 deploy)
- Allow credentials, all methods, all headers

Research: where in `main.py` middleware should be added relative to route registration.

### All members — Global 401 handling

Add a response interceptor to the Axios client that:
- Catches any 401 response from any endpoint
- Removes the token from `localStorage`
- Redirects the user to `/login`

This means expired tokens are handled automatically everywhere, without needing error handling in every individual component.

---

## Manual end-to-end test

Walk through the full user journey manually after wiring everything up:

1. Open the app → redirected to `/login`
2. Register a new account → redirected to `/niches`
3. Subscribe to "Gym & Sports" → checkbox reflects the change
4. Click "See promotions" → promotions feed loads (trigger `POST /internal/fetch` first if empty)
5. Verify: photo, title, original price struck through, promo price, Gemini description, affiliate URL button
6. Click "Buy now" → Mercado Livre opens in a new tab with `matt_tool=` in the URL
7. Refresh the page → still logged in (token persists in localStorage)
8. Log out → redirected to `/login` → `/promotions` is inaccessible

---

## Acceptance Criteria

- [ ] Register creates a real user and logs in automatically
- [ ] Login with wrong password shows the API error message, no navigation
- [ ] Niches page shows real niches from the database
- [ ] Subscribing and unsubscribing persists to the database and reflects immediately in the UI
- [ ] Promotions page shows real data with all fields
- [ ] Empty state message shows when no promotions exist
- [ ] "Buy now" opens the correct affiliate URL in a new tab
- [ ] A 401 response on any endpoint redirects to `/login`
- [ ] Protected pages redirect to `/login` when there is no token
- [ ] CORS does not block requests from `localhost:5173` to `localhost:8000`
