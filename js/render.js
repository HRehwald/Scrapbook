// Canvas renderers for photo frames, washi tape and note backgrounds.
import { rng, makeCanvas, grain, tornRectPath, rgba, shade, clamp, fibres } from './util.js';
import { paperCanvas, PAGE_W, PAGE_H } from './papers.js';

export const FONTS = [
  { family: 'Caveat', label: 'Caveat' },
  { family: 'Patrick Hand', label: 'Patrick Hand' },
  { family: 'Homemade Apple', label: 'Homemade Apple' },
  { family: 'Reenie Beanie', label: 'Reenie Beanie' },
  { family: 'Gloria Hallelujah', label: 'Gloria Hallelujah' },
  { family: 'Kalam', label: 'Kalam' },
  { family: 'Rock Salt', label: 'Rock Salt' },
  { family: 'Amatic SC', label: 'Amatic SC' },
  { family: 'Special Elite', label: 'Special Elite (typewriter)' },
  { family: 'Courier Prime', label: 'Courier Prime' },
  { family: 'Playfair Display', label: 'Playfair Display' },
  { family: 'IM Fell English', label: 'IM Fell English (old book)' },
  { family: 'Great Vibes', label: 'Great Vibes (script title)' },
  { family: 'Pinyon Script', label: 'Pinyon Script (fancy)' },
  { family: 'La Belle Aurore', label: 'La Belle Aurore (pen)' },
  { family: 'Nothing You Could Do', label: 'Nothing You Could Do (pen)' },
];

export const INKS = ['#2b2118', '#5b3a29', '#1f3a5f', '#9e2a2b', '#2f5d3a', '#b0772b', '#6b3f6b', '#7d8a9a', '#fffaf0'];
export const NOTE_COLORS = ['#f3dc8c', '#f2c9b8', '#cfdcb8', '#bcd3e0', '#e6d2ea', '#fdf9ef', '#d4b48c', '#f3e3c3'];
export const TAPE_COLORS = ['#e3cfa3', '#e8b4a6', '#c9d6b2', '#a9c6d8', '#f1d58a', '#d9c2e0', '#e6d8c0', '#c2a07c', '#b86b5e', '#7d9a8a'];

export const FRAMES = [
  { id: 'polaroid', name: 'Polaroid' },
  { id: 'border', name: 'White border' },
  { id: 'deckle', name: 'Vintage deckle' },
  { id: 'taped', name: 'Taped' },
  { id: 'torn', name: 'Torn paper' },
  { id: 'oval', name: 'Oval' },
  { id: 'film', name: 'Film strip' },
  { id: 'stamp', name: 'Postage stamp' },
  { id: 'mat', name: 'Aged paper mat' },
  { id: 'none', name: 'No frame' },
];

export const FILTERS = [
  { id: 'none', name: 'Original' },
  { id: 'warm', name: 'Warm' },
  { id: 'faded', name: 'Faded' },
  { id: 'sepia', name: 'Sepia' },
  { id: 'bw', name: 'B & W' },
];

export const CROPS = [
  { id: 'original', name: 'Original' },
  { id: 'square', name: 'Square', ratio: 1 },
  { id: 'portrait', name: 'Portrait', ratio: 4 / 5 },
  { id: 'landscape', name: 'Landscape', ratio: 4 / 3 },
];

export const NOTE_STYLES = [
  { id: 'plain', name: 'Handwriting', pad: [4, 4, 4, 4] },
  { id: 'sticky', name: 'Sticky note', pad: [30, 20, 20, 20], bg: '#f3dc8c' },
  { id: 'paper', name: 'Lined scrap', pad: [22, 20, 22, 44], bg: '#fdf9ef' },
  { id: 'tag', name: 'Kraft tag', pad: [16, 20, 16, 58], bg: '#d4b48c' },
  { id: 'label', name: 'Label strip', pad: [10, 16, 10, 16], bg: '#fdf9ef' },
  { id: 'ticket', name: 'Ticket', pad: [22, 34, 22, 34], bg: '#f3e3c3' },
  { id: 'stamp', name: 'Ink stamp', pad: [16, 18, 16, 18] },
  { id: 'torn', name: 'Torn note', pad: [18, 20, 18, 20], bg: '#efe4c8' },
  { id: 'bookplate', name: 'Bookplate', pad: [26, 34, 26, 34], bg: '#f6ecd6' },
  { id: 'plate', name: 'Brass plate', pad: [14, 42, 14, 42] },
  { id: 'foil', name: 'Gold foil', pad: [4, 4, 4, 4] },
];

export const METALS = ['#c9a24a', '#d9b46a', '#b8733a', '#c98b7a', '#a7adb3', '#fdf9ef'];
export const PATCH_COLORS = ['#f3dc8c', '#e8b4a6', '#c9d6b2', '#a9c6d8', '#d9c2e0', '#fdf9ef', '#9e2a2b', '#1f3a5f', '#2f5d3a', '#2b2118'];
export const STICKER_LOOKS = [
  { id: 'plain', name: 'Plain' },
  { id: 'diecut', name: 'Die-cut' },
  { id: 'patch', name: 'Round patch' },
  { id: 'heart', name: 'Heart patch' },
];

export const noteStyle = (id) => NOTE_STYLES.find((s) => s.id === id) || NOTE_STYLES[0];

// ---------------------------------------------------------------- photos

// Size of the visible photo area for an item, taking crop into account.
export function photoArea(item) {
  return { w: item.w, h: item.h };
}

export function photoLayout(item) {
  const { w, h } = item;
  switch (item.frame) {
    case 'polaroid': return { W: w + 28, H: h + 14 + 64, ix: 14, iy: 14, m: 0 };
    case 'border': return { W: w + 20, H: h + 20, ix: 10, iy: 10, m: 0 };
    case 'deckle': return { W: w + 32, H: h + 32, ix: 16, iy: 16, m: 4 };
    case 'taped': return { W: w + 20, H: h + 20, ix: 10, iy: 10, m: 26 };
    case 'torn': return { W: w + 24, H: h + 24, ix: 12, iy: 12, m: 6 };
    case 'oval': return { W: w + 20, H: h + 20, ix: 10, iy: 10, m: 0 };
    case 'film': return { W: w + 20, H: h + 56, ix: 10, iy: 28, m: 0 };
    case 'stamp': return { W: w + 28, H: h + 28, ix: 14, iy: 14, m: 0 };
    case 'mat': return { W: w + 44, H: h + 44, ix: 22, iy: 22, m: 6 };
    default: return { W: w, H: h, ix: 0, iy: 0, m: 0 };
  }
}

function applyFilter(ctx, w, h, filter) {
  if (!filter || filter === 'none') return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    if (filter === 'sepia') {
      const nr = r * 0.393 + g * 0.769 + b * 0.189;
      const ng = r * 0.349 + g * 0.686 + b * 0.168;
      const nb = r * 0.272 + g * 0.534 + b * 0.131;
      r = nr * 0.9 + 12; g = ng * 0.9 + 8; b = nb * 0.9;
    } else if (filter === 'bw') {
      let l = r * 0.3 + g * 0.59 + b * 0.11;
      l = (l - 128) * 1.12 + 128;
      r = g = b = l;
    } else if (filter === 'faded') {
      r = r * 0.8 + 0.2 * 235 + 6; g = g * 0.8 + 0.2 * 225; b = b * 0.78 + 0.2 * 200;
    } else if (filter === 'warm') {
      r = r * 1.06 + 8; g = g * 1.01 + 3; b = b * 0.88;
    }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
}

// Draws the (cropped + filtered) picture into its own canvas.
function photoPixels(item, img, res) {
  const c = makeCanvas(item.w * res, item.h * res);
  const ctx = c.getContext('2d');
  if (img) {
    const target = item.w / item.h;
    let sw = img.naturalWidth || img.width, sh = img.naturalHeight || img.height;
    let sx = 0, sy = 0;
    if (sw / sh > target) { const nw = sh * target; sx = (sw - nw) / 2; sw = nw; }
    else { const nh = sw / target; sy = (sh - nh) / 2; sh = nh; }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    applyFilter(ctx, c.width, c.height, item.filter);
  } else {
    // empty photo slot
    const W = c.width, H = c.height, u = res;
    ctx.fillStyle = '#e4d9c3';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(107,63,38,0.45)';
    ctx.setLineDash([8 * u, 6 * u]);
    ctx.lineWidth = 2 * u;
    ctx.strokeRect(8 * u, 8 * u, W - 16 * u, H - 16 * u);
    ctx.setLineDash([]);
    const cx = W / 2, cy = H / 2 - 12 * u, s = Math.min(W, H) / 7;
    ctx.strokeStyle = 'rgba(107,63,38,0.6)';
    ctx.lineWidth = 2.2 * u;
    ctx.strokeRect(cx - s, cy - s * 0.65, s * 2, s * 1.35);
    ctx.beginPath(); ctx.arc(cx, cy + s * 0.02, s * 0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(cx - s * 0.45, cy - s * 0.85, s * 0.5, s * 0.2);
    ctx.fillStyle = 'rgba(80,50,30,0.75)';
    ctx.font = `${Math.max(12, Math.min(20, item.w / 11)) * u}px "Patrick Hand", cursive`;
    ctx.textAlign = 'center';
    ctx.fillText('double-click to add a photo', cx, cy + s + 22 * u, W - 20 * u);
  }
  return c;
}

function paperFill(ctx, color, x, y, w, h, r, amount = 10) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, 'rgba(255,255,255,0.25)');
  g.addColorStop(1, 'rgba(120,90,50,0.10)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}

export function renderPhoto(item, img, res = 2) {
  const L = photoLayout(item);
  const r = rng(item.id);
  const c = makeCanvas((L.W + L.m * 2) * res, (L.H + L.m * 2) * res);
  const ctx = c.getContext('2d');
  ctx.scale(res, res);
  ctx.translate(L.m, L.m);
  const pix = photoPixels(item, img, res);
  const { w, h } = item;
  const put = () => ctx.drawImage(pix, L.ix, L.iy, w, h);
  const cream = '#fbf8f1';

  switch (item.frame) {
    case 'polaroid': {
      paperFill(ctx, cream, 0, 0, L.W, L.H, r);
      put();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.strokeRect(L.ix + 0.5, L.iy + 0.5, w - 1, h - 1);
      if (item.caption) {
        const fs = clamp(Math.round(L.W / 10), 18, 30);
        ctx.font = `${fs}px "${item.captionFont || 'Caveat'}", cursive`;
        ctx.fillStyle = item.captionColor || '#2b2118';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.caption, L.W / 2, L.iy + h + (L.H - L.iy - h) / 2 + 2, L.W - 20);
      }
      break;
    }
    case 'border':
      paperFill(ctx, cream, 0, 0, L.W, L.H, r);
      put();
      break;
    case 'deckle': {
      // scalloped / deckled vintage print edge
      ctx.beginPath();
      const step = 8;
      const scallop = (x0, y0, x1, y1) => {
        const len = Math.hypot(x1 - x0, y1 - y0), n = Math.round(len / step);
        const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
        for (let i = 0; i < n; i++) {
          const t0 = i / n, t1 = (i + 1) / n, tm = (t0 + t1) / 2;
          ctx.quadraticCurveTo(
            x0 + (x1 - x0) * tm - nx * 4, y0 + (y1 - y0) * tm - ny * 4,
            x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1
          );
        }
      };
      ctx.moveTo(0, 0);
      scallop(0, 0, L.W, 0); scallop(L.W, 0, L.W, L.H);
      scallop(L.W, L.H, 0, L.H); scallop(0, L.H, 0, 0);
      ctx.closePath();
      ctx.fillStyle = '#f4ecd8';
      ctx.fill();
      put();
      ctx.strokeStyle = 'rgba(90,60,30,0.25)';
      ctx.strokeRect(L.ix - 0.5, L.iy - 0.5, w + 1, h + 1);
      break;
    }
    case 'taped': {
      paperFill(ctx, cream, 0, 0, L.W, L.H, r);
      put();
      const color = item.tapeColor || '#e6d8c0';
      tapePiece(ctx, -10, 8, 78, 26, -38, color, r);
      tapePiece(ctx, L.W - 68, 8, 78, 26, 38, color, r);
      break;
    }
    case 'torn': {
      ctx.save();
      tornRectPath(ctx, 0, 0, L.W, L.H, r, 4, 6);
      ctx.fillStyle = '#fbf7ee';
      ctx.fill();
      ctx.restore();
      ctx.save();
      tornRectPath(ctx, L.ix, L.iy, w, h, r, 3, 7);
      ctx.clip();
      put();
      ctx.restore();
      break;
    }
    case 'oval': {
      ctx.beginPath();
      ctx.ellipse(L.W / 2, L.H / 2, L.W / 2, L.H / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = cream;
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(L.W / 2, L.H / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.clip();
      put();
      ctx.restore();
      break;
    }
    case 'film': {
      ctx.fillStyle = '#1d1a18';
      ctx.fillRect(0, 0, L.W, L.H);
      ctx.fillStyle = '#efe6d2';
      for (let x = 8; x < L.W - 10; x += 18) {
        roundRect(ctx, x, 8, 10, 12, 2); ctx.fill();
        roundRect(ctx, x, L.H - 20, 10, 12, 2); ctx.fill();
      }
      put();
      ctx.font = '9px "Courier Prime", monospace';
      ctx.fillStyle = '#d9a441';
      ctx.fillText('KODAK 400', 12, L.H - 24 + 0);
      break;
    }
    case 'stamp': {
      ctx.fillStyle = '#fbf8ef';
      ctx.fillRect(0, 0, L.W, L.H);
      put();
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      const step = 12;
      for (let x = step / 2; x < L.W; x += step) { hole(ctx, x, 0); hole(ctx, x, L.H); }
      for (let y = step / 2; y < L.H; y += step) { hole(ctx, 0, y); hole(ctx, L.W, y); }
      ctx.restore();
      break;
    }
    case 'mat': {
      ctx.save();
      tornRectPath(ctx, 0, 0, L.W, L.H, r, 5, 8);
      ctx.clip();
      const src = paperCanvas('aged');
      ctx.drawImage(src, r() * (src.width - L.W * 2), r() * (src.height - L.H * 2), L.W * 2, L.H * 2, 0, 0, L.W, L.H);
      ctx.restore();
      ctx.save();
      tornRectPath(ctx, 0, 0, L.W, L.H, rng(item.id), 5, 8);
      ctx.strokeStyle = 'rgba(255,248,230,0.8)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#fbf8f1';
      ctx.fillRect(L.ix - 5, L.iy - 5, w + 10, h + 10);
      put();
      break;
    }
    default:
      put();
  }
  return { canvas: c, W: L.W, H: L.H, m: L.m };
}

function hole(ctx, x, y) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); }

function roundRect(ctx, x, y, w, h, rad) {
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

// ---------------------------------------------------------------- washi tape

function tapeShape(ctx, x, y, w, h, r) {
  // zig-zag torn ends
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  const teeth = Math.max(3, Math.round(h / 5));
  for (let i = 1; i <= teeth; i++) ctx.lineTo(x + w + (i % 2 ? -3 - r() * 2 : 0), y + (h * i) / teeth);
  ctx.lineTo(x, y + h);
  for (let i = teeth - 1; i >= 0; i--) ctx.lineTo(x + (i % 2 ? 3 + r() * 2 : 0), y + (h * i) / teeth);
  ctx.closePath();
}

function tapePattern(ctx, x, y, w, h, color, pattern) {
  const ink = shade(color, -55);
  ctx.save();
  ctx.globalAlpha = 0.55;
  if (pattern === 'stripes') {
    ctx.strokeStyle = ink; ctx.lineWidth = 5;
    for (let i = -h; i < w + h; i += 14) {
      ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + h, y); ctx.stroke();
    }
  } else if (pattern === 'dots') {
    ctx.fillStyle = '#fffaf0';
    ctx.globalAlpha = 0.8;
    for (let i = 7; i < w; i += 14)
      for (let j = 6; j < h; j += 12) {
        ctx.beginPath(); ctx.arc(x + i + ((j / 12) % 2) * 7, y + j, 2.2, 0, Math.PI * 2); ctx.fill();
      }
  } else if (pattern === 'grid') {
    ctx.strokeStyle = ink; ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 8) { ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + h); ctx.stroke(); }
    for (let j = 0; j < h; j += 8) { ctx.beginPath(); ctx.moveTo(x, y + j); ctx.lineTo(x + w, y + j); ctx.stroke(); }
  } else if (pattern === 'hearts') {
    ctx.fillStyle = ink;
    ctx.font = `${Math.round(h * 0.45)}px serif`;
    ctx.textBaseline = 'middle';
    for (let i = 6; i < w - 6; i += h * 0.8) ctx.fillText('♥', x + i, y + h / 2 + 1);
  } else if (pattern === 'masking') {
    ctx.globalAlpha = 1;
    fibres(ctx, w, h, Math.round(w * h / 60), 'rgba(120,90,50,0.18)', Math.random, 5);
    ctx.strokeStyle = 'rgba(90,65,30,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const cx = x + Math.random() * w;
      ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx + (Math.random() - 0.5) * 10, y + h); ctx.stroke();
    }
  } else if (pattern === 'text') {
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.7;
    ctx.font = `${Math.round(h * 0.42)}px "Special Elite", monospace`;
    ctx.textBaseline = 'middle';
    const word = 'memories · ';
    const ww = ctx.measureText(word).width || 60;
    for (let i = 4; i < w; i += ww) ctx.fillText(word, x + i, y + h / 2 + 1);
  }
  ctx.restore();
}

function tapePiece(ctx, x, y, w, h, deg, color, r, pattern = 'plain') {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  tapeShape(ctx, 0, 0, w, h, r);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = rgba(color, pattern === 'masking' ? 0.9 : 0.78);
  ctx.fillRect(0, 0, w, h);
  tapePattern(ctx, 0, 0, w, h, color, pattern);
  // sheen
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,255,255,0.28)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  g.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.restore();
}

export function renderTape(item, res = 2) {
  const c = makeCanvas(item.w * res, item.h * res);
  const ctx = c.getContext('2d');
  ctx.scale(res, res);
  tapePiece(ctx, 0, 0, item.w, item.h, 0, item.color, rng(item.id), item.pattern);
  return c;
}

// ---------------------------------------------------------------- note backgrounds

export function renderNoteBg(item, w, h, res = 2) {
  const style = item.style;
  const r = rng(item.id);
  const bg = item.bg || noteStyle(style).bg || '#fdf9ef';
  const M = 12; // margin for strings / curls
  const c = makeCanvas((w + M * 2) * res, (h + M * 2) * res);
  const ctx = c.getContext('2d');
  ctx.scale(res, res);
  ctx.translate(M, M);

  switch (style) {
    case 'sticky': {
      paperFill(ctx, bg, 0, 0, w, h, r);
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, w, 16);
      // curled corner shading
      const g = ctx.createLinearGradient(w - 40, h - 40, w, h);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(60,40,10,0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(w - 60, h - 60, 60, 60);
      break;
    }
    case 'paper': {
      ctx.save();
      tornRectPath(ctx, 0, 0, w, h, r, 3, 8, 'tb');
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.clip();
      const lh = item.fontSize * 1.25;
      ctx.strokeStyle = 'rgba(120,160,195,0.55)';
      ctx.lineWidth = 1;
      for (let y = noteStyle('paper').pad[0] + lh - 2; y < h - 4; y += lh) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(210,110,110,0.55)';
      ctx.beginPath(); ctx.moveTo(32, 0); ctx.lineTo(32, h); ctx.stroke();
      ctx.restore();
      break;
    }
    case 'tag': {
      const notch = 26;
      ctx.beginPath();
      ctx.moveTo(notch, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(notch, h);
      ctx.lineTo(0, h - notch); ctx.lineTo(0, notch); ctx.closePath();
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.save(); ctx.clip();
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(255,255,255,0.15)');
      g.addColorStop(1, 'rgba(80,50,20,0.15)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.restore();
      // reinforcement ring + hole
      ctx.beginPath(); ctx.arc(22, h / 2, 10, 0, Math.PI * 2);
      ctx.fillStyle = shade(bg, -25); ctx.fill();
      ctx.beginPath(); ctx.arc(22, h / 2, 5, 0, Math.PI * 2);
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(); ctx.restore();
      // string
      ctx.strokeStyle = '#efe4cf'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(22, h / 2);
      ctx.bezierCurveTo(8, h / 2 - 30, -10, h / 2 - 10, -12, h / 2 - 12 - 0);
      ctx.stroke();
      break;
    }
    case 'torn': {
      ctx.save();
      tornRectPath(ctx, 0, 0, w, h, r, 4, 7);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.clip();
      const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.75);
      g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(120,80,30,0.28)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      fibres(ctx, w, h, Math.round(w * h / 300), 'rgba(110,75,35,0.12)', r, 8);
      ctx.restore();
      ctx.save();
      tornRectPath(ctx, 0, 0, w, h, rng(item.id), 4, 7);
      ctx.strokeStyle = 'rgba(255,250,235,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
      break;
    }
    case 'label': {
      ctx.save();
      tornRectPath(ctx, 0, 0, w, h, r, 2, 5, 'lr');
      ctx.fillStyle = bg; ctx.fill();
      ctx.restore();
      break;
    }
    case 'ticket': {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      [[0, h / 2], [w, h / 2]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill(); });
      for (let x = 10; x < w; x += 14) { ctx.beginPath(); ctx.arc(x, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x, h, 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = rgba('#9e2a2b', 0.6);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(20, 10, w - 40, h - 20);
      break;
    }
    case 'bookplate': {
      // cream plate with notched corners and a double rule
      const n = 14;
      const notched = (inset) => {
        const x0 = inset, y0 = inset, x1 = w - inset, y1 = h - inset, k = Math.max(4, n - inset);
        ctx.beginPath();
        ctx.moveTo(x0 + k, y0);
        ctx.lineTo(x1 - k, y0); ctx.arc(x1, y0, k, Math.PI, Math.PI / 2, true);
        ctx.lineTo(x1, y1 - k); ctx.arc(x1, y1, k, -Math.PI / 2, Math.PI, true);
        ctx.lineTo(x0 + k, y1); ctx.arc(x0, y1, k, 0, -Math.PI / 2, true);
        ctx.lineTo(x0, y0 + k); ctx.arc(x0, y0, k, Math.PI / 2, 0, true);
        ctx.closePath();
      };
      notched(0);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.save(); ctx.clip();
      const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(255,255,255,0.2)'); g.addColorStop(1, 'rgba(120,80,30,0.18)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.restore();
      ctx.strokeStyle = rgba('#6b3f26', 0.75);
      ctx.lineWidth = 2; notched(7); ctx.stroke();
      ctx.lineWidth = 0.8; notched(11); ctx.stroke();
      break;
    }
    case 'plate': {
      roundRect(ctx, 0, 0, w, h, 6);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#f6de94'); g.addColorStop(0.45, '#c9a24a'); g.addColorStop(0.55, '#b8903d'); g.addColorStop(1, '#e9c872');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(90,60,15,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
      roundRect(ctx, 5, 5, w - 10, h - 10, 4);
      ctx.strokeStyle = 'rgba(255,245,210,0.6)'; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let x = 0; x < w; x += 3) ctx.fillRect(x, 0, 1, h); // brushed metal
      for (const sx of [18, w - 18]) {
        const sg = ctx.createRadialGradient(sx - 1.5, h / 2 - 1.5, 0.5, sx, h / 2, 6);
        sg.addColorStop(0, '#fff6d0'); sg.addColorStop(1, '#7d5e24');
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(sx, h / 2, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(60,40,10,0.8)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(sx - 3.5, h / 2 + 1.5); ctx.lineTo(sx + 3.5, h / 2 - 1.5); ctx.stroke();
      }
      break;
    }
    case 'stamp': {
      const ink = item.color || '#9e2a2b';
      ctx.strokeStyle = ink;
      ctx.lineWidth = 3;
      roundRect(ctx, 2, 2, w - 4, h - 4, 6); ctx.stroke();
      ctx.lineWidth = 1.2;
      roundRect(ctx, 8, 8, w - 16, h - 16, 4); ctx.stroke();
      break;
    }
    default:
      break;
  }
  if (!['plain', 'stamp', 'foil', 'plate'].includes(style)) grain(ctx, c.width, c.height, 8, r);
  return { canvas: c, m: M };
}

// Rough ink texture: knock random holes out of an already drawn canvas.
export function distress(canvas, seed, amount = 0.25) {
  const ctx = canvas.getContext('2d');
  const r = rng(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const n = Math.round(canvas.width * canvas.height * amount / 400);
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = 0.3 + r() * 0.7;
    ctx.beginPath();
    ctx.arc(r() * canvas.width, r() * canvas.height, 0.5 + r() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- stickers

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

function heartPath(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.5, cy - s * 0.1, cx - s * 0.9, cy - s * 1.25, cx, cy - s * 0.45);
  ctx.bezierCurveTo(cx + s * 0.9, cy - s * 1.25, cx + s * 1.5, cy - s * 0.1, cx, cy + s * 0.9);
  ctx.closePath();
}

// Returns {canvas, W, H} for non-plain sticker looks (drawn at 2x).
export function renderSticker(item, res = 2) {
  const S = item.size || 72;
  const look = item.look;
  const pad = look === 'diecut' ? 10 : S * 0.45;
  const W = S + pad * 2, H = S + pad * 2;
  const c = makeCanvas(W * res, H * res);
  const ctx = c.getContext('2d');
  ctx.scale(res, res);
  const drawEmoji = (g, size) => {
    g.font = `${size}px ${EMOJI_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(item.emoji, W / 2, H / 2 + size * 0.06);
  };
  if (look === 'diecut') {
    const tmp = makeCanvas(W * res, H * res);
    const t = tmp.getContext('2d');
    t.scale(res, res);
    drawEmoji(t, S);
    t.setTransform(1, 0, 0, 1, 0, 0);
    t.globalCompositeOperation = 'source-in';
    t.fillStyle = '#ffffff';
    t.fillRect(0, 0, tmp.width, tmp.height);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      ctx.drawImage(tmp, Math.cos(a) * 6 * res, Math.sin(a) * 6 * res);
    }
    ctx.restore();
    drawEmoji(ctx, S);
  } else {
    const col = item.patchColor || '#f3dc8c';
    const cx = W / 2, cy = H / 2, R = W / 2 - 3;
    const shape = () => (look === 'heart' ? heartPath(ctx, cx, cy + R * 0.12, R * 0.78) : (ctx.beginPath(), ctx.arc(cx, cy, R, 0, Math.PI * 2)));
    shape();
    ctx.fillStyle = col;
    ctx.fill();
    // embroidered twill texture
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1;
    for (let i = -H; i < W; i += 3) { ctx.beginPath(); ctx.moveTo(i, H); ctx.lineTo(i + H, 0); ctx.stroke(); }
    const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 2, cx, cy, R);
    g.addColorStop(0, 'rgba(255,255,255,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    // overlocked (merrowed) rim
    shape();
    ctx.lineWidth = 6;
    ctx.strokeStyle = shade(col, -45);
    ctx.stroke();
    ctx.save();
    shape();
    ctx.setLineDash([1.2, 1.6]);
    ctx.lineWidth = 6;
    ctx.strokeStyle = shade(col, -15);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(0.8, 0.8); ctx.translate(-cx, -cy);
    shape();
    ctx.restore();
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.stroke();
    ctx.setLineDash([]);
    drawEmoji(ctx, S * (look === 'heart' ? 0.72 : 0.9));
  }
  return { canvas: c, W, H };
}

// ---------------------------------------------------------------- torn paper scraps

export const SCRAP_EDGES = [
  { id: 'trbl', name: 'All torn' },
  { id: 'tb', name: 'Top & bottom' },
  { id: 'lr', name: 'Sides' },
  { id: 'b', name: 'One edge' },
  { id: '', name: 'Straight' },
];

export function renderScrap(item, res = 2) {
  const { w, h } = item;
  const r = rng(item.id);
  const M = 6;
  const c = makeCanvas((w + M * 2) * res, (h + M * 2) * res);
  const ctx = c.getContext('2d');
  ctx.scale(res, res);
  ctx.translate(M, M);
  const edges = item.edges ?? 'trbl';
  ctx.save();
  tornRectPath(ctx, 0, 0, w, h, r, 5, 9, edges);
  ctx.fillStyle = '#f6efdf';
  ctx.fill();
  ctx.clip();
  const src = paperCanvas(item.paper);
  // tile the texture if the scrap is bigger than a page
  const sx = (w > PAGE_W || h > PAGE_H) ? 0 : r() * (PAGE_W - w);
  const sy = (w > PAGE_W || h > PAGE_H) ? 0 : r() * (PAGE_H - h);
  const k = src.width / PAGE_W;
  for (let ox = 0; ox < w; ox += PAGE_W) for (let oy = 0; oy < h; oy += PAGE_H) {
    ctx.drawImage(src, sx * k, sy * k, Math.min(PAGE_W, w - ox) * k, Math.min(PAGE_H, h - oy) * k, ox, oy, Math.min(PAGE_W, w - ox), Math.min(PAGE_H, h - oy));
  }
  ctx.restore();
  // pale fibrous core showing along torn edges
  ctx.save();
  tornRectPath(ctx, 0, 0, w, h, rng(item.id), 5, 9, edges);
  ctx.strokeStyle = 'rgba(250,244,228,0.85)';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
  return { canvas: c, m: M };
}
