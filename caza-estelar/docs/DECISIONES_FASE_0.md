# Fase 0 — Decisiones que desbloquean el desarrollo

Fecha: 7 de septiembre de 2026.
Responsable: `cmlara@uvg.edu.gt`.
Estado: **cerradas**. Reemplazan o resuelven las contradicciones abiertas registradas en
`MIGRACION_A_CLAUDE_CODE.md`.

| # | Área | Decisión | Consecuencia inmediata |
|---|---|---|---|
| 1 | Contrato de contenido | Migrar **directo a v2** (`constelación → nivel`), **sin capa de compatibilidad v1**. _(Actualizado el 7 de septiembre: se descarta la compatibilidad; no hay contenido v1 real ni usuarios.)_ | Fase 2 implementa solo modelos y parser v2. El contenido de ejemplo actual se aplana a mano una vez. |
| 2 | Motor / arquitectura móvil | **No decidido todavía.** Se hará un spike comparativo (libGDX vs Compose/Canvas vs híbrido) y un ADR antes de fijar nada. No hay reescritura total aprobada. | El proyecto sigue como prototipo de referencia en libGDX. No se invierte en pantallas nuevas grandes hasta el ADR. |
| 3 | Conectividad | **Solo online.** Se exige conexión para iniciar sesión y entrar al juego. Los resultados se envían al momento y se reintentan **solo dentro de la sesión activa**. Se elimina la cola de sincronización persistente entre reinicios y el juego sin conexión. El catálogo educativo **sigue empaquetado en la APK**. | Fase 2 **retira o desactiva** `PreferencesProgressSyncQueue`, la parte de cola de `SyncingProgressRepository` y la selección de catálogo desde caché offline. Es trabajo de borrado. |
| 4 | Repositorios | _(Actualizado el 7 de septiembre, tras `Avance_solicitado_Caza_Estelar.docx`.)_ **Repo A** = app Android (`caza-estelar/`, Kotlin/libGDX). **Repo B** = aplicación administrativa: backend NestJS + consola React + Prisma + `docker-compose`, juntos, desplegables en el VPS. | El contrato de contenido/protocolo (JSON Schema v2 + fixtures) se comparte entre ambos repos. |
| 5 | Modelo de progreso | Adoptar campos **v2**: `levelId`, `levelVersion`, `completed`, `score`, `attemptsUsed`, `durationMs`, `updatedAt`. `percentage` y `stars` se **derivan** de `score` (rangos de `DOCUMENTACION_PROYECTO.md` 2.8), no se guardan por separado en el cliente. Historial completo de intentos conservado. | Fase 2 reescribe `MissionProgress`, `ProgressCalculator`, `ProgressMergePolicy` y el contrato de `/progress/sync`. |
| 6 | Narración de voz | Mantener `narrationAssetId` **opcional** en el contrato v2, aunque el producto no contemple narración por ahora. | El parser y el validador aceptan el campo; ninguna mecánica lo exige. |
| 7 | Reproducibilidad | Ejecutar la Fase 1 ahora (Git, `.gitignore`, Gradle Wrapper, renombrado de carpeta, línea base). | Hecho el 7 de septiembre. Ver `ENTORNO.md`. |
| 8 | Stack de la aplicación administrativa | _(Fijado por `Avance_solicitado_Caza_Estelar.docx`, 24 de agosto.)_ Frontend **React + TypeScript**; backend **Node.js + NestJS**; **PostgreSQL + Prisma**; **Docker Compose + Nginx + Let's Encrypt**; **JWT + Argon2**; **GitHub Actions**. Despliegue en **VPS Ubuntu Server**, dominio **explorax.app**, dimensionado para **~20 000 usuarios registrados**. Reportes con ExcelJS + PDFKit. | Reemplaza "backend en Kotlin" (`INTEGRACION_ADMIN_JUEGO.md` §17, `Evaluacion_tecnica` §4.4) y "infraestructura AWS" (`DOCUMENTACION_PROYECTO.md` §2.3). |

## Notas de riesgo registradas (no resolver en silencio)

- **Decisión 3:** contradice el texto "se conserva la cola offline" de `ARQUITECTURA.md`
  (fases 5 y 7) y de `INTEGRACION_ADMIN_JUEGO.md` (sección 14). Esos documentos deben
  actualizarse cuando la Fase 2 retire la cola.
- **Decisión 3:** el requisito "expulsar al alumno de inmediato al bloquear la cuenta"
  (`DOCUMENTACION_PROYECTO.md` 2.7) queda ahora alineado con "solo online".
- **Decisión 2:** mientras no haya ADR, cualquier trabajo de UI se considera desechable. En
  septiembre se acepta una `LevelListScreen` **mínima** en libGDX asumiendo que se rehará
  tras el ADR (decisión del responsable, 7 de septiembre).
- **Decisión 8:** varios parámetros del VPS siguen abiertos (proveedor, país, capacidad
  inicial, usuarios simultáneos, volumen multimedia). Ver `Avance_solicitado_Caza_Estelar.docx`
  §3 y la lista de preguntas abiertas en `PLAN_DESARROLLO.md`.

## Documentos de referencia de estas decisiones

- `Avance_solicitado_Caza_Estelar.docx` (24 de agosto) — "Versión final planeada" del juego y
  la aplicación administrativa. Fuente de las decisiones 4 (repos) y 8 (stack). Se regenera
  desde `../build_avance_solicitado.py`.
- `Evaluacion_tecnica_Caza_Estelar_TypeScript_7.docx` (21 de agosto) — evaluación de TypeScript
  7; recomendaba backend en Kotlin. **Superado en el punto del backend** por el documento
  posterior. Se regenera desde `../build_evaluacion_tecnica.py`.

## Próximo paso

Fases 0 y 1 completadas en septiembre. Contrato **v2 aprobado por el responsable el 8 de
septiembre de 2026** (`docs/CONTENT_SCHEMA_V2.md`). La Fase 2 (implementación del parser v2,
validación, progreso v2, retiro de offline y navegación por niveles) queda **autorizada**,
partiendo de los modelos y el esquema ya escritos; no forma parte del avance de septiembre y
su calendario no está planteado todavía. Hoja de ruta por fases, sin calendario, en
`PLAN_DESARROLLO.md`.
