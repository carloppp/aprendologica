# Aprendo Lógica (antes Caza Estelar) — contexto de migración a PWA

Actualizado: 12 de octubre de 2026.

## Encargo vigente

**Cambio de rumbo (5 de octubre de 2026, `ADR_001_MOTOR_TYPESCRIPT.md`):** el cliente se reescribe en TypeScript dentro de `caza-estelar/app/`. Una sola base genera la PWA (Vite) y el APK (Capacitor). La ruta libGDX + TeaVM descrita más abajo queda congelada como referencia funcional y no recibe pantallas nuevas.

### Estado del cliente TypeScript (`app/`)

- Contrato v2 portado: modelos, parser, `validateLevel` y `validateCatalog`, con las mismas pruebas que Kotlin más la prueba integral del catálogo publicado.
- Catálogo v2 empaquetado (`app/public/content/catalog.json`): constelación `conjuntos` con los seis niveles (`ELEMENTOS`, `PERTENENCIA`, `SUBCONJUNTOS`, `UNIÓN`, `INTERSECCIÓN`, `DIFERENCIA`), mecánica `multiple_choice`, en español e inglés.
- Recorrido: intro, login (autenticación local de desarrollo), selector de seis estrellas (las que no tienen constelación se muestran como "Próximamente"), constelación con estrellas encendidas o apagadas y tramos solo entre completadas, nivel con estrellas de resultado.
- Progreso v2 guardado por jugador en `localStorage`, bajo una clave opaca (sin el correo). La mezcla nunca reduce logros.
- PWA: manifiesto, service worker (catálogo con estrategia *network-first*), escenario 1920×1080 escalado y aviso de girar el dispositivo en vertical.
- APK: `app/android/` (Capacitor 8, `applicationId` `com.explorax.cazaestelar`, orientación `sensorLandscape`).
- Verificado el 5 de octubre de 2026: 31 pruebas Vitest, `npm run build`, un recorrido de humo en Chrome headless (login, dos niveles, constelación, recarga con progreso conservado, inglés, service worker registrado, sin errores de consola) y `assembleDebug`, que genera un APK de unos 5 MB. **No probado todavía en un dispositivo físico.**
- Pendiente: mecánica `telescope_hunt`, cliente HTTPS del backend (sustituye la autenticación local), icono del APK, prueba en una tableta de gama baja y despliegue HTTPS.

### Rediseño con la guía visual 2D (12 de octubre de 2026)

Fuente: `../../guia-visual-2d/` (descomprimida de `guia-visual-2d-completa.zip`). Las pantallas de `app/` se rehicieron para replicar esas imágenes; el núcleo (contrato v2, progreso, escenario 1920×1080, PWA y Capacitor) se conservó.

- **Recursos de runtime:** `app/scripts/prepare_visual_assets.py` (solo Pillow) recorta a Stella (vista frontal de su hoja de modelo) y a Luma (saludando, de la presentación), las cuatro caras de cada uno (`happy`, `joy`, `surprised`, `sad`), el logotipo y el isotipo con contorno blanco, los iconos PNG de la PWA y tres fondos a 1920×1080. Volver a ejecutarlo si cambia la guía:
  `python -I scripts/prepare_visual_assets.py ../../guia-visual-2d public/assets` (desde `app/`).
- **Acceso** (`interfaz/autenticacion/inicio-sesion-codigo-visible-v3`): una sola pantalla con el código del estudiante, visible (`¡HOLA!` la primera vez, `¡HOLA DE NUEVO!` después). Decisión del responsable (12 de octubre de 2026): por ahora pulsar ENTRAR siempre da acceso; el código es opcional y solo separa el progreso de cada estudiante en el dispositivo (sin código se usa un jugador invitado). El progreso usa una clave opaca derivada del código; el código no se guarda. No hay código del docente ni correo y contraseña; las imágenes `primer-acceso-codigo-v1`, `inicio-sesion-v1` e `inicio-sesion-codigo-v2` no se implementan.
- **Selector y constelación** (`navegacion/`): cielo con nubes moradas, seis estrellas redondeadas con su icono; constelación en anillo con estrellas de cuatro puntas, contador `N DE 6 ESTRELLAS` y tramos con punto medio y una luz que los recorre; la última estrella también se une con la primera cuando ambas están completadas. Los cinco grupos sin contenido avisan "¡Muy pronto!".
- **Niveles** (`niveles/conjuntos-desarrollo/`): fondo ilustrado del observatorio (`guia-visual-2d/escenarios/level-observatory-room-v1-2d.webp` → `bg-level.jpg`) y mesa holográfica reducida al 78 % detrás de los personajes (el puntero convierte coordenadas con el propio tablero), Stella a la izquierda, Luma a la derecha, globo de Stella con título y consigna (ahí aparece también la retroalimentación), progreso por rondas arriba a la derecha y botones redondos de comprobar y reiniciar (o sí/no en PERTENENCIA). Las piezas se tocan o se arrastran. Seis mecánicas nuevas `set_*` en el contrato v2 (ver `CONTENT_SCHEMA_V2.md`); los seis niveles de `CONJUNTOS` pasaron a la versión 2 con cuatro rondas cada uno.
- **Historias en cómic** (`app/src/screens/story.ts`, `guia-visual-2d/historia/`): la primera vez que entra un estudiante ve la historia de inicio (`comic-intro-v1.webp` → `comic-intro.jpg`) antes del selector. El primer cuadro se ve de entrada y el resto está bajo una sola nube blanca (lienzo con bultos sombreados y orillas translúcidas) que se disuelve, cuadro por cuadro, con cada toque; al terminar aparece ¡VAMOS! (también hay "Saltar"). Lo visto se guarda por jugador y por historia (`StoryProgress`, clave opaca). El botón del libro, abajo a la derecha del selector, la vuelve a mostrar. El texto del cómic está dibujado en español; en inglés solo cambian los botones y la descripción accesible.
- **Poses de Stella y Luma** (`guia-visual-2d/personajes/poses/`, de `assets-stella-luma-transparentes.zip`): el script las convierte a WebP en `public/assets/characters/poses/`. En los niveles las poses de reposo alternan por ronda (Stella señala / Luma sostiene su estrella, y al revés con la ficha de Stella y Luma señalando); al mover una pieza el compañero celebra un instante; al acertar celebran con una lluvia de estrellas y corren hacia la siguiente ronda; al equivocarse Stella piensa y Luma señala la mesa; al mostrar la respuesta Stella señala y Luma muestra su ficha. Tocar a Stella repite la consigna en su globo. Tras 9 s sin interacción Luma se pone a pensar y le aparece un foquito encendido encima (señal de que se le puede pedir una pista). Al tocarla da la pista de la ronda (`RoundView.hint`) en el globo de arriba, con su cara en lugar de la de Stella. Botones redondos abajo a la derecha, debajo de Luma (personajes elevados para no taparla): cheque y reiniciar, o cheque y equis en PERTENENCIA.
- **Recompensa:** escena de celebración con tarjeta de estrellas; al encender una estrella nueva, la constelación la anima.
- **Verificado el 12 de octubre de 2026:** 47 pruebas Vitest, `npm run build` y un recorrido en el navegador de la app (Vite dev): acceso, selector, constelación, ELEMENTOS completo hasta la recompensa (con un error, toque y arrastre), PERTENENCIA hasta mostrar la respuesta, SUBCONJUNTOS con un error, primera ronda de UNIÓN, INTERSECCIÓN y DIFERENCIA, inglés y consola sin errores. **No probado:** dispositivo táctil real, APK con los cambios (`npm run android:sync` + `assembleDebug`) ni el catálogo contra `catalog-v2.schema.json` con un validador JSON Schema.
- Las otras imágenes de la guía (`level-concept-counting-table`, `geometry-islands`, `pattern-bridge`) son conceptos de otros temas y no se implementaron.

## Encargo anterior (libGDX + TeaVM, congelado)

Migrar Caza Estelar del formato Android como único destino a una PWA instalable, conservando el núcleo libGDX y el destino Android durante el periodo de validación. No se trata de envolver un APK: el mismo `core` debe ejecutarse en navegador mediante TeaVM.

La migración técnica y el rediseño forman un solo frente. Las pantallas nuevas deben seguir la dirección de Stella, Luma y el selector de `LÓGICA Y CONJUNTOS` descrito abajo. No reconstruir pantallas nuevas alrededor del elenco anterior.

## Estado implementado

- `settings.gradle` incluye `core`, `android` y `web`.
- `web` usa gdx-teavm 1.6.1 con salida JavaScript; GWT queda descartado porque el núcleo contiene Kotlin.
- `WebLauncher` inicia el mismo `CazaEstelarGame` que Android.
- `:web:assemblePwa` genera el juego y agrega `manifest.webmanifest`, service worker, estilos responsive e icono.
- Salida distribuible: `web/build/dist/js/webapp/`.
- Resolución lógica del juego: 1920×1080; el canvas se ajusta al espacio disponible y la aplicación pide orientación horizontal.
- `CatalogIntegrity` usa SHA-256 portable, sin `java.security.MessageDigest`, para permitir la traducción con TeaVM.
- Verificación realizada el 5 de octubre de 2026: `:core:test` y `:web:assemblePwa` exitosos.

Esto comprueba compilación y empaquetado. No equivale todavía a paridad visual/funcional en todos los navegadores; falta una prueba manual completa.

Primera ejecución real en navegador (5 de octubre de 2026, Chromium de escritorio): intro → login funcionan. Fallas corregidas en esa sesión:

- **FreeType en web:** `WebLauncher` precarga `freetype.js` con `config.preloadListener`; sin eso `UiResources` falla con `Module is not defined` y la app queda en negro.
- **Pantalla liberada durante su propio render:** `GameNavigator.switchTo` libera la pantalla anterior con `Gdx.app.postRunnable`. Una navegación lanzada desde una acción scene2d dejaba a `stage.draw()` usando un shader liberado; Android lo toleraba, WebGL lo rechaza.
- **Fondos y logo:** los PNG antiguos de `assets/images/` ya no existían. Ahora el login usa `images/login-observatory-stella-luma.jpg`, el menú `images/menu-terrace-stella-luma.jpg` (recompresiones de `guia-visual/escenarios/`) y la intro `branding/aprendo-logica-intro.png`.
- **Glifos ausentes:** la fuente no tenía `•` (contraseña invisible) ni `⚙`. Se añadió `•` y el engranaje de ajustes se dibuja con `Pixmap` en `UiResources`.

Login rediseñado con la marca: tarjeta clara a la derecha de la escena Stella/Luma, logotipo, etiquetas sobre los campos y botón amarillo. Los estilos están en `ScreenDecor` (`loginCard`, `lightFieldStyle`, `brandButtonStyle`) y los recursos nine-patch en `assets/ui/`. Pendiente: probar teclado virtual en tabletas y teléfonos (los `TextField` de libGDX dibujados en canvas no siempre lo abren).

## Comandos

Desde `caza-estelar/`, con JDK 17:

```powershell
$env:JAVA_HOME = (Resolve-Path '..\.build-tools\jdk\jdk-17.0.20+8').Path
.\gradlew.bat :core:test
.\gradlew.bat :web:assemblePwa
.\gradlew.bat :web:gdx_teavm_web_js_run
```

El servidor de desarrollo usa `http://localhost:8080`. Para despliegue, publicar el contenido completo de `web/build/dist/js/webapp/` sobre HTTPS y con fallback de navegación a `index.html`.

## Decisiones visuales cerradas

### Marca: Aprendo Lógica

Decidido el 5 de octubre de 2026: el producto se llama **Aprendo Lógica** y el nombre "Caza Estelar" desaparece de todo lo que ve el usuario. El nombre no se traduce: en inglés también se muestra "Aprendo Lógica", igual que en el logo.

- **Logo:** una "A" hecha de cuatro piezas de rompecabezas (celeste, amarillo, lila con estrella blanca de cuatro puntas, azul marino) seguida de "prendo" en azul marino redondeado y "LÓGICA" en amarillo espaciado. Variantes: logotipo completo, isotipo "A" grande e isotipo "A" pequeño (icono).
- **Paleta de marca** (muestreada del logo; confirmar con el archivo de diseño cuando exista):
  - Celeste `#8CCDFD`
  - Amarillo `#FEDD76`
  - Lila `#E1A0F1`
  - Azul marino `#072556`
- La estrella de cuatro puntas del logo es el mismo emblema de la frente de Stella; mantener esa coherencia.
- Referencia: `../../images/guia-visual/marca/aprendo-logica-logo-v1.webp` (raster con fondo blanco; no apto todavía como icono instalable).

Alcance del renombrado: solo lo visible (títulos de pantalla, manifiesto PWA, título HTML, etiqueta Android, documentación nueva). Paquetes `com.explorax.cazaestelar`, `applicationId`, clase `CazaEstelarGame`, proyecto Gradle `CazaEstelar` y carpeta `caza-estelar/` se conservan por ahora. Los entregables `.docx` históricos no se reescriben.

### Personajes

Solo Stella y Luma protagonizan las escenas nuevas.

- **Stella:** niña estrella dorada, cabeza/cuerpo de estrella redondeada, rostro amable, pestañas pequeñas, emblema blanco de cuatro puntas en la frente y vestido lavanda sencillo con banda violeta. Evitar vestimenta ceremonial o folclórica.
- **Luma:** niño luna llena blanco/perlado, silueta circular, cráteres suaves, emblema de luna creciente cian en la frente, camisa azul marino común y pantalón azul.
- **Producción:** 2.5D simplificado, siluetas claras, sombreado suave, pocos detalles y piezas fáciles de separar para animación.

Referencias principales:

- `../../images/guia-visual/personajes/stella-luma-presentation.png`
- `../../images/guia-visual/personajes/stella-2-5d-model-sheet.png`
- `../../images/guia-visual/personajes/luma-full-moon-model-sheet.png`
- `../../images/guia-visual/escenarios/explorax-observatory-stella-luma-v1.png`
- `../../images/guia-visual/escenarios/explorax-constellation-stella-luma-v1.png`

Las imágenes están fuera de `assets/` intencionalmente: son guías de diseño y pueden ser pesadas. No copiarlas completas al runtime; antes preparar recortes, atlas y resoluciones adecuadas.

### Navegación de lógica y conjuntos

Pantalla 1, selector general bajo cielo abierto:

1. `CONJUNTOS`
2. `CLASIFICACIÓN`
3. `RELACIONES`
4. `PATRONES`
5. `SECUENCIAS`
6. `RAZONAMIENTO`

Cada grupo es una estrella grande, simple, con título. Todos son accesibles directamente y ninguno bloquea al siguiente.

Pantalla 2, detalle de constelación:

- Al pulsar un grupo se revela una constelación con seis estrellas pequeñas del mismo color/tono que su estrella principal.
- En `CONJUNTOS` los niveles son `ELEMENTOS`, `PERTENENCIA`, `SUBCONJUNTOS`, `UNIÓN`, `INTERSECCIÓN` y `DIFERENCIA`.
- Nivel incompleto: estrella apagada, sin tramo de conexión.
- Nivel completado: estrella encendida.
- El tramo entre dos estrellas solo se dibuja cuando ambas están completadas.
- El progreso no bloquea el acceso: las estrellas apagadas siguen siendo seleccionables.

Referencias principales:

- `../../images/guia-visual/navegacion/logic-sets-theme-selector-v1.png`
- `../../images/guia-visual/navegacion/sets-constellation-levels-v2.png`

## Restricciones técnicas para la PWA

- Mantener el dominio y las reglas en `core`; launchers y detalles de navegador viven en `web`.
- Evitar APIs JVM sin soporte web. Si TeaVM señala una clase ausente, sustituirla por lógica portable o una interfaz con implementación por plataforma.
- Mantener texto y contenido en español e inglés; los rótulos anteriores son nombres canónicos en español, no permiso para eliminar internacionalización.
- El service worker cachea el shell y assets consultados. Esto mejora reinstalación y reingreso, pero no cambia por sí solo la decisión de negocio sobre servicios remotos.
- Audio debe comenzar después de una interacción del usuario en navegadores que aplican autoplay policy.
- Sonido (2026-10-12, `app/src/audio/`): todo se sintetiza con Web Audio, sin archivos. `sound.ts` crea el `AudioContext` con el primer toque o tecla y lo suspende en segundo plano; `music.ts` compone la música generativa (tema `sky` en menús y recompensa, `play` en niveles y `epic` en la constelación: orquesta sintetizada con cuerdas, chelos, metales, timbales y platillo, que entra durante el viaje estelar y, al llegar, cada estrella titila al aparecer (`twinkleStar`), sin golpe fuerte; al cambiar de tema el saliente, con su eco, se opaca en ~0.5 s y se corta antes de que entre el nuevo; además solo suena una pestaña o ventana de la app a la vez: la última que se toca calla a las demás por `BroadcastChannel`) con destellos estelares agudos. Cada transición entre pantallas suena con soplo, glissando y campanita (`whoosh`). Los botones suenan solos (`data-sound="none"` lo evita) y las pantallas piden sus efectos (acierto, error, pista, revelar, estrellas, constelación, viaje estelar, piezas). La preferencia `aprendo-logica.sound` se cambia con el botón de parlante y no redibuja la pantalla. La narración por nivel (`narrationAssetId`) sigue pendiente de archivos de audio.
- Probar al menos Chrome/Edge Android y escritorio, Safari iPad/iPhone y modo instalado. Revisar toque, teclado, resize, cambio de orientación, recuperación de pestaña y pérdida de red.
- No editar `web/build/`; es salida generada.

## Próximos incrementos

1. Completar el recorrido de humo en navegador después del login: mapa, nivel, progreso y recarga. Intro y login ya verificados.
2. Implementar las dos pantallas nuevas de `LÓGICA Y CONJUNTOS` con datos, no posiciones acopladas al catálogo v1.
3. Preparar sprites/atlas optimizados de Stella y Luma a partir de las guías aprobadas.
4. Corregir diferencias de almacenamiento, red, fuentes, audio y ciclo de vida encontradas en navegador.
5. Reemplazar el icono provisional por el isotipo "A" de Aprendo Lógica (SVG o PNG con transparencia desde el archivo de diseño) en 192×192 y 512×512, con variante maskable, y añadir capturas de instalación antes de producción.
6. Añadir pruebas de navegador/Lighthouse y pipeline de despliegue HTTPS.

## Criterio de terminado de la migración

La PWA será el destino principal cuando el recorrido funcional sea equivalente al Android vigente, Stella/Luma y el nuevo selector estén integrados, el progreso sobreviva recargas, el modo instalado pase las pruebas de navegadores objetivo y exista despliegue HTTPS reproducible. Hasta entonces, describir el trabajo como migración en curso y conservar Android como referencia funcional.
