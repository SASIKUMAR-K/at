from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date

class AttendanceResponse(BaseModel):
    id: int
    user_id: int
    date: date
    login_time: Optional[datetime]
    logout_time: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AttendanceWithUser(AttendanceResponse):
    user_name: str
    emp_id: Optional[str]

class DailyStatus(BaseModel):
    user_id: int
    user_name: str
    emp_id: Optional[str]
    login_time: Optional[datetime]
    logout_time: Optional[datetime]
    hours_worked: Optional[float]
