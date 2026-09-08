# Plan de avance — septiembre 2026

Creado: 7 de septiembre de 2026. Reencuadrado: 8 de septiembre de 2026.
Base: `DECISIONES_FASE_0.md`, `PLAN_DESARROLLO.md`, `Avance_solicitado_Caza_Estelar.docx`.

## Qué es (y qué no es) el avance de septiembre

**Septiembre no implementa la aplicación.** El avance del mes es un **documento de
planteamiento** (diseño del juego v2 y de la aplicación administrativa, con diagramas) más una
**prueba mínima de concepto** verificable del contrato de contenido v2. La implementación
—parser v2, navegación por niveles, retiro del modo sin conexión, backend— empieza en octubre.

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

## Prueba mínima de concepto — alcance y límites

- **Sí:** modelos de datos del contrato v2 en Kotlin, esquema JSON y pruebas de la derivación
  de estrellas/porcentaje y de la resolución de niveles por id. `:core:test` en verde
  (41 pruebas).
- **No:** no se toca `CatalogParser`, `CatalogValidator`, la navegación, el progreso ni la
  configuración de red. El paquete `content.v2` está aislado y no se usa desde el juego.

## Trabajo del responsable durante septiembre

| Acción | Para |
|---|---|
| Revisar y aprobar `CONTENT_SCHEMA_V2.md` y el documento del avance | Cerrar el contrato antes de implementarlo en octubre |
| Solicitud formal al equipo académico (currículo GT, temario por grado, formato de bancos) | Fase 4 y contenido real |
| Priorizar 3-4 mecánicas nuevas | Fase 2-4 |
| Proveedor/país/plan del VPS; usuarios simultáneos; volumen multimedia | Fase 4 |
| Iniciar consulta legal sobre datos de menores | Fase 7 |

## Fuera de alcance de septiembre

- Implementación del parser v2, la navegación por niveles y el progreso v2.
- Retiro del código de operación sin conexión.
- Cualquier código del backend o de la consola (ni siquiera esqueleto).
- Ejecución del spike de motor y el ADR.
- Contenido académico real; aprovisionamiento del VPS y del dominio.

## Octubre en adelante

Ver `PLAN_DESARROLLO.md`. El primer bloque de implementación es la Fase 2 (contrato v2 en la
app), partiendo de los modelos y el esquema ya escritos este mes.
