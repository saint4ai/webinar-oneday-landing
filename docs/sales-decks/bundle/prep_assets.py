# Подготовка картинок презентации «Два курса вместе»: сжатие в img/. Фоны страниц и логотип берутся из pro/img,
# чтобы все три презентации выглядели одинаково. Сначала запустить pro/prep_assets.py.
# Запуск: python docs/sales-decks/bundle/prep_assets.py
import os, shutil
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "img")
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
PRO_IMG = os.path.join(REPO, "docs", "sales-decks", "pro", "img")
OBJ = os.path.join(REPO, "docs", "tg-media", "obj")
LEGO = os.path.join(REPO, "public", "montage", "lego")
os.makedirs(IMG, exist_ok=True)


def save_png(src, name, width):
    im = Image.open(src).convert("RGBA")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(IMG, name), optimize=True)


# логотип и фоны: те же файлы, что у презентации PRO
for f in ("onai-logo-night.svg", "bg-a.jpg", "bg-b.jpg", "bg-c.jpg"):
    shutil.copyfile(os.path.join(PRO_IMG, f), os.path.join(IMG, f))

# LEGO-объекты по одному на страницу
save_png(os.path.join(OBJ, "lg-i-cards-x3.png"), "obj-cards.png", 700)         # обложка
save_png(os.path.join(LEGO, "lg-s38-piggy.webp"), "obj-piggy.png", 520)        # цена пакета
save_png(os.path.join(LEGO, "lg-s41-deadline.webp"), "obj-deadline.png", 480)  # условие предложения
save_png(os.path.join(LEGO, "lg-s44-codeword.webp"), "obj-codeword.png", 640)  # как начать

for f in sorted(os.listdir(IMG)):
    print(f, os.path.getsize(os.path.join(IMG, f)) // 1024, "КБ")
