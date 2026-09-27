"""Dominant colors of an image.  Usage: python scripts/palette.py image.png [n=10]"""
import sys
from PIL import Image

img = Image.open(sys.argv[1]).convert("RGB")
img.thumbnail((240, 240))
n = int(sys.argv[2]) if len(sys.argv) > 2 else 10
q = img.quantize(colors=n, method=Image.Quantize.MEDIANCUT)
pal, total = q.getpalette(), img.width * img.height
for count, i in sorted(q.getcolors(), reverse=True):
    r, g, b = pal[i * 3:i * 3 + 3]
    print(f"#{r:02x}{g:02x}{b:02x}  {count / total:6.1%}")
