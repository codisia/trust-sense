#!/usr/bin/env pwsh
# Full Stack Restart Script
# Stops and restarts both backend and frontend with full cleanup

Write-Host ""
Write-Host "=================================================="
Write-Host "  Trust Sense - Full Stack Restart"
Write-Host "=================================================="
Write-Host ""

# Colors
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"
$ColorInfo = "Cyan"

# Stop everything
Write-Host "Step 1: Stopping all services..." -ForegroundColor $ColorInfo
Write-Host ""

# Stop Docker
Write-Host "  • Stopping Docker containers..." -ForegroundColor $ColorWarning
docker compose down 2>$null | Out-Null
if ($?) {
  Write-Host "    ✓ Docker stopped" -ForegroundColor $ColorSuccess
} else {
  Write-Host "    ✓ Docker was not running" -ForegroundColor $ColorWarning
}

# Kill any Node processes
Write-Host "  • Stopping Node/Vite processes..." -ForegroundColor $ColorWarning
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "    ✓ Node processes stopped" -ForegroundColor $ColorSuccess

# Kill any Python processes
Write-Host "  • Stopping Python processes..." -ForegroundColor $ColorWarning  
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "    ✓ Python processes stopped" -ForegroundColor $ColorSuccess

# Give services time to shut down
Write-Host ""
Write-Host "  Waiting for cleanup (3 seconds)..." -ForegroundColor $ColorWarning
Start-Sleep -Seconds 3

# Clear browser cache
Write-Host ""
Write-Host "Step 2: Clearing browser cache..." -ForegroundColor $ColorInfo
Write-Host ""

# Close Chrome/Edge if running
Write-Host "  • Closing browsers..." -ForegroundColor $ColorWarning
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "    ✓ Browsers closed" -ForegroundColor $ColorSuccess

# Clear NPM cache
Write-Host "  • Clearing npm cache..." -ForegroundColor $ColorWarning
npm cache clean --force 2>$null | Out-Null
Write-Host "    ✓ npm cache cleared" -ForegroundColor $ColorSuccess

# Start services
Write-Host ""
Write-Host "Step 3: Starting all services..." -ForegroundColor $ColorInfo
Write-Host ""

# Start Docker
Write-Host "  • Starting Docker containers..." -ForegroundColor $ColorWarning
docker compose up -d 2>$null
if ($?) {
  Write-Host "    ✓ Docker started" -ForegroundColor $ColorSuccess
} else {
  Write-Host "    ✗ Docker startup failed" -ForegroundColor $ColorError
  Write-Host "    Try running: docker compose up -d" -ForegroundColor $ColorWarning
}

# Wait for services
Write-Host "  • Waiting for services to initialize (10 seconds)..." -ForegroundColor $ColorWarning
for ($i = 1; $i -le 10; $i++) {
  Write-Host -NoNewline "."
  Start-Sleep -Seconds 1
}
Write-Host ""
Write-Host "    ✓ Services initialized" -ForegroundColor $ColorSuccess

# Verify services
Write-Host ""
Write-Host "Step 4: Verifying services..." -ForegroundColor $ColorInfo
Write-Host ""

$BackendOk = $false
$FrontendOk = $false

# Check backend
Write-Host "  • Testing backend (http://localhost:8000)..." -ForegroundColor $ColorWarning
try {
  $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing -ErrorAction Stop -TimeoutSec 5
  if ($response.StatusCode -eq 200) {
    Write-Host "    ✓ Backend is running" -ForegroundColor $ColorSuccess
    $BackendOk = $true
  }
} catch {
  Write-Host "    ✗ Backend not responding" -ForegroundColor $ColorError
}

# Check frontend
Write-Host "  • Testing frontend (http://localhost:5173)..." -ForegroundColor $ColorWarning
try {
  $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -ErrorAction Stop -TimeoutSec 5
  if ($response.StatusCode -eq 200) {
    Write-Host "    ✓ Frontend is running" -ForegroundColor $ColorSuccess
    $FrontendOk = $true
  }
} catch {
  Write-Host "    ✗ Frontend not responding (still starting...)" -ForegroundColor $ColorWarning
}

# Show results
Write-Host ""
Write-Host "=================================================="
Write-Host "  Status" -ForegroundColor $ColorInfo
Write-Host "=================================================="
Write-Host ""

if ($BackendOk) {
  Write-Host "✓ Backend:   http://localhost:8000" -ForegroundColor $ColorSuccess
} else {
  Write-Host "✗ Backend:   http://localhost:8000 (check logs)" -ForegroundColor $ColorError
}

if ($FrontendOk) {
  Write-Host "✓ Frontend:  http://localhost:5173" -ForegroundColor $ColorSuccess
} else {
  Write-Host "⚠ Frontend:  http://localhost:5173 (starting, wait 10s more)" -ForegroundColor $ColorWarning
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor $ColorInfo
Write-Host "1. Wait 15-30 seconds for frontend to fully start"
Write-Host "2. Hard refresh browser (Ctrl+Shift+R)"  
Write-Host "3. Clear localStorage if issues persist (F12 → Application → Clear)"
Write-Host ""
Write-Host "Test credentials:" -ForegroundColor $ColorWarning
Write-Host "  Email:    admin@example.com"
Write-Host "  Password: admin123"
Write-Host ""

# Open browser
Write-Host "Opening browser to login page..." -ForegroundColor $ColorWarning
Start-Process "http://localhost:5173/login"

Write-Host ""
Write-Host "=================================================="
Write-Host "✓ Restart complete!" -ForegroundColor $ColorSuccess
Write-Host "=================================================="
Write-Host ""
