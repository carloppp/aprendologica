/**
 * Composición de la música generativa: cada compás se arma a partir de un ciclo de acordes y
 * notas pentatónicas elegidas al azar, así la música nunca se repite igual pero siempre suena
 * consonante. Este módulo no toca Web Audio; solo decide qué notas suenan y cuándo.
 */

export type MusicTheme = "sky" | "play" | "epic" | "observatory" | "islands";

/** Nota MIDI en un tiempo del compás (0 = inicio; puede tener medios tiempos). */
export interface BeatNote {
  beat: number;
  midi: number;
}

export interface MelodyNote extends BeatNote {
  /** Duración en tiempos. */
  length: number;
}

export interface Bar {
  /** Notas del colchón armónico; suenan todo el compás. */
  pad: number[];
  bass: BeatNote[];
  /** Arpegio suave de fondo (solo en el tema de juego). */
  plucks: BeatNote[];
  melody: MelodyNote[];
  /** Destellos estelares: notas muy agudas y lejanas. */
  twinkles: BeatNote[];
  /** Corcheas cortas de chelos (solo en el tema orquestal). */
  ostinato: BeatNote[];
  /** Golpes de timbal; `midi` es la afinación del parche. */
  timpani: BeatNote[];
  /** Platillo que crece hacia el inicio de un nuevo ciclo de acordes. */
  cymbal: boolean;
}

export interface ThemeDefinition {
  /** `soft`: colchón y caja de música; `orchestra`: cuerdas, metales y timbales. */
  style: "soft" | "orchestra";
  bpm: number;
  beatsPerBar: number;
  chords: number[][];
  /** Escala de la melodía (MIDI). */
  scale: number[];
  /** Escala aguda de los destellos (MIDI). */
  sparkleScale: number[];
  melodyNotes: [min: number, max: number];
  twinkles: [min: number, max: number];
  /** Tiempos del bajo en cada compás (por defecto, solo el primero). */
  bassBeats?: number[];
  /**
   * Acompañamiento: `arpeggio` corcheas que suben, `updown` corcheas que suben y bajan,
   * `bounce` "um-pa-pa" (acorde en los tiempos débiles). Sin valor, no hay acompañamiento.
   */
  plucks?: "arpeggio" | "updown" | "bounce";
  /** Timbre de melodía y acompañamiento: caja de música, campanas de cristal o flauta. */
  voice?: "musicbox" | "bells" | "flute";
}

// Do mayor pentatónico: do, re, mi, sol, la. Cualquier combinación suena bien sobre los acordes.
const PENTATONIC = [0, 2, 4, 7, 9];
// Re menor pentatónico (re, fa, sol, la, do): suena heroico sobre Dm, B♭, F y C.
const MINOR_PENTATONIC = [0, 3, 5, 7, 10];
const scaleFrom = (roots: number[], steps = PENTATONIC) => roots.flatMap((root) => steps.map((step) => root + step));

export const THEMES: Record<MusicTheme, ThemeDefinition> = {
  // Menús y cielo: lento y soñador (Cmaj9, Am9, Fmaj7, G6sus).
  sky: {
    style: "soft",
    bpm: 64,
    beatsPerBar: 4,
    chords: [
      [48, 55, 64, 71, 74],
      [45, 52, 60, 67, 71],
      [41, 48, 57, 64, 69],
      [43, 50, 59, 64, 69]
    ],
    scale: scaleFrom([72, 84]),
    sparkleScale: scaleFrom([88, 100]),
    melodyNotes: [1, 3],
    twinkles: [1, 3]
  },
  // Niveles: un poco más ágil pero discreto, para no distraer (Fmaj7, G6, Em7, Am7).
  play: {
    style: "soft",
    bpm: 88,
    beatsPerBar: 4,
    chords: [
      [41, 53, 57, 60, 64],
      [43, 55, 59, 62, 64],
      [40, 52, 55, 59, 62],
      [45, 57, 60, 64, 67]
    ],
    scale: scaleFrom([72]),
    sparkleScale: scaleFrom([91]),
    melodyNotes: [0, 2],
    twinkles: [0, 2],
    bassBeats: [0, 2],
    plucks: "arpeggio"
  },
  // Niveles de CONJUNTOS, en el observatorio: curioso y pensativo, como un laboratorio de estrellas.
  // Acordes lidios (Cmaj7♯11, D/C, Em7, Bm7) con campanas de cristal que suben y bajan y muchos
  // destellos, como el cielo del ventanal.
  observatory: {
    style: "soft",
    bpm: 76,
    beatsPerBar: 4,
    chords: [
      [48, 55, 62, 66, 71],
      [48, 57, 62, 66, 69],
      [40, 55, 59, 62, 67],
      [47, 54, 59, 62, 66]
    ],
    // Sol mayor pentatónico (sol, la, si, re, mi): consonante sobre los cuatro acordes.
    scale: scaleFrom([79]),
    sparkleScale: scaleFrom([91, 103]),
    melodyNotes: [0, 2],
    twinkles: [1, 3],
    plucks: "updown",
    voice: "bells"
  },
  // Niveles de PATRONES, en las islas flotantes: juguetón y saltarín, en vals (3/4) y en fa mayor,
  // con "um-pa-pa" de baldosas y una melodía de flauta (F, B♭, Gm7, C).
  islands: {
    style: "soft",
    bpm: 108,
    beatsPerBar: 3,
    chords: [
      [41, 53, 57, 60, 65],
      [46, 53, 58, 62, 65],
      [43, 55, 58, 62, 65],
      [48, 55, 60, 64, 67]
    ],
    // Fa mayor pentatónico (fa, sol, la, do, re).
    scale: scaleFrom([77]),
    sparkleScale: scaleFrom([89]),
    melodyNotes: [1, 3],
    twinkles: [0, 1],
    plucks: "bounce",
    voice: "flute"
  },
  // Constelación: orquestal y épico (Dm, B♭, F, C). La primera nota de cada acorde es el contrabajo.
  epic: {
    style: "orchestra",
    bpm: 76,
    beatsPerBar: 4,
    chords: [
      [38, 50, 57, 62, 65, 69],
      [34, 50, 58, 62, 65, 70],
      [41, 53, 57, 60, 65, 69],
      [36, 52, 55, 60, 64, 67]
    ],
    scale: scaleFrom([62, 74], MINOR_PENTATONIC),
    sparkleScale: scaleFrom([86, 98], MINOR_PENTATONIC),
    melodyNotes: [1, 2],
    twinkles: [0, 2]
  }
};

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function secondsPerBeat(theme: MusicTheme): number {
  return 60 / THEMES[theme].bpm;
}

const pick = <T>(items: readonly T[], random: () => number): T => items[Math.floor(random() * items.length)]!;
const between = ([min, max]: [number, number], random: () => number) => min + Math.floor(random() * (max - min + 1));

/** Arma el compás `index` del tema. `random` devuelve valores en [0, 1). */
export function composeBar(theme: MusicTheme, index: number, random: () => number = Math.random): Bar {
  const definition = THEMES[theme];
  const chord = definition.chords[index % definition.chords.length]!;
  const beats = definition.beatsPerBar;
  // Posiciones en medios tiempos, sin repetir, ordenadas.
  const slots = (count: number) =>
    [...new Set(Array.from({ length: count }, () => Math.floor(random() * beats * 2) / 2))].sort((a, b) => a - b);

  const root = chord[0]!;
  if (definition.style === "orchestra") return composeOrchestraBar(definition, chord, index, random, slots);
  // Bajo en la raíz; los demás tiempos del bajo, en la quinta de abajo.
  const bass: BeatNote[] = (definition.bassBeats ?? [0]).map((beat, i) => ({ beat, midi: i === 0 ? root - 12 : root - 5 }));
  const upper = chord.slice(1).map((midi) => midi + 12);
  const updown = [...upper, ...upper.slice(1, -1).reverse()];
  const plucks: BeatNote[] =
    definition.plucks === "arpeggio"
      ? Array.from({ length: beats * 2 }, (_, i) => ({ beat: i / 2, midi: upper[i % upper.length]! }))
      : definition.plucks === "updown"
        ? Array.from({ length: beats * 2 }, (_, i) => ({ beat: i / 2, midi: updown[i % updown.length]! }))
        : definition.plucks === "bounce"
          ? Array.from({ length: beats - 1 }, (_, i) => [upper[0]!, upper[1]!].map((midi) => ({ beat: i + 1, midi }))).flat()
          : [];
  const melody = slots(between(definition.melodyNotes, random)).map((beat) => ({
    beat,
    midi: pick(definition.scale, random),
    length: Math.min(beats - beat, 1 + Math.floor(random() * 2))
  }));
  const twinkles = slots(between(definition.twinkles, random)).map((beat) => ({ beat, midi: pick(definition.sparkleScale, random) }));
  return { pad: chord, bass, plucks, melody, twinkles, ostinato: [], timpani: [], cymbal: false };
}

/**
 * Compás orquestal: chelos en corcheas (raíz, raíz, quinta…), timbal en el 1 y el 3 con redoble al
 * cerrar cada ciclo, y una frase de metales con notas largas.
 */
function composeOrchestraBar(
  definition: ThemeDefinition,
  chord: number[],
  index: number,
  random: () => number,
  slots: (count: number) => number[]
): Bar {
  const beats = definition.beatsPerBar;
  const root = chord[0]!;
  const cycle = definition.chords.length;
  const lastOfCycle = index % cycle === cycle - 1;
  const ostinato = Array.from({ length: beats * 2 }, (_, i) => ({ beat: i / 2, midi: root + 12 + ([0, 0, 7, 0, 12, 0, 7, 0][i] ?? 0) }));
  // El timbal solo tiene dos parches afinados: re y la.
  const drum = (midi: number) => (midi % 12 === 2 || midi % 12 === 10 ? 38 : 45);
  const timpani: BeatNote[] = [{ beat: 0, midi: drum(root) }, { beat: 2, midi: drum(root) }];
  if (lastOfCycle) for (let i = 0; i < 4; i++) timpani.push({ beat: 3 + i / 4, midi: 45 });
  // Los metales tocan en compases alternos y dejan respirar a las cuerdas en los otros.
  const melody =
    index % 2 === 0
      ? slots(between(definition.melodyNotes, random))
          .filter((beat) => beat < beats - 1)
          .map((beat) => ({ beat, midi: pick(definition.scale, random), length: Math.min(beats - beat, 2 + Math.floor(random() * 2)) }))
      : [];
  const twinkles = slots(between(definition.twinkles, random)).map((beat) => ({ beat, midi: pick(definition.sparkleScale, random) }));
  return { pad: chord, bass: [{ beat: 0, midi: root }], plucks: [], melody, twinkles, ostinato, timpani, cymbal: lastOfCycle };
}
