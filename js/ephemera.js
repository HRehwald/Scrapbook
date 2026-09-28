// Travel ephemera: postage stamps, postmarks, tickets, labels, airmail strips, postcards.
import { rng, makeCanvas, grain, rgba, shade } from './util.js';
import { renderBotanical, BOTANICALS } from './botanicals.js';
import { distress } from './render.js';

export const EPHEMERA = [
  { id: 'stamp', name: 'Postage stamp', w: 112, h: 134, text: 'ESPAÑA', text2: '0.78 €', color: '#e8d9b8', motif: 'bougainvillea', labels: ['Country', 'Value'] },
  { id: 'postmark', name: 'Postmark', w: 170, h: 100, text: 'BARCELONA', text2: '07 · 2026', color: '#2b2118', labels: ['Town', 'Date'] },
  { id: 'ticket', name: 'Ticket stub', w: 230, h: 116, text: 'SAGRADA FAMÍLIA', text2: 'ENTRADA · ADMIT ONE', color: '#e8b4a6', labels: ['Title', 'Small print'] },
  { id: 'label', name: 'Market label', w: 210, h: 96, text: 'MERCAT DE LA BOQUERIA', text2: 'Nº 178264', color: '#efe3c6', labels: ['Name', 'Number'] },
  { id: 'airmail', name: 'Airmail strip', w: 240, h: 44, text: 'PAR AVION · BY AIR MAIL', text2: '', color: '#fdf9ef', labels: ['Text'] },
  { id: 'postcard', name: 'Postcard', w: 280, h: 180, text: 'Wish you were here!\nLove, us ♡', text2: 'BARCELONA', color: '#f4ecd8', labels: ['Message', 'Heading'] },
];
export const EPHEMERA_COLORS = ['#e8d9b8', '#efe3c6', '#fdf9ef', '#e8b4a6', '#c9d6b2', '#a9c6d8', '#f1d58a', '#d9c2e0', '#2b2118', '#1f3a5f', '#9e2a2b', '#2f5d3a'];
export const STAMP_MOTIFS = BOTANICALS.map((b) => ({ id: b.id, name: b.name }));

export const ephemeron = (id) => EPHEMERA.find((e) => e.id === id) || EPHEMERA[0];

const INK = '#2b2118';
const TYPE = '"Special Elite", "Courier New", monospace';
const SERIF = '"IM Fell English", Georgia, serif';

function fitText(ctx, text, maxW, size, font) {
  let s = size;
  do { ctx.font = `${s}px ${font}`; s -= 1; } while (ctx.measureText(text).width > maxW && s > 7);
}

function perforate(ctx, W, H, r = 4, step = 11) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (let x = step / 2; x < W; x += step) { dot(ctx, x, 0, r); dot(ctx, x, H, r); }
  for (let y = step / 2; y < H; y += step) { dot(ctx, 0, y, r); dot(ctx, W, y, r); }
  ctx.restore();
}
const dot = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };

export function renderEphemera(item, res = 2) {
  const e = ephemeron(item.kind);
  const W = e.w, H = e.h;
  const c = makeCanvas(W * res, H * res);
  const ctx = c.getContext('2d');
  ctx.scale(res, res);
  const r = rng(item.id);
  const color = item.color || e.color;
  const text = item.text ?? e.text;
  const text2 = item.text2 ?? e.text2;

  switch (e.id) {
    case 'stamp': {
      ctx.fillStyle = '#fbf8ef';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = color;
      ctx.fillRect(10, 10, W - 20, H - 20);
      const motif = renderBotanical({ kind: item.motif || e.motif, id: item.id + 'm' }, res);
      const s = Math.min((W - 20) / motif.W, (H - 36) / motif.H) * 1.3;
      ctx.save();
      ctx.beginPath(); ctx.rect(10, 10, W - 20, H - 20); ctx.clip();
      ctx.drawImage(motif.canvas, (W - motif.W * s) / 2, 20 + (H - 36 - motif.H * s) / 2, motif.W * s, motif.H * s);
      ctx.restore();
      ctx.fillStyle = shade(color, -120);
      fitText(ctx, text, W - 30, 13, TYPE);
      ctx.fillText(text, 15, 25);
      fitText(ctx, text2, W - 30, 12, TYPE);
      ctx.textAlign = 'right';
      ctx.fillText(text2, W - 15, H - 15);
      ctx.strokeStyle = rgba('#000000', 0.2);
      ctx.strokeRect(10.5, 10.5, W - 21, H - 21);
      perforate(ctx, W, H);
      break;
    }
    case 'postmark': {
      const ink = color;
      ctx.strokeStyle = ink; ctx.fillStyle = ink;
      const cx = 50, cy = 50, R = 44;
      ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R - 16, 0, Math.PI * 2); ctx.stroke();
      // text around the top of the ring
      const t = text.toUpperCase();
      ctx.font = `12px ${TYPE}`;
      const span = Math.min(Math.PI * 1.1, t.length * 0.2);
      [...t].forEach((ch, i) => {
        const a = -Math.PI / 2 - span / 2 + (span * (i + 0.5)) / t.length;
        ctx.save(); ctx.translate(cx + Math.cos(a) * (R - 9), cy + Math.sin(a) * (R - 9)); ctx.rotate(a + Math.PI / 2);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fitText(ctx, text2, 50, 11, TYPE);
      ctx.fillText(text2, cx, cy + 2);
      ctx.fillText('★', cx, cy + 34);
      ctx.lineWidth = 2;
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        for (let x = 92; x <= W - 2; x += 2) {
          const y = 22 + k * 14 + Math.sin(x / 7) * 3.5;
          x === 92 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      distress(c, item.id, 0.5);
      return { canvas: c, W, H };
    }
    case 'ticket': {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
      const stubX = W - 64;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      dot(ctx, stubX, 0, 8); dot(ctx, stubX, H, 8);
      for (let y = 4; y < H; y += 12) dot(ctx, 0, y, 3), dot(ctx, W, y, 3);
      ctx.restore();
      const ink = shade(color, -140);
      ctx.strokeStyle = rgba(ink, 0.6);
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(stubX, 10); ctx.lineTo(stubX, H - 10); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeRect(10.5, 10.5, stubX - 20, H - 21);
      ctx.fillStyle = ink;
      const words = text.split(' ');
      const half = Math.ceil(words.length / 2);
      const l1 = words.length > 1 ? words.slice(0, half).join(' ') : text, l2 = words.length > 1 ? words.slice(half).join(' ') : '';
      fitText(ctx, l1, stubX - 36, 22, TYPE);
      ctx.fillText(l1, 20, 42);
      if (l2) { fitText(ctx, l2, stubX - 36, 22, TYPE); ctx.fillText(l2, 20, 66); }
      fitText(ctx, text2, stubX - 36, 10, TYPE);
      ctx.fillText(text2, 20, H - 22);
      // barcode on the stub
      let x = stubX + 12;
      while (x < W - 12) { const bw = 1 + Math.floor(r() * 3); ctx.fillRect(x, 16, bw, H - 44); x += bw + 1 + Math.floor(r() * 2); }
      ctx.font = `9px ${TYPE}`;
      ctx.fillText(String(100000 + Math.floor(r() * 899999)), stubX + 10, H - 14);
      break;
    }
    case 'label': {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
      const ink = '#3b2a1e';
      ctx.strokeStyle = rgba(ink, 0.8); ctx.lineWidth = 2;
      ctx.strokeRect(6, 6, W - 12, H - 12);
      ctx.lineWidth = 0.8;
      ctx.strokeRect(10, 10, W - 20, H - 20);
      ctx.fillStyle = ink;
      ctx.textAlign = 'center';
      ctx.font = `14px ${SERIF}`;
      ctx.fillText('✦ ❦ ✦', W / 2, 28);
      const words = text.split(' ');
      const mid = Math.ceil(words.length / 2);
      const lines = text.length > 14 && words.length > 1 ? [words.slice(0, mid).join(' '), words.slice(mid).join(' ')] : [text];
      lines.forEach((ln, i) => { fitText(ctx, ln, W - 40, 17, SERIF); ctx.fillText(ln, W / 2, 50 + i * 19 - (lines.length - 1) * 4); });
      fitText(ctx, text2, W - 40, 10, TYPE);
      ctx.fillText(text2, W / 2, H - 16);
      break;
    }
    case 'airmail': {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(8, 8, W - 16, H - 16); ctx.clip('evenodd');
      for (let i = -H, k = 0; i < W + H; i += 12, k++) {
        ctx.fillStyle = k % 2 ? '#c0392b' : '#1f3a7a';
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 8, 0); ctx.lineTo(i + 8 - H, H); ctx.lineTo(i - H, H); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = '#1f3a7a';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      fitText(ctx, text, W - 30, 14, TYPE);
      ctx.fillText(text, W / 2, H / 2 + 1);
      break;
    }
    case 'postcard': {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
      const ink = '#3b2a1e';
      ctx.fillStyle = ink;
      ctx.font = `13px ${TYPE}`;
      ctx.fillText('POST CARD', 14, 22);
      ctx.font = `10px ${TYPE}`;
      ctx.fillText(text2.toUpperCase(), 100, 22);
      ctx.strokeStyle = rgba(ink, 0.5);
      ctx.beginPath(); ctx.moveTo(W * 0.56, 34); ctx.lineTo(W * 0.56, H - 14); ctx.stroke();
      for (let y = 90; y < H - 20; y += 22) { ctx.beginPath(); ctx.moveTo(W * 0.6, y); ctx.lineTo(W - 14, y); ctx.stroke(); }
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(W - 62, 12, 48, 56);
      ctx.setLineDash([]);
      ctx.font = `17px "Nothing You Could Do", "Caveat", cursive`;
      ctx.fillStyle = '#1f3a5f';
      text.split("\n").forEach((ln, i) => ctx.fillText(ln, 16, 62 + i * 26, W * 0.52));
      break;
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  grain(ctx, c.width, c.height, 10, r);
  return { canvas: c, W, H };
}
