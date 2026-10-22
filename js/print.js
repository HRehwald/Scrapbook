// Print-ready PDF export for a Blurb softcover photo book (Standard Portrait 8×10 in).
//
// Blurb "PDF to Book" interior spec: single pages of 8.125 × 10.25 in (8 × 10 trim plus
// 0.125 in bleed on top, bottom and the outside edge — no bleed at the binding), an even
// number of pages, at least 20, page 1 is a right-hand page. sRGB images, ≤ 300 ppi.
// The cover is one wrap-around file (back + spine + front) whose exact size depends on
// the page count and paper, so its spine width comes from Blurb's book-size calculator.
import { PAGE_W, PAGE_H, paperCanvas } from './papers.js';
import { coverStyle, renderCoverUnder, renderCoverOver } from './covers.js';

const K = window.Konva;

export const BLURB_8x10 = {
  name: 'Blurb Standard Portrait 8 × 10 in softcover',
  trimW: 8, trimH: 10, bleed: 0.125, dpi: 300, minPages: 20,
};

const U = PAGE_H / BLURB_8x10.trimH;              // 80 editor units per inch (page height = trim height)
const EXTRA = BLURB_8x10.trimW * U - PAGE_W;      // 40 units: pages print a bit wider than the editor's 3:4
const BLEED = BLURB_8x10.bleed * U;               // 10 units
const PAGE_OUT_W = PAGE_W + EXTRA + BLEED;        // 650 units = 8.125 in
const PAGE_OUT_H = PAGE_H + BLEED * 2;            // 820 units = 10.25 in

// ------------------------------------------------------------------ page plan

/** Which pages go into the PDF, in order. Odd PDF pages are right-hand pages. */
export function planPages(book, { titlePage = true } = {}) {
  const spreads = book.spreads.filter((s) => !s.cover);
  const pages = [{ kind: titlePage ? 'title' : 'blank' }];
  spreads.forEach((sp, i) => {
    pages.push({ kind: 'spread', spread: sp, half: 0, label: `Pages ${i * 2 + 1}–${i * 2 + 2} (left)` });
    pages.push({ kind: 'spread', spread: sp, half: 1, label: `Pages ${i * 2 + 1}–${i * 2 + 2} (right)` });
  });
  let padding = 0;
  // finish on a single left-hand page and reach Blurb's minimum page count
  while (pages.length + 1 < BLURB_8x10.minPages) { pages.push({ kind: 'blank' }, { kind: 'blank' }); padding += 2; }
  pages.push({ kind: 'end' });
  return { pages, padding, spreads: spreads.length };
}

// ------------------------------------------------------------------ rendering

export function makePrinter({ buildNode, settle, setRes, onProgress = () => {} }) {
  const k = BLURB_8x10.dpi / U; // px per unit at 300 dpi

  async function renderRegion(widthU, heightU, populate) {
    const wpx = Math.floor(widthU * k), hpx = Math.floor(heightU * k);
    const holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-100000px;top:0;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(holder);
    const oldRatio = K.pixelRatio;
    K.pixelRatio = 1; // render exactly at print size, not at the screen's device pixel ratio
    const stage = new K.Stage({ container: holder, width: wpx, height: hpx });
    const layer = new K.Layer({ scaleX: k, scaleY: k, listening: false });
    stage.add(layer);
    layer.add(new K.Rect({ x: 0, y: 0, width: widthU, height: heightU, fill: '#ffffff' }));
    try {
      populate(layer);
      await settle();
      layer.draw();
      const canvas = stage.toCanvas({ pixelRatio: 1 });
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
      return { blob, wpx, hpx };
    } finally {
      stage.destroy();
      holder.remove();
      K.pixelRatio = oldRatio;
    }
  }

  // Adds the spread's items so that page `offsetX` lands at `atX` in the output.
  function addItems(layer, items, offsetX, atX, atY) {
    const group = new K.Group({ x: atX - offsetX, y: atY });
    for (const it of items) group.add(buildNode(it));
    layer.add(group);
  }

  function paper(layer, id, x, y, w, h) {
    layer.add(new K.Image({ image: paperCanvas(id, 4, false), x, y, width: w, height: h }));
  }

  async function interiorPage(page, pdfIndex, book) {
    const right = pdfIndex % 2 === 1; // PDF page 1 is a right-hand page
    // In the output, the binding is at x = 0 for right pages and at x = PAGE_OUT_W for left pages.
    const pageX = right ? 0 : EXTRA + BLEED;  // where the editor page's left edge lands
    return renderRegion(PAGE_OUT_W, PAGE_OUT_H, (layer) => {
      if (page.kind === 'spread') {
        const sp = page.spread;
        paper(layer, sp.pages[page.half], 0, 0, PAGE_OUT_W, PAGE_OUT_H);
        addItems(layer, sp.items, page.half * PAGE_W, pageX, BLEED);
      } else {
        paper(layer, 'cream', 0, 0, PAGE_OUT_W, PAGE_OUT_H);
        if (page.kind === 'title') {
          const cx = pageX + PAGE_W / 2;
          layer.add(new K.Text({
            x: cx - 260, y: BLEED + 300, width: 520, align: 'center', text: book.title || 'Our Scrapbook',
            fontFamily: 'Great Vibes, cursive', fontSize: 72, fill: '#3b2a1e',
          }));
          layer.add(new K.Text({
            x: cx - 200, y: BLEED + 410, width: 400, align: 'center', text: '♡',
            fontFamily: 'Nothing You Could Do, cursive', fontSize: 28, fill: '#6b4a32',
          }));
        }
      }
    });
  }

  async function interior(book, opts) {
    const plan = planPages(book, opts);
    const out = [];
    const prev = setRes(4);
    try {
      for (let i = 0; i < plan.pages.length; i++) {
        onProgress(`Rendering page ${i + 1} of ${plan.pages.length}…`);
        const r = await interiorPage(plan.pages[i], i + 1, book);
        const right = (i + 1) % 2 === 1;
        out.push({
          ...r, widthIn: PAGE_OUT_W / U, heightIn: PAGE_OUT_H / U,
          // trim box (inches): bleed on top, bottom and the outer edge only
          trim: [right ? 0 : BLEED / U, BLEED / U, BLURB_8x10.trimW, BLURB_8x10.trimH],
        });
      }
    } finally {
      setRes(prev ?? 2);
    }
    onProgress('Building PDF…');
    return { pdf: await buildPdf(out, book.title), pages: plan.pages.length, padding: plan.padding };
  }

  /** Wrap-around cover: back | spine | front, sized in inches. */
  async function cover(book, { spineIn, widthIn, heightIn }) {
    const sp = book.spreads.find((s) => s.cover);
    const cs = coverStyle(sp);
    const Wu = widthIn * U, Hu = heightIn * U, spineU = spineIn * U;
    const panel = (Wu - spineU) / 2;                 // back and front panels incl. outer bleed
    const ty = (Hu - PAGE_H) / 2;                    // top of the trimmed area
    const frontX = panel + spineU;
    const trimPanel = BLURB_8x10.trimW * U;          // 640 units
    const prev = setRes(4);
    try {
      onProgress('Rendering cover…');
      const r = await renderRegion(Wu, Hu, (layer) => {
        const mat = sp.pages[0];
        paper(layer, mat, 0, 0, panel, Hu);
        paper(layer, mat, frontX, 0, Wu - frontX, Hu);
        paper(layer, mat, panel - 1, 0, spineU + 2, Hu);
        // stitching etc. stretched to the 8 in trim width; mirrored on the back so a spine band sits by the spine
        const under = renderCoverUnder(cs, 4);
        layer.add(new K.Image({ image: under, x: panel, y: ty, width: trimPanel, height: PAGE_H, scaleX: -1 }));
        layer.add(new K.Image({ image: under, x: frontX, y: ty, width: trimPanel, height: PAGE_H }));
        // spine
        layer.add(new K.Rect({ x: panel, y: 0, width: spineU, height: Hu, fill: 'rgba(0,0,0,0.18)' }));
        if (spineIn >= 0.25) {
          const fs = Math.min(spineU * 0.55, 26);
          layer.add(new K.Text({
            x: panel + spineU / 2 + fs / 2, y: ty + 40, width: PAGE_H - 80, align: 'center', rotation: 90,
            text: book.title || '', fontFamily: 'Special Elite, monospace', fontSize: fs, fill: '#f4ead6',
          }));
        }
        // front: the editor cover (600 wide) centred in the 8 in trim
        addItems(layer, sp.items, 0, frontX + EXTRA / 2, ty);
        layer.add(new K.Image({ image: renderCoverOver(cs, 4), x: frontX, y: ty, width: trimPanel, height: PAGE_H }));
      });
      onProgress('Building PDF…');
      const trimIn = [BLURB_8x10.bleed, (heightIn - BLURB_8x10.trimH) / 2, widthIn - BLURB_8x10.bleed * 2, BLURB_8x10.trimH];
      return await buildPdf([{ ...r, widthIn, heightIn, trim: trimIn }], (book.title || 'Scrapbook') + ' — cover');
    } finally {
      setRes(prev ?? 2);
    }
  }

  return { interior, cover, planPages };
}

// ------------------------------------------------------------------ minimal PDF writer
// Each page is one full-bleed JPEG. MediaBox = BleedBox = the full page; TrimBox marks the cut.

async function buildPdf(pages, title = 'Scrapbook') {
  const enc = new TextEncoder();
  const parts = [];
  const offsets = [];
  let offset = 0;
  const push = (x) => {
    const b = typeof x === 'string' ? enc.encode(x) : x;
    parts.push(b);
    offset += b.byteLength;
  };
  const pt = (inches) => (inches * 72).toFixed(3);

  // object numbers: 1 catalog, 2 pages tree, 3 info, then 3 per page (page, content, image)
  const pageObj = (i) => 4 + i * 3;
  const total = 4 + pages.length * 3;
  const begin = (n) => { offsets[n] = offset; push(`${n} 0 obj\n`); };
  const end = () => push('\nendobj\n');

  push('%PDF-1.4\n%âãÏÓ\n');
  begin(1); push('<< /Type /Catalog /Pages 2 0 R >>'); end();
  begin(2); push(`<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, i) => `${pageObj(i)} 0 R`).join(' ')}] >>`); end();
  const safeTitle = String(title).replace(/[()\\]/g, '').replace(/[^\x20-\x7e]/g, '');
  begin(3); push(`<< /Title (${safeTitle}) /Producer (Scrapbook) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z) >>`); end();

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const W = pt(p.widthIn), H = pt(p.heightIn);
    const [tx, ty, tw, th] = p.trim;
    const trimBox = `[${pt(tx)} ${pt(p.heightIn - ty - th)} ${pt(tx + tw)} ${pt(p.heightIn - ty)}]`;
    const n = pageObj(i);
    begin(n);
    push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /BleedBox [0 0 ${W} ${H}] /TrimBox ${trimBox} ` +
      `/Resources << /XObject << /Im0 ${n + 2} 0 R >> >> /Contents ${n + 1} 0 R >>`);
    end();
    const content = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    begin(n + 1); push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`); end();
    const data = new Uint8Array(await p.blob.arrayBuffer());
    begin(n + 2);
    push(`<< /Type /XObject /Subtype /Image /Width ${p.wpx} /Height ${p.hpx} /ColorSpace /DeviceRGB ` +
      `/BitsPerComponent 8 /Filter /DCTDecode /Length ${data.byteLength} >>\nstream\n`);
    push(data);
    push('\nendstream');
    end();
  }

  const xref = offset;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let n = 1; n < total; n++) x += String(offsets[n]).padStart(10, '0') + ' 00000 n \n';
  push(x);
  push(`trailer\n<< /Size ${total} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(parts, { type: 'application/pdf' });
}

// Rough spine estimate (inches) until the user types Blurb's exact number.
export function estimateSpine(pageCount) {
  return Math.max(0.1, Math.round(pageCount * 0.0035 * 100) / 100);
}
