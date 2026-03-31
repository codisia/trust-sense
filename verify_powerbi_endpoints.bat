@echo off
REM Power BI REST API Connection Verification Script
REM This script tests if the backend endpoints are working correctly

echo.
echo ============================================
echo  Power BI REST API Endpoint Verification
echo ============================================
echo.

REM Test if backend is running
echo [1/3] Checking if backend is running...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/powerbi/summary' -UseBasicParsing -TimeoutSec 3; Write-Host '✓ Backend is running!' -ForegroundColor Green } catch { Write-Host '✗ Backend is NOT running. Please start it:' -ForegroundColor Red; Write-Host '  cd backend && python -m uvicorn app.main:app --reload --port 8000' -ForegroundColor Yellow }"

echo.
echo [2/3] Testing /api/powerbi/summary endpoint...
powershell -Command "$response = Invoke-WebRequest -Uri 'http://localhost:8000/api/powerbi/summary' -UseBasicParsing; $json = $response.Content | ConvertFrom-Json; Write-Host '✓ Summary endpoint working!' -ForegroundColor Green; Write-Host 'Response:' $json | ConvertTo-Json -Depth 2"

echo.
echo [3/3] Testing /api/powerbi/data endpoint...
powershell -Command "$response = Invoke-WebRequest -Uri 'http://localhost:8000/api/powerbi/data' -UseBasicParsing; $json = $response.Content | ConvertFrom-Json; Write-Host '✓ Data endpoint working!' -ForegroundColor Green; Write-Host 'Total records in database:' $json.total_records"

echo.
echo ============================================
echo  Verification Complete
echo ============================================
echo.
echo Next steps to connect Power BI Desktop:
echo 1. Open Power BI Desktop
echo 2. Click Home ^> Get Data ^> Web
echo 3. Paste URL: http://localhost:8000/api/powerbi/summary
echo 4. Click OK and then Load
echo.
echo For more details, see: POWERBI_REST_API_GUIDE.md
echo.
pause
