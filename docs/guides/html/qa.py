# Проверка PDF-гайдов: число страниц, пустые страницы, текст, ссылки, shading, вес; превью и контактные листы.
# Запуск: python docs/guides/html/qa.py [имя]   (по умолчанию все три)
import os, sys, re
import pypdf, fitz
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
BONUS = os.path.join(ROOT, "workshop-montazh", "assets", "bonus")
REP = os.path.join(ROOT, "docs", "reports", "guides-1006")
os.makedirs(REP, exist_ok=True)
NAMES = sys.argv[1:] or ["gaid-virusny-rils", "kontent-plan", "30-hukov"]

def count_shading(page):
    n = 0
    res = page.get("/Resources")
    if not res: return 0
    res = res.get_object()
    for k in ("/Shading", "/Pattern"):
        if k in res: n += len(res[k].get_object())
    return n

for name in NAMES:
    path = os.path.join(BONUS, name + ".pdf")
    r = pypdf.PdfReader(path)
    n = len(r.pages)
    size = os.path.getsize(path)
    links = 0; shad = 0; empty = []
    for i, p in enumerate(r.pages):
        t = (p.extract_text() or "").strip()
        if len(t) < 40: empty.append(i + 1)
        shad += count_shading(p)
        for a in (p.get("/Annots") or []):
            a = a.get_object()
            if a.get("/Subtype") == "/Link" and a.get("/A", {}).get("/URI"): links += 1
    w, h = float(r.pages[0].mediabox.width), float(r.pages[0].mediabox.height)
    print(f"{name}: стр. {n}, {size/1024/1024:.2f} МБ, {w:.0f}x{h:.0f} pt, ссылок {links}, shading/pattern {shad}, пустых/почти пустых {empty or 'нет'}")
    # превью: страницы в JPG (для просмотра), контактный лист, ширина 390 px как на телефоне
    doc = fitz.open(path)
    tmp = os.path.join(REP, "_pages", name); os.makedirs(tmp, exist_ok=True)
    thumbs = []
    for i, pg in enumerate(doc):
        pix = pg.get_pixmap(matrix=fitz.Matrix(1.8, 1.8), alpha=False)
        f = os.path.join(tmp, f"p{i+1:02d}.jpg"); pix.save(f, jpg_quality=88)
        thumbs.append(f)
        if i == 0:
            pix.save(os.path.join(REP, f"{name}-p1.jpg"), jpg_quality=90)
    # контактный лист: 3 колонки
    ims = [Image.open(f) for f in thumbs]
    tw = 640; th = int(ims[0].height * tw / ims[0].width)
    cols = 3; rows = (len(ims) + cols - 1) // cols
    pad = 24; cap = 30
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * pad, rows * (th + cap) + (rows + 1) * pad), (24, 18, 14))
    from PIL import ImageDraw, ImageFont
    d = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 20)
    except Exception: font = None
    for i, im in enumerate(ims):
        x = pad + (i % cols) * (tw + pad); y = pad + (i // cols) * (th + cap + pad)
        sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
        d.text((x, y + th + 4), f"{name}  стр. {i+1}", fill=(227, 192, 123), font=font)
    sheet.save(os.path.join(REP, f"contact-{name}.jpg"), quality=86)
    # лента для телефона: каждая страница шириной 390 px
    strip = []
    for pg in doc:
        pix = pg.get_pixmap(matrix=fitz.Matrix(390 / pg.rect.width, 390 / pg.rect.width), alpha=False)
        strip.append(Image.frombytes("RGB", (pix.width, pix.height), pix.samples))
    H = sum(i.height for i in strip) + 6 * (len(strip) - 1)
    ph = Image.new("RGB", (390, H), (24, 18, 14)); y = 0
    for im in strip: ph.paste(im, (0, y)); y += im.height + 6
    ph.save(os.path.join(REP, f"phone390-{name}.jpg"), quality=88)

# общий контактный лист всех страниц всех гайдов
if len(NAMES) == 3:
    import glob
    labels = {"gaid-virusny-rils": "Гайд 1. Как сделать вирусный рилс", "kontent-plan": "Гайд 2. Контент-план на месяц", "30-hukov": "Гайд 3. 30 хуков"}
    from PIL import ImageDraw, ImageFont
    tw, cols, pad = 420, 6, 18
    first = Image.open(os.path.join(REP, "_pages", NAMES[0], "p01.jpg")); th = int(first.height * tw / first.width)
    try: f = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 24)
    except Exception: f = None
    blocks = []; H = pad
    for n in NAMES:
        pages = sorted(glob.glob(os.path.join(REP, "_pages", n, "p*.jpg")))
        r = (len(pages) + cols - 1) // cols
        blocks.append((n, pages, r)); H += 34 + r * (th + pad) + pad
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * pad, H), (24, 18, 14)); d = ImageDraw.Draw(sheet); y = pad
    for n, pages, r in blocks:
        d.text((pad, y), labels[n], fill=(227, 192, 123), font=f); y += 34
        for i, pth in enumerate(pages):
            sheet.paste(Image.open(pth).resize((tw, th), Image.LANCZOS), (pad + (i % cols) * (tw + pad), y + (i // cols) * (th + pad)))
        y += r * (th + pad) + pad
    sheet.save(os.path.join(REP, "contact-all.jpg"), quality=86)
