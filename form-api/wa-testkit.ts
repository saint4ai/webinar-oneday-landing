/**
 * Подставные Telegram, Evolution и Wazzup для тестов модуля WhatsApp (wa.test.ts, wa-e2e.test.ts, wa-dozhim.test.ts). Настоящих запросов нет:
 * серверы слушают 127.0.0.1 на свободном порту, адреса кладутся в TG_API_BASE, EVOLUTION_URL и WAZZUP_API_URL.
 * Подставной Evolution хранит состояние подключения (absent, connecting, open, close) и следит за защитой номера:
 * любое сообщение не в группу и любое добавление участников попадает в violations.
 */
import { createServer, type Server } from "node:http";
import { runInNewContext } from "node:vm";

export const EVO_KEY = "wa-test-evo-key-4f9c2";
export const INSTANCE_TOKEN = "SECRET-INSTANCE-TOKEN-77";
export const PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
/** Номер, под которым подключён подставной Evolution. */
export const OWNER_JID = "77001112233@s.whatsapp.net";

// ───────────────────────── подставной Telegram ─────────────────────────

export type TgCall = { method: string; body: Record<string, any>; raw: string };
export const tg = {
  server: null as Server | null,
  calls: [] as TgCall[],
  async start() {
    this.server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        const buf = Buffer.concat(chunks);
        const raw = buf.toString("latin1");
        let body: Record<string, any> = {};
        try {
          body = JSON.parse(buf.toString("utf8"));
        } catch {
          /* multipart: смотрим сырой текст */
        }
        this.calls.push({ method: (req.url || "").split("/").pop() || "", body, raw });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, result: { message_id: 1 } }));
      });
    });
    await new Promise<void>((r) => this.server!.listen(0, "127.0.0.1", r));
    process.env.TG_API_BASE = `http://127.0.0.1:${(this.server!.address() as { port: number }).port}`;
  },
  async stop() {
    await new Promise<void>((r) => this.server!.close(() => r()));
  },
  reset() {
    this.calls = [];
  },
  texts(chat: number) {
    return this.calls.filter((c) => c.method === "sendMessage" && c.body.chat_id === chat).map((c) => String(c.body.text));
  },
};

// ───────────────────────── подставной Evolution ─────────────────────────

export type ECall = { method: string; path: string; query: URLSearchParams; body: any; key: string | undefined };
/**
 * Подмена ответа. status и json: ответить ошибкой; hang: оборвать соединение; delay: ответить через delay мс
 * (одного delay достаточно: запрос выполнится как обычно, только медленно, клиент с коротким таймаутом его не дождётся).
 */
export type Override = { status?: number; json?: unknown; hang?: boolean; delay?: number } | null;

/** Группа в ответе fetchAllGroups: поля как у Evolution 2.3.7 (participants только при getParticipants=true). */
export type MockGroup = { id: string; subject: string; size: number; owner?: string; announce?: boolean; isCommunity?: boolean; isCommunityAnnounce?: boolean; linkedParent?: string; participants?: Array<{ id: string; admin: string | null }> };

const defaultGroups = (): MockGroup[] => [
  { id: "120363111111111111@g.us", subject: "Воркшоп Вайб-продакшен (общий чат)", size: 487, owner: "77009998877@s.whatsapp.net", announce: false, participants: [{ id: "77009998877@s.whatsapp.net", admin: "superadmin" }, { id: OWNER_JID, admin: "admin" }, { id: "77015556677@s.whatsapp.net", admin: null }] },
  { id: "120363222222222222@g.us", subject: "Архив эфиров", size: 52, owner: OWNER_JID, announce: true, participants: [{ id: OWNER_JID, admin: "superadmin" }] },
];

export const evo = {
  server: null as Server | null,
  calls: [] as ECall[],
  state: "open",
  creates: 0,
  groups: 0,
  msgSeq: 0,
  qrCount: 0,
  logouts: 0,
  /** Причина последнего отключения, как её хранит Evolution в таблице Instance (disconnectionReasonCode, disconnectionObject, disconnectionAt). */
  disconnect: null as { code: number | null; object: string; at: string } | null,
  /** Номер уже привязан (есть ownerJid), даже когда состояние не open: идёт переподключение. */
  paired: false,
  /** Номер, под который инстанс запущен в режиме кода (connect?number= у закрытого инстанса или create с number). */
  pairingNumber: null as string | null,
  pairSeq: 0,
  pairingCalls: 0,
  /** Сколько первых запросов connect не получают кода (Evolution выдаёт его на событие QR чуть позже). */
  pairLate: 0,
  /** Картинка QR в ответах create и connect (по умолчанию PNG 1x1; для снимков экрана подставляют рисунок побольше). */
  qrBase64: PNG_B64,
  members: new Map<string, number>(),
  /** Участники групп и вкладок объявлений для GET /group/participants (поля как у Evolution 2.3.7: id, phoneNumber, admin). */
  participants: new Map<string, Array<{ id: string; phoneNumber?: string; admin?: string | null }>>(),
  /** Контакты инстанса для POST /chat/findContacts: remoteJid -> pushName. */
  contacts: new Map<string, string>(),
  announce: new Map<string, string>(),
  /** Вкладки объявлений и группы, закрытые для участников (findGroupInfos: announce true). */
  announceOn: new Set<string>(),
  /** Как на проде: вкладка объявлений нового сообщества сразу announce: true. Тесты шага announce ставят false. */
  newTabAnnounce: true,
  requests: new Map<string, any[]>(),
  rejectJids: new Set<string>(),
  /** Статус отказа по человеку из rejectJids в ответе на решение по заявкам (по умолчанию 404; 419 это «группа заполнена»). */
  rejectCode: "404",
  allGroups: defaultGroups(),
  fail: null as ((c: ECall) => Override) | null,
  /** Нарушения защиты номера: сообщение не в группу или добавление участников. */
  violations: [] as string[],
  /** Тесты ИИ-ассистента: ответ человеку в личку (sendText на @s.whatsapp.net или @lid) не нарушение, а запись в directs. */
  allowDirect: false,
  directs: [] as Array<{ to: string; text: string; delay: number | undefined; linkPreview: unknown }>,
  /** Вебхук инстанса, как его хранит Evolution после POST /webhook/set. null: не ставился. */
  webhook: null as null | { enabled: boolean; url: string; events: string[]; byEvents: unknown; base64: unknown; headers: Record<string, string> | undefined },
  async start() {
    this.server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", async () => {
        const url = new URL(req.url || "/", "http://x");
        let body: any = null;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          body = null;
        }
        const call: ECall = { method: req.method || "GET", path: url.pathname, query: url.searchParams, body, key: req.headers["apikey"] as string | undefined };
        this.calls.push(call);
        const send = (status: number, json: unknown) => {
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(json));
        };
        if (call.key !== EVO_KEY) return send(401, { status: 401, error: "Unauthorized", response: { message: "Unauthorized" } });
        const o = this.fail?.(call) ?? null;
        if (o?.delay) await new Promise((r) => setTimeout(r, o.delay));
        if (o?.hang) return void req.socket.destroy();
        if (o && !(o.delay && o.status === undefined && o.json === undefined)) return send(o.status ?? 500, o.json ?? { status: o.status ?? 500, error: "Internal Server Error", response: { message: "boom" } });
        const [, a, b] = call.path.split("/");
        const jid = call.query.get("communityJid") || call.query.get("groupJid") || "";
        const route = `${call.method} /${a}/${b}`;
        switch (route) {
          case "GET /instance/connectionState":
            if (this.state === "absent") return send(404, { status: 404, error: "Not Found", response: { message: ['The "workshop" instance does not exist'] } });
            return send(200, { instance: { instanceName: "workshop", state: this.state } });
          case "GET /instance/fetchInstances": {
            // Инстанса нет: Evolution отвечает 404, как для неизвестного имени.
            if (this.state === "absent") return send(404, { status: 404, error: "Not Found", response: { message: ['Instance "workshop" not found'] } });
            const own = this.state === "open" || this.paired;
            return send(200, [{
              id: "inst-1", name: "workshop", ownerJid: own ? OWNER_JID : null, profileName: own ? "Тест" : null, token: INSTANCE_TOKEN, connectionStatus: this.state,
              number: this.pairingNumber ?? (own ? OWNER_JID.replace(/@.*/, "") : null),
              disconnectionReasonCode: this.disconnect?.code ?? null, disconnectionObject: this.disconnect?.object ?? null, disconnectionAt: this.disconnect?.at ?? null,
            }]);
          }
          case "POST /instance/create":
            this.state = "connecting";
            this.qrCount = 1;
            this.disconnect = null;
            if (body?.number) {
              this.pairingNumber = String(body.number);
              this.pairingCalls = 1;
              return send(201, { instance: { instanceName: "workshop" }, hash: INSTANCE_TOKEN, qrcode: { base64: `data:image/png;base64,${this.qrBase64}`, code: "2@abc", count: 1, pairingCode: this.pairCode() } });
            }
            return send(201, { instance: { instanceName: "workshop" }, hash: INSTANCE_TOKEN, qrcode: { base64: `data:image/png;base64,${this.qrBase64}`, code: "2@abc", count: 1 } });
          case "GET /instance/connect": {
            if (this.state === "open") return send(200, { instance: { instanceName: "workshop", state: "open" } });
            // Как в Evolution 2.3.7: number учитывается только у закрытого инстанса; у connecting отдаётся прежний QR (код только если инстанс запущен под номер).
            const number = call.query.get("number");
            if (number && this.state === "close") {
              this.state = "connecting";
              this.pairingNumber = number;
              this.pairingCalls = 0;
              this.disconnect = null;
            }
            if (this.pairingNumber && this.state === "connecting") {
              const code = ++this.pairingCalls > this.pairLate ? this.pairCode() : null;
              return send(200, { pairingCode: code, code: "2@abc", count: 1 });
            }
            return send(200, { base64: `data:image/png;base64,${this.qrBase64}`, code: "2@abc", count: ++this.qrCount });
          }
          case "DELETE /instance/logout":
            this.logouts++;
            this.pairingNumber = null;
            this.state = "close";
            return send(200, { status: "SUCCESS", error: false, response: { message: "Instance logged out" } });
          case "GET /group/fetchAllGroups": {
            const withP = call.query.get("getParticipants") === "true";
            return send(200, this.allGroups.map(({ participants, ...g }) => ({ ...g, ...(withP && participants ? { participants } : {}) })));
          }
          case "GET /group/participants":
            return send(200, { participants: this.participants.get(jid) ?? [] });
          case "POST /chat/findContacts": {
            const rj = String(body?.where?.remoteJid || "");
            const name = this.contacts.get(rj);
            return send(200, name ? [{ id: "c1", remoteJid: rj, pushName: name, profilePicUrl: null }] : []);
          }
          case "POST /community/create": {
            const n = ++this.creates;
            const c = `1203630000000${n}@g.us`;
            const an = `1203631000000${n}@g.us`;
            this.announce.set(c, an);
            if (this.newTabAnnounce) this.announceOn.add(an);
            return send(201, { communityJid: c, announcementJid: an });
          }
          case "GET /community/info":
            return send(200, { communityJid: jid, size: this.members.get(jid) ?? 1, linkedGroups: [{ id: this.announce.get(jid), size: this.members.get(jid) ?? 1 }] });
          case "GET /community/inviteCode": {
            const code = `INV${jid.replace(/\D/g, "").slice(-6)}`;
            return send(200, { inviteCode: code, inviteUrl: `https://chat.whatsapp.com/${code}` });
          }
          case "POST /community/updateSetting":
          case "POST /community/memberAddMode":
          case "POST /community/joinApprovalMode":
            return send(200, { update: "success" });
          case "GET /community/requests":
            return send(200, this.requests.get(jid) ?? []);
          case "POST /community/requests": {
            const asked: string[] = body?.participants || [];
            const pending = this.requests.get(jid) || [];
            const results = asked.map((p) => ({ status: this.rejectJids.has(p) ? this.rejectCode : "200", jid: p }));
            this.requests.set(jid, pending.filter((r) => !asked.includes(r.jid) || this.rejectJids.has(r.jid)));
            return send(200, results);
          }
          case "POST /group/updateGroupPicture":
            return send(201, { update: "success" });
          case "POST /group/create":
            return send(201, { id: `1203632000000${++this.groups}@g.us`, subject: body?.subject });
          case "POST /group/updateSetting":
            if (body?.action === "announcement") this.announceOn.add(String(body.groupJid || ""));
            return send(201, { updateSetting: "announcement" });
          case "GET /group/inviteCode": {
            const code = `GRP${jid.replace(/\D/g, "").slice(-6)}`;
            return send(200, { inviteCode: code, inviteUrl: `https://chat.whatsapp.com/${code}` });
          }
          case "GET /group/findGroupInfos":
            return send(200, { id: jid, size: this.members.get(jid) ?? 2, announce: this.announceOn.has(jid) });
          case "POST /webhook/set": {
            // Форма тела как в Evolution 2.3.7 (webhookSchema): { webhook: { enabled, url, … } }, enabled и url обязательны.
            const w = body?.webhook;
            if (!w || typeof w !== "object" || typeof w.enabled !== "boolean" || typeof w.url !== "string") {
              return send(400, { status: 400, error: "Bad Request", response: { message: [{ property: "webhook", message: "requires property enabled, url" }] } });
            }
            this.webhook = { enabled: w.enabled, url: w.url, events: w.enabled ? w.events || [] : [], byEvents: w.byEvents, base64: w.base64, headers: w.headers };
            return send(201, { webhook: { enabled: w.enabled, url: w.url, events: this.webhook.events } });
          }
          case "POST /message/sendText":
            if (this.allowDirect && /@(s\.whatsapp\.net|lid)$/.test(String(body?.number || ""))) {
              this.directs.push({ to: String(body.number), text: String(body.text), delay: body.delay, linkPreview: body.linkPreview });
              return send(201, { key: { remoteJid: body.number, fromMe: true, id: `MSG${++this.msgSeq}` } });
            }
          // eslint-disable-next-line no-fallthrough
          case "POST /message/sendMedia":
          case "POST /message/sendPoll":
            if (!String(body?.number || "").endsWith("@g.us")) this.violations.push(`сообщение не в группу: ${body?.number}`);
            return send(201, { key: { remoteJid: body?.number, fromMe: true, id: `MSG${++this.msgSeq}` } });
        }
        if (/updateParticipant|sendInvite/.test(call.path)) this.violations.push(`добавление людей: ${call.path}`);
        return send(404, { status: 404, error: "Not Found", response: { message: [`Cannot ${call.method} ${call.path}`] } });
      });
    });
    await new Promise<void>((r) => this.server!.listen(0, "127.0.0.1", r));
    process.env.EVOLUTION_URL = `http://127.0.0.1:${(this.server!.address() as { port: number }).port}`;
  },
  async stop() {
    await new Promise<void>((r) => this.server!.close(() => r()));
  },
  /** Код подключения по номеру: восемь знаков, у каждого запроса свой (PC, счётчик, последние четыре цифры номера). */
  pairCode() {
    return `PC${String(++this.pairSeq).padStart(2, "0")}${String(this.pairingNumber).slice(-4)}`;
  },
  /** Evolution закрыл соединение с причиной (так он записывает lastDisconnect в таблицу Instance): состояние close. */
  disconnectWith(code: number | null, message = "Connection Failure", at = "2026-10-08T09:30:00.000Z") {
    this.state = "close";
    this.pairingNumber = null;
    this.disconnect = {
      code,
      object: JSON.stringify({ error: { data: null, isBoom: true, isServer: false, output: { statusCode: code, payload: { statusCode: code, error: "Unauthorized", message }, headers: {} } }, date: at }),
      at,
    };
  },
  reset() {
    this.calls = [];
    this.disconnect = null;
    this.paired = false;
    this.pairingNumber = null;
    this.pairSeq = 0;
    this.pairingCalls = 0;
    this.pairLate = 0;
    this.state = "open";
    this.fail = null;
    this.qrCount = 0;
    this.logouts = 0;
    this.members.clear();
    this.announceOn.clear();
    this.newTabAnnounce = true;
    this.participants.clear();
    this.contacts.clear();
    this.requests.clear();
    this.rejectJids.clear();
    this.rejectCode = "404";
    this.allGroups = defaultGroups();
    this.allowDirect = false;
    this.directs = [];
    this.webhook = null;
  },
  /** Человек отсканировал QR или ввёл код на телефоне: подключение стало open. */
  scan() {
    this.state = "open";
    this.pairingNumber = null;
    this.disconnect = null;
  },
  /** Вызовы по префиксу пути. */
  of(prefix: string) {
    return this.calls.filter((c) => c.path.startsWith(prefix));
  },
  seq() {
    return this.calls.map((c) => `${c.method} ${c.path.split("/").slice(0, 3).join("/")}`);
  },
};

// ───────────────────────── подставной Wazzup ─────────────────────────

export const WZ_KEY = "wz-test-api-key-5d81c9e7";
export const WZ_CHANNEL = "5b0d1f3a-77aa-4c2e-9d11-0f6a2c3d4e55";
export const WZ_SECRET = "wz-hook-secret-test-31c4a";
export type WCall = { method: string; path: string; body: any; auth: string | undefined };
export type WOverride = { status?: number; json?: unknown; hang?: boolean; delay?: number } | null;
export type MockTemplate = { templateGuid: string; name: string; title: string; text: string; status: string; category: string };

export const TPL_MAIN = "tpl-main-0001";
export const TPL_REMINDER = "tpl-reminder-0002";
export const TPL_LINK = "tpl-link-0003";

const defaultTemplates = (): MockTemplate[] => [
  { templateGuid: TPL_MAIN, name: "vstupite_v_soobshchestvo_1", title: "Вступите в сообщество", category: "utility", status: "pending", text: "Здравствуйте, {{1}}! Вы записаны на воркшоп «Вайб-продакшен» {{2}} в 20:00 по Алматы. Ссылка на эфир придёт в сообщество участников в WhatsApp, а вас там пока нет. Нажмите кнопку ниже, и мы пришлём ссылку для входа." },
  { templateGuid: TPL_REMINDER, name: "napominanie_o_zapisi_ili_vstreche_1", title: "Напоминание о записи или встрече", category: "utility", status: "approved", text: "Здравствуйте. Это {{1}}. Напоминаем о {{2}} в {{3}}. Скажите, все в силе?" },
  { templateGuid: TPL_LINK, name: "vstupite_v_soobshchestvo_ssylka_1", title: "Вступите в сообщество ссылка", category: "utility", status: "approved", text: "Здравствуйте, {{1}}! Вы записаны на воркшоп «Вайб-продакшен» {{2}} в 20:00 по Алматы. Вход в сообщество по кнопке ниже." },
  { templateGuid: "tpl-other-0004", name: "dozvonilis_ne_v_gruppe_1", title: "Дозвонились, не в группе", category: "marketing", status: "rejected", text: "Здравствуйте, {{1}}! Дозвонились." },
];

/** Отправленное через POST /v3/message. */
export type WSent = { chatId: string; templateId?: string; templateValues?: string[]; text?: string; crmMessageId: string; messageId: string };

export const wazzup = {
  server: null as Server | null,
  calls: [] as WCall[],
  templates: defaultTemplates(),
  /** Что сейчас записано в Wazzup как вебхук. */
  hooks: { webhooksUri: "", subscriptions: {} as Record<string, boolean> },
  sent: [] as WSent[],
  crmSeen: new Set<string>(),
  /** Чаты с открытым окном 24 часа: обычный текст разрешён только им (человек ответил на шаблон). */
  windows: new Set<string>(),
  /** Тестовый POST {test:true} на адрес вебхука при установке (как делает настоящий Wazzup). */
  testHook: true,
  fail: null as ((c: WCall) => WOverride) | null,
  /** Нарушения контракта: ключ, канал, форма тела, текст вне окна. */
  violations: [] as string[],
  seq: 0,
  async start() {
    this.server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", async () => {
        const url = new URL(req.url || "/", "http://x");
        let body: any = null;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          body = null;
        }
        const call: WCall = { method: req.method || "GET", path: url.pathname, body, auth: req.headers["authorization"] as string | undefined };
        this.calls.push(call);
        const send = (status: number, json: unknown) => {
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(json));
        };
        if (call.auth !== `Bearer ${WZ_KEY}`) return send(401, { error: "UNAUTHORIZED", description: "Invalid api key" });
        const o = this.fail?.(call) ?? null;
        if (o?.delay) await new Promise((r) => setTimeout(r, o.delay));
        if (o?.hang) return void req.socket.destroy();
        if (o && !(o.delay && o.status === undefined && o.json === undefined)) return send(o.status ?? 500, o.json ?? { error: "INTERNAL", description: "boom" });
        const route = `${call.method} ${call.path}`;
        switch (route) {
          case "GET /v3/templates/whatsapp":
            return send(200, this.templates);
          case "POST /v3/message": {
            const b = body || {};
            const bad = (why: string) => {
              this.violations.push(why);
              return send(400, { error: "VALIDATION_ERROR", description: why });
            };
            if (b.channelId !== WZ_CHANNEL) return bad(`channelId: ${b.channelId}`);
            if (b.chatType !== "whatsapp") return bad(`chatType: ${b.chatType}`);
            if (typeof b.chatId !== "string" || !/^\d{10,15}$/.test(b.chatId)) return bad(`chatId: ${b.chatId}`);
            if (typeof b.crmMessageId !== "string" || !b.crmMessageId) return bad("нет crmMessageId");
            if (this.crmSeen.has(b.crmMessageId)) return send(400, { error: "REPEATED_CRM_MESSAGE_ID", description: "crmMessageId repeated" });
            if (b.templateId !== undefined) {
              const t = this.templates.find((x) => x.templateGuid === b.templateId);
              if (!t) return bad(`templateId неизвестен: ${b.templateId}`);
              if (t.status !== "approved") return bad(`шаблон не одобрен: ${t.name}`);
              const n = Math.max(0, ...[...t.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1])));
              if (!Array.isArray(b.templateValues) || b.templateValues.length !== n || b.templateValues.some((v: unknown) => typeof v !== "string" || !v.trim())) return bad(`templateValues: ${JSON.stringify(b.templateValues)} при ${n} переменных`);
              if ("text" in b) return bad("и шаблон, и текст");
            } else {
              if (typeof b.text !== "string" || !b.text.trim()) return bad("нет text");
              if (!this.windows.has(b.chatId)) return bad(`текст вне окна 24 часов: ${b.chatId}`);
            }
            this.crmSeen.add(b.crmMessageId);
            const messageId = `wzmsg-${++this.seq}`;
            this.sent.push({ chatId: b.chatId, ...(b.templateId ? { templateId: b.templateId, templateValues: b.templateValues } : { text: b.text }), crmMessageId: b.crmMessageId, messageId });
            return send(201, { messageId, chatId: b.chatId });
          }
          case "GET /v3/webhooks":
            return send(200, this.hooks);
          case "PATCH /v3/webhooks": {
            const b = body || {};
            if (typeof b.webhooksUri !== "string" || !b.subscriptions || typeof b.subscriptions !== "object") {
              this.violations.push("PATCH /v3/webhooks: нет webhooksUri или subscriptions");
              return send(400, { error: "VALIDATION_ERROR", description: "webhooksUri, subscriptions" });
            }
            if (b.webhooksUri && this.testHook) {
              let ok = false;
              try {
                const r = await fetch(b.webhooksUri, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: true }) });
                ok = r.status === 200;
              } catch {
                ok = false;
              }
              if (!ok) return send(400, { error: "WEBHOOK_TEST_FAILED", description: "test request did not return 200" });
            }
            this.hooks = { webhooksUri: b.webhooksUri, subscriptions: b.subscriptions };
            return send(200, {});
          }
        }
        return send(404, { error: "NOT_FOUND", description: `${route}` });
      });
    });
    await new Promise<void>((r) => this.server!.listen(0, "127.0.0.1", r));
    process.env.WAZZUP_API_URL = `http://127.0.0.1:${(this.server!.address() as { port: number }).port}`;
  },
  async stop() {
    await new Promise<void>((r) => {
      this.server!.closeAllConnections?.();
      this.server!.close(() => r());
    });
  },
  reset() {
    this.calls = [];
    this.templates = defaultTemplates();
    this.hooks = { webhooksUri: "", subscriptions: {} };
    this.sent = [];
    this.crmSeen = new Set();
    this.windows = new Set();
    this.testHook = true;
    this.fail = null;
    this.violations = [];
    this.seq = 0;
  },
  /** Вызовы по методу и пути. */
  of(method: string, path: string) {
    return this.calls.filter((c) => c.method === method && c.path === path);
  },
};

/** Входящее сообщение из вебхука Wazzup (messagesAndStatuses): поля как в документации v3. */
export function wzInbound(o: { chatId: string; text?: string; messageId?: string; isEcho?: boolean; chatType?: string; channelId?: string; type?: string }) {
  return {
    messages: [
      {
        messageId: o.messageId ?? `in-${Math.random().toString(36).slice(2)}`,
        channelId: o.channelId ?? WZ_CHANNEL,
        chatType: o.chatType ?? "whatsapp",
        chatId: o.chatId,
        type: o.type ?? "text",
        isEcho: o.isEcho ?? false,
        text: o.text ?? "",
        status: o.isEcho ? "sent" : "inbound",
        dateTime: "2026-10-08T15:00:00.000Z",
      },
    ],
  };
}

// ───────────────────────── подставной OpenAI ─────────────────────────

export const OPENAI_KEY = "sk-test-openai-key-8f2d41";
export type OaiCall = { path: string; auth: string | undefined; body: any };
/** Подмена ответа модели: status и json (ошибка), hang (оборвать), delay (мс) либо просто текст ответа. */
export type OaiAnswer = string | { text?: string; status?: number; json?: unknown; hang?: boolean; delay?: number; finish?: string };
export const DEFAULT_ANSWER = "Здравствуйте! Эфир каждый день в 20:00 по Алматы. Записаться можно здесь: https://onai.academy/workshop-montazh/";

export const openai = {
  server: null as Server | null,
  calls: [] as OaiCall[],
  /** Нарушения контракта вызова: ключ, поля тела, temperature. */
  violations: [] as string[],
  /** Что отвечает модель: готовый ответ или функция от запроса. */
  answer: ((_c: OaiCall) => DEFAULT_ANSWER) as OaiAnswer | ((c: OaiCall) => OaiAnswer),
  async start() {
    this.server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", async () => {
        let body: any = null;
        try {
          body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        } catch {
          body = null;
        }
        const call: OaiCall = { path: (req.url || "").split("?")[0], auth: req.headers["authorization"] as string | undefined, body };
        this.calls.push(call);
        const send = (status: number, json: unknown) => {
          res.writeHead(status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(json));
        };
        if (call.path !== "/v1/chat/completions" || req.method !== "POST") return send(404, { error: { message: "not found" } });
        if (call.auth !== `Bearer ${OPENAI_KEY}`) return send(401, { error: { message: "Incorrect API key provided" } });
        if (body?.model !== "gpt-5.6-luna") this.violations.push(`model: ${body?.model}`);
        if (body?.reasoning_effort !== "low") this.violations.push(`reasoning_effort: ${body?.reasoning_effort}`);
        if (typeof body?.max_completion_tokens !== "number" || body.max_completion_tokens < 800 || body.max_completion_tokens > 1600) this.violations.push(`max_completion_tokens: ${body?.max_completion_tokens}`);
        if ("temperature" in (body || {}) || "max_tokens" in (body || {})) this.violations.push("temperature или max_tokens в теле");
        if (!Array.isArray(body?.messages) || body.messages[0]?.role !== "system") this.violations.push("нет system-сообщения первым");
        const a = typeof this.answer === "function" ? this.answer(call) : this.answer;
        const o = typeof a === "string" ? { text: a } : a;
        if (o.delay) await new Promise((r) => setTimeout(r, o.delay));
        if (o.hang) return void req.socket.destroy();
        if (o.status !== undefined || o.json !== undefined) return send(o.status ?? 500, o.json ?? { error: { message: "boom" } });
        return send(200, { id: "chatcmpl-test", choices: [{ index: 0, finish_reason: o.finish ?? "stop", message: { role: "assistant", content: o.text ?? "" } }] });
      });
    });
    await new Promise<void>((r) => this.server!.listen(0, "127.0.0.1", r));
    process.env.OPENAI_BASE_URL = `http://127.0.0.1:${(this.server!.address() as { port: number }).port}/v1`;
  },
  async stop() {
    await new Promise<void>((r) => {
      this.server!.closeAllConnections?.();
      this.server!.close(() => r());
    });
  },
  reset() {
    this.calls = [];
    this.violations = [];
    this.answer = () => DEFAULT_ANSWER;
  },
  /** Что человек написал в последнем запросе (последнее user-сообщение). */
  lastUser(): string {
    const m = [...(this.calls[this.calls.length - 1]?.body?.messages || [])].reverse().find((x: any) => x.role === "user");
    return String(m?.content ?? "");
  },
};

// ───────────────────────── страница workshop-montazh/wa.html ─────────────────────────

/**
 * Запуск скрипта страницы wa.html в песочнице: подставные document, location, navigator, fetch. Возвращает, куда страница
 * переадресовала (первый и единственный location.replace), какой адрес стоит в её ссылке «Нажми, если не открылось» и что
 * отправил sendBeacon. timeoutMs заменяет 3500 мс запасного перехода, чтобы тест не ждал.
 */
export function runWaPage(
  html: string,
  fetchImpl: (url: string, init?: any) => any,
  opts: { timeoutMs?: number } = {},
): Promise<{ url: string; href: string; beacons: Array<[string, string]>; replaces: number }> {
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)![1];
  const anchor = { href: "" };
  const beacons: Array<[string, string]> = [];
  let replaces = 0;
  return new Promise((resolve, reject) => {
    const sandbox: any = {
      document: { getElementById: () => anchor },
      location: { replace: (u: string) => (replaces++ === 0 ? setTimeout(() => resolve({ url: u, href: anchor.href, beacons, replaces }), 30) : undefined) },
      navigator: { sendBeacon: (u: string, d: string) => (beacons.push([u, d]), true) },
      fetch: fetchImpl,
      setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms === 3500 ? (opts.timeoutMs ?? 3500) : ms),
      clearTimeout,
    };
    try {
      runInNewContext(script, sandbox);
    } catch (e) {
      reject(e);
    }
    setTimeout(() => reject(new Error("страница никуда не перешла")), 8000).unref();
  });
}
