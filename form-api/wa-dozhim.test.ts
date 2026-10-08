/**
 * Тесты дожима «не вступил в сообщество» через WABA (node:test). Запуск из корня репозитория:
 *   npx --yes tsx --test form-api/wa-dozhim.test.ts
 * Evolution, Wazzup и Telegram подменены локальными серверами (wa-testkit.ts), настоящих запросов нет. Время модуля подменено
 * (часы clock.t идут по сценарию без ожидания), проходы дожима зовутся напрямую (dzTick). Вебхук Wazzup приходит настоящим HTTP
 * на handleWazzupHook с секретом в адресе. Заявки лежат в настоящем leads.jsonl (LEADS_LOG_PATH), бот с подписчиками настоящий.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { appendFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setUtcOffsetMinutes } from "./tg-time";
import { EVO_KEY, evo, TPL_LINK, TPL_MAIN, TPL_REMINDER, tg, wazzup, WZ_CHANNEL, WZ_KEY, WZ_SECRET, wzInbound } from "./wa-testkit";
import { HELP_TEXT, getStore, initTgWorkshop, processUpdate, registerWa, registerWaReport } from "./tg-workshop";
import { resetAdminCache } from "./tg-admin";
import { approvedOf, normalizeTemplates } from "./wazzup";
import { _waRt, initWaGroups, resetWaGroups, waCommand, waPanel, waReportLine } from "./wa-groups";
import {
  DECLINE_TEXT, LINK_TEXT, _dz, buildValues, cleanName, dateWord, defaultMap, dzCommand, dzFlush, dzHookSet, dzPanel, dzSave, dzSetEnabled, dzTemplates, dzTestSend, dzTick,
  evaluate, handleWazzupHook, isDecline, normalizePhone, windowStart,
} from "./wa-dozhim";

process.env.TG_WORKSHOP_BOT_TOKEN = "DZTEST:tgtoken123";
process.env.TG_WORKSHOP_WEBHOOK_SECRET = "dz-test-webhook-secret-0123";
process.env.TG_GO_SECRET = "dz-test-go-secret-987654";
process.env.TG_LINK_OWNER_IDS = "900,901";
process.env.EVOLUTION_API_KEY = EVO_KEY;
process.env.WAZZUP_API_KEY = WZ_KEY;
process.env.WAZZUP_CHANNEL_ID = WZ_CHANNEL;
process.env.WAZZUP_HOOK_SECRET = WZ_SECRET;
process.env.PORT = "4010";
delete process.env.EVOLUTION_INSTANCE;
delete process.env.WA_GROUPS;
delete process.env.WA_TARGET;
delete process.env.WA_ADMIN_NUMBERS;

const REPO = process.cwd();
const WA_SERIES = join(REPO, "form-api", "wa-series.json");
const TG_SERIES = join(REPO, "form-api", "tg-series.json");
const tmp = () => mkdtempSync(join(tmpdir(), "wa-dz-test-"));
/** Момент по часам Алматы (UTC+5). 8 октября 2026 это четверг. */
const alm = (y: number, m: number, d: number, h: number, mi = 0, s = 0) => Date.UTC(y, m - 1, d, h - 5, mi, s);
const clock = { t: alm(2026, 10, 8, 12, 0) };
const alarms: string[] = [];
const logs: string[] = [];
const readJsonl = (file: string): any[] => (existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

let hookServer: Server;
let hookBase = "";
const realLog = { log: console.log, warn: console.warn, error: console.error };

test.before(async () => {
  console.log = (...a: unknown[]) => void logs.push(a.map(String).join(" "));
  console.warn = (...a: unknown[]) => void logs.push(a.map(String).join(" "));
  console.error = (...a: unknown[]) => void logs.push(a.map(String).join(" "));
  await tg.start();
  await evo.start();
  await wazzup.start();
  hookServer = createServer((req, res) => {
    handleWazzupHook(req, res).catch(() => {
      res.statusCode = 500;
      res.end();
    });
  });
  await new Promise<void>((r) => hookServer.listen(0, "127.0.0.1", r));
  hookBase = `http://127.0.0.1:${(hookServer.address() as { port: number }).port}/api/wazzup-hook`;
  process.env.WAZZUP_HOOK_URL = hookBase;
});
test.after(async () => {
  console.log = realLog.log;
  console.warn = realLog.warn;
  console.error = realLog.error;
  resetWaGroups();
  registerWa(null);
  registerWaReport(null);
  await new Promise<void>((r) => {
    hookServer.closeAllConnections?.();
    hookServer.close(() => r());
  });
  await tg.stop();
  await evo.stop();
  await wazzup.stop();
  assert.deepEqual(evo.violations, [], "защита номера: дожим не пишет через Evolution и никого не добавляет");
  assert.deepEqual(wazzup.violations, [], "вызовы Wazzup по контракту: ключ, канал, форма тела, текст только в открытом окне");
});
test.beforeEach(() => {
  setUtcOffsetMinutes(300);
  tg.reset();
  evo.reset();
  wazzup.reset();
  clock.t = alm(2026, 10, 8, 12, 0);
  alarms.length = 0;
  logs.length = 0;
  process.env.WAZZUP_API_KEY = WZ_KEY;
  process.env.WAZZUP_CHANNEL_ID = WZ_CHANNEL;
  process.env.WAZZUP_HOOK_SECRET = WZ_SECRET;
  process.env.WAZZUP_HOOK_URL = hookBase;
  wazzup.templates[0].status = "approved"; // основной шаблон «Вступите в сообщество» в этих сценариях одобрен
});

// ───────────────────────── подготовка ─────────────────────────

type Boot = { dz?: Record<string, unknown>; targets?: string[]; mode?: "daily" | "event"; event?: Record<string, unknown>; dir?: string; skipOpen?: boolean };

const ddmm = (day: string) => `${day.slice(8)}.${day.slice(5, 7)}`;
const idOf = (day: string, seq = 1) => `${day}#${seq}`;
const sendJidOf = (day: string, seq = 1) => `12036310${day.replace(/-/g, "")}${seq}@g.us`;
const linkOf = (day: string, seq = 1) => `https://chat.whatsapp.com/INV${day.replace(/-/g, "")}${seq}`;
const target = (day: string, seq = 1, extra: Record<string, unknown> = {}) => ({
  id: idOf(day, seq), day, seq, kind: "community", jid: `12036300${day.replace(/-/g, "")}${seq}@g.us`, sendJid: sendJidOf(day, seq), name: `Эфир ${ddmm(day)}`, createdAt: 0,
  link: linkOf(day, seq), done: { announce: true, addMode: true, approval: true, link: true, welcome: true, avatar: true }, tries: {}, avatarAt: 0, ...extra,
});

/** Свежие данные, бот с подписчиками, модуль WhatsApp с готовыми сообществами и дожим (по умолчанию включён, шаблон со ссылкой). */
function boot(o: Boot = {}) {
  const dir = o.dir || tmp();
  const days = o.targets ?? ["2026-10-08", "2026-10-09"];
  if (!o.dir) {
    writeFileSync(
      join(dir, "wa-state.json"),
      JSON.stringify({
        v: 1,
        mode: o.mode ?? "daily",
        daily: { enabled: false },
        ...(o.event ? { event: o.event } : {}),
        targets: days.map((d) => target(d, 1, o.mode === "event" ? { source: "event" } : {})),
        dozhim: { enabled: true, hookOn: false, templateId: TPL_LINK, templateName: "Вступите в сообщество ссылка", vars: 2, ...(o.dz || {}) },
      }),
    );
    writeFileSync(join(dir, "leads.jsonl"), "");
  }
  const tgs = JSON.parse(readFileSync(TG_SERIES, "utf8"));
  tgs.firstDay = "2026-09-01";
  tgs.skipDays = [];
  const tgPath = join(dir, "tg-series.json");
  writeFileSync(tgPath, JSON.stringify(tgs));
  process.env.TG_SERIES_FILE = tgPath;
  process.env.LEADS_LOG_PATH = join(dir, "leads.jsonl");
  delete process.env.TG_BOT;
  resetAdminCache();
  initTgWorkshop({ dir, seriesFile: tgPath });
  resetWaGroups();
  initWaGroups({
    dir,
    seriesFile: WA_SERIES,
    deps: { now: () => clock.t, sleep: async () => {}, rand: () => 0.5, notify: async (text: string) => (alarms.push(text), 1) },
  });
  registerWa((cmd, args, now) => waCommand(cmd, args, now));
  registerWaReport((day) => waReportLine(day));
  // Номер подключён: проходы дожима работают. Тик модуля не зовём, чтобы он не слал серию в сообщества.
  if (!o.skipOpen) _waRt()!.conn = { state: "open", at: clock.t };
  return {
    dir,
    state: () => JSON.parse(readFileSync(join(dir, "wa-state.json"), "utf8")),
    rows: () => readJsonl(join(dir, "wa-dozhim.jsonl")),
    journal: () => readJsonl(join(dir, "wa-journal.jsonl")),
    members: () => JSON.parse(readFileSync(join(dir, "wa-members.json"), "utf8")),
    rt: () => _waRt()!,
  };
}
type W = ReturnType<typeof boot>;

let seq = 0;
type L = { line: string; eid: string };
/** Строка заявки как её пишет captureLead. */
function lead(o: { phone: string; at: number; name?: string; eid?: string }): L {
  const n = ++seq;
  const eid = o.eid ?? `eid-${n}`;
  return { eid, line: JSON.stringify({ kind: "capture", id: `lead-${n}`, eventId: eid, name: o.name ?? "Айгерим", phone: o.phone, source: "efir-1-okt-hero", utm: {}, ts: new Date(o.at).toISOString() }) };
}
const addLeads = (w: W, list: L[]) => appendFileSync(join(w.dir, "leads.jsonl"), list.map((l) => l.line).join("\n") + "\n");
/** Участники сообщества дня: каждому номер в phoneNumber и LID в id, как отдаёт Evolution 2.3.7. */
function members(day: string, phones: string[], seqN = 1) {
  // Первым всегда сам номер-админ: в настоящем сообществе он есть всегда, пустых списков не бывает.
  const all = ["77000000001", ...phones];
  evo.participants.set(sendJidOf(day, seqN), all.map((p, i) => ({ id: `${184467440737000 + i}@lid`, phoneNumber: `${p}@s.whatsapp.net`, admin: i === 0 ? "superadmin" : null })));
}
const sentChats = () => wazzup.sent.filter((s) => s.templateId).map((s) => s.chatId);
const texts = () => wazzup.sent.filter((s) => s.text !== undefined);
const partCalls = () => evo.of("/group/participants/workshop");
/** Тик и всё, что он отправил шаблонами. */
const tick = async () => dzTick();

// ───────────────────────── чистые правила ─────────────────────────

test("номер: 8XXXXXXXXXX и 10 цифр на 7 становятся 77…, Казахстан это 77 и 11 цифр, Россия и мусор не Казахстан", () => {
  const d = (x: string) => normalizePhone(x)?.digits;
  const kz = (x: string) => normalizePhone(x)?.kz;
  assert.equal(d("8 (707) 777-88-99"), "77077778899");
  assert.equal(d("+7 701 111 22 33"), "77011112233");
  assert.equal(d("7087654321"), "77087654321", "10 цифр с первой цифрой 7");
  assert.equal(kz("7087654321"), true);
  assert.equal(kz("89161234567"), false, "Россия 8 916…");
  assert.equal(kz("+7 916 123 45 67"), false);
  assert.equal(kz("9161234567"), false, "10 цифр не на 7 остаются как есть, это не Казахстан");
  assert.equal(d("9161234567"), "9161234567");
  assert.equal(kz("+380 50 123 45 67"), false);
  assert.equal(kz("77011112233"), true);
  assert.equal(kz("7701111223"), true, "10 цифр на 77… получают код: 77 701 111 223 это уже 11 цифр");
  assert.equal(normalizePhone("123"), null);
  assert.equal(normalizePhone(""), null);
});

test("имя для {{1}}: первое слово, буквы и дефис, до 30 знаков; мусор даёт пустую строку", () => {
  assert.equal(cleanName("Айгерим Н."), "Айгерим");
  assert.equal(cleanName("  анна-мария  "), "Анна-Мария");
  assert.equal(cleanName("АЛИЯ"), "Алия");
  assert.equal(cleanName("Мария-Луиза Иванова"), "Мария-Луиза");
  assert.equal(cleanName("McDonald"), "McDonald", "смешанный регистр не трогаем");
  assert.equal(cleanName("Динара ❤️"), "Динара");
  for (const junk of ["", "   ", "123", "Анна2", "ааааа", "ффффф", "тест", "test", "qwerty", "x", "-", "ghjkl", "a@b.kz", "https://x.kz", "Ы".repeat(31), "😀😀"]) {
    assert.equal(cleanName(junk), "", `мусор: «${junk}»`);
  }
  assert.ok(cleanName("Ы".repeat(30) + "а").length === 0, "31 знак не бывает именем");
});

test("{{2}}: сегодня, завтра, дальше день недели и дата; считается от дня эфира и момента отправки", () => {
  const now = alm(2026, 10, 9, 9, 0);
  assert.equal(dateWord("2026-10-09", now), "сегодня, 9 октября");
  assert.equal(dateWord("2026-10-10", now), "завтра, 10 октября");
  assert.equal(dateWord("2026-10-11", now), "в воскресенье, 11 октября");
  assert.equal(dateWord("2026-10-13", now), "во вторник, 13 октября");
  assert.equal(dateWord("2026-10-14", now), "в среду, 14 октября");
  assert.equal(dateWord("2026-10-15", now), "в четверг, 15 октября");
  assert.equal(dateWord("2026-10-16", now), "в пятницу, 16 октября");
  assert.equal(dateWord("2026-10-17", now), "в субботу, 17 октября");
  assert.equal(dateWord("2026-10-12", now), "в понедельник, 12 октября");
  // тот же день эфира через сутки уже «сегодня»
  assert.equal(dateWord("2026-10-10", alm(2026, 10, 10, 9, 0)), "сегодня, 10 октября");
  // в 23:30 по Алматы календарь уже следующий день, а по UTC ещё прежний: считаем по Алматы
  assert.equal(dateWord("2026-10-09", alm(2026, 10, 8, 23, 30)), "завтра, 9 октября");
});

test("ответ «Нет»: кнопка и короткие отказы; вопросы и просьбы о ссылке отказом не считаются", () => {
  for (const t of ["Нет", "нет", "Нет, не могу прийти", " НЕТ! ", "Не надо", "не нужно", "Стоп", "stop", "Отписаться"]) assert.equal(isDecline(t), true, t);
  for (const t of ["Пришлите ссылку", "Да, буду вовремя", "Нетрудно, пришлите", "Нет ли ссылки? Скиньте пожалуйста, не могу найти", "Ок", "", "Не вижу ссылку"]) assert.equal(isDecline(t), false, t);
});

test("окно часов: до 09:00 ждём 09:00, после 21:00 ждём 09:00 завтра, внутри окна как есть", () => {
  const w = (h: number, m = 0) => windowStart(alm(2026, 10, 8, h, m), "09:00", "21:00");
  assert.equal(w(3, 30), alm(2026, 10, 8, 9, 0));
  assert.equal(w(8, 59), alm(2026, 10, 8, 9, 0));
  assert.equal(w(9, 0), alm(2026, 10, 8, 9, 0));
  assert.equal(w(20, 59), alm(2026, 10, 8, 20, 59));
  assert.equal(w(21, 0), alm(2026, 10, 9, 9, 0));
  assert.equal(w(23, 50), alm(2026, 10, 9, 9, 0));
});

test("переменные: соответствие по умолчанию для трёх шаблонов, значения собираются, пустое значение не пропускается", () => {
  assert.deepEqual(defaultMap("vstupite_v_soobshchestvo_1", "Вступите в сообщество", 2), [{ kind: "name" }, { kind: "date" }]);
  assert.deepEqual(defaultMap("vstupite_v_soobshchestvo_ssylka_1", "Вступите в сообщество ссылка", 2), [{ kind: "name" }, { kind: "date" }]);
  assert.deepEqual(defaultMap("napominanie_o_zapisi_ili_vstreche_1", "Напоминание о записи или встрече", 3), [
    { kind: "text", text: "команда onAI Academy" },
    { kind: "text", text: "воркшопе «Вайб-продакшен»" },
    { kind: "text", text: "20:00 по Алматы" },
  ]);
  assert.deepEqual(defaultMap("новый", "Новый шаблон", 4).map((m) => m.kind), ["name", "date", "text", "text"], "неизвестный шаблон: имя, дата и пустые тексты, которые нужно заполнить");
  const ctx = { name: "Айгерим", day: "2026-10-09", now: alm(2026, 10, 9, 10, 0), link: "https://onai.academy/workshop-montazh/wa" };
  assert.deepEqual(buildValues([{ kind: "name" }, { kind: "date" }, { kind: "link" }, { kind: "text", text: "  привет  " }], ctx), ["Айгерим", "сегодня, 9 октября", "https://onai.academy/workshop-montazh/wa", "привет"]);
  assert.equal(buildValues([{ kind: "text", text: "" }], ctx), null);
});

// ───────────────────────── замер участников ─────────────────────────

test("замер: раз в 10 минут участники вкладки объявлений текущего и следующего дня, номера только цифрами в wa-members.json, t.members обновляется, в логах номера закрыты", async () => {
  const w = boot({ targets: ["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-12"] });
  evo.participants.set(sendJidOf("2026-10-08"), [
    { id: "184467440737001@lid", phoneNumber: "77011111111@s.whatsapp.net", admin: "superadmin" },
    { id: "184467440737002@lid", phoneNumber: "77022222222@s.whatsapp.net", admin: null },
    { id: "184467440737003@lid" },
    { id: "77033333333@s.whatsapp.net", admin: null },
  ]);
  members("2026-10-09", ["77044444444"]);
  const t1 = await tick();
  assert.equal(t1.measured, 2, "вчерашний (закрыт) и далёкий (12 октября) дни не опрашиваются");
  const calls = partCalls();
  assert.deepEqual(calls.map((c) => c.query.get("groupJid")).sort(), [sendJidOf("2026-10-08"), sendJidOf("2026-10-09")].sort());
  assert.equal(calls.every((c) => c.method === "GET" && c.key === EVO_KEY), true);
  const m = w.members().targets;
  assert.deepEqual(Object.keys(m).sort(), [idOf("2026-10-08"), idOf("2026-10-09")]);
  assert.deepEqual(m[idOf("2026-10-08")].numbers.sort(), ["77011111111", "77022222222", "77033333333"]);
  assert.deepEqual([m[idOf("2026-10-08")].total, m[idOf("2026-10-08")].unresolved, m[idOf("2026-10-08")].at, m[idOf("2026-10-08")].day], [4, 1, clock.t, "2026-10-08"]);
  assert.equal(m[idOf("2026-10-08")].numbers.every((n: string) => /^\d+$/.test(n)), true, "только цифры");
  const st = w.state().targets.find((t: any) => t.id === idOf("2026-10-08"));
  assert.deepEqual([st.members, st.membersAt], [4, clock.t], "переполнение видит свежее число участников");
  // не чаще раза в 10 минут
  clock.t += 9 * 60_000;
  await tick();
  assert.equal(partCalls().length, 2);
  clock.t += 2 * 60_000;
  await tick();
  assert.equal(partCalls().length, 4, "через 11 минут замер повторён");
  // в логах и журнале модуля номеров нет
  assert.equal(logs.join("\n").match(/\b77\d{9}\b/), null, "полных номеров в логах нет");
  const jf = join(w.dir, "wa-journal.jsonl");
  if (existsSync(jf)) assert.equal(readFileSync(jf, "utf8").match(/\b77\d{9}\b/), null);
});

test("замер: список вдруг в разы короче прошлого не принимается, шаблоны не уходят, владельцам одна тревога; сбой Evolution не роняет проход", async () => {
  const w = boot();
  members("2026-10-08", Array.from({ length: 40 }, (_, i) => `7701000${String(1000 + i)}`));
  members("2026-10-09", ["77044444444"]);
  addLeads(w, [lead({ phone: "77099998888", at: alm(2026, 10, 8, 10, 0) })]);
  await tick();
  assert.equal(sentChats().length, 1);
  assert.equal(w.members().targets[idOf("2026-10-08")].total, 41, "40 участников и номер-админ");
  // следующий замер вернул пустой список: принимать нельзя, иначе все вступившие станут «не вступившими»
  addLeads(w, [lead({ phone: "77011111000", at: alm(2026, 10, 8, 10, 30) })]);
  members("2026-10-08", []);
  clock.t += 11 * 60_000;
  const t = await tick();
  assert.equal(t.measured, 1, "принят только замер второго дня");
  assert.equal(sentChats().length, 1, "по подозрительному замеру никто не получил шаблон");
  assert.equal(w.members().targets[idOf("2026-10-08")].total, 41, "прежний замер сохранён");
  assert.equal(alarms.filter((a) => /вдруг стал короче/.test(a)).length, 1);
  clock.t += 11 * 60_000;
  await tick();
  assert.equal(alarms.filter((a) => /вдруг стал короче/.test(a)).length, 1, "тревога раз в час");
  assert.equal(sentChats().length, 1);
  // Evolution ответил ошибкой: проход не падает, ничего не отправляет
  evo.fail = (c) => (c.path.startsWith("/group/participants") ? { status: 500 } : null);
  clock.t += 11 * 60_000;
  const t3 = await tick();
  assert.equal(t3.sent, 0);
  assert.equal(sentChats().length, 1);
});

test("выключенный дожим ничего не делает: ни замеров, ни запросов к Wazzup, ни отправок, ни файлов; WA_GROUPS выключен: вебхук отвечает 200 и ничего не запускает", async () => {
  const w = boot({ dz: { enabled: false } });
  addLeads(w, [lead({ phone: "77022223344", at: alm(2026, 10, 8, 10, 0) })]);
  const t = await tick();
  assert.equal(t.skipped, "off");
  assert.equal(await tick().then((x) => x.sent), 0);
  assert.equal(partCalls().length, 0);
  assert.equal(wazzup.calls.length, 0);
  assert.equal(existsSync(join(w.dir, "wa-members.json")), false);
  assert.equal(existsSync(join(w.dir, "wa-dozhim.jsonl")), false);
  assert.equal(w.state().targets.every((x: any) => x.members === undefined), true, "t.members не тронуто");
  // вебхук при выключенном дожиме и снятом вебхуке: ответ 200, но разбора нет
  wazzup.windows.add("77022223344");
  const r = await fetch(`${hookBase}?s=${WZ_SECRET}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(wzInbound({ chatId: "77022223344", text: "Нет" })) });
  assert.equal(r.status, 200);
  await dzFlush();
  assert.equal(wazzup.calls.length, 0);
  // команда без аргумента только показывает состояние
  const reply = await waCommand("wa_dozhim", "", clock.t);
  assert.match(reply.text, /Дожим WABA: выключен/);
  assert.equal(wazzup.calls.length, 0);
  // дожим не стартует без модуля: панель недоступна
  resetWaGroups();
  assert.deepEqual(dzPanel(), { available: false });
  assert.equal((await dzSetEnabled(true)).code, "module_off");
  // а вебхук при остановленном модуле и верном секрете просто отвечает 200
  assert.equal((await fetch(`${hookBase}?s=${WZ_SECRET}`, { method: "POST", body: JSON.stringify({ test: true }) })).status, 200);
});

// ───────────────────────── кандидаты ─────────────────────────

test("кандидаты: Казахстан да, Россия нет, вступил нет, бот запущен нет; 8XXXXXXXXXX и 10 цифр на 7 приняты; ночные и вчерашние вечерние уходят днём; значения шаблона имя и дата", async () => {
  const w = boot();
  members("2026-10-08", ["77011111111"]);
  members("2026-10-09", []);
  const A = lead({ phone: "+7 (702) 222-33-44", at: alm(2026, 10, 8, 10, 0), name: "Айгерим Н." });
  const B = lead({ phone: "+7 916 123 45 67", at: alm(2026, 10, 8, 10, 5), name: "Иван" });
  const C = lead({ phone: "8 701 111 11 11", at: alm(2026, 10, 8, 10, 10), name: "Вступившая" });
  const D = lead({ phone: "77055556666", at: alm(2026, 10, 8, 10, 15), name: "Телеграмщик", eid: "eid-tg" });
  const E = lead({ phone: "8 707 777 88 99", at: alm(2026, 10, 8, 10, 20), name: "динара" });
  const F = lead({ phone: "7087654321", at: alm(2026, 10, 8, 10, 25), name: "Нурлан" });
  const G = lead({ phone: "77091112233", at: alm(2026, 10, 8, 11, 50), name: "Поздняя" });
  const H = lead({ phone: "77012345678", at: alm(2026, 10, 8, 2, 0), name: "Ночная" });
  const H2 = lead({ phone: "77013334455", at: alm(2026, 10, 7, 22, 10), name: "Вечерняя" });
  const OLD = lead({ phone: "77014445566", at: alm(2026, 10, 7, 11, 0), name: "Прошлая" });
  addLeads(w, [A, B, C, D, E, F, G, H, H2, OLD]);
  // человек запустил бота по ссылке с eventId заявки: pp_/ty_ + eventId
  getStore().recordEvent({ type: "start", chat_id: 5001, user_id: 5001, username: "tg", first_name: "Телеграмщик", payload: "ty_eid-tg", streamDay: "2026-10-08", ts: new Date(clock.t - 3600_000).toISOString() });
  const r = await tick();
  assert.equal(r.sent, 5);
  // от старых заявок к новым
  assert.deepEqual(sentChats(), ["77013334455", "77012345678", "77022223344", "77077778899", "77087654321"]);
  const by = (chat: string) => wazzup.sent.find((s) => s.chatId === chat)!;
  assert.deepEqual(by("77022223344").templateValues, ["Айгерим", "сегодня, 8 октября"]);
  assert.deepEqual(by("77077778899").templateValues, ["Динара", "сегодня, 8 октября"]);
  assert.equal(by("77022223344").templateId, TPL_LINK);
  assert.equal(by("77022223344").crmMessageId, `dozhim-${A.eid}`);
  // журнал: ответ записан, номер полный только в файле дожима
  const rows = w.rows().filter((x) => x.ev === "send");
  assert.equal(rows.length, 5);
  assert.deepEqual([rows[2].to, rows[2].eid, rows[2].day, rows[2].ok, rows[2].status, rows[2].tpl], ["77022223344", A.eid, "2026-10-08", true, 201, TPL_LINK]);
  assert.equal(logs.join("\n").match(/\b77\d{9}\b/), null);
  // ждёт только поздняя заявка (30 минут ещё не прошло), остальные не кандидаты
  const ev = evaluate(_dz()!, clock.t);
  assert.deepEqual([ev.ready.length, ev.waiting, ev.foreign], [0, 1, 1]);
  clock.t = alm(2026, 10, 8, 12, 20);
  assert.equal((await tick()).sent, 1);
  assert.equal(sentChats().at(-1), "77091112233");
  // повторный проход никого не добавляет
  assert.equal((await tick()).sent, 0);
  assert.equal(sentChats().length, 6);
});

test("время: через 30 минут после заявки, ночные в 09:00, вечерние после 21:00 на следующий день, в день эфира не позже 19:30, заявка на завтра уходит «сегодня» после 09:00", async () => {
  // задержка 30 минут
  let w = boot();
  members("2026-10-08", []);
  members("2026-10-09", []);
  addLeads(w, [lead({ phone: "77011110001", at: alm(2026, 10, 8, 10, 0) })]);
  clock.t = alm(2026, 10, 8, 10, 29);
  assert.equal((await tick()).sent, 0);
  clock.t = alm(2026, 10, 8, 10, 30);
  assert.equal((await tick()).sent, 1);

  // ночная заявка: в 08:59 ничего, в 09:00 уходит
  wazzup.reset();
  wazzup.templates[0].status = "approved";
  w = boot();
  members("2026-10-08", []);
  addLeads(w, [lead({ phone: "77011110002", at: alm(2026, 10, 8, 3, 0) })]);
  clock.t = alm(2026, 10, 8, 8, 59);
  assert.equal((await tick()).sent, 0);
  clock.t = alm(2026, 10, 8, 9, 0);
  assert.equal((await tick()).sent, 1);
  assert.deepEqual(wazzup.sent[0].templateValues, ["Айгерим", "сегодня, 8 октября"]);

  // в день эфира не позже 19:30: заявка в 19:01 имела бы срок 19:31 и не получает шаблон никогда
  wazzup.reset();
  wazzup.templates[0].status = "approved";
  w = boot();
  members("2026-10-08", []);
  members("2026-10-09", []);
  addLeads(w, [lead({ phone: "77011110003", at: alm(2026, 10, 8, 18, 55) }), lead({ phone: "77011110004", at: alm(2026, 10, 8, 19, 1) })]);
  clock.t = alm(2026, 10, 8, 19, 25);
  assert.deepEqual([(await tick()).sent, sentChats()], [1, ["77011110003"]]);
  clock.t = alm(2026, 10, 8, 19, 31);
  assert.equal((await tick()).sent, 0, "после 19:30 в день эфира не пишем");
  clock.t = alm(2026, 10, 8, 20, 10);
  assert.equal((await tick()).sent, 0);

  // заявка после начала набора на завтра: 20:45 это уже день 9, срок 21:15 вне окна, уходит в 09:00 дня эфира как «сегодня, 9 октября»
  wazzup.reset();
  wazzup.templates[0].status = "approved";
  w = boot();
  members("2026-10-08", []);
  members("2026-10-09", []);
  addLeads(w, [lead({ phone: "77011110005", at: alm(2026, 10, 8, 20, 45) })]);
  clock.t = alm(2026, 10, 8, 21, 15);
  assert.equal((await tick()).sent, 0, "21:15 вне окна");
  clock.t = alm(2026, 10, 9, 8, 59);
  assert.equal((await tick()).sent, 0);
  clock.t = alm(2026, 10, 9, 9, 0);
  assert.equal((await tick()).sent, 1);
  assert.deepEqual(wazzup.sent[0].templateValues, ["Айгерим", "сегодня, 9 октября"]);

  // заявка вечером накануне: день 9, но в 14:00 дня 8 пишем «завтра, 9 октября»: заявка на завтра подана в 20:50 дня 8, окно закрыто; а подана в 20:41 (после закрытия набора на сегодня) срок 21:11 тоже вне окна
  wazzup.reset();
  wazzup.templates[0].status = "approved";
  w = boot({ dz: { delayMin: 0 } });
  members("2026-10-08", []);
  members("2026-10-09", []);
  addLeads(w, [lead({ phone: "77011110006", at: alm(2026, 10, 8, 20, 41) })]);
  clock.t = alm(2026, 10, 8, 20, 50);
  assert.equal((await tick()).sent, 1, "задержка 0: уходит сразу в окне");
  assert.deepEqual(wazzup.sent[0].templateValues, ["Айгерим", "завтра, 9 октября"]);
});

test("лимит в сутки: больше трёх за 24 часа не уходит, владельцам одна тревога; через сутки счёт освобождается", async () => {
  const w = boot({ dz: { dailyLimit: 3 } });
  members("2026-10-08", []);
  members("2026-10-09", []);
  addLeads(w, Array.from({ length: 5 }, (_, i) => lead({ phone: `7701000010${i}`, at: alm(2026, 10, 8, 9, i) })));
  const r = await tick();
  assert.equal(r.sent, 3);
  assert.equal(sentChats().length, 3);
  assert.equal(alarms.filter((a) => /предел защиты номера/.test(a)).length, 1);
  clock.t += 5 * 60_000;
  assert.equal((await tick()).sent, 0);
  assert.equal(alarms.filter((a) => /предел защиты номера/.test(a)).length, 1, "тревога не чаще раза в сутки");
  assert.deepEqual([(dzPanel(clock.t).limit as any).used, (dzPanel(clock.t).limit as any).max], [3, 3]);
  // лимит скользящий: через 24 часа после первых трёх отправок счёт свободен
  clock.t = alm(2026, 10, 9, 12, 0);
  assert.equal((dzPanel(clock.t).limit as any).used, 0);
});

test("один шаблон на заявку за всё время: повторные проходы, перезапуск модуля, дубль строки заявки и вторая заявка с тем же номером на тот же день не дают второго", async () => {
  const w = boot();
  members("2026-10-08", []);
  members("2026-10-09", []);
  const A = lead({ phone: "77022223344", at: alm(2026, 10, 8, 10, 0) });
  const dup = { eid: A.eid, line: JSON.stringify({ ...JSON.parse(A.line), id: "lead-dup" }) };
  const again = lead({ phone: "8 702 222 33 44", at: alm(2026, 10, 8, 10, 5) });
  addLeads(w, [A, dup, again]);
  assert.equal((await tick()).sent, 1);
  assert.equal((await tick()).sent, 0);
  clock.t += 15 * 60_000;
  assert.equal((await tick()).sent, 0);
  // перезапуск: состояние восстанавливается из wa-dozhim.jsonl
  boot({ dir: w.dir });
  _waRt()!.conn = { state: "open", at: clock.t };
  assert.equal((await tick()).sent, 0);
  assert.equal(sentChats().length, 1);
  // та же заявка на другой день уже не «та же»: у человека новая заявка на 9 октября, но номер тот же, шаблон по новой заявке разрешён
  const next = lead({ phone: "77022223344", at: alm(2026, 10, 8, 21, 0) });
  addLeads(w, [next]);
  clock.t = alm(2026, 10, 9, 10, 0);
  assert.equal((await tick()).sent, 1, "новая заявка на другой день эфира: отдельный шаблон");
  assert.equal(wazzup.sent.length, 2);
});

test("имя: из заявки; пусто или мусор, имя профиля WhatsApp из Evolution; нет ни того ни другого, «друг»", async () => {
  const w = boot();
  members("2026-10-08", []);
  evo.contacts.set("77015550001@s.whatsapp.net", "Динара ❤️");
  addLeads(w, [
    lead({ phone: "77015550001", at: alm(2026, 10, 8, 9, 0), name: "123" }),
    lead({ phone: "77015550002", at: alm(2026, 10, 8, 9, 1), name: "ффффф" }),
    lead({ phone: "77015550003", at: alm(2026, 10, 8, 9, 2), name: "Айжан Серикова" }),
  ]);
  await tick();
  const by = (c: string) => wazzup.sent.find((s) => s.chatId === c)!.templateValues![0];
  assert.deepEqual([by("77015550001"), by("77015550002"), by("77015550003")], ["Динара", "друг", "Айжан"]);
  const finds = evo.of("/chat/findContacts/workshop");
  assert.deepEqual(finds.map((c) => c.body.where.remoteJid).sort(), ["77015550001@s.whatsapp.net", "77015550002@s.whatsapp.net"], "профиль спрашиваем только когда имя из заявки не годится");
  assert.equal(finds.every((c) => c.method === "POST" && c.key === EVO_KEY), true);
});

test("запасной шаблон «Напоминание о записи или встрече»: значения по умолчанию три постоянных текста", async () => {
  const w = boot({ dz: { templateId: TPL_REMINDER, templateName: "Напоминание о записи или встрече", vars: 3 } });
  members("2026-10-08", []);
  addLeads(w, [lead({ phone: "77015550010", at: alm(2026, 10, 8, 9, 0) })]);
  assert.equal((await tick()).sent, 1);
  assert.deepEqual(wazzup.sent[0].templateValues, ["команда onAI Academy", "воркшопе «Вайб-продакшен»", "20:00 по Алматы"]);
  assert.equal(wazzup.sent[0].templateId, TPL_REMINDER);
});

// ───────────────────────── ошибки Wazzup ─────────────────────────

test("ошибки отправки: 429 и 5xx повторяются через 5 минут не больше двух раз, потом одна тревога; повторный crmMessageId значит «уже ушло»", async () => {
  const w = boot();
  members("2026-10-08", []);
  const A = lead({ phone: "77016660001", at: alm(2026, 10, 8, 9, 0) });
  addLeads(w, [A]);
  let n = 0;
  wazzup.fail = (c) => (c.path === "/v3/message" ? (++n === 1 ? { status: 429, json: { error: "TOO_MANY_REQUESTS" } } : n === 2 ? { status: 503 } : null) : null);
  assert.equal((await tick()).sent, 0);
  assert.equal(n, 1);
  assert.equal(w.rows().filter((r) => r.ev === "send_fail").length, 1);
  clock.t += 4 * 60_000;
  await tick();
  assert.equal(n, 1, "раньше чем через 5 минут повтора нет");
  clock.t += 61_000;
  await tick();
  assert.equal(n, 2, "вторая попытка через 5 минут: 503");
  clock.t += 5 * 60_000 + 1000;
  assert.equal((await tick()).sent, 1, "третья попытка прошла");
  assert.equal(sentChats().length, 1);
  assert.equal(alarms.length, 0, "тревоги нет: человек в итоге получил шаблон");
  const fails = w.rows().filter((r) => r.ev === "send_fail");
  assert.deepEqual(fails.map((r) => [r.status, r.attempt, r.final]), [[429, 1, false], [503, 2, false]]);

  // три неудачи подряд: окончательно, одна тревога, больше не пытаемся
  wazzup.reset();
  wazzup.templates[0].status = "approved";
  const w2 = boot();
  members("2026-10-08", []);
  addLeads(w2, [lead({ phone: "77016660002", at: alm(2026, 10, 8, 9, 0) })]);
  wazzup.fail = (c) => (c.path === "/v3/message" ? { status: 500 } : null);
  for (let i = 0; i < 3; i++) {
    await tick();
    clock.t += 5 * 60_000 + 1000;
  }
  assert.equal(wazzup.of("POST", "/v3/message").length, 3);
  assert.equal(alarms.filter((a) => /не отправлен/.test(a)).length, 1);
  assert.match(alarms.at(-1)!, /Три попытки исчерпаны/);
  await tick();
  clock.t += 10 * 60_000;
  await tick();
  assert.equal(wazzup.of("POST", "/v3/message").length, 3, "после окончательной ошибки повторов нет");
  assert.equal(sentChats().length, 0);

  // повторный crmMessageId: сообщение с таким идентификатором уже принято
  alarms.length = 0;
  wazzup.reset();
  wazzup.templates[0].status = "approved";
  const w3 = boot();
  members("2026-10-08", []);
  const C = lead({ phone: "77016660003", at: alm(2026, 10, 8, 9, 0) });
  addLeads(w3, [C]);
  wazzup.crmSeen.add(`dozhim-${C.eid}`);
  assert.equal((await tick()).sent, 1, "засчитано отправленным");
  assert.equal(w3.rows().filter((r) => r.ev === "send_fail").length, 0);
  assert.equal(w3.rows().filter((r) => r.ev === "send")[0].dup, true);
  assert.equal(alarms.length, 0);
});

test("ошибки отправки: 400 без повтора и с одной тревогой; три отказа подряд останавливают отправки на час, заявки не сгорают все сразу", async () => {
  const w = boot();
  members("2026-10-08", []);
  addLeads(w, Array.from({ length: 6 }, (_, i) => lead({ phone: `7701777000${i}`, at: alm(2026, 10, 8, 9, i) })));
  wazzup.fail = (c) => (c.path === "/v3/message" ? { status: 400, json: { error: "VALIDATION_ERROR", description: "bad template values" } } : null);
  await tick();
  assert.equal(wazzup.of("POST", "/v3/message").length, 3, "после трёх отказов подряд остановка, остальные заявки целы");
  assert.equal(alarms.filter((a) => /отправки остановлены на час/.test(a)).length, 1);
  assert.equal(alarms.filter((a) => /не отправлен/.test(a)).length, 1, "тревога об одной и той же ошибке не чаще раза в час");
  assert.equal(w.rows().filter((r) => r.ev === "send_fail" && r.final === true).length, 3);
  assert.equal((dzPanel(clock.t) as any).halted, true);
  clock.t += 30 * 60_000;
  assert.equal((await tick()).skipped, "halt");
  // через час отправки возобновляются; три оставшиеся заявки целы
  wazzup.fail = null;
  clock.t += 31 * 60_000;
  assert.equal((await tick()).sent, 3);
  assert.equal(sentChats().length, 3);
});

// ───────────────────────── вебхук: приём ─────────────────────────

async function hook(body: unknown, o: { secret?: string | null; method?: string } = {}) {
  const secret = o.secret === undefined ? WZ_SECRET : o.secret;
  const res = await fetch(secret === null ? hookBase : `${hookBase}?s=${encodeURIComponent(secret)}`, { method: o.method ?? "POST", headers: { "Content-Type": "application/json" }, ...(o.method === "GET" ? {} : { body: JSON.stringify(body) }) });
  await res.arrayBuffer();
  await dzFlush();
  return res.status;
}

/** Дожим включён, вебхук поставлен, одному номеру уже ушёл шаблон. */
async function sent1(phone = "77022223344", at = alm(2026, 10, 8, 10, 0)) {
  const w = boot({ dz: { hookOn: true } });
  wazzup.hooks = { webhooksUri: `${hookBase}?s=${WZ_SECRET}`, subscriptions: { messagesAndStatuses: true, contactsAndDealsCreation: false, channelsUpdates: false, templateStatus: true } };
  members("2026-10-08", []);
  members("2026-10-09", []);
  const A = lead({ phone, at });
  addLeads(w, [A]);
  assert.equal((await tick()).sent, 1);
  return { w, A };
}

test("вебхук: чужой или пустой секрет и не POST отвечают 403 или 405 и ничего не запускают; тестовый POST {test:true} отвечает 200", async () => {
  const { } = await sent1();
  wazzup.windows.add("77022223344");
  const before = wazzup.calls.length;
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Пришлите ссылку" }), { secret: "wrong" }), 403);
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Пришлите ссылку" }), { secret: null }), 403);
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Пришлите ссылку" }), { secret: "" }), 403);
  assert.equal(await hook({}, { method: "GET" }), 405);
  assert.equal(wazzup.calls.length, before, "без верного секрета ни одного запроса к Wazzup");
  assert.equal(await hook({ test: true }), 200);
  assert.equal(wazzup.calls.length, before, "тестовый запрос ничего не вызывает");
});

test("вебхук: ответ на кнопку даёт одну ссылку сообщества дня заявки; повторные ответы и дубль messageId ссылку второй раз не шлют", async () => {
  const { w } = await sent1();
  wazzup.windows.add("77022223344"); // человек ответил: окно 24 часа открыто
  const msg = wzInbound({ chatId: "77022223344", text: "Пришлите ссылку", messageId: "mid-1" });
  assert.equal(await hook(msg), 200);
  assert.equal(texts().length, 1);
  assert.equal(texts()[0].chatId, "77022223344");
  assert.equal(texts()[0].text, LINK_TEXT(linkOf("2026-10-08")));
  assert.equal(texts()[0].text, `Вот ссылка на сообщество участников, ссылка на эфир придёт туда в 19:50: ${linkOf("2026-10-08")}`);
  // дубль: Wazzup повторил доставку того же messageId
  assert.equal(await hook(msg), 200);
  assert.equal(texts().length, 1, "дубль messageId без повтора");
  // новое сообщение того же человека: ссылку ему уже слали
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Спасибо!", messageId: "mid-2" })), 200);
  assert.equal(texts().length, 1, "вторая ссылка не уходит");
  // после перезапуска дубль тоже отсекается
  boot({ dir: w.dir });
  _waRt()!.conn = { state: "open", at: clock.t };
  assert.equal(await hook(msg), 200);
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Пришлите ссылку", messageId: "mid-3" })), 200);
  assert.equal(texts().length, 1, "после перезапуска ссылка тоже одна");
  assert.equal(w.rows().filter((r) => r.ev === "link" && r.ok === true).length, 1);
  assert.equal(w.rows().filter((r) => r.ev === "in").length, 3, "в файл пишутся только ответы на наш шаблон");
});

test("вебхук: ссылка берётся у сообщества дня заявки (новая заявка на завтра получает завтрашнюю), нет готового сообщества дня, постоянный /wa", async () => {
  const w = boot({ dz: { hookOn: true }, targets: ["2026-10-08", "2026-10-09"] });
  members("2026-10-08", []);
  members("2026-10-09", []);
  addLeads(w, [lead({ phone: "77022223344", at: alm(2026, 10, 8, 20, 45) }), lead({ phone: "77033334455", at: alm(2026, 10, 8, 10, 0) })]);
  clock.t = alm(2026, 10, 9, 9, 0);
  await tick();
  assert.deepEqual(sentChats().sort(), ["77022223344"], "заявка на 8 октября в день 9 уже не кандидат, на 9 октября кандидат");
  wazzup.windows.add("77022223344");
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Да" })), 200);
  assert.equal(texts()[0].text, LINK_TEXT(linkOf("2026-10-09")));
  // сообщество дня не готово: постоянный адрес /wa, который сам переадресует
  const r = _waRt()!;
  const t9 = r.state.targets.find((t) => t.id === idOf("2026-10-09"))!;
  t9.done.link = false;
  wazzup.reset();
  wazzup.templates[0].status = "approved";
  // новый номер получает шаблон на день 9, потом ссылка по /wa
  const d = _dz()!;
  d.chats.set("77044445566", { eid: "eid-x", day: "2026-10-09", sentAt: clock.t, test: false, replyAt: 0, linkAt: 0 });
  wazzup.windows.add("77044445566");
  assert.equal(await hook(wzInbound({ chatId: "77044445566", text: "Ссылку" })), 200);
  assert.equal(texts()[0].text, LINK_TEXT("https://onai.academy/workshop-montazh/wa"));
});

test("вебхук: «Нет» даёт вежливый отказ и больше этому номеру ничего: ни ссылки, ни нового шаблона", async () => {
  const { w } = await sent1();
  wazzup.windows.add("77022223344");
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Нет", messageId: "no-1" })), 200);
  assert.equal(texts().length, 1);
  assert.equal(texts()[0].text, DECLINE_TEXT);
  assert.equal(texts()[0].text, "Хорошо. Если передумаете, запись на любой день: https://onai.academy/workshop-montazh/");
  // дальше тишина
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Пришлите ссылку", messageId: "no-2" })), 200);
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Нет", messageId: "no-3" })), 200);
  assert.equal(texts().length, 1, "больше ничего");
  // новая заявка с этого номера на другой день: шаблон не уходит
  addLeads(w, [lead({ phone: "77022223344", at: alm(2026, 10, 8, 20, 50) })]);
  clock.t = alm(2026, 10, 9, 10, 0);
  assert.equal((await tick()).sent, 0);
  assert.equal(sentChats().length, 1);
  // отказ помнится после перезапуска
  boot({ dir: w.dir });
  _waRt()!.conn = { state: "open", at: clock.t };
  assert.equal((await tick()).sent, 0);
  assert.equal((dzPanel(alm(2026, 10, 8, 23, 0)).counters as any).declined, 1);
});

test("вебхук: чужие переписки номера (менеджер), свои исходящие, другие каналы и не WhatsApp не вызывают ни одного запроса и не записываются", async () => {
  const { w } = await sent1();
  wazzup.windows.add("77090000000");
  wazzup.windows.add("77022223344");
  const calls = wazzup.calls.length;
  const rows = w.rows().length;
  // клиент менеджера, которому мы шаблон не слали
  assert.equal(await hook(wzInbound({ chatId: "77090000000", text: "Здравствуйте, у меня вопрос по оплате" })), 200);
  assert.equal(await hook(wzInbound({ chatId: "77090000000", text: "Нет" })), 200);
  // наш получатель, но это исходящее (эхо), не WhatsApp, чужой канал
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Пришлите ссылку", isEcho: true })), 200);
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Пришлите ссылку", chatType: "telegram" })), 200);
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Пришлите ссылку", channelId: "99999999-0000-0000-0000-000000000000" })), 200);
  assert.equal(await hook({ messages: [{ chatId: "77022223344", text: "нет isEcho" }, null, 5, "x"], statuses: [{ messageId: "m", status: "delivered" }] }), 200);
  assert.equal(await hook({ contacts: [{ name: "x" }], deals: [] }), 200);
  assert.equal(wazzup.calls.length, calls, "ни одного запроса к Wazzup");
  assert.equal(w.rows().length, rows, "ничего не записано");
  // ответ спустя 48 часов уже не наш
  clock.t += 49 * 3600_000;
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Пришлите ссылку", messageId: "late" })), 200);
  assert.equal(texts().length, 0);
});

test("вебхук: ответ не ушёл по 503, повтор через минуту; ссылка в итоге одна; не 5xx, тревога", async () => {
  const { w } = await sent1();
  wazzup.windows.add("77022223344");
  let n = 0;
  wazzup.fail = (c) => (c.path === "/v3/message" && c.body?.text !== undefined && ++n === 1 ? { status: 503 } : null);
  assert.equal(await hook(wzInbound({ chatId: "77022223344", text: "Пришлите ссылку", messageId: "retry-1" })), 200);
  assert.equal(texts().length, 0);
  clock.t += 61_000;
  await tick();
  assert.equal(texts().length, 1, "повтор через минуту");
  assert.equal(texts()[0].text, LINK_TEXT(linkOf("2026-10-08")));
  clock.t += 61_000;
  await tick();
  assert.equal(texts().length, 1);
  assert.equal(w.rows().filter((r) => r.ev === "link" && r.ok === false).length, 1);
  assert.equal(alarms.length, 0);
});

test("статус шаблона: запись в журнал, одобрение «Вступите в сообщество» радует владельцев один раз, отклонение тоже сообщается; чужие шаблоны только в журнал", async () => {
  const w = boot({ dz: { hookOn: true } });
  const st = (name: string, status: string, guid = TPL_MAIN) => ({ templateStatus: { templateGuid: guid, name, status } });
  assert.equal(await hook(st("Вступите в сообщество", "approved")), 200);
  assert.equal(alarms.filter((a) => /одобрен/.test(a) && /Вступите в сообщество/.test(a)).length, 1);
  assert.equal(await hook(st("Вступите в сообщество", "approved")), 200);
  assert.equal(alarms.filter((a) => /одобрен/.test(a)).length, 1, "повтор статуса не радует второй раз");
  assert.equal(await hook(st("Дозвонились, не в группе", "approved", "tpl-other-0004")), 200);
  assert.equal(alarms.filter((a) => /одобрен/.test(a)).length, 1, "чужие шаблоны владельцев не беспокоят");
  assert.equal(await hook(st("Вступите в сообщество", "rejected")), 200);
  assert.equal(alarms.filter((a) => /не прошёл модерацию/.test(a)).length, 1);
  assert.equal(await hook({ templateStatus: [{ guid: "g1", templateName: "Разное", state: "pending" }, 7] }), 200);
  const rows = w.rows().filter((r) => r.ev === "tpl_status");
  assert.deepEqual(rows.map((r) => [r.name, r.status]), [["Вступите в сообщество", "approved"], ["Вступите в сообщество", "approved"], ["Дозвонились, не в группе", "approved"], ["Вступите в сообщество", "rejected"], ["Разное", "pending"]]);
  const jr = w.journal().filter((j) => j.ev === "dz_tpl");
  assert.equal(jr.length, 5);
  const panel = waPanel(clock.t) as any;
  assert.ok(panel.journal.some((j: any) => /Шаблон WABA «Вступите в сообщество»: статус approved/.test(j.text)));
});

// ───────────────────────── вебхук: установка ─────────────────────────

test("установка вебхука: GET, чужой адрес не перезаписывается и владельцам тревога; свой ставится с нужным телом; Wazzup проверяет адрес тестовым POST; снятие только своего", async () => {
  const w = boot({ dz: { enabled: false } });
  // чужой вебхук
  wazzup.hooks = { webhooksUri: "https://crm.example.com/hook?token=SECRETX", subscriptions: { messagesAndStatuses: true } };
  const r1 = await dzHookSet(true);
  assert.equal(r1.ok, false);
  assert.equal(r1.code, "foreign_hook");
  assert.equal(wazzup.of("PATCH", "/v3/webhooks").length, 0, "чужое не перезаписано");
  assert.equal(wazzup.of("GET", "/v3/webhooks").length, 1, "сначала GET");
  assert.deepEqual(wazzup.hooks.webhooksUri, "https://crm.example.com/hook?token=SECRETX");
  assert.equal(alarms.filter((a) => /чужой вебхук/.test(a)).length, 1);
  assert.equal(JSON.stringify([r1, alarms]).includes("SECRETX"), false, "секрет чужого адреса нигде не показан");
  assert.match(alarms[0], /https:\/\/crm\.example\.com\)/, "чужой адрес только до хоста: в пути бывают токены");
  assert.equal(w.state().dozhim.hookOn, false);
  // пустой вебхук: ставим свой
  wazzup.hooks = { webhooksUri: "", subscriptions: {} };
  const r2 = await dzHookSet(true);
  assert.equal(r2.ok, true, r2.message);
  const patch = wazzup.of("PATCH", "/v3/webhooks");
  assert.equal(patch.length, 1);
  assert.deepEqual(patch[0].body, {
    webhooksUri: `${hookBase}?s=${WZ_SECRET}`,
    subscriptions: { messagesAndStatuses: true, contactsAndDealsCreation: false, channelsUpdates: false, templateStatus: true },
  });
  assert.equal(wazzup.hooks.webhooksUri, `${hookBase}?s=${WZ_SECRET}`, "Wazzup принял, его тестовый POST получил 200");
  assert.equal(w.state().dozhim.hookOn, true);
  assert.equal(JSON.stringify(r2).includes(WZ_SECRET), false, "секрет в ответ пульту не попадает");
  assert.equal(logs.join("\n").includes(WZ_SECRET), false);
  assert.equal(w.journal().some((j) => j.ev === "dz_hook" && j.on === true), true);
  // повторная установка поверх своего безопасна
  assert.equal((await dzHookSet(true)).ok, true);
  // снять: свой снимается
  const r3 = await dzHookSet(false);
  assert.equal(r3.ok, true, r3.message);
  assert.equal(wazzup.hooks.webhooksUri, "");
  assert.equal(w.state().dozhim.hookOn, false);
  // чужой не снимается
  wazzup.hooks = { webhooksUri: "https://crm.example.com/hook", subscriptions: {} };
  const r4 = await dzHookSet(false);
  assert.deepEqual([r4.ok, r4.code], [false, "foreign_hook"]);
  assert.equal(wazzup.hooks.webhooksUri, "https://crm.example.com/hook");
  // Wazzup не смог достучаться до адреса: понятная ошибка, вебхук не считается стоящим
  wazzup.hooks = { webhooksUri: "", subscriptions: {} };
  wazzup.testHook = true;
  process.env.WAZZUP_HOOK_URL = "http://127.0.0.1:1/api/wazzup-hook";
  const r5 = await dzHookSet(true);
  assert.deepEqual([r5.ok, r5.code], [false, "wazzup"]);
  assert.equal(w.state().dozhim.hookOn, false);
  // без ключа
  process.env.WAZZUP_HOOK_URL = hookBase;
  delete process.env.WAZZUP_API_KEY;
  assert.equal((await dzHookSet(true)).code, "no_key");
});

test("секрет вебхука без WAZZUP_HOOK_SECRET в .env: создаётся случайный, живёт в состоянии модуля и работает в адресе", async () => {
  delete process.env.WAZZUP_HOOK_SECRET;
  const w = boot({ dz: { enabled: false } });
  assert.equal(await hook({ test: true }, { secret: WZ_SECRET }), 403, "пока секрета нет, любой адрес закрыт");
  assert.equal((await dzHookSet(true)).ok, true);
  const secret = w.state().dozhim.secret;
  assert.match(secret, /^[0-9a-f]{48}$/);
  assert.equal(wazzup.hooks.webhooksUri, `${hookBase}?s=${secret}`);
  assert.equal(await hook({ test: true }, { secret }), 200);
  assert.equal(await hook({ test: true }, { secret: WZ_SECRET }), 403);
});

// ───────────────────────── шаблоны, настройки, включение ─────────────────────────

test("шаблоны: в списке только одобренные; настройки проверяются; соответствие переменных настраивается и сохраняется; включение требует ключи, шаблон и заполненные переменные", async () => {
  wazzup.templates[0].status = "moderation"; // «Вступите в сообщество» ещё на модерации
  const w = boot({ dz: { enabled: false, templateId: "", templateName: "", vars: 0 } });
  const list = (await dzTemplates()) as any;
  assert.equal(list.ok, true);
  assert.deepEqual(list.items.map((t: any) => t.title), ["Напоминание о записи или встрече", "Вступите в сообщество ссылка"], "неодобренные (модерация, отклонён) не предлагаются");
  assert.deepEqual(list.items[0].map.map((m: any) => m.text), ["команда onAI Academy", "воркшопе «Вайб-продакшен»", "20:00 по Алматы"]);
  assert.deepEqual(list.items[1].map, [{ kind: "name" }, { kind: "date" }]);
  assert.equal(list.items[0].vars, 3);
  assert.equal(wazzup.of("GET", "/v3/templates/whatsapp")[0].auth, `Bearer ${WZ_KEY}`);
  // кэш на минуту
  await dzTemplates();
  assert.equal(wazzup.of("GET", "/v3/templates/whatsapp").length, 1);
  // включить без шаблона нельзя
  let on = await dzSetEnabled(true);
  assert.deepEqual([on.ok, on.code], [false, "no_config"]);
  assert.match(on.message, /Выбери шаблон/);
  // неодобренный шаблон не выбирается
  let sv = await dzSave({ templateId: TPL_MAIN });
  assert.deepEqual([sv.ok, sv.code], [false, "not_approved"]);
  sv = await dzSave({ templateId: "нет-такого" });
  assert.deepEqual([sv.ok, sv.code], [false, "not_found"]);
  // проверка полей
  for (const bad of [{ delayMin: -1 }, { delayMin: 1.5 }, { delayMin: 2000 }, { from: "25:00" }, { from: "21:00", to: "09:00" }, { cutoff: "xx" }, { dailyLimit: 0 }, { dailyLimit: 251 }, "строка", null, []]) {
    const r = await dzSave(bad);
    assert.equal(r.ok, false, JSON.stringify(bad));
  }
  assert.equal(w.rt().state.dozhim.delayMin, 30, "ошибка ничего не меняет");
  // переменные: число обязано совпасть, текст не пустой
  sv = await dzSave({ templateId: TPL_REMINDER, map: [{ kind: "name" }, { kind: "date" }] });
  assert.deepEqual([sv.ok, sv.code], [false, "bad_request"]);
  sv = await dzSave({ templateId: TPL_REMINDER, map: [{ kind: "text", text: "" }, { kind: "date" }, { kind: "link" }] });
  assert.equal(sv.ok, false);
  assert.match(sv.message, /\{\{1\}\}/);
  sv = await dzSave({ templateId: TPL_REMINDER, map: [{ kind: "wrong" }, { kind: "date" }, { kind: "link" }] });
  assert.equal(sv.ok, false);
  // выбрали запасной шаблон со значениями по умолчанию и своими настройками
  sv = await dzSave({ templateId: TPL_REMINDER, delayMin: 45, from: "10:00", to: "20:00", cutoff: "19:00", dailyLimit: 150 });
  assert.equal(sv.ok, true, sv.message);
  let st = w.state().dozhim;
  assert.deepEqual([st.templateId, st.templateName, st.vars, st.delayMin, st.from, st.to, st.cutoff, st.dailyLimit], [TPL_REMINDER, "Напоминание о записи или встрече", 3, 45, "10:00", "20:00", "19:00", 150]);
  assert.deepEqual(st.maps[TPL_REMINDER].map((m: any) => m.text), ["команда onAI Academy", "воркшопе «Вайб-продакшен»", "20:00 по Алматы"]);
  // свои тексты
  sv = await dzSave({ templateId: TPL_REMINDER, map: [{ kind: "text", text: "менеджер onAI" }, { kind: "text", text: "эфире" }, { kind: "date" }] });
  assert.equal(sv.ok, true);
  assert.deepEqual(w.state().dozhim.maps[TPL_REMINDER].map((m: any) => m.kind), ["text", "text", "date"]);
  // шаблон со ссылкой: имя, дата, ссылка не нужна
  sv = await dzSave({ templateId: TPL_LINK });
  assert.equal(sv.ok, true);
  assert.equal(w.state().dozhim.templateName, "Вступите в сообщество ссылка");
  assert.deepEqual(w.state().dozhim.maps[TPL_LINK], [{ kind: "name" }, { kind: "date" }]);
  // включить можно, выключить тоже; повтор безопасен
  on = await dzSetEnabled(true);
  assert.equal(on.ok, true, on.message);
  assert.equal(w.state().dozhim.enabled, true);
  assert.equal((await dzSetEnabled(true)).code, "same");
  assert.equal((await dzSetEnabled("да" as any)).code, "bad_request");
  assert.equal((await dzSetEnabled(false)).ok, true);
  assert.equal(w.state().dozhim.enabled, false);
  assert.equal(w.journal().filter((j) => j.ev === "dz_on").length, 1);
  // без ключа Wazzup не включается
  delete process.env.WAZZUP_API_KEY;
  on = await dzSetEnabled(true);
  assert.deepEqual([on.ok, on.code], [false, "no_config"]);
  assert.match(on.message, /WAZZUP_API_KEY/);
  process.env.WAZZUP_API_KEY = WZ_KEY;
  delete process.env.WAZZUP_CHANNEL_ID;
  assert.match((await dzSetEnabled(true)).message, /WAZZUP_CHANNEL_ID/);
  process.env.WAZZUP_CHANNEL_ID = WZ_CHANNEL;
  // Wazzup не отвечает: понятная ошибка
  wazzup.fail = (c) => (c.path === "/v3/templates/whatsapp" ? { status: 500 } : null);
  _dz()!.tpl = null;
  const bad = await dzTemplates(true);
  assert.deepEqual([bad.ok, bad.code], [false, "wazzup"]);
});

test("настроенное соответствие и окно действуют при отправке: свои значения, окно 10:00 до 20:00, задержка 45 минут", async () => {
  const w = boot({
    dz: { templateId: TPL_REMINDER, templateName: "Напоминание о записи или встрече", vars: 3, delayMin: 45, from: "10:00", to: "20:00", maps: { [TPL_REMINDER]: [{ kind: "text", text: "менеджер onAI" }, { kind: "name" }, { kind: "date" }] } },
  });
  members("2026-10-08", []);
  addLeads(w, [lead({ phone: "77018880001", at: alm(2026, 10, 8, 9, 0), name: "Асель" })]);
  clock.t = alm(2026, 10, 8, 9, 50);
  assert.equal((await tick()).sent, 0, "до начала окна");
  clock.t = alm(2026, 10, 8, 10, 0);
  assert.equal((await tick()).sent, 1);
  assert.deepEqual(wazzup.sent[0].templateValues, ["менеджер onAI", "Асель", "сегодня, 8 октября"]);
});

// ───────────────────────── тестовая отправка и команды ─────────────────────────

test("тестовая отправка: на указанный номер, без проверки окна и участников, с лимитом и частотой; кнопка в тесте приносит ссылку", async () => {
  const w = boot({ dz: { enabled: false } });
  assert.deepEqual([(await dzTestSend("123")).ok, (await dzTestSend("123")).code], [false, "bad_number"]);
  assert.equal(wazzup.calls.length, 0);
  clock.t = alm(2026, 10, 8, 3, 0); // ночью тест тоже уходит
  const r = await dzTestSend("8 (701) 555-66-77");
  assert.equal(r.ok, true, r.message);
  assert.match(r.message, /7701\*\*\*6677/);
  assert.equal(r.message.includes("77015556677"), false);
  assert.equal(wazzup.sent.length, 1);
  assert.equal(wazzup.sent[0].chatId, "77015556677");
  assert.deepEqual(wazzup.sent[0].templateValues, ["друг", "сегодня, 8 октября"], "имени нет ни в заявках, ни в контактах: «друг»");
  assert.equal(w.rows().find((x) => x.ev === "send")!.test, true);
  assert.equal(evo.of("/chat/findContacts").length, 0, "тест не зависит от Evolution");
  // слишком часто
  assert.equal((await dzTestSend("77015556677")).code, "rate");
  clock.t += 11_000;
  // лимит суток общий с настоящими отправками
  w.rt().state.dozhim.dailyLimit = 1;
  assert.equal((await dzTestSend("77015556677")).code, "limit");
  w.rt().state.dozhim.dailyLimit = 200;
  // кнопка: ссылка приходит как у настоящей заявки (вебхук не поставлен, но дожим выключен: ответ не обрабатывается)
  wazzup.windows.add("77015556677");
  assert.equal(await hook(wzInbound({ chatId: "77015556677", text: "Пришлите ссылку", messageId: "t-1" })), 200);
  assert.equal(texts().length, 0, "вебхук не стоит и дожим выключен: тишина");
  w.rt().state.dozhim.hookOn = true;
  assert.equal(await hook(wzInbound({ chatId: "77015556677", text: "Пришлите ссылку", messageId: "t-2" })), 200);
  assert.equal(texts().length, 1);
  assert.equal(texts()[0].text, LINK_TEXT(linkOf("2026-10-08")));
  // без шаблона тест не уходит
  w.rt().state.dozhim.templateId = "";
  assert.equal((await dzTestSend("77015556677")).code, "no_config");
});

test("команды владельца: /wa_dozhim показывает состояние, on включает, off выключает, /wa_dozhim_test отправляет тест; справка знает обе; чужим команды не отвечают", async () => {
  const w = boot({ dz: { enabled: false } });
  assert.match(HELP_TEXT, /\/wa_dozhim on\|off/);
  assert.match(HELP_TEXT, /\/wa_dozhim_test/);
  assert.ok(HELP_TEXT.length < 1500);
  const say1 = async (id: number, text: string) => {
    tg.reset();
    await processUpdate({ message: { chat: { id, type: "private" }, from: { id, first_name: "Аня", username: `u${id}` }, text } }, clock.t);
    return tg.texts(id);
  };
  let [reply] = await say1(900, "/wa_dozhim");
  assert.match(reply, /Дожим WABA: выключен/);
  assert.match(reply, /Шаблон: Вступите в сообщество ссылка/);
  assert.match(reply, /Сегодня: кандидатов 0, отправлено 0/);
  [reply] = await say1(900, "/wa_dozhim on");
  assert.match(reply, /Дожим включён/);
  assert.equal(w.state().dozhim.enabled, true);
  [reply] = await say1(900, "/wa_dozhim");
  assert.match(reply, /Дожим WABA: включён/);
  [reply] = await say1(900, "/wa");
  assert.match(reply, /Дожим WABA: включён/);
  [reply] = await say1(900, "/wa_dozhim_test 77011234567");
  assert.match(reply, /Тестовый шаблон/);
  assert.equal(wazzup.sent.length, 1);
  [reply] = await say1(900, "/wa_dozhim_test");
  assert.match(reply, /Номер: только цифры/);
  [reply] = await say1(900, "/wa_dozhim off");
  assert.match(reply, /Дожим выключен/);
  assert.equal(w.state().dozhim.enabled, false);
  // чужой человек команды не видит
  assert.deepEqual(await say1(555, "/wa_dozhim on"), [], "чужим молча");
  assert.equal(w.state().dozhim.enabled, false);
  assert.equal(wazzup.sent.length, 1);
});

// ───────────────────────── пульт ─────────────────────────

test("пульт: счётчики за сегодня, «вступили N из M», последние отправки со статусами и закрытыми номерами; полных номеров и ключей нет", async () => {
  const w = boot({ dz: { hookOn: true } });
  members("2026-10-08", ["77011110000"]);
  members("2026-10-09", []);
  const A = lead({ phone: "77022220001", at: alm(2026, 10, 8, 9, 0) });
  const B = lead({ phone: "77022220002", at: alm(2026, 10, 8, 9, 1) });
  const C = lead({ phone: "77022220003", at: alm(2026, 10, 8, 9, 2) });
  const J = lead({ phone: "77011110000", at: alm(2026, 10, 8, 9, 3) }); // уже вступила
  const RU = lead({ phone: "+7 916 111 22 33", at: alm(2026, 10, 8, 9, 4) });
  const LATE = lead({ phone: "77022220009", at: alm(2026, 10, 8, 11, 50) });
  addLeads(w, [A, B, C, J, RU, LATE]);
  assert.equal((await tick()).sent, 3);
  // A нажал кнопку и получил ссылку, B сказал «Нет», C молчит, потом C вступил по ссылке с сайта
  wazzup.windows.add("77022220001");
  wazzup.windows.add("77022220002");
  assert.equal(await hook(wzInbound({ chatId: "77022220001", text: "Пришлите ссылку", messageId: "p1" })), 200);
  assert.equal(await hook(wzInbound({ chatId: "77022220002", text: "Нет", messageId: "p2" })), 200);
  members("2026-10-08", ["77011110000", "77022220003"]);
  clock.t += 11 * 60_000;
  await tick();
  const p = dzPanel(clock.t) as any;
  assert.equal(p.available, true);
  assert.deepEqual(p.counters, { candidates: 4, waiting: 1, waitingMeasure: 0, sent: 3, replied: 2, links: 1, joinedAfter: 1, declined: 1, failed: 0 });
  assert.deepEqual(p.limit, { used: 3, max: 200 });
  const d8 = p.days.find((x: any) => x.day === "2026-10-08");
  assert.deepEqual([d8.applied, d8.joined, d8.dayLabel], [6, 2, "08.10"], "вступили 2 из 6 записавшихся на этот день (включая российский номер)");
  assert.equal(p.recent.length, 3);
  assert.deepEqual(p.recent.map((r: any) => [r.who, r.status, r.tone]), [
    ["7702***0003", "вступил", "ok"],
    ["7702***0002", "отказался", "mute"],
    ["7702***0001", "получил ссылку", "ok"],
  ]);
  assert.deepEqual(p.template, { id: TPL_LINK, name: "Вступите в сообщество ссылка", vars: 2 });
  assert.deepEqual(p.map, [{ kind: "name" }, { kind: "date" }]);
  assert.deepEqual(p.webhook, { on: true, url: hookBase, secretInEnv: true });
  assert.deepEqual(p.configured, { key: true, channel: true });
  // пульт в целом: блок есть, номеров и ключей в нём нет
  const full = waPanel(clock.t) as any;
  assert.equal(full.dozhim.available, true);
  // «Вступили N из M записавшихся на этот день» в карточке сообщества дня
  assert.deepEqual([full.current.signups.day, full.current.signups.applied, full.current.signups.joined], ["2026-10-08", 6, 2]);
  assert.deepEqual([full.next.signups.day, full.next.signups.applied, full.next.signups.joined], ["2026-10-09", 0, 0]);
  const dump = JSON.stringify(full);
  const mine = JSON.stringify({ dozhim: full.dozhim, journal: full.journal });
  assert.equal(/\b77\d{9}\b/.test(mine), false, "полных номеров нет в блоке дожима и журнале (контакт менеджера в тексте серии это публичная ссылка)");
  assert.equal(dump.includes(WZ_KEY) || dump.includes(WZ_SECRET) || dump.includes(EVO_KEY), false, "ключей нет");
  // 30 последних отправок
  addLeads(w, Array.from({ length: 40 }, (_, i) => lead({ phone: `7703000${String(1000 + i)}`, at: alm(2026, 10, 8, 9, 5 + (i % 40)) })));
  clock.t += 11 * 60_000;
  for (let i = 0; i < 3; i++) await tick();
  assert.equal((dzPanel(clock.t) as any).recent.length, 30);
  // неполадка файла заявок: понятная причина и ничего не отправляется
  process.env.LEADS_LOG_PATH = join(w.dir, "нет-такого.jsonl");
  resetAdminCache();
  const bad = dzPanel(clock.t) as any;
  assert.match(bad.reason, /Заявки недоступны/);
  const before = wazzup.sent.length;
  clock.t += 11 * 60_000;
  assert.equal((await tick()).sent, 0);
  assert.equal(wazzup.sent.length, before);
});

test("пульт: нет готового сообщества на день заявок, причина видна, шаблон не уходит; живой эфир считает заявки по дню эфира", async () => {
  // сообщества на 9 октября нет, заявка на 9 октября ждёт
  const w = boot({ targets: ["2026-10-08"] });
  members("2026-10-08", []);
  addLeads(w, [lead({ phone: "77022221111", at: alm(2026, 10, 8, 21, 0) })]);
  clock.t = alm(2026, 10, 9, 10, 0);
  // 9 октября: сообщество 8-го закрыто, целей нет вовсе
  assert.equal((await tick()).sent, 0);
  const p = dzPanel(clock.t) as any;
  assert.match(p.reason, /Нет готового сообщества с замером на 09\.10/);
  assert.equal(p.counters.waitingMeasure, 1);
  assert.equal(wazzup.sent.length, 0);

  // живой эфир на 12 октября: все заявки с начала набора относятся к нему
  wazzup.reset();
  wazzup.templates[0].status = "approved";
  const w2 = boot({
    mode: "event",
    targets: ["2026-10-12"],
    event: { date: "2026-10-12", start: "20:00", recruitFrom: "2026-10-07" },
    dz: { cutoff: "19:30" },
  });
  clock.t = alm(2026, 10, 8, 12, 0);
  members("2026-10-12", ["77033330000"]);
  addLeads(w2, [lead({ phone: "77033330000", at: alm(2026, 10, 8, 10, 0), name: "Вступила" }), lead({ phone: "77033330001", at: alm(2026, 10, 8, 10, 1), name: "Нет" })]);
  const r = await tick();
  assert.equal(r.sent, 1);
  assert.equal(wazzup.sent[0].chatId, "77033330001");
  assert.deepEqual(wazzup.sent[0].templateValues, ["друг", "в понедельник, 12 октября"], "день недели от дня эфира");
});

test("перезапуск не теряет замер: свежий (до 10 минут) работает, устаревший требует нового замера перед отправкой", async () => {
  const w = boot();
  members("2026-10-08", []);
  members("2026-10-09", []);
  await tick();
  assert.equal(partCalls().length, 2);
  boot({ dir: w.dir });
  _waRt()!.conn = { state: "open", at: clock.t };
  addLeads(w, [lead({ phone: "77022223344", at: alm(2026, 10, 8, 9, 0) })]);
  clock.t += 6 * 60_000;
  const t = await tick();
  assert.equal(partCalls().length, 4, "замер старше 5 минут при наличии кандидатов обновляется");
  assert.equal(t.sent, 1);
});

test("статус шаблона Wazzup: approved, active и «одобрен» годятся; модерация, отклонён, приостановлен нет; незнакомое слово не блокирует, а помечено неизвестным", () => {
  for (const ok of ["approved", "APPROVED", "active", "Одобрен", "enabled"]) assert.equal(approvedOf(ok), true, ok);
  for (const no of ["pending", "moderation", "on_review", "rejected", "paused", "disabled", "inactive", "draft", "отклонён", "на модерации"]) assert.equal(approvedOf(no), false, no);
  for (const unknown of ["", "zzz", "some_new_state"]) assert.equal(approvedOf(unknown), null, unknown || "пусто");
  const list = normalizeTemplates({ templates: [
    { templateGuid: "g1", name: "a_1", title: "А", status: "ACTIVE", text: "Привет, {{1}}! {{2}}" },
    { guid: "g2", templateName: "b", status: "weird", body: { text: "Без переменных" } },
    { id: "g3", name: "c" },
    { name: "без идентификатора", status: "approved" },
    "мусор",
  ] });
  assert.deepEqual(list.map((t) => [t.id, t.approved, t.vars]), [["g1", true, 2], ["g2", null, 0], ["g3", null, null]]);
  assert.deepEqual(normalizeTemplates(null), []);
  assert.deepEqual(normalizeTemplates({ data: "x" }), []);
});

test("выбор шаблона: только что одобренный шаблон принимается, даже если список в кэше старый (один раз спрашиваем Wazzup заново)", async () => {
  wazzup.templates[0].status = "pending";
  const w = boot({ dz: { enabled: false, templateId: "", templateName: "", vars: 0 } });
  const first = (await dzTemplates()) as any;
  assert.equal(first.items.some((t: any) => t.id === TPL_MAIN), false);
  assert.equal(wazzup.of("GET", "/v3/templates/whatsapp").length, 1);
  const bad = await dzSave({ templateId: TPL_MAIN });
  assert.deepEqual([bad.ok, bad.code], [false, "not_approved"], "Wazzup по-прежнему говорит «на модерации»");
  // одобрили: через несколько секунд выбор проходит без ручного обновления списка
  wazzup.templates[0].status = "approved";
  clock.t += 6000;
  const ok = await dzSave({ templateId: TPL_MAIN });
  assert.equal(ok.ok, true, ok.message);
  assert.equal(w.state().dozhim.templateName, "Вступите в сообщество");
  assert.deepEqual(w.state().dozhim.maps[TPL_MAIN], [{ kind: "name" }, { kind: "date" }], "значения по умолчанию основного шаблона: имя и дата");
});

test("пульт: включённый дожим без вебхука предупреждает; другие причины важнее; с вебхуком причины нет", () => {
  const w = boot();
  const reason = () => (dzPanel(clock.t) as any).reason as string;
  assert.match(reason(), /Вебхук Wazzup не поставлен: ответы людей на шаблон не обрабатываются/);
  w.rt().state.dozhim.hookOn = true;
  assert.equal(reason(), "");
  w.rt().state.dozhim.hookOn = false;
  w.rt().conn = { state: "close", at: clock.t };
  assert.match(reason(), /Сейчас не отправляет: номер не подключён \(close\)/);
});

test("429 у Wazzup: пауза 5 минут для всех заявок (попытки остальных не сгорают), потом все уходят, первая повторяется", async () => {
  const w = boot();
  members("2026-10-08", []);
  addLeads(w, [lead({ phone: "77011112221", at: alm(2026, 10, 8, 9, 0) }), lead({ phone: "77011112222", at: alm(2026, 10, 8, 9, 1) }), lead({ phone: "77011112223", at: alm(2026, 10, 8, 9, 2) })]);
  let n = 0;
  wazzup.fail = (c) => (c.path === "/v3/message" && ++n === 1 ? { status: 429, json: { error: "TOO_MANY_REQUESTS" } } : null);
  const t1 = await tick();
  assert.deepEqual([t1.sent, wazzup.of("POST", "/v3/message").length], [0, 1], "после 429 проход остановлен");
  clock.t += 30_000;
  const t2 = await tick();
  assert.equal(t2.sent, 0, "во время паузы после 429 никому не пишем");
  assert.equal(wazzup.of("POST", "/v3/message").length, 1, "попытки остальных заявок не тратятся");
  clock.t += 5 * 60_000;
  assert.equal((await tick()).sent, 3, "через 5 минут уходят все три, включая повтор первой");
  assert.deepEqual([...sentChats()].sort(), ["77011112221", "77011112222", "77011112223"]);
});

test("замер: участники без номера (только LID) считаются и показываются в пульте, чтобы было видно, сколько вступивших сопоставить нельзя", async () => {
  const w = boot();
  evo.participants.set(sendJidOf("2026-10-08"), [
    { id: "1@lid", phoneNumber: "77011110000@s.whatsapp.net" },
    { id: "2@lid" },
    { id: "3@lid", phoneNumber: "" },
  ]);
  members("2026-10-09", []);
  addLeads(w, [lead({ phone: "77011110000", at: alm(2026, 10, 8, 9, 0) })]);
  await tick();
  const d8 = (dzPanel(clock.t) as any).days.find((x: any) => x.day === "2026-10-08");
  assert.deepEqual([d8.applied, d8.joined, d8.unresolved], [1, 1, 2]);
});

test("ревью 08.10: казахские имена не превращаются в «друг»", () => {
  assert.deepEqual(["Іңкәр", "Әлі", "гүлім", "ҰЛАН"].map(cleanName), ["Іңкәр", "Әлі", "Гүлім", "Ұлан"]);
});

test("ревью 08.10: замер, где участники без номеров (только LID), не принимается, шаблоны не уходят", async () => {
  const w = boot();
  evo.participants.set(sendJidOf("2026-10-08"), Array.from({ length: 25 }, (_, i) => ({ id: `${184467440738000 + i}@lid`, admin: i === 0 ? "superadmin" : null })));
  members("2026-10-09", ["77044444444"]);
  addLeads(w, [lead({ phone: "77099998881", at: alm(2026, 10, 8, 10, 0) })]);
  await tick();
  assert.equal(sentChats().length, 0, "без номеров участников не понять, кто вступил: никому не пишем");
  assert.equal(w.members().targets[idOf("2026-10-08")], undefined, "замер не сохранён");
});

test("команды владельца без пульта: шаблон по названию, окно и лимит, вебхук", async () => {
  boot();
  const list = await dzCommand("wa_dozhim", "tpls");
  assert.match(list, /Напоминание/);
  assert.match(await dzCommand("wa_dozhim", "tpl напоминание"), /./);
  assert.equal(_dz()!.host.state().templateName.includes("Напоминание"), true, "выбран запасной шаблон");
  await dzCommand("wa_dozhim", "set to=19:30 limit=90 delay=30");
  const st = _dz()!.host.state();
  assert.deepEqual([st.to, st.dailyLimit, st.delayMin], ["19:30", 90, 30]);
  assert.match(await dzCommand("wa_dozhim", "set to=25:99"), /Окно часов/);
  assert.match(await dzCommand("wa_dozhim", "set foo=1"), /Не понял/);
  assert.match(await dzCommand("wa_dozhim", "hook on"), /Вебхук Wazzup поставлен/);
  assert.equal(_dz()!.host.state().hookOn, true);
});
