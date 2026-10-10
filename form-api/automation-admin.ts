/**
 * Общий рубильник «Автоматизация» в админке (вверху экрана, на любой вкладке). Состояние и правила: automation.ts.
 *
 *   GET  /api/admin/automation    состояние: включена или нет, кем и когда выключили, причина, пауза WhatsApp, серия Telegram
 *   POST /api/admin/automation    {on: bool, confirm: true, reason?: "..."}  включить или выключить
 *
 * Доступ тот же, что у остальных данных админки (tg-miniapp.ts, gateAdminSession): подпись initData Telegram, user.id из
 * ADMIN_APP_IDS, токен сессии. Подтверждение нужно в обе стороны, страница показывает его текстом, а сервер не принимает
 * запрос без confirm:true. Переключение пишется на диск и уведомляет владельцев в Telegram (switchAutomation в tg-workshop).
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { adminJson, adminReadBody, gateAdminSession } from "./tg-miniapp";
import { automationInfo, KEEPS_TEXT, STOPS_TEXT, stampText } from "./automation";
import { getStore, switchAutomation, waPauseInfo } from "./tg-workshop";

const MAX_BODY = 2048;

/** Что видит админка: состояние рубильника и всё, что нужно для текста подтверждения. */
export function automationView() {
  const i = automationInfo();
  const wa = waPauseInfo();
  let seriesEnabled: boolean | null = null;
  try {
    seriesEnabled = getStore().state.seriesEnabled;
  } catch {
    seriesEnabled = null;
  }
  return {
    ok: true,
    on: i.on,
    offAt: i.offAt,
    offBy: i.offBy,
    offReason: i.offReason,
    onAt: i.onAt,
    onBy: i.onBy,
    /** Одна строка под переключателем: с каких пор выключена (кем, почему) или когда включена. */
    sinceText: i.on ? (i.onAt ? `Включена ${stampText(i.onAt)}, ${i.onBy || "кем не указано"}.` : "") : `Выключена с ${stampText(i.offAt)}, ${i.offBy || "кем не указано"}. Причина: ${i.offReason || "без причины"}.`,
    wa: { running: wa !== null, paused: !!wa?.paused, pausedReason: wa?.paused ? wa.reason : "" },
    seriesEnabled,
    stops: STOPS_TEXT,
    keeps: KEEPS_TEXT,
  };
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown> | null> {
  const raw = await adminReadBody(req, MAX_BODY);
  if (raw === null) return null;
  if (!raw.trim()) return {};
  try {
    const x = JSON.parse(raw);
    return x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Маршрут /api/admin/automation. Не бросает: любая ошибка становится ответом 500 без подробностей. */
export async function handleAutomationAdmin(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const gate = gateAdminSession(req);
  if (!gate.ok) return adminJson(res, gate.status, gate.body);
  const method = req.method || "GET";
  try {
    if (method === "GET" || method === "HEAD") return adminJson(res, 200, automationView());
    if (method !== "POST") return adminJson(res, 405, { ok: false, error: "method" });
    const body = await readBody(req);
    if (body === null) return adminJson(res, 400, { ok: false, code: "bad_request", message: "Не удалось прочитать запрос." });
    if (typeof body.on !== "boolean") return adminJson(res, 400, { ok: false, code: "bad_request", message: "Нужно on: true или false." });
    if (body.confirm !== true) return adminJson(res, 400, { ok: false, code: "confirm", message: "Нужно подтверждение действия." });
    const reason = typeof body.reason === "string" ? body.reason : "";
    const r = await switchAutomation(body.on, `из админки, id ${gate.userId}`, reason.trim() || "вручную, из админки");
    return adminJson(res, 200, { ...automationView(), changed: r.changed, message: r.changed ? (body.on ? "Автоматизация включена." : "Автоматизация выключена.") : r.text });
  } catch (e) {
    console.error("[automation-admin] ошибка:", String((e as Error)?.message || e).slice(0, 200));
    if (!res.headersSent) adminJson(res, 500, { ok: false, code: "internal", message: "Внутренняя ошибка. Попробуй ещё раз." });
  }
}
