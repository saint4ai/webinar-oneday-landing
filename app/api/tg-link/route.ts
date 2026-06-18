/**
 * POST /api/tg-link — Telegram webhook. Владелец присылает боту новую ссылку
 * на WhatsApp-сообщество → она тут же подставляется на /thank-you (без пересборки).
 *
 * Защита (3 слоя):
 *   1. Секретный токен вебхука — заголовок X-Telegram-Bot-Api-Secret-Token
 *      (Telegram шлёт его, если задать secret_token при setWebhook).
 *   2. Allowlist отправителя — from.id ∈ TG_LINK_OWNER_IDS (только Александр).
 *   3. Валидация ссылки — принимаем ТОЛЬКО домены WhatsApp (анти-фишинг).
 *
 * Любой ответ Telegram = 200, чтобы не провоцировать ретрай-шторм.
 *
 * ENV:
 *   TG_LINK_BOT_TOKEN=<токен бота>
 *   TG_LINK_WEBHOOK_SECRET=<секрет, тот же что в setWebhook>
 *   TG_LINK_OWNER_IDS=789638302   (через запятую, если несколько)
 */
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  writeWhatsAppLink,
  readWhatsAppRecord,
  isValidWhatsAppLink,
} from "@/lib/whatsapp-link";

export const dynamic = "force-dynamic";

const SECRET = process.env.TG_LINK_WEBHOOK_SECRET || "";
const OWNER_IDS = (process.env.TG_LINK_OWNER_IDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Сравнение секрета вебхука за константное время. Пустой секрет → false. */
function secretOk(provided: string | null): boolean {
  if (!SECRET || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(SECRET);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const THANKYOU_URL = "https://onai.academy/workshop/thank-you";

/**
 * Ответ пользователю ЧЕРЕЗ тело вебхук-ответа: Telegram сам выполнит sendMessage
 * из JSON, который мы вернули. Без отдельного исходящего fetch → хендлер не
 * зависает и Telegram не ловит «Connection timed out». Бот определяется по
 * самому вебхуку, токен не нужен.
 */
function webhookReply(chatId: number | string, text: string) {
  return NextResponse.json({
    method: "sendMessage",
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

/** Первый http(s)-URL из текста (без хвостовой пунктуации). */
function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/\S+/);
  if (!m) return null;
  return m[0].replace(/[)\]>!.,'"]+$/, "");
}

export async function POST(req: NextRequest) {
  // 1) Секрет вебхука (constant-time)
  if (!secretOk(req.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Ограничение размера тела (анти-DoS): Telegram-апдейт всегда небольшой.
  const len = Number(req.headers.get("content-length") || "0");
  if (len > 16384) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }

  let update: {
    message?: TgMessage;
    edited_message?: TgMessage;
  };
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // мусорный body — молча 200
  }

  const msg = update.message || update.edited_message;
  const chatId = msg?.chat?.id;
  const fromId = msg?.from?.id;
  const text = (msg?.text || "").trim();

  // 2) Авторизация отправителя — чужих молча игнорируем.
  //    Fail-closed: если allowlist пуст (забыли env) — НИКОГО не пускаем.
  if (!fromId || OWNER_IDS.length === 0 || !OWNER_IDS.includes(String(fromId))) {
    return NextResponse.json({ ok: true });
  }

  const url = extractUrl(text);

  // Нет ссылки → подсказка + текущая ссылка
  if (!url) {
    const cur = readWhatsAppRecord();
    const when = cur.updatedAt
      ? `\nОбновлена: ${cur.updatedAt}`
      : "\n(по умолчанию, файл ещё не менялся)";
    return webhookReply(
      chatId!,
      `Пришли новую ссылку на WhatsApp-сообщество — подставлю её на thank-you воркшопа.\n\nТекущая ссылка:\n${cur.link}${when}`
    );
  }

  // 3) Валидация домена
  if (!isValidWhatsAppLink(url)) {
    return webhookReply(
      chatId!,
      `Это не похоже на ссылку WhatsApp.\nЖду вида https://chat.whatsapp.com/... или https://wa.me/...\n\nПрислано: ${url}`
    );
  }

  const res = writeWhatsAppLink(url, fromId);
  if (res.ok) {
    return webhookReply(
      chatId!,
      `✅ Ссылка обновлена и завёрнута в диплинк.\nКнопка на thank-you ведёт в WhatsApp:\n${url}\n\nНа телефоне открывает приложение; встроенные браузеры Instagram/Facebook обработаны (Android — форс, iOS — подсказка + копирование).\nПроверь: ${THANKYOU_URL}`
    );
  }
  return webhookReply(chatId!, `❌ Не удалось сохранить: ${res.error}`);
}

type TgMessage = {
  chat?: { id?: number | string };
  from?: { id?: number | string };
  text?: string;
};
