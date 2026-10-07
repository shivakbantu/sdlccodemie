export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size?: number;
  rot: number;
  vr: number;
  color?: string;
  life: number;
}

declare const Confetti: {
  COLORS: string[];
  createParticles(count: number, width: number, rng?: () => number): Required<Particle>[];
  stepParticle(p: Particle, dt?: number): Particle;
  launch(opts?: { count?: number }): () => void;
};

export = Confetti;
