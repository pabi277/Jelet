#!/usr/bin/env python3
"""
make_pwa_icons.py — Generate JELET Study Hub PWA icons (pure stdlib PNG writer).

Produces assets/icons/pwa-192.png and assets/icons/pwa-512.png:
a rounded-square brand-teal tile with a white "J" monogram.
No third-party deps (zlib only) so it runs in any minimal environment.
Anti-aliasing via 4x supersampling.
"""

import math
import os
import struct
import zlib

BG = (15, 110, 102)     # --brand-primary (light theme token)
BG_HI = (40, 140, 130)  # top-left lighten
FG = (255, 255, 255)
TINT = (224, 242, 240)  # --brand-tint inner ring

SS = 4  # supersample factor


def _blend(base, target, f):
    f = max(0.0, min(1.0, f))
    return [int(round(base[i] + (target[i] - base[i]) * f)) for i in range(3)]


def write_png(path, size, pixels):
    """pixels: list of rows, each row a list of (r,g,b,a) tuples."""
    raw = bytearray()
    for row in pixels:
        raw.append(0)  # filter type 0 (None) per scanline
        for r, g, b, a in row:
            raw += bytes((r, g, b, a))
    compressed = zlib.compress(bytes(raw), 9)

    chunks = b""

    def chunk(tag, data):
        out = struct.pack(">I", len(data)) + tag + data
        out += struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        return out

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", compressed)
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as fh:
        fh.write(png)


def point_in_rounded_rect(x, y, w, h, r):
    if x < r and y < r:
        return (r - x) ** 2 + (r - y) ** 2 <= r * r
    if x > w - r and y < r:
        return (x - (w - r)) ** 2 + (r - y) ** 2 <= r * r
    if x < r and y > h - r:
        return (r - x) ** 2 + (y - (h - r)) ** 2 <= r * r
    if x > w - r and y > h - r:
        return (x - (w - r)) ** 2 + (y - (h - r)) ** 2 <= r * r
    return 0 <= x <= w and 0 <= y <= h


def j_is_stroke(px, py, size):
    """
    White "J" glyph coverage test for a supersampled point (px, py) in a
    size x size tile. Geometry in normalized 0..1 coordinates:

      - stem:  vertical bar near the left of the glyph box
      - hook:  a semicircular arc joining the stem bottom, sweeping left
      - foot:  a small horizontal base bar closing the hook
    """
    s = size
    # Glyph bounding box (normalized)
    gx0, gx1 = 0.24, 0.76
    gy0, gy1 = 0.20, 0.82
    stem_w = 0.115 * (gx1 - gx0) * s
    stroke = 0.085 * (gx1 - gx0) * s

    stem_cx = gx0 * s + stem_w / 2
    stem_top = gy0 * s
    stem_bot = gy1 * s

    # 1) Stem rectangle
    if stem_cx - stem_w / 2 <= px <= stem_cx + stem_w / 2 and stem_top <= py <= stem_bot:
        return True

    # 2) Hook arc: center at stem's left edge, just above the bottom.
    #    Arc sweeps from straight-down to left, radius = hook width.
    arc_cx = stem_cx - stem_w / 2
    arc_cy = stem_bot - stem_w / 2
    arc_r = (gx1 - gx0) * 0.42 * s
    dx, dy = px - arc_cx, py - arc_cy
    dist = math.hypot(dx, dy)
    if dist <= arc_r + stroke:
        angle = math.atan2(dy, dx)  # -pi..pi, 0 = +x axis
        # Accept the arc sweep: from pointing down (angle = -90deg) around
        # through left (180deg) up to slightly above horizontal-left.
        # atan2 range for that sweep: [-90deg, 180deg]
        lo, hi = math.radians(-90.0), math.radians(180.0)
        if lo <= angle <= hi and abs(dist - arc_r) <= stroke:
            return True

    # 3) Foot bar: horizontal cap closing the bottom-left of the hook
    foot_y0 = arc_cy - stroke / 2
    foot_y1 = arc_cy + stroke / 2
    foot_x0 = arc_cx - arc_r - stroke / 2
    foot_x1 = arc_cx + stroke / 2
    if foot_x0 <= px <= foot_x1 and foot_y0 <= py <= foot_y1:
        return True

    return False


def render(size):
    # Supersampled coverage buffer (RGBA float accumulation)
    w = size * SS
    buf = [[[0.0, 0.0, 0.0, 0.0] for _ in range(w)] for _ in range(w)]
    rad = size * 0.22

    for y in range(w):
        for x in range(w):
            px = x / SS
            py = y / SS
            if not point_in_rounded_rect(px, py, size, size, rad):
                continue
            r, g, b = BG
            # Subtle top-left lighten
            t = 1.0 - min(1.0, math.hypot(px - size * 0.30, py - size * 0.24) / (size * 0.95))
            r, g, b = _blend(BG, BG_HI, 0.10 * t)

            if j_is_stroke(x / SS, y / SS, size):
                r, g, b = FG

            # Inner tint ring near the tile edge
            d_edge = min(px, py, size - 1 - px, size - 1 - py)
            ring_w = size * 0.055
            if d_edge > rad - ring_w:
                f = max(0.0, min(1.0, (d_edge - (rad - ring_w)) / ring_w))
                r, g, b = _blend((r, g, b), TINT, f * 0.55)

            buf[y][x] = [r, g, b, 255]

    # Downscale by averaging SS x SS blocks
    out = []
    for oy in range(size):
        row = []
        for ox in range(size):
            tr = tg = tb = ta = 0
            for dy in range(SS):
                for dx in range(SS):
                    p = buf[oy * SS + dy][ox * SS + dx]
                    tr += p[0]
                    tg += p[1]
                    tb += p[2]
                    ta += p[3]
            n = SS * SS
            row.append((
                round(tr / n),
                round(tg / n),
                round(tb / n),
                round(ta / n),
            ))
        out.append(row)
    return out


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.normpath(os.path.join(here, "..", "assets", "icons"))
    os.makedirs(out_dir, exist_ok=True)

    for size, name in ((192, "pwa-192.png"), (512, "pwa-512.png")):
        pixels = render(size)
        path = os.path.join(out_dir, name)
        write_png(path, size, pixels)
        print(f"wrote {path} ({size}x{size})")


if __name__ == "__main__":
    main()
