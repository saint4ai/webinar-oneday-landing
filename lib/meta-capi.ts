/**
 * Meta Conversions API — серверная отправка события Lead напрямую в Meta
 * (graph.facebook.com), без сторонних шлюзов. У нас есть свой сервер
 * (/api/lead), поэтому шлём server-to-server: бесплатно, полный контроль,
 * дедуп с браузерным пикселем по общему event_id.
 *
 * PII (телефон, имя) хешируется SHA-256 ДО отправки — сырой номер не уходит.
 * fbp/fbc/IP/user-agent передаются как есть (их хешировать нельзя).
 *
 * Не бросает исключений — логирует и возвращает результат (как amocrm-клиент).
 *
 * ENV: META_CAPI_TOKEN (обязателен), META_TEST_EVENT_CODE (опц., Test Events).
 */
import crypto from "node:crypto";
import { META_PIXEL_ID } from "./meta-pixel";

const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Email/имя/текст: trim + lowercase → SHA-256. */
function hashText(value: string): string {
  return sha256(value.trim().toLowerCase());
}

/**
 * Телефон → только цифры с кодом страны (E.164 без «+»), затем SHA-256.
 * KZ: ведущая «8» (8 707…) → «7». Если уже с «+7»/«7» — оставляем.
 */
function hashPhone(rawPhone: string): string | undefined {
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.length === 11 && digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  }
  return sha256(digits);
}

export type LeadEventInput = {
  name: string;
  phone: string;
  eventId: string;
  eventSourceUrl?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
  testEventCode?: string;
};

type CapiResult =
  | { ok: true; received: number }
  | {
      ok: false;
      reason: "no_token" | "http_error" | "exception";
      status?: number;
      error?: unknown;
    };

export async function sendLeadEvent(input: LeadEventInput): Promise<CapiResult> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    console.warn("[capi] META_CAPI_TOKEN не задан — событие Lead НЕ отправлено");
    return { ok: false, reason: "no_token" };
  }

  // user_data: чем больше валидных параметров, тем выше Event Match Quality.
  const userData: Record<string, unknown> = {};
  const ph = hashPhone(input.phone);
  if (ph) userData.ph = [ph];
  if (input.name?.trim()) userData.fn = [hashText(input.name)];
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;

  const event: Record<string, unknown> = {
    event_name: "Lead",
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    event_id: input.eventId,
    event_source_url: input.eventSourceUrl || "https://onai.academy/workshop",
    user_data: userData,
  };

  const body: Record<string, unknown> = { data: [event] };
  const testCode = input.testEventCode || process.env.META_TEST_EVENT_CODE;
  if (testCode) body.test_event_code = testCode;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(
    token
  )}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(
        "[capi] %d %s — %s",
        res.status,
        res.statusText,
        errText.slice(0, 400)
      );
      return { ok: false, reason: "http_error", status: res.status, error: errText };
    }

    const json = (await res.json()) as { events_received?: number };
    console.log(
      "[capi] Lead sent event_id=%s received=%s",
      input.eventId,
      json?.events_received
    );
    return { ok: true, received: json?.events_received ?? 0 };
  } catch (err) {
    console.error("[capi] fetch threw:", err);
    return { ok: false, reason: "exception", error: err };
  }
}
