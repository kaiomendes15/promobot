from datetime import datetime

from pydantic import BaseModel, EmailStr


class NicheResponse(BaseModel):
    id: int
    title: str
    ml_category_id: str

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    created_at: datetime

    model_config = {"from_attributes": True}
