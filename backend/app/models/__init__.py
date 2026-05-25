# Importing all models here ensures SQLAlchemy registers them on Base.metadata
# before create_all() is called in main.py — without this, tables won't be created.
from app.models.user_niches import user_niches
from app.models.user import User
from app.models.niche import Niche
from app.models.product import Product
from app.models.promotion import Promotion
