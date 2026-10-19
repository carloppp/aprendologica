import { composeBar, midiToHz, secondsPerBeat, THEMES, type Bar, type MusicTheme } from "./music";

/** Efectos del juego; todos se sintetizan con Web Audio, sin archivos. */
export type Effect =
  | "tap"
  | "lift"
  | "drop"
  | "correct"
  | "retry"
  | "reveal"
  | "hint"
  | "complete"
  | "tryAgain"
  | "lit"
  | "whoosh"
  | "warp"
  | "soon"
  // Puente de PATRONES.
  | "tileFly"
  | "tileLand"
  | "tileRemove"
  | "tilesOff"
  | "portal"
  // Fin de un nivel superado (pantalla de recompensa).
  | "victory";

const MASTER_GAIN = 0.9;
const MUSIC_GAIN = 0.32;
const EFFECTS_GAIN = 0.8;
const LOOKAHEAD_S = 0.8;
const SCHEDULER_MS = 200;
// Cambio de tema: el saliente se apaga rápido (constante de tiempo FADE_OUT_TAU_S, casi mudo en
// ~0.6 s) y se desconecta; el entrante empieza su primer compás cuando el otro ya se fue.
const FADE_OUT_TAU_S = 0.15;
const RELEASE_S = 0.9;
const HANDOFF_S = 0.45;

interface Voice {
  freq: number;
  at: number;
  type?: OscillatorType;
  attack?: number;
  decay: number;
  gain: number;
  /** Frecuencia final de un deslizamiento. */
  glideTo?: number;
  pan?: number;
  /** Fracción que se manda al eco espacial. */
  space?: number;
  detune?: number;
}

/**
 * Motor de sonido: efectos, música generativa por pantalla y destellos estelares.
 *
 * Los navegadores no dejan sonar audio antes de una interacción, así que el `AudioContext` se crea
 * con el primer toque o tecla (`unlock`). Antes de eso los efectos se ignoran y la música solo
 * recuerda el tema pedido. Si Web Audio no existe, todo queda en silencio sin errores.
 */
export class SoundEngine {
  private context?: AudioContext;
  private master?: GainNode;
  private effects?: GainNode;
  private musicBus?: GainNode;
  private space?: GainNode;
  private enabled = true;
  private hidden = false;
  private theme?: MusicTheme;
  private themeGain?: GainNode;
  /** Envío al eco propio del tema: se apaga con él, así sus ecos no se cuelan en el siguiente. */
  private themeSpace?: GainNode;
  /** Destino del eco mientras se programa un compás de música (si no, el eco general). */
  private sendTarget?: AudioNode;
  private nextBarAt = 0;
  private barIndex = 0;
  private scheduler = 0;
  /** Otra pestaña o ventana de la app tomó el sonido: esta calla hasta que la vuelvan a tocar. */
  private silenced = false;
  private readonly id = Math.random().toString(36).slice(2);
  private readonly channel = typeof BroadcastChannel === "function" ? new BroadcastChannel("aprendo-logica-audio") : undefined;

  constructor() {
    // Una sola música a la vez: si se toca otra pestaña de la app, esta se calla.
    this.channel?.addEventListener("message", (event: MessageEvent<{ claim?: string }>) => {
      if (!event.data.claim || event.data.claim === this.id || this.silenced) return;
      this.silenced = true;
      this.syncRunning();
    });
  }

  private get audible(): boolean {
    return this.enabled && !this.hidden && !this.silenced;
  }

  /** Crea el contexto de audio; llamarlo desde un gesto del usuario. */
  unlock(): void {
    if (!this.context) {
      const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return;
      try {
        this.context = new Context({ latencyHint: "interactive" });
      } catch {
        return;
      }
      this.buildGraph(this.context);
    }
    // El toque de esta pestaña la vuelve la única que suena.
    this.silenced = false;
    this.channel?.postMessage({ claim: this.id });
    this.syncRunning();
  }

  /** Apaga el motor para siempre (recarga en caliente durante el desarrollo). */
  dispose(): void {
    this.stopScheduler();
    this.channel?.close();
    void this.context?.close();
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    this.syncRunning();
  }

  /** La pestaña o la app pasan a segundo plano: se pausa todo para no gastar batería. */
  setHidden(value: boolean): void {
    this.hidden = value;
    this.syncRunning();
  }

  /** Cambia la música de fondo con un fundido; no hace nada si el tema ya suena. */
  music(theme: MusicTheme): void {
    if (theme === this.theme) return;
    this.theme = theme;
    this.startTheme();
  }

  /** Toca un efecto, opcionalmente con retraso para que coincida con una animación. */
  play(effect: Effect, delaySeconds = 0): void {
    const ctx = this.context;
    if (!ctx || !this.effects || !this.audible || ctx.state !== "running") return;
    EFFECTS[effect](this, ctx.currentTime + 0.01 + delaySeconds);
  }

  /** Estrella de la recompensa número `index` (0, 1, 2): cada una un poco más aguda. */
  playStar(index: number, delaySeconds: number): void {
    const ctx = this.context;
    if (!ctx || !this.audible || ctx.state !== "running") return;
    const at = ctx.currentTime + delaySeconds;
    const root = [76, 79, 84][Math.min(index, 2)]!;
    [root, root + 7, root + 12].forEach((midi, i) => this.voice({ freq: midiToHz(midi), at: at + i * 0.06, type: "sine", decay: 0.9, gain: 0.16, space: 0.5 }));
    this.shimmer(at + 0.05, 5, 0.04);
  }

  /**
   * Paso de Stella sobre la baldosa número `index` del puente: una nota de marimba que sube por la
   * pentatónica de do mayor, así el cruce suena como una escalera musical hasta el portal.
   */
  bridgeStep(index: number, delaySeconds = 0): void {
    const ctx = this.context;
    if (!ctx || !this.audible || ctx.state !== "running") return;
    const at = ctx.currentTime + 0.01 + delaySeconds;
    const notes = [72, 74, 76, 79, 81];
    const midi = notes[index % notes.length]! + 12 * Math.min(1, Math.floor(index / notes.length));
    this.voice({ freq: midiToHz(midi), at, type: "triangle", attack: 0.004, decay: 0.22, gain: 0.08, space: 0.25 });
    this.voice({ freq: midiToHz(midi + 24), at, type: "sine", attack: 0.002, decay: 0.08, gain: 0.02 });
    this.noise({ at, duration: 0.05, filter: "lowpass", from: 900, to: 300, gain: 0.05, shape: "hit" });
  }

  /**
   * Titileo de una estrella de la constelación al aparecer: una nota aguda que parpadea con su
   * octava, suave y con eco. Las estrellas suben por la pentatónica de re menor (la tonalidad de la
   * música épica) y suenan del lado de la pantalla donde aparecen (`pan`, de -1 a 1).
   */
  twinkleStar(index: number, delaySeconds: number, pan: number): void {
    const ctx = this.context;
    if (!ctx || !this.audible || ctx.state !== "running") return;
    const at = ctx.currentTime + delaySeconds;
    const notes = [86, 89, 91, 93, 96, 98];
    const midi = notes[index % notes.length]! + 12 * Math.floor(index / notes.length);
    this.voice({ freq: midiToHz(midi), at, type: "sine", attack: 0.006, decay: 0.9, gain: 0.07, space: 0.7, pan });
    this.voice({ freq: midiToHz(midi + 12), at: at + 0.05, type: "sine", attack: 0.004, decay: 0.25, gain: 0.025, space: 0.7, pan });
    this.voice({ freq: midiToHz(midi), at: at + 0.11, type: "sine", attack: 0.004, decay: 0.4, gain: 0.025, space: 0.7, pan });
  }

  private buildGraph(ctx: AudioContext): void {
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    // Compresor suave: varios efectos a la vez nunca saturan los parlantes de una tableta.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -14;
    limiter.ratio.value = 6;
    this.master.connect(limiter).connect(ctx.destination);

    this.effects = ctx.createGain();
    this.effects.gain.value = EFFECTS_GAIN;
    this.effects.connect(this.master);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = MUSIC_GAIN;
    this.musicBus.connect(this.master);

    // Eco "espacial": retardo con realimentación filtrada, compartido por música y efectos.
    this.space = ctx.createGain();
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.34;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.42;
    const damp = ctx.createBiquadFilter();
    damp.type = "lowpass";
    damp.frequency.value = 2600;
    this.space.connect(delay);
    delay.connect(damp).connect(feedback).connect(delay);
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    damp.connect(wet).connect(this.master);
  }

  private syncRunning(): void {
    const ctx = this.context;
    if (!ctx || !this.master) return;
    const audible = this.audible;
    const now = ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(audible ? MASTER_GAIN : 0, now, 0.08);
    if (audible) {
      // Un toque nuevo puede reanudar el contexto, pero no reinicia la música que ya suena.
      void ctx.resume().then(() => {
        if (!this.scheduler) this.startTheme();
      });
    } else {
      this.stopScheduler();
      window.setTimeout(() => {
        if (!this.audible) void ctx.suspend();
      }, 300);
    }
  }

  private startTheme(): void {
    const ctx = this.context;
    if (!ctx || !this.musicBus || !this.theme || !this.audible) return;
    const now = ctx.currentTime;
    const handoff = this.themeGain !== undefined;
    // El tema saliente (sonido directo y eco) se opaca de inmediato y luego se corta del todo,
    // aunque le queden notas largas programadas.
    for (const old of [this.themeGain, this.themeSpace]) {
      if (!old) continue;
      old.gain.cancelScheduledValues(now);
      old.gain.setValueAtTime(old.gain.value, now);
      old.gain.setTargetAtTime(0, now, FADE_OUT_TAU_S);
      window.setTimeout(() => old.disconnect(), RELEASE_S * 1000);
    }
    const enterAt = handoff ? now + HANDOFF_S - 0.15 : now;
    this.themeGain = ctx.createGain();
    this.themeGain.gain.setValueAtTime(0, now);
    this.themeGain.gain.setValueAtTime(0, enterAt);
    this.themeGain.gain.linearRampToValueAtTime(1, enterAt + 0.3);
    this.themeGain.connect(this.musicBus);
    this.themeSpace = ctx.createGain();
    this.themeSpace.gain.value = 1;
    this.themeSpace.connect(this.space!);
    this.nextBarAt = handoff ? now + HANDOFF_S : now + 0.1;
    this.barIndex = 0;
    this.stopScheduler();
    this.scheduler = window.setInterval(() => this.scheduleAhead(), SCHEDULER_MS);
    this.scheduleAhead();
  }

  private stopScheduler(): void {
    window.clearInterval(this.scheduler);
    this.scheduler = 0;
  }

  private scheduleAhead(): void {
    const ctx = this.context;
    if (!ctx || !this.theme || !this.themeGain) return;
    // Si el reloj se adelantó (pestaña congelada), se retoma desde ahora en vez de amontonar compases.
    if (this.nextBarAt < ctx.currentTime) this.nextBarAt = ctx.currentTime + 0.05;
    while (this.nextBarAt < ctx.currentTime + LOOKAHEAD_S) {
      const beat = secondsPerBeat(this.theme);
      const bar = composeBar(this.theme, this.barIndex);
      this.sendTarget = this.themeSpace;
      if (THEMES[this.theme].style === "orchestra") this.renderOrchestraBar(bar, this.nextBarAt, beat, this.themeGain);
      else this.renderBar(bar, this.nextBarAt, beat, this.themeGain);
      this.sendTarget = undefined;
      this.nextBarAt += beat * 4;
      this.barIndex++;
    }
  }

  private renderBar(bar: Bar, start: number, beat: number, out: GainNode): void {
    const definition = this.theme ? THEMES[this.theme] : undefined;
    const length = beat * (definition?.beatsPerBar ?? 4);
    const timbre = definition?.voice ?? "musicbox";
    // Colchón: senos levemente desafinados, con entrada y salida lentas.
    bar.pad.forEach((midi, i) => {
      for (const detune of [-6, 6]) {
        this.voice({ freq: midiToHz(midi), at: start, type: i === 0 ? "triangle" : "sine", attack: length * 0.4, decay: length * 1.15, gain: 0.05, detune, space: 0.25, pan: (i / bar.pad.length - 0.5) * 0.6 }, out, "pad");
      }
    });
    bar.bass.forEach((note) => this.voice({ freq: midiToHz(note.midi), at: start + note.beat * beat, type: "sine", attack: 0.02, decay: beat * 1.8, gain: 0.16 }, out));
    bar.plucks.forEach((note, i) => {
      const at = start + note.beat * beat;
      if (timbre === "bells") {
        // Campanas de cristal: seno con un armónico inarmónico corto, que suena a vidrio.
        this.voice({ freq: midiToHz(note.midi), at, type: "sine", attack: 0.003, decay: 0.7, gain: 0.032, space: 0.5, pan: i % 2 ? 0.4 : -0.4 }, out);
        this.voice({ freq: midiToHz(note.midi) * 2.76, at, type: "sine", attack: 0.002, decay: 0.12, gain: 0.008, space: 0.5 }, out);
      } else if (timbre === "flute") {
        // "Pa-pa" de las islas: cuerdas pulsadas cortas y alegres.
        this.voice({ freq: midiToHz(note.midi), at, type: "triangle", attack: 0.004, decay: 0.18, gain: 0.04, space: 0.2, pan: i % 2 ? 0.3 : -0.3 }, out);
      } else {
        this.voice({ freq: midiToHz(note.midi), at, type: "triangle", attack: 0.005, decay: 0.35, gain: i % 2 ? 0.035 : 0.05, space: 0.3, pan: i % 2 ? 0.35 : -0.35 }, out);
      }
    });
    bar.melody.forEach((note) => {
      const at = start + note.beat * beat;
      if (timbre === "flute") {
        // Flauta: entrada suave, cuerpo de triángulo y un soplo de octava baja.
        this.voice({ freq: midiToHz(note.midi), at, type: "triangle", attack: 0.05, decay: note.length * beat + 0.3, gain: 0.07, space: 0.45, detune: 4 }, out);
        this.voice({ freq: midiToHz(note.midi - 12), at, type: "sine", attack: 0.06, decay: note.length * beat, gain: 0.025, space: 0.45 }, out);
      } else if (timbre === "bells") {
        // Celesta: brillo agudo con cola larga.
        this.voice({ freq: midiToHz(note.midi), at, type: "sine", attack: 0.004, decay: note.length * beat + 1.2, gain: 0.08, space: 0.65 }, out);
        this.voice({ freq: midiToHz(note.midi + 19), at, type: "sine", attack: 0.002, decay: 0.3, gain: 0.015, space: 0.65 }, out);
      } else {
        // Caja de música: un seno con un armónico suave y cola larga.
        this.voice({ freq: midiToHz(note.midi), at, type: "sine", attack: 0.008, decay: note.length * beat + 0.8, gain: 0.09, space: 0.55 }, out);
        this.voice({ freq: midiToHz(note.midi + 12), at, type: "sine", attack: 0.004, decay: 0.4, gain: 0.025, space: 0.55 }, out);
      }
    });
    bar.twinkles.forEach((note) =>
      this.voice({ freq: midiToHz(note.midi), at: start + note.beat * beat, type: "sine", attack: 0.01, decay: 1.4, gain: 0.03, space: 0.9, pan: Math.random() * 1.6 - 0.8 }, out)
    );
  }

  /**
   * Compás orquestal sintetizado: cuerdas (sierras desafinadas tras un filtro), contrabajo, chelos
   * en staccato, metales con brillo que se abre, timbales y platillo. Todo pasa por filtros
   * de sección para que suene cálido y no "electrónico".
   */
  private renderOrchestraBar(bar: Bar, start: number, beat: number, out: GainNode): void {
    const length = beat * 4;
    // Las cuerdas de un compás se encadenan con las del siguiente (legato), sin huecos.
    const strings = this.section(out, 1900, start, length * 2.4);
    bar.pad.slice(1).forEach((midi, i) => {
      for (const detune of [-9, 0, 9]) {
        this.voice({ freq: midiToHz(midi), at: start, type: "sawtooth", attack: length * 0.2, decay: length * 1.4, gain: 0.011, detune, space: 0.35, pan: (i / (bar.pad.length - 1) - 0.5) * 0.9 }, strings, "pad");
      }
    });
    const low = this.section(out, 420, start, length * 2.4);
    bar.bass.forEach((note) => {
      this.voice({ freq: midiToHz(note.midi), at: start + note.beat * beat, type: "sawtooth", attack: 0.15, decay: length * 1.05, gain: 0.05 }, low, "pad");
      this.voice({ freq: midiToHz(note.midi), at: start + note.beat * beat, type: "sine", attack: 0.1, decay: length, gain: 0.07 }, out, "pad");
    });
    const cellos = this.section(out, 1100, start, length * 2);
    bar.ostinato.forEach((note, i) =>
      this.voice({ freq: midiToHz(note.midi), at: start + note.beat * beat, type: "sawtooth", attack: 0.01, decay: 0.2, gain: i % 4 === 0 ? 0.07 : 0.045, pan: -0.25 }, cellos)
    );
    bar.melody.forEach((note) => this.brass(note.midi, start + note.beat * beat, note.length * beat, 0.05, out));
    bar.timpani.forEach((hit, i) => this.timpani(hit.midi, start + hit.beat * beat, hit.beat >= 3 ? 0.12 + i * 0.03 : 0.3, out));
    if (bar.cymbal) this.cymbal(start, length, out);
    bar.twinkles.forEach((note) =>
      this.voice({ freq: midiToHz(note.midi), at: start + note.beat * beat, type: "sine", attack: 0.01, decay: 1.4, gain: 0.025, space: 0.9, pan: Math.random() * 1.6 - 0.8 }, out)
    );
  }

  /** Filtro pasabajos compartido por una sección durante un compás; se desconecta al terminar. */
  private section(out: AudioNode, cutoff: number, start: number, lifetime: number): BiquadFilterNode {
    const ctx = this.context!;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    filter.Q.value = 0.6;
    filter.connect(out);
    window.setTimeout(() => filter.disconnect(), (start - ctx.currentTime + lifetime) * 1000);
    return filter;
  }

  /** Metal: dos sierras (nota y octava baja) con un filtro que se abre al atacar, como un corno. */
  brass(midi: number, at: number, duration: number, gain: number, out: AudioNode = this.effects!): void {
    const ctx = this.context;
    if (!ctx) return;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(280, at);
    filter.frequency.exponentialRampToValueAtTime(2400, at + 0.12);
    filter.frequency.exponentialRampToValueAtTime(1300, at + 0.5);
    filter.connect(out);
    for (const [offset, detune, level] of [[0, -5, 1], [0, 5, 1], [-12, 0, 0.6]] as const) {
      this.voice({ freq: midiToHz(midi + offset), at, type: "sawtooth", attack: 0.07, decay: duration + 0.25, gain: gain * level, detune, space: 0.45 }, filter, "pad");
    }
    window.setTimeout(() => filter.disconnect(), (at - ctx.currentTime + duration + 1) * 1000);
  }

  /** Timbal: seno grave que baja un poco de afinación, con su armónico y el golpe del mazo. */
  timpani(midi: number, at: number, gain: number, out: AudioNode = this.effects!): void {
    const freq = midiToHz(midi);
    this.voice({ freq, glideTo: freq * 0.93, at, type: "sine", attack: 0.004, decay: 1.2, gain, space: 0.3 }, out);
    this.voice({ freq: freq * 1.5, at, type: "sine", attack: 0.004, decay: 0.35, gain: gain * 0.3 }, out);
    this.noise({ at, duration: 0.1, filter: "lowpass", from: 900, to: 200, gain: gain * 0.5, shape: "hit", out });
  }

  /** Platillo suspendido: crece durante el compás y estalla en el siguiente tiempo fuerte. */
  cymbal(start: number, length: number, out: AudioNode = this.effects!): void {
    this.noise({ at: start + length * 0.25, duration: length * 0.75, filter: "highpass", from: 3000, to: 7000, gain: 0.05, shape: "swell", out });
    this.noise({ at: start + length, duration: 2.2, filter: "highpass", from: 6000, to: 4000, gain: 0.07, shape: "hit", out, space: 0.5 });
  }

  /** Una nota con envolvente percusiva (o de colchón, con `shape = "pad"`). */
  voice(spec: Voice, out: AudioNode = this.effects!, shape: "pluck" | "pad" = "pluck"): void {
    const ctx = this.context;
    if (!ctx || !out) return;
    const osc = ctx.createOscillator();
    osc.type = spec.type ?? "sine";
    osc.frequency.setValueAtTime(spec.freq, spec.at);
    if (spec.detune) osc.detune.value = spec.detune;
    if (spec.glideTo) osc.frequency.exponentialRampToValueAtTime(spec.glideTo, spec.at + Math.max(0.03, spec.decay * 0.6));
    const env = ctx.createGain();
    const attack = spec.attack ?? 0.005;
    env.gain.setValueAtTime(0.0001, spec.at);
    if (shape === "pad") {
      env.gain.linearRampToValueAtTime(spec.gain, spec.at + attack);
      env.gain.setValueAtTime(spec.gain, spec.at + spec.decay * 0.7);
      env.gain.linearRampToValueAtTime(0.0001, spec.at + spec.decay);
    } else {
      env.gain.exponentialRampToValueAtTime(spec.gain, spec.at + attack);
      env.gain.exponentialRampToValueAtTime(0.0001, spec.at + attack + spec.decay);
    }
    let tail: AudioNode = env;
    if (spec.pan && ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = spec.pan;
      tail = env.connect(panner);
    }
    osc.connect(env);
    tail.connect(out);
    const echo = this.sendTarget ?? this.space;
    if (spec.space && echo) {
      const send = ctx.createGain();
      send.gain.value = spec.space;
      tail.connect(send).connect(echo);
    }
    osc.start(spec.at);
    osc.stop(spec.at + attack + spec.decay + 0.05);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
      tail.disconnect();
    };
  }

  /** Ruido filtrado que barre frecuencias: soplos de viento y estelas. */
  sweep(at: number, duration: number, from: number, peak: number, to: number, gain: number): void {
    this.noise({ at, duration, filter: "bandpass", from, peak, to, gain, shape: "arch", space: 0.4 });
  }

  /**
   * Ruido con filtro móvil. `arch` sube y baja, `swell` crece hasta el final y `hit` golpea y se
   * apaga (mazo, platillo).
   */
  noise(spec: { at: number; duration: number; filter: BiquadFilterType; from: number; peak?: number; to: number; gain: number; shape: "arch" | "swell" | "hit"; out?: AudioNode; space?: number }): void {
    const ctx = this.context;
    const out = spec.out ?? this.effects;
    if (!ctx || !out) return;
    const { at, duration } = spec;
    const frames = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = spec.filter;
    filter.Q.value = spec.filter === "bandpass" ? 1.4 : 0.7;
    filter.frequency.setValueAtTime(spec.from, at);
    if (spec.peak) filter.frequency.exponentialRampToValueAtTime(spec.peak, at + duration * 0.55);
    filter.frequency.exponentialRampToValueAtTime(spec.to, at + duration);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    if (spec.shape === "hit") {
      env.gain.exponentialRampToValueAtTime(spec.gain, at + 0.005);
    } else {
      env.gain.exponentialRampToValueAtTime(spec.gain, at + duration * (spec.shape === "swell" ? 0.97 : 0.5));
    }
    env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter).connect(env).connect(out);
    const echo = this.sendTarget ?? this.space;
    if (spec.space && echo) {
      const send = ctx.createGain();
      send.gain.value = spec.space;
      env.connect(send).connect(echo);
    }
    source.start(at);
    source.onended = () => {
      source.disconnect();
      env.disconnect();
    };
  }

  /** Lluvia de campanitas agudas al azar, como polvo de estrellas. */
  shimmer(at: number, count: number, gain: number): void {
    const notes = [88, 91, 93, 96, 98, 100, 103];
    for (let i = 0; i < count; i++) {
      const midi = notes[Math.floor(Math.random() * notes.length)]!;
      this.voice({ freq: midiToHz(midi), at: at + i * 0.045 + Math.random() * 0.03, type: "sine", decay: 0.6, gain, space: 0.8, pan: Math.random() * 1.4 - 0.7 });
    }
  }
}

const arpeggio = (engine: SoundEngine, at: number, notes: number[], step: number, gain: number, type: OscillatorType = "triangle", decay = 0.5) =>
  notes.forEach((midi, i) => engine.voice({ freq: midiToHz(midi), at: at + i * step, type, decay, gain, space: 0.4 }));

/** Recetas de cada efecto: tonos amables y cortos, pensados para niños de 6 a 8 años. */
const EFFECTS: Record<Effect, (engine: SoundEngine, at: number) => void> = {
  // Burbuja suave al tocar un botón.
  tap: (e, at) => {
    e.voice({ freq: 900, glideTo: 620, at, type: "sine", decay: 0.09, gain: 0.16 });
    e.voice({ freq: 1800, at, type: "sine", decay: 0.04, gain: 0.03 });
  },
  lift: (e, at) => e.voice({ freq: 520, glideTo: 820, at, type: "sine", decay: 0.1, gain: 0.12 }),
  drop: (e, at) => {
    e.voice({ freq: 760, glideTo: 380, at, type: "sine", decay: 0.12, gain: 0.16 });
    e.voice({ freq: 1520, at: at + 0.02, type: "sine", decay: 0.18, gain: 0.03, space: 0.3 });
  },
  // Arpegio mayor ascendente con polvo de estrellas.
  correct: (e, at) => {
    arpeggio(e, at, [72, 76, 79, 84], 0.075, 0.13);
    arpeggio(e, at, [84, 88, 91, 96], 0.075, 0.05, "sine", 0.7);
    e.shimmer(at + 0.3, 8, 0.035);
  },
  // "Uh-oh" amable: dos notas que bajan, sin sonar a castigo.
  retry: (e, at) => {
    e.voice({ freq: midiToHz(67), at, type: "triangle", attack: 0.02, decay: 0.22, gain: 0.12 });
    e.voice({ freq: midiToHz(64), glideTo: midiToHz(62), at: at + 0.2, type: "triangle", attack: 0.02, decay: 0.35, gain: 0.12 });
  },
  // Arpa pentatónica que sube mientras se muestra la respuesta.
  reveal: (e, at) => arpeggio(e, at, [67, 69, 72, 74, 76, 79, 81, 84], 0.07, 0.07, "sine", 0.9),
  // "Ding" del foquito de Luma.
  hint: (e, at) => {
    e.voice({ freq: midiToHz(88), at, type: "sine", decay: 1.1, gain: 0.12, space: 0.5 });
    e.voice({ freq: midiToHz(100), at, type: "sine", decay: 0.5, gain: 0.03, space: 0.5 });
  },
  // Fanfarria: arpegio y acorde que florece.
  complete: (e, at) => {
    arpeggio(e, at, [60, 64, 67, 72], 0.11, 0.12);
    [60, 67, 72, 76, 79].forEach((midi) => e.voice({ freq: midiToHz(midi), at: at + 0.48, type: "triangle", attack: 0.05, decay: 1.6, gain: 0.06, space: 0.5 }));
    e.shimmer(at + 0.5, 10, 0.03);
  },
  // Ánimo para volver a intentar: dos notas que suben.
  tryAgain: (e, at) => {
    e.voice({ freq: midiToHz(67), at, type: "triangle", decay: 0.4, gain: 0.11 });
    e.voice({ freq: midiToHz(72), at: at + 0.22, type: "triangle", decay: 0.8, gain: 0.11, space: 0.4 });
  },
  // Se enciende una estrella de la constelación: campana con brillo.
  lit: (e, at) => {
    e.voice({ freq: midiToHz(91), at, type: "sine", decay: 1.6, gain: 0.12, space: 0.7 });
    e.voice({ freq: midiToHz(79), at, type: "triangle", decay: 1.2, gain: 0.06, space: 0.5 });
    e.shimmer(at + 0.1, 9, 0.035);
  },
  // Transición entre pantallas: soplo de viento, glissando mágico que sube con el círculo de luz y
  // una campanita cuando la nueva pantalla termina de abrirse (650 ms).
  whoosh: (e, at) => {
    e.sweep(at, 0.65, 400, 2800, 700, 0.08);
    [72, 76, 79, 84, 88, 91].forEach((midi, i) => e.voice({ freq: midiToHz(midi), at: at + 0.05 + i * 0.05, type: "sine", decay: 0.35, gain: 0.035, space: 0.6, pan: -0.5 + i * 0.2 }));
    e.voice({ freq: midiToHz(96), at: at + 0.55, type: "sine", decay: 1.1, gain: 0.06, space: 0.7 });
    e.voice({ freq: midiToHz(103), at: at + 0.55, type: "sine", decay: 0.5, gain: 0.02, space: 0.7 });
  },
  // Viaje estelar: la estela sube, un tono se eleva y un destello cierra.
  warp: (e, at) => {
    e.sweep(at, 1.8, 300, 5000, 1800, 0.1);
    e.voice({ freq: 110, glideTo: 880, at: at + 0.2, type: "sine", attack: 0.6, decay: 1.2, gain: 0.07 });
    e.voice({ freq: midiToHz(96), at: at + 1.7, type: "sine", decay: 1.2, gain: 0.1, space: 0.7 });
    e.shimmer(at + 1.7, 8, 0.03);
  },
  // "Muy pronto": dos notas suaves.
  soon: (e, at) => {
    e.voice({ freq: midiToHz(72), at, type: "sine", decay: 0.3, gain: 0.08 });
    e.voice({ freq: midiToHz(76), at: at + 0.14, type: "sine", decay: 0.5, gain: 0.08, space: 0.4 });
  },
  // Una pieza sale volando de la bandeja hacia su baldosa: silbido corto que sube.
  tileFly: (e, at) => {
    e.sweep(at, 0.42, 600, 3200, 1400, 0.05);
    e.voice({ freq: midiToHz(76), glideTo: midiToHz(88), at, type: "sine", attack: 0.02, decay: 0.32, gain: 0.05, space: 0.3 });
  },
  // La baldosa cae en su lugar: golpe sólido y un tintineo de cristal.
  tileLand: (e, at) => {
    e.voice({ freq: 220, glideTo: 110, at, type: "sine", attack: 0.002, decay: 0.16, gain: 0.2 });
    e.noise({ at, duration: 0.08, filter: "lowpass", from: 1400, to: 400, gain: 0.07, shape: "hit" });
    e.voice({ freq: midiToHz(91), at: at + 0.02, type: "triangle", decay: 0.35, gain: 0.05, space: 0.4 });
    e.voice({ freq: midiToHz(98), at: at + 0.05, type: "sine", decay: 0.3, gain: 0.03, space: 0.4 });
  },
  // Se quita una pieza del puente: pop que sube, como despegarla.
  tileRemove: (e, at) => {
    e.voice({ freq: 420, glideTo: 980, at, type: "sine", attack: 0.004, decay: 0.12, gain: 0.12 });
    e.voice({ freq: 1960, at: at + 0.05, type: "sine", decay: 0.06, gain: 0.025 });
  },
  // Las piezas equivocadas saltan fuera del puente: "boing" suave que baja.
  tilesOff: (e, at) => {
    e.voice({ freq: 520, glideTo: 260, at, type: "triangle", attack: 0.01, decay: 0.28, gain: 0.09 });
    e.voice({ freq: 390, glideTo: 195, at: at + 0.12, type: "triangle", attack: 0.01, decay: 0.3, gain: 0.07 });
    e.sweep(at, 0.3, 1800, 900, 500, 0.03);
  },
  // Stella llega al portal: brillo mágico que crece y un acorde de campanas.
  portal: (e, at) => {
    e.noise({ at, duration: 0.7, filter: "bandpass", from: 800, peak: 4200, to: 6000, gain: 0.05, shape: "swell", space: 0.6 });
    [72, 79, 84, 88, 91].forEach((midi, i) => e.voice({ freq: midiToHz(midi), at: at + 0.55 + i * 0.03, type: "sine", attack: 0.01, decay: 1.6, gain: 0.07, space: 0.7, pan: -0.4 + i * 0.2 }));
    e.shimmer(at + 0.6, 10, 0.035);
  },
  // Nivel superado: fanfarria de metales (I–IV–V–I), timbal, platillo que crece y campanas.
  victory: (e, at) => {
    const beat = 0.16;
    const chords = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [72, 76, 79]];
    chords.forEach((chord, i) => {
      const when = at + i * beat * (i === 3 ? 1.5 : 1);
      chord.forEach((midi, k) =>
        e.voice({ freq: midiToHz(midi), at: when, type: "sawtooth", attack: 0.02, decay: i === 3 ? 1.8 : 0.28, gain: i === 3 ? 0.035 : 0.03, space: 0.35, pan: -0.3 + k * 0.3, detune: k * 4 })
      );
      e.voice({ freq: midiToHz(chord[0]! - 24), at: when, type: "sine", attack: 0.005, decay: 0.3, gain: 0.16 });
    });
    const final = at + beat * 4.5;
    // Melodía triunfal encima del último acorde.
    arpeggio(e, at, [72, 76, 79, 84], beat, 0.08, "triangle", 0.4);
    e.noise({ at: final - 0.35, duration: 0.45, filter: "highpass", from: 3000, to: 9000, gain: 0.05, shape: "swell" });
    e.noise({ at: final, duration: 1.4, filter: "highpass", from: 6000, to: 3000, gain: 0.06, shape: "hit", space: 0.5 });
    [84, 88, 91, 96].forEach((midi, i) => e.voice({ freq: midiToHz(midi), at: final + i * 0.09, type: "sine", decay: 1.4, gain: 0.07, space: 0.7 }));
    e.shimmer(final + 0.2, 14, 0.03);
  }
};

/** Instancia única: las pantallas y los controles de la interfaz comparten el mismo contexto. */
export const sound = new SoundEngine();

// En desarrollo, al recargar este módulo en caliente, el motor viejo se apaga para que su música
// no siga sonando junto a la del nuevo.
import.meta.hot?.dispose(() => sound.dispose());
