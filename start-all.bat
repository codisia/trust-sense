@echo off
REM Trust Sense - Quick Start Script
REM Starts backend, frontend, and opens browser

echo.
echo ========================================
echo   Trust Sense - Full Stack Startup
echo ========================================
echo.

REM Check if backend is running
echo [1/3] Checking backend server...
timeout /t 1 > nul

REM Start backend in new window
echo [1/3] Starting backend on http://localhost:8000...
start "Trust Sense Backend" cmd /k "cd backend && ..\\.venv\\Scripts\\Activate.ps1 && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 > nul

REM Start frontend in new window
echo [2/3] Starting frontend on http://localhost:5173...
start "Trust Sense Frontend" cmd /k "cd frontend && npm install 2>nul & npm run dev"

REM Wait for frontend to start
echo Waiting for frontend to initialize...
timeout /t 5 > nul

REM Open browser
echo [3/3] Opening browser...
start http://localhost:5173/login

echo.
echo ========================================
echo ✓ Trust Sense is starting up!
echo ========================================
echo.
echo Backend:   http://localhost:8000
echo Frontend:  http://localhost:5173
echo API Docs:  http://localhost:8000/docs
echo.
echo Default credentials:
echo   Email:    admin@example.com
echo   Password: admin123
echo.
echo To stop: Close the terminal windows
echo.
pause
