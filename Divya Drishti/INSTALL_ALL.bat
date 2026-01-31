@echo off
echo ==========================================
echo   INSTALLING DEPENDENCIES (ONE-TIME SETUP)
echo ==========================================

echo.
echo [1/2] Installing Backend Dependencies (Python)...
cd backend
pip install -r requirements.txt
pip install python-dotenv
cd ..

echo.
echo [2/2] Installing Frontend Dependencies (Node.js)...
cd frontend-web
call npm install
cd ..

echo.
echo ==========================================
echo   INSTALLATION COMPLETE!
echo   You can now run 'RUN_LOCALLY.bat'
echo ==========================================
pause
