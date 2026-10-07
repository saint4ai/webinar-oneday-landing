# Сборка PDF «Vibe Production» из index.html по регламенту methods/pdf_from_html.md (Playwright + Chromium, A4 альбомный).
# Запуск: python docs/sales-decks/pro/build_pdf.py [--no-pdf] [--shots <папка>]
#   1. проверяет вёрстку: шрифты, размеры текста (14 pt текст, 28 pt заголовок), вылет за страницу, наезд объектов на текст;
#   2. печатает PDF, выбрасывает пустые страницы, сверяет число страниц;
#   3. по желанию снимает PNG каждой страницы (--shots) для просмотра глазами.
# Перед запуском взять общий замок тяжёлых процессов (C:\Проекты\_общее\heavy.ps1), после окончания снять.
import os, sys
import pypdf
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
HTML = os.path.join(HERE, "index.html")
RAW = os.path.join(HERE, "_raw.pdf")
NAME = "Vibe Production"
OUT = os.path.abspath(os.path.join(HERE, "..", "pdf", NAME + ".pdf"))
EXPECTED_PAGES = 14
# Python-playwright ждёт другую сборку Chromium, поэтому берём headless shell 1223, уже стоящий для Node-playwright 1.60
CHROME = r"C:\Users\smmmc\AppData\Local\ms-playwright\chromium_headless_shell-1223\chrome-headless-shell-win64\chrome-headless-shell.exe"
os.makedirs(os.path.dirname(OUT), exist_ok=True)

NO_PDF = "--no-pdf" in sys.argv
SHOTS = os.path.abspath(sys.argv[sys.argv.index("--shots") + 1]) if "--shots" in sys.argv else None

# проверка вёрстки в браузере: возвращает список замечаний
CHECK_JS = """() => {
  const MIN_TEXT = 18.6, MIN_H1 = 37.3;          // 14 pt и 28 pt в пикселях
  const out = {fonts: [], pages: 0, problems: []};
  for (const f of ["Unbounded", "Manrope"]) out.fonts.push(f + ": " + document.fonts.check("700 20px " + f));
  const secs = [...document.querySelectorAll("section.page")];
  out.pages = secs.length;
  secs.forEach((s, idx) => {
    const n = idx + 1, sr = s.getBoundingClientRect();
    const prob = (m) => out.problems.push("стр. " + n + ": " + m);
    const walker = document.createTreeWalker(s, NodeFilter.SHOW_TEXT);
    const textRects = [];
    let node;
    while ((node = walker.nextNode())) {
      const t = node.textContent.trim();
      if (!t) continue;
      const el = node.parentElement, fs = parseFloat(getComputedStyle(el).fontSize);
      if (el.closest("h1")) { if (fs < MIN_H1) prob("заголовок " + fs.toFixed(1) + "px < 28pt: " + t.slice(0, 30)); }
      else if (fs < MIN_TEXT) prob("текст " + fs.toFixed(1) + "px < 14pt: " + t.slice(0, 30));
      const r = document.createRange(); r.selectNodeContents(node);
      for (const rc of r.getClientRects()) {
        if (rc.width < 1) continue;
        textRects.push({x: rc.left - sr.left, y: rc.top - sr.top, w: rc.width, h: rc.height, t: t.slice(0, 24)});
        if (rc.right > sr.right - 55) prob("текст у правого края: " + t.slice(0, 30));
        if (rc.bottom > sr.bottom - 70 && !el.closest(".foot")) prob("текст ниже безопасной зоны: " + t.slice(0, 30));
      }
    }
    // блок со своими границами не должен прятать текст
    s.querySelectorAll("*").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.overflow !== "visible" && !el.matches(".page, .portrait") && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1))
        prob("содержимое обрезано в блоке ." + el.className);
    });
    // LEGO-объекты не должны залезать на текст и выходить за страницу
    s.querySelectorAll("img.obj").forEach((im) => {
      const r = im.getBoundingClientRect();
      const o = {x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height};
      for (const t of textRects) {
        const ix = Math.min(o.x + o.w, t.x + t.w) - Math.max(o.x, t.x);
        const iy = Math.min(o.y + o.h, t.y + t.h) - Math.max(o.y, t.y);
        if (ix > 4 && iy > 4) prob("объект перекрывает текст «" + t.t + "»");
      }
      if (r.right > sr.right + 1 || r.bottom > sr.bottom + 1 || r.left < sr.left - 1 || r.top < sr.top - 1) prob("объект вылез за страницу");
    });
    s.querySelectorAll("img").forEach((im) => { if (!im.naturalWidth) prob("картинка не загрузилась: " + im.getAttribute("src")); });
    // страница не должна быть выше листа: контент уехал бы на следующий лист
    if (Math.round(sr.height) !== Math.round(210 * 96 / 25.4)) prob("высота страницы " + Math.round(sr.height) + "px");
  });
  return out;
}"""

with sync_playwright() as p:
    br = p.chromium.launch(executable_path=CHROME)
    pg = br.new_page(viewport={"width": 1123, "height": 794})
    pg.goto("file:///" + HTML.replace("\\", "/"), wait_until="networkidle")
    pg.evaluate("document.fonts.ready")
    pg.wait_for_timeout(2000)  # буфер для дозагрузки шрифтов
    rep = pg.evaluate(CHECK_JS)
    print("Шрифты:", ", ".join(rep["fonts"]), "| страниц в HTML:", rep["pages"])
    print("ПРОБЛЕМЫ:\n" + "\n".join(rep["problems"]) if rep["problems"] else "Проверка вёрстки: замечаний нет")
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        for i, sec in enumerate(pg.query_selector_all("section.page")):
            sec.screenshot(path=os.path.join(SHOTS, "p%02d.png" % (i + 1)))
        print("PNG страниц:", SHOTS)
    if not NO_PDF:
        pg.pdf(path=RAW, width="297mm", height="210mm", print_background=True,
               margin={"top": "0", "right": "0", "bottom": "0", "left": "0"}, prefer_css_page_size=False)
    br.close()

if NO_PDF:
    sys.exit(0)

# пустые страницы убираем по тексту (в каждой странице презентации есть текст)
reader = pypdf.PdfReader(RAW)
keep = [i for i, pg_ in enumerate(reader.pages) if (pg_.extract_text() or "").strip()]
writer = pypdf.PdfWriter()
for i in keep:
    writer.add_page(reader.pages[i])
# кликабельные ссылки pypdf переносит вместе со страницами
with open(OUT, "wb") as f:
    writer.write(f)
os.remove(RAW)
n = len(pypdf.PdfReader(OUT).pages)
print("страниц:", n, "из", len(reader.pages), "| размер:", round(os.path.getsize(OUT) / 1024 / 1024, 2), "МБ")
if n != EXPECTED_PAGES:
    sys.exit(f"ОШИБКА: ждали {EXPECTED_PAGES} страниц, получили {n}")
