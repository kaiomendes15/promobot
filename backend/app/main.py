from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import Base, engine
import app.models  # noqa: F401 - register models before create_all()
from app.models.niche import Niche
from app.routers import promotions_router, users_router
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.routers import auth_router
from app.routers import internal_router


def _run_startup_migrations() -> None:
    if engine.dialect.name != "postgresql":
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE IF EXISTS niches "
                "ALTER COLUMN ml_category_id TYPE VARCHAR(50) "
                "USING ml_category_id::text"
            )
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Perform any startup tasks here
    print("Starting up...")
    Base.metadata.create_all(bind=engine)
    _run_startup_migrations()

    with Session(engine) as session:
        gym_niche = session.query(Niche).filter(Niche.title == "Gym & Sports").first()
        if gym_niche is None:
            session.add(Niche(title="Gym & Sports", ml_category_id="MLB1276"))
            session.commit()
        elif gym_niche.ml_category_id == "1":
            gym_niche.ml_category_id = "MLB1276"
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
app.include_router(promotions_router.router)
app.include_router(internal_router.router)

@app.get("/")
async def root():
    return {"message": "Hello World"}
