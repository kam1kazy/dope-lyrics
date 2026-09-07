export const START_Y_VH = 52;
export const END_Y_VH = -58;

/** Тормоз при зажатии / клик-паузе */
export const BRAKE_TAU_MS = 160;
/** Инерция после свайпа */
export const COAST_TAU_MS = 240;
/** Ниже этого — считаем скорость нулевой */
export const VELOCITY_EPS = 0.02;
/** Порог флика по |velocity| (единиц elapsed/ms относительно нормальной скорости = 1) */
export const FLICK_VELOCITY_MIN = 0.35;
/** Потолок инерции в vh пути карусели */
export const COAST_MAX_VH = 32;
/** Удержание дольше этого — не клик-пауза */
export const HOLD_TAP_MS = 200;

export type FlickSample = {
  t: number;
  y: number;
};

export function approachVelocity(
  current: number,
  target: number,
  dtMs: number,
  tauMs: number
) {
  if (tauMs <= 0 || dtMs <= 0) {
    return target;
  }

  const alpha = 1 - Math.exp(-dtMs / tauMs);
  const next = current + (target - current) * alpha;

  if (Math.abs(next - target) < VELOCITY_EPS) {
    return target;
  }

  return next;
}

export function spanVh() {
  return END_Y_VH - START_Y_VH;
}

/** Пиксели экрана → сдвиг elapsed (мс карусели) */
export function deltaYToElapsedMs(deltaY: number, animationMs: number) {
  const span = spanVh();

  if (span === 0 || animationMs <= 0 || typeof window === 'undefined') {
    return 0;
  }

  return ((deltaY / window.innerHeight) * 100 * animationMs) / span;
}

/** Скорость пальца (px/ms) → velocity карусели (1 = нормальная скорость) */
export function fingerVelocityToCarousel(pxPerMs: number, animationMs: number) {
  if (animationMs <= 0 || typeof window === 'undefined') {
    return 0;
  }

  const span = spanVh();
  // px/ms → vh/ms → progress/ms → elapsedMs/ms (= velocity units)
  const vhPerMs = (pxPerMs / window.innerHeight) * 100;
  const elapsedPerMs = (vhPerMs * animationMs) / span;

  return elapsedPerMs;
}

export function clampCoastVelocity(velocity: number, animationMs: number) {
  if (animationMs <= 0 || typeof window === 'undefined') {
    return 0;
  }

  const span = Math.abs(spanVh());
  // При coast к 0: displacement ≈ velocity * tau (интеграл экспоненты)
  // max |v| так, чтобы путь ≈ COAST_MAX_VH
  const maxElapsedMs = (COAST_MAX_VH / span) * animationMs;
  const maxAbs = maxElapsedMs / COAST_TAU_MS;

  if (maxAbs <= 0) {
    return 0;
  }

  return Math.max(-maxAbs, Math.min(maxAbs, velocity));
}

export function pushFlickSample(
  samples: FlickSample[],
  y: number,
  t = Date.now(),
  maxSamples = 6
) {
  samples.push({ t, y });

  if (samples.length > maxSamples) {
    samples.splice(0, samples.length - maxSamples);
  }
}

/** Оценка скорости пальца px/ms по последним семплам (положительный = палец вниз) */
export function sampleFlickPxPerMs(samples: FlickSample[]) {
  if (samples.length < 2) {
    return 0;
  }

  const newest = samples[samples.length - 1];
  let oldest = samples[0];

  for (let i = samples.length - 2; i >= 0; i -= 1) {
    const candidate = samples[i];
    const dt = newest.t - candidate.t;

    if (dt >= 32) {
      oldest = candidate;
      break;
    }

    oldest = candidate;
  }

  const dt = newest.t - oldest.t;

  if (dt <= 0) {
    return 0;
  }

  return (newest.y - oldest.y) / dt;
}

export function resolveFlickVelocity(
  samples: FlickSample[],
  animationMs: number
) {
  const pxPerMs = sampleFlickPxPerMs(samples);
  const raw = fingerVelocityToCarousel(pxPerMs, animationMs);

  if (Math.abs(raw) < FLICK_VELOCITY_MIN) {
    return 0;
  }

  return clampCoastVelocity(raw, animationMs);
}
