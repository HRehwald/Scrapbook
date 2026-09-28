export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Deterministic random numbers so torn edges etc. look the same every render.
export function rng(seed) {
  let h = 1779033703 ^ String(seed).length;
  for (const ch of String(seed)) {
    h = Math.imul(h ^ ch.charCodeAt(0), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

export function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex).map((v) => clamp(Math.round(v + amt), 0, 255));
  return `rgb(${r},${g},${b})`;
}

// Adds subtle per-pixel grain to whatever is already drawn on ctx.
export function grain(ctx, w, h, amount, random = Math.random) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const n = (random() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

// Random short fibres, like in recycled paper.
export function fibres(ctx, w, h, count, color, random = Math.random, len = 14) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 0; i < count; i++) {
    const x = random() * w, y = random() * h;
    const a = random() * Math.PI * 2;
    const l = len * (0.4 + random());
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5,
      x + Math.cos(a) * l, y + Math.sin(a) * l
    );
    ctx.stroke();
  }
  ctx.restore();
}

// Jagged polygon around a rectangle (for torn paper edges).
export function tornRectPath(ctx, x, y, w, h, random, jag = 4, step = 7, sides = 'trbl') {
  const pts = [];
  const edge = (x0, y0, x1, y1, torn) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = torn ? Math.max(2, Math.round(len / step)) : 1;
    const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const off = torn && i > 0 ? (random() - 0.5) * 2 * jag : 0;
      pts.push([x0 + (x1 - x0) * t + nx * off, y0 + (y1 - y0) * t + ny * off]);
    }
  };
  edge(x, y, x + w, y, sides.includes('t'));
  edge(x + w, y, x + w, y + h, sides.includes('r'));
  edge(x + w, y + h, x, y + h, sides.includes('b'));
  edge(x, y + h, x, y, sides.includes('l'));
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
}

export function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

export function slug(s) {
  return (s || 'scrapbook').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'scrapbook';
}
