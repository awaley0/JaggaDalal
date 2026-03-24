@echo off
REM Quick Start Script for FYP Project
REM This script starts both Backend and Frontend in separate windows
REM Prerequisites: Node.js, MongoDB running

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║      FYP Authentication System - Quick Start              ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

REM Check if Node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if MongoDB is running
mongo --eval "db.version()" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WARNING: MongoDB might not be running
    echo Please start MongoDB before continuing
    echo Run: mongod
    pause
)

echo.
echo 📦 Installing dependencies...
echo.

REM Backend setup
cd Backend
if not exist node_modules (
    echo 🔄 Installing Backend dependencies...
    call npm install
) else (
    echo ✅ Backend dependencies already installed
)

cd ..

REM Frontend setup
cd Frontend
if not exist node_modules (
    echo 🔄 Installing Frontend dependencies...
    call npm install
) else (
    echo ✅ Frontend dependencies already installed
)

cd ..

echo.
echo ✨ Setup complete!
echo.
echo 🚀 Starting servers...
echo.

REM Start Backend
start cmd /k "echo 📡 Starting Backend... && cd Backend && npm run dev"

REM Wait a moment
timeout /t 2 /nobreak

REM Start Frontend
start cmd /k "echo 🎨 Starting Frontend... && cd Frontend && npm run dev"

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║  ✅ Servers starting...                                   ║
echo ║  📡 Backend:  http://localhost:5000                        ║
echo ║  🎨 Frontend: http://localhost:5173                        ║
echo ║                                                            ║
echo ║  Open http://localhost:5173 in your browser               ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.

pause
