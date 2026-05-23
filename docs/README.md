# PromoBot — Development Docs

## Start here

**Before writing any code**, read the stack guide. It explains every library used in this project with practical examples and comparisons to Java/Spring Boot and Node.js.

| File | Purpose |
|---|---|
| [stack-guide.md](stack-guide.md) | Learn the Python libraries: FastAPI, SQLAlchemy, Pydantic, bcrypt, PyJWT, httpx, aio-pika, asyncpg |

---

## Milestones

Read each milestone doc before starting it, not while doing it.

| File | Milestone | Days | Focus |
|---|---|---|---|
| [milestone-0-foundation.md](milestone-0-foundation.md) | M0 | May 22–23 | Repo setup, FastAPI skeleton, SQLAlchemy models, DB seed |
| [milestone-1-auth-react-shell.md](milestone-1-auth-react-shell.md) | M1 | May 24–25 | Auth endpoints (A+B) + static React pages (C) in parallel |
| [milestone-2-promotion-pipeline.md](milestone-2-promotion-pipeline.md) | M2 | May 26–27 | Mercado Livre fetch + Gemini + DB pipeline |
| [milestone-3-integrations.md](milestone-3-integrations.md) | M3 | May 28–29 | RabbitMQ (aio-pika) + PostgreSQL LISTEN/NOTIFY |
| [milestone-4-frontend-wiring.md](milestone-4-frontend-wiring.md) | M4 | May 30 | Connect all React pages to real endpoints |
| [milestone-5-deploy.md](milestone-5-deploy.md) | M5 | May 31 | Render + Vercel + CloudAMQP + smoke test |

---

## Ground rules

- Do not start a milestone until all blocking tasks (🔴) from the previous one are done.
- Every milestone ends with an **Acceptance Criteria** checklist — tick every item before closing.
- Shared tasks (👥) can be picked up by any member who finishes their primary tasks early.
- When in doubt, read `CLAUDE.md` at the project root for architecture decisions and rationale.
