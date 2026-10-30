@echo off
cd /d "%~dp0"
echo ============================================
echo  Consultar tabla stock_prexsuc en GesCom
echo ============================================
echo.
if exist "dist\check-stock-prexsuc.exe" (
    call "dist\check-stock-prexsuc.exe"
) else (
    call npm run check-prexsuc
)
echo.
pause
