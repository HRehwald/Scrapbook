#!/usr/bin/env python3
"""Cut pressed-flower specimens out of green-screen sheets.

For every image in sheets/ this script:
  1. keys out the green background with a soft edge (the key colour is sampled
     from the sheet's border, so off-pure greens from JPEG/WebP compression work),
  2. un-mixes the green from semi-transparent edge pixels and despills the rim,
     then bleeds neighbouring colour into the transparent area so no green fringe
     can appear when the PNG is scaled or blurred,
  3. finds each separate specimen with connected components (nearby bits such
     as loose petals or tiny florets are grouped with their specimen),
  4. saves each one, tightly cropped with a little padding, as a transparent PNG:
     assets/botanicals/sheetN-1.png, sheetN-2.png, ... (numbered in reading order),
     plus a small WebP thumbnail in assets/botanicals/thumbs/,
  5. writes a contact sheet (assets/botanicals-contact-sheet.png) to review and
     rename them.

Requires: numpy, pillow, scipy  (pip install numpy pillow scipy)

Usage:
  python3 tools/extract_botanicals.py
  python3 tools/extract_botanicals.py --sheets sheets --out assets/botanicals --padding 8
"""

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff'}


# --------------------------------------------------------------------------- keying

def key_colour(rgb):
    """Median colour of a thin border around the sheet = the actual background green."""
    b = 6
    border = np.concatenate([
        rgb[:b].reshape(-1, 3), rgb[-b:].reshape(-1, 3),
        rgb[:, :b].reshape(-1, 3), rgb[:, -b:].reshape(-1, 3),
    ])
    greenish = border[border[:, 1] - np.maximum(border[:, 0], border[:, 2]) > 60]
    if len(greenish) < len(border) * 0.3:
        print('  ! border does not look green; falling back to #00FF00', file=sys.stderr)
        return np.array([0.0, 255.0, 0.0])
    return np.median(greenish, axis=0)


def greenness(rgb):
    """How much green sticks out above the other two channels."""
    return rgb[..., 1] - np.maximum(rgb[..., 0], rgb[..., 2])


def limeness(rgb):
    """Saturation x brightness for yellow-green..green hues (0..1). Pressed leaves are
    dull (low), while green-screen glow and spill are bright and saturated (high)."""
    x = rgb / 255.0
    mx, mn = x.max(-1), x.min(-1)
    c = np.maximum(mx - mn, 1e-6)
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    hue = np.where(mx == g, 60 * ((b - r) / c + 2), np.where(mx == r, 60 * (((g - b) / c) % 6), 60 * ((r - g) / c + 4)))
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    return np.where((hue >= 62) & (hue <= 170) & (mx - mn > 0.02), sat * mx, 0.0)


def remove_green(rgb, low=0.28, high=0.80, despill_band=4, despill_margin=25.0, feather=0.6,
                 lime_low=0.45, lime_high=0.62):
    """Returns (rgba float image 0..255, alpha 0..1).

    low/high are fractions of the background's greenness: pixels below `low` stay
    fully opaque, above `high` become fully transparent, with a smooth ramp between.
    """
    rgb = rgb.astype(np.float32)
    key = key_colour(rgb)
    key_g = max(float(key[1] - max(key[0], key[2])), 1.0)

    t = greenness(rgb) / key_g
    alpha = np.clip((high - t) / (high - low), 0.0, 1.0)
    alpha = alpha * alpha * (3 - 2 * alpha)  # smoothstep for a softer edge

    # Green glow / spill that is baked into the art (e.g. lime halos around flowers,
    # flecks between petals): bright lime pixels that connect to the background are
    # faded out. Lime-ish pixels enclosed inside a leaf are left alone.
    lime = limeness(rgb)
    background = alpha < 0.5
    candidate = lime > lime_low
    joined, _ = ndimage.label(candidate | background)
    bg_ids = np.unique(joined[background])
    touching = np.isin(joined, bg_ids[bg_ids > 0]) & candidate
    lime_alpha = np.clip((lime_high - lime) / (lime_high - lime_low), 0.0, 1.0)
    alpha = np.where(touching, np.minimum(alpha, lime_alpha), alpha)
    # Very bright lime is never a pressed plant, even when enclosed (flecks between petals).
    alpha = np.minimum(alpha, np.clip((0.86 - lime) / (0.86 - 0.74), 0.0, 1.0))

    # Un-mix the background from partially transparent pixels: C = a*F + (1-a)*K
    a3 = np.maximum(alpha, 1e-3)[..., None]
    fg = np.where(alpha[..., None] > 0.02, (rgb - (1 - a3) * key) / a3, rgb)
    fg = np.clip(fg, 0, 255)

    # Despill. Pressed plants are olive/grey-green (green only a little above red),
    # while spill is saturated lime, so everywhere green may exceed the stronger of
    # red/blue by at most `despill_margin`. Near the edge and in soft pixels the
    # allowance shrinks to zero, which removes any green fringe.
    solid = alpha > 0.5
    dist_to_bg = ndimage.distance_transform_edt(solid)
    edge = np.clip(dist_to_bg / max(despill_band, 1), 0, 1) * alpha ** 2
    # Light pixels get less allowance: a pale rim with even a little extra green
    # reads as mint, while a dark olive leaf keeps its natural colour.
    other = np.maximum(fg[..., 0], fg[..., 2])
    lightness = np.clip(1.3 - 1.2 * other / 255.0, 0.15, 1.0)
    cap = other + despill_margin * edge * lightness
    fg[..., 1] = np.minimum(fg[..., 1], cap)

    # Bleed: every mostly-transparent pixel takes the colour of the nearest solid
    # pixel, so resampling in the browser can never pull green back in.
    if solid.any():
        _, (iy, ix) = ndimage.distance_transform_edt(~solid, return_indices=True)
        bled = fg[iy, ix]
        fg = np.where(solid[..., None], fg, bled)

    # Gentle feather to soften stair-stepping, without growing the silhouette.
    if feather > 0:
        soft = ndimage.gaussian_filter(alpha, feather)
        alpha = np.minimum(alpha, soft) * 0.5 + alpha * 0.5
    alpha[alpha < 0.02] = 0.0

    rgba = np.dstack([fg, alpha * 255.0])
    return rgba, alpha


# --------------------------------------------------------------------------- specimens

def find_specimens(alpha, group_radius=6, attach_radius=45, min_area_frac=0.0015):
    """Label specimens.

    Pieces within `group_radius` px are joined first. Big pieces (>= min_area) are
    specimens and never merge with each other; small loose bits (a petal, florets,
    a bud) are attached to the nearest specimen if within `attach_radius` px, and
    anything else is discarded as noise.
    """
    mask = alpha > 0.35
    near = ndimage.distance_transform_edt(~mask) <= group_radius
    comp, n = ndimage.label(near)
    comp[~(alpha > 0.02)] = 0  # keep only visible pixels in each component
    min_area = alpha.size * min_area_frac
    areas = ndimage.sum(mask, comp, index=np.arange(1, n + 1))
    big_ids = [i + 1 for i, a in enumerate(areas) if a >= min_area]

    labels = np.zeros_like(comp)
    for new_id, old_id in enumerate(big_ids, start=1):
        labels[comp == old_id] = new_id
    if not big_ids:
        return labels, []

    # attach small bits to the nearest big specimen
    dist, (iy, ix) = ndimage.distance_transform_edt(labels == 0, return_indices=True)
    small = (comp > 0) & (labels == 0)
    if small.any():
        small_ids = np.unique(comp[small])
        for sid in small_ids:
            px = comp == sid
            d = dist[px]
            k = np.argmin(d)
            if d[k] <= attach_radius:
                ys, xs = np.nonzero(px)
                labels[px] = labels[iy[ys[k], xs[k]], ix[ys[k], xs[k]]]

    specimens = [(i, None, int((mask & (labels == i)).sum())) for i in range(1, len(big_ids) + 1)]
    return labels, specimens


def reading_order(boxes, row_tolerance=0.35):
    """Sort (y0, x0, y1, x1) boxes top-to-bottom in rows, then left-to-right."""
    idx = sorted(range(len(boxes)), key=lambda k: (boxes[k][0] + boxes[k][2]) / 2)
    rows, current = [], []
    for k in idx:
        cy = (boxes[k][0] + boxes[k][2]) / 2
        if current:
            ref = current[0]
            ref_cy = (boxes[ref][0] + boxes[ref][2]) / 2
            ref_h = boxes[ref][2] - boxes[ref][0]
            if abs(cy - ref_cy) > ref_h * row_tolerance:
                rows.append(current)
                current = []
        current.append(k)
    if current:
        rows.append(current)
    return [k for row in rows for k in sorted(row, key=lambda k: boxes[k][1])]


def extract_sheet(path, sheet_no, out_dir, padding, args):
    img = Image.open(path).convert('RGB')
    rgb = np.asarray(img)
    rgba, alpha = remove_green(rgb, args.low, args.high, lime_low=args.lime_low, lime_high=args.lime_high)
    labels, specimens = find_specimens(alpha, args.group_radius, args.attach_radius, args.min_area)
    H, W = alpha.shape

    crops = []
    for label_id, sl, _ in specimens:
        region = labels == label_id
        visible = region & (alpha > 0.02)
        ys, xs = np.nonzero(visible)
        y0, y1 = max(ys.min() - padding, 0), min(ys.max() + 1 + padding, H)
        x0, x1 = max(xs.min() - padding, 0), min(xs.max() + 1 + padding, W)
        crops.append(((y0, x0, y1, x1), region))

    order = reading_order([c[0] for c in crops])
    saved = []
    for n, k in enumerate(order, start=1):
        (y0, x0, y1, x1), region = crops[k]
        piece = rgba[y0:y1, x0:x1].copy()
        piece[..., 3] *= region[y0:y1, x0:x1]  # hide bits of neighbouring specimens
        out = Image.fromarray(np.clip(piece + 0.5, 0, 255).astype(np.uint8), 'RGBA')
        name = f'sheet{sheet_no}-{n}.png'
        out.save(out_dir / name, optimize=True)
        if args.thumbs:
            thumb = out.copy()
            thumb.thumbnail((args.thumbs, args.thumbs), Image.LANCZOS)
            (out_dir / 'thumbs').mkdir(exist_ok=True)
            thumb.save(out_dir / 'thumbs' / name.replace('.png', '.webp'), 'WEBP', quality=85)
        saved.append((name, out))
    return saved


# --------------------------------------------------------------------------- contact sheet

def load_font(size):
    for f in ('DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'Arial.ttf'):
        try:
            return ImageFont.truetype(f, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def checkerboard(w, h, cell=12):
    yy, xx = np.mgrid[0:h, 0:w]
    board = (((yy // cell) + (xx // cell)) % 2).astype(np.uint8)
    light, dark = np.array([242, 238, 230]), np.array([214, 208, 198])
    arr = np.where(board[..., None] == 1, dark, light).astype(np.uint8)
    return Image.fromarray(arr, 'RGB')


def contact_sheet(items, path, cell=240, cols=6):
    """items: list of (name, PIL image). Each cell shows the cut-out on a checkerboard
    (left) and on dark card (right strip) so any leftover fringe stands out."""
    if not items:
        return
    label_h, gap = 28, 10
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * (cell + gap) + gap, rows * (cell + label_h + gap) + gap), (250, 247, 240))
    draw = ImageDraw.Draw(sheet)
    font = load_font(15)
    for i, (name, im) in enumerate(items):
        r, c = divmod(i, cols)
        x, y = gap + c * (cell + gap), gap + r * (cell + label_h + gap)
        bg = checkerboard(cell, cell)
        # dark strip along the bottom-right corner to reveal light/green fringes
        dark = Image.new('RGB', (cell // 3, cell // 3), (40, 36, 34))
        bg.paste(dark, (cell - cell // 3, cell - cell // 3))
        thumb = im.copy()
        thumb.thumbnail((cell - 16, cell - 16), Image.LANCZOS)
        bg.paste(thumb, ((cell - thumb.width) // 2, (cell - thumb.height) // 2), thumb)
        sheet.paste(bg, (x, y))
        draw.rectangle([x, y, x + cell - 1, y + cell - 1], outline=(200, 190, 175))
        draw.text((x + 4, y + cell + 5), f'{name}  {im.width}×{im.height}', fill=(60, 45, 35), font=font)
    sheet.save(path, optimize=True)


# --------------------------------------------------------------------------- main

def main():
    here = Path(__file__).resolve().parent.parent
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('--sheets', type=Path, default=here / 'sheets', help='folder with green-screen sheets')
    p.add_argument('--out', type=Path, default=here / 'assets' / 'botanicals', help='output folder for PNGs')
    p.add_argument('--contact', type=Path, default=here / 'assets' / 'botanicals-contact-sheet.png', help='contact sheet path')
    p.add_argument('--padding', type=int, default=6, help='transparent pixels kept around each crop')
    p.add_argument('--low', type=float, default=0.28, help='greenness fraction below which pixels stay opaque')
    p.add_argument('--high', type=float, default=0.80, help='greenness fraction above which pixels are fully transparent')
    p.add_argument('--group-radius', type=int, default=6, help='pieces closer than this (px) are joined into one piece')
    p.add_argument('--attach-radius', type=int, default=45, help='small loose bits within this (px) of a specimen join it')
    p.add_argument('--min-area', type=float, default=0.0015, help='ignore blobs smaller than this fraction of the sheet')
    p.add_argument('--lime-low', type=float, default=0.45, help='bright-lime level where baked-in glow starts fading (0..1)')
    p.add_argument('--lime-high', type=float, default=0.62, help='bright-lime level that is fully removed (0..1)')
    p.add_argument('--thumbs', type=int, default=128, help='also save small WebP thumbnails (max side, px) to <out>/thumbs; 0 = off')
    p.add_argument('--clean', action='store_true', help='delete existing sheet*-*.png in the output folder first')
    args = p.parse_args()

    sheets = sorted(f for f in args.sheets.iterdir() if f.suffix.lower() in IMAGE_EXTS)
    if not sheets:
        sys.exit(f'No images found in {args.sheets}')
    args.out.mkdir(parents=True, exist_ok=True)
    if args.clean:
        for f in list(args.out.glob('sheet*-*.png')) + list(args.out.glob('thumbs/sheet*-*.webp')):
            f.unlink()

    everything = []
    for n, path in enumerate(sheets, start=1):
        saved = extract_sheet(path, n, args.out, args.padding, args)
        print(f'{path.name} -> sheet{n}: {len(saved)} specimens')
        everything += saved
    args.contact.parent.mkdir(parents=True, exist_ok=True)
    contact_sheet(everything, args.contact)
    print(f'Saved {len(everything)} PNGs to {args.out}')
    print(f'Contact sheet: {args.contact}')


if __name__ == '__main__':
    main()
