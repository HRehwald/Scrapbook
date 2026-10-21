// Ready-made spread layouts with empty photo slots. Coordinates are in spread space (1200 × 800).
import { DESTINATIONS, destination } from './destinations.js';
import { pressedSize } from './pressed.js';
import { doodle as doodleDef } from './doodles.js';

const base = { rotation: 0, scaleX: 1, scaleY: 1 };

export const LAYOUTS = [
  { id: 'travel', name: 'Barcelona collage', pages: ['aged', 'vintage'] },
  { id: 'polaroids', name: 'Polaroid wall', pages: ['kraft', 'lined'] },
  ...DESTINATIONS.map((d) => ({ id: d.id, name: d.name, pages: d.pages, destination: true })),
];

export function helpers(uid, textItem) {
  const h = {};
  h.slot = (frame, x, y, w, hh, rotation = 0) => ({
    ...base, id: uid(), type: 'photo', imageId: null, natW: w, natH: hh, w, h: hh,
    crop: 'original', frame, filter: 'warm', caption: '', captionFont: 'Caveat', tapeColor: '#e3cfa3', x, y, rotation,
  });
  h.scrap = (paper, x, y, w, hh, rotation = 0, edges = 'trbl', crop = {}) => ({ ...base, id: uid(), type: 'scrap', paper, w, h: hh, edges, x, y, rotation, ...crop });
  h.tape = (x, y, w, rotation, color = '#e3cfa3', pattern = 'masking') => ({ ...base, id: uid(), type: 'tape', w, h: 28, color, pattern, x, y, rotation });
  h.bot = (kind, x, y, rotation = 0, s = 1, flip = false) => ({ ...base, id: uid(), type: 'botanical', kind, flip, diecut: false, x, y, rotation, scaleX: s, scaleY: s });
  h.pressed = (asset, x, y, height = 180, rotation = 0, flip = false) => ({ ...base, id: uid(), type: 'pressed', asset, ...pressedSize(asset, height), flip, x, y, rotation });
  h.eph = (kind, x, y, rotation = 0, extra = {}) => ({ ...base, id: uid(), type: 'ephemera', kind, x, y, rotation, ...extra });
  h.note = (text, x, y, width, rotation, fontSize = 20, style = 'torn', font = 'Nothing You Could Do') =>
    textItem({ text, style, font, fontSize, width, x, y, rotation, color: '#2b2118' });
  h.hand = (text, x, y, width, rotation, fontSize = 24, font = 'La Belle Aurore', color = '#2b2118') =>
    textItem({ text, style: 'plain', font, fontSize, width, x, y, rotation, color });
  h.neon = (text, x, y, width, rotation, fontSize = 40, font = 'Nothing You Could Do', color = '#ff4fa3') =>
    textItem({ text, style: 'neon', font, fontSize, width, x, y, rotation, color, align: 'center' });
  h.doodle = (kind, x, y, height, rotation = 0, flip = false) => {
    const s = height / doodleDef(kind).h;
    return { ...base, id: uid(), type: 'doodle', kind, flip, x, y, rotation, scaleX: s, scaleY: s };
  };
  return h;
}

export function buildLayout(id, uid, textItem) {
  const h = helpers(uid, textItem);
  const d = destination(id);
  if (d) {
    const items = COMPOSE[d.comp](h, d);
    // destination-specific illustrations, placed on top
    for (const [kind, x, y, height, rot = 0, flip = false] of d.extras || []) items.push(h.doodle(kind, x, y, height, rot, flip));
    return items;
  }
  if (id === 'polaroids') return polaroids(h);
  return barcelona(h);
}

function polaroids({ slot, tape, pressed, note, hand }) {
  return [
    hand('our summer', 60, 50, 480, -4, 60, 'Homemade Apple'),
    slot('polaroid', 60, 190, 220, 220, -5), tape(120, 175, 90, -8, '#e8b4a6', 'stripes'),
    slot('polaroid', 320, 230, 220, 220, 4), tape(380, 215, 90, 6, '#c9d6b2', 'dots'),
    slot('polaroid', 120, 490, 220, 220, 3), tape(170, 478, 90, -4, '#a9c6d8', 'plain'),
    pressed('daisy', 400, 520, 190, 12),
    slot('polaroid', 680, 120, 240, 240, 3), tape(740, 105, 90, 4),
    slot('polaroid', 900, 330, 220, 220, -4), tape(960, 318, 90, -6, '#f1d58a', 'grid'),
    note('best. summer. ever.\n\n♡', 690, 480, 190, -3, 26, 'sticky', 'Patrick Hand'),
    pressed('buttercup', 1010, 590, 180, -10),
  ];
}

function barcelona({ slot, scrap, tape, bot, pressed, eph, note, hand }) {
  return [
    // left page
    scrap('azulejo', -20, -20, 190, 170, 0),
    scrap('map', 250, 20, 330, 200, 2),
    scrap('aged', 20, 520, 220, 260, -2),
    scrap('azulejo', 470, 600, 160, 220, 4),
    hand('Barcelona', 30, 70, 470, -8, 104, 'Great Vibes'),
    hand('July 2026 ♡', 170, 190, 240, -6, 28, 'Nothing You Could Do'),
    eph('stamp', 468, 36, 7, { motif: 'bougainvillea' }),
    slot('border', 90, 255, 250, 330, -3),
    tape(120, 240, 90, -22),
    eph('ticket', 360, 210, 8),
    slot('mat', 330, 420, 210, 170, 4),
    pressed('bougainvillea-pink', -40, 640, 180, -12),
    note('colorful, chaotic,\nbeautiful, exactly\nwhat I needed ♡', 95, 600, 170, -3),
    hand('La Sagrada Família ♡', 300, 648, 190, 3, 22),
    pressed('olive', 330, 800, 150, -100),
    pressed('daisy', 480, 300, 160, 10),
    // right page
    scrap('map', 610, 520, 300, 270, -2),
    scrap('azulejo', 1060, 560, 170, 260, -3),
    eph('label', 640, 30, -4),
    bot('orange', 600, -14, 0),
    slot('deckle', 650, 150, 240, 190, -3),
    tape(680, 140, 80, -30),
    slot('border', 900, 120, 220, 280, 3),
    tape(965, 108, 90, 5),
    note('Exploring\nwith my girl ♡', 995, 34, 140, 5),
    bot('orange', 1125, -30, 20),
    eph('postmark', 850, 405, -10),
    note('La Boqueria —\nall the colors,\nall the flavors,\nall the happy people ♡', 640, 395, 180, -2),
    slot('torn', 880, 470, 250, 200, -2),
    tape(862, 480, 80, -38),
    tape(1080, 650, 80, -32),
    pressed('bougainvillea-pink', 1075, 290, 170, 18),
    hand('Views from above\nfor days…', 890, 705, 180, -3, 22),
    pressed('olive', 640, 790, 140, -80, true),
  ];
}

// A — layered collage (like the Barcelona spread)
function compA({ slot, scrap, tape, pressed, eph, note, hand }, d) {
  const [f0, f1, f2] = d.flowers;
  const alt = d.extraPaper || 'map';
  return [
    scrap(d.paper, -20, -20, 190, 170, 0, 'trbl', { ox: 0, oy: 0 }),
    scrap('map', 250, 20, 330, 200, 2),
    scrap(d.paper, 20, 540, 230, 260, -2, 'trbl', { oy: 540 }),
    scrap(alt, 470, 600, 160, 220, 4),
    hand(d.title, 30, 70, 480, -8, 100, d.titleFont, d.ink),
    hand(d.subtitle, 140, 190, 400, -6, 24, 'Nothing You Could Do'),
    eph('stamp', 468, 36, 7, d.stamp),
    slot('border', 90, 255, 250, 330, -3),
    tape(120, 240, 90, -22),
    eph('ticket', 350, 210, 8, d.ticket),
    slot('mat', 330, 420, 210, 170, 4),
    pressed(f0, -40, 640, 180, -12),
    note(d.notes[0], 95, 600, 170, -3),
    hand(d.captions[0] || '', 300, 648, 190, 3, 22),
    pressed(f1, 480, 300, 160, 10),
    scrap('map', 610, 520, 300, 270, -2),
    scrap(d.paper, 1060, 560, 170, 260, -3, 'trbl', { oy: 540 }),
    eph('label', 640, 30, -4, d.label),
    slot('deckle', 650, 150, 240, 190, -3),
    tape(680, 140, 80, -30, d.tape, 'plain'),
    slot('border', 900, 120, 220, 280, 3),
    tape(965, 108, 90, 5),
    note(d.notes[1], 995, 34, 150, 5),
    eph('postmark', 850, 405, -10, d.postmark),
    note(d.notes[2], 640, 395, 180, -2),
    slot('torn', 880, 470, 250, 200, -2),
    tape(862, 480, 80, -38),
    tape(1080, 650, 80, -32, d.tape, 'plain'),
    pressed(f0, 1075, 290, 170, 18, true),
    pressed(f2, 650, 640, 150, -14),
    hand(d.captions[1] || '', 890, 705, 180, -3, 22),
  ];
}

// B — themed banner, photo grid and a hero picture
function compB({ slot, scrap, tape, pressed, eph, note, hand }, d) {
  const [f0, f1, f2] = d.flowers;
  return [
    scrap(d.paper, 24, 22, 552, 160, -1, 'b', { ox: 24, oy: 0 }),
    scrap('aged', 150, 62, 300, 96, 1),
    hand(d.title, 150, 64, 300, -2, 66, d.titleFont, d.ink),
    hand(d.subtitle, 330, 178, 250, -4, 24, 'Nothing You Could Do'),
    slot('border', 50, 215, 240, 240, -3), tape(130, 200, 90, -8, d.tape, 'plain'),
    slot('border', 315, 240, 240, 240, 3), tape(390, 226, 90, 6),
    slot('polaroid', 60, 490, 200, 200, 4), tape(115, 478, 80, -4, d.tape, 'stripes'),
    note(d.notes[0], 320, 530, 190, -2),
    eph('stamp', 470, 640, 8, d.stamp),
    pressed(f0, 250, 610, 190, -15),
    scrap('aged', 632, 34, 536, 382, 1),
    slot('deckle', 655, 58, 480, 320, -1),
    tape(630, 50, 90, -35), tape(1110, 50, 90, 35),
    eph('ticket', 640, 430, -4, d.ticket),
    eph('label', 930, 440, 5, d.label),
    eph('postmark', 930, 585, -8, d.postmark),
    note(d.notes[1], 690, 565, 200, 3),
    hand(d.notes[2], 880, 700, 280, -2, 26),
    pressed(f1, 1085, 590, 180, 12),
    pressed(f2, 585, 660, 140, -20),
  ];
}

// C — scattered polaroids and a film strip
function compC({ slot, scrap, tape, pressed, eph, note, hand }, d) {
  const [f0, f1, f2] = d.flowers;
  return [
    scrap(d.paper, -10, 590, 620, 230, 0, 't', { ox: 0, oy: 570 }),
    hand(d.title, 40, 36, 520, -5, d.title.length > 8 ? 80 : 96, d.titleFont, d.ink),
    hand(d.subtitle, 60, 158, 480, -3, 24, 'Nothing You Could Do'),
    slot('polaroid', 60, 215, 220, 220, -6), tape(110, 200, 90, -10, d.tape, 'plain'),
    slot('polaroid', 320, 190, 220, 220, 5), tape(380, 176, 90, 8),
    slot('film', 140, 520, 300, 190, -2),
    eph('stamp', 470, 520, 10, d.stamp),
    pressed(f0, -20, 400, 210, -8),
    scrap('map', 640, 20, 300, 230, -3),
    eph('postmark', 690, 70, -6, d.postmark),
    slot('polaroid', 905, 60, 230, 230, 4), tape(960, 46, 90, 3, d.tape, 'plain'),
    note(d.notes[0], 660, 270, 200, -3),
    slot('polaroid', 700, 420, 220, 220, -4), tape(760, 406, 90, -6),
    eph('ticket', 935, 390, 7, d.ticket),
    eph('label', 955, 560, -3, d.label),
    note(d.notes[1], 965, 670, 190, 2),
    pressed(f1, 1080, 250, 180, 12),
    pressed(f2, 612, 610, 170, -12),
  ];
}

// N — night out: neon writing on a night-sky spread
function compN({ slot, tape, pressed, eph, note, neon, doodle }, d) {
  const [f0, f1] = d.flowers;
  return [
    neon(d.title, 40, 40, 420, -6, 104, d.titleFont, '#ff4fa3'),
    neon(d.subtitle, 230, 136, 260, -4, 34, 'Nothing You Could Do', '#3de3ff'),
    doodle('discoball', 455, -8, 190),
    slot('polaroid', 50, 250, 220, 220, -5),
    slot('polaroid', 300, 285, 220, 220, 6),
    eph('wristband', 30, 245, -9, { text: d.wristbands[0], color: '#ff4fa3' }),
    eph('ticket', 290, 610, -5, d.ticket),
    doodle('cocktail', 30, 585, 160, -8),
    pressed(f0, 480, 560, 170, 14),
    neon(d.notes[0], 110, 735, 380, -2, 30, 'Nothing You Could Do', '#ffe14d'),
    doodle('vinyl', 625, 24, 140, -10),
    slot('border', 815, 40, 300, 210, 3),
    tape(830, 30, 80, -25, '#b26bff', 'plain'),
    neon(d.notes[1], 618, 185, 185, -4, 26, 'Nothing You Could Do', '#3de3ff'),
    slot('polaroid', 650, 330, 215, 215, -4),
    slot('polaroid', 915, 360, 215, 215, 5),
    eph('wristband', 860, 320, 14, { text: d.wristbands[1], color: '#3de3ff' }),
    eph('postmark', 650, 650, -6, d.postmark),
    eph('stamp', 1072, 655, 9, d.stamp),
    pressed(f1, 1075, 185, 150, 12),
    neon(d.notes[2], 800, 722, 240, -3, 28, 'Nothing You Could Do', '#ff4fa3'),
  ];
}

// P — Paris: toile page, Eiffel Tower, street sign, café & métro ephemera
function compP({ slot, scrap, tape, pressed, eph, note, hand, doodle }, d) {
  const [f0, f1] = d.flowers;
  return [
    scrap('cream', 30, 36, 400, 170, -2),
    hand(d.title, 60, 52, 340, -3, 110, d.titleFont, d.ink),
    hand(d.subtitle, 110, 168, 300, -3, 26, 'Nothing You Could Do'),
    doodle('eiffel', 440, 140, 380, 2),
    slot('polaroid', 40, 255, 220, 220, -5),
    tape(95, 240, 90, -8, '#3a5a9a', 'plain'),
    eph('streetsign', 270, 205, 5, d.sign),
    slot('deckle', 225, 480, 230, 175, 4),
    tape(395, 470, 80, 25, '#c8323a', 'plain'),
    doodle('macarons', 30, 585, 110, -6),
    eph('ticket', 285, 672, -5, d.ticket),
    doodle('croissant', 40, 705, 80, -12),
    eph('label', 640, 28, -3, d.label),
    doodle('bicycle', 905, 30, 120, 0),
    slot('border', 650, 150, 300, 215, -2),
    tape(668, 140, 80, -30, '#c8323a', 'plain'),
    slot('polaroid', 975, 185, 190, 190, 5),
    tape(1030, 172, 80, 4, '#3a5a9a', 'plain'),
    eph('postmark', 650, 410, -8, d.postmark),
    note(d.notes[0], 830, 430, 190, 3),
    doodle('baguette', 640, 525, 56, -14),
    slot('polaroid', 700, 560, 175, 175, -4),
    doodle('wine', 920, 555, 130, 8),
    eph('stamp', 1020, 600, 8, d.stamp),
    pressed(f0, 1100, 420, 160, 10),
    pressed(f1, 590, 640, 140, -12),
    hand(d.notes[1], 900, 735, 240, -4, 30, 'La Belle Aurore', d.ink),
  ];
}

const COMPOSE = { A: compA, B: compB, C: compC, N: compN, P: compP };
