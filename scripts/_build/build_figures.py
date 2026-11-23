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

# ---- 2022 figures ----

def fig_2022_q42():
    """L, h, t error bars for a strip measurement."""
    body = ""
    body += label(40, 25, "Measurement error diagram", 10)
    # three bars: L, h, t
    for i, (name, val, err, y) in enumerate([("L", 10.0, 0.1, 60), ("h", 1.00, 0.01, 110), ("t", 0.1, 0.001, 160)]):
        body += label(40, y-5, name, 11, "#cbd5e1")
        x1 = 80 + i * 30
        body += line(x1, y, x1+40, y, stroke="#60a5fa", sw=2)
        body += line(x1, y-5, x1, y+5, stroke="#f87171", sw=1.5)
        body += line(x1+40, y-5, x1+40, y+5, stroke="#f87171", sw=1.5)
        body += label(x1+45, y+3, f"{val}±{err}", 9, "#94a3b8")
    return svg_wrap(240, 200, body, "2022 Q42: Measurement error bars")

def fig_2022_q46():
    """Spring-mass system with force F applied."""
    body = ""
    body += label(40, 25, "Spring-mass system", 10)
    # wall
    body += line(30, 100, 30, 160, stroke="#94a3b8", sw=3)
    body += polyline("30,100 30,95 35,95 30,90 35,90 30,85 35,85 30,80 35,80 30,75 35,75 30,70 35,70", stroke="#60a5fa", sw=2)
    # spring
    body += line(35, 70, 90, 70, stroke="#60a5fa", sw=1.5)
    # mass block
    body += line(90, 60, 140, 60, stroke="#60a5fa", sw=2)
    body += line(90, 60, 90, 90, stroke="#60a5fa", sw=2)
    body += line(140, 60, 140, 90, stroke="#60a5fa", sw=2)
    body += line(90, 90, 140, 90, stroke="#60a5fa", sw=2)
    body += label(115, 78, "m", 11, "#cbd5e1", "middle")
    # force arrow
    body += arrow(150, 75, 210, 75, stroke="#f87171", label="F", label_pos=(215, 70))
    body += label(115, 120, "Spring constant k", 9, "#94a3b8", "middle")
    return svg_wrap(240, 180, body, "2022 Q46: Spring-mass with force")

def fig_2022_q48():
    """Disc with point mass m at point P, rotating to bottom P2."""
    body = ""
    body += label(40, 25, "Disc with point mass", 10)
    # disc
    body += circle(120, 120, 60, stroke="#60a5fa", sw=2)
    # center
    body += dot(120, 120, 3)
    # point mass at top P1
    body += dot(120, 60, 5, fill="#f87171")
    body += label(125, 55, "P (top)", 9, "#fca5a5")
    # bottom P2
    body += dot(120, 180, 5, fill="#34d399")
    body += label(125, 195, "P2 (bottom)", 9, "#6ee7b7")
    body += label(60, 125, "M, R", 10, "#cbd5e1")
    body += label(120, 20, "m", 11, "#f87171", "middle")
    return svg_wrap(240, 220, body, "2022 Q48: Disc with point mass")

def fig_2022_q49():
    """|V(x)| vs x for two masses at y=±a."""
    body = ""
    body += label(40, 25, "|V(x)| vs x", 10)
    body += line(40, 140, 200, 140, stroke="#475569", sw=1.5)
    body += line(40, 40, 40, 180, stroke="#475569", sw=1.5)
    # bell-shaped curve symmetric about x=0 (center)
    body += path("M 40 140 C 70 140, 80 60, 120 50 C 160 60, 170 140, 200 140", stroke="#60a5fa", sw=2)
    body += label(120, 195, "x", 10, "#94a3b8", "middle")
    body += label(30, 55, "|V(x)|", 10, "#94a3b8")
    body += label(120, 30, "Symmetric bell curve", 9, "#94a3b8", "middle")
    return svg_wrap(240, 220, body, "2022 Q49: |V(x)| graph")

def fig_2022_q55():
    """PV diagram isobaric process A to B."""
    body = ""
    body += label(40, 25, "P-V diagram (isobaric)", 10)
    body += line(40, 160, 200, 160, stroke="#475569", sw=1.5)
    body += line(40, 40, 40, 160, stroke="#475569", sw=1.5)
    # isobaric: horizontal line from A to B
    body += line(60, 100, 180, 100, stroke="#60a5fa", sw=2.5)
    body += dot(60, 100, 4, fill="#f87171")
    body += label(50, 118, "A", 10, "#fca5a5")
    body += dot(180, 100, 4, fill="#34d399")
    body += label(185, 118, "B", 10, "#6ee7b7")
    body += label(30, 165, "V", 10, "#94a3b8")
    body += label(20, 50, "P", 10, "#94a3b8")
    return svg_wrap(240, 200, body, "2022 Q55: Isobaric P-V diagram")

def fig_2022_q57():
    """d vs x graph: linear decrease then constant."""
    body = ""
    body += label(40, 25, "d vs x graph", 10)
    body += line(40, 160, 200, 160, stroke="#475569", sw=1.5)
    body += line(40, 40, 40, 160, stroke="#475569", sw=1.5)
    # line from high d to H/mu then constant
    body += line(40, 50, 100, 100, stroke="#60a5fa", sw=2)
    body += line(100, 100, 200, 100, stroke="#60a5fa", sw=2)
    body += dot(100, 100, 3)
    body += label(30, 165, "x", 10, "#94a3b8")
    body += label(15, 55, "d", 10, "#94a3b8")
    body += label(100, 120, "H/μ", 9, "#94a3b8", "middle")
    return svg_wrap(240, 200, body, "2022 Q57: d vs x graph")

def fig_2022_q62():
    """V-T diagram cyclic process ABCA."""
    body = ""
    body += label(40, 25, "V-T diagram (cycle)", 10)
    body += line(40, 160, 200, 160, stroke="#475569", sw=1.5)
    body += line(40, 40, 40, 160, stroke="#475569", sw=1.5)
    # triangle cycle A->B->C->A
    body += polyline("60,140 180,60 60,60 60,140", stroke="#60a5fa", sw=2)
    body += dot(60, 140, 4, fill="#f87171")
    body += label(45, 155, "A", 10, "#fca5a5")
    body += dot(180, 60, 4, fill="#34d399")
    body += label(185, 55, "B", 10, "#6ee7b7")
    body += dot(60, 60, 4, fill="#f59e0b")
    body += label(45, 55, "C", 10, "#fcd34d")
    body += label(30, 165, "T", 10, "#94a3b8")
    body += label(205, 170, "V", 10, "#94a3b8")
    return svg_wrap(240, 200, body, "2022 Q62: V-T cycle")

def fig_2022_q68():
    """Stone hitting stick at distance h from CM."""
    body = ""
    body += label(40, 25, "Stone-stick collision", 10)
    # stick (horizontal line)
    body += line(40, 120, 200, 120, stroke="#60a5fa", sw=3)
    # CM marker
    body += dot(120, 120, 4, fill="#f87171")
    body += label(125, 135, "CM", 9, "#fca5a5")
    # hit point h from CM
    body += dot(150, 120, 4, fill="#34d399")
    body += label(155, 135, "h", 9, "#6ee7b7")
    # stone approaching
    body += arrow(20, 120, 40, 120, stroke="#f87171", label="v₀", label_pos=(20, 105))
    body += dot(20, 120, 5, fill="#f87171")
    body += label(120, 160, "Stick of mass m, length L", 9, "#94a3b8", "middle")
    return svg_wrap(240, 200, body, "2022 Q68: Stone hits stick")

def fig_2022_q69():
    """Lens-mirror system with object O."""
    body = ""
    body += label(40, 25, "Lens-mirror system", 10)
    # lens (vertical double arrow)
    body += line(100, 60, 100, 160, stroke="#60a5fa", sw=2.5)
    body += line(95, 65, 105, 65, stroke="#60a5fa", sw=2)
    body += line(95, 155, 105, 155, stroke="#60a5fa", sw=2)
    body += label(85, 55, "Lens (f=15cm)", 8, "#94a3b8")
    # mirror (vertical line at right)
    body += line(180, 60, 180, 160, stroke="#34d399", sw=3)
    body += label(185, 55, "Mirror", 8, "#6ee7b7")
    # distances
    body += line(100, 170, 180, 170, stroke="#94a3b8", sw=1, dash="3,3")
    body += label(140, 185, "10 cm", 8, "#94a3b8", "middle")
    body += line(40, 170, 100, 170, stroke="#94a3b8", sw=1, dash="3,3")
    body += label(70, 185, "30 cm", 8, "#94a3b8", "middle")
    # object
    body += arrow(40, 120, 40, 100, stroke="#f87171", label="O", label_pos=(30, 95))
    body += dot(40, 120, 4, fill="#f87171")
    return svg_wrap(240, 220, body, "2022 Q69: Lens-mirror setup")

def fig_2022_q93():
    """Torque-speed curve with operating points W, X, Y, Z."""
    body = ""
    body += label(40, 25, "Torque-Speed curve", 10)
    body += line(40, 160, 200, 160, stroke="#475569", sw=1.5)
    body += line(40, 40, 40, 160, stroke="#475569", sw=1.5)
    # torque-speed curve (hyperbolic-like)
    body += path("M 40 150 C 60 150, 80 100, 100 70 C 120 50, 140 45, 180 40", stroke="#60a5fa", sw=2)
    # operating points
    for x, y, name in [(60, 130, "W"), (100, 80, "X"), (140, 55, "Y"), (180, 42, "Z")]:
        body += dot(x, y, 4, fill="#f87171")
        body += label(x+8, y-5, name, 10, "#fca5a5")
    body += label(30, 165, "Speed", 9, "#94a3b8")
    body += label(20, 50, "Torque", 9, "#94a3b8")
    return svg_wrap(240, 200, body, "2022 Q93: Torque-speed curve")

def fig_2022_q96():
    """Circuit with voltage source and output v0(t)."""
    body = ""
    body += label(40, 25, "Circuit diagram", 10)
    # voltage source (circle with sine)
    body += circle(80, 100, 25, stroke="#60a5fa", sw=2)
    body += label(80, 100, "Vm sin ωt", 7, "#cbd5e1", "middle")
    # wires
    body += line(80, 75, 80, 50, stroke="#60a5fa", sw=1.5)
    body += line(80, 50, 160, 50, stroke="#60a5fa", sw=1.5)
    body += line(160, 50, 160, 75, stroke="#60a5fa", sw=1.5)
    body += line(160, 75, 160, 125, stroke="#60a5fa", sw=1.5)
    body += line(160, 125, 80, 125, stroke="#60a5fa", sw=1.5)
    body += line(80, 125, 80, 100, stroke="#60a5fa", sw=1.5)
    # output marker
    body += label(160, 40, "v₀(t)", 9, "#f87171", "middle")
    return svg_wrap(240, 180, body, "2022 Q96: Circuit diagram")

def fig_2022_q97():
    """Comparator with sinusoidal input and reference 3V."""
    body = ""
    body += label(40, 25, "Comparator circuit", 10)
    # comparator symbol (triangle)
    polygon_points = "120,70 160,100 120,130"
    body += f'  <polygon points="{polygon_points}" fill="none" stroke="#60a5fa" stroke-width="2"/>\n'
    body += label(140, 150, "Comparator", 9, "#94a3b8", "middle")
    # input sine wave
    body += path("M 30 100 Q 50 70, 70 100 T 110 100", stroke="#f87171", sw=1.5)
    body += label(25, 95, "vᵢ", 9, "#fca5a5")
    # reference line at 3V
    body += line(30, 115, 110, 115, stroke="#34d399", sw=1.5, dash="3,3")
    body += label(30, 128, "3V ref", 8, "#6ee7b7")
    # output
    body += arrow(160, 100, 210, 100, stroke="#f59e0b", label="v₀", label_pos=(215, 95))
    return svg_wrap(240, 180, body, "2022 Q97: Comparator")

def fig_2022_q98():
    """Boolean circuit with inputs A,B,C,D,E,F,G."""
    body = ""
    body += label(40, 25, "Boolean circuit", 10)
    # input labels
    inputs = [("A", 50), ("B", 80), ("C", 110), ("D", 140), ("E", 170), ("F", 200), ("G", 230)]
    for name, x in inputs:
        body += line(x, 50, x, 80, stroke="#60a5fa", sw=1.5)
        body += dot(x, 50, 3, fill="#60a5fa")
        body += label(x, 42, name, 10, "#cbd5e1", "middle")
    # gate boxes
    body += line(50, 80, 50, 120, stroke="#60a5fa", sw=1.5)
    body += line(80, 80, 80, 120, stroke="#60a5fa", sw=1.5)
    body += line(110, 80, 110, 120, stroke="#60a5fa", sw=1.5)
    body += rect_(50, 120, 60, 25, "#34d399")
    body += label(80, 133, "+", 10, "#6ee7b7", "middle")
    body += line(110, 80, 140, 80, stroke="#60a5fa", sw=1.5)
    body += line(140, 80, 140, 120, stroke="#60a5fa", sw=1.5)
    body += line(170, 80, 170, 120, stroke="#60a5fa", sw=1.5)
    body += rect_(140, 120, 60, 25, "#f59e0b")
    body += label(170, 133, "·", 10, "#fcd34d", "middle")
    body += line(200, 80, 200, 120, stroke="#60a5fa", sw=1.5)
    body += line(230, 80, 230, 120, stroke="#60a5fa", sw=1.5)
    body += rect_(200, 120, 60, 25, "#f87171")
    body += label(230, 133, "+", 10, "#fca5a5", "middle")
    # output
    body += line(80, 145, 80, 160, stroke="#60a5fa", sw=1.5)
    body += line(170, 145, 170, 160, stroke="#60a5fa", sw=1.5)
    body += line(80, 160, 170, 160, stroke="#60a5fa", sw=1.5)
    body += arrow(170, 160, 210, 160, stroke="#f59e0b", label="out", label_pos=(215, 155))
    return svg_wrap(260, 200, body, "2022 Q98: Boolean circuit")

def fig_2022_q99():
    """Transistor circuit with Vcc, Ic, Vcb, 100Ω."""
    body = ""
    body += label(40, 25, "Transistor circuit", 10)
    # Vcc top
    body += line(60, 40, 180, 40, stroke="#60a5fa", sw=2)
    body += label(55, 32, "Vcc", 10, "#cbd5e1")
    # resistor 100Ω
    body += line(80, 40, 80, 70, stroke="#60a5fa", sw=1.5)
    body += rect_(75, 70, 10, 20, "#f59e0b")
    body += label(70, 88, "100Ω", 8, "#fcd34d", "middle")
    body += line(80, 90, 80, 120, stroke="#60a5fa", sw=1.5)
    # transistor (circle)
    body += circle(120, 110, 25, stroke="#60a5fa", sw=2)
    body += label(120, 110, "Q", 10, "#cbd5e1", "middle")
    # collector, base, emitter
    body += line(80, 90, 120, 90, stroke="#60a5fa", sw=1.5)
    body += line(145, 110, 180, 110, stroke="#60a5fa", sw=1.5)
    body += label(150, 100, "Ic", 9, "#f87171")
    body += label(150, 122, "Vcb", 9, "#34d399")
    body += line(120, 135, 120, 160, stroke="#60a5fa", sw=1.5)
    body += label(125, 170, "Emitter", 8, "#94a3b8")
    return svg_wrap(240, 200, body, "2022 Q99: Transistor circuit")

def rect_(x, y, w, h, color="#60a5fa"):
    return f'  <rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{color}" stroke-width="1.5"/>\n'

# ---- 2023 figures ----

def fig_2023_q42():
    """x-t and y-t graphs of a particle in 2D."""
    body = ""
    body += label(40, 20, "(x,t) and (y,t) diagrams", 10)
    # x-t graph (top)
    body += label(40, 38, "x-t", 9, "#94a3b8")
    body += line(40, 60, 200, 60, stroke="#475569", sw=1)
    body += line(40, 30, 40, 90, stroke="#475569", sw=1)
    body += polyline("40,70 80,55 120,50 160,45 200,40", stroke="#60a5fa", sw=2)
    # y-t graph (bottom)
    body += label(40, 115, "y-t", 9, "#94a3b8")
    body += line(40, 140, 200, 140, stroke="#475569", sw=1)
    body += line(40, 110, 40, 170, stroke="#475569", sw=1)
    body += polyline("40,150 80,155 120,145 160,135 200,125", stroke="#34d399", sw=2)
    return svg_wrap(240, 200, body, "2023 Q42: x-t and y-t graphs")

def fig_2023_q48():
    """PV diagram with adiabatic CA and isothermal BA processes."""
    body = ""
    body += label(40, 25, "P-V diagram", 10)
    body += line(40, 160, 200, 160, stroke="#475569", sw=1.5)
    body += line(40, 40, 40, 160, stroke="#475569", sw=1.5)
    # isothermal BA: curve from B to A
    body += path("M 60 50 Q 100 70, 180 120", stroke="#34d399", sw=2)
    # adiabatic CA: steeper curve from C to A
    body += path("M 180 150 Q 130 100, 60 50", stroke="#f87171", sw=2)
    body += dot(60, 50, 4, fill="#f87171")
    body += label(45, 42, "A", 10, "#fca5a5")
    body += dot(180, 120, 4, fill="#34d399")
    body += label(185, 115, "B", 10, "#6ee7b7")
    body += dot(180, 150, 4, fill="#f59e0b")
    body += label(185, 165, "C", 10, "#fcd34d")
    body += label(30, 165, "V", 10, "#94a3b8")
    body += label(20, 50, "P", 10, "#94a3b8")
    body += label(120, 180, "BA: isothermal, CA: adiabatic", 8, "#94a3b8", "middle")
    return svg_wrap(240, 220, body, "2023 Q48: PV diagram")

def fig_2023_q60():
    """Wheatstone bridge circuit with galvanometer."""
    body = ""
    body += label(40, 25, "Wheatstone bridge", 10)
    # diamond bridge
    body += line(120, 50, 120, 100, stroke="#60a5fa", sw=2)
    body += line(120, 100, 80, 150, stroke="#60a5fa", sw=2)
    body += line(120, 100, 160, 150, stroke="#60a5fa", sw=2)
    body += line(80, 150, 160, 150, stroke="#60a5fa", sw=2)
    # top cross
    body += line(80, 100, 160, 100, stroke="#60a5fa", sw=2)
    body += line(80, 50, 160, 50, stroke="#60a5fa", sw=2)
    body += line(80, 50, 80, 100, stroke="#60a5fa", sw=1.5)
    body += line(160, 50, 160, 100, stroke="#60a5fa", sw=1.5)
    # resistors
    body += label(70, 75, "R₁", 8, "#94a3b8")
    body += label(150, 75, "R₂", 8, "#94a3b8")
    body += label(65, 130, "R₃", 8, "#94a3b8")
    body += label(175, 130, "R₄", 8, "#94a3b8")
    # galvanometer in middle
    body += circle(120, 100, 10, stroke="#f87171", sw=2)
    body += label(120, 103, "G", 8, "#fca5a5", "middle")
    # battery
    body += line(120, 150, 120, 175, stroke="#60a5fa", sw=1.5)
    body += label(125, 170, "Battery", 8, "#94a3b8")
    return svg_wrap(240, 200, body, "2023 Q60: Wheatstone bridge")

def fig_2023_q61():
    """Power vs load resistance graph with maximum point M."""
    body = ""
    body += label(40, 25, "P vs R graph", 10)
    body += line(40, 160, 200, 160, stroke="#475569", sw=1.5)
    body += line(40, 40, 40, 160, stroke="#475569", sw=1.5)
    # bell curve
    body += path("M 40 150 C 60 150, 80 60, 120 45 C 160 60, 180 150, 200 150", stroke="#60a5fa", sw=2)
    # max point M
    body += dot(120, 45, 5, fill="#f87171")
    body += label(125, 38, "M", 10, "#fca5a5")
    body += label(30, 165, "R", 10, "#94a3b8")
    body += label(20, 55, "P", 10, "#94a3b8")
    return svg_wrap(240, 200, body, "2023 Q61: P vs R graph")

def fig_2023_q66():
    """Spring-mass on frictionless surface with force F."""
    body = ""
    body += label(40, 25, "Spring-mass system", 10)
    # surface
    body += line(30, 130, 210, 130, stroke="#475569", sw=2)
    # spring
    body += line(30, 130, 30, 100, stroke="#60a5fa", sw=2)
    body += polyline("30,100 30,95 35,95 30,90 35,90 30,85 35,85 30,80 35,80 30,75 35,75 30,70", stroke="#60a5fa", sw=1.5)
    body += line(35, 70, 90, 70, stroke="#60a5fa", sw=1.5)
    # mass
    body += rect_(90, 55, 50, 35, "#60a5fa")
    body += label(115, 75, "m", 11, "#cbd5e1", "middle")
    # force
    body += arrow(150, 75, 210, 75, stroke="#f87171", label="F", label_pos=(215, 70))
    body += label(115, 155, "Frictionless surface, spring constant k", 8, "#94a3b8", "middle")
    return svg_wrap(240, 180, body, "2023 Q66: Spring-mass with force")

def fig_2023_q68():
    """RC circuit with capacitor, resistor, and switch."""
    body = ""
    body += label(40, 25, "RC circuit", 10)
    # loop
    body += line(60, 50, 180, 50, stroke="#60a5fa", sw=2)
    body += line(180, 50, 180, 150, stroke="#60a5fa", sw=2)
    body += line(180, 150, 60, 150, stroke="#60a5fa", sw=2)
    body += line(60, 150, 60, 50, stroke="#60a5fa", sw=2)
    # capacitor (left side)
    body += line(60, 80, 60, 90, stroke="#60a5fa", sw=3)
    body += line(60, 110, 60, 120, stroke="#60a5fa", sw=3)
    body += label(45, 100, "C", 10, "#34d399")
    # resistor (top)
    body += rect_(100, 42, 30, 16, "#f59e0b")
    body += label(115, 35, "R", 10, "#fcd34d", "middle")
    # switch (right side)
    body += line(180, 90, 180, 100, stroke="#60a5fa", sw=2)
    body += line(180, 100, 175, 108, stroke="#60a5fa", sw=2)
    body += label(190, 100, "S", 10, "#cbd5e1")
    # EMF source (bottom)
    body += circle(120, 150, 10, stroke="#60a5fa", sw=2)
    body += label(120, 153, "E", 9, "#cbd5e1", "middle")
    return svg_wrap(240, 200, body, "2023 Q68: RC circuit")

def fig_2023_q70():
    """Young's double slit with screen and point P."""
    body = ""
    body += label(40, 25, "Young's double slit", 10)
    # source
    body += dot(30, 100, 4, fill="#60a5fa")
    body += label(25, 90, "S", 9, "#cbd5e1")
    # slits
    body += line(80, 70, 80, 80, stroke="#60a5fa", sw=3)
    body += line(80, 120, 80, 130, stroke="#60a5fa", sw=3)
    body += label(75, 65, "S₁", 8, "#60a5fa")
    body += label(75, 140, "S₂", 8, "#60a5fa")
    # rays to P
    body += line(80, 75, 180, 100, stroke="#60a5fa", sw=1, dash="2,2")
    body += line(80, 125, 180, 100, stroke="#60a5fa", sw=1, dash="2,2")
    # screen
    body += line(180, 50, 180, 150, stroke="#475569", sw=2)
    body += label(185, 55, "Screen", 8, "#94a3b8")
    # point P
    body += dot(180, 100, 5, fill="#f87171")
    body += label(185, 103, "P", 9, "#fca5a5")
    body += label(120, 170, "b = slit separation, d = screen distance", 8, "#94a3b8", "middle")
    return svg_wrap(240, 200, body, "2023 Q70: Young's double slit")

def fig_2023_q91():
    """RLC series circuit with current source."""
    body = ""
    body += label(40, 25, "RLC circuit", 10)
    # loop
    body += line(60, 50, 180, 50, stroke="#60a5fa", sw=2)
    body += line(180, 50, 180, 150, stroke="#60a5fa", sw=2)
    body += line(180, 150, 60, 150, stroke="#60a5fa", sw=2)
    body += line(60, 150, 60, 50, stroke="#60a5fa", sw=2)
    # resistor (top)
    body += rect_(80, 42, 30, 16, "#f59e0b")
    body += label(95, 35, "R", 10, "#fcd34d", "middle")
    # inductor (right)
    body += path("M 180 70 Q 170 80, 180 90 Q 170 100, 180 110 Q 170 120, 180 130", stroke="#34d399", sw=2)
    body += label(190, 100, "L", 10, "#6ee7b7")
    # capacitor (bottom)
    body += line(100, 150, 100, 158, stroke="#60a5fa", sw=3)
    body += line(100, 162, 100, 170, stroke="#60a5fa", sw=3)
    body += label(90, 165, "C", 10, "#34d399")
    # current source (left)
    body += circle(60, 100, 10, stroke="#f87171", sw=2)
    body += label(60, 103, "i(t)", 7, "#fca5a5", "middle")
    return svg_wrap(240, 200, body, "2023 Q91: RLC circuit")

def fig_2023_q94():
    """Multi-source DC circuit for V_AB."""
    body = ""
    body += label(40, 25, "DC circuit", 10)
    # main loop
    body += line(60, 50, 180, 50, stroke="#60a5fa", sw=2)
    body += line(180, 50, 180, 150, stroke="#60a5fa", sw=2)
    body += line(180, 150, 60, 150, stroke="#60a5fa", sw=2)
    body += line(60, 150, 60, 50, stroke="#60a5fa", sw=2)
    # sources and resistors on top
    body += circle(80, 50, 8, stroke="#f87171", sw=2)
    body += label(80, 53, "50V", 7, "#fca5a5", "middle")
    body += rect_(100, 42, 20, 16, "#f59e0b")
    body += label(110, 35, "5Ω", 7, "#fcd34d", "middle")
    body += circle(140, 50, 8, stroke="#34d399", sw=2)
    body += label(140, 53, "40V", 7, "#6ee7b7", "middle")
    body += rect_(155, 42, 20, 16, "#f59e0b")
    body += label(165, 35, "4Ω", 7, "#fcd34d", "middle")
    # bottom resistors
    body += rect_(80, 142, 20, 16, "#f59e0b")
    body += label(90, 165, "30V", 7, "#fcd34d", "middle")
    body += rect_(120, 142, 20, 16, "#f59e0b")
    body += label(130, 165, "3Ω", 7, "#fcd34d", "middle")
    body += label(120, 180, "Find V_AB", 9, "#94a3b8", "middle")
    return svg_wrap(240, 210, body, "2023 Q94: DC circuit")

def fig_2023_q95():
    """Capacitor combination network across X-Y."""
    body = ""
    body += label(40, 25, "Capacitor network", 10)
    # nodes X and Y
    body += dot(50, 80, 5, fill="#f87171")
    body += label(42, 70, "X", 10, "#fca5a5")
    body += dot(50, 160, 5, fill="#34d399")
    body += label(42, 175, "Y", 10, "#6ee7b7")
    # capacitors
    body += line(50, 80, 120, 80, stroke="#60a5fa", sw=1.5)
    body += line(120, 80, 120, 100, stroke="#60a5fa", sw=3)
    body += line(120, 110, 120, 130, stroke="#60a5fa", sw=3)
    body += line(120, 130, 120, 160, stroke="#60a5fa", sw=1.5)
    body += line(50, 160, 120, 160, stroke="#60a5fa", sw=1.5)
    body += label(135, 100, "C₁", 9, "#94a3b8")
    body += label(135, 145, "C₂", 9, "#94a3b8")
    # parallel caps
    body += line(150, 80, 200, 80, stroke="#60a5fa", sw=1.5)
    body += line(150, 160, 200, 160, stroke="#60a5fa", sw=1.5)
    body += line(200, 80, 200, 160, stroke="#60a5fa", sw=3)
    body += label(210, 120, "C₃", 9, "#94a3b8")
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
