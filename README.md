# Scrapbook ✿

A cosy, vintage-kraft scrapbook in your browser: design your cover (23 materials, stitching, spine band, corners, ribbon/strap closures, gold-foil titles, embroidered patches), build travel-journal collages (torn paper scraps, map & azulejo papers, stamps, postmarks, tickets, pressed botanicals, ready-made layouts with photo slots), add photos (polaroid, deckle, torn, stamp… frames), write notes in handwriting fonts (sticky notes, tags, tickets, ink stamps), doodle, add washi tape and stickers, and flip through pages.

- Everything saves automatically in your browser (IndexedDB).
- ☰ → **Save backup file** / **Open backup file** to keep it safe or move it to another device.
- ☰ → **Download this page as picture** exports a PNG.

## Hosting on GitHub Pages

It's a plain static site (no build step). In the repo: **Settings → Pages → Build and deployment → Deploy from a branch**, pick `main` and `/ (root)`, and save.

Local preview: `python3 -m http.server` and open http://localhost:8000.

Uses [Konva](https://konvajs.org/) (MIT, vendored in `js/vendor/`) and Google Fonts.
