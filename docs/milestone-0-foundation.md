# Milestone 0 — Foundation

**Days:** May 22–23  
**Owner:** All 3 members together  
**Goal:** A running FastAPI app connected to PostgreSQL with all models defined. Every member must be able to run the project locally before this milestone closes.

> Nothing in Milestone 1 or later can start until this is done. Do not split work until every member has the app running.

---

## Prerequisites

- Python 3.12 installed
- PostgreSQL 16 installed locally (or use a Docker container just for the DB)
- Node.js 18+ installed (for frontend later)
- Git configured

---

## Tasks

### 1. Initialize the repository

Create the folder structure below. Do not create files you don't need yet — empty folders with a `.gitkeep` are fine.

```
promobot/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── niche.py
│   │       ├── user.py
│   │       └── promotion.py
│   ├── .env
│   ├── .env.example
│   └── requirements.txt
├── frontend/            ← leave empty for now
├── docs/
├── .gitignore
├── CLAUDE.md
└── README.md
```

**`.gitignore` must include:**
```
__pycache__/
*.pyc
.env
venv/
.venv/
node_modules/
dist/
```

**`.env.example`** (commit this, never commit `.env`):
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/promobot
RABBITMQ_URL=amqp://user:password@host/vhost
MERCADOLIVRE_CLIENT_ID=your_client_id
MERCADOLIVRE_CLIENT_SECRET=your_client_secret
MERCADOLIVRE_AFFILIATE_ID=your_affiliate_id
GEMINI_API_KEY=your_gemini_key
JWT_SECRET=change_this_to_a_long_random_string
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
```

Each member creates their own `.env` from this template.

---

### 2. Python virtual environment and dependencies

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate       # Linux/Mac
# venv\Scripts\activate        # Windows

pip install fastapi uvicorn[standard] sqlalchemy psycopg2-binary python-dotenv pydantic pydantic-settings bcrypt pyjwt httpx aio-pika google-generativeai

pip freeze > requirements.txt
```

**Why these packages:**
- `fastapi` + `uvicorn` — the web server
- `sqlalchemy` — ORM for interacting with PostgreSQL
- `psycopg2-binary` — PostgreSQL driver for SQLAlchemy
- `python-dotenv` — loads `.env` into environment variables
- `pydantic` / `pydantic-settings` — data validation and settings management
- `bcrypt` — password hashing
- `pyjwt` — JWT creation and verification
- `httpx` — async HTTP client for calling Mercado Livre and Gemini
- `aio-pika` — async RabbitMQ client (added now so it's in requirements, configured in M3)
- `google-generativeai` — Gemini SDK

---

### 3. Database connection (`app/database.py`)

This file sets up SQLAlchemy to connect to PostgreSQL and provides a session dependency for FastAPI routes.

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**How it works:**
- `create_engine` opens a connection pool to PostgreSQL.
- `SessionLocal` is a factory that creates database sessions.
- `get_db` is a FastAPI dependency — routes declare `db: Session = Depends(get_db)` and get a fresh session per request, automatically closed when done.
- `Base` is the base class all models will inherit from.

---

### 4. SQLAlchemy models

#### `app/models/niche.py`
```python
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Niche(Base):
    __tablename__ = "niches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    ml_category_id = Column(String, nullable=False)

    promotions = relationship("Promotion", back_populates="niche")
    users = relationship("User", secondary="user_niches", back_populates="niches")
```

#### `app/models/user.py`
```python
from sqlalchemy import Column, Integer, String, DateTime, Table, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

user_niches = Table(
    "user_niches",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("niche_id", Integer, ForeignKey("niches.id"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    niches = relationship("Niche", secondary=user_niches, back_populates="users")
```

#### `app/models/promotion.py`
```python
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    ml_product_id = Column(String, nullable=False, unique=True, index=True)
    title = Column(String, nullable=False)
    photo_url = Column(String)
    gemini_description = Column(String)
    store = Column(String, nullable=False, default="mercadolivre")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    promotions = relationship("Promotion", back_populates="product")

class Promotion(Base):
    __tablename__ = "promotions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    niche_id = Column(Integer, ForeignKey("niches.id"), nullable=False)
    original_price = Column(Numeric(10, 2), nullable=False)
    promo_price = Column(Numeric(10, 2), nullable=False)
    affiliate_url = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

    product = relationship("Product", back_populates="promotions")
    niche = relationship("Niche", back_populates="promotions")
```

**Why `Numeric(10, 2)` for prices?** Floating-point types (`Float`, `Double`) have rounding errors. `Numeric(10, 2)` stores exact decimal values — essential for money.

#### `app/models/__init__.py`
Import all models here so SQLAlchemy knows they exist when creating tables:
```python
from app.models.niche import Niche
from app.models.user import User, user_niches
from app.models.promotion import Product, Promotion
```

---

### 5. FastAPI app entry point (`app/main.py`)

```python
from fastapi import FastAPI
from app.database import engine, Base
from app.models import Niche, User, Product, Promotion  # ensures models are registered

app = FastAPI(title="PromoBot API")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    seed_niches()

def seed_niches():
    from sqlalchemy.orm import Session
    from app.models.niche import Niche
    db = Session(engine)
    try:
        if not db.query(Niche).first():
            db.add(Niche(name="Gym & Sports", ml_category_id="MS174162"))
            db.commit()
    finally:
        db.close()

@app.get("/health")
def health():
    return {"status": "ok"}
```

**Why `create_all` on startup?** For now, SQLAlchemy creates the tables from your models automatically. This avoids needing Alembic migrations while the schema is still changing. Once the schema stabilizes, Alembic can be added.

**`ml_category_id` for Gym & Sports:** Mercado Livre's category ID for "Esportes e Fitness" is `MS174162`. Verify this in the ML API explorer if needed.

---

### 6. Create the local database

```bash
# Open PostgreSQL
psql -U postgres

# Inside psql:
CREATE DATABASE promobot;
CREATE USER promobot_user WITH PASSWORD 'promobot_pass';
GRANT ALL PRIVILEGES ON DATABASE promobot TO promobot_user;
\q
```

Update your `.env`:
```
DATABASE_URL=postgresql://promobot_user:promobot_pass@localhost:5432/promobot
```

---

### 7. Run and verify

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

Test the health endpoint:
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok"}
```

Open the auto-generated docs: http://localhost:8000/docs

Verify tables were created:
```bash
psql -U promobot_user -d promobot -c "\dt"
# Should list: niches, users, user_niches, products, promotions

psql -U promobot_user -d promobot -c "SELECT * FROM niches;"
# Should show: 1 | Gym & Sports | MS174162
```

---

## Acceptance Criteria

- [ ] All 3 members can clone the repo and run the app with `uvicorn app.main:app --reload`
- [ ] `GET /health` returns `{"status": "ok"}`
- [ ] All 5 tables exist in PostgreSQL (`niches`, `users`, `user_niches`, `products`, `promotions`)
- [ ] The `niches` table has one row: "Gym & Sports"
- [ ] `.env` is in `.gitignore` and is NOT committed
- [ ] `requirements.txt` is committed and up to date
