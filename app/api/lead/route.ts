/**
 * POST /api/lead
 * Принимает форму с лендинга:
 *   1. Создаёт лид в amoCRM воронке «Однодневник» (10882150) с тегом «Однодневник»
 *   2. Нотифицирует edbot для WhatsApp re-engagement тех, кто не вступил в community
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
 */
import { NextRequest, NextResponse } from "next/server";
import { createWorkshopLead } from "@/lib/amocrm/client";
import { notifyEdbotLead } from "@/lib/edbot/notify";

type LeadPayload = {
  name: string;
  phone: string;
  source?: string;
  consent?: boolean;
};

export async function POST(req: NextRequest) {
  let payload: LeadPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { name, phone, source = "landing", consent = false } = payload;

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

  // Origin URL для edbot site_reg
  const siteUrl =
    req.headers.get("referer") ||
    req.headers.get("origin") ||
    "https://onai.academy/workshop";

  // ── Параллельный fan-out: CRM + edbot ─────────────────────
  const [crmResult, edbotResult] = await Promise.allSettled([
    createWorkshopLead({
      name: cleanName,
      phone: cleanPhone,
      source,
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
        : `skip:${crmResult.value.reason}`
      : "throw";
  const edbotStatus =
    edbotResult.status === "fulfilled"
      ? edbotResult.value.ok
        ? "ok"
        : `fail:${edbotResult.value.reason}`
      : "throw";

  console.log(
    "[lead] name=%s phone=***%s source=%s crm=%s edbot=%s",
    cleanName,
    cleanPhone.slice(-4),
    source,
    crmStatus,
    edbotStatus
  );

  return NextResponse.json({ ok: true });
}
