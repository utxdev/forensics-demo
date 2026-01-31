@echo off
echo ============================================
echo   STARTING DIVYA DRISHTI SECURITY SYSTEM
echo ============================================

REM Start Backend
echo.
echo [1/2] Launching Backend Server...
start "Divya Drishti Backend" cmd /k "cd backend && pip install python-dotenv && python main.py"

REM Wait for backend to initialize
timeout /t 5 /nobreak

REM Start Frontend
echo.
echo [2/2] Launching Frontend Interface (React)...
cd frontend-web
echo Installing Dependencies (First Time Only)...
call npm install
echo Starting Dev Server...
cmd /k "npm run dev"
