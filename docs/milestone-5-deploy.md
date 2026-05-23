# Milestone 5 — Deploy + Smoke Test

**Days:** May 31  
**Owners:** Person B (Render + CloudAMQP) · Person C (Vercel) · All (smoke test)  
**Goal:** The full application is running in production. All three members verify the end-to-end flow on the live URLs before the June 1 deadline.

> **Prerequisite:** All features from Milestones 1–4 are working locally.

---

## Task B-1: Deploy backend to Render — Person B

### Step 1: Prepare the backend for production

Render expects your app to be startable with a single shell command. Add a `Procfile` (or just note the start command):

```
# backend/Procfile
web: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Render sets the `$PORT` environment variable automatically. `--host 0.0.0.0` is required so Render's load balancer can reach the app.

Also add a `runtime.txt` to specify the Python version:
```
# backend/runtime.txt
python-3.12.0
```

### Step 2: Create the PostgreSQL database on Render

1. Go to https://render.com → New → PostgreSQL
2. Name: `promobot-db`
3. Plan: Free
4. Click "Create Database"
5. Copy the **Internal Database URL** (used when both services are on Render) and the **External Database URL** (used for local access if needed)

### Step 3: Create the web service on Render

1. New → Web Service → connect your GitHub repo
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free

### Step 4: Set environment variables on Render

In the web service settings → Environment, add:

```
DATABASE_URL          = <Internal Database URL from step 2>
RABBITMQ_URL          = <CloudAMQP AMQP URL — see Task B-2>
MERCADOLIVRE_CLIENT_ID     = your_client_id
MERCADOLIVRE_CLIENT_SECRET = your_client_secret
MERCADOLIVRE_AFFILIATE_ID  = your_affiliate_id
GEMINI_API_KEY        = your_gemini_key
JWT_SECRET            = <generate a long random string>
JWT_ALGORITHM         = HS256
JWT_EXPIRE_HOURS      = 24
```

**Generating a secure `JWT_SECRET`:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Step 5: Deploy

Click "Deploy" (or push to your main branch — Render deploys automatically on push).

Watch the build logs. Common issues:
- **`psycopg2` build failure** — make sure `psycopg2-binary` is in `requirements.txt`, not `psycopg2`
- **Missing env var** — check all variables are set in Render's environment panel
- **Port binding error** — make sure the start command uses `$PORT`

---

## Task B-2: Verify CloudAMQP connection from Render — Person B

1. CloudAMQP is already set up from Milestone 3. Copy your AMQP URL.
2. Add it as `RABBITMQ_URL` in Render's environment variables (done in Task B-1 Step 4).
3. After deploy, check the Render logs for:
   ```
   [RabbitMQ] Waiting for messages on queue 'fetch_promotions'...
   [LISTEN] Subscribed to 'new_promotion' channel
   ```
4. Check your CloudAMQP dashboard → RabbitMQ Manager → Connections — you should see one active connection from Render.

If the consumer fails to connect:
- Double-check the AMQP URL in Render's env vars (no trailing spaces, correct format)
- CloudAMQP free tier has a connection limit — make sure you're not exceeding it

---

## Task C-1: Deploy frontend to Vercel — Person C

### Step 1: Prepare the frontend

Create `frontend/.env.production` (or set env vars in Vercel):
```
VITE_API_URL=https://your-backend.onrender.com
```

Replace `your-backend.onrender.com` with the actual URL from Render.

### Step 2: Deploy to Vercel

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select your repo → set **Root Directory** to `frontend`
3. Framework preset: **Vite** (Vercel detects it automatically)
4. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com`
5. Click Deploy

### Step 3: Update CORS on the backend

Once you have your Vercel URL (e.g., `https://promobot.vercel.app`), update `app/main.py`:

```python
allow_origins=[
    "http://localhost:5173",
    "https://promobot.vercel.app",   # ← add your real Vercel URL
]
```

Commit and push — Render redeploys automatically.

---

## Smoke Test — All Members

Go through this checklist on the **production URLs** (Vercel + Render), not localhost.

### Auth flow
- [ ] Open the Vercel URL → redirected to `/login`
- [ ] Register a new account → redirected to `/niches`
- [ ] Log out → redirected to `/login`
- [ ] Log in with the same account → redirected to `/niches`
- [ ] Try logging in with wrong password → error message shown

### Niche subscription
- [ ] `/niches` shows "Gym & Sports"
- [ ] Check the niche → it stays checked on page refresh (stored in DB)
- [ ] Uncheck the niche → unchecked state persists

### Promotion pipeline
- [ ] Trigger the pipeline manually:
  ```bash
  curl -X POST https://your-backend.onrender.com/internal/fetch
  ```
- [ ] Navigate to `/promotions` → promotions appear with photo, title, prices, Gemini description, and buy button
- [ ] Click "Buy now" → opens Mercado Livre in a new tab with affiliate URL (`matt_tool=` in the URL)

### Integration checks
- [ ] CloudAMQP dashboard shows message activity after triggering fetch
- [ ] Render logs show `[EVENT] New promotion inserted →` lines
- [ ] Render logs show no error-level messages

### Cold start
- [ ] Wait 15 minutes (Render free tier spins down)
- [ ] Open the app → first request takes ~30 seconds
- [ ] After the app wakes up, everything works normally

---

## Common production issues and fixes

| Issue | Likely cause | Fix |
|---|---|---|
| `502 Bad Gateway` on Render | App crashed on startup | Check Render logs for Python errors |
| CORS error in browser console | Vercel URL not in `allow_origins` | Update CORS and redeploy backend |
| `401` on all requests | `JWT_SECRET` mismatch or missing | Verify env var in Render |
| No promotions after fetch | ML or Gemini API key wrong | Check Render env vars, check ML/Gemini API dashboards |
| RabbitMQ consumer not connecting | Wrong `RABBITMQ_URL` | Re-copy URL from CloudAMQP dashboard |
| Vercel build fails | Missing `VITE_API_URL` | Add env var in Vercel project settings |
| Database tables not created | `create_all` not running | Check startup logs in Render |

---

## Acceptance Criteria

- [ ] Backend is live on Render (`GET /health` returns `{"status": "ok"}`)
- [ ] Frontend is live on Vercel and loads without console errors
- [ ] Full user journey works end-to-end on production URLs
- [ ] Affiliate links contain the affiliate ID
- [ ] CloudAMQP shows active connection and message throughput
- [ ] Render logs show both RabbitMQ consumer and PostgreSQL LISTEN activity
- [ ] No `.env` files or secrets are committed to the repository
