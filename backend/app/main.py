from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.models.niche import Niche
from app.database import Base, engine
from sqlalchemy.orm import Session

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

@app.get("/")
async def root():
    return {"message": "Hello World"}