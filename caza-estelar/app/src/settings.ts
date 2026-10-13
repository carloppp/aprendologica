import type { LocalizedText } from "./content/model";

export type Language = "es" | "en";

const LANGUAGE_KEY = "aprendo-logica.language";
const SOUND_KEY = "aprendo-logica.sound";

/**
 * Preferencias del dispositivo. El idioma y el sonido se recuerdan; si el almacenamiento falla, se
 * usa español con sonido activado.
 */
export class AppSettings {
  private current: Language;
  private sound: boolean;
  private readonly listeners = new Set<() => void>();
  private readonly soundListeners = new Set<(enabled: boolean) => void>();

  constructor(private readonly storage: Storage | undefined = safeLocalStorage()) {
    this.current = this.read() ?? (navigator.language.toLowerCase().startsWith("en") ? "en" : "es");
    this.sound = this.readItem(SOUND_KEY) !== "off";
  }

  get soundEnabled(): boolean {
    return this.sound;
  }

  /** Cambiar el sonido no redibuja la pantalla (no reinicia un nivel en curso). */
  set soundEnabled(value: boolean) {
    this.sound = value;
    this.writeItem(SOUND_KEY, value ? "on" : "off");
    this.soundListeners.forEach((listener) => listener(value));
  }

  onSoundChange(listener: (enabled: boolean) => void): () => void {
    this.soundListeners.add(listener);
    return () => this.soundListeners.delete(listener);
  }

  get language(): Language {
    return this.current;
  }

  set language(value: Language) {
    this.current = value;
    this.writeItem(LANGUAGE_KEY, value);
    document.documentElement.lang = value;
    this.listeners.forEach((listener) => listener());
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Texto en el idioma activo; cae a español si falta la traducción. */
  t(text: LocalizedText): string {
    return this.current === "en" && text.en.trim() !== "" ? text.en : text.es;
  }

  private read(): Language | undefined {
    const value = this.readItem(LANGUAGE_KEY);
    return value === "es" || value === "en" ? value : undefined;
  }

  private readItem(key: string): string | null | undefined {
    try {
      return this.storage?.getItem(key);
    } catch {
      return undefined;
    }
  }

  private writeItem(key: string, value: string): void {
    try {
      this.storage?.setItem(key, value);
    } catch {
      // Sin almacenamiento: el cambio dura solo esta sesión.
    }
  }
}

export function safeLocalStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
