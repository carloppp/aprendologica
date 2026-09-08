# Decisiones técnicas vigentes

- Nombre del proyecto: **Caza Estelar**.
- Lenguajes: Kotlin para contratos, servicios y reglas; Java para las pantallas libGDX existentes durante la migración.
- Base provisional: libGDX 1.14.2 con Android Studio.
- Plataforma inicial: Android, exclusivamente horizontal.
- Resolución virtual de diseño: 1920 × 1080 con adaptación proporcional.
- Compatibilidad mínima propuesta: Android 8.0 (API 26).
- Identificador provisional: `com.explorax.cazaestelar`.
- Audio, música y voces pueden ser provisionales.

## Decisiones de la Fase 0 (2026-09-07 — ver `docs/DECISIONES_FASE_0.md`)

- **Contrato de contenido:** migrar a v2 (`constelación → estrella/nivel`) con capa de
  compatibilidad de lectura para catálogos v1.
- **Motor / arquitectura móvil:** sin decidir. Spike comparativo + ADR antes de fijar libGDX,
  Compose/Canvas o híbrido. No hay reescritura total aprobada.
- **Conectividad:** solo online. Se retira la cola de sincronización persistente y el juego sin
  conexión; el catálogo sigue empaquetado en la APK.
- **Repositorios:** el backend vive en este mismo repositorio; la consola web, en repo aparte.
- **Modelo de progreso:** campos v2 (`levelId`, `levelVersion`, `completed`, `score`,
  `attemptsUsed`, `durationMs`). Sin migración de datos porque no hay usuarios reales.
- **Narración:** `narrationAssetId` se mantiene opcional en el contrato.

Mientras no exista el backend se utiliza un inicio de sesión demostrativo. Al habilitarlo, la
app usará autenticación HTTPS y token cifrado con Android Keystore. Las contraseñas no se
conservan.

## Entorno

Toolchain embebido en `.build-tools/` (JDK 17, Android SDK 35, `adb`) y Gradle Wrapper 8.9.
Se compila desde la línea de comandos o abriendo `caza-estelar/` en Android Studio. Ver
`docs/ENTORNO.md`.
