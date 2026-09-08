# Caza Estelar — contexto para Claude Code

## Antes de modificar código

- Lee `docs/INDICE_DOCUMENTACION.md` y `docs/MIGRACION_A_CLAUDE_CODE.md`.
- Para alcance de producto y decisiones confirmadas, consulta `DOCUMENTACION_PROYECTO.md`.
- Para la integración futura, toma `INTEGRACION_ADMIN_JUEGO.md` como objetivo y `CONTENT_SCHEMA_V1.md` como legado implementado.
- No presentes una propuesta como si ya estuviera implementada. Contrasta siempre la documentación con el código y los assets.
- No actives servicios remotos ni generes una release sin endpoints HTTPS reales y autorización expresa.
- No introduzcas secretos, tokens, contraseñas, keystores ni datos de menores en el repositorio, assets, logs o respuestas.

## Resumen del producto

Caza Estelar es un juego educativo Android horizontal para niños de 6 a 8 años de Guatemala y Estados Unidos. Su prioridad es reforzar matemáticas mediante constelaciones, estrellas/niveles y actividades interactivas. Tojil guía la narrativa. El producto debe funcionar en español e inglés y está orientado principalmente a instituciones educativas.

## Estado real del código (2026-09-07)

- Prototipo Android con libGDX 1.14.2, Java 17 y Kotlin 2.0.21.
- Módulos Gradle: `core` y `android`; AGP 8.7.3; compile/target SDK 35; min SDK 26.
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
- Septiembre = planteamiento, no implementación: `docs/PLAN_SEPTIEMBRE_2026.md`. Entregables del mes: `docs/CONTENT_SCHEMA_V2.md`, `docs/contracts/catalog-v2.schema.json`, modelos Kotlin v2 aislados en `core/.../content/v2/` (compilan, con pruebas, sin conectar) y `Avance_Septiembre_Caza_Estelar.docx`. La implementación (Fase 2 en adelante) queda fuera del alcance de septiembre; su calendario no está planteado todavía.

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
./gradlew :android:verifyProductionConfiguration
```

`:android:verifyProductionConfiguration` falla a propósito mientras haya configuración de
desarrollo (`developmentMode: true`, `remoteEnabled: false`); es el bloqueo de release, no un
error del entorno.

No afirmar que una compilación o prueba pasó si el comando no pudo ejecutarse. Como alternativa,
abrir `caza-estelar/` en Android Studio.

## Reglas de implementación

- Mantener la resolución virtual 1920×1080, `FitViewport`, orientación horizontal y objetivos táctiles amplios.
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

