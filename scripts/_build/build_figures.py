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

def fig_2024_q42():
    """v-t graph for acceleration shown in a-t graph: a is constant then zero."""
    body = ""
    # a-t graph (top): constant a then 0
    body += label(40, 30, "a-t", 10)
    body += line(40, 50, 200, 50)
    body += line(40, 50, 40, 90)
    body += line(200, 50, 200, 90)
    body += line(40, 70, 120, 70, stroke="var(--fig-danger)", sw=2)
    body += label(70, 65, "a = const", 10, "var(--fig-danger-soft)")
    # v-t graph (bottom): v increases linearly then constant
    body += label(40, 130, "v-t", 10)
    body += line(40, 160, 200, 160)
    body += line(40, 160, 40, 200)
    body += line(200, 160, 200, 200)
    body += polyline("40,200 120,140 200,140", stroke="var(--fig-primary)", sw=2)
    body += label(160, 155, "v increasing then constant", 9, "var(--fig-text)")
    return svg_wrap(240, 220, body, "2024 Q42: a-t and v-t graphs")

def fig_2024_q43():
    """vectors A, B, C: A perpendicular to B and C."""
    body = ""
    body += label(40, 30, "Vectors A, B, C", 10)
    # origin
    body += dot(120, 130)
    body += arrow(120, 130, 200, 80, stroke="var(--fig-primary)", label="A", label_pos=(205, 75))
    body += arrow(120, 130, 60, 60, stroke="var(--fig-secondary)", label="B", label_pos=(30, 55))
    body += arrow(120, 130, 60, 200, stroke="var(--fig-accent)", label="C", label_pos=(25, 215))
    body += label(120, 150, "A ⊥ B, A ⊥ C", 10, "var(--fig-axis)", "middle")
    return svg_wrap(240, 240, body, "2024 Q43: Perpendicular vectors")

def fig_2024_q46():
    """displacement-time graph with regions AB, BC, CD, DE."""
    body = ""
    body += label(40, 30, "x-t graph", 10)
    body += line(40, 60, 200, 60)
    body += line(40, 60, 40, 180)
    body += line(200, 60, 200, 180)
    # curve: AB (curved), BC (straight), CD (curved), DE (straight)
    body += polyline("40,160 80,140 120,100 160,120 200,80", stroke="var(--fig-primary)", sw=2)
    for x, y, t in [(40,160,"A"),(80,140,"B"),(120,100,"C"),(160,120,"D"),(200,80,"E")]:
        body += dot(x, y, 3)
        body += label(x-5, y+18, t, 10, "var(--fig-text)", "middle")
    return svg_wrap(240, 200, body, "2024 Q46: Displacement-time graph")

def fig_2024_q52():
    """rolling disc on horizontal then inclined plane."""
    body = ""
    body += label(40, 30, "Disc rolling", 10)
    # horizontal surface
    body += line(30, 140, 130, 140, stroke="var(--fig-axis)", sw=2)
    # incline
    body += line(130, 140, 210, 80, stroke="var(--fig-axis)", sw=2)
    body += line(130, 140, 130, 160, stroke="var(--fig-axis)", sw=1)
    body += line(210, 80, 210, 160, stroke="var(--fig-axis)", sw=1)
    # disc on incline
    body += circle(170, 115, 12, stroke="var(--fig-primary)", sw=2, fill="var(--fig-fill)")
    body += arrow(185, 115, 200, 115, stroke="var(--fig-danger)", sw=1.5, label="v", label_pos=(202, 110))
    body += label(170, 145, "incline", 9, "var(--fig-axis)", "middle")
    return svg_wrap(240, 170, body, "2024 Q52: Rolling disc on incline")

def fig_2024_q54():
    """extension-load graph for two materials."""
    body = ""
    body += label(40, 30, "Load vs Extension", 10)
    body += line(40, 160, 200, 160)
    body += line(40, 160, 40, 40)
    body += label(30, 165, "ext", 9, "var(--fig-axis)", "middle")
    body += label(205, 165, "load", 9, "var(--fig-axis)")
    # line A (steeper)
    body += line(40, 160, 180, 60, stroke="var(--fig-primary)", sw=2)
    # line B (less steep)
    body += line(40, 160, 180, 110, stroke="var(--fig-secondary)", sw=2)
    body += label(175, 55, "A", 11, "var(--fig-primary)")
    body += label(175, 105, "B", 11, "var(--fig-secondary)")
    return svg_wrap(240, 180, body, "2024 Q54: Extension-load graph")

def fig_2024_q55():
    """three liquids mixing diagram."""
    body = ""
    body += label(40, 30, "Three liquids A, B, C", 10)
    for i, (y, name, col) in enumerate([(50, "A", "var(--fig-primary)"), (90, "B", "var(--fig-secondary)"), (130, "C", "var(--fig-accent)")]):
        body += f'  <rect x="50" y="{y}" width="140" height="30" fill="{col}" fill-opacity="0.2" stroke="{col}" stroke-width="1.5"/>\n'
        body += label(60, y+20, name, 12, col)
    return svg_wrap(240, 180, body, "2024 Q55: Three liquids")

def fig_2024_q57():
    """P-V diagram: isothermal expansion then isobaric compression."""
    body = ""
    body += label(40, 30, "P-V diagram", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-axis)")
    body += line(40, 160, 40, 40, stroke="var(--fig-axis)")
    body += label(25, 165, "V", 9, "var(--fig-axis)", "middle")
    body += label(30, 35, "P", 9, "var(--fig-axis)", "middle")
    # isothermal (PV=const) then isobaric (P=const)
    body += path("M 50,140 Q 120,140 150,90", stroke="var(--fig-primary)", sw=2)
    body += line(150, 90, 180, 90, stroke="var(--fig-danger)", sw=2, dash="5,3")
    body += dot(50, 140, 3)
    body += dot(150, 90, 3)
    body += dot(180, 90, 3)
    body += label(55, 155, "A", 10, "var(--fig-text)")
    body += label(145, 85, "B", 10, "var(--fig-text)")
    body += label(175, 85, "final", 9, "var(--fig-text)")
    return svg_wrap(240, 180, body, "2024 Q57: P-V diagram")

def fig_2024_q61():
    """heat input graph: solid, melting, liquid, boiling, gas."""
    body = ""
    body += label(40, 30, "Heat vs Temperature", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-axis)")
    body += line(40, 160, 40, 40, stroke="var(--fig-axis)")
    body += label(25, 165, "T", 9, "var(--fig-axis)", "middle")
    body += label(30, 35, "Q", 9, "var(--fig-axis)", "middle")
    # segments: AB solid, BC melting, CD liquid, DE gas
    body += polyline("40,150 100,150 100,100 160,100 160,50 200,50", stroke="var(--fig-primary)", sw=2)
    for x, y, t in [(40,150,"A"),(100,150,"B"),(100,100,"C"),(160,100,"D"),(160,50,"E"),(200,50,"F")]:
        body += dot(x, y, 2.5)
        body += label(x-5, y+18, t, 9, "var(--fig-text)", "middle")
    return svg_wrap(240, 180, body, "2024 Q61: Heating curve")

def fig_2024_q65():
    """bullet hitting block."""
    body = ""
    body += label(40, 30, "Bullet embeds in block", 10)
    # bullet path
    body += arrow(40, 90, 90, 90, stroke="var(--fig-danger)", sw=2, label="bullet", label_pos=(50, 80))
    # block
    body += f'  <rect x="90" y="70" width="80" height="40" fill="none" stroke="var(--fig-primary)" stroke-width="2"/>\n'
    body += label(130, 95, "block", 10, "var(--fig-text)", "middle")
    body += label(130, 145, "frictionless surface", 9, "var(--fig-axis)", "middle")
    body += line(30, 150, 220, 150, stroke="var(--fig-line)", sw=1)
    return svg_wrap(240, 170, body, "2024 Q65: Bullet into block")

def fig_2024_q66():
    """logic gate circuit."""
    body = ""
    body += label(40, 30, "Logic circuit", 10)
    body += circle(70, 90, 20, stroke="var(--fig-primary)", sw=2)
    body += label(70, 95, "NAND", 9, "var(--fig-text)", "middle")
    body += circle(140, 90, 20, stroke="var(--fig-primary)", sw=2)
    body += label(140, 95, "NOT", 9, "var(--fig-text)", "middle")
    body += line(40, 90, 50, 90)
    body += dot(50, 90, 3)
    body += line(90, 90, 120, 90)
    body += line(160, 90, 190, 90)
    body += label(30, 95, "A", 10, "var(--fig-text)", "middle")
    body += label(30, 115, "B", 10, "var(--fig-text)", "middle")
    body += label(195, 95, "Y", 10, "var(--fig-text)")
    return svg_wrap(240, 140, body, "2024 Q66: Logic circuit")

def fig_2024_q67():
    """block hanging from pulley, force F applied."""
    body = ""
    body += label(40, 30, "Pulley system", 10)
    # support
    body += line(30, 50, 200, 50, stroke="var(--fig-line)", sw=2)
    # pulley
    body += circle(100, 70, 12, stroke="var(--fig-primary)", sw=2, fill="var(--fig-fill)")
    # string
    body += line(100, 82, 100, 120, stroke="var(--fig-axis)", sw=1.5)
    # block
    body += f'  <rect x="85" y="120" width="30" height="25" fill="none" stroke="var(--fig-primary)" stroke-width="2"/>\n'
    body += label(100, 115, "block (2 kg)", 9, "var(--fig-text)", "middle")
    # force F
    body += arrow(170, 70, 200, 70, stroke="var(--fig-danger)", sw=2, label="F = 40 N", label_pos=(172, 60))
    return svg_wrap(240, 160, body, "2024 Q67: Pulley with force")

def fig_2024_q68():
    """elliptical orbit of planet around Sun."""
    body = ""
    body += label(40, 30, "Elliptical orbit", 10)
    body += path("M 120,40 Q 200,110 120,160 Q 40,110 120,40", stroke="var(--fig-primary)", sw=1.5, fill="none")
    body += dot(120, 100, 5, fill="var(--fig-accent-soft)")
    body += label(125, 95, "Sun", 10, "var(--fig-accent-soft)")
    body += dot(180, 75, 4, fill="var(--fig-primary)")
    body += label(185, 72, "Planet", 9, "var(--fig-primary)")
    return svg_wrap(240, 180, body, "2024 Q68: Elliptical orbit")

def fig_2024_q70():
    """vector P = (A×B)×(C×D)."""
    body = ""
    body += label(40, 30, "P = (A×B)×(C×D)", 10)
    body += dot(120, 100, 4)
    body += arrow(120, 100, 200, 60, stroke="var(--fig-primary)", sw=2, label="A×B", label_pos=(160, 55))
    body += arrow(120, 100, 60, 140, stroke="var(--fig-secondary)", sw=2, label="C×D", label_pos=(20, 155))
    body += arrow(120, 100, 160, 140, stroke="var(--fig-danger)", sw=2, label="P", label_pos=(165, 155))
    return svg_wrap(240, 180, body, "2024 Q70: Vector product")

def fig_2024_q94():
    """power supply block diagram."""
    body = ""
    body += label(40, 30, "Power supply", 10)
    body += f'  <rect x="40" y="60" width="160" height="70" fill="none" stroke="var(--fig-primary)" stroke-width="2" rx="5"/>\n'
    body += label(120, 95, "Power Supply", 12, "var(--fig-text)", "middle")
    body += arrow(100, 130, 100, 160, stroke="var(--fig-axis)", sw=1.5)
    body += arrow(140, 160, 140, 130, stroke="var(--fig-axis)", sw=1.5)
    body += label(100, 175, "load", 9, "var(--fig-axis)", "middle")
    body += label(140, 175, "input", 9, "var(--fig-axis)", "middle")
    return svg_wrap(240, 180, body, "2024 Q94: Power supply")

def fig_2024_q96():
    """series-parallel resistor/AC circuit."""
    body = ""
    body += label(40, 30, "AC circuit", 10)
    body += circle(60, 100, 12, stroke="var(--fig-primary)", sw=2)
    body += label(60, 105, "R₁", 9, "var(--fig-text)", "middle")
    body += circle(110, 100, 12, stroke="var(--fig-primary)", sw=2)
    body += label(110, 105, "L₁", 9, "var(--fig-text)", "middle")
    body += circle(160, 100, 12, stroke="var(--fig-primary)", sw=2)
    body += label(160, 105, "R₂", 9, "var(--fig-text)", "middle")
    body += line(40, 100, 50, 100); body += line(70, 100, 95, 100); body += line(120, 100, 145, 100); body += line(170, 100, 190, 100)
    body += label(40, 90, "I₁", 9, "var(--fig-text)", "middle")
    body += label(105, 90, "I₂", 9, "var(--fig-text)", "middle")
    body += label(195, 100, "I", 10, "var(--fig-text)")
    return svg_wrap(240, 140, body, "2024 Q96: AC circuit")

def fig_2024_q97():
    """transistor symbol."""
    body = ""
    body += label(40, 30, "PNP Transistor", 10)
    # base vertical
    body += line(100, 60, 100, 140, stroke="var(--fig-primary)", sw=2)
    # emitter arrow pointing in
    body += line(100, 80, 60, 60, stroke="var(--fig-danger)", sw=2)
    body += f'  <polygon points="60,60 72,55 72,65" fill="var(--fig-danger)"/>\n'
    body += line(100, 110, 60, 120, stroke="var(--fig-danger)", sw=2)
    body += f'  <polygon points="60,120 72,115 72,125" fill="var(--fig-danger)"/>\n'
    # collector
    body += line(100, 70, 140, 50, stroke="var(--fig-secondary)", sw=2)
    body += line(100, 130, 140, 150, stroke="var(--fig-secondary)", sw=2)
    body += label(55, 75, "E", 10, "var(--fig-danger)")
    body += label(55, 135, "E", 10, "var(--fig-danger)")
    body += label(105, 50, "B", 10, "var(--fig-text)")
    body += label(145, 50, "C", 10, "var(--fig-secondary)")
    return svg_wrap(240, 170, body, "2024 Q97: PNP transistor")

def fig_2024_q98():
    """op-amp triangle."""
    body = ""
    body += label(40, 30, "Op-Amp", 10)
    body += polyline("40,100 150,100 190,70 190,130 150,100", stroke="var(--fig-primary)", sw=2)
    body += label(150, 95, "−", 14, "var(--fig-text)", "middle")
    body += label(150, 120, "+", 14, "var(--fig-text)", "middle")
    body += label(160, 115, "op-amp", 9, "var(--fig-axis)", "middle")
    body += line(20, 100, 40, 100, stroke="var(--fig-axis)")
    body += line(190, 100, 210, 100, stroke="var(--fig-axis)")
    body += label(20, 90, "in", 9, "var(--fig-axis)", "middle")
    body += label(215, 90, "out", 9, "var(--fig-axis)", "middle")
    return svg_wrap(240, 150, body, "2024 Q98: Op-Amp")

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

def fig_2025_q51():
    """velocity-time graph in viscous fluid."""
    body = ""
    body += label(40, 30, "v-t in viscous fluid", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-axis)")
    body += line(40, 160, 40, 40, stroke="var(--fig-axis)")
    body += label(25, 165, "t", 9, "var(--fig-axis)", "middle")
    body += label(30, 35, "v", 9, "var(--fig-axis)", "middle")
    # v increases then becomes constant
    body += path("M 40,160 Q 100,100 140,80 L 200,80", stroke="var(--fig-primary)", sw=2)
    body += label(150, 75, "terminal velocity", 9, "var(--fig-text)")
    return svg_wrap(240, 180, body, "2025 Q51: Velocity-time in viscous fluid")

def fig_2025_q54():
    """disc rolling up incline."""
    body = ""
    body += label(40, 30, "Disc on incline", 10)
    body += line(30, 140, 120, 140, stroke="var(--fig-axis)", sw=2)
    body += line(120, 140, 210, 70, stroke="var(--fig-axis)", sw=2)
    body += line(120, 140, 120, 165, stroke="var(--fig-axis)", sw=1)
    body += line(210, 70, 210, 165, stroke="var(--fig-axis)", sw=1)
    body += circle(165, 105, 12, stroke="var(--fig-primary)", sw=2, fill="var(--fig-fill)")
    body += arrow(180, 105, 195, 105, stroke="var(--fig-danger)", sw=1.5, label="v", label_pos=(197, 100))
    body += label(165, 130, "incline", 9, "var(--fig-axis)", "middle")
    return svg_wrap(240, 175, body, "2025 Q54: Disc on incline")

def fig_2025_q55():
    """extension-load graph for two wires."""
    body = ""
    body += label(40, 30, "Load vs Extension", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-axis)")
    body += line(40, 160, 40, 40, stroke="var(--fig-axis)")
    body += label(25, 165, "ext", 9, "var(--fig-axis)", "middle")
    body += label(30, 35, "load", 9, "var(--fig-axis)", "middle")
    body += line(40, 160, 180, 55, stroke="var(--fig-primary)", sw=2)
    body += line(40, 160, 180, 105, stroke="var(--fig-secondary)", sw=2)
    body += label(175, 50, "A", 11, "var(--fig-primary)")
    body += label(175, 100, "B", 11, "var(--fig-secondary)")
    return svg_wrap(240, 180, body, "2025 Q55: Extension-load graph")

def fig_2025_q58():
    """P-V diagram: isothermal then isobaric."""
    body = ""
    body += label(40, 30, "P-V diagram", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-axis)")
    body += line(40, 160, 40, 40, stroke="var(--fig-axis)")
    body += label(25, 165, "V", 9, "var(--fig-axis)", "middle")
    body += label(30, 35, "P", 9, "var(--fig-axis)", "middle")
    body += path("M 50,140 Q 120,140 150,90", stroke="var(--fig-primary)", sw=2)
    body += line(150, 90, 185, 90, stroke="var(--fig-danger)", sw=2, dash="5,3")
    body += dot(50, 140, 3); body += dot(150, 90, 3); body += dot(185, 90, 3)
    body += label(55, 155, "A", 10, "var(--fig-text)")
    body += label(145, 85, "B", 10, "var(--fig-text)")
    return svg_wrap(240, 180, body, "2025 Q58: P-V diagram")

def fig_2025_q61():
    """three liquids mixing."""
    body = ""
    body += label(40, 30, "Liquids A, B, C", 10)
    for y, name, col in [(50, "A", "var(--fig-primary)"), (90, "B", "var(--fig-secondary)"), (130, "C", "var(--fig-accent)")]:
        body += f'  <rect x="50" y="{y}" width="140" height="30" fill="{col}" fill-opacity="0.2" stroke="{col}" stroke-width="1.5"/>\n'
        body += label(60, y+20, name, 12, col)
    return svg_wrap(240, 180, body, "2025 Q61: Three liquids")

def fig_2025_q62():
    """heat input graph with DE segment."""
    body = ""
    body += label(40, 30, "Heat vs Temperature", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-axis)")
    body += line(40, 160, 40, 40, stroke="var(--fig-axis)")
    body += label(25, 165, "T", 9, "var(--fig-axis)", "middle")
    body += label(30, 35, "Q", 9, "var(--fig-axis)", "middle")
    body += polyline("40,150 90,150 90,110 150,110 150,60 200,60", stroke="var(--fig-primary)", sw=2)
    for x, y, t in [(40,150,"A"),(90,150,"B"),(90,110,"C"),(150,110,"D"),(150,60,"E"),(200,60,"F")]:
        body += dot(x, y, 2.5)
        body += label(x-5, y+18, t, 9, "var(--fig-text)", "middle")
    body += line(150, 110, 150, 60, stroke="var(--fig-danger)", sw=2, dash="4,2")
    return svg_wrap(240, 180, body, "2025 Q62: Heating curve")

def fig_2025_q66():
    """x-t graph: parabolic then linear."""
    body = ""
    body += label(40, 30, "x-t graph", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-axis)")
    body += line(40, 160, 40, 40, stroke="var(--fig-axis)")
    body += label(25, 165, "t", 9, "var(--fig-axis)", "middle")
    body += label(30, 35, "x", 9, "var(--fig-axis)", "middle")
    body += path("M 40,160 Q 90,100 120,70 L 200,70", stroke="var(--fig-primary)", sw=2)
    body += label(150, 65, "uniform velocity", 9, "var(--fig-text)")
    return svg_wrap(240, 180, body, "2025 Q66: x-t graph")

def fig_2025_q67():
    """block hanging from pulley, force applied."""
    body = ""
    body += label(40, 30, "Pulley system", 10)
    body += line(30, 50, 200, 50, stroke="var(--fig-line)", sw=2)
    body += circle(100, 70, 12, stroke="var(--fig-primary)", sw=2, fill="var(--fig-fill)")
    body += line(100, 82, 100, 120, stroke="var(--fig-axis)", sw=1.5)
    body += f'  <rect x="85" y="120" width="30" height="25" fill="none" stroke="var(--fig-primary)" stroke-width="2"/>\n'
    body += label(100, 115, "block (2 kg)", 9, "var(--fig-text)", "middle")
    body += arrow(170, 70, 200, 70, stroke="var(--fig-danger)", sw=2, label="F = 40 N", label_pos=(172, 60))
    return svg_wrap(240, 160, body, "2025 Q67: Pulley with force")

def fig_2025_q81():
    """organic compound structure (simplified skeletal)."""
    body = ""
    body += label(40, 30, "Compound structure", 10)
    # simplified carbon chain with substituents
    body += polyline("50,120 80,120 100,80 140,80 160,120 190,120", stroke="var(--fig-primary)", sw=2)
    body += dot(50, 120, 3); body += dot(80, 120, 3); body += dot(100, 80, 3)
    body += dot(140, 80, 3); body += dot(160, 120, 3); body += dot(190, 120, 3)
    # double bond
    body += line(100, 88, 140, 88, stroke="var(--fig-primary)", sw=1, dash="2,2")
    # triple bond indicator
    body += line(160, 128, 190, 128, stroke="var(--fig-primary)", sw=1, dash="2,2")
    body += line(160, 112, 190, 112, stroke="var(--fig-primary)", sw=1, dash="2,2")
    return svg_wrap(240, 160, body, "2025 Q81: Organic structure")

def fig_2025_q82():
    """isomer pairs (two structures)."""
    body = ""
    body += label(40, 30, "Isomer pairs", 10)
    # pair 1
    body += polyline("40,70 70,70 90,50 120,50", stroke="var(--fig-primary)", sw=2)
    body += label(80, 65, "(I)", 9, "var(--fig-text)", "middle")
    # pair 2
    body += polyline("40,130 70,130 90,150 120,150", stroke="var(--fig-secondary)", sw=2)
    body += label(80, 125, "(II)", 9, "var(--fig-text)", "middle")
    return svg_wrap(240, 170, body, "2025 Q82: Isomer structures")

def fig_2025_q83():
    """reaction: CH3Cl with Mg/ether then CH3COOH."""
    body = ""
    body += label(40, 30, "Reaction sequence", 10)
    body += f'  <rect x="30" y="55" width="60" height="35" fill="none" stroke="var(--fig-primary)" stroke-width="1.5"/>\n'
    body += label(60, 78, "CH₃Cl", 10, "var(--fig-text)", "middle")
    body += arrow(95, 72, 140, 72, stroke="var(--fig-danger)", sw=2, label="Mg/ether", label_pos=(105, 65))
    body += f'  <rect x="145" y="55" width="60" height="35" fill="none" stroke="var(--fig-primary)" stroke-width="1.5"/>\n'
    body += label(175, 78, "CH₃MgCl", 9, "var(--fig-text)", "middle")
    body += arrow(210, 72, 220, 72, stroke="var(--fig-danger)", sw=1.5)
    body += label(110, 110, "then CH₃COOH", 9, "var(--fig-axis)", "middle")
    return svg_wrap(240, 130, body, "2025 Q83: Grignard reaction")

def fig_2025_q85():
    """acetylene with NaNH2 then EtBr."""
    body = ""
    body += label(40, 30, "Reaction sequence", 10)
    body += f'  <rect x="30" y="55" width="50" height="35" fill="none" stroke="var(--fig-primary)" stroke-width="1.5"/>\n'
    body += label(55, 78, "HC≡CH", 10, "var(--fig-text)", "middle")
    body += arrow(85, 72, 125, 72, stroke="var(--fig-danger)", sw=2, label="NaNH₂", label_pos=(95, 65))
    body += f'  <rect x="130" y="55" width="50" height="35" fill="none" stroke="var(--fig-primary)" stroke-width="1.5"/>\n'
    body += label(155, 78, "HC≡C⁻", 9, "var(--fig-text)", "middle")
    body += arrow(185, 72, 220, 72, stroke="var(--fig-danger)", sw=2, label="EtBr", label_pos=(195, 65))
    return svg_wrap(240, 130, body, "2025 Q85: Acetylene alkylation")

def fig_2025_q88():
    """propene + HBr reaction."""
    body = ""
    body += label(40, 30, "Reaction", 10)
    body += f'  <rect x="25" y="55" width="55" height="35" fill="none" stroke="var(--fig-primary)" stroke-width="1.5"/>\n'
    body += label(52, 78, "CH₃CH=CH₂", 9, "var(--fig-text)", "middle")
    body += arrow(85, 72, 130, 72, stroke="var(--fig-danger)", sw=2, label="HBr", label_pos=(95, 65))
    body += f'  <rect x="135" y="45" width="50" height="25" fill="none" stroke="var(--fig-secondary)" stroke-width="1.5"/>\n'
    body += label(160, 62, "CH₃CHBrCH₃", 8, "var(--fig-text)", "middle")
    body += f'  <rect x="135" y="80" width="50" height="25" fill="none" stroke="var(--fig-secondary)" stroke-width="1.5"/>\n'
    body += label(160, 97, "CH₃CH₂CH₂Br", 8, "var(--fig-text)", "middle")
    return svg_wrap(240, 130, body, "2025 Q88: Propene + HBr")

def fig_2025_q95():
    """AC circuit with R, L components."""
    body = ""
    body += label(40, 30, "AC circuit", 10)
    body += circle(60, 100, 12, stroke="var(--fig-primary)", sw=2)
    body += label(60, 105, "R₁", 9, "var(--fig-text)", "middle")
    body += circle(110, 100, 12, stroke="var(--fig-primary)", sw=2)
    body += label(110, 105, "L₁", 9, "var(--fig-text)", "middle")
    body += circle(160, 100, 12, stroke="var(--fig-primary)", sw=2)
    body += label(160, 105, "R₂", 9, "var(--fig-text)", "middle")
    body += line(40, 100, 50, 100); body += line(70, 100, 95, 100); body += line(120, 100, 145, 100); body += line(170, 100, 190, 100)
    body += label(40, 90, "I₁", 9, "var(--fig-text)", "middle")
    body += label(105, 90, "I₂", 9, "var(--fig-text)", "middle")
    body += label(195, 100, "I", 10, "var(--fig-text)")
    return svg_wrap(240, 140, body, "2025 Q95: AC circuit")

def fig_2025_q100():
    """logic gate combination."""
    body = ""
    body += label(40, 30, "Logic circuit", 10)
    body += circle(70, 90, 20, stroke="var(--fig-primary)", sw=2)
    body += label(70, 95, "NAND", 9, "var(--fig-text)", "middle")
    body += circle(140, 90, 20, stroke="var(--fig-primary)", sw=2)
    body += label(140, 95, "NOT", 9, "var(--fig-text)", "middle")
    body += line(40, 90, 50, 90); body += dot(50, 90, 3); body += line(90, 90, 120, 90); body += line(160, 90, 190, 90)
    body += label(30, 95, "A", 10, "var(--fig-text)", "middle")
    body += label(30, 115, "B", 10, "var(--fig-text)", "middle")
    body += label(195, 95, "Y", 10, "var(--fig-text)")
    return svg_wrap(240, 140, body, "2025 Q100: Logic circuit")

# ---- 2022 figures ----

def fig_2022_q42():
    """L, h, t error bars for a strip measurement."""
    body = ""
    body += label(40, 25, "Measurement error diagram", 10)
    # three bars: L, h, t
    for i, (name, val, err, y) in enumerate([("L", 10.0, 0.1, 60), ("h", 1.00, 0.01, 110), ("t", 0.1, 0.001, 160)]):
        body += label(40, y-5, name, 11, "var(--fig-text)")
        x1 = 80 + i * 30
        body += line(x1, y, x1+40, y, stroke="var(--fig-primary)", sw=2)
        body += line(x1, y-5, x1, y+5, stroke="var(--fig-danger)", sw=1.5)
        body += line(x1+40, y-5, x1+40, y+5, stroke="var(--fig-danger)", sw=1.5)
        body += label(x1+45, y+3, f"{val}±{err}", 9, "var(--fig-axis)")
    return svg_wrap(240, 200, body, "2022 Q42: Measurement error bars")

def fig_2022_q46():
    """Spring-mass system with force F applied."""
    body = ""
    body += label(40, 25, "Spring-mass system", 10)
    # wall
    body += line(30, 100, 30, 160, stroke="var(--fig-axis)", sw=3)
    body += polyline("30,100 30,95 35,95 30,90 35,90 30,85 35,85 30,80 35,80 30,75 35,75 30,70 35,70", stroke="var(--fig-primary)", sw=2)
    # spring
    body += line(35, 70, 90, 70, stroke="var(--fig-primary)", sw=1.5)
    # mass block
    body += line(90, 60, 140, 60, stroke="var(--fig-primary)", sw=2)
    body += line(90, 60, 90, 90, stroke="var(--fig-primary)", sw=2)
    body += line(140, 60, 140, 90, stroke="var(--fig-primary)", sw=2)
    body += line(90, 90, 140, 90, stroke="var(--fig-primary)", sw=2)
    body += label(115, 78, "m", 11, "var(--fig-text)", "middle")
    # force arrow
    body += arrow(150, 75, 210, 75, stroke="var(--fig-danger)", label="F", label_pos=(215, 70))
    body += label(115, 120, "Spring constant k", 9, "var(--fig-axis)", "middle")
    return svg_wrap(240, 180, body, "2022 Q46: Spring-mass with force")

def fig_2022_q48():
    """Disc with point mass m at point P, rotating to bottom P2."""
    body = ""
    body += label(40, 25, "Disc with point mass", 10)
    # disc
    body += circle(120, 120, 60, stroke="var(--fig-primary)", sw=2)
    # center
    body += dot(120, 120, 3)
    # point mass at top P1
    body += dot(120, 60, 5, fill="var(--fig-danger)")
    body += label(125, 55, "P (top)", 9, "var(--fig-danger-soft)")
    # bottom P2
    body += dot(120, 180, 5, fill="var(--fig-secondary)")
    body += label(125, 195, "P2 (bottom)", 9, "var(--fig-secondary-soft)")
    body += label(60, 125, "M, R", 10, "var(--fig-text)")
    body += label(120, 20, "m", 11, "var(--fig-danger)", "middle")
    return svg_wrap(240, 220, body, "2022 Q48: Disc with point mass")

def fig_2022_q49():
    """|V(x)| vs x for two masses at y=±a."""
    body = ""
    body += label(40, 25, "|V(x)| vs x", 10)
    body += line(40, 140, 200, 140, stroke="var(--fig-line)", sw=1.5)
    body += line(40, 40, 40, 180, stroke="var(--fig-line)", sw=1.5)
    # bell-shaped curve symmetric about x=0 (center)
    body += path("M 40 140 C 70 140, 80 60, 120 50 C 160 60, 170 140, 200 140", stroke="var(--fig-primary)", sw=2)
    body += label(120, 195, "x", 10, "var(--fig-axis)", "middle")
    body += label(30, 55, "|V(x)|", 10, "var(--fig-axis)")
    body += label(120, 30, "Symmetric bell curve", 9, "var(--fig-axis)", "middle")
    return svg_wrap(240, 220, body, "2022 Q49: |V(x)| graph")

def fig_2022_q55():
    """PV diagram isobaric process A to B."""
    body = ""
    body += label(40, 25, "P-V diagram (isobaric)", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-line)", sw=1.5)
    body += line(40, 40, 40, 160, stroke="var(--fig-line)", sw=1.5)
    # isobaric: horizontal line from A to B
    body += line(60, 100, 180, 100, stroke="var(--fig-primary)", sw=2.5)
    body += dot(60, 100, 4, fill="var(--fig-danger)")
    body += label(50, 118, "A", 10, "var(--fig-danger-soft)")
    body += dot(180, 100, 4, fill="var(--fig-secondary)")
    body += label(185, 118, "B", 10, "var(--fig-secondary-soft)")
    body += label(30, 165, "V", 10, "var(--fig-axis)")
    body += label(20, 50, "P", 10, "var(--fig-axis)")
    return svg_wrap(240, 200, body, "2022 Q55: Isobaric P-V diagram")

def fig_2022_q57():
    """d vs x graph: linear decrease then constant."""
    body = ""
    body += label(40, 25, "d vs x graph", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-line)", sw=1.5)
    body += line(40, 40, 40, 160, stroke="var(--fig-line)", sw=1.5)
    # line from high d to H/mu then constant
    body += line(40, 50, 100, 100, stroke="var(--fig-primary)", sw=2)
    body += line(100, 100, 200, 100, stroke="var(--fig-primary)", sw=2)
    body += dot(100, 100, 3)
    body += label(30, 165, "x", 10, "var(--fig-axis)")
    body += label(15, 55, "d", 10, "var(--fig-axis)")
    body += label(100, 120, "H/μ", 9, "var(--fig-axis)", "middle")
    return svg_wrap(240, 200, body, "2022 Q57: d vs x graph")

def fig_2022_q62():
    """V-T diagram cyclic process ABCA."""
    body = ""
    body += label(40, 25, "V-T diagram (cycle)", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-line)", sw=1.5)
    body += line(40, 40, 40, 160, stroke="var(--fig-line)", sw=1.5)
    # triangle cycle A->B->C->A
    body += polyline("60,140 180,60 60,60 60,140", stroke="var(--fig-primary)", sw=2)
    body += dot(60, 140, 4, fill="var(--fig-danger)")
    body += label(45, 155, "A", 10, "var(--fig-danger-soft)")
    body += dot(180, 60, 4, fill="var(--fig-secondary)")
    body += label(185, 55, "B", 10, "var(--fig-secondary-soft)")
    body += dot(60, 60, 4, fill="var(--fig-accent)")
    body += label(45, 55, "C", 10, "var(--fig-accent-tint)")
    body += label(30, 165, "T", 10, "var(--fig-axis)")
    body += label(205, 170, "V", 10, "var(--fig-axis)")
    return svg_wrap(240, 200, body, "2022 Q62: V-T cycle")

def fig_2022_q68():
    """Stone hitting stick at distance h from CM."""
    body = ""
    body += label(40, 25, "Stone-stick collision", 10)
    # stick (horizontal line)
    body += line(40, 120, 200, 120, stroke="var(--fig-primary)", sw=3)
    # CM marker
    body += dot(120, 120, 4, fill="var(--fig-danger)")
    body += label(125, 135, "CM", 9, "var(--fig-danger-soft)")
    # hit point h from CM
    body += dot(150, 120, 4, fill="var(--fig-secondary)")
    body += label(155, 135, "h", 9, "var(--fig-secondary-soft)")
    # stone approaching
    body += arrow(20, 120, 40, 120, stroke="var(--fig-danger)", label="v₀", label_pos=(20, 105))
    body += dot(20, 120, 5, fill="var(--fig-danger)")
    body += label(120, 160, "Stick of mass m, length L", 9, "var(--fig-axis)", "middle")
    return svg_wrap(240, 200, body, "2022 Q68: Stone hits stick")

def fig_2022_q69():
    """Lens-mirror system with object O."""
    body = ""
    body += label(40, 25, "Lens-mirror system", 10)
    # lens (vertical double arrow)
    body += line(100, 60, 100, 160, stroke="var(--fig-primary)", sw=2.5)
    body += line(95, 65, 105, 65, stroke="var(--fig-primary)", sw=2)
    body += line(95, 155, 105, 155, stroke="var(--fig-primary)", sw=2)
    body += label(85, 55, "Lens (f=15cm)", 8, "var(--fig-axis)")
    # mirror (vertical line at right)
    body += line(180, 60, 180, 160, stroke="var(--fig-secondary)", sw=3)
    body += label(185, 55, "Mirror", 8, "var(--fig-secondary-soft)")
    # distances
    body += line(100, 170, 180, 170, stroke="var(--fig-axis)", sw=1, dash="3,3")
    body += label(140, 185, "10 cm", 8, "var(--fig-axis)", "middle")
    body += line(40, 170, 100, 170, stroke="var(--fig-axis)", sw=1, dash="3,3")
    body += label(70, 185, "30 cm", 8, "var(--fig-axis)", "middle")
    # object
    body += arrow(40, 120, 40, 100, stroke="var(--fig-danger)", label="O", label_pos=(30, 95))
    body += dot(40, 120, 4, fill="var(--fig-danger)")
    return svg_wrap(240, 220, body, "2022 Q69: Lens-mirror setup")

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

def fig_2023_q42():
    """x-t and y-t graphs of a particle in 2D."""
    body = ""
    body += label(40, 20, "(x,t) and (y,t) diagrams", 10)
    # x-t graph (top)
    body += label(40, 38, "x-t", 9, "var(--fig-axis)")
    body += line(40, 60, 200, 60, stroke="var(--fig-line)", sw=1)
    body += line(40, 30, 40, 90, stroke="var(--fig-line)", sw=1)
    body += polyline("40,70 80,55 120,50 160,45 200,40", stroke="var(--fig-primary)", sw=2)
    # y-t graph (bottom)
    body += label(40, 115, "y-t", 9, "var(--fig-axis)")
    body += line(40, 140, 200, 140, stroke="var(--fig-line)", sw=1)
    body += line(40, 110, 40, 170, stroke="var(--fig-line)", sw=1)
    body += polyline("40,150 80,155 120,145 160,135 200,125", stroke="var(--fig-secondary)", sw=2)
    return svg_wrap(240, 200, body, "2023 Q42: x-t and y-t graphs")

def fig_2023_q48():
    """PV diagram with adiabatic CA and isothermal BA processes."""
    body = ""
    body += label(40, 25, "P-V diagram", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-line)", sw=1.5)
    body += line(40, 40, 40, 160, stroke="var(--fig-line)", sw=1.5)
    # isothermal BA: curve from B to A
    body += path("M 60 50 Q 100 70, 180 120", stroke="var(--fig-secondary)", sw=2)
    # adiabatic CA: steeper curve from C to A
    body += path("M 180 150 Q 130 100, 60 50", stroke="var(--fig-danger)", sw=2)
    body += dot(60, 50, 4, fill="var(--fig-danger)")
    body += label(45, 42, "A", 10, "var(--fig-danger-soft)")
    body += dot(180, 120, 4, fill="var(--fig-secondary)")
    body += label(185, 115, "B", 10, "var(--fig-secondary-soft)")
    body += dot(180, 150, 4, fill="var(--fig-accent)")
    body += label(185, 165, "C", 10, "var(--fig-accent-tint)")
    body += label(30, 165, "V", 10, "var(--fig-axis)")
    body += label(20, 50, "P", 10, "var(--fig-axis)")
    body += label(120, 180, "BA: isothermal, CA: adiabatic", 8, "var(--fig-axis)", "middle")
    return svg_wrap(240, 220, body, "2023 Q48: PV diagram")

def fig_2023_q60():
    """Wheatstone bridge circuit with galvanometer."""
    body = ""
    body += label(40, 25, "Wheatstone bridge", 10)
    # diamond bridge
    body += line(120, 50, 120, 100, stroke="var(--fig-primary)", sw=2)
    body += line(120, 100, 80, 150, stroke="var(--fig-primary)", sw=2)
    body += line(120, 100, 160, 150, stroke="var(--fig-primary)", sw=2)
    body += line(80, 150, 160, 150, stroke="var(--fig-primary)", sw=2)
    # top cross
    body += line(80, 100, 160, 100, stroke="var(--fig-primary)", sw=2)
    body += line(80, 50, 160, 50, stroke="var(--fig-primary)", sw=2)
    body += line(80, 50, 80, 100, stroke="var(--fig-primary)", sw=1.5)
    body += line(160, 50, 160, 100, stroke="var(--fig-primary)", sw=1.5)
    # resistors
    body += label(70, 75, "R₁", 8, "var(--fig-axis)")
    body += label(150, 75, "R₂", 8, "var(--fig-axis)")
    body += label(65, 130, "R₃", 8, "var(--fig-axis)")
    body += label(175, 130, "R₄", 8, "var(--fig-axis)")
    # galvanometer in middle
    body += circle(120, 100, 10, stroke="var(--fig-danger)", sw=2)
    body += label(120, 103, "G", 8, "var(--fig-danger-soft)", "middle")
    # battery
    body += line(120, 150, 120, 175, stroke="var(--fig-primary)", sw=1.5)
    body += label(125, 170, "Battery", 8, "var(--fig-axis)")
    return svg_wrap(240, 200, body, "2023 Q60: Wheatstone bridge")

def fig_2023_q61():
    """Power vs load resistance graph with maximum point M."""
    body = ""
    body += label(40, 25, "P vs R graph", 10)
    body += line(40, 160, 200, 160, stroke="var(--fig-line)", sw=1.5)
    body += line(40, 40, 40, 160, stroke="var(--fig-line)", sw=1.5)
    # bell curve
    body += path("M 40 150 C 60 150, 80 60, 120 45 C 160 60, 180 150, 200 150", stroke="var(--fig-primary)", sw=2)
    # max point M
    body += dot(120, 45, 5, fill="var(--fig-danger)")
    body += label(125, 38, "M", 10, "var(--fig-danger-soft)")
    body += label(30, 165, "R", 10, "var(--fig-axis)")
    body += label(20, 55, "P", 10, "var(--fig-axis)")
    return svg_wrap(240, 200, body, "2023 Q61: P vs R graph")

def fig_2023_q66():
    """Spring-mass on frictionless surface with force F."""
    body = ""
    body += label(40, 25, "Spring-mass system", 10)
    # surface
    body += line(30, 130, 210, 130, stroke="var(--fig-line)", sw=2)
    # spring
    body += line(30, 130, 30, 100, stroke="var(--fig-primary)", sw=2)
    body += polyline("30,100 30,95 35,95 30,90 35,90 30,85 35,85 30,80 35,80 30,75 35,75 30,70", stroke="var(--fig-primary)", sw=1.5)
    body += line(35, 70, 90, 70, stroke="var(--fig-primary)", sw=1.5)
    # mass
    body += rect_(90, 55, 50, 35, "var(--fig-primary)")
    body += label(115, 75, "m", 11, "var(--fig-text)", "middle")
    # force
    body += arrow(150, 75, 210, 75, stroke="var(--fig-danger)", label="F", label_pos=(215, 70))
    body += label(115, 155, "Frictionless surface, spring constant k", 8, "var(--fig-axis)", "middle")
    return svg_wrap(240, 180, body, "2023 Q66: Spring-mass with force")

def fig_2023_q68():
    """RC circuit with capacitor, resistor, and switch."""
    body = ""
    body += label(40, 25, "RC circuit", 10)
    # loop
    body += line(60, 50, 180, 50, stroke="var(--fig-primary)", sw=2)
    body += line(180, 50, 180, 150, stroke="var(--fig-primary)", sw=2)
    body += line(180, 150, 60, 150, stroke="var(--fig-primary)", sw=2)
    body += line(60, 150, 60, 50, stroke="var(--fig-primary)", sw=2)
    # capacitor (left side)
    body += line(60, 80, 60, 90, stroke="var(--fig-primary)", sw=3)
    body += line(60, 110, 60, 120, stroke="var(--fig-primary)", sw=3)
    body += label(45, 100, "C", 10, "var(--fig-secondary)")
    # resistor (top)
    body += rect_(100, 42, 30, 16, "var(--fig-accent)")
    body += label(115, 35, "R", 10, "var(--fig-accent-tint)", "middle")
    # switch (right side)
    body += line(180, 90, 180, 100, stroke="var(--fig-primary)", sw=2)
    body += line(180, 100, 175, 108, stroke="var(--fig-primary)", sw=2)
    body += label(190, 100, "S", 10, "var(--fig-text)")
    # EMF source (bottom)
    body += circle(120, 150, 10, stroke="var(--fig-primary)", sw=2)
    body += label(120, 153, "E", 9, "var(--fig-text)", "middle")
    return svg_wrap(240, 200, body, "2023 Q68: RC circuit")

def fig_2023_q70():
    """Young's double slit with screen and point P."""
    body = ""
    body += label(40, 25, "Young's double slit", 10)
    # source
    body += dot(30, 100, 4, fill="var(--fig-primary)")
    body += label(25, 90, "S", 9, "var(--fig-text)")
    # slits
    body += line(80, 70, 80, 80, stroke="var(--fig-primary)", sw=3)
    body += line(80, 120, 80, 130, stroke="var(--fig-primary)", sw=3)
    body += label(75, 65, "S₁", 8, "var(--fig-primary)")
    body += label(75, 140, "S₂", 8, "var(--fig-primary)")
    # rays to P
    body += line(80, 75, 180, 100, stroke="var(--fig-primary)", sw=1, dash="2,2")
    body += line(80, 125, 180, 100, stroke="var(--fig-primary)", sw=1, dash="2,2")
    # screen
    body += line(180, 50, 180, 150, stroke="var(--fig-line)", sw=2)
    body += label(185, 55, "Screen", 8, "var(--fig-axis)")
    # point P
    body += dot(180, 100, 5, fill="var(--fig-danger)")
    body += label(185, 103, "P", 9, "var(--fig-danger-soft)")
    body += label(120, 170, "b = slit separation, d = screen distance", 8, "var(--fig-axis)", "middle")
    return svg_wrap(240, 200, body, "2023 Q70: Young's double slit")

def fig_2023_q91():
    """RLC series circuit with current source."""
    body = ""
    body += label(40, 25, "RLC circuit", 10)
    # loop
    body += line(60, 50, 180, 50, stroke="var(--fig-primary)", sw=2)
    body += line(180, 50, 180, 150, stroke="var(--fig-primary)", sw=2)
    body += line(180, 150, 60, 150, stroke="var(--fig-primary)", sw=2)
    body += line(60, 150, 60, 50, stroke="var(--fig-primary)", sw=2)
    # resistor (top)
    body += rect_(80, 42, 30, 16, "var(--fig-accent)")
    body += label(95, 35, "R", 10, "var(--fig-accent-tint)", "middle")
    # inductor (right)
    body += path("M 180 70 Q 170 80, 180 90 Q 170 100, 180 110 Q 170 120, 180 130", stroke="var(--fig-secondary)", sw=2)
    body += label(190, 100, "L", 10, "var(--fig-secondary-soft)")
    # capacitor (bottom)
    body += line(100, 150, 100, 158, stroke="var(--fig-primary)", sw=3)
    body += line(100, 162, 100, 170, stroke="var(--fig-primary)", sw=3)
    body += label(90, 165, "C", 10, "var(--fig-secondary)")
    # current source (left)
    body += circle(60, 100, 10, stroke="var(--fig-danger)", sw=2)
    body += label(60, 103, "i(t)", 7, "var(--fig-danger-soft)", "middle")
    return svg_wrap(240, 200, body, "2023 Q91: RLC circuit")

def fig_2023_q94():
    """Multi-source DC circuit for V_AB."""
    body = ""
    body += label(40, 25, "DC circuit", 10)
    # main loop
    body += line(60, 50, 180, 50, stroke="var(--fig-primary)", sw=2)
    body += line(180, 50, 180, 150, stroke="var(--fig-primary)", sw=2)
    body += line(180, 150, 60, 150, stroke="var(--fig-primary)", sw=2)
    body += line(60, 150, 60, 50, stroke="var(--fig-primary)", sw=2)
    # sources and resistors on top
    body += circle(80, 50, 8, stroke="var(--fig-danger)", sw=2)
    body += label(80, 53, "50V", 7, "var(--fig-danger-soft)", "middle")
    body += rect_(100, 42, 20, 16, "var(--fig-accent)")
    body += label(110, 35, "5Ω", 7, "var(--fig-accent-tint)", "middle")
    body += circle(140, 50, 8, stroke="var(--fig-secondary)", sw=2)
    body += label(140, 53, "40V", 7, "var(--fig-secondary-soft)", "middle")
    body += rect_(155, 42, 20, 16, "var(--fig-accent)")
    body += label(165, 35, "4Ω", 7, "var(--fig-accent-tint)", "middle")
    # bottom resistors
    body += rect_(80, 142, 20, 16, "var(--fig-accent)")
    body += label(90, 165, "30V", 7, "var(--fig-accent-tint)", "middle")
    body += rect_(120, 142, 20, 16, "var(--fig-accent)")
    body += label(130, 165, "3Ω", 7, "var(--fig-accent-tint)", "middle")
    body += label(120, 180, "Find V_AB", 9, "var(--fig-axis)", "middle")
    return svg_wrap(240, 210, body, "2023 Q94: DC circuit")

def fig_2023_q95():
    """Capacitor combination network across X-Y."""
    body = ""
    body += label(40, 25, "Capacitor network", 10)
    # nodes X and Y
    body += dot(50, 80, 5, fill="var(--fig-danger)")
    body += label(42, 70, "X", 10, "var(--fig-danger-soft)")
    body += dot(50, 160, 5, fill="var(--fig-secondary)")
    body += label(42, 175, "Y", 10, "var(--fig-secondary-soft)")
    # capacitors
    body += line(50, 80, 120, 80, stroke="var(--fig-primary)", sw=1.5)
    body += line(120, 80, 120, 100, stroke="var(--fig-primary)", sw=3)
    body += line(120, 110, 120, 130, stroke="var(--fig-primary)", sw=3)
    body += line(120, 130, 120, 160, stroke="var(--fig-primary)", sw=1.5)
    body += line(50, 160, 120, 160, stroke="var(--fig-primary)", sw=1.5)
    body += label(135, 100, "C₁", 9, "var(--fig-axis)")
    body += label(135, 145, "C₂", 9, "var(--fig-axis)")
    # parallel caps
    body += line(150, 80, 200, 80, stroke="var(--fig-primary)", sw=1.5)
    body += line(150, 160, 200, 160, stroke="var(--fig-primary)", sw=1.5)
    body += line(200, 80, 200, 160, stroke="var(--fig-primary)", sw=3)
    body += label(210, 120, "C₃", 9, "var(--fig-axis)")
    return svg_wrap(240, 200, body, "2023 Q95: Capacitor network")

def main():
    outdir_base = "_data/figures"
    figures = {
        "2022": {
            "fig-2022-q42": fig_2022_q42,
            "fig-2022-q46": fig_2022_q46,
            "fig-2022-q48": fig_2022_q48,
            "fig-2022-q49": fig_2022_q49,
            "fig-2022-q55": fig_2022_q55,
            "fig-2022-q57": fig_2022_q57,
            "fig-2022-q62": fig_2022_q62,
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
            "fig-2023-q60": fig_2023_q60,
            "fig-2023-q61": fig_2023_q61,
            "fig-2023-q66": fig_2023_q66,
            "fig-2023-q68": fig_2023_q68,
            "fig-2023-q70": fig_2023_q70,
            "fig-2023-q91": fig_2023_q91,
            "fig-2023-q94": fig_2023_q94,
            "fig-2023-q95": fig_2023_q95,
        },
        "2024": {
            "fig-2024-q42": fig_2024_q42,
            "fig-2024-q43": fig_2024_q43,
            "fig-2024-q46": fig_2024_q46,
            "fig-2024-q52": fig_2024_q52,
            "fig-2024-q54": fig_2024_q54,
            "fig-2024-q55": fig_2024_q55,
            "fig-2024-q57": fig_2024_q57,
            "fig-2024-q61": fig_2024_q61,
            "fig-2024-q65": fig_2024_q65,
            "fig-2024-q66": fig_2024_q66,
            "fig-2024-q67": fig_2024_q67,
            "fig-2024-q68": fig_2024_q68,
            "fig-2024-q70": fig_2024_q70,
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
            "fig-2025-q51": fig_2025_q51,
            "fig-2025-q54": fig_2025_q54,
            "fig-2025-q55": fig_2025_q55,
            "fig-2025-q58": fig_2025_q58,
            "fig-2025-q61": fig_2025_q61,
            "fig-2025-q62": fig_2025_q62,
            "fig-2025-q66": fig_2025_q66,
            "fig-2025-q67": fig_2025_q67,
            "fig-2025-q81": fig_2025_q81,
            "fig-2025-q82": fig_2025_q82,
            "fig-2025-q83": fig_2025_q83,
            "fig-2025-q85": fig_2025_q85,
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
