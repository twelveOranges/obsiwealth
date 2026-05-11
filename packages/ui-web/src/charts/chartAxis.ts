/**
 * Pure chart math helpers previously inlined on `ObsiWealthMainView`.
 *
 * These functions have no dependency on Obsidian APIs or view state, so they
 * live standalone for easy reuse and testing.
 */

/**
 * Round `value` up to a "nice" number (1, 2, 2.5, 5, 10 times power of 10).
 * Used to pick readable chart axis maxima.
 */
export function niceCeil(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / exp;
  let nice: number;
  if (n <= 1) nice = 1;
  else if (n <= 2) nice = 2;
  else if (n <= 2.5) nice = 2.5;
  else if (n <= 5) nice = 5;
  else nice = 10;
  return nice * exp;
}

/**
 * Round `value` down to a "nice" number (same 1/2/2.5/5/10 ladder as
 * {@link niceCeil}). Used alongside `niceCeil` to pick readable chart axis
 * minima when the series doesn't start at zero.
 */
export function niceFloor(value: number): number {
  if (value <= 0) {
    return 0;
  }
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / exp;
  let nice: number;
  if (n >= 10) nice = 10;
  else if (n >= 5) nice = 5;
  else if (n >= 2.5) nice = 2.5;
  else if (n >= 2) nice = 2;
  else nice = 1;
  return nice * exp;
}

/**
 * Compact Chinese-style number formatter used for chart axis labels.
 * 100,000,000+ -> "x亿", 10,000+ -> "x万", 1,000+ -> "xk", else rounded int.
 */
export function formatAxisValue(value: number): string {
  if (value === 0) {
    return "0";
  }
  const abs = Math.abs(value);
  if (abs >= 100000000) {
    return `${(value / 100000000).toFixed(abs >= 10 * 100000000 ? 0 : 1)}亿`;
  }
  if (abs >= 10000) {
    return `${(value / 10000).toFixed(abs >= 10 * 10000 ? 0 : 1)}万`;
  }
  if (abs >= 1000) {
    return `${(value / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`;
  }
  return String(Math.round(value));
}

/** Build a smooth cubic Bezier SVG path through the given points. */
export function createSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  const path = [`M ${points[0].x} ${points[0].y}`];
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlDistance = (next.x - current.x) / 2;
    const controlStartX = current.x + controlDistance;
    const controlEndX = next.x - controlDistance;
    path.push(`C ${controlStartX} ${current.y}, ${controlEndX} ${next.y}, ${next.x} ${next.y}`);
  }
  return path.join(" ");
}

/** Convert polar coordinates to Cartesian, with 0° pointing up (north). */
export function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

/**
 * Build an SVG path `d` string describing a donut slice between two angles.
 * Angles are in degrees. `outerRadius > innerRadius`.
 */
export function describeDonutSlice(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}
