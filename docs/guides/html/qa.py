# Проверка PDF-лид-магнитов воркшопа: страницы, вес, текст, ссылки, артефакты внутри PDF; превью рисует PyMuPDF (не Chrome).
# Запуск: python docs/guides/html/qa.py [имя ...]   (по умолчанию все четыре)
# Что проверяется:
#  - число страниц, вес до 3 МБ, пустые страницы, shading/pattern (градиенты);
#  - артефакты: ExtGState с прозрачностью (ca/CA < 1), SMask, изображения с альфа-маской (в PDF это и есть «тёмные прямоугольники»
#    вместо мягких теней в части просмотрщиков); смотрятся и вложенные формы;
#  - текст: нет длинного тире, «Аян», «Знакомо?», «Представь»; нет чисел форматов в гайдах; даты эфира не остались;
#  - ссылки: все Instagram-ссылки из таблицы docs/mailings/reels-links-0910.md; у карты есть ссылки на рилс и воркшоп;
#  - карта: каждый промпт из ТЗ извлекается pypdf целиком, без разрывов слов;
#  - превью: docs/reports/lead-magnets-1009/<имя>/pNN.png (ширина 1200) и лист sheet-<имя>.jpg.
# Выход: код 1, если есть ошибки.
import os, re, sys
import pypdf, pymupdf
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
BONUS = os.path.join(ROOT, "workshop-montazh", "assets", "bonus")
REP = os.path.join(ROOT, "docs", "reports", "lead-magnets-1009")
TZ = os.path.join(ROOT, "docs", "tasks", "lead_magnets_1009.md")
LINKS = os.path.join(ROOT, "docs", "mailings", "reels-links-0910.md")
ALL = ["karta-6-referensov", "gaid-virusny-rils", "kontent-plan", "30-hukov"]
NAMES = sys.argv[1:] or ALL
os.makedirs(REP, exist_ok=True)
MAX_BYTES = 3 * 1024 * 1024
OK_DATES = ["19 сентября 2026", "5 октября 2026", "9 октября 2026", "сентябрь 2026"]
errors = []


def err(name, msg):
    errors.append(f"{name}: {msg}")
    print(f"  ОШИБКА: {msg}")


def norm(t):
    return re.sub(r"\s+", " ", t).strip()


def walk_res(res, seen, stat):
    """Считает прозрачность и маски в ресурсах страницы и вложенных форм."""
    if res is None:
        return
    res = res.get_object()
    if id(res) in seen:
        return
    seen.add(id(res))
    for k in ("/Shading", "/Pattern"):
        if k in res:
            stat["shading"] += len(res[k].get_object())
    gs = res.get("/ExtGState")
    if gs:
        for g in gs.get_object().values():
            g = g.get_object()
            for key in ("/ca", "/CA"):
                if key in g and float(g[key]) < 1:
                    stat["alpha"] += 1
            sm = g.get("/SMask")
            if sm is not None and str(sm) != "/None":
                stat["smask"] += 1
    xo = res.get("/XObject")
    if xo:
        for x in xo.get_object().values():
            x = x.get_object()
            st = x.get("/Subtype")
            if st == "/Image":
                if "/SMask" in x:
                    stat["img_smask"] += 1
                if "/Mask" in x:
                    stat["img_smask"] += 1
            elif st == "/Form":
                walk_res(x.get("/Resources"), seen, stat)


def read_links_table():
    """Ссылки на рилсы из таблицы Александра; если файла нет, проверка ссылок пропускается."""
    urls = set()
    if not os.path.exists(LINKS):
        print("ВНИМАНИЕ: нет docs/mailings/reels-links-0910.md, ссылки на рилсы не сверяются с таблицей")
        return None
    for line in open(LINKS, encoding="utf-8"):
        m = re.search(r"https://www\.instagram\.com/(?:p|reel)/[\w-]+/", line)
        if m:
            urls.add(m.group(0))
    return urls


def read_prompts():
    """Промпты: из вёрстки карты (то, что попало в PDF); если есть ТЗ, они обязаны совпасть с ним дословно."""
    import html as H
    src = open(os.path.join(HERE, "karta-6-referensov.html"), encoding="utf-8").read()
    out = [H.unescape(re.sub(r'<[^>]+>', '', m)).strip() for m in re.findall(r'<p class="pt">(.*?)</p>', src, flags=re.S)]
    if os.path.exists(TZ):
        lines = open(TZ, encoding="utf-8").read().splitlines()
        tz = [l[1:-1] for l in lines if l.startswith("«Ты монтажёр") and l.endswith("»")]
        if tz != out:
            err("karta-6-referensov", "промпты в вёрстке не совпадают с ТЗ дословно")
    return out


table_urls = read_links_table()
prompts = read_prompts()

for name in NAMES:
    path = os.path.join(BONUS, name + ".pdf")
    print(f"\n== {name}")
    r = pypdf.PdfReader(path)
    n = len(r.pages)
    size = os.path.getsize(path)
    stat = dict(shading=0, alpha=0, smask=0, img_smask=0)
    uris, empty, texts = [], [], []
    for i, p in enumerate(r.pages):
        t = p.extract_text() or ""
        texts.append(t)
        if len(t.strip()) < 40:
            empty.append(i + 1)
        walk_res(p.get("/Resources"), set(), stat)
        for a in p.get("/Annots") or []:
            a = a.get_object()
            if a.get("/Subtype") == "/Link":
                u = a.get("/A", {}).get("/URI")
                if u:
                    uris.append(str(u))
    w, h = float(r.pages[0].mediabox.width), float(r.pages[0].mediabox.height)
    print(f"стр. {n}, {size/1024/1024:.2f} МБ, {w:.0f}x{h:.0f} pt, ссылок {len(uris)}, "
          f"shading {stat['shading']}, прозрачность (ca/CA) {stat['alpha']}, SMask {stat['smask']}, картинок с маской {stat['img_smask']}, "
          f"пустых {empty or 'нет'}")
    if size > MAX_BYTES:
        err(name, f"вес {size/1024/1024:.2f} МБ больше 3 МБ")
    if empty:
        err(name, f"пустые или почти пустые страницы {empty}")
    if stat["shading"]:
        err(name, f"градиенты shading/pattern: {stat['shading']}")
    if stat["alpha"] or stat["smask"] or stat["img_smask"]:
        err(name, f"прозрачность в PDF (ca/CA {stat['alpha']}, SMask {stat['smask']}, картинок с маской {stat['img_smask']}): возможны тёмные прямоугольники")
    full = "\n".join(texts)
    flat = norm(full)
    # запреты в текстах
    for bad in ["—", "Аян", "Знакомо", "Представь"]:
        if bad in full:
            err(name, f"в тексте найдено «{bad}»")
    if name != "karta-6-referensov":
        m = re.findall(r"(?:\d+|три|шесть|пять|четыре)\s+формат\w*", flat, flags=re.I)
        if m:
            err(name, f"числа форматов в тексте: {m}")
    # даты: конкретные даты эфира не должны остаться, даты статистики допустимы
    dates = re.findall(r"\d{1,2}\s+(?:сентября|октября)(?:\s+\d{4})?|сентябрь\s+\d{4}", flat)
    left = [d for d in dates if not any(d.startswith(o) or o.startswith(d) for o in OK_DATES)]
    print("даты в тексте:", sorted(set(dates)) or "нет")
    if left:
        err(name, f"даты, которых не должно быть: {left}")
    if re.search(r"(?:^|\W)20:00", flat) and name != "karta-6-referensov":
        err(name, "время эфира 20:00 в гайде")
    # ссылки
    for u in sorted(set(uris)):
        print("  ссылка:", u)
        if "instagram.com/p/" in u or "instagram.com/reel/" in u:
            if table_urls is not None and u not in table_urls:
                err(name, f"ссылка на рилс не из таблицы reels-links-0910.md: {u}")
    if name == "karta-6-referensov":
        for need in ["https://www.instagram.com/p/Dc8YwYCt_E_/", "https://onai.academy/workshop-montazh/"]:
            if need not in uris:
                err(name, f"нет ссылки {need}")
        # промпты: каждый извлекается целиком, без разрывов слов
        # pypdf у Chrome-PDF ставит лишние пробелы вокруг знаков препинания (так и в прежних гайдах), поэтому для pypdf
        # сравниваем без пробелов и по целым словам, а строгое совпадение с пробелами проверяем текстом PyMuPDF
        if len(prompts) != 6:
            err(name, f"в вёрстке найдено {len(prompts)} промптов вместо 6")
        mu = norm(" ".join(pg.get_text() for pg in pymupdf.open(path)))
        nospace = lambda t: re.sub(r"\s+", "", t)
        flat_ns = nospace(full)
        words = lambda t: set(re.findall(r"\w+", t))
        have = words(full)
        for i, pr in enumerate(prompts):
            miss = sorted(w for w in words(pr) if w not in have)
            if nospace(pr) not in flat_ns:
                err(name, f"промпт {i+1}: pypdf не извлекает его целиком (без учёта пробелов)")
            elif miss:
                err(name, f"промпт {i+1}: в pypdf разорваны слова: {miss[:6]}")
            elif norm(pr) not in mu:
                err(name, f"промпт {i+1}: PyMuPDF извлекает его с отличиями от исходного текста")
            else:
                print(f"  промпт {i+1}: извлечён целиком, слова не разорваны ({len(pr)} знаков)")
    # превью: каждая страница PNG шириной 1200 (PyMuPDF), лист из всех страниц
    doc = pymupdf.open(path)
    pdir = os.path.join(REP, name)
    os.makedirs(pdir, exist_ok=True)
    for old in os.listdir(pdir):
        if old.endswith(".png"):
            os.remove(os.path.join(pdir, old))
    files = []
    for i, pg in enumerate(doc):
        z = 1200 / pg.rect.width
        pix = pg.get_pixmap(matrix=pymupdf.Matrix(z, z), alpha=False)
        f = os.path.join(pdir, f"p{i+1:02d}.png")
        pix.save(f)
        files.append(f)
    ims = [Image.open(f).convert("RGB") for f in files]
    tw = 640
    th = int(ims[0].height * tw / ims[0].width)
    cols = 3
    rows = (len(ims) + cols - 1) // cols
    pad, cap = 24, 30
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * pad, rows * (th + cap + pad) + pad), (70, 70, 74))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 20)
    except Exception:
        font = None
    for i, im in enumerate(ims):
        x = pad + (i % cols) * (tw + pad)
        y = pad + (i // cols) * (th + cap + pad)
        sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
        d.text((x, y + th + 4), f"{name}  стр. {i+1}", fill=(240, 240, 240), font=font)
    sheet.save(os.path.join(REP, f"sheet-{name}.jpg"), quality=88)
    print(f"превью: {pdir}\\pNN.png ({len(files)} шт.), лист sheet-{name}.jpg")

print()
if errors:
    print(f"ОШИБОК: {len(errors)}")
    for e in errors:
        print(" -", e)
    sys.exit(1)
print("QA: ошибок нет")
