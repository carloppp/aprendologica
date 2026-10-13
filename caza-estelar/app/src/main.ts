import "./styles.css";
import { Capacitor } from "@capacitor/core";
import { createApp } from "./app";
import { sound } from "./audio/sound";
import { loadingScreen } from "./screens/loading";
import { LocalDevelopmentAuthenticationService } from "./session/authentication";
import { DeviceEnrollment } from "./session/deviceEnrollment";
import { AppSettings, safeLocalStorage } from "./settings";
import { mountStage } from "./ui/stage";

const settings = new AppSettings();
document.documentElement.lang = settings.language;

// Audio: el navegador solo lo deja sonar tras un gesto, así que el primer toque o tecla lo despierta.
sound.setEnabled(settings.soundEnabled);
settings.onSoundChange((enabled) => sound.setEnabled(enabled));
for (const type of ["pointerdown", "keydown"] as const) {
  window.addEventListener(type, () => sound.unlock(), { capture: true, passive: true });
}
// Todo botón suena al tocarlo, salvo los que tienen su propio sonido (`data-sound="none"`).
document.addEventListener(
  "click",
  (event) => {
    const button = (event.target as Element | null)?.closest?.("button");
    if (button && !button.disabled && button.dataset.sound !== "none") sound.play("tap");
  },
  { capture: true }
);
document.addEventListener("visibilitychange", () => sound.setHidden(document.visibilityState === "hidden"));

const storage = safeLocalStorage() ?? { getItem: () => null, setItem: () => undefined };
const app = createApp(
  mountStage(document.getElementById("root")!),
  settings,
  new LocalDevelopmentAuthenticationService(),
  new DeviceEnrollment(storage)
);
app.go(loadingScreen);

// En el APK los archivos ya vienen empaquetados; el service worker solo aplica a la PWA.
if ("serviceWorker" in navigator && !Capacitor.isNativePlatform() && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => undefined);
  });
}
