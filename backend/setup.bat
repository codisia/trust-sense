@echo off
echo ============================================
echo   TRUST SENSE - Backend Setup (Windows)
echo ============================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install from https://python.org
    pause
    exit /b 1
)

echo [1/4] Creating virtual environment...
python -m venv venv

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/4] Upgrading pip...
python -m pip install --upgrade pip --quiet

echo [4/4] Installing all dependencies...
pip install fastapi "uvicorn[standard]" sqlalchemy "pydantic>=2.10" pydantic-settings "python-jose[cryptography]" "passlib[bcrypt]" bcrypt anthropic python-multipart

echo.
echo ============================================
echo   SUCCESS! Now:
echo   1. Open .env in Notepad and add your ANTHROPIC_API_KEY
echo   2. Double-click start_backend.bat
echo ============================================
pause
