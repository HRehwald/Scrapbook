import { Store, requestPersistence } from './storage.js';
import { uid, clamp, debounce, downloadBlob, slug, makeCanvas, shade } from './util.js';
import { PAGE_W, PAGE_H, PAPERS, COVERS, paperCanvas, paperThumb } from './papers.js';
import {
  FONTS, INKS, NOTE_COLORS, TAPE_COLORS, FRAMES, FILTERS, CROPS, NOTE_STYLES,
  METALS, PATCH_COLORS, STICKER_LOOKS,
  noteStyle, renderPhoto, renderTape, renderNoteBg, distress, renderSticker, renderScrap, SCRAP_EDGES,
} from './render.js';
import { BOTANICALS, botanical, renderBotanical, botanicalThumb } from './botanicals.js';
import { EPHEMERA, EPHEMERA_COLORS, STAMP_MOTIFS, ephemeron, renderEphemera } from './ephemera.js';
import { LAYOUTS, buildLayout } from './layouts.js';
import { PRESSED, pressed, pressedSize, pressedThumb, loadPressed } from './pressed.js';
import { DESTINATIONS, destination } from './destinations.js';
import {
  COVER_GROUPS, STITCHES, CORNERS, CLOSURES, THREAD_COLORS, CLOSURE_COLORS, COVER_PRESETS,
  coverStyle, renderCoverUnder, renderCoverOver,
} from './covers.js';
import { icon, hydrateIcons } from './icons.js';

const K = window.Konva;
const $ = (sel) => document.querySelector(sel);

// ------------------------------------------------------------------ state

const state = {
  book: null,
  idx: 0,
  tool: 'select',
  selectedId: null,
  brush: { kind: 'pen', color: '#2b2118', size: 4 },
  stickerLook: 'plain',
  kitId: 'greece',
  patchColor: '#f3dc8c',
  eraser: false,
  zoom: 1,
  editing: null,
};

const history = { undo: [], redo: [], snap: null };
const imageCache = new Map();
const pending = new Set();

let stage, bgLayer, itemLayer, decoLayer, uiLayer, tr;

const spread = () => state.book.spreads[state.idx];
const spreadWidth = (sp = spread()) => sp.pages.length * PAGE_W;
const findItem = (id) => spread().items.find((i) => i.id === id);
const findNode = (id) => itemLayer.findOne('#' + id);

// ------------------------------------------------------------------ default book

function newBook() {
  return {
    version: 1,
    title: 'Our Little Scrapbook',
    spreads: [
      {
        id: uid(), cover: true, pages: ['cover-leather'],
        items: [
          textItem({ text: 'Our Little Scrapbook', style: 'label', font: 'Special Elite', fontSize: 34, width: 380, align: 'center', x: 102, y: 300, rotation: -2 }),
          textItem({ text: 'est. ' + new Date().getFullYear(), style: 'plain', font: 'Homemade Apple', fontSize: 22, color: '#f1e4cc', width: 200, align: 'center', x: 200, y: 392, rotation: -2 }),
        ],
      },
      {
        id: uid(), pages: ['kraft', 'lined'],
        items: [
          textItem({ text: 'hello, memories', style: 'plain', font: 'Homemade Apple', fontSize: 34, color: '#3b2a1e', width: 460, x: 70, y: 70, rotation: -3 }),
          textItem({ text: 'Welcome to your scrapbook!\n\n✎ Double-click me to write\n✿ Add photos with the Photo tool\n✐ Doodle with Draw\n☰ Save a backup now & then', style: 'paper', font: 'Patrick Hand', fontSize: 24, width: 330, x: 700, y: 170, rotation: 2 }),
          { id: uid(), type: 'tape', w: 150, h: 34, color: '#c9d6b2', pattern: 'stripes', x: 800, y: 150, rotation: -6, scaleX: 1, scaleY: 1 },
          textItem({ text: 'ADVENTURE', style: 'stamp', font: 'Special Elite', fontSize: 30, color: '#9e2a2b', width: 220, align: 'center', x: 170, y: 560, rotation: -9 }),
          textItem({ text: 'my first page', style: 'tag', font: 'Caveat', fontSize: 30, width: 200, x: 820, y: 560, rotation: 7 }),
        ],
      },
    ],
  };
}

function textItem(o) {
  return {
    id: uid(), type: 'text', text: 'Write something…', font: 'Caveat', fontSize: 30, color: o.style === 'stamp' ? '#9e2a2b' : '#2b2118',
    align: 'left', width: 260, style: 'plain', bg: null, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, ...o,
  };
}

// ------------------------------------------------------------------ images

async function loadImage(imageId) {
  if (!imageId) throw new Error('no image');
  if (!imageCache.has(imageId)) {
    imageCache.set(imageId, (async () => {
      const rec = await Store.getImage(imageId);
      if (!rec) throw new Error('missing image ' + imageId);
      const blob = rec instanceof Blob ? rec : new Blob([rec.data], { type: rec.type });
      const img = new Image();
      img.src = URL.createObjectURL(blob);
      await img.decode();
      return img;
    })());
  }
  return imageCache.get(imageId);
}

function track(p) {
  pending.add(p);
  p.finally(() => pending.delete(p));
  return p;
}
const settle = async () => { while (pending.size) await Promise.allSettled([...pending]); };

async function processImageFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const MAX = 1800;
    const w0 = img.naturalWidth, h0 = img.naturalHeight;
    const s = Math.min(1, MAX / Math.max(w0, h0));
    const keepAlpha = /png|webp|gif/.test(file.type);
    if (s === 1 && file.size < 2.5e6 && /jpeg|png|webp/.test(file.type)) {
      return { record: { type: file.type, data: await file.arrayBuffer() }, w: w0, h: h0 };
    }
    const c = makeCanvas(w0 * s, h0 * s);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, c.width, c.height);
    const type = keepAlpha ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((res) => c.toBlob(res, type, 0.88));
    return { record: { type, data: await blob.arrayBuffer() }, w: c.width, h: c.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ------------------------------------------------------------------ building nodes

const SHADOW = { shadowColor: '#2a1a0c', shadowBlur: 10, shadowOffsetX: 2, shadowOffsetY: 5, shadowOpacity: 0.35 };
const SOFT_SHADOW = { shadowColor: '#2a1a0c', shadowBlur: 4, shadowOffsetX: 1, shadowOffsetY: 2, shadowOpacity: 0.25 };

function buildNode(item) {
  const g = new K.Group({
    id: item.id, name: 'item',
    x: item.x, y: item.y, rotation: item.rotation || 0,
    scaleX: item.scaleX || 1, scaleY: item.scaleY || 1,
    draggable: state.tool === 'select',
  });
  const builders = { photo: buildPhoto, text: buildText, tape: buildTape, drawing: buildDrawing, sticker: buildSticker, scrap: buildScrap, botanical: buildBotanical, ephemera: buildEphemera, pressed: buildPressed };
  (builders[item.type] || (() => {}))(item, g);
  attachEvents(g);
  return g;
}

function photoRes(item) {
  return clamp(2 * Math.max(item.scaleX || 1, item.scaleY || 1), 2, 4);
}

function buildPhoto(item, g) {
  const kimg = new K.Image({ name: 'photo', ...SHADOW });
  g.add(kimg);
  const paint = (img) => {
    const out = renderPhoto(item, img, photoRes(item));
    kimg.setAttrs({ image: out.canvas, x: -out.m, y: -out.m, width: out.W + out.m * 2, height: out.H + out.m * 2 });
    g.setAttrs({ boxW: out.W, boxH: out.H });
    kimg.getLayer()?.batchDraw();
  };
  paint(null);
  track(loadImage(item.imageId).then(paint, () => paint(null)));
}

function buildText(item, g) {
  const st = noteStyle(item.style);
  const [pt, pr, pb, pl] = st.pad;
  const isStamp = item.style === 'stamp';
  const t = new K.Text({
    name: 'text', x: pl, y: pt,
    text: isStamp ? item.text.toUpperCase() : item.text,
    fontFamily: `${item.font}, cursive`, fontSize: item.fontSize, fill: item.color,
    align: item.align, width: item.width, lineHeight: 1.25, wrap: 'word',
    letterSpacing: isStamp ? 2 : 0, opacity: isStamp ? 0.82 : 1,
  });
  if (item.style === 'foil') {
    const c = item.color;
    t.setAttrs({
      fillPriority: 'linear-gradient',
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: item.fontSize * 1.25 },
      fillLinearGradientColorStops: [0, shade(c, 70), 0.45, c, 0.55, shade(c, -30), 1, shade(c, 45)],
      shadowColor: '#000', shadowOpacity: 0.45, shadowBlur: 1.5, shadowOffsetX: 1, shadowOffsetY: 1.2,
    });
  } else if (item.style === 'plate') {
    t.setAttrs({ shadowColor: '#fff6d0', shadowOpacity: 0.7, shadowBlur: 0, shadowOffsetX: 0.8, shadowOffsetY: 1 });
  }
  let w = item.width + pl + pr;
  let h = Math.max(t.height(), item.fontSize * 1.25) + pt + pb;
  if (item.style === 'sticky') h = Math.max(h, w * 0.92);
  if (item.style !== 'plain' && item.style !== 'foil') {
    const { canvas, m } = renderNoteBg(item, w, h, 2);
    if (isStamp) distress(canvas, item.id, 0.35);
    g.add(new K.Image({
      name: 'bg', image: canvas, x: -m, y: -m, width: canvas.width / 2, height: canvas.height / 2,
      ...(isStamp ? {} : item.style === 'label' ? SOFT_SHADOW : SHADOW),
      opacity: isStamp ? 0.85 : 1,
    }));
  } else {
    g.add(new K.Rect({ width: w, height: h, fill: 'rgba(0,0,0,0)' }));
  }
  g.add(t);
  g.setAttrs({ boxW: w, boxH: h });
}

function buildScrap(item, g) {
  const { canvas, m } = renderScrap(item, 2);
  g.add(new K.Image({ image: canvas, x: -m, y: -m, width: canvas.width / 2, height: canvas.height / 2, ...SOFT_SHADOW, shadowOpacity: 0.3 }));
  g.setAttrs({ boxW: item.w, boxH: item.h });
}

function buildBotanical(item, g) {
  const { canvas, W, H, pad } = renderBotanical(item, 2);
  g.add(new K.Image({ image: canvas, x: -pad, y: -pad, width: W, height: H, ...SOFT_SHADOW, shadowBlur: 6, shadowOpacity: 0.35 }));
  g.setAttrs({ boxW: W - pad * 2, boxH: H - pad * 2 });
}

function buildPressed(item, g) {
  const flip = item.flip ? { scaleX: -1, x: item.w } : {};
  const kimg = new K.Image({ width: item.w, height: item.h, ...flip, shadowColor: '#2a1a0c', shadowBlur: 5, shadowOffsetX: 1.5, shadowOffsetY: 3, shadowOpacity: 0.35 });
  // invisible hit box so the item is clickable even before the image loads
  g.add(new K.Rect({ width: item.w, height: item.h, fill: 'rgba(0,0,0,0)' }));
  g.add(kimg);
  g.setAttrs({ boxW: item.w, boxH: item.h });
  track(loadPressed(item.asset).then((img) => { kimg.image(img); kimg.getLayer()?.batchDraw(); }, (err) => console.warn(err)));
}

function buildEphemera(item, g) {
  const { canvas, W, H } = renderEphemera(item, 2);
  const flat = item.kind === 'postmark';
  g.add(new K.Image({ image: canvas, width: W, height: H, ...(flat ? { opacity: 0.8 } : SOFT_SHADOW) }));
  if (flat) g.add(new K.Rect({ width: W, height: H, fill: 'rgba(0,0,0,0)' }));
  g.setAttrs({ boxW: W, boxH: H });
}

function buildTape(item, g) {
  const c = renderTape(item, 2);
  g.add(new K.Image({ image: c, width: item.w, height: item.h, ...SOFT_SHADOW, shadowOpacity: 0.15 }));
  g.setAttrs({ boxW: item.w, boxH: item.h });
}

function brushAttrs(kind, color, size) {
  const base = { stroke: color, lineCap: 'round', lineJoin: 'round', tension: 0.4, hitStrokeWidth: Math.max(18, size * 3) };
  if (kind === 'marker') return { ...base, strokeWidth: size * 3, opacity: 0.45, globalCompositeOperation: 'multiply', lineCap: 'square' };
  if (kind === 'pencil') return { ...base, strokeWidth: Math.max(1, size * 0.6), opacity: 0.7, tension: 0.2 };
  return { ...base, strokeWidth: size };
}

function buildDrawing(item, g) {
  g.add(new K.Line({ name: 'line', points: item.points, ...brushAttrs(item.kind, item.color, item.size) }));
  if (item.kind === 'pencil') {
    // second, offset stroke gives a graphite-y texture
    g.add(new K.Line({
      points: item.points.map((v, i) => v + (i % 2 ? 0.8 : -0.6)),
      ...brushAttrs('pencil', item.color, item.size), opacity: 0.35, listening: false,
    }));
  }
}

function buildSticker(item, g) {
  if (item.look && item.look !== 'plain') {
    const { canvas, W, H } = renderSticker(item);
    g.add(new K.Image({ image: canvas, width: W, height: H, ...SOFT_SHADOW }));
    g.setAttrs({ boxW: W, boxH: H });
    return;
  }
  const t = new K.Text({ text: item.emoji, fontSize: item.size || 64, ...SOFT_SHADOW, fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' });
  g.add(t);
  g.setAttrs({ boxW: t.width(), boxH: t.height() });
}

// ------------------------------------------------------------------ stage

function initStage() {
  stage = new K.Stage({ container: 'stage', width: 100, height: 100 });
  bgLayer = new K.Layer({ listening: false });
  itemLayer = new K.Layer();
  decoLayer = new K.Layer({ listening: false });
  uiLayer = new K.Layer();
  stage.add(bgLayer, itemLayer, decoLayer, uiLayer);
  tr = new K.Transformer({
    rotateAnchorOffset: 28,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    keepRatio: true,
    anchorSize: 12,
    anchorCornerRadius: 6,
    anchorStroke: '#6b3f26',
    anchorFill: '#fdf6e8',
    anchorStrokeWidth: 1.5,
    borderStroke: '#6b3f26',
    borderDash: [5, 4],
    rotationSnaps: [0, 90, 180, 270],
    rotationSnapTolerance: 4,
    padding: 4,
    boundBoxFunc: (oldBox, newBox) => (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20 ? oldBox : newBox),
  });
  uiLayer.add(tr);

  stage.on('mousedown touchstart', onPointerDown);
  stage.on('mousemove touchmove', onPointerMove);
  stage.on('mouseup touchend', onPointerUp);
  window.addEventListener('mouseup', onPointerUp);
}

function renderSpread() {
  const sp = spread();
  const w = spreadWidth(sp);
  bgLayer.destroyChildren();
  sp.pages.forEach((p, i) => {
    bgLayer.add(new K.Image({ image: paperCanvas(p), x: i * PAGE_W, y: 0, width: PAGE_W, height: PAGE_H }));
  });
  if (sp.pages.length === 2) {
    bgLayer.add(new K.Rect({
      x: PAGE_W - 60, y: 0, width: 120, height: PAGE_H,
      fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 120, y: 0 },
      fillLinearGradientColorStops: [0, 'rgba(40,20,5,0)', 0.4, 'rgba(40,20,5,0.12)', 0.49, 'rgba(30,15,0,0.38)', 0.5, 'rgba(20,10,0,0.5)', 0.51, 'rgba(30,15,0,0.38)', 0.6, 'rgba(40,20,5,0.12)', 1, 'rgba(40,20,5,0)'],
    }));
  } else if (sp.cover) {
    const cs = coverStyle(sp);
    bgLayer.add(new K.Image({ image: renderCoverUnder(cs), width: PAGE_W, height: PAGE_H }));
    bgLayer.add(new K.Rect({
      x: 0, y: 0, width: 46, height: PAGE_H,
      fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: 46, y: 0 },
      fillLinearGradientColorStops: [0, 'rgba(0,0,0,0.45)', 0.55, 'rgba(0,0,0,0.12)', 0.62, 'rgba(255,240,220,0.12)', 0.7, 'rgba(0,0,0,0.1)', 1, 'rgba(0,0,0,0)'],
    }));
  }
  bgLayer.batchDraw();

  decoLayer.destroyChildren();
  if (sp.cover) decoLayer.add(new K.Image({ image: renderCoverOver(coverStyle(sp)), width: PAGE_W, height: PAGE_H }));
  decoLayer.batchDraw();

  itemLayer.destroyChildren();
  sp.items.forEach((it) => itemLayer.add(buildNode(it)));
  if (state.selectedId && !findItem(state.selectedId)) state.selectedId = null;
  syncTransformer();
  itemLayer.batchDraw();

  $('#book').classList.toggle('is-cover', !!sp.cover);
  fit();
  updatePager();
}

function fit() {
  const scroll = $('#deskScroll');
  const w = spreadWidth();
  const pad = window.innerWidth < 800 ? 20 : 64;
  const availW = scroll.clientWidth - pad;
  const availH = scroll.clientHeight - pad;
  const base = Math.max(0.1, Math.min(availW / w, availH / PAGE_H));
  const s = base * state.zoom;
  stage.width(Math.round(w * s));
  stage.height(Math.round(PAGE_H * s));
  stage.scale({ x: s, y: s });
  const book = $('#book');
  book.style.width = stage.width() + 'px';
  book.style.height = stage.height() + 'px';
  stage.batchDraw();
}

// ------------------------------------------------------------------ selection & events

function itemGroupOf(node) {
  while (node && node !== stage) {
    if (node.hasName && node.hasName('item')) return node;
    node = node.getParent();
  }
  return null;
}

function select(id) {
  if (state.selectedId === id) return;
  state.selectedId = id;
  syncTransformer();
  renderPanel();
}

function syncTransformer() {
  const node = state.selectedId && state.tool === 'select' ? findNode(state.selectedId) : null;
  tr.nodes(node ? [node] : []);
  const item = node && findItem(state.selectedId);
  tr.enabledAnchors(item && item.type === 'tape'
    ? ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']
    : ['top-left', 'top-right', 'bottom-left', 'bottom-right']);
  tr.keepRatio(!(item && item.type === 'tape'));
  uiLayer.batchDraw();
}

function attachEvents(g) {
  g.on('dragstart', () => select(g.id()));
  g.on('dragend', () => {
    const it = findItem(g.id());
    if (!it) return;
    it.x = g.x(); it.y = g.y();
    commit();
  });
  g.on('transformend', () => {
    const it = findItem(g.id());
    if (!it) return;
    const oldRes = it.type === 'photo' ? photoRes(it) : 0;
    Object.assign(it, { x: g.x(), y: g.y(), rotation: g.rotation(), scaleX: g.scaleX(), scaleY: g.scaleY() });
    if (it.type === 'tape' && Math.abs(it.scaleX - it.scaleY) > 0.01) {
      // stretch tape length rather than squashing its pattern
      it.w = Math.max(30, it.w * it.scaleX / it.scaleY);
      it.scaleX = it.scaleY;
      rebuild(it);
    } else if (it.type === 'photo' && photoRes(it) !== oldRes) {
      rebuild(it);
    }
    commit();
  });
  g.on('dblclick dbltap', () => {
    if (state.tool !== 'select') return;
    const it = findItem(g.id());
    if (it?.type === 'text') editText(it);
    if (it?.type === 'photo') {
      select(it.id);
      if (!it.imageId) replacePhoto(it.id);
      else setTimeout(() => $('#captionInput')?.focus(), 0);
    }
  });
}

let drawing = null;
let erasing = false;

function onPointerDown(e) {
  if (state.editing) return;
  if (state.tool === 'draw') {
    e.evt.preventDefault?.();
    if (state.eraser) { erasing = true; eraseAt(); return; }
    const p = stage.getRelativePointerPosition();
    const { kind, color, size } = state.brush;
    const item = { id: uid(), type: 'drawing', kind, color, size, points: [p.x, p.y, p.x + 0.1, p.y + 0.1], x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
    const g = buildNode(item);
    itemLayer.add(g);
    drawing = { item, g, line: g.findOne('.line') };
    return;
  }
  if (state.tool !== 'select') return;
  if (e.target.getParent && e.target.getParent() === tr) return;
  const g = itemGroupOf(e.target);
  select(g ? g.id() : null);
}

function onPointerMove(e) {
  if (state.tool !== 'draw') return;
  if (erasing) { eraseAt(); return; }
  if (!drawing) return;
  e.evt.preventDefault?.();
  const p = stage.getRelativePointerPosition();
  const pts = drawing.item.points;
  const lx = pts[pts.length - 2], ly = pts[pts.length - 1];
  if (Math.hypot(p.x - lx, p.y - ly) < 1.5) return;
  pts.push(p.x, p.y);
  drawing.line.points(pts);
  itemLayer.batchDraw();
}

function onPointerUp() {
  if (erasing) { erasing = false; if (erasedAny) { erasedAny = false; commit(); } return; }
  if (!drawing) return;
  const { item, g } = drawing;
  drawing = null;
  g.destroy();
  spread().items.push(item);
  itemLayer.add(buildNode(item));
  itemLayer.batchDraw();
  commit();
}

let erasedAny = false;
function eraseAt() {
  const pos = stage.getPointerPosition();
  if (!pos) return;
  const hit = stage.getIntersection(pos);
  const g = hit && itemGroupOf(hit);
  const it = g && findItem(g.id());
  if (it && it.type === 'drawing') {
    spread().items = spread().items.filter((i) => i !== it);
    g.destroy();
    itemLayer.batchDraw();
    erasedAny = true;
  }
}

function rebuild(item) {
  const old = findNode(item.id);
  const n = buildNode(item);
  itemLayer.add(n);
  if (old) { n.zIndex(old.zIndex()); old.destroy(); }
  if (state.selectedId === item.id) syncTransformer();
  itemLayer.batchDraw();
  return n;
}

// ------------------------------------------------------------------ text editing overlay

function editText(item) {
  const g = findNode(item.id);
  const t = g?.findOne('.text');
  if (!t) return;
  select(item.id);
  tr.nodes([]);
  t.hide();
  itemLayer.batchDraw();
  const abs = t.getAbsoluteTransform().decompose();
  const ta = document.createElement('textarea');
  ta.className = 'text-editor';
  ta.value = item.text;
  ta.spellcheck = false;
  Object.assign(ta.style, {
    left: abs.x + 'px', top: abs.y + 'px',
    width: item.width * abs.scaleX + 'px',
    fontSize: item.fontSize * abs.scaleY + 'px',
    fontFamily: `"${item.font}", cursive`,
    color: item.color, textAlign: item.align,
    transform: `rotate(${abs.rotation}deg)`,
    letterSpacing: item.style === 'stamp' ? 2 * abs.scaleX + 'px' : '0',
    textTransform: item.style === 'stamp' ? 'uppercase' : 'none',
  });
  $('#book').appendChild(ta);
  const grow = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 4 + 'px'; };
  grow();
  ta.focus();
  ta.select();
  state.editing = item.id;
  ta.addEventListener('input', grow);
  ta.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) ta.blur();
  });
  ta.addEventListener('blur', () => {
    state.editing = null;
    const changed = ta.value !== item.text;
    item.text = ta.value.trim() ? ta.value : 'Write something…';
    ta.remove();
    rebuild(item);
    syncTransformer();
    renderPanel();
    if (changed) commit();
  }, { once: true });
}

// ------------------------------------------------------------------ history & saving

function snapshot() { return JSON.stringify(spread()); }

function resetHistory() {
  history.undo = []; history.redo = []; history.snap = snapshot();
  updateUndoButtons();
}

function commit() {
  const s = snapshot();
  if (s === history.snap) return;
  history.undo.push(history.snap);
  if (history.undo.length > 80) history.undo.shift();
  history.redo = [];
  history.snap = s;
  updateUndoButtons();
  save();
}

function restore(s) {
  state.book.spreads[state.idx] = JSON.parse(s);
  history.snap = s;
  renderSpread();
  renderPanel();
  updateUndoButtons();
  save();
}

function undo() {
  if (!history.undo.length) return;
  history.redo.push(history.snap);
  restore(history.undo.pop());
}

function redo() {
  if (!history.redo.length) return;
  history.undo.push(history.snap);
  restore(history.redo.pop());
}

function updateUndoButtons() {
  $('#undoBtn').disabled = !history.undo.length;
  $('#redoBtn').disabled = !history.redo.length;
}

const saveState = $('#saveState');
const persist = debounce(async () => {
  try {
    await Store.set('book', state.book);
    await Store.set('position', state.idx);
    saveState.textContent = 'saved ✓';
    saveState.classList.remove('busy');
  } catch (err) {
    console.error(err);
    saveState.textContent = 'not saved!';
    toast('Could not save — your browser storage may be full. Try “Save backup file”.');
  }
}, 400);

function save() {
  saveState.textContent = 'saving…';
  saveState.classList.add('busy');
  persist();
}

// ------------------------------------------------------------------ adding things

function placement(boxW, boxH, jitter = 70) {
  const sp = spread();
  let cx = spreadWidth(sp) / 2;
  if (sp.pages.length === 2) {
    const left = sp.items.filter((i) => i.x < PAGE_W).length;
    const right = sp.items.length - left;
    cx = left <= right ? PAGE_W / 2 : PAGE_W * 1.5;
  }
  const rj = () => (Math.random() - 0.5) * 2 * jitter;
  return {
    x: cx - boxW / 2 + rj(),
    y: PAGE_H / 2 - boxH / 2 + rj(),
    rotation: Math.round((Math.random() - 0.5) * 10),
    scaleX: 1, scaleY: 1,
  };
}

function addItem(item) {
  spread().items.push(item);
  itemLayer.add(buildNode(item));
  setTool('select');
  select(item.id);
  itemLayer.batchDraw();
  commit();
}

let replaceTarget = null;
function replacePhoto(id) {
  replaceTarget = id;
  $('#photoInput').click();
}

async function addPhotos(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  const target = replaceTarget && findItem(replaceTarget);
  replaceTarget = null;
  if (target) {
    try {
      const { record, w, h } = await processImageFile(list[0]);
      const imageId = uid();
      await Store.putImage(imageId, record);
      const patch = { imageId, natW: w, natH: h };
      if (target.imageId && target.crop === 'original') {
        const base = Math.max(target.w, target.h), a = w / h;
        Object.assign(patch, a >= 1 ? { w: base, h: base / a } : { w: base * a, h: base });
      }
      Object.assign(target, patch);
      rebuild(target);
      select(target.id);
      renderPanel();
      commit();
    } catch (err) {
      console.error(err);
      toast(`Couldn't open “${list[0].name}” — is it a normal photo (JPG/PNG)?`);
      hideToastSoon(3000);
    }
    return;
  }
  toast(list.length > 1 ? `Adding ${list.length} photos…` : 'Adding photo…');
  for (const f of list) {
    try {
      const { record, w, h } = await processImageFile(f);
      const imageId = uid();
      await Store.putImage(imageId, record);
      const S = 250;
      const a = w / h;
      const iw = a >= 1 ? S : S * a, ih = a >= 1 ? S / a : S;
      const item = {
        id: uid(), type: 'photo', imageId, natW: w, natH: h, w: iw, h: ih,
        crop: 'original', frame: 'polaroid', filter: 'none', caption: '', captionFont: 'Caveat',
        tapeColor: TAPE_COLORS[Math.floor(Math.random() * TAPE_COLORS.length)],
        ...placement(iw + 28, ih + 78),
      };
      addItem(item);
    } catch (err) {
      console.error(err);
      toast(`Couldn't open “${f.name}” — is it a normal photo (JPG/PNG)?`);
    }
  }
  hideToastSoon();
}

function addText(style) {
  const st = noteStyle(style);
  const presets = {
    plain: { font: 'Caveat', fontSize: 36, width: 280, text: 'Write something…' },
    sticky: { font: 'Patrick Hand', fontSize: 26, width: 200, text: 'Remember…' },
    paper: { font: 'Patrick Hand', fontSize: 24, width: 280, text: 'Dear diary,\ntoday was…' },
    tag: { font: 'Caveat', fontSize: 30, width: 180, text: 'with love' },
    label: { font: 'Special Elite', fontSize: 22, width: 240, text: 'SUMMER · 2026', align: 'center' },
    ticket: { font: 'Special Elite', fontSize: 22, width: 200, text: 'ADMIT ONE\nthe best day', align: 'center' },
    torn: { font: 'Nothing You Could Do', fontSize: 20, width: 190, text: 'a little note\nabout today ♡' },
    stamp: { font: 'Special Elite', fontSize: 30, width: 200, text: 'Memories', align: 'center', color: '#9e2a2b' },
    bookplate: { font: 'IM Fell English', fontSize: 34, width: 300, text: state.book.title || 'My Scrapbook', align: 'center', color: '#3b2a1e' },
    plate: { font: 'Playfair Display', fontSize: 28, width: 280, text: state.book.title || 'My Scrapbook', align: 'center', color: '#3a2a14' },
    foil: { font: 'Playfair Display', fontSize: 44, width: 500, text: state.book.title || 'My Scrapbook', align: 'center', color: '#c9a24a' },
  };
  const p = presets[style] || presets.plain;
  const [pt, pr, pb, pl] = st.pad;
  const it = textItem({ style, ...p, ...placement(p.width + pl + pr, 100) });
  addItem(it);
}

const STICKERS = ['🌸', '🌼', '🌻', '🌷', '🍂', '🍁', '🌿', '🍄', '🦋', '🐝', '🐞', '🌙', '⭐', '✨', '☀️', '☁️', '🌈', '❤️', '💛', '🤍', '💌', '✉️', '📷', '🎞️', '✈️', '🗺️', '🧭', '🏕️', '⛰️', '🌊', '🚲', '☕', '🍓', '🍒', '🧁', '🎂', '🎀', '🎈', '🕯️', '🐱', '🐶', '🧸', '🎵', '📚', '🖋️', '📌', '🧷', '✂️'];
const STAMP_WORDS = ['Memories', 'Adventure', 'Hello!', 'xoxo', 'Best day ever', 'Wish you were here', 'Love', 'Summer', 'Home', 'Friends', 'Air mail', 'Approved'];

function addSticker(emoji) {
  const size = 72;
  const look = state.stickerLook;
  addItem({ id: uid(), type: 'sticker', emoji, size, look, patchColor: state.patchColor, ...placement(size * 1.9, size * 1.9, 120) });
}

function addScrap(paper) {
  const w = 220 + Math.round(Math.random() * 80), h = 160 + Math.round(Math.random() * 80);
  addItem({ id: uid(), type: 'scrap', paper, w, h, edges: 'trbl', ...placement(w, h, 120) });
}

function addPressed(asset, height = 200) {
  const size = pressedSize(asset, height);
  addItem({ id: uid(), type: 'pressed', asset, ...size, flip: false, ...placement(size.w, size.h, 120) });
}

function addKitPiece(d, piece) {
  const e = (kind, extra) => {
    const def = ephemeron(kind);
    addItem({ id: uid(), type: 'ephemera', kind, ...extra, ...placement(def.w, def.h, 120) });
  };
  if (piece === 'title') {
    addItem(textItem({ style: 'plain', text: d.title, font: d.titleFont, fontSize: 90, color: d.ink, width: 480, ...placement(480, 120, 60) }));
  } else if (piece === 'subtitle') {
    addItem(textItem({ style: 'plain', text: d.subtitle, font: 'Nothing You Could Do', fontSize: 26, width: 320, ...placement(320, 40, 80) }));
  } else if (piece === 'note') {
    addItem(textItem({ style: 'torn', text: d.notes[Math.floor(Math.random() * d.notes.length)], font: 'Nothing You Could Do', fontSize: 20, width: 190, ...placement(230, 120, 100) }));
  } else if (piece === 'paper') {
    addScrap(d.paper);
  } else if (piece === 'tape') {
    const it = { id: uid(), type: 'tape', w: 150, h: 34, color: d.tape, pattern: 'plain', ...placement(150, 34, 120) };
    it.rotation = Math.round((Math.random() - 0.5) * 40);
    addItem(it);
  } else if (['stamp', 'postmark', 'ticket', 'label'].includes(piece)) {
    e(piece, d[piece]);
  }
}

function addBotanical(kind) {
  const b = botanical(kind);
  addItem({ id: uid(), type: 'botanical', kind, flip: false, diecut: false, ...placement(b.w, b.h, 120) });
}

function addEphemera(kind) {
  const e = ephemeron(kind);
  addItem({ id: uid(), type: 'ephemera', kind, ...placement(e.w, e.h, 120) });
}

function addTape() {
  const color = TAPE_COLORS[Math.floor(Math.random() * TAPE_COLORS.length)];
  // (masking tape looks best in its natural beige)
  const patterns = ['plain', 'stripes', 'dots', 'grid', 'masking', 'hearts'];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const it = { id: uid(), type: 'tape', w: 160, h: 36, color: pattern === 'masking' ? '#e3cfa3' : color, pattern, ...placement(160, 36, 120) };
  it.rotation = Math.round((Math.random() - 0.5) * 50);
  addItem(it);
}

// ------------------------------------------------------------------ item actions

function withSelected(fn) {
  const it = state.selectedId && findItem(state.selectedId);
  if (it) fn(it);
}

function updateSelected(patch, { commitNow = true, panel = false } = {}) {
  withSelected((it) => {
    Object.assign(it, patch);
    rebuild(it);
    if (commitNow) commit();
    if (panel) renderPanel();
  });
}

function deleteSelected() {
  withSelected((it) => {
    spread().items = spread().items.filter((i) => i !== it);
    findNode(it.id)?.destroy();
    state.selectedId = null;
    syncTransformer();
    itemLayer.batchDraw();
    renderPanel();
    commit();
  });
}

function duplicateSelected() {
  withSelected((it) => {
    const copy = JSON.parse(JSON.stringify(it));
    copy.id = uid();
    copy.x += 24; copy.y += 24;
    addItem(copy);
  });
}

function reorder(where) {
  withSelected((it) => {
    const items = spread().items;
    const i = items.indexOf(it);
    items.splice(i, 1);
    const j = { front: items.length, back: 0, up: Math.min(items.length, i + 1), down: Math.max(0, i - 1) }[where];
    items.splice(j, 0, it);
    const node = findNode(it.id);
    node.zIndex(j);
    itemLayer.batchDraw();
    commit();
  });
}

function nudge(dx, dy) {
  withSelected((it) => {
    it.x += dx; it.y += dy;
    findNode(it.id)?.position({ x: it.x, y: it.y });
    itemLayer.batchDraw();
    commitSoon();
  });
}
const commitSoon = debounce(commit, 350);

// ------------------------------------------------------------------ pages

function updatePager() {
  const sp = spread();
  let label;
  if (sp.cover) label = 'Cover';
  else {
    const n = state.idx * 2 - 1;
    label = `Pages ${n}–${n + 1}`;
  }
  $('#pageLabel').textContent = label;
  $('#pageLabel').title = `${state.idx + 1} of ${state.book.spreads.length}`;
  $('#prevBtn').disabled = state.idx === 0;
  $('#nextBtn').disabled = state.idx >= state.book.spreads.length - 1;
}

let flipping = false;
async function goTo(idx, { animate = true } = {}) {
  idx = clamp(idx, 0, state.book.spreads.length - 1);
  if (idx === state.idx || flipping) return;
  const from = spread();
  const to = state.book.spreads[idx];
  const dir = idx > state.idx ? 1 : -1;
  state.selectedId = null;
  syncTransformer();
  const canFlip = animate && !from.cover && !to.cover && state.zoom === 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let oldL, oldR, s;
  if (canFlip) {
    await settle();
    s = stage.scaleX();
    const pr = Math.min(2, window.devicePixelRatio || 1);
    oldL = stage.toDataURL({ x: 0, y: 0, width: PAGE_W * s, height: PAGE_H * s, pixelRatio: pr });
    oldR = stage.toDataURL({ x: PAGE_W * s, y: 0, width: PAGE_W * s, height: PAGE_H * s, pixelRatio: pr });
  }
  state.idx = idx;
  renderSpread();
  resetHistory();
  renderPanel();
  save();
  if (!canFlip) {
    const book = $('#book');
    book.classList.remove('fade-in');
    void book.offsetWidth;
    if (animate) book.classList.add('fade-in');
    return;
  }
  flipping = true;
  await settle();
  const pr = Math.min(2, window.devicePixelRatio || 1);
  const newL = stage.toDataURL({ x: 0, y: 0, width: PAGE_W * s, height: PAGE_H * s, pixelRatio: pr });
  const newR = stage.toDataURL({ x: PAGE_W * s, y: 0, width: PAGE_W * s, height: PAGE_H * s, pixelRatio: pr });
  const book = $('#book');
  // static cover-up for the half that the turning page will land on
  const still = document.createElement('div');
  still.className = 'flip-still ' + (dir > 0 ? 'left' : 'right');
  still.style.backgroundImage = `url(${dir > 0 ? oldL : oldR})`;
  const leaf = document.createElement('div');
  leaf.className = 'flip-leaf ' + (dir > 0 ? 'fwd' : 'back');
  leaf.innerHTML = `<div class="face front" style="background-image:url(${dir > 0 ? oldR : oldL})"></div><div class="face backside" style="background-image:url(${dir > 0 ? newL : newR})"></div>`;
  book.append(still, leaf);
  setTimeout(() => still.remove(), 330);
  await new Promise((res) => { leaf.addEventListener('animationend', res, { once: true }); setTimeout(res, 900); });
  leaf.remove();
  flipping = false;
}

function addSpread() {
  const cur = spread();
  const sp = { id: uid(), pages: cur.cover ? ['kraft', 'lined'] : [...cur.pages], items: [] };
  state.book.spreads.splice(state.idx + 1, 0, sp);
  save();
  goTo(state.idx + 1);
  toast('Two fresh pages added ✿');
  hideToastSoon();
}

function deleteSpread() {
  if (spread().cover) return;
  if (state.book.spreads.length <= 2) { toast('A book needs at least one pair of pages.'); hideToastSoon(); return; }
  if (!confirm('Tear out these two pages? Everything on them will be removed.')) return;
  state.book.spreads.splice(state.idx, 1);
  state.idx = Math.min(state.idx, state.book.spreads.length - 1);
  state.selectedId = null;
  renderSpread();
  resetHistory();
  renderPanel();
  save();
}

function moveSpread(dir) {
  const i = state.idx, j = i + dir;
  const s = state.book.spreads;
  if (s[i].cover || j < 1 || j >= s.length) return;
  [s[i], s[j]] = [s[j], s[i]];
  state.idx = j;
  updatePager();
  renderPanel();
  save();
}

// ------------------------------------------------------------------ tools

function setTool(tool) {
  if (tool === 'photo') { $('#photoInput').click(); return; }
  if (tool === 'text' || tool === 'sticker' || tool === 'collage') { openPopover(tool); return; }
  if (tool === 'tape') { addTape(); return; }
  if (tool === 'paper') {
    state.selectedId = null;
    state.tool = 'select';
  } else {
    state.tool = tool;
  }
  closePopover();
  document.querySelectorAll('.tool').forEach((b) => b.classList.toggle('active', b.dataset.tool === state.tool && tool !== 'paper'));
  const draggable = state.tool === 'select';
  itemLayer.find('.item').forEach((n) => n.draggable(draggable));
  $('#book').classList.toggle('drawing', state.tool === 'draw');
  $('#book').classList.toggle('erasing', state.tool === 'draw' && state.eraser);
  syncTransformer();
  renderPanel();
  if (tool === 'paper') $('#panel').classList.add('open');
}

// ------------------------------------------------------------------ popovers

function openPopover(kind, refresh = false) {
  const pop = $('#popover');
  const btn = document.querySelector(`.tool[data-tool="${kind}"]`);
  if (!refresh && !pop.hidden && pop.dataset.kind === kind) { closePopover(); return; }
  pop.dataset.kind = kind;
  pop.innerHTML = '';
  if (kind === 'text') {
    pop.insertAdjacentHTML('beforeend', '<h3>Add writing</h3>');
    const grid = document.createElement('div');
    grid.className = 'style-grid';
    NOTE_STYLES.forEach((s) => {
      const b = document.createElement('button');
      b.className = 'style-chip style-' + s.id;
      b.textContent = s.name;
      b.onclick = () => { closePopover(); addText(s.id); };
      grid.appendChild(b);
    });
    pop.appendChild(grid);
  } else if (kind === 'sticker') {
    pop.insertAdjacentHTML('beforeend', '<h3>Sticker look</h3>');
    pop.appendChild(chips(STICKER_LOOKS, state.stickerLook, (l) => { state.stickerLook = l; openPopover('sticker', true); }));
    if (state.stickerLook === 'patch' || state.stickerLook === 'heart') {
      pop.appendChild(swatches(PATCH_COLORS, state.patchColor, (c) => { state.patchColor = c; openPopover('sticker', true); }, 'small'));
    }
    pop.insertAdjacentHTML('beforeend', '<h3>Stickers</h3>');
    const grid = document.createElement('div');
    grid.className = 'sticker-grid';
    STICKERS.forEach((e) => {
      const b = document.createElement('button');
      b.textContent = e;
      b.setAttribute('aria-label', 'Sticker ' + e);
      b.onclick = () => addSticker(e);
      grid.appendChild(b);
    });
    pop.appendChild(grid);
    pop.insertAdjacentHTML('beforeend', '<h3>Ink stamps</h3>');
    const words = document.createElement('div');
    words.className = 'stamp-grid';
    STAMP_WORDS.forEach((w, i) => {
      const b = document.createElement('button');
      b.textContent = w;
      const color = ['#9e2a2b', '#1f3a5f', '#2f5d3a', '#5b3a29'][i % 4];
      b.style.color = color;
      b.style.borderColor = color;
      b.onclick = () => {
        closePopover();
        const width = Math.max(120, Math.min(300, w.length * 22));
        addItem(textItem({ style: 'stamp', text: w, font: 'Special Elite', fontSize: 28, color, width, align: 'center', ...placement(width + 36, 80, 120), rotation: Math.round((Math.random() - 0.5) * 24) }));
      };
      words.appendChild(b);
    });
    pop.appendChild(words);
  }
  if (kind === 'collage') {
    const d = destination(state.kitId) || DESTINATIONS[0];
    pop.insertAdjacentHTML('beforeend', '<h3>Destination kits</h3>');
    const kitSelect = el('select', { class: 'font-select kit-select', 'aria-label': 'Destination', onchange: (ev) => { state.kitId = ev.target.value; openPopover('collage', true); } },
      DESTINATIONS.map((x) => el('option', { value: x.id, selected: x.id === d.id }, x.name)));
    pop.appendChild(kitSelect);
    const kitBtn = (piece, label) => el('button', { class: 'chip', onclick: () => { closePopover(); addKitPiece(d, piece); } }, label);
    pop.appendChild(el('div', { class: 'chips kit-chips' },
      kitBtn('title', 'Title'), kitBtn('subtitle', 'Subtitle'), kitBtn('stamp', 'Stamp'), kitBtn('postmark', 'Postmark'),
      kitBtn('ticket', 'Ticket'), kitBtn('label', 'Label'), kitBtn('note', 'Note'), kitBtn('paper', 'Paper scrap'), kitBtn('tape', 'Tape')));
    pop.appendChild(el('div', { class: 'pressed-grid kit-flowers' }, d.flowers.map((f) =>
      el('button', { title: pressed(f).name, 'aria-label': pressed(f).name, onclick: () => { closePopover(); addPressed(f); } },
        el('img', { src: pressedThumb(f), alt: '' })))));
    pop.insertAdjacentHTML('beforeend', '<h3>Pressed flowers</h3>');
    pop.appendChild(el('div', { class: 'pressed-grid' }, PRESSED.map((p) =>
      el('button', { title: p.name, 'aria-label': p.name, onclick: () => { closePopover(); addPressed(p.id); } },
        el('img', { src: pressedThumb(p.id), alt: '', loading: 'lazy' })))));
    pop.insertAdjacentHTML('beforeend', '<h3>Torn paper scraps</h3>');
    pop.appendChild(el('div', { class: 'scrap-grid' }, PAPERS.map((p) =>
      el('button', { title: p.name, 'aria-label': p.name + ' scrap', onclick: () => { closePopover(); addScrap(p.id); } },
        el('img', { src: paperThumb(p.id), alt: '' })))));
    pop.insertAdjacentHTML('beforeend', '<h3>Travel ephemera</h3>');
    pop.appendChild(el('div', { class: 'chips' }, EPHEMERA.map((e) =>
      el('button', { class: 'chip', onclick: () => { closePopover(); addEphemera(e.id); } }, e.name))));
    pop.insertAdjacentHTML('beforeend', '<h3>Drawn botanicals</h3>');
    pop.appendChild(el('div', { class: 'botanical-grid' }, BOTANICALS.map((b) =>
      el('button', { title: b.name, 'aria-label': b.name, onclick: () => { closePopover(); addBotanical(b.id); } },
        el('img', { src: botanicalThumb(b.id), alt: '' }), el('span', {}, b.name)))));
  }
  pop.hidden = false;
  const r = btn.getBoundingClientRect();
  if (window.innerWidth < 800) {
    pop.style.left = '8px'; pop.style.right = '8px'; pop.style.top = 'auto';
    pop.style.bottom = (window.innerHeight - r.top + 8) + 'px';
  } else {
    pop.style.left = r.right + 10 + 'px';
    pop.style.top = Math.max(8, Math.min(r.top - 10, window.innerHeight - pop.offsetHeight - 8)) + 'px';
    pop.style.right = 'auto'; pop.style.bottom = 'auto';
  }
  btn.classList.add('active');
}

function closePopover() {
  const pop = $('#popover');
  if (pop.hidden) return;
  pop.hidden = true;
  document.querySelectorAll('.tool').forEach((b) => b.classList.toggle('active', b.dataset.tool === state.tool));
}

// ------------------------------------------------------------------ side panel

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach((k) => k != null && e.append(k));
  return e;
}

const section = (title, ...kids) => el('div', { class: 'section' }, el('h4', {}, title), ...kids);

function swatches(colors, current, onPick, cls = '') {
  return el('div', { class: 'swatches ' + cls }, colors.map((c) =>
    el('button', {
      class: 'swatch' + (c === current ? ' on' : ''), style: `--c:${c}`,
      'aria-label': c, title: c, onclick: () => onPick(c),
    })));
}

function chips(options, current, onPick) {
  return el('div', { class: 'chips' }, options.map((o) =>
    el('button', { class: 'chip' + (o.id === current ? ' on' : ''), onclick: () => onPick(o.id) }, o.name)));
}

function range(label, min, max, step, value, onInput) {
  const out = el('span', { class: 'range-val' }, String(value));
  const input = el('input', {
    type: 'range', min, max, step, value,
    oninput: (e) => { out.textContent = e.target.value; onInput(+e.target.value, false); },
    onchange: (e) => onInput(+e.target.value, true),
  });
  return el('label', { class: 'range' }, el('span', {}, label), input, out);
}

function fontSelect(current, onPick) {
  const s = el('select', { class: 'font-select', onchange: (e) => onPick(e.target.value), 'aria-label': 'Font' },
    FONTS.map((f) => el('option', { value: f.family, style: `font-family:'${f.family}'`, selected: f.family === current }, f.label)));
  s.style.fontFamily = `'${current}'`;
  return s;
}

function actionRow() {
  const b = (ic, label, fn, cls = '') => el('button', { class: 'act ' + cls, title: label, 'aria-label': label, onclick: fn, html: icon(ic) });
  return section('Arrange',
    el('div', { class: 'acts' },
      b('front', 'Bring to front', () => reorder('front')),
      b('up', 'Bring forward', () => reorder('up')),
      b('down', 'Send backward', () => reorder('down')),
      b('back', 'Send to back', () => reorder('back')),
      b('straight', 'Straighten', () => updateSelected({ rotation: 0 })),
      b('copy', 'Duplicate (Ctrl+D)', duplicateSelected),
      b('trash', 'Delete', deleteSelected, 'danger'),
    ));
}

function panelHeader(title) {
  return el('div', { class: 'panel-head' },
    el('h3', {}, title),
    el('button', { class: 'icon-btn close-panel', 'aria-label': 'Close', html: icon('close'), onclick: () => { select(null); $('#panel').classList.remove('open'); } }));
}

function renderPanel() {
  const panel = $('#panel');
  panel.innerHTML = '';
  const it = state.selectedId && findItem(state.selectedId);
  panel.classList.toggle('open', !!it || state.tool === 'draw');

  if (state.tool === 'draw') {
    panel.append(panelHeader('Draw'),
      section('Brush', chips([{ id: 'pen', name: 'Pen' }, { id: 'marker', name: 'Marker' }, { id: 'pencil', name: 'Pencil' }, { id: 'eraser', name: 'Eraser' }],
        state.eraser ? 'eraser' : state.brush.kind,
        (k) => {
          state.eraser = k === 'eraser';
          if (!state.eraser) state.brush.kind = k;
          $('#book').classList.toggle('erasing', state.eraser);
          renderPanel();
        })),
      section('Colour', swatches(INKS.concat(['#e8b4a6', '#f1d58a', '#a9c6d8']), state.brush.color, (c) => { state.brush.color = c; state.eraser = false; renderPanel(); })),
      range('Size', 1, 16, 1, state.brush.size, (v) => { state.brush.size = v; }),
      el('p', { class: 'hint' }, state.eraser ? 'Drag over a line to rub it out.' : 'Draw anywhere on the page. Switch to Select to move your doodles.'),
      el('button', { class: 'btn', onclick: () => setTool('select') }, 'Done drawing'));
    return;
  }

  if (!it) { renderPagePanel(panel); return; }

  if (it.type === 'photo') {
    panel.append(panelHeader('Photo'),
      section('Frame', chips(FRAMES, it.frame, (f) => updateSelected({ frame: f }, { panel: true }))));
    if (it.frame === 'polaroid') {
      panel.append(section('Caption',
        el('input', {
          id: 'captionInput', type: 'text', class: 'text-input', maxlength: 40, placeholder: 'write a caption…', value: it.caption || '',
          oninput: (e) => updateSelected({ caption: e.target.value }, { commitNow: false }),
          onchange: () => commit(),
        }),
        fontSelect(it.captionFont || 'Caveat', (f) => updateSelected({ captionFont: f }, { panel: true }))));
    }
    if (it.frame === 'taped') panel.append(section('Tape colour', swatches(TAPE_COLORS, it.tapeColor, (c) => updateSelected({ tapeColor: c }, { panel: true }))));
    panel.append(
      section('Crop', chips(CROPS, it.crop, (c) => {
        const base = Math.max(it.w, it.h);
        const ratio = c === 'original' ? it.natW / it.natH : CROPS.find((x) => x.id === c).ratio;
        const w = ratio >= 1 ? base : base * ratio, h = ratio >= 1 ? base / ratio : base;
        updateSelected({ crop: c, w, h }, { panel: true });
      })),
      section('Filter', chips(FILTERS, it.filter, (f) => updateSelected({ filter: f }, { panel: true }))),
      section('Picture', el('button', { class: 'btn', onclick: () => replacePhoto(it.id), html: icon('replace') + (it.imageId ? 'Replace photo…' : 'Choose photo…') })),
      actionRow());
    return;
  }

  if (it.type === 'text') {
    const st = noteStyle(it.style);
    panel.append(panelHeader('Writing'),
      section('Text', el('textarea', {
        class: 'text-input', rows: 3,
        oninput: (e) => updateSelected({ text: e.target.value || ' ' }, { commitNow: false }),
        onchange: () => commit(),
      }, it.text)),
      section('Style', chips(NOTE_STYLES, it.style, (s) => {
        const patch = { style: s, bg: null };
        if (s === 'foil' && !METALS.includes(it.color)) patch.color = METALS[0];
        if (s !== 'foil' && METALS.includes(it.color) && it.color !== '#fdf9ef') patch.color = '#2b2118';
        updateSelected(patch, { panel: true });
      })),
      section('Font', fontSelect(it.font, (f) => updateSelected({ font: f }, { panel: true }))),
      range('Size', 12, 96, 1, it.fontSize, (v, done) => updateSelected({ fontSize: v }, { commitNow: done })),
      range('Width', 60, 560, 5, Math.round(it.width), (v, done) => updateSelected({ width: v }, { commitNow: done })),
      section('Align', el('div', { class: 'acts' }, ['left', 'center', 'right'].map((a) =>
        el('button', { class: 'act' + (it.align === a ? ' on' : ''), 'aria-label': 'Align ' + a, html: icon(a), onclick: () => updateSelected({ align: a }, { panel: true }) })))),
      it.style === 'foil'
        ? section('Metal', swatches(METALS, it.color, (c) => updateSelected({ color: c }, { panel: true })))
        : section('Ink', swatches(INKS, it.color, (c) => updateSelected({ color: c }, { panel: true }))));
    if (st.bg) panel.append(section('Paper colour', swatches(NOTE_COLORS, it.bg || st.bg, (c) => updateSelected({ bg: c }, { panel: true }))));
    panel.append(actionRow());
    return;
  }

  if (it.type === 'tape') {
    panel.append(panelHeader('Washi tape'),
      section('Colour', swatches(TAPE_COLORS, it.color, (c) => updateSelected({ color: c }, { panel: true }))),
      section('Pattern', chips(['plain', 'masking', 'stripes', 'dots', 'grid', 'hearts', 'text'].map((p) => ({ id: p, name: p[0].toUpperCase() + p.slice(1) })), it.pattern, (p) => updateSelected({ pattern: p }, { panel: true }))),
      range('Length', 40, 500, 5, Math.round(it.w), (v, done) => updateSelected({ w: v }, { commitNow: done })),
      range('Width', 16, 80, 1, Math.round(it.h), (v, done) => updateSelected({ h: v }, { commitNow: done })),
      actionRow());
    return;
  }

  if (it.type === 'scrap') {
    panel.append(panelHeader('Paper scrap'),
      section('Paper', paperPicker(PAPERS, it.paper, (p) => updateSelected({ paper: p }, { panel: true }))),
      section('Edges', chips(SCRAP_EDGES, it.edges ?? 'trbl', (v) => updateSelected({ edges: v }, { panel: true }))),
      range('Width', 40, 900, 5, Math.round(it.w), (v, done) => updateSelected({ w: v }, { commitNow: done })),
      range('Height', 40, 800, 5, Math.round(it.h), (v, done) => updateSelected({ h: v }, { commitNow: done })),
      el('p', { class: 'hint' }, 'Layer scraps under photos: use “Send to back” below.'),
      actionRow());
    return;
  }

  if (it.type === 'pressed') {
    panel.append(panelHeader(pressed(it.asset).name),
      section('Look', el('button', { class: 'btn', onclick: () => updateSelected({ flip: !it.flip }, { panel: true }), html: icon('flip') + 'Flip' })),
      section('Swap for', el('div', { class: 'pressed-grid' }, PRESSED.map((p) =>
        el('button', {
          class: p.id === it.asset ? 'on' : '', title: p.name, 'aria-label': p.name,
          onclick: () => updateSelected({ asset: p.id, ...pressedSize(p.id, it.h) }, { panel: true }),
        }, el('img', { src: pressedThumb(p.id), alt: '', loading: 'lazy' }))))),
      actionRow());
    return;
  }

  if (it.type === 'botanical') {
    panel.append(panelHeader(botanical(it.kind).name),
      section('Look', el('div', { class: 'btn-row' },
        el('button', { class: 'btn', onclick: () => updateSelected({ flip: !it.flip }, { panel: true }), html: icon('flip') + 'Flip' }),
        el('button', { class: 'btn' + (it.diecut ? ' on' : ''), onclick: () => updateSelected({ diecut: !it.diecut }, { panel: true }) }, it.diecut ? 'Remove white edge' : 'White sticker edge'))),
      section('Swap for', chips(BOTANICALS, it.kind, (k) => updateSelected({ kind: k }, { panel: true }))),
      actionRow());
    return;
  }

  if (it.type === 'ephemera') {
    const e = ephemeron(it.kind);
    panel.append(panelHeader(e.name));
    const field = (key, label, multiline) => section(label, el(multiline ? 'textarea' : 'input', {
      class: 'text-input', type: 'text', rows: 3, value: multiline ? undefined : (it[key] ?? e[key]),
      oninput: (ev) => updateSelected({ [key]: ev.target.value }, { commitNow: false }),
      onchange: () => commit(),
    }, multiline ? (it[key] ?? e[key]) : null));
    panel.append(field('text', e.labels[0], e.id === 'postcard'));
    if (e.labels[1]) panel.append(field('text2', e.labels[1], false));
    panel.append(section(e.id === 'postmark' ? 'Ink' : 'Colour', swatches(EPHEMERA_COLORS, it.color || e.color, (c) => updateSelected({ color: c }, { panel: true }))));
    if (e.id === 'stamp') panel.append(section('Picture', chips(STAMP_MOTIFS, it.motif || e.motif, (m) => updateSelected({ motif: m }, { panel: true }))));
    panel.append(actionRow());
    return;
  }

  if (it.type === 'drawing') {
    panel.append(panelHeader('Doodle'),
      section('Colour', swatches(INKS.concat(['#e8b4a6', '#f1d58a', '#a9c6d8']), it.color, (c) => updateSelected({ color: c }, { panel: true }))),
      range('Thickness', 1, 16, 1, it.size, (v, done) => updateSelected({ size: v }, { commitNow: done })),
      actionRow());
    return;
  }

  const look = it.look || 'plain';
  panel.append(panelHeader('Sticker'),
    section('Look', chips(STICKER_LOOKS, look, (l) => updateSelected({ look: l, patchColor: it.patchColor || state.patchColor }, { panel: true }))));
  if (look === 'patch' || look === 'heart') {
    panel.append(section('Patch colour', swatches(PATCH_COLORS, it.patchColor, (c) => updateSelected({ patchColor: c }, { panel: true }))));
  }
  panel.append(actionRow());
}

function paperPicker(list, current, onPick) {
  return el('div', { class: 'papers' }, list.map((p) =>
    el('button', {
      class: 'paper' + (p.id === current ? ' on' : ''), title: p.name, 'aria-label': p.name, onclick: () => onPick(p.id),
    }, el('img', { src: paperThumb(p.id), alt: '', loading: 'lazy' }), el('span', {}, p.name))));
}

function setPaper(i, id) {
  spread().pages[i] = id;
  renderSpread();
  commit();
  renderPanel();
}

function setCoverStyle(patch) {
  const sp = spread();
  sp.coverStyle = { ...coverStyle(sp), ...patch };
  renderSpread();
  commit();
  renderPanel();
}

function renderCoverPanel(panel, sp) {
  const cs = coverStyle(sp);
  const open = state.coverTab || 'look';
  const tabs = el('div', { class: 'tabs', role: 'tablist' }, [['look', 'Material'], ['details', 'Details'], ['title', 'Title & patches']].map(([id, name]) =>
    el('button', { class: 'tab' + (open === id ? ' on' : ''), role: 'tab', 'aria-selected': String(open === id), onclick: () => { state.coverTab = id; renderPanel(); } }, name)));
  panel.append(tabs);

  if (open === 'look') {
    panel.append(section('Quick looks', el('div', { class: 'chips' }, COVER_PRESETS.map((p) =>
      el('button', { class: 'chip', onclick: () => { sp.pages[0] = p.material; setCoverStyle({ ...p.style }); } }, p.name)))));
    COVER_GROUPS.forEach((grp) => panel.append(section(grp,
      paperPicker(COVERS.filter((c) => c.group === grp), sp.pages[0], (id) => {
        sp.pages[0] = id;
        // let the stitching follow the new material unless it was picked by hand
        if (sp.coverStyle && !sp.coverStyle.stitchPicked) delete sp.coverStyle.stitchColor;
        renderSpread(); commit(); renderPanel();
      }))));
  } else if (open === 'details') {
    panel.append(...[
      section('Stitching', chips(STITCHES, cs.stitch, (v) => setCoverStyle({ stitch: v }))),
      cs.stitch !== 'none' ? section('Thread colour', swatches(THREAD_COLORS, cs.stitchColor, (c) => setCoverStyle({ stitchColor: c, stitchPicked: true }))) : null,
      section('Spine band', el('div', { class: 'spines' },
        el('button', { class: 'spine-none' + (cs.spine === 'none' ? ' on' : ''), onclick: () => setCoverStyle({ spine: 'none' }) }, 'None'),
        COVERS.map((c) => el('button', {
          class: 'spine' + (cs.spine === c.id ? ' on' : ''), title: c.name, 'aria-label': c.name,
          style: `background-image:url(${paperThumb(c.id)})`, onclick: () => setCoverStyle({ spine: c.id }),
        })))),
      section('Corners', chips(CORNERS, cs.corners, (v) => setCoverStyle({ corners: v }))),
      section('Closure', chips(CLOSURES, cs.closure, (v) => setCoverStyle({ closure: v }))),
      cs.closure !== 'none' ? section(cs.closure === 'twine' ? 'Button colour' : 'Closure colour', swatches(CLOSURE_COLORS, cs.closureColor, (c) => setCoverStyle({ closureColor: c }))) : null,
    ].filter(Boolean));
  } else {
    panel.append(
      section('Add a title', el('div', { class: 'chips' },
        [['foil', 'Gold foil'], ['bookplate', 'Bookplate'], ['plate', 'Brass plate'], ['label', 'Label strip'], ['plain', 'Handwritten']].map(([st, name]) =>
          el('button', { class: 'chip', onclick: () => { addText(st); if (st === 'label' || st === 'plain') { const it = findItem(state.selectedId); if (it) updateSelected({ text: state.book.title || it.text }, { panel: true }); } } }, name)))),
      el('p', { class: 'hint' }, 'Tip: click an existing title to change its style, font or colour — or delete it.'),
      section('Add a patch or sticker', el('button', { class: 'btn', onclick: (e) => { e.stopPropagation(); state.stickerLook = 'patch'; openPopover('sticker'); }, html: icon('sticker') + 'Choose a patch…' })),
    );
  }
}

function applyLayout(layout) {
  const sp = spread();
  if (sp.items.length && !confirm(`Replace everything on these pages with the “${layout.name}” layout? (You can undo.)`)) return;
  sp.pages = [...layout.pages];
  sp.items = buildLayout(layout.id, uid, textItem);
  if (destination(layout.id)) state.kitId = layout.id;
  state.selectedId = null;
  renderSpread();
  commit();
  renderPanel();
}

function renderPagePanel(panel) {
  const sp = spread();
  panel.append(panelHeader(sp.cover ? 'Cover' : 'These pages'));
  if (sp.cover) {
    renderCoverPanel(panel, sp);
  } else {
    panel.append(
      section('Left page paper', paperPicker(PAPERS, sp.pages[0], (id) => setPaper(0, id))),
      section('Right page paper', paperPicker(PAPERS, sp.pages[1], (id) => setPaper(1, id))),
      section('Pages',
        el('div', { class: 'btn-col' },
          el('button', { class: 'btn', onclick: addSpread, html: icon('plus') + 'Add two pages after these' }),
          el('div', { class: 'btn-row' },
            el('button', { class: 'btn', disabled: state.idx <= 1, onclick: () => moveSpread(-1), html: icon('prev') + 'Move earlier' }),
            el('button', { class: 'btn', disabled: state.idx >= state.book.spreads.length - 1, onclick: () => moveSpread(1), html: 'Move later' + icon('next') })),
          el('button', { class: 'btn danger', onclick: deleteSpread, html: icon('trash') + 'Tear out these pages' }))),
      section('Start from a layout', el('div', { class: 'chips' }, LAYOUTS.filter((l) => !l.destination).map((l) =>
        el('button', { class: 'chip', onclick: () => applyLayout(l) }, l.name)))),
      section('Destination layouts', el('div', { class: 'chips' }, LAYOUTS.filter((l) => l.destination).map((l) =>
        el('button', { class: 'chip', onclick: () => applyLayout(l) }, l.name))),
        el('p', { class: 'hint' }, 'Fills these pages with a ready-made design and empty photo slots — double-click a slot to add your photo.')));
  }
  panel.append(el('p', { class: 'hint' }, 'Tip: click something on the page to decorate it. Double-click writing to edit it.'));
}

// ------------------------------------------------------------------ export / backup

async function exportPNG() {
  state.selectedId = null;
  syncTransformer();
  renderPanel();
  await settle();
  const blob = await stage.toBlob({ pixelRatio: 2 / stage.scaleX(), mimeType: 'image/png' });
  const name = `${slug(state.book.title)}-${spread().cover ? 'cover' : 'pages-' + (state.idx * 2 - 1) + '-' + state.idx * 2}.png`;
  downloadBlob(blob, name);
}

function blobToDataURL(blob) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
}

function referencedImages(book) {
  const ids = new Set();
  book.spreads.forEach((s) => s.items.forEach((i) => i.type === 'photo' && i.imageId && ids.add(i.imageId)));
  return ids;
}

async function exportBackup() {
  toast('Packing your scrapbook…');
  const images = {};
  for (const id of referencedImages(state.book)) {
    const rec = await Store.getImage(id);
    if (rec) images[id] = await blobToDataURL(new Blob([rec.data], { type: rec.type }));
  }
  const data = { app: 'scrapbook', version: 1, savedAt: new Date().toISOString(), book: state.book, images };
  downloadBlob(new Blob([JSON.stringify(data)], { type: 'application/json' }), `${slug(state.book.title)}-backup-${new Date().toISOString().slice(0, 10)}.json`);
  toast('Backup saved to your downloads ✓');
  hideToastSoon();
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'scrapbook' || !data.book?.spreads?.length) throw new Error('not a scrapbook backup');
    if (!confirm(`Open “${data.book.title || 'scrapbook'}”? This replaces the scrapbook currently in this browser.`)) return;
    toast('Unpacking…');
    for (const [id, url] of Object.entries(data.images || {})) {
      const blob = await (await fetch(url)).blob();
      await Store.putImage(id, { type: blob.type, data: await blob.arrayBuffer() });
    }
    imageCache.clear();
    loadBook(data.book, 0);
    save();
    toast('Scrapbook opened ✓');
    hideToastSoon();
  } catch (err) {
    console.error(err);
    toast('Hmm, that file doesn’t look like a scrapbook backup.');
    hideToastSoon(4000);
  }
}

async function garbageCollectImages() {
  try {
    const used = referencedImages(state.book);
    for (const k of await Store.imageKeys()) if (!used.has(k)) await Store.deleteImage(k);
  } catch (_) { /* not critical */ }
}

function loadBook(book, idx) {
  state.book = book;
  state.idx = clamp(idx || 0, 0, book.spreads.length - 1);
  state.selectedId = null;
  $('#bookTitle').value = book.title || '';
  document.title = (book.title || 'Scrapbook') + ' · Scrapbook';
  renderSpread();
  resetHistory();
  renderPanel();
}

// ------------------------------------------------------------------ toast

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
}
function hideToastSoon(ms = 2200) {
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, ms);
}

// ------------------------------------------------------------------ wiring

function wireUI() {
  hydrateIcons();
  document.querySelectorAll('.tool').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
  $('#photoInput').addEventListener('change', (e) => { addPhotos(e.target.files); e.target.value = ''; });
  $('#backupInput').addEventListener('change', (e) => { if (e.target.files[0]) importBackup(e.target.files[0]); e.target.value = ''; });
  $('#prevBtn').onclick = () => goTo(state.idx - 1);
  $('#nextBtn').onclick = () => goTo(state.idx + 1);
  $('#addSpreadBtn').onclick = addSpread;
  $('#undoBtn').onclick = undo;
  $('#redoBtn').onclick = redo;
  $('#zoomInBtn').onclick = () => { state.zoom = Math.min(3, state.zoom * 1.25); fit(); };
  $('#zoomOutBtn').onclick = () => { state.zoom = Math.max(0.5, state.zoom / 1.25); fit(); };
  $('#zoomFitBtn').onclick = () => { state.zoom = 1; fit(); };

  const title = $('#bookTitle');
  title.addEventListener('input', () => {
    state.book.title = title.value;
    document.title = (title.value || 'Scrapbook') + ' · Scrapbook';
    save();
  });
  title.addEventListener('keydown', (e) => { if (e.key === 'Enter') title.blur(); });

  const menuBtn = $('#menuBtn'), menu = $('#menu');
  const closeMenu = () => { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn.onclick = (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; menuBtn.setAttribute('aria-expanded', String(!menu.hidden)); };
  menu.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-action]')?.dataset.action;
    if (!a) return;
    closeMenu();
    if (a === 'png') exportPNG();
    if (a === 'backup') exportBackup();
    if (a === 'restore') $('#backupInput').click();
    if (a === 'help') $('#helpDialog').showModal();
    if (a === 'new') {
      if (!confirm('Start a brand new, empty scrapbook? The current one will be gone — save a backup first if you want to keep it!')) return;
      loadBook(newBook(), 0);
      save();
      garbageCollectImages();
    }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.isConnected) return; // clicked element was re-rendered away
    if (!e.target.closest('.menu-wrap')) closeMenu();
    if (!e.target.closest('#popover') && !e.target.closest('.tool')) closePopover();
  });

  window.addEventListener('resize', debounce(fit, 100));

  // drag & drop and paste photos
  const desk = $('#desk');
  let dragDepth = 0;
  desk.addEventListener('dragenter', (e) => { if ([...e.dataTransfer.types].includes('Files')) { dragDepth++; $('#dropHint').hidden = false; } });
  desk.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('#dropHint').hidden = true; } });
  desk.addEventListener('dragover', (e) => e.preventDefault());
  desk.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDepth = 0;
    $('#dropHint').hidden = true;
    addPhotos(e.dataTransfer.files);
  });
  document.addEventListener('paste', (e) => {
    if (e.target.closest?.('input, textarea')) return;
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) { e.preventDefault(); addPhotos(files); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, select') || state.editing) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); duplicateSelected(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { if (state.selectedId) { e.preventDefault(); deleteSelected(); } }
    else if (e.key === 'Escape') { select(null); closePopover(); if (state.tool !== 'select') setTool('select'); }
    else if (e.key === 'PageDown') goTo(state.idx + 1);
    else if (e.key === 'PageUp') goTo(state.idx - 1);
    else if (e.key.startsWith('Arrow') && state.selectedId) {
      e.preventDefault();
      const d = e.shiftKey ? 10 : 2;
      nudge(e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0, e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0);
    }
    else if (!mod && e.key === 'v') setTool('select');
    else if (!mod && e.key === 'd') setTool('draw');
    else if (e.key === 'Enter' && state.selectedId) {
      const it = findItem(state.selectedId);
      if (it?.type === 'text') { e.preventDefault(); editText(it); }
    }
  });
}

async function loadFonts() {
  if (!document.fonts?.load) return;
  const all = Promise.all(FONTS.map((f) => document.fonts.load(`24px "${f.family}"`).catch(() => {})));
  await Promise.race([all, new Promise((r) => setTimeout(r, 3500))]);
}

async function main() {
  wireUI();
  initStage();
  await loadFonts();
  let book = null, pos = 0;
  try {
    book = await Store.get('book');
    pos = (await Store.get('position')) || 0;
  } catch (err) { console.error(err); }
  const firstVisit = !book;
  loadBook(book || newBook(), pos);
  setTool('select');
  if (firstVisit) save();
  saveState.textContent = (await Store.isPersistent()) ? 'saved ✓' : 'not saving (private mode?)';
  requestPersistence();
  garbageCollectImages();
  if (firstVisit) setTimeout(() => $('#helpDialog').showModal(), 500);
  document.body.classList.add('ready');
}

main();
