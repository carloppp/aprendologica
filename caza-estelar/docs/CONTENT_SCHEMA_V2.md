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
        ├── description: { es, en }   (opcional: de qué trata el nivel; se ve en el panel antes de jugar)
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

Diseñadas a partir de la guía visual 2D (`guia-visual-2d/niveles/conjuntos-desarrollo/`). Comparten
estos campos:

```json
{
  "attempts": 1..3,
  "roundsPerPlay": 1..6,
  "successFeedback": { "es": "...", "en": "..." },
  "retryFeedback": { "es": "...", "en": "..." },
  "rounds": [ { ..., "difficulty": 1 | 2 | 3 } ]
}
```

**Banco de variantes (2026-10-14).** `rounds` es un banco de hasta 60 rondas y cada partida juega
`roundsPerPlay` de ellas (máximo 6 y nunca más que el banco). Así dos estudiantes, o dos partidas
seguidas, casi nunca reciben las mismas preguntas. Cada ronda lleva `difficulty`: 1 fácil, 2 media
o 3 difícil; si falta, cuenta como 2. Sin `roundsPerPlay` se juega todo el banco en orden de
dificultad, como en los catálogos anteriores.

- **Sorteo** (`app/src/gameplay/roundPlan.ts`): la partida sigue una rampa de fácil a difícil. Con 4
  rondas la rampa es 1, 2, 2, 3. En cada paso se elige al azar una ronda de esa dificultad, o de la
  más cercana si no queda ninguna. Se evitan las rondas de la partida anterior del mismo nivel
  mientras haya otras, y la app baraja la posición de las piezas de cada ronda.
- **Validación adicional:** `difficulty` entre 1 y 3; `roundsPerPlay` entre 1 y el mínimo de 6 y el
  tamaño del banco; ninguna ronda repite otra del banco (sin contar su dificultad).
- **Generación:** los bancos de CONJUNTOS y PATRONES se generan con `app/scripts/generate_round_banks.py`. El
  script usa una semilla fija y genera 12 rondas por dificultad (36 por nivel), con 4 por partida.
  Fácil usa una sola propiedad y distractores claramente distintos. Media agrega más piezas.
  Difícil usa distractores parecidos, que comparten forma o color con la respuesta, y conjuntos
  más grandes.

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
| `set_difference` (DIFERENCIA) | `a`, `b` (conjuntos) | Lleva a la bandeja A − B lo que está en A y no en B | A − B no queda vacío |
| `set_group` (FORMAR CONJUNTOS) | `pieces` (4-8), `by` (`shape` o `color`) | Reparte todas las piezas en 2 o 3 aros, cada uno con una característica común | Las piezas forman 2 o 3 grupos por `by`; se acepta juntarlas por forma o por color |
| `set_diagram` (ELEMENTOS Y DIAGRAMAS) | `a` (propiedad), `b` (propiedad o `null`), `pieces` (3-7) | Lleva cada pieza a su región del diagrama de Venn (A; o solo A, A y B, solo B); las demás se quedan fuera | Al menos una pieza en A, en B (si hay B) y fuera |
| `set_braces` (ENTRE LLAVES) | `set` (1-8 piezas, pueden repetirse), `extra` (0-2) | Escribe A = { … } con cada elemento una sola vez | De 1 a 5 elementos distintos; `extra` no está en el conjunto |
| `set_describe` (DESCRIBE EL CONJUNTO) | `set` (2-6), `options` (2-3 propiedades) | Elige la descripción por comprensión que cumplen todos los elementos | Exactamente una opción la cumplen todos |
| `set_kind` (CLASES DE CONJUNTOS) | `set` (0-6), `infinite` | Decide si el conjunto es vacío, unitario, finito o infinito | Un conjunto infinito muestra de 2 a 4 piezas y sigue con «…» |
| `set_operation` (UNIÓN E INTERSECCIÓN) | `op` (`union` o `intersection`), `a`, `b` (conjuntos) | Arma A ∪ B o A ∩ B con los elementos de A y de B | A ∩ B no queda vacío |

Desde el 2026-10-15 los niveles siguen la estructura curricular acordada: `CONJUNTOS` usa `set_group`,
`set_diagram`, `set_braces`, `set_describe`, `set_kind` y `set_operation`; `RELACIONES` usa por ahora
`set_membership` (PERTENECE) y `set_subset` (SUBCONJUNTOS). `set_select`, `set_intersection`,
`set_union` y `set_difference` siguen instaladas, pero el catálogo ya no las usa (DIFERENCIA queda como
posible reto avanzado).

### Mecánicas de patrones (`pattern_*`)

Diseñadas a partir de la guía visual 2D (`guia-visual-2d/niveles/patrones-puente-nivel-v1.webp` y
`navegacion/patrones-constellation-levels-v1.webp`), 2026-10-14. Las piezas son las baldosas de un
puente hacia el portal. Comparten los campos de las mecánicas de conjuntos (`attempts`,
`roundsPerPlay`, retroalimentación y banco `rounds` con `difficulty`). Las respuestas se derivan del
contenido (`app/src/gameplay/patterns.ts`). Al acertar, Stella cruza el puente hasta el portal.

| `type` | Niveles | Ronda | Qué hace el estudiante | Validación adicional |
| --- | --- | --- | --- | --- |
| `pattern_copy` | REPETIR | `sequence` (3-6), `extra` (0-2) | Copia el modelo en el puente, en el mismo orden | Al menos dos piezas distintas; `extra` no aparece en el modelo |
| `pattern_fill` | ALTERNAR, COMPLETAR | `unit` (2-4), `length`, `blanks` (1-4), `extra` (0-2) | Llena los huecos del puente, que repite `unit` | `unit` con dos piezas distintas como mínimo y sin repetirse dentro de sí (A B A B no es unidad); `length` entre 2 × `unit` y 9; cada hueco se ve en otra repetición |
| `pattern_spot` | DETECTAR | `unit`, `length` (hasta 8), `mistakes` (2) | Elige, entre tres caminos, el único que sigue el patrón | Cada error cambia una baldosa por otra pieza; los dos caminos con error son distintos |
| `pattern_unit` | DESCUBRIR LA UNIDAD | `unit` (2-4), `length` (2 × `unit` a 9) | El puente está completo; elige, entre tres carteles (la unidad, una pieza más corta y una más larga), la parte que se repite | Las mismas reglas de `unit` que `pattern_fill` |
| `pattern_create` | CREAR | `length` (4-8), `palette` (2-4) | Llena el puente con un patrón propio | Se acepta si una unidad de al menos dos piezas distintas se repite completa al menos dos veces |

Las piezas de patrones son solo las tres baldosas de la guía: estrella amarilla, círculo celeste y rombo morado (`guia-visual-2d/assets/patrones-recuadros-uniformes-v2`, sin recolorear); el catálogo rechaza cualquier otra. La bandeja de `pattern_copy` y `pattern_fill` muestra cada pieza distinta una vez, en orden fijo
por forma y color, para que su posición no delate la respuesta. En DETECTAR el camino correcto cae
en un carril al azar.

### Mecánicas de clasificación (`sort_*`)

Diseñadas a partir de `guia-visual-2d/interfaz/niveles/imagenes-niveles-clasificacion-v1.zip` y del kit
`guia-visual-2d/assets/assets-y-fondos-clasificacion-v1.zip` (2026-10-15). Usan su propia familia de piezas,
las fichas v2 de `guia-visual-2d/assets/clasificacion-v2`: `{ "shape": "circle" | "triangle" | "square" | "star",
"color": "yellow" | "cyan" | "purple", "size": "small" | "medium" | "large" }` (sin `size`, mediana). Los
contenedores también son los v2. Comparten los campos de las
mecánicas de conjuntos; las respuestas se derivan del contenido (`app/src/gameplay/sorting.ts`).

| `type` | Niveles | Ronda | Qué hace el estudiante | Validación adicional |
| --- | --- | --- | --- | --- |
| `sort_groups` | COLOR, FORMA, TAMAÑO | `by` (`color`, `shape` o `size`), `pieces` (4-10) | Reparte cada pieza en el grupo de su color, forma o tamaño; se revisa sola al colocar la última | 2 o 3 grupos |
| `sort_type` | TIPO | `items` (4-8 ids) | Reparte objetos en su familia (frutas, animales, útiles, vehículos); se revisa sola | Ids de `TYPE_ITEMS`, sin repetir; 2 o 3 familias |
| `sort_rule` | DOS CARACTERÍSTICAS | `rule` (`shape` y `color`), `pieces` (4-7) | Separa en CUMPLE / NO CUMPLE; se comprueba con el botón | Hay piezas que cumplen y piezas que no |
| `sort_discover` | DESCUBRE LA REGLA | `group` (3-5), `others` (0-3) | Elige COLOR o FORMA: la característica con que se formó el grupo; se revisa sola | Todas las piezas del mismo tamaño; el grupo comparte exactamente el color o la forma; `others` no la tiene |

Los objetos de TIPO se dibujan por ahora con emoji (`TYPE_ITEMS.glyph`), porque el kit no trae
ilustraciones de objetos. Los textos CUMPLE/NO CUMPLE y COLOR/FORMA/TAMAÑO del kit vienen dentro de
las imágenes en español: la app los dibuja para poder traducirlos.

Puntaje (`app/src/gameplay/roundSession.ts`): acierto al primer intento, 1 punto; acierto
posterior, 0,5; intentos agotados, 0 y la app muestra la respuesta. `bestScore` es el porcentaje
de puntos sobre el total de rondas jugadas en la partida; las estrellas usan los rangos de siempre (90, 60, 30).

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
