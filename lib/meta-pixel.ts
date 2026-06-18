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

// ── Sticky-трекинг: метка переживает уход в Instagram-профиль и возврат без ?utm ──
const TRACK_STORAGE_KEY = "onai_tracking_v1";
const TRACK_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней

type StoredTracking = { utm: Record<string, string>; fbclid?: string; ts: number };

function readStoredTracking(): StoredTracking | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(TRACK_STORAGE_KEY);
    if (!raw) return undefined;
    const data = JSON.parse(raw) as StoredTracking;
    if (!data?.ts || Date.now() - data.ts > TRACK_TTL_MS) return undefined;
    return data;
  } catch {
    return undefined;
  }
}

/**
 * Ловит utm/fbclid из URL и кладёт в localStorage (last-touch).
 * Вызывать на маунте лендинга — чтобы метка с рекламного клика пережила
 * уход в Instagram-профиль и возврат на лендинг уже без ?utm в адресе.
 */
export function persistTrackingFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) utm[k] = v;
    }
    const fbclid = params.get("fbclid") || undefined;
    if (Object.keys(utm).length === 0 && !fbclid) return; // нечего сохранять
    window.localStorage.setItem(
      TRACK_STORAGE_KEY,
      JSON.stringify({ utm, fbclid, ts: Date.now() } satisfies StoredTracking)
    );
  } catch {
    /* localStorage недоступен (приватный режим) — деградируем тихо */
  }
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
    // Метка в URL есть → сохраняем (last-touch). Нет → подтягиваем из localStorage,
    // чтобы лид с рекламы не терял креатив после захода через Instagram-профиль.
    persistTrackingFromUrl();
    if (Object.keys(utm).length === 0) {
      const stored = readStoredTracking();
      if (stored?.utm) Object.assign(utm, stored.utm);
      if (!fbc && stored?.fbclid) {
        fbc = `fb.1.${Date.now()}.${stored.fbclid}`;
      }
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
