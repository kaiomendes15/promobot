import os
from datetime import datetime, timedelta, timezone
from typing import Any
import httpx
from sqlalchemy.orm import Session
from app.models.ml_credential import MLCredential

TOKEN_URL = "https://api.mercadolibre.com/oauth/token"
TOKEN_REFRESH_MARGIN = timedelta(minutes=5)
ML_CREDENTIAL_ID = 1


def _get_required_env(*names: str) -> str:
    for name in names:
        value = os.getenv(name)
        if value:
            return value
    expected_names = " or ".join(names)
    raise RuntimeError(f"Missing required environment variable: {expected_names}")


def _client_id() -> str:
    return _get_required_env("ML_CLIENT_ID", "MERCADOLIVRE_CLIENT_ID", "client_id")


def _client_secret() -> str:
    return _get_required_env(
        "ML_CLIENT_SECRET",
        "MERCADOLIVRE_CLIENT_SECRET",
        "client_secret",
        "cliente_secret",
    )


def _redirect_uri() -> str:
    return _get_required_env("ML_REDIRECT_URI", "MERCADOLIVRE_REDIRECT_URI", "redirect_uri")


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _post_token_request(data: dict[str, str]) -> dict[str, Any]:
    response = httpx.post(
        TOKEN_URL,
        data=data,
        headers={"accept": "application/json"},
        timeout=15,
    )
    response.raise_for_status()
    return response.json()


def _upsert_credentials(
    db: Session,
    access_token: str,
    refresh_token: str,
    expires_at: datetime,
) -> MLCredential:
    credential = db.get(MLCredential, ML_CREDENTIAL_ID)
    if credential is None:
        credential = MLCredential(id=ML_CREDENTIAL_ID)
        db.add(credential)

    credential.access_token = access_token
    credential.refresh_token = refresh_token
    credential.expires_at = expires_at
    db.commit()
    db.refresh(credential)
    return credential


def _expires_at(expires_in: int) -> datetime:
    return _utc_now() + timedelta(seconds=expires_in)


def exchange_code(code: str, db: Session) -> None:
    token_data = _post_token_request(
        {
            "grant_type": "authorization_code",
            "client_id": _client_id(),
            "client_secret": _client_secret(),
            "code": code,
            "redirect_uri": _redirect_uri(),
        }
    )

    _upsert_credentials(
        db=db,
        access_token=token_data["access_token"],
        refresh_token=token_data["refresh_token"],
        expires_at=_expires_at(int(token_data["expires_in"])),
    )


def _refresh_tokens(db: Session) -> str:
    credential = db.get(MLCredential, ML_CREDENTIAL_ID)
    if credential is None:
        raise RuntimeError("ML credentials not configured. POST /internal/ml-connect first.")

    token_data = _post_token_request(
        {
            "grant_type": "refresh_token",
            "client_id": _client_id(),
            "client_secret": _client_secret(),
            "refresh_token": credential.refresh_token,
        }
    )

    updated_credential = _upsert_credentials(
        db=db,
        access_token=token_data["access_token"],
        refresh_token=token_data["refresh_token"],
        expires_at=_expires_at(int(token_data["expires_in"])),
    )
    return updated_credential.access_token


def get_access_token(db: Session) -> str:
    credential = db.get(MLCredential, ML_CREDENTIAL_ID)
    if credential is None:
        raise RuntimeError("ML credentials not configured. POST /internal/ml-connect first.")

    expires_at = _normalize_datetime(credential.expires_at)
    if expires_at - _utc_now() > TOKEN_REFRESH_MARGIN:
        return credential.access_token

    return _refresh_tokens(db)
