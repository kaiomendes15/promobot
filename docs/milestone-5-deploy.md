# Milestone 5 — Deploy + Smoke Test

**Days:** May 31  
**Owners:** Person B (Render + CloudAMQP) · Person C (Vercel) · All (smoke test)  
**Goal:** The full application is live in production. All members verify the end-to-end flow on real URLs before the June 1 deadline.

> **Prerequisite:** All features from Milestones 1–4 are working locally.

---

## Concepts to research

**Environment variables in production:**
- Never commit `.env` — production env vars are set through the hosting platform's UI
- Each platform (Render, Vercel) has an "Environment Variables" section in the project settings
- Vite environment variables must be prefixed with `VITE_` and are baked into the build at compile time — they are not runtime variables

**What changes when you go to production:**
- The FastAPI app must bind to `0.0.0.0` (all interfaces), not `127.0.0.1` (localhost only)
- The port must come from the `$PORT` environment variable set by Render
- CORS must explicitly allow your Vercel domain (not just localhost)
- The database URL changes from `localhost` to the managed Render PostgreSQL URL

**Render free tier cold start:**
- Render spins down free services after 15 minutes of inactivity
- The first request after idle takes ~30 seconds to wake the app up
- This is expected behavior — acceptable for a demo

---

## Task B — Deploy backend to Render (Person B)

### Prepare the backend

The app must start with a single shell command. Render needs to know:
- Which directory to build from (`backend/`)
- How to install dependencies (`pip install -r requirements.txt`)
- How to start the app

The start command must use `0.0.0.0` as the host and `$PORT` as the port:
```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Research: a `Procfile` is an optional file that some platforms use to define the start command. Render can also be configured via the dashboard UI.

### Deploy steps

1. Create a Render account at https://render.com
2. **Database first:** New → PostgreSQL → Free plan. Copy the **Internal Database URL** after creation.
3. **Web service:** New → Web Service → connect your GitHub repo
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Plan: Free
4. Add all environment variables from your `.env` in the Render dashboard. Use the **Internal Database URL** for `DATABASE_URL` (both services are on Render's internal network — faster and free).
5. Generate a secure `JWT_SECRET` — you can use Python locally:
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```
6. Deploy and watch the build logs.

### Common build errors to watch for

- `psycopg2` fails to build → make sure you are using `psycopg2-binary` in `requirements.txt`, not `psycopg2`
- App crashes on startup → check all required env vars are set in the Render dashboard
- App binds to wrong port → ensure the start command uses `$PORT`

### Verify CloudAMQP from Render

After deploy, check the Render logs for the RabbitMQ consumer and PostgreSQL listener startup messages. Check your CloudAMQP dashboard → Connections to confirm the app connected.

---

## Task C — Deploy frontend to Vercel (Person C)

### Prepare the frontend

Create a `frontend/.env.production` file (not committed — set via Vercel's dashboard):
```
VITE_API_URL=https://your-app-name.onrender.com
```

Replace with your actual Render backend URL.

### Deploy steps

1. Create a Vercel account at https://vercel.com
2. New Project → Import from GitHub → select your repo
3. Set Root Directory to `frontend`
4. Vercel auto-detects Vite — no build command changes needed
5. Add environment variable: `VITE_API_URL` = your Render backend URL
6. Deploy

### After deploy: update CORS on the backend

Add your Vercel domain to `CORSMiddleware`'s `allow_origins` list in `app/main.py`:
```python
allow_origins=[
    "http://localhost:5173",
    "https://your-app.vercel.app",  # ← add this
]
```

Commit and push — Render redeploys automatically.

---

## Smoke Test — All Members

Run through this checklist on the **live production URLs**, not localhost.

### Auth
- [ ] Open the Vercel URL → redirected to `/login`
- [ ] Register a new account → redirected to `/niches`
- [ ] Log out → redirected to `/login`
- [ ] Log in with the same credentials → works
- [ ] Log in with wrong password → error message shown, no navigation

### Niche subscription
- [ ] `/niches` shows "Gym & Sports"
- [ ] Subscribe → stays checked on page refresh (persisted to DB)
- [ ] Unsubscribe → unchecked state persists

### Promotion pipeline
- [ ] Trigger the pipeline on production:
  ```bash
  curl -X POST https://your-app.onrender.com/internal/fetch
  ```
- [ ] Navigate to `/promotions` → cards appear with all fields
- [ ] "Buy now" opens a Mercado Livre URL with `matt_tool=` in the query string

### Integration checks
- [ ] CloudAMQP dashboard shows an active connection and message activity
- [ ] Render logs show `[EVENT] New promotion inserted →` lines after triggering fetch
- [ ] Render logs show no crash-level errors

### Cold start (simulate before the demo)
- [ ] Leave the app idle for 15+ minutes
- [ ] Open the Vercel URL → the first load may be slow while Render wakes up
- [ ] After the app is awake, everything works normally

---

## Common production issues

| Symptom | Likely cause | Where to look |
|---|---|---|
| 502 Bad Gateway | App crashed on startup | Render → Logs |
| CORS error in browser console | Vercel URL missing from `allow_origins` | Update `main.py`, redeploy |
| 401 on all requests | `JWT_SECRET` env var wrong or missing | Render → Environment |
| No promotions after fetch | ML or Gemini API key wrong | Render → Environment; API dashboards |
| RabbitMQ not connecting | Wrong `RABBITMQ_URL` | Re-copy from CloudAMQP dashboard |
| Vercel build fails | Missing `VITE_API_URL` | Vercel → Project → Environment Variables |
| DB tables not created | Startup crash before `create_all` | Render → Logs |

---

## Acceptance Criteria

- [ ] `GET https://your-app.onrender.com/health` returns `{"status": "ok"}`
- [ ] The Vercel frontend loads without errors in the browser console
- [ ] Full user journey works end-to-end on production URLs
- [ ] Affiliate links contain the affiliate ID parameter
- [ ] CloudAMQP shows an active connection
- [ ] Render logs show RabbitMQ consumer and PostgreSQL LISTEN startup messages
- [ ] No secrets are committed to the repository (verify with `git log --all -- .env`)
