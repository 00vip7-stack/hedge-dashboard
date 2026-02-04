@echo off
chcp 65001 >nul
cls
echo ╔═══════════════════════════════════════╗
echo ║      HedgeFreedom Server - Start      ║
echo ╚═══════════════════════════════════════╝
echo.
echo Starting server on port 9000...
echo Open browser: http://localhost:9000
echo.
echo Press Ctrl+C to stop server
echo.
echo ═══════════════════════════════════════
echo.

python mock-server.py

pause
