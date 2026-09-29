// Pressed-flower cut-outs (transparent PNGs made by tools/extract_botanicals.py).
// If you rename files in assets/botanicals/, update `file` here too.

const DIR = 'assets/botanicals/';

export const PRESSED = [
  { id: 'bougainvillea-pink', name: 'Bougainvillea', file: 'sheet1-1.png', w: 350, h: 480 },
  { id: 'bougainvillea-orange', name: 'Orange bougainvillea', file: 'sheet1-2.png', w: 381, h: 448 },
  { id: 'daisy', name: 'Daisy', file: 'sheet1-3.png', w: 319, h: 475 },
  { id: 'cosmos', name: 'Cosmos', file: 'sheet1-4.png', w: 328, h: 460 },
  { id: 'poppy', name: 'Poppy', file: 'sheet1-5.png', w: 305, h: 475 },
  { id: 'lavender', name: 'Lavender', file: 'sheet1-6.png', w: 208, h: 471 },
  { id: 'sunflower', name: 'Sunflower', file: 'sheet2-1.png', w: 354, h: 480 },
  { id: 'peony', name: 'Peony', file: 'sheet2-2.png', w: 338, h: 449 },
  { id: 'cherry-blossom', name: 'Cherry blossom', file: 'sheet2-3.png', w: 366, h: 488 },
  { id: 'lilac', name: 'Lilac', file: 'sheet2-4.png', w: 330, h: 495 },
  { id: 'forget-me-not', name: 'Forget-me-not', file: 'sheet2-5.png', w: 284, h: 464 },
  { id: 'mimosa', name: 'Mimosa', file: 'sheet2-6.png', w: 333, h: 484 },
  { id: 'rose', name: 'Rose', file: 'sheet3-1.png', w: 310, h: 465 },
  { id: 'jasmine', name: 'Jasmine', file: 'sheet3-2.png', w: 316, h: 464 },
  { id: 'hydrangea', name: 'Hydrangea', file: 'sheet3-3.png', w: 398, h: 470 },
  { id: 'marigold', name: 'Marigold', file: 'sheet3-4.png', w: 284, h: 484 },
  { id: 'pansy', name: 'Pansy', file: 'sheet3-5.png', w: 276, h: 469 },
  { id: 'cornflower', name: 'Cornflower', file: 'sheet3-6.png', w: 277, h: 483 },
  { id: 'hibiscus', name: 'Hibiscus', file: 'sheet4-1.png', w: 407, h: 451 },
  { id: 'orchid', name: 'Orchid', file: 'sheet4-2.png', w: 362, h: 444 },
  { id: 'wild-rose', name: 'Wild rose', file: 'sheet4-3.png', w: 413, h: 464 },
  { id: 'buttercup', name: 'Buttercup', file: 'sheet4-4.png', w: 353, h: 480 },
  { id: 'wisteria', name: 'Wisteria', file: 'sheet4-5.png', w: 336, h: 481 },
  { id: 'gypsophila', name: "Baby's breath", file: 'sheet4-6.png', w: 409, h: 482 },
  { id: 'olive', name: 'Olive', file: 'sheet5-1.png', w: 184, h: 318 },
  { id: 'eucalyptus', name: 'Eucalyptus', file: 'sheet5-2.png', w: 154, h: 314 },
  { id: 'fern', name: 'Fern', file: 'sheet5-3.png', w: 225, h: 310 },
  { id: 'rosemary', name: 'Rosemary', file: 'sheet5-4.png', w: 118, h: 308 },
  { id: 'ivy', name: 'Ivy', file: 'sheet5-5.png', w: 186, h: 301 },
  { id: 'bay', name: 'Bay leaf', file: 'sheet5-6.png', w: 239, h: 306 },
];

export const pressed = (id) => PRESSED.find((p) => p.id === id) || PRESSED[0];
export const pressedUrl = (id) => DIR + pressed(id).file;
export const pressedThumb = (id) => DIR + 'thumbs/' + pressed(id).file.replace(/\.png$/, '.webp');

// Size (in page units) for a pressed item shown `height` tall.
export function pressedSize(id, height = 180) {
  const p = pressed(id);
  return { w: Math.round((height * p.w) / p.h), h: height };
}

const cache = new Map();
export function loadPressed(id) {
  const url = pressedUrl(id);
  if (!cache.has(url)) {
    cache.set(url, new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => { cache.delete(url); reject(new Error('Could not load ' + url)); };
      img.src = url;
    }));
  }
  return cache.get(url);
}
