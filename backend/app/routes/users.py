import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.core.deps import get_current_user, require_super_admin, require_admin_or_above
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse, PasswordChange, UserStatusUpdate
from app.services.email import send_credentials_email
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

def generate_password(length=10):
    chars = string.ascii_letters + string.digits + "!@#$"
    return "".join(secrets.choice(chars) for _ in range(length))

def generate_emp_id(db: Session):
    while True:
        emp_id = "EMP" + "".join(secrets.choice(string.digits) for _ in range(5))
        if not db.query(User).filter(User.emp_id == emp_id).first():
            return emp_id

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.name:
        current_user.name = payload.name
    if payload.phone is not None:
        current_user.phone = payload.phone
    current_user.updated_by = current_user.id
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/password")
def change_password(payload: PasswordChange, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    current_user.updated_by = current_user.id
    db.commit()
    return {"message": "Password changed successfully"}

@router.get("/admins", response_model=List[UserResponse])
def get_admins(db: Session = Depends(get_db), current_user: User = Depends(require_super_admin)):
    return db.query(User).filter(User.role == UserRole.admin).all()

@router.get("/employees", response_model=List[UserResponse])
def get_employees(db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)):
    return db.query(User).filter(User.role == UserRole.employee).all()

@router.post("/admins", response_model=UserResponse)
async def create_admin(payload: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_super_admin)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    password = generate_password()
    user = User(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        hashed_password=hash_password(password),
        role=UserRole.admin,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    background_tasks.add_task(send_credentials_email, payload.email, payload.name, password, "Admin")
    return user

@router.post("/employees", response_model=UserResponse)
async def create_employee(payload: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    password = generate_password()
    emp_id = generate_emp_id(db)
    user = User(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        hashed_password=hash_password(password),
        role=UserRole.employee,
        emp_id=emp_id,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    background_tasks.add_task(send_credentials_email, payload.email, payload.name, password, "Employee")
    return user

@router.put("/admins/{user_id}", response_model=UserResponse)
def update_admin(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_super_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.admin).first()
    if not user:
        raise HTTPException(status_code=404, detail="Admin not found")
    if payload.name:
        user.name = payload.name
    if payload.phone is not None:
        user.phone = payload.phone
    user.updated_by = current_user.id
    db.commit()
    db.refresh(user)
    return user

@router.put("/employees/{user_id}", response_model=UserResponse)
def update_employee(user_id: int, payload: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.employee).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if payload.name:
        user.name = payload.name
    if payload.phone is not None:
        user.phone = payload.phone
    user.updated_by = current_user.id
    db.commit()
    db.refresh(user)
    return user

@router.delete("/admins/{user_id}")
def delete_admin(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_super_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.admin).first()
    if not user:
        raise HTTPException(status_code=404, detail="Admin not found")
    db.delete(user)
    db.commit()
    return {"message": "Admin deleted"}

@router.delete("/employees/{user_id}")
def delete_employee(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.employee).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.delete(user)
    db.commit()
    return {"message": "Employee deleted"}

@router.patch("/admins/{user_id}/status", response_model=UserResponse)
def toggle_admin_status(user_id: int, payload: UserStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_super_admin)):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.admin).first()
    if not user:
        raise HTTPException(status_code=404, detail="Admin not found")
    user.is_active = payload.is_active
    user.updated_by = current_user.id
    db.commit()
    db.refresh(user)
    return user

@router.patch("/employees/{user_id}/status", response_model=UserResponse)
def toggle_employee_status(user_id: int, payload: UserStatusUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.employee).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    user.is_active = payload.is_active
    user.updated_by = current_user.id
    db.commit()
    db.refresh(user)
    return user
