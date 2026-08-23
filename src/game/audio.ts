/** Procedural SFX via Web Audio. Unlock on first user gesture. */
export class GameAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  sfx: GainNode | null = null;
  muted = false;
  private unlocked = false;

  unlock() {
    if (this.unlocked && this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx({ latencyHint: "interactive" });
    this.master = this.ctx.createGain();
    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = 0.7;
    this.sfx.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.master.gain.value = this.muted ? 0 : 0.85;
    void this.ctx.resume();
    this.unlocked = true;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.03);
    }
  }

  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  private beep(
    freq: number,
    dur: number,
    type: OscillatorType = "square",
    vol = 0.12,
    slide?: number,
  ) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.sfx);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  private noise(dur: number, vol = 0.08, freq = 800) {
    if (!this.ctx || !this.sfx || this.muted) return;
    const t = this.ctx.currentTime;
    const n = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = n;
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(this.sfx);
    src.start(t);
    src.stop(t + dur);
  }

  punch() {
    this.noise(0.08, 0.14, 400);
    this.beep(180, 0.09, "triangle", 0.1, 80);
  }
  ki() {
    this.beep(420, 0.18, "sawtooth", 0.08, 1400);
    this.beep(880, 0.12, "square", 0.05, 2200);
  }
  hit() {
    this.beep(220, 0.07, "square", 0.1, 90);
    this.noise(0.06, 0.1, 1200);
  }
  break() {
    this.noise(0.1, 0.12, 600);
    this.beep(140, 0.08, "triangle", 0.06, 60);
  }
  place() {
    this.beep(320, 0.05, "square", 0.06);
  }
  collect() {
    this.beep(660, 0.1, "sine", 0.1);
    this.beep(990, 0.16, "sine", 0.08, 1320);
  }
  jump() {
    this.beep(240, 0.08, "sine", 0.05, 420);
  }
  hurt() {
    this.beep(160, 0.2, "sawtooth", 0.1, 70);
  }
  ssj() {
    this.beep(200, 0.4, "sawtooth", 0.1, 900);
    this.beep(500, 0.5, "triangle", 0.07, 1400);
  }
  wish() {
    this.beep(130, 0.8, "sine", 0.1, 80);
    this.beep(390, 1.0, "triangle", 0.06, 260);
  }
  dash() {
    this.beep(140, 0.16, "sawtooth", 0.09, 520);
    this.noise(0.08, 0.1, 900);
  }
  charge(p: number) {
    this.beep(280 + p * 500, 0.05, "sine", 0.04 + p * 0.04);
  }
  beam() {
    this.beep(90, 0.5, "sawtooth", 0.12, 60);
    this.beep(640, 0.35, "square", 0.07, 1800);
  }
  step() {
    this.noise(0.04, 0.04, 220);
  }
}
