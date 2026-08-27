#!/usr/bin/env python3
"""Pack Orbit-Saga tiles, skies, portraits into public/game."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter

ROOT = Path("/workspace")
ART = ROOT / "artifacts" / "imagine_images"
TILES = ROOT / "assets" / "tiles"
PUBLIC = ROOT / "public" / "game"
QC = ROOT / "artifacts" / "tile_qc"
TILE = 64
BLEND = 12
COLS = 4
ROWS = 8

PUBLIC.mkdir(parents=True, exist_ok=True)
TILES.mkdir(parents=True, exist_ok=True)
QC.mkdir(parents=True, exist_ok=True)

TILE_SRC = {
    "snow": ART / "bed56985-5a3a-42ef-86ae-0573888b259c.jpg",
    "ice": ART / "9fec6ebe-1233-47b8-bb68-f68989df8e24.jpg",
    "lava": ART / "18df1842-88cb-4505-a9f1-ad67f5eacc06.jpg",
    "metal": ART / "815cc824-4a8e-4e0d-92a4-e23bb4781726.jpg",
    "basalt": ART / "a95bfba2-0032-4d9b-8546-2d41eedc56e3.jpg",
}

COPIES = {
    "sky-verdant.jpg": ART / "e6ae1ef5-3cf8-45c4-b6d8-711162deaf03.jpg",
    "sky-terra.jpg": ART / "72dce446-1589-44b8-8dcb-3d1d3594dbb7.jpg",
    "sky-cinder.jpg": ART / "de966310-4f63-4629-9a85-26c9769a9cec.jpg",
    "sky-rime.jpg": ART / "e764deff-de21-4755-933b-69efe066a431.jpg",
    "sky-aether.jpg": ART / "c7df1a70-e207-440a-842e-dbc6e31adea4.jpg",
    "portrait-venn.jpg": ART / "04b9c12f-8482-4ae5-a367-210e6a868540.jpg",
    "portrait-lira.jpg": ART / "f642180f-a304-48ed-a56d-16eba69d289b.jpg",
    "portrait-oru.jpg": ART / "fe2e305f-97a2-4d0a-a707-e499ea849bca.jpg",
    "portrait-veyra.jpg": ART / "f9b3cba9-d115-45e0-9038-7f268a34f72c.jpg",
    "portrait-nyx.jpg": ART / "29f1b2e9-564e-4804-a32d-3c7535c09e5d.jpg",
    "portrait-aeon.jpg": ART / "7369641d-642e-422d-92bf-5a904c462342.jpg",
    "title-saga.jpg": ART / "8e5b0b78-3ad1-4ff5-837e-3f894e507865.jpg",
    "warp.jpg": ART / "24f5d207-be03-42be-8773-5bc0a314e2b7.jpg",
}


def wrap_blend(im: Image.Image) -> Image.Image:
    out = im.copy()
    px = out.load()
    w, h = out.size
    offx = ImageChops.offset(im, w // 2, 0)
    ox = offx.load()
    for y in range(h):
        for x in range(BLEND):
            t = x / BLEND
            a, b = px[x, y], ox[x, y]
            px[x, y] = tuple(int(a[i] * t + b[i] * (1 - t)) for i in range(3))
            a2, b2 = px[w - 1 - x, y], ox[w - 1 - x, y]
            px[w - 1 - x, y] = tuple(int(a2[i] * t + b2[i] * (1 - t)) for i in range(3))
    offy = ImageChops.offset(out, 0, h // 2)
    oy = offy.load()
    px = out.load()
    for y in range(BLEND):
        t = y / BLEND
        for x in range(w):
            a, b = px[x, y], oy[x, y]
            px[x, y] = tuple(int(a[i] * t + b[i] * (1 - t)) for i in range(3))
            a2, b2 = px[x, h - 1 - y], oy[x, h - 1 - y]
            px[x, h - 1 - y] = tuple(int(a2[i] * t + b2[i] * (1 - t)) for i in range(3))
    return out


def to_tile(path: Path, crop_bottom: bool = False) -> Image.Image:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    if crop_bottom:
        im = im.crop((0, int(h * 0.42), w, h))
        w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    im = im.resize((TILE, TILE), Image.Resampling.LANCZOS)
    im = wrap_blend(im)
    im = ImageEnhance.Color(im).enhance(1.08)
    im = im.filter(ImageFilter.UnsharpMask(radius=0.6, percent=80, threshold=2))
    return im


def two_by_two(im: Image.Image, dest: Path) -> None:
    g = Image.new("RGB", (TILE * 2, TILE * 2))
    for y in range(2):
        for x in range(2):
            g.paste(im, (x * TILE, y * TILE))
    g.save(dest)


def main() -> None:
    made = {}
    for key, src in TILE_SRC.items():
        if not src.exists():
            print("missing", src)
            continue
        tile = to_tile(src, crop_bottom=(key == "snow"))
        dest = TILES / f"{key}.png"
        tile.save(dest)
        two_by_two(tile, QC / f"{key}_2x2.png")
        made[key] = dest
        print("tile", key, dest)

    old = PUBLIC / "atlas.png"
    base = Image.open(old).convert("RGB")
    atlas = Image.new("RGB", (COLS * TILE, ROWS * TILE), (20, 22, 24))
    atlas.paste(base.resize((COLS * TILE, COLS * TILE), Image.Resampling.NEAREST), (0, 0))
    order = ["snow", "ice", "lava", "metal", "basalt"]
    for i, key in enumerate(order):
        path = made.get(key)
        if not path:
            continue
        im = Image.open(path).convert("RGB")
        idx = 16 + i
        x = (idx % COLS) * TILE
        y = (idx // COLS) * TILE
        atlas.paste(im, (x, y))
    atlas.save(PUBLIC / "atlas.png")
    print("atlas", atlas.size)

    for name, src in COPIES.items():
        if src.exists():
            im = Image.open(src).convert("RGB")
            im.save(PUBLIC / name, quality=88)
            print("copy", name)

    aeon = ART / "aeon-edit.jpg"
    # placeholder filled later if edit lands
    for cand in ART.glob("*.jpg"):
        pass
    nyx = PUBLIC / "portrait-nyx.jpg"
    if nyx.exists() and not (PUBLIC / "portrait-aeon.jpg").exists():
        Image.open(nyx).save(PUBLIC / "portrait-aeon.jpg", quality=88)

    # Prefer saga title if present
    saga = PUBLIC / "title-saga.jpg"
    if saga.exists():
        Image.open(saga).save(PUBLIC / "title.jpg", quality=88)


if __name__ == "__main__":
    main()
