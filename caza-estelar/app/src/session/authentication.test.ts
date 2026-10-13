import { describe, expect, it } from "vitest";
import { LocalDevelopmentAuthenticationService, normalizeCode } from "./authentication";
import { DeviceEnrollment } from "./deviceEnrollment";

describe("LocalDevelopmentAuthenticationService", () => {
  const auth = new LocalDevelopmentAuthenticationService();

  it("normalizes codes", () => {
    expect(normalizeCode(" astro 6 ")).toBe("ASTRO6");
    expect(normalizeCode("ab-12")).toBe("AB12");
  });

  it("always grants access, using a guest player without a code", async () => {
    const guest = await auth.signIn("");
    const again = await auth.signIn("   ");
    expect(guest.ok && again.ok).toBe(true);
    if (guest.ok && again.ok) expect(guest.session.playerKey).toBe(again.session.playerKey);
  });

  it("derives an opaque player key from the student code", async () => {
    const first = await auth.signIn("luna 7");
    const again = await auth.signIn("LUNA7");
    const other = await auth.signIn("SOL3");
    expect(first.ok && again.ok && other.ok).toBe(true);
    if (!first.ok || !again.ok || !other.ok) return;
    expect(first.session.playerKey).toBe(again.session.playerKey);
    expect(first.session.playerKey).not.toBe(other.session.playerKey);
    expect(first.session.playerKey).not.toContain("LUNA7");
  });
});

describe("DeviceEnrollment", () => {
  const memory = () => {
    const values = new Map<string, string>();
    return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => void values.set(key, value) };
  };

  it("remembers returning players", () => {
    const enrollment = new DeviceEnrollment(memory());
    expect(enrollment.returning).toBe(false);
    enrollment.markReturning();
    expect(enrollment.returning).toBe(true);
  });

  it("survives blocked storage", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    const enrollment = new DeviceEnrollment(blocked);
    enrollment.markReturning();
    expect(enrollment.returning).toBe(false);
  });
});
