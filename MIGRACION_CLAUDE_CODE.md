# Paquete de traspaso a Claude Code

El contexto operativo está en:

- `CLAUDE.md`: mapa de esta carpeta y límites de seguridad.
- `caza-estelar/CLAUDE.md`: instrucciones completas del proyecto Android.
- `caza-estelar/docs/INDICE_DOCUMENTACION.md`: inventario y autoridad de la documentación.
- `caza-estelar/docs/MIGRACION_A_CLAUDE_CODE.md`: diagnóstico, riesgos y secuencia de migración.
- `caza-estelar/docs/PWA_MIGRATION.md`: destino PWA vigente, personajes, navegación y estado verificable.
- `caza-estelar/docs/DECISIONES_FASE_0.md`: decisiones de producto cerradas (2026-09-07).
- `caza-estelar/docs/ENTORNO.md`: toolchain embebido y comandos de compilación.
- `caza-estelar/docs/PLAN_DESARROLLO.md`: hoja de ruta por fases.

Para comenzar, abrir una terminal en la raíz `Caza Estelar/`, iniciar Claude Code y confirmar
con `/memory` que cargó `CLAUDE.md`.

## Estado del traspaso (2026-09-07)

- **Fase 0 (decisiones):** cerrada. Ver `caza-estelar/docs/DECISIONES_FASE_0.md`.
- **Fase 1 (reproducibilidad):** ejecutada.
  - Repositorio Git en esta raíz, rama `main`, con `.gitignore`.
  - Carpeta `Nueva carpeta/` renombrada a `caza-estelar/`.
  - Gradle Wrapper fijado a Gradle 8.9 (compatible con AGP 8.7.3).
  - Toolchain embebido en `.build-tools/` (JDK 17, Android SDK 35, `adb`); no versionado.
- **Pendiente:** confirmar la línea base de pruebas/compilación y el primer commit; iniciar la
  Fase 2 (contrato v2 local en la app).

Actualización 2026-10-05: la aplicación ya tiene un módulo `web` TeaVM y un ensamblado PWA verificable. Android se conserva durante la migración. Leer `caza-estelar/docs/PWA_MIGRATION.md` antes de continuar trabajo de plataforma o interfaz.
