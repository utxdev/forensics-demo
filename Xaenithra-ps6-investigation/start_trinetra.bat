
@echo off
title Trinetra Forensic Suite - Launcher
color 0A

echo ========================================================
echo   TRINETRA FORENSIC SUITE - SYSTEM INITIALIZATION
echo ========================================================
echo.

:: 1. Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Please install Python 3.10+
    pause
    exit /b
)

:: 2. Check for Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js 18+
    pause
    exit /b
)

echo [INIT] Starting Sub-Systems...
echo.

:: 3. Start Indrajaal (Backend 1)
echo [+] Launching Indrajaal Core (Extraction Engine)...
start "Indrajaal Core (:5000)" cmd /k "cd Inderjaal\backend && python -m pip install -r requirements.txt && python main.py --gui"

:: 4. Start Sudarshana (Backend 2)
echo [+] Launching Sudarshana Network (Threat Engine)...
start "Sudarshana Core (:8000)" cmd /k "cd Sudarshana\backend && python -m pip install -r requirements.txt && python main.py"

:: 5. Start Frontend
echo [+] Launching Chitragupta Interface (UI)...
echo     (This may take a moment to compile...)
cd chitragupta\frontend
call npm install
start "Trinetra Interface (:8080)" cmd /k "npm run dev"

:: 6. Open Browser
echo.
echo [SUCCESS] All systems go. Opening Dashboard...
timeout /t 8 >nul
start http://localhost:8080

echo.
echo System remains active. Close this window to exit.
exit
