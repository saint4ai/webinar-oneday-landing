#!/usr/bin/env python3
"""
Конвертер тяжёлых PNG/JPG → AVIF.
AVIF даёт 70-90% экономии vs PNG/JPG без видимой потери качества.
Поддерживается Chrome 85+, Safari 16+, Firefox 93+ — это >97% браузеров в 2026.

Usage: python3 scripts/convert-to-avif.py
Pillow 11+ поддерживает AVIF из коробки.
"""
from pathlib import Path
from PIL import Image

# (исходник, quality, [resize_to_width])
TARGETS = [
    # Hero — главный фото Александра, должно быть качественным
    ("public/alex-cutout.png", 75, 1200),
    # Bonus карточки — используются и на главной и на /thank-you
    ("public/bonuses/bonus-1.png", 72, 800),
    ("public/bonuses/bonus-2.png", 72, 800),
    ("public/bonuses/bonus-3.png", 72, 800),
    ("public/bonuses/bonus-1-v4.png", 72, 800),
    ("public/bonuses/bonus-3-v4.png", 72, 800),
    # Кейс платформы — большой скриншот
    ("public/case-onai-platform.png", 70, 1600),
    # Testimonials — самые тяжёлые
    ("public/testimonials/renat.png", 70, 1000),
    ("public/testimonials/vladislav-1.jpg", 75, 1000),
    ("public/testimonials/vladislav-2.jpg", 75, 1000),
    ("public/testimonials/merey.jpg", 75, 1000),
]

ROOT = Path(__file__).resolve().parents[1]
total_before = 0
total_after = 0
print(f"{'file':<50} {'before':>10} {'after':>10}  saved")
print("-" * 85)

for rel, quality, max_w in TARGETS:
    src = ROOT / rel
    if not src.exists():
        print(f"  SKIP (not found): {rel}")
        continue

    dst = src.with_suffix(".avif")
    before = src.stat().st_size

    img = Image.open(src)
    if img.mode in ("RGBA", "LA"):
        # AVIF поддерживает alpha — оставляем
        pass
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Ресайз если шире max_w
    if img.width > max_w:
        ratio = max_w / img.width
        new_h = int(img.height * ratio)
        img = img.resize((max_w, new_h), Image.LANCZOS)

    img.save(dst, format="AVIF", quality=quality, speed=4)
    after = dst.stat().st_size
    saved_pct = 100 * (1 - after / before)
    print(f"  {rel:<50} {before/1024:>8.0f}K {after/1024:>8.0f}K  -{saved_pct:.0f}%")
    total_before += before
    total_after += after

print("-" * 85)
print(f"  {'TOTAL':<50} {total_before/1024/1024:>8.2f}M {total_after/1024/1024:>8.2f}M  -{100*(1-total_after/total_before):.0f}%")
