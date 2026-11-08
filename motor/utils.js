/**
 * UTILS.JS — Funções partilhadas pelo motor.
 */

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function safeNum(v, fallback) {
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

export function media(lista) {
  if (!lista.length) return 0;
  return lista.reduce((a, b) => a + b, 0) / lista.length;
}

export function arredondar(v, casas = 2) {
  const f = Math.pow(10, casas);
  return Math.round(v * f) / f;
}

/**
 * Função logística estável (evita overflow de exp).
 */
export function sigmoid(x, k = 1.0) {
  const xx = clamp(x, -30, 30);
  return 1 / (1 + Math.exp(-k * xx));
}