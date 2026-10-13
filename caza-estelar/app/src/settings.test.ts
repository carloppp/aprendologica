import { describe, expect, it } from "vitest";
import { AppSettings } from "./settings";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value)
  };
}

describe("preferencia de sonido", () => {
  it("empieza activada si no hay nada guardado", () => {
    expect(new AppSettings(memoryStorage()).soundEnabled).toBe(true);
  });

  it("se recuerda entre sesiones", () => {
    const storage = memoryStorage();
    new AppSettings(storage).soundEnabled = false;
    expect(new AppSettings(storage).soundEnabled).toBe(false);
  });

  it("avisa a los oyentes de sonido sin redibujar la pantalla", () => {
    const settings = new AppSettings(memoryStorage());
    const heard: boolean[] = [];
    let redraws = 0;
    settings.onSoundChange((enabled) => heard.push(enabled));
    settings.onChange(() => redraws++);
    settings.soundEnabled = false;
    expect(heard).toEqual([false]);
    expect(redraws).toBe(0);
  });

  it("sin almacenamiento sigue funcionando", () => {
    const broken = memoryStorage();
    broken.getItem = () => {
      throw new Error("bloqueado");
    };
    broken.setItem = broken.getItem;
    const settings = new AppSettings(broken);
    settings.soundEnabled = false;
    expect(settings.soundEnabled).toBe(false);
  });
});
