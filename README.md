# Aula Studio

Para publicar en Internet consulta [DEPLOYMENT.md](DEPLOYMENT.md): incluye Docker, volumen persistente, HTTPS, migración, diagnóstico y los límites de los planes gratuitos.

Plataforma local de presentaciones y gestión de clase en tiempo real. Interfaz azul marino para el profesor y temas azul marino, medianoche y claro para el alumno. Requiere Node.js 22.13 o posterior.

## Iniciar

Ejecuta `npm.cmd install` una vez y después `node server.js` o `npm.cmd start`. Abre http://localhost:3000. La contraseña de profesor solicitada está configurada y se deriva con scrypt y sal en `data/teacher.json`; no se publica al navegador. El profesor puede cerrar su sesión y el servidor verifica los permisos de cada operación.

El docente y los alumnos deben tener acceso al mismo servidor, normalmente por Wi-Fi local. Permite el puerto 3000 en el firewall de la red privada de Windows y evita redes de invitados con aislamiento. **Compartir** detecta una IP local; si tienes VPN o varios adaptadores, usa la dirección correspondiente a la red de tus alumnos. Mantén encendida la computadora del servidor. Para Internet se requiere desplegar detrás de HTTPS. YouTube y videos externos requieren conexión a sus proveedores; el resto de la aplicación y PDF.js funcionan localmente.

## Preparar y guardar presentaciones

Entra como profesor y crea una clase. La barra superior agrupa las herramientas para insertar diapositivas, quizzes, imágenes, PDF y videos/casos. Las miniaturas permiten navegar, arrastrar para ordenar, subir, bajar y eliminar. El panel de propiedades permite cambiar título, contenido y diseño; **Aplicar cambios** guarda y sincroniza. Puedes duplicar una diapositiva. Cambiar la selección del profesor cambia la diapositiva mostrada a los alumnos: el lienzo indica que está sincronizado en vivo.

El editor de quiz presenta cada opción en un campo independiente y un selector para la respuesta correcta. Soporta:

- Opción múltiple con entre 2 y 6 opciones.
- Respuesta corta con una o más respuestas aceptadas, comparadas sin distinguir mayúsculas. No utiliza evaluación semántica automática.
- Selección de un punto de una imagen: sube la imagen, marca el punto esperado y configura la tolerancia.

Marca hasta tres preguntas como **Boleto de salida**. Una pregunta que ya recibió respuestas se protege: duplícala para cambiar su contenido. Las respuestas quedan vinculadas a la pregunta aunque cambies el orden. Eliminar una pregunta la excluye de la evaluación y comprobante actuales, aunque sus respuestas sigan archivadas.

Hay dos formas de conservar el trabajo:

1. **Sesiones guardadas**: cada cambio aplicado guarda automáticamente la clase completa, incluyendo alumnos, respuestas, notas, asistencia y entregas. Reabrirla retoma el mismo historial.
2. **Guardar presentación** (también Ctrl+S): guarda título, diapositivas y todos los quizzes en la biblioteca. **Usar en una clase nueva** crea una sesión limpia para otro grupo, sin respuestas ni datos personales del anterior. Guardar otra vez actualiza esa presentación de la biblioteca.

**Guardar archivo** exporta un JSON portátil con todos los quizzes y sus claves. **Abrir archivo** abre ese contenido en una clase nueva y conserva la clase anterior. Los archivos personales de alumno no se aceptan como presentaciones del profesor.

**Importar PDF** convierte cada página en una imagen de diapositiva conservando su diseño. Los PDF con contraseña deben guardarse primero sin contraseña. Para PowerPoint, exporta a PDF. Máximo 100 diapositivas, 25 MB de presentación convertida y 8 MB por imagen. Las páginas importadas son imágenes; su texto no es editable.

## Clase en vivo

Pulsa ▶ en el reloj de la esquina superior derecha para iniciar la clase y el cronómetro compartido. Puedes pausarlo o reiniciarlo; reiniciar el reloj conserva la hora original de inicio para la asistencia. Opcionalmente configura un inicio programado.

La pestaña **Clase en vivo** concentra puntero, anotaciones, resultados y termómetro de comprensión. Los trazos y el puntero se reflejan en las pantallas de alumnos. Las anotaciones se guardan por diapositiva; el puntero es transitorio. Para videos MP4/WebM o YouTube hay controles compartidos de reproducción, pausa y salto de tiempo. La reproducción automática y el sonido dependen de las políticas del navegador; los alumnos reciben video inicialmente silenciado. Los casos clínicos se pueden presentar como texto, imágenes/PDF, video y preguntas sobre puntos de imágenes; no hay un visor DICOM o simulador clínico especializado.

**Proyectar código** muestra en grande el código y enlace de acceso, con opción de pantalla completa. Las flechas del teclado permiten avanzar y retroceder. Por defecto se ocultan a los alumnos las láminas que todavía no has mostrado, incluso en sus descargas. Puedes desactivar esta regla en configuración. Los alumnos reciben los enunciados, pero nunca las claves correctas ni respuestas de otros alumnos.

**Lanzar pregunta** abre un sondeo con duración configurable en segundos (0 significa sin límite). El servidor bloquea las respuestas al vencer el tiempo. Puedes cerrarlo manualmente. **Boleto de salida** salta a la primera pregunta marcada; avanza por las preguntas de cierre. También puedes programar la hora del disparador. Si existen boletos de salida, no se puede finalizar mientras alumnos registrados como presentes tengan preguntas de cierre pendientes. El dominio se clasifica como Excelente (80% o más), Intermedio (50% o más) o Requiere refuerzo.

## Alumnos, asistencia y convivencia

Carga la lista desde **Lista de alumnos**, pegando un nombre por línea o importando TXT/CSV. Puedes usar `Nombre | Matrícula`. En CSV se reconocen columnas de nombre y matrícula/id. La matrícula permite consolidar el historial entre clases; si no existe, se agrupa por nombre completo. Distingue a los homónimos con matrícula. Máximo 500 alumnos.

El alumno escoge un nombre autorizado. En su primer ingreso recibe una clave de recuperación que debe guardar. En el mismo navegador, la cookie permite volver; desde otro dispositivo selecciona su nombre e introduce la clave. Esta recuperación sustituye la sesión anterior. El profesor puede **Restablecer acceso** sin borrar el avance. La primera selección se basa en la confianza del grupo; la lista no verifica documentos de identidad.

Se registra la hora del primer ingreso con el reloj del servidor. Por defecto, ingresar más de 5 minutos después del inicio se marca como retardo y se informa al alumno. La tolerancia es configurable. En **Asistencia y bitácora** puedes asignar Presente, Retardo, Retardo justificado, Falta o Falta justificada. **Bloquear registro** congela el registro para ingresos posteriores y evita cambios manuales hasta desbloquearlo.

La detección de foco se informa al alumno y funciona solo durante una clase iniciada y abierta. Por defecto, una salida reportada por el navegador de 10 segundos o más descuenta 1 punto del índice de participación, que inicia en 100. No modifica el puntaje de los quizzes. El profesor puede cambiar la regla, desactivarla o exentar un evento. Descargas iniciadas con las herramientas del alumno tienen un margen para evitar descontar por sus diálogos. Cambiar de pestaña, minimizar o cambiar de aplicación puede provocar eventos: no demuestran distracción ni sustituyen supervisión. Si se pierde la conexión, no se garantiza detectar todos los eventos. La pantalla completa se solicita con un botón; los navegadores requieren un gesto del alumno y permiten salir de ella.

La bitácora registra en un clic Distracción, Interrupción/falta de respeto, Sin material/equipo o Seguridad/disciplina, junto con alumno, hora, diapositiva, tema y nota de contexto.

## Espacio personal del alumno

El alumno tiene temas visuales, notas por diapositiva, descarga de notas, capturas PNG, presentación PDF y una copia JSON personal. Las notas se guardan en el servidor; los borradores sin confirmar se conservan localmente y se intentan sincronizar al recuperar la conexión. Las respuestas solo se consideran guardadas cuando el servidor confirma. Las herramientas de descarga pueden desactivarse por clase. No se garantiza eliminar capturas realizadas con herramientas del sistema operativo.

El termómetro permite enviar **Todo claro**, **Voy confundido** o **Repetir concepto**. El profesor ve la distribución del grupo. **Hacer una pregunta** envía un aviso directo al profesor. El alumno puede ocultar su nombre al proyectar, y se le informa que el profesor podrá revelar el autor en su panel privado. Ningún otro alumno recibe la identidad anónima.

## Evidencias, plazos y rúbricas

El buzón recibe fotos PNG/JPEG/WebP, PDF y texto/nota digital, hasta 8 MB por archivo y 30 entregas por alumno. Registra la hora de recepción del servidor. Solo el autor y el profesor pueden consultar el archivo.

Configura la hora de cierre de entregas. El servidor rechaza trabajos después del plazo o al finalizar la clase. El alumno puede enviar un justificante para solicitar una excepción; el profesor lo revisa en el visor y autoriza una nueva fecha. La plataforma no verifica automáticamente la autenticidad del justificante ni la ubicación física del alumno.

**Entregas y rúbricas** ofrece un visor junto a los criterios de evaluación. La rúbrica admite hasta 6 criterios y 100 puntos. Guarda puntajes por criterio y retroalimentación; el alumno ve el resultado. Se conservan los criterios usados para cada calificación aunque se cambie la rúbrica posteriormente.

## Comprobantes y reportes

**Finalizar exposición / abrir ticket** inicia el cierre, incluso antes de la hora programada. Pide un motivo y abre el ticket de salida; si no existe, inserta una reflexión de seis campos. Los alumnos completan las preguntas impartidas pendientes y el ticket. El comprobante individual sólo se habilita al completar estas actividades y registrar la salida; si el checador está desactivado, la última respuesta registra la salida automáticamente. Con checador activo, el docente puede generar el código inmediatamente al iniciar el cierre. Las preguntas futuras que no se impartieron quedan señaladas y no cuentan en la evaluación. **Revisar pendientes** muestra el avance individual; **Descargar comprobantes listos** y **Comprobantes del grupo** generan un PDF con los alumnos elegibles. Las excepciones autorizadas quedan expresamente documentadas. **Cerrar sesión definitivamente** bloquea respuestas una vez cumplidos los requisitos; **Reanudar exposición** conserva respuestas y solicita un nuevo registro de salida posterior. El PDF incluye grupo, folio, horarios, respuestas por pregunta, aciertos, reflexión, evidencias y eventos de foco. Puedes abrirlo e imprimirlo desde tu visor PDF. También hay asistencia PDF, informe de sesión PDF/Excel (.xlsx) e informe longitudinal individual PDF.

Las analíticas muestran asistencia, cierre completado, dominio, incidencias y entregas, más un mapa de incidencias por hora. El historial consolida matrícula/nombre y muestra consistencia de asistencia, entregas y alertas por asistencia menor al porcentaje configurado o incidencias en las últimas tres sesiones. Las alertas aparecen en el panel; no se envían mensajes ni canalizaciones externas automáticamente. La elegibilidad de asistencia es un indicador basado en la regla configurada, no una determinación reglamentaria oficial.

Los comprobantes reflejan registros de la plataforma; no certifican tiempo de atención ni acreditación académica. Los reportes registran fechas UTC en Excel y fechas de Ciudad de México en PDF.

## Datos, respaldo y verificación

Todo se conserva en `data/classes.json`; los archivos de evidencia se guardan en `data/evidence/`. Respalda la carpeta `data/` con el servidor detenido. No se expone esta carpeta por HTTP. El JSON portátil de presentación solo incluye material, no información de alumnos. Las sesiones, recuperación y reportes siguen funcionando tras reinicios.

`PORT` cambia el puerto. `AULA_DATA_DIR` cambia la ubicación de datos. Para una instalación nueva puedes establecer `TEACHER_PASSWORD` antes del primer inicio; si `data/teacher.json` existe se conserva la contraseña guardada. Esta versión usa un profesor administrador único y almacenamiento local; no incluye una plataforma multiinstitución ni servicios en la nube.

Ejecuta `node --test`. Cubre importación PDF, permisos, privacidad, persistencia/reconexión, biblioteca, quizzes, foco, asistencia, anonimato, notas, evidencias, plazos, rúbricas e informes. Las comprobaciones de navegador con Edge y datos ficticios se realizan con `node tmp/browser-check.cjs` si ese archivo de trabajo está disponible; no usa datos reales de alumnos.

### Reloj y actividades abiertas

El botón ⛶ junto al cronómetro abre las diapositivas en pantalla completa, con la hora actual visible en la esquina superior derecha. «Inicio» en la cabecera vuelve a las clases guardadas. En Insertar quiz puedes elegir Verdadero o falso, Lluvia de ideas o Nube de palabras. La lluvia muestra un mural; la nube agrupa palabras iguales y aumenta su tamaño con las menciones. Cada alumno puede actualizar su aportación mientras la pregunta permanezca abierta. Estas dos actividades registran participación y se guardan con la presentación, sin afectar el porcentaje de aciertos ni formar parte del boleto de salida.

### Afirmaciones, fondos y continuidad sin red

Verdadero/falso admite hasta 20 afirmaciones en la misma diapositiva. Cada afirmación tiene su clave privada y cuenta individualmente en los aciertos; el alumno envía todas juntas. Los quizzes anteriores de una pregunta siguen siendo compatibles. Puedes subir un fondo PNG, JPEG o WebP de hasta 8 MB desde Propiedades; se guarda en la clase y biblioteca y aparece en el PDF.

Las clases abiertas tienen una copia en IndexedDB de este navegador. Sin conexión puedes continuar con el contenido ya recibido, editar/navegar la copia del profesor y guardar respuestas y notas del alumno. Un aviso muestra cambios pendientes; «Sincronizar» reintenta y «Guardar respaldo local» exporta la copia y pendientes con sus fechas. Al reconectar se valida el acceso y se envían los cambios. No se sobrescribe una presentación modificada en el servidor: se conserva como conflicto para revisión. Las respuestas de preguntas cerradas o clases finalizadas se envían al panel de revisión del profesor al reconectar, sin falsear su hora de entrega. Si la pregunta cambió o no se valida el acceso, se conserva el pendiente local para revisión. Los archivos de evidencias, emisión de comprobantes, autenticación nueva y los videos externos requieren conexión al servidor.

Para recargar o reabrir la página sin red necesita haberse abierto antes en este navegador y haberse instalado su caché de aplicación. Service Worker requiere HTTPS en las tabletas; localhost y 127.0.0.1 funcionan en el equipo del profesor. Sobre HTTP con IP de red local permanece la continuidad de una pestaña abierta, pero no se garantiza recargar la página desconectada. Si sólo falla Internet y la red local permanece activa, el servidor local mantiene la sincronización. Si falla la red local no puede haber sincronización entre dispositivos hasta reconectar. Las copias están en este dispositivo: usa perfiles de navegador separados en equipos compartidos; al cerrar sesión del profesor se limpian los datos y pendientes locales. No borres los datos del navegador antes de sincronizar o exportar.

El reloj de proyección ahora muestra la hora actual (HH:mm, zona Ciudad de México) en grande en la esquina superior derecha de la diapositiva al presentar en pantalla completa. El cronómetro de duración permanece en el panel del profesor. El botón junto al cronómetro abre directamente las diapositivas; ya no abre un modal de reloj. Puedes salir con Esc o «Salir», y navegar con las flechas. La hora usa el reloj del dispositivo.

## Presentador, control móvil y gestión de clase

- **Vista del presentador:** abre una ventana privada con la diapositiva actual, siguiente diapositiva, notas y controles. Desde allí abre la pantalla del proyector y muévela al segundo monitor. El proyector muestra el contenido actual, anotaciones, ideas y preguntas proyectadas; no muestra notas privadas ni la siguiente diapositiva. Sus controles permiten activar pantalla completa. Las notas privadas se guardan por diapositiva y se incluyen en la biblioteca del profesor, pero se excluyen de los materiales de alumnos.
- **Hora de cierre:** configura fecha y hora desde la barra de la clase. El reloj muestra minutos restantes y cambia a amarillo, naranja y rojo al faltar 10, 5 y 1 minuto. Llegar al cierre avisa; no finaliza la sesión automáticamente.
- **Control móvil:** abre el enlace desde la barra de la clase, en un celular conectado al servidor. Requiere la contraseña del profesor. Permite avanzar, retroceder, abrir/cerrar quizzes y consultar/proyectar preguntas. La autoría de preguntas anónimas es visible sólo en esta vista privada; su proyección conserva el anonimato.
- **Respuestas pendientes:** las respuestas offline que llegan tras cerrar el quiz se remiten al profesor. Aceptar o rechazar requiere un motivo; se conserva la fecha declarada por el dispositivo y la recepción/decisión del servidor. Aceptar sustituye la respuesta vigente de ese alumno para esa pregunta. No se aceptan copias de otra versión del reactivo.
- **Banco de preguntas:** guarda el quiz actual con tema, dificultad y objetivo, búscalo y reutilízalo con un identificador nuevo en cualquier clase. Se conserva de manera independiente de las sesiones.
- **Caso por etapas:** crea antecedentes, exploración, estudios y diagnóstico, con una lluvia de ideas entre cada etapa. Puedes convertir estas preguntas a otros tipos desde el editor. Se activa la protección de diapositivas futuras; avanzar revela cada etapa. No exige que todos respondan para avanzar.
- **Respaldo completo:** desde Inicio descarga clases, alumnos, notas, respuestas, incidencias, revisiones, biblioteca, banco y archivos de evidencia. No incluye contraseña ni credenciales de sesión o recuperación. Restaurar (máximo 200 MB por archivo) valida la estructura y los hashes de los archivos antes de importar, crea copias con códigos nuevos y conserva las clases existentes. Los alumnos deben seleccionar nuevamente su nombre en la clase restaurada; su avance anterior se conserva. Los relojes restaurados quedan en pausa. Guarda estos respaldos como archivos privados porque incluyen datos académicos. Para mover una instalación completa conservando los códigos y el acceso, copia la carpeta privada `data/` con el servidor detenido.

Las vistas del presentador, proyector y celular requieren conexión al servidor para sincronizar; muestran un estado de reconexión durante interrupciones. El modo offline descrito arriba corresponde al editor y pantalla principal del alumno.

Las copias restauradas no duplican las métricas longitudinales mientras exista su clase de origen en esta instalación; conservan sus propios informes de sesión.

## Biblioteca, grupos y acceso del profesor

- En **Inicio**, las sesiones, presentaciones y grupos permiten **Duplicar**, **Renombrar** y **A papelera**. La papelera conserva el material hasta que lo restaures o confirmes su eliminación definitiva. Enviar una sesión a papelera suspende su acceso y conserva respuestas, asistencia y evidencias. Duplicar una sesión crea una clase nueva con diapositivas y lista de alumnos, sin respuestas ni asistencia anteriores. Eliminar una presentación o grupo no elimina las clases que ya lo usaban.
- En **Grupos de alumnos**, crea listas reutilizables, importa TXT/CSV o edita nombres y matrículas. Cada grupo admite 500 alumnos; usa matrículas diferentes para distinguir nombres iguales. Al crear una clase puedes elegir el grupo. Desde **Grupo y alumnos** en la barra de la clase puedes sustituir o añadir grupos, guardar la lista actual como grupo, agregar/corregir/quitar alumnos, reincorporarlos y restablecer su acceso. Quitar alumnos conserva su historial; reincorporarlos recupera su avance. Editar un grupo guardado no modifica automáticamente las clases existentes: vuelve a cargarlo cuando quieras aplicar los cambios. Los grupos se incluyen en el respaldo completo.
- **Mi perfil** (también desde Configuración) permite guardar el nombre del profesor, que aparece en los nuevos comprobantes, y cambiar la contraseña indicando la actual. El cambio cierra otros accesos del profesor y mantiene la ventana actual. La contraseña inicial se conserva hasta que la cambies.
- Genera y descarga tu **clave de recuperación** desde Mi perfil. Se muestra una sola vez; el servidor guarda únicamente su hash. Con **Olvidé mi contraseña**, la clave permite definir una contraseña nueva y recibir una clave nueva; la anterior deja de funcionar. Guarda el archivo fuera de la plataforma, en un lugar privado. No depende de correo ni de Internet, pero sí de poder acceder al servidor.
- Si pierdes contraseña y clave, en el equipo servidor detén la aplicación (Ctrl+C) y ejecuta `npm.cmd run reset-password` desde esta carpeta. El comando pide y confirma la contraseña sin mostrarla, revoca las sesiones anteriores y entrega una clave nueva; conserva clases, grupos y evidencias. Después ejecuta `npm.cmd start`. Este mecanismo requiere acceso local a los archivos privados del servidor y no está disponible para los alumnos desde la web.

La papelera, grupos y configuración de acceso requieren conexión al servidor. Su servidor local sigue funcionando aunque no haya Internet.

## Invitados y guardado automático

- En **Configuración → Permitir invitados con código y nombre**, habilita el acceso abierto únicamente para esa clase. Está desactivado por defecto. Un invitado entra con el código, escribe su nombre y recibe una clave de recuperación; puede participar, tomar notas y obtener su comprobante igual que los alumnos. El mismo navegador conserva su acceso. Desde otro dispositivo necesita la clave para recuperar sus respuestas, en lugar de crear otra identidad con el mismo nombre. Deshabilitar invitados bloquea nuevas altas; conserva a quienes ya entraron y sus registros. La lista del profesor los identifica como invitados. El nombre que escribe un invitado no verifica su identidad.
- **Insertar ticket 3–2–1** añade un boleto de salida listo para usar: tres aprendizajes, algo que no sabía antes, una duda (puede escribir “sin dudas”) y comprensión en una escala de 1 a 4. Es una reflexión sin calificación automática. Cuenta para la participación y para el requisito de enviar el boleto antes de finalizar, pero no reduce los aciertos ni se utiliza para clasificar dominio académico. El profesor ve las respuestas individuales en vivo. Se puede reutilizar al guardar la presentación o desde el banco de preguntas.
- El editor guarda automáticamente tras una pausa de aproximadamente 700 ms: texto, diseño, opciones, afirmaciones, fondos y notas privadas. Los cambios completos se guardan en la sesión; si la clase está vinculada a una presentación guardada, también se actualiza esa presentación en la biblioteca cuando hay conexión. **Guardar ahora** permite hacerlo inmediatamente. Si un quiz tiene campos incompletos, se informa que está pendiente; completa los campos para guardarlo. Las preguntas que ya tienen respuestas conservan su protección frente a cambios.
- **Deshacer / Rehacer** conserva hasta 20 cambios de diapositivas en la clase abierta: edición, inserción, duplicación, orden y eliminación. También puedes usar Ctrl+Z y Ctrl+Y fuera de los campos de texto; dentro de ellos funcionan los controles propios del navegador. El historial se reinicia al recargar o cambiar de clase y no modifica respuestas, asistencia ni calificaciones. Los cambios guardados siguen el flujo offline y de sincronización descrito arriba.

## Precarga, felicitaciones y checador de salida

- La pantalla del alumno prepara automáticamente las imágenes y fondos de las diapositivas disponibles en segundo plano y conserva en IndexedDB el estado recibido en vivo, incluyendo la lámina actual. No descarga archivos al escritorio ni revela diapositivas reservadas. Si quieres precargar toda la presentación, desactiva **Ocultar diapositivas aún no presentadas**; también se podrá consultar ese contenido desde el dispositivo. Con la protección activa, cada diapositiva se prepara cuando la habilitas. Los videos externos mantienen sus propios requisitos de conexión. La caché y recarga offline requieren las condiciones de HTTPS/localhost descritas anteriormente.
- Una respuesta correcta validada por el servidor muestra una felicitación privada al alumno. Se aplica a opción múltiple, verdadero/falso (todas las afirmaciones), respuesta corta e imagen; no califica lluvias de ideas, nubes ni reflexiones. Las respuestas offline reciben esta confirmación al sincronizar y ser aceptadas. Puedes desactivar el feedback inmediato en **Configuración → Salida, reloj y avisos**. La plataforma informa si la respuesta propia es correcta; no envía las claves correctas ni respuestas de otros alumnos.
- En ese mismo panel establece **hora exacta de salida** y activa **Exigir registro de salida**. El alumno debe esperar esa hora y completar su ticket. Si activas el código de aula, usa **Checador de salida → Generar / renovar código** al terminar y muéstralo en el aula. La hora registrada procede del servidor; adelantar el reloj de la tableta no abre el checador. La clase sólo se puede finalizar tras la hora indicada y las salidas de quienes registraron asistencia. Quienes aún no checan no reciben comprobante. Puedes autorizar una excepción individual con motivo; queda registrada y exenta también el ticket pendiente. La hora de salida aparece en comprobantes, asistencia y Excel. Duplicar una sesión reinicia este control para que puedas programar la nueva clase.
- El checador requiere conexión al servidor. Una salida offline no se acredita retroactivamente; reconecta o registra una excepción comprobada. El código compartido es una ayuda operativa, no una verificación de presencia física: conviene mostrarlo al final y supervisar personalmente la salida.
- Configura por separado el reloj del profesor/proyector y del alumno: **siempre visible, oculto o intermitente**, con intervalo y duración en segundos. Los avisos son independientes del reloj: indica hasta seis momentos (por ejemplo `10, 5, 1`) y su duración, o deja el campo vacío para desactivarlos. Los avisos aparecen una vez por momento en cada pestaña y funcionan también en pantalla completa. Puedes habilitar sólo los avisos y mantener el reloj oculto.

Las preguntas de opción múltiple requieren dos pasos: seleccionar una opción y pulsar **Enviar respuesta**, que aparece encima de la opción seleccionada. Puedes cambiar de opción antes de confirmar; la selección por sí sola no se envía. Para respuestas sobre imágenes, marca el punto y confirma también. En verdadero/falso, el botón aparece cuando hayas respondido todas las afirmaciones. Las lluvias de ideas y nubes mantienen el foco y el texto durante las actualizaciones de la clase; el alumno envía su texto desde el formulario. Al cerrar una pregunta o finalizar la sesión se conserva el bloqueo previsto.

En lluvia de ideas, nube y respuesta corta, el alumno puede escribir un borrador aunque la actividad esté cerrada o la clase finalizada. El borrador se conserva en su navegador, pero **Enviar** permanece bloqueado hasta que el profesor abra la actividad. La vista del profesor muestra un aviso con **Reabrir clase** o **Abrir pregunta sin límite**, según corresponda. No se reabren sesiones automáticamente.

Los ajustes de clase se guardan independientemente de los campos incompletos del editor. Si había un guardado en curso, se espera a que termine. Guardar preferencias cierra su ventana; si la validación falla, el mensaje aparece dentro de la ventana para poder corregirlo. Abrir el panel de salida/reloj cierra la ventana anterior de configuración, evitando dejar otra ventana bloqueando el portal por debajo.

## Resultados académicos en vivo

Desde **Ver respuestas en vivo**, consulta en tu panel privado los porcentajes, número de respuestas y participantes por opción. Se actualizan con el canal de la clase sin recargar; cambiar una respuesta mueve al alumno entre opciones, sin contarlo dos veces. Los porcentajes de distribución usan como denominador las respuestas enviadas por alumnos activos; la participación usa la lista activa completa. Las respuestas de alumnos retirados conservan su historial pero no alteran estas métricas del grupo actual.

El panel muestra respondieron, pendientes, porcentaje de respuestas correctas y alumnos conectados. Abre **Ver participantes** bajo cada opción, filtra su tabla con **Ver estas respuestas**, busca por nombre/matrícula o selecciona pendientes, respondieron y resultados correctos/por revisar. En verdadero/falso se muestra la distribución de cada afirmación. Las respuestas abiertas presentan las ideas con sus autores, y las palabras muestran cuántos alumnos mencionaron cada término. La bandeja de preguntas recibidas permite revisarlas, proyectarlas y marcarlas respondidas sin abandonar la vista en vivo; las preguntas anónimas requieren pulsar Revelar autor en el panel privado.

El panel de estadísticas detalladas y los nombres de participantes están restringidos al profesor; la proyección pública muestra únicamente los porcentajes agregados sobre las opciones.

En la propia diapositiva del profesor, cada opción muestra ahora su porcentaje y número de respuestas con una barra de fondo que crece en vivo. Funciona en el editor y en pantalla completa, y también por afirmación en verdadero/falso. Las ventanas del presentador y proyector muestran esos mismos porcentajes agregados, sin nombres ni marcas de respuestas correctas. La pantalla individual del alumno conserva su pregunta sin estadísticas de sus compañeros.

En **Grupo y alumnos → Nueva sesión con este grupo** puedes reutilizar la presentación con otro grupo. Se crea otro código y registros vacíos de respuestas, preguntas, asistencia, incidencias y evidencias. La sesión anterior conserva su historial. Las horas específicas se reinician y el checador debe configurarse para la nueva sesión. Una sesión que ya tiene ingresos no admite sustituir el grupo directamente: usa una nueva sesión para mantener separados los registros.

## Preparación, agenda y protección

**Nueva clase** abre un asistente con título, presentación guardada, grupo, inicio y salida previstos, invitados, PIN, checador, foco y cantidad de evidencias obligatorias. Puedes crear un borrador sin alumnos para importar o editar la presentación. **Checklist / iniciar** revisa contenido, lista o invitados, ticket, hora, PIN, respaldo y recursos externos antes de iniciar el reloj. Los videos externos se señalan para revisión, sin bloquear una clase que ya verificaste.

**Agenda por grupo**, desde Inicio, permite programar y editar sesiones con presentación y grupo. Sus reglas se conservan al preparar la clase. Abrir repetidamente la misma entrada retoma el mismo código; preparar otra entrada crea una sesión independiente. Puedes filtrar por grupo y consultar sesiones programadas, preparadas, en curso, en cierre, impartidas, interrumpidas, canceladas o archivadas. Al cerrar una exposición, marca explícitamente si se interrumpió. Las entradas ya preparadas conservan su historial y se ajustan desde su clase.

**Respaldos y recuperación** conserva copias completas en `data/automatic-backups`: por defecto, una cada 15 minutos cuando hay cambios, con 12 copias conservadas. Se crea una copia al iniciar el servidor; el chequeo periódico se realiza cada minuto. **Crear respaldo ahora** guarda una copia inmediatamente. Incluyen presentaciones, registros, evidencias con SHA-256, grupos, agenda, versiones y preferencias del portal; no incluyen contraseña del profesor ni sesiones de acceso. Puedes descargar una copia y recuperarla como nuevos grupos y sesiones, sin reemplazar los datos actuales. La recuperación agrega agenda y versiones vinculadas a esas copias; conserva las preferencias actuales de privacidad del portal. Guarda una copia descargada fuera del equipo servidor para protegerte ante una falla del disco. La importación admite hasta 200 MB.

Si `classes.json` queda ilegible, el arranque busca un respaldo automático válido, comprueba las evidencias, conserva el original con sufijo `.invalid-<fecha>` y recupera los registros. El profesor y los alumnos deben volver a ingresar. La contraseña del profesor se conserva en su archivo separado; el mecanismo de recuperación de acceso sigue disponible desde la terminal. Si no existe un respaldo válido, el servidor se detiene sin reemplazar el archivo dañado.

**Versiones** conserva hasta 20 estados por presentación de clase, con capturas automáticas al editar y un intervalo de un minuto. También puedes guardar una versión con nombre en cualquier momento. La recuperación siempre abre una clase nueva para conservar las respuestas y la asistencia originales. Las versiones sobreviven al cierre del navegador y se incluyen en el respaldo completo.

## Requisitos, identificación y diagnóstico

**Requisitos y PIN** permite marcar quizzes como obligatorios u opcionales; los tickets siempre son obligatorios. Sólo las actividades impartidas antes del cierre son exigibles. Los quizzes opcionales sin respuesta no bloquean el comprobante ni se cuentan como errores en la evaluación individual. También puedes exigir de 0 a 5 evidencias de trabajo. El cierre requiere las preguntas obligatorias, evidencias, revisión de respuestas recuperadas y salida. Las excepciones del profesor quedan documentadas en el PDF.

El PIN individual es opcional. El profesor puede generar PIN de seis dígitos, descargar una lista CSV y regenerar un PIN sin borrar progreso. Sólo se muestran al generarlos; se guarda su hash con sal y no se envía a alumnos ni a las vistas del profesor. Si el alumno pertenece a un grupo guardado, su PIN se conserva en el grupo para futuras sesiones. Los nuevos invitados continúan entrando por nombre, según la regla de invitados. El PIN no sustituye la clave de recuperación cuando el nombre ya está reclamado en otro dispositivo. Los intentos fallidos tienen límite y bloqueo temporal.

**Estado de la clase** muestra conexión activa, diagnóstico del dispositivo, recursos preparados, cambios locales pendientes, respuestas por revisar y estado del respaldo. Los alumnos reportan su diagnóstico cada 10 segundos; se marca desactualizado después de 45 segundos. Un diagnóstico desactualizado no demuestra ausencia ni distracción. Los datos personales del grupo se consultan sólo como profesor.

## Aprendizaje, ensayo y accesibilidad

**Resumen de aprendizaje** muestra participación por pregunta, porcentaje de aciertos entre respuestas recibidas y conceptos por debajo del 70% para repasar. Las reflexiones y lluvias de ideas no se califican automáticamente. Cada alumno puede consultar su resumen personal y respuestas esperadas después de cumplir el cierre; el profesor puede consultar el resumen grupal durante la clase y descargarlo. No se mezclan grupos ni se incluyen ensayos en el historial académico.

**Ensayar clase** abre un alumno de prueba dentro de una sesión independiente. Puedes avanzar las diapositivas, responder, abrir el ticket y descargar un PDF marcado **ENSAYO SIN VALIDEZ**. No se emite un QR oficial ni se incorpora al historial académico. Cerrar la ventana envía la sesión de ensayo a la papelera; tus diapositivas y registros reales se conservan.

**Aa Accesibilidad**, disponible en el encabezado para ambos roles, conserva tamaño de lectura, contraste y reducción de movimiento en este navegador, también sin conexión. La interfaz incluye foco de teclado visible y enlace para saltar al contenido. El profesor puede usar flechas fuera de los campos y ventanas emergentes para navegar. La reflexión del alumno se muestra completa en la página; en pantalla completa conserva desplazamiento dentro del formulario.

Los comprobantes oficiales incluyen un QR y un enlace con token aleatorio. La verificación pública muestra folio, título y emisión; el nombre y resumen académico se muestran sólo si el profesor los habilita desde **Mi perfil → Respaldos y verificación del portal**. No publica respuestas, notas, evidencias ni incidencias. Los comprobantes cuya sesión se reabre o cuyos registros cambian dejan de aparecer vigentes; una nueva descarga emite un token actualizado. Configura la dirección accesible del portal para que el QR funcione desde otro dispositivo: una dirección `localhost` sólo funciona en el equipo servidor. La verificación requiere conexión al servidor; esta función no publica automáticamente la plataforma en Internet.

También puedes abrir **Versiones** desde una presentación de la biblioteca. Recuperar allí crea una nueva presentación guardada; recuperar desde el editor crea una nueva clase. Los PIN se calculan de forma asíncrona para que su generación no bloquee la sincronización de una clase en curso.
