/**
 * Общий рубильник «Автоматизация» (docs/tasks/automation_master_switch_event_mode.md).
 *
 * Один переключатель на весь form-api. Выключено значит:
 *  - WhatsApp-модуль (wa-groups.ts) не создаёт сообщества, не шлёт серию и не одобряет заявки, как на паузе;
 *  - Telegram-планировщик (tg-scheduler.ts) не шлёт ни одного планового сообщения серии, включая essential.
 * Не трогает: ответы бота на действия человека (/start, кнопки), ИИ-ассистента в личке WhatsApp и дожим WABA (у них свои
 * переключатели), ссылку на сайте, отчёты владельцам.
 *
 * Состояние лежит на диске (DATA_DIR/automation-state.json, перезапись через temp и rename) и переживает рестарт. Это не
 * пауза WhatsApp: wa-state.json (paused, pausedReason) рубильник не меняет, поэтому включение возвращает всё как было до
 * выключения, а модуль, вставший на паузу по сбою, остаётся на паузе с прежней причиной.
 *
 * Файла нет: включено. Файл есть, но не читается: выключено (рассылки без согласия владельца хуже, чем молчание; включается
 * одной кнопкой). Этот модуль ни от кого не зависит: Telegram, WhatsApp и админка берут состояние отсюда.
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dayKeyOf, hhmmOf } from "./tg-time";

export type AutoInfo = {
  on: boolean;
  /** Когда, кем и почему выключили (мс; пусто, пока не выключали). */
  offAt: number;
  offBy: string;
  offReason: string;
  /** Когда и кем включили обратно. */
  onAt: number;
  onBy: string;
};

const fresh = (): AutoInfo => ({ on: true, offAt: 0, offBy: "", offReason: "", onAt: 0, onBy: "" });

let dir = "";
let state: AutoInfo = fresh();
type Listener = (info: AutoInfo, ev: "on" | "off") => void;
const listeners = new Set<Listener>();

const file = () => (dir ? join(dir, "automation-state.json") : "");

/** Записать состояние на диск. false: не получилось (после перезапуска вернётся прежнее состояние). Нет папки данных (тесты): true. */
function save(): boolean {
  const f = file();
  if (!f) return true;
  try {
    const tmp = `${f}.tmp.${process.pid}`;
    writeFileSync(tmp, JSON.stringify({ v: 1, ...state }, null, 2) + "\n", "utf8");
    renameSync(tmp, f);
    return true;
  } catch (e) {
    console.error("[automation] не смог записать automation-state.json:", (e as Error).message);
    return false;
  }
}

const str = (x: unknown, max = 200) => (typeof x === "string" ? x.slice(0, max) : "");
const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : 0);

/** Подхватить состояние из папки данных. Вызывается при старте бота и модуля WhatsApp, повторный вызов перечитывает файл. */
export function initAutomation(dataDir: string): void {
  dir = dataDir;
  state = fresh();
  const f = file();
  try {
    mkdirSync(dataDir, { recursive: true });
  } catch {
    /* папку создаст тот, кто пишет данные */
  }
  if (!f || !existsSync(f)) return;
  try {
    const raw = JSON.parse(readFileSync(f, "utf8")) as Partial<AutoInfo>;
    if (!raw || typeof raw !== "object" || typeof raw.on !== "boolean") throw new Error("нет поля on");
    state = { on: raw.on, offAt: num(raw.offAt), offBy: str(raw.offBy), offReason: str(raw.offReason), onAt: num(raw.onAt), onBy: str(raw.onBy) };
  } catch {
    console.warn("[automation] automation-state.json нечитаем: автоматизация считается выключенной, включи её в админке или командой /auto_on");
    state = { ...fresh(), on: false, offAt: Date.now(), offBy: "система", offReason: "файл состояния не прочитался" };
  }
}

/** Для тестов и перезагрузки: забыть папку и вернуть «включено». */
export function resetAutomation(): void {
  dir = "";
  state = fresh();
  listeners.clear();
}

/** Автоматизация включена. До инициализации тоже true: тесты отдельных частей не обязаны её запускать. */
export const automationOn = (): boolean => state.on;

export const automationInfo = (): AutoInfo => ({ ...state });

/** Подписка на смену состояния (WhatsApp пишет её в свой журнал). Возвращает отписку. */
export function onAutomationChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

/** saved: состояние записано на диск (false: после перезапуска вернётся прежнее). */
export type AutoChange = { changed: boolean; info: AutoInfo; saved: boolean };

/** Добавляется к ответу владельцу, если состояние не записалось на диск. */
export const NOT_SAVED_TEXT = "Не сохранилось на диск: после перезапуска вернётся прежнее состояние.";

/**
 * Включить или выключить. Повтор того же состояния ничего не меняет (changed: false), время и причина прежние.
 * by: кто нажал («из админки», «командой /auto_off, Александр»), reason: зачем (необязательно, до 200 знаков).
 */
export function setAutomation(on: boolean, by: string, reason = "", nowArg?: number): AutoChange {
  if (state.on === on) return { changed: false, info: automationInfo(), saved: true };
  const now = nowArg ?? Date.now();
  if (on) state = { ...state, on: true, onAt: now, onBy: str(by, 100) };
  else state = { ...state, on: false, offAt: now, offBy: str(by, 100), offReason: str(reason).trim() || "без причины", onAt: 0, onBy: "" };
  const saved = save();
  const info = automationInfo();
  for (const fn of listeners) {
    try {
      fn(info, on ? "on" : "off");
    } catch {
      /* слушатель не должен ломать переключение */
    }
  }
  return { changed: true, info, saved };
}

/** «10.10 в 21:05» по Алматы. */
export const stampText = (ms: number): string => `${dayKeyOf(ms).slice(8, 10)}.${dayKeyOf(ms).slice(5, 7)} в ${hhmmOf(ms)}`;

/** Что останавливает выключение и что продолжает работать: общий текст для уведомления, команды бота и подтверждения в админке. */
export const STOPS_TEXT =
  "Остановятся: WhatsApp не создаёт сообщества, не шлёт рассылку и не одобряет заявки; Telegram не шлёт плановые сообщения серии, включая обязательные.";
export const KEEPS_TEXT =
  "Продолжат работать: ответы бота на /start и кнопки, ссылка на сайте, ИИ-ассистент в личке WhatsApp и дожим WABA (у них свои переключатели).";

/** Уведомление владельцам: что произошло, кем и когда. */
export function changeText(on: boolean, info: AutoInfo, wa?: { paused: boolean; reason: string } | null): string {
  if (!on) {
    return [
      `Автоматизация выключена. Кем: ${info.offBy || "не указано"}. Когда: ${stampText(info.offAt)}. Причина: ${info.offReason || "без причины"}.`,
      STOPS_TEXT,
      KEEPS_TEXT,
      "Включить: /auto_on или переключатель вверху админки.",
    ].join("\n");
  }
  const lines = [
    `Автоматизация включена. Кем: ${info.onBy || "не указано"}. Когда: ${stampText(info.onAt)}.`,
    "Рассылки идут по расписанию дальше. Что должно было уйти, пока было выключено, не досылается: опоздавшее больше чем на 12 минут (Telegram) и больше чем на 45 минут (WhatsApp) пропускается.",
  ];
  if (wa?.paused) lines.push(`WhatsApp-модуль остаётся на паузе: ${wa.reason || "причина не записана"}. Снять: /wa_resume.`);
  return lines.join("\n");
}
