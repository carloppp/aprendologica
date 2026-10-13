import { describe, expect, it } from "vitest";
import { composeBar, midiToHz, THEMES, type MusicTheme } from "./music";

/** Generador repetible para que las pruebas no dependan del azar. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe("música generativa", () => {
  it("convierte notas MIDI a frecuencia", () => {
    expect(midiToHz(69)).toBeCloseTo(440);
    expect(midiToHz(60)).toBeCloseTo(261.63, 1);
  });

  for (const theme of ["sky", "play", "epic"] as MusicTheme[]) {
    it(`el tema ${theme} recorre su ciclo de acordes`, () => {
      const chords = THEMES[theme].chords;
      expect(composeBar(theme, 0, seeded(1)).pad).toEqual(chords[0]);
      expect(composeBar(theme, chords.length + 1, seeded(1)).pad).toEqual(chords[1]);
    });

    it(`el tema ${theme} mantiene melodía y destellos dentro del compás y de la escala`, () => {
      const definition = THEMES[theme];
      const random = seeded(42);
      for (let bar = 0; bar < 200; bar++) {
        const result = composeBar(theme, bar, random);
        expect(result.melody.length).toBeLessThanOrEqual(definition.melodyNotes[1]);
        expect(result.twinkles.length).toBeLessThanOrEqual(definition.twinkles[1]);
        for (const note of result.melody) {
          expect(definition.scale).toContain(note.midi);
          expect(note.beat).toBeGreaterThanOrEqual(0);
          expect(note.beat + note.length).toBeLessThanOrEqual(definition.beatsPerBar);
        }
        for (const note of result.twinkles) {
          expect(definition.sparkleScale).toContain(note.midi);
          expect(note.beat).toBeLessThan(definition.beatsPerBar);
        }
        const beats = result.melody.map((it) => it.beat);
        expect(beats).toEqual([...new Set(beats)].sort((a, b) => a - b));
      }
    });
  }

  it("el tema épico lleva chelos, timbales y un platillo al cerrar cada ciclo", () => {
    const random = seeded(7);
    const bars = Array.from({ length: 8 }, (_, i) => composeBar("epic", i, random));
    expect(bars.every((bar) => bar.ostinato.length === 8)).toBe(true);
    expect(bars.map((bar) => bar.cymbal)).toEqual([false, false, false, true, false, false, false, true]);
    expect(bars[3]!.timpani.length).toBeGreaterThan(bars[0]!.timpani.length);
    expect(bars.flatMap((bar) => bar.timpani).every((hit) => hit.midi === 38 || hit.midi === 45)).toBe(true);
    expect(composeBar("sky", 0, seeded(1)).ostinato).toEqual([]);
  });

  it("solo el tema de juego lleva arpegio de fondo", () => {
    expect(composeBar("sky", 0, seeded(3)).plucks).toEqual([]);
    expect(composeBar("play", 0, seeded(3)).plucks).toHaveLength(8);
  });
});
