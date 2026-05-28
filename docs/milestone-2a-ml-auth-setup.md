# Milestone 2A — Mercado Livre Auth Setup

**Days:** May 26 (half-day — must complete before 2B starts)  
**Owner:** Person B  
**Goal:** The backend can obtain and automatically refresh a Mercado Livre access token. The app owner authenticates once via browser; from then on the system is fully automated.

> **Prerequisite:** Milestone 1 complete (models, DB, JWT auth).

**Read first:** [`docs/mercadolivre-api/02-authentication.md`](mercadolivre-api/02-authentication.md) — covers the full OAuth flow and token lifecycle.

---

## Why this comes first

The ML search API requires a Bearer token on every call. The original plan assumed "Client Credentials" (app-only token without user login), but the ML docs only document the Authorization Code flow. We use the **owner-auth approach**: the app owner authorizes the application once via browser and the system chains refresh tokens indefinitely — no repeated logins, no automation of the browser flow.

---

## What you are building

1. A DB model to persist ML tokens across server restarts.
2. A one-time bootstrap endpoint the app owner calls after the browser OAuth step.
3. An internal function that always returns a valid access token, refreshing automatically.

---

## Part A — DB Model

### New file: `app/models/ml_credential.py`

Single-row table (always upserted, never multi-row):

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | Always `id=1` |
| `access_token` | String | The Bearer token |
| `refresh_token` | String | Used to get next access token |
| `expires_at` | DateTime (UTC) | When the access token expires |
| `updated_at` | DateTime (UTC) | Auto-updated on upsert |

Import this model in `app/main.py` so it's picked up by `Base.metadata.create_all()`.

---

## Part B — ML Integration (auth layer)

### New file: `app/integrations/__init__.py` (empty)

### New file: `app/integrations/mercadolivre.py`

Implement three functions (auth only — search functions come in Milestone 2B):

**`exchange_code(code: str, db: Session) -> None`**
- POST to `https://api.mercadolibre.com/oauth/token` with:
  - `grant_type=authorization_code`
  - `client_id` and `client_secret` from env
  - `code` from the parameter
  - `redirect_uri` from env
- Parse the JSON response: `access_token`, `refresh_token`, `expires_in`
- Calculate `expires_at = now(UTC) + timedelta(seconds=expires_in)`
- Upsert a single `MLCredential` row (delete existing if any, then insert — or use merge)

**`_refresh_tokens(db: Session) -> str`**
- Read the current `MLCredential` row to get `refresh_token`
- POST to `https://api.mercadolibre.com/oauth/token` with `grant_type=refresh_token`
- Upsert the new tokens into `MLCredential`
- Return the new `access_token`

**`get_access_token(db: Session) -> str`**
- Read the `MLCredential` row
- If no row: raise `RuntimeError("ML credentials not configured. POST /internal/ml-connect first.")`
- If `expires_at - now(UTC) > timedelta(minutes=5)`: return `access_token` (still valid)
- Otherwise: call `_refresh_tokens(db)` and return the new token

**Concepts to research:**
- `httpx.AsyncClient` and how to POST `application/x-www-form-urlencoded` data
- `datetime.now(timezone.utc)` vs `datetime.utcnow()` — always use the timezone-aware version
- SQLAlchemy upsert pattern for a single-row config table

---

## Part C — Bootstrap Endpoint

### Add to `app/routers/promotions_router.py` (new file, also used in Milestone 2B)

**`POST /internal/ml-connect`**

```
Body: { "code": "TG-xxxx..." }
Response: { "expires_at": "2026-05-26T18:00:00Z", "message": "ML auth configured" }
```

- No JWT required — this is an internal operator endpoint
- Calls `exchange_code(body.code, db)`
- Returns the stored `expires_at` as confirmation

---

## Bootstrap Procedure (app owner — done once per environment)

1. Make sure the backend is running locally
2. Open in browser (replace values):
   ```
   https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=YOUR_APP_ID&redirect_uri=YOUR_REDIRECT_URI
   ```
3. Log in as the ML app owner and click "Autorizar"
4. You're redirected to `YOUR_REDIRECT_URI?code=TG-xxxx...`
5. **Immediately** (code expires in ~10 min) run:
   ```bash
   curl -X POST http://localhost:8000/internal/ml-connect \
     -H 'Content-Type: application/json' \
     -d '{"code": "TG-xxxx..."}'
   ```
6. Confirm the response shows a valid `expires_at` ~6 hours from now
7. Verify the `ml_credentials` table has one row in PostgreSQL

From this point on, the backend auto-refreshes the token using the refresh token chain.

---

## Category ID Discovery (do this after bootstrap)

The niche seed in `main.py` uses `ml_category_id=1` (placeholder). Find the real Brazil category ID:

```bash
# Get your access token from the ml_credentials table first
curl -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  'https://api.mercadolibre.com/sites/MLB/categories'
```

Find the sports/fitness entry in the response (expected: `MLB1276` — verify). Then update `main.py`:

```python
# In the lifespan startup seed block
Niche(title="Gym & Sports", ml_category_id="MLB1276")
```

See [`docs/mercadolivre-api/05-categories.md`](mercadolivre-api/05-categories.md) for more on categories.

---

## Update `requirements.txt`

Add:
```
httpx
```

---

## Acceptance Criteria

- [ ] `POST /internal/ml-connect` exchanges a valid code and stores tokens in the DB
- [ ] Calling `get_access_token(db)` before expiry returns the same token without an API call
- [ ] Setting `expires_at` to a past time in the DB and calling `get_access_token(db)` triggers a refresh and updates the DB row with new tokens
- [ ] After refresh, the old `refresh_token` is gone from the DB and replaced by the new one
- [ ] `ml_category_id` in the niche seed is updated to a real MLB category ID (not `1`)
