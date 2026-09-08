# Contrato de contenido v1

> **Estado: legado, en reemplazo.** Este contrato conserva la jerarquía anterior
> `constelación → tema → misión` únicamente para documentar el código que hoy corre en la app.
> El contrato vigente para diseño e implementación es **`docs/CONTENT_SCHEMA_V2.md`**
> (`schemaVersion: 2`, jerarquía `constelación → nivel`). La Fase 2 migra el código a v2.

El administrador publica un catálogo con `schemaVersion: 1`. Cada publicación debe incrementar `revision`, un entero positivo y monotónico. `publishedVersion` es la etiqueta legible de esa publicación. La app solo habilita una misión cuando reconoce su mecánica y `MissionValidator` acepta su configuración.

## Estructura

```text
catálogo
├── schemaVersion
├── publishedVersion
├── revision
├── assets[]
└── constellations[]
    └── themes[]
        └── missions[]
            ├── title { es, en }
            ├── instruction { es, en }
            ├── mechanic { type, config }
            ├── rewards { maximumStars }
            ├── unlock { prerequisiteMissionIds[] }
            └── media { promptAssetId, narrationAssetId, backgroundAssetId }
```

Los identificadores de constelaciones, temas, misiones y opciones deben permanecer estables después de publicar. Una modificación publicada incrementa `mission.version`.

`unlock.prerequisiteMissionIds` contiene los identificadores de las misiones que el estudiante debe completar. Una lista vacía deja la misión disponible desde el inicio. Una misión no puede depender de sí misma ni repetir prerrequisitos.

## `telescope_hunt`

```json
{
  "type": "telescope_hunt",
  "config": {
    "targetCount": 3,
    "lockRadius": 92
  }
}
```

- `targetCount`: entero entre 1 y 6.
- `lockRadius`: número entre 40 y 180; valores mayores facilitan la captura.

## `multiple_choice`

```json
{
  "type": "multiple_choice",
  "config": {
    "question": { "es": "Pregunta", "en": "Question" },
    "options": [
      {
        "id": "opcion-a",
        "text": { "es": "Respuesta", "en": "Answer" },
        "correct": true
      }
    ],
    "attempts": 2,
    "successFeedback": { "es": "Correcto", "en": "Correct" },
    "retryFeedback": { "es": "Intenta otra vez", "en": "Try again" }
  }
}
```

- Debe contener entre 2 y 6 opciones.
- Los identificadores de opción deben ser únicos.
- Exactamente una opción debe tener `correct: true`.
- `attempts` debe estar entre 1 y 5.
- La respuesta correcta en el primer intento entrega `maximumStars`.
- Cada error previo resta una estrella, conservando un mínimo de una al acertar.
- Agotar los intentos completa la ejecución sin estrellas y permite reiniciarla.

La consola académica debe aplicar estas mismas reglas antes de permitir una publicación.

## Entrega a la app

El endpoint debe responder el documento completo como `application/json` mediante HTTPS. La app rechaza respuestas mayores de 1 MiB, esquemas desconocidos, revisiones anteriores o iguales, configuraciones inválidas y progresiones con dependencias rotas.

Una publicación aceptada se guarda con una suma SHA-256. En el siguiente arranque, la app utiliza la revisión válida más reciente entre el catálogo incluido en la APK y la copia local. Si la red, la integridad o la validación fallan, conserva el último catálogo válido.

## Recursos multimedia

```json
{
  "assets": [
    {
      "id": "fracciones-pregunta-01",
      "type": "image",
      "mimeType": "image/png",
      "url": "https://cdn.example.org/fracciones/pregunta-01.png",
      "sha256": "64-caracteres-hexadecimales",
      "sizeBytes": 184320,
      "required": true
    }
  ]
}
```

- Tipos admitidos: `image` y `audio`.
- Imágenes admitidas: `image/png` e `image/jpeg`.
- Audio admitido: `audio/mpeg`, `audio/ogg` y `audio/wav`.
- La URL debe usar HTTPS.
- `sizeBytes` debe coincidir exactamente con el archivo y no superar 25 MiB.
- `sha256` se calcula sobre los bytes originales del archivo.
- Los recursos con `required: true` se precargan al aceptar el catálogo.
- Los recursos opcionales se descargan al entrar en una misión que los referencia.

Una misión puede utilizar:

```json
{
  "media": {
    "promptAssetId": "fracciones-pregunta-01",
    "narrationAssetId": "fracciones-narracion-01",
    "backgroundAssetId": "fracciones-fondo-01"
  }
}
```

Cada referencia debe existir en `assets` y corresponder al tipo correcto. Si una descarga falla, la misión conserva su versión textual y continúa disponible.
