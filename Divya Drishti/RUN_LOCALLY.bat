@echo off
echo ==========================================
echo   RUNNING DIVYA DRISHTI LOCALLY
echo ==========================================

REM Start Backend in a new window
echo.
echo [1/2] Starting Backend Server...
start "Divya Backend" cmd /k "cd backend && python main.py"

REM Wait for backend to be ready
timeout /t 3 /nobreak >nul

REM Start Frontend in this window
echo.
echo [2/2] Starting Frontend Interface...
echo       (Access at http://localhost:3000)
cd frontend-web
npm run dev
