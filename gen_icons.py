#!/usr/bin/env python3
"""
Generates 16 placeholder "wood-plaque" SVG badges, one per tour item.
Each badge shares the same frame (circle, gold ring, five-colour ribbon
inspired by the Buddhist flag described in fiche 1-2) but carries a
unique, simple line-art glyph that hints at the item's subject.

These are stand-ins only: meant to be swapped for the temple's actual
photographs by changing the `image` path in data.js.
"""
import os

OUT_DIR = "images"
os.makedirs(OUT_DIR, exist_ok=True)

WOOD = "#3E2C22"
GOLD = "#B8862E"
PAPER = "#F6F1E7"
INK = "#2A2118"

# Five colours from fiche 1-2 (le drapeau bouddhique) — reused everywhere
# as the site's recurring signature ribbon.
FLAG = ["#1E3A5F", "#E8B93B", "#B33A3A", "#F6F1E7", "#D98A3D"]


def ribbon(cx=120, total_w=130, y=222, band_h=12):
    """A simple five-stripe ribbon sitting just below the medallion."""
    x0 = cx - total_w / 2
    w = total_w / 5
    stripes = []
    for i, color in enumerate(FLAG):
        stripes.append(
            f'<rect x="{x0 + i * w:.2f}" y="{y}" width="{w:.2f}" '
            f'height="{band_h}" fill="{color}" stroke="#FFFFFF" stroke-width="0.4"/>'
        )
    return "".join(stripes)


def badge(glyph_svg, filename, title):
    cx, cy, r = 120, 112, 100
    svg = f'''<svg viewBox="0 0 240 248" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{title}">
  <title>{title}</title>
  <circle cx="{cx}" cy="{cy}" r="{r}" fill="{PAPER}" stroke="{WOOD}" stroke-width="3"/>
  <circle cx="{cx}" cy="{cy}" r="{r - 7}" fill="none" stroke="{GOLD}" stroke-width="1.5" opacity="0.7"/>
  <g transform="translate(120,100)">
    {glyph_svg}
  </g>
  {ribbon(cx, 130, 222, 12)}
</svg>'''
    with open(os.path.join(OUT_DIR, filename), "w", encoding="utf-8") as f:
        f.write(svg)


# --- 16 hand-drawn line-art glyphs, centred roughly at (0,0), ~110x110 ---
GLYPHS = {
    "1-1-maitreya.svg": (
        '''<path d="M-30,40 Q-32,5 0,-10 Q32,5 30,40 Z" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="0" cy="-32" r="14" fill="none" stroke="%s" stroke-width="4"/>
        <path d="M-6,-30 Q0,-25 6,-30" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round"/>
        <path d="M-14,40 Q-16,52 -4,52" fill="none" stroke="%s" stroke-width="4" stroke-linecap="round"/>''' % (WOOD, WOOD, WOOD, GOLD),
        "Statue du Bouddha Maitreya",
    ),
    "1-2-drapeau.svg": (
        '''<line x1="-2" y1="-46" x2="-2" y2="46" stroke="%s" stroke-width="4" stroke-linecap="round"/>
        <rect x="-2" y="-44" width="9" height="62" fill="%s"/>
        <rect x="7" y="-44" width="9" height="62" fill="%s"/>
        <rect x="16" y="-44" width="9" height="62" fill="%s"/>
        <rect x="25" y="-44" width="9" height="62" fill="%s"/>
        <rect x="34" y="-44" width="9" height="62" fill="%s"/>''' % (WOOD, FLAG[0], FLAG[1], FLAG[2], FLAG[4], FLAG[3]),
        "Le drapeau bouddhique",
    ),
    "1-3-bodhidharma.svg": (
        '''<line x1="-10" y1="-50" x2="20" y2="40" stroke="%s" stroke-width="4" stroke-linecap="round"/>
        <path d="M14,-40 Q26,-44 30,-34" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="32" cy="-26" rx="7" ry="10" fill="%s" transform="rotate(25 32 -26)"/>
        <circle cx="-22" cy="-18" r="11" fill="none" stroke="%s" stroke-width="4"/>
        <path d="M-34,4 Q-30,32 -10,40 Q10,30 6,8 Q-12,-2 -34,4 Z" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="round"/>''' % (WOOD, WOOD, FLAG[2], WOOD, WOOD),
        "Statue en bronze de Bodhidharma",
    ),
    "1-4-blia.svg": (
        '''<circle cx="0" cy="6" r="40" fill="none" stroke="%s" stroke-width="4"/>
        <path d="M0,-18 C10,-6 10,8 0,18 C-10,8 -10,-6 0,-18 Z" fill="none" stroke="%s" stroke-width="3.5"/>
        <path d="M-24,4 C-12,-2 -2,4 0,18" fill="none" stroke="%s" stroke-width="3"/>
        <path d="M24,4 C12,-2 2,4 0,18" fill="none" stroke="%s" stroke-width="3"/>''' % (WOOD, GOLD, GOLD, GOLD),
        "Emblème de la BLIA",
    ),
    "2-1-avalokiteshvara.svg": (
        '''<path d="M-16,-34 Q0,-44 16,-34 L20,18 Q0,30 -20,18 Z" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="round"/>
        <ellipse cx="0" cy="-2" rx="8" ry="14" fill="none" stroke="%s" stroke-width="3"/>
        <path d="M-6,32 q6,10 12,0" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round"/>
        <path d="M-2,-44 q2,-10 8,-10" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round"/>''' % (WOOD, GOLD, WOOD, GOLD),
        "Bodhisattva Avalokiteshvara",
    ),
    "2-2-sentier-octuple.svg": (
        '''<circle cx="0" cy="0" r="10" fill="none" stroke="%s" stroke-width="4"/>''' % WOOD
        + "".join(
            f'<line x1="0" y1="0" x2="{40 * __import__("math").cos(__import__("math").radians(a)):.1f}" '
            f'y2="{40 * __import__("math").sin(__import__("math").radians(a)):.1f}" '
            f'stroke="{GOLD}" stroke-width="4" stroke-linecap="round"/>'
            for a in range(0, 360, 45)
        ),
        "Le noble sentier octuple",
    ),
    "3-1-shakyamuni.svg": (
        '''<circle cx="0" cy="-6" r="34" fill="none" stroke="%s" stroke-width="3" opacity="0.65"/>'''
        % GOLD
        + "".join(
            f'<line x1="{40 * __import__("math").cos(__import__("math").radians(a)):.1f}" '
            f'y1="{-6 + 40 * __import__("math").sin(__import__("math").radians(a)):.1f}" '
            f'x2="{50 * __import__("math").cos(__import__("math").radians(a)):.1f}" '
            f'y2="{-6 + 50 * __import__("math").sin(__import__("math").radians(a)):.1f}" '
            f'stroke="{GOLD}" stroke-width="3" stroke-linecap="round"/>'
            for a in range(0, 360, 30)
        )
        + f'<path d="M-22,18 Q-24,-2 0,-12 Q24,-2 22,18 Z" fill="none" stroke="{WOOD}" stroke-width="4" stroke-linejoin="round"/>',
        "Bouddha Shakyamuni",
    ),
    "3-2-hsing-yun.svg": (
        '''<circle cx="-2" cy="-34" r="11" fill="none" stroke="%s" stroke-width="4"/>
        <path d="M-22,8 Q-24,36 -6,42 Q14,36 12,10 Q-6,0 -22,8 Z" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="round"/>
        <line x1="18" y1="-10" x2="32" y2="36" stroke="%s" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M-14,16 q-2,10 4,16" fill="none" stroke="%s" stroke-width="2.5" stroke-linecap="round"/>''' % (WOOD, WOOD, WOOD, GOLD),
        "Vénérable Maître Hsing Yun",
    ),
    "3-3-gong-bol.svg": (
        '''<path d="M-30,0 Q-30,30 0,32 Q30,30 30,0 Z" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="round"/>
        <ellipse cx="0" cy="0" rx="30" ry="8" fill="none" stroke="%s" stroke-width="3.5"/>
        <line x1="34" y1="14" x2="48" y2="2" stroke="%s" stroke-width="4" stroke-linecap="round"/>
        <circle cx="50" cy="0" r="4" fill="%s"/>''' % (WOOD, GOLD, WOOD, GOLD),
        "Le Gong Bol",
    ),
    "3-4-poisson-bois.svg": (
        '''<path d="M-30,2 C-30,-22 -2,-30 18,-14 C30,-4 30,10 16,18 C0,26 -22,20 -30,2 Z" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="-16" cy="-6" r="3" fill="%s"/>
        <path d="M16,18 q12,4 16,16" fill="none" stroke="%s" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M-8,-16 q8,-2 12,4" fill="none" stroke="%s" stroke-width="2.5" stroke-linecap="round"/>''' % (WOOD, WOOD, WOOD, GOLD),
        "Le poisson en bois",
    ),
    "3-5-tambour-cloche.svg": (
        '''<rect x="-30" y="-18" width="60" height="36" rx="6" fill="none" stroke="%s" stroke-width="4"/>
        <line x1="-30" y1="-8" x2="30" y2="-8" stroke="%s" stroke-width="2"/>
        <line x1="-30" y1="10" x2="30" y2="10" stroke="%s" stroke-width="2"/>
        <path d="M16,-30 Q24,-40 32,-30 L32,-20 Q24,-26 16,-20 Z" fill="%s" stroke="%s" stroke-width="2"/>''' % (WOOD, GOLD, GOLD, WOOD, WOOD),
        "Le tambour et la cloche",
    ),
    "3-6-cloche-main.svg": (
        '''<path d="M-22,-4 Q-22,-26 0,-26 Q22,-26 22,-4 Z" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="round"/>
        <line x1="-22" y1="-4" x2="22" y2="-4" stroke="%s" stroke-width="4"/>
        <rect x="-5" y="-4" width="10" height="38" rx="4" fill="none" stroke="%s" stroke-width="4"/>
        <path d="M-30,-30 q4,-8 0,-16" fill="none" stroke="%s" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
        <path d="M30,-30 q-4,-8 0,-16" fill="none" stroke="%s" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>''' % (WOOD, WOOD, WOOD, GOLD, GOLD),
        "La cloche à main",
    ),
    "3-7-haiqing.svg": (
        '''<path d="M0,-40 L0,-10" stroke="%s" stroke-width="4"/>
        <path d="M0,-10 Q-44,-2 -42,30 Q-22,18 -10,30 Q0,16 10,30 Q22,18 42,30 Q44,-2 0,-10 Z" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="0" cy="-46" r="8" fill="none" stroke="%s" stroke-width="3.5"/>''' % (WOOD, WOOD, GOLD),
        "Le Haiqing et le Man Yi",
    ),
    "3-8-sangharama.svg": (
        '''<line x1="-4" y1="-44" x2="-4" y2="40" stroke="%s" stroke-width="4" stroke-linecap="round"/>
        <path d="M-4,-44 Q14,-50 26,-38 Q22,-22 0,-26 Z" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="-22" cy="-26" r="11" fill="none" stroke="%s" stroke-width="4"/>
        <path d="M-32,2 Q-30,28 -10,34" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round"/>''' % (WOOD, WOOD, WOOD, GOLD),
        "Bodhisattva Sangharama",
    ),
    "3-9-skanda.svg": (
        '''<circle cx="0" cy="-32" r="11" fill="none" stroke="%s" stroke-width="4"/>
        <path d="M-12,-44 q12,-10 24,0" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round"/>
        <path d="M-20,-6 Q-22,20 -8,36 Q10,28 8,4 Q-4,-6 -20,-6 Z" fill="none" stroke="%s" stroke-width="4" stroke-linejoin="round"/>
        <rect x="-4" y="-2" width="8" height="34" rx="3" fill="none" stroke="%s" stroke-width="3.5" transform="rotate(18 0 14)"/>
        <rect x="-9" y="-2" width="18" height="6" rx="3" fill="%s" transform="rotate(18 0 14)"/>''' % (WOOD, WOOD, WOOD, GOLD, GOLD),
        "Bodhisattva Skanda",
    ),
    "4-1-ksitigarbha.svg": (
        '''<line x1="-18" y1="-44" x2="-2" y2="40" stroke="%s" stroke-width="4" stroke-linecap="round"/>
        <circle cx="-19" cy="-44" r="5" fill="none" stroke="%s" stroke-width="2.5"/>
        <circle cx="-15" cy="-40" r="5" fill="none" stroke="%s" stroke-width="2.5"/>
        <circle cx="20" cy="6" r="8" fill="none" stroke="%s" stroke-width="3.5"/>
        <path d="M20,-2 v-4 M20,14 v4 M12,6 h-4 M28,6 h4" stroke="%s" stroke-width="2" stroke-linecap="round"/>''' % (WOOD, GOLD, GOLD, WOOD, GOLD),
        "Bodhisattva Ksitigarbha",
    ),
}

for filename, (glyph, title) in GLYPHS.items():
    badge(glyph, filename, title)

print(f"Wrote {len(GLYPHS)} icon files to {OUT_DIR}/")
