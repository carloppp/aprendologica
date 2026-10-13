# Contrato de contenido v2

> **Estado: aprobado el 8 de septiembre de 2026 por el responsable (`carloppp`).**
> Reemplaza a `CONTENT_SCHEMA_V1.md`. La Fase 2 lo implementa en el parser del juego; esa
> implementación no forma parte del avance de septiembre y su calendario no está planteado
> todavía. La prueba mínima de concepto asociada son los modelos Kotlin en
> `core/src/main/kotlin/com/explorax/cazaestelar/content/v2/model/ContentModelsV2.kt` y el
> esquema en `docs/contracts/catalog-v2.schema.json`.

## Cambios respecto a v1

| v1 (`schemaVersion: 1`) | v2 (`schemaVersion: 2`) |
|---|---|
| `constellation → themes[] → missions[]` | `constellation → levels[]` (se elimina la capa de temas) |
| `MissionDefinition` | `LevelDefinition` |
| `rewards.maximumStars` | `completion` + `reward` |
| `unlock.prerequisiteMissionIds` | `unlock.prerequisiteLevelIds` |
| `mission.version` | `level.version` |
| — | `constellation.area`, `constellation.visual`, `minimumAppVersion` |

Sin capa de compatibilidad v1: el contenido de ejemplo actual se aplana una sola vez.

## Estructura

```text
catálogo
├── schemaVersion: 2
├── publishedVersion: string legible (p. ej. "2026.09.15.1")
├── revision: entero positivo monotónico
├── minimumAppVersion: string semver
├── assets[]                        (igual que v1: id, type, mimeType, url HTTPS, sha256, sizeBytes, required)
└── constellations[]
    ├── id: string estable, nunca reutilizado
    ├── version: entero, sube al cambiar estructura o presentación publicada
    ├── order: entero
    ├── area: string  (p. ej. "numbers_and_operations", "geometry", "patterns")
    ├── title: { es, en }
    ├── description: { es, en }
    ├── visual: { coverAssetId: string|null, accentColor: "#RRGGBB" }
    └── levels[]
        ├── id: string estable, nunca reutilizado
        ├── version: entero, sube al cambiar contenido, mecánica, requisitos o finalización
        ├── order: entero
        ├── title: { es, en }
        ├── instruction: { es, en }
        ├── mechanic: { type, schemaVersion, config }
        ├── unlock: { prerequisiteLevelIds: string[] }
        ├── completion: { type: "minimum_score", value: 0..100 }
        ├── reward: { experience: entero >= 0, badgeId: string|null }
        └── media: { promptAssetId, narrationAssetId, backgroundAssetId }   (cualquiera puede ser null)
```

Reglas de identidad y versión: los `id` de constelación y nivel son estables y no se reutilizan.
El nombre visible puede cambiar sin cambiar el `id`. Una partida iniciada conserva la
`level.version` con la que comenzó. `narrationAssetId` se mantiene opcional aunque el producto
no contemple narración de voz por ahora.

## Ejemplo reducido

```json
{
  "schemaVersion": 2,
  "publishedVersion": "2026.09.15.1",
  "revision": 1,
  "minimumAppVersion": "0.3.0",
  "assets": [],
  "constellations": [
    {
      "id": "fracciones",
      "version": 1,
      "order": 1,
      "area": "numbers_and_operations",
      "title": { "es": "Fracciones", "en": "Fractions" },
      "description": {
        "es": "Representación y comparación de fracciones.",
        "en": "Representation and comparison of fractions."
      },
      "visual": { "coverAssetId": null, "accentColor": "#7C8CFF" },
      "levels": [
        {
          "id": "fracciones-reconocer",
          "version": 1,
          "order": 1,
          "title": { "es": "Reconocer fracciones", "en": "Recognize fractions" },
          "instruction": {
            "es": "Selecciona la opción que representa tres cuartos.",
            "en": "Select the option that represents three quarters."
          },
          "mechanic": {
            "type": "multiple_choice",
            "schemaVersion": 1,
            "config": {
              "question": {
                "es": "¿Cuál fracción representa tres de cuatro partes iguales?",
                "en": "Which fraction represents three of four equal parts?"
              },
              "options": [
                { "id": "un-cuarto", "text": { "es": "1/4", "en": "1/4" }, "correct": false },
                { "id": "tres-cuartos", "text": { "es": "3/4", "en": "3/4" }, "correct": true },
                { "id": "dos-tercios", "text": { "es": "2/3", "en": "2/3" }, "correct": false }
              ],
              "attempts": 2,
              "successFeedback": { "es": "Correcto: tres de cuatro partes.", "en": "Correct: three of four parts." },
              "retryFeedback": { "es": "Observa el numerador y el denominador.", "en": "Look at the numerator and the denominator." }
            }
          },
          "unlock": { "prerequisiteLevelIds": [] },
          "completion": { "type": "minimum_score", "value": 60 },
          "reward": { "experience": 100, "badgeId": null },
          "media": { "promptAssetId": null, "narrationAssetId": null, "backgroundAssetId": null }
        }
      ]
    }
  ]
}
```

## Mecánicas

`mechanic.type` debe estar registrado en la app. Cada configuración es tipada
(`MechanicConfig`), no un mapa de cadenas.

- Cliente TypeScript (`app/`, desde el 12 de octubre de 2026): `multiple_choice` y las seis
  mecánicas de conjuntos (`set_*`). `telescope_hunt` sigue en el contrato, pero aún no tiene
  pantalla en `app/` y se rechaza al validar.
- Cliente Kotlin/libGDX (congelado): `telescope_hunt` y `multiple_choice`. No conoce las
  mecánicas `set_*`.

### `telescope_hunt`

```json
{ "type": "telescope_hunt", "schemaVersion": 1, "config": { "targetCount": 1..6, "lockRadius": 40..180 } }
```

### `multiple_choice`

```json
{
  "type": "multiple_choice",
  "schemaVersion": 1,
  "config": {
    "question": { "es": "...", "en": "..." },
    "options": [ { "id": "...", "text": { "es": "...", "en": "..." }, "correct": true } ],
    "attempts": 1..5,
    "successFeedback": { "es": "...", "en": "..." },
    "retryFeedback": { "es": "...", "en": "..." }
  }
}
```

- Entre 2 y 6 opciones; `id` únicos; exactamente una con `correct: true`.

### Mecánicas de conjuntos (`set_*`)

Diseñadas a partir de la guía visual 2D (`guia-visual-2d/niveles/conjuntos-desarrollo/`). Un nivel
tiene de 1 a 6 rondas. Comparten estos campos:

```json
{
  "attempts": 1..3,
  "successFeedback": { "es": "...", "en": "..." },
  "retryFeedback": { "es": "...", "en": "..." },
  "rounds": [ ... ]
}
```

Una **pieza** es `{ "shape": "star" | "moon" | "gem" | "circle", "color": "yellow" | "cyan" | "purple" | "blue" | "pink" }`.
Dos piezas con la misma forma y el mismo color son el **mismo elemento**. Una **propiedad**
(`pieceFilter`) tiene `shape`, `color` o ambos; por ejemplo, `{ "shape": "star" }` describe "las
estrellas". Un **conjunto** es una lista de 1 a 6 piezas sin elementos repetidos.

La respuesta correcta **no se declara**: la app la deriva de las piezas (`app/src/gameplay/sets.ts`).
Así el catálogo no puede publicar una respuesta que contradiga su propio contenido.

| `type` | Ronda | Qué hace el estudiante | Validación adicional |
| --- | --- | --- | --- |
| `set_select` (ELEMENTOS) | `prompt`, `pieces` (2-8, pueden repetirse), `target` (propiedad) | Lleva al anillo central las piezas que cumplen la propiedad | Debe haber piezas que cumplan y piezas que no |
| `set_membership` (PERTENENCIA) | `set`, `candidate` | Responde sí o no: ¿la pieza está en el conjunto? | — |
| `set_subset` (SUBCONJUNTOS) | `set` (2-6), `groups` (2-3 conjuntos) | Coloca dentro el grupo que es subconjunto | Exactamente un grupo es subconjunto |
| `set_intersection` (INTERSECCIÓN) | `a` y `b` (propiedades), `pieces` (2-7) | Lleva al centro del diagrama lo que cumple A y B | Al menos una pieza cumple A y B |
| `set_union` (UNIÓN) | `a`, `b` (conjuntos) | Reúne en A ∪ B cada elemento una sola vez | — |
| `set_difference` (DIFERENCIA) | `a`, `b` (conjuntos) | Lleva a la bandeja A − B lo que está en A y no en B | — |

Puntaje (`app/src/gameplay/roundSession.ts`): acierto al primer intento, 1 punto; acierto
posterior, 0,5; intentos agotados, 0 y la app muestra la respuesta. `bestScore` es el porcentaje
de puntos sobre el total de rondas; las estrellas usan los rangos de siempre (90, 60, 30).

```json
{
  "type": "set_intersection",
  "schemaVersion": 1,
  "config": {
    "attempts": 2,
    "successFeedback": { "es": "¡Eso es! Cumple A y también B.", "en": "That's it! It fits A and B too." },
    "retryFeedback": { "es": "Debe cumplir las dos cosas: A y B.", "en": "It must fit both: A and B." },
    "rounds": [
      {
        "a": { "color": "blue" },
        "b": { "shape": "star" },
        "pieces": [ { "shape": "circle", "color": "blue" }, { "shape": "star", "color": "blue" }, { "shape": "star", "color": "yellow" } ]
      }
    ]
  }
}
```

## Validación en el juego (defensiva; no sustituye al backend)

- `schemaVersion` soportado (2).
- `revision` estrictamente mayor que la activa.
- Respuesta HTTPS de tamaño máximo 1 MiB.
- Cada `mechanic.type` registrado; configuración tipada válida.
- `prerequisiteLevelIds` existentes, sin duplicados, sin ciclos, sin auto-referencia.
- Al menos un nivel por constelación publicada.
- Cada referencia de `media` existe en `assets` y es del tipo correcto.
- Ante cualquier fallo, se conserva el último catálogo válido.

## Progreso (contrato con la app administrativa)

El juego calcula y envía por nivel: `levelId`, `levelVersion`, `completed`, `score` (0..100),
`attemptsUsed`, `durationMs`, `updatedAt`. El porcentaje y las estrellas se derivan de `score`
según los rangos de `DOCUMENTACION_PROYECTO.md` §2.8 (0–29: 0★, 30–59: 1★, 60–89: 2★ y
aprobado, 90–100: 3★). El evento lleva `eventId` (UUID) para idempotencia. Detalle en
`REMOTE_API_CONTRACT.md`.
