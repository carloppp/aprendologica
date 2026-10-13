import type { KeyValueStorage } from "../progress/progressStore";

const RETURNING_KEY = "aprendo-logica.returning";

/**
 * Registro del dispositivo: solo recuerda si alguien ya entró antes, para saludar con
 * "¡Hola de nuevo!". Nunca guarda el código del estudiante.
 */
export class DeviceEnrollment {
  constructor(private readonly storage: KeyValueStorage) {}

  get returning(): boolean {
    return this.read(RETURNING_KEY) === "1";
  }

  markReturning(): void {
    this.write(RETURNING_KEY, "1");
  }

  private read(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch {
      // Almacenamiento bloqueado: el registro dura solo esta sesión.
    }
  }
}
