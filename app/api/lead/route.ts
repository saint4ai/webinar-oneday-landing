/**
 * POST /api/lead
 * Принимает форму с лендинга:
 *   1. Создаёт лид в amoCRM воронке «Однодневник» (10882150) с тегом «Однодневник»
 *   2. Шлёт событие Lead в Meta Conversions API (server-side, телефон хешируется
 *      SHA-256, дедуп с браузерным пикселем по общему event_id)
 *   3. Нотифицирует edbot для WhatsApp re-engagement тех, кто не вступил в community
 *
 * Email НЕ собираем — письма не доходят (домен onai.academy не прогрет в Resend).
 *
 * Все ошибки логируются, но юзер всегда видит { ok: true } — он уже
 * редиректится на /thank-you и идёт в WhatsApp-сообщество.
 *
 * Конфиг ENV (.env.local):
 *   AMOCRM_DOMAIN=platformonaiacademy
 *   AMOCRM_ACCESS_TOKEN=eyJ...
 *   AMOCRM_PIPELINE_WORKSHOP=10882150
 *   AMOCRM_STATUS_WORKSHOP=86078458
 *   EDBOT_CHATBOT_ID=db343b5679ddf774530a60172b35bda8
 *   META_CAPI_TOKEN=EAA...            (Conversions API, серверный Lead)
 *   META_TEST_EVENT_CODE=TEST12345    (опц., Events Manager → Test Events)
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { notifyEdbotLead } from "@/lib/edbot/notify";
import { sendLeadEvent } from "@/lib/meta-capi";
import { captureLead, markFailed, type CapturedLead } from "@/lib/leads/store";
import { pushLeadToAmo, type PushResult } from "@/lib/leads/process";

type LeadPayload = {
  name: string;
  phone: string;
  source?: string;
  consent?: boolean;
  // Meta Pixel / Conversions API (дедуп браузер ↔ сервер)
  eventId?: string;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
  utm?: Record<string, string>;
};

export async function POST(req: NextRequest) {
  let payload: LeadPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const {
    name,
    phone,
    source = "landing",
    consent = false,
    eventId,
    fbp,
    fbc,
    eventSourceUrl,
    utm,
  } = payload;

  // ── Валидация ─────────────────────────────────────────────
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ ok: false, error: "Name required" }, { status: 422 });
  }
  if (!phone || phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ ok: false, error: "Phone required" }, { status: 422 });
  }
  if (!consent) {
    return NextResponse.json({ ok: false, error: "Consent required" }, { status: 422 });
  }

  const cleanName = name.trim();
  const cleanPhone = phone.trim();

  // Origin URL для edbot site_reg + Meta event_source_url
  const siteUrl =
    eventSourceUrl ||
    req.headers.get("referer") ||
    req.headers.get("origin") ||
    "https://onai.academy/workshop";

  // Данные матчинга для Meta CAPI (consent уже подтверждён выше).
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined;
  const userAgent = req.headers.get("user-agent") || undefined;
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

  // ── Параллельный fan-out: amoCRM (persist+ретраи) + CAPI + edbot ──
  const [crmResult, capiResult, edbotResult] = await Promise.allSettled([
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
    notifyEdbotLead({
      name: cleanName,
      phone: cleanPhone,
      source,
      siteUrl,
    }),
  ]);

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
  const edbotStatus =
    edbotResult.status === "fulfilled"
      ? edbotResult.value.ok
        ? "ok"
        : `fail:${edbotResult.value.reason}`
      : "throw";

  console.log(
    "[lead] name=%s phone=***%s source=%s crm=%s capi=%s edbot=%s",
    cleanName,
    cleanPhone.slice(-4),
    source,
    crmStatus,
    capiStatus,
    edbotStatus
  );

  return NextResponse.json({ ok: true });
}

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
