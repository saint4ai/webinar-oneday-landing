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
var import_node_crypto3 = require("node:crypto");
var import_node_fs3 = require("node:fs");
var import_node_path3 = require("node:path");

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

// lib/easybot/register.ts
var DEFAULT_CHATBOT_ID = "079c01a7-a882-4ea2-a9ea-282520dbb870";
var TIMEOUT_MS = 3500;
async function registerEasybotLead(input) {
  const chatbotId = process.env.EASYBOT_CHATBOT_ID || DEFAULT_CHATBOT_ID;
  const url = `https://my.easybot.kz/api/main/webinar/${chatbotId}/register/`;
  const body = {
    form_name: input.name,
    phone_number: input.phone.replace(/[^\d+]/g, ""),
    email: "",
    location: (input.location || "onai.academy/workshop").slice(0, 100),
    utm_source: input.utm?.utm_source || "",
    utm_medium: input.utm?.utm_medium || "",
    utm_campaign: input.utm?.utm_campaign || "",
    utm_term: input.utm?.utm_term || "",
    utm_content: input.utm?.utm_content || ""
  };
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    let s = (await res.text()).trim();
    try {
      const parsed = JSON.parse(s);
      if (typeof parsed === "string") s = parsed;
    } catch {
    }
    if (!/^https?:\/\//i.test(s)) return { ok: false, reason: "no_url" };
    let botUrl = s;
    try {
      botUrl = new URL(s).toString();
    } catch {
    }
    return { ok: true, botUrl };
  } catch (e) {
    return { ok: false, reason: String(e).slice(0, 60) };
  }
}

// lib/easybot/redirect.ts
var EASYBOT_DIRECT = "https://my.easybot.kz/api/?hash=%3C5kKKpd0H%3E";
function buildStaticEasybotUrl(utm) {
  try {
    const params = new URLSearchParams();
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content"
    ]) {
      const v = utm?.[k];
      if (v) params.set(k, v);
    }
    const qs = params.toString();
    return qs ? `${EASYBOT_DIRECT}&${qs}` : EASYBOT_DIRECT;
  } catch {
    return EASYBOT_DIRECT;
  }
}
function resolveEasybotRedirect(botUrl, utm) {
  if (botUrl && /^https?:\/\//i.test(botUrl)) return botUrl;
  return buildStaticEasybotUrl(utm);
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
var FALLBACK = process.env.WHATSAPP_COMMUNITY_FALLBACK || "https://chat.whatsapp.com/JVdWLXG9L8jCTUp2W2vxeu";
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

// form-api/server.ts
function loadEnv() {
  try {
    const raw = (0, import_node_fs3.readFileSync)(process.env.FORM_API_ENV || (0, import_node_path3.join)(__dirname, ".env"), "utf8");
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
  const metaEventId = eventId || (0, import_node_crypto3.randomUUID)();
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
  const FUNNEL_REDIRECT = process.env.FUNNEL_REDIRECT === "easybot" ? "easybot" : "whatsapp";
  const WHATSAPP_GROUP = "https://chat.whatsapp.com/JVdWLXG9L8jCTUp2W2vxeu";
  let redirect;
  if (FUNNEL_REDIRECT === "easybot") {
    const easybot = await registerEasybotLead({ name: cleanName, phone: cleanPhone, utm, location: siteUrl });
    redirect = resolveEasybotRedirect(easybot.botUrl, utm);
  } else {
    redirect = WHATSAPP_GROUP;
  }
  return json(res, 200, { ok: true, redirect });
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
var THANKYOU_URL = "https://onai.academy/workshop/thank-you";
function secretOk(provided) {
  if (!TG_SECRET || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(TG_SECRET);
  if (a.length !== b.length) return false;
  return (0, import_node_crypto3.timingSafeEqual)(a, b);
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
  if (!secretOk(Array.isArray(headerSecret) ? headerSecret[0] : headerSecret)) {
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
var ALMATY_OFFSET_MS = 5 * 60 * 60 * 1e3;
function handleCalendar(res) {
  const nowAlmaty = new Date(Date.now() + ALMATY_OFFSET_MS);
  const cutoff = nowAlmaty.getUTCHours() * 60 + nowAlmaty.getUTCMinutes();
  const target = new Date(nowAlmaty);
  if (cutoff >= 19 * 60 + 45) target.setUTCDate(target.getUTCDate() + 1);
  const y = target.getUTCFullYear();
  const m = String(target.getUTCMonth() + 1).padStart(2, "0");
  const d = String(target.getUTCDate()).padStart(2, "0");
  const dates = `${y}${m}${d}T200000/${y}${m}${d}T220000`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "\u0412\u043E\u0440\u043A\u0448\u043E\u043F \u043F\u043E \u0432\u0430\u0439\u0431\u043A\u043E\u0434\u0438\u043D\u0433\u0443 \u2014 onAI Academy",
    dates,
    ctz: "Asia/Almaty",
    details: "\u0421\u0442\u0430\u0440\u0442 \u0432 20:00 \u043F\u043E \u0410\u043B\u043C\u0430\u0442\u044B. \u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u044D\u0444\u0438\u0440 \u043F\u0440\u0438\u0434\u0451\u0442 \u0432 WhatsApp \u0437\u0430 5 \u043C\u0438\u043D\u0443\u0442 \u0434\u043E \u043D\u0430\u0447\u0430\u043B\u0430.",
    location: "\u041E\u043D\u043B\u0430\u0439\u043D"
  });
  res.writeHead(302, { Location: `https://calendar.google.com/calendar/render?${params.toString()}` });
  res.end();
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
    if (method === "GET" && url === "/health") return json(res, 200, { ok: true });
    return json(res, 404, { ok: false, error: "not_found" });
  } catch (err) {
    console.error("[form-api] %s %s \u2192", method, url, err);
    if (!res.headersSent) json(res, 500, { ok: false, error: "internal" });
  }
});
process.on("unhandledRejection", (err) => console.error("[form-api] unhandledRejection", err));
process.on("uncaughtException", (err) => console.error("[form-api] uncaughtException", err));
server.listen(PORT, HOST, () => {
  console.log(`[form-api] listening on http://${HOST}:${PORT}`);
});
