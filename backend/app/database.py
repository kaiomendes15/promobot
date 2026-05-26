import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://promobot:promobot@localhost:5432/promobot")

engine = create_engine(DATABASE_URL)

# Single Base instance shared across all models.
# All models must import Base from here — never declare a new DeclarativeBase elsewhere.
class Base(DeclarativeBase):
    pass

# Session factory used by routers to open DB sessions.
SessionLocal = sessionmaker(bind=engine)


def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
