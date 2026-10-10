// Генератор HTML раздаток к урокам Vibe Production (модули 1 и 2).
// Тексты берутся из docs/guides/lesson-handouts.md без изменений формулировок: здесь только раскладка и графика.
// Запуск: node docs/guides/html/gen-lessons.mjs  (пишет docs/guides/html/lessons/*.html)
// Потом: node docs/guides/html/build-lessons.mjs  (PDF), python docs/guides/html/qa-lessons.py  (проверка и превью).
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { extraSections } from "./lessons-extra.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "lessons");
mkdirSync(outDir, { recursive: true });

/* ====================== мелкие помощники ====================== */
const IMG = (n, c = "", st = "") => `<img src="../img/${n}.png" alt=""${c ? ` class="${c}"` : ""}${st ? ` style="${st}"` : ""}>`;
const LOGO = (n) => `<img src="../img/logo-${n}.svg" alt="">`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const GOLD2 = "#C9A05A", BROWN = "#A0532A", NIGHT = "#14100E", INK = "#2A211C", GOLD = "#E3C07B", CREAM = "#FBF3E4";
const PATH = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  warn: "M12 3l10 18H2zM12 10v5M12 18v.5",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7",
  bubble: "M4 5h16v11H9l-5 4z",
  key: "M13 10l8-8M17 6l3 3M14 9l2 2M10 20a5 5 0 1 1 0-10 5 5 0 0 1 0 10z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6",
  pad: "M6 3h12v18H6zM9 3v3M12 3v3M15 3v3M9 11h6M9 15h4",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
  copy: "M8 8h11v13H8zM5 16V3h11",
  mic: "M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  table: "M3 5h18v14H3zM3 10h18M9 5v14M15 5v14",
  slash: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 18.4L18.4 5.6",
  wave: "M3 12h2M7 8v8M11 4v16M15 8v8M19 10v4",
  monitor: "M3 5h18v11H3zM8 20h8M12 16v4",
  download: "M12 3v12M7 10l5 5 5-5M4 20h16",
  eye: "M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12zM12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z",
  chat2: "M3 4h13v9H8l-5 4zM12 15h9v6l-4-3h-5z",
  calc: "M6 3h12v18H6zM9 7h6M9 12h1M12 12h1M15 12h1M9 16h1M12 16h1M15 16h1",
  page: "M4 4h16v16H4zM4 9h16M8 13h8M8 16h5",
  rocket: "M12 3c3 2 5 5 5 9l-2 3H9l-2-3c0-4 2-7 5-9zM9 15l-2 4 3-1M15 15l2 4-3-1M12 9.5a1.5 1.5 0 1 0 0 .01",
  play: "M8 5l11 7-11 7z",
  star: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.6 19.4l1.3-6L3.4 9.3l6-.7z",
  chart: "M4 20h16M7 20v-7M12 20V6M17 20v-10",
  gear: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1",
  mail: "M3 6h18v12H3zM3 7l9 6 9-6",
};
const FILLED = { sparkle: "M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z", playf: "M8 5l11 7-11 7z" };
const G = (n, o = {}) => {
  const { s, c = "currentColor", w = 2.4, cls = "" } = o;
  const size = s ? ` width="${s}" height="${s}"` : "";
  if (FILLED[n]) return `<svg class="sv ${cls}" viewBox="0 0 24 24"${size} fill="${c}"><path d="${FILLED[n]}"/></svg>`;
  return `<svg class="sv ${cls}" viewBox="0 0 24 24"${size} fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><path d="${PATH[n]}"/></svg>`;
};
const ARROW_G = G("arrow", { c: GOLD2, w: 3 });
const ARROW_W = G("arrow", { c: "#fff", w: 3 });
const ARROW_N = G("arrow", { c: INK, w: 3 });

/* ====================== общие блоки ====================== */
const CHAT = {
  mont: { img: "lg-i-clapper", name: "Монтажёр" },
  scr: { img: "lg-i-hook", name: "Скриптолог" },
  ig: { img: "lg-i-botchat", name: "Instagram-автоматизатор" },
  sep: { img: "lg-i-laptopfilm", name: "отдельный чат" },
  box: { img: "lg-i-box", name: "отдельный чат" },
};
const MOD = {
  1: "Модуль 1 «AI-монтаж»",
  2: "Модуль 2 «Ассистенты и автоматизация»",
};

const progress = (n) => {
  let s = "";
  for (let i = 1; i <= 10; i++) s += `<span class="s${i < n ? " d" : i === n ? " c" : ""}"></span>`;
  return `<div class="prog"><span class="pl">урок ${n} из 10</span><div class="sg">${s}</div></div>`;
};
const badges = (list) => `<div class="cbs">${list.map((c) => {
  if (c === "или") return `<div class="cb o"><span>или</span></div>`;
  if (c === "и") return `<div class="cb o"><span>и</span></div>`;
  const d = typeof c === "string" ? CHAT[c] : c;
  return `<div class="cb${d.wide ? " wide" : ""}"${d.w ? ` style="width:${d.w}px"` : ""}><div class="im">${IMG(d.img)}</div><span>${d.name}</span></div>`;
}).join("")}</div>`;

const header = (L) => `<header class="lh">
  <div class="lh-top"><div class="kicker">${MOD[L.mod]}</div>${progress(L.n)}</div>
  <div class="lh-main"><div class="plate">${L.id}</div><h1 class="lh-title u">${L.title}</h1>${badges(L.chats)}</div>
</header>`;
const slimHeader = (L) => `<header class="lh-s"><div class="plate">${L.id}</div><div class="t">${L.title}</div>${progress(L.n)}</header>`;

const result = (text, tag = "Результат урока") => `<div class="res"><span class="tg">${tag}</span><span class="tx">${text}</span></div>`;

const H = (t, icon, extra = "") => `<div class="hd">${icon ? `<span class="hi">${icon}</span>` : ""}<span>${t}</span>${extra}</div>`;

const you = (steps, two = false, from = 1, title = "Что делаете вы") => `<div class="you${two ? " two" : ""}">${H(title, G("user", { c: NIGHT, w: 2.6 }))}<ol>${steps.map((s, i) => `<li><span class="no">${i + from}</span><span class="tx">${s}</span><span class="bx"></span></li>`).join("")}</ol></div>`;

const agent = (items, title = "Что делает агент") => `<div class="ag"><div class="hd">${IMG("lg-i-robot")}<span>${title}</span></div><ul>${items.map((s) => `<li>${s}</li>`).join("")}</ul></div>`;

const rule = (head, was, now) => { const k = Math.max(0.5, Math.min(1.1, was.length / now.length * 1.3)); return `<div class="rl">${H("Главное правило", G("sparkle", { c: INK }))}<div class="big">${head}</div><div class="bs">
  <div class="w" style="flex:${k.toFixed(2)}"><div class="tag">${G("slash", { c: "#8E3B2E", w: 2.6 })}Было</div><div class="tx">${was}</div></div>
  <div class="ar">${ARROW_G}</div>
  <div class="n" style="flex:1"><div class="tag">${G("check", { c: NIGHT, w: 3 })}Стало</div><div class="tx">${now}</div></div></div></div>`; };

const errors = (list) => `<div class="er">${H("Частые ошибки", G("warn", { c: "#fff", w: 2.6 }).replace("<svg", '<svg style="width:17px;height:17px"'))}${list.map(([a, b]) => `<div class="it"><div class="pr">${G("warn", { c: "#fff", w: 2.4 })}<span>${a}</span></div><div class="ar">${ARROW_N}</div><div class="ac">${b}</div></div>`).join("")}</div>`;

const done = (t) => `<div class="dn"><div class="ck">${G("check", { c: GOLD, w: 3.4 })}</div><div class="tx"><span class="lb">Готово, если:</span> ${t}</div></div>`;

// заполнители только в квадратных скобках, другим цветом (золото)
const PHV = (t) => t.replace(/\[[^\]]+\]/g, (m) => `<span class="pv${m.length > 18 ? " wr" : ""}">${m}</span>`);
const HAS_PH = (t) => /\[[^\]]+\]/.test(t);
const phrase = (t, label = "Фраза для агента", o = {}) => `<div class="ph nb${o.cls ? " " + o.cls : ""}"><img class="glow" src="../img/glow-gold.png" alt=""><div class="top"><span class="lb">${label}</span><span class="cp">${G("copy", { c: GOLD, w: 2.6 })}Скопируйте в чат</span></div>${HAS_PH(t) ? '<div class="hn">Слова в <span class="pv">[скобках]</span> замените на свои</div>' : ""}${o.qr ? `<div class="pq"><div class="tx">${PHV(t)}</div>${o.qr}</div>` : `<div class="tx">${PHV(t)}</div>`}</div>`;

/* стандартная страница Б: агент | правило, допблоки, ошибки, готово | фраза */
const pageB = (L, extra = "", opts = {}) => ({
  cls: "ls",
  html: `${slimHeader(L)}<div class="bd">
  <div class="gr2 ${opts.cols || "l"}">${agent(L.agent)}${rule(...L.rule)}</div>
  ${extra}
  ${errors(L.errors)}
  <div class="gr2 ${opts.cols2 || ""}">${done(L.done)}${phrase(L.phrase, L.phraseLabel)}</div></div>`,
});

/* лента-схема */
const rb = (nodes, cls = "") => `<div class="rb ${cls}">${nodes.map((n, i) => {
  let ic = "";
  if (n.imgs) ic = `<div class="im">${n.imgs.map((x) => IMG(x)).join("")}</div>`;
  else if (n.img) ic = `<div class="im">${IMG(n.img)}</div>`;
  else if (n.glyph) ic = `<div class="im"><span class="gi${n.dark ? " n" : ""}">${G(n.glyph, { c: n.dark ? GOLD : NIGHT, w: 2.4 })}</span></div>`;
  else if (n.logo) ic = `<div class="im"><span class="gi">${LOGO(n.logo).replace("<img", '<img style="width:30px;height:30px"')}</span></div>`;
  return `${i ? `<div class="rb-a">${ARROW_G}</div>` : ""}<div class="rb-n${n.hl ? " hl" : ""}"><span class="no">${i + 1}</span>${ic}<b>${n.t}</b>${n.s ? `<i>${n.s}</i>` : ""}</div>`;
}).join("")}</div>`;

/* ====================== страницы пакета ====================== */
const pages = {}; // имя раздела -> массив страниц {cls, html}

/* ---------- Обложка ---------- */
const cover = {
  cls: "cover",
  html: `<div class="gclip bleed"><img class="glow" src="../img/glow-gold.png" style="left:-260px;top:-260px;width:780px;opacity:.5" alt="">
  <img class="glow" src="../img/glow-brown.png" style="left:-240px;bottom:-420px;width:780px;opacity:.7" alt="">
  <img class="glow" src="../img/glow-gold.png" style="right:-260px;top:90px;width:900px;opacity:.75" alt=""></div>
  <img class="logo" src="../img/logo-night.svg" alt="onAI">
  <div class="txt">
    <div class="kicker">РАЗДАТКИ К УРОКАМ · VIBE PRODUCTION</div>
    <h1 class="cvh">Контент-завод: от ссылки до заявки</h1>
    <p class="sub">Модуль 1 «AI-монтаж» и модуль 2 «Ассистенты и автоматизация». 10 уроков: что делаете вы, что делает агент и как проверить себя.</p>
  </div>
  <div class="sig">Александр, основатель onAI Academy · <a href="https://www.instagram.com/saint4ai/">@saint4ai</a></div>
  <div class="cv-art bleed">
    ${IMG("lg-s49-factory", "", "left:10px;top:260px;width:640px;height:auto")}
    ${IMG("lg-i-cards", "", "left:60px;top:90px;width:150px;height:auto")}
    ${IMG("lg-i-botchat", "", "left:430px;top:66px;width:100px;height:auto")}
    <svg class="ov" style="left:0;top:0" width="620" height="420" viewBox="0 0 620 420" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9">
      <path d="M150 215 C 180 275, 220 300, 262 318"/><path d="M450 215 C 430 270, 400 295, 372 318"/></svg>
  </div>`,
};

/* ---------- Как устроен контент-завод (схема) ---------- */
const chatRow = (c, what, give) => `<div class="tr"><div>${IMG(c.img)}<span>${c.name}</span></div><div>${what}</div><div>${give}</div></div>`;
const factory = {
  cls: "cream ls",
  html: `<div><div class="kicker">Раздатки к урокам · Vibe Production</div><h1 class="u" style="font-size:34px;line-height:1.12;margin-top:10px;color:var(--brown)">Как устроен ваш контент-завод</h1></div>
  ${result("вы знаете, какие 3 чата понадобятся, что делает каждый и что остаётся вам.", "Результат")}
  <div class="map2">
    <svg width="1007" height="272" viewBox="0 0 1007 272" fill="none" stroke="${GOLD2}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M152 184 H262"/><path d="M252 177l10 7-10 7" />
      <path d="M262 218 H152"/><path d="M162 211l-10 7 10 7"/>
      <path d="M268 60 C 190 60, 112 70, 82 96"/><path d="M92 82l-10 14 17 3"/>
      <path d="M366 140 V110"/><path d="M359 120l7-10 7 10"/>
      <path d="M500 192 H556"/><path d="M546 185l10 7-10 7"/>
      <path d="M500 60 C 640 60, 683 80, 683 134"/><path d="M676 124l7 10 7-10"/>
      <path d="M812 192 H860"/><path d="M850 185l10 7-10 7"/>
    </svg>
    <div class="nd you" style="left:0;top:98px;width:150px;height:166px">${IMG("lg-s32-hand")}<b>Вы</b></div>
    <div class="nd chat" style="left:262px;top:8px;width:236px;height:100px">${IMG("lg-i-hook")}<div><b>Скриптолог</b></div></div>
    <div class="nd chat" style="left:262px;top:142px;width:236px;height:108px">${IMG("lg-i-clapper")}<div><b>Монтажёр</b><i>главный: с него начинаете</i></div></div>
    <div class="nd chat" style="left:560px;top:142px;width:250px;height:108px">${IMG("lg-i-botchat")}<div><b style="font-size:15px">Instagram-автоматизатор</b></div></div>
    <div class="nd out" style="left:862px;top:128px;width:145px;height:136px"><span class="lg">${LOGO("telegram")}</span><b>Заявка в Telegram</b></div>
    <span class="al" style="left:178px;top:166px">ссылка и запись</span>
    <span class="al" style="left:190px;top:236px">кадры на «ок»</span>
    <span class="al" style="left:170px;top:50px">текст</span>
    <span class="al" style="left:424px;top:125px">анкета</span>
    <span class="al" style="left:528px;top:174px">ролик</span>
    <span class="al" style="left:600px;top:52px">кодовое слово</span>
  </div>
  <div class="dfn"><span><b>Три чата в одной папке проекта.</b> Чат здесь это отдельный разговор с агентом Claude Code в приложении Claude Desktop.</span></div>
  <div class="tbl"><div class="th"><span>Чат</span><span>Что делает</span><span>Что отдаёт вам</span></div>
    ${chatRow(CHAT.mont, "ставит систему, задаёт вопросы, собирает ролик по шагам", "готовый ролик и подпись к публикации")}
    ${chatRow(CHAT.scr, "находит идеи в рилсах экспертов, которые уже набрали просмотры, пишет текст и кодовое слово", "текст для суфлёра (его читаете с экрана во время записи) и материал для директа")}
    ${chatRow(CHAT.ig, "подключает ассистента, который отвечает в директе, и выкладывает ролики", "заявки в ваш Telegram")}
  </div>`,
};

/* ---------- Ваша часть: 7 действий ---------- */
const mine = {
  cls: "cream ls",
  html: `<div><div class="kicker">Как устроен ваш контент-завод</div><h1 class="u" style="font-size:34px;line-height:1.12;margin-top:10px;color:var(--brown)">Ваша часть: 7 действий</h1></div>
  <div class="dfn"><span>Всё остальное делают агенты.</span></div>
  <div class="road">
    <div class="rw">
      <div class="sc"><div class="top"><span class="no">1</span>${IMG("lg-i-laptopfilm")}</div><div class="tx">Установите Claude Desktop и оформите подписку Pro или Max (платные тарифы Claude).</div></div><div class="jn">${ARROW_G}</div>
      <div class="sc"><div class="top"><span class="no">2</span>${IMG("lg-i-box")}</div><div class="tx">Создайте пустую папку и отдайте агенту ссылку на репозиторий (папка с системой курса в интернете, на GitHub).</div></div><div class="jn">${ARROW_G}</div>
      <div class="sc"><div class="top"><span class="no">3</span>${IMG("lg-i-magnifier")}</div><div class="tx">Ответьте на 5 вопросов и пришлите 2–5 рилсов, монтаж которых нравится.</div></div><div class="jn">${ARROW_G}</div>
      <div class="sc"><div class="top"><span class="no">4</span>${IMG("lg-i-hook")}</div><div class="tx">Откройте ещё два чата: «Скриптолог» и «Instagram-автоматизатор».</div></div>
    </div>
    <div class="rw">
      <div class="sc"><div class="top"><span class="no">5</span>${IMG("lg-i-camera")}</div><div class="tx">Запишите видео или голос по готовому тексту.</div></div><div class="jn">${ARROW_G}</div>
      <div class="sc"><div class="top"><span class="no">6</span>${IMG("lg-i-cards")}</div><div class="tx">Одобрите кадры и черновик, правки давайте по номерам кадров.</div></div><div class="jn">${ARROW_G}</div>
      <div class="sc"><div class="top"><span class="no">7</span>${IMG("lg-i-chatkey")}</div><div class="tx">Для ассистента зарегистрируйтесь в 4 сервисах и пополните баланс.</div></div><div class="jn e">${ARROW_G}</div>
      <div class="sc nt">${H("Ключи и оплату вводите сами", G("key", { c: NIGHT, w: 2.6 }))}<div class="tx">Пароли, оплату и ключи вы вводите сами. <b>Ключ в чат не вставляйте:</b> сохраните его в файл и напишите агенту, где файл лежит.</div></div>
    </div>
  </div>`,
};

/* ---------- Где агент остановится ---------- */
const gate = (n) => `<svg viewBox="0 0 132 112" fill="none"><defs><clipPath id="gc${n}"><rect x="30" y="46" width="98" height="18" rx="7"/></clipPath></defs>
  <rect x="10" y="102" width="40" height="8" rx="3" fill="${NIGHT}"/>
  <rect x="17" y="40" width="18" height="64" rx="5" fill="${NIGHT}"/>
  <rect x="30" y="46" width="98" height="18" rx="7" fill="#fff"/>
  <g clip-path="url(#gc${n})" fill="${BROWN}"><path d="M44 46h14l-10 18H34zM72 46h14l-10 18H62zM100 46h14l-10 18H90zM128 46h6l-10 18h-6z"/></g>
  <rect x="30" y="46" width="98" height="18" rx="7" stroke="${NIGHT}" stroke-width="3"/>
  <circle cx="26" cy="24" r="16" fill="${GOLD}" stroke="${NIGHT}" stroke-width="3"/>
  <text x="26" y="30" text-anchor="middle" font-family="Unbounded" font-weight="800" font-size="16" fill="${NIGHT}">${n}</text></svg>`;
// подписи строк «Что покажет агент» и «Что ответить» стоят один раз слева, у каждого шлагбаума только текст
const stp = (n, where, show, ans) => `<div class="stp"><div class="gt">${gate(n)}</div><div class="wh">${where}</div>
  <div class="bx"><div class="v">${show}</div></div>
  <div class="bx ans"><div class="v">${ans}</div></div></div>`;
const stops = {
  cls: "cream ls",
  html: `<div><div class="kicker">Как устроен ваш контент-завод</div><h1 class="u" style="font-size:34px;line-height:1.12;margin-top:10px;color:var(--brown)">Где агент остановится и спросит вас</h1></div>
  ${result("вы знаете 7 точек, где без вашего ответа работа не пойдёт дальше.", "Результат")}
  <div class="dfn"><span>Агент делает работу сам, но в 7 местах ждёт вашего решения. Это защита: ни текст, ни ролик, ни ассистент не уходят к людям без вашего «ок».</span></div>
  <div class="stops">
    <div class="rl0"></div><div class="rl0"></div><div class="rl0 k">Что покажет агент</div><div class="rl0 k a">Что ответить</div>
    ${stp(1, "Знакомство", "5 вопросов о вас и бизнесе", "ответы одним сообщением")}
    ${stp(2, "Примеры роликов", "разбор рилсов и совет по стилю", "выбор формата и стиля")}
    ${stp(3, "Сценарий", "текст для суфлёра", "«ок» или правки словами")}
    ${stp(4, "Кадры", "лист кадров К001, К002…", "правки по номерам или «ок»")}
    ${stp(5, "Черновик", "черновик ролика", "«ок»")}
    ${stp(6, "Ассистент", "ответы на 10 типичных вопросов", "«ок» перед запуском")}
    ${stp(7, "Публикация", "файл, подпись, кодовое слово", "«выкладывай»")}
  </div>`,
};

/* ---------- Карта уроков ---------- */
const lp = (id, t, img, chats, label) => `<div class="lp"><span class="nm">${id}</span><div class="im">${IMG(img)}</div><div class="t">${t}</div><div class="ch">${chats.map((c) => IMG(c.img)).join("")}<span>${label || chats.map((c) => c.name).join(" и ")}</span></div></div>`;
const lmap = {
  cls: "cream ls",
  html: `<div><div class="kicker">Как устроен ваш контент-завод</div><h1 class="u" style="font-size:34px;line-height:1.12;margin-top:10px;color:var(--brown)">Карта уроков</h1></div>
  <div class="mp" style="margin-top:10px"><div class="mh">${MOD[1]}</div><div class="rw5">
    ${lp("1.1", "Рабочее место", "lg-s59-desk", [CHAT.mont])}
    ${lp("1.2", "Сценарий и 3 секунды", "lg-i-hourglass", [CHAT.scr])}
    ${lp("1.3", "Выбор стиля", "lg-s50-plan", [CHAT.mont])}
    ${lp("1.4", "Сборка ролика", "lg-i-clapper", [CHAT.mont])}
    ${lp("1.5", "Серия роликов", "lg-i-calendar", [CHAT.mont, CHAT.ig])}
  </div></div>
  <div class="mp" style="margin-top:10px"><div class="mh">${MOD[2]}</div><div class="rw5">
    ${lp("2.1", "Вайбкодинг в личных делах", "lg-s13-editor", [CHAT.sep], "отдельный чат в папке «Личные дела»")}
    ${lp("2.2", "ИИ-менеджер в WhatsApp и Instagram", "lg-s21-robot", [CHAT.ig])}
    ${lp("2.3", "Автоматизация процессов", "lg-i-phonearrow", [CHAT.ig, CHAT.box], "Instagram-автоматизатор или отдельный чат под задачу")}
    ${lp("2.4", "Документы и презентации", "lg-i-cards", [CHAT.box], "отдельный чат в папке «Гайды и КП»")}
    ${lp("2.5", "Контент-завод целиком", "lg-s49-factory", [CHAT.mont, CHAT.scr, CHAT.ig], "все три")}
  </div><div class="dfn" style="margin-top:8px"><span>Уроки 2.2 и 2.3 требуют сервер и 4 регистрации. Уроки 2.1 и 2.4 можно проходить в любой момент.</span></div></div>`,
};

/* ---------- Что завести до уроков ---------- */
const svc = (n, nameHtml, why, where, imp) => `<div class="svr"><span class="no">${n}</span>${nameHtml}<div class="zc">${why}</div><div class="gd">${where}</div><div class="vz">${imp}</div></div>`;
const lgName = (logo, name) => `<div class="nm"><span class="lgo">${LOGO(logo)}</span><span>${name}</span></div>`;
const txName = (ch, name) => `<div class="nm"><span class="lgo tx">${ch}</span><span>${name}</span></div>`;
const reg1 = {
  cls: "cream ls tight",
  html: `<div><div class="kicker">Раздатки к урокам · Vibe Production</div><h1 class="u" style="font-size:34px;line-height:1.12;margin-top:10px;color:var(--brown)">Что завести до уроков: 5 регистраций</h1></div>
  ${result("у вас есть всё, что нужно агентам. Монтажу хватает первого пункта, а для голоса нейросетью нужен ещё аккаунт ElevenLabs. Остальные 4 нужны для ассистента в директе (урок 2.2).", "Результат")}
  <div class="svh"><span></span><span>Сервис</span><span>Зачем</span><span>Где</span><span>Что важно</span></div>
  <div class="svl">
    ${svc(1, lgName("claude", "Claude Desktop"), "приложение, в котором работают все 3 чата", '<a href="https://claude.com/download">claude.com/download</a>', "нужна платная подписка Pro или Max: на бесплатном тарифе вкладка Code не открывается")}
    ${svc(2, lgName("zernio", "Zernio"), "один вход для Instagram, WhatsApp и Telegram", '<a href="https://zernio.com">zernio.com</a>', "Instagram должен быть «Бизнес» или «Автор». Ключ: раздел API keys (ключи доступа), права read-write (чтение и запись). 2 канала бесплатно и без карты. Для третьего канала нужна карта в Zernio: 6 долларов в месяц.")}
    ${svc(3, lgName("openai", "OpenAI"), "ассистент отвечает людям с помощью модели OpenAI", '<a href="https://platform.openai.com">platform.openai.com</a>', "пополнение от 5 долларов. При оплате выключите автопополнение (auto-reload) и поставьте месячный лимит, для начала 10 долларов.")}
    ${svc(4, lgName("telegram", "Бот Telegram"), "сюда приходят заявки", '<a href="https://t.me/BotFather">@BotFather</a><span>команда /newbot</span>', "username (адрес латиницей, в конце bot) потом не поменять. Откройте своего бота и нажмите Start, иначе заявки не придут.")}
    ${svc(5, txName("S", "Сервер"), "ассистент работает круглые сутки", '<a href="https://hoster.kz">Hoster.kz</a>: оплата через Kaspi. <a href="https://timeweb.cloud">Timeweb Cloud</a>: карта казахстанского банка. <a href="https://beget.com">Beget</a>: для России.', "Пока только зарегистрируйтесь и пополните баланс. Сервер создадите в уроке 2.2 вместе с агентом. Ubuntu 24.04 (если её нет, 22.04), 2 ядра, 2 ГБ памяти.")}
  </div>
  <div class="dfn"><span><b>Страна.</b> Claude и OpenAI работают в Казахстане, в России официально недоступны. Для ассистента из России агент предложит OpenRouter вместо OpenAI (ключ файлом <span class="fnm">openrouter-key.txt</span>). Голосовые сообщения в этом случае ассистент не распознаёт. Вы в России? Напишите в группу потока до первого урока.</span></div>`,
};
const keyCard = (n, pic, tx) => `<div class="kc"><div class="pic nb"><img class="glow" src="../img/glow-gold.png" alt="">${pic}</div><div class="hd2"><span class="no">${n}</span></div><div class="tx">${tx}</div></div>`;
const keyArrow = `<div class="rb-a" style="width:30px">${ARROW_G}</div>`;
const reg2 = { cls: "ls", html: `<div><div class="kicker">Раздатки к урокам · Vibe Production</div><h1 class="u" style="font-size:34px;line-height:1.12;margin-top:10px;color:var(--brown)">Как передать ключ агенту</h1></div>
  <div class="keys">
    ${keyCard(1, `<svg width="150" height="100" viewBox="0 0 150 100"><rect x="18" y="4" width="114" height="92" rx="10" fill="${CREAM}"/><rect x="18" y="4" width="114" height="18" rx="10" fill="${GOLD}"/><rect x="18" y="14" width="114" height="8" fill="${GOLD}"/><circle cx="32" cy="13" r="3" fill="${BROWN}"/><circle cx="43" cy="13" r="3" fill="${BROWN}"/><path d="M30 38h66M30 52h50M30 66h58" stroke="#B9A88F" stroke-width="5" stroke-linecap="round"/><g transform="translate(88 58) scale(1.6)"><circle cx="8" cy="12" r="4.5" fill="${BROWN}"/><path d="M11.5 12H22M18 12v4M21.5 12v3" stroke="${BROWN}" stroke-width="2.6" stroke-linecap="round"/></g></svg>`, "Скопируйте ключ в сервисе и сохраните в Блокноте (на Mac: TextEdit) в папку Загрузки. Имена файлов: <span class=\"fnm\">zernio-key.txt</span>, <span class=\"fnm\">openai-key.txt</span>, <span class=\"fnm\">telegram-bot-key.txt</span>.")}
    ${keyArrow}
    ${keyCard(2, `<div style="display:flex;flex-direction:column;align-items:center;gap:8px">${G("folder", { s: 54, c: GOLD, w: 1.8 })}<span class="fn">Загрузки\\zernio-key.txt</span></div>`, "Напишите агенту: «Ключ лежит в файле <span class=\"nw\">Загрузки\\zernio-key.txt</span>». Сам ключ не пишите.")}
    ${keyArrow}
    ${keyCard(3, `<div class="bub">Ключ лежит в файле Загрузки\\zernio-key.txt</div>`, "Агент перенесёт ключ на сервер и удалит файл.")}
    ${keyArrow}
    ${keyCard(4, `<div style="display:flex;flex-direction:column;align-items:center;gap:6px">${G("trash", { s: 56, c: GOLD, w: 1.8 })}</div>`, "Проверьте, что файла в Загрузках больше нет.")}
  </div>
  <div class="rl" style="background:#fff">${H("Ключ засветился?", G("warn", { c: INK, w: 2.6 }))}<div class="big">Ключ попал в чат или на скриншот? Удалите его в сервисе и создайте новый. Это занимает минуту.</div></div>
  <div class="dfn" style="margin-top:2px"><span><b>Можно не по инструкции:</b> войдите в аккаунт сервиса во встроенном браузере Claude (браузер внутри приложения), дальше агент пройдёт шаги сам. Пароль и оплату вы всё равно вводите сами.</span></div>` };

/* ====================== уроки ====================== */
const LESSONS = [];

/* ---------- 1.1 (3 страницы) ---------- */
const REPO = "https://github.com/saint4ai/reels-montage-remotion-course";
// фраза для агента: ссылка отдельной строкой целиком, без переноса (как в START-HERE.md курса)
const PHRASE_11 = `Вот репозиторий: <a class="url" href="${REPO}">${REPO}</a> Склонируй его в эту папку и начни: ты Монтажёр. Прочитай README.md и CLAUDE.md.`;
// та же ссылка в шпаргалке: узкая карточка, перенос только после «/»
const PHRASE_11_CHEAT = `Вот репозиторий: <a class="url2" href="${REPO}">https://<wbr>github.com/<wbr>saint4ai/<wbr><span class="nw">reels-montage-remotion-course</span></a> Склонируй его в эту папку и начни: ты Монтажёр. Прочитай README.md и CLAUDE.md.`;
const QR_REPO = `<div class="qr"><div class="sq"><img src="../img/qr-repo.svg" alt=""></div><span>QR-код ссылки</span></div>`;
// картинка к шагу 3: настоящие фрагменты окна Claude Desktop (верхняя панель и строка под полем ввода) с тремя выносками
const tabPic = () => `<div class="tabp">${H("К шагу 3: где нажать в Claude Desktop", G("monitor", { c: NIGHT, w: 2.4 }))}
  <div class="tb"><div class="shot"><img src="../img/claude-code-tab.png" alt="">
    <i class="hl" style="left:25.1%;top:4%;width:5.4%;height:17%"></i><i class="hl" style="left:.8%;top:58.5%;width:8.9%;height:14.6%"></i><i class="hl" style="left:9.9%;top:58.5%;width:13.8%;height:14.6%"></i>
    <b class="co" style="left:33.4%;top:13%">1</b><b class="co" style="left:5.2%;top:50%">2</b><b class="co" style="left:16.8%;top:50%">3</b></div>
  <div class="leg">
    <div class="li"><span class="no">1</span><div><b>Code</b><span>работа с файлами, значок &lt;/&gt;</span></div></div>
    <div class="li"><span class="no">2</span><div><b>Local</b><span>на этом компьютере</span></div></div>
    <div class="li"><span class="no">3</span><div><b>Папка</b><span>выберите свою, например «Мой контент-завод»</span></div></div></div></div></div>`;
LESSONS.push({
  id: "1.1", slug: "1-1-rabochee-mesto", pdf: "1-1-rabochee-mesto.pdf", n: 1, mod: 1, title: "Рабочее место", chats: ["mont"],
  result: "Claude Desktop стоит, система монтажа в вашей папке, агент знает о вас главное.",
  scheme: () => rb([
    { logo: "claude", t: "Claude Desktop" },
    { glyph: "folder", t: "пустая папка" },
    { glyph: "link", t: "ссылка" },
    { img: "lg-i-robot", t: "агент ставит и проверяет", hl: false },
    { glyph: "bubble", t: "5 вопросов" },
    { imgs: ["lg-i-hook", "lg-i-botchat"], t: "ещё 2 чата" },
  ]),
  you: [
    "Установите Claude Desktop и войдите. Оформите подписку Pro или Max.",
    "Создайте пустую папку, например «Мой контент-завод».",
    "Вверху откройте вкладку Code (работа с файлами), выберите Local (на этом компьютере) и укажите свою папку.",
    "Отправьте агенту готовую фразу из чёрного блока «Фраза для агента».",
    "Разрешайте действия агента, когда он спрашивает. В терминал ничего не вводите.",
    "Ответьте на 5 вопросов одним сообщением.",
    "Пришлите 2–5 рилсов, монтаж которых нравится, и одной фразой, что цепляет. Подробный разбор будет в уроке 1.3.",
    "Нажмите карточки «Скриптолог» и «Instagram-автоматизатор». Если карточек нет: создайте новый чат, выберите ту же папку (где лежит CLAUDE.md), снимите галочку worktree и первым сообщением вставьте текст из файла <span class=\"fnm\">team/prompts/scriptolog.md</span>. Для второго чата файл <span class=\"fnm\">team/prompts/automator.md</span>.",
  ],
  agent: [
    "скачивает систему в вашу папку и ставит всё нужное;",
    "проверяет компьютер и чинит, что не так;",
    "показывает схему трёх чатов;",
    "сохраняет ваши ответы в анкету (файл в вашей папке, где агент хранит сведения о вас): её читают все 3 чата и больше не переспрашивают.",
  ],
  rule: ["Агент работает руками за вас, вы только разрешаете.", "копируете команды из инструкции в терминал.", "нажимаете «разрешить», агент выполняет команды сам."],
  errors: [
    ["Открыли папку, где уже лежат другие файлы", "создайте пустую папку только под контент-завод."],
    ["Вкладка Code просит «upgrade»", "оформите подписку Pro или Max."],
    ["Чат не видит сценарий", "проверьте, что папка та же и галочка worktree снята."],
  ],
  done: "агент написал, что проверка компьютера пройдена, пересказал ваши ответы и принял примеры роликов. В боковой панели 3 чата в одной папке, и каждый новый чат назвал свою роль.",
  phrase: PHRASE_11,
  extraB: () => `<div><div class="hd" style="margin-bottom:5px"><span>5 вопросов, к которым стоит подготовиться</span></div><div class="qs">
    ${["Чем вы занимаетесь и кому продаёте?", "Зачем вам рилсы: заявки, продажи, личный бренд, клиенты на SMM?", "Вы в кадре или без лица? Есть готовая запись?", "Какой монтаж нравится?", "Куда сейчас приходят клиенты: директ Instagram, WhatsApp, Telegram?"].map((q, i) => `<div class="q"><span class="no">${i + 1}</span><span class="tx">${q}</span></div>`).join("")}</div></div>`,
});

/* ---------- 1.2 (3 страницы) ---------- */
const funnel = () => `<div class="fun">
  <div class="fb f1">ники экспертов</div><div class="rb-a">${ARROW_G}</div>
  <div class="fb f2">их залетевшие рилсы</div><div class="rb-a">${ARROW_G}</div>
  <div class="fb f3">идеи с просмотрами</div><div class="rb-a">${ARROW_G}</div>
  <div class="fb f4">ваш текст</div><div class="rb-a">${ARROW_G}</div>
  <div class="fb f5">${G("doc", { s: 22, c: GOLD, w: 2.2 })}&nbsp;файл SCRIPT.md</div></div>`;
LESSONS.push({
  id: "1.2", slug: "1-2-scenarij", pdf: "1-2-scenarij.pdf", n: 2, mod: 1, title: "Сценарий и 3 секунды", chats: ["scr"],
  result: "Готовый текст рилса на 45–50 секунд: в первой фразе видимый результат или цифра, в конце кодовое слово.",
  scheme: () => `<div class="gr2" style="gap:12px;grid-template-columns:1.1fr 1fr">
    <div class="you" style="background:var(--cd);display:flex;flex-direction:column;justify-content:center">${H("Почему 3 секунды", G("clock", { c: NIGHT, w: 2.6 }))}<div style="font-size:19px;line-height:1.4;font-weight:700">Судьбу рилса решают первые 3 секунды. Вот что это значит для рилсов Александра:</div><div class="cap" style="margin-top:8px">Источник: видеоурок эфира «Вайб-продакшен», статистика рилсов Александра.</div></div>
    <div class="bars nb"><img class="glow" src="../img/glow-gold.png" alt="">
      <div class="lbl">Пролистывают меньше 40%</div><div class="bar b1">около 25 тысяч просмотров</div>
      <div class="lbl" style="margin-top:10px">Пролистывают больше половины</div><div class="row2"><div class="bar b2"></div><span class="v2">около 3 тысяч</span></div></div></div>
    ${funnel()}`,
  you: [
    "Откройте чат «Скриптолог».",
    "Пришлите ники 3–5 экспертов, на которых вы подписаны. Если агент попросит войти в Instagram во встроенном браузере, войдите сами: пароль агент не вводит.",
    "Выберите идею из предложенных: у каждой агент покажет просмотры.",
    "Прочитайте текст вслух. Правки пишите словами: «короче», «проще», «добавь пример про клиентов».",
    "Напишите «ок», когда текст нравится.",
  ],
  agent: [
    "собирает залетевшие рилсы из открытых профилей;",
    "берёт идею, а текст пишет свой: чужое видео не копирует, так ролик ваш и аккаунт в безопасности;",
    "проверяет цифры и названия по первоисточнику;",
    "кладёт в SCRIPT.md текст для суфлёра, кодовое слово и материал для директа.",
  ],
  rule: ["Первым идёт результат, который увидит зритель.", "«Сегодня расскажу про полезные функции Claude».", "«Замени в ссылке GitHub одно слово, и весь проект нарисуется схемой»."],
  errors: [
    ["Просите «напиши сценарий про ИИ»", "дайте ники экспертов: агент возьмёт идеи, которые уже набрали просмотры."],
    ["Начинаете с приветствия или названия продукта", "начните с результата."],
    ["Правите текст сами в файле", "пишите правки в чат, так агент запомнит ваш стиль."],
  ],
  done: "Скриптолог прислал в чат название ролика, текст одним блоком для суфлёра, кодовое слово и материал для директа, а вы написали «ок».",
  phrase: "Вот ники экспертов: [ник 1] [ник 2] [ник 3]. Найди их залетевшие рилсы и предложи 5 идей под мою нишу.",
});

/* ---------- 1.3 ---------- */
const frame9 = (inner) => `<svg class="ph9" width="62" height="100" viewBox="0 0 62 100"><rect x="1.5" y="1.5" width="59" height="97" rx="9" fill="${NIGHT}" stroke="${GOLD2}" stroke-width="2.5"/>${inner}</svg>`;
// с лицом: человек в кадре, вокруг него графика
const f1 = frame9(`<rect x="10" y="10" width="42" height="9" rx="4" fill="${CREAM}" opacity=".85"/><circle cx="31" cy="50" r="13" fill="${GOLD}"/><path d="M8 98 C 8 74, 18 66, 31 66 C 44 66, 54 74, 54 98z" fill="${GOLD}"/><rect x="10" y="26" width="18" height="6" rx="3" fill="${CREAM}" opacity=".5"/>`);
// голова-рассказчик: крупное анимированное лицо и подпись под ним
const f2 = frame9(`<rect x="10" y="10" width="42" height="9" rx="4" fill="${CREAM}" opacity=".85"/><circle cx="31" cy="51" r="21" fill="${GOLD}"/><circle cx="23.5" cy="47" r="3" fill="${NIGHT}"/><circle cx="38.5" cy="47" r="3" fill="${NIGHT}"/><path d="M22 58q9 9 18 0" stroke="${NIGHT}" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M26 28q5-6 10 0" stroke="${GOLD2}" stroke-width="2.6" fill="none" stroke-linecap="round"/><rect x="10" y="80" width="42" height="5" rx="2.5" fill="${CREAM}" opacity=".85"/><rect x="10" y="89" width="26" height="4" rx="2" fill="${CREAM}" opacity=".5"/>`);
// только графика: надписи и фигуры, лица нет
const f3 = frame9(`<rect x="10" y="10" width="42" height="9" rx="4" fill="${CREAM}" opacity=".85"/><path d="M13 62v-16M25 62V34M37 62v-12" stroke="${GOLD}" stroke-width="8" stroke-linecap="round"/><circle cx="48" cy="46" r="5.5" fill="${BROWN}"/><path d="M10 74h12l-6 10z" fill="${GOLD2}"/><rect x="28" y="75" width="24" height="5" rx="2.5" fill="${CREAM}" opacity=".85"/><rect x="28" y="83" width="16" height="4" rx="2" fill="${CREAM}" opacity=".5"/><rect x="10" y="92" width="42" height="3" rx="1.5" fill="${GOLD}" opacity=".7"/>`);
const styleCard = (cls, name, line) => `<div class="sc3 ${cls}"><b>${name}</b><span>${line}</span></div>`;
LESSONS.push({
  id: "1.3", slug: "1-3-vybor-stilya", pdf: "1-3-vybor-stilya.pdf", n: 3, mod: 1, title: "Выбор стиля", chats: ["mont"],
  result: "Агент знает формат и стиль вашего монтажа и применяет их к каждому ролику.",
  scheme: () => `${rb([
    { img: "lg-i-cards", t: "2–5 рилсов-референсов" },
    { img: "lg-i-magnifier", t: "разбор", s: "хук, формат, стиль, темп" },
    { img: "lg-s50-plan", t: "совет из библиотеки стилей" },
    { glyph: "check", t: "ваш выбор" },
    { glyph: "user", t: "анкета" },
  ])}
  <div class="dfn"><span><b>Референс</b> это чужой ролик, монтаж которого вам нравится и на который агент равняется.</span></div>
  <div><div class="hd" style="margin-bottom:6px"><span>Формат: где вы в кадре</span></div><div class="fm">
    <div class="fc">${f1}<div><b>С лицом</b><span>видео на телефон, графика вокруг вас.</span></div></div>
    <div class="fc">${f2}<div><b>Голова-рассказчик</b><span>анимированная голова вместо лица, на экране графика и подписи.</span></div></div>
    <div class="fc">${f3}<div><b>Только графика</b><span>анимированные надписи и картинки, за кадром ваш голос.</span></div></div></div></div>`,
  you: [
    "Посмотрите разбор рилсов, которые прислали в уроке 1.1. Хотите, добавьте ещё 1–3.",
    "Напишите, что именно цепляет: шрифт, переходы, темп.",
    "Выберите формат и стиль из предложенных.",
  ],
  agent: [
    "разбирает каждый референс: хук, где человек в кадре, сколько места у графики, стиль, темп;",
    "советует ближайшие стили из библиотеки;",
    "записывает ваш выбор в анкету.",
  ],
  rule: ["Назовите, что именно нравится, а не просто «нравится».", "«Мне нравятся эти ролики».", "«Нравится, как цифры вылетают из-за спины и как быстро меняются кадры»."],
  errors: [
    ["Хотите снимать без лица, а присылаете ролики с лицом", "берите референсы того формата, в котором будете снимать."],
    ["Меняете стиль в каждом ролике", "держите один стиль на серию, зритель узнаёт вас по нему."],
    ["Присылаете 15 референсов", "хватит 2–5, иначе стиль размывается."],
  ],
  done: "агент назвал ваш формат и стиль и записал их в анкету.",
  phrase: "Вот 3 рилса, монтаж которых мне нравится: [ссылка 1] [ссылка 2] [ссылка 3]. Цепляет: [что именно]. Разбери и предложи мне стиль.",
  extraB: () => `<div class="gr2" style="gap:16px;align-items:start;grid-template-columns:.9fr 1.6fr">
    <div><div class="hd" style="margin-bottom:6px"><span>Голос: два варианта</span></div><div class="vc col">
      <div class="v1"><span class="gi">${G("mic", { c: NIGHT, w: 2.4 })}</span><span>Запишите голосовое на телефон</span></div><span class="or">или</span>
      <div class="v1"><span class="gi">${G("wave", { c: NIGHT, w: 2.4 })}</span><span>отдайте текст нейросети ElevenLabs: подписка от 6 долларов в месяц, в библиотеке больше 10 тысяч готовых голосов.</span></div></div></div>
    <div><div class="hd" style="margin-bottom:4px"><span>С чего начать</span></div><div class="cap" style="margin:0 0 7px;font-size:15px;line-height:1.3;color:#4A3C32;font-weight:600">Новичку агент первым советует 3 стиля, которые у Александра набирают больше всего просмотров:</div><div class="stl3">
      ${styleCard("a", "ЭСТАФЕТА", "один предмет проходит через весь ролик, цвет за сервисом. Для трюков и списков инструментов.")}
      ${styleCard("b", "ЭКСПЕРТ", "вы внизу, сверху доска со снимками сервиса. Самый простой в сборке.")}
      ${styleCard("c", "ЛИНЗА", "белый холст и стеклянные капсулы на каждое слово. Для рассказа о продукте с цифрами.")}</div></div></div>`,
});

/* ---------- 1.4 ---------- */
const sheetFr = (n, hot) => `<div class="fr${hot ? " hot" : ""}"><i>К00${n}</i><em></em><em></em></div>`;
LESSONS.push({
  id: "1.4", slug: "1-4-sborka-rolika", pdf: "1-4-sborka-rolika.pdf", n: 4, mod: 1, title: "Сборка ролика", chats: ["mont"],
  result: "Готовый рилс 2K с графикой, субтитрами и звуком. К нему подпись для публикации.",
  scheme: () => `${rb([
    { img: "lg-i-camera", t: "запись" },
    { glyph: "doc", t: "расшифровка по словам" },
    { img: "lg-s50-plan", t: "карта монтажа" },
    { img: "lg-i-cards", t: "лист кадров К001…" },
    { glyph: "playf", t: "черновик 720p" },
    { img: "lg-i-rocket", t: "финал 2K", hl: true },
  ])}
  <div class="dfn"><span><b>Карта монтажа</b> это план, что на экране в каждую секунду: где графика, где переход, какой звук. <b>Лист кадров</b> это картинки ролика через каждые 2 секунды, у каждой свой номер. <b>Черновик</b> это ролик в низком качестве (720p), чтобы быстро посмотреть. <b>Финал</b> это ролик в высоком качестве (2K).</span></div>`,
  aSide: () => `<div class="sheet">${H("Лист кадров", null).replace('class="hd"', 'class="hd" style="color:var(--gold);margin-bottom:8px"')}<div class="grid">${[1, 2, 3, 4, 5, 6].map((n) => sheetFr(n, n === 6)).join("")}</div><div class="call">${G("bubble", { c: BROWN, w: 2.4 })}<span>К006: вместо иконки настоящий скриншот</span></div></div>`,
  you: [
    "Запишите видео на телефон или голос по тексту от Скриптолога. Голос нейросетью: на сайте ElevenLabs вставьте текст, выберите голос и скачайте MP3.",
    "Перекиньте запись с телефона на компьютер (Telegram «Избранное», кабель или AirDrop) и напишите Монтажёру фразу из чёрного блока. Агент сам положит файл в папку ролика.",
    "Посмотрите лист кадров.",
    "Правки пишите по номерам: «К006: вместо иконки настоящий скриншот».",
    "Посмотрите черновик 720p и напишите «ок».",
  ],
  agent: [
    "расшифровывает запись по словам;",
    "строит карту монтажа и собирает ролик;",
    "проверяет, что текст не вылезает за рамки;",
    "собирает финал 2K, громкость как у роликов в ленте Instagram;",
    "пишет PUBLISH.md: подпись, кодовое слово, текст для директа.",
  ],
  rule: ["Правка = номер кадра + что сделать.", "«Что-то не так в середине, сделай красивее».", "«К012: уменьши заголовок, он закрывает лицо»."],
  errors: [
    ["Записываете «как пойдёт», без текста", "читайте по суфлёру: текст уже проверен на хук и длину."],
    ["Сразу просите финал", "сначала черновик 720p: он собирается быстрее, править дешевле."],
    ["Записываете с шумом или музыкой", "пишите в тихой комнате: агент монтирует по словам расшифровки."],
  ],
  done: "Монтажёр прислал финальный ролик, вы посмотрели его до конца на телефоне, подпись к публикации готова.",
  phrase: "Скриптолог закончил: смотри work/[ролик]/SCRIPT.md. Запись в Загрузках, файл [имя файла]. Собери черновик.",
});

/* ---------- 1.5 ---------- */
LESSONS.push({
  id: "1.5", slug: "1-5-seriya-rolikov", pdf: "1-5-seriya-rolikov.pdf", n: 5, mod: 1, title: "Серия роликов", chats: ["mont", "и", "ig"],
  result: "Ролик выходит каждый день, 30 в месяц, и каждый следующий учитывает статистику прошлых.",
  scheme: () => `${rb([
    { img: "lg-i-calendar", t: "план на 30 дней" },
    { img: "lg-i-camera", t: "запись 2–3 текстов подряд" },
    { img: "lg-i-clapper", t: "монтаж серии" },
    { img: "lg-i-rocket", t: "пробный рилс", hl: true },
    { img: "lg-s43-leaving", t: "подписчики" },
    { img: "lg-i-hourglass", t: "отчёт через 24 часа, 72 часа и 7 дней" },
  ])}
  <div class="dfn"><span><b>Пробный рилс</b> Instagram сначала показывает тем, кто на вас не подписан. Если за первые 72 часа он хорошо набирает просмотры, его можно показать подписчикам. Так вы проверяете ролик на новых людях, а неудачные ролики почти не видят подписчики.</span></div>`,
  important: "Кодовые слова и выкладка через Zernio заработают после урока 2.2. До этого просите Скриптолога концовку без кодового слова и выкладывайте ролики сами в приложении Instagram.",
  aSide: () => `<div class="cal wide"><div class="ch">${IMG("lg-i-calendar")}<span>30 роликов в месяц</span></div><div class="cg">${Array.from({ length: 30 }, (_, i) => `<span${i < 3 ? ' class="g"' : ""}>${i + 1}</span>`).join("")}</div><div class="cc">закрашены ролики первого захода: 2–3 за раз</div></div>`,
  you: [
    "Утвердите план: идея на каждый день месяца.",
    "Начните с 2–3 роликов за заход. К уроку 2.5 вы будете записывать всю неделю за раз.",
    "Перед выкладкой проверьте подпись и кодовое слово.",
    "Напишите «выкладывай»: без этого слова агент не публикует.",
    "Через 24 часа, 72 часа и 7 дней смотрите статистику ролика в Instagram. После урока 2.2 её пришлёт Instagram-автоматизатор по запросу «Статистика ролика [название]».",
  ],
  agent: [
    "добавляет кодовое слово ролика в ассистента;",
    "после урока 2.2 выкладывает через Zernio сначала пробным рилсом. Ролик, который зашёл, вы переносите к подписчикам в приложении Instagram, агент подскажет какой;",
    "смотрит статистику и переносит вывод в следующий ролик.",
  ],
  rule: ["Сначала кодовое слово в ассистенте, потом публикация.", "ролик вышел, люди пишут слово и не получают ответа.", "слово добавлено, ассистент отвечает с первой минуты."],
  errors: [
    ["Судите ролик через час", "смотрите через 24 часа, 72 часа и 7 дней."],
    ["Выкладываете раз в неделю", "цель 30 в месяц: у Александра из первых 14 роликов залетел 1."],
    ["Пишете каждый ролик про новое", "держитесь 3–4 тем, в которых вы эксперт."],
  ],
  done: "в плане 30 идей, первые 2–3 ролика вышли. После урока 2.2 у каждого нового ролика работает кодовое слово.",
  phrase: "Составь план на 30 роликов по моей анкете и примерам роликов.",
  extraB: () => `<div class="pr1">${IMG("lg-s43-leaving")}<div><div class="hd" style="margin-bottom:3px"><span>Из практики Александра</span></div><div class="tx">Из первых 14 роликов залетел один. Поэтому важен объём: 30 роликов в месяц. Залетевший ролик Александр перезаливает в пробные по 3–4 раза, и он снова собирает новую аудиторию.</div></div></div>`,
});

/* ---------- 2.1 ---------- */
LESSONS.push({
  id: "2.1", slug: "2-1-vajbkoding", pdf: "2-1-vajbkoding.pdf", n: 6, mod: 2, title: "Вайбкодинг в личных делах", chats: [{ img: "lg-i-laptopfilm", name: "новый чат в отдельной папке «Личные дела», не в папке контент-завода", wide: true, w: 280 }],
  result: "Вы ставите агенту задачу словами и получаете готовый результат: таблицу, расчёт, документ, страницу.",
  scheme: () => `<div class="dfn"><span><b>Вайбкодинг</b> это работа, при которой вы объясняете задачу словами, а ИИ-агент делает её сам. Программировать не нужно.</span></div>
  <div><div class="hd" style="margin-bottom:8px"><span>Формула задачи</span></div><div class="flow3 five">
    <div class="bk a1"><div class="k">1</div><div class="v">что сделать</div></div><div class="ar">${ARROW_G}</div>
    <div class="bk a2"><div class="k">2</div><div class="v">для чего</div></div><div class="ar">${ARROW_G}</div>
    <div class="bk a3"><div class="k">3</div><div class="v">из чего<small>файлы, ссылки</small></div></div><div class="ar">${ARROW_G}</div>
    <div class="bk a4"><div class="k">4</div><div class="v">как выглядит готовый результат</div></div><div class="ar">${ARROW_G}</div>
    <div class="bk a5"><div class="k">5</div><div class="v">что нельзя трогать</div></div></div></div>`,
  you: [
    "Создайте папку «Личные дела» и откройте в ней новый чат.",
    "Опишите задачу по формуле.",
    "Попросите сначала план, потом выполнение.",
    "Проверьте результат и дайте правку одним сообщением.",
    "Задача повторяется? Попросите агента записать её в правила проекта, чтобы он не переспрашивал.",
  ],
  agent: ["предлагает план и спрашивает, если чего-то не хватает;", "делает работу и показывает результат;", "запоминает договорённости в правилах проекта."],
  rule: ["Задача агенту = задача толковому сотруднику.", "«Сделай отчёт».", "«Возьми файл продажи.xlsx в Загрузках, посчитай выручку по месяцам, сделай таблицу и график и сохрани как отчёт.xlsx рядом. Исходный файл не меняй.»"],
  errors: [
    ["Пишете задачу одним словом", "пишите по формуле: что, для чего, из чего, какой результат, что не трогать."],
    ["Просите всё сразу", "одна задача, один результат, потом следующая."],
    ["Не проверяете результат", "откройте файл сами, прежде чем им пользоваться."],
  ],
  done: "вы сделали одну свою задачу целиком и агент записал правило, как делать её в следующий раз.",
  phrase: "Сначала составь план, ничего не делай. Задача: [ваша задача по формуле].",
  extraB: () => `<div><div class="hd" style="margin-bottom:6px"><span>С чего начать</span></div><div class="eg h">
    <div class="ec"><span class="gi">${G("folder", { c: NIGHT, w: 2.4 })}</span><span class="tx">разобрать папку Загрузки по типам файлов</span></div>
    <div class="ec"><span class="gi">${G("calc", { c: NIGHT, w: 2.4 })}</span><span class="tx">посчитать расходы из банковской выписки</span></div>
    <div class="ec"><span class="gi">${G("table", { c: NIGHT, w: 2.4 })}</span><span class="tx">собрать таблицу клиентов</span></div>
    <div class="ec"><span class="gi">${G("page", { c: NIGHT, w: 2.4 })}</span><span class="tx">сделать страницу-визитку</span></div></div></div>`,
});

/* ---------- 2.2 ---------- */
LESSONS.push({
  id: "2.2", slug: "2-2-ii-menedzher", pdf: "2-2-ii-menedzher.pdf", n: 7, mod: 2, title: "ИИ-менеджер в WhatsApp и Instagram", chats: ["ig"],
  result: "Ассистент (ИИ-менеджер) отвечает под комментариями и в директе, присылает материал по кодовому слову и передаёт заявки в ваш Telegram.",
  scheme: () => rb([
    { glyph: "bubble", t: "комментарий с кодовым словом" },
    { glyph: "chat2", t: "ответ под комментарием" },
    { img: "lg-i-botchat", t: "материал в директ" },
    { img: "lg-i-phones", t: "ответы на вопросы" },
    { logo: "telegram", t: "заявка в Telegram", s: "кто, что нужно, ссылка на диалог", hl: true },
  ]),
  you: [
    "Пройдите 4 регистрации со страницы «Что завести до уроков» (стр. 6): Zernio, OpenAI, бот Telegram, сервер.",
    "В Zernio откройте Connections, выберите Instagram, войдите и разрешите доступ к сообщениям и комментариям.",
    "Сервер создайте вместе с агентом: попросите его создать ключ входа (SSH). Его публичную часть (строка ssh-ed25519…) вставьте в панели провайдера при создании сервера, приватный ключ никуда не отправляйте. Агенту напишите IP-адрес сервера. Если в панели провайдера нет поля для ключа (например, у Hoster.kz), напишите агенту, он подскажет, как быть.",
    "Ключи сохраняйте файлом в Загрузках (как на стр. 7), агенту пишите только путь к файлу.",
    "Ответьте на вопросы о бизнесе: что можно называть, какие ссылки давать, как записаться, каким тоном говорить, куда слать заявки.",
    "Прочитайте ответы ассистента на 10 типичных вопросов и напишите «ок» или правки.",
  ],
  // шаги 7–9 (тестовый режим) идут сверху третьей страницы урока, чтобы первая не переполнилась
  you2: [
    `Сначала тестовый режим. Скажите агенту: «Включи тестовый режим для моего второго аккаунта <span class="fnm">[@ник]</span>». Агент сначала покажет, что ассистент ответил бы, ничего не отправляя, а потом включит ответы только вашему второму аккаунту. Остальным людям ассистент пока молчит.`,
    "Проверьте вживую: со второго аккаунта напишите комментарий с кодовым словом и вопрос в директ.",
    "Всё пришло как надо: скажите «Выключи тестовый режим, запускай для всех».",
  ],
  agent: ["заполняет базу знаний и инструкцию ассистента;", "ставит ассистента на ваш сервер;", "подключает Zernio и проверяет, что всё работает."],
  rule: ["Ассистент говорит только то, что вы ему разрешили.", "ассистент придумывает цены и сроки.", "в базе знаний записано, что называть можно, а что передать вам."],
  errors: [
    ["Личный аккаунт Instagram", "переключите на «Бизнес» или «Автор» в настройках Instagram."],
    ["Ключ вставили в чат", "удалите ключ в сервисе, создайте новый и передайте файлом."],
    ["Проверяете со своего же аккаунта", "пишите со второго аккаунта."],
    ["Ассистент молчит людям", "тестовый режим не выключен: скажите «Выключи тестовый режим»."],
  ],
  done: "комментарий со словом получил ответ, в директ пришёл материал, тестовая заявка пришла в Telegram, а тестовый режим выключен. WhatsApp и Telegram-канал подключаются так же, по желанию.",
  phrase: "Подключи ассистента для директа. Ключи лежат в Загрузках: zernio-key.txt, openai-key.txt, telegram-bot-key.txt. IP сервера: [адрес].",
  extraB: () => `<div><div class="hd" style="margin-bottom:6px"><span>Что важно знать</span></div><div class="plat">
    <div class="pt" style="flex:1.2"><span class="lgo">${LOGO("instagram")}</span><div><b>Instagram</b><span>аккаунт «Бизнес» или «Автор». В директе ответить можно в течение 24 часов после сообщения человека.</span></div></div>
    <div class="pt" style="flex:1.3"><span class="lgo">${LOGO("whatsapp")}</span><div><b>WhatsApp</b><span>Номер должен работать в приложении WhatsApp Business, обычный WhatsApp не подойдёт. Подключается через Meta (компания, которой принадлежат WhatsApp и Instagram).</span></div></div>
    <div class="pt"><span class="lgo">${LOGO("telegram")}</span><div><b>Telegram</b><span>подключается ваш канал или группа, где вы администратор. Заявки приходят в вашего бота.</span></div></div></div>
    <div class="stopn"><span class="gi">${G("slash", { c: NIGHT, w: 2.6 })}</span><span>Под каждой заявкой в Telegram две кнопки: «Включить ассистента» и «Выключить». Они действуют только на этот диалог. Выключить ассистента совсем попросите Instagram-автоматизатора. Если вы ответили человеку сами, ассистент в этом диалоге молчит час.</span></div></div>`,
});

/* ---------- 2.3 ---------- */
LESSONS.push({
  id: "2.3", slug: "2-3-avtomatizaciya", pdf: "2-3-avtomatizaciya.pdf", n: 8, mod: 2, title: "Автоматизация процессов",
  chats: [{ img: "lg-i-botchat", name: "Заявки из директа: Instagram-автоматизатор", w: 170 }, { img: "lg-i-box", name: "Другие задачи: новый чат в отдельной папке «Автоматизации», не в папке контент-завода", w: 250 }],
  result: "Повторяющаяся работа идёт сама: заявки падают в таблицу или CRM, отчёт приходит по расписанию.",
  scheme: () => `<div class="dfn"><span><b>CRM</b> это программа, где хранятся клиенты и сделки: кто написал, что хочет, на каком этапе.</span></div>
  <div><div class="hd" style="margin-bottom:8px"><span>Формула автоматизации</span></div><div class="flow3">
    <div class="bk a1"><div class="k">когда:</div><div class="v">пришла заявка в директ</div></div><div class="ar">${ARROW_G}</div>
    <div class="bk a2"><div class="k">что:</div><div class="v">агент записывает имя и вопрос</div></div><div class="ar">${ARROW_G}</div>
    <div class="bk a3"><div class="k">куда:</div><div class="v">в вашу Google Таблицу</div></div></div></div>
  <div><div class="hd" style="margin-bottom:6px"><span>Примеры</span></div><div class="eg h">
    <div class="ec"><span class="gi">${G("mail", { c: NIGHT, w: 2.4 })}</span><span class="tx">Пришла заявка из директа → строка в Google Таблице и сообщение вам в Telegram.</span></div>
    <div class="ec"><span class="gi">${G("clock", { c: NIGHT, w: 2.4 })}</span><span class="tx">Каждое утро в 9:00 по вашему времени → сводка заявок за вчера.</span></div>
    <div class="ec"><span class="gi">${G("chart", { c: NIGHT, w: 2.4 })}</span><span class="tx">Вышел новый ролик → через 24 часа отчёт по просмотрам.</span></div></div></div>`,
  you: [
    "Выпишите дела, которые делаете руками чаще раза в неделю.",
    "Выберите самое частое и опишите по формуле «когда → что → куда».",
    "Заявки в таблицу: раздатка «Заявки строкой в Google Таблице» (дополнение к уроку 2.3). Для других таблиц дайте доступ так, как скажет агент.",
    "Проверьте работу на тестовых данных.",
    "Включите и попросите сообщать вам в Telegram, если что-то сломалось.",
  ],
  agent: ["предлагает схему и что подключить;", "собирает автоматизацию и ставит её на сервер;", "присылает отчёт о первом запуске."],
  rule: ["Автоматизируйте самое частое, а не самое интересное.", "настроили отчёт, который нужен раз в квартал.", "автоматизировали заявки, которые приходят каждый день."],
  errors: [
    ["Не проверяете, сломалась ли автоматизация", "попросите агента писать вам в Telegram, если что-то сломалось."],
    ["Даёте пароль от аккаунта", "дайте только ключ доступа, файлом в Загрузках."],
    ["Не называете часовой пояс", "пишите «9:00 по Алматы»."],
  ],
  done: "тестовая заявка появилась строкой в таблице и сообщением в Telegram, агент прислал отчёт о первом запуске. Через неделю проверьте, что строки добавлялись без вас.",
  phrase: "Когда приходит заявка из директа, добавляй строку в мою Google Таблицу и пиши мне в Telegram. Сначала покажи план.",
});

/* ---------- 2.4 ---------- */
LESSONS.push({
  id: "2.4", slug: "2-4-dokumenty", pdf: "2-4-dokumenty.pdf", n: 9, mod: 2, title: "Документы и презентации", chats: [{ img: "lg-i-box", name: "отдельный чат в папке «Гайды и КП»", wide: true }],
  result: "Агент собирает презентацию, коммерческое предложение или гайд в PDF по вашим материалам и в вашем стиле.",
  scheme: () => `${rb([
    { img: "lg-i-box", t: "материалы в папке" },
    { glyph: "table", t: "план страниц" },
    { glyph: "check", t: "ваше «ок»" },
    { glyph: "page", t: "вёрстка" },
    { glyph: "doc", t: "PDF" },
    { glyph: "bubble", t: "правки по номерам страниц" },
    { img: "lg-i-cards", t: "шаблон на будущее", hl: true },
  ], "tight")}
  <div class="dfn"><span><b>Гайд</b> это короткое пособие в PDF. Его удобно отдавать за кодовое слово под рилсом.</span></div>
  <div><div class="hd" style="margin-bottom:6px"><span>Формула документа</span></div><div class="pf">
    <div class="p"><div class="k"><span class="no sm">1</span></div><div class="v">для кого</div></div><div class="ar">${ARROW_G}</div>
    <div class="p"><div class="k"><span class="no sm">2</span></div><div class="v">что человек сделает после прочтения</div></div><div class="ar">${ARROW_G}</div>
    <div class="p"><div class="k"><span class="no sm">3</span></div><div class="v">из чего собрать</div></div><div class="ar">${ARROW_G}</div>
    <div class="p n"><div class="k"><span class="no sm">4</span></div><div class="v">сколько страниц</div></div></div></div>`,
  you: [
    "Сложите в папку «Гайды и КП» материалы: тексты, цифры, фото, логотип.",
    "Опишите документ по формуле.",
    "Утвердите план страниц.",
    "Посмотрите PDF и дайте правки по номерам страниц.",
    "Попросите сохранить шаблон, чтобы следующий документ вышел в том же стиле.",
  ],
  agent: ["предлагает план страниц;", "верстает документ и собирает PDF;", "проверяет, что текст не вылезает и все ссылки работают."],
  rule: ["Сначала цель документа, потом дизайн.", "«Сделай красивую презентацию».", "«Презентация для владельцев салонов: после неё они записываются на консультацию. 10 слайдов, цифры из файла кейсы.xlsx»."],
  errors: [
    ["Цифры без источника", "дайте агенту первоисточник, он проверит факты."],
    ["Правка «везде поменяй»", "пишите номер страницы и что сделать."],
    ["Каждый документ с нуля", "сохраните шаблон."],
  ],
  done: "на первой странице ясно, для кого документ и что сделать после прочтения. PDF открывается на телефоне, ссылки кликаются, шаблон сохранён.",
  phrase: "Собери гайд в PDF для кодового слова. Для кого: [кто читатель]. После прочтения человек должен: [действие]. Материалы в папке «Гайды и КП».",
});

/* ---------- 2.5 ---------- */
const cycNode = (x, y, t, s, n, kind) => `<div class="nd2${kind ? " " + kind : ""}" style="left:${x}px;top:${y}px"><span class="no">${n}</span><b>${t}</b>${s ? `<i>${s}</i>` : ""}</div>`;
const cyc = () => {
  const W = 540, Hh = 470, cx = 270, cy = 235, rx = 196, ry = 176;
  const names = [
    ["идея", "Скриптолог", "k"], ["текст", "", ""], ["запись", "это делаете вы", "y"], ["монтаж", "Монтажёр", "k"],
    ["публикация и ассистент", "Instagram-автоматизатор", "k"], ["заявка", "", ""], ["статистика", "", ""],
  ];
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 7;
  const pts = names.map((_, i) => [cx + rx * Math.cos(ang(i)), cy + ry * Math.sin(ang(i))]);
  let arrows = "";
  for (let i = 0; i < 7; i++) {
    const th = ang(i + 0.5);
    const x = cx + rx * Math.cos(th), y = cy + ry * Math.sin(th);
    const deg = (Math.atan2(ry * Math.cos(th), -rx * Math.sin(th)) * 180) / Math.PI;
    arrows += `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${deg.toFixed(1)})" d="M-7 -8 L7 0 L-7 8" />`;
  }
  // «новая идея» стоит на стрелке от последнего шага (статистика) к первому (идея)
  const thB = ang(6.5);
  const bx = cx + rx * Math.cos(thB), by = cy + ry * Math.sin(thB);
  return `<div class="cyc" style="width:${W}px;height:${Hh}px"><svg width="${W}" height="${Hh}" viewBox="0 0 ${W} ${Hh}" fill="none" stroke="${GOLD2}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:0;top:0"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" stroke-dasharray="3 9"/>${arrows}</svg>
    <div class="mid" style="left:${cx}px;top:${cy}px">${IMG("lg-s49-factory", "", "width:190px;height:auto")}</div>
    ${names.map((n, i) => cycNode(pts[i][0].toFixed(0), pts[i][1].toFixed(0), n[0], n[1], i + 1, n[2])).join("")}
    <span class="al" style="left:${(bx - 56).toFixed(0)}px;top:${(by - 4).toFixed(0)}px">новая идея</span></div>`;
};
LESSONS.push({
  id: "2.5", slug: "2-5-kontent-zavod", pdf: "2-5-kontent-zavod.pdf", n: 10, mod: 2, title: "Контент-завод целиком", chats: ["mont", "scr", "ig"],
  result: "Три чата работают по кругу, и ролик выходит каждый день.",
  cycle: true,
  you: [
    "Раз в неделю утвердите 7 идей.",
    "Запишите тексты подряд за один заход.",
    "Дайте правки кадров по номерам.",
    "Напишите «выкладывай» по каждому ролику.",
    "Заявки из Telegram обрабатывайте сами или передайте менеджеру.",
  ],
  agents: ["Скриптолог предлагает идеи по статистике прошлой недели;", "Монтажёр собирает серию;", "Instagram-автоматизатор заводит кодовые слова, публикует и присылает отчёты по запросу."],
  rule: ["Каждый чат делает своё.", "два чата одновременно правят одни и те же файлы и мешают друг другу.", "Скриптолог пишет тексты, Монтажёр монтирует, Instagram-автоматизатор публикует и отвечает."],
  errors: [
    ["Перестали смотреть статистику", "переносите вывод из отчёта в следующий текст."],
    ["Ролик вышел без кодового слова", "сначала добавьте слово в ассистента, потом публикуйте."],
    ["Копите записи и не монтируете", "монтируйте в течение недели после записи."],
  ],
  done: "за неделю вышло 7 роликов, у каждого работает кодовое слово, заявки приходят в Telegram.",
  phrase: "Посмотри статистику прошлой недели и предложи, что повторить в новой серии.",
  phraseLabel: "Фраза для агента (Монтажёру)",
});

/* ====================== сборка страниц уроков ====================== */
function lessonPages(L) {
  const hdr = header(L);
  const resBlock = result(L.result);
  const imp = L.important ? `<div class="rl imp">${H("Важно", G("warn", { c: INK, w: 2.6 }))}<div class="big">${L.important}</div></div>` : "";
  let a;
  if (L.cycle) {
    a = `${hdr}${resBlock}<div class="bd"><div class="row" style="gap:26px;align-items:flex-start">${cyc()}<div class="grow" style="display:flex;flex-direction:column;gap:10px;min-width:0">${you(L.you)}${agent(L.agents, "Что делают агенты")}</div></div></div>`;
  } else if (L.id === "1.5") {
    // страница А: схема, определение, «Важно» и календарь на всю ширину; шаги на странице Б
    a = `${hdr}${resBlock}<div class="bd">${L.scheme()}${imp}${L.aSide()}</div>`;
  } else if (L.aSide) {
    a = `${hdr}${resBlock}<div class="bd">${L.scheme()}${imp}<div class="row" style="gap:16px;align-items:flex-start"><div style="flex:1.45;min-width:0">${you(L.you)}</div><div style="flex:1;min-width:0">${L.aSide()}</div></div></div>`;
  } else {
    a = `${hdr}${resBlock}<div class="bd">${L.scheme()}${you(L.you)}</div>`;
  }
  const pa = { cls: "cream ls", html: a };
  if (L.id === "1.1") {
    // три страницы: шаги; картинка к шагу 3, агент и 5 вопросов; правило, ошибки, готово и фраза со ссылкой и QR-кодом
    const p2 = { cls: "ls", html: `${slimHeader(L)}<div class="bd">${tabPic()}${agent(L.agent)}${L.extraB()}</div>` };
    const p3 = {
      cls: "cream ls",
      html: `${slimHeader(L)}<div class="bd">${rule(...L.rule)}${errors(L.errors)}${done(L.done)}${phrase(L.phrase, L.phraseLabel, { qr: QR_REPO })}</div>`,
    };
    return [pa, p2, p3];
  }
  if (L.id === "1.3" || L.id === "2.2") {
    // три страницы: схема и шаги; агент, правило и дополнительный блок; ошибки, готово и фраза
    const p2 = { cls: "ls", html: `${slimHeader(L)}<div class="bd"><div class="gr2 l">${agent(L.agent)}${rule(...L.rule)}</div>${L.extraB()}</div>` };
    const p3 = { cls: L.you2 ? "cream ls" : "cream ls roomy", html: `${slimHeader(L)}<div class="bd">${L.you2 ? you(L.you2, false, L.you.length + 1, "Что делаете вы, продолжение") : ""}${errors(L.errors)}<div class="gr2">${done(L.done)}${phrase(L.phrase, L.phraseLabel)}</div></div>` };
    return [pa, p2, p3];
  }
  if (L.id === "1.5") {
    // три страницы: схема и календарь; шаги, агент, правило и практика; ошибки, готово и фраза
    const p2 = { cls: "ls", html: `${slimHeader(L)}<div class="bd">${you(L.you)}<div class="gr2 l">${agent(L.agent)}${rule(...L.rule)}</div>${L.extraB()}</div>` };
    const p3 = { cls: "cream ls roomy", html: `${slimHeader(L)}<div class="bd">${errors(L.errors)}<div class="gr2">${done(L.done)}${phrase(L.phrase, L.phraseLabel)}</div></div>` };
    return [pa, p2, p3];
  }
  if (L.id === "1.2") {
    // три страницы: схема и шаги, инфографика (агент, 5 правил, хук), правило-ошибки-готово-фраза
    const p2 = {
      cls: "ls",
      html: `${slimHeader(L)}<div class="bd">
      ${agent(L.agent)}
      <div><div class="hd" style="margin-bottom:10px"><span>5 правил текста</span></div><div class="tl">
        <span class="tk" style="left:0">0–3 с</span><span class="tk" style="right:0">конец</span>
        <div class="rp k1"><span class="no">1</span><div class="tx">Хук: одна фраза, в ней видимый результат или цифра.</div></div>
        <div class="rp"><span class="no">2</span><div class="tx">Сразу решение, без вступления.</div></div>
        <div class="rp"><span class="no">3</span><div class="tx">Одно число-доказательство.</div></div>
        <div class="rp"><span class="no">4</span><div class="tx">Мысль, ради которой ролик перешлют знакомому.</div></div>
        <div class="rp k5"><span class="no">5</span><div class="tx">Кодовое слово в конце: зритель пишет его в комментариях и получает материал.</div></div></div></div>
      <div class="hook nb"><img class="glow" src="../img/glow-gold.png" alt=""><div class="q"><small>Пример хука из практики</small>«Если у твоего Claude нет ни одного коннектора, ты платишь 20 долларов в месяц за очень умный калькулятор.»</div>
        <div class="st"><div>${G("eye", { c: GOLD, w: 2.2 })}<span>Больше 121 тысячи просмотров на 09.10 и больше 1 300 комментариев с кодовым словом.</span></div>
        <div class="lk">${G("playf", { c: GOLD, w: 2.2 })}<span>Смотреть рилс: <a href="https://www.instagram.com/p/Dc8YwYCt_E_/"><span class="nw">instagram.com/p/Dc8YwYCt_E_</span></a></span></div></div></div></div>`,
    };
    const p3 = {
      cls: "cream ls",
      html: `${slimHeader(L)}<div class="bd">${rule(...L.rule)}${errors(L.errors)}<div class="gr2">${done(L.done)}${phrase(L.phrase, L.phraseLabel)}</div></div>`,
    };
    return [pa, p2, p3];
  }
  let ex = L.extraB ? L.extraB() : "";
  if (L.id === "2.5") {
    ex = `<div><div class="hd" style="margin-bottom:8px"><span>Неделя контент-завода</span></div><div class="wk">
      <div class="dy"><div class="h">Понедельник</div><div class="who">Скриптолог и вы</div><div class="w">7 идей и текстов на неделю</div></div>
      <div class="dy"><div class="h">Вторник</div><div class="who">вы</div><div class="w">запись всех текстов подряд за один заход</div></div>
      <div class="dy"><div class="h">Среда</div><div class="who">Монтажёр и вы</div><div class="w">серия роликов, правки по номерам кадров</div></div>
      <div class="dy e"><div class="h">Каждый день</div><div class="who">Instagram-автоматизатор</div><div class="w">один ролик, кодовое слово в ассистенте</div></div>
      <div class="dy e"><div class="h">Через 24 часа, 72 часа и 7 дней</div><div class="who">агент</div><div class="w">отчёт, вывод в следующий текст</div></div></div></div>`;
    const pb = {
      cls: "ls",
      html: `${slimHeader(L)}<div class="bd">${ex}${rule(...L.rule)}${errors(L.errors)}<div class="gr2">${done(L.done)}${phrase(L.phrase, L.phraseLabel)}</div></div>`,
    };
    return [pa, pb];
  }
  return [pa, pageB(L, ex)];
}

/* ---------- Шпаргалка (светлая, для печати) ---------- */
const sh = (id, who, txt, cls = "") => `<div class="c${cls ? " " + cls : ""}"><div class="top"><span class="no">${id}</span><span class="who">${who}</span></div><div class="tx">${PHV(txt)}</div></div>`;
const cheat = {
  cls: "cream ls",
  html: `<div class="chh"><div><div class="kicker">Шпаргалка</div><h1 class="u" style="font-size:34px;line-height:1.12;margin-top:10px;color:var(--brown)">10 фраз для агента</h1></div><div class="dfn"><span>Слова в <span class="pv">[скобках]</span> замените на свои.</span></div></div>
  <div class="sh10">
    <div class="c w2"><div class="top"><span class="no">1.1</span><span class="who">Монтажёр</span></div><div class="tx">${PHRASE_11_CHEAT}</div></div>
    ${sh("1.2", "Скриптолог", "Вот ники экспертов: [ник 1] [ник 2] [ник 3]. Найди их залетевшие рилсы и предложи 5 идей под мою нишу.")}
    ${sh("1.3", "Монтажёр", "Вот 3 рилса, монтаж которых мне нравится: [ссылка 1] [ссылка 2] [ссылка 3]. Цепляет: [что именно]. Разбери и предложи мне стиль.")}
    ${sh("1.4", "Монтажёр", "Скриптолог закончил: смотри work/[ролик]/SCRIPT.md. Запись в Загрузках, файл [имя файла]. Собери черновик.")}
    ${sh("1.5", "Монтажёр", "Составь план на 30 роликов по моей анкете и примерам роликов.")}
    ${sh("2.1", "«Личные дела»", "Сначала составь план, ничего не делай. Задача: [ваша задача по формуле].")}
    ${sh("2.2", "Instagram-автоматизатор", "Подключи ассистента для директа. Ключи лежат в Загрузках: zernio-key.txt, openai-key.txt, telegram-bot-key.txt. IP сервера: [адрес].")}
    ${sh("2.3", "Instagram-автоматизатор", "Когда приходит заявка из директа, добавляй строку в мою Google Таблицу и пиши мне в Telegram. Сначала покажи план.")}
    ${sh("2.4", "«Гайды и КП»", "Собери гайд в PDF для кодового слова. Для кого: [кто читатель]. После прочтения человек должен: [действие]. Материалы в папке «Гайды и КП».")}
    ${sh("2.5", "Монтажёр", "Посмотри статистику прошлой недели и предложи, что повторить в новой серии.", "w2")}
    <div class="c r3"><div class="rr">${G("key", { c: NIGHT, w: 2.6 })}<span>Ключи только файлом в Загрузках.</span></div><div class="rr">${G("pad", { c: NIGHT, w: 2.6 })}<span>Правка = номер кадра + что сделать.</span></div><div class="rr">${G("check", { c: NIGHT, w: 3 })}<span>Без вашего «выкладывай» ролик не выходит.</span></div></div>
  </div>`,
};

/* ====================== сборка файлов ====================== */
const SECTIONS = [
  { file: "00-kak-ustroen-zavod", title: "Как устроен ваш контент-завод", pages: [cover, factory, mine, stops, lmap] },
  { file: "00-registracii", title: "Что завести до уроков", pages: [reg1, reg2] },
  ...LESSONS.map((L) => ({ file: L.slug, title: `Урок ${L.id}. ${L.title}`, pages: lessonPages(L) })),
  { file: "99-shpargalka", title: "Шпаргалка: 10 фраз для агента", pages: [cheat] },
];

const footer = (n, total) => `<div class="foot"><span><a href="https://onai.academy/">onAI Academy</a> · Vibe Production · <a href="https://www.instagram.com/saint4ai/">@saint4ai</a></span><span class="pn">${n} / ${total}</span></div>`;
// неразрывные пробелы и неразрывные диапазоны (формулировки не меняются). Правки только в тексте между тегами, чтобы не задеть данные SVG:
// 1) пробел после цифры перед словом и между разрядами тысяч («1 300»); 2) пробел после однобуквенных предлогов; 3) диапазоны «2–5», «45–50» не рвутся
const NBSP = "\u00a0";
const nbspText = (t) => t
  .replace(/(\d) (?=[а-яёА-ЯЁ])/g, "$1" + NBSP)
  .replace(/(\d) (?=\d{3}(?!\d))/g, "$1" + NBSP)
  .replace(/(^|[\s>])([вкосуиаВКСУОИА]) (?=\S)/g, "$1$2" + NBSP)
  .replace(/(\d+–\d+)/g, '<span class="nw">$1</span>');
const nbsp = (h) => h.replace(/>([^<]+)</g, (m, t) => ">" + nbspText(t) + "<");
const doc = (title, secs, extra = false) => nbsp(`<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<title>${title}</title>
<link rel="stylesheet" href="../common.css">
<link rel="stylesheet" href="lessons.css">${extra ? '\n<link rel="stylesheet" href="lessons-extra.css">' : ""}
</head>
<body>
${secs}
</body></html>
`);
const renderPages = (list, globalStart, globalTotal) => {
  const total = globalTotal || list.length;
  return list.map((p, i) => {
    const isCover = p.cls.includes("cover");
    const n = (globalTotal ? globalStart : 0) + i + 1;
    return `<section class="page ${p.cls}">\n${p.html}\n${isCover ? "" : footer(n, total)}\n</section>`;
  }).join("\n\n");
};

const all = SECTIONS.flatMap((s) => s.pages);
const manifest = [];
let start = 0;
for (const s of SECTIONS) {
  // файл раздела: нумерация сквозная, как в общем файле (ссылки «стр. 6» работают и в отдельном PDF)
  writeFileSync(join(outDir, `${s.file}.html`), doc(s.title, renderPages(s.pages, start, all.length)));
  manifest.push({ file: s.file, pages: s.pages.length, start });
  start += s.pages.length;
}
// общий файл: сквозная нумерация
let gi = 0;
const allHtml = SECTIONS.map((s) => {
  const out = s.pages.map((p) => {
    const isCover = p.cls.includes("cover"); gi++;
    return `<section class="page ${p.cls}">\n${p.html}\n${isCover ? "" : footer(gi, all.length)}\n</section>`;
  }).join("\n\n");
  return `<!-- ${s.title} -->\n${out}`;
}).join("\n\n");
writeFileSync(join(outDir, "all.html"), doc("Vibe Production: раздатки к урокам", allHtml));

/* ====================== дополнения (5 разделов), отдельная нумерация и общий файл ====================== */
// Основной пакет выше не меняется: дополнения пишутся в свои файлы и в manifest.extra, общий PDF основного пакета их не включает.
const XS = extraSections({ IMG, LOGO, G, H, ARROW_G, ARROW_N, CHAT, result, you, agent, rule, errors, done, phrase, rb, GOLD, GOLD2, BROWN, NIGHT, INK, CREAM });
const xall = XS.flatMap((s) => s.pages);
const xmanifest = [];
let xstart = 0;
for (const s of XS) {
  writeFileSync(join(outDir, `${s.file}.html`), doc(s.title, renderPages(s.pages, xstart, xall.length), true));
  xmanifest.push({ file: s.file, pages: s.pages.length, start: xstart });
  xstart += s.pages.length;
}
let xgi = 0;
const xallHtml = XS.map((s) => `<!-- ${s.title} -->\n` + s.pages.map((p) => { xgi++; return `<section class="page ${p.cls}">\n${p.html}\n${footer(xgi, xall.length)}\n</section>`; }).join("\n\n")).join("\n\n");
writeFileSync(join(outDir, "all-extra.html"), doc("Vibe Production: дополнения к урокам", xallHtml, true));
writeFileSync(join(outDir, "manifest.json"), JSON.stringify({ total: all.length, sections: manifest, extra: { total: xall.length, all: "Vibe-Production-dopolneniya", sections: xmanifest } }, null, 1));
console.log(`страниц всего ${all.length}, файлов ${SECTIONS.length + 1}; дополнения: страниц ${xall.length}, файлов ${XS.length + 1}`);
