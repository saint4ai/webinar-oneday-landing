/**
 * Тесты модуля WhatsApp-сообществ (node:test), в стиле tg.test.ts. Запуск из корня репозитория:
 *   npx --yes tsx --test form-api/wa.test.ts
 * Evolution и Telegram подменены локальными серверами, настоящих запросов нет. Время подменяется
 * (часы clock.t), паузы между отправками не ждутся (sleep записывает запрошенные задержки).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { createServer, type Server } from "node:http";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { addDays, assignStreamDay, dayKeyOf, setUtcOffsetMinutes } from "./tg-time";
import { EVO_KEY, evo, INSTANCE_TOKEN, OWNER_JID, PNG_B64, runWaPage, tg } from "./wa-testkit";
import { dayReportText, eventNow, getStore, HELP_TEXT, initTgWorkshop, notifyOwners, parseTyBody, processUpdate, registerWa, registerWaReport, switchAutomation } from "./tg-workshop";
import { tick as tgTick } from "./tg-scheduler";
import { aiPanel, aiSetEnabled } from "./wa-assistant";
import { automationOn, setAutomation } from "./automation";
import {
  _internals, _waRt, adminNumbers, extractMembers, initWaGroups, joinsTick, normalizeRequests, resetWaGroups, startWaGroups,
  validateWaSeries, waCommand, waConnection, waDailyCreateNow, waEventCreateNow, waEventLaunch, waEventReset, waGroupLink, waGroups, waHealth, waLogout, waPanel, waPause,
  maskNumber, waPairing, waQr, waReportLine, waResume, waSendSeries, waSetDaily, waSetEvent, waSetMode, waStatus, waTick, type Kind,
} from "./wa-groups";

process.env.TG_WORKSHOP_BOT_TOKEN = "WATEST:tgtoken123";
process.env.TG_WORKSHOP_WEBHOOK_SECRET = "wa-test-webhook-secret-0123";
process.env.TG_GO_SECRET = "wa-test-go-secret-987654";
process.env.TG_LINK_OWNER_IDS = "900,901";
process.env.EVOLUTION_API_KEY = EVO_KEY;
delete process.env.EVOLUTION_INSTANCE;
delete process.env.WA_GROUPS;
delete process.env.WA_TARGET;
delete process.env.WA_ADMIN_NUMBERS;

const REPO = process.cwd();
const WA_SERIES = join(REPO, "form-api", "wa-series.json");
const TG_SERIES = join(REPO, "form-api", "tg-series.json");
const CHAIN = join(REPO, "docs", "mailings", "chain-v2.json");
/** Версии файлов (`?v=...`) из tg-series.json по имени файла: WhatsApp и Telegram отдают одни и те же файлы с одной и той же версией. */
const TG_VERSIONS = (() => {
  const out = new Map<string, string>();
  const walk = (x: unknown): void => {
    if (typeof x === "string") {
      const m = /\/([^/?]+)\?(v=[^&]+)$/.exec(x);
      if (m) out.set(m[1], "?" + m[2]);
    } else if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") Object.values(x).forEach(walk);
  };
  walk(JSON.parse(readFileSync(join(process.cwd(), "form-api", "tg-series.json"), "utf8")));
  return out;
})();
const ver = (file: string) => TG_VERSIONS.get(file) ?? "";
const tmp = () => mkdtempSync(join(tmpdir(), "wa-test-"));
/** Момент по часам Алматы (UTC+5). */
const alm = (y: number, m: number, d: number, h: number, mi = 0, s = 0) => Date.UTC(y, m - 1, d, h - 5, mi, s);
/** Включённые сообщения дня эфира в wa-series.json (без «+1 день» и без выключенных): их число в итоге эфира «ушло X из N». */
const DAY0 = () => JSON.parse(readFileSync(join(process.cwd(), "form-api", "wa-series.json"), "utf8")).messages.filter((m: any) => m.enabled !== false && !m.dayOffset).length as number;
const readJsonl = (file: string): any[] => (existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);


test.before(async () => {
  await tg.start();
  await evo.start();
});
test.after(async () => {
  resetWaGroups();
  registerWa(null);
  registerWaReport(null);
  await tg.stop();
  await evo.stop();
  assert.deepEqual(evo.violations, [], "защита номера: ни одного сообщения людям и добавления участников");
});

// ───────────────────────── часы, зависимости, запуск ─────────────────────────

const clock = { t: alm(2026, 10, 8, 12, 0) };
const sleeps: number[] = [];
const alarms: string[] = [];
let rnd = 0;
const RANDS = [0, 0.5, 0.999, 0.25, 0.75];
const deps = () => ({
  now: () => clock.t,
  sleep: async (ms: number) => void sleeps.push(ms),
  rand: () => RANDS[rnd++ % RANDS.length],
  notify: async (text: string) => (alarms.push(text), 1),
});
const at = (d: number, h: number, mi = 0, s = 0, m = 10) => (clock.t = alm(2026, m, d, h, mi, s));

test.beforeEach(() => {
  setUtcOffsetMinutes(300);
  tg.reset();
  evo.reset();
  sleeps.length = 0;
  alarms.length = 0;
  rnd = 0;
  delete process.env.WA_ADMIN_NUMBERS;
  delete process.env.WA_TARGET;
  delete process.env.WA_GROUPS;
});

type BootOpts = { kind?: Kind; edit?: (s: any) => void; tgEdit?: (s: any) => void; state?: Record<string, unknown>; daily?: boolean; prodCreateTime?: boolean };
/**
 * Свежие данные, серия бота (время эфира и вызов команд) и модуль. Команды подключены как в startWaGroups.
 * После первого включения модуль стоит в ежедневном режиме с выключенным созданием; прежние тесты проверяют ежедневное
 * создание, поэтому по умолчанию его включаем (daily: false оставляет как есть, state добавляет поля в wa-state.json).
 */
function boot(o: BootOpts = {}) {
  const dir = tmp();
  writeFileSync(join(dir, "wa-state.json"), JSON.stringify({ v: 1, mode: "daily", daily: { enabled: o.daily !== false }, ...(o.state || {}) }));
  const series = JSON.parse(readFileSync(WA_SERIES, "utf8"));
  // Боевое расписание создаёт сообщество в 20:20 (после эфирных ссылок). Старые тесты считают от 20:00, поэтому по умолчанию ставим 20:00;
  // тесты про боевое время просят prodCreateTime: true.
  if (!o.prodCreateTime) series.createTime = "20:00";
  o.edit?.(series);
  const seriesPath = join(dir, "wa-series.json");
  writeFileSync(seriesPath, JSON.stringify(series));
  const tgs = JSON.parse(readFileSync(TG_SERIES, "utf8"));
  tgs.firstDay = "2026-09-01";
  tgs.skipDays = [];
  o.tgEdit?.(tgs);
  const tgPath = join(dir, "tg-series.json");
  writeFileSync(tgPath, JSON.stringify(tgs));
  process.env.TG_SERIES_FILE = tgPath;
  delete process.env.TG_BOT;
  initTgWorkshop({ dir, seriesFile: tgPath });
  resetWaGroups();
  initWaGroups({ dir, seriesFile: seriesPath, deps: deps(), kind: o.kind });
  registerWa((cmd, args, now) => waCommand(cmd, args, now));
  registerWaReport((day) => waReportLine(day));
  return {
    dir,
    state: () => JSON.parse(readFileSync(join(dir, "wa-state.json"), "utf8")),
    journal: () => readJsonl(join(dir, "wa-journal.jsonl")),
    joins: () => readJsonl(join(dir, "wa-joins.jsonl")),
    rt: () => _waRt()!,
  };
}

const upd = (id: number, text: string) => ({ message: { chat: { id, type: "private" }, from: { id, first_name: "Аня", username: `u${id}` }, text } });
const ownerSay = async (text: string) => {
  tg.reset();
  await processUpdate(upd(900, text), clock.t);
  return tg.texts(900);
};

/** Создать сообщество эфира D обычным путём: тик в 20:00 накануне. Возвращает целевой JID. */
async function createFor(w: ReturnType<typeof boot>, dayOfMonth: number) {
  at(dayOfMonth - 1, 20, 0, 0);
  const r = await waTick();
  assert.equal(r.created, 1, `создано сообщество эфира ${dayOfMonth}`);
  return w.state().targets.find((t: any) => t.day === `2026-10-${String(dayOfMonth).padStart(2, "0")}`);
}

// ───────────────────────── расписание ─────────────────────────

test("wa-series.json: проходит проверку и совпадает с секцией whatsapp в chain-v2 (время, тексты, картинки, опрос)", () => {
  const s = validateWaSeries(JSON.parse(readFileSync(WA_SERIES, "utf8")));
  const chain = JSON.parse(readFileSync(CHAIN, "utf8"));
  // лента v3.3: 18 сообщений дня эфира и 4 на следующий день
  assert.equal(s.messages.length, 22);
  assert.equal(s.messages.length, chain.whatsapp.length);
  assert.equal(s.messages.filter((m) => m.dayOffset).length, 4);
  chain.whatsapp.forEach((c: any, i: number) => {
    const m = s.messages[i];
    const next = /^\+(\d+) день (\d{1,2}:\d{2})$/.exec(c.at);
    assert.equal(m.at, next ? next[2] : c.at, `время ${c.at}`);
    assert.equal(m.dayOffset ?? 0, next ? Number(next[1]) : 0, `день ${c.at}`);
    // метка места под видео в начале («[Видео Александра, 15 с]») в подпись не идёт, остальной текст дословно из chain-v2
    const isVideo = /\.mp4$/i.test(c.media || "");
    assert.equal(m.text, isVideo ? c.text.replace(/^\[[^\]\n]+\]\n\n/, "") : c.text, `текст ${c.at}`);
    if (c.media) {
      assert.equal(m.media?.url, `https://onai.academy/workshop-montazh/assets/tg/${c.media}${ver(c.media)}`, `картинка ${c.at}`);
      // файл тот же, что в Telegram-серии: версия совпадает (если файл там есть)
      if (ver(c.media)) assert.ok(JSON.stringify(JSON.parse(readFileSync(TG_SERIES, "utf8"))).includes(m.media!.url), `адрес ${c.at} совпадает с tg-series.json`);
      assert.equal(m.media?.type, isVideo ? "video" : "image", `тип ${c.at}`);
    } else assert.equal(m.media, undefined, `без картинки ${c.at}`);
  });
  // личное видео Александра 15:00 готово (09.10): включено вместе с остальными, адрес с версией из tg-series
  assert.deepEqual(s.messages.filter((m) => m.enabled === false).map((m) => m.id), []);
  const personal = s.messages.find((m) => m.id === "personal")!;
  assert.deepEqual(personal.media, { type: "video", url: "https://onai.academy/workshop-montazh/assets/tg/personal-1500.mp4?v=0909p" });
  // текст 12:00: 121 тысяча и ссылка на рилс; 14:00: «Я не открывал CapCut» и карточка warm-edits.jpg?v=1009c; с 10.10 (автовеб по записи) без «вместе соберём ролик»: 11:30 «покажу, как ИИ монтирует», 19:30 «покажу весь путь рилса», +1 19:50 «Начинаем в 20:00»
  const byId = Object.fromEntries(s.messages.map((m) => [m.id, m]));
  assert.ok(byId["reel-119k"].text.includes("65 тысяч") && byId["reel-119k"].text.includes("Рилс в Instagram: https://www.instagram.com/reel/Dd12LJNTSO0/"));
  assert.ok(byId["warm-edits"].text.startsWith("Я не открывал CapCut"));
  assert.equal(byId["warm-edits"].media?.url, "https://onai.academy/workshop-montazh/assets/tg/warm-edits.jpg?v=1009c");
  for (const id of ["morning", "t-minus-30", "replay-link"]) assert.equal(byId[id].text.includes("соберём ролик"), false, id);
  assert.ok(byId["morning"].text.includes("покажу, как ИИ монтирует мои рилсы"));
  assert.ok(byId["t-minus-30"].text.includes("Покажу весь путь рилса"));
  assert.ok(byId["replay-link"].text.includes("Начинаем в 20:00 по Алматы"));
  assert.equal(s.createTime, "20:20");
  assert.equal(/соберём ролик/.test(s.welcome), false);
  assert.equal(s.welcome.includes("Записи не будет"), false);
  // имя менеджера нигде не пишем, длинного тире нет
  assert.equal(/Аян/.test(readFileSync(WA_SERIES, "utf8")), false);
  for (const m of s.messages) assert.equal(/^\[/.test(m.text), false, `${m.id}: метка [Видео ...] не идёт в подпись`);
  // id и времена ленты v3.3
  assert.deepEqual(s.messages.map((m) => `${m.dayOffset ? "+1 " : ""}${m.at} ${m.id}`), [
    "11:30 morning", "12:00 reel-119k", "12:30 reg-bonus", "14:00 warm-edits", "15:00 personal", "16:00 noface", "17:00 numbers", "17:30 video-ai",
    "19:00 live-bonus", "19:30 t-minus-30", "19:50 t-minus-10", "20:00 live-now", "20:10 live-10", "20:15 last-link", "20:58 training", "21:18 offer",
    "22:30 push", "23:30 last-call", "+1 10:30 next-1030", "+1 15:00 next-1500", "+1 19:50 replay-link", "+1 21:45 next-2145",
  ]);
  // убранные из ленты времена (20:30 «живой догрев», 21:20 оффер) и старые id не остались
  for (const id of ["faceless", "cases", "live-warm", "reel-119k-old"]) assert.equal(s.messages.some((m) => m.id === id), false, id);
  // опрос только у утреннего сообщения: варианты из chain-v2
  assert.deepEqual(s.messages.filter((m) => m.poll).map((m) => m.id), ["morning"]);
  assert.deepEqual(s.messages[0].poll?.options, ["Буду", "Постараюсь", "Не успеваю"]);
  assert.equal(s.messages[0].poll?.name, "Придёшь сегодня на эфир?");
  // время по возрастанию внутри дня (сначала день эфира, потом +1 день)
  const key = (m: { dayOffset?: number; at: string }) => `${m.dayOffset ?? 0}|${m.at}`;
  assert.deepEqual(s.messages.map(key), [...s.messages.map(key)].sort());
  // подпись к картинке длиннее лимита (1024) бот делит на картинку и отдельный текст; такой в серии один, оффер 21:18
  assert.deepEqual(s.messages.filter((m) => m.media && m.text.length > s.captionLimit).map((m) => m.id), ["offer"]);
  for (const m of s.messages) assert.ok(m.text.length <= 4096, `${m.id}: текст до 4096`);
});

test("wa-series.json: файлы картинок и аватарок лежат в репозитории; аватарка квадратная", () => {
  const s = JSON.parse(readFileSync(WA_SERIES, "utf8"));
  const local = (u: string) => join(REPO, "workshop-montazh", "assets", "tg", (u.split("/").pop() as string).split("?")[0]);
  // Карточки WhatsApp для +1 дня 10:30 и 21:45 (с суффиксом -wa) дорисовываются отдельно: пока файла нет, имя обязано быть в этом списке
  // (когда файл появился, его можно убрать отсюда, тест зелёный и так и так). Выключенные сообщения (видео Александра 15:00) не проверяем.
  // personal-1500.mp4: личное видео Александра лежит на сервере и в репозиторий не входит (Telegram-серия ссылается на него так же).
  const PENDING = new Set(["next-1030-wa.jpg", "next-2145-wa.jpg", "personal-1500.mp4"]);
  const missing: string[] = [];
  for (const m of s.messages) {
    if (!m.media || m.enabled === false) continue;
    if (!existsSync(local(m.media.url)) && !PENDING.has((m.media.url.split("/").pop() as string).split("?")[0])) missing.push(`${m.id}: ${m.media.url}`);
  }
  assert.deepEqual(missing, [], "файла нет в репозитории и в списке дорисовываемых");
  for (const u of s.avatar) assert.ok(existsSync(local(u)), u);
  const buf = readFileSync(local(s.avatar[0]));
  // JPEG: ищем маркер SOF0 или SOF2 и читаем высоту и ширину
  let w = 0;
  let h = 0;
  for (let i = 2; i < buf.length - 9; i++) {
    if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) {
      h = buf.readUInt16BE(i + 5);
      w = buf.readUInt16BE(i + 7);
      break;
    }
  }
  assert.ok(w > 0 && w === h, `квадрат ${w}x${h}`);
});

test("validateWaSeries: отвергает длинное тире, плохое время, повтор id, лишний тип, кривой опрос и медиа", () => {
  const good = () => JSON.parse(readFileSync(WA_SERIES, "utf8"));
  const bad = (edit: (s: any) => void, re: RegExp) => {
    const s = good();
    edit(s);
    assert.throws(() => validateWaSeries(s), re);
  };
  bad((s) => (s.messages[1].text += String.fromCharCode(0x2014)), /длинное тире/);
  bad((s) => (s.messages[1].at = "25:99"), /at вида HH:MM/);
  bad((s) => (s.messages[2].id = s.messages[1].id), /повторяется/);
  bad((s) => (s.target = "channel"), /community или group/);
  bad((s) => (s.messages[0].poll.options = ["один"]), /poll/);
  bad((s) => (s.messages[1].media = { type: "image", url: "http://x/y.jpg" }), /media/);
  for (const v of [-1, 4, 1.5, "1"]) bad((s) => (s.messages[1].dayOffset = v), /dayOffset целое от 0 до 3/);
  bad((s) => (s.pacing.betweenSendsMs = [9000, 4000]), /по возрастанию/);
  bad((s) => (s.joinPolling.hotMinutes = 0), /hotMinutes/);
  bad((s) => (s.joinPolling.idleSec = [180, 120]), /idleSec/);
  bad((s) => (s.timezone = "UTC"), /Asia\/Almaty/);
  bad((s) => (s.messages = []), /непустым/);
});

test("исходники wa-*.ts: без Intl, локальных геттеров Date, toLocale и длинного тире; ключа API в коде нет", () => {
  for (const f of ["wa-groups.ts", "wa-evolution.ts"]) {
    const src = readFileSync(join(REPO, "form-api", f), "utf8");
    assert.equal(/\bIntl\./.test(src), false, `${f}: Intl`);
    assert.equal(/\.get(Hours|Date|Day|Month|FullYear|Minutes|Seconds|TimezoneOffset)\(/.test(src), false, `${f}: локальный геттер Date`);
    assert.equal(/toLocale\w*\(/.test(src), false, `${f}: toLocale`);
    assert.equal(src.includes(String.fromCharCode(0x2014)), false, `${f}: длинное тире`);
  }
});

test("время создания: накануне в 20:00; перед firstDay и после перерыва по правилу предыдущего дня эфира", () => {
  boot();
  const r = _waRt()!;
  assert.equal(_internals.createAtOf(r, "2026-10-09"), alm(2026, 10, 8, 20, 0));
  // первый день эфира: календарная вчера, хотя вчера эфира нет
  boot({ tgEdit: (s) => (s.firstDay = "2026-10-07") });
  assert.equal(_internals.createAtOf(_waRt()!, "2026-10-07"), alm(2026, 10, 6, 20, 0));
  // 9 октября без эфира: сообщество на 10 октября создаём в старт эфира 8 октября, ссылка не рвётся
  boot({ tgEdit: (s) => (s.skipDays = ["2026-10-09"]) });
  assert.equal(_internals.createAtOf(_waRt()!, "2026-10-10"), alm(2026, 10, 8, 20, 0));
  assert.equal(_internals.closeAtOf(_waRt()!, "2026-10-09"), alm(2026, 10, 10, 0, 0));
});

// ───────────────────────── создание и ссылка ─────────────────────────

test("создание в 20:00: раньше ничего, в 20:00 сообщество эфира, настройки, ссылка, аватарка, приветствие по порядку и с паузами", async () => {
  const w = boot();
  at(8, 19, 59, 50);
  assert.deepEqual(await waTick(), { sent: 0, created: 0 });
  assert.equal(evo.of("/community/create").length, 0, "до 20:00 не создаём");

  at(8, 20, 0, 0);
  evo.calls = [];
  assert.equal((await waTick()).created, 1);
  const create = evo.of("/community/create")[0];
  assert.deepEqual(create.body, {
    subject: "Вайб-продакшен · эфир 09.10",
    description: validateWaSeries(JSON.parse(readFileSync(WA_SERIES, "utf8"))).description,
    approvalRequired: true,
  });
  assert.equal(/\d{3}\s?\d{3}|₸|\$/.test(create.body.description), false, "в описании нет цены");
  // порядок: подключение, создание, проверка вкладки объявлений, режим добавления, ссылка, аватарка, приветствие.
  // Шага lock у сообщества нет (WhatsApp отвечает на locked bad-request). Вкладка объявлений нового сообщества уже announce: true, поэтому
  // настройки announcement нет; вступление по заявке включено при создании, joinApprovalMode не вызывается (на проде он висит).
  assert.deepEqual(evo.seq(), [
    "GET /instance/connectionState", "POST /community/create",
    "GET /group/findGroupInfos", "POST /community/memberAddMode",
    "GET /community/inviteCode", "POST /group/updateGroupPicture", "POST /message/sendText",
  ]);
  const jid = w.state().targets[0].jid;
  assert.equal(evo.of("/group/findGroupInfos")[0].query.get("groupJid"), w.state().targets[0].sendJid, "смотрим вкладку объявлений");
  assert.deepEqual(evo.of("/community/memberAddMode")[0].body, { mode: "admin_add" });
  assert.equal(evo.of("/community/memberAddMode")[0].query.get("communityJid"), jid);
  assert.equal(evo.of("/community/joinApprovalMode").length, 0, "вступление по заявке включено при создании");
  // шага lock у сообщества нет: ни одного вызова locked ни у сообщества, ни у его вкладки объявлений
  assert.equal(evo.calls.filter((c) => c.body?.action === "locked").length, 0);
  assert.equal(evo.of("/community/updateSetting").length, 0);
  assert.equal(evo.of("/group/updateSetting").length, 0);
  const pic = evo.of("/group/updateGroupPicture")[0].body;
  assert.deepEqual(pic, { groupJid: jid, image: "https://onai.academy/workshop-montazh/assets/tg/wa-avatar.jpg" });
  // приветствие уходит во вкладку объявлений, а не в само сообщество
  const welcome = evo.of("/message/sendText")[0].body;
  assert.equal(welcome.number, w.state().targets[0].sendJid);
  assert.notEqual(welcome.number, jid);
  assert.match(welcome.text, /Эфир завтра в 20:00 по Алматы/);
  assert.equal(welcome.text.includes(String.fromCharCode(0x2014)), false);
  // паузы между шагами в заданных границах, перед первым шагом паузы нет (создание и пять пауз между шестью шагами настройки)
  assert.equal(sleeps.length, 6);
  for (const ms of sleeps) assert.ok(ms >= 2000 && ms <= 4000, `пауза шага ${ms}`);
  const t = w.state().targets[0];
  assert.equal(t.id, "2026-10-09#1");
  assert.match(t.link, /^https:\/\/chat\.whatsapp\.com\/INV/);
  assert.deepEqual(Object.keys(t.done).sort(), ["addMode", "announce", "approval", "avatar", "link", "welcome"]);
  // журнал: приветствие записано, ключей нет
  const sends = w.journal().filter((r) => r.ev === "send");
  assert.equal(sends.length, 1);
  assert.equal(sends[0].msg, "welcome");
  assert.equal(sends[0].ok, true);
  assert.match(sends[0].mid, /^MSG\d+$/);

  // повторный тик в ту же минуту ничего не создаёт и не шлёт
  evo.calls = [];
  at(8, 20, 0, 30);
  await waTick();
  assert.deepEqual(evo.seq().filter((x) => !x.includes("connectionState") && !x.includes("fetchInstances")), []);
});

test("создание: не создаёт посреди дня при включении модуля, догоняет после перезапуска вечером в пределах 6 часов", async () => {
  const w = boot();
  at(8, 15, 0, 0);
  await waTick();
  assert.equal(evo.of("/community/create").length, 0, "в 15:00 включение не создаёт сообщество на сегодня");
  at(8, 22, 30, 0); // сервис был недоступен с 20:00, ещё вечер
  assert.equal((await waTick()).created, 1);
  assert.equal(w.state().targets[0].day, "2026-10-09");
  boot();
  at(9, 12, 1, 0); // окно догонки: 3 дневных часа вечером 20:00 до 23:00 и ещё 3 часа с 09:00 до 12:00, дальше закрыто
  await waTick();
  assert.equal(evo.of("/community/create").length, 1, "после 12:00 не создаёт");
});

test("ночью не создаём и не приветствуем: догонка и приветствие только с 09:00 до 23:00 по Алматы, ночное откладывается до 09:00", async () => {
  const w = boot();
  const makes = () => evo.of("/community/create").length;
  // сервис лежал с 20:00: в 23:30 уже ночь, создание ждёт утра
  for (const [d, h, mi] of [[8, 23, 30], [9, 2, 30], [9, 8, 59]] as number[][]) {
    at(d, h, mi, 0);
    assert.equal((await waTick()).created, 0, `${d}.10 ${h}:${mi}: ночью не создаём`);
  }
  assert.equal(makes(), 0);
  at(9, 9, 0, 0);
  assert.equal((await waTick()).created, 1, "в 09:00 догнали: окно догонки считает только дневные часы");
  assert.equal(makes(), 1);
  assert.equal(w.state().targets[0].day, "2026-10-09");
  assert.ok(w.state().targets[0].done.welcome, "утром приветствие ушло вместе с созданием");
  // плановое создание в 20:00 не затронуто
  boot();
  at(8, 22, 59, 0);
  assert.equal((await waTick()).created, 1, "вечером до 23:00 создаём");

  // ручное создание ночью допустимо (решает владелец), но приветствие откладывается до 09:00
  const w2 = boot({ daily: false });
  at(9, 2, 0, 0);
  const [reply] = await ownerSay("/wa_new 2026-10-10");
  assert.match(reply, /Создано/);
  const t = w2.state().targets[0];
  assert.ok(t.link, "ссылка и настройки готовы");
  assert.equal(t.done.welcome, undefined, "ночью приветствие не отправлено");
  assert.equal(t.tries.welcome, undefined, "и попытка не потрачена");
  assert.equal(evo.of("/message/sendText").filter((c) => c.body.number === t.sendJid).length, 0);
  at(9, 5, 0, 0);
  await waTick();
  assert.equal(evo.of("/message/sendText").filter((c) => c.body.number === t.sendJid).length, 0, "и в 05:00 тоже");
  at(9, 9, 0, 0);
  await waTick();
  const hello = evo.of("/message/sendText").filter((c) => c.body.number === t.sendJid);
  assert.equal(hello.length, 1, "в 09:00 приветствие ушло один раз");
  assert.match(hello[0].body.text, /Эфир завтра в 20:00 по Алматы/);
  assert.equal(w2.state().targets[0].done.welcome, true);
});

test("ссылка на сайте: до готовности и без модуля null (старая ссылка), в 20:40 переключается на новое сообщество", async () => {
  assert.equal(waGroupLink(alm(2026, 10, 8, 20, 50)), null, "модуль не инициализирован: null");
  const w = boot();
  const first = await createFor(w, 8); // создано 7 октября в 20:00
  assert.equal(waGroupLink(alm(2026, 10, 7, 20, 0)), null, "в 20:00 7 октября записывают на эфир 7-го: сообщества 7-го нет, старая ссылка");
  assert.equal(waGroupLink(alm(2026, 10, 7, 20, 39, 59)), null);
  assert.equal(waGroupLink(alm(2026, 10, 7, 20, 40, 0)), first.link, "в 20:40 запись уходит на 8-е: ссылка нового сообщества");
  assert.equal(waGroupLink(alm(2026, 10, 8, 12, 0)), first.link);
  const second = await createFor(w, 9); // 8 октября в 20:00
  assert.equal(waGroupLink(alm(2026, 10, 8, 20, 0, 1)), first.link, "после создания 9-го ссылка пока прежняя");
  assert.equal(waGroupLink(alm(2026, 10, 8, 20, 39, 59)), first.link, "последняя секунда окна записи на идущий эфир");
  assert.equal(waGroupLink(alm(2026, 10, 8, 20, 40, 0)), second.link, "в 20:40 ссылка на новое");
  assert.notEqual(first.link, second.link);
  // с 20:40 9 октября запись уходит на 10-е: сообщества на 10-е нет, значит старая ссылка, а не вчерашнее сообщество
  assert.equal(waGroupLink(alm(2026, 10, 9, 20, 39, 59)), second.link);
  assert.equal(waGroupLink(alm(2026, 10, 9, 20, 40, 0)), null);
  assert.equal(waGroupLink(alm(2026, 10, 10, 0, 0, 0)), null);
});

test("ссылка не готова, пока не поставлены настройки: сообщество без ссылки не отдаётся", async () => {
  const w = boot();
  // ссылка критичный шаг (настройки сообщества мягкие, см. тесты hotfix 09.10): без неё сообщество не готово
  evo.fail = (c) => (c.path.startsWith("/community/inviteCode") ? { status: 400 } : null);
  at(7, 20, 0, 0);
  const r = await waTick();
  assert.equal(r.created, 1);
  const t = w.state().targets[0];
  assert.equal(t.done.announce, true);
  assert.equal(t.done.addMode, true);
  assert.equal(t.done.link, undefined);
  assert.equal(t.link, "");
  // сообщество на завтра (8-е создаётся 7-го): сбой не трогает общие failStreak и retryAt, ожидание на самой цели
  assert.equal(w.state().failStreak, 0);
  assert.equal(t.retryAt, alm(2026, 10, 7, 20, 3, 0));
  assert.equal(waGroupLink(alm(2026, 10, 7, 21, 0)), null);
  // починили: через 3 минуты тик достраивает остальное
  evo.fail = null;
  at(7, 20, 3, 5);
  await waTick();
  const t2 = w.state().targets[0];
  assert.equal(!!t2.done.addMode && !!t2.done.approval && !!t2.done.link, true);
  assert.equal(waGroupLink(alm(2026, 10, 7, 21, 0)), t2.link);
  assert.equal(w.state().failStreak, 0);
});

// ───────────────────────── hotfix 09.10: настройки сообщества мягкие, создание в 20:20 ─────────────────────────

const SOFT_ALARM = "WhatsApp не принял настройку";
/** Как на проде 09.10: updateSetting и memberAddMode дают 400, joinApprovalMode висит (в тестах дольше таймаута 300 мс). */
const prodFailures = (c: { path: string }) => {
  if (c.path.startsWith("/community/updateSetting") || c.path.startsWith("/community/memberAddMode") || c.path.startsWith("/group/updateSetting")) return { status: 400 };
  if (c.path.startsWith("/community/joinApprovalMode")) return { delay: 2500 };
  return null;
};
const withSetupTimeout = async (fn: () => Promise<void>) => {
  process.env.WA_SETUP_TIMEOUT_MS = "300";
  try {
    await fn();
  } finally {
    delete process.env.WA_SETUP_TIMEOUT_MS;
  }
};

test("боевое расписание: createTime 20:20, сообщество следующего эфира создаётся накануне в 20:20; без createTime как раньше в старт эфира; кривое время отвергается", () => {
  const prod = validateWaSeries(JSON.parse(readFileSync(WA_SERIES, "utf8")));
  assert.equal(prod.createTime, "20:20");
  assert.equal(prod.streamStart, "20:00");
  boot({ prodCreateTime: true });
  assert.equal(_internals.createAtOf(_waRt()!, "2026-10-09"), alm(2026, 10, 8, 20, 20));
  // после перерыва правило то же, только время createTime
  boot({ prodCreateTime: true, tgEdit: (s) => (s.skipDays = ["2026-10-09"]) });
  assert.equal(_internals.createAtOf(_waRt()!, "2026-10-10"), alm(2026, 10, 8, 20, 20));
  // createTime не задан: как раньше, в старт эфира
  boot({ edit: (s) => delete s.createTime });
  assert.equal(_internals.createAtOf(_waRt()!, "2026-10-09"), alm(2026, 10, 8, 20, 0));
  const bad = JSON.parse(readFileSync(WA_SERIES, "utf8"));
  bad.createTime = "25:99";
  assert.throws(() => validateWaSeries(bad), /createTime вида HH:MM/);
  // переключение ссылки по-прежнему в 20:40 (assignStreamDay), создание на него не влияет
  const cfg = { streamStart: "20:00", streamMinutes: 80, joinLiveMinutes: 40, firstDay: "2026-09-01", skipDays: [] as string[] };
  assert.equal(assignStreamDay(alm(2026, 10, 8, 20, 39, 59), cfg), "2026-10-08");
  assert.equal(assignStreamDay(alm(2026, 10, 8, 20, 40, 0), cfg), "2026-10-09");
});

test("hotfix 09.10: 400 на updateSetting и memberAddMode и зависший joinApprovalMode не ломают сообщество: готово, ошибок подряд нет, отправки серии идут раньше создания, одна тревога", async () => {
  await withSetupTimeout(async () => {
    const w = boot({ prodCreateTime: true });
    // сообщество на 9 октября создаётся накануне в 20:20 обычным путём
    at(8, 20, 19, 55);
    assert.equal((await waTick()).created, 0, "в 20:19 ещё рано");
    at(8, 20, 20, 5);
    assert.equal((await waTick()).created, 1);
    // 9 октября эфирные ссылки 20:00 и 20:10 уходят в свои тики, тик 20:15 не случился: в 20:20 созрели и ссылка, и создание сообщества на 10-е
    for (const [h, m] of [[19, 50], [20, 0], [20, 10]]) {
      at(9, h, m, 5);
      await waTick();
    }
    assert.equal(w.journal().filter((x) => x.ev === "send" && x.ok && ["live-now", "live-10"].includes(x.msg)).length, 2);
    evo.newTabAnnounce = false;
    evo.fail = prodFailures;
    evo.calls = [];
    at(9, 20, 20, 5);
    const r = await waTick();
    assert.equal(r.created, 1, "сообщество на 10-е создано");
    assert.equal(r.sent, 1, "ссылка 20:15 ушла в том же тике");
    const j = w.journal();
    const iSend = j.findIndex((x) => x.ev === "send" && x.msg === "last-link" && x.ok);
    const iCreate = j.findIndex((x) => x.ev === "create" && x.target === "2026-10-10#1");
    assert.ok(iSend >= 0 && iCreate > iSend, `отправка (${iSend}) раньше создания (${iCreate})`);
    const t = w.rt().state.targets.find((x) => x.id === "2026-10-10#1")!;
    assert.equal(_internals.isReady(t), true, "сообщество готово");
    assert.match(t.link, /^https:\/\/chat\.whatsapp\.com\/INV/);
    assert.deepEqual([t.done.announce, t.done.addMode, t.done.approval, t.done.link], [true, true, true, true]);
    assert.deepEqual(Object.keys(t.soft || {}).sort(), ["addMode", "announce"], "approval у сообщества модуля без вызова, мягкими стали два шага");
    assert.equal(t.done.welcome, true, "приветствие ушло, цель готова");
    // вызовы: вкладку смотрим и пробуем закрыть, режим добавления пробуем, joinApprovalMode не зовём (на проде висит), /community/updateSetting не зовём (на проде 400)
    assert.equal(evo.of("/group/findGroupInfos").filter((c) => c.query.get("groupJid") === t.sendJid).length, 1);
    assert.deepEqual(evo.of("/group/updateSetting").map((c) => c.body), [{ groupJid: t.sendJid, action: "announcement" }]);
    assert.equal(evo.of("/community/memberAddMode").length, 1);
    assert.equal(evo.of("/community/joinApprovalMode").length, 0);
    assert.equal(evo.of("/community/updateSetting").length, 0);
    // модуль не встал: ни ошибок подряд, ни ожидания, ни паузы; в журнале мягкие шаги, а не fail
    const st = w.state();
    assert.deepEqual([st.failStreak, st.retryAt, st.paused], [0, 0, false]);
    assert.deepEqual(j.filter((x) => x.ev === "step_soft").map((x) => x.step).sort(), ["addMode", "announce"]);
    assert.equal(j.filter((x) => x.ev === "fail").length, 0);
    // одна тревога на цель, и повторные тики её не повторяют
    const soft = () => alarms.filter((a) => a.includes(SOFT_ALARM));
    assert.equal(soft().length, 1);
    assert.match(soft()[0], /^Сообщество «Вайб-продакшен · эфир 10\.10» создано, но WhatsApp не принял настройку: писать во вкладку объявлений только админам \(.*\)\. Проверь вручную в телефоне\.$/);
    assert.equal(/добавлять участников/.test(soft()[0]), false, "addMode в тревогу не входит");
    assert.equal(soft()[0].includes(String.fromCharCode(0x2014)), false);
    evo.calls = [];
    for (const [h, m] of [[20, 21], [20, 25], [20, 30]]) {
      at(9, h, m, 5);
      await waTick();
    }
    assert.equal(soft().length, 1, "повторных тревог нет");
    assert.equal(evo.of("/community/memberAddMode").length, 0, "достраивать нечего");
    assert.equal(alarms.filter((a) => a.includes("на паузе")).length, 0);
    // ссылка на сайте переключается в 20:40 на готовое сообщество
    assert.equal(waGroupLink(alm(2026, 10, 9, 20, 40, 0)), t.link);
  });
});

test("создание в 20:20 не мешает эфирным ссылкам: 20:00, 20:10, 20:15 уходят в свои тики, сообщество следующего эфира создаётся после них", async () => {
  const w = boot({ prodCreateTime: true });
  at(8, 20, 20, 5);
  assert.equal((await waTick()).created, 1);
  const makes = () => evo.of("/community/create").length;
  const links = () => w.journal().filter((x) => x.ev === "send" && x.ok && ["live-now", "live-10", "last-link"].includes(x.msg)).map((x) => x.msg);
  at(9, 19, 50, 5); // последнее сообщение до эфира: промежуток 4 минуты от него не мешает 20:00
  await waTick();
  for (const [h, m, msg] of [[20, 0, "live-now"], [20, 10, "live-10"], [20, 15, "last-link"]] as Array<[number, number, string]>) {
    at(9, h, m, 5);
    const r = await waTick();
    assert.equal(r.created, 0, `${h}:${m}: создания ещё нет`);
    assert.equal(w.journal().filter((x) => x.ev === "send" && x.ok && x.msg === msg).length, 1, `${h}:${m}: ${msg} ушла вовремя`);
  }
  assert.equal(makes(), 1, "до 20:20 второго сообщества нет");
  assert.deepEqual(links(), ["live-now", "live-10", "last-link"]);
  at(9, 20, 20, 5);
  assert.equal((await waTick()).created, 1);
  assert.equal(makes(), 2);
  const st = w.state();
  assert.deepEqual([st.failStreak, st.retryAt, st.paused], [0, 0, false]);
  assert.equal(alarms.filter((a) => a.includes(SOFT_ALARM)).length, 0, "при нормальном ответе WhatsApp тревоги нет");
  // ссылка на сайте в 20:40 ведёт в сообщество 10-го
  const t10 = w.state().targets.find((x: any) => x.day === "2026-10-10");
  assert.equal(waGroupLink(alm(2026, 10, 9, 20, 40, 0)), t10.link);
});

test("announce у сообщества: вкладка уже announce true, настройки нет; не закрыта, закрываем настройкой вкладки; findGroupInfos упал, тоже закрываем; закрыть не вышло, шаг всё равно сделан", async () => {
  // уже закрыта (как на проде у нового сообщества): ни одного вызова настройки
  const w = boot();
  at(8, 20, 0, 0);
  evo.calls = [];
  assert.equal((await waTick()).created, 1);
  assert.equal(evo.of("/group/findGroupInfos").length, 1);
  assert.equal(evo.of("/group/updateSetting").length + evo.of("/community/updateSetting").length, 0);
  assert.equal(w.state().targets[0].soft, undefined);
  assert.equal(alarms.length, 0);
  // не закрыта: настройка вкладки объявлений
  const w2 = boot();
  evo.newTabAnnounce = false;
  at(8, 20, 0, 0);
  evo.calls = [];
  assert.equal((await waTick()).created, 1);
  const t2 = w2.state().targets[0];
  assert.deepEqual(evo.of("/group/updateSetting").map((c) => c.body), [{ groupJid: t2.sendJid, action: "announcement" }]);
  assert.equal(evo.announceOn.has(t2.sendJid), true);
  assert.equal(t2.done.announce, true);
  assert.equal(t2.soft, undefined);
  // findGroupInfos упал: пробуем закрыть настройкой
  const w3 = boot();
  evo.newTabAnnounce = false;
  evo.fail = (c) => (c.path.startsWith("/group/findGroupInfos") ? { status: 500 } : null);
  at(8, 20, 0, 0);
  evo.calls = [];
  assert.equal((await waTick()).created, 1);
  assert.equal(evo.of("/group/updateSetting").length, 1);
  assert.equal(w3.state().targets[0].soft, undefined);
  assert.equal(w3.state().failStreak, 0);
  // и проверка, и настройка не вышли: шаг сделан как мягкий, ошибок подряд нет
  const w4 = boot();
  evo.newTabAnnounce = false;
  evo.fail = (c) => (c.path.startsWith("/group/updateSetting") ? { status: 400 } : null);
  at(8, 20, 0, 0);
  assert.equal((await waTick()).created, 1);
  const t4 = w4.state().targets[0];
  assert.equal(t4.done.announce, true);
  assert.deepEqual(Object.keys(t4.soft), ["announce"]);
  assert.deepEqual([w4.state().failStreak, w4.state().retryAt], [0, 0]);
});

test("зависание: memberAddMode не отвечает дольше таймаута, шаг мягкий и быстрый; у чужого принятого сообщества joinApprovalMode пробуется и тоже мягкий, у сообщества модуля не зовётся", async () => {
  await withSetupTimeout(async () => {
    // memberAddMode завис
    const w = boot();
    evo.fail = (c) => (c.path.startsWith("/community/memberAddMode") ? { delay: 2500 } : null);
    at(8, 20, 0, 0);
    const t0 = Date.now();
    assert.equal((await waTick()).created, 1);
    assert.ok(Date.now() - t0 < 2000, `таймаут шага 300 мс, а тик занял ${Date.now() - t0} мс`);
    const t = w.state().targets[0];
    assert.equal(t.done.addMode, true);
    assert.match(t.soft.addMode, /timeout/);
    assert.deepEqual([w.state().failStreak, w.state().retryAt], [0, 0]);
    assert.equal(evo.of("/community/joinApprovalMode").length, 0, "своё сообщество: вступление по заявке уже включено");
    assert.equal(alarms.filter((a) => a.includes(SOFT_ALARM)).length, 0, "addMode мягкий только в журнале: на проде он отвечает 400 каждый вечер");
    assert.equal(w.journal().filter((x) => x.ev === "step_soft" && x.step === "addMode").length, 1);

    // чужое принятое сообщество: вызов с коротким таймаутом, ошибка мягкая
    evo.fail = null;
    const w2 = boot();
    at(8, 20, 0, 0);
    assert.equal((await waTick()).created, 1);
    const st = w2.rt().state.targets[0];
    st.adopted = true;
    delete st.done.approval;
    evo.calls = [];
    evo.fail = (c) => (c.path.startsWith("/community/joinApprovalMode") ? { delay: 2500 } : null);
    alarms.length = 0;
    at(8, 20, 1, 0);
    const t1 = Date.now();
    await waTick();
    assert.ok(Date.now() - t1 < 2000, `таймаут шага 300 мс, а тик занял ${Date.now() - t1} мс`);
    assert.deepEqual(evo.of("/community/joinApprovalMode").map((c) => c.body), [{ mode: "on" }]);
    assert.equal(w2.rt().state.targets[0].done.approval, true);
    assert.match(w2.rt().state.targets[0].soft!.approval!, /timeout/);
    assert.deepEqual([w2.rt().state.failStreak, w2.rt().state.retryAt, w2.rt().state.paused], [0, 0, false]);
    assert.equal(alarms.filter((a) => a.includes(SOFT_ALARM)).length, 1);
  });
});

test("обычная группа по-старому: announce через настройку группы без findGroupInfos, ошибка критичная (бэкофф), мягких шагов нет", async () => {
  const w = boot({ kind: "group" });
  process.env.WA_ADMIN_NUMBERS = "77085834575";
  evo.fail = (c) => (c.path.startsWith("/group/updateSetting") ? { status: 400 } : null);
  at(8, 20, 0, 0);
  assert.equal((await waTick()).created, 1);
  const t = w.state().targets[0];
  assert.equal(t.kind, "group");
  assert.equal(t.done.announce, undefined, "announce не прошёл");
  assert.equal(w.state().failStreak, 1);
  assert.ok(w.state().retryAt > clock.t, "бэкофф выставлен");
  assert.equal(evo.of("/group/findGroupInfos").length, 0);
  assert.equal(t.soft, undefined);
  assert.equal(w.journal().filter((x) => x.ev === "step_soft").length, 0);
  assert.equal(alarms.filter((a) => a.includes(SOFT_ALARM)).length, 0);
});

/** Общий разгон для тестов сбоев: сообщество на 9-е создано накануне, эфирные ссылки 9-го ушли, часы стоят на 20:15 9 октября. */
async function bootEveningOf9() {
  const w = boot({ prodCreateTime: true });
  at(8, 20, 20, 5);
  assert.equal((await waTick()).created, 1);
  for (const [h, m] of [[19, 50], [20, 0], [20, 10], [20, 15]]) {
    at(9, h, m, 5);
    await waTick();
  }
  alarms.length = 0;
  evo.calls = [];
  return w;
}
const sentOk = (w: ReturnType<typeof boot>, msg: string) => w.journal().filter((x) => x.ev === "send" && x.ok && x.msg === msg && x.target === "2026-10-09#1").length;

test("сбой создания сообщества на завтра в 20:20 (неясный исход, обрыв, 200 без JID, 4xx) не трогает рассылку: 20:58 и оффер уходят в текущее сообщество, модуль не на паузе, второго сообщества нет", async () => {
  const create = (o: unknown) => (c: { path: string }) => (c.path.startsWith("/community/create") ? (o as any) : null);
  const variants: Array<{ name: string; fail: (c: { path: string }) => any; unclear: boolean }> = [
    { name: "500", fail: create({ status: 500 }), unclear: true },
    { name: "обрыв", fail: create({ hang: true }), unclear: true },
    { name: "200 без JID", fail: create({ status: 200, json: { ok: true } }), unclear: true },
    { name: "400", fail: create({ status: 400 }), unclear: false },
  ];
  for (const v of variants) {
    const w = await bootEveningOf9();
    evo.fail = v.fail;
    const creates = () => evo.of("/community/create").length;
    at(9, 20, 20, 5);
    assert.equal((await waTick()).created, 0, v.name);
    assert.equal(creates(), 1, `${v.name}: одна попытка`);
    const st0 = w.state();
    assert.deepEqual([st0.paused, st0.failStreak, st0.retryAt], [false, 0, 0], `${v.name}: модуль не встал`);
    assert.equal(w.state().targets.length, 1, `${v.name}: второго сообщества нет`);
    assert.equal(!!st0.pendingCreate, v.unclear, `${v.name}: pendingCreate только при неясном исходе`);
    if (v.unclear) {
      assert.equal(alarms.filter((a) => /проверь список чатов на телефоне/.test(a)).length, 1, `${v.name}: одна тревога`);
      assert.match(alarms[0], /Рассылка в текущее сообщество идёт как обычно/);
      assert.equal(st0.creations.length, 2, `${v.name}: неясная попытка учтена в лимите`);
    }
    // 20:30: неясное создание не повторяется (ждёт /wa_resume), чёткий отказ повторяется через 5 минут
    at(9, 20, 30, 5);
    await waTick();
    assert.equal(creates(), v.unclear ? 1 : 2, `${v.name}: повтор в 20:30`);
    // 20:58 и оффер 21:18 уходят в текущее сообщество
    at(9, 20, 58, 5);
    const r58 = await waTick();
    assert.ok(r58.sent >= 1, `${v.name}: 20:58 ушло`);
    assert.equal(sentOk(w, "training"), 1, `${v.name}: training в сообщество 9-го`);
    at(9, 21, 18, 5);
    await waTick();
    assert.ok(sentOk(w, "offer") >= 1, `${v.name}: оффер 21:18 ушёл`);
    const st = w.state();
    assert.deepEqual([st.paused, st.failStreak, st.retryAt], [false, 0, 0], `${v.name}: к 21:18 модуль не на паузе`);
    assert.equal(alarms.filter((a) => /на паузе/.test(a)).length, 0, `${v.name}: тревоги о паузе нет`);
    assert.equal(w.state().targets.length, 1, `${v.name}: сообщество всё ещё одно`);
    assert.equal(creates(), v.unclear ? 1 : 3, `${v.name}: число попыток создания`);
    if (!v.unclear) {
      assert.equal(alarms.filter((a) => /не создаётся уже 3 раза подряд/.test(a)).length, 1, "400: одна тревога на третьей неудаче");
      assert.equal(w.rt().createFails, 3);
    }
    // восстановление: WhatsApp ответил нормально (для неясного исхода после /wa_resume), сообщество создано, готово, ссылка переключается в 20:40 следующего дня
    evo.fail = null;
    if (v.unclear) {
      const [reply] = await ownerSay("/wa_resume");
      assert.match(reply, /Неподтверждённое создание снято с учёта/);
      assert.equal(w.state().pendingCreate, null);
    }
    at(9, 21, 40, 5);
    assert.equal((await waTick()).created, 1, `${v.name}: после восстановления создано`);
    const t10 = w.state().targets.find((x: any) => x.day === "2026-10-10");
    assert.ok(t10.link, `${v.name}: готово`);
    assert.equal(w.state().failStreak, 0);
  }
});

test("сообщество на завтра не достраивается (ссылка 400): рассылка в текущее идёт, failStreak и retryAt не трогаются, повтор через 3 минуты, одна тревога на третьей попытке; цель текущего дня по-старому", async () => {
  const w = await bootEveningOf9();
  evo.fail = (c) => (c.path.startsWith("/community/inviteCode") ? { status: 400 } : null);
  const invites = () => evo.of("/community/inviteCode").length;
  const t10 = () => w.rt().state.targets.find((x) => x.id === "2026-10-10#1")!;
  const common = () => {
    const s = w.state();
    assert.deepEqual([s.paused, s.failStreak, s.retryAt], [false, 0, 0]);
  };
  at(9, 20, 20, 5);
  assert.equal((await waTick()).created, 1);
  assert.equal(t10().tries.link, 1);
  assert.equal(t10().retryAt, alm(2026, 10, 9, 20, 23, 5), "повтор через 3 минуты");
  assert.equal(_internals.isReady(t10()), false);
  common();
  const n1 = invites();
  at(9, 20, 22, 5);
  await waTick();
  assert.equal(invites(), n1, "раньше срока цель не трогаем");
  at(9, 20, 23, 10);
  await waTick();
  assert.equal(t10().tries.link, 2);
  assert.equal(alarms.filter((a) => /на завтра не достраивается/.test(a)).length, 0);
  at(9, 20, 26, 15);
  await waTick();
  assert.equal(t10().tries.link, 3);
  assert.equal(alarms.filter((a) => /на завтра не достраивается/.test(a)).length, 1, "тревога на третьей попытке");
  assert.equal(t10().retryAt, alm(2026, 10, 9, 20, 36, 15), "с третьей попытки интервал 10 минут");
  common();
  // эфирные 20:58 и оффер идут в текущее сообщество, пока новое достраивается
  at(9, 20, 58, 5);
  assert.ok((await waTick()).sent >= 1);
  assert.equal(sentOk(w, "training"), 1);
  common();
  evo.fail = null;
  at(9, 21, 18, 5);
  await waTick();
  assert.ok(sentOk(w, "offer") >= 1);
  assert.equal(_internals.isReady(t10()), true, "достроилось после восстановления");
  assert.match(t10().link, /^https:\/\/chat\.whatsapp\.com\/INV/);
  assert.equal(alarms.filter((a) => /на завтра не достраивается/.test(a)).length, 1, "тревога одна");
  common();

  // сообщество текущего дня по-старому: ошибка критичного шага это общий failStreak и бэкофф
  const w2 = boot();
  at(8, 15, 0, 0);
  evo.fail = (c) => (c.path.startsWith("/community/inviteCode") ? { status: 400 } : null);
  await ownerSay("/wa_new 2026-10-08");
  const today = w2.rt().state.targets[0];
  assert.equal(today.day, "2026-10-08");
  assert.equal(w2.state().failStreak, 1);
  assert.ok(w2.state().retryAt > clock.t);
  assert.equal(today.retryAt, undefined);
});

// ───────────────────────── переполнение ─────────────────────────

test("переполнение: при лимите участников открывается следующее «(2)», ссылка переключается, проверка не чаще раза в 5 минут", async () => {
  const w = boot();
  const first = await createFor(w, 9);
  evo.members.set(first.jid, 1899);
  at(9, 10, 0, 0);
  await waTick();
  assert.equal(w.state().targets.length, 1, "1899 меньше лимита");
  assert.equal(w.state().targets[0].members, 1899);
  const infoCalls = () => evo.of("/community/info").length;
  const before = infoCalls();
  evo.members.set(first.jid, 1950);
  at(9, 10, 2, 0);
  await waTick();
  assert.equal(infoCalls(), before, "через 2 минуты число участников не перепроверяем");
  assert.equal(w.state().targets.length, 1);
  at(9, 10, 5, 1);
  await waTick();
  assert.equal(infoCalls(), before + 1, "через 5 минут перепроверили");
  const ts = w.state().targets;
  assert.equal(ts.length, 2);
  assert.equal(ts[1].id, "2026-10-09#2");
  assert.equal(ts[1].name, "Вайб-продакшен · эфир 09.10 (2)");
  assert.equal(waGroupLink(clock.t), ts[1].link, "ссылка на новом сообществе");
  assert.notEqual(ts[1].link, first.link);
  assert.ok(alarms.some((a) => a.includes("Открыто следующее")), "владельцам сообщили");
  // третье не открывается: у самого нового сообщества участников мало, а у старого уже есть следующее
  at(9, 10, 11, 0);
  await waTick();
  assert.equal(w.state().targets.length, 2);
  // оба сообщества эфира получают прогрев дня эфира: утреннее 11:30 уходит в оба
  at(9, 11, 30, 5);
  evo.calls = [];
  await waTick();
  assert.deepEqual(evo.of("/message/sendMedia").map((c) => c.body.number), [ts[0].sendJid, ts[1].sendJid]);
});

test("прогрев: сообщения, назначенные до создания сообщества, ему не досылаются (даже в пределах окна)", async () => {
  const w = boot();
  const t1 = await createFor(w, 9);
  at(9, 11, 30, 5);
  await waTick(); // 11:30 ушло в первое сообщество
  evo.members.set(t1.jid, 4800);
  at(9, 11, 35, 10);
  await waTick(); // первая проверка участников: открыто «(2)» в 11:35
  const ts = w.state().targets;
  assert.equal(ts.length, 2);
  evo.calls = [];
  at(9, 11, 36, 0); // окно 11:30 ещё открыто (до 11:42), но «(2)» появилось позже
  await waTick();
  assert.equal(evo.of("/message/sendMedia").length, 0, "11:30 в «(2)» не досылаем");
  assert.equal(evo.of("/message/sendPoll").length, 0);
  at(9, 12, 30, 5);
  await waTick();
  assert.deepEqual(evo.of("/message/sendMedia").map((c) => c.body.number), [ts[0].sendJid, ts[1].sendJid], "12:30 уже в оба");
});

test("переполнение: лимит 3 новых сообществ в сутки, тревога владельцам один раз в день", async () => {
  const w = boot();
  at(8, 15, 0, 0);
  for (const d of ["2026-10-08", "2026-10-09", "2026-10-10"]) {
    const [reply] = await ownerSay(`/wa_new ${d}`);
    assert.match(reply, /Создано/);
  }
  assert.equal(w.state().targets.length, 3);
  const [refuse] = await ownerSay("/wa_new 2026-10-11");
  assert.match(refuse, /Лимит 3 новых сообществ в сутки/);
  const serving = w.state().targets.find((t: any) => t.day === "2026-10-08");
  evo.members.set(serving.jid, 4900);
  at(8, 15, 10, 0);
  await waTick();
  await waTick();
  assert.equal(w.state().targets.length, 3, "четвёртое не создано");
  assert.equal(alarms.filter((a) => a.includes("лимит 3 новых сообществ")).length, 1);
});

// ───────────────────────── прогрев по расписанию ─────────────────────────

test("прогрев: в 11:30 картинка с подписью, потом опрос; повтор тика не дублирует; пауза между шагами 2 до 4 секунд", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  evo.calls = [];
  sleeps.length = 0;
  at(9, 11, 29, 59);
  await waTick();
  assert.equal(evo.of("/message/").length, 0);
  at(9, 11, 30, 5);
  assert.equal((await waTick()).sent, 1);
  const media = evo.of("/message/sendMedia")[0].body;
  const series = JSON.parse(readFileSync(WA_SERIES, "utf8"));
  assert.equal(media.number, t.sendJid);
  assert.equal(media.mediatype, "image");
  assert.equal(media.media, "https://onai.academy/workshop-montazh/assets/tg/cover-bizon.jpg" + ver("cover-bizon.jpg"));
  assert.equal(media.caption, series.messages[0].text);
  const poll = evo.of("/message/sendPoll")[0].body;
  assert.deepEqual(poll, { number: t.sendJid, name: "Придёшь сегодня на эфир?", selectableCount: 1, values: ["Буду", "Постараюсь", "Не успеваю"] });
  assert.equal(sleeps.length, 1, "между картинкой и опросом одна пауза, перед первой отправкой паузы нет");
  assert.ok(sleeps[0] >= 2000 && sleeps[0] <= 4000);
  at(9, 11, 30, 35);
  await waTick();
  assert.equal(evo.of("/message/sendMedia").length, 1, "повтор тика ничего не шлёт");
  // журнал: два ok, время, группа, id сообщения, итог
  const rows = w.journal().filter((r) => r.ev === "send" && r.msg === "morning");
  assert.deepEqual(rows.map((r) => [r.part, r.ok, r.target, r.jid]), [["main", true, t.id, t.sendJid], ["poll", true, t.id, t.sendJid]]);
  assert.ok(rows.every((r) => /^MSG\d+$/.test(r.mid) && !Number.isNaN(Date.parse(r.ts))));
  // следующие по расписанию, каждое в своё время (между ними больше промежутка в 4 минуты)
  at(9, 12, 0, 5);
  await waTick();
  assert.match(evo.of("/message/sendMedia")[1].body.caption, /65 тысяч просмотров/);
  at(9, 12, 30, 10);
  await waTick();
  const m2 = evo.of("/message/sendMedia")[2].body;
  assert.match(m2.caption, /Обещанные бонусы за регистрацию/);
  assert.equal(evo.of("/message/sendPoll").length, 1, "опрос только у утреннего сообщения");
});

test("прогрев: опоздание сильнее grace (12 минут) пропускается; до утра дня эфира, кроме приветствия, ничего не уходит", async () => {
  const w = boot();
  await createFor(w, 9);
  evo.calls = [];
  at(9, 11, 43, 0);
  await waTick();
  assert.equal(evo.of("/message/").length, 0, "11:30 опоздали на 13 минут");
  at(8, 23, 59, 0); // ночь и вечер накануне: сообщения 9-го ещё не наступили
  await waTick();
  assert.equal(evo.of("/message/").length, 0);
});

test("прогрев: в два сообщества эфира уходит по очереди, между сообществами пауза 4 до 9 секунд, перед первой паузы нет", async () => {
  const w = boot();
  const t1 = await createFor(w, 9);
  evo.members.set(t1.jid, 4800);
  at(9, 10, 0, 0);
  await waTick();
  assert.equal(w.state().targets.length, 2);
  evo.calls = [];
  sleeps.length = 0;
  at(9, 20, 58, 3);
  const r = await waTick();
  assert.equal(r.sent, 2);
  const sends = evo.of("/message/sendMedia");
  assert.deepEqual(sends.map((c) => c.body.number), w.state().targets.slice(0, 2).map((t: any) => t.sendJid));
  // сначала обе отправки, потом (в этом же тике, в 20:58 создаётся сообщество на 10-е) создание
  assert.deepEqual(evo.seq().slice(0, 5), ["GET /instance/connectionState", "GET /instance/fetchInstances", "POST /message/sendMedia", "POST /message/sendMedia", "POST /community/create"]);
  assert.ok(sleeps[0] >= 4000 && sleeps[0] <= 9000, `пауза между сообществами ${sleeps[0]}`);
  for (const ms of sleeps.slice(1)) assert.ok(ms >= 2000 && ms <= 4000, `дальше паузы шагов ${ms}`);
  assert.equal(evo.calls.filter((c) => c.path.startsWith("/message/")).length, 3, "две отправки серии и приветствие нового сообщества");
});

test("прогрев: подпись длиннее лимита уходит картинкой без подписи и отдельным текстом; сбой картинки заменяется текстом", async () => {
  const w = boot({ edit: (s) => (s.messages.find((m: any) => m.id === "reg-bonus").text = "Длинный текст. ".repeat(80)) });
  const t = await createFor(w, 9);
  at(9, 11, 30, 5);
  await waTick(); // 11:30 и 12:00 уходят в своё время, дальше проверяем 12:30
  at(9, 12, 0, 5);
  await waTick();
  evo.calls = [];
  at(9, 12, 30, 5);
  await waTick();
  const media = evo.of("/message/sendMedia")[0].body;
  assert.equal(media.caption, undefined, "подпись длиннее лимита не прикладывается");
  assert.equal(evo.of("/message/sendText")[0].body.text.startsWith("Длинный текст."), true);
  assert.deepEqual(w.journal().filter((r) => r.msg === "reg-bonus").map((r) => r.part), ["main", "text"]);

  // сбой картинки (не таймаут): тот же текст обычным сообщением, одно предупреждение на файл
  const w2 = boot();
  await createFor(w2, 9);
  evo.calls = [];
  evo.fail = (c) => (c.path.startsWith("/message/sendMedia") ? { status: 400, json: { status: 400, error: "Bad Request", response: { message: ["media: 404"] } } } : null);
  at(9, 14, 0, 5);
  const r = await waTick();
  assert.equal(r.sent, 1);
  assert.match(evo.of("/message/sendText")[0].body.text, /Я не открывал CapCut/);
  const row = w2.journal().find((x) => x.msg === "warm-edits" && x.ok);
  assert.equal(row.fallback, "text");
  assert.equal(alarms.filter((a) => a.includes("Не отправилась картинка")).length, 1);
  assert.equal(w2.state().failStreak, 0, "текстовая замена спасла отправку: ошибки нет");
  void t;
});

// ───────────────────────── сообщения «+1 день» ─────────────────────────

test("«+1 день»: уходят в сообщество вчерашнего эфира ровно один раз, в сообщество сегодняшнего эфира не уходят, после конца следующего дня не шлются", async () => {
  const w = boot();
  const t9 = await createFor(w, 9); // эфир 9 октября, создано 8-го
  const t10 = await createFor(w, 10); // эфир 10 октября, создано 9-го в 20:00
  assert.notEqual(t9.sendJid, t10.sendJid);
  const sentTo = (jid: string) => evo.calls.filter((c) => c.path.startsWith("/message/send") && c.body.number === jid);
  const file = (c: any) => String(c.body.media).split("/").pop()!.split("?")[0];

  // 10-го в 10:29 ничего (11:30 эфира 10-го ещё не наступило, 10:30 вчерашнего ещё нет)
  evo.calls = [];
  at(10, 10, 29, 55);
  await waTick();
  assert.equal(evo.of("/message/").length, 0);

  // 10:30: «+1 день» вчерашнему сообществу, сегодняшнему нет. Сообщество 9-го закрыто для эфира с 00:00 (closeAt), но до конца 10-го принимает «+1»
  at(10, 10, 30, 5);
  assert.equal((await waTick()).sent, 1);
  assert.deepEqual(sentTo(t9.sendJid).map(file), ["next-1030-wa.jpg"]);
  assert.equal(sentTo(t10.sendJid).length, 0, "в сообщество сегодняшнего эфира сообщение «+1 день» не идёт");
  const series = JSON.parse(readFileSync(WA_SERIES, "utf8"));
  assert.equal(sentTo(t9.sendJid)[0].body.caption, series.messages.find((m: any) => m.id === "next-1030").text);

  // повтор тика и тик позже в окне ничего не дублируют
  at(10, 10, 31, 0);
  await waTick();
  at(10, 10, 40, 0);
  await waTick();
  assert.equal(sentTo(t9.sendJid).length, 1, "ровно один раз");

  // 11:30 эфира 10-го: утреннее сообщение уходит в сообщество 10-го, а не вчерашнего
  at(10, 11, 30, 5);
  await waTick();
  assert.equal(sentTo(t10.sendJid).map(file)[0], "cover-bizon.jpg");
  assert.equal(sentTo(t9.sendJid).length, 1, "утреннее сообщение 10-го вчерашнему сообществу не идёт");

  // 15:00, 19:50 и 21:45 вчерашнему; в 19:50 сегодняшнему идёт своё («Через 10 минут начинаем»)
  at(10, 15, 0, 5);
  await waTick();
  at(10, 19, 50, 5);
  await waTick();
  at(10, 21, 45, 5);
  await waTick();
  assert.deepEqual(sentTo(t9.sendJid).map(file), ["next-1030-wa.jpg", "next-1500.jpg", "next-1950.jpg", "next-2145-wa.jpg"]);
  const todays = sentTo(t10.sendJid).map(file);
  assert.ok(todays.includes("cover-bizon.jpg") && todays.includes("t-minus-10.jpg"), "своё расписание сообщество 10-го получает");
  for (const f of ["next-1030-wa.jpg", "next-1500.jpg", "next-1950.jpg", "next-2145-wa.jpg"]) assert.equal(todays.includes(f), false, f + " в сообщество 10-го не идёт");

  // журнал: у каждого «+1» сообщения одна запись об отправке, цель и день эфира вчерашние
  for (const id of ["next-1030", "next-1500", "replay-link", "next-2145"]) {
    const rows = w.journal().filter((r) => r.ev === "send" && r.msg === id && r.ok);
    assert.deepEqual(rows.map((r) => [r.target, r.day]), [[t9.id, "2026-10-09"]], id);
  }

  // 11-го сообщество 9-го закрыто окончательно: ничего не шлёт, а сообщество 10-го получает свои «+1»
  evo.calls = [];
  at(11, 10, 30, 5);
  await waTick();
  assert.deepEqual(sentTo(t9.sendJid).map(file), [], "после конца следующего дня вчерашнее сообщество молчит");
  assert.deepEqual(sentTo(t10.sendJid).map(file), ["next-1030-wa.jpg"], "сообщество 10-го получает свои «+1» 11-го");
});

test("«+1 день»: ночное окно 09:00 до 23:45 действует, пропуск в журнале; выключенное сообщение не уходит", async () => {
  const w = boot({
    edit: (s) => {
      s.messages.find((m: any) => m.id === "next-1030").at = "08:30"; // ночью (до 09:00) не шлём
      s.messages.find((m: any) => m.id === "next-1500").enabled = false;
    },
  });
  const t9 = await createFor(w, 9);
  evo.calls = [];
  for (const [h, mi] of [[8, 30], [8, 40], [15, 0], [15, 5]]) {
    at(10, h, mi, 5);
    await waTick();
  }
  assert.equal(evo.calls.filter((c) => c.path.startsWith("/message/send") && c.body.number === t9.sendJid).length, 0, "ни ночное, ни выключенное не ушло");
  const skips = w.journal().filter((r) => r.ev === "skip");
  assert.deepEqual(skips.map((r) => [r.msg, r.reason, r.plan, r.day]), [["next-1030", "night", "08:30", "2026-10-09"]]);
});

test("«+1 день»: в сообщество разового живого эфира не идут", async () => {
  const w = bootEvent({ recruitFrom: "2026-10-11" });
  at(8, 12, 0, 0);
  assert.equal((await waEventCreateNow()).ok, true);
  evo.calls = [];
  for (const [d, h, mi] of [[13, 10, 30], [13, 15, 0], [13, 19, 50], [13, 21, 45]]) {
    at(d, h, mi, 5);
    await waTick();
  }
  assert.equal(evo.of("/message/").length, 0);
  void w;
});

test("«+1 день»: /wa_send шлёт такое сообщение в сообщество вчерашнего эфира, повторно не шлёт; ближайшее сообщение в /wa и пульте тоже видит «+1»", async () => {
  const w = boot();
  const t9 = await createFor(w, 9);
  const t10 = await createFor(w, 10);
  evo.calls = [];
  // 10-го утром ближайшее по расписанию это «+1» вчерашнего сообщества в 10:30, раньше утреннего 11:30 сегодняшнего
  at(10, 9, 0, 0);
  const nm = (waPanel(clock.t) as any).nextMessage;
  assert.deepEqual([nm.id, nm.at, nm.dayLabel], ["next-1030", "10:30", "09.10"]);
  assert.match((await ownerSay("/wa"))[0], /10:30 next-1030 \(эфир 09\.10\)/);
  // вручную: во вчерашнее сообщество, не в сегодняшнее
  const first = (await ownerSay("/wa_send next-2145"))[0];
  assert.match(first, /«next-2145»: отправлено 1, уже было 0, не ушло 0/);
  const sends = evo.calls.filter((c) => c.path.startsWith("/message/send"));
  assert.deepEqual(sends.map((c) => c.body.number), [t9.sendJid]);
  assert.notEqual(t9.sendJid, t10.sendJid);
  assert.match((await ownerSay("/wa_send next-2145"))[0], /отправлено 0, уже было 1/);
  // обычное сообщение вручную по-прежнему в сегодняшнее
  evo.calls = [];
  assert.match((await ownerSay("/wa_send morning"))[0], /«morning»: отправлено 1, уже было 0/);
  assert.equal(evo.calls.filter((c) => c.path.startsWith("/message/send"))[0].body.number, t10.sendJid);
  // плановое время «+1» подошло: уже отправленное вручную не повторяется
  evo.calls = [];
  at(10, 21, 45, 5);
  await waTick();
  assert.equal(evo.calls.filter((c) => c.path.startsWith("/message/send") && c.body.number === t9.sendJid && String(c.body.media).includes("next-2145")).length, 0);
  // итог эфира за день 9 октября считает только сообщения дня эфира, «+1» в него не входят
  assert.match(waReportLine("2026-10-09"), new RegExp("сообщений серии ушло \\d+ из " + DAY0() + "\\.$"));
});

// ───────────────────────── очередь отправки: тайминг при отставании ─────────────────────────
// docs/tasks/wa_send_pacing.md. Сообщения серии в одно сообщество уходят по одному, не чаще раза в 4 минуты (pacing.minGapMinutes);
// тик раз в 30 секунд, поэтому в тестах тики идут вручную по фейковым часам.

/** Основные части настоящих сообщений серии, ушедшие в сообщество (опрос, отдельный текст и приветствие не в счёт). */
const mainSends = (w: ReturnType<typeof boot>, target?: string) => w.journal().filter((x) => x.ev === "send" && x.ok && x.part === "main" && x.msg !== "welcome" && (!target || x.target === target));
/** Перезапуск модуля на тех же данных: состояние и журнал читаются с диска. */
const restart = (w: ReturnType<typeof boot>) => {
  resetWaGroups();
  initWaGroups({ dir: w.dir, seriesFile: join(w.dir, "wa-series.json"), deps: deps() });
};
const setAt = (s: any, id: string, hm: string) => (s.messages.find((m: any) => m.id === id).at = hm);
const lagAlarms = () => alarms.filter((a) => a.includes("из-за отставания"));

test("очередь: модуль стоял 20 минут, созрели 3 сообщения: уходят по одному с шагом 4 минуты, все три, по порядку; пульт и /wa показывают очередь", async () => {
  const w = boot({
    edit: (s) => {
      setAt(s, "reel-119k", "12:05");
      setAt(s, "reg-bonus", "12:10");
      setAt(s, "warm-edits", "12:15");
    },
  });
  await createFor(w, 9);
  at(9, 11, 30, 5);
  await waTick(); // утреннее вовремя
  at(9, 12, 0, 0);
  await waTick(); // и до 12:05 ещё ничего не созрело
  evo.calls = [];
  // тиков нет с 12:00 до 12:20: созрели 12:05, 12:10 и 12:15, самое раннее опоздало на 15 минут, это больше grace (12)
  at(9, 12, 20, 0);
  assert.equal((await waTick()).sent, 1, "уходит только первое");
  assert.match(evo.of("/message/sendMedia")[0].body.caption, /65 тысяч просмотров/);
  // пульт и /wa: следующее через 4 минуты, в очереди 2
  const nm = (waPanel(clock.t) as any).nextMessage;
  assert.deepEqual([nm.id, nm.at, nm.queued, nm.inText], ["reg-bonus", "12:10", 2, "через 4 мин, в очереди 2"]);
  assert.match((await ownerSay("/wa"))[0], /12:10 reg-bonus \(эфир 09\.10\), через 4 мин, в очереди 2/);
  for (const [h, mi, s, sent] of [[12, 20, 30, 0], [12, 23, 59, 0], [12, 24, 0, 1], [12, 27, 59, 0], [12, 28, 0, 1], [12, 40, 0, 0]] as number[][]) {
    at(9, h, mi, s);
    assert.equal((await waTick()).sent, sent, `${h}:${mi}:${s}`);
  }
  const caps = evo.of("/message/sendMedia").map((c) => String(c.body.caption));
  assert.equal(caps.length, 3);
  assert.match(caps[0], /65 тысяч просмотров/);
  assert.match(caps[1], /Обещанные бонусы за регистрацию/);
  assert.match(caps[2], /Я не открывал CapCut/);
  const rows = mainSends(w).filter((x) => x.msg !== "morning");
  assert.deepEqual(rows.map((x) => x.msg), ["reel-119k", "reg-bonus", "warm-edits"]);
  assert.deepEqual([Date.parse(rows[1].ts) - Date.parse(rows[0].ts), Date.parse(rows[2].ts) - Date.parse(rows[1].ts)], [240_000, 240_000], "шаг ровно 4 минуты");
  // в журнале причины очереди, пропусков и тревог нет
  assert.deepEqual(w.journal().filter((x) => x.ev === "queued").map((x) => [x.msg, x.reason]), [["reel-119k", "behind"], ["reg-bonus", "order"], ["warm-edits", "order"]]);
  assert.equal(w.journal().filter((x) => x.ev === "skip").length, 0);
  assert.equal(lagAlarms().length, 0);
  assert.ok((waPanel(clock.t) as any).journal.some((x: any) => /^В очереди «.*» в .*впереди другие сообщения, уйдёт около 12:24/.test(x.text)));
});

test("очередь: отставание 50 минут: просроченные больше чем на 45 минут пропущены с журналом и одной тревогой, остальные уходят по очереди; после рестарта повтора нет", async () => {
  const w = boot({
    edit: (s) => {
      setAt(s, "reel-119k", "12:00"); // на 12:50 опоздает на 50 минут
      setAt(s, "reg-bonus", "12:04"); // на 46
      setAt(s, "warm-edits", "12:20"); // 30
      setAt(s, "noface", "12:30"); // 20
      setAt(s, "numbers", "12:40"); // 10
    },
  });
  await createFor(w, 9);
  at(9, 11, 30, 5);
  await waTick();
  at(9, 11, 59, 0);
  await waTick();
  evo.calls = [];
  alarms.length = 0;
  at(9, 12, 50, 0);
  assert.equal((await waTick()).sent, 1);
  const skips = w.journal().filter((x) => x.ev === "skip");
  assert.deepEqual(skips.map((x) => [x.msg, x.reason, x.plan, x.lateMin]), [["reel-119k", "lag", "12:00", 50], ["reg-bonus", "lag", "12:04", 46]]);
  assert.equal(lagAlarms().length, 1, "одна тревога на всю пачку");
  assert.match(lagAlarms()[0], /Пропущено из-за отставания: reel-119k, reg-bonus в «Вайб-продакшен · эфир 09\.10»/);
  for (const [h, mi, s] of [[12, 54, 0], [12, 58, 0], [13, 5, 0]]) {
    at(9, h, mi, s);
    await waTick();
  }
  const rows = mainSends(w).filter((x) => x.msg !== "morning");
  assert.deepEqual(rows.map((x) => [x.msg, almHM(x.ts)]), [["warm-edits", "12:50"], ["noface", "12:54"], ["numbers", "12:58"]], "остальные по очереди с шагом 4 минуты");
  assert.equal(lagAlarms().length, 1, "тревога не повторяется");
  assert.ok((waPanel(clock.t) as any).journal.some((x: any) => x.kind === "error" && /^Пропущено «.*» в .*отставание от графика, просрочено больше чем на 45 минут \(плановое время 12:00\)/.test(x.text)));
  // рестарт: пропущенные помнятся по журналу, второй записи и второй тревоги нет
  restart(w);
  at(9, 13, 10, 0);
  await waTick();
  assert.equal(w.journal().filter((x) => x.ev === "skip").length, 2);
  assert.equal(lagAlarms().length, 1);
});

test("очередь: что не успеет дойти до 45 минут, пропускается сразу вместе с остальными просроченными, одной тревогой", async () => {
  const w = boot({
    edit: (s) => {
      for (const id of ["reel-119k", "reg-bonus", "warm-edits", "noface", "numbers", "video-ai"]) setAt(s, id, "12:10");
    },
  });
  await createFor(w, 9);
  at(9, 11, 30, 5);
  await waTick();
  alarms.length = 0;
  // 12:50: все шесть опоздали на 40 минут; по порядку они уйдут в 12:50 (40), 12:54 (44), 12:58 (48, поздно) и так далее
  at(9, 12, 50, 0);
  assert.equal((await waTick()).sent, 1);
  at(9, 12, 54, 0);
  assert.equal((await waTick()).sent, 1);
  at(9, 13, 30, 0);
  assert.equal((await waTick()).sent, 0);
  assert.deepEqual(mainSends(w).filter((x) => x.msg !== "morning").map((x) => x.msg), ["reel-119k", "reg-bonus"]);
  const skips = w.journal().filter((x) => x.ev === "skip");
  assert.deepEqual(skips.map((x) => [x.msg, x.reason, x.predicted === true]), [["warm-edits", "lag", true], ["noface", "lag", true], ["numbers", "lag", true], ["video-ai", "lag", true]]);
  assert.equal(lagAlarms().length, 1);
  assert.match(lagAlarms()[0], /warm-edits, noface, numbers, video-ai/);
});

test("очередь: в очереди дневное сообщение и 19:50 со ссылкой: первым уходит 19:50, более ранние неушедшие пропускаются; из нескольких ссылок первой идёт свежая", async () => {
  const w = boot({
    edit: (s) => {
      for (const m of s.messages) m.enabled = ["live-bonus", "t-minus-30", "t-minus-10", "live-now", "live-10"].includes(m.id);
      setAt(s, "live-bonus", "19:40");
      setAt(s, "t-minus-30", "19:45");
    },
  });
  await createFor(w, 9);
  evo.calls = [];
  alarms.length = 0;
  at(9, 19, 52, 0); // тиков с 19:30 не было: дневное 19:40 и 19:45 созрели вместе с 19:50
  assert.equal((await waTick()).sent, 1);
  const files = () => evo.of("/message/sendMedia").map((c) => String(c.body.media).split("/").pop()!.split("?")[0]);
  assert.deepEqual(files(), ["t-minus-10.jpg"], "первым уходит ссылка на эфир");
  assert.deepEqual(w.journal().filter((x) => x.ev === "skip").map((x) => [x.msg, x.reason, x.by]), [["live-bonus", "live", "t-minus-10"], ["t-minus-30", "live", "t-minus-10"]]);
  assert.equal(w.journal().filter((x) => x.ev === "queued").length, 0, "никого не ждёт: ссылка уходит сразу");
  assert.equal(lagAlarms().length, 0, "это не просрочка, тревоги нет");
  for (const [h, mi] of [[19, 56], [20, 10]]) {
    at(9, h, mi, 0);
    await waTick();
  }
  assert.equal(files().includes("live-bonus.jpg"), false, "пропущенное потом не воскресает");
  assert.equal(mainSends(w)[0].msg, "t-minus-10");
  assert.equal(mainSends(w).some((x) => x.msg === "live-bonus" || x.msg === "t-minus-30"), false);
  assert.ok((waPanel(clock.t) as any).journal.some((x: any) => /^Пропущено «.*» в .*в очереди ссылка на эфир/.test(x.text)));

  // несколько ссылок сразу: 20:00, 20:10 и 20:15 созрели вместе, свежая 20:15 идёт первой, более ранние ссылки и дневное пропускаются
  const w2 = boot({
    edit: (s) => {
      for (const m of s.messages) m.enabled = ["live-bonus", "live-now", "live-10", "last-link", "training"].includes(m.id);
      setAt(s, "live-bonus", "19:58");
    },
  });
  await createFor(w2, 9);
  evo.calls = [];
  at(9, 20, 16, 0);
  assert.equal((await waTick()).sent, 1);
  assert.deepEqual(mainSends(w2).map((x) => x.msg), ["last-link"]);
  assert.deepEqual(w2.journal().filter((x) => x.ev === "skip" && x.reason === "live").map((x) => x.msg), ["live-bonus", "live-now", "live-10"]);
});

test("очередь: обычный день без отставания: всё уходит строго по расписанию, 20:10 и 20:15 оба вовремя, очереди и пропусков нет", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  alarms.length = 0;
  // тик каждые 30 секунд с 11:00 до 23:40
  for (let s = 11 * 120; s <= 23 * 120 + 80; s++) {
    clock.t = alm(2026, 10, 9, 0, 0) + s * 30_000;
    await waTick();
  }
  const series = JSON.parse(readFileSync(WA_SERIES, "utf8")).messages.filter((m: any) => m.enabled !== false && !m.dayOffset);
  const rows = mainSends(w, t.id);
  assert.deepEqual(rows.map((x) => x.msg), series.map((m: any) => m.id), "все сообщения дня по порядку");
  for (const m of series) {
    const [h, mi] = m.at.split(":").map(Number);
    const row = rows.find((x) => x.msg === m.id);
    assert.equal(Date.parse(row.ts), alm(2026, 10, 9, h, mi), `${m.id} ушло ровно в ${m.at}`);
  }
  assert.deepEqual(rows.filter((x) => ["live-10", "last-link"].includes(x.msg)).map((x) => almHM(x.ts)), ["20:10", "20:15"]);
  assert.equal(w.journal().filter((x) => x.ev === "queued" || x.ev === "skip").length, 0);
  assert.equal(lagAlarms().length, 0);
});

test("очередь: после рестарта промежуток восстанавливается из журнала: второго сообщения сразу не будет", async () => {
  const w = boot({
    edit: (s) => {
      setAt(s, "reel-119k", "12:00");
      setAt(s, "reg-bonus", "12:02");
    },
  });
  await createFor(w, 9);
  at(9, 11, 30, 5);
  await waTick();
  at(9, 12, 0, 5);
  assert.equal((await waTick()).sent, 1);
  restart(w);
  assert.equal(w.rt().lastSeries.size, 1, "последняя отправка прочитана из журнала");
  evo.calls = [];
  at(9, 12, 2, 10); // reg-bonus созрел, но с 12:00:05 нет и четырёх минут
  assert.equal((await waTick()).sent, 0);
  assert.equal(evo.of("/message/send").length, 0);
  at(9, 12, 4, 0);
  assert.equal((await waTick()).sent, 0);
  at(9, 12, 4, 10);
  assert.equal((await waTick()).sent, 1);
  assert.deepEqual(mainSends(w).slice(-2).map((x) => x.msg), ["reel-119k", "reg-bonus"]);
  assert.deepEqual(w.journal().filter((x) => x.ev === "queued").map((x) => [x.msg, x.reason]), [["reg-bonus", "gap"]], "причина в журнале, одна запись");
});

test("очередь: опрос после утреннего сообщения уходит как раньше, промежуток на него не действует; следующее сообщение промежуток выдерживает", async () => {
  const w = boot({ edit: (s) => setAt(s, "reel-119k", "11:31") });
  await createFor(w, 9);
  evo.calls = [];
  // картинка и опрос в одном тике через обычную паузу шага, промежутка между ними нет
  at(9, 11, 30, 5);
  sleeps.length = 0;
  assert.equal((await waTick()).sent, 1);
  assert.equal(evo.of("/message/sendPoll").length, 1);
  assert.equal(sleeps.length, 1);
  assert.ok(sleeps[0] >= 2000 && sleeps[0] <= 4000, "пауза шага 2 до 4 секунд, не минуты");

  // опрос не ушёл (4xx): повтор через минуту уходит сразу, хотя с картинки прошла всего минута; следующее сообщение ждёт промежуток
  const w2 = boot({ edit: (s) => setAt(s, "reel-119k", "11:31") });
  await createFor(w2, 9);
  evo.calls = [];
  evo.fail = (c) => (c.path.startsWith("/message/sendPoll") ? { status: 400 } : null);
  at(9, 11, 30, 5);
  await waTick();
  evo.fail = null;
  assert.equal(evo.of("/message/sendMedia").length, 1);
  at(9, 11, 31, 10);
  assert.equal((await waTick()).sent, 1, "дослан опрос, не новое сообщение");
  assert.equal(evo.of("/message/sendPoll").length, 2);
  assert.equal(evo.of("/message/sendMedia").length, 1, "121 тысяча просмотров ещё ждёт промежутка");
  at(9, 11, 31, 40);
  assert.equal((await waTick()).sent, 0);
  at(9, 11, 34, 0);
  assert.equal((await waTick()).sent, 0);
  at(9, 11, 34, 10);
  assert.equal((await waTick()).sent, 1);
  assert.match(evo.of("/message/sendMedia")[1].body.caption, /65 тысяч просмотров/);
  assert.deepEqual(mainSends(w2).map((x) => x.msg), ["morning", "reel-119k"], "опрос в основные части не входит");
  assert.deepEqual(w2.journal().filter((x) => x.ev === "send" && x.part === "poll").map((x) => x.ok), [false, true]);
});

test("очередь: /wa_send вручную промежутком не ограничен, но после ручной отправки плановое сообщение выдерживает промежуток", async () => {
  const w = boot();
  await createFor(w, 9);
  at(9, 11, 30, 5);
  await waTick(); // утреннее по плану
  evo.calls = [];
  assert.match((await ownerSay("/wa_send reg-bonus"))[0], /«reg-bonus»: отправлено 1, уже было 0/);
  assert.match((await ownerSay("/wa_send reel-119k"))[0], /«reel-119k»: отправлено 1, уже было 0/);
  assert.match((await ownerSay("/wa_send numbers"))[0], /«numbers»: отправлено 1, уже было 0/);
  assert.equal(evo.of("/message/sendMedia").length, 3, "три подряд в ту же секунду, как решил владелец");
  // плановое 14:00 после ручной отправки в 13:58:30 ждёт промежутка
  at(9, 13, 58, 30);
  assert.match((await ownerSay("/wa_send video-ai"))[0], /отправлено 1/);
  at(9, 14, 0, 0);
  evo.calls = [];
  assert.equal((await waTick()).sent, 0);
  at(9, 14, 2, 20);
  assert.equal((await waTick()).sent, 0);
  at(9, 14, 2, 40);
  assert.equal((await waTick()).sent, 1);
  assert.match(evo.of("/message/sendMedia")[0].body.caption, /Я не открывал CapCut/);
});

test("очередь: сообщества независимы: промежуток у каждого свой; между сообществами в один тик прежняя пауза 4 до 9 секунд", async () => {
  const w = boot({
    edit: (s) => {
      setAt(s, "morning", "10:31");
      setAt(s, "reel-119k", "10:32");
    },
  });
  const t9 = await createFor(w, 9);
  const t10 = await createFor(w, 10);
  const sentTo = (jid: string) => evo.calls.filter((c) => c.path.startsWith("/message/sendMedia") && c.body.number === jid);
  evo.calls = [];
  at(10, 10, 30, 5);
  assert.equal((await waTick()).sent, 1); // «+1 день» 10:30 вчерашнему сообществу
  assert.equal(sentTo(t9.sendJid).length, 1);
  at(10, 10, 31, 5); // у сообщества 10-го промежуток чистый, хотя у 9-го он ещё идёт
  assert.equal((await waTick()).sent, 1);
  assert.equal(sentTo(t10.sendJid).length, 1);
  at(10, 10, 32, 5); // а внутри одного сообщества 10-го следующее ждёт
  assert.equal((await waTick()).sent, 0);
  at(10, 10, 35, 10);
  assert.equal((await waTick()).sent, 1);
  assert.equal(sentTo(t10.sendJid).length, 2);
  // два сообщества за один тик: пауза между отправками 4 до 9 секунд, промежуток друг на друга не влияет
  const w2 = boot({ edit: (s) => setAt(s, "next-1030", "11:30") });
  const a = await createFor(w2, 9);
  const b = await createFor(w2, 10);
  evo.calls = [];
  sleeps.length = 0;
  at(10, 11, 30, 5);
  assert.equal((await waTick()).sent, 2);
  assert.equal(sentTo(a.sendJid).length, 1);
  assert.equal(sentTo(b.sendJid).length, 1);
  assert.ok(sleeps[0] >= 4000 && sleeps[0] <= 9000, `пауза между сообществами ${sleeps[0]}`);
});

test("очередь: minGapMinutes берётся из расписания; 0 выключает промежуток; неверные значения отвергаются", async () => {
  const good = () => JSON.parse(readFileSync(WA_SERIES, "utf8"));
  for (const v of [-1, 31, "4", null, Number.NaN]) {
    const s = good();
    s.pacing.minGapMinutes = v;
    assert.throws(() => validateWaSeries(s), /pacing\.minGapMinutes/, String(v));
  }
  assert.doesNotThrow(() => validateWaSeries(good()), "в файле значения может не быть: тогда 4 минуты");
  // 10 минут: 12:05 после 12:00 ждёт до 12:10
  const w = boot({
    edit: (s) => {
      s.pacing.minGapMinutes = 10;
      setAt(s, "reel-119k", "12:00");
      setAt(s, "reg-bonus", "12:05");
    },
  });
  await createFor(w, 9);
  at(9, 11, 30, 5);
  await waTick(); // утреннее вовремя
  at(9, 12, 0, 5);
  assert.equal((await waTick()).sent, 1);
  at(9, 12, 5, 5);
  assert.equal((await waTick()).sent, 0);
  at(9, 12, 10, 0);
  assert.equal((await waTick()).sent, 0);
  at(9, 12, 10, 10);
  assert.equal((await waTick()).sent, 1);
  // 0: промежутка нет, оба созревших уходят в один тик с обычной паузой между отправками
  const w0 = boot({
    edit: (s) => {
      s.pacing.minGapMinutes = 0;
      setAt(s, "reel-119k", "12:00");
      setAt(s, "reg-bonus", "12:00");
    },
  });
  await createFor(w0, 9);
  at(9, 11, 30, 5);
  await waTick(); // утреннее вовремя
  sleeps.length = 0;
  at(9, 12, 0, 5);
  assert.equal((await waTick()).sent, 2);
  assert.ok(sleeps[0] >= 4000 && sleeps[0] <= 9000);
});

// ───────────────────────── шаг настройки lock: только у обычной группы, у сообщества его нет ─────────────────────────

test("lock: у сообщества и его вкладки объявлений шага нет (WhatsApp отвечает на locked bad-request), старая цель с tries.lock или без done.lock шаг тоже не получает", async () => {
  const w = boot();
  at(8, 20, 0, 0);
  evo.calls = [];
  assert.equal((await waTick()).created, 1);
  const t = w.state().targets[0];
  assert.equal(t.kind, "community");
  const locks = () => evo.calls.filter((c) => c.body?.action === "locked");
  assert.equal(locks().length, 0, "ни у сообщества, ни у вкладки объявлений");
  assert.equal(t.done.lock, undefined);
  assert.equal(t.tries.lock, undefined);
  assert.equal(t.lockAt, undefined);
  assert.equal(evo.of("/group/updateSetting").length, 0, "вкладку объявлений настройками не трогаем");
  assert.equal(evo.of("/community/updateSetting").length, 0, "вкладка и так announce: true, настройка не нужна");
  assert.equal(t.done.welcome, true, "остальные шаги прошли");

  // цель, созданная до этого решения: без done.lock и даже с записанными попытками lock; шаг не выполняется, тревоги нет
  const st = w.rt().state.targets[0];
  delete st.done.lock;
  st.tries.lock = 2;
  evo.calls = [];
  at(8, 20, 6, 0);
  await waTick();
  at(8, 20, 12, 0);
  await waTick();
  assert.equal(locks().length, 0, "старая цель шаг не получает");
  assert.equal(evo.of("/community/updateSetting").length, 0);
  assert.equal(evo.of("/group/updateSetting").length, 0);
  assert.equal(w.rt().state.targets[0].done.lock, undefined);
  assert.equal(w.rt().state.targets[0].tries.lock, 2, "попытки не растут");
  assert.equal(alarms.filter((a) => a.includes("от правок участниками")).length, 0);
  assert.equal(w.state().paused, false);
});

test("lock у обычной группы: шаг после announce и до ссылки; старая цель без done.lock получает его сама; сбой не ломает остальное, повтор не чаще раза в 5 минут, после трёх попыток одна тревога", async () => {
  const w = boot({ kind: "group" });
  process.env.WA_ADMIN_NUMBERS = "77085834575";
  at(8, 20, 0, 0);
  evo.calls = [];
  assert.equal((await waTick()).created, 1);
  const t = w.state().targets[0];
  assert.equal(t.kind, "group");
  assert.equal(t.done.lock, true);
  const locks = () => evo.calls.filter((c) => c.body?.action === "locked");
  const route = (c: { path: string }) => c.path.split("/").slice(0, 3).join("/"); // без имени инстанса в конце
  assert.deepEqual(locks().map((c) => [route(c), c.body.groupJid]), [["/group/updateSetting", t.jid]]);
  // lock стоит сразу после announce, до ссылки
  const seq = evo.seq().filter((x) => !x.includes("connectionState") && !x.includes("fetchInstances"));
  assert.ok(seq.indexOf("POST /group/create") < seq.indexOf("POST /group/updateSetting") && seq.lastIndexOf("POST /group/updateSetting") < seq.indexOf("GET /group/inviteCode"));
  assert.equal(evo.of("/group/updateSetting").length, 2, "announcement и locked");

  // группа, созданная до появления шага: done.lock нет, на ближайшем проходе шаг выполняется
  const st = w.rt().state.targets[0];
  delete st.done.lock;
  delete st.tries.lock;
  delete st.lockAt;
  evo.calls = [];
  at(8, 20, 1, 0);
  await waTick();
  assert.equal(w.rt().state.targets[0].done.lock, true);
  assert.deepEqual(locks().map(route), ["/group/updateSetting"]);
  assert.equal(w.state().targets[0].done.lock, true, "записано на диск");
  evo.calls = [];
  at(8, 20, 1, 30);
  await waTick();
  assert.equal(locks().length, 0, "повторно не делается");

  // сбой lock: остальные шаги идут, цель готова, ошибок подряд нет, повтор не чаще раза в 5 минут, после трёх попыток одна тревога
  const w2 = boot({ kind: "group" });
  evo.fail = (c) => (c.path.startsWith("/group/updateSetting") && c.body?.action === "locked" ? { status: 400, json: { status: 400, error: "Bad Request", response: { message: ["locked"] } } } : null);
  at(8, 20, 0, 0);
  assert.equal((await waTick()).created, 1);
  const t2 = w2.state().targets[0];
  assert.deepEqual([t2.done.link, t2.done.avatar, t2.done.welcome, t2.done.lock, t2.tries.lock], [true, true, true, undefined, 1]);
  assert.equal(w2.state().failStreak, 0, "косметика: не ошибка подряд");
  assert.ok(waGroupLink(alm(2026, 10, 8, 21, 0)), "группа рабочая");
  at(8, 20, 2, 0);
  await waTick();
  assert.equal(w2.state().targets[0].tries.lock, 1, "раньше чем через 5 минут не повторяем");
  at(8, 20, 5, 10);
  await waTick();
  at(8, 20, 10, 20);
  await waTick();
  assert.equal(w2.state().targets[0].tries.lock, 3);
  assert.equal(alarms.filter((a) => a.includes("от правок участниками")).length, 1);
  at(8, 20, 20, 0);
  await waTick();
  assert.equal(w2.state().targets[0].tries.lock, 3, "после трёх попыток больше не пробуем");
  assert.equal(alarms.filter((a) => a.includes("от правок участниками")).length, 1);
  assert.equal(w2.state().paused, false);
});

// ───────────────────────── ошибки, пауза, подключение ─────────────────────────

test("три ошибки подряд: повтор с паузой, потом пауза модуля и тревога; на паузе запросов к Evolution нет; /wa_resume возвращает", async () => {
  const w = boot();
  await createFor(w, 9);
  // явный отказ 4xx: ошибка с повтором (5xx и таймаут повторов не дают, их проверяет отдельный тест)
  evo.fail = (c) => (c.path.startsWith("/message/") ? { status: 400 } : null);
  evo.calls = [];
  at(9, 11, 30, 5);
  await waTick(); // ошибка 1, повтор через 60 с
  assert.equal(w.state().failStreak, 1);
  const media = evo.of("/message/sendMedia").length;
  at(9, 11, 30, 35);
  assert.equal((await waTick()).skipped, "backoff");
  assert.equal(evo.of("/message/sendMedia").length, media, "в паузу между повторами не шлём");
  at(9, 11, 31, 10);
  await waTick(); // ошибка 2, повтор через 180 с
  assert.equal(w.state().failStreak, 2);
  assert.equal(w.state().paused, false);
  at(9, 11, 34, 20);
  await waTick(); // ошибка 3: пауза
  assert.equal(w.state().failStreak, 3);
  assert.equal(w.state().paused, true);
  const pauseAlarms = alarms.filter((a) => a.includes("на паузе"));
  assert.equal(pauseAlarms.length, 1);
  assert.match(pauseAlarms[0], /3 ошибки подряд/);
  assert.equal(pauseAlarms[0].includes(EVO_KEY), false);
  const callsOnPause = evo.calls.length;
  at(9, 11, 35, 0);
  assert.equal((await waTick()).skipped, "paused");
  assert.equal(await joinsTick(), 0);
  assert.equal(evo.calls.length, callsOnPause, "на паузе к Evolution не обращаемся совсем");
  // снимаем паузу командой владельца, отправка проходит в пределах окна (до 11:42)
  evo.fail = null;
  at(9, 11, 40, 0);
  const [reply] = await ownerSay("/wa_resume");
  assert.match(reply, /Пауза снята/);
  assert.equal(w.state().paused, false);
  assert.equal(w.state().failStreak, 0);
  assert.equal((await waTick()).sent, 1);
});

test("удачная отправка обнуляет счётчик ошибок: две ошибки с перерывом не дают паузу", async () => {
  const w = boot();
  await createFor(w, 9);
  let failures = 2; // картинка и её текстовая замена: одна неудачная отправка
  evo.fail = (c) => (c.path.startsWith("/message/") && failures-- > 0 ? { status: 400 } : null);
  at(9, 11, 30, 5);
  await waTick();
  assert.equal(w.state().failStreak, 1);
  at(9, 11, 31, 10);
  await waTick();
  assert.equal(w.state().failStreak, 0, "успех сбросил счётчик");
  assert.equal(w.state().paused, false);
});

test("нет подключения: ничего не уходит, тревога раз в час и не чаще; после возврата подключения всё идёт", async () => {
  const w = boot();
  await createFor(w, 9);
  evo.calls = [];
  evo.state = "close";
  at(9, 11, 30, 5);
  assert.equal((await waTick()).skipped, "no_connection");
  assert.deepEqual(evo.seq(), ["GET /instance/connectionState"], "кроме проверки подключения запросов нет");
  assert.equal(alarms.length, 1);
  assert.match(alarms[0], /WhatsApp не подключён \(состояние: close\)/);
  at(9, 11, 40, 0);
  await waTick();
  at(9, 12, 29, 0);
  await waTick();
  assert.equal(alarms.length, 1, "в течение часа повторной тревоги нет");
  at(9, 12, 31, 0);
  await waTick();
  assert.equal(alarms.length, 2, "через час вторая");
  assert.equal(evo.of("/message/").length + evo.of("/community/create").length, 0);
  // подключение вернулось: окно 11:30 уже закрыто, но 12:30 уходит
  evo.state = "open";
  at(9, 12, 33, 0);
  assert.equal((await waTick()).sent, 1);
  // Evolution недоступен совсем: то же самое, что нет подключения
  const saved = process.env.EVOLUTION_URL;
  process.env.EVOLUTION_URL = "http://127.0.0.1:1";
  at(9, 14, 0, 5);
  assert.equal((await waTick()).skipped, "no_connection");
  assert.match(alarms[alarms.length - 1], /unreachable/);
  process.env.EVOLUTION_URL = saved;
});

test("создание без чёткого ответа: тревога и ожидание /wa_resume без паузы модуля, вслепую не повторяем; 4xx это отказ с повтором через 5 минут", async () => {
  const w = boot();
  evo.fail = (c) => (c.path.startsWith("/community/create") ? { status: 500 } : null);
  at(8, 20, 0, 0);
  await waTick();
  assert.equal(w.state().paused, false, "сообщество создаётся в разгар эфира: пауза остановила бы рассылку");
  assert.ok(w.state().pendingCreate);
  assert.equal(w.state().creations.length, 1, "неясная попытка учтена в лимите");
  assert.match(alarms[0], /проверь список чатов на телефоне/);
  at(8, 20, 5, 0);
  assert.equal((await waTick()).skipped, "paused");
  assert.equal(evo.of("/community/create").length, 1);
  evo.fail = null;
  await ownerSay("/wa_resume");
  assert.equal(w.state().pendingCreate, null);
  at(8, 20, 10, 0);
  assert.equal((await waTick()).created, 1);

  // 400: сообщество не создано, общий счётчик ошибок не растёт, повтор через 5 минут
  const w2 = boot();
  evo.fail = (c) => (c.path.startsWith("/community/create") ? { status: 400 } : null);
  at(8, 20, 0, 0);
  await waTick();
  assert.equal(w2.state().paused, false);
  assert.equal(w2.state().failStreak, 0);
  assert.equal(w2.state().retryAt, 0);
  assert.equal(w2.state().pendingCreate, null);
  evo.fail = null;
  at(8, 20, 1, 5);
  assert.equal((await waTick()).created, 0, "раньше чем через 5 минут не повторяем");
  at(8, 20, 5, 10);
  assert.equal((await waTick()).created, 1);
});

test("замок: чужой живой процесс держит данные, этот не шлёт и не создаёт", async () => {
  const w = boot();
  const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 30000)"], { stdio: "ignore" });
  try {
    writeFileSync(join(w.dir, "wa.lock"), JSON.stringify({ pid: child.pid, ts: Date.now() }));
    at(8, 20, 0, 0);
    assert.equal((await waTick()).skipped, "lock");
    assert.equal(evo.calls.length, 0);
    writeFileSync(join(w.dir, "wa.lock"), JSON.stringify({ pid: child.pid, ts: Date.now() - 10 * 60_000 }));
    assert.equal((await waTick()).created, 1, "устаревшая отметка замок не держит");
  } finally {
    child.kill();
  }
});

// ───────────────────────── заявки на вступление ─────────────────────────

test("заявки: автоодобрение, журнал «кто вступил» с исходными атрибутами, интервал 15 до 30 секунд, повтор по неудачным не бесконечный", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  at(9, 10, 0, 0);
  await waTick(); // подключение open
  const reqs = [
    { jid: "55501234567@lid", phone_number: "77010000001", request_time: "1760000000", request_method: "invite_link" },
    { jid: "77010000002@s.whatsapp.net", request_time: "1760000001", request_method: "invite_link" },
  ];
  evo.requests.set(t.jid, reqs.map((r) => ({ ...r })));
  evo.calls = [];
  assert.equal(await joinsTick(), 2);
  assert.deepEqual(evo.seq(), ["GET /community/requests", "POST /community/requests"]);
  assert.deepEqual(evo.of("/community/requests")[1].body, { participants: [reqs[0].jid, reqs[1].jid], action: "approve" });
  const joins = w.joins();
  assert.deepEqual(joins.filter((r) => r.ev === "request").map((r) => r.raw), reqs, "исходные атрибуты сохранены как пришли");
  assert.equal(joins.find((r) => r.ev === "request").phone, "77010000001");
  assert.equal(joins.filter((r) => r.ev === "request")[1].phone, "");
  assert.deepEqual(joins.filter((r) => r.ev === "approve").map((r) => [r.jid, r.ok, r.status]), [[reqs[0].jid, true, "200"], [reqs[1].jid, true, "200"]]);
  // интервал до следующего опроса в диапазоне 15 до 30 секунд
  const next = w.rt().joinNextAt.get(t.id)! - clock.t;
  assert.ok(next >= 15_000 && next <= 30_000, `интервал ${next}`);
  evo.calls = [];
  assert.equal(await joinsTick(), 0);
  assert.equal(evo.calls.length, 0, "раньше срока не опрашиваем");
  clock.t += 31_000;
  await joinsTick();
  assert.deepEqual(evo.seq(), ["GET /community/requests"], "новых заявок нет, одобрять нечего");

  // одну заявку WhatsApp не принял: три попытки и хватит
  const bad = { jid: "99900000009@lid", request_time: "1760000009" };
  evo.requests.set(t.jid, [{ ...bad }]);
  evo.rejectJids.add(bad.jid);
  for (let i = 0; i < 5; i++) {
    clock.t += 31_000;
    await joinsTick();
  }
  assert.equal(evo.of("/community/requests").filter((c) => c.method === "POST").length, 3, "три попытки одобрить и хватит");
  assert.equal(w.joins().filter((r) => r.ev === "request" && r.jid === bad.jid).length, 1, "заявка записана один раз");
  // отчёт и счётчики
  assert.equal(w.rt().joinedCount.get(t.id), 2);
  assert.equal(waReportLine("2026-10-09"), `WhatsApp: вступили по заявкам 2, сообщений серии ушло 0 из ${DAY0()}.`);
  assert.match(dayReportText(getStore(), "2026-10-09"), /\nWhatsApp: вступили по заявкам 2/);
  // после рестарта журнал восстанавливает «уже одобрено», повторно не одобряем
  const dir = w.dir;
  resetWaGroups();
  initWaGroups({ dir, seriesFile: join(dir, "wa-series.json"), deps: deps() });
  assert.equal(_waRt()!.joinedCount.get(t.id), 2);
  assert.equal(_waRt()!.approved.size, 2);
});

test("заявки: щадящий режим (необязательный): горячий интервал 15 до 30 с после выдачи ссылки, в покое реже, выдача ссылки ускоряет опрос", async () => {
  const w = boot({ edit: (x) => { x.joinPolling.idleSec = [120, 180]; x.joinPolling.hotMinutes = 15; } });
  const t = await createFor(w, 9);
  at(9, 10, 0, 0);
  await waTick();
  await joinsTick(); // первый опрос сразу, но ссылку никому не выдавали: следующий через 120 до 180 секунд
  const idle = w.rt().joinNextAt.get(t.id)! - clock.t;
  assert.ok(idle >= 120_000 && idle <= 180_000, `покой ${idle}`);
  clock.t += 20_000;
  evo.calls = [];
  await joinsTick();
  assert.equal(evo.calls.length, 0, "в покое раньше срока не опрашиваем");
  // человеку отдали ссылку на сайте: опрос через 15 секунд, а не через минуты
  assert.equal(waGroupLink(clock.t), t.link);
  assert.ok(w.rt().joinNextAt.get(t.id)! - clock.t <= 15_000);
  clock.t += 16_000;
  await joinsTick();
  assert.equal(evo.of("/community/requests").length, 1);
  const hot = w.rt().joinNextAt.get(t.id)! - clock.t;
  assert.ok(hot >= 15_000 && hot <= 30_000, `горячий ${hot}`);
  // команда /wa ссылку «не выдаёт» и опрос не ускоряет
  clock.t += 16 * 60_000;
  await joinsTick();
  const calm = w.rt().joinNextAt.get(t.id)! - clock.t;
  assert.ok(calm >= 120_000 && calm <= 180_000, `снова покой ${calm}`);
  const before = w.rt().joinNextAt.get(t.id);
  await ownerSay("/wa");
  assert.equal(w.rt().joinNextAt.get(t.id), before);
  // найденные заявки тоже держат режим горячим
  evo.requests.set(t.jid, [{ jid: "5@lid" }]);
  clock.t = before! + 1;
  await joinsTick();
  const afterRequest = w.rt().joinNextAt.get(t.id)! - clock.t;
  assert.ok(afterRequest >= 15_000 && afterRequest <= 30_000, `после заявки ${afterRequest}`);
});

test("заявки: на паузе, без подключения и у обычной группы не опрашиваем; сбой опроса не ставит модуль на паузу, тревога после 5 подряд и раз в час", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  at(9, 10, 0, 0);
  await waTick();
  evo.requests.set(t.jid, [{ jid: "1@lid" }]);
  evo.calls = [];
  w.state(); // состояние читается из файла
  await waCommand("wa_pause", "", clock.t);
  assert.equal(await joinsTick(), 0);
  assert.equal(evo.calls.length, 0);
  await waCommand("wa_resume", "", clock.t);
  evo.state = "close";
  await waTick();
  evo.calls = [];
  assert.equal(await joinsTick(), 0);
  assert.equal(evo.calls.length, 0, "нет подключения: не опрашиваем");
  evo.state = "open";
  at(9, 10, 1, 0);
  await waTick();

  evo.fail = (c) => (c.path.startsWith("/community/requests") ? { status: 500 } : null);
  for (let i = 0; i < 6; i++) {
    clock.t += 241_000; // щадящий режим: в покое опрос раз в 2 до 4 минут
    await joinsTick();
  }
  assert.equal(w.state().paused, false, "сбой заявок не пауза модуля");
  assert.equal(alarms.filter((a) => a.includes("заявки на вступление не одобряются")).length, 1);

  // обычная группа: заявок нет вообще
  const w2 = boot({ kind: "group" });
  process.env.WA_ADMIN_NUMBERS = "77085834575";
  await createFor(w2, 9);
  at(9, 10, 0, 0);
  await waTick();
  evo.calls = [];
  assert.equal(await joinsTick(), 0);
  assert.equal(evo.of("/community/requests").length, 0);
});

test("разбор ответов патча: заявки списком или объектом, число участников из size и вкладки объявлений", () => {
  assert.deepEqual(normalizeRequests([{ jid: "a@lid", request_time: "1" }, "b@lid", { attrs: { jid: "c@lid" } }, {}, null]).map((r) => r.jid), ["a@lid", "b@lid", "c@lid"]);
  assert.deepEqual(normalizeRequests({ requests: [{ jid: "x@lid" }] }).map((r) => r.jid), ["x@lid"]);
  assert.deepEqual(normalizeRequests({ nope: 1 }), []);
  assert.equal(extractMembers({ size: 12 }, "A@g.us"), 12);
  assert.equal(extractMembers({ linkedGroups: [{ id: "B@g.us", size: 3 }, { id: "A@g.us", size: 40 }] }, "A@g.us"), 40);
  assert.equal(extractMembers({ participants: [{}, {}, {}] }, "A@g.us"), 3);
  assert.equal(extractMembers({ size: "1500" }, "A@g.us"), 1500);
  assert.equal(extractMembers({}, "A@g.us"), undefined);
});

// ───────────────────────── обычная группа (запасной тип) ─────────────────────────

test("запасной тип «группа»: создаётся с номерами из WA_ADMIN_NUMBERS, только админы пишут, сообщения идут в группу, заявок нет", async () => {
  const w = boot({ kind: "group" });
  // без номеров Evolution группу не создаст (в схеме минимум один участник): ошибка, а не молчание
  at(8, 20, 0, 0);
  await waTick();
  assert.equal(w.state().targets.length, 0);
  assert.equal(evo.of("/group/create").length, 0);
  assert.equal(w.state().failStreak, 1);
  process.env.WA_ADMIN_NUMBERS = "77085834575, +7 701 111 22 33,12";
  assert.deepEqual(adminNumbers(), ["77085834575", "77011112233"]);
  at(8, 20, 1, 5);
  await waTick();
  const create = evo.of("/group/create")[0].body;
  assert.deepEqual(create.participants, ["77085834575", "77011112233"]);
  assert.equal(create.promoteParticipants, true);
  assert.equal(create.subject, "Вайб-продакшен · эфир 09.10");
  assert.deepEqual(evo.of("/group/updateSetting")[0].body, { groupJid: w.state().targets[0].jid, action: "announcement" });
  assert.deepEqual(evo.of("/group/updateSetting")[1].body, { groupJid: w.state().targets[0].jid, action: "locked" }, "и у обычной группы шаг lock: менять её может только админ");
  assert.equal(evo.of("/group/updateSetting").length, 2);
  assert.equal(evo.of("/community").length, 0);
  const t = w.state().targets[0];
  assert.equal(t.kind, "group");
  assert.equal(t.sendJid, t.jid);
  assert.match(t.link, /^https:\/\/chat\.whatsapp\.com\/GRP/);
  assert.equal(waGroupLink(alm(2026, 10, 8, 21, 0)), t.link);
  at(9, 11, 30, 5);
  await waTick();
  assert.equal(evo.of("/message/sendMedia")[0].body.number, t.jid);
  // переполнение по числу участников группы: лимит 1000
  evo.members.set(t.jid, 1000);
  at(9, 11, 40, 0);
  await waTick();
  assert.equal(w.state().targets.length, 2);
  assert.equal(w.state().failStreak, 0);
});

// ───────────────────────── команды владельцев ─────────────────────────

test("команды: /wa показывает подключение, номер, эфиры, участников, ссылку, ближайшее сообщение; чужим не отвечает; /help перечисляет", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  evo.members.set(t.jid, 321);
  at(9, 10, 0, 0);
  const [txt] = await ownerSay("/wa");
  assert.match(txt, /WhatsApp-модуль: работает, тип сообщество/);
  assert.match(txt, /Подключение: open, \+77001112233/);
  assert.match(txt, /Эфир 09\.10: «Вайб-продакшен · эфир 09\.10», готово, участников 321/);
  assert.match(txt, /Следующий эфир 10\.10: пока нет, создам в 20:00 09\.10/);
  assert.match(txt, new RegExp(`Ссылка на сайте сейчас: ${t.link.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(txt, /Ближайшее сообщение: 11:30 morning \(эфир 09\.10\), через 1 ч 30 мин/);
  assert.match(txt, /Новых сообществ за сутки: 1 из 3/);
  assert.equal(txt.includes(INSTANCE_TOKEN), false, "токен инстанса не показываем");
  // чужому ничего, даже намёка на команду
  tg.reset();
  await processUpdate(upd(5, "/wa"), clock.t);
  assert.deepEqual(tg.texts(5), []);
  assert.match(HELP_TEXT, /\/wa_qr/);
  assert.match(HELP_TEXT, /\/wa_new/);
  // участников не перепроверяем чаще, чем раз в 5 минут, даже командой
  const infos = evo.of("/community/info").length;
  await ownerSay("/wa");
  assert.equal(evo.of("/community/info").length, infos);
  // на паузе
  await ownerSay("/wa_pause");
  assert.match((await ownerSay("/wa"))[0], /на паузе \(вручную, \/wa_pause\)/);
  assert.match((await ownerSay("/wa_pause"))[0], /уже на паузе/);
  await ownerSay("/wa_resume");
});

test("/wa_qr: создаёт инстанс, если его нет, присылает QR картинкой владельцу; раз в минуту; уже подключён: без картинки", async () => {
  boot();
  evo.state = "absent";
  at(9, 10, 0, 0);
  tg.reset();
  await processUpdate(upd(900, "/wa_qr"), clock.t);
  assert.equal(evo.of("/instance/create").length, 1);
  assert.equal(evo.of("/instance/create")[0].body.instanceName, "workshop");
  assert.equal(evo.of("/instance/create")[0].body.integration, "WHATSAPP-BAILEYS");
  assert.equal(evo.of("/instance/create")[0].body.qrcode, true);
  const photo = tg.calls.find((c) => c.method === "sendPhoto");
  assert.ok(photo, "QR ушёл картинкой");
  assert.ok(/name="chat_id"\r\n\r\n900\r\n/.test(photo!.raw), "владельцу, который попросил");
  assert.ok(photo!.raw.includes("PNG"), "в картинке PNG");
  // повторно раньше чем через минуту
  clock.t += 30_000;
  const [again] = await ownerSay("/wa_qr");
  assert.match(again, /раз в минуту, подожди ещё 30 с/);
  assert.equal(tg.calls.some((c) => c.method === "sendPhoto"), false);
  // инстанс уже есть, но не подключён: берём QR через connect
  clock.t += 40_000;
  evo.state = "close";
  tg.reset();
  await processUpdate(upd(900, "/wa_qr"), clock.t);
  assert.equal(evo.of("/instance/connect").length >= 1, true);
  assert.ok(tg.calls.some((c) => c.method === "sendPhoto"));
  // уже подключён: без картинки
  clock.t += 61_000;
  evo.state = "open";
  tg.reset();
  await processUpdate(upd(900, "/wa_qr"), clock.t);
  assert.equal(tg.calls.some((c) => c.method === "sendPhoto"), false);
  assert.match(tg.texts(900)[0], /уже подключён, номер \+77001112233/);
  // QR и ключи в журналы не попадают
  assert.equal(JSON.stringify(readdirSync(_waRt()!.dir).map((f) => readFileSync(join(_waRt()!.dir, f), "utf8"))).includes(PNG_B64), false);
});

test("/wa_pause и /wa_resume: пауза останавливает тик, возврат снимает паузу и счётчик", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  at(9, 11, 30, 5);
  assert.match((await ownerSay("/wa_pause"))[0], /Пауза включена/);
  assert.equal((await waTick()).skipped, "paused");
  assert.equal(evo.of("/message/sendMedia").length, 0);
  assert.equal(w.state().paused, true);
  at(9, 11, 31, 0);
  assert.match((await ownerSay("/wa_resume"))[0], /Пауза снята/);
  assert.equal((await waTick()).sent, 1);
  void t;
});

test("/wa_new: создаёт сообщество ближайшего эфира без сообщества вручную; повторно не дублирует; дальше завтра не создаёт; без модуля подсказка", async () => {
  const w = boot();
  at(8, 15, 0, 0);
  const [r1] = await ownerSay("/wa_new");
  assert.match(r1, /Создано: «Вайб-продакшен · эфир 08\.10»/);
  assert.equal(w.state().targets[0].day, "2026-10-08", "сегодняшнего эфира сообщества не было, создали его");
  const [r2] = await ownerSay("/wa_new");
  assert.match(r2, /Создано: «Вайб-продакшен · эфир 09\.10»/);
  const [r3] = await ownerSay("/wa_new");
  assert.match(r3, /уже есть\. Следующий без сообщества: 10\.10/);
  assert.equal(w.state().targets.length, 2);
  assert.match((await ownerSay("/wa_new 2026-10-09"))[0], /уже есть: «Вайб-продакшен · эфир 09\.10»/);
  assert.match((await ownerSay("/wa_new 2026-13-45"))[0], /Нужна дата эфира/);
  assert.match((await ownerSay("/wa_new 2026-10-30"))[0], /слишком далеко/);
  // нет подключения: честный отказ без запросов
  evo.state = "close";
  evo.calls = [];
  assert.match((await ownerSay("/wa_new 2026-10-10"))[0], /WhatsApp не подключён/);
  assert.equal(evo.of("/community/create").length, 0);
  // модуль выключен: подсказка
  registerWa(null);
  assert.match((await ownerSay("/wa_new"))[0], /Модуль WhatsApp выключен/);
  assert.match((await ownerSay("/wa"))[0], /Модуль WhatsApp выключен/);
});

test("/wa_send <id>: отправляет сообщение серии в сообщества сегодняшнего эфира, повторно не шлёт, плановая отправка потом не дублирует", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  at(9, 9, 0, 0);
  assert.match((await ownerSay("/wa_send"))[0], /Укажи id сообщения/);
  assert.match((await ownerSay("/wa_send nope"))[0], /Нет сообщения «nope»/);
  evo.calls = [];
  assert.match((await ownerSay("/wa_send offer"))[0], /«offer»: отправлено 1, уже было 0, не ушло 0/);
  const m = evo.of("/message/sendMedia")[0].body;
  assert.equal(m.number, t.sendJid);
  // оффер длиннее лимита подписи: картинка без подписи, текст отдельным сообщением
  assert.equal(m.caption, undefined);
  assert.match(evo.of("/message/sendText")[0].body.text, /Цена для участников эфира: курс Vibe Production за 150 000/);
  assert.ok(w.journal().find((r) => r.msg === "offer" && r.manual === true));
  assert.match((await ownerSay("/wa_send offer"))[0], /отправлено 0, уже было 1/);
  // плановое время подошло: уже отправленное не повторяется
  at(9, 21, 20, 5);
  evo.calls = [];
  await waTick();
  assert.equal(evo.of("/message/sendMedia").length, 0);
  // не сегодняшнему дню нет сообщества
  at(12, 9, 0, 0);
  assert.match((await ownerSay("/wa_send morning"))[0], /нет готового сообщества/);
});

test("команды /wa* уважают пустой список владельцев и чужих: молчат", async () => {
  boot();
  const saved = process.env.TG_LINK_OWNER_IDS;
  process.env.TG_LINK_OWNER_IDS = "";
  tg.reset();
  await processUpdate(upd(900, "/wa_new"), clock.t);
  assert.deepEqual(tg.texts(900), []);
  process.env.TG_LINK_OWNER_IDS = saved;
});

// ───────────────────────── без флага и защита номера ─────────────────────────

test("без WA_GROUPS=on модуль не стартует: ни файлов, ни запросов, ни команд, ссылка null, health выключен", async () => {
  const dir = tmp();
  resetWaGroups();
  registerWa(null);
  const stop = startWaGroups({ dir, deps: deps() });
  stop();
  assert.equal(_waRt(), null);
  assert.equal(waGroupLink(alm(2026, 10, 8, 21, 0)), null);
  assert.deepEqual(waHealth(), { enabled: false });
  assert.deepEqual(readdirSync(dir), [], "ни одного файла");
  assert.equal(evo.calls.length, 0, "ни одного запроса к Evolution");
  assert.equal(await waTick().then((r) => r.sent + r.created), 0);
  assert.equal(await joinsTick(), 0);
  assert.match((await waCommand("wa", "", clock.t)).text, /не запущен/);
  // флаг есть, но нет ключа Evolution: не стартует и говорит почему
  process.env.WA_GROUPS = "on";
  const key = process.env.EVOLUTION_API_KEY;
  delete process.env.EVOLUTION_API_KEY;
  startWaGroups({ dir, deps: deps() })();
  assert.equal(_waRt(), null);
  // публичный health отдаёт только признак ошибки без текста, полный текст виден в админке
  assert.deepEqual(waHealth(), { enabled: true, running: false, error: "init" });
  assert.equal((waPanel() as any).error, "нет EVOLUTION_API_KEY");
  process.env.EVOLUTION_API_KEY = key;
  // флаг не on: любое другое значение тоже выключено
  process.env.WA_GROUPS = "yes";
  startWaGroups({ dir, deps: deps() })();
  assert.equal(_waRt(), null);
  delete process.env.WA_GROUPS;
});

test("с WA_GROUPS=on стартует и останавливается; битое расписание не роняет сервис", async () => {
  const dir = tmp();
  const seriesPath = join(dir, "wa-series.json");
  writeFileSync(seriesPath, JSON.stringify({ ...JSON.parse(readFileSync(WA_SERIES, "utf8")), timezone: "UTC" }));
  process.env.WA_GROUPS = "on";
  const stop0 = startWaGroups({ dir, seriesFile: seriesPath, deps: deps() });
  stop0();
  assert.equal(_waRt(), null);
  assert.deepEqual(waHealth(), { enabled: true, running: false, error: "init" }, "в публичном health нет текста ошибки расписания");
  assert.equal(JSON.stringify(waHealth()).includes("Asia"), false);
  assert.match((waPanel() as any).error, /Asia\/Almaty/, "полный текст ошибки виден в админке");
  const stop = startWaGroups({ dir, seriesFile: WA_SERIES, deps: deps() });
  assert.ok(_waRt());
  assert.deepEqual({ ...waHealth() }, { enabled: true, running: true, paused: false, connection: "unknown", targets: 0, failStreak: 0 });
  stop();
  delete process.env.WA_GROUPS;
});

test("защита номера: тревога и журнал не содержат ключей, в состоянии и журналах нет токенов; ни одного сообщения людям", async () => {
  const w = boot();
  await createFor(w, 9);
  evo.fail = (c) => (c.path.startsWith("/message/") ? { status: 400, json: { status: 400, error: "x", response: { message: [`ключ ${EVO_KEY} в тексте`] } } } : null);
  at(9, 11, 30, 5);
  await waTick();
  at(9, 11, 31, 10);
  await waTick();
  at(9, 11, 34, 20);
  await waTick();
  assert.equal(w.state().paused, true);
  const all = readdirSync(w.dir).filter((f) => f.startsWith("wa")).map((f) => readFileSync(join(w.dir, f), "utf8")).join("\n") + alarms.join("\n");
  assert.equal(all.includes(EVO_KEY), false, "ключ API не попал ни в журнал, ни в состояние, ни в тревогу");
  assert.equal(all.includes(INSTANCE_TOKEN), false, "токен инстанса тоже");
  assert.deepEqual(evo.violations, []);
  // все отправки шли только в JID групп (проверяет и сам подставной сервер на каждом сообщении)
  for (const c of evo.of("/message/")) assert.ok(String(c.body.number).endsWith("@g.us"));
});

test("Telegram: тревога доходит владельцам через существующего бота", async () => {
  tg.reset();
  assert.ok((await notifyOwners("проверка тревоги")) >= 1);
  assert.deepEqual(tg.texts(900), ["проверка тревоги"]);
  assert.deepEqual(tg.texts(901), ["проверка тревоги"]);
});

// ───────────────────────── пульт: режимы, живой эфир, подключение, группы ─────────────────────────

const EVENT_DAY = "2026-10-12";

/** Живой эфир на 12 октября: режим event, набор с 9 октября. Часы на 8 октября 12:00. */
function bootEvent(o: BootOpts & { start?: string; recruitFrom?: string } = {}) {
  const w = boot({ daily: false, ...o });
  at(8, 12, 0, 0);
  assert.equal(waSetMode("event").ok, true);
  const set = waSetEvent({ date: EVENT_DAY, start: o.start ?? "20:00", recruitFrom: o.recruitFrom ?? "2026-10-09" });
  assert.equal(set.ok, true, set.message);
  return w;
}

const eventTarget = (w: ReturnType<typeof boot>) => w.state().targets.find((t: any) => t.day === EVENT_DAY);

test("режимы: после первого включения daily с выключенным созданием, ночью в 20:00 ничего не создаётся; включили, и создаётся", async () => {
  const w = boot({ daily: false });
  assert.equal(w.rt().state.mode, "daily");
  assert.equal(w.rt().state.daily.enabled, false);
  assert.equal(JSON.parse(readFileSync(join(w.dir, "wa-state.json"), "utf8")).daily.enabled, false);
  at(8, 20, 0, 0);
  const r = await waTick();
  assert.equal(r.created, 0);
  assert.equal(evo.of("/community/create").length, 0, "пока не включили, ничего не создаётся");
  // свежий файл состояния без поля mode тоже начинает с выключенного создания
  const dir = tmp();
  writeFileSync(join(dir, "wa-state.json"), JSON.stringify({ v: 1, targets: [] }));
  initWaGroups({ dir, seriesFile: WA_SERIES, deps: deps() });
  assert.deepEqual([_waRt()!.state.mode, _waRt()!.state.daily.enabled], ["daily", false]);
  boot({ daily: false });
  // включили: сообщество на завтра создаётся в окне догонки
  assert.equal(waSetDaily(true).ok, true);
  assert.equal(JSON.parse(readFileSync(join(_waRt()!.dir, "wa-state.json"), "utf8")).daily.enabled, true, "состояние записано на диск");
  at(8, 20, 5, 0);
  assert.equal((await waTick()).created, 1);
  assert.equal(evo.of("/community/create").length, 1);
  // выключили: новые не создаются, созданное продолжает работать (ссылка, прогрев)
  assert.equal(waSetDaily(false).ok, true);
  assert.ok(waGroupLink(alm(2026, 10, 9, 12, 0)), "созданное сообщество продолжает отдавать ссылку");
  at(9, 11, 30, 5);
  assert.equal((await waTick()).sent, 1, "и прогрев идёт");
  at(9, 20, 0, 0);
  assert.equal((await waTick()).created, 0, "выключено: на 10 октября не создаём");
  assert.equal(evo.of("/community/create").length, 1);
});

test("режимы взаимоисключающие: уход в живой эфир выключает ежедневное создание, созданное не трогается, ссылка идёт по режиму", async () => {
  const w = boot();
  const first = await createFor(w, 9); // daily, создано 8 октября в 20:00
  at(9, 12, 0, 0);
  assert.equal(waGroupLink(clock.t, false), first.link);
  evo.calls = [];
  const m = waSetMode("event");
  assert.equal(m.ok, true);
  assert.match(m.message, /Ежедневное создание выключено/);
  assert.equal(evo.calls.length, 0, "переключение не ходит в Evolution");
  assert.equal(w.state().mode, "event");
  assert.equal(w.state().daily.enabled, false, "созданием на ежедневном режиме больше не занимаемся");
  assert.equal(w.state().targets.length, 1, "созданное сообщество на месте");
  assert.equal(waGroupLink(clock.t, false), null, "в живом эфире без своего сообщества ссылка постоянная");
  assert.equal(waSetDaily(true).code, "wrong_mode");
  assert.equal(waSetMode("nonsense").code, "bad_request");
  assert.equal(waSetMode("event").code, "same");
  // а ежедневное сообщество по-прежнему получает прогрев
  at(9, 11, 30, 5);
  assert.equal((await waTick()).sent, 1);
  // назад: ежедневный режим, создание остаётся выключенным, пока не включишь сам; ссылка опять по ежедневному правилу
  at(9, 12, 0, 0);
  assert.equal(waSetMode("daily").ok, true);
  assert.equal(w.state().daily.enabled, false);
  assert.equal(waGroupLink(clock.t, false), first.link);
  at(9, 20, 0, 0);
  assert.equal((await waTick()).created, 0, "создание выключено");
  // режим и настройки переживают перезапуск
  waSetMode("event");
  waSetEvent({ date: EVENT_DAY, start: "20:00", recruitFrom: "2026-10-10" });
  const dir = w.dir;
  resetWaGroups();
  initWaGroups({ dir, seriesFile: join(dir, "wa-series.json"), deps: deps() });
  const st = _waRt()!.state;
  assert.deepEqual([st.mode, st.daily.enabled, st.event.date, st.event.start, st.event.recruitFrom], ["event", false, EVENT_DAY, "20:00", "2026-10-10"]);
});

test("живой эфир: настройки проверяются; задать можно только в режиме event, до создания сообщества", () => {
  boot({ daily: false });
  at(8, 12, 0, 0);
  assert.equal(waSetEvent({ date: EVENT_DAY, start: "20:00", recruitFrom: "2026-10-09" }).code, "wrong_mode");
  waSetMode("event");
  const bad = (p: any, code: string) => assert.equal(waSetEvent(p).code, code, JSON.stringify(p));
  bad({ date: "2026-10-07", start: "20:00", recruitFrom: "2026-10-07" }, "bad_date");
  bad({ date: "нет", start: "20:00", recruitFrom: "2026-10-09" }, "bad_date");
  bad({ date: "2027-03-01", start: "20:00", recruitFrom: "2027-02-27" }, "bad_date");
  bad({ date: EVENT_DAY, start: "09:00", recruitFrom: "2026-10-09" }, "bad_start");
  bad({ date: EVENT_DAY, start: "двадцать", recruitFrom: "2026-10-09" }, "bad_start");
  bad({ date: EVENT_DAY, start: "20:00", recruitFrom: "2026-10-13" }, "bad_recruit");
  bad({ date: EVENT_DAY, start: "20:00", recruitFrom: "2026-09-01" }, "bad_recruit");
  bad({ date: EVENT_DAY, start: "20:00" }, "bad_recruit");
  const ok = waSetEvent({ date: EVENT_DAY, start: "20:00", recruitFrom: "2026-10-09" });
  assert.equal(ok.ok, true);
  assert.match(ok.message, /Сообщество создам 09\.10 в 10:00/);
  assert.deepEqual(_waRt()!.state.event, { date: EVENT_DAY, start: "20:00", recruitFrom: "2026-10-09", savedAt: clock.t });
  // набор уже идёт: создам в ближайшие 30 секунд
  const now = waSetEvent({ date: EVENT_DAY, start: "20:00", recruitFrom: "2026-10-08" });
  assert.match(now.message, /Набор уже идёт/);
});

test("живой эфир: создание само в день начала набора, ссылка весь период, прогрев только в день эфира, после 00:00 режим завершён", async () => {
  const w = bootEvent();
  assert.equal(w.rt().state.daily.enabled, false);
  // до начала набора ничего не создаётся, а ближайшее сообщение серии видно за несколько дней, считается днями
  at(8, 20, 0, 0);
  assert.equal((await waTick()).created, 0);
  assert.deepEqual([(waPanel(clock.t) as any).nextMessage.id, (waPanel(clock.t) as any).nextMessage.dayLabel, (waPanel(clock.t) as any).nextMessage.inText], ["morning", "12.10", "через 3 дн. 15 ч"]);
  at(9, 9, 59, 50);
  assert.equal((await waTick()).created, 0);
  assert.equal(waGroupLink(clock.t, false), null, "ссылка пока постоянная");
  // в день начала набора в 10:00 создаётся одно сообщество эфира
  at(9, 10, 0, 0);
  evo.calls = [];
  assert.equal((await waTick()).created, 1);
  const t = eventTarget(w);
  assert.equal(t.id, "2026-10-12#1");
  assert.equal(t.source, "event");
  assert.equal(t.name, "Вайб-продакшен · эфир 12.10");
  assert.equal(t.start, undefined, "старт 20:00 это время серии, отдельно не хранится");
  assert.equal(w.state().event.communityId, t.id);
  assert.deepEqual(evo.seq().filter((x) => x.includes("community/create") || x.includes("message")), ["POST /community/create", "POST /message/sendText"]);
  assert.match(evo.of("/message/sendText")[0].body.text, /Эфир 12 октября в 20:00 по Алматы/, "приветствие с датой эфира");
  // повторные тики второго сообщества не создают
  at(9, 10, 5, 0);
  assert.equal((await waTick()).created, 0);
  assert.equal(evo.of("/community/create").length, 1);
  // весь период набора ссылка ведёт в сообщество эфира, в том числе после 20:40 накануне и в сам день эфира
  for (const [d, h, mi] of [[9, 10, 6], [10, 12, 0], [10, 20, 45], [11, 20, 40], [11, 23, 59], [12, 8, 0], [12, 20, 30], [12, 23, 59]] as number[][]) {
    assert.equal(waGroupLink(alm(2026, 10, d, h, mi), false), t.link, `ссылка ${d}.10 ${h}:${mi}`);
  }
  assert.equal(waGroupLink(alm(2026, 10, 13, 0, 0), false), null, "после 00:00 дня после эфира ссылка постоянная");
  // прогрев только в день эфира: ни 10-го, ни 11-го ничего из серии не уходит
  for (const [d, h, mi] of [[10, 11, 30], [10, 20, 0], [11, 11, 30], [11, 12, 30]] as number[][]) {
    evo.calls = [];
    at(d, h, mi, 5);
    assert.equal((await waTick()).sent, 0, `${d}.10 ${h}:${mi}: серия не идёт`);
    assert.equal(evo.of("/message/").length, 0);
  }
  // день эфира: 11:30 картинка и опрос
  at(12, 11, 30, 5);
  assert.equal((await waTick()).sent, 1);
  assert.equal(evo.of("/message/sendMedia").pop()!.body.number, t.sendJid);
  assert.equal(evo.of("/message/sendPoll").length, 1);
  // офферы серии действуют после эфира до 00:00
  at(12, 20, 15, 5);
  await waTick(); // ссылки и тренинг уходят в своё время, оффер 21:18 следом, а не в одной пачке
  at(12, 20, 58, 5);
  await waTick();
  at(12, 21, 20, 5);
  evo.calls = [];
  await waTick();
  assert.equal(evo.of("/message/sendMedia")[0].body.caption, undefined, "оффер длиннее лимита подписи: картинка без подписи");
  assert.match(evo.of("/message/sendText")[0].body.text, /Цена для участников эфира: курс Vibe Production/);
  at(12, 23, 30, 5);
  await waTick();
  assert.match(evo.of("/message/sendMedia").pop()!.body.caption, /Через 30 минут цена/);
  // 00:00: режим завершён, возвращаемся на ежедневный с выключенным созданием, прогрев больше не идёт
  evo.calls = [];
  at(13, 0, 0, 5);
  await waTick();
  assert.equal(evo.of("/message/").length, 0);
  assert.deepEqual([w.state().mode, w.state().daily.enabled, w.state().event.done], ["daily", false, true]);
  assert.ok(w.journal().some((r) => r.ev === "event_done" && r.date === EVENT_DAY));
  assert.equal(waGroupLink(clock.t, false), null);
  assert.equal(waPanel(clock.t).mode, "daily");
  assert.equal((waPanel(clock.t) as any).event.status, "done");
  // а при новом входе в живой эфир форма пустая
  waSetMode("event");
  assert.equal(w.state().event.date, "");
  assert.equal(w.state().event.done, undefined);
});

test("живой эфир: «Создать сейчас» создаёт один раз, повтор ничего не создаёт, защита номера (пауза, лимит, подключение) действует", async () => {
  const w = bootEvent({ recruitFrom: "2026-10-11" });
  at(8, 12, 0, 0);
  evo.calls = [];
  const a = await waEventCreateNow();
  assert.equal(a.ok, true, a.message);
  assert.equal(a.code, "created");
  const t = eventTarget(w);
  assert.equal(t.source, "event");
  assert.match(a.message, new RegExp(t.link.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.equal(evo.of("/community/create").length, 1);
  assert.deepEqual(evo.seq(), [
    "GET /instance/connectionState", "GET /instance/fetchInstances", "POST /community/create",
    "GET /group/findGroupInfos", "POST /community/memberAddMode",
    "GET /community/inviteCode", "POST /group/updateGroupPicture", "POST /message/sendText",
  ]);
  for (const ms of sleeps) assert.ok(ms >= 2000 && ms <= 4000, `пауза шага ${ms}`);
  // сразу же ссылка на сайте ведёт в него, хотя день начала набора ещё не наступил
  assert.equal(waGroupLink(clock.t, false), t.link);
  // повтор: сообщества не плодим
  evo.calls = [];
  const b = await waEventCreateNow();
  assert.equal(b.code, "exists");
  assert.equal(evo.of("/community/create").length, 0);
  assert.equal(w.state().targets.length, 1);
  // созданное окно закрывает правку дат
  assert.equal(waSetEvent({ date: "2026-10-13", start: "20:00", recruitFrom: "2026-10-11" }).code, "locked");
  // сброс: сообщество остаётся, ссылка постоянная, новый эфир задаётся заново
  assert.equal(waEventReset().ok, true);
  assert.equal(w.state().targets.length, 1);
  assert.equal(waGroupLink(clock.t, false), null);
  assert.equal(waSetEvent({ date: "2026-10-14", start: "20:00", recruitFrom: "2026-10-13" }).ok, true);

  // защита номера: пауза, нет подключения, лимит 3 в сутки, чужой режим
  waPause();
  const paused = await waEventCreateNow();
  assert.deepEqual([paused.ok, paused.code], [false, "paused"]);
  waResume();
  evo.state = "close";
  evo.calls = [];
  const down = await waEventCreateNow();
  assert.deepEqual([down.ok, down.code], [false, "no_connection"]);
  assert.equal(evo.of("/community/create").length, 0);
  evo.state = "open";
  w.rt().state.creations = [clock.t - 1000, clock.t - 2000, clock.t - 3000];
  assert.equal((await waEventCreateNow()).code, "cap");
  w.rt().state.creations = [];
  waSetMode("daily");
  assert.equal((await waEventCreateNow()).code, "wrong_mode");
});

test("живой эфир: старт не в 20:00 сдвигает серию до оффера и подменяет часы в текстах, дожим остаётся на месте", async () => {
  const w = bootEvent({ start: "19:00" });
  const r = w.rt();
  const rawMsgs = Object.fromEntries(r.cfg.messages.map((m) => [m.id, m]));
  const planOf = (id: string) => hhm(_internals.planOf(r, { day: EVENT_DAY, start: "19:00" }, rawMsgs[id]));
  const hhm = (ms: number) => new Date(ms + 5 * 3600_000).toISOString().slice(11, 16);
  assert.equal(planOf("morning"), "10:30");
  assert.equal(planOf("live-now"), "19:00");
  assert.equal(planOf("t-minus-10"), "18:50");
  assert.equal(planOf("offer"), "20:18");
  assert.equal(planOf("push"), "22:30", "дожим привязан к 23:59, а не к старту");
  assert.equal(planOf("last-call"), "23:30");
  const txt = _internals.retime(r, "19:00", rawMsgs["morning"].text);
  assert.match(txt, /Сегодня в 19:00 по Алматы .17:00 по Москве. покажу, как ИИ монтирует мои рилсы/);
  assert.match(txt, /Бесплатный эфир «Вайб-продакшен»[.]/); // время теперь только в первой строке (подставлено 19:00 и 17:00 по Москве)
  assert.equal(txt.includes("20:00"), false);
  assert.equal(_internals.retime(r, "20:00", rawMsgs["morning"].text), rawMsgs["morning"].text, "обычный старт ничего не меняет");
  assert.equal(_internals.retime(r, "19:00", rawMsgs["offer"].text).includes("До 23:59 по Алматы (21:59 по Москве)"), true, "дедлайн оффера не трогаем");

  // создание, описание и приветствие с нужным стартом
  at(12, 9, 0, 0);
  evo.calls = [];
  assert.equal((await waEventCreateNow()).ok, true);
  const t = eventTarget(w);
  assert.equal(t.start, "19:00");
  assert.match(evo.of("/community/create")[0].body.description, /Эфир в 19:00 по Алматы/);
  assert.match(evo.of("/message/sendText")[0].body.text, /в 19:00 по Алматы \(17:00 по Москве\)/);
  // в день эфира утреннее уходит в 10:30 с исправленным временем, а не в 11:30
  evo.calls = [];
  at(12, 10, 30, 5);
  assert.equal((await waTick()).sent, 1);
  assert.match(evo.of("/message/sendMedia")[0].body.caption, /Сегодня в 19:00 по Алматы .17:00 по Москве. покажу, как ИИ монтирует мои рилсы/);
  assert.match(evo.of("/message/sendMedia")[0].body.caption, /17:00 по Москве/);
  assert.equal(evo.of("/message/sendPoll").length, 1);
  // панель показывает серию такой, какой она уйдёт
  const p = waPanel(clock.t) as any;
  assert.equal(p.series.find((s: any) => s.id === "morning").at, "10:30");
  assert.match(p.series.find((s: any) => s.id === "morning").text, /19:00 по Алматы/);
  assert.equal(p.event.start, "19:00");
});

test("пульт: QR-поток create → connect → open, кеш QR 10 секунд, номер и имя профиля, ключи в ответ не попадают", async () => {
  boot();
  evo.state = "absent";
  at(9, 10, 0, 0);
  evo.calls = [];
  const q1: any = await waQr();
  assert.equal(q1.ok, true);
  assert.equal(q1.state, "connecting");
  assert.equal(q1.qr, `data:image/png;base64,${PNG_B64}`);
  assert.equal(evo.of("/instance/create").length, 1, "инстанса нет: создаётся");
  assert.equal(evo.of("/instance/create")[0].body.integration, "WHATSAPP-BAILEYS");
  // через 5 секунд тот же QR из кеша, Evolution спрашиваем только про состояние
  clock.t += 5000;
  evo.calls = [];
  const q2: any = await waQr();
  assert.equal(q2.qr, q1.qr);
  assert.deepEqual(evo.seq(), ["GET /instance/connectionState"]);
  // через 16 секунд (обновление в пульте) QR запрашивается у существующего инстанса
  clock.t += 11_000;
  evo.calls = [];
  const q3: any = await waQr();
  assert.equal(q3.state, "connecting");
  assert.equal(q3.qr, `data:image/png;base64,${PNG_B64}`);
  assert.deepEqual(evo.seq(), ["GET /instance/connectionState", "GET /instance/connect"]);
  assert.equal(evo.of("/instance/create").length, 0, "второй раз инстанс не создаём");
  // до сканирования подключение не open
  clock.t += 5000;
  const c1: any = await waConnection();
  assert.equal(c1.ok, true);
  assert.equal(c1.state, "connecting");
  assert.equal(c1.number, "");
  // человек отсканировал QR
  evo.scan();
  clock.t += 5000;
  const c2: any = await waConnection();
  assert.deepEqual([c2.state, c2.number, c2.profile], ["open", "+77001112233", "Тест"]);
  const q4: any = await waQr();
  assert.deepEqual([q4.state, q4.qr, q4.number, q4.profile], ["open", null, "+77001112233", "Тест"]);
  const p = waPanel(clock.t) as any;
  assert.deepEqual([p.conn.state, p.conn.number, p.conn.profile], ["open", "+77001112233", "Тест"]);
  // в журнале запрос QR отмечен один раз, сам QR, ключ и токен нигде не лежат
  const w = _waRt()!;
  assert.equal(readJsonl(join(w.dir, "wa-journal.jsonl")).filter((r) => r.ev === "qr").length, 1);
  const all = JSON.stringify([q1, q3, c2, q4, p]) + readdirSync(w.dir).map((f) => readFileSync(join(w.dir, f), "utf8")).join("\n");
  assert.equal(all.includes(EVO_KEY) || all.includes(INSTANCE_TOKEN), false);
  assert.equal(readdirSync(w.dir).map((f) => readFileSync(join(w.dir, f), "utf8")).join("").includes(PNG_B64), false, "QR на диск не пишем");
  // Evolution не отвечает: понятная ошибка, а не исключение
  const saved = process.env.EVOLUTION_URL;
  process.env.EVOLUTION_URL = "http://127.0.0.1:1";
  clock.t += 20_000;
  const bad: any = await waQr();
  assert.deepEqual([bad.ok, bad.code], [false, "evolution"]);
  process.env.EVOLUTION_URL = saved;
});

test("пульт: отключение номера (logout): запрос к Evolution, состояние close, рассылка встаёт, тревога о потере не сыплется сразу", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  at(9, 10, 0, 0);
  await waTick();
  assert.equal((waPanel(clock.t) as any).conn.state, "open");
  evo.calls = [];
  const out = await waLogout();
  assert.equal(out.ok, true, out.message);
  assert.equal(evo.logouts, 1);
  assert.deepEqual(evo.seq(), ["DELETE /instance/logout"]);
  assert.equal(evo.state, "close");
  const p = waPanel(clock.t) as any;
  assert.deepEqual([p.conn.state, p.conn.number], ["close", ""]);
  assert.equal(w.state().ownerJid, "");
  // дальше без подключения ничего не уходит
  alarms.length = 0;
  at(9, 10, 30, 0);
  evo.calls = [];
  assert.equal((await waTick()).skipped, "no_connection");
  assert.equal(alarms.length, 0, "отключили сами: тревога не сразу");
  at(9, 11, 30, 5);
  evo.calls = [];
  assert.equal((await waTick()).skipped, "no_connection");
  assert.equal(evo.of("/message/").length, 0, "утреннее сообщение без подключения не ушло");
  assert.equal(alarms.length, 1, "через час напоминание");
  assert.ok(w.journal().some((r) => r.ev === "logout"));
  // Evolution отказал: состояние не меняем
  evo.state = "open";
  at(9, 13, 0, 0);
  await waTick();
  evo.fail = (c) => (c.path.startsWith("/instance/logout") ? { status: 500 } : null);
  const no = await waLogout();
  assert.deepEqual([no.ok, no.code], [false, "evolution"]);
  assert.equal(w.rt().conn.state, "open");
  void t;
});

test("пульт: группы и сообщества номера, роль номера, размер, наши, кеш и ограничение частоты; без списка участников роль неясна", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  evo.allGroups.push(
    { id: t.jid, subject: t.name, size: 3, owner: OWNER_JID, isCommunity: true, announce: true, participants: [{ id: OWNER_JID, admin: "superadmin" }] },
    { id: t.sendJid, subject: "Вкладка объявлений", size: 3, isCommunityAnnounce: true, linkedParent: t.jid, announce: true, participants: [{ id: "1234@lid", admin: "admin" }] },
  );
  at(9, 10, 0, 0);
  await waTick();
  evo.calls = [];
  const g = await waGroups();
  assert.equal(g.ok, true);
  assert.deepEqual(evo.seq(), ["GET /instance/connectionState", "GET /group/fetchAllGroups"]);
  assert.equal(evo.of("/group/fetchAllGroups")[0].query.get("getParticipants"), "true");
  assert.equal(JSON.stringify(g).includes("77015556677"), false, "участников наружу не отдаём");
  const by = Object.fromEntries(g.items.map((x) => [x.name, x]));
  assert.deepEqual(g.items.map((x) => x.type), ["community", "announce", "group", "group"], "сначала сообщества, потом группы по размеру");
  assert.deepEqual([by[t.name].typeLabel, by[t.name].role, by[t.name].roleLabel, by[t.name].ours, by[t.name].size], ["сообщество", "owner", "создатель", true, 3]);
  assert.deepEqual([by["Воркшоп Вайб-продакшен (общий чат)"].role, by["Воркшоп Вайб-продакшен (общий чат)"].roleLabel, by["Воркшоп Вайб-продакшен (общий чат)"].size, by["Воркшоп Вайб-продакшен (общий чат)"].ours], ["admin", "админ", 487, false]);
  assert.equal(by["Архив эфиров"].role, "owner");
  assert.equal(by["Вкладка объявлений"].role, "unknown", "себя в списке участников нет");
  assert.equal(by["Вкладка объявлений"].typeLabel, "вкладка объявлений");
  assert.equal(by["Воркшоп Вайб-продакшен (общий чат)"].announceOnly, false);
  assert.equal(by["Архив эфиров"].announceOnly, true);
  // кеш на минуту и ограничение ручного обновления раз в 20 секунд
  evo.calls = [];
  clock.t += 10_000;
  const c = await waGroups();
  assert.equal(c.cached, true);
  assert.equal(evo.calls.length, 0);
  const f1 = await waGroups(true);
  assert.equal(f1.cached, true, "обновление раньше чем через 20 секунд не идёт к WhatsApp");
  clock.t += 25_000;
  const f2 = await waGroups(true);
  assert.equal(f2.cached, false);
  assert.equal(evo.of("/group/fetchAllGroups").length, 1);
  // тяжёлый запрос не прошёл: список без участников, роль определяется только по создателю
  evo.fail = (x) => (x.path.startsWith("/group/fetchAllGroups") && x.query.get("getParticipants") === "true" ? { status: 500 } : null);
  clock.t += 25_000;
  evo.calls = [];
  const f3 = await waGroups(true);
  assert.equal(f3.ok, true);
  assert.deepEqual(evo.of("/group/fetchAllGroups").map((x) => x.query.get("getParticipants")), ["true", "false"]);
  const by3 = Object.fromEntries(f3.items.map((x) => [x.name, x]));
  assert.deepEqual([by3["Воркшоп Вайб-продакшен (общий чат)"].role, by3["Архив эфиров"].role], ["unknown", "owner"]);
  // нет подключения: честный отказ
  evo.fail = null;
  evo.state = "close";
  clock.t += 25_000;
  const no = await waGroups(true);
  assert.deepEqual([no.ok, no.code], [false, "no_connection"]);
  assert.ok(no.items.length > 0, "прежний список остаётся на экране");
});

test("пульт: отправка сообщения серии вручную в текущее сообщество, повтор не дублирует, плановая отправка потом тоже", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  at(9, 9, 0, 0);
  assert.equal((await waSendSeries("")).ok, false);
  assert.equal((await waSendSeries("nope")).code, "bad_id");
  evo.calls = [];
  const a = await waSendSeries("offer");
  assert.deepEqual([a.ok, a.sent, a.skipped, a.failed, a.targets], [true, 1, 0, 0, 1]);
  assert.equal(evo.of("/message/sendMedia")[0].body.number, t.sendJid);
  assert.ok(w.journal().find((r) => r.msg === "offer" && r.manual === true));
  const b = await waSendSeries("offer");
  assert.deepEqual([b.sent, b.skipped], [0, 1]);
  at(9, 21, 20, 5);
  evo.calls = [];
  await waTick();
  assert.equal(evo.of("/message/sendMedia").length, 0, "плановая отправка уже отправленного не повторяется");
  // на паузе, без подключения: не шлём
  waPause();
  assert.equal((await waSendSeries("morning")).code, "paused");
  waResume();
  evo.state = "close";
  evo.calls = [];
  assert.equal((await waSendSeries("morning")).code, "no_connection");
  assert.equal(evo.of("/message/").length, 0);
  evo.state = "open";
  // в панели видно, куда уйдёт «отправить сейчас»
  assert.deepEqual((waPanel(clock.t) as any).sendTo, [t.name]);

  // живой эфир: в текущее сообщество эфира, даже в период набора за дни до эфира
  const w2 = bootEvent({ recruitFrom: "2026-10-08" });
  at(9, 12, 0, 0);
  await waEventCreateNow();
  const ev = eventTarget(w2);
  evo.calls = [];
  const c = await waSendSeries("reg-bonus");
  assert.deepEqual([c.ok, c.sent], [true, 1]);
  assert.equal(evo.of("/message/sendMedia")[0].body.number, ev.sendJid);
  assert.deepEqual((waPanel(clock.t) as any).sendTo, [ev.name]);
  // ежедневному «сегодня» чужое живое сообщество не достаётся
  waSetMode("daily");
  assert.equal((await waSendSeries("morning")).code, "no_target");
});

test("пульт: экран собирается из состояния: сообщества, участники, вступившие за сегодня, ближайшее сообщение, серия, журнал", async () => {
  resetWaGroups();
  assert.deepEqual(waPanel(), { ok: true, enabled: false }, "без WA_GROUPS=on экран пустой");
  process.env.WA_GROUPS = "on";
  assert.equal((waPanel() as any).running, false);
  delete process.env.WA_GROUPS;
  const w = boot();
  const t = await createFor(w, 9);
  evo.members.set(t.jid, 321);
  at(9, 10, 0, 0);
  await waTick(); // участники 321
  evo.requests.set(t.jid, [{ jid: "5@lid" }, { jid: "6@lid" }]);
  await joinsTick();
  const p = waPanel(clock.t) as any;
  assert.deepEqual([p.enabled, p.running, p.mode, p.daily.enabled, p.module.paused, p.module.creationsToday, p.module.creationsMax, p.module.failMax], [true, true, "daily", true, false, 1, 3, 3]);
  const card = p.current.cards[0];
  assert.deepEqual([card.name, card.members, card.joinedToday, card.joinedTotal, card.ready, card.onSite, card.link], [t.name, 321, 2, 2, true, true, t.link]);
  assert.equal(p.current.title, "Эфир");
  assert.equal(p.current.dayLabel, "09.10");
  assert.match(p.next.pending, /Будет создано 09\.10 в 20:00/);
  assert.deepEqual([p.link.kind, p.link.url], ["daily", t.link]);
  assert.deepEqual([p.nextMessage.id, p.nextMessage.at, p.nextMessage.dayLabel, p.nextMessage.inText], ["morning", "11:30", "09.10", "через 1 ч 30 мин"]);
  assert.equal(p.series.length, 22);
  assert.deepEqual([p.series[0].id, p.series[0].at, p.series[0].media, p.series[0].poll], ["morning", "11:30", "image", "Придёшь сегодня на эфир?"]);
  // сообщения следующего дня в списке с пометкой «+1»
  assert.deepEqual(p.series.slice(-4).map((x: any) => [x.id, x.at, x.dayOffset]), [["next-1030", "+1 10:30", 1], ["next-1500", "+1 15:00", 1], ["replay-link", "+1 19:50", 1], ["next-2145", "+1 21:45", 1]]);
  assert.notEqual(p.series.find((x: any) => x.id === "personal").enabled, false, "личное видео 15:00 включено");
  // вступившие «сегодня» считаются по дню Алматы, а не за всё время
  assert.deepEqual([...w.rt().joinedByDay.get(t.id)!], [["2026-10-09", 2]]);
  // после перезапуска счётчик восстанавливается из журнала заявок
  const dir = w.dir;
  at(9, 10, 5, 0);
  resetWaGroups();
  initWaGroups({ dir, seriesFile: join(dir, "wa-series.json"), deps: deps() });
  assert.equal(((waPanel(clock.t) as any).current.cards[0]).joinedToday, 2);
  // журнал: не больше 20, свежие сверху, простыми словами, без ключей
  const j = (waPanel(clock.t) as any).journal as any[];
  assert.ok(j.length >= 1 && j.length <= 20);
  assert.ok(j.some((x) => x.kind === "ok" && /^Создано «Вайб-продакшен · эфир 09\.10»$/.test(x.text)));
  assert.deepEqual(j.map((x) => x.ts), [...j.map((x) => x.ts)].sort((a, b) => b - a));
  assert.equal(JSON.stringify(j).includes(EVO_KEY), false);
});

test("пульт: журнал показывает отправки, ошибки и паузы по-русски, берёт последние 20, пауза и снятие паузы из пульта", async () => {
  const w = boot();
  await createFor(w, 9);
  for (let i = 0; i < 12; i++) {
    at(9, 11 + (i % 2), 30, 5);
    await waTick();
  }
  evo.fail = (c) => (c.path.startsWith("/message/") ? { status: 500 } : null);
  at(9, 14, 0, 5);
  await waTick();
  const pz = waPause(clock.t);
  assert.equal(pz.ok, true);
  assert.equal(w.state().pausedReason, "вручную, из пульта");
  assert.equal(waPause(clock.t).code, "same");
  const p = waPanel(clock.t) as any;
  assert.equal(p.module.paused, true);
  assert.equal(p.module.pausedReason, "вручную, из пульта");
  assert.ok(p.journal.length <= 20);
  assert.ok(p.journal.some((x: any) => x.kind === "error" && /^Пауза: вручную, из пульта$/.test(x.text)));
  assert.ok(p.journal.some((x: any) => x.kind === "error" && /^Ошибка 1 подряд/.test(x.text)));
  assert.ok(p.journal.some((x: any) => x.kind === "error" && /^Неясно, ушло ли «Правки монтажа словами»/.test(x.text)), "5xx: исход неясен, так и написано");
  assert.equal(p.journal[0].text, "Пауза: вручную, из пульта", "самое свежее сверху");
  evo.fail = null;
  assert.equal(waResume().ok, true);
  const p2 = waPanel(clock.t) as any;
  assert.deepEqual([p2.module.paused, p2.module.failStreak], [false, 0]);
  assert.equal(p2.journal[0].text, "Пауза снята");
  // отправки в журнале называются темой сообщения
  at(9, 16, 0, 5);
  await waTick();
  const topic = JSON.parse(readFileSync(WA_SERIES, "utf8")).messages.find((m: any) => m.id === "noface").topic;
  const j3 = (waPanel(clock.t) as any).journal as any[];
  assert.ok(j3.some((x) => x.kind === "ok" && x.text.startsWith(`Отправлено «${topic}»`)), j3.map((x) => x.text).join(" | "));
});

test("пульт: команды бота в прямом эфире: /wa показывает режим и сообщество эфира, /wa_new создаёт сообщество эфира", async () => {
  const w = bootEvent({ recruitFrom: "2026-10-11" });
  at(8, 12, 0, 0);
  const [s1] = await ownerSay("/wa");
  assert.match(s1, /Режим: прямой эфир 12\.10 в 20:00, набор с 11\.10/);
  assert.match(s1, /Сообщество эфира 12\.10: пока нет, создам 11\.10 в 10:00/);
  const [n] = await ownerSay("/wa_new");
  assert.match(n, /Создано: «Вайб-продакшен · эфир 12\.10»/);
  assert.equal(eventTarget(w).source, "event");
  const [s2] = await ownerSay("/wa");
  assert.match(s2, /Сообщество эфира 12\.10: «Вайб-продакшен · эфир 12\.10», готово/);
  assert.match(s2, /Ближайшее сообщение: 11:30 morning \(эфир 12\.10\)/);
  waSetMode("daily");
  assert.match((await ownerSay("/wa"))[0], /Режим: ежедневный, создание выключено/);
});

// ───────────────────────── постоянная ссылка для шаблона WABA ─────────────────────────

const WA_PAGE = join(REPO, "workshop-montazh", "wa.html");
const WA_FALLBACK = "https://chat.whatsapp.com/IfLyJvWLo7HDq5yleoKCzz";

test("workshop-montazh/wa.html: лёгкая страница без счётчиков, запасная ссылка зашита, noscript ведёт на неё же", () => {
  const html = readFileSync(WA_PAGE, "utf8");
  assert.ok(Buffer.byteLength(html) < 2500, "страница быстрая: меньше 2,5 КБ");
  assert.ok(html.includes("/workshop/api/whatsapp-link"), "спрашивает текущую ссылку у form-api");
  assert.ok(html.includes("location.replace"));
  assert.ok(html.includes(`content="0;url=${WA_FALLBACK}"`), "без скриптов сразу на запасную ссылку");
  assert.equal(html.split(WA_FALLBACK).length - 1 >= 3, true, "запасная ссылка в noscript, в тексте и в скрипте");
  assert.equal(/gtag|fbq|ym\(|metrika|analytics|googletagmanager|pixel/i.test(html), false, "без счётчиков");
  assert.equal(/<link |<img |src=/i.test(html), false, "никаких внешних файлов");
  assert.equal(html.includes(String.fromCharCode(0x2014)), false, "без длинного тире");
  assert.match(html, /name="robots" content="noindex"/);
  // та же запасная ссылка, что на странице «Спасибо» и в lib/whatsapp-link
  assert.ok(readFileSync(join(REPO, "app", "thank-you", "page.tsx"), "utf8").includes(WA_FALLBACK));
});

test("wa.html в песочнице: переходит туда, что отдал /api/whatsapp-link; при сбое, чужой ссылке, таймауте и пустом ответе на запасную", async () => {
  const html = readFileSync(WA_PAGE, "utf8");
  const NEW = "https://chat.whatsapp.com/NEWCOMMUNITY0000000001";
  const answer = (body: unknown) => async (u: string) => {
    assert.equal(u, "/workshop/api/whatsapp-link");
    return { json: async () => body };
  };
  const ok = await runWaPage(html, answer({ link: NEW }));
  assert.deepEqual([ok.url, ok.href, ok.replaces], [NEW, NEW, 1]);
  assert.deepEqual(ok.beacons, [["/workshop/api/ty-click", "ch=wa-template"]], "переход попадает в журнал переходов");
  assert.equal((await runWaPage(html, answer({ link: "https://wa.me/77085834575" }))).url, "https://wa.me/77085834575");
  // всё, что не ссылка WhatsApp, и любой сбой: запасная постоянная
  assert.equal((await runWaPage(html, answer({ link: "https://evil.example/x" }))).url, WA_FALLBACK, "чужой адрес не принимаем");
  assert.equal((await runWaPage(html, answer({ link: "http://chat.whatsapp.com/ABC" }))).url, WA_FALLBACK, "только https");
  assert.equal((await runWaPage(html, answer({}))).url, WA_FALLBACK);
  assert.equal((await runWaPage(html, answer(null))).url, WA_FALLBACK);
  assert.equal((await runWaPage(html, async () => { throw new Error("сеть"); })).url, WA_FALLBACK);
  assert.equal((await runWaPage(html, () => { throw new Error("fetch упал сразу"); })).url, WA_FALLBACK);
  assert.equal((await runWaPage(html, async () => ({ json: async () => { throw new Error("не json"); } }))).url, WA_FALLBACK);
  const slow = await runWaPage(html, () => new Promise(() => {}), { timeoutMs: 40 });
  assert.deepEqual([slow.url, slow.replaces], [WA_FALLBACK, 1], "сервис молчит: через 3,5 секунды запасная, ровно один переход");
});

test("журнал переходов: канал wa-template принимается и записывается отдельно, в отчёты о «Спасибо» не попадает", () => {
  assert.deepEqual(parseTyBody("ch=wa-template"), { ch: "wa-template", eid: "" });
  assert.deepEqual(parseTyBody(JSON.stringify({ ch: "wa-template", eid: "abc-1" })), { ch: "wa-template", eid: "abc-1" });
  assert.equal(parseTyBody("ch=wa-templat"), null);
  const w = boot();
  const st = getStore();
  const d = dayKeyOf(clock.t);
  st.recordTyClick("wa-template", "", d, new Date(clock.t).toISOString());
  st.recordTyClick("wa-template", "", d, new Date(clock.t).toISOString());
  st.recordTyClick("wa", "", d, new Date(clock.t).toISOString());
  assert.deepEqual([st.tyCount(d, "wa-template"), st.tyCount(d, "wa")], [2, 1]);
  assert.equal((waPanel(clock.t) as any).link.templateClicksToday, 2, "в пульте видно число переходов за сегодня");
  assert.equal((waPanel(clock.t) as any).link.templateUrl, "https://onai.academy/workshop-montazh/wa");
  void w;
});

// ───────────────────────── сервер целиком ─────────────────────────

function buildBundle(entry: string, outfile: string) {
  const esbuildBin = join(REPO, "node_modules", "esbuild", "bin", "esbuild");
  execFileSync(process.execPath, [esbuildBin, entry, "--bundle", "--platform=node", "--target=node20", "--format=cjs", `--outfile=${outfile}`, "--log-level=error"], { cwd: REPO, stdio: "pipe" });
}

function childEnv(over: Record<string, string | undefined>): NodeJS.ProcessEnv {
  const e: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...process.env, ...over })) if (v !== undefined) e[k] = v;
  return e;
}

const waitFor = async (cond: () => boolean, ms = 8000) => {
  const t0 = Date.now();
  while (!cond() && Date.now() - t0 < ms) await new Promise((r) => setTimeout(r, 25));
  assert.ok(cond(), "дождались условия");
};

test("server.ts: без WA_GROUPS /api/whatsapp-link отдаёт старую ссылку, с WA_GROUPS=on ссылку готового сообщества; health без секретов", async () => {
  const OLD = "https://chat.whatsapp.com/OLDLINK00000000000001A";
  const NEW = "https://chat.whatsapp.com/SERVERTEST0000000002B";
  const dir = tmp();
  const bundle = join(dir, "server.js");
  buildBundle("form-api/server.ts", bundle);
  writeFileSync(join(dir, "tg-series.json"), readFileSync(TG_SERIES));
  writeFileSync(join(dir, "wa-series.json"), readFileSync(WA_SERIES));
  // готовое сообщество на тот день, на который бот записывает прямо сейчас
  const tgs = JSON.parse(readFileSync(TG_SERIES, "utf8"));
  const day = assignStreamDay(Date.now(), { streamStart: tgs.streamStart, streamMinutes: tgs.streamMinutes, joinLiveMinutes: tgs.joinLiveMinutes, firstDay: tgs.firstDay, skipDays: tgs.skipDays });
  const seeded = (dataDir: string) => {
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(join(dataDir, "wa-state.json"), JSON.stringify({
      v: 1, paused: false, failStreak: 0, retryAt: 0, creations: [], pendingCreate: null,
      targets: [{ id: `${day}#1`, day, seq: 1, kind: "community", jid: "1203639999999999@g.us", sendJid: "1203638888888888@g.us", name: "тест", createdAt: Date.now() - 1000, link: NEW, done: { announce: true, addMode: true, approval: true, link: true, avatar: true, welcome: true }, tries: {}, avatarAt: 0 }],
    }));
  };
  const common = {
    FORM_API_ENV: join(dir, "нет.env"), TG_SERIES_FILE: undefined, ADMIN_APP_HTML: undefined, WA_SERIES_FILE: undefined, TG_BOT: undefined,
    WHATSAPP_LINK_PATH: join(dir, "нет-ссылки.json"), WHATSAPP_COMMUNITY_FALLBACK: OLD,
    TG_WORKSHOP_BOT_TOKEN: process.env.TG_WORKSHOP_BOT_TOKEN, TG_WORKSHOP_WEBHOOK_SECRET: "srv-hook-secret-123456", TG_GO_SECRET: "srv-go-secret-1234567", TG_LINK_OWNER_IDS: "900",
  };
  const run = async (port: number, dataDir: string, extra: Record<string, string | undefined>) => {
    const child = spawn(process.execPath, [bundle], { env: childEnv({ ...common, PORT: String(port), DATA_DIR: dataDir, ...extra }), stdio: ["ignore", "pipe", "pipe"] });
    let log = "";
    child.stdout.on("data", (d) => (log += d));
    child.stderr.on("data", (d) => (log += d));
    await waitFor(() => /listening on/.test(log), 20_000); // под нагрузкой (рендеры на этой машине) старт бывает дольше 8 секунд
    const get = async (p: string) => (await fetch(`http://127.0.0.1:${port}${p}`)).json() as Promise<any>;
    return { child, get, log: () => log };
  };

  // 1) без флага, даже при наличии файла состояния: ссылка прежняя, модуль молчит
  const d1 = join(dir, "data1");
  seeded(d1);
  const s1 = await run(4114, d1, { WA_GROUPS: undefined, EVOLUTION_API_KEY: EVO_KEY, EVOLUTION_URL: process.env.EVOLUTION_URL });
  try {
    assert.equal((await s1.get("/api/whatsapp-link")).link, OLD);
    assert.deepEqual((await s1.get("/api/health")).waGroups, { enabled: false });
    await new Promise((r) => setTimeout(r, 6500)); // дольше первого тика (5 секунд)
    assert.equal(evo.calls.length, 0, "без флага к Evolution не ходим");
    assert.equal(s1.log().includes("[wa]"), false);
    assert.equal(existsSync(join(d1, "wa.lock")), false);
    assert.equal(existsSync(join(d1, "wa-journal.jsonl")), false);
  } finally {
    s1.child.kill();
    await new Promise((r) => s1.child.on("close", r));
  }

  // 2) с флагом: ссылка готового сообщества, первый тик сходил за состоянием подключения
  const d2 = join(dir, "data2");
  seeded(d2);
  const s2 = await run(4115, d2, { WA_GROUPS: "on", EVOLUTION_API_KEY: EVO_KEY, EVOLUTION_URL: process.env.EVOLUTION_URL });
  try {
    assert.equal((await s2.get("/api/whatsapp-link")).link, NEW);
    const h = (await s2.get("/api/health")).waGroups;
    assert.equal(h.enabled, true);
    assert.equal(h.running, true);
    assert.equal(JSON.stringify(h).includes(NEW), false, "в health ссылок нет");
    await waitFor(() => evo.of("/instance/connectionState").length >= 1, 20_000);
    assert.equal(s2.log().includes(EVO_KEY), false, "ключ API в логе не появляется");
    assert.equal(evo.calls.every((c) => c.key === EVO_KEY), true);
  } finally {
    s2.child.kill();
    await new Promise((r) => s2.child.on("close", r));
  }
});

// ───────────────────────── правки после ревью скептика (08.10.2026) ─────────────────────────

/** Часы:минуты по Алматы из ISO-времени строки журнала. */
const almHM = (iso: string) => new Date(Date.parse(iso) + 5 * 3600_000).toISOString().slice(11, 16);
const creates = () => evo.of("/community/create").length;

test("ревью п.1: тик и «Создать сейчас» одновременно создают одно сообщество эфира, в любом порядке", async () => {
  // тик встал в очередь первым, кнопка нажата, пока он ещё ничего не создал
  const w = bootEvent({ recruitFrom: "2026-10-08" });
  at(8, 12, 0, 0);
  evo.calls = [];
  const tickP = waTick();
  const btnP = waEventCreateNow();
  const [tick, btn] = [await tickP, await btnP];
  assert.equal(tick.created, 1);
  assert.equal(btn.code, "exists", "кнопка в очереди увидела готовое сообщество и вернула его");
  assert.equal(btn.ok, true);
  assert.equal(creates(), 1, "ровно один /community/create");
  assert.equal(w.state().targets.length, 1);

  // кнопка первой, тик следом: тик тоже ничего не добавляет
  const w2 = bootEvent({ recruitFrom: "2026-10-08" });
  at(8, 12, 0, 0);
  evo.calls = [];
  const btn2P = waEventCreateNow();
  const tick2P = waTick();
  const [btn2, tick2] = [await btn2P, await tick2P];
  assert.ok(btn2.ok && ["created", "building"].includes(btn2.code!), btn2.message);
  assert.equal(tick2.created, 0);
  assert.equal(creates(), 1);
  assert.equal(w2.state().targets.length, 1);

  // две кнопки подряд без ожидания: вторая в очереди видит паузу после неясного ответа и ничего не создаёт
  const w3 = bootEvent({ recruitFrom: "2026-10-08" });
  at(8, 12, 0, 0);
  evo.calls = [];
  evo.fail = (c) => (c.path.startsWith("/community/create") ? { status: 500 } : null);
  const [a, b] = await Promise.all([waEventCreateNow(), waEventCreateNow()]);
  assert.equal(creates(), 1, "после неясного ответа вторая кнопка не создаёт вслепую");
  assert.equal(a.ok, false);
  assert.deepEqual([b.ok, b.code], [false, "pending"], "вторая кнопка в очереди видит неподтверждённое создание");
  assert.equal(w3.state().paused, false, "рассылку неясное создание не останавливает");
  assert.ok(w3.state().pendingCreate, "но блокирует повторное создание до /wa_resume");
  assert.equal(w3.state().targets.length, 0);
});

test("ревью п.1: два /wa_new без ожидания и тик с /wa_new на тот же эфир создают одно сообщество", async () => {
  boot();
  at(8, 20, 0, 0);
  evo.calls = [];
  const [x, y] = await Promise.all([waCommand("wa_new", "2026-10-09", clock.t), waCommand("wa_new", "2026-10-09", clock.t)]);
  assert.match(x.text, /Создано/);
  assert.match(y.text, /сообщество уже есть/);
  assert.equal(creates(), 1);

  const w2 = boot();
  at(8, 20, 0, 0);
  evo.calls = [];
  const tickP = waTick();
  const cmdP = waCommand("wa_new", "2026-10-09", clock.t);
  const [tick, cmd] = [await tickP, await cmdP];
  assert.equal(tick.created, 1, "по расписанию в 20:00 сообщество эфира 9-го создал тик");
  assert.match(cmd.text, /сообщество уже есть/);
  assert.equal(creates(), 1);
  assert.equal(w2.state().targets.length, 1);

  // лимит в сутки внутри очереди: три быстрых вызова на разные дни, четвёртый уже не проходит
  boot();
  at(8, 15, 0, 0);
  evo.calls = [];
  const texts = (await Promise.all(["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"].map((d) => waCommand("wa_new", d, clock.t)))).map((r) => r.text);
  assert.equal(texts.filter((t) => /Создано/.test(t)).length, 3);
  assert.equal(texts.filter((t) => /Лимит 3 новых сообществ/.test(t)).length, 1, "четвёртый, вставший в очередь, упёрся в лимит");
  assert.equal(creates(), 3);
});

test("ревью п.2: таймаут у картинки не повторяется ни на следующем тике, ни после рестарта; тревога одна, текст вместо картинки не уходит", async () => {
  const w = boot();
  await createFor(w, 9);
  evo.calls = [];
  alarms.length = 0;
  const realTimeout = AbortSignal.timeout;
  // у картинки таймаут 90 секунд: в тесте сжимаем его до 0,3 секунды, а подставный Evolution отвечает медленнее
  AbortSignal.timeout = ((ms: number) => realTimeout.call(AbortSignal, ms >= 90_000 ? 300 : ms)) as typeof AbortSignal.timeout;
  try {
    evo.fail = (c) => (c.path.startsWith("/message/sendMedia") ? { delay: 1200 } : null);
    at(9, 11, 30, 5);
    await waTick();
  } finally {
    AbortSignal.timeout = realTimeout;
  }
  evo.fail = null;
  assert.equal(evo.of("/message/sendMedia").length, 1, "одна попытка");
  assert.equal(evo.of("/message/sendText").length, 0, "текст вместо картинки не уходит");
  const main = w.journal().find((r) => r.ev === "send" && r.msg === "morning" && r.part === "main");
  assert.deepEqual([main.ok, main.unknown, main.err], [false, true, "timeout"]);
  const unsure = alarms.filter((a) => a.startsWith("Не уверен, что ушло morning"));
  assert.equal(unsure.length, 1);
  assert.equal(unsure[0], "Не уверен, что ушло morning в «Вайб-продакшен · эфир 09.10». Проверь в WhatsApp, при необходимости /wa_send morning");
  assert.equal(w.state().failStreak, 1, "неясный исход считается ошибкой: после трёх подряд пауза");

  // следующий тик в окне 11:30 до 11:42: картинка не повторяется, опрос (вторая часть) уходит
  at(9, 11, 31, 10);
  await waTick();
  assert.equal(evo.of("/message/sendMedia").length, 1, "повтора картинки нет");
  assert.equal(evo.of("/message/sendPoll").length, 1);
  assert.equal(w.state().failStreak, 0);

  // рестарт модуля: отметка «неясно» восстановлена из журнала, картинка снова не уходит
  resetWaGroups();
  initWaGroups({ dir: w.dir, seriesFile: join(w.dir, "wa-series.json"), deps: deps() });
  assert.equal(_waRt()!.unknown.size, 1);
  at(9, 11, 33, 0);
  await waTick();
  assert.equal(evo.of("/message/sendMedia").length, 1, "после рестарта тоже");
  assert.equal(alarms.filter((a) => a.startsWith("Не уверен")).length, 1, "тревога одна");
  assert.equal(waReportLine("2026-10-09"), `WhatsApp: вступили по заявкам 0, сообщений серии ушло 0 из ${DAY0()}.`, "неясное в итог «ушло» не входит");

  // владелец проверил и решил отправить ещё раз: /wa_send повторяет только неясную часть
  const [reply] = await ownerSay("/wa_send morning");
  assert.match(reply, /отправлено 1, уже было 0, не ушло 0/);
  assert.equal(evo.of("/message/sendMedia").length, 2);
  assert.equal(evo.of("/message/sendPoll").length, 1, "опрос второй раз не уходит");
  const manual = w.journal().filter((r) => r.ev === "send" && r.msg === "morning" && r.part === "main");
  assert.deepEqual([manual[1].ok, manual[1].manual, manual[1].unknown], [true, true, undefined]);
  assert.equal(_waRt()!.unknown.size, 0);
  const [again] = await ownerSay("/wa_send morning");
  assert.match(again, /отправлено 0, уже было 1/);
  // и после ещё одного рестарта неясной отметки нет
  resetWaGroups();
  initWaGroups({ dir: w.dir, seriesFile: join(w.dir, "wa-series.json"), deps: deps() });
  assert.equal(_waRt()!.unknown.size, 0);
});

test("ревью п.2: 5xx у картинки не заменяется текстом и не повторяется; 5xx у приветствия не повторяется; явный 4xx прежний", async () => {
  const w = boot();
  await createFor(w, 9);
  evo.calls = [];
  alarms.length = 0;
  evo.fail = (c) => (c.path.startsWith("/message/sendMedia") ? { status: 502 } : null);
  at(9, 11, 30, 5);
  await waTick();
  assert.equal(evo.of("/message/sendMedia").length, 1);
  assert.equal(evo.of("/message/sendText").length, 0, "при 5xx текст вместо картинки не уходит");
  assert.equal(alarms.filter((a) => a.startsWith("Не уверен, что ушло morning")).length, 1);
  assert.equal(alarms.filter((a) => a.includes("Не отправилась картинка")).length, 0, "это не явный отказ, а неясный исход");
  at(9, 11, 31, 10);
  await waTick();
  at(9, 11, 40, 0);
  await waTick();
  assert.equal(evo.of("/message/sendMedia").length, 1, "картинка не повторяется до конца окна");
  assert.equal(evo.of("/message/sendText").length, 0);

  // приветствие: 5xx, повторять нельзя
  const w2 = boot();
  alarms.length = 0;
  evo.calls = [];
  evo.fail = (c) => (c.path.startsWith("/message/sendText") ? { status: 500 } : null);
  at(8, 20, 0, 0);
  assert.equal((await waTick()).created, 1);
  assert.equal(evo.of("/message/sendText").length, 1);
  assert.equal(alarms.filter((a) => a.startsWith("Не уверен, что приветствие ушло в «Вайб-продакшен · эфир 09.10»")).length, 1);
  // сообщество на завтра: сбой приветствия не трогает общий failStreak, ожидание на самой цели (3 минуты)
  assert.equal(w2.state().failStreak, 0);
  assert.equal(w2.state().targets[0].retryAt, alm(2026, 10, 8, 20, 3, 0));
  at(8, 20, 2, 0);
  await waTick();
  assert.equal(evo.of("/message/sendText").length, 1, "до истечения ожидания цель не трогаем");
  at(8, 20, 3, 5);
  await waTick();
  assert.equal(evo.of("/message/sendText").length, 1, "приветствие второй раз не уходит");
  assert.equal(w2.state().targets[0].done.welcome, true);
  assert.equal(w2.state().failStreak, 0);

  // явный 4xx: как раньше, текст вместо картинки (она точно не ушла), тревога про картинку
  const w3 = boot();
  await createFor(w3, 9);
  evo.calls = [];
  alarms.length = 0;
  evo.fail = (c) => (c.path.startsWith("/message/sendMedia") ? { status: 400 } : null);
  at(9, 14, 0, 5);
  await waTick();
  assert.equal(evo.of("/message/sendText").length, 1, "4xx: текст вместо картинки, как раньше");
  assert.equal(alarms.filter((a) => a.includes("Не отправилась картинка")).length, 1);
  assert.equal(alarms.filter((a) => a.startsWith("Не уверен")).length, 0);
});

test("ревью п.3: старт эфира только 18:00 до 21:00; при 18:00 и 21:00 ничего не уходит раньше 09:00 и позже 23:45, дожим не раньше оффера", async () => {
  // допуск
  boot({ daily: false });
  at(8, 12, 0, 0);
  waSetMode("event");
  for (const start of ["17:59", "21:01", "12:00", "22:00", "09:00"]) {
    const x = waSetEvent({ date: EVENT_DAY, start, recruitFrom: "2026-10-09" });
    assert.equal(x.code, "bad_start", start);
    assert.match(x.message, /от 18:00 до 21:00 по Алматы/);
  }
  for (const start of ["18:00", "21:00", "20:00"]) assert.equal(waSetEvent({ date: EVENT_DAY, start, recruitFrom: "2026-10-09" }).ok, true, start);

  // плановое время всей серии при допустимых стартах лежит в окне 09:00 до 23:45, дожим не раньше оффера
  for (const start of ["18:00", "19:30", "20:00", "21:00"]) {
    const w = bootEvent({ start, recruitFrom: "2026-10-11" });
    const r = w.rt();
    const plan = (id: string) => _internals.planOf(r, { day: EVENT_DAY, start }, r.cfg.messages.find((m) => m.id === id)!);
    for (const m of r.cfg.messages) {
      const hm = almHM(new Date(plan(m.id)).toISOString());
      assert.ok(hm >= "09:00" && hm <= "23:45", `${start}: ${m.id} в ${hm}`);
    }
    assert.ok(plan("push") >= plan("offer"), `${start}: дожим не раньше оффера`);
    assert.ok(plan("last-call") >= plan("offer"), `${start}: последние 30 минут не раньше оффера`);

    // весь день эфира с шагом 10 минут (окно отправки 12 минут): ничего ночью, и порядок оффер, потом дожим
    at(8, 12, 0, 0);
    assert.equal((await waEventCreateNow()).ok, true);
    evo.calls = [];
    const day0 = alm(2026, 10, 12, 0, 0);
    for (let mi = 0; mi < 24 * 60; mi += 10) {
      clock.t = day0 + mi * 60_000;
      await waTick();
    }
    const sent = w.journal().filter((x) => x.ev === "send" && x.ok && x.msg !== "welcome" && x.part === "main");
    assert.equal(sent.length, DAY0(), `${start}: ушли все ${DAY0()} включённых сообщений дня эфира (+1 день в живой эфир не идёт)`);
    for (const x of sent) assert.ok(almHM(x.ts) >= "09:00" && almHM(x.ts) <= "23:57", `${start}: ${x.msg} ушло в ${almHM(x.ts)}`);
    const order = sent.map((x) => x.msg);
    assert.ok(order.indexOf("offer") < order.indexOf("push"), `${start}: оффер раньше дожима`);
    assert.ok(order.indexOf("push") < order.indexOf("last-call"));
    assert.equal(w.journal().filter((x) => x.ev === "skip").length, 0, "допустимые старты ничего не пропускают");
  }

  // старое сохранённое состояние со стартом 12:00: утренние сообщения (03:30 до 08:00) не уходят, пропуск в журнале, тревоги нет
  const w = bootEvent({ recruitFrom: "2026-10-11" });
  at(8, 12, 0, 0);
  assert.equal((await waEventCreateNow()).ok, true);
  w.rt().state.targets[0].start = "12:00";
  alarms.length = 0;
  evo.calls = [];
  const day0 = alm(2026, 10, 12, 0, 0);
  const runDay = async (fromMin: number, toMin: number) => {
    for (let mi = fromMin; mi < toMin; mi += 10) {
      clock.t = day0 + mi * 60_000;
      await waTick();
    }
  };
  await runDay(0, 9 * 60); // ночь и утро до 09:00: плановое время 03:30, 04:30, 06:00, 08:00
  assert.equal(w.journal().filter((x) => x.ev === "send" && x.ok && x.msg !== "welcome").length, 0, "до 09:00 ничего не ушло");
  const skipped = w.journal().filter((x) => x.ev === "skip");
  assert.deepEqual(skipped.map((x) => `${x.msg} ${x.plan}`), ["morning 03:30", "reel-119k 04:00", "reg-bonus 04:30", "warm-edits 06:00", "personal 07:00", "noface 08:00"]);
  assert.ok(skipped.every((x) => x.reason === "night"));
  assert.equal(alarms.length, 0, "пропуск без тревоги");
  // пульт показывает пропуск простыми словами
  assert.ok((waPanel(clock.t) as any).journal.some((x: any) => /^Пропущено «Утро: что будем делать вечером» в .*03:30/.test(x.text)));
  await runDay(9 * 60, 24 * 60);
  const sent = w.journal().filter((x) => x.ev === "send" && x.ok && x.msg !== "welcome" && x.part === "main");
  assert.equal(sent.length, DAY0() - 6, "остальные сообщения ушли, утренние 6 пропущены");
  for (const x of sent) assert.ok(almHM(x.ts) >= "09:00", `${x.msg} ушло в ${almHM(x.ts)}`);
  assert.equal(w.journal().filter((x) => x.ev === "skip").length, 6, "по одной строке на сообщение, повторов нет");
  assert.equal(alarms.length, 0);

  // сдвиг оффера за дожим (старт 22:00 записан в старом состоянии): дожим ждёт оффера
  const r = w.rt();
  const planAt = (id: string, start: string) => _internals.planOf(r, { day: EVENT_DAY, start }, r.cfg.messages.find((m) => m.id === id)!);
  assert.equal(planAt("offer", "22:00"), alm(2026, 10, 12, 23, 18));
  assert.equal(planAt("push", "22:00"), planAt("offer", "22:00"), "дожим не раньше оффера");
  assert.equal(planAt("push", "20:00"), alm(2026, 10, 12, 22, 30), "при обычном старте дожим на своём месте");
});

test("ревью п.5: пакет одобрения не выходит за лимит, переполнение открывается сразу, без пятиминутного замера", async () => {
  const w = boot();
  const t1 = await createFor(w, 9);
  at(9, 10, 0, 0);
  evo.members.set(t1.jid, 1890);
  await waTick(); // замер: 1890 из 1900
  assert.equal(w.state().targets[0].members, 1890);
  const reqs = Array.from({ length: 30 }, (_, i) => ({ jid: `7701000${String(i).padStart(4, "0")}@s.whatsapp.net` }));
  evo.requests.set(t1.jid, reqs.map((x) => ({ ...x })));
  evo.calls = [];
  assert.equal(await joinsTick(), 10, "до лимита 10 мест: одобрено ровно столько");
  const posts = () => evo.of("/community/requests").filter((c) => c.method === "POST");
  assert.equal(posts().length, 1);
  assert.equal(posts()[0].body.participants.length, 10);
  assert.equal(w.rt().approvedSince.get(t1.id), 10);
  assert.equal(creates(), 0, "пока места были, следующее не открыто");

  // мест нет: людей не одобряем, следующее сообщество открывается сразу, не дожидаясь замера через 5 минут
  clock.t += 31_000;
  await joinsTick();
  assert.equal(posts().length, 1, "больше ни одного одобрения в заполненное сообщество");
  assert.equal(w.state().targets.length, 2, "открыто «(2)»");
  assert.equal(w.state().targets[1].name, "Вайб-продакшен · эфир 09.10 (2)");
  assert.ok(alarms.some((a) => a.includes("Открыто следующее")));
  assert.equal(waGroupLink(clock.t, false), w.state().targets[1].link, "ссылка на сайте уже на новом сообществе");
  // ещё раз: второго «(2)» не открывается (у старого сообщества опрос теперь реже, ждём срока)
  clock.t += 200_000;
  await joinsTick();
  assert.equal(w.state().targets.length, 2);
  assert.equal(posts().length, 1);

  // после рестарта оценка заполнения восстанавливается из журнала (одобренные после замера)
  const w2 = boot();
  const t = await createFor(w2, 9);
  at(9, 10, 0, 0);
  evo.members.set(t.jid, 1895);
  await waTick();
  evo.requests.set(t.jid, [{ jid: "1@lid" }, { jid: "2@lid" }, { jid: "3@lid" }, { jid: "4@lid" }]);
  clock.t += 5000; // одобрения строго после замера
  assert.equal(await joinsTick(), 4);
  assert.equal(_waRt()!.approvedSince.get(t.id), 4);
  resetWaGroups();
  initWaGroups({ dir: w2.dir, seriesFile: join(w2.dir, "wa-series.json"), deps: deps() });
  assert.equal(_waRt()!.approvedSince.get(t.id), 4, "после рестарта те же 4");

  // отказ «в сообществе нет места» (419) не списывает людей и считает сообщество заполненным
  const w3 = boot();
  const t3 = await createFor(w3, 9);
  at(9, 10, 0, 0);
  evo.members.set(t3.jid, 100);
  await waTick();
  evo.requests.set(t3.jid, [{ jid: "a@lid" }, { jid: "b@lid" }]);
  evo.rejectJids.add("a@lid");
  evo.rejectCode = "419";
  await joinsTick();
  assert.equal(w3.rt().approveFails.get(`${t3.jid}|a@lid`), undefined, "отказ из-за лимита в счётчик отказов не идёт");
  assert.equal(w3.rt().approved.has(`${t3.jid}|b@lid`), true);
  assert.equal(w3.state().targets.length, 2, "WhatsApp сказал «полно»: следующее открыто сразу");
  assert.equal(w3.state().targets[0].members, 1900);
  // обычный отказ по человеку (404) по-прежнему списывает после трёх попыток
  const w4 = boot();
  const t4 = await createFor(w4, 9);
  at(9, 10, 0, 0);
  await waTick();
  evo.requests.set(t4.jid, [{ jid: "z@lid" }]);
  evo.rejectJids.add("z@lid");
  evo.rejectCode = "404";
  for (let i = 0; i < 5; i++) {
    clock.t += 31_000;
    await joinsTick();
  }
  assert.equal(w4.rt().approveFails.get(`${t4.jid}|z@lid`), 3);
});

test("ревью п.6: сбой Evolution при одобрении (5xx, обрыв соединения) не вычёркивает людей: после починки их одобряют", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  at(9, 10, 0, 0);
  await waTick();
  evo.requests.set(t.jid, [{ jid: "1@lid" }, { jid: "2@lid" }]);
  const decide = (c: { method: string; path: string }) => c.method === "POST" && c.path.startsWith("/community/requests");
  evo.fail = (c) => (decide(c) ? { status: 500 } : null);
  for (let i = 0; i < 2; i++) {
    clock.t += 31_000;
    await joinsTick();
  }
  evo.fail = (c) => (decide(c) ? { hang: true } : null);
  for (let i = 0; i < 2; i++) {
    clock.t += 31_000;
    await joinsTick();
  }
  assert.equal(w.rt().approveFails.size, 0, "сбой сервера людям в счёт не идёт");
  assert.equal(w.joins().filter((x) => x.ev === "approve_error").length, 4);
  evo.fail = null;
  clock.t += 31_000;
  assert.equal(await joinsTick(), 2, "после починки обоих одобрили");
  assert.equal(w.rt().approved.size, 2);
});

test("ревью п.6: явный отказ на весь пакет (400) засчитывается каждому, «ядовитый» пакет не стопорит очередь навсегда", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  at(9, 10, 0, 0);
  await waTick();
  evo.requests.set(t.jid, [{ jid: "bad@lid" }]);
  const decide = (c: { method: string; path: string }) => c.method === "POST" && c.path.startsWith("/community/requests");
  evo.fail = (c) => (decide(c) ? { status: 400 } : null);
  for (let i = 0; i < 5; i++) {
    clock.t += 31_000;
    await joinsTick();
  }
  assert.equal(w.rt().approveFails.get(`${t.jid}|bad@lid`), 3, "после трёх отказов пакета номер выбывает");
  assert.equal(w.joins().filter((x) => x.ev === "approve_error").length, 3, "четвёртой и пятой попытки нет");
});

test("ревью п.7: в wa-series.json опрос заявок щадящий (2 до 4 минут, горячо 10 минут), выдача ссылки ускоряет", async () => {
  const s = JSON.parse(readFileSync(WA_SERIES, "utf8"));
  assert.deepEqual([s.joinPolling.idleSec, s.joinPolling.hotMinutes], [[120, 240], 10]);
  assert.ok(readFileSync(join(REPO, "scripts", "build-wa-series.mjs"), "utf8").includes("idleSec: [120, 240], hotMinutes: 10"), "правка сделана в сборщике, а не руками в json");
  const w = boot();
  const t = await createFor(w, 9);
  at(9, 10, 0, 0);
  await waTick();
  await joinsTick(); // первый опрос, ссылку никому не выдавали, заявок нет
  const idle = w.rt().joinNextAt.get(t.id)! - clock.t;
  assert.ok(idle >= 120_000 && idle <= 240_000, `в покое ${idle}`);
  clock.t += 60_000;
  evo.calls = [];
  await joinsTick();
  assert.equal(evo.calls.length, 0, "через минуту опрашивать ещё рано");
  // человеку отдали ссылку на сайте: опрос через 15 секунд, потом 10 минут горячо (15 до 30 секунд)
  assert.equal(waGroupLink(clock.t), t.link);
  clock.t += 16_000;
  await joinsTick();
  const hot = w.rt().joinNextAt.get(t.id)! - clock.t;
  assert.ok(hot >= 15_000 && hot <= 30_000, `горячий ${hot}`);
  clock.t += 11 * 60_000;
  await joinsTick();
  const calm = w.rt().joinNextAt.get(t.id)! - clock.t;
  assert.ok(calm >= 120_000 && calm <= 240_000, `снова покой ${calm}`);
});

test("ревью п.9: тревога «WhatsApp не подключён» с 23:00 до 09:00 не шлётся, утром одна сводная, днём как раньше", async () => {
  const w = boot();
  evo.state = "close";
  for (const [d, h, mi] of [[8, 23, 0], [9, 0, 30], [9, 3, 0], [9, 8, 59]] as number[][]) {
    at(d, h, mi, 0);
    assert.equal((await waTick()).skipped, "no_connection");
  }
  assert.equal(alarms.length, 0, "ночью тревоги нет");
  assert.ok(w.journal().some((x) => x.ev === "conn" && x.state === "close"), "потеря подключения в журнале и ночью");
  at(9, 9, 0, 0);
  await waTick();
  assert.equal(alarms.length, 1, "утром одна сводная");
  assert.match(alarms[0], /WhatsApp не подключён \(состояние: close\)\. Подключения нет с 08\.10 в 23:00\./);
  at(9, 9, 30, 0);
  await waTick();
  assert.equal(alarms.length, 1);
  at(9, 10, 1, 0);
  await waTick();
  assert.equal(alarms.length, 2, "дальше раз в час, как раньше");
  // подключение вернулось и снова пропало ночью: сводной снова нет, пока не наступит утро
  evo.state = "open";
  at(9, 12, 0, 0);
  await waTick();
  evo.state = "close";
  at(9, 23, 30, 0);
  await waTick();
  at(10, 3, 0, 0);
  await waTick();
  assert.equal(alarms.length, 2);
  at(10, 9, 5, 0);
  await waTick();
  assert.equal(alarms.length, 3);
  assert.match(alarms[2], /Подключения нет с 09\.10 в 23:30/);
});

test("ревью п.4: wa.html (постоянная ссылка шаблона WABA) входит в архив бота и в обе выкладки", () => {
  assert.ok(existsSync(join(REPO, "workshop-montazh", "wa.html")));
  const pack = readFileSync(join(REPO, "scripts", "pack-workshop-bot.ps1"), "utf8");
  assert.ok(pack.includes('"thank-you.html", "wa.html")'), "wa.html копируется в landing архива");
  const bot = readFileSync(join(REPO, "scripts", "deploy-workshop-bot.sh"), "utf8");
  assert.match(bot, / landing\/wa\.html /, "наличие в архиве проверяется");
  assert.match(bot, /^place wa\.html$/m, "раскладка на сервер");
  assert.match(bot, /rm -f \$W\/wa\.html/, "откат убирает файл, если раньше его не было");
  const land = readFileSync(join(REPO, "scripts", "deploy-landing.sh"), "utf8");
  assert.match(land, /index\.html\|thank-you\.html\|wa\.html\|efir\.js\|assets\/\*\) ;;/, "путь wa.html разрешён в проверке архива");
  assert.match(land, /echo wa\.html/, "wa.html в порядке замены (страницы последними)");
  assert.match(land, /added\.list/, "бэкап и откат общие со всеми страницами");
});

// ───────────────────────── ТЗ wa_status_panel: статус подключения и код по номеру ─────────────────────────

const stat = async () => (await waStatus()) as any;
/** Следующий замер статуса: статус кешируется на 3 секунды, поэтому часы сдвигаем. */
const statNext = async () => {
  clock.t += 4000;
  return stat();
};

test("статус WhatsApp: подключён, ждёт подключения, отключён с причиной, logout (401), заблокирован (403 и признаки бана), Evolution не отвечает; номер закрыт", async () => {
  const w = boot();
  at(8, 12, 0, 0);
  const seen: any[] = [];
  const keep = (s: any) => (seen.push(s), s);
  // подключён: номер закрыт серединой, имя профиля, с какого времени
  let s = keep(await stat());
  assert.deepEqual([s.ok, s.kind, s.tone, s.title, s.state], [true, "connected", "ok", "Подключён", "open"]);
  assert.deepEqual([s.number, s.profile, s.since, s.checked], ["7700***2233", "Тест", "08.10 в 12:00", "12:00"]);
  assert.equal(maskNumber("77085834575"), "7708***4575");
  assert.equal(w.state().connSince, clock.t, "«подключён с» переживает рестарт: лежит в состоянии");
  // тот же замер в пределах 3 секунд: Evolution не спрашиваем
  evo.calls = [];
  clock.t += 1500;
  assert.equal((await stat()).checked, "12:00");
  assert.equal(evo.calls.length, 0);
  // через 3 секунды новый замер: «подключён с» остаётся прежним
  s = keep(await statNext());
  assert.equal(s.since, "08.10 в 12:00");
  assert.deepEqual(evo.seq(), ["GET /instance/connectionState", "GET /instance/fetchInstances"]);

  // logout с телефона: код 401
  evo.disconnectWith(401, "Logged Out");
  s = keep(await statNext());
  assert.deepEqual([s.kind, s.tone, s.state, s.reasonCode, s.reason], ["logged_out", "bad", "close", 401, "logout (401)"]);
  assert.equal(s.title, "Номер вышел из устройства (logout), нужно подключить заново");
  assert.match(s.detail, /\(08\.10 в 14:30\)/, "время отключения по Алматы");
  assert.match(s.detail, /Ответ WhatsApp: Logged Out\./);
  assert.deepEqual([s.number, s.since], ["", ""]);
  assert.equal(w.state().connSince, 0, "отключился: «подключён с» сброшен");

  // блокировка: код 403
  evo.disconnectWith(403, "Forbidden");
  s = keep(await statNext());
  assert.deepEqual([s.kind, s.tone, s.reasonCode, s.title], ["banned", "bad", 403, "Номер заблокирован WhatsApp"]);
  assert.match(s.detail, /\(код 403\)/);
  assert.match(s.detail, /нужен другой номер/);
  // явные признаки бана в записанной причине при другом коде
  evo.disconnectWith(401, "Account banned by WhatsApp");
  s = keep(await statNext());
  assert.deepEqual([s.kind, s.title], ["banned", "Номер заблокирован WhatsApp"]);
  // обычные закрытия блокировкой не считаются
  for (const [code, msg, part] of [[428, "Connection Closed", "connectionClosed"], [440, "Stream Errored (conflict)", "на другом устройстве"], [500, "Bad Session", "badSession"], [515, "Restart Required", "restartRequired"], [411, "Multidevice Mismatch", "multideviceMismatch"]] as const) {
    evo.disconnectWith(code, msg);
    s = keep(await statNext());
    assert.deepEqual([s.kind, s.title, s.reasonCode], ["disconnected", "Отключён", code], `код ${code}`);
    assert.ok(s.detail.includes(part), `код ${code}: ${s.detail}`);
    assert.match(s.detail, /Ответ WhatsApp:/);
  }
  // 402 и 406: Evolution сам не переподключается
  evo.disconnectWith(406, "Not Acceptable");
  s = keep(await statNext());
  assert.deepEqual([s.kind, s.reasonCode], ["disconnected", 406]);
  assert.match(s.detail, /сам не переподключится/);
  // причина не записана
  evo.disconnectWith(null, "");
  s = keep(await statNext());
  assert.deepEqual([s.kind, s.reasonCode], ["disconnected", null]);
  assert.match(s.detail, /причина не записана/);
  // Evolution закрыл подключение, а данные инстанса отдать не смог: причину не знаем, но статус есть
  evo.disconnectWith(401);
  evo.fail = (c) => (c.path.startsWith("/instance/fetchInstances") ? { status: 500 } : null);
  s = keep(await statNext());
  assert.deepEqual([s.kind, s.tone], ["disconnected", "bad"]);
  assert.match(s.detail, /^Причину узнать не удалось/);
  evo.fail = null;

  // ждёт подключения: QR или код ещё не введены; номер уже привязан и переподключается
  evo.disconnect = null;
  evo.state = "connecting";
  s = keep(await statNext());
  assert.deepEqual([s.kind, s.tone, s.title, s.state], ["waiting", "wait", "Ждёт подключения", "connecting"]);
  assert.match(s.detail, /QR или код ещё не введены/);
  evo.paired = true;
  s = keep(await statNext());
  assert.equal(s.kind, "waiting");
  assert.match(s.detail, /идёт переподключение/);
  evo.paired = false;
  // инстанса нет вовсе: данные инстанса не запрашиваем
  evo.state = "absent";
  evo.calls = [];
  s = keep(await statNext());
  assert.deepEqual([s.kind, s.title], ["waiting", "Ждёт подключения"]);
  assert.match(s.detail, /ещё не создано/);
  assert.deepEqual(evo.seq(), ["GET /instance/connectionState"]);

  // подключили снова: «подключён с» начинается с этого момента
  evo.state = "open";
  s = keep(await statNext());
  assert.equal(s.kind, "connected");
  assert.equal(s.since, `${String(dayKeyOf(clock.t)).slice(8, 10)}.10 в ${almHM(new Date(clock.t).toISOString())}`);
  assert.equal(w.state().connSince, clock.t);

  // Evolution не отвечает: это статус, а не исключение
  const saved = process.env.EVOLUTION_URL;
  process.env.EVOLUTION_URL = "http://127.0.0.1:1";
  s = keep(await statNext());
  process.env.EVOLUTION_URL = saved;
  assert.deepEqual([s.ok, s.kind, s.tone, s.title, s.state], [true, "unreachable", "bad", "Evolution не отвечает", "unreachable"]);
  assert.match(s.detail, /Рассылка, создание сообществ и одобрение заявок стоят/);
  assert.equal(w.rt().conn.state, "unreachable");
  assert.equal(w.state().connSince > 0, true, "недоступность Evolution срок подключения не обнуляет");
  // вернулся: срок прежний, статус снова «Подключён»
  const sinceBefore = w.state().connSince;
  s = keep(await statNext());
  assert.equal(s.kind, "connected");
  assert.equal(w.state().connSince, sinceBefore);

  // экран получает последний статус из памяти без запроса
  assert.deepEqual([(waPanel(clock.t) as any).status.kind, (waPanel(clock.t) as any).status.number], ["connected", "7700***2233"]);
  // ни ключа, ни токена инстанса, ни полного номера
  const all = JSON.stringify(seen) + JSON.stringify(waPanel(clock.t));
  assert.equal(all.includes(EVO_KEY) || all.includes(INSTANCE_TOKEN), false);
  assert.equal(JSON.stringify(seen).includes("77001112233"), false, "номер в статусе закрыт");
});

test("статус WhatsApp: до первой проверки экран получает status: null; без модуля ответ «модуль не запущен»", async () => {
  boot();
  at(8, 12, 0, 0);
  assert.equal((waPanel(clock.t) as any).status, null);
  resetWaGroups();
  const off: any = await waStatus();
  assert.deepEqual([off.ok, off.code], [false, "module_off"]);
  const offP: any = await waPairing("77085834575");
  assert.deepEqual([offP.ok, offP.code], [false, "module_off"]);
});

test("подключение по номеру: проверка номера, create без инстанса, connect?number у закрытого, незавершённая попытка по QR закрывается, привязанный номер не трогаем, код из кеша 15 секунд", async () => {
  const w = boot();
  at(8, 12, 0, 0);
  const results: any[] = [];
  const keep = (x: any) => (results.push(x), x);
  // плохие номера: до Evolution дело не доходит
  for (const bad of ["", "123", "abc77085834575", "7708583457512345", "+7 (708) 583", null, undefined, {}, 77085]) {
    const r: any = await waPairing(bad);
    assert.deepEqual([r.ok, r.code], [false, "bad_number"], String(bad));
  }
  assert.equal(evo.calls.length, 0);

  // инстанса нет: создаётся сразу с номером, код приходит в ответе create
  evo.state = "absent";
  evo.calls = [];
  const p1 = keep(await waPairing("+7 708 583 45 75"));
  assert.deepEqual([p1.ok, p1.state, p1.pairingCode, p1.number, p1.ttlSec, p1.cached], [true, "connecting", "PC014575", "7708***4575", 60, false]);
  assert.deepEqual(evo.seq(), ["GET /instance/connectionState", "POST /instance/create"]);
  const created = evo.of("/instance/create")[0].body;
  assert.deepEqual([created.number, created.integration, created.qrcode], ["77085834575", "WHATSAPP-BAILEYS", true]);
  // «Новый код» в пределах 15 секунд: тот же код, Evolution не трогаем
  clock.t += 5000;
  evo.calls = [];
  const p2 = keep(await waPairing("77085834575"));
  assert.deepEqual([p2.cached, p2.pairingCode], [true, "PC014575"]);
  assert.match(p2.message, /Новый можно получить через 10 с/);
  assert.equal(evo.calls.length, 0);
  // другой номер в те же 15 секунд кеш не подхватывает
  evo.calls = [];
  const pOther = keep(await waPairing("77011112233"));
  assert.equal(pOther.cached, false);
  assert.ok(evo.calls.length > 0);

  // через 15 секунд код новый. Инстанс в режиме кода (connecting, номер ещё не привязан): прежняя попытка закрывается, потом connect с номером
  clock.t += 20_000;
  evo.calls = [];
  const p3 = keep(await waPairing("77085834575"));
  assert.equal(p3.cached, false);
  assert.match(p3.pairingCode, /^PC\d{2}4575$/);
  assert.notEqual(p3.pairingCode, "PC014575");
  assert.deepEqual(evo.seq(), ["GET /instance/connectionState", "GET /instance/fetchInstances", "DELETE /instance/logout", "GET /instance/connect"]);
  assert.equal(evo.of("/instance/connect/")[0].query.get("number"), "77085834575");

  // та же картина, если ждали по QR: у connecting Evolution вернул бы прежний QR без кода, поэтому сначала logout
  evo.scan();
  evo.state = "connecting";
  evo.pairingNumber = null;
  clock.t += 20_000;
  evo.calls = [];
  const p4 = keep(await waPairing("77085834575"));
  assert.match(p4.pairingCode, /^PC\d{2}4575$/);
  assert.equal(evo.of("/instance/logout").length, 1);

  // закрытый инстанс (например, после logout или блокировки): сразу connect с номером, logout не нужен
  evo.disconnectWith(403, "Forbidden");
  clock.t += 20_000;
  evo.calls = [];
  const p5 = keep(await waPairing("77085834575"));
  assert.equal(p5.ok, true);
  assert.deepEqual(evo.seq(), ["GET /instance/connectionState", "GET /instance/connect"]);
  assert.equal(evo.disconnect, null, "после новой попытки старая причина Evolution не держит");

  // номер уже привязан и переподключается: ничего не сбрасываем
  evo.state = "connecting";
  evo.paired = true;
  evo.pairingNumber = null;
  clock.t += 20_000;
  evo.calls = [];
  const logoutsBefore = evo.logouts;
  const p6: any = keep(await waPairing("77085834575"));
  assert.deepEqual([p6.ok, p6.code], [false, "reconnecting"]);
  assert.equal(evo.logouts, logoutsBefore);
  assert.equal(evo.of("/instance/connect/").length, 0);
  evo.paired = false;

  // уже подключён: код не нужен
  evo.state = "open";
  evo.calls = [];
  const p7: any = keep(await waPairing("77085834575"));
  assert.deepEqual([p7.ok, p7.code], [false, "connected"]);
  assert.equal(evo.of("/instance/connect/").length + evo.of("/instance/create").length, 0);

  // код появляется не сразу (Evolution выдаёт его на событие QR): пауза и повторный запрос
  evo.state = "close";
  evo.pairLate = 1;
  sleeps.length = 0;
  clock.t += 20_000;
  evo.calls = [];
  const p8 = keep(await waPairing("77085834575"));
  assert.equal(p8.ok, true);
  assert.equal(evo.of("/instance/connect/").length, 2);
  assert.deepEqual(sleeps, [2500]);
  // код не пришёл вовсе: три попытки и понятная ошибка
  evo.state = "close";
  evo.pairLate = 99;
  sleeps.length = 0;
  clock.t += 20_000;
  evo.calls = [];
  const p9: any = keep(await waPairing("77085834575"));
  assert.deepEqual([p9.ok, p9.code], [false, "no_code"]);
  assert.equal(evo.of("/instance/connect/").length, 3);
  assert.deepEqual(sleeps, [2500, 2500]);
  evo.pairLate = 0;
  // Evolution ответил ошибкой или молчит
  evo.state = "close";
  evo.fail = (c) => (c.path.startsWith("/instance/connect/") ? { status: 500 } : null);
  clock.t += 20_000;
  const p10: any = keep(await waPairing("77085834575"));
  assert.deepEqual([p10.ok, p10.code], [false, "evolution"]);
  assert.match(p10.message, /Не удалось запросить код/);
  evo.fail = null;
  const saved = process.env.EVOLUTION_URL;
  process.env.EVOLUTION_URL = "http://127.0.0.1:1";
  clock.t += 20_000;
  const p11: any = keep(await waPairing("77085834575"));
  process.env.EVOLUTION_URL = saved;
  assert.deepEqual([p11.ok, p11.code], [false, "evolution"]);

  // человек ввёл код на телефоне: статус «Подключён»
  evo.state = "close";
  clock.t += 20_000;
  assert.equal(((await waPairing("77085834575")) as any).ok, true);
  assert.equal((await stat()).kind, "waiting", "код выдан, но ещё не введён");
  evo.scan();
  const done = await statNext();
  assert.deepEqual([done.kind, done.title, done.number], ["connected", "Подключён", "7700***2233"]);

  // номер и коды нигде не лежат: ни в ответах (номер закрыт), ни в состоянии, ни в журнале; ключа и токена тоже нет
  const files = ["wa-state.json", "wa-journal.jsonl"].map((f) => readFileSync(join(w.dir, f), "utf8")).join("\n");
  const blob = JSON.stringify(results);
  assert.equal(blob.includes("77085834575"), false, "в ответах номер закрыт");
  assert.equal(files.includes("77085834575"), false, "номер не пишем на диск");
  assert.equal(/PC\d{2}4575/.test(files), false, "код подключения на диск не пишем");
  assert.equal(blob.includes(EVO_KEY) || blob.includes(INSTANCE_TOKEN) || files.includes(EVO_KEY), false);
  const pairs = w.journal().filter((r) => r.ev === "pair");
  assert.ok(pairs.length >= 3);
  for (const row of pairs) assert.deepEqual(Object.keys(row).sort(), ["by", "ev", "ts"]);
  assert.ok((waPanel(clock.t) as any).journal.some((j: any) => j.text === "Запрошен код для подключения номера по телефону"));
});

// ───────────────────────── общий рубильник «Автоматизация» и прямой эфир (docs/tasks/automation_master_switch_event_mode.md) ─────────────────────────

const D15 = "2026-10-15";
/** Прямой эфир, который Telegram видит сейчас (по часам теста). */
const eventSchedNow = () => eventNow(clock.t);

/** Прямой эфир 15 октября: режим event, набор с 12 октября (или с recruitFrom), часы на 8 октября 12:00. */
function bootEvent15(o: BootOpts & { start?: string; recruitFrom?: string } = {}) {
  const w = boot({ daily: false, ...o });
  at(8, 12, 0, 0);
  assert.equal(waSetMode("event").ok, true);
  const set = waSetEvent({ date: D15, start: o.start ?? "20:00", recruitFrom: o.recruitFrom ?? "2026-10-12" });
  assert.equal(set.ok, true, set.message);
  return w;
}
const event15 = (w: ReturnType<typeof boot>) => w.state().targets.find((t: any) => t.day === D15);

test("Задача 1.1: прямой эфир 15.10, набор с 12.10, старт 20:30: сообщество в день набора в 10:00, до 15.10 ни одного сообщения серии, 15.10 лента сдвинута на 30 минут, в 00:00 режим закрыт и ссылка снова постоянная", async () => {
  const w = bootEvent15({ start: "20:30" });
  // до начала набора ничего не создаётся
  for (const [d, h, mi] of [[9, 20, 0], [10, 10, 0], [11, 10, 0], [11, 23, 0]]) {
    at(d, h, mi, 5);
    assert.equal((await waTick()).created, 0, `${d}.10 ${h}:${mi}`);
  }
  assert.equal(creates(), 0);
  at(12, 9, 59, 50);
  assert.equal((await waTick()).created, 0);
  // 12.10 в 10:00 создаётся одно сообщество, описание и приветствие уже с новым стартом
  at(12, 10, 0, 0);
  evo.calls = [];
  assert.equal((await waTick()).created, 1);
  const t = event15(w);
  assert.deepEqual([t.source, t.start, t.name], ["event", "20:30", "Вайб-продакшен · эфир 15.10"]);
  assert.match(evo.of("/community/create")[0].body.description, /Эфир в 20:30 по Алматы/);
  assert.match(evo.of("/message/sendText")[0].body.text, /Эфир 15 октября в 20:30 по Алматы \(18:30 по Москве\)/);
  // весь набор ссылка на сайте ведёт в него, после 00:00 дня после эфира постоянная
  for (const [d, h, mi] of [[12, 10, 6], [13, 12, 0], [14, 23, 59], [15, 8, 0], [15, 23, 59]]) assert.equal(waGroupLink(alm(2026, 10, d, h, mi), false), t.link, `${d}.10 ${h}:${mi}`);
  assert.equal(waGroupLink(alm(2026, 10, 16, 0, 0), false), null);
  // до дня эфира серия не идёт ни в один день, в том числе в 11:30 и 20:00
  for (const [d, h, mi] of [[12, 11, 30], [12, 20, 0], [13, 11, 30], [13, 20, 0], [14, 11, 30], [14, 19, 50], [14, 23, 30]]) {
    evo.calls = [];
    at(d, h, mi, 5);
    assert.equal((await waTick()).sent, 0, `${d}.10 ${h}:${mi}`);
    assert.equal(evo.of("/message/").length, 0, `${d}.10 ${h}:${mi}: ни одного сообщения`);
  }
  assert.deepEqual(mainSends(w), []);
  // день эфира: каждое сообщение до оффера включительно уходит на 30 минут позже, дожим и «последние 30 минут» на своём месте
  const r = w.rt();
  const day0 = r.cfg.messages.filter((m) => !m.dayOffset && m.enabled !== false);
  for (const m of day0) {
    at(15, 0, 0, 0);
    clock.t = _internals.planOf(r, { day: D15, start: "20:30" }, m) + 5000;
    await waTick();
  }
  const sent = mainSends(w);
  assert.equal(sent.length, day0.length, "ушла вся лента дня эфира");
  const at_ = (id: string) => almHM(sent.find((x) => x.msg === id)!.ts);
  assert.deepEqual(
    ["morning", "t-minus-30", "t-minus-10", "live-now", "live-10", "last-link", "training", "offer", "push", "last-call"].map(at_),
    ["12:00", "20:00", "20:20", "20:30", "20:40", "20:45", "21:28", "21:48", "22:30", "23:30"],
  );
  // тексты с часами нового старта, в том числе время ссылки на эфир
  const caption = (re: RegExp) => evo.calls.map((c) => String(c.body?.caption ?? c.body?.text ?? "")).find((x) => re.test(x)) ?? "";
  const c30 = caption(/Через 30 минут, в/);
  assert.match(c30, /в 20:30 по Алматы \(18:30 по Москве\)/);
  assert.match(c30, /Ссылка будет здесь в 20:20/);
  assert.equal(c30.includes("19:50"), false);
  assert.match(caption(/за 10 минут до эфира, в/), /за 10 минут до эфира, в 20:20/, "время ссылки в тексте 19:00 тоже сдвинуто");
  // 00:00: режим закрыт, ссылка постоянная, больше ничего не уходит
  evo.calls = [];
  at(16, 0, 0, 5);
  await waTick();
  assert.equal(evo.of("/message/").length, 0);
  assert.deepEqual([w.state().mode, w.state().event.done], ["daily", true]);
  assert.equal(waGroupLink(clock.t, false), null);
  assert.equal(eventSchedNow(), null, "Telegram тоже вернулся к ежедневному");
  assert.equal(alarms.some((a) => /так и не было создано/.test(a)), false, "сообщество было: тревоги нет");
});

test("Задача 1.1: сбой WhatsApp в день набора: создание повторяется (через 5 минут, потом через 30), к дню эфира сообщество появляется само, прошлые сообщения не досылаются, остальные уходят; тревога одна", async () => {
  const w = bootEvent15({ recruitFrom: "2026-10-12" });
  evo.fail = (c) => (c.path.startsWith("/community/create") ? { status: 400, json: { status: 400, error: "Bad Request", response: { message: ["boom"] } } } : null);
  at(12, 10, 0, 0);
  assert.equal((await waTick()).created, 0);
  at(12, 10, 5, 1);
  await waTick();
  at(12, 10, 10, 2);
  await waTick();
  assert.equal(w.journal().filter((r) => r.ev === "create_fail").length, 3);
  assert.equal(alarms.filter((a) => /не создаётся уже 3 раза подряд/.test(a)).length, 1, "одна тревога на третьей неудаче");
  for (const [d, h, mi] of [[12, 15, 0], [13, 12, 0], [14, 12, 0], [15, 10, 0]]) {
    at(d, h, mi, 5);
    assert.equal((await waTick()).created, 0, `${d}.10 ${h}:${mi}: ещё не создаётся`);
  }
  assert.equal(waGroupLink(clock.t, false), null, "сообщества нет: ссылка на сайте постоянная");
  assert.equal(alarms.filter((a) => /не создаётся уже 3 раза подряд/.test(a)).length, 1, "лишних тревог нет");
  // WhatsApp ожил в день эфира в 14:10: сообщество создаётся само на ближайшем тике
  evo.fail = null;
  at(15, 14, 10, 0);
  evo.calls = [];
  assert.equal((await waTick()).created, 1);
  const t = event15(w);
  assert.equal(t.source, "event");
  assert.equal(waGroupLink(clock.t, false), t.link, "ссылка на сайте сразу ведёт в него");
  // 11:30, 12:00, 12:30 и 14:00 уже в прошлом для нового сообщества: их не досылаем
  at(15, 14, 10, 40);
  assert.equal((await waTick()).sent, 0);
  at(15, 15, 0, 5);
  assert.equal((await waTick()).sent, 1);
  assert.deepEqual(mainSends(w).map((x) => x.msg), ["personal"], "серия началась с 15:00");
  // дальше по расписанию
  at(15, 16, 0, 5);
  await waTick();
  assert.deepEqual(mainSends(w).map((x) => x.msg), ["personal", "noface"]);
  at(16, 0, 0, 5);
  await waTick();
  assert.deepEqual([w.state().mode, w.state().event.done], ["daily", true]);
  assert.equal(alarms.some((a) => /так и не было создано/.test(a)), false);
});

test("Задача 1.1: сообщество так и не создалось к концу дня эфира: ничего не уходило, в 00:00 режим закрывается, ссылка постоянная, владельцам одна тревога", async () => {
  const w = bootEvent15({ recruitFrom: "2026-10-12" });
  evo.fail = (c) => (c.path.startsWith("/community/create") ? { status: 400, json: { status: 400, error: "Bad Request", response: { message: ["boom"] } } } : null);
  for (const [d, h, mi] of [[12, 10, 0], [12, 10, 5], [12, 10, 10], [13, 12, 0], [14, 12, 0], [15, 12, 0], [15, 20, 0], [15, 21, 20], [15, 23, 30]]) {
    at(d, h, mi, 5);
    await waTick();
  }
  assert.equal(evo.of("/message/").length, 0, "ни одного сообщения в никуда");
  assert.equal(w.state().targets.length, 0);
  assert.equal(w.state().mode, "event", "до 00:00 режим ещё идёт");
  evo.calls = [];
  at(16, 0, 0, 5);
  await waTick();
  assert.deepEqual([w.state().mode, w.state().event.done, w.state().daily.enabled], ["daily", true, false]);
  assert.equal(waGroupLink(clock.t, false), null);
  assert.equal(eventSchedNow(), null);
  assert.equal(evo.of("/message/").length, 0);
  const lost = alarms.filter((a) => /Прямой эфир 15\.10 прошёл, а сообщество для него так и не было создано/.test(a));
  assert.equal(lost.length, 1, alarms.join(" | "));
  // повторные тики тревогу не повторяют
  at(16, 0, 1, 5);
  await waTick();
  assert.equal(alarms.filter((a) => /так и не было создано/.test(a)).length, 1);
});

test("Задача 1.3: пауза WhatsApp-модуля: стоят создание, серия, одобрение заявок и ручные действия (без запросов к Evolution); ссылка на сайте, завершение прямого эфира и привязка сообщества работают", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  at(9, 10, 0, 0);
  await waTick(); // подключение open
  evo.requests.set(t.jid, [{ jid: "77010000001@s.whatsapp.net", request_time: "1760000001", request_method: "invite_link" }]);
  assert.match(waPause(clock.t).message, /рассылка, создание и одобрение заявок остановлены/);
  at(9, 11, 30, 5);
  evo.calls = [];
  const tick = await waTick();
  assert.deepEqual([tick.skipped, tick.sent, tick.created], ["paused", 0, 0]);
  assert.equal(await joinsTick(), 0);
  assert.equal(evo.calls.length, 0, "на паузе к Evolution не ходим вообще: ни серии, ни заявок, ни проверки подключения");
  at(9, 20, 0, 5);
  assert.equal((await waTick()).created, 0, "создание на 10.10 тоже стоит");
  const manual = await waDailyCreateNow(clock.t);
  assert.deepEqual([manual.ok, /на паузе/.test(manual.message)], [false, true]);
  assert.equal((await waSendSeries("offer", clock.t)).code, "paused");
  assert.equal(evo.calls.length, 0);
  // ссылка на сайте продолжает отдаваться
  assert.equal(waGroupLink(alm(2026, 10, 9, 12, 0), false), t.link);
  // пульт и /wa прямо говорят про паузу
  assert.equal((waPanel(clock.t) as any).module.paused, true);
  assert.match((await ownerSay("/wa"))[0], /WhatsApp-модуль: на паузе \(вручную, из пульта\)/);
  // снятие паузы возвращает всё: заявка одобряется, прогрев идёт
  waResume();
  at(9, 20, 10, 0);
  assert.equal(await joinsTick(), 1);

  // прямой эфир на паузе: дата прошла, режим всё равно закрывается (ссылка на сайте возвращается на постоянную)
  const w2 = bootEvent15({ recruitFrom: "2026-10-12" });
  at(12, 10, 0, 0);
  await waTick();
  assert.ok(event15(w2));
  waPause(clock.t);
  at(16, 0, 0, 5);
  evo.calls = [];
  assert.equal((await waTick()).skipped, "paused");
  assert.deepEqual([w2.state().mode, w2.state().event.done], ["daily", true], "режим закрыт даже на паузе");
  assert.equal(waGroupLink(clock.t, false), null);
});

test("Задача 2: рубильник выключен: WhatsApp не создаёт сообщества, не шлёт серию, не одобряет заявки и не берётся за ручные действия; подключение и ссылка на сайте работают; пауза модуля не тронута; включение возвращает всё как было", async () => {
  const w = boot();
  const t = await createFor(w, 9);
  at(9, 10, 0, 0);
  await waTick();
  evo.requests.set(t.jid, [{ jid: "77010000001@s.whatsapp.net", request_time: "1760000001", request_method: "invite_link" }]);
  // выключили
  tg.reset();
  const off = await switchAutomation(false, "из админки, id 789638302", "перерыв", { now: alm(2026, 10, 9, 10, 1) });
  assert.equal(off.changed, true);
  assert.match(tg.texts(900)[0], /^Автоматизация выключена\. Кем: из админки, id 789638302\. Когда: 09\.10 в 10:01\. Причина: перерыв\./);
  assert.deepEqual(tg.texts(901), tg.texts(900), "оба владельца получили уведомление");
  assert.equal(w.state().paused, false, "пауза модуля рубильником не трогается");
  assert.equal(JSON.parse(readFileSync(join(w.dir, "automation-state.json"), "utf8")).on, false, "состояние на диске");
  // тик: подключение проверяем (от него зависят ассистент и дожим), остального нет
  at(9, 11, 30, 5);
  evo.calls = [];
  const r = await waTick();
  assert.deepEqual([r.skipped, r.sent, r.created], ["automation", 0, 0]);
  assert.equal(evo.seq()[0], "GET /instance/connectionState");
  assert.ok(evo.calls.every((c) => c.path.startsWith("/instance/")), "только проверка подключения: " + evo.seq().join(", "));
  // состояние подключения живое и при выключенном рубильнике
  evo.state = "close";
  at(9, 11, 31, 5);
  await waTick();
  assert.equal(w.rt().conn.state, "close");
  evo.state = "open";
  at(9, 11, 32, 5);
  await waTick();
  assert.equal(w.rt().conn.state, "open");
  // заявки не одобряются, создание на 10.10 не идёт
  evo.calls = [];
  assert.equal(await joinsTick(), 0);
  assert.equal(evo.of("/community/requests").length, 0);
  at(9, 20, 0, 5);
  evo.calls = [];
  assert.equal((await waTick()).created, 0);
  assert.equal(creates(), 0, "новых сообществ нет");
  // ручные действия закрыты и объясняют почему
  const man = await waDailyCreateNow(clock.t);
  assert.deepEqual([man.ok, /Автоматизация выключена/.test(man.message)], [false, true]);
  assert.equal((await waSendSeries("offer", clock.t)).code, "automation_off");
  assert.match((await ownerSay("/wa_send offer"))[0], /Автоматизация выключена/);
  assert.match((await ownerSay("/wa_new"))[0], /Автоматизация выключена/);
  assert.equal(evo.of("/message/").length, 0);
  // ссылка на сайте и пульт
  assert.equal(waGroupLink(alm(2026, 10, 9, 12, 0), false), t.link);
  const p = waPanel(clock.t) as any;
  assert.deepEqual([p.module.paused, p.module.halted, p.automation.on], [false, true, false]);
  assert.match(p.automation.sinceText, /^Выключена с 09\.10 в 10:01, из админки, id 789638302\. Причина: перерыв\.$/);
  assert.match((await ownerSay("/wa"))[0], /^Автоматизация ВЫКЛЮЧЕНА с 09\.10 в 10:01/);
  assert.ok(p.journal.some((j: any) => /^Автоматизация выключена \(из админки, id 789638302\): перерыв/.test(j.text)));
  // включили: серия и заявки идут дальше, пропущенное старше 45 минут не досылается
  tg.reset();
  const on = await switchAutomation(true, "командой /auto_on", "", { now: alm(2026, 10, 9, 20, 5) });
  assert.equal(on.changed, true);
  assert.match(tg.texts(900)[0], /^Автоматизация включена\. Кем: командой \/auto_on\. Когда: 09\.10 в 20:05\./);
  assert.doesNotMatch(tg.texts(900)[0], /остаётся на паузе/);
  at(9, 20, 10, 0);
  assert.equal(await joinsTick(), 1, "заявка одобрена");
  assert.ok(w.journal().some((j) => j.ev === "auto_on"));

  // WhatsApp на паузе по сбою: после включения остаётся на паузе с прежней причиной
  const w2 = boot();
  await createFor(w2, 9);
  w2.rt().state.paused = true;
  w2.rt().state.pausedReason = "создание 2026-10-10: 502";
  w2.rt().state.pausedAt = clock.t;
  setAutomation(false, "тест", "", clock.t);
  tg.reset();
  setAutomation(true, "тест", "", clock.t);
  assert.deepEqual([w2.rt().state.paused, w2.rt().state.pausedReason], [true, "создание 2026-10-10: 502"]);
  assert.equal((await waTick()).skipped, "paused");
  await switchAutomation(false, "тест", "", { now: clock.t });
  tg.reset();
  await switchAutomation(true, "тест", "", { now: clock.t });
  assert.match(tg.texts(900)[0], /WhatsApp-модуль остаётся на паузе: создание 2026-10-10: 502\. Снять: \/wa_resume\./);
  assert.match((await ownerSay("/auto"))[0], /WhatsApp-модуль отдельно стоит на паузе: создание 2026-10-10: 502/);
});

test("Задача 2: ИИ-ассистент в личке WhatsApp рубильнику не подчиняется, а паузе модуля подчиняется", async () => {
  const w = boot();
  await createFor(w, 9);
  at(9, 10, 0, 0);
  await waTick();
  process.env.OPENAI_API_KEY = "test-openai-key-panel-only";
  process.env.PORT = process.env.PORT || "4010";
  try {
    assert.equal((await aiSetEnabled(true)).ok, true);
    const reason = () => String((aiPanel(clock.t) as any).reason);
    setAutomation(false, "тест", "", clock.t);
    assert.doesNotMatch(reason(), /Сейчас не отвечает|рубильник|Автоматизация|пауз/i, "рубильник ассистента не останавливает: " + reason());
    setAutomation(true, "тест", "", clock.t);
    waPause(clock.t);
    assert.match(reason(), /Сейчас не отвечает: модуль на паузе/, "пауза модуля его останавливает");
    waResume();
    assert.doesNotMatch(reason(), /Сейчас не отвечает/);
    await aiSetEnabled(false);
  } finally {
    delete process.env.OPENAI_API_KEY;
  }
});

test("Задача 3: план прямого эфира считается из настроек и серии одной лентой; на паузе при выключенном рубильнике и при паузе модуля; Telegram в плане", async () => {
  const w = bootEvent15({ start: "20:30", recruitFrom: "2026-10-12" });
  const plan = () => (waPanel(clock.t) as any).event.plan;
  const ribbon = "Сообщество создастся: 12.10 в 10:00 · Набор: 12.10–15.10, ссылка на сайте ведёт в это сообщество · Рассылки: только 15.10, первая в 12:00 · Эфир: 15.10 в 20:30 · Закрытие: 16.10 в 00:00";
  assert.equal(plan().line, ribbon);
  assert.deepEqual(plan().items.map((i: any) => [i.key, i.state]), [["create", "next"], ["recruit", "next"], ["mail", "next"], ["live", "next"], ["close", "next"]]);
  assert.equal(plan().paused, false);
  assert.match(plan().telegram, /Telegram: всем записавшимся назначен день эфира 15\.10, серия идёт только в него, со сдвигом под старт 20:30\./);
  assert.match((await ownerSay("/wa"))[0], new RegExp(`План: ${ribbon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n`));
  // сообщество создано: первая строка про факт, набор идёт
  at(12, 10, 0, 0);
  await waTick();
  assert.equal(plan().items[0].text, "Сообщество создано: 12.10 в 10:00");
  assert.deepEqual(plan().items.slice(0, 2).map((i: any) => i.state), ["done", "now"]);
  // время создания и сообщения берутся из серии, а не пишутся руками: старт 20:00 даёт 11:30
  const w2 = bootEvent15({ recruitFrom: "2026-10-13" });
  assert.match(plan().line, /Сообщество создастся: 13\.10 в 10:00 · Набор: 13\.10–15\.10, .* первая в 11:30 · Эфир: 15\.10 в 20:00 · /);
  void w2;
  // рубильник выключен: план сообщает, что рассылки не уйдут
  setAutomation(false, "тест", "", clock.t);
  assert.deepEqual([plan().paused, plan().pausedText], [true, "на паузе: рассылки не уйдут"]);
  assert.match(plan().pausedWhy, /^Автоматизация выключена/);
  assert.match((await ownerSay("/wa"))[0], /\(на паузе: рассылки не уйдут\)/);
  setAutomation(true, "тест", "", clock.t);
  assert.equal(plan().paused, false);
  waPause(clock.t);
  assert.deepEqual([plan().paused, plan().pausedText], [true, "на паузе: рассылки не уйдут"]);
  assert.match(plan().pausedWhy, /WhatsApp-модуль на паузе: вручную, из пульта/);
  waResume();
  // режим не прямой эфир, дата не задана или эфир завершён: плана нет
  waSetMode("daily");
  assert.equal(plan(), null);
  waSetMode("event");
  void w;
});

test("Задача 3: «Запустить рассылки сейчас»: по умолчанию серия ждёт дня эфира; после запуска идёт в сообщество каждый день по расписанию до эфира, у каждого дня свои метки; повтор и рестарт не дублируют; Telegram не меняется", async () => {
  const w = bootEvent15({ recruitFrom: "2026-10-12" });
  const ev = () => (waPanel(clock.t) as any).event;
  // условия: режим, дата, сообщество
  waSetMode("daily");
  assert.equal(waEventLaunch(clock.t).code, "wrong_mode");
  waSetMode("event");
  at(12, 9, 0, 0);
  assert.deepEqual([waEventLaunch(clock.t).code, ev().canLaunch], ["no_community", false]);
  at(12, 10, 0, 0);
  await waTick();
  at(13, 11, 30, 5);
  assert.equal((await waTick()).sent, 0, "по умолчанию серия ждёт дня эфира");
  assert.equal(ev().canLaunch, true);
  // рубильник выключен или модуль на паузе: запуск не принимается
  setAutomation(false, "тест", "", clock.t);
  assert.equal(waEventLaunch(clock.t).code, "automation_off");
  setAutomation(true, "тест", "", clock.t);
  waPause(clock.t);
  assert.equal(waEventLaunch(clock.t).code, "paused");
  waResume();
  assert.equal(w.state().event.launchedAt, undefined);
  // запуск 13.10 в 15:10
  at(13, 15, 10, 0);
  const go = waEventLaunch(clock.t);
  assert.deepEqual([go.ok, go.code], [true, "launched"]);
  assert.match(go.message, /Рассылки запущены досрочно\. Серия идёт в сообщество каждый день по расписанию до эфира 15\.10, но в дни до эфира уходят только прогревающие сообщения: без ссылки на эфир и оффера, они придут в день эфира\. Ближайшее сообщение: 13\.10 в 16:00\. Telegram по-прежнему шлёт серию только в день эфира\./);
  assert.equal(w.state().event.launchedAt, clock.t);
  assert.ok(w.journal().some((j) => j.ev === "event_launch" && j.date === D15));
  assert.deepEqual([ev().launched, ev().canLaunch, ev().launchedText], [true, false, "13.10 в 15:10"]);
  assert.equal(waEventLaunch(clock.t).code, "same");
  assert.match(ev().plan.line, /Рассылки: запущены досрочно 13\.10 в 15:10, дальше каждый день только прогрев, без ссылки на эфир и оффера, эфир 15\.10/);
  const nm = (waPanel(clock.t) as any).nextMessage;
  assert.deepEqual([nm.id, nm.at, nm.dayLabel], ["noface", "16:00", "13.10"]);
  // 15:00 уже было до запуска: не досылается; 16:00 уходит
  at(13, 15, 10, 30);
  assert.equal((await waTick()).sent, 0);
  at(13, 16, 0, 5);
  assert.equal((await waTick()).sent, 1);
  const first = mainSends(w);
  assert.deepEqual(first.map((x) => [x.msg, x.day, x.target]), [["noface", "2026-10-13", "2026-10-15#1"]], "метки отправки у виртуального дня свои");
  // 14.10 утреннее уходит один раз, повторный тик ничего не добавляет
  at(14, 11, 30, 5);
  assert.equal((await waTick()).sent, 1);
  at(14, 11, 30, 40);
  assert.equal((await waTick()).sent, 0);
  // после рестарта метки восстанавливаются из журнала, запуск помнится, повтора нет
  const dir = w.dir;
  resetWaGroups();
  initWaGroups({ dir, seriesFile: join(dir, "wa-series.json"), deps: deps() });
  assert.equal(_waRt()!.state.event.launchedAt, alm(2026, 10, 13, 15, 10));
  at(14, 11, 31, 10);
  assert.equal((await waTick()).sent, 0, "после рестарта 11:30 второй раз не уходит");
  // день эфира: своя лента с метками дня эфира, утреннее уходит и тут
  at(15, 11, 30, 5);
  assert.equal((await waTick()).sent, 1);
  const ids = mainSends(w).map((x) => `${x.msg}@${x.day}`);
  assert.deepEqual(ids, ["noface@2026-10-13", "morning@2026-10-14", "morning@2026-10-15"]);
  // «+1 день» в сообщество прямого эфира по-прежнему не идёт
  at(16, 10, 30, 5);
  evo.calls = [];
  await waTick();
  assert.equal(evo.of("/message/").length, 0);
  // сброс эфира забывает запуск
  const w3 = bootEvent15();
  at(12, 10, 0, 0);
  await waTick();
  at(13, 12, 0, 0);
  assert.equal(waEventLaunch(clock.t).code, "launched");
  assert.equal(waEventReset().ok, true);
  assert.equal(w3.state().event.launchedAt, undefined);
  assert.equal(eventSchedNow(), null);
});

test("Задача 1.2 и 3: Telegram следует за режимом WhatsApp: записавшийся в набор получает день эфира, серия Telegram только 15.10 со сдвигом, досрочный запуск WhatsApp Telegram не меняет; сброс эфира возвращает ежедневную запись", async () => {
  const w = bootEvent15({ start: "20:30", recruitFrom: "2026-10-12" });
  getStore().setSeriesEnabled(true);
  const ids: string[] = [];
  const run = async (t: number) => {
    clock.t = t;
    return tgTick(t, { now: () => t, send: async (s, m, day) => (ids.push(`${m.id}:${day}:${s.chatId}`), { ok: true }) });
  };
  at(12, 10, 0, 0);
  await waTick(); // сообщество создано
  assert.deepEqual(eventSchedNow(), { date: D15, start: "20:30", since: alm(2026, 10, 8, 12, 0) });
  // человек записывается в Telegram посреди набора
  tg.reset();
  await processUpdate(upd(5001, "/start"), alm(2026, 10, 12, 14, 0));
  assert.equal(getStore().subs.get(5001)!.streamDay, D15);
  assert.match(tg.calls.map((c) => String(c.body.caption ?? c.body.text ?? "")).join("\n"), /15 октября в 20:30 по Алматы/);
  // досрочный запуск WhatsApp: Telegram не трогает
  at(13, 15, 10, 0);
  assert.equal(waEventLaunch(clock.t).code, "launched");
  // дни до эфира: ни одного сообщения Telegram (ни 15:00, ни 19:50, ни живого)
  for (const [d, h, mi] of [[12, 15, 0], [12, 19, 50], [12, 20, 0], [13, 11, 30], [13, 15, 0], [13, 19, 50], [14, 11, 30], [14, 19, 50]]) await run(alm(2026, 10, d, h, mi, 5));
  assert.deepEqual(ids, []);
  // день эфира: сдвиг 30 минут (утреннее 11:30 -> 12:00)
  await run(alm(2026, 10, 15, 11, 59, 5));
  assert.deepEqual(ids, []);
  await run(alm(2026, 10, 15, 12, 0, 5));
  assert.deepEqual(ids, [`morning-1130:${D15}:5001`]);
  // сброс эфира: ежедневная запись возвращается (в 21:00 по обычным правилам уже следующий день, а не день эфира)
  at(15, 21, 0, 0);
  await processUpdate(upd(5002, "/start"), clock.t);
  assert.equal(getStore().subs.get(5002)!.streamDay, D15, "эфир ещё активен: окно «зайти» до 21:10");
  assert.equal(waEventReset().ok, true);
  await processUpdate(upd(5003, "/start"), clock.t);
  assert.equal(getStore().subs.get(5003)!.streamDay, "2026-10-16", "прямого эфира нет: обычное правило");
  void w;
});

test("server.ts: health.automation, маршрут рубильника закрыт без входа; рубильник из файла останавливает WhatsApp; /calendar знает старт прямого эфира", async () => {
  const dir = tmp();
  const bundle = join(dir, "server.js");
  buildBundle("form-api/server.ts", bundle);
  writeFileSync(join(dir, "tg-series.json"), readFileSync(TG_SERIES));
  writeFileSync(join(dir, "wa-series.json"), readFileSync(WA_SERIES));
  const data = join(dir, "data");
  mkdirSync(data, { recursive: true });
  const today = dayKeyOf(Date.now());
  const date = addDays(today, 3);
  writeFileSync(join(data, "automation-state.json"), JSON.stringify({ v: 1, on: false, offAt: Date.now(), offBy: "тест", offReason: "проверка", onAt: 0, onBy: "" }));
  writeFileSync(join(data, "wa-state.json"), JSON.stringify({ v: 1, mode: "event", daily: { enabled: false }, event: { date, start: "20:30", recruitFrom: today }, targets: [] }));
  const run = async (port: number, extra: Record<string, string | undefined>) => {
    const child = spawn(process.execPath, [bundle], {
      env: childEnv({
        FORM_API_ENV: join(dir, "нет.env"), TG_SERIES_FILE: undefined, ADMIN_APP_HTML: undefined, WA_SERIES_FILE: undefined, TG_BOT: undefined,
        WHATSAPP_LINK_PATH: join(dir, "нет-ссылки.json"), TG_WORKSHOP_BOT_TOKEN: process.env.TG_WORKSHOP_BOT_TOKEN,
        TG_WORKSHOP_WEBHOOK_SECRET: "srv-hook-secret-123456", TG_GO_SECRET: "srv-go-secret-1234567", TG_LINK_OWNER_IDS: "900",
        ADMIN_APP_IDS: "789638302", ADMIN_APP_PIN: "4821", ADMIN_APP_SECRET: "srv-session-secret-0123456789",
        WA_GROUPS: "on", EVOLUTION_API_KEY: EVO_KEY, EVOLUTION_URL: process.env.EVOLUTION_URL, PORT: String(port), DATA_DIR: data, ...extra,
      }),
      stdio: ["ignore", "pipe", "pipe"],
    });
    let log = "";
    child.stdout.on("data", (d) => (log += d));
    child.stderr.on("data", (d) => (log += d));
    await waitFor(() => /listening on/.test(log), 20_000);
    return { child, log: () => log };
  };
  const s = await run(4116, {});
  try {
    const base = "http://127.0.0.1:4116";
    const health = (await (await fetch(`${base}/api/health`)).json()) as any;
    assert.equal(health.automation, "off", "рубильник из файла");
    assert.equal(health.ok, true);
    // маршрут рубильника без входа в админку закрыт (и GET, и POST)
    assert.equal((await fetch(`${base}/api/admin/automation`)).status, 403);
    assert.equal((await fetch(`${base}/api/admin/automation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ on: true, confirm: true }) })).status, 403);
    assert.equal(JSON.parse(readFileSync(join(data, "automation-state.json"), "utf8")).on, false, "чужой запрос состояние не изменил");
    // календарь: пока идёт набор, зовёт на день эфира и его время 20:30
    const cal = await fetch(`${base}/calendar`, { redirect: "manual" });
    assert.equal(cal.status, 302);
    const ymd = date.replace(/-/g, "");
    assert.match(String(cal.headers.get("location")), new RegExp(`dates=${ymd}T203000%2F${ymd}T223000`));
    assert.match(decodeURIComponent(String(cal.headers.get("location"))).replace(/\+/g, " "), /Старт в 20:30 по Алматы/);
    // WhatsApp при выключенном рубильнике после первого тика (5 секунд) только проверил подключение
    await waitFor(() => evo.of("/instance/connectionState").length >= 1, 20_000);
    await new Promise((r) => setTimeout(r, 500));
    assert.equal(evo.of("/community/create").length, 0, "сообщество не создаётся");
    assert.equal(evo.of("/message/").length, 0);
    assert.equal(s.log().includes(EVO_KEY), false);
  } finally {
    s.child.kill();
    await new Promise((r) => s.child.on("close", r));
  }
  // рубильник включён (файла нет): в health on
  rmSync(join(data, "automation-state.json"));
  const s2 = await run(4117, {});
  try {
    assert.equal(((await (await fetch("http://127.0.0.1:4117/api/health")).json()) as any).automation, "on");
  } finally {
    s2.child.kill();
    await new Promise((r) => s2.child.on("close", r));
  }
});

test("Задача 1.1: неясный ответ WhatsApp при создании (5xx): сообщество само повторно не создаётся, владельцам тревога; кнопка и тик ждут снятия ожидания; после /wa_resume сообщество создаётся", async () => {
  const w = bootEvent15({ recruitFrom: "2026-10-12" });
  evo.fail = (c) => (c.path.startsWith("/community/create") ? { status: 500 } : null);
  at(12, 10, 0, 0);
  assert.equal((await waTick()).created, 0);
  assert.equal(creates(), 1);
  assert.ok(w.state().pendingCreate, "создание без чёткого ответа ждёт человека");
  assert.equal(alarms.filter((a) => /не пришёл чёткий ответ/.test(a)).length, 1);
  // вслепую не повторяем: ни следующие тики, ни кнопка
  for (const [d, h, mi] of [[12, 10, 30], [13, 12, 0], [15, 11, 0]]) {
    at(d, h, mi, 5);
    await waTick();
  }
  assert.equal(creates(), 1, "второго запроса на создание нет");
  assert.equal((await waEventCreateNow(clock.t)).code, "pending");
  // человек проверил телефон (лишнего сообщества нет) и снял ожидание: следующий тик создаёт
  evo.fail = null;
  assert.match(waResume().message, /Неподтверждённое создание снято с учёта/);
  at(15, 11, 1, 5);
  assert.equal((await waTick()).created, 1);
  assert.equal(creates(), 2);
  assert.equal(event15(w).source, "event");
});

test("Задача 3 (деньги): после «Запустить рассылки сейчас» в дни до эфира уходит только прогрев: без ссылки на эфир, самого эфира, оффера и дожима; в день эфира всё как в плане", async () => {
  const w = bootEvent15({ recruitFrom: "2026-10-12" });
  at(12, 10, 0, 0);
  await waTick();
  at(13, 8, 0, 0);
  const go = waEventLaunch(clock.t);
  assert.equal(go.code, "launched");
  assert.match(go.message, /но в дни до эфира уходят только прогревающие сообщения: без ссылки на эфир и оффера, они придут в день эфира\. Ближайшее сообщение: 13\.10 в 11:30\./);
  const r = w.rt();
  const day0 = r.cfg.messages.filter((m) => !m.dayOffset && m.enabled !== false);
  // 13.10: тик в плановое время каждого сообщения дня
  const runDay = async (d: number) => {
    for (const m of day0) {
      clock.t = _internals.planOf(r, { day: `2026-10-${d}`, start: undefined }, m) + 5000;
      await waTick();
    }
  };
  await runDay(13);
  const sent13 = mainSends(w).filter((x) => x.day === "2026-10-13").map((x) => x.msg);
  assert.deepEqual(sent13, ["morning", "reel-119k", "reg-bonus", "warm-edits", "personal", "noface", "numbers", "video-ai", "live-bonus", "t-minus-30"]);
  for (const id of ["t-minus-10", "live-now", "live-10", "last-link", "training", "offer", "push", "last-call"]) assert.equal(sent13.includes(id), false, `${id} не уходит до дня эфира`);
  // пульт: после последнего прогрева 13.10 ближайшее сообщение это утреннее следующего дня, а не вечерняя ссылка
  at(13, 19, 35, 0);
  const nm = (waPanel(clock.t) as any).nextMessage;
  assert.deepEqual([nm.id, nm.dayLabel, nm.at], ["morning", "14.10", "11:30"]);
  // 14.10 то же самое, не больше
  await runDay(14);
  assert.equal(mainSends(w).filter((x) => x.day === "2026-10-14").length, 10);
  assert.equal(mainSends(w).some((x) => x.day === "2026-10-14" && ["t-minus-10", "live-now", "offer"].includes(x.msg)), false);
  // день эфира: полная лента, в том числе ссылка и оффер
  await runDay(15);
  const sent15 = mainSends(w).filter((x) => x.day === D15).map((x) => x.msg);
  assert.equal(sent15.length, day0.length);
  for (const id of ["t-minus-10", "live-now", "offer", "last-call"]) assert.ok(sent15.includes(id), `${id} уходит в день эфира`);
  // тексты плана
  assert.match((waPanel(clock.t) as any).event.plan.line, /Рассылки: запущены досрочно 13\.10 в 08:00, дальше каждый день только прогрев, без ссылки на эфир и оффера, эфир 15\.10/);
});

test("Задача 3: savedAt: когда сохранили прямой эфир, помнится между перезапусками и не сдвигается повторным сохранением, пока эфир не завершён; Telegram получает его как since", async () => {
  const w = bootEvent15({ recruitFrom: "2026-10-12" });
  const saved = clock.t; // bootEvent15: 8 октября 12:00
  assert.equal(w.state().event.savedAt, saved);
  assert.deepEqual(eventSchedNow(), { date: D15, start: "20:00", since: saved });
  // повторное сохранение до создания сообщества (поправили набор): первое время остаётся
  at(9, 15, 0, 0);
  assert.equal(waSetEvent({ date: D15, start: "20:30", recruitFrom: "2026-10-13" }).ok, true);
  assert.equal(w.state().event.savedAt, saved);
  assert.deepEqual(eventSchedNow(), { date: D15, start: "20:30", since: saved });
  // перезапуск
  const dir = w.dir;
  resetWaGroups();
  initWaGroups({ dir, seriesFile: join(dir, "wa-series.json"), deps: deps() });
  assert.equal(_waRt()!.state.event.savedAt, saved);
  // сброс и новый эфир: время новое
  assert.equal(waEventReset().ok, true);
  assert.equal(eventSchedNow(), null);
  at(9, 16, 0, 0);
  assert.equal(waSetEvent({ date: "2026-10-16", start: "20:00", recruitFrom: "2026-10-14" }).ok, true);
  assert.equal(_waRt()!.state.event.savedAt, clock.t);
});
