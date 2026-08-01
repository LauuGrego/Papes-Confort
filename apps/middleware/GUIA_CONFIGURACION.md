# Guía de Configuración del Middleware (PC de Ale)

Esta guía detalla paso a paso todo lo necesario para configurar y poner en marcha el middleware de sincronización de **Papes Confort** en la PC de Ale (donde reside el sistema GesCom y su base de datos).

---

## 📋 Requisitos Previos

Para que el middleware funcione correctamente en la PC, se necesita:

1. **Sistema Operativo**: Windows 10, Windows 11 o Windows Server.
2. **Acceso Local**:
   - Conexión a la base de datos MySQL de GesCom (usualmente llamada `agc_sql_datosges`).
   - Acceso al directorio donde GesCom almacena las imágenes de los productos (ej. `D:\GESCOM28\Datos G\GESCOM\Imagenes`).
3. **Acceso a Internet**: Para enviar datos al backend del e-commerce y subir imágenes a Cloudinary.

---

## 🛠️ Paso 1: Instalación de Node.js

El middleware está desarrollado en TypeScript/Node.js, por lo que requiere el entorno de ejecución:

1. Descarga el instalador de **Node.js LTS** desde el sitio oficial: [https://nodejs.org/](https://nodejs.org/) (se recomienda la versión 20 o superior).
2. Ejecuta el instalador `.msi` descargado.
3. Sigue las instrucciones del asistente de instalación. **Asegúrate** de dejar marcada la opción que añade Node a las variables de entorno (_Add to PATH_).
4. Al finalizar, puedes verificar la instalación abriendo una consola (`cmd` o `PowerShell`) y ejecutando:
   ```cmd
   node -v
   npm -v
   ```
   Ambos comandos deben retornar la versión instalada sin dar errores.

---

## 📁 Paso 2: Ubicación del Código del Middleware

Coloca la carpeta del middleware en una ruta persistente del disco local de la PC.

- Ejemplo recomendado: `C:\PapesConfort`

Dentro de este directorio, la carpeta específica del middleware se encuentra en `C:\PapesConfort\apps\middleware`.

---

## ⚙️ Paso 3: Configuración de Variables de Entorno (`.env`)

En la carpeta del middleware (`apps/middleware`), debes crear un archivo de configuración llamado `.env` para conectar el middleware con la base de datos de GesCom, la API del e-commerce y Cloudinary.

1. Ve a la carpeta `apps/middleware`.
2. Duplica el archivo `.env.example` y cámbiale el nombre a `.env`.
3. Abre el archivo `.env` con el Bloc de notas u otro editor y completa los siguientes datos:

```ini
# 1. Conexión MySQL a GesCom
GESCOM_DB_HOST=localhost            # IP o host donde corre el MySQL de GesCom (ej: localhost o 127.0.0.1)
GESCOM_DB_PORT=3306                 # Puerto de MySQL (por defecto 3306)
GESCOM_DB_NAME=agc_sql_datosges     # Nombre de la base de datos de GesCom
GESCOM_DB_USER=agc_guest            # Usuario de MySQL con permisos de lectura a la tabla 'Stock_Articulo'
GESCOM_DB_PASS=guest                # Contraseña del usuario de MySQL

# 2. Configuración de API del Backend (Tienda)
# Reemplazar con la URL real de producción del backend cuando se despliegue.
API_BASE_URL=http://localhost:3001
# Debe coincidir exactamente con el valor 'API_SYNC_KEY' configurado en el backend
API_SYNC_KEY=fc93497e-dfa4-419d-a289-6bbfe686c212

# 3. Ruta Local de las Imágenes de GesCom
# Ruta exacta donde GesCom guarda las fotos. Las fotos deben llamarse exactamente como el SKU (ej. 10025.jpg)
IMAGES_PATH=D:\GESCOM28\Datos G\GESCOM\Imagenes

# 4. Configuración de Cloudinary (Subida de fotos)
CLOUDINARY_CLOUD_NAME=dotxvd5dc
CLOUDINARY_API_KEY=494187312773391
CLOUDINARY_API_SECRET=dxD8oLE73v6EYbyPT9yGfyhD5sE

# 5. Ajustes de Sincronización
# Expresión cron para la frecuencia. */1 * * * * significa cada 1 minuto.
PRODUCTS_SYNC_CRON=*/1 * * * *
# Cantidad de stock que se descuenta para seguridad en el backend.
# Si el producto tiene stock 2 en GesCom y SAFETY_STOCK=1, el e-commerce mostrará stock 1.
SAFETY_STOCK=0
```

> [!IMPORTANT]
> El token `API_SYNC_KEY` es la llave de seguridad que utiliza el middleware para comunicarse con el e-commerce. Si este token no coincide con el del backend, todas las sincronizaciones darán error `401 Unauthorized`.

---

## 🚀 Paso 4: Ejecución mediante `start.bat`

El archivo `start.bat` simplifica la instalación e inicio del servicio en Windows.

- Está ubicado en: `apps/middleware/start.bat`
- **¿Qué hace?**
  1. Instala automáticamente las dependencias de Node.js la primera vez que se ejecuta (mediante `npm install`).
  2. Inicia el servidor de sincronización (`npm start`), el cual conecta a la BD de GesCom, realiza la primera sincronización de productos, y se queda escuchando cambios de imágenes en tiempo real.

Para probar que todo funciona, simplemente **haz doble clic en `start.bat`**. Deberías ver una ventana negra mostrando registros indicando que la conexión a la base de datos GesCom fue exitosa.

---

## 🕒 Paso 5: Automatización del Arranque en Windows

Para garantizar que el middleware empiece a funcionar de manera continua e independiente de reinicios del sistema, puedes automatizar su arranque de dos formas:

### Método A: Carpeta de Inicio de Windows (Fácil)

Este método inicia el middleware de forma automática cada vez que Ale inicia sesión en su cuenta de Windows:

1. Presiona las teclas `Win + R` en tu teclado para abrir el cuadro de diálogo "Ejecutar".
2. Escribe `shell:startup` y presiona **Enter**. Se abrirá una carpeta especial de Windows.
3. Ve a la carpeta `apps/middleware/` del proyecto, haz clic derecho sobre el archivo `start.bat` y selecciona **Crear acceso directo**.
4. Corta el acceso directo creado y pégalo dentro de la carpeta que abriste en el paso 2 (`shell:startup`).
5. ¡Listo! Cada vez que inicie la PC y el usuario ingrese a su sesión, la ventana negra del middleware se ejecutará automáticamente.

### Método B: Programador de Tareas de Windows (Recomendado para Servidores)

Este método ejecuta el middleware de forma oculta en segundo plano ni bien arranca la PC, sin necesidad de que haya un usuario con la sesión iniciada:

1. Presiona `Win`, escribe **Programador de Tareas** y ábrelo.
2. En el panel derecho, haz clic en **Crear tarea básica...**
3. Ponle un nombre (ej. `Papes Confort - Middleware`) y presiona Siguiente.
4. En el desencadenador, selecciona **Al iniciar el equipo** y presiona Siguiente.
5. En acción, selecciona **Iniciar un programa**.
6. En "Programa o script", haz clic en Examinar y selecciona el archivo `start.bat` (ej: `C:\PapesConfort\apps\middleware\start.bat`).
7. **Muy importante**: En el campo **Iniciar en (opcional)**, escribe la ruta completa del directorio donde está el archivo `.bat` (ej: `C:\PapesConfort\apps\middleware\`). _Si omites esto, el script fallará al intentar buscar los archivos locales._
8. Haz clic en Siguiente y luego en Finalizar.
9. Busca tu nueva tarea en la lista del centro, hazle clic derecho y selecciona **Propiedades**.
10. En la pestaña "General", selecciona la opción **Ejecutar tanto si el usuario inició sesión como si no** y activa la casilla **Ejecutar con los privilegios más altos**.
11. Presiona Aceptar (se te solicitará la contraseña de administrador de la PC para guardar).

---

## 📸 Paso 3.1: Configuración inicial de Cloudinary (Paso a Paso)

Sigue estos pasos para obtener las credenciales de Cloudinary y configurar la subida de imágenes:

1. **Crear o Iniciar Sesión en Cloudinary**:
   - Ingresa a [https://cloudinary.com/](https://cloudinary.com/) y regístrate (es gratis) o inicia sesión con tu cuenta.
2. **Ir al Panel de Control (Dashboard)**:
   - Una vez dentro, haz clic en **Console** (o ve directamente a [https://console.cloudinary.com/](https://console.cloudinary.com/)).
3. **Copiar las Credenciales del API**:
   - En la pantalla principal del Dashboard (sección _Product Environment Details_), verás tres campos clave:
     - **Cloud Name**
     - **API Key**
     - **API Secret** (haz clic en el botón de revelar/ojo para ver la clave completa).
4. **Pegar en el archivo `.env` del Middleware**:
   - Abre tu archivo `.env` (`apps/middleware/.env`) y pega los valores correspondientes:
     ```ini
     CLOUDINARY_CLOUD_NAME=tu_cloud_name
     CLOUDINARY_API_KEY=tu_api_key
     CLOUDINARY_API_SECRET=tu_api_secret
     ```
5. **Preparar las imágenes en GesCom**:
   - Asegúrate de que los archivos de imágenes en tu carpeta local (ej: `D:\GESCOM28\Datos G\GESCOM\Imagenes`) tengan como nombre **exactamente el SKU del producto** en GesCom.
   - _Ejemplo_: Para el producto con SKU `10025`, la imagen debe guardarse como `10025.jpg` o `10025.png`.

## 🔍 Monitoreo y Solución de Problemas

- **Logs**: El middleware escribe automáticamente un historial detallado en la carpeta `apps/middleware/logs/`. Si algo falla o no se sincroniza un producto, revisa estos archivos de texto para ver la causa exacta.
- **Historial de cambios (`sync-state.json`)**: El middleware crea un archivo `sync-state.json` en la carpeta `apps/middleware`. Este archivo guarda un hash criptográfico del estado de cada producto. Si el producto no ha cambiado de precio o stock en GesCom, el middleware lo ignora para no sobrecargar el servidor de internet. Si alguna vez necesitas forzar la sincronización completa de todos los productos desde cero, simplemente borra el archivo `sync-state.json` y vuelve a correr el middleware.
- **Carga Inicial de Imágenes**: Si necesitas subir por primera vez todas las imágenes existentes de GesCom a Cloudinary en lote, puedes abrir una terminal en la carpeta `apps/middleware` y ejecutar:
  ```cmd
  npm run upload-images
  ```
  Esto recorrerá la carpeta `IMAGES_PATH` y subirá las imágenes correspondientes a los productos registrados.
