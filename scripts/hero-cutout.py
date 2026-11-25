# Remove the flat pure-white studio background from a product shot.
# Flood-fills only (almost) pure-white pixels connected to the border, so
# white leather -- which always carries a little shading -- survives.
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

src, dst, thr = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 253
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.int16)
whiteness = a.min(axis=2)
mask = Image.fromarray(((whiteness >= thr) * 255).astype(np.uint8)).copy()
h, w = whiteness.shape
for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
    if mask.getpixel((x, y)) == 255:
        ImageDraw.floodfill(mask, (x, y), 128)
bg = np.asarray(mask) == 128

# Second pass: a looser threshold, but only within a few px of the background
# found above, so compression fringe goes without leaking into white leather.
band = np.asarray(Image.fromarray((bg * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5))) > 0
bg = bg | (band & (whiteness >= 242))

# Floor pass: studio shots carry a pale reflection under the sole. Remove
# light, colourless pixels in the lower part of the shot that connect to the
# background; the darker or tinted outsole stops it reaching the shoe itself.
rows = np.where((~bg).any(axis=1))[0]
if rows.size:
    top, bottom = rows[0], rows[-1]
    floor_zone = np.zeros_like(bg)
    floor_zone[int(bottom - (bottom - top) * 0.3):, :] = True
    chroma = a.max(axis=2) - a.min(axis=2)
    candidate = bg | (floor_zone & (whiteness >= 205) & (chroma < 18))
    labels, _ = ndimage.label(candidate)
    bg = np.isin(labels, np.unique(labels[bg])) & candidate

# Open the mask to snap off thin floor-shadow slivers, then keep only the
# largest piece (the shoe) so stray specks around it disappear.
fg = ndimage.binary_opening(~bg, structure=np.ones((7, 7)))
labels, n = ndimage.label(fg)
if n > 1:
    sizes = ndimage.sum(fg, labels, range(1, n + 1))
    fg = labels == (int(np.argmax(sizes)) + 1)
alpha = Image.fromarray(np.where(fg, 255, 0).astype(np.uint8))
# Close pinholes in the shoe, shave the 1px antialias halo, soften the edge.
alpha = alpha.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))       # close pinholes
# Smooth the outline: blur then re-threshold rounds off jagged steps where
# white leather met the white backdrop.
alpha = alpha.filter(ImageFilter.GaussianBlur(3)).point(lambda v: 255 if v >= 150 else 0)
alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.9))

# Pull leftover white out of semi-transparent edge pixels so no halo shows
# against a tinted backdrop.
rgb = a.astype(np.float32)
al = np.asarray(alpha).astype(np.float32)[..., None] / 255.0
edge = (al > 0) & (al < 1)
darkened = np.clip((rgb - 255 * (1 - al)) / np.maximum(al, 0.05), 0, 255)
rgb = np.where(edge, darkened, rgb)
im = Image.fromarray(rgb.astype(np.uint8))
out = im.convert("RGBA")
out.putalpha(alpha)
bbox = Image.fromarray(((np.asarray(alpha) > 8) * 255).astype(np.uint8)).getbbox()
out = out.crop(bbox)
out.thumbnail((1200, 1200), Image.LANCZOS)
out.save(dst, "WEBP", quality=88, method=6)
print(dst, out.size)
