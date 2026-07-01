from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin_or_above
from app.models.user import User, UserRole
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceResponse, DailyStatus
from typing import List, Optional

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.post("/checkin", response_model=AttendanceResponse)
def checkin(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    existing = db.query(Attendance).filter(Attendance.user_id == current_user.id, Attendance.date == today).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already checked in today")
    attendance = Attendance(
        user_id=current_user.id,
        date=today,
        login_time=datetime.utcnow(),
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance

@router.post("/checkout", response_model=AttendanceResponse)
def checkout(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    attendance = db.query(Attendance).filter(Attendance.user_id == current_user.id, Attendance.date == today).first()
    if not attendance:
        raise HTTPException(status_code=400, detail="No check-in found for today")
    if attendance.logout_time:
        raise HTTPException(status_code=400, detail="Already checked out today")
    attendance.logout_time = datetime.utcnow()
    attendance.updated_by = current_user.id
    db.commit()
    db.refresh(attendance)
    return attendance

@router.get("/today", response_model=AttendanceResponse)
def get_today_attendance(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today = date.today()
    attendance = db.query(Attendance).filter(Attendance.user_id == current_user.id, Attendance.date == today).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="No attendance for today")
    return attendance

@router.get("/my", response_model=List[AttendanceResponse])
def get_my_attendance(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Attendance).filter(Attendance.user_id == current_user.id).order_by(Attendance.date.desc()).all()

@router.get("/today-status", response_model=List[DailyStatus])
def today_status(db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)):
    today = date.today()
    records = (
        db.query(Attendance, User)
        .join(User, Attendance.user_id == User.id)
        .filter(Attendance.date == today, User.role == UserRole.employee)
        .all()
    )
    result = []
    for att, user in records:
        hours = None
        if att.login_time and att.logout_time:
            hours = round((att.logout_time - att.login_time).total_seconds() / 3600, 2)
        result.append(DailyStatus(
            user_id=user.id,
            user_name=user.name,
            emp_id=user.emp_id,
            login_time=att.login_time,
            logout_time=att.logout_time,
            hours_worked=hours,
        ))
    return result

@router.get("/employee/{user_id}", response_model=List[AttendanceResponse])
def get_employee_attendance(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)):
    return db.query(Attendance).filter(Attendance.user_id == user_id).order_by(Attendance.date.desc()).all()

@router.get("/analytics/admin")
def admin_analytics(db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_above)):
    today = date.today()
    total_employees = db.query(User).filter(User.role == UserRole.employee, User.is_active == True).count()
    present_today = db.query(Attendance).filter(Attendance.date == today).count()
    absent_today = total_employees - present_today

    from sqlalchemy import extract
    monthly = (
        db.query(Attendance.date, func.count(Attendance.id))
        .filter(extract("month", Attendance.date) == today.month, extract("year", Attendance.date) == today.year)
        .group_by(Attendance.date)
        .order_by(Attendance.date)
        .all()
    )

    hours_dist = {"0-3": 0, "3-5": 0, "5-7": 0, "9+": 0}
    all_att = db.query(Attendance).filter(Attendance.login_time != None, Attendance.logout_time != None).all()
    for att in all_att:
        h = (att.logout_time - att.login_time).total_seconds() / 3600
        if h < 3:
            hours_dist["0-3"] += 1
        elif h < 5:
            hours_dist["3-5"] += 1
        elif h < 7:
            hours_dist["5-7"] += 1
        else:
            hours_dist["9+"] += 1

    top_employees = (
        db.query(User.name, func.count(Attendance.id).label("days"))
        .join(Attendance, User.id == Attendance.user_id)
        .filter(User.role == UserRole.employee)
        .group_by(User.id)
        .order_by(func.count(Attendance.id).desc())
        .limit(5)
        .all()
    )

    return {
        "total_employees": total_employees,
        "present_today": present_today,
        "absent_today": absent_today,
        "attendance_rate": round(present_today / total_employees * 100, 1) if total_employees else 0,
        "monthly_trend": [{"date": str(d), "count": c} for d, c in monthly],
        "hours_distribution": hours_dist,
        "top_employees": [{"name": n, "days": d} for n, d in top_employees],
    }

@router.get("/analytics/employee")
def employee_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from sqlalchemy import extract
    today = date.today()
    records = db.query(Attendance).filter(Attendance.user_id == current_user.id).all()

    total_days = len(records)
    present_days = len([r for r in records if r.login_time])
    monthly = [r for r in records if r.date.month == today.month and r.date.year == today.year]
    monthly_present = len([r for r in monthly if r.login_time])

    hours_list = []
    for r in records:
        if r.login_time and r.logout_time:
            h = round((r.logout_time - r.login_time).total_seconds() / 3600, 2)
            hours_list.append(h)

    avg_hours = round(sum(hours_list) / len(hours_list), 2) if hours_list else 0

    weekly = {}
    for r in records[-30:]:
        day = r.date.strftime("%a")
        if day not in weekly:
            weekly[day] = 0
        weekly[day] += 1

    return {
        "total_days_present": present_days,
        "this_month_present": monthly_present,
        "avg_hours_per_day": avg_hours,
        "weekly_pattern": weekly,
        "total_hours": round(sum(hours_list), 2),
    }
