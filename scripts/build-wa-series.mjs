// Собирает form-api/wa-series.json из секции whatsapp в docs/mailings/chain-v2.json.
// Запуск из корня репозитория: node scripts/build-wa-series.mjs
// Тексты, время, картинки и варианты опроса берутся из chain-v2 без правок. Остальное (названия, описание,
// приветствие, темп, лимиты) задано здесь. Тест form-api/wa.test.ts сверяет итоговый json с chain-v2.
// Время «+1 день HH:MM» становится at «HH:MM» и dayOffset 1: сообщение уходит в то же сообщество на следующий день.
// Одна правка текста при переносе: метка места под видео в начале («[Видео Александра, 15 с]») в подпись не идёт.
import { readFileSync, writeFileSync } from "node:fs";

const chain = JSON.parse(readFileSync("docs/mailings/chain-v2.json", "utf8"));
const IMG = chain.base.img; // https://onai.academy/workshop-montazh/assets/tg/

/** id по времени отправки: короткие и стабильные, по ним идут журнал и команда /wa_send. */
const IDS = {
  "11:30": "morning",
  "12:00": "reel-119k",
  "12:30": "reg-bonus",
  "14:00": "warm-edits",
  "15:00": "personal",
  "16:00": "noface",
  "17:00": "numbers",
  "17:30": "video-ai",
  "19:00": "live-bonus",
  "19:30": "t-minus-30",
  "19:50": "t-minus-10",
  "20:00": "live-now",
  "20:10": "live-10",
  "20:15": "last-link",
  "20:58": "training",
  "21:18": "offer",
  "22:30": "push",
  "23:30": "last-call",
  "+1 день 10:30": "next-1030",
  "+1 день 15:00": "next-1500",
  "+1 день 19:50": "replay-link",
  "+1 день 21:45": "next-2145",
};

/** Файлы, которых ещё нет: сообщение выключено (enabled: false), пока файл не появится в workshop-montazh/assets/tg. */
const NOT_READY = new Set(["personal-1500.mp4", "video-ai-montage.mp4"]); // 17:30: старая версия прогрева забракована 09.10, ждём новую на 40 с

/** Метка места под видео в начале текста: «[Видео Александра, 15 с]» и пустая строка. В подпись к видео она не идёт. */
const SLOT = /^\[[^\]\n]+\]\n\n/;

const POLL_NAME = "Придёшь сегодня на эфир?"; // формулировка из ТЗ; в chain-v2 было «... в 20:00?»

const messages = chain.whatsapp.map((m) => {
  const id = IDS[m.at];
  if (!id) throw new Error(`нет id для сообщения ${m.at}`);
  const next = /^\+(\d+) день (\d{1,2}:\d{2})$/.exec(m.at);
  const out = { id, at: next ? next[2].padStart(5, "0") : m.at, ...(next ? { dayOffset: Number(next[1]) } : {}), topic: m.topic };
  let video = false;
  if (m.media) {
    video = /\.mp4$/i.test(m.media);
    if (NOT_READY.has(m.media)) out.enabled = false;
    out.media = { type: video ? "video" : "image", url: IMG + m.media };
  }
  out.text = video ? m.text.replace(SLOT, "") : m.text;
  if (m.extra && /опрос/i.test(m.extra)) {
    const tail = m.extra.split("»:")[1] ?? m.extra.split(":").pop();
    const options = tail.split("/").map((s) => s.trim()).filter(Boolean);
    out.poll = { name: POLL_NAME, options, selectableCount: 1 };
  }
  return out;
});

const series = {
  _about:
    "Расписание WhatsApp-сообщества эфира. Сообщения собираются скриптом scripts/build-wa-series.mjs из секции whatsapp в docs/mailings/chain-v2.json (правь chain-v2 и запускай скрипт, а не этот файл). Время по Алматы, день эфира D, сообщения идут в день D; у сообщений с dayOffset 1 время следующего дня (D+1), они уходят в то же сообщество и не попадают в сообщество следующего эфира. Название, описание и приветствие написаны под модуль и уходят в WhatsApp только после «ок» Александра.",
  version: "2026-10-09.1",
  timezone: "Asia/Almaty",
  streamStart: "20:00",
  streamMinutes: 80,
  joinLiveMinutes: 40,
  graceMinutes: 12,
  target: "community",
  createCatchupHours: 6,
  closeAt: "00:00",
  maxNewPerDay: 3,
  overflowAt: { community: 1900, group: 1000 },
  memberCheckMinutes: 5,
  captionLimit: 1024,
  pacing: { betweenSendsMs: [4000, 9000], betweenStepsMs: [2000, 4000] },
  retry: { backoffSec: [60, 180], pauseAfter: 3 },
  // idleSec и hotMinutes: щадящий режим. Горячий интервал 15 до 30 с действует 10 минут после выдачи ссылки или найденных заявок, в остальное время опрос раз в 2 до 4 минут.
  joinPolling: { servingSec: [15, 30], otherSec: [90, 150], batch: 20, keepAfterCloseMin: 60, idleSec: [120, 240], hotMinutes: 10 },
  alarms: { connectionEveryMinutes: 60 },
  name: "Вайб-продакшен · эфир {date}",
  description:
    "Бесплатный воркшоп «Вайб-продакшен» от onAI Academy: как ИИ-агент монтирует рилсы без монтажёра и без лица в кадре. Эфир в 20:00 по Алматы. Здесь напоминания и ссылка на эфир.",
  welcome:
    "Это сообщество бесплатного воркшопа «Вайб-продакшен». Эфир {dayWordLower} в 20:00 по Алматы (18:00 по Москве). Сюда придут напоминания и ссылка на эфир, писать здесь могут только админы. Записи не будет, приходи вживую.",
  avatar: [IMG + "wa-avatar.jpg", IMG + "cover-bizon.jpg"],
  messages,
};

const bad = JSON.stringify(series).includes(String.fromCharCode(0x2014));
if (bad) throw new Error("в расписании длинное тире");
writeFileSync("form-api/wa-series.json", JSON.stringify(series, null, 2) + "\n", "utf8");
console.log("wa-series.json: сообщений", messages.length);
