/**
 * Админ-аналитика бота воркшопа: заявки с сайта (leads.jsonl), подписчики бота, кнопки на «Спасибо»,
 * эфиры, рассылка и ошибки, всё по дням Алматы и по UTM. Только чтение.
 *
 * Файлы читаются с кешем по размеру и времени изменения, добавленные строки дочитываются с
 * прежнего места (журналы только растут), поэтому нажатия кнопок не перечитывают всё заново.
 * Ошибка чтения файла заявок не роняет бота: в отчёте строка «заявки недоступны».
 * В отчётах только числа и метки источников, без имён, телефонов и chat_id.
 * Модуль не импортирует tg-workshop (чтобы не было круговых импортов): текст /stats и отправку
 * делает вызывающий.
 */
import { closeSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import { join } from "node:path";
import { runtime, type SentEntry, type Subscriber, type TgStore } from "./tg-store";
import { addDays, dateLabel, dayKeyOf, hhmmOf, isDayKey, isStreamDay, type TimeCfg } from "./tg-time";

/** Лимит текста сообщения Telegram 4096; оставляем запас на разметку. */
export const MSG_LIMIT = 4000;

export type AdminCtx = {
  store: TgStore;
  cfg: TimeCfg;
  now: number;
  /** Путь к журналу заявок. По умолчанию LEADS_LOG_PATH из окружения. */
  leadsFile?: string;
  /** Версия деплоя (файл VERSION), для экрана ошибок. */
  version?: string;
};

export type AdminButton = { text: string; callback_data: string };

// ───────────────────────── чтение JSONL с кешем ─────────────────────────

type CacheEntry = { size: number; mtime: number; offset: number; rows: Record<string, unknown>[] };
const caches = new Map<string, CacheEntry>();

export type ReadResult = { rows: Record<string, unknown>[]; missing?: boolean; error?: string };

/**
 * Прочитать JSONL. Размер и mtime не изменились: отдаём кеш. Файл вырос: дочитываем только новое
 * (до последнего перевода строки). Файл стал меньше: читаем заново. Битые строки пропускаем.
 */
export function readJsonlCached(file: string): ReadResult {
  let st;
  try {
    st = statSync(file);
  } catch (e) {
    caches.delete(file);
    const code = (e as NodeJS.ErrnoException).code;
    return code === "ENOENT" ? { rows: [], missing: true } : { rows: [], error: String((e as Error).message || e) };
  }
  let c = caches.get(file);
  if (c && c.size === st.size && c.mtime === st.mtimeMs) return { rows: c.rows };
  if (!c || st.size < c.offset) c = { size: 0, mtime: 0, offset: 0, rows: [] };
  try {
    const len = st.size - c.offset;
    if (len > 0) {
      const buf = Buffer.alloc(len);
      const fd = openSync(file, "r");
      try {
        readSync(fd, buf, 0, len, c.offset);
      } finally {
        closeSync(fd);
      }
      const nl = buf.lastIndexOf(10);
      if (nl >= 0) {
        for (const line of buf.subarray(0, nl + 1).toString("utf8").split("\n")) {
          const s = line.trim();
          if (!s) continue;
          try {
            const o = JSON.parse(s);
            if (o && typeof o === "object") c.rows.push(o as Record<string, unknown>);
          } catch {
            /* битая строка */
          }
        }
        c.offset += nl + 1;
      }
    }
    c.size = st.size;
    c.mtime = st.mtimeMs;
    caches.set(file, c);
    return { rows: c.rows };
  } catch (e) {
    caches.delete(file);
    return { rows: [], error: String((e as Error).message || e) };
  }
}

/** Сбросить кеш (для тестов). */
export function resetAdminCache() {
  caches.clear();
  leadMemo = null;
}

// ───────────────────────── заявки ─────────────────────────

export type Lead = {
  id: string;
  eventId: string;
  /** Имя и телефон из заявки. Только для мини-приложения владельца: в текстовые отчёты чата не попадают. */
  name: string;
  phone: string;
  /** Место на странице: hero, popup, dock, header, final. */
  place: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  /** Хост из utm_referrer (instagram.com, l.instagram.com), пусто если нет. */
  refHost: string;
  gclid: boolean;
  ts: number;
  day: string;
};

const low = (v: unknown, max = 60) => String(v ?? "").trim().toLowerCase().slice(0, max);

/** Хост из строки адреса или хоста. Не разобралось: пусто. */
export function hostOf(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  for (const cand of [s, `https://${s}`]) {
    try {
      const h = new URL(cand).hostname.toLowerCase().replace(/^www\./, "");
      if (h && h.includes(".")) return h;
    } catch {
      /* пробуем следующий вариант */
    }
  }
  return "";
}

/** Место на странице из source вида efir-1-okt-hero: последняя часть. */
export function placeOf(source: string): string {
  const s = source.trim().toLowerCase();
  if (!s) return "не указано";
  return s.includes("-") ? (s.split("-").pop() as string) : s;
}

type LeadMemo = { rowsRef: Record<string, unknown>[]; len: number; leads: Lead[] };
let leadMemo: LeadMemo | null = null;

export function leadsFilePath(ctx: AdminCtx): string {
  return ctx.leadsFile || process.env.LEADS_LOG_PATH || "/var/lib/workshop/leads.jsonl";
}

/** Заявки из журнала (строки kind=capture, по id без дублей). null: файл недоступен. */
export function readLeads(ctx: AdminCtx): { leads: Lead[] | null; error: string } {
  const r = readJsonlCached(leadsFilePath(ctx));
  if (r.error) return { leads: null, error: r.error };
  if (r.missing) return { leads: null, error: "файл заявок не найден" };
  if (leadMemo && leadMemo.rowsRef === r.rows && leadMemo.len === r.rows.length) return { leads: leadMemo.leads, error: "" };
  const seen = new Set<string>();
  const leads: Lead[] = [];
  for (const row of r.rows) {
    if (row.kind !== "capture") continue;
    const ts = Date.parse(String(row.ts ?? ""));
    if (!Number.isFinite(ts)) continue;
    const id = String(row.id ?? "");
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    const u = (row.utm && typeof row.utm === "object" ? row.utm : {}) as Record<string, unknown>;
    leads.push({
      id,
      eventId: String(row.eventId ?? "").trim(),
      name: String(row.name ?? "").trim().slice(0, 120),
      phone: String(row.phone ?? "").trim().slice(0, 40),
      place: placeOf(String(row.source ?? "")),
      utmSource: low(u.utm_source),
      utmMedium: low(u.utm_medium),
      utmCampaign: low(u.utm_campaign),
      refHost: hostOf(String(u.utm_referrer ?? "")),
      gclid: !!String(u.gclid ?? "").trim(),
      ts,
      day: dayKeyOf(ts),
    });
  }
  leadMemo = { rowsRef: r.rows, len: r.rows.length, leads };
  return { leads, error: "" };
}

export const hasUtm = (l: Lead) => !!(l.utmSource || l.utmMedium || l.utmCampaign);

/** Метка UTM заявки: «источник / канал / кампания», пустые части опускаются. */
export function utmLabel(l: Lead): string {
  return [l.utmSource, l.utmMedium, l.utmCampaign].filter(Boolean).join(" / ");
}

/** Заявка без UTM: откуда пришёл по referrer. */
export function noUtmLabel(l: Lead): string {
  if (l.refHost) return l.refHost;
  if (l.gclid) return "google (gclid)";
  return "прямой заход";
}

/** Колонка источника для таблицы по дням: utm_source, пусто это «без метки». */
export const sourceCol = (l: Lead) => l.utmSource || "без метки";

// ───────────────────────── метки бота ─────────────────────────

export type Origin = { kind: "pp" | "ty" | "direct" | "tag"; eid: string; tag: string };

/**
 * Откуда подписчик: pp_<eventId> окно на сайте, ty_<eventId> страница «Спасибо» (просто pp или ty
 * без номера тоже считаются), пусто прямой /start, всё остальное метка источника до первого «_».
 */
export function classifyPayload(payload: string): Origin {
  const p = payload.trim();
  if (!p) return { kind: "direct", eid: "", tag: "" };
  const m = /^(pp|ty)(?:_(.+))?$/i.exec(p);
  if (m) return { kind: m[1].toLowerCase() as "pp" | "ty", eid: m[2] || "", tag: "" };
  return { kind: "tag", eid: "", tag: (p.split("_")[0] || p).toLowerCase() };
}

// ───────────────────────── периоды ─────────────────────────

export type Period = { key: string; from: string; to: string; days: string[]; label: string };

const RANGE_MAX_DAYS = 366;

function daysBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < RANGE_MAX_DAYS; d = addDays(d, 1)) out.push(d);
  return out;
}

export const ddmm = (day: string) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;

/** Код периода: t сегодня, y вчера, 7, 30, all или дата YYYY-MM-DD. Дни считаются по Алматы. */
export function resolvePeriod(key: string, now: number, firstDataDay?: string): Period {
  const today = dayKeyOf(now);
  let from = today;
  let to = today;
  let label: string;
  if (key === "y") {
    from = to = addDays(today, -1);
    label = `Вчера, ${dateLabel(from)}`;
  } else if (key === "7" || key === "30") {
    from = addDays(today, -(Number(key) - 1));
    label = `${key} дней: ${dateLabel(from)} - ${dateLabel(to)}`;
  } else if (key === "all") {
    from = firstDataDay && firstDataDay < today ? firstDataDay : today;
    if (daysBetween(from, to).length >= RANGE_MAX_DAYS) from = addDays(today, -(RANGE_MAX_DAYS - 1));
    label = `Весь период: ${dateLabel(from)} - ${dateLabel(to)}`;
  } else if (isDayKey(key)) {
    from = to = key;
    label = dateLabel(key);
  } else {
    key = "t";
    label = `Сегодня, ${dateLabel(today)}`;
  }
  if (key === "t") label = `Сегодня, ${dateLabel(today)}`;
  return { key, from, to, days: daysBetween(from, to), label };
}

/**
 * Период по явным датам YYYY-MM-DD (обе границы включительно), для мини-приложения.
 * Не дата, перевёрнутые границы или больше RANGE_MAX_DAYS дней: null.
 */
export function periodFromDates(from: string, to: string): Period | null {
  if (!isDayKey(from) || !isDayKey(to) || from > to) return null;
  const days = daysBetween(from, to);
  if (days.length >= RANGE_MAX_DAYS && days[days.length - 1] !== to) return null;
  const label = from === to ? dateLabel(from) : `${dateLabel(from)} - ${dateLabel(to)}`;
  return { key: "r", from, to, days, label };
}

export const inPeriod = (p: Period, ms: number) => {
  const d = dayKeyOf(ms);
  return d >= p.from && d <= p.to;
};

/** Самый ранний день, по которому есть данные (для «Весь период»). */
export function firstDataDay(ctx: AdminCtx): string | undefined {
  let min = Infinity;
  for (const s of ctx.store.subs.values()) min = Math.min(min, s.firstStartAt);
  const { leads } = readLeads(ctx);
  if (leads) for (const l of leads) min = Math.min(min, l.ts);
  return Number.isFinite(min) ? dayKeyOf(min) : undefined;
}

// ───────────────────────── сбор данных ─────────────────────────

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/** Метка из пользовательских данных: обрезаем и экранируем. */
const lab = (s: string, max = 40) => esc(s.length > max ? s.slice(0, max - 1) + "…" : s);
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part * 100) / whole) : 0);

const inc = <K>(m: Map<K, number>, k: K, n = 1) => void m.set(k, (m.get(k) || 0) + n);
const top = <K>(m: Map<K, number>): Array<[K, number]> =>
  [...m.entries()].sort((a, b) => b[1] - a[1] || (String(a[0]) < String(b[0]) ? -1 : String(a[0]) > String(b[0]) ? 1 : 0));

type TyRow = { ch: "tg" | "wa"; eid: string; day: string; src: string };

export type Gathered = {
  p: Period;
  leadsOk: boolean;
  leadsError: string;
  leads: Lead[];
  linkedEids: Set<string>;
  leadByEid: Map<string, Lead>;
  newSubs: Subscriber[];
  ty: TyRow[];
  sent: SentEntry[];
  blockedEvents: number;
};

export function gather(ctx: AdminCtx, p: Period): Gathered {
  const { leads, error } = readLeads(ctx);
  const all = leads || [];
  const leadByEid = new Map<string, Lead>();
  for (const l of all) if (l.eventId) leadByEid.set(l.eventId, l);
  const linkedEids = new Set<string>();
  const newSubs: Subscriber[] = [];
  for (const s of ctx.store.subs.values()) {
    const o = classifyPayload(s.payload);
    if (o.eid) linkedEids.add(o.eid);
    if (inPeriod(p, s.firstStartAt)) newSubs.push(s);
  }
  const paths = ctx.store.paths();
  const ty: TyRow[] = [];
  const seenTy = new Set<string>();
  for (const r of readJsonlCached(paths.ty).rows) {
    const day = String(r.day ?? "");
    if (!isDayKey(day) || day < p.from || day > p.to) continue;
    const ch = r.ch === "wa" ? "wa" : r.ch === "tg" ? "tg" : null;
    if (!ch) continue;
    const eid = String(r.eid ?? "");
    if (eid) {
      // Повтор того же посетителя за день по тому же каналу не считается, как в самом боте.
      const k = `${day}|${ch}|${eid}`;
      if (seenTy.has(k)) continue;
      seenTy.add(k);
    }
    ty.push({ ch, eid, day, src: String(r.src ?? "") });
  }
  const sent: SentEntry[] = [];
  for (const r of readJsonlCached(paths.sent).rows) {
    const ts = Date.parse(String(r.ts ?? ""));
    if (Number.isFinite(ts) && inPeriod(p, ts) && typeof r.msg === "string") sent.push(r as unknown as SentEntry);
  }
  let blockedEvents = 0;
  for (const r of readJsonlCached(paths.subs).rows) {
    if (r.type !== "blocked") continue;
    const ts = Date.parse(String(r.ts ?? ""));
    if (Number.isFinite(ts) && inPeriod(p, ts)) blockedEvents++;
  }
  return {
    p,
    leadsOk: leads !== null,
    leadsError: error,
    leads: all.filter((l) => l.day >= p.from && l.day <= p.to),
    linkedEids,
    leadByEid,
    newSubs,
    ty,
    sent,
    blockedEvents,
  };
}

export const linked = (g: Gathered, l: Lead) => !!l.eventId && g.linkedEids.has(l.eventId);

// ───────────────────────── сборка сообщения ─────────────────────────

/** Склеить блоки в одно сообщение не длиннее лимита: что не влезло, режется по строкам с пометкой. */
export function assemble(head: string, sections: string[], limit = MSG_LIMIT): string {
  let out = head;
  for (const s of sections) {
    if (!s) continue;
    const next = `${out}\n\n${s}`;
    if (next.length <= limit) {
      out = next;
      continue;
    }
    const room = limit - out.length - 40;
    if (room > 60) {
      const lines: string[] = [];
      let used = 0;
      for (const line of s.split("\n")) {
        if (used + line.length + 1 > room) break;
        lines.push(line);
        used += line.length + 1;
      }
      // Не оставляем открытый тег: блок со <b> режем только по целым строкам, теги в строке закрыты.
      if (lines.length) out += `\n\n${lines.join("\n")}`;
    }
    out += "\n(часть отчёта не поместилась)";
    break;
  }
  return out;
}

function leadsLines(g: Gathered): string[] {
  if (!g.leadsOk) return [`<b>Заявки с сайта</b>: заявки недоступны (${lab(g.leadsError, 80)})`];
  const L = g.leads;
  const lines = [`<b>Заявки с сайта: ${L.length}</b>`];
  if (!L.length) return lines;
  if (g.p.days.length > 1) {
    const byDay = new Map<string, number>();
    for (const l of L) inc(byDay, l.day);
    const days = g.p.days.filter((d) => byDay.has(d));
    const shown = days.slice(-14);
    lines.push(`По дням: ${shown.map((d) => `${ddmm(d)} ${byDay.get(d)}`).join(", ")}${days.length > shown.length ? ` (и ещё ${days.length - shown.length} дн.)` : ""}`);
  }
  const places = new Map<string, number>();
  for (const l of L) inc(places, l.place);
  lines.push(`Место на странице: ${top(places).map(([k, n]) => `${lab(k, 16)} ${n}`).join(", ")}`);
  const utm = new Map<string, number>();
  const none = new Map<string, number>();
  for (const l of L) (hasUtm(l) ? inc(utm, utmLabel(l)) : inc(none, noUtmLabel(l)));
  if (utm.size) {
    const t = top(utm);
    const shown = t.slice(0, 8);
    const rest = t.slice(8).reduce((s, [, n]) => s + n, 0);
    lines.push(`UTM: ${shown.map(([k, n]) => `${lab(k, 60)} ${n}`).join("; ")}${rest ? `; прочие ${rest}` : ""}`);
  }
  if (none.size) lines.push(`Без UTM: ${top(none).map(([k, n]) => `${lab(k, 30)} ${n}`).join(", ")}`);
  return lines;
}

function botLines(g: Gathered): string[] {
  const N = g.newSubs;
  const lines = [`<b>Бот: новых подписчиков ${N.length}</b>`];
  if (!N.length && !g.leads.length) return lines;
  let pp = 0;
  let ty = 0;
  let direct = 0;
  const tags = new Map<string, number>();
  const viaUtm = new Map<string, number>();
  let notFound = 0;
  for (const s of N) {
    const o = classifyPayload(s.payload);
    if (o.kind === "pp") pp++;
    else if (o.kind === "ty") ty++;
    else if (o.kind === "direct") direct++;
    else inc(tags, o.tag);
    if (o.kind === "pp" || o.kind === "ty") {
      const lead = o.eid ? g.leadByEid.get(o.eid) : undefined;
      if (lead) inc(viaUtm, sourceCol(lead));
      else notFound++;
    }
  }
  if (N.length) {
    const parts = [`окно на сайте ${pp}`, `«Спасибо» ${ty}`, `прямой /start ${direct}`];
    if (tags.size) parts.push(`метки: ${top(tags).map(([k, n]) => `${lab(k, 20)} ${n}`).join(", ")}`);
    lines.push(`Откуда: ${parts.join(", ")}`);
    if (viaUtm.size || notFound) {
      const v = top(viaUtm).slice(0, 6).map(([k, n]) => `${lab(k, 24)} ${n}`);
      if (notFound && g.leadsOk) v.push(`заявка не найдена ${notFound}`);
      if (v.length) lines.push(`По UTM заявки: ${v.join(", ")}`);
    }
  }
  if (g.leadsOk) {
    const reached = g.leads.filter((l) => linked(g, l)).length;
    lines.push(`Заявка → бот: ${reached} из ${g.leads.length} (${pct(reached, g.leads.length)}%)`);
  }
  return lines;
}

function buttonsLines(g: Gathered): string[] {
  if (!g.ty.length) return [`<b>Кнопки после заявки</b>: пока нет нажатий`];
  const cnt = (ch: string, src?: string) => g.ty.filter((r) => r.ch === ch && (src === undefined || r.src === src)).length;
  const hasSrc = g.ty.some((r) => r.src);
  const part = (ch: string, name: string) => `${name} ${cnt(ch)}${hasSrc ? ` (окно ${cnt(ch, "pp")}, страница ${cnt(ch, "ty")})` : ""}`;
  return [`<b>Кнопки после заявки</b>`, `${part("tg", "Telegram")}, ${part("wa", "WhatsApp")}`];
}

function streamLines(ctx: AdminCtx, g: Gathered): string[] {
  const rows: string[] = [];
  for (const d of g.p.days) {
    const m = ctx.store.dayMetrics(d);
    if (!m.registered || !isStreamDay(d, ctx.cfg)) continue;
    rows.push(`${ddmm(d)}: записались ${m.registered}, перешли ${m.clicked} (${pct(m.clicked, m.registered)}%), «Я уже оплатил(а)» ${m.paid}`);
  }
  if (!rows.length) return [`<b>Эфиры</b>: записей на эфир за период нет`];
  const shown = rows.slice(-10);
  return [`<b>Эфиры</b>`, ...shown, ...(rows.length > shown.length ? [`(и ещё ${rows.length - shown.length} дн.)`] : [])];
}

const isBlockedErr = (e: SentEntry) => /^403\b/.test(String(e.err ?? ""));

function mailingLines(g: Gathered): string[] {
  const ok = g.sent.filter((e) => e.ok).length;
  const bad = g.sent.length - ok;
  const lines = [`<b>Рассылка</b>: отправлено ${ok}, ошибок ${bad}, заблокировали бота ${g.blockedEvents}`];
  const per = new Map<string, { ok: number; bad: number }>();
  for (const e of g.sent) {
    const c = per.get(e.msg) || { ok: 0, bad: 0 };
    if (e.ok) c.ok++;
    else c.bad++;
    per.set(e.msg, c);
  }
  const rows = [...per.entries()].slice(0, 12).map(([id, c]) => `${lab(id, 24)} ${c.ok}${c.bad ? ` (ошибок ${c.bad})` : ""}`);
  if (rows.length) lines.push(rows.join(", "));
  return lines;
}

export function adminKeyboard(period: string, screen: "p" | "u" | "e"): AdminButton[][] {
  return [
    [
      screen === "p" ? { text: "UTM по дням", callback_data: `adm:u:${period}` } : { text: "Отчёт", callback_data: `adm:p:${period}` },
      screen === "e" ? { text: "UTM по дням", callback_data: `adm:u:${period}` } : { text: "Ошибки", callback_data: `adm:e:${period}` },
    ],
    [
      { text: "Обновить", callback_data: `adm:${screen}:${period}` },
      { text: "← Период", callback_data: "adm:m" },
    ],
  ];
}

export function menuKeyboard(): AdminButton[][] {
  return [
    [
      { text: "Сегодня", callback_data: "adm:p:t" },
      { text: "Вчера", callback_data: "adm:p:y" },
    ],
    [
      { text: "7 дней", callback_data: "adm:p:7" },
      { text: "30 дней", callback_data: "adm:p:30" },
    ],
    [{ text: "Дата…", callback_data: "adm:d" }],
  ];
}

/** Выбор даты: последние 14 дней кнопками дд.мм (по 4 в ряд), «Весь период» и возврат. */
export function datePickerKeyboard(now: number): AdminButton[][] {
  const today = dayKeyOf(now);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, -i));
  const rows: AdminButton[][] = [];
  for (let i = 0; i < days.length; i += 4) rows.push(days.slice(i, i + 4).map((d) => ({ text: ddmm(d), callback_data: `adm:p:${d}` })));
  rows.push([{ text: "Весь период", callback_data: "adm:p:all" }, { text: "← Период", callback_data: "adm:m" }]);
  return rows;
}

/** Разбор callback_data меню: adm:<p|u|e|m|d>[:период]. Неверное: null. */
export function parseAdminCb(data: string): { action: "p" | "u" | "e" | "m" | "d"; period: string } | null {
  const m = /^adm:([puedm])(?::([A-Za-z0-9-]{1,10}))?$/.exec(data);
  if (!m) return null;
  const action = m[1] as "p" | "u" | "e" | "m" | "d";
  const period = m[2] || "t";
  if (action === "m" || action === "d") return { action, period: "t" };
  if (!["t", "y", "7", "30", "all"].includes(period) && !isDayKey(period)) return null;
  return { action, period };
}

/** Полный отчёт за период (экран «Отчёт»). */
export function renderReport(ctx: AdminCtx, periodKey: string): string {
  const p = resolvePeriod(periodKey, ctx.now, periodKey === "all" ? firstDataDay(ctx) : undefined);
  const g = gather(ctx, p);
  return assemble(`<b>${lab(p.label, 80)}</b>`, [
    leadsLines(g).join("\n"),
    botLines(g).join("\n"),
    buttonsLines(g).join("\n"),
    streamLines(ctx, g).join("\n"),
    mailingLines(g).join("\n"),
  ]);
}

// ───────────────────────── «UTM по дням» ─────────────────────────

/** Таблица: строки дни, колонки топ-4 источника (utm_source) и «прочие»; в ячейке «заявок(из них дошли до бота)». */
export function renderUtmByDay(ctx: AdminCtx, periodKey: string): string {
  const p = resolvePeriod(periodKey, ctx.now, periodKey === "all" ? firstDataDay(ctx) : undefined);
  const g = gather(ctx, p);
  const head = `<b>UTM по дням, ${lab(p.label, 80)}</b>`;
  if (!g.leadsOk) return `${head}\nЗаявки недоступны (${lab(g.leadsError, 80)}).`;
  type Cell = { leads: number; bot: number };
  const cells = new Map<string, Cell>(); // «день|колонка»
  const total = new Map<string, number>();
  const cell = (day: string, col: string) => {
    const k = `${day}|${col}`;
    let c = cells.get(k);
    if (!c) cells.set(k, (c = { leads: 0, bot: 0 }));
    return c;
  };
  for (const l of g.leads) {
    const col = sourceCol(l);
    const c = cell(l.day, col);
    c.leads++;
    if (linked(g, l)) c.bot++;
    inc(total, col);
  }
  // Метки бота вне сайта (2gis и т.п.): подписчики без заявки, 0 заявок и столько же дошли до бота.
  for (const s of g.newSubs) {
    const o = classifyPayload(s.payload);
    if (o.kind !== "tag") continue;
    cell(dayKeyOf(s.firstStartAt), o.tag).bot++;
    inc(total, o.tag);
  }
  if (!total.size) return `${head}\nЗа период нет заявок и подписчиков с метками.`;
  const ranked = top(total).map(([k]) => k);
  const cols = ranked.slice(0, 4);
  const rest = ranked.slice(4);
  const zero = (): Cell => ({ leads: 0, bot: 0 });
  const add = (a: Cell, b: Cell): Cell => ({ leads: a.leads + b.leads, bot: a.bot + b.bot });
  const colCell = (day: string, col: string | null): Cell =>
    col === null ? rest.reduce((a, k) => add(a, cells.get(`${day}|${k}`) || zero()), zero()) : cells.get(`${day}|${col}`) || zero();
  const keys: Array<string | null> = [...cols, ...(rest.length ? [null] : [])];
  const fmt = (c: Cell) => (c.leads || c.bot ? `${c.leads}(${c.bot})` : ".");
  const header = ["дата", ...keys.map((k) => (k === null ? "прочие" : k.length > 12 ? k.slice(0, 11) + "…" : k)), "всего"];
  const table = p.days.map((d) => {
    const cs = keys.map((k) => colCell(d, k));
    return [ddmm(d), ...cs.map(fmt), fmt(cs.reduce(add, zero()))];
  });
  const foot = keys.map((k) => p.days.reduce((a, d) => add(a, colCell(d, k)), zero()));
  const footer = ["итого", ...foot.map(fmt), fmt(foot.reduce(add, zero()))];
  const note = "в скобках сколько из них дошли до бота; метки вроде 2gis идут сразу в бота";
  // Лишние дни режем с начала, пока всё не влезет в лимит; итог остаётся внизу.
  const build = (from: number) => {
    const rows = table.slice(from);
    const w = header.map((h, i) => Math.max(h.length, footer[i].length, ...rows.map((r) => r[i].length)));
    const ln = (r: string[]) => r.map((c, i) => c.padEnd(w[i])).join("  ").trimEnd();
    const pre = [ln(header), ...rows.map(ln), ln(footer)].map(esc).join("\n");
    const cut = from > 0 ? `\nпоказаны последние ${rows.length} дн. из ${table.length}` : "";
    return `${head}\n${note}${cut}\n<pre>${pre}</pre>`;
  };
  let from = 0;
  let text = build(from);
  while (text.length > MSG_LIMIT && from < table.length - 1) text = build(++from);
  return text;
}

// ───────────────────────── «Ошибки» ─────────────────────────

/** Версия деплоя: файл VERSION рядом с бандлом. */
export function adminVersion(): string {
  try {
    return readFileSync(join(__dirname, "VERSION"), "utf8").trim() || "dev";
  } catch {
    return "dev";
  }
}

const uptimeText = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h >= 24 ? `${Math.floor(h / 24)} дн. ${h % 24} ч` : `${h} ч ${m} мин`;
};

export function renderErrors(ctx: AdminCtx, periodKey: string): string {
  const p = resolvePeriod(periodKey, ctx.now, periodKey === "all" ? firstDataDay(ctx) : undefined);
  const g = gather(ctx, p);
  const bad = g.sent.filter((e) => !e.ok);
  const parts: string[] = [];
  const head = `<b>Ошибки, ${lab(p.label, 80)}</b>`;
  const groups = new Map<string, number>();
  for (const e of bad) inc(groups, String(e.err ?? "без текста").replace(/\d{5,}/g, "#").slice(0, 70));
  const failLines = [`<b>Неудачные отправки: ${bad.length}</b> (из ${g.sent.length})`];
  if (groups.size) failLines.push(...top(groups).slice(0, 6).map(([k, n]) => `${n} x ${lab(k, 70)}`));
  parts.push(failLines.join("\n"));
  if (bad.length) {
    const last = [...bad].sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts)).slice(0, 10);
    parts.push(
      [`<b>Последние ${last.length}</b>`, ...last.map((e) => `${ddmm(dayKeyOf(Date.parse(e.ts)))} ${hhmmOf(Date.parse(e.ts))} ${lab(e.msg, 24)}: ${lab(String(e.err ?? ""), 50)}`)].join("\n"),
    );
  }
  parts.push(`<b>Заблокировали бота</b>: ${g.blockedEvents}`);
  // Счётчики процесса не зависят от выбранного периода: они считаются с момента запуска.
  const rt = runtime.events;
  const cntRt = (t: string) => rt.filter((e) => e.type === t).length;
  const skipped = rt.filter((e) => e.type === "skipLate");
  parts.push(
    [
      `<b>С запуска процесса</b> (${uptimeText(Math.floor(process.uptime()))} назад, счётчики в памяти):`,
      `Пропуски по опозданию планировщика: ${skipped.length}${skipped.length ? ` (${[...new Set(skipped.map((e) => e.msg || "?"))].slice(0, 6).map((x) => lab(x, 20)).join(", ")})` : ""}`,
      `Медиа заменено текстом: ${cntRt("mediaFallback")}`,
      `Сбои тиков планировщика: ${cntRt("tickError")}`,
      `Отказы вебхука по секрету: ${runtime.webhookRejected}`,
    ].join("\n"),
  );
  parts.push(`Версия: ${lab(ctx.version ?? adminVersion(), 40)}, процесс работает ${uptimeText(Math.floor(process.uptime()))}`);
  return assemble(head, parts);
}

// ───────────────────────── ежедневный отчёт ─────────────────────────

/** Компактный отчёт за день: заявки и топ UTM, бот, кнопки, эфир, рассылка и строка про ошибки. */
export function renderDailyReport(ctx: AdminCtx, day: string): string {
  const p = resolvePeriod(day, ctx.now);
  const g = gather(ctx, p);
  const lines: string[] = [`<b>Итоги за ${day === addDays(dayKeyOf(ctx.now), -1) ? "вчера, " : ""}${dateLabel(day)}</b>`];
  if (!g.leadsOk) lines.push("Заявки недоступны.");
  else {
    const utm = new Map<string, number>();
    for (const l of g.leads) inc(utm, hasUtm(l) ? utmLabel(l) : `без UTM: ${noUtmLabel(l)}`);
    const t = top(utm).slice(0, 3).map(([k, n]) => `${lab(k, 56)} ${n}`);
    lines.push(`Заявок: ${g.leads.length}${t.length ? `. Топ UTM: ${t.join("; ")}` : ""}`);
  }
  const N = g.newSubs;
  const tags = new Map<string, number>();
  let pp = 0;
  let ty = 0;
  let direct = 0;
  for (const s of N) {
    const o = classifyPayload(s.payload);
    if (o.kind === "pp") pp++;
    else if (o.kind === "ty") ty++;
    else if (o.kind === "direct") direct++;
    else inc(tags, o.tag);
  }
  const reached = g.leadsOk ? g.leads.filter((l) => linked(g, l)).length : 0;
  lines.push(
    `В боте новых: ${N.length} (окно ${pp}, «Спасибо» ${ty}, прямой ${direct}${tags.size ? `, ${top(tags).slice(0, 4).map(([k, n]) => `${lab(k, 16)} ${n}`).join(", ")}` : ""})${g.leadsOk ? `. Заявка → бот: ${reached} из ${g.leads.length} (${pct(reached, g.leads.length)}%)` : ""}`,
  );
  const tg = g.ty.filter((r) => r.ch === "tg").length;
  const wa = g.ty.filter((r) => r.ch === "wa").length;
  lines.push(`Кнопки после заявки: Telegram ${tg}, WhatsApp ${wa}`);
  const m = ctx.store.dayMetrics(day);
  if (m.registered) lines.push(`Эфир: записались ${m.registered}, перешли ${m.clicked} (${pct(m.clicked, m.registered)}%), «Я уже оплатил(а)» ${m.paid}`);
  const ok = g.sent.filter((e) => e.ok).length;
  const bad = g.sent.length - ok;
  lines.push(`Рассылка: отправлено ${ok}, ошибок ${bad}, заблокировали бота ${g.blockedEvents}`);
  if (bad) {
    const groups = new Map<string, number>();
    for (const e of g.sent) if (!e.ok) inc(groups, String(e.err ?? "без текста").replace(/\d{5,}/g, "#").slice(0, 60));
    const [k, n] = top(groups)[0];
    lines.push(`Чаще всего: ${n} x ${lab(k, 60)}`);
  } else lines.push("Ошибок отправки нет.");
  return assemble(lines[0], [lines.slice(1).join("\n")]);
}

export function dailyKeyboard(day: string): AdminButton[][] {
  return [[{ text: "Подробнее", callback_data: `adm:p:${day}` }, { text: "Ошибки", callback_data: `adm:e:${day}` }]];
}
