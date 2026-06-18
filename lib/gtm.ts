/**
 * GTM dataLayer push для конверсии Google Ads.
 *
 * Событие `workshop_lead` ловит Custom Event триггер в GTM-контейнере
 * (GTM-TLK5NPZF) → тег конверсии Google Ads + Enhanced Conversions (телефон).
 * Пушим на УСПЕШНЫЙ сабмит формы, ДО редиректа в WhatsApp-бот (thank-you
 * страницы нет). lead_phone в E.164 (+7XXXXXXXXXX) для матча оплат из AmoCRM.
 *
 * Never-throw: если dataLayer недоступен — лид всё равно ок.
 */
export function pushWorkshopLead(rawPhone: string): void {
  try {
    const d = rawPhone.replace(/\D/g, "");
    const phone =
      d.length === 11 && d[0] === "8"
        ? "+7" + d.slice(1)
        : d.length === 10
          ? "+7" + d
          : d
            ? "+" + d
            : "";
    const w = window as unknown as {
      dataLayer?: Array<Record<string, unknown>>;
    };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: "workshop_lead", lead_phone: phone });
  } catch {
    /* dataLayer недоступен — не критично */
  }
}
