from datetime import timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.integrations.mercadolivre import exchange_code
from app.models.ml_credential import MLCredential

router = APIRouter(prefix="/internal", tags=["internal"])


class MLConnectRequest(BaseModel):
    code: str


class MLConnectResponse(BaseModel):
    expires_at: str
    message: str


@router.post("/ml-connect", response_model=MLConnectResponse)
def connect_mercadolivre(
    payload: MLConnectRequest,
    db: Session = Depends(get_db),
) -> MLConnectResponse:
    try:
        exchange_code(payload.code, db)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Mercado Livre token exchange failed: {exc.response.text}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Mercado Livre token exchange request failed: {exc}",
        ) from exc

    credential = db.get(MLCredential, 1)
    if credential is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ML credentials were not stored",
        )

    expires_at = credential.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    return MLConnectResponse(
        expires_at=expires_at.astimezone(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z"),
        message="ML auth configured",
    )
