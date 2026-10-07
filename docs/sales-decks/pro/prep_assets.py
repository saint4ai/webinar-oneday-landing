# Подготовка картинок презентации «Vibe Coding PRO»: сжатие в img/ и три фона страниц.
# Запуск: python docs/sales-decks/pro/prep_assets.py
# Фоны снимаются с Chromium как обычные JPEG: в PDF они лежат одной картинкой, без сотен градиентов (мобильные просмотрщики на них белеют).
import os, shutil, sys, urllib.request
import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

rng = np.random.default_rng(7)

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, "img")
LAND = r"C:\Проекты\webinar-oneday-landing\public\montage"
CASES_ERICKSON = r"C:\Проекты\Мой проект\projects\saint_landing\public\assets\cases"
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OBJ = os.path.join(REPO, "docs", "tg-media", "obj")
# Python-playwright ждёт другую сборку Chromium, поэтому берём headless shell 1223, уже стоящий для Node-playwright 1.60
CHROME = r"C:\Users\smmmc\AppData\Local\ms-playwright\chromium_headless_shell-1223\chrome-headless-shell-win64\chrome-headless-shell.exe"
os.makedirs(IMG, exist_ok=True)


def save_png(src, name, width):
    im = Image.open(src).convert("RGBA")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(IMG, name), optimize=True)


def save_jpg(src, name, width, q=84):
    im = Image.open(src).convert("RGB")
    im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(IMG, name), quality=q, optimize=True, progressive=False)


# логотип onAI (как на карточках)
shutil.copyfile(os.path.join(REPO, "docs", "tg-media", "onai-logo-night.svg"), os.path.join(IMG, "onai-logo-night.svg"))

# LEGO-объекты: крупные -x3, где они есть, иначе из эфирной колоды
save_png(os.path.join(OBJ, "lg-i-phones-x3.png"), "obj-phones.png", 800)
save_png(os.path.join(OBJ, "lg-i-box-x3.png"), "obj-box.png", 520)
save_png(os.path.join(OBJ, "lg-i-botchat-x3.png"), "obj-botchat.png", 460)
save_png(os.path.join(LAND, "lego", "lg-i-rocket.webp"), "obj-rocket.png", 202)
save_png(os.path.join(LAND, "lego", "lg-s39-calendar.webp"), "obj-calendar.png", 620)
save_png(os.path.join(LAND, "lego", "lg-s44-codeword.webp"), "obj-codeword.png", 640)

# автор: вырезанное фото
save_png(os.path.join(LAND, "alex-cacao.webp"), "alex.png", 640)

# кейс Erickson: экран AI-куратора (без лиц и без экрана входа) и логотип с живой страницы onai.academy/saint
save_jpg(os.path.join(CASES_ERICKSON, "erickson-curator-large.webp"), "case-erickson.jpg", 820)
LOGO = os.path.join(IMG, "erickson-logo.svg")
if not os.path.exists(LOGO):
    urllib.request.urlretrieve("https://onai.academy/saint/assets/logos/erickson.svg", LOGO)

# остальные кейсы
save_jpg(os.path.join(LAND, "cases", "onai-academy.webp"), "case-academy.jpg", 820)
save_jpg(os.path.join(LAND, "cases", "ai-assistant.webp"), "case-assistant.jpg", 820)
save_jpg(os.path.join(LAND, "cases", "ai-targetolog.webp"), "case-targetolog.jpg", 820)

# фоны страниц: ночь, золотое свечение, коричневый отсвет внизу слева, зерно
BG_HTML = """<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;width:1782px;height:1260px;background:#14100E}
.bg{position:relative;width:1782px;height:1260px;overflow:hidden;
 background:
  radial-gradient(1500px 1100px at var(--gx) var(--gy),rgba(227,192,123,.30),rgba(227,192,123,.08) 55%,transparent 75%),
  radial-gradient(1300px 1000px at var(--bx) 108%,rgba(160,83,42,.30),transparent 70%),
  radial-gradient(1500px 1100px at 0% 0%,#2b221c 0%,transparent 65%),
  linear-gradient(165deg,#211A16 0%,#14100E 72%)}
.grain{position:absolute;inset:0;opacity:.09;mix-blend-mode:overlay;
 background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .9 0'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>")}
</style></head><body><div class="bg" id="b"><div class="grain"></div></div></body></html>"""
VARIANTS = {"bg-a": ("84%", "14%", "4%"), "bg-b": ("14%", "30%", "92%"), "bg-c": ("86%", "86%", "6%")}

with sync_playwright() as p:
    br = p.chromium.launch(executable_path=CHROME)
    pg = br.new_page(viewport={"width": 1782, "height": 1260})
    pg.set_content(BG_HTML)
    for name, (gx, gy, bx) in VARIANTS.items():
        pg.evaluate("([gx,gy,bx])=>{const b=document.getElementById('b');b.style.setProperty('--gx',gx);b.style.setProperty('--gy',gy);b.style.setProperty('--bx',bx)}", [gx, gy, bx])
        pg.screenshot(path=os.path.join(IMG, name + ".png"))
        # зерно запекаем сами: без него тёмный градиент в JPEG ломается на полосы
        arr = np.asarray(Image.open(os.path.join(IMG, name + ".png")).convert("RGB")).astype(np.float32)
        arr += rng.normal(0, 2.4, arr.shape[:2])[..., None]
        Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(os.path.join(IMG, name + ".jpg"), quality=92, optimize=True)
        os.remove(os.path.join(IMG, name + ".png"))
    br.close()

for f in sorted(os.listdir(IMG)):
    print(f, os.path.getsize(os.path.join(IMG, f)) // 1024, "КБ")
