/**
 * Рантайм-хранилище ссылки на WhatsApp-сообщество для страницы /thank-you.
 *
 * Ссылка меняется КАЖДЫЙ ДЕНЬ, поэтому она НЕ зашита в код и НЕ в env
 * (и то и другое требует пересборки). Вместо этого — изменяемый JSON-файл
 * на сервере, который правит Telegram-бот (см. app/api/tg-link/route.ts),
 * а страница thank-you читает при каждом заходе (server component, force-dynamic).
 *
 * Контракт never-throw: при любой ошибке возвращаем фолбэк / результат-объект,
 * никогда не роняем рендер thank-you (это конверсионная страница).
 *
 * ENV:
 *   WHATSAPP_LINK_PATH=/var/lib/workshop/whatsapp-link.json  (на сервере; локально ./.data/whatsapp-link.json)
 *   WHATSAPP_COMMUNITY_FALLBACK=https://chat.whatsapp.com/...  (если файл ещё не создан)
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  renameSync,
} from "node:fs";
import { dirname } from "node:path";

const LINK_PATH =
  process.env.WHATSAPP_LINK_PATH || "/var/lib/workshop/whatsapp-link.json";

// Фолбэк, если файл ещё не создан или нечитаем. Текущая боевая ссылка
// сообщества воркшопа (живой эфир — среда). Обновлено 2026-06-21.
const FALLBACK =
  process.env.WHATSAPP_COMMUNITY_FALLBACK ||
  "https://chat.whatsapp.com/JVdWLXG9L8jCTUp2W2vxeu";

export type LinkRecord = {
  link: string;
  updatedAt: string;
  updatedBy?: string | number;
};

/**
 * Разрешаем ТОЛЬКО ссылки на WhatsApp (анти-фишинг): даже если кто-то
 * подделает запрос к вебхуку, нельзя подставить произвольный редирект.
 */
export function isValidWhatsAppLink(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  // Узкий allowlist: только реальные форматы инвайта/контакта WhatsApp.
  return host === "chat.whatsapp.com" || host === "wa.me";
}

/** Текущая ссылка. Never-throw: при любой ошибке — фолбэк. */
export function readWhatsAppLink(): string {
  try {
    if (!existsSync(LINK_PATH)) return FALLBACK;
    const rec = JSON.parse(readFileSync(LINK_PATH, "utf8")) as Partial<LinkRecord>;
    if (rec && typeof rec.link === "string" && isValidWhatsAppLink(rec.link)) {
      return rec.link;
    }
    return FALLBACK;
  } catch {
    return FALLBACK;
  }
}

/** Полная запись (для бота: показать когда/кем обновляли). Never-throw. */
export function readWhatsAppRecord(): LinkRecord {
  try {
    if (existsSync(LINK_PATH)) {
      const rec = JSON.parse(readFileSync(LINK_PATH, "utf8")) as Partial<LinkRecord>;
      if (rec && typeof rec.link === "string" && isValidWhatsAppLink(rec.link)) {
        return {
          link: rec.link,
          updatedAt: rec.updatedAt || "",
          updatedBy: rec.updatedBy,
        };
      }
    }
  } catch {
    /* fallthrough */
  }
  return { link: FALLBACK, updatedAt: "", updatedBy: undefined };
}

/** Перезаписать ссылку. Возвращает результат, не кидает. */
export function writeWhatsAppLink(
  link: string,
  by?: string | number
): { ok: boolean; error?: string } {
  const clean = link.trim();
  if (!isValidWhatsAppLink(clean)) {
    return { ok: false, error: "not_a_whatsapp_link" };
  }
  try {
    mkdirSync(dirname(LINK_PATH), { recursive: true });
    const rec: LinkRecord = {
      link: clean,
      updatedAt: new Date().toISOString(),
      updatedBy: by,
    };
    // Атомарная запись: temp + rename. Читатель thank-you всегда видит
    // либо старый, либо новый файл целиком — без торн-ридов в момент смены.
    const tmp = `${LINK_PATH}.tmp.${process.pid}`;
    writeFileSync(tmp, JSON.stringify(rec, null, 2) + "\n", "utf8");
    renameSync(tmp, LINK_PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
