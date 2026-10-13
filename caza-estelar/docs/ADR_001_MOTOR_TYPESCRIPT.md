# ADR 001 — Motor: TypeScript web + Capacitor en lugar de libGDX + TeaVM

- **Fecha:** 5 de octubre de 2026
- **Estado:** aceptada por el responsable ("empieza la migración"). Cierra la decisión 2 de `DECISIONES_FASE_0.md`, con una validación de rendimiento pendiente (ver *Riesgos*).
- **Código:** `caza-estelar/app/`

## Contexto

- El destino principal pasó a ser una PWA, pero el producto también debe distribuirse como APK.
- La decisión 3 fija el modo **solo online**. Con eso desaparece la principal ventaja de un motor nativo: funcionar sin conexión y con rendimiento en el dispositivo.
- La aplicación administrativa ya es React + TypeScript con backend NestJS (decisión 8).
- El prototipo libGDX es pequeño: unas 4 900 líneas en Java y Kotlin. Sus pantallas se iban a rehacer de todos modos para Stella, Luma y el selector `LÓGICA Y CONJUNTOS`.
- La ruta libGDX → TeaVM compilaba, pero tenía tres costos: depuración difícil, paquete pesado, y texto, formularios y accesibilidad resueltos a mano dentro de un canvas.

## Decisión

Reescribir el cliente en **TypeScript**, con una sola base de código para ambos destinos:

| Pieza | Elección |
|---|---|
| Lenguaje | TypeScript (modo estricto) |
| Build / servidor de desarrollo | Vite |
| Pruebas | Vitest |
| UI de menús, login y niveles | DOM y CSS sobre un escenario lógico de 1920×1080 escalado (equivalente a `FitViewport`) |
| PWA | `manifest.webmanifest` + `service-worker.js` propio |
| APK | Capacitor 8: empaqueta `dist/` dentro del APK, de modo que el catálogo viaja en la APK (decisión 3) |
| `applicationId` | `com.explorax.cazaestelar` (se conserva) |

Las mecánicas que necesiten animación intensa (por ejemplo, `telescope_hunt`) podrán usar Canvas, PixiJS o Phaser **dentro** de una pantalla, sin cambiar la arquitectura.

## Consecuencias

- El contrato v2 (modelos, parser, `LevelValidator`, `CatalogValidatorV2`) y el progreso v2 se portaron a `app/src/content` y `app/src/progress`, con las mismas pruebas. A futuro pueden compartirse con el backend NestJS como paquete.
- `core/`, `android/` y `web/` (libGDX/TeaVM) quedan **congelados como referencia funcional**. No se borran hasta alcanzar la paridad y recibir una solicitud explícita.
- Toolchain: Node 24 + npm para la web. Para el APK hacen falta JDK 21 y Android SDK 36, porque Capacitor 8 no compila con JDK 17. Ver `ENTORNO.md`.

## Riesgos y validación pendiente

1. Medir el rendimiento en una tableta Android de gama baja (fluidez, memoria y tiempo de arranque) con el APK de debug.
2. Portar `telescope_hunt`. Mientras tanto no está instalada en la app TypeScript y el validador la rechaza.
3. El icono del APK es todavía el de Capacitor por defecto; el de la PWA es el provisional.
