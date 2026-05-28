# Milestone 3 — Message + Event Integrations

**Days:** May 28–29  
**Owners:** Person B leads · Person A supports  
**Goal:** The promotion pipeline is triggered by a RabbitMQ message (not a direct HTTP call), and new promotion inserts are observed via PostgreSQL LISTEN/NOTIFY. These are two of the three graded integration techniques.

> **Prerequisite:** Milestones 2A (ML Auth Setup) and 2B (Promotion Pipeline) must be working — the ML credentials must be bootstrapped in the DB and `POST /internal/fetch` must return promotions before starting this milestone. Person C continues wiring the frontend in parallel.

**Read first:** [`stack-guide.md`](stack-guide.md) — sections on aio-pika and asyncpg.

---

## What changes in this milestone

Before:
```
POST /internal/fetch  →  pipeline runs  →  DB
```

After:
```
Producer (timer or HTTP) → RabbitMQ queue → aio-pika consumer → pipeline → DB
                                                                             ↓
                                                            PostgreSQL NOTIFY fired by DB trigger
                                                                             ↓
                                                            FastAPI LISTEN task reacts
```

---

## Part 1 — Message Queue: RabbitMQ + aio-pika

### What is a message queue (and why use it)?

A message queue decouples the thing that *requests* work from the thing that *does* the work. Instead of a caller waiting for the pipeline to finish (synchronous), it publishes a message to a queue and returns immediately. The consumer reads from the queue and runs the pipeline independently.

This is the same pattern used by:
- Spring Boot + Spring AMQP with `RabbitTemplate` and `@RabbitListener`
- Node.js with `amqplib` publishing to and consuming from a queue

### CloudAMQP setup

1. Create a free account at https://www.cloudamqp.com
2. Create an instance using the "Little Lemur" free plan
3. Copy the **AMQP URL** from your instance dashboard — it looks like `amqp://user:pass@host/vhost`
4. Add it to your `.env` as `RABBITMQ_URL`

Use this same CloudAMQP URL in local development — no need for a local RabbitMQ container.

### Concepts to research

**aio-pika basics:**
- `connect_robust` vs `connect` — what does "robust" add?
- `channel.declare_queue(name, durable=True)` — what does `durable` mean and why does it matter?
- Publishing: `channel.default_exchange.publish(Message(body), routing_key=queue_name)`
- Consuming: `async for message in queue:` and `async with message.process():`
- `DeliveryMode.PERSISTENT` on a message — what does it guarantee?

**FastAPI lifespan:**
- The modern way to run startup/shutdown logic in FastAPI is the `lifespan` context manager (replacing the deprecated `@app.on_event("startup")`)
- Research `@asynccontextmanager` from `contextlib`
- Background tasks with `asyncio.create_task()` — how to start a coroutine that runs concurrently with the web server
- How to cancel background tasks on shutdown

**Suggested reading:**
- aio-pika quick start: https://aio-pika.readthedocs.io/en/stable/quick-start.html
- FastAPI lifespan: https://fastapi.tiangolo.com/advanced/events/

### Steps

1. Write a **consumer** (`app/worker/consumer.py`):
   - Connect to RabbitMQ using `connect_robust`
   - Declare the queue (so it's created if it doesn't exist)
   - Loop over incoming messages
   - On each message: query all niches from the DB and run the pipeline for each
   - Use `message.process()` to handle ack/nack automatically

2. Write a **producer** (`app/worker/producer.py`):
   - Connect to RabbitMQ
   - Declare the same queue
   - Publish a message with a small JSON body (e.g., `{"trigger": "scheduled"}`)

3. Update `app/main.py` to use the `lifespan` pattern:
   - On startup: start the consumer as a background task, publish an initial trigger, start a periodic task that publishes a trigger every 30 minutes
   - On shutdown: cancel the background tasks

4. Update `POST /internal/fetch` to publish to the queue instead of running the pipeline directly — so all triggers go through the same path.

### Verification

After starting the app, check the terminal for:
```
[RabbitMQ] Waiting for messages on queue 'fetch_promotions'...
[RabbitMQ] Received message: {"trigger": "startup"}
[Pipeline] Gym & Sports: N promotions created
```

Check the CloudAMQP management dashboard → your instance → Connections and Queues to see activity.

---

## Part 2 — Event: PostgreSQL LISTEN/NOTIFY

### What is LISTEN/NOTIFY?

PostgreSQL has a built-in pub/sub mechanism, completely separate from SQL transactions:
- `NOTIFY channel, 'payload'` — fires a notification on a named channel
- `LISTEN channel` — a connection subscribes to receive those notifications

You can create a **database trigger** that calls `NOTIFY` automatically after every `INSERT` on a table — without your application code doing anything explicitly. The listener observes these events and reacts.

This is the Observer pattern: the database is the subject, the FastAPI listener is the observer.

### Concepts to research

**PostgreSQL triggers and functions:**
- A trigger is a function that PostgreSQL calls automatically when a specific event happens (INSERT, UPDATE, DELETE) on a table
- `CREATE OR REPLACE FUNCTION ... RETURNS trigger AS $$ ... $$ LANGUAGE plpgsql;`
- `AFTER INSERT ON tablename FOR EACH ROW EXECUTE FUNCTION function_name();`
- `pg_notify(channel, payload)` — fires a notification from inside a trigger function
- `row_to_json(NEW)::text` — serializes the newly inserted row as a JSON string
- `DROP TRIGGER IF EXISTS` — makes trigger creation idempotent (safe to run on every startup)

**asyncpg for LISTEN:**
- SQLAlchemy sessions are request-scoped and not suitable for long-running connections
- `LISTEN` needs a persistent connection — use `asyncpg` (a separate async PostgreSQL driver) for this
- `conn.add_listener(channel, callback)` — registers a Python function to be called when a notification arrives
- The callback receives: `connection`, `pid`, `channel`, `payload` (as a string)

**Note on the connection URL:**
- SQLAlchemy uses `postgresql://` or `postgresql+psycopg2://`
- asyncpg expects `postgresql://` — you may need to replace the scheme in your `DATABASE_URL` before passing it to asyncpg

**Suggested reading:**
- asyncpg notifications: https://magicstack.github.io/asyncpg/current/api/index.html#asyncpg.connection.Connection.add_listener
- PostgreSQL trigger docs: https://www.postgresql.org/docs/current/sql-createtrigger.html
- PostgreSQL NOTIFY: https://www.postgresql.org/docs/current/sql-notify.html

### Steps

1. Write a function that creates the PostgreSQL trigger (in `app/database.py` or a separate file):
   - Create a PL/pgSQL function that calls `pg_notify('new_promotion', row_to_json(NEW)::text)`
   - Create a trigger on `promotions` that calls this function after each INSERT
   - Use `DROP TRIGGER IF EXISTS` + `CREATE TRIGGER` to make it idempotent
   - Execute this SQL using SQLAlchemy's `engine.connect()` and `conn.execute(text(...))`
   - Call this function in the lifespan startup, after `create_all`

2. Write the LISTEN background task (`app/worker/listener.py`):
   - Connect using asyncpg (install it: `pip install asyncpg`)
   - Call `conn.add_listener("new_promotion", callback)`
   - Define the callback to log the event (parse the JSON payload and print the promotion ID and product ID)
   - Keep the connection alive with an infinite loop
   - Close cleanly on shutdown

3. Add the listener as a background task in the lifespan (alongside the RabbitMQ consumer).

4. Update `requirements.txt`.

### Verification

1. Start the app and confirm both background tasks start in the logs.
2. Trigger the pipeline: `curl -X POST http://localhost:8000/internal/fetch`
3. You should see one `[EVENT]` log line per promotion inserted.
4. Test the trigger independently from psql:
   ```bash
   docker compose exec db psql -U promobot_user -d promobot
   -- Inside psql:
   NOTIFY new_promotion, '{"id": 999, "product_id": 1}';
   ```
   The listener should log it immediately.
5. Verify the trigger exists:
   ```bash
   docker compose exec db psql -U promobot_user -d promobot -c "\df notify_new_promotion"
   ```

---

## Acceptance Criteria

**RabbitMQ:**
- [ ] App startup automatically triggers a pipeline run via the queue
- [ ] `POST /internal/fetch` publishes to the queue (does not run the pipeline directly)
- [ ] The consumer processes messages and runs the pipeline
- [ ] The queue is visible in the CloudAMQP management dashboard with activity shown
- [ ] Restarting the app reconnects the consumer automatically

**PostgreSQL LISTEN/NOTIFY:**
- [ ] The `notify_new_promotion` trigger function exists in the database
- [ ] Every promotion INSERT logs an `[EVENT]` line in the terminal
- [ ] A manual `NOTIFY new_promotion, '...'` in psql triggers the listener
- [ ] Both background tasks (consumer + listener) start cleanly on app startup
