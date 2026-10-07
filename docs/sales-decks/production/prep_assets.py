# Подготовка картинок презентации «Vibe Production»: сжатие в img/. Фоны страниц и логотип берутся из pro/img,
# чтобы все три презентации (Production, PRO, Два курса) выглядели одинаково. Сначала запустить pro/prep_assets.py.
# Запуск: python docs/sales-decks/production/prep_assets.py
import os, shutil
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "img")
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
PRO_IMG = os.path.join(REPO, "docs", "sales-decks", "pro", "img")
OBJ = os.path.join(REPO, "docs", "tg-media", "obj")
LEGO = os.path.join(REPO, "public", "montage", "lego")
REELS = os.path.join(REPO, "public", "montage", "reels")
BANKS = os.path.join(REPO, "public", "payment", "banks")
os.makedirs(IMG, exist_ok=True)


def save_png(src, name, width):
    im = Image.open(src).convert("RGBA")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(IMG, name), optimize=True)


def save_jpg(src, name, width, q=84):
    im = Image.open(src).convert("RGB")
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(IMG, name), quality=q, optimize=True)


# логотип и фоны: те же файлы, что у презентации PRO
for f in ("onai-logo-night.svg", "bg-a.jpg", "bg-b.jpg", "bg-c.jpg"):
    shutil.copyfile(os.path.join(PRO_IMG, f), os.path.join(IMG, f))

# LEGO-объекты по одному на страницу
save_png(os.path.join(LEGO, "lg-s21-robot.webp"), "obj-robotfilm.png", 760)   # обложка
save_png(os.path.join(LEGO, "lg-s13-editor.webp"), "obj-editor.png", 520)     # монтаж забирает деньги или вечера
save_png(os.path.join(OBJ, "lg-i-robot-x3.png"), "obj-robot.png", 420)        # пайплайн
save_png(os.path.join(OBJ, "lg-i-camera-x3.png"), "obj-camera.png", 460)      # что делаете вы
save_png(os.path.join(LEGO, "lg-s49-factory.webp"), "obj-factory.png", 700)   # контент-завод
save_png(os.path.join(OBJ, "lg-i-hourglass-x3.png"), "obj-hourglass.png", 340)  # как проходит обучение
save_png(os.path.join(LEGO, "lg-s09-coins.webp"), "obj-coins.png", 520)       # подписки
save_png(os.path.join(LEGO, "lg-s39-calendar.webp"), "obj-calendar.png", 620) # рассрочка
save_png(os.path.join(LEGO, "lg-s44-codeword.webp"), "obj-codeword.png", 640) # как начать

# три рилса автора (обложки с телефона)
for n in ("connectors", "gitingest", "artemis"):
    save_jpg(os.path.join(REELS, f"hit-{n}.jpg"), f"reel-{n}.jpg", 360)

# логотипы банков для блока рассрочки
for n in ("kaspi", "homecredit", "halyk"):
    save_png(os.path.join(BANKS, f"{n}.png"), f"bank-{n}.png", 300)

for f in sorted(os.listdir(IMG)):
    print(f, os.path.getsize(os.path.join(IMG, f)) // 1024, "КБ")
