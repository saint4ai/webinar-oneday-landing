/**
 * Server-side нотификация edbot.me о новом лиде.
 *
 * Edbot платформа сама догоняет тех, кто оставил форму, но не написал
 * в WhatsApp-бота — присылает скриптованное сообщение. Чтобы это
 * работало, edbot должен знать пары (chatbotid, контакт).
 *
 * На сайте также установлен клиентский скрипт chatbot_init (через layout.tsx),
 * но он завязан на Tilda-события. Чтобы не зависеть от клиентского трекинга,
 * дублируем уведомление с сервера — это надёжнее и работает даже при
 * отключенном JS у юзера.
 *
 * Endpoint обратной разработан из tilda_scrypt.min.js:
 *   POST https://platform.edbot.me/webhook/tilda/order
 *   { chatbotid, regtype, site_reg, name, phone, email, ...utm }
 *
 * ENV:
 *   EDBOT_CHATBOT_ID=db343b5679ddf774530a60172b35bda8
 *   EDBOT_WEBHOOK_URL=https://platform.edbot.me/webhook/tilda/order  (default)
 */

const DEFAULT_CHATBOT_ID = "db343b5679ddf774530a60172b35bda8";
const DEFAULT_WEBHOOK = "https://platform.edbot.me/webhook/tilda/order";

type NotifyInput = {
  name: string;
  phone: string;
  source: string;
  siteUrl?: string;
};

type NotifyResult =
  | { ok: true }
  | { ok: false; reason: "http_error" | "exception"; status?: number; error?: unknown };

export async function notifyEdbotLead(input: NotifyInput): Promise<NotifyResult> {
  const chatbotid = process.env.EDBOT_CHATBOT_ID || DEFAULT_CHATBOT_ID;
  const url = process.env.EDBOT_WEBHOOK_URL || DEFAULT_WEBHOOK;

  const body = {
    chatbotid,
    regtype: "whatsapp",
    site_reg: input.siteUrl || "https://onai.academy/workshop",
    name: input.name,
    phone: input.phone,
    // источник для аналитики внутри edbot
    utm_source: input.source,
  };

  try {
    // Таймаут 2.5с: platform.edbot.me часто недоступен (undici-дефолт = 10с
    // connect-timeout), и без этого плечо вешает весь /api/lead → форма не
    // успевает редиректнуть юзера в бота. Edbot — догон не дошедших, не критичен.
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        "[edbot] %d %s — body: %s",
        res.status,
        res.statusText,
        text.slice(0, 300)
      );
      return { ok: false, reason: "http_error", status: res.status, error: text };
    }

    console.log("[edbot] notified ok chatbotid=%s phone=***%s", chatbotid, input.phone.slice(-4));
    return { ok: true };
  } catch (err) {
    console.error("[edbot] fetch threw:", err);
    return { ok: false, reason: "exception", error: err };
  }
}
