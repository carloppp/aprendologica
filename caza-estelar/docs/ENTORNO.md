# Entorno de desarrollo — Caza Estelar

Actualizado: 7 de septiembre de 2026.

## Repositorio

- Git inicializado en la raíz `Caza Estelar/` (rama `main`), abarcando el proyecto ejecutable
  (`caza-estelar/`) y los entregables históricos.
- `.gitignore` en la raíz excluye: `**/build/`, `.gradle/`, `.build-tools/`, APK/AAB, `.docx`
  generados, `local.properties`, snapshots de QA visual y secretos.
- La carpeta ejecutable pasó de `Nueva carpeta/` a `caza-estelar/`.

## Toolchain embebido

El repositorio incluye un toolchain completo bajo `.build-tools/` (no versionado). Ya no es
necesario instalar nada en el `PATH` para compilar desde la línea de comandos.

| Herramienta | Ruta | Versión |
|---|---|---|
| JDK 17 | `.build-tools/jdk/jdk-17.0.20+8` | Temurin 17.0.20+8 (proyecto libGDX) |
| JDK 21 | `.build-tools/jdk/jdk-21.0.12.1+1` | Temurin 21.0.12.1+1 (APK Capacitor de `app/`) |
| Android SDK | `.build-tools/android-sdk` | platforms `android-35` y `android-36`, build-tools `35.0.0`, platform-tools con `adb` |
| Gradle (referencia) | `.build-tools/gradle/gradle-8.9` | 8.9 |
| Node.js / npm | instalado en el sistema (`PATH`) | Node 24.19, npm 11.17 |

## Cliente TypeScript (`app/`, ADR 001)

Desde `caza-estelar/app/`:

```powershell
npm install                 # primera vez
npm run dev                 # servidor de desarrollo (http://localhost:5173)
npm test                    # pruebas Vitest (contrato v2, progreso, sesión, catálogo publicado)
npm run build               # typecheck + PWA en app/dist/
npm run preview             # sirve dist/ con service worker (http://localhost:4173)

# APK de depuración (Capacitor 8 requiere JDK 21 y compileSdk 36)
$env:JAVA_HOME = "$PWD\..\..\.build-tools\jdk\jdk-21.0.12.1+1"
$env:ANDROID_HOME = "$PWD\..\..\.build-tools\android-sdk"
npm run android:sync        # build web + copia a android/
cd android; .\gradlew.bat assembleDebug   # app/android/app/build/outputs/apk/debug/app-debug.apk
```

Para publicar la PWA, subir `app/dist/` completo a un host HTTPS. No editar
`app/android/app/src/main/assets/public/`: `cap sync` la regenera.

`caza-estelar/local.properties` (no versionado) apunta `sdk.dir` al SDK embebido. Android Studio
lo regenera con el SDK local de cada máquina.

## Compilar y probar

Desde `caza-estelar/`, con las variables de entorno apuntando al toolchain embebido:

```bash
export JAVA_HOME="$PWD/../.build-tools/jdk/jdk-17.0.20+8"
export ANDROID_HOME="$PWD/../.build-tools/android-sdk"

./gradlew :core:test                          # pruebas unitarias e integración del catálogo
./gradlew :android:assembleDebug              # APK de depuración
./gradlew :android:verifyProductionConfiguration   # ver nota abajo
```

En Windows PowerShell:

```powershell
$env:JAVA_HOME = "$PWD\..\.build-tools\jdk\jdk-17.0.20+8"
$env:ANDROID_HOME = "$PWD\..\.build-tools\android-sdk"
.\gradlew.bat :core:test
```

El Gradle Wrapper (`gradlew`, `gradlew.bat`, `gradle/wrapper/`) está fijado a Gradle 8.9,
compatible con AGP 8.7.3. La primera ejecución descarga la distribución de Gradle y las
dependencias.

### `verifyProductionConfiguration`

Esta tarea **falla a propósito** mientras `assets/network/services.json` tenga
`developmentMode: true` y `assets/content/source.json` tenga `remoteEnabled: false`. Es el
bloqueo de release descrito en `RELEASE_CHECKLIST.md`, no un error del entorno.

## Android Studio

Abrir la carpeta `caza-estelar/` directamente. Sincronizar Gradle y ejecutar el módulo
`android` en un dispositivo o emulador API 26+.
