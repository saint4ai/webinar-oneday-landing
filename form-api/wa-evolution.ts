/**
 * Клиент Evolution API 2.3.7 (WhatsApp на Baileys) для модуля wa-groups.
 *
 * Только REST по локальному адресу, никаких зависимостей. Все вызовы возвращают значение, а не бросают:
 * ошибка приходит как { ok: false, status, error }, ключ API из текста ошибки вычищается.
 *
 * Пути и поля сверены с исходниками тега 2.3.7 (EvolutionAPI/evolution-api):
 *   штатные:  /instance/{create,connect,connectionState,fetchInstances,logout}, /group/{create,updateGroupPicture,
 *             updateSetting,inviteCode,findGroupInfos,fetchAllGroups}, /message/{sendText,sendMedia,sendPoll}
 *   патч:     /community/* (в 2.3.7 их нет, добавляет infra/evolution/communities.patch, контракт в
 *             docs/plans/wa-communities-plan.md)
 * Ключ уходит в заголовке apikey. Настройки читаются лениво: loadEnv() в server.ts идёт после импортов.
 */

const env = (k: string) => (process.env[k] || "").trim();

export const evoUrl = () => (env("EVOLUTION_URL") || "http://127.0.0.1:8080").replace(/\/+$/, "");
export const evoKey = () => env("EVOLUTION_API_KEY");
export const evoInstance = () => env("EVOLUTION_INSTANCE") || "workshop";

const TIMEOUT_MS = 20_000;
/** Сообщения с картинкой или видео: Evolution сам скачивает файл по ссылке и грузит его в WhatsApp. */
const MEDIA_TIMEOUT_MS = 90_000;
/** Создание сообщества и группы: несколько запросов к WhatsApp подряд. */
const CREATE_TIMEOUT_MS = 90_000;

export type EvoOk<T = any> = { ok: true; status: number; data: T };
export type EvoFail = {
  ok: false;
  /** HTTP-код ответа Evolution; 0, если ответа не было. */
  status: number;
  error: string;
  data?: any;
  /** Ответа не дождались. Запрос мог дойти и выполниться. */
  timeout?: boolean;
  /** Соединение не установлено: запрос точно не ушёл. */
  connectFail?: boolean;
};
export type EvoResult<T = any> = EvoOk<T> | EvoFail;

const CONNECT_FAIL_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH", "UND_ERR_CONNECT_TIMEOUT"]);

const scrub = (s: string) => {
  const k = evoKey();
  return k ? s.split(k).join("***") : s;
};

/** Текст ошибки из тела ответа Evolution: { error, response: { message: [...] } } или { message }. */
function errorText(data: any, fallback: string): string {
  const m = data?.response?.message ?? data?.message ?? data?.error;
  const text = Array.isArray(m) ? m.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join("; ") : typeof m === "string" ? m : m ? JSON.stringify(m) : "";
  return scrub((text || fallback).slice(0, 300));
}

/** Один запрос. Не бросает. */
export async function evoCall<T = any>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown, timeoutMs = TIMEOUT_MS): Promise<EvoResult<T>> {
  const key = evoKey();
  if (!key) return { ok: false, status: 0, error: "no_api_key" };
  try {
    const res = await fetch(`${evoUrl()}${path}`, {
      method,
      headers: { apikey: key, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (res.ok) return { ok: true, status: res.status, data: data as T };
    return { ok: false, status: res.status, error: `${res.status} ${errorText(data, res.statusText || text.slice(0, 100))}`, data };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    const timeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    return {
      ok: false,
      status: 0,
      error: timeout ? "timeout" : scrub(String(err?.cause?.code || err?.message || err)),
      ...(timeout ? { timeout: true } : {}),
      ...(!timeout && err?.cause?.code && CONNECT_FAIL_CODES.has(err.cause.code) ? { connectFail: true } : {}),
    };
  }
}

const I = () => encodeURIComponent(evoInstance());
const q = (jid: string) => `?communityJid=${encodeURIComponent(jid)}`;

// ───────────────────────── инстанс и подключение ─────────────────────────

/** Состояние подключения: open, connecting, close; absent, если инстанса нет (404). */
export async function connectionState(): Promise<EvoResult<{ state: string }>> {
  const r = await evoCall<any>("GET", `/instance/connectionState/${I()}`);
  if (r.ok) return { ok: true, status: r.status, data: { state: String(r.data?.instance?.state ?? "unknown") } };
  if (r.status === 404) return { ok: true, status: 404, data: { state: "absent" } };
  return r;
}

/**
 * Данные инстанса из GET /instance/fetchInstances?instanceName=: номер владельца, имя профиля и причина последнего отключения.
 * Поля строки таблицы Instance в Evolution 2.3.7 (prisma/postgresql-schema.prisma): connectionStatus, ownerJid, profileName, number,
 * disconnectionReasonCode (Int), disconnectionObject (JSON: Evolution кладёт туда JSON.stringify(lastDisconnect) события connection.update),
 * disconnectionAt. Причина записывается, когда Baileys закрыл соединение кодом из списка «не переподключаться»: loggedOut 401,
 * forbidden 403, а также 402 и 406. Токен инстанса из ответа не берём. Инстанса нет: found: false.
 */
export type InstanceInfo = {
  found: boolean;
  ownerJid: string;
  profileName: string;
  number: string;
  connectionStatus: string;
  disconnectionReasonCode: number | null;
  /** JSON-строка lastDisconnect как её записал Evolution (до 4000 знаков). Разбор и очистка в wa-groups. */
  disconnectionObject: string;
  disconnectionAt: string;
};

export async function fetchInstance(): Promise<EvoResult<InstanceInfo>> {
  const r = await evoCall<any>("GET", `/instance/fetchInstances?instanceName=${I()}`);
  if (!r.ok) {
    // Инстанса нет: Evolution отвечает 404 (или пустым списком), это не сбой.
    if (r.status === 404) return { ok: true, status: 404, data: emptyInstance() };
    return r;
  }
  const row = Array.isArray(r.data) ? r.data[0] : r.data;
  if (!row || typeof row !== "object") return { ok: true, status: r.status, data: emptyInstance() };
  const obj = row.disconnectionObject;
  const code = Number(row.disconnectionReasonCode);
  return {
    ok: true,
    status: r.status,
    data: {
      found: true,
      ownerJid: String(row.ownerJid || ""),
      profileName: String(row.profileName || ""),
      number: String(row.number || ""),
      connectionStatus: String(row.connectionStatus || ""),
      disconnectionReasonCode: row.disconnectionReasonCode === null || row.disconnectionReasonCode === undefined || !Number.isFinite(code) ? null : code,
      disconnectionObject: obj === null || obj === undefined ? "" : (typeof obj === "string" ? obj : JSON.stringify(obj)).slice(0, 4000),
      disconnectionAt: String(row.disconnectionAt || ""),
    },
  };
}

const emptyInstance = (): InstanceInfo => ({ found: false, ownerJid: "", profileName: "", number: "", connectionStatus: "", disconnectionReasonCode: null, disconnectionObject: "", disconnectionAt: "" });

/**
 * Создать инстанс Baileys. С qrcode: true Evolution ждёт пять секунд и отдаёт QR в ответе. С number (только цифры) подключение
 * идёт по коду: в ответе qrcode.pairingCode, 8 знаков.
 */
export function createInstance(number?: string): Promise<EvoResult<any>> {
  return evoCall("POST", "/instance/create", {
    instanceName: evoInstance(),
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
    ...(number ? { number } : {}),
    rejectCall: false,
    groupsIgnore: false,
    alwaysOnline: false,
    readMessages: false,
    readStatus: false,
    syncFullHistory: false,
  }, 30_000);
}

/**
 * Запросить QR у существующего инстанса. Ответ: { base64, code, pairingCode, count } или состояние open.
 * С number (только цифры) Evolution 2.3.7 начинает подключение по коду, но только если инстанс закрыт (close): у инстанса в состоянии
 * connecting он отдаёт прежний QR без кода (InstanceController.connectToWhatsapp использует number лишь в ветке close).
 */
export function connectInstance(number?: string): Promise<EvoResult<any>> {
  return evoCall("GET", `/instance/connect/${I()}${number ? `?number=${encodeURIComponent(number)}` : ""}`, undefined, 30_000);
}

/** Отвязать номер (DELETE /instance/logout/{instance}). Инстанс остаётся в Evolution, для нового подключения нужен QR. */
export const logoutInstance = () => evoCall("DELETE", `/instance/logout/${I()}`, undefined, 30_000);

const GROUPS_TIMEOUT_MS = 60_000;

/**
 * Все группы и сообщества номера (GET /group/fetchAllGroups/{instance}?getParticipants=true|false, строка обязательна).
 * Поля группы: id, subject, size, owner, announce, restrict, isCommunity, isCommunityAnnounce, linkedParent, pictureUrl и др.
 * Список людей (participants) просим только ради роли самого номера: дальше него в пульт и на диск он не уходит.
 */
export async function fetchAllGroups(withParticipants: boolean): Promise<EvoResult<any[]>> {
  const r = await evoCall<any>("GET", `/group/fetchAllGroups/${I()}?getParticipants=${withParticipants ? "true" : "false"}`, undefined, GROUPS_TIMEOUT_MS);
  if (!r.ok) return r;
  if (!Array.isArray(r.data)) return { ok: false, status: r.status, error: "в ответе fetchAllGroups нет списка", data: r.data };
  return { ok: true, status: r.status, data: r.data };
}

// ───────────────────────── сообщества (патч) ─────────────────────────

export type CreatedCommunity = { communityJid: string; announcementJid: string };

export async function communityCreate(p: { subject: string; description: string; approvalRequired: boolean }): Promise<EvoResult<CreatedCommunity>> {
  const r = await evoCall<any>("POST", `/community/create/${I()}`, p, CREATE_TIMEOUT_MS);
  if (!r.ok) return r;
  const communityJid = String(r.data?.communityJid || "");
  const announcementJid = String(r.data?.announcementJid || "");
  if (!communityJid.endsWith("@g.us") || !announcementJid.endsWith("@g.us")) {
    return { ok: false, status: r.status, error: "в ответе create нет communityJid или announcementJid", data: r.data };
  }
  return { ok: true, status: r.status, data: { communityJid, announcementJid } };
}

/** Метаданные сообщества: сырой ответ патча, разбор в wa-groups (extractMembers). */
export const communityInfo = (jid: string) => evoCall<any>("GET", `/community/info/${I()}${q(jid)}`);

export async function communityInvite(jid: string): Promise<EvoResult<{ inviteCode: string; inviteUrl: string }>> {
  const r = await evoCall<any>("GET", `/community/inviteCode/${I()}${q(jid)}`);
  if (!r.ok) return r;
  return inviteOf(r);
}

export const communitySetting = (jid: string, action: "announcement" | "not_announcement" | "locked" | "unlocked") =>
  evoCall("POST", `/community/updateSetting/${I()}${q(jid)}`, { action });

export const communityMemberAddMode = (jid: string, mode: "admin_add" | "all_member_add") => evoCall("POST", `/community/memberAddMode/${I()}${q(jid)}`, { mode });

export const communityJoinApproval = (jid: string, mode: "on" | "off") => evoCall("POST", `/community/joinApprovalMode/${I()}${q(jid)}`, { mode });

/** Заявки на вступление с исходными атрибутами. */
export const communityRequests = (jid: string) => evoCall<any>("GET", `/community/requests/${I()}${q(jid)}`);

export const communityDecide = (jid: string, participants: string[], action: "approve" | "reject") =>
  evoCall<any>("POST", `/community/requests/${I()}${q(jid)}`, { participants, action });

// ───────────────────────── обычные группы (запасной путь) ─────────────────────────

export async function groupCreate(p: { subject: string; description: string; participants: string[] }): Promise<EvoResult<{ groupJid: string }>> {
  const r = await evoCall<any>("POST", `/group/create/${I()}`, { ...p, promoteParticipants: true }, CREATE_TIMEOUT_MS);
  if (!r.ok) return r;
  const groupJid = String(r.data?.id || "");
  if (!groupJid.endsWith("@g.us")) return { ok: false, status: r.status, error: "в ответе group/create нет id группы", data: r.data };
  return { ok: true, status: r.status, data: { groupJid } };
}

export const groupSetting = (jid: string, action: "announcement" | "not_announcement" | "locked" | "unlocked") =>
  evoCall("POST", `/group/updateSetting/${I()}`, { groupJid: jid, action });

export async function groupInvite(jid: string): Promise<EvoResult<{ inviteCode: string; inviteUrl: string }>> {
  const r = await evoCall<any>("GET", `/group/inviteCode/${I()}?groupJid=${encodeURIComponent(jid)}`);
  if (!r.ok) return r;
  return inviteOf(r);
}

/** findGroupInfos отдаёт size (число участников). Список самих участников не нужен, поэтому LID вместо номера нам не мешает. */
export const groupInfo = (jid: string) => evoCall<any>("GET", `/group/findGroupInfos/${I()}?groupJid=${encodeURIComponent(jid)}`);

/** Аватарка по ссылке: Evolution сам скачивает картинку. Работает и с JID сообщества. */
export const updatePicture = (jid: string, imageUrl: string) =>
  evoCall("POST", `/group/updateGroupPicture/${I()}`, { groupJid: jid, image: imageUrl }, MEDIA_TIMEOUT_MS);

function inviteOf(r: EvoOk<any>): EvoResult<{ inviteCode: string; inviteUrl: string }> {
  const inviteCode = String(r.data?.inviteCode || "");
  const inviteUrl = String(r.data?.inviteUrl || (inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : ""));
  if (!inviteUrl) return { ok: false, status: r.status, error: "в ответе нет ссылки-приглашения", data: r.data };
  return { ok: true, status: r.status, data: { inviteCode, inviteUrl } };
}

// ───────────────────────── сообщения ─────────────────────────

export type SentMsg = { messageId: string };

/** Ответ sendText, sendMedia, sendPoll: сохранённое сообщение, id лежит в key.id. */
function sentOf(r: EvoResult<any>): EvoResult<SentMsg> {
  if (!r.ok) return r;
  return { ok: true, status: r.status, data: { messageId: String(r.data?.key?.id || "") } };
}

/**
 * delay (мс, целое): Evolution 2.3.7 сам показывает «печатает…» (presence composing) это время и только потом отправляет
 * (sendMessageWithTyping в whatsapp.baileys.service.ts). Нужен ассистенту: пауза перед ответом человеку.
 */
export async function sendText(jid: string, text: string, opts: { delay?: number } = {}): Promise<EvoResult<SentMsg>> {
  // linkPreview: false, чтобы наш номер не ходил за превью ссылок (Kaspi, Bizon) на каждое сообщение.
  const delay = opts.delay && opts.delay > 0 ? Math.round(opts.delay) : 0;
  return sentOf(await evoCall("POST", `/message/sendText/${I()}`, { number: jid, text, linkPreview: false, ...(delay ? { delay } : {}) }, delay ? TIMEOUT_MS + delay : TIMEOUT_MS));
}

// ───────────────────────── вебхук инстанса ─────────────────────────

/**
 * Вебхук инстанса: POST /webhook/set/{instance}. Тело сверено с исходником Evolution 2.3.7 (EventDto и webhookSchema):
 * { webhook: { enabled, url, events[], headers{}, byEvents, base64 } }, обязательны webhook.enabled и webhook.url.
 * Поля в camelCase (byEvents, base64): webhook_by_events из старых описаний 2.3.7 не знает. Заголовки из headers Evolution
 * кладёт в каждый запрос как есть (особый только jwt_key). Выключение: enabled false, события при этом Evolution сам очищает.
 * Пустой список events при enabled true Evolution заменяет на все события, поэтому события передаём всегда.
 */
export function setWebhook(p: { url: string; enabled: boolean; events?: string[]; headers?: Record<string, string> }): Promise<EvoResult<any>> {
  return evoCall("POST", `/webhook/set/${I()}`, {
    webhook: {
      enabled: p.enabled,
      url: p.url,
      events: p.enabled ? p.events ?? ["MESSAGES_UPSERT"] : [],
      byEvents: false,
      base64: false,
      ...(p.enabled && p.headers ? { headers: p.headers } : {}),
    },
  });
}

export async function sendMedia(jid: string, p: { mediatype: "image" | "video"; url: string; caption?: string }): Promise<EvoResult<SentMsg>> {
  const mimetype = p.mediatype === "video" ? "video/mp4" : /\.png$/i.test(p.url) ? "image/png" : "image/jpeg";
  return sentOf(
    await evoCall("POST", `/message/sendMedia/${I()}`, { number: jid, mediatype: p.mediatype, mimetype, media: p.url, ...(p.caption ? { caption: p.caption } : {}) }, MEDIA_TIMEOUT_MS),
  );
}

export async function sendPoll(jid: string, p: { name: string; values: string[]; selectableCount: number }): Promise<EvoResult<SentMsg>> {
  return sentOf(await evoCall("POST", `/message/sendPoll/${I()}`, { number: jid, name: p.name, selectableCount: p.selectableCount, values: p.values }));
}
