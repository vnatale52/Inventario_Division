@echo off
echo ========================================
echo   Inventario Division - Startup Script
echo ========================================
echo.
echo Este script iniciara el backend y el frontend
echo.
echo IMPORTANTE:
echo - Backend (API): http://localhost:3001
echo - Frontend (App): http://localhost:5173
echo.
echo Presiona Ctrl+C para detener los servidores
echo ========================================
echo.

REM Iniciar el backend en una nueva ventana
echo Iniciando Backend...
start "Backend - Inventario API" cmd /k "cd /d "%~dp0app\server" && npm run dev"

REM Esperar 3 segundos para que el backend inicie
timeout /t 3 /nobreak >nul

REM Iniciar el frontend en una nueva ventana
echo Iniciando Frontend...
start "Frontend - Inventario App" cmd /k "cd /d "%~dp0app\client" && npm run dev"

echo.
echo ========================================
echo Servidores iniciados!
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Abre tu navegador en http://localhost:5173
echo ========================================
