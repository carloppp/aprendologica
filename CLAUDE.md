# Aprendo Lógica (antes Caza Estelar) — raíz de traspaso

El producto se llama ahora **Aprendo Lógica** (antes Caza Estelar; la carpeta y los paquetes conservan el nombre anterior). El proyecto ejecutable está en `caza-estelar/`. Desde el 2026-10-05 (`caza-estelar/docs/ADR_001_MOTOR_TYPESCRIPT.md`), el cliente nuevo está en `caza-estelar/app/`: TypeScript + Vite para la PWA y Capacitor para el APK. El código libGDX + TeaVM queda como referencia funcional. Antes de trabajar en código, lee `caza-estelar/CLAUDE.md`, `caza-estelar/docs/INDICE_DOCUMENTACION.md` y `caza-estelar/docs/PWA_MIGRATION.md`.

Estado del traspaso (2026-09-07): repositorio Git en esta raíz (rama `main`); toolchain embebido en `.build-tools/` (no versionado); decisiones de producto cerradas en `caza-estelar/docs/DECISIONES_FASE_0.md`; hoja de ruta en `caza-estelar/docs/PLAN_DESARROLLO.md`. La carpeta ejecutable se llamaba antes `Nueva carpeta/`.

Esta raíz también contiene entregables históricos y sus fuentes:

- `Informe_de_avances_Caza_Estelar.docx`, `Avance_solicitado_Caza_Estelar.docx` y `Evaluacion_tecnica_Caza_Estelar_TypeScript_7.docx`.
- Scripts `build_*.py` que generan o apoyan esos documentos.
- Directorios `qa_*` y `.docx_qa_*` usados para control visual/documental.
- `prototipo-admin-console.html`, prototipo independiente de la futura consola.
- APK históricos `CazaEstelar-*.apk`; no asumir que reflejan el código actual.

Reglas:

- No borrar, regenerar ni mover binarios o artefactos históricos sin una solicitud explícita.
- No tratar los APK como fuente; la fuente ejecutable está bajo `caza-estelar/core`, `caza-estelar/android`, `caza-estelar/web` y `caza-estelar/assets`.
- No editar un `.docx` generado sin revisar primero el script fuente correspondiente.
- No incluir secretos, keystores, credenciales ni datos personales de menores.
- Para tareas del juego, trabajar desde `caza-estelar/` y seguir su `CLAUDE.md` más específico.
