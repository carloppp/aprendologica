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
| JDK | `.build-tools/jdk/jdk-17.0.20+8` | Temurin 17.0.20+8 |
| Android SDK | `.build-tools/android-sdk` | platform `android-35`, build-tools `35.0.0`, platform-tools con `adb` |
| Gradle (referencia) | `.build-tools/gradle/gradle-8.9` | 8.9 |

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
