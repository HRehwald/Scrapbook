// Procedurally generated paper & cover textures, drawn onto canvases.
import { rng, makeCanvas, grain, fibres, rgba } from './util.js';

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
];

export const COVERS = [
  { id: 'cover-leather', name: 'Leather', swatch: '#6b3f26' },
  { id: 'cover-kraft', name: 'Kraft board', swatch: '#a9825a' },
  { id: 'cover-sage', name: 'Sage linen', swatch: '#7f8f6a' },
  { id: 'cover-rose', name: 'Rose linen', swatch: '#b27d74' },
  { id: 'cover-navy', name: 'Navy linen', swatch: '#34435a' },
  { id: 'cover-oxblood', name: 'Oxblood', swatch: '#6e2a2a' },
];

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
  const amt = GRAIN[id] ?? 10;
  if (amt) grain(ctx, c.width, c.height, amt, rng(id + 'g'));
  cache.set(key, c);
  return c;
}

const GRAIN = {
  kraft: 22, vintage: 16, lined: 6, grid: 6, dots: 6, cream: 9, music: 10,
  sage: 14, blush: 14, sky: 14, mustard: 16, black: 12,
  'cover-leather': 26, 'cover-kraft': 22, 'cover-sage': 12, 'cover-rose': 12,
  'cover-navy': 12, 'cover-oxblood': 22,
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

function fill(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
}

function vignette(ctx, color, strength, inner = 0.45) {
  const g = ctx.createRadialGradient(
    PAGE_W / 2, PAGE_H / 2, Math.min(PAGE_W, PAGE_H) * inner,
    PAGE_W / 2, PAGE_H / 2, Math.hypot(PAGE_W, PAGE_H) / 2
  );
  g.addColorStop(0, rgba(color, 0));
  g.addColorStop(1, rgba(color, strength));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);
}

function blotches(ctx, r, color, count, maxR, alpha) {
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

function stitching(ctx, inset, color) {
  ctx.save();
  ctx.setLineDash([11, 7]);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  // thread shadow
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.strokeRect(inset + 1, inset + 1.5, PAGE_W - inset * 2, PAGE_H - inset * 2);
  ctx.strokeStyle = color;
  ctx.strokeRect(inset, inset, PAGE_W - inset * 2, PAGE_H - inset * 2);
  ctx.restore();
}

function linen(ctx, r, base) {
  fill(ctx, base);
  ctx.save();
  for (let y = 0; y < PAGE_H; y += 2) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(0, y + r() * 0.6, PAGE_W, 1);
  }
  for (let x = 0; x < PAGE_W; x += 2) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(x + r() * 0.6, 0, 1, PAGE_H);
  }
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
    case 'cover-leather':
      fill(ctx, '#6b3f26');
      blotches(ctx, r, '#8a5635', 40, 70, 0.35);
      blotches(ctx, r, '#3e2112', 40, 60, 0.3);
      fibres(ctx, PAGE_W, PAGE_H, 1200, 'rgba(30,15,5,0.18)', r, 6);
      vignette(ctx, '#1e0f06', 0.55, 0.35);
      stitching(ctx, 24, '#e8d2b0');
      break;
    case 'cover-oxblood':
      fill(ctx, '#6e2a2a');
      blotches(ctx, r, '#8c3a36', 40, 70, 0.3);
      blotches(ctx, r, '#3d1212', 40, 60, 0.3);
      fibres(ctx, PAGE_W, PAGE_H, 1200, 'rgba(20,5,5,0.18)', r, 6);
      vignette(ctx, '#1a0505', 0.55, 0.35);
      stitching(ctx, 24, '#e6c9a0');
      break;
    case 'cover-kraft':
      fill(ctx, '#a9825a');
      blotches(ctx, r, '#8a6540', 30, 90, 0.3);
      fibres(ctx, PAGE_W, PAGE_H, 1000, 'rgba(60,35,15,0.2)', r);
      fibres(ctx, PAGE_W, PAGE_H, 500, 'rgba(255,235,200,0.15)', r);
      vignette(ctx, '#3e2710', 0.45, 0.35);
      stitching(ctx, 24, '#f3e6cf');
      break;
    case 'cover-sage': case 'cover-rose': case 'cover-navy': {
      const base = { 'cover-sage': '#7f8f6a', 'cover-rose': '#b27d74', 'cover-navy': '#34435a' }[id];
      linen(ctx, r, base);
      blotches(ctx, r, '#000000', 20, 90, 0.08);
      vignette(ctx, '#10100c', 0.45, 0.35);
      stitching(ctx, 24, '#f1e4cc');
      break;
    }
    default:
      fill(ctx, '#f6efdf');
  }
}
