# Lista de publicación

La compilación `debug` usa actualmente servicios locales porque
`assets/network/services.json` declara `developmentMode: true`. Esto es intencional para continuar
el desarrollo sin que la app suplante una configuración de producción.

Antes de generar una APK o AAB de producción:

1. Publicar el backend externo y la consola académica.
2. En `assets/content/source.json`, activar `remoteEnabled` y definir un `catalogUrl` HTTPS.
3. En `assets/network/services.json`, activar autenticación y progreso con endpoints HTTPS reales.
4. Cambiar `developmentMode` a `false`.
5. Confirmar que el catálogo publicado incrementa `revision` y supera las reglas de
   `CONTENT_SCHEMA_V1.md`.
6. Ejecutar las pruebas de `core`, incluida la validación integral del catálogo incluido.
7. Ejecutar `:android:verifyProductionConfiguration`. También se ejecuta automáticamente antes de
   `preReleaseBuild` y bloquea la publicación si sigue existiendo una configuración local.
8. Probar acceso, cierre de sesión, progreso sin conexión, reintento de sincronización, descarga de
   medios y recuperación ante una respuesta remota inválida.
9. Firmar el artefacto con el keystore de producción y verificarlo en un dispositivo limpio.

No deben introducirse secretos, tokens ni contraseñas en ninguno de los archivos JSON de assets.
