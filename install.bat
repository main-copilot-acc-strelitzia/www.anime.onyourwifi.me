@echo off
REM Cross-platform installer for Strelitzia
REM Run from PowerShell or Command Prompt on Windows

echo.
echo ==================================================
echo  Strelitzia - Cross-Platform Setup for Windows
echo ==================================================
echo.

REM Check Node.js installation
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Node.js is not installed or not in PATH
    echo.
    echo Please install Node.js 18.17.0 or higher from:
    echo   https://nodejs.org/
    echo.
    echo After installation, restart your terminal and run this script again.
    echo.
    pause
    exit /b 1
)

REM Check npm installation
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] npm is not installed or not in PATH
    echo.
    pause
    exit /b 1
)

REM Display versions
echo [INFO] Checking prerequisites...
node --version
npm --version
echo.

REM Run setup script
echo [INFO] Running setup...
call npm run setup

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Setup failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ==================================================
echo  Setup completed successfully!
echo ==================================================
echo.
echo Next steps:
echo   1. Edit api\.env with your configuration
echo   2. Edit web\.env.local with your API URL
echo   3. Run: npm run dev
echo.
echo Visit http://localhost:3000 in your browser
echo.
pause
