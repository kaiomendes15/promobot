import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

# Single Base instance shared across all models.
# All models must import Base from here — never declare a new DeclarativeBase elsewhere.
class Base(DeclarativeBase):
    pass

# Session factory used by routers to open DB sessions.
SessionLocal = sessionmaker(bind=engine)
