#!/usr/bin/env python3
"""Generate vector SVG figures for all figureKeys referenced in the 2024 & 2025 question banks.
Each figure is a clean, schematic SVG matching the question's content."""
import os

def svg_wrap(w, h, body, title=""):
    """Wrap SVG body in a complete SVG element.

    All colours are semantic CSS custom properties (``var(--fig-*)``) defined in
    ``assets/css/tokens.css`` for both Light (white) and AMOLED Dark (near-black)
    themes, so figures must be inlined into the document (not loaded via <img>)
    to inherit the active theme.
    """
    title_xml = f'  <text x="15" y="20" font-family="monospace" font-size="11" fill="var(--fig-axis)">{title}</text>\n' if title else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}">
  <rect x="0" y="0" width="{w}" height="{h}" fill="transparent"/>
{title_xml}{body}</svg>'''

def line(x1, y1, x2, y2, stroke="var(--fig-line)", sw=1.5, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"{d}/>\n'

def arrow(x1, y1, x2, y2, stroke="var(--fig-primary)", sw=1.8, label=None, label_pos=None):
    body = f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"/>\n'
    # arrowhead
    import math
    ang = math.atan2(y2-y1, x2-x1)
    ah = 8
    a1 = ang + math.radians(150)
    a2 = ang - math.radians(150)
    body += f'  <polygon points="{x2},{y2} {x2+ah*math.cos(a1):.1f},{y2+ah*math.sin(a1):.1f} {x2+ah*math.cos(a2):.1f},{y2+ah*math.sin(a2):.1f}" fill="{stroke}"/>\n'
    if label and label_pos:
        body += f'  <text x="{label_pos[0]}" y="{label_pos[1]}" font-family="monospace" font-size="12" fill="var(--fig-text)">{label}</text>\n'
    return body

def circle(cx, cy, r, stroke="var(--fig-primary)", sw=1.5, fill="none"):
    return f'  <circle cx="{cx}" cy="{cy}" r="{r}" stroke="{stroke}" stroke-width="{sw}" fill="{fill}"/>\n'

def label(x, y, text, size=11, color="var(--fig-text)", anchor="start"):
    return f'  <text x="{x}" y="{y}" font-family="monospace" font-size="{size}" fill="{color}" text-anchor="{anchor}">{text}</text>\n'

def path(d, stroke="var(--fig-primary)", sw=1.5, fill="none"):
    return f'  <path d="{d}" stroke="{stroke}" stroke-width="{sw}" fill="{fill}"/>\n'

def polyline(points, stroke="var(--fig-primary)", sw=1.5, fill="none"):
    return f'  <polyline points="{points}" stroke="{stroke}" stroke-width="{sw}" fill="{fill}"/>\n'

def dot(cx, cy, r=3, fill="var(--fig-node)"):
    return f'  <circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"/>\n'

# ---- 2024 figures ----
# ---------------------------------------------------------------------------
# JELET 2024 Batch B (Physics Q41–Q70): faithful redraws of the Set-A booklet figures
# (PDF pages 11–18, read at 180 DPI with 300-DPI crops).  Curves are dense polylines from
# explicit formulas and key elements carry data-role attributes, so that
# scripts/verify_solutions_sympy.py can read the geometry back (slopes, extrema, angles,
# intercepts, areas).  Colours: var(--fig-*) tokens only.
# ---------------------------------------------------------------------------
import math as _m

def _p24_role(svg_el, role):
    """Attach a data-role attribute to the first element of an SVG snippet."""
    i = svg_el.index("<") + 1
    j = svg_el.index(" ", i)
    return svg_el[:j] + f' data-role="{role}"' + svg_el[j:]

def _p24_poly(pts, role, stroke="var(--fig-primary)", sw=1.6):
    return _p24_role(polyline(_fmt(pts), stroke=stroke, sw=sw), role)

def _p24_sub(x, y, base, sub, size=12, italic=True, anchor="start"):
    """Base letter with a subscript (booklet style, e.g. V_o, v_x)."""
    style = ' font-style="italic"' if italic else ""
    return (f'  <text x="{x}" y="{y}" font-family="Times New Roman, serif" font-size="{size}"{style} fill="var(--fig-text)" text-anchor="{anchor}">'
            f'{base}<tspan dy="3" font-size="{int(size*0.72)}">{sub}</tspan></text>\n')

def _p24_hatched_rect(x, y, w, h, gap=5, role=None):
    """Rectangle with '/' hatching (booklet block style); hatch lines clipped analytically to the box."""
    body = f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="var(--fig-line)" stroke-width="1.4"{f" data-role={chr(34)}{role}{chr(34)}" if role else ""}/>\n'
    c = gap
    while c < w + h:
        # line u + v = c in box-local coords (u right, v down from the top-left corner)
        p0 = (max(0, c - h), min(h, c)); p1 = (min(w, c), max(0, c - w))
        if p0 != p1:
            # v measured downwards from the top edge: u + v = c then leans '/' as printed
            body += line(round(x + p0[0], 1), round(y + p0[1], 1), round(x + p1[0], 1), round(y + p1[1], 1), stroke="var(--fig-line)", sw=0.8)
        c += gap
    return body

def _p24_radical(x, y, num, den, size=10):
    """Booklet-style  √(num/den)  label: radical sign, vinculum and a stacked fraction (x = left edge)."""
    wd = 6 + 6*max(len(num), len(den))
    body = path(f"M {x},{y-6} L {x+3},{y-8} L {x+6},{y+6} L {x+9},{y-16} L {x+9+wd},{y-16}", stroke="var(--fig-text)", sw=0.9)
    body += mlabel(x + 9 + wd/2, y - 7, num, size)
    body += line(x + 11, y - 4, x + 7 + wd, y - 4, stroke="var(--fig-text)", sw=0.8)
    body += mlabel(x + 9 + wd/2, y + 6, den, size)
    return body

def _p24_arc(cx, cy, r, a0, a1, role=None, sw=1.1):
    """Circular arc (screen angles in degrees, measured clockwise from +x) from a0 to a1, sweep clockwise."""
    x0, y0 = cx + r*_m.cos(_m.radians(a0)), cy + r*_m.sin(_m.radians(a0))
    x1, y1 = cx + r*_m.cos(_m.radians(a1)), cy + r*_m.sin(_m.radians(a1))
    large = 1 if (a1 - a0) % 360 > 180 else 0
    el = path(f"M {x0:.1f},{y0:.1f} A {r},{r} 0 {large} 1 {x1:.1f},{y1:.1f}", stroke="var(--fig-line)", sw=sw)
    return _p24_role(el, role) if role else el

# ---- Q42: projectile stem + four paired (v_x–t, v_y–t) option graphs --------------
Q42_STEM = dict(ox=40, oy=140, rng=170, h=90)

def fig_2024_q42():
    o = Q42_STEM
    body = axes_xy(o["ox"], o["oy"], o["ox"], 250, o["oy"], 10)
    body += mlabel(o["ox"] - 6, 14, "y", 13, italic=True) + mlabel(258, o["oy"] + 4, "x", 13, italic=True)
    path_pts = [(o["ox"] + o["rng"]*s, o["oy"] - 4*o["h"]*s*(1 - s)) for s in (k/40 for k in range(41))]
    body += _p24_poly(path_pts, "trajectory", stroke="var(--fig-line)", sw=1.4)
    slope = 4*o["h"]/o["rng"]                                   # launch direction = tangent of the path at O
    L = 78; ux, uy = L/_m.hypot(1, slope), L*slope/_m.hypot(1, slope)
    body += _p24_role(arrow(o["ox"], o["oy"], round(o["ox"] + ux, 1), round(o["oy"] - uy, 1), stroke="var(--fig-line)", sw=1.3), "u")
    body += mlabel(round(o["ox"] + ux + 4, 1), round(o["oy"] - uy - 2, 1), "u", 13, anchor="start")
    th = _m.degrees(_m.atan(slope))
    body += _p24_arc(o["ox"], o["oy"], 16, -th, 0, role="theta")
    body += mlabel(o["ox"] + 27, o["oy"] - 8, "θ", 12)
    return svg_plain(270, 155, body, "2024 Q42: " + "projectile launched from the origin with speed u at angle θ to the x-axis, following a parabolic path back to the x-axis")

_p24_Q42P = dict(w=112, h=60, oy=78, ox=(34, 184))

def _p24_q42_panel(k, comp, shape):
    """One speed–time panel. shape: 'const' | 'V' | 'tri' (booklet proportions)."""
    o = _p24_Q42P; ox, oy, w, h = o["ox"][k], o["oy"], o["w"], o["h"]
    body = axes_xy(ox, oy, ox, ox + w + 12, oy, oy - h - 8)
    body += _p24_sub(ox - 22, oy - h - 2, "v", comp, 12) + mlabel(ox + w + 20, oy + 4, "t", 12)
    if shape == "const":
        pts = [(ox, oy - 0.62*h), (ox + 0.82*w, oy - 0.62*h)]
    elif shape == "V":
        pts = [(ox, oy - 0.88*h), (ox + 0.38*w, oy), (ox + 0.88*w, oy - 0.72*h)]
    else:
        pts = [(ox, oy), (ox + 0.50*w, oy - 0.78*h), (ox + 0.98*w, oy)]
    return _p24_poly(pts, f"{comp}-t", stroke="var(--fig-primary)", sw=1.5)  + body

def _p24_q42_opt(sx, sy, aria):
    return svg_plain(320, 90, _p24_q42_panel(0, "x", sx) + _p24_q42_panel(1, "y", sy), aria)

def fig_2024_q42_optA():
    return _p24_q42_opt("const", "V", "Graph (A): v_x–t horizontal line; v_y–t falls linearly to zero then rises linearly")
def fig_2024_q42_optB():
    return _p24_q42_opt("V", "const", "Graph (B): v_x–t falls linearly to zero then rises linearly; v_y–t horizontal line")
def fig_2024_q42_optC():
    return _p24_q42_opt("const", "tri", "Graph (C): v_x–t horizontal line; v_y–t rises linearly from zero to a peak and falls back to zero")
def fig_2024_q42_optD():
    return _p24_q42_opt("tri", "const", "Graph (D): v_x–t rises linearly from zero to a peak and falls back to zero; v_y–t horizontal line")

# ---- Q43: refraction from medium 1 (below) into medium 2 (above) ---------------------
Q43_GEOM = dict(ox=80, oy=82, a1=35.0, a2=54.0)       # angles of incidence / refraction from the NORMAL, as drawn

def fig_2024_q43():
    g = Q43_GEOM; ox, oy = g["ox"], g["oy"]
    body = _p24_role(line(ox, 8, ox, 160, stroke="var(--fig-line)", sw=1.3), "normal")
    body += _p24_role(line(15, oy, 180, oy, stroke="var(--fig-line)", sw=1.3), "interface")
    a1, a2 = _m.radians(g["a1"]), _m.radians(g["a2"])
    sx, sy = ox - 82*_m.sin(a1), oy + 82*_m.cos(a1)                  # incident ray comes up from the lower left
    ex, ey = ox + 120*_m.sin(a2), oy - 120*_m.cos(a2)                # refracted ray leaves to the upper right
    body += _p24_role(line(round(sx, 1), round(sy, 1), ox, oy, stroke="var(--fig-line)", sw=1.3), "incident")
    body += _arrowhead(round(sx + 0.25*(ox - sx), 1), round(sy + 0.25*(oy - sy), 1), _m.degrees(_m.atan2(oy - sy, ox - sx)), 6)
    body += _p24_role(line(ox, oy, round(ex, 1), round(ey, 1), stroke="var(--fig-line)", sw=1.3), "refracted")
    body += _arrowhead(round(ox + 0.8*(ex - ox), 1), round(oy + 0.8*(ey - oy), 1), _m.degrees(_m.atan2(ey - oy, ex - ox)), 6)
    # α1: between the downward normal (screen angle 90°) and the incident ray (screen angle 90° + a1)
    body += _p24_arc(ox, oy, 22, 90, 90 + g["a1"], role="alpha1")
    # α2: between the upward normal (screen angle 270°) and the refracted ray (screen angle 270° + a2)
    body += _p24_arc(ox, oy, 22, 270, 270 + g["a2"], role="alpha2")
    body += _p24_sub(54, 128, "α", "1", 13, italic=False) + _p24_sub(84, 46, "α", "2", 13, italic=False)
    body += mlabel(178, 18, "2", 13) + mlabel(150, 150, "1", 13)
    return svg_plain(200, 165, body, "2024 Q43: " + "refraction; ray from medium 1 below at angle α1 to the normal, refracted into medium 2 above at a larger angle α2 to the normal")

# ---- Q45: circle, centre C, point O on the circle, particle at angle θ -------------------
Q45_GEOM = dict(cx=120, cy=95, r=70, th=60.0)

def fig_2024_q45():
    g = Q45_GEOM; cx, cy, r = g["cx"], g["cy"], g["r"]; th = _m.radians(g["th"])
    body = _p24_role(circle(cx, cy, r, stroke="var(--fig-line)", sw=1.4), "orbit")
    body += _p24_role(line(cx - r - 26, cy, cx + r + 22, cy, stroke="var(--fig-line)", sw=1.2, dash="7,5"), "diameter")
    body += dot(cx, cy, 3)
    px, py = cx + r*_m.cos(th), cy - r*_m.sin(th)
    body += _p24_role(line(cx, cy, round(px, 1), round(py, 1), stroke="var(--fig-line)", sw=1.3), "radius")
    tx, ty = px - 36*_m.sin(th), py - 36*_m.cos(th)              # tangent, counter-clockwise sense
    body += _p24_role(arrow(round(px, 1), round(py, 1), round(tx, 1), round(ty, 1), stroke="var(--fig-line)", sw=1.3), "velocity")
    body += mlabel(round(px + 9, 1), round(py - 4, 1), "v", 13, italic=True)
    body += _p24_arc(cx, cy, 16, -g["th"], 0, role="theta") + mlabel(cx + 25, cy - 9, "θ", 12)
    body += mlabel(cx - r - 10, cy + 18, "O", 13) + mlabel(cx, cy + 20, "C", 13)
    return svg_plain(240, 175, body, "2024 Q45: " + "particle on a circle of centre C; O is the left end of the horizontal diameter; the radius to the particle makes angle θ with the diameter and v is tangent")

# ---- Q46: a–t graph, straight line from 10 m/s² at t = 0 to 0 at t = 25 s ------------------
Q46_AXES = dict(ox=62, oy=118, t25=172, a10=38)

def fig_2024_q46():
    g = Q46_AXES
    body = arrow(40, g["oy"], 245, g["oy"], stroke="var(--fig-axis)", sw=1.2)
    body += arrow(g["ox"], 130, g["ox"], 12, stroke="var(--fig-axis)", sw=1.2)
    body += _p24_poly([(g["ox"], g["a10"]), (g["t25"], g["oy"])], "a-t", stroke="var(--fig-primary)", sw=1.5)
    body += _p24_role(mlabel(g["ox"] - 14, g["a10"] + 4, "10", 12), "tick-a")
    body += _p24_role(mlabel(g["t25"], g["oy"] + 16, "25", 12), "tick-t")
    body += mlabel(g["ox"] + 10, 20, "a (ms⁻²)", 12, anchor="start") + mlabel(249, g["oy"] + 4, "t(s)", 12, anchor="start")
    return svg_plain(280, 140, body, "2024 Q46: " + "acceleration a (ms⁻²) versus t (s); a straight line from a = 10 at t = 0 down to a = 0 at t = 25")

# ---- Q49: composite rod, l with k then 2l with 2k ----------------------------------
def fig_2024_q49():
    body = f'  <rect x="50" y="30" width="72" height="36" fill="none" stroke="var(--fig-line)" stroke-width="1.4"/>\n'
    body += f'  <rect x="122" y="30" width="72" height="36" fill="none" stroke="var(--fig-line)" stroke-width="1.4"/>\n'
    body += mlabel(86, 22, "l", 13, italic=True) + mlabel(151, 22, "2<tspan font-style=\"italic\">l</tspan>", 13, anchor="start")
    body += mlabel(86, 53, "k", 13) + mlabel(158, 53, "2k", 13)
    body += _p24_sub(24, 53, "t", "1", 13, italic=False) + _p24_sub(200, 53, "t", "2", 13, italic=False)
    return svg_plain(230, 80, body, "2024 Q49: " + "composite rod; left part length l, conductivity k; right part length 2l, conductivity 2k; ends at t1 (left) and t2 (right)")

# ---- Q52: equiconvex lens cut into quarters, re-arranged side by side --------------------
Q52 = dict(cx=60, top=15, bot=165, half_w=30, base=95, x0=250, piece_w=30)

def fig_2024_q52():
    g = Q52; cx, top, bot, hw = g["cx"], g["top"], g["bot"], g["half_w"]
    half_h = (bot - top)/2; R = (half_h**2 + hw**2)/(2*hw)            # lens-face radius through the vertex and the rim
    body = _p24_role(path(f"M {cx},{top} A {R:.2f},{R:.2f} 0 0 0 {cx},{bot} A {R:.2f},{R:.2f} 0 0 0 {cx},{top} Z", stroke="var(--fig-line)", sw=1.4), "lens")
    body += line(cx, top, cx, bot, stroke="var(--fig-line)", sw=1.2) + line(cx - hw, (top + bot)/2, cx + hw, (top + bot)/2, stroke="var(--fig-line)", sw=1.2)
    for t, (x, y) in zip("ABCD", [(cx - 13, 82), (cx + 13, 82), (cx - 13, 112), (cx + 13, 112)]):
        body += mlabel(x, y, t, 13)
    body += arrow(110, g["base"], 232, g["base"], stroke="var(--fig-line)", sw=1.2) + mlabel(171, g["base"] - 8, "Rearrangement", 12)
    body += line(g["x0"] - 8, g["base"], g["x0"] + 4*g["piece_w"] + 24, g["base"], stroke="var(--fig-line)", sw=1.4)
    for k, t in enumerate("ABCD"):
        x = g["x0"] + k*g["piece_w"]
        # quarter piece: flat horizontal cut on the line, flat vertical cut on the right, curved face on the left
        body += _p24_role(path(f"M {x},{g['base']} A {R:.2f},{R:.2f} 0 0 1 {x + hw},{g['base'] - half_h:.1f} L {x + hw},{g['base']}", stroke="var(--fig-line)", sw=1.4), f"piece-{t}")
        body += mlabel(x + hw/2 + 3, g["base"] - 10, t, 13)
    return svg_plain(400, 180, body, "2024 Q52: " + "equiconvex lens cut into quarters A, B, C, D; after rearrangement the four quarter pieces stand side by side on a line, each with one curved face")

# ---- Q54: pulley with blocks 5 kg + 10 kg (left) and 10 kg + 5 kg (right) -----------------
Q54_BLOCKS = [  # (x, y, w, h, label, label_xy)
    (50, 140, 33, 22, "5 kg", (22, 156)),
    (52, 192, 33, 24, "10 kg", (19, 209)),
    (99, 112, 33, 24, "10 kg", (161, 128)),
    (101, 166, 33, 22, "5 kg", (158, 181)),
]

def fig_2024_q54():
    body = line(64, 12, 112, 12, stroke="var(--fig-line)", sw=1.4)
    for k in range(7):
        body += line(66 + 7*k, 12, 72 + 7*k, 5, stroke="var(--fig-line)", sw=0.9)
    body += line(88, 12, 88, 32, stroke="var(--fig-line)", sw=1.3)
    body += _p24_role(circle(88, 54, 22, stroke="var(--fig-line)", sw=1.4), "pulley")
    body += line(66, 54, 66, 140, stroke="var(--fig-line)", sw=1.3) + line(110, 54, 110, 112, stroke="var(--fig-line)", sw=1.3)
    body += line(68, 162, 68, 192, stroke="var(--fig-line)", sw=1.3) + line(117, 136, 117, 166, stroke="var(--fig-line)", sw=1.3)
    for (x, y, w, h, lab, (lx, ly)) in Q54_BLOCKS:
        body += _p24_hatched_rect(x, y, w, h, role="block")
        body += _p24_role(mlabel(lx, ly, lab, 13), "mass")
    body += _arrowhead(66, 92, -90, 6) + _p24_sub(40, 98, "T", "1", 13, italic=False)
    body += _arrowhead(110, 92, -90, 6) + _p24_sub(115, 98, "T", "1", 13, italic=False)
    body += _arrowhead(68, 177, -90, 6) + _p24_sub(42, 183, "T", "2", 13, italic=False)
    body += _arrowhead(117, 151, -90, 6) + _p24_sub(122, 157, "T", "3", 13, italic=False)
    return svg_plain(200, 225, body, "2024 Q54: " + "pulley; left string T1 holds 5 kg with 10 kg below on T2; right string T1 holds 10 kg with 5 kg below on T3")

# ---- Q55: stopping potential V_o versus frequency ν ---------------------------------
Q55_PTS = dict(O=(60, 95), A=(61, 129), B=(103, 95))

def fig_2024_q55():
    O, A, B = Q55_PTS["O"], Q55_PTS["A"], Q55_PTS["B"]
    C = (round(B[0] + 1.75*(B[0] - A[0]), 1), round(B[1] + 1.75*(B[1] - A[1]), 1))
    body = arrow(61, 150, 59, 10, stroke="var(--fig-axis)", sw=1.2)
    body += arrow(O[0], O[1], 270, O[1] - 2, stroke="var(--fig-axis)", sw=1.2)
    body += _p24_poly([A, B, C], "line-AC", stroke="var(--fig-primary)", sw=1.5)
    body += _p24_sub(36, 16, "V", "o", 13, italic=False) + mlabel(252, O[1] + 18, "ν", 13, italic=True)
    body += _p24_role(mlabel(O[0] - 12, O[1] + 4, "O", 13), "label-O") + _p24_role(mlabel(A[0] - 12, A[1] + 6, "A", 13), "label-A")
    body += _p24_role(mlabel(B[0] + 2, B[1] + 18, "B", 13), "label-B") + _p24_role(mlabel(C[0] + 10, C[1] - 2, "C", 13), "label-C")
    return svg_plain(285, 155, body, "2024 Q55: " + "stopping potential V_o versus frequency ν; straight line from A on the V_o-axis below O, through B on the ν-axis, up to C")

# ---- Q57: V(x) with a high maximum, a minimum and a lower maximum ------------------------
Q57_KNOTS = [(64, 96), (90, 38), (134, 114), (166, 70), (182, 106)]   # start, max, min, max, end

def _p24_q57_curve():
    k = Q57_KNOTS; segs = []
    for i in range(4):
        (x0, y0), (x1, y1) = k[i], k[i + 1]
        d = (x1 - x0)/3
        s0 = 0 if i > 0 else -2.4*d          # extrema have horizontal tangents; the end-points are steep
        s1 = 0 if i < 3 else 1.8*d
        segs.append(("C", (x0, y0), (x0 + d, y0 + s0), (x1 - d, y1 - s1), (x1, y1)))
    out = []
    for i, seg in enumerate(segs):
        f = _bez(*seg[1:]); pts = [f(j/30) for j in range(31)]
        out += pts[1:] if out else pts
    return out

def fig_2024_q57():
    body = axes_xy(40, 132, 40, 290, 132, 10)
    body += mlabel(8, 18, "V(<tspan font-style=\"italic\">x</tspan>)", 13, anchor="start") + mlabel(296, 136, "x", 13, italic=True)
    body += _p24_poly(_p24_q57_curve(), "V-x", stroke="var(--fig-primary)", sw=1.6)
    return svg_plain(305, 145, body, "2024 Q57: " + "potential energy V(x) versus x; the curve rises to a high maximum, falls to a minimum, rises to a lower maximum and falls again")

# ---- Q61: four V, K versus t option graphs ------------------------------------------
_p24_Q61 = dict(ox=48, oy=100, top=30, T=128)

def _p24_q61_frame(v_f, k_f, labels, num, aria):
    o = _p24_Q61; w = o["T"] - o["ox"]; hh = o["oy"] - o["top"]
    body = axes_xy(o["ox"], o["oy"], o["ox"], o["T"] + 30, o["oy"], 6)
    body += line(o["ox"], o["top"], o["T"], o["top"], stroke="var(--fig-line)", sw=1.1, dash="4,3")
    body += line(o["T"], o["top"], o["T"], o["oy"], stroke="var(--fig-line)", sw=1.1, dash="4,3")
    body += mlabel(o["ox"] - 22, o["top"] + 4, "mgH", 12) + mlabel(o["T"] + 38, o["oy"] + 4, "t", 12)
    body += _p24_role(_p24_radical(o["T"] - 14, o["oy"] + 22, num, "g"), "t-end")
    pv = [(o["ox"] + w*s, o["oy"] - hh*v_f(s)) for s in (j/32 for j in range(33))]
    pk = [(o["ox"] + w*s, o["oy"] - hh*k_f(s)) for s in (j/32 for j in range(33))]
    body += _p24_poly(pv, "V", sw=1.4) + _p24_poly(pk, "K", sw=1.4)
    if labels:
        body += mlabel(o["ox"] + 26, o["top"] + 24, "V", 13) + mlabel(o["ox"] + 46, o["oy"] - 10, "K", 13)
    return svg_plain(190, 130, body, aria)

def fig_2024_q61_optA():
    return _p24_q61_frame(lambda s: 1 - s*s, lambda s: s*s, True, "2h",
                      "Graph (A): V falls from mgH, flat at first then steeper (concave down), to zero at t = sqrt(2h/g); K rises from zero, flat at first then steeper (concave up), to mgH")
def fig_2024_q61_optB():
    return _p24_q61_frame(lambda s: 1 - s*s, lambda s: 1 - (1 - s)**2, True, "2h",
                      "Graph (B): V falls from mgH along a concave-down curve to zero at t = sqrt(2h/g); K rises steeply from zero and flattens (concave down) to mgH")
def fig_2024_q61_optC():
    return _p24_q61_frame(lambda s: (1 - s)**2, lambda s: s*s, False, "2h",
                      "Graph (C): V falls steeply from mgH and flattens (concave up) to zero at t = sqrt(2h/g); K rises along a concave-up curve to mgH")
def fig_2024_q61_optD():
    return _p24_q61_frame(lambda s: 1 - s*s, lambda s: s*s, False, "h",
                      "Graph (D): V falls from mgH along a concave-down curve and K rises along a concave-up curve, both ending at t = sqrt(h/g)")

# ---- Q65: parabolic potential well with its vertex V_o on the V-axis ------------------------
Q65 = dict(axis_x=110, base_y=122, vertex_y=100, top_y=10, half_w=62)

def fig_2024_q65():
    g = Q65; a = (g["vertex_y"] - g["top_y"])/g["half_w"]**2
    body = line(20, g["base_y"], 228, g["base_y"], stroke="var(--fig-axis)", sw=1.2)
    body += line(g["axis_x"], g["base_y"], g["axis_x"], 6, stroke="var(--fig-axis)", sw=1.2)
    pts = [(g["axis_x"] + dx, g["vertex_y"] - a*dx*dx) for dx in (g["half_w"]*(j/24 - 1)*1 for j in range(49))]
    body += _p24_poly(pts, "V-x", stroke="var(--fig-primary)", sw=1.6)
    body += mlabel(g["axis_x"] + 10, 16, "V", 13, italic=True) + mlabel(236, g["base_y"] + 4, "x", 13, italic=True)
    body += _p24_sub(g["axis_x"] + 3, g["vertex_y"] + 15, "V", "o", 12)
    return svg_plain(250, 135, body, "2024 Q65: " + "potential energy V versus x; an upward parabola symmetric about the V-axis with its minimum V_o on that axis above the x-axis")

# ---- Q66: four V–x option graphs (no stem figure) --------------------------------------
_p24_Q66P = dict(ox=34, oy=86, xr=180, v0=26)

def _p24_q66_frame(fn, xmax, aria, x_lab_under=False):
    o = _p24_Q66P; h = o["oy"] - o["v0"]
    body = line(o["ox"], o["oy"], o["xr"], o["oy"], stroke="var(--fig-axis)", sw=1.2)
    body += line(o["ox"], o["oy"], o["ox"], 8, stroke="var(--fig-axis)", sw=1.2)
    body += mlabel(o["ox"] - 6, 14, "V", 12) + _p24_sub(o["ox"] - 22, o["v0"] + 4, "V", "o", 11, italic=False)
    body += mlabel(o["xr"] - 26, o["oy"] + 16, "x", 12, italic=True) if x_lab_under else mlabel(o["xr"] + 8, o["oy"] + 4, "x", 12, italic=True)
    pts = [(o["ox"] + xmax*s, o["oy"] - h*fn(xmax*s)) for s in (j/60 for j in range(61))]
    return svg_plain(200, 112, body + _p24_poly(pts, "V-x", sw=1.5), aria)

def fig_2024_q66_optA():
    return _p24_q66_frame(lambda x: _m.exp(-x/42), 140, "Graph (A): V decreases from V_o along a curve that flattens out, approaching the x-axis without reaching it")
def fig_2024_q66_optB():
    return _p24_q66_frame(lambda x: 1 - x/115, 115, "Graph (B): V decreases along a straight line from V_o to zero at a finite x")
def fig_2024_q66_optC():
    return _p24_q66_frame(lambda x: _m.exp(-x/18), 140, "Graph (C): V falls very steeply from V_o and then flattens along the x-axis", x_lab_under=True)
def fig_2024_q66_optD():
    return _p24_q66_frame(lambda x: _m.exp(-x/38)*_m.cos(2*_m.pi*x/88), 140, "Graph (D): V falls from V_o, crosses the x-axis and oscillates about it with decreasing amplitude", x_lab_under=True)

# ---- Q67: vertical plate in perspective with a 1 kg block; acceleration a to the left -----------
def fig_2024_q67():
    P1, P2, P3, P4 = (40, 22), (176, 74), (176, 178), (42, 126)       # front face (parallelogram)
    d = (12, -6)
    q = lambda p: (p[0] + d[0], p[1] + d[1])
    body = _p24_role(polyline(_fmt([P1, P2, P3, P4, P1]), stroke="var(--fig-line)", sw=1.4), "plate")
    body += polyline(_fmt([P1, q(P1), q(P2), P2]), stroke="var(--fig-line)", sw=1.4)
    body += polyline(_fmt([q(P2), q(P3), P3]), stroke="var(--fig-line)", sw=1.4)
    for k in range(1, 14):                                         # hatched right edge (the plate's thickness)
        y = P2[1] + 7.6*k
        body += line(P2[0], round(y, 1), P2[0] + d[0], round(y - 9, 1), stroke="var(--fig-line)", sw=0.8)
    c0 = (70, 84); s = 22; e = (9, -7)                               # cube: front square + top + side faces
    body += _p24_role(f'  <rect x="{c0[0]}" y="{c0[1]}" width="{s}" height="{s}" fill="none" stroke="var(--fig-line)" stroke-width="1.3"/>\n', "block")
    body += polyline(_fmt([(c0[0], c0[1]), (c0[0] + e[0], c0[1] + e[1]), (c0[0] + s + e[0], c0[1] + e[1]), (c0[0] + s + e[0], c0[1] + s + e[1]), (c0[0] + s, c0[1] + s)]), stroke="var(--fig-line)", sw=1.3)
    body += line(c0[0] + s, c0[1], c0[0] + s + e[0], c0[1] + e[1], stroke="var(--fig-line)", sw=1.3)
    body += mlabel(112, 124, "1 kg", 12)
    body += _p24_role(arrow(76, 62, 44, 62, stroke="var(--fig-line)", sw=1.3), "acceleration")
    body += mlabel(34, 66, "a", 13) + path("M 30,54 L 38,54", stroke="var(--fig-text)", sw=0.8) + _arrowhead(39, 54, 0, 3, "var(--fig-text)")
    return svg_plain(200, 190, body, "2024 Q67: " + "a vertical rough plate drawn in perspective with a 1 kg block held against its face; arrow a shows the plate accelerating horizontally")

# ---- Q68: Y-junction of rods A (to 0 °C), B and C (to 100 °C); C drawn wider ---------------------
Q68_OUTLINE = [(x + 46, y) for x, y in [(29, 22), (18, 43), (112, 88), (22, 142), (33.6, 162.7), (130.3, 102.8), (248, 99), (248, 67.7), (119.9, 70.8)]]

def fig_2024_q68():
    body = _p24_role(polyline(_fmt(Q68_OUTLINE + [Q68_OUTLINE[0]]), stroke="var(--fig-line)", sw=1.4), "rods")
    body += mlabel(80, 16, "B", 13) + mlabel(60, 36, "100 °C", 12, anchor="end")
    body += mlabel(60, 156, "A", 13) + mlabel(82, 177, "0 °C", 12)
    body += mlabel(268, 64, "C", 13) + mlabel(298, 90, "100 °C", 12, anchor="start")
    return svg_plain(345, 185, body, "2024 Q68: " + "Y-junction of three rods; B to the upper left at 100 °C, A to the lower left at 0 °C, the wider rod C to the right at 100 °C")

# ---- Q70: two adiabats from a common point; gas 1 steeper than gas 2 ---------------------------
Q70 = dict(ox=30, oy=128, start=(92, 30))

def fig_2024_q70():
    g = Q70; s = g["start"]
    body = arrow(g["ox"], g["oy"], g["ox"], 8, stroke="var(--fig-axis)", sw=1.2) + arrow(g["ox"], g["oy"], 200, g["oy"], stroke="var(--fig-axis)", sw=1.2)
    body += mlabel(g["ox"] + 8, 14, "P", 13) + mlabel(208, g["oy"] + 5, "V", 13)
    gas1 = [_bez(s, (93, 58), (100, 94), (120, 112))(j/30) for j in range(31)]
    gas2 = [_bez(s, (100, 52), (114, 72), (144, 84))(j/30) for j in range(31)]
    body += _p24_poly(gas1, "gas1", sw=1.5) + _p24_poly(gas2, "gas2", sw=1.5)
    body += mlabel(84, 112, "gas 1", 12) + mlabel(132, 62, "gas 2", 12)
    return svg_plain(220, 140, body, "2024 Q70: " + "P–V diagram; two adiabatic curves from the same point, gas 1 falling more steeply than gas 2")


# ---- 2025 figures ----

def mlabel(x, y, text, size=12, italic=False, anchor="middle", color="var(--fig-text)"):
    """Serif label matching the booklet typography (italic for math symbols)."""
    style = ' font-style="italic"' if italic else ""
    return f'  <text x="{x}" y="{y}" font-family="Times New Roman, serif" font-size="{size}"{style} fill="{color}" text-anchor="{anchor}">{text}</text>\n'

def axes_xy(ox, oy, x_left, x_right, y_bottom, y_top, sw=1.2):
    """Two axes with arrowheads (booklet style): horizontal t-axis, vertical value axis."""
    body = arrow(x_left, oy, x_right, oy, stroke="var(--fig-axis)", sw=sw)
    body += arrow(ox, y_bottom, ox, y_top, stroke="var(--fig-axis)", sw=sw)
    return body

def vt_axes_labels(ox, oy, x_right, y_top):
    body = mlabel(ox - 26, y_top + 18, "v", 12)
    body += mlabel(ox - 26, y_top + 33, "(m/s)", 11)
    body += mlabel(x_right + 6, oy + 4, "t", 12, italic=True, anchor="start")
    body += mlabel(x_right + 11, oy + 4, "(s)", 12, anchor="start")
    return body

def svg_plain(w, h, body, aria):
    """Figure wrapper without a printed caption (the booklet prints none)."""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{aria}">
  <rect x="0" y="0" width="{w}" height="{h}" fill="transparent"/>
{body}</svg>'''

def fig_2025_q44():
    """Stem a–t graph exactly as printed: straight line a = 2t − 2 (−2 at t = 0, crosses 0 at t = 1)."""
    ox, oy, ts, au = 70, 110, 24, 20          # origin, px per second, px per m/s^2
    P = lambda t, a: (round(ox + t * ts, 1), round(oy - a * au, 1))
    body = axes_xy(ox, oy, 50, 230, 160, 12)
    (x1, y1), (x2, y2) = P(0, -2), P(2.6, 3.2)
    body += line(x1, y1, x2, y2, stroke="var(--fig-primary)", sw=1.8)
    body += mlabel(ox - 22, 26, "a", 12, italic=True)
    body += mlabel(ox - 22, 42, "(m/s²)", 11)
    body += mlabel(ox - 9, oy + 16, "0", 12)
    body += mlabel(P(1, 0)[0] + 9, oy + 16, "1", 12)
    body += mlabel(ox - 13, P(0, -2)[1] + 2, "−2", 12)
    body += mlabel(236, oy + 18, "t", 12, italic=True, anchor="start")
    body += mlabel(241, oy + 18, "(s)", 12, anchor="start")
    return svg_plain(270, 170, body, "2025 Q44 stem: acceleration a in m/s² versus time t in s; a straight line starting at a = −2 when t = 0, crossing a = 0 at t = 1 and rising with slope 2")

def _q44_option_frame(draw, aria):
    ox, oy, ts = 60, 100, 40                  # 40 px per second
    body = axes_xy(ox, oy, 52, 210, 108, 12)
    body += vt_axes_labels(ox, oy, 210, 12)
    body += draw(ox, oy, ts)
    return svg_plain(260, 125, body, aria)

def fig_2025_q44_optA():
    def draw(ox, oy, ts):
        pts = " ".join(f"{ox + t * ts:.1f},{oy - 45 * t * (2 - t):.1f}" for t in [k / 20 for k in range(0, 43)])
        b = polyline(pts, stroke="var(--fig-primary)", sw=1.6)
        b += line(ox + ts, oy, ox + ts, oy - 45, stroke="var(--fig-line)", sw=0.8, dash="1.5,2")
        b += mlabel(ox + 5, oy + 15, "0", 12) + mlabel(ox + ts, oy + 15, "1", 12) + mlabel(ox + 2 * ts - 3, oy + 15, "2", 12)
        return b
    return _q44_option_frame(draw, "2025 Q44 option A: v–t graph, an inverted parabola starting at v = 0 at t = 0, maximum at t = 1, returning to v = 0 at t = 2")

def fig_2025_q44_optB():
    def draw(ox, oy, ts):
        b = polyline(f"{ox},{oy} {ox + ts},{oy} {ox + 1.4 * ts},{oy - 55} {ox + 2.2 * ts},{oy - 55}", stroke="var(--fig-primary)", sw=1.6)
        b += mlabel(ox - 10, oy + 15, "0", 12) + mlabel(ox + ts, oy + 15, "1", 12)
        return b
    return _q44_option_frame(draw, "2025 Q44 option B: v–t graph, v = 0 from t = 0 to t = 1, then rising linearly, then constant")

def fig_2025_q44_optC():
    def draw(ox, oy, ts):
        k = 18                                   # px per m/s (v = t^2 − 2t)
        pts = " ".join(f"{ox + t * ts:.1f},{oy - k * (t * t - 2 * t):.1f}" for t in [j / 20 for j in range(0, 57)])
        b = polyline(pts, stroke="var(--fig-primary)", sw=1.6)
        b += line(ox + ts, oy, ox + ts, oy + k, stroke="var(--fig-line)", sw=0.8, dash="1.5,2")
        b += mlabel(ox - 13, oy + 5, "0", 12) + mlabel(ox + ts + 3, oy - 5, "1", 12) + mlabel(ox + 2 * ts + 3, oy + 16, "2", 12)
        return b
    return _q44_option_frame(draw, "2025 Q44 option C: v–t graph, an upward parabola starting at v = 0 at t = 0, dipping below the axis to a minimum at t = 1, crossing zero at t = 2 and rising steeply")

def fig_2025_q44_optD():
    def draw(ox, oy, ts):
        h = 50
        b = polyline(f"{ox},{oy} {ox + ts},{oy - h} {ox + 2 * ts},{oy - h} {ox + 2.7 * ts},{oy}", stroke="var(--fig-primary)", sw=1.6)
        b += line(ox + ts, oy, ox + ts, oy - h, stroke="var(--fig-line)", sw=1, dash="2,2")
        b += line(ox + 2 * ts, oy, ox + 2 * ts, oy - h, stroke="var(--fig-line)", sw=1, dash="2,2")
        b += mlabel(ox - 8, oy + 15, "0", 12) + mlabel(ox + ts, oy + 15, "1", 12) + mlabel(ox + 2 * ts, oy + 15, "2", 12)
        return b
    return _q44_option_frame(draw, "2025 Q44 option D: v–t graph, trapezium rising linearly from 0 to t = 1, constant from t = 1 to t = 2, then falling linearly to zero")

def fig_2025_q46():
    """Displacement–time graph as printed: AB straight rise, BC curved dip, CD straight fall, DE curved rise."""
    body = arrow(50, 180, 50, 35, stroke="var(--fig-axis)", sw=1.2)
    body += arrow(36, 180, 238, 180, stroke="var(--fig-axis)", sw=1.2)
    curve = ("M71,160 L100,91.5 "
             "C105,104 114,113 127,112.5 C140,112 151,104 158.5,94 "
             "L187.5,141 "
             "C186,118 194,99 218.5,92.5")
    body += path(curve, stroke="var(--fig-primary)", sw=1.6)
    for x, y, t in [(61, 168, "A"), (102.5, 82, "B"), (158.5, 82, "C"), (191, 156, "D"), (229, 97, "E")]:
        body += mlabel(x, y, t, 12)
    body += f'  <text x="0" y="0" transform="translate(20,118) rotate(-90)" font-family="Times New Roman, serif" font-size="12" fill="var(--fig-text)" text-anchor="middle">Displacement</text>\n'
    body += arrow(37.5, 157.5, 37.5, 124, stroke="var(--fig-axis)", sw=1)
    body += arrow(140, 194, 172, 194, stroke="var(--fig-axis)", sw=1)
    body += mlabel(178, 198, "Time", 12, anchor="start")
    return svg_plain(250, 205, body, "2025 Q46: displacement versus time; A to B is a straight rising line, B to C a curved dip, C to D a straight falling line, D to E a curve rising and flattening")

# ---------------------------------------------------------------------------
# JELET 2025 Batch 3 (Q51–Q75) — faithful redraws of the booklet figures.
# Curves are drawn as dense polylines from explicit formulas so that the
# verifier (scripts/verify_solutions_sympy.py) can read the geometry back.
# ---------------------------------------------------------------------------
def _pts(f, t0, t1, n=40):
    """Sample a parametric curve f(s) -> (x, y) for s in [t0, t1]."""
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in (f(t0 + (t1 - t0) * k / n) for k in range(n + 1)))

def _bez(p0, p1, p2, p3):
    """Cubic Bézier as a callable on [0, 1]."""
    def f(s):
        u = 1 - s
        return (u**3*p0[0] + 3*u*u*s*p1[0] + 3*u*s*s*p2[0] + s**3*p3[0],
                u**3*p0[1] + 3*u*u*s*p1[1] + 3*u*s*s*p2[1] + s**3*p3[1])
    return f

def _chain(*segs, n=30):
    """Join several Bézier/line segments into one polyline point string (no duplicate joints)."""
    out = []
    for i, seg in enumerate(segs):
        if seg[0] == "L":
            (x0, y0), (x1, y1) = seg[1], seg[2]
            pts = [(x0, y0), (x1, y1)]
        else:
            f = _bez(*seg[1:])
            pts = [f(k / n) for k in range(n + 1)]
        if out:
            pts = pts[1:]
        out += pts
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in out)

def _arrowhead(x, y, ang_deg, size=6, color="var(--fig-line)"):
    import math
    a = math.radians(ang_deg)
    p1 = (x - size*math.cos(a) + size*0.5*math.sin(a), y - size*math.sin(a) - size*0.5*math.cos(a))
    p2 = (x - size*math.cos(a) - size*0.5*math.sin(a), y - size*math.sin(a) + size*0.5*math.cos(a))
    return f'  <polygon points="{x:.1f},{y:.1f} {p1[0]:.1f},{p1[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}" fill="{color}"/>\n'

def _arrow_on(pts, frac, size=6, color="var(--fig-line)"):
    """Arrowhead placed ON a sampled curve at parameter fraction frac, pointing along the drawing direction."""
    import math
    i = max(1, min(len(pts) - 1, int(round(frac*(len(pts) - 1)))))
    (x0, y0), (x1, y1) = pts[i - 1], pts[i]
    return _arrowhead(x1, y1, math.degrees(math.atan2(y1 - y0, x1 - x0)), size, color)

def _rot_label(x, y, text, size=12, italic=False):
    style = ' font-style="italic"' if italic else ""
    return f'  <text x="0" y="0" transform="translate({x},{y}) rotate(-90)" font-family="Times New Roman, serif" font-size="{size}"{style} fill="var(--fig-text)" text-anchor="middle">{text}</text>\n'

# ---- Q51: four v–t option graphs (no stem figure in the booklet) ----------
_Q51 = dict(ox=40, oy=105, xr=200, yt=12)

def _q51_frame(curve_pts, aria):
    o = _Q51
    body = axes_xy(o["ox"], o["oy"], o["ox"], o["xr"], o["oy"], o["yt"])
    body += mlabel(o["ox"] - 14, 30, "v", 12)
    body += mlabel(o["ox"] - 10, o["oy"] + 16, "0", 12)
    body += mlabel(o["xr"] - 8, o["oy"] + 16, "t", 12)
    body += polyline(curve_pts, stroke="var(--fig-primary)", sw=1.6)
    return svg_plain(220, 125, body, aria)

def fig_2025_q51_optA():
    pts = _chain(("C", (40, 104), (62, 97), (85, 62), (110, 50)), ("C", (110, 50), (128, 42), (145, 41), (190, 40)))
    return _q51_frame(pts, "Graph (A): v versus t; v starts at 0, rises along an S-shaped curve and levels off to a constant value")

def fig_2025_q51_optB():
    pts = _chain(("C", (41, 16), (55, 55), (75, 73), (110, 76)), ("L", (110, 76), (190, 76)))
    return _q51_frame(pts, "Graph (B): v versus t; v starts at a large value on the v-axis and decreases, levelling off to a constant value")

def fig_2025_q51_optC():
    pts = _chain(("C", (40, 105), (62, 66), (86, 34), (104, 34)), ("C", (104, 34), (118, 34), (118, 62), (126, 78)),
                 ("C", (126, 78), (136, 96), (150, 100), (176, 101)))
    return _q51_frame(pts, "Graph (C): v versus t; v rises from 0 to a maximum, then falls steeply back towards zero")

def fig_2025_q51_optD():
    pts = _chain(("L", (40, 105), (72, 62)), ("C", (72, 62), (76, 57), (80, 56), (88, 56)), ("L", (88, 56), (150, 56)),
                 ("C", (150, 56), (163, 56), (169, 49), (174, 40)), ("L", (174, 40), (194, 6)))
    return _q51_frame(pts, "Graph (D): v versus t; v rises linearly from 0, stays constant for a while, then rises steeply again")

# ---- Q54: disc rolling up a curved incline --------------------------------
def fig_2025_q54():
    body = line(20, 140, 260, 140, stroke="var(--fig-axis)", sw=1.4)
    f = lambda s: (40 + 175*s, 140 - 125*s**2.3)          # concave-up incline from the base to the top
    body += polyline(_pts(f, 0, 1.03, 50), stroke="var(--fig-line)", sw=1.4)
    body += path("M 64,140 A 24,24 0 0 0 62,133", stroke="var(--fig-line)", sw=1)   # angle mark at the base
    body += circle(31, 134, 6, stroke="var(--fig-primary)", sw=1.3)
    body += dot(31, 134, 1.2, fill="var(--fig-primary)")
    body += arrow(33, 134, 44, 134, stroke="var(--fig-primary)", sw=1)
    body += mlabel(52, 130, "V", 12)
    body += circle(211, 22, 6, stroke="var(--fig-primary)", sw=1.3)
    body += dot(211, 22, 1.2, fill="var(--fig-primary)")
    body += line(214, 30, 214, 140, stroke="var(--fig-line)", sw=1.4, dash="5,4")
    body += mlabel(224, 88, "h", 12, anchor="start")
    return svg_plain(270, 150, body, "2025 Q54: a disc on a horizontal surface moving with velocity V towards a concave-up curved incline; the disc rises to a height h shown by a dashed vertical line")

# ---- Q55: extension–load graph for wires A and B --------------------------
def fig_2025_q55():
    ox, oy = 60, 150
    body = axes_xy(ox, oy, ox, 230, oy, 15)
    body += line(ox, oy, 128, 30, stroke="var(--fig-primary)", sw=1.5)   # B (steeper)
    body += line(ox, oy, 185, 62, stroke="var(--fig-primary)", sw=1.5)   # A
    body += mlabel(136, 30, "B", 12)
    body += mlabel(194, 62, "A", 12)
    body += _rot_label(44, 92, "extension ⟶", 12)
    body += mlabel(135, 170, "load ⟶", 12)
    return svg_plain(250, 180, body, "2025 Q55: extension (vertical) versus load (horizontal) for wires A and B; both are straight lines through the origin, B steeper than A")

# ---- Q57: P–V cycle a-c-b, a-d-b and curve b-a ----------------------------
def fig_2025_q57():
    ox, oy = 45, 150
    body = axes_xy(ox, oy, ox, 245, oy, 12)
    ax, ay, bx, by = 85, 125, 205, 35
    body += polyline(f"{ax},{ay} {ax},{by} {bx},{by} {bx},{ay} {ax},{ay}", stroke="var(--fig-line)", sw=1.4)
    curve = _bez((bx, by), (192, 70), (150, 78), (125, 86))
    curve2 = _bez((125, 86), (100, 94), (88, 110), (ax, ay))
    cpts = [curve(k/25) for k in range(26)] + [curve2(k/25) for k in range(1, 26)]
    body += polyline(_fmt(cpts), stroke="var(--fig-line)", sw=1.4)
    body += _arrowhead(ax, 82, -90) + _arrowhead(150, by, 0) + _arrowhead(bx, 82, -90) + _arrowhead(150, ay, 0)
    body += _arrow_on(cpts, 0.42)                           # b -> a along the curve
    body += mlabel(ax - 8, ay + 4, "a", 12, italic=True) + mlabel(ax - 14, by + 4, "c", 12)
    body += mlabel(bx + 10, by - 2, "b", 12) + mlabel(bx + 10, ay + 6, "d", 12)
    body += mlabel(ox - 12, 33, "P", 12) + arrow(ox - 12, 75, ox - 12, 52, stroke="var(--fig-axis)", sw=1)
    body += mlabel(ox - 12, oy + 5, "0", 12)
    body += arrow(125, oy + 14, 150, oy + 14, stroke="var(--fig-axis)", sw=1) + mlabel(232, oy + 18, "V", 12)
    return svg_plain(260, 175, body, "2025 Q57: P–V diagram; rectangle with a bottom-left, c top-left, b top-right, d bottom-right; arrows a→c, c→b, a→d, d→b, and a curved path from b back to a")

# ---- Q58: four P–V option diagrams (no stem figure in the booklet) --------
_Q58 = dict(ox=50, oy=110, v1=90, v3=170)

def _q58_frame(proc, labels, axis_style, aria):
    o = _Q58
    body = axes_xy(o["ox"], o["oy"], o["ox"], 230, o["oy"], 10)
    body += line(o["v1"], 22, o["v1"], o["oy"], stroke="var(--fig-line)", sw=1, dash="1.5,2.5")
    body += line(o["v3"], 22, o["v3"], o["oy"], stroke="var(--fig-line)", sw=1, dash="1.5,2.5")
    body += polyline(proc, stroke="var(--fig-primary)", sw=1.5)
    for txt, (x, y) in labels:
        body += mlabel(x, y, txt, 12)
    body += mlabel(o["ox"] - 14, 74, "P", 12) + arrow(o["ox"] - 14, 58, o["ox"] - 14, 42, stroke="var(--fig-axis)", sw=1)
    if axis_style == "AB":
        body += mlabel(o["v1"], o["oy"] + 16, "V", 12) + arrow(100, o["oy"] + 12, 120, o["oy"] + 12, stroke="var(--fig-axis)", sw=1)
        body += mlabel(128, o["oy"] + 16, "V", 12) + mlabel(o["v3"], o["oy"] + 16, "3V", 12)
    elif axis_style == "C":
        body += mlabel(o["v1"] - 6, o["oy"] + 16, "V", 12) + arrow(96, o["oy"] + 10, 114, o["oy"] + 10, stroke="var(--fig-axis)", sw=1)
        body += mlabel(105, o["oy"] + 27, "V", 12) + mlabel(o["v3"], o["oy"] + 16, "3V", 12)
    else:
        body += arrow(110, o["oy"] + 12, 130, o["oy"] + 12, stroke="var(--fig-axis)", sw=1) + mlabel(140, o["oy"] + 16, "V", 12)
    return svg_plain(240, 142, body, aria)

def _q58_iso(p_hi, p_lo, reverse=False):
    """Convex decreasing curve P = c + k / V through (v1, p_hi) and (v3, p_lo) in pixel space (P measured up)."""
    o = _Q58
    V1, V3 = o["v1"] - o["ox"], o["v3"] - o["ox"]
    k = (p_hi - p_lo) / (1/V1 - 1/V3); c = p_hi - k/V1
    vs = [V1 + (V3 - V1)*j/30 for j in range(31)]
    if reverse:
        vs = vs[::-1]
    return [(o["ox"] + v, o["oy"] - (c + k/v)) for v in vs]

def _fmt(pts):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)

def fig_2025_q58_optA():
    o = _Q58
    proc = _fmt([(o["v1"], 30), (o["v3"], 66), (o["v1"], 66)])
    body_lbl = [("A", (o["v1"] - 10, 30)), ("B", (o["v1"] - 10, 70))]
    svg = _q58_frame(proc, body_lbl, "AB", "Graph (A): P–V diagram; a straight sloping line from A at V down to 3V, then a horizontal line at lower pressure back to B at V")
    return svg.replace("</svg>", _arrowhead(132, 49, 24) + _arrowhead(126, 66, 180) + "</svg>")

def fig_2025_q58_optB():
    o = _Q58
    pts = _q58_iso(80, 44) + [(o["v1"], o["oy"] - 44)]
    svg = _q58_frame(_fmt(pts), [("A", (o["v1"] - 10, 30)), ("B", (o["v1"] - 10, 70))], "AB",
                     "Graph (B): P–V diagram; a curve (isothermal) falling from A at V to 3V, then a horizontal line at the lower pressure back to B at V")
    return svg.replace("</svg>", _arrow_on(pts[:31], 0.4) + _arrowhead(130, o["oy"] - 44, 180) + "</svg>")

def fig_2025_q58_optC():
    o = _Q58
    pts = [(o["v1"], o["oy"] - 44)] + _q58_iso(80, 44, reverse=True)
    svg = _q58_frame(_fmt(pts), [("B", (o["v1"] - 10, 30)), ("A", (o["v1"] - 10, 70))], "C",
                     "Graph (C): P–V diagram; a horizontal line from A at V to 3V, then a curve rising from 3V back to B at V")
    return svg.replace("</svg>", _arrowhead(130, o["oy"] - 44, 0) + _arrow_on(pts[1:], 0.6) + "</svg>")

def fig_2025_q58_optD():
    o = _Q58
    pts = _q58_iso(80, 44) + [(o["v1"], 92)]
    svg = _q58_frame(_fmt(pts), [("A", (o["v1"] - 10, 30)), ("B", (o["v1"] - 10, 98))], "D",
                     "Graph (D): P–V diagram; a curve falling from A at V to 3V, then a straight line sloping down back to B at V at a lower pressure")
    lower = [pts[-2], pts[-1]]
    mid = [lower[0], ((lower[0][0] + lower[1][0])/2, (lower[0][1] + lower[1][1])/2)]
    return svg.replace("</svg>", _arrow_on(pts[:31], 0.4) + _arrow_on(mid, 1.0) + "</svg>")

# ---- Q61: three liquids, arcs labelled with mixture temperatures ----------
def fig_2025_q61():
    body = ""
    xs = {"A": 40, "B": 135, "C": 230}
    for k, x in xs.items():
        body += circle(x, 95, 8, stroke="var(--fig-line)", sw=1.1)
        body += mlabel(x, 99, k, 10)
        body += mlabel(x, 118, "m", 12)
    body += path("M 40,87 C 45,30 130,30 135,87", stroke="var(--fig-line)", sw=1.3)
    body += path("M 135,87 C 140,30 225,30 230,87", stroke="var(--fig-line)", sw=1.3)
    body += mlabel(87, 22, "13ºC", 12) + mlabel(182, 22, "16ºC", 12)
    body += mlabel(40, 145, "10ºC", 12) + mlabel(135, 145, "15ºC", 12) + mlabel(230, 145, "20ºC", 12)
    return svg_plain(270, 155, body, "2025 Q61: liquids A, B, C of equal mass m at 10ºC, 15ºC and 20ºC; an arc joining A and B is labelled 13ºC and an arc joining B and C is labelled 16ºC")

# ---- Q62: temperature versus heat input ------------------------------------
Q62_POINTS = [(50, 140), (82, 105), (125, 105), (153, 75), (180, 75), (215, 38)]   # O, A, B, C, D, E

def fig_2025_q62():
    ox, oy = 50, 140
    body = axes_xy(ox, oy, ox, 245, oy, 10)
    body += polyline(_fmt(Q62_POINTS), stroke="var(--fig-primary)", sw=1.5)
    for txt, (x, y) in zip("ABCDE", Q62_POINTS[1:]):
        dx, dy = {"A": (6, 16), "B": (0, 16), "C": (6, 14), "D": (2, 14), "E": (8, -2)}[txt]
        body += mlabel(x + dx, y + dy, txt, 12)
    body += _rot_label(30, 92, "Temperature ⟶", 12)
    body += mlabel(150, 160, "Heat input ⟶", 12)
    return svg_plain(260, 170, body, "2025 Q62: temperature versus heat input; rising from the origin to A, flat from A to B, rising from B to C, flat from C to D, rising again from D to E")

# ---- Q66: four x–t option graphs (no stem figure in the booklet) ----------
_Q66 = dict(ox=45, oy=110, t4=105)

def _q66_frame(curve_pts, aria):
    o = _Q66
    body = axes_xy(o["ox"], o["oy"], o["ox"], 210, o["oy"], 8)
    body += line(o["t4"], 40, o["t4"], o["oy"], stroke="var(--fig-line)", sw=1, dash="2,2")
    body += polyline(curve_pts, stroke="var(--fig-primary)", sw=1.6)
    body += _rot_label(o["ox"] - 14, 72, "x", 12, italic=True) + arrow(o["ox"] - 14, 62, o["ox"] - 14, 44, stroke="var(--fig-axis)", sw=1)
    body += mlabel(o["ox"], o["oy"] + 16, "0", 12) + mlabel(o["t4"], o["oy"] + 16, "4", 12)
    body += arrow(165, o["oy"] + 12, 185, o["oy"] + 12, stroke="var(--fig-axis)", sw=1) + mlabel(192, o["oy"] + 16, "t", 12, italic=True)
    return svg_plain(220, 135, body, aria)

def _q66_parab(h, concave_up=True, n=24):
    """x(t) through the origin and (t4, h): concave up = from rest (x = a t^2); concave down = mirrored."""
    o = _Q66; w = o["t4"] - o["ox"]
    pts = []
    for j in range(n + 1):
        s = j / n
        frac = s*s if concave_up else 1 - (1 - s)**2
        pts.append((o["ox"] + w*s, o["oy"] - h*frac))
    return pts

def fig_2025_q66_optA():
    pts = _q66_parab(55, concave_up=False) + [(135, 95)]
    return _q66_frame(_fmt(pts), "Graph (A): x versus t; x rises along a curve that is concave down until t = 4, then decreases along a straight line")

def fig_2025_q66_optB():
    pts = _q66_parab(40, concave_up=False) + [(118, 2)]
    return _q66_frame(_fmt(pts), "Graph (B): x versus t; x rises along a concave-down curve until t = 4, then rises along a much steeper straight line")

def fig_2025_q66_optC():
    pts = _q66_parab(58) + [(155, 52)]
    return _q66_frame(_fmt(pts), "Graph (C): x versus t; x rises along a concave-up curve until t = 4, then stays constant (horizontal line)")

def fig_2025_q66_optD():
    o = _Q66; w = o["t4"] - o["ox"]; s = 1.15                # line slope; parabola height h = s w / 2 for tangency
    h = s*w/2
    pts = _q66_parab(h) + [(o["t4"] + 60, o["oy"] - h - s*60)]
    return _q66_frame(_fmt(pts), "Graph (D): x versus t; x rises along a concave-up curve from the origin until t = 4, then continues as a straight line tangent to the curve")

# ---- Q67: block over a pulley pulled by F = 40 N --------------------------
def fig_2025_q67():
    body = line(40, 20, 190, 20, stroke="var(--fig-line)", sw=1.4)
    for k in range(5):
        x = 70 + 22*k
        body += line(x, 20, x + 12, 6, stroke="var(--fig-line)", sw=1)
    body += line(115, 20, 115, 52, stroke="var(--fig-line)", sw=1.4)
    body += circle(115, 52, 22, stroke="var(--fig-line)", sw=1.4)
    body += line(93, 52, 93, 112, stroke="var(--fig-line)", sw=1.2)
    body += f'  <rect x="68" y="112" width="50" height="26" fill="none" stroke="var(--fig-line)" stroke-width="1.4"/>\n'
    body += mlabel(93, 130, "2kg", 13)
    body += arrow(137, 52, 137, 145, stroke="var(--fig-line)", sw=1.2)
    body += mlabel(146, 147, "F=40N", 13, anchor="start")
    return svg_plain(220, 160, body, "2025 Q67: a fixed smooth pulley hanging from a ceiling; a 2 kg block hangs from the left end of the string and the right end is pulled down by a force F = 40 N")

# ---- Batch 4 (Q76–Q100): chemistry structures, reaction schemes, circuits -----
# Times-like advance widths (em) used to lay out condensed formulae so bonds stop at label edges.
_TNR = {"A": .722, "B": .667, "C": .667, "E": .611, "H": .722, "I": .333, "L": .611, "M": .889, "N": .722,
        "O": .722, "R": .667, "T": .611, "Y": .722, "a": .444, "b": .5, "c": .444, "d": .5, "e": .444, "g": .5,
        "h": .5, "i": .278, "l": .278, "m": .778, "n": .5, "o": .5, "q": .5, "r": .333, "s": .389, "t": .278,
        "u": .5, "x": .5, "y": .5, "(": .333, ")": .333, " ": .25, "/": .278, ".": .25, "-": .333}

def _chem_runs(s):
    """Split a formula into (text, is_subscript) runs: digits directly after a letter or ')' are subscripts."""
    runs, prev = [], ""
    for ch in s:
        sub = ch.isdigit() and (prev.isalpha() or prev == ")" or (prev.isdigit() and runs and runs[-1][1]))
        if runs and runs[-1][1] == sub:
            runs[-1] = (runs[-1][0] + ch, sub)
        else:
            runs.append((ch, sub))
        prev = ch
    return runs

def chem_w(s, size=13):
    return sum((0.5*0.72 if sub else 1)*sum(_TNR.get(c, .5) for c in t)*size for t, sub in _chem_runs(s))

def chem(x, y, s, size=13, anchor="middle", italic=False, color="var(--fig-text)"):
    """Formula text with true subscripts (tspan dy), booklet serif."""
    d = round(0.3*size, 1)
    parts, shifted = [], False
    for t, sub in _chem_runs(s):
        if sub:
            parts.append(f'<tspan dy="{d}" font-size="{round(0.72*size, 1)}">{t}</tspan>'); shifted = True
        else:
            parts.append(f'<tspan dy="-{d}">{t}</tspan>' if shifted else t); shifted = False
    style = ' font-style="italic"' if italic else ""
    # Always emit start-anchored text at a computed x: renderers disagree on middle-anchoring
    # text that contains baseline-shifted tspans.
    if anchor == "middle":
        x = round(x - chem_w(s, size)/2, 2)
    elif anchor == "end":
        x = round(x - chem_w(s, size), 2)
    return (f'  <text x="{x}" y="{y}" font-family="Times New Roman, serif" font-size="{size}"{style} '
            f'fill="{color}" text-anchor="start">{"".join(parts)}</text>\n')

class _Lbl:
    """A middle-anchored formula label with its estimated box (for bond end-points)."""
    def __init__(self, x, y, s, size=13):
        self.x, self.y, self.s, self.size = x, y, s, size
        self.w = chem_w(s, size)
        self.l, self.r = x - self.w/2, x + self.w/2
        self.top, self.bot, self.mid = y - 0.70*size, y + 0.12*size, y - 0.33*size
        self.c0 = self.l + _TNR.get(s[0], .5)*size/2        # centre of the first character
    def svg(self):
        return chem(self.x, self.y, self.s, self.size)

def _bond(x1, y1, x2, y2, order=1, gap=2.6):
    import math
    L = math.hypot(x2 - x1, y2 - y1); nx, ny = -(y2 - y1)/L, (x2 - x1)/L
    offs = {1: [0], 2: [-gap/2*1.15, gap/2*1.15], 3: [-gap, 0, gap]}[order]
    return "".join(line(round(x1 + o*nx, 2), round(y1 + o*ny, 2), round(x2 + o*nx, 2), round(y2 + o*ny, 2),
                        stroke="var(--fig-line)", sw=1.1) for o in offs)

def _hb(a, b, order=1):
    return _bond(round(a.r + 3, 2), a.mid, round(b.l - 2.5, 2), a.mid, order)

def _arrow_scheme(x1, x2, y, sw=1.2):
    """Reaction arrow with a filled barbed head (booklet style)."""
    body = line(x1, y, x2 - 6, y, stroke="var(--fig-line)", sw=sw)
    body += f'  <polygon points="{x2},{y} {x2 - 11},{y - 3.6} {x2 - 7},{y} {x2 - 11},{y + 3.6}" fill="var(--fig-line)"/>\n'
    return body

def _cchain(x_left, y, groups, orders, verts, size=12, blen=17):
    """Condensed chain: groups joined by horizontal bonds; verts {i: (up, down)} hang off the first atom of group i."""
    body, lbls, x = "", [], x_left
    for g in groups:
        w = chem_w(g, size); lbls.append(_Lbl(round(x + w/2, 2), y, g, size)); x += w + 5 + blen
    for a, b, o in zip(lbls, lbls[1:], orders):
        body += _hb(a, b, o)
    for i, (up, down) in verts.items():
        p = lbls[i]
        for txt, sgn in ((up, -1), (down, 1)):
            if not txt:
                continue
            w = chem_w(txt, size); c0 = _TNR.get(txt[0], .5)*size/2
            q = _Lbl(round(p.c0 - c0 + w/2, 2), y + sgn*(31 if sgn < 0 else 33), txt, size)
            lbls.append(q)
            if sgn < 0:
                body += _bond(round(p.c0, 2), round(p.top - 2, 2), round(p.c0, 2), round(q.bot + 2.5, 2))
            else:
                body += _bond(round(p.c0, 2), round(p.bot + 3, 2), round(p.c0, 2), round(q.top - 2, 2))
    body += "".join(l.svg() for l in lbls)
    return body, lbls

def fig_2025_q81():
    """Condensed structure exactly as printed: CH3–CH2–C≡C–CH(–CH2–CH(CH3)2)(–CH=CH2)."""
    s = 13
    n = {k: _Lbl(x, y, t, s) for k, (x, y, t) in {
        "c1": (34, 52, "CH3"), "c2": (84, 82, "CH2"), "c3": (125, 82, "C"), "c4": (164, 82, "C"),
        "c5": (204, 82, "CH"), "c6": (252, 48, "CH2"), "c7": (304, 48, "CH"),
        "c8": (352, 24, "CH3"), "c9": (352, 72, "CH3"), "c10": (252, 116, "CH"), "c11": (306, 116, "CH2")}.items()}
    b = ""
    b += _bond(n["c1"].r + 2, n["c1"].mid + 4, n["c2"].l + 1, n["c2"].top + 1)
    b += _hb(n["c2"], n["c3"]) + _hb(n["c3"], n["c4"], 3) + _hb(n["c4"], n["c5"])
    b += _bond(n["c5"].r - 2, n["c5"].top, n["c6"].l + 2, n["c6"].bot + 1)
    b += _hb(n["c6"], n["c7"])
    b += _bond(n["c7"].r + 1, n["c7"].mid - 4, n["c8"].l - 1, n["c8"].mid + 1)
    b += _bond(n["c7"].r + 1, n["c7"].mid + 2, n["c9"].l - 1, n["c9"].top + 2)
    b += _bond(n["c5"].r - 2, n["c5"].bot + 1, n["c10"].l + 2, n["c10"].top)
    b += _hb(n["c10"], n["c11"], 2)
    b += "".join(l.svg() for l in n.values())
    body = f'  <g data-struct="Q81">\n{b}  </g>\n'
    return svg_plain(390, 130, body, "2025 Q81: condensed structural formula")

def _skel_db(p, q, side=1, gap=3.4, trim=0.16):
    """Skeletal double bond: main line p–q plus a shorter inner line offset to one side."""
    import math
    (x1, y1), (x2, y2) = p, q
    L = math.hypot(x2 - x1, y2 - y1); nx, ny = -(y2 - y1)/L*side, (x2 - x1)/L*side
    ax, ay = x1 + (x2 - x1)*trim + nx*gap, y1 + (y2 - y1)*trim + ny*gap
    bx, by = x2 - (x2 - x1)*trim + nx*gap, y2 - (y2 - y1)*trim + ny*gap
    return (line(x1, y1, x2, y2, stroke="var(--fig-line)", sw=1.1) +
            line(round(ax, 2), round(ay, 2), round(bx, 2), round(by, 2), stroke="var(--fig-line)", sw=1.1))

def _sk(p, q):
    return line(p[0], p[1], q[0], q[1], stroke="var(--fig-line)", sw=1.1)

def fig_2025_q82():
    """Skeletal pair as printed: propanoic acid (left) and ethyl methanoate (right)."""
    b = ""
    a1, a2, a3 = (40, 92), (70, 109), (100, 92)
    b += _sk(a1, a2) + _sk(a2, a3)
    b += line(98, 92, 98, 58, stroke="var(--fig-line)", sw=1.1) + line(102, 92, 102, 58, stroke="var(--fig-line)", sw=1.1)
    b += chem(100, 52, "O", 12) + _sk(a3, (127, 108)) + chem(139, 121, "OH", 12)
    e1 = (208, 92)
    b += chem(176, 121, "H", 12) + _sk((182, 109), e1)
    b += line(206, 92, 206, 58, stroke="var(--fig-line)", sw=1.1) + line(210, 92, 210, 58, stroke="var(--fig-line)", sw=1.1)
    b += chem(208, 52, "O", 12) + _sk(e1, (234, 108)) + chem(239, 121, "O", 12)
    e3, e4 = (270, 92), (302, 110)
    b += _sk((245, 108), e3) + _sk(e3, e4)
    return svg_plain(330, 132, b, "2025 Q82: skeletal structures of propanoic acid and ethyl methanoate")

def fig_2025_q83():
    """Reaction scheme as printed: CH3Cl →[(i) Mg/Ether, (ii) CH3COOH]."""
    b = chem(38, 50, "CH3Cl", 13) + _arrow_scheme(68, 212, 46)
    b += chem(140, 36, "(i) Mg/Ether", 12) + chem(140, 64, "(ii) CH3COOH", 12)
    return svg_plain(230, 76, b, "2025 Q83: reaction scheme")

def fig_2025_q85():
    """Reaction scheme as printed: HC≡CH →[(i) NaNH2/liq. NH3, (ii) Ethylbromide (excess)]."""
    hc, ch = _Lbl(26, 50, "HC", 13), _Lbl(76, 50, "CH", 13)
    b = hc.svg() + ch.svg() + _hb(hc, ch, 3) + _arrow_scheme(104, 286, 46)
    b += chem(190, 36, "(i) NaNH2/liq. NH3", 12) + chem(176, 64, "(ii) Ethylbromide", 12) + chem(210, 80, "(excess)", 12)
    return svg_plain(300, 92, b, "2025 Q85: reaction scheme")

def _q85_opt(left, right, aria):
    """Skeletal C=C option (E geometry) with condensed end groups, as printed."""
    v1, v2 = (96, 44), (130, 24)
    b = chem(6, 26, left, 12, anchor="start")
    lx = 6 + chem_w(left, 12)
    b += _sk((round(lx + 6, 2), 25), v1) + _skel_db(v1, v2, side=-1) + _sk(v2, (163, 42))
    b += chem(165, 53, right, 12, anchor="start")
    return svg_plain(175 + int(chem_w(right, 12)), 62, b, aria)

def fig_2025_q85_optA():
    return _q85_opt("CH3CH2", "CH2CH3", "Option (A): CH3CH2–CH=CH–CH2CH3 drawn skeletally (trans C=C)")

def fig_2025_q85_optC():
    return _q85_opt("CH3CH2", "NH2", "Option (C): CH3CH2–CH=CH–NH2 drawn skeletally (trans C=C)")

def fig_2025_q85_optD():
    v1, v2 = (52, 44), (86, 24)
    b = chem(14, 18, "Br", 12, anchor="start") + _sk((30, 18), v1) + _skel_db(v1, v2, side=-1) + _sk(v2, (119, 42))
    b += chem(121, 53, "NH2", 12, anchor="start")
    return svg_plain(150, 62, b, "Option (D): Br–CH=CH–NH2 drawn skeletally (trans C=C)")

def fig_2025_q88():
    """3,3-Dimethylbut-1-ene + HBr, with candidate products (I)–(IV), as printed."""
    body = ""
    r, _ = _cchain(40, 56, ["CH3", "C", "CH", "CH2"], [1, 1, 2], {1: ("CH3", "CH3")})
    body += f'  <g data-struct="R">\n{r}  </g>\n'
    body += _arrow_scheme(240, 330, 52) + chem(285, 44, "HBr", 12)
    rows = [("I", 40, 158, ["CH3", "C", "CH", "CH3"], {1: ("CH3", "CH3"), 2: (None, "Br")}),
            ("II", 330, 158, ["CH3", "C", "CH", "CH3"], {1: ("CH3", "Br"), 2: (None, "CH3")}),
            ("III", 40, 262, ["CH3", "C", "CH2", "CH2Br"], {1: ("CH3", "CH3")}),
            ("IV", 336, 262, ["BrCH2", "C", "CH", "CH3"], {1: ("CH3", "H"), 2: (None, "CH3")})]
    for tag, x, y, groups, verts in rows:
        s, _ = _cchain(x, y, groups, [1, 1, 1], verts)
        body += mlabel(x - 6, y, f"({tag})", 13, anchor="end")
        body += f'  <g data-struct="{tag}">\n{s}  </g>\n'
    return svg_plain(520, 310, body, "2025 Q88: 3,3-dimethylbut-1-ene + HBr and structures I–IV")

def _resistor(x1, x2, y, n=4, amp=5):
    """Zig-zag resistor with 2n alternating vertices between leads at x1 and x2."""
    step = (x2 - x1)/(2*n)
    pts = [(x1, y)]
    for k in range(2*n):
        pts.append((round(x1 + step*(k + 0.5), 2), y - amp if k % 2 == 0 else y + amp))
    pts.append((x2, y))
    return polyline(" ".join(f"{a},{b}" for a, b in pts), stroke="var(--fig-line)", sw=1.3)

def _coil(x1, x2, y, loops=6):
    """Looped inductor (as printed): overlapping ellipses between two leads."""
    rx, ry = 5.2, 8.0
    pitch = (x2 - x1 - 2*rx)/(loops - 1)
    b = ""
    for k in range(loops):
        b += f'  <ellipse cx="{round(x1 + rx + k*pitch, 2)}" cy="{y}" rx="{rx}" ry="{ry}" stroke="var(--fig-line)" stroke-width="1.3" fill="none"/>\n'
    return b

def fig_2025_q95():
    """Two parallel R–L branches (R1, L1 top; R2, L2 bottom) fed by I, as printed."""
    yt, yb, xl, xr, yi = 40, 136, 88, 312, 88
    W = lambda x1, y1, x2, y2: line(x1, y1, x2, y2, stroke="var(--fig-line)", sw=1.4)
    b = W(30, yi, xl, yi) + _arrowhead(66, yi, 0, 7)
    b += W(xl, yt, xl, yb) + _arrowhead(xl, 64, -90, 7) + _arrowhead(xl, 112, 90, 7)
    b += W(xr, yt, xr, yb) + W(xr, yi, 350, yi)
    for y, tag, ly in ((yt, "1", yt + 24), (yb, "2", yb + 24)):
        b += W(xl, y, 132, y) + _arrowhead(114, y, 0, 7)
        b += f'  <g data-comp="R" data-label="R{tag}" data-pins="132,{y} 176,{y}">\n{_resistor(132, 176, y)}  </g>\n'
        b += W(176, y, 204, y)
        b += f'  <g data-comp="L" data-label="L{tag}" data-pins="204,{y} 270,{y}">\n{_coil(204, 270, y)}  </g>\n'
        b += W(270, y, xr, y)
        b += chem(154, ly, f"R{tag}", 12) + chem(238, ly, f"L{tag}", 12)
    b += chem(118, yt - 10, "I1", 12) + chem(118, yb + 24, "I2", 12) + chem(46, yi - 10, "I", 12)
    return svg_plain(360, 170, b, "2025 Q95: parallel R1–L1 and R2–L2 branches carrying I1 and I2; total current I")

def _nand(x, yc):
    """IEEE distinctive-shape NAND: flat back at x, semicircular front, inversion bubble; pins in data-*."""
    r = 17
    d = f"M {x},{yc - r} H {x + r} A {r} {r} 0 0 1 {x + r},{yc + r} H {x} Z"
    return (f'  <g data-gate="NAND" data-in="{x},{yc - 9} {x},{yc + 9}" data-out="{x + 2*r + 6},{yc}">\n'
            f'  <path d="{d}" stroke="var(--fig-line)" stroke-width="1.6" fill="none"/>\n'
            f'  <circle cx="{x + 2*r + 3}" cy="{yc}" r="3" stroke="var(--fig-line)" stroke-width="1.4" fill="none"/>\n  </g>\n')

def fig_2025_q100():
    """Three NAND gates exactly as wired in the booklet: both first-stage gates take A and B;
    their outputs feed the two inputs of the output NAND (Y). The A-tap crosses the B-tap with a hop."""
    W = lambda x1, y1, x2, y2: line(x1, y1, x2, y2, stroke="var(--fig-line)", sw=1.4)
    b = _nand(160, 47) + _nand(160, 153) + _nand(290, 100)
    b += W(56, 38, 160, 38) + W(105, 38, 105, 144) + W(105, 144, 134, 144)
    b += '  <path data-hop="1" d="M 134,144 A 6 6 0 0 1 146,144" stroke="var(--fig-line)" stroke-width="1.4" fill="none"/>\n'
    b += W(146, 144, 160, 144)
    b += W(56, 162, 160, 162) + W(140, 162, 140, 56) + W(140, 56, 160, 56)
    b += W(200, 47, 274, 47) + W(274, 47, 274, 91) + W(274, 91, 290, 91)
    b += W(200, 153, 274, 153) + W(274, 153, 274, 109) + W(274, 109, 290, 109)
    b += W(330, 100, 356, 100)
    b += mlabel(44, 42, "A", 13) + mlabel(44, 166, "B", 13) + mlabel(366, 104, "Y", 13)
    return svg_plain(380, 180, b, "2025 Q100: three-NAND logic circuit with inputs A, B and output Y")



# ---------------------------------------------------------------------------
# JELET 2024 Batch C (Chemistry Q71–Q90, FEEE Q91–Q100): faithful redraws of the Set-A booklet
# figures (pp. 20–23, read at 180 DPI with 300/600-DPI crops).  Chemistry option structures are
# skeletal/Kekulé drawings: every bond is one or more <line>s (an inner shorter line for a
# double bond, three parallel lines for a triple bond) and hetero groups are formula labels, so
# scripts/verify_solutions_sympy.py can rebuild the molecular graph from geometry alone.
# Circuits: wires are <line>s; component bodies (cell plates, diode bars, resistor zig-zags,
# op-amp/gate outlines) are <path>/<polyline>/<polygon> inside <g data-comp/data-gate> groups
# with their pin coordinates, so the verifier can rebuild the netlist and solve it.
# Helpers carry a _c24 prefix (flat namespace).  Colours: var(--fig-*) tokens only.
# ---------------------------------------------------------------------------

def _c24_ln(p, q, sw=1.1):
    return line(round(p[0], 2), round(p[1], 2), round(q[0], 2), round(q[1], 2), stroke="var(--fig-line)", sw=sw)

def _c24_bond(p, q, order=1, side=1, trim=0.16, gap=3.2):
    """Skeletal bond p–q: 1 = one line; 2 = main line + shorter inner line on `side`; 3 = three parallel lines."""
    if order == 1:
        return _c24_ln(p, q)
    if order == 2:
        return _skel_db((round(p[0], 2), round(p[1], 2)), (round(q[0], 2), round(q[1], 2)), side=side, gap=gap, trim=trim)
    L = _m.hypot(q[0] - p[0], q[1] - p[1]); nx, ny = -(q[1] - p[1])/L, (q[0] - p[0])/L
    return "".join(_c24_ln((p[0] + o*nx, p[1] + o*ny), (q[0] + o*nx, q[1] + o*ny)) for o in (-2.8, 0, 2.8))

def _c24_ring(cx, cy, r, doubles):
    """Benzene ring, vertex at top. Vertices v0 (top) clockwise; edge k joins v_k–v_(k+1).
    `doubles` lists the edges carrying the inner (Kekulé) line, drawn towards the centre."""
    v = [(round(cx + r*_m.sin(_m.radians(60*k)), 2), round(cy - r*_m.cos(_m.radians(60*k)), 2)) for k in range(6)]
    b = "".join(_c24_bond(v[k], v[(k + 1) % 6], 2 if k in doubles else 1, side=1) for k in range(6))
    return b, v

def _c24_dir(p, ang, L=22):
    """Point at distance L from p in screen direction `ang` degrees (0 = right, 90 = up)."""
    return (round(p[0] + L*_m.cos(_m.radians(ang)), 2), round(p[1] - L*_m.sin(_m.radians(ang)), 2))

def _c24_struct(tag, body, w, h, aria):
    return svg_plain(w, h, f'  <g data-struct="{tag}">\n{body}  </g>\n', aria)

KEK_78 = (0, 2, 4)

def fig_2024_q78_optA():
    """Phenylacetic acid as printed: ring, vertical bond up to CH2 vertex, then up-right to COOH."""
    b, v = _c24_ring(40, 80, 22, KEK_78)
    c = _c24_dir(v[0], 90, 20); e = _c24_dir(c, 30, 20)
    b += _c24_bond(v[0], c) + _c24_bond(c, e) + chem(e[0] + 2.5, e[1] + 4.3, "COOH", 13, anchor="start")
    return _c24_struct("A", b, 104, 108, "Option (A): phenylacetic acid, ring–CH2–COOH")

def fig_2024_q78_optB():
    """Picric acid as printed: OH on top, O2N upper-left, NO2 upper-right, NO2 at the bottom."""
    b, v = _c24_ring(70, 72, 22, KEK_78)
    o = _c24_dir(v[0], 90, 18); l = _c24_dir(v[5], 150, 18); r = _c24_dir(v[1], 30, 18); d = _c24_dir(v[3], -90, 18)
    b += _c24_bond(v[0], o) + _c24_bond(v[5], l) + _c24_bond(v[1], r) + _c24_bond(v[3], d)
    b += chem(o[0], o[1] - 3.5, "OH", 13) + chem(l[0] - 2.5, l[1] + 4.3, "O2N", 13, anchor="end")
    b += chem(r[0] + 2.5, r[1] + 4.3, "NO2", 13, anchor="start") + chem(d[0], d[1] + 13.5, "NO2", 13)
    return _c24_struct("B", b, 140, 132, "Option (B): picric acid, 2,4,6-trinitrophenol")

def fig_2024_q78_optC():
    """Salicylic acid as printed: OH on top, COOH on the adjacent upper-right carbon."""
    b, v = _c24_ring(40, 74, 22, KEK_78)
    o = _c24_dir(v[0], 90, 18); r = _c24_dir(v[1], 30, 18)
    b += _c24_bond(v[0], o) + _c24_bond(v[1], r)
    b += chem(o[0], o[1] - 3.5, "OH", 13) + chem(r[0] + 2.5, r[1] + 4.3, "COOH", 13, anchor="start")
    return _c24_struct("C", b, 116, 104, "Option (C): salicylic acid, 2-hydroxybenzoic acid")

def fig_2024_q78_optD():
    """Phenol as printed: OH on the top carbon."""
    b, v = _c24_ring(34, 70, 22, KEK_78)
    o = _c24_dir(v[0], 90, 18)
    b += _c24_bond(v[0], o) + chem(o[0], o[1] - 3.5, "OH", 13)
    return _c24_struct("D", b, 70, 100, "Option (D): phenol")

def _c24_q79_chain(tail):
    """H3C–C≡C– drawn as one straight line (sp carbons are collinear), then the printed tail."""
    y = 21.7
    b = chem(6, 26, "H3C", 13, anchor="start")
    p0, c1, c2, c3 = (31.5, y), (58, y), (98, y), (124, y)
    b += _c24_bond(p0, c1) + _c24_bond(c1, c2, 3) + _c24_bond(c2, c3)
    c4 = _c24_dir(c3, -60, 22)
    if tail == "ene":
        b += _c24_bond(c3, c4, 2, side=1, trim=0.1)
    else:
        b += _c24_bond(c3, c4) + chem(c4[0] - 3, c4[1] + 13.5, "CH3", 13, anchor="start")
    return b

def fig_2024_q79_optA():
    return _c24_struct("A", _c24_q79_chain("ene"), 150, 50, "Option (A): H3C–C≡C–CH=CH2 (pent-1-en-3-yne), skeletal")

def fig_2024_q79_optB():
    return _c24_struct("B", _c24_q79_chain("ane"), 160, 62, "Option (B): H3C–C≡C–CH2–CH3 (pent-2-yne), skeletal")

def fig_2024_q79_optC():
    """cis CH3–CH=CH–C≡CH as printed: CH3 below the first alkene carbon; the C–C≡C run is one straight line."""
    v1 = (16, 46); v2 = _c24_dir(v1, 30, 22); c4 = _c24_dir(v2, -30, 22); c5 = _c24_dir(c4, -30, 24)
    b = chem(16, 80, "CH3", 13) + _c24_bond((16, 68.5), v1)
    b += _c24_bond(v1, v2, 2, side=-1, trim=0.12) + _c24_bond(v2, c4) + _c24_bond(c4, c5, 3)
    return _c24_struct("C", b, 86, 88, "Option (C): cis CH3–CH=CH–C≡CH (pent-3-en-1-yne), skeletal")

KEK_89 = (1, 3, 5)

def _c24_q89(group, aria):
    b, v = _c24_ring(32, 64, 22, KEK_89)
    c = _c24_dir(v[1], 30, 22); o = _c24_dir(c, 90, 18); e = _c24_dir(c, -30, 18)
    b += _c24_bond(v[1], c) + _c24_bond(c, o, 2, side=1, trim=0.1, gap=3.4) + _c24_bond(c, e)
    b += chem(o[0], o[1] - 3.5, "O", 13) + chem(e[0] + 2, e[1] + 8.5, group, 13, anchor="start")
    return _c24_struct(group, b, 130, 96, aria)

def fig_2024_q89_optB():
    return _c24_q89("OCH3", "Option (B): methyl benzoate, C6H5–CO–OCH3")

def fig_2024_q89_optD():
    return _c24_q89("CH3", "Option (D): acetophenone, C6H5–CO–CH3")

# ---- circuits ----
def _c24_w(p, q):
    return line(round(p[0], 2), round(p[1], 2), round(q[0], 2), round(q[1], 2), stroke="var(--fig-line)", sw=1.4)

def _c24_plate(c, d, half):
    """Cell plate: a <path> segment of half-length `half` through c, perpendicular to unit direction d."""
    nx, ny = -d[1], d[0]
    return (f'  <path d="M {round(c[0] - half*nx, 2)},{round(c[1] - half*ny, 2)} L {round(c[0] + half*nx, 2)},{round(c[1] + half*ny, 2)}" '
            f'stroke="var(--fig-line)" stroke-width="1.7" fill="none"/>\n')

def _c24_cell(p, q, pos, gap=6, long=11, short=6):
    """Cell on the wire p→q, centred at the midpoint: long plate (+) on the `pos` side ('p' or 'q').
    Pins are the two plate centres; wires run from p and q to them."""
    L = _m.hypot(q[0] - p[0], q[1] - p[1]); d = ((q[0] - p[0])/L, (q[1] - p[1])/L)
    m = ((p[0] + q[0])/2, (p[1] + q[1])/2)
    a = (round(m[0] - d[0]*gap/2, 2), round(m[1] - d[1]*gap/2, 2)); z = (round(m[0] + d[0]*gap/2, 2), round(m[1] + d[1]*gap/2, 2))
    la, lz = (long, short) if pos == "p" else (short, long)
    g = (f'  <g data-comp="cell" data-pins="{a[0]},{a[1]} {z[0]},{z[1]}">\n'
         + _c24_plate(a, d, la) + _c24_plate(z, d, lz) + '  </g>\n')
    return _c24_w(p, a) + g + _c24_w(z, q)

def fig_2024_q94():
    """Y network of cells exactly as printed (polarity from the 600-DPI plate crops: long plate = +)."""
    U, Lo = (150, 112), (150, 176)
    V1, T2, V2, T10 = (86, 46), (226, 34), (70, 236), (222, 236)
    b = _c24_cell(V1, U, "p") + _c24_cell(U, T2, "p") + _c24_cell(U, Lo, "p") + _c24_cell(V2, Lo, "q") + _c24_w(Lo, T10)
    b += dot(*V1, r=3.2) + dot(*T2, r=3.2) + dot(*V2, r=3.2) + dot(*T10, r=3.2)
    b += _p24_sub(76, 34, "V", "1", 14, italic=False) + mlabel(234, 38, "2V", 14, anchor="start")
    b += mlabel(102, 98, "4 V", 14, anchor="end") + mlabel(207, 74, "8 V", 14, anchor="start")
    b += mlabel(162, 149, "E", 14, anchor="start") + mlabel(98, 196, "8 V", 14, anchor="end")
    b += _p24_sub(62, 258, "V", "2", 14, italic=False) + mlabel(230, 241, "10 V", 14, anchor="start")
    return svg_plain(290, 266, b, "2024 Q94: Y network of cells 4 V, 8 V, E and 8 V between terminals V1, 2V, V2 and 10 V")

def _c24_diode(p, q):
    """Diode on a horizontal wire p→q with the triangle pointing from p (anode) to q (cathode)."""
    x1, x2, y = p[0], q[0], p[1]
    s = 1 if x2 > x1 else -1
    bx, tx = (x1 + x2)/2 - s*7, (x1 + x2)/2 + s*7
    return (f'  <g data-comp="D" data-pins="{x1},{y} {x2},{y}">\n'
            f'  <polygon points="{bx},{y - 8} {bx},{y + 8} {tx},{y}" stroke="var(--fig-line)" stroke-width="1.4" fill="none"/>\n'
            f'  <path d="M {tx},{y - 8} L {tx},{y + 8}" stroke="var(--fig-line)" stroke-width="1.7" fill="none"/>\n  </g>\n')

def _c24_res(p, q, n=4, amp=5):
    """Resistor group between pins p, q (horizontal or vertical zig-zag polyline)."""
    if p[1] == q[1]:
        z = _resistor(p[0], q[0], p[1], n, amp)
    else:
        step = (q[1] - p[1])/(2*n); pts = [p]
        for k in range(2*n):
            pts.append((p[0] + (amp if k % 2 == 0 else -amp), round(p[1] + step*(k + 0.5), 2)))
        pts.append(q)
        z = polyline(" ".join(f"{a},{b}" for a, b in pts), stroke="var(--fig-line)", sw=1.3)
    return f'  <g data-comp="R" data-pins="{p[0]},{p[1]} {q[0]},{q[1]}">\n{z}  </g>\n'

def fig_2024_q96():
    """Two-diode circuit as printed: 10 V (+ up) → D1 (→) → node X → 10 kΩ → D2 (←) → 15 V (+ down);
    X → 10 kΩ → Vo tap → 10 kΩ → bottom rail."""
    xl, xr, yt, yb, xX = 40, 330, 40, 214, 170
    W = _c24_w
    b = _c24_cell((xl, yb), (xl, yt), "q")                                   # + plate towards the top wire
    b += W((xl, yt), (104, yt)) + _c24_diode((104, yt), (126, yt)) + W((126, yt), (xX, yt))
    b += W((xX, yt), (194, yt)) + _c24_res((194, yt), (242, yt)) + W((242, yt), (264, yt))
    b += _c24_diode((286, yt), (264, yt)) + W((286, yt), (xr, yt))
    b += W((xr, yt), (xr, 96)) + _c24_cell((xr, 96), (xr, 112), "q") + W((xr, 112), (xr, yb))
    b += W((xX, yt), (xX, 62)) + _c24_res((xX, 62), (xX, 112)) + W((xX, 112), (xX, 132))
    b += W((xX, 132), (xX, 156)) + _c24_res((xX, 156), (xX, 204)) + W((xX, 204), (xX, yb))
    b += W((xX, 132), (246, 132)) + circle(249.5, 132, 3.5, stroke="var(--fig-line)", sw=1.3, fill="none")
    b += W((xl, yb), (xr, yb))
    b += _p24_sub(108, 24, "D", "1", 14, italic=False) + _p24_sub(266, 24, "D", "2", 14, italic=False)
    b += mlabel(218, 25, "10 kΩ", 13) + mlabel(184, 92, "10 kΩ", 13, anchor="start") + mlabel(184, 186, "10 kΩ", 13, anchor="start")
    b += mlabel(54, 132, "10 V", 13, anchor="start") + mlabel(344, 108, "15 V", 13, anchor="start")
    b += _p24_sub(258, 137, "V", "o", 14, italic=False)
    return svg_plain(390, 230, b, "2024 Q96: 10 V cell, D1, 10 kΩ, D2 and 15 V cell in a loop, with a 10 kΩ + 10 kΩ divider from the D1 node giving Vo")

def _c24_ground(x, y):
    g = f'  <g data-comp="GND" data-pins="{x},{y}">\n'
    for k, half in enumerate((10, 6.5, 3)):
        g += f'  <path d="M {x - half},{y + 4*k} L {x + half},{y + 4*k}" stroke="var(--fig-line)" stroke-width="1.4" fill="none"/>\n'
    return g + '  </g>\n'

def fig_2024_q97():
    """Op-amp circuit as printed: + input grounded; − input node fed by a 100 mA source (arrow up) and
    a 1 kΩ resistor to ground; 100 Ω feedback from Vo to the − input."""
    W = _c24_w
    xs, xr1, xp, ytop, ybot = 60, 108, 154, 96, 236
    b = W((xs, ytop), (200, ytop)) + W((xs, ytop), (xs, 149)) + W((xs, 171), (xs, ybot))
    b += (f'  <g data-comp="I" data-pins="{xs},171 {xs},149">\n'
          + circle(xs, 160, 11, stroke="var(--fig-line)", sw=1.4) +
          f'  <path d="M {xs},167 L {xs},154" stroke="var(--fig-line)" stroke-width="1.3" fill="none"/>\n'
          + _arrowhead(xs, 152, -90, 6) + '  </g>\n')
    b += W((xr1, ytop), (xr1, 142)) + _c24_res((xr1, 142), (xr1, 190)) + W((xr1, 190), (xr1, ybot))
    b += W((xs, ybot), (xp, ybot)) + W((xp, ybot), (xp, 136)) + W((xp, 136), (200, 136))
    b += W((168, ytop), (168, 40)) + W((168, 40), (218, 40)) + _c24_res((218, 40), (268, 40)) + W((268, 40), (334, 40)) + W((334, 40), (334, 116))
    b += (f'  <g data-comp="OA" data-in="200,{ytop} 200,136" data-out="270,116">\n'
          f'  <path d="M 200,76 L 270,116 L 200,156 Z" stroke="var(--fig-line)" stroke-width="1.5" fill="none"/>\n'
          + mlabel(209, ytop + 5, "−", 15) + mlabel(209, 141, "+", 14) + '  </g>\n')
    b += W((270, 116), (334, 116)) + dot(334, 116, r=3.2)
    b += _c24_ground(xs, ybot)
    b += mlabel(243, 26, "100 Ω", 13) + mlabel(44, 165, "100 mA", 13, anchor="end")
    b += mlabel(118, 162, "1", 13, anchor="start") + mlabel(116, 180, "kΩ", 13, anchor="start")
    b += _p24_sub(342, 121, "V", "o", 14, italic=False)
    return svg_plain(370, 256, b, "2024 Q97: inverting op-amp stage; 100 mA source and 1 kΩ from the − input to ground, 100 Ω feedback, + input grounded")

def _c24_xor(x, yc, bubble, r=17):
    """IEEE distinctive XOR/XNOR: extra back curve (the inputs end on it), shield body, optional bubble."""
    body = f"M {x + 6},{yc - r} Q {x + 6 + 0.55*r},{yc} {x + 6},{yc + r} Q {x + 6 + 1.5*r},{yc + r} {x + 6 + 2.3*r},{yc} Q {x + 6 + 1.5*r},{yc - r} {x + 6},{yc - r} Z"
    back = f"M {x},{yc - r} Q {x + 0.55*r},{yc} {x},{yc + r}"
    def on_back(dy):
        t = (dy + r)/(2*r); return round(x + 2*t*(1 - t)*0.55*r, 2)
    ins = f"{on_back(-8)},{yc - 8} {on_back(8)},{yc + 8}"
    xo = x + 6 + 2.3*r
    out = round(xo + 7, 2) if bubble else round(xo, 2)
    g = (f'  <g data-gate="{"XNOR" if bubble else "XOR"}" data-in="{ins}" data-out="{out},{yc}">\n'
         f'  <path d="{body}" stroke="var(--fig-line)" stroke-width="1.6" fill="none"/>\n'
         f'  <path d="{back}" stroke="var(--fig-line)" stroke-width="1.6" fill="none"/>\n')
    if bubble:
        g += f'  <circle cx="{round(xo + 3.5, 2)}" cy="{yc}" r="3.5" stroke="var(--fig-line)" stroke-width="1.4" fill="none"/>\n'
    return g + '  </g>\n', [tuple(map(float, p.split(","))) for p in ins.split()], (out, yc)

def _c24_nand3(x, yc, r=21):
    d = f"M {x},{yc - r} H {x + r} A {r} {r} 0 0 1 {x + r},{yc + r} H {x} Z"
    return (f'  <g data-gate="NAND" data-in="{x},{yc - 12} {x},{yc} {x},{yc + 12}" data-out="{x + 2*r + 7},{yc}">\n'
            f'  <path d="{d}" stroke="var(--fig-line)" stroke-width="1.6" fill="none"/>\n'
            f'  <circle cx="{x + 2*r + 3.5}" cy="{yc}" r="3.5" stroke="var(--fig-line)" stroke-width="1.4" fill="none"/>\n  </g>\n')

def fig_2024_q98():
    """Logic circuit as printed: XNOR(A, B), XOR(B, C) and C (looped round below) into a 3-input NAND → X."""
    W = _c24_w
    g1, i1, o1 = _c24_xor(120, 50, True)
    g2, i2, o2 = _c24_xor(120, 105, False)
    b = g1 + g2 + _c24_nand3(272, 100)
    b += W((34, i1[0][1]), i1[0]) + W((34, i1[1][1]), i1[1])                  # A, B
    b += W((84, i1[1][1]), (84, i2[0][1])) + W((84, i2[0][1]), i2[0])          # B tap → XOR
    b += W((34, i2[1][1]), i2[1])                                              # C → XOR
    b += W((66, i2[1][1]), (66, 150)) + W((66, 150), (248, 150)) + W((248, 150), (248, 112)) + W((248, 112), (272, 112))
    b += W(o1, (222, o1[1])) + W((222, o1[1]), (222, 88)) + W((222, 88), (272, 88))
    b += W(o2, (234, o2[1])) + W((234, o2[1]), (234, 100)) + W((234, 100), (272, 100))
    b += W((321, 100), (350, 100))
    b += mlabel(24, i1[0][1] + 5, "A", 14) + mlabel(24, i1[1][1] + 5, "B", 14) + mlabel(24, i2[1][1] + 5, "C", 14) + mlabel(362, 105, "X", 14)
    return svg_plain(380, 162, b, "2024 Q98: XNOR(A, B), XOR(B, C) and C feed a three-input NAND with output X")

# ---- 2022 figures ----

# ---------------------------------------------------------------------------
# JELET 2022 Batch B (Physics Q41–Q70): faithful redraws of the Set-A booklet figures (PDF pages 12–18
# read at 180 DPI, figures zoomed at 300–500 DPI). No captions (the booklet prints none); key elements carry
# data-role attributes so scripts/verify_solutions_sympy.py (_b22_qN) can read the geometry back.
# Q42 prints no figure (the old fig-2022-q42 "error bar" drawing was invented and is removed); Q49 prints only
# four option graphs (no stem figure). Colours: var(--fig-*) tokens only.
# ---------------------------------------------------------------------------
def _b22_axes(ox, oy, xr, yt, xl=None, yb=None):
    body = _p24_role(arrow(ox if xl is None else xl, oy, xr, oy, stroke="var(--fig-axis)", sw=1.2), "axis-h")
    body += _p24_role(arrow(ox, oy if yb is None else yb, ox, yt, stroke="var(--fig-axis)", sw=1.2), "axis-v")
    return body

def _b22_dash(x1, y1, x2, y2, role):
    return _p24_role(line(round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1), stroke="var(--fig-axis)", sw=0.9, dash="3,2.5"), role)

def _b22_hatch(x1, y1, x2, y2, side, n, ln=7):
    """Short slanted hatch strokes along a wall/floor segment; side = (dx, dy) unit offset of the hatching."""
    body = ""
    for j in range(n + 1):
        x = x1 + (x2 - x1)*j/n; y = y1 + (y2 - y1)*j/n
        body += line(round(x, 1), round(y, 1), round(x + side[0]*ln - side[1]*ln*0.6, 1), round(y + side[1]*ln + side[0]*ln*0.6, 1), stroke="var(--fig-line)", sw=0.8)
    return body

def _b22_dot(x, y, role, r=3.2, hollow=False):
    fill = "none" if hollow else "var(--fig-node)"
    return _p24_role(f'  <circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="var(--fig-node)" stroke-width="1.2"/>\n', role)

def _b22_dim(x, y1, y2, role):
    """Vertical double-headed dimension arrow."""
    body = _p24_role(line(x, y1, x, y2, stroke="var(--fig-line)", sw=1.0), role)
    return body + _arrowhead(x, y1, -90, 6, "var(--fig-line)") + _arrowhead(x, y2, 90, 6, "var(--fig-line)")

# ---- Q46: wall – spring k – block m on a hatched floor, force F to the right -------------------------
def fig_2022_q46():
    xw, yf = 34, 92
    body = _p24_role(line(xw, 22, xw, yf, stroke="var(--fig-line)", sw=1.5), "wall") + _b22_hatch(xw, 26, xw, yf, (-1, 0), 9)
    body += _p24_role(line(xw, yf, 272, yf, stroke="var(--fig-line)", sw=1.5), "floor") + _b22_hatch(xw, yf, 272, yf, (0, 1), 30)
    body += _p24_role(line(xw, 66, 86, 66, stroke="var(--fig-line)", sw=1.2), "lead-wall") + _p23_spring(86, 130, 70)
    body += _p24_role(line(130, 66, 172, 66, stroke="var(--fig-line)", sw=1.2), "lead-block")
    body += _p24_role(f'  <rect x="172" y="46" width="44" height="46" fill="none" stroke="var(--fig-line)" stroke-width="1.4"/>\n', "block")
    body += _p24_role(arrow(216, 66, 262, 66, stroke="var(--fig-line)", sw=1.3), "F")
    body += mlabel(108, 40, "k", 14) + mlabel(194, 72, "m", 14) + mlabel(268, 71, "F", 14, anchor="start")
    return svg_plain(290, 108, body, "2022 Q46: " + "a vertical hatched wall on the left and a hatched floor; a spring k joins the wall to a block m on the floor; a force F pulls the block to the right")

# ---- Q48: disc, centre C, P1 at the left end of the dashed horizontal diameter, P2 at the bottom --------
_P22_Q48 = dict(cx=130, cy=96, r=58)

def fig_2022_q48():
    g = _P22_Q48; cx, cy, r = g["cx"], g["cy"], g["r"]
    body = _p24_role(f'  <circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="var(--fig-line)" stroke-width="1.5"/>\n', "disc")
    body += _p24_role(line(cx - r - 18, cy, cx + r + 22, cy, stroke="var(--fig-axis)", sw=1.0, dash="4,3"), "diameter")
    ax = _m.radians(-40)                                        # the horizontal axis, drawn slanting through C
    body += _p24_role(line(round(cx - 100*_m.cos(ax), 1), round(cy - 100*_m.sin(ax), 1), round(cx - r*_m.cos(ax), 1), round(cy - r*_m.sin(ax), 1),
                           stroke="var(--fig-line)", sw=1.2), "axis-in")
    body += line(round(cx - r*_m.cos(ax), 1), round(cy - r*_m.sin(ax), 1), cx, cy, stroke="var(--fig-line)", sw=1.2)
    body += _p24_role(line(cx, cy, round(cx + 100*_m.cos(ax), 1), round(cy + 100*_m.sin(ax), 1), stroke="var(--fig-line)", sw=1.2), "axis-out")
    ra = _m.radians(-115)
    body += _p24_role(arrow(cx, cy, round(cx + r*_m.cos(ra), 1), round(cy + r*_m.sin(ra), 1), stroke="var(--fig-line)", sw=1.2), "radius")
    body += _b22_dot(cx, cy, "C", 3.0) + _b22_dot(cx - r, cy, "P1", 3.6) + _b22_dot(cx, cy + r, "P2", 3.6)
    body += path(f"M {cx - r - 3},{cy + 8} Q {cx - r - 6},{cy + 22} {cx - r + 1},{cy + 30}", stroke="var(--fig-line)", sw=1.1)
    body += _arrowhead(cx - r + 1, cy + 30, 60, 6, "var(--fig-line)")
    body += _p24_sub(cx - r - 16, cy - 8, "P", "1", 13, italic=False) + mlabel(cx - r + 14, cy - 8, "m", 13)
    body += mlabel(cx + 9, cy - 8, "C", 13) + mlabel(cx - 12, cy - r + 16, "R", 13) + mlabel(cx + 38, cy + 34, "M", 13)
    body += _p24_sub(cx - 6, cy + r + 20, "P", "2", 13, italic=False)
    return svg_plain(260, 196, body, "2022 Q48: " + "a disc of mass M with centre C; its horizontal axis is drawn slanting through C; the point mass m sits at P1, the left end of the dashed horizontal diameter; a radius R from C; a curved arrow at P1 points downward; P2 is the lowest point of the rim")

# ---- Q49: four |V(x)| option graphs (no stem figure in the booklet) ------------------------------------
_P22_Q49 = dict(ox=100, oy=100, xl=18, xr=186, yt=10)

def _p22_q49(fn, u0, u1, aria):
    g = _P22_Q49
    body = _b22_axes(g["ox"], g["oy"], g["xr"], g["yt"], xl=g["xl"])
    pts = [(g["ox"] + u, g["oy"] - fn(u)) for u in [u0 + (u1 - u0)*j/120 for j in range(121)]]
    body += _p24_poly(pts, "V-x", stroke="var(--fig-primary)", sw=1.6)
    body += mlabel(g["ox"] + 6, 20, "|V(x)|", 13, anchor="start") + mlabel(g["xr"] - 4, g["oy"] - 8, "x", 13, italic=True)
    return svg_plain(200, 116, body, aria)

def fig_2022_q49_optA():
    return _p22_q49(lambda u: 62*(1 - _m.exp(-(u/30)**2)), -78, 78, "2022 Q49 (A): |V(x)| versus x, zero at x = 0 rising on both sides to a constant level")
def fig_2022_q49_optB():
    return _p22_q49(lambda u: 18 + 0.012*u*u, -50, 50, "2022 Q49 (B): |V(x)| versus x, a U-shaped curve above the axis with its minimum at x = 0")
def fig_2022_q49_optC():
    return _p22_q49(lambda u: 32*_m.sqrt(max(0.0, 1 - (u/40)**2)), -40, 40, "2022 Q49 (C): |V(x)| versus x, a semicircular hump meeting the x-axis at two points")
def fig_2022_q49_optD():
    return _p22_q49(lambda u: 66/_m.sqrt(1 + (u/22)**2), -78, 78, "2022 Q49 (D): |V(x)| versus x, a bell-shaped curve with its maximum at x = 0 approaching the axis on both sides")

# ---- Q55: P–V, isobaric line with A and B ---------------------------------------------------------------
def fig_2022_q55():
    ox, oy = 40, 112
    body = _b22_axes(ox, oy, 214, 12)
    body += _p24_role(line(ox, 70, 232, 70, stroke="var(--fig-line)", sw=1.4), "isobar")
    body += _b22_dot(112, 70, "A", 3.6) + _b22_dot(162, 70, "B", 3.6)
    body += mlabel(112, 56, "A", 14) + mlabel(162, 56, "B", 14) + mlabel(ox + 12, 20, "P", 14) + mlabel(220, 104, "V", 14)
    return svg_plain(240, 124, body, "2022 Q55: " + "P versus V; a horizontal line at constant pressure with point A and, to its right, point B")

# ---- Q57: draining vessel (stem) + four d–x option graphs -----------------------------------------------
_P22_Q57 = dict(xl=80, xr=150, yt=44, yb=194, xliq=105, mu=4/3)

def _b22_eye(cx, cy):
    body = path(f"M {cx - 11},{cy} Q {cx},{cy - 9} {cx + 11},{cy} Q {cx},{cy + 9} {cx - 11},{cy} Z", stroke="var(--fig-line)", sw=1.2)
    return body + f'  <circle cx="{cx}" cy="{cy}" r="3.2" fill="var(--fig-line)"/>\n'

def fig_2022_q57():
    g = _P22_Q57; xl, xr, yt, yb = g["xl"], g["xr"], g["yt"], g["yb"]
    H = yb - yt; ys = yb - g["xliq"]; d = (H - g["xliq"]) + g["xliq"]/g["mu"]; yp = yt + d; cx = (xl + xr)/2
    body = _p24_role(f'  <rect x="{xl}" y="{ys}" width="{xr - xl}" height="{yb - ys}" fill="var(--fig-fill)" stroke="none"/>\n', "liquid")
    for yy in range(int(ys) + 7, yb - 2, 8):
        for xx in range(xl + 4, xr - 8, 12):
            body += path(f"M {xx},{yy} q 3,-3 6,0 q 3,3 6,0", stroke="var(--fig-axis)", sw=0.6)
    body += _p24_role(f'  <rect x="{xl}" y="{yt}" width="{xr - xl}" height="{H}" fill="none" stroke="var(--fig-line)" stroke-width="1.5"/>\n', "vessel")
    body += _p24_role(line(xl, ys, xr, ys, stroke="var(--fig-line)", sw=1.0), "surface")
    body += f'  <rect x="{xr}" y="{yb - 8}" width="8" height="8" fill="none" stroke="var(--fig-line)" stroke-width="1.1"/>\n'
    body += _b22_dot(cx, yb, "P", 3.8) + _b22_dot(cx, round(yp, 1), "Pimg", 5, hollow=True)
    body += _b22_eye(cx, 18) + mlabel(cx, 40, "Q", 12)
    body += _b22_dim(66, yt, yb, "dim-H") + _b22_dim(168, yt, round(yp, 1), "dim-d") + _b22_dim(192, ys, yb, "dim-x")
    body += mlabel(56, (yt + yb)/2 + 4, "H", 13) + mlabel(176, (yt + yp)/2 - 18, "d", 13, anchor="start") + mlabel(200, (ys + yb)/2 + 18, "x", 13, anchor="start")
    body += mlabel(cx, yb + 15, "P", 12) + mlabel(cx + 12, round(yp, 1) + 4, "P′", 12, anchor="start")
    return svg_plain(220, 214, body, "2022 Q57: " + "a vessel of height H viewed from Q above its top; liquid fills it to height x; the spot P at the bottom and its image P' at depth d below the top; a small outlet at the bottom right")

_P22_Q57G = dict(ox=44, oy=108, xH=92, dH=56, mu=1.6)

def _p22_q57(d0, dH, lab0, labH, aria):
    """d–x option graph: straight line from (0, d0) to (H, dH); values in units of H; labels as printed."""
    g = _P22_Q57G; ox, oy, s = g["ox"], g["oy"], g["dH"]
    body = _b22_axes(ox, oy, ox + 140, 10)
    x1 = ox + g["xH"]; y0 = round(oy - d0*s, 1); y1 = round(oy - dH*s, 1)
    body += _p24_poly([(ox, y0), (x1, y1)], "d-x", stroke="var(--fig-primary)", sw=1.6)
    body += _b22_dash(ox, y1, x1, y1, "guide-dH") + _b22_dash(x1, y1, x1, oy, "guide-xH")
    if lab0 != "O":
        body += mlabel(ox - 4, y0 + 4, lab0, 12, anchor="end")
    body += mlabel(ox - 4, y1 + 4, labH, 12, anchor="end") + mlabel(ox - 6, oy + 6, "O", 12, anchor="end")
    body += mlabel(x1, oy + 16, "H", 12) + mlabel(ox + 146, oy + 5, "x", 13, italic=True, anchor="start") + mlabel(ox + 10, 16, "d", 13, italic=True)
    return svg_plain(200, 128, body, aria)

def fig_2022_q57_optA():
    mu = _P22_Q57G["mu"]; return _p22_q57(1, mu, "H", "μH", "2022 Q57 (A): d versus x, straight line rising from H at x = 0 to μH at x = H")
def fig_2022_q57_optB():
    mu = _P22_Q57G["mu"]; return _p22_q57(1, 1/mu, "H", "H/μ", "2022 Q57 (B): d versus x, straight line falling from H at x = 0 to H/μ at x = H")
def fig_2022_q57_optC():
    mu = _P22_Q57G["mu"]; return _p22_q57(1/mu, 1, "H/μ", "H", "2022 Q57 (C): d versus x, straight line rising from H/μ at x = 0 to H at x = H")
def fig_2022_q57_optD():
    return _p22_q57(0, 1, "O", "H", "2022 Q57 (D): d versus x, straight line rising from the origin to H at x = H")

# ---- Q62: V–T cycle (stem, geometry as printed) + four P–V option graphs ------------------------------
# Printed stem (skew-corrected, 500-DPI zoom): T_A : T_B = 146 : 524 and V_A : V_B = 43 : 286 in booklet pixels,
# i.e. line AB extended meets the T-axis at T ≈ 0.54 T_A (it is not drawn through O). Reproduced at scale 0.33.
_P22_Q62 = dict(ox=40, oy=150, TA=48, VA=14, TB=173, VB=94)

def fig_2022_q62():
    g = _P22_Q62; ox, oy = g["ox"], g["oy"]
    A = (ox + g["TA"], oy - g["VA"]); B = (ox + g["TB"], oy - g["VB"]); C = (ox + g["TA"], oy - g["VB"])
    body = _b22_axes(ox, oy, 232, 10)
    for (p, q, role) in ((A, B, "AB"), (B, C, "BC"), (C, A, "CA")):
        pts = [(p[0] + (q[0] - p[0])*j/20, p[1] + (q[1] - p[1])*j/20) for j in range(21)]
        body += _p24_poly(pts, role, stroke="var(--fig-primary)", sw=1.6) + _arrow_on(pts, 0.55, 7, "var(--fig-primary)")
    body += mlabel(A[0] - 6, A[1] + 12, "A", 14) + mlabel(B[0] + 6, B[1] - 8, "B", 14) + mlabel(C[0] - 10, C[1] + 2, "C", 14)
    body += mlabel(ox - 12, oy + 12, "O", 14) + mlabel(ox - 12, 22, "V", 14) + mlabel(238, oy + 5, "T", 14, anchor="start")
    return svg_plain(252, 166, body, "2022 Q62: " + "V versus T with origin O; from A a straight line rises to B at the upper right, B to C runs horizontally left at constant V, C to A drops vertically at constant T; arrows A to B to C to A")

_P22_Q62G = dict(ox=30, oy=112)

def _p22_q62(segs, labels, aria):
    """segs: [(role, [(V, P), ...])] in axis units (px); drawn in the arrow direction."""
    g = _P22_Q62G; ox, oy = g["ox"], g["oy"]
    body = _b22_axes(ox, oy, 186, 10)
    for role, vp in segs:
        pts = [(round(ox + v, 1), round(oy - p, 1)) for v, p in vp]
        body += _p24_poly(pts, role, stroke="var(--fig-primary)", sw=1.6) + _arrow_on(pts, 0.5, 7, "var(--fig-primary)")
    for t, (v, p) in labels.items():
        body += mlabel(round(ox + v, 1), round(oy - p, 1), t, 13)
    body += mlabel(ox - 8, 16, "P", 13) + mlabel(180, oy - 8, "V", 13)
    return svg_plain(200, 126, body, aria)

def _iso(v0, v1, k, n=40):
    return [(v0 + (v1 - v0)*j/n, k/(v0 + (v1 - v0)*j/n)) for j in range(n + 1)]

def fig_2022_q62_optA():
    VA, PA, VB = 30, 85, 112; k = PA*VA
    ab = [(VA + (VB - VA)*j/40, PA*(VA/(VA + (VB - VA)*j/40))**0.35) for j in range(41)]
    PB = ab[-1][1]; PC = k/VB
    return _p22_q62([("AB", ab), ("BC", [(VB, PB), (VB, PC)]), ("CA", _iso(VB, VA, k))],
                    {"A": (VA - 4, PA + 8), "B": (VB, PB + 9), "C": (VB + 8, PC - 12)},
                    "2022 Q62 (A): P versus V; from A a curve falls gently to B, B to C vertical downward, a steeper curve returns from C to A")
def fig_2022_q62_optB():
    VA, PA, VC = 30, 85, 115; k = PA*VA; PB = k/VC
    return _p22_q62([("AB", [(VA, PA), (VA, PB)]), ("BC", [(VA, PB), (VC, PB)]), ("CA", _iso(VC, VA, k))],
                    {"A": (VA - 4, PA + 9), "B": (VA - 2, PB - 16), "C": (VC + 10, PB - 4)},
                    "2022 Q62 (B): P versus V; A to B vertical downward, B to C horizontal to the right, a curve returns from C to A")
def fig_2022_q62_optC():
    VA, PA, VB = 30, 80, 110; k = PA*VA; PC = k/VB
    return _p22_q62([("AB", [(VA, PA), (VB, PA)]), ("BC", [(VB, PA), (VB, PC)]), ("CA", _iso(VB, VA, k))],
                    {"A": (VA - 4, PA + 8), "B": (VB, PA + 8), "C": (VB + 4, PC - 16)},
                    "2022 Q62 (C): P versus V; A to B horizontal to the right, B to C vertical downward, a curve returns from C to A")
def fig_2022_q62_optD():
    VA, PA, VB = 30, 80, 110; PC = PA*VA/VB
    ca = [(VB + (VA - VB)*j/20, PC + (PA - PC)*j/20) for j in range(21)]
    return _p22_q62([("AB", [(VA, PA), (VB, PA)]), ("BC", [(VB, PA), (VB, PC)]), ("CA", ca)],
                    {"A": (VA - 4, PA + 8), "B": (VB, PA + 8), "C": (VB + 4, PC - 16)},
                    "2022 Q62 (D): P versus V; A to B horizontal to the right, B to C vertical downward, a straight sloping line returns from C to A")

# ---- Q68: stone m with v0 along a dashed line, vertical stick, CM a distance h below the line ---------
def fig_2022_q68():
    xs, yl, ycm = 150, 48, 120
    half = round((ycm - yl)*_m.sqrt(6)/2, 1)                    # stick drawn with h = L/sqrt(6), CM at its middle
    top, bot = ycm - half, ycm + half
    body = _p24_role(f'  <rect x="{xs - 3}" y="{top}" width="6" height="{bot - top}" fill="var(--fig-fill)" stroke="var(--fig-line)" stroke-width="1.2"/>\n', "stick")
    body += _p24_role(line(84, yl, 240, yl, stroke="var(--fig-axis)", sw=0.9, dash="3,2.5"), "path")
    body += _b22_dot(80, yl, "stone", 3.6) + _b22_dot(xs, ycm, "CM", 3.0)
    body += _p24_role(arrow(92, 36, 124, 36, stroke="var(--fig-line)", sw=1.2), "v0")
    body += _p24_role(line(128, yl + 2, 128, ycm, stroke="var(--fig-line)", sw=1.0), "h")
    body += line(128, yl + 2, 133, yl + 2, stroke="var(--fig-line)", sw=1.0) + line(128, ycm, 133, ycm, stroke="var(--fig-line)", sw=1.0)
    body += mlabel(70, yl + 5, "m", 13) + _p24_sub(100, 28, "V", "0", 12, italic=False) + mlabel(118, (yl + ycm)/2 + 4, "h", 13)
    body += mlabel(xs + 10, ycm + 5, "CM", 13, anchor="start")
    return svg_plain(250, 216, body, "2022 Q68: " + "a stone m moving right with speed v0 along a dashed horizontal line meeting a vertical stick; the stick's centre of mass CM is a distance h below that line")

# ---- Q69: O, I2, IF, lens, plane mirror, I1 on the principal axis (positions as printed, not to scale) --
def fig_2022_q69():
    ya = 62; xs = dict(O=60, I2=104, IF=128, lens=158, mirror=206, I1=250)
    body = _p24_role(arrow(20, ya, 344, ya, stroke="var(--fig-line)", sw=1.1), "axis")
    body += _p24_role(f'  <ellipse cx="{xs["lens"]}" cy="{ya}" rx="6" ry="44" fill="var(--fig-fill)" stroke="var(--fig-line)" stroke-width="1.2"/>\n', "lens")
    body += _p24_role(line(xs["mirror"], 12, xs["mirror"], 112, stroke="var(--fig-line)", sw=1.8), "mirror") + _b22_hatch(xs["mirror"], 14, xs["mirror"], 110, (1, 0), 14, 5)
    for k in ("O", "I2", "IF", "I1"):
        body += _b22_dot(xs[k], ya, k, 3.4)
    body += mlabel(xs["O"], ya - 12, "O", 13) + _p24_sub(xs["I2"] - 4, ya - 12, "I", "2", 13, italic=False)
    body += _p24_sub(xs["IF"] - 4, ya - 12, "I", "F", 13, italic=False) + _p24_sub(xs["I1"] - 4, ya - 12, "I", "1", 13, italic=False)
    body += _b22_dash(xs["O"], ya + 4, xs["O"], 134, "drop-O")
    yd = 124
    body += _p24_role(line(xs["O"], yd, xs["lens"], yd, stroke="var(--fig-line)", sw=1.0), "dim-30")
    body += _arrowhead(xs["O"], yd, 180, 6, "var(--fig-line)") + _arrowhead(xs["lens"], yd, 0, 6, "var(--fig-line)")
    body += _p24_role(line(xs["lens"], yd, xs["mirror"], yd, stroke="var(--fig-line)", sw=1.0), "dim-10")
    body += _arrowhead(xs["lens"], yd, 180, 6, "var(--fig-line)") + _arrowhead(xs["mirror"], yd, 0, 6, "var(--fig-line)")
    body += mlabel((xs["O"] + xs["lens"])/2, yd + 16, "30 cm", 12) + mlabel((xs["lens"] + xs["mirror"])/2, yd + 16, "10 cm", 12)
    return svg_plain(356, 148, body, "2022 Q69: " + "principal axis with object O, points I2 and IF, a biconvex lens, a plane mirror 10 cm to the right of the lens and I1 beyond the mirror; O is 30 cm to the left of the lens")

def fig_2022_q93():
    """Torque-speed curve with operating points W, X, Y, Z."""
    body = ""
    body += label(40, 25, "Torque-Speed curve", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-line)", sw=1.5)
    body += line(40, 40, 40, 160, stroke="var(--fig-line)", sw=1.5)
    # torque-speed curve (hyperbolic-like)
    body += path("M 40 150 C 60 150, 80 100, 100 70 C 120 50, 140 45, 180 40", stroke="var(--fig-primary)", sw=2)
    # operating points
    for x, y, name in [(60, 130, "W"), (100, 80, "X"), (140, 55, "Y"), (180, 42, "Z")]:
        body += dot(x, y, 4, fill="var(--fig-danger)")
        body += label(x+8, y-5, name, 10, "var(--fig-danger-soft)")
    body += label(30, 165, "Speed", 9, "var(--fig-axis)")
    body += label(20, 50, "Torque", 9, "var(--fig-axis)")
    return svg_wrap(240, 200, body, "2022 Q93: Torque-speed curve")

def fig_2022_q96():
    """Circuit with voltage source and output v0(t)."""
    body = ""
    body += label(40, 25, "Circuit diagram", 10)
    # voltage source (circle with sine)
    body += circle(80, 100, 25, stroke="var(--fig-primary)", sw=2)
    body += label(80, 100, "Vm sin ωt", 7, "var(--fig-text)", "middle")
    # wires
    body += line(80, 75, 80, 50, stroke="var(--fig-primary)", sw=1.5)
    body += line(80, 50, 160, 50, stroke="var(--fig-primary)", sw=1.5)
    body += line(160, 50, 160, 75, stroke="var(--fig-primary)", sw=1.5)
    body += line(160, 75, 160, 125, stroke="var(--fig-primary)", sw=1.5)
    body += line(160, 125, 80, 125, stroke="var(--fig-primary)", sw=1.5)
    body += line(80, 125, 80, 100, stroke="var(--fig-primary)", sw=1.5)
    # output marker
    body += label(160, 40, "v₀(t)", 9, "var(--fig-danger)", "middle")
    return svg_wrap(240, 180, body, "2022 Q96: Circuit diagram")

def fig_2022_q97():
    """Comparator with sinusoidal input and reference 3V."""
    body = ""
    body += label(40, 25, "Comparator circuit", 10)
    # comparator symbol (triangle)
    polygon_points = "120,70 160,100 120,130"
    body += f'  <polygon points="{polygon_points}" fill="none" stroke="var(--fig-primary)" stroke-width="2"/>\n'
    body += label(140, 150, "Comparator", 9, "var(--fig-axis)", "middle")
    # input sine wave
    body += path("M 30 100 Q 50 70, 70 100 T 110 100", stroke="var(--fig-danger)", sw=1.5)
    body += label(25, 95, "vᵢ", 9, "var(--fig-danger-soft)")
    # reference line at 3V
    body += line(30, 115, 110, 115, stroke="var(--fig-secondary)", sw=1.5, dash="3,3")
    body += label(30, 128, "3V ref", 8, "var(--fig-secondary-soft)")
    # output
    body += arrow(160, 100, 210, 100, stroke="var(--fig-accent)", label="v₀", label_pos=(215, 95))
    return svg_wrap(240, 180, body, "2022 Q97: Comparator")

def fig_2022_q98():
    """Boolean circuit with inputs A,B,C,D,E,F,G."""
    body = ""
    body += label(40, 25, "Boolean circuit", 10)
    # input labels
    inputs = [("A", 50), ("B", 80), ("C", 110), ("D", 140), ("E", 170), ("F", 200), ("G", 230)]
    for name, x in inputs:
        body += line(x, 50, x, 80, stroke="var(--fig-primary)", sw=1.5)
        body += dot(x, 50, 3, fill="var(--fig-primary)")
        body += label(x, 42, name, 10, "var(--fig-text)", "middle")
    # gate boxes
    body += line(50, 80, 50, 120, stroke="var(--fig-primary)", sw=1.5)
    body += line(80, 80, 80, 120, stroke="var(--fig-primary)", sw=1.5)
    body += line(110, 80, 110, 120, stroke="var(--fig-primary)", sw=1.5)
    body += rect_(50, 120, 60, 25, "var(--fig-secondary)")
    body += label(80, 133, "+", 10, "var(--fig-secondary-soft)", "middle")
    body += line(110, 80, 140, 80, stroke="var(--fig-primary)", sw=1.5)
    body += line(140, 80, 140, 120, stroke="var(--fig-primary)", sw=1.5)
    body += line(170, 80, 170, 120, stroke="var(--fig-primary)", sw=1.5)
    body += rect_(140, 120, 60, 25, "var(--fig-accent)")
    body += label(170, 133, "·", 10, "var(--fig-accent-tint)", "middle")
    body += line(200, 80, 200, 120, stroke="var(--fig-primary)", sw=1.5)
    body += line(230, 80, 230, 120, stroke="var(--fig-primary)", sw=1.5)
    body += rect_(200, 120, 60, 25, "var(--fig-danger)")
    body += label(230, 133, "+", 10, "var(--fig-danger-soft)", "middle")
    # output
    body += line(80, 145, 80, 160, stroke="var(--fig-primary)", sw=1.5)
    body += line(170, 145, 170, 160, stroke="var(--fig-primary)", sw=1.5)
    body += line(80, 160, 170, 160, stroke="var(--fig-primary)", sw=1.5)
    body += arrow(170, 160, 210, 160, stroke="var(--fig-accent)", label="out", label_pos=(215, 155))
    return svg_wrap(260, 200, body, "2022 Q98: Boolean circuit")

def fig_2022_q99():
    """Transistor circuit with Vcc, Ic, Vcb, 100Ω."""
    body = ""
    body += label(40, 25, "Transistor circuit", 10)
    # Vcc top
    body += line(60, 40, 180, 40, stroke="var(--fig-primary)", sw=2)
    body += label(55, 32, "Vcc", 10, "var(--fig-text)")
    # resistor 100Ω
    body += line(80, 40, 80, 70, stroke="var(--fig-primary)", sw=1.5)
    body += rect_(75, 70, 10, 20, "var(--fig-accent)")
    body += label(70, 88, "100Ω", 8, "var(--fig-accent-tint)", "middle")
    body += line(80, 90, 80, 120, stroke="var(--fig-primary)", sw=1.5)
    # transistor (circle)
    body += circle(120, 110, 25, stroke="var(--fig-primary)", sw=2)
    body += label(120, 110, "Q", 10, "var(--fig-text)", "middle")
    # collector, base, emitter
    body += line(80, 90, 120, 90, stroke="var(--fig-primary)", sw=1.5)
    body += line(145, 110, 180, 110, stroke="var(--fig-primary)", sw=1.5)
    body += label(150, 100, "Ic", 9, "var(--fig-danger)")
    body += label(150, 122, "Vcb", 9, "var(--fig-secondary)")
    body += line(120, 135, 120, 160, stroke="var(--fig-primary)", sw=1.5)
    body += label(125, 170, "Emitter", 8, "var(--fig-axis)")
    return svg_wrap(240, 200, body, "2022 Q99: Transistor circuit")

def rect_(x, y, w, h, color="var(--fig-primary)"):
    return f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{color}" stroke-width="1.5"/>\n'

# ---- 2023 figures ----
# ---------------------------------------------------------------------------
# JELET 2023 Batch B (Physics Q41–Q70): faithful redraws of the Set-A booklet figures
# (PDF pages 10–17 read at 180 DPI, figures cropped at 300 DPI).  No captions (the booklet
# prints none); key elements carry data-role / data-comp attributes so that
# scripts/verify_solutions_sympy.py can read the geometry and circuit netlists back.
# Colours: var(--fig-*) tokens only.
# ---------------------------------------------------------------------------
_P23_Q42 = dict(ox=(40, 238), oy=150, ts=30, xs=30, ys=21)   # two panels: x(m)-t(s) and y(m)-t(s)

def _p23_dash(x1, y1, x2, y2, role):
    return _p24_role(line(round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1), stroke="var(--fig-axis)", sw=0.9, dash="3,2.5"), role)

def _p23_q42_panel(k, ox, vs, fn, tmax, guides, vticks, vname):
    g = _P23_Q42; oy, ts = g["oy"], g["ts"]
    P = lambda t, v: (ox + t*ts, oy - v*vs)
    body = _p24_role(arrow(ox, oy, ox + 150, oy, stroke="var(--fig-axis)", sw=1.2), f"{k}-axis-t")
    body += _p24_role(arrow(ox, oy, ox, 22, stroke="var(--fig-axis)", sw=1.2), f"{k}-axis-v")
    body += _p24_poly([P(t, fn(t)) for t in [tmax*j/60 for j in range(61)]], f"{k}-t", sw=1.6)
    for t in guides:
        x, y = P(t, fn(t))
        body += _p23_dash(ox, y, x, y, f"guide-{k}-v{fn(t):g}") + _p23_dash(x, y, x, oy, f"guide-{k}-t{t:g}")
    body += line(ox + 3*ts, oy - 5, ox + 3*ts, oy, stroke="var(--fig-axis)", sw=1.0)
    for v in vticks:
        body += mlabel(ox - 9, round(oy - v*vs + 4, 1), f"{v:g}", 12)
    for t in (1, 2, 3):
        body += mlabel(ox + t*ts, oy + 15, str(t), 12)
    body += mlabel(ox - 10, oy + 6, "0", 12)
    body += mlabel(ox + 156, oy + 5, "t(s)", 13, anchor="start")
    body += mlabel(ox, 14, vname, 13) if vname else ""
    return body

def fig_2023_q42():
    """Q42 as printed: x = t (straight line through the origin) and y = t² (parabola) with dashed guides."""
    g = _P23_Q42
    body = _p23_q42_panel("x", g["ox"][0], g["xs"], lambda t: t, 3.8, [1, 2], [1, 2], "")
    body += mlabel(g["ox"][0] - 8, 14, "x", 13, italic=True, anchor="end") + mlabel(g["ox"][0] - 8, 14, "(m)", 13, anchor="start")
    body += _p23_q42_panel("y", g["ox"][1], g["ys"], lambda t: t*t, 2.4, [1, 2], [1, 4], "y(m)")
    return svg_plain(430, 172, body, "2023 Q42: " + "two graphs; left x in m versus t in s, a straight line from the origin through (1, 1) and (2, 2); right y in m versus t in s, a curve from the origin through (1, 1) and (2, 4); dashed guides at those points")

_P23_Q48 = dict(ox=50, oy=176, va=104, vb=156, pu=40)          # V_A, V_B (px from O); 1 P = 40 px

def fig_2023_q48():
    """Q48 as printed: A (3P) joined to B (2P) by the isotherm and to C (P) by the steeper adiabat;
    C→B vertical.  Drawn exactly: P·V constant on BA (V_B/V_A = 3/2) and P·V^γ constant on CA."""
    g = _P23_Q48; ox, oy, va, vb, pu = g["ox"], g["oy"], g["va"], g["vb"], g["pu"]
    gam = _m.log(3)/_m.log(vb/va)
    X = lambda v: ox + v; Y = lambda p: oy - p*pu
    body = _p24_role(arrow(ox, oy, ox, 18, stroke="var(--fig-axis)", sw=1.2), "p-axis")
    body += _p24_role(arrow(ox, oy, 240, oy, stroke="var(--fig-axis)", sw=1.2), "v-axis")
    body += path(f"M {ox + 165},{oy + 16} L {ox + 182},{oy + 16}", stroke="var(--fig-text)", sw=0.9) + _arrowhead(ox + 184, oy + 16, 0, 5, "var(--fig-text)")
    iso = [(X(v), Y(3*va/v)) for v in [vb - (vb - va)*j/50 for j in range(51)]]                  # B -> A
    adi = [(X(v), Y(3*(va/v)**gam)) for v in [vb - (vb - va)*j/50 for j in range(51)]]          # C -> A
    body += _p24_poly(iso, "isothermal", stroke="var(--fig-primary)", sw=1.5) + _arrow_on(iso, 0.86, 7, "var(--fig-primary)")
    body += _p24_poly(adi, "adiabatic", stroke="var(--fig-primary)", sw=1.5) + _arrow_on(adi, 0.62, 7, "var(--fig-primary)")
    body += _p24_role(line(X(vb), Y(1), X(vb), Y(2), stroke="var(--fig-primary)", sw=1.5), "CB") + _arrowhead(X(vb), Y(1.55), -90, 7, "var(--fig-primary)")
    for p, x, lab in ((3, X(va), "3P"), (2, X(vb), "2P"), (1, X(vb), "P")):
        body += _p23_dash(ox, Y(p), x, Y(p), f"level-{lab}") + mlabel(ox - 6, Y(p) + 5, lab, 13, anchor="end")
    body += mlabel(X(va), Y(3) - 8, "A", 13) + mlabel(X(vb) + 5, Y(2) + 2, "B", 13, anchor="start") + mlabel(X(vb) + 5, Y(1) + 8, "C", 13, anchor="start")
    body += mlabel(ox - 6, 22, "P", 13, anchor="end") + mlabel(ox - 10, oy + 16, "O", 13) + mlabel(ox + 190, oy + 21, "V", 13, anchor="start")
    return svg_plain(250, 205, body, "2023 Q48: " + "P–V diagram; dashed levels 3P, 2P and P; A at 3P joined by one curve to B at 2P and by a steeper curve to C at P; B directly above C with an arrow from C up to B; both curves carry arrows towards A")

def fig_2023_q56():
    """Q56 as printed: wide cylinder (diameter D1, current I1) tapering to a narrow one (D2, I2).
    Proportions follow the booklet drawing (not to scale)."""
    cy, R1, R2 = 62, 36, 16
    xl, xs0, xs1, xr = 36, 196, 222, 330
    body = f'  <ellipse cx="{xl}" cy="{cy}" rx="11" ry="{R1}" stroke="var(--fig-line)" stroke-width="1.4" fill="none" data-role="end-1"/>\n'
    body += line(xl, cy - R1, xs0, cy - R1, stroke="var(--fig-line)", sw=1.4) + line(xl, cy + R1, xs0, cy + R1, stroke="var(--fig-line)", sw=1.4)
    body += path(f"M {xs0},{cy - R1} C {xs0 + 14},{cy - R1} {xs1 - 12},{cy - R2} {xs1},{cy - R2}", stroke="var(--fig-line)", sw=1.4)
    body += path(f"M {xs0},{cy + R1} C {xs0 + 14},{cy + R1} {xs1 - 12},{cy + R2} {xs1},{cy + R2}", stroke="var(--fig-line)", sw=1.4)
    body += line(xs1, cy - R2, xr, cy - R2, stroke="var(--fig-line)", sw=1.4) + line(xs1, cy + R2, xr, cy + R2, stroke="var(--fig-line)", sw=1.4)
    body += f'  <ellipse cx="{xr}" cy="{cy}" rx="6" ry="{R2}" stroke="var(--fig-line)" stroke-width="1.4" fill="none" data-role="end-2"/>\n'
    body += f'  <ellipse cx="262" cy="{cy}" rx="5" ry="{R2}" stroke="var(--fig-line)" stroke-width="1.1" fill="none" stroke-dasharray="1.5,2"/>\n'
    body += _p24_role(line(54, cy - R1 + 1, 54, cy + R1 - 1, stroke="var(--fig-line)", sw=1.0), "D1") + _arrowhead(54, cy - R1 + 1, -90, 6) + _arrowhead(54, cy + R1 - 1, 90, 6)
    body += _p24_role(line(250, cy - R2 + 1, 250, cy + R2 - 1, stroke="var(--fig-line)", sw=1.0), "D2") + _arrowhead(250, cy - R2 + 1, -90, 5) + _arrowhead(250, cy + R2 - 1, 90, 5)
    body += _p24_role(arrow(120, cy - 4, 146, cy - 4, stroke="var(--fig-line)", sw=1.2), "I1") + _p24_role(arrow(272, cy, 300, cy, stroke="var(--fig-line)", sw=1.2), "I2")
    body += _p24_sub(58, cy + 8, "D", "1", 13, italic=False) + _p24_sub(126, cy - 12, "I", "1", 13, italic=False)
    body += _p24_sub(228, cy + 4, "D", "2", 13, italic=False) + _p24_sub(274, cy - 6, "I", "2", 13, italic=False)
    return svg_plain(350, 124, body, "2023 Q56: " + "a cylindrical conductor narrowing from a wide left part of diameter D1 carrying current I1 to a narrow right part of diameter D2 carrying current I2; current arrows to the right")

def _p23_galvanometer(c, r=14):
    """Galvanometer G: circle with a diagonal pointer arrow (paths only, so it never joins wire nets)."""
    x, y = c
    g = f'  <g data-comp="G" data-pins="{x - r},{y} {x + r},{y}">\n'
    g += f'  <circle cx="{x}" cy="{y}" r="{r}" stroke="var(--fig-line)" stroke-width="1.4" fill="none"/>\n'
    g += f'  <path d="M {x - 7},{y + 7} L {x + 6},{y - 6}" stroke="var(--fig-line)" stroke-width="1.2" fill="none"/>\n'
    g += _arrowhead(x + 8, y - 8, -45, 6) + '  </g>\n'
    return g

def fig_2023_q60():
    """Q60 as printed: 12 V cell (+ up) on the left, 500 Ω on the top wire to junction X, R from X to the
    bottom rail, X → G → right wire → 2 V cell (+ up) → bottom rail."""
    xl, xX, xr, yt, yb = 50, 200, 340, 50, 186
    W = _c24_w
    b = _c24_cell((xl, yb), (xl, yt), "q")
    b += W((xl, yt), (96, yt)) + _c24_res((96, yt), (150, yt)) + W((150, yt), (xX, yt))
    b += W((xX, yt), (xX, 92)) + _c24_res((xX, 92), (xX, 146)) + W((xX, 146), (xX, yb))
    b += W((xX, yt), (252, yt)) + _p23_galvanometer((266, yt)) + W((280, yt), (xr, yt))
    b += _c24_cell((xr, yb), (xr, yt), "q")
    b += W((xl, yb), (xr, yb))
    b += mlabel(123, 34, "500Ω", 14) + mlabel(266, 26, "G", 14) + mlabel(214, 124, "R", 14, anchor="start")
    b += mlabel(32, 123, "12V", 14, anchor="end") + mlabel(358, 123, "2V", 14, anchor="start")
    return svg_plain(400, 200, b, "2023 Q60: " + "12 V cell on the left; 500 Ω on the top wire to a junction; R from the junction to the bottom wire; galvanometer G from the junction to a 2 V cell on the right branch")

_P23_Q61 = dict(ox=44, oy=150, xs=56, ys=480, xmax=3.6)

def fig_2023_q61():
    """Q61 as printed: Pr/E² versus R/r from O — rises to the maximum M (dashed drop line), then falls and levels off.
    The curve is the load-power function (R/r)/(1 + R/r)² sampled densely (no tick values are printed)."""
    g = _P23_Q61; ox, oy, xs, ys = g["ox"], g["oy"], g["xs"], g["ys"]
    f = lambda u: u/(1 + u)**2
    body = _p24_role(arrow(ox, oy, ox, 16, stroke="var(--fig-axis)", sw=1.2), "axis-v")
    body += _p24_role(arrow(ox, oy, ox + 250, oy, stroke="var(--fig-axis)", sw=1.2), "axis-h")
    pts = [(ox + u*xs, oy - f(u)*ys) for u in [g["xmax"]*j/90 for j in range(91)]]
    body += _p24_poly(pts, "power-curve", sw=1.6)
    mx, my = ox + 1*xs, oy - f(1)*ys
    body += _p23_dash(mx, my, mx, oy, "M-drop")
    body += mlabel(mx, my - 7, "M", 13) + mlabel(ox - 2, oy + 18, "O", 13)
    body += mlabel(ox - 16, 22, "Pr", 12) + line(ox - 26, 26, ox - 6, 26, stroke="var(--fig-text)", sw=0.8) + mlabel(ox - 16, 40, "E²", 12)
    body += mlabel(ox + 246, oy - 8, "R / r", 13, anchor="start")
    return svg_plain(320, 170, body, "2023 Q61: " + "graph of Pr/E² versus R/r from the origin O; the curve rises to a maximum at M, marked by a dashed line down to the R/r axis, then falls and levels off")

def _p23_spring(x1, x2, y, loops=4, r=5):
    """Booklet spring: a row of small loops between straight leads (prolate cycloid)."""
    pitch = (x2 - x1)/loops; pts = []
    for j in range(loops*24 + 1):
        s = j/24*2*_m.pi
        pts.append((x1 + pitch*s/(2*_m.pi) - 0.55*r*_m.sin(s), y - r*(1 - _m.cos(s))*0.9))
    return _p24_poly(pts, "spring", stroke="var(--fig-line)", sw=1.2)

def fig_2023_q66():
    """Q66 as printed: wall on the left, horizontal floor, spring (loops) to the 4 Kg block, force F to the right."""
    yf, xw = 120, 30
    body = _p24_role(line(xw, 18, xw, yf, stroke="var(--fig-line)", sw=1.5), "wall")
    body += _p24_role(line(xw, yf, 320, yf, stroke="var(--fig-line)", sw=1.5), "floor")
    body += line(xw, 104, 76, 104, stroke="var(--fig-line)", sw=1.2) + _p23_spring(76, 120, 108)
    body += line(120, 104, 186, 104, stroke="var(--fig-line)", sw=1.2)
    body += _p24_role(f'  <rect x="186" y="84" width="56" height="36" fill="none" stroke="var(--fig-line)" stroke-width="1.4"/>\n', "block")
    body += mlabel(214, 76, "4 Kg", 14)
    body += _p24_role(arrow(242, 104, 286, 104, stroke="var(--fig-line)", sw=1.3), "F") + mlabel(292, 109, "F", 14, anchor="start")
    return svg_plain(330, 132, body, "2023 Q66: " + "a 4 Kg block on a horizontal floor joined by a spring to a vertical wall on the left; a force F pulls the block to the right")

def fig_2023_q68():
    """Q68 as printed: a single loop with capacitor C (left), resistor R (top) and an open switch S (bottom); no source."""
    xl, xr, yt, yb = 60, 240, 34, 116
    W = _c24_w
    b = W((xl, yt), (xl, 70)) + W((xl, 78), (xl, yb))
    b += (f'  <g data-comp="C" data-pins="{xl},70 {xl},78">\n'
          + _c24_plate((xl, 70), (0, 1), 11) + _c24_plate((xl, 78), (0, 1), 11) + '  </g>\n')
    b += W((xl, yt), (124, yt)) + _c24_res((124, yt), (176, yt)) + W((176, yt), (xr, yt))
    b += W((xr, yt), (xr, yb)) + W((xr, yb), (166, yb))
    b += W((xl, yb), (130, yb))
    b += (f'  <g data-comp="S" data-pins="130,{yb} 166,{yb}" data-state="open">\n'
          f'  <path d="M 130,{yb} L 150,{yb - 16}" stroke="var(--fig-line)" stroke-width="1.4" fill="none"/>\n  </g>\n')
    b += mlabel(150, 20, "R", 14) + mlabel(36, 80, "C", 14) + mlabel(154, 134, "S", 14)
    return svg_plain(270, 142, b, "2023 Q68: " + "single loop: capacitor C on the left side, resistor R on the top wire, an open switch S on the bottom wire")

def fig_2023_q70():
    """Q70 as printed: slit barrier with S1 above S2 (separation b), screen at distance d; P on the screen
    level with S1; dashed rays S1→P (horizontal, labelled d) and S2→P."""
    xb, xs, y1, y2 = 70, 236, 76, 104
    body = _p24_role(line(xb, 18, xb, y1 - 4, stroke="var(--fig-line)", sw=1.5), "barrier")
    body += line(xb, y1 + 4, xb, y2 - 4, stroke="var(--fig-line)", sw=1.5) + line(xb, y2 + 4, xb, 160, stroke="var(--fig-line)", sw=1.5)
    body += _p24_role(line(xs, 22, xs, 158, stroke="var(--fig-line)", sw=1.5), "screen")
    body += _p23_dash(xb, y1, xs, y1, "S1P") + _p23_dash(xb, y2, xs, y1, "S2P")
    body += _p24_role(line(44, y1 + 2, 44, y2 - 2, stroke="var(--fig-line)", sw=1.0), "b") + _arrowhead(44, y1 + 1, -90, 5) + _arrowhead(44, y2 - 1, 90, 5)
    body += mlabel(36, 95, "b", 13) + _p24_sub(50, y1 + 2, "S", "1", 12, italic=False) + _p24_sub(50, y2 + 8, "S", "2", 12, italic=False)
    body += mlabel(152, y1 - 6, "d", 13) + mlabel(244, y1 + 5, "P", 13, anchor="start") + mlabel(234, 16, "screen", 13, anchor="start")
    return svg_plain(290, 172, body, "2023 Q70: " + "Young's double slit; slits S1 above S2 separated by b in a vertical barrier; a screen at distance d; point P on the screen level with S1; dashed lines S1P and S2P")

# ---------------------------------------------------------------------------
# JELET 2023 Batch C (Chemistry Q71–Q90 + FEEE Q91–Q100): faithful redraws of the Set-A booklet
# figures (PDF pages 20, 22, 23 read at 180 DPI, figures cropped at 400 DPI).  No captions (the
# booklet prints none).  Circuit parts are <g data-comp> groups whose internals are <path>/<polyline>
# (never var(--fig-line) <line>s), so scripts/verify_solutions_sympy.py can rebuild the wire netlist;
# the Q84 structure keeps every bond as a data-role="bond" line between its two group labels.
# Colours: var(--fig-*) tokens only.
# ---------------------------------------------------------------------------
def _c23_group_text(x, y, grp, size=14):
    """Condensed-formula group label ('H3C', 'CH2', ...) with the digits as subscripts (booklet style)."""
    body, sub = "", False
    for ch in grp:
        if ch.isdigit() and not sub:
            body += f'<tspan dy="4" font-size="{int(size*0.72)}">{ch}</tspan>'; sub = True
        elif not ch.isdigit() and sub:
            body += f'<tspan dy="-4">{ch}</tspan>'; sub = False
        else:
            body += ch
    # Start-anchored at the computed left edge (as chem() does): renderers disagree on middle-anchoring
    # text that contains baseline-shifted tspans (the subscript then collides with the next letter).
    x0 = round(x - chem_w(grp, size)/2, 2)
    return (f'  <text data-group="{grp}" data-cx="{x}" x="{x0}" y="{y}" font-family="Times New Roman, serif" font-size="{size}" '
            f'fill="var(--fig-text)" text-anchor="start">{body}</text>\n')

def fig_2023_q84():
    """Q84 as printed: H3C–C–CH2–CH–CH3 on one line; CH3 above and below C, CH3 above CH."""
    yc = 76
    g = {"H3C": (34, yc), "C": (104, yc), "CH2": (170, yc), "CH": (246, yc), "CH3": (318, yc),
         "CH3up1": (104, 24), "CH3dn": (104, 130), "CH3up2": (246, 24)}
    name = lambda k: "CH3" if k.startswith("CH3") else k
    b = '  <g data-struct="q84">\n'
    for k, (x, y) in g.items():
        b += _c23_group_text(x, y + 5, name(k))
    bond = lambda p, q: _p24_role(line(p[0], p[1], q[0], q[1], stroke="var(--fig-line)", sw=1.2), "bond")
    b += bond((54, yc), (93, yc)) + bond((115, yc), (148, yc)) + bond((193, yc), (229, yc)) + bond((264, yc), (296, yc))
    b += bond((104, 36), (104, 64)) + bond((104, 88), (104, 116)) + bond((246, 36), (246, 64))
    b += '  </g>\n'
    return svg_plain(352, 146, b, "2023 Q84: condensed structural formula H3C–C(CH3)2–CH2–CH(CH3)–CH3 drawn as in the booklet")

def _c23_cap(p, q, half=11):
    """Capacitor on the straight wire p→q: two equal plates (paths) at the pins; pins are the plate centres."""
    L = _m.hypot(q[0] - p[0], q[1] - p[1]); d = ((q[0] - p[0])/L, (q[1] - p[1])/L)
    return (f'  <g data-comp="C" data-pins="{p[0]},{p[1]} {q[0]},{q[1]}">\n'
            + _c24_plate(p, d, half) + _c24_plate(q, d, half) + '  </g>\n')

def fig_2023_q91():
    """Q91 as printed. Left: current source i(t) (arrow up) → node dot → 3 Ω → 2 mH (top wire) → 500 μF (right
    side) → bottom wire back to the source.  Right: i(t)–t(ms) graph, trapezoid 0→5 A (0–1 ms), 5 A (1–2 ms),
    linear fall through 0 at 3 ms to –5 A (4 ms), –5 A (4–5 ms), back to 0 at 6 ms; dashed levels and guides."""
    W = _c24_w
    xs, xr, yt, yb = 46, 262, 70, 168
    b = W((xs, 133), (xs, yb)) + W((xs, 107), (xs, yt))
    b += (f'  <g data-comp="I" data-pins="{xs},133 {xs},107">\n'
          + circle(xs, 120, 13, stroke="var(--fig-line)", sw=1.4) +
          f'  <path d="M {xs},128 L {xs},113" stroke="var(--fig-line)" stroke-width="1.3" fill="none"/>\n'
          + _arrowhead(xs, 111, -90, 6) + '  </g>\n')
    b += dot(xs, yt, r=3) + W((xs, yt), (96, yt)) + _c24_res((96, yt), (140, yt)) + W((140, yt), (160, yt))
    b += f'  <g data-comp="L" data-pins="160,{yt} 212,{yt}">\n{_coil(160, 212, yt - 4, loops=4)}  </g>\n'
    b += W((212, yt), (xr, yt)) + W((xr, yt), (xr, 114)) + _c23_cap((xr, 114), (xr, 122), 13) + W((xr, 122), (xr, yb))
    b += W((xr, yb), (xs, yb))
    b += mlabel(118, 54, "3 Ω", 13) + mlabel(186, 54, "2 mH", 13) + mlabel(280, 123, "500 μF", 13, anchor="start")
    b += mlabel(28, 125, "i(t)", 13, anchor="end")
    # waveform panel
    ox, oy, ts, ia = 366, 112, 30, 9.0                       # origin, px per ms, px per A
    T = lambda t: round(ox + t*ts, 1); I = lambda a: round(oy - a*ia, 1)
    b += _p24_role(arrow(ox, 182, ox, 20, stroke="var(--fig-axis)", sw=1.2), "axis-i")
    b += _p24_role(arrow(ox, oy, ox + 210, oy, stroke="var(--fig-axis)", sw=1.2), "axis-t")
    b += _p23_dash(ox, I(5), T(7.2), I(5), "level-5A") + _p23_dash(ox, I(-5), T(7.2), I(-5), "level-m5A")
    for t, a in ((1, 5), (2, 5), (4, -5), (5, -5)):
        b += _p23_dash(T(t), I(a), T(t), oy, f"guide-t{t}")
    b += _p24_poly([(T(t), I(a)) for t, a in ((0, 0), (1, 5), (2, 5), (4, -5), (5, -5), (6, 0))], "i-wave", stroke="var(--fig-line)", sw=1.5)
    for t, dx, dy in ((1, 0, 16), (2, 0, 16), (3, 0, 16), (4, 0, 16), (5, 0, 16), (6, 8, 16)):
        b += f'  <text data-tick="{t}" x="{T(t) + dx}" y="{oy + dy}" font-family="Times New Roman, serif" font-size="12" fill="var(--fig-text)" text-anchor="middle">{t}</text>\n'
    b += mlabel(ox - 8, I(5) + 5, "5A", 12, anchor="end") + mlabel(ox - 6, oy + 4, "0", 12, anchor="end")
    b += mlabel(ox - 8, I(-5) + 5, "– 5A", 12, anchor="end") + mlabel(ox, 14, "i(t)", 12)
    b += mlabel(ox + 214, oy + 4, "t (ms)", 12, anchor="start")
    return svg_plain(620, 196, b, "2023 Q91: current source i(t) driving a series 3 Ω – 2 mH – 500 μF loop, with the trapezoidal i(t) waveform between 5A and – 5A over 0–6 ms")

def fig_2023_q92():
    """Q92 as printed: 5 V source (+ up) on the left, C1 = 5 μF on the top wire, C2 = 10 μF on the right, bottom wire."""
    W = _c24_w
    xl, xr, yt, yb = 64, 254, 30, 140
    b = W((xl, 69), (xl, yt)) + W((xl, yt), (150, yt)) + _c23_cap((150, yt), (157, yt), 10) + W((157, yt), (xr, yt))
    b += W((xr, yt), (xr, 81)) + _c23_cap((xr, 81), (xr, 89), 14) + W((xr, 89), (xr, yb)) + W((xr, yb), (xl, yb)) + W((xl, yb), (xl, 101))
    b += (f'  <g data-comp="V" data-pins="{xl},69 {xl},101" data-plus="{xl},69">\n'
          + circle(xl, 85, 16, stroke="var(--fig-line)", sw=1.4)
          + f'  <path d="M {xl - 5},{78} L {xl + 5},{78}" stroke="var(--fig-line)" stroke-width="1.3" fill="none"/>\n'
          + f'  <path d="M {xl},{73} L {xl},{83}" stroke="var(--fig-line)" stroke-width="1.3" fill="none"/>\n'
          + f'  <path d="M {xl - 6},{93} L {xl + 6},{93}" stroke="var(--fig-line)" stroke-width="1.3" fill="none"/>\n  </g>\n')
    b += mlabel(40, 90, "5 V", 13, anchor="end")
    b += (f'  <text x="124" y="16" font-family="Times New Roman, serif" font-size="13" fill="var(--fig-text)" text-anchor="start">'
          f'C<tspan dy="3" font-size="9">1</tspan><tspan dy="-3"> = 5 μF</tspan></text>\n')
    b += (f'  <text x="272" y="90" font-family="Times New Roman, serif" font-size="13" fill="var(--fig-text)" text-anchor="start">'
          f'C<tspan dy="3" font-size="9">2</tspan><tspan dy="-3"> = 10 μF</tspan></text>\n')
    return svg_plain(370, 156, b, "2023 Q92: 5 V source in series with C1 = 5 μF and C2 = 10 μF")

def fig_2023_q94():
    """Q94 as printed (400-DPI crop): three cell + resistor branches (50 V/5 Ω, 40 V/4 Ω, 30 V/3 Ω; long plate = +
    on the left) between a left and a right vertical wire; the A wire runs straight into the 40 V branch and the
    40 V branch runs straight on to B, crossing the vertical wires WITHOUT junction dots, exactly as printed;
    a 2 Ω resistor on the bottom wire joins A to B."""
    W = _c24_w
    xA, xB, xl, xr = 22, 306, 62, 254
    y1, y2, y3, yb = 40, 88, 136, 178
    b = ""
    for y, ex in ((y1, "q"), (y3, "q")):
        b += W((xl, y), (88, y)) + _c24_cell((88, y), (100, y), "p") + W((100, y), (150, y)) + _c24_res((150, y), (198, y)) + W((198, y), (xr, y))
    b += W((xA, y2), (88, y2)) + _c24_cell((88, y2), (100, y2), "p") + W((100, y2), (150, y2)) + _c24_res((150, y2), (198, y2)) + W((198, y2), (xB, y2))
    b += W((xl, y1), (xl, y3)) + W((xr, y1), (xr, y3))
    b += W((xA, y2), (xA, yb)) + W((xA, yb), (140, yb)) + _c24_res((140, yb), (188, yb)) + W((188, yb), (xB, yb)) + W((xB, yb), (xB, y2))
    b += dot(xA, y2, r=3.4) + dot(xB, y2, r=3.4)
    b += mlabel(xA - 8, y2 + 5, "A", 14, anchor="end") + mlabel(xB + 8, y2 + 5, "B", 14, anchor="start")
    b += mlabel(94, y1 - 14, "50 V", 13) + mlabel(174, y1 - 12, "5 Ω", 13)
    b += mlabel(94, y2 - 14, "40 V", 13) + mlabel(174, y2 - 12, "4 Ω", 13)
    b += mlabel(94, y3 - 14, "30 V", 13) + mlabel(174, y3 - 12, "3 Ω", 13)
    b += mlabel(164, yb + 22, "2 Ω", 13)
    return svg_plain(340, 206, b, "2023 Q94: three cell–resistor branches 50 V/5 Ω, 40 V/4 Ω, 30 V/3 Ω between A and B, with 2 Ω from A to B")

def fig_2023_q95():
    """Q95 as printed: X → [2 μF (top) ∥ (2 μF + 2 μF in series, bottom)] → 1 μF → Y."""
    W = _c24_w
    xX, xl, xr, xY, ym, yt, yb = 22, 64, 236, 322, 62, 30, 94
    b = W((xX, ym), (xl, ym)) + W((xl, yt), (xl, yb)) + W((xr, yt), (xr, yb))
    b += W((xl, yt), (146, yt)) + _c23_cap((146, yt), (153, yt), 10) + W((153, yt), (xr, yt))
    b += W((xl, yb), (100, yb)) + _c23_cap((100, yb), (107, yb), 10) + W((107, yb), (176, yb)) + _c23_cap((176, yb), (183, yb), 10) + W((183, yb), (xr, yb))
    b += W((xr, ym), (268, ym)) + _c23_cap((268, ym), (275, ym), 10) + W((275, ym), (xY, ym))
    b += dot(xX, ym, r=3.4) + dot(xY, ym, r=3.4)
    b += mlabel(xX - 8, ym + 5, "X", 14, anchor="end") + mlabel(xY + 8, ym + 5, "Y", 14, anchor="start")
    b += mlabel(150, 14, "2 μF", 13) + mlabel(272, 42, "1 μF", 13)
    b += mlabel(104, 118, "2 μF", 13) + mlabel(180, 118, "2 μF", 13)
    return svg_plain(350, 126, b, "2023 Q95: 2 μF in parallel with two 2 μF in series, followed by 1 μF in series, between X and Y")

def main():
    outdir_base = "_data/figures"
    figures = {
        "2022": {
            "fig-2022-q46": fig_2022_q46,
            "fig-2022-q48": fig_2022_q48,
            **{f"fig-2022-q49-opt{k}": globals()[f"fig_2022_q49_opt{k}"] for k in "ABCD"},
            "fig-2022-q55": fig_2022_q55,
            "fig-2022-q57": fig_2022_q57,
            **{f"fig-2022-q57-opt{k}": globals()[f"fig_2022_q57_opt{k}"] for k in "ABCD"},
            "fig-2022-q62": fig_2022_q62,
            **{f"fig-2022-q62-opt{k}": globals()[f"fig_2022_q62_opt{k}"] for k in "ABCD"},
            "fig-2022-q68": fig_2022_q68,
            "fig-2022-q69": fig_2022_q69,
            "fig-2022-q93": fig_2022_q93,
            "fig-2022-q96": fig_2022_q96,
            "fig-2022-q97": fig_2022_q97,
            "fig-2022-q98": fig_2022_q98,
            "fig-2022-q99": fig_2022_q99,
        },
        "2023": {
            "fig-2023-q42": fig_2023_q42,
            "fig-2023-q48": fig_2023_q48,
            "fig-2023-q56": fig_2023_q56,
            "fig-2023-q60": fig_2023_q60,
            "fig-2023-q61": fig_2023_q61,
            "fig-2023-q66": fig_2023_q66,
            "fig-2023-q68": fig_2023_q68,
            "fig-2023-q70": fig_2023_q70,
            "fig-2023-q84": fig_2023_q84,
            "fig-2023-q91": fig_2023_q91,
            "fig-2023-q92": fig_2023_q92,
            "fig-2023-q94": fig_2023_q94,
            "fig-2023-q95": fig_2023_q95,
        },
        "2024": {
            "fig-2024-q42": fig_2024_q42,
            "fig-2024-q42-optA": fig_2024_q42_optA,
            "fig-2024-q42-optB": fig_2024_q42_optB,
            "fig-2024-q42-optC": fig_2024_q42_optC,
            "fig-2024-q42-optD": fig_2024_q42_optD,
            "fig-2024-q43": fig_2024_q43,
            "fig-2024-q45": fig_2024_q45,
            "fig-2024-q46": fig_2024_q46,
            "fig-2024-q49": fig_2024_q49,
            "fig-2024-q52": fig_2024_q52,
            "fig-2024-q54": fig_2024_q54,
            "fig-2024-q55": fig_2024_q55,
            "fig-2024-q57": fig_2024_q57,
            "fig-2024-q61-optA": fig_2024_q61_optA,
            "fig-2024-q61-optB": fig_2024_q61_optB,
            "fig-2024-q61-optC": fig_2024_q61_optC,
            "fig-2024-q61-optD": fig_2024_q61_optD,
            "fig-2024-q65": fig_2024_q65,
            "fig-2024-q66-optA": fig_2024_q66_optA,
            "fig-2024-q66-optB": fig_2024_q66_optB,
            "fig-2024-q66-optC": fig_2024_q66_optC,
            "fig-2024-q66-optD": fig_2024_q66_optD,
            "fig-2024-q67": fig_2024_q67,
            "fig-2024-q68": fig_2024_q68,
            "fig-2024-q70": fig_2024_q70,
            "fig-2024-q78-optA": fig_2024_q78_optA,
            "fig-2024-q78-optB": fig_2024_q78_optB,
            "fig-2024-q78-optC": fig_2024_q78_optC,
            "fig-2024-q78-optD": fig_2024_q78_optD,
            "fig-2024-q79-optA": fig_2024_q79_optA,
            "fig-2024-q79-optB": fig_2024_q79_optB,
            "fig-2024-q79-optC": fig_2024_q79_optC,
            "fig-2024-q89-optB": fig_2024_q89_optB,
            "fig-2024-q89-optD": fig_2024_q89_optD,
            "fig-2024-q94": fig_2024_q94,
            "fig-2024-q96": fig_2024_q96,
            "fig-2024-q97": fig_2024_q97,
            "fig-2024-q98": fig_2024_q98,
        },
        "2025": {
            "fig-2025-q44": fig_2025_q44,
            "fig-2025-q44-optA": fig_2025_q44_optA,
            "fig-2025-q44-optB": fig_2025_q44_optB,
            "fig-2025-q44-optC": fig_2025_q44_optC,
            "fig-2025-q44-optD": fig_2025_q44_optD,
            "fig-2025-q46": fig_2025_q46,
            "fig-2025-q51-optA": fig_2025_q51_optA,
            "fig-2025-q51-optB": fig_2025_q51_optB,
            "fig-2025-q51-optC": fig_2025_q51_optC,
            "fig-2025-q51-optD": fig_2025_q51_optD,
            "fig-2025-q54": fig_2025_q54,
            "fig-2025-q55": fig_2025_q55,
            "fig-2025-q57": fig_2025_q57,
            "fig-2025-q58-optA": fig_2025_q58_optA,
            "fig-2025-q58-optB": fig_2025_q58_optB,
            "fig-2025-q58-optC": fig_2025_q58_optC,
            "fig-2025-q58-optD": fig_2025_q58_optD,
            "fig-2025-q61": fig_2025_q61,
            "fig-2025-q62": fig_2025_q62,
            "fig-2025-q66-optA": fig_2025_q66_optA,
            "fig-2025-q66-optB": fig_2025_q66_optB,
            "fig-2025-q66-optC": fig_2025_q66_optC,
            "fig-2025-q66-optD": fig_2025_q66_optD,
            "fig-2025-q67": fig_2025_q67,
            "fig-2025-q81": fig_2025_q81,
            "fig-2025-q82": fig_2025_q82,
            "fig-2025-q83": fig_2025_q83,
            "fig-2025-q85": fig_2025_q85,
            "fig-2025-q85-optA": fig_2025_q85_optA,
            "fig-2025-q85-optC": fig_2025_q85_optC,
            "fig-2025-q85-optD": fig_2025_q85_optD,
            "fig-2025-q88": fig_2025_q88,
            "fig-2025-q95": fig_2025_q95,
            "fig-2025-q100": fig_2025_q100,
        },
    }
    total = 0
    for year, figs in figures.items():
        outdir = os.path.join(outdir_base, year)
        os.makedirs(outdir, exist_ok=True)
        for key, func in figs.items():
            svg = func()
            path = os.path.join(outdir, f"{key}.svg")
            with open(path, "w") as f:
                f.write(svg)
            total += 1
    print(f"Generated {total} SVG figures.")

if __name__ == "__main__":
    main()
