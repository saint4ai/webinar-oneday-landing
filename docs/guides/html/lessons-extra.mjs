// Раздатки-дополнения Vibe Production: 5 разделов по текстам docs/guides/lesson-handouts-extra.md (версия 2 после скептиков).
// Тексты берутся из файла без изменений формулировок, здесь только раскладка и графика.
// Подключается из gen-lessons.mjs: extraSections(помощники) возвращает массив {file, title, pages}.
// Стили: lessons/lessons-extra.css (подключается только в файлах дополнений).

export function extraSections(h) {
  const { IMG, LOGO, G, H, ARROW_G, ARROW_N, CHAT, result, you, agent, rule, errors, done, phrase, rb, GOLD, GOLD2, BROWN, NIGHT, INK, CREAM } = h;

  /* ---------- общие блоки дополнений ---------- */
  const LG = (n, ext = "png") => `<img src="../img/logo-${n}.${ext}" alt="">`;
  const xbadges = (list) => `<div class="cbs">${list.map((c) => {
    if (c === "→") return `<div class="cb o">${ARROW_G}</div>`;
    const d = typeof c === "string" ? CHAT[c] : c;
    return `<div class="cb${d.logo ? " logo" : ""}"><div class="im">${IMG(d.img)}</div><span>${d.name}</span></div>`;
  }).join("")}</div>`;
  const xhead = (X) => `<header class="lh xh${X.narrow ? " xn" : ""}">
  <div class="lh-top"><div class="kicker">${X.kicker}</div><span class="xtag">${X.label}</span></div>
  <div class="lh-main"><div class="plate${X.wide ? " w" : ""}">${X.id}<span class="pls">+</span></div><h1 class="lh-title u">${X.title}</h1>${xbadges(X.chats)}</div>
</header>`;
  const xslim = (X) => `<header class="lh-s xs"><div class="plate${X.wide ? " w" : ""}">${X.id}<span class="pls">+</span></div><div class="t">${X.title}</div><span class="xtag s">${X.label}</span></header>`;
  const xwhen = (t) => `<div class="xwn"><span class="gi">${G("clock", { c: GOLD, w: 2.6 })}</span><div class="tx"><b>Когда браться:</b>${t}</div></div>`;
  const xcant = (items, head = "Что нельзя:") => `<div class="xcant"><span class="gi">${G("slash", { c: BROWN, w: 2.6 })}</span><div class="tx">${items.map((p, i) => `<p>${i === 0 ? `<b>${head}</b> ` : ""}${p}</p>`).join("")}</div></div>`;
  const xinfo = (glyph, label, t) => `<div class="xinfo"><span class="gi">${GG(glyph, { c: NIGHT, w: 2.5 })}</span><div class="tx"><b>${label}</b> ${t}</div></div>`;
  const xdfn = (label, t) => `<div class="dfn"><span>${label ? `<b>${label}</b> ` : ""}${t}</span></div>`;
  const xa = (u, t) => `<a class="xa" href="${u}">${t}</a>`;
  const AI_LABEL = "Если в ролике сгенерированные фон, предметы или голос выглядят как настоящие, нужна метка ИИ. В Instagram и YouTube её ставит агент при публикации. В TikTok агент ставит её только для аккаунта TikTok Business, иначе отметьте в приложении сами.";
  const err = (s) => { const i = s.indexOf(" → "); return [s.slice(0, i), s.slice(i + 3)]; };
  // шаги с заметками между ними (заметка вставляется после шага с номером after)
  const xyou = (steps, notes = {}) => `<div class="you">${H("Что делаете вы", G("user", { c: NIGHT, w: 2.6 }))}<ol>${steps.map((s, i) => `<li><span class="no">${i + 1}</span><span class="tx">${s}</span><span class="bx"></span></li>${notes[i + 1] ? `<li class="xn-li"><div class="xnote"><span class="en">EN</span><span>${notes[i + 1]}</span></div></li>` : ""}`).join("")}</ol></div>`;

  // дополнительные значки-контуры
  const X_PATH = {
    phone: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM10.5 19h3",
    bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5V16h8v-2.5A6 6 0 0 0 12 3z",
    image: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M16 9.5a1.2 1.2 0 1 0 0 .01",
    pause: "M8 5v14M16 5v14",
    timer: "M10 2h4M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9v5l3 2",
    card: "M3 6h18v12H3zM3 10h18M7 15h4",
    swap: "M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4",
    code: "M8 7l-5 5 5 5M16 7l5 5-5 5M14 5l-4 14",
    repeat: "M4 11a8 8 0 0 1 14-4l2 2M20 4v5h-5M20 13a8 8 0 0 1-14 4l-2-2M4 20v-5h5",
    compare: "M5 20V10M12 20V4M19 20v-7",
  };
  const XG = (n, o = {}) => {
    const { c = "currentColor", w = 2.4 } = o;
    return `<svg class="sv" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><path d="${X_PATH[n]}"/></svg>`;
  };
  const GG = (n, o = {}) => (X_PATH[n] ? XG(n, o) : G(n, o));

  /* =========================================================
     1. Доска раскадровки (урок 1.4)
     ========================================================= */
  const B = { id: "1.4", kicker: "Модуль 1 «AI-монтаж»", label: "Дополнение к уроку 1.4", title: "Доска раскадровки: правки по кадрам мышкой", chats: ["mont"] };
  const boardShot = () => `<div class="xsb"><img src="../img/board/01-obshchij-vid.png" alt="">
    <i class="hl" style="left:1%;top:12.2%;width:98%;height:8.2%"></i><i class="hl" style="left:1.2%;top:22.8%;width:58.4%;height:76%"></i>
    <i class="hl" style="left:61.5%;top:21.8%;width:37.8%;height:77%"></i><i class="hl" style="left:89.4%;top:6.9%;width:9.4%;height:4.8%"></i>
    <b class="co" style="left:4.2%;top:12.2%">1</b><b class="co" style="left:4.2%;top:22.8%">2</b><b class="co" style="left:64.4%;top:21.8%">3</b><b class="co" style="left:94.2%;top:4.4%">4</b></div>`;
  const legend = ["лента кадров по времени", "сетка кадров с номерами", "панель выбранного кадра справа", "кнопка «Сводка правок»"];
  const mcard = (n, title, body, img, o = {}) => `<div class="xmc"><div class="pc"><div class="im${o.cv ? " cv" : ""}"><img src="../img/board/${img}" alt=""></div>${o.cap ? `<div class="cp">${o.cap}</div>` : ""}</div>
    <div class="mt"><div class="mh"><span class="no">${n}</span><b>${title}</b></div><div class="mx">${body}</div></div></div>`;
  const KEYL = `<span class="xkey">←</span>`, KEYR = `<span class="xkey">→</span>`;
  const boardPages = [
    {
      cls: "cream ls",
      html: `${xhead(B)}${xwhen(" в уроке 1.4, как только Монтажёр прислал лист кадров. С этого момента правки оставляйте на доске, а не в чате. Видео в кадрах появится после черновика.")}
      ${result("вы показываете правки прямо на кадрах ролика, а агент исправляет и отвечает под каждой.", "Результат")}
      <div class="xrow top" style="gap:20px"><div style="flex:none;width:600px">${H("Как выглядит доска", G("monitor", { c: NIGHT, w: 2.4 }))}${boardShot()}</div>
        <div class="grow" style="display:flex;flex-direction:column;gap:12px;padding-top:2px">${xdfn("Что это.", "Доска это тот же лист кадров К001… из урока 1.4, только в браузере и с кнопками для правок. Кадры идут каждые 2 секунды. Доска работает на вашем компьютере без интернета и без входа, ролик никуда не загружается.")}
          <div class="xleg">${legend.map((t, i) => `<div class="li"><span class="no">${i + 1}</span><span>${t}</span></div>`).join("")}</div></div></div>`,
    },
    {
      cls: "ls xc",
      html: `${xslim(B)}<div class="bd">
      <div><div class="hd" style="margin-bottom:6px"><span class="hi">${G("star", { c: NIGHT, w: 2.4 })}</span><span>4 способа показать правку</span></div>
      <div class="xg2">
        ${mcard(1, "Оценка кадра", "«Нравится», «Нужна правка» или «Вопрос».", "05-ocenki-crop.png")}
        ${mcard(2, "Комментарий", "напишите, что исправить. Галочка «привязать к моменту видео» запомнит секунду.", "03-kommentarij-moment-crop.png", { cap: "Ваш комментарий к кадру" })}
        ${mcard(3, "Образец", `перетащите скриншот или видео нужного эффекта или вставьте его: <span class="xkey">Ctrl+V</span> (на Mac: <span class="xkey">Cmd+V</span>).`, "04-vlozhenie-crop.png")}
        ${mcard(4, "Стрелка «Сдвиг»", "кнопка «↔ Сдвиг объектов», протяните стрелку мышкой от объекта к новому месту, подпишите, выберите «крупнее» или «мельче».", "07-sdvig-crop.png", { cv: true })}
      </div></div>
      <div class="xg2" style="align-items:stretch">
        <div class="xseg"><div class="im"><img src="../img/board/02-kadr-segment-crop.png" alt=""></div><div class="tx">Кнопка «Сегмент» проигрывает 2 секунды этого кадра, чтобы вы увидели движение.</div></div>
        <div class="xplate"><span class="gi">${G("check", { c: GOLD, w: 3.2 })}</span><span>Для первого раза хватит оценки и комментария.</span></div></div>
      ${xyou([
        "Скажите Монтажёру: «Собери доску раскадровки для ролика».",
        `Попросите «запусти доску» и откройте в браузере адрес <span class="xcode">http://localhost:4321</span>. Он работает <span class="xmk">только на вашем компьютере</span>, пока доска запущена: на телефоне и у других людей не откроется.`,
        `Листайте кадры стрелками ${KEYL} и ${KEYR} на клавиатуре. Где что-то не так, поставьте оценку и напишите комментарий.`,
        "Покажите, как надо: приложите образец или поставьте стрелку.",
        "Напишите в чат: «Я оставил комментарии на доске, прочитай и поправь».",
        "Посмотрите новую версию. Не согласны: нажмите «Открыть снова» и допишите.",
      ])}</div>`,
    },
    {
      cls: "cream ls xc",
      html: `${xslim(B)}<div class="bd">
      <div class="xrow">${agent([
        "собирает доску из кадров и черновика;",
        "читает оценки, комментарии с секундой, стрелки и образцы;",
        "правит сцены, отвечает под каждым комментарием и отмечает «решено»;",
        "пересобирает доску. Ваши правки остаются на своих номерах кадров.",
      ])}<div class="x06"><img src="../img/board/06-otvet-agenta-crop.png" alt=""><div class="cp">Ответ агента: правка решена</div></div></div>
      ${rule("Покажите, а не описывайте.", "«на седьмой секунде подвинь чуть левее».", "стрелка на К004 от телефона к новому месту.")}
      ${errors([
        err("Страница не открывается → доска не запущена: скажите агенту «запусти доску»."),
        err("В кадре не играет видео → нет черновика: попросите «сделай черновик и пересобери доску»."),
        err("Стрелка не ставится → включите «↔ Сдвиг объектов» и тяните дальше: короткая стрелка считается случайной."),
      ])}
      <div class="gr2">${done("ваши правки на доске отмечены «решено», а в новой версии ролика видно, что они сделаны.")}${phrase("Я оставил комментарии на доске, прочитай и поправь.")}</div></div>`,
    },
  ];

  /* =========================================================
     2. Higgsfield (урок 1.4)
     ========================================================= */
  const HF = { id: "1.4", kicker: "Модуль 1 «AI-монтаж»", label: "Дополнение к уроку 1.4", title: "Higgsfield: картинки и видео для монтажа", chats: ["mont", { img: "logo-higgsfield", name: "Higgsfield", logo: true }] };
  const zc = (img, t) => `<div class="c"><div class="im">${IMG(img)}</div><div class="tx">${t}</div></div>`;
  const creditScale = () => `<div class="xcr nb"><img class="glow" src="../img/glow-gold.png" alt="">
    ${H("Сколько кредитов уходит на видео", G("chart", { c: NIGHT, w: 2.6 }))}
    <div class="ln">Starter: 200 кредитов в месяц, деления по 20</div>
    <div class="bar">${Array.from({ length: 10 }, () => `<div class="sg k20">20<small>Kling 8 с</small></div>`).join("")}</div>
    <div class="ap">≈ 10 видео Kling</div>
    <div class="bar"><div class="sg k72">72<small>Seedance 2.5 · 8 с</small></div><div class="sg k72">72<small>Seedance 2.5 · 8 с</small></div><div class="sg kr">56<small>остаток</small></div></div>
    <div class="ap" style="margin-bottom:0">≈ 2 видео Seedance 2.5</div></div>`;
  const hfPages = [
    {
      cls: "cream ls",
      html: `${xhead(HF)}${xwhen(" по желанию, после первого собранного ролика. Урок 1.4 проходится и без Higgsfield.")}
      ${result("агент сам рисует предмет, фон или видеовставку для ролика, а вы только одобряете цену.", "Результат")}
      <div class="bd">
      ${xdfn("Что это.", `Higgsfield (${xa("https://higgsfield.ai", "higgsfield.ai")}) это сайт, где собраны десятки моделей для картинок и видео. Модель это нейросеть, которая рисует или снимает по описанию. Подключённый к Claude, Higgsfield даёт агенту делать это прямо из чата.`)}
      <div><div class="hd" style="margin-bottom:6px"><span class="hi">${G("star", { c: NIGHT, w: 2.4 })}</span><span>Зачем ролику</span></div><div class="xz4">
        ${zc("lg-i-box", "предмет по смыслу фразы")}${zc("lg-ch2-studio", "фон за спиной")}${zc("lg-i-laptopfilm", "видеовставка, когда нет демо")}${zc("lg-s23-noface", "озвучка для ролика без лица")}</div></div>
      ${xcant(["логотипы сервисов и интерфейсы продуктов. Их берём только настоящие."], "Что не генерируем:")}
      ${xinfo("card", "Что понадобится:", "платная подписка Higgsfield, без неё агент не подключится. Для начала хватит тарифа Starter. Оплата банковской картой на сайте; примет ли сайт карту банка Казахстана или России, Higgsfield не пишет. Ключ не нужен: вы входите через браузер.")}
      </div>`,
    },
    {
      cls: "ls xc",
      html: `${xslim(HF)}<div class="bd">
      ${xyou([
        `Зарегистрируйтесь на ${xa("https://higgsfield.ai", "higgsfield.ai")} и оформите Starter. Пароль и оплату вводите сами.`,
        "Скажите Монтажёру: «Подключи Higgsfield». Войдите в браузере, когда он откроет окно.",
        "Проверьте: спросите агента «Какой у меня баланс кредитов в Higgsfield?». Назвал баланс, значит подключено.",
        "Первая проба: попросите вертикальную картинку 9:16, как экран телефона, и добавьте «сначала скажи цену».",
      ])}
      <div class="xrow">${agent([
        "ставит программу Higgsfield и навыки к ней;",
        "пишет описание и выбирает модель;",
        "называет цену в кредитах и ждёт вашего «да»;",
        "кладёт файл в папку ролика и записывает, какой моделью и за сколько.",
      ])}<div style="flex:.8">${xinfo("repeat", "Модель выбирает агент.", "Хотите дешевле, скажите: «возьми модель подешевле».")}</div></div>
      <div class="xcost">${xdfn("Сколько стоит.", `Кредиты это внутренние деньги Higgsfield. Starter: 15 долларов в месяц за 200 кредитов, то есть 20 кредитов около 1,5 доллара. Видео Kling 3.0 на 8 секунд около 20 кредитов, Seedance 2.5 той же длины около 72. Значит, 200 кредитов хватит примерно на 10 видео Kling по 8 секунд. Точная цена всегда на кнопке генерации, перед покупкой сверьте ${xa("https://higgsfield.ai/pricing", "higgsfield.ai/pricing")}. Подписка продлевается сама; деньги возвращают только в первые 7 дней и если кредиты не тратились.`)}
        ${creditScale()}</div></div>`,
    },
    {
      cls: "cream ls xc",
      html: `${xslim(HF)}<div class="bd">
      ${rule("Сначала цена, потом генерация.", "агент сгенерировал 10 вариантов, кредиты кончились.", "«Сначала скажи цену и жди моего «да»».")}
      ${errors([
        err("Картинка хуже, чем ждали → проверьте модель: в списке Higgsfield Nano Banana Pro называется nano_banana_2. Просите её."),
        err("Seedance 2.5 нет в списке → он не входит в Starter: возьмите Seedance 2.0 или тариф выше."),
        err("«Сессия истекла» → агент запустит вход снова, войдите в браузере."),
      ])}
      ${xcant(["чужое лицо и голос без согласия человека; убирать пометки сервиса с результата; генерировать логотипы и интерфейсы.", `Метка ИИ при публикации: ${AI_LABEL}`])}
      <div class="gr2">${done("агент назвал баланс, сгенерировал первую картинку после вашего «да» и положил её в папку ролика.")}${phrase("Подключи Higgsfield. Перед каждой генерацией называй цену и жди моего «да».")}</div>
      <div class="xfoot"><b>Если агент спросит, какую модель взять:</b> картинка высокого качества: Nano Banana Pro (в списке nano_banana_2); видео: Kling 3.0; видео с несколькими образцами: Seedance 2.5 или 2.0; дешевле: Seedance 2.0 Mini, Kling 2.6.</div></div>`,
    },
  ];

  /* =========================================================
     3. TikTok, YouTube и лучшее время (уроки 1.5 и 2.2)
     ========================================================= */
  const TT = { id: "1.5 · 2.2", wide: true, kicker: "Модули 1 и 2", label: "Дополнение к урокам 1.5 и 2.2", title: "TikTok, YouTube и лучшее время для выкладки", chats: ["ig"] };
  const diagram = () => `<div class="xdg"><svg width="1007" height="124" viewBox="0 0 1007 124" fill="none" stroke="${GOLD2}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M236 62 H 336"/><path d="M326 55l10 7-10 7"/>
      <path d="M566 62 C 626 62, 646 20, 706 20"/><path d="M696 13l10 7-10 7"/>
      <path d="M566 62 H 706"/><path d="M696 55l10 7-10 7"/>
      <path d="M566 62 C 626 62, 646 104, 706 104"/><path d="M696 97l10 7-10 7"/></svg>
    <div class="nd cl" style="left:0;top:12px;width:236px;height:100px">${IMG("lg-ch1-clapper", "lego", "")}<b>ролик</b></div>
    <div class="nd zr" style="left:336px;top:12px;width:230px;height:100px"><span class="lg">${LG("zernio", "svg")}</span><b>Zernio</b></div>
    <div class="nd tg" style="left:706px;top:0;width:301px;height:40px"><span class="lg">${LG("instagram", "svg")}</span><b>Instagram</b></div>
    <div class="nd tg" style="left:706px;top:42px;width:301px;height:40px"><span class="lg">${LG("tiktok", "svg")}</span><b>TikTok</b></div>
    <div class="nd tg" style="left:706px;top:84px;width:301px;height:40px"><span class="lg">${LG("youtube", "svg")}</span><b>YouTube</b></div></div>`;
  const calendar = () => {
    const slot = ["12:00", "20:00", "23:00"], cls = ["s12", "s20", "s23"], dn = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
    const head = dn.map((d, i) => `<div class="dh${i > 4 ? " we" : ""}">${d}</div>`).join("");
    const cells = Array.from({ length: 14 }, (_, i) => `<div class="cell${i % 7 > 4 ? " we" : ""}"><div class="dn2">день ${i + 1}</div><div class="sl ${cls[i % 3]}">${slot[i % 3]}</div></div>`).join("");
    // дуга от клетки дня 1 к клетке дня 3: цифры снимают через 48 часов
    const cw = (980 - 36) / 7, x1 = cw / 2, x3 = 2 * (cw + 6) + cw / 2;
    return `<div class="xcal"><div class="gr">${head}</div>
      <div class="ann"><svg width="980" height="40" viewBox="0 0 980 40" fill="none" stroke="${BROWN}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1 7"><path d="M${x1.toFixed(0)} 38 C ${x1.toFixed(0)} 4, ${x3.toFixed(0)} 4, ${x3.toFixed(0)} 36"/></svg>
        <span class="al" style="left:${((x1 + x3) / 2).toFixed(0)}px;top:14px">цифры через 48 часов</span></div>
      <div class="gr">${cells}</div>
      <div class="lgd"><span class="it"><span class="sw" style="background:${GOLD}"></span>12:00</span><span class="it"><span class="sw" style="background:${BROWN}"></span>20:00</span><span class="it"><span class="sw" style="background:${NIGHT}"></span>23:00</span><span class="it"><span class="sw we"></span>выходные</span></div></div>`;
  };
  const tiPages = [
    {
      cls: "cream ls",
      html: `${xhead(TT)}${xwhen(" часть 1 после урока 2.2, когда подключён Zernio. Часть 2 можно начать сразу после урока 1.5: выкладываете ролики сами, цифры через 48 часов переписываете из статистики Instagram и присылаете агенту.")}
      ${result("один ролик выходит в Instagram, TikTok и YouTube, а время выкладки вы выбираете по своим цифрам.", "Результат")}
      <div class="bd">
      <div class="hd" style="margin:2px 0 0"><span class="hi">${G("link", { c: NIGHT, w: 2.4 })}</span><span>Часть 1. TikTok и YouTube через Zernio</span></div>
      ${diagram()}
      <div class="xrow top">
        <div style="flex:1;min-width:0">${you([
          "В Zernio откройте Connections (Подключения) и войдите в TikTok и YouTube так же, как в Instagram.",
          "Скажите автоматизатору: «Выкладывай ролики ещё в TikTok и YouTube».",
        ])}</div>
        <div class="xpr nb" style="flex:1.3"><img class="glow" src="../img/glow-gold.png" alt="">${H("Сколько стоит", XG("card", { c: NIGHT, w: 2.5 }))}
          <div class="tx">TikTok и YouTube это 2 новых аккаунта в Zernio. Бесплатны только первые 2 аккаунта, каждый следующий 6 долларов в месяц, нужна карта. Пример: Instagram, TikTok и YouTube это 3 аккаунта, 6 долларов в месяц.</div>
          <div class="acc"><div>${LG("instagram", "svg")}<span>аккаунт 1<br>бесплатны</span></div><div>${LG("tiktok", "svg")}<span>аккаунт 2<br>бесплатны</span></div><div class="pay">${LG("youtube", "svg")}<span>аккаунт 3<br>6 долларов в месяц</span></div></div></div></div>
      </div>`,
    },
    {
      cls: "ls xc",
      html: `${xslim(TT)}<div class="bd">
      <div><div class="hd" style="margin-bottom:6px"><span class="hi">${G("star", { c: NIGHT, w: 2.4 })}</span><span>Что важно знать</span></div><div class="xtri">
        <div class="c"><div class="tp"><span class="lg">${LG("tiktok", "svg")}</span>TikTok</div><div class="tx">Через Zernio ролик выходит только для всех. Хотите выложить ролик не для всех: выложите его в приложении TikTok сами. Не больше 15 роликов в сутки.</div></div>
        <div class="c"><div class="tp"><span class="lg">${LG("youtube", "svg")}</span>YouTube</div><div class="tx">Вертикальный ролик до 3 минут становится Shorts, это короткие видео YouTube, как рилсы. Свою обложку для Shorts через Zernio не поставить, только в YouTube Studio (кабинет автора на сайте YouTube).</div></div>
        <div class="c"><div class="tp"><span class="lg ai">ИИ</span>Метка ИИ</div><div class="tx">${AI_LABEL}</div></div></div></div>
      <div class="hd" style="margin:4px 0 0"><span class="hi">${G("clock", { c: NIGHT, w: 2.4 })}</span><span>Часть 2. Как найти своё лучшее время</span></div>
      ${xdfn("Слот", "это время выкладки, например 20:00. Универсального лучшего часа нет: у каждого блога своя аудитория. Нужны 2 недели и ваши цифры.")}
      ${calendar()}</div>`,
    },
    {
      cls: "cream ls xc",
      html: `${xslim(TT)}<div class="bd">
      <div style="margin-top:12px">${rb([
        { glyph: "clock", t: "3 слота" },
        { img: "lg-i-calendar", t: "2 недели по ролику в день" },
        { glyph: "chart", t: "цифры через 48 часов" },
        { glyph: "eye", t: "сравнение" },
        { glyph: "star", t: "1–2 лучших слота", hl: true },
        { img: "lg-i-hourglass", t: "повтор через месяц" },
      ], "tight")}</div>
      ${xyou([
        "Выберите главный часовой пояс аудитории. В Москве на 2 часа меньше: 20:00 в Алматы это 18:00 в Москве.",
        "Утвердите 3 слота, например 12:00, 20:00 и 23:00. За 2 недели каждый получит 4–5 роликов, и в будни, и в выходные. Хотите 5 слотов: эксперимент длится 3 недели.",
        "Выкладывайте по ролику в день, меняя слот по кругу.",
        "Через 2 недели попросите агента сравнить слоты.",
        "Оставьте 1–2 лучших. Через месяц повторите: победитель плюс один новый слот.",
      ])}
      ${agent([
        "ставит ролик на слот после вашего «выкладывай» на подпись и настройки;",
        "через 48 часов после каждого ролика записывает просмотры, среднее время просмотра и долю пропуска в первые 3 секунды. Долю пропуска Zernio отдаёт только по Instagram, по TikTok и YouTube сравниваем просмотры и время просмотра;",
        "сравнивает слоты и называет победителя.",
      ])}
      <div class="xcmp"><span class="gi">${XG("compare", { c: GOLD, w: 2.6 })}</span><div><b>Правило сравнения:</b> в слоте не меньше 3 роликов; разница в просмотрах меньше 20% это ничья; при ничьей лучше слот, где ролик реже пролистывают.</div></div></div>`,
    },
    {
      cls: "ls roomy",
      html: `${xslim(TT)}<div class="bd">
      ${rule("Сравнивайте одинаковое.", "пробный рилс сравнили с роликом для подписчиков.", "пробные с пробными, каждый через 48 часов после выкладки.")}
      ${errors([
        err("Агент пишет «мало данных» → в слоте меньше 3 роликов: выкладывайте дальше."),
        err("Все слоты одинаковые → это тоже ответ: время не главное, работайте над первыми 3 секундами."),
        err("Вывод через день → снимайте цифры через 48 часов, не раньше."),
      ])}
      <div class="gr2">${done("сегодня ролик вышел в TikTok и YouTube; через 2 недели агент назвал 1–2 лучших слота по вашим цифрам.")}${phrase("Начни эксперимент со временем выкладки: слоты [12, 20 и 23] по времени [Алматы], 2 недели, сравнение через 48 часов.")}</div></div>`,
    },
  ];

  /* =========================================================
     4. Заявки строкой в Google Таблице (урок 2.3)
     ========================================================= */
  const GS = { id: "2.3", kicker: "Модуль 2 «Ассистенты и автоматизация»", label: "Дополнение к уроку 2.3", title: "Заявки строкой в Google Таблице", chats: ["ig"] };
  const sheetFlow = () => `<div class="xsc"><svg width="1007" height="188" viewBox="0 0 1007 188" fill="none" stroke="${GOLD2}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M176 94 H 240"/><path d="M230 87l10 7-10 7"/>
      <path d="M452 94 C 492 94, 502 40, 552 40 H 640"/><path d="M630 33l10 7-10 7"/>
      <path d="M452 94 C 492 94, 502 146, 552 146 H 592"/><path d="M582 139l10 7-10 7"/>
      <path d="M764 146 H 790"/><path d="M780 139l10 7-10 7"/></svg>
    <div class="nd a" style="left:0;top:58px;width:176px;height:72px"><span class="lg">${LG("instagram", "svg")}</span><b>директ</b></div>
    <div class="nd bot" style="left:240px;top:40px;width:212px;height:108px">${IMG("lg-i-botchat", "lego")}<b>ассистент</b></div>
    <div class="nd tgm" style="left:640px;top:4px;width:230px;height:72px"><span class="lg">${LG("telegram", "svg")}</span><div><b>Telegram</b></div></div>
    <div class="nd scr" style="left:592px;top:110px;width:172px;height:72px"><span class="lg" style="background:${CREAM}">${XG("code", { c: BROWN, w: 2.4 }).replace("<svg", '<svg style="width:26px;height:26px"')}</span><div><b>Apps Script</b></div></div>
    <div class="nd row" style="left:790px;top:102px;width:217px;height:84px"><span class="lg">${IMG("logo-sheets")}</span><div><b>строка в листе «Заявки»</b></div></div>
    <span class="al" style="left:545px;top:34px">всегда</span></div>`;
  const sheetMock = () => {
    const cols = ["Время", "Канал", "Имя", "Ник", "Что нужно", "Контакт", "Диалог"];
    const rows = [
      ["10.10.2026 14:32", "Instagram", "Имя", "@ник", "хочу записаться", "+7 7XX XXX XX XX", "ссылка на диалог"],
      ["10.10.2026 15:05", "WhatsApp", "Имя", "@ник", "нужна консультация", "+7 7XX XXX XX XX", "ссылка на диалог"],
    ];
    return `<div class="xsh"><div class="tt">${IMG("logo-sheets")}<b>Заявки</b><span>Google Таблица</span></div><div class="tb">
      <div class="n"></div>${cols.map((c) => `<div class="h">${c}</div>`).join("")}
      ${rows.map((r, i) => `<div class="n">${i + 2}</div>${r.map((c) => `<div>${c}</div>`).join("")}`).join("")}</div>
      <div class="tabs"><b>Заявки</b><span>Колонки таблицы: Время · Канал · Имя · Ник · Что нужно · Контакт · Диалог</span></div></div>`;
  };
  const gsPages = [
    {
      cls: "cream ls",
      html: `${xhead(GS)}${xwhen(" после урока 2.2, когда ассистент работает на сервере. Шаг по желанию: ассистент работает и без него.")}
      ${result("каждая заявка из директа приходит вам в Telegram и одновременно строкой в Google Таблицу.", "Результат")}
      <div class="bd">
      ${xdfn("Что это.", "К таблице вы подключаете маленькую программу Google (Apps Script). Она принимает заявку от ассистента и дописывает строку. Если таблица не ответила, заявка всё равно придёт в Telegram, а ассистент повторит запись раз в минуту в течение суток.")}
      ${sheetFlow()}${sheetMock()}</div>`,
    },
    {
      cls: "ls xl",
      html: `${xslim(GS)}<div class="bd">${xyou([
        "Создайте пустую Google Таблицу «Заявки». Меню «Расширения» → «Apps Script»: в новой вкладке откроется редактор.",
        "Попросите агента «Покажи файл Code.gs» (это текст программы для таблицы). Скопируйте его в редактор вместо старого и нажмите «Сохранить».",
        `Попросите «Создай секрет для таблицы». Секрет это пароль, который знают только таблица и ассистент. Агент запишет его в файл <span class="fnm">assistant\\.env</span> в папке проекта. Откройте этот файл Блокнотом (на Mac: TextEdit), найдите строку <span class="fnm">LEADS_WEBHOOK_SECRET=</span> и скопируйте всё после знака «=». В чат не вставляйте.`,
        `В Apps Script откройте «Настройки проекта» (шестерёнка) → «Добавить свойство скрипта». Имя: <span class="fnm">SECRET</span>. Значение: то, что скопировали. Сохраните.`,
        "Нажмите «Начать развертывание» → «Новое развертывание». Тип: «Веб-приложение».",
        "Выполнять от имени: «Я». Доступ: «Все». Нажмите «Развернуть».",
        "Google спросит аккаунт: выберите свой. Появится «Google не проверил это приложение»: нажмите «Дополнительные настройки» → «Перейти на страницу … (небезопасно)» → «Разрешить». Это ваш собственный скрипт, предупреждение обычное.",
        `Скопируйте адрес веб-приложения: он заканчивается на <span class="fnm">/exec</span>. Сохраните его в Блокноте файлом <span class="fnm">Загрузки\\google-sheets-key.txt</span> и напишите агенту только путь к файлу.`,
        "После работы агента проверьте, что файла в Загрузках больше нет.",
        "Напишите ассистенту со второго аккаунта Instagram, что хотите записаться, и оставьте контакт.",
      ], { 7: "В английском интерфейсе: Deploy → New deployment → Web app, Execute as: Me, Who has access: Anyone. Названия кнопок на русском могут отличаться на слово." })}</div>`,
    },
    {
      cls: "cream ls",
      html: `${xslim(GS)}<div class="bd">
      <div class="gr2 l">${agent([
        "создаёт секрет и не показывает его в чате;",
        "переносит адрес на сервер ассистента и удаляет файл из Загрузок;",
        "отправляет тестовую заявку и проверяет, что строка появилась.",
      ])}${rule("Адрес веб-приложения это ключ.", "адрес /exec вставили в чат.", "адрес в файле в Загрузках, агенту только путь. Ссылка на саму таблицу не подойдёт.")}</div>
      ${errors([
        err("Скопировали ссылку из строки браузера → нужен адрес из окна развертывания, он заканчивается на /exec."),
        err("Агент пишет «секрет не совпал» → скопируйте значение заново, без пробелов."),
        err("Агент пишет «нет доступа» (ошибка 401 или 403) → в развертывании доступ не «Все»: создайте развертывание заново."),
        err("Время в таблице не то → «Файл» → «Настройки» → «Часовой пояс»."),
      ])}
      <div class="gr2">${done("живая заявка со второго аккаунта пришла в Telegram и строкой на лист «Заявки», а файла google-sheets-key.txt в Загрузках нет.")}${phrase("Подключи заявки к Google Таблице. Адрес лежит в файле Загрузки\\google-sheets-key.txt.")}</div></div>`,
    },
  ];

  /* =========================================================
     5. Модуль 3 «AI-креатор»: оффер со стройкой
     ========================================================= */
  const OF = { id: "М3", wide: true, kicker: "Раздатки к урокам · Vibe Production", label: "Модуль 3 · AI-креатор", title: "Ролик «оффер на камеру»: за спиной растёт здание", chats: ["scr", "→", "mont"], narrow: true };
  // кадр-ступень: здание растёт, силуэт человека всегда на переднем плане (рисунок векторный, цвета бренда)
  const frameSvg = (stage) => {
    const SKY = "#F6ECD8", GROUND = GOLD, MUTED = "#6E5F53";
    const W = 188, Hh = 180, gy = 142; // gy: линия земли в координатах сцены, сцена сдвинута вверх на 16
    let s = `<svg viewBox="0 0 ${W} ${Hh}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${Hh}" fill="${SKY}"/><g transform="translate(0 -16)">`;
    if (stage === 5) s += `<circle cx="30" cy="36" r="14" fill="${GOLD}"/>`;
    s += `<rect y="${gy}" width="${W}" height="${Hh + 16 - gy}" fill="${GROUND}"/><path d="M0 ${gy}H${W}" stroke="${BROWN}" stroke-width="3"/>`;
    if (stage === 1) {
      // пустой участок: колышки, натянутая лента, флажок разметки
      s += `<path d="M22 ${gy - 14}H152" stroke="${BROWN}" stroke-width="2.5" stroke-dasharray="5 5"/>
        ${[22, 62, 104, 152].map((x) => `<rect x="${x - 2.5}" y="${gy - 30}" width="5" height="30" rx="1.5" fill="${BROWN}"/>`).join("")}
        <path d="M104 ${gy - 30}l22 7-22 7z" fill="${NIGHT}"/>`;
    }
    if (stage === 2) {
      // фундамент: плита и опорные столбики
      s += `<rect x="16" y="${gy - 16}" width="140" height="16" rx="3" fill="${MUTED}"/>
        ${[24, 62, 100, 138].map((x) => `<rect x="${x}" y="${gy - 44}" width="9" height="28" fill="${BROWN}"/>`).join("")}
        <path d="M16 ${gy - 16}H156" stroke="${NIGHT}" stroke-width="2.5"/>`;
    }
    if (stage >= 3) {
      const top = stage === 5 ? 56 : 78, x0 = stage === 5 ? 18 : 24, x1 = stage === 5 ? 154 : 148;
      s += `<rect x="${x0 - 6}" y="${gy - 14}" width="${x1 - x0 + 12}" height="14" rx="3" fill="${MUTED}"/><rect x="${x0}" y="${top}" width="${x1 - x0}" height="${gy - 14 - top}" fill="${BROWN}"/>`;
      // кирпичная кладка: линии швов
      for (let y = top + 12; y < gy - 14; y += 12) s += `<path d="M${x0} ${y}H${x1}" stroke="${CREAM}" stroke-width="1.4"/>`;
      if (stage === 3) s += `<rect x="40" y="94" width="22" height="26" fill="${SKY}" stroke="${NIGHT}" stroke-width="2.5"/><rect x="108" y="94" width="22" height="26" fill="${SKY}" stroke="${NIGHT}" stroke-width="2.5"/><path d="M148 ${top}v-26M148 ${top - 26}h-30" stroke="${NIGHT}" stroke-width="3.5"/><path d="M118 ${top - 26}v14" stroke="${NIGHT}" stroke-width="2"/>`;
    }
    if (stage === 4) {
      s += `<path d="M14 78L86 34l72 44z" fill="${NIGHT}"/><path d="M14 78L86 34" stroke="${GOLD}" stroke-width="2"/>
        <rect x="40" y="94" width="22" height="26" fill="${GOLD}" stroke="${NIGHT}" stroke-width="2.5"/><rect x="108" y="94" width="22" height="26" fill="${GOLD}" stroke="${NIGHT}" stroke-width="2.5"/>
        <path d="M51 94v26M40 107H62M119 94v26M108 107H130" stroke="${NIGHT}" stroke-width="2"/><rect x="74" y="104" width="24" height="24" rx="2" fill="${GOLD2}" stroke="${NIGHT}" stroke-width="2.5"/>`;
    }
    if (stage === 5) {
      s += `<path d="M10 56L86 14l84 42z" fill="${NIGHT}"/><path d="M10 56L86 14" stroke="${GOLD}" stroke-width="2"/>
        <rect x="118" y="2" width="12" height="22" fill="${BROWN}" stroke="${NIGHT}" stroke-width="2"/>
        ${[[30, 70], [66, 70], [102, 70], [30, 104], [66, 104], [102, 104]].map(([x, y]) => `<rect x="${x}" y="${y}" width="20" height="22" fill="${GOLD}" stroke="${NIGHT}" stroke-width="2.4"/><path d="M${x + 10} ${y}v22" stroke="${NIGHT}" stroke-width="1.6"/>`).join("")}
        <rect x="130" y="${gy - 46}" width="20" height="32" rx="2" fill="${GOLD2}" stroke="${NIGHT}" stroke-width="2.5"/>`;
    }
    s += `</g>`;
    // силуэт человека на переднем плане (справа от центра, поверх здания): голова, шея, плечи
    s += `<path d="M84 ${Hh}C84 152 108 140 134 140C160 140 184 152 184 ${Hh}Z" fill="${NIGHT}" stroke="${CREAM}" stroke-width="2.5"/><rect x="125" y="124" width="18" height="20" fill="${NIGHT}"/><circle cx="134" cy="112" r="19" fill="${NIGHT}" stroke="${CREAM}" stroke-width="2.5"/>`;
    return s + `</svg>`;
  };
  const stages = [
    ["для кого", "пустой участок"], ["что предлагаете", "фундамент"], ["как работает", "стены"], ["что получит клиент", "крыша и окна"], ["что сделать сейчас", "готовое здание"],
  ];
  const frameRibbon = () => `<div class="xfrs">${stages.map(([p, st], i) => `${i ? `<div class="ar">${ARROW_G}</div>` : ""}<div class="xfr${i === 4 ? " last" : ""}"><div class="pic">${frameSvg(i + 1)}<span class="no">${i + 1}</span></div><div class="fph">${p}</div><div class="fst">${G("arrow", { c: i === 4 ? GOLD : BROWN, w: 3 })}${st}</div></div>`).join("")}</div>`;
  const twoWays = () => {
    const rows = [
      ["Как работает", "Higgsfield меняет фон на вашем видео", "вас вырезают на компьютере, фон рисуется отдельным клипом"],
      ["Видео с вашим лицом", "загружается в Higgsfield", "никуда не загружается"],
      ["Что поставить", "ничего", "программу вырезки (ставит агент), лучше с видеокартой Nvidia"],
      ["Длина куска", "3–10 секунд", "любая"],
      ["Слабое место", "стыки между кусками", "края волос и свет"],
    ];
    return `<div class="xtw"><div class="r h"><div></div><div>Основной путь</div><div>Запасной путь</div></div>${rows.map((r) => `<div class="r">${r.map((c) => `<div>${c}</div>`).join("")}</div>`).join("")}</div>`;
  };
  const VIDEO_URL = "https://www.youtube.com/watch?v=DvRGamF7uRo&t=151";
  const shoot = (g, t) => `<div class="it"><span class="gi">${typeof g === "string" && X_PATH[g] ? XG(g, { c: NIGHT, w: 2.4 }) : G(g, { c: NIGHT, w: 2.4 })}</span><span>${t}</span></div>`;
  const ofPages = [
    {
      cls: "cream ls",
      html: `${xhead(OF)}${xwhen(" после урока 1.4, когда первый ролик собран и Higgsfield подключён (дополнение «Higgsfield» к уроку 1.4).")}
      ${result("вы говорите оффер на камеру своим голосом, а за вашей спиной по кирпичикам растёт здание. К последней фразе здание готово.", "Результат")}
      <div class="bd">
      <div class="xrow">
        <div style="flex:1.3">${xinfo("mic", "Что важно.", "Голос всегда ваш: звук берётся из вашей записи. Лицо модель старается сохранить, это проверяет проба на 3 секундах. Не сохранила: запасной путь, там видео с лицом никуда не загружается.")}</div>
        <div style="flex:1">${xinfo("clock", "Что понадобится:", "подключённый Higgsfield, петличный микрофон к телефону, 20–30 минут на съёмку. Один оффер на 40 секунд может забрать около 100 кредитов, это половина тарифа Starter.")}</div></div>
      <div><div class="hd" style="margin-bottom:8px"><span class="hi">${G("star", { c: NIGHT, w: 2.4 })}</span><span>5 ступеней под 5 фраз оффера</span></div>${frameRibbon()}</div></div>`,
    },
    {
      cls: "ls xc",
      html: `${xslim(OF)}<div class="bd">
      <div><div class="hd" style="margin-bottom:6px"><span class="hi">${XG("swap", { c: NIGHT, w: 2.4 })}</span><span>Два пути</span></div>${twoWays()}</div>
      <div class="xvid nb"><img class="glow" src="../img/glow-gold.png" alt=""><a class="qr" href="${VIDEO_URL}"><div class="sq"><img src="../img/qr-offer-video.svg" alt=""></div><span>Видео Higgsfield, с 2:31</span></a>
        <div class="tx"><b>Официальное видео Higgsfield</b>«I Mixed AI With Real Footage!», смотрите с <span class="t">2:31</span>, где меняют фон. Видео на английском, смотрите картинку. Premiere Pro из видео вам не нужен: склейку делает Монтажёр.</div></div>
      <div class="xshoot"><div class="hd" style="margin-bottom:6px"><span class="hi">${G("star", { c: NIGHT, w: 2.4 })}</span><span>Съёмка</span></div><div class="gr6">
        ${shoot("phone", "телефон вертикально на уровне глаз")}${shoot("mic", "петличный микрофон у ключиц")}${shoot("bulb", "свет спереди, мягкий")}
        ${shoot("image", "фон любой, но не пёстрый")}${shoot("pause", "между фразами пауза 1 секунда: по ней агент режет видео на куски")}${shoot("timer", "один дубль не длиннее минуты")}</div></div>
      ${xdfn("Сколько стоит.", "Точной цены замены фона Higgsfield не публикует. Наша оценка: около 100 кредитов за 40 секунд. Точная цена на пробе.")}</div>`,
    },
    {
      cls: "cream ls xc",
      html: `${xslim(OF)}<div class="bd">
      ${xyou([
        "Попросите Скриптолога оффер из 5 фраз: для кого, что предлагаете, как работает, что получит клиент, что сделать сейчас.",
        "Снимите себя по правилам съёмки.",
        "Скажите Монтажёру: «Сделай оффер со стройкой за спиной». Утвердите картинку готового здания.",
        "Посмотрите пробу на 3 секундах: лицо, руки, рот и края волос как в жизни? Да: скажите «делай остальное». Нет: скажите «Переходим на запасной путь». Агент поставит программу вырезки, вы только разрешаете. Без видеокарты Nvidia он сначала замерит 5 секунд и скажет, сколько ждать.",
        `Если агент скажет, что не нашёл инструмент замены фона: загрузите куски на ${xa("https://higgsfield.ai", "higgsfield.ai")} в «Change Background» сами, агент заберёт результат.`,
        "Правки давайте на доске раскадровки, например стрелкой «здание правее».",
      ])}
      ${agent([
        "режет видео по паузам на куски 3–10 секунд и сопоставляет фразы со ступенями стройки;",
        "рисует картинку готового здания как ориентир для всех кусков;",
        "меняет фон в Higgsfield после вашего «да» на цену;",
        "собирает ролик: звук только из вашей записи, общий цвет на стыках, субтитры, звуки стройки тише голоса;",
        "перед публикацией пишет, на каких площадках поставит метку ИИ.",
      ])}</div>`,
    },
    {
      cls: "ls xc",
      html: `${xslim(OF)}<div class="bd">
      ${rule("Сначала 3 секунды, потом весь ролик.", "отдали весь оффер, на пятом куске поплыло лицо, кредиты потрачены.", "проба на 3 секундах, проверили лицо и руки, потом остальные куски.")}
      ${errors([
        err("Лицо или руки меняются между кусками → куски короче, та же картинка-ориентир. Не помогло: запасной путь."),
        err("Здание в соседних кусках разное → одна картинка-ориентир и тот же свет в описании."),
        err("Видео длиннее 10 секунд не принимается → режьте по паузам на куски 3–10 секунд."),
      ])}
      ${xcant(["отправлять видео с вашим лицом в Seedance: его правила запрещают реальные лица; чужое лицо и голос без согласия; логотипы и вывески на здании; звук из результата Higgsfield (только ваша запись).", `Метка ИИ при публикации: ${AI_LABEL}`])}
      <div class="gr2">${done("на телефоне на каждом стыке лицо и здание не прыгают, голос ваш, к последней фразе здание готово, а агент написал, на каких площадках поставит метку ИИ.")}${phrase("Сделай оффер со стройкой за спиной: видео в Загрузках, файл [имя файла]. Сначала проба на 3 секундах и цена.")}</div></div>`,
    },
  ];

  return [
    { file: "1-4-dop-doska", title: "Дополнение к уроку 1.4. Доска раскадровки", pages: boardPages },
    { file: "1-4-dop-higgsfield", title: "Дополнение к уроку 1.4. Higgsfield", pages: hfPages },
    { file: "1-5-dop-tiktok-youtube-vremya", title: "Дополнение к урокам 1.5 и 2.2. TikTok, YouTube и время", pages: tiPages },
    { file: "2-3-dop-google-tablica", title: "Дополнение к уроку 2.3. Заявки строкой в Google Таблице", pages: gsPages },
    { file: "m3-offer-strojka", title: "Модуль 3. Оффер со стройкой", pages: ofPages },
  ];
}
