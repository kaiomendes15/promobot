# Python Stack Guide

A practical reference for the libraries used in this project. Each section explains what the library does, how it compares to tools you may know from other stacks, and gives a small self-contained example **unrelated to the project** so you can focus on understanding the concept.

Use this as a starting point — then go to the official docs for depth.

---

## FastAPI

**What it does:** A modern web framework for building REST APIs in Python. Handles routing, request parsing, response serialization, and automatic documentation.

**Equivalent in other stacks:**
| Stack | Equivalent |
|---|---|
| Java | Spring Boot (`@RestController`, `@GetMapping`) |
| Node.js | Express.js / Fastify |
| Python (older) | Flask, Django REST Framework |

**Key concepts to research:**
- Route decorators (`@app.get`, `@app.post`)
- Path and query parameters
- Request body with Pydantic models
- Dependency injection with `Depends`
- Auto-generated docs at `/docs`

**Conceptual example — a simple bookstore API:**
```python
from fastapi import FastAPI

app = FastAPI()

books = [{"id": 1, "title": "Clean Code", "author": "Robert Martin"}]

@app.get("/books")
def list_books():
    return books

@app.get("/books/{book_id}")
def get_book(book_id: int):
    return next((b for b in books if b["id"] == book_id), None)
```

Compare with Spring Boot:
```java
@RestController
@RequestMapping("/books")
public class BookController {
    @GetMapping
    public List<Book> listBooks() { return books; }

    @GetMapping("/{id}")
    public Book getBook(@PathVariable int id) { ... }
}
```

**Where to start:** https://fastapi.tiangolo.com/tutorial/

---

## SQLAlchemy

**What it does:** An ORM (Object-Relational Mapper) — lets you define database tables as Python classes and interact with them using Python instead of raw SQL.

**Equivalent in other stacks:**
| Stack | Equivalent |
|---|---|
| Java | Hibernate / JPA (`@Entity`, `@Column`) |
| Node.js | Sequelize / TypeORM / Prisma |
| Python (alternative) | Django ORM |

**Key concepts to research:**
- `DeclarativeBase` and model classes
- `Column` types (`Integer`, `String`, `DateTime`, `Numeric`)
- `relationship` for associations between tables
- `Session` for querying and committing
- `ForeignKey` for referencing other tables

**Conceptual example — a todo list:**
```python
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped

class Base(DeclarativeBase):
    pass

class Todo(Base):
    __tablename__ = "todos"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    done: Mapped[bool] = mapped_column(default=False)
```

Querying:
```python
# Get all unfinished todos
todos = session.query(Todo).filter(Todo.done == False).all()

# Create a new one
todo = Todo(title="Buy groceries")
session.add(todo)
session.commit()
```

Compare with JPA:
```java
@Entity
public class Todo {
    @Id @GeneratedValue
    private Long id;
    private String title;
    private boolean done;
}
// Repository query:
todoRepository.findByDoneFalse();
```

**Where to start:** https://docs.sqlalchemy.org/en/20/orm/quickstart.html

---

## Pydantic

**What it does:** Data validation and parsing library. You define the shape of your data as a Python class, and Pydantic ensures incoming data matches that shape — raising errors if it doesn't.

FastAPI uses Pydantic for request bodies and response models automatically.

**Equivalent in other stacks:**
| Stack | Equivalent |
|---|---|
| Java | Jakarta Bean Validation (`@NotNull`, `@Email`, `@Size`) |
| Node.js | Zod / Joi / Yup |
| TypeScript | Zod (very similar concept) |

**Key concepts to research:**
- `BaseModel` and field definitions
- Built-in types: `str`, `int`, `EmailStr`, `datetime`
- Validation errors and how FastAPI surfaces them
- `model_config = {"from_attributes": True}` for reading from ORM objects

**Conceptual example — validating a contact form:**
```python
from pydantic import BaseModel, EmailStr

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    age: int

# Valid input — works fine
form = ContactForm(name="Alice", email="alice@example.com", age=30)

# Invalid input — Pydantic raises a ValidationError
form = ContactForm(name="Bob", email="not-an-email", age="old")
```

Compare with Zod (Node.js):
```typescript
const ContactSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number(),
});
ContactSchema.parse({ name: "Alice", email: "alice@example.com", age: 30 });
```

**Where to start:** https://docs.pydantic.dev/latest/concepts/models/

---

## bcrypt

**What it does:** Hashes passwords securely. bcrypt is intentionally slow (has a "cost factor"), making brute-force attacks impractical. Never store plain-text passwords.

**Equivalent in other stacks:**
| Stack | Equivalent |
|---|---|
| Java | Spring Security's `BCryptPasswordEncoder` |
| Node.js | `bcrypt` or `bcryptjs` npm package |
| All stacks | Same algorithm, same concept |

**Key concepts to research:**
- The difference between hashing and encryption
- Why you never store plain passwords
- What a "salt" is and why bcrypt generates one automatically
- `hashpw` to hash, `checkpw` to verify — you never reverse a hash

**Conceptual example — user registration and login:**
```python
import bcrypt

# On registration: hash the password before saving
password = "my_secret_password"
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
# Store `hashed` in the database. Never store `password`.

# On login: verify the attempt against the stored hash
attempt = "my_secret_password"
is_valid = bcrypt.checkpw(attempt.encode(), hashed)
# is_valid = True
```

Compare with Spring Security:
```java
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
String hashed = encoder.encode("my_secret_password");       // registration
boolean valid = encoder.matches("my_secret_password", hashed); // login
```

**Where to start:** https://pypi.org/project/bcrypt/ — read the README, it's short.

---

## PyJWT

**What it does:** Creates and verifies JSON Web Tokens (JWTs). A JWT is a signed string that carries claims (e.g., user ID, expiry time). The server signs it with a secret key; clients send it back on every request to prove who they are.

**Equivalent in other stacks:**
| Stack | Equivalent |
|---|---|
| Java | `jjwt` library / Spring Security JWT |
| Node.js | `jsonwebtoken` npm package |
| All stacks | Same JWT standard (RFC 7519) |

**Key concepts to research:**
- The three parts of a JWT: header, payload, signature
- What "signing" means and why the secret key must stay secret
- `jwt.encode` to create a token, `jwt.decode` to verify
- The `exp` claim for expiry
- Why JWTs are stateless (no server-side session storage needed)

**Conceptual example — issuing and verifying a token:**
```python
import jwt
from datetime import datetime, timedelta, timezone

SECRET = "my-super-secret-key"

# Issue a token (e.g., after login)
payload = {
    "user_id": 42,
    "exp": datetime.now(timezone.utc) + timedelta(hours=1)
}
token = jwt.encode(payload, SECRET, algorithm="HS256")

# Verify and read the token (e.g., on a protected route)
decoded = jwt.decode(token, SECRET, algorithms=["HS256"])
print(decoded["user_id"])  # 42
```

Compare with `jsonwebtoken` (Node.js):
```javascript
const token = jwt.sign({ user_id: 42 }, "my-super-secret-key", { expiresIn: "1h" });
const decoded = jwt.verify(token, "my-super-secret-key");
```

**Where to start:** https://pyjwt.readthedocs.io/en/stable/usage.html

---

## httpx

**What it does:** An async HTTP client for making requests to external APIs from Python. Think of it as the server-side equivalent of `fetch` in JavaScript or `RestTemplate`/`WebClient` in Spring.

**Equivalent in other stacks:**
| Stack | Equivalent |
|---|---|
| Java | `WebClient` (Spring WebFlux) / `RestTemplate` |
| Node.js | `axios`, `node-fetch`, native `fetch` |
| Python (sync) | `requests` library |

**Key concepts to research:**
- `async with httpx.AsyncClient()` — why you use a context manager
- `GET`, `POST`, `params`, `json`, `headers`
- `response.raise_for_status()` — raises an exception on 4xx/5xx
- The difference between sync `requests` and async `httpx`

**Conceptual example — fetching data from a public API:**
```python
import httpx

async def get_github_user(username: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(f"https://api.github.com/users/{username}")
        response.raise_for_status()
        return response.json()
```

Compare with `axios` (Node.js):
```javascript
async function getGithubUser(username) {
    const response = await axios.get(`https://api.github.com/users/${username}`);
    return response.data;
}
```

Compare with `WebClient` (Spring):
```java
webClient.get()
    .uri("/users/{username}", username)
    .retrieve()
    .bodyToMono(Map.class)
    .block();
```

**Where to start:** https://www.python-httpx.org/quickstart/

---

## aio-pika

**What it does:** An async Python client for RabbitMQ using the AMQP protocol. It lets you publish messages to a queue and consume messages from a queue — without Celery or any other abstraction layer on top.

**Equivalent in other stacks:**
| Stack | Equivalent |
|---|---|
| Java | Spring AMQP (`RabbitTemplate`, `@RabbitListener`) |
| Node.js | `amqplib` / `amqp-connection-manager` |
| Python (with framework) | Celery (higher-level, hides the queue details) |

**Key concepts to research:**
- What a queue is and why it decouples producers from consumers
- `connect_robust` — reconnects automatically if the broker drops
- `declare_queue` — creates the queue if it doesn't exist (idempotent)
- `durable=True` — queue survives a RabbitMQ restart
- `message.process()` — auto-acks on success, nacks on exception
- `DeliveryMode.PERSISTENT` — message survives a broker restart

**Conceptual example — a simple notification queue:**

Producer (publishes a message):
```python
import aio_pika

async def send_notification(message: str):
    connection = await aio_pika.connect_robust("amqp://guest:guest@localhost/")
    async with connection:
        channel = await connection.channel()
        await channel.declare_queue("notifications", durable=True)
        await channel.default_exchange.publish(
            aio_pika.Message(message.encode()),
            routing_key="notifications",
        )
```

Consumer (receives and handles messages):
```python
async def start_consumer():
    connection = await aio_pika.connect_robust("amqp://guest:guest@localhost/")
    async with connection:
        channel = await connection.channel()
        queue = await channel.declare_queue("notifications", durable=True)
        async for message in queue:
            async with message.process():
                print(f"Got notification: {message.body.decode()}")
```

Compare with Spring AMQP:
```java
// Producer
rabbitTemplate.convertAndSend("notifications", "Hello!");

// Consumer
@RabbitListener(queues = "notifications")
public void handleNotification(String message) {
    System.out.println("Got: " + message);
}
```

**Where to start:** https://aio-pika.readthedocs.io/en/stable/quick-start.html

---

## asyncpg

**What it does:** A fast, native async PostgreSQL driver. Unlike SQLAlchemy (which abstracts the DB), asyncpg gives you direct access to PostgreSQL features — including `LISTEN/NOTIFY`, which requires a persistent connection that SQLAlchemy's session model doesn't support.

**Equivalent in other stacks:**
| Stack | Equivalent |
|---|---|
| Java | R2DBC (reactive PostgreSQL driver) |
| Node.js | `pg` library (`pg.Client` with `LISTEN`) |
| Python (sync) | `psycopg2` |

**Key concepts to research:**
- `asyncpg.connect()` — opens a single persistent connection (not a pool)
- `conn.add_listener(channel, callback)` — subscribes to a NOTIFY channel
- The difference between this and SQLAlchemy sessions
- `LISTEN` / `NOTIFY` in PostgreSQL — what they are and how they work

**Conceptual example — listening for database events:**
```python
import asyncpg
import asyncio

def on_event(connection, pid, channel, payload):
    print(f"Event on '{channel}': {payload}")

async def listen():
    conn = await asyncpg.connect("postgresql://user:pass@localhost/mydb")
    await conn.add_listener("my_channel", on_event)
    print("Listening...")
    await asyncio.sleep(60)  # keep alive for 60 seconds
    await conn.close()
```

Trigger from psql (or a DB trigger):
```sql
NOTIFY my_channel, 'something happened';
```

Compare with Node.js `pg`:
```javascript
const client = new Client(connectionString);
await client.connect();
await client.query("LISTEN my_channel");
client.on("notification", (msg) => {
    console.log(`Event on '${msg.channel}': ${msg.payload}`);
});
```

**Where to start:** https://magicstack.github.io/asyncpg/current/usage.html — focus on the "Connection" section first, then "Notifications".

---

## python-dotenv

**What it does:** Loads environment variables from a `.env` file into `os.environ`. This lets you store secrets (API keys, DB passwords) outside your code.

**Equivalent in other stacks:**
| Stack | Equivalent |
|---|---|
| Java | `application.properties` / `@Value` / Spring profiles |
| Node.js | `dotenv` npm package (identical concept) |
| All stacks | Twelve-Factor App methodology |

**Conceptual example:**
```python
# .env file
DB_PASSWORD=supersecret
API_KEY=abc123

# In code
from dotenv import load_dotenv
import os

load_dotenv()  # reads .env and populates os.environ

password = os.getenv("DB_PASSWORD")  # "supersecret"
```

**Rule:** `.env` is always in `.gitignore`. `.env.example` (with placeholder values, no real secrets) is committed so teammates know what variables are needed.

**Where to start:** https://pypi.org/project/python-dotenv/ — README is all you need.

---

## Pydantic Settings

**What it does:** A Pydantic-based way to manage app configuration. Instead of scattering `os.getenv()` calls everywhere, you define all your settings in one class with types and validation.

**Equivalent in other stacks:**
| Stack | Equivalent |
|---|---|
| Java | `@ConfigurationProperties` in Spring Boot |
| Node.js | `convict` / manual `process.env` |

**Conceptual example:**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    jwt_secret: str
    jwt_expire_hours: int = 24  # default value

    class Config:
        env_file = ".env"

settings = Settings()
# Now use settings.database_url, settings.jwt_secret, etc.
```

If `DATABASE_URL` is missing from `.env`, the app fails immediately with a clear error — not silently at runtime.

**Where to start:** https://docs.pydantic.dev/latest/concepts/pydantic_settings/
