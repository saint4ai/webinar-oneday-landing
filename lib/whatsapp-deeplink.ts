/**
 * Помощники для надёжного открытия WhatsApp-сообщества из рекламного трафика.
 *
 * Контекст (проверено ресёрчем, 4 источника на факт):
 *  - https://chat.whatsapp.com/<code> — ЕДИНСТВЕННЫЙ задокументированный формат
 *    инвайта в группу; он же universal-link (iOS) / app-link (Android). По РЕАЛЬНОМУ
 *    тапу в обычном браузере открывает приложение на экране «Войти в группу».
 *  - whatsapp://chat?code=... — НЕ задокументирован, не используем.
 *  - Проблема — встроенные браузеры Instagram/Facebook: universal-link там не
 *    срабатывает на авто-редирект (нужен пользовательский тап), а часто и на тап.
 *    Лечится: real-tap + Android intent:// + iOS-нудж «открой в Safari» + копирование.
 */

const INAPP_RE =
  /(FBAN|FBAV|FB_IAB|FBIOS|FB4A|Instagram|Line\/|Snapchat|BytedanceWebview|musical_ly|MicroMessenger|Twitter)/i;

/** Достаёт код приглашения из chat.whatsapp.com/<code> (игнорирует query/хвост). */
export function extractInviteCode(href: string): string | null {
  try {
    const u = new URL(href.trim());
    if (u.hostname.toLowerCase() === "chat.whatsapp.com") {
      const code = u.pathname.replace(/^\/+/, "").split("/")[0];
      return code || null;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

/**
 * Android intent://: форсит открытие WhatsApp; если приложения нет —
 * браузер уходит на S.browser_fallback_url (веб-страница инвайта).
 * Фолбэк-URL обязан быть ПОЛНОСТЬЮ percent-encoded.
 */
export function buildWhatsAppAndroidIntent(code: string): string {
  const fallback = encodeURIComponent(`https://chat.whatsapp.com/${code}`);
  return `intent://chat.whatsapp.com/${code}#Intent;scheme=https;package=com.whatsapp;S.browser_fallback_url=${fallback};end`;
}

/** Эвристика окружения по user-agent (spoofable — это нормально). */
export function detectEnv(ua: string): {
  inApp: boolean;
  isAndroid: boolean;
  isIOS: boolean;
} {
  return {
    inApp: INAPP_RE.test(ua),
    isAndroid: /Android/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua),
  };
}
