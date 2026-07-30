@echo off
cd /d "%~dp0"
echo ============================================
echo  Papes Confort - Middleware GesCom
echo ============================================
echo.
echo Instalando dependencias...
call npm install
echo.
echo Iniciando sincronizacion...
npm start
pause
