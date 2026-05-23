# Milestone 0 — Foundation

**Days:** May 22–23  
**Owner:** All 3 members together  
**Goal:** A running FastAPI app connected to PostgreSQL, with all database models defined and a seed row in the `niches` table. Every member must run the project locally before this milestone closes.

> Nothing in Milestone 1 or later starts until every member has the app running. Do not split work yet.

---

## Prerequisites

- Python 3.12 installed
- Docker + Docker Compose installed (used for the local database — no manual PostgreSQL setup)
- Node.js 18+ installed (needed in Milestone 1 for the frontend)
- Git configured

**Read first:** [`stack-guide.md`](stack-guide.md) — sections on FastAPI, SQLAlchemy, and python-dotenv.

---

## What you are building

A FastAPI app that:
1. Connects to a PostgreSQL database via SQLAlchemy
2. Creates all tables automatically on startup
3. Seeds the `niches` table with one row ("Gym & Sports")
4. Exposes a `GET /health` endpoint that returns `{"status": "ok"}`

There is no auth, no business logic, and no external API calls yet. Just the skeleton.

---

## Step 1 — Repository structure

Agree on a folder structure before anyone writes code. A suggested layout:

```
promobot/
├── backend/
│   ├── app/
│   │   ├── main.py        ← FastAPI app entry point
│   │   ├── database.py    ← SQLAlchemy engine and session
│   │   └── models/        ← one file per model group
│   ├── .env               ← local secrets, never committed
│   ├── .env.example       ← template with placeholder values, committed
│   └── requirements.txt
├── frontend/              ← leave empty for now
├── docs/
├── docker-compose.yml
├── .gitignore
└── CLAUDE.md
```

**Important:** `.env` must be in `.gitignore` from the first commit. Commit `.env.example` instead.

---

## Step 2 — Python environment and dependencies

Research: Python virtual environments (`venv`), `pip install`, `pip freeze`.

Create a virtual environment inside `backend/`, activate it, and install the project dependencies. The full list of packages needed for the entire project is in `CLAUDE.md`. Install them all now so `requirements.txt` is complete from the start.

Conceptual reminder — virtual environments isolate project dependencies:
```bash
python3.12 -m venv venv
source venv/bin/activate   # activates the environment
pip install <packages>
pip freeze > requirements.txt
```

---

## Step 3 — Environment variables

Research: `python-dotenv`, `os.getenv()`.

Create `.env.example` with all the variable names the project needs (see `CLAUDE.md` for the full list) but with placeholder values. Each member creates their own `.env` from this template and fills in real values.

The app should read these variables using `python-dotenv`. The database connection string follows this format:
```
postgresql://user:password@host:port/database_name
```

---

## Step 4 — Database connection

Research: SQLAlchemy's `create_engine`, `sessionmaker`, `DeclarativeBase`, and the `get_db` dependency pattern for FastAPI.

Create `app/database.py`. This file is responsible for:
- Creating the SQLAlchemy engine from the `DATABASE_URL` environment variable
- Providing a `SessionLocal` factory for creating database sessions
- Defining a `Base` class that all models will inherit from
- Providing a `get_db` function that FastAPI routes will use as a dependency to get a database session

Think about: why does `get_db` use `yield` instead of `return`? Research Python generator functions and FastAPI's dependency lifecycle.

---

## Step 5 — Database models

Research: SQLAlchemy ORM models, `Column`, data types (`Integer`, `String`, `DateTime`, `Numeric`, `ForeignKey`), `relationship`, many-to-many associations with a secondary table.

Define the following models. Think carefully about which fields each entity needs before writing any code — refer to the data model in `CLAUDE.md`.

- **Niche** — maps to a `niches` table
- **User** — maps to a `users` table
- **user_niches** — a join table (not a full model, just a `Table` definition) for the many-to-many between User and Niche
- **Product** — maps to a `products` table
- **Promotion** — maps to a `promotions` table

Key questions to answer through research:
- How do you define a many-to-many relationship in SQLAlchemy without creating a full model class for the join table?
- What SQLAlchemy type should you use for monetary values (prices)? Why not `Float`?
- What does `server_default=func.now()` do on a `DateTime` column?
- What does `back_populates` do in a `relationship`?

Organize models into separate files under `app/models/` and create an `__init__.py` that imports all of them. SQLAlchemy needs to "see" all models before it can create tables.

---

## Step 6 — Start the database with Docker Compose

The `docker-compose.yml` at the project root starts a PostgreSQL 16 container with the correct database name, user, and password already configured.

```bash
# from the project root
docker compose up -d
```

This is all any member needs to do — no manual database creation required. The database is available at `localhost:5432`.

Useful commands:
```bash
docker compose up -d       # start in background
docker compose down        # stop (data is preserved)
docker compose down -v     # stop and wipe all data (full reset)
docker compose logs db     # view PostgreSQL logs
```

Update your `.env` so `DATABASE_URL` points to `localhost:5432` with the credentials defined in `docker-compose.yml`.

---

## Step 7 — FastAPI app entry point

Research: FastAPI's `lifespan` context manager (the modern replacement for `@app.on_event("startup")`), `Base.metadata.create_all()`.

Create `app/main.py`. It should:
1. Define a `lifespan` function that runs on app startup and shutdown
2. On startup: call `create_all` to create all tables from your models, then seed the `niches` table if it is empty
3. Create the FastAPI `app` instance using the `lifespan`
4. Define a `GET /health` route that returns `{"status": "ok"}`

For seeding: query the `Niche` table — if it has no rows, insert one for "Gym & Sports". Research the Mercado Livre category API or the developer docs to find the correct category ID for sports/fitness.

---

## Step 8 — Run and verify

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Verify:
- The app starts without errors
- `GET /health` returns `{"status": "ok"}` (test with curl or the browser)
- The auto-generated docs load at http://localhost:8000/docs
- Tables exist in the database:
  ```bash
  docker compose exec db psql -U promobot_user -d promobot -c "\dt"
  ```
- The `niches` table has one row:
  ```bash
  docker compose exec db psql -U promobot_user -d promobot -c "SELECT * FROM niches;"
  ```

---

## Acceptance Criteria

- [ ] All 3 members can clone the repo and run the app with `uvicorn app.main:app --reload`
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] All 5 tables exist: `niches`, `users`, `user_niches`, `products`, `promotions`
- [ ] `niches` table has one row: "Gym & Sports"
- [ ] `.env` is not committed; `.env.example` is committed with placeholder values
- [ ] `requirements.txt` is committed and complete
