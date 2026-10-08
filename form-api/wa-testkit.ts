/**
 * Подставные Telegram и Evolution для тестов модуля WhatsApp (wa.test.ts и wa-e2e.test.ts). Настоящих запросов нет:
 * оба сервера слушают 127.0.0.1 на свободном порту, адреса кладутся в TG_API_BASE и EVOLUTION_URL.
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
  announce: new Map<string, string>(),
  requests: new Map<string, any[]>(),
  rejectJids: new Set<string>(),
  /** Статус отказа по человеку из rejectJids в ответе на решение по заявкам (по умолчанию 404; 419 это «группа заполнена»). */
  rejectCode: "404",
  allGroups: defaultGroups(),
  fail: null as ((c: ECall) => Override) | null,
  /** Нарушения защиты номера: сообщение не в группу или добавление участников. */
  violations: [] as string[],
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
          case "POST /community/create": {
            const n = ++this.creates;
            const c = `1203630000000${n}@g.us`;
            const an = `1203631000000${n}@g.us`;
            this.announce.set(c, an);
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
            return send(201, { updateSetting: "announcement" });
          case "GET /group/inviteCode": {
            const code = `GRP${jid.replace(/\D/g, "").slice(-6)}`;
            return send(200, { inviteCode: code, inviteUrl: `https://chat.whatsapp.com/${code}` });
          }
          case "GET /group/findGroupInfos":
            return send(200, { id: jid, size: this.members.get(jid) ?? 2 });
          case "POST /message/sendText":
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
    this.requests.clear();
    this.rejectJids.clear();
    this.rejectCode = "404";
    this.allGroups = defaultGroups();
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
