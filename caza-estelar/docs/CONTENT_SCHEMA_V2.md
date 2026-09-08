# Contrato de contenido v2

> **Estado: aprobado el 8 de septiembre de 2026 por el responsable (`carloppp`).**
> Reemplaza a `CONTENT_SCHEMA_V1.md`. La Fase 2 (octubre) lo implementa en el parser del
> juego. La prueba mínima de concepto asociada son los modelos Kotlin en
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

Sin cambios de forma respecto a v1. `mechanic.type` debe estar registrado en la app
(`MechanicRegistry`). Instaladas: `telescope_hunt`, `multiple_choice`. Cada configuración es
tipada (`MechanicConfig`), no un mapa de cadenas.

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
