from sqlalchemy import Table, Column, ForeignKey
from app.database import Base

# Association table for the User <-> Niche many-to-many relationship.
# Defined as a plain Table (not a model class) because it carries no extra columns.
user_niches = Table(
    "user_niches",
    Base.metadata,  # uses the single shared metadata from database.py
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("niche_id", ForeignKey("niches.id"), primary_key=True),
)
