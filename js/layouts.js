// Ready-made spread layouts with empty photo slots. Coordinates are in spread space (1200 × 800).

const base = { rotation: 0, scaleX: 1, scaleY: 1 };

export const LAYOUTS = [
  { id: 'travel', name: 'Travel collage', pages: ['aged', 'vintage'] },
  { id: 'polaroids', name: 'Polaroid wall', pages: ['kraft', 'lined'] },
];

export function buildLayout(id, uid, textItem) {
  const slot = (frame, x, y, w, h, rotation = 0) => ({
    ...base, id: uid(), type: 'photo', imageId: null, natW: w, natH: h, w, h,
    crop: 'original', frame, filter: 'warm', caption: '', captionFont: 'Caveat', tapeColor: '#e3cfa3', x, y, rotation,
  });
  const scrap = (paper, x, y, w, h, rotation = 0, edges = 'trbl') => ({ ...base, id: uid(), type: 'scrap', paper, w, h, edges, x, y, rotation });
  const tape = (x, y, w, rotation, color = '#e3cfa3', pattern = 'masking') => ({ ...base, id: uid(), type: 'tape', w, h: 28, color, pattern, x, y, rotation });
  const bot = (kind, x, y, rotation = 0, s = 1, flip = false) => ({ ...base, id: uid(), type: 'botanical', kind, flip, diecut: false, x, y, rotation, scaleX: s, scaleY: s });
  const eph = (kind, x, y, rotation = 0, extra = {}) => ({ ...base, id: uid(), type: 'ephemera', kind, x, y, rotation, ...extra });
  const note = (text, x, y, width, rotation, fontSize = 20, style = 'torn', font = 'Nothing You Could Do') =>
    textItem({ text, style, font, fontSize, width, x, y, rotation, color: '#2b2118' });
  const hand = (text, x, y, width, rotation, fontSize = 24, font = 'La Belle Aurore') =>
    textItem({ text, style: 'plain', font, fontSize, width, x, y, rotation, color: '#2b2118' });

  if (id === 'polaroids') {
    return [
      hand('our summer', 60, 50, 480, -4, 60, 'Homemade Apple'),
      slot('polaroid', 60, 190, 220, 220, -5), tape(120, 175, 90, -8, '#e8b4a6', 'stripes'),
      slot('polaroid', 320, 230, 220, 220, 4), tape(380, 215, 90, 6, '#c9d6b2', 'dots'),
      slot('polaroid', 120, 490, 220, 220, 3), tape(170, 478, 90, -4, '#a9c6d8', 'plain'),
      bot('daisy', 400, 540, 12),
      slot('polaroid', 680, 120, 240, 240, 3), tape(740, 105, 90, 4),
      slot('polaroid', 900, 330, 220, 220, -4), tape(960, 318, 90, -6, '#f1d58a', 'grid'),
      note('best. summer. ever.\n\n♡', 690, 480, 190, -3, 26, 'sticky', 'Patrick Hand'),
      bot('lemon', 1030, 620, -10),
    ];
  }

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
    note('colorful, chaotic,\nbeautiful, exactly\nwhat I needed ♡', 40, 610, 170, -3),
    hand('La Sagrada Família ♡', 245, 640, 220, 3, 22),
    bot('bougainvillea', -20, 660, 0),
    bot('olive', 200, 700, -8),
    bot('daisy', 490, 330, 10, 0.9),
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
    bot('bougainvillea', 1060, 330, 15, 0.8),
    hand('Views from above\nfor days…', 890, 705, 180, -3, 22),
    bot('olive', 660, 690, -12, 0.8, true),
  ];
}
