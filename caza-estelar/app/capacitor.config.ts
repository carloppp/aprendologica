import type { CapacitorConfig } from "@capacitor/cli";

// El applicationId se conserva para que el APK nuevo actualice al instalado (ver PWA_MIGRATION.md).
const config: CapacitorConfig = {
  appId: "com.explorax.cazaestelar",
  appName: "Aprendo Lógica",
  webDir: "dist",
  android: {
    allowMixedContent: false
  }
};

export default config;
