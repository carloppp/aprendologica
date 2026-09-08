# Arquitectura inicial

> **Actualización de dominio:** la integración futura con la consola académica
> utilizará `constelación/tema → estrella/nivel`. Las secciones que describen
> `ConstellationDefinition → ThemeDefinition → MissionDefinition` documentan el
> estado v1 del código y requieren la migración definida en
> `INTEGRACION_ADMIN_JUEGO.md`.
>
> **Decisión Fase 0 (2026-09-07):** el producto es **solo online**. La "cola offline
> de progreso" y la "selección desde caché offline" descritas en las fases 5 y 7 de
> este documento se **retiran** en la Fase 2 (ver `docs/DECISIONES_FASE_0.md` y
> `docs/PLAN_DESARROLLO.md`). El catálogo sigue empaquetado en la APK; el envío de
> resultados reintenta solo dentro de la sesión activa.

## Módulos

- `core`: navegación, pantallas, reglas y servicios independientes de Android.
- `android`: arranque, manifiesto, orientación horizontal y modo inmersivo.
- `assets`: recursos cargados por libGDX.

## Flujo implementado

`LoadingScreen` → `LoginScreen` → `MainMenuScreen` → catálogo → misión configurable

`LoadingScreen` funciona únicamente durante el arranque en frío: presenta el logo de Explorax mientras carga los recursos y se desvanece antes del acceso. El tema Android usa la misma imagen como `windowBackground` para mantener continuidad desde el lanzamiento nativo.

El menú permite volver al acceso. La sesión conserva en memoria el usuario escrito o usa `Explorador` cuando el campo queda vacío. `Comenzar aventura` abre una misión introductoria donde el jugador orienta una mira de telescopio y captura tres estrellas.

## Preparación para servicios futuros

La interfaz `AuthenticationService` separa la pantalla del mecanismo de acceso y permite cambiar
entre la implementación local explícita y la implementación remota sin reescribir las pantallas.

Esta decisión inicial fue sustituida durante la migración: ahora existen abstracciones para contenido, progreso, autenticación, caché y sincronización. Sus implementaciones remotas permanecen desactivadas hasta disponer del backend externo.

## Convenciones de pantalla

- Mundo virtual: 1920 × 1080.
- `FitViewport`: conserva la proporción y evita deformaciones.
- Orientación: horizontal bloqueada desde Android.
- Objetivos táctiles amplios y formularios centrados.

## Sistema visual actual

- `UiResources` genera tres tamaños de Nunito mediante FreeType, con filtrado lineal, borde y sombra suaves.
- `ScreenDecor` compone el fondo, una capa de contraste y estrellas animadas reutilizables.
- `StarFieldActor` produce destellos deterministas sin depender de sprites adicionales.
- `ShootingStarFieldActor` genera una lluvia diagonal de estrellas con colas cian, doradas y violetas; limita los elementos activos y reutiliza una textura de un píxel para cuidar el rendimiento.
- `AnimatedBackgroundActor` mantiene cada escena con un desplazamiento ambiental sutil.
- Los fondos de producción están normalizados a 1920 × 1080 y se cargan con `TextureFilter.Linear` para evitar ampliación con píxeles visibles.
- Los paneles y botones son PNG de alta resolución con transparencia y esquinas antialias, manteniendo el texto independiente para adaptarse a distintos dispositivos.
- La pantalla de acceso usa la escena exterior de constelaciones en un encuadre estable y muestra el formulario a la derecha.
- `StarTravelActor` espera a que desaparezca el formulario, amplía hacia la zona de estrellas, mantiene el fondo aprobado `#040820` durante el túnel y hace entrar la imagen completa del observatorio desde la distancia.
- El menú conserva el observatorio completo, con sus controles a la derecha y sin capas de estrellas animadas.
- Inicio y menú muestran ilustraciones Full HD ya compuestas. `CinematicSceneEffectsActor` agrega halos radiales de iluminación sin cruces ni partículas; `AnimatedBackgroundActor` mantiene el movimiento cinematográfico.
- `AppSettings` conserva idioma y sonido; `SettingsPanel` ofrece el control plegable común para acceso, menú y actividades.
- `UiResources` genera Fredoka mediante FreeType para reforzar la ambientación infantil.

Los campos de usuario y contraseña delegan la validación en `AuthenticationService`. Las
credenciales nunca se guardan en el dispositivo.

## Contenido configurable: fase 1

La primera integración de contenido utiliza Kotlin junto al código Java existente. `ContentService` desacopla el juego de la procedencia del catálogo y `LocalContentService` carga temporalmente `assets/content/catalog.json`.

El catálogo conserva la jerarquía `ConstellationDefinition` → `ThemeDefinition` → `MissionDefinition`. Cada misión declara un tipo de mecánica y su configuración; `MechanicRegistry` limita los tipos instalados y `MissionValidator` rechaza contenido incompatible antes de abrir una pantalla.

La mecánica `telescope_hunt` recibe del catálogo la cantidad de objetivos, el radio de captura, el título y las instrucciones. La futura implementación remota de `ContentService` podrá descargar el mismo contrato desde el backend sin modificar las mecánicas.

## Navegación por catálogo: fase 2

`MainMenuScreen` abre ahora `ConstellationMapScreen` en lugar de ejecutar directamente la primera misión. El recorrido continúa por `ThemeMapScreen` y `MissionListScreen`; las listas usan desplazamiento vertical para admitir contenido agregado desde el administrador sin fijar una cantidad de elementos en la interfaz.

Las misiones se contrastan con `MechanicRegistry` y `MissionValidator`. Una misión válida abre su implementación instalada, mientras que una misión que requiere una mecánica futura aparece deshabilitada y no puede provocar un fallo de navegación. Al salir de una actividad, el jugador regresa al tema que contiene esa misión.

## Primera mecánica académica: fase 3

`multiple_choice` es la primera mecánica académica reutilizable. Su configuración tipada contiene pregunta, opciones bilingües, una respuesta correcta, cantidad de intentos y retroalimentación de éxito o reintento. `MultipleChoiceSession` mantiene las reglas y la puntuación separadas de `MultipleChoiceScreen`, lo que permite probarlas sin iniciar libGDX.

Las configuraciones dejaron de ser un mapa de cadenas: `TelescopeHuntConfig` y `MultipleChoiceConfig` implementan `MechanicConfig`. Esto impide que una pantalla reciba accidentalmente la estructura de otra mecánica y establece el patrón que deberá seguir cada mecánica nueva.

El contrato que debe compartir la futura consola académica se documenta en `CONTENT_SCHEMA_V1.md`.

## Progreso y desbloqueos locales: fase 4

`ProgressRepository` separa las pantallas del almacenamiento del progreso. La implementación actual, `GdxPreferencesProgressRepository`, conserva datos locales por `playerId` y misión; una implementación remota futura podrá sincronizar el mismo modelo sin reescribir las mecánicas.

Cada resultado almacena la última versión jugada, mejor cantidad de estrellas, partidas terminadas, finalizaciones exitosas y estado completado. Repetir una misión nunca reduce el mejor resultado anterior.

Las misiones pueden declarar `unlock.prerequisiteMissionIds`. `CatalogValidator` comprueba identificadores inexistentes, duplicados y ciclos, mientras que `MissionUnlockPolicy` habilita una misión cuando todas sus dependencias están completadas. El listado muestra los estados disponible, bloqueada y completada con su mejor puntuación.

## Sincronización segura de contenido: fase 5

`CatalogParser` separa la interpretación del JSON de su procedencia. `SyncingContentService` selecciona al arrancar la revisión válida más reciente entre el catálogo incluido en la APK y `PreferencesCatalogCache`.

Cuando la fuente remota está habilitada, `GdxHttpCatalogRemoteSource` solicita el catálogo exclusivamente mediante HTTPS. La respuesta tiene un límite de 1 MiB y solo reemplaza el contenido activo si incrementa `revision`, conserva el esquema soportado y supera las validaciones de catálogo y mecánicas instaladas. La copia aceptada incluye una suma SHA-256 para detectar corrupción local.

Una falla de red, respuesta inválida o revisión antigua no impide jugar: la app continúa con la última copia válida. `assets/content/source.json` mantiene desactivada la conexión hasta que exista el endpoint del backend externo.

## Recursos multimedia remotos: fase 6

El catálogo puede declarar imágenes y audio mediante `ContentAssetDefinition`, con identificador estable, tipo, MIME, URL HTTPS, tamaño exacto y SHA-256. Las misiones los referencian mediante `MissionMedia` sin incluir archivos binarios dentro del JSON.

`RemoteMediaManager` precarga recursos obligatorios, descarga bajo demanda los opcionales y agrupa solicitudes concurrentes del mismo archivo. `GdxLocalMediaCache` verifica tamaño y hash antes de reutilizar un recurso, elimina archivos corruptos y depura versiones que ya no aparecen en el catálogo vigente.

`MultipleChoiceScreen` admite imagen de pregunta, narración y fondo remoto. Si algún recurso no está disponible o no puede decodificarse, mantiene la interfaz textual y no bloquea la misión.

## Autenticación y progreso remoto: fase 7

`AuthenticationService` es ahora asíncrono. En modo remoto, `GdxHttpAuthenticationService` intercambia credenciales únicamente mediante HTTPS y guarda un token de corta duración; Android utiliza `AndroidKeystoreAuthTokenStore` para cifrarlo con AES-GCM. Una sesión vigente puede restaurarse después de reiniciar la app y cerrar sesión elimina el token.

`SyncingProgressRepository` conserva primero cada resultado en el dispositivo y agrega un `ProgressSyncEvent` con UUID a una cola persistente. Con sesión válida, envía lotes de hasta 100 eventos a `GdxHttpProgressSyncClient`. El servidor confirma identificadores idempotentes y devuelve el progreso canónico; `ProgressMergePolicy` concilia ambos estados sin reducir logros.

Los servicios remotos permanecen desactivados en `assets/network/services.json`. El acceso local
solo se habilita porque el archivo declara explícitamente `developmentMode: true`; los eventos
permanecen disponibles para sincronización futura. El contrato esperado del backend se documenta
en `REMOTE_API_CONTRACT.md`.

## Endurecimiento y validación integral: fase 8

El acceso local dejó de ser un fallback implícito. `LocalDevelopmentAuthenticationService` solo
se selecciona cuando `developmentMode` está activado expresamente; si una configuración de
producción carece de autenticación HTTPS, `UnavailableAuthenticationService` falla de manera
segura sin crear una sesión ficticia.

La navegación construye las pantallas dentro de una frontera de recuperación. Un error no
controlado durante la interacción abre `RecoveryScreen`, que conserva los datos locales y permite
volver al acceso sin mostrar detalles técnicos. `AppDiagnostics` registra únicamente códigos de
evento predeterminados: nunca recibe correos, contraseñas, tokens, cuerpos HTTP ni mensajes de
excepciones.

`PublishedCatalogIntegrationTest` abre el catálogo incluido en la APK y verifica conjuntamente
su estructura, progresión y compatibilidad con todas las mecánicas instaladas.
`NetworkConfigurationPolicyTest` cubre la separación entre desarrollo y producción. Antes de
una compilación release, `:android:verifyProductionConfiguration` exige desactivar el modo de
desarrollo y configurar por HTTPS el catálogo, la autenticación y la sincronización de progreso.

Con esta fase termina la migración interna de ocho etapas. La consola académica continúa siendo
una web externa: la app únicamente consume y representa el catálogo que dicha consola publique.
