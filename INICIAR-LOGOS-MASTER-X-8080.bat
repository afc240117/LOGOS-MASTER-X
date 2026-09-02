@echo off
cd /d "%~dp0"
title LOGOS MASTER X 5.3.10
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:8080/'"
where py >nul 2>nul
if %errorlevel%==0 (
  py -m uvicorn app.main:app --host 127.0.0.1 --port 8080
) else (
  python -m uvicorn app.main:app --host 127.0.0.1 --port 8080
)
echo.
echo Servidor encerrado.
pause
