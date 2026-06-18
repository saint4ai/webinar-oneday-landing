/**
 * EasyBot — register + персональная ссылка воронки воркшопа.
 *
 * Серверный двойник Tilda-скрипта EasyBot (my.easybot.kz/static-back/script.js):
 * POST имя+телефон+UTM на /register/. EasyBot создаёт регистрацию с УНИКАЛЬНЫМ
 * кодом и возвращает персональную WhatsApp-ссылку (этот код зашит в префилл).
 * Возвращаем её клиенту → /thank-you редиректит юзера на неё. Когда он отправит
 * боту свой код — EasyBot точно знает, КАКОЙ лид подключился (+ UTM-атрибуция).
 * Это и есть «сигнал доходимости рег → бот».
 *
 * Payload 1:1 как у их Tilda-скрипта: form_name, phone_number, email, location, utm_*.
 *
 * Never-throw: при любой ошибке {ok:false} → /thank-you падает на статичную прямую
 * ссылку EasyBot (бот отработает, но по общему коду — без точной привязки лида).
 *
 * ENV (опц.): EASYBOT_CHATBOT_ID=079c01a7-a882-4ea2-a9ea-282520dbb870
 */

const DEFAULT_CHATBOT_ID = "079c01a7-a882-4ea2-a9ea-282520dbb870";
const TIMEOUT_MS = 3500; // на критическом пути /api/lead → держим коротким

type EasybotInput = {
  name: string;
  phone: string;
  utm?: Record<string, string>;
  location?: string;
};

type EasybotResult = { ok: boolean; botUrl?: string; reason?: string };

export async function registerEasybotLead(
  input: EasybotInput
): Promise<EasybotResult> {
  const chatbotId = process.env.EASYBOT_CHATBOT_ID || DEFAULT_CHATBOT_ID;
  const url = `https://my.easybot.kz/api/main/webinar/${chatbotId}/register/`;

  const body = {
    form_name: input.name,
    phone_number: input.phone.replace(/[^\d+]/g, ""),
    email: "",
    location: (input.location || "onai.academy/workshop").slice(0, 100),
    utm_source: input.utm?.utm_source || "",
    utm_medium: input.utm?.utm_medium || "",
    utm_campaign: input.utm?.utm_campaign || "",
    utm_term: input.utm?.utm_term || "",
    utm_content: input.utm?.utm_content || "",
  };

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };

    // Ответ — JSON-строка с персональной WhatsApp-ссылкой.
    let s = (await res.text()).trim();
    try {
      const parsed = JSON.parse(s);
      if (typeof parsed === "string") s = parsed;
    } catch {
      /* не JSON-строка — оставляем как есть */
    }
    if (!/^https?:\/\//i.test(s)) return { ok: false, reason: "no_url" };

    let botUrl = s;
    try {
      botUrl = new URL(s).toString(); // нормализуем пробелы/кириллицу в text-параметре
    } catch {
      /* оставляем сырую строку */
    }
    return { ok: true, botUrl };
  } catch (e) {
    return { ok: false, reason: String(e).slice(0, 60) };
  }
}
