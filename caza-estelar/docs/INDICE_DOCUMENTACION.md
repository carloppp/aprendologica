# Índice de documentación — Caza Estelar

Actualizado: 5 de octubre de 2026.

## Punto de entrada

| Documento | Uso recomendado | Autoridad |
|---|---|---|
| `../CLAUDE.md` | Contexto automático, reglas y comandos para Claude Code | Operativa |
| `PWA_MIGRATION.md` | Arquitectura PWA vigente, producto visual y plan de migración | Operativa |
| `ADR_001_MOTOR_TYPESCRIPT.md` | Decisión de motor: cliente TypeScript (`app/`) para PWA + APK con Capacitor | Operativa |
| `DECISIONES_FASE_0.md` | Decisiones de producto cerradas (contrato, motor, conectividad, repos, progreso) | Operativa |
| `PLAN_DESARROLLO.md` | Hoja de ruta por fases | Operativa |
| `PLAN_SEPTIEMBRE_2026.md` | Alcance del avance de septiembre (planteamiento + prueba de concepto) | Operativa |
| `CONTENT_SCHEMA_V2.md` | Contrato de contenido v2 (planteamiento; reemplaza a v1) | Objetivo técnico |
| `contracts/catalog-v2.schema.json` | JSON Schema del catálogo v2 | Objetivo técnico |
| `ENTORNO.md` | Toolchain embebido, Git, Wrapper y comandos de compilación | Operativa |
| `MIGRACION_A_CLAUDE_CODE.md` | Diagnóstico, riesgos y secuencia de migración | Operativa |
| `../DOCUMENTACION_PROYECTO.md` | Visión, requisitos, preguntas y registro histórico de decisiones | Producto |
| `../INTEGRACION_ADMIN_JUEGO.md` | Arquitectura objetivo de consola/backend y contrato v2 propuesto | Objetivo técnico |
| `../ARQUITECTURA.md` | Arquitectura implementada por fases en la app | Estado actual |
| `../CONTENT_SCHEMA_V1.md` | Contrato del catálogo que hoy consume el código | Legado vigente |
| `../REMOTE_API_CONTRACT.md` | Autenticación y progreso remoto v1 esperado | Legado vigente |
| `../RELEASE_CHECKLIST.md` | Controles previos a APK/AAB de producción | Operativa |
| `../decisiones-tecnicas.md` | Resumen compacto de decisiones técnicas | Referencia |
| `../README.md` | Arranque rápido y descripción histórica del prototipo | Referencia; revisar fecha |

## Documentos binarios y fuentes reproducibles

- `../Propuesta_Caza_Estelar.docx` se genera desde `../build_propuesta_word.py`.
- `../Propuesta_Backend_Caza_Estelar.docx` se genera desde `../build_propuesta_backend.py`.
- `../Documentacion_Integracion_Admin_Juego.docx` se genera desde `../build_integracion_admin_word.py`.
- Los directorios `../qa_propuesta/` y `../qa_backend/` contienen artefactos de QA visual/documental.
- En la carpeta superior existen informes `.docx`, sus scripts de generación, renders QA y APK históricos. No forman parte del build Gradle del juego.

Cuando se actualice un documento generado, modificar primero su fuente Markdown o script y volver a generar/verificar el binario. No editar solamente el `.docx` si existe una fuente reproducible.

## Código y configuración que documentan la verdad ejecutable

- Cliente TypeScript (destino vigente): `../app/package.json`, `../app/capacitor.config.ts`, `../app/public/content/catalog.json` (catálogo v2), `../app/src/content/` (contrato v2), `../app/src/content/publishedCatalog.test.ts` (prueba integral).
- Build libGDX (referencia congelada): `../settings.gradle`, `../build.gradle`, `../core/build.gradle`, `../android/build.gradle`, `../web/build.gradle`.
- Plataforma: `../android/src/main/AndroidManifest.xml`.
- Catálogo incluido: `../assets/content/catalog.json`.
- Fuente de catálogo: `../assets/content/source.json`.
- Servicios y modo de desarrollo: `../assets/network/services.json`.
- Modelo de contenido: `../core/src/main/kotlin/com/explorax/cazaestelar/content/model/ContentModels.kt`.
- Registro de mecánicas: `../core/src/main/kotlin/com/explorax/cazaestelar/mechanics/MechanicRegistry.kt`.
- Prueba integral: `../core/src/test/kotlin/com/explorax/cazaestelar/content/PublishedCatalogIntegrationTest.kt`.

## Estado documental que no debe confundirse

- `CONTENT_SCHEMA_V1.md` describe lo implementado, no el futuro backend.
- `INTEGRACION_ADMIN_JUEGO.md` describe la meta v2, todavía no implementada.
- `DOCUMENTACION_PROYECTO.md` contiene decisiones tomadas a lo largo de una conversación; algunas fueron reemplazadas o entran en tensión con decisiones posteriores.
- Los APK son artefactos históricos y no prueban que el código actual compile ni que correspondan al último estado.

## Mantenimiento

Actualizar este índice y `CLAUDE.md` cuando cambie cualquiera de estos elementos: módulos, toolchain, comandos, contrato de contenido, endpoints, política offline, arquitectura móvil o fuentes de autoridad.
