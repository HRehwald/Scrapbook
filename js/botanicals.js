// Hand-drawn-looking botanical cut-outs, rendered procedurally onto canvases.
import { rng, makeCanvas, shade, rgba } from './util.js';

export const BOTANICALS = [
  { id: 'bougainvillea', name: 'Bougainvillea', w: 190, h: 170 },
  { id: 'olive', name: 'Olive branch', w: 240, h: 120 },
  { id: 'daisy', name: 'Daisy', w: 120, h: 190 },
  { id: 'orange', name: 'Orange slice', w: 110, h: 110 },
  { id: 'lemon', name: 'Lemon', w: 150, h: 120 },
  { id: 'lavender', name: 'Lavender', w: 110, h: 230 },
  { id: 'eucalyptus', name: 'Eucalyptus', w: 130, h: 240 },
  { id: 'fern', name: 'Fern', w: 120, h: 240 },
  { id: 'poppy', name: 'Poppy', w: 130, h: 200 },
  { id: 'blossom', name: 'Blossom sprig', w: 220, h: 140 },
];

export const botanical = (id) => BOTANICALS.find((b) => b.id === id) || BOTANICALS[0];

function leafShape(ctx, len, wid) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.3, -wid, len * 0.7, -wid, len, 0);
  ctx.bezierCurveTo(len * 0.7, wid, len * 0.3, wid, 0, 0);
  ctx.closePath();
}

function leaf(ctx, x, y, len, wid, angle, color, vein = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  leafShape(ctx, len, wid);
  const g = ctx.createLinearGradient(0, -wid, 0, wid);
  g.addColorStop(0, shade(color, 25));
  g.addColorStop(0.5, color);
  g.addColorStop(1, shade(color, -30));
  ctx.fillStyle = g;
  ctx.fill();
  if (vein) {
    ctx.strokeStyle = rgba('#ffffff', 0.25);
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(2, 0); ctx.quadraticCurveTo(len * 0.5, -wid * 0.1, len * 0.92, 0); ctx.stroke();
  }
  ctx.restore();
}

function stem(ctx, pts, width, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 3) ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
  else ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
  ctx.stroke();
}

// point & tangent on a quadratic curve
function qpt(p, t) {
  const [a, b, c] = p;
  const x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0];
  const y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1];
  const dx = 2 * (1 - t) * (b[0] - a[0]) + 2 * t * (c[0] - b[0]);
  const dy = 2 * (1 - t) * (b[1] - a[1]) + 2 * t * (c[1] - b[1]);
  return [x, y, Math.atan2(dy, dx)];
}

function petalFlower(ctx, x, y, n, len, wid, color, centre, rot = 0, cr = 3) {
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(len / 2, 0, len / 2, wid, 0, 0, Math.PI * 2);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, shade(color, -30));
    g.addColorStop(0.4, color);
    g.addColorStop(1, shade(color, 12));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = centre;
  ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.fill();
}

const DRAW = {
  bougainvillea(ctx, r, W, H) {
    // leaves behind
    for (let i = 0; i < 6; i++) leaf(ctx, W * 0.5 + (r() - 0.5) * 60, H * 0.55 + (r() - 0.5) * 50, 50 + r() * 20, 14, r() * 6.3, '#5f7f3e');
    const bract = (x, y, s, a, col) => {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-22, -8, -20, -34, 0, -38);
      ctx.bezierCurveTo(20, -34, 22, -8, 0, 0);
      const g = ctx.createRadialGradient(0, -8, 2, 0, -20, 30);
      g.addColorStop(0, shade(col, -40)); g.addColorStop(1, shade(col, 20));
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = rgba('#4a0a2a', 0.25); ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -34);
      for (let k = 1; k < 4; k++) { ctx.moveTo(0, -k * 9); ctx.lineTo(-10, -k * 9 - 7); ctx.moveTo(0, -k * 9); ctx.lineTo(10, -k * 9 - 7); }
      ctx.stroke();
      ctx.restore();
    };
    const clusters = [[W * 0.35, H * 0.4], [W * 0.62, H * 0.35], [W * 0.5, H * 0.66], [W * 0.75, H * 0.62], [W * 0.25, H * 0.68]];
    for (const [cx, cy] of clusters) {
      const col = ['#c0307a', '#b8266e', '#d0428a', '#a81e62'][Math.floor(r() * 4)];
      for (let k = 0; k < 3; k++) bract(cx, cy, 0.8 + r() * 0.3, (k / 3) * Math.PI * 2 + r(), col);
      ctx.fillStyle = '#f7efd8';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx + (r() - 0.5) * 6, cy + (r() - 0.5) * 6, 2.2, 0, Math.PI * 2); ctx.fill(); }
    }
  },
  olive(ctx, r, W, H) {
    const p = [[8, H * 0.7], [W * 0.45, H * 0.2], [W - 10, H * 0.45]];
    stem(ctx, p, 3, '#6b5a3a');
    for (let i = 1; i < 16; i++) {
      const t = i / 16;
      const [x, y, a] = qpt(p, t);
      const side = i % 2 ? 1 : -1;
      leaf(ctx, x, y, 44 - t * 16, 6.5, a + side * (0.55 + r() * 0.25), i % 3 ? '#7d8f5a' : '#95a577');
    }
    for (let i = 0; i < 4; i++) {
      const [x, y] = qpt(p, 0.25 + i * 0.17);
      const col = i % 2 ? '#3e2a3a' : '#7a8a3a';
      const g = ctx.createRadialGradient(x - 2, y + 8, 1, x, y + 10, 9);
      g.addColorStop(0, shade(col, 50)); g.addColorStop(1, col);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y + 11, 6, 8, 0.3, 0, Math.PI * 2); ctx.fill();
    }
  },
  daisy(ctx, r, W, H) {
    stem(ctx, [[W / 2, H - 5], [W / 2 - 10, H * 0.6], [W / 2, H * 0.33]], 3, '#5f7f3e');
    leaf(ctx, W / 2 - 4, H * 0.75, 40, 8, -2.6, '#5f7f3e');
    leaf(ctx, W / 2 - 4, H * 0.62, 36, 7, -0.4, '#6f8f4e');
    const cx = W / 2, cy = H * 0.3;
    petalFlower(ctx, cx, cy, 18, 44, 6, '#fbf8ef', '#e8b830', r() * 1, 12);
    ctx.fillStyle = '#c98f1a';
    for (let i = 0; i < 30; i++) { const a = r() * 6.3, d = r() * 10; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1, 0, Math.PI * 2); ctx.fill(); }
  },
  orange(ctx, r, W, H) {
    const cx = W / 2, cy = H / 2, R = W / 2 - 6;
    ctx.fillStyle = '#e8801a';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbeed2';
    ctx.beginPath(); ctx.arc(cx, cy, R - 6, 0, Math.PI * 2); ctx.fill();
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 + 0.05, a1 = ((i + 1) / n) * Math.PI * 2 - 0.05;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos((a0 + a1) / 2) * 5, cy + Math.sin((a0 + a1) / 2) * 5);
      ctx.arc(cx, cy, R - 10, a0, a1);
      ctx.closePath();
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, R - 10);
      g.addColorStop(0, '#fbc46a'); g.addColorStop(1, '#f39a1f');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,240,200,0.5)'; ctx.lineWidth = 0.6;
      for (let k = 0; k < 4; k++) {
        const a = a0 + (a1 - a0) * r(), d0 = 10 + r() * 15, d1 = d0 + 8 + r() * 10;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * d0, cy + Math.sin(a) * d0); ctx.lineTo(cx + Math.cos(a) * d1, cy + Math.sin(a) * d1); ctx.stroke();
      }
    }
    ctx.fillStyle = '#fbeed2';
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
  },
  lemon(ctx, r, W, H) {
    leaf(ctx, W * 0.55, H * 0.22, 60, 16, -0.4, '#4f7a3a');
    leaf(ctx, W * 0.5, H * 0.25, 50, 13, -2.4, '#5f8a45');
    ctx.save();
    ctx.translate(W * 0.48, H * 0.58); ctx.rotate(-0.25);
    ctx.beginPath();
    ctx.ellipse(0, 0, 58, 42, 0, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(-18, -14, 4, 0, 0, 60);
    g.addColorStop(0, '#fff3a0'); g.addColorStop(0.6, '#f2cf3a'); g.addColorStop(1, '#c99a14');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = '#d9a820';
    ctx.beginPath(); ctx.ellipse(58, 0, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-58, 0, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(160,120,20,0.25)';
    for (let i = 0; i < 60; i++) { ctx.beginPath(); ctx.arc((r() - 0.5) * 90, (r() - 0.5) * 60, 0.8, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  },
  lavender(ctx, r, W, H) {
    for (let s = 0; s < 3; s++) {
      const bx = W / 2 + (s - 1) * 14, tx = W / 2 + (s - 1) * 34;
      const p = [[bx, H - 4], [bx + (s - 1) * 6, H * 0.5], [tx, 14 + s * 10]];
      stem(ctx, p, 2, '#7d8f5a');
      for (let i = 0; i < 14; i++) {
        const [x, y] = qpt(p, 1 - i * 0.03);
        for (const side of [-1, 1]) {
          ctx.fillStyle = ['#8a6ab8', '#7a58a8', '#9d80c8'][Math.floor(r() * 3)];
          ctx.beginPath(); ctx.ellipse(x + side * (3 + r() * 2), y, 3.2, 4.5, side * 0.5, 0, Math.PI * 2); ctx.fill();
        }
      }
      leaf(ctx, bx, H * 0.8, 36, 3.5, -1.9 - s * 0.3, '#8a9a6a', false);
    }
  },
  eucalyptus(ctx, r, W, H) {
    const p = [[W * 0.5, H - 4], [W * 0.3, H * 0.5], [W * 0.55, 8]];
    stem(ctx, p, 2.5, '#8a6a5a');
    for (let i = 1; i < 11; i++) {
      const [x, y] = qpt(p, 1 - i / 11);
      const rad = 13 + (i / 11) * 8;
      for (const side of [-1, 1]) {
        const lx = x + side * rad * 0.9, ly = y + 2;
        const g = ctx.createRadialGradient(lx - 3, ly - 3, 1, lx, ly, rad);
        g.addColorStop(0, '#b9cbbf'); g.addColorStop(1, '#6f8f86');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(lx, ly, rad, rad * 0.85, side * 0.3, 0, Math.PI * 2); ctx.fill();
      }
    }
  },
  fern(ctx, r, W, H) {
    const p = [[W / 2, H - 4], [W / 2 + 18, H / 2], [W / 2 - 6, 6]];
    stem(ctx, p, 2, '#4f6f35');
    for (let i = 1; i < 22; i++) {
      const t = i / 22;
      const [x, y, a] = qpt(p, t);
      const len = 44 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + 6;
      for (const side of [-1, 1]) leaf(ctx, x, y, len, 4.5, a + side * 1.25, i % 2 ? '#5f8a45' : '#6f9a50', false);
    }
  },
  poppy(ctx, r, W, H) {
    stem(ctx, [[W / 2, H - 4], [W / 2 + 14, H * 0.6], [W / 2, H * 0.4]], 2.5, '#6f8a4a');
    leaf(ctx, W / 2 + 4, H * 0.8, 40, 7, -0.6, '#6f8a4a');
    const cx = W / 2, cy = H * 0.3;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      ctx.save(); ctx.translate(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, 0, 30, 34, 0, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(-16, 0, 2, 0, 0, 36);
      g.addColorStop(0, '#8a1a14'); g.addColorStop(0.35, '#d8322a'); g.addColorStop(1, '#ef5a3a');
      ctx.fillStyle = g; ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#2a2320';
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a2320'; ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.28; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16); ctx.stroke(); }
  },
  blossom(ctx, r, W, H) {
    const p = [[6, H * 0.8], [W * 0.45, H * 0.35], [W - 8, H * 0.3]];
    stem(ctx, p, 4, '#5a3a2a');
    stem(ctx, [qpt(p, 0.4).slice(0, 2), [W * 0.4, H * 0.8], [W * 0.62, H * 0.85]], 2.5, '#5a3a2a');
    for (let i = 0; i < 9; i++) {
      const [x, y] = qpt(p, 0.15 + i * 0.1);
      petalFlower(ctx, x + (r() - 0.5) * 14, y + (r() - 0.5) * 14, 5, 13, 6.5, ['#f6c7d0', '#f2b3c2', '#fbe0e6'][Math.floor(r() * 3)], '#c4506a', r() * 6, 2.5);
    }
    petalFlower(ctx, W * 0.6, H * 0.84, 5, 12, 6, '#f6c7d0', '#c4506a', 1, 2.5);
  },
};

const cache = new Map();

// Returns a canvas of the botanical (natural size * res), cached per item.
export function renderBotanical(item, res = 2) {
  const b = botanical(item.kind);
  const key = [item.kind, item.id, res, item.flip, item.diecut].join('|');
  if (cache.has(key)) return cache.get(key);
  const pad = 10;
  const W = b.w + pad * 2, H = b.h + pad * 2;
  const art = makeCanvas(W * res, H * res);
  const ctx = art.getContext('2d');
  ctx.scale(res, res);
  if (item.flip) { ctx.translate(W, 0); ctx.scale(-1, 1); }
  ctx.translate(pad, pad);
  DRAW[b.id](ctx, rng(item.id || b.id), b.w, b.h);
  let out = art;
  if (item.diecut) {
    out = makeCanvas(art.width, art.height);
    const o = out.getContext('2d');
    const white = makeCanvas(art.width, art.height);
    const w = white.getContext('2d');
    w.drawImage(art, 0, 0);
    w.globalCompositeOperation = 'source-in';
    w.fillStyle = '#fdfaf2';
    w.fillRect(0, 0, white.width, white.height);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      o.drawImage(white, Math.cos(a) * 5 * res, Math.sin(a) * 5 * res);
    }
    o.drawImage(art, 0, 0);
  }
  const result = { canvas: out, W, H, pad };
  cache.set(key, result);
  return result;
}

export function botanicalThumb(id) {
  const k = 'thumb|' + id;
  if (cache.has(k)) return cache.get(k);
  const { canvas } = renderBotanical({ kind: id, id: 'thumb-' + id }, 1);
  const url = canvas.toDataURL();
  cache.set(k, url);
  return url;
}
