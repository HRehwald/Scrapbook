// Procedurally generated paper & cover textures, drawn onto canvases.
import { rng, makeCanvas, grain, fibres, rgba } from './util.js';
import { COVERS, COVER_GRAIN, drawCover } from './covers.js';

export const PAGE_W = 600;
export const PAGE_H = 800;

export const PAPERS = [
  { id: 'kraft', name: 'Kraft', swatch: '#c8a27a' },
  { id: 'vintage', name: 'Old paper', swatch: '#ecdcb8' },
  { id: 'lined', name: 'Lined', swatch: '#fbf7ec' },
  { id: 'grid', name: 'Grid', swatch: '#f8f4ea' },
  { id: 'dots', name: 'Dot grid', swatch: '#f7f2e6' },
  { id: 'cream', name: 'Cream', swatch: '#f6efdf' },
  { id: 'music', name: 'Sheet music', swatch: '#f3ead4' },
  { id: 'sage', name: 'Sage card', swatch: '#b9c4a7' },
  { id: 'blush', name: 'Blush card', swatch: '#e6c3b8' },
  { id: 'sky', name: 'Sky card', swatch: '#bccfd9' },
  { id: 'mustard', name: 'Mustard card', swatch: '#d9b26a' },
  { id: 'black', name: 'Black card', swatch: '#2b2826' },
  { id: 'map', name: 'Old map', swatch: '#e9dcbc' },
  { id: 'azulejo', name: 'Azulejo tiles', swatch: '#2f5a8f' },
  { id: 'aged', name: 'Parchment', swatch: '#e3cfa4' },
  { id: 'newsprint', name: 'Newsprint', swatch: '#e6e1d3' },
];

export { COVERS };

const cache = new Map();

export function paperCanvas(id, res = 2) {
  const key = id + '@' + res;
  if (cache.has(key)) return cache.get(key);
  const c = makeCanvas(PAGE_W * res, PAGE_H * res);
  const ctx = c.getContext('2d');
  ctx.scale(res, res);
  draw(ctx, id, rng(id));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // Grain in device pixels for crispness.
  const amt = GRAIN[id] ?? COVER_GRAIN[id] ?? 10;
  if (amt) grain(ctx, c.width, c.height, amt, rng(id + 'g'));
  cache.set(key, c);
  return c;
}

const GRAIN = {
  kraft: 22, vintage: 16, lined: 6, grid: 6, dots: 6, cream: 9, music: 10,
  sage: 14, blush: 14, sky: 14, mustard: 16, black: 12,
  map: 14, azulejo: 12, aged: 20, newsprint: 12,
};

let thumbCache = new Map();
export function paperThumb(id) {
  if (thumbCache.has(id)) return thumbCache.get(id);
  const src = paperCanvas(id, 1);
  const t = makeCanvas(90, 120);
  t.getContext('2d').drawImage(src, 0, 0, 90, 120);
  const url = t.toDataURL('image/png');
  thumbCache.set(id, url);
  return url;
}

export function fill(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
}

export function vignette(ctx, color, strength, inner = 0.45) {
  const g = ctx.createRadialGradient(
    PAGE_W / 2, PAGE_H / 2, Math.min(PAGE_W, PAGE_H) * inner,
    PAGE_W / 2, PAGE_H / 2, Math.hypot(PAGE_W, PAGE_H) / 2
  );
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(1, rgba(color, strength));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
}

export function blotches(ctx, r, color, count, maxR, alpha) {
  for (let i = 0; i < count; i++) {
    const x = r() * PAGE_W, y = r() * PAGE_H, rad = maxR * (0.3 + r());
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, rgba(color, alpha * (0.4 + r() * 0.6)));
    g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}

function coffeeRing(ctx, r, x, y, rad) {
  ctx.save();
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    const start = r() * Math.PI * 2;
    const sweep = Math.PI * (1.2 + r() * 0.8);
    ctx.arc(x + r() * 3, y + r() * 3, rad + k * 1.5, start, start + sweep);
    ctx.strokeStyle = rgba('#8a5a2b', 0.10 + r() * 0.08);
    ctx.lineWidth = 2 + r() * 3;
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(x, y, rad * 0.2, x, y, rad);
  g.addColorStop(0, rgba('#a0703a', 0.02));
  g.addColorStop(1, rgba('#a0703a', 0.07));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}



function draw(ctx, id, r) {
  switch (id) {
    case 'kraft':
      fill(ctx, '#c8a27a');
      blotches(ctx, r, '#a57e55', 30, 90, 0.25);
      blotches(ctx, r, '#dcbc92', 20, 70, 0.25);
      fibres(ctx, PAGE_W, PAGE_H, 900, 'rgba(90,60,30,0.18)', r);
      fibres(ctx, PAGE_W, PAGE_H, 500, 'rgba(255,240,210,0.22)', r);
      vignette(ctx, '#6e4b2a', 0.25);
      break;
    case 'vintage':
      fill(ctx, '#ecdcb8');
      blotches(ctx, r, '#c9a86e', 26, 80, 0.22);
      blotches(ctx, r, '#b58a4c', 14, 6, 0.35); // foxing spots
      fibres(ctx, PAGE_W, PAGE_H, 300, 'rgba(120,90,50,0.10)', r);
      coffeeRing(ctx, r, 470, 640, 48);
      vignette(ctx, '#8a5f2c', 0.45, 0.3);
      break;
    case 'lined': {
      fill(ctx, '#fbf7ec');
      blotches(ctx, r, '#e8dcc0', 10, 90, 0.3);
      ctx.strokeStyle = 'rgba(120,160,195,0.55)';
      ctx.lineWidth = 1;
      for (let y = 100; y < PAGE_H - 20; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(PAGE_W, y + 0.5); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(210,110,110,0.55)';
      ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(70, PAGE_H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(74, 0); ctx.lineTo(74, PAGE_H); ctx.stroke();
      vignette(ctx, '#b89968', 0.18);
      break;
    }
    case 'grid':
      fill(ctx, '#f8f4ea');
      blotches(ctx, r, '#e8dcc0', 10, 90, 0.3);
      ctx.strokeStyle = 'rgba(120,160,175,0.35)';
      ctx.lineWidth = 1;
      for (let x = 12; x < PAGE_W; x += 24) {
        ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, PAGE_H); ctx.stroke();
      }
      for (let y = 16; y < PAGE_H; y += 24) {
        ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(PAGE_W, y + 0.5); ctx.stroke();
      }
      vignette(ctx, '#b89968', 0.18);
      break;
    case 'dots':
      fill(ctx, '#f7f2e6');
      blotches(ctx, r, '#e8dcc0', 10, 90, 0.3);
      ctx.fillStyle = 'rgba(120,105,85,0.45)';
      for (let x = 20; x < PAGE_W; x += 24)
        for (let y = 20; y < PAGE_H; y += 24) {
          ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill();
        }
      vignette(ctx, '#b89968', 0.18);
      break;
    case 'cream':
      fill(ctx, '#f6efdf');
      blotches(ctx, r, '#e4d3ae', 18, 90, 0.3);
      fibres(ctx, PAGE_W, PAGE_H, 200, 'rgba(120,90,50,0.07)', r);
      vignette(ctx, '#b89968', 0.22);
      break;
    case 'music': {
      fill(ctx, '#f3ead4');
      blotches(ctx, r, '#d9c396', 20, 90, 0.3);
      ctx.strokeStyle = 'rgba(70,55,40,0.45)';
      ctx.lineWidth = 1;
      for (let s = 70; s < PAGE_H - 60; s += 78) {
        for (let l = 0; l < 5; l++) {
          const y = s + l * 8 + 0.5;
          ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(PAGE_W - 40, y); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(40.5, s); ctx.lineTo(40.5, s + 32); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(PAGE_W - 40.5, s); ctx.lineTo(PAGE_W - 40.5, s + 32); ctx.stroke();
      }
      vignette(ctx, '#8a5f2c', 0.35, 0.35);
      break;
    }
    case 'sage': case 'blush': case 'sky': case 'mustard': {
      const base = { sage: '#b9c4a7', blush: '#e6c3b8', sky: '#bccfd9', mustard: '#d9b26a' }[id];
      fill(ctx, base);
      blotches(ctx, r, '#ffffff', 16, 80, 0.12);
      blotches(ctx, r, '#000000', 16, 80, 0.05);
      fibres(ctx, PAGE_W, PAGE_H, 500, 'rgba(255,255,255,0.18)', r);
      fibres(ctx, PAGE_W, PAGE_H, 300, 'rgba(0,0,0,0.08)', r);
      vignette(ctx, '#3a2a1a', 0.18);
      break;
    }
    case 'black':
      fill(ctx, '#2b2826');
      blotches(ctx, r, '#48423d', 20, 90, 0.35);
      fibres(ctx, PAGE_W, PAGE_H, 600, 'rgba(255,255,255,0.07)', r);
      vignette(ctx, '#000000', 0.35);
      break;
    case 'map': drawMap(ctx, r); break;
    case 'azulejo': drawAzulejo(ctx, r); break;
    case 'aged':
      fill(ctx, '#e8d6ae');
      blotches(ctx, r, '#b88a4a', 40, 110, 0.28);
      blotches(ctx, r, '#9a6a30', 30, 7, 0.4);
      fibres(ctx, PAGE_W, PAGE_H, 400, 'rgba(110,75,35,0.12)', r);
      coffeeRing(ctx, r, 140, 180, 56);
      vignette(ctx, '#5a3510', 0.7, 0.25);
      break;
    case 'newsprint': drawNewsprint(ctx, r); break;
    default:
      if (id.startsWith('cover-')) drawCover(ctx, id, r, PAGE_W, PAGE_H);
      else fill(ctx, '#f6efdf');
  }
}

// ------------------------------------------------------------------ collage papers

function wobblyLoop(ctx, r, cx, cy, rx, ry, wob = 0.25, n = 28) {
  ctx.beginPath();
  const phase = r() * 6;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + Math.sin(a * 3 + phase) * wob * 0.5 + Math.sin(a * 5 + phase * 2) * wob * 0.3;
    const x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

function drawMap(ctx, r) {
  fill(ctx, '#e9dcbc');
  blotches(ctx, r, '#c9a86e', 30, 100, 0.22);
  // sea on the right, behind a wiggly coastline
  const coast = [];
  for (let y = -10; y <= PAGE_H + 10; y += 10) {
    coast.push([380 + Math.sin(y / 70) * 50 + Math.sin(y / 23) * 14 + (r() - 0.5) * 8, y]);
  }
  ctx.save();
  ctx.beginPath();
  coast.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.lineTo(PAGE_W + 10, PAGE_H + 10); ctx.lineTo(PAGE_W + 10, -10); ctx.closePath();
  ctx.fillStyle = 'rgba(150,178,170,0.35)';
  ctx.fill();
  ctx.restore();
  // coastal hatching
  for (let k = 0; k < 6; k++) {
    ctx.strokeStyle = `rgba(70,95,100,${0.35 - k * 0.05})`;
    ctx.lineWidth = k ? 0.7 : 1.4;
    ctx.beginPath();
    coast.forEach(([x, y], i) => (i ? ctx.lineTo(x + k * 7, y) : ctx.moveTo(x + k * 7, y)));
    ctx.stroke();
  }
  // contour lines (hills)
  ctx.strokeStyle = 'rgba(120,85,45,0.28)';
  ctx.lineWidth = 0.8;
  for (let h = 0; h < 4; h++) {
    const cx = 60 + r() * 260, cy = 60 + r() * 680, rx = 40 + r() * 50, ry = 30 + r() * 40;
    for (let k = 1; k <= 5; k++) { wobblyLoop(ctx, r, cx, cy, rx * k / 5, ry * k / 5); ctx.stroke(); }
  }
  // graticule
  ctx.strokeStyle = 'rgba(90,70,40,0.18)';
  ctx.lineWidth = 0.6;
  for (let x = 75; x < PAGE_W; x += 150) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, PAGE_H); ctx.stroke(); }
  for (let y = 100; y < PAGE_H; y += 150) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(PAGE_W, y); ctx.stroke(); }
  // roads
  for (let i = 0; i < 9; i++) {
    ctx.strokeStyle = i % 3 ? 'rgba(150,70,50,0.35)' : 'rgba(90,60,35,0.4)';
    ctx.lineWidth = i % 3 ? 1 : 1.8;
    ctx.beginPath();
    let x = r() * 360, y = r() * PAGE_H;
    ctx.moveTo(x, y);
    for (let s = 0; s < 8; s++) { x += (r() - 0.4) * 70; y += (r() - 0.5) * 90; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  // a little town grid
  ctx.save();
  ctx.translate(210, 430); ctx.rotate(0.3);
  ctx.strokeStyle = 'rgba(90,60,35,0.35)'; ctx.lineWidth = 0.7;
  for (let i = 0; i < 9; i++) {
    ctx.beginPath(); ctx.moveTo(i * 12, 0); ctx.lineTo(i * 12, 100); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * 12); ctx.lineTo(100, i * 12); ctx.stroke();
  }
  ctx.restore();
  // labels
  ctx.fillStyle = 'rgba(70,50,30,0.7)';
  const labels = [['MARE NOSTRUM', 470, 380, 20, true], ['Sierra Alta', 110, 150, 16], ['Villanueva', 250, 560, 15], ['Puerto', 330, 250, 14], ['Río Claro', 90, 690, 14], ['Costa Dorada', 440, 690, 16, true]];
  for (const [t, x, y, fs, sea] of labels) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate((r() - 0.5) * 0.3);
    ctx.font = `${sea ? 'italic ' : ''}${fs}px "IM Fell English", Georgia, serif`;
    ctx.fillStyle = sea ? 'rgba(50,80,95,0.6)' : 'rgba(70,50,30,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText(t, 0, 0);
    ctx.restore();
  }
  // compass rose
  ctx.save();
  ctx.translate(500, 110);
  ctx.strokeStyle = 'rgba(70,50,30,0.6)'; ctx.fillStyle = 'rgba(70,50,30,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const len = i % 2 ? 26 : 44;
    ctx.save(); ctx.rotate((i * Math.PI) / 4);
    ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.closePath();
    i % 2 ? ctx.stroke() : ctx.fill();
    ctx.restore();
  }
  ctx.font = '14px "IM Fell English", Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText('N', 0, -48);
  ctx.restore();
  vignette(ctx, '#6e4b2a', 0.35, 0.35);
}

function drawAzulejo(ctx, r) {
  const T = 75, blue = '#2f5a8f', light = '#6f93bf';
  for (let ty = 0; ty < PAGE_H; ty += T) {
    for (let tx = 0; tx < PAGE_W; tx += T) {
      ctx.save();
      ctx.translate(tx, ty);
      ctx.beginPath(); ctx.rect(0, 0, T, T); ctx.clip();
      ctx.fillStyle = r() > 0.5 ? '#f1ead9' : '#ece3cf';
      ctx.fillRect(0, 0, T, T);
      // quarter circles meet across tiles to make big rings
      ctx.lineWidth = 6; ctx.strokeStyle = blue;
      for (const [cx, cy] of [[0, 0], [T, 0], [0, T], [T, T]]) {
        ctx.beginPath(); ctx.arc(cx, cy, T * 0.42, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = light;
        ctx.beginPath(); ctx.arc(cx, cy, T * 0.22, 0, Math.PI * 2); ctx.fill();
      }
      // centre flower
      ctx.fillStyle = blue;
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.translate(T / 2, T / 2); ctx.rotate((i * Math.PI) / 2 + Math.PI / 4);
        ctx.beginPath(); ctx.ellipse(0, -10, 5, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#d9a441';
      ctx.beginPath(); ctx.arc(T / 2, T / 2, 4.5, 0, Math.PI * 2); ctx.fill();
      // glaze sheen + grout
      const g = ctx.createLinearGradient(0, 0, T, T);
      g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.06)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, T, T);
      ctx.strokeStyle = 'rgba(120,110,95,0.6)'; ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, T, T);
      // crackle
      ctx.strokeStyle = 'rgba(90,80,60,0.18)'; ctx.lineWidth = 0.6;
      for (let c = 0; c < 2; c++) {
        ctx.beginPath(); let x = r() * T, y = r() * T; ctx.moveTo(x, y);
        for (let s = 0; s < 4; s++) { x += (r() - 0.5) * 30; y += (r() - 0.5) * 30; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  blotches(ctx, r, '#8a6a3a', 14, 90, 0.12);
  vignette(ctx, '#3a2a1a', 0.3, 0.4);
}

function drawNewsprint(ctx, r) {
  fill(ctx, '#e6e1d3');
  blotches(ctx, r, '#c9bb96', 20, 100, 0.25);
  const cols = 4, gap = 16, left = 30, colW = (PAGE_W - left * 2 - gap * (cols - 1)) / cols;
  ctx.fillStyle = 'rgba(40,35,30,0.75)';
  ctx.font = 'bold 40px "Playfair Display", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE DAILY GAZETTE', PAGE_W / 2, 70);
  ctx.fillRect(left, 86, PAGE_W - left * 2, 2);
  ctx.fillRect(left, 92, PAGE_W - left * 2, 1);
  for (let c = 0; c < cols; c++) {
    const x0 = left + c * (colW + gap);
    let y = 118;
    while (y < PAGE_H - 30) {
      if (r() < 0.08) { // headline
        ctx.fillStyle = 'rgba(40,35,30,0.6)';
        ctx.fillRect(x0, y, colW * (0.6 + r() * 0.4), 9);
        y += 20;
        continue;
      }
      if (r() < 0.03) { // photo block
        ctx.fillStyle = 'rgba(60,55,50,0.25)';
        ctx.fillRect(x0, y, colW, 70);
        y += 82;
        continue;
      }
      let x = x0;
      ctx.fillStyle = 'rgba(50,45,40,0.35)';
      while (x < x0 + colW - 6) {
        const wlen = 4 + r() * 18;
        ctx.fillRect(x, y, Math.min(wlen, x0 + colW - x), 3);
        x += wlen + 3;
      }
      y += r() < 0.1 ? 14 : 8;
    }
    if (c < cols - 1) { ctx.fillStyle = 'rgba(40,35,30,0.3)'; ctx.fillRect(x0 + colW + gap / 2, 110, 0.8, PAGE_H - 140); }
  }
  vignette(ctx, '#6e5a3a', 0.3, 0.35);
}
