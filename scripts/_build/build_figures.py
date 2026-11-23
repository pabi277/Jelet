#!/usr/bin/env python3
"""Generate vector SVG figures for all figureKeys referenced in the 2024 & 2025 question banks.
Each figure is a clean, schematic SVG matching the question's content."""
import os

def svg_wrap(w, h, body, title=""):
    """Wrap SVG body in a complete SVG element with dark-theme-friendly styling."""
    title_xml = f'  <text x="15" y="20" font-family="monospace" font-size="11" fill="#94a3b8">{title}</text>\n' if title else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{title}">
  <rect x="0" y="0" width="{w}" height="{h}" fill="transparent"/>
{title_xml}{body}</svg>'''

def line(x1, y1, x2, y2, stroke="#475569", sw=1.5, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"{d}/>\n'

def arrow(x1, y1, x2, y2, stroke="#60a5fa", sw=1.8, label=None, label_pos=None):
    body = f'  <line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"/>\n'
    # arrowhead
    import math
    ang = math.atan2(y2-y1, x2-x1)
    ah = 8
    a1 = ang + math.radians(150)
    a2 = ang - math.radians(150)
    body += f'  <polygon points="{x2},{y2} {x2+ah*math.cos(a1):.1f},{y2+ah*math.sin(a1):.1f} {x2+ah*math.cos(a2):.1f},{y2+ah*math.sin(a2):.1f}" fill="{stroke}"/>\n'
    if label and label_pos:
        body += f'  <text x="{label_pos[0]}" y="{label_pos[1]}" font-family="monospace" font-size="12" fill="#cbd5e1">{label}</text>\n'
    return body

def circle(cx, cy, r, stroke="#60a5fa", sw=1.5, fill="none"):
    return f'  <circle cx="{cx}" cy="{cy}" r="{r}" stroke="{stroke}" stroke-width="{sw}" fill="{fill}"/>\n'

def label(x, y, text, size=11, color="#cbd5e1", anchor="start"):
    return f'  <text x="{x}" y="{y}" font-family="monospace" font-size="{size}" fill="{color}" text-anchor="{anchor}">{text}</text>\n'

def path(d, stroke="#60a5fa", sw=1.5, fill="none"):
    return f'  <path d="{d}" stroke="{stroke}" stroke-width="{sw}" fill="{fill}"/>\n'

def polyline(points, stroke="#60a5fa", sw=1.5, fill="none"):
    return f'  <polyline points="{points}" stroke="{stroke}" stroke-width="{sw}" fill="{fill}"/>\n'

def dot(cx, cy, r=3, fill="#f8fafc"):
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
    body += line(40, 70, 120, 70, stroke="#f87171", sw=2)
    body += label(70, 65, "a = const", 10, "#fca5a5")
    # v-t graph (bottom): v increases linearly then constant
    body += label(40, 130, "v-t", 10)
    body += line(40, 160, 200, 160)
    body += line(40, 160, 40, 200)
    body += line(200, 160, 200, 200)
    body += polyline("40,200 120,140 200,140", stroke="#60a5fa", sw=2)
    body += label(160, 155, "v increasing then constant", 9, "#cbd5e1")
    return svg_wrap(240, 220, body, "2024 Q42: a-t and v-t graphs")

def fig_2024_q43():
    """vectors A, B, C: A perpendicular to B and C."""
    body = ""
    body += label(40, 30, "Vectors A, B, C", 10)
    # origin
    body += dot(120, 130)
    body += arrow(120, 130, 200, 80, stroke="#60a5fa", label="A", label_pos=(205, 75))
    body += arrow(120, 130, 60, 60, stroke="#34d399", label="B", label_pos=(30, 55))
    body += arrow(120, 130, 60, 200, stroke="#f59e0b", label="C", label_pos=(25, 215))
    body += label(120, 150, "A ⊥ B, A ⊥ C", 10, "#94a3b8", "middle")
    return svg_wrap(240, 240, body, "2024 Q43: Perpendicular vectors")

def fig_2024_q46():
    """displacement-time graph with regions AB, BC, CD, DE."""
    body = ""
    body += label(40, 30, "x-t graph", 10)
    body += line(40, 60, 200, 60)
    body += line(40, 60, 40, 180)
    body += line(200, 60, 200, 180)
    # curve: AB (curved), BC (straight), CD (curved), DE (straight)
    body += polyline("40,160 80,140 120,100 160,120 200,80", stroke="#60a5fa", sw=2)
    for x, y, t in [(40,160,"A"),(80,140,"B"),(120,100,"C"),(160,120,"D"),(200,80,"E")]:
        body += dot(x, y, 3)
        body += label(x-5, y+18, t, 10, "#cbd5e1", "middle")
    return svg_wrap(240, 200, body, "2024 Q46: Displacement-time graph")

def fig_2024_q52():
    """rolling disc on horizontal then inclined plane."""
    body = ""
    body += label(40, 30, "Disc rolling", 10)
    # horizontal surface
    body += line(30, 140, 130, 140, stroke="#94a3b8", sw=2)
    # incline
    body += line(130, 140, 210, 80, stroke="#94a3b8", sw=2)
    body += line(130, 140, 130, 160, stroke="#94a3b8", sw=1)
    body += line(210, 80, 210, 160, stroke="#94a3b8", sw=1)
    # disc on incline
    body += circle(170, 115, 12, stroke="#60a5fa", sw=2, fill="#1e293b")
    body += arrow(185, 115, 200, 115, stroke="#f87171", sw=1.5, label="v", label_pos=(202, 110))
    body += label(170, 145, "incline", 9, "#94a3b8", "middle")
    return svg_wrap(240, 170, body, "2024 Q52: Rolling disc on incline")

def fig_2024_q54():
    """extension-load graph for two materials."""
    body = ""
    body += label(40, 30, "Load vs Extension", 10)
    body += line(40, 160, 200, 160)
    body += line(40, 160, 40, 40)
    body += label(30, 165, "ext", 9, "#94a3b8", "middle")
    body += label(205, 165, "load", 9, "#94a3b8")
    # line A (steeper)
    body += line(40, 160, 180, 60, stroke="#60a5fa", sw=2)
    # line B (less steep)
    body += line(40, 160, 180, 110, stroke="#34d399", sw=2)
    body += label(175, 55, "A", 11, "#60a5fa")
    body += label(175, 105, "B", 11, "#34d399")
    return svg_wrap(240, 180, body, "2024 Q54: Extension-load graph")

def fig_2024_q55():
    """three liquids mixing diagram."""
    body = ""
    body += label(40, 30, "Three liquids A, B, C", 10)
    for i, (y, name, col) in enumerate([(50, "A", "#60a5fa"), (90, "B", "#34d399"), (130, "C", "#f59e0b")]):
        body += f'  <rect x="50" y="{y}" width="140" height="30" fill="{col}" fill-opacity="0.2" stroke="{col}" stroke-width="1.5"/>\n'
        body += label(60, y+20, name, 12, col)
    return svg_wrap(240, 180, body, "2024 Q55: Three liquids")

def fig_2024_q57():
    """P-V diagram: isothermal expansion then isobaric compression."""
    body = ""
    body += label(40, 30, "P-V diagram", 10)
    body += line(40, 160, 200, 160, stroke="#94a3b8")
    body += line(40, 160, 40, 40, stroke="#94a3b8")
    body += label(25, 165, "V", 9, "#94a3b8", "middle")
    body += label(30, 35, "P", 9, "#94a3b8", "middle")
    # isothermal (PV=const) then isobaric (P=const)
    body += path("M 50,140 Q 120,140 150,90", stroke="#60a5fa", sw=2)
    body += line(150, 90, 180, 90, stroke="#f87171", sw=2, dash="5,3")
    body += dot(50, 140, 3)
    body += dot(150, 90, 3)
    body += dot(180, 90, 3)
    body += label(55, 155, "A", 10, "#cbd5e1")
    body += label(145, 85, "B", 10, "#cbd5e1")
    body += label(175, 85, "final", 9, "#cbd5e1")
    return svg_wrap(240, 180, body, "2024 Q57: P-V diagram")

def fig_2024_q61():
    """heat input graph: solid, melting, liquid, boiling, gas."""
    body = ""
    body += label(40, 30, "Heat vs Temperature", 10)
    body += line(40, 160, 200, 160, stroke="#94a3b8")
    body += line(40, 160, 40, 40, stroke="#94a3b8")
    body += label(25, 165, "T", 9, "#94a3b8", "middle")
    body += label(30, 35, "Q", 9, "#94a3b8", "middle")
    # segments: AB solid, BC melting, CD liquid, DE gas
    body += polyline("40,150 100,150 100,100 160,100 160,50 200,50", stroke="#60a5fa", sw=2)
    for x, y, t in [(40,150,"A"),(100,150,"B"),(100,100,"C"),(160,100,"D"),(160,50,"E"),(200,50,"F")]:
        body += dot(x, y, 2.5)
        body += label(x-5, y+18, t, 9, "#cbd5e1", "middle")
    return svg_wrap(240, 180, body, "2024 Q61: Heating curve")

def fig_2024_q65():
    """bullet hitting block."""
    body = ""
    body += label(40, 30, "Bullet embeds in block", 10)
    # bullet path
    body += arrow(40, 90, 90, 90, stroke="#f87171", sw=2, label="bullet", label_pos=(50, 80))
    # block
    body += f'  <rect x="90" y="70" width="80" height="40" fill="none" stroke="#60a5fa" stroke-width="2"/>\n'
    body += label(130, 95, "block", 10, "#cbd5e1", "middle")
    body += label(130, 145, "frictionless surface", 9, "#94a3b8", "middle")
    body += line(30, 150, 220, 150, stroke="#475569", sw=1)
    return svg_wrap(240, 170, body, "2024 Q65: Bullet into block")

def fig_2024_q66():
    """logic gate circuit."""
    body = ""
    body += label(40, 30, "Logic circuit", 10)
    body += circle(70, 90, 20, stroke="#60a5fa", sw=2)
    body += label(70, 95, "NAND", 9, "#cbd5e1", "middle")
    body += circle(140, 90, 20, stroke="#60a5fa", sw=2)
    body += label(140, 95, "NOT", 9, "#cbd5e1", "middle")
    body += line(40, 90, 50, 90)
    body += dot(50, 90, 3)
    body += line(90, 90, 120, 90)
    body += line(160, 90, 190, 90)
    body += label(30, 95, "A", 10, "#cbd5e1", "middle")
    body += label(30, 115, "B", 10, "#cbd5e1", "middle")
    body += label(195, 95, "Y", 10, "#cbd5e1")
    return svg_wrap(240, 140, body, "2024 Q66: Logic circuit")

def fig_2024_q67():
    """block hanging from pulley, force F applied."""
    body = ""
    body += label(40, 30, "Pulley system", 10)
    # support
    body += line(30, 50, 200, 50, stroke="#475569", sw=2)
    # pulley
    body += circle(100, 70, 12, stroke="#60a5fa", sw=2, fill="#1e293b")
    # string
    body += line(100, 82, 100, 120, stroke="#94a3b8", sw=1.5)
    # block
    body += f'  <rect x="85" y="120" width="30" height="25" fill="none" stroke="#60a5fa" stroke-width="2"/>\n'
    body += label(100, 115, "block (2 kg)", 9, "#cbd5e1", "middle")
    # force F
    body += arrow(170, 70, 200, 70, stroke="#f87171", sw=2, label="F = 40 N", label_pos=(172, 60))
    return svg_wrap(240, 160, body, "2024 Q67: Pulley with force")

def fig_2024_q68():
    """elliptical orbit of planet around Sun."""
    body = ""
    body += label(40, 30, "Elliptical orbit", 10)
    body += path("M 120,40 Q 200,110 120,160 Q 40,110 120,40", stroke="#60a5fa", sw=1.5, fill="none")
    body += dot(120, 100, 5, fill="#fbbf24")
    body += label(125, 95, "Sun", 10, "#fbbf24")
    body += dot(180, 75, 4, fill="#60a5fa")
    body += label(185, 72, "Planet", 9, "#60a5fa")
    return svg_wrap(240, 180, body, "2024 Q68: Elliptical orbit")

def fig_2024_q70():
    """vector P = (A×B)×(C×D)."""
    body = ""
    body += label(40, 30, "P = (A×B)×(C×D)", 10)
    body += dot(120, 100, 4)
    body += arrow(120, 100, 200, 60, stroke="#60a5fa", sw=2, label="A×B", label_pos=(160, 55))
    body += arrow(120, 100, 60, 140, stroke="#34d399", sw=2, label="C×D", label_pos=(20, 155))
    body += arrow(120, 100, 160, 140, stroke="#f87171", sw=2, label="P", label_pos=(165, 155))
    return svg_wrap(240, 180, body, "2024 Q70: Vector product")

def fig_2024_q94():
    """power supply block diagram."""
    body = ""
    body += label(40, 30, "Power supply", 10)
    body += f'  <rect x="40" y="60" width="160" height="70" fill="none" stroke="#60a5fa" stroke-width="2" rx="5"/>\n'
    body += label(120, 95, "Power Supply", 12, "#cbd5e1", "middle")
    body += arrow(100, 130, 100, 160, stroke="#94a3b8", sw=1.5)
    body += arrow(140, 160, 140, 130, stroke="#94a3b8", sw=1.5)
    body += label(100, 175, "load", 9, "#94a3b8", "middle")
    body += label(140, 175, "input", 9, "#94a3b8", "middle")
    return svg_wrap(240, 180, body, "2024 Q94: Power supply")

def fig_2024_q96():
    """series-parallel resistor/AC circuit."""
    body = ""
    body += label(40, 30, "AC circuit", 10)
    body += circle(60, 100, 12, stroke="#60a5fa", sw=2)
    body += label(60, 105, "R₁", 9, "#cbd5e1", "middle")
    body += circle(110, 100, 12, stroke="#60a5fa", sw=2)
    body += label(110, 105, "L₁", 9, "#cbd5e1", "middle")
    body += circle(160, 100, 12, stroke="#60a5fa", sw=2)
    body += label(160, 105, "R₂", 9, "#cbd5e1", "middle")
    body += line(40, 100, 50, 100); body += line(70, 100, 95, 100); body += line(120, 100, 145, 100); body += line(170, 100, 190, 100)
    body += label(40, 90, "I₁", 9, "#cbd5e1", "middle")
    body += label(105, 90, "I₂", 9, "#cbd5e1", "middle")
    body += label(195, 100, "I", 10, "#cbd5e1")
    return svg_wrap(240, 140, body, "2024 Q96: AC circuit")

def fig_2024_q97():
    """transistor symbol."""
    body = ""
    body += label(40, 30, "PNP Transistor", 10)
    # base vertical
    body += line(100, 60, 100, 140, stroke="#60a5fa", sw=2)
    # emitter arrow pointing in
    body += line(100, 80, 60, 60, stroke="#f87171", sw=2)
    body += f'  <polygon points="60,60 72,55 72,65" fill="#f87171"/>\n'
    body += line(100, 110, 60, 120, stroke="#f87171", sw=2)
    body += f'  <polygon points="60,120 72,115 72,125" fill="#f87171"/>\n'
    # collector
    body += line(100, 70, 140, 50, stroke="#34d399", sw=2)
    body += line(100, 130, 140, 150, stroke="#34d399", sw=2)
    body += label(55, 75, "E", 10, "#f87171")
    body += label(55, 135, "E", 10, "#f87171")
    body += label(105, 50, "B", 10, "#cbd5e1")
    body += label(145, 50, "C", 10, "#34d399")
    return svg_wrap(240, 170, body, "2024 Q97: PNP transistor")

def fig_2024_q98():
    """op-amp triangle."""
    body = ""
    body += label(40, 30, "Op-Amp", 10)
    body += polyline("40,100 150,100 190,70 190,130 150,100", stroke="#60a5fa", sw=2)
    body += label(150, 95, "−", 14, "#cbd5e1", "middle")
    body += label(150, 120, "+", 14, "#cbd5e1", "middle")
    body += label(160, 115, "op-amp", 9, "#94a3b8", "middle")
    body += line(20, 100, 40, 100, stroke="#94a3b8")
    body += line(190, 100, 210, 100, stroke="#94a3b8")
    body += label(20, 90, "in", 9, "#94a3b8", "middle")
    body += label(215, 90, "out", 9, "#94a3b8", "middle")
    return svg_wrap(240, 150, body, "2024 Q98: Op-Amp")

# ---- 2025 figures ----

def fig_2025_q44():
    """acceleration-time graph: constant a then 0."""
    body = ""
    body += label(40, 30, "a-t graph", 10)
    body += line(40, 60, 200, 60, stroke="#94a3b8")
    body += line(40, 60, 40, 160, stroke="#94a3b8")
    body += line(200, 60, 200, 160, stroke="#94a3b8")
    body += line(40, 80, 140, 80, stroke="#f87171", sw=2)
    body += line(140, 80, 140, 60, stroke="#94a3b8", sw=1, dash="3,3")
    body += label(80, 75, "a = const", 10, "#fca5a5", "middle")
    body += label(170, 90, "a = 0", 10, "#94a3b8", "middle")
    return svg_wrap(240, 180, body, "2025 Q44: Acceleration-time graph")

def fig_2025_q46():
    """displacement-time graph regions."""
    body = ""
    body += label(40, 30, "x-t graph", 10)
    body += line(40, 60, 200, 60, stroke="#94a3b8")
    body += line(40, 60, 40, 180, stroke="#94a3b8")
    body += line(200, 60, 200, 180, stroke="#94a3b8")
    body += polyline("40,160 70,150 100,120 130,100 170,110 200,90", stroke="#60a5fa", sw=2)
    for x, y, t in [(40,160,"A"),(70,150,"B"),(100,120,"C"),(130,100,"D"),(170,110,"E")]:
        body += dot(x, y, 3)
        body += label(x-5, y+18, t, 10, "#cbd5e1", "middle")
    return svg_wrap(240, 200, body, "2025 Q46: Displacement-time graph")

def fig_2025_q51():
    """velocity-time graph in viscous fluid."""
    body = ""
    body += label(40, 30, "v-t in viscous fluid", 10)
    body += line(40, 160, 200, 160, stroke="#94a3b8")
    body += line(40, 160, 40, 40, stroke="#94a3b8")
    body += label(25, 165, "t", 9, "#94a3b8", "middle")
    body += label(30, 35, "v", 9, "#94a3b8", "middle")
    # v increases then becomes constant
    body += path("M 40,160 Q 100,100 140,80 L 200,80", stroke="#60a5fa", sw=2)
    body += label(150, 75, "terminal velocity", 9, "#cbd5e1")
    return svg_wrap(240, 180, body, "2025 Q51: Velocity-time in viscous fluid")

def fig_2025_q54():
    """disc rolling up incline."""
    body = ""
    body += label(40, 30, "Disc on incline", 10)
    body += line(30, 140, 120, 140, stroke="#94a3b8", sw=2)
    body += line(120, 140, 210, 70, stroke="#94a3b8", sw=2)
    body += line(120, 140, 120, 165, stroke="#94a3b8", sw=1)
    body += line(210, 70, 210, 165, stroke="#94a3b8", sw=1)
    body += circle(165, 105, 12, stroke="#60a5fa", sw=2, fill="#1e293b")
    body += arrow(180, 105, 195, 105, stroke="#f87171", sw=1.5, label="v", label_pos=(197, 100))
    body += label(165, 130, "incline", 9, "#94a3b8", "middle")
    return svg_wrap(240, 175, body, "2025 Q54: Disc on incline")

def fig_2025_q55():
    """extension-load graph for two wires."""
    body = ""
    body += label(40, 30, "Load vs Extension", 10)
    body += line(40, 160, 200, 160, stroke="#94a3b8")
    body += line(40, 160, 40, 40, stroke="#94a3b8")
    body += label(25, 165, "ext", 9, "#94a3b8", "middle")
    body += label(30, 35, "load", 9, "#94a3b8", "middle")
    body += line(40, 160, 180, 55, stroke="#60a5fa", sw=2)
    body += line(40, 160, 180, 105, stroke="#34d399", sw=2)
    body += label(175, 50, "A", 11, "#60a5fa")
    body += label(175, 100, "B", 11, "#34d399")
    return svg_wrap(240, 180, body, "2025 Q55: Extension-load graph")

def fig_2025_q58():
    """P-V diagram: isothermal then isobaric."""
    body = ""
    body += label(40, 30, "P-V diagram", 10)
    body += line(40, 160, 200, 160, stroke="#94a3b8")
    body += line(40, 160, 40, 40, stroke="#94a3b8")
    body += label(25, 165, "V", 9, "#94a3b8", "middle")
    body += label(30, 35, "P", 9, "#94a3b8", "middle")
    body += path("M 50,140 Q 120,140 150,90", stroke="#60a5fa", sw=2)
    body += line(150, 90, 185, 90, stroke="#f87171", sw=2, dash="5,3")
    body += dot(50, 140, 3); body += dot(150, 90, 3); body += dot(185, 90, 3)
    body += label(55, 155, "A", 10, "#cbd5e1")
    body += label(145, 85, "B", 10, "#cbd5e1")
    return svg_wrap(240, 180, body, "2025 Q58: P-V diagram")

def fig_2025_q61():
    """three liquids mixing."""
    body = ""
    body += label(40, 30, "Liquids A, B, C", 10)
    for y, name, col in [(50, "A", "#60a5fa"), (90, "B", "#34d399"), (130, "C", "#f59e0b")]:
        body += f'  <rect x="50" y="{y}" width="140" height="30" fill="{col}" fill-opacity="0.2" stroke="{col}" stroke-width="1.5"/>\n'
        body += label(60, y+20, name, 12, col)
    return svg_wrap(240, 180, body, "2025 Q61: Three liquids")

def fig_2025_q62():
    """heat input graph with DE segment."""
    body = ""
    body += label(40, 30, "Heat vs Temperature", 10)
    body += line(40, 160, 200, 160, stroke="#94a3b8")
    body += line(40, 160, 40, 40, stroke="#94a3b8")
    body += label(25, 165, "T", 9, "#94a3b8", "middle")
    body += label(30, 35, "Q", 9, "#94a3b8", "middle")
    body += polyline("40,150 90,150 90,110 150,110 150,60 200,60", stroke="#60a5fa", sw=2)
    for x, y, t in [(40,150,"A"),(90,150,"B"),(90,110,"C"),(150,110,"D"),(150,60,"E"),(200,60,"F")]:
        body += dot(x, y, 2.5)
        body += label(x-5, y+18, t, 9, "#cbd5e1", "middle")
    body += line(150, 110, 150, 60, stroke="#f87171", sw=2, dash="4,2")
    return svg_wrap(240, 180, body, "2025 Q62: Heating curve")

def fig_2025_q66():
    """x-t graph: parabolic then linear."""
    body = ""
    body += label(40, 30, "x-t graph", 10)
    body += line(40, 160, 200, 160, stroke="#94a3b8")
    body += line(40, 160, 40, 40, stroke="#94a3b8")
    body += label(25, 165, "t", 9, "#94a3b8", "middle")
    body += label(30, 35, "x", 9, "#94a3b8", "middle")
    body += path("M 40,160 Q 90,100 120,70 L 200,70", stroke="#60a5fa", sw=2)
    body += label(150, 65, "uniform velocity", 9, "#cbd5e1")
    return svg_wrap(240, 180, body, "2025 Q66: x-t graph")

def fig_2025_q67():
    """block hanging from pulley, force applied."""
    body = ""
    body += label(40, 30, "Pulley system", 10)
    body += line(30, 50, 200, 50, stroke="#475569", sw=2)
    body += circle(100, 70, 12, stroke="#60a5fa", sw=2, fill="#1e293b")
    body += line(100, 82, 100, 120, stroke="#94a3b8", sw=1.5)
    body += f'  <rect x="85" y="120" width="30" height="25" fill="none" stroke="#60a5fa" stroke-width="2"/>\n'
    body += label(100, 115, "block (2 kg)", 9, "#cbd5e1", "middle")
    body += arrow(170, 70, 200, 70, stroke="#f87171", sw=2, label="F = 40 N", label_pos=(172, 60))
    return svg_wrap(240, 160, body, "2025 Q67: Pulley with force")

def fig_2025_q81():
    """organic compound structure (simplified skeletal)."""
    body = ""
    body += label(40, 30, "Compound structure", 10)
    # simplified carbon chain with substituents
    body += polyline("50,120 80,120 100,80 140,80 160,120 190,120", stroke="#60a5fa", sw=2)
    body += dot(50, 120, 3); body += dot(80, 120, 3); body += dot(100, 80, 3)
    body += dot(140, 80, 3); body += dot(160, 120, 3); body += dot(190, 120, 3)
    # double bond
    body += line(100, 88, 140, 88, stroke="#60a5fa", sw=1, dash="2,2")
    # triple bond indicator
    body += line(160, 128, 190, 128, stroke="#60a5fa", sw=1, dash="2,2")
    body += line(160, 112, 190, 112, stroke="#60a5fa", sw=1, dash="2,2")
    return svg_wrap(240, 160, body, "2025 Q81: Organic structure")

def fig_2025_q82():
    """isomer pairs (two structures)."""
    body = ""
    body += label(40, 30, "Isomer pairs", 10)
    # pair 1
    body += polyline("40,70 70,70 90,50 120,50", stroke="#60a5fa", sw=2)
    body += label(80, 65, "(I)", 9, "#cbd5e1", "middle")
    # pair 2
    body += polyline("40,130 70,130 90,150 120,150", stroke="#34d399", sw=2)
    body += label(80, 125, "(II)", 9, "#cbd5e1", "middle")
    return svg_wrap(240, 170, body, "2025 Q82: Isomer structures")

def fig_2025_q83():
    """reaction: CH3Cl with Mg/ether then CH3COOH."""
    body = ""
    body += label(40, 30, "Reaction sequence", 10)
    body += f'  <rect x="30" y="55" width="60" height="35" fill="none" stroke="#60a5fa" stroke-width="1.5"/>\n'
    body += label(60, 78, "CH₃Cl", 10, "#cbd5e1", "middle")
    body += arrow(95, 72, 140, 72, stroke="#f87171", sw=2, label="Mg/ether", label_pos=(105, 65))
    body += f'  <rect x="145" y="55" width="60" height="35" fill="none" stroke="#60a5fa" stroke-width="1.5"/>\n'
    body += label(175, 78, "CH₃MgCl", 9, "#cbd5e1", "middle")
    body += arrow(210, 72, 220, 72, stroke="#f87171", sw=1.5)
    body += label(110, 110, "then CH₃COOH", 9, "#94a3b8", "middle")
    return svg_wrap(240, 130, body, "2025 Q83: Grignard reaction")

def fig_2025_q85():
    """acetylene with NaNH2 then EtBr."""
    body = ""
    body += label(40, 30, "Reaction sequence", 10)
    body += f'  <rect x="30" y="55" width="50" height="35" fill="none" stroke="#60a5fa" stroke-width="1.5"/>\n'
    body += label(55, 78, "HC≡CH", 10, "#cbd5e1", "middle")
    body += arrow(85, 72, 125, 72, stroke="#f87171", sw=2, label="NaNH₂", label_pos=(95, 65))
    body += f'  <rect x="130" y="55" width="50" height="35" fill="none" stroke="#60a5fa" stroke-width="1.5"/>\n'
    body += label(155, 78, "HC≡C⁻", 9, "#cbd5e1", "middle")
    body += arrow(185, 72, 220, 72, stroke="#f87171", sw=2, label="EtBr", label_pos=(195, 65))
    return svg_wrap(240, 130, body, "2025 Q85: Acetylene alkylation")

def fig_2025_q88():
    """propene + HBr reaction."""
    body = ""
    body += label(40, 30, "Reaction", 10)
    body += f'  <rect x="25" y="55" width="55" height="35" fill="none" stroke="#60a5fa" stroke-width="1.5"/>\n'
    body += label(52, 78, "CH₃CH=CH₂", 9, "#cbd5e1", "middle")
    body += arrow(85, 72, 130, 72, stroke="#f87171", sw=2, label="HBr", label_pos=(95, 65))
    body += f'  <rect x="135" y="45" width="50" height="25" fill="none" stroke="#34d399" stroke-width="1.5"/>\n'
    body += label(160, 62, "CH₃CHBrCH₃", 8, "#cbd5e1", "middle")
    body += f'  <rect x="135" y="80" width="50" height="25" fill="none" stroke="#34d399" stroke-width="1.5"/>\n'
    body += label(160, 97, "CH₃CH₂CH₂Br", 8, "#cbd5e1", "middle")
    return svg_wrap(240, 130, body, "2025 Q88: Propene + HBr")

def fig_2025_q95():
    """AC circuit with R, L components."""
    body = ""
    body += label(40, 30, "AC circuit", 10)
    body += circle(60, 100, 12, stroke="#60a5fa", sw=2)
    body += label(60, 105, "R₁", 9, "#cbd5e1", "middle")
    body += circle(110, 100, 12, stroke="#60a5fa", sw=2)
    body += label(110, 105, "L₁", 9, "#cbd5e1", "middle")
    body += circle(160, 100, 12, stroke="#60a5fa", sw=2)
    body += label(160, 105, "R₂", 9, "#cbd5e1", "middle")
    body += line(40, 100, 50, 100); body += line(70, 100, 95, 100); body += line(120, 100, 145, 100); body += line(170, 100, 190, 100)
    body += label(40, 90, "I₁", 9, "#cbd5e1", "middle")
    body += label(105, 90, "I₂", 9, "#cbd5e1", "middle")
    body += label(195, 100, "I", 10, "#cbd5e1")
    return svg_wrap(240, 140, body, "2025 Q95: AC circuit")

def fig_2025_q100():
    """logic gate combination."""
    body = ""
    body += label(40, 30, "Logic circuit", 10)
    body += circle(70, 90, 20, stroke="#60a5fa", sw=2)
    body += label(70, 95, "NAND", 9, "#cbd5e1", "middle")
    body += circle(140, 90, 20, stroke="#60a5fa", sw=2)
    body += label(140, 95, "NOT", 9, "#cbd5e1", "middle")
    body += line(40, 90, 50, 90); body += dot(50, 90, 3); body += line(90, 90, 120, 90); body += line(160, 90, 190, 90)
    body += label(30, 95, "A", 10, "#cbd5e1", "middle")
    body += label(30, 115, "B", 10, "#cbd5e1", "middle")
    body += label(195, 95, "Y", 10, "#cbd5e1")
    return svg_wrap(240, 140, body, "2025 Q100: Logic circuit")

def main():
    outdir_base = "_data/figures"
    figures = {
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
