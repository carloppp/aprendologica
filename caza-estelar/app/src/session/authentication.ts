import type { LocalizedText } from "../content/model";
import { playerKeyFor } from "../progress/progressStore";

/** Sesión del estudiante. No guarda el código del estudiante, solo una clave opaca derivada. */
export interface PlayerSession {
  playerKey: string;
}

export type Failure = { ok: false; message: LocalizedText };
export type AuthenticationResult = { ok: true; session: PlayerSession } | Failure;

/** Acceso con un solo código, el del estudiante (guía visual 2D, `inicio-sesion-codigo-visible-v3`). */
export interface AuthenticationService {
  signIn(studentCode: string): Promise<AuthenticationResult>;
  signOut(): void;
}

export const CODE_MAX_LENGTH = 8;

/** Jugador local cuando se entra sin escribir código. */
export const GUEST_CODE = "INVITADO";

/** Mayúsculas sin espacios ni signos: "astro 6" y "ASTRO6" son el mismo código. */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CODE_MAX_LENGTH);
}

/**
 * Acceso solo local, para desarrollo: pulsar ENTRAR siempre da acceso. El código es opcional y solo
 * separa el progreso de cada estudiante en el dispositivo; sin código se usa un jugador invitado.
 * La release debe reemplazarlo por el cliente HTTPS del backend (decisión 8).
 */
export class LocalDevelopmentAuthenticationService implements AuthenticationService {
  async signIn(studentCode: string): Promise<AuthenticationResult> {
    const student = normalizeCode(studentCode) || GUEST_CODE;
    return { ok: true, session: { playerKey: playerKeyFor(student) } };
  }

  signOut(): void {}
}
