import { sound } from "./audio/sound";
import type { ContentCatalog } from "./content/model";
import type { ProgressStore } from "./progress/progressStore";
import type { AuthenticationService, PlayerSession } from "./session/authentication";
import type { DeviceEnrollment } from "./session/deviceEnrollment";
import type { AppSettings } from "./settings";

/** Una pantalla dibuja su contenido en el escenario y devuelve una limpieza opcional. */
export type Screen = (stage: HTMLElement, app: App) => void | (() => void);

export interface App {
  readonly settings: AppSettings;
  readonly auth: AuthenticationService;
  readonly enrollment: DeviceEnrollment;
  catalog?: ContentCatalog;
  session?: PlayerSession;
  progress?: ProgressStore;
  go(screen: Screen): void;
}

const TRANSITION_MS = 650;

/**
 * Navegador mínimo: reemplaza la pantalla actual con una transición (la nueva se abre en un
 * círculo de luz sobre la anterior) y la redibuja sin transición al cambiar el idioma.
 */
export function createApp(stage: HTMLElement, settings: AppSettings, auth: AuthenticationService, enrollment: DeviceEnrollment): App {
  let current: Screen | undefined;
  let cleanup: void | (() => void);
  let removal = 0;

  const render = (animate: boolean) => {
    if (!current) return;
    if (typeof cleanup === "function") cleanup();
    // Una navegación rápida descarta de inmediato la pantalla que aún se estaba yendo.
    window.clearTimeout(removal);
    stage.querySelectorAll(":scope > .is-leaving").forEach((it) => it.remove());
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const leaving = [...stage.children];
    if (!animate || reduced || leaving.length === 0) {
      stage.replaceChildren();
      cleanup = current(stage, app);
      return;
    }
    sound.play("whoosh");
    leaving.forEach((it) => {
      it.classList.add("is-leaving");
      it.setAttribute("aria-hidden", "true");
      it.setAttribute("inert", "");
    });
    cleanup = current(stage, app);
    const entering = [...stage.children].filter((it) => !leaving.includes(it));
    entering.forEach((it) => it.classList.add("is-entering"));
    stage.append(Object.assign(document.createElement("div"), { className: "transition-flare" }));
    removal = window.setTimeout(() => {
      leaving.forEach((it) => it.remove());
      entering.forEach((it) => it.classList.remove("is-entering"));
      stage.querySelectorAll(":scope > .transition-flare").forEach((it) => it.remove());
    }, TRANSITION_MS);
  };

  const app: App = {
    settings,
    auth,
    enrollment,
    go(screen) {
      current = screen;
      render(true);
    }
  };
  settings.onChange(() => render(false));
  return app;
}
