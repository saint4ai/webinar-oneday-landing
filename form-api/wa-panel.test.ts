/**
 * Вкладка «WhatsApp» в админке (form-api/admin-app.html) без браузера: настоящий скрипт страницы запускается в песочнице node:vm
 * с подставным DOM, а его запросы /admin/wa/* отвечают настоящие функции модуля (wa-groups.ts) поверх подставного Evolution.
 * Проверяется то, что видит человек: блок «Статус WhatsApp» первым, цвет и слова состояния, какие кнопки есть при подключённом
 * и отключённом номере, поле номера и код группами по 4, автообновление раз в 15 секунд. Запуск:
 *   npx --yes tsx --test form-api/wa-panel.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { EVO_KEY, evo, tg } from "./wa-testkit";
import { initWaGroups, resetWaGroups, waConnection, waGroups, waLogout, waPairing, waPanel, waQr, waStatus } from "./wa-groups";
import { setUtcOffsetMinutes } from "./tg-time";

process.env.EVOLUTION_API_KEY = EVO_KEY;
delete process.env.EVOLUTION_INSTANCE;
delete process.env.WA_GROUPS;
delete process.env.WA_ADMIN_NUMBERS;

const REPO = process.cwd();
const alm = (y: number, m: number, d: number, h: number, mi = 0) => Date.UTC(y, m - 1, d, h - 5, mi);
const clock = { t: alm(2026, 10, 8, 12, 0) };

// ───────────────────────── подставной DOM ─────────────────────────

class Txt {
  nodeType = 3;
  parentNode: El | null = null;
  constructor(public data: string) {}
  get textContent() {
    return this.data;
  }
}
class El {
  nodeType = 1;
  parentNode: El | null = null;
  attrs = new Map<string, string>();
  children: Array<El | Txt> = [];
  listeners = new Map<string, Array<(e: any) => void>>();
  className = "";
  hidden = false;
  value = "";
  disabled = false;
  style = { setProperty() {}, removeProperty() {} };
  private own = "";
  constructor(public tag: string) {}
  get textContent(): string {
    return this.own + this.children.map((c) => c.textContent).join("");
  }
  set textContent(v: string) {
    this.children = [];
    this.own = String(v);
  }
  get classList() {
    const self = this;
    return {
      toggle(c: string, on?: boolean) {
        const set = new Set(self.className.split(/\s+/).filter(Boolean));
        if (on === undefined ? !set.has(c) : on) set.add(c);
        else set.delete(c);
        self.className = [...set].join(" ");
      },
      add(c: string) {
        this.toggle(c, true);
      },
      remove(c: string) {
        this.toggle(c, false);
      },
      contains: (c: string) => self.className.split(/\s+/).includes(c),
    };
  }
  appendChild(c: El | Txt) {
    this.children.push(c);
    c.parentNode = this;
    return c;
  }
  setAttribute(k: string, v: string) {
    this.attrs.set(k, String(v));
    if (k === "class") this.className = String(v);
    if (k === "value") this.value = String(v);
    if (k === "disabled") this.disabled = true;
  }
  getAttribute(k: string) {
    return this.attrs.has(k) ? this.attrs.get(k)! : null;
  }
  removeAttribute(k: string) {
    this.attrs.delete(k);
  }
  addEventListener(t: string, fn: (e: any) => void) {
    this.listeners.set(t, [...(this.listeners.get(t) || []), fn]);
  }
  dispatch(t: string, extra: Record<string, unknown> = {}) {
    for (const fn of this.listeners.get(t) || []) fn.call(this, { target: this, preventDefault() {}, ...extra });
  }
  contains(o: unknown): boolean {
    return o === this || this.children.some((c) => c instanceof El && c.contains(o));
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
  focus() {}
  blur() {}
  select() {}
  scrollIntoView() {}
}

const all = (root: El | Txt, pred: (e: El) => boolean = () => true): El[] => {
  if (!(root instanceof El)) return [];
  return [...(pred(root) ? [root] : []), ...root.children.flatMap((c) => all(c, pred))];
};
const hasClass = (e: El, c: string) => e.className.split(/\s+/).includes(c);

type Fetched = { url: string; method: string; body: any };

/** Страница в песочнице: вкладка «WhatsApp» уже выбрана, сессия есть, запросы идут в модуль. */
function loadPanel() {
  const html = readFileSync(join(REPO, "form-api", "admin-app.html"), "utf8");
  const scripts = [...html.matchAll(/<script\b[^>]*nonce="__NONCE__"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((x) => x.trim());
  assert.equal(scripts.length, 1);
  const els = new Map<string, El>();
  const byId = (id: string) => {
    if (!els.has(id)) els.set(id, new El("div"));
    return els.get(id)!;
  };
  const doc: any = {
    getElementById: byId,
    createElement: (t: string) => new El(t),
    createElementNS: (_n: string, t: string) => new El(t),
    createTextNode: (s: string) => new Txt(s),
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener() {},
    documentElement: new El("html"),
    body: new El("body"),
    activeElement: null,
    visibilityState: "visible",
    execCommand: () => false,
  };
  const intervals: Array<{ fn: () => void; ms: number; cleared: boolean }> = [];
  const store = new Map<string, string>([["adm_token", "t.k"], ["adm_ui", JSON.stringify({ period: "t", from: "", to: "", basis: "reg", tab: "wa" })]]);
  const fetched: Fetched[] = [];
  let pending = 0;
  const route = async (path: string, init: any): Promise<{ status: number; body: any }> => {
    const body = init?.body ? JSON.parse(init.body) : {};
    const res = (x: any) => ({ status: x && x.ok === false ? 409 : 200, body: x });
    switch (path) {
      case "wa/state":
        return res(waPanel(clock.t));
      case "wa/status":
        return res(await waStatus());
      case "wa/connection":
        return res(await waConnection());
      case "wa/qr":
        return res(await waQr());
      case "wa/pairing":
        return res(await waPairing(body.number));
      case "wa/logout":
        return res(body.confirm === true ? await waLogout() : { ok: false, code: "confirm", message: "Нужно подтверждение действия." });
      case "wa/groups":
        return res(await waGroups());
    }
    return { status: 404, body: { ok: false, error: "not_found" } };
  };
  const win: any = {
    Telegram: { WebApp: { initData: "signed-init-data", themeParams: {}, colorScheme: "light", ready() {}, expand() {}, onEvent() {} } },
    scrollY: 0,
    scrollTo() {},
    addEventListener() {},
  };
  const sandbox: any = {
    window: win,
    document: doc,
    location: { pathname: "/workshop/api/admin-app" },
    sessionStorage: { getItem: (k: string) => (store.has(k) ? store.get(k)! : null), setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) },
    navigator: {},
    URLSearchParams,
    console,
    fetch: (url: string, init: any = {}) => {
      const path = String(url).replace("/workshop/api/admin/", "").split("?")[0];
      fetched.push({ url: String(url), method: init.method || "GET", body: init.body ? JSON.parse(init.body) : null });
      pending++;
      return route(path, init).then((r) => ({ ok: r.status < 400, status: r.status, json: async () => r.body })).finally(() => void pending--);
    },
    setInterval: (fn: () => void, ms: number) => intervals.push({ fn, ms, cleared: false }),
    clearInterval: (id: number) => {
      if (intervals[id - 1]) intervals[id - 1].cleared = true;
    },
    setTimeout: () => 0,
    clearTimeout() {},
  };
  win.document = doc;
  runInNewContext(scripts[0], sandbox);
  /** Дождаться ответов на все запросы страницы. */
  const settle = async () => {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 10));
      if (!pending) {
        await new Promise((r) => setTimeout(r, 10));
        if (!pending) return;
      }
    }
    assert.fail("запросы страницы не завершились");
  };
  /** Сработать интервалу с таким периодом (часы модуля сдвигаются, чтобы кеш статуса не мешал). */
  const tick = async (ms: number) => {
    clock.t += 4000;
    const live = intervals.filter((i) => i.ms === ms && !i.cleared);
    assert.ok(live.length > 0, `есть таймер на ${ms} мс`);
    live.forEach((i) => i.fn());
    await settle();
  };
  const view = byId("view");
  const cards = () => view.children.filter((c): c is El => c instanceof El && hasClass(c, "card"));
  const buttons = () => all(view, (e) => e.tag === "button").map((b) => b.textContent);
  const button = (text: string) => {
    const b = all(view, (e) => e.tag === "button" && e.textContent === text)[0];
    assert.ok(b, `кнопка «${text}» есть; сейчас: ${buttons().join(" | ")}`);
    return b;
  };
  return { view, cards, buttons, button, settle, tick, fetched, intervals, text: () => view.textContent, byId };
}

test.before(async () => {
  await tg.start();
  await evo.start();
  setUtcOffsetMinutes(300);
});
test.after(async () => {
  resetWaGroups();
  await tg.stop();
  await evo.stop();
  assert.deepEqual(evo.violations, [], "защита номера цела");
});
test.beforeEach(() => {
  evo.reset();
  clock.t = alm(2026, 10, 8, 12, 0);
  resetWaGroups();
  initWaGroups({ dir: mkdtempSync(join(tmpdir(), "wa-panel-")), seriesFile: join(REPO, "form-api", "wa-series.json"), deps: { now: () => clock.t, sleep: async () => {}, rand: () => 0.5, notify: async () => 1 } });
});

const PAIR_STEPS = "WhatsApp на телефоне → Настройки → Связанные устройства → Привязать устройство → Привязать по номеру телефона → ввести код";

test("панель: «Статус WhatsApp» первым блоком; подключён: зелёный, номер закрыт, кнопки подключения спрятаны, вместо них «Отключить номер» с подтверждением в странице", async () => {
  const p = loadPanel();
  await p.settle();
  const first = p.cards()[0];
  assert.match(first.textContent, /^Статус WhatsApp/);
  const box = all(first, (e) => hasClass(e, "wst"))[0];
  assert.ok(box && hasClass(box, "ok"), "зелёный блок");
  assert.match(box.textContent, /Подключён/);
  assert.match(first.textContent, /Номер7700\*\*\*2233/);
  assert.match(first.textContent, /ПрофильТест/);
  assert.match(first.textContent, /Подключён с08\.10 в 12:00/);
  assert.equal(p.text().includes("77001112233"), false, "полный номер на экране не показываем");
  assert.deepEqual(p.buttons().filter((b) => /QR|код|Отключить|Проверить/.test(b)), ["Проверить сейчас", "Отключить номер"]);
  assert.equal(p.cards().some((c) => /Подключить по номеру телефона/.test(c.textContent)), false, "подключён: поле номера спрятано");
  // автообновление: статус раз в 15 секунд, остальной экран раз в 20
  assert.deepEqual(p.intervals.filter((i) => !i.cleared).map((i) => i.ms).sort((a, b) => a - b), [15000, 20000]);
  // «Отключить номер» спрашивает подтверждение внутри страницы (confirm() в песочнице нет, вызов упал бы), без подтверждения запроса нет
  const before = p.fetched.length;
  p.button("Отключить номер").dispatch("click");
  assert.equal(p.fetched.length, before);
  const dlg = all(p.view, (e) => e.attrs.get("role") === "alertdialog")[0];
  assert.ok(dlg, "подтверждение в странице");
  assert.match(dlg.textContent, /Отключить номер\?/);
  p.button("Да, отключить").dispatch("click");
  await p.settle();
  const logout = p.fetched.filter((f) => f.url.endsWith("wa/logout"));
  assert.equal(logout.length, 1);
  assert.equal(logout[0].body.confirm, true);
  assert.equal(evo.logouts, 1);
  // после отключения: статус красный, подключение предлагается двумя способами
  const st = p.cards()[0];
  assert.ok(hasClass(all(st, (e) => hasClass(e, "wst"))[0], "bad"));
  assert.ok(p.buttons().includes("Подключить по QR"));
  assert.ok(p.cards().some((c) => /Подключить по номеру телефона/.test(c.textContent)));
  assert.ok(p.buttons().includes("Получить код"));
});

test("панель: заблокирован, logout, Evolution не отвечает: слова и цвет по состоянию; у «не отвечает» кнопок подключения нет", async () => {
  const p = loadPanel();
  await p.settle();
  const status = () => {
    const box = all(p.cards()[0], (e) => hasClass(e, "wst"))[0];
    return { title: all(box, (e) => hasClass(e, "wst-t"))[0].textContent, cls: box.className, text: box.textContent };
  };
  evo.disconnectWith(403, "Forbidden");
  await p.tick(15000);
  assert.equal(status().title, "Номер заблокирован WhatsApp");
  assert.match(status().cls, /\bbad\b/);
  assert.ok(p.buttons().includes("Подключить по QR"), "заблокированный номер можно заменить другим");
  evo.disconnectWith(401, "Logged Out");
  await p.tick(15000);
  assert.equal(status().title, "Номер вышел из устройства (logout), нужно подключить заново");
  evo.state = "connecting";
  evo.disconnect = null;
  await p.tick(15000);
  assert.equal(status().title, "Ждёт подключения");
  assert.match(status().cls, /\bwait\b/);
  const saved = process.env.EVOLUTION_URL;
  process.env.EVOLUTION_URL = "http://127.0.0.1:1";
  await p.tick(15000);
  process.env.EVOLUTION_URL = saved;
  assert.equal(status().title, "Evolution не отвечает");
  assert.match(status().cls, /\bbad\b/);
  assert.deepEqual(p.buttons().filter((b) => /QR|код/.test(b)), [], "Evolution молчит: подключать нечем");
  // кнопка «Проверить сейчас» перечитывает состояние сразу
  evo.state = "open";
  clock.t += 4000;
  const calls = p.fetched.length;
  p.button("Проверить сейчас").dispatch("click");
  await p.settle();
  assert.ok(p.fetched.slice(calls).some((f) => f.url.endsWith("wa/status")));
  assert.equal(status().title, "Подключён");
});

test("панель: подключение по номеру: поле пустое и принимает только цифры, код группами по 4 с инструкцией, «Новый код», номер не в адресе и не на экране, готово после ввода кода", async () => {
  evo.state = "close";
  const p = loadPanel();
  await p.settle();
  const card = () => p.cards().find((c) => /^Подключить по номеру телефона/.test(c.textContent))!;
  assert.ok(card());
  const input = all(card(), (e) => e.tag === "input")[0];
  assert.deepEqual([input.value, input.getAttribute("value")], ["", ""], "по умолчанию пусто");
  assert.equal(input.getAttribute("inputmode"), "numeric");
  assert.equal(input.getAttribute("maxlength"), "15");
  assert.equal(input.getAttribute("autocomplete"), "off");
  // слишком короткий номер: запроса нет, подсказка на месте
  input.value = "123";
  input.dispatch("input");
  const n0 = p.fetched.length;
  p.button("Получить код").dispatch("click");
  assert.equal(p.fetched.length, n0);
  assert.match(card().textContent, /только цифры, от 11 до 15, с кодом страны/);
  // ввод с плюсом, пробелами и скобками превращается в цифры
  const input2 = all(card(), (e) => e.tag === "input")[0];
  input2.value = "+44 (7911) 123-456";
  input2.dispatch("input");
  assert.equal(input2.value, "447911123456");
  p.button("Получить код").dispatch("click");
  await p.settle();
  const req = p.fetched.filter((f) => f.url.endsWith("wa/pairing"));
  assert.equal(req.length, 1);
  assert.deepEqual(req[0].body, { number: "447911123456" });
  assert.equal(p.fetched.some((f) => /4479111/.test(f.url)), false, "номер не в адресе запроса");
  const code = all(card(), (e) => hasClass(e, "paircode"))[0];
  assert.equal(code.textContent, "PC01-3456", "восемь знаков группами по 4");
  assert.equal(code.getAttribute("aria-label"), "Код: P C 0 1 3 4 5 6");
  assert.ok(card().textContent.includes(PAIR_STEPS));
  assert.match(card().textContent, /Код действует ещё около \d+ с\./);
  assert.match(card().textContent, /Номер: 4479\*\*\*3456/);
  assert.equal(p.text().includes("447911123456"), false, "полный номер на экране не показываем");
  assert.ok(p.buttons().includes("Новый код"));
  assert.equal(p.buttons().includes("Получить код"), false);
  // «Новый код» сразу после первого: сервер отдаёт тот же код и говорит, когда будет новый
  p.button("Новый код").dispatch("click");
  await p.settle();
  assert.match(card().textContent, /Код ещё действует\. Новый можно получить через/);
  // за кодом следит проверка подключения раз в 3,5 секунды; человек ввёл код на телефоне
  assert.ok(p.intervals.some((i) => i.ms === 3500 && !i.cleared));
  evo.scan();
  await p.tick(3500);
  assert.match(p.text(), /Номер подключён\./);
  assert.equal(p.cards().some((c) => /^Подключить по номеру телефона/.test(c.textContent)), false, "подключились: поле и код убраны");
  assert.equal(p.intervals.some((i) => i.ms === 3500 && !i.cleared), false, "частая проверка остановлена");
  assert.match(p.cards()[0].textContent, /Подключён/);
  assert.ok(p.buttons().includes("Отключить номер"));
});
