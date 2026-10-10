/**
 * Вкладка «WhatsApp» в админке (form-api/admin-app.html) без браузера: настоящий скрипт страницы запускается в песочнице node:vm
 * с подставным DOM, а его запросы /admin/wa/* отвечают настоящие функции модуля (wa-groups.ts) поверх подставного Evolution.
 * Проверяется то, что видит человек: блок «Статус WhatsApp» первым, цвет и слова состояния, какие кнопки есть при подключённом
 * и отключённом номере, поле номера и код группами по 4, автообновление раз в 15 секунд. Запуск:
 *   npx --yes tsx --test form-api/wa-panel.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { EVO_KEY, evo, openai, OPENAI_KEY, TPL_LINK, TPL_REMINDER, tg, wazzup, WZ_CHANNEL, WZ_KEY } from "./wa-testkit";
import { aiFlush, aiHookBody, aiNumber, aiSetEnabled, aiTest } from "./wa-assistant";
import { dzHookSet, dzSave, dzSetEnabled, dzTemplates, dzTestSend } from "./wa-dozhim";
import { initWaGroups, resetWaGroups, waConnection, waEventCreateNow, waEventLaunch, waGroups, waLogout, waPairing, waPanel, waPause, waQr, waResume, waSetEvent, waSetMode, waStatus } from "./wa-groups";
import { automationView } from "./automation-admin";
import { resetAutomation, setAutomation } from "./automation";
import { switchAutomation } from "./tg-workshop";
import { setUtcOffsetMinutes } from "./tg-time";

process.env.EVOLUTION_API_KEY = EVO_KEY;
process.env.WAZZUP_API_KEY = WZ_KEY;
process.env.WAZZUP_CHANNEL_ID = WZ_CHANNEL;
process.env.WAZZUP_HOOK_URL = "http://127.0.0.1:1/api/wazzup-hook";
delete process.env.WAZZUP_HOOK_SECRET;
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
/** Подмена ответа wa/state в одном тесте: например, подставить «вступили N из M» без бота и заявок. */
let stateHook: ((s: any) => void) | null = null;

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
  const route = async (path: string, init: any, rawUrl = ""): Promise<{ status: number; body: any }> => {
    const body = init?.body ? JSON.parse(init.body) : {};
    const res = (x: any) => ({ status: x && x.ok === false ? 409 : 200, body: x });
    switch (path) {
      case "wa/state": {
        const st = waPanel(clock.t) as any;
        stateHook?.(st);
        return res(st);
      }
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
      case "wa/ai/toggle":
        return res(body.enabled === false || body.confirm === true ? await aiSetEnabled(body.enabled) : { ok: false, code: "confirm", message: "Нужно подтверждение действия." });
      case "wa/ai/test":
        return res(await aiTest(body.question));
      case "wa/ai/number":
        return res(aiNumber(new URL(rawUrl, "http://x").searchParams.get("id")));
      case "wa/dozhim/templates":
        return res(await dzTemplates(new URL(rawUrl, "http://x").searchParams.get("refresh") === "1"));
      case "wa/dozhim/toggle":
        return res(body.enabled === false || body.confirm === true ? await dzSetEnabled(body.enabled) : { ok: false, code: "confirm", message: "Нужно подтверждение действия." });
      case "wa/dozhim/save":
        return res(await dzSave(body));
      case "wa/dozhim/hook":
        return res(body.on === false || body.confirm === true ? await dzHookSet(body.on) : { ok: false, code: "confirm", message: "Нужно подтверждение действия." });
      case "wa/dozhim/test":
        return res(body.confirm === true ? await dzTestSend(body.number) : { ok: false, code: "confirm", message: "Нужно подтверждение действия." });
      case "wa/event/launch":
        return res(body.confirm === true ? waEventLaunch(clock.t) : { ok: false, code: "confirm", message: "Нужно подтверждение действия." });
      case "automation": {
        if (init?.method !== "POST") return res(automationView());
        if (typeof body.on !== "boolean" || body.confirm !== true) return { status: 400, body: { ok: false, code: "confirm", message: "Нужно подтверждение действия." } };
        const r = await switchAutomation(body.on, "из админки, id 1", String(body.reason || "вручную, из админки"));
        return res({ ...automationView(), changed: r.changed, message: r.changed ? (body.on ? "Автоматизация включена." : "Автоматизация выключена.") : r.text });
      }
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
      return route(path, init, String(url)).then((r) => ({ ok: r.status < 400, status: r.status, json: async () => r.body })).finally(() => void pending--);
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
  await openai.start();
  await wazzup.start();
  setUtcOffsetMinutes(300);
});
test.after(async () => {
  resetWaGroups();
  await tg.stop();
  await evo.stop();
  await openai.stop();
  await wazzup.stop();
  assert.deepEqual(evo.violations, [], "защита номера цела");
});
test.beforeEach(() => {
  stateHook = null;
  evo.reset();
  openai.reset();
  wazzup.reset();
  process.env.OPENAI_API_KEY = OPENAI_KEY;
  process.env.WA_AI_QUIET_MS = "100000";
  clock.t = alm(2026, 10, 8, 12, 0);
  resetAutomation();
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

test("панель: блок «ИИ-ассистент в личке»: выключатель с подтверждением, счётчики, проверка вопроса, диалоги с закрытыми номерами и «Показать номер»", async () => {
  const p = loadPanel();
  await p.settle();
  const card = () => p.cards().find((c) => /^ИИ-ассистент в личке/.test(c.textContent))!;
  assert.ok(card(), "блок есть");
  const sw = () => all(card(), (e) => e.attrs.get("role") === "switch")[0];
  assert.equal(sw().attrs.get("aria-checked"), "false");
  assert.match(card().textContent, /Выключен: вебхука нет, запросов к OpenAI нет/);
  assert.match(card().textContent, /Диалогов сегодня0/);
  assert.match(card().textContent, /Отклонено проверкой0/);
  assert.match(card().textContent, /Диалогов пока нет/);

  // включение: подтверждение в странице, без подтверждения запроса нет
  sw().dispatch("click");
  assert.equal(p.fetched.filter((f) => f.url.endsWith("wa/ai/toggle")).length, 0);
  assert.match(card().textContent, /Включить ИИ-ассистента\? Он начнёт отвечать всем/);
  p.button("Включить").dispatch("click");
  await p.settle();
  const toggles = p.fetched.filter((f) => f.url.endsWith("wa/ai/toggle"));
  assert.deepEqual(toggles.map((t) => t.body), [{ enabled: true, confirm: true }]);
  assert.equal(sw().attrs.get("aria-checked"), "true");
  assert.equal(evo.webhook?.enabled, true);

  // проверка вопроса: ответ модели на экране, в WhatsApp ничего не уходит
  const input = all(card(), (e) => e.tag === "input")[0];
  input.value = "Что будет на эфире?";
  input.dispatch("input");
  p.button("Спросить").dispatch("click");
  await p.settle();
  assert.deepEqual(p.fetched.filter((f) => f.url.endsWith("wa/ai/test")).map((f) => f.body), [{ question: "Что будет на эфире?" }]);
  assert.match(card().textContent, /Здравствуйте! Эфир каждый день в 20:00 по Алматы/);
  assert.match(card().textContent, /Ответ прошёл проверку/);
  assert.equal(evo.of("/message").length, 0);

  // диалоги: человек написал, ассистент ответил; номер закрыт, по кнопке показывается целиком
  await waStatus();
  evo.allowDirect = true;
  aiHookBody({ event: "messages.upsert", instance: "workshop", data: { key: { remoteJid: "77015556677@s.whatsapp.net", fromMe: false, id: "P1" }, message: { conversation: "Когда начало?" }, messageTimestamp: Math.floor(clock.t / 1000) } });
  await aiFlush();
  assert.equal(evo.directs.length, 1);
  await p.tick(20000);
  assert.match(card().textContent, /Диалогов сегодня1/);
  assert.match(card().textContent, /Ответов сегодня1/);
  assert.match(card().textContent, /7701\*\*\*6677/);
  assert.match(card().textContent, /Человек: Когда начало\?/);
  assert.match(card().textContent, /Ассистент: Здравствуйте!/);
  assert.equal(p.text().includes("77015556677"), false, "полного номера на экране нет");
  p.button("Показать номер").dispatch("click");
  await p.settle();
  assert.match(card().textContent, /\+77015556677/);
  const urls = p.fetched.filter((f) => /wa\/ai\/number/.test(f.url));
  assert.equal(urls.length, 1);
  assert.match(urls[0].url, /\?id=[0-9a-f]{12}$/);
  evo.directs.length = 0;

  // выключение сразу, без подтверждения
  sw().dispatch("click");
  await p.settle();
  assert.deepEqual(p.fetched.filter((f) => f.url.endsWith("wa/ai/toggle")).map((f) => f.body).pop(), { enabled: false });
  assert.equal(sw().attrs.get("aria-checked"), "false");
  assert.equal(evo.webhook?.enabled, false);
  // номер остаётся открытым, пока вкладка открыта; со вкладки ушли, и он снова закрыт
  assert.match(card().textContent, /\+77015556677/);
  p.cards();
});

test("панель: нет ключа OpenAI: выключатель недоступен, причина написана, проверка вопроса отвечает тем же", async () => {
  delete process.env.OPENAI_API_KEY;
  const p = loadPanel();
  await p.settle();
  const card = p.cards().find((c) => /^ИИ-ассистент в личке/.test(c.textContent))!;
  const sw = all(card, (e) => e.attrs.get("role") === "switch")[0];
  assert.equal(sw.disabled, true, "включить нельзя");
  assert.match(card.textContent, /Нет ключа OPENAI_API_KEY в \.env на сервере: ассистент не стартует/);
  const input = all(card, (e) => e.tag === "input")[0];
  input.value = "привет";
  input.dispatch("input");
  p.button("Спросить").dispatch("click");
  await p.settle();
  assert.match(p.cards().find((c) => /^ИИ-ассистент в личке/.test(c.textContent))!.textContent, /Нет ключа OPENAI_API_KEY/);
  assert.equal(evo.of("/webhook").length, 0);
});

test("панель: блок «Дожим WABA»: выключатель с подтверждением, шаблоны из одобренных, переменные, сохранение, вебхук, тестовая отправка с подтверждением, номера закрыты", async () => {
  wazzup.testHook = false; // адрес вебхука в этом тесте недоступен снаружи, проверку Wazzup не имитируем
  const p = loadPanel();
  await p.settle();
  const card = () => p.cards().find((c) => /^Дожим WABA/.test(c.textContent))!;
  assert.ok(card(), "блок есть");
  const order = p.cards().map((c) => c.textContent.slice(0, 12));
  assert.ok(order.findIndex((t) => /^ИИ-ассистент/.test(t)) < order.findIndex((t) => /^Дожим WABA/.test(t)), "после блока ассистента");
  const sw = () => all(card(), (e) => e.attrs.get("role") === "switch")[0];
  assert.equal(sw().attrs.get("aria-checked"), "false");
  assert.equal(sw().disabled, true, "шаблон не выбран: включить нельзя");
  assert.match(card().textContent, /Выключено: запросов к Wazzup нет, шаблоны не уходят/);
  assert.match(card().textContent, /Выбери шаблон из одобренных и сохрани настройки/);
  assert.match(card().textContent, /Кандидатов сегодня0/);
  assert.match(card().textContent, /Вступили после дожима0/);
  assert.match(card().textContent, /За 24 часа0 из 200/);
  assert.match(card().textContent, /Отправок пока нет/);
  assert.match(card().textContent, /Вебхук Wazzup/);
  assert.match(card().textContent, /Не стоит: ответы людей на шаблон не обрабатываются/);
  assert.equal(wazzup.calls.length, 0, "пока настройки закрыты, Wazzup не трогаем");

  // настройки: шаблоны подгружаются по кнопке, в списке только одобренные
  p.button("Настроить").dispatch("click");
  await p.settle();
  assert.equal(p.fetched.filter((f) => f.url.endsWith("wa/dozhim/templates")).length, 1);
  const sel = () => all(card(), (e) => e.tag === "select" && e.attrs.get("aria-label") === "Шаблон WABA")[0];
  assert.deepEqual(all(sel(), (e) => e.tag === "option").map((o) => o.textContent), ["Выбери шаблон", "Напоминание о записи или встрече · utility", "Вступите в сообщество ссылка · utility"], "основной шаблон на модерации не предлагается");
  assert.ok(p.buttons().includes("Обновить список шаблонов"));
  // выбрали запасной: три переменные с постоянными текстами по умолчанию
  sel().value = TPL_REMINDER;
  sel().dispatch("change");
  const vars = () => all(card(), (e) => e.tag === "select" && /^Источник переменной/.test(e.attrs.get("aria-label") || ""));
  assert.equal(vars().length, 3);
  assert.deepEqual(vars().map((v) => v.value), ["text", "text", "text"]);
  const texts = () => all(card(), (e) => e.tag === "input" && /^Текст для переменной/.test(e.attrs.get("aria-label") || ""));
  assert.deepEqual(texts().map((t) => t.value), ["команда onAI Academy", "воркшопе «Вайб-продакшен»", "20:00 по Алматы"]);
  assert.match(card().textContent, /Здравствуйте\. Это \{\{1\}\}\. Напоминаем о \{\{2\}\} в \{\{3\}\}/);
  // параметры и сохранение
  const num = (label: string) => all(card(), (e) => e.tag === "input" && e.attrs.get("aria-label") === label)[0];
  num("Задержка после заявки, минут").value = "45";
  num("Задержка после заявки, минут").dispatch("input");
  num("Лимит в сутки").value = "150";
  num("Лимит в сутки").dispatch("input");
  p.button("Сохранить настройки").dispatch("click");
  await p.settle();
  const saves = p.fetched.filter((f) => f.url.endsWith("wa/dozhim/save"));
  assert.equal(saves.length, 1);
  assert.deepEqual(saves[0].body, {
    templateId: TPL_REMINDER,
    map: [{ kind: "text", text: "команда onAI Academy" }, { kind: "text", text: "воркшопе «Вайб-продакшен»" }, { kind: "text", text: "20:00 по Алматы" }],
    delayMin: 45, from: "09:00", to: "21:00", cutoff: "19:30", dailyLimit: 150,
  });
  assert.match(p.text(), /Настройки дожима сохранены/);
  assert.equal(sw().disabled, false, "шаблон выбран: включить можно");
  assert.match(card().textContent, /Лимит в сутки/);

  // включение: подтверждение в странице, без него запроса нет
  sw().dispatch("click");
  assert.equal(p.fetched.filter((f) => f.url.endsWith("wa/dozhim/toggle")).length, 0);
  assert.match(card().textContent, /Включить дожим\? Шаблон «Напоминание о записи или встрече» начнёт уходить людям с номерами Казахстана/);
  assert.match(card().textContent, /Не больше 150 в сутки, каждое сообщение платное/);
  p.button("Включить").dispatch("click");
  await p.settle();
  assert.deepEqual(p.fetched.filter((f) => f.url.endsWith("wa/dozhim/toggle")).map((f) => f.body), [{ enabled: true, confirm: true }]);
  assert.equal(sw().attrs.get("aria-checked"), "true");
  assert.match(card().textContent, /Включено: шаблон «Напоминание о записи или встрече» через 45 мин после заявки, с 09:00 до 21:00 по Алматы, в день эфира не позже 19:30/);

  // вебхук: ставится после подтверждения, снимается сразу
  const hookBtn = () => p.button("Поставить вебхук");
  hookBtn().dispatch("click");
  assert.equal(p.fetched.filter((f) => f.url.endsWith("wa/dozhim/hook")).length, 0);
  assert.match(card().textContent, /Поставить вебхук в Wazzup\? Wazzup проверит адрес тестовым запросом/);
  p.button("Поставить").dispatch("click");
  await p.settle();
  assert.deepEqual(p.fetched.filter((f) => f.url.endsWith("wa/dozhim/hook")).map((f) => f.body), [{ on: true, confirm: true }]);
  assert.match(card().textContent, /Стоит: ответ на шаблон присылает человеку ссылку на сообщество/);
  assert.match(wazzup.hooks.webhooksUri, /^http:\/\/127\.0\.0\.1:1\/api\/wazzup-hook\?s=[0-9a-f]{48}$/);
  assert.equal(p.text().includes(wazzup.hooks.webhooksUri.split("?s=")[1]), false, "секрет вебхука на экране не показывается");
  p.button("Снять вебхук").dispatch("click");
  await p.settle();
  assert.deepEqual(p.fetched.filter((f) => f.url.endsWith("wa/dozhim/hook")).map((f) => f.body).pop(), { on: false });
  assert.equal(wazzup.hooks.webhooksUri, "");
  assert.match(card().textContent, /Не стоит: ответы людей на шаблон не обрабатываются/);

  // тестовая отправка: цифры в поле, подтверждение с закрытым номером, затем запрос с confirm
  const tin = () => all(card(), (e) => e.tag === "input" && /^Номер для тестовой отправки/.test(e.attrs.get("aria-label") || ""))[0];
  tin().value = "+7 (701) 123-45-67";
  tin().dispatch("input");
  assert.equal(tin().value, "77011234567", "в поле остаются только цифры");
  const before = p.fetched.length;
  p.button("Тестовая отправка").dispatch("click");
  assert.equal(p.fetched.length, before, "без подтверждения запроса нет");
  assert.match(card().textContent, /Отправить шаблон «Напоминание о записи или встрече» на номер 7701\*\*\*4567\? Это платное сообщение WhatsApp/);
  assert.equal(p.text().includes("77011234567"), false, "полного номера на экране нет");
  p.button("Отправить").dispatch("click");
  await p.settle();
  const tests = p.fetched.filter((f) => f.url.endsWith("wa/dozhim/test"));
  assert.deepEqual(tests.map((t) => t.body), [{ number: "77011234567", confirm: true }]);
  assert.equal(wazzup.sent.length, 1);
  assert.equal(wazzup.sent[0].chatId, "77011234567");
  assert.equal(wazzup.sent[0].templateId, TPL_REMINDER);
  assert.match(p.text(), /Тестовый шаблон «Напоминание о записи или встрече» отправлен на 7701\*\*\*4567/);
  assert.match(card().textContent, /7701\*\*\*4567/);
  assert.match(card().textContent, /тест/);
  assert.equal(p.text().includes("77011234567"), false, "полный номер нигде на экране");
  // слишком короткий номер: запроса нет
  tin().value = "123";
  tin().dispatch("input");
  const n1 = p.fetched.length;
  p.button("Тестовая отправка").dispatch("click");
  assert.equal(p.fetched.length, n1);
  assert.match(p.text(), /Номер для теста: только цифры, с кодом страны, от 10 до 15/);

  // выключение сразу, без подтверждения
  sw().dispatch("click");
  await p.settle();
  assert.deepEqual(p.fetched.filter((f) => f.url.endsWith("wa/dozhim/toggle")).map((f) => f.body).pop(), { enabled: false });
  assert.equal(sw().attrs.get("aria-checked"), "false");
});

test("панель: нет ключа Wazzup: выключатель недоступен и причина написана; шаблоны не загружаются, ошибка словами", async () => {
  delete process.env.WAZZUP_API_KEY;
  const p = loadPanel();
  await p.settle();
  const card = () => p.cards().find((c) => /^Дожим WABA/.test(c.textContent))!;
  const sw = all(card(), (e) => e.attrs.get("role") === "switch")[0];
  assert.equal(sw.disabled, true);
  assert.match(card().textContent, /Нет WAZZUP_API_KEY в \.env на сервере: дожим не стартует/);
  p.button("Настроить").dispatch("click");
  await p.settle();
  assert.match(card().textContent, /Нет WAZZUP_API_KEY в \.env на сервере/);
  assert.equal(wazzup.calls.length, 0);
  process.env.WAZZUP_API_KEY = WZ_KEY;
  // Wazzup не отвечает: понятная ошибка, а не пустой список
  wazzup.fail = (c) => (c.path === "/v3/templates/whatsapp" ? { status: 500 } : null);
  p.button("Обновить список шаблонов").dispatch("click");
  await p.settle();
  assert.match(card().textContent, /Не удалось получить шаблоны Wazzup/);
  void TPL_LINK;
});

test("панель: в карточках сообществ строка «Вступили N из M записавшихся на этот день»; без замера честно сказано, что кто вступил, пока не известно", async () => {
  stateHook = (st) => {
    st.current.signups = { day: st.current.day, dayLabel: st.current.dayLabel, applied: 12, joined: 7, measured: "3 мин назад" };
    st.next.signups = { day: st.next.day, dayLabel: st.next.dayLabel, applied: 3, joined: null, measured: "" };
  };
  const p = loadPanel();
  await p.settle();
  const cur = p.cards().find((c) => /^Эфир 08\.10/.test(c.textContent))!;
  const nxt = p.cards().find((c) => /^Следующий эфир 09\.10/.test(c.textContent))!;
  assert.ok(cur && nxt, "карточки сообществ есть");
  assert.match(cur.textContent, /Вступили 7 из 12 записавшихся на этот день \(замер 3 мин назад\)\./);
  assert.match(nxt.textContent, /Записавшихся на этот день: 3\. Кто из них вступил, пока не замеряно: замер идёт, когда включён дожим WABA\./);
});

// ───────────────────────── общий рубильник и план прямого эфира (docs/tasks/automation_master_switch_event_mode.md) ─────────────────────────

test("панель: рубильник «Автоматизация» вверху: включена по умолчанию; выключение и включение только после подтверждения в странице, с причиной; модуль в карточке остановлен", async () => {
  const p = loadPanel();
  await p.settle();
  const bar = p.byId("auto");
  assert.equal(bar.hidden, false);
  assert.match(bar.textContent, /^Автоматизация: включена/);
  assert.equal(hasClass(bar, "off"), false);
  const sw = () => all(bar, (e) => e.tag === "button" && e.getAttribute("role") === "switch")[0];
  assert.equal(sw().getAttribute("aria-checked"), "true");
  const posts = () => p.fetched.filter((f) => f.url.endsWith("/automation") && f.method === "POST");
  // нажатие только открывает подтверждение: запроса нет
  sw().dispatch("click");
  const dlg = () => all(bar, (e) => e.attrs.get("role") === "alertdialog")[0];
  assert.match(dlg().textContent, /^Выключить автоматизацию\? Остановятся: WhatsApp не создаёт сообщества, не шлёт рассылку и не одобряет заявки; Telegram не шлёт плановые сообщения серии, включая обязательные\. Продолжат работать: .*ИИ-ассистент в личке WhatsApp и дожим WABA.* Вернуть можно в любой момент\./);
  assert.equal(posts().length, 0);
  // отмена закрывает диалог
  all(dlg(), (e) => e.tag === "button" && e.textContent === "Отмена")[0].dispatch("click");
  assert.equal(dlg(), undefined);
  assert.equal(posts().length, 0);
  // подтверждение с причиной
  sw().dispatch("click");
  const reason = all(dlg(), (e) => e.tag === "input")[0];
  assert.equal(reason.getAttribute("aria-label"), "Причина выключения");
  reason.value = "перерыв";
  reason.dispatch("input");
  all(dlg(), (e) => e.tag === "button" && e.textContent === "Да, выключить")[0].dispatch("click");
  await p.settle();
  assert.equal(posts().length, 1);
  assert.deepEqual(posts()[0].body, { on: false, confirm: true, reason: "перерыв" });
  assert.match(bar.textContent, /^Автоматизация: выключена/);
  assert.equal(hasClass(bar, "off"), true);
  assert.match(bar.textContent, /Выключена с \d\d\.\d\d в \d\d:\d\d, из админки, id 1\. Причина: перерыв\./);
  assert.equal(sw().getAttribute("aria-checked"), "false");
  assert.equal(dlg(), undefined, "диалог закрылся");
  // вкладка WhatsApp: модуль остановлен рубильником, пауза модуля не включена
  assert.match(p.text(), /Состояние\s*остановлен рубильником/);
  assert.match(p.text(), /Автоматизация выключена переключателем вверху страницы: сообщества не создаются, рассылка и одобрение заявок стоят\. ИИ-ассистент и дожим WABA работают\./);
  assert.ok(p.buttons().includes("Пауза"), "кнопка паузы модуля на месте: рубильник и пауза независимы");
  // включение тоже спрашивает
  sw().dispatch("click");
  assert.match(dlg().textContent, /^Включить автоматизацию\? WhatsApp снова создаёт сообщества, шлёт рассылку и одобряет заявки, Telegram возобновляет серию по расписанию\./);
  assert.equal(all(dlg(), (e) => e.tag === "input").length, 0, "причина нужна только при выключении");
  all(dlg(), (e) => e.tag === "button" && e.textContent === "Да, включить")[0].dispatch("click");
  await p.settle();
  assert.deepEqual(posts().map((f) => f.body.on), [false, true]);
  assert.match(bar.textContent, /^Автоматизация: включена/);
  assert.doesNotMatch(p.text(), /остановлен рубильником/);
  // пауза модуля по сбою: при включении предупреждаем, что она останется
  waPause(clock.t);
  setAutomation(false, "тест");
  const p2 = loadPanel();
  await p2.settle();
  const bar2 = p2.byId("auto");
  assert.match(bar2.textContent, /^Автоматизация: выключена/);
  all(bar2, (e) => e.tag === "button" && e.getAttribute("role") === "switch")[0].dispatch("click");
  const d2 = all(bar2, (e) => e.attrs.get("role") === "alertdialog")[0];
  assert.match(d2.textContent, /WhatsApp-модуль отдельно стоит на паузе \(вручную, из пульта\): он останется на паузе, как был\./);
});

test("панель: прямой эфир (одна дата): режим так и называется, под формой план одной лентой из настроек и серии; кнопки «Создать сообщество сейчас», «Запустить рассылки сейчас» (с подтверждением), «Сбросить»; на паузе план говорит об этом", async () => {
  waSetMode("event");
  assert.equal(waSetEvent({ date: "2026-10-15", start: "20:30", recruitFrom: "2026-10-12" }, clock.t).ok, true);
  const p = loadPanel();
  await p.settle();
  assert.ok(p.buttons().includes("Прямой эфир (одна дата)"));
  assert.equal(p.buttons().includes("Живой эфир"), false);
  const plan = () => all(p.view, (e) => hasClass(e, "plan"))[0];
  const ribbon = () => all(plan(), (e) => e.tag === "li").map((li) => li.textContent).join(" · ");
  assert.equal(ribbon(), "Сообщество создастся: 12.10 в 10:00 · Набор: 12.10–15.10, ссылка на сайте ведёт в это сообщество · Рассылки: только 15.10, первая в 12:00 · Эфир: 15.10 в 20:30 · Закрытие: 16.10 в 00:00");
  assert.match(plan().textContent, /Telegram: всем записавшимся назначен день эфира 15\.10, серия идёт только в него/);
  assert.deepEqual(all(plan(), (e) => e.tag === "li").map((li) => li.className), ["next", "next", "next", "next", "next"]);
  // кнопки: запуск недоступен, пока нет сообщества
  for (const b of ["Сохранить", "Создать сообщество сейчас", "Запустить рассылки сейчас", "Сбросить"]) assert.ok(p.buttons().includes(b), b);
  assert.equal(p.button("Запустить рассылки сейчас").disabled, true);
  // сообщество создано: запуск доступен, спрашивает подтверждение и предупреждает про тексты и Telegram
  assert.equal((await waEventCreateNow(clock.t)).ok, true);
  await p.tick(20000);
  assert.equal(p.button("Запустить рассылки сейчас").disabled, false);
  assert.match(ribbon(), /^Сообщество создано: 08\.10 в 12:00 · Набор: /);
  const n0 = p.fetched.filter((f) => f.url.endsWith("wa/event/launch")).length;
  p.button("Запустить рассылки сейчас").dispatch("click");
  const dlg = all(p.view, (e) => e.attrs.get("role") === "alertdialog")[0];
  assert.match(dlg.textContent, /^Запустить рассылки досрочно\? По плану они ждут дня эфира \(15\.10\)\. После запуска в сообщество каждый день до эфира будут уходить только прогревающие сообщения: «Бонусы за регистрацию» в 13:00, «Видео-прогрев: почему AI-монтаж сейчас» в 18:00\. Всё, где сказано «сегодня», «через N минут», «начинаем», а также ссылка на эфир, сам эфир и оффер придут в день эфира\./);
  assert.match(dlg.textContent, /Telegram по-прежнему шлёт серию только в день эфира\./);
  assert.equal(p.fetched.filter((f) => f.url.endsWith("wa/event/launch")).length, n0, "без подтверждения запроса нет");
  p.button("Да, запустить").dispatch("click");
  await p.settle();
  const launch = p.fetched.filter((f) => f.url.endsWith("wa/event/launch"));
  assert.equal(launch.length, 1);
  assert.equal(launch[0].body.confirm, true);
  assert.equal(p.button("Рассылки запущены").disabled, true);
  assert.match(ribbon(), /Рассылки: запущены досрочно 08\.10 в 12:00, до эфира только прогрев \(2 в день: 13:00, 18:00\), эфир 15\.10/);
  assert.match(p.text(), /Рассылки запущены досрочно \(08\.10 в 12:00\): в дни до эфира идёт только прогрев, ссылка на эфир, оффер и всё про «сегодня» придут в день эфира\./);
  // рубильник выключен: у плана красная строка
  setAutomation(false, "тест");
  await p.tick(20000);
  assert.equal(hasClass(plan(), "hold"), true);
  assert.match(plan().textContent, /^на паузе: рассылки не уйдут/);
  assert.match(plan().textContent, /Автоматизация выключена \(переключатель вверху админки\)\./);
  setAutomation(true, "тест");
  waPause(clock.t);
  await p.tick(20000);
  assert.match(plan().textContent, /WhatsApp-модуль на паузе: вручную, из пульта\./);
  // «Сбросить» с подтверждением
  waResume();
  await p.tick(20000);
  p.button("Сбросить").dispatch("click");
  assert.match(all(p.view, (e) => e.attrs.get("role") === "alertdialog")[0].textContent, /Telegram вернётся к ежедневной серии\./);
});

test("панель: вся серия под день эфира: в подтверждении запуска прямо сказано, что до эфира не уйдёт ни одного сообщения; в плане и подсказке то же", async () => {
  const dir = mkdtempSync(join(tmpdir(), "wa-panel-warm-"));
  const series = JSON.parse(readFileSync(join(REPO, "form-api", "wa-series.json"), "utf8"));
  for (const m of series.messages) if (m.id === "reg-bonus" || m.id === "video-ai") m.text += "\n\nСегодня в 20:00 покажу, как это работает.";
  const seriesPath = join(dir, "wa-series.json");
  writeFileSync(seriesPath, JSON.stringify(series));
  resetWaGroups();
  initWaGroups({ dir, seriesFile: seriesPath, deps: { now: () => clock.t, sleep: async () => {}, rand: () => 0.5, notify: async () => 1 } });
  waSetMode("event");
  assert.equal(waSetEvent({ date: "2026-10-15", start: "20:00", recruitFrom: "2026-10-12" }, clock.t).ok, true);
  assert.equal((await waEventCreateNow(clock.t)).ok, true);
  const p = loadPanel();
  await p.settle();
  assert.deepEqual((waPanel(clock.t) as any).event.warm, []);
  p.button("Запустить рассылки сейчас").dispatch("click");
  const dlg = all(p.view, (e) => e.attrs.get("role") === "alertdialog")[0];
  assert.match(dlg.textContent, /^Запустить рассылки досрочно\? По плану они ждут дня эфира \(15\.10\)\. Вся серия написана под день эфира \(«сегодня», ссылка, оффер\), поэтому в дни до эфира не уйдёт ни одного сообщения: сообщество будет молчать до 15\.10, досрочный запуск ничего не изменит\./);
  p.button("Да, запустить").dispatch("click");
  await p.settle();
  const ribbon = all(all(p.view, (e) => hasClass(e, "plan"))[0], (e) => e.tag === "li").map((li) => li.textContent).join(" · ");
  assert.match(ribbon, /Рассылки: запущены досрочно 08\.10 в 12:00, но до эфира слать нечего: вся серия написана под день эфира, эфир 15\.10/);
  assert.match(p.text(), /Рассылки запущены досрочно \(08\.10 в 12:00\): до эфира слать нечего, вся серия написана под день эфира, сообщество молчит до 15\.10\./);
});
