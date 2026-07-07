@echo off
echo Starting Backend...
cd backend
pip install -r requirements.txt --only-binary=:all:
python -m uvicorn app.main:app --reload --port 8000
pause
