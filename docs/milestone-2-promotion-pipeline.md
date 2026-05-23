# Milestone 2 — Promotion Pipeline

**Days:** May 26–27  
**Owners:** Person B leads · Person A (Gemini client) · Person C (wire GET /promotions to frontend if ready)  
**Goal:** A working end-to-end pipeline that fetches promotions from Mercado Livre, generates a description with Gemini for each new product, builds an affiliate URL, and stores the result in the database. Triggered manually via an HTTP endpoint for now — RabbitMQ comes in Milestone 3.

> **Prerequisite:** JWT middleware from Milestone 1 must be complete. The database models from Milestone 0 must be in place.

**Read first:** [`stack-guide.md`](stack-guide.md) — sections on httpx and asyncpg (for context on async patterns).

---

## What you are building

The pipeline that is the core of the system:

```
POST /internal/fetch (manual trigger)
        ↓
Fetch promotions from Mercado Livre API (by niche category)
        ↓
For each product:
  → Already in the DB? Reuse existing description.
  → New product? Call Gemini → save description → save Product row.
  ↓
Build affiliate URL
  ↓
Insert Promotion row (price snapshot + expires_at)
        ↓
Clean up expired Promotion rows
```

Plus a `GET /promotions` endpoint that returns active promotions for the authenticated user's subscribed niches.

---

## Part A — Mercado Livre API Client (Person B)

### Concepts to research

**Mercado Livre OAuth (Client Credentials flow):**
- Create a free application at https://developers.mercadolivre.com.br
- You get a `client_id` and `client_secret`
- Server-to-server calls use the "client credentials" grant — you exchange your credentials for an access token via a POST request (no user login involved)
- Tokens expire — research how to cache a token in memory and refresh it only when it expires

**httpx async client:**
- Why use `async with httpx.AsyncClient()` instead of a module-level client
- How to pass `params` (query string), `headers`, and handle `response.raise_for_status()`
- How to navigate the response JSON structure from ML's search endpoint

**Mercado Livre search API:**
- Endpoint: `GET https://api.mercadolibre.com/sites/MLB/search`
- Useful parameters: `category`, `sort`, `limit`
- Each result item has: `id`, `title`, `thumbnail`, `price`, `original_price`, `permalink`
- A "real discount" is when `original_price` exists and is greater than `price`
- The `thumbnail` URL may be HTTP — browsers block mixed content, so force HTTPS

**Affiliate URL:**
- Mercado Livre affiliate links append a query parameter to the product's `permalink`
- The parameter is `matt_tool=YOUR_AFFILIATE_ID`
- Research how to safely append a query parameter to a URL that may or may not already have a `?`

### Steps

1. Obtain your `client_id` and `client_secret` from the ML developer portal.
2. Write a function that exchanges credentials for an access token via POST.
3. Add in-memory token caching — store the token and its expiry time; only refresh when it has expired.
4. Write a function that calls the ML search endpoint with a category ID and returns a list of product dicts with the fields you need.
5. Filter results to only include products with a genuine discount.
6. Write the affiliate URL builder function.

---

## Part B — Gemini API Client (Person A)

### Concepts to research

**Google Gemini SDK:**
- Get an API key at https://aistudio.google.com (free tier available)
- Install `google-generativeai` and configure it with your key
- Research `GenerativeModel` and which model to use (`gemini-1.5-flash` is fast and cheap)
- The difference between `generate_content` (sync) and `generate_content_async` (async) — use the async version because FastAPI runs in an async event loop

**Prompt engineering basics:**
- A prompt is just a string — think about what context Gemini needs to generate a good description
- Tell it: the role it should play, the tone, the language (Portuguese Brazil), the length limit, and what information about the product to include
- Do not include the price in the description — prices will be shown separately in the UI

**What to generate:**
- A short, informal, enthusiastic promotional message in Brazilian Portuguese
- Based on: the product title and the discount percentage
- The discount percentage is calculated from `original_price` and `promo_price`

### Steps

1. Add your `GEMINI_API_KEY` to `.env`.
2. Write an async function that accepts a product title and prices, builds a prompt, calls Gemini, and returns the generated text.
3. Test it in isolation before integrating: call it directly in a script to see what Gemini returns for a sample product.

---

## Part C — Pipeline Service (Person B)

### Concepts to research

**SQLAlchemy query patterns:**
- How to check if a row with a specific value already exists (e.g., find a `Product` by `ml_product_id`)
- How to use `db.flush()` — it sends pending changes to the DB within the current transaction without committing, so you can get an auto-generated `id` before the transaction is closed
- Why `db.commit()` at the end of the whole pipeline (not after each step) — atomicity

**`expires_at` for promotions:**
- A promotion is only valid for 30 minutes — Mercado Livre prices change frequently
- Use `datetime.now(timezone.utc) + timedelta(minutes=30)` for the expiry
- Always use timezone-aware datetimes (`timezone.utc`) to avoid comparison issues

**Cleanup:**
- Deleting promotions where `expires_at` is in the past keeps the table small
- Research `session.query(Model).filter(...).delete()`

### Steps

1. Create `app/services/pipeline.py`.
2. Write the main pipeline function: accepts a `Niche` object and a DB session.
   - Call the ML client to get products for the niche's category ID
   - For each product, check if it already exists in the `products` table by `ml_product_id`
   - If it doesn't exist: call Gemini, create and flush a new `Product` row
   - Build the affiliate URL
   - Insert a new `Promotion` row with the current price and a 30-minute `expires_at`
   - Commit once at the end
3. Write a cleanup function that deletes expired promotions.

---

## Part D — Endpoints (Persons A + B)

### Manual trigger endpoint

Create `POST /internal/fetch`. It should:
- Query all niches from the database
- Run the pipeline for each niche
- Call cleanup
- Return a summary (how many promotions were created per niche, how many expired rows were deleted)

This is a **temporary endpoint** — it exists so you can test the pipeline without RabbitMQ. It will be replaced in Milestone 3.

### GET /promotions endpoint

Create `GET /promotions`. It should:
- Require authentication (use the `get_current_user` dependency)
- Get the authenticated user's subscribed niche IDs
- Query promotions where `niche_id` is in that list and `expires_at` is in the future
- Return the results ordered by `created_at` descending (newest first)

**Research:** SQLAlchemy's `joinedload` — when your Pydantic response schema includes nested objects (e.g., the promotion's product data), SQLAlchemy needs to eagerly load those relationships to avoid the N+1 query problem. Without `joinedload`, it would fire one extra SQL query per promotion to fetch the product.

**Pydantic response schemas:**
- Define `ProductOut` with the fields the frontend needs: title, photo URL, description, store
- Define `PromotionOut` with prices, affiliate URL, timestamps, and a nested `ProductOut`
- Use `model_config = {"from_attributes": True}` so Pydantic can read from SQLAlchemy objects

---

## Testing the pipeline

1. Make sure you have a user registered and subscribed to the "Gym & Sports" niche.
2. Trigger the pipeline:
   ```bash
   curl -X POST http://localhost:8000/internal/fetch
   ```
3. Check the database directly to confirm rows were created:
   ```bash
   docker compose exec db psql -U promobot_user -d promobot -c "SELECT id, title FROM products LIMIT 5;"
   docker compose exec db psql -U promobot_user -d promobot -c "SELECT id, promo_price, expires_at FROM promotions LIMIT 5;"
   ```
4. Trigger the pipeline a second time and verify no duplicate products are created — only new Promotion rows.
5. Call `GET /promotions` with your JWT and verify you get the stored data.

---

## Acceptance Criteria

- [ ] `POST /internal/fetch` runs without errors and creates rows in `products` and `promotions`
- [ ] Running the pipeline twice does not create duplicate `Product` rows for the same ML product
- [ ] Products have a non-empty `gemini_description`
- [ ] Promotion rows have an `expires_at` approximately 30 minutes from creation
- [ ] Affiliate URLs contain your affiliate ID
- [ ] `GET /promotions` returns only non-expired promotions for the user's subscribed niches
- [ ] `GET /promotions` returns an empty array for a user with no subscribed niches
- [ ] `GET /promotions` returns 401 without a valid JWT
- [ ] The response includes nested product data (title, photo, description) — not just IDs
