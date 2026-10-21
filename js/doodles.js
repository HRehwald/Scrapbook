// Illustrated cut-outs (Eiffel Tower, macarons, disco ball, flamingo…), drawn procedurally.
import { rng, makeCanvas, shade, rgba } from './util.js';

export const DOODLES = [
  { id: 'eiffel', name: 'Eiffel Tower', w: 130, h: 280 },
  { id: 'macarons', name: 'Macarons', w: 160, h: 120 },
  { id: 'croissant', name: 'Croissant', w: 160, h: 96 },
  { id: 'baguette', name: 'Baguette', w: 240, h: 64 },
  { id: 'bicycle', name: 'Bicycle', w: 210, h: 140 },
  { id: 'wine', name: 'Wine glass', w: 80, h: 160 },
  { id: 'discoball', name: 'Disco ball', w: 140, h: 200 },
  { id: 'cocktail', name: 'Cocktail', w: 120, h: 170 },
  { id: 'vinyl', name: 'Vinyl record', w: 160, h: 160 },
  { id: 'flamingo', name: 'Flamingo', w: 120, h: 210 },
  { id: 'sailboat', name: 'Sailboat', w: 170, h: 170 },
  { id: 'palm', name: 'Palm tree', w: 170, h: 230 },
];

export const doodle = (id) => DOODLES.find((d) => d.id === id) || DOODLES[0];

function ellipse(ctx, x, y, rx, ry, rot, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const DRAW = {
  eiffel(ctx, r, W, H) {
    const iron = '#4a3b30', cx = W / 2;
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, shade(iron, -15)); g.addColorStop(0.5, shade(iron, 25)); g.addColorStop(1, shade(iron, -20));
    ctx.fillStyle = g;
    // antenna + top
    ctx.fillRect(cx - 1.5, 0, 3, 24);
    ctx.beginPath();
    ctx.moveTo(cx - 5, 24); ctx.lineTo(cx + 5, 24); ctx.lineTo(cx + 13, 118); ctx.lineTo(cx - 13, 118); ctx.closePath(); ctx.fill();
    // first platform
    ctx.fillRect(cx - 22, 116, 44, 7);
    // middle section
    ctx.beginPath();
    ctx.moveTo(cx - 15, 123); ctx.lineTo(cx + 15, 123); ctx.lineTo(cx + 32, 182); ctx.lineTo(cx - 32, 182); ctx.closePath(); ctx.fill();
    ctx.fillRect(cx - 42, 180, 84, 8);
    // legs with the big arch
    ctx.beginPath();
    ctx.moveTo(cx - 36, 188); ctx.lineTo(cx + 36, 188);
    ctx.quadraticCurveTo(cx + 46, 240, cx + W / 2 - 2, H);
    ctx.lineTo(cx + 26, H);
    ctx.quadraticCurveTo(cx + 22, 222, cx, 218);
    ctx.quadraticCurveTo(cx - 22, 222, cx - 26, H);
    ctx.lineTo(cx - W / 2 + 2, H);
    ctx.quadraticCurveTo(cx - 46, 240, cx - 36, 188);
    ctx.closePath(); ctx.fill();
    // lattice
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.strokeStyle = rgba('#f4ead6', 0.35); ctx.lineWidth = 0.9;
    for (let y = 30; y < H; y += 9) {
      const half = y < 118 ? 5 + (y - 24) * 0.085 : y < 182 ? 15 + (y - 123) * 0.29 : 36 + (y - 188) * 0.32;
      ctx.beginPath(); ctx.moveTo(cx - half, y); ctx.lineTo(cx + half, y + 9); ctx.moveTo(cx + half, y); ctx.lineTo(cx - half, y + 9); ctx.stroke();
    }
    ctx.restore();
  },
  macarons(ctx, r, W, H) {
    const mac = (x, y, col) => {
      const shell = (sy) => {
        const g = ctx.createLinearGradient(0, sy - 12, 0, sy + 12);
        g.addColorStop(0, shade(col, 30)); g.addColorStop(1, shade(col, -20));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(x, sy, 34, 13, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = shade(col, -10); // ruffled foot
        for (let i = -30; i <= 30; i += 5) ellipse(ctx, x + i, sy + 9, 3, 2.5, 0, shade(col, -12));
      };
      shell(y + 14);
      ctx.fillStyle = '#fbf3e4'; roundRect(ctx, x - 30, y - 4, 60, 9, 4); ctx.fill();
      shell(y - 10);
      ellipse(ctx, x - 12, y - 16, 10, 3, -0.1, 'rgba(255,255,255,0.35)');
    };
    mac(W * 0.28, H * 0.72, '#f2b5c4');
    mac(W * 0.72, H * 0.72, '#b9dcc2');
    mac(W * 0.5, H * 0.32, '#cdbbe6');
  },
  croissant(ctx, r, W, H) {
    const segs = [[-58, 18, 0.9, 18], [-34, 4, 0.5, 24], [0, -2, 0, 30], [34, 4, -0.5, 24], [58, 18, -0.9, 18]];
    for (const [dx, dy, rot, s] of segs) {
      const x = W / 2 + dx, y = H / 2 + dy;
      const g = ctx.createRadialGradient(x - 4, y - 8, 2, x, y, s * 1.4);
      g.addColorStop(0, '#f7cf7e'); g.addColorStop(0.6, '#d9923a'); g.addColorStop(1, '#a8601e');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(x, y, s * 0.75, s * 1.15, rot, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(120,60,15,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(x, y, s * 0.55, s * 0.95, rot, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
    }
    for (let i = 0; i < 14; i++) ellipse(ctx, W / 2 + (r() - 0.5) * 80, H / 2 - 4 + (r() - 0.5) * 20, 1.4, 0.8, r() * 3, 'rgba(255,240,200,0.7)');
  },
  baguette(ctx, r, W, H) {
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.rotate(-0.12);
    const g = ctx.createLinearGradient(0, -22, 0, 22);
    g.addColorStop(0, '#f2c27a'); g.addColorStop(0.5, '#d48a3a'); g.addColorStop(1, '#9a5a1e');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, W / 2 - 10, 20, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = -3; i <= 3; i++) {
      ctx.fillStyle = '#f7dca8';
      ctx.beginPath(); ctx.ellipse(i * 28, -4, 11, 4, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(120,60,15,0.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(i * 28, -4, 11, 4, -0.5, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 40; i++) ctx.fillRect((r() - 0.5) * (W - 40), -12 + r() * 10, 1.2, 1.2);
    ctx.restore();
  },
  bicycle(ctx, r, W, H) {
    const wheel = (x) => {
      ctx.strokeStyle = '#2b2522'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(x, H - 40, 36, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(43,37,34,0.5)'; ctx.lineWidth = 0.8;
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x, H - 40); ctx.lineTo(x + Math.cos(a) * 34, H - 40 + Math.sin(a) * 34); ctx.stroke(); }
    };
    wheel(48); wheel(W - 48);
    const frame = '#7fb3a6';
    ctx.strokeStyle = frame; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const bx = 48, fx = W - 48, y = H - 40;
    ctx.beginPath();
    ctx.moveTo(bx, y); ctx.lineTo(92, y - 50); ctx.lineTo(fx - 26, y - 50); ctx.lineTo(fx, y);
    ctx.moveTo(bx, y); ctx.lineTo(104, y); ctx.lineTo(92, y - 50);
    ctx.moveTo(104, y); ctx.lineTo(fx - 26, y - 50);
    ctx.moveTo(fx - 26, y - 50); ctx.lineTo(fx - 32, y - 70);
    ctx.stroke();
    ctx.strokeStyle = '#2b2522'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(fx - 40, y - 72); ctx.quadraticCurveTo(fx - 30, y - 76, fx - 18, y - 68); ctx.stroke();
    ellipse(ctx, 88, y - 56, 13, 4, 0, '#6b3f26');
    // basket with flowers and a baguette
    ctx.fillStyle = '#c9a06a';
    roundRect(ctx, fx - 22, y - 64, 40, 26, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(110,70,30,0.6)'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(fx - 18 + i * 8, y - 64); ctx.lineTo(fx - 18 + i * 8, y - 38); ctx.stroke(); }
    ctx.save(); ctx.translate(fx - 4, y - 72); ctx.rotate(-0.6);
    ellipse(ctx, 0, 0, 22, 5, 0, '#d48a3a');
    ctx.restore();
    for (const [dx, dy, c] of [[-14, -70, '#e27aa0'], [-6, -76, '#f2c14e'], [6, -70, '#e8b4a6'], [-18, -66, '#fdfaf2']]) ellipse(ctx, fx + dx, y + dy, 5, 5, 0, c);
  },
  wine(ctx, r, W, H) {
    const cx = W / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 30, 10); ctx.quadraticCurveTo(cx - 34, 70, cx, 82); ctx.quadraticCurveTo(cx + 34, 70, cx + 30, 10); ctx.closePath();
    ctx.fillStyle = 'rgba(230,236,240,0.55)'; ctx.fill();
    ctx.clip();
    const g = ctx.createLinearGradient(0, 40, 0, 82);
    g.addColorStop(0, '#9e1f3a'); g.addColorStop(1, '#5a0f20');
    ctx.fillStyle = g; ctx.fillRect(0, 40, W, 50);
    ctx.restore();
    ctx.strokeStyle = 'rgba(80,90,100,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 30, 10); ctx.quadraticCurveTo(cx - 34, 70, cx, 82); ctx.quadraticCurveTo(cx + 34, 70, cx + 30, 10); ctx.stroke();
    ctx.fillStyle = 'rgba(210,220,226,0.9)';
    ctx.fillRect(cx - 2, 82, 4, 60);
    ctx.beginPath(); ctx.ellipse(cx, 146, 26, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 20, 20); ctx.quadraticCurveTo(cx - 24, 50, cx - 14, 66); ctx.stroke();
  },
  discoball(ctx, r, W, H) {
    const cx = W / 2, cy = H - 70, R = 62;
    ctx.strokeStyle = '#8a8580'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, cy - R); ctx.stroke();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    const s = 11;
    for (let y = cy - R; y < cy + R; y += s) {
      const lat = Math.asin(Math.max(-1, Math.min(1, (y + s / 2 - cy) / R)));
      const rowW = Math.cos(lat) * R;
      const off = (Math.floor((y - cy) / s) % 2) * s / 2;
      for (let x = cx - R - s + off; x < cx + R + s; x += s) {
        const t = (x - cx) / Math.max(rowW, 1);
        const light = 0.45 + 0.5 * Math.max(0, 1 - Math.hypot(t + 0.35, (y - cy) / R + 0.35)) + (r() - 0.5) * 0.35;
        const v = Math.round(Math.max(0, Math.min(1, light)) * 255);
        const tint = r() < 0.08 ? (r() < 0.5 ? '#ff7fc8' : '#7fe8ff') : `rgb(${v},${v},${Math.min(255, v + 12)})`;
        ctx.fillStyle = tint;
        ctx.fillRect(x + 0.6, y + 0.6, s * Math.max(0.35, Math.cos(lat)) - 1.2, s - 1.2);
      }
    }
    const sh = ctx.createRadialGradient(cx - 25, cy - 25, 5, cx, cy, R);
    sh.addColorStop(0, 'rgba(255,255,255,0.25)'); sh.addColorStop(1, 'rgba(20,20,40,0.55)');
    ctx.fillStyle = sh; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
    // sparkles
    ctx.fillStyle = '#ffffff';
    for (const [x, y, k] of [[cx - 40, cy - 40, 9], [cx + 48, cy - 10, 6], [cx - 10, cy + 30, 5]]) {
      ctx.beginPath(); ctx.moveTo(x, y - k); ctx.lineTo(x + k * 0.25, y); ctx.lineTo(x, y + k); ctx.lineTo(x - k * 0.25, y); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - k, y); ctx.lineTo(x, y + k * 0.25); ctx.lineTo(x + k, y); ctx.lineTo(x, y - k * 0.25); ctx.closePath(); ctx.fill();
    }
  },
  cocktail(ctx, r, W, H) {
    const cx = W / 2 - 6;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx - 34, 50); ctx.lineTo(cx + 34, 50); ctx.lineTo(cx + 24, 140); ctx.lineTo(cx - 24, 140); ctx.closePath();
    ctx.clip();
    const g = ctx.createLinearGradient(0, 50, 0, 140);
    g.addColorStop(0, '#ffb35c'); g.addColorStop(0.5, '#ff6f91'); g.addColorStop(1, '#c2185b');
    ctx.fillStyle = g; ctx.fillRect(0, 60, W, 90);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 6; i++) { roundRect(ctx, cx - 18 + r() * 24, 70 + r() * 50, 12, 12, 2); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(220,230,236,0.95)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx - 34, 50); ctx.lineTo(cx - 24, 140); ctx.lineTo(cx + 24, 140); ctx.lineTo(cx + 34, 50); ctx.stroke();
    ctx.fillStyle = 'rgba(220,230,236,0.95)'; ctx.fillRect(cx - 24, 140, 48, 6);
    // straw, umbrella, lime
    ctx.strokeStyle = '#3de3ff'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx + 6, 120); ctx.lineTo(cx + 28, 20); ctx.stroke();
    ctx.save(); ctx.translate(cx - 16, 40); ctx.rotate(-0.4);
    ctx.strokeStyle = '#6b3f26'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 30); ctx.stroke();
    ['#ff4fa3', '#ffe14d', '#59c8ff', '#ff4fa3', '#ffe14d'].forEach((c, i) => {
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.arc(0, 0, 30, Math.PI + (i * Math.PI) / 5, Math.PI + ((i + 1) * Math.PI) / 5); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
    ctx.fillStyle = '#7cc242'; ctx.beginPath(); ctx.arc(cx + 34, 52, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9f0a0'; ctx.beginPath(); ctx.arc(cx + 34, 52, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7cc242'; ctx.lineWidth = 1;
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + 34, 52); ctx.lineTo(cx + 34 + Math.cos(a) * 11, 52 + Math.sin(a) * 11); ctx.stroke(); }
  },
  vinyl(ctx, r, W, H) {
    const cx = W / 2, cy = H / 2, R = W / 2 - 4;
    ellipse(ctx, cx, cy, R, R, 0, '#151313');
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
    for (let k = R - 4; k > R * 0.38; k -= 3) { ctx.beginPath(); ctx.arc(cx, cy, k, 0, Math.PI * 2); ctx.stroke(); }
    const shine = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    shine.addColorStop(0.3, 'rgba(255,255,255,0)'); shine.addColorStop(0.5, 'rgba(255,255,255,0.14)'); shine.addColorStop(0.7, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ellipse(ctx, cx, cy, R * 0.34, R * 0.34, 0, '#ff4fa3');
    ellipse(ctx, cx, cy, R * 0.22, R * 0.22, 0, '#ffe14d');
    ellipse(ctx, cx, cy, 3.5, 3.5, 0, '#151313');
  },
  flamingo(ctx, r, W, H) {
    const pink = '#f28fb0';
    ctx.strokeStyle = '#d9708f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(60, 120); ctx.lineTo(62, H - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(56, 120); ctx.lineTo(50, 160); ctx.lineTo(64, 168); ctx.stroke();
    const g = ctx.createRadialGradient(58, 96, 4, 60, 104, 44);
    g.addColorStop(0, shade(pink, 25)); g.addColorStop(1, shade(pink, -25));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(60, 104, 40, 24, -0.25, 0, Math.PI * 2); ctx.fill();
    ellipse(ctx, 76, 98, 22, 12, -0.5, shade(pink, -15));
    // neck S-curve
    ctx.strokeStyle = pink; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(30, 96); ctx.bezierCurveTo(10, 70, 46, 54, 34, 30); ctx.stroke();
    ellipse(ctx, 36, 24, 10, 8, 0, pink);
    ctx.fillStyle = '#f7e9d6';
    ctx.beginPath(); ctx.moveTo(42, 22); ctx.quadraticCurveTo(58, 26, 54, 42); ctx.lineTo(48, 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2b2522';
    ctx.beginPath(); ctx.moveTo(52, 34); ctx.quadraticCurveTo(56, 38, 54, 42); ctx.lineTo(50, 36); ctx.closePath(); ctx.fill();
    ellipse(ctx, 37, 21, 1.6, 1.6, 0, '#2b2522');
  },
  sailboat(ctx, r, W, H) {
    const base = H - 40;
    ctx.fillStyle = '#e9eef2';
    ctx.beginPath(); ctx.moveTo(84, 12); ctx.lineTo(84, base - 16); ctx.lineTo(20, base - 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f6f2ea';
    ctx.beginPath(); ctx.moveTo(90, 26); ctx.lineTo(90, base - 16); ctx.lineTo(146, base - 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath(); ctx.moveTo(84, 12); ctx.lineTo(84, base - 16); ctx.lineTo(60, base - 16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6b3f26'; ctx.fillRect(85, 6, 4, base - 18);
    ctx.fillStyle = '#c8323a';
    ctx.beginPath(); ctx.moveTo(89, 6); ctx.lineTo(108, 12); ctx.lineTo(89, 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1f3a5f';
    ctx.beginPath(); ctx.moveTo(14, base - 14); ctx.lineTo(156, base - 14); ctx.lineTo(134, base + 6); ctx.lineTo(32, base + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f6f2ea'; ctx.fillRect(22, base - 9, 126, 3);
    ctx.strokeStyle = '#4aa3c8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const yy of [base + 14, base + 26]) {
      ctx.beginPath();
      for (let x = 6; x <= W - 6; x += 2) { const y = yy + Math.sin(x / 9 + yy) * 3; x === 6 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
  },
  palm(ctx, r, W, H) {
    const tx = W / 2 + 16;
    ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx - 10, H - 4); ctx.quadraticCurveTo(tx + 14, H / 2, tx - 6, 62); ctx.stroke();
    ctx.strokeStyle = 'rgba(70,50,30,0.5)'; ctx.lineWidth = 2;
    for (let y = 80; y < H - 10; y += 14) { ctx.beginPath(); ctx.moveTo(tx - 8 + (y / H) * 6, y); ctx.lineTo(tx + 6 + (y / H) * 2, y + 3); ctx.stroke(); }
    const frond = (a, len) => {
      ctx.save(); ctx.translate(tx - 6, 62); ctx.rotate(a);
      ctx.strokeStyle = '#3f7a3a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -14, len, 10); ctx.stroke();
      for (let k = 1; k < 12; k++) {
        const t = k / 12, x = len * t, y = -14 * 4 * t * (1 - t) + 10 * t * t;
        ctx.fillStyle = k % 2 ? '#4f8a45' : '#3f7a3a';
        for (const s of [-1, 1]) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(s * 1.1 + 0.3);
          ctx.beginPath(); ctx.ellipse(10, 0, 11, 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();
    };
    [-2.9, -2.3, -1.6, -0.9, -0.3, 0.3].forEach((a, i) => frond(a, 70 + (i % 2) * 12));
    for (const [dx, dy] of [[-4, 6], [6, 8], [0, 14]]) ellipse(ctx, tx - 6 + dx, 62 + dy, 6, 6, 0, '#6b4a2a');
  },
};

const cache = new Map();

// Returns { canvas, W, H, pad } for a doodle item, rendered at `res`.
export function renderDoodle(item, res = 2) {
  const d = doodle(item.kind);
  const key = [item.kind, item.id, res, item.flip, item.tint || ''].join('|');
  if (cache.has(key)) return cache.get(key);
  const pad = 8;
  const W = d.w + pad * 2, H = d.h + pad * 2;
  const c = makeCanvas(W * res, H * res);
  const ctx = c.getContext('2d');
  ctx.scale(res, res);
  if (item.flip) { ctx.translate(W, 0); ctx.scale(-1, 1); }
  ctx.translate(pad, pad);
  DRAW[d.id](ctx, rng(item.id || d.id), d.w, d.h);
  if (item.tint) { // single-colour ink version (used by toile papers)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = item.tint;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  const out = { canvas: c, W, H, pad };
  cache.set(key, out);
  return out;
}

export function doodleThumb(id) {
  const k = 'thumb|' + id;
  if (cache.has(k)) return cache.get(k);
  const url = renderDoodle({ kind: id, id: 'thumb-' + id }, 1).canvas.toDataURL();
  cache.set(k, url);
  return url;
}
