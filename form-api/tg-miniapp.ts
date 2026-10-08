/**
 * Мини-приложение админки воркшопа (Telegram Mini App) только для владельца.
 *
 *   GET  /api/admin-app            страница (admin-app.html рядом с бандлом), CSP: только свой origin
 *   GET  /api/tg-web-app.js        скрипт Telegram Web App со своего адреса (общий CSP nginx не пускает telegram.org)
 *   POST /api/admin/login          initData + пароль, в ответ токен сессии на 12 часов
 *   GET  /api/admin/summary        сводка, по дням, источники, эфиры за период
 *   GET  /api/admin/leads          регистрации (заявки с сайта), поиск и фильтры, подгрузка по 50
 *   GET  /api/admin/subscribers    подписчики бота
 *   GET  /api/admin/errors         ошибки и состояние процесса
 *   *    /api/admin/wa/*           пульт WhatsApp-сообществ (wa-admin.ts), те же три слоя доступа
 *
 * Доступ в три слоя, каждый обязателен:
 *   1. initData Telegram WebApp на каждый запрос: подпись по официальной схеме
 *      (secret_key = HMAC_SHA256("WebAppData", токен бота), hash = HMAC_SHA256(secret_key, data_check_string)),
 *      auth_date не старше 24 часов, сравнение за константное время;
 *   2. user.id из initData в ADMIN_APP_IDS (по умолчанию Александр), иначе 403 без подробностей;
 *   3. пароль ADMIN_APP_PIN один раз за сессию, после него подписанный токен (ADMIN_APP_SECRET, 12 часов).
 * Ошибки пароля: не больше 5 за 10 минут на user.id, дальше 429.
 *
 * Все ответы с данными идут с Cache-Control: no-store. В логах нет пароля, initData, имён и телефонов.
 * Подсчёт идёт функциями tg-admin (те же, что у отчётов в чате), тут только сборка JSON для экранов.
 * tg-workshop этот модуль не импортирует, поэтому круговых импортов нет: маршруты подключает server.ts.
 */
import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runtime, type Subscriber } from "./tg-store";
import {
  adminVersion,
  classifyPayload,
  ddmm,
  firstDataDay,
  gather,
  hasUtm,
  linked,
  noUtmLabel,
  periodFromDates,
  readJsonlCached,
  resolvePeriod,
  utmLabel,
  type AdminCtx,
  type Gathered,
  type Lead,
  type Period,
} from "./tg-admin";
import { activeSeries, adminAppIds, adminCtx, botEnabled, botToken, isAdminAppUser } from "./tg-workshop";
import { addDays, dayKeyOf, hhmmOf, isDayKey, partsInTZ } from "./tg-time";
import { TG_WEBAPP_SDK } from "./tg-webapp-sdk";

// ───────────────────────── конфиг ─────────────────────────

const env = (k: string) => (process.env[k] || "").trim();

/** Короче ключ подписи токенов не принимаем: приложение считается ненастроенным. */
const MIN_SECRET = 16;
const appPin = () => env("ADMIN_APP_PIN");
const appSecret = () => env("ADMIN_APP_SECRET");

/** Всё, без чего приложение закрыто: токен бота (для проверки initData), пароль, ключ сессий, кто допущен. */
export function appConfigured(): boolean {
  return !!botToken() && !!appPin() && appSecret().length >= MIN_SECRET && adminAppIds().length > 0;
}

export const INIT_MAX_AGE_SEC = 24 * 3600;
export const SESSION_TTL_MS = 12 * 3600 * 1000;
export const LOGIN_MAX_FAILS = 5;
export const LOGIN_WINDOW_MS = 10 * 60_000;
const MAX_LOGIN_BODY = 4096;
const PAGE_SIZE = 50;
const PAGE_MAX = 100;

// ───────────────────────── initData Telegram ─────────────────────────

export type InitCheck = { ok: true; userId: number; authDate: number } | { ok: false; reason: "format" | "hash" | "expired" | "user" };

/**
 * Проверка initData по схеме Telegram. data_check_string: все пары key=value кроме hash, по ключу, через \n.
 * Сравнение подписи через timingSafeEqual. auth_date старше maxAgeSec или из будущего (больше 5 минут): отказ.
 */
export function verifyInitData(initData: string, token: string, nowMs: number, maxAgeSec = INIT_MAX_AGE_SEC): InitCheck {
  if (!token || typeof initData !== "string" || !initData || initData.length > 8192) return { ok: false, reason: "format" };
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { ok: false, reason: "format" };
  }
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return { ok: false, reason: "format" };
  const pairs: Array<[string, string]> = [];
  for (const [k, v] of params) if (k !== "hash") pairs.push([k, v]);
  pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const dataCheck = pairs.map(([k, v]) => `${k}=${v}`).join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
  const want = createHmac("sha256", secretKey).update(dataCheck).digest();
  const given = Buffer.from(hash, "hex");
  if (given.length !== want.length || !timingSafeEqual(given, want)) return { ok: false, reason: "hash" };
  const authDate = Number(params.get("auth_date"));
  if (!Number.isInteger(authDate) || authDate <= 0) return { ok: false, reason: "format" };
  const ageSec = nowMs / 1000 - authDate;
  if (ageSec > maxAgeSec || ageSec < -300) return { ok: false, reason: "expired" };
  let userId = 0;
  try {
    const u = JSON.parse(params.get("user") || "null") as { id?: unknown } | null;
    if (u && typeof u.id === "number" && Number.isSafeInteger(u.id) && u.id > 0) userId = u.id;
  } catch {
    /* userId остаётся 0 */
  }
  if (!userId) return { ok: false, reason: "user" };
  return { ok: true, userId, authDate };
}

// ───────────────────────── токен сессии ─────────────────────────

const signSessionPart = (payload: string, secret: string) => createHmac("sha256", secret).update(`admin-app-session:${payload}`).digest("base64url");

/** Токен: base64url({u: user.id, e: срок мс}) + "." + HMAC-SHA256(ADMIN_APP_SECRET). */
export function signSession(userId: number, nowMs: number, secret: string, ttlMs = SESSION_TTL_MS): string {
  const payload = Buffer.from(JSON.stringify({ u: userId, e: nowMs + ttlMs })).toString("base64url");
  return `${payload}.${signSessionPart(payload, secret)}`;
}

/** Токен верен, выдан этому user.id и не истёк. */
export function verifySession(token: string, userId: number, nowMs: number, secret: string): boolean {
  if (!secret || typeof token !== "string" || token.length > 400) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const want = Buffer.from(signSessionPart(payload, secret));
  if (given.length !== want.length || !timingSafeEqual(given, want)) return false;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { u?: unknown; e?: unknown };
    return o.u === userId && typeof o.e === "number" && o.e > nowMs;
  } catch {
    return false;
  }
}

// ───────────────────────── пароль и лимит попыток ─────────────────────────

/** Сравнение пароля за константное время: оба значения сначала хешируются, длина не светится. */
export function pinMatches(given: unknown, pin: string): boolean {
  if (!pin || typeof given !== "string" || given.length > 64) return false;
  return timingSafeEqual(createHash("sha256").update(given.trim()).digest(), createHash("sha256").update(pin).digest());
}

const loginFails = new Map<number, number[]>();

function recentFails(userId: number, now: number): number[] {
  const list = (loginFails.get(userId) || []).filter((t) => now - t < LOGIN_WINDOW_MS);
  if (list.length) loginFails.set(userId, list);
  else loginFails.delete(userId);
  return list;
}

/** Сколько секунд до снятия блокировки; 0 если пароль можно вводить. */
export function loginLockedFor(userId: number, now: number): number {
  const list = recentFails(userId, now);
  return list.length >= LOGIN_MAX_FAILS ? Math.max(1, Math.ceil((list[0] + LOGIN_WINDOW_MS - now) / 1000)) : 0;
}

/** Записать неверный пароль, вернуть, сколько попыток осталось. */
export function noteLoginFail(userId: number, now: number): number {
  const list = recentFails(userId, now);
  list.push(now);
  loginFails.set(userId, list);
  if (loginFails.size > 500) for (const k of loginFails.keys()) if (!recentFails(k, now).length) loginFails.delete(k);
  return Math.max(0, LOGIN_MAX_FAILS - list.length);
}

export function resetAdminAppState() {
  loginFails.clear();
}

// ───────────────────────── сборка данных для экранов ─────────────────────────

export type Basis = "reg" | "stream";

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part * 100) / whole) : 0);
const inc = <K>(m: Map<K, number>, k: K, n = 1) => void m.set(k, (m.get(k) || 0) + n);
const WD = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
function weekday(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
const stamp = (ms: number) => `${ddmm(dayKeyOf(ms))} ${hhmmOf(ms)}`;

type Aux = { clickChats: Set<number>; selfPaid: Set<number> };

/** Кто хоть раз перешёл в эфир и кто сам нажал «Я уже оплатил(а)»: из журналов, с кешем чтения. */
function aux(ctx: AdminCtx): Aux {
  const paths = ctx.store.paths();
  const clickChats = new Set<number>();
  for (const r of readJsonlCached(paths.clicks).rows) if (typeof r.chat_id === "number") clickChats.add(r.chat_id);
  const selfPaid = new Set<number>();
  for (const r of readJsonlCached(paths.subs).rows) if (r.type === "paid" && r.by === "self" && typeof r.chat_id === "number") selfPaid.add(r.chat_id);
  return { clickChats, selfPaid };
}

/**
 * Воронка бота. День регистрации (reg): люди, впервые нажавшие «Запустить» в период; перешли и оплатили считаются
 * среди них. День эфира (stream): записавшиеся на эфиры дней периода, как строка «Эфиры» в отчёте чата.
 */
function funnel(ctx: AdminCtx, g: Gathered, basis: Basis, a: Aux): { registered: number; clicked: number; paid: number } {
  if (basis === "stream") {
    let registered = 0;
    let clicked = 0;
    let paid = 0;
    for (const d of g.p.days) {
      const m = ctx.store.dayMetrics(d);
      registered += m.registered;
      clicked += m.clicked;
      paid += m.paid;
    }
    return { registered, clicked, paid };
  }
  let clicked = 0;
  let paid = 0;
  for (const s of g.newSubs) {
    if (a.clickChats.has(s.chatId)) clicked++;
    if (a.selfPaid.has(s.chatId)) paid++;
  }
  return { registered: g.newSubs.length, clicked, paid };
}

export type Cards = { leads: number; bot: number; reached: number; conv: number; wa: number; tg: number; clicked: number; paid: number; blocked: number };

function cardsOf(ctx: AdminCtx, g: Gathered, basis: Basis, a: Aux): Cards {
  const f = funnel(ctx, g, basis, a);
  const reached = g.leads.filter((l) => linked(g, l)).length;
  return {
    leads: g.leads.length,
    bot: f.registered,
    reached,
    conv: pct(reached, g.leads.length),
    wa: g.ty.filter((r) => r.ch === "wa").length,
    tg: g.ty.filter((r) => r.ch === "tg").length,
    clicked: f.clicked,
    paid: f.paid,
    blocked: g.blockedEvents,
  };
}

/** Метка источника заявки: UTM как есть, без UTM «без метки: <откуда пришёл>». */
export const leadKey = (l: Lead) => (hasUtm(l) ? utmLabel(l) : `без метки: ${noUtmLabel(l)}`);

function dailyOf(ctx: AdminCtx, g: Gathered, basis: Basis) {
  const leads = new Map<string, number>();
  const reached = new Map<string, number>();
  const subs = new Map<string, number>();
  const wa = new Map<string, number>();
  const tg = new Map<string, number>();
  for (const l of g.leads) {
    inc(leads, l.day);
    if (linked(g, l)) inc(reached, l.day);
  }
  for (const s of g.newSubs) inc(subs, dayKeyOf(s.firstStartAt));
  for (const r of g.ty) inc(r.ch === "wa" ? wa : tg, r.day);
  return g.p.days.map((d) => {
    const n = leads.get(d) || 0;
    const r = reached.get(d) || 0;
    return {
      day: d,
      label: ddmm(d),
      wd: weekday(d),
      leads: n,
      reached: r,
      conv: pct(r, n),
      bot: basis === "stream" ? ctx.store.registeredOn(d).length : subs.get(d) || 0,
      wa: wa.get(d) || 0,
      tg: tg.get(d) || 0,
    };
  });
}

/** Для периода из одного дня: заявки и новые подписчики по часам Алматы. */
function hourlyOf(g: Gathered) {
  const rows = Array.from({ length: 24 }, (_, h) => ({ h, leads: 0, bot: 0 }));
  for (const l of g.leads) rows[partsInTZ(l.ts).hour].leads++;
  for (const s of g.newSubs) rows[partsInTZ(s.firstStartAt).hour].bot++;
  return rows;
}

export type SourceRow = { key: string; label: string; kind: "utm" | "none" | "tag"; leads: number; bot: number; pct: number };

function sourcesOf(g: Gathered): SourceRow[] {
  const rows = new Map<string, SourceRow>();
  for (const l of g.leads) {
    const key = leadKey(l);
    let r = rows.get(key);
    if (!r) rows.set(key, (r = { key, label: key, kind: hasUtm(l) ? "utm" : "none", leads: 0, bot: 0, pct: 0 }));
    r.leads++;
    if (linked(g, l)) r.bot++;
  }
  // Метки бота вне сайта (2gis и т.п.): заявок нет, человек пришёл сразу в бота.
  for (const s of g.newSubs) {
    const o = classifyPayload(s.payload);
    if (o.kind !== "tag") continue;
    const key = `tag:${o.tag}`;
    let r = rows.get(key);
    if (!r) rows.set(key, (r = { key: o.tag, label: `метка бота: ${o.tag}`, kind: "tag", leads: 0, bot: 0, pct: 0 }));
    r.bot++;
  }
  for (const r of rows.values()) r.pct = r.kind === "tag" ? 0 : pct(r.bot, r.leads);
  return [...rows.values()].sort((a, b) => b.leads - a.leads || b.bot - a.bot || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0)).slice(0, 200);
}

function streamsOf(ctx: AdminCtx, p: Period) {
  const sentBy = new Map<string, Map<string, { ok: number; bad: number }>>();
  for (const r of readJsonlCached(ctx.store.paths().sent).rows) {
    const day = String(r.day ?? "");
    if (!isDayKey(day) || day < p.from || day > p.to || typeof r.msg !== "string") continue;
    let per = sentBy.get(day);
    if (!per) sentBy.set(day, (per = new Map()));
    const c = per.get(r.msg) || { ok: 0, bad: 0 };
    if (r.ok === true) c.ok++;
    else c.bad++;
    per.set(r.msg, c);
  }
  const order = new Map<string, { at: string; off: number; i: number }>();
  try {
    activeSeries().messages.forEach((m, i) => order.set(m.id, { at: m.at, off: m.dayOffset ?? 0, i }));
  } catch {
    /* серия не загружена: порядок по id */
  }
  const out: Array<Record<string, unknown>> = [];
  for (const d of p.days) {
    const m = ctx.store.dayMetrics(d);
    const per = sentBy.get(d);
    if (!m.registered && !per) continue;
    const messages = [...(per?.entries() ?? [])]
      .map(([id, c]) => ({ id, at: order.get(id)?.at ?? "", off: order.get(id)?.off ?? 0, ok: c.ok, bad: c.bad, i: order.get(id)?.i ?? 999 }))
      .sort((x, y) => Number(x.i === 999) - Number(y.i === 999) || x.off - y.off || x.at.localeCompare(y.at) || x.id.localeCompare(y.id))
      .map(({ i: _i, ...rest }) => rest);
    out.push({
      day: d,
      label: ddmm(d),
      wd: weekday(d),
      registered: m.registered,
      clicked: m.clicked,
      pct: pct(m.clicked, m.registered),
      paid: m.paid,
      sentOk: messages.reduce((n, x) => n + x.ok, 0),
      sentBad: messages.reduce((n, x) => n + x.bad, 0),
      messages,
    });
  }
  return out.reverse();
}

const meta = (ctx: AdminCtx) => ({ today: dayKeyOf(ctx.now), updated: hhmmOf(ctx.now), tz: "Asia/Almaty" });

export function buildSummary(ctx: AdminCtx, p: Period, basis: Basis) {
  const a = aux(ctx);
  const g = gather(ctx, p);
  const prevP = periodFromDates(addDays(p.from, -p.days.length), addDays(p.from, -1)) as Period;
  const gPrev = gather(ctx, prevP);
  let active = 0;
  let paid = 0;
  for (const s of ctx.store.subs.values()) {
    if (ctx.store.isActive(s)) active++;
    if (s.paid) paid++;
  }
  return {
    ok: true,
    meta: meta(ctx),
    period: { key: p.key, from: p.from, to: p.to, label: p.label, days: p.days.length },
    prevPeriod: { from: prevP.from, to: prevP.to, label: prevP.label },
    basis,
    leadsOk: g.leadsOk,
    leadsError: g.leadsOk ? "" : g.leadsError.slice(0, 120),
    cards: cardsOf(ctx, g, basis, a),
    prev: cardsOf(ctx, gPrev, basis, a),
    daily: dailyOf(ctx, g, basis),
    hourly: p.days.length === 1 ? hourlyOf(g) : null,
    sources: sourcesOf(g),
    streams: streamsOf(ctx, p),
    totals: { subscribers: ctx.store.subs.size, active, paid },
  };
}

export type ListQuery = { q: string; utm: string; inbot: string; flag: string; offset: number; limit: number };

function page<T>(rows: T[], q: ListQuery) {
  const items = rows.slice(q.offset, q.offset + q.limit);
  return { items, total: rows.length, offset: q.offset, hasMore: q.offset + items.length < rows.length };
}

export function buildLeads(ctx: AdminCtx, p: Period, q: ListQuery) {
  const g = gather(ctx, p);
  const needle = q.q.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const utm = q.utm.trim().toLowerCase();
  const rows = g.leads
    .filter((l) => {
      const inBot = linked(g, l);
      if (q.inbot === "1" && !inBot) return false;
      if (q.inbot === "0" && inBot) return false;
      if (utm) {
        const key = leadKey(l).toLowerCase();
        if (utm === "без метки" ? hasUtm(l) : key !== utm) return false;
      }
      if (needle) {
        const byName = l.name.toLowerCase().includes(needle);
        const byPhone = digits.length >= 2 && l.phone.replace(/\D/g, "").includes(digits);
        if (!byName && !byPhone) return false;
      }
      return true;
    })
    .sort((x, y) => y.ts - x.ts)
    .map((l) => ({
      id: l.id,
      ts: l.ts,
      t: stamp(l.ts),
      name: l.name,
      phone: l.phone,
      telegram: l.telegram,
      place: l.place,
      utm: leadKey(l),
      inBot: linked(g, l),
    }));
  return { ok: true, meta: meta(ctx), leadsOk: g.leadsOk, leadsError: g.leadsOk ? "" : g.leadsError.slice(0, 120), ...page(rows, q) };
}

function originLabel(kind: string, tag: string): string {
  if (kind === "pp") return "окно на сайте";
  if (kind === "ty") return "страница «Спасибо»";
  if (kind === "tag") return `метка: ${tag}`;
  return "прямой /start";
}

export function buildSubscribers(ctx: AdminCtx, p: Period, basis: Basis, q: ListQuery) {
  const g = gather(ctx, p);
  const a = aux(ctx);
  let cohort: Subscriber[];
  if (basis === "stream") {
    const seen = new Set<number>();
    cohort = [];
    for (const d of p.days) {
      for (const chat of ctx.store.registeredOn(d)) {
        const s = ctx.store.subs.get(chat);
        if (s && !seen.has(chat)) {
          seen.add(chat);
          cohort.push(s);
        }
      }
    }
  } else cohort = g.newSubs;
  const needle = q.q.trim().toLowerCase().replace(/^@/, "");
  const utm = q.utm.trim().toLowerCase();
  const rows = cohort
    .map((s) => {
      const o = classifyPayload(s.payload);
      const lead = o.eid ? g.leadByEid.get(o.eid) : undefined;
      return { s, o, src: lead ? leadKey(lead) : "" };
    })
    .filter(({ s, o, src }) => {
      if (utm && !(o.tag && o.tag === utm) && src.toLowerCase() !== utm && !(utm === "без метки" && !!src && src.startsWith("без метки"))) return false;
      if (needle && !s.firstName.toLowerCase().includes(needle) && !s.username.toLowerCase().includes(needle)) return false;
      if (q.flag === "blocked" && !s.blocked) return false;
      if (q.flag === "paid" && !s.paid) return false;
      if (q.flag === "clicked" && !a.clickChats.has(s.chatId)) return false;
      if (q.flag === "noclick" && a.clickChats.has(s.chatId)) return false;
      return true;
    })
    .sort((x, y) => y.s.firstStartAt - x.s.firstStartAt)
    .map(({ s, o, src }) => ({
      ts: s.firstStartAt,
      t: stamp(s.firstStartAt),
      name: s.firstName,
      username: s.username,
      origin: originLabel(o.kind, o.tag),
      kind: o.kind,
      tag: o.tag,
      src,
      day: s.streamDay,
      dayLabel: ddmm(s.streamDay),
      clicked: a.clickChats.has(s.chatId),
      paid: s.paid,
      blocked: s.blocked,
      stopped: s.stopped,
    }));
  return { ok: true, meta: meta(ctx), basis, ...page(rows, q) };
}

const uptimeText = (sec: number) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h >= 24 ? `${Math.floor(h / 24)} дн. ${h % 24} ч` : `${h} ч ${m} мин`;
};

/** Экран «Ошибки»: то же, что в чате, плюс время работы и версия. Номера из текстов ошибок (chat_id) затираются. */
export function buildErrors(ctx: AdminCtx, p: Period) {
  const g = gather(ctx, p);
  const bad = g.sent.filter((e) => !e.ok);
  const groups = new Map<string, number>();
  for (const e of bad) inc(groups, String(e.err ?? "без текста").replace(/\d{5,}/g, "#").slice(0, 70));
  const last = [...bad]
    .sort((x, y) => Date.parse(y.ts) - Date.parse(x.ts))
    .slice(0, 10)
    .map((e) => ({ t: stamp(Date.parse(e.ts)), msg: String(e.msg).slice(0, 40), err: String(e.err ?? "").replace(/\d{5,}/g, "#").slice(0, 100) }));
  const rt = runtime.events;
  const skipped = rt.filter((e) => e.type === "skipLate");
  const uptimeSec = Math.floor(process.uptime());
  return {
    ok: true,
    meta: meta(ctx),
    sentTotal: g.sent.length,
    sentOk: g.sent.length - bad.length,
    failed: bad.length,
    groups: [...groups.entries()].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).slice(0, 8).map(([text, n]) => ({ text, n })),
    last,
    blocked: g.blockedEvents,
    runtime: {
      skipLate: skipped.length,
      skipLateIds: [...new Set(skipped.map((e) => e.msg || "?"))].slice(0, 8),
      mediaFallback: rt.filter((e) => e.type === "mediaFallback").length,
      tickError: rt.filter((e) => e.type === "tickError").length,
      webhookRejected: runtime.webhookRejected,
    },
    uptimeSec,
    uptime: uptimeText(uptimeSec),
    version: (ctx.version ?? adminVersion()).slice(0, 60),
  };
}

// ───────────────────────── HTTP ─────────────────────────

function send(res: ServerResponse, status: number, body: unknown, extra: Record<string, string> = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extra,
  });
  res.end(payload);
}

const FORBIDDEN = { ok: false as const, error: "forbidden" };

function header(req: IncomingMessage, name: string): string {
  const v = req.headers[name];
  return (Array.isArray(v) ? v[0] : v) || "";
}

/** Тело с жёстким лимитом: null, если больше лимита или не прочиталось. */
function readLimited(req: IncomingMessage, max: number): Promise<string | null> {
  return new Promise((resolve) => {
    let size = 0;
    let over = false;
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      if (over) return;
      size += c.length;
      if (size > max) {
        over = true;
        chunks.length = 0;
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(over ? null : Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => resolve(null));
  });
}

export type Gate = { ok: true; userId: number } | { ok: false; status: number; body: { ok: false; error: string } };

/** Слои 1 и 2: приложение настроено, initData верна, user.id допущен. Причины отказа наружу не выдаём. */
function gateInit(initData: string): Gate {
  if (!appConfigured()) return { ok: false, status: 503, body: { ok: false, error: "not_configured" } };
  const v = verifyInitData(initData, botToken(), Date.now());
  if (!v.ok || !isAdminAppUser(v.userId)) return { ok: false, status: 403, body: FORBIDDEN };
  return { ok: true, userId: v.userId };
}

/** POST /api/admin/login: initData и пароль, в ответ токен сессии. */
export async function handleAdminLogin(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const raw = await readLimited(req, MAX_LOGIN_BODY);
  let body: { initData?: unknown; pin?: unknown } = {};
  try {
    if (raw) body = JSON.parse(raw) as typeof body;
  } catch {
    body = {};
  }
  const initData = typeof body.initData === "string" && body.initData ? body.initData : header(req, "x-tg-init-data");
  const gate = gateInit(initData);
  if (!gate.ok) return send(res, gate.status, gate.body);
  const now = Date.now();
  const wait = loginLockedFor(gate.userId, now);
  if (wait > 0) {
    console.warn("[admin-app] вход заблокирован: слишком много неверных паролей");
    return send(res, 429, { ok: false, error: "too_many", retryAfter: wait }, { "Retry-After": String(wait) });
  }
  if (!pinMatches(body.pin, appPin())) {
    const left = noteLoginFail(gate.userId, now);
    console.warn("[admin-app] неверный пароль, осталось попыток: %d", left);
    return send(res, 401, { ok: false, error: "bad_pin", left });
  }
  loginFails.delete(gate.userId);
  console.log("[admin-app] вход выполнен");
  send(res, 200, {
    ok: true,
    token: signSession(gate.userId, now, appSecret()),
    expiresAt: now + SESSION_TTL_MS,
    meta: { today: dayKeyOf(now), updated: hhmmOf(now), tz: "Asia/Almaty" },
  });
}

function periodOf(qs: URLSearchParams, ctx: AdminCtx): Period | null {
  const from = qs.get("from") || "";
  const to = qs.get("to") || "";
  if (from || to) return periodFromDates(from, to || from);
  const key = (qs.get("period") || "t").slice(0, 10);
  return resolvePeriod(key, ctx.now, key === "all" ? firstDataDay(ctx) : undefined);
}

function listQuery(qs: URLSearchParams): ListQuery {
  const num = (k: string, def: number) => {
    const raw = qs.get(k);
    if (raw === null || raw === "") return def; // Number(null) был бы нулём
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : def;
  };
  const limit = Math.min(PAGE_MAX, Math.max(1, num("limit", PAGE_SIZE)));
  return {
    q: (qs.get("q") || "").slice(0, 100),
    utm: (qs.get("utm") || "").slice(0, 160),
    inbot: qs.get("inbot") === "1" ? "1" : qs.get("inbot") === "0" ? "0" : "",
    flag: ["blocked", "paid", "clicked", "noclick"].includes(qs.get("flag") || "") ? (qs.get("flag") as string) : "",
    offset: num("offset", 0),
    limit,
  };
}

/**
 * Все три слоя доступа для маршрутов с данными и действиями: initData, допуск user.id, токен сессии.
 * Через него идут и экраны статистики, и пульт WhatsApp (wa-admin.ts).
 */
export function gateAdminSession(req: IncomingMessage): Gate {
  const gate = gateInit(header(req, "x-tg-init-data"));
  if (!gate.ok) return gate;
  const m = /^Bearer\s+(\S+)$/i.exec(header(req, "authorization"));
  if (!m || !verifySession(m[1], gate.userId, Date.now(), appSecret())) return { ok: false, status: 401, body: { ok: false, error: "session" } };
  return gate;
}

/** Ответ JSON с теми же заголовками, что у экранов админки (no-store, nosniff), и чтение тела с жёстким лимитом: для wa-admin.ts. */
export const adminJson = send;
export const adminReadBody = readLimited;

/** GET /api/admin/<summary|leads|subscribers|errors>: слои 1 и 2, затем токен сессии (слой 3). */
export function handleAdminData(req: IncomingMessage, res: ServerResponse, path: string): void {
  const gate = gateAdminSession(req);
  if (!gate.ok) return send(res, gate.status, gate.body);
  const what = path.replace(/^\/api\/admin\//, "");
  if (!["summary", "leads", "subscribers", "errors"].includes(what)) return send(res, 404, { ok: false, error: "not_found" });
  if (!botEnabled()) return send(res, 503, { ok: false, error: "bot_off" });
  try {
    const ctx = adminCtx(Date.now());
    const qs = new URL(req.url || "/", "http://localhost").searchParams;
    const p = periodOf(qs, ctx);
    if (!p) return send(res, 400, { ok: false, error: "bad_period" });
    const basis: Basis = qs.get("basis") === "stream" ? "stream" : "reg";
    if (what === "summary") return send(res, 200, buildSummary(ctx, p, basis));
    if (what === "leads") return send(res, 200, buildLeads(ctx, p, listQuery(qs)));
    if (what === "subscribers") return send(res, 200, buildSubscribers(ctx, p, basis, listQuery(qs)));
    return send(res, 200, buildErrors(ctx, p));
  } catch (e) {
    // Только текст ошибки: в нём нет ни паролей, ни initData, ни данных людей.
    console.error("[admin-app] ошибка сборки данных:", String((e as Error)?.message || e).slice(0, 200));
    if (!res.headersSent) send(res, 500, { ok: false, error: "internal" });
  }
}

/** Страница. Файл ищем рядом с бандлом, затем на уровень выше (локальный form-api/dist). ADMIN_APP_HTML: свой путь. */
function readPage(): string | null {
  const candidates = [env("ADMIN_APP_HTML"), join(__dirname, "admin-app.html"), join(__dirname, "..", "admin-app.html")].filter(Boolean);
  for (const f of candidates) {
    try {
      return readFileSync(f, "utf8");
    } catch {
      /* пробуем следующий путь */
    }
  }
  return null;
}

/**
 * GET|HEAD /api/tg-web-app.js: скрипт Telegram Web App с нашего адреса. Общий CSP nginx не пускает
 * https://telegram.org в script-src, поэтому страница берёт SDK у себя (текст зашит в tg-webapp-sdk.ts).
 */
export function handleTgSdk(req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, {
    "Content-Type": "application/javascript; charset=utf-8",
    "Content-Length": Buffer.byteLength(TG_WEBAPP_SDK),
    "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(req.method === "HEAD" ? undefined : TG_WEBAPP_SDK);
}

/** GET /api/admin-app: один HTML. CSP: только свой origin, скрипты и стили по одноразовому nonce. */
export function handleAdminApp(req: IncomingMessage, res: ServerResponse): void {
  const html = readPage();
  if (html === null) return send(res, 404, { ok: false, error: "not_found" });
  const nonce = randomBytes(16).toString("base64");
  const body = html.split("__NONCE__").join(nonce);
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "Content-Security-Policy": [
      "default-src 'self'",
      `script-src 'nonce-${nonce}'`,
      `style-src 'nonce-${nonce}'`,
      "style-src-attr 'unsafe-inline'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "base-uri 'none'",
      "form-action 'none'",
      "object-src 'none'",
      "frame-ancestors https://telegram.org https://*.telegram.org",
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  });
  res.end(req.method === "HEAD" ? undefined : body);
}
