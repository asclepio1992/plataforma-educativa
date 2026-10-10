# Publicar Aula Studio sin perder las clases

La aplicación necesita un proceso Node.js permanente y un volumen persistente. Guarda grupos, presentaciones, sesiones, perfil, evidencias, agenda, versiones y respaldos en `AULA_DATA_DIR`. Usa **una sola instancia / réplica**: el estado en vivo reside en memoria y los archivos JSON no coordinan varios procesos. No uses PM2 en modo cluster, balanceo entre réplicas ni funciones serverless para este backend.

## Elegir alojamiento

| Alternativa | Adecuación para esta versión |
| --- | --- |
| Tu computadora o un servidor del centro, accesible por la red del aula | Conserva las funciones actuales y el almacenamiento local. Para acceso desde Internet necesitas HTTPS y una red correctamente configurada. |
| VPS o servicio Node con volumen persistente | Opción apropiada para clases reales. Confirma que permite conexiones HTTP largas/SSE y que no suspende el proceso durante la clase. |
| Render Free o Koyeb Free | Solo demostraciones con datos de prueba. No proporcionan volumen persistente para este servicio; el almacenamiento temporal no sirve para conservar tu historial. |
| Hosting estático o funciones de ejecución breve | No ejecutan este servidor completo con sesiones y sincronización continua. |

Referencias consultadas: [Render Free](https://render.com/docs/free), [discos de Render](https://render.com/docs/disks), [instancias de Koyeb](https://www.koyeb.com/docs/reference/instances). Comprueba sus condiciones al contratar: los planes pueden cambiar.

Como punto de partida, prueba con 1 GB de RAM, 1 CPU y almacenamiento acorde a tus PDF y evidencias. Es una configuración inicial, no una capacidad garantizada: el consumo depende de las imágenes, historial, versiones, alumnos y conexiones. Revisa «Estado del servidor» y realiza una clase de ensayo con tu carga real. El límite configurable de conexiones es una protección, no una promesa de soportar ese número de alumnos.

## Configuración

### Render

Usa **Web Service → Node**, no Static Site. Comando de construcción: `npm ci --omit=dev`; comando de inicio: `node server.js`; health check: `/readyz`. El archivo `.node-version` fija Node 24.21.0, la versión verificada localmente. `render.yaml` ofrece un Blueprint de demostración gratuito; no incluye disco persistente.

En Environment configura `TEACHER_PASSWORD` como secreto antes del primer despliegue. Render configura `NODE_ENV=production`, por lo que si falta la contraseña inicial el servidor se detiene con «Configura TEACHER_PASSWORD…». No publiques ese secreto en Git ni en los logs. La aplicación usa el `PORT` proporcionado por Render y escucha en `0.0.0.0`.

La dirección HTTPS de Render se detecta automáticamente mediante `RENDER_EXTERNAL_URL`; `AULA_PUBLIC_URL` tiene prioridad si usas dominio propio. Esto configura enlaces y cookies seguras sin confiar en cabeceras de proxy no verificadas. Deja `AULA_TRUST_PROXY` apagado salvo que hayas comprobado la cadena de proxies.

Para conservar datos necesitas un disco persistente en un servicio que lo admita. Configura `AULA_DATA_DIR` en su ruta y declara `AULA_PERSISTENT_STORAGE=1` solo después de verificarlo. El plan Free pierde archivos al reiniciar, redesplegar o suspenderse; no cambies esa declaración a 1 para ocultar la alerta. Descarga el respaldo completo **antes** de reiniciar o desplegar otra versión si ya cargaste clases. No restaures un respaldo en un disco temporal esperando que sobreviva al siguiente reinicio.

Si el despliegue falla, consulta las últimas líneas de Logs: contraseña inicial ausente, versión de Node incompatible y permisos/ruta del directorio son causas distintas. Si abre pero pierde avances al volver a ingresar, revisa persistencia y cookies; si no sincroniza, verifica que `/api/rooms/CODIGO/events` sea una conexión `text/event-stream` y no un HTML de error o de arranque de Render. Comparte la URL pública y el error, sin credenciales, para diagnosticar el caso concreto.

1. Copia `.env.example` a `.env` y configura la dirección HTTPS y una contraseña inicial propia. `.env` está excluido de Git y de la imagen Docker.
2. Monta un volumen persistente y configura `AULA_DATA_DIR` en su ruta. Debe admitir escritura por el usuario del proceso y conservar **todo** su contenido al reiniciar y desplegar de nuevo.
3. Configura `NODE_ENV=production`, `AULA_PUBLIC_URL=https://tu-dominio`, `PORT` según tu proveedor y `AULA_PERSISTENT_STORAGE=1` solo después de comprobar la persistencia.
4. Usa `AULA_TRUST_PROXY=1` únicamente detrás de un proxy controlado que establezca las cabeceras de protocolo e IP. Bloquea el acceso directo al puerto Node desde Internet. Si no controlas la cadena de proxies, mantén esta opción apagada; la URL pública HTTPS sigue configurando las cookies seguras.
5. Instala con `npm ci --omit=dev`. Inicia con `node --env-file-if-exists=.env server.js` (Node 22.13 o posterior; Docker usa Node 24). Muchos proveedores configuran variables en su panel y pueden usar `node server.js` directamente.

`TEACHER_PASSWORD` se usa solo para crear el perfil inicial. Cambia tu contraseña existente desde «Mi perfil»; cambiar una variable de entorno no la sustituye. El primer arranque en producción exige este secreto si aún no existe `teacher.json`. Nunca subas `data/`, `.env`, archivos de alumnos ni respaldos a un repositorio público.

## Docker / VPS

`docker compose up -d --build` usa `compose.yaml`: un usuario sin privilegios, volumen `aula-data`, reinicio automático, chequeo de salud y puerto publicado solo en `127.0.0.1:3000`. Configura primero `.env`. Un proxy HTTPS como Nginx debe exponer el dominio. `deploy/nginx.conf.example` contiene el bloque para reenviar tráfico; debes añadir tu configuración de certificado y dominio. Las [cabeceras y desactivación de buffering de Nginx](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering) permiten entregar cada actualización sin acumularla.

Actualiza con `docker compose up -d --build`, después de descargar un respaldo. No ejecutes `docker compose down -v`: borra el volumen. El chequeo de salud informa del estado; un contenedor marcado como «unhealthy» no se reinicia automáticamente por esa sola condición.

No se ha construido la imagen Docker en este equipo, donde Docker no está instalado. Antes de usarla en producción, construye la imagen en el servidor y prueba importación PDF, evidencias, sincronización, comprobante con QR y reinicio conservando datos.

## Llevar tus datos al servidor

Puedes descargar y restaurar el respaldo completo desde Inicio; se abren copias para conservar lo que ya exista en el destino. Estos respaldos portátiles excluyen contraseña y sesiones de acceso: configura el nuevo perfil y pide a los alumnos que entren de nuevo.

Para una migración exacta, detén ambos servidores y copia de forma privada el directorio de datos completo al volumen destino, incluidos `teacher.json`, `classes.json`, `studio-state.json`, `evidence/` y `automatic-backups/`. No mezcles copias hechas mientras se escriben datos. Asegura permisos del usuario del contenedor en el destino. El cambio de dominio exige volver a iniciar sesión aunque conserves los datos.

La URL pública configura los enlaces de acceso y, si no has establecido otra dirección en Protección, los QR de comprobantes. Si habías configurado manualmente una dirección local para los QR, actualízala desde Protección. Comprueba el QR desde un teléfono fuera de tu Wi-Fi.

## Verificación antes de una clase real

- `/healthz` y `/readyz` responden con `{"ok":true}` sin divulgar alumnos, rutas o secretos. Usa `/readyz` como health check del proveedor.
- «Estado del servidor», exclusivo del profesor, muestra memoria, espacio, conexiones y último respaldo, con alertas de configuración. Confirmar almacenamiento mediante una variable no comprueba el montaje: haz una prueba real de reinicio.
- Crea una clase de ensayo, entra desde otro dispositivo, responde y descarga un comprobante. Reinicia el servicio y verifica que el progreso y archivos siguen disponibles.
- Usa HTTPS: permite cookies seguras y modo offline con Service Worker en tablets. El offline conserva contenido recibido; no permite sincronizar sin comunicación con el servidor.
- Conserva un respaldo fuera del servidor. Las copias del mismo volumen no protegen frente a la pérdida del volumen o cuenta del proveedor. Prueba también una restauración.
- Evita desplegar en mitad de una clase. El cierre ordenado termina conexiones y crea un respaldo; el navegador intenta reconectar y recupera el estado autorizado actual. Una terminación forzada del proveedor puede omitir este cierre, por eso cada cambio se guarda antes de confirmarse.

## Optimizaciones incluidas

Compresión gzip negociada para JSON y recursos, validación ETag/304, caché de recursos limitada en memoria, agrupación de actualizaciones de la misma clase en un ciclo del servidor, imágenes enviadas por SSE solo al cambiar la presentación, protocolo SSE con latidos y reconexión, protección frente a conexiones lentas que acumulen datos, límites de conexiones, derivación de contraseña de inicio/recuperación fuera del hilo principal y limpieza de sesiones vencidas. Las respuestas privadas se mantienen separadas por alumno; no se comparten cachés de sus resultados.

La escritura de clases y los respaldos todavía utilizan archivos y operaciones síncronas. Para muchas clases simultáneas, historiales grandes o varias réplicas, el siguiente paso es migrar a una base de datos compartida y almacenamiento de objetos, conservando las reglas de privacidad y cierre. Esa migración depende del proveedor y no está implementada en esta versión.
