#!/usr/bin/env python3
"""Compose 64px tiles + 4x4 atlas. Grass-side is dirt+sod, not a landscape."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageFilter

ROOT = Path("/workspace")
ART = ROOT / "artifacts" / "imagine_images"
TILES = ROOT / "assets" / "tiles"
PUBLIC = ROOT / "public" / "game"
QC = ROOT / "artifacts" / "tile_qc"
TILE = 64
BLEND = 10

SOURCES = {
    "grass_top": TILES / "grass_top.png",
    "dirt": ART / "9430f8db-823e-4cd3-99e2-c4410d0f8d12.jpg",
    "sod": ART / "abe3aec0-0e25-412a-87f6-503b3cc94358.jpg",
    "stone": TILES / "stone.png",
    "sand": TILES / "sand.png",
    "wood": TILES / "wood.png",
    "leaves": ART / "0d5f799a-fb8b-4a1e-bac1-ef11758070bb.jpg",
    "ki": ART / "bad5994e-0d2b-4c8a-96c1-c4528c838cd5.jpg",
    "bedrock": TILES / "bedrock.png",
    "water": ART / "37ece8fd-6637-41b9-ae56-97a965a38576.jpg",
    "moss": TILES / "moss.png",
    "temple": ART / "0bf9e053-b8d6-4c0c-b681-b10b47372410.jpg",
    "clay": TILES / "clay.png",
    "cloud": TILES / "cloud.png",
    "wood_top": ART / "52312f64-a70e-4838-9f61-792cb47b5275.jpg",
    "path": ART / "c4df7ab2-60a5-4b78-9101-06327dfb789a.jpg",
}

# Atlas order must match textures.ts TILE_* indices
ATLAS_KEYS = [
    "grass_top",
    "grass_side",
    "dirt",
    "stone",
    "sand",
    "wood",
    "leaves",
    "ki",
    "bedrock",
    "water",
    "moss",
    "temple",
    "clay",
    "cloud",
    "wood_top",
    "path",
]


def load_sq(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGB")
    w, h = im.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    im = im.crop((left, top, left + side, top + side))
    return im.resize((TILE, TILE), Image.Resampling.LANCZOS)


def wrap_blend(im: Image.Image, axis: str) -> Image.Image:
    """Offset-blend so opposite edges meet. axis: x, y, or xy."""
    out = im.copy()
    px = out.load()
    w, h = out.size
    if "x" in axis:
        off = ImageChops.offset(im, w // 2, 0)
        op = off.load()
        for y in range(h):
            for x in range(BLEND):
                t = x / BLEND
                a = px[x, y]
                b = op[x, y]
                px[x, y] = tuple(int(a[i] * t + b[i] * (1 - t)) for i in range(3))
                a2 = px[w - 1 - x, y]
                b2 = op[w - 1 - x, y]
                px[w - 1 - x, y] = tuple(int(a2[i] * t + b2[i] * (1 - t)) for i in range(3))
        # re-offset so the blend sits on the original seam
        out = ImageChops.offset(out, w // 2, 0)
        px = out.load()
    if "y" in axis:
        off = ImageChops.offset(out, 0, h // 2)
        op = off.load()
        px = out.load()
        for x in range(w):
            for y in range(BLEND):
                t = y / BLEND
                a = px[x, y]
                b = op[x, y]
                px[x, y] = tuple(int(a[i] * t + b[i] * (1 - t)) for i in range(3))
                a2 = px[x, h - 1 - y]
                b2 = op[x, h - 1 - y]
                px[x, h - 1 - y] = tuple(int(a2[i] * t + b2[i] * (1 - t)) for i in range(3))
        out = ImageChops.offset(out, 0, h // 2)
    return out


def make_grass_side(dirt: Image.Image, sod: Image.Image) -> Image.Image:
    """Cube SIDE: grass cap on top, dirt below. Never a landscape."""
    d = wrap_blend(dirt, "xy")
    s = wrap_blend(sod, "xy")
    out = Image.new("RGB", (TILE, TILE))
    dp = d.load()
    sp = s.load()
    op = out.load()
    cap = 15
    blend = 7
    for y in range(TILE):
        if y < cap - blend:
            t = 1.0
        elif y < cap:
            t = 1.0 - (y - (cap - blend)) / blend
        else:
            t = 0.0
        # slightly darker seam (roots)
        root = 0.82 if cap - 2 <= y <= cap + 1 else 1.0
        for x in range(TILE):
            g = sp[x, (y + 8) % TILE]
            e = dp[x, y]
            r = int((g[0] * t + e[0] * (1 - t)) * root)
            gg = int((g[1] * t + e[1] * (1 - t)) * root)
            b = int((g[2] * t + e[2] * (1 - t)) * root)
            op[x, y] = (min(255, r), min(255, gg), min(255, b))
    return wrap_blend(out, "x")


def two_by_two(im: Image.Image, dest: Path) -> None:
    canvas = Image.new("RGB", (TILE * 2, TILE * 2))
    for oy in (0, TILE):
        for ox in (0, TILE):
            canvas.paste(im, (ox, oy))
    canvas.save(dest)


def main() -> None:
    TILES.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    QC.mkdir(parents=True, exist_ok=True)

    dirt = load_sq(SOURCES["dirt"])
    sod = load_sq(SOURCES["sod"])
    finished: dict[str, Image.Image] = {}

    for key, path in SOURCES.items():
        if key == "sod":
            continue
        finished[key] = wrap_blend(load_sq(path), "xy")

    finished["grass_side"] = make_grass_side(dirt, sod)
    # wood_top: extra offset kills remaining bullseye
    finished["wood_top"] = wrap_blend(ImageChops.offset(finished["wood_top"], 20, 28), "xy")
    finished["ki"] = wrap_blend(ImageChops.offset(finished["ki"], 18, 22), "xy")
    # slightly punch ki saturation
    finished["ki"] = ImageEnhance.Color(finished["ki"]).enhance(1.15)

    for key, im in finished.items():
        dest = TILES / f"{key}.png"
        im.save(dest)
        two_by_two(im, QC / f"{key}_2x2.png")
        print(f"wrote {dest}")

    atlas = Image.new("RGB", (TILE * 4, TILE * 4), (20, 20, 20))
    for i, key in enumerate(ATLAS_KEYS):
        col, row = i % 4, i // 4
        atlas.paste(finished[key], (col * TILE, row * TILE))
    atlas = atlas.filter(ImageFilter.UnsharpMask(radius=0.6, percent=80, threshold=2))
    out = PUBLIC / "atlas.png"
    atlas.save(out, optimize=True)
    print(f"atlas {out} {atlas.size}")


if __name__ == "__main__":
    main()
