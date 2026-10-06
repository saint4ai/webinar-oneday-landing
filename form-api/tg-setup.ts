/**
 * Разовая настройка бота @workshop_aiprod_bot. Запуск на сервере вручную после деплоя:
 *   node tg-setup.js [путь/к/картинке.jpg]
 * Читает .env рядом с бандлом (как server.ts), токен берёт из TG_WORKSHOP_BOT_TOKEN.
 * Каждый шаг печатает результат; токен и секрет не печатаются никогда.
 * Имя бота не меняется. Код выхода 1, если какой-то шаг не прошёл.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { botCall, botToken, webhookSecret } from "./tg-workshop";

const WEBHOOK_URL = "https://onai.academy/workshop/api/tg-workshop";
const DESCRIPTION = "Бот бесплатного воркшопа «Вайб-продакшен». Пришлю ссылку на эфир, напоминания и условия для участников. Нажмите «Запустить».";
const SHORT_DESCRIPTION = "Ссылка на воркшоп «Вайб-продакшен» и напоминания";

/** Тот же разбор .env, что в server.ts: уже заданные переменные окружения приоритетнее. */
function loadEnv() {
  try {
    const raw = readFileSync(process.env.FORM_API_ENV || join(__dirname, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const eq = s.indexOf("=");
      if (eq < 1) continue;
      const key = s.slice(0, eq).trim();
      if (process.env[key] === undefined) process.env[key] = s.slice(eq + 1).trim();
    }
  } catch {
    console.warn("[tg-setup] .env не найден, работаю на переменных окружения");
  }
}

let failures = 0;

function report(step: string, r: Awaited<ReturnType<typeof botCall>>, note = "") {
  if (r.ok) console.log(`OK    ${step}${note ? ` (${note})` : ""}`);
  else {
    failures++;
    console.log(`FAIL  ${step}: ${r.code} ${r.description}`);
  }
}

async function main() {
  loadEnv();
  if (!botToken()) {
    console.error("Нет TG_WORKSHOP_BOT_TOKEN: дописать в .env и повторить.");
    process.exit(1);
  }
  if (!webhookSecret()) {
    console.error("Нет TG_WORKSHOP_WEBHOOK_SECRET: дописать в .env и повторить.");
    process.exit(1);
  }

  // 1. Вебхук. Ожидающие апдейты не сбрасываем: drop_pending_updates не передаём.
  report(
    `1/6 setWebhook ${WEBHOOK_URL}`,
    await botCall("setWebhook", {
      url: WEBHOOK_URL,
      secret_token: webhookSecret(),
      allowed_updates: ["message", "callback_query", "my_chat_member"],
    }),
  );

  // 2. Аватарка: InputProfilePhotoStatic, файл multipart под именем avatar, ссылка attach://avatar.
  const photoPath = process.argv[2] || process.env.BOT_AVATAR_FILE || join(__dirname, "ava-studio.jpg");
  if (existsSync(photoPath)) {
    const form = new FormData();
    form.append("photo", JSON.stringify({ type: "static", photo: "attach://avatar" }));
    form.append("avatar", new Blob([new Uint8Array(readFileSync(photoPath))], { type: "image/jpeg" }), basename(photoPath));
    report("2/6 setMyProfilePhoto", await botCall("setMyProfilePhoto", form, 30_000), basename(photoPath));
  } else {
    failures++;
    console.log(`FAIL  2/6 setMyProfilePhoto: файл не найден: ${photoPath} (путь передаётся аргументом)`);
  }

  // 3-5. Описание, короткое описание, команды. Имя бота не трогаем.
  report("3/6 setMyDescription", await botCall("setMyDescription", { description: DESCRIPTION }));
  report("4/6 setMyShortDescription", await botCall("setMyShortDescription", { short_description: SHORT_DESCRIPTION }));
  report(
    "5/6 setMyCommands",
    await botCall("setMyCommands", {
      commands: [
        { command: "start", description: "Записаться на воркшоп" },
        { command: "stop", description: "Не присылать сообщения" },
      ],
    }),
  );

  // 6. Итог: состояние вебхука и сам бот.
  const wh = await botCall<Record<string, unknown>>("getWebhookInfo", {});
  report("6/6 getWebhookInfo", wh);
  if (wh.ok) {
    const w = wh.result;
    console.log(`      url: ${w.url}`);
    console.log(`      pending_update_count: ${w.pending_update_count}`);
    console.log(`      allowed_updates: ${JSON.stringify(w.allowed_updates)}`);
    console.log(`      last_error_message: ${w.last_error_message ?? "нет"}`);
  }
  const me = await botCall<Record<string, unknown>>("getMe", {});
  report("      getMe", me);
  if (me.ok) console.log(`      id: ${me.result.id}, @${me.result.username}, имя: ${me.result.first_name}`);

  console.log(failures ? `\nНе прошло шагов: ${failures}` : "\nВсе шаги прошли.");
  // Без process.exit: на Windows он сразу после fetch роняет libuv. Процесс закончится сам.
  process.exitCode = failures ? 1 : 0;
}

main().catch((e) => {
  console.error("[tg-setup] сбой:", String((e as Error)?.message || e).split(botToken() || "\u0000").join("***"));
  process.exitCode = 1;
});
