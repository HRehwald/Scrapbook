// Destination-themed papers, drawn procedurally at 600 × 800.
import { fibres, rgba, shade } from './util.js';
import { fill, vignette, blotches } from './papers.js';

const W = 600, H = 800;

export const WORLD_PAPERS = [
  { id: 'aegean', name: 'Aegean (Greece)', swatch: '#1f5fa8' },
  { id: 'lemons', name: 'Amalfi lemons (Italy)', swatch: '#f2cf3a' },
  { id: 'swiss', name: 'Swiss crosses', swatch: '#b3242c' },
  { id: 'kalocsa', name: 'Kalocsa folk (Hungary)', swatch: '#d0402f' },
  { id: 'wycinanki', name: 'Wycinanki (Poland)', swatch: '#2f7d4a' },
  { id: 'nouveau', name: 'Art Nouveau (Prague)', swatch: '#b08d4a' },
  { id: 'sahovnica', name: 'Šahovnica (Croatia)', swatch: '#c8102e' },
  { id: 'breton', name: 'Breton stripes (France)', swatch: '#1f2f55' },
  { id: 'sardines', name: 'Sardines (Portugal)', swatch: '#3d7ea6' },
  { id: 'nordic', name: 'Nordic knit (Norway)', swatch: '#b3262d' },
];

export const WORLD_GRAIN = {
  aegean: 12, lemons: 8, swiss: 14, kalocsa: 8, wycinanki: 8, nouveau: 12, sahovnica: 14, breton: 10, sardines: 8, nordic: 10,
};

// ------------------------------------------------------------------ helpers

function weave(ctx, r, a = 1) {
  for (let y = 0; y < H; y += 2) {
    ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${0.05 * a})` : `rgba(0,0,0,${0.05 * a})`;
    ctx.fillRect(0, y, W, 1);
  }
  for (let x = 0; x < W; x += 2) {
    ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${0.04 * a})` : `rgba(0,0,0,${0.04 * a})`;
    ctx.fillRect(x, 0, 1, H);
  }
}

function ellipse(ctx, x, y, rx, ry, rot, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill();
}

function leaf(ctx, x, y, len, wid, angle, color) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len / 2, -wid, len, 0);
  ctx.quadraticCurveTo(len / 2, wid, 0, 0);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(len * 0.9, 0); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------------ papers

function meander(ctx, y, h, bg, fg) {
  ctx.fillStyle = bg;
  ctx.fillRect(0, y, W, h);
  const u = h * 0.62, top = y + (h - u) / 2, lw = u * 0.13;
  ctx.strokeStyle = fg; ctx.lineWidth = lw; ctx.lineJoin = 'miter'; ctx.lineCap = 'square';
  for (let x = -u; x < W + u; x += u) {
    ctx.beginPath();
    ctx.moveTo(x, top + u);
    ctx.lineTo(x, top);
    ctx.lineTo(x + u * 0.8, top);
    ctx.lineTo(x + u * 0.8, top + u * 0.72);
    ctx.lineTo(x + u * 0.3, top + u * 0.72);
    ctx.lineTo(x + u * 0.3, top + u * 0.34);
    ctx.lineTo(x + u * 0.55, top + u * 0.34);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, top + u); ctx.lineTo(x + u, top + u); ctx.stroke();
  }
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, y + 5); ctx.lineTo(W, y + 5); ctx.moveTo(0, y + h - 5); ctx.lineTo(W, y + h - 5); ctx.stroke();
}

function aegean(ctx, r) {
  fill(ctx, '#f5f2ea');
  blotches(ctx, r, '#d9d4c6', 30, 90, 0.35);
  for (let i = 0; i < 2500; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.6)' : 'rgba(150,140,120,0.18)';
    ctx.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2);
  }
  meander(ctx, 0, 64, '#1f5fa8', '#f5f2ea');
  meander(ctx, H - 64, 64, '#1f5fa8', '#f5f2ea');
  vignette(ctx, '#5a6a80', 0.25, 0.4);
}

function lemons(ctx, r) {
  fill(ctx, '#f7f1e1');
  weave(ctx, r, 0.8);
  for (let y = 30, row = 0; y < H + 60; y += 105, row++) {
    for (let x = row % 2 ? 70 : 10; x < W + 60; x += 125) {
      const cx = x + (r() - 0.5) * 20, cy = y + (r() - 0.5) * 20, a = (r() - 0.5) * 1.2;
      leaf(ctx, cx, cy - 6, 38, 11, a - 2.2, '#3f6b3a');
      leaf(ctx, cx, cy - 6, 34, 10, a - 0.9, '#4f7f45');
      ctx.save();
      ctx.translate(cx + 6, cy + 14); ctx.rotate(a);
      const g = ctx.createRadialGradient(-8, -6, 2, 0, 0, 28);
      g.addColorStop(0, '#fff3a0'); g.addColorStop(0.6, '#f2cf3a'); g.addColorStop(1, '#c99a14');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, 26, 19, 0, 0, Math.PI * 2); ctx.fill();
      ellipse(ctx, 26, 0, 4, 3, 0, '#d9a820');
      ctx.restore();
      // little blue ceramic flower between lemons
      const fx = cx + 62, fy = cy + 52;
      ctx.fillStyle = '#2f5a8f';
      for (let k = 0; k < 5; k++) { const t = (k / 5) * Math.PI * 2; ellipse(ctx, fx + Math.cos(t) * 5, fy + Math.sin(t) * 5, 4, 2.6, t, '#2f5a8f'); }
      ellipse(ctx, fx, fy, 2.2, 2.2, 0, '#f2cf3a');
    }
  }
  vignette(ctx, '#8a6a2a', 0.25, 0.4);
}

function swiss(ctx, r) {
  fill(ctx, '#b3242c');
  weave(ctx, r, 1.2);
  blotches(ctx, r, '#7a1418', 20, 110, 0.25);
  ctx.fillStyle = '#f6efe2';
  for (let y = 40, row = 0; y < H + 40; y += 70, row++) {
    for (let x = row % 2 ? 70 : 35; x < W + 40; x += 70) {
      ctx.fillRect(x - 9, y - 3, 18, 6);
      ctx.fillRect(x - 3, y - 9, 6, 18);
    }
  }
  vignette(ctx, '#300508', 0.4, 0.35);
}

function folkFlower(ctx, x, y, s, rot) {
  const ring = (n, rad, len, wid, col) => {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * Math.PI * 2;
      ellipse(ctx, x + Math.cos(a) * rad, y + Math.sin(a) * rad, len, wid, a, col);
    }
  };
  ring(10, s * 0.95, s * 0.42, s * 0.2, '#d0402f');
  ring(8, s * 0.6, s * 0.3, s * 0.15, '#e27aa0');
  ring(6, s * 0.34, s * 0.2, s * 0.1, '#f2c14e');
  ellipse(ctx, x, y, s * 0.2, s * 0.2, 0, '#2f5a8f');
  ellipse(ctx, x, y, s * 0.08, s * 0.08, 0, '#f2c14e');
}

function tulip(ctx, x, y, s, rot, col) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.5);
  ctx.bezierCurveTo(-s * 0.6, s * 0.3, -s * 0.5, -s * 0.4, -s * 0.3, -s * 0.5);
  ctx.lineTo(-s * 0.1, -s * 0.15); ctx.lineTo(0, -s * 0.6); ctx.lineTo(s * 0.1, -s * 0.15); ctx.lineTo(s * 0.3, -s * 0.5);
  ctx.bezierCurveTo(s * 0.5, -s * 0.4, s * 0.6, s * 0.3, 0, s * 0.5);
  ctx.fill();
  ctx.restore();
}

function kalocsa(ctx, r) {
  fill(ctx, '#f7f2e8');
  weave(ctx, r, 1);
  for (let y = 70, row = 0; y < H + 80; y += 150, row++) {
    for (let x = row % 2 ? 150 : 0; x < W + 120; x += 300) {
      // stem & leaves
      for (const side of [-1, 1]) {
        leaf(ctx, x, y + 20, 48, 11, Math.PI / 2 + side * 0.9, '#3f7a3a');
        leaf(ctx, x, y + 50, 38, 9, Math.PI / 2 + side * 1.3, '#5f9a4a');
        tulip(ctx, x + side * 72, y + 18, 26, side * 0.5, side > 0 ? '#2f5a8f' : '#e27aa0');
        ellipse(ctx, x + side * 50, y - 44, 6, 6, 0, '#f2c14e');
        ellipse(ctx, x + side * 38, y - 58, 4, 4, 0, '#d0402f');
      }
      folkFlower(ctx, x, y - 6, 34, r());
    }
  }
  vignette(ctx, '#6a5a3a', 0.2, 0.4);
}

function scallopCircle(ctx, x, y, rad, n, depth, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  for (let i = 0; i <= n * 8; i++) {
    const a = (i / (n * 8)) * Math.PI * 2;
    const k = rad + Math.cos(a * n) * depth;
    const px = x + Math.cos(a) * k, py = y + Math.sin(a) * k;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function wycinanki(ctx, r) {
  fill(ctx, '#f6f1e6');
  weave(ctx, r, 0.6);
  const medallion = (x, y) => {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 3; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 1.5;
    scallopCircle(ctx, x, y, 58, 12, 6, '#2f7d4a');
    scallopCircle(ctx, x, y, 44, 10, 5, '#c8283a');
    scallopCircle(ctx, x, y, 32, 8, 4, '#f2c14e');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ellipse(ctx, x + Math.cos(a) * 18, y + Math.sin(a) * 18, 9, 4.5, a, '#2f5a9f');
    }
    scallopCircle(ctx, x, y, 10, 6, 2, '#e27aa0');
    ctx.restore();
  };
  const sprig = (x, y, rot) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = '#2f7d4a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(0, -24); ctx.stroke();
    for (const s of [-1, 1]) leaf(ctx, 0, 6, 22, 7, -Math.PI / 2 + s * 0.8, '#2f7d4a');
    tulip(ctx, 0, -30, 20, 0, '#c8283a');
    ctx.restore();
  };
  for (let y = 90, row = 0; y < H + 60; y += 170, row++) {
    for (let x = row % 2 ? 190 : 40; x < W + 80; x += 300) {
      medallion(x, y);
      sprig(x + 150, y, 0);
    }
  }
  vignette(ctx, '#6a5a3a', 0.2, 0.4);
}

function nouveau(ctx, r) {
  fill(ctx, '#efe3c8');
  blotches(ctx, r, '#d7c29a', 24, 110, 0.3);
  const gold = '#b08d4a';
  // arched panel
  ctx.fillStyle = rgba('#a8b890', 0.28);
  ctx.beginPath();
  ctx.moveTo(60, H - 60); ctx.lineTo(60, 260); ctx.arc(W / 2, 260, W / 2 - 60, Math.PI, 0); ctx.lineTo(W - 60, H - 60); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = gold; ctx.lineWidth = 3;
  ctx.stroke();
  // halo
  ctx.lineWidth = 1.5;
  for (const rad of [150, 138]) { ctx.beginPath(); ctx.arc(W / 2, 260, rad, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = gold;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a) * 144, 260 + Math.sin(a) * 144, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  // frame
  ctx.lineWidth = 2.5; ctx.strokeRect(22, 22, W - 44, H - 44);
  ctx.lineWidth = 1; ctx.strokeRect(30, 30, W - 60, H - 60);
  // whiplash curls in the corners
  const curl = (x, y, sx, sy) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, 120);
    ctx.bezierCurveTo(0, 40, 40, 0, 120, 0);
    ctx.moveTo(10, 90);
    ctx.bezierCurveTo(20, 40, 50, 25, 70, 40);
    ctx.bezierCurveTo(85, 55, 65, 75, 52, 62);
    ctx.stroke();
    ellipse(ctx, 40, 40, 5, 5, 0, gold);
    ctx.restore();
  };
  curl(40, 40, 1, 1); curl(W - 40, 40, -1, 1); curl(40, H - 40, 1, -1); curl(W - 40, H - 40, -1, -1);
  // stylised lilies along the bottom
  for (let i = 0; i < 5; i++) {
    const x = 120 + i * 90, y = H - 110;
    ctx.strokeStyle = rgba('#6f7f55', 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, H - 60); ctx.quadraticCurveTo(x + 10, y + 20, x, y); ctx.stroke();
    tulip(ctx, x, y - 8, 22, 0, rgba('#c98b7a', 0.85));
  }
  vignette(ctx, '#6e4b2a', 0.35, 0.35);
}

function sahovnica(ctx, r) {
  const s = 50;
  for (let y = 0; y < H; y += s)
    for (let x = 0; x < W; x += s) {
      ctx.fillStyle = ((x + y) / s) % 2 ? '#c8102e' : '#f5efe4';
      ctx.fillRect(x, y, s, s);
    }
  blotches(ctx, r, '#8a5a3a', 30, 90, 0.18);
  fibres(ctx, W, H, 600, 'rgba(255,255,255,0.12)', r);
  vignette(ctx, '#3a1a10', 0.35, 0.35);
}

function breton(ctx, r) {
  fill(ctx, '#f6f1e6');
  weave(ctx, r, 1.2);
  ctx.fillStyle = '#1f2f55';
  for (let y = 18; y < H; y += 44) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x / 90 + y) * 1.2);
    for (let x = W; x >= 0; x -= 20) ctx.lineTo(x, y + 14 + Math.sin(x / 80 + y) * 1.2);
    ctx.closePath();
    ctx.fill();
  }
  weave(ctx, r, 0.8);
  vignette(ctx, '#2a2a3a', 0.25, 0.4);
}

function sardine(ctx, x, y, len, rot, body, r) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  const h = len * 0.26;
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.bezierCurveTo(-len / 4, -h, len / 4, -h * 0.8, len / 2 - 10, 0);
  ctx.bezierCurveTo(len / 4, h * 0.8, -len / 4, h, -len / 2, 0);
  const g = ctx.createLinearGradient(0, -h, 0, h);
  g.addColorStop(0, shade(body, -40)); g.addColorStop(0.5, body); g.addColorStop(1, '#e8eef2');
  ctx.fillStyle = g;
  ctx.fill();
  // tail
  ctx.beginPath();
  ctx.moveTo(len / 2 - 12, 0); ctx.lineTo(len / 2 + 8, -h * 0.8); ctx.lineTo(len / 2 + 2, 0); ctx.lineTo(len / 2 + 8, h * 0.8); ctx.closePath();
  ctx.fillStyle = shade(body, -30);
  ctx.fill();
  // scales & eye
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
  for (let k = -2; k < 4; k++) { ctx.beginPath(); ctx.arc(-len / 6 + k * 9, 0, h * 0.6, -0.9, 0.9); ctx.stroke(); }
  ellipse(ctx, -len / 2 + 9, -2, 3.2, 3.2, 0, '#fdfaf2');
  ellipse(ctx, -len / 2 + 9, -2, 1.6, 1.6, 0, '#1f1a18');
  ctx.restore();
}

function sardines(ctx, r) {
  fill(ctx, '#f4ecda');
  weave(ctx, r, 0.6);
  const bodies = ['#3d7ea6', '#5a8fb0', '#d0402f', '#f2c14e', '#2f8f83', '#8fa6b8'];
  for (let y = 50, row = 0; y < H + 40; y += 80, row++) {
    for (let x = row % 2 ? 110 : 40; x < W + 80; x += 150) {
      sardine(ctx, x, y, 96, (row % 2 ? Math.PI : 0) + (r() - 0.5) * 0.3, bodies[Math.floor(r() * bodies.length)], r);
    }
  }
  vignette(ctx, '#5a4a2a', 0.2, 0.4);
}

const STAR = [
  '.....X.....',
  '....XXX....',
  '.X..XXX..X.',
  'XXX..X..XXX',
  '.XXX...XXX.',
  '..XX.X.XX..',
  '.XXX...XXX.',
  'XXX..X..XXX',
  '.X..XXX..X.',
  '....XXX....',
  '.....X.....',
];

function nordic(ctx, r) {
  const c = 10; // stitch size
  const cols = Math.ceil(W / c), rows = Math.ceil(H / c);
  const red = '#b3262d', cream = '#f3ead8';
  const isCream = (cx, cy) => {
    const band = cy % 22;
    if (band === 0 || band === 21) return cx % 2 === 0;                 // dotted rows
    if (band === 2 || band === 19) return (cx + cy) % 4 < 2;            // tiny checks
    if (band >= 5 && band <= 15) {                                      // Selbu stars
      const sx = cx % 14, sy = band - 5;
      return sx < 11 && STAR[sy][sx] === 'X';
    }
    if (band === 17 || band === 3) return (cx % 6 === Math.abs((cy % 3) - 1) * 2);
    return false;
  };
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const col = isCream(cx, cy) ? cream : red;
      const x = cx * c, y = cy * c;
      ctx.fillStyle = shade(col, -35);
      ctx.fillRect(x, y, c, c);
      // a knit stitch is a little "V" of two loops
      ellipse(ctx, x + c * 0.3, y + c * 0.5, c * 0.28, c * 0.5, -0.45, col);
      ellipse(ctx, x + c * 0.7, y + c * 0.5, c * 0.28, c * 0.5, 0.45, col);
    }
  }
  fibres(ctx, W, H, 1500, 'rgba(255,255,255,0.12)', r, 6);
  vignette(ctx, '#2a0808', 0.3, 0.4);
}

export const WORLD_DRAW = { aegean, lemons, swiss, kalocsa, wycinanki, nouveau, sahovnica, breton, sardines, nordic };
