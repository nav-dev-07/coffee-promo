"""Extract the 19 die-cut stickers from the original coffee sticker sheet.

Usage: python scripts/extract-stickers.py "path/to/coffee stickers.jpg"
Requires Pillow, numpy, and scipy. The source sheet is never modified.
"""

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


# A point on the white die-cut border identifies each original sticker.
STICKERS = [
    ("iced-coffee", "Iced coffee with a straw", (160, 36)),
    ("heart-mug", "Ceramic coffee mug with a little heart", (250, 128)),
    ("coffee-first", "Coffee first takeaway cup", (501, 105)),
    ("coffee-bag", "Brown paper bag of Arabica coffee", (605, 79)),
    ("coffee-books", "A cup of coffee on a stack of books", (121, 303)),
    ("latte-art", "Heart-shaped latte art with a saucer and spoon", (349, 282)),
    ("good-vibes", "Coffee and good vibes lettering", (509, 353)),
    ("coffee-carafe", "Glass coffee carafe", (623, 330)),
    ("olive-branch", "An olive-green leafy branch", (60, 526)),
    ("good-day", "Today is a good day for coffee note", (204, 505)),
    ("moka-pot", "A silver stovetop moka pot", (395, 489)),
    ("but-first-coffee", "But first, coffee glass mug", (520, 540)),
    ("dried-flowers", "A delicate bunch of dried flowers", (674, 540)),
    ("cozy-brew", "Cozy brew handwritten lettering", (297, 712)),
    ("croissant", "A golden buttery croissant", (132, 772)),
    ("coffee-helps", "Life happens, coffee helps sticker", (273, 822)),
    ("espresso-yourself", "Espresso yourself speech bubble", (405, 822)),
    ("one-cup", "Take life one cup at a time note", (489, 754)),
    ("handdrawn-heart", "A hand-drawn coffee-brown heart", (656, 792)),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=Path("public/stickers"))
    parser.add_argument("--preview", type=Path)
    args = parser.parse_args()

    image = Image.open(args.source).convert("RGB")
    pixels = np.asarray(image).astype(np.int16)
    # The sheet is warm beige; the die-cut outlines range from white to ivory.
    white = ((pixels[:, :, 0] >= 244) & (pixels[:, :, 1] >= 238)
             & (pixels[:, :, 2] >= 230) & (np.ptp(pixels, axis=2) <= 18))
    white = ndimage.binary_closing(white, iterations=2)
    labels, _ = ndimage.label(white)
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = []
    used_labels = set()
    previews = []

    for slug, description, (x, y) in STICKERS:
        nearby = labels[max(0, y - 5):y + 6, max(0, x - 5):x + 6]
        candidates, counts = np.unique(nearby[nearby > 0], return_counts=True)
        if not len(candidates):
            raise ValueError(f"No white outline found for {slug} at {(x, y)}")
        label = int(candidates[np.argmax(counts)])
        if label in used_labels:
            raise ValueError(f"Two stickers share outline {label}: {slug}")
        used_labels.add(label)
        mask = ndimage.binary_fill_holes(labels == label)
        if mask.sum() < 500:
            raise ValueError(f"Incomplete outline for {slug}: {mask.sum()} pixels")
        # A soft sub-pixel edge keeps the cutout smooth at its original resolution.
        alpha = np.rint(np.clip(ndimage.gaussian_filter(mask.astype(float), 0.45) * 255, 0, 255)).astype(np.uint8)
        rgba = np.dstack([np.asarray(image), alpha])
        rows, columns = np.nonzero(alpha)
        box = (max(0, columns.min() - 3), max(0, rows.min() - 3),
               min(image.width, columns.max() + 4), min(image.height, rows.max() + 4))
        sticker = Image.fromarray(rgba).crop(box)
        sticker.save(args.output / f"{slug}.png", optimize=True)
        manifest.append({"id": slug, "alt": description, "src": f"/stickers/{slug}.png",
                         "width": sticker.width, "height": sticker.height})
        previews.append((slug, sticker))
        print(f"{slug}: {sticker.width}x{sticker.height}, {mask.sum()} opaque pixels, bounds={box}")

    (args.output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    if args.preview:
        preview = Image.new("RGB", (1000, 1000), "#d4c6b4")
        draw = ImageDraw.Draw(preview)
        for index, (slug, sticker) in enumerate(previews):
            sticker.thumbnail((170, 205), Image.Resampling.LANCZOS)
            left, top = (index % 5) * 200, (index // 5) * 250
            preview.paste(sticker, (left + (200 - sticker.width) // 2, top + 12), sticker)
            draw.text((left + 8, top + 225), slug, fill="#35261e")
        preview.save(args.preview)


if __name__ == "__main__":
    main()
