import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, hash_password
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest
from app.services.email import send_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])

_reset_tokens: dict = {}

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Contact admin.")
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token, role=user.role, name=user.name, user_id=user.id)

@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email")
    token = str(secrets.randbelow(900000) + 100000)
    _reset_tokens[payload.email] = (token, datetime.utcnow() + timedelta(minutes=15))
    background_tasks.add_task(send_reset_email, payload.email, user.name, token)
    return {"message": "Reset code sent to your email"}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    entry = _reset_tokens.get(payload.email)
    if not entry:
        raise HTTPException(status_code=400, detail="No reset request found. Request a new code.")
    token, expiry = entry
    if datetime.utcnow() > expiry:
        _reset_tokens.pop(payload.email, None)
        raise HTTPException(status_code=400, detail="Reset code has expired. Request a new one.")
    if token != payload.token:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    _reset_tokens.pop(payload.email, None)
    return {"message": "Password reset successfully"}
