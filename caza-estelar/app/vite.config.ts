import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

const SERVICE_WORKER = "service-worker.js";
const CACHE_PLACEHOLDER = "__CACHE_VERSION__";

function filesUnder(folder: string): string[] {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

/**
 * Versión de la caché del service worker calculada del contenido publicado: si cambia cualquier
 * archivo (una imagen con el mismo nombre, el catálogo, el código), cambia la versión y los
 * dispositivos descartan la caché anterior. Sin cambios, la versión se mantiene.
 */
function serviceWorkerCacheVersion(version: string): Plugin {
  let outDir = "dist";
  return {
    name: "service-worker-cache-version",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const workerPath = join(outDir, SERVICE_WORKER);
      const hash = createHash("sha256");
      for (const file of filesUnder(outDir).filter((it) => it !== workerPath).sort()) {
        hash.update(relative(outDir, file).replaceAll("\\", "/"));
        hash.update(readFileSync(file));
      }
      const id = `${version}-${hash.digest("hex").slice(0, 10)}`;
      const source = readFileSync(workerPath, "utf8");
      if (!source.includes(CACHE_PLACEHOLDER)) throw new Error(`${SERVICE_WORKER} no contiene ${CACHE_PLACEHOLDER}`);
      writeFileSync(workerPath, source.replaceAll(CACHE_PLACEHOLDER, id));
    }
  };
}

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

// `base: "./"` permite servir la misma salida desde un dominio HTTPS y desde el WebView de Capacitor.
export default defineConfig({
  base: "./",
  plugins: [serviceWorkerCacheVersion(version)],
  build: {
    outDir: "dist",
    target: "es2020",
    assetsInlineLimit: 0
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
