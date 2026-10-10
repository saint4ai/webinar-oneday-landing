# Проверка PDF-раздаток к урокам: число страниц, пустые страницы, текст, ссылки, shading, длинные тире,
# сверка с исходным текстом docs/guides/lesson-handouts.md, превью JPG каждой страницы и лист-превью.
# Запуск: python docs/guides/html/qa-lessons.py   (после node docs/guides/html/build-lessons.mjs)
# Браузер не запускает: только pypdf и PyMuPDF.
import os, re, sys, json
import pypdf
try:
    import pymupdf as fitz
except ImportError:
    import fitz
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(ROOT, "docs", "guides", "out", "lessons")
PREV = os.path.join(OUT, "preview")
PHONE = os.path.join(OUT, "phone")
SRC = os.path.join(ROOT, "docs", "guides", "lesson-handouts.md")
MANIFEST = os.path.join(HERE, "lessons", "manifest.json")
os.makedirs(PREV, exist_ok=True)

manifest = json.load(open(MANIFEST, encoding="utf-8"))
FULL = "Vibe-Production-razdatki.pdf"
EM = "\u2014"
problems = []


def shading(page):
    n = 0
    res = page.get("/Resources")
    if not res:
        return 0
    res = res.get_object()
    for k in ("/Shading", "/Pattern"):
        if k in res:
            n += len(res[k].get_object())
    return n


def page_stats(path):
    r = pypdf.PdfReader(path)
    links = []
    empty = []
    shad = 0
    texts = []
    for i, p in enumerate(r.pages):
        t = (p.extract_text() or "").strip()
        texts.append(t)
        if len(t) < 40:
            empty.append(i + 1)
        shad += shading(p)
        for a in (p.get("/Annots") or []):
            a = a.get_object()
            if a.get("/Subtype") == "/Link" and a.get("/A", {}).get("/URI"):
                links.append(str(a["/A"]["/URI"]))
    return r, texts, links, empty, shad


# 1. файлы: страницы, размер, пустые, ссылки, shading, тире
files = [(FULL, sum(s["pages"] for s in manifest["sections"]))] + [(s["file"] + ".pdf", s["pages"]) for s in manifest["sections"]]
all_text = ""
for name, want in files:
    path = os.path.join(OUT, name)
    if not os.path.exists(path):
        problems.append(f"нет файла {name}")
        continue
    r, texts, links, empty, shad = page_stats(path)
    n = len(r.pages)
    mb = os.path.getsize(path) / 1024 / 1024
    w, h = float(r.pages[0].mediabox.width), float(r.pages[0].mediabox.height)
    joined = "\n".join(texts)
    em = joined.count(EM)
    bad = [k for k in ("mock", "Mock", "Текст на проверку", "lorem", "Lorem") if k in joined]
    flag = []
    if n != want: flag.append(f"страниц {n}, ожидалось {want}")
    if empty: flag.append(f"пустые {empty}")
    if em: flag.append(f"длинных тире {em}")
    if bad: flag.append(f"служебное {bad}")
    if shad: flag.append(f"shading {shad}")
    if abs(w - 841.89) > 1.5 or abs(h - 595.28) > 1.5: flag.append(f"размер {w:.0f}x{h:.0f}")
    print(f"{name}: стр. {n}, {mb:.2f} МБ, {w:.0f}x{h:.0f} pt, ссылок {len(links)}, пустых {empty or 'нет'}, тире {em}" + (("  <-- " + "; ".join(flag)) if flag else ""))
    if flag: problems.append(f"{name}: " + "; ".join(flag))
    if name == FULL:
        all_text = joined
        full_links = links

# 2. кликабельные ссылки общего файла
want_urls = ["https://onai.academy/", "https://www.instagram.com/saint4ai/", "https://claude.com/download", "https://zernio.com",
             "https://platform.openai.com", "https://t.me/BotFather", "https://hoster.kz", "https://timeweb.cloud", "https://beget.com",
             "https://github.com/saint4ai/reels-montage-remotion-course", "https://www.instagram.com/p/Dc8YwYCt_E_/"]
for u in want_urls:
    if not any(l.rstrip("/") == u.rstrip("/") for l in full_links):
        problems.append(f"в общем PDF нет ссылки {u}")
print("ссылки в общем PDF:", len(full_links), "уникальных", len(set(full_links)))
REPO = "https://github.com/saint4ai/reels-montage-remotion-course"
t11 = chr(10).join(page_stats(os.path.join(OUT, "1-1-rabochee-mesto.pdf"))[1])
if not any(REPO == ln.strip() for ln in t11.splitlines()):
    problems.append("урок 1.1: ссылка на репозиторий не стоит отдельной строкой целиком")
else:
    print("урок 1.1: ссылка на репозиторий отдельной строкой целиком")

# 3. сверка с исходным текстом: каждый смысловой фрагмент должен быть в PDF
def norm(s):
    s = s.lower().replace("ё", "е")
    s = re.sub(r"[\s«»\"“”„‘’'`*_<>→=+·•]", "", s)
    return s

pdf_norm = norm(all_text)
src = open(SRC, encoding="utf-8").read()
src = src.split("\n---\n", 1)[1]  # без служебной шапки документа
units = []
for line in src.splitlines():
    line = line.strip()
    if not line or line.startswith("#") or line.startswith("|---") or line == "---":
        continue
    if line.startswith("|"):
        cells = [c.strip() for c in line.strip("|").split("|")]
        units += cells
        continue
    line = re.sub(r"^(\d+\.|-)\s+", "", line)
    # разбить по «**метка:** текст» и по «→» в ошибках
    line = re.sub(r"\*\*([^*]+)\*\*", r"\1", line)
    line = re.sub(r"\*\(([^)]*)\)\*", "", line)
    parts = re.split(r"\s+→\s+", line)
    units += parts
skip = re.compile(r"^(Чат|Чаты|Схема|Графика|Метка|Подпись|Заголовок|Подзаголовок|Результат|Прогресс|Источники|Что раздаётся|Уроки 2\.1|Порядок блоков|Шапка:|Что делаете вы:|Что делает агент:|Главное правило урока:|Частые ошибки:|Готово, если…:|Фраза для агента:|По одной фразе|Подвал на всех)", re.I)
hint = re.compile(r"\((карточ|плашк|дорожк|таблиц|инфограф|картинк|\d+ (блок|карточ|значк|вопрос|шаг)|круг|лента|5 блоков|3 блока)", re.I)
miss = []
for u in units:
    u = u.strip()
    if len(u) < 14 or skip.match(u):
        continue
    if hint.search(u):
        continue
    # служебные пояснения в скобках в конце не проверяем
    u2 = re.sub(r"\((карточками|картинкой|дорожка|таблица|инфографика|плашками|3 карточки|4 карточки|5 блоков|3 блока|3 значка|круг|лента|3 карточки)[^)]*\)", "", u).strip()
    # метка до двоеточия может быть оформлена отдельно: проверяем и всю строку, и часть после двоеточия
    cand = [u2]
    if ":" in u2:
        cand.append(u2.split(":", 1)[1])
    cand = [c.rstrip(".") for c in cand]
    if not any(len(norm(c)) >= 10 and norm(c) in pdf_norm for c in cand):
        miss.append(u)
print(f"сверка с источником: фрагментов {len(units)}, не найдено в PDF {len(miss)}")
for m in miss:
    print("   не найдено:", m[:130])

# 4. длинные тире в исходниках генератора и HTML
for fn in [os.path.join(HERE, "gen-lessons.mjs"), os.path.join(HERE, "lessons", "lessons.css")] + [os.path.join(HERE, "lessons", f) for f in os.listdir(os.path.join(HERE, "lessons")) if f.endswith(".html")]:
    t = open(fn, encoding="utf-8").read()
    if EM in t:
        problems.append(f"длинное тире в {os.path.basename(fn)}: {t.count(EM)}")

# 4b. шрифты и размер текста по общему PDF (px = pt / 0.75)
doc0 = fitz.open(os.path.join(OUT, FULL))
fallback = {}
tiny = {}
under15 = 0
for pi, pg in enumerate(doc0):
    for blk in pg.get_text("dict")["blocks"]:
        for ln in blk.get("lines", []):
            for sp in ln["spans"]:
                if not sp["text"].strip():
                    continue
                if sp["font"] and not re.search(r"Manrope|Unbounded|Type3", sp["font"], re.I):
                    fallback.setdefault(sp["font"], set()).add(sp["text"].strip())
                px = sp["size"] / 0.75
                if px < 11.9:
                    tiny.setdefault(pi + 1, []).append((round(px, 1), sp["text"][:30]))
                elif px < 14.9:
                    under15 += 1
# Manrope и Unbounded вставляются как Type3 (вариативные шрифты); стрелка «→» есть в Manrope не во всех подмножествах: Chromium берёт её из системного шрифта, это допустимо
odd = {k: v for k, v in fallback.items() if v - {"→"}}
print("запасной шрифт (только стрелка →):", {k: sorted(v) for k, v in fallback.items()} or "нет")
print("текст меньше 12 px:", tiny or "нет", "| фрагментов 12-14.9 px (подписи):", under15)
if odd: problems.append(f"посторонние шрифты {odd}")
if tiny: problems.append(f"текст меньше 12 px на страницах {sorted(tiny)}")

# 5. превью: JPG каждой страницы общего файла и лист
doc = fitz.open(os.path.join(OUT, FULL))
paths = []
for i, pg in enumerate(doc):
    pix = pg.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), alpha=False)
    f = os.path.join(PREV, f"p{i + 1:02d}.jpg")
    pix.save(f, jpg_quality=88)
    paths.append(f)
ims = [Image.open(p) for p in paths]
tw = 520
th = int(ims[0].height * tw / ims[0].width)
cols = 5
rows = (len(ims) + cols - 1) // cols
pad, cap = 16, 26
sheet = Image.new("RGB", (cols * tw + (cols + 1) * pad, rows * (th + cap) + (rows + 1) * pad), (24, 18, 14))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
except Exception:
    font = None
labels = []
for s in manifest["sections"]:
    labels += [s["file"]] * s["pages"]
for i, im in enumerate(ims):
    x = pad + (i % cols) * (tw + pad)
    y = pad + (i // cols) * (th + cap + pad)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y))
    d.text((x, y + th + 4), f"стр. {i + 1}  {labels[i]}", fill=(227, 192, 123), font=font)
sheet.save(os.path.join(OUT, "preview-sheet.jpg"), quality=85)
print(f"превью: {len(paths)} страниц в {PREV}, лист {os.path.join(OUT, 'preview-sheet.jpg')}")

# 6. альбомы для Telegram: страницы по разделам, ширина 1600 px (docs/guides/out/lessons/phone/<раздел>/01.jpg…)
import shutil
if os.path.isdir(PHONE):
    shutil.rmtree(PHONE)
n_ph = 0
for s_ in manifest["sections"]:
    d_ = os.path.join(PHONE, s_["file"])
    os.makedirs(d_, exist_ok=True)
    for k in range(s_["pages"]):
        im = ims[s_["start"] + k]
        h = round(im.height * 1600 / im.width)
        im.resize((1600, h), Image.LANCZOS).save(os.path.join(d_, f"{k + 1:02d}.jpg"), quality=88)
        n_ph += 1
print(f"альбомы для телефона: {n_ph} картинок в {len(manifest['sections'])} папках, {PHONE}")

print("ПРОБЛЕМ: %d" % len(problems))
for p in problems:
    print("  -", p)
sys.exit(1 if problems else 0)
