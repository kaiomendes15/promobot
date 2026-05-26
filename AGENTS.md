# PromoBot Agent Guide

This repository follows the same project guidance as `CLAUDE.md`.

## Stack

- Backend: Python 3.12, FastAPI, SQLAlchemy, PostgreSQL 16
- Auth: PyJWT and bcrypt
- Frontend: React 18 with Vite, React Router, and Axios
- Later milestones add Mercado Livre, Gemini, CloudAMQP with `aio-pika`, and PostgreSQL `LISTEN/NOTIFY`

## Project Shape

- Backend code lives under `backend/app/`.
- SQLAlchemy models import the shared `Base` from `app.database`.
- Routers live under `backend/app/routers/` and are registered in `app.main`.
- Pydantic schemas live under `backend/app/schemas/`.
- Keep the build incremental; do not add RabbitMQ, Alembic, or external integrations before the milestone that needs them.

## Commands

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```bash
docker compose up -d db
```

## Architecture Notes

- JWT auth protects end-user endpoints only.
- No internal API key is planned.
- Niche is a database table, not an enum.
- The worker will use `aio-pika` directly in a later milestone; do not introduce Celery.
