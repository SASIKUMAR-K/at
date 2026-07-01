from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

class UserCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: EmailStr
    role: UserRole
    emp_id: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: str
    role: UserRole
    emp_id: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int]
    updated_by: Optional[int]

    class Config:
        from_attributes = True

class UserStatusUpdate(BaseModel):
    is_active: bool
