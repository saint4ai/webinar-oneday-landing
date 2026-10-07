"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// form-api/server.ts
var import_node_http = require("node:http");
var import_node_crypto4 = require("node:crypto");
var import_node_fs7 = require("node:fs");
var import_node_path7 = require("node:path");

// lib/meta-capi.ts
var import_node_crypto = __toESM(require("node:crypto"));

// lib/meta-pixel.ts
var META_PIXEL_ID = "2241406289947143";
var TRACK_TTL_MS = 30 * 24 * 60 * 60 * 1e3;

// lib/meta-capi.ts
var GRAPH_VERSION = "v21.0";
function sha256(value) {
  return import_node_crypto.default.createHash("sha256").update(value).digest("hex");
}
function hashText(value) {
  return sha256(value.trim().toLowerCase());
}
function hashPhone(rawPhone) {
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return void 0;
  if (digits.length === 11 && digits.startsWith("8")) {
    digits = "7" + digits.slice(1);
  }
  return sha256(digits);
}
async function sendLeadEvent(input) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    console.warn("[capi] META_CAPI_TOKEN \u043D\u0435 \u0437\u0430\u0434\u0430\u043D \u2014 \u0441\u043E\u0431\u044B\u0442\u0438\u0435 Lead \u041D\u0415 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E");
    return { ok: false, reason: "no_token" };
  }
  const userData = {};
  const ph = hashPhone(input.phone);
  if (ph) userData.ph = [ph];
  if (input.name?.trim()) userData.fn = [hashText(input.name)];
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  const event = {
    event_name: "Lead",
    event_time: Math.floor(Date.now() / 1e3),
    action_source: "website",
    event_id: input.eventId,
    event_source_url: input.eventSourceUrl || "https://onai.academy/workshop",
    user_data: userData
  };
  const body = { data: [event] };
  const testCode = input.testEventCode || process.env.META_TEST_EVENT_CODE;
  if (testCode) body.test_event_code = testCode;
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(
    token
  )}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(
        "[capi] %d %s \u2014 %s",
        res.status,
        res.statusText,
        errText.slice(0, 400)
      );
      return { ok: false, reason: "http_error", status: res.status, error: errText };
    }
    const json2 = await res.json();
    console.log(
      "[capi] Lead sent event_id=%s received=%s",
      input.eventId,
      json2?.events_received
    );
    return { ok: true, received: json2?.events_received ?? 0 };
  } catch (err) {
    console.error("[capi] fetch threw:", err);
    return { ok: false, reason: "exception", error: err };
  }
}

// lib/leads/store.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");
var import_node_crypto2 = require("node:crypto");

// lib/supabase-rest.ts
var SUPA_URL = process.env.SUPABASE_URL || "";
var SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
var TABLE = "workshop_leads";
function supabaseConfigured() {
  return Boolean(SUPA_URL && SUPA_KEY);
}
function headers(extra = {}) {
  return {
    apikey: SUPA_KEY,
    Authorization: `Bearer ${SUPA_KEY}`,
    "Content-Type": "application/json",
    ...extra
  };
}
async function insertLead(row) {
  if (!supabaseConfigured()) return { ok: false, reason: "no_config" };
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: headers({ Prefer: "resolution=ignore-duplicates,return=minimal" }),
      body: JSON.stringify(row)
    });
    if (res.ok || res.status === 409) return { ok: true };
    return { ok: false, reason: `http_${res.status}` };
  } catch {
    return { ok: false, reason: "exception" };
  }
}
async function bulkInsertIgnore(rows) {
  if (!supabaseConfigured()) return { ok: false, reason: "no_config" };
  if (!rows.length) return { ok: true };
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: headers({ Prefer: "resolution=ignore-duplicates,return=minimal" }),
      body: JSON.stringify(rows)
    });
    if (res.ok || res.status === 409) return { ok: true };
    return { ok: false, reason: `http_${res.status}` };
  } catch {
    return { ok: false, reason: "exception" };
  }
}
async function updateLead(id, patch) {
  if (!supabaseConfigured()) return { ok: false, reason: "no_config" };
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
      method: "PATCH",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify({ ...patch, updated_at: (/* @__PURE__ */ new Date()).toISOString() })
    });
    return res.ok ? { ok: true } : { ok: false, reason: `http_${res.status}` };
  } catch {
    return { ok: false, reason: "exception" };
  }
}
async function selectRetryable(maxRetry, limit = 50) {
  if (!supabaseConfigured()) return [];
  try {
    const q = `status=in.(pending,failed)&retry_count=lt.${maxRetry}&order=created_at.asc&limit=${limit}`;
    const res = await fetch(`${SUPA_URL}/rest/v1/${TABLE}?${q}`, {
      headers: headers()
    });
    if (!res.ok) return [];
    return await res.json().catch(() => []);
  } catch {
    return [];
  }
}

// lib/leads/store.ts
var LOG_PATH = process.env.LEADS_LOG_PATH || "/var/lib/workshop/leads.jsonl";
function appendWal(entry) {
  try {
    (0, import_node_fs.mkdirSync)((0, import_node_path.dirname)(LOG_PATH), { recursive: true });
    (0, import_node_fs.appendFileSync)(
      LOG_PATH,
      JSON.stringify({ ...entry, ts: (/* @__PURE__ */ new Date()).toISOString() }) + "\n"
    );
  } catch (e) {
    console.error("[leads] WAL append failed:", e);
  }
}
async function captureLead(input) {
  const id = (0, import_node_crypto2.randomUUID)();
  const lead = { id, ...input };
  appendWal({ kind: "capture", ...lead });
  const row = {
    id,
    event_id: input.eventId ?? null,
    name: input.name,
    phone: input.phone,
    source: input.source ?? null,
    utm: input.utm ?? null,
    fbclid: input.fbclid ?? null,
    status: "pending",
    retry_count: 0
  };
  const r = await insertLead(row);
  if (!r.ok) {
    appendWal({ kind: "supabase_insert_failed", id, reason: r.reason });
    console.error("[leads] supabase insert failed:", r.reason);
  }
  return lead;
}
async function markDone(id, amocrmLeadId) {
  await updateLead(id, {
    status: "done",
    amocrm_lead_id: amocrmLeadId ?? null,
    last_error: null
  });
}
async function markFailed(id, error) {
  await updateLead(id, { status: "failed", last_error: error.slice(0, 500) });
}
async function incrementRetry(id, current, error) {
  await updateLead(id, {
    retry_count: current + 1,
    status: "failed",
    ...error ? { last_error: error.slice(0, 500) } : {}
  });
}
async function markAlertSent(id) {
  await updateLead(id, { status: "alert_sent" });
}
async function ingestWalToSupabase() {
  if (!(0, import_node_fs.existsSync)(LOG_PATH)) return 0;
  let text = "";
  try {
    text = (0, import_node_fs.readFileSync)(LOG_PATH, "utf8");
  } catch {
    return 0;
  }
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    if (e.kind !== "capture") continue;
    rows.push({
      id: e.id,
      event_id: e.eventId ?? null,
      name: e.name,
      phone: e.phone,
      source: e.source ?? null,
      utm: e.utm ?? null,
      fbclid: e.fbclid ?? null,
      status: "pending",
      retry_count: 0
    });
  }
  if (!rows.length) return 0;
  await bulkInsertIgnore(rows);
  return rows.length;
}

// lib/amocrm/client.ts
var DEFAULT_PIPELINE = 10882150;
var TAG_WORKSHOP = "\u041E\u0434\u043D\u043E\u0434\u043D\u0435\u0432\u043D\u0438\u043A";
var UTM_FIELD_IDS = {
  utm_source: 2177194,
  utm_medium: 2177190,
  utm_campaign: 2177192,
  utm_content: 2177188,
  utm_term: 2177196,
  utm_referrer: 2177198,
  gclid: 2177220
};
var FBCLID_FIELD_ID = 2177224;
async function createWorkshopLead(input) {
  const token = process.env.AMOCRM_ACCESS_TOKEN;
  const domain = process.env.AMOCRM_DOMAIN || "platformonaiacademy";
  if (!token) {
    console.warn(
      "[amocrm] AMOCRM_ACCESS_TOKEN \u043D\u0435 \u0437\u0430\u0434\u0430\u043D \u2014 \u043B\u0438\u0434 \u041D\u0415 \u0441\u043E\u0437\u0434\u0430\u043D. \u041B\u0438\u0434: %s ***%s",
      input.name,
      input.phone.slice(-4)
    );
    return { ok: false, reason: "no_token" };
  }
  const pipelineId = Number(process.env.AMOCRM_PIPELINE_WORKSHOP) || DEFAULT_PIPELINE;
  const statusId = process.env.AMOCRM_STATUS_WORKSHOP ? Number(process.env.AMOCRM_STATUS_WORKSHOP) : void 0;
  const leadCustomFields = [];
  if (input.utm) {
    for (const [key, fieldId] of Object.entries(UTM_FIELD_IDS)) {
      const v = input.utm[key];
      if (v) leadCustomFields.push({ field_id: fieldId, values: [{ value: v }] });
    }
  }
  if (input.fbclid) {
    leadCustomFields.push({ field_id: FBCLID_FIELD_ID, values: [{ value: input.fbclid }] });
  }
  const body = [
    {
      name: `\u041E\u0434\u043D\u043E\u0434\u043D\u0435\u0432\u043D\u0438\u043A \xB7 ${input.name}`,
      pipeline_id: pipelineId,
      ...statusId ? { status_id: statusId } : {},
      ...leadCustomFields.length ? { custom_fields_values: leadCustomFields } : {},
      _embedded: {
        contacts: [
          {
            name: input.name,
            custom_fields_values: [
              {
                field_code: "PHONE",
                values: [{ value: input.phone, enum_code: "MOB" }]
              }
            ]
          }
        ],
        tags: [{ name: TAG_WORKSHOP }, { name: input.source }]
      }
    }
  ];
  const url = `https://${domain}.amocrm.ru/api/v4/leads/complex`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(
        "[amocrm] %d %s \u2014 body: %s",
        res.status,
        res.statusText,
        errText.slice(0, 500)
      );
      return { ok: false, reason: "http_error", status: res.status, error: errText };
    }
    const data = await res.json();
    const leadId = data?.[0]?.id;
    console.log(
      "[amocrm] lead created id=%s contact=%s tag=%s",
      leadId,
      data?.[0]?.contact_id,
      TAG_WORKSHOP
    );
    return { ok: true, leadId };
  } catch (err) {
    console.error("[amocrm] fetch threw:", err);
    return { ok: false, reason: "exception", error: err };
  }
}
async function findExistingWorkshopLead(phone) {
  const token = process.env.AMOCRM_ACCESS_TOKEN;
  const domain = process.env.AMOCRM_DOMAIN || "platformonaiacademy";
  const pipelineId = Number(process.env.AMOCRM_PIPELINE_WORKSHOP) || DEFAULT_PIPELINE;
  if (!token) return { ok: false };
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return { ok: true, leadId: null };
  try {
    const url = `https://${domain}.amocrm.ru/api/v4/leads?query=${encodeURIComponent(
      digits
    )}&limit=10`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 204) return { ok: true, leadId: null };
    if (!res.ok) return { ok: false };
    const data = await res.json().catch(() => null);
    const leads = data?._embedded?.leads ?? [];
    const now = Math.floor(Date.now() / 1e3);
    const match = leads.find(
      (l) => l.pipeline_id === pipelineId && now - (l.created_at || 0) < 86400
    );
    return { ok: true, leadId: match ? match.id : null };
  } catch {
    return { ok: false };
  }
}

// lib/leads/process.ts
async function pushLeadToAmo(lead, opts) {
  if (opts.probeFirst) {
    const found = await findExistingWorkshopLead(lead.phone);
    if (found.ok && found.leadId) {
      await markDone(lead.id, found.leadId);
      return { ok: true, leadId: found.leadId, adopted: true };
    }
  }
  const r = await createWorkshopLead({
    name: lead.name,
    phone: lead.phone,
    source: lead.source ?? "landing",
    utm: lead.utm,
    fbclid: lead.fbclid
  });
  if (r.ok) {
    await markDone(lead.id, r.leadId);
    return { ok: true, leadId: r.leadId };
  }
  const status = "status" in r && r.status ? `:${r.status}` : "";
  return { ok: false, error: `amocrm:${r.reason}${status}` };
}

// lib/telegram/alert.ts
var TOKEN = process.env.TELEGRAM_ALERT_TOKEN || "";
var CHAT_ID = process.env.TELEGRAM_ALERT_CHAT_ID || "";
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
async function sendOwnerAlert(lead, error) {
  if (!TOKEN || !CHAT_ID) {
    console.error("[alert] telegram not configured (TELEGRAM_ALERT_TOKEN/CHAT_ID)");
    return { ok: false };
  }
  const utm = lead.utm ? Object.entries(lead.utm).map(([k, v]) => `${k}=${v}`).join(" \xB7 ") : "\u2014";
  const text = [
    "\u{1F534} <b>\u041B\u0438\u0434 \u041D\u0415 \u0441\u043E\u0437\u0434\u0430\u043D \u0432 amoCRM</b> (\u0440\u0435\u0442\u0440\u0430\u0438 \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D\u044B)",
    `\u0418\u043C\u044F: <b>${esc(lead.name)}</b>`,
    `\u0422\u0435\u043B\u0435\u0444\u043E\u043D: <code>${esc(lead.phone)}</code>`,
    `UTM: ${esc(utm)}`,
    `\u041E\u0448\u0438\u0431\u043A\u0430: <code>${esc(error)}</code>`,
    `ID \u0432 \u0431\u0430\u0437\u0435: <code>${esc(lead.id)}</code>`,
    "",
    "\u041F\u0435\u0440\u0435\u0441\u043E\u0437\u0434\u0430\u0439 \u0441\u0434\u0435\u043B\u043A\u0443 \u0432\u0440\u0443\u0447\u043D\u0443\u044E \u0438\u0437 \u0442\u0430\u0431\u043B\u0438\u0446\u044B <code>workshop_leads</code>."
  ].join("\n");
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true
        })
      }
    );
    if (!res.ok) {
      console.error("[alert] telegram HTTP", res.status);
      return { ok: false };
    }
    return { ok: true };
  } catch (e) {
    console.error("[alert] telegram send failed:", e);
    return { ok: false };
  }
}

// lib/whatsapp-link.ts
var import_node_fs2 = require("node:fs");
var import_node_path2 = require("node:path");
var LINK_PATH = process.env.WHATSAPP_LINK_PATH || "/var/lib/workshop/whatsapp-link.json";
var FALLBACK = process.env.WHATSAPP_COMMUNITY_FALLBACK || "https://chat.whatsapp.com/IfLyJvWLo7HDq5yleoKCzz";
function isValidWhatsAppLink(raw) {
  let u;
  try {
    u = new URL(raw.trim());
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  return host === "chat.whatsapp.com" || host === "wa.me";
}
function readWhatsAppLink() {
  try {
    if (!(0, import_node_fs2.existsSync)(LINK_PATH)) return FALLBACK;
    const rec = JSON.parse((0, import_node_fs2.readFileSync)(LINK_PATH, "utf8"));
    if (rec && typeof rec.link === "string" && isValidWhatsAppLink(rec.link)) {
      return rec.link;
    }
    return FALLBACK;
  } catch {
    return FALLBACK;
  }
}
function readWhatsAppRecord() {
  try {
    if ((0, import_node_fs2.existsSync)(LINK_PATH)) {
      const rec = JSON.parse((0, import_node_fs2.readFileSync)(LINK_PATH, "utf8"));
      if (rec && typeof rec.link === "string" && isValidWhatsAppLink(rec.link)) {
        return {
          link: rec.link,
          updatedAt: rec.updatedAt || "",
          updatedBy: rec.updatedBy
        };
      }
    }
  } catch {
  }
  return { link: FALLBACK, updatedAt: "", updatedBy: void 0 };
}
function writeWhatsAppLink(link, by) {
  const clean = link.trim();
  if (!isValidWhatsAppLink(clean)) {
    return { ok: false, error: "not_a_whatsapp_link" };
  }
  try {
    (0, import_node_fs2.mkdirSync)((0, import_node_path2.dirname)(LINK_PATH), { recursive: true });
    const rec = {
      link: clean,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedBy: by
    };
    const tmp = `${LINK_PATH}.tmp.${process.pid}`;
    (0, import_node_fs2.writeFileSync)(tmp, JSON.stringify(rec, null, 2) + "\n", "utf8");
    (0, import_node_fs2.renameSync)(tmp, LINK_PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// form-api/tg-workshop.ts
var import_node_crypto3 = require("node:crypto");
var import_node_fs5 = require("node:fs");
var import_node_path5 = require("node:path");

// form-api/tg-store.ts
var import_node_fs3 = require("node:fs");
var import_node_path3 = require("node:path");
var runtime = {
  startedAt: Date.now(),
  /** Отказы вебхука по секрету. */
  webhookRejected: 0,
  events: []
};
function noteRuntime(type, extra = {}) {
  runtime.events.push({ type, ts: Date.now(), ...extra });
  if (runtime.events.length > 500) runtime.events.splice(0, runtime.events.length - 500);
}
var TY_DAILY_CAP = 5e3;
function applyEvent(subs, ev) {
  const ts = Date.parse(ev.ts);
  const s = subs.get(ev.chat_id);
  switch (ev.type) {
    case "start": {
      if (!s) {
        subs.set(ev.chat_id, {
          chatId: ev.chat_id,
          userId: ev.user_id,
          username: ev.username || "",
          firstName: ev.first_name || "",
          languageCode: ev.language_code || "",
          payload: ev.payload || "",
          streamDay: ev.streamDay,
          registeredAt: ts,
          firstStartAt: ts,
          blocked: false,
          stopped: false,
          paid: false
        });
        return;
      }
      const fresh = s.streamDay !== ev.streamDay || s.stopped || s.blocked;
      s.userId = ev.user_id;
      s.username = ev.username || s.username;
      s.firstName = ev.first_name || s.firstName;
      s.languageCode = ev.language_code || s.languageCode;
      if (!s.payload && ev.payload) s.payload = ev.payload;
      s.streamDay = ev.streamDay;
      s.stopped = false;
      s.blocked = false;
      if (fresh) s.registeredAt = ts;
      return;
    }
    case "blocked":
      if (s) s.blocked = true;
      return;
    case "unblocked":
      if (s) s.blocked = false;
      return;
    case "stop":
      if (s) s.stopped = true;
      return;
    case "paid":
      if (s) s.paid = true;
      return;
    case "rejoin":
      if (s) {
        s.streamDay = ev.streamDay;
        s.registeredAt = ts;
      }
      return;
  }
}
function readJsonl(file) {
  const rows = [];
  let bad = 0;
  if (!(0, import_node_fs3.existsSync)(file)) return { rows, bad };
  for (const line of (0, import_node_fs3.readFileSync)(file, "utf8").split("\n")) {
    const s = line.trim();
    if (!s) continue;
    try {
      rows.push(JSON.parse(s));
    } catch {
      bad++;
    }
  }
  return { rows, bad };
}
var TgStore = class _TgStore {
  constructor(dir) {
    this.subs = /* @__PURE__ */ new Map();
    /** Ключи «сообщение|день|чат» по всем попыткам отправки, включая неудачные: повторов нет. */
    this.sent = /* @__PURE__ */ new Set();
    /** То же только для успешных отправок (для /series). */
    this.sentOk = /* @__PURE__ */ new Set();
    /** Ключи «чат|день» по переходам в эфир. */
    this.clicks = /* @__PURE__ */ new Set();
    /** Клики на «Спасибо»: сколько за день по каналу, плюс ключи «день|канал|eid» против дублей. */
    this.tyCounts = /* @__PURE__ */ new Map();
    /** Ключи дублей живут только в пределах одного дня: при смене дня множество сбрасывается, память не растёт. */
    this.tyKeys = /* @__PURE__ */ new Set();
    this.tyKeysDay = "";
    /** Сколько строк за день записано в ty-clicks.jsonl (потолок TY_DAILY_CAP). */
    this.tyTotals = /* @__PURE__ */ new Map();
    /** Кто записывался на эфир дня D (по событиям start и rejoin): день остаётся в истории, даже если человек потом перезаписался. */
    this.regDays = /* @__PURE__ */ new Map();
    /** Кто нажал «Я уже оплатил(а)» сам, по дню эфира, на который был записан в тот момент. */
    this.paidDays = /* @__PURE__ */ new Map();
    this.state = { seriesEnabled: false, media: {}, overrides: {}, bizon: "", reported: [], adminReported: [], adminSince: 0 };
    this.dir = dir;
    (0, import_node_fs3.mkdirSync)(dir, { recursive: true });
    this.fSubs = (0, import_node_path3.join)(dir, "tg-subscribers.jsonl");
    this.fSent = (0, import_node_path3.join)(dir, "tg-sent.jsonl");
    this.fClicks = (0, import_node_path3.join)(dir, "tg-clicks.jsonl");
    this.fTy = (0, import_node_path3.join)(dir, "ty-clicks.jsonl");
    this.fState = (0, import_node_path3.join)(dir, "tg-state.json");
    this.load();
  }
  load() {
    const evs = readJsonl(this.fSubs);
    for (const ev of evs.rows) {
      if (ev && typeof ev.chat_id === "number" && typeof ev.ts === "string") {
        this.track(ev);
        applyEvent(this.subs, ev);
      }
    }
    const sent = readJsonl(this.fSent);
    for (const e of sent.rows) {
      if (!e || !e.msg) continue;
      this.sent.add(_TgStore.sentKey(e.msg, e.day, e.chat_id));
      if (e.ok) this.sentOk.add(_TgStore.sentKey(e.msg, e.day, e.chat_id));
    }
    const clicks = readJsonl(this.fClicks);
    for (const c of clicks.rows) if (c && c.day) this.clicks.add(_TgStore.clickKey(c.chat_id, c.day));
    const ty = readJsonl(this.fTy);
    for (const c of ty.rows) if (c && c.day && (c.ch === "tg" || c.ch === "wa")) this.countTy(c.ch, c.eid || "", c.day);
    try {
      if ((0, import_node_fs3.existsSync)(this.fState)) {
        const st = JSON.parse((0, import_node_fs3.readFileSync)(this.fState, "utf8"));
        const obj = (x) => x && typeof x === "object" && !Array.isArray(x) ? x : {};
        this.state = {
          seriesEnabled: st.seriesEnabled === true,
          media: obj(st.media),
          overrides: obj(st.overrides),
          bizon: typeof st.bizon === "string" ? st.bizon : "",
          reported: Array.isArray(st.reported) ? st.reported.filter((x) => typeof x === "string") : [],
          adminReported: Array.isArray(st.adminReported) ? st.adminReported.filter((x) => typeof x === "string") : [],
          adminSince: typeof st.adminSince === "number" ? st.adminSince : 0
        };
      }
    } catch {
      console.warn("[tg-store] tg-state.json \u043D\u0435\u0447\u0438\u0442\u0430\u0435\u043C, \u0431\u0435\u0440\u0443 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E");
    }
    const bad = evs.bad + sent.bad + clicks.bad + ty.bad;
    console.log(
      "[tg-store] \u043F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u043E\u0432=%d, \u043E\u0442\u043F\u0440\u0430\u0432\u043E\u043A=%d, \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u043E\u0432=%d, \u0431\u0438\u0442\u044B\u0445 \u0441\u0442\u0440\u043E\u043A=%d, \u0441\u0435\u0440\u0438\u044F=%s",
      this.subs.size,
      this.sent.size,
      this.clicks.size,
      bad,
      this.state.seriesEnabled ? "\u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0430" : "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u0430"
    );
  }
  /** Дописать строку в JSONL. Сбой диска не должен ронять бота: логируем и идём дальше. */
  append(file, row) {
    try {
      (0, import_node_fs3.appendFileSync)(file, JSON.stringify(row) + "\n", "utf8");
    } catch (e) {
      console.error("[tg-store] \u043D\u0435 \u0441\u043C\u043E\u0433 \u0434\u043E\u043F\u0438\u0441\u0430\u0442\u044C %s:", file, e.message);
    }
  }
  static sentKey(msg, day, chatId) {
    return `${msg}|${day}|${chatId}`;
  }
  static clickKey(chatId, day) {
    return `${chatId}|${day}`;
  }
  recordEvent(ev) {
    this.append(this.fSubs, ev);
    this.track(ev);
    applyEvent(this.subs, ev);
  }
  /** Метрики по дням эфира копятся из событий, поэтому после рестарта восстанавливаются тем же проходом. */
  track(ev) {
    const add = (m, day, chat) => {
      let s = m.get(day);
      if (!s) m.set(day, s = /* @__PURE__ */ new Set());
      s.add(chat);
    };
    if (ev.type === "start" || ev.type === "rejoin") add(this.regDays, ev.streamDay, ev.chat_id);
    else if (ev.type === "paid" && ev.by === "self") {
      const day = this.subs.get(ev.chat_id)?.streamDay;
      if (day) add(this.paidDays, day, ev.chat_id);
    }
  }
  /** Дни эфира, на которые кто-то записывался. */
  regDayKeys() {
    return [...this.regDays.keys()];
  }
  /**
   * Метрики эфира дня D: записались (уникальные chat_id с этим днём), из них перешли по кнопке
   * эфира (уникальные, /api/go), из них нажали «Я уже оплатил(а)».
   */
  dayMetrics(day) {
    const reg = this.regDays.get(day);
    if (!reg) return { registered: 0, clicked: 0, paid: 0 };
    let clicked = 0;
    let paid = 0;
    const paidSet = this.paidDays.get(day);
    for (const chat of reg) {
      if (this.clicks.has(_TgStore.clickKey(chat, day))) clicked++;
      if (paidSet?.has(chat)) paid++;
    }
    return { registered: reg.size, clicked, paid };
  }
  isReported(day) {
    return this.state.reported.includes(day);
  }
  markReported(day) {
    if (this.isReported(day)) return;
    this.state.reported = [...this.state.reported, day].slice(-30);
    this.saveState();
  }
  setAdminSince(ms) {
    this.state.adminSince = ms;
    this.saveState();
  }
  isAdminReported(day) {
    return this.state.adminReported.includes(day);
  }
  markAdminReported(day) {
    if (this.isAdminReported(day)) return;
    this.state.adminReported = [...this.state.adminReported, day].slice(-30);
    this.saveState();
  }
  /** Пути журналов: их читает админ-аналитика (tg-admin) с кешем по mtime. */
  paths() {
    return { subs: this.fSubs, sent: this.fSent, clicks: this.fClicks, ty: this.fTy };
  }
  recordSent(e) {
    this.append(this.fSent, e);
    this.sent.add(_TgStore.sentKey(e.msg, e.day, e.chat_id));
    if (e.ok) this.sentOk.add(_TgStore.sentKey(e.msg, e.day, e.chat_id));
  }
  hasSent(msg, day, chatId) {
    return this.sent.has(_TgStore.sentKey(msg, day, chatId));
  }
  /** Клик по переходу в эфир. Пара (chat_id, день) пишется один раз. Возвращает true, если запись новая. */
  recordClick(chatId, day, ts) {
    const key = _TgStore.clickKey(chatId, day);
    if (this.clicks.has(key)) return false;
    this.append(this.fClicks, { chat_id: chatId, day, ts });
    this.clicks.add(key);
    return true;
  }
  countTy(ch, eid, day) {
    this.tyTotals.set(day, (this.tyTotals.get(day) || 0) + 1);
    if (eid) {
      if (day !== this.tyKeysDay) {
        this.tyKeys = /* @__PURE__ */ new Set();
        this.tyKeysDay = day;
      }
      const k = `${day}|${ch}|${eid}`;
      if (this.tyKeys.has(k)) return;
      this.tyKeys.add(k);
    }
    const c = `${day}|${ch}`;
    this.tyCounts.set(c, (this.tyCounts.get(c) || 0) + 1);
  }
  /**
   * Клик по кнопке Telegram или WhatsApp на странице «Спасибо». Повтор того же eid за день не
   * считается. Потолок TY_DAILY_CAP записей в сутки: дальше ничего не пишем и возвращаем false.
   */
  recordTyClick(ch, eid, day, ts, src = "") {
    if ((this.tyTotals.get(day) || 0) >= TY_DAILY_CAP) return false;
    this.append(this.fTy, { ch, eid, day, ts, ...src ? { src } : {} });
    this.countTy(ch, eid, day);
    return true;
  }
  /** Размер множества ключей против дублей (для проверки, что оно не растёт между днями). */
  tyKeySize() {
    return this.tyKeys.size;
  }
  tyCount(day, ch) {
    return this.tyCounts.get(`${day}|${ch}`) || 0;
  }
  /** Сколько человек впервые нажали «Запустить» в день D и сколько из них пришли с метки prefix. */
  startedOn(day, dayOfMs, prefix = "ty") {
    let total = 0;
    let fromPrefix = 0;
    for (const s of this.subs.values()) {
      if (dayOfMs(s.firstStartAt) !== day) continue;
      total++;
      if (s.payload === prefix || s.payload.startsWith(prefix + "_")) fromPrefix++;
    }
    return { total, fromPrefix };
  }
  hasClick(chatId, day) {
    return this.clicks.has(_TgStore.clickKey(chatId, day));
  }
  /** Сколько разных людей перешли в эфир дня D. */
  clickedCount(day) {
    let n = 0;
    for (const s of this.subs.values()) if (this.clicks.has(_TgStore.clickKey(s.chatId, day))) n++;
    return n;
  }
  /** Сколько человек получили сообщение msg за день D (успешно). Для /series. */
  sentCount(msg, day) {
    let n = 0;
    for (const s of this.subs.values()) if (this.sentOk.has(_TgStore.sentKey(msg, day, s.chatId))) n++;
    return n;
  }
  /** Найти подписчика по chat_id или @username (без учёта регистра). */
  find(query) {
    const q = query.trim();
    if (/^-?\d+$/.test(q)) return this.subs.get(Number(q));
    const name = q.replace(/^@/, "").toLowerCase();
    if (!name) return void 0;
    for (const s of this.subs.values()) if (s.username.toLowerCase() === name) return s;
    return void 0;
  }
  isActive(s) {
    return !s.blocked && !s.stopped;
  }
  /** Подходит ли подписчик под аудиторию сообщения для дня D. */
  audienceOk(aud, s, day) {
    if (aud === "clicked") return this.clicks.has(_TgStore.clickKey(s.chatId, day));
    if (aud === "notClicked") return !this.clicks.has(_TgStore.clickKey(s.chatId, day));
    if (aud === "notPaid") return !s.paid;
    return true;
  }
  saveState() {
    try {
      const tmp = `${this.fState}.tmp.${process.pid}`;
      (0, import_node_fs3.writeFileSync)(tmp, JSON.stringify(this.state, null, 2) + "\n", "utf8");
      (0, import_node_fs3.renameSync)(tmp, this.fState);
    } catch (e) {
      console.error("[tg-store] \u043D\u0435 \u0441\u043C\u043E\u0433 \u0437\u0430\u043F\u0438\u0441\u0430\u0442\u044C tg-state.json:", e.message);
    }
  }
  setSeriesEnabled(v) {
    this.state.seriesEnabled = v;
    this.saveState();
  }
  /** Правка расписания: at строкой HH:MM или enabled; null снимает поле. Пустая правка удаляется. */
  setOverride(id, patch) {
    const cur = { ...this.state.overrides[id] || {} };
    if (patch.at !== void 0) {
      if (patch.at === null) delete cur.at;
      else cur.at = patch.at;
    }
    if (patch.enabled !== void 0) {
      if (patch.enabled === null) delete cur.enabled;
      else cur.enabled = patch.enabled;
    }
    if (Object.keys(cur).length) this.state.overrides[id] = cur;
    else delete this.state.overrides[id];
    this.saveState();
  }
  setBizon(url) {
    this.state.bizon = url;
    this.saveState();
  }
  getMedia(key) {
    return this.state.media[key];
  }
  setMedia(key, fileId) {
    this.state.media[key] = fileId;
    this.saveState();
  }
  dropMedia(key) {
    delete this.state.media[key];
    this.saveState();
  }
};

// form-api/tg-admin.ts
var import_node_fs4 = require("node:fs");
var import_node_path4 = require("node:path");

// form-api/tg-time.ts
var DEFAULT_OFFSET_MIN = 300;
var offsetMs = DEFAULT_OFFSET_MIN * 6e4;
function setUtcOffsetMinutes(min) {
  offsetMs = min * 6e4;
}
var DEFAULT_JOIN_MINUTES = 40;
var MONTHS_GEN = [
  "\u044F\u043D\u0432\u0430\u0440\u044F",
  "\u0444\u0435\u0432\u0440\u0430\u043B\u044F",
  "\u043C\u0430\u0440\u0442\u0430",
  "\u0430\u043F\u0440\u0435\u043B\u044F",
  "\u043C\u0430\u044F",
  "\u0438\u044E\u043D\u044F",
  "\u0438\u044E\u043B\u044F",
  "\u0430\u0432\u0433\u0443\u0441\u0442\u0430",
  "\u0441\u0435\u043D\u0442\u044F\u0431\u0440\u044F",
  "\u043E\u043A\u0442\u044F\u0431\u0440\u044F",
  "\u043D\u043E\u044F\u0431\u0440\u044F",
  "\u0434\u0435\u043A\u0430\u0431\u0440\u044F"
];
var pad = (n) => String(n).padStart(2, "0");
function partsInTZ(ms) {
  const d = new Date(ms + offsetMs);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds()
  };
}
function almatyWallToUTC(y, m0, d, hour, minute = 0) {
  return Date.UTC(y, m0, d, hour, minute, 0) - offsetMs;
}
function dayKeyOf(ms) {
  const p = partsInTZ(ms);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}
var DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
function isDayKey(s) {
  if (typeof s !== "string" || !DAY_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}
function parseDayKey(day) {
  if (!isDayKey(day)) throw new Error(`bad day key: ${day}`);
  const [y, m, d] = day.split("-").map(Number);
  return { y, m0: m - 1, d };
}
function addDays(day, n) {
  const { y, m0, d } = parseDayKey(day);
  const t = new Date(Date.UTC(y, m0, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}
function parseHHMM(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) throw new Error(`bad time: ${s}`);
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) throw new Error(`bad time: ${s}`);
  return { h, m: mi };
}
function atTime(day, hhmm) {
  const { y, m0, d } = parseDayKey(day);
  const { h, m } = parseHHMM(hhmm);
  return almatyWallToUTC(y, m0, d, h, m);
}
function streamStart(day, cfg) {
  return atTime(day, cfg.streamStart);
}
function streamEnd(day, cfg) {
  return streamStart(day, cfg) + cfg.streamMinutes * 6e4;
}
function joinCloses(day, cfg) {
  return streamStart(day, cfg) + (cfg.joinLiveMinutes ?? DEFAULT_JOIN_MINUTES) * 6e4;
}
function isStreamDay(day, cfg) {
  if (cfg.firstDay && day < cfg.firstDay) return false;
  return !(cfg.skipDays || []).includes(day);
}
function nextStreamDay(from, cfg) {
  let d = cfg.firstDay && cfg.firstDay > from ? cfg.firstDay : from;
  for (let i = 0; i < 400 && !isStreamDay(d, cfg); i++) d = addDays(d, 1);
  return d;
}
function isLive(day, now, cfg) {
  return now >= streamStart(day, cfg) && now < streamEnd(day, cfg);
}
function liveDayNow(now, cfg) {
  const today = dayKeyOf(now);
  return isStreamDay(today, cfg) && isLive(today, now, cfg) ? today : null;
}
function assignStreamDay(now, cfg) {
  const today = dayKeyOf(now);
  if (isStreamDay(today, cfg) && now < joinCloses(today, cfg)) return today;
  return nextStreamDay(addDays(today, 1), cfg);
}
function dayWord(day, now) {
  const today = dayKeyOf(now);
  if (day === today) return "\u0421\u0435\u0433\u043E\u0434\u043D\u044F";
  if (day === addDays(today, 1)) return "\u0417\u0430\u0432\u0442\u0440\u0430";
  const { m0, d } = parseDayKey(day);
  return `${d} ${MONTHS_GEN[m0]}`;
}
function dateLabel(day) {
  const { m0, d } = parseDayKey(day);
  return `${d} ${MONTHS_GEN[m0]}`;
}
function dayWordLower(day, now) {
  const w = dayWord(day, now);
  return w.charAt(0).toLowerCase() + w.slice(1);
}
function hhmmOf(ms) {
  const p = partsInTZ(ms);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

// form-api/tg-admin.ts
var MSG_LIMIT = 4e3;
var caches = /* @__PURE__ */ new Map();
function readJsonlCached(file) {
  let st;
  try {
    st = (0, import_node_fs4.statSync)(file);
  } catch (e) {
    caches.delete(file);
    const code = e.code;
    return code === "ENOENT" ? { rows: [], missing: true } : { rows: [], error: String(e.message || e) };
  }
  let c = caches.get(file);
  if (c && c.size === st.size && c.mtime === st.mtimeMs) return { rows: c.rows };
  if (!c || st.size < c.offset) c = { size: 0, mtime: 0, offset: 0, rows: [] };
  try {
    const len = st.size - c.offset;
    if (len > 0) {
      const buf = Buffer.alloc(len);
      const fd = (0, import_node_fs4.openSync)(file, "r");
      try {
        (0, import_node_fs4.readSync)(fd, buf, 0, len, c.offset);
      } finally {
        (0, import_node_fs4.closeSync)(fd);
      }
      const nl = buf.lastIndexOf(10);
      if (nl >= 0) {
        for (const line of buf.subarray(0, nl + 1).toString("utf8").split("\n")) {
          const s = line.trim();
          if (!s) continue;
          try {
            const o = JSON.parse(s);
            if (o && typeof o === "object") c.rows.push(o);
          } catch {
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
    return { rows: [], error: String(e.message || e) };
  }
}
var low = (v, max = 60) => String(v ?? "").trim().toLowerCase().slice(0, max);
function hostOf(raw) {
  const s = raw.trim();
  if (!s) return "";
  for (const cand of [s, `https://${s}`]) {
    try {
      const h = new URL(cand).hostname.toLowerCase().replace(/^www\./, "");
      if (h && h.includes(".")) return h;
    } catch {
    }
  }
  return "";
}
function placeOf(source) {
  const s = source.trim().toLowerCase();
  if (!s) return "\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E";
  return s.includes("-") ? s.split("-").pop() : s;
}
var leadMemo = null;
function leadsFilePath(ctx) {
  return ctx.leadsFile || process.env.LEADS_LOG_PATH || "/var/lib/workshop/leads.jsonl";
}
function readLeads(ctx) {
  const r = readJsonlCached(leadsFilePath(ctx));
  if (r.error) return { leads: null, error: r.error };
  if (r.missing) return { leads: null, error: "\u0444\u0430\u0439\u043B \u0437\u0430\u044F\u0432\u043E\u043A \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" };
  if (leadMemo && leadMemo.rowsRef === r.rows && leadMemo.len === r.rows.length) return { leads: leadMemo.leads, error: "" };
  const seen = /* @__PURE__ */ new Set();
  const leads = [];
  for (const row of r.rows) {
    if (row.kind !== "capture") continue;
    const ts = Date.parse(String(row.ts ?? ""));
    if (!Number.isFinite(ts)) continue;
    const id = String(row.id ?? "");
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    const u = row.utm && typeof row.utm === "object" ? row.utm : {};
    leads.push({
      id,
      eventId: String(row.eventId ?? "").trim(),
      place: placeOf(String(row.source ?? "")),
      utmSource: low(u.utm_source),
      utmMedium: low(u.utm_medium),
      utmCampaign: low(u.utm_campaign),
      refHost: hostOf(String(u.utm_referrer ?? "")),
      gclid: !!String(u.gclid ?? "").trim(),
      ts,
      day: dayKeyOf(ts)
    });
  }
  leadMemo = { rowsRef: r.rows, len: r.rows.length, leads };
  return { leads, error: "" };
}
var hasUtm = (l) => !!(l.utmSource || l.utmMedium || l.utmCampaign);
function utmLabel(l) {
  return [l.utmSource, l.utmMedium, l.utmCampaign].filter(Boolean).join(" / ");
}
function noUtmLabel(l) {
  if (l.refHost) return l.refHost;
  if (l.gclid) return "google (gclid)";
  return "\u043F\u0440\u044F\u043C\u043E\u0439 \u0437\u0430\u0445\u043E\u0434";
}
var sourceCol = (l) => l.utmSource || "\u0431\u0435\u0437 \u043C\u0435\u0442\u043A\u0438";
function classifyPayload(payload) {
  const p = payload.trim();
  if (!p) return { kind: "direct", eid: "", tag: "" };
  const m = /^(pp|ty)(?:_(.+))?$/i.exec(p);
  if (m) return { kind: m[1].toLowerCase(), eid: m[2] || "", tag: "" };
  return { kind: "tag", eid: "", tag: (p.split("_")[0] || p).toLowerCase() };
}
var RANGE_MAX_DAYS = 366;
function daysBetween(from, to) {
  const out = [];
  for (let d = from; d <= to && out.length < RANGE_MAX_DAYS; d = addDays(d, 1)) out.push(d);
  return out;
}
var ddmm = (day) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;
function resolvePeriod(key, now, firstDataDay2) {
  const today = dayKeyOf(now);
  let from = today;
  let to = today;
  let label;
  if (key === "y") {
    from = to = addDays(today, -1);
    label = `\u0412\u0447\u0435\u0440\u0430, ${dateLabel(from)}`;
  } else if (key === "7" || key === "30") {
    from = addDays(today, -(Number(key) - 1));
    label = `${key} \u0434\u043D\u0435\u0439: ${dateLabel(from)} - ${dateLabel(to)}`;
  } else if (key === "all") {
    from = firstDataDay2 && firstDataDay2 < today ? firstDataDay2 : today;
    if (daysBetween(from, to).length >= RANGE_MAX_DAYS) from = addDays(today, -(RANGE_MAX_DAYS - 1));
    label = `\u0412\u0435\u0441\u044C \u043F\u0435\u0440\u0438\u043E\u0434: ${dateLabel(from)} - ${dateLabel(to)}`;
  } else if (isDayKey(key)) {
    from = to = key;
    label = dateLabel(key);
  } else {
    key = "t";
    label = `\u0421\u0435\u0433\u043E\u0434\u043D\u044F, ${dateLabel(today)}`;
  }
  if (key === "t") label = `\u0421\u0435\u0433\u043E\u0434\u043D\u044F, ${dateLabel(today)}`;
  return { key, from, to, days: daysBetween(from, to), label };
}
var inPeriod = (p, ms) => {
  const d = dayKeyOf(ms);
  return d >= p.from && d <= p.to;
};
function firstDataDay(ctx) {
  let min = Infinity;
  for (const s of ctx.store.subs.values()) min = Math.min(min, s.firstStartAt);
  const { leads } = readLeads(ctx);
  if (leads) for (const l of leads) min = Math.min(min, l.ts);
  return Number.isFinite(min) ? dayKeyOf(min) : void 0;
}
var esc2 = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var lab = (s, max = 40) => esc2(s.length > max ? s.slice(0, max - 1) + "\u2026" : s);
var pct = (part, whole) => whole > 0 ? Math.round(part * 100 / whole) : 0;
var inc = (m, k, n = 1) => void m.set(k, (m.get(k) || 0) + n);
var top = (m) => [...m.entries()].sort((a, b) => b[1] - a[1] || (String(a[0]) < String(b[0]) ? -1 : String(a[0]) > String(b[0]) ? 1 : 0));
function gather(ctx, p) {
  const { leads, error } = readLeads(ctx);
  const all = leads || [];
  const leadByEid = /* @__PURE__ */ new Map();
  for (const l of all) if (l.eventId) leadByEid.set(l.eventId, l);
  const linkedEids = /* @__PURE__ */ new Set();
  const newSubs = [];
  for (const s of ctx.store.subs.values()) {
    const o = classifyPayload(s.payload);
    if (o.eid) linkedEids.add(o.eid);
    if (inPeriod(p, s.firstStartAt)) newSubs.push(s);
  }
  const paths = ctx.store.paths();
  const ty = [];
  const seenTy = /* @__PURE__ */ new Set();
  for (const r of readJsonlCached(paths.ty).rows) {
    const day = String(r.day ?? "");
    if (!isDayKey(day) || day < p.from || day > p.to) continue;
    const ch = r.ch === "wa" ? "wa" : r.ch === "tg" ? "tg" : null;
    if (!ch) continue;
    const eid = String(r.eid ?? "");
    if (eid) {
      const k = `${day}|${ch}|${eid}`;
      if (seenTy.has(k)) continue;
      seenTy.add(k);
    }
    ty.push({ ch, eid, day, src: String(r.src ?? "") });
  }
  const sent = [];
  for (const r of readJsonlCached(paths.sent).rows) {
    const ts = Date.parse(String(r.ts ?? ""));
    if (Number.isFinite(ts) && inPeriod(p, ts) && typeof r.msg === "string") sent.push(r);
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
    blockedEvents
  };
}
var linked = (g, l) => !!l.eventId && g.linkedEids.has(l.eventId);
function assemble(head, sections, limit = MSG_LIMIT) {
  let out = head;
  for (const s of sections) {
    if (!s) continue;
    const next = `${out}

${s}`;
    if (next.length <= limit) {
      out = next;
      continue;
    }
    const room = limit - out.length - 40;
    if (room > 60) {
      const lines = [];
      let used = 0;
      for (const line of s.split("\n")) {
        if (used + line.length + 1 > room) break;
        lines.push(line);
        used += line.length + 1;
      }
      if (lines.length) out += `

${lines.join("\n")}`;
    }
    out += "\n(\u0447\u0430\u0441\u0442\u044C \u043E\u0442\u0447\u0451\u0442\u0430 \u043D\u0435 \u043F\u043E\u043C\u0435\u0441\u0442\u0438\u043B\u0430\u0441\u044C)";
    break;
  }
  return out;
}
function leadsLines(g) {
  if (!g.leadsOk) return [`<b>\u0417\u0430\u044F\u0432\u043A\u0438 \u0441 \u0441\u0430\u0439\u0442\u0430</b>: \u0437\u0430\u044F\u0432\u043A\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B (${lab(g.leadsError, 80)})`];
  const L = g.leads;
  const lines = [`<b>\u0417\u0430\u044F\u0432\u043A\u0438 \u0441 \u0441\u0430\u0439\u0442\u0430: ${L.length}</b>`];
  if (!L.length) return lines;
  if (g.p.days.length > 1) {
    const byDay = /* @__PURE__ */ new Map();
    for (const l of L) inc(byDay, l.day);
    const days = g.p.days.filter((d) => byDay.has(d));
    const shown = days.slice(-14);
    lines.push(`\u041F\u043E \u0434\u043D\u044F\u043C: ${shown.map((d) => `${ddmm(d)} ${byDay.get(d)}`).join(", ")}${days.length > shown.length ? ` (\u0438 \u0435\u0449\u0451 ${days.length - shown.length} \u0434\u043D.)` : ""}`);
  }
  const places = /* @__PURE__ */ new Map();
  for (const l of L) inc(places, l.place);
  lines.push(`\u041C\u0435\u0441\u0442\u043E \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435: ${top(places).map(([k, n]) => `${lab(k, 16)} ${n}`).join(", ")}`);
  const utm = /* @__PURE__ */ new Map();
  const none = /* @__PURE__ */ new Map();
  for (const l of L) hasUtm(l) ? inc(utm, utmLabel(l)) : inc(none, noUtmLabel(l));
  if (utm.size) {
    const t = top(utm);
    const shown = t.slice(0, 8);
    const rest = t.slice(8).reduce((s, [, n]) => s + n, 0);
    lines.push(`UTM: ${shown.map(([k, n]) => `${lab(k, 60)} ${n}`).join("; ")}${rest ? `; \u043F\u0440\u043E\u0447\u0438\u0435 ${rest}` : ""}`);
  }
  if (none.size) lines.push(`\u0411\u0435\u0437 UTM: ${top(none).map(([k, n]) => `${lab(k, 30)} ${n}`).join(", ")}`);
  return lines;
}
function botLines(g) {
  const N = g.newSubs;
  const lines = [`<b>\u0411\u043E\u0442: \u043D\u043E\u0432\u044B\u0445 \u043F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u043E\u0432 ${N.length}</b>`];
  if (!N.length && !g.leads.length) return lines;
  let pp = 0;
  let ty = 0;
  let direct = 0;
  const tags = /* @__PURE__ */ new Map();
  const viaUtm = /* @__PURE__ */ new Map();
  let notFound = 0;
  for (const s of N) {
    const o = classifyPayload(s.payload);
    if (o.kind === "pp") pp++;
    else if (o.kind === "ty") ty++;
    else if (o.kind === "direct") direct++;
    else inc(tags, o.tag);
    if (o.kind === "pp" || o.kind === "ty") {
      const lead = o.eid ? g.leadByEid.get(o.eid) : void 0;
      if (lead) inc(viaUtm, sourceCol(lead));
      else notFound++;
    }
  }
  if (N.length) {
    const parts = [`\u043E\u043A\u043D\u043E \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 ${pp}`, `\xAB\u0421\u043F\u0430\u0441\u0438\u0431\u043E\xBB ${ty}`, `\u043F\u0440\u044F\u043C\u043E\u0439 /start ${direct}`];
    if (tags.size) parts.push(`\u043C\u0435\u0442\u043A\u0438: ${top(tags).map(([k, n]) => `${lab(k, 20)} ${n}`).join(", ")}`);
    lines.push(`\u041E\u0442\u043A\u0443\u0434\u0430: ${parts.join(", ")}`);
    if (viaUtm.size || notFound) {
      const v = top(viaUtm).slice(0, 6).map(([k, n]) => `${lab(k, 24)} ${n}`);
      if (notFound && g.leadsOk) v.push(`\u0437\u0430\u044F\u0432\u043A\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430 ${notFound}`);
      if (v.length) lines.push(`\u041F\u043E UTM \u0437\u0430\u044F\u0432\u043A\u0438: ${v.join(", ")}`);
    }
  }
  if (g.leadsOk) {
    const reached = g.leads.filter((l) => linked(g, l)).length;
    lines.push(`\u0417\u0430\u044F\u0432\u043A\u0430 \u2192 \u0431\u043E\u0442: ${reached} \u0438\u0437 ${g.leads.length} (${pct(reached, g.leads.length)}%)`);
  }
  return lines;
}
function buttonsLines(g) {
  if (!g.ty.length) return [`<b>\u041A\u043D\u043E\u043F\u043A\u0438 \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u044F\u0432\u043A\u0438</b>: \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043D\u0430\u0436\u0430\u0442\u0438\u0439`];
  const cnt = (ch, src) => g.ty.filter((r) => r.ch === ch && (src === void 0 || r.src === src)).length;
  const hasSrc = g.ty.some((r) => r.src);
  const part = (ch, name) => `${name} ${cnt(ch)}${hasSrc ? ` (\u043E\u043A\u043D\u043E ${cnt(ch, "pp")}, \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 ${cnt(ch, "ty")})` : ""}`;
  return [`<b>\u041A\u043D\u043E\u043F\u043A\u0438 \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u044F\u0432\u043A\u0438</b>`, `${part("tg", "Telegram")}, ${part("wa", "WhatsApp")}`];
}
function streamLines(ctx, g) {
  const rows = [];
  for (const d of g.p.days) {
    const m = ctx.store.dayMetrics(d);
    if (!m.registered || !isStreamDay(d, ctx.cfg)) continue;
    rows.push(`${ddmm(d)}: \u0437\u0430\u043F\u0438\u0441\u0430\u043B\u0438\u0441\u044C ${m.registered}, \u043F\u0435\u0440\u0435\u0448\u043B\u0438 ${m.clicked} (${pct(m.clicked, m.registered)}%), \xAB\u042F \u0443\u0436\u0435 \u043E\u043F\u043B\u0430\u0442\u0438\u043B(\u0430)\xBB ${m.paid}`);
  }
  if (!rows.length) return [`<b>\u042D\u0444\u0438\u0440\u044B</b>: \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u043D\u0430 \u044D\u0444\u0438\u0440 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434 \u043D\u0435\u0442`];
  const shown = rows.slice(-10);
  return [`<b>\u042D\u0444\u0438\u0440\u044B</b>`, ...shown, ...rows.length > shown.length ? [`(\u0438 \u0435\u0449\u0451 ${rows.length - shown.length} \u0434\u043D.)`] : []];
}
function mailingLines(g) {
  const ok = g.sent.filter((e) => e.ok).length;
  const bad = g.sent.length - ok;
  const lines = [`<b>\u0420\u0430\u0441\u0441\u044B\u043B\u043A\u0430</b>: \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E ${ok}, \u043E\u0448\u0438\u0431\u043E\u043A ${bad}, \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043B\u0438 \u0431\u043E\u0442\u0430 ${g.blockedEvents}`];
  const per = /* @__PURE__ */ new Map();
  for (const e of g.sent) {
    const c = per.get(e.msg) || { ok: 0, bad: 0 };
    if (e.ok) c.ok++;
    else c.bad++;
    per.set(e.msg, c);
  }
  const rows = [...per.entries()].slice(0, 12).map(([id, c]) => `${lab(id, 24)} ${c.ok}${c.bad ? ` (\u043E\u0448\u0438\u0431\u043E\u043A ${c.bad})` : ""}`);
  if (rows.length) lines.push(rows.join(", "));
  return lines;
}
function adminKeyboard(period, screen) {
  return [
    [
      screen === "p" ? { text: "UTM \u043F\u043E \u0434\u043D\u044F\u043C", callback_data: `adm:u:${period}` } : { text: "\u041E\u0442\u0447\u0451\u0442", callback_data: `adm:p:${period}` },
      screen === "e" ? { text: "UTM \u043F\u043E \u0434\u043D\u044F\u043C", callback_data: `adm:u:${period}` } : { text: "\u041E\u0448\u0438\u0431\u043A\u0438", callback_data: `adm:e:${period}` }
    ],
    [
      { text: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C", callback_data: `adm:${screen}:${period}` },
      { text: "\u2190 \u041F\u0435\u0440\u0438\u043E\u0434", callback_data: "adm:m" }
    ]
  ];
}
function menuKeyboard() {
  return [
    [
      { text: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F", callback_data: "adm:p:t" },
      { text: "\u0412\u0447\u0435\u0440\u0430", callback_data: "adm:p:y" }
    ],
    [
      { text: "7 \u0434\u043D\u0435\u0439", callback_data: "adm:p:7" },
      { text: "30 \u0434\u043D\u0435\u0439", callback_data: "adm:p:30" }
    ],
    [{ text: "\u0414\u0430\u0442\u0430\u2026", callback_data: "adm:d" }]
  ];
}
function datePickerKeyboard(now) {
  const today = dayKeyOf(now);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, -i));
  const rows = [];
  for (let i = 0; i < days.length; i += 4) rows.push(days.slice(i, i + 4).map((d) => ({ text: ddmm(d), callback_data: `adm:p:${d}` })));
  rows.push([{ text: "\u0412\u0435\u0441\u044C \u043F\u0435\u0440\u0438\u043E\u0434", callback_data: "adm:p:all" }, { text: "\u2190 \u041F\u0435\u0440\u0438\u043E\u0434", callback_data: "adm:m" }]);
  return rows;
}
function parseAdminCb(data) {
  const m = /^adm:([puedm])(?::([A-Za-z0-9-]{1,10}))?$/.exec(data);
  if (!m) return null;
  const action = m[1];
  const period = m[2] || "t";
  if (action === "m" || action === "d") return { action, period: "t" };
  if (!["t", "y", "7", "30", "all"].includes(period) && !isDayKey(period)) return null;
  return { action, period };
}
function renderReport(ctx, periodKey) {
  const p = resolvePeriod(periodKey, ctx.now, periodKey === "all" ? firstDataDay(ctx) : void 0);
  const g = gather(ctx, p);
  return assemble(`<b>${lab(p.label, 80)}</b>`, [
    leadsLines(g).join("\n"),
    botLines(g).join("\n"),
    buttonsLines(g).join("\n"),
    streamLines(ctx, g).join("\n"),
    mailingLines(g).join("\n")
  ]);
}
function renderUtmByDay(ctx, periodKey) {
  const p = resolvePeriod(periodKey, ctx.now, periodKey === "all" ? firstDataDay(ctx) : void 0);
  const g = gather(ctx, p);
  const head = `<b>UTM \u043F\u043E \u0434\u043D\u044F\u043C, ${lab(p.label, 80)}</b>`;
  if (!g.leadsOk) return `${head}
\u0417\u0430\u044F\u0432\u043A\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B (${lab(g.leadsError, 80)}).`;
  const cells = /* @__PURE__ */ new Map();
  const total = /* @__PURE__ */ new Map();
  const cell = (day, col) => {
    const k = `${day}|${col}`;
    let c = cells.get(k);
    if (!c) cells.set(k, c = { leads: 0, bot: 0 });
    return c;
  };
  for (const l of g.leads) {
    const col = sourceCol(l);
    const c = cell(l.day, col);
    c.leads++;
    if (linked(g, l)) c.bot++;
    inc(total, col);
  }
  for (const s of g.newSubs) {
    const o = classifyPayload(s.payload);
    if (o.kind !== "tag") continue;
    cell(dayKeyOf(s.firstStartAt), o.tag).bot++;
    inc(total, o.tag);
  }
  if (!total.size) return `${head}
\u0417\u0430 \u043F\u0435\u0440\u0438\u043E\u0434 \u043D\u0435\u0442 \u0437\u0430\u044F\u0432\u043E\u043A \u0438 \u043F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u043E\u0432 \u0441 \u043C\u0435\u0442\u043A\u0430\u043C\u0438.`;
  const ranked = top(total).map(([k]) => k);
  const cols = ranked.slice(0, 4);
  const rest = ranked.slice(4);
  const zero = () => ({ leads: 0, bot: 0 });
  const add = (a, b) => ({ leads: a.leads + b.leads, bot: a.bot + b.bot });
  const colCell = (day, col) => col === null ? rest.reduce((a, k) => add(a, cells.get(`${day}|${k}`) || zero()), zero()) : cells.get(`${day}|${col}`) || zero();
  const keys = [...cols, ...rest.length ? [null] : []];
  const fmt = (c) => c.leads || c.bot ? `${c.leads}(${c.bot})` : ".";
  const header = ["\u0434\u0430\u0442\u0430", ...keys.map((k) => k === null ? "\u043F\u0440\u043E\u0447\u0438\u0435" : k.length > 12 ? k.slice(0, 11) + "\u2026" : k), "\u0432\u0441\u0435\u0433\u043E"];
  const table = p.days.map((d) => {
    const cs = keys.map((k) => colCell(d, k));
    return [ddmm(d), ...cs.map(fmt), fmt(cs.reduce(add, zero()))];
  });
  const foot = keys.map((k) => p.days.reduce((a, d) => add(a, colCell(d, k)), zero()));
  const footer = ["\u0438\u0442\u043E\u0433\u043E", ...foot.map(fmt), fmt(foot.reduce(add, zero()))];
  const note = "\u0432 \u0441\u043A\u043E\u0431\u043A\u0430\u0445 \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0438\u0437 \u043D\u0438\u0445 \u0434\u043E\u0448\u043B\u0438 \u0434\u043E \u0431\u043E\u0442\u0430; \u043C\u0435\u0442\u043A\u0438 \u0432\u0440\u043E\u0434\u0435 2gis \u0438\u0434\u0443\u0442 \u0441\u0440\u0430\u0437\u0443 \u0432 \u0431\u043E\u0442\u0430";
  const build = (from2) => {
    const rows = table.slice(from2);
    const w = header.map((h, i) => Math.max(h.length, footer[i].length, ...rows.map((r) => r[i].length)));
    const ln = (r) => r.map((c, i) => c.padEnd(w[i])).join("  ").trimEnd();
    const pre = [ln(header), ...rows.map(ln), ln(footer)].map(esc2).join("\n");
    const cut = from2 > 0 ? `
\u043F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 ${rows.length} \u0434\u043D. \u0438\u0437 ${table.length}` : "";
    return `${head}
${note}${cut}
<pre>${pre}</pre>`;
  };
  let from = 0;
  let text = build(from);
  while (text.length > MSG_LIMIT && from < table.length - 1) text = build(++from);
  return text;
}
function adminVersion() {
  try {
    return (0, import_node_fs4.readFileSync)((0, import_node_path4.join)(__dirname, "VERSION"), "utf8").trim() || "dev";
  } catch {
    return "dev";
  }
}
var uptimeText = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor(sec % 3600 / 60);
  return h >= 24 ? `${Math.floor(h / 24)} \u0434\u043D. ${h % 24} \u0447` : `${h} \u0447 ${m} \u043C\u0438\u043D`;
};
function renderErrors(ctx, periodKey) {
  const p = resolvePeriod(periodKey, ctx.now, periodKey === "all" ? firstDataDay(ctx) : void 0);
  const g = gather(ctx, p);
  const bad = g.sent.filter((e) => !e.ok);
  const parts = [];
  const head = `<b>\u041E\u0448\u0438\u0431\u043A\u0438, ${lab(p.label, 80)}</b>`;
  const groups = /* @__PURE__ */ new Map();
  for (const e of bad) inc(groups, String(e.err ?? "\u0431\u0435\u0437 \u0442\u0435\u043A\u0441\u0442\u0430").replace(/\d{5,}/g, "#").slice(0, 70));
  const failLines = [`<b>\u041D\u0435\u0443\u0434\u0430\u0447\u043D\u044B\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438: ${bad.length}</b> (\u0438\u0437 ${g.sent.length})`];
  if (groups.size) failLines.push(...top(groups).slice(0, 6).map(([k, n]) => `${n} x ${lab(k, 70)}`));
  parts.push(failLines.join("\n"));
  if (bad.length) {
    const last = [...bad].sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts)).slice(0, 10);
    parts.push(
      [`<b>\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 ${last.length}</b>`, ...last.map((e) => `${ddmm(dayKeyOf(Date.parse(e.ts)))} ${hhmmOf(Date.parse(e.ts))} ${lab(e.msg, 24)}: ${lab(String(e.err ?? ""), 50)}`)].join("\n")
    );
  }
  parts.push(`<b>\u0417\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043B\u0438 \u0431\u043E\u0442\u0430</b>: ${g.blockedEvents}`);
  const rt = runtime.events;
  const cntRt = (t) => rt.filter((e) => e.type === t).length;
  const skipped = rt.filter((e) => e.type === "skipLate");
  parts.push(
    [
      `<b>\u0421 \u0437\u0430\u043F\u0443\u0441\u043A\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430</b> (${uptimeText(Math.floor(process.uptime()))} \u043D\u0430\u0437\u0430\u0434, \u0441\u0447\u0451\u0442\u0447\u0438\u043A\u0438 \u0432 \u043F\u0430\u043C\u044F\u0442\u0438):`,
      `\u041F\u0440\u043E\u043F\u0443\u0441\u043A\u0438 \u043F\u043E \u043E\u043F\u043E\u0437\u0434\u0430\u043D\u0438\u044E \u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0449\u0438\u043A\u0430: ${skipped.length}${skipped.length ? ` (${[...new Set(skipped.map((e) => e.msg || "?"))].slice(0, 6).map((x) => lab(x, 20)).join(", ")})` : ""}`,
      `\u041C\u0435\u0434\u0438\u0430 \u0437\u0430\u043C\u0435\u043D\u0435\u043D\u043E \u0442\u0435\u043A\u0441\u0442\u043E\u043C: ${cntRt("mediaFallback")}`,
      `\u0421\u0431\u043E\u0438 \u0442\u0438\u043A\u043E\u0432 \u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0449\u0438\u043A\u0430: ${cntRt("tickError")}`,
      `\u041E\u0442\u043A\u0430\u0437\u044B \u0432\u0435\u0431\u0445\u0443\u043A\u0430 \u043F\u043E \u0441\u0435\u043A\u0440\u0435\u0442\u0443: ${runtime.webhookRejected}`
    ].join("\n")
  );
  parts.push(`\u0412\u0435\u0440\u0441\u0438\u044F: ${lab(ctx.version ?? adminVersion(), 40)}, \u043F\u0440\u043E\u0446\u0435\u0441\u0441 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 ${uptimeText(Math.floor(process.uptime()))}`);
  return assemble(head, parts);
}
function renderDailyReport(ctx, day) {
  const p = resolvePeriod(day, ctx.now);
  const g = gather(ctx, p);
  const lines = [`<b>\u0418\u0442\u043E\u0433\u0438 \u0437\u0430 ${day === addDays(dayKeyOf(ctx.now), -1) ? "\u0432\u0447\u0435\u0440\u0430, " : ""}${dateLabel(day)}</b>`];
  if (!g.leadsOk) lines.push("\u0417\u0430\u044F\u0432\u043A\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B.");
  else {
    const utm = /* @__PURE__ */ new Map();
    for (const l of g.leads) inc(utm, hasUtm(l) ? utmLabel(l) : `\u0431\u0435\u0437 UTM: ${noUtmLabel(l)}`);
    const t = top(utm).slice(0, 3).map(([k, n]) => `${lab(k, 56)} ${n}`);
    lines.push(`\u0417\u0430\u044F\u0432\u043E\u043A: ${g.leads.length}${t.length ? `. \u0422\u043E\u043F UTM: ${t.join("; ")}` : ""}`);
  }
  const N = g.newSubs;
  const tags = /* @__PURE__ */ new Map();
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
    `\u0412 \u0431\u043E\u0442\u0435 \u043D\u043E\u0432\u044B\u0445: ${N.length} (\u043E\u043A\u043D\u043E ${pp}, \xAB\u0421\u043F\u0430\u0441\u0438\u0431\u043E\xBB ${ty}, \u043F\u0440\u044F\u043C\u043E\u0439 ${direct}${tags.size ? `, ${top(tags).slice(0, 4).map(([k, n]) => `${lab(k, 16)} ${n}`).join(", ")}` : ""})${g.leadsOk ? `. \u0417\u0430\u044F\u0432\u043A\u0430 \u2192 \u0431\u043E\u0442: ${reached} \u0438\u0437 ${g.leads.length} (${pct(reached, g.leads.length)}%)` : ""}`
  );
  const tg = g.ty.filter((r) => r.ch === "tg").length;
  const wa = g.ty.filter((r) => r.ch === "wa").length;
  lines.push(`\u041A\u043D\u043E\u043F\u043A\u0438 \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u044F\u0432\u043A\u0438: Telegram ${tg}, WhatsApp ${wa}`);
  const m = ctx.store.dayMetrics(day);
  if (m.registered) lines.push(`\u042D\u0444\u0438\u0440: \u0437\u0430\u043F\u0438\u0441\u0430\u043B\u0438\u0441\u044C ${m.registered}, \u043F\u0435\u0440\u0435\u0448\u043B\u0438 ${m.clicked} (${pct(m.clicked, m.registered)}%), \xAB\u042F \u0443\u0436\u0435 \u043E\u043F\u043B\u0430\u0442\u0438\u043B(\u0430)\xBB ${m.paid}`);
  const ok = g.sent.filter((e) => e.ok).length;
  const bad = g.sent.length - ok;
  lines.push(`\u0420\u0430\u0441\u0441\u044B\u043B\u043A\u0430: \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E ${ok}, \u043E\u0448\u0438\u0431\u043E\u043A ${bad}, \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043B\u0438 \u0431\u043E\u0442\u0430 ${g.blockedEvents}`);
  if (bad) {
    const groups = /* @__PURE__ */ new Map();
    for (const e of g.sent) if (!e.ok) inc(groups, String(e.err ?? "\u0431\u0435\u0437 \u0442\u0435\u043A\u0441\u0442\u0430").replace(/\d{5,}/g, "#").slice(0, 60));
    const [k, n] = top(groups)[0];
    lines.push(`\u0427\u0430\u0449\u0435 \u0432\u0441\u0435\u0433\u043E: ${n} x ${lab(k, 60)}`);
  } else lines.push("\u041E\u0448\u0438\u0431\u043E\u043A \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u043D\u0435\u0442.");
  return assemble(lines[0], [lines.slice(1).join("\n")]);
}
function dailyKeyboard(day) {
  return [[{ text: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435", callback_data: `adm:p:${day}` }, { text: "\u041E\u0448\u0438\u0431\u043A\u0438", callback_data: `adm:e:${day}` }]];
}

// form-api/tg-workshop.ts
var env = (k) => (process.env[k] || "").trim();
var botToken = () => env("TG_WORKSHOP_BOT_TOKEN");
var webhookSecret = () => env("TG_WORKSHOP_WEBHOOK_SECRET");
var goSecret = () => env("TG_GO_SECRET");
var ownerIds = () => env("TG_LINK_OWNER_IDS").split(",").map((s) => s.trim()).filter(Boolean);
var botOff = () => env("TG_BOT").toLowerCase() === "off";
var apiBase = () => env("TG_API_BASE").replace(/\/+$/, "") || "https://api.telegram.org";
function isOwner(userId) {
  const ids = ownerIds();
  return userId !== void 0 && ids.length > 0 && ids.includes(String(userId));
}
var GO_BASE = "https://onai.academy/workshop/api/go";
var MAX_UPDATE_BODY = 64 * 1024;
var API_TIMEOUT_MS = 1e4;
var DEFAULT_BIZON = "https://start.bizon365.ru/room/196985/BguY0kXF-l";
var DEFAULT_REJOIN_ACK = "\u0413\u043E\u0442\u043E\u0432\u043E, \u0441\u0441\u044B\u043B\u043A\u0443 \u043F\u0440\u0438\u0448\u043B\u044E \u0441\u044E\u0434\u0430 \u0432 19:50.";
var OTHER_THROTTLE_MS = 10 * 6e4;
var SEEN_UPDATES = 1e3;
var AUDIENCES = ["all", "clicked", "notClicked", "notPaid"];
var LINK_KEYS = ["bizon", "manager", "managerName", "whatsapp", "whatsappPhone", "pay", "prepayKz", "prepayIntl", "cases", "game", "template"];
var TEXT_VARS = ["hi", "dayWord", "dayWordLower", "TEMPLATE"];
var URL_VARS = ["STREAM", "PAY", "PREPAY_KZ", "PREPAY_INTL", "MANAGER", "CASES", "GAME", "WHATSAPP_TEMPLATE"];
var HTML_TAGS = /* @__PURE__ */ new Set(["b", "strong", "i", "em", "u", "ins", "s", "strike", "del", "code", "pre", "a", "tg-spoiler", "blockquote"]);
function isObj(x) {
  return !!x && typeof x === "object" && !Array.isArray(x);
}
function allStrings(x, out = []) {
  if (typeof x === "string") out.push(x);
  else if (Array.isArray(x)) x.forEach((v) => allStrings(v, out));
  else if (isObj(x)) Object.values(x).forEach((v) => allStrings(v, out));
  return out;
}
function checkHtml(s, where) {
  const stack = [];
  const re = /<(\/?)([A-Za-z][\w-]*)[^<>]*>|<|&(?!#?\w+;)/g;
  let m;
  while (m = re.exec(s)) {
    if (m[0] === "<") throw new Error(`${where}: \u043B\u0438\u0448\u043D\u0438\u0439 \u0441\u0438\u043C\u0432\u043E\u043B < (\u044D\u043A\u0440\u0430\u043D\u0438\u0440\u0443\u0439 \u043A\u0430\u043A &lt;)`);
    if (m[0] === "&") throw new Error(`${where}: \u0433\u043E\u043B\u044B\u0439 & (\u043F\u0438\u0448\u0438 &amp;)`);
    const name = m[2].toLowerCase();
    if (!HTML_TAGS.has(name)) throw new Error(`${where}: \u0442\u0435\u0433 <${name}> Telegram \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442`);
    if (m[1] === "/") {
      if (stack.pop() !== name) throw new Error(`${where}: \u0442\u0435\u0433 </${name}> \u0437\u0430\u043A\u0440\u044B\u0442 \u043D\u0435 \u0442\u0430\u043C`);
    } else stack.push(name);
  }
  if (stack.length) throw new Error(`${where}: \u043D\u0435 \u0437\u0430\u043A\u0440\u044B\u0442 \u0442\u0435\u0433 <${stack[stack.length - 1]}>`);
}
function checkText(s, where) {
  if (typeof s !== "string" || !s) throw new Error(`${where}: \u043D\u0443\u0436\u0435\u043D \u043D\u0435\u043F\u0443\u0441\u0442\u043E\u0439 \u0442\u0435\u043A\u0441\u0442`);
  for (const m of s.matchAll(/\{(\w+)\}/g)) {
    if (!TEXT_VARS.includes(m[1])) throw new Error(`${where}: \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043F\u043E\u0434\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 {${m[1]}}`);
  }
  checkHtml(s, where);
}
function checkMedia(m, where) {
  if (!isObj(m) || m.type !== "photo" && m.type !== "video" || typeof m.url !== "string" || !/^https:\/\//.test(m.url)) {
    throw new Error(`${where}: media \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C { type: photo|video, url: https://... }`);
  }
  if (m.poster !== void 0 && typeof m.poster !== "string") throw new Error(`${where}: poster \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0441\u0442\u0440\u043E\u043A\u043E\u0439`);
  for (const k of ["width", "height", "duration"]) {
    if (m[k] !== void 0 && (typeof m[k] !== "number" || m[k] <= 0)) throw new Error(`${where}: ${k} \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043F\u043E\u043B\u043E\u0436\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u043C \u0447\u0438\u0441\u043B\u043E\u043C`);
  }
}
function checkButtons(b, where) {
  if (b === void 0) return;
  if (!Array.isArray(b)) throw new Error(`${where}: buttons \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0430\u0441\u0441\u0438\u0432\u043E\u043C \u0440\u044F\u0434\u043E\u0432`);
  for (const row of b) {
    if (!Array.isArray(row)) throw new Error(`${where}: \u0440\u044F\u0434 \u043A\u043D\u043E\u043F\u043E\u043A \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0430\u0441\u0441\u0438\u0432\u043E\u043C`);
    for (const btn of row) {
      if (!isObj(btn) || typeof btn.text !== "string" || !btn.text) throw new Error(`${where}: \u0443 \u043A\u043D\u043E\u043F\u043A\u0438 \u043D\u0435\u0442 text`);
      const hasUrl = typeof btn.url === "string";
      const hasCb = typeof btn.callback === "string";
      if (hasUrl === hasCb) throw new Error(`${where}: \u0443 \u043A\u043D\u043E\u043F\u043A\u0438 \xAB${btn.text}\xBB \u043D\u0443\u0436\u0435\u043D \u0440\u043E\u0432\u043D\u043E \u043E\u0434\u0438\u043D \u0438\u0437 url \u0438\u043B\u0438 callback`);
      if (hasCb && (!btn.callback || Buffer.byteLength(btn.callback) > 64)) throw new Error(`${where}: callback \u043A\u043D\u043E\u043F\u043A\u0438 \xAB${btn.text}\xBB \u0434\u043B\u0438\u043D\u043D\u0435\u0435 64 \u0431\u0430\u0439\u0442`);
      if (hasUrl) {
        const url = btn.url;
        for (const m of url.matchAll(/\{(\w+)\}/g)) {
          if (!URL_VARS.includes(m[1])) throw new Error(`${where}: \u0443 \u043A\u043D\u043E\u043F\u043A\u0438 \xAB${btn.text}\xBB \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043F\u043E\u0434\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430 {${m[1]}}`);
        }
        if (!/\{\w+\}/.test(url) && !/^https:\/\/\S+$/.test(url)) throw new Error(`${where}: \u0443 \u043A\u043D\u043E\u043F\u043A\u0438 \xAB${btn.text}\xBB \u0430\u0434\u0440\u0435\u0441 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C https`);
      }
    }
  }
}
function validateSeries(raw) {
  if (!isObj(raw)) throw new Error("\u0441\u0435\u0440\u0438\u044F: \u043A\u043E\u0440\u0435\u043D\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u043C");
  for (const s of allStrings(raw)) {
    if (s.includes(String.fromCharCode(8212))) throw new Error(`\u0441\u0435\u0440\u0438\u044F: \u0434\u043B\u0438\u043D\u043D\u043E\u0435 \u0442\u0438\u0440\u0435 \u0432 \xAB${s.slice(0, 50)}\xBB`);
  }
  if (raw.timezone !== "Asia/Almaty") throw new Error("\u0441\u0435\u0440\u0438\u044F: timezone \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C Asia/Almaty");
  if (typeof raw.version !== "string") throw new Error("\u0441\u0435\u0440\u0438\u044F: \u043D\u0435\u0442 version");
  if (raw.utcOffsetMinutes !== void 0 && (!Number.isInteger(raw.utcOffsetMinutes) || Math.abs(raw.utcOffsetMinutes) > 14 * 60)) {
    throw new Error("\u0441\u0435\u0440\u0438\u044F: utcOffsetMinutes \u0446\u0435\u043B\u043E\u0435 \u0447\u0438\u0441\u043B\u043E \u043C\u0438\u043D\u0443\u0442 (300 \u0434\u043B\u044F \u0410\u043B\u043C\u0430\u0442\u044B)");
  }
  if (raw.firstDay !== void 0 && !isDayKey(raw.firstDay)) throw new Error("\u0441\u0435\u0440\u0438\u044F: firstDay \u0432\u0438\u0434\u0430 YYYY-MM-DD");
  if (raw.skipDays !== void 0 && (!Array.isArray(raw.skipDays) || !raw.skipDays.every(isDayKey))) throw new Error("\u0441\u0435\u0440\u0438\u044F: skipDays \u043C\u0430\u0441\u0441\u0438\u0432 \u0434\u043D\u0435\u0439 YYYY-MM-DD");
  if (typeof raw.streamStart !== "string" || !/^\d{1,2}:\d{2}$/.test(raw.streamStart)) throw new Error("\u0441\u0435\u0440\u0438\u044F: streamStart \u0432\u0438\u0434\u0430 HH:MM");
  try {
    parseHHMM(raw.streamStart);
  } catch {
    throw new Error("\u0441\u0435\u0440\u0438\u044F: streamStart \u043D\u0435 \u0432\u0440\u0435\u043C\u044F");
  }
  if (typeof raw.streamMinutes !== "number" || raw.streamMinutes <= 0) throw new Error("\u0441\u0435\u0440\u0438\u044F: streamMinutes \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0447\u0438\u0441\u043B\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u0435 0");
  if (raw.joinLiveMinutes !== void 0 && (typeof raw.joinLiveMinutes !== "number" || raw.joinLiveMinutes < 0)) throw new Error("\u0441\u0435\u0440\u0438\u044F: joinLiveMinutes \u0447\u0438\u0441\u043B\u043E \u043C\u0438\u043D\u0443\u0442");
  if (typeof raw.graceMinutes !== "number" || raw.graceMinutes < 0) throw new Error("\u0441\u0435\u0440\u0438\u044F: graceMinutes \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0447\u0438\u0441\u043B\u043E\u043C");
  if (raw.adminDailyReportAt !== void 0) {
    try {
      if (typeof raw.adminDailyReportAt !== "string") throw new Error("not a string");
      parseHHMM(raw.adminDailyReportAt);
    } catch {
      throw new Error("\u0441\u0435\u0440\u0438\u044F: adminDailyReportAt \u0432\u0438\u0434\u0430 HH:MM");
    }
  }
  if (!isObj(raw.links)) throw new Error("\u0441\u0435\u0440\u0438\u044F: \u043D\u0435\u0442 links");
  for (const k of LINK_KEYS) {
    if (typeof raw.links[k] !== "string") throw new Error(`\u0441\u0435\u0440\u0438\u044F: links.${k} \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0441\u0442\u0440\u043E\u043A\u043E\u0439`);
  }
  if (!/^https:\/\//.test(raw.links.bizon)) throw new Error("\u0441\u0435\u0440\u0438\u044F: links.bizon \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C https-\u0441\u0441\u044B\u043B\u043A\u043E\u0439");
  const w = raw.welcome;
  if (!isObj(w)) throw new Error("\u0441\u0435\u0440\u0438\u044F: \u043D\u0435\u0442 welcome");
  checkMedia(w.media, "welcome");
  for (const k of ["before", "live", "stop", "other", "paidAck"]) checkText(w[k], `welcome.${k}`);
  for (const k of ["lateToday", "rejoinAck"]) if (w[k] !== void 0) checkText(w[k], `welcome.${k}`);
  checkButtons(w.liveButtons, "welcome.liveButtons");
  if (!Array.isArray(raw.messages)) throw new Error("\u0441\u0435\u0440\u0438\u044F: messages \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043C\u0430\u0441\u0441\u0438\u0432\u043E\u043C");
  const ids = /* @__PURE__ */ new Set();
  for (const m of raw.messages) {
    if (!isObj(m) || typeof m.id !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(m.id)) throw new Error("\u0441\u0435\u0440\u0438\u044F: \u0443 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043D\u0443\u0436\u0435\u043D id \u0438\u0437 \u0431\u0443\u043A\u0432, \u0446\u0438\u0444\u0440, _ \u0438 - (\u0434\u043E 40 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432)");
    if (ids.has(m.id)) throw new Error(`\u0441\u0435\u0440\u0438\u044F: id \xAB${m.id}\xBB \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442\u0441\u044F`);
    ids.add(m.id);
    const where = `\u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 ${m.id}`;
    if (typeof m.at !== "string" || !/^\d{1,2}:\d{2}$/.test(m.at)) throw new Error(`${where}: at \u0432\u0438\u0434\u0430 HH:MM`);
    try {
      parseHHMM(m.at);
    } catch {
      throw new Error(`${where}: at \u043D\u0435 \u0432\u0440\u0435\u043C\u044F`);
    }
    if (typeof m.audience !== "string" || !AUDIENCES.includes(m.audience)) throw new Error(`${where}: audience \u0438\u0437 ${AUDIENCES.join(", ")}`);
    checkText(m.text, where);
    if (m.dayOffset !== void 0 && (!Number.isInteger(m.dayOffset) || m.dayOffset < 0 || m.dayOffset > 3)) {
      throw new Error(`${where}: dayOffset \u0446\u0435\u043B\u043E\u0435 \u043E\u0442 0 \u0434\u043E 3`);
    }
    if (m.enabled !== void 0 && typeof m.enabled !== "boolean") throw new Error(`${where}: enabled \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C true \u0438\u043B\u0438 false`);
    if (m.silent !== void 0 && typeof m.silent !== "boolean") throw new Error(`${where}: silent \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C true \u0438\u043B\u0438 false`);
    if (m.essential !== void 0 && typeof m.essential !== "boolean") throw new Error(`${where}: essential \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C true \u0438\u043B\u0438 false`);
    if (m.media !== void 0) checkMedia(m.media, where);
    checkButtons(m.buttons, where);
  }
  return raw;
}
function seriesWarnings(sr) {
  const out = [];
  const ctx = { series: sr, now: Date.now(), chatId: 1, firstName: "\u0416".repeat(64), day: dayKeyOf(Date.now()) };
  const check = (id, c) => {
    const n = visibleLength(expandText(c.text, ctx));
    if (c.media && n > 1024) out.push(`${id}: \u043F\u043E\u0434\u043F\u0438\u0441\u044C \u0441 \u0434\u043B\u0438\u043D\u043D\u044B\u043C \u0438\u043C\u0435\u043D\u0435\u043C ${n} \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432, \u0431\u043E\u043B\u044C\u0448\u0435 1024, \u0443\u0439\u0434\u0451\u0442 \u0434\u0432\u0443\u043C\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F\u043C\u0438 (\u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0430 \u0438 \u0442\u0435\u043A\u0441\u0442)`);
    if (n > 4096) out.push(`${id}: \u0442\u0435\u043A\u0441\u0442 ${n} \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432, \u0431\u043E\u043B\u044C\u0448\u0435 4096, Telegram \u043D\u0435 \u043F\u0440\u0438\u043C\u0435\u0442`);
  };
  check("welcome.before", { media: sr.welcome.media, text: sr.welcome.before });
  for (const m of sr.messages) check(m.id, m);
  return out;
}
var store = null;
var series = null;
var botError = "";
function getStore() {
  if (!store) throw new Error("tg-workshop \u043D\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D (initTgWorkshop)");
  return store;
}
function getSeries() {
  if (!series) throw new Error("\u0441\u0435\u0440\u0438\u044F \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430");
  return series;
}
var botEnabled = () => !botOff() && !!series && !!store;
var botConfigured = () => !!botToken() && !!webhookSecret() && !!goSecret();
var timeCfg = (s) => ({
  streamStart: s.streamStart,
  streamMinutes: s.streamMinutes,
  joinLiveMinutes: s.joinLiveMinutes ?? DEFAULT_JOIN_MINUTES,
  firstDay: s.firstDay,
  skipDays: s.skipDays
});
function applyOverrides(sr, ov) {
  return {
    ...sr,
    messages: sr.messages.map((m) => {
      const o = ov[m.id];
      if (!o) return m;
      return { ...m, ...o.at ? { at: o.at } : {}, ...o.enabled !== void 0 ? { enabled: o.enabled } : {} };
    })
  };
}
function activeSeries() {
  return applyOverrides(getSeries(), getStore().state.overrides);
}
function seriesPath(explicit) {
  return explicit || env("TG_SERIES_FILE") || (0, import_node_path5.join)(__dirname, "tg-series.json");
}
function reloadSeries(explicit) {
  const loaded = validateSeries(JSON.parse((0, import_node_fs5.readFileSync)(seriesPath(explicit), "utf8")));
  series = loaded;
  botError = "";
  setUtcOffsetMinutes(loaded.utcOffsetMinutes ?? 300);
  return { version: loaded.version, count: loaded.messages.length, warnings: seriesWarnings(loaded) };
}
function initTgWorkshop(opts = {}) {
  series = null;
  botError = "";
  store = new TgStore(opts.dir || env("DATA_DIR") || (0, import_node_path5.join)(__dirname, "data"));
  if (botOff()) {
    botError = "off";
    console.log("[tg] TG_BOT=off: \u0431\u043E\u0442 \u0438 \u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0449\u0438\u043A \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u044B");
    return store;
  }
  try {
    const r = reloadSeries(opts.seriesFile);
    console.log("[tg] \u0441\u0435\u0440\u0438\u044F %s, \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 %d", r.version, r.count);
    for (const w of r.warnings) console.warn("[tg] \u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435: %s", w);
  } catch (e) {
    botError = e.message;
    console.error("[tg] \u0441\u0435\u0440\u0438\u044F \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430, \u0431\u043E\u0442 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D: %s", botError);
  }
  return store;
}
function tgHealth() {
  return {
    configured: botEnabled() && botConfigured(),
    seriesEnabled: store?.state.seriesEnabled ?? false,
    subscribers: store?.subs.size ?? 0,
    ...botError ? { error: botError } : {}
  };
}
var CONNECT_FAIL_CODES = /* @__PURE__ */ new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH", "UND_ERR_CONNECT_TIMEOUT"]);
var scrub = (s) => {
  const t = botToken();
  return t ? s.split(t).join("***") : s;
};
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function botCall(method, params, timeoutMs = API_TIMEOUT_MS) {
  const token = botToken();
  if (!token) return { ok: false, code: 0, description: "no_token" };
  try {
    const init = params instanceof FormData ? { method: "POST", body: params } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) };
    const res = await fetch(`${apiBase()}/bot${token}/${method}`, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    const data = await res.json().catch(() => null);
    if (data?.ok) return { ok: true, result: data.result };
    return {
      ok: false,
      code: data?.error_code ?? res.status,
      description: scrub(String(data?.description ?? res.statusText)),
      retryAfter: data?.parameters?.retry_after
    };
  } catch (e) {
    const err = e;
    const timeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    return {
      ok: false,
      code: 0,
      description: timeout ? "timeout" : scrub(String(err?.message || err)),
      ...!timeout && err?.cause?.code && CONNECT_FAIL_CODES.has(err.cause.code) ? { connectFail: true } : {}
    };
  }
}
var MIN_GAP_MS = 50;
var waitHi = [];
var waitLo = [];
var pumping = false;
var lastCallAt = 0;
var pausedUntil = 0;
function acquireSlot(prio) {
  return new Promise((resolve) => {
    (prio === "hi" ? waitHi : waitLo).push(resolve);
    void pump();
  });
}
async function pump() {
  if (pumping) return;
  pumping = true;
  try {
    while (waitHi.length || waitLo.length) {
      const wait = Math.max(lastCallAt + MIN_GAP_MS, pausedUntil) - Date.now();
      if (wait > 0) {
        await sleep(wait);
        continue;
      }
      const next = waitHi.shift() ?? waitLo.shift();
      lastCallAt = Date.now();
      next?.();
    }
  } finally {
    pumping = false;
  }
}
function pauseAll(seconds) {
  pausedUntil = Math.max(pausedUntil, Date.now() + Math.min(60, Math.max(0, seconds)) * 1e3 + 250);
}
async function botSend(method, params, prio = "hi", opts = {}) {
  let netRetried = false;
  let r = { ok: false, code: 0, description: "not_sent" };
  for (let attempt = 0; attempt < 4; attempt++) {
    await acquireSlot(prio);
    r = await botCall(method, params, opts.timeoutMs);
    if (r.ok) return r;
    if (r.code === 429) {
      pauseAll(r.retryAfter ?? 1);
      continue;
    }
    if (r.code === 0 && !netRetried && r.description !== "timeout" && (opts.retryNet === "connect" ? r.connectFail : true)) {
      netRetried = true;
      continue;
    }
    break;
  }
  return r;
}
var mediaTimeout = () => Number(env("TG_MEDIA_TIMEOUT_MS")) || 6e4;
var toSend = (r) => r.ok ? { ok: true } : { ok: false, code: r.code, error: `${r.code} ${r.description}` };
function isGone(r) {
  return !r.ok && (r.code === 403 || r.code === 400 && /chat not found/i.test(r.error || ""));
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function visibleLength(html) {
  return html.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").length;
}
function goUrl(chatId, day) {
  const t = makeGoToken(chatId, day);
  return t ? `${GO_BASE}/${t}` : "";
}
function textVars(ctx) {
  const name = (ctx.firstName || "").replace(/\s+/g, " ").trim().slice(0, 64);
  return {
    hi: name ? `\u041F\u0440\u0438\u0432\u0435\u0442, ${name}!` : "\u041F\u0440\u0438\u0432\u0435\u0442!",
    dayWord: dayWord(ctx.day, ctx.now),
    dayWordLower: dayWordLower(ctx.day, ctx.now),
    TEMPLATE: ctx.series.links.template
  };
}
function expandText(tpl, ctx) {
  const vars = textVars(ctx);
  return tpl.replace(/\{(\w+)\}/g, (m, k) => Object.prototype.hasOwnProperty.call(vars, k) ? escapeHtml(vars[k]) : m);
}
function urlVars(ctx) {
  const l = ctx.series.links;
  const pv = (v) => v || (ctx.preview ? l.manager : "");
  return {
    STREAM: goUrl(ctx.chatId, ctx.liveDay ?? ctx.day),
    PAY: pv(l.pay),
    PREPAY_KZ: pv(l.prepayKz),
    PREPAY_INTL: pv(l.prepayIntl),
    MANAGER: l.manager,
    CASES: l.cases,
    GAME: l.game,
    WHATSAPP_TEMPLATE: l.whatsapp ? `${l.whatsapp}?text=${encodeURIComponent(l.template)}` : ""
  };
}
function expandUrl(url, ctx) {
  const vars = urlVars(ctx);
  const out = url.replace(/\{(\w+)\}/g, (m, k) => Object.prototype.hasOwnProperty.call(vars, k) ? vars[k] : m).trim();
  return /^https?:\/\/[^\s{}]+$/i.test(out) ? out : "";
}
function buildKeyboard(rows, ctx) {
  if (!rows) return void 0;
  const out = [];
  for (const row of rows) {
    const r = [];
    for (const b of row) {
      if (b.callback) {
        r.push({ text: b.text, callback_data: b.callback });
        continue;
      }
      const url = b.url ? expandUrl(b.url, ctx) : "";
      if (url) r.push({ text: b.text, url });
    }
    if (r.length) out.push(r);
  }
  return out.length ? out : void 0;
}
var signGo = (payload, secret) => (0, import_node_crypto3.createHmac)("sha256", secret).update(payload).digest("base64url").slice(0, 12);
function makeGoToken(chatId, day, secret = goSecret()) {
  if (!secret) return "";
  const payload = `${chatId}:${day}`;
  return `${Buffer.from(payload).toString("base64url")}.${signGo(payload, secret)}`;
}
function verifyGoToken(token, secret = goSecret()) {
  if (!secret || typeof token !== "string" || token.length > 200) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const payload = Buffer.from(token.slice(0, dot), "base64url").toString("utf8");
  const m = /^(-?\d{1,15}):(\d{4}-\d{2}-\d{2})$/.exec(payload);
  if (!m || !isDayKey(m[2])) return null;
  const given = Buffer.from(token.slice(dot + 1));
  const want = Buffer.from(signGo(payload, secret));
  if (given.length !== want.length || !(0, import_node_crypto3.timingSafeEqual)(given, want)) return null;
  return { chatId: Number(m[1]), day: m[2] };
}
function largest(sizes) {
  if (!Array.isArray(sizes) || !sizes.length) return void 0;
  return sizes.reduce((a, b) => (b.width ?? 0) * (b.height ?? 0) >= (a.width ?? 0) * (a.height ?? 0) ? b : a).file_id;
}
async function sendText(chatId, html, markup, silent, prio = "hi") {
  return toSend(
    await botSend(
      "sendMessage",
      {
        chat_id: chatId,
        text: html,
        parse_mode: "HTML",
        // Telegram сам открывает ссылки и портит учёт переходов: превью выключено везде.
        link_preview_options: { is_disabled: true },
        ...markup ? { reply_markup: { inline_keyboard: markup } } : {},
        ...silent ? { disable_notification: true } : {}
      },
      prio
    )
  );
}
async function sendMedia(chatId, media, caption, markup, silent, prio) {
  const st = getStore();
  const isVideo = media.type === "video";
  const method = isVideo ? "sendVideo" : "sendPhoto";
  const field = isVideo ? "video" : "photo";
  const cachedRef = st.getMedia(media.url);
  const cachedCover = isVideo && media.poster ? st.getMedia(media.poster) : void 0;
  const attempts = [[cachedRef ?? media.url, cachedCover ?? media.poster]];
  if (cachedRef || cachedCover) attempts.push([media.url, media.poster]);
  if (isVideo && media.poster) attempts.push([media.url, void 0]);
  let r = { ok: false, code: 0, description: "not_sent" };
  let used = attempts[0];
  for (const a of attempts) {
    used = a;
    const params = { chat_id: chatId, [field]: a[0] };
    if (caption) {
      params.caption = caption;
      params.parse_mode = "HTML";
    }
    if (markup) params.reply_markup = { inline_keyboard: markup };
    if (silent) params.disable_notification = true;
    if (isVideo) {
      params.supports_streaming = true;
      if (media.width) params.width = media.width;
      if (media.height) params.height = media.height;
      if (media.duration) params.duration = media.duration;
      if (a[1]) params.cover = a[1];
    }
    const byUrl = /^https?:\/\//.test(a[0]);
    r = await botSend(method, params, prio, { retryNet: "connect", ...byUrl ? { timeoutMs: mediaTimeout() } : {} });
    if (r.ok || r.code !== 400) break;
  }
  if (r.ok) {
    if (used[0] === media.url) {
      const id = isVideo ? r.result?.video?.file_id : largest(r.result?.photo);
      if (id) st.setMedia(media.url, id);
    }
    if (isVideo && media.poster && used[1] === media.poster) {
      const cover = largest(r.result?.video?.cover);
      if (cover) st.setMedia(media.poster, cover);
    }
  }
  return toSend(r);
}
async function plain(chatId, text, markup) {
  return toSend(
    await botSend("sendMessage", {
      chat_id: chatId,
      text: text.slice(0, 4e3),
      link_preview_options: { is_disabled: true },
      ...markup ? { reply_markup: { inline_keyboard: markup } } : {}
    })
  );
}
async function notifyOwners(text) {
  let delivered = 0;
  for (const id of ownerIds()) {
    const n = Number(id);
    if (Number.isFinite(n) && (await plain(n, text)).ok) delivered++;
  }
  return delivered;
}
async function notifyOwnersHtml(text, markup) {
  let delivered = 0;
  for (const id of ownerIds()) {
    const n = Number(id);
    if (Number.isFinite(n) && (await sendText(n, text, markup)).ok) delivered++;
  }
  return delivered;
}
var mediaWarned = /* @__PURE__ */ new Set();
async function warnMedia(url, error) {
  if (mediaWarned.has(url)) return;
  mediaWarned.add(url);
  await notifyOwners(`\u041D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u043B\u0430\u0441\u044C \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0430 \u0438\u043B\u0438 \u0432\u0438\u0434\u0435\u043E ${url}: ${error || "\u043E\u0448\u0438\u0431\u043A\u0430"}. \u0428\u043B\u044E \u0442\u043E\u0442 \u0436\u0435 \u0442\u0435\u043A\u0441\u0442 \u0431\u0435\u0437 \u043D\u0435\u0451. \u041F\u0440\u043E\u0432\u0435\u0440\u044C, \u0447\u0442\u043E \u0444\u0430\u0439\u043B \u0432\u044B\u043B\u043E\u0436\u0435\u043D \u043D\u0430 \u0441\u0430\u0439\u0442.`);
}
async function sendContent(c, ctx, opts = {}) {
  const prio = opts.prio ?? "hi";
  const html = expandText(c.text, ctx);
  const kb = buildKeyboard(c.buttons, ctx);
  if (!c.media) return sendText(ctx.chatId, html, kb, c.silent, prio);
  const short = visibleLength(html) <= 1024;
  const m = await sendMedia(ctx.chatId, c.media, short ? html : void 0, short ? kb : void 0, c.silent, prio);
  if (m.ok) return short ? m : sendText(ctx.chatId, html, kb, c.silent, prio);
  if (isGone(m)) return m;
  console.warn("[tg] \u043C\u0435\u0434\u0438\u0430 %s \u043D\u0435 \u0443\u0448\u043B\u043E (%s), \u0448\u043B\u044E \u0442\u0435\u043A\u0441\u0442\u043E\u043C", c.media.url, m.error);
  noteRuntime("mediaFallback", { info: c.media.url });
  void warnMedia(c.media.url, m.error);
  return sendText(ctx.chatId, html, kb, c.silent, prio);
}
function noteSendResult(chatId, r, now) {
  if (!isGone(r)) return;
  const st = getStore();
  const s = st.subs.get(chatId);
  if (s && !s.blocked) st.recordEvent({ type: "blocked", chat_id: chatId, ts: new Date(now).toISOString() });
}
function displayDay(sub, now, cfg) {
  return sub && now < streamEnd(sub.streamDay, cfg) ? sub.streamDay : assignStreamDay(now, cfg);
}
function liveContent(sr) {
  return { text: sr.welcome.live, buttons: sr.welcome.liveButtons };
}
async function sendGreeting(sub, now) {
  const sr = getSeries();
  const cfg = timeCfg(sr);
  const ctx = { series: sr, now, chatId: sub.chatId, firstName: sub.firstName, day: sub.streamDay };
  if (isLive(sub.streamDay, now, cfg)) {
    noteSendResult(sub.chatId, await sendContent(liveContent(sr), ctx), now);
    return;
  }
  const r = await sendContent({ media: sr.welcome.media, text: sr.welcome.before }, ctx);
  noteSendResult(sub.chatId, r, now);
  const live = liveDayNow(now, cfg);
  if (r.ok && live && live !== sub.streamDay && sr.welcome.lateToday) {
    const r2 = await sendContent({ text: sr.welcome.lateToday, buttons: sr.welcome.liveButtons }, { ...ctx, liveDay: live });
    noteSendResult(sub.chatId, r2, now);
  }
}
var OWNER_CMDS = /* @__PURE__ */ new Set(["stats", "admin", "series", "series_on", "series_off", "preview", "fire", "paid", "reload", "at", "off", "on", "bizon"]);
var HELP_TEXT = [
  "\u041A\u043E\u043C\u0430\u043D\u0434\u044B \u0432\u043B\u0430\u0434\u0435\u043B\u044C\u0446\u0430:",
  "/admin: \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430 (\u0437\u0430\u044F\u0432\u043A\u0438, \u0431\u043E\u0442, UTM \u043F\u043E \u0434\u043D\u044F\u043C, \u043E\u0448\u0438\u0431\u043A\u0438), \u0432\u044B\u0431\u043E\u0440 \u043F\u0435\u0440\u0438\u043E\u0434\u0430 \u0438 \u0434\u0430\u0442\u044B. /stats \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0442\u043E \u0436\u0435",
  "/series: \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u043D\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F",
  "/preview: \u043F\u0440\u0438\u0441\u043B\u0430\u0442\u044C \u0441\u0435\u0431\u0435 \u0432\u0441\u044E \u0441\u0435\u0440\u0438\u044E \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438",
  "/fire <id>: \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0441\u0435\u0439\u0447\u0430\u0441 (\u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0440\u0435\u0432\u044C\u044E, \u043F\u043E\u0442\u043E\u043C \u043A\u043D\u043E\u043F\u043A\u0430 \xAB\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C\xBB)",
  "/at <id> HH:MM: \u0441\u0434\u0432\u0438\u043D\u0443\u0442\u044C \u0432\u0440\u0435\u043C\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F (/at <id> reset \u0432\u0435\u0440\u043D\u0451\u0442 \u043A\u0430\u043A \u0432 json)",
  "/off <id>, /on <id>: \u0432\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0438\u043B\u0438 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435",
  "/bizon <\u0441\u0441\u044B\u043B\u043A\u0430>: \u0441\u043C\u0435\u043D\u0438\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443 \u044D\u0444\u0438\u0440\u0430",
  "/paid <chat_id \u0438\u043B\u0438 @username>: \u043E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043E\u043F\u043B\u0430\u0442\u0443",
  "/reload: \u043F\u0435\u0440\u0435\u0447\u0438\u0442\u0430\u0442\u044C tg-series.json",
  "/series_on, /series_off: \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0438\u043B\u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0441\u0435\u0440\u0438\u044E",
  "",
  "\u041C\u0435\u0442\u043A\u0430 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0430: \u0434\u043E\u0431\u0430\u0432\u044C ?start=2gis \u043A \u0441\u0441\u044B\u043B\u043A\u0435 \u043D\u0430 \u0431\u043E\u0442\u0430 (t.me/workshop_aiprod_bot?start=2gis), \u0432 \u043E\u0442\u0447\u0451\u0442\u0430\u0445 \u043E\u043D\u0430 \u043F\u043E\u043A\u0430\u0436\u0435\u0442\u0441\u044F \u043A\u0430\u043A \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A."
].join("\n");
function parseCommand(text) {
  const m = /^\/([A-Za-z0-9_]+)(?:@[A-Za-z0-9_]+)?(?:\s+([\s\S]*))?$/.exec(text.trim());
  return m ? { cmd: m[1].toLowerCase(), args: (m[2] || "").trim() } : null;
}
function cleanPayload(args) {
  const first = args.split(/\s+/)[0] || "";
  return /^[A-Za-z0-9_-]{1,64}$/.test(first) ? first : "";
}
var chains = /* @__PURE__ */ new Map();
function serial(key, fn) {
  const prev = chains.get(key) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  const tail = next.then(() => void 0, () => void 0);
  chains.set(key, tail);
  void tail.then(() => {
    if (chains.get(key) === tail) chains.delete(key);
  });
  return next;
}
var seenUpdates = [];
var seenSet = /* @__PURE__ */ new Set();
function seenBefore(id) {
  if (typeof id !== "number") return false;
  if (seenSet.has(id)) return true;
  seenSet.add(id);
  seenUpdates.push(id);
  if (seenUpdates.length > SEEN_UPDATES) seenSet.delete(seenUpdates.shift());
  return false;
}
var lastOther = /* @__PURE__ */ new Map();
var previewing = /* @__PURE__ */ new Set();
var fireHook = null;
function registerFire(h) {
  fireHook = h;
}
async function processUpdate(u, now = Date.now()) {
  if (!store || !series) return;
  if (seenBefore(u.update_id)) return;
  const chatId = u.message?.chat?.id ?? u.callback_query?.message?.chat?.id ?? u.callback_query?.from?.id ?? u.my_chat_member?.chat?.id;
  if (typeof chatId !== "number") return;
  await serial(String(chatId), async () => {
    try {
      if (u.message) await onMessage(u.message, now);
      else if (u.callback_query) await onCallback(u.callback_query, now);
      else if (u.my_chat_member) onMemberUpdate(u.my_chat_member, now);
    } catch (e) {
      console.error("[tg] \u043E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u0430\u043F\u0434\u0435\u0439\u0442\u0430:", scrub(String(e?.stack || e)));
    }
  });
}
async function onMessage(m, now) {
  if (m.chat?.type !== "private" || !m.from || m.from.is_bot) return;
  const text = (m.text || "").trim();
  if (!text) return;
  const c = parseCommand(text);
  if (c?.cmd === "start") return onStart(m, cleanPayload(c.args), now);
  if (c?.cmd === "stop") return onStop(m, now);
  if (c?.cmd === "help" && isOwner(m.from.id)) {
    await plain(m.chat.id, HELP_TEXT);
    return;
  }
  if (c && OWNER_CMDS.has(c.cmd)) {
    if (isOwner(m.from.id)) await ownerCommand(c.cmd, c.args, m, now);
    return;
  }
  if (isOwner(m.from.id)) return;
  await onOther(m, now);
}
async function onStart(m, payload, now) {
  const st = getStore();
  const sr = getSeries();
  const cfg = timeCfg(sr);
  const from = m.from;
  const prev = st.subs.get(m.chat.id);
  const day = prev && now < streamEnd(prev.streamDay, cfg) ? prev.streamDay : assignStreamDay(now, cfg);
  st.recordEvent({
    type: "start",
    chat_id: m.chat.id,
    user_id: from.id,
    username: from.username,
    first_name: from.first_name,
    language_code: from.language_code,
    payload,
    streamDay: day,
    ts: new Date(now).toISOString()
  });
  await sendGreeting(st.subs.get(m.chat.id), now);
}
async function onStop(m, now) {
  const st = getStore();
  const sr = getSeries();
  const sub = st.subs.get(m.chat.id);
  if (sub) st.recordEvent({ type: "stop", chat_id: m.chat.id, ts: new Date(now).toISOString() });
  const ctx = { series: sr, now, chatId: m.chat.id, firstName: sub?.firstName, day: displayDay(sub, now, timeCfg(sr)) };
  noteSendResult(m.chat.id, await sendContent({ text: sr.welcome.stop }, ctx), now);
}
async function onOther(m, now) {
  const last = lastOther.get(m.chat.id) ?? 0;
  if (now - last < OTHER_THROTTLE_MS) return;
  lastOther.set(m.chat.id, now);
  if (lastOther.size > 5e3) {
    for (const [k, t] of lastOther) if (now - t >= OTHER_THROTTLE_MS) lastOther.delete(k);
  }
  const st = getStore();
  const sr = getSeries();
  const cfg = timeCfg(sr);
  const sub = st.subs.get(m.chat.id);
  const firstName = sub?.firstName || m.from?.first_name;
  const live = liveDayNow(now, cfg);
  const ctx = { series: sr, now, chatId: m.chat.id, firstName, day: live ?? displayDay(sub, now, cfg) };
  const content = live ? liveContent(sr) : { text: sr.welcome.other };
  noteSendResult(m.chat.id, await sendContent(content, ctx), now);
}
async function onCallback(cq, now) {
  const st = getStore();
  const sr = getSeries();
  const cfg = timeCfg(sr);
  const chatId = cq.message?.chat?.id ?? cq.from.id;
  const sub = st.subs.get(chatId);
  const ts = new Date(now).toISOString();
  await botSend("answerCallbackQuery", { callback_query_id: cq.id });
  if (cq.data?.startsWith("adm:")) {
    if (isOwner(cq.from.id)) await onAdminCallback(cq, now);
    return;
  }
  if (cq.data === "paid") {
    if (!sub || sub.paid) return;
    st.recordEvent({ type: "paid", chat_id: chatId, by: "self", ts });
    const ctx = { series: sr, now, chatId, firstName: sub.firstName, day: displayDay(sub, now, cfg) };
    noteSendResult(chatId, await sendContent({ text: sr.welcome.paidAck }, ctx), now);
    return;
  }
  if (cq.data === "rejoin") {
    const day = assignStreamDay(now, cfg);
    if (sub) st.recordEvent({ type: "rejoin", chat_id: chatId, streamDay: day, ts });
    const ctx = { series: sr, now, chatId, firstName: sub?.firstName, day };
    const content = isLive(day, now, cfg) ? liveContent(sr) : { text: sr.welcome.rejoinAck ?? DEFAULT_REJOIN_ACK };
    noteSendResult(chatId, await sendContent(content, ctx), now);
    return;
  }
  if (cq.data?.startsWith("fire:")) {
    if (!isOwner(cq.from.id) || !fireHook) return;
    if (cq.message?.message_id) {
      await botSend("editMessageReplyMarkup", { chat_id: chatId, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
    }
    await plain(chatId, await fireHook.run(cq.data.slice(5), now));
  }
}
function adminCtx(now) {
  return { store: getStore(), cfg: timeCfg(getSeries()), now, version: adminVersion() };
}
function adminHomeText(st, sr, now) {
  return `${buildStatsText(st, sr, now)}

\u0412\u044B\u0431\u0435\u0440\u0438 \u043F\u0435\u0440\u0438\u043E\u0434 \u0434\u043B\u044F \u043E\u0442\u0447\u0451\u0442\u0430:`;
}
async function onAdminCallback(cq, now) {
  const cb = parseAdminCb(cq.data || "");
  if (!cb) return;
  const chatId = cq.message?.chat?.id ?? cq.from.id;
  const ctx = adminCtx(now);
  let text;
  let kb;
  let html = true;
  if (cb.action === "m") {
    text = adminHomeText(getStore(), activeSeries(), now);
    kb = menuKeyboard();
    html = false;
  } else if (cb.action === "d") {
    text = "\u0412\u044B\u0431\u0435\u0440\u0438 \u0434\u0435\u043D\u044C (\u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 14 \u0434\u043D\u0435\u0439) \u0438\u043B\u0438 \u0432\u0435\u0441\u044C \u043F\u0435\u0440\u0438\u043E\u0434:";
    kb = datePickerKeyboard(now);
    html = false;
  } else if (cb.action === "u") {
    text = renderUtmByDay(ctx, cb.period);
    kb = adminKeyboard(cb.period, "u");
  } else if (cb.action === "e") {
    text = renderErrors(ctx, cb.period);
    kb = adminKeyboard(cb.period, "e");
  } else {
    text = renderReport(ctx, cb.period);
    kb = adminKeyboard(cb.period, "p");
  }
  const body = {
    chat_id: chatId,
    text,
    ...html ? { parse_mode: "HTML" } : {},
    link_preview_options: { is_disabled: true },
    reply_markup: { inline_keyboard: kb }
  };
  const mid = cq.message?.message_id;
  if (mid) {
    const r = await botSend("editMessageText", { ...body, message_id: mid });
    if (r.ok || /not modified/i.test(r.description)) return;
    console.warn("[tg] \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0430\u0434\u043C\u0438\u043D\u043A\u0438 (%s), \u0448\u043B\u044E \u043D\u043E\u0432\u044B\u043C", r.description);
  }
  await botSend("sendMessage", body);
}
function onMemberUpdate(u, now) {
  if (u.chat?.type !== "private") return;
  const st = getStore();
  const sub = st.subs.get(u.chat.id);
  if (!sub) return;
  const status = u.new_chat_member?.status;
  const ts = new Date(now).toISOString();
  if (status === "kicked" && !sub.blocked) st.recordEvent({ type: "blocked", chat_id: u.chat.id, ts });
  else if (status === "member" && sub.blocked) st.recordEvent({ type: "unblocked", chat_id: u.chat.id, ts });
}
var AUD_LABEL = { all: "\u0432\u0441\u0435", clicked: "\u043D\u0430\u0436\u0430\u0432\u0448\u0438\u043C", notClicked: "\u043D\u0435 \u043D\u0430\u0436\u0430\u0432\u0448\u0438\u043C", notPaid: "\u043D\u0435 \u043E\u043F\u043B\u0430\u0442\u0438\u0432\u0448\u0438\u043C" };
var payloadGroup = (payload) => payload.split("_")[0] || "\u0431\u0435\u0437 \u043C\u0435\u0442\u043A\u0438";
var pct2 = (part, whole) => whole > 0 ? Math.round(part * 100 / whole) : 0;
function buildDayTable(st, sr, now) {
  const today = dayKeyOf(now);
  const days = new Set(st.regDayKeys());
  if (isStreamDay(today, timeCfg(sr))) days.add(today);
  return [...days].sort().reverse().slice(0, 7).map((d) => {
    const m = st.dayMetrics(d);
    return `${d}: \u0437\u0430\u043F\u0438\u0441\u0430\u043B\u0438\u0441\u044C ${m.registered}, \u043F\u0435\u0440\u0435\u0448\u043B\u0438 ${m.clicked} (${pct2(m.clicked, m.registered)}%), \xAB\u042F \u0443\u0436\u0435 \u043E\u043F\u043B\u0430\u0442\u0438\u043B(\u0430)\xBB ${m.paid}`;
  });
}
function buildStatsText(st, sr, now) {
  const today = dayKeyOf(now);
  const tomorrow = addDays(today, 1);
  let active = 0;
  let forToday = 0;
  let forTomorrow = 0;
  let paid = 0;
  const byPayload = /* @__PURE__ */ new Map();
  for (const s of st.subs.values()) {
    if (st.isActive(s)) {
      active++;
      if (s.streamDay === today) forToday++;
      if (s.streamDay === tomorrow) forTomorrow++;
    }
    if (s.paid) paid++;
    const key = payloadGroup(s.payload);
    byPayload.set(key, (byPayload.get(key) || 0) + 1);
  }
  const tags = [...byPayload.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, n]) => `${k}: ${n}`).join(", ");
  const started = st.startedOn(today, dayKeyOf);
  const table = buildDayTable(st, sr, now);
  return [
    `\u0421\u0435\u0440\u0438\u044F: ${st.state.seriesEnabled ? "\u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0430" : "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u0430"} (\u0432\u0435\u0440\u0441\u0438\u044F ${sr.version})`,
    `\u041F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u043E\u0432 \u0432\u0441\u0435\u0433\u043E: ${st.subs.size}`,
    `\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0445 (\u043D\u0435 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043B\u0438, \u043D\u0435 \u043E\u0442\u043F\u0438\u0441\u0430\u043B\u0438\u0441\u044C): ${active}`,
    `\u041D\u0430 \u044D\u0444\u0438\u0440 \u0441\u0435\u0433\u043E\u0434\u043D\u044F (${today}): ${forToday}`,
    `\u041D\u0430 \u044D\u0444\u0438\u0440 \u0437\u0430\u0432\u0442\u0440\u0430 (${tomorrow}): ${forTomorrow}`,
    `\u041E\u043F\u043B\u0430\u0442\u0438\u043B\u0438 (\u0432\u0441\u0435\u0433\u043E): ${paid}`,
    `\u0421\u0435\u0433\u043E\u0434\u043D\u044F \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \xAB\u0421\u043F\u0430\u0441\u0438\u0431\u043E\xBB \u043D\u0430\u0436\u0430\u043B\u0438 Telegram: ${st.tyCount(today, "tg")}, WhatsApp: ${st.tyCount(today, "wa")}`,
    `\u0421\u0435\u0433\u043E\u0434\u043D\u044F \u043D\u0430\u0436\u0430\u043B\u0438 \xAB\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C\xBB \u0432 \u0431\u043E\u0442\u0435: ${started.total} (\u0441\u043E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B \xAB\u0421\u043F\u0430\u0441\u0438\u0431\u043E\xBB: ${started.fromPrefix})`,
    `\u041F\u043E \u043C\u0435\u0442\u043A\u0430\u043C: ${tags || "\u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E"}`,
    "",
    "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u044D\u0444\u0438\u0440\u044B (\u0437\u0430\u043F\u0438\u0441\u0430\u043B\u0438\u0441\u044C \u0432 \u0431\u043E\u0442\u0430 / \u043F\u0435\u0440\u0435\u0448\u043B\u0438 \u043F\u043E \u043A\u043D\u043E\u043F\u043A\u0435 \u044D\u0444\u0438\u0440\u0430 / \u043D\u0430\u0436\u0430\u043B\u0438 \xAB\u042F \u0443\u0436\u0435 \u043E\u043F\u043B\u0430\u0442\u0438\u043B(\u0430)\xBB):",
    ...table.length ? table : ["\u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E"]
  ].join("\n");
}
function dayReportText(st, day) {
  const m = st.dayMetrics(day);
  return `\u042D\u0444\u0438\u0440 ${dateLabel(day)}: \u0437\u0430\u043F\u0438\u0441\u0430\u043B\u0438\u0441\u044C \u0432 \u0431\u043E\u0442\u0430 ${m.registered}, \u043F\u0435\u0440\u0435\u0448\u043B\u0438 \u043F\u043E \u043A\u043D\u043E\u043F\u043A\u0435 ${m.clicked} (${pct2(m.clicked, m.registered)}%), \u0441\u043E \xAB\u0421\u043F\u0430\u0441\u0438\u0431\u043E\xBB \u043D\u0430\u0436\u0430\u043B\u0438 Telegram ${st.tyCount(day, "tg")}, WhatsApp ${st.tyCount(day, "wa")}.`;
}
function buildSeriesText(st, sr, now) {
  const today = dayKeyOf(now);
  const rows = sr.messages.map((m) => ({ m, day: addDays(today, -(m.dayOffset ?? 0)) })).sort((a, b) => atTime(today, a.m.at) - atTime(today, b.m.at));
  const lines = rows.map(({ m, day }) => {
    let eligible = 0;
    for (const s of st.subs.values()) if (s.streamDay === day && st.isActive(s) && st.audienceOk(m.audience, s, day)) eligible++;
    const sent = st.sentCount(m.id, day);
    const ov = st.state.overrides[m.id];
    const inJson = series?.messages.find((x) => x.id === m.id)?.at;
    const marks = [
      m.enabled === false ? "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E" : "",
      m.essential ? "\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435, \u0438\u0434\u0451\u0442 \u0431\u0435\u0437 /series_on" : "",
      ov?.at ? `\u0432\u0440\u0435\u043C\u044F \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u043E, \u0432 json ${inJson ?? "?"}` : ""
    ].filter(Boolean);
    return `${m.at} ${m.id} (${AUD_LABEL[m.audience]})${marks.length ? ` [${marks.join("; ")}]` : ""}: \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E ${sent} \u0438\u0437 ${Math.max(sent, eligible)}`;
  });
  const head = [
    `\u0421\u0435\u0440\u0438\u044F: ${st.state.seriesEnabled ? "\u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0430" : "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u0430"}, \u0432\u0435\u0440\u0441\u0438\u044F ${sr.version}`,
    isStreamDay(today, timeCfg(sr)) ? `\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043D\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F (${today}):` : `\u0421\u0435\u0433\u043E\u0434\u043D\u044F (${today}) \u044D\u0444\u0438\u0440\u0430 \u043D\u0435\u0442, \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043D\u0438\u0436\u0435 \u0434\u043B\u044F \u0441\u043F\u0440\u0430\u0432\u043A\u0438:`
  ];
  return [...head, ...lines].join("\n");
}
function payWarning(sr) {
  if (sr.links.pay) return "";
  const ids = sr.messages.filter((m) => m.enabled !== false && (m.buttons || []).some((row) => row.some((b) => b.url?.includes("{PAY}")))).map((m) => m.id);
  if (!ids.length) return "";
  return `

\u0412\u043D\u0438\u043C\u0430\u043D\u0438\u0435: links.pay \u043F\u0443\u0441\u0442, \u043A\u043D\u043E\u043F\u043A\u0438 {PAY} \u0432\u044B\u043F\u0430\u0434\u0443\u0442 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F\u0445: ${ids.join(", ")}. \u0421\u0435\u0440\u0438\u044F \u0432\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0430; \u0437\u0430\u0434\u0430\u0439 \u0441\u0441\u044B\u043B\u043A\u0443 \u0432 tg-series.json \u0438 \u0441\u0434\u0435\u043B\u0430\u0439 /reload.`;
}
function bizonValid(raw) {
  try {
    const u = new URL(raw);
    const h = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || !(h === "bizon365.ru" || h.endsWith(".bizon365.ru")) || u.pathname.length < 2) return null;
    return u.toString();
  } catch {
    return null;
  }
}
async function ownerCommand(cmd, args, m, now) {
  const st = getStore();
  const chatId = m.chat.id;
  const sr = () => activeSeries();
  switch (cmd) {
    case "stats":
    case "admin":
      await plain(chatId, adminHomeText(st, sr(), now), menuKeyboard());
      return;
    case "series":
      await plain(chatId, buildSeriesText(st, sr(), now));
      return;
    case "series_on":
      st.setSeriesEnabled(true);
      await plain(chatId, `\u0421\u0435\u0440\u0438\u044F \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0430. \u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0443\u0445\u043E\u0434\u044F\u0442 \u043F\u043E \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044E.${payWarning(sr())}`);
      return;
    case "series_off":
      st.setSeriesEnabled(false);
      await plain(chatId, "\u0421\u0435\u0440\u0438\u044F \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u0430. \u041F\u0440\u0438\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043A\u0430\u043A \u0440\u0430\u043D\u044C\u0448\u0435.");
      return;
    case "reload":
      try {
        const r = reloadSeries();
        const warn = r.warnings.length ? `

\u041D\u0430 \u0437\u0430\u043C\u0435\u0442\u043A\u0443:
${r.warnings.slice(0, 8).join("\n")}` : "";
        await plain(chatId, `\u0421\u0435\u0440\u0438\u044F \u043F\u0435\u0440\u0435\u0447\u0438\u0442\u0430\u043D\u0430: \u0432\u0435\u0440\u0441\u0438\u044F ${r.version}, \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 ${r.count}.${warn}`);
      } catch (e) {
        await plain(chatId, `\u041D\u0435 \u043F\u0440\u0438\u043D\u044F\u043B \u0441\u0435\u0440\u0438\u044E, \u0440\u0430\u0431\u043E\u0442\u0430\u044E \u043D\u0430 \u043F\u0440\u0435\u0436\u043D\u0435\u0439: ${e.message}`);
      }
      return;
    case "at": {
      const [id, time] = args.split(/\s+/);
      const msg = getSeries().messages.find((x) => x.id === id);
      if (!id || !time || !msg) {
        await plain(chatId, "\u0424\u043E\u0440\u043C\u0430\u0442: /at <id> HH:MM \u0438\u043B\u0438 /at <id> reset. \u0421\u043F\u0438\u0441\u043E\u043A id: /series");
        return;
      }
      if (time === "reset") {
        st.setOverride(id, { at: null });
        await plain(chatId, `\u0412\u0440\u0435\u043C\u044F \xAB${id}\xBB \u0432\u0435\u0440\u043D\u0443\u043B \u043A\u0430\u043A \u0432 json: ${msg.at}.`);
        return;
      }
      let hhmm;
      try {
        const t = parseHHMM(time);
        hhmm = `${String(t.h).padStart(2, "0")}:${String(t.m).padStart(2, "0")}`;
      } catch {
        await plain(chatId, "\u0412\u0440\u0435\u043C\u044F \u0432\u0438\u0434\u0430 HH:MM \u043F\u043E \u0410\u043B\u043C\u0430\u0442\u044B, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 20:55.");
        return;
      }
      st.setOverride(id, { at: hhmm });
      await plain(chatId, `\u0412\u0440\u0435\u043C\u044F \xAB${id}\xBB \u0442\u0435\u043F\u0435\u0440\u044C ${hhmm} (\u0432 json ${msg.at}).`);
      return;
    }
    case "off":
    case "on": {
      const id = args.split(/\s+/)[0];
      const msg = getSeries().messages.find((x) => x.id === id);
      if (!id || !msg) {
        await plain(chatId, `\u0424\u043E\u0440\u043C\u0430\u0442: /${cmd} <id>. \u0421\u043F\u0438\u0441\u043E\u043A id: /series`);
        return;
      }
      st.setOverride(id, { enabled: cmd === "on" });
      await plain(chatId, cmd === "on" ? `\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \xAB${id}\xBB \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E.` : `\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \xAB${id}\xBB \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E.`);
      return;
    }
    case "bizon": {
      if (!args) {
        await plain(chatId, `\u0421\u0441\u044B\u043B\u043A\u0430 \u044D\u0444\u0438\u0440\u0430 \u0441\u0435\u0439\u0447\u0430\u0441: ${currentBizon()}
\u0427\u0442\u043E\u0431\u044B \u0441\u043C\u0435\u043D\u0438\u0442\u044C: /bizon https://start.bizon365.ru/room/...`);
        return;
      }
      const url = bizonValid(args.split(/\s+/)[0]);
      if (!url) {
        await plain(chatId, "\u041D\u0443\u0436\u043D\u0430 \u0441\u0441\u044B\u043B\u043A\u0430 \u0432\u0438\u0434\u0430 https://...bizon365.ru/... \u0414\u0440\u0443\u0433\u0438\u0435 \u0430\u0434\u0440\u0435\u0441\u0430 \u043D\u0435 \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u044E.");
        return;
      }
      st.setBizon(url);
      await plain(chatId, `\u0421\u0441\u044B\u043B\u043A\u0430 \u044D\u0444\u0438\u0440\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430: ${url}
\u041F\u0435\u0440\u0435\u0445\u043E\u0434\u044B \u0438\u0437 \u0431\u043E\u0442\u0430 \u0432\u0435\u0434\u0443\u0442 \u043D\u0430 \u043D\u0435\u0451 \u0441\u0440\u0430\u0437\u0443, \u0441 \u043C\u043E\u043C\u0435\u043D\u0442\u0430 \u043A\u043B\u0438\u043A\u0430.`);
      return;
    }
    case "paid": {
      if (!args) {
        await plain(chatId, "\u0423\u043A\u0430\u0436\u0438 chat_id \u0438\u043B\u0438 @username: /paid 123456789");
        return;
      }
      const s = st.find(args);
      if (!s) {
        await plain(chatId, `\u041D\u0435 \u043D\u0430\u0448\u0451\u043B \u043F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u0430: ${args}`);
        return;
      }
      if (!s.paid) st.recordEvent({ type: "paid", chat_id: s.chatId, by: "owner", ts: new Date(now).toISOString() });
      await plain(chatId, `\u041E\u0442\u043C\u0435\u0447\u0435\u043D \u043E\u043F\u043B\u0430\u0442\u0438\u0432\u0448\u0438\u043C: ${s.firstName || "\u0431\u0435\u0437 \u0438\u043C\u0435\u043D\u0438"} (${s.username ? "@" + s.username + ", " : ""}${s.chatId}).`);
      return;
    }
    case "fire": {
      const id = args.split(/\s+/)[0];
      if (!id) {
        await plain(chatId, "\u0423\u043A\u0430\u0436\u0438 id \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F: /fire topic-p23. \u0421\u043F\u0438\u0441\u043E\u043A: /series");
        return;
      }
      if (!fireHook) {
        await plain(chatId, "\u041F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0449\u0438\u043A \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D.");
        return;
      }
      const p = fireHook.plan(id, now);
      if (!p.ok) {
        await plain(chatId, p.error);
        return;
      }
      const ctx = { series: sr(), now, chatId, firstName: m.from?.first_name, day: p.day };
      await sendContent({ media: p.msg.media, text: p.msg.text, buttons: p.msg.buttons, silent: p.msg.silent }, ctx);
      await plain(chatId, `\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u0435\u0439: ${p.count}. \u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \xAB${id}\xBB \u0441\u0435\u0439\u0447\u0430\u0441?`, [[{ text: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C", callback_data: `fire:${id}` }]]);
      return;
    }
    case "preview":
      void runPreview(m, now).catch((e) => console.error("[tg] preview:", scrub(String(e))));
      return;
  }
}
async function runPreview(m, now) {
  const chatId = m.chat.id;
  if (previewing.has(chatId)) {
    await plain(chatId, "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0443\u0436\u0435 \u0438\u0434\u0451\u0442.");
    return;
  }
  previewing.add(chatId);
  try {
    const sr = activeSeries();
    const day = assignStreamDay(now, timeCfg(sr));
    const msgs = [...sr.messages].sort((a, b) => (a.dayOffset ?? 0) - (b.dayOffset ?? 0) || atTime(day, a.at) - atTime(day, b.at));
    const list = msgs.map((x) => `${x.dayOffset ? `+${x.dayOffset}\u0434 ` : ""}${x.at} ${x.id} (${AUD_LABEL[x.audience]})${x.enabled === false ? " [\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E]" : ""}`);
    await plain(chatId, `\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0441\u0435\u0440\u0438\u0438: ${msgs.length} \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439, \u043F\u043E \u043E\u0434\u043D\u043E\u043C\u0443 \u0432 1,5 \u0441\u0435\u043A\u0443\u043D\u0434\u044B. \u0421\u0441\u044B\u043B\u043A\u0430 \u044D\u0444\u0438\u0440\u0430 \u0438 \u0434\u0435\u043D\u044C \u043A\u0430\u043A \u0434\u043B\u044F \u0442\u0435\u0431\u044F; \u043F\u0443\u0441\u0442\u0430\u044F \u043E\u043F\u043B\u0430\u0442\u0430 \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u0430 \u043A\u043D\u043E\u043F\u043A\u043E\u0439 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440\u0430.

${list.join("\n")}`);
    const failed = [];
    for (const x of msgs) {
      await sleep(1500);
      const ctx = { series: sr, now: Date.now(), chatId, firstName: m.from?.first_name, day, preview: true };
      const r = await sendContent({ media: x.media, text: x.text, buttons: x.buttons, silent: x.silent }, ctx);
      if (!r.ok) failed.push(`${x.id} (${r.error})`);
    }
    await plain(chatId, failed.length ? `\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0437\u0430\u043A\u043E\u043D\u0447\u0435\u043D. \u041D\u0435 \u0443\u0448\u043B\u0438: ${failed.join("; ")}` : "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0437\u0430\u043A\u043E\u043D\u0447\u0435\u043D.");
  } finally {
    previewing.delete(chatId);
  }
}
function reply(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload) });
  res.end(payload);
}
function readLimited(req, max) {
  return new Promise((resolve) => {
    let size = 0;
    let over = false;
    const chunks = [];
    req.on("data", (c) => {
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
function secretOk(provided) {
  const secret = webhookSecret();
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && (0, import_node_crypto3.timingSafeEqual)(a, b);
}
async function handleTgWorkshop(req, res) {
  const h = req.headers["x-telegram-bot-api-secret-token"];
  if (!secretOk(Array.isArray(h) ? h[0] : h)) {
    runtime.webhookRejected++;
    return reply(res, 401, { ok: false });
  }
  const raw = await readLimited(req, MAX_UPDATE_BODY);
  reply(res, 200, { ok: true });
  if (raw === null || !botEnabled()) return;
  let update = null;
  try {
    update = JSON.parse(raw);
  } catch {
    update = null;
  }
  if (!update || typeof update !== "object") return;
  void processUpdate(update).catch((e) => console.error("[tg] webhook:", scrub(String(e))));
}
function currentBizon() {
  return store?.state.bizon || series?.links.bizon || DEFAULT_BIZON;
}
function handleGo(req, res, rawToken) {
  let token = rawToken;
  try {
    token = decodeURIComponent(rawToken);
  } catch {
  }
  if (req.method === "GET" && store && botEnabled()) {
    const v = verifyGoToken(token);
    if (v) store.recordClick(v.chatId, v.day, (/* @__PURE__ */ new Date()).toISOString());
  }
  res.writeHead(302, { Location: currentBizon(), "Cache-Control": "no-store" });
  res.end();
}
var tyWindowStart = 0;
var tyWindowCount = 0;
function parseTyBody(raw) {
  let ch = "";
  let eid = "";
  let src = "";
  const s = raw.trim();
  try {
    if (s.startsWith("{")) {
      const o = JSON.parse(s);
      ch = String(o.ch ?? "");
      eid = String(o.eid ?? "");
      src = String(o.src ?? "");
    } else {
      const p = new URLSearchParams(s);
      ch = p.get("ch") || "";
      eid = p.get("eid") || "";
      src = p.get("src") || "";
    }
  } catch {
    return null;
  }
  if (ch !== "tg" && ch !== "wa") return null;
  return { ch, eid: /^[A-Za-z0-9-]{1,64}$/.test(eid) ? eid : "", ...src === "pp" || src === "ty" ? { src } : {} };
}
async function handleTyClick(req, res) {
  const raw = await readLimited(req, 2048);
  res.writeHead(204, { "Cache-Control": "no-store" });
  res.end();
  if (raw === null || !store) return;
  const p = parseTyBody(raw);
  if (!p) return;
  const t = Date.now();
  if (t - tyWindowStart > 1e4) {
    tyWindowStart = t;
    tyWindowCount = 0;
  }
  if (++tyWindowCount > 200) return;
  store.recordTyClick(p.ch, p.eid, dayKeyOf(t), new Date(t).toISOString(), p.src);
}
function calendarDay(now = Date.now()) {
  return assignStreamDay(now, series ? timeCfg(series) : { streamStart: "20:00", streamMinutes: 80, joinLiveMinutes: DEFAULT_JOIN_MINUTES });
}

// form-api/tg-scheduler.ts
var import_node_fs6 = require("node:fs");
var import_node_path6 = require("node:path");
var TICK_MS = 3e4;
var LOCK_STALE_MS = 3 * TICK_MS;
var REPORT_DELAY_MS = 5 * 6e4;
var REPORT_WINDOW_MS = 12 * 36e5;
function planTime(day, msg) {
  return atTime(addDays(day, msg.dayOffset ?? 0), msg.at);
}
function inWindow(now, plan, graceMinutes) {
  return now >= plan && now <= plan + graceMinutes * 6e4;
}
function candidateDays(sr, now) {
  const today = dayKeyOf(now);
  const back = Math.max(1, ...sr.messages.map((m) => m.dayOffset ?? 0));
  const out = [];
  for (let k = 0; k <= back; k++) out.push(addDays(today, -k));
  return out;
}
function dueMessages(sr, now) {
  const out = [];
  for (const day of candidateDays(sr, now)) {
    for (const msg of sr.messages) {
      if (msg.enabled === false) continue;
      const plan = planTime(day, msg);
      if (inWindow(now, plan, sr.graceMinutes)) out.push({ msg, day, plan });
    }
  }
  return out.sort((a, b) => a.plan - b.plan);
}
function pickRecipients(st, msg, day, opts = {}) {
  const out = [];
  for (const s of st.subs.values()) {
    if (s.streamDay !== day || !st.isActive(s)) continue;
    if (opts.plan !== void 0 && !(s.registeredAt < opts.plan)) continue;
    if (st.hasSent(msg.id, day, s.chatId)) continue;
    if (!st.audienceOk(msg.audience, s, day)) continue;
    out.push(s);
  }
  return out.sort((a, b) => a.chatId - b.chatId);
}
var lockPath = (st) => (0, import_node_path6.join)(st.dir, "scheduler.lock");
function pidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
}
var lockedOutLogged = false;
function holdLock(st) {
  const f = lockPath(st);
  try {
    if ((0, import_node_fs6.existsSync)(f)) {
      const cur = JSON.parse((0, import_node_fs6.readFileSync)(f, "utf8"));
      if (cur.pid && cur.pid !== process.pid && Date.now() - (cur.ts || 0) < LOCK_STALE_MS && pidAlive(cur.pid)) {
        if (!lockedOutLogged) console.warn("[tg-sched] \u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u0435\u0440\u0436\u0438\u0442 \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0446\u0435\u0441\u0441 (pid %d), \u044D\u0442\u043E\u0442 \u043D\u0435 \u0448\u043B\u0451\u0442", cur.pid);
        lockedOutLogged = true;
        return false;
      }
    }
    lockedOutLogged = false;
    (0, import_node_fs6.writeFileSync)(f, JSON.stringify({ pid: process.pid, ts: Date.now() }), "utf8");
    return true;
  } catch (e) {
    console.error("[tg-sched] lock-\u0444\u0430\u0439\u043B \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D:", e.message);
    return true;
  }
}
function releaseLock(st) {
  try {
    const f = lockPath(st);
    if ((0, import_node_fs6.existsSync)(f) && JSON.parse((0, import_node_fs6.readFileSync)(f, "utf8")).pid === process.pid) (0, import_node_fs6.unlinkSync)(f);
  } catch {
  }
}
var defaultDeps = {
  send: (s, msg, day) => sendContent(
    { media: msg.media, text: msg.text, buttons: msg.buttons, silent: msg.silent },
    { series: activeSeries(), now: Date.now(), chatId: s.chatId, firstName: s.firstName, day },
    // Рассылка идёт в очереди «lo»: приветствия новым людям обгоняют её.
    { prio: "lo" }
  ),
  now: () => Date.now()
};
var inflight = /* @__PURE__ */ new Set();
async function deliver(st, msg, day, rcpts, opts = {}, deps = defaultDeps) {
  const stats = { ok: 0, failed: 0, blocked: 0, netFail: 0, skippedLate: 0 };
  for (let i = 0; i < rcpts.length; i++) {
    const s = rcpts[i];
    if (opts.deadline !== void 0 && deps.now() > opts.deadline) {
      stats.skippedLate = rcpts.length - i;
      console.warn("[tg-sched] skip late msg=%s day=%s: \u043E\u043A\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u043B\u043E\u0441\u044C, \u043D\u0435 \u0443\u0441\u043F\u0435\u043B\u0438 %d", msg.id, day, stats.skippedLate);
      noteRuntime("skipLate", { msg: msg.id, info: String(stats.skippedLate) });
      break;
    }
    const key = `${msg.id}|${day}|${s.chatId}`;
    if (inflight.has(key) || st.hasSent(msg.id, day, s.chatId)) continue;
    inflight.add(key);
    try {
      let r;
      try {
        r = await deps.send(s, msg, day);
      } catch (e) {
        r = { ok: false, code: 0, error: `exception ${e?.message || e}` };
      }
      st.recordSent({ msg: msg.id, day, chat_id: s.chatId, ts: new Date(deps.now()).toISOString(), ok: r.ok, ...r.ok ? {} : { err: r.error } });
      if (r.ok) stats.ok++;
      else {
        stats.failed++;
        if (r.code === 403) stats.blocked++;
        if (!r.code || r.code >= 500) stats.netFail++;
        noteSendResult(s.chatId, r, deps.now());
        console.warn("[tg-sched] msg=%s day=%s chat=%d \u043D\u0435 \u0443\u0448\u043B\u043E: %s", msg.id, day, s.chatId, r.error);
      }
    } finally {
      inflight.delete(key);
    }
  }
  return stats;
}
var running = false;
var lateLogged = /* @__PURE__ */ new Set();
var errStreak = 0;
var errAlerted = false;
function logLate(st, sr, now) {
  for (const day of candidateDays(sr, now)) {
    for (const msg of sr.messages) {
      if (msg.enabled === false) continue;
      const plan = planTime(day, msg);
      const key = `${msg.id}|${day}`;
      if (now <= plan + sr.graceMinutes * 6e4 || lateLogged.has(key)) continue;
      const n = pickRecipients(st, msg, day, { plan }).length;
      if (n > 0) {
        lateLogged.add(key);
        console.warn("[tg-sched] skip late msg=%s day=%s: \u043E\u043A\u043D\u043E \u0437\u0430\u043A\u0440\u044B\u043B\u043E\u0441\u044C, \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0438 %d", msg.id, day, n);
        noteRuntime("skipLate", { msg: msg.id, info: String(n) });
      }
    }
  }
}
function noteTickResult(ok, why) {
  if (ok) {
    errStreak = 0;
    errAlerted = false;
    return;
  }
  errStreak++;
  console.error("[tg-sched] \u0442\u0438\u043A \u0441 \u043E\u0448\u0438\u0431\u043A\u043E\u0439 (%d \u043F\u043E\u0434\u0440\u044F\u0434): %s", errStreak, why);
  noteRuntime("tickError", { info: why.slice(0, 120) });
  if (errStreak >= 3 && !errAlerted) {
    errAlerted = true;
    void notifyOwners(`\u041F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0449\u0438\u043A \u0441\u0435\u0440\u0438\u0438: ${errStreak} \u0442\u0438\u043A\u0430 \u043F\u043E\u0434\u0440\u044F\u0434 \u0441 \u043E\u0448\u0438\u0431\u043A\u043E\u0439. \u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F: ${why}. \u041F\u0440\u043E\u0432\u0435\u0440\u044C pm2 logs workshop-form.`);
  }
}
async function dailyReport(now = Date.now()) {
  const st = getStore();
  const cfg = timeCfg(activeSeries());
  const today = dayKeyOf(now);
  for (const day of [addDays(today, -1), today]) {
    if (!isStreamDay(day, cfg) || st.isReported(day)) continue;
    const at = streamEnd(day, cfg) + REPORT_DELAY_MS;
    if (now < at || now > at + REPORT_WINDOW_MS) continue;
    if (!ownerIds().length) return false;
    if (await notifyOwners(dayReportText(st, day)) > 0) {
      st.markReported(day);
      return true;
    }
  }
  return false;
}
async function adminDaily(now = Date.now()) {
  const st = getStore();
  const sr = activeSeries();
  if (!st.state.adminSince) {
    st.setAdminSince(now);
    return false;
  }
  const at = sr.adminDailyReportAt || "09:00";
  const today = dayKeyOf(now);
  for (const occ of [addDays(today, -1), today]) {
    const t = atTime(occ, at);
    if (t < st.state.adminSince || now < t || now >= t + 24 * 36e5) continue;
    const day = addDays(occ, -1);
    if (st.isAdminReported(day)) continue;
    if (!ownerIds().length) return false;
    const text = renderDailyReport(adminCtx(now), day);
    if (await notifyOwnersHtml(text, dailyKeyboard(day)) > 0) {
      st.markAdminReported(day);
      return true;
    }
  }
  return false;
}
async function tick(now = Date.now(), deps = defaultDeps) {
  if (running) return 0;
  running = true;
  try {
    if (!botEnabled() || !botConfigured()) return 0;
    const st = getStore();
    if (!holdLock(st)) return 0;
    try {
      await dailyReport(now);
    } catch (e) {
      console.error("[tg-sched] \u043E\u0442\u0447\u0451\u0442 \u043D\u0435 \u0443\u0448\u0451\u043B:", e?.message || e);
    }
    try {
      await adminDaily(now);
    } catch (e) {
      console.error("[tg-sched] \u0430\u0434\u043C\u0438\u043D-\u043E\u0442\u0447\u0451\u0442 \u043D\u0435 \u0443\u0448\u0451\u043B:", e?.message || e);
    }
    const full = activeSeries();
    const sr = st.state.seriesEnabled ? full : { ...full, messages: full.messages.filter((m) => m.essential) };
    if (!sr.messages.length) return 0;
    logLate(st, sr, now);
    let sent = 0;
    let worked = false;
    let netDown = "";
    for (const d of dueMessages(sr, now)) {
      const rcpts = pickRecipients(st, d.msg, d.day, { plan: d.plan });
      if (!rcpts.length) continue;
      worked = true;
      console.log("[tg-sched] msg=%s day=%s \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u0435\u0439=%d", d.msg.id, d.day, rcpts.length);
      const r = await deliver(st, d.msg, d.day, rcpts, { deadline: d.plan + sr.graceMinutes * 6e4 }, deps);
      sent += r.ok;
      console.log("[tg-sched] msg=%s day=%s \u0443\u0448\u043B\u043E=%d \u043E\u0448\u0438\u0431\u043E\u043A=%d \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043B\u0438=%d", d.msg.id, d.day, r.ok, r.failed, r.blocked);
      if (r.ok === 0 && r.failed > 0 && r.netFail === r.failed) netDown = "Telegram \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u0438\u043B\u0438 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u043E\u0448\u0438\u0431\u043A\u0430\u043C\u0438 5xx";
    }
    if (worked) noteTickResult(!netDown, netDown);
    return sent;
  } catch (e) {
    noteTickResult(false, e?.message || String(e));
    return 0;
  } finally {
    running = false;
  }
}
function firePlan(id, now = Date.now()) {
  const st = getStore();
  const msg = activeSeries().messages.find((m) => m.id === id);
  if (!msg) return { ok: false, error: `\u041D\u0435\u0442 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \xAB${id}\xBB. \u0421\u043F\u0438\u0441\u043E\u043A: /series` };
  if (!st.state.seriesEnabled) return { ok: false, error: "\u0421\u0435\u0440\u0438\u044F \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u0430, \u043C\u0430\u0441\u0441\u043E\u0432\u0430\u044F \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \u0437\u0430\u043A\u0440\u044B\u0442\u0430. \u0412\u043A\u043B\u044E\u0447\u0438 \u043A\u043E\u043C\u0430\u043D\u0434\u043E\u0439 /series_on." };
  if (msg.enabled === false) return { ok: false, error: `\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \xAB${id}\xBB \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E (enabled: false \u0432 json \u0438\u043B\u0438 /off). \u0412\u043A\u043B\u044E\u0447\u0438: /on ${id}` };
  const day = addDays(dayKeyOf(now), -(msg.dayOffset ?? 0));
  const count = pickRecipients(st, msg, day).length;
  if (!count) return { ok: false, error: `\u041D\u0435\u043A\u043E\u043C\u0443 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C: \u0432\u0441\u0435, \u043A\u043E\u043C\u0443 \xAB${id}\xBB \u043F\u043E\u043B\u043E\u0436\u0435\u043D\u043E \u043D\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F, \u0443\u0436\u0435 \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0438 \u0435\u0433\u043E, \u0438\u043B\u0438 \u0442\u0430\u043A\u0438\u0445 \u043D\u0435\u0442.` };
  return { ok: true, day, msg, count };
}
async function fireNow(id, now = Date.now(), deps = defaultDeps) {
  const p = firePlan(id, now);
  if (!p.ok) return p.error;
  const st = getStore();
  const rcpts = pickRecipients(st, p.msg, p.day);
  const r = await deliver(st, p.msg, p.day, rcpts, {}, deps);
  return `\xAB${id}\xBB \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E: ${r.ok}, \u043E\u0448\u0438\u0431\u043E\u043A: ${r.failed} (\u0438\u0437 \u043D\u0438\u0445 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043B\u0438 \u0431\u043E\u0442\u0430: ${r.blocked}), \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u0435\u0439 \u0431\u044B\u043B\u043E: ${rcpts.length}.`;
}
function startScheduler() {
  registerFire({ plan: firePlan, run: (id, now) => fireNow(id, now) });
  if (!botEnabled() || !botConfigured()) {
    console.log("[tg-sched] \u0431\u043E\u0442 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D \u0438\u043B\u0438 \u043D\u0435\u0442 \u0442\u043E\u043A\u0435\u043D\u0430, \u0441\u0435\u043A\u0440\u0435\u0442\u0430 \u0432\u0435\u0431\u0445\u0443\u043A\u0430, TG_GO_SECRET: \u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0449\u0438\u043A \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D");
    return () => {
    };
  }
  const st = getStore();
  const timer = setInterval(() => void tick(), TICK_MS);
  const first = setTimeout(() => void tick(), 3e3);
  const onExit = () => releaseLock(st);
  process.on("exit", onExit);
  console.log("[tg-sched] \u0437\u0430\u043F\u0443\u0449\u0435\u043D, \u0442\u0438\u043A %d \u0441", TICK_MS / 1e3);
  return () => {
    clearInterval(timer);
    clearTimeout(first);
    process.off("exit", onExit);
    releaseLock(st);
  };
}

// form-api/server.ts
function loadEnv() {
  try {
    const raw = (0, import_node_fs7.readFileSync)(process.env.FORM_API_ENV || (0, import_node_path7.join)(__dirname, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const eq = s.indexOf("=");
      if (eq < 1) continue;
      const key = s.slice(0, eq).trim();
      if (process.env[key] === void 0) process.env[key] = s.slice(eq + 1).trim();
    }
  } catch {
    console.warn("[form-api] .env \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u2014 \u0440\u0430\u0431\u043E\u0442\u0430\u044E \u043D\u0430 \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F");
  }
}
loadEnv();
var PORT = Number(process.env.PORT) || 4010;
var HOST = "127.0.0.1";
var MAX_BODY = 64 * 1024;
var THANKYOU_URL = "https://onai.academy/workshop-montazh/thank-you.html";
function json(res, status, body, headers2 = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    ...headers2
  });
  res.end(payload);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new Error("body_too_large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}
async function readJson(req) {
  try {
    return JSON.parse(await readBody(req));
  } catch {
    return null;
  }
}
async function persistAmoLead(captured) {
  let res = await pushLeadToAmo(captured, { probeFirst: false });
  if (!res.ok) {
    await new Promise((r) => setTimeout(r, 500));
    res = await pushLeadToAmo(captured, { probeFirst: true });
  }
  if (!res.ok) await markFailed(captured.id, res.error);
  return res;
}
async function handleLead(req, res) {
  const payload = await readJson(req);
  if (!payload) return json(res, 400, { ok: false, error: "Invalid JSON" });
  const { name, phone, source = "landing", consent = false, eventId, fbp, fbc, eventSourceUrl, utm } = payload;
  if (!name || name.trim().length < 2) return json(res, 422, { ok: false, error: "Name required" });
  if (!phone || phone.replace(/\D/g, "").length < 8) return json(res, 422, { ok: false, error: "Phone required" });
  if (!consent) return json(res, 422, { ok: false, error: "Consent required" });
  const cleanName = name.trim();
  const cleanPhone = phone.trim();
  const siteUrl = eventSourceUrl || req.headers.referer || req.headers.origin || "https://onai.academy/workshop";
  const forwarded = req.headers["x-forwarded-for"];
  const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.headers["x-real-ip"] || void 0;
  const userAgent = req.headers["user-agent"] || void 0;
  const metaEventId = eventId || (0, import_node_crypto4.randomUUID)();
  const fbclid = fbc ? fbc.split(".").slice(3).join(".") || void 0 : void 0;
  const captured = await captureLead({
    eventId: metaEventId,
    name: cleanName,
    phone: cleanPhone,
    source,
    utm,
    fbclid
  });
  void Promise.allSettled([
    persistAmoLead(captured),
    sendLeadEvent({
      name: cleanName,
      phone: cleanPhone,
      eventId: metaEventId,
      eventSourceUrl: siteUrl,
      fbp,
      fbc,
      clientIp,
      userAgent
    })
  ]).then(([crmResult, capiResult]) => {
    const crmStatus = crmResult.status === "fulfilled" ? crmResult.value.ok ? `ok:${crmResult.value.leadId}` : `fail:${crmResult.value.error}` : "throw";
    const capiStatus = capiResult.status === "fulfilled" ? capiResult.value.ok ? `ok:${capiResult.value.received}` : `skip:${capiResult.value.reason}` : "throw";
    console.log("[lead] name=%s phone=***%s source=%s crm=%s capi=%s", cleanName, cleanPhone.slice(-4), source, crmStatus, capiStatus);
  });
  return json(res, 200, { ok: true, redirect: THANKYOU_URL });
}
var RETRY_MAX = Number(process.env.LEAD_RETRY_MAX) || 5;
async function handleReconcile(req, res) {
  const secret = process.env.RECONCILE_SECRET;
  if (!secret || req.headers["x-reconcile-secret"] !== secret) {
    return json(res, 401, { ok: false, error: "unauthorized" });
  }
  if (!supabaseConfigured()) return json(res, 500, { ok: false, error: "no_supabase" });
  const swept = await ingestWalToSupabase().catch(() => 0);
  const rows = await selectRetryable(RETRY_MAX, 50);
  let done = 0;
  let alerted = 0;
  let retrying = 0;
  for (const row of rows) {
    if (!row.id) continue;
    const lead = {
      id: row.id,
      eventId: row.event_id ?? void 0,
      name: row.name,
      phone: row.phone,
      source: row.source ?? void 0,
      utm: row.utm ?? void 0,
      fbclid: row.fbclid ?? void 0
    };
    const result = await pushLeadToAmo(lead, { probeFirst: true });
    if (result.ok) {
      done++;
      continue;
    }
    const current = row.retry_count ?? 0;
    await incrementRetry(row.id, current, result.error);
    if (current + 1 >= RETRY_MAX) {
      await sendOwnerAlert(lead, result.error);
      await markAlertSent(row.id);
      alerted++;
    } else {
      retrying++;
    }
  }
  console.log("[reconcile] swept=%d processed=%d done=%d alerted=%d retrying=%d", swept, rows.length, done, alerted, retrying);
  return json(res, 200, { ok: true, swept, processed: rows.length, done, alerted, retrying });
}
function handleWhatsAppLink(res) {
  return json(res, 200, { link: readWhatsAppLink() }, { "Cache-Control": "no-store, max-age=0" });
}
var TG_SECRET = process.env.TG_LINK_WEBHOOK_SECRET || "";
var TG_OWNER_IDS = (process.env.TG_LINK_OWNER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
function secretOk2(provided) {
  if (!TG_SECRET || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(TG_SECRET);
  if (a.length !== b.length) return false;
  return (0, import_node_crypto4.timingSafeEqual)(a, b);
}
function webhookReply(res, chatId, text) {
  return json(res, 200, { method: "sendMessage", chat_id: chatId, text, disable_web_page_preview: true });
}
function extractUrl(text) {
  const m = text.match(/https?:\/\/\S+/);
  if (!m) return null;
  return m[0].replace(/[)\]>!.,'"]+$/, "");
}
async function handleTgLink(req, res) {
  const headerSecret = req.headers["x-telegram-bot-api-secret-token"];
  if (!secretOk2(Array.isArray(headerSecret) ? headerSecret[0] : headerSecret)) {
    return json(res, 401, { ok: false });
  }
  const len = Number(req.headers["content-length"] || "0");
  if (len > 16384) return json(res, 413, { ok: false });
  const update = await readJson(req);
  if (!update) return json(res, 200, { ok: true });
  const msg = update.message || update.edited_message;
  const chatId = msg?.chat?.id;
  const fromId = msg?.from?.id;
  const text = (msg?.text || "").trim();
  if (!fromId || TG_OWNER_IDS.length === 0 || !TG_OWNER_IDS.includes(String(fromId))) {
    return json(res, 200, { ok: true });
  }
  const url = extractUrl(text);
  if (!url) {
    const cur = readWhatsAppRecord();
    const when = cur.updatedAt ? `
\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430: ${cur.updatedAt}` : "\n(\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E, \u0444\u0430\u0439\u043B \u0435\u0449\u0451 \u043D\u0435 \u043C\u0435\u043D\u044F\u043B\u0441\u044F)";
    return webhookReply(res, chatId, `\u041F\u0440\u0438\u0448\u043B\u0438 \u043D\u043E\u0432\u0443\u044E \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 WhatsApp-\u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u2014 \u043F\u043E\u0434\u0441\u0442\u0430\u0432\u043B\u044E \u0435\u0451 \u043D\u0430 thank-you \u0432\u043E\u0440\u043A\u0448\u043E\u043F\u0430.

\u0422\u0435\u043A\u0443\u0449\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430:
${cur.link}${when}`);
  }
  if (!isValidWhatsAppLink(url)) {
    return webhookReply(res, chatId, `\u042D\u0442\u043E \u043D\u0435 \u043F\u043E\u0445\u043E\u0436\u0435 \u043D\u0430 \u0441\u0441\u044B\u043B\u043A\u0443 WhatsApp.
\u0416\u0434\u0443 \u0432\u0438\u0434\u0430 https://chat.whatsapp.com/... \u0438\u043B\u0438 https://wa.me/...

\u041F\u0440\u0438\u0441\u043B\u0430\u043D\u043E: ${url}`);
  }
  const saved = writeWhatsAppLink(url, fromId);
  if (saved.ok) {
    return webhookReply(res, chatId, `\u2705 \u0421\u0441\u044B\u043B\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430 \u0438 \u0437\u0430\u0432\u0451\u0440\u043D\u0443\u0442\u0430 \u0432 \u0434\u0438\u043F\u043B\u0438\u043D\u043A.
\u041A\u043D\u043E\u043F\u043A\u0430 \u043D\u0430 thank-you \u0432\u0435\u0434\u0451\u0442 \u0432 WhatsApp:
${url}

\u041D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435; \u0432\u0441\u0442\u0440\u043E\u0435\u043D\u043D\u044B\u0435 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u044B Instagram/Facebook \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u044B (Android \u2014 \u0444\u043E\u0440\u0441, iOS \u2014 \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430 + \u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435).
\u041F\u0440\u043E\u0432\u0435\u0440\u044C: ${THANKYOU_URL}`);
  }
  return webhookReply(res, chatId, `\u274C \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C: ${saved.error}`);
}
function handleCalendar(res) {
  const [y, m, d] = calendarDay().split("-");
  const dates = `${y}${m}${d}T200000/${y}${m}${d}T220000`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "\u0412\u043E\u0440\u043A\u0448\u043E\u043F \xAB\u0412\u0430\u0439\u0431-\u043F\u0440\u043E\u0434\u0430\u043A\u0448\u0435\u043D\xBB \xB7 onAI Academy",
    dates,
    ctz: "Asia/Almaty",
    details: "\u0421\u0442\u0430\u0440\u0442 \u0432 20:00 \u043F\u043E \u0410\u043B\u043C\u0430\u0442\u044B. \u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u044D\u0444\u0438\u0440 \u043F\u0440\u0438\u0434\u0451\u0442 \u0432 \u0433\u0440\u0443\u043F\u043F\u0443 WhatsApp \u0438\u043B\u0438 \u0432 Telegram-\u0431\u043E\u0442.",
    location: "\u041E\u043D\u043B\u0430\u0439\u043D"
  });
  res.writeHead(302, { Location: `https://calendar.google.com/calendar/render?${params.toString()}` });
  res.end();
}
function readVersion() {
  try {
    return (0, import_node_fs7.readFileSync)((0, import_node_path7.join)(__dirname, "VERSION"), "utf8").trim() || "dev";
  } catch {
    return "dev";
  }
}
function handleHealth(res) {
  return json(
    res,
    200,
    {
      ok: true,
      funnel: "thank-you",
      thankYou: THANKYOU_URL,
      whatsapp: readWhatsAppLink(),
      tgBot: tgHealth(),
      version: readVersion()
    },
    { "Cache-Control": "no-store" }
  );
}
var server = (0, import_node_http.createServer)(async (req, res) => {
  const url = (req.url || "").split("?")[0].replace(/\/+$/, "") || "/";
  const method = req.method || "GET";
  try {
    if (method === "POST" && url === "/api/lead") return await handleLead(req, res);
    if (method === "POST" && url === "/api/reconcile") return await handleReconcile(req, res);
    if (method === "GET" && url === "/api/whatsapp-link") return handleWhatsAppLink(res);
    if (method === "GET" && url === "/calendar") return handleCalendar(res);
    if (method === "POST" && url === "/api/tg-link") return await handleTgLink(req, res);
    if (method === "POST" && url === "/api/tg-workshop") return await handleTgWorkshop(req, res);
    if (method === "POST" && url === "/api/ty-click") return await handleTyClick(req, res);
    if ((method === "GET" || method === "HEAD") && url.startsWith("/api/go/")) return handleGo(req, res, url.slice("/api/go/".length));
    if (method === "GET" && (url === "/api/health" || url === "/health")) return handleHealth(res);
    return json(res, 404, { ok: false, error: "not_found" });
  } catch (err) {
    console.error("[form-api] %s %s \u2192", method, url, err);
    if (!res.headersSent) json(res, 500, { ok: false, error: "internal" });
  }
});
process.on("unhandledRejection", (err) => console.error("[form-api] unhandledRejection", err));
process.on("uncaughtException", (err) => console.error("[form-api] uncaughtException", err));
try {
  initTgWorkshop();
  startScheduler();
} catch (err) {
  console.error("[form-api] tg-\u0431\u043E\u0442 \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D:", err);
}
server.listen(PORT, HOST, () => {
  console.log(`[form-api] listening on http://${HOST}:${PORT}`);
});
