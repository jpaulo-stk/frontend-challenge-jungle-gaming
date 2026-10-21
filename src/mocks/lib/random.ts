// Seeded pseudo-random generator (mulberry32). Given the same seed and the
// same sequence of requests, latency and failures repeat exactly.

let state = 42;

export function seedRandom(seed: number): void {
  state = seed >>> 0;
}

export function random(): number {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomBetween(min: number, max: number): number {
  return Math.round(min + random() * (max - min));
}
