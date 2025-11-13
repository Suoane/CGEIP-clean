# Quick Start Script for CGEIP Project - PowerShell Version
# This script starts both backend and frontend servers

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CGEIP Project - Quick Start" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if backend dependencies are installed
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Check if frontend dependencies are installed
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Display startup instructions
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting Servers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend will run on: http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend will run on: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Start backend
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "cd backend; npm start"

# Wait a moment before starting frontend
Start-Sleep -Seconds 2

# Start frontend
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList "cd frontend; npm start"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Servers Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Waiting for servers to start... This may take 30-60 seconds" -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "✓ Backend should be running at: http://localhost:5000/health" -ForegroundColor Green
Write-Host "✓ Frontend should be running at: http://localhost:3000" -ForegroundColor Green
Write-Host ""
