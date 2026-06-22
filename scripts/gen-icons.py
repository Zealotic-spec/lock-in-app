"""Generate Lock-in PWA icon set (neon-green padlock on black/green background).
Run: python3 scripts/gen-icons.py
Outputs to client/public/icons/.
"""
import math
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "client", "public", "icons")
os.makedirs(OUT, exist_ok=True)

ACCENT = (57, 255, 20, 255)
BLACK = (10, 10, 10, 255)


def draw_padlock(draw: ImageDraw.ImageDraw, cx, cy, scale, stroke_color, stroke_w):
    # body
    body_w = 56 * scale
    body_h = 40 * scale
    body_r = 10 * scale
    body_top = cy + 4 * scale
    draw.rounded_rectangle(
        [cx - body_w / 2, body_top, cx + body_w / 2, body_top + body_h],
        radius=body_r,
        outline=stroke_color,
        width=int(stroke_w),
    )
    # shackle (arc)
    shackle_w = 32 * scale
    shackle_top = cy - 28 * scale
    bbox = [cx - shackle_w / 2, shackle_top, cx + shackle_w / 2, body_top + 8 * scale]
    draw.arc(bbox, start=180, end=360, fill=stroke_color, width=int(stroke_w))
    # left/right verticals of shackle down to body
    draw.line(
        [cx - shackle_w / 2, (shackle_top + body_top + 8 * scale) / 2, cx - shackle_w / 2, body_top],
        fill=stroke_color,
        width=int(stroke_w),
    )
    draw.line(
        [cx + shackle_w / 2, (shackle_top + body_top + 8 * scale) / 2, cx + shackle_w / 2, body_top],
        fill=stroke_color,
        width=int(stroke_w),
    )
    # keyhole dot
    dot_r = 4.2 * scale
    dot_cy = body_top + body_h * 0.52
    draw.ellipse([cx - dot_r, dot_cy - dot_r, cx + dot_r, dot_cy + dot_r], fill=stroke_color)


def make_icon(size: int, maskable: bool, path: str):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = size * (0.18 if maskable else 0.08)
    radius = size * 0.22
    draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=radius, fill=ACCENT)

    scale = (size - pad * 2) / 110
    draw_padlock(draw, size / 2, size / 2, scale, BLACK, max(2, size * 0.022))

    img.save(path)


def make_apple_touch(size: int, path: str):
    # Apple touch icons should be fully opaque (no alpha) with the brand bg.
    img = Image.new("RGB", (size, size), (10, 10, 10))
    draw = ImageDraw.Draw(img)
    pad = size * 0.14
    radius = size * 0.22
    draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=radius, fill=ACCENT[:3])
    scale = (size - pad * 2) / 110
    draw_padlock(draw, size / 2, size / 2, scale, BLACK[:3], max(2, size * 0.022))
    img.save(path)


make_icon(192, maskable=False, path=os.path.join(OUT, "icon-192.png"))
make_icon(512, maskable=False, path=os.path.join(OUT, "icon-512.png"))
make_icon(512, maskable=True, path=os.path.join(OUT, "icon-maskable-512.png"))
make_apple_touch(180, os.path.join(OUT, "icon-apple-touch.png"))

print("Generated icons in", OUT)
