from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database import Base, engine
from app.models.niche import Niche
from app.routers import users_router
from sqlalchemy.orm import Session

from app.routers import auth_router

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

app.include_router(auth_router.router)
app.include_router(users_router.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}
