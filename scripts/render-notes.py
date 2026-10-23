"""
Re-generate the spray-note images in public/notes/ after changing components/Note.tsx.

  1. npm run build && npm run start      (in one terminal)
  2. pip install playwright pillow && python -m playwright install chromium
  3. python scripts/render-notes.py        (in another terminal)

The wall and falling notes use these images instead of live SVG because spinning a
picture is far cheaper for a projector laptop than redrawing vector art every frame.
"""
import io
import pathlib
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "notes"
OUT.mkdir(parents=True, exist_ok=True)
FONTS = sys.argv[2] if len(sys.argv) > 2 else None  # optional CSS file with @font-face rules

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1000, "height": 1400}, device_scale_factor=2)
    page.goto(f"{BASE}/notes-render", wait_until="networkidle")
    if FONTS:
        page.add_style_tag(content=pathlib.Path(FONTS).read_text())
    page.evaluate("document.fonts.ready")
    page.wait_for_timeout(600)
    for v in [50, 100, 200, 500, 1000]:
        for face in ["front", "back"]:
            png = page.locator(f"#{face}-{v}").screenshot(omit_background=True)
            img = Image.open(io.BytesIO(png)).convert("RGBA")
            path = OUT / f"{v}-{face}.webp"
            img.save(path, "WEBP", quality=88, method=6)
            print(path.name, img.size, path.stat().st_size // 1024, "KB")
    browser.close()
