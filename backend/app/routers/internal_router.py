# Internal endpoints — called by the worker process or for manual testing.
# No JWT auth: these routes are not exposed to end-users.
# See CLAUDE.md: "No internal API key. The worker is an internal process."

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.genai_client import generate_product_description

router = APIRouter(prefix="/internal", tags=["internal"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class DescribeRequest(BaseModel):
    title: str = Field(..., description="Product title from Mercado Livre")
    original_price: float = Field(..., gt=0, description="Original price in BRL")
    promotional_price: float = Field(..., gt=0, description="Promotional price in BRL")


class DescribeResponse(BaseModel):
    description: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/describe", response_model=DescribeResponse)
async def describe_product(payload: DescribeRequest) -> DescribeResponse:
    """
    Generate an AI description for a product using Google Gemini.

    Intended use:
    - Manual testing during development.
    - Called by the promotion pipeline (M2) before persisting a Product row.

    The description is generated once and stored on Product.gemini_description
    so this endpoint is NOT called again for the same ml_product_id.
    """
    description = await generate_product_description(
        title=payload.title,
        original_price=payload.original_price,
        promotional_price=payload.promotional_price,
    )
    return DescribeResponse(description=description)
