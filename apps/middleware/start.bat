@echo off
cd /d "%~dp0"
set "NO_PAUSE=0"
set "ONLY_CHECK=0"
for %%A in (%*) do (
    if /i "%%~A"=="--no-pause" set "NO_PAUSE=1"
    if /i "%%~A"=="--check" set "ONLY_CHECK=1"
)

echo ============================================
echo  Papes Confort - Middleware GesCom
echo ============================================
echo.

:: [1/4] Verificar Node.js y npm
where node >nul 2>&1
if errorlevel 1 (
    echo [FALTA] Node.js no esta instalado o no figura en el PATH del sistema.
    echo         Descarga Node.js LTS v20 o superior desde: https://nodejs.org/
    goto :fail
)

node -e "const major=parseInt(process.versions.node.split('.')[0],10); if(major<20){console.log('[FALTA] Se requiere Node.js v20 o superior. Version actual: '+process.version); process.exit(1);} console.log('[OK] Node.js '+process.version);"
if errorlevel 1 (
    echo         Actualiza Node.js LTS desde: https://nodejs.org/
    goto :fail
)

where npm >nul 2>&1
if errorlevel 1 (
    echo [FALTA] npm no esta disponible en el PATH del sistema.
    echo         Reinstala Node.js LTS desde: https://nodejs.org/
    goto :fail
)

:: [2/4] Verificar archivo .env
if not exist ".env" if not exist "..\.env" (
    echo [FALTA] No se encontro el archivo .env en apps\middleware.
    echo         Copia .env.example como .env y completa los datos de MySQL, API y Cloudinary.
    goto :fail
)
echo [OK] Archivo .env encontrado.

:: [3/4] Verificar dependencias (solo instala si falta alguna)
node -e "const req=['axios','chokidar','cloudinary','dotenv','mysql2','node-cron','winston']; const missing=req.filter(m=>{try{require.resolve(m);return false;}catch{return true;}}); if(missing.length){console.log('[INFO] Faltan dependencias: '+missing.join(', ')); process.exit(1);} console.log('[OK] Dependencias instaladas.');"
if errorlevel 1 (
    if "%ONLY_CHECK%"=="1" (
        echo [FALTA] Ejecuta start.bat normalmente para instalar las dependencias faltantes.
        goto :fail
    )
    echo [1/3] Instalando dependencias faltantes...
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Fallo la instalacion de dependencias. Verifica la conexion a internet y permisos.
        goto :fail
    )
    node -e "const req=['axios','chokidar','cloudinary','dotenv','mysql2','node-cron','winston']; const missing=req.filter(m=>{try{require.resolve(m);return false;}catch{return true;}}); if(missing.length){console.log('[ERROR] Siguen faltando dependencias: '+missing.join(', ')); process.exit(1);}"
    if errorlevel 1 goto :fail
    echo [OK] Dependencias instaladas correctamente.
)

:: Validar variables minimas del .env ahora que dotenv esta disponible
node -e "const fs=require('fs'),dotenv=require('dotenv'); dotenv.config({path:fs.existsSync('.env')?'.env':'../.env',override:true}); const req=['GESCOM_DB_HOST','GESCOM_DB_NAME','GESCOM_DB_USER','API_BASE_URL','API_SYNC_KEY','IMAGES_PATH','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET']; const missing=req.filter(k=>!process.env[k]||!String(process.env[k]).trim()); if(missing.length){console.log('[FALTA] Faltan completar variables en .env: '+missing.join(', ')); process.exit(1);} if(!fs.existsSync(process.env.IMAGES_PATH)){console.log('[AVISO] No se encuentra la carpeta IMAGES_PATH: '+process.env.IMAGES_PATH);} console.log('[OK] Configuracion .env valida.');"
if errorlevel 1 goto :fail

:: [4/4] Verificar compilacion JavaScript (solo compila si falta o si cambio src\)
node -e "const fs=require('fs'),path=require('path'); const out='dist/index.js'; if(!fs.existsSync(out)){console.log('[INFO] Falta compilacion previa.'); process.exit(2);} const outTime=fs.statSync(out).mtimeMs; function hasNewer(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name); if(e.isDirectory()&&hasNewer(p))return true; if(e.isFile()&&fs.statSync(p).mtimeMs>outTime)return true;} return false;} if(fs.existsSync('src')&&hasNewer('src')){console.log('[INFO] Hay cambios en src/, requiere recompilar.'); process.exit(3);} console.log('[OK] Compilacion lista (dist/index.js).');"
if errorlevel 1 (
    if "%ONLY_CHECK%"=="1" (
        echo [FALTA] Ejecuta start.bat normalmente para compilar el middleware.
        goto :fail
    )
    node -e "require.resolve('typescript')" >nul 2>&1
    if errorlevel 1 (
        echo [INFO] Instalando compilador TypeScript...
        call npm install
        if errorlevel 1 (
            echo.
            echo [ERROR] No se pudo instalar TypeScript para compilar.
            goto :fail
        )
    )
    echo [2/3] Compilando middleware a JavaScript nativo...
    call npm run build
    if errorlevel 1 (
        echo.
        echo [ERROR] Fallo la compilacion del middleware.
        goto :fail
    )
    echo [OK] Compilacion completada.
)

if "%ONLY_CHECK%"=="1" (
    echo.
    echo [LISTO] No falta instalar nada. El middleware esta listo para ejecutarse.
    exit /b 0
)

echo.
echo Iniciando servicio de sincronizacion...
call npm start
if errorlevel 1 (
    echo.
    echo [ERROR] El servicio se detuvo con errores. Revisa apps\middleware\logs\ para mas detalle.
    goto :fail
)

if "%NO_PAUSE%"=="0" pause
exit /b 0

:fail
echo.
if "%NO_PAUSE%"=="0" pause
exit /b 1
