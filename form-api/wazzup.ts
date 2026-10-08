/**
 * Клиент Wazzup API v3 для дожима «не вступил в сообщество» (wa-dozhim.ts, docs/tasks/wa_wazzup_dozhim.md).
 *
 * Только REST, без зависимостей. Все вызовы возвращают значение, а не бросают: ошибка приходит как
 * { ok: false, status, error, retryable }, ключ API из текста ошибки вычищается и нигде не печатается.
 *
 *   GET   /v3/templates/whatsapp   шаблоны WABA (нужны одобренные)
 *   POST  /v3/message              отправка: шаблоном (templateId, templateValues) или обычным текстом в открытое окно
 *   GET   /v3/webhooks             что стоит сейчас
 *   PATCH /v3/webhooks             поставить или снять вебхук
 *
 * Ключ уходит в заголовке Authorization: Bearer. Настройки читаются лениво: loadEnv() в server.ts выполняется после импортов.
 */

const env = (k: string) => (process.env[k] || "").trim();

export const wzKey = () => env("WAZZUP_API_KEY");
export const wzChannel = () => env("WAZZUP_CHANNEL_ID");
/** Базовый адрес. Меняется только в тестах (подставной Wazzup на локальном порту). */
export const wzBase = () => (env("WAZZUP_API_URL") || "https://api.wazzup24.com").replace(/\/+$/, "");

const TIMEOUT_MS = 20_000;

export type WzOk<T = any> = { ok: true; status: number; data: T };
export type WzFail = {
  ok: false;
  /** HTTP-код ответа; 0, если ответа не было (сеть, таймаут). */
  status: number;
  error: string;
  data?: any;
  /** 429, 5xx и отсутствие ответа: можно повторить позже. */
  retryable: boolean;
  /** Ответа не дождались: запрос мог дойти и выполниться. */
  timeout?: boolean;
};
export type WzResult<T = any> = WzOk<T> | WzFail;

const scrub = (s: string) => {
  const k = wzKey();
  return k ? s.split(k).join("***") : s;
};

/** Текст ошибки из тела ответа Wazzup: { error, description } или { message }. */
function errorText(data: any, fallback: string): string {
  const parts = [data?.error, data?.code, data?.description, data?.message]
    .map((x) => (typeof x === "string" ? x : x && typeof x === "object" ? JSON.stringify(x) : ""))
    .filter(Boolean);
  return scrub((parts.join(" ") || fallback).replace(/\s+/g, " ").trim().slice(0, 240));
}

/** Один запрос. Не бросает. */
export async function wzCall<T = any>(method: "GET" | "POST" | "PATCH", path: string, body?: unknown, timeoutMs = TIMEOUT_MS): Promise<WzResult<T>> {
  const key = wzKey();
  if (!key) return { ok: false, status: 0, error: "no_api_key", retryable: false };
  try {
    const res = await fetch(`${wzBase()}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
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
    return { ok: false, status: res.status, error: `${res.status} ${errorText(data, res.statusText || text.slice(0, 100))}`, data, retryable: res.status === 429 || res.status >= 500 };
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    const timeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    return {
      ok: false,
      status: 0,
      error: timeout ? "timeout" : scrub(String(err?.cause?.code || err?.message || err)).slice(0, 160),
      retryable: true,
      ...(timeout ? { timeout: true } : {}),
    };
  }
}

// ───────────────────────── шаблоны ─────────────────────────

export type WzTemplate = {
  id: string;
  /** Техническое имя (napominanie_o_zapisi_ili_vstreche_1) или то, что отдал Wazzup. */
  name: string;
  /** Название в кабинете («Вступите в сообщество»). */
  title: string;
  text: string;
  category: string;
  /** Статус словами Wazzup в нижнем регистре; пусто, если поля нет. */
  status: string;
  /** true: одобрен; false: нет; null: статус не определить (поля в ответе нет). */
  approved: boolean | null;
  /** Сколько переменных {{n}} в тексте (наибольший номер). null: текст неизвестен. */
  vars: number | null;
};

/** Статус «одобрен»: Wazzup и Meta называют его по-разному (approved, active, одобрен). Явные «ещё нет» проверяются первыми. */
const NOT_APPROVED_RE = /pending|moderat|review|reject|declin|denied|disabled|inactive|paused|draft|created|appeal|flagged|suspend|отклон|модерац|ожида|черновик|проверк|приостан/i;
const APPROVED_RE = /approv|accepted|(^|[^a-z])active|(^|[^a-z])enabled|одобр|активн/i;
/** true одобрен, false явно нет, null статус не распознан. */
export function approvedOf(status: string): boolean | null {
  if (!status) return null;
  if (NOT_APPROVED_RE.test(status)) return false;
  return APPROVED_RE.test(status) ? true : null;
}

/** Наибольший номер переменной {{n}} в тексте. Нет переменных: 0. */
export function varCount(text: string): number {
  let max = 0;
  for (const m of text.matchAll(/\{\{\s*(\d{1,2})\s*\}\}/g)) max = Math.max(max, Number(m[1]));
  return max;
}

/** Текст шаблона: Wazzup и Meta кладут его по-разному, берём первое найденное. */
function textOf(t: any): string {
  const direct = [t?.text, t?.templateText, t?.body, t?.content, t?.message];
  for (const x of direct) if (typeof x === "string" && x.trim()) return x;
  const body = t?.body ?? t?.components?.find?.((c: any) => String(c?.type || "").toUpperCase() === "BODY");
  if (body && typeof body === "object" && typeof body.text === "string") return body.text;
  return "";
}

/** Список шаблонов из ответа: массив или объект с массивом. Строки без идентификатора пропускаются. */
export function normalizeTemplates(data: unknown): WzTemplate[] {
  const list: any[] = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? ((data as any).templates ?? (data as any).data ?? (data as any).items ?? [])
      : [];
  if (!Array.isArray(list)) return [];
  const out: WzTemplate[] = [];
  for (const t of list) {
    if (!t || typeof t !== "object") continue;
    const id = String(t.templateGuid ?? t.guid ?? t.templateId ?? t.id ?? "").trim();
    if (!id) continue;
    const name = String(t.name ?? t.templateName ?? t.title ?? "").trim();
    const title = String(t.title ?? t.templateTitle ?? t.name ?? "").trim();
    const text = textOf(t);
    const rawStatus = t.status ?? t.templateStatus ?? t.state ?? t.moderationStatus;
    const status = typeof rawStatus === "string" ? rawStatus.trim().toLowerCase() : "";
    out.push({
      id,
      name,
      title,
      text,
      category: String(t.category ?? t.templateCategory ?? "").trim().toLowerCase(),
      status,
      approved: approvedOf(status),
      vars: text ? varCount(text) : null,
    });
  }
  return out;
}

export async function wzTemplates(): Promise<WzResult<WzTemplate[]>> {
  const r = await wzCall<any>("GET", "/v3/templates/whatsapp");
  if (!r.ok) return r;
  return { ok: true, status: r.status, data: normalizeTemplates(r.data) };
}

// ───────────────────────── сообщения ─────────────────────────

export type WzSent = { messageId: string };

/**
 * Отправка в WhatsApp-чат. Шаблон: templateId и templateValues (массив строк). Обычный текст: text, он уходит только в открытое окно
 * (человек ответил в последние 24 часа). crmMessageId делает запрос идемпотентным: Wazzup не примет повтор с тем же значением.
 */
export async function wzSend(p: { chatId: string; templateId?: string; templateValues?: string[]; text?: string; crmMessageId: string }): Promise<WzResult<WzSent>> {
  const r = await wzCall<any>("POST", "/v3/message", {
    channelId: wzChannel(),
    chatType: "whatsapp",
    chatId: p.chatId,
    ...(p.templateId ? { templateId: p.templateId, templateValues: p.templateValues ?? [] } : { text: p.text ?? "" }),
    crmMessageId: p.crmMessageId,
  });
  if (!r.ok) return r;
  return { ok: true, status: r.status, data: { messageId: String(r.data?.messageId ?? r.data?.id ?? "") } };
}

/** Wazzup отверг повтор crmMessageId: сообщение с таким идентификатором уже принято, значит оно уже ушло. */
export function isRepeatedCrmId(f: WzFail): boolean {
  if (f.status !== 400 && f.status !== 409) return false;
  return /repeat|duplicate|already|exist|повтор|уже/i.test(f.error) && /crm|message|сообщ/i.test(f.error);
}

// ───────────────────────── вебхуки ─────────────────────────

export type WzHooks = { webhooksUri: string; subscriptions: Record<string, boolean> };

export async function wzGetHooks(): Promise<WzResult<WzHooks>> {
  const r = await wzCall<any>("GET", "/v3/webhooks");
  if (!r.ok) return r;
  const subs = r.data?.subscriptions && typeof r.data.subscriptions === "object" ? r.data.subscriptions : {};
  return { ok: true, status: r.status, data: { webhooksUri: typeof r.data?.webhooksUri === "string" ? r.data.webhooksUri : "", subscriptions: subs } };
}

export const wzSetHooks = (body: { webhooksUri: string; subscriptions: Record<string, boolean> }) => wzCall<any>("PATCH", "/v3/webhooks", body, 30_000);
