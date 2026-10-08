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
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assignStreamDay, dayKeyOf, setUtcOffsetMinutes } from "./tg-time";
import { EVO_KEY, evo, INSTANCE_TOKEN, OWNER_JID, PNG_B64, runWaPage, tg } from "./wa-testkit";
import { dayReportText, getStore, HELP_TEXT, initTgWorkshop, notifyOwners, parseTyBody, processUpdate, registerWa, registerWaReport } from "./tg-workshop";
import {
  _internals, _waRt, adminNumbers, extractMembers, initWaGroups, joinsTick, normalizeRequests, resetWaGroups, startWaGroups,
  validateWaSeries, waCommand, waConnection, waEventCreateNow, waEventReset, waGroupLink, waGroups, waHealth, waLogout, waPanel, waPause,
  waQr, waReportLine, waResume, waSendSeries, waSetDaily, waSetEvent, waSetMode, waTick, type Kind,
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
const tmp = () => mkdtempSync(join(tmpdir(), "wa-test-"));
/** Момент по часам Алматы (UTC+5). */
const alm = (y: number, m: number, d: number, h: number, mi = 0, s = 0) => Date.UTC(y, m - 1, d, h - 5, mi, s);
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

type BootOpts = { kind?: Kind; edit?: (s: any) => void; tgEdit?: (s: any) => void; state?: Record<string, unknown>; daily?: boolean };
/**
 * Свежие данные, серия бота (время эфира и вызов команд) и модуль. Команды подключены как в startWaGroups.
 * После первого включения модуль стоит в ежедневном режиме с выключенным созданием; прежние тесты проверяют ежедневное
 * создание, поэтому по умолчанию его включаем (daily: false оставляет как есть, state добавляет поля в wa-state.json).
 */
function boot(o: BootOpts = {}) {
  const dir = tmp();
  writeFileSync(join(dir, "wa-state.json"), JSON.stringify({ v: 1, mode: "daily", daily: { enabled: o.daily !== false }, ...(o.state || {}) }));
  const series = JSON.parse(readFileSync(WA_SERIES, "utf8"));
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
  assert.equal(s.messages.length, 14);
  assert.equal(s.messages.length, chain.whatsapp.length);
  chain.whatsapp.forEach((c: any, i: number) => {
    const m = s.messages[i];
    assert.equal(m.at, c.at, `время ${c.at}`);
    assert.equal(m.text, c.text, `текст ${c.at}`);
    if (c.media) assert.equal(m.media?.url, `https://onai.academy/workshop-montazh/assets/tg/${c.media}`, `картинка ${c.at}`);
    else assert.equal(m.media, undefined, `без картинки ${c.at}`);
  });
  // опрос только у утреннего сообщения: варианты из chain-v2
  assert.deepEqual(s.messages.filter((m) => m.poll).map((m) => m.id), ["morning"]);
  assert.deepEqual(s.messages[0].poll?.options, ["Буду", "Постараюсь", "Не успеваю"]);
  assert.equal(s.messages[0].poll?.name, "Придёшь сегодня на эфир?");
  // время по возрастанию, все подписи влезают в лимит
  assert.deepEqual(s.messages.map((m) => m.at), [...s.messages.map((m) => m.at)].sort());
  for (const m of s.messages) assert.ok(m.text.length <= s.captionLimit, `${m.id}: подпись до ${s.captionLimit}`);
});

test("wa-series.json: файлы картинок и аватарок лежат в репозитории; аватарка квадратная", () => {
  const s = JSON.parse(readFileSync(WA_SERIES, "utf8"));
  const local = (u: string) => join(REPO, "workshop-montazh", "assets", "tg", u.split("/").pop() as string);
  for (const m of s.messages) if (m.media) assert.ok(existsSync(local(m.media.url)), m.media.url);
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
  // порядок: подключение, номер, создание, три настройки, ссылка, аватарка, приветствие
  assert.deepEqual(evo.seq(), [
    "GET /instance/connectionState", "POST /community/create",
    "POST /community/updateSetting", "POST /community/memberAddMode", "POST /community/joinApprovalMode",
    "GET /community/inviteCode", "POST /group/updateGroupPicture", "POST /message/sendText",
  ]);
  const jid = w.state().targets[0].jid;
  assert.deepEqual(evo.of("/community/updateSetting")[0].body, { action: "announcement" });
  assert.equal(evo.of("/community/updateSetting")[0].query.get("communityJid"), jid);
  assert.deepEqual(evo.of("/community/memberAddMode")[0].body, { mode: "admin_add" });
  assert.deepEqual(evo.of("/community/joinApprovalMode")[0].body, { mode: "on" });
  const pic = evo.of("/group/updateGroupPicture")[0].body;
  assert.deepEqual(pic, { groupJid: jid, image: "https://onai.academy/workshop-montazh/assets/tg/wa-avatar.jpg" });
  // приветствие уходит во вкладку объявлений, а не в само сообщество
  const welcome = evo.of("/message/sendText")[0].body;
  assert.equal(welcome.number, w.state().targets[0].sendJid);
  assert.notEqual(welcome.number, jid);
  assert.match(welcome.text, /Эфир завтра в 20:00 по Алматы/);
  assert.equal(welcome.text.includes(String.fromCharCode(0x2014)), false);
  // паузы между шагами в заданных границах, перед первым шагом паузы нет
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

test("создание: не создаёт посреди дня при включении модуля, догоняет после перезапуска в пределах 6 часов", async () => {
  const w = boot();
  at(8, 15, 0, 0);
  await waTick();
  assert.equal(evo.of("/community/create").length, 0, "в 15:00 включение не создаёт сообщество на сегодня");
  at(8, 23, 30, 0); // сервис был недоступен с 20:00
  assert.equal((await waTick()).created, 1);
  assert.equal(w.state().targets[0].day, "2026-10-09");
  boot();
  at(9, 2, 30, 0); // окно догонки 20:00 + 6 часов уже закрыто
  await waTick();
  assert.equal(evo.of("/community/create").length, 1, "после 02:00 не создаёт");
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
  evo.fail = (c) => (c.path.startsWith("/community/memberAddMode") ? { status: 400 } : null);
  at(7, 20, 0, 0);
  const r = await waTick();
  assert.equal(r.created, 1);
  const t = w.state().targets[0];
  assert.equal(t.done.announce, true);
  assert.equal(t.done.addMode, undefined);
  assert.equal(t.link, "");
  assert.equal(waGroupLink(alm(2026, 10, 7, 21, 0)), null);
  // починили: через время ожидания (бэкофф 60 с) тик достраивает остальное
  evo.fail = null;
  at(7, 20, 1, 5);
  await waTick();
  const t2 = w.state().targets[0];
  assert.equal(!!t2.done.addMode && !!t2.done.approval && !!t2.done.link, true);
  assert.equal(waGroupLink(alm(2026, 10, 7, 21, 0)), t2.link);
  assert.equal(w.state().failStreak, 0);
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
  assert.equal(media.media, "https://onai.academy/workshop-montazh/assets/tg/cover-bizon.jpg");
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
  // следующее по расписанию
  at(9, 12, 30, 10);
  await waTick();
  const m2 = evo.of("/message/sendMedia")[1].body;
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
  const w = boot({ edit: (s) => (s.messages[1].text = "Длинный текст. ".repeat(80)) });
  const t = await createFor(w, 9);
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
  assert.match(evo.of("/message/sendText")[0].body.text, /Как я правлю монтаж/);
  const row = w2.journal().find((x) => x.msg === "warm-edits" && x.ok);
  assert.equal(row.fallback, "text");
  assert.equal(alarms.filter((a) => a.includes("Не отправилась картинка")).length, 1);
  assert.equal(w2.state().failStreak, 0, "текстовая замена спасла отправку: ошибки нет");
  void t;
});

// ───────────────────────── ошибки, пауза, подключение ─────────────────────────

test("три ошибки подряд: повтор с паузой, потом пауза модуля и тревога; на паузе запросов к Evolution нет; /wa_resume возвращает", async () => {
  const w = boot();
  await createFor(w, 9);
  evo.fail = (c) => (c.path.startsWith("/message/") ? { status: 500 } : null);
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
  evo.fail = (c) => (c.path.startsWith("/message/") && failures-- > 0 ? { status: 500 } : null);
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

test("создание без чёткого ответа: пауза и тревога, вслепую не повторяем; 4xx это обычная ошибка с повтором", async () => {
  const w = boot();
  evo.fail = (c) => (c.path.startsWith("/community/create") ? { status: 500 } : null);
  at(8, 20, 0, 0);
  await waTick();
  assert.equal(w.state().paused, true);
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

  // 400: сообщество не создано, счётчик ошибок 1, повтор через минуту
  const w2 = boot();
  evo.fail = (c) => (c.path.startsWith("/community/create") ? { status: 400 } : null);
  at(8, 20, 0, 0);
  await waTick();
  assert.equal(w2.state().paused, false);
  assert.equal(w2.state().failStreak, 1);
  assert.equal(w2.state().pendingCreate, null);
  evo.fail = null;
  at(8, 20, 1, 5);
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
  assert.equal(waReportLine("2026-10-09"), `WhatsApp: вступили по заявкам 2, сообщений серии ушло 0 из ${14}.`);
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
    clock.t += 31_000;
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
  assert.match(m.caption, /Для участников эфира: обучение Vibe Production за 150 000/);
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
  assert.equal((waHealth() as any).error, "нет EVOLUTION_API_KEY");
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
  assert.match((waHealth() as any).error, /Asia\/Almaty/);
  const stop = startWaGroups({ dir, seriesFile: WA_SERIES, deps: deps() });
  assert.ok(_waRt());
  assert.deepEqual({ ...waHealth() }, { enabled: true, running: true, paused: false, connection: "unknown", targets: 0, failStreak: 0 });
  stop();
  delete process.env.WA_GROUPS;
});

test("защита номера: тревога и журнал не содержат ключей, в состоянии и журналах нет токенов; ни одного сообщения людям", async () => {
  const w = boot();
  await createFor(w, 9);
  evo.fail = (c) => (c.path.startsWith("/message/") ? { status: 500, json: { status: 500, error: "x", response: { message: [`ключ ${EVO_KEY} в тексте`] } } } : null);
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
  at(9, 20, 0, 0);
  assert.equal((await waTick()).created, 0, "выключено: на 10 октября не создаём");
  assert.equal(evo.of("/community/create").length, 1);
  assert.ok(waGroupLink(alm(2026, 10, 9, 12, 0)), "созданное сообщество продолжает отдавать ссылку");
  at(9, 11, 30, 5);
  assert.equal((await waTick()).sent, 1, "и прогрев идёт");
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
  assert.deepEqual(_waRt()!.state.event, { date: EVENT_DAY, start: "20:00", recruitFrom: "2026-10-09" });
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
  at(12, 21, 20, 5);
  evo.calls = [];
  await waTick();
  assert.match(evo.of("/message/sendMedia")[0].body.caption, /Для участников эфира: обучение Vibe Production/);
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
    "POST /community/updateSetting", "POST /community/memberAddMode", "POST /community/joinApprovalMode",
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
  assert.equal(planOf("offer"), "20:20");
  assert.equal(planOf("push"), "22:30", "дожим привязан к 23:59, а не к старту");
  assert.equal(planOf("last-call"), "23:30");
  const txt = _internals.retime(r, "19:00", rawMsgs["morning"].text);
  assert.match(txt, /Сегодня в 19:00 по Алматы \(17:00 по Москве\)/);
  assert.equal(txt.includes("20:00"), false);
  assert.equal(_internals.retime(r, "20:00", rawMsgs["morning"].text), rawMsgs["morning"].text, "обычный старт ничего не меняет");
  assert.equal(_internals.retime(r, "19:00", rawMsgs["offer"].text).includes("до 23:59 по Алматы (21:59 по Москве)"), true, "дедлайн оффера не трогаем");

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
  assert.match(evo.of("/message/sendMedia")[0].body.caption, /в 19:00 по Алматы \(17:00 по Москве\)/);
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
  assert.equal(p.series.length, 14);
  assert.deepEqual([p.series[0].id, p.series[0].at, p.series[0].media, p.series[0].poll], ["morning", "11:30", "image", "Придёшь сегодня на эфир?"]);
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
  assert.equal(p.journal[0].text, "Пауза: вручную, из пульта", "самое свежее сверху");
  evo.fail = null;
  assert.equal(waResume().ok, true);
  const p2 = waPanel(clock.t) as any;
  assert.deepEqual([p2.module.paused, p2.module.failStreak], [false, 0]);
  assert.equal(p2.journal[0].text, "Пауза снята");
  // отправки в журнале называются темой сообщения
  at(9, 12, 30, 5);
  await waTick();
  const j3 = (waPanel(clock.t) as any).journal as any[];
  assert.ok(j3.some((x) => x.kind === "ok" && /^Отправлено «Бонусы за регистрацию»/.test(x.text)));
});

test("пульт: команды бота в живом эфире: /wa показывает режим и сообщество эфира, /wa_new создаёт сообщество эфира", async () => {
  const w = bootEvent({ recruitFrom: "2026-10-11" });
  at(8, 12, 0, 0);
  const [s1] = await ownerSay("/wa");
  assert.match(s1, /Режим: живой эфир 12\.10 в 20:00, набор с 11\.10/);
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
    await waitFor(() => /listening on/.test(log));
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
    await waitFor(() => evo.of("/instance/connectionState").length >= 1, 9000);
    assert.equal(s2.log().includes(EVO_KEY), false, "ключ API в логе не появляется");
    assert.equal(evo.calls.every((c) => c.key === EVO_KEY), true);
  } finally {
    s2.child.kill();
    await new Promise((r) => s2.child.on("close", r));
  }
});
