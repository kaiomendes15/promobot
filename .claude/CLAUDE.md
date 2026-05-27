# PromoBot

Web platform that curates and distributes niche-segmented promotions from Mercado Livre, with AI-generated descriptions via Google Gemini.

## Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12 + FastAPI |
| ORM | SQLAlchemy |
| Database | PostgreSQL 16 |
| Message queue | RabbitMQ via CloudAMQP + aio-pika |
| HTTP client | httpx |
| Auth | PyJWT + bcrypt |
| Frontend | React 18 (Vite) + React Router + Axios |
| Deploy | Render (API + DB) · Vercel (frontend) · CloudAMQP (RabbitMQ) |

## Project Structure

```
promobot/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app + lifespan
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routers/         # FastAPI routers (auth, users, promotions)
│   │   ├── services/        # Business logic (pipeline, gemini, ml_api)
│   │   ├── integrations/    # External clients (mercadolivre.py, gemini.py)
│   │   └── worker/          # RabbitMQ consumer + LISTEN/NOTIFY listener
│   ├── .env                 # Local env vars (never commit)
│   ├── .env.example         # Env var template (commit this)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/           # Register, Login, Niches, Promotions
    │   ├── components/
    │   └── api/             # Axios client
    ├── .env                 # VITE_API_URL
    └── package.json
```

## Environment Variables

```bash
# backend/.env
DATABASE_URL=postgresql://...
RABBITMQ_URL=amqp://...        # CloudAMQP connection string
MERCADOLIVRE_CLIENT_ID=...
MERCADOLIVRE_CLIENT_SECRET=...
MERCADOLIVRE_AFFILIATE_ID=...
GEMINI_API_KEY=...
JWT_SECRET=...
JWT_ALGORITHM=HS256

# frontend/.env
VITE_API_URL=http://localhost:8000
```

## Common Commands

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Data Model

```
Niche          — id, name, ml_category_id
User           — id, email, hashed_password, created_at
user_niches    — user_id FK, niche_id FK  (many-to-many)
Product        — id, ml_product_id (unique), title, photo_url, gemini_description, store, created_at
Promotion      — id, product_id FK, niche_id FK, original_price, promo_price, affiliate_url, created_at, expires_at
```

## Integration Techniques

| Technique | Implementation |
|---|---|
| **API** | `httpx` → Mercado Livre REST API + Google Gemini API |
| **Message** | CloudAMQP (RabbitMQ) + `aio-pika` — async promotion fetch job |
| **Event** | PostgreSQL `LISTEN/NOTIFY` — observer reacts when a Promotion row is inserted |

## Key Architecture Decisions

- **No Celery.** The message worker uses `aio-pika` directly inside the FastAPI lifespan — simpler, no separate broker abstraction.
- **No internal API key.** The worker is an internal process; JWT auth covers only end-user endpoints.
- **Gemini called once per new product.** Descriptions are persisted on `Product` and reused if the same `ml_product_id` appears again.
- **Niche is a DB table, not an enum.** Seeded with "Gym & Sports". Add new niches by inserting a row.
- **Incremental setup.** Do not configure RabbitMQ, Alembic, or any integration before the milestone that needs it.

## Walking Skeleton (build order)

1. `POST /auth/register` + `POST /auth/login` → JWT
2. `POST /users/me/niches` → subscribe to niche
3. `POST /internal/fetch` → manually trigger one pipeline run (no RabbitMQ yet)
4. Mercado Livre → Gemini → Product + Promotion in DB
5. `GET /promotions` → return promotions for user's niches
6. Wire RabbitMQ: producer + aio-pika consumer
7. Wire PostgreSQL LISTEN/NOTIFY
8. Connect React frontend to real endpoints

## Milestones

| Milestone | Days | Focus |
|---|---|---|
| M0 — Foundation | May 22–23 | Repo, FastAPI skeleton, SQLAlchemy models, DB seed |
| M1 — Auth + React shell | May 24–25 | Auth endpoints + static React pages (parallel) |
| M2 — Promotion pipeline | May 26–27 | ML fetch + Gemini + DB write |
| M3 — Integrations | May 28–29 | RabbitMQ (aio-pika) + PostgreSQL LISTEN/NOTIFY |
| M4 — Frontend wiring | May 30 | Connect all React pages to real endpoints |
| M5 — Deploy + test | May 31 | Render + Vercel + CloudAMQP + smoke test |

## Out of Scope

- Celery, Docker, self-hosted RabbitMQ
- Internal API key auth
- Rate limiting, caching layer
- SSE / WebSockets
- Multi-store support (only Mercado Livre for now; `store` field exists for future use)
- Alembic migrations (add only when models are stable)
