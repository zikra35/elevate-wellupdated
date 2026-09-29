@echo off
echo Starting MongoDB...
start "MongoDB" "D:\projects\mongodb\mongodb-win32-x86_64-windows-7.0.14\bin\mongod.exe" --dbpath "D:\projects\mongodb-data" --port 27017
timeout /t 2 /nobreak > nul
echo MongoDB is running on port 27017
echo.
echo Starting Backend...
cd /d "D:\projects\radiant-health-companion-main (1)\radiant-health-companion-main\backend"
start "Backend" cmd /k "npm run dev"
timeout /t 2 /nobreak > nul
echo.
echo Starting Frontend...
cd /d "D:\projects\radiant-health-companion-main (1)\radiant-health-companion-main"
start "Frontend" cmd /k "npm run dev"
echo.
echo All services started!
echo   MongoDB  -> mongodb://localhost:27017
echo   Backend  -> http://localhost:5000
echo   Frontend -> http://localhost:8080 (or next available port)
pause
