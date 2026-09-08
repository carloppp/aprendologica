# Contrato remoto de la app

Todos los endpoints deben usar HTTPS y responder JSON UTF-8. Las contraseñas solo se envían al endpoint de acceso; nunca se escriben en disco ni se incluyen en registros.

## Inicio de sesión

`POST /auth/sign-in`

```json
{
  "email": "estudiante@example.org",
  "password": "secreto"
}
```

Respuesta exitosa:

```json
{
  "accessToken": "token-de-corta-duracion",
  "expiresAtEpochSeconds": 1787112000,
  "user": {
    "id": "student-uuid",
    "displayName": "Luna"
  }
}
```

El token debe ser de corta duración. Android lo cifra con AES-GCM mediante una clave no exportable de Android Keystore. Al vencer, la app elimina la sesión y solicita acceso nuevamente.

## Sincronización del progreso

`POST /progress/sync`

Cabecera:

```text
Authorization: Bearer <accessToken>
```

Solicitud:

```json
{
  "events": [
    {
      "eventId": "uuid-idempotente",
      "missionId": "fracciones-01",
      "missionVersion": 1,
      "starsEarned": 3
    }
  ]
}
```

Respuesta:

```json
{
  "acceptedEventIds": ["uuid-idempotente"],
  "progress": [
    {
      "missionId": "fracciones-01",
      "lastPlayedVersion": 1,
      "bestStars": 3,
      "playCount": 4,
      "completionCount": 3,
      "completed": true
    }
  ]
}
```

El servidor debe tratar `eventId` como clave idempotente. Reenviar el mismo evento no puede incrementar los contadores dos veces. La respuesta devuelve el estado canónico del jugador.

La conciliación de la app utiliza el mayor valor conocido para versión, estrellas y contadores, y conserva `completed` si cualquiera de los lados ya completó la misión. Una respuesta remota nunca reduce un logro local.

## Configuración

Los endpoints permanecen desactivados en `assets/network/services.json` hasta que exista el backend:

```json
{
  "developmentMode": true,
  "authentication": {
    "remoteEnabled": false,
    "signInUrl": ""
  },
  "progress": {
    "remoteEnabled": false,
    "syncUrl": ""
  }
}
```

`developmentMode: true` habilita exclusivamente el acceso local de desarrollo. Para una
publicación debe cambiarse a `false` y ambos servicios remotos deben estar activos con URLs
HTTPS válidas. La tarea `:android:verifyProductionConfiguration` aplica esta condición.
