# AttendanceMS

> Attendance Management System — FastAPI + React

[![Dev CI](https://github.com/SASIKUMAR-K/at/actions/workflows/dev-ci.yml/badge.svg)](https://github.com/SASIKUMAR-K/at/actions/workflows/dev-ci.yml)
[![Prod Release](https://github.com/SASIKUMAR-K/at/actions/workflows/prod-release.yml/badge.svg)](https://github.com/SASIKUMAR-K/at/actions/workflows/prod-release.yml)

## 🌐 Deployments

| Environment | Frontend | Backend |
|-------------|----------|---------|
| **Production** | [at-app.vercel.app](https://at-app.vercel.app) | [at-api.vercel.app](https://at-api.vercel.app) |
| **Dev** | [at-app-dev.vercel.app](https://at-app-dev.vercel.app) | [at-api-dev.vercel.app](https://at-api-dev.vercel.app) |

## 🔐 Default Super Admin
- Email: `superadmin@company.com`
- Password: `Admin@123`

## 🛠 Tech Stack
- **Backend**: FastAPI + SQLAlchemy + SQLite (dev) / PostgreSQL Neon (prod)
- **Frontend**: React + Vite + TailwindCSS + Recharts

## 🚀 Local Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your values
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 🌿 Branch Strategy

```
main          ← production (protected, no direct push)
  └── feature/xxx   ← your work branch
  └── fix/xxx
  └── chore/xxx
```

- **Direct push to `main` is blocked**
- All changes go through a **Pull Request**
- PR triggers **Dev CI** (build + lint checks)
- Merge to `main` triggers **Prod Release** (auto version tag + deploy)

## 🔖 Versioning (Semver)

Version is auto-bumped on every merge to `main` based on commit message:

| Commit message contains | Bump |
|------------------------|------|
| `BREAKING` or `major`  | Major (X.0.0) |
| `feat` or `feature`    | Minor (x.X.0) |
| anything else          | Patch (x.x.X) |

## ☁️ Deployment Guide

### Database
- **Dev**: SQLite (local file, no setup needed)
- **Prod**: [Neon](https://neon.tech) — free PostgreSQL
  1. Create account at neon.tech
  2. Create a new project → copy the connection string
  3. Add to Vercel env vars: `DATABASE_URL=postgresql://...`

### Vercel Setup (4 projects total)

#### 1. Backend — Dev (`at-api-dev`)
```
Root Directory: backend
Framework: Other
Build Command: pip install -r requirements.txt
Output Directory: (leave empty)
```
Env vars:
```
DATABASE_URL=sqlite:///./attendance.db   ← or a separate Neon dev branch
SECRET_KEY=...
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM=...
```

#### 2. Backend — Prod (`at-api`)
Same as above but:
```
DATABASE_URL=postgresql://...neon.tech/neondb?sslmode=require
```

#### 3. Frontend — Dev (`at-app-dev`)
```
Root Directory: frontend
Framework: Vite
```
Env vars:
```
VITE_API_URL=https://at-api-dev.vercel.app
```

#### 4. Frontend — Prod (`at-app`)
```
VITE_API_URL=https://at-api.vercel.app
```

### GitHub Secrets Required

Go to **Settings → Secrets → Actions** and add:

| Secret | Where to get |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Account Settings → General |
| `VERCEL_BACKEND_PROJECT_ID` | Vercel project settings (prod backend) |
| `VERCEL_FRONTEND_PROJECT_ID` | Vercel project settings (prod frontend) |

### GitHub Branch Protection (main)

Go to **Settings → Branches → Add rule** for `main`:
- ✅ Require pull request before merging
- ✅ Require status checks: `Backend — Python checks`, `Frontend — Build check`
- ✅ Require approvals: 1
- ✅ Block direct pushes
- ✅ Require linear history

## 📁 Project Structure

```
.
├── .github/
│   ├── workflows/
│   │   ├── dev-ci.yml          ← runs on every PR
│   │   └── prod-release.yml    ← runs on merge to main
│   └── pull_request_template.md
├── backend/
│   ├── app/
│   │   ├── core/       (config, db, security, deps)
│   │   ├── models/     (SQLAlchemy models)
│   │   ├── routes/     (API endpoints)
│   │   ├── schemas/    (Pydantic schemas)
│   │   └── services/   (email)
│   ├── vercel.json
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/        (axios instance)
    │   ├── components/ (Layout, ProtectedRoute)
    │   ├── context/    (AuthContext)
    │   └── pages/      (admin/, employee/, Login, Profile)
    ├── vercel.json
    └── .env.example
```

## 📋 Roles

| Role | Access |
|------|--------|
| `super_admin` | Full access — manage admins + employees |
| `admin` | Manage employees, view attendance & analytics |
| `employee` | Check in/out, view own calendar & analytics |
