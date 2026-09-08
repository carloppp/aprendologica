# Plan de avance — septiembre 2026

Creado: 7 de septiembre de 2026. Reencuadrado: 8 de septiembre de 2026.
Base: `DECISIONES_FASE_0.md`, `PLAN_DESARROLLO.md`, `Avance_solicitado_Caza_Estelar.docx`.

## Qué es el avance de septiembre

El avance del mes tiene dos partes:

1. **Planteamiento** (completado): diseño del juego v2 y de la aplicación administrativa,
   contrato `CONTENT_SCHEMA_V2.md`, esquema JSON y el documento con diagramas.
2. **Implementación de la Fase 2** (en curso): el 8 de septiembre el responsable autorizó
   arrancar la migración del código al contrato v2. Se ejecuta por incrementos pequeños y
   revisables. No se fija un calendario de cierre.

## Avance de la Fase 2 (implementación)

| Incremento | Contenido | Estado |
|---|---|---|
| 1 | Parser y validadores v2 (`CatalogParserV2`, `LevelValidator`, `CatalogValidatorV2`) en el paquete `content.v2`, con pruebas | **Completado** |
| 2 | Catálogo incluido en v2 + servicio de contenido que devuelve v2 + prueba integral | Pendiente |
| 3 | Modelo de progreso v2 (`LevelProgress`, cálculo, desbloqueos) | Pendiente |
| 4 | Retiro del código de operación sin conexión (cola persistente y caché offline) | Pendiente |
| 5 | Navegación por niveles (`LevelListScreen`); eliminación de `ThemeMapScreen`/`MissionListScreen` y del modelo v1 | Pendiente |

## Entregables del mes

| Entregable | Estado | Ubicación |
|---|---|---|
| Decisiones de producto (Fase 0) | Completado | `docs/DECISIONES_FASE_0.md` |
| Entorno reproducible (Fase 1) | Completado | `docs/ENTORNO.md` |
| `CONTENT_SCHEMA_V2.md` — contrato de contenido v2 | Completado | `docs/CONTENT_SCHEMA_V2.md` |
| JSON Schema del catálogo v2 | Completado | `docs/contracts/catalog-v2.schema.json` |
| Modelos Kotlin v2 (compilan, con pruebas; sin conectar) | Completado | `core/.../content/v2/model/ContentModelsV2.kt` + test |
| Documento del avance del mes (con diagramas y UML) | Completado | `Avance_Septiembre_Caza_Estelar.docx` (fuente: `build_avance_septiembre.py`) |
| Plan operativo del mes | Este documento | — |

## Estado del código

- El paquete nuevo `content.v2` (modelos, parser y validadores) compila y tiene pruebas
  verdes. Todavía **no se usa desde el juego**: pantallas, navegación y progreso siguen en v1
  hasta los incrementos 2-5. `:core:test` en verde.
- El modelo v1 (`ContentModels.kt`, `CatalogParser`, `CatalogValidator`, `MissionValidator`)
  se elimina en el incremento 5, cuando ningún consumidor lo use.

## Trabajo del responsable durante septiembre

| Acción | Para |
|---|---|
| Revisar y aprobar `CONTENT_SCHEMA_V2.md` y el documento del avance | Cerrar el contrato antes de implementarlo |
| Solicitud formal al equipo académico (currículo GT, temario por grado, formato de bancos) | Fase 4 y contenido real |
| Priorizar 3-4 mecánicas nuevas | Fase 2-4 |
| Proveedor/país/plan del VPS; usuarios simultáneos; volumen multimedia | Fase 4 |
| Iniciar consulta legal sobre datos de menores | Fase 7 |

## Fuera de alcance de septiembre

- Cualquier código del backend o de la consola (ni siquiera esqueleto).
- Ejecución del spike de motor y el ADR.
- Contenido académico real; aprovisionamiento del VPS y del dominio.
- Fases 3 a 7. La hoja de ruta por fases, sin fechas, está en `PLAN_DESARROLLO.md`.
