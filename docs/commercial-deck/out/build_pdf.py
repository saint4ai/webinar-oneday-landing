#!/usr/bin/env python3
"""
Сборка коммерческой презентации Vibe Production в PDF.

    pip install playwright segno          # один раз
    python3 build_pdf.py                  # из папки docs/commercial-deck/out/

Что делает:
1. Берёт ссылку WhatsApp из константы CONTACT в presentation.html и рисует QR → assets/qr.svg.
2. Поднимает локальный сервер на папку out/ и открывает presentation.html в Chromium (кадр A4 альбом, 297×210 мм).
3. Проверяет: шрифты Unbounded и Manrope реально загрузились (assets/fonts), все картинки загрузились, текст не вылезает за страницу.
4. Снимает каждую страницу: shots/NN.png (1×) и JPEG 2× для PDF — страницы в растре, чтобы градиенты не белели на телефоне.
5. Собирает onAI_Vibe_Production_KP.pdf из растровых страниц, кладёт поверх кликабельные ссылки (элементы с data-link:
   WhatsApp и Instagram), проверяет число страниц, число ссылок и размер (≤ 10 МБ).

Браузер: если задан CHROMIUM_PATH или есть /opt/pw-browsers/chromium — берётся он, иначе Chromium из `playwright install chromium`.
"""
import functools
import http.server
import os
import re
import shutil
import socketserver
import sys
import threading
from pathlib import Path

import segno
from playwright.sync_api import sync_playwright

OUT = Path(__file__).resolve().parent
HTML = OUT / "presentation.html"
PDF = OUT / "onAI_Vibe_Production_KP.pdf"
SHOTS = OUT / "shots"
TMP = OUT / ".build"
W, H = 1123, 794  # 297×210 мм при 96 dpi
MAX_MB = 10


def contact_url() -> str:
    m = re.search(r'wa:\s*"([^"]*)"', HTML.read_text(encoding="utf-8"))
    return m.group(1) if m else ""


def make_qr(url: str) -> None:
    if not url:
        print("! В CONTACT.wa пусто — QR не рисую, на странице 13 место с подсказкой")
        return
    segno.make(url, error="m").save(str(OUT / "assets" / "qr.svg"), scale=10, border=1, dark="#2A211C", light="#FFFFFF")
    print(f"✓ QR: {url}")


def serve() -> tuple[socketserver.TCPServer, int]:
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):  # без лога каждого запроса
            pass

    handler = functools.partial(Quiet, directory=str(OUT))
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


CHECK_JS = """() => {
  const secs = [...document.querySelectorAll('section.page')];
  const badImg = [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src'));
  const cls = (el) => (typeof el.className === 'string' ? el.className : el.getAttribute('class') || '');
  const overflow = [];
  secs.forEach((s, n) => {
    const r = s.getBoundingClientRect();
    // Всё, кроме украшений .deco, должно лежать внутри страницы
    s.querySelectorAll('*').forEach(el => {
      if (el.closest('.deco')) return;
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) return;
      if (b.left < r.left - 1 || b.right > r.right + 1 || b.top < r.top - 1 || b.bottom > r.bottom + 1)
        overflow.push(`${n + 1}: ${el.tagName.toLowerCase()}.${cls(el)} за краем страницы`);
    });
    // Текст не вылезает из блоков и карточек
    s.querySelectorAll('.pad, .col, .card, .ncard, .plate').forEach(el => {
      if (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
        overflow.push(`${n + 1}: .${cls(el).replace(/ /g, '.')} ${el.scrollWidth}×${el.scrollHeight} > ${el.clientWidth}×${el.clientHeight}`);
    });
  });
  const empty = secs.map((s, n) => (s.innerText.trim().length < 10 ? n + 1 : 0)).filter(Boolean);
  return {
    pages: secs.length, badImg, overflow: [...new Set(overflow)], empty,
    // check() отвечает «да», даже если шрифта нет вовсе, поэтому смотрим на реально загруженные начертания
    fonts: Object.fromEntries(['Unbounded', 'Manrope'].map(f => [f, [...document.fonts].some(x => x.family.replace(/["']/g, '') === f && x.status === 'loaded')])),
  };
}"""


def main() -> int:
    make_qr(contact_url())
    SHOTS.mkdir(exist_ok=True)
    shutil.rmtree(TMP, ignore_errors=True)
    TMP.mkdir()
    srv, port = serve()
    exe = os.environ.get("CHROMIUM_PATH") or ("/opt/pw-browsers/chromium" if Path("/opt/pw-browsers/chromium").exists() else None)
    ok = True
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
        url = f"http://127.0.0.1:{port}/presentation.html"
        for scale in (1, 2):
            page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=scale)
            page.goto(url, wait_until="networkidle")
            page.evaluate("Promise.all([document.fonts.load('700 40px Unbounded', 'Рилсы 90 000 ₸'), document.fonts.load('700 16px Manrope', 'Рилсы 90 000 ₸')]).then(() => document.fonts.ready).then(() => true)")
            page.wait_for_timeout(400)
            if scale == 1:
                r = page.evaluate(CHECK_JS)
                print(f"Страниц в HTML: {r['pages']}; шрифты: {r['fonts']}")
                for key, msg in (("badImg", "не загрузились картинки"), ("overflow", "текст вылезает"), ("empty", "пустые страницы")):
                    if r[key]:
                        ok = False
                        print(f"✗ {msg}: {r[key]}")
                if not all(r["fonts"].values()):
                    ok = False
                    print("✗ шрифты не загрузились")
                n_pages = r["pages"]
                # Где на страницах кликабельные места: координаты в пикселях страницы 1123×794
                links = page.evaluate("""() => [...document.querySelectorAll('section.page')].map((s) => {
                  const r = s.getBoundingClientRect();
                  return [...s.querySelectorAll('[data-href]')].map((el) => {
                    const b = el.getBoundingClientRect();
                    return { href: el.dataset.href, x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height };
                  });
                })""")
            for i, sec in enumerate(page.query_selector_all("section.page"), 1):
                if scale == 1:
                    sec.screenshot(path=str(SHOTS / f"{i:02d}.png"))
                else:
                    sec.screenshot(path=str(TMP / f"{i:02d}.jpg"), type="jpeg", quality=86)
            page.close()

        # PDF из растровых страниц: по одной картинке на страницу A4 альбом, поверх — кликабельные ссылки
        mm = 297 / W  # миллиметров в пикселе страницы
        pages_html = []
        for i in range(1, n_pages + 1):
            anchors = "".join(
                f'<a href="{l["href"]}" style="left:{l["x"] * mm:.2f}mm;top:{l["y"] * mm:.2f}mm;width:{l["w"] * mm:.2f}mm;height:{l["h"] * mm:.2f}mm"></a>'
                for l in links[i - 1]
            )
            pages_html.append(f'<div class="p"><img src="{i:02d}.jpg">{anchors}</div>')
        (TMP / "pages.html").write_text(
            "<!doctype html><meta charset=utf-8><style>@page{size:297mm 210mm;margin:0}*{margin:0;padding:0}"
            ".p{position:relative;width:297mm;height:210mm;break-after:page}.p:last-child{break-after:auto}"
            "img{display:block;width:100%;height:100%}a{position:absolute;display:block}</style>" + "".join(pages_html),
            encoding="utf-8",
        )
        n_links = sum(len(l) for l in links)
        page = browser.new_page()
        page.goto(f"http://127.0.0.1:{port}/.build/pages.html", wait_until="networkidle")
        page.pdf(path=str(PDF), width="297mm", height="210mm", print_background=True, margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
        browser.close()
    srv.shutdown()
    shutil.rmtree(TMP, ignore_errors=True)

    data = PDF.read_bytes()
    pdf_pages = len(re.findall(rb"/Type\s*/Page(?!s)", data))
    size_mb = len(data) / 1024 / 1024
    pdf_links = len(re.findall(rb"/URI\s*\(", data))
    print(f"PDF: {PDF.name}, страниц {pdf_pages} (секций {n_pages}), {size_mb:.1f} МБ, ссылок {pdf_links} (ожидалось {n_links})")
    if pdf_links < n_links:
        ok = False
        print("✗ не все ссылки попали в PDF")
    if pdf_pages != n_pages:
        ok = False
        print("✗ число страниц PDF не равно числу секций")
    if size_mb > MAX_MB:
        ok = False
        print(f"✗ PDF больше {MAX_MB} МБ")
    print("✓ Проверки пройдены" if ok else "✗ Есть ошибки — см. выше")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
