@echo off
echo === Testing Docker Build Locally ===
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker first.
    exit /b 1
)

echo 1. Building Docker image...
echo    This may take a few minutes...
echo.

REM Build with full output
docker build --no-cache --progress=plain -t tempchat-test . > build-output.log 2>&1

if errorlevel 1 (
    echo.
    echo === Build Failed ===
    echo.
    echo === Last 100 lines of build output ===
    powershell -Command "Get-Content build-output.log -Tail 100"
    echo.
    echo === Full build log saved to: build-output.log ===
    echo View the full log with: type build-output.log
    exit /b 1
) else (
    echo.
    echo === Build Successful ===
    echo.
    echo To test the container, run:
    echo   docker run -p 3000:3000 tempchat-test
)










