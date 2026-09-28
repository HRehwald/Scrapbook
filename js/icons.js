// Small hand-drawn-ish stroke icons.
const P = {
  select: '<path d="M6 3.5l12.5 7-5.6 1.7-2.4 5.5z"/><path d="M13 12.4l4.5 5.1"/>',
  photo: '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17.5l5-5 3.5 3.5 2.5-2.5 5 4.5"/>',
  text: '<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  draw: '<path d="M4 20l1-4.5L16.5 4a2 2 0 013 3L8 18.5z"/><path d="M14.5 6l3 3"/><path d="M4 20l4-1"/>',
  tape: '<path d="M3 9.5l2-1 1.2 1-.7 1.3L4 12l1.2 1.1L4.3 14l2.4 1L18 11.7l3-1.5-2-1 .4-1.5-1.8-.3.6-1.4L7 8z" transform="rotate(-8 12 12)"/>',
  sticker: '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  pages: '<path d="M3 5.5c3-1.2 6-1 9 1 3-2 6-2.2 9-1V19c-3-1.2-6-1-9 1-3-2-6-2.2-9-1z"/><path d="M12 6.5V20"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>',
  prev: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6.5 7l1 13h9l1-13"/><path d="M10 11v5.5M14 11v5.5"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M16 8V5.5A1.5 1.5 0 0014.5 4h-9A1.5 1.5 0 004 5.5v9A1.5 1.5 0 005.5 16H8"/>',
  download: '<path d="M12 4v11"/><path d="M7 10.5l5 5 5-5"/><path d="M4.5 19.5h15"/>',
  upload: '<path d="M12 16V5"/><path d="M7 9.5l5-5 5 5"/><path d="M4.5 19.5h15"/>',
  save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4"/><rect x="8" y="13" width="8" height="5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  zoomIn: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 10.5h5M10.5 8v5"/>',
  zoomOut: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 10.5h5"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 114 2c-.9.6-1.6 1.2-1.6 2.3"/><path d="M12 17h.01"/>',
  eraser: '<path d="M8.5 19.5l-4-4a1.5 1.5 0 010-2.1L13.4 4.5a1.5 1.5 0 012.1 0l4 4a1.5 1.5 0 010 2.1l-9 8.9z"/><path d="M9 19.5h11"/><path d="M8 10l6 6"/>',
  front: '<rect x="8" y="8" width="11" height="11" rx="1"/><path d="M5 15V5h10"/>',
  back: '<rect x="4" y="4" width="11" height="11" rx="1"/><path d="M19 9v10H9"/>',
  up: '<path d="M12 19V6"/><path d="M6.5 11.5L12 6l5.5 5.5"/>',
  down: '<path d="M12 5v13"/><path d="M6.5 12.5L12 18l5.5-5.5"/>',
  straight: '<path d="M4 18h16"/><path d="M7 14l5-8 5 8"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  left: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
  center: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
  right: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
};

export function icon(name) {
  const p = P[name];
  if (!p) return '';
  return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    if (el.querySelector(':scope > svg')) return;
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
  });
}
