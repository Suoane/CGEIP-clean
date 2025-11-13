@echo off
REM Quick Start Script for CGEIP Project
REM This script starts both backend and frontend servers

echo.
echo ========================================
echo   CGEIP Project - Quick Start
echo ========================================
echo.

REM Check if Node is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ Node.js found
echo.

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo ✓ Backend dependencies installed
    echo.
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo ✓ Frontend dependencies installed
    echo.
)

REM Display startup instructions
echo.
echo ========================================
echo   Starting Servers
echo ========================================
echo.
echo To start the backend server, open a new terminal and run:
echo   cd backend
echo   npm start
echo.
echo To start the frontend server, open another new terminal and run:
echo   cd frontend
echo   npm start
echo.
echo Or run both in parallel:
echo   start cmd /k "cd backend & npm start"
echo   start cmd /k "cd frontend & npm start"
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
echo Press any key to continue...
pause

REM Start both servers in new windows
start cmd /k "cd backend && npm start"
start cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   Servers Started!
echo ========================================
echo.
echo Check the separate terminal windows for logs
echo.
