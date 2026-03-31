@echo off
REM Clear Chrome/Edge cache and cookies
REM Trust Sense - Cache Clear Script

echo.
echo =====================================
echo Clearing browser cache...
echo =====================================
echo.

REM Close all browsers
taskkill /F /IM chrome.exe >nul 2>&1
taskkill /F /IM msedge.exe >nul 2>&1
echo ✓ Browsers closed

REM Clear Chrome cache (Windows)
if exist "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache" (
    rmdir /S /Q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache" >nul 2>&1
    echo ✓ Chrome cache cleared
)

REM Clear Edge cache (Windows)
if exist "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache" (
    rmdir /S /Q "%LOCALAPPDATA%\Microsoft\Edge\User Data\Default\Cache" >nul 2>&1
    echo ✓ Edge cache cleared
)

REM Wait
timeout /t 2 >nul

echo.
echo Opening login page...
start http://localhost:5173/login

echo.
echo ✓ Done! Browser opening to login...
echo.
echo When the page loads:
echo   1. Open DevTools (F12)
echo   2. Go to "Application" tab
echo   3. Click "Local Storage"
echo   4. Click "http://localhost:5173"
echo   5. Clear ALL entries
echo   6. Reload page (F5)
echo   7. Try login with: admin@example.com / admin123
echo.
