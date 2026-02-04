@echo off
chcp 65001 >nul
cls
echo ╔═══════════════════════════════════════╗
echo ║   HedgeFreedom Server - Auto Start   ║
echo ╚═══════════════════════════════════════╝
echo.
echo [1/3] Starting server...

start /B python mock-server.py > server.log 2>&1

echo [2/3] Waiting for server...
timeout /t 3 /nobreak >nul

echo [3/3] Opening browser...
start http://localhost:9000

echo.
echo ╔═══════════════════════════════════════╗
echo ║            Server Running!            ║
echo ╠═══════════════════════════════════════╣
echo ║  URL:  http://localhost:9000          ║
echo ║  Log:  server.log                     ║
echo ╠═══════════════════════════════════════╣
echo ║  To stop server: stop.bat             ║
echo ╚═══════════════════════════════════════╝
echo.

pause
