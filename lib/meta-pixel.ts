/**
 * Meta Pixel — клиентские хелперы (браузерная половина набора данных
 * `2241406289947143`). Базовый код + PageView грузятся в app/layout.tsx.
 *
 * Событие Lead шлётся на сабмит формы с общим `event_id` — он же уходит
 * на сервер в /api/lead, где дублируется через Conversions API.
 * Дедуп браузер ↔ сервер у Meta идёт по паре (event_name, event_id).
 *
 * Модуль БЕЗ "use client": экспортирует только константу + функции,
 * которые трогают window/document лишь внутри тел (с guard'ами), поэтому
 * его безопасно импортировать и из серверных модулей (нужна только
 * константа META_PIXEL_ID).
 */

// Pixel ID публичный (виден в браузере) — хардкодим, как YM_ID в layout.
export const META_PIXEL_ID = "2241406289947143";

// utm-метки, которые ловим из URL (campaign/adset/creative/placement).
const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_placement",
] as const;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Уникальный event_id для дедупликации браузер ↔ сервер. */
export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)")
  );
  return m ? decodeURIComponent(m[1]) : undefined;
}

export type MetaClientData = {
  fbp?: string;
  fbc?: string;
  eventSourceUrl: string;
  utm: Record<string, string>;
};

/**
 * Собирает Meta-параметры матчинга на клиенте:
 *  - fbp: cookie `_fbp` (ставит сам пиксель)
 *  - fbc: cookie `_fbc`, либо строим из `?fbclid` в URL → `fb.1.<ts>.<fbclid>`
 *  - utm_*: метки кампании из URL
 */
export function collectMetaClientData(): MetaClientData {
  const fbp = readCookie("_fbp");
  let fbc = readCookie("_fbc");
  const utm: Record<string, string> = {};
  let eventSourceUrl = "https://onai.academy/workshop";

  if (typeof window !== "undefined") {
    eventSourceUrl = window.location.href;
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");
    if (!fbc && fbclid) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
    }
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) utm[k] = v;
    }
  }

  return { fbp, fbc, eventSourceUrl, utm };
}

/** Браузерное событие Lead с общим event_id (дедуп с серверным CAPI). */
export function trackLead(eventId: string): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", "Lead", {}, { eventID: eventId });
  }
}
