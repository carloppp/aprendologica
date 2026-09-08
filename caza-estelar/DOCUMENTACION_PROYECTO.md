# Documentación maestra — Caza Estelar

> Estado: borrador vivo. Este documento se ampliará y corregirá durante las sesiones de definición hasta que el responsable del proyecto indique que está terminado.

## 1. Propósito del documento

Este documento centraliza la orientación de producto, las decisiones técnicas, las reglas de trabajo y los criterios que guiarán el desarrollo de **Caza Estelar**. Debe permitir que una persona nueva entienda qué se está construyendo, para quién, con qué límites y cómo tomar decisiones coherentes.

Las afirmaciones se clasifican así:

- **Confirmado:** decisión aprobada.
- **Provisional:** solución actual que puede cambiar.
- **Pendiente:** requiere definición.

## 2. Panorama actual

### 2.1 Visión del producto

- **Confirmado:** Caza Estelar es una experiencia de **aprendizaje interactivo**.
- **Confirmado:** combina educación y entretenimiento, con prioridad en el componente educativo.
- **Confirmado:** funciona como apoyo interactivo y visual para reforzar los temas aprendidos en clase.
- **Confirmado:** está dirigido principalmente a niños de 6 a 8 años de Guatemala y Estados Unidos.
- **Confirmado:** su contexto principal de uso será institucional, principalmente en colegios y escuelas.
- **Confirmado:** Tojil será el personaje principal. Dirigirá al jugador en la búsqueda estelar de las estrellas perdidas y será el personaje con mayor interacción directa con el usuario.
- **Confirmado:** todo el contenido educativo se basará en matemáticas; los temas específicos aún están pendientes de definición.
- **Confirmado:** cada niño tendrá una cuenta individual.
- **Confirmado:** las cuentas de los alumnos serán creadas por un administrador general del sistema.
- **Confirmado:** cada alumno tendrá nombre real, fecha de nacimiento, grado, sección, colegio y país; no se utilizarán alias.
- **Confirmado:** la edad no se almacenará como un dato independiente; se calculará automáticamente a partir de la fecha de nacimiento para evitar inconsistencias.
- **Confirmado:** los niños accederán mediante usuario y contraseña.
- **Confirmado:** el sistema generará automáticamente los usuarios y contraseñas a partir de los listados proporcionados por las instituciones.
- **Confirmado:** el administrador podrá cargar listados de alumnos de forma masiva mediante archivos Excel o CSV.
- **Provisional:** solamente el administrador podrá restablecer contraseñas; esta responsabilidad se revisará más adelante.

### 2.2 Identidad y plataforma

- **Confirmado:** nombre del proyecto: **Caza Estelar**.
- **Confirmado:** aplicación/juego orientado inicialmente a Android.
- **Confirmado:** uso exclusivamente horizontal en la versión actual.
- **Provisional:** identificador Android `com.explorax.cazaestelar`.
- **Confirmado:** compatibilidad mínima con Android 8.0 (API 26).

### 2.3 Tecnología existente

- **Confirmado — estado actual:** el prototipo existente está escrito principalmente en Java y construido con libGDX.
- **Confirmado — arquitectura objetivo:** el desarrollo futuro se orientará a Kotlin con Jetpack Compose.
- **Confirmado:** el prototipo actual se reescribirá completamente en Kotlin; no se mantendrá el código Java como base definitiva.
- **Pendiente de evaluación arquitectónica:** comparar estas alternativas antes de implementar la reescritura:
  1. Jetpack Compose para pantallas y navegación, conservando libGDX —utilizado desde Kotlin— para actividades y escenas interactivas.
  2. Eliminar libGDX y construir también las actividades con Compose y Canvas.
- **Pendiente:** la tecnología del backend que se desplegará en AWS todavía no está seleccionada.
- **Confirmado:** la experiencia será completamente 2D, con animaciones y elementos visualmente llamativos.
- **Confirmado:** el observatorio y las constelaciones podrán mostrar numerosos elementos animados simultáneamente.
- **Pendiente de diseño:** todavía se evalúa si los personajes utilizarán animaciones complejas mediante spritesheets u otra técnica.
- **Confirmado:** los criterios prioritarios para seleccionar la arquitectura serán la eficiencia del desarrollo y el rendimiento gráfico.
- **Confirmado:** se preparará una comparación técnica formal con recomendación entre la arquitectura híbrida Compose/libGDX y la alternativa Compose/Canvas.
- **Pendiente:** todavía no se conoce el nivel de experiencia del equipo con Jetpack Compose y libGDX; la evaluación no deberá asumir dominio previo de ninguna alternativa.
- **Propuesta:** complementar la comparación documental con un prototipo técnico pequeño que mida esfuerzo, fluidez y mantenibilidad en dispositivos representativos.
- **Confirmado:** separación en módulos `core`, `android` y `assets`.
- **Confirmado:** resolución virtual 1920 × 1080 con `FitViewport`.
- **Provisional:** autenticación local de demostración, sin validación remota.
- **Confirmado:** el backend forma parte del alcance de este proyecto.
- **Confirmado:** la API relacionada está siendo desarrollada externamente, pero el equipo de desarrollo del proyecto definirá y mantendrá el contrato de integración utilizado por la web y los juegos.
- **Confirmado:** el equipo responsable de este proyecto desarrollará Caza Estelar.
- **Confirmado:** Caza Estelar utilizará la misma base de datos central que la web/bitácora.
- **Confirmado:** la infraestructura se orientará inicialmente a AWS.
- **Confirmado:** el backend de Caza Estelar atenderá únicamente a este juego y se manejará como un proyecto separado de los demás juegos de Explorax.
- **Pendiente:** tecnología concreta del backend, servicios de AWS, estrategia de despliegue y formato del intercambio con la API.

### 2.4 Flujo implementado

`LoadingScreen` → `LoginScreen` → `MainMenuScreen` → `TelescopeHuntScreen`

La experiencia actual incluye carga inicial, acceso demostrativo, menú principal, ajustes de idioma y sonido, y una primera misión de captura de estrellas mediante telescopio.

### 2.5 Progresión educativa prevista

- **Confirmado:** las estrellas perdidas representarán temas o niveles que deben completarse para recuperar una constelación.
- **Confirmado:** cada constelación representará un tema matemático completo.
- **Confirmado:** cada estrella dentro de una constelación representará una actividad.
- **Confirmado:** cada constelación tendrá aproximadamente seis actividades; la cantidad definitiva podrá ajustarse según el tema.
- **Confirmado:** para recuperar una constelación será necesario aprobar todas sus actividades.
- **Confirmado:** cada actividad deberá aprobarse individualmente con un mínimo de dos estrellas, equivalente a 60 %.
- **Confirmado:** el jugador podrá avanzar de forma no lineal.
- **Confirmado:** dentro de una constelación disponible, el alumno podrá escoger libremente cualquier actividad.
- **Confirmado:** los temas independientes podrán estar disponibles sin un orden obligatorio y los temas que dependan de conocimientos complementarios podrán desbloquearse mediante requisitos previos.
- **Confirmado:** cuando una constelación dependa de otra, solo se desbloqueará después de recuperar completamente la constelación requerida.
- **Pendiente:** catálogo de temas matemáticos, cantidad total de constelaciones y cantidad definitiva de actividades por tema.

### 2.6 Seguimiento institucional previsto

- **Confirmado:** los resultados de los alumnos se reflejarán en una bitácora web independiente.
- **Confirmado:** la bitácora formará parte de un entorno compartido y se conectará tanto con Caza Estelar como con otros juegos.
- **Confirmado:** la web administrará y proporcionará los usuarios válidos para los juegos conectados.
- **Confirmado:** por cada actividad se registrarán, como mínimo, el tiempo empleado y el porcentaje obtenido.
- **Confirmado:** docentes, directores, administradores institucionales y administradores generales podrán consultar la bitácora, con perfiles y datos visibles diferentes según su rol.
- **Confirmado:** cada docente solamente podrá consultar las secciones que tenga asignadas.
- **Confirmado:** cada director podrá consultar todas las secciones de su colegio.
- **Confirmado:** el administrador general podrá consultar la información de todos los colegios y países.
- **Confirmado:** el porcentaje de una actividad se calculará a partir del resultado final de respuestas correctas.
- **Confirmado:** el alumno podrá repetir una actividad y la bitácora conservará como resultado principal el mayor porcentaje obtenido.
- **Confirmado:** se conservará internamente el historial completo de intentos.
- **Confirmado:** el mejor resultado mostrará el tiempo empleado en ese mismo intento y su número de intento.
- **Confirmado:** Caza Estelar funcionará totalmente en línea; no se contempla operación sin conexión ni sincronización diferida.
- **Confirmado:** si se pierde la conexión durante una actividad, la aplicación mostrará un aviso de desconexión.
- **Confirmado:** la actividad se pausará mientras no haya conexión y podrá continuar cuando se recupere.
- **Confirmado:** el temporizador también se detendrá durante la pausa causada por una desconexión.
- **Pendiente:** matriz exacta de permisos por rol, mecanismo de autenticación e integración, frecuencia de envío y reglas de privacidad.

### 2.7 Ecosistema e identidad centralizada

La web independiente actuará como sistema central de usuarios y resultados para varios juegos educativos. Caza Estelar consumirá las cuentas válidas creadas por los administradores y enviará los resultados correspondientes a las actividades realizadas.

- **Confirmado:** la web y los juegos se comunicarán mediante una API compartida.
- **Confirmado:** la sesión del alumno permanecerá abierta al cerrar y volver a abrir el juego.
- **Confirmado:** la sesión permanecerá abierta sin una expiración automática definida.
- **Confirmado:** el administrador general podrá bloquear una cuenta y cerrar remotamente la sesión de un alumno.
- **Confirmado:** cuando una cuenta sea bloqueada o su sesión se cierre remotamente, el alumno será expulsado de inmediato, incluso si se encuentra realizando una actividad.
- **Confirmado:** el historial de resultados de una cuenta bloqueada se conservará en la bitácora.
- **Confirmado:** bloquear una cuenta eliminará sus intentos incompletos almacenados localmente.
- **Confirmado:** no será obligatorio indicar un motivo para bloquear una cuenta.
- **Confirmado:** la web registrará quién bloqueó o desbloqueó una cuenta y la fecha y hora de la acción.
- **Confirmado:** una cuenta desbloqueada podrá volver a utilizar las mismas credenciales y conservará su progreso e historial.
- **Pendiente:** decidir si las contraseñas generadas deberán cambiarse durante el primer ingreso.
- **Confirmado:** el administrador podrá generar reportes generales por sección.
- **Confirmado:** los reportes incluirán alumnos, actividades, mejor porcentaje, tiempo del mejor intento, número de intentos y promedio del grupo.
- **Confirmado:** los reportes podrán filtrarse por fechas, grado, sección y actividad.
- **Confirmado:** los reportes podrán descargarse en PDF y Excel.
- **Confirmado:** el promedio de una actividad se calculará usando el mejor porcentaje de cada alumno de la sección.
- **Confirmado:** los alumnos que todavía no hayan realizado la actividad se incluirán en el promedio con un valor de 0 %.
- **Confirmado:** los reportes identificarán a los alumnos que tengan actividades incompletas.
- **Pendiente técnico:** para mostrar actividades incompletas en la web, el juego deberá comunicar su estado, aunque los datos necesarios para reanudarlas permanezcan únicamente en el dispositivo.
- **Pendiente de precisión:** los reportes deberán considerar la versión reciente y la actividad, pero falta definir cómo tratar resultados generados en versiones anteriores.
- **Confirmado:** las credenciales de alumnos se manejarán en un reporte separado y no formarán parte del reporte académico general por sección.
- **Confirmado:** únicamente el administrador general podrá generar el reporte separado de credenciales.
- **Pendiente:** formato, descarga e impresión del reporte separado de credenciales, además del diseño exacto de las exportaciones académicas.

**Límite de responsabilidad preliminar:**

- La web crea y administra cuentas, instituciones, roles y permisos.
- Caza Estelar autentica o valida al usuario contra el sistema central.
- Caza Estelar ejecuta las actividades y calcula o recopila sus resultados.
- Caza Estelar calcula internamente el porcentaje final.
- Caza Estelar transmite a la web el tiempo, porcentaje y número de intento.
- Para un intento incompleto, Caza Estelar transmite su estado y el porcentaje alcanzado hasta ese momento.
- Las respuestas y el punto exacto necesarios para reanudar un intento incompleto permanecen únicamente en el dispositivo.
- Si la API no puede recibir un resultado, Caza Estelar lo conserva localmente y reintenta el envío al recuperar la conexión.
- Cada intento tendrá una identidad estable para que la API pueda reconocer reenvíos y evitar resultados duplicados.
- La web almacena, organiza y presenta la información según el rol que consulta.

Este reparto es preliminar hasta definir el contrato de integración, la autenticación técnica y el manejo de errores de la API.

### 2.8 Evaluación y recompensa

- **Confirmado:** cada actividad otorgará hasta tres estrellas o fragmentos estelares según el desempeño.
- **Confirmado:** obtener dos de los tres elementos será suficiente para aprobar la actividad.
- **Confirmado:** la recompensa se asignará usando los siguientes rangos:
  - 0–29 %: ninguna estrella o fragmento.
  - 30–59 %: una estrella o fragmento.
  - 60–89 %: dos estrellas o fragmentos y actividad aprobada.
  - 90–100 %: tres estrellas o fragmentos.
- **Confirmado:** una actividad abandonada antes de terminar se guarda localmente como un intento incompleto y queda en el punto donde el alumno la dejó para poder retomarla en el mismo dispositivo.
- **Confirmado:** el intento incompleto no se sincronizará con la web ni podrá retomarse desde otro dispositivo.
- **Confirmado:** podrán existir varias actividades incompletas simultáneamente.
- **Confirmado:** los intentos incompletos se asociarán con la cuenta del alumno y no se mostrarán ni mezclarán al iniciar sesión con otra cuenta en el mismo dispositivo.
- **Confirmado:** al cerrar sesión se eliminarán los intentos incompletos almacenados localmente para ese alumno.
- **Confirmado:** no se mostrará una advertencia adicional antes de eliminar esos intentos incompletos al cerrar sesión.
- **Confirmado:** el progreso incompleto se guardará automáticamente después de cada respuesta o acción relevante.
- **Confirmado:** el tiempo continúa avanzando cuando la aplicación pasa a segundo plano, pero se detiene si la aplicación se cierra completamente.
- **Confirmado:** no habrá límite de intentos para repetir una actividad.
- **Confirmado:** después de aprobar con dos estrellas o fragmentos, el alumno podrá repetir la actividad para intentar conseguir la tercera.
- **Confirmado:** al repetir una actividad terminada, se inicia desde cero y se registra como un intento nuevo.

Las estrellas son rangos visuales de desempeño y no fracciones matemáticas exactas. Por ello, dos estrellas corresponden al rango de aprobación que comienza en 60 %.

### 2.9 Orientación académica

- **Confirmado:** los contenidos matemáticos se alinearán con el currículo vigente de Guatemala al momento de diseñar y revisar el contenido.
- **Confirmado:** las actividades se clasificarán por grado escolar.
- **Confirmado:** el sistema asignará automáticamente el contenido correspondiente al grado registrado del alumno.
- **Confirmado:** se contemplan actividades de selección de respuestas, conteo de objetos, ordenamiento de números, resolución de operaciones y arrastre de elementos.
- **Confirmado:** también se diseñarán mecánicas más interactivas adecuadas para niños de 6 a 8 años.
- **Confirmado:** la cantidad de ejercicios podrá variar entre actividades.
- **Confirmado:** cada actividad dispondrá de un banco de planteamientos mayor que la cantidad presentada en un solo intento.
- **Confirmado:** al repetir una actividad, los ejercicios cambiarán de orden y se seleccionarán variantes para reducir la repetición y la memorización de respuestas.
- **Confirmado:** cada intento presentará aproximadamente cuatro o cinco ejercicios tomados del banco de la actividad.
- **Confirmado:** las variantes de una misma actividad tendrán una dificultad similar, aunque no necesariamente idéntica.
- **Confirmado:** el porcentaje base se calculará como `puntuación correcta obtenida ÷ puntuación total posible × 100`.
- **Confirmado:** los ejercicios con varias partes podrán otorgar puntuación parcial.
- **Confirmado:** todos los ejercicios de una actividad tendrán el mismo valor total.
- **Confirmado:** el equipo académico no asignará manualmente un peso diferente a cada parte de un ejercicio compuesto; desarrollo deberá aplicar una regla uniforme de distribución.
- **Confirmado:** el porcentaje final se mostrará como un número entero redondeado.
- **Confirmado:** el porcentaje se mostrará únicamente al terminar la actividad, no durante su ejecución.
- **Confirmado:** una respuesta no se presentará al niño como un error directo. Tojil utilizará mensajes de apoyo, como “No estoy seguro”, y lo guiará para que encuentre la respuesta correcta.
- **Confirmado:** durante esa orientación podrá mostrarse la solución correcta.
- **Confirmado:** el porcentaje medirá el grado de autonomía con que se resolvió cada ejercicio:
  - Respuesta correcta sin ayuda: 100 % del valor del ejercicio.
  - Respuesta correcta después de una ayuda: 75 % del valor del ejercicio.
  - Respuesta correcta después de varias ayudas o después de mostrar la solución: 50 % del valor del ejercicio.
- **Confirmado:** la primera ayuda se activará únicamente después de tres respuestas no acertadas consecutivas; los intentos previos no mostrarán una pista formal.
- **Confirmado:** después de la primera ayuda, una nueva respuesta no acertada activará una segunda ayuda.
- **Confirmado:** si el alumno vuelve a intentar responder después de la segunda ayuda y no acierta, Tojil mostrará la solución correcta.
- **Confirmado:** en ejercicios con varias partes, el valor total se dividirá automáticamente en partes iguales.
- **Confirmado:** el banco evitará repetir ejercicios para un alumno hasta haber utilizado todas las variantes disponibles; después podrá comenzar un nuevo ciclo de selección.
- **Confirmado:** el equipo académico entregará los planteamientos alternativos, variantes y respuestas correctas que formen cada banco de ejercicios.
- **Confirmado:** Tojil comunicará las instrucciones mediante globos de texto.
- **Confirmado:** los globos de texto de Tojil avanzarán cuando el usuario toque la pantalla; no desaparecerán automáticamente por tiempo.
- **Confirmado:** el contenido en español e inglés será equivalente; el inglés será una traducción del mismo contenido y no una adaptación curricular o cultural diferente.
- **Confirmado:** un equipo académico externo al equipo de desarrollo revisará y aprobará la corrección pedagógica y matemática de las actividades.
- **Confirmado:** el equipo académico creará y entregará el contenido antes de que desarrollo lo implemente.
- **Confirmado:** el equipo de desarrollo será responsable de la traducción al inglés y la validará mediante su proceso de QA.
- **Pendiente:** grados exactos incluidos, temario por grado, identificación documental del currículo vigente, formato de entrega académica, responsables nominales, criterios formales de aprobación y catálogo de mecánicas.

### 2.10 Flujo preliminar de contenido

1. El equipo académico crea el contenido matemático conforme al currículo vigente de Guatemala.
2. El equipo académico revisa y aprueba su corrección pedagógica y matemática.
3. El contenido aprobado se entrega al equipo de desarrollo.
4. Desarrollo implementa el contenido y produce la versión equivalente en inglés.
5. Desarrollo valida la traducción y la implementación mediante QA.

El formato de entrega, el control de versiones, los criterios de aceptación y el procedimiento para solicitar correcciones todavía deben definirse.

### 2.11 Distribución del contenido

- **Confirmado:** las actividades formarán parte de la aplicación instalada.
- **Confirmado:** agregar o modificar actividades requerirá publicar una nueva versión del juego.
- **Confirmado:** inicialmente no se descargará contenido educativo dinámico desde la web.
- **Confirmado:** cuando exista una versión nueva, la actualización será obligatoria para continuar jugando.
- **Confirmado:** una versión antigua podrá abrirse indefinidamente, pero mostrará la solicitud de actualización y no permitirá entrar al juego.
- **Confirmado:** las versiones antiguas dejarán de recibir seguimiento y soporte después de publicarse una versión nueva.
- **Confirmado:** las versiones se distribuirán mediante Google Play y también como archivos APK para instalación institucional.
- **Confirmado:** la aplicación comprobará si existe una versión nueva durante cada inicio de sesión.
- **Confirmado:** en instalaciones realizadas mediante APK, el aviso de actualización incluirá un botón para descargar el APK actualizado.
- **Confirmado:** los reportes mostrarán los resultados correspondientes a la versión reciente.
- **Confirmado:** una versión antigua no seguirá actualizando los reportes.
- **Confirmado:** los resultados de versiones anteriores se conservarán como historial, aunque no aparezcan en el reporte principal de la versión reciente.
- **Pendiente:** estrategia de versionado, compatibilidad efectiva de la API y tratamiento de resultados provenientes de actividades modificadas entre versiones.

### 2.11.1 Distribución comercial y aprobación

- **Confirmado:** Caza Estelar se ofrecerá gratuitamente en Google Play.
- **Confirmado:** la dirección del proyecto será responsable de autorizar oficialmente la publicación de cada versión.
- **Confirmado:** desarrollo y QA prepararán y validarán la versión, pero no sustituirán la aprobación final de dirección.

### 2.12 Datos locales de acceso

- **Confirmado:** al cerrar sesión manualmente se eliminarán la sesión activa y la contraseña almacenada.
- **Confirmado:** el nombre de usuario podrá permanecer en el dispositivo como sugerencia para el siguiente inicio de sesión.
- **Confirmado:** volver a ingresar requerirá escribir nuevamente la contraseña.
- **Confirmado:** la pantalla de acceso permitirá borrar u olvidar el nombre de usuario sugerido en el dispositivo.
- **Pendiente:** política institucional adicional para dispositivos compartidos.

### 2.13 Privacidad, retención y auditoría

- **Confirmado:** cada institución será responsable de obtener la autorización de padres o encargados antes de crear las cuentas de menores.
- **Confirmado:** cuando un alumno abandone una institución, su información y sus resultados permanecerán conservados como datos históricos.
- **Confirmado:** el administrador general podrá eliminar definitivamente una cuenta y todos sus datos asociados.
- **Confirmado:** al eliminar una cuenta, sus resultados desaparecerán también de los promedios y reportes históricos.
- **Confirmado:** los registros de auditoría relacionados se conservarán, pero sin datos que identifiquen al alumno eliminado.
- **Confirmado:** no habrá un estado adicional de desactivación; se utilizarán bloqueo reversible o eliminación definitiva.
- **Confirmado:** la fecha de nacimiento será visible únicamente para el administrador general; los demás perfiles no tendrán acceso a ella.
- **Confirmado:** los docentes podrán consultar los nombres completos y la información académica de los alumnos dentro de sus secciones asignadas.
- **Confirmado:** los directores podrán descargar los reportes PDF y Excel correspondientes a su colegio.
- **Confirmado:** la web registrará los inicios y cierres de sesión.
- **Confirmado:** únicamente el administrador general podrá consultar los registros de auditoría.
- **Confirmado:** el historial académico de un alumno podrá trasladarse cuando cambie de colegio dentro del sistema.
- **Confirmado:** no existe un requisito inicial para alojar los datos en un país o región específicos.
- **Pendiente:** política formal de retención, procedimiento de eliminación, respaldo y recuperación, alcance de los perfiles administrativos, acceso a registros de auditoría y validación legal para Guatemala y Estados Unidos.

### 2.14 Dispositivos, audio y accesibilidad

- **Confirmado:** Caza Estelar se utilizará tanto en teléfonos como en tabletas Android.
- **Confirmado:** la aplicación funcionará únicamente en orientación horizontal.
- **Confirmado:** toda actividad podrá entenderse y completarse sin sonido.
- **Confirmado:** el juego incluirá música y efectos de sonido.
- **Confirmado:** no se incluirá narración de voz; las instrucciones de Tojil permanecerán en globos de texto.
- **Confirmado:** el juego reducirá automáticamente animaciones y efectos cuando el dispositivo no pueda mantener el objetivo de 60 FPS.
- **Confirmado:** no existirá un control manual adicional para activar la reducción de animaciones; la decisión será automática.
- **Confirmado:** el tamaño del texto no será configurable inicialmente.
- **Confirmado:** no se establecerá un límite recomendado de tiempo por sesión.
- **Confirmado:** Tojil ofrecerá pistas después de que el alumno cometa varios errores.
- **Confirmado:** Tojil mostrará una pista automáticamente después de tres fallos consecutivos.
- **Confirmado:** no habrá una penalización adicional por usar pistas; sin embargo, el valor del ejercicio reflejará el grado de ayuda recibido según la escala de autonomía.
- **Confirmado:** música y efectos de sonido tendrán controles separados.
- **Confirmado:** las preferencias de música y efectos se conservarán localmente en el dispositivo.
- **Confirmado:** la reducción automática simplificará o eliminará transiciones intensas, sin retirar necesariamente todo el movimiento decorativo.
- **Confirmado:** una respuesta correcta reiniciará el contador de fallos consecutivos.
- **Confirmado:** inicialmente no se implementarán modos específicos de daltonismo ni alto contraste.

### 2.15 Narrativa y evolución visual

- **Confirmado:** la historia comienza con la explosión natural de dos estrellas, un acontecimiento que provoca que todas las constelaciones de la galaxia pierdan su brillo y queden apagadas.
- **Confirmado:** las dos estrellas no tendrán nombres ni personalidad; funcionarán únicamente como el acontecimiento visual que inicia la historia.
- **Confirmado:** Tojil dirige la búsqueda para recuperar las estrellas y restaurar las constelaciones.
- **Confirmado:** Tojil se dirigirá directamente al jugador utilizando su nombre.
- **Confirmado:** el elenco de Explorax está compuesto por **Chnám, Ik’ar, Ulew, Rum, Tojil, Xam, Ya’ y Ja’**.
- **Confirmado:** los personajes distintos de Tojil actuarán como personajes secundarios y ayudarán durante la búsqueda.
- **Confirmado:** los personajes secundarios podrán servir como apoyo en determinados temas o aparecer en el observatorio después de completar esos temas.
- **Confirmado:** no se asignará inicialmente una función pedagógica fija y exclusiva a cada personaje.
- **Confirmado:** algunos personajes secundarios mostrarán globos de texto cuando el alumno interactúe con ellos.
- **Confirmado:** los personajes no permanecerán integrados en una única imagen de escenario; se necesitarán recursos individuales para utilizarlos por separado.
- **Confirmado:** el equipo de Explorax proporcionará posteriormente los assets individuales y animaciones adicionales.
- **Confirmado:** al representar cada personaje deberán respetarse sus facciones, colores y rasgos visuales propios.
- **Confirmado:** las ilustraciones que se encuentran actualmente en el proyecto son provisionales y no deben considerarse assets finales de producción.
- **Confirmado:** cada constelación recuperada tendrá una celebración y una animación propias.
- **Confirmado:** recuperar una constelación producirá también un cambio visible en el observatorio.
- **Confirmado:** los cambios del observatorio serán permanentes y acumulativos conforme avance el jugador.
- **Confirmado:** al recuperar todas las constelaciones disponibles, el jugador verá el cielo completamente iluminado y recibirá una felicitación por su trabajo como explorador.
- **Confirmado:** después de ver el final, el alumno podrá continuar y repetir actividades.
- **Confirmado:** las celebraciones y el final no tendrán una versión simplificada específica para el modo de animaciones reducidas.
- **Pendiente:** personalidad y guía visual detallada de cada personaje, relación de personajes por tema, assets finales, guion de introducción, cambios concretos del observatorio, celebraciones y opción para volver a reproducir el final desde un menú.

### 2.16 Diagnóstico técnico

- **Confirmado:** la aplicación enviará automáticamente reportes técnicos de fallos y cierres inesperados.
- **Pendiente:** seleccionar la herramienta, definir los datos incluidos, aplicar anonimización y establecer acceso y retención de los diagnósticos.

### 2.17 Ambientes

- **Confirmado:** existirán ambientes separados de desarrollo, pruebas y producción.
- **Confirmado:** desarrollo se utilizará para construir e integrar cambios.
- **Confirmado:** pruebas se utilizará para validación de QA antes de liberar una versión.
- **Confirmado:** producción será el ambiente utilizado por colegios y escuelas.
- **Pendiente:** infraestructura, credenciales, datos de prueba, proceso de promoción entre ambientes y responsables operativos.

### 2.18 Calidad y lanzamientos

- **Confirmado:** QA probará cada actividad implementada antes de enviarla a producción.
- **Confirmado:** el equipo académico revisará también la actividad ya implementada, además de haber aprobado previamente el contenido original.
- **Confirmado:** las pruebas se ejecutarán en teléfonos y tabletas físicas, además de emuladores.
- **Confirmado:** cada lanzamiento tendrá una lista mínima definida de dispositivos Android representativos.
- **Confirmado:** no se implementará inicialmente un mecanismo remoto para retirar o desactivar una versión con errores críticos.
- **Confirmado:** no se conservará inicialmente un registro formal de qué versión fue aprobada, quién la aprobó y en qué fecha.
- **Confirmado:** una versión no podrá publicarse si contiene errores visuales conocidos, aunque sean menores.
- **Confirmado:** cualquier error que afecte resultados, porcentajes, cuentas o progreso bloqueará el lanzamiento.
- **Confirmado:** QA verificará español e inglés en cada actividad.
- **Confirmado:** las pruebas cubrirán llamadas o interrupciones del sistema, paso a segundo plano, pérdida de conexión y cierre inesperado.
- **Confirmado:** se automatizarán pruebas para cálculo de porcentajes, asignación de estrellas, desbloqueos y envío de resultados.
- **Confirmado:** el objetivo de rendimiento será mantener 60 FPS en los dispositivos incluidos en la matriz mínima.
- **Pendiente:** severidades adicionales, cobertura cuantitativa, dispositivos concretos, medición estable de FPS y procedimiento ante incidentes críticos en producción.

### 2.19 Presupuesto de rendimiento y distribución de assets

- **Confirmado:** desde el lanzamiento hasta mostrar la pantalla de acceso deberán transcurrir menos de 10 segundos.
- **Confirmado:** abrir una actividad deberá tardar como máximo 2 segundos en condiciones normales.
- **Confirmado:** la descarga de Google Play y el APK no deberán superar 500 MB.
- **Confirmado:** las imágenes, animaciones u otros assets podrán descargarse después de instalar la aplicación.
- **Confirmado:** las actividades y su lógica seguirán distribuyéndose mediante nuevas versiones; la descarga posterior se utilizará para assets asociados, no como sistema inicial de contenido educativo dinámico.
- **Diferido para una fase posterior:** paquetes de assets, versionado, caché, integridad, descarga inicial obligatoria, limpieza de archivos, alojamiento y comportamiento ante fallos de descarga.

## 3. Orientación por definir

### 3.1 Visión del producto

1. **Respondida:** Caza Estelar se define como una experiencia de aprendizaje interactivo.
2. **Respondida:** combina educación y entretenimiento, con prioridad educativa.
3. **Respondida:** debe apoyar visual e interactivamente los temas de clase y reforzar el aprendizaje del jugador.
4. **Respondida:** el público principal son niños de 6 a 8 años de Guatemala y Estados Unidos, en un contexto institucional.
5. **Respondida parcialmente:** la institución será el canal principal de uso y presumiblemente de adquisición; queda pendiente definir qué tipo de institución y quién decide la adopción.

### 3.2 Alcance y experiencia

6. **Respondida parcialmente:** el ciclo consistirá en completar niveles matemáticos asociados con estrellas para recuperar constelaciones; faltan las acciones concretas dentro de cada actividad.
7. **Respondida parcialmente:** Tojil será el protagonista y guía de la búsqueda de estrellas perdidas; faltan personajes secundarios y desarrollo detallado de la historia.
8. ¿Qué contenido mínimo debe tener la primera versión publicable?
9. ¿Qué funciones quedan explícitamente fuera de esa primera versión?
10. ¿El juego debe funcionar completamente sin conexión?
11. ¿Se publicará solo en Android o se contempla escritorio, iOS o web?

### 3.3 Progreso y cuentas

12. **Respondida parcialmente:** cada niño tendrá una cuenta individual creada automáticamente desde listados institucionales y accederá con usuario y contraseña generados por el sistema. Provisionalmente, el administrador restablecerá contraseñas.
13. **Respondida parcialmente:** se almacenarán nombre real, fecha de nacimiento, grado, sección, colegio y país, sin alias; la edad se calculará desde la fecha de nacimiento. Faltan consentimiento, retención y protección de estos datos.
14. ¿El progreso será local, en la nube o híbrido?
15. ¿Habrá varios perfiles por dispositivo (por ejemplo, hermanos o alumnos)?
16. **Respondida parcialmente:** el progreso incluirá niveles, estrellas recuperadas, constelaciones, tiempo, porcentaje y número de intento. Se conservarán todos los intentos, aunque el mejor será el resultado principal; faltan agregados institucionales.
17. ¿Se requiere recuperación de cuenta y funcionamiento en varios dispositivos?

### 3.4 Modelo educativo y contenido

18. **Respondida parcialmente:** todo el contenido será matemático y se alineará con el currículo vigente de Guatemala; falta identificar formalmente el documento y el temario por grado.
19. **Respondida parcialmente:** el equipo académico externo creará, revisará, aprobará y entregará el contenido antes de implementarlo; falta definir el formato y cómo se registra la aprobación.
20. **Respondida parcialmente:** el porcentaje se calculará usando el resultado final de respuestas correctas. Se conservará como resultado principal el mayor porcentaje junto con el tiempo y número de ese intento. La aprobación requerirá dos de tres estrellas o fragmentos y se propuso un mínimo del 60 %, cuya equivalencia debe precisarse.
21. **Respondida parcialmente:** las actividades se asignarán automáticamente según el grado del alumno; falta definir si también se adaptarán según su desempeño.
22. **Respondida:** español e inglés tendrán contenido equivalente; desarrollo realizará la traducción al inglés y la validará mediante QA.

### 3.5 Arquitectura y operación

23. ¿Hay preferencia o restricción para backend, proveedor de nube y base de datos?
24. **Respondida parcialmente:** la web independiente administrará usuarios válidos y mostrará resultados de varios juegos según el rol; falta definir si también gestionará contenido educativo.
25. **Respondida:** las actividades se incorporarán mediante nuevas versiones del juego; no se actualizarán dinámicamente desde la web.
26. ¿Qué volumen inicial se espera: usuarios totales, usuarios simultáneos e instituciones?
27. ¿Habrá ambientes separados de desarrollo, pruebas y producción?
28. ¿Cómo se distribuirán las versiones de prueba y la versión pública?

### 3.6 Calidad, privacidad y sostenibilidad

29. ¿Qué dispositivos o tamaños de pantalla son prioritarios para las pruebas?
30. ¿Qué requisitos de accesibilidad debemos adoptar (subtítulos, contraste, daltonismo, tamaño de texto, controles, lector de pantalla)?
31. ¿Se recopilarán analíticas, diagnósticos de fallos o telemetría? ¿Con qué finalidad?
32. ¿Qué requisitos legales o institucionales aplican por país y por tratarse posiblemente de menores?
33. ¿El producto será gratuito, de pago, por suscripción, patrocinado o licenciado a instituciones?
34. ¿Quién dará mantenimiento, atenderá errores y aprobará lanzamientos?

## 4. Reglas iniciales de documentación

- Mantener este archivo como fuente principal de orientación.
- Registrar cada decisión con su estado: confirmado, provisional o pendiente.
- Evitar presentar como definitivo algo que todavía sea una demostración.
- Añadir el motivo y las consecuencias cuando una decisión técnica sea relevante.
- Usar UTF-8 y español claro; conservar nombres de clases, archivos y tecnologías en su forma original.
- Cuando una decisión reemplace otra, conservar un registro breve del cambio.

## 5. Registro de decisiones

| Fecha | Área | Decisión | Estado | Motivo / consecuencias |
|---|---|---|---|---|
| 2026-08-17 | Documentación | Crear una documentación maestra e iterativa | Confirmado | Centraliza orientación, decisiones y preguntas del proyecto. |
| 2026-08-17 | Producto | Definir Caza Estelar como aprendizaje interactivo con prioridad educativa | Confirmado | El entretenimiento estará al servicio del refuerzo de los contenidos impartidos en clase. |
| 2026-08-17 | Público | Orientar el producto a niños de 6 a 8 años de Guatemala y Estados Unidos | Confirmado | La interfaz, dificultad, lenguaje, accesibilidad y contenido deberán diseñarse para este rango y ambos contextos. |
| 2026-08-17 | Distribución | Priorizar el uso institucional | Confirmado | Se deberán definir roles institucionales, administración, grupos y forma de distribución. |
| 2026-08-17 | Narrativa | Usar a Tojil como protagonista y guía de la búsqueda de las estrellas perdidas | Confirmado | Tojil concentrará la interacción narrativa y la orientación al jugador. |
| 2026-08-17 | Instituciones | Priorizar colegios y escuelas | Confirmado | El despliegue, la administración y los reportes deben responder a necesidades escolares. |
| 2026-08-17 | Contenido | Basar todo el aprendizaje en matemáticas | Confirmado | Los temas específicos y su alineación curricular quedan pendientes. |
| 2026-08-17 | Progresión | Organizar temas y niveles como estrellas que recuperan constelaciones | Confirmado | Permitirá agrupar contenido matemático y representarlo visualmente. |
| 2026-08-17 | Progresión | Permitir un recorrido no lineal | Confirmado | Deben definirse las reglas de acceso, bloqueo y finalización de niveles. |
| 2026-08-17 | Usuarios | Asignar una cuenta individual a cada niño | Confirmado | Requiere definir creación, autenticación, recuperación y relación con la institución. |
| 2026-08-17 | Resultados | Reflejar resultados en una bitácora desarrollada por separado | Confirmado | Se necesitará un contrato de datos e integración entre ambos sistemas. |
| 2026-08-17 | Administración | Permitir que el administrador cree las cuentas de alumnos | Confirmado | Los niños no realizarán un registro autónomo desde el juego. |
| 2026-08-17 | Datos | Identificar al alumno sin alias mediante datos escolares y personales | Confirmado | Se almacenarán nombre, fecha de nacimiento, edad, grado, sección, colegio y país; exige controles de privacidad para menores. |
| 2026-08-17 | Acceso | Aplicar visibilidad diferenciada para docentes, directores y administradores | Confirmado | Debe crearse una matriz de permisos y alcance de datos por rol. |
| 2026-08-17 | Métricas | Registrar tiempo y porcentaje por actividad | Confirmado | Deben definirse unidades, fórmulas, eventos y tratamiento de intentos incompletos. |
| 2026-08-17 | Progresión | Desbloquear temas cuando dependan de conocimientos complementarios | Confirmado | La progresión será no lineal, pero podrá tener dependencias pedagógicas. |
| 2026-08-17 | Ecosistema | Usar una web independiente como fuente central de usuarios y resultados para varios juegos | Confirmado | Caza Estelar requerirá autenticación e intercambio de resultados mediante una integración común. |
| 2026-08-17 | Datos | Calcular la edad a partir de la fecha de nacimiento | Confirmado | Evita almacenar un dato duplicado que perdería vigencia al cumplirse años. |
| 2026-08-17 | Administración | Centralizar la creación de cuentas en el administrador general | Confirmado | La gestión de altas no se delegará inicialmente a colegios, directores o docentes. |
| 2026-08-17 | Permisos | Limitar docentes a sus secciones y directores a su colegio | Confirmado | Aplica el acceso institucional según responsabilidad y ámbito asignado. |
| 2026-08-17 | Permisos | Permitir al administrador general consultar todos los colegios y países | Confirmado | Este rol tendrá alcance global dentro del ecosistema. |
| 2026-08-17 | Autenticación | Usar usuario y contraseña para el acceso de alumnos | Confirmado | La web central proporcionará y validará las credenciales utilizadas por los juegos. |
| 2026-08-17 | Evaluación | Calcular el porcentaje con base en las respuestas correctas | Confirmado | El porcentaje representa el resultado final de la actividad. |
| 2026-08-17 | Reintentos | Conservar como resultado principal el mayor porcentaje | Confirmado | El alumno podrá repetir actividades sin reemplazar un mejor resultado por uno inferior. |
| 2026-08-17 | Reintentos | Conservar todos los intentos y asociar tiempo y número al mejor resultado | Confirmado | Permite mostrar el mejor desempeño sin perder el historial de aprendizaje. |
| 2026-08-17 | Credenciales | Generar usuarios y contraseñas desde listados institucionales | Confirmado | Evita la creación manual individual de cuentas. |
| 2026-08-17 | Importación | Admitir cargas masivas mediante Excel o CSV | Confirmado | Facilita incorporar grupos completos de alumnos. |
| 2026-08-17 | Contraseñas | Reservar provisionalmente el restablecimiento al administrador | Provisional | El alcance podrá ampliarse cuando se definan los procedimientos institucionales. |
| 2026-08-17 | Conectividad | Requerir conexión permanente | Confirmado | No se implementarán sesiones sin conexión ni sincronización diferida. |
| 2026-08-17 | Recompensa | Representar el desempeño con hasta tres estrellas o fragmentos | Confirmado | Dos elementos serán suficientes para aprobar desde un resultado del 60 %. |
| 2026-08-17 | Actividades | Conservar en progreso una actividad que el alumno abandona | Confirmado | El alumno podrá retomarla desde el punto donde la dejó sin registrarla como terminada. |
| 2026-08-17 | Tiempo | Mantener el cronómetro cuando la aplicación pasa a segundo plano | Confirmado | El tiempo reflejará también el periodo transcurrido fuera de la vista activa. |
| 2026-08-17 | Reintentos | Permitir intentos ilimitados | Confirmado | El alumno podrá practicar sin un máximo de repeticiones. |
| 2026-08-17 | Recompensa | Permitir repetir una actividad aprobada para obtener la tercera estrella | Confirmado | La aprobación no bloquea la mejora posterior del resultado. |
| 2026-08-17 | Evaluación | Asignar estrellas mediante rangos porcentuales | Confirmado | 0–29 no otorga estrellas, 30–59 otorga una, 60–89 otorga dos y 90–100 otorga tres. |
| 2026-08-17 | Persistencia | Guardar el abandono como intento incompleto reanudable | Confirmado | No se calcula un resultado final hasta terminar la actividad. |
| 2026-08-17 | Temporizador | Detener el tiempo al cerrar completamente la aplicación | Confirmado | En segundo plano continúa; al terminar la aplicación, el intento queda incompleto y el reloj se detiene. |
| 2026-08-17 | Persistencia | Guardar intentos incompletos solamente en el dispositivo | Confirmado | Solo podrán retomarse en el mismo dispositivo y podrán coexistir varios. |
| 2026-08-17 | Reintentos | Reiniciar desde cero cada repetición de una actividad terminada | Confirmado | Cada repetición se registra como un intento nuevo. |
| 2026-08-17 | Conectividad | Mostrar un aviso cuando se pierde la conexión | Confirmado | Falta definir si la actividad también se pausa o bloquea. |
| 2026-08-17 | Currículo | Alinear las matemáticas con el currículo de Guatemala | Confirmado | El mismo contenido educativo se ofrecerá en español e inglés. |
| 2026-08-17 | Asignación | Clasificar y asignar actividades automáticamente por grado | Confirmado | El grado registrado en la cuenta determinará el contenido disponible. |
| 2026-08-17 | Interfaz | Presentar las instrucciones de Tojil mediante globos de texto | Confirmado | La orientación principal no dependerá de voz. |
| 2026-08-17 | Idiomas | Mantener contenido equivalente en español e inglés | Confirmado | No habrá inicialmente una adaptación curricular distinta por país. |
| 2026-08-17 | Currículo | Usar el currículo vigente de Guatemala | Confirmado | La versión concreta deberá identificarse al iniciar la producción académica. |
| 2026-08-17 | Revisión | Delegar la aprobación educativa a un equipo académico externo | Confirmado | Desarrollo no aprobará por sí solo la validez pedagógica o matemática. |
| 2026-08-17 | Conectividad | Pausar la actividad durante una desconexión | Confirmado | Se mostrará un aviso y se permitirá continuar al recuperar la conexión. |
| 2026-08-17 | Privacidad local | Separar los intentos incompletos por cuenta | Confirmado | Un alumno no podrá ver ni retomar los intentos locales de otro usuario. |
| 2026-08-17 | Cierre de sesión | Eliminar los intentos incompletos del alumno | Confirmado | Cerrar sesión descarta el progreso local que todavía no se haya completado. |
| 2026-08-17 | Cierre de sesión | No advertir sobre la eliminación de intentos incompletos | Confirmado | El cierre de sesión ejecutará directamente la limpieza local. |
| 2026-08-17 | Autoguardado | Guardar el intento incompleto después de cada respuesta o acción | Confirmado | Reduce la pérdida de progreso ante cierres inesperados. |
| 2026-08-17 | Temporizador | Detener el tiempo durante una desconexión | Confirmado | El periodo sin conectividad no contará como tiempo de resolución. |
| 2026-08-17 | Diálogos | Avanzar los globos de Tojil mediante toque | Confirmado | El alumno controla el ritmo de lectura. |
| 2026-08-17 | Contenido | Recibir el contenido aprobado antes de implementarlo | Confirmado | El equipo académico es responsable de crear y entregar la base educativa. |
| 2026-08-17 | Traducción | Asignar la traducción inglesa y su QA a desarrollo | Confirmado | La equivalencia lingüística se verificará dentro del proceso técnico de calidad. |
| 2026-08-17 | Integración | Conectar la web y los juegos mediante una API compartida | Confirmado | La API centralizará autenticación e intercambio de resultados para el ecosistema. |
| 2026-08-17 | Sesión | Mantener iniciada la sesión al cerrar y reabrir el juego | Confirmado | Requiere almacenar de forma segura la información de sesión en el dispositivo. |
| 2026-08-17 | Resultados | Calcular el porcentaje dentro del juego | Confirmado | La bitácora recibirá tiempo, porcentaje y número de intento, no respuestas individuales. |
| 2026-08-17 | Reportes | Permitir reportes generales por sección | Confirmado | El contenido, formato y permisos específicos del reporte están pendientes. |
| 2026-08-17 | Contenido | Publicar actividades mediante nuevas versiones del juego | Confirmado | No se implementará inicialmente una descarga dinámica de actividades. |
| 2026-08-17 | Reportes | Incluir resultados individuales y promedio grupal por sección | Confirmado | Se mostrarán alumnos, actividades, mejor porcentaje, tiempo e intentos. |
| 2026-08-17 | Reportes | Filtrar por fecha, grado, sección y actividad | Confirmado | Los responsables podrán delimitar el análisis institucional. |
| 2026-08-17 | Exportación | Descargar reportes en PDF y Excel | Confirmado | La web generará formatos de consulta y análisis externo. |
| 2026-08-17 | Compatibilidad | Permitir continuar con versiones anteriores del juego | Confirmado | La API deberá mantener compatibilidad durante un periodo aún no definido. |
| 2026-08-17 | Entrega de resultados | Reintentar resultados que la API no haya recibido | Confirmado | Los datos se guardarán localmente hasta recuperar la conexión y confirmar el envío. |
| 2026-08-17 | Sesión | Mantener la sesión abierta sin expiración automática | Confirmado | La sesión termina mediante cierre manual u otra invalidación administrativa futura. |
| 2026-08-17 | Cierre de sesión | Conservar solo el usuario como sugerencia | Confirmado | Se eliminan contraseña y sesión; el siguiente ingreso vuelve a solicitar la contraseña. |
| 2026-08-17 | Promedios | Calcular el promedio con el mejor resultado de cada alumno | Confirmado | Cada alumno aporta un único porcentaje por actividad. |
| 2026-08-17 | Promedios | Contar como 0 % a quien no haya realizado la actividad | Confirmado | La ausencia de participación reducirá el promedio general de la sección. |
| 2026-08-17 | Reportes | Mostrar alumnos con actividades incompletas | Confirmado | Requiere enviar a la web un estado mínimo de progreso sin sincronizar el contenido reanudable. |
| 2026-08-17 | Versiones | Avisar permanentemente cuando exista una actualización | Confirmado | La versión antigua podrá continuar, pero ya no recibirá seguimiento ni soporte. |
| 2026-08-17 | API | Evitar la duplicación de intentos reenviados | Confirmado | Cada intento deberá tener un identificador estable y el servidor procesará el envío de forma idempotente. |
| 2026-08-17 | Administración | Permitir bloqueo de cuentas y cierre remoto de sesiones | Confirmado | El administrador general podrá invalidar el acceso de un alumno desde la web. |
| 2026-08-17 | Actividad incompleta | Enviar estado y porcentaje parcial a la web | Confirmado | El punto exacto de reanudación y las respuestas permanecen exclusivamente en el dispositivo. |
| 2026-08-17 | Actualizaciones | Exigir la versión reciente para continuar jugando | Confirmado | La versión antigua solo mostrará la solicitud de actualización y no actualizará reportes. |
| 2026-08-17 | Distribución | Publicar mediante Google Play y APK institucional | Confirmado | Se mantendrán dos canales de instalación y actualización. |
| 2026-08-17 | Reportes | Mostrar resultados de la versión reciente | Confirmado | Falta definir si los datos históricos de versiones anteriores seguirán consultables fuera del reporte principal. |
| 2026-08-17 | Bloqueo | Expulsar inmediatamente al alumno bloqueado | Confirmado | Puede interrumpir una actividad en curso, aunque se espera que ocurra rara vez. |
| 2026-08-17 | Retención | Conservar el historial de cuentas bloqueadas | Confirmado | Bloquear el acceso no elimina los resultados académicos existentes. |
| 2026-08-17 | Actualizaciones | Comprobar la versión durante cada inicio de sesión | Confirmado | Una versión obsoleta bloqueará el acceso antes de continuar al juego. |
| 2026-08-17 | APK | Ofrecer descarga directa de la actualización | Confirmado | El aviso incluirá un botón para obtener el APK institucional reciente. |
| 2026-08-17 | Historial | Conservar resultados de versiones anteriores | Confirmado | Permanecerán disponibles como datos históricos fuera del reporte principal reciente. |
| 2026-08-17 | Reactivación | Restaurar acceso con las mismas credenciales | Confirmado | El desbloqueo conserva el progreso y el historial del alumno. |
| 2026-08-17 | Bloqueo | Eliminar intentos incompletos locales | Confirmado | Los progresos aún no terminados no se conservan al bloquear la cuenta. |
| 2026-08-17 | Bloqueo | No exigir un motivo | Confirmado | El registro de auditoría conserva autor y momento, pero el motivo es opcional o inexistente. |
| 2026-08-17 | Auditoría | Registrar bloqueos y desbloqueos | Confirmado | La web guardará el responsable y la fecha y hora de cada acción. |
| 2026-08-17 | Autorización | Delegar el consentimiento en la institución | Confirmado | La institución deberá obtener la autorización de padres o encargados antes de crear cuentas. |
| 2026-08-17 | Retención | Conservar datos de alumnos que abandonen la institución | Confirmado | Permanecerán como historial hasta que se ejecute una eliminación definitiva autorizada. |
| 2026-08-17 | Eliminación | Permitir al administrador general borrar una cuenta y sus datos | Confirmado | La eliminación será definitiva y deberá concretarse su alcance sobre respaldos y auditoría. |
| 2026-08-17 | Privacidad | Restringir la fecha de nacimiento a perfiles administrativos | Confirmado | Los docentes no necesitan este dato para consultar resultados académicos. |
| 2026-08-17 | Docentes | Mostrar nombres completos e información académica | Confirmado | El acceso se limita a las secciones asignadas al docente. |
| 2026-08-17 | Auditoría | Registrar inicios y cierres de sesión | Confirmado | Permitirá revisar el uso y acceso de las cuentas. |
| 2026-08-17 | Alojamiento | No exigir una región específica | Confirmado | La infraestructura podrá seleccionarse mediante criterios técnicos y contractuales posteriores. |
| 2026-08-17 | Eliminación | Excluir los resultados eliminados de promedios e históricos | Confirmado | Los reportes se recalcularán sin la cuenta y sus resultados. |
| 2026-08-17 | Auditoría | Conservar eventos anonimizados de cuentas eliminadas | Confirmado | Se mantiene la trazabilidad sin conservar la identidad del alumno. |
| 2026-08-17 | Estado de cuenta | No implementar desactivación adicional | Confirmado | Las opciones serán bloqueo reversible o eliminación definitiva. |
| 2026-08-17 | Fecha de nacimiento | Limitar su consulta al administrador general | Confirmado | Administradores institucionales, directores y docentes no podrán verla. |
| 2026-08-17 | Exportación | Permitir descargas de reportes a directores | Confirmado | El alcance se limita a la información de su colegio. |
| 2026-08-17 | Auditoría | Restringir los registros al administrador general | Confirmado | Ningún otro rol tendrá acceso al historial de acciones del sistema. |
| 2026-08-17 | Traslado | Conservar el historial al cambiar de colegio | Confirmado | La cuenta podrá reasignarse sin perder su progreso académico. |
| 2026-08-17 | Dispositivos | Admitir teléfonos y tabletas Android | Confirmado | La interfaz horizontal deberá adaptarse a distintos tamaños y densidades. |
| 2026-08-17 | Audio | Permitir completar el juego sin sonido | Confirmado | Música y efectos complementan la experiencia, pero no comunican información indispensable. |
| 2026-08-17 | Voz | No incorporar narración | Confirmado | Tojil se comunicará mediante globos de texto controlados por toque. |
| 2026-08-17 | Accesibilidad | Incluir reducción de animaciones | Reemplazado | Inicialmente se contempló un ajuste manual; después se decidió aplicar reducción automática según rendimiento. |
| 2026-08-17 | Texto | Mantener un tamaño no configurable | Confirmado | El diseño base deberá ser legible para niños de 6 a 8 años en teléfonos y tabletas. |
| 2026-08-17 | Sesión de juego | No imponer un límite de tiempo | Confirmado | La institución podrá organizar la duración de uso fuera de la aplicación. |
| 2026-08-17 | Ayudas | Dar pistas de Tojil tras errores repetidos | Confirmado | Falta definir el disparador y su impacto sobre porcentaje y estrellas. |
| 2026-08-17 | Ayudas | Activar pistas automáticas tras tres fallos consecutivos | Confirmado | Las pistas no penalizan el porcentaje ni la recompensa. |
| 2026-08-17 | Audio | Separar controles de música y efectos | Confirmado | Cada tipo de audio podrá activarse o desactivarse de forma independiente. |
| 2026-08-17 | Preferencias | Conservar ajustes en el dispositivo | Confirmado | Música y efectos persistirán localmente; la calidad de animación será automática. |
| 2026-08-17 | Movimiento | Reducir transiciones intensas | Confirmado | La reducción automática no tiene que eliminar todas las animaciones decorativas. |
| 2026-08-17 | Ayudas | Reiniciar los fallos consecutivos después de un acierto | Confirmado | La pista aparece únicamente tras una nueva cadena de tres errores. |
| 2026-08-17 | Accesibilidad | No implementar inicialmente daltonismo ni alto contraste | Confirmado | Se conserva únicamente la opción de reducir transiciones intensas. |
| 2026-08-17 | Historia | Apagar las constelaciones mediante la explosión de dos estrellas | Confirmado | El acontecimiento inicia la misión de restaurar el brillo de la galaxia. |
| 2026-08-17 | Personalización narrativa | Permitir que Tojil use el nombre del alumno | Confirmado | Refuerza la relación directa entre el guía y el jugador. |
| 2026-08-17 | Personajes | Usar aliados secundarios durante la búsqueda | Confirmado | Los personajes adicionales apoyarán a Tojil y al explorador. |
| 2026-08-17 | Progreso visual | Celebrar cada constelación y transformar el observatorio | Confirmado | El entorno mostrará de forma persistente el avance del jugador. |
| 2026-08-17 | Final | Restaurar todo el cielo y felicitar al explorador | Confirmado | Cierra el objetivo narrativo al completar todas las constelaciones disponibles. |
| 2026-08-17 | Origen | Tratar la explosión como un fenómeno natural y visual | Confirmado | Las dos estrellas no serán personajes ni resultado de un antagonista. |
| 2026-08-17 | Universo | Incorporar como aliados a los demás personajes de Explorax | Confirmado | Se reutilizarán los personajes y recursos gráficos existentes. |
| 2026-08-17 | Observatorio | Acumular permanentemente sus transformaciones | Confirmado | El escenario funcionará como representación visual continua del progreso. |
| 2026-08-17 | Posjuego | Permitir continuar después del final | Confirmado | Las actividades seguirán disponibles para repetición y mejora. |
| 2026-08-17 | Celebraciones | Mantener la animación completa en el modo reducido | Confirmado | La reducción de transiciones no alterará las celebraciones ni el final. |
| 2026-08-17 | Elenco | Definir ocho personajes de Explorax | Confirmado | Chnám, Ik’ar, Ulew, Rum, Tojil, Xam, Ya’ y Ja’ forman el elenco disponible. |
| 2026-08-17 | Secundarios | Usarlos como apoyo temático o habitantes del observatorio | Confirmado | No tendrán inicialmente una función fija por personaje. |
| 2026-08-17 | Interacción | Permitir diálogos en algunos personajes secundarios | Confirmado | La interacción se realizará mediante globos de texto. |
| 2026-08-17 | Assets | Utilizar personajes como recursos individuales | Confirmado | No formarán parte inseparable de las imágenes de escenario. |
| 2026-08-17 | Identidad visual | Respetar facciones y colores de cada personaje | Confirmado | Los futuros assets y animaciones deberán seguir sus guías individuales. |
| 2026-08-17 | Estado visual | Considerar provisionales las ilustraciones actuales | Confirmado | Los assets finales serán proporcionados posteriormente por Explorax. |
| 2026-08-17 | Estructura educativa | Representar cada tema mediante una constelación | Confirmado | Cada estrella de la constelación corresponderá a una actividad del tema. |
| 2026-08-17 | Tamaño de contenido | Usar aproximadamente seis actividades por constelación | Confirmado | La cantidad exacta podrá variar cuando lo requiera el tema matemático. |
| 2026-08-17 | Recuperación | Exigir la aprobación de todas las actividades | Confirmado | Cada actividad deberá alcanzar al menos dos estrellas para recuperar la constelación. |
| 2026-08-17 | Variación | Usar bancos de ejercicios y orden aleatorio | Confirmado | Los reintentos presentarán una combinación distinta para evitar respuestas memorizadas. |
| 2026-08-17 | Navegación | Permitir selección libre dentro de una constelación disponible | Confirmado | Las actividades del tema no tendrán un orden interno obligatorio. |
| 2026-08-17 | Dependencias | Exigir recuperar completamente la constelación previa | Confirmado | Los temas complementarios se desbloquearán al completar todos los requisitos anteriores. |
| 2026-08-17 | Intentos | Presentar cuatro o cinco ejercicios | Confirmado | Se seleccionarán desde un banco de mayor tamaño. |
| 2026-08-17 | Dificultad | Mantener variantes de dificultad similar | Confirmado | Los diferentes intentos deben producir resultados comparables. |
| 2026-08-17 | Porcentaje | Dividir puntuación obtenida entre puntuación posible | Confirmado | Permite incluir ejercicios con puntuación parcial. |
| 2026-08-17 | Entrega académica | Incluir variantes y respuestas correctas | Confirmado | Desarrollo recibirá bancos completos y criterios de corrección aprobados. |
| 2026-08-17 | Puntuación | Asignar el mismo valor a todos los ejercicios | Confirmado | Las actividades no ponderarán unos ejercicios más que otros. |
| 2026-08-17 | Puntuación parcial | Aplicar una regla uniforme a ejercicios compuestos | Confirmado | El equipo académico no definirá pesos particulares para cada parte. |
| 2026-08-17 | Presentación | Redondear y mostrar el porcentaje al finalizar | Confirmado | El alumno no verá el porcentaje durante la actividad. |
| 2026-08-17 | Retroalimentación | Evitar mensajes directos de respuesta incorrecta | Confirmado | Tojil dará apoyo y orientará al alumno hasta la solución correcta. |
| 2026-08-17 | Autonomía | Reducir puntuación según la ayuda utilizada | Confirmado | Sin ayuda otorga 100 % del valor, una ayuda 75 % y varias ayudas o solución mostrada 50 %. |
| 2026-08-17 | Ejercicios compuestos | Dividir el valor en partes iguales | Confirmado | La distribución se calculará automáticamente sin ponderaciones académicas manuales. |
| 2026-08-17 | Rotación | Agotar variantes antes de repetir ejercicios | Confirmado | La selección se controlará por alumno y actividad. |
| 2026-08-17 | Ayudas | Activar la primera ayuda después de tres intentos no acertados | Confirmado | A partir de ese momento la puntuación del ejercicio reflejará el apoyo recibido. |
| 2026-08-17 | Credenciales | Separar credenciales de reportes académicos | Confirmado | Usuarios y contraseñas se gestionarán mediante un reporte específico. |
| 2026-08-17 | Ayudas | Escalar la orientación hasta mostrar la solución | Confirmado | Primera ayuda tras tres intentos; un nuevo fallo activa la segunda y el siguiente muestra la respuesta correcta. |
| 2026-08-17 | Credenciales | Restringir su reporte al administrador general | Confirmado | El formato de exportación todavía no se ha definido. |
| 2026-08-17 | Compatibilidad | Establecer Android 8.0/API 26 como mínimo | Confirmado | Teléfonos y tabletas con versiones anteriores quedan fuera del soporte. |
| 2026-08-17 | Backend | Incluir el backend dentro del proyecto | Confirmado | Tecnología, almacenamiento e infraestructura todavía deben seleccionarse. |
| 2026-08-17 | API | Mantener internamente el contrato de integración | Confirmado | La implementación relacionada puede ser externa, pero desarrollo define el intercambio entre sistemas. |
| 2026-08-17 | Acceso | Permitir olvidar el usuario sugerido | Confirmado | Facilita limpiar la identificación en dispositivos compartidos. |
| 2026-08-17 | Responsabilidad | Asignar el desarrollo de Caza Estelar al equipo del proyecto | Confirmado | El equipo implementará y mantendrá directamente el juego. |
| 2026-08-17 | Ambientes | Separar desarrollo, pruebas y producción | Confirmado | QA validará cambios sin afectar los datos reales de las instituciones. |
| 2026-08-17 | Diagnóstico | Enviar reportes automáticos de fallos | Confirmado | La herramienta y las reglas de privacidad se elegirán posteriormente. |
| 2026-08-17 | Distribución | Ofrecer el juego gratuitamente en Google Play | Confirmado | No habrá inicialmente pago, licencia ni suscripción para descargarlo. |
| 2026-08-17 | Lanzamientos | Exigir aprobación de dirección del proyecto | Confirmado | Dirección autoriza oficialmente cada publicación. |
| 2026-08-17 | Arquitectura móvil | Orientar el desarrollo a Kotlin y Jetpack Compose | Confirmado | El prototipo Java/libGDX representa el estado actual; la estrategia de migración queda pendiente. |
| 2026-08-17 | Migración | Reescribir completamente el prototipo en Kotlin | Confirmado | El código Java actual servirá como referencia funcional, no como arquitectura definitiva. |
| 2026-08-17 | Motor interactivo | Evaluar libGDX frente a Compose/Canvas | Pendiente | La decisión debe considerar mecánicas, animación, rendimiento, mantenibilidad y pruebas. |
| 2026-08-17 | Backend | Mantener abierta la selección tecnológica | Pendiente | La decisión será independiente de Jetpack Compose y deberá ser compatible con AWS y la base compartida. |
| 2026-08-17 | Experiencia visual | Construir un juego 2D con animación abundante | Confirmado | Observatorio, constelaciones y actividades requieren elementos llamativos y movimiento simultáneo. |
| 2026-08-17 | Prioridades técnicas | Equilibrar velocidad de desarrollo y rendimiento | Confirmado | Ambos criterios guiarán la selección del motor interactivo. |
| 2026-08-17 | Evaluación | Elaborar una comparación Compose/libGDX frente a Compose/Canvas | Confirmado | La recomendación se documentará antes de iniciar la reescritura definitiva. |
| 2026-08-17 | Equipo | Mantener pendiente la experiencia tecnológica | Pendiente | La decisión arquitectónica no favorecerá una opción basándose en experiencia aún no confirmada. |
| 2026-08-17 | QA | Probar cada actividad antes de producción | Confirmado | La validación incluirá funcionamiento, resultados, interfaz e integración. |
| 2026-08-17 | Validación académica | Revisar el contenido ya implementado | Confirmado | El equipo académico verificará que la implementación preserve el contenido aprobado. |
| 2026-08-17 | Dispositivos | Probar en hardware físico y emuladores | Confirmado | Cada lanzamiento contará con una matriz mínima de teléfonos y tabletas. |
| 2026-08-17 | Control remoto | No incluir desactivación de versiones | Confirmado | Los incidentes deberán resolverse mediante actualización y canales de distribución. |
| 2026-08-17 | Aprobación | No mantener un registro formal de aprobaciones | Confirmado | Dirección seguirá autorizando la publicación, pero sin bitácora específica de versión, responsable y fecha. |
| 2026-08-17 | Criterio visual | No publicar con errores visuales conocidos | Confirmado | Incluso los defectos menores deberán corregirse antes de producción. |
| 2026-08-17 | Bloqueo de lanzamiento | Detener versiones con errores de datos o progreso | Confirmado | Resultados, porcentajes, cuentas y avance son áreas críticas. |
| 2026-08-17 | Idiomas | Validar español e inglés mediante QA | Confirmado | Cada actividad deberá probarse completamente en ambos idiomas. |
| 2026-08-17 | Interrupciones | Probar segundo plano, desconexión y cierres | Confirmado | Se verificará la conservación de estado, pausa y recuperación. |
| 2026-08-17 | Automatización | Probar reglas educativas y sincronización | Confirmado | Se cubrirán porcentajes, estrellas, desbloqueos y entrega de resultados. |
| 2026-08-17 | Rendimiento | Mantener un objetivo de 60 FPS | Confirmado | El criterio se aplicará a teléfonos y tabletas de la matriz mínima. |
| 2026-08-17 | Inicio | Mostrar el acceso en menos de 10 segundos | Confirmado | El tiempo se medirá en la matriz mínima bajo condiciones definidas posteriormente. |
| 2026-08-17 | Actividades | Abrir cada actividad en un máximo de 2 segundos | Confirmado | Los assets deberán estar disponibles o precargados para cumplir el objetivo. |
| 2026-08-17 | Tamaño | Limitar Google Play y APK a 500 MB | Confirmado | Los recursos adicionales podrán entregarse después de la instalación. |
| 2026-08-17 | Calidad automática | Reducir efectos cuando no se sostengan 60 FPS | Confirmado | La aplicación adaptará el nivel visual sin intervención del alumno. |
| 2026-08-17 | Ajustes | Eliminar la reducción manual de animaciones | Confirmado | Solo música y efectos conservarán controles y preferencias locales. |
| 2026-08-17 | Assets remotos | Permitir descargas posteriores | Confirmado | Las actividades permanecen ligadas a versiones; sus recursos pesados podrán descargarse aparte. |
| 2026-08-17 | Datos | Compartir la base de datos con la web/bitácora | Confirmado | Se necesitarán límites claros de acceso y propiedad de las tablas o esquemas. |
| 2026-08-17 | Infraestructura | Utilizar AWS como orientación inicial | Confirmado | Los servicios concretos se seleccionarán al diseñar el backend. |
| 2026-08-17 | Backend | Mantener un proyecto exclusivo para Caza Estelar | Confirmado | No prestará servicios directamente a los demás juegos de Explorax. |
| 2026-08-17 | API | Mantener pendiente el formato de intercambio | Pendiente | Todavía no se confirma JSON/HTTPS ni otro contrato técnico. |
| 2026-09-07 | Contrato | Migrar la app al contrato v2 (`constelación → nivel`) con capa de compatibilidad de lectura v1 | Confirmado | Alinea el código con el modelo aprobado antes de construir el backend. Ver `docs/DECISIONES_FASE_0.md`. |
| 2026-09-07 | Arquitectura móvil | Posponer la decisión de motor a un spike + ADR | Confirmado | Reemplaza la intención de reescritura total inmediata a Kotlin/Compose; se evita inversión prematura. |
| 2026-09-07 | Conectividad | Confirmar "solo online": retirar la cola de sincronización persistente y el juego sin conexión del código | Confirmado | El código conservaba una cola offline que contradecía el registro maestro; se elimina. El catálogo sigue empaquetado en la APK. |
| 2026-09-07 | Repositorios | Backend en el mismo repositorio que la app; consola web aparte | Confirmado | Simplifica el contrato compartido y el ciclo de release del juego. |
| 2026-09-07 | Progreso | Adoptar el modelo de progreso v2 (`levelId`, `score`, `attemptsUsed`, `durationMs`) | Confirmado | Coincide con lo que la bitácora necesita reportar; sin migración porque no hay usuarios. |
| 2026-09-07 | Narración | Mantener `narrationAssetId` opcional en el contrato v2 | Confirmado | Bajo costo dejar el campo por si el producto lo reincorpora. |
| 2026-09-07 | Entorno | Inicializar Git en la raíz, renombrar `Nueva carpeta` → `caza-estelar`, fijar Gradle Wrapper 8.9 y embeber el toolchain en `.build-tools/` | Confirmado | Fase 1 de la migración; build reproducible desde línea de comandos. Ver `docs/ENTORNO.md`. |

## 6. Comentarios adicionales del responsable

Esta sección incorporará las observaciones, requisitos y correcciones que se indiquen durante la elaboración.
