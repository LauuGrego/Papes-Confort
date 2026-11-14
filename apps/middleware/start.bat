@echo off
cd /d "%~dp0"
echo ============================================
echo  Papes Confort - Middleware GesCom
echo ============================================
echo.

if not exist "node_modules" (
    echo [1/3] Instalando dependencias...
    call npm install
    echo.
)

if not exist "dist\index.js" (
    echo [2/3] Compilando middleware a JavaScript nativo...
    call npm run build
    echo.
)

echo [3/3] Iniciando servicio de sincronizacion...
call npm start
pause
