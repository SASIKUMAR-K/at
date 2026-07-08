from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routes import auth, users, attendance
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.core.database import SessionLocal

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "superadmin@company.com").first()
        if not existing:
            super_admin = User(
                name="Super Admin",
                email="superadmin@company.com",
                hashed_password=hash_password("Admin@123"),
                role=UserRole.super_admin,
                is_active=True,
            )
            db.add(super_admin)
            db.commit()
    finally:
        db.close()
    yield

app = FastAPI(title="Attendance Management System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(attendance.router)

@app.get("/")
def root():
    return {"message": "Attendance Management System API"}
