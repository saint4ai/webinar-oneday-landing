/**
 * EasyBot — выбор ссылки для редиректа после сабмита формы (клиент).
 *
 * Флоу: форма → /api/lead (сервер дёргает EasyBot /register/ и возвращает
 * персональную ссылку с УНИКАЛЬНЫМ кодом в botUrl) → форма показывает
 * «переводим в бота» и редиректит на эту ссылку. Если botUrl нет (register
 * не ответил) — статичная прямая ссылка воронки (общий код) + UTM.
 *
 * Отдельной Thank-You страницы в воронке больше НЕТ — редирект из формы.
 */

// Статичная прямая ссылка EasyBot (общий код воронки) — фолбэк.
const EASYBOT_DIRECT = "https://my.easybot.kz/api/?hash=%3C5kKKpd0H%3E";

export function buildStaticEasybotUrl(utm?: Record<string, string>): string {
  try {
    const params = new URLSearchParams();
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ]) {
      const v = utm?.[k];
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `${EASYBOT_DIRECT}&${qs}` : EASYBOT_DIRECT;
  } catch {
    return EASYBOT_DIRECT;
  }
}

/** Персональная ссылка из /api/lead (уникальный код) или статичный фолбэк. */
export function resolveEasybotRedirect(
  botUrl: string | undefined,
  utm?: Record<string, string>
): string {
  if (botUrl && /^https?:\/\//i.test(botUrl)) return botUrl;
  return buildStaticEasybotUrl(utm);
}
