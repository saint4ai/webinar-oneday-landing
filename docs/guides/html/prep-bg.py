# Непрозрачные фоны с запечённым свечением для ночных страниц гайдов (вместо PNG-свечения с альфой и CSS opacity).
# Причина: PNG с прозрачностью и opacity Chrome кладёт в PDF растровыми кусками с маской (SMask), а часть
# просмотрщиков на телефоне рисует их тёмными прямоугольниками. Здесь свечение смешано с фоном заранее,
# на выходе обычный JPEG без альфа-канала. Запуск: python docs/guides/html/prep-bg.py
import os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "img")
PW, PH = 1122.5, 793.7          # страница в CSS px
K = 1.5                          # плотность пикселей картинки
W, H = int(PW * K), int(PH * K)
NIGHT = np.array([0x14, 0x10, 0x0E], dtype=np.float64)
GOLD = np.array([0xE3, 0xC0, 0x7B], dtype=np.float64)
BROWN = np.array([0xA0, 0x53, 0x2A], dtype=np.float64)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
xx /= K
yy /= K
rng = np.random.default_rng(7)


def glow(base, color, cx, cy, r, alpha):
    """Радиальное свечение: прозрачность падает линейно от alpha в центре до 0 на радиусе r (как был PNG)."""
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    a = np.clip(1 - d / r, 0, 1) * alpha
    return base * (1 - a[..., None]) + color * a[..., None]


def save(base, name):
    # лёгкий шум до округления, чтобы градиент на тёмном не давал полос
    noisy = base + rng.uniform(-0.9, 0.9, base.shape)
    arr = np.clip(np.rint(noisy), 0, 255).astype(np.uint8)
    path = os.path.join(IMG, name)
    Image.fromarray(arr, "RGB").save(path, quality=92, subsampling=0, optimize=True)
    print(name, os.path.getsize(path) // 1024, "KB")


def flat():
    return np.broadcast_to(NIGHT, (H, W, 3)).copy()


# обложка: золотое свечение слева сверху и коричневое слева снизу (как на гайдах 06.10)
cover = flat()
cover = glow(cover, GOLD, 120, 140, 380, 0.42 * 0.55)
cover = glow(cover, BROWN, 180, PH, 380, 0.40 * 0.70)
save(cover, "bg-cover.jpg")

# ночная страница: золотое свечение справа сверху
night = glow(flat(), GOLD, 942, 120, 380, 0.42 * 0.50)
save(night, "bg-night.jpg")
