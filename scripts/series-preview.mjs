// Страница просмотра серии бота для Александра: собирается из form-api/tg-series.json,
// поэтому на странице ровно то, что отправит бот. Картинки берутся из workshop-montazh/assets/tg.
// Запуск: node scripts/series-preview.mjs [папка-вывода]  (по умолчанию docs/reports/series-preview)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = process.argv[2] || join(root, "docs/reports/series-preview");
const series = JSON.parse(readFileSync(join(root, "form-api/tg-series.json"), "utf8"));
mkdirSync(join(out, "media"), { recursive: true });

const ASSET_PREFIX = "https://onai.academy/workshop-montazh/";
const media = new Set();
function localMedia(url) {
  if (!url || !url.startsWith(ASSET_PREFIX)) return null;
  const src = join(root, "workshop-montazh", url.slice(ASSET_PREFIX.length));
  const name = basename(src);
  if (!existsSync(src)) return { name, missing: true };
  if (!media.has(name)) { copyFileSync(src, join(out, "media", name)); media.add(name); }
  return { name, missing: false };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const L = series.links;

// Текст в боте уже HTML (parse_mode HTML): свои теги оставляем, переносы строк в <br>.
function renderText(t, { first = "Имя", dayWord = "Сегодня" } = {}) {
  return t
    .replace("{hi}", `Привет, ${first}!`)
    .replace("{dayWord}", dayWord)
    .replace("{dayWordLower}", dayWord.toLowerCase())
    .replace("{TEMPLATE}", esc(L.template))
    .replace(/\n/g, "<br>");
}

const BTN = {
  "{STREAM}": ["Bizon 365, наша ссылка с учётом перехода", true],
  "{PAY}": [L.pay ? "оплата полной суммы" : "нет ссылки на оплату: кнопка не появится", !!L.pay],
  "{PREPAY_KZ}": [L.prepayKz ? "Kaspi Pay, Казахстан" : "нет ссылки: кнопка не появится", !!L.prepayKz],
  "{PREPAY_INTL}": [L.prepayIntl ? "pay.rrllc.ru, Россия и другие страны" : "нет ссылки: кнопка не появится", !!L.prepayIntl],
  "{MANAGER}": ["Telegram менеджера Аяны, @futleid", true],
  "{WHATSAPP_TEMPLATE}": ["WhatsApp +7 708 583 4575 с готовым текстом", true],
  "{CASES}": ["onai.academy/saint, все кейсы", true],
  "{GAME}": ["игра Token Runner в Telegram", true],
};
function renderButtons(rows = []) {
  if (!rows.length) return "";
  const html = rows.flat().map((b) => {
    if (b.callback) return `<span class="btn" title="кнопка внутри бота">${esc(b.text)}</span>`;
    const [hint, on] = BTN[b.url] || [b.url, true];
    return `<span class="btn${on ? "" : " off"}" title="${esc(hint)}">${esc(b.text)}<small>${esc(hint)}</small></span>`;
  }).join("");
  return `<div class="btns">${html}</div>`;
}

const AUD = {
  all: ["Всем", "a-all"],
  clicked: ["Кто зашёл на эфир", "a-all"],
  notClicked: ["Кто ещё не зашёл на эфир", "a-nc"],
  notPaid: ["Кто не оплатил", "a-np"],
  clickedNotPaid: ["Были на эфире, не оплатили", "a-np"],
};

function bubble({ id, at, audience = "all", mediaSpec, text, buttons, note, enabled = true, dayOffset = 0, silent = false, essential = false }) {
  const isDoc = mediaSpec?.type === "document";
  const m = mediaSpec && !isDoc ? localMedia(mediaSpec.type === "video" ? mediaSpec.poster : mediaSpec.url) : null;
  let mediaHtml = "";
  if (isDoc) {
    // PDF уходит файлом (sendDocument): в ленте показываем плашку с именем файла
    mediaHtml = `<figure class="media missing"><span>PDF-файл: ${esc(basename(mediaSpec.url))}</span></figure>`;
  } else if (mediaSpec) {
    const ratio = mediaSpec.type === "video" ? "video" : "photo";
    mediaHtml = m && !m.missing
      ? `<figure class="media ${ratio}"><img src="media/${esc(m.name)}" alt="" loading="lazy">${mediaSpec.type === "video" ? '<span class="play" aria-hidden="true"></span><figcaption>видео, 720p</figcaption>' : ""}</figure>`
      : `<figure class="media missing"><span>картинка ещё рендерится: ${esc(m ? m.name : "")}</span></figure>`;
  }
  const [audLabel, audClass] = AUD[audience] || [audience, "a-all"];
  const day = dayOffset ? `<span class="day">на следующий день</span>` : "";
  return `
  <article class="msg${enabled ? "" : " disabled"}" id="${esc(id)}">
    <div class="when"><time>${esc(at)}</time>${day}</div>
    <div class="body">
      <div class="bubble">${mediaHtml}<p>${renderText(text)}</p>${renderButtons(buttons)}</div>
    </div>
    <aside class="meta">
      <span class="aud ${audClass}">${esc(audLabel)}</span>
      ${silent ? '<span class="aud a-off">без звука</span>' : ""}
      ${essential ? '<span class="aud a-all">уходит всегда, даже до твоего «ок»</span>' : ""}
      ${enabled ? "" : '<span class="aud a-off">выключено, ждёт решения</span>'}
      ${note ? `<p>${note}</p>` : ""}
      <code>${esc(id)}</code>
    </aside>
  </article>`;
}

// Пояснения к сообщениям: зачем оно и откуда факты.
const NOTES = {
  "warm-1200": "Доказательство результата. Цифра с лендинга: «119 000+ просмотров у ролика, который смонтировал агент». Формулировка как на слайде 30 презентации.",
  "warm-1400": "Снимает страх «я не умею монтировать». Кадр: настоящий лист сравнения макетов от агента, 18.09. Цитата правки дословная, 03.10.",
  "warm-1700": "Кейсы Erickson и AI-Таргетолог как доказательство, подводит к тому, что покажет эфир: сценарий, монтаж и заявки из директа. Сроки из кейсов на onai.academy/saint.",
  "warm-1930": "Вовлечение: человек приходит с темой рилса. Время по Москве для зрителей из России.",
  "link-1950": "Ссылка за 10 минут. Переход по кнопке считается: так бот понимает, кто зашёл.",
  "live-2000": "Старт эфира. Только тем, кто не нажал ссылку в 19:50.",
  "nudge-2010": "Догрев 1 из 3: через 10 минут после старта.",
  "topic-p1": "Что сейчас на эфире: видеоурок про весь путь рилса из семи шагов. Без звука, чтобы уведомление не выдёргивало из эфира.",
  "nudge-2030": "Догрев 2 из 3. Начинается с «Если ещё не с нами»: учёт по кнопке не видит тех, кто зашёл по старой ссылке.",
  "topic-reel": "Что сейчас на эфире: слайды 22–30.",
  "nudge-2050": "Догрев 3 из 3, перед оффером: что в блоге остаётся человеку, остальное делают агенты.",
  "training-2058": "Ты озвучиваешь оффер. Программа из оферты Vibe Production: бонус за покупку в день эфира из трёх частей (модуль 3 «AI-креатор», 6 месяцев доступа, модуль по рекламе через Claude). Цену не называем: она только в оффере для тех, кто был на эфире.",
  "bonus-2115": "Обещанные бонусы: три гайда PDF и карта 6 референсов. Уходит всем, кто записан на этот эфир.",
  "offer-2118":"Оффер в конце эфира, твоя фраза дословно. Цены, рассрочка и игра из оферты; бонус из трёх частей; из подписок обязательна только Claude от $20, остальное по желанию. Доллары по курсу Нацбанка РК 454,98 ₸ на 06.10, округлено. Шаблон для Аяны копируется нажатием.",
  "push-2130": "Дожим 1: что человек сделает за месяц, по модулям оферты; бонус из трёх частей. Только тем, кто был на эфире.",
  "push-2230": "Дожим 2: если нет всей суммы. Рассрочка, предоплата, игра на минус 10 000 ₸.",
  "push-2330": "Дожим 3: дедлайн 23:59, цена и бонус. Только тем, кто был на эфире.",
  "next-day-1100": "Возврат тех, кто записался, но не пришёл. Цену не называем: зовём на воркшоп, там её озвучат. Кнопка переводит человека на сегодняшний эфир, ссылка придёт в 19:50.",
  "follow-1030": "Дожим на следующий день 1: презентация Vibe Production файлом PDF, условия до 23:59. Только тем, кто был на эфире и не оплатил.",
  "follow-1500": "Дожим на следующий день 2: три ответа на сомнения и условия с бонусом до 23:59; презентация открывается кнопкой, файл ушёл в 10:30. Только тем, кто был на эфире и не оплатил.",
  "follow-2145": "Дожим на следующий день 3: честный вопрос «с нами или нет» до конца дня. Только тем, кто был на эфире и не оплатил.",
};

const msgs = series.messages.map((m) => ({ ...m, mediaSpec: m.media, note: NOTES[m.id] }));
const phase = (from, to) => msgs.filter((m) => (m.dayOffset || 0) === 0 && m.at >= from && m.at < to);
const before = phase("00:00", "20:00");
const during = phase("20:00", "21:20");
const after = [...phase("21:20", "24:00"), ...msgs.filter((m) => m.dayOffset)];

const w = series.welcome;
const welcomeHtml =
  bubble({ id: "welcome", at: "сразу", audience: "all", mediaSpec: w.media, text: w.before, note: "Приходит сразу после «Запустить». Слово «Сегодня» или «Завтра» бот ставит сам по времени записи." }) +
  bubble({ id: "welcome-live", at: "во время эфира", audience: "all", text: w.live, buttons: w.liveButtons, note: "Если человек нажал «Запустить», когда эфир уже идёт." });

const perDay = msgs.filter((m) => m.enabled !== false && !m.dayOffset);
const countFor = (aud) => 1 + perDay.filter((m) => m.audience === "all" || aud.includes(m.audience)).length;
const maxCount = countFor(["notClicked", "notPaid"]);
const clickedCount = countFor(["clicked", "notPaid"]);

const coverFile = localMedia("https://onai.academy/workshop-montazh/assets/tg/cover-bizon.jpg");

const html = `<title>Серия «Вайб-продакшен»</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap">
<style>
/* Лента дня эфира: слева время, в центре сообщение как в чате, справа кому и зачем. Ночь эфира, золото как на onai.academy. */
:root{
  --night:#14100E; --night2:#211A16; --bubble:#2B231E; --cream:#FBF3E4; --muted:rgba(251,243,228,.64);
  --line:rgba(251,243,228,.13); --gold:#E3C07B; --gold2:#C9A05A; --brown:#C0703F; --off:rgba(251,243,228,.32);
  --display:'Unbounded',system-ui,sans-serif; --text:'Manrope',system-ui,-apple-system,'Segoe UI',sans-serif;
  color-scheme:dark;
}
*{box-sizing:border-box}
body{margin:0;background:var(--night);color:var(--cream);font:16px/1.55 var(--text);-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding-inline:20px;padding-block:40px 80px}
header.top{display:grid;gap:14px;padding-bottom:28px;border-bottom:1px solid var(--line)}
.kicker{font:700 12px/1 var(--text);letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}
h1{font:700 clamp(28px,4.4vw,48px)/1.05 var(--display);letter-spacing:-.03em;margin:0;text-wrap:balance}
h1 em{font-style:normal;color:var(--gold)}
.lede{color:var(--muted);max-width:62ch;margin:0}
.facts{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px}
.fact{border:1px solid var(--line);border-radius:999px;padding:7px 14px;font-size:14px;color:var(--muted)}
.fact b{color:var(--cream);font-variant-numeric:tabular-nums}
.status{display:inline-flex;gap:8px;align-items:center;background:rgba(227,192,123,.12);border:1px solid rgba(227,192,123,.35);color:var(--gold);border-radius:999px;padding:7px 14px;font-weight:600;font-size:14px}
.status::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--gold)}
section.phase{margin-top:48px}
section.phase>h2{font:600 clamp(20px,2.4vw,26px)/1.2 var(--display);letter-spacing:-.02em;margin:0 0 6px}
section.phase>p{color:var(--muted);margin:0 0 22px;max-width:70ch}
.msg{display:grid;grid-template-columns:96px minmax(0,520px) minmax(0,1fr);gap:22px;padding-block:18px;border-top:1px solid var(--line)}
.msg.disabled{opacity:.62}
.when time{font:700 20px/1 var(--display);color:var(--gold);font-variant-numeric:tabular-nums}
.when .day{display:block;margin-top:6px;font-size:12px;color:var(--muted)}
.bubble{background:var(--bubble);border-radius:18px 18px 18px 6px;overflow:hidden;border:1px solid rgba(251,243,228,.06)}
.bubble p{margin:0;padding:14px 16px 14px;font-size:15.5px;line-height:1.5}
.bubble code{font:500 14px/1.45 ui-monospace,Consolas,monospace;background:rgba(0,0,0,.28);padding:2px 4px;border-radius:4px}
.media{margin:0;position:relative;background:var(--night2)}
.media img{display:block;width:100%;height:auto}
.media.video img{max-height:520px;object-fit:cover}
.media.missing{padding:40px 16px;color:var(--muted);font-size:14px;text-align:center}
.media figcaption{position:absolute;left:10px;bottom:10px;font-size:12px;background:rgba(0,0,0,.55);padding:3px 8px;border-radius:6px}
.play{position:absolute;inset:0;margin:auto;width:64px;height:64px;border-radius:50%;background:rgba(20,16,14,.55);border:1px solid rgba(251,243,228,.5)}
.play::after{content:"";position:absolute;left:26px;top:20px;border-left:18px solid var(--cream);border-top:12px solid transparent;border-bottom:12px solid transparent}
.btns{display:grid;gap:6px;padding:0 10px 10px}
.btn{display:grid;gap:2px;text-align:center;background:rgba(251,243,228,.08);border-radius:10px;padding:9px 10px;font-weight:600;font-size:14.5px;color:var(--cream)}
.btn small{font-weight:500;font-size:11.5px;color:var(--muted)}
.btn.off{background:transparent;border:1px dashed var(--off);color:var(--off)}
.btn.off small{color:var(--off)}
.meta{display:flex;flex-direction:column;gap:8px;align-items:flex-start;min-width:0}
.meta p{margin:0;color:var(--muted);font-size:14px;max-width:46ch}
.meta code{font:12px ui-monospace,Consolas,monospace;color:var(--off)}
.aud{font-size:12.5px;font-weight:700;border-radius:999px;padding:5px 11px;letter-spacing:.02em}
.a-all{background:rgba(227,192,123,.14);color:var(--gold)}
.a-nc{background:rgba(192,112,63,.2);color:#F0A877}
.a-np{background:rgba(251,243,228,.1);color:var(--cream)}
.a-off{background:transparent;border:1px dashed var(--off);color:var(--muted)}
.cover{margin-top:48px;display:grid;gap:14px}
.cover img{width:100%;max-width:100%;border-radius:14px;border:1px solid var(--line)}
.open{margin-top:48px;border:1px solid rgba(227,192,123,.35);border-radius:18px;padding:22px;background:rgba(227,192,123,.06)}
.open h2{font:600 22px/1.2 var(--display);margin:0 0 12px}
.open ol{margin:0;padding-left:20px;display:grid;gap:8px}
.open li{color:var(--cream)}
.open li span{color:var(--muted)}
@media (max-width:860px){
  .msg{grid-template-columns:1fr;gap:10px}
  .when{display:flex;gap:10px;align-items:baseline}
  .when .day{margin:0}
}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style>
<div class="wrap">
<header class="top">
  <span class="kicker">Telegram-бот @workshop_aiprod_bot · каждый день</span>
  <h1>Серия воркшопа <em>«Вайб-продакшен»</em></h1>
  <p class="lede">Так выглядит один день человека, который записался на эфир в 20:00 по Алматы. Тексты, картинки и кнопки здесь те же, что отправит бот. Время сообщений поправим вместе, оно меняется в одном файле без правки кода.</p>
  <div class="facts">
    <span class="status">Серия включена 06.10, первый прогрев 07.10 в 12:00</span>
    <span class="fact">Максимум за день: <b>${maxCount}</b> сообщений</span>
    <span class="fact">Если зашёл на эфир: <b>${clickedCount}</b></span>
    <span class="fact">Эфир: <b>20:00–21:20</b>, Bizon 365</span>
  </div>
</header>

<section class="phase">
  <h2>Запись</h2>
  <p>Человек нажимает «Вступить в Telegram» на странице «Спасибо» и попадает в бота.</p>
  ${welcomeHtml}
</section>

<section class="phase">
  <h2>До эфира: прогрев</h2>
  <p>Четыре прогрева и ссылка за 10 минут. Кто записался позже времени сообщения, его не получает: бот не догоняет прошлым.</p>
  ${before.map(bubble).join("")}
</section>

<section class="phase">
  <h2>Эфир 20:00–21:20</h2>
  <p>Всем: что сейчас на эфире. Тем, кто не нажал ссылку: три догрева. Время подстроено под слайды. Если эфир пойдёт быстрее или медленнее, любое сообщение можно отправить вручную командой <code>/fire id</code>.</p>
  ${during.map(bubble).join("")}
</section>

<section class="phase">
  <h2>После эфира: оффер и дожим</h2>
  <p>Тем, кто нажал «Я уже оплатил(а)» или кого менеджер отметил оплатившим, дожимы не приходят.</p>
  ${after.map(bubble).join("")}
</section>

${coverFile && !coverFile.missing ? `<section class="cover"><h2 class="kicker">Обложка эфира в Bizon 365 · 1920×1080</h2><img src="media/${esc(coverFile.name)}" alt="Обложка эфира «Вайб-продакшен» для Bizon 365"></section>` : ""}

<section class="open">
  <h2>Что нужно от тебя</h2>
  <ol>
    <li>Ссылка на оплату всей суммы. <span>Предоплата уже работает: Kaspi и pay.rrllc.ru. Кнопка «Оплатить всю сумму» появится, как только будет ссылка, а пока всю сумму и рассрочку оформляет Аяна счётом.</span></li>
    <li>Сумма в долларах. <span>Сейчас «≈ $330» по курсу Нацбанка 454,98 ₸ на 06.10. Поставить свою круглую цифру?</span></li>
    <li>Нажать «Запустить» в боте. <span>Серия включена 06.10. Чтобы получать отчёт в 21:25 и править время командами, бот должен знать твой чат.</span></li>
  </ol>
</section>
</div>`;

writeFileSync(join(out, "index.html"), html, "utf8");
console.log(`ok: ${join(out, "index.html")}, картинок ${media.size}, максимум ${maxCount} сообщений в день`);
