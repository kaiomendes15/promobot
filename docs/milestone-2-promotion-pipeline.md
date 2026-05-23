# Milestone 2 — Promotion Pipeline

**Days:** May 26–27  
**Owners:** Person B leads · Person A (Gemini client) · Person C (wire GET /promotions to frontend if ready)  
**Goal:** A working end-to-end pipeline that fetches promotions from Mercado Livre, generates a description with Gemini, builds an affiliate URL, and stores the result in the database. Triggered manually via an HTTP endpoint.

> **Prerequisite:** JWT middleware from Milestone 1 must be complete before starting.

---

## How the pipeline works (big picture)

```
POST /internal/fetch
        │
        ▼
Fetch promotions from Mercado Livre API (by niche category)
        │
        ▼
For each product returned:
  ├── Does a Product row with this ml_product_id exist?
  │     ├── YES → reuse existing gemini_description
  │     └── NO  → call Gemini API → save new Product row
  │
  ▼
Build affiliate URL
        │
        ▼
Insert Promotion row (with price snapshot + affiliate URL + expires_at)
        │
        ▼
Clean up expired Promotions (expires_at < now)
```

---

## File structure for this milestone

```
backend/app/
├── integrations/
│   ├── __init__.py
│   ├── mercadolivre.py     ← httpx client for ML API
│   └── gemini.py           ← Gemini SDK client
├── services/
│   ├── __init__.py
│   └── pipeline.py         ← orchestrates the full fetch flow
├── routers/
│   ├── internal.py         ← POST /internal/fetch (manual trigger)
│   └── promotions.py       ← GET /promotions (user-facing)
└── schemas/
    └── promotion.py        ← response schemas
```

---

## Task B-1: Mercado Livre API client (`app/integrations/mercadolivre.py`) — Person B

### Getting API credentials

1. Go to https://developers.mercadolivre.com.br and create a free application.
2. You get a `client_id` and `client_secret`.
3. To call the API, you first need an access token. For server-to-server calls (no user login), use the **Client Credentials** flow:

```bash
curl -X POST https://api.mercadolibre.com/oauth/token \
  -d "grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET"
```

This returns an `access_token` valid for 6 hours.

### The client

```python
import httpx
import os
from datetime import datetime, timedelta, timezone

class MercadoLivreClient:
    BASE_URL = "https://api.mercadolibre.com"
    _token: str | None = None
    _token_expires_at: datetime | None = None

    async def _get_token(self) -> str:
        if self._token and datetime.now(timezone.utc) < self._token_expires_at:
            return self._token

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/oauth/token",
                data={
                    "grant_type": "client_credentials",
                    "client_id": os.getenv("MERCADOLIVRE_CLIENT_ID"),
                    "client_secret": os.getenv("MERCADOLIVRE_CLIENT_SECRET"),
                },
            )
            response.raise_for_status()
            data = response.json()
            self._token = data["access_token"]
            # tokens are valid 6h, refresh after 5h to be safe
            self._token_expires_at = datetime.now(timezone.utc) + timedelta(hours=5)
            return self._token

    async def fetch_promotions(self, category_id: str, limit: int = 10) -> list[dict]:
        token = await self._get_token()
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/sites/MLB/search",
                params={
                    "category": category_id,
                    "sort": "price_asc",    # cheapest first — adjust to your needs
                    "promotions": "true",   # only discounted items
                    "limit": limit,
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            response.raise_for_status()
            results = response.json().get("results", [])

        return [
            {
                "ml_product_id": item["id"],
                "title": item["title"],
                "photo_url": item.get("thumbnail", "").replace("http://", "https://"),
                "original_price": item.get("original_price") or item["price"],
                "promo_price": item["price"],
            }
            for item in results
            if item.get("original_price") and item["original_price"] > item["price"]
        ]

ml_client = MercadoLivreClient()
```

**Key points:**
- `thumbnail` from the ML API is an HTTP URL — we force HTTPS to avoid mixed-content issues in browsers.
- We filter only items where `original_price > price` (real discounts only).
- The token is cached in memory and refreshed automatically when it expires.

### Building the affiliate URL

Mercado Livre affiliate links follow this pattern:
```
https://www.mercadolivre.com.br/[product-path]?matt_tool=[AFFILIATE_ID]
```

The simplest approach: take the product's `permalink` from the ML API response and append the affiliate query param.

```python
def build_affiliate_url(permalink: str) -> str:
    affiliate_id = os.getenv("MERCADOLIVRE_AFFILIATE_ID")
    separator = "&" if "?" in permalink else "?"
    return f"{permalink}{separator}matt_tool={affiliate_id}"
```

Add `"permalink": item.get("permalink", "")` to the dict returned by `fetch_promotions`.

---

## Task A-1: Gemini API client (`app/integrations/gemini.py`) — Person A

### Getting an API key

1. Go to https://aistudio.google.com and sign in.
2. Create an API key (free tier available).
3. Add it to your `.env` as `GEMINI_API_KEY`.

### The client

```python
import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

async def generate_product_description(title: str, original_price: float, promo_price: float) -> str:
    discount_pct = round((1 - promo_price / original_price) * 100)
    prompt = (
        f"You are a promotions curator for a Brazilian deals channel. "
        f"Write an informal, enthusiastic promotional message in Portuguese (Brazil) "
        f"for the following product. Keep it under 3 sentences. "
        f"Do not include the price in the message — it will be shown separately.\n\n"
        f"Product: {title}\n"
        f"Discount: {discount_pct}% off"
    )
    response = await model.generate_content_async(prompt)
    return response.text.strip()
```

**Why `gemini-1.5-flash`?** It's the fastest and cheapest Gemini model, more than sufficient for generating short promotional descriptions. Use it unless you need complex reasoning.

**Why async?** FastAPI runs in an async event loop. Using `generate_content_async` avoids blocking the loop while waiting for Gemini's response.

---

## Task B-2: Pipeline service (`app/services/pipeline.py`) — Person B

This is the heart of the system. It orchestrates all the steps.

```python
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.promotion import Product, Promotion
from app.models.niche import Niche
from app.integrations.mercadolivre import ml_client, build_affiliate_url
from app.integrations.gemini import generate_product_description

async def run_pipeline_for_niche(niche: Niche, db: Session) -> int:
    """
    Fetches promotions for a niche, generates descriptions for new products,
    and stores Promotion rows. Returns the number of promotions created.
    """
    raw_products = await ml_client.fetch_promotions(niche.ml_category_id)
    created_count = 0

    for raw in raw_products:
        # 1. Check if we already have this product
        product = db.query(Product).filter(
            Product.ml_product_id == raw["ml_product_id"]
        ).first()

        # 2. If new, generate a Gemini description and save the product
        if not product:
            description = await generate_product_description(
                title=raw["title"],
                original_price=float(raw["original_price"]),
                promo_price=float(raw["promo_price"]),
            )
            product = Product(
                ml_product_id=raw["ml_product_id"],
                title=raw["title"],
                photo_url=raw["photo_url"],
                gemini_description=description,
                store="mercadolivre",
            )
            db.add(product)
            db.flush()  # assigns product.id without committing

        # 3. Build affiliate URL
        affiliate_url = build_affiliate_url(raw["permalink"])

        # 4. Create the promotion (price snapshot, expires in 30 minutes)
        promotion = Promotion(
            product_id=product.id,
            niche_id=niche.id,
            original_price=raw["original_price"],
            promo_price=raw["promo_price"],
            affiliate_url=affiliate_url,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
        db.add(promotion)
        created_count += 1

    db.commit()
    return created_count

def cleanup_expired_promotions(db: Session) -> int:
    """Deletes promotions past their expiry time."""
    count = db.query(Promotion).filter(
        Promotion.expires_at < datetime.now(timezone.utc)
    ).delete()
    db.commit()
    return count
```

**Why `db.flush()` before `db.commit()`?**  
`flush` sends the INSERT to the database within the current transaction (so `product.id` gets assigned) without committing. This lets us use `product.id` as the foreign key on `Promotion` in the same transaction. Everything commits together at the end — if anything fails, the whole batch rolls back.

---

## Task B-3: Manual trigger endpoint (`app/routers/internal.py`) — Person B

This endpoint is for testing the pipeline without RabbitMQ. It will be removed or gated in Milestone 3.

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.niche import Niche
from app.services.pipeline import run_pipeline_for_niche, cleanup_expired_promotions

router = APIRouter(prefix="/internal", tags=["internal"])

@router.post("/fetch")
async def trigger_fetch(db: Session = Depends(get_db)):
    niches = db.query(Niche).all()
    results = {}
    for niche in niches:
        count = await run_pipeline_for_niche(niche, db)
        results[niche.name] = count

    cleaned = cleanup_expired_promotions(db)
    return {"promotions_created": results, "expired_cleaned": cleaned}
```

---

## Task A-2: GET promotions endpoint (`app/routers/promotions.py`) — Person A

Returns promotions for the authenticated user's subscribed niches.

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.user import User
from app.models.promotion import Promotion
from app.auth import get_current_user
from app.schemas.promotion import PromotionOut
from datetime import datetime, timezone

router = APIRouter(prefix="/promotions", tags=["promotions"])

@router.get("", response_model=list[PromotionOut])
def get_promotions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    niche_ids = [niche.id for niche in current_user.niches]
    if not niche_ids:
        return []

    return (
        db.query(Promotion)
        .options(joinedload(Promotion.product), joinedload(Promotion.niche))
        .filter(
            Promotion.niche_id.in_(niche_ids),
            Promotion.expires_at > datetime.now(timezone.utc),
        )
        .order_by(Promotion.created_at.desc())
        .all()
    )
```

**Why `joinedload`?** Without it, accessing `promotion.product` inside the response serialization would trigger a separate SQL query per promotion (the "N+1 problem"). `joinedload` fetches all products and niches in a single JOIN query.

### Promotion schema (`app/schemas/promotion.py`)

```python
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

class ProductOut(BaseModel):
    id: int
    title: str
    photo_url: str | None
    gemini_description: str | None
    store: str

    model_config = {"from_attributes": True}

class PromotionOut(BaseModel):
    id: int
    original_price: Decimal
    promo_price: Decimal
    affiliate_url: str
    created_at: datetime
    expires_at: datetime
    product: ProductOut

    model_config = {"from_attributes": True}
```

---

## Register new routers in `app/main.py`

```python
from app.routers import auth, users, internal, promotions

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(internal.router)
app.include_router(promotions.router)
```

---

## Testing the pipeline

1. Make sure you have a valid JWT from a logged-in user subscribed to the "Gym & Sports" niche.

2. Trigger the pipeline:
```bash
curl -X POST http://localhost:8000/internal/fetch
# Expected: {"promotions_created": {"Gym & Sports": 10}, "expired_cleaned": 0}
```

3. Verify the database:
```bash
psql -U promobot_user -d promobot -c "SELECT id, title FROM products LIMIT 5;"
psql -U promobot_user -d promobot -c "SELECT id, promo_price, expires_at FROM promotions LIMIT 5;"
```

4. Fetch promotions as a user:
```bash
curl http://localhost:8000/promotions \
  -H "Authorization: Bearer <your_token>"
# Expected: JSON array of promotions with nested product data
```

5. Trigger the pipeline again and verify no duplicate products are created (only new Promotion rows):
```bash
curl -X POST http://localhost:8000/internal/fetch
psql -U promobot_user -d promobot -c "SELECT COUNT(*) FROM products;"
# Count should be the same as before — no new products inserted
```

---

## Acceptance Criteria

- [ ] `POST /internal/fetch` runs without errors and creates Promotion rows in the DB
- [ ] Products that already exist in the DB do not trigger a new Gemini call (verify by checking product count stays the same on second run)
- [ ] Promotions have a correct `expires_at` (30 minutes from creation)
- [ ] `GET /promotions` returns only non-expired promotions for the user's subscribed niches
- [ ] `GET /promotions` returns an empty array for a user with no subscribed niches
- [ ] `GET /promotions` returns 401 without a JWT
- [ ] Affiliate URLs are present and contain the affiliate ID
- [ ] Each promotion's product has a `gemini_description` that is non-empty
