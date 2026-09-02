@echo off
chcp 65001 >nul
cd /d "%~dp0"
title INSTALAR LOGOS MASTER X 5.3.10

echo ============================================================
echo   LOGOS MASTER X 5.3.10 - INSTALACAO DE DEPENDENCIAS
echo ============================================================
echo.
echo Pasta do programa: %CD%
echo.

where py >nul 2>nul
if %errorlevel%==0 goto instalar_com_py

where python >nul 2>nul
if %errorlevel%==0 goto instalar_com_python

echo ERRO: Python nao foi encontrado.
echo Instale o Python e marque a opcao para adiciona-lo ao PATH.
pause
exit /b 1

:instalar_com_py
py -m pip install -r "%~dp0requirements.txt"
if errorlevel 1 goto falha
goto concluido

:instalar_com_python
python -m pip install -r "%~dp0requirements.txt"
if errorlevel 1 goto falha
goto concluido

:concluido
echo.
echo ============================================================
echo   INSTALACAO CONCLUIDA
echo ============================================================
echo Agora execute: INICIAR-LOGOS-MASTER-X-8080.bat
pause
exit /b 0

:falha
echo.
echo A instalacao nao foi concluida. Verifique sua conexao com a internet
echo e execute este arquivo novamente.
pause
exit /b 1
