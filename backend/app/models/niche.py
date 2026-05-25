from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.user_niches import user_niches

class Niche(Base):
    __tablename__ = "niches"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    ml_category_id: Mapped[int]

    users: Mapped[list["User"]] = relationship(
        "User", secondary=user_niches, back_populates="niches"
    )
