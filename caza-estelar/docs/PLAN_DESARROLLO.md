# Plan de desarrollo — Caza Estelar

Actualizado: 7 de septiembre de 2026.
Base: decisiones cerradas en `DECISIONES_FASE_0.md`.

## Principio rector

No emprender reescrituras grandes hasta tener: build reproducible (Fase 1), contrato v2 en la
app (Fase 2) y una decisión de motor registrada en un ADR (Fase 3). Cada fase entrega algo
verificable y deja el proyecto en un estado coherente.

## Estado de fases

| Fase | Objetivo | Estado |
|---|---|---|
| 0 | Cerrar decisiones de producto | **Completada** |
| 1 | Reproducibilidad (Git, Wrapper, toolchain, línea base) | **Completada** |
| 2 | Contrato v2 local en la app | **En curso** — planificada para septiembre (`PLAN_SEPTIEMBRE_2026.md`) |
| 3 | Decisión de motor (spike + ADR) | Pendiente |
| 4 | Backend de autoría + publicación | Pendiente |
| 5 | Consola web conectada | Pendiente |
| 6 | Integración app ↔ backend | Pendiente |
| 7 | Producción | Pendiente |

## Fase 2 — Contrato v2 local en la app

Sin backend. Alinea el código con la jerarquía definitiva `constelación → estrella/nivel`.

- Modelos Kotlin v2 en `content/model/`: `LevelDefinition` (reemplaza `MissionDefinition`),
  `ConstellationDefinition.levels`, `completion` + `reward` (reemplazan `rewards.maximumStars`),
  `unlock.prerequisiteLevelIds`. `narrationAssetId` se mantiene opcional.
- `CatalogParser`: leer `schemaVersion: 2` de forma nativa. **Sin capa de compatibilidad v1**
  (decisión actualizada el 7 de septiembre): el contenido de ejemplo actual se aplana a mano
  una sola vez.
- `CatalogValidator` + `MissionValidator` → `LevelValidator`: prerrequisitos por `levelId`,
  ciclos, mecánica registrada, config tipada, al menos un nivel por constelación.
- Progreso: `MissionProgress` → progreso por `levelId`/`levelVersion` con `score`,
  `attemptsUsed`, `durationMs`, `completed`; historial de intentos conservado.
  `ProgressCalculator`, `ProgressMergePolicy` y el evento de `/progress/sync` a campos v2.
- **Retirar la conectividad offline** (decisión 3): eliminar `PreferencesProgressSyncQueue` y la
  cola de `SyncingProgressRepository`; el envío de resultados reintenta solo en la sesión.
  Revisar `SyncingContentService` para que el catálogo se resuelva desde la APK (+ remoto
  cuando exista), sin rama de caché offline persistente.
- Navegación: `LevelListScreen` **mínima** en libGDX (reemplaza `ThemeMapScreen` y
  `MissionListScreen`); flujo `ConstellationMapScreen → LevelListScreen → mecánica`. Se
  rehará tras el ADR de motor.
- `catalog.json` incluido reescrito a v2; actualizar fixtures y `PublishedCatalogIntegrationTest`.
- Nuevo `CONTENT_SCHEMA_V2.md`; marcar `CONTENT_SCHEMA_V1.md` como reemplazado; ajustar
  `ARQUITECTURA.md`, `INTEGRACION_ADMIN_JUEGO.md` (sección 14) y `REMOTE_API_CONTRACT.md`.

**Criterio de salida:** `:core:test` y `:android:assembleDebug` verdes con el nuevo modelo;
la app demuestra constelación → nivel con datos locales; sin código de cola/caché offline.
Ver el desglose semanal en `PLAN_SEPTIEMBRE_2026.md`.

## Fase 3 — Decisión de motor (ADR)

- Spike acotado (1–2 semanas): misma escena "observatorio + una mecánica de arrastre" en
  libGDX y en Compose/Canvas. Medir en 2 dispositivos gama baja: FPS sostenidos, esfuerzo de
  implementación, testabilidad, tamaño.
- `docs/adr/0001-motor-cliente.md` que cierra: libGDX / Compose+Canvas / híbrido, y si hay
  reescritura incremental.

**Criterio de salida:** ADR aprobado por el responsable.

## Estructura de repositorios (decisión 4, actualizada)

- **Repo A — `caza-estelar/`:** app Android (Kotlin/Java/libGDX). Este repositorio.
- **Repo B — aplicación administrativa:** backend NestJS + consola React + Prisma + `docker-compose`,
  juntos, desplegables en el VPS. Se crea en septiembre (esqueleto).
- El contrato de contenido (JSON Schema v2 + fixtures) se comparte entre ambos como paquete
  versionado.

## Fase 4 — Backend de autoría + publicación (Repo B)

Stack fijado por `Avance_solicitado_Caza_Estelar.docx` §2 (ver decisión 8 en
`DECISIONES_FASE_0.md`): **Node.js + NestJS**, **PostgreSQL + Prisma**, **Docker Compose**,
**Nginx + Let's Encrypt**, **JWT + Argon2**, **GitHub Actions**, despliegue en **VPS Ubuntu**,
dominio **explorax.app**, ~20 000 usuarios registrados. Almacenamiento de archivos en volumen
protegido (migrable a almacenamiento de objetos más adelante).

- API de autoría `/admin/v1`: usuarios y roles (alumno, docente, director, admin institucional,
  autor de contenido, revisor académico, admin general), CRUD de constelaciones y actividades,
  catálogo de mecánicas con `configSchema`/`uiSchema`, borradores, archivado, auditoría inmutable.
- Flujo `Borrador → En revisión → Aprobado → Publicado → Archivado`.
- Compilador de catálogo v2 inmutable; API de distribución `/game/v1/catalog` con ETag; entrega
  de multimedia con verificación MIME/tamaño/hash.
- Esquema Prisma a partir de la lista de tablas del `Avance solicitado` §2.5.
- Reportes PDF/Excel con PDFKit y ExcelJS.

## Fase 5 — Consola web (Repo B, junto al backend)

- React + TypeScript + Vite. Se toma `prototipo-admin-console.html` como referencia de UX.
- Conectada a `/admin/v1`; formularios generados desde `uiSchema`; sin JSON ni código arbitrario;
  previsualización de nivel.

## Fase 6 — Integración app ↔ backend

- Activar `catalogUrl` y endpoints de auth/progreso en entorno de **pruebas**.
- Validar: descarga de revisión nueva, rechazo de catálogo inválido sin perder el anterior,
  versión mínima de app, sincronización idempotente, expulsión al bloquear la cuenta.

## Fase 7 — Producción

- Ambientes dev/test/prod, firma con keystore de producción, observabilidad sanitizada.
- Matriz mínima de dispositivos, objetivo 60 FPS, pruebas de interrupciones/segundo plano.
- Revisión legal de datos de menores (Guatemala y EE. UU.): consentimiento, retención,
  eliminación, auditoría.
- Procedimiento de rollback y publicación gradual.

## Flujos en paralelo (no bloquean las fases)

- **Contenido académico:** identificar el currículo vigente de Guatemala, temario por grado,
  formato de entrega de bancos de ejercicios. Es la dependencia externa más lenta; arrancar ya.
- **Catálogo de mecánicas:** hoy `telescope_hunt` y `multiple_choice`. El modelo pedagógico
  pide además conteo, ordenamiento, operaciones, arrastre y emparejamiento. Priorizar 3–4 para
  la primera versión publicable.
- **Privacidad / legal:** política de consentimiento, retención y eliminación; independiente
  del código.

## Preguntas abiertas que habrá que cerrar antes de la fase que las necesita

Del `Avance_solicitado_Caza_Estelar.docx` §3 y del análisis del proyecto:

- Fase 4: proveedor, país y capacidad inicial del VPS; usuarios simultáneos estimados y volumen
  de multimedia.
- Fase 4: propiedad de las tablas comunes entre este backend y la bitácora web central; esquema
  compartido.
- Fase 4: ¿"Autor de contenido" y "Revisor académico" deben ser personas distintas obligatoriamente?
- Fase 4: formato exacto de los Excel/CSV para carga masiva de alumnos; diseño final de reportes
  PDF/Excel.
- Fase 5/6: mecanismo de autenticación técnica contra el sistema central de usuarios.
- Fase 6: procedimiento de publicación del APK (descarga privada, MDM institucional o Google Play).
- Fase 7: política de conservación de historial, respaldos y datos de menores; matriz definitiva
  de permisos por rol; matriz de dispositivos y responsables operativos por ambiente.
