"""WCAG contrast ratio.  Usage: python scripts/contrast.py '#111111' '#f5f5f5'"""
import sys


def lum(h: str) -> float:
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


a, b = sorted([lum(sys.argv[1]), lum(sys.argv[2])], reverse=True)
r = (a + 0.05) / (b + 0.05)
print(f"{r:.2f}:1", "AA ok" if r >= 4.5 else ("AA large/UI only" if r >= 3 else "FAIL"))
