from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import Base, engine
from app.models.niche import Niche
from app.routers import users_router
from sqlalchemy.orm import Session

from app.routers import auth_router
from app.routers import internal_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Perform any startup tasks here
    print("Starting up...")
    Base.metadata.create_all(bind=engine)

    with Session(engine) as session:
        if not session.query(Niche).first():
            session.add(Niche(title="Gym & Sports", ml_category_id=1))
            session.commit()
    yield
    # Perform any shutdown tasks here
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(internal_router.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}
