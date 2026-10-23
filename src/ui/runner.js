// Treibt die Maschine mit eigenem Zeitgeber – unabhängig vom Zeichnen der Ansichten.

export const SPEEDS = [1, 5, 20, 100, 1000, 10000, 100000, Infinity];

export class Runner {
  constructor(machine, onChange) {
    this.machine = machine;
    this.onChange = onChange;
    this.running = false;
    this.speed = 1000; // Befehle je Sekunde
    this.timer = null;
    this.last = 0;
    this.acc = 0;
    this.fresh = true;
  }

  start() {
    if (this.running || this.machine.cpu.halted) return;
    this.running = true;
    this.last = performance.now();
    this.acc = 0;
    this.fresh = true;
    this.timer = setInterval(() => this.tick(), 8);
    this.onChange();
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    clearInterval(this.timer);
    this.timer = null;
    this.onChange();
  }

  tick() {
    const m = this.machine;
    const now = performance.now();
    const dt = Math.min(now - this.last, 100);
    this.last = now;
    let reason;
    if (this.speed === Infinity) {
      // so viel wie in rund 10 ms möglich
      const end = now + 10;
      do {
        reason = m.run(2000, null, this.fresh);
        this.fresh = false;
      } while (reason === 'budget' && performance.now() < end);
    } else {
      this.acc += (this.speed * dt) / 1000;
      const n = Math.floor(this.acc);
      this.acc -= n;
      if (n > 0) {
        reason = m.run(n, null, this.fresh);
        this.fresh = false;
      } else reason = 'budget';
    }
    if (reason !== 'budget') this.pause();
  }
}
