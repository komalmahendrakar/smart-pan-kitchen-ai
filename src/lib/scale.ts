function parseNum(s: string): number | null {
  s = s.trim();
  const unicode: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 };
  let m = s.match(/^(\d+)?\s*([½¼¾⅓⅔⅛])$/);
  if (m) return (m[1] ? parseInt(m[1]) : 0) + unicode[m[2]];
  m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (m) return parseInt(m[1]) + parseInt(m[2]) / parseInt(m[3]);
  m = s.match(/^(\d+)\/(\d+)$/);
  if (m) return parseInt(m[1]) / parseInt(m[2]);
  if (/^\d*\.?\d+$/.test(s)) return parseFloat(s);
  return null;
}

function fmt(n: number): string {
  const whole = Math.floor(n);
  const frac = n - whole;
  const fracs: [number, string][] = [[0, ''], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '']];
  let best = fracs[0];
  for (const f of fracs) if (Math.abs(frac - f[0]) < Math.abs(frac - best[0])) best = f;
  if (Math.abs(frac - best[0]) > 0.06 && n >= 10) return String(Math.round(n));
  if (Math.abs(frac - best[0]) > 0.06) return String(Math.round(n * 10) / 10);
  const w = best[0] === 1 ? whole + 1 : whole;
  if (!best[1]) return String(w);
  return w ? `${w}${best[1]}` : best[1];
}

/** Scales numeric quantities (incl. fractions and ranges like "2-3"); leaves text like "to taste" unchanged. */
export function scaleQuantity(q: string, factor: number): string {
  if (factor === 1 || !q) return q;
  const range = q.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (range) {
    const a = parseNum(range[1]), b = parseNum(range[2]);
    if (a !== null && b !== null) return `${fmt(a * factor)}-${fmt(b * factor)}`;
  }
  const n = parseNum(q);
  return n === null ? q : fmt(n * factor);
}
