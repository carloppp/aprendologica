import type { KeyValueStorage } from "../progress/progressStore";

/**
 * Recuerda, por jugador y por historia, si ya vio cada cómic (`intro`, `conjuntos`…). Usa la misma
 * clave opaca del progreso, así que no guarda el código del estudiante.
 */
export class StoryProgress {
  constructor(private readonly storage: KeyValueStorage) {}

  hasSeen(playerKey: string, storyId: string): boolean {
    try {
      return this.storage.getItem(this.key(playerKey, storyId)) === "1";
    } catch {
      return false;
    }
  }

  markSeen(playerKey: string, storyId: string): void {
    try {
      this.storage.setItem(this.key(playerKey, storyId), "1");
    } catch {
      // Almacenamiento bloqueado: la historia se volverá a mostrar la próxima vez.
    }
  }

  private key(playerKey: string, storyId: string): string {
    return `aprendo-logica.story.v1.${storyId}.${playerKey}`;
  }
}
