from datetime import datetime
from sqlalchemy import String, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    # ml_product_id is unique so we can detect duplicates and reuse the Gemini description
    ml_product_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(512))
    # stored once and reused if the same ml_product_id appears in future fetches
    gemini_description: Mapped[str | None] = mapped_column(Text)
    # "store" exists for future multi-store support; only Mercado Livre for now
    store: Mapped[str] = mapped_column(String(100), nullable=False, default="mercadolivre")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    promotions: Mapped[list["Promotion"]] = relationship(
        "Promotion", back_populates="product"
    )
