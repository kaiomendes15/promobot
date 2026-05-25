from datetime import datetime
from sqlalchemy import DateTime, Numeric, String, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[int] = mapped_column(primary_key=True)
    # FK to Product — one product can appear in multiple promotions over time
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    # FK to Niche — determines which subscribers receive this promotion
    niche_id: Mapped[int] = mapped_column(ForeignKey("niches.id"), nullable=False)
    original_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    promo_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    affiliate_url: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    product: Mapped["Product"] = relationship("Product", back_populates="promotions")
    niche: Mapped["Niche"] = relationship("Niche")
