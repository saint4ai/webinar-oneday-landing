/**
 * Telegram для связи в заявке воркшопа: поле необязательное, ник чистим и проверяем здесь.
 * Модуль без зависимостей: его берут и приём заявок, и очередь Supabase, и админка.
 */

/** Ключ в jsonb-поле utm строки workshop_leads: отдельной колонки под Telegram там нет, миграцию не делаем. */
export const TG_UTM_KEY = "telegram";

/**
 * Ник из того, что вписал человек: «@nick», «nick», «t.me/nick», «https://t.me/nick», «telegram.me/nick».
 * Допустимы латинские буквы, цифры и «_», от 4 до 32 знаков. Всё остальное (мусор, инвайт-ссылка, пустая
 * строка, не строка) считаем пустым: заявку из-за Telegram не отклоняем.
 */
export function normalizeTelegram(raw: unknown): string {
  if (typeof raw !== "string") return "";
  let s = raw.slice(0, 300).replace(/\s+/g, "");
  s = s.replace(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me|telegram\.dog)\//i, "");
  s = s.replace(/^@+/, "");
  s = s.replace(/[/?#].*$/, ""); // хвост ссылки: «nick/», «nick?start=...»
  return /^[A-Za-z0-9_]{4,32}$/.test(s) ? s : "";
}

/** Положить ник в utm строки Supabase. Чужой ключ telegram из присланных меток вычищается. */
export function packUtm(utm: Record<string, string> | undefined, telegram: string | undefined): Record<string, string> | null {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(utm ?? {})) if (k !== TG_UTM_KEY) out[k] = v;
  if (telegram) out[TG_UTM_KEY] = telegram;
  return Object.keys(out).length ? out : null;
}

/** Достать из utm строки Supabase чистые метки и ник (ник проходит ту же проверку). */
export function unpackUtm(raw: Record<string, string> | null | undefined): { utm?: Record<string, string>; telegram?: string } {
  if (!raw || typeof raw !== "object") return {};
  const utm: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) if (k !== TG_UTM_KEY) utm[k] = v;
  const telegram = normalizeTelegram(raw[TG_UTM_KEY]);
  return {
    ...(Object.keys(utm).length ? { utm } : {}),
    ...(telegram ? { telegram } : {}),
  };
}
