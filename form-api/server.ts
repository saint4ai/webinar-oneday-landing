/**
 * form-api — микросервис приёма лидов воркшопа.
 *
 * Зачем отдельный процесс: лендинг раздаётся nginx'ом как статика и не может
 * ничего уронить; платформа onai.academy (:3000) про этот сервис не знает.
 * Падение любой из трёх частей не задевает остальные.
 *
 * Слушает ТОЛЬКО 127.0.0.1 — снаружи недоступен, весь трафик идёт через nginx.
 *
 * Роуты (те же, что были у Next-лендинга — контракт не менялся):
 *   POST /api/lead          — форма регистрации
 *   POST /api/reconcile     — дожим лидов, не доехавших в amoCRM (cron)
 *   GET  /api/whatsapp-link — текущая ссылка на сообщество
 *   POST /api/tg-link       — вебхук бота: смена ссылки
 *
 * Вся бизнес-логика переиспользуется из lib/* без изменений.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sendLeadEvent } from "../lib/meta-capi";
import { captureLead, markFailed, incrementRetry, markAlertSent, ingestWalToSupabase, type CapturedLead } from "../lib/leads/store";
import { pushLeadToAmo, type PushResult } from "../lib/leads/process";
import { registerEasybotLead } from "../lib/easybot/register";
import { resolveEasybotRedirect } from "../lib/easybot/redirect";
import { selectRetryable, supabaseConfigured } from "../lib/supabase-rest";
import { sendOwnerAlert } from "../lib/telegram/alert";
import { readWhatsAppLink, writeWhatsAppLink, readWhatsAppRecord, isValidWhatsAppLink } from "../lib/whatsapp-link";

/**
 * Секреты из .env рядом с бандлом (PM2 сам env-файлы не читает).
 * Уже заданные переменные окружения имеют приоритет — так можно
 * переопределить любое значение при запуске, не трогая файл.
 */
function loadEnv() {
  try {
    const raw = readFileSync(process.env.FORM_API_ENV || join(__dirname, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const eq = s.indexOf("=");
      if (eq < 1) continue;
      const key = s.slice(0, eq).trim();
      if (process.env[key] === undefined) process.env[key] = s.slice(eq + 1).trim();
    }
  } catch {
    console.warn("[form-api] .env не найден — работаю на переменных окружения");
  }
}
loadEnv();

const PORT = Number(process.env.PORT) || 4010;
const HOST = "127.0.0.1";
/** Лимит тела запроса — анти-DoS: форма весит сотни байт, вебхук Telegram — единицы КБ. */
const MAX_BODY = 64 * 1024;

// ───────────────────────── helpers ─────────────────────────

function json(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    ...headers,
  });
  res.end(payload);
}

/** Читает тело с жёстким лимитом: превышение — обрыв соединения. */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("body_too_large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function readJson<T>(req: IncomingMessage): Promise<T | null> {
  try {
    return JSON.parse(await readBody(req)) as T;
  } catch {
    return null;
  }
}

// ───────────────────────── POST /api/lead ─────────────────────────

type LeadPayload = {
  name: string;
  phone: string;
  source?: string;
  consent?: boolean;
  eventId?: string;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
  utm?: Record<string, string>;
};

/**
 * amoCRM-плечо с persist: 2 inline-попытки (2-я с дедуп-пробой на случай
 * полу-успеха 1-й, когда сделка создалась, а ответ потерялся). На полном
 * провале метим строку failed — фоновый reconciler её дожмёт.
 */
async function persistAmoLead(captured: CapturedLead): Promise<PushResult> {
  let res = await pushLeadToAmo(captured, { probeFirst: false });
  if (!res.ok) {
    await new Promise((r) => setTimeout(r, 500));
    res = await pushLeadToAmo(captured, { probeFirst: true });
  }
  if (!res.ok) await markFailed(captured.id, res.error);
  return res;
}

async function handleLead(req: IncomingMessage, res: ServerResponse) {
  const payload = await readJson<LeadPayload>(req);
  if (!payload) return json(res, 400, { ok: false, error: "Invalid JSON" });

  const { name, phone, source = "landing", consent = false, eventId, fbp, fbc, eventSourceUrl, utm } = payload;

  // ── Валидация ─────────────────────────────────────────────
  if (!name || name.trim().length < 2) return json(res, 422, { ok: false, error: "Name required" });
  if (!phone || phone.replace(/\D/g, "").length < 8) return json(res, 422, { ok: false, error: "Phone required" });
  if (!consent) return json(res, 422, { ok: false, error: "Consent required" });

  const cleanName = name.trim();
  const cleanPhone = phone.trim();

  const siteUrl =
    eventSourceUrl ||
    (req.headers.referer as string) ||
    (req.headers.origin as string) ||
    "https://onai.academy/workshop";

  const forwarded = req.headers["x-forwarded-for"];
  const clientIp =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() ||
    (req.headers["x-real-ip"] as string) ||
    undefined;
  const userAgent = (req.headers["user-agent"] as string) || undefined;
  // event_id общий с браузерным fbq('track','Lead'); фолбэк если клиент не прислал.
  const metaEventId = eventId || randomUUID();
  // fbclid из fbc (fb.1.<ts>.<fbclid>) — для AmoCRM-поля.
  const fbclid = fbc ? fbc.split(".").slice(3).join(".") || undefined : undefined;

  // ── Persist-first: сохраняем лид ДО внешних вызовов ───────
  const captured = await captureLead({
    eventId: metaEventId,
    name: cleanName,
    phone: cleanPhone,
    source,
    utm,
    fbclid,
  });

  // ── Остальные плечи — В ФОНЕ, НЕ блокируем форму/редирект ──────────
  // Лид уже durable (captureLead → Supabase + WAL); при сбое amoCRM его дожмёт
  // /api/reconcile. Процесс долгоживущий — фоновые промисы доедут.
  void Promise.allSettled([
    persistAmoLead(captured),
    sendLeadEvent({
      name: cleanName,
      phone: cleanPhone,
      eventId: metaEventId,
      eventSourceUrl: siteUrl,
      fbp,
      fbc,
      clientIp,
      userAgent,
    }),
  ]).then(([crmResult, capiResult]) => {
    const crmStatus =
      crmResult.status === "fulfilled"
        ? crmResult.value.ok
          ? `ok:${crmResult.value.leadId}`
          : `fail:${crmResult.value.error}`
        : "throw";
    const capiStatus =
      capiResult.status === "fulfilled"
        ? capiResult.value.ok
          ? `ok:${capiResult.value.received}`
          : `skip:${capiResult.value.reason}`
        : "throw";
    console.log("[lead] name=%s phone=***%s source=%s crm=%s capi=%s", cleanName, cleanPhone.slice(-4), source, crmStatus, capiStatus);
  });

  // Редирект воронки — ПЕРЕКЛЮЧАТЕЛЬ через ENV (без пересборки).
  const FUNNEL_REDIRECT: "whatsapp" | "easybot" = process.env.FUNNEL_REDIRECT === "easybot" ? "easybot" : "whatsapp";
  const WHATSAPP_GROUP = "https://chat.whatsapp.com/JVdWLXG9L8jCTUp2W2vxeu";

  let redirect: string;
  if (FUNNEL_REDIRECT === "easybot") {
    const easybot = await registerEasybotLead({ name: cleanName, phone: cleanPhone, utm, location: siteUrl });
    redirect = resolveEasybotRedirect(easybot.botUrl, utm);
  } else {
    redirect = WHATSAPP_GROUP;
  }

  return json(res, 200, { ok: true, redirect });
}

// ───────────────────────── POST /api/reconcile ─────────────────────────

const RETRY_MAX = Number(process.env.LEAD_RETRY_MAX) || 5;

async function handleReconcile(req: IncomingMessage, res: ServerResponse) {
  const secret = process.env.RECONCILE_SECRET;
  if (!secret || req.headers["x-reconcile-secret"] !== secret) {
    return json(res, 401, { ok: false, error: "unauthorized" });
  }
  if (!supabaseConfigured()) return json(res, 500, { ok: false, error: "no_supabase" });

  // 0) WAL → Supabase: гарантия что всё захваченное есть в очереди
  const swept = await ingestWalToSupabase().catch(() => 0);
  const rows = await selectRetryable(RETRY_MAX, 50);

  let done = 0;
  let alerted = 0;
  let retrying = 0;

  for (const row of rows) {
    if (!row.id) continue;
    const lead: CapturedLead = {
      id: row.id,
      eventId: row.event_id ?? undefined,
      name: row.name,
      phone: row.phone,
      source: row.source ?? undefined,
      utm: row.utm ?? undefined,
      fbclid: row.fbclid ?? undefined,
    };

    const result = await pushLeadToAmo(lead, { probeFirst: true });
    if (result.ok) {
      done++;
      continue;
    }

    const current = row.retry_count ?? 0;
    await incrementRetry(row.id, current, result.error);
    if (current + 1 >= RETRY_MAX) {
      await sendOwnerAlert(lead, result.error);
      await markAlertSent(row.id);
      alerted++;
    } else {
      retrying++;
    }
  }

  console.log("[reconcile] swept=%d processed=%d done=%d alerted=%d retrying=%d", swept, rows.length, done, alerted, retrying);
  return json(res, 200, { ok: true, swept, processed: rows.length, done, alerted, retrying });
}

// ───────────────────────── GET /api/whatsapp-link ─────────────────────────

function handleWhatsAppLink(res: ServerResponse) {
  return json(res, 200, { link: readWhatsAppLink() }, { "Cache-Control": "no-store, max-age=0" });
}

// ───────────────────────── POST /api/tg-link ─────────────────────────

const TG_SECRET = process.env.TG_LINK_WEBHOOK_SECRET || "";
const TG_OWNER_IDS = (process.env.TG_LINK_OWNER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
const THANKYOU_URL = "https://onai.academy/workshop/thank-you";

/** Сравнение секрета вебхука за константное время. Пустой секрет → false. */
function secretOk(provided: string | undefined): boolean {
  if (!TG_SECRET || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(TG_SECRET);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Ответ пользователю ЧЕРЕЗ тело вебхук-ответа: Telegram сам выполнит sendMessage
 * из JSON, который мы вернули. Без отдельного исходящего fetch → хендлер не
 * зависает и Telegram не ловит «Connection timed out». Токен не нужен.
 */
function webhookReply(res: ServerResponse, chatId: number | string, text: string) {
  return json(res, 200, { method: "sendMessage", chat_id: chatId, text, disable_web_page_preview: true });
}

/** Первый http(s)-URL из текста (без хвостовой пунктуации). */
function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/\S+/);
  if (!m) return null;
  return m[0].replace(/[)\]>!.,'"]+$/, "");
}

type TgMessage = { chat?: { id?: number | string }; from?: { id?: number | string }; text?: string };

async function handleTgLink(req: IncomingMessage, res: ServerResponse) {
  // 1) Секрет вебхука (constant-time)
  const headerSecret = req.headers["x-telegram-bot-api-secret-token"];
  if (!secretOk(Array.isArray(headerSecret) ? headerSecret[0] : headerSecret)) {
    return json(res, 401, { ok: false });
  }

  // Ограничение размера тела (анти-DoS): Telegram-апдейт всегда небольшой.
  const len = Number(req.headers["content-length"] || "0");
  if (len > 16384) return json(res, 413, { ok: false });

  const update = await readJson<{ message?: TgMessage; edited_message?: TgMessage }>(req);
  if (!update) return json(res, 200, { ok: true }); // мусорный body — молча 200

  const msg = update.message || update.edited_message;
  const chatId = msg?.chat?.id;
  const fromId = msg?.from?.id;
  const text = (msg?.text || "").trim();

  // 2) Авторизация отправителя — чужих молча игнорируем.
  //    Fail-closed: если allowlist пуст (забыли env) — НИКОГО не пускаем.
  if (!fromId || TG_OWNER_IDS.length === 0 || !TG_OWNER_IDS.includes(String(fromId))) {
    return json(res, 200, { ok: true });
  }

  const url = extractUrl(text);

  // Нет ссылки → подсказка + текущая ссылка
  if (!url) {
    const cur = readWhatsAppRecord();
    const when = cur.updatedAt ? `\nОбновлена: ${cur.updatedAt}` : "\n(по умолчанию, файл ещё не менялся)";
    return webhookReply(res, chatId!, `Пришли новую ссылку на WhatsApp-сообщество — подставлю её на thank-you воркшопа.\n\nТекущая ссылка:\n${cur.link}${when}`);
  }

  // 3) Валидация домена
  if (!isValidWhatsAppLink(url)) {
    return webhookReply(res, chatId!, `Это не похоже на ссылку WhatsApp.\nЖду вида https://chat.whatsapp.com/... или https://wa.me/...\n\nПрислано: ${url}`);
  }

  const saved = writeWhatsAppLink(url, fromId);
  if (saved.ok) {
    return webhookReply(res, chatId!, `✅ Ссылка обновлена и завёрнута в диплинк.\nКнопка на thank-you ведёт в WhatsApp:\n${url}\n\nНа телефоне открывает приложение; встроенные браузеры Instagram/Facebook обработаны (Android — форс, iOS — подсказка + копирование).\nПроверь: ${THANKYOU_URL}`);
  }
  return webhookReply(res, chatId!, `❌ Не удалось сохранить: ${saved.error}`);
}

// ───────────────────────── GET /calendar ─────────────────────────

/**
 * Динамическая ссылка «Добавь эфир в календарь» для WhatsApp-воронки EasyBot.
 * Статичную Google Calendar-ссылку сделать нельзя — дата зашивается в URL,
 * а автовебинар идёт каждый день в 20:00 Алматы. Роут сам считает ближайший
 * эфир (до 19:45 — сегодняшний, после — завтрашний) и 302-редиректит.
 */
const ALMATY_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC+5, без DST

function handleCalendar(res: ServerResponse) {
  const nowAlmaty = new Date(Date.now() + ALMATY_OFFSET_MS);

  // До 19:45 зовём на сегодняшний эфир, позже — на завтрашний.
  const cutoff = nowAlmaty.getUTCHours() * 60 + nowAlmaty.getUTCMinutes();
  const target = new Date(nowAlmaty);
  if (cutoff >= 19 * 60 + 45) target.setUTCDate(target.getUTCDate() + 1);

  const y = target.getUTCFullYear();
  const m = String(target.getUTCMonth() + 1).padStart(2, "0");
  const d = String(target.getUTCDate()).padStart(2, "0");

  // Локальное время Алматы, без Z — часовой пояс передаём через ctz.
  const dates = `${y}${m}${d}T200000/${y}${m}${d}T220000`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "Воркшоп по вайбкодингу — onAI Academy",
    dates,
    ctz: "Asia/Almaty",
    details: "Старт в 20:00 по Алматы. Ссылка на эфир придёт в WhatsApp за 5 минут до начала.",
    location: "Онлайн",
  });

  res.writeHead(302, { Location: `https://calendar.google.com/calendar/render?${params.toString()}` });
  res.end();
}

// ───────────────────────── router ─────────────────────────

const server = createServer(async (req, res) => {
  const url = (req.url || "").split("?")[0].replace(/\/+$/, "") || "/";
  const method = req.method || "GET";

  try {
    if (method === "POST" && url === "/api/lead") return await handleLead(req, res);
    if (method === "POST" && url === "/api/reconcile") return await handleReconcile(req, res);
    if (method === "GET" && url === "/api/whatsapp-link") return handleWhatsAppLink(res);
    if (method === "GET" && url === "/calendar") return handleCalendar(res);
    if (method === "POST" && url === "/api/tg-link") return await handleTgLink(req, res);
    if (method === "GET" && url === "/health") return json(res, 200, { ok: true });
    return json(res, 404, { ok: false, error: "not_found" });
  } catch (err) {
    console.error("[form-api] %s %s →", method, url, err);
    if (!res.headersSent) json(res, 500, { ok: false, error: "internal" });
  }
});

// Процесс не должен умирать от одиночной ошибки в фоновом промисе:
// лид уже сохранён в WAL, а падение сервиса стоит следующих регистраций.
process.on("unhandledRejection", (err) => console.error("[form-api] unhandledRejection", err));
process.on("uncaughtException", (err) => console.error("[form-api] uncaughtException", err));

server.listen(PORT, HOST, () => {
  console.log(`[form-api] listening on http://${HOST}:${PORT}`);
});
