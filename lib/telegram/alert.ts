/**
 * Telegram-алерт владельцу, когда сделку не удалось создать в amoCRM
 * (после исчерпания ретраев). Отправка — plain fetch на Bot API, без SDK.
 *
 * ENV:
 *   TELEGRAM_ALERT_TOKEN=<токен @sainthelper_bot>
 *   TELEGRAM_ALERT_CHAT_ID=789638302   (личка Александра — бот уже может ему писать)
 */
import type { CapturedLead } from "@/lib/leads/store";

const TOKEN = process.env.TELEGRAM_ALERT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_ALERT_CHAT_ID || "";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendOwnerAlert(
  lead: CapturedLead,
  error: string
): Promise<{ ok: boolean }> {
  if (!TOKEN || !CHAT_ID) {
    console.error("[alert] telegram not configured (TELEGRAM_ALERT_TOKEN/CHAT_ID)");
    return { ok: false };
  }
  const utm = lead.utm
    ? Object.entries(lead.utm)
        .map(([k, v]) => `${k}=${v}`)
        .join(" · ")
    : "—";
  const text = [
    "🔴 <b>Лид НЕ создан в amoCRM</b> (ретраи исчерпаны)",
    `Имя: <b>${esc(lead.name)}</b>`,
    `Телефон: <code>${esc(lead.phone)}</code>`,
    ...(lead.telegram ? [`Telegram: <code>@${esc(lead.telegram)}</code>`] : []),
    `UTM: ${esc(utm)}`,
    `Ошибка: <code>${esc(error)}</code>`,
    `ID в базе: <code>${esc(lead.id)}</code>`,
    "",
    "Пересоздай сделку вручную из таблицы <code>workshop_leads</code>.",
  ].join("\n");

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    if (!res.ok) {
      console.error("[alert] telegram HTTP", res.status);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[alert] telegram send failed:", e);
    return { ok: false };
  }
}
