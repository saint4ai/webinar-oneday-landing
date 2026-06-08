/**
 * SMS через Mobizon (api.mobizon.kz). Переиспользует интеграцию основного
 * проекта onai-integrator-login (backend/src/services/mobizon.ts), на fetch.
 *
 * После каждой регистрации лиду уходит SMS со ссылкой на бонус-группу
 * воркшопа — это и догон тех, кто не дошёл до WhatsApp с /thank-you.
 *
 * ENV: MOBIZON_API_KEY
 */
const MOBIZON_API_URL = "https://api.mobizon.kz/service/message/sendSmsMessage";
const BONUS_SMS_TEXT = "Забери бонусы в группе воркшопа https://mbzn.co/8pjd";

export async function sendBonusSms(
  phone: string
): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = process.env.MOBIZON_API_KEY;
  if (!apiKey) {
    console.error("[mobizon] MOBIZON_API_KEY не задан — SMS НЕ отправлен");
    return { ok: false, reason: "no_key" };
  }
  const recipient = (phone || "").replace(/\D/g, "");
  if (recipient.length < 10) return { ok: false, reason: "bad_phone" };

  try {
    const url = `${MOBIZON_API_URL}?output=json&api=v1&apiKey=${encodeURIComponent(
      apiKey
    )}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        recipient,
        text: BONUS_SMS_TEXT,
      }).toString(),
    });
    const data = (await res.json().catch(() => null)) as
      | { code?: number; message?: string }
      | null;
    if (data?.code === 0) {
      console.log("[mobizon] SMS ok → ***%s", recipient.slice(-4));
      return { ok: true };
    }
    console.error("[mobizon] ошибка code=%s msg=%s", data?.code, data?.message);
    return { ok: false, reason: `code_${data?.code ?? "?"}` };
  } catch (e) {
    console.error("[mobizon] fetch threw:", e);
    return { ok: false, reason: "exception" };
  }
}
