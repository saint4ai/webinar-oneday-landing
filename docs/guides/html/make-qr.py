# QR-код ссылки на видео Higgsfield (модуль 3, «оффер со стройкой»), локально, без онлайн-сервисов.
# Формат тот же, что у img/qr-repo.svg: viewBox по числу модулей плюс рамка 2, один path цвета текста бренда, строки склеены в прямоугольники.
# Запуск: python docs/guides/html/make-qr.py   (нужен пакет qrcode)
import os, sys
import qrcode
from qrcode.constants import ERROR_CORRECT_M

HERE = os.path.dirname(os.path.abspath(__file__))
URL = "https://www.youtube.com/watch?v=DvRGamF7uRo&t=151"
BORDER = 2
qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, border=0, box_size=1)
qr.add_data(URL)
qr.make(fit=True)
m = qr.get_matrix()
n = len(m)
parts = []
for y, row in enumerate(m):
    x = 0
    while x < n:
        if row[x]:
            x0 = x
            while x < n and row[x]:
                x += 1
            parts.append(f"M{x0 + BORDER} {y + BORDER}h{x - x0}v1h-{x - x0}z")
        else:
            x += 1
size = n + 2 * BORDER
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" shape-rendering="crispEdges"><path fill="#2A211C" d="{"".join(parts)}"/></svg>'
out = os.path.join(HERE, "img", "qr-offer-video.svg")
open(out, "w", encoding="utf-8").write(svg)
print("версия", qr.version, "модулей", n, "->", out)
