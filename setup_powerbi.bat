@echo off
REM Power BI Setup Script for Trust Sense
REM =======================================

echo.
echo ╔════════════════════════════════════════════╗
echo ║    Trust Sense - Power BI Setup Helper     ║
echo ╚════════════════════════════════════════════╝
echo.

REM Step 1: Get JWT Token
echo [STEP 1] Getting JWT Token for Power BI API Access...
echo.
echo To connect Power BI via REST API, you need a JWT token.
echo.
echo Option A: Use existing credentials
set /p email="Enter email (or press Enter to skip): "

if not "%email%"=="" (
    echo.
    set /p password="Enter password: "
    
    echo.
    echo Getting token from backend...
    python -c "
import requests
import json

response = requests.post(
    'http://localhost:8000/auth/login',
    json={'email': '%email%', 'password': '%password%'}
)

if response.status_code == 200:
    token = response.json()['access_token']
    print('SUCCESS! Your JWT Token:')
    print('=' * 60)
    print(token)
    print('=' * 60)
    print()
    print('Copy this token to use in Power BI Web connector')
else:
    print('Error:', response.json())
"
)

REM Step 2: Supabase Connection Details
echo.
echo [STEP 2] Supabase PostgreSQL Connection Details
echo.
echo Copy these values into Power BI:
echo.
echo Server: db.detawdfanzmrkqbcfmus.supabase.co
echo Port: 5432
echo Database: postgres
echo Username: postgres
echo.
set /p password="Enter Supabase password (from dashboard): "

echo.
echo [STEP 3] Testing Supabase Connection...
python -c "
import psycopg2

try:
    conn = psycopg2.connect(
        host='db.detawdfanzmrkqbcfmus.supabase.co',
        port=5432,
        database='postgres',
        user='postgres',
        password='%password%'
    )
    
    cursor = conn.cursor()
    cursor.execute('SELECT version()')
    print('✓ Supabase connection successful!')
    print('Database:', cursor.fetchone()[0][:50])
    cursor.close()
    conn.close()
    
except Exception as e:
    echo ✗ Connection failed: {str(e)}
"

echo.
echo [STEP 4] Power BI Connection Options
echo.
echo Choose one of two methods:
echo.
echo   1. Direct Database Connection (Recommended)
echo      - Server: db.detawdfanzmrkqbcfmus.supabase.co
echo      - Database: postgres
echo      - Tables available: user, analysis, organization
echo.
echo   2. REST API Connection (Real-time Data)
echo      - URL: http://YOUR_BACKEND/social-media/powerbi/dashboard-data
echo      - Auth: Bearer {YOUR_JWT_TOKEN}
echo      - Refresh: Every 1 hour
echo.

set /p choice="Enter choice (1 or 2): "

if "%choice%"=="1" (
    echo.
    echo Opening Power BI connection guide...
    echo.
    echo In Power BI Desktop:
    echo 1. Home → Get Data → PostgreSQL
    echo 2. Server: db.detawdfanzmrkqbcfmus.supabase.co
    echo 3. Database: postgres
    echo 4. Port: 5432
    echo 5. Username: postgres
    echo 6. Password: [Your password above]
    echo 7. Select tables and load
)

if "%choice%"=="2" (
    echo.
    echo Opening Power BI REST API connection guide...
    echo.
    echo In Power BI Desktop:
    echo 1. Home → Get Data → Web
    echo 2. URL: http://localhost:8000/social-media/powerbi/dashboard-data
    echo 3. Authentication: Custom
    echo 4. Add Header:
    echo    - Name: Authorization
    echo    - Value: Bearer {YOUR_JWT_TOKEN}
)

echo.
echo ✓ Setup complete! Refer to POWERBI_CONNECTION_GUIDE.md for details
echo.
pause
