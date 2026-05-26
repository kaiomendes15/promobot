from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.auth_config import get_current_user
from app.database import get_db
from app.models.niche import Niche
from app.models.user import User
from app.schemas.user_schema import NicheResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/niches", response_model=list[NicheResponse])
def list_niches(db: Session = Depends(get_db)) -> list[Niche]:
    return db.query(Niche).order_by(Niche.title).all()


@router.post("/me/niches/{niche_id}", response_model=NicheResponse)
def subscribe_to_niche(
    niche_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Niche:
    niche = db.get(Niche, niche_id)
    if niche is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Niche not found",
        )

    if niche not in current_user.niches:
        current_user.niches.append(niche)
        db.commit()
        db.refresh(current_user)

    return niche


@router.get("/me/niches", response_model=list[NicheResponse])
def list_my_niches(
    current_user: User = Depends(get_current_user),
) -> list[Niche]:
    return sorted(current_user.niches, key=lambda niche: niche.title)
