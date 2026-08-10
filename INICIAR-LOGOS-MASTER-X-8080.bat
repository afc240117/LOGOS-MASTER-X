@echo off
cd /d "%~dp0"
title LOGOS MASTER X 3.7.7
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://127.0.0.1:8080/'"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8080
echo.
echo Servidor encerrado.
pause
