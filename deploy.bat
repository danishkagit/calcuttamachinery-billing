@echo off
REM Deployment script for Windows

echo === Calcutta Machinery Billing --- Deploy ===

REM Build client
echo ^> Building client...
cd client
call npm ci
call npm run build
cd ..

REM Build and start with Docker Compose
echo ^> Starting services...
docker compose down 2>nul
docker compose up -d --build

echo ^> Cleaning up...
docker system prune -f

echo ✓ Deployed successfully!
echo   Client: http://localhost
echo   Server: http://localhost:5000
pause
