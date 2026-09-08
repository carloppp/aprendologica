# Migración del contexto de Caza Estelar a Claude Code

## Objetivo

Permitir que una sesión nueva de Claude Code comprenda el producto, encuentre la documentación correcta y trabaje con seguridad sin depender del historial de conversaciones que originó el prototipo.

La migración de contexto queda preparada mediante `CLAUDE.md` y `docs/INDICE_DOCUMENTACION.md`. Esto no migra conversaciones anteriores ni instala el toolchain: preserva el conocimiento durable en archivos versionables.

## Alcance inventariado

- Proyecto ejecutable: esta carpeta (`Nueva carpeta`).
- Plataforma: Android 8.0+ (API 26), horizontal.
- Stack actual: Gradle, AGP 8.7.3, Java 17, Kotlin 2.0.21, libGDX 1.14.2.
- Módulos: `core`, `android`, `assets`.
- Estado funcional: navegación, dos mecánicas, progreso local, caché de catálogo/medios, clientes remotos desactivados, recuperación y diagnósticos sanitizados.
- Estado objetivo: contrato v2 `constelación/tema → estrella/nivel`, consola académica externa, backend, publicación inmutable y eventual reescritura móvil en Kotlin.

## Preparación técnica

Fase 1 ejecutada el 7 de septiembre de 2026 (ver `ENTORNO.md`):

1. ~~Crear repositorio Git~~ — **hecho**: `git init` en la raíz `Caza Estelar/`, rama `main`.
2. ~~Añadir Gradle Wrapper compatible con AGP 8.7.3~~ — **hecho**: Wrapper fijado a Gradle 8.9.
3. ~~Instalar JDK 17, Android SDK 35 y ADB~~ — **hecho**: toolchain embebido en `.build-tools/`
   (JDK Temurin 17.0.20, SDK `android-35` + build-tools `35.0.0`, `adb`).
4. ~~Renombrar `Nueva carpeta`~~ — **hecho**: la carpeta ejecutable es `caza-estelar/`.
5. ~~Crear `.gitignore`~~ — **hecho** en la raíz.
6. Línea base limpia (`:core:test`, `:android:assembleDebug`, `:android:verifyProductionConfiguration`)
   — en ejecución / a confirmar en esta sesión.
7. ~~Decidir dónde viven documentos y APK grandes~~ — **hecho**: un solo repo en la raíz;
   `.gitignore` excluye APK/AAB, `.docx` generados, snapshots de QA y `.build-tools/`.

## Instalación y arranque de Claude Code

Seguir la guía oficial vigente de Anthropic. En Windows, Claude Code admite WSL o Git Bash. Abrir una terminal en la raíz real del proyecto y ejecutar `claude`; `CLAUDE.md` se carga como memoria compartida del proyecto.

Después del arranque:

1. Ejecutar `/memory` y confirmar que se cargó `CLAUDE.md`.
2. Pedir: “Resume el estado implementado, el estado objetivo y las contradicciones abiertas sin modificar archivos”.
3. Pedir un inventario de cambios con `git status` antes de cada tarea.
4. Ejecutar primero una tarea pequeña y verificable (por ejemplo, normalizar el Wrapper y correr pruebas), antes de iniciar la migración v2 o una reescritura completa.

No habilitar `--dangerously-skip-permissions` como configuración habitual. Conceder permisos mínimos y revisar cualquier comando que publique, firme, borre o transmita datos.

## Contradicciones y decisiones abiertas

> **Estado (2026-09-07): cerradas en `DECISIONES_FASE_0.md`.** La tabla se conserva como
> historial. La columna "Decisión tomada" refleja lo acordado con el responsable.

| Tema | Evidencia existente | Riesgo | Decisión tomada |
|---|---|---|---|
| Contrato de contenido | Código y catálogo usan v1; integración aprobada apunta a v2 | Construir backend sobre un contrato descartado | **v2 con capa de compatibilidad v1** en el parser |
| Arquitectura móvil | Prototipo libGDX Java/Kotlin; registro maestro pide reescritura Kotlin/Compose y deja motor pendiente | Doble inversión o reescritura prematura | **Pendiente de spike + ADR**; sin reescritura total aprobada; sigue en libGDX |
| Conectividad | El registro maestro dice conexión permanente; código y propuesta posterior preservan caché y cola offline | Requisitos, UX y backend incompatibles | **Solo online**: sin cola persistente ni juego offline; catálogo empaquetado en la APK |
| Ubicación del backend | Unas notas dicen externo/no existente; el registro dice incluirlo en el proyecto | Estructura de repositorios confusa | **Backend en el mismo repo que la app**; consola web en repo aparte |
| Modelo de progreso | v1 usa misión/estrellas; v2 propone nivel, score, intentos y duración | Pérdida o mala migración del progreso | **Campos v2** (`levelId`, `score`, `attemptsUsed`, `durationMs`); sin migración (no hay usuarios) |
| Narración/audio | Producto indica que no habrá narración; v1 admite `narrationAssetId` | Implementación innecesaria o contenido inconsistente | **Mantener `narrationAssetId` opcional** en v2 |
| Release actual | Hay APK históricos, pero no VCS/Wrapper/toolchain CLI verificable | Confundir artefacto viejo con build reproducible | **Fase 1 completada**: Git + Wrapper 8.9 + toolchain embebido en `.build-tools/` (ver `ENTORNO.md`) |

Claude no debe reabrir estas decisiones de forma silenciosa. Si una tarea exige cambiarlas,
exponer la necesidad al responsable antes de un cambio irreversible.

## Orden recomendado de migración del proyecto

### Etapa A — Reproducibilidad

- Git, `.gitignore`, Gradle Wrapper y README de entorno.
- Baseline de tests y build debug.
- Registro de hashes/versiones de artefactos que se decida conservar.

### Etapa B — Alineación del dominio

- JSON Schema v2 y fixtures canónicos.
- `ThemeDefinition` fuera del modelo objetivo.
- `MissionDefinition` → `LevelDefinition`.
- `missionId/version` → `levelId/version` con migración explícita.
- Navegación `ConstellationMapScreen → niveles → mecánica`.
- Tests de parser, validación, desbloqueos y migración de progreso.

### Etapa C — Decisión del cliente definitivo

- Spike comparable para animaciones, canvas, input, assets, accesibilidad, rendimiento y testabilidad.
- ADR que cierre Compose/Canvas frente a libGDX/híbrido.
- Plan incremental si se evita un reemplazo total de una sola vez.

### Etapa D — Backend y consola

- Definir límites de repositorios y propiedad de datos.
- Backend de autoría con roles, borradores, revisión, auditoría y publicación.
- Consola TypeScript conectada a esquemas de mecánicas; sin JSON o código arbitrario.
- Almacenamiento de objetos/CDN con uploads firmados, validación MIME/tamaño/hash y URLs versionadas.

### Etapa E — Integración y producción

- Entornos desarrollo, pruebas y producción.
- Catálogo con ETag, autenticación y sincronización idempotente.
- Privacidad de menores, retención, eliminación y permisos institucionales validados.
- Matriz de dispositivos, rendimiento, recuperación, español/inglés y flujo offline/online.
- Firma, Play Store/APK institucional, observabilidad sanitizada y procedimiento de rollback.

## Checklist para cada sesión de Claude Code

- Confirmar la carpeta y revisar `git status`.
- Leer el documento de autoridad específico para la tarea.
- Distinguir “implementado”, “propuesto”, “pendiente” y “reemplazado”.
- Mantener cambios pequeños y revisables.
- Ejecutar pruebas proporcionales al riesgo y reportar impedimentos reales.
- No editar binarios generados sin actualizar su fuente.
- No activar producción ni introducir secretos.
- Actualizar documentación y decisiones cuando cambie el contrato.

## Criterio de migración completa

La transición a Claude Code estará operativamente completa cuando el proyecto tenga repositorio Git, Wrapper, build reproducible, pruebas verdes, `CLAUDE.md` validado con `/memory`, documentación sin contradicciones no clasificadas y una decisión registrada sobre contrato v2 y arquitectura móvil definitiva.

