'use client';

import { useEffect, useRef } from 'react';

type WaveLayer = {
  base: number;
  amp: number;
  freqA: number;
  freqB: number;
  speedA: number;
  speedB: number;
  phase: number;
  alpha: number;
};

type Wisp = {
  base: number;
  amp: number;
  freq: number;
  speed: number;
  phase: number;
  width: number;
  alpha: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  seed: number;
};

const BOTTOM_LAYERS: WaveLayer[] = [
  {
    base: 168,
    amp: 36,
    freqA: 4.2,
    freqB: 7.4,
    speedA: 0.22,
    speedB: 0.13,
    phase: 0.2,
    alpha: 0.16,
  },
  {
    base: 128,
    amp: 28,
    freqA: 5.1,
    freqB: 9.2,
    speedA: 0.31,
    speedB: 0.19,
    phase: 1.4,
    alpha: 0.2,
  },
  {
    base: 92,
    amp: 22,
    freqA: 6.6,
    freqB: 11.5,
    speedA: 0.18,
    speedB: 0.27,
    phase: 2.6,
    alpha: 0.18,
  },
  {
    base: 58,
    amp: 16,
    freqA: 8.4,
    freqB: 14.8,
    speedA: 0.36,
    speedB: 0.21,
    phase: 3.8,
    alpha: 0.22,
  },
];

const BOTTOM_WISPS: Wisp[] = [
  {
    base: 54,
    amp: 38,
    freq: 5.6,
    speed: 0.24,
    phase: 0.4,
    width: 1.6,
    alpha: 0.42,
  },
  {
    base: 88,
    amp: 46,
    freq: 4.1,
    speed: 0.17,
    phase: 1.8,
    width: 2.4,
    alpha: 0.28,
  },
  {
    base: 122,
    amp: 52,
    freq: 3.3,
    speed: 0.12,
    phase: 2.9,
    width: 1.1,
    alpha: 0.34,
  },
  {
    base: 36,
    amp: 22,
    freq: 8.8,
    speed: 0.33,
    phase: 4.1,
    width: 0.8,
    alpha: 0.38,
  },
];

const ENTER_MS = 1180;
const EXIT_MS = 860;
const REDUCED_MS = 180;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number) {
  return t * t * t;
}

function easeOutBack(t: number) {
  const overshoot = 1.18;
  const inner = overshoot + 1;
  return 1 + inner * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
}

function staggered(progress: number, delay: number) {
  const span = 1 - delay;
  if (span <= 0) {
    return clamp01(progress);
  }

  return clamp01((progress - delay) / span);
}

function readRgb(canvas: HTMLCanvasElement) {
  const raw = getComputedStyle(canvas).getPropertyValue('--pause-wave').trim();
  return raw.length > 0 ? raw : '196 48 46';
}

function isDarkTheme() {
  return document.documentElement.classList.contains('dark');
}

function bottomTaper(x: number, width: number) {
  return Math.pow(Math.max(0, 1 - (x / width) * 1.04), 0.72);
}

function waveOffset(nx: number, t: number, layer: WaveLayer) {
  return (
    Math.sin(nx * layer.freqA + t * layer.speedA + layer.phase) * layer.amp +
    Math.sin(nx * layer.freqB + t * layer.speedB + layer.phase * 1.7) *
      layer.amp *
      0.46 +
    Math.sin(nx * 17.5 + t * 0.08) * 7
  );
}

function createParticles(width: number, height: number): Particle[] {
  const count = Math.min(
    48,
    Math.max(22, Math.round((width * height) / 32000))
  );
  return Array.from({ length: count }, () => seedParticle(width, height));
}

function seedParticle(width: number, height: number): Particle {
  return {
    x: Math.random() * width * 0.96,
    y: height - 8 - Math.random() * Math.min(160, height * 0.28),
    vx: 6 + Math.random() * 16,
    vy: -10 + Math.random() * 8,
    r: 0.7 + Math.random() * 1.8,
    seed: Math.random() * Math.PI * 2,
  };
}

function recycleParticle(
  particle: Particle,
  width: number,
  height: number
): void {
  Object.assign(particle, seedParticle(width, height));
}

export function PauseAtmosphere({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const startRef = useRef<() => void>(() => undefined);

  activeRef.current = active;

  useEffect(() => {
    if (active) {
      startRef.current();
    }
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let lastTs = performance.now();
    let revealFrom = 0;
    let revealTo = 0;
    let revealStart = 0;
    let revealDur = ENTER_MS;
    let lastActive = false;
    let linearReveal = 0;
    let rgb = readRgb(canvas);
    let dark = isDarkTheme();

    const resize = () => {
      const nextWidth = canvas.clientWidth;
      const nextHeight = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(nextWidth * dpr));
      canvas.height = Math.max(1, Math.floor(nextHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = nextWidth;
      height = nextHeight;
      particles = createParticles(width, height);
    };

    const sampleReveal = (now: number, reduced: boolean) => {
      const on = activeRef.current;
      if (on !== lastActive) {
        lastActive = on;
        revealFrom = linearReveal;
        revealTo = on ? 1 : 0;
        revealStart = now;
        revealDur = reduced ? REDUCED_MS : on ? ENTER_MS : EXIT_MS;
      }

      const u = clamp01((now - revealStart) / Math.max(revealDur, 1));
      linearReveal = revealFrom + (revealTo - revealFrom) * u;
      return linearReveal;
    };

    const layerMotion = (
      progress: number,
      delay: number,
      entering: boolean
    ) => {
      const local = staggered(progress, delay);
      const rise = entering ? easeOutCubic(local) : easeInCubic(local);
      const inflate = entering ? easeOutBack(local) : rise;
      return { rise, inflate };
    };

    const drawBottomRibbon = (
      layer: WaveLayer,
      t: number,
      breath: number,
      rise: number,
      inflate: number
    ) => {
      if (rise <= 0.001) {
        return;
      }

      const step = width > 900 ? 5 : 4;
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += step) {
        const nx = x / Math.max(width, 1);
        const y =
          height -
          (layer.base * (0.84 + breath * 0.16) * rise +
            waveOffset(nx, t, layer) * inflate) *
            bottomTaper(x, width);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(
        0,
        height - layer.base * 1.35 * rise,
        0,
        height
      );
      const peak =
        (dark ? layer.alpha : layer.alpha * 0.72) * Math.min(1, rise * 1.35);
      gradient.addColorStop(0, `rgb(${rgb} / 0)`);
      gradient.addColorStop(0.45, `rgb(${rgb} / ${peak * 0.55})`);
      gradient.addColorStop(1, `rgb(${rgb} / ${peak})`);
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    const drawBottomWisp = (
      wisp: Wisp,
      t: number,
      breath: number,
      rise: number,
      inflate: number
    ) => {
      if (rise <= 0.001) {
        return;
      }

      ctx.beginPath();
      const step = 6;
      let started = false;
      for (let x = 0; x <= width; x += step) {
        const nx = x / Math.max(width, 1);
        const taper = bottomTaper(x, width);
        if (taper <= 0.02) {
          continue;
        }
        const y =
          height -
          (wisp.base * (0.88 + breath * 0.12) * rise +
            Math.sin(nx * wisp.freq + t * wisp.speed + wisp.phase) *
              wisp.amp *
              inflate +
            Math.sin(nx * wisp.freq * 1.7 + t * wisp.speed * 0.6) *
              wisp.amp *
              0.35 *
              inflate) *
            taper;
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = `rgb(${rgb} / ${wisp.alpha * (dark ? 1 : 0.7) * rise})`;
      ctx.lineWidth = wisp.width * (0.45 + 0.55 * inflate);
      ctx.lineCap = 'round';
      ctx.stroke();
    };

    const drawCornerGlow = (breath: number, rise: number) => {
      if (rise <= 0.001) {
        return;
      }

      const radius =
        Math.min(width * 0.72, height * 0.42) * (0.92 + breath * 0.08) * rise;
      const originX = width * 0.22;
      const glow = ctx.createRadialGradient(
        originX,
        height,
        0,
        originX,
        height,
        radius
      );
      const peak = (dark ? 0.2 + breath * 0.06 : 0.1 + breath * 0.03) * rise;
      glow.addColorStop(0, `rgb(${rgb} / ${peak})`);
      glow.addColorStop(0.4, `rgb(${rgb} / ${peak * 0.35})`);
      glow.addColorStop(1, `rgb(${rgb} / 0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, height - radius, width, radius);
    };

    const drawParticles = (
      now: number,
      dt: number,
      reduced: boolean,
      rise: number
    ) => {
      if (rise <= 0.12) {
        return;
      }

      for (const particle of particles) {
        if (!reduced) {
          particle.x += particle.vx * dt;
          particle.y += particle.vy * dt;
        }

        const pulse = 0.45 + 0.55 * Math.sin(now * 0.0018 + particle.seed);
        const edgeFade = bottomTaper(particle.x, width);

        if (
          particle.x > width * 0.98 ||
          particle.y < height * 0.55 ||
          edgeFade < 0.04
        ) {
          recycleParticle(particle, width, height);
          continue;
        }

        const alpha =
          (dark ? 0.55 : 0.4) *
          pulse *
          Math.min(1, edgeFade + 0.15) *
          Math.min(1, (rise - 0.12) / 0.55);
        ctx.beginPath();
        ctx.fillStyle = `rgb(${rgb} / ${alpha})`;
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgb(${rgb} / ${alpha * 0.28})`;
        ctx.arc(particle.x, particle.y, particle.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      rgb = readRgb(canvas);
      dark = isDarkTheme();

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';

      const reduced = reducedMotion.matches;
      const progress = sampleReveal(now, reduced);
      const entering = revealTo >= revealFrom;
      const t = reduced ? 0 : now / 1000;
      const breath = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(now * 0.00042);
      const glow = layerMotion(progress, 0, entering);

      drawCornerGlow(breath, glow.rise);
      BOTTOM_LAYERS.forEach((layer, index) => {
        const delay = reduced ? 0 : (BOTTOM_LAYERS.length - 1 - index) * 0.08;
        const motion = layerMotion(progress, delay, entering);
        drawBottomRibbon(layer, t, breath, motion.rise, motion.inflate);
      });
      BOTTOM_WISPS.forEach((wisp, index) => {
        const delay = reduced ? 0 : 0.06 + index * 0.07;
        const motion = layerMotion(progress, delay, entering);
        drawBottomWisp(wisp, t, breath, motion.rise, motion.inflate);
      });
      drawParticles(now, reduced ? 0 : dt, reduced, glow.rise);
      ctx.globalCompositeOperation = 'source-over';
    };

    const tick = (now: number) => {
      raf = 0;
      draw(now);
      const retracting = !activeRef.current && linearReveal <= 0.001;
      if (retracting) {
        ctx.clearRect(0, 0, width, height);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf === 0) {
        lastTs = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    startRef.current = start;
    resize();
    start();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      if (activeRef.current || raf !== 0) {
        start();
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      startRef.current = () => undefined;
      observer.disconnect();
      themeObserver.disconnect();
      if (raf !== 0) {
        cancelAnimationFrame(raf);
      }
    };
  }, []);

  return (
    <div aria-hidden className="lyric-pause-atmosphere">
      <canvas ref={canvasRef} className="size-full" />
    </div>
  );
}
