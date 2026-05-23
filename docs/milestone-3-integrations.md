# Milestone 3 — Message + Event Integrations

**Days:** May 28–29  
**Owners:** Person B leads · Person A supports  
**Goal:** The promotion pipeline is triggered by a RabbitMQ message (not a direct HTTP call), and the system observes new promotion inserts via PostgreSQL LISTEN/NOTIFY. These are the two graded integration techniques beyond REST API.

> **Prerequisite:** The full pipeline from Milestone 2 must be working. Person C continues wiring the frontend to real endpoints in parallel.

---

## Overview of what gets added

```
Before M3 (M2 state):
  POST /internal/fetch  →  pipeline runs  →  DB

After M3:
  Producer (timer/HTTP call)  →  RabbitMQ queue  →  aio-pika consumer  →  pipeline runs  →  DB
                                                                                               │
                                                                              PostgreSQL NOTIFY ◄─┘
                                                                                               │
                                                                              FastAPI LISTEN listener reacts
```

---

## Part 1 — Message Queue: RabbitMQ + aio-pika

### What is aio-pika?

`aio-pika` is an async Python library for RabbitMQ. It speaks the AMQP protocol — the same protocol RabbitMQ uses. You don't need Celery or any task framework on top of it. You talk directly to RabbitMQ: publish a message to a queue, consume messages from a queue.

### CloudAMQP setup

1. Create a free account at https://www.cloudamqp.com
2. Create a new instance (plan: "Little Lemur" — free tier)
3. Copy the **AMQP URL** from your instance dashboard. It looks like:
   ```
   amqp://user:password@host.rmq.cloudamqp.com/vhost
   ```
4. Add it to your `.env`:
   ```
   RABBITMQ_URL=amqp://user:password@host.rmq.cloudamqp.com/vhost
   ```

---

### Task B-1: RabbitMQ connection and consumer (`app/worker/consumer.py`) — Person B

The consumer is a long-running async function that connects to RabbitMQ, declares a queue, and waits for messages. When a message arrives, it runs the pipeline.

```python
import asyncio
import os
import aio_pika
from sqlalchemy.orm import Session
from app.database import engine
from app.models.niche import Niche
from app.services.pipeline import run_pipeline_for_niche, cleanup_expired_promotions

QUEUE_NAME = "fetch_promotions"

async def start_consumer():
    url = os.getenv("RABBITMQ_URL")
    connection = await aio_pika.connect_robust(url)

    async with connection:
        channel = await connection.channel()
        queue = await channel.declare_queue(QUEUE_NAME, durable=True)

        print(f"[RabbitMQ] Waiting for messages on queue '{QUEUE_NAME}'...")

        async for message in queue:
            async with message.process():
                await handle_message(message)

async def handle_message(message: aio_pika.IncomingMessage):
    print(f"[RabbitMQ] Received message: {message.body.decode()}")
    db = Session(engine)
    try:
        niches = db.query(Niche).all()
        for niche in niches:
            count = await run_pipeline_for_niche(niche, db)
            print(f"[Pipeline] {niche.name}: {count} promotions created")
        cleaned = cleanup_expired_promotions(db)
        print(f"[Pipeline] {cleaned} expired promotions cleaned")
    except Exception as e:
        print(f"[Pipeline] Error: {e}")
    finally:
        db.close()
```

**Why `connect_robust`?** It automatically reconnects if the RabbitMQ connection drops (network hiccup, broker restart). Without this, your consumer would silently die and stop processing messages.

**Why `durable=True` on the queue?** If RabbitMQ restarts, a durable queue survives. Without this, the queue and any unprocessed messages disappear on broker restart.

**`async with message.process()`** — this context manager automatically sends an acknowledgement (ack) to RabbitMQ when the block exits successfully. If an exception is raised, it sends a negative ack (nack) and the message is re-queued. This ensures no message is lost if the pipeline crashes mid-run.

---

### Task A-1: Producer (`app/worker/producer.py`) — Person A

The producer publishes a message to the queue to trigger the pipeline. It can be called from a timer, from an HTTP endpoint, or manually.

```python
import os
import json
import aio_pika

QUEUE_NAME = "fetch_promotions"

async def publish_fetch_trigger(reason: str = "scheduled"):
    url = os.getenv("RABBITMQ_URL")
    connection = await aio_pika.connect_robust(url)

    async with connection:
        channel = await connection.channel()
        await channel.declare_queue(QUEUE_NAME, durable=True)

        body = json.dumps({"trigger": reason}).encode()
        await channel.default_exchange.publish(
            aio_pika.Message(body=body, delivery_mode=aio_pika.DeliveryMode.PERSISTENT),
            routing_key=QUEUE_NAME,
        )
        print(f"[RabbitMQ] Published fetch trigger: {reason}")
```

**`delivery_mode=PERSISTENT`** — marks the message as persistent on disk in RabbitMQ. If the broker restarts before the consumer processes it, the message survives.

---

### Task B-2: Wire everything into the FastAPI lifespan (`app/main.py`) — Person B

The FastAPI `lifespan` context manager is the correct way to start and stop background tasks. Replace the `@app.on_event("startup")` pattern with `lifespan`:

```python
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import engine, Base
from app.models import Niche, User, Product, Promotion
from app.worker.consumer import start_consumer
from app.worker.producer import publish_fetch_trigger

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    seed_niches()

    # Start RabbitMQ consumer in the background
    consumer_task = asyncio.create_task(start_consumer())

    # Publish an initial fetch trigger when the app starts
    await publish_fetch_trigger(reason="startup")

    # Start a periodic trigger (every 30 minutes)
    periodic_task = asyncio.create_task(periodic_fetch_trigger())

    yield  # app is running here

    # Shutdown — cancel background tasks
    consumer_task.cancel()
    periodic_task.cancel()

async def periodic_fetch_trigger():
    while True:
        await asyncio.sleep(30 * 60)  # 30 minutes
        await publish_fetch_trigger(reason="scheduled")

app = FastAPI(title="PromoBot API", lifespan=lifespan)
```

**How this works:**
- On startup, the consumer connects to RabbitMQ and starts listening in the background.
- The periodic trigger loop publishes a message to the queue every 30 minutes.
- The consumer picks up the message and runs the pipeline.
- On shutdown, both background tasks are cancelled cleanly.
- The app itself is never blocked — these run concurrently in the same async event loop.

---

### Update the internal endpoint (optional)

You can keep `POST /internal/fetch` for manual testing, but now make it publish a message instead of running the pipeline directly:

```python
from app.worker.producer import publish_fetch_trigger

@router.post("/fetch")
async def trigger_fetch():
    await publish_fetch_trigger(reason="manual")
    return {"message": "Fetch triggered via queue"}
```

This means manual triggers also go through RabbitMQ — consistent behavior.

---

## Part 2 — Event: PostgreSQL LISTEN/NOTIFY

### What is LISTEN/NOTIFY?

PostgreSQL has a built-in pub/sub mechanism:
- `NOTIFY channel_name, 'payload'` — fires a notification on a named channel.
- `LISTEN channel_name` — opens a persistent connection that receives those notifications.

This is completely separate from SQL transactions. You can set up a database **trigger** that fires `NOTIFY` automatically whenever a row is inserted — without your application code doing anything explicitly.

---

### Task B-3: Database trigger for NOTIFY (`app/database.py`) — Person B

Add a function that creates the PostgreSQL trigger after the tables are created. This runs once at startup.

```python
def create_promotion_notify_trigger():
    trigger_sql = """
    CREATE OR REPLACE FUNCTION notify_new_promotion()
    RETURNS trigger AS $$
    BEGIN
        PERFORM pg_notify(
            'new_promotion',
            row_to_json(NEW)::text
        );
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS promotion_insert_trigger ON promotions;

    CREATE TRIGGER promotion_insert_trigger
    AFTER INSERT ON promotions
    FOR EACH ROW EXECUTE FUNCTION notify_new_promotion();
    """
    with engine.connect() as conn:
        conn.execute(text(trigger_sql))
        conn.commit()
```

**What this does:**
1. Creates a PostgreSQL function `notify_new_promotion()` that fires `pg_notify` with the channel name `'new_promotion'` and the new row's data as JSON.
2. Creates a trigger on the `promotions` table that calls this function after every `INSERT`.
3. `DROP TRIGGER IF EXISTS` ensures it's idempotent — safe to run every time the app starts.

Call this after `create_all` in the lifespan startup:
```python
from sqlalchemy import text
from app.database import create_promotion_notify_trigger

# inside lifespan, after Base.metadata.create_all(bind=engine)
create_promotion_notify_trigger()
```

---

### Task A-2: LISTEN background task (`app/worker/listener.py`) — Person A

The listener opens a raw asyncpg connection (bypassing SQLAlchemy) because `LISTEN` requires a persistent connection, not the request-scoped sessions SQLAlchemy provides.

```bash
pip install asyncpg
```

```python
import asyncio
import asyncpg
import os
import json

async def start_listener():
    database_url = os.getenv("DATABASE_URL")
    # asyncpg expects postgresql:// not postgresql+psycopg2://
    url = database_url.replace("postgresql+psycopg2://", "postgresql://")

    conn = await asyncpg.connect(url)
    await conn.add_listener("new_promotion", on_new_promotion)

    print("[LISTEN] Subscribed to 'new_promotion' channel")
    try:
        while True:
            await asyncio.sleep(1)
    finally:
        await conn.remove_listener("new_promotion", on_new_promotion)
        await conn.close()

def on_new_promotion(connection, pid, channel, payload):
    data = json.loads(payload)
    print(f"[EVENT] New promotion inserted → ID: {data.get('id')}, Product ID: {data.get('product_id')}")
    # This is where you'd trigger secondary effects:
    # - Update an in-memory cache
    # - Send a notification
    # - Log to an analytics system
```

**Why asyncpg instead of psycopg2?**  
`asyncpg` is a native async PostgreSQL driver — it integrates cleanly with `asyncio` and supports `LISTEN` natively. SQLAlchemy uses `psycopg2` for synchronous access, but `LISTEN` requires a persistent async connection.

### Add the listener to the lifespan

```python
from app.worker.listener import start_listener

# inside the lifespan startup, alongside the consumer task
listener_task = asyncio.create_task(start_listener())

# inside the shutdown block
listener_task.cancel()
```

---

## Testing the integrations

### Test 1: RabbitMQ message flow

1. Start the app: `uvicorn app.main:app --reload`
2. Watch the terminal — you should see:
   ```
   [RabbitMQ] Waiting for messages on queue 'fetch_promotions'...
   [RabbitMQ] Published fetch trigger: startup
   [RabbitMQ] Received message: {"trigger": "startup"}
   [Pipeline] Gym & Sports: 10 promotions created
   ```
3. Trigger manually:
   ```bash
   curl -X POST http://localhost:8000/internal/fetch
   ```
4. In the CloudAMQP dashboard → your instance → RabbitMQ Manager → Queues, you should see the queue and message activity.

### Test 2: PostgreSQL LISTEN/NOTIFY

1. With the app running, watch the terminal for LISTEN events.
2. Trigger `POST /internal/fetch`.
3. You should see one line per promotion inserted:
   ```
   [EVENT] New promotion inserted → ID: 42, Product ID: 7
   ```
4. You can also test NOTIFY manually in psql:
   ```sql
   NOTIFY new_promotion, '{"id": 999, "product_id": 1}';
   ```
   The listener should print the event immediately.

---

## Add asyncpg to requirements

```bash
pip install asyncpg
pip freeze > requirements.txt
```

---

## Acceptance Criteria

**RabbitMQ:**
- [ ] App startup publishes a message and the consumer processes it
- [ ] `POST /internal/fetch` publishes to the queue (does not run the pipeline directly)
- [ ] The consumer processes the message and runs the pipeline
- [ ] If the app restarts, the consumer reconnects automatically (test by restarting uvicorn)
- [ ] The queue is visible in the CloudAMQP management dashboard

**PostgreSQL LISTEN/NOTIFY:**
- [ ] The trigger exists in the database (verify: `\df notify_new_promotion` in psql)
- [ ] Each promotion insert prints a `[EVENT]` line in the terminal
- [ ] A manual `NOTIFY new_promotion, '...'` in psql also triggers the listener
- [ ] The listener reconnects cleanly if the app restarts
