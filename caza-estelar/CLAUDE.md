# Aprendo Lógica (antes Caza Estelar) — contexto para Claude Code

## Antes de modificar código

- Lee `docs/INDICE_DOCUMENTACION.md` y `docs/MIGRACION_A_CLAUDE_CODE.md`.
- Para la migración vigente a PWA y las decisiones visuales nuevas, lee `docs/PWA_MIGRATION.md`.
- Para alcance de producto y decisiones confirmadas, consulta `DOCUMENTACION_PROYECTO.md`.
- Para la integración futura, toma `INTEGRACION_ADMIN_JUEGO.md` como objetivo y `CONTENT_SCHEMA_V1.md` como legado implementado.
- No presentes una propuesta como si ya estuviera implementada. Contrasta siempre la documentación con el código y los assets.
- No actives servicios remotos ni generes una release sin endpoints HTTPS reales y autorización expresa.
- No introduzcas secretos, tokens, contraseñas, keystores ni datos de menores en el repositorio, assets, logs o respuestas.

## Resumen del producto

Aprendo Lógica (nombre anterior: Caza Estelar) es un juego educativo horizontal para niños de 6 a 8 años de Guatemala y Estados Unidos. Su prioridad es reforzar matemáticas mediante constelaciones, estrellas/niveles y actividades interactivas. El destino principal se está migrando a una PWA instalable; Android se conserva durante la transición. La nueva dirección visual usa a Stella y Luma. El producto debe funcionar en español e inglés y está orientado principalmente a instituciones educativas.

## Dirección vigente del producto (2026-10-05)

- **Marca:** el producto se llama **Aprendo Lógica** en español e inglés (no se traduce); "Caza Estelar" ya no aparece en la interfaz. Logo, paleta (celeste `#8CCDFD`, amarillo `#FEDD76`, lila `#E1A0F1`, azul marino `#072556`) y alcance del renombrado en `docs/PWA_MIGRATION.md`. Los identificadores técnicos (`com.explorax.cazaestelar`, `CazaEstelarGame`, carpeta `caza-estelar/`) se conservan por ahora.
- **Plataforma:** PWA horizontal, táctil y adaptable a teléfono, tableta y escritorio. Mantener Android hasta comprobar paridad funcional.
- **Protagonistas:** Stella y Luma reemplazan al reparto anterior en las escenas nuevas. Stella es una estrella dorada femenina, con pestañas y emblema blanco de cuatro puntas en la frente; viste vestido lavanda sencillo. Luma es un niño luna llena blanco/perlado, con cráteres suaves y emblema creciente cian; viste camisa azul marino y pantalón azul.
- **Estilo:** 2.5D simplificado, formas grandes, pocos detalles, fondos celestes oscuros, preparado para animación. No convertir las guías en composiciones sobrecargadas.
- **Tema actual:** `LÓGICA Y CONJUNTOS`.
- **Selector general:** seis estrellas grandes e independientes: `CONJUNTOS`, `CLASIFICACIÓN`, `RELACIONES`, `PATRONES`, `SECUENCIAS` y `RAZONAMIENTO`. No hay bloqueo secuencial; el usuario puede entrar a cualquiera.
- **Constelación interna:** al elegir un grupo aparecen seis estrellas pequeñas de un solo tono, el mismo de la estrella principal. Para `CONJUNTOS` (2026-10-15): `FORMAR CONJUNTOS`, `ELEMENTOS Y DIAGRAMAS`, `ENTRE LLAVES`, `DESCRIBE EL CONJUNTO`, `CLASES DE CONJUNTOS` y `UNIÓN E INTERSECCIÓN`. `CLASIFICACIÓN` (2026-10-15): `COLOR`, `FORMA`, `TAMAÑO`, `TIPO`, `DOS CARACTERÍSTICAS` y `DESCUBRE LA REGLA`, sobre las islas del kit `guia-visual-2d/assets/assets-y-fondos-clasificacion-v1.zip` (mecánicas `sort_*`). `RELACIONES` tiene por ahora `PERTENECE` y `SUBCONJUNTOS` (antes en `CONJUNTOS`). Para `PATRONES` (2026-10-15): `REPETIR`, `ALTERNAR`, `COMPLETAR`, `DETECTAR`, `DESCUBRIR LA UNIDAD` y `CREAR`, en zigzag abierto y jugados en el puente de las islas flotantes (mecánicas `pattern_*` en `docs/CONTENT_SCHEMA_V2.md`).
- **Progreso visual (actualizado 2026-10-13):** la luz de cada estrella depende de las estrellas obtenidas en su nivel: 0 apagada, 1 muy tenue sin conexiones, 2 más fuerte con conexión suave, 3 brillo completo con conexión fuerte. Una línea aparece cuando sus dos extremos tienen al menos 2 estrellas. Antes de abrir un nivel se muestra un panel con sus estrellas y la opción de jugar, repetir o dejarlo. Las etiquetas siguen legibles y cada nivel continúa siendo accesible directamente.
- **Guías visuales:** la vigente es `../guia-visual-2d/` (12 de octubre de 2026), que la app `app/` replica; las anteriores están en `../guia-visual/` y `../images/`. Son referencia de diseño, no assets de runtime: `app/scripts/prepare_visual_assets.py` genera los recortes optimizados en `app/public/assets/`.

## Cliente TypeScript — destino vigente (2026-10-05)

- **ADR 001** (`docs/ADR_001_MOTOR_TYPESCRIPT.md`): el cliente se reescribe en TypeScript en `app/`. Vite genera la PWA y Capacitor 8 genera el APK desde la misma base. Las pantallas nuevas se hacen ahí, no en libGDX.
- Estructura: `app/src/content/` (contrato v2 portado), `app/src/progress/`, `app/src/gameplay/`, `app/src/session/`, `app/src/screens/` (DOM sobre un escenario de 1920×1080), `app/public/content/catalog.json` (catálogo v2) y `app/android/` (proyecto Capacitor).
- Comandos en `docs/ENTORNO.md` §Cliente TypeScript: `npm test`, `npm run build`, `npm run android:sync` y luego `gradlew assembleDebug` con **JDK 21**.
- Mantener las reglas de abajo que aplican igual: bilingüe, validar el catálogo completo, sin PII ni secretos, HTTPS y una mezcla de progreso que nunca reduzca logros.
- Lo que sigue describe el proyecto libGDX, congelado como **referencia funcional** hasta la paridad. No borrarlo sin una solicitud explícita.

## Estado real del código libGDX (2026-09-07)

- Prototipo multiplataforma con libGDX 1.14.2, Java 17 y Kotlin 2.0.21.
- Módulos Gradle: `core`, `android` y `web`; AGP 8.7.3; compile/target SDK 35; min SDK 26; web usa gdx-teavm 1.6.1.
- El código de UI/pantallas permanece mayormente en Java; contratos, reglas, contenido, red y sincronización están mayormente en Kotlin.
- El catálogo empaquetado es `assets/content/catalog.json`, `schemaVersion: 1`, revisión 1.
- Mecánicas instaladas: `telescope_hunt` y `multiple_choice`.
- Autenticación, catálogo remoto y progreso remoto están implementados como abstracciones/clientes, pero desactivados.
- `assets/network/services.json` tiene `developmentMode: true`; `assets/content/source.json` tiene `remoteEnabled: false`.
- El backend, la consola académica, endpoints reales y credenciales de producción todavía no existen en esta carpeta.
- Hay 77 archivos de código principal (aprox. 3792 líneas) y 19 archivos de prueba (aprox. 612 líneas).
- Repositorio Git en la raíz `Caza Estelar/` (rama `main`) y Gradle Wrapper fijado a Gradle 8.9.
- Toolchain embebido en `Caza Estelar/.build-tools/` (JDK 17, Android SDK 35, `adb`). Ver `docs/ENTORNO.md`.
- Decisiones de la Fase 0 cerradas en `docs/DECISIONES_FASE_0.md`: migración **directa** a contrato v2 (sin compatibilidad v1), progreso v2, **solo online** (se retira la cola offline persistente), motor móvil pendiente de spike/ADR. **Repos:** este repo = app Android; la aplicación administrativa (backend NestJS + consola React + Prisma + infra) va en un repo aparte. **Stack admin fijado** por `Avance_solicitado_Caza_Estelar.docx`: React/TS, NestJS/Node, PostgreSQL/Prisma, Docker Compose, Nginx, VPS Ubuntu, dominio explorax.app (reemplaza "backend Kotlin" y "AWS" de docs anteriores).
- Contrato **v2 aprobado** (`docs/CONTENT_SCHEMA_V2.md`, `docs/contracts/catalog-v2.schema.json`). **Fase 2 en curso** (autorizada 2026-09-08) por incrementos revisables — ver `docs/PLAN_SEPTIEMBRE_2026.md`. El paquete `core/.../content/v2/` (modelos, `CatalogParserV2`, `LevelValidator`, `CatalogValidatorV2`) compila y tiene pruebas, pero **aún no se usa desde el juego**: pantallas/navegación/progreso siguen en v1 hasta los incrementos 2-5. El modelo v1 se elimina en el incremento 5.

## Arquitectura y rutas clave

- `core/src/main/java/com/explorax/cazaestelar/CazaEstelarGame.java`: composition root del juego.
- `core/src/main/java/com/explorax/cazaestelar/screens/`: pantallas libGDX.
- `core/src/main/java/com/explorax/cazaestelar/navigation/GameNavigator.java`: navegación.
- `core/src/main/kotlin/com/explorax/cazaestelar/content/`: catálogo, parser, caché, remoto y validación.
- `core/src/main/kotlin/com/explorax/cazaestelar/content/model/ContentModels.kt`: modelo v1 vigente.
- `core/src/main/kotlin/com/explorax/cazaestelar/progress/`: progreso, desbloqueos y mezcla.
- `core/src/main/kotlin/com/explorax/cazaestelar/progress/sync/`: cola offline y cliente de sincronización.
- `core/src/main/java/com/explorax/cazaestelar/session/` y `core/src/main/kotlin/com/explorax/cazaestelar/session/`: autenticación y selección de implementación.
- `core/src/main/kotlin/com/explorax/cazaestelar/media/`: descarga y caché de multimedia.
- `android/src/main/java/com/explorax/cazaestelar/`: launcher y almacenamiento de token con Android Keystore.
- `web/`: launcher TeaVM, configuración del build JavaScript y shell PWA.
- `web/src/main/pwa/`: manifiesto, service worker, estilos del contenedor e icono instalable.
- `assets/`: catálogo, configuración y recursos libGDX.
- `core/src/test/`: pruebas unitarias e integración del catálogo publicado.

Flujo actual: `LoadingScreen → LoginScreen → MainMenuScreen → ConstellationMapScreen → ThemeMapScreen → MissionListScreen → mecánica`.

## Comandos de trabajo

Desde `caza-estelar/`, apuntando al toolchain embebido (detalle y variante PowerShell en `docs/ENTORNO.md`):

```bash
export JAVA_HOME="$PWD/../.build-tools/jdk/jdk-17.0.20+8"
export ANDROID_HOME="$PWD/../.build-tools/android-sdk"
./gradlew :core:test
./gradlew :android:assembleDebug
./gradlew :web:assemblePwa
./gradlew :web:gdx_teavm_web_js_run
./gradlew :android:verifyProductionConfiguration
```

El paquete PWA queda en `web/build/dist/js/webapp/`. `assemblePwa` es el comando de distribución: añade manifiesto, registro del service worker y shell instalable después de generar JavaScript. El service worker requiere HTTPS en producción (localhost sirve para desarrollo).

`:android:verifyProductionConfiguration` falla a propósito mientras haya configuración de
desarrollo (`developmentMode: true`, `remoteEnabled: false`); es el bloqueo de release, no un
error del entorno.

No afirmar que una compilación o prueba pasó si el comando no pudo ejecutarse. Como alternativa,
abrir `caza-estelar/` en Android Studio.

## Reglas de implementación

- Mantener la resolución virtual 1920×1080, `FitViewport`, orientación horizontal y objetivos táctiles amplios.
- Mantener `core` portable: no introducir nuevas dependencias directas de `java.security`, `java.nio`, Android SDK o APIs del navegador. Encapsular diferencias por plataforma.
- Cuando cambie el shell web, ejecutar `:web:assemblePwa`; no editar archivos generados bajo `web/build/`.
- Mantener texto de interfaz y contenido en español e inglés; no fijar texto educativo en un solo idioma.
- Kotlin es la dirección elegida para reglas, contratos y servicios. Java/libGDX actual es referencia funcional durante la futura reescritura.
- Las mecánicas son código instalado; el administrador solo configura contenido y nunca entrega código ejecutable.
- Validar catálogos completos antes de activarlos. Rechazar esquemas desconocidos, revisiones no crecientes, referencias rotas, ciclos, mecánicas incompatibles y medios sin integridad.
- Conservar funcionamiento seguro ante fallos: último catálogo válido, progreso local primero, UUID idempotente, y mezcla que nunca reduzca logros.
- Todo tráfico remoto debe usar HTTPS. La release debe quedar bloqueada mientras haya configuración de desarrollo.
- Diagnósticos deben usar códigos predefinidos y nunca PII, credenciales, tokens, cuerpos HTTP ni mensajes de excepción sin sanitizar.
- Preservar la separación entre lógica comprobable y pantallas libGDX. Añadir o actualizar pruebas al cambiar reglas, parser, progreso, seguridad o contratos.

## Prioridad de fuentes cuando hay contradicciones

1. Decisiones confirmadas más recientes y solicitud actual del responsable.
2. `docs/DECISIONES_FASE_0.md` y `Avance_solicitado_Caza_Estelar.docx` ("Versión final planeada") para decisiones de producto, stack y estructura de repos.
3. `INTEGRACION_ADMIN_JUEGO.md` para el modelo de contenido objetivo v2 (pero su §17 "backend Kotlin" y su §14 "cola offline" están superados por la decisión 8 y la 3).
4. Código y tests para describir el comportamiento implementado hoy.
5. `ARQUITECTURA.md`, `REMOTE_API_CONTRACT.md` y `CONTENT_SCHEMA_V1.md` para el estado v1.
6. `README.md` y APK históricos solo como referencia; pueden estar desactualizados.

No resolver silenciosamente las contradicciones registradas en `docs/MIGRACION_A_CLAUDE_CODE.md`. Si una tarea depende de ellas, expón la decisión necesaria antes de realizar una migración irreversible.

## Definición mínima de terminado

- Cambio acotado y coherente con las decisiones vigentes.
- Pruebas relevantes añadidas/actualizadas y ejecutadas cuando el entorno lo permita.
- Catálogo incluido validado si cambió contenido, modelos o mecánicas.
- Español e inglés revisados si cambió UI o contenido.
- Sin secretos ni PII; configuración release segura.
- Documentación actualizada cuando cambien arquitectura, contrato, comandos o una decisión cerrada.
