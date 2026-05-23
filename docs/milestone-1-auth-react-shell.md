# Milestone 1 — Auth + React Shell

**Days:** May 24–25  
**Owners:** Person A + B (auth backend) · Person C (React shell)  
**Goal:** Users can register, log in, and subscribe to niches via the API. The React app has all pages built as static shells, ready to be wired to real endpoints.

> These two tracks are independent — run them in parallel. The only dependency: JWT middleware (Track 1) must be done before Milestone 2 can start. If A or B finishes early, help C wire the auth pages to real endpoints.

---

## Track 1 — Auth Backend (Person A + B)

### Overview of the auth flow

1. User sends email + password to `POST /auth/register` → backend hashes password with bcrypt, saves user to DB, returns a JWT.
2. User sends email + password to `POST /auth/login` → backend validates credentials, returns a JWT.
3. For protected routes, the client sends the JWT in the `Authorization: Bearer <token>` header → backend validates the token and extracts the user.

---

### File structure for this track

```
backend/app/
├── routers/
│   ├── __init__.py
│   ├── auth.py       ← register + login
│   └── users.py      ← niche subscription endpoints
├── schemas/
│   ├── __init__.py
│   ├── auth.py       ← request/response shapes
│   └── user.py
└── auth.py           ← JWT creation + verification + get_current_user dependency
```

---

### Task A-1: JWT utilities (`app/auth.py`) — Person A

This file contains the functions used to create and verify JWT tokens, and the FastAPI dependency that extracts the current user from a request.

```python
import os
from datetime import datetime, timedelta, timezone
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", 24))

bearer_scheme = HTTPBearer()

def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=EXPIRE_HOURS)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
```

**How `get_current_user` works as a dependency:**  
Any route that declares `current_user: User = Depends(get_current_user)` will automatically require a valid JWT. FastAPI calls `get_current_user` before the route handler runs, and if it raises an `HTTPException`, the route never executes. This is the standard FastAPI pattern for protecting routes.

---

### Task A-2: Pydantic schemas (`app/schemas/auth.py`) — Person A

Schemas define the shape of request bodies and responses. FastAPI uses them for automatic validation and documentation.

```python
from pydantic import BaseModel, EmailStr

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

---

### Task A-3: Auth router (`app/routers/auth.py`) — Person A

```python
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt()).decode()
    user = User(email=body.email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(access_token=create_access_token(user.id))

@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not bcrypt.checkpw(body.password.encode(), user.hashed_password.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return TokenResponse(access_token=create_access_token(user.id))
```

**Why bcrypt?** bcrypt is slow by design — it adds a "cost factor" that makes brute-force attacks impractical even if the database is compromised. Never store plain-text or MD5/SHA passwords.

---

### Task B-1: User schemas (`app/schemas/user.py`) — Person B

```python
from pydantic import BaseModel

class NicheOut(BaseModel):
    id: int
    name: str
    ml_category_id: str

    model_config = {"from_attributes": True}

class UserOut(BaseModel):
    id: int
    email: str
    niches: list[NicheOut] = []

    model_config = {"from_attributes": True}
```

`model_config = {"from_attributes": True}` tells Pydantic to read data from SQLAlchemy model attributes (instead of expecting a plain dict).

---

### Task B-2: Users router (`app/routers/users.py`) — Person B

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.niche import Niche
from app.auth import get_current_user
from app.schemas.user import NicheOut, UserOut

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/me/niches/{niche_id}", response_model=UserOut)
def subscribe_to_niche(
    niche_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    niche = db.query(Niche).filter(Niche.id == niche_id).first()
    if not niche:
        raise HTTPException(status_code=404, detail="Niche not found")
    if niche in current_user.niches:
        raise HTTPException(status_code=400, detail="Already subscribed")

    current_user.niches.append(niche)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("/me/niches/{niche_id}", response_model=UserOut)
def unsubscribe_from_niche(
    niche_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    niche = db.query(Niche).filter(Niche.id == niche_id).first()
    if not niche or niche not in current_user.niches:
        raise HTTPException(status_code=404, detail="Subscription not found")

    current_user.niches.remove(niche)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/niches", response_model=list[NicheOut])
def list_my_niches(current_user: User = Depends(get_current_user)):
    return current_user.niches

@router.get("/niches", response_model=list[NicheOut])
def list_all_niches(db: Session = Depends(get_db)):
    return db.query(Niche).all()
```

---

### Task B-3: Register routers in `app/main.py` — Person B

Add the routers to the FastAPI app:

```python
from app.routers import auth, users

app.include_router(auth.router)
app.include_router(users.router)
```

---

### Testing Track 1 with Postman / curl

**Register:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secret123"}'
# Expected: {"access_token": "eyJ...", "token_type": "bearer"}
```

**Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "secret123"}'
```

**List niches (public):**
```bash
curl http://localhost:8000/users/niches
# Expected: [{"id": 1, "name": "Gym & Sports", "ml_category_id": "MS174162"}]
```

**Subscribe to a niche (requires token):**
```bash
curl -X POST http://localhost:8000/users/me/niches/1 \
  -H "Authorization: Bearer <your_token>"
```

---

## Track 2 — React Shell (Person C)

### Overview

The goal is to build all UI pages as working static shells — they look right, navigate correctly, and have the input fields and buttons in place — but they do not call the real API yet. Mock data is fine. This way, once Track 1 is done, wiring is just swapping mock calls for real Axios calls.

---

### Setup

```bash
cd frontend
npm create vite@latest . -- --template react
npm install react-router-dom axios
```

---

### File structure

```
frontend/src/
├── api/
│   └── client.js          ← Axios instance with base URL + JWT header
├── pages/
│   ├── Register.jsx
│   ├── Login.jsx
│   ├── Niches.jsx         ← niche selection after login
│   └── Promotions.jsx     ← main feed
├── components/
│   └── ProtectedRoute.jsx ← redirects to /login if no JWT
└── main.jsx               ← router setup
```

---

### Task C-1: Axios client (`src/api/client.js`)

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

**Why an interceptor?** Instead of manually adding the `Authorization` header to every API call, the interceptor automatically attaches the JWT stored in `localStorage` to every request. If there's no token, the header is simply not added.

---

### Task C-2: Router setup (`src/main.jsx`)

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Niches from "./pages/Niches";
import Promotions from "./pages/Promotions";
import ProtectedRoute from "./components/ProtectedRoute";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/niches" element={<ProtectedRoute><Niches /></ProtectedRoute>} />
        <Route path="/promotions" element={<ProtectedRoute><Promotions /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
```

---

### Task C-3: Protected route (`src/components/ProtectedRoute.jsx`)

```jsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}
```

If no JWT is in `localStorage`, the user is redirected to `/login` before the page renders.

---

### Task C-4: Static pages

**`src/pages/Login.jsx`**
```jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    // TODO M4: call POST /auth/login, save token, navigate to /niches
    console.log("login", email, password);
    navigate("/niches");
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
      <p>No account? <Link to="/register">Register</Link></p>
    </form>
  );
}
```

**`src/pages/Register.jsx`** — same structure as Login, with a "Create account" heading and `TODO M4` comment on submit.

**`src/pages/Niches.jsx`** — show a hardcoded list of niches with checkboxes. On "Continue", navigate to `/promotions`.
```jsx
const MOCK_NICHES = [{ id: 1, name: "Gym & Sports" }];
```

**`src/pages/Promotions.jsx`** — show a hardcoded list of promotions with all fields visible (photo, title, prices, description, buy button). Use placeholder images.
```jsx
const MOCK_PROMOTIONS = [
  {
    id: 1,
    title: "Whey Protein 1kg",
    photo_url: "https://placehold.co/200x200",
    original_price: 150.00,
    promo_price: 99.90,
    gemini_description: "Great deal on whey protein! 33% off today only.",
    affiliate_url: "#",
  },
];
```

---

### Running the frontend

```bash
cd frontend
cp .env.example .env   # create .env with VITE_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:5173 and verify you can navigate between pages.

---

## Acceptance Criteria

**Track 1:**
- [ ] `POST /auth/register` creates a user and returns a JWT
- [ ] `POST /auth/login` returns a JWT with valid credentials; returns 401 with wrong password
- [ ] `GET /users/niches` returns the list of niches (no auth needed)
- [ ] `POST /users/me/niches/:id` adds a niche to the user (requires valid JWT)
- [ ] `GET /users/me/niches` returns the user's subscribed niches (requires valid JWT)
- [ ] A request without a token to a protected route returns 401
- [ ] An expired or malformed token returns 401

**Track 2:**
- [ ] `/login` and `/register` pages render and have working form fields
- [ ] `/niches` and `/promotions` redirect to `/login` when no token in localStorage
- [ ] Navigating manually to `/login` after "logging in" with the mock still works
- [ ] The promotions page shows mock promotion cards with all fields (photo, title, prices, description, link)
