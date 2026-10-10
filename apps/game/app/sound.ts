/** Tiny synthesized sound port: no downloads, muted by default, unlocked only by a gesture. */
export class CampusSound {
  private context: AudioContext | null = null;
  volume = 0;
  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.volume > 0) {
      this.context ??= new AudioContext();
      void this.context.resume();
    }
  }
  play(kind: "phone" | "notice" | "step") {
    if (!this.volume || !this.context) return;
    const c = this.context,
      o = c.createOscillator(),
      g = c.createGain();
    o.frequency.value = kind === "phone" ? 520 : kind === "notice" ? 740 : 95;
    o.type = "sine";
    g.gain.setValueAtTime(this.volume * 0.055, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
    o.connect(g);
    g.connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.13);
  }
  close() {
    void this.context?.close();
    this.context = null;
  }
}
