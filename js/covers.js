// Cover materials and cover decorations (stitching, spine band, corners, closures).
import { rng, makeCanvas, fibres, rgba, shade } from './util.js';
import { PAGE_W, PAGE_H, fill, vignette, blotches, paperCanvas } from './papers.js';

const LB = 'Leather & board', LN = 'Linen', FB = 'Fabric', PT = 'Patterns';

export const COVERS = [
  { id: 'cover-leather', name: 'Leather', group: LB, stitch: '#e8d2b0' },
  { id: 'cover-tan', name: 'Tan leather', group: LB, stitch: '#f3e6cf' },
  { id: 'cover-oxblood', name: 'Oxblood', group: LB, stitch: '#e6c9a0' },
  { id: 'cover-kraft', name: 'Kraft board', group: LB, stitch: '#f3e6cf' },
  { id: 'cover-cork', name: 'Cork', group: LB, stitch: '#5a3a22' },
  { id: 'cover-sage', name: 'Sage linen', group: LN, stitch: '#f1e4cc' },
  { id: 'cover-rose', name: 'Rose linen', group: LN, stitch: '#f1e4cc' },
  { id: 'cover-navy', name: 'Navy linen', group: LN, stitch: '#f1e4cc' },
  { id: 'cover-oat', name: 'Oatmeal linen', group: LN, stitch: '#6b3f26' },
  { id: 'cover-butter', name: 'Butter linen', group: LN, stitch: '#6b3f26' },
  { id: 'cover-denim', name: 'Denim', group: FB, stitch: '#e0a847' },
  { id: 'cover-corduroy', name: 'Corduroy', group: FB, stitch: '#f3e6cf' },
  { id: 'cover-velvet-plum', name: 'Plum velvet', group: FB, stitch: '#e8c872' },
  { id: 'cover-velvet-green', name: 'Moss velvet', group: FB, stitch: '#e8c872' },
  { id: 'cover-gingham-red', name: 'Red gingham', group: PT, stitch: '#fdf9ef' },
  { id: 'cover-gingham-sage', name: 'Sage gingham', group: PT, stitch: '#fdf9ef' },
  { id: 'cover-gingham-blue', name: 'Blue gingham', group: PT, stitch: '#fdf9ef' },
  { id: 'cover-polka-rose', name: 'Rose polka', group: PT, stitch: '#fdf9ef' },
  { id: 'cover-polka-mustard', name: 'Mustard polka', group: PT, stitch: '#fdf9ef' },
  { id: 'cover-floral-cream', name: 'Ditsy floral', group: PT, stitch: '#7d9a8a' },
  { id: 'cover-floral-navy', name: 'Midnight floral', group: PT, stitch: '#f1e4cc' },
  { id: 'cover-strawberry', name: 'Strawberries', group: PT, stitch: '#d9463f' },
  { id: 'cover-stars', name: 'Starry night', group: PT, stitch: '#e8c872' },
];
export const COVER_GROUPS = [LB, LN, FB, PT];

export const COVER_GRAIN = {
  'cover-leather': 26, 'cover-tan': 24, 'cover-oxblood': 22, 'cover-kraft': 22, 'cover-cork': 20,
  'cover-sage': 12, 'cover-rose': 12, 'cover-navy': 12, 'cover-oat': 12, 'cover-butter': 12,
  'cover-denim': 22, 'cover-corduroy': 14, 'cover-velvet-plum': 10, 'cover-velvet-green': 10,
  'cover-gingham-red': 8, 'cover-gingham-sage': 8, 'cover-gingham-blue': 8,
  'cover-polka-rose': 8, 'cover-polka-mustard': 8, 'cover-floral-cream': 8, 'cover-floral-navy': 8,
  'cover-strawberry': 8, 'cover-stars': 10,
};

export const STITCHES = [
  { id: 'none', name: 'None' },
  { id: 'dashed', name: 'Running' },
  { id: 'double', name: 'Double' },
  { id: 'zigzag', name: 'Zigzag' },
  { id: 'cross', name: 'Cross-stitch' },
  { id: 'blanket', name: 'Blanket' },
];
export const CORNERS = [
  { id: 'none', name: 'None' },
  { id: 'brass', name: 'Brass' },
  { id: 'silver', name: 'Silver' },
  { id: 'leather', name: 'Leather' },
  { id: 'lace', name: 'Lace' },
  { id: 'paper', name: 'Photo corners' },
];
export const CLOSURES = [
  { id: 'none', name: 'None' },
  { id: 'elastic', name: 'Elastic band' },
  { id: 'ribbon', name: 'Ribbon bow' },
  { id: 'strap', name: 'Leather strap' },
  { id: 'twine', name: 'Twine & button' },
];
export const THREAD_COLORS = ['#fdf9ef', '#f1e4cc', '#e8c872', '#e0a847', '#e8b4a6', '#d9463f', '#9e2a2b', '#7d9a8a', '#a9c6d8', '#6b3f26', '#2b2118'];
export const CLOSURE_COLORS = ['#2b2118', '#3e2112', '#6b3f26', '#a86f3f', '#9e2a2b', '#e8b4a6', '#f1d58a', '#c9d6b2', '#a9c6d8', '#6b3f6b', '#fdf9ef', '#c9b28a'];

export const COVER_PRESETS = [
  { name: 'Classic', material: 'cover-leather', style: { stitch: 'dashed', stitchColor: '#e8d2b0', corners: 'brass', closure: 'strap', closureColor: '#3e2112', spine: 'none' } },
  { name: 'Traveller', material: 'cover-kraft', style: { stitch: 'double', stitchColor: '#6b3f26', corners: 'leather', closure: 'elastic', closureColor: '#2b2118', spine: 'cover-tan' } },
  { name: 'Cottage', material: 'cover-gingham-sage', style: { stitch: 'blanket', stitchColor: '#fdf9ef', corners: 'lace', closure: 'ribbon', closureColor: '#e8b4a6', spine: 'cover-oat' } },
  { name: 'Sweetheart', material: 'cover-strawberry', style: { stitch: 'dashed', stitchColor: '#d9463f', corners: 'none', closure: 'ribbon', closureColor: '#9e2a2b', spine: 'cover-gingham-red' } },
  { name: 'Picnic', material: 'cover-gingham-red', style: { stitch: 'zigzag', stitchColor: '#fdf9ef', corners: 'paper', closure: 'twine', closureColor: '#c9b28a', spine: 'cover-denim' } },
  { name: 'Garden', material: 'cover-floral-cream', style: { stitch: 'dashed', stitchColor: '#7d9a8a', corners: 'lace', closure: 'elastic', closureColor: '#c9d6b2', spine: 'cover-sage' } },
  { name: 'Night sky', material: 'cover-stars', style: { stitch: 'cross', stitchColor: '#e8c872', corners: 'brass', closure: 'none', closureColor: '#e8c872', spine: 'none' } },
  { name: 'Denim', material: 'cover-denim', style: { stitch: 'double', stitchColor: '#e0a847', corners: 'leather', closure: 'strap', closureColor: '#6b3f26', spine: 'none' } },
  { name: 'Velvet', material: 'cover-velvet-plum', style: { stitch: 'none', stitchColor: '#e8c872', corners: 'brass', closure: 'ribbon', closureColor: '#e8c872', spine: 'none' } },
];

export function coverStyle(spread) {
  const mat = COVERS.find((c) => c.id === spread.pages[0]) || COVERS[0];
  const s = spread.coverStyle || {};
  return {
    stitch: 'dashed', corners: 'none', closure: 'none', closureColor: '#3e2112', spine: 'none',
    ...s,
    stitchColor: s.stitchColor || mat.stitch,
  };
}

// ------------------------------------------------------------------ materials

function weave(ctx, r, W, H, a = 1) {
  for (let y = 0; y < H; y += 2) {
    ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${0.05 * a})` : `rgba(0,0,0,${0.06 * a})`;
    ctx.fillRect(0, y + r() * 0.6, W, 1);
  }
  for (let x = 0; x < W; x += 2) {
    ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${0.04 * a})` : `rgba(0,0,0,${0.05 * a})`;
    ctx.fillRect(x + r() * 0.6, 0, 1, H);
  }
}

function leather(ctx, r, W, H, base, light, dark) {
  fill(ctx, base);
  blotches(ctx, r, light, 40, 70, 0.35);
  blotches(ctx, r, dark, 40, 60, 0.3);
  fibres(ctx, W, H, 1200, rgba(dark, 0.25), r, 6);
  vignette(ctx, '#1e0f06', 0.5, 0.35);
}

function gingham(ctx, r, W, H, color) {
  fill(ctx, '#f7f0e2');
  const s = 24;
  ctx.fillStyle = rgba(color, 0.42);
  for (let x = 0; x < W; x += s * 2) ctx.fillRect(x, 0, s, H);
  for (let y = 0; y < H; y += s * 2) ctx.fillRect(0, y, W, s);
  weave(ctx, r, W, H, 1.4);
  vignette(ctx, '#3a2a1a', 0.3, 0.4);
}

function polka(ctx, r, W, H, bg, dot) {
  fill(ctx, bg);
  weave(ctx, r, W, H);
  ctx.fillStyle = dot;
  for (let y = 18, row = 0; y < H + 20; y += 38, row++)
    for (let x = row % 2 ? 36 : 14; x < W + 20; x += 44) {
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
    }
  vignette(ctx, '#2a1a0a', 0.35, 0.4);
}

function flower(ctx, x, y, size, petal, centre, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * size, Math.sin(a) * size, size * 0.85, size * 0.6, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = centre;
  ctx.beginPath(); ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function leaf(ctx, x, y, len, rot, color) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len / 2, -len / 3, len, 0);
  ctx.quadraticCurveTo(len / 2, len / 3, 0, 0);
  ctx.fill();
  ctx.restore();
}

function floral(ctx, r, W, H, bg, petals, leafColor, centre) {
  fill(ctx, bg);
  weave(ctx, r, W, H);
  for (let y = 10; y < H + 30; y += 36)
    for (let x = 10; x < W + 30; x += 36) {
      const fx = x + (r() - 0.5) * 20, fy = y + (r() - 0.5) * 20;
      leaf(ctx, fx, fy, 10, r() * 6.3, leafColor);
      leaf(ctx, fx, fy, 9, r() * 6.3, leafColor);
      flower(ctx, fx, fy, 4 + r() * 1.5, petals[Math.floor(r() * petals.length)], centre, r() * 6);
      if (r() > 0.6) {
        ctx.fillStyle = petals[0];
        ctx.beginPath(); ctx.arc(fx + 16, fy + 12, 1.6, 0, Math.PI * 2); ctx.fill();
      }
    }
  vignette(ctx, '#2a1a0a', 0.3, 0.4);
}

function strawberry(ctx, x, y, s, rot, r) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = '#d9463f';
  ctx.beginPath();
  ctx.moveTo(0, -7);
  ctx.bezierCurveTo(12, -11, 12, 5, 0, 14);
  ctx.bezierCurveTo(-12, 5, -12, -11, 0, -7);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.ellipse(-4, -2, 2, 4, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f7dc8a';
  for (let i = 0; i < 9; i++) {
    ctx.beginPath(); ctx.ellipse(-5 + (i % 3) * 5, -1 + Math.floor(i / 3) * 4.5, 0.7, 1.1, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#5f8a4a';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.6;
    leaf(ctx, 0, -8, 7, a + Math.PI, '#5f8a4a');
  }
  ctx.fillRect(-0.8, -14, 1.6, 5);
  ctx.restore();
}

function star(ctx, x, y, rad, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? rad * 0.45 : rad;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawCover(ctx, id, r, W, H) {
  switch (id) {
    case 'cover-leather': leather(ctx, r, W, H, '#6b3f26', '#8a5635', '#3e2112'); break;
    case 'cover-tan': leather(ctx, r, W, H, '#a86f3f', '#c48c55', '#6e4323'); break;
    case 'cover-oxblood': leather(ctx, r, W, H, '#6e2a2a', '#8c3a36', '#3d1212'); break;
    case 'cover-kraft':
      fill(ctx, '#a9825a');
      blotches(ctx, r, '#8a6540', 30, 90, 0.3);
      fibres(ctx, W, H, 1000, 'rgba(60,35,15,0.2)', r);
      fibres(ctx, W, H, 500, 'rgba(255,235,200,0.15)', r);
      vignette(ctx, '#3e2710', 0.45, 0.35);
      break;
    case 'cover-cork':
      fill(ctx, '#c49a6c');
      for (let i = 0; i < 5000; i++) {
        const shadeAmt = r();
        ctx.fillStyle = shadeAmt > 0.5 ? `rgba(110,70,35,${0.25 + r() * 0.3})` : `rgba(235,200,150,${0.2 + r() * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(r() * W, r() * H, 1 + r() * 3, 0.8 + r() * 2, r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      vignette(ctx, '#3e2710', 0.35, 0.4);
      break;
    case 'cover-sage': case 'cover-rose': case 'cover-navy': case 'cover-oat': case 'cover-butter': {
      const base = { 'cover-sage': '#7f8f6a', 'cover-rose': '#b27d74', 'cover-navy': '#34435a', 'cover-oat': '#d8cbb3', 'cover-butter': '#e8d08a' }[id];
      fill(ctx, base);
      weave(ctx, r, W, H);
      blotches(ctx, r, '#000000', 20, 90, 0.08);
      vignette(ctx, '#10100c', 0.4, 0.35);
      break;
    }
    case 'cover-denim': {
      fill(ctx, '#46638a');
      ctx.save();
      ctx.lineWidth = 1.2;
      for (let i = -H; i < W; i += 3) {
        ctx.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(10,20,40,0.12)';
        ctx.beginPath(); ctx.moveTo(i, H); ctx.lineTo(i + H, 0); ctx.stroke();
      }
      ctx.restore();
      blotches(ctx, r, '#b8c9dc', 25, 110, 0.18);
      fibres(ctx, W, H, 500, 'rgba(255,255,255,0.12)', r, 8);
      vignette(ctx, '#0e1624', 0.45, 0.35);
      break;
    }
    case 'cover-corduroy': {
      fill(ctx, '#b98a3e');
      for (let x = 0; x < W; x += 9) {
        const g = ctx.createLinearGradient(x, 0, x + 9, 0);
        g.addColorStop(0, 'rgba(60,35,10,0.35)');
        g.addColorStop(0.5, 'rgba(255,235,190,0.18)');
        g.addColorStop(1, 'rgba(60,35,10,0.35)');
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, 9, H);
      }
      blotches(ctx, r, '#fff0c8', 18, 120, 0.12);
      vignette(ctx, '#2a1a08', 0.45, 0.35);
      break;
    }
    case 'cover-velvet-plum': case 'cover-velvet-green': {
      const base = id === 'cover-velvet-plum' ? '#5a2a4a' : '#3f5a3a';
      fill(ctx, base);
      blotches(ctx, r, '#ffffff', 10, 220, 0.12);
      blotches(ctx, r, '#000000', 10, 200, 0.25);
      vignette(ctx, '#000000', 0.5, 0.3);
      break;
    }
    case 'cover-gingham-red': gingham(ctx, r, W, H, '#c0392b'); break;
    case 'cover-gingham-sage': gingham(ctx, r, W, H, '#6f8a5a'); break;
    case 'cover-gingham-blue': gingham(ctx, r, W, H, '#4a78a8'); break;
    case 'cover-polka-rose': polka(ctx, r, W, H, '#c98b86', '#fbf1e6'); break;
    case 'cover-polka-mustard': polka(ctx, r, W, H, '#d4a441', '#fbf1e6'); break;
    case 'cover-floral-cream': floral(ctx, r, W, H, '#f4ead8', ['#e8a0a0', '#f1d58a', '#b9c9e0', '#f2c9b8'], '#8aa27a', '#f7e3a3'); break;
    case 'cover-floral-navy': floral(ctx, r, W, H, '#28334a', ['#f2c9b8', '#fbf1e6', '#e8c872', '#c9d6b2'], '#6f8a6a', '#e8c872'); break;
    case 'cover-strawberry': {
      fill(ctx, '#f7e8e0');
      weave(ctx, r, W, H);
      for (let y = 20, row = 0; y < H + 40; y += 64, row++)
        for (let x = row % 2 ? 50 : 14; x < W + 40; x += 72) {
          strawberry(ctx, x + (r() - 0.5) * 10, y + (r() - 0.5) * 10, 1.25, (r() - 0.5) * 0.9, r);
          if (r() > 0.4) flower(ctx, x + 36, y + 30, 3, '#fffaf2', '#f1d58a', r() * 6);
        }
      vignette(ctx, '#5a2a1a', 0.25, 0.4);
      break;
    }
    case 'cover-stars': {
      fill(ctx, '#1f2a44');
      blotches(ctx, r, '#3a4a70', 20, 140, 0.35);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 260; i++) { ctx.beginPath(); ctx.arc(r() * W, r() * H, r() * 1.1 + 0.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#e8c872';
      for (let i = 0; i < 46; i++) star(ctx, r() * W, r() * H, 3 + r() * 6, r());
      // crescent moon
      ctx.beginPath(); ctx.arc(470, 150, 34, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath(); ctx.arc(486, 138, 30, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'destination-over'; fill(ctx, '#1f2a44'); ctx.restore();
      vignette(ctx, '#05070d', 0.5, 0.35);
      break;
    }
    default:
      fill(ctx, '#6b3f26');
  }
}

// ------------------------------------------------------------------ decorations

const SPINE_W = 84;

// Walks around a rectangle calling fn(x, y, nx, ny) every `step` px (n = outward normal).
function alongRect(x0, y0, x1, y1, step, fn) {
  const edges = [
    [x0, y0, x1, y0, 0, -1], [x1, y0, x1, y1, 1, 0],
    [x1, y1, x0, y1, 0, 1], [x0, y1, x0, y0, -1, 0],
  ];
  for (const [ax, ay, bx, by, nx, ny] of edges) {
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.round(len / step));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      fn(ax + (bx - ax) * t, ay + (by - ay) * t, nx, ny, (bx - ax) / len, (by - ay) / len);
    }
  }
}

function threaded(ctx, draw) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.translate(1, 1.5);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  draw(true);
  ctx.restore();
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  draw(false);
  ctx.restore();
}

function drawStitch(ctx, type, color, x0, y0, x1, y1) {
  ctx.lineWidth = 2.4;
  const setColor = (sh) => { if (!sh) ctx.strokeStyle = color; };
  if (type === 'dashed' || type === 'double' || type === 'blanket') {
    threaded(ctx, (sh) => {
      setColor(sh);
      ctx.lineWidth = 2.4;
      ctx.setLineDash([11, 7]);
      ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      if (type === 'double') ctx.strokeRect(x0 + 10, y0 + 10, x1 - x0 - 20, y1 - y0 - 20);
      if (type === 'blanket') {
        ctx.setLineDash([]);
        alongRect(x0, y0, x1, y1, 18, (x, y, nx, ny) => {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + nx * 12, y + ny * 12); ctx.stroke();
        });
      }
    });
  } else if (type === 'zigzag') {
    threaded(ctx, (sh) => {
      setColor(sh);
      ctx.beginPath();
      let k = 0;
      alongRect(x0, y0, x1, y1, 7, (x, y, nx, ny) => {
        const a = k++ % 2 ? 5 : -5;
        ctx.lineTo(x + nx * a, y + ny * a);
      });
      ctx.closePath();
      ctx.stroke();
    });
  } else if (type === 'cross') {
    threaded(ctx, (sh) => {
      setColor(sh);
      ctx.lineWidth = 2;
      alongRect(x0, y0, x1, y1, 16, (x, y) => {
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4);
        ctx.moveTo(x + 4, y - 4); ctx.lineTo(x - 4, y + 4);
        ctx.stroke();
      });
    });
  }
}

const decoCache = new Map();

// Drawn under the page's items: spine band + stitching.
export function renderCoverUnder(style, res = 2) {
  const key = 'u' + JSON.stringify(style) + res;
  if (decoCache.has(key)) return decoCache.get(key);
  const W = PAGE_W, H = PAGE_H;
  const c = makeCanvas(W * res, H * res);
  const ctx = c.getContext('2d');
  ctx.scale(res, res);
  const hasSpine = style.spine && style.spine !== 'none';
  if (hasSpine) {
    const src = paperCanvas(style.spine);
    ctx.drawImage(src, 0, 0, SPINE_W * src.width / W, src.height, 0, 0, SPINE_W, H);
    // seam shadow + highlight
    const g = ctx.createLinearGradient(SPINE_W - 2, 0, SPINE_W + 14, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(SPINE_W - 2, 0, 16, H);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(SPINE_W - 3, 0, 1, H);
    if (style.stitch !== 'none') {
      threaded(ctx, (sh) => {
        if (!sh) ctx.strokeStyle = style.stitchColor;
        ctx.lineWidth = 2.4;
        ctx.setLineDash([11, 7]);
        ctx.beginPath(); ctx.moveTo(SPINE_W - 10, 10); ctx.lineTo(SPINE_W - 10, H - 10); ctx.stroke();
      });
    }
  }
  if (style.stitch !== 'none') {
    const inset = 24;
    drawStitch(ctx, style.stitch, style.stitchColor, hasSpine ? SPINE_W + 16 : inset, inset, W - inset, H - inset);
  }
  decoCache.set(key, c);
  return c;
}

// Drawn over the page's items: corners + closure.
export function renderCoverOver(style, res = 2) {
  const key = 'o' + JSON.stringify(style) + res;
  if (decoCache.has(key)) return decoCache.get(key);
  const W = PAGE_W, H = PAGE_H;
  const c = makeCanvas(W * res, H * res);
  const ctx = c.getContext('2d');
  ctx.scale(res, res);
  if (style.corners && style.corners !== 'none') drawCorners(ctx, style, W, H);
  if (style.closure && style.closure !== 'none') drawClosure(ctx, style, W, H);
  decoCache.set(key, c);
  return c;
}

function metalGradient(ctx, S, kind) {
  const g = ctx.createLinearGradient(0, 0, S * 0.6, S * 0.6);
  const stops = kind === 'silver'
    ? ['#f4f5f6', '#9aa1a8', '#dfe3e6', '#6d747b']
    : ['#f6de94', '#b8903d', '#e9c872', '#7d5e24'];
  stops.forEach((s, i) => g.addColorStop(i / 3, s));
  return g;
}

function drawCorners(ctx, style, W, H) {
  const kind = style.corners;
  const S = kind === 'paper' ? 58 : kind === 'lace' ? 86 : 72;
  const places = [[0, 0, 0], [W, 0, Math.PI / 2], [W, H, Math.PI], [0, H, -Math.PI / 2]];
  const r = rng('lace');
  for (const [x, y, rot] of places) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.shadowColor = 'rgba(30,15,5,0.45)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    if (kind === 'brass' || kind === 'silver') {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(S, 0); ctx.lineTo(0, S); ctx.closePath();
      ctx.fillStyle = metalGradient(ctx, S, kind);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(60,40,10,0.5)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.moveTo(S - 10, 3); ctx.lineTo(3, S - 10); ctx.stroke();
      for (const [rx, ry] of [[S * 0.42, S * 0.16], [S * 0.16, S * 0.42]]) {
        const g = ctx.createRadialGradient(rx - 1, ry - 1, 0, rx, ry, 4);
        g.addColorStop(0, '#fff8e0'); g.addColorStop(1, kind === 'silver' ? '#6d747b' : '#7d5e24');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(rx, ry, 3.6, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'leather') {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(S, 0); ctx.lineTo(0, S); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, S / 2, S / 2);
      g.addColorStop(0, '#6e4323'); g.addColorStop(1, '#3e2112');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = style.stitchColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(S - 14, 5); ctx.lineTo(5, S - 14); ctx.stroke();
    } else if (kind === 'paper') {
      ctx.beginPath(); ctx.moveTo(6, 6); ctx.lineTo(S, 6); ctx.lineTo(6, S); ctx.closePath();
      ctx.fillStyle = '#2f2723';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.moveTo(S - 2, 8); ctx.lineTo(8, S - 2); ctx.stroke();
    } else if (kind === 'lace') {
      // quarter doily with a scalloped edge and little holes
      const n = 11;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(S, 0);
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI / 2, a1 = ((i + 1) / n) * Math.PI / 2, am = (a0 + a1) / 2;
        ctx.quadraticCurveTo(Math.cos(am) * (S + 9), Math.sin(am) * (S + 9), Math.cos(a1) * S, Math.sin(a1) * S);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(253,249,239,0.95)';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      for (const [rad, count, hole] of [[S - 8, 14, 2.6], [S - 22, 10, 3.4], [S - 38, 7, 3]]) {
        for (let i = 0; i <= count; i++) {
          const a = (i / count) * Math.PI / 2;
          ctx.beginPath(); ctx.arc(Math.cos(a) * rad, Math.sin(a) * rad, hole, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(160,140,110,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, S - 30, 0, Math.PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, S - 15, 0, Math.PI / 2); ctx.stroke();
      void r;
    }
    ctx.restore();
  }
}

function satin(ctx, x, y, w, h, color, vertical = false) {
  const g = vertical ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, shade(color, -35));
  g.addColorStop(0.35, shade(color, 30));
  g.addColorStop(0.55, color);
  g.addColorStop(1, shade(color, -40));
  return g;
}

function drawClosure(ctx, style, W, H) {
  const col = style.closureColor || '#3e2112';
  ctx.save();
  ctx.shadowColor = 'rgba(20,10,0,0.45)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  if (style.closure === 'elastic') {
    const x = W - 82, w = 20;
    ctx.fillStyle = satin(ctx, x, 0, w, H, col, true);
    ctx.fillRect(x, 0, w, H);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x + 3, 0, 1, H); ctx.fillRect(x + w - 4, 0, 1, H);
  } else if (style.closure === 'ribbon') {
    const y = Math.round(H * 0.76), h = 30, bx = W * 0.66;
    ctx.fillStyle = satin(ctx, 0, y, W, h, col);
    ctx.fillRect(0, y, W, h);
    // tails
    const tail = (dx) => {
      ctx.beginPath();
      ctx.moveTo(bx - 8 * Math.sign(dx), y + h / 2);
      ctx.lineTo(bx + dx, y + h / 2 + 78);
      ctx.lineTo(bx + dx * 0.55, y + h / 2 + 68);
      ctx.lineTo(bx + dx * 0.3, y + h / 2 + 84);
      ctx.lineTo(bx + 8 * Math.sign(dx), y + h / 2);
      ctx.closePath();
      ctx.fillStyle = satin(ctx, bx, y, 40, 100, col, true);
      ctx.fill();
    };
    tail(-44); tail(40);
    // loops
    const loop = (dir) => {
      ctx.beginPath();
      ctx.moveTo(bx, y + h / 2);
      ctx.bezierCurveTo(bx + dir * 30, y - 36, bx + dir * 78, y - 20, bx + dir * 70, y + h / 2);
      ctx.bezierCurveTo(bx + dir * 78, y + h + 22, bx + dir * 30, y + h + 16, bx, y + h / 2);
      ctx.fillStyle = satin(ctx, bx, y - 30, 60, h + 60, col);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx + dir * 12, y + h / 2);
      ctx.quadraticCurveTo(bx + dir * 40, y - 6, bx + dir * 60, y + h / 2);
      ctx.stroke();
      ctx.shadowColor = 'rgba(20,10,0,0.45)';
    };
    loop(-1); loop(1);
    ctx.beginPath();
    ctx.ellipse(bx, y + h / 2, 13, 17, 0, 0, Math.PI * 2);
    ctx.fillStyle = satin(ctx, bx - 13, y - 2, 26, h + 4, col);
    ctx.fill();
  } else if (style.closure === 'strap') {
    const h = 58, y = H / 2 - h / 2, x = W - 150;
    ctx.beginPath();
    ctx.moveTo(W + 5, y);
    ctx.lineTo(x + h / 2, y);
    ctx.arc(x + h / 2, y + h / 2, h / 2, -Math.PI / 2, Math.PI / 2, true);
    ctx.lineTo(W + 5, y + h);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, shade(col, 25)); g.addColorStop(0.5, col); g.addColorStop(1, shade(col, -25));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.setLineDash([7, 5]);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = rgba('#f3e6cf', 0.8);
    ctx.beginPath();
    ctx.moveTo(W, y + 7);
    ctx.lineTo(x + h / 2, y + 7);
    ctx.arc(x + h / 2, y + h / 2, h / 2 - 7, -Math.PI / 2, Math.PI / 2, true);
    ctx.lineTo(W, y + h - 7);
    ctx.stroke();
    ctx.setLineDash([]);
    // snap button
    const cx = x + h / 2 + 4, cy = y + h / 2;
    const bg = ctx.createRadialGradient(cx - 4, cy - 4, 1, cx, cy, 15);
    bg.addColorStop(0, '#fff3c4'); bg.addColorStop(0.6, '#c9a24a'); bg.addColorStop(1, '#6d5020');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(80,55,15,0.7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.stroke();
  } else if (style.closure === 'twine') {
    const bx = W - 80, by = H / 2;
    ctx.shadowBlur = 3;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#b99a6b';
    for (const dy of [-10, 0, 9]) {
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.bezierCurveTo(bx + 30, by + dy - 12, bx + 60, by + dy + 10, W + 4, by + dy * 2);
      ctx.stroke();
    }
    // figure-eight wrap around the button
    ctx.beginPath();
    ctx.ellipse(bx, by, 26, 10, 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(bx, by, 26, 10, -0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = 'rgba(90,65,30,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(bx, by, 26, 10, 0.5, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    // button
    ctx.shadowColor = 'rgba(20,10,0,0.45)';
    ctx.shadowBlur = 5;
    const g = ctx.createRadialGradient(bx - 5, by - 5, 2, bx, by, 18);
    g.addColorStop(0, shade(col, 35)); g.addColorStop(1, shade(col, -30));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(bx, by, 17, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = rgba('#000000', 0.2);
    ctx.beginPath(); ctx.arc(bx, by, 12, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = shade(col, -60);
    for (const [dx, dy] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) {
      ctx.beginPath(); ctx.arc(bx + dx, by + dy, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}
