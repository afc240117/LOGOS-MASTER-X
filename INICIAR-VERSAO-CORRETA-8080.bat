@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title LOGOS MASTER X - VERSAO CORRETA 8080

cd /d "%~dp0"

echo ============================================================
echo   LOGOS MASTER X - INICIAR VERSAO CORRETA NA PORTA 8080
echo ============================================================
echo.
echo Esta pasta sera usada como a versao principal.
echo.
echo Pasta:
echo %CD%
echo.

if not exist "app\main.py" (
  echo ERRO: este arquivo precisa ficar dentro da pasta:
  echo LOGOS-MASTER-X-RENDER-LIMPO
  echo.
  echo Nao encontrei app\main.py nesta pasta.
  pause
  exit /b 1
)

echo Encerrando qualquer servidor antigo nas portas 8080 e 8081...
for %%P in (8080 8081) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr /R /C:":%%P .*LISTENING"') do (
    taskkill /PID %%I /F >nul 2>&1
  )
)

timeout /t 2 /nobreak >nul

echo.
echo Iniciando esta copia na porta 8080...
echo.

start "" powershell -NoProfile -Command "Start-Sleep -Seconds 3; Start-Process 'http://127.0.0.1:8080/'"

where py >nul 2>nul
if %errorlevel%==0 (
  py -m uvicorn app.main:app --host 127.0.0.1 --port 8080
) else (
  python -m uvicorn app.main:app --host 127.0.0.1 --port 8080
)

echo.
echo Servidor encerrado.
pause
