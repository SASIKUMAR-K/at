from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.routes import auth, users, attendance
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.core.database import SessionLocal

app = FastAPI(title="Attendance Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(attendance.router)

@app.on_event("startup")
def startup():
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
            print("Super admin created: superadmin@company.com / Admin@123")
    finally:
        db.close()

@app.get("/")
def root():
    return {"message": "Attendance Management System API"}
