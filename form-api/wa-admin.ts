/**
 * Пульт WhatsApp-сообществ в админке бота воркшопа (вкладка «WhatsApp» в Telegram Mini App, admin-app.html).
 *
 *   GET  /api/admin/wa/state          всё для экрана: режим, подключение, сообщества, ближайшее сообщение, серия, журнал
 *   GET  /api/admin/wa/connection     состояние подключения у Evolution прямо сейчас, номер и имя профиля
 *   GET  /api/admin/wa/groups         группы и сообщества номера (?refresh=1 обновить, не чаще раза в 20 секунд)
 *   POST /api/admin/wa/qr             QR для подключения (инстанса нет: создаётся); пульт зовёт раз в 15 до 20 секунд
 *   POST /api/admin/wa/logout         отключить номер                                   {confirm:true}
 *   POST /api/admin/wa/mode           режим                                             {mode:"daily"|"event", confirm:true}
 *   POST /api/admin/wa/daily          ежедневное создание вкл/выкл                      {enabled:bool, confirm:true при включении}
 *   POST /api/admin/wa/daily/create   создать сообщество следующего эфира сейчас        {confirm:true}
 *   POST /api/admin/wa/event          сохранить живой эфир                              {date, start, recruitFrom}
 *   POST /api/admin/wa/event/create   создать сообщество живого эфира сейчас            {confirm:true}
 *   POST /api/admin/wa/event/reset    сбросить настройки живого эфира                   {confirm:true}
 *   POST /api/admin/wa/pause          пауза модуля
 *   POST /api/admin/wa/resume         снять паузу
 *   POST /api/admin/wa/send           отправить сообщение серии в текущее сообщество    {id, confirm:true}
 *
 * Доступ тот же, что у остальных данных админки (tg-miniapp.ts, gateAdminSession): подпись initData Telegram на каждый
 * запрос, user.id из ADMIN_APP_IDS, токен сессии после ввода пароля. Ключ Evolution в браузер не попадает: всё идёт
 * через form-api. Всё, что может отправить сообщение, создать сообщество или отключить номер, требует confirm:true:
 * подтверждение показывает сама страница, а сервер не принимает запрос без него. Защита номера действует как у команд бота
 * (пауза между отправками, лимит новых сообществ в сутки, строго по одному запросу к Evolution).
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { adminJson, adminReadBody, gateAdminSession } from "./tg-miniapp";
import * as wa from "./wa-groups";

const MAX_BODY = 4096;

/** Код причины отказа в статус ответа. Всё неизвестное, что не ok, это конфликт состояния (409). */
const STATUS: Record<string, number> = {
  bad_request: 400,
  bad_date: 400,
  bad_start: 400,
  bad_recruit: 400,
  bad_id: 400,
  no_id: 400,
  confirm: 400,
  evolution: 502,
  internal: 500,
};
const statusOf = (a: { ok: boolean; code?: string }) => (a.ok ? 200 : STATUS[a.code || ""] ?? 409);

type Body = Record<string, unknown>;

async function readBody(req: IncomingMessage): Promise<Body | null> {
  const raw = await adminReadBody(req, MAX_BODY);
  if (raw === null) return null;
  if (!raw.trim()) return {};
  try {
    const x = JSON.parse(raw);
    return x && typeof x === "object" && !Array.isArray(x) ? (x as Body) : null;
  } catch {
    return null;
  }
}

const NEED_CONFIRM = { ok: false, code: "confirm", message: "Нужно подтверждение действия." };

/** Маршруты /api/admin/wa/*. Не бросает: любая ошибка становится ответом 500 без подробностей. */
export async function handleWaAdmin(req: IncomingMessage, res: ServerResponse, path: string): Promise<void> {
  const gate = gateAdminSession(req);
  if (!gate.ok) return adminJson(res, gate.status, gate.body);
  const what = path.replace(/^\/api\/admin\/wa\//, "").replace(/\/+$/, "");
  const method = req.method || "GET";
  try {
    if (method === "GET") {
      const qs = new URL(req.url || "/", "http://localhost").searchParams;
      if (what === "state") return adminJson(res, 200, wa.waPanel());
      if (what === "connection") {
        const x = await wa.waConnection();
        return adminJson(res, statusOf(x), x);
      }
      if (what === "groups") {
        const x = await wa.waGroups(qs.get("refresh") === "1");
        return adminJson(res, statusOf(x), x);
      }
      return adminJson(res, 404, { ok: false, error: "not_found" });
    }
    if (method !== "POST") return adminJson(res, 405, { ok: false, error: "method" });

    const body = await readBody(req);
    if (body === null) return adminJson(res, 400, { ok: false, code: "bad_request", message: "Не удалось прочитать запрос." });
    const confirmed = body.confirm === true;
    const done = (x: { ok: boolean; code?: string; message: string }) => adminJson(res, statusOf(x), x);

    switch (what) {
      case "qr": {
        const x = await wa.waQr();
        return adminJson(res, statusOf(x), x);
      }
      case "logout":
        return confirmed ? done(await wa.waLogout()) : done(NEED_CONFIRM);
      case "mode":
        return confirmed ? done(wa.waSetMode(body.mode)) : done(NEED_CONFIRM);
      case "daily":
        // Выключить можно сразу, включить только после подтверждения: включение запускает создание сообществ.
        return body.enabled === false || confirmed ? done(wa.waSetDaily(body.enabled)) : done(NEED_CONFIRM);
      case "daily/create":
        return confirmed ? done(await wa.waDailyCreateNow()) : done(NEED_CONFIRM);
      case "event":
        return done(wa.waSetEvent({ date: body.date, start: body.start, recruitFrom: body.recruitFrom }));
      case "event/create":
        return confirmed ? done(await wa.waEventCreateNow()) : done(NEED_CONFIRM);
      case "event/reset":
        return confirmed ? done(wa.waEventReset()) : done(NEED_CONFIRM);
      case "pause":
        return done(wa.waPause());
      case "resume":
        return done(wa.waResume());
      case "send": {
        if (!confirmed) return done(NEED_CONFIRM);
        const x = await wa.waSendSeries(body.id);
        return adminJson(res, statusOf(x), x);
      }
    }
    return adminJson(res, 404, { ok: false, error: "not_found" });
  } catch (e) {
    // В лог только текст ошибки: в нём нет ни паролей, ни initData, ни ключей.
    console.error("[wa-admin] ошибка:", String((e as Error)?.message || e).slice(0, 200));
    if (!res.headersSent) adminJson(res, 500, { ok: false, code: "internal", message: "Внутренняя ошибка. Попробуй ещё раз." });
  }
}
