# Attendance Management System

## Tech Stack
- **Backend**: FastAPI + SQLAlchemy ORM + SQLite
- **Frontend**: React + Vite + TailwindCSS + Recharts

## Default Super Admin
- Email: `superadmin@company.com`
- Password: `Admin@123`

## Roles
| Role | Capabilities |
|------|-------------|
| super_admin | Full access: manage admins + employees, view all |
| admin | Manage employees, view today status, attendance, analytics |
| employee | Check in/out, view own calendar & analytics |

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
# Configure .env with your email SMTP settings
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Email Configuration
Edit `backend/.env`:
```
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password   # Gmail App Password
MAIL_FROM=your_email@gmail.com
```

## Features
- **Peoples Page**: Super admin sees Admins + Employees tabs; Admin sees only Employees
- **Add User**: Auto-generates password, sends credentials via email
- **Attendance**: Check-in/Check-out with daily reset at midnight
- **Calendar**: Color-coded attendance calendar (Leave/0-3h/3-5h/5-7h/7-9h/9+h)
- **Today Status**: Real-time employee check-in dashboard for admins
- **Analytics**: Charts for attendance trends, hours distribution, top employees
- **Profile**: Edit name/phone, change password
- **Activate/Deactivate**: Admin can toggle employee accounts; Super admin can toggle admin accounts

## API Docs
Visit `http://localhost:8000/docs` for interactive Swagger UI
