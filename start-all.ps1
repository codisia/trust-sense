#!/usr/bin/env pwsh
# Trust Sense - Quick Start Script (PowerShell)
# Starts backend and frontend servers

Write-Host ""
Write-Host "========================================"
Write-Host "  Trust Sense - Full Stack Startup"
Write-Host "========================================"
Write-Host ""

# Helper function to check port
function Test-Port {
    param([int]$Port)
    $Test = New-Object System.Net.Sockets.TcpClient
    try {
        $Test.Connect("127.0.0.1", $Port)
        return $true
    }
    catch {
        return $false
    }
}

# Check backend
Write-Host "[1/3] Checking if backend is running on :8000..." -ForegroundColor Cyan

$BackendRunning = Test-Port 8000
if ($BackendRunning) {
    Write-Host "✓ Backend already running on http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "Starting backend server..." -ForegroundColor Yellow
    $BackendProcess = Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd backend; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -PassThru -WindowStyle Normal
    Write-Host "✓ Backend process started (PID: $($BackendProcess.Id))" -ForegroundColor Green
    
    Write-Host "Waiting for backend to initialize (5 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Check frontend  
Write-Host ""
Write-Host "[2/3] Checking if frontend is running on :5173..." -ForegroundColor Cyan

$FrontendRunning = Test-Port 5173
if ($FrontendRunning) {
    Write-Host "✓ Frontend already running on http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "Starting frontend dev server..." -ForegroundColor Yellow
    Push-Location "frontend"
    $FrontendProcess = Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npm install 2>$null; npm run dev" -PassThru -WindowStyle Normal
    Pop-Location
    Write-Host "✓ Frontend process started (PID: $($FrontendProcess.Id))" -ForegroundColor Green
    
    Write-Host "Waiting for frontend to initialize (5 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Open browser
Write-Host ""
Write-Host "[3/3] Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173/login"

Write-Host ""
Write-Host "========================================"
Write-Host "✓ Trust Sense is starting up!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "Backend:   http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor Yellow
Write-Host "API Docs:  http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Default credentials:" -ForegroundColor Cyan
Write-Host "  Email:    admin@example.com"
Write-Host "  Password: admin123"
Write-Host ""
Write-Host "Monitor backend & frontend in their terminal windows" -ForegroundColor Gray
Write-Host "To stop everything: Close the terminal windows" -ForegroundColor Gray
Write-Host ""
