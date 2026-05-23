# Milestone 4 — Frontend Wiring + Polish

**Days:** May 30  
**Owners:** All 3 members  
**Goal:** Replace all mock data in the React frontend with real API calls. Every page works end-to-end against the live backend.

> **Prerequisite:** All backend endpoints from Milestones 1 and 2 must be working. The React shell from Milestone 1 (Track 2) must be in place.

---

## What changes in this milestone

Every `TODO M4` comment left in the React shell gets implemented. The static mock data is replaced with real Axios calls to the FastAPI backend.

---

## Task C-1: Wire Register page — Person C

**File:** `src/pages/Register.jsx`

Replace the mock `handleSubmit` with a real API call:

```jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/client";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { email, password });
      localStorage.setItem("token", data.access_token);
      navigate("/niches");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Create account</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </form>
  );
}
```

**Key points:**
- The token returned by `/auth/register` is stored immediately in `localStorage` — the user is logged in as soon as they register.
- `err.response?.data?.detail` reads the FastAPI error message (e.g., "Email already registered") and shows it to the user.
- `disabled={loading}` prevents double-submits.

---

## Task C-2: Wire Login page — Person C

**File:** `src/pages/Login.jsx`

Same pattern as Register, but calling `POST /auth/login`:

```jsx
const { data } = await api.post("/auth/login", { email, password });
localStorage.setItem("token", data.access_token);
navigate("/niches");
```

Also add a **Logout** utility. When the user logs out, remove the token and redirect:
```jsx
function logout() {
  localStorage.removeItem("token");
  navigate("/login");
}
```

You can add a logout button in a shared navbar or header component.

---

## Task A-1: Wire Niches page — Person A

**File:** `src/pages/Niches.jsx`

Replace the hardcoded `MOCK_NICHES` with real API data, and subscribe/unsubscribe with real calls.

```jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Niches() {
  const [allNiches, setAllNiches] = useState([]);
  const [subscribedIds, setSubscribedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const [allRes, myRes] = await Promise.all([
        api.get("/users/niches"),
        api.get("/users/me/niches"),
      ]);
      setAllNiches(allRes.data);
      setSubscribedIds(new Set(myRes.data.map(n => n.id)));
      setLoading(false);
    }
    load();
  }, []);

  async function toggleNiche(niche) {
    if (subscribedIds.has(niche.id)) {
      await api.delete(`/users/me/niches/${niche.id}`);
      setSubscribedIds(prev => { const next = new Set(prev); next.delete(niche.id); return next; });
    } else {
      await api.post(`/users/me/niches/${niche.id}`);
      setSubscribedIds(prev => new Set([...prev, niche.id]));
    }
  }

  if (loading) return <p>Loading niches...</p>;

  return (
    <div>
      <h1>Choose your niches</h1>
      {allNiches.map(niche => (
        <label key={niche.id}>
          <input
            type="checkbox"
            checked={subscribedIds.has(niche.id)}
            onChange={() => toggleNiche(niche)}
          />
          {niche.name}
        </label>
      ))}
      <button onClick={() => navigate("/promotions")}>See promotions</button>
    </div>
  );
}
```

**Why `Promise.all`?** It fires both API calls simultaneously instead of sequentially — the page loads faster.

---

## Task C-3: Wire Promotions feed — Person C

**File:** `src/pages/Promotions.jsx`

Replace mock promotions with real data from `GET /promotions`.

```jsx
import { useState, useEffect } from "react";
import api from "../api/client";

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/promotions")
      .then(res => setPromotions(res.data))
      .catch(() => setError("Failed to load promotions."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading promotions...</p>;
  if (error) return <p>{error}</p>;
  if (promotions.length === 0) return <p>No active promotions for your niches. Check back soon!</p>;

  return (
    <div>
      <h1>Today's Deals</h1>
      {promotions.map(promo => (
        <PromotionCard key={promo.id} promo={promo} />
      ))}
    </div>
  );
}

function PromotionCard({ promo }) {
  const discount = Math.round((1 - promo.promo_price / promo.original_price) * 100);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 16 }}>
      {promo.product.photo_url && (
        <img src={promo.product.photo_url} alt={promo.product.title} style={{ width: 200 }} />
      )}
      <h2>{promo.product.title}</h2>
      <p>{promo.product.gemini_description}</p>
      <p>
        <s>R$ {Number(promo.original_price).toFixed(2)}</s>
        {" → "}
        <strong>R$ {Number(promo.promo_price).toFixed(2)}</strong>
        {" "}
        <span style={{ color: "green" }}>({discount}% off)</span>
      </p>
      <a href={promo.affiliate_url} target="_blank" rel="noopener noreferrer">
        <button>Buy now</button>
      </a>
    </div>
  );
}
```

**Why `rel="noopener noreferrer"` on the affiliate link?** Security best practice for links that open in a new tab — prevents the opened page from accessing `window.opener`.

---

## Task B-1: CORS configuration — Person B

When the React app (running on Vercel or `localhost:5173`) makes requests to the FastAPI backend (on Render or `localhost:8000`), the browser blocks cross-origin requests unless the backend explicitly allows them.

Add CORS middleware to `app/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",        # local Vite dev server
        "https://your-app.vercel.app",  # production frontend (update after Vercel deploy)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**When to update `allow_origins`:** After deploying to Vercel in Milestone 5, add your real Vercel URL here and redeploy the backend.

---

## Shared tasks (any member)

### Handle auth expiry globally

If the JWT expires (after 24h), all API calls will return 401. Add an Axios response interceptor to handle this automatically:

```javascript
// src/api/client.js — add after the request interceptor

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

This redirects any 401 response to the login page, regardless of which page triggered the call.

### Loading and empty states

Every data-fetching component should handle three states:
1. **Loading** — show a spinner or "Loading..." text while the request is in flight.
2. **Empty** — show a helpful message if the array is empty (e.g., "No promotions yet — check back soon!").
3. **Error** — show a human-readable error message if the request fails.

These are already in the code examples above. Make sure all pages follow this pattern.

---

## Testing the full user journey

Go through the complete flow manually:

1. Open http://localhost:5173
2. → Redirected to `/login` (no token)
3. Click "Register" → fill in email + password → submit
4. → Redirected to `/niches`
5. Check "Gym & Sports" → click "See promotions"
6. → Redirected to `/promotions`
7. Should see real promotions from the DB (trigger `POST /internal/fetch` first if empty)
8. Click "Buy now" → should open Mercado Livre in a new tab with affiliate URL
9. Refresh the page → promotions still show (token persists in localStorage)
10. Test logout → token removed → next visit redirects to login

---

## Acceptance Criteria

- [ ] Register creates a real user in the DB and logs in automatically
- [ ] Login with wrong password shows an error message, does not redirect
- [ ] Niches page shows real niches from the DB (not hardcoded)
- [ ] Subscribing/unsubscribing a niche updates the DB and reflects immediately in the UI
- [ ] Promotions page shows real promotions with photo, title, original price, promo price, Gemini description, and affiliate link
- [ ] Promotions page shows an empty state message when no promotions exist
- [ ] "Buy now" opens the correct Mercado Livre affiliate URL in a new tab
- [ ] A 401 error (expired token or logged-out user) redirects to `/login`
- [ ] The promotions page is not accessible without a token (protected route)
- [ ] CORS does not block requests from `localhost:5173` to `localhost:8000`
