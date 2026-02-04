@echo off
chcp 65001 >nul
cls
echo ╔═══════════════════════════════════════╗
echo ║      HedgeFreedom Server - Stop       ║
echo ╚═══════════════════════════════════════╝
echo.
echo Stopping all Python servers...
echo.

taskkill /F /IM python.exe 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✓ Server stopped successfully
) else (
    echo ✓ No running server found
)

echo.
pause
