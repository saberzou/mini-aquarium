// Run existing simulation physics at 60 steps/second on every display.
export class SimulationClock {
  constructor() { this.reset(); }
  reset() { this.previous = null; this.accumulator = 0; }
  advance(now, update) {
    if (this.previous === null) { this.previous = now; return; }
    this.accumulator += Math.min(100, Math.max(0, now - this.previous));
    this.previous = now;
    const step = 1000 / 60;
    while (this.accumulator + 1e-7 >= step) {
      update();
      this.accumulator = Math.max(0, this.accumulator - step);
    }
  }
}
