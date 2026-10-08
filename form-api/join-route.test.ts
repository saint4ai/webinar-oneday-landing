/**
 * Кнопки «Готово» и «Спасибо» по стране номера (workshop-montazh/assets/js/join.js, общий для окна на лендинге и thank-you.html).
 * Без браузера: join.js запускается в песочнице node:vm с подставным DOM, разметка и стили страниц проверяются по тексту.
 *   npx --yes tsx --test form-api/join-route.test.ts
 *
 *   +7 и вторая цифра 7 (Казахстан): первая WhatsApp, вторая Telegram, как раньше;
 *   +7 и вторая цифра не 7 (Россия) и любой другой код: первая и крупная Telegram, WhatsApp скромнее, под Telegram строка про перебои;
 *   номера нет: как раньше.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

const REPO = process.cwd();
const JOIN_JS = readFileSync(join(REPO, "workshop-montazh", "assets", "js", "join.js"), "utf8");
const INDEX = readFileSync(join(REPO, "workshop-montazh", "index.html"), "utf8");
const THANKS = readFileSync(join(REPO, "workshop-montazh", "thank-you.html"), "utf8");
const ROUTE_LINE = "В России WhatsApp работает с перебоями, ссылку на эфир пришлём в Telegram";
const LONG_DASH = String.fromCharCode(0x2014);

// ───────────────────────── подставной DOM ─────────────────────────

class Node {
  nodeType = 1;
  parentNode: Node | null = null;
  children: Node[] = [];
  attrs = new Map<string, string>();
  hidden = false;
  href = "";
  listeners = new Map<string, Array<(e: any) => void>>();
  [k: string]: any;
  constructor(public tag: string, attrs: Record<string, string> = {}) {
    for (const [k, v] of Object.entries(attrs)) this.attrs.set(k, v);
  }
  appendChild(c: Node) {
    this.children.push(c);
    c.parentNode = this;
    return c;
  }
  insertBefore(c: Node, ref: Node) {
    this.children = this.children.filter((x) => x !== c);
    this.children.splice(this.children.indexOf(ref), 0, c);
    c.parentNode = this;
    return c;
  }
  get firstElementChild() {
    return this.children[0] || null;
  }
  setAttribute(k: string, v: string) {
    this.attrs.set(k, String(v));
  }
  getAttribute(k: string) {
    return this.attrs.has(k) ? this.attrs.get(k)! : null;
  }
  addEventListener(t: string, fn: (e: any) => void) {
    this.listeners.set(t, [...(this.listeners.get(t) || []), fn]);
  }
  querySelectorAll(sel: string): Node[] {
    const m = /^\[data-join="([a-z]+)"\]$/.exec(sel);
    assert.ok(m, `подставной DOM понимает только [data-join="…"], а тут ${sel}`);
    const out: Node[] = [];
    const walk = (n: Node) => {
      for (const c of n.children) {
        if (c.attrs.get("data-join") === m![1]) out.push(c);
        walk(c);
      }
    };
    walk(this);
    return out;
  }
  querySelector(sel: string) {
    return this.querySelectorAll(sel)[0] || null;
  }
  get text() {
    return this.attrs.get("text") || "";
  }
}

/** Блок кнопок как в разметке страниц: две ячейки (WhatsApp, Telegram с пояснениями), подсказка про перебои ниже. */
function buildJoin() {
  const root = new Node("main");
  const box = root.appendChild(new Node("div", { class: "join" }));
  const waCell = box.appendChild(new Node("div"));
  const wa = waCell.appendChild(new Node("a", { "data-join": "wa" }));
  wa.href = "https://chat.whatsapp.com/IfLyJvWLo7HDq5yleoKCzz";
  const tgCell = box.appendChild(new Node("div"));
  const tg = tgCell.appendChild(new Node("a", { "data-join": "tg" }));
  const route = tgCell.appendChild(new Node("p", { "data-join": "tgroute" }));
  route.hidden = true;
  const hint = root.appendChild(new Node("p", { "data-join": "hint" }));
  return { root, box, waCell, tgCell, wa, tg, route, hint };
}

/** join.js в песочнице. phone: что лежит в sessionStorage под efirPhone (undefined: ничего). */
function loadJoin(phone?: string | null) {
  const session = new Map<string, string>();
  if (phone !== undefined && phone !== null) session.set("efirPhone", phone);
  const sandbox: any = {
    window: {},
    navigator: { userAgent: "Mozilla/5.0 (Linux; Android 14) Chrome/130" },
    sessionStorage: { getItem: (k: string) => (session.has(k) ? session.get(k)! : null), setItem: (k: string, v: string) => void session.set(k, v) },
    document: { documentElement: { contains: () => true }, querySelector: () => null },
    location: { href: "" },
    URL,
  };
  runInNewContext(JOIN_JS, sandbox);
  return { Join: sandbox.window.Join, session };
}

// ───────────────────────── определение страны ─────────────────────────

test("страна номера: +7 и вторая цифра 7 это Казахстан, остальные +7 это Россия, другие коды и записи без кода разобраны, непонятное остаётся «как раньше»", () => {
  const { Join } = loadJoin();
  assert.match(Join.version, /^\d{8}[a-z]$/);
  const route = (x: unknown) => Join.build.phoneRoute(x);
  // Казахстан: +7, вторая цифра 7 (любой способ записи)
  for (const kz of ["+7 701 234 56 78", "+77012345678", "8 701 234 56 78", "87012345678", "7012345678", "701 234 56 78", "+7 (777) 123-45-67", "+7 708 583 45 75", "+7 727 123 45 67", "+7 747 123 45 67", "+7 775 123 45 67"]) {
    assert.equal(route(kz), "kz", kz);
  }
  // Россия: +7, вторая цифра не 7
  for (const ru of ["+7 916 123 45 67", "89161234567", "+7 (495) 123-45-67", "9161234567", "+7 999 000 00 00", "+7 812 123 45 67"]) {
    assert.equal(route(ru), "ru", ru);
  }
  // все остальные коды
  for (const other of ["+380 67 123 45 67", "+49 151 1234 5678", "+1 202 555 0123", "+44 7911 123456", "+998 90 123 45 67", "+375 29 123 45 67", "+996 555 123 456", "+971 50 123 4567"]) {
    assert.equal(route(other), "other", other);
  }
  // номера нет или он непонятен: как раньше
  for (const none of ["", null, undefined, "123", "abc", "+7 701", "2025550123", "1".repeat(16), "+7 701 234 56 78 90 12 34 56"]) {
    assert.equal(route(none), "", String(none));
  }
  // Telegram первым у России и других кодов, WhatsApp первым у Казахстана и без номера
  assert.deepEqual(["kz", "ru", "other", ""].map((r) => Join.build.tgFirst(r)), [false, true, true, false]);
});

// ───────────────────────── порядок кнопок ─────────────────────────

test("порядок кнопок: Казахстан и без номера WhatsApp первый, Россия и другие коды Telegram первый со строкой про перебои; смена номера возвращает порядок", () => {
  const order = (b: ReturnType<typeof buildJoin>) => b.box.children.map((c) => (c === b.waCell ? "wa" : "tg")).join(",");
  // Казахстан и «номера нет»: порядок как в разметке, строка про Россию спрятана, прежняя подсказка видна
  for (const phone of ["+7 701 234 56 78", undefined, ""]) {
    const b = buildJoin();
    const { Join } = loadJoin(phone);
    const inst = Join.mount(b.root, { src: "ty" });
    assert.equal(order(b), "wa,tg", String(phone));
    assert.equal(b.box.getAttribute("data-route"), "wa");
    assert.deepEqual([b.route.hidden, b.hint.hidden], [true, false]);
    assert.equal(inst.route, phone === "+7 701 234 56 78" ? "kz" : "");
  }
  // Россия и другие коды: Telegram первый, строка под его кнопкой показана, старая подсказка спрятана (она о том же)
  for (const phone of ["+7 916 123 45 67", "+380 67 123 45 67", "+1 202 555 0123", "89161234567"]) {
    const b = buildJoin();
    const { Join } = loadJoin(phone);
    Join.mount(b.root, { src: "pp" });
    assert.equal(order(b), "tg,wa", phone);
    assert.equal(b.box.getAttribute("data-route"), "tg");
    assert.deepEqual([b.route.hidden, b.hint.hidden], [false, true]);
    assert.equal(b.route.parentNode, b.tgCell, "строка стоит под кнопкой Telegram, в её ячейке");
    // обе кнопки на месте и ведут туда же, куда вели
    assert.equal(b.wa.href, "https://chat.whatsapp.com/IfLyJvWLo7HDq5yleoKCzz");
    assert.equal(b.tg.href, "https://t.me/workshop_aiprod_bot?start=pp");
  }
  // «Записать другого человека»: в том же окне другой номер, повторный mount ставит порядок заново, ничего не дублируя
  const b = buildJoin();
  const { Join, session } = loadJoin("+7 916 123 45 67");
  Join.mount(b.root, { src: "pp" });
  assert.equal(order(b), "tg,wa");
  session.set("efirPhone", "+7 777 123 45 67");
  Join.mount(b.root, { src: "pp" });
  assert.equal(order(b), "wa,tg");
  assert.deepEqual([b.route.hidden, b.hint.hidden, b.box.children.length], [true, false, 2]);
  session.set("efirPhone", "+49 151 1234 5678");
  Join.mount(b.root, { src: "pp" });
  assert.equal(order(b), "tg,wa");
  // повторный вызов с тем же маршрутом порядок не трогает
  Join.build.applyRoute(b.root, "other");
  assert.equal(order(b), "tg,wa");
  // страница без блока кнопок или без строк-пояснений не падает
  const bare = new Node("main");
  assert.doesNotThrow(() => Join.build.applyRoute(bare, "ru"));
});

// ───────────────────────── разметка страниц и вёрстка ─────────────────────────

for (const [name, html, cls] of [["thank-you.html", THANKS, { box: "join", note: "tgnote", route: "tgroute", hint: "alarm-hint", mobile: 640 }], ["index.html (окно «Готово»)", INDEX, { box: "dn-join", note: "dn-note", route: "dn-route", hint: "dn-hint", mobile: 0 }]] as const) {
  test(`${name}: тексты кнопок прежние, строка про Россию под Telegram и скрыта по умолчанию, порядок в разметке прежний, стили держат 360 до 430 px`, () => {
    // тексты кнопок не меняются
    assert.equal(html.split("<span>Подключиться к воркшопу в WhatsApp</span>").length - 1, 1);
    assert.equal(html.split("<span>Подключиться к воркшопу в Telegram</span>").length - 1, 1);
    assert.ok(html.includes("В Telegram нажмите «Запустить»"));
    // по умолчанию (номера нет, Казахстан) WhatsApp первая, Telegram вторая
    const waAt = html.indexOf('data-join="wa"');
    const tgAt = html.indexOf('data-join="tg"');
    assert.ok(waAt > 0 && tgAt > waAt, "WhatsApp идёт первой в разметке");
    // строка про Россию: ровно одна, в ячейке Telegram после пояснения про «Запустить», скрыта, текст дословно
    const line = new RegExp(`<p class="${cls.route}" data-join="tgroute" hidden>${ROUTE_LINE}</p>`);
    assert.equal((html.match(new RegExp(ROUTE_LINE, "g")) || []).length, 1);
    assert.match(html, line);
    const cell = html.slice(tgAt, html.indexOf("</div>", tgAt));
    assert.ok(cell.includes(`<p class="${cls.note}">В Telegram нажмите «Запустить»</p><p class="${cls.route}" data-join="tgroute" hidden>`), "строка стоит сразу под пояснением в ячейке Telegram");
    // прежняя подсказка помечена, чтобы её можно было спрятать
    assert.ok(html.includes(`<p class="${cls.hint}" data-join="hint">Из России или WhatsApp работает с перебоями? Выбирайте Telegram.</p>`));
    // стили: Telegram крупнее, WhatsApp скромнее и без пульсации
    assert.match(html, new RegExp(`\\.${cls.box}\\[data-route="tg"\\] \\.gbtn-tg\\{min-height:6\\d+px;font-size:\\d+px\\}`));
    assert.match(html, new RegExp(`\\.${cls.box}\\[data-route="tg"\\] \\.gbtn-wa\\{[^}]*box-shadow:none;animation:none\\}`));
    // вёрстка на 360 до 430 px: высота кнопок только минимальная, текст переносится, строка не вылезает, фиксированных ширин нет
    const rules = [...html.matchAll(/(\.gbtn[^{]*|\.tgroute|\.dn-route|\.join\[data-route="tg"\][^{]*|\.dn-join\[data-route="tg"\][^{]*)\{([^}]*)\}/g)].filter((m) => !/svg/.test(m[1])).map((m) => `${m[1]}{${m[2]}}`);
    assert.ok(rules.length >= 6);
    for (const r of rules) {
      assert.equal(/[^-]width:\s*\d+px/.test(r), false, `фиксированная ширина в ${r}`);
      assert.equal(/[^-]height:\s*\d+px/.test(r), false, `фиксированная высота в ${r}`);
      assert.equal(/white-space:\s*nowrap/.test(r), false, `текст не переносится в ${r}`);
    }
    assert.match(html, /\.gbtn span\{min-width:0\}/, "текст в кнопке сжимается и переносится");
    assert.match(html, new RegExp(`\\.${cls.route}\\{[^}]*overflow-wrap:anywhere`), "строка про Россию переносится");
    assert.match(html, new RegExp(`\\.${cls.route}\\[hidden\\]\\{display:none\\}`), "hidden действует и при display в стилях");
    // длинного тире в новых строках нет
    assert.equal(ROUTE_LINE.includes(LONG_DASH), false);
  });
}

test("thank-you.html: на телефоне (до 640 px) кнопки в один столбец и в режиме Telegram, на широком экране Telegram получает больше места", () => {
  assert.match(THANKS, /\.join\[data-route="tg"\]\{grid-template-columns:minmax\(0,1\.5fr\) minmax\(0,1fr\)\}/);
  const mobile = THANKS.slice(THANKS.indexOf("@media (max-width:640px){"));
  assert.match(mobile, /\.join,\.join\[data-route="tg"\]\{grid-template-columns:1fr;gap:10px/, "в узком окне одна колонка и при Telegram первым");
  assert.match(mobile, /\.join\[data-route="tg"\] \.gbtn-tg\{min-height:64px;font-size:19px\}/);
  assert.match(mobile, /\.join\[data-route="tg"\] \.gbtn-wa\{min-height:50px;font-size:15px\}/);
  // в окне лендинга колонка всегда одна, поэтому отдельной правки сетки там не нужно
  assert.match(INDEX, /\.dn-join\{display:grid;gap:10px;margin-top:12px\}/);
  assert.equal(/\.dn-join\{[^}]*grid-template-columns/.test(INDEX), false);
});

test("лендинг: номер из формы запоминается рядом с именем, фокус уходит на первую кнопку по порядку на экране, номер не попадает в адреса", () => {
  assert.ok(INDEX.includes("sessionStorage.setItem('efirName',name.value.trim()); sessionStorage.setItem('efirPhone',phone.value.trim()); sessionStorage.setItem('efirEid',id);"));
  assert.equal(INDEX.includes("paneDone.querySelector('[data-join=\"wa\"]')"), false, "фокус не привязан к WhatsApp");
  assert.equal((INDEX.match(/paneDone\.querySelector\('\.gbtn'\)/g) || []).length, 2, "фокус на первой кнопке при показе после заявки и при повторном открытии");
  // join.js читает номер только из sessionStorage и никуда его не отправляет
  assert.equal((JOIN_JS.match(/getItem\('efirPhone'\)/g) || []).length, 1, "номер читается из sessionStorage в одном месте");
  assert.equal((JOIN_JS.match(/readPhone\(\)/g) || []).length, 2, "определение функции и один вызов");
  assert.ok(JOIN_JS.includes("inst.route = phoneRoute(readPhone());"), "номер идёт только в определение страны");
});

test("версия join.js поднята везде: модуль, обе страницы и значение по умолчанию в deploy-landing.sh совпадают (кеш браузеров не держит старый порядок кнопок)", () => {
  const v = /var VERSION = '([0-9a-z]+)'/.exec(JOIN_JS)![1];
  assert.notEqual(v, "20261006b");
  for (const html of [INDEX, THANKS]) {
    assert.ok(html.includes(`assets/js/join.js?v=${v}`));
    assert.ok(html.includes(`efir.js?v=${v}`));
  }
  assert.ok(readFileSync(join(REPO, "scripts", "deploy-landing.sh"), "utf8").includes(`V="\${V:-${v}}"`));
  assert.equal(JOIN_JS.includes(LONG_DASH), false, "в join.js нет длинного тире");
});
