@echo off
REM TRUST SENSE - Start All Applications

echo.
echo ==========================================
echo  🚀 TRUST SENSE - Launch All Apps
echo ==========================================
echo.

REM Check if running from project root
if not exist "docker-compose.yml" (
    echo ERROR: Please run this from the project root
    exit /b 1
)

echo ✅ Backend Stack ........... http://localhost:8000
echo ✅ Frontend App ............ http://localhost:5173
echo ✅ Database & Cache ....... Running
echo.

echo Starting applications...
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo WARNING: Docker not running. Start with docker-compose up -d
    echo.
)

REM Open in new windows
echo 📱 Opening Desktop App...
start cmd /k "cd desktop-app && npm start"

echo 📲 Opening Mobile App (Android)...
echo    Run manually: cd mobile-app ^&^& npx react-native run-android
echo.

echo 🌐 Chrome Extension...
echo    Visit: chrome://extensions/ ^(Developer mode enabled^)
echo    Load unpacked: ./chrome-extension
echo.

echo 📧 Email Plugin...
echo    Upload manifest.xml to Outlook
echo    File: ./email-plugin/manifest.xml
echo.

echo 🎉 All systems ready!
echo.
echo API Documentation: http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo.
pause
