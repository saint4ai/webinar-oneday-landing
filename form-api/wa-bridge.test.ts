/**
 * Тесты моста WhatsApp в бота Instagram AI-менеджера (node:test). Запуск из корня репозитория:
 *   npx --yes tsx --test form-api/wa-bridge.test.ts
 * Evolution и Telegram подменены локальными серверами (wa-testkit.ts), бот тоже: это подставной сервер, который запоминает запросы и
 * отвечает заданным кодом. Время модуля подменено (clock.t), паузы повторов сжаты до миллисекунд. Вебхук Evolution и маршрут
 * /api/wa/send приходят настоящим HTTP на handleWaHook и handleWaSend. Секрет моста здесь тестовый.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createServer, type Server } from "node:http";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setUtcOffsetMinutes } from "./tg-time";
import { DEFAULT_ANSWER, EVO_KEY, evo, openai, OPENAI_KEY, tg } from "./wa-testkit";
import { HELP_TEXT, initTgWorkshop, processUpdate, registerWa, registerWaReport } from "./tg-workshop";
import { _waRt, initWaGroups, resetWaGroups, waCommand, waPause, waReportLine, waResume, waTick } from "./wa-groups";
import { aiFlush, aiSetEnabled, handleWaHook } from "./wa-assistant";
import { _bridge, bridgeIdle, bridgeReset, bridgeStatusText, handleWaSend, startWaBridge } from "./wa-bridge";

const SECRET = "bridge-secret-test-1f3a";
const ALLOWED_IP = "188.137.233.28";

process.env.TG_WORKSHOP_BOT_TOKEN = "WATEST:tgtoken123";
process.env.TG_WORKSHOP_WEBHOOK_SECRET = "wa-test-webhook-secret-0123";
process.env.TG_GO_SECRET = "wa-test-go-secret-987654";
process.env.TG_LINK_OWNER_IDS = "900,901";
process.env.EVOLUTION_API_KEY = EVO_KEY;
process.env.PORT = "4010";
delete process.env.EVOLUTION_INSTANCE;
delete process.env.WA_GROUPS;
delete process.env.WA_TARGET;
delete process.env.WA_ADMIN_NUMBERS;
delete process.env.WA_HOOK_URL;
delete process.env.WA_HOOK_SECRET;
delete process.env.WA_AI_DIR;
delete process.env.WA_AI_MODEL;
delete process.env.WA_BRIDGE_ALLOW_IP;
delete process.env.DATA_DIR;

const REPO = process.cwd();
const WA_SERIES = join(REPO, "form-api", "wa-series.json");
const TG_SERIES = join(REPO, "form-api", "tg-series.json");
const tmp = () => mkdtempSync(join(tmpdir(), "wa-bridge-test-"));
const alm = (y: number, m: number, d: number, h: number, mi = 0, s = 0) => Date.UTC(y, m - 1, d, h - 5, mi, s);
const clock = { t: alm(2026, 10, 9, 12, 0) };
const alarms: string[] = [];
const DAY = 24 * 3600_000;
const readJsonl = (file: string): any[] => (existsSync(file) ? readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Подпись, посчитанная в тесте независимо от кода моста. */
const hmac = (raw: string, secret = SECRET) => createHmac("sha256", secret).update(raw).digest("hex");

// ───────────────────────── подставной бот ─────────────────────────

type BotCall = { path: string; sig: string | undefined; contentType: string | undefined; raw: string; body: any };
type BotAnswer = { status?: number; text?: string; hang?: boolean; delay?: number };
const bot = {
  server: null as Server | null,
  calls: [] as BotCall[],
  handler: ((_c: BotCall, _n: number) => ({ status: 200, text: "ok" })) as (c: BotCall, n: number) => BotAnswer,
  async start() {
    this.server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", async () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        let body: any = null;
        try {
          body = JSON.parse(raw);
        } catch {
          body = null;
        }
        const call: BotCall = { path: req.url || "", sig: req.headers["x-wa-signature"] as string | undefined, contentType: req.headers["content-type"], raw, body };
        this.calls.push(call);
        const a = this.handler(call, this.calls.length);
        if (a.delay) await wait(a.delay);
        if (a.hang) return void req.socket.destroy();
        res.writeHead(a.status ?? 200, { "Content-Type": "text/plain" });
        res.end(a.text ?? "ok");
      });
    });
    await new Promise<void>((r) => this.server!.listen(0, "127.0.0.1", r));
    process.env.WA_BRIDGE_URL = `http://127.0.0.1:${(this.server!.address() as { port: number }).port}/wa/inbound`;
  },
  async stop() {
    await new Promise<void>((r) => {
      this.server!.closeAllConnections?.();
      this.server!.close(() => r());
    });
  },
  reset() {
    this.calls = [];
    this.handler = () => ({ status: 200, text: "ok" });
  },
};

let hookServer: Server;
let hookPort = 0;
let sendServer: Server;
let sendPort = 0;

const listen = async (handler: typeof handleWaHook): Promise<{ server: Server; port: number }> => {
  const server = createServer((req, res) => {
    handler(req, res).catch(() => {
      res.statusCode = 500;
      res.end();
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return { server, port: (server.address() as { port: number }).port };
};

test.before(async () => {
  await tg.start();
  await evo.start();
  await openai.start();
  await bot.start();
  ({ server: hookServer, port: hookPort } = await listen(handleWaHook));
  ({ server: sendServer, port: sendPort } = await listen(handleWaSend));
});
test.after(async () => {
  bridgeReset(true);
  resetWaGroups();
  registerWa(null);
  registerWaReport(null);
  for (const s of [hookServer, sendServer]) {
    await new Promise<void>((r) => {
      s.closeAllConnections?.();
      s.close(() => r());
    });
  }
  await bot.stop();
  await tg.stop();
  await evo.stop();
  await openai.stop();
  assert.deepEqual(evo.violations, [], "защита номера: ни одного сообщения людям вне ответов моста и ассистента и ни одного добавления участников");
});
test.beforeEach(() => {
  setUtcOffsetMinutes(300);
  tg.reset();
  evo.reset();
  openai.reset();
  bot.reset();
  clock.t = alm(2026, 10, 9, 12, 0);
  alarms.length = 0;
  process.env.OPENAI_API_KEY = OPENAI_KEY;
  process.env.WA_AI_QUIET_MS = "100000";
  process.env.WA_BRIDGE = "on";
  process.env.WA_BRIDGE_SECRET = SECRET;
  process.env.WA_BRIDGE_RETRY_MS = "5,10";
  process.env.WA_BRIDGE_MEDIA_RETRY_MS = "5";
  delete process.env.WA_BRIDGE_IMAGES;
  delete process.env.WA_ADMIN_NUMBERS;
});

/** Свежие данные и модуль WhatsApp, как в wa-assistant.test.ts. Мост подписан на вебхук. */
function boot(o: { dir?: string } = {}) {
  const dir = o.dir || tmp();
  if (!o.dir) writeFileSync(join(dir, "wa-state.json"), JSON.stringify({ v: 1, mode: "daily", daily: { enabled: false } }));
  const tgs = JSON.parse(readFileSync(TG_SERIES, "utf8"));
  tgs.firstDay = "2026-09-01";
  tgs.skipDays = [];
  const tgPath = join(dir, "tg-series.json");
  writeFileSync(tgPath, JSON.stringify(tgs));
  process.env.TG_SERIES_FILE = tgPath;
  delete process.env.TG_BOT;
  initTgWorkshop({ dir, seriesFile: tgPath });
  resetWaGroups();
  initWaGroups({
    dir,
    seriesFile: WA_SERIES,
    deps: { now: () => clock.t, sleep: async () => {}, rand: () => 0, notify: async (text: string) => (alarms.push(text), 1) },
  });
  registerWa((cmd, args, now) => waCommand(cmd, args, now));
  registerWaReport((day) => waReportLine(day));
  bridgeReset();
  startWaBridge();
  return {
    dir,
    state: () => JSON.parse(readFileSync(join(dir, "wa-state.json"), "utf8")),
    journal: () => readJsonl(join(dir, "wa-bridge.jsonl")),
    sent: () => readJsonl(join(dir, "wa-bridge-sent.jsonl")),
    moduleJournal: () => readJsonl(join(dir, "wa-journal.jsonl")),
  };
}

/** Модуль запущен, тик отработал: при включённом мосте вебхук Evolution стоит и секрет вебхука создан. Ответы людям разрешены. */
async function up(o: { dir?: string } = {}) {
  const w = boot(o);
  await waTick();
  evo.allowDirect = true;
  evo.directs.length = 0;
  return w;
}

let seq = 0;
const P1 = "77015556677@s.whatsapp.net";
const P2 = "77029998877@s.whatsapp.net";
const LID = "184467440737095@lid";
type UpsertOpts = { fromMe?: boolean; id?: string; ts?: number; pushName?: string; key?: Record<string, unknown>; data?: Record<string, unknown> };
const upsert = (jid: string, message: any, o: UpsertOpts = {}) => ({
  event: "messages.upsert",
  instance: "workshop",
  data: {
    key: { remoteJid: jid, fromMe: !!o.fromMe, id: o.id ?? `MID${++seq}`, ...(o.key || {}) },
    pushName: o.pushName ?? (o.fromMe ? "Номер воркшопа" : "Аня"),
    message,
    messageTimestamp: Math.floor((o.ts ?? clock.t) / 1000),
    source: "android",
    ...(o.data || {}),
  },
});
const text = (jid: string, t: string, o: UpsertOpts = {}) => upsert(jid, { conversation: t }, o);

async function hook(w: ReturnType<typeof boot>, body: unknown, o: { secret?: string | null } = {}) {
  const secret = o.secret === undefined ? w.state().assistant?.secret : o.secret;
  const res = await fetch(`http://127.0.0.1:${hookPort}/api/wa-hook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(secret ? { "X-Wa-Hook-Secret": secret } : {}) },
    body: JSON.stringify(body),
  });
  await res.arrayBuffer();
  return res.status;
}
/** Вебхук пришёл, мост доработал. */
async function deliver(w: ReturnType<typeof boot>, body: unknown) {
  assert.equal(await hook(w, body), 200);
  await bridgeIdle();
}

type SendOpts = { sig?: string | null; ip?: string | null; headers?: Record<string, string>; raw?: string };
async function sendReq(obj: unknown, o: SendOpts = {}) {
  const raw = o.raw ?? JSON.stringify(obj);
  const sig = o.sig === undefined ? hmac(raw) : o.sig;
  const ip = o.ip === undefined ? ALLOWED_IP : o.ip;
  const res = await fetch(`http://127.0.0.1:${sendPort}/api/wa/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(sig ? { "X-Wa-Signature": sig } : {}), ...(ip ? { "X-Real-IP": ip } : {}), ...(o.headers || {}) },
    body: raw,
  });
  const txt = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(txt);
  } catch {
    json = null;
  }
  return { status: res.status, json };
}
const KEY1 = "a".repeat(39) + "1";
const reply = (key = KEY1, extra: Record<string, unknown> = {}) => ({ number: "77011234567", text: "Здравствуйте! Эфир сегодня в 20:00 по Алматы.", key, ...extra });

// ───────────────────────── подпись ─────────────────────────

test("подпись: HMAC-SHA256 от сырого тела совпадает с эталоном (openssl), верная проходит, неверная, пустая и не-hex дают 403", async () => {
  // Эталон посчитан независимо: printf '%s' '<тело>' | openssl dgst -sha256 -hmac bridge-secret-test-1f3a
  const body = '{"number":"77011234567","text":"Hello","key":"abcdef0123456789"}';
  assert.equal(_bridge.sign(body), "2c1f66422ae5fe8cfa47358aac7842967bbecc7ccc1112eb89afeb52c9eba975");
  assert.equal(_bridge.sign(Buffer.from(body, "utf8")), _bridge.sign(body));
  assert.equal(hmac(body), _bridge.sign(body));
  assert.equal(_bridge.signatureOk(Buffer.from(body), _bridge.sign(body)), true);
  assert.equal(_bridge.signatureOk(Buffer.from(body), _bridge.sign(body).toUpperCase()), true, "hex без учёта регистра");
  assert.equal(_bridge.signatureOk(Buffer.from(body + " "), _bridge.sign(body)), false, "другое тело");

  await up();
  const obj = JSON.parse(body);
  const ok = await sendReq(obj, { raw: body });
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
  assert.equal(evo.directs.length, 1);

  const before = evo.directs.length;
  const other = { ...obj, key: "abcdef0123456780" };
  for (const [name, sig] of [["чужая подпись", hmac(JSON.stringify(other), "other-secret")], ["подпись другого тела", hmac(body)], ["пустая", ""], ["нет заголовка", null], ["не hex", "z".repeat(64)], ["короткая", "abcd"]] as const) {
    const r = await sendReq(other, { sig: sig as string | null });
    assert.equal(r.status, 403, name);
  }
  assert.equal(evo.directs.length, before, "отклонённые запросы ничего не отправили");
});

// ───────────────────────── пересылка: вход ─────────────────────────

test("пересылка: личное сообщение уходит боту с точным телом и верной подписью сырого тела", async () => {
  const w = await up();
  await deliver(w, text(P1, "Здравствуйте, когда эфир?", { id: "ABC123", ts: alm(2026, 10, 9, 12, 0, 7) }));
  assert.equal(bot.calls.length, 1);
  const c = bot.calls[0];
  assert.equal(c.path, "/wa/inbound");
  assert.equal(c.contentType, "application/json");
  assert.equal(c.sig, hmac(c.raw), "подпись от сырого тела совпадает с эталоном");
  assert.deepEqual(c.body, {
    source: "wa-bridge",
    jid: P1,
    number: "77015556677",
    name: "Аня",
    id: "ABC123",
    ts: Math.floor(alm(2026, 10, 9, 12, 0, 7) / 1000),
    fromMe: false,
    text: "Здравствуйте, когда эфир?",
    media: null,
  });
  assert.equal(c.body.fromMe === false, true, "fromMe это булево, не строка");
  assert.equal(typeof c.body.ts, "number");
  // ответ и цитата: текст как его видит человек
  await deliver(w, upsert(P1, { extendedTextMessage: { text: "А точно в 20:00?" } }));
  await deliver(w, upsert(P1, { buttonsResponseMessage: { selectedDisplayText: "Да" } }));
  assert.deepEqual(bot.calls.slice(1).map((x) => x.body.text), ["А точно в 20:00?", "Да"]);
});

test("пересылка: группа, сообщество, рассылка, канал, статус и сообщения без содержимого не уходят", async () => {
  const w = await up();
  for (const jid of ["120363111111111111@g.us", "120363222222222222@g.us", "77015556677@broadcast", "status@broadcast", "120363333333333333@newsletter", "77015556677:12@c.us"]) {
    await deliver(w, text(jid, "не личка"));
    await deliver(w, text(jid, "не личка, свои", { fromMe: true }));
  }
  await deliver(w, upsert(P1, { reactionMessage: { text: "👍" } }));
  await deliver(w, upsert(P1, { protocolMessage: { type: 14, editedMessage: { conversation: "правка" } } }));
  await deliver(w, upsert(P1, { stickerMessage: { mimetype: "image/webp" } }));
  await deliver(w, upsert(P1, { conversation: "   " }));
  await deliver(w, { event: "connection.update", instance: "workshop", data: { state: "open" } });
  await deliver(w, { ...text(P1, "чужой инстанс"), instance: "other" });
  assert.equal(bot.calls.length, 0);
  assert.equal(w.journal().filter((r) => r.ev === "fwd").length, 0);
});

test("пересылка: свои сообщения (fromMe) уходят, с булевым true и без имени собеседника; устройство в JID отбрасывается; повтор вебхука шлёт один раз", async () => {
  const w = await up();
  await deliver(w, text(P1, "Ответ с телефона менеджера", { fromMe: true, id: "OUT1" }));
  assert.equal(bot.calls.length, 1);
  assert.equal(bot.calls[0].body.fromMe, true);
  assert.equal(bot.calls[0].body.name, "", "pushName своего сообщения это имя нашего номера, не человека");
  assert.equal(bot.calls[0].body.jid, P1);
  await deliver(w, text("77015556677:7@s.whatsapp.net", "С другого устройства", { id: "DEV1" }));
  assert.equal(bot.calls[1].body.jid, P1);
  const dup = text(P2, "Повтор вебхука", { id: "SAME1" });
  await deliver(w, dup);
  await deliver(w, dup);
  assert.equal(bot.calls.filter((c) => c.body.id === "SAME1").length, 1);
});

test("пересылка: номер у @lid. Телефон берётся из remoteJidAlt или senderPn; не нашёлся, значит number пустая строка, а jid уходит как есть", async () => {
  const w = await up();
  await deliver(w, text(LID, "Пишу с lid без телефона", { id: "L1" }));
  await deliver(w, text(LID, "С remoteJidAlt", { id: "L2", key: { remoteJidAlt: "77015556677@s.whatsapp.net" } }));
  await deliver(w, text(LID, "С senderPn в ключе", { id: "L3", key: { senderPn: "77029998877@s.whatsapp.net" } }));
  await deliver(w, text(LID, "С senderPn в данных", { id: "L4", data: { senderPn: "77031112233@s.whatsapp.net" } }));
  await deliver(w, text(LID, "Alt не телефон", { id: "L5", key: { remoteJidAlt: "184467440737095@lid" } }));
  await deliver(w, text(LID, "Alt короткий", { id: "L6", key: { remoteJidAlt: "12345@s.whatsapp.net" } }));
  await deliver(w, text("12345678@s.whatsapp.net", "Короткий JID не телефон", { id: "L7" }));
  const byId = Object.fromEntries(bot.calls.map((c) => [c.body.id, c.body]));
  assert.deepEqual([byId.L1.jid, byId.L1.number], [LID, ""]);
  assert.equal(byId.L1.number === "", true);
  assert.deepEqual([byId.L2.jid, byId.L2.number], [LID, "77015556677"]);
  assert.equal(byId.L3.number, "77029998877");
  assert.equal(byId.L4.number, "77031112233");
  assert.equal(byId.L5.number, "");
  assert.equal(byId.L6.number, "");
  assert.equal(byId.L7.number, "");
  // сообщения без телефона уходят, а в состоянии видно, сколько их было
  assert.match(bridgeStatusText(), /без телефона \(lid\) 4/);
  assert.equal(w.journal().filter((r) => r.nonum).length, 4);
});

test("пересылка: голосовое уходит с base64, mime и seconds; файл берётся у Evolution по ключу и содержимому сообщения", async () => {
  const w = await up();
  const b64 = Buffer.from("OggS-test-voice-bytes").toString("base64");
  evo.media.set("VOICE1", { mimetype: "audio/ogg; codecs=opus", base64: b64 });
  await deliver(w, upsert(P1, { audioMessage: { mimetype: "audio/ogg; codecs=opus", seconds: 12, ptt: true, fileLength: "20480", mediaKey: { 0: 1, 1: 2 } } }, { id: "VOICE1" }));
  assert.equal(bot.calls.length, 1);
  assert.deepEqual(bot.calls[0].body.media, { type: "audio", mime: "audio/ogg", base64: b64, seconds: 12 });
  assert.equal(bot.calls[0].body.text, "");
  const asked = evo.of("/chat/getBase64FromMediaMessage");
  assert.equal(asked.length, 1);
  assert.equal(asked[0].body.message.key.id, "VOICE1");
  assert.ok(asked[0].body.message.message.audioMessage, "в Evolution уходит содержимое сообщения: вебхук приходит раньше записи в его базу");
  assert.equal(asked[0].body.convertToMp4, false);
  assert.equal(bot.calls[0].sig, hmac(bot.calls[0].raw), "подпись и с большим телом верна");
});

test("пересылка: голосовое, которое Evolution не отдал или оно больше 10 МБ, уходит без base64, но не теряется", async () => {
  const w = await up();
  await deliver(w, upsert(P1, { audioMessage: { mimetype: "audio/ogg; codecs=opus", seconds: 5, fileLength: 1000 } }, { id: "VOICE2" }));
  assert.deepEqual(bot.calls[0].body.media, { type: "audio", mime: "audio/ogg", seconds: 5 });
  assert.equal(evo.of("/chat/getBase64FromMediaMessage").length, 2, "две попытки");
  assert.ok(w.journal().some((r) => r.ev === "media" && r.ok === false));

  evo.calls.length = 0;
  evo.media.set("VOICE3", { mimetype: "audio/ogg", base64: "AAAA" });
  await deliver(w, upsert(P1, { audioMessage: { mimetype: "audio/ogg", seconds: 600, fileLength: 11 * 1024 * 1024 } }, { id: "VOICE3" }));
  assert.equal(evo.of("/chat/getBase64FromMediaMessage").length, 0, "по объявленному размеру файл не качаем");
  assert.equal("base64" in bot.calls[1].body.media, false);

  // после скачивания размер тоже проверяется
  evo.media.set("VOICE4", { mimetype: "audio/ogg", base64: "A".repeat(Math.ceil((10 * 1024 * 1024 * 4) / 3) + 8) });
  await deliver(w, upsert(P1, { audioMessage: { mimetype: "audio/ogg", seconds: 9 } }, { id: "VOICE4" }));
  assert.equal("base64" in bot.calls[2].body.media, false);
});

test("пересылка: фото, видео, файл и кружок уходят только с типом, без base64 и без запросов файла; подпись к фото идёт текстом", async () => {
  const w = await up();
  evo.media.set("IMG1", { mimetype: "image/jpeg", base64: "QUJD" });
  await deliver(w, upsert(P1, { imageMessage: { mimetype: "image/jpeg", caption: "вот скрин", fileLength: 1000 } }, { id: "IMG1" }));
  await deliver(w, upsert(P1, { videoMessage: { mimetype: "video/mp4", seconds: 30 } }, { id: "VID1" }));
  await deliver(w, upsert(P1, { ptvMessage: { mimetype: "video/mp4" } }, { id: "PTV1" }));
  await deliver(w, upsert(P1, { documentMessage: { mimetype: "application/pdf", fileName: "a.pdf" } }, { id: "DOC1" }));
  await deliver(w, upsert(P1, { documentWithCaptionMessage: { message: { documentMessage: { mimetype: "application/pdf", caption: "договор" } } } }, { id: "DOC2" }));
  const by = Object.fromEntries(bot.calls.map((c) => [c.body.id, c.body]));
  assert.deepEqual(by.IMG1.media, { type: "image" });
  assert.equal(by.IMG1.text, "вот скрин");
  assert.deepEqual(by.VID1.media, { type: "video" });
  assert.deepEqual(by.PTV1.media, { type: "video" });
  assert.deepEqual(by.DOC1.media, { type: "document" });
  assert.deepEqual(by.DOC2.media, { type: "document" });
  assert.equal(by.DOC2.text, "договор");
  assert.equal(evo.of("/chat/getBase64FromMediaMessage").length, 0);
});

test("фото с base64 включается одной настройкой WA_BRIDGE_IMAGES=on: до 5 МБ", async () => {
  process.env.WA_BRIDGE_IMAGES = "on";
  const w = await up();
  evo.media.set("IMG2", { mimetype: "image/jpeg", base64: "QUJD" });
  await deliver(w, upsert(P1, { imageMessage: { mimetype: "image/jpeg", fileLength: 1000 } }, { id: "IMG2" }));
  assert.deepEqual(bot.calls[0].body.media, { type: "image", mime: "image/jpeg", base64: "QUJD" });
  await deliver(w, upsert(P1, { imageMessage: { mimetype: "image/jpeg", fileLength: 6 * 1024 * 1024 } }, { id: "IMG3" }));
  assert.deepEqual(bot.calls[1].body.media, { type: "image", mime: "image/jpeg" }, "больше 5 МБ: без base64");
  evo.media.set("IMG4", { mimetype: "image/png", base64: "A".repeat(Math.ceil((5 * 1024 * 1024 * 4) / 3) + 8) });
  await deliver(w, upsert(P1, { imageMessage: { mimetype: "image/png" } }, { id: "IMG4" }));
  assert.equal("base64" in bot.calls[2].body.media, false, "после скачивания размер тоже проверяется");
  // видео и файлы настройка не затрагивает
  await deliver(w, upsert(P1, { videoMessage: { mimetype: "video/mp4" } }, { id: "VID2" }));
  assert.deepEqual(bot.calls[3].body.media, { type: "video" });
});

// ───────────────────────── пересылка: ответы бота ─────────────────────────

test("ответ бота 404: канал выключен у бота, один запрос, без повторов и без тревог", async () => {
  const w = await up();
  bot.handler = () => ({ status: 404, text: "off" });
  await deliver(w, text(P1, "привет"));
  assert.equal(bot.calls.length, 1);
  assert.equal(alarms.length, 0);
  const row = w.journal().find((r) => r.ev === "fwd");
  assert.equal(row.code, 404);
  assert.equal(row.ok, false);
  assert.equal(row.tries, 1);
  assert.match(bridgeStatusText(), /бот выключил канал \(404\) 1/);
  assert.match(bridgeStatusText(), /ошибок 0/);
});

test("ответ бота 5xx или сеть: два повтора (всего три запроса), запись в журнал, тревога не чаще раза в час", async () => {
  const w = await up();
  bot.handler = () => ({ status: 503, text: "boom" });
  await deliver(w, text(P1, "первое", { id: "E1" }));
  assert.equal(bot.calls.length, 3);
  assert.deepEqual(bot.calls.map((c) => c.body.id), ["E1", "E1", "E1"], "повтор того же тела");
  assert.equal(new Set(bot.calls.map((c) => c.raw)).size, 1);
  const row = w.journal().find((r) => r.ev === "fwd");
  assert.deepEqual([row.ok, row.code, row.tries, row.id], [false, 503, 3, "E1"]);
  assert.equal(alarms.length, 1);
  assert.match(alarms[0], /Мост WhatsApp в бота/);
  assert.ok(!alarms[0].includes(SECRET));
  assert.ok(!/77015556677/.test(alarms[0]), "в тревоге нет номера");

  await deliver(w, text(P2, "второе", { id: "E2" }));
  assert.equal(bot.calls.length, 6);
  assert.equal(alarms.length, 1, "в тот же час повторной тревоги нет");
  clock.t += 61 * 60_000;
  await deliver(w, text(P2, "третье", { id: "E3" }));
  assert.equal(alarms.length, 2, "через час тревога снова");

  // сеть: бот оборвал соединение; на третьей попытке отвечает
  bot.calls.length = 0;
  bot.handler = (_c, n) => (n < 3 ? { hang: true } : { status: 200, text: "ok" });
  await deliver(w, text(P1, "после обрыва", { id: "E4" }));
  assert.equal(bot.calls.length, 3);
  const last = w.journal().filter((r) => r.ev === "fwd").pop();
  assert.deepEqual([last.ok, last.code, last.tries], [true, 200, 3]);
  // сеть совсем недоступна
  bot.calls.length = 0;
  bot.handler = () => ({ hang: true });
  alarms.length = 0;
  clock.t += 61 * 60_000;
  await deliver(w, text(P1, "сеть лежит", { id: "E5" }));
  assert.equal(bot.calls.length, 3);
  const dead = w.journal().filter((r) => r.ev === "fwd").pop();
  assert.deepEqual([dead.ok, dead.code, dead.tries], [false, 0, 3]);
  assert.match(alarms[0], /не отвечает/);
});

test("ответ бота 403 (неверная подпись) и прочие 4xx: без повторов, тревога без значения секрета", async () => {
  const w = await up();
  bot.handler = () => ({ status: 403, text: "bad signature" });
  await deliver(w, text(P1, "привет"));
  assert.equal(bot.calls.length, 1);
  assert.equal(alarms.length, 1);
  assert.match(alarms[0], /403/);
  assert.match(alarms[0], /WA_BRIDGE_SECRET/);
  assert.ok(!alarms.join("\n").includes(SECRET));
  bot.handler = () => ({ status: 400, text: "bad" });
  await deliver(w, text(P1, "ещё"));
  assert.equal(bot.calls.length, 2, "400 не повторяется");
});

test("порядок: сообщения одного человека уходят по очереди, медленный бот не обгоняется", async () => {
  const w = await up();
  bot.handler = (_c, n) => (n === 1 ? { delay: 80 } : {});
  assert.equal(await hook(w, text(P1, "раз", { id: "O1" })), 200);
  assert.equal(await hook(w, text(P1, "два", { id: "O2" })), 200);
  assert.equal(await hook(w, text(P2, "другой человек", { id: "O3" })), 200);
  await bridgeIdle();
  const ids = bot.calls.map((c) => c.body.id);
  assert.deepEqual(ids.filter((x) => x !== "O3"), ["O1", "O2"]);
  assert.ok(ids.indexOf("O3") < ids.indexOf("O2"), "очередь по человеку: другой чат не ждёт");
});

// ───────────────────────── выключатели ─────────────────────────

test("мост выключен (WA_BRIDGE=off или не задан): ничего не уходит боту, /api/wa/send отвечает 404, вебхук из-за моста не ставится", async () => {
  process.env.WA_BRIDGE = "off";
  const w = await up();
  assert.equal(evo.webhook, null, "ассистент выключен и мост выключен: вебхука нет");
  assert.equal((await aiSetEnabled(true)).ok, true);
  await deliver(w, text(P1, "привет"));
  assert.equal(bot.calls.length, 0);
  assert.equal(w.journal().length, 0);
  const r = await sendReq(reply());
  assert.equal(r.status, 404);
  assert.equal(evo.directs.length, 0);
  assert.match(bridgeStatusText(), /выключен/);
  // не задан совсем
  delete process.env.WA_BRIDGE;
  await deliver(w, text(P1, "ещё"));
  assert.equal(bot.calls.length, 0);
  assert.equal((await sendReq(reply())).status, 404);
  // включён, но секрета нет: тоже не работает
  process.env.WA_BRIDGE = "on";
  delete process.env.WA_BRIDGE_SECRET;
  await deliver(w, text(P1, "без секрета"));
  assert.equal(bot.calls.length, 0);
  assert.equal((await sendReq(reply(), { sig: hmac(JSON.stringify(reply()), "") })).status, 404, "подпись пустым секретом не проходит");
  assert.match(bridgeStatusText(), /нет WA_BRIDGE_SECRET/);
});

test("мост включён, ассистент никогда не включался: тик ставит вебхук Evolution с секретом, личка уходит боту; /wa_ai off вебхук не снимает", async () => {
  const w = await up();
  assert.equal(evo.webhook?.enabled, true);
  assert.deepEqual(evo.webhook?.events, ["MESSAGES_UPSERT"]);
  assert.match(w.state().assistant.secret, /^[0-9a-f]{48}$/);
  assert.equal(evo.webhook?.headers?.["X-Wa-Hook-Secret"], w.state().assistant.secret);
  assert.equal(w.state().assistant.enabled, false);
  assert.ok(w.moduleJournal().some((j) => j.ev === "bridge_hook_on"));
  await deliver(w, text(P1, "Ассистент выключен, мост работает"));
  assert.equal(bot.calls.length, 1);
  assert.equal(openai.calls.length, 0, "ассистент молчит и в OpenAI не ходит");
  assert.equal(evo.directs.length, 0);

  // ассистента включили и выключили: вебхук остаётся, пока он нужен мосту
  assert.equal((await aiSetEnabled(true)).ok, true);
  const off = await aiSetEnabled(false);
  assert.equal(off.ok, true, off.message);
  assert.match(off.message, /нужен мосту/);
  assert.equal(evo.webhook?.enabled, true);
  assert.equal(w.state().assistant.hookOn, true);
  assert.equal((await aiSetEnabled(false)).code, "same");
  await deliver(w, text(P1, "После /wa_ai off"));
  assert.equal(bot.calls.length, 2);
  assert.equal(openai.calls.length, 0);

  // мост выключили (.env и перезапуск): ближайший тик снимает вебхук, как до моста
  process.env.WA_BRIDGE = "off";
  clock.t += 2 * 60_000;
  await waTick();
  assert.equal(evo.webhook?.enabled, false);
  assert.equal(w.state().assistant.hookOn, false);
});

// ───────────────────────── wa-assistant рядом с мостом ─────────────────────────

test("wa-assistant отвечает как раньше при включённом мосте: ответ ушёл человеку, боту пришли и вопрос, и ответ (fromMe); падение бота ассистента не задевает", async () => {
  const w = await up();
  assert.equal((await aiSetEnabled(true)).ok, true);
  evo.directs.length = 0;
  bot.handler = () => ({ status: 500, text: "бот лежит" });
  assert.equal(await hook(w, text(P1, "Когда эфир?", { id: "Q1" })), 200);
  await aiFlush();
  await bridgeIdle();
  assert.equal(evo.directs.length, 1, "ассистент ответил");
  assert.equal(evo.directs[0].to, P1);
  assert.equal(evo.directs[0].text, DEFAULT_ANSWER);
  assert.equal(bot.calls.length, 3, "бот лежит: три попытки, ассистент от этого не зависит");
  assert.equal(w.journal().filter((r) => r.ev === "fwd")[0].ok, false);

  // бот ожил; эхо ответа ассистента приходит вебхуком fromMe и тоже уходит боту
  bot.handler = () => ({ status: 200, text: "ok" });
  bot.calls.length = 0;
  await deliver(w, text(P1, evo.directs[0].text, { fromMe: true, id: "A1" }));
  assert.deepEqual(bot.calls.map((c) => [c.body.id, c.body.fromMe]), [["A1", true]]);
  // и второй вопрос: оба получают его
  assert.equal(await hook(w, text(P1, "А сколько идёт?", { id: "Q2" })), 200);
  await aiFlush();
  await bridgeIdle();
  assert.equal(evo.directs.length, 2);
  assert.ok(bot.calls.some((c) => c.body.id === "Q2" && c.body.fromMe === false));
  assert.equal(openai.violations.length, 0);
});

// ───────────────────────── POST /api/wa/send ─────────────────────────

test("/api/wa/send: ответ уходит в Evolution на <номер>@s.whatsapp.net, в ответе id сообщения", async () => {
  const w = await up();
  const r = await sendReq(reply());
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.match(r.json.id, /^MSG[0-9]+$/);
  assert.deepEqual(r.json, { ok: true, id: r.json.id });
  assert.equal(evo.directs.length, 1);
  assert.equal(evo.directs[0].to, "77011234567@s.whatsapp.net");
  assert.equal(evo.directs[0].text, "Здравствуйте! Эфир сегодня в 20:00 по Алматы.");
  assert.equal(evo.directs[0].linkPreview, false);
  assert.deepEqual(w.sent().map((x) => [x.key, x.id]), [[KEY1, r.json.id]]);
  const row = w.journal().find((x) => x.ev === "send");
  assert.deepEqual([row.key, row.ok, row.id], [KEY1, true, r.json.id]);
});

test("/api/wa/send: чужой IP 403; X-Real-IP главнее; в X-Forwarded-For берётся последний адрес (дописан nginx), а не подделанный первый", async () => {
  await up();
  const k = (n: number) => `${"k".repeat(30)}${String(n).padStart(2, "0")}`;
  assert.equal((await sendReq(reply(k(1)), { ip: "203.0.113.5" })).status, 403);
  assert.equal((await sendReq(reply(k(2)), { ip: null })).status, 403, "без заголовков адрес сокета 127.0.0.1 не в списке");
  assert.equal((await sendReq(reply(k(3)), { ip: "203.0.113.5", headers: { "X-Forwarded-For": ALLOWED_IP } })).status, 403, "X-Real-IP главнее");
  assert.equal((await sendReq(reply(k(4)), { ip: null, headers: { "X-Forwarded-For": `${ALLOWED_IP}, 203.0.113.5` } })).status, 403, "подделанный первый адрес");
  assert.equal(evo.directs.length, 0);
  assert.equal((await sendReq(reply(k(5)), { ip: null, headers: { "X-Forwarded-For": ALLOWED_IP } })).status, 200, "один адрес в X-Forwarded-For");
  assert.equal((await sendReq(reply(k(6)), { ip: null, headers: { "X-Forwarded-For": `203.0.113.5, ${ALLOWED_IP}` } })).status, 200);
  assert.equal((await sendReq(reply(k(7)), { ip: `::ffff:${ALLOWED_IP}` })).status, 200);
  assert.equal(evo.directs.length, 3);
  // адрес сокета, когда соединение не с 127.0.0.1, заголовкам не верим
  const fake = (addr: string, headers: Record<string, string>) => ({ socket: { remoteAddress: addr }, headers }) as any;
  assert.equal(_bridge.clientIp(fake("203.0.113.9", { "x-real-ip": ALLOWED_IP, "x-forwarded-for": ALLOWED_IP })), "203.0.113.9");
  assert.equal(_bridge.clientIp(fake("::ffff:127.0.0.1", { "x-real-ip": ALLOWED_IP })), ALLOWED_IP);
  assert.equal(_bridge.clientIp(fake("::1", {})), "::1");
});

test("/api/wa/send: WA_BRIDGE_ALLOW_IP меняет разрешённый адрес", async () => {
  process.env.WA_BRIDGE_ALLOW_IP = "198.51.100.7";
  try {
    await up();
    assert.equal((await sendReq(reply(), { ip: ALLOWED_IP })).status, 403);
    assert.equal((await sendReq(reply(), { ip: "198.51.100.7" })).status, 200);
  } finally {
    delete process.env.WA_BRIDGE_ALLOW_IP;
  }
});

test("/api/wa/send: проверка тела: номер 10-15 цифр, непустой текст до 4000 знаков, ключ", async () => {
  await up();
  const bad = async (patch: Record<string, unknown>, code = 400) => assert.equal((await sendReq({ ...reply(), ...patch })).status, code, JSON.stringify(patch).slice(0, 80));
  await bad({ number: "770112345" });
  await bad({ number: "7701123456789012" });
  await bad({ number: "+77011234567" });
  await bad({ number: "7701123456a" });
  await bad({ number: 77011234567 });
  await bad({ number: undefined });
  await bad({ text: "" });
  await bad({ text: "   \n " });
  await bad({ text: undefined });
  await bad({ text: "я".repeat(4001) });
  await bad({ key: "" });
  await bad({ key: "short" });
  await bad({ key: undefined });
  assert.equal((await sendReq(null, { raw: "не json" })).status, 400);
  assert.equal(evo.directs.length, 0);
  await bad({ number: "7701123456", key: "b".repeat(40) }, 200);
  await bad({ number: "770112345678901", text: "я".repeat(4000), key: "c".repeat(40) }, 200);
  assert.equal(evo.directs.length, 2);
  // слишком большое тело
  assert.equal((await sendReq(null, { raw: JSON.stringify({ ...reply("d".repeat(40)), pad: "x".repeat(70_000) }) })).status, 413);
});

test("/api/wa/send: одинаковый key второй раз не отправляется ({ok:true,dup:true}), в том числе после рестарта; ключи живут 7 дней", async () => {
  const dir = tmp();
  writeFileSync(join(dir, "wa-state.json"), JSON.stringify({ v: 1, mode: "daily", daily: { enabled: false } }));
  let w = await up({ dir });
  const first = await sendReq(reply());
  assert.equal(first.status, 200);
  assert.match(first.json.id, /^MSG[0-9]+$/);
  assert.deepEqual(first.json, { ok: true, id: first.json.id });
  const again = await sendReq(reply());
  assert.deepEqual(again, { status: 200, json: { ok: true, dup: true } });
  assert.equal(evo.directs.length, 1, "второй раз Evolution не вызывался");
  // другой ключ с тем же текстом это другой ответ
  assert.equal((await sendReq(reply("b".repeat(40)))).status, 200);
  assert.equal(evo.directs.length, 2);
  // в файле только ключ и id: ни текста, ни номера
  const file = readFileSync(join(dir, "wa-bridge-sent.jsonl"), "utf8");
  assert.equal(w.sent().length, 2);
  assert.ok(!file.includes("Здравствуйте") && !file.includes("77011234567"));

  // рестарт: память забыта, ключи восстановлены из файла
  bridgeReset();
  w = await up({ dir });
  evo.directs.length = 0;
  assert.deepEqual((await sendReq(reply())).json, { ok: true, dup: true });
  assert.equal(evo.directs.length, 0, "после рестарта повтор не отправлен");

  // семь дней: свежий ключ помнится, восьмидневный забыт и в файле его нет
  writeFileSync(
    join(dir, "wa-bridge-sent.jsonl"),
    [{ ts: clock.t - 8 * DAY, key: "old".padEnd(40, "o"), id: "X1" }, { ts: clock.t - 6 * DAY, key: "new".padEnd(40, "n"), id: "X2" }].map((r) => JSON.stringify(r)).join("\n") + "\n",
  );
  bridgeReset();
  w = await up({ dir });
  evo.directs.length = 0;
  assert.deepEqual((await sendReq(reply("new".padEnd(40, "n")))).json, { ok: true, dup: true });
  assert.equal(evo.directs.length, 0);
  assert.equal((await sendReq(reply("old".padEnd(40, "o")))).json.ok, true);
  assert.equal(evo.directs.length, 1, "ключ старше семи дней отправлен заново");
  assert.deepEqual(w.sent().map((x) => x.key).sort(), ["new".padEnd(40, "n"), "old".padEnd(40, "o")]);
});

test("/api/wa/send: ошибка Evolution даёт 502, ключ не запоминается, повтор отправляет заново", async () => {
  const w = await up();
  evo.fail = (c) => (c.path.startsWith("/message/sendText") ? { status: 500 } : null);
  const bad = await sendReq(reply());
  assert.equal(bad.status, 502);
  assert.equal(bad.json.ok, false);
  assert.equal(typeof bad.json.error, "string");
  assert.ok(!bad.json.error.includes(EVO_KEY) && !bad.json.error.includes(SECRET));
  assert.equal(w.sent().length, 0, "в файл ключ пишется только после успеха");
  const row = w.journal().find((x) => x.ev === "send");
  assert.deepEqual([row.key, row.ok], [KEY1, false]);
  assert.equal(typeof row.error, "string");
  assert.equal(alarms.length, 1);
  evo.fail = null;
  const ok = await sendReq(reply());
  assert.equal(ok.status, 200);
  assert.match(ok.json.id, /^MSG[0-9]+$/);
  assert.equal(evo.directs.length, 1);
  assert.equal(w.sent().length, 1);
});

test("/api/wa/send: два параллельных запроса с одним key отправляют одно сообщение", async () => {
  const w = await up();
  evo.fail = (c) => (c.path.startsWith("/message/sendText") ? { delay: 150 } : null);
  const [a, b] = await Promise.all([sendReq(reply()), sendReq(reply())]);
  assert.deepEqual([a.status, b.status], [200, 200]);
  assert.equal(evo.directs.length, 1, "ушло одно сообщение");
  const dups = [a, b].filter((x) => x.json.dup === true);
  assert.equal(dups.length, 1, "один получил id, второй dup");
  assert.equal([a, b].filter((x) => /^MSG[0-9]+$/.test(x.json.id)).length, 1);
  assert.equal(w.sent().length, 1);
  assert.equal(evo.of("/message/sendText").length, 1);
});

test("/api/wa/send: первая из двух параллельных отправок упала, вторая отправляет сама, сообщение уходит один раз", async () => {
  const w = await up();
  let n = 0;
  evo.fail = (c) => (c.path.startsWith("/message/sendText") && ++n === 1 ? { status: 500, delay: 120 } : null);
  const res = await Promise.all([sendReq(reply()), sendReq(reply())]);
  assert.deepEqual(res.map((x) => x.status).sort(), [200, 502]);
  assert.equal(evo.directs.length, 1);
  assert.equal(w.sent().length, 1);
  assert.equal(res.find((x) => x.status === 200)!.json.dup, undefined, "ответившая сама это не повтор");
});

test("/api/wa/send: модуль на паузе, 502 и ничего не отправлено; после возобновления уходит", async () => {
  await up();
  waPause(clock.t);
  const r = await sendReq(reply());
  assert.equal(r.status, 502);
  assert.match(r.json.error, /пауз/);
  assert.equal(evo.directs.length, 0);
  waResume();
  assert.equal((await sendReq(reply())).status, 200);
  assert.equal(_waRt()!.state.paused, false);
});

// ───────────────────────── журнал и команда ─────────────────────────

test("журнал wa-bridge.jsonl: fwd и send без текстов сообщений, номеров, JID и секрета", async () => {
  const w = await up();
  const SECRET_TEXT = "СЕКРЕТНЫЙ ТЕКСТ ЧЕЛОВЕКА про оплату";
  await deliver(w, text(P1, SECRET_TEXT, { id: "J1" }));
  await sendReq({ ...reply(), text: "СЕКРЕТНЫЙ ОТВЕТ БОТА" });
  bot.handler = () => ({ status: 500 });
  await deliver(w, text(LID, SECRET_TEXT, { id: "J2" }));
  const raw = readFileSync(join(w.dir, "wa-bridge.jsonl"), "utf8");
  for (const bad of ["СЕКРЕТНЫЙ", SECRET, "77015556677", "77011234567", "184467440737095", "Аня"]) assert.ok(!raw.includes(bad), `в журнале не должно быть: ${bad}`);
  const rows = w.journal();
  const fwd = rows.filter((r) => r.ev === "fwd");
  assert.deepEqual(fwd.map((r) => [r.id, r.ok, r.code]), [["J1", true, 200], ["J2", false, 500]]);
  assert.equal(typeof fwd[0].ms, "number");
  assert.equal(rows.filter((r) => r.ev === "send").length, 1);
  assert.equal(JSON.stringify(w.moduleJournal()).includes(SECRET), false);
  assert.equal(JSON.stringify(alarms).includes(SECRET), false);
});

test("команда /wa_bridge: состояние, счётчики за сутки и последний ответ бота; чужим не отвечает; после рестарта счётчики восстановлены из журнала; в справке есть", async () => {
  const w = await up();
  assert.match(HELP_TEXT, /\/wa_bridge/);
  assert.ok(HELP_TEXT.length < 1700);
  const say = async (id: number, t: string) => {
    tg.reset();
    await processUpdate({ message: { chat: { id, type: "private" }, from: { id, first_name: "Аня", username: `u${id}` }, text: t } }, clock.t);
    return tg.texts(id);
  };
  let [msg] = await say(900, "/wa_bridge");
  assert.match(msg, /Мост WhatsApp в бота: включён/);
  assert.match(msg, /за сутки в бота: переслано 0, ошибок 0/i);
  assert.match(msg, /Последний ответ бота: ещё не было/);
  assert.match(msg, /Вебхук Evolution: стоит/);
  assert.ok(!msg.includes(SECRET) && !msg.includes("—"));

  await deliver(w, text(P1, "раз"));
  bot.handler = () => ({ status: 502, text: "bad gateway" });
  await deliver(w, text(P1, "два"));
  bot.handler = () => ({ status: 404, text: "off" });
  await deliver(w, text(P1, "три"));
  await sendReq(reply());
  await sendReq(reply());
  clock.t += 5 * 60_000;
  [msg] = await say(900, "/wa_bridge");
  assert.match(msg, /переслано 1, ошибок 1, бот выключил канал \(404\) 1/);
  assert.match(msg, /отправлено 1, повторов 1, ошибок 0/);
  assert.match(msg, /Последний ответ бота: 404 off, 5 мин назад/);
  assert.match(msg, /Последний запрос от бота: 5 мин назад/);
  const ibot = new URL(process.env.WA_BRIDGE_URL!).host;
  assert.ok(msg.includes(ibot));

  // рестарт процесса: счётчики и время последнего ответа из журнала
  bridgeReset();
  [msg] = await say(900, "/wa_bridge");
  assert.match(msg, /переслано 1, ошибок 1, бот выключил канал \(404\) 1/);
  assert.match(msg, /Последний ответ бота: 404, 5 мин назад/);
  // сутки спустя счётчики обнуляются
  clock.t += 25 * 3600_000;
  [msg] = await say(900, "/wa_bridge");
  assert.match(msg, /переслано 0, ошибок 0, бот выключил канал \(404\) 0/);
  // чужой человек команды не видит
  assert.deepEqual(await say(555, "/wa_bridge"), []);
});
