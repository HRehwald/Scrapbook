# Scrapbook ✿

A cosy, vintage-kraft scrapbook in your browser: design your cover (23 materials, stitching, spine band, corners, ribbon/strap closures, gold-foil titles, embroidered patches), build travel-journal collages (torn paper scraps, map & azulejo papers, stamps, postmarks, tickets, pressed botanicals, ready-made layouts with photo slots), add photos (polaroid, deckle, torn, stamp… frames), write notes in handwriting fonts (sticky notes, tags, tickets, ink stamps), doodle, add washi tape and stickers, and flip through pages.

- Everything saves automatically in your browser (IndexedDB).
- ☰ → **Save backup file** / **Open backup file** to keep it safe or move it to another device.
- ☰ → **Download this page as picture** exports a PNG.

## Hosting on GitHub Pages

It's a plain static site (no build step). In the repo: **Settings → Pages → Build and deployment → Deploy from a branch**, pick `main` and `/ (root)`, and save.

Local preview: `python3 -m http.server` and open http://localhost:8000.

Uses [Konva](https://konvajs.org/) (MIT, vendored in `js/vendor/`) and Google Fonts.

## Pressed-flower cut-outs

`tools/extract_botanicals.py` turns green-screen sheets into transparent PNGs:

```bash
pip install -r tools/requirements.txt
python3 tools/extract_botanicals.py --clean
```

It reads every image in `sheets/`, keys out the green (soft edge, spill removal, no fringe), finds each specimen, crops it and saves `assets/botanicals/sheetN-1.png`, `sheetN-2.png`, … plus `assets/botanicals-contact-sheet.png` for checking and renaming. Run with `--help` for tuning options.

## Printing a real book (Blurb)

☰ → **Print as a book (Blurb PDF)…** makes two print-ready files for a Blurb *Standard Portrait 8 × 10 in softcover* photo book:

- **Inside pages PDF**: single pages of 8.125 × 10.25 in at 300 dpi (8 × 10 trim + 0.125 in bleed on the top, bottom and outer edge, none at the binding). Page 1 is a right-hand title page, every two-page spread stays together, and blank pages are added so the book has an even count of at least 20 pages.
- **Cover PDF**: back + spine + front in one file. Type the spine width and cover size from Blurb's book-size calculator for your page count and paper.

Then upload both on Blurb via *PDF to Book*. Turn on **Show print guides** to see what the binding and trim will hide: keep text inside the dashed lines and out of the shaded middle.
