import { mergeProgress, type LevelProgress } from "./levelProgress";

/** Almacenamiento clave/valor mínimo; en el navegador es `localStorage`, en pruebas un mapa. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Progreso local por jugador. La decisión 3 (solo online) envía resultados al backend cuando
 * exista; mientras tanto el progreso local hace que sobreviva a recargas. No hay cola offline.
 */
export class ProgressStore {
  constructor(
    private readonly storage: KeyValueStorage,
    private readonly playerKey: string
  ) {}

  all(): Record<string, LevelProgress> {
    try {
      const raw = this.storage.getItem(this.key());
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? (parsed as Record<string, LevelProgress>) : {};
    } catch {
      return {};
    }
  }

  get(levelId: string): LevelProgress | undefined {
    return this.all()[levelId];
  }

  record(incoming: LevelProgress): LevelProgress {
    const entries = this.all();
    const merged = mergeProgress(entries[incoming.levelId], incoming);
    entries[incoming.levelId] = merged;
    try {
      this.storage.setItem(this.key(), JSON.stringify(entries));
    } catch {
      // Almacenamiento bloqueado (modo privado): el progreso vive solo en esta sesión.
    }
    return merged;
  }

  private key(): string {
    return `aprendo-logica.progress.v2.${this.playerKey}`;
  }
}

/** Clave opaca por jugador (FNV-1a de 32 bits) para no guardar su identificador en el almacenamiento. */
export function playerKeyFor(identity: string): string {
  let hash = 0x811c9dc5;
  for (const char of identity.trim().toLowerCase()) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
