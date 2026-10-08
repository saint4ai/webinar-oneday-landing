"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// form-api/server.ts
var server_exports = {};
__export(server_exports, {
  server: () => server
});
module.exports = __toCommonJS(server_exports);
var import_node_http = require("node:http");
var import_node_crypto7 = require("node:crypto");
var import_node_fs11 = require("node:fs");
var import_node_path11 = require("node:path");

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
    const q2 = `status=in.(pending,failed)&retry_count=lt.${maxRetry}&order=created_at.asc&limit=${limit}`;
    const res = await fetch(`${SUPA_URL}/rest/v1/${TABLE}?${q2}`, {
      headers: headers()
    });
    if (!res.ok) return [];
    return await res.json().catch(() => []);
  } catch {
    return [];
  }
}

// lib/leads/telegram-nick.ts
var TG_UTM_KEY = "telegram";
function normalizeTelegram(raw) {
  if (typeof raw !== "string") return "";
  let s = raw.slice(0, 300).replace(/\s+/g, "");
  s = s.replace(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me|telegram\.dog)\//i, "");
  s = s.replace(/^@+/, "");
  s = s.replace(/[/?#].*$/, "");
  return /^[A-Za-z0-9_]{4,32}$/.test(s) ? s : "";
}
function packUtm(utm, telegram) {
  const out = {};
  for (const [k, v] of Object.entries(utm ?? {})) if (k !== TG_UTM_KEY) out[k] = v;
  if (telegram) out[TG_UTM_KEY] = telegram;
  return Object.keys(out).length ? out : null;
}
function unpackUtm(raw) {
  if (!raw || typeof raw !== "object") return {};
  const utm = {};
  for (const [k, v] of Object.entries(raw)) if (k !== TG_UTM_KEY) utm[k] = v;
  const telegram = normalizeTelegram(raw[TG_UTM_KEY]);
  return {
    ...Object.keys(utm).length ? { utm } : {},
    ...telegram ? { telegram } : {}
  };
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
    // В workshop_leads нет колонки под Telegram: ник едет в jsonb utm (ключ telegram), без миграции.
    utm: packUtm(input.utm, input.telegram),
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
  let text2 = "";
  try {
    text2 = (0, import_node_fs.readFileSync)(LOG_PATH, "utf8");
  } catch {
    return 0;
  }
  const rows = [];
  for (const line of text2.split("\n")) {
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
      utm: packUtm(e.utm ?? void 0, normalizeTelegram(e.telegram)),
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
    if (input.telegram && leadId) await addWorkshopLeadTelegramNote(leadId, input.telegram);
    return { ok: true, leadId };
  } catch (err) {
    console.error("[amocrm] fetch threw:", err);
    return { ok: false, reason: "exception", error: err };
  }
}
async function addWorkshopLeadTelegramNote(leadId, telegram) {
  const token = process.env.AMOCRM_ACCESS_TOKEN;
  const domain = process.env.AMOCRM_DOMAIN || "platformonaiacademy";
  if (!token || !telegram) return false;
  try {
    const res = await fetch(`https://${domain}.amocrm.ru/api/v4/leads/${leadId}/notes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([{ note_type: "common", params: { text: `Telegram \u0434\u043B\u044F \u0441\u0432\u044F\u0437\u0438: @${telegram}` } }])
    });
    if (!res.ok) {
      console.error("[amocrm] note %d \u0434\u043B\u044F \u0441\u0434\u0435\u043B\u043A\u0438 %s (Telegram \u0443\u043A\u0430\u0437\u0430\u043D)", res.status, leadId);
      return false;
    }
    console.log("[amocrm] note \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E \u043A \u0441\u0434\u0435\u043B\u043A\u0435 %s (Telegram \u0443\u043A\u0430\u0437\u0430\u043D)", leadId);
    return true;
  } catch {
    console.error("[amocrm] note \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \u0434\u043B\u044F \u0441\u0434\u0435\u043B\u043A\u0438 %s (Telegram \u0443\u043A\u0430\u0437\u0430\u043D)", leadId);
    return false;
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
      if (lead.telegram) await addWorkshopLeadTelegramNote(found.leadId, lead.telegram);
      await markDone(lead.id, found.leadId);
      return { ok: true, leadId: found.leadId, adopted: true };
    }
  }
  const r = await createWorkshopLead({
    name: lead.name,
    phone: lead.phone,
    source: lead.source ?? "landing",
    utm: lead.utm,
    fbclid: lead.fbclid,
    telegram: lead.telegram
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
  const text2 = [
    "\u{1F534} <b>\u041B\u0438\u0434 \u041D\u0415 \u0441\u043E\u0437\u0434\u0430\u043D \u0432 amoCRM</b> (\u0440\u0435\u0442\u0440\u0430\u0438 \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D\u044B)",
    `\u0418\u043C\u044F: <b>${esc(lead.name)}</b>`,
    `\u0422\u0435\u043B\u0435\u0444\u043E\u043D: <code>${esc(lead.phone)}</code>`,
    ...lead.telegram ? [`Telegram: <code>@${esc(lead.telegram)}</code>`] : [],
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
          text: text2,
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
    for (const c of ty.rows) if (c && c.day && (c.ch === "tg" || c.ch === "wa" || c.ch === "wa-template")) this.countTy(c.ch, c.eid || "", c.day);
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
  /** chat_id всех, кто записывался на эфир дня D (по start и rejoin). Для мини-приложения админки. */
  registeredOn(day) {
    return [...this.regDays.get(day) ?? []];
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
   * Клик по кнопке Telegram или WhatsApp на странице «Спасибо» (или переход по ссылке из шаблона WABA). Повтор того же eid за день не
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
    const q2 = query.trim();
    if (/^-?\d+$/.test(q2)) return this.subs.get(Number(q2));
    const name = q2.replace(/^@/, "").toLowerCase();
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
    if (aud === "clickedNotPaid") return this.clicks.has(_TgStore.clickKey(s.chatId, day)) && !s.paid;
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
      name: String(row.name ?? "").trim().slice(0, 120),
      phone: String(row.phone ?? "").trim().slice(0, 40),
      telegram: normalizeTelegram(row.telegram),
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
function periodFromDates(from, to) {
  if (!isDayKey(from) || !isDayKey(to) || from > to) return null;
  const days = daysBetween(from, to);
  if (days.length >= RANGE_MAX_DAYS && days[days.length - 1] !== to) return null;
  const label = from === to ? dateLabel(from) : `${dateLabel(from)} - ${dateLabel(to)}`;
  return { key: "r", from, to, days, label };
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
  const header2 = ["\u0434\u0430\u0442\u0430", ...keys.map((k) => k === null ? "\u043F\u0440\u043E\u0447\u0438\u0435" : k.length > 12 ? k.slice(0, 11) + "\u2026" : k), "\u0432\u0441\u0435\u0433\u043E"];
  const table = p.days.map((d) => {
    const cs = keys.map((k) => colCell(d, k));
    return [ddmm(d), ...cs.map(fmt), fmt(cs.reduce(add, zero()))];
  });
  const foot = keys.map((k) => p.days.reduce((a, d) => add(a, colCell(d, k)), zero()));
  const footer = ["\u0438\u0442\u043E\u0433\u043E", ...foot.map(fmt), fmt(foot.reduce(add, zero()))];
  const note = "\u0432 \u0441\u043A\u043E\u0431\u043A\u0430\u0445 \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0438\u0437 \u043D\u0438\u0445 \u0434\u043E\u0448\u043B\u0438 \u0434\u043E \u0431\u043E\u0442\u0430; \u043C\u0435\u0442\u043A\u0438 \u0432\u0440\u043E\u0434\u0435 2gis \u0438\u0434\u0443\u0442 \u0441\u0440\u0430\u0437\u0443 \u0432 \u0431\u043E\u0442\u0430";
  const build = (from2) => {
    const rows = table.slice(from2);
    const w = header2.map((h, i) => Math.max(h.length, footer[i].length, ...rows.map((r) => r[i].length)));
    const ln = (r) => r.map((c, i) => c.padEnd(w[i])).join("  ").trimEnd();
    const pre = [ln(header2), ...rows.map(ln), ln(footer)].map(esc2).join("\n");
    const cut = from2 > 0 ? `
\u043F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 ${rows.length} \u0434\u043D. \u0438\u0437 ${table.length}` : "";
    return `${head}
${note}${cut}
<pre>${pre}</pre>`;
  };
  let from = 0;
  let text2 = build(from);
  while (text2.length > MSG_LIMIT && from < table.length - 1) text2 = build(++from);
  return text2;
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
  const rt2 = runtime.events;
  const cntRt = (t) => rt2.filter((e) => e.type === t).length;
  const skipped = rt2.filter((e) => e.type === "skipLate");
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
function adminAppIds() {
  const raw = process.env.ADMIN_APP_IDS;
  return (raw === void 0 ? "789638302" : raw).split(",").map((s) => s.trim()).filter(Boolean);
}
function isAdminAppUser(userId) {
  return userId !== void 0 && adminAppIds().includes(String(userId));
}
var adminAppUrl = () => env("ADMIN_APP_URL") || "https://onai.academy/workshop/api/admin-app";
var privacyUrl = () => env("PRIVACY_URL") || "https://onai.academy/workshop-montazh/privacy";
var GO_BASE = "https://onai.academy/workshop/api/go";
var MAX_UPDATE_BODY = 64 * 1024;
var API_TIMEOUT_MS = 1e4;
var DEFAULT_BIZON = "https://start.bizon365.ru/room/196985/BguY0kXF-l";
var DEFAULT_REJOIN_ACK = "\u0413\u043E\u0442\u043E\u0432\u043E, \u0441\u0441\u044B\u043B\u043A\u0443 \u043F\u0440\u0438\u0448\u043B\u044E \u0441\u044E\u0434\u0430 \u0432 19:50.";
var OTHER_THROTTLE_MS = 10 * 6e4;
var SEEN_UPDATES = 1e3;
var AUDIENCES = ["all", "clicked", "notClicked", "notPaid", "clickedNotPaid"];
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
  if (!isObj(m) || m.type !== "photo" && m.type !== "video" && m.type !== "document" || typeof m.url !== "string" || !/^https:\/\//.test(m.url)) {
    throw new Error(`${where}: media \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C { type: photo|video|document, url: https://... }`);
  }
  if (m.type === "document" && !/^https:\/\/[^\s?#]+\.pdf$/i.test(m.url)) {
    throw new Error(`${where}: \u0443 media document \u0430\u0434\u0440\u0435\u0441 \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C https \u0438 \u043E\u043A\u0430\u043D\u0447\u0438\u0432\u0430\u0442\u044C\u0441\u044F \u043D\u0430 .pdf`);
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
async function botCall(method, params, timeoutMs2 = API_TIMEOUT_MS) {
  const token = botToken();
  if (!token) return { ok: false, code: 0, description: "no_token" };
  try {
    const init = params instanceof FormData ? { method: "POST", body: params } : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) };
    const res = await fetch(`${apiBase()}/bot${token}/${method}`, { ...init, signal: AbortSignal.timeout(timeoutMs2) });
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
function pauseAll(seconds2) {
  pausedUntil = Math.max(pausedUntil, Date.now() + Math.min(60, Math.max(0, seconds2)) * 1e3 + 250);
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
  const isDoc = media.type === "document";
  const method = isVideo ? "sendVideo" : isDoc ? "sendDocument" : "sendPhoto";
  const field = isVideo ? "video" : isDoc ? "document" : "photo";
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
      const id = isVideo ? r.result?.video?.file_id : isDoc ? r.result?.document?.file_id : largest(r.result?.photo);
      if (id) st.setMedia(media.url, id);
    }
    if (isVideo && media.poster && used[1] === media.poster) {
      const cover = largest(r.result?.video?.cover);
      if (cover) st.setMedia(media.poster, cover);
    }
  }
  return toSend(r);
}
async function plain(chatId, text2, markup) {
  return toSend(
    await botSend("sendMessage", {
      chat_id: chatId,
      text: text2.slice(0, 4e3),
      link_preview_options: { is_disabled: true },
      ...markup ? { reply_markup: { inline_keyboard: markup } } : {}
    })
  );
}
async function sendPhotoBytes(chatId, data, caption) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  if (caption) form.append("caption", caption);
  form.append("photo", new Blob([new Uint8Array(data)], { type: "image/png" }), "qr.png");
  await acquireSlot("hi");
  return toSend(await botCall("sendPhoto", form, 3e4));
}
async function notifyOwners(text2) {
  let delivered = 0;
  for (const id of ownerIds()) {
    const n = Number(id);
    if (Number.isFinite(n) && (await plain(n, text2)).ok) delivered++;
  }
  return delivered;
}
async function notifyOwnersHtml(text2, markup) {
  let delivered = 0;
  for (const id of ownerIds()) {
    const n = Number(id);
    if (Number.isFinite(n) && (await sendText(n, text2, markup)).ok) delivered++;
  }
  return delivered;
}
var mediaWarned = /* @__PURE__ */ new Set();
async function warnMedia(media, error) {
  const url = media.url;
  if (mediaWarned.has(url)) return;
  mediaWarned.add(url);
  if (media.type === "document") {
    await notifyOwners(`\u041D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u043B\u0441\u044F \u0444\u0430\u0439\u043B ${url}: ${error || "\u043E\u0448\u0438\u0431\u043A\u0430"}. \u0428\u043B\u044E \u0442\u043E\u0442 \u0436\u0435 \u0442\u0435\u043A\u0441\u0442 \u0431\u0435\u0437 \u043D\u0435\u0433\u043E. \u041F\u0440\u043E\u0432\u0435\u0440\u044C, \u0447\u0442\u043E \u0444\u0430\u0439\u043B \u0432\u044B\u043B\u043E\u0436\u0435\u043D \u043D\u0430 \u0441\u0430\u0439\u0442.`);
    return;
  }
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
  void warnMedia(c.media, m.error);
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
var OWNER_CMDS = /* @__PURE__ */ new Set(["stats", "admin", "app", "series", "series_on", "series_off", "preview", "fire", "paid", "reload", "at", "off", "on", "bizon", "wa", "wa_qr", "wa_pause", "wa_resume", "wa_new", "wa_send", "wa_ai", "wa_ai_test", "wa_dozhim", "wa_dozhim_test"]);
var waHook = null;
var waReport = null;
function registerWa(h) {
  waHook = h;
}
function registerWaReport(h) {
  waReport = h;
}
var HELP_TEXT = [
  "\u041A\u043E\u043C\u0430\u043D\u0434\u044B \u0432\u043B\u0430\u0434\u0435\u043B\u044C\u0446\u0430:",
  "/admin: \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430 (\u0437\u0430\u044F\u0432\u043A\u0438, \u0431\u043E\u0442, UTM \u043F\u043E \u0434\u043D\u044F\u043C, \u043E\u0448\u0438\u0431\u043A\u0438), \u0432\u044B\u0431\u043E\u0440 \u043F\u0435\u0440\u0438\u043E\u0434\u0430 \u0438 \u0434\u0430\u0442\u044B. /stats \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0442\u043E \u0436\u0435",
  "/app: \u043C\u0438\u043D\u0438-\u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0430\u0434\u043C\u0438\u043D\u043A\u0438 (\u043A\u043D\u043E\u043F\u043A\u0430, \u0432\u0445\u043E\u0434 \u043F\u043E \u043F\u0430\u0440\u043E\u043B\u044E): \u0441\u0432\u043E\u0434\u043A\u0430, \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0438, \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438, \u043F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u0438, \u044D\u0444\u0438\u0440\u044B, \u043E\u0448\u0438\u0431\u043A\u0438",
  "/series: \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u043D\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F",
  "/preview: \u043F\u0440\u0438\u0441\u043B\u0430\u0442\u044C \u0441\u0435\u0431\u0435 \u0432\u0441\u044E \u0441\u0435\u0440\u0438\u044E \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438",
  "/fire <id>: \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0441\u0435\u0439\u0447\u0430\u0441 (\u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0440\u0435\u0432\u044C\u044E, \u043F\u043E\u0442\u043E\u043C \u043A\u043D\u043E\u043F\u043A\u0430 \xAB\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C\xBB)",
  "/at <id> HH:MM: \u0441\u0434\u0432\u0438\u043D\u0443\u0442\u044C \u0432\u0440\u0435\u043C\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F (/at <id> reset \u0432\u0435\u0440\u043D\u0451\u0442 \u043A\u0430\u043A \u0432 json)",
  "/off <id>, /on <id>: \u0432\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0438\u043B\u0438 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435",
  "/bizon <\u0441\u0441\u044B\u043B\u043A\u0430>: \u0441\u043C\u0435\u043D\u0438\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443 \u044D\u0444\u0438\u0440\u0430",
  "/paid <chat_id \u0438\u043B\u0438 @username>: \u043E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043E\u043F\u043B\u0430\u0442\u0443",
  "/reload: \u043F\u0435\u0440\u0435\u0447\u0438\u0442\u0430\u0442\u044C tg-series.json",
  "/series_on, /series_off: \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0438\u043B\u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0441\u0435\u0440\u0438\u044E",
  "/wa: \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 WhatsApp (\u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435, \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u044D\u0444\u0438\u0440\u0430, \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438, \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435)",
  "/wa_qr: QR \u0434\u043B\u044F \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043D\u043E\u043C\u0435\u0440\u0430 WhatsApp, \u043D\u0435 \u0447\u0430\u0449\u0435 \u0440\u0430\u0437\u0430 \u0432 \u043C\u0438\u043D\u0443\u0442\u0443",
  "/wa_pause, /wa_resume: \u043F\u0430\u0443\u0437\u0430 \u0438 \u0432\u043E\u0437\u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 WhatsApp-\u0440\u0430\u0441\u0441\u044B\u043B\u043A\u0438",
  "/wa_new [\u0434\u0430\u0442\u0430]: \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0433\u043E \u044D\u0444\u0438\u0440\u0430 \u0441\u0435\u0439\u0447\u0430\u0441",
  "/wa_send <id>: \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0441\u0435\u0440\u0438\u0438 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u0435\u0433\u043E \u044D\u0444\u0438\u0440\u0430",
  "/wa_ai on|off: \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0438\u043B\u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430 \u0432 \u043B\u0438\u0447\u043A\u0435 WhatsApp (\u0431\u0435\u0437 \u0430\u0440\u0433\u0443\u043C\u0435\u043D\u0442\u0430: \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435)",
  "/wa_ai_test <\u0432\u043E\u043F\u0440\u043E\u0441>: \u043E\u0442\u0432\u0435\u0442 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430 \u0431\u0435\u0437 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0432 WhatsApp",
  "/wa_dozhim on|off: \u0434\u043E\u0436\u0438\u043C \xAB\u043D\u0435 \u0432\u0441\u0442\u0443\u043F\u0438\u043B\xBB \u0447\u0435\u0440\u0435\u0437 WABA (\u0431\u0435\u0437 \u0430\u0440\u0433\u0443\u043C\u0435\u043D\u0442\u0430: \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435)",
  "/wa_dozhim_test <\u043D\u043E\u043C\u0435\u0440>: \u0442\u0435\u0441\u0442 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0434\u043E\u0436\u0438\u043C\u0430 \u043D\u0430 \u043D\u043E\u043C\u0435\u0440",
  "",
  "\u041C\u0435\u0442\u043A\u0430 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0430: \u0434\u043E\u0431\u0430\u0432\u044C ?start=2gis \u043A \u0441\u0441\u044B\u043B\u043A\u0435 \u043D\u0430 \u0431\u043E\u0442\u0430 (t.me/workshop_aiprod_bot?start=2gis), \u0432 \u043E\u0442\u0447\u0451\u0442\u0430\u0445 \u043E\u043D\u0430 \u043F\u043E\u043A\u0430\u0436\u0435\u0442\u0441\u044F \u043A\u0430\u043A \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A."
].join("\n");
function parseCommand(text2) {
  const m = /^\/([A-Za-z0-9_]+)(?:@[A-Za-z0-9_]+)?(?:\s+([\s\S]*))?$/.exec(text2.trim());
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
  const text2 = (m.text || "").trim();
  if (!text2) return;
  const c = parseCommand(text2);
  if (c?.cmd === "start") return onStart(m, cleanPayload(c.args), now);
  if (c?.cmd === "stop") return onStop(m, now);
  if (c?.cmd === "privacy") {
    await plain(m.chat.id, `\u041F\u043E\u043B\u0438\u0442\u0438\u043A\u0430 \u043A\u043E\u043D\u0444\u0438\u0434\u0435\u043D\u0446\u0438\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438: ${privacyUrl()}`);
    return;
  }
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
  let text2;
  let kb;
  let html = true;
  if (cb.action === "m") {
    text2 = adminHomeText(getStore(), activeSeries(), now);
    kb = menuKeyboard();
    html = false;
  } else if (cb.action === "d") {
    text2 = "\u0412\u044B\u0431\u0435\u0440\u0438 \u0434\u0435\u043D\u044C (\u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 14 \u0434\u043D\u0435\u0439) \u0438\u043B\u0438 \u0432\u0435\u0441\u044C \u043F\u0435\u0440\u0438\u043E\u0434:";
    kb = datePickerKeyboard(now);
    html = false;
  } else if (cb.action === "u") {
    text2 = renderUtmByDay(ctx, cb.period);
    kb = adminKeyboard(cb.period, "u");
  } else if (cb.action === "e") {
    text2 = renderErrors(ctx, cb.period);
    kb = adminKeyboard(cb.period, "e");
  } else {
    text2 = renderReport(ctx, cb.period);
    kb = adminKeyboard(cb.period, "p");
  }
  const body = {
    chat_id: chatId,
    text: text2,
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
var AUD_LABEL = {
  all: "\u0432\u0441\u0435",
  clicked: "\u043D\u0430\u0436\u0430\u0432\u0448\u0438\u043C",
  notClicked: "\u043D\u0435 \u043D\u0430\u0436\u0430\u0432\u0448\u0438\u043C",
  notPaid: "\u043D\u0435 \u043E\u043F\u043B\u0430\u0442\u0438\u0432\u0448\u0438\u043C",
  clickedNotPaid: "\u0431\u044B\u043B\u0438 \u043D\u0430 \u044D\u0444\u0438\u0440\u0435, \u043D\u0435 \u043E\u043F\u043B\u0430\u0442\u0438\u043B\u0438"
};
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
  const base = `\u042D\u0444\u0438\u0440 ${dateLabel(day)}: \u0437\u0430\u043F\u0438\u0441\u0430\u043B\u0438\u0441\u044C \u0432 \u0431\u043E\u0442\u0430 ${m.registered}, \u043F\u0435\u0440\u0435\u0448\u043B\u0438 \u043F\u043E \u043A\u043D\u043E\u043F\u043A\u0435 ${m.clicked} (${pct2(m.clicked, m.registered)}%), \u0441\u043E \xAB\u0421\u043F\u0430\u0441\u0438\u0431\u043E\xBB \u043D\u0430\u0436\u0430\u043B\u0438 Telegram ${st.tyCount(day, "tg")}, WhatsApp ${st.tyCount(day, "wa")}.`;
  let wa = "";
  try {
    wa = waReport ? waReport(day) : "";
  } catch {
    wa = "";
  }
  return wa ? `${base}
${wa}` : base;
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
    case "app":
      if (!isAdminAppUser(m.from?.id)) {
        await plain(chatId, "\u0410\u0434\u043C\u0438\u043D\u043A\u0430 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430.");
        return;
      }
      await plain(chatId, "\u0410\u0434\u043C\u0438\u043D\u043A\u0430 \u0432\u043E\u0440\u043A\u0448\u043E\u043F\u0430. \u041E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u0432\u043D\u0443\u0442\u0440\u0438 Telegram, \u0432\u0445\u043E\u0434 \u043F\u043E \u043F\u0430\u0440\u043E\u043B\u044E.", [[{ text: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0430\u0434\u043C\u0438\u043D\u043A\u0443", web_app: { url: adminAppUrl() } }]]);
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
        await plain(chatId, "\u0423\u043A\u0430\u0436\u0438 id \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F: /fire topic-p1. \u0421\u043F\u0438\u0441\u043E\u043A: /series");
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
    case "wa":
    case "wa_qr":
    case "wa_pause":
    case "wa_resume":
    case "wa_new":
    case "wa_send":
    case "wa_ai":
    case "wa_ai_test":
    case "wa_dozhim":
    case "wa_dozhim_test": {
      if (!waHook) {
        await plain(chatId, "\u041C\u043E\u0434\u0443\u043B\u044C WhatsApp \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D: \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 \u043D\u0435\u0442 WA_GROUPS=on \u0438\u043B\u0438 \u043E\u043D \u043D\u0435 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u043B\u0441\u044F (\u0441\u043C. /api/health).");
        return;
      }
      let reply2;
      try {
        reply2 = await waHook(cmd, args, now);
      } catch (e) {
        reply2 = { text: `\u041E\u0448\u0438\u0431\u043A\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u044B: ${scrub(String(e?.message || e))}` };
      }
      if (reply2.photo) {
        const r = await sendPhotoBytes(chatId, reply2.photo.data, reply2.photo.caption);
        if (!r.ok) reply2 = { text: `${reply2.text}

\u041A\u0430\u0440\u0442\u0438\u043D\u043A\u0443 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043D\u0435 \u0432\u044B\u0448\u043B\u043E: ${r.error}` };
      }
      await plain(chatId, reply2.text);
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
  if (ch !== "tg" && ch !== "wa" && ch !== "wa-template") return null;
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
    const text2 = renderDailyReport(adminCtx(now), day);
    if (await notifyOwnersHtml(text2, dailyKeyboard(day)) > 0) {
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

// form-api/tg-miniapp.ts
var import_node_crypto4 = require("node:crypto");
var import_node_fs7 = require("node:fs");
var import_node_path7 = require("node:path");

// form-api/tg-webapp-sdk.ts
var TG_WEBAPP_SDK = `// WebView
(function () {
  var eventHandlers = {};

  var locationHash = '';
  try {
    locationHash = location.hash.toString();
  } catch (e) {}

  var initParams = urlParseHashParams(locationHash);
  var storedParams = sessionStorageGet('initParams');
  if (storedParams) {
    for (var key in storedParams) {
      if (typeof initParams[key] === 'undefined') {
        initParams[key] = storedParams[key];
      }
    }
  }
  sessionStorageSet('initParams', initParams);

  var isIframe = false, iFrameStyle;
  try {
    isIframe = (window.parent != null && window != window.parent);
    if (isIframe) {
      window.addEventListener('message', function (event) {
        if (event.source !== window.parent) return;
        try {
          var dataParsed = JSON.parse(event.data);
        } catch (e) {
          return;
        }
        if (!dataParsed || !dataParsed.eventType) {
          return;
        }
        if (dataParsed.eventType == 'set_custom_style') {
          if (event.origin === 'https://web.telegram.org') {
            iFrameStyle.innerHTML = dataParsed.eventData;
          }
        } else if (dataParsed.eventType == 'reload_iframe') {
          try {
            window.parent.postMessage(JSON.stringify({eventType: 'iframe_will_reload'}), '*');
          } catch (e) {}
          location.reload();
        } else {
          receiveEvent(dataParsed.eventType, dataParsed.eventData);
        }
      });
      iFrameStyle = document.createElement('style');
      document.head.appendChild(iFrameStyle);
      try {
        window.parent.postMessage(JSON.stringify({eventType: 'iframe_ready', eventData: {reload_supported: true}}), '*');
      } catch (e) {}
    }
  } catch (e) {}

  function urlSafeDecode(urlencoded) {
    try {
      urlencoded = urlencoded.replace(/\\+/g, '%20');
      return decodeURIComponent(urlencoded);
    } catch (e) {
      return urlencoded;
    }
  }

  function urlParseHashParams(locationHash) {
    locationHash = locationHash.replace(/^#/, '');
    var params = {};
    if (!locationHash.length) {
      return params;
    }
    if (locationHash.indexOf('=') < 0 && locationHash.indexOf('?') < 0) {
      params._path = urlSafeDecode(locationHash);
      return params;
    }
    var qIndex = locationHash.indexOf('?');
    if (qIndex >= 0) {
      var pathParam = locationHash.substr(0, qIndex);
      params._path = urlSafeDecode(pathParam);
      locationHash = locationHash.substr(qIndex + 1);
    }
    var query_params = urlParseQueryString(locationHash);
    for (var k in query_params) {
      params[k] = query_params[k];
    }
    return params;
  }

  function urlParseQueryString(queryString) {
    var params = {};
    if (!queryString.length) {
      return params;
    }
    var queryStringParams = queryString.split('&');
    var i, param, paramName, paramValue;
    for (i = 0; i < queryStringParams.length; i++) {
      param = queryStringParams[i].split('=');
      paramName = urlSafeDecode(param[0]);
      paramValue = param[1] == null ? null : urlSafeDecode(param[1]);
      params[paramName] = paramValue;
    }
    return params;
  }

  // Telegram apps will implement this logic to add service params (e.g. tgShareScoreUrl) to game URL
  function urlAppendHashParams(url, addHash) {
    // url looks like 'https://game.com/path?query=1#hash'
    // addHash looks like 'tgShareScoreUrl=' + encodeURIComponent('tgb://share_game_score?hash=very_long_hash123')

    var ind = url.indexOf('#');
    if (ind < 0) {
      // https://game.com/path -> https://game.com/path#tgShareScoreUrl=etc
      return url + '#' + addHash;
    }
    var curHash = url.substr(ind + 1);
    if (curHash.indexOf('=') >= 0 || curHash.indexOf('?') >= 0) {
      // https://game.com/#hash=1 -> https://game.com/#hash=1&tgShareScoreUrl=etc
      // https://game.com/#path?query -> https://game.com/#path?query&tgShareScoreUrl=etc
      return url + '&' + addHash;
    }
    // https://game.com/#hash -> https://game.com/#hash?tgShareScoreUrl=etc
    if (curHash.length > 0) {
      return url + '?' + addHash;
    }
    // https://game.com/# -> https://game.com/#tgShareScoreUrl=etc
    return url + addHash;
  }

  function postEvent(eventType, callback, eventData) {
    if (!callback) {
      callback = function () {};
    }
    if (eventData === undefined) {
      eventData = '';
    }
    console.log('[Telegram.WebView] > postEvent', eventType, eventData);

    if (window.TelegramWebviewProxy !== undefined) {
      TelegramWebviewProxy.postEvent(eventType, JSON.stringify(eventData));
      callback();
    }
    else if (window.external && 'notify' in window.external) {
      window.external.notify(JSON.stringify({eventType: eventType, eventData: eventData}));
      callback();
    }
    else if (isIframe) {
      try {
        var trustedTarget = 'https://web.telegram.org';
        // For now we don't restrict target, for testing purposes
        trustedTarget = '*';
        window.parent.postMessage(JSON.stringify({eventType: eventType, eventData: eventData}), trustedTarget);
        callback();
      } catch (e) {
        callback(e);
      }
    }
    else {
      callback({notAvailable: true});
    }
  };

  function receiveEvent(eventType, eventData) {
    console.log('[Telegram.WebView] < receiveEvent', eventType, eventData);
    callEventCallbacks(eventType, function(callback) {
      callback(eventType, eventData);
    });
  }

  function callEventCallbacks(eventType, func) {
    var curEventHandlers = eventHandlers[eventType];
    if (curEventHandlers === undefined ||
        !curEventHandlers.length) {
      return;
    }
    for (var i = 0; i < curEventHandlers.length; i++) {
      try {
        func(curEventHandlers[i]);
      } catch (e) {}
    }
  }

  function onEvent(eventType, callback) {
    if (eventHandlers[eventType] === undefined) {
      eventHandlers[eventType] = [];
    }
    var index = eventHandlers[eventType].indexOf(callback);
    if (index === -1) {
      eventHandlers[eventType].push(callback);
    }
  };

  function offEvent(eventType, callback) {
    if (eventHandlers[eventType] === undefined) {
      return;
    }
    var index = eventHandlers[eventType].indexOf(callback);
    if (index === -1) {
      return;
    }
    eventHandlers[eventType].splice(index, 1);
  };

  function openProtoUrl(url) {
    if (!url.match(/^(web\\+)?tgb?:\\/\\/./)) {
      return false;
    }
    var useIframe = navigator.userAgent.match(/iOS|iPhone OS|iPhone|iPod|iPad/i) ? true : false;
    if (useIframe) {
      var iframeContEl = document.getElementById('tgme_frame_cont') || document.body;
      var iframeEl = document.createElement('iframe');
      iframeContEl.appendChild(iframeEl);
      var pageHidden = false;
      var enableHidden = function () {
        pageHidden = true;
      };
      window.addEventListener('pagehide', enableHidden, false);
      window.addEventListener('blur', enableHidden, false);
      if (iframeEl !== null) {
        iframeEl.src = url;
      }
      setTimeout(function() {
        if (!pageHidden) {
          window.location = url;
        }
        window.removeEventListener('pagehide', enableHidden, false);
        window.removeEventListener('blur', enableHidden, false);
      }, 2000);
    }
    else {
      window.location = url;
    }
    return true;
  }

  function sessionStorageSet(key, value) {
    try {
      window.sessionStorage.setItem('__telegram__' + key, JSON.stringify(value));
      return true;
    } catch(e) {}
    return false;
  }
  function sessionStorageGet(key) {
    try {
      return JSON.parse(window.sessionStorage.getItem('__telegram__' + key));
    } catch(e) {}
    return null;
  }

  if (!window.Telegram) {
    window.Telegram = {};
  }
  window.Telegram.WebView = {
    initParams: initParams,
    isIframe: isIframe,
    onEvent: onEvent,
    offEvent: offEvent,
    postEvent: postEvent,
    receiveEvent: receiveEvent,
    callEventCallbacks: callEventCallbacks
  };

  window.Telegram.Utils = {
    urlSafeDecode: urlSafeDecode,
    urlParseQueryString: urlParseQueryString,
    urlParseHashParams: urlParseHashParams,
    urlAppendHashParams: urlAppendHashParams,
    sessionStorageSet: sessionStorageSet,
    sessionStorageGet: sessionStorageGet
  };

  // For Windows Phone app
  window.TelegramGameProxy_receiveEvent = receiveEvent;

  // App backward compatibility
  window.TelegramGameProxy = {
    receiveEvent: receiveEvent
  };
})();

// WebApp
(function () {
  var Utils = window.Telegram.Utils;
  var WebView = window.Telegram.WebView;
  var initParams = WebView.initParams;
  var isIframe = WebView.isIframe;

  var WebApp = {};
  var webAppInitData = '', webAppInitDataUnsafe = {};
  var themeParams = {}, colorScheme = 'light';
  var webAppVersion = '6.0';
  var webAppPlatform = 'unknown';
  var webAppIsActive = true;
  var webAppIsFullscreen = false;
  var webAppIsOrientationLocked = false;
  var webAppBackgroundColor = 'bg_color';
  var webAppHeaderColorKey = 'bg_color';
  var webAppHeaderColor = null;

  if (initParams.tgWebAppData && initParams.tgWebAppData.length) {
    webAppInitData = initParams.tgWebAppData;
    webAppInitDataUnsafe = Utils.urlParseQueryString(webAppInitData);
    for (var key in webAppInitDataUnsafe) {
      var val = webAppInitDataUnsafe[key];
      try {
        if (val.substr(0, 1) == '{' && val.substr(-1) == '}' ||
            val.substr(0, 1) == '[' && val.substr(-1) == ']') {
          webAppInitDataUnsafe[key] = JSON.parse(val);
        }
      } catch (e) {}
    }
  }
  var stored_theme_params = Utils.sessionStorageGet('themeParams');
  if (initParams.tgWebAppThemeParams && initParams.tgWebAppThemeParams.length) {
    var themeParamsRaw = initParams.tgWebAppThemeParams;
    try {
      var theme_params = JSON.parse(themeParamsRaw);
      if (theme_params) {
        setThemeParams(theme_params);
      }
    } catch (e) {}
  }
  if (stored_theme_params) {
    setThemeParams(stored_theme_params);
  }
  var stored_def_colors = Utils.sessionStorageGet('defaultColors');
  if (initParams.tgWebAppDefaultColors && initParams.tgWebAppDefaultColors.length) {
    var defColorsRaw = initParams.tgWebAppDefaultColors;
    try {
      var def_colors = JSON.parse(defColorsRaw);
      if (def_colors) {
        setDefaultColors(def_colors);
      }
    } catch (e) {}
  }
  if (stored_def_colors) {
    setDefaultColors(stored_def_colors);
  }
  if (initParams.tgWebAppVersion) {
    webAppVersion = initParams.tgWebAppVersion;
  }
  if (initParams.tgWebAppPlatform) {
    webAppPlatform = initParams.tgWebAppPlatform;
  }

  var stored_fullscreen = Utils.sessionStorageGet('isFullscreen');
  if (initParams.tgWebAppFullscreen) {
    setFullscreen(true);
  }
  if (stored_fullscreen) {
    setFullscreen(stored_fullscreen == 'yes');
  }

  var stored_orientation_lock = Utils.sessionStorageGet('isOrientationLocked');
  if (stored_orientation_lock) {
    setOrientationLock(stored_orientation_lock == 'yes');
  }

  function onThemeChanged(eventType, eventData) {
    if (eventData.theme_params) {
      setThemeParams(eventData.theme_params);
      window.Telegram.WebApp.MainButton.setParams({});
      window.Telegram.WebApp.SecondaryButton.setParams({});
      updateHeaderColor();
      updateBackgroundColor();
      updateBottomBarColor();
      receiveWebViewEvent('themeChanged');
    }
  }

  var lastWindowHeight = window.innerHeight;
  function onViewportChanged(eventType, eventData) {
    if (eventData.height) {
      window.removeEventListener('resize', onWindowResize);
      setViewportHeight(eventData);
    }
  }

  function onWindowResize(e) {
    if (lastWindowHeight != window.innerHeight) {
      lastWindowHeight = window.innerHeight;
      receiveWebViewEvent('viewportChanged', {
        isStateStable: true
      });
    }
  }

  function onSafeAreaChanged(eventType, eventData) {
    if (eventData) {
      setSafeAreaInset(eventData);
    }
  }
  function onContentSafeAreaChanged(eventType, eventData) {
    if (eventData) {
      setContentSafeAreaInset(eventData);
    }
  }

  function onVisibilityChanged(eventType, eventData) {
    if (eventData.is_visible) {
      webAppIsActive = true;
      receiveWebViewEvent('activated');
    } else {
      webAppIsActive = false;
      receiveWebViewEvent('deactivated');
    }
  }

  function linkHandler(e) {
    if (e.metaKey || e.ctrlKey) return;
    var el = e.target;
    while (el.tagName != 'A' && el.parentNode) {
      el = el.parentNode;
    }
    if (el.tagName == 'A' &&
        el.target != '_blank' &&
        (el.protocol == 'http:' || el.protocol == 'https:') &&
        isTmeHostname(el.hostname)) {
      WebApp.openTelegramLink(el.href);
      e.preventDefault();
    }
  }

  function strTrim(str) {
    return str.toString().replace(/^\\s+|\\s+$/g, '');
  }

  function isTmeHostname(hostname) {
    hostname = hostname.toString().toLowerCase();
    return hostname == 't.me' || hostname == 'telegram.me';
  }

  function receiveWebViewEvent(eventType) {
    var args = Array.prototype.slice.call(arguments);
    eventType = args.shift();
    WebView.callEventCallbacks('webview:' + eventType, function(callback) {
      callback.apply(WebApp, args);
    });
  }

  function onWebViewEvent(eventType, callback) {
    WebView.onEvent('webview:' + eventType, callback);
  };

  function offWebViewEvent(eventType, callback) {
    WebView.offEvent('webview:' + eventType, callback);
  };

  function setCssProperty(name, value) {
    var root = document.documentElement;
    if (root && root.style && root.style.setProperty) {
      root.style.setProperty('--tg-' + name, value);
    }
  }

  function setFullscreen(is_fullscreen) {
    webAppIsFullscreen = !!is_fullscreen;
    Utils.sessionStorageSet('isFullscreen', webAppIsFullscreen ? 'yes' : 'no');
  }

  function setOrientationLock(is_locked) {
    webAppIsOrientationLocked = !!is_locked;
    Utils.sessionStorageSet('isOrientationLocked', webAppIsOrientationLocked ? 'yes' : 'no');
  }

  function setThemeParams(theme_params) {
    // temp iOS fix
    if (theme_params.bg_color == '#1c1c1d' &&
        theme_params.bg_color == theme_params.secondary_bg_color) {
      theme_params.secondary_bg_color = '#2c2c2e';
    }
    var color;
    for (var key in theme_params) {
      if (color = parseColorToHex(theme_params[key])) {
        themeParams[key] = color;
        if (key == 'bg_color') {
          colorScheme = isColorDark(color) ? 'dark' : 'light'
          setCssProperty('color-scheme', colorScheme);
        }
        key = 'theme-' + key.split('_').join('-');
        setCssProperty(key, color);
      }
    }
    Utils.sessionStorageSet('themeParams', themeParams);
  }

  function setDefaultColors(def_colors) {
    if (colorScheme == 'dark') {
      if (def_colors.bg_dark_color) {
        webAppBackgroundColor = def_colors.bg_dark_color;
      }
      if (def_colors.header_dark_color) {
        webAppHeaderColorKey = null;
        webAppHeaderColor = def_colors.header_dark_color;
      }
    } else {
      if (def_colors.bg_color) {
        webAppBackgroundColor = def_colors.bg_color;
      }
      if (def_colors.header_color) {
        webAppHeaderColorKey = null;
        webAppHeaderColor = def_colors.header_color;
      }
    }
    Utils.sessionStorageSet('defaultColors', def_colors);
  }

  var webAppCallbacks = {};
  function generateCallbackId(len) {
    var tries = 100;
    while (--tries) {
      var id = '', chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', chars_len = chars.length;
      for (var i = 0; i < len; i++) {
        id += chars[Math.floor(Math.random() * chars_len)];
      }
      if (!webAppCallbacks[id]) {
        webAppCallbacks[id] = {};
        return id;
      }
    }
    throw Error('WebAppCallbackIdGenerateFailed');
  }

  var viewportHeight = false, viewportStableHeight = false, isExpanded = true;
  function setViewportHeight(data) {
    if (typeof data !== 'undefined') {
      isExpanded = !!data.is_expanded;
      viewportHeight = data.height;
      if (data.is_state_stable) {
        viewportStableHeight = data.height;
      }
      receiveWebViewEvent('viewportChanged', {
        isStateStable: !!data.is_state_stable
      });
    }
    var height, stable_height;
    if (viewportHeight !== false) {
      height = (viewportHeight - bottomBarHeight) + 'px';
    } else {
      height = bottomBarHeight ? 'calc(100vh - ' + bottomBarHeight + 'px)' : '100vh';
    }
    if (viewportStableHeight !== false) {
      stable_height = (viewportStableHeight - bottomBarHeight) + 'px';
    } else {
      stable_height = bottomBarHeight ? 'calc(100vh - ' + bottomBarHeight + 'px)' : '100vh';
    }
    setCssProperty('viewport-height', height);
    setCssProperty('viewport-stable-height', stable_height);
  }

  var safeAreaInset = {top: 0, bottom: 0, left: 0, right: 0};
  function setSafeAreaInset(data) {
    if (typeof data !== 'undefined') {
      if (typeof data.top !== 'undefined') {
        safeAreaInset.top = data.top;
      }
      if (typeof data.bottom !== 'undefined') {
        safeAreaInset.bottom = data.bottom;
      }
      if (typeof data.left !== 'undefined') {
        safeAreaInset.left = data.left;
      }
      if (typeof data.right !== 'undefined') {
        safeAreaInset.right = data.right;
      }
      receiveWebViewEvent('safeAreaChanged');
    }
    setCssProperty('safe-area-inset-top', safeAreaInset.top + 'px');
    setCssProperty('safe-area-inset-bottom', safeAreaInset.bottom + 'px');
    setCssProperty('safe-area-inset-left', safeAreaInset.left + 'px');
    setCssProperty('safe-area-inset-right', safeAreaInset.right + 'px');
  }

  var contentSafeAreaInset = {top: 0, bottom: 0, left: 0, right: 0};
  function setContentSafeAreaInset(data) {
    if (typeof data !== 'undefined') {
      if (typeof data.top !== 'undefined') {
        contentSafeAreaInset.top = data.top;
      }
      if (typeof data.bottom !== 'undefined') {
        contentSafeAreaInset.bottom = data.bottom;
      }
      if (typeof data.left !== 'undefined') {
        contentSafeAreaInset.left = data.left;
      }
      if (typeof data.right !== 'undefined') {
        contentSafeAreaInset.right = data.right;
      }
      receiveWebViewEvent('contentSafeAreaChanged');
    }
    setCssProperty('content-safe-area-inset-top', contentSafeAreaInset.top + 'px');
    setCssProperty('content-safe-area-inset-bottom', contentSafeAreaInset.bottom + 'px');
    setCssProperty('content-safe-area-inset-left', contentSafeAreaInset.left + 'px');
    setCssProperty('content-safe-area-inset-right', contentSafeAreaInset.right + 'px');
  }

  var isClosingConfirmationEnabled = false;
  function setClosingConfirmation(need_confirmation) {
    if (!versionAtLeast('6.2')) {
      console.warn('[Telegram.WebApp] Closing confirmation is not supported in version ' + webAppVersion);
      return;
    }
    isClosingConfirmationEnabled = !!need_confirmation;
    WebView.postEvent('web_app_setup_closing_behavior', false, {need_confirmation: isClosingConfirmationEnabled});
  }

  var isVerticalSwipesEnabled = true;
  function toggleVerticalSwipes(enable_swipes) {
    if (!versionAtLeast('7.7')) {
      console.warn('[Telegram.WebApp] Changing swipes behavior is not supported in version ' + webAppVersion);
      return;
    }
    isVerticalSwipesEnabled = !!enable_swipes;
    WebView.postEvent('web_app_setup_swipe_behavior', false, {allow_vertical_swipe: isVerticalSwipesEnabled});
  }

  function onFullscreenChanged(eventType, eventData) {
    setFullscreen(eventData.is_fullscreen);
    receiveWebViewEvent('fullscreenChanged');
  }
  function onFullscreenFailed(eventType, eventData) {
    if (eventData.error == 'ALREADY_FULLSCREEN' && !webAppIsFullscreen) {
      setFullscreen(true);
    }
    receiveWebViewEvent('fullscreenFailed', {
      error: eventData.error
    });
  }

  function toggleOrientationLock(locked) {
    if (!versionAtLeast('8.0')) {
      console.warn('[Telegram.WebApp] Orientation locking is not supported in version ' + webAppVersion);
      return;
    }
    setOrientationLock(locked);
    WebView.postEvent('web_app_toggle_orientation_lock', false, {locked: webAppIsOrientationLocked});
  }

  var homeScreenCallbacks = [];
  function onHomeScreenAdded(eventType, eventData) {
    receiveWebViewEvent('homeScreenAdded');
  }
  function onHomeScreenChecked(eventType, eventData) {
    var status = eventData.status || 'unknown';
    if (homeScreenCallbacks.length > 0) {
      for (var i = 0; i < homeScreenCallbacks.length; i++) {
        var callback = homeScreenCallbacks[i];
        callback(status);
      }
      homeScreenCallbacks = [];
    }
    receiveWebViewEvent('homeScreenChecked', {
      status: status
    });
  }

  var WebAppShareMessageOpened = false;
  function onPreparedMessageSent(eventType, eventData) {
    if (WebAppShareMessageOpened) {
      var requestData = WebAppShareMessageOpened;
      WebAppShareMessageOpened = false;
      if (requestData.callback) {
        requestData.callback(true);
      }
      receiveWebViewEvent('shareMessageSent');
    }
  }
  function onPreparedMessageFailed(eventType, eventData) {
    if (WebAppShareMessageOpened) {
      var requestData = WebAppShareMessageOpened;
      WebAppShareMessageOpened = false;
      if (requestData.callback) {
        requestData.callback(false);
      }
      receiveWebViewEvent('shareMessageFailed', {
        error: eventData.error
      });
    }
  }

  var WebAppRequestChatOpened = false;
  function onRequestedChatSent(eventType, eventData) {
    if (WebAppRequestChatOpened) {
      var requestData = WebAppRequestChatOpened;
      WebAppRequestChatOpened = false;
      if (requestData.callback) {
        requestData.callback(true);
      }
      receiveWebViewEvent('requestedChatSent');
    }
  }
  function onRequestedChatFailed(eventType, eventData) {
    if (WebAppRequestChatOpened) {
      var requestData = WebAppRequestChatOpened;
      WebAppRequestChatOpened = false;
      if (requestData.callback) {
        requestData.callback(false);
      }
      receiveWebViewEvent('requestedChatFailed', {
        error: eventData.error
      });
    }
  }

  var WebAppEmojiStatusRequested = false;
  function onEmojiStatusSet(eventType, eventData) {
    if (WebAppEmojiStatusRequested) {
      var requestData = WebAppEmojiStatusRequested;
      WebAppEmojiStatusRequested = false;
      if (requestData.callback) {
        requestData.callback(true);
      }
      receiveWebViewEvent('emojiStatusSet');
    }
  }
  function onEmojiStatusFailed(eventType, eventData) {
    if (WebAppEmojiStatusRequested) {
      var requestData = WebAppEmojiStatusRequested;
      WebAppEmojiStatusRequested = false;
      if (requestData.callback) {
        requestData.callback(false);
      }
      receiveWebViewEvent('emojiStatusFailed', {
        error: eventData.error
      });
    }
  }
  var WebAppEmojiStatusAccessRequested = false;
  function onEmojiStatusAccessRequested(eventType, eventData) {
    if (WebAppEmojiStatusAccessRequested) {
      var requestData = WebAppEmojiStatusAccessRequested;
      WebAppEmojiStatusAccessRequested = false;
      if (requestData.callback) {
        requestData.callback(eventData.status == 'allowed');
      }
      receiveWebViewEvent('emojiStatusAccessRequested', {
        status: eventData.status
      });
    }
  }

  var webAppPopupOpened = false;
  function onPopupClosed(eventType, eventData) {
    if (webAppPopupOpened) {
      var popupData = webAppPopupOpened;
      webAppPopupOpened = false;
      var button_id = null;
      if (typeof eventData.button_id !== 'undefined') {
        button_id = eventData.button_id;
      }
      if (popupData.callback) {
        popupData.callback(button_id);
      }
      receiveWebViewEvent('popupClosed', {
        button_id: button_id
      });
    }
  }


  function getHeaderColor() {
    if (webAppHeaderColorKey == 'secondary_bg_color') {
      return themeParams.secondary_bg_color;
    } else if (webAppHeaderColorKey == 'bg_color') {
      return themeParams.bg_color;
    }
    return webAppHeaderColor;
  }
  function setHeaderColor(color) {
    if (!versionAtLeast('6.1')) {
      console.warn('[Telegram.WebApp] Header color is not supported in version ' + webAppVersion);
      return;
    }
    if (!versionAtLeast('6.9')) {
      if (themeParams.bg_color &&
          themeParams.bg_color == color) {
        color = 'bg_color';
      } else if (themeParams.secondary_bg_color &&
                 themeParams.secondary_bg_color == color) {
        color = 'secondary_bg_color';
      }
    }
    var head_color = null, color_key = null;
    if (color == 'bg_color' || color == 'secondary_bg_color') {
      color_key = color;
    } else if (versionAtLeast('6.9')) {
      head_color = parseColorToHex(color);
      if (!head_color) {
        console.error('[Telegram.WebApp] Header color format is invalid', color);
        throw Error('WebAppHeaderColorInvalid');
      }
    }
    if (!versionAtLeast('6.9') &&
        color_key != 'bg_color' &&
        color_key != 'secondary_bg_color') {
      console.error('[Telegram.WebApp] Header color key should be one of Telegram.WebApp.themeParams.bg_color, Telegram.WebApp.themeParams.secondary_bg_color, \\'bg_color\\', \\'secondary_bg_color\\'', color);
      throw Error('WebAppHeaderColorKeyInvalid');
    }
    webAppHeaderColorKey = color_key;
    webAppHeaderColor = head_color;
    updateHeaderColor();
  }
  var appHeaderColorKey = null, appHeaderColor = null;
  function updateHeaderColor() {
    if (appHeaderColorKey != webAppHeaderColorKey ||
        appHeaderColor != webAppHeaderColor) {
      appHeaderColorKey = webAppHeaderColorKey;
      appHeaderColor = webAppHeaderColor;
      if (appHeaderColor) {
        WebView.postEvent('web_app_set_header_color', false, {color: webAppHeaderColor});
      } else {
        WebView.postEvent('web_app_set_header_color', false, {color_key: webAppHeaderColorKey});
      }
    }
  }

  function getBackgroundColor() {
    if (webAppBackgroundColor == 'secondary_bg_color') {
      return themeParams.secondary_bg_color;
    } else if (webAppBackgroundColor == 'bg_color') {
      return themeParams.bg_color;
    }
    return webAppBackgroundColor;
  }
  function setBackgroundColor(color) {
    if (!versionAtLeast('6.1')) {
      console.warn('[Telegram.WebApp] Background color is not supported in version ' + webAppVersion);
      return;
    }
    var bg_color;
    if (color == 'bg_color' || color == 'secondary_bg_color') {
      bg_color = color;
    } else {
      bg_color = parseColorToHex(color);
      if (!bg_color) {
        console.error('[Telegram.WebApp] Background color format is invalid', color);
        throw Error('WebAppBackgroundColorInvalid');
      }
    }
    webAppBackgroundColor = bg_color;
    updateBackgroundColor();
  }
  var appBackgroundColor = null;
  function updateBackgroundColor() {
    var color = getBackgroundColor();
    if (appBackgroundColor != color) {
      appBackgroundColor = color;
      WebView.postEvent('web_app_set_background_color', false, {color: color});
    }
  }

  var bottomBarColor = 'bottom_bar_bg_color';
  function getBottomBarColor() {
    if (bottomBarColor == 'bottom_bar_bg_color') {
      return themeParams.bottom_bar_bg_color || themeParams.secondary_bg_color || '#ffffff';
    } else if (bottomBarColor == 'secondary_bg_color') {
      return themeParams.secondary_bg_color;
    } else if (bottomBarColor == 'bg_color') {
      return themeParams.bg_color;
    }
    return bottomBarColor;
  }
  function setBottomBarColor(color) {
    if (!versionAtLeast('7.10')) {
      console.warn('[Telegram.WebApp] Bottom bar color is not supported in version ' + webAppVersion);
      return;
    }
    var bg_color;
    if (color == 'bg_color' || color == 'secondary_bg_color' || color == 'bottom_bar_bg_color') {
      bg_color = color;
    } else {
      bg_color = parseColorToHex(color);
      if (!bg_color) {
        console.error('[Telegram.WebApp] Bottom bar color format is invalid', color);
        throw Error('WebAppBottomBarColorInvalid');
      }
    }
    bottomBarColor = bg_color;
    updateBottomBarColor();
    window.Telegram.WebApp.SecondaryButton.setParams({});
  }
  var appBottomBarColor = null;
  function updateBottomBarColor() {
    var color = getBottomBarColor();
    if (appBottomBarColor != color) {
      appBottomBarColor = color;
      WebView.postEvent('web_app_set_bottom_bar_color', false, {color: color});
    }
    if (initParams.tgWebAppDebug) {
      updateDebugBottomBar();
    }
  }


  function parseColorToHex(color) {
    color += '';
    var match;
    if (match = /^\\s*#([0-9a-f]{6})\\s*$/i.exec(color)) {
      return '#' + match[1].toLowerCase();
    }
    else if (match = /^\\s*#([0-9a-f])([0-9a-f])([0-9a-f])\\s*$/i.exec(color)) {
      return ('#' + match[1] + match[1] + match[2] + match[2] + match[3] + match[3]).toLowerCase();
    }
    else if (match = /^\\s*rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*(\\d+\\.{0,1}\\d*))?\\)\\s*$/.exec(color)) {
      var r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3]);
      r = (r < 16 ? '0' : '') + r.toString(16);
      g = (g < 16 ? '0' : '') + g.toString(16);
      b = (b < 16 ? '0' : '') + b.toString(16);
      return '#' + r + g + b;
    }
    return false;
  }

  function isColorDark(rgb) {
    rgb = rgb.replace(/[\\s#]/g, '');
    if (rgb.length == 3) {
      rgb = rgb[0] + rgb[0] + rgb[1] + rgb[1] + rgb[2] + rgb[2];
    }
    var r = parseInt(rgb.substr(0, 2), 16);
    var g = parseInt(rgb.substr(2, 2), 16);
    var b = parseInt(rgb.substr(4, 2), 16);
    var hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return hsp < 120;
  }

  function versionCompare(v1, v2) {
    if (typeof v1 !== 'string') v1 = '';
    if (typeof v2 !== 'string') v2 = '';
    v1 = v1.replace(/^\\s+|\\s+$/g, '').split('.');
    v2 = v2.replace(/^\\s+|\\s+$/g, '').split('.');
    var a = Math.max(v1.length, v2.length), i, p1, p2;
    for (i = 0; i < a; i++) {
      p1 = parseInt(v1[i]) || 0;
      p2 = parseInt(v2[i]) || 0;
      if (p1 == p2) continue;
      if (p1 > p2) return 1;
      return -1;
    }
    return 0;
  }

  function versionAtLeast(ver) {
    return versionCompare(webAppVersion, ver) >= 0;
  }

  function byteLength(str) {
    if (window.Blob) {
      try { return new Blob([str]).size; } catch (e) {}
    }
    var s = str.length;
    for (var i=str.length-1; i>=0; i--) {
      var code = str.charCodeAt(i);
      if (code > 0x7f && code <= 0x7ff) s++;
      else if (code > 0x7ff && code <= 0xffff) s+=2;
      if (code >= 0xdc00 && code <= 0xdfff) i--;
    }
    return s;
  }

  var BackButton = (function() {
    var isVisible = false;

    var backButton = {};
    Object.defineProperty(backButton, 'isVisible', {
      set: function(val){ setParams({is_visible: val}); },
      get: function(){ return isVisible; },
      enumerable: true
    });

    var curButtonState = null;

    WebView.onEvent('back_button_pressed', onBackButtonPressed);

    function onBackButtonPressed() {
      receiveWebViewEvent('backButtonClicked');
    }

    function buttonParams() {
      return {is_visible: isVisible};
    }

    function buttonState(btn_params) {
      if (typeof btn_params === 'undefined') {
        btn_params = buttonParams();
      }
      return JSON.stringify(btn_params);
    }

    function buttonCheckVersion() {
      if (!versionAtLeast('6.1')) {
        console.warn('[Telegram.WebApp] BackButton is not supported in version ' + webAppVersion);
        return false;
      }
      return true;
    }

    function updateButton() {
      var btn_params = buttonParams();
      var btn_state = buttonState(btn_params);
      if (curButtonState === btn_state) {
        return;
      }
      curButtonState = btn_state;
      WebView.postEvent('web_app_setup_back_button', false, btn_params);
    }

    function setParams(params) {
      if (!buttonCheckVersion()) {
        return backButton;
      }
      if (typeof params.is_visible !== 'undefined') {
        isVisible = !!params.is_visible;
      }
      updateButton();
      return backButton;
    }

    backButton.onClick = function(callback) {
      if (buttonCheckVersion()) {
        onWebViewEvent('backButtonClicked', callback);
      }
      return backButton;
    };
    backButton.offClick = function(callback) {
      if (buttonCheckVersion()) {
        offWebViewEvent('backButtonClicked', callback);
      }
      return backButton;
    };
    backButton.show = function() {
      return setParams({is_visible: true});
    };
    backButton.hide = function() {
      return setParams({is_visible: false});
    };
    return backButton;
  })();

  var debugBottomBar = null, debugBottomBarBtns = {}, bottomBarHeight = 0;
  if (initParams.tgWebAppDebug) {
    debugBottomBar = document.createElement('tg-bottom-bar');
    var debugBottomBarStyle = {
      display: 'flex',
      gap: '7px',
      font: '600 14px/18px sans-serif',
      width: '100%',
      background: getBottomBarColor(),
      position: 'fixed',
      left: '0',
      right: '0',
      bottom: '0',
      margin: '0',
      padding: '7px',
      textAlign: 'center',
      boxSizing: 'border-box',
      zIndex: '10000'
    };
    for (var k in debugBottomBarStyle) {
      debugBottomBar.style[k] = debugBottomBarStyle[k];
    }
    document.addEventListener('DOMContentLoaded', function onDomLoaded(event) {
      document.removeEventListener('DOMContentLoaded', onDomLoaded);
      document.body.appendChild(debugBottomBar);
    });
    var animStyle = document.createElement('style');
    animStyle.innerHTML = 'tg-bottom-button.shine { position: relative; overflow: hidden; } tg-bottom-button.shine:before { content:""; position: absolute; top: 0; width: 100%; height: 100%; background: linear-gradient(120deg, transparent, rgba(255, 255, 255, .2), transparent); animation: tg-bottom-button-shine 5s ease-in-out infinite; } @-webkit-keyframes tg-bottom-button-shine { 0% {left: -100%;} 12%,100% {left: 100%}} @keyframes tg-bottom-button-shine { 0% {left: -100%;} 12%,100% {left: 100%}}';
    debugBottomBar.appendChild(animStyle);
  }
  function updateDebugBottomBar() {
    var mainBtn = debugBottomBarBtns.main._bottomButton;
    var secondaryBtn = debugBottomBarBtns.secondary._bottomButton;
    if (mainBtn.isVisible || secondaryBtn.isVisible) {
      debugBottomBar.style.display = 'flex';
      bottomBarHeight = 58;
      if (mainBtn.isVisible && secondaryBtn.isVisible) {
        if (secondaryBtn.position == 'top') {
          debugBottomBar.style.flexDirection = 'column-reverse';
          bottomBarHeight += 51;
        } else if (secondaryBtn.position == 'bottom') {
          debugBottomBar.style.flexDirection = 'column';
          bottomBarHeight += 51;
        } else if (secondaryBtn.position == 'left') {
          debugBottomBar.style.flexDirection = 'row-reverse';
        } else if (secondaryBtn.position == 'right') {
          debugBottomBar.style.flexDirection = 'row';
        }
      }
    } else {
      debugBottomBar.style.display = 'none';
      bottomBarHeight = 0;
    }
    debugBottomBar.style.background = getBottomBarColor();
    if (document.documentElement) {
      document.documentElement.style.boxSizing = 'border-box';
      document.documentElement.style.paddingBottom = bottomBarHeight + 'px';
    }
    setViewportHeight();
  }


  var BottomButtonConstructor = function(type) {
    var isMainButton = (type == 'main');
    if (isMainButton) {
      var setupFnName = 'web_app_setup_main_button';
      var tgEventName = 'main_button_pressed';
      var webViewEventName = 'mainButtonClicked';
      var buttonTextDefault = 'Continue';
      var buttonColorDefault = function(){ return themeParams.button_color || '#2481cc'; };
      var buttonTextColorDefault = function(){ return themeParams.button_text_color || '#ffffff'; };
    } else {
      var setupFnName = 'web_app_setup_secondary_button';
      var tgEventName = 'secondary_button_pressed';
      var webViewEventName = 'secondaryButtonClicked';
      var buttonTextDefault = 'Cancel';
      var buttonColorDefault = function(){ return getBottomBarColor(); };
      var buttonTextColorDefault = function(){ return themeParams.button_color || '#2481cc'; };
    }

    var isVisible = false;
    var isActive = true;
    var hasShineEffect = false;
    var isProgressVisible = false;
    var iconCustomEmojiId = false;
    var buttonType = type;
    var buttonText = buttonTextDefault;
    var buttonColor = false;
    var buttonTextColor = false;
    var buttonPosition = 'left';

    var bottomButton = {};
    Object.defineProperty(bottomButton, 'type', {
      get: function(){ return buttonType; },
      enumerable: true
    });
    Object.defineProperty(bottomButton, 'iconCustomEmojiId', {
      set: function(val){ bottomButton.setParams({icon_custom_emoji_id: val}); },
      get: function(){ return iconCustomEmojiId; },
      enumerable: true
    });
    Object.defineProperty(bottomButton, 'text', {
      set: function(val){ bottomButton.setParams({text: val}); },
      get: function(){ return buttonText; },
      enumerable: true
    });
    Object.defineProperty(bottomButton, 'color', {
      set: function(val){ bottomButton.setParams({color: val}); },
      get: function(){ return buttonColor || buttonColorDefault(); },
      enumerable: true
    });
    Object.defineProperty(bottomButton, 'textColor', {
      set: function(val){ bottomButton.setParams({text_color: val}); },
      get: function(){ return buttonTextColor || buttonTextColorDefault(); },
      enumerable: true
    });
    Object.defineProperty(bottomButton, 'isVisible', {
      set: function(val){ bottomButton.setParams({is_visible: val}); },
      get: function(){ return isVisible; },
      enumerable: true
    });
    Object.defineProperty(bottomButton, 'isProgressVisible', {
      get: function(){ return isProgressVisible; },
      enumerable: true
    });
    Object.defineProperty(bottomButton, 'isActive', {
      set: function(val){ bottomButton.setParams({is_active: val}); },
      get: function(){ return isActive; },
      enumerable: true
    });
    Object.defineProperty(bottomButton, 'hasShineEffect', {
      set: function(val){ bottomButton.setParams({has_shine_effect: val}); },
      get: function(){ return hasShineEffect; },
      enumerable: true
    });
    if (!isMainButton) {
      Object.defineProperty(bottomButton, 'position', {
        set: function(val){ bottomButton.setParams({position: val}); },
        get: function(){ return buttonPosition; },
        enumerable: true
      });
    }

    var curButtonState = null;

    WebView.onEvent(tgEventName, onBottomButtonPressed);

    var debugBtn = null;
    if (initParams.tgWebAppDebug) {
      debugBtn = document.createElement('tg-bottom-button');
      var debugBtnStyle = {
        display: 'none',
        width: '100%',
        height: '44px',
        borderRadius: '0',
        background: 'no-repeat right center',
        padding: '13px 15px',
        textAlign: 'center',
        boxSizing: 'border-box'
      };
      for (var k in debugBtnStyle) {
        debugBtn.style[k] = debugBtnStyle[k];
      }
      debugBottomBar.appendChild(debugBtn);
      debugBtn.addEventListener('click', onBottomButtonPressed, false);
      debugBtn._bottomButton = bottomButton;
      debugBottomBarBtns[type] = debugBtn;
    }

    function onBottomButtonPressed() {
      if (isActive) {
        receiveWebViewEvent(webViewEventName);
      }
    }

    function buttonParams() {
      var color = bottomButton.color;
      var text_color = bottomButton.textColor;
      if (isVisible) {
        var params = {
          is_visible: true,
          is_active: isActive,
          is_progress_visible: isProgressVisible,
          icon_custom_emoji_id: iconCustomEmojiId,
          text: buttonText,
          color: color,
          text_color: text_color,
          has_shine_effect: hasShineEffect && isActive && !isProgressVisible
        };
        if (!isMainButton) {
          params.position = buttonPosition;
        }
      } else {
        var params = {
          is_visible: false
        };
      }
      return params;
    }

    function buttonState(btn_params) {
      if (typeof btn_params === 'undefined') {
        btn_params = buttonParams();
      }
      return JSON.stringify(btn_params);
    }

    function updateButton() {
      var btn_params = buttonParams();
      var btn_state = buttonState(btn_params);
      if (curButtonState === btn_state) {
        return;
      }
      curButtonState = btn_state;
      WebView.postEvent(setupFnName, false, btn_params);
      if (initParams.tgWebAppDebug) {
        updateDebugButton(btn_params);
      }
    }

    function updateDebugButton(btn_params) {
      if (btn_params.is_visible) {
        debugBtn.style.display = 'block';

        debugBtn.style.opacity = btn_params.is_active ? '1' : '0.8';
        debugBtn.style.cursor = btn_params.is_active ? 'pointer' : 'auto';
        debugBtn.disabled = !btn_params.is_active;
        debugBtn.innerText = btn_params.text;
        debugBtn.className = btn_params.has_shine_effect ? 'shine' : '';
        debugBtn.style.backgroundImage = btn_params.is_progress_visible ? "url('data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewport="0 0 48 48" width="48px" height="48px"><circle cx="50%" cy="50%" stroke="' + btn_params.text_color + '" stroke-width="2.25" stroke-linecap="round" fill="none" stroke-dashoffset="106" r="9" stroke-dasharray="56.52" rotate="-90"><animate attributeName="stroke-dashoffset" attributeType="XML" dur="360s" from="0" to="12500" repeatCount="indefinite"></animate><animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="-90 24 24" to="630 24 24" repeatCount="indefinite"></animateTransform></circle></svg>') + "')" : 'none';
        debugBtn.style.backgroundColor = btn_params.color;
        debugBtn.style.color = btn_params.text_color;
      } else {
        debugBtn.style.display = 'none';
      }
      updateDebugBottomBar();
    }

    function setParams(params) {
      if (typeof params.icon_custom_emoji_id !== 'undefined') {
        var emoji_id = params.icon_custom_emoji_id;
        if (emoji_id === false || emoji_id === null) {
          emoji_id = '';
        }
        if (emoji_id !== '' && !/^[0-9]{10,20}$/.test(emoji_id)) {
          console.error('[Telegram.WebApp] Bottom button icon custom emoji is invalid', params.icon_custom_emoji_id);
          throw Error('WebAppBottomButtonParamInvalid');
        }
        iconCustomEmojiId = emoji_id;
      }
      if (typeof params.text !== 'undefined') {
        var text = strTrim(params.text);
        if (!text.length && !iconCustomEmojiId) {
          console.error('[Telegram.WebApp] Bottom button text is required', params.text);
          throw Error('WebAppBottomButtonParamInvalid');
        }
        if (text.length > 64) {
          console.error('[Telegram.WebApp] Bottom button text is too long', text);
          throw Error('WebAppBottomButtonParamInvalid');
        }
        buttonText = text;
      }
      if (typeof params.color !== 'undefined') {
        if (params.color === false ||
            params.color === null) {
          buttonColor = false;
        } else {
          var color = parseColorToHex(params.color);
          if (!color) {
            console.error('[Telegram.WebApp] Bottom button color format is invalid', params.color);
            throw Error('WebAppBottomButtonParamInvalid');
          }
          buttonColor = color;
        }
      }
      if (typeof params.text_color !== 'undefined') {
        if (params.text_color === false ||
            params.text_color === null) {
          buttonTextColor = false;
        } else {
          var text_color = parseColorToHex(params.text_color);
          if (!text_color) {
            console.error('[Telegram.WebApp] Bottom button text color format is invalid', params.text_color);
            throw Error('WebAppBottomButtonParamInvalid');
          }
          buttonTextColor = text_color;
        }
      }
      if (typeof params.is_visible !== 'undefined') {
        if (params.is_visible &&
            !bottomButton.text.length) {
          console.error('[Telegram.WebApp] Bottom button text is required');
          throw Error('WebAppBottomButtonParamInvalid');
        }
        isVisible = !!params.is_visible;
      }
      if (typeof params.has_shine_effect !== 'undefined') {
        hasShineEffect = !!params.has_shine_effect;
      }
      if (!isMainButton && typeof params.position !== 'undefined') {
        if (params.position != 'left' && params.position != 'right' &&
            params.position != 'top' && params.position != 'bottom') {
          console.error('[Telegram.WebApp] Bottom button posiition is invalid', params.position);
          throw Error('WebAppBottomButtonParamInvalid');
        }
        buttonPosition = params.position;
      }
      if (typeof params.is_active !== 'undefined') {
        isActive = !!params.is_active;
      }
      updateButton();
      return bottomButton;
    }

    bottomButton.setText = function(text) {
      return bottomButton.setParams({text: text});
    };
    bottomButton.onClick = function(callback) {
      onWebViewEvent(webViewEventName, callback);
      return bottomButton;
    };
    bottomButton.offClick = function(callback) {
      offWebViewEvent(webViewEventName, callback);
      return bottomButton;
    };
    bottomButton.show = function() {
      return bottomButton.setParams({is_visible: true});
    };
    bottomButton.hide = function() {
      return bottomButton.setParams({is_visible: false});
    };
    bottomButton.enable = function() {
      return bottomButton.setParams({is_active: true});
    };
    bottomButton.disable = function() {
      return bottomButton.setParams({is_active: false});
    };
    bottomButton.showProgress = function(leaveActive) {
      isActive = !!leaveActive;
      isProgressVisible = true;
      updateButton();
      return bottomButton;
    };
    bottomButton.hideProgress = function() {
      if (!bottomButton.isActive) {
        isActive = true;
      }
      isProgressVisible = false;
      updateButton();
      return bottomButton;
    }
    bottomButton.setParams = setParams;
    return bottomButton;
  };
  var MainButton = BottomButtonConstructor('main');
  var SecondaryButton = BottomButtonConstructor('secondary');

  var SettingsButton = (function() {
    var isVisible = false;

    var settingsButton = {};
    Object.defineProperty(settingsButton, 'isVisible', {
      set: function(val){ setParams({is_visible: val}); },
      get: function(){ return isVisible; },
      enumerable: true
    });

    var curButtonState = null;

    WebView.onEvent('settings_button_pressed', onSettingsButtonPressed);

    function onSettingsButtonPressed() {
      receiveWebViewEvent('settingsButtonClicked');
    }

    function buttonParams() {
      return {is_visible: isVisible};
    }

    function buttonState(btn_params) {
      if (typeof btn_params === 'undefined') {
        btn_params = buttonParams();
      }
      return JSON.stringify(btn_params);
    }

    function buttonCheckVersion() {
      if (!versionAtLeast('6.10')) {
        console.warn('[Telegram.WebApp] SettingsButton is not supported in version ' + webAppVersion);
        return false;
      }
      return true;
    }

    function updateButton() {
      var btn_params = buttonParams();
      var btn_state = buttonState(btn_params);
      if (curButtonState === btn_state) {
        return;
      }
      curButtonState = btn_state;
      WebView.postEvent('web_app_setup_settings_button', false, btn_params);
    }

    function setParams(params) {
      if (!buttonCheckVersion()) {
        return settingsButton;
      }
      if (typeof params.is_visible !== 'undefined') {
        isVisible = !!params.is_visible;
      }
      updateButton();
      return settingsButton;
    }

    settingsButton.onClick = function(callback) {
      if (buttonCheckVersion()) {
        onWebViewEvent('settingsButtonClicked', callback);
      }
      return settingsButton;
    };
    settingsButton.offClick = function(callback) {
      if (buttonCheckVersion()) {
        offWebViewEvent('settingsButtonClicked', callback);
      }
      return settingsButton;
    };
    settingsButton.show = function() {
      return setParams({is_visible: true});
    };
    settingsButton.hide = function() {
      return setParams({is_visible: false});
    };
    return settingsButton;
  })();

  var HapticFeedback = (function() {
    var hapticFeedback = {};

    function triggerFeedback(params) {
      if (!versionAtLeast('6.1')) {
        console.warn('[Telegram.WebApp] HapticFeedback is not supported in version ' + webAppVersion);
        return hapticFeedback;
      }
      if (params.type == 'impact') {
        if (params.impact_style != 'light' &&
            params.impact_style != 'medium' &&
            params.impact_style != 'heavy' &&
            params.impact_style != 'rigid' &&
            params.impact_style != 'soft') {
          console.error('[Telegram.WebApp] Haptic impact style is invalid', params.impact_style);
          throw Error('WebAppHapticImpactStyleInvalid');
        }
      } else if (params.type == 'notification') {
        if (params.notification_type != 'error' &&
            params.notification_type != 'success' &&
            params.notification_type != 'warning') {
          console.error('[Telegram.WebApp] Haptic notification type is invalid', params.notification_type);
          throw Error('WebAppHapticNotificationTypeInvalid');
        }
      } else if (params.type == 'selection_change') {
        // no params needed
      } else {
        console.error('[Telegram.WebApp] Haptic feedback type is invalid', params.type);
        throw Error('WebAppHapticFeedbackTypeInvalid');
      }
      WebView.postEvent('web_app_trigger_haptic_feedback', false, params);
      return hapticFeedback;
    }

    hapticFeedback.impactOccurred = function(style) {
      return triggerFeedback({type: 'impact', impact_style: style});
    };
    hapticFeedback.notificationOccurred = function(type) {
      return triggerFeedback({type: 'notification', notification_type: type});
    };
    hapticFeedback.selectionChanged = function() {
      return triggerFeedback({type: 'selection_change'});
    };
    return hapticFeedback;
  })();

  var CloudStorage = (function() {
    var cloudStorage = {};

    function invokeStorageMethod(method, params, callback) {
      if (!versionAtLeast('6.9')) {
        console.error('[Telegram.WebApp] CloudStorage is not supported in version ' + webAppVersion);
        throw Error('WebAppMethodUnsupported');
      }
      invokeCustomMethod(method, params, callback);
      return cloudStorage;
    }

    cloudStorage.setItem = function(key, value, callback) {
      return invokeStorageMethod('saveStorageValue', {key: key, value: value}, callback);
    };
    cloudStorage.getItem = function(key, callback) {
      return cloudStorage.getItems([key], callback ? function(err, res) {
        if (err) callback(err);
        else callback(null, res[key]);
      } : null);
    };
    cloudStorage.getItems = function(keys, callback) {
      return invokeStorageMethod('getStorageValues', {keys: keys}, callback);
    };
    cloudStorage.removeItem = function(key, callback) {
      return cloudStorage.removeItems([key], callback);
    };
    cloudStorage.removeItems = function(keys, callback) {
      return invokeStorageMethod('deleteStorageValues', {keys: keys}, callback);
    };
    cloudStorage.getKeys = function(callback) {
      return invokeStorageMethod('getStorageKeys', {}, callback);
    };
    return cloudStorage;
  })();

  var DeviceStorage = (function() {
    var deviceStorage = {};

    WebView.onEvent('device_storage_key_saved',  onDeviceStorageEvent);
    WebView.onEvent('device_storage_key_received', onDeviceStorageEvent);
    WebView.onEvent('device_storage_cleared',  onDeviceStorageEvent);
    WebView.onEvent('device_storage_failed',  onDeviceStorageEvent);

    function onDeviceStorageEvent(eventType, eventData) {
      if (eventData.req_id && webAppCallbacks[eventData.req_id]) {
        var requestData = webAppCallbacks[eventData.req_id];
        delete webAppCallbacks[eventData.req_id];
        var res = null, err = null;
        if (eventType == 'device_storage_failed') {
          err = eventData.error || 'UNKNOWN_ERROR';
        } else if (eventType == 'device_storage_key_received') {
          res = eventData.value;
        } else {
          res = true;
        }
        if (requestData.callback) {
          requestData.callback(err, res);
        }
      }
    }

    function invokeStorageMethod(method, params, callback) {
      if (!versionAtLeast('9.0')) {
        console.error('[Telegram.WebApp] DeviceStorage is not supported in version ' + webAppVersion);
        throw Error('WebAppMethodUnsupported');
      }
      var req_id = generateCallbackId(16);
      var req_params = {req_id: req_id};
      for (var k in params) {
        req_params[k] = params[k];
      }
      webAppCallbacks[req_id] = {
        callback: callback
      };
      WebView.postEvent(method, false, req_params);
      return deviceStorage;
    }

    deviceStorage.setItem = function(key, value, callback) {
      return invokeStorageMethod('web_app_device_storage_save_key', {key: key, value: value}, callback);
    };
    deviceStorage.getItem = function(key, callback) {
      return invokeStorageMethod('web_app_device_storage_get_key', {key: key}, callback);
    };
    deviceStorage.removeItem = function(key, callback) {
      return invokeStorageMethod('web_app_device_storage_save_key', {key: key, value: null}, callback);
    };
    deviceStorage.clear = function(callback) {
      return invokeStorageMethod('web_app_device_storage_clear', {}, callback);
    };
    return deviceStorage;
  })();

  var SecureStorage = (function() {
    var secureStorage = {};

    WebView.onEvent('secure_storage_key_saved',  onSecureStorageEvent);
    WebView.onEvent('secure_storage_key_received', onSecureStorageEvent);
    WebView.onEvent('secure_storage_key_restored', onSecureStorageEvent);
    WebView.onEvent('secure_storage_cleared',  onSecureStorageEvent);
    WebView.onEvent('secure_storage_failed',  onSecureStorageEvent);

    function onSecureStorageEvent(eventType, eventData) {
      if (eventData.req_id && webAppCallbacks[eventData.req_id]) {
        var requestData = webAppCallbacks[eventData.req_id];
        delete webAppCallbacks[eventData.req_id];
        var res = null, err = null, can_restore = null;
        if (eventType == 'secure_storage_failed') {
          err = eventData.error || 'UNKNOWN_ERROR';
        } else if (eventType == 'secure_storage_key_received') {
          res = eventData.value;
          if (eventData.can_restore) {
            can_restore = true;
          }
        } else if (eventType == 'secure_storage_key_restored') {
          res = eventData.value;
        } else {
          res = true;
        }
        if (requestData.callback) {
          requestData.callback(err, res, can_restore);
        }
      }
    }

    function invokeStorageMethod(method, params, callback) {
      if (!versionAtLeast('9.0')) {
        console.error('[Telegram.WebApp] SecureStorage is not supported in version ' + webAppVersion);
        throw Error('WebAppMethodUnsupported');
      }
      var req_id = generateCallbackId(16);
      var req_params = {req_id: req_id};
      for (var k in params) {
        req_params[k] = params[k];
      }
      webAppCallbacks[req_id] = {
        callback: callback
      };
      WebView.postEvent(method, false, req_params);
      return secureStorage;
    }

    secureStorage.setItem = function(key, value, callback) {
      return invokeStorageMethod('web_app_secure_storage_save_key', {key: key, value: value}, callback);
    };
    secureStorage.getItem = function(key, callback) {
      return invokeStorageMethod('web_app_secure_storage_get_key', {key: key}, callback);
    };
    secureStorage.restoreItem = function(key, callback) {
      return invokeStorageMethod('web_app_secure_storage_restore_key', {key: key}, callback);
    };
    secureStorage.removeItem = function(key, callback) {
      return invokeStorageMethod('web_app_secure_storage_save_key', {key: key, value: null}, callback);
    };
    secureStorage.clear = function(callback) {
      return invokeStorageMethod('web_app_secure_storage_clear', {}, callback);
    };
    return secureStorage;
  })();

  var BiometricManager = (function() {
    var isInited = false;
    var isBiometricAvailable = false;
    var biometricType = 'unknown';
    var isAccessRequested = false;
    var isAccessGranted = false;
    var isBiometricTokenSaved = false;
    var deviceId = '';

    var biometricManager = {};
    Object.defineProperty(biometricManager, 'isInited', {
      get: function(){ return isInited; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'isBiometricAvailable', {
      get: function(){ return isInited && isBiometricAvailable; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'biometricType', {
      get: function(){ return biometricType || 'unknown'; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'isAccessRequested', {
      get: function(){ return isAccessRequested; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'isAccessGranted', {
      get: function(){ return isAccessRequested && isAccessGranted; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'isBiometricTokenSaved', {
      get: function(){ return isBiometricTokenSaved; },
      enumerable: true
    });
    Object.defineProperty(biometricManager, 'deviceId', {
      get: function(){ return deviceId || ''; },
      enumerable: true
    });

    var initRequestState = {callbacks: []};
    var accessRequestState = false;
    var authRequestState = false;
    var tokenRequestState = false;

    WebView.onEvent('biometry_info_received',  onBiometryInfoReceived);
    WebView.onEvent('biometry_auth_requested', onBiometryAuthRequested);
    WebView.onEvent('biometry_token_updated',  onBiometryTokenUpdated);

    function onBiometryInfoReceived(eventType, eventData) {
      isInited = true;
      if (eventData.available) {
        isBiometricAvailable = true;
        biometricType = eventData.type || 'unknown';
        if (eventData.access_requested) {
          isAccessRequested = true;
          isAccessGranted = !!eventData.access_granted;
          isBiometricTokenSaved = !!eventData.token_saved;
        } else {
          isAccessRequested = false;
          isAccessGranted = false;
          isBiometricTokenSaved = false;
        }
      } else {
        isBiometricAvailable = false;
        biometricType = 'unknown';
        isAccessRequested = false;
        isAccessGranted = false;
        isBiometricTokenSaved = false;
      }
      deviceId = eventData.device_id || '';

      if (initRequestState.callbacks.length > 0) {
        for (var i = 0; i < initRequestState.callbacks.length; i++) {
          var callback = initRequestState.callbacks[i];
          callback();
        }
        initRequestState.callbacks = [];
      }
      if (accessRequestState) {
        var state = accessRequestState;
        accessRequestState = false;
        if (state.callback) {
          state.callback(isAccessGranted);
        }
      }
      receiveWebViewEvent('biometricManagerUpdated');
    }
    function onBiometryAuthRequested(eventType, eventData) {
      var isAuthenticated = (eventData.status == 'authorized'),
          biometricToken = eventData.token || '';
      if (authRequestState) {
        var state = authRequestState;
        authRequestState = false;
        if (state.callback) {
          state.callback(isAuthenticated, isAuthenticated ? biometricToken : null);
        }
      }
      receiveWebViewEvent('biometricAuthRequested', isAuthenticated ? {
        isAuthenticated: true,
        biometricToken: biometricToken
      } : {
        isAuthenticated: false
      });
    }
    function onBiometryTokenUpdated(eventType, eventData) {
      var applied = false;
      if (isBiometricAvailable &&
          isAccessRequested) {
        if (eventData.status == 'updated') {
          isBiometricTokenSaved = true;
          applied = true;
        }
        else if (eventData.status == 'removed') {
          isBiometricTokenSaved = false;
          applied = true;
        }
      }
      if (tokenRequestState) {
        var state = tokenRequestState;
        tokenRequestState = false;
        if (state.callback) {
          state.callback(applied);
        }
      }
      receiveWebViewEvent('biometricTokenUpdated', {
        isUpdated: applied
      });
    }

    function checkVersion() {
      if (!versionAtLeast('7.2')) {
        console.warn('[Telegram.WebApp] BiometricManager is not supported in version ' + webAppVersion);
        return false;
      }
      return true;
    }

    function checkInit() {
      if (!isInited) {
        console.error('[Telegram.WebApp] BiometricManager should be inited before using.');
        throw Error('WebAppBiometricManagerNotInited');
      }
      return true;
    }

    biometricManager.init = function(callback) {
      if (!checkVersion()) {
        return biometricManager;
      }
      if (isInited) {
        return biometricManager;
      }
      if (callback) {
        initRequestState.callbacks.push(callback);
      }
      WebView.postEvent('web_app_biometry_get_info', false);
      return biometricManager;
    };
    biometricManager.requestAccess = function(params, callback) {
      if (!checkVersion()) {
        return biometricManager;
      }
      checkInit();
      if (!isBiometricAvailable) {
        console.error('[Telegram.WebApp] Biometrics is not available on this device.');
        throw Error('WebAppBiometricManagerBiometricsNotAvailable');
      }
      if (accessRequestState) {
        console.error('[Telegram.WebApp] Access is already requested');
        throw Error('WebAppBiometricManagerAccessRequested');
      }
      var popup_params = {};
      if (typeof params.reason !== 'undefined') {
        var reason = strTrim(params.reason);
        if (reason.length > 128) {
          console.error('[Telegram.WebApp] Biometric reason is too long', reason);
          throw Error('WebAppBiometricRequestAccessParamInvalid');
        }
        if (reason.length > 0) {
          popup_params.reason = reason;
        }
      }

      accessRequestState = {
        callback: callback
      };
      WebView.postEvent('web_app_biometry_request_access', false, popup_params);
      return biometricManager;
    };
    biometricManager.authenticate = function(params, callback) {
      if (!checkVersion()) {
        return biometricManager;
      }
      checkInit();
      if (!isBiometricAvailable) {
        console.error('[Telegram.WebApp] Biometrics is not available on this device.');
        throw Error('WebAppBiometricManagerBiometricsNotAvailable');
      }
      if (!isAccessGranted) {
        console.error('[Telegram.WebApp] Biometric access was not granted by the user.');
        throw Error('WebAppBiometricManagerBiometricAccessNotGranted');
      }
      if (authRequestState) {
        console.error('[Telegram.WebApp] Authentication request is already in progress.');
        throw Error('WebAppBiometricManagerAuthenticationRequested');
      }
      var popup_params = {};
      if (typeof params.reason !== 'undefined') {
        var reason = strTrim(params.reason);
        if (reason.length > 128) {
          console.error('[Telegram.WebApp] Biometric reason is too long', reason);
          throw Error('WebAppBiometricRequestAccessParamInvalid');
        }
        if (reason.length > 0) {
          popup_params.reason = reason;
        }
      }

      authRequestState = {
        callback: callback
      };
      WebView.postEvent('web_app_biometry_request_auth', false, popup_params);
      return biometricManager;
    };
    biometricManager.updateBiometricToken = function(token, callback) {
      if (!checkVersion()) {
        return biometricManager;
      }
      token = token || '';
      if (token.length > 1024) {
        console.error('[Telegram.WebApp] Token is too long', token);
        throw Error('WebAppBiometricManagerTokenInvalid');
      }
      checkInit();
      if (!isBiometricAvailable) {
        console.error('[Telegram.WebApp] Biometrics is not available on this device.');
        throw Error('WebAppBiometricManagerBiometricsNotAvailable');
      }
      if (!isAccessGranted) {
        console.error('[Telegram.WebApp] Biometric access was not granted by the user.');
        throw Error('WebAppBiometricManagerBiometricAccessNotGranted');
      }
      if (tokenRequestState) {
        console.error('[Telegram.WebApp] Token request is already in progress.');
        throw Error('WebAppBiometricManagerTokenUpdateRequested');
      }
      tokenRequestState = {
        callback: callback
      };
      WebView.postEvent('web_app_biometry_update_token', false, {token: token});
      return biometricManager;
    };
    biometricManager.openSettings = function() {
      if (!checkVersion()) {
        return biometricManager;
      }
      checkInit();
      if (!isBiometricAvailable) {
        console.error('[Telegram.WebApp] Biometrics is not available on this device.');
        throw Error('WebAppBiometricManagerBiometricsNotAvailable');
      }
      if (!isAccessRequested) {
        console.error('[Telegram.WebApp] Biometric access was not requested yet.');
        throw Error('WebAppBiometricManagerBiometricsAccessNotRequested');
      }
      if (isAccessGranted) {
        console.warn('[Telegram.WebApp] Biometric access was granted by the user, no need to go to settings.');
        return biometricManager;
      }
      WebView.postEvent('web_app_biometry_open_settings', false);
      return biometricManager;
    };
    return biometricManager;
  })();

  var LocationManager = (function() {
    var isInited = false;
    var isLocationAvailable = false;
    var isAccessRequested = false;
    var isAccessGranted = false;

    var locationManager = {};
    Object.defineProperty(locationManager, 'isInited', {
      get: function(){ return isInited; },
      enumerable: true
    });
    Object.defineProperty(locationManager, 'isLocationAvailable', {
      get: function(){ return isInited && isLocationAvailable; },
      enumerable: true
    });
    Object.defineProperty(locationManager, 'isAccessRequested', {
      get: function(){ return isAccessRequested; },
      enumerable: true
    });
    Object.defineProperty(locationManager, 'isAccessGranted', {
      get: function(){ return isAccessRequested && isAccessGranted; },
      enumerable: true
    });

    var initRequestState = {callbacks: []};
    var getRequestState = {callbacks: []};

    WebView.onEvent('location_checked',  onLocationChecked);
    WebView.onEvent('location_requested', onLocationRequested);

    function onLocationChecked(eventType, eventData) {
      isInited = true;
      if (eventData.available) {
        isLocationAvailable = true;
        if (eventData.access_requested) {
          isAccessRequested = true;
          isAccessGranted = !!eventData.access_granted;
        } else {
          isAccessRequested = false;
          isAccessGranted = false;
        }
      } else {
        isLocationAvailable = false;
        isAccessRequested = false;
        isAccessGranted = false;
      }

      if (initRequestState.callbacks.length > 0) {
        for (var i = 0; i < initRequestState.callbacks.length; i++) {
          var callback = initRequestState.callbacks[i];
          callback();
        }
        initRequestState.callbacks = [];
      }
      receiveWebViewEvent('locationManagerUpdated');
    }
    function onLocationRequested(eventType, eventData) {
      if (!eventData.available) {
        locationData = null;
      } else {
        var locationData = {
          latitude: eventData.latitude,
          longitude: eventData.longitude,
          altitude: null,
          course: null,
          speed: null,
          horizontal_accuracy: null,
          vertical_accuracy: null,
          course_accuracy: null,
          speed_accuracy: null,
        };
        if (typeof eventData.altitude !== 'undefined' && eventData.altitude !== null) {
          locationData.altitude = eventData.altitude;
        }
        if (typeof eventData.course !== 'undefined' && eventData.course !== null) {
          locationData.course = eventData.course % 360;
        }
        if (typeof eventData.speed !== 'undefined' && eventData.speed !== null) {
          locationData.speed = eventData.speed;
        }
        if (typeof eventData.horizontal_accuracy !== 'undefined' && eventData.horizontal_accuracy !== null) {
          locationData.horizontal_accuracy = eventData.horizontal_accuracy;
        }
        if (typeof eventData.vertical_accuracy !== 'undefined' && eventData.vertical_accuracy !== null) {
          locationData.vertical_accuracy = eventData.vertical_accuracy;
        }
        if (typeof eventData.course_accuracy !== 'undefined' && eventData.course_accuracy !== null) {
          locationData.course_accuracy = eventData.course_accuracy;
        }
        if (typeof eventData.speed_accuracy !== 'undefined' && eventData.speed_accuracy !== null) {
          locationData.speed_accuracy = eventData.speed_accuracy;
        }
      }
      if (!eventData.available ||
          !isLocationAvailable ||
          !isAccessRequested ||
          !isAccessGranted) {
        initRequestState.callbacks.push(function() {
          locationResponse(locationData);
        });
        WebView.postEvent('web_app_check_location', false);
      } else {
        locationResponse(locationData);
      }
    }
    function locationResponse(response) {
      if (getRequestState.callbacks.length > 0) {
        for (var i = 0; i < getRequestState.callbacks.length; i++) {
          var callback = getRequestState.callbacks[i];
          callback(response);
        }
        getRequestState.callbacks = [];
      }
      if (response !== null) {
        receiveWebViewEvent('locationRequested', {
          locationData: response
        });
      }
    }

    function checkVersion() {
      if (!versionAtLeast('8.0')) {
        console.warn('[Telegram.WebApp] LocationManager is not supported in version ' + webAppVersion);
        return false;
      }
      return true;
    }

    function checkInit() {
      if (!isInited) {
        console.error('[Telegram.WebApp] LocationManager should be inited before using.');
        throw Error('WebAppLocationManagerNotInited');
      }
      return true;
    }

    locationManager.init = function(callback) {
      if (!checkVersion()) {
        return locationManager;
      }
      if (isInited) {
        return locationManager;
      }
      if (callback) {
        initRequestState.callbacks.push(callback);
      }
      WebView.postEvent('web_app_check_location', false);
      return locationManager;
    };
    locationManager.getLocation = function(callback) {
      if (!checkVersion()) {
        return locationManager;
      }
      checkInit();
      if (!isLocationAvailable) {
        console.error('[Telegram.WebApp] Location is not available on this device.');
        throw Error('WebAppLocationManagerLocationNotAvailable');
      }

      getRequestState.callbacks.push(callback);
      WebView.postEvent('web_app_request_location');
      return locationManager;
    };
    locationManager.openSettings = function() {
      if (!checkVersion()) {
        return locationManager;
      }
      checkInit();
      if (!isLocationAvailable) {
        console.error('[Telegram.WebApp] Location is not available on this device.');
        throw Error('WebAppLocationManagerLocationNotAvailable');
      }
      if (!isAccessRequested) {
        console.error('[Telegram.WebApp] Location access was not requested yet.');
        throw Error('WebAppLocationManagerLocationAccessNotRequested');
      }
      if (isAccessGranted) {
        console.warn('[Telegram.WebApp] Location access was granted by the user, no need to go to settings.');
        return locationManager;
      }
      WebView.postEvent('web_app_open_location_settings', false);
      return locationManager;
    };
    return locationManager;
  })();

  var Accelerometer = (function() {
    var isStarted = false;
    var valueX = null, valueY = null, valueZ = null;
    var startCallbacks = [], stopCallbacks = [];

    var accelerometer = {};
    Object.defineProperty(accelerometer, 'isStarted', {
      get: function(){ return isStarted; },
      enumerable: true
    });
    Object.defineProperty(accelerometer, 'x', {
      get: function(){ return valueX; },
      enumerable: true
    });
    Object.defineProperty(accelerometer, 'y', {
      get: function(){ return valueY; },
      enumerable: true
    });
    Object.defineProperty(accelerometer, 'z', {
      get: function(){ return valueZ; },
      enumerable: true
    });

    WebView.onEvent('accelerometer_started', onAccelerometerStarted);
    WebView.onEvent('accelerometer_stopped', onAccelerometerStopped);
    WebView.onEvent('accelerometer_changed', onAccelerometerChanged);
    WebView.onEvent('accelerometer_failed',  onAccelerometerFailed);

    function onAccelerometerStarted(eventType, eventData) {
      isStarted = true;
      if (startCallbacks.length > 0) {
        for (var i = 0; i < startCallbacks.length; i++) {
          var callback = startCallbacks[i];
          callback(true);
        }
        startCallbacks = [];
      }
      receiveWebViewEvent('accelerometerStarted');
    }
    function onAccelerometerStopped(eventType, eventData) {
      isStarted = false;
      if (stopCallbacks.length > 0) {
        for (var i = 0; i < stopCallbacks.length; i++) {
          var callback = stopCallbacks[i];
          callback(true);
        }
        stopCallbacks = [];
      }
      receiveWebViewEvent('accelerometerStopped');
    }
    function onAccelerometerChanged(eventType, eventData) {
      valueX = eventData.x;
      valueY = eventData.y;
      valueZ = eventData.z;
      receiveWebViewEvent('accelerometerChanged');
    }
    function onAccelerometerFailed(eventType, eventData) {
      if (startCallbacks.length > 0) {
        for (var i = 0; i < startCallbacks.length; i++) {
          var callback = startCallbacks[i];
          callback(false);
        }
        startCallbacks = [];
      }
      receiveWebViewEvent('accelerometerFailed', {
        error: eventData.error
      });
    }

    function checkVersion() {
      if (!versionAtLeast('8.0')) {
        console.warn('[Telegram.WebApp] Accelerometer is not supported in version ' + webAppVersion);
        return false;
      }
      return true;
    }

    accelerometer.start = function(params, callback) {
      params = params || {};
      if (!checkVersion()) {
        return accelerometer;
      }
      var req_params = {};
      var refresh_rate = parseInt(params.refresh_rate || 1000);
      if (isNaN(refresh_rate) || refresh_rate < 20 || refresh_rate > 1000) {
        console.warn('[Telegram.WebApp] Accelerometer refresh_rate is invalid', refresh_rate);
      } else {
        req_params.refresh_rate = refresh_rate;
      }

      if (callback) {
        startCallbacks.push(callback);
      }
      WebView.postEvent('web_app_start_accelerometer', false, req_params);
      return accelerometer;
    };
    accelerometer.stop = function(callback) {
      if (!checkVersion()) {
        return accelerometer;
      }
      if (callback) {
        stopCallbacks.push(callback);
      }
      WebView.postEvent('web_app_stop_accelerometer');
      return accelerometer;
    };
    return accelerometer;
  })();

  var DeviceOrientation = (function() {
    var isStarted = false;
    var valueAlpha = null, valueBeta = null, valueGamma = null, valueAbsolute = false;
    var startCallbacks = [], stopCallbacks = [];

    var deviceOrientation = {};
    Object.defineProperty(deviceOrientation, 'isStarted', {
      get: function(){ return isStarted; },
      enumerable: true
    });
    Object.defineProperty(deviceOrientation, 'absolute', {
      get: function(){ return valueAbsolute; },
      enumerable: true
    });
    Object.defineProperty(deviceOrientation, 'alpha', {
      get: function(){ return valueAlpha; },
      enumerable: true
    });
    Object.defineProperty(deviceOrientation, 'beta', {
      get: function(){ return valueBeta; },
      enumerable: true
    });
    Object.defineProperty(deviceOrientation, 'gamma', {
      get: function(){ return valueGamma; },
      enumerable: true
    });

    WebView.onEvent('device_orientation_started',  onDeviceOrientationStarted);
    WebView.onEvent('device_orientation_stopped',  onDeviceOrientationStopped);
    WebView.onEvent('device_orientation_changed', onDeviceOrientationChanged);
    WebView.onEvent('device_orientation_failed',  onDeviceOrientationFailed);

    function onDeviceOrientationStarted(eventType, eventData) {
      isStarted = true;
      if (startCallbacks.length > 0) {
        for (var i = 0; i < startCallbacks.length; i++) {
          var callback = startCallbacks[i];
          callback(true);
        }
        startCallbacks = [];
      }
      receiveWebViewEvent('deviceOrientationStarted');
    }
    function onDeviceOrientationStopped(eventType, eventData) {
      isStarted = false;
      if (stopCallbacks.length > 0) {
        for (var i = 0; i < stopCallbacks.length; i++) {
          var callback = stopCallbacks[i];
          callback(true);
        }
        stopCallbacks = [];
      }
      receiveWebViewEvent('deviceOrientationStopped');
    }
    function onDeviceOrientationChanged(eventType, eventData) {
      valueAbsolute = !!eventData.absolute;
      valueAlpha = eventData.alpha;
      valueBeta  = eventData.beta;
      valueGamma = eventData.gamma;
      receiveWebViewEvent('deviceOrientationChanged');
    }
    function onDeviceOrientationFailed(eventType, eventData) {
      if (startCallbacks.length > 0) {
        for (var i = 0; i < startCallbacks.length; i++) {
          var callback = startCallbacks[i];
          callback(false);
        }
        startCallbacks = [];
      }
      receiveWebViewEvent('deviceOrientationFailed', {
        error: eventData.error
      });
    }

    function checkVersion() {
      if (!versionAtLeast('8.0')) {
        console.warn('[Telegram.WebApp] DeviceOrientation is not supported in version ' + webAppVersion);
        return false;
      }
      return true;
    }

    deviceOrientation.start = function(params, callback) {
      params = params || {};
      if (!checkVersion()) {
        return deviceOrientation;
      }
      var req_params = {};
      var refresh_rate = parseInt(params.refresh_rate || 1000);
      if (isNaN(refresh_rate) || refresh_rate < 20 || refresh_rate > 1000) {
        console.warn('[Telegram.WebApp] DeviceOrientation refresh_rate is invalid', refresh_rate);
      } else {
        req_params.refresh_rate = refresh_rate;
      }
      req_params.need_absolute = !!params.need_absolute;

      if (callback) {
        startCallbacks.push(callback);
      }
      WebView.postEvent('web_app_start_device_orientation', false, req_params);
      return deviceOrientation;
    };
    deviceOrientation.stop = function(callback) {
      if (!checkVersion()) {
        return deviceOrientation;
      }
      if (callback) {
        stopCallbacks.push(callback);
      }
      WebView.postEvent('web_app_stop_device_orientation');
      return deviceOrientation;
    };
    return deviceOrientation;
  })();

  var Gyroscope = (function() {
    var isStarted = false;
    var valueX = null, valueY = null, valueZ = null;
    var startCallbacks = [], stopCallbacks = [];

    var gyroscope = {};
    Object.defineProperty(gyroscope, 'isStarted', {
      get: function(){ return isStarted; },
      enumerable: true
    });
    Object.defineProperty(gyroscope, 'x', {
      get: function(){ return valueX; },
      enumerable: true
    });
    Object.defineProperty(gyroscope, 'y', {
      get: function(){ return valueY; },
      enumerable: true
    });
    Object.defineProperty(gyroscope, 'z', {
      get: function(){ return valueZ; },
      enumerable: true
    });

    WebView.onEvent('gyroscope_started',  onGyroscopeStarted);
    WebView.onEvent('gyroscope_stopped',  onGyroscopeStopped);
    WebView.onEvent('gyroscope_changed', onGyroscopeChanged);
    WebView.onEvent('gyroscope_failed',  onGyroscopeFailed);

    function onGyroscopeStarted(eventType, eventData) {
      isStarted = true;
      if (startCallbacks.length > 0) {
        for (var i = 0; i < startCallbacks.length; i++) {
          var callback = startCallbacks[i];
          callback(true);
        }
        startCallbacks = [];
      }
      receiveWebViewEvent('gyroscopeStarted');
    }
    function onGyroscopeStopped(eventType, eventData) {
      isStarted = false;
      if (stopCallbacks.length > 0) {
        for (var i = 0; i < stopCallbacks.length; i++) {
          var callback = stopCallbacks[i];
          callback(true);
        }
        stopCallbacks = [];
      }
      receiveWebViewEvent('gyroscopeStopped');
    }
    function onGyroscopeChanged(eventType, eventData) {
      valueX = eventData.x;
      valueY = eventData.y;
      valueZ = eventData.z;
      receiveWebViewEvent('gyroscopeChanged');
    }
    function onGyroscopeFailed(eventType, eventData) {
      if (startCallbacks.length > 0) {
        for (var i = 0; i < startCallbacks.length; i++) {
          var callback = startCallbacks[i];
          callback(false);
        }
        startCallbacks = [];
      }
      receiveWebViewEvent('gyroscopeFailed', {
        error: eventData.error
      });
    }

    function checkVersion() {
      if (!versionAtLeast('8.0')) {
        console.warn('[Telegram.WebApp] Gyroscope is not supported in version ' + webAppVersion);
        return false;
      }
      return true;
    }

    gyroscope.start = function(params, callback) {
      params = params || {};
      if (!checkVersion()) {
        return gyroscope;
      }
      var req_params = {};
      var refresh_rate = parseInt(params.refresh_rate || 1000);
      if (isNaN(refresh_rate) || refresh_rate < 20 || refresh_rate > 1000) {
        console.warn('[Telegram.WebApp] Gyroscope refresh_rate is invalid', refresh_rate);
      } else {
        req_params.refresh_rate = refresh_rate;
      }

      if (callback) {
        startCallbacks.push(callback);
      }
      WebView.postEvent('web_app_start_gyroscope', false, req_params);
      return gyroscope;
    };
    gyroscope.stop = function(callback) {
      if (!checkVersion()) {
        return gyroscope;
      }
      if (callback) {
        stopCallbacks.push(callback);
      }
      WebView.postEvent('web_app_stop_gyroscope');
      return gyroscope;
    };
    return gyroscope;
  })();

  var Serverless = (function() {
    var serverless = {};

    function serverlessError(message, status, parameters) {
      var err = new Error(message);
      err.name = 'ServerlessError';
      err.status = status;
      if (parameters) {
        err.parameters = parameters;
      }
      return err;
    }

    function parseEnvelope(name, response) {
      return response.text().then(function(text) {
        var data = null;
        try {
          data = JSON.parse(text);
        } catch (e) {}
        if (!data || typeof data !== 'object' || typeof data.ok !== 'boolean') {
          throw serverlessError('Unexpected response from endpoint ' + name + ' (HTTP ' + response.status + ')', response.status);
        }
        if (!data.ok) {
          var err = serverlessError(
            data.description || 'Endpoint ' + name + ' failed (HTTP ' + response.status + ')',
            data.error_code || response.status,
            data.parameters);
          err.type = data.error_type || '';
          throw err;
        }
        return data.result;
      });
    }

    serverless.call = function(name, input, callback) {
      if (typeof input === 'function' && typeof callback === 'undefined') {
        callback = input;
        input = undefined;
      }
      if (typeof name !== 'string') {
        console.error('[Telegram.WebApp] Serverless endpoint name is invalid', name);
        throw Error('WebAppServerlessEndpointInvalid');
      }
      if (typeof input === 'undefined') {
        input = {};
      }
      if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        console.error('[Telegram.WebApp] Serverless endpoint input must be an object', input);
        throw Error('WebAppServerlessInputInvalid');
      }
      if (typeof callback !== 'undefined' && typeof callback !== 'function') {
        console.error('[Telegram.WebApp] Serverless callback must be a function', callback);
        throw Error('WebAppServerlessCallbackInvalid');
      }
      if (!webAppInitData.length) {
        console.error('[Telegram.WebApp] Serverless endpoints need initData; open the app from Telegram');
        throw Error('WebAppServerlessInitDataUnavailable');
      }
      if (typeof fetch !== 'function') {
        console.error('[Telegram.WebApp] Serverless endpoints need fetch()');
        throw Error('WebAppServerlessFetchUnsupported');
      }
      fetch('/api/' + name, {
        method: 'POST',
        headers: {
          'Authorization': 'TMA ' + window.btoa(webAppInitData),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(input),
        credentials: 'omit'
      }).then(function(response) {
        return parseEnvelope(name, response);
      }, function(e) {
        throw serverlessError('Network error calling endpoint ' + name + (e && e.message ? ': ' + e.message : ''), 0);
      }).then(function(result) {
        if (callback) {
          callback(null, result);
        }
      }, function(err) {
        if (callback) {
          callback(err, null);
        }
      });
    };

    return serverless;
  })();

  var webAppInvoices = {};
  function onInvoiceClosed(eventType, eventData) {
    if (eventData.slug && webAppInvoices[eventData.slug]) {
      var invoiceData = webAppInvoices[eventData.slug];
      delete webAppInvoices[eventData.slug];
      if (invoiceData.callback) {
        invoiceData.callback(eventData.status);
      }
      receiveWebViewEvent('invoiceClosed', {
        url: invoiceData.url,
        status: eventData.status
      });
    }
  }

  var webAppPopupOpened = false;
  function onPopupClosed(eventType, eventData) {
    if (webAppPopupOpened) {
      var popupData = webAppPopupOpened;
      webAppPopupOpened = false;
      var button_id = null;
      if (typeof eventData.button_id !== 'undefined') {
        button_id = eventData.button_id;
      }
      if (popupData.callback) {
        popupData.callback(button_id);
      }
      receiveWebViewEvent('popupClosed', {
        button_id: button_id
      });
    }
  }

  var webAppScanQrPopupOpened = false;
  function onQrTextReceived(eventType, eventData) {
    if (webAppScanQrPopupOpened) {
      var popupData = webAppScanQrPopupOpened;
      var data = null;
      if (typeof eventData.data !== 'undefined') {
        data = eventData.data;
      }
      if (popupData.callback) {
        if (popupData.callback(data)) {
          webAppScanQrPopupOpened = false;
          WebView.postEvent('web_app_close_scan_qr_popup', false);
        }
      }
      receiveWebViewEvent('qrTextReceived', {
        data: data
      });
    }
  }
  function onScanQrPopupClosed(eventType, eventData) {
    webAppScanQrPopupOpened = false;
    receiveWebViewEvent('scanQrPopupClosed');
  }

  function onClipboardTextReceived(eventType, eventData) {
    if (eventData.req_id && webAppCallbacks[eventData.req_id]) {
      var requestData = webAppCallbacks[eventData.req_id];
      delete webAppCallbacks[eventData.req_id];
      var data = null;
      if (typeof eventData.data !== 'undefined') {
        data = eventData.data;
      }
      if (requestData.callback) {
        requestData.callback(data);
      }
      receiveWebViewEvent('clipboardTextReceived', {
        data: data
      });
    }
  }

  var WebAppWriteAccessRequested = false;
  function onWriteAccessRequested(eventType, eventData) {
    if (WebAppWriteAccessRequested) {
      var requestData = WebAppWriteAccessRequested;
      WebAppWriteAccessRequested = false;
      if (requestData.callback) {
        requestData.callback(eventData.status == 'allowed');
      }
      receiveWebViewEvent('writeAccessRequested', {
        status: eventData.status
      });
    }
  }

  function getRequestedContact(callback, timeout) {
    var reqTo, fallbackTo, reqDelay = 0;
    var reqInvoke = function() {
      invokeCustomMethod('getRequestedContact', {}, function(err, res) {
        if (res.substr(0, 1) == '"' && res.substr(-1) == '"') { // macos fix
          res = JSON.parse(res);
        }
        if (res && res.length) {
          clearTimeout(fallbackTo);
          callback(res);
        } else {
          reqDelay += 50;
          reqTo = setTimeout(reqInvoke, reqDelay);
        }
      });
    };
    var fallbackInvoke = function() {
      clearTimeout(reqTo);
      callback('');
    };
    fallbackTo = setTimeout(fallbackInvoke, timeout);
    reqInvoke();
  }

  var WebAppContactRequested = false;
  function onPhoneRequested(eventType, eventData) {
    if (WebAppContactRequested) {
      var requestData = WebAppContactRequested;
      WebAppContactRequested = false;
      var requestSent = eventData.status == 'sent';
      var webViewEvent = {
        status: eventData.status
      };
      if (requestSent) {
        getRequestedContact(function(res) {
          if (res && res.length) {
            webViewEvent.response = res;
            webViewEvent.responseUnsafe = Utils.urlParseQueryString(res);
            for (var key in webViewEvent.responseUnsafe) {
              var val = webViewEvent.responseUnsafe[key];
              try {
                if (val.substr(0, 1) == '{' && val.substr(-1) == '}' ||
                    val.substr(0, 1) == '[' && val.substr(-1) == ']') {
                  webViewEvent.responseUnsafe[key] = JSON.parse(val);
                }
              } catch (e) {}
            }
          }
          if (requestData.callback) {
            requestData.callback(requestSent, webViewEvent);
          }
          receiveWebViewEvent('contactRequested', webViewEvent);
        }, 3000);
      } else {
        if (requestData.callback) {
          requestData.callback(requestSent, webViewEvent);
        }
        receiveWebViewEvent('contactRequested', webViewEvent);
      }
    }
  }

  var webAppDownloadFileRequested = false;
  function onFileDownloadRequested(eventType, eventData) {
    if (webAppDownloadFileRequested) {
      var requestData = webAppDownloadFileRequested;
      webAppDownloadFileRequested = false;
      var isDownloading = eventData.status == 'downloading';
      if (requestData.callback) {
        requestData.callback(isDownloading);
      }
      receiveWebViewEvent('fileDownloadRequested', {
        status: isDownloading ? 'downloading' : 'cancelled'
      });
    }
  }

  function onCustomMethodInvoked(eventType, eventData) {
    if (eventData.req_id && webAppCallbacks[eventData.req_id]) {
      var requestData = webAppCallbacks[eventData.req_id];
      delete webAppCallbacks[eventData.req_id];
      var res = null, err = null;
      if (typeof eventData.result !== 'undefined') {
        res = eventData.result;
      }
      if (typeof eventData.error !== 'undefined') {
        err = eventData.error;
      }
      if (requestData.callback) {
        requestData.callback(err, res);
      }
    }
  }

  function invokeCustomMethod(method, params, callback) {
    if (!versionAtLeast('6.9')) {
      console.error('[Telegram.WebApp] Method invokeCustomMethod is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    var req_id = generateCallbackId(16);
    var req_params = {req_id: req_id, method: method, params: params || {}};
    webAppCallbacks[req_id] = {
      callback: callback
    };
    WebView.postEvent('web_app_invoke_custom_method', false, req_params);
  };

  if (!window.Telegram) {
    window.Telegram = {};
  }

  Object.defineProperty(WebApp, 'initData', {
    get: function(){ return webAppInitData; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'initDataUnsafe', {
    get: function(){ return webAppInitDataUnsafe; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'version', {
    get: function(){ return webAppVersion; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'platform', {
    get: function(){ return webAppPlatform; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'colorScheme', {
    get: function(){ return colorScheme; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'themeParams', {
    get: function(){ return themeParams; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'isExpanded', {
    get: function(){ return isExpanded; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'viewportHeight', {
    get: function(){ return (viewportHeight === false ? window.innerHeight : viewportHeight) - bottomBarHeight; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'viewportStableHeight', {
    get: function(){ return (viewportStableHeight === false ? window.innerHeight : viewportStableHeight) - bottomBarHeight; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'safeAreaInset', {
    get: function(){ return safeAreaInset; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'contentSafeAreaInset', {
    get: function(){ return contentSafeAreaInset; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'isClosingConfirmationEnabled', {
    set: function(val){ setClosingConfirmation(val); },
    get: function(){ return isClosingConfirmationEnabled; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'isVerticalSwipesEnabled', {
    set: function(val){ toggleVerticalSwipes(val); },
    get: function(){ return isVerticalSwipesEnabled; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'isFullscreen', {
    get: function(){ return webAppIsFullscreen; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'isOrientationLocked', {
    set: function(val){ toggleOrientationLock(val); },
    get: function(){ return webAppIsOrientationLocked; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'isActive', {
    get: function(){ return webAppIsActive; },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'headerColor', {
    set: function(val){ setHeaderColor(val); },
    get: function(){ return getHeaderColor(); },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'backgroundColor', {
    set: function(val){ setBackgroundColor(val); },
    get: function(){ return getBackgroundColor(); },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'bottomBarColor', {
    set: function(val){ setBottomBarColor(val); },
    get: function(){ return getBottomBarColor(); },
    enumerable: true
  });
  Object.defineProperty(WebApp, 'BackButton', {
    value: BackButton,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'MainButton', {
    value: MainButton,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'SecondaryButton', {
    value: SecondaryButton,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'SettingsButton', {
    value: SettingsButton,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'HapticFeedback', {
    value: HapticFeedback,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'CloudStorage', {
    value: CloudStorage,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'DeviceStorage', {
    value: DeviceStorage,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'SecureStorage', {
    value: SecureStorage,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'BiometricManager', {
    value: BiometricManager,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'Accelerometer', {
    value: Accelerometer,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'DeviceOrientation', {
    value: DeviceOrientation,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'Gyroscope', {
    value: Gyroscope,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'LocationManager', {
    value: LocationManager,
    enumerable: true
  });
  Object.defineProperty(WebApp, 'Serverless', {
    value: Serverless,
    enumerable: true
  });
  WebApp.isVersionAtLeast = function(ver) {
    return versionAtLeast(ver);
  };
  WebApp.setHeaderColor = function(color_key) {
    WebApp.headerColor = color_key;
  };
  WebApp.setBackgroundColor = function(color) {
    WebApp.backgroundColor = color;
  };
  WebApp.setBottomBarColor = function(color) {
    WebApp.bottomBarColor = color;
  };
  WebApp.enableClosingConfirmation = function() {
    WebApp.isClosingConfirmationEnabled = true;
  };
  WebApp.disableClosingConfirmation = function() {
    WebApp.isClosingConfirmationEnabled = false;
  };
  WebApp.enableVerticalSwipes = function() {
    WebApp.isVerticalSwipesEnabled = true;
  };
  WebApp.disableVerticalSwipes = function() {
    WebApp.isVerticalSwipesEnabled = false;
  };
  WebApp.lockOrientation = function() {
    WebApp.isOrientationLocked = true;
  };
  WebApp.unlockOrientation = function() {
    WebApp.isOrientationLocked = false;
  };
  WebApp.requestFullscreen = function() {
    if (!versionAtLeast('8.0')) {
      console.error('[Telegram.WebApp] Method requestFullscreen is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    WebView.postEvent('web_app_request_fullscreen');
  };
  WebApp.exitFullscreen = function() {
    if (!versionAtLeast('8.0')) {
      console.error('[Telegram.WebApp] Method exitFullscreen is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    WebView.postEvent('web_app_exit_fullscreen');
  };
  WebApp.addToHomeScreen = function() {
    if (!versionAtLeast('8.0')) {
      console.error('[Telegram.WebApp] Method addToHomeScreen is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    WebView.postEvent('web_app_add_to_home_screen');
  };
  WebApp.checkHomeScreenStatus = function(callback) {
    if (!versionAtLeast('8.0')) {
      console.error('[Telegram.WebApp] Method checkHomeScreenStatus is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (callback) {
      homeScreenCallbacks.push(callback);
    }
    WebView.postEvent('web_app_check_home_screen');
  };
  WebApp.onEvent = function(eventType, callback) {
    onWebViewEvent(eventType, callback);
  };
  WebApp.offEvent = function(eventType, callback) {offWebViewEvent(eventType, callback);
  };
  WebApp.sendData = function (data) {
    if (!data || !data.length) {
      console.error('[Telegram.WebApp] Data is required', data);
      throw Error('WebAppDataInvalid');
    }
    if (byteLength(data) > 4096) {
      console.error('[Telegram.WebApp] Data is too long', data);
      throw Error('WebAppDataInvalid');
    }
    WebView.postEvent('web_app_data_send', false, {data: data});
  };
  WebApp.switchInlineQuery = function (query, choose_chat_types) {
    if (!versionAtLeast('6.6')) {
      console.error('[Telegram.WebApp] Method switchInlineQuery is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (!initParams.tgWebAppBotInline) {
      console.error('[Telegram.WebApp] Inline mode is disabled for this bot. Read more about inline mode: https://core.telegram.org/bots/inline');
      throw Error('WebAppInlineModeDisabled');
    }
    query = query || '';
    if (query.length > 256) {
      console.error('[Telegram.WebApp] Inline query is too long', query);
      throw Error('WebAppInlineQueryInvalid');
    }
    var chat_types = [];
    if (choose_chat_types) {
      if (!Array.isArray(choose_chat_types)) {
        console.error('[Telegram.WebApp] Choose chat types should be an array', choose_chat_types);
        throw Error('WebAppInlineChooseChatTypesInvalid');
      }
      var good_types = {users: 1, bots: 1, groups: 1, channels: 1};
      for (var i = 0; i < choose_chat_types.length; i++) {
        var chat_type = choose_chat_types[i];
        if (!good_types[chat_type]) {
          console.error('[Telegram.WebApp] Choose chat type is invalid', chat_type);
          throw Error('WebAppInlineChooseChatTypeInvalid');
        }
        if (good_types[chat_type] != 2) {
          good_types[chat_type] = 2;
          chat_types.push(chat_type);
        }
      }
    }
    WebView.postEvent('web_app_switch_inline_query', false, {query: query, chat_types: chat_types});
  };
  WebApp.openLink = function (url, options) {
    var a = document.createElement('A');
    a.href = url;
    if (a.protocol != 'http:' &&
        a.protocol != 'https:') {
      console.error('[Telegram.WebApp] Url protocol is not supported', url);
      throw Error('WebAppTgUrlInvalid');
    }
    var url = a.href;
    options = options || {};
    if (versionAtLeast('6.1')) {
      var req_params = {url: url};
      if (versionAtLeast('6.4') && options.try_instant_view) {
        req_params.try_instant_view = true;
      }
      if (versionAtLeast('7.6') && options.try_browser) {
        req_params.try_browser = options.try_browser;
      }
      WebView.postEvent('web_app_open_link', false, req_params);
    } else {
      window.open(url, '_blank');
    }
  };
  WebApp.openTelegramLink = function (url, options) {
    var a = document.createElement('A');
    a.href = url;
    if (a.protocol != 'http:' &&
        a.protocol != 'https:') {
      console.error('[Telegram.WebApp] Url protocol is not supported', url);
      throw Error('WebAppTgUrlInvalid');
    }
    if (!isTmeHostname(a.hostname)) {
      console.error('[Telegram.WebApp] Url host is not supported', url);
      throw Error('WebAppTgUrlInvalid');
    }
    var path_full = a.pathname + a.search;
    options = options || {};
    if (isIframe || versionAtLeast('6.1')) {
      var req_params = {path_full: path_full};
      if (options.force_request) {
        req_params.force_request = true;
      }
      WebView.postEvent('web_app_open_tg_link', false, req_params);
    } else {
      location.href = 'https://t.me' + path_full;
    }
  };
  WebApp.openInvoice = function (url, callback) {
    var a = document.createElement('A'), match, slug;
    a.href = url;
    if (a.protocol != 'http:' &&
        a.protocol != 'https:' ||
        !isTmeHostname(a.hostname) ||
        !(match = a.pathname.match(/^\\/(\\$|invoice\\/)([A-Za-z0-9\\-_=]+)$/)) ||
        !(slug = match[2])) {
      console.error('[Telegram.WebApp] Invoice url is invalid', url);
      throw Error('WebAppInvoiceUrlInvalid');
    }
    if (!versionAtLeast('6.1')) {
      console.error('[Telegram.WebApp] Method openInvoice is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (webAppInvoices[slug]) {
      console.error('[Telegram.WebApp] Invoice is already opened');
      throw Error('WebAppInvoiceOpened');
    }
    webAppInvoices[slug] = {
      url: url,
      callback: callback
    };
    WebView.postEvent('web_app_open_invoice', false, {slug: slug});
  };
  WebApp.showPopup = function (params, callback) {
    if (!versionAtLeast('6.2')) {
      console.error('[Telegram.WebApp] Method showPopup is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (webAppPopupOpened) {
      console.error('[Telegram.WebApp] Popup is already opened');
      throw Error('WebAppPopupOpened');
    }
    var title = '';
    var message = '';
    var buttons = [];
    var popup_buttons = {};
    var popup_params = {};
    if (typeof params.title !== 'undefined') {
      title = strTrim(params.title);
      if (title.length > 64) {
        console.error('[Telegram.WebApp] Popup title is too long', title);
        throw Error('WebAppPopupParamInvalid');
      }
      if (title.length > 0) {
        popup_params.title = title;
      }
    }
    if (typeof params.message !== 'undefined') {
      message = strTrim(params.message);
    }
    if (!message.length) {
      console.error('[Telegram.WebApp] Popup message is required', params.message);
      throw Error('WebAppPopupParamInvalid');
    }
    if (message.length > 256) {
      console.error('[Telegram.WebApp] Popup message is too long', message);
      throw Error('WebAppPopupParamInvalid');
    }
    popup_params.message = message;
    if (typeof params.buttons !== 'undefined') {
      if (!Array.isArray(params.buttons)) {
        console.error('[Telegram.WebApp] Popup buttons should be an array', params.buttons);
        throw Error('WebAppPopupParamInvalid');
      }
      for (var i = 0; i < params.buttons.length; i++) {
        var button = params.buttons[i];
        var btn = {};
        var id = '';
        if (typeof button.id !== 'undefined') {
          id = button.id.toString();
          if (id.length > 64) {
            console.error('[Telegram.WebApp] Popup button id is too long', id);
            throw Error('WebAppPopupParamInvalid');
          }
        }
        btn.id = id;
        var button_type = button.type;
        if (typeof button_type === 'undefined') {
          button_type = 'default';
        }
        btn.type = button_type;
        if (button_type == 'ok' ||
            button_type == 'close' ||
            button_type == 'cancel') {
          // no params needed
        } else if (button_type == 'default' ||
                   button_type == 'destructive') {
          var text = '';
          if (typeof button.text !== 'undefined') {
            text = strTrim(button.text);
          }
          if (!text.length) {
            console.error('[Telegram.WebApp] Popup button text is required for type ' + button_type, button.text);
            throw Error('WebAppPopupParamInvalid');
          }
          if (text.length > 64) {
            console.error('[Telegram.WebApp] Popup button text is too long', text);
            throw Error('WebAppPopupParamInvalid');
          }
          btn.text = text;
        } else {
          console.error('[Telegram.WebApp] Popup button type is invalid', button_type);
          throw Error('WebAppPopupParamInvalid');
        }
        buttons.push(btn);
      }
    } else {
      buttons.push({id: '', type: 'close'});
    }
    if (buttons.length < 1) {
      console.error('[Telegram.WebApp] Popup should have at least one button');
      throw Error('WebAppPopupParamInvalid');
    }
    if (buttons.length > 3) {
      console.error('[Telegram.WebApp] Popup should not have more than 3 buttons');
      throw Error('WebAppPopupParamInvalid');
    }
    popup_params.buttons = buttons;

    webAppPopupOpened = {
      callback: callback
    };
    WebView.postEvent('web_app_open_popup', false, popup_params);
  };
  WebApp.showAlert = function (message, callback) {
    WebApp.showPopup({
      message: message
    }, callback ? function(){ callback(); } : null);
  };
  WebApp.showConfirm = function (message, callback) {
    WebApp.showPopup({
      message: message,
      buttons: [
        {type: 'ok', id: 'ok'},
        {type: 'cancel'}
      ]
    }, callback ? function (button_id) {
      callback(button_id == 'ok');
    } : null);
  };
  WebApp.showScanQrPopup = function (params, callback) {
    if (!versionAtLeast('6.4')) {
      console.error('[Telegram.WebApp] Method showScanQrPopup is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (webAppScanQrPopupOpened) {
      console.error('[Telegram.WebApp] Popup is already opened');
      throw Error('WebAppScanQrPopupOpened');
    }
    var text = '';
    var popup_params = {};
    if (typeof params.text !== 'undefined') {
      text = strTrim(params.text);
      if (text.length > 64) {
        console.error('[Telegram.WebApp] Scan QR popup text is too long', text);
        throw Error('WebAppScanQrPopupParamInvalid');
      }
      if (text.length > 0) {
        popup_params.text = text;
      }
    }

    webAppScanQrPopupOpened = {
      callback: callback
    };
    WebView.postEvent('web_app_open_scan_qr_popup', false, popup_params);
  };
  WebApp.closeScanQrPopup = function () {
    if (!versionAtLeast('6.4')) {
      console.error('[Telegram.WebApp] Method closeScanQrPopup is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }

    webAppScanQrPopupOpened = false;
    WebView.postEvent('web_app_close_scan_qr_popup', false);
  };
  WebApp.readTextFromClipboard = function (callback) {
    if (!versionAtLeast('6.4')) {
      console.error('[Telegram.WebApp] Method readTextFromClipboard is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    var req_id = generateCallbackId(16);
    var req_params = {req_id: req_id};
    webAppCallbacks[req_id] = {
      callback: callback
    };
    WebView.postEvent('web_app_read_text_from_clipboard', false, req_params);
  };
  WebApp.requestWriteAccess = function (callback) {
    if (!versionAtLeast('6.9')) {
      console.error('[Telegram.WebApp] Method requestWriteAccess is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (WebAppWriteAccessRequested) {
      console.error('[Telegram.WebApp] Write access is already requested');
      throw Error('WebAppWriteAccessRequested');
    }
    WebAppWriteAccessRequested = {
      callback: callback
    };
    WebView.postEvent('web_app_request_write_access');
  };
  WebApp.requestContact = function (callback) {
    if (!versionAtLeast('6.9')) {
      console.error('[Telegram.WebApp] Method requestContact is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (WebAppContactRequested) {
      console.error('[Telegram.WebApp] Contact is already requested');
      throw Error('WebAppContactRequested');
    }
    WebAppContactRequested = {
      callback: callback
    };
    WebView.postEvent('web_app_request_phone');
  };
  WebApp.downloadFile = function (params, callback) {
    if (!versionAtLeast('8.0')) {
      console.error('[Telegram.WebApp] Method downloadFile is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (webAppDownloadFileRequested) {
      console.error('[Telegram.WebApp] Popup is already opened');
      throw Error('WebAppDownloadFilePopupOpened');
    }
    var a = document.createElement('A');

    var dl_params = {};
    if (!params || !params.url || !params.url.length) {
      console.error('[Telegram.WebApp] Url is required');
      throw Error('WebAppDownloadFileParamInvalid');
    }
    a.href = params.url;
    if (a.protocol != 'https:') {
      console.error('[Telegram.WebApp] Url protocol is not supported', url);
      throw Error('WebAppDownloadFileParamInvalid');
    }
    dl_params.url = a.href;

    if (!params || !params.file_name || !params.file_name.length) {
      console.error('[Telegram.WebApp] File name is required');
      throw Error('WebAppDownloadFileParamInvalid');
    }
    dl_params.file_name = params.file_name;

    webAppDownloadFileRequested = {
      callback: callback
    };
    WebView.postEvent('web_app_request_file_download', false, dl_params);
  };
  WebApp.shareToStory = function (media_url, params) {
    params = params || {};
    if (!versionAtLeast('7.8')) {
      console.error('[Telegram.WebApp] Method shareToStory is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    var a = document.createElement('A');
    a.href = media_url;
    if (a.protocol != 'http:' &&
        a.protocol != 'https:') {
      console.error('[Telegram.WebApp] Media url protocol is not supported', url);
      throw Error('WebAppMediaUrlInvalid');
    }
    var share_params = {};
    share_params.media_url = a.href;
    if (typeof params.text !== 'undefined') {
      var text = strTrim(params.text);
      if (text.length > 2048) {
        console.error('[Telegram.WebApp] Text is too long', text);
        throw Error('WebAppShareToStoryParamInvalid');
      }
      if (text.length > 0) {
        share_params.text = text;
      }
    }
    if (typeof params.widget_link !== 'undefined') {
      params.widget_link = params.widget_link || {};
      a.href = params.widget_link.url;
      if (a.protocol != 'http:' &&
          a.protocol != 'https:') {
        console.error('[Telegram.WebApp] Link protocol is not supported', url);
        throw Error('WebAppShareToStoryParamInvalid');
      }
      var widget_link = {
        url: a.href
      };
      if (typeof params.widget_link.name !== 'undefined') {
        var link_name = strTrim(params.widget_link.name);
        if (link_name.length > 48) {
          console.error('[Telegram.WebApp] Link name is too long', link_name);
          throw Error('WebAppShareToStoryParamInvalid');
        }
        if (link_name.length > 0) {
          widget_link.name = link_name;
        }
      }
      share_params.widget_link = widget_link;
    }

    WebView.postEvent('web_app_share_to_story', false, share_params);
  };
  WebApp.shareMessage = function (msg_id, callback) {
    if (!versionAtLeast('8.0')) {
      console.error('[Telegram.WebApp] Method shareMessage is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (WebAppShareMessageOpened) {
      console.error('[Telegram.WebApp] Share message is already opened');
      throw Error('WebAppShareMessageOpened');
    }
    WebAppShareMessageOpened = {
      callback: callback
    };
    WebView.postEvent('web_app_send_prepared_message', false, {id: msg_id});
  };
  WebApp.requestChat = function (req_id, callback) {
    if (!versionAtLeast('9.6')) {
      console.error('[Telegram.WebApp] Method requestChat is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (WebAppRequestChatOpened) {
      console.error('[Telegram.WebApp] Request chat is already opened');
      throw Error('WebAppRequestChatOpened');
    }
    WebAppRequestChatOpened = {
      callback: callback
    };
    WebView.postEvent('web_app_request_chat', false, {req_id: req_id});
  };
  WebApp.setEmojiStatus = function (custom_emoji_id, params, callback) {
    params = params || {};
    if (!versionAtLeast('8.0')) {
      console.error('[Telegram.WebApp] Method setEmojiStatus is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    var status_params = {};
    status_params.custom_emoji_id = custom_emoji_id;
    if (typeof params.duration !== 'undefined') {
      status_params.duration = params.duration;
    }
    if (WebAppEmojiStatusRequested) {
      console.error('[Telegram.WebApp] Emoji status is already requested');
      throw Error('WebAppEmojiStatusRequested');
    }
    WebAppEmojiStatusRequested = {
      callback: callback
    };
    WebView.postEvent('web_app_set_emoji_status', false, status_params);
  };
  WebApp.requestEmojiStatusAccess = function (callback) {
    if (!versionAtLeast('8.0')) {
      console.error('[Telegram.WebApp] Method requestEmojiStatusAccess is not supported in version ' + webAppVersion);
      throw Error('WebAppMethodUnsupported');
    }
    if (WebAppEmojiStatusAccessRequested) {
      console.error('[Telegram.WebApp] Emoji status permission is already requested');
      throw Error('WebAppEmojiStatusAccessRequested');
    }
    WebAppEmojiStatusAccessRequested = {
      callback: callback
    };
    WebView.postEvent('web_app_request_emoji_status_access');
  };
  WebApp.invokeCustomMethod = function (method, params, callback) {
    invokeCustomMethod(method, params, callback);
  };
  WebApp.hideKeyboard = function () {
    WebView.postEvent('web_app_hide_keyboard');
  };
  WebApp.ready = function () {
    WebView.postEvent('web_app_ready');
  };
  WebApp.expand = function () {
    WebView.postEvent('web_app_expand');
  };
  WebApp.close = function (options) {
    options = options || {};
    var req_params = {};
    if (versionAtLeast('7.6') && options.return_back) {
      req_params.return_back = true;
    }
    WebView.postEvent('web_app_close', false, req_params);
  };

  window.Telegram.WebApp = WebApp;

  updateHeaderColor();
  updateBackgroundColor();
  updateBottomBarColor();
  setViewportHeight();
  if (initParams.tgWebAppShowSettings) {
    SettingsButton.show();
  }

  window.addEventListener('resize', onWindowResize);
  if (isIframe) {
    document.addEventListener('click', linkHandler);
  }

  WebView.onEvent('theme_changed', onThemeChanged);
  WebView.onEvent('viewport_changed', onViewportChanged);
  WebView.onEvent('safe_area_changed', onSafeAreaChanged);
  WebView.onEvent('content_safe_area_changed', onContentSafeAreaChanged);
  WebView.onEvent('visibility_changed', onVisibilityChanged);
  WebView.onEvent('invoice_closed', onInvoiceClosed);
  WebView.onEvent('popup_closed', onPopupClosed);
  WebView.onEvent('qr_text_received', onQrTextReceived);
  WebView.onEvent('scan_qr_popup_closed', onScanQrPopupClosed);
  WebView.onEvent('clipboard_text_received', onClipboardTextReceived);
  WebView.onEvent('write_access_requested', onWriteAccessRequested);
  WebView.onEvent('phone_requested', onPhoneRequested);
  WebView.onEvent('file_download_requested', onFileDownloadRequested);
  WebView.onEvent('custom_method_invoked', onCustomMethodInvoked);
  WebView.onEvent('fullscreen_changed', onFullscreenChanged);
  WebView.onEvent('fullscreen_failed', onFullscreenFailed);
  WebView.onEvent('home_screen_added', onHomeScreenAdded);
  WebView.onEvent('home_screen_checked', onHomeScreenChecked);
  WebView.onEvent('prepared_message_sent', onPreparedMessageSent);
  WebView.onEvent('prepared_message_failed', onPreparedMessageFailed);
  WebView.onEvent('requested_chat_sent', onRequestedChatSent);
  WebView.onEvent('requested_chat_failed', onRequestedChatFailed);
  WebView.onEvent('emoji_status_set', onEmojiStatusSet);
  WebView.onEvent('emoji_status_failed', onEmojiStatusFailed);
  WebView.onEvent('emoji_status_access_requested', onEmojiStatusAccessRequested);
  WebView.postEvent('web_app_request_theme');
  WebView.postEvent('web_app_request_viewport');
  WebView.postEvent('web_app_request_safe_area');
  WebView.postEvent('web_app_request_content_safe_area');

})();
`;

// form-api/tg-miniapp.ts
var env2 = (k) => (process.env[k] || "").trim();
var MIN_SECRET = 16;
var appPin = () => env2("ADMIN_APP_PIN");
var appSecret = () => env2("ADMIN_APP_SECRET");
function appConfigured() {
  return !!botToken() && !!appPin() && appSecret().length >= MIN_SECRET && adminAppIds().length > 0;
}
var INIT_MAX_AGE_SEC = 24 * 3600;
var SESSION_TTL_MS = 12 * 3600 * 1e3;
var LOGIN_MAX_FAILS = 5;
var LOGIN_WINDOW_MS = 10 * 6e4;
var MAX_LOGIN_BODY = 4096;
var PAGE_SIZE = 50;
var PAGE_MAX = 100;
function verifyInitData(initData, token, nowMs, maxAgeSec = INIT_MAX_AGE_SEC) {
  if (!token || typeof initData !== "string" || !initData || initData.length > 8192) return { ok: false, reason: "format" };
  let params;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return { ok: false, reason: "format" };
  }
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return { ok: false, reason: "format" };
  const pairs = [];
  for (const [k, v] of params) if (k !== "hash") pairs.push([k, v]);
  pairs.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  const dataCheck = pairs.map(([k, v]) => `${k}=${v}`).join("\n");
  const secretKey = (0, import_node_crypto4.createHmac)("sha256", "WebAppData").update(token).digest();
  const want = (0, import_node_crypto4.createHmac)("sha256", secretKey).update(dataCheck).digest();
  const given = Buffer.from(hash, "hex");
  if (given.length !== want.length || !(0, import_node_crypto4.timingSafeEqual)(given, want)) return { ok: false, reason: "hash" };
  const authDate = Number(params.get("auth_date"));
  if (!Number.isInteger(authDate) || authDate <= 0) return { ok: false, reason: "format" };
  const ageSec = nowMs / 1e3 - authDate;
  if (ageSec > maxAgeSec || ageSec < -300) return { ok: false, reason: "expired" };
  let userId = 0;
  try {
    const u = JSON.parse(params.get("user") || "null");
    if (u && typeof u.id === "number" && Number.isSafeInteger(u.id) && u.id > 0) userId = u.id;
  } catch {
  }
  if (!userId) return { ok: false, reason: "user" };
  return { ok: true, userId, authDate };
}
var signSessionPart = (payload, secret) => (0, import_node_crypto4.createHmac)("sha256", secret).update(`admin-app-session:${payload}`).digest("base64url");
function signSession(userId, nowMs, secret, ttlMs = SESSION_TTL_MS) {
  const payload = Buffer.from(JSON.stringify({ u: userId, e: nowMs + ttlMs })).toString("base64url");
  return `${payload}.${signSessionPart(payload, secret)}`;
}
function verifySession(token, userId, nowMs, secret) {
  if (!secret || typeof token !== "string" || token.length > 400) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const want = Buffer.from(signSessionPart(payload, secret));
  if (given.length !== want.length || !(0, import_node_crypto4.timingSafeEqual)(given, want)) return false;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return o.u === userId && typeof o.e === "number" && o.e > nowMs;
  } catch {
    return false;
  }
}
function pinMatches(given, pin) {
  if (!pin || typeof given !== "string" || given.length > 64) return false;
  return (0, import_node_crypto4.timingSafeEqual)((0, import_node_crypto4.createHash)("sha256").update(given.trim()).digest(), (0, import_node_crypto4.createHash)("sha256").update(pin).digest());
}
var loginFails = /* @__PURE__ */ new Map();
function recentFails(userId, now) {
  const list = (loginFails.get(userId) || []).filter((t) => now - t < LOGIN_WINDOW_MS);
  if (list.length) loginFails.set(userId, list);
  else loginFails.delete(userId);
  return list;
}
function loginLockedFor(userId, now) {
  const list = recentFails(userId, now);
  return list.length >= LOGIN_MAX_FAILS ? Math.max(1, Math.ceil((list[0] + LOGIN_WINDOW_MS - now) / 1e3)) : 0;
}
function noteLoginFail(userId, now) {
  const list = recentFails(userId, now);
  list.push(now);
  loginFails.set(userId, list);
  if (loginFails.size > 500) {
    for (const k of loginFails.keys()) if (!recentFails(k, now).length) loginFails.delete(k);
  }
  return Math.max(0, LOGIN_MAX_FAILS - list.length);
}
var pct3 = (part, whole) => whole > 0 ? Math.round(part * 100 / whole) : 0;
var inc2 = (m, k, n = 1) => void m.set(k, (m.get(k) || 0) + n);
var WD = ["\u0432\u0441", "\u043F\u043D", "\u0432\u0442", "\u0441\u0440", "\u0447\u0442", "\u043F\u0442", "\u0441\u0431"];
function weekday(day) {
  const [y, m, d] = day.split("-").map(Number);
  return WD[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
var stamp = (ms) => `${ddmm(dayKeyOf(ms))} ${hhmmOf(ms)}`;
function aux(ctx) {
  const paths = ctx.store.paths();
  const clickChats = /* @__PURE__ */ new Set();
  for (const r of readJsonlCached(paths.clicks).rows) if (typeof r.chat_id === "number") clickChats.add(r.chat_id);
  const selfPaid = /* @__PURE__ */ new Set();
  for (const r of readJsonlCached(paths.subs).rows) if (r.type === "paid" && r.by === "self" && typeof r.chat_id === "number") selfPaid.add(r.chat_id);
  return { clickChats, selfPaid };
}
function funnel(ctx, g, basis, a) {
  if (basis === "stream") {
    let registered = 0;
    let clicked2 = 0;
    let paid2 = 0;
    for (const d of g.p.days) {
      const m = ctx.store.dayMetrics(d);
      registered += m.registered;
      clicked2 += m.clicked;
      paid2 += m.paid;
    }
    return { registered, clicked: clicked2, paid: paid2 };
  }
  let clicked = 0;
  let paid = 0;
  for (const s of g.newSubs) {
    if (a.clickChats.has(s.chatId)) clicked++;
    if (a.selfPaid.has(s.chatId)) paid++;
  }
  return { registered: g.newSubs.length, clicked, paid };
}
function cardsOf(ctx, g, basis, a) {
  const f = funnel(ctx, g, basis, a);
  const reached = g.leads.filter((l) => linked(g, l)).length;
  return {
    leads: g.leads.length,
    bot: f.registered,
    reached,
    conv: pct3(reached, g.leads.length),
    wa: g.ty.filter((r) => r.ch === "wa").length,
    tg: g.ty.filter((r) => r.ch === "tg").length,
    clicked: f.clicked,
    paid: f.paid,
    blocked: g.blockedEvents
  };
}
var leadKey = (l) => hasUtm(l) ? utmLabel(l) : `\u0431\u0435\u0437 \u043C\u0435\u0442\u043A\u0438: ${noUtmLabel(l)}`;
function dailyOf(ctx, g, basis) {
  const leads = /* @__PURE__ */ new Map();
  const reached = /* @__PURE__ */ new Map();
  const subs = /* @__PURE__ */ new Map();
  const wa = /* @__PURE__ */ new Map();
  const tg = /* @__PURE__ */ new Map();
  for (const l of g.leads) {
    inc2(leads, l.day);
    if (linked(g, l)) inc2(reached, l.day);
  }
  for (const s of g.newSubs) inc2(subs, dayKeyOf(s.firstStartAt));
  for (const r of g.ty) inc2(r.ch === "wa" ? wa : tg, r.day);
  return g.p.days.map((d) => {
    const n = leads.get(d) || 0;
    const r = reached.get(d) || 0;
    return {
      day: d,
      label: ddmm(d),
      wd: weekday(d),
      leads: n,
      reached: r,
      conv: pct3(r, n),
      bot: basis === "stream" ? ctx.store.registeredOn(d).length : subs.get(d) || 0,
      wa: wa.get(d) || 0,
      tg: tg.get(d) || 0
    };
  });
}
function hourlyOf(g) {
  const rows = Array.from({ length: 24 }, (_, h) => ({ h, leads: 0, bot: 0 }));
  for (const l of g.leads) rows[partsInTZ(l.ts).hour].leads++;
  for (const s of g.newSubs) rows[partsInTZ(s.firstStartAt).hour].bot++;
  return rows;
}
function sourcesOf(g) {
  const rows = /* @__PURE__ */ new Map();
  for (const l of g.leads) {
    const key = leadKey(l);
    let r = rows.get(key);
    if (!r) rows.set(key, r = { key, label: key, kind: hasUtm(l) ? "utm" : "none", leads: 0, bot: 0, pct: 0 });
    r.leads++;
    if (linked(g, l)) r.bot++;
  }
  for (const s of g.newSubs) {
    const o = classifyPayload(s.payload);
    if (o.kind !== "tag") continue;
    const key = `tag:${o.tag}`;
    let r = rows.get(key);
    if (!r) rows.set(key, r = { key: o.tag, label: `\u043C\u0435\u0442\u043A\u0430 \u0431\u043E\u0442\u0430: ${o.tag}`, kind: "tag", leads: 0, bot: 0, pct: 0 });
    r.bot++;
  }
  for (const r of rows.values()) r.pct = r.kind === "tag" ? 0 : pct3(r.bot, r.leads);
  return [...rows.values()].sort((a, b) => b.leads - a.leads || b.bot - a.bot || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0)).slice(0, 200);
}
function streamsOf(ctx, p) {
  const sentBy = /* @__PURE__ */ new Map();
  for (const r of readJsonlCached(ctx.store.paths().sent).rows) {
    const day = String(r.day ?? "");
    if (!isDayKey(day) || day < p.from || day > p.to || typeof r.msg !== "string") continue;
    let per = sentBy.get(day);
    if (!per) sentBy.set(day, per = /* @__PURE__ */ new Map());
    const c = per.get(r.msg) || { ok: 0, bad: 0 };
    if (r.ok === true) c.ok++;
    else c.bad++;
    per.set(r.msg, c);
  }
  const order = /* @__PURE__ */ new Map();
  try {
    activeSeries().messages.forEach((m, i) => order.set(m.id, { at: m.at, off: m.dayOffset ?? 0, i }));
  } catch {
  }
  const out = [];
  for (const d of p.days) {
    const m = ctx.store.dayMetrics(d);
    const per = sentBy.get(d);
    if (!m.registered && !per) continue;
    const messages = [...per?.entries() ?? []].map(([id, c]) => ({ id, at: order.get(id)?.at ?? "", off: order.get(id)?.off ?? 0, ok: c.ok, bad: c.bad, i: order.get(id)?.i ?? 999 })).sort((x, y) => Number(x.i === 999) - Number(y.i === 999) || x.off - y.off || x.at.localeCompare(y.at) || x.id.localeCompare(y.id)).map(({ i: _i, ...rest }) => rest);
    out.push({
      day: d,
      label: ddmm(d),
      wd: weekday(d),
      registered: m.registered,
      clicked: m.clicked,
      pct: pct3(m.clicked, m.registered),
      paid: m.paid,
      sentOk: messages.reduce((n, x) => n + x.ok, 0),
      sentBad: messages.reduce((n, x) => n + x.bad, 0),
      messages
    });
  }
  return out.reverse();
}
var meta = (ctx) => ({ today: dayKeyOf(ctx.now), updated: hhmmOf(ctx.now), tz: "Asia/Almaty" });
function buildSummary(ctx, p, basis) {
  const a = aux(ctx);
  const g = gather(ctx, p);
  const prevP = periodFromDates(addDays(p.from, -p.days.length), addDays(p.from, -1));
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
    totals: { subscribers: ctx.store.subs.size, active, paid }
  };
}
function page(rows, q2) {
  const items = rows.slice(q2.offset, q2.offset + q2.limit);
  return { items, total: rows.length, offset: q2.offset, hasMore: q2.offset + items.length < rows.length };
}
function buildLeads(ctx, p, q2) {
  const g = gather(ctx, p);
  const needle = q2.q.trim().toLowerCase();
  const digits = needle.replace(/\D/g, "");
  const utm = q2.utm.trim().toLowerCase();
  const rows = g.leads.filter((l) => {
    const inBot = linked(g, l);
    if (q2.inbot === "1" && !inBot) return false;
    if (q2.inbot === "0" && inBot) return false;
    if (utm) {
      const key = leadKey(l).toLowerCase();
      if (utm === "\u0431\u0435\u0437 \u043C\u0435\u0442\u043A\u0438" ? hasUtm(l) : key !== utm) return false;
    }
    if (needle) {
      const byName = l.name.toLowerCase().includes(needle);
      const byPhone = digits.length >= 2 && l.phone.replace(/\D/g, "").includes(digits);
      if (!byName && !byPhone) return false;
    }
    return true;
  }).sort((x, y) => y.ts - x.ts).map((l) => ({
    id: l.id,
    ts: l.ts,
    t: stamp(l.ts),
    name: l.name,
    phone: l.phone,
    telegram: l.telegram,
    place: l.place,
    utm: leadKey(l),
    inBot: linked(g, l)
  }));
  return { ok: true, meta: meta(ctx), leadsOk: g.leadsOk, leadsError: g.leadsOk ? "" : g.leadsError.slice(0, 120), ...page(rows, q2) };
}
function originLabel(kind, tag) {
  if (kind === "pp") return "\u043E\u043A\u043D\u043E \u043D\u0430 \u0441\u0430\u0439\u0442\u0435";
  if (kind === "ty") return "\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \xAB\u0421\u043F\u0430\u0441\u0438\u0431\u043E\xBB";
  if (kind === "tag") return `\u043C\u0435\u0442\u043A\u0430: ${tag}`;
  return "\u043F\u0440\u044F\u043C\u043E\u0439 /start";
}
function buildSubscribers(ctx, p, basis, q2) {
  const g = gather(ctx, p);
  const a = aux(ctx);
  let cohort;
  if (basis === "stream") {
    const seen = /* @__PURE__ */ new Set();
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
  const needle = q2.q.trim().toLowerCase().replace(/^@/, "");
  const utm = q2.utm.trim().toLowerCase();
  const rows = cohort.map((s) => {
    const o = classifyPayload(s.payload);
    const lead = o.eid ? g.leadByEid.get(o.eid) : void 0;
    return { s, o, src: lead ? leadKey(lead) : "" };
  }).filter(({ s, o, src }) => {
    if (utm && !(o.tag && o.tag === utm) && src.toLowerCase() !== utm && !(utm === "\u0431\u0435\u0437 \u043C\u0435\u0442\u043A\u0438" && !!src && src.startsWith("\u0431\u0435\u0437 \u043C\u0435\u0442\u043A\u0438"))) return false;
    if (needle && !s.firstName.toLowerCase().includes(needle) && !s.username.toLowerCase().includes(needle)) return false;
    if (q2.flag === "blocked" && !s.blocked) return false;
    if (q2.flag === "paid" && !s.paid) return false;
    if (q2.flag === "clicked" && !a.clickChats.has(s.chatId)) return false;
    if (q2.flag === "noclick" && a.clickChats.has(s.chatId)) return false;
    return true;
  }).sort((x, y) => y.s.firstStartAt - x.s.firstStartAt).map(({ s, o, src }) => ({
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
    stopped: s.stopped
  }));
  return { ok: true, meta: meta(ctx), basis, ...page(rows, q2) };
}
var uptimeText2 = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor(sec % 3600 / 60);
  return h >= 24 ? `${Math.floor(h / 24)} \u0434\u043D. ${h % 24} \u0447` : `${h} \u0447 ${m} \u043C\u0438\u043D`;
};
function buildErrors(ctx, p) {
  const g = gather(ctx, p);
  const bad = g.sent.filter((e) => !e.ok);
  const groups = /* @__PURE__ */ new Map();
  for (const e of bad) inc2(groups, String(e.err ?? "\u0431\u0435\u0437 \u0442\u0435\u043A\u0441\u0442\u0430").replace(/\d{5,}/g, "#").slice(0, 70));
  const last = [...bad].sort((x, y) => Date.parse(y.ts) - Date.parse(x.ts)).slice(0, 10).map((e) => ({ t: stamp(Date.parse(e.ts)), msg: String(e.msg).slice(0, 40), err: String(e.err ?? "").replace(/\d{5,}/g, "#").slice(0, 100) }));
  const rt2 = runtime.events;
  const skipped = rt2.filter((e) => e.type === "skipLate");
  const uptimeSec = Math.floor(process.uptime());
  return {
    ok: true,
    meta: meta(ctx),
    sentTotal: g.sent.length,
    sentOk: g.sent.length - bad.length,
    failed: bad.length,
    groups: [...groups.entries()].sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1)).slice(0, 8).map(([text2, n]) => ({ text: text2, n })),
    last,
    blocked: g.blockedEvents,
    runtime: {
      skipLate: skipped.length,
      skipLateIds: [...new Set(skipped.map((e) => e.msg || "?"))].slice(0, 8),
      mediaFallback: rt2.filter((e) => e.type === "mediaFallback").length,
      tickError: rt2.filter((e) => e.type === "tickError").length,
      webhookRejected: runtime.webhookRejected
    },
    uptimeSec,
    uptime: uptimeText2(uptimeSec),
    version: (ctx.version ?? adminVersion()).slice(0, 60)
  };
}
function send(res, status, body, extra = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extra
  });
  res.end(payload);
}
var FORBIDDEN = { ok: false, error: "forbidden" };
function header(req, name) {
  const v = req.headers[name];
  return (Array.isArray(v) ? v[0] : v) || "";
}
function readLimited2(req, max) {
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
function gateInit(initData) {
  if (!appConfigured()) return { ok: false, status: 503, body: { ok: false, error: "not_configured" } };
  const v = verifyInitData(initData, botToken(), Date.now());
  if (!v.ok || !isAdminAppUser(v.userId)) return { ok: false, status: 403, body: FORBIDDEN };
  return { ok: true, userId: v.userId };
}
async function handleAdminLogin(req, res) {
  const raw = await readLimited2(req, MAX_LOGIN_BODY);
  let body = {};
  try {
    if (raw) body = JSON.parse(raw);
  } catch {
    body = {};
  }
  const initData = typeof body.initData === "string" && body.initData ? body.initData : header(req, "x-tg-init-data");
  const gate = gateInit(initData);
  if (!gate.ok) return send(res, gate.status, gate.body);
  const now = Date.now();
  const wait = loginLockedFor(gate.userId, now);
  if (wait > 0) {
    console.warn("[admin-app] \u0432\u0445\u043E\u0434 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D: \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u0445 \u043F\u0430\u0440\u043E\u043B\u0435\u0439");
    return send(res, 429, { ok: false, error: "too_many", retryAfter: wait }, { "Retry-After": String(wait) });
  }
  if (!pinMatches(body.pin, appPin())) {
    const left = noteLoginFail(gate.userId, now);
    console.warn("[admin-app] \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C, \u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043F\u044B\u0442\u043E\u043A: %d", left);
    return send(res, 401, { ok: false, error: "bad_pin", left });
  }
  loginFails.delete(gate.userId);
  console.log("[admin-app] \u0432\u0445\u043E\u0434 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D");
  send(res, 200, {
    ok: true,
    token: signSession(gate.userId, now, appSecret()),
    expiresAt: now + SESSION_TTL_MS,
    meta: { today: dayKeyOf(now), updated: hhmmOf(now), tz: "Asia/Almaty" }
  });
}
function periodOf(qs, ctx) {
  const from = qs.get("from") || "";
  const to = qs.get("to") || "";
  if (from || to) return periodFromDates(from, to || from);
  const key = (qs.get("period") || "t").slice(0, 10);
  return resolvePeriod(key, ctx.now, key === "all" ? firstDataDay(ctx) : void 0);
}
function listQuery(qs) {
  const num = (k, def) => {
    const raw = qs.get(k);
    if (raw === null || raw === "") return def;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : def;
  };
  const limit = Math.min(PAGE_MAX, Math.max(1, num("limit", PAGE_SIZE)));
  return {
    q: (qs.get("q") || "").slice(0, 100),
    utm: (qs.get("utm") || "").slice(0, 160),
    inbot: qs.get("inbot") === "1" ? "1" : qs.get("inbot") === "0" ? "0" : "",
    flag: ["blocked", "paid", "clicked", "noclick"].includes(qs.get("flag") || "") ? qs.get("flag") : "",
    offset: num("offset", 0),
    limit
  };
}
function gateAdminSession(req) {
  const gate = gateInit(header(req, "x-tg-init-data"));
  if (!gate.ok) return gate;
  const m = /^Bearer\s+(\S+)$/i.exec(header(req, "authorization"));
  if (!m || !verifySession(m[1], gate.userId, Date.now(), appSecret())) return { ok: false, status: 401, body: { ok: false, error: "session" } };
  return gate;
}
var adminJson = send;
var adminReadBody = readLimited2;
function handleAdminData(req, res, path) {
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
    const basis = qs.get("basis") === "stream" ? "stream" : "reg";
    if (what === "summary") return send(res, 200, buildSummary(ctx, p, basis));
    if (what === "leads") return send(res, 200, buildLeads(ctx, p, listQuery(qs)));
    if (what === "subscribers") return send(res, 200, buildSubscribers(ctx, p, basis, listQuery(qs)));
    return send(res, 200, buildErrors(ctx, p));
  } catch (e) {
    console.error("[admin-app] \u043E\u0448\u0438\u0431\u043A\u0430 \u0441\u0431\u043E\u0440\u043A\u0438 \u0434\u0430\u043D\u043D\u044B\u0445:", String(e?.message || e).slice(0, 200));
    if (!res.headersSent) send(res, 500, { ok: false, error: "internal" });
  }
}
function readPage() {
  const candidates = [env2("ADMIN_APP_HTML"), (0, import_node_path7.join)(__dirname, "admin-app.html"), (0, import_node_path7.join)(__dirname, "..", "admin-app.html")].filter(Boolean);
  for (const f of candidates) {
    try {
      return (0, import_node_fs7.readFileSync)(f, "utf8");
    } catch {
    }
  }
  return null;
}
function handleTgSdk(req, res) {
  res.writeHead(200, {
    "Content-Type": "application/javascript; charset=utf-8",
    "Content-Length": Buffer.byteLength(TG_WEBAPP_SDK),
    "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(req.method === "HEAD" ? void 0 : TG_WEBAPP_SDK);
}
function handleAdminApp(req, res) {
  const html = readPage();
  if (html === null) return send(res, 404, { ok: false, error: "not_found" });
  const nonce = (0, import_node_crypto4.randomBytes)(16).toString("base64");
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
      "frame-ancestors https://telegram.org https://*.telegram.org"
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });
  res.end(req.method === "HEAD" ? void 0 : body);
}

// form-api/wa-groups.ts
var import_node_fs10 = require("node:fs");
var import_node_path10 = require("node:path");

// form-api/wa-evolution.ts
var env3 = (k) => (process.env[k] || "").trim();
var evoUrl = () => (env3("EVOLUTION_URL") || "http://127.0.0.1:8080").replace(/\/+$/, "");
var evoKey = () => env3("EVOLUTION_API_KEY");
var evoInstance = () => env3("EVOLUTION_INSTANCE") || "workshop";
var TIMEOUT_MS = 2e4;
var MEDIA_TIMEOUT_MS = 9e4;
var CREATE_TIMEOUT_MS = 9e4;
var CONNECT_FAIL_CODES2 = /* @__PURE__ */ new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH", "UND_ERR_CONNECT_TIMEOUT"]);
var scrub2 = (s) => {
  const k = evoKey();
  return k ? s.split(k).join("***") : s;
};
function errorText(data, fallback) {
  const m = data?.response?.message ?? data?.message ?? data?.error;
  const text2 = Array.isArray(m) ? m.map((x) => typeof x === "string" ? x : JSON.stringify(x)).join("; ") : typeof m === "string" ? m : m ? JSON.stringify(m) : "";
  return scrub2((text2 || fallback).slice(0, 300));
}
async function evoCall(method, path, body, timeoutMs2 = TIMEOUT_MS) {
  const key = evoKey();
  if (!key) return { ok: false, status: 0, error: "no_api_key" };
  try {
    const res = await fetch(`${evoUrl()}${path}`, {
      method,
      headers: { apikey: key, ...body !== void 0 ? { "Content-Type": "application/json" } : {} },
      ...body !== void 0 ? { body: JSON.stringify(body) } : {},
      signal: AbortSignal.timeout(timeoutMs2)
    });
    const text2 = await res.text();
    let data = null;
    try {
      data = text2 ? JSON.parse(text2) : null;
    } catch {
      data = null;
    }
    if (res.ok) return { ok: true, status: res.status, data };
    return { ok: false, status: res.status, error: `${res.status} ${errorText(data, res.statusText || text2.slice(0, 100))}`, data };
  } catch (e) {
    const err = e;
    const timeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    return {
      ok: false,
      status: 0,
      error: timeout ? "timeout" : scrub2(String(err?.cause?.code || err?.message || err)),
      ...timeout ? { timeout: true } : {},
      ...!timeout && err?.cause?.code && CONNECT_FAIL_CODES2.has(err.cause.code) ? { connectFail: true } : {}
    };
  }
}
var I = () => encodeURIComponent(evoInstance());
var q = (jid) => `?communityJid=${encodeURIComponent(jid)}`;
async function connectionState() {
  const r = await evoCall("GET", `/instance/connectionState/${I()}`);
  if (r.ok) return { ok: true, status: r.status, data: { state: String(r.data?.instance?.state ?? "unknown") } };
  if (r.status === 404) return { ok: true, status: 404, data: { state: "absent" } };
  return r;
}
async function fetchInstance() {
  const r = await evoCall("GET", `/instance/fetchInstances?instanceName=${I()}`);
  if (!r.ok) {
    if (r.status === 404) return { ok: true, status: 404, data: emptyInstance() };
    return r;
  }
  const row = Array.isArray(r.data) ? r.data[0] : r.data;
  if (!row || typeof row !== "object") return { ok: true, status: r.status, data: emptyInstance() };
  const obj = row.disconnectionObject;
  const code = Number(row.disconnectionReasonCode);
  return {
    ok: true,
    status: r.status,
    data: {
      found: true,
      ownerJid: String(row.ownerJid || ""),
      profileName: String(row.profileName || ""),
      number: String(row.number || ""),
      connectionStatus: String(row.connectionStatus || ""),
      disconnectionReasonCode: row.disconnectionReasonCode === null || row.disconnectionReasonCode === void 0 || !Number.isFinite(code) ? null : code,
      disconnectionObject: obj === null || obj === void 0 ? "" : (typeof obj === "string" ? obj : JSON.stringify(obj)).slice(0, 4e3),
      disconnectionAt: String(row.disconnectionAt || "")
    }
  };
}
var emptyInstance = () => ({ found: false, ownerJid: "", profileName: "", number: "", connectionStatus: "", disconnectionReasonCode: null, disconnectionObject: "", disconnectionAt: "" });
function createInstance(number) {
  return evoCall("POST", "/instance/create", {
    instanceName: evoInstance(),
    integration: "WHATSAPP-BAILEYS",
    qrcode: true,
    ...number ? { number } : {},
    rejectCall: false,
    groupsIgnore: false,
    alwaysOnline: false,
    readMessages: false,
    readStatus: false,
    syncFullHistory: false
  }, 3e4);
}
function connectInstance(number) {
  return evoCall("GET", `/instance/connect/${I()}${number ? `?number=${encodeURIComponent(number)}` : ""}`, void 0, 3e4);
}
var logoutInstance = () => evoCall("DELETE", `/instance/logout/${I()}`, void 0, 3e4);
var GROUPS_TIMEOUT_MS = 6e4;
async function fetchAllGroups(withParticipants) {
  const r = await evoCall("GET", `/group/fetchAllGroups/${I()}?getParticipants=${withParticipants ? "true" : "false"}`, void 0, GROUPS_TIMEOUT_MS);
  if (!r.ok) return r;
  if (!Array.isArray(r.data)) return { ok: false, status: r.status, error: "\u0432 \u043E\u0442\u0432\u0435\u0442\u0435 fetchAllGroups \u043D\u0435\u0442 \u0441\u043F\u0438\u0441\u043A\u0430", data: r.data };
  return { ok: true, status: r.status, data: r.data };
}
async function communityCreate(p) {
  const r = await evoCall("POST", `/community/create/${I()}`, p, CREATE_TIMEOUT_MS);
  if (!r.ok) return r;
  const communityJid = String(r.data?.communityJid || "");
  const announcementJid = String(r.data?.announcementJid || "");
  if (!communityJid.endsWith("@g.us") || !announcementJid.endsWith("@g.us")) {
    return { ok: false, status: r.status, error: "\u0432 \u043E\u0442\u0432\u0435\u0442\u0435 create \u043D\u0435\u0442 communityJid \u0438\u043B\u0438 announcementJid", data: r.data };
  }
  return { ok: true, status: r.status, data: { communityJid, announcementJid } };
}
var communityInfo = (jid) => evoCall("GET", `/community/info/${I()}${q(jid)}`);
async function communityInvite(jid) {
  const r = await evoCall("GET", `/community/inviteCode/${I()}${q(jid)}`);
  if (!r.ok) return r;
  return inviteOf(r);
}
var communitySetting = (jid, action) => evoCall("POST", `/community/updateSetting/${I()}${q(jid)}`, { action });
var communityMemberAddMode = (jid, mode) => evoCall("POST", `/community/memberAddMode/${I()}${q(jid)}`, { mode });
var communityJoinApproval = (jid, mode) => evoCall("POST", `/community/joinApprovalMode/${I()}${q(jid)}`, { mode });
var communityRequests = (jid) => evoCall("GET", `/community/requests/${I()}${q(jid)}`);
var communityDecide = (jid, participants, action) => evoCall("POST", `/community/requests/${I()}${q(jid)}`, { participants, action });
async function groupCreate(p) {
  const r = await evoCall("POST", `/group/create/${I()}`, { ...p, promoteParticipants: true }, CREATE_TIMEOUT_MS);
  if (!r.ok) return r;
  const groupJid = String(r.data?.id || "");
  if (!groupJid.endsWith("@g.us")) return { ok: false, status: r.status, error: "\u0432 \u043E\u0442\u0432\u0435\u0442\u0435 group/create \u043D\u0435\u0442 id \u0433\u0440\u0443\u043F\u043F\u044B", data: r.data };
  return { ok: true, status: r.status, data: { groupJid } };
}
var groupSetting = (jid, action) => evoCall("POST", `/group/updateSetting/${I()}`, { groupJid: jid, action });
async function groupInvite(jid) {
  const r = await evoCall("GET", `/group/inviteCode/${I()}?groupJid=${encodeURIComponent(jid)}`);
  if (!r.ok) return r;
  return inviteOf(r);
}
var groupInfo = (jid) => evoCall("GET", `/group/findGroupInfos/${I()}?groupJid=${encodeURIComponent(jid)}`);
var updatePicture = (jid, imageUrl) => evoCall("POST", `/group/updateGroupPicture/${I()}`, { groupJid: jid, image: imageUrl }, MEDIA_TIMEOUT_MS);
function inviteOf(r) {
  const inviteCode = String(r.data?.inviteCode || "");
  const inviteUrl = String(r.data?.inviteUrl || (inviteCode ? `https://chat.whatsapp.com/${inviteCode}` : ""));
  if (!inviteUrl) return { ok: false, status: r.status, error: "\u0432 \u043E\u0442\u0432\u0435\u0442\u0435 \u043D\u0435\u0442 \u0441\u0441\u044B\u043B\u043A\u0438-\u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F", data: r.data };
  return { ok: true, status: r.status, data: { inviteCode, inviteUrl } };
}
async function groupParticipants(jid) {
  const r = await evoCall("GET", `/group/participants/${I()}?groupJid=${encodeURIComponent(jid)}`, void 0, GROUPS_TIMEOUT_MS);
  if (!r.ok) return r;
  const list = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.participants) ? r.data.participants : null;
  if (!list) return { ok: false, status: r.status, error: "\u0432 \u043E\u0442\u0432\u0435\u0442\u0435 participants \u043D\u0435\u0442 \u0441\u043F\u0438\u0441\u043A\u0430", data: r.data };
  const members = [];
  for (const p of list) {
    if (!p || typeof p !== "object") continue;
    members.push({ id: String(p.id ?? p.jid ?? ""), phoneNumber: String(p.phoneNumber ?? p.phone ?? ""), admin: String(p.admin ?? "") });
  }
  return { ok: true, status: r.status, data: members };
}
async function contactPushName(digits) {
  const r = await evoCall("POST", `/chat/findContacts/${I()}`, { where: { remoteJid: `${digits}@s.whatsapp.net` } });
  if (!r.ok) return r;
  const list = Array.isArray(r.data) ? r.data : [];
  const hit = list.find((c) => c && typeof c.pushName === "string" && c.pushName.trim());
  return { ok: true, status: r.status, data: hit ? String(hit.pushName).trim() : "" };
}
function sentOf(r) {
  if (!r.ok) return r;
  return { ok: true, status: r.status, data: { messageId: String(r.data?.key?.id || "") } };
}
async function sendText2(jid, text2, opts = {}) {
  const delay = opts.delay && opts.delay > 0 ? Math.round(opts.delay) : 0;
  return sentOf(await evoCall("POST", `/message/sendText/${I()}`, { number: jid, text: text2, linkPreview: false, ...delay ? { delay } : {} }, delay ? TIMEOUT_MS + delay : TIMEOUT_MS));
}
function setWebhook(p) {
  return evoCall("POST", `/webhook/set/${I()}`, {
    webhook: {
      enabled: p.enabled,
      url: p.url,
      events: p.enabled ? p.events ?? ["MESSAGES_UPSERT"] : [],
      byEvents: false,
      base64: false,
      ...p.enabled && p.headers ? { headers: p.headers } : {}
    }
  });
}
async function sendMedia2(jid, p) {
  const mimetype = p.mediatype === "video" ? "video/mp4" : /\.png$/i.test(p.url) ? "image/png" : "image/jpeg";
  return sentOf(
    await evoCall("POST", `/message/sendMedia/${I()}`, { number: jid, mediatype: p.mediatype, mimetype, media: p.url, ...p.caption ? { caption: p.caption } : {} }, MEDIA_TIMEOUT_MS)
  );
}
async function sendPoll(jid, p) {
  return sentOf(await evoCall("POST", `/message/sendPoll/${I()}`, { number: jid, name: p.name, selectableCount: p.selectableCount, values: p.values }));
}

// form-api/wa-assistant.ts
var import_node_fs8 = require("node:fs");
var import_node_crypto5 = require("node:crypto");
var import_node_path8 = require("node:path");
var env4 = (k) => (process.env[k] || "").trim();
var MIN = 6e4;
var HOUR = 36e5;
var DAY = 24 * HOUR;
var HISTORY = 16;
var LIMIT_PERSON = 30;
var LIMIT_TOTAL = 400;
var SILENCE_MS = 12 * HOUR;
var quietMs = () => {
  const n = Number(env4("WA_AI_QUIET_MS"));
  return Number.isFinite(n) && n >= 0 && env4("WA_AI_QUIET_MS") !== "" ? n : 8e3;
};
var timeoutMs = () => {
  const n = Number(env4("WA_AI_TIMEOUT_MS"));
  return Number.isFinite(n) && n > 0 ? n : 3e4;
};
var STALE_MS = 15 * MIN;
var PAUSE_MS = [2e3, 5e3];
var MAX_TEXT = 1500;
var FILE_TAIL_BYTES = 3 * 1024 * 1024;
var FILE_COMPACT_BYTES = 6 * 1024 * 1024;
var MODEL = () => env4("WA_AI_MODEL") || "gpt-5.6-luna";
var openaiBase = () => (env4("OPENAI_BASE_URL") || "https://api.openai.com/v1").replace(/\/+$/, "");
var apiKey = () => env4("OPENAI_API_KEY");
var promptDir = () => env4("WA_AI_DIR") || (0, import_node_path8.join)(__dirname, "wa-assistant");
var hookUrl = () => env4("WA_HOOK_URL") || `http://127.0.0.1:${env4("PORT") || "4010"}/api/wa-hook`;
var SAFE_FALLBACK = "\u041F\u043E\u0434\u0441\u043A\u0430\u0436\u0435\u0442 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 \u0448\u043A\u043E\u043B\u044B: https://onai.academy/workshop-montazh/chat";
var MEDIA_PHRASE = "\u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435, \u043F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0442\u0435\u043A\u0441\u0442\u043E\u043C.";
var fail = (code, message) => ({ ok: false, code, message });
var ALLOWED_LINKS = ["onai.academy/workshop-montazh", "wa.me/77085834575", "t.me/futleid", "t.me/workshop_aiprod_bot"];
var ALLOWED_HANDLES = /* @__PURE__ */ new Set(["@futleid", "@workshop_aiprod_bot", "@saint4ai"]);
var AYANA_RE = /wa\.me\/77085834575|t\.me\/futleid|@futleid/i;
var URL_RE = /(?:https?:\/\/|www\.)[^\s<>"'«»]+/giu;
var BARE_RE = /(?<![\p{L}\p{N}_@./-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?![\p{L}\p{N}-])(?:[/?#][^\s<>"'«»]*)?/giu;
var TIME_RE = /(?<!\d)\d{1,2}[:.]\d{2}(?!\d)/g;
function allowedLink(candidate) {
  let s = candidate.trim().replace(/[.,;:!?)\]}»"'…]+$/u, "").toLowerCase();
  if (s.startsWith("http://")) return false;
  s = s.replace(/^https:\/\//, "").replace(/^www\./, "");
  if (/^[a-z][a-z0-9+.-]*:\/\//.test(s)) return false;
  return ALLOWED_LINKS.some((p) => s === p || s.startsWith(`${p}/`) || s.startsWith(`${p}?`) || s.startsWith(`${p}#`));
}
var PRICE_WORD = new RegExp("(?<![\\p{L}])(?:\u0440\u0430\u0441\u0441\u0440\u043E\u0447\u043A\\p{L}*|\u0441\u0442\u043E\u0438\u0442|\u0441\u0442\u043E\u044F\u0442|\u0441\u0442\u043E\u0438\u043C\u043E\u0441\u0442\\p{L}*|\u0446\u0435\u043D(?:\u0430|\u044B|\u0443|\u0435|\u043E\u0439)(?![\\p{L}])|\u043F\u0440\u0435\u0434\u043E\u043F\u043B\u0430\u0442\\p{L}*|\u0431\u0440\u043E\u043D\u044C|\u0431\u0440\u043E\u043D\u0438|\u0441\u043A\u0438\u0434\u043A\\p{L}*|\u043E\u0431\u043E\u0439\u0434\\p{L}*|\u0437\u0430\u043F\u043B\u0430\u0442\\p{L}*)", "giu");
var CURRENCY_AFTER = new RegExp("\\d\\s*(?:[.,]\\d+\\s*)?(?:\u20B8|\\$|\u20AC|\u20BD|\u0442\u0435\u043D\u0433\u0435|\u0442\u0433(?![\\p{L}])|usd|kzt|rub|\u0440\u0443\u0431|\u0434\u043E\u043B\u043B\u0430\u0440|\u0435\u0432\u0440\u043E|\u0441\u043E\u043C(?![\\p{L}])|\u0441\u0443\u043C(?![\\p{L}])|\u0442\u044B\u0441\\p{L}*|\u043C\u043B\u043D|\u043C\u0438\u043B\u043B\u0438\u043E\u043D\\p{L}*|[k\u043A](?![\\p{L}]))", "iu");
var CURRENCY_BEFORE = /(?:₸|\$|€|₽)\s*\d/u;
var BIG_NUMBER = /\d{1,3}(?:[\u00a0\u202f ]\d{3})+|\d{5,}/u;
var FORBIDDEN2 = /the\s*one\s*system|onesystem|erickson|эриксон|жумабае/iu;
var REASON_TEXT = {
  price: "\u0432 \u043E\u0442\u0432\u0435\u0442\u0435 \u0446\u0435\u043D\u0430, \u0441\u0443\u043C\u043C\u0430, \u0440\u0430\u0441\u0441\u0440\u043E\u0447\u043A\u0430 \u0438\u043B\u0438 \u0443\u0441\u043B\u043E\u0432\u0438\u044F \u043E\u043F\u043B\u0430\u0442\u044B \u0441 \u0446\u0438\u0444\u0440\u0430\u043C\u0438",
  link: "\u0432 \u043E\u0442\u0432\u0435\u0442\u0435 \u0441\u0441\u044B\u043B\u043A\u0430 \u0438\u043B\u0438 \u0430\u0434\u0440\u0435\u0441 \u043D\u0435 \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430 \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D\u043D\u044B\u0445",
  forbidden: "\u0432 \u043E\u0442\u0432\u0435\u0442\u0435 \u0443\u043F\u043E\u043C\u044F\u043D\u0443\u0442\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u044B \u0448\u043A\u043E\u043B\u044B \u0438\u043B\u0438 \u043A\u0435\u0439\u0441\u044B",
  phone: "\u0432 \u043E\u0442\u0432\u0435\u0442\u0435 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u0438\u043B\u0438 \u0434\u043B\u0438\u043D\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E",
  handle: "\u0432 \u043E\u0442\u0432\u0435\u0442\u0435 \u0438\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u043D\u0435 \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430 \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D\u043D\u044B\u0445",
  long: "\u043E\u0442\u0432\u0435\u0442 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043B\u0438\u043D\u043D\u044B\u0439",
  empty: "\u043E\u0442\u0432\u0435\u0442 \u043F\u0443\u0441\u0442\u043E\u0439"
};
var MAX_REPLY = 600;
function checkReply(text2) {
  const out = /* @__PURE__ */ new Set();
  if (!text2.trim()) return ["empty"];
  if (text2.length > MAX_REPLY) out.add("long");
  if (FORBIDDEN2.test(text2)) out.add("forbidden");
  let rest = text2;
  const judge = (m) => {
    if (!allowedLink(m)) out.add("link");
    return " ";
  };
  rest = rest.replace(URL_RE, judge).replace(BARE_RE, judge);
  if (/(?<![\p{L}])(?:mailto|tel|sms|javascript|data|ftp|file):/iu.test(rest) || /(?<!\d)\d{1,3}(?:\.\d{1,3}){3}(?!\d)/.test(rest)) out.add("link");
  for (const h of rest.match(/@[A-Za-z0-9_]{3,}/g) || []) if (!ALLOWED_HANDLES.has(h.toLowerCase())) out.add("handle");
  const plain2 = rest.replace(TIME_RE, " ");
  for (const m of plain2.match(/\+?\d[\d\s().-]{7,}\d/g) || []) if (m.replace(/\D/g, "").length >= 9) out.add("phone");
  if (CURRENCY_AFTER.test(plain2) || CURRENCY_BEFORE.test(plain2) || BIG_NUMBER.test(plain2)) out.add("price");
  for (const m of plain2.matchAll(PRICE_WORD)) {
    const i = m.index ?? 0;
    if (/\d/.test(plain2.slice(Math.max(0, i - 30), i + m[0].length + 30))) {
      out.add("price");
      break;
    }
  }
  return [...out];
}
var EMOJI = new RegExp("\\p{Extended_Pictographic}(?:\uFE0F|\u200D\\p{Extended_Pictographic})*", "gu");
function cleanReply(raw) {
  let mark = false;
  let summary = "";
  const take = (_m, inner) => {
    const x = /^\s*(?:АЯНА|ПЕРЕДАНО АЯНЕ)\s*:?\s*([\s\S]*)$/iu.exec(inner);
    if (x) {
      mark = true;
      summary = x[1].trim();
    }
    return "";
  };
  let t = raw.replace(/\[\[([^\]]*)\]\]/g, take).replace(/\[\s*(АЯНА|ПЕРЕДАНО АЯНЕ)\s*:([^\]]*)\]/giu, (_m, _a, s) => {
    mark = true;
    summary = summary || s.trim();
    return "";
  });
  t = t.replace(/\s+[\u2014\u2013]\s+/g, ", ").replace(/[\u2014\u2013]/g, "-").replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?:;])/g, "$1$2").replace(/__([^_\n]+)__/g, "$1").replace(/`+/g, "").replace(/^\s{0,3}#{1,6}\s+/gm, "").replace(/^\s*>\s?/gm, "");
  let seen = 0;
  t = t.replace(EMOJI, (m) => ++seen === 1 ? m : "");
  t = t.replace(/[ \t]+\n/g, "\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return { text: t, mark, summary };
}
function personJid(remoteJid) {
  const m = /^(\d{5,20})(?::\d+)?@(s\.whatsapp\.net|lid)$/.exec(String(remoteJid || ""));
  return m ? `${m[1]}@${m[2]}` : null;
}
function unwrap(m) {
  let cur = m;
  for (let i = 0; i < 4 && cur && typeof cur === "object"; i++) {
    const inner = cur.ephemeralMessage?.message ?? cur.viewOnceMessage?.message ?? cur.viewOnceMessageV2?.message ?? cur.documentWithCaptionMessage?.message ?? cur.editedMessage?.message;
    if (!inner) break;
    cur = inner;
  }
  return cur;
}
function seconds(ts) {
  let n = 0;
  if (typeof ts === "number") n = ts;
  else if (typeof ts === "string") n = Number(ts);
  else if (ts && typeof ts === "object") n = Number(ts.low ?? ts.toString?.());
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n > 1e12 ? n / 1e3 : n;
}
function classifyIncoming(d) {
  const key = d?.key;
  if (!key || typeof key !== "object" || key.fromMe === true) return null;
  const jid = personJid(key.remoteJid);
  if (!jid) return null;
  const m = unwrap(d.message);
  if (!m || typeof m !== "object") return null;
  const mid = typeof key.id === "string" ? key.id.slice(0, 80) : "";
  const ts = seconds(d.messageTimestamp) * 1e3;
  const clip2 = (s) => s.replace(/\u0000/g, "").trim().slice(0, MAX_TEXT);
  const plain2 = typeof m.conversation === "string" ? m.conversation : typeof m.extendedTextMessage?.text === "string" ? m.extendedTextMessage.text : typeof m.buttonsResponseMessage?.selectedDisplayText === "string" ? m.buttonsResponseMessage.selectedDisplayText : typeof m.templateButtonReplyMessage?.selectedDisplayText === "string" ? m.templateButtonReplyMessage.selectedDisplayText : typeof m.listResponseMessage?.title === "string" ? m.listResponseMessage.title : "";
  if (plain2) return clip2(plain2) ? { jid, mid, kind: "text", text: clip2(plain2), ts } : null;
  const media = [
    ["audioMessage", "[\u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435]"],
    ["ptvMessage", "[\u0432\u0438\u0434\u0435\u043E]"],
    ["imageMessage", "[\u0444\u043E\u0442\u043E]"],
    ["videoMessage", "[\u0432\u0438\u0434\u0435\u043E]"],
    ["documentMessage", "[\u0444\u0430\u0439\u043B]"]
  ];
  for (const [k, label] of media) {
    if (!m[k] || typeof m[k] !== "object") continue;
    const caption = typeof m[k].caption === "string" ? clip2(m[k].caption) : "";
    return caption ? { jid, mid, kind: "text", text: caption, ts } : { jid, mid, kind: "media", text: label, ts };
  }
  return null;
}
var A = null;
var maskJid = (jid) => {
  const d = jid.replace(/[:@].*$/, "").replace(/\D/g, "");
  const tag = jid.endsWith("@lid") ? " (lid)" : "";
  return (d.length >= 9 ? `${d.slice(0, 4)}***${d.slice(-4)}` : d ? "***" : "") + tag;
};
var idOf = (jid) => (0, import_node_crypto5.createHash)("sha256").update(`wa-ai|${jid}`).digest("hex").slice(0, 12);
var clipText = (s, n) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}\u2026` : t;
};
var scrub3 = (s) => {
  let out = s;
  for (const k of [apiKey(), evoKey(), A?.host.state().secret || "", env4("WA_HOOK_SECRET")]) if (k) out = out.split(k).join("***");
  return out;
};
var log = (msg, ...args) => console.log(`[wa-ai] ${msg}`, ...args);
function statsOf(a, day) {
  let s = a.stats.get(day);
  if (!s) {
    s = { replies: 0, handoffs: 0, rejected: 0, fallbacks: 0, errors: 0, dialogs: /* @__PURE__ */ new Set(), per: /* @__PURE__ */ new Map() };
    a.stats.set(day, s);
    for (const k of [...a.stats.keys()].sort().slice(0, -3)) a.stats.delete(k);
  }
  return s;
}
function convoOf(a, jid) {
  let c = a.convos.get(jid);
  if (!c) {
    c = { jid, rows: [], silencedUntil: 0, lastAt: 0 };
    a.convos.set(jid, c);
  }
  return c;
}
function rememberMid(a, mid) {
  if (!mid) return;
  a.seen.add(mid);
  if (a.seen.size > 5e3) a.seen.delete(a.seen.values().next().value);
}
function append(a, row) {
  try {
    (0, import_node_fs8.appendFileSync)(a.file, JSON.stringify(row) + "\n", "utf8");
  } catch (e) {
    console.error("[wa-ai] \u043D\u0435 \u0441\u043C\u043E\u0433 \u0434\u043E\u043F\u0438\u0441\u0430\u0442\u044C wa-assistant.jsonl:", e.message);
  }
}
function readTail(file, maxBytes) {
  try {
    const size = (0, import_node_fs8.statSync)(file).size;
    const start = Math.max(0, size - maxBytes);
    const buf = Buffer.alloc(size - start);
    const fd = (0, import_node_fs8.openSync)(file, "r");
    try {
      (0, import_node_fs8.readSync)(fd, buf, 0, buf.length, start);
    } finally {
      (0, import_node_fs8.closeSync)(fd);
    }
    let text2 = buf.toString("utf8");
    if (start > 0) text2 = text2.slice(text2.indexOf("\n") + 1);
    const out = [];
    for (const line of text2.split("\n")) {
      const s = line.trim();
      if (!s) continue;
      try {
        out.push(JSON.parse(s));
      } catch {
      }
    }
    return out;
  } catch {
    return [];
  }
}
function apply(a, row) {
  const ts = typeof row?.ts === "number" ? row.ts : Date.parse(String(row?.ts || ""));
  const jid = typeof row?.jid === "string" ? row.jid : "";
  if (!Number.isFinite(ts) || !jid) return;
  const day = dayKeyOf(ts);
  if (row.role === "user" || row.role === "assistant") {
    const c = convoOf(a, jid);
    c.rows.push({ ts, jid, role: row.role, text: String(row.text || ""), ...row.mid ? { mid: String(row.mid) } : {}, ...row.via ? { via: String(row.via) } : {} });
    if (c.rows.length > HISTORY) c.rows.splice(0, c.rows.length - HISTORY);
    c.lastAt = Math.max(c.lastAt, ts);
    const s = statsOf(a, day);
    if (row.role === "user") {
      s.dialogs.add(jid);
      if (row.mid) rememberMid(a, String(row.mid));
    } else {
      s.replies++;
      s.per.set(jid, (s.per.get(jid) || 0) + 1);
    }
  } else if (row.ev === "handoff") {
    statsOf(a, day).handoffs++;
    const c = convoOf(a, jid);
    c.silencedUntil = Math.max(c.silencedUntil, ts + SILENCE_MS);
  } else if (row.ev === "reject") statsOf(a, day).rejected++;
  else if (row.ev === "fallback") statsOf(a, day).fallbacks++;
  else if (row.ev === "error") statsOf(a, day).errors++;
}
function aiInit(host) {
  aiReset();
  (0, import_node_fs8.mkdirSync)(host.dir, { recursive: true });
  const a = {
    host,
    file: (0, import_node_path8.join)(host.dir, "wa-assistant.jsonl"),
    convos: /* @__PURE__ */ new Map(),
    pending: /* @__PURE__ */ new Map(),
    inflight: /* @__PURE__ */ new Set(),
    running: /* @__PURE__ */ new Set(),
    seen: /* @__PURE__ */ new Set(),
    stats: /* @__PURE__ */ new Map(),
    alarmAt: /* @__PURE__ */ new Map(),
    lastHookAt: 0,
    hookTryAt: 0,
    hookAssertAt: 0,
    hookFails: 0,
    toggling: false,
    testAt: [],
    skipNoteAt: 0
  };
  try {
    if ((0, import_node_fs8.existsSync)(a.file) && (0, import_node_fs8.statSync)(a.file).size > FILE_COMPACT_BYTES) {
      const keep = readTail(a.file, 2 * 1024 * 1024);
      const tmp = `${a.file}.tmp.${process.pid}`;
      (0, import_node_fs8.writeFileSync)(tmp, keep.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
      (0, import_node_fs8.renameSync)(tmp, a.file);
    }
  } catch (e) {
    console.error("[wa-ai] \u043D\u0435 \u0441\u043C\u043E\u0433 \u0441\u0436\u0430\u0442\u044C wa-assistant.jsonl:", e.message);
  }
  const from = host.now() - 30 * DAY;
  for (const row of readTail(a.file, FILE_TAIL_BYTES)) if ((typeof row?.ts === "number" ? row.ts : Date.parse(String(row?.ts || ""))) >= from) apply(a, row);
  A = a;
}
function aiReset() {
  if (A) {
    for (const p of A.pending.values()) if (p.timer) clearTimeout(p.timer);
  }
  A = null;
}
var cache = null;
function loadSystem() {
  const dir = promptDir();
  try {
    const f1 = (0, import_node_path8.join)(dir, "prompt.md");
    const f2 = (0, import_node_path8.join)(dir, "knowledge.md");
    const key = `${dir}|${(0, import_node_fs8.statSync)(f1).mtimeMs}|${(0, import_node_fs8.statSync)(f2).mtimeMs}`;
    if (cache?.key === key) return { ok: true, system: cache.system };
    const prompt = (0, import_node_fs8.readFileSync)(f1, "utf8").trim();
    const knowledge = (0, import_node_fs8.readFileSync)(f2, "utf8").trim();
    if (!prompt || !knowledge) return { ok: false, error: "prompt.md \u0438\u043B\u0438 knowledge.md \u043F\u0443\u0441\u0442\u043E\u0439" };
    cache = { key, system: `${prompt}

# \u0411\u0430\u0437\u0430 \u0437\u043D\u0430\u043D\u0438\u0439

${knowledge}` };
    return { ok: true, system: cache.system };
  } catch {
    return { ok: false, error: `\u043D\u0435\u0442 \u0444\u0430\u0439\u043B\u043E\u0432 prompt.md \u0438 knowledge.md \u0432 ${dir}` };
  }
}
function prerequisites() {
  if (!apiKey()) return { ok: false, reason: "\u041D\u0435\u0442 \u043A\u043B\u044E\u0447\u0430 OPENAI_API_KEY \u0432 .env \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435: \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043D\u0435 \u0441\u0442\u0430\u0440\u0442\u0443\u0435\u0442." };
  const f = loadSystem();
  if (!f.ok) return { ok: false, reason: `\u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043D\u0435 \u0441\u0442\u0430\u0440\u0442\u0443\u0435\u0442: ${f.error}.` };
  if (!evoKey()) return { ok: false, reason: "\u041D\u0435\u0442 EVOLUTION_API_KEY: \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043D\u0435 \u0441\u0442\u0430\u0440\u0442\u0443\u0435\u0442." };
  return { ok: true };
}
async function callModel(messages) {
  const key = apiKey();
  if (!key) return { ok: false, error: "\u043D\u0435\u0442 \u043A\u043B\u044E\u0447\u0430 OPENAI_API_KEY" };
  try {
    const res = await fetch(`${openaiBase()}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL(), messages, reasoning_effort: "low", max_completion_tokens: 1200 }),
      signal: AbortSignal.timeout(timeoutMs())
    });
    const raw = await res.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }
    if (!res.ok) return { ok: false, error: scrub3(`${res.status} ${clipText(data?.error?.message || res.statusText || raw, 120)}`) };
    const choice = data?.choices?.[0];
    const text2 = choice?.message?.content;
    if (choice?.finish_reason === "length") return { ok: false, error: "\u043E\u0442\u0432\u0435\u0442 \u043E\u0431\u043E\u0440\u0432\u0430\u043B\u0441\u044F \u043F\u043E \u0434\u043B\u0438\u043D\u0435" };
    if (typeof text2 !== "string" || !text2.trim()) return { ok: false, error: choice?.message?.refusal ? "\u043C\u043E\u0434\u0435\u043B\u044C \u043E\u0442\u043A\u0430\u0437\u0430\u043B\u0430\u0441\u044C \u043E\u0442\u0432\u0435\u0447\u0430\u0442\u044C" : "\u043F\u0443\u0441\u0442\u043E\u0439 \u043E\u0442\u0432\u0435\u0442 \u043C\u043E\u0434\u0435\u043B\u0438" };
    return { ok: true, text: text2 };
  } catch (e) {
    const err = e;
    if (err?.name === "TimeoutError" || err?.name === "AbortError") return { ok: false, error: "\u0442\u0430\u0439\u043C\u0430\u0443\u0442" };
    return { ok: false, error: scrub3(String(err?.cause?.code || err?.message || err)).slice(0, 120) };
  }
}
var reviewNote = (reasons) => `\u0421\u043B\u0443\u0436\u0435\u0431\u043D\u043E\u0435 \u0437\u0430\u043C\u0435\u0447\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438: \u0442\u0432\u043E\u0439 \u043E\u0442\u0432\u0435\u0442 \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E ${reasons.map((r) => REASON_TEXT[r]).join("; ")}. \u041D\u0430\u043F\u0438\u0448\u0438 \u043D\u043E\u0432\u044B\u0439 \u043E\u0442\u0432\u0435\u0442: \u0434\u043E 350 \u0437\u043D\u0430\u043A\u043E\u0432, \u0431\u0435\u0437 \u0446\u0435\u043D \u0438 \u043B\u044E\u0431\u044B\u0445 \u0446\u0438\u0444\u0440 \u043E\u043F\u043B\u0430\u0442\u044B, \u0431\u0435\u0437 \u0440\u0430\u0441\u0441\u0440\u043E\u0447\u043A\u0438 \u0438 \u043F\u0440\u0435\u0434\u043E\u043F\u043B\u0430\u0442\u044B, \u0431\u0435\u0437 \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u0432 \u0438 \u043A\u0435\u0439\u0441\u043E\u0432, \u0431\u0435\u0437 \u043D\u043E\u043C\u0435\u0440\u043E\u0432 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u043E\u0432, \u0442\u043E\u043B\u044C\u043A\u043E \u0441\u0441\u044B\u043B\u043A\u0438 \u0438 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430 \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D\u043D\u044B\u0445, \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0439 \u0438\u0437 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430. \u0415\u0441\u043B\u0438 \u043D\u0443\u0436\u0435\u043D \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440, \u0434\u0430\u0439 \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 \u043C\u0435\u043D\u0435\u0434\u0436\u0435\u0440\u0430 \u0448\u043A\u043E\u043B\u044B. \u0412\u044B\u0434\u0430\u0439 \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u0435\u043A\u0441\u0442 \u043E\u0442\u0432\u0435\u0442\u0430.`;
async function makeReply(messages) {
  const rejected = [];
  const first = await callModel(messages);
  if (!first.ok) return { ok: false, error: first.error, rejected };
  let c = cleanReply(first.text);
  let reasons = checkReply(c.text);
  const accept = (x) => ({ ok: true, text: x.text, via: "model", handoff: x.mark || AYANA_RE.test(x.text), summary: x.summary, rejected });
  if (!reasons.length) return accept(c);
  rejected.push(reasons);
  const second = await callModel([...messages, { role: "assistant", content: first.text }, { role: "system", content: reviewNote(reasons) }]);
  if (!second.ok) return { ok: false, error: second.error, rejected };
  c = cleanReply(second.text);
  reasons = checkReply(c.text);
  if (!reasons.length) return accept(c);
  rejected.push(reasons);
  return { ok: true, text: SAFE_FALLBACK, via: "fallback", handoff: false, summary: "", rejected };
}
function buildMessages(system, conv, now) {
  const out = [{ role: "system", content: `${system}

\u0421\u0435\u0439\u0447\u0430\u0441 ${hhmmOf(now)} \u043F\u043E \u0410\u043B\u043C\u0430\u0442\u044B.` }];
  for (const r of conv.rows.slice(-HISTORY)) {
    const last = out[out.length - 1];
    if (last.role === r.role) last.content += `
${r.text}`;
    else out.push({ role: r.role, content: r.text });
  }
  return out;
}
async function alarmOnce(a, key, windowMs, text2) {
  const now = a.host.now();
  if (now - (a.alarmAt.get(key) || 0) < windowMs) return;
  a.alarmAt.set(key, now);
  try {
    await a.host.alarm(text2);
  } catch {
  }
}
function schedule(a, jid) {
  const p = a.pending.get(jid);
  if (!p) return;
  if (p.timer) clearTimeout(p.timer);
  const cap = Number(env4("WA_AI_MAX_WAIT_MS")) || Math.max(6e4, quietMs());
  const wait = Math.min(quietMs(), Math.max(0, p.firstAt + cap - Date.now()));
  p.timer = setTimeout(() => runBatch(a, jid), wait);
  p.timer.unref?.();
}
function runBatch(a, jid) {
  const p = a.pending.get(jid);
  if (!p) return Promise.resolve();
  if (p.timer) {
    clearTimeout(p.timer);
    p.timer = null;
  }
  if (a.inflight.has(jid)) {
    p.firstAt = Date.now();
    schedule(a, jid);
    return Promise.resolve();
  }
  a.pending.delete(jid);
  a.inflight.add(jid);
  const job = answer(a, jid, p).catch((e) => console.error("[wa-ai] \u043E\u0442\u0432\u0435\u0442 \u0443\u043F\u0430\u043B:", scrub3(String(e?.message || e)).slice(0, 200))).finally(() => {
    a.inflight.delete(jid);
    a.running.delete(job);
  });
  a.running.add(job);
  return job;
}
function ingest(a, inc3) {
  const now = a.host.now();
  const st = a.host.state();
  if (!st.enabled) return;
  if (inc3.ts && now - inc3.ts > STALE_MS) return;
  if (a.host.ignoreDigits().includes(inc3.jid.replace(/@.*$/, ""))) return;
  if (inc3.mid) {
    if (a.seen.has(inc3.mid)) return;
    rememberMid(a, inc3.mid);
  }
  const row = { ts: now, jid: inc3.jid, role: "user", text: inc3.text, ...inc3.mid ? { mid: inc3.mid } : {} };
  append(a, row);
  apply(a, row);
  const conv = convoOf(a, inc3.jid);
  if (conv.silencedUntil > now) return;
  let p = a.pending.get(inc3.jid);
  if (!p) {
    p = { texts: [], timer: null, firstAt: Date.now() };
    a.pending.set(inc3.jid, p);
  }
  if (inc3.kind === "text") p.texts.push(inc3.text);
  schedule(a, inc3.jid);
}
async function answer(a, jid, p) {
  const h = a.host;
  const now0 = h.now();
  if (!h.state().enabled) return;
  const can = h.canSend();
  if (!can.ok) {
    if (now0 - a.skipNoteAt > HOUR) {
      a.skipNoteAt = now0;
      h.journal({ ev: "ai_skip", who: maskJid(jid), why: can.why });
    }
    return;
  }
  const conv = convoOf(a, jid);
  if (conv.silencedUntil > now0) return;
  const day = dayKeyOf(now0);
  const s = statsOf(a, day);
  if (s.replies >= LIMIT_TOTAL) {
    await alarmOnce(a, `total:${day}`, DAY, `\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 WhatsApp: \u0441\u0435\u0433\u043E\u0434\u043D\u044F \u0443\u0436\u0435 ${LIMIT_TOTAL} \u043E\u0442\u0432\u0435\u0442\u043E\u0432 \u0441 \u043D\u043E\u043C\u0435\u0440\u0430, \u044D\u0442\u043E \u043F\u0440\u0435\u0434\u0435\u043B \u0437\u0430\u0449\u0438\u0442\u044B. \u0414\u043E \u0437\u0430\u0432\u0442\u0440\u0430 \u043B\u044E\u0434\u044F\u043C \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u044E.`);
    return;
  }
  if ((s.per.get(jid) || 0) >= LIMIT_PERSON) {
    await alarmOnce(a, `person:${day}`, DAY, `\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 WhatsApp: \u0447\u0435\u043B\u043E\u0432\u0435\u043A ${maskJid(jid)} \u043F\u043E\u043B\u0443\u0447\u0438\u043B ${LIMIT_PERSON} \u043E\u0442\u0432\u0435\u0442\u043E\u0432 \u0437\u0430 \u0441\u0443\u0442\u043A\u0438. \u0415\u043C\u0443 \u0434\u043E \u0437\u0430\u0432\u0442\u0440\u0430 \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u044E.`);
    return;
  }
  let text2 = MEDIA_PHRASE;
  let via = "media";
  let handoff = false;
  let summary = "";
  if (!p.texts.length) {
    const lastBot = [...conv.rows].reverse().find((r) => r.role === "assistant");
    if (lastBot?.text === MEDIA_PHRASE) return;
  } else {
    const sys = loadSystem();
    if (!sys.ok) {
      await alarmOnce(a, "files", HOUR, `\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 WhatsApp \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u0432\u0435\u0442\u0438\u0442\u044C: ${sys.error}.`);
      return;
    }
    const made = await makeReply(buildMessages(sys.system, conv, now0));
    for (const reasons of made.rejected) {
      append(a, { ts: h.now(), jid, ev: "reject", reasons });
      statsOf(a, day).rejected++;
    }
    if (!made.ok) {
      append(a, { ts: h.now(), jid, ev: "error", error: clipText(made.error, 120) });
      statsOf(a, day).errors++;
      log("\u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B\u0430 (%s): %s", maskJid(jid), made.error);
      await alarmOnce(a, "openai", HOUR, `\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 WhatsApp: \u043C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B\u0430 (${made.error}). \u0427\u0435\u043B\u043E\u0432\u0435\u043A\u0443 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E. \u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0442\u0440\u0435\u0432\u043E\u0433\u0430 \u043E\u0431 \u044D\u0442\u043E\u043C \u043D\u0435 \u0440\u0430\u043D\u044C\u0448\u0435 \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 \u0447\u0430\u0441.`);
      return;
    }
    text2 = made.text;
    via = made.via;
    handoff = made.handoff;
    summary = made.summary;
    if (made.via === "fallback") {
      append(a, { ts: h.now(), jid, ev: "fallback" });
      statsOf(a, day).fallbacks++;
    }
  }
  if (!h.state().enabled || convoOf(a, jid).silencedUntil > h.now()) return;
  const can2 = h.canSend();
  if (!can2.ok) return;
  const delay = PAUSE_MS[0] + Math.round(h.rand() * (PAUSE_MS[1] - PAUSE_MS[0]));
  const sent = await h.exclusive(() => sendText2(jid, text2, { delay }));
  if (!sent.ok) {
    append(a, { ts: h.now(), jid, ev: "error", error: clipText(sent.error, 120) });
    statsOf(a, day).errors++;
    log("\u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u043B\u043E\u0441\u044C (%s): %s", maskJid(jid), sent.error);
    await alarmOnce(a, "send", HOUR, `\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 WhatsApp: \u043E\u0442\u0432\u0435\u0442 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0443 ${maskJid(jid)} \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u043B\u0441\u044F (${clipText(sent.error, 100)}). \u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0442\u0440\u0435\u0432\u043E\u0433\u0430 \u043E\u0431 \u044D\u0442\u043E\u043C \u043D\u0435 \u0440\u0430\u043D\u044C\u0448\u0435 \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 \u0447\u0430\u0441.`);
    return;
  }
  const ts = h.now();
  const row = { ts, jid, role: "assistant", text: text2, via };
  append(a, row);
  apply(a, row);
  log("\u043E\u0442\u0432\u0435\u0442 \u0443\u0448\u0451\u043B: %s, %s", maskJid(jid), via);
  if (handoff) {
    const last = [...conv.rows].reverse().find((r) => r.role === "user")?.text || "";
    const why = clipText(stripLinks(summary) || stripLinks(last), 200);
    append(a, { ts, jid, ev: "handoff", summary: why });
    apply(a, { ts, jid, ev: "handoff" });
    h.journal({ ev: "ai_handoff", who: maskJid(jid), why: clipText(why, 120) });
    try {
      await h.notify(
        `\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 WhatsApp \u043F\u0435\u0440\u0435\u0434\u0430\u043B \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430 \u0410\u044F\u043D\u0435: +${jid.replace(/[:@].*$/, "")}${jid.endsWith("@lid") ? " (\u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0439 ID WhatsApp, \u043D\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D)" : ""}.
\u0421\u0443\u0442\u044C: ${why || "\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430"}.
\u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043C\u043E\u043B\u0447\u0438\u0442 \u0441 \u043D\u0438\u043C 12 \u0447\u0430\u0441\u043E\u0432.`
      );
    } catch {
    }
  }
}
function stripLinks(s) {
  return s.replace(URL_RE, "[\u0441\u0441\u044B\u043B\u043A\u0430]").replace(BARE_RE, "[\u0430\u0434\u0440\u0435\u0441]");
}
var LOCAL_ADDR = /* @__PURE__ */ new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
var PROXY_HEADERS = ["x-forwarded-for", "x-real-ip", "forwarded", "x-forwarded-host", "x-forwarded-proto"];
var hashOf = (s) => (0, import_node_crypto5.createHash)("sha256").update(s).digest();
function hookSecret() {
  return env4("WA_HOOK_SECRET") || A?.host.state().secret || "";
}
function hookAuth(req) {
  if (!LOCAL_ADDR.has(req.socket.remoteAddress || "") || PROXY_HEADERS.some((h) => req.headers[h] !== void 0)) return 403;
  const secret = hookSecret();
  const got = req.headers["x-wa-hook-secret"];
  const provided = Array.isArray(got) ? got[0] : got;
  if (!secret || !provided || !(0, import_node_crypto5.timingSafeEqual)(hashOf(secret), hashOf(provided))) return 401;
  return 0;
}
function readLimited3(req, max) {
  return new Promise((resolve) => {
    let size = 0;
    let over = false;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > max) over = true;
      else chunks.push(c);
    });
    req.on("end", () => resolve(over ? null : Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => resolve(null));
  });
}
function ingestPayload(a, body) {
  const ev = String(body?.event || "").toLowerCase().replace(/_/g, ".");
  if (ev !== "messages.upsert") return;
  if (body?.instance && String(body.instance) !== evoInstance()) return;
  const list = Array.isArray(body?.data) ? body.data : body?.data ? [body.data] : [];
  for (const d of list) {
    const inc3 = classifyIncoming(d);
    if (inc3) ingest(a, inc3);
  }
}
async function handleWaHook(req, res) {
  const send2 = (status, body) => {
    const payload = JSON.stringify(body);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload) });
    res.end(payload);
  };
  const bad = hookAuth(req);
  if (bad) {
    req.resume();
    return send2(bad, { ok: false });
  }
  const raw = await readLimited3(req, 512 * 1024);
  const a = A;
  if (a) a.lastHookAt = a.host.now();
  send2(200, { ok: true });
  if (!a || raw === null || !a.host.state().enabled) return;
  try {
    ingestPayload(a, JSON.parse(raw));
  } catch (e) {
    console.error("[wa-ai] \u043D\u0435 \u0440\u0430\u0437\u043E\u0431\u0440\u0430\u043B \u0432\u0435\u0431\u0445\u0443\u043A:", scrub3(String(e?.message || e)).slice(0, 120));
  }
}
var hookArgs = (on) => ({ url: hookUrl(), enabled: on, events: ["MESSAGES_UPSERT"], headers: { "X-Wa-Hook-Secret": hookSecret() } });
function ensureSecret(a) {
  const cur = a.host.state().secret;
  if (cur || env4("WA_HOOK_SECRET")) return cur;
  const secret = (0, import_node_crypto5.randomBytes)(24).toString("hex");
  a.host.patch({ secret });
  return secret;
}
async function aiTick(now) {
  const a = A;
  if (!a) return;
  const st = a.host.state();
  const want = st.enabled && prerequisites().ok;
  if (want === st.hookOn && !(want && now - a.hookAssertAt >= 6 * HOUR)) return;
  if (now - a.hookTryAt < MIN) return;
  a.hookTryAt = now;
  if (want) ensureSecret(a);
  const r = await setWebhook(hookArgs(want));
  if (r.ok) {
    a.hookFails = 0;
    a.hookAssertAt = now;
    if (want !== st.hookOn) {
      a.host.patch({ hookOn: want });
      a.host.journal({ ev: want ? "ai_on" : "ai_off", by: "tick" });
    }
    return;
  }
  a.hookFails++;
  log("\u0432\u0435\u0431\u0445\u0443\u043A Evolution \u043D\u0435 %s: %s", want ? "\u043F\u043E\u0441\u0442\u0430\u0432\u0438\u043B\u0441\u044F" : "\u0441\u043D\u044F\u043B\u0441\u044F", r.error);
  if (a.hookFails >= 3) await alarmOnce(a, "hook", HOUR, `\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 WhatsApp: \u0432\u0435\u0431\u0445\u0443\u043A Evolution ${want ? "\u043D\u0435 \u0441\u0442\u0430\u0432\u0438\u0442\u0441\u044F" : "\u043D\u0435 \u0441\u043D\u0438\u043C\u0430\u0435\u0442\u0441\u044F"} (${clipText(r.error, 100)}). \u041F\u0440\u043E\u0432\u0435\u0440\u044C, \u0447\u0442\u043E Evolution \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442.`);
}
var ddmm2 = (ms) => {
  const d = dayKeyOf(ms);
  return `${d.slice(8, 10)}.${d.slice(5, 7)}`;
};
var agoText = (ms) => {
  const s = Math.max(0, Math.round(ms / 1e3));
  return s < 90 ? `${s} \u0441 \u043D\u0430\u0437\u0430\u0434` : s < 5400 ? `${Math.round(s / 60)} \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434` : `${Math.round(s / 3600)} \u0447 \u043D\u0430\u0437\u0430\u0434`;
};
function aiPanel(nowArg) {
  const a = A;
  if (!a) return { available: false };
  const now = nowArg ?? a.host.now();
  const st = a.host.state();
  const s = statsOf(a, dayKeyOf(now));
  const pre = prerequisites();
  let reason = "";
  if (!pre.ok) reason = pre.reason;
  else if (st.enabled) {
    const can = a.host.canSend();
    if (!can.ok) reason = `\u0421\u0435\u0439\u0447\u0430\u0441 \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442: ${can.why}.`;
    else if (!st.hookOn) reason = "\u0412\u0435\u0431\u0445\u0443\u043A \u0432 Evolution \u0435\u0449\u0451 \u043D\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D, \u043F\u043E\u0432\u0442\u043E\u0440\u044E \u0432 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0443\u044E \u043C\u0438\u043D\u0443\u0442\u0443.";
    else if (!a.lastHookAt) reason = "\u0412\u0435\u0431\u0445\u0443\u043A \u0441\u0442\u043E\u0438\u0442, \u043D\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u043E\u0442 Evolution \u0441 \u043C\u043E\u043C\u0435\u043D\u0442\u0430 \u0437\u0430\u043F\u0443\u0441\u043A\u0430 \u0435\u0449\u0451 \u043D\u0435 \u0431\u044B\u043B\u043E.";
  }
  const dialogs = [...a.convos.values()].filter((c) => c.rows.length).sort((x, y) => y.lastAt - x.lastAt).slice(0, 20).map((c) => {
    const lastUser = [...c.rows].reverse().find((r) => r.role === "user");
    const lastBot = [...c.rows].reverse().find((r) => r.role === "assistant");
    return {
      id: idOf(c.jid),
      who: maskJid(c.jid),
      at: `${ddmm2(c.lastAt)} ${hhmmOf(c.lastAt)}`,
      last: clipText(lastUser?.text, 140),
      reply: clipText(lastBot?.text, 200),
      answered: !!lastBot && (!lastUser || lastBot.ts >= lastUser.ts),
      handoff: c.silencedUntil > now
    };
  });
  return {
    available: true,
    enabled: st.enabled,
    hookOn: st.hookOn,
    canEnable: pre.ok,
    reason,
    model: MODEL(),
    counters: { dialogs: s.dialogs.size, replies: s.replies, handoffs: s.handoffs, rejected: s.rejected },
    limits: { person: LIMIT_PERSON, total: LIMIT_TOTAL },
    lastHook: a.lastHookAt ? agoText(now - a.lastHookAt) : "",
    dialogs
  };
}
function aiNumber(id) {
  const a = A;
  if (!a) return fail("module_off", "\u041C\u043E\u0434\u0443\u043B\u044C WhatsApp \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D.");
  const c = typeof id === "string" ? [...a.convos.values()].find((x) => idOf(x.jid) === id) : void 0;
  if (!c) return fail("not_found", "\u0414\u0438\u0430\u043B\u043E\u0433 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D.");
  const digits = c.jid.replace(/[:@].*$/, "");
  return { ok: true, message: c.jid.endsWith("@lid") ? "\u042D\u0442\u043E \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0439 ID WhatsApp, \u0430 \u043D\u0435 \u0442\u0435\u043B\u0435\u0444\u043E\u043D." : "\u041D\u043E\u043C\u0435\u0440 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430.", number: c.jid.endsWith("@lid") ? `${digits} (lid)` : `+${digits}` };
}
var MODULE_OFF = fail("module_off", "\u041C\u043E\u0434\u0443\u043B\u044C WhatsApp \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D: \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 \u043D\u0435\u0442 WA_GROUPS=on \u0438\u043B\u0438 \u043E\u043D \u043D\u0435 \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u0430\u043B (\u0441\u043C. /api/health).");
async function aiSetEnabled(on) {
  const a = A;
  if (!a) return MODULE_OFF;
  if (typeof on !== "boolean") return fail("bad_request", "\u041D\u0443\u0436\u043D\u043E true \u0438\u043B\u0438 false.");
  if (a.toggling) return fail("busy", "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0435 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0435\u0449\u0451 \u0438\u0434\u0451\u0442, \u043F\u043E\u0434\u043E\u0436\u0434\u0438 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434.");
  a.toggling = true;
  try {
    const st = a.host.state();
    if (on) {
      if (st.enabled && st.hookOn) return { ok: true, code: "same", message: "\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u0443\u0436\u0435 \u0432\u043A\u043B\u044E\u0447\u0451\u043D." };
      const pre = prerequisites();
      if (!pre.ok) return fail("no_key", `${pre.reason} \u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043D\u0435 \u0432\u043A\u043B\u044E\u0447\u0451\u043D.`);
      ensureSecret(a);
      const r = await a.host.exclusive(() => setWebhook(hookArgs(true)));
      if (!r.ok) return fail("evolution", `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0432\u0435\u0431\u0445\u0443\u043A \u0432 Evolution: ${clipText(r.error, 120)}. \u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043D\u0435 \u0432\u043A\u043B\u044E\u0447\u0451\u043D.`);
      a.host.patch({ enabled: true, hookOn: true });
      a.hookAssertAt = a.host.now();
      a.hookFails = 0;
      a.host.journal({ ev: "ai_on", by: "panel" });
      log("\u0432\u043A\u043B\u044E\u0447\u0451\u043D");
      return { ok: true, message: "\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u0432\u043A\u043B\u044E\u0447\u0451\u043D. \u041E\u043D \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u0435\u043C, \u043A\u0442\u043E \u043D\u0430\u043F\u0438\u0441\u0430\u043B \u043D\u043E\u043C\u0435\u0440\u0443 \u0432 \u043B\u0438\u0447\u043A\u0443. \u041F\u0435\u0440\u0432\u044B\u043C \u043D\u0438\u043A\u043E\u043C\u0443 \u043D\u0435 \u043F\u0438\u0448\u0435\u0442." };
    }
    if (!st.enabled && !st.hookOn) return { ok: true, code: "same", message: "\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u0443\u0436\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D." };
    a.host.patch({ enabled: false });
    for (const p of a.pending.values()) if (p.timer) clearTimeout(p.timer);
    a.pending.clear();
    a.host.journal({ ev: "ai_off", by: "panel" });
    log("\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D");
    if (st.hookOn) {
      a.hookTryAt = a.host.now();
      const r = await a.host.exclusive(() => setWebhook(hookArgs(false)));
      if (r.ok) a.host.patch({ hookOn: false });
      else return { ok: true, code: "hook_pending", message: `\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D \u0438 \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442. \u0412\u0435\u0431\u0445\u0443\u043A \u0432 Evolution \u0441\u043D\u044F\u0442\u044C \u043D\u0435 \u0432\u044B\u0448\u043B\u043E (${clipText(r.error, 100)}), \u043F\u043E\u0432\u0442\u043E\u0440\u044E \u0441\u0430\u043C \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 \u043C\u0438\u043D\u0443\u0442\u044B.` };
    }
    return { ok: true, message: "\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D. \u0412\u0435\u0431\u0445\u0443\u043A \u0432 Evolution \u0441\u043D\u044F\u0442, \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043A OpenAI \u043D\u0435\u0442." };
  } finally {
    a.toggling = false;
  }
}
async function aiTest(question) {
  const a = A;
  if (!a) return MODULE_OFF;
  const q2 = typeof question === "string" ? question.replace(/\u0000/g, "").trim().slice(0, 1e3) : "";
  if (!q2) return fail("bad_request", "\u041D\u0430\u043F\u0438\u0448\u0438 \u0432\u043E\u043F\u0440\u043E\u0441, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0442\u043E\u0438\u0442 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u0435?");
  const pre = prerequisites();
  if (!pre.ok) return fail("no_key", pre.reason);
  const now = a.host.now();
  a.testAt = a.testAt.filter((t) => now - t < HOUR);
  if (a.testAt.length && now - a.testAt[a.testAt.length - 1] < 3e3) return fail("rate", "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0447\u0430\u0441\u0442\u043E, \u043F\u043E\u0434\u043E\u0436\u0434\u0438 \u043F\u0430\u0440\u0443 \u0441\u0435\u043A\u0443\u043D\u0434.");
  if (a.testAt.length >= 20) return fail("rate", "\u041F\u0440\u043E\u0432\u0435\u0440\u043E\u043A \u0437\u0430 \u0447\u0430\u0441 \u0443\u0436\u0435 20. \u041F\u043E\u0434\u043E\u0436\u0434\u0438, \u0447\u0442\u043E\u0431\u044B \u043D\u0435 \u0442\u0440\u0430\u0442\u0438\u0442\u044C \u0434\u0435\u043D\u044C\u0433\u0438 \u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u044C.");
  a.testAt.push(now);
  const sys = loadSystem();
  if (!sys.ok) return fail("no_key", `\u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043D\u0435 \u0441\u0442\u0430\u0440\u0442\u0443\u0435\u0442: ${sys.error}.`);
  const made = await makeReply([
    { role: "system", content: `${sys.system}

\u0421\u0435\u0439\u0447\u0430\u0441 ${hhmmOf(now)} \u043F\u043E \u0410\u043B\u043C\u0430\u0442\u044B.` },
    { role: "user", content: q2 }
  ]);
  if (!made.ok) return fail("model", `\u041C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B\u0430: ${made.error}.`);
  const reasons = made.rejected.flat().map((r) => REASON_TEXT[r]);
  return {
    ok: true,
    message: made.via === "fallback" ? "\u041E\u0442\u0432\u0435\u0442 \u043C\u043E\u0434\u0435\u043B\u0438 \u043D\u0435 \u043F\u0440\u043E\u0448\u0451\u043B \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443 \u0434\u0432\u0430\u0436\u0434\u044B, \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0443 \u0443\u0448\u043B\u0430 \u0431\u044B \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u0430\u044F \u0437\u0430\u0433\u043E\u0442\u043E\u0432\u043A\u0430." : "\u041E\u0442\u0432\u0435\u0442 \u043F\u0440\u043E\u0448\u0451\u043B \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443.",
    reply: made.text,
    verdict: made.via === "fallback" ? "fallback" : "ok",
    reasons: [...new Set(reasons)],
    handoff: made.handoff
  };
}
async function aiCommand(cmd, args) {
  if (!A) return MODULE_OFF.message;
  if (cmd === "wa_ai_test") {
    const r = await aiTest(args);
    if (!r.ok) return r.message;
    return `\u041E\u0442\u0432\u0435\u0442 \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430 (\u0432 WhatsApp \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u043B\u0441\u044F):
${r.reply}

${r.message}${r.reasons?.length ? `
\u041E\u0442\u043A\u043B\u043E\u043D\u044F\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u043E\u0439: ${r.reasons.join("; ")}.` : ""}${r.handoff ? "\n\u041F\u0435\u0440\u0435\u0434\u0430\u0447\u0430 \u0410\u044F\u043D\u0435: \u0434\u0430." : ""}`;
  }
  const arg = args.trim().toLowerCase();
  if (arg === "on" || arg === "off") return (await aiSetEnabled(arg === "on")).message;
  const p = aiPanel();
  const c = p.counters;
  return [
    `\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 WhatsApp: ${p.enabled ? "\u0432\u043A\u043B\u044E\u0447\u0451\u043D" : "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D"}${p.reason ? `. ${p.reason}` : ""}`,
    `\u0421\u0435\u0433\u043E\u0434\u043D\u044F: \u0434\u0438\u0430\u043B\u043E\u0433\u043E\u0432 ${c.dialogs}, \u043E\u0442\u0432\u0435\u0442\u043E\u0432 ${c.replies}, \u043F\u0435\u0440\u0435\u0434\u0430\u043D\u043E \u0410\u044F\u043D\u0435 ${c.handoffs}, \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u043E \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u043E\u0439 ${c.rejected}.`,
    "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C: /wa_ai on, \u0432\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C: /wa_ai off, \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043E\u0442\u0432\u0435\u0442 \u0431\u0435\u0437 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438: /wa_ai_test \u0432\u043E\u043F\u0440\u043E\u0441"
  ].join("\n");
}

// form-api/wa-dozhim.ts
var import_node_fs9 = require("node:fs");
var import_node_crypto6 = require("node:crypto");
var import_node_path9 = require("node:path");

// form-api/wazzup.ts
var env5 = (k) => (process.env[k] || "").trim();
var wzKey = () => env5("WAZZUP_API_KEY");
var wzChannel = () => env5("WAZZUP_CHANNEL_ID");
var wzBase = () => (env5("WAZZUP_API_URL") || "https://api.wazzup24.com").replace(/\/+$/, "");
var TIMEOUT_MS2 = 2e4;
var scrub4 = (s) => {
  const k = wzKey();
  return k ? s.split(k).join("***") : s;
};
function errorText2(data, fallback) {
  const parts = [data?.error, data?.code, data?.description, data?.message].map((x) => typeof x === "string" ? x : x && typeof x === "object" ? JSON.stringify(x) : "").filter(Boolean);
  return scrub4((parts.join(" ") || fallback).replace(/\s+/g, " ").trim().slice(0, 240));
}
async function wzCall(method, path, body, timeoutMs2 = TIMEOUT_MS2) {
  const key = wzKey();
  if (!key) return { ok: false, status: 0, error: "no_api_key", retryable: false };
  try {
    const res = await fetch(`${wzBase()}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, ...body !== void 0 ? { "Content-Type": "application/json" } : {} },
      ...body !== void 0 ? { body: JSON.stringify(body) } : {},
      signal: AbortSignal.timeout(timeoutMs2)
    });
    const text2 = await res.text();
    let data = null;
    try {
      data = text2 ? JSON.parse(text2) : null;
    } catch {
      data = null;
    }
    if (res.ok) return { ok: true, status: res.status, data };
    return { ok: false, status: res.status, error: `${res.status} ${errorText2(data, res.statusText || text2.slice(0, 100))}`, data, retryable: res.status === 429 || res.status >= 500 };
  } catch (e) {
    const err = e;
    const timeout = err?.name === "TimeoutError" || err?.name === "AbortError";
    return {
      ok: false,
      status: 0,
      error: timeout ? "timeout" : scrub4(String(err?.cause?.code || err?.message || err)).slice(0, 160),
      retryable: true,
      ...timeout ? { timeout: true } : {}
    };
  }
}
var NOT_APPROVED_RE = /pending|moderat|review|reject|declin|denied|disabled|inactive|paused|draft|created|appeal|flagged|suspend|отклон|модерац|ожида|черновик|проверк|приостан/i;
var APPROVED_RE = /approv|accepted|(^|[^a-z])active|(^|[^a-z])enabled|одобр|активн/i;
function approvedOf(status) {
  if (!status) return null;
  if (NOT_APPROVED_RE.test(status)) return false;
  return APPROVED_RE.test(status) ? true : null;
}
function varCount(text2) {
  let max = 0;
  for (const m of text2.matchAll(/\{\{\s*(\d{1,2})\s*\}\}/g)) max = Math.max(max, Number(m[1]));
  return max;
}
function textOf(t) {
  const direct = [t?.text, t?.templateText, t?.body, t?.content, t?.message];
  for (const x of direct) if (typeof x === "string" && x.trim()) return x;
  const body = t?.body ?? t?.components?.find?.((c) => String(c?.type || "").toUpperCase() === "BODY");
  if (body && typeof body === "object" && typeof body.text === "string") return body.text;
  return "";
}
function normalizeTemplates(data) {
  const list = Array.isArray(data) ? data : data && typeof data === "object" ? data.templates ?? data.data ?? data.items ?? [] : [];
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const t of list) {
    if (!t || typeof t !== "object") continue;
    const id = String(t.templateGuid ?? t.guid ?? t.templateId ?? t.id ?? "").trim();
    if (!id) continue;
    const name = String(t.name ?? t.templateName ?? t.title ?? "").trim();
    const title = String(t.title ?? t.templateTitle ?? t.name ?? "").trim();
    const text2 = textOf(t);
    const rawStatus = t.status ?? t.templateStatus ?? t.state ?? t.moderationStatus;
    const status = typeof rawStatus === "string" ? rawStatus.trim().toLowerCase() : "";
    out.push({
      id,
      name,
      title,
      text: text2,
      category: String(t.category ?? t.templateCategory ?? "").trim().toLowerCase(),
      status,
      approved: approvedOf(status),
      vars: text2 ? varCount(text2) : null
    });
  }
  return out;
}
async function wzTemplates() {
  const r = await wzCall("GET", "/v3/templates/whatsapp");
  if (!r.ok) return r;
  return { ok: true, status: r.status, data: normalizeTemplates(r.data) };
}
async function wzSend(p) {
  const r = await wzCall("POST", "/v3/message", {
    channelId: wzChannel(),
    chatType: "whatsapp",
    chatId: p.chatId,
    ...p.templateId ? { templateId: p.templateId, templateValues: p.templateValues ?? [] } : { text: p.text ?? "" },
    crmMessageId: p.crmMessageId
  });
  if (!r.ok) return r;
  return { ok: true, status: r.status, data: { messageId: String(r.data?.messageId ?? r.data?.id ?? "") } };
}
function isRepeatedCrmId(f) {
  if (f.status !== 400 && f.status !== 409) return false;
  return /repeat|duplicate|already|exist|повтор|уже/i.test(f.error) && /crm|message|сообщ/i.test(f.error);
}
async function wzGetHooks() {
  const r = await wzCall("GET", "/v3/webhooks");
  if (!r.ok) return r;
  const subs = r.data?.subscriptions && typeof r.data.subscriptions === "object" ? r.data.subscriptions : {};
  return { ok: true, status: r.status, data: { webhooksUri: typeof r.data?.webhooksUri === "string" ? r.data.webhooksUri : "", subscriptions: subs } };
}
var wzSetHooks = (body) => wzCall("PATCH", "/v3/webhooks", body, 3e4);

// form-api/wa-dozhim.ts
var env6 = (k) => (process.env[k] || "").trim();
var MIN2 = 6e4;
var HOUR2 = 36e5;
var MAX_LEAD_AGE = 48 * HOUR2;
var DAY2 = 24 * HOUR2;
var MEASURE_MAX_AGE = 10 * MIN2;
var MEASURE_BUSY_AGE = 5 * MIN2;
var PER_TICK = 25;
var PACE_MS = [1500, 3500];
var RETRY_AFTER = 5 * MIN2;
var MAX_ATTEMPTS = 3;
var REPLY_WINDOW = 48 * HOUR2;
var HALT_AFTER = 3;
var HALT_MS = HOUR2;
var MEASURE_RETRY = 2 * MIN2;
var FILE_TAIL_BYTES2 = 3 * 1024 * 1024;
var FILE_COMPACT_BYTES2 = 6 * 1024 * 1024;
var ROWS_KEEP = 6e3;
var SIGNUP_URL = "https://onai.academy/workshop-montazh/";
var HOOK_PATH_DEFAULT = "https://onai.academy/workshop/api/wazzup-hook";
var hookBase = () => env6("WAZZUP_HOOK_URL") || HOOK_PATH_DEFAULT;
var LINK_TEXT = (url) => `\u0412\u043E\u0442 \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432, \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u044D\u0444\u0438\u0440 \u043F\u0440\u0438\u0434\u0451\u0442 \u0442\u0443\u0434\u0430 \u0432 19:50: ${url}`;
var DECLINE_TEXT = `\u0425\u043E\u0440\u043E\u0448\u043E. \u0415\u0441\u043B\u0438 \u043F\u0435\u0440\u0435\u0434\u0443\u043C\u0430\u0435\u0442\u0435, \u0437\u0430\u043F\u0438\u0441\u044C \u043D\u0430 \u043B\u044E\u0431\u043E\u0439 \u0434\u0435\u043D\u044C: ${SIGNUP_URL}`;
var fail2 = (code, message) => ({ ok: false, code, message });
var freshDz = () => ({
  enabled: false,
  hookOn: false,
  secret: "",
  templateId: "",
  templateName: "",
  vars: 0,
  delayMin: 30,
  from: "09:00",
  to: "21:00",
  cutoff: "19:30",
  dailyLimit: 200,
  maps: {}
});
var HHMM = /^\d{1,2}:\d{2}$/;
var validHHMM = (s) => {
  if (typeof s !== "string" || !HHMM.test(s)) return false;
  try {
    parseHHMM(s);
    return true;
  } catch {
    return false;
  }
};
var padHHMM = (s) => {
  const { h, m } = parseHHMM(s);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
var minsOf = (s) => {
  const { h, m } = parseHHMM(s);
  return h * 60 + m;
};
function cleanMap(x) {
  if (!Array.isArray(x) || x.length > 10) return null;
  const out = [];
  for (const v of x) {
    if (!v || typeof v !== "object") return null;
    const kind = v.kind;
    if (kind === "name" || kind === "date" || kind === "link") out.push({ kind });
    else if (kind === "text") {
      const text2 = typeof v.text === "string" ? v.text.replace(/\s+/g, " ").trim().slice(0, 200) : "";
      out.push({ kind, text: text2 });
    } else return null;
  }
  return out;
}
function normalizeDz(raw) {
  const st = freshDz();
  if (!raw || typeof raw !== "object") return st;
  const r = raw;
  st.enabled = r.enabled === true;
  st.hookOn = r.hookOn === true;
  st.secret = typeof r.secret === "string" ? r.secret : "";
  st.templateId = typeof r.templateId === "string" ? r.templateId : "";
  st.templateName = typeof r.templateName === "string" ? r.templateName.slice(0, 120) : "";
  st.vars = Number.isInteger(r.vars) && r.vars >= 0 && r.vars <= 10 ? r.vars : 0;
  if (Number.isFinite(r.delayMin) && r.delayMin >= 0 && r.delayMin <= 1440) st.delayMin = Math.round(r.delayMin);
  if (validHHMM(r.from) && validHHMM(r.to) && minsOf(r.from) < minsOf(r.to)) {
    st.from = padHHMM(r.from);
    st.to = padHHMM(r.to);
  }
  if (validHHMM(r.cutoff)) st.cutoff = padHHMM(r.cutoff);
  if (Number.isFinite(r.dailyLimit) && r.dailyLimit >= 1 && r.dailyLimit <= 250) st.dailyLimit = Math.round(r.dailyLimit);
  if (r.maps && typeof r.maps === "object" && !Array.isArray(r.maps)) {
    for (const [k, v] of Object.entries(r.maps)) {
      const m = cleanMap(v);
      if (m && k.length <= 80) st.maps[k] = m;
    }
  }
  return st;
}
function normalizePhone(raw) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length < 8 || d.length > 15) return null;
  if (d.length === 11 && d[0] === "8") d = `7${d.slice(1)}`;
  else if (d.length === 10 && d[0] === "7") d = `7${d}`;
  return { digits: d, kz: /^77\d{9}$/.test(d) };
}
var maskDigits = (d) => d.length >= 9 ? `${d.slice(0, 4)}***${d.slice(-4)}` : d ? "***" : "";
var NAME_STOP = /* @__PURE__ */ new Set(["\u0442\u0435\u0441\u0442", "test", "\u0442\u0435\u0441\u0442\u043E\u0432\u044B\u0439", "\u0438\u043C\u044F", "name", "\u043D\u0435\u0442", "no", "none", "null", "undefined", "asd", "asdf", "qwe", "qwerty", "\u0439\u0446\u0443\u043A\u0435\u043D", "\u0444\u044B\u0432", "admin", "\u0430\u0431\u0432", "\u0430\u0431\u0432\u0433", "\u0430\u0431\u0432\u0433\u0434", "\u0430\u0430\u0430\u0430", "xxx", "\u0445\u0445\u0445"]);
function cleanName(raw) {
  const token = String(raw ?? "").normalize("NFC").trim().split(/\s+/)[0] || "";
  if (!token || /[@\d/\\:]|https?|www\./i.test(token)) return "";
  let s = token.replace(/[^\p{L}-]/gu, "").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
  if (s.length < 2 || s.length > 30) return "";
  const plain2 = s.replace(/-/g, "");
  if (plain2.length < 2) return "";
  if (NAME_STOP.has(plain2.toLowerCase())) return "";
  if (/(.)\1{3,}/iu.test(plain2) || new Set(plain2.toLowerCase()).size < 2) return "";
  if (!/[аеёиоуыэюяaeiouyәөүұі]/iu.test(plain2)) return "";
  if (plain2 === plain2.toLowerCase() || plain2 === plain2.toUpperCase()) {
    s = s.split("-").map((p) => p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p).join("-");
  }
  return s;
}
var WEEKDAY_ACC = ["\u0432 \u0432\u043E\u0441\u043A\u0440\u0435\u0441\u0435\u043D\u044C\u0435", "\u0432 \u043F\u043E\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u0438\u043A", "\u0432\u043E \u0432\u0442\u043E\u0440\u043D\u0438\u043A", "\u0432 \u0441\u0440\u0435\u0434\u0443", "\u0432 \u0447\u0435\u0442\u0432\u0435\u0440\u0433", "\u0432 \u043F\u044F\u0442\u043D\u0438\u0446\u0443", "\u0432 \u0441\u0443\u0431\u0431\u043E\u0442\u0443"];
function dateWord(day, now) {
  const today = dayKeyOf(now);
  const date = dateLabel(day);
  if (day === today) return `\u0441\u0435\u0433\u043E\u0434\u043D\u044F, ${date}`;
  if (day === addDays(today, 1)) return `\u0437\u0430\u0432\u0442\u0440\u0430, ${date}`;
  const { y, m0, d } = parseDayKey(day);
  return `${WEEKDAY_ACC[new Date(Date.UTC(y, m0, d)).getUTCDay()]}, ${date}`;
}
var text = (t) => ({ kind: "text", text: t });
function defaultMap(name, title, vars) {
  const key = `${name} ${title}`.toLowerCase();
  let base;
  if (/napominanie_o_zapisi|напоминание о записи/.test(key)) base = [text("\u043A\u043E\u043C\u0430\u043D\u0434\u0430 onAI Academy"), text("\u0432\u043E\u0440\u043A\u0448\u043E\u043F\u0435 \xAB\u0412\u0430\u0439\u0431-\u043F\u0440\u043E\u0434\u0430\u043A\u0448\u0435\u043D\xBB"), text("20:00 \u043F\u043E \u0410\u043B\u043C\u0430\u0442\u044B")];
  else base = [{ kind: "name" }, { kind: "date" }];
  const n = vars ?? base.length;
  const out = base.slice(0, n);
  while (out.length < n) out.push(text(""));
  return out;
}
function buildValues(map, c) {
  const out = [];
  for (const v of map) {
    const s = v.kind === "name" ? c.name : v.kind === "date" ? dateWord(c.day, c.now) : v.kind === "link" ? c.link : (v.text || "").trim();
    if (!s) return null;
    out.push(s);
  }
  return out;
}
var DECLINE_RE = /^(нет|не надо|не нужно|не хочу|стоп|stop|отписаться|отпишите|отписка)(?![\p{L}])/u;
function isDecline(raw) {
  const t = String(raw ?? "").toLowerCase().replace(/ё/g, "\u0435").replace(/[^\p{L}\p{N}\s,]/gu, " ").replace(/\s+/g, " ").trim();
  return t.length > 0 && t.length <= 40 && DECLINE_RE.test(t);
}
var digitsOf = (x) => typeof x === "string" ? x.replace(/[:@].*$/, "").replace(/\D/g, "") : "";
var A2 = null;
var log2 = (msg, ...args) => console.log(`[wa-dozhim] ${msg}`, ...args);
var clipText2 = (s, n) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}\u2026` : t;
};
var scrub5 = (s) => {
  let out = s;
  for (const k of [wzKey(), evoKey(), A2?.host.state().secret || "", env6("WAZZUP_HOOK_SECRET")]) if (k) out = out.split(k).join("***");
  return out;
};
function appendRow(a, row) {
  try {
    (0, import_node_fs9.appendFileSync)(a.file, JSON.stringify(row) + "\n", "utf8");
  } catch (e) {
    console.error("[wa-dozhim] \u043D\u0435 \u0441\u043C\u043E\u0433 \u0434\u043E\u043F\u0438\u0441\u0430\u0442\u044C wa-dozhim.jsonl:", e.message);
  }
  a.rows.push(row);
  if (a.rows.length > ROWS_KEEP) a.rows.splice(0, a.rows.length - ROWS_KEEP);
}
function readTail2(file, maxBytes) {
  try {
    const size = (0, import_node_fs9.statSync)(file).size;
    const start = Math.max(0, size - maxBytes);
    const buf = Buffer.alloc(size - start);
    const fd = (0, import_node_fs9.openSync)(file, "r");
    try {
      (0, import_node_fs9.readSync)(fd, buf, 0, buf.length, start);
    } finally {
      (0, import_node_fs9.closeSync)(fd);
    }
    let t = buf.toString("utf8");
    if (start > 0) t = t.slice(t.indexOf("\n") + 1);
    const out = [];
    for (const line of t.split("\n")) {
      const s = line.trim();
      if (!s) continue;
      try {
        out.push(JSON.parse(s));
      } catch {
      }
    }
    return out;
  } catch {
    return [];
  }
}
function applyRow(a, row) {
  const ts = typeof row.ts === "number" ? row.ts : 0;
  const to = typeof row.to === "string" ? row.to : "";
  const chat = typeof row.chat === "string" ? row.chat : "";
  switch (row.ev) {
    case "send": {
      if (row.ok !== true || !to) break;
      const eid = String(row.eid || "");
      if (eid) a.sentEids.add(eid);
      const day = String(row.day || "");
      if (day) a.sentPhoneDay.add(`${to}|${day}`);
      a.sendTimes.push(ts);
      const prev = a.chats.get(to);
      if (!prev || ts >= prev.sentAt) a.chats.set(to, { eid, day, sentAt: ts, test: row.test === true, replyAt: 0, linkAt: 0 });
      if (row.test === true) a.declined.delete(to);
      break;
    }
    case "send_fail": {
      const eid = String(row.eid || "");
      if (!eid) break;
      if (row.final === true) a.failedEids.add(eid);
      else a.tries.set(eid, { n: Number(row.attempt) || 1, nextAt: ts + RETRY_AFTER });
      break;
    }
    case "in": {
      if (typeof row.mid === "string" && row.mid) a.seenMid.add(row.mid);
      const c = a.chats.get(chat);
      if (c && ts >= c.sentAt) c.replyAt = Math.max(c.replyAt, ts);
      break;
    }
    case "link": {
      const c = a.chats.get(chat);
      if (c && row.ok === true) c.linkAt = Math.max(c.linkAt, ts);
      break;
    }
    case "decline":
      if (chat) a.declined.add(chat);
      break;
    case "tpl_status":
      a.tplSeen.add(`${row.guid}|${row.status}`);
      break;
  }
}
function persistMembers(a) {
  try {
    const targets = {};
    for (const [id, m] of a.members) targets[id] = { day: m.day, at: m.at, total: m.total, unresolved: m.unresolved, numbers: [...m.numbers] };
    const tmp = `${a.membersFile}.tmp.${process.pid}`;
    (0, import_node_fs9.writeFileSync)(tmp, JSON.stringify({ v: 1, targets }) + "\n", "utf8");
    (0, import_node_fs9.renameSync)(tmp, a.membersFile);
  } catch (e) {
    console.error("[wa-dozhim] \u043D\u0435 \u0441\u043C\u043E\u0433 \u0437\u0430\u043F\u0438\u0441\u0430\u0442\u044C wa-members.json:", e.message);
  }
}
function loadMembers(a) {
  try {
    if (!(0, import_node_fs9.existsSync)(a.membersFile)) return;
    const raw = JSON.parse((0, import_node_fs9.readFileSync)(a.membersFile, "utf8"));
    for (const [id, m] of Object.entries(raw?.targets || {})) {
      if (!m || !Array.isArray(m.numbers) || typeof m.at !== "number") continue;
      a.members.set(id, { day: String(m.day || ""), at: m.at, total: Number(m.total) || m.numbers.length, unresolved: Number(m.unresolved) || 0, numbers: new Set(m.numbers.map(String)) });
    }
  } catch {
    log2("wa-members.json \u043D\u0435\u0447\u0438\u0442\u0430\u0435\u043C, \u043D\u0430\u0447\u0438\u043D\u0430\u044E \u0431\u0435\u0437 \u0437\u0430\u043C\u0435\u0440\u0430");
  }
}
function dzInit(host) {
  dzReset();
  (0, import_node_fs9.mkdirSync)(host.dir, { recursive: true });
  const a = {
    host,
    file: (0, import_node_path9.join)(host.dir, "wa-dozhim.jsonl"),
    membersFile: (0, import_node_path9.join)(host.dir, "wa-members.json"),
    rows: [],
    members: /* @__PURE__ */ new Map(),
    sentEids: /* @__PURE__ */ new Set(),
    sentPhoneDay: /* @__PURE__ */ new Set(),
    failedEids: /* @__PURE__ */ new Set(),
    tries: /* @__PURE__ */ new Map(),
    chats: /* @__PURE__ */ new Map(),
    declined: /* @__PURE__ */ new Set(),
    seenMid: /* @__PURE__ */ new Set(),
    tplSeen: /* @__PURE__ */ new Set(),
    sendTimes: [],
    names: /* @__PURE__ */ new Map(),
    alarmAt: /* @__PURE__ */ new Map(),
    replies: [],
    running: /* @__PURE__ */ new Set(),
    busy: /* @__PURE__ */ new Set(),
    ticking: false,
    toggling: false,
    hookBusy: false,
    consecFail: 0,
    haltUntil: 0,
    measureFails: 0,
    measureTry: /* @__PURE__ */ new Map(),
    testAt: [],
    tpl: null,
    hookCheckAt: 0,
    lastTickAt: 0
  };
  try {
    if ((0, import_node_fs9.existsSync)(a.file) && (0, import_node_fs9.statSync)(a.file).size > FILE_COMPACT_BYTES2) {
      const keep = readTail2(a.file, 2 * 1024 * 1024);
      const tmp = `${a.file}.tmp.${process.pid}`;
      (0, import_node_fs9.writeFileSync)(tmp, keep.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
      (0, import_node_fs9.renameSync)(tmp, a.file);
    }
  } catch (e) {
    console.error("[wa-dozhim] \u043D\u0435 \u0441\u043C\u043E\u0433 \u0441\u0436\u0430\u0442\u044C wa-dozhim.jsonl:", e.message);
  }
  for (const row of readTail2(a.file, FILE_TAIL_BYTES2)) {
    if (!row || typeof row.ev !== "string" || typeof row.ts !== "number") continue;
    a.rows.push(row);
    applyRow(a, row);
  }
  if (a.rows.length > ROWS_KEEP) a.rows.splice(0, a.rows.length - ROWS_KEEP);
  a.sendTimes = a.sendTimes.filter((t) => host.now() - t < 2 * DAY2);
  loadMembers(a);
  A2 = a;
}
function dzReset() {
  A2 = null;
}
function hookSecret2() {
  return env6("WAZZUP_HOOK_SECRET") || A2?.host.state().secret || "";
}
function ensureSecret2(a) {
  if (env6("WAZZUP_HOOK_SECRET")) return env6("WAZZUP_HOOK_SECRET");
  const cur = a.host.state().secret;
  if (cur) return cur;
  const secret = (0, import_node_crypto6.randomBytes)(24).toString("hex");
  a.host.patch({ secret });
  return secret;
}
var hookUri = (secret) => `${hookBase()}?s=${encodeURIComponent(secret)}`;
var hookShown = () => hookBase();
function currentMap(a) {
  const st = a.host.state();
  return st.maps[st.templateId] ?? defaultMap(st.templateName, "", st.vars || null);
}
function mapProblem(a) {
  const st = a.host.state();
  const map = currentMap(a);
  if (st.vars && map.length !== st.vars) return `\u0412 \u0448\u0430\u0431\u043B\u043E\u043D\u0435 ${st.vars} \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445, \u0430 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u043E ${map.length}.`;
  for (let i = 0; i < map.length; i++) if (map[i].kind === "text" && !(map[i].text || "").trim()) return `\u0417\u0430\u043F\u043E\u043B\u043D\u0438 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0439 {{${i + 1}}}.`;
  return "";
}
function prerequisites2(a) {
  if (!wzKey()) return { ok: false, reason: "\u041D\u0435\u0442 WAZZUP_API_KEY \u0432 .env \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435: \u0434\u043E\u0436\u0438\u043C \u043D\u0435 \u0441\u0442\u0430\u0440\u0442\u0443\u0435\u0442." };
  if (!wzChannel()) return { ok: false, reason: "\u041D\u0435\u0442 WAZZUP_CHANNEL_ID \u0432 .env \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435: \u0434\u043E\u0436\u0438\u043C \u043D\u0435 \u0441\u0442\u0430\u0440\u0442\u0443\u0435\u0442." };
  if (!evoKey()) return { ok: false, reason: "\u041D\u0435\u0442 EVOLUTION_API_KEY: \u0431\u0435\u0437 \u043D\u0435\u0433\u043E \u043D\u0435 \u0432\u0438\u0434\u043D\u043E, \u043A\u0442\u043E \u0432\u0441\u0442\u0443\u043F\u0438\u043B." };
  const st = a.host.state();
  if (!st.templateId) return { ok: false, reason: "\u0412\u044B\u0431\u0435\u0440\u0438 \u0448\u0430\u0431\u043B\u043E\u043D \u0438\u0437 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u043D\u044B\u0445 \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0438 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438." };
  const bad = mapProblem(a);
  if (bad) return { ok: false, reason: bad };
  return { ok: true };
}
async function alarmOnce2(a, key, windowMs, textMsg) {
  const now = a.host.now();
  if (now - (a.alarmAt.get(key) || 0) < windowMs) return;
  a.alarmAt.set(key, now);
  try {
    await a.host.alarm(textMsg);
  } catch {
  }
}
async function measureTarget(a, t) {
  const r = await a.host.exclusive(() => groupParticipants(t.sendJid));
  const at = a.host.now();
  if (!r.ok) {
    a.measureFails++;
    log2("\u0437\u0430\u043C\u0435\u0440 %s \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D: %s", t.id, scrub5(r.error));
    if (a.measureFails >= 3) await alarmOnce2(a, "measure", HOUR2, `\u0414\u043E\u0436\u0438\u043C WABA: \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0430\u0435\u0442\u0441\u044F \u0443\u0437\u043D\u0430\u0442\u044C, \u043A\u0442\u043E \u0432\u0441\u0442\u0443\u043F\u0438\u043B \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E (${clipText2(scrub5(r.error), 100)}). \u041F\u043E\u043A\u0430 \u0437\u0430\u043C\u0435\u0440\u0430 \u043D\u0435\u0442, \u0448\u0430\u0431\u043B\u043E\u043D\u044B \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F.`);
    return false;
  }
  const numbers = /* @__PURE__ */ new Set();
  let unresolved = 0;
  for (const p of r.data) {
    const d = digitsOf(p.phoneNumber) || (p.id.endsWith("@s.whatsapp.net") ? digitsOf(p.id) : "");
    if (d) numbers.add(d);
    else unresolved++;
  }
  const total = r.data.length;
  if (total === 0 || total >= 20 && unresolved > total * 0.05) {
    a.measureFails++;
    log2("\u0437\u0430\u043C\u0435\u0440 %s \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u0442: \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 %d, \u0431\u0435\u0437 \u043D\u043E\u043C\u0435\u0440\u0430 %d", t.id, total, unresolved);
    if (a.measureFails >= 3) await alarmOnce2(a, `bad:${t.id}`, HOUR2, `\u0414\u043E\u0436\u0438\u043C WABA: \u0437\u0430\u043C\u0435\u0440 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 ${t.day} \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u0442 (\u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 ${total}, \u0431\u0435\u0437 \u043D\u043E\u043C\u0435\u0440\u0430 ${unresolved}). \u0428\u0430\u0431\u043B\u043E\u043D\u044B \u044D\u0442\u043E\u043C\u0443 \u0434\u043D\u044E \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F.`);
    return false;
  }
  const prev = a.members.get(t.id);
  if (prev && prev.total >= 10 && total < prev.total * 0.7) {
    a.measureFails++;
    log2("\u0437\u0430\u043C\u0435\u0440 %s \u043F\u043E\u0434\u043E\u0437\u0440\u0438\u0442\u0435\u043B\u0435\u043D: \u0431\u044B\u043B\u043E %d, \u0441\u0442\u0430\u043B\u043E %d, \u043D\u0435 \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u044E", t.id, prev.total, total);
    await alarmOnce2(a, `shrink:${t.id}`, HOUR2, `\u0414\u043E\u0436\u0438\u043C WABA: \u0441\u043F\u0438\u0441\u043E\u043A \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 ${t.day} \u0432\u0434\u0440\u0443\u0433 \u0441\u0442\u0430\u043B \u043A\u043E\u0440\u043E\u0447\u0435 (${prev.total} -> ${total}). \u0417\u0430\u043C\u0435\u0440 \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u0442, \u0448\u0430\u0431\u043B\u043E\u043D\u044B \u044D\u0442\u043E\u043C\u0443 \u0434\u043D\u044E \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F, \u043F\u043E\u043A\u0430 \u0441\u043F\u0438\u0441\u043E\u043A \u043D\u0435 \u0432\u0435\u0440\u043D\u0451\u0442\u0441\u044F.`);
    return false;
  }
  a.measureFails = 0;
  a.members.set(t.id, { day: t.day, at, total, unresolved, numbers });
  a.host.noteMembers(t.id, total, at);
  persistMembers(a);
  log2("\u0437\u0430\u043C\u0435\u0440 %s: \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 %d, \u043D\u043E\u043C\u0435\u0440\u043E\u0432 %d, \u0431\u0435\u0437 \u043D\u043E\u043C\u0435\u0440\u0430 %d", t.id, total, numbers.size, unresolved);
  return true;
}
function pruneMembers(a, live) {
  const ids = new Set(live.map((t) => t.id));
  let changed = false;
  for (const id of [...a.members.keys()]) {
    if (!ids.has(id)) {
      a.members.delete(id);
      changed = true;
    }
  }
  if (changed) persistMembers(a);
}
function membersOfDay(a, day, targets, now, needFresh) {
  const list = targets.filter((t) => t.day === day);
  if (!list.length) return null;
  const union = /* @__PURE__ */ new Set();
  for (const t of list) {
    const m = a.members.get(t.id);
    if (!m) return null;
    if (needFresh && now - m.at > MEASURE_MAX_AGE) return null;
    for (const n of m.numbers) union.add(n);
  }
  return union;
}
var minuteOfDay = (ms) => {
  const p = partsInTZ(ms);
  return p.hour * 60 + p.minute;
};
function windowStart(ms, from, to) {
  const m = minuteOfDay(ms);
  const day = dayKeyOf(ms);
  if (m < minsOf(from)) return atTime(day, from);
  if (m >= minsOf(to)) return atTime(addDays(day, 1), from);
  return ms;
}
var inWindow2 = (ms, st) => {
  const m = minuteOfDay(ms);
  return m >= minsOf(st.from) && m < minsOf(st.to);
};
function evaluate(a, now) {
  const h = a.host;
  const st = h.state();
  const out = { ready: [], waiting: 0, needMeasure: 0, foreign: 0, noTarget: [], days: [], error: "" };
  const src = h.leads();
  if (!src.leads) {
    out.error = src.error || "\u0437\u0430\u044F\u0432\u043A\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B";
    return out;
  }
  const cfg = h.timeCfg();
  const today = dayKeyOf(now);
  const targets = h.targets(now);
  const linked2 = h.linkedEids();
  const seenEid = /* @__PURE__ */ new Set();
  const seenPhoneDay = /* @__PURE__ */ new Set();
  const cutoffMs = atTime(today, st.cutoff);
  const curDay = h.dayOf(now);
  const nxtDay = nextStreamDay(addDays(curDay, 1), cfg);
  const shown = /* @__PURE__ */ new Map([[today, /* @__PURE__ */ new Set()], [curDay, /* @__PURE__ */ new Set()], [nxtDay, /* @__PURE__ */ new Set()]]);
  const leads = [...src.leads].sort((x, y) => x.ts - y.ts);
  for (const lead of leads) {
    if (lead.ts > now) continue;
    if (now - lead.ts > MAX_LEAD_AGE) continue;
    const day = h.dayOf(lead.ts);
    const ph = normalizePhone(lead.phone);
    if (ph && shown.has(day)) shown.get(day).add(ph.digits);
    if (day < today || !ph) continue;
    if (!ph.kz) {
      out.foreign++;
      continue;
    }
    const eid = lead.eventId || lead.id;
    if (!eid || linked2.has(eid)) continue;
    if (seenEid.has(eid) || a.sentEids.has(eid) || a.failedEids.has(eid)) continue;
    const pd = `${ph.digits}|${day}`;
    if (seenPhoneDay.has(pd) || a.sentPhoneDay.has(pd) || a.declined.has(ph.digits)) continue;
    const anyMembers = membersOfDay(a, day, targets, now, false);
    if (anyMembers?.has(ph.digits)) continue;
    seenEid.add(eid);
    seenPhoneDay.add(pd);
    out.waiting++;
    const fresh = membersOfDay(a, day, targets, now, true);
    if (!fresh) {
      out.needMeasure++;
      if (!targets.some((t) => t.day === day) && !out.noTarget.includes(day)) out.noTarget.push(day);
      continue;
    }
    const due = windowStart(lead.ts + st.delayMin * MIN2, st.from, st.to);
    if (now < due || !inWindow2(now, st)) continue;
    if (day === today && now > cutoffMs) continue;
    if (a.tries.get(eid) && a.tries.get(eid).nextAt > now) continue;
    out.ready.push({ lead, digits: ph.digits, day, eid, due });
  }
  for (const [day, phones] of shown) {
    const mem = membersOfDay(a, day, targets, now, false);
    let joined = null;
    if (mem) {
      joined = 0;
      for (const p of phones) if (mem.has(p)) joined++;
    }
    const at = Math.min(...targets.filter((t) => t.day === day).map((t) => a.members.get(t.id)?.at ?? 0), Number.MAX_SAFE_INTEGER);
    const unresolved = targets.filter((t) => t.day === day).reduce((n, t) => n + (a.members.get(t.id)?.unresolved ?? 0), 0);
    out.days.push({ day, applied: phones.size, joined, measuredAt: at === Number.MAX_SAFE_INTEGER ? 0 : at, unresolved });
  }
  return out;
}
var sends24 = (a, now) => a.sendTimes.filter((t) => now - t < DAY2).length;
async function resolveName(a, lead, digits, useProfile) {
  const own = lead ? cleanName(lead.name) : "";
  if (own) return { name: own, from: "lead" };
  if (useProfile) {
    let prof = a.names.get(digits);
    if (prof === void 0) {
      const r = await a.host.exclusive(() => contactPushName(digits));
      prof = r.ok ? cleanName(r.data) : "";
      if (r.ok) {
        a.names.set(digits, prof);
        if (a.names.size > 2e3) a.names.delete(a.names.keys().next().value);
      }
    }
    if (prof) return { name: prof, from: "profile" };
  }
  return { name: "\u0434\u0440\u0443\u0433", from: "fallback" };
}
async function sendTemplate(a, chat, values, crm) {
  const st = a.host.state();
  const r = await wzSend({ chatId: chat, templateId: st.templateId, templateValues: values, crmMessageId: crm });
  if (r.ok) return { ok: true, mid: r.data.messageId };
  if (isRepeatedCrmId(r)) return { ok: true, mid: "", dup: true };
  return { ok: false, status: r.status, error: scrub5(r.error), retryable: r.retryable };
}
function recordSent(a, p) {
  const now = a.host.now();
  appendRow(a, { ts: now, ev: "send", ok: true, to: p.to, eid: p.eid, day: p.day, tpl: a.host.state().templateId, tplName: a.host.state().templateName, mid: p.mid, crm: `dozhim-${p.eid}`, status: 201, ...p.test ? { test: true } : {}, nameFrom: p.from, ...p.dup ? { dup: true } : {} });
  if (p.eid) a.sentEids.add(p.eid);
  a.sentPhoneDay.add(`${p.to}|${p.day}`);
  a.sendTimes.push(now);
  a.chats.set(p.to, { eid: p.eid, day: p.day, sentAt: now, test: p.test, replyAt: 0, linkAt: 0 });
  a.tries.delete(p.eid);
  if (p.test) a.declined.delete(p.to);
}
async function sendPick(a, pick) {
  const h = a.host;
  const st = h.state();
  const map = currentMap(a);
  const needsName = map.some((v) => v.kind === "name");
  const nm = needsName ? await resolveName(a, pick.lead, pick.digits, true) : { name: "", from: "lead" };
  const now = h.now();
  const link = h.waUrl;
  const values = buildValues(map, { name: nm.name, day: pick.day, now, link });
  if (!values) {
    await alarmOnce2(a, "values", HOUR2, "\u0414\u043E\u0436\u0438\u043C WABA: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0431\u0440\u0430\u0442\u044C \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 (\u043F\u0443\u0441\u0442\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435). \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435 \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u0432 \u043F\u0443\u043B\u044C\u0442\u0435.");
    return false;
  }
  const res = await sendTemplate(a, pick.digits, values, `dozhim-${pick.eid}`);
  if (res.ok) {
    a.consecFail = 0;
    recordSent(a, { to: pick.digits, eid: pick.eid, day: pick.day, mid: res.mid, test: false, name: nm.name, from: nm.from, dup: res.dup });
    log2("\u0448\u0430\u0431\u043B\u043E\u043D \u0443\u0448\u0451\u043B: %s, \u044D\u0444\u0438\u0440 %s", maskDigits(pick.digits), pick.day);
    return true;
  }
  const n = (a.tries.get(pick.eid)?.n ?? 0) + 1;
  const final = !res.retryable || n >= MAX_ATTEMPTS;
  appendRow(a, { ts: h.now(), ev: "send_fail", to: pick.digits, eid: pick.eid, day: pick.day, tpl: st.templateId, status: res.status, err: clipText2(res.error, 160), retryable: res.retryable, attempt: n, final });
  log2("\u0448\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u0443\u0448\u0451\u043B (%s): %s, \u043F\u043E\u043F\u044B\u0442\u043A\u0430 %d%s", maskDigits(pick.digits), res.error, n, final ? ", \u043E\u043A\u043E\u043D\u0447\u0430\u0442\u0435\u043B\u044C\u043D\u043E" : "");
  if (!final) {
    a.tries.set(pick.eid, { n, nextAt: h.now() + RETRY_AFTER });
    a.haltUntil = Math.max(a.haltUntil || 0, h.now() + RETRY_AFTER);
    return false;
  }
  a.failedEids.add(pick.eid);
  a.tries.delete(pick.eid);
  await alarmOnce2(a, `fail:${res.status}:${clipText2(res.error, 40)}`, HOUR2, `\u0414\u043E\u0436\u0438\u043C WABA: \u0448\u0430\u0431\u043B\u043E\u043D ${maskDigits(pick.digits)} \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D (${clipText2(res.error, 120)}). ${res.retryable ? "\u0422\u0440\u0438 \u043F\u043E\u043F\u044B\u0442\u043A\u0438 \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D\u044B." : "\u041F\u043E\u0432\u0442\u043E\u0440\u0430 \u043D\u0435 \u0431\u0443\u0434\u0435\u0442."}`);
  if (res.retryable) return false;
  a.consecFail++;
  if (a.consecFail >= HALT_AFTER) {
    a.haltUntil = h.now() + HALT_MS;
    a.consecFail = 0;
    await alarmOnce2(a, "halt", HOUR2, `\u0414\u043E\u0436\u0438\u043C WABA: ${HALT_AFTER} \u043E\u0442\u043A\u0430\u0437\u0430 \u043F\u043E\u0434\u0440\u044F\u0434, \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B \u043D\u0430 \u0447\u0430\u0441, \u0447\u0442\u043E\u0431\u044B \u043D\u0435 \u0442\u0435\u0440\u044F\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0438. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0448\u0430\u0431\u043B\u043E\u043D, \u043A\u0430\u043D\u0430\u043B \u0438 \u043A\u043B\u044E\u0447 Wazzup \u0432 \u043F\u0443\u043B\u044C\u0442\u0435.`);
    return false;
  }
  return true;
}
async function dzTick() {
  const a = A2;
  const none = { sent: 0, measured: 0, ready: 0 };
  if (!a) return none;
  if (a.ticking) return { ...none, skipped: "busy" };
  a.ticking = true;
  try {
    const h = a.host;
    const st = h.state();
    a.lastTickAt = h.now();
    if (st.hookOn || a.replies.length) await runReplies(a);
    if (st.hookOn) await hookCheck(a);
    if (!st.enabled) return { ...none, skipped: "off" };
    const can = h.canRun();
    if (!can.ok) return { ...none, skipped: "no_run" };
    if (!prerequisites2(a).ok) return { ...none, skipped: "no_config" };
    const now0 = h.now();
    const targets = h.targets(now0);
    pruneMembers(a, targets);
    const first = evaluate(a, now0);
    const maxAge = first.ready.length || first.needMeasure ? MEASURE_BUSY_AGE : MEASURE_MAX_AGE;
    let measured = 0;
    for (const t of targets) {
      const m = a.members.get(t.id);
      if (m && now0 - m.at < maxAge) continue;
      if (now0 - (a.measureTry.get(t.id) ?? 0) < MEASURE_RETRY) continue;
      a.measureTry.set(t.id, now0);
      if (await measureTarget(a, t)) measured++;
    }
    const ev = measured ? evaluate(a, h.now()) : first;
    const info = { sent: 0, measured, ready: ev.ready.length };
    if (h.now() < a.haltUntil) return { ...info, skipped: "halt" };
    if (!ev.ready.length) return info;
    for (const pick of ev.ready) {
      if (info.sent >= PER_TICK) break;
      if (!h.state().enabled || !h.canRun().ok) break;
      const now = h.now();
      if (now < a.haltUntil) break;
      const tg = h.targets(now);
      const mem = membersOfDay(a, pick.day, tg, now, true);
      if (!mem) break;
      if (mem.has(pick.digits)) continue;
      if (sends24(a, now) >= h.state().dailyLimit) {
        await alarmOnce2(a, `limit:${dayKeyOf(now)}`, DAY2, `\u0414\u043E\u0436\u0438\u043C WABA: \u0437\u0430 \u0441\u0443\u0442\u043A\u0438 \u0443\u0436\u0435 ${h.state().dailyLimit} \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432, \u044D\u0442\u043E \u043F\u0440\u0435\u0434\u0435\u043B \u0437\u0430\u0449\u0438\u0442\u044B \u043D\u043E\u043C\u0435\u0440\u0430. \u041E\u0441\u0442\u0430\u043B\u044C\u043D\u044B\u0435 \u0437\u0430\u044F\u0432\u043A\u0438 \u043F\u043E\u0434\u043E\u0436\u0434\u0443\u0442.`);
        break;
      }
      const before = a.sentEids.has(pick.eid);
      const cont = await sendPick(a, pick);
      if (!before && a.sentEids.has(pick.eid)) info.sent++;
      if (!cont) break;
      await h.sleep(Math.round(PACE_MS[0] + h.rand() * (PACE_MS[1] - PACE_MS[0])));
    }
    return info;
  } catch (e) {
    console.error("[wa-dozhim] \u043F\u0440\u043E\u0445\u043E\u0434 \u0443\u043F\u0430\u043B:", scrub5(String(e?.stack || e)).slice(0, 400));
    return none;
  } finally {
    a.ticking = false;
  }
}
var hashOf2 = (s) => (0, import_node_crypto6.createHash)("sha256").update(s).digest();
function readLimited4(req, max) {
  return new Promise((resolve) => {
    let size = 0;
    let over = false;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > max) over = true;
      else chunks.push(c);
    });
    req.on("end", () => resolve(over ? null : Buffer.concat(chunks).toString("utf8")));
    req.on("error", () => resolve(null));
  });
}
async function handleWazzupHook(req, res) {
  const send2 = (status, body2) => {
    const payload = JSON.stringify(body2);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload) });
    res.end(payload);
  };
  const secret = hookSecret2();
  let given = "";
  try {
    given = new URL(req.url || "/", "http://x").searchParams.get("s") || "";
  } catch {
    given = "";
  }
  if (req.method !== "POST" || !secret || !given || !(0, import_node_crypto6.timingSafeEqual)(hashOf2(secret), hashOf2(given))) {
    req.resume();
    return send2(req.method !== "POST" ? 405 : 403, { ok: false });
  }
  const raw = await readLimited4(req, 1024 * 1024);
  send2(200, { ok: true });
  const a = A2;
  if (!a || raw === null) return;
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return;
  }
  if (!body || typeof body !== "object" || body.test === true) return;
  const job = ingest2(a, body).catch((e) => console.error("[wa-dozhim] \u0440\u0430\u0437\u0431\u043E\u0440 \u0432\u0435\u0431\u0445\u0443\u043A\u0430 \u0443\u043F\u0430\u043B:", scrub5(String(e?.message || e)).slice(0, 200))).finally(() => a.running.delete(job));
  a.running.add(job);
}
async function ingest2(a, body) {
  const st = a.host.state();
  if (!st.enabled && !st.hookOn) return;
  if (body.templateStatus !== void 0 && body.templateStatus !== null) onTemplateStatus(a, body.templateStatus);
  const msgs = Array.isArray(body.messages) ? body.messages : [];
  for (const m of msgs) await onMessage2(a, m);
}
function onTemplateStatus(a, raw) {
  const list = Array.isArray(raw) ? raw : [raw];
  for (const t of list) {
    if (!t || typeof t !== "object") continue;
    const o = t;
    const guid = String(o.templateGuid ?? o.guid ?? o.templateId ?? o.id ?? "").slice(0, 80);
    const name = clipText2(o.name ?? o.templateName ?? o.title ?? "", 120);
    const rawStatus = o.status ?? o.templateStatus ?? o.state;
    const status = clipText2(typeof rawStatus === "string" ? rawStatus.toLowerCase() : rawStatus, 40);
    if (!guid && !name) continue;
    const key = `${guid || name}|${status}`;
    const fresh = !a.tplSeen.has(key);
    a.tplSeen.add(key);
    appendRow(a, { ts: a.host.now(), ev: "tpl_status", guid, name, status });
    a.host.journal({ ev: "dz_tpl", name, status });
    a.tpl = null;
    if (!fresh) continue;
    const main = /вступите в сообщество|vstupite_v_soobshchestvo/i.test(`${name} ${guid === a.host.state().templateId ? a.host.state().templateName : ""}`);
    if (!main) continue;
    if (/approv|одобр/i.test(status)) void a.host.notify(`\u0428\u0430\u0431\u043B\u043E\u043D WABA \xAB${name || "\u0412\u0441\u0442\u0443\u043F\u0438\u0442\u0435 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E"}\xBB \u043E\u0434\u043E\u0431\u0440\u0435\u043D. \u0415\u0433\u043E \u043C\u043E\u0436\u043D\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0432 \u043F\u0443\u043B\u044C\u0442\u0435 WhatsApp, \u0431\u043B\u043E\u043A \xAB\u0414\u043E\u0436\u0438\u043C WABA\xBB.`).catch(() => {
    });
    else if (/reject|отклон|disabled/i.test(status)) void a.host.notify(`\u0428\u0430\u0431\u043B\u043E\u043D WABA \xAB${name || "\u0412\u0441\u0442\u0443\u043F\u0438\u0442\u0435 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E"}\xBB \u043D\u0435 \u043F\u0440\u043E\u0448\u0451\u043B \u043C\u043E\u0434\u0435\u0440\u0430\u0446\u0438\u044E (${status}). \u0414\u043E\u0436\u0438\u043C \u043F\u043E\u043A\u0430 \u0438\u0434\u0451\u0442 \u0437\u0430\u043F\u0430\u0441\u043D\u044B\u043C \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u043C.`).catch(() => {
    });
  }
}
async function onMessage2(a, m) {
  if (!m || typeof m !== "object") return;
  if (m.isEcho !== false || m.chatType !== "whatsapp") return;
  const ch = wzChannel();
  if (ch && m.channelId && String(m.channelId) !== ch) return;
  const chat = digitsOf(String(m.chatId ?? ""));
  if (!chat) return;
  const h = a.host;
  const now = h.now();
  const info = a.chats.get(chat);
  if (!info || now - info.sentAt > REPLY_WINDOW) return;
  const mid = String(m.messageId ?? "").slice(0, 100) || (0, import_node_crypto6.createHash)("sha1").update(`${chat}|${m.dateTime ?? ""}|${m.text ?? ""}`).digest("hex");
  if (a.seenMid.has(mid)) return;
  a.seenMid.add(mid);
  if (a.seenMid.size > 8e3) a.seenMid.delete(a.seenMid.values().next().value);
  appendRow(a, { ts: now, ev: "in", mid, chat });
  info.replyAt = now;
  if (a.declined.has(chat)) return;
  const body = typeof m.text === "string" ? m.text : typeof m.content === "string" ? m.content : "";
  if (isDecline(body)) {
    a.declined.add(chat);
    appendRow(a, { ts: now, ev: "decline", chat });
    await replyOnce(a, { chat, kind: "decline", tries: 0, nextAt: 0 });
    return;
  }
  if (info.linkAt) return;
  await replyOnce(a, { chat, kind: "link", tries: 0, nextAt: 0 });
}
function linkTextFor(a, info) {
  const now = a.host.now();
  const url = a.host.linkFor(info.day, now) ?? a.host.waUrl;
  return LINK_TEXT(url);
}
async function replyOnce(a, rp) {
  const key = `${rp.kind}:${rp.chat}`;
  if (a.busy.has(key)) return;
  a.busy.add(key);
  try {
    await replyNow(a, rp);
  } finally {
    a.busy.delete(key);
  }
}
async function replyNow(a, rp) {
  const h = a.host;
  const info = a.chats.get(rp.chat);
  if (!info) return;
  if (rp.kind === "link" && info.linkAt) return;
  const body = rp.kind === "link" ? linkTextFor(a, info) : DECLINE_TEXT;
  const crm = `dozhim-${rp.kind}-${info.eid}`;
  const r = await wzSend({ chatId: rp.chat, text: body, crmMessageId: crm });
  const now = h.now();
  if (r.ok || isRepeatedCrmId(r)) {
    if (rp.kind === "link") info.linkAt = now;
    appendRow(a, { ts: now, ev: rp.kind === "link" ? "link" : "decline_sent", ok: true, chat: rp.chat, day: info.day, mid: r.ok ? r.data.messageId : "" });
    log2("%s \u0443\u0448\u043B\u043E: %s", rp.kind === "link" ? "\u0441\u0441\u044B\u043B\u043A\u0430" : "\u043E\u0442\u043A\u0430\u0437 \u043F\u0440\u0438\u043D\u044F\u0442", maskDigits(rp.chat));
    return;
  }
  appendRow(a, { ts: now, ev: rp.kind === "link" ? "link" : "decline_sent", ok: false, chat: rp.chat, status: r.status, err: clipText2(scrub5(r.error), 160), attempt: rp.tries + 1 });
  log2("\u043E\u0442\u0432\u0435\u0442 \u043D\u0435 \u0443\u0448\u0451\u043B (%s): %s", maskDigits(rp.chat), scrub5(r.error));
  if (r.retryable && rp.tries < 2 && rp.kind === "link") {
    a.replies.push({ ...rp, tries: rp.tries + 1, nextAt: now + MIN2 });
    return;
  }
  await alarmOnce2(a, `reply:${r.status}`, HOUR2, `\u0414\u043E\u0436\u0438\u043C WABA: \u043E\u0442\u0432\u0435\u0442 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0443 ${maskDigits(rp.chat)} \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u043B\u0441\u044F (${clipText2(scrub5(r.error), 120)}). \u0421\u0441\u044B\u043B\u043A\u0443 \u043E\u043D \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0438\u043B.`);
}
async function runReplies(a) {
  if (!a.replies.length) return;
  const now = a.host.now();
  const due = a.replies.filter((r) => r.nextAt <= now);
  a.replies = a.replies.filter((r) => r.nextAt > now);
  for (const rp of due) await replyOnce(a, rp);
}
var SUBS_ON = { messagesAndStatuses: true, contactsAndDealsCreation: false, channelsUpdates: false, templateStatus: true };
var SUBS_OFF = { messagesAndStatuses: false, contactsAndDealsCreation: false, channelsUpdates: false, templateStatus: false };
function sameHook(current) {
  try {
    const x = new URL(current);
    const y = new URL(hookBase());
    return x.origin === y.origin && x.pathname.replace(/\/+$/, "") === y.pathname.replace(/\/+$/, "");
  } catch {
    return false;
  }
}
var hostOf2 = (u) => {
  try {
    const x = new URL(u);
    return `${x.origin}${x.pathname}`;
  } catch {
    return "\u0430\u0434\u0440\u0435\u0441 \u043D\u0435 \u0440\u0430\u0437\u043E\u0431\u0440\u0430\u043D";
  }
};
var originOf = (u) => {
  try {
    return new URL(u).origin;
  } catch {
    return "\u0430\u0434\u0440\u0435\u0441 \u043D\u0435 \u0440\u0430\u0437\u043E\u0431\u0440\u0430\u043D";
  }
};
async function dzHookSet(on) {
  const a = A2;
  if (!a) return MODULE_OFF2;
  if (typeof on !== "boolean") return fail2("bad_request", "\u041D\u0443\u0436\u043D\u043E true \u0438\u043B\u0438 false.");
  if (!wzKey()) return fail2("no_key", "\u041D\u0435\u0442 WAZZUP_API_KEY \u0432 .env \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435.");
  if (a.hookBusy) return fail2("busy", "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044F \u0441 \u0432\u0435\u0431\u0445\u0443\u043A\u043E\u043C \u0435\u0449\u0451 \u0438\u0434\u0451\u0442, \u043F\u043E\u0434\u043E\u0436\u0434\u0438 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434.");
  a.hookBusy = true;
  try {
    const cur = await wzGetHooks();
    if (!cur.ok) return fail2("wazzup", `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0437\u043D\u0430\u0442\u044C, \u043A\u0430\u043A\u043E\u0439 \u0432\u0435\u0431\u0445\u0443\u043A \u0441\u0442\u043E\u0438\u0442 \u0432 Wazzup: ${clipText2(scrub5(cur.error), 120)}. \u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043C\u0435\u043D\u044F\u043B.`);
    const uri = cur.data.webhooksUri.trim();
    if (on) {
      if (uri && !sameHook(uri)) {
        await a.host.alarm(`\u0414\u043E\u0436\u0438\u043C WABA: \u0432 Wazzup \u0443\u0436\u0435 \u0441\u0442\u043E\u0438\u0442 \u0447\u0443\u0436\u043E\u0439 \u0432\u0435\u0431\u0445\u0443\u043A (${originOf(uri)}). \u0421\u0432\u043E\u0439 \u043D\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u0438\u043B, \u0447\u0442\u043E\u0431\u044B \u043D\u0435 \u0441\u043B\u043E\u043C\u0430\u0442\u044C \u0447\u0443\u0436\u043E\u0435. \u0420\u0435\u0448\u0438, \u043D\u0443\u0436\u0435\u043D \u043B\u0438 \u043E\u043D, \u0438 \u0441\u043D\u0438\u043C\u0438 \u0432\u0440\u0443\u0447\u043D\u0443\u044E \u0432 Wazzup.`);
        return fail2("foreign_hook", `\u0412 Wazzup \u0443\u0436\u0435 \u0441\u0442\u043E\u0438\u0442 \u0447\u0443\u0436\u043E\u0439 \u0432\u0435\u0431\u0445\u0443\u043A (${originOf(uri)}). \u042F \u0435\u0433\u043E \u043D\u0435 \u0442\u0440\u043E\u0433\u0430\u044E. \u0421\u0432\u043E\u0439 \u043D\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D.`);
      }
      const secret = ensureSecret2(a);
      const r = await wzSetHooks({ webhooksUri: hookUri(secret), subscriptions: SUBS_ON });
      if (!r.ok) return fail2("wazzup", `Wazzup \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u043B \u0432\u0435\u0431\u0445\u0443\u043A: ${clipText2(scrub5(r.error), 140)}. \u041E\u043D \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u0442 \u0430\u0434\u0440\u0435\u0441 \u0442\u0435\u0441\u0442\u043E\u0432\u044B\u043C \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u043C: \u0430\u0434\u0440\u0435\u0441 \u0434\u043E\u043B\u0436\u0435\u043D \u043E\u0442\u0432\u0435\u0447\u0430\u0442\u044C \u0441\u043D\u0430\u0440\u0443\u0436\u0438.`);
      a.host.patch({ hookOn: true });
      a.host.journal({ ev: "dz_hook", on: true });
      log2("\u0432\u0435\u0431\u0445\u0443\u043A Wazzup \u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D");
      return { ok: true, message: `\u0412\u0435\u0431\u0445\u0443\u043A Wazzup \u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D (${hostShown()}). \u041E\u0442\u0432\u0435\u0442\u044B \u043B\u044E\u0434\u0435\u0439 \u043D\u0430 \u0448\u0430\u0431\u043B\u043E\u043D \u0431\u0443\u0434\u0443\u0442 \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443.` };
    }
    if (uri && !sameHook(uri)) return fail2("foreign_hook", `\u0412 Wazzup \u0441\u0442\u043E\u0438\u0442 \u0447\u0443\u0436\u043E\u0439 \u0432\u0435\u0431\u0445\u0443\u043A (${originOf(uri)}), \u043D\u0435 \u043D\u0430\u0448. \u042F \u0435\u0433\u043E \u043D\u0435 \u0441\u043D\u0438\u043C\u0430\u044E.`);
    if (uri) {
      let r = await wzSetHooks({ webhooksUri: "", subscriptions: SUBS_OFF });
      if (!r.ok && r.status >= 400 && r.status < 500) r = await wzSetHooks({ webhooksUri: uri, subscriptions: SUBS_OFF });
      if (!r.ok) return fail2("wazzup", `Wazzup \u043D\u0435 \u0441\u043D\u044F\u043B \u0432\u0435\u0431\u0445\u0443\u043A: ${clipText2(scrub5(r.error), 140)}.`);
    }
    a.host.patch({ hookOn: false });
    a.host.journal({ ev: "dz_hook", on: false });
    log2("\u0432\u0435\u0431\u0445\u0443\u043A Wazzup \u0441\u043D\u044F\u0442");
    return { ok: true, message: "\u0412\u0435\u0431\u0445\u0443\u043A Wazzup \u0441\u043D\u044F\u0442. \u041E\u0442\u0432\u0435\u0442\u044B \u043B\u044E\u0434\u0435\u0439 \u043D\u0430 \u0448\u0430\u0431\u043B\u043E\u043D \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u044E\u0442\u0441\u044F." };
  } finally {
    a.hookBusy = false;
  }
}
var hostShown = () => hostOf2(hookShown());
async function hookCheck(a) {
  const now = a.host.now();
  if (now - a.hookCheckAt < 3 * HOUR2 || a.hookBusy) return;
  a.hookCheckAt = now;
  const cur = await wzGetHooks();
  if (!cur.ok) return;
  const uri = cur.data.webhooksUri.trim();
  if (uri && sameHook(uri) && cur.data.subscriptions.messagesAndStatuses !== false) return;
  await alarmOnce2(a, "hookgone", 6 * HOUR2, `\u0414\u043E\u0436\u0438\u043C WABA: \u0432\u0435\u0431\u0445\u0443\u043A Wazzup ${uri ? `\u0442\u0435\u043F\u0435\u0440\u044C \u0447\u0443\u0436\u043E\u0439 (${originOf(uri)})` : "\u043F\u0440\u043E\u043F\u0430\u043B"}. \u041E\u0442\u0432\u0435\u0442\u044B \u043B\u044E\u0434\u0435\u0439 \u043D\u0430 \u0448\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043F\u0440\u0438\u0445\u043E\u0434\u044F\u0442. \u041F\u043E\u0441\u0442\u0430\u0432\u044C \u0435\u0433\u043E \u0437\u0430\u043D\u043E\u0432\u043E \u0432 \u043F\u0443\u043B\u044C\u0442\u0435, \u0431\u043B\u043E\u043A \xAB\u0414\u043E\u0436\u0438\u043C WABA\xBB.`);
}
var TPL_CACHE_MS = 6e4;
var TPL_MIN_GAP_MS = 5e3;
async function loadTemplates(a, force) {
  const now = a.host.now();
  if (a.tpl && (!force || now - a.tpl.callAt < TPL_MIN_GAP_MS) && now - a.tpl.at < TPL_CACHE_MS) return { ok: true, items: a.tpl.items, at: a.tpl.at, cached: true };
  if (!wzKey()) return { ok: false, code: "no_key", message: "\u041D\u0435\u0442 WAZZUP_API_KEY \u0432 .env \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435." };
  const r = await wzTemplates();
  if (!r.ok) {
    const stale = a.tpl && now - a.tpl.at < 10 * MIN2;
    if (stale) return { ok: true, items: a.tpl.items, at: a.tpl.at, cached: true };
    return { ok: false, code: "wazzup", message: `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u044B Wazzup: ${clipText2(scrub5(r.error), 120)}.` };
  }
  a.tpl = { at: now, callAt: now, items: r.data };
  return { ok: true, items: r.data, at: now, cached: false };
}
async function dzTemplates(force = false) {
  const a = A2;
  if (!a) return MODULE_OFF2;
  const t = await loadTemplates(a, force);
  if (!t.ok) return fail2(t.code, t.message);
  let list = t.items.filter((x) => x.approved === true);
  let note = "";
  if (!list.length) {
    const unknown = t.items.filter((x) => x.approved === null);
    if (unknown.length) {
      list = unknown;
      note = "Wazzup \u043D\u0435 \u043E\u0442\u0434\u0430\u043B \u0441\u0442\u0430\u0442\u0443\u0441 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432, \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u044E \u0432\u0441\u0435. \u0412\u044B\u0431\u0438\u0440\u0430\u0439 \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u043D\u044B\u0435.";
    } else if (t.items.length) note = "\u041E\u0434\u043E\u0431\u0440\u0435\u043D\u043D\u044B\u0445 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.";
    else note = "\u0412 Wazzup \u043D\u0435\u0442 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432 WABA.";
  }
  const st = a.host.state();
  const items = list.map((x) => ({ ...x, map: x.id === st.templateId ? currentMap(a) : st.maps[x.id] ?? defaultMap(x.name, x.title, x.vars) }));
  return { ok: true, message: note, items, total: t.items.length, at: t.at, cached: t.cached, note };
}
var MODULE_OFF2 = fail2("module_off", "\u041C\u043E\u0434\u0443\u043B\u044C WhatsApp \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D: \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 \u043D\u0435\u0442 WA_GROUPS=on \u0438\u043B\u0438 \u043E\u043D \u043D\u0435 \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u0430\u043B (\u0441\u043C. /api/health).");
async function dzSave(p) {
  const a = A2;
  if (!a) return MODULE_OFF2;
  if (!p || typeof p !== "object" || Array.isArray(p)) return fail2("bad_request", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438.");
  const q2 = p;
  const st = a.host.state();
  const next = {};
  if (q2.delayMin !== void 0) {
    const n = Number(q2.delayMin);
    if (!Number.isInteger(n) || n < 0 || n > 1440) return fail2("bad_request", "\u0417\u0430\u0434\u0435\u0440\u0436\u043A\u0430: \u0446\u0435\u043B\u043E\u0435 \u0447\u0438\u0441\u043B\u043E \u043C\u0438\u043D\u0443\u0442 \u043E\u0442 0 \u0434\u043E 1440.");
    next.delayMin = n;
  }
  if (q2.from !== void 0 || q2.to !== void 0) {
    const from = q2.from === void 0 ? st.from : q2.from;
    const to = q2.to === void 0 ? st.to : q2.to;
    if (!validHHMM(from) || !validHHMM(to) || minsOf(from) >= minsOf(to)) return fail2("bad_request", "\u041E\u043A\u043D\u043E \u0447\u0430\u0441\u043E\u0432: \u0432\u0440\u0435\u043C\u044F \u0432\u0438\u0434\u0430 09:00, \u043D\u0430\u0447\u0430\u043B\u043E \u0440\u0430\u043D\u044C\u0448\u0435 \u043A\u043E\u043D\u0446\u0430.");
    next.from = padHHMM(from);
    next.to = padHHMM(to);
  }
  if (q2.cutoff !== void 0) {
    if (!validHHMM(q2.cutoff)) return fail2("bad_request", "\u041F\u0440\u0435\u0434\u0435\u043B \u0432 \u0434\u0435\u043D\u044C \u044D\u0444\u0438\u0440\u0430: \u0432\u0440\u0435\u043C\u044F \u0432\u0438\u0434\u0430 19:30.");
    next.cutoff = padHHMM(q2.cutoff);
  }
  if (q2.dailyLimit !== void 0) {
    const n = Number(q2.dailyLimit);
    if (!Number.isInteger(n) || n < 1 || n > 250) return fail2("bad_request", "\u041B\u0438\u043C\u0438\u0442 \u0432 \u0441\u0443\u0442\u043A\u0438: \u0446\u0435\u043B\u043E\u0435 \u0447\u0438\u0441\u043B\u043E \u043E\u0442 1 \u0434\u043E 250 (\u043F\u0440\u0435\u0434\u0435\u043B Meta 250 \u043D\u043E\u0432\u044B\u0445 \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u043E\u043A).");
    next.dailyLimit = n;
  }
  const maps = { ...st.maps };
  const tid = typeof q2.templateId === "string" && q2.templateId ? q2.templateId : q2.map !== void 0 ? st.templateId : "";
  if (tid && (tid !== st.templateId || q2.map !== void 0)) {
    let t = await loadTemplates(a, false);
    if (!t.ok) return fail2(t.code, t.message);
    let tpl = t.items.find((x) => x.id === tid);
    if (!tpl || tpl.approved === false) {
      const fresh = await loadTemplates(a, true);
      if (fresh.ok) {
        t = fresh;
        tpl = t.items.find((x) => x.id === tid);
      }
    }
    if (!tpl) return fail2("not_found", "\u0422\u0430\u043A\u043E\u0433\u043E \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043D\u0435\u0442 \u0432 Wazzup. \u041E\u0431\u043D\u043E\u0432\u0438 \u0441\u043F\u0438\u0441\u043E\u043A \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432.");
    if (tpl.approved === false) return fail2("not_approved", `\u0428\u0430\u0431\u043B\u043E\u043D \xAB${tpl.title || tpl.name}\xBB \u0435\u0449\u0451 \u043D\u0435 \u043E\u0434\u043E\u0431\u0440\u0435\u043D (${tpl.status || "\u0441\u0442\u0430\u0442\u0443\u0441 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u0435\u043D"}). \u0412\u044B\u0431\u0435\u0440\u0438 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u043D\u044B\u0439.`);
    let map;
    if (q2.map !== void 0) {
      map = cleanMap(q2.map);
      if (!map) return fail2("bad_request", "\u0421\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435 \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u043D\u0435 \u0440\u0430\u0437\u043E\u0431\u0440\u0430\u043D\u043E.");
    } else map = maps[tpl.id] ?? defaultMap(tpl.name, tpl.title, tpl.vars);
    if (tpl.vars !== null && map.length !== tpl.vars) return fail2("bad_request", `\u0412 \u0448\u0430\u0431\u043B\u043E\u043D\u0435 ${tpl.vars} \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445, \u0430 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u043E ${map.length}.`);
    for (let i = 0; i < map.length; i++) if (map[i].kind === "text" && !(map[i].text || "").trim()) return fail2("bad_request", `\u0417\u0430\u043F\u043E\u043B\u043D\u0438 \u0442\u0435\u043A\u0441\u0442 \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0439 {{${i + 1}}}.`);
    maps[tpl.id] = map;
    next.maps = maps;
    next.templateId = tpl.id;
    next.templateName = tpl.title || tpl.name;
    next.vars = tpl.vars ?? map.length;
  }
  if (!Object.keys(next).length) return { ok: true, code: "same", message: "\u041D\u0435\u0447\u0435\u0433\u043E \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u044C." };
  a.host.patch(next);
  a.host.journal({ ev: "dz_save", template: next.templateName ?? st.templateName });
  return { ok: true, message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0434\u043E\u0436\u0438\u043C\u0430 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B." };
}
async function dzSetEnabled(on) {
  const a = A2;
  if (!a) return MODULE_OFF2;
  if (typeof on !== "boolean") return fail2("bad_request", "\u041D\u0443\u0436\u043D\u043E true \u0438\u043B\u0438 false.");
  if (a.toggling) return fail2("busy", "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0435 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0435\u0449\u0451 \u0438\u0434\u0451\u0442, \u043F\u043E\u0434\u043E\u0436\u0434\u0438 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434.");
  a.toggling = true;
  try {
    const st = a.host.state();
    if (on) {
      if (st.enabled) return { ok: true, code: "same", message: "\u0414\u043E\u0436\u0438\u043C \u0443\u0436\u0435 \u0432\u043A\u043B\u044E\u0447\u0451\u043D." };
      const pre = prerequisites2(a);
      if (!pre.ok) return fail2("no_config", `${pre.reason} \u0414\u043E\u0436\u0438\u043C \u043D\u0435 \u0432\u043A\u043B\u044E\u0447\u0451\u043D.`);
      a.host.patch({ enabled: true });
      a.host.journal({ ev: "dz_on", by: "panel" });
      log2("\u0432\u043A\u043B\u044E\u0447\u0451\u043D");
      return { ok: true, message: `\u0414\u043E\u0436\u0438\u043C \u0432\u043A\u043B\u044E\u0447\u0451\u043D. \u0428\u0430\u0431\u043B\u043E\u043D \xAB${st.templateName}\xBB \u0443\u0445\u043E\u0434\u0438\u0442 \u0442\u0435\u043C, \u043A\u0442\u043E \u0437\u0430\u043F\u0438\u0441\u0430\u043B\u0441\u044F \u043D\u0430 \u0432\u043E\u0440\u043A\u0448\u043E\u043F \u0441 \u043D\u043E\u043C\u0435\u0440\u043E\u043C \u041A\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043D\u0430 \u0438 \u043D\u0435 \u0432\u0441\u0442\u0443\u043F\u0438\u043B \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E: \u0447\u0435\u0440\u0435\u0437 ${st.delayMin} \u043C\u0438\u043D\u0443\u0442 \u043F\u043E\u0441\u043B\u0435 \u0437\u0430\u044F\u0432\u043A\u0438, \u0441 ${st.from} \u0434\u043E ${st.to} \u043F\u043E \u0410\u043B\u043C\u0430\u0442\u044B.${st.hookOn ? "" : " \u0412\u0435\u0431\u0445\u0443\u043A \u043D\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D: \u043E\u0442\u0432\u0435\u0442\u044B \u043B\u044E\u0434\u0435\u0439 \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0430\u0442, \u043D\u0430\u0436\u043C\u0438 \xAB\u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0432\u0435\u0431\u0445\u0443\u043A\xBB."}` };
    }
    if (!st.enabled) return { ok: true, code: "same", message: "\u0414\u043E\u0436\u0438\u043C \u0443\u0436\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D." };
    a.host.patch({ enabled: false });
    a.host.journal({ ev: "dz_off", by: "panel" });
    log2("\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D");
    return { ok: true, message: "\u0414\u043E\u0436\u0438\u043C \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D: \u043D\u043E\u0432\u044B\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u044B \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F." };
  } finally {
    a.toggling = false;
  }
}
async function dzTestSend(numberRaw, nowArg) {
  const a = A2;
  if (!a) return MODULE_OFF2;
  const ph = normalizePhone(numberRaw);
  if (!ph || ph.digits.length < 10) return fail2("bad_number", "\u041D\u043E\u043C\u0435\u0440: \u0442\u043E\u043B\u044C\u043A\u043E \u0446\u0438\u0444\u0440\u044B, \u0441 \u043A\u043E\u0434\u043E\u043C \u0441\u0442\u0440\u0430\u043D\u044B, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 77011234567.");
  const pre = prerequisites2(a);
  if (!pre.ok) return fail2("no_config", pre.reason);
  const now = nowArg ?? a.host.now();
  a.testAt = a.testAt.filter((t) => now - t < HOUR2);
  if (a.testAt.length && now - a.testAt[a.testAt.length - 1] < 1e4) return fail2("rate", "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0447\u0430\u0441\u0442\u043E, \u043F\u043E\u0434\u043E\u0436\u0434\u0438 10 \u0441\u0435\u043A\u0443\u043D\u0434.");
  if (a.testAt.length >= 10) return fail2("rate", "\u0422\u0435\u0441\u0442\u043E\u0432 \u0437\u0430 \u0447\u0430\u0441 \u0443\u0436\u0435 10. \u041F\u043E\u0434\u043E\u0436\u0434\u0438.");
  const st = a.host.state();
  if (sends24(a, now) >= st.dailyLimit) return fail2("limit", `\u0417\u0430 \u0441\u0443\u0442\u043A\u0438 \u0443\u0436\u0435 ${st.dailyLimit} \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432, \u044D\u0442\u043E \u043F\u0440\u0435\u0434\u0435\u043B \u0437\u0430\u0449\u0438\u0442\u044B \u043D\u043E\u043C\u0435\u0440\u0430.`);
  a.testAt.push(now);
  const day = a.host.dayOf(now);
  const src = a.host.leads();
  const lead = src.leads ? [...src.leads].reverse().find((l) => normalizePhone(l.phone)?.digits === ph.digits) ?? null : null;
  const nm = await resolveName(a, lead, ph.digits, false);
  const values = buildValues(currentMap(a), { name: nm.name, day, now, link: a.host.waUrl });
  if (!values) return fail2("no_config", "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0431\u0440\u0430\u0442\u044C \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445: \u043F\u0440\u043E\u0432\u0435\u0440\u044C \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435 \u0432 \u043F\u0443\u043B\u044C\u0442\u0435.");
  const eid = `test-${now}`;
  const res = await sendTemplate(a, ph.digits, values, `dozhim-${eid}`);
  if (!res.ok) {
    appendRow(a, { ts: a.host.now(), ev: "send_fail", to: ph.digits, eid, day, tpl: st.templateId, status: res.status, err: clipText2(res.error, 160), retryable: res.retryable, attempt: 1, final: true, test: true });
    return fail2("wazzup", `Wazzup \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u043B \u0442\u0435\u0441\u0442\u043E\u0432\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435: ${clipText2(res.error, 140)}.`);
  }
  recordSent(a, { to: ph.digits, eid, day, mid: res.mid, test: true, name: nm.name, from: nm.from, dup: res.dup });
  log2("\u0442\u0435\u0441\u0442\u043E\u0432\u044B\u0439 \u0448\u0430\u0431\u043B\u043E\u043D \u0443\u0448\u0451\u043B: %s", maskDigits(ph.digits));
  return { ok: true, message: `\u0422\u0435\u0441\u0442\u043E\u0432\u044B\u0439 \u0448\u0430\u0431\u043B\u043E\u043D \xAB${st.templateName}\xBB \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u043D\u0430 ${maskDigits(ph.digits)}. \u041D\u0430\u0436\u043C\u0438 \u0432 \u043D\u0451\u043C \u043A\u043D\u043E\u043F\u043A\u0443: \u043F\u0440\u0438\u0434\u0451\u0442 \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u044D\u0444\u0438\u0440\u0430 ${dateLabel(day)}.` };
}
var ddmm3 = (day) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;
var stamp2 = (ms) => `${ddmm3(dayKeyOf(ms))} ${hhmmOf(ms)}`;
var agoText2 = (ms) => {
  const s = Math.max(0, Math.round(ms / 1e3));
  return s < 90 ? `${s} \u0441 \u043D\u0430\u0437\u0430\u0434` : s < 5400 ? `${Math.round(s / 60)} \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434` : `${Math.round(s / 3600)} \u0447 \u043D\u0430\u0437\u0430\u0434`;
};
function dzPanel(nowArg) {
  const a = A2;
  if (!a) return { available: false };
  const h = a.host;
  const now = nowArg ?? h.now();
  const st = h.state();
  const pre = prerequisites2(a);
  let reason = "";
  if (!pre.ok) reason = pre.reason;
  else if (st.enabled) {
    const can = h.canRun();
    if (!can.ok) reason = `\u0421\u0435\u0439\u0447\u0430\u0441 \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442: ${can.why}.`;
    else if (now < a.haltUntil) reason = "\u041E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u043D\u0430 \u043F\u0430\u0443\u0437\u0435 \u043F\u043E\u0441\u043B\u0435 \u043E\u0448\u0438\u0431\u043E\u043A Wazzup (\u043F\u043E\u0441\u043B\u0435 \u0441\u0431\u043E\u044F 5 \u043C\u0438\u043D\u0443\u0442, \u043F\u043E\u0441\u043B\u0435 \u0442\u0440\u0451\u0445 \u043E\u0442\u043A\u0430\u0437\u043E\u0432 \u0447\u0430\u0441). \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0448\u0430\u0431\u043B\u043E\u043D, \u043A\u0430\u043D\u0430\u043B \u0438 \u043A\u043B\u044E\u0447.";
  }
  const ev = evaluate(a, now);
  if (ev.error) reason = reason || `\u0417\u0430\u044F\u0432\u043A\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B: ${ev.error}.`;
  if (!reason && st.enabled && ev.noTarget.length) reason = `\u041D\u0435\u0442 \u0433\u043E\u0442\u043E\u0432\u043E\u0433\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u0441 \u0437\u0430\u043C\u0435\u0440\u043E\u043C \u043D\u0430 ${ev.noTarget.map(ddmm3).join(", ")}: \u0437\u0430\u044F\u0432\u043A\u0438 \u043D\u0430 \u044D\u0442\u0438 \u0434\u043D\u0438 \u0436\u0434\u0443\u0442, \u0448\u0430\u0431\u043B\u043E\u043D \u0438\u043C \u043D\u0435 \u0443\u0439\u0434\u0451\u0442.`;
  if (!reason && st.enabled && !st.hookOn) reason = "\u0412\u0435\u0431\u0445\u0443\u043A Wazzup \u043D\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D: \u043E\u0442\u0432\u0435\u0442\u044B \u043B\u044E\u0434\u0435\u0439 \u043D\u0430 \u0448\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u044E\u0442\u0441\u044F, \u0441\u0441\u044B\u043B\u043A\u0443 \u043E\u043D\u0438 \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0430\u0442. \u041D\u0430\u0436\u043C\u0438 \xAB\u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0432\u0435\u0431\u0445\u0443\u043A\xBB.";
  const today = dayKeyOf(now);
  const todayRows = a.rows.filter((r) => dayKeyOf(r.ts) === today);
  const realSends = todayRows.filter((r) => r.ev === "send" && r.ok === true && r.test !== true);
  const toNumber = (r) => String(r.to || "");
  const days = ev.days.map((d) => ({ day: d.day, dayLabel: ddmm3(d.day), applied: d.applied, joined: d.joined, measured: d.measuredAt ? agoText2(now - d.measuredAt) : "", unresolved: d.unresolved }));
  const targets = h.targets(now);
  let joinedAfter = 0;
  for (const r of realSends) {
    const mem = membersOfDay(a, String(r.day), targets, now, false);
    if (mem?.has(toNumber(r))) joinedAfter++;
  }
  const inToday = new Set(todayRows.filter((r) => r.ev === "in").map((r) => String(r.chat)));
  const sendRows = a.rows.filter((r) => r.ev === "send" || r.ev === "send_fail");
  const recent = sendRows.slice(-30).reverse().map((r) => {
    const to = toNumber(r);
    const day = String(r.day || "");
    const base = { t: stamp2(r.ts), who: maskDigits(to), day, dayLabel: day ? ddmm3(day) : "", test: r.test === true };
    if (r.ev === "send_fail") {
      const final = r.final === true;
      return { ...base, status: final ? `\u043E\u0448\u0438\u0431\u043A\u0430: ${clipText2(r.err, 60)}` : `\u043E\u0448\u0438\u0431\u043A\u0430, \u043F\u043E\u0432\u0442\u043E\u0440 \u0447\u0435\u0440\u0435\u0437 5 \u043C\u0438\u043D\u0443\u0442 (${clipText2(r.err, 40)})`, tone: final ? "bad" : "wait" };
    }
    const c = a.chats.get(to);
    const mine = c && c.sentAt === r.ts;
    const joined = day ? membersOfDay(a, day, targets, now, false)?.has(to) : false;
    if (mine && a.declined.has(to)) return { ...base, status: "\u043E\u0442\u043A\u0430\u0437\u0430\u043B\u0441\u044F", tone: "mute" };
    if (joined) return { ...base, status: "\u0432\u0441\u0442\u0443\u043F\u0438\u043B", tone: "ok" };
    if (mine && c.linkAt) return { ...base, status: "\u043F\u043E\u043B\u0443\u0447\u0438\u043B \u0441\u0441\u044B\u043B\u043A\u0443", tone: "ok" };
    if (mine && c.replyAt) return { ...base, status: "\u043E\u0442\u0432\u0435\u0442\u0438\u043B", tone: "ok" };
    return { ...base, status: "\u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E", tone: "wait" };
  });
  const map = currentMap(a);
  const waitingTotal = ev.waiting;
  return {
    available: true,
    enabled: st.enabled,
    canEnable: pre.ok,
    reason,
    configured: { key: !!wzKey(), channel: !!wzChannel() },
    template: { id: st.templateId, name: st.templateName, vars: st.vars },
    settings: { delayMin: st.delayMin, from: st.from, to: st.to, cutoff: st.cutoff, dailyLimit: st.dailyLimit },
    map,
    mapProblem: mapProblem(a),
    webhook: { on: st.hookOn, url: hostShown(), secretInEnv: !!env6("WAZZUP_HOOK_SECRET") },
    counters: {
      candidates: realSends.length + waitingTotal,
      waiting: waitingTotal,
      waitingMeasure: ev.needMeasure,
      sent: realSends.length,
      replied: inToday.size,
      links: todayRows.filter((r) => r.ev === "link" && r.ok === true).length,
      joinedAfter,
      declined: todayRows.filter((r) => r.ev === "decline").length,
      failed: todayRows.filter((r) => r.ev === "send_fail" && r.final === true).length
    },
    limit: { used: sends24(a, now), max: st.dailyLimit },
    days,
    recent,
    lastTick: a.lastTickAt ? agoText2(now - a.lastTickAt) : "",
    halted: now < a.haltUntil
  };
}
async function dzCommand(cmd, args) {
  if (!A2) return MODULE_OFF2.message;
  if (cmd === "wa_dozhim_test") {
    const r = await dzTestSend(args);
    return r.message;
  }
  const arg = args.trim().toLowerCase();
  if (arg === "on" || arg === "off") return (await dzSetEnabled(arg === "on")).message;
  const [sub, ...restParts] = args.trim().split(/\s+/);
  const rest = restParts.join(" ").trim();
  const subL = (sub || "").toLowerCase();
  if (subL === "hook" && (rest === "on" || rest === "off")) return (await dzHookSet(rest === "on")).message;
  if (subL === "tpls" || subL === "tpl") {
    const r = await dzTemplates(true);
    if (!r.ok) return r.message;
    const items = r.items;
    if (subL === "tpls" || !rest) return [r.note || "\u041E\u0434\u043E\u0431\u0440\u0435\u043D\u043D\u044B\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u044B:", ...items.map((x) => `\u2022 ${x.title || x.name} (${x.vars ?? "?"} \u043F\u0435\u0440\u0435\u043C.)`)].join("\n");
    const q2 = rest.toLowerCase();
    const hit = items.filter((x) => `${x.title} ${x.name}`.toLowerCase().includes(q2));
    if (hit.length !== 1) return hit.length ? `\u041F\u043E\u0434\u0445\u043E\u0434\u0438\u0442 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E: ${hit.map((x) => x.title || x.name).join(", ")}. \u0423\u0442\u043E\u0447\u043D\u0438.` : "\u0422\u0430\u043A\u043E\u0433\u043E \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u043D\u043E\u0433\u043E \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u043D\u0435\u0442. \u0421\u043F\u0438\u0441\u043E\u043A: /wa_dozhim tpls";
    return (await dzSave({ templateId: hit[0].id })).message;
  }
  if (subL === "set" && rest) {
    const kv = {};
    for (const part of rest.split(/\s+/)) {
      const m = part.match(/^(to|from|cutoff|limit|delay)=(.+)$/i);
      if (!m) return `\u041D\u0435 \u043F\u043E\u043D\u044F\u043B \xAB${part}\xBB. \u041F\u0440\u0438\u043C\u0435\u0440: /wa_dozhim set to=19:30 limit=90 delay=30 cutoff=19:30`;
      kv[m[1].toLowerCase()] = m[2];
    }
    const p2 = {};
    if (kv.from) p2.from = kv.from;
    if (kv.to) p2.to = kv.to;
    if (kv.cutoff) p2.cutoff = kv.cutoff;
    if (kv.limit) p2.dailyLimit = Number(kv.limit);
    if (kv.delay) p2.delayMin = Number(kv.delay);
    return (await dzSave(p2)).message;
  }
  const p = dzPanel();
  const c = p.counters;
  return [
    `\u0414\u043E\u0436\u0438\u043C WABA: ${p.enabled ? "\u0432\u043A\u043B\u044E\u0447\u0451\u043D" : "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D"}${p.reason ? `. ${p.reason}` : ""}`,
    `\u0428\u0430\u0431\u043B\u043E\u043D: ${p.template.name || "\u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D"}. \u0412\u0435\u0431\u0445\u0443\u043A Wazzup: ${p.webhook.on ? "\u0441\u0442\u043E\u0438\u0442" : "\u043D\u0435 \u0441\u0442\u043E\u0438\u0442"}.`,
    `\u0421\u0435\u0433\u043E\u0434\u043D\u044F: \u043A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u043E\u0432 ${c.candidates}, \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E ${c.sent}, \u043E\u0442\u0432\u0435\u0442\u0438\u043B\u0438 ${c.replied}, \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0438 \u0441\u0441\u044B\u043B\u043A\u0443 ${c.links}, \u0432\u0441\u0442\u0443\u043F\u0438\u043B\u0438 \u043F\u043E\u0441\u043B\u0435 \u0434\u043E\u0436\u0438\u043C\u0430 ${c.joinedAfter}.`,
    "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C: /wa_dozhim on, \u0432\u044B\u043A\u043B\u044E\u0447\u0438\u0442\u044C: /wa_dozhim off, \u0442\u0435\u0441\u0442 \u043D\u0430 \u0441\u0432\u043E\u0439 \u043D\u043E\u043C\u0435\u0440: /wa_dozhim_test 77011234567",
    "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438: /wa_dozhim tpls, /wa_dozhim tpl <\u0447\u0430\u0441\u0442\u044C \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F>, /wa_dozhim set to=19:30 limit=90 delay=30, /wa_dozhim hook on|off"
  ].join("\n");
}

// form-api/wa-groups.ts
var env7 = (k) => (process.env[k] || "").trim();
var waEnabled = () => env7("WA_GROUPS").toLowerCase() === "on";
var adminNumbers = () => env7("WA_ADMIN_NUMBERS").split(",").map((s) => s.replace(/\D/g, "")).filter((s) => s.length >= 10);
var MIN3 = 6e4;
var HOUR3 = 36e5;
var TICK_MS2 = 3e4;
var JOINS_TICK_MS = 5e3;
var LOCK_STALE_MS2 = 3 * TICK_MS2;
var isObj2 = (x) => !!x && typeof x === "object" && !Array.isArray(x);
function allStrings2(x, out = []) {
  if (typeof x === "string") out.push(x);
  else if (Array.isArray(x)) x.forEach((v) => allStrings2(v, out));
  else if (isObj2(x)) Object.values(x).forEach((v) => allStrings2(v, out));
  return out;
}
function range(x, where) {
  if (!Array.isArray(x) || x.length !== 2 || x.some((n) => typeof n !== "number" || n < 0) || x[0] > x[1]) throw new Error(`wa-series: ${where} \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043F\u0430\u0440\u043E\u0439 [\u043E\u0442, \u0434\u043E] \u043F\u043E \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0430\u043D\u0438\u044E`);
  return [x[0], x[1]];
}
function validateWaSeries(raw) {
  if (!isObj2(raw)) throw new Error("wa-series: \u043A\u043E\u0440\u0435\u043D\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u043C");
  for (const s of allStrings2(raw)) if (s.includes(String.fromCharCode(8212))) throw new Error(`wa-series: \u0434\u043B\u0438\u043D\u043D\u043E\u0435 \u0442\u0438\u0440\u0435 \u0432 \xAB${s.slice(0, 50)}\xBB`);
  if (raw.timezone !== "Asia/Almaty") throw new Error("wa-series: timezone \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C Asia/Almaty");
  if (typeof raw.version !== "string") throw new Error("wa-series: \u043D\u0435\u0442 version");
  for (const k of ["streamStart", "closeAt"]) {
    try {
      parseHHMM(String(raw[k]));
    } catch {
      throw new Error(`wa-series: ${k} \u0432\u0438\u0434\u0430 HH:MM`);
    }
  }
  for (const k of ["streamMinutes", "graceMinutes", "createCatchupHours", "maxNewPerDay", "memberCheckMinutes", "captionLimit"]) {
    if (typeof raw[k] !== "number" || raw[k] <= 0) throw new Error(`wa-series: ${k} \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0447\u0438\u0441\u043B\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u0435 0`);
  }
  if (raw.firstDay !== void 0 && !isDayKey(raw.firstDay)) throw new Error("wa-series: firstDay \u0432\u0438\u0434\u0430 YYYY-MM-DD");
  if (raw.skipDays !== void 0 && (!Array.isArray(raw.skipDays) || !raw.skipDays.every(isDayKey))) throw new Error("wa-series: skipDays \u043C\u0430\u0441\u0441\u0438\u0432 \u0434\u043D\u0435\u0439 YYYY-MM-DD");
  if (raw.target !== "community" && raw.target !== "group") throw new Error("wa-series: target \u044D\u0442\u043E community \u0438\u043B\u0438 group");
  const of = raw.overflowAt;
  if (!isObj2(of) || typeof of.community !== "number" || typeof of.group !== "number" || of.community < 10 || of.group < 10) throw new Error("wa-series: overflowAt { community, group } \u0447\u0438\u0441\u043B\u0430");
  const pc = raw.pacing;
  if (!isObj2(pc)) throw new Error("wa-series: \u043D\u0435\u0442 pacing");
  range(pc.betweenSendsMs, "pacing.betweenSendsMs");
  range(pc.betweenStepsMs, "pacing.betweenStepsMs");
  const rt2 = raw.retry;
  if (!isObj2(rt2) || !Array.isArray(rt2.backoffSec) || !rt2.backoffSec.length || typeof rt2.pauseAfter !== "number" || rt2.pauseAfter < 1) throw new Error("wa-series: retry { backoffSec: [..], pauseAfter }");
  const jp = raw.joinPolling;
  if (!isObj2(jp)) throw new Error("wa-series: \u043D\u0435\u0442 joinPolling");
  range(jp.servingSec, "joinPolling.servingSec");
  range(jp.otherSec, "joinPolling.otherSec");
  if (jp.idleSec !== void 0) range(jp.idleSec, "joinPolling.idleSec");
  if (jp.hotMinutes !== void 0 && (typeof jp.hotMinutes !== "number" || jp.hotMinutes <= 0)) throw new Error("wa-series: joinPolling.hotMinutes \u0447\u0438\u0441\u043B\u043E \u0431\u043E\u043B\u044C\u0448\u0435 0");
  if (typeof jp.batch !== "number" || jp.batch < 1 || typeof jp.keepAfterCloseMin !== "number") throw new Error("wa-series: joinPolling.batch \u0438 keepAfterCloseMin \u0447\u0438\u0441\u043B\u0430");
  if (!isObj2(raw.alarms) || typeof raw.alarms.connectionEveryMinutes !== "number") throw new Error("wa-series: alarms.connectionEveryMinutes \u0447\u0438\u0441\u043B\u043E");
  for (const k of ["name", "description", "welcome"]) if (typeof raw[k] !== "string" || !raw[k]) throw new Error(`wa-series: ${k} \u043D\u0443\u0436\u0435\u043D \u043D\u0435\u043F\u0443\u0441\u0442\u043E\u0439 \u0442\u0435\u043A\u0441\u0442`);
  if (!Array.isArray(raw.avatar) || !raw.avatar.every((u) => typeof u === "string" && /^https:\/\//.test(u))) throw new Error("wa-series: avatar \u043C\u0430\u0441\u0441\u0438\u0432 https-\u0441\u0441\u044B\u043B\u043E\u043A");
  if (!Array.isArray(raw.messages) || !raw.messages.length) throw new Error("wa-series: messages \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043D\u0435\u043F\u0443\u0441\u0442\u044B\u043C \u043C\u0430\u0441\u0441\u0438\u0432\u043E\u043C");
  const ids = /* @__PURE__ */ new Set();
  for (const m of raw.messages) {
    if (!isObj2(m) || typeof m.id !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(m.id)) throw new Error("wa-series: \u0443 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043D\u0443\u0436\u0435\u043D id \u0438\u0437 \u0431\u0443\u043A\u0432, \u0446\u0438\u0444\u0440, _ \u0438 -");
    if (ids.has(m.id)) throw new Error(`wa-series: id \xAB${m.id}\xBB \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442\u0441\u044F`);
    ids.add(m.id);
    try {
      parseHHMM(String(m.at));
    } catch {
      throw new Error(`wa-series: \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 ${m.id}: at \u0432\u0438\u0434\u0430 HH:MM`);
    }
    if (typeof m.text !== "string" || !m.text.trim()) throw new Error(`wa-series: \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 ${m.id}: \u043D\u0443\u0436\u0435\u043D \u0442\u0435\u043A\u0441\u0442`);
    if (m.media !== void 0) {
      if (!isObj2(m.media) || m.media.type !== "image" && m.media.type !== "video" || typeof m.media.url !== "string" || !/^https:\/\//.test(m.media.url)) {
        throw new Error(`wa-series: \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 ${m.id}: media { type: image|video, url: https://... }`);
      }
    }
    if (m.poll !== void 0) {
      const p = m.poll;
      if (!isObj2(p) || typeof p.name !== "string" || !p.name || !Array.isArray(p.options) || p.options.length < 2 || p.options.length > 10 || new Set(p.options).size !== p.options.length) {
        throw new Error(`wa-series: \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 ${m.id}: poll { name, options: 2..10 \u0440\u0430\u0437\u043D\u044B\u0445 }`);
      }
    }
  }
  return raw;
}
var TEMPLATE_URL = "https://onai.academy/workshop-montazh/wa";
var EVENT_CREATE_AT = "10:00";
var freshEvent = () => ({ date: "", start: "", recruitFrom: "" });
var freshState = () => ({
  v: 1,
  targets: [],
  paused: false,
  pausedAt: 0,
  pausedReason: "",
  failStreak: 0,
  retryAt: 0,
  creations: [],
  pendingCreate: null,
  lastConnAlertAt: 0,
  lastQrAt: 0,
  capAlertDay: "",
  ownerJid: "",
  ownerAt: 0,
  connSince: 0,
  mode: "daily",
  daily: { enabled: false },
  event: freshEvent(),
  assistant: { enabled: false, hookOn: false, secret: "" },
  dozhim: freshDz()
});
var defaultDeps2 = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  rand: () => Math.random(),
  notify: (text2) => notifyOwners(text2)
};
var rt = null;
var initError = "";
var fJournal = (r) => (0, import_node_path10.join)(r.dir, "wa-journal.jsonl");
var fJoins = (r) => (0, import_node_path10.join)(r.dir, "wa-joins.jsonl");
var fState = (r) => (0, import_node_path10.join)(r.dir, "wa-state.json");
var fLock = (r) => (0, import_node_path10.join)(r.dir, "wa.lock");
var iso = (ms) => new Date(ms).toISOString();
var need = () => {
  if (!rt) throw new Error("wa-groups \u043D\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
  return rt;
};
function append2(file, row) {
  try {
    (0, import_node_fs10.appendFileSync)(file, JSON.stringify(row) + "\n", "utf8");
  } catch (e) {
    console.error("[wa] \u043D\u0435 \u0441\u043C\u043E\u0433 \u0434\u043E\u043F\u0438\u0441\u0430\u0442\u044C %s:", file, e.message);
  }
}
function readJsonl2(file) {
  if (!(0, import_node_fs10.existsSync)(file)) return [];
  const out = [];
  for (const line of (0, import_node_fs10.readFileSync)(file, "utf8").split("\n")) {
    const s = line.trim();
    if (!s) continue;
    try {
      out.push(JSON.parse(s));
    } catch {
    }
  }
  return out;
}
function save(r) {
  try {
    const tmp = `${fState(r)}.tmp.${process.pid}`;
    (0, import_node_fs10.writeFileSync)(tmp, JSON.stringify(r.state, null, 2) + "\n", "utf8");
    (0, import_node_fs10.renameSync)(tmp, fState(r));
  } catch (e) {
    console.error("[wa] \u043D\u0435 \u0441\u043C\u043E\u0433 \u0437\u0430\u043F\u0438\u0441\u0430\u0442\u044C wa-state.json:", e.message);
  }
}
function loadState(r) {
  const st = freshState();
  try {
    if (!(0, import_node_fs10.existsSync)(fState(r))) return st;
    const raw = JSON.parse((0, import_node_fs10.readFileSync)(fState(r), "utf8"));
    const num = (x) => typeof x === "number" && Number.isFinite(x) ? x : 0;
    const str = (x) => typeof x === "string" ? x : "";
    st.targets = Array.isArray(raw.targets) ? raw.targets.filter((t) => t && typeof t.id === "string" && typeof t.jid === "string").map((t) => ({ ...t, done: t.done || {}, tries: t.tries || {} })) : [];
    st.paused = raw.paused === true;
    st.pausedAt = num(raw.pausedAt);
    st.pausedReason = str(raw.pausedReason);
    st.failStreak = num(raw.failStreak);
    st.retryAt = num(raw.retryAt);
    st.creations = Array.isArray(raw.creations) ? raw.creations.filter((x) => typeof x === "number") : [];
    st.pendingCreate = raw.pendingCreate && typeof raw.pendingCreate.day === "string" ? raw.pendingCreate : null;
    st.lastConnAlertAt = num(raw.lastConnAlertAt);
    st.lastQrAt = num(raw.lastQrAt);
    st.capAlertDay = str(raw.capAlertDay);
    st.ownerJid = str(raw.ownerJid);
    st.ownerAt = num(raw.ownerAt);
    st.connSince = num(raw.connSince);
    st.mode = raw.mode === "event" ? "event" : "daily";
    st.daily = { enabled: raw.daily?.enabled === true };
    const ev = raw.event;
    if (ev && typeof ev === "object") {
      const day = (x) => isDayKey(x) ? x : "";
      st.event = {
        date: day(ev.date),
        start: typeof ev.start === "string" && /^\d{1,2}:\d{2}$/.test(ev.start) ? ev.start : "",
        recruitFrom: day(ev.recruitFrom),
        ...typeof ev.communityId === "string" && ev.communityId ? { communityId: ev.communityId } : {},
        ...ev.done === true ? { done: true, doneAt: num(ev.doneAt) } : {}
      };
    }
    if (st.mode === "event") st.daily.enabled = false;
    const as = raw.assistant;
    if (as && typeof as === "object") st.assistant = { enabled: as.enabled === true, hookOn: as.hookOn === true, secret: typeof as.secret === "string" ? as.secret : "" };
    st.dozhim = normalizeDz(raw.dozhim);
  } catch {
    console.warn("[wa] wa-state.json \u043D\u0435\u0447\u0438\u0442\u0430\u0435\u043C, \u043D\u0430\u0447\u0438\u043D\u0430\u044E \u0441 \u043F\u0443\u0441\u0442\u043E\u0433\u043E \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F");
  }
  return st;
}
function seriesPath2(explicit) {
  return explicit || env7("WA_SERIES_FILE") || (0, import_node_path10.join)(__dirname, "wa-series.json");
}
function initWaGroups(opts = {}) {
  const cfg = validateWaSeries(JSON.parse((0, import_node_fs10.readFileSync)(seriesPath2(opts.seriesFile), "utf8")));
  const kindEnv = env7("WA_TARGET").toLowerCase();
  if (kindEnv === "group" || kindEnv === "community") cfg.target = kindEnv;
  if (opts.kind) cfg.target = opts.kind;
  const dir = opts.dir || env7("DATA_DIR") || (0, import_node_path10.join)(__dirname, "data");
  (0, import_node_fs10.mkdirSync)(dir, { recursive: true });
  const r = {
    cfg,
    state: freshState(),
    dir,
    deps: { ...defaultDeps2, ...opts.deps || {} },
    timeOverride: opts.timeCfg,
    sent: /* @__PURE__ */ new Set(),
    unknown: /* @__PURE__ */ new Set(),
    approvedSince: /* @__PURE__ */ new Map(),
    nightSkipped: /* @__PURE__ */ new Set(),
    downSince: 0,
    seenReq: /* @__PURE__ */ new Set(),
    approved: /* @__PURE__ */ new Set(),
    approveFails: /* @__PURE__ */ new Map(),
    joinedCount: /* @__PURE__ */ new Map(),
    joinNextAt: /* @__PURE__ */ new Map(),
    lastServedAt: 0,
    lastRequestsAt: 0,
    joinFailStreak: 0,
    joinAlertAt: 0,
    conn: { state: "unknown", at: 0 },
    chain: Promise.resolve(),
    ticking: false,
    joining: false,
    mediaWarned: /* @__PURE__ */ new Set(),
    lockedOutLogged: false,
    joinedByDay: /* @__PURE__ */ new Map(),
    profileName: "",
    qrCache: null,
    qrJournalAt: 0,
    groupsCache: null,
    groupsCallAt: 0,
    statusCache: null,
    pairCache: null
  };
  r.state = loadState(r);
  if (!r.state.event.start) r.state.event.start = cfg.streamStart;
  for (const row of readJsonl2(fJournal(r))) {
    if (row?.ev !== "send" || !row.msg || !row.day || !row.target) continue;
    const key = sentKey(row.msg, row.part || "main", row.day, row.target);
    if (row.ok) {
      r.sent.add(key);
      r.unknown.delete(key);
    } else if (row.unknown === true) {
      r.sent.add(key);
      r.unknown.add(key);
    }
  }
  for (const row of readJsonl2(fJoins(r))) {
    if (!row?.community || !row.jid) continue;
    const k = `${row.community}|${row.jid}`;
    if (row.ev === "request") r.seenReq.add(k);
    if (row.ev === "approve" && row.ok) {
      r.approved.add(k);
      if (row.target) {
        r.joinedCount.set(row.target, (r.joinedCount.get(row.target) || 0) + 1);
        const ms = Date.parse(String(row.ts || ""));
        if (Number.isFinite(ms)) {
          noteJoinedDay(r, row.target, dayKeyOf(ms));
          const t = r.state.targets.find((x) => x.id === row.target);
          if (t?.membersAt && ms > t.membersAt) r.approvedSince.set(t.id, (r.approvedSince.get(t.id) || 0) + 1);
        }
      }
    }
  }
  rt = r;
  initError = "";
  aiInit(aiHostOf(r));
  dzInit(dzHostOf(r));
}
function aiHostOf(r) {
  return {
    dir: r.dir,
    now: () => r.deps.now(),
    rand: () => r.deps.rand(),
    alarm: (text2) => alarm(r, text2),
    notify: (text2) => r.deps.notify(text2),
    journal: (row) => journal(r, row),
    exclusive: (fn) => exclusive(r, fn),
    canSend: () => r.state.paused ? { ok: false, why: "\u043C\u043E\u0434\u0443\u043B\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435" } : r.conn.state !== "open" ? { ok: false, why: `\u043D\u043E\u043C\u0435\u0440 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D (${r.conn.state})` } : r.lockedOutLogged ? { ok: false, why: "\u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u0435\u0440\u0436\u0438\u0442 \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0446\u0435\u0441\u0441" } : { ok: true },
    state: () => r.state.assistant,
    patch: (p) => {
      Object.assign(r.state.assistant, p);
      save(r);
    },
    ignoreDigits: () => [...adminNumbers(), digitsOf2(r.state.ownerJid)].filter(Boolean)
  };
}
function dzHostOf(r) {
  const dayOf = (ts) => {
    const ev = r.state.event;
    if (r.state.mode === "event" && ev.date && !ev.done && ev.recruitFrom && ts >= atTime(ev.recruitFrom, "00:00")) return ev.date;
    return assignStreamDay(ts, tcfg(r));
  };
  return {
    dir: r.dir,
    now: () => r.deps.now(),
    rand: () => r.deps.rand(),
    sleep: (ms) => r.deps.sleep(ms),
    alarm: (text2) => alarm(r, text2),
    notify: (text2) => r.deps.notify(text2),
    journal: (row) => journal(r, row),
    exclusive: (fn) => exclusive(r, fn),
    state: () => r.state.dozhim,
    patch: (p) => {
      Object.assign(r.state.dozhim, p);
      save(r);
    },
    canRun: () => r.state.paused ? { ok: false, why: "\u043C\u043E\u0434\u0443\u043B\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435" } : r.conn.state !== "open" ? { ok: false, why: `\u043D\u043E\u043C\u0435\u0440 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D (${r.conn.state})` } : r.lockedOutLogged ? { ok: false, why: "\u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u0435\u0440\u0436\u0438\u0442 \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0446\u0435\u0441\u0441" } : { ok: true },
    timeCfg: () => tcfg(r),
    dayOf,
    targets: (now) => {
      const c = tcfg(r);
      const ev = r.state.event;
      let days;
      if (r.state.mode === "event") days = new Set(ev.date && !ev.done ? [ev.date] : []);
      else {
        const cur = assignStreamDay(now, c);
        days = /* @__PURE__ */ new Set([dayKeyOf(now), cur, nextStreamAfter(r, cur)]);
      }
      return r.state.targets.filter((t) => days.has(t.day) && (r.state.mode === "event" ? t.source === "event" : t.source !== "event") && !!t.sendJid && now < closeAtOf(r, t.day)).map((t) => ({ id: t.id, day: t.day, sendJid: t.sendJid }));
    },
    noteMembers: (id, count, at) => {
      const t = r.state.targets.find((x) => x.id === id);
      if (!t) return;
      t.members = count;
      t.membersAt = at;
      r.approvedSince.set(id, 0);
      save(r);
    },
    linkFor: (day, now) => linkForDay(r, day, now),
    leads: () => {
      try {
        const x = readLeads({ store: getStore(), cfg: tcfg(r), now: r.deps.now() });
        return { leads: x.leads, error: x.error };
      } catch {
        return { leads: null, error: "\u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 \u0431\u043E\u0442\u0430 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u043E" };
      }
    },
    linkedEids: () => {
      const out = /* @__PURE__ */ new Set();
      try {
        for (const sub of getStore().subs.values()) {
          const o = classifyPayload(sub.payload);
          if (o.eid) out.add(o.eid);
        }
      } catch {
      }
      return out;
    },
    waUrl: TEMPLATE_URL
  };
}
function startWaGroups(opts = {}) {
  if (!waEnabled()) return () => {
  };
  if (!evoKey()) {
    initError = "\u043D\u0435\u0442 EVOLUTION_API_KEY";
    console.error("[wa] WA_GROUPS=on, \u043D\u043E \u043D\u0435\u0442 EVOLUTION_API_KEY: \u043C\u043E\u0434\u0443\u043B\u044C \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D");
    return () => {
    };
  }
  try {
    initWaGroups(opts);
  } catch (e) {
    initError = e.message;
    console.error("[wa] \u043C\u043E\u0434\u0443\u043B\u044C \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D: %s", initError);
    return () => {
    };
  }
  const r = need();
  registerWa((cmd, args, now) => waCommand(cmd, args, now));
  registerWaReport((day) => waReportLine(day));
  const main = setInterval(() => void waTick(), TICK_MS2);
  const joins = setInterval(() => void joinsTick(), JOINS_TICK_MS);
  const dozhim = setInterval(() => void dzTick(), TICK_MS2);
  const first = setTimeout(() => void waTick(), 5e3);
  const onExit = () => releaseLock2(r);
  process.on("exit", onExit);
  console.log(
    "[wa] \u0437\u0430\u043F\u0443\u0449\u0435\u043D: \u0442\u0438\u043F %s, \u0440\u0435\u0436\u0438\u043C %s%s, \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435 %s, \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 %d, \u0442\u0438\u043A %d \u0441",
    r.cfg.target,
    r.state.mode === "event" ? "\u0436\u0438\u0432\u043E\u0439 \u044D\u0444\u0438\u0440" : "\u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0439",
    r.state.mode === "daily" ? r.state.daily.enabled ? " (\u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0432\u043A\u043B)" : " (\u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0432\u044B\u043A\u043B)" : "",
    r.cfg.version,
    r.cfg.messages.length,
    TICK_MS2 / 1e3
  );
  return () => {
    clearInterval(main);
    clearInterval(joins);
    clearInterval(dozhim);
    clearTimeout(first);
    process.off("exit", onExit);
    registerWa(null);
    registerWaReport(null);
    releaseLock2(r);
  };
}
function waHealth() {
  if (!waEnabled()) return { enabled: false };
  if (!rt) return { enabled: true, running: false, ...initError ? { error: "init" } : {} };
  return {
    enabled: true,
    running: true,
    paused: rt.state.paused,
    connection: rt.conn.state,
    targets: rt.state.targets.length,
    failStreak: rt.state.failStreak
  };
}
function tcfg(r) {
  if (r.timeOverride) return r.timeOverride;
  try {
    return timeCfg(getSeries());
  } catch {
    return {
      streamStart: r.cfg.streamStart,
      streamMinutes: r.cfg.streamMinutes,
      joinLiveMinutes: r.cfg.joinLiveMinutes ?? DEFAULT_JOIN_MINUTES,
      firstDay: r.cfg.firstDay,
      skipDays: r.cfg.skipDays
    };
  }
}
var closeAtOf = (r, day) => atTime(addDays(day, 1), r.cfg.closeAt);
function createAtOf(r, day) {
  const c = tcfg(r);
  let p = addDays(day, -1);
  for (let i = 0; i < 30; i++) {
    if (isStreamDay(p, c)) return atTime(p, c.streamStart);
    p = addDays(p, -1);
  }
  return atTime(addDays(day, -1), c.streamStart);
}
var ddmm4 = (day) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;
var nameOf = (r, day, seq) => r.cfg.name.replace("{date}", ddmm4(day)) + (seq > 1 ? ` (${seq})` : "");
var pad2 = (n) => String(n).padStart(2, "0");
var minsOf2 = (hhmm) => {
  const p = parseHHMM(hhmm);
  return p.h * 60 + p.m;
};
var hhmmFrom = (mins) => {
  const m = (mins % 1440 + 1440) % 1440;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
};
var normHHMM = (s) => hhmmFrom(minsOf2(s));
var startShift = (r, start) => start ? minsOf2(start) - minsOf2(r.cfg.streamStart) : 0;
var followsStart = (r, m) => minsOf2(m.at) <= minsOf2(r.cfg.streamStart) + r.cfg.streamMinutes;
var AFTER_OFFER = /* @__PURE__ */ new Set(["push", "last-call"]);
var OFFER_ID = "offer";
function shiftedPlan(r, t, m) {
  const base = atTime(t.day, m.at);
  const d = startShift(r, t.start);
  return d && followsStart(r, m) ? base + d * MIN3 : base;
}
function planOf(r, t, m) {
  const own = shiftedPlan(r, t, m);
  if (!AFTER_OFFER.has(m.id)) return own;
  const offer = r.cfg.messages.find((x) => x.id === OFFER_ID);
  return offer ? Math.max(own, shiftedPlan(r, t, offer)) : own;
}
var SEND_FROM = 9 * 60;
var SEND_TO = 23 * 60 + 45;
var DAY_FROM = 9 * 60;
var DAY_TO = 23 * 60;
var minuteOfDay2 = (ms) => minsOf2(hhmmOf(ms));
var sendableTime = (ms) => minuteOfDay2(ms) >= SEND_FROM && minuteOfDay2(ms) <= SEND_TO;
var daytime = (ms) => minuteOfDay2(ms) >= DAY_FROM && minuteOfDay2(ms) < DAY_TO;
function daytimeMs(from, to) {
  if (to <= from) return 0;
  let total = 0;
  let day = dayKeyOf(from);
  const last = dayKeyOf(to);
  for (let i = 0; i < 400 && day <= last; i++, day = addDays(day, 1)) {
    const a = Math.max(from, atTime(day, hhmmFrom(DAY_FROM)));
    const b = Math.min(to, atTime(day, hhmmFrom(DAY_TO)));
    if (b > a) total += b - a;
  }
  return total;
}
function retime(r, start, text2) {
  if (!start || start === r.cfg.streamStart) return text2;
  const base = r.cfg.streamStart;
  const baseMsk = hhmmFrom(minsOf2(base) - 120);
  const msk = hhmmFrom(minsOf2(start) - 120);
  return text2.split(`${baseMsk} \u043F\u043E \u041C\u043E\u0441\u043A\u0432\u0435`).join(`${msk} \u043F\u043E \u041C\u043E\u0441\u043A\u0432\u0435`).split(base).join(start);
}
function effMsg(r, t, m) {
  if (!t.start || t.start === r.cfg.streamStart) return m;
  return { ...m, text: retime(r, t.start, m.text), ...m.poll ? { poll: { ...m.poll, name: retime(r, t.start, m.poll.name) } } : {} };
}
var isReady = (t) => t.kind === "community" ? !!(t.done.announce && t.done.addMode && t.done.approval && t.done.link) : !!(t.done.announce && t.done.link);
var targetsOf = (r, day) => r.state.targets.filter((t) => t.day === day).sort((a, b) => b.seq - a.seq);
function servingTarget(r, now) {
  if (r.state.mode === "event") {
    const ev = r.state.event;
    if (!ev.date || ev.done) return null;
    return targetsOf(r, ev.date).find((t) => isReady(t) && t.link && now < closeAtOf(r, t.day)) ?? null;
  }
  const day = assignStreamDay(now, tcfg(r));
  return targetsOf(r, day).find((t) => t.source !== "event" && isReady(t) && t.link && now < closeAtOf(r, t.day)) ?? null;
}
function waGroupLink(now, served = true) {
  try {
    if (!rt) return null;
    if (now === void 0) now = rt.deps.now();
    const t = servingTarget(rt, now);
    if (!t || !isValidWhatsAppLink(t.link)) return null;
    if (served) {
      rt.lastServedAt = now;
      const soon = now + 15e3;
      const cur = rt.joinNextAt.get(t.id);
      if (cur !== void 0 && cur > soon) rt.joinNextAt.set(t.id, soon);
    }
    return t.link;
  } catch {
    return null;
  }
}
function linkForDay(r, day, now) {
  const ok = (t2) => isReady(t2) && !!t2.link && isValidWhatsAppLink(t2.link) && now < closeAtOf(r, t2.day);
  const list = targetsOf(r, day);
  const t = r.state.mode === "event" ? day === r.state.event.date ? list.find((x) => x.source === "event" && ok(x)) : void 0 : list.find((x) => x.source !== "event" && ok(x));
  return t ? t.link : null;
}
var between = (r, rg) => Math.round(rg[0] + r.deps.rand() * (rg[1] - rg[0]));
var pause = (r, rg) => r.deps.sleep(between(r, rg));
var sentKey = (msg, part, day, target) => `${msg}:${part}|${day}|${target}`;
function exclusive(r, fn) {
  const next = r.chain.then(fn, fn);
  r.chain = next.then(() => void 0, () => void 0);
  return next;
}
function journal(r, row) {
  append2(fJournal(r), { ts: iso(r.deps.now()), ...row });
}
async function alarm(r, text2) {
  journal(r, { ev: "alarm", text: text2 });
  console.warn("[wa] \u0442\u0440\u0435\u0432\u043E\u0433\u0430: %s", text2);
  try {
    await r.deps.notify(text2);
  } catch {
  }
}
function pauseModule(r, now, reason, text2) {
  r.state.paused = true;
  r.state.pausedAt = now;
  r.state.pausedReason = reason.slice(0, 200);
  save(r);
  journal(r, { ev: "pause", reason: r.state.pausedReason });
  return alarm(r, text2);
}
function setConn(r, st, now) {
  const prev = r.conn.state;
  r.conn = { state: st, at: now };
  if (st === "open") {
    r.pairCache = null;
    if (!r.state.connSince || prev === "close" || prev === "connecting" || prev === "absent") {
      r.state.connSince = now;
      save(r);
    }
  } else if (st !== "unreachable" && r.state.connSince) {
    r.state.connSince = 0;
    save(r);
  }
}
function noteOk(r) {
  if (r.state.failStreak || r.state.retryAt) {
    r.state.failStreak = 0;
    r.state.retryAt = 0;
    save(r);
  }
}
async function noteFail(r, what, err) {
  const now = r.deps.now();
  r.state.failStreak++;
  console.warn("[wa] \u043E\u0448\u0438\u0431\u043A\u0430 %d \u043F\u043E\u0434\u0440\u044F\u0434: %s: %s", r.state.failStreak, what, err);
  journal(r, { ev: "fail", n: r.state.failStreak, what, err });
  if (r.state.failStreak >= r.cfg.retry.pauseAfter) {
    await pauseModule(r, now, `${what}: ${err}`, `WhatsApp-\u043C\u043E\u0434\u0443\u043B\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435: ${r.state.failStreak} \u043E\u0448\u0438\u0431\u043A\u0438 \u043F\u043E\u0434\u0440\u044F\u0434. \u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F: ${what}: ${err}. \u041F\u0440\u043E\u0432\u0435\u0440\u044C /wa, \u043F\u043E\u0442\u043E\u043C /wa_resume.`);
    return;
  }
  const b = r.cfg.retry.backoffSec;
  r.state.retryAt = now + b[Math.min(r.state.failStreak - 1, b.length - 1)] * 1e3;
  save(r);
}
var ambiguous = (f) => !f.connectFail && (f.status === 0 || f.status >= 500);
function pidAlive2(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
}
function holdLock2(r) {
  const f = fLock(r);
  try {
    if ((0, import_node_fs10.existsSync)(f)) {
      const cur = JSON.parse((0, import_node_fs10.readFileSync)(f, "utf8"));
      if (cur.pid && cur.pid !== process.pid && Date.now() - (cur.ts || 0) < LOCK_STALE_MS2 && pidAlive2(cur.pid)) {
        if (!r.lockedOutLogged) console.warn("[wa] \u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u0435\u0440\u0436\u0438\u0442 \u0434\u0440\u0443\u0433\u043E\u0439 \u043F\u0440\u043E\u0446\u0435\u0441\u0441 (pid %d), \u044D\u0442\u043E\u0442 \u043D\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442", cur.pid);
        r.lockedOutLogged = true;
        return false;
      }
    }
    r.lockedOutLogged = false;
    (0, import_node_fs10.writeFileSync)(f, JSON.stringify({ pid: process.pid, ts: Date.now() }), "utf8");
    return true;
  } catch (e) {
    console.error("[wa] \u0437\u0430\u043C\u043E\u043A \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D:", e.message);
    return true;
  }
}
function releaseLock2(r) {
  try {
    const f = fLock(r);
    if ((0, import_node_fs10.existsSync)(f) && JSON.parse((0, import_node_fs10.readFileSync)(f, "utf8")).pid === process.pid) (0, import_node_fs10.unlinkSync)(f);
  } catch {
  }
}
async function checkConnection(r, now) {
  const c = await connectionState();
  const st = c.ok ? c.data.state : "unreachable";
  const prev = r.conn.state;
  setConn(r, st, now);
  if (st !== prev && (prev !== "unknown" || st !== "open")) journal(r, { ev: "conn", state: st, prev });
  if (st === "open") r.downSince = 0;
  else if (!r.downSince) r.downSince = now;
  if (st === "open") {
    if (!r.state.ownerJid || now - r.state.ownerAt > HOUR3) {
      const i = await fetchInstance();
      if (i.ok && i.data.ownerJid) {
        r.state.ownerJid = i.data.ownerJid;
        r.state.ownerAt = now;
        r.profileName = i.data.profileName;
        save(r);
      }
    }
    return true;
  }
  if (daytime(now) && now - r.state.lastConnAlertAt >= r.cfg.alarms.connectionEveryMinutes * MIN3) {
    r.state.lastConnAlertAt = now;
    save(r);
    const since = r.downSince && now - r.downSince >= 30 * MIN3 ? ` \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043D\u0435\u0442 \u0441 ${when(r.downSince)}.` : "";
    await alarm(r, `WhatsApp \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D (\u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435: ${st}).${since} \u0420\u0430\u0441\u0441\u044B\u043B\u043A\u0430, \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432 \u0438 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0435 \u0437\u0430\u044F\u0432\u043E\u043A \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B. /wa_qr \u043F\u0440\u0438\u0448\u043B\u0451\u0442 QR \u0434\u043B\u044F \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F.`);
  }
  return false;
}
var dayCreations = (r, now) => r.state.creations.filter((t) => now - t < 24 * HOUR3).length;
var capReached = (r, now) => dayCreations(r, now) >= r.cfg.maxNewPerDay;
function noteCreation(r, now) {
  r.state.creations = [...r.state.creations.filter((t) => now - t < 48 * HOUR3), now];
}
var createWindowOpen = (r, at, now) => now >= at && daytimeMs(at, now) < r.cfg.createCatchupHours * HOUR3;
function dueCreateDays(r, now) {
  const out = [];
  if (!daytime(now)) return out;
  const c = tcfg(r);
  const today = dayKeyOf(now);
  for (let i = 0; i < 14; i++) {
    const day = addDays(today, i);
    if (!isStreamDay(day, c) || r.state.targets.some((t) => t.day === day)) continue;
    if (createWindowOpen(r, createAtOf(r, day), now) && now < closeAtOf(r, day)) out.push(day);
  }
  return out;
}
var eventCreateAt = (r) => atTime(r.state.event.recruitFrom, EVENT_CREATE_AT);
var eventTarget = (r) => r.state.event.date ? targetsOf(r, r.state.event.date)[0] ?? null : null;
function eventDue(r, now) {
  const ev = r.state.event;
  if (r.state.mode !== "event" || ev.done || !ev.date || !ev.recruitFrom) return false;
  if (eventTarget(r)) return false;
  return now >= eventCreateAt(r) && now < closeAtOf(r, ev.date) && daytime(now);
}
function dueCreates(r, now) {
  if (r.state.mode === "event") return eventDue(r, now) ? [r.state.event.date] : [];
  return r.state.daily.enabled ? dueCreateDays(r, now) : [];
}
function finishEventIfOver(r, now) {
  const ev = r.state.event;
  if (r.state.mode !== "event" || ev.done || !ev.date || now < closeAtOf(r, ev.date)) return false;
  ev.done = true;
  ev.doneAt = now;
  r.state.mode = "daily";
  r.state.daily.enabled = false;
  save(r);
  journal(r, { ev: "event_done", date: ev.date, target: ev.communityId || "" });
  console.log("[wa] \u0436\u0438\u0432\u043E\u0439 \u044D\u0444\u0438\u0440 %s \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D, \u0440\u0435\u0436\u0438\u043C \u0432\u0435\u0440\u043D\u0443\u043B\u0441\u044F \u043D\u0430 \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0439 (\u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E)", ev.date);
  return true;
}
function syncEventCommunity(r) {
  const ev = r.state.event;
  if (r.state.mode !== "event" || !ev.date || ev.done) return;
  const t = eventTarget(r);
  if (t && ev.communityId !== t.id) {
    ev.communityId = t.id;
    save(r);
  }
}
async function createTarget(r, day, seq, now, opts = {}) {
  const kind = r.cfg.target;
  const name = nameOf(r, day, seq);
  const description = retime(r, opts.start, r.cfg.description);
  let created;
  if (r.state.targets.some((x) => x.id === `${day}#${seq}`)) return { ok: false, error: "\u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0443\u0436\u0435 \u0435\u0441\u0442\u044C" };
  if (kind === "group" && !adminNumbers().length) {
    await noteFail(r, `\u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 ${name}`, "\u0434\u043B\u044F \u043E\u0431\u044B\u0447\u043D\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u044B \u043D\u0443\u0436\u0435\u043D \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u0438\u043D \u043D\u043E\u043C\u0435\u0440 \u0432 WA_ADMIN_NUMBERS");
    return { ok: false, error: "\u043D\u0435\u0442 WA_ADMIN_NUMBERS" };
  }
  r.state.pendingCreate = { day, seq, kind, at: now };
  save(r);
  const res = kind === "community" ? await communityCreate({ subject: name, description, approvalRequired: true }) : await groupCreate({ subject: name, description, participants: adminNumbers() });
  if (!res.ok) {
    if (ambiguous(res)) {
      noteCreation(r, now);
      await pauseModule(
        r,
        now,
        `\u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 ${name}: ${res.error}`,
        `WhatsApp-\u043C\u043E\u0434\u0443\u043B\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435: \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \xAB${name}\xBB \u043D\u0435 \u043F\u0440\u0438\u0448\u0451\u043B \u0447\u0451\u0442\u043A\u0438\u0439 \u043E\u0442\u0432\u0435\u0442 (${res.error}). \u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043E\u043D\u043E \u0443\u0436\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u043E: \u043F\u0440\u043E\u0432\u0435\u0440\u044C \u0441\u043F\u0438\u0441\u043E\u043A \u0447\u0430\u0442\u043E\u0432 \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435. \u0415\u0441\u043B\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u043E, \u0443\u0434\u0430\u043B\u0438 \u043B\u0438\u0448\u043D\u0435\u0435; \u043F\u043E\u0442\u043E\u043C /wa_resume, \u0430 /wa_new \u0441\u043E\u0437\u0434\u0430\u0441\u0442 \u0437\u0430\u043D\u043E\u0432\u043E.`
      );
      return { ok: false, error: res.error };
    }
    r.state.pendingCreate = null;
    save(r);
    await noteFail(r, `\u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 ${name}`, res.error);
    return { ok: false, error: res.error };
  }
  created = kind === "community" ? { jid: res.data.communityJid, sendJid: res.data.announcementJid } : { jid: res.data.groupJid, sendJid: res.data.groupJid };
  const t = {
    id: `${day}#${seq}`,
    day,
    seq,
    kind,
    jid: created.jid,
    sendJid: created.sendJid,
    name,
    createdAt: now,
    link: "",
    // У обычной группы нет режима «по заявке» и «админы добавляют»: эти шаги считаются сделанными.
    done: kind === "group" ? { addMode: true, approval: true } : {},
    tries: {},
    avatarAt: 0,
    ...opts.source === "event" ? { source: "event" } : {},
    ...opts.start && opts.start !== r.cfg.streamStart ? { start: opts.start } : {}
  };
  r.state.targets.push(t);
  r.state.pendingCreate = null;
  noteCreation(r, now);
  save(r);
  journal(r, { ev: "create", target: t.id, day, kind, jid: t.jid, sendJid: t.sendJid, name, ...t.source ? { source: t.source } : {} });
  console.log("[wa] \u0441\u043E\u0437\u0434\u0430\u043D\u043E %s %s (%s)", kind === "community" ? "\u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E" : "\u0433\u0440\u0443\u043F\u043F\u0430", t.id, name);
  noteOk(r);
  return { ok: true, target: t };
}
var welcomeText = (r, t, now) => retime(r, t.start, r.cfg.welcome.replace("{dayWordLower}", dayWordLower(t.day, now)).replace("{date}", ddmm4(t.day)));
async function setupSteps(r, t) {
  const order = t.kind === "community" ? ["announce", "addMode", "approval", "link", "avatar", "welcome"] : ["announce", "link", "avatar", "welcome"];
  let first = true;
  for (const s of order) {
    if (t.done[s]) continue;
    const now = r.deps.now();
    if (r.state.paused || now < r.state.retryAt) return false;
    if (now >= closeAtOf(r, t.day)) return true;
    if (s === "avatar" && ((t.tries.avatar || 0) >= 3 || now - t.avatarAt < 5 * MIN3)) continue;
    if (s === "welcome" && ((t.tries.welcome || 0) >= 3 || !isReady(t) || !daytime(now))) continue;
    if (!first) await pause(r, r.cfg.pacing.betweenStepsMs);
    first = false;
    t.tries[s] = (t.tries[s] || 0) + 1;
    let err = "";
    if (s === "announce") {
      const x = t.kind === "community" ? await communitySetting(t.jid, "announcement") : await groupSetting(t.jid, "announcement");
      err = x.ok ? "" : x.error;
    } else if (s === "addMode") {
      const x = await communityMemberAddMode(t.jid, "admin_add");
      err = x.ok ? "" : x.error;
    } else if (s === "approval") {
      const x = await communityJoinApproval(t.jid, "on");
      err = x.ok ? "" : x.error;
    } else if (s === "link") {
      const x = t.kind === "community" ? await communityInvite(t.jid) : await groupInvite(t.jid);
      if (!x.ok) err = x.error;
      else if (!isValidWhatsAppLink(x.data.inviteUrl)) err = "\u0441\u0441\u044B\u043B\u043A\u0430-\u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435 \u043D\u0435 \u043F\u043E\u0445\u043E\u0436\u0430 \u043D\u0430 chat.whatsapp.com";
      else t.link = x.data.inviteUrl;
    } else if (s === "avatar") {
      t.avatarAt = now;
      for (const url of r.cfg.avatar) {
        const x = await updatePicture(t.jid, url);
        if (x.ok) {
          err = "";
          break;
        }
        err = x.error;
      }
    } else if (s === "welcome") {
      const x = await sendPart(r, t, "welcome", "main", () => sendText2(t.sendJid, welcomeText(r, t, now)), false);
      err = x.ok ? "" : x.error;
    }
    if (!err) {
      t.done[s] = true;
      save(r);
      journal(r, { ev: "step", target: t.id, step: s });
      if (s !== "avatar") noteOk(r);
      continue;
    }
    save(r);
    if (s === "avatar") {
      console.warn("[wa] \u0430\u0432\u0430\u0442\u0430\u0440\u043A\u0430 %s \u043D\u0435 \u043F\u043E\u0441\u0442\u0430\u0432\u0438\u043B\u0430\u0441\u044C (%d \u0438\u0437 3): %s", t.id, t.tries.avatar, err);
      if ((t.tries.avatar || 0) >= 3) await alarm(r, `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0430\u0432\u0430\u0442\u0430\u0440\u043A\u0443 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0443 \xAB${t.name}\xBB: ${err}. \u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0431\u0435\u0437 \u043D\u0435\u0451. \u041F\u0440\u043E\u0432\u0435\u0440\u044C, \u0447\u0442\u043E wa-avatar.jpg \u0432\u044B\u043B\u043E\u0436\u0435\u043D \u043D\u0430 \u0441\u0430\u0439\u0442.`);
      continue;
    }
    await noteFail(r, `${t.id}: \u0448\u0430\u0433 ${s}`, err);
    return false;
  }
  return true;
}
function partsOf(r, m) {
  const parts = ["main"];
  if (m.media && m.text.length > r.cfg.captionLimit) parts.push("text");
  if (m.poll) parts.push("poll");
  return parts;
}
var isDone = (r, m, t, strict = false) => partsOf(r, m).every((p) => {
  const k = sentKey(m.id, p, t.day, t.id);
  return r.sent.has(k) && !(strict && r.unknown.has(k));
});
var unclearSend = (f) => ambiguous(f) && f.error !== "no_api_key";
async function sendPart(r, t, msgId, part, run, manual, extra = {}) {
  const key = sentKey(msgId, part, t.day, t.id);
  if (r.sent.has(key) && !(manual && r.unknown.has(key))) return { ok: true };
  const x = await run();
  const unknown = !x.ok && unclearSend(x);
  journal(r, {
    ev: "send",
    msg: msgId,
    part,
    day: t.day,
    target: t.id,
    jid: t.sendJid,
    ok: x.ok,
    ...x.ok ? { mid: x.data.messageId } : { err: x.error },
    ...unknown ? { unknown: true } : {},
    ...manual ? { manual: true } : {},
    ...extra
  });
  if (x.ok) {
    r.sent.add(key);
    r.unknown.delete(key);
    return { ok: true };
  }
  if (unknown) {
    r.sent.add(key);
    r.unknown.add(key);
    await alarm(
      r,
      msgId === "welcome" ? `\u041D\u0435 \u0443\u0432\u0435\u0440\u0435\u043D, \u0447\u0442\u043E \u043F\u0440\u0438\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435 \u0443\u0448\u043B\u043E \u0432 \xAB${t.name}\xBB. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0432 WhatsApp.` : `\u041D\u0435 \u0443\u0432\u0435\u0440\u0435\u043D, \u0447\u0442\u043E \u0443\u0448\u043B\u043E ${msgId} \u0432 \xAB${t.name}\xBB. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0432 WhatsApp, \u043F\u0440\u0438 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E\u0441\u0442\u0438 /wa_send ${msgId}`
    );
    return { ok: false, error: x.error, unknown: true };
  }
  return { ok: false, error: x.error };
}
async function sendMessageTo(r, t, base, manual) {
  const m = effMsg(r, t, base);
  let first = true;
  for (const part of partsOf(r, m)) {
    const key = sentKey(m.id, part, t.day, t.id);
    if (r.sent.has(key) && !(manual && r.unknown.has(key))) continue;
    if (!first) await pause(r, r.cfg.pacing.betweenStepsMs);
    first = false;
    let res;
    if (part === "poll") {
      const p = m.poll;
      res = await sendPart(r, t, m.id, part, () => sendPoll(t.sendJid, { name: p.name, values: p.options, selectableCount: p.selectableCount ?? 1 }), manual);
    } else if (part === "text") {
      res = await sendPart(r, t, m.id, part, () => sendText2(t.sendJid, m.text), manual);
    } else if (m.media) {
      const media = m.media;
      const caption = m.text.length <= r.cfg.captionLimit ? m.text : void 0;
      res = await sendPart(r, t, m.id, part, () => sendMedia2(t.sendJid, { mediatype: media.type, url: media.url, caption }), manual);
      if (!res.ok && !res.unknown) {
        console.warn("[wa] \u043C\u0435\u0434\u0438\u0430 %s \u043D\u0435 \u0443\u0448\u043B\u043E (%s), \u0448\u043B\u044E \u0442\u0435\u043A\u0441\u0442\u043E\u043C", media.url, res.error);
        if (!r.mediaWarned.has(media.url)) {
          r.mediaWarned.add(media.url);
          void alarm(r, `\u041D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u043B\u0430\u0441\u044C \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0430 \u0438\u043B\u0438 \u0432\u0438\u0434\u0435\u043E ${media.url}: ${res.error}. \u0428\u043B\u044E \u0442\u043E\u0442 \u0436\u0435 \u0442\u0435\u043A\u0441\u0442 \u0431\u0435\u0437 \u043D\u0435\u0451. \u041F\u0440\u043E\u0432\u0435\u0440\u044C, \u0447\u0442\u043E \u0444\u0430\u0439\u043B \u0432\u044B\u043B\u043E\u0436\u0435\u043D \u043D\u0430 \u0441\u0430\u0439\u0442.`);
        }
        const fb = await sendPart(r, t, m.id, part, () => sendText2(t.sendJid, m.text), manual, { fallback: "text" });
        if (fb.ok || fb.unknown) res = fb;
      }
    } else {
      res = await sendPart(r, t, m.id, part, () => sendText2(t.sendJid, m.text), manual);
    }
    if (!res.ok) {
      await noteFail(r, `\u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0430 \xAB${m.id}\xBB \u0432 ${t.id}`, res.error);
      return false;
    }
    noteOk(r);
  }
  return true;
}
function noteNightSkip(r, t, msg, plan) {
  const key = `${msg.id}|${t.day}|${t.id}`;
  if (r.nightSkipped.has(key)) return;
  r.nightSkipped.add(key);
  journal(r, { ev: "skip", msg: msg.id, day: t.day, target: t.id, reason: "night", plan: hhmmOf(plan) });
  console.warn("[wa] \xAB%s\xBB \u0432 %s \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E: \u043F\u043B\u0430\u043D\u043E\u0432\u043E\u0435 \u0432\u0440\u0435\u043C\u044F %s \u0432\u043D\u0435 \u043E\u043A\u043D\u0430 09:00 \u0434\u043E 23:45", msg.id, t.id, hhmmOf(plan));
}
function dueSends(r, now) {
  const out = [];
  for (const t of r.state.targets) {
    if (!isReady(t) || now >= closeAtOf(r, t.day)) continue;
    for (const msg of r.cfg.messages) {
      if (msg.enabled === false) continue;
      const plan = planOf(r, t, msg);
      if (now < plan || now > plan + r.cfg.graceMinutes * MIN3) continue;
      if (plan < t.createdAt) continue;
      if (isDone(r, msg, t)) continue;
      if (!sendableTime(plan)) {
        noteNightSkip(r, t, msg, plan);
        continue;
      }
      out.push({ t, msg, plan });
    }
  }
  return out.sort((a, b) => a.plan - b.plan || a.t.day.localeCompare(b.t.day) || a.t.seq - b.t.seq);
}
async function runSends(r, now) {
  let sent = 0;
  let first = true;
  for (const d of dueSends(r, now)) {
    if (r.state.paused || r.deps.now() < r.state.retryAt) break;
    if (!first) await pause(r, r.cfg.pacing.betweenSendsMs);
    first = false;
    if (!await sendMessageTo(r, d.t, d.msg, false)) break;
    sent++;
  }
  return sent;
}
function extractMembers(info, announcementJid) {
  const num = (x) => typeof x === "number" && Number.isFinite(x) ? x : typeof x === "string" && /^\d+$/.test(x) ? Number(x) : void 0;
  const found = [];
  const add = (x) => {
    const n = num(x);
    if (n !== void 0) found.push(n);
  };
  add(info?.size);
  add(info?.membersCount);
  add(info?.participantsCount);
  if (Array.isArray(info?.participants)) add(info.participants.length);
  for (const key of ["linkedGroups", "groups", "subGroups"]) {
    const list = info?.[key];
    if (!Array.isArray(list)) continue;
    for (const g of list) {
      if (g && (g.id === announcementJid || g.jid === announcementJid || g.isCommunityAnnounce === true)) {
        add(g.size);
        if (Array.isArray(g.participants)) add(g.participants.length);
      }
    }
  }
  return found.length ? Math.max(...found) : void 0;
}
async function refreshMembers(r, t, now) {
  if (t.membersAt && now - t.membersAt < r.cfg.memberCheckMinutes * MIN3) return false;
  const x = t.kind === "community" ? await communityInfo(t.jid) : await groupInfo(t.jid);
  t.membersAt = now;
  if (x.ok) {
    const n = extractMembers(x.data, t.sendJid);
    if (n !== void 0) {
      t.members = n;
      r.approvedSince.set(t.id, 0);
    }
  } else {
    console.warn("[wa] \u0447\u0438\u0441\u043B\u043E \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 %s \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E: %s", t.id, x.error);
  }
  save(r);
  return x.ok;
}
var heldMembers = (r, t) => (t.members ?? 0) + (r.approvedSince.get(t.id) || 0);
async function openNext(r, t, now, members) {
  if (r.state.paused || r.state.pendingCreate || r.deps.now() < r.state.retryAt) return;
  if (targetsOf(r, t.day)[0].id !== t.id || now >= closeAtOf(r, t.day)) return;
  const limit = r.cfg.overflowAt[t.kind];
  if (capReached(r, now)) {
    if (r.state.capAlertDay !== dayKeyOf(now)) {
      r.state.capAlertDay = dayKeyOf(now);
      save(r);
      await alarm(r, `\u0412 \xAB${t.name}\xBB \u0443\u0436\u0435 ${members} \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432, \u0430 \u043B\u0438\u043C\u0438\u0442 ${r.cfg.maxNewPerDay} \u043D\u043E\u0432\u044B\u0445 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432 \u0432 \u0441\u0443\u0442\u043A\u0438 \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D. \u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0435 \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u0442\u043E, \u0441\u0441\u044B\u043B\u043A\u0430 \u043F\u0440\u0435\u0436\u043D\u044F\u044F. \u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432\u0440\u0443\u0447\u043D\u0443\u044E: /wa_new.`);
    }
    return;
  }
  await pause(r, r.cfg.pacing.betweenStepsMs);
  const c = await createTarget(r, t.day, t.seq + 1, r.deps.now(), { source: t.source ?? "daily", start: t.start });
  if (!c.ok) return;
  await alarm(r, `\u0412 \xAB${t.name}\xBB ${members} \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u0438\u0437 ${limit}. \u041E\u0442\u043A\u0440\u044B\u0442\u043E \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0435: \xAB${c.target.name}\xBB, \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u0441\u044F \u043D\u0430 \u043D\u0435\u0433\u043E, \u043A\u0430\u043A \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u043D\u043E \u0431\u0443\u0434\u0435\u0442 \u0433\u043E\u0442\u043E\u0432\u043E.`);
  await pause(r, r.cfg.pacing.betweenStepsMs);
  await setupSteps(r, c.target);
}
async function runMemberChecks(r, now) {
  const t = servingTarget(r, now);
  if (!t || r.state.paused) return;
  await refreshMembers(r, t, now);
  if (t.members === void 0) return;
  const held = heldMembers(r, t);
  if (held < r.cfg.overflowAt[t.kind]) return;
  await openNext(r, t, now, held);
}
async function waTick() {
  const r = rt;
  if (!r) return { sent: 0, created: 0 };
  if (r.ticking) return { skipped: "busy", sent: 0, created: 0 };
  r.ticking = true;
  try {
    return await exclusive(r, async () => {
      const now = r.deps.now();
      if (!holdLock2(r)) return { skipped: "lock", sent: 0, created: 0 };
      try {
        await aiTick(now);
      } catch (e) {
        console.error("[wa] \u0432\u0435\u0431\u0445\u0443\u043A \u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442\u0430:", e?.message || e);
      }
      finishEventIfOver(r, now);
      syncEventCommunity(r);
      if (r.state.paused) return { skipped: "paused", sent: 0, created: 0 };
      if (!await checkConnection(r, now)) return { skipped: "no_connection", sent: 0, created: 0 };
      if (now < r.state.retryAt) return { skipped: "backoff", sent: 0, created: 0 };
      const sent = await runSends(r, now);
      let created = 0;
      for (const t of r.state.targets) {
        if (r.state.paused || r.deps.now() < r.state.retryAt) break;
        if (r.deps.now() >= closeAtOf(r, t.day)) continue;
        const incomplete = !isReady(t) || !t.done.welcome && (t.tries.welcome || 0) < 3 || !t.done.avatar && (t.tries.avatar || 0) < 3;
        if (incomplete) await setupSteps(r, t);
      }
      if (r.state.pendingCreate) return { sent, created, skipped: "paused" };
      for (const day of dueCreates(r, now)) {
        if (r.state.paused || r.deps.now() < r.state.retryAt) break;
        if (capReached(r, now)) {
          if (r.state.capAlertDay !== dayKeyOf(now)) {
            r.state.capAlertDay = dayKeyOf(now);
            save(r);
            await alarm(r, `\u041B\u0438\u043C\u0438\u0442 ${r.cfg.maxNewPerDay} \u043D\u043E\u0432\u044B\u0445 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432 \u0432 \u0441\u0443\u0442\u043A\u0438 \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D, \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u044D\u0444\u0438\u0440\u0430 ${ddmm4(day)} \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u043E. \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0432\u0440\u0443\u0447\u043D\u0443\u044E \u043F\u043E\u0437\u0436\u0435: /wa_new.`);
          }
          break;
        }
        const ev = r.state.mode === "event" ? r.state.event : null;
        const c = await createTarget(r, day, 1, r.deps.now(), ev ? { source: "event", start: ev.start } : {});
        if (!c.ok) break;
        created++;
        syncEventCommunity(r);
        await pause(r, r.cfg.pacing.betweenStepsMs);
        await setupSteps(r, c.target);
      }
      await runMemberChecks(r, now);
      return { sent, created };
    });
  } catch (e) {
    console.error("[wa] \u0442\u0438\u043A \u0443\u043F\u0430\u043B:", e?.stack || e);
    return { sent: 0, created: 0 };
  } finally {
    r.ticking = false;
  }
}
function normalizeRequests(data) {
  const list = Array.isArray(data) ? data : isObj2(data) ? data.requests ?? data.participants ?? data.list ?? [] : [];
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const x of list) {
    const raw = typeof x === "string" ? { jid: x } : isObj2(x) ? isObj2(x.attrs) ? x.attrs : x : null;
    if (!raw) continue;
    const jid = String(raw.jid ?? raw.id ?? raw.participant ?? "");
    if (jid) out.push({ jid, raw });
  }
  return out;
}
var phoneOf = (raw) => {
  for (const k of ["phone_number", "phoneNumber", "phone", "pn", "pn_jid"]) {
    const v = raw[k];
    if (typeof v === "string" && /\d{7,}/.test(v)) return v.replace(/@.*/, "").replace(/\D/g, "");
  }
  return "";
};
function normalizeDecisions(data, asked) {
  const list = Array.isArray(data) ? data : isObj2(data) ? data.results ?? data.participants ?? data.updated ?? null : null;
  if (Array.isArray(list) && list.length) {
    const byJid = /* @__PURE__ */ new Map();
    for (const x of list) {
      if (!isObj2(x)) continue;
      const jid = String(x.jid ?? "");
      const status = String(x.status ?? "200");
      if (jid) byJid.set(jid, { jid, ok: status === "200" || status === "ok", status });
    }
    return asked.map((jid) => byJid.get(jid) ?? { jid, ok: false, status: "\u043D\u0435\u0442 \u0432 \u043E\u0442\u0432\u0435\u0442\u0435" });
  }
  return asked.map((jid) => ({ jid, ok: true, status: "200" }));
}
function noteJoinedDay(r, target, day) {
  let m = r.joinedByDay.get(target);
  if (!m) r.joinedByDay.set(target, m = /* @__PURE__ */ new Map());
  m.set(day, (m.get(day) || 0) + 1);
}
function nextJoinDelay(r, serving, now) {
  const jp = r.cfg.joinPolling;
  if (!serving) return between(r, jp.otherSec) * 1e3;
  const hot = !jp.idleSec || jp.hotMinutes === void 0 || now - Math.max(r.lastServedAt, r.lastRequestsAt) < jp.hotMinutes * MIN3;
  return between(r, hot ? jp.servingSec : jp.idleSec) * 1e3;
}
async function pollJoins(r, t, now) {
  const list = await communityRequests(t.jid);
  if (!list.ok) {
    await softJoinFail(r, now, `\u0441\u043F\u0438\u0441\u043E\u043A \u0437\u0430\u044F\u0432\u043E\u043A ${t.id}: ${list.error}`);
    return 0;
  }
  const reqs = normalizeRequests(list.data);
  if (reqs.length) r.lastRequestsAt = now;
  for (const q2 of reqs) {
    const k = `${t.jid}|${q2.jid}`;
    if (r.seenReq.has(k)) continue;
    r.seenReq.add(k);
    append2(fJoins(r), { ts: iso(now), ev: "request", community: t.jid, target: t.id, day: t.day, jid: q2.jid, phone: phoneOf(q2.raw), raw: q2.raw });
  }
  const waiting = reqs.map((q2) => q2.jid).filter((jid) => !r.approved.has(`${t.jid}|${jid}`) && (r.approveFails.get(`${t.jid}|${jid}`) || 0) < 3);
  if (!waiting.length) {
    r.joinFailStreak = 0;
    return 0;
  }
  const limit = r.cfg.overflowAt[t.kind];
  const room = limit - heldMembers(r, t);
  if (room <= 0) {
    await openNext(r, t, now, heldMembers(r, t));
    return 0;
  }
  const todo = waiting.slice(0, Math.min(room, r.cfg.joinPolling.batch));
  const d = await communityDecide(t.jid, todo, "approve");
  if (!d.ok) {
    if (d.status >= 400 && d.status < 500 && ![401, 403, 408, 429].includes(d.status)) {
      for (const jid of todo) r.approveFails.set(`${t.jid}|${jid}`, (r.approveFails.get(`${t.jid}|${jid}`) || 0) + 1);
    }
    append2(fJoins(r), { ts: iso(r.deps.now()), ev: "approve_error", community: t.jid, target: t.id, count: todo.length, err: d.error });
    await softJoinFail(r, now, `\u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0435 \u0437\u0430\u044F\u0432\u043E\u043A ${t.id}: ${d.error}`);
    return 0;
  }
  r.joinFailStreak = 0;
  let n = 0;
  let full = false;
  for (const x of normalizeDecisions(d.data, todo)) {
    const k = `${t.jid}|${x.jid}`;
    append2(fJoins(r), { ts: iso(r.deps.now()), ev: "approve", community: t.jid, target: t.id, day: t.day, jid: x.jid, ok: x.ok, status: x.status });
    if (x.ok) {
      r.approved.add(k);
      r.joinedCount.set(t.id, (r.joinedCount.get(t.id) || 0) + 1);
      r.approvedSince.set(t.id, (r.approvedSince.get(t.id) || 0) + 1);
      noteJoinedDay(r, t.id, dayKeyOf(r.deps.now()));
      n++;
    } else if (LIMIT_REFUSAL.test(x.status)) {
      full = true;
    } else {
      r.approveFails.set(k, (r.approveFails.get(k) || 0) + 1);
    }
  }
  if (full) {
    t.members = Math.max(t.members ?? 0, limit);
    t.membersAt = r.deps.now();
    r.approvedSince.set(t.id, 0);
    save(r);
    await openNext(r, t, r.deps.now(), t.members);
  }
  return n;
}
var LIMIT_REFUSAL = /^419$|full|limit/i;
async function softJoinFail(r, now, what) {
  r.joinFailStreak++;
  console.warn("[wa] \u0437\u0430\u044F\u0432\u043A\u0438, \u043E\u0448\u0438\u0431\u043A\u0430 %d \u043F\u043E\u0434\u0440\u044F\u0434: %s", r.joinFailStreak, what);
  if (r.joinFailStreak >= 5 && now - r.joinAlertAt >= HOUR3) {
    r.joinAlertAt = now;
    await alarm(r, `WhatsApp: \u0437\u0430\u044F\u0432\u043A\u0438 \u043D\u0430 \u0432\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0435 \u043D\u0435 \u043E\u0434\u043E\u0431\u0440\u044F\u044E\u0442\u0441\u044F (${r.joinFailStreak} \u043E\u0448\u0438\u0431\u043E\u043A \u043F\u043E\u0434\u0440\u044F\u0434). \u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F: ${what}. \u041B\u044E\u0434\u0438 \u0436\u0434\u0443\u0442 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F.`);
  }
}
async function joinsTick() {
  const r = rt;
  if (!r || r.joining || r.state.paused || r.conn.state !== "open") return 0;
  r.joining = true;
  try {
    return await exclusive(r, async () => {
      const now = r.deps.now();
      if (r.state.paused || r.conn.state !== "open" || !holdLock2(r)) return 0;
      const serving = servingTarget(r, now);
      let n = 0;
      for (const t of r.state.targets) {
        if (t.kind !== "community" || !isReady(t)) continue;
        if (now >= closeAtOf(r, t.day) + r.cfg.joinPolling.keepAfterCloseMin * MIN3) continue;
        if (now < (r.joinNextAt.get(t.id) || 0)) continue;
        n += await pollJoins(r, t, now);
        r.joinNextAt.set(t.id, r.deps.now() + nextJoinDelay(r, serving?.id === t.id, r.deps.now()));
      }
      return n;
    });
  } catch (e) {
    console.error("[wa] \u0437\u0430\u044F\u0432\u043A\u0438, \u0442\u0438\u043A \u0443\u043F\u0430\u043B:", e?.message || e);
    return 0;
  } finally {
    r.joining = false;
  }
}
var agoText3 = (ms) => {
  const s = Math.max(0, Math.round(ms / 1e3));
  return s < 90 ? `${s} \u0441 \u043D\u0430\u0437\u0430\u0434` : s < 5400 ? `${Math.round(s / 60)} \u043C\u0438\u043D \u043D\u0430\u0437\u0430\u0434` : `${Math.round(s / 3600)} \u0447 \u043D\u0430\u0437\u0430\u0434`;
};
var inText = (ms) => {
  const m = Math.max(0, Math.round(ms / MIN3));
  if (m < 90) return `\u0447\u0435\u0440\u0435\u0437 ${m} \u043C\u0438\u043D`;
  if (m >= 2880) return `\u0447\u0435\u0440\u0435\u0437 ${Math.floor(m / 1440)} \u0434\u043D. ${Math.floor(m % 1440 / 60)} \u0447`;
  return `\u0447\u0435\u0440\u0435\u0437 ${Math.floor(m / 60)} \u0447 ${m % 60} \u043C\u0438\u043D`;
};
function nextMessage(r, now) {
  let best = null;
  const consider = (day, start) => {
    for (const m of r.cfg.messages) {
      if (m.enabled === false) continue;
      const plan = planOf(r, { day, start }, m);
      if (plan >= now && plan < closeAtOf(r, day) && sendableTime(plan) && (!best || plan < best.plan)) best = { plan, id: m.id, topic: m.topic || m.id, day };
    }
  };
  if (r.state.mode === "event") {
    const ev = r.state.event;
    if (ev.date && !ev.done) consider(ev.date, eventTarget(r)?.start ?? (ev.start && ev.start !== r.cfg.streamStart ? ev.start : void 0));
    return best;
  }
  const c = tcfg(r);
  const today = dayKeyOf(now);
  for (let i = 0; i < 4; i++) {
    const day = addDays(today, i);
    if (!isStreamDay(day, c)) continue;
    const ts = targetsOf(r, day).filter((t) => t.source !== "event");
    if (!ts.length && !r.state.daily.enabled) continue;
    consider(day, ts[0]?.start);
  }
  return best;
}
function nextMessageText(r, now) {
  const b = nextMessage(r, now);
  return b ? `${hhmmOf(b.plan)} ${b.id} (\u044D\u0444\u0438\u0440 ${ddmm4(b.day)}), ${inText(b.plan - now)}` : "\u043D\u0435\u0442";
}
function targetLine(r, label, day, now) {
  const ts = [...targetsOf(r, day)].reverse().filter((t) => r.state.mode === "event" || t.source !== "event");
  const at = createAtOf(r, day);
  if (!ts.length) return r.state.daily.enabled ? `${label} ${ddmm4(day)}: \u043F\u043E\u043A\u0430 \u043D\u0435\u0442, \u0441\u043E\u0437\u0434\u0430\u043C \u0432 ${hhmmOf(at)} ${ddmm4(dayKeyOf(at))}` : `${label} ${ddmm4(day)}: \u043F\u043E\u043A\u0430 \u043D\u0435\u0442, \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E`;
  return ts.map((t) => {
    const mem = t.members === void 0 ? "\u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u043D\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u043B\u0438" : `\u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 ${t.members} (${agoText3(now - (t.membersAt || now))})`;
    const joined = t.kind === "community" ? `, \u0432\u0441\u0442\u0443\u043F\u0438\u043B\u0438 \u043F\u043E \u0437\u0430\u044F\u0432\u043A\u0430\u043C ${r.joinedCount.get(t.id) || 0}` : "";
    return `${label} ${ddmm4(day)}: \xAB${t.name}\xBB, ${isReady(t) ? "\u0433\u043E\u0442\u043E\u0432\u043E" : "\u0434\u043E\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0435\u0442\u0441\u044F"}, ${mem}${joined}`;
  }).join("\n");
}
async function cmdStatus(r, now) {
  const conn = await exclusive(r, async () => {
    const c2 = await connectionState();
    setConn(r, c2.ok ? c2.data.state : "unreachable", now);
    if (r.conn.state === "open" && !r.state.ownerJid) {
      const i = await fetchInstance();
      if (i.ok && i.data.ownerJid) {
        r.state.ownerJid = i.data.ownerJid;
        r.state.ownerAt = now;
        save(r);
      }
    }
    if (r.conn.state === "open" && !r.state.paused) {
      const s = servingTarget(r, now);
      if (s) await refreshMembers(r, s, now);
    }
    return r.conn.state;
  });
  const today = dayKeyOf(now);
  const c = tcfg(r);
  const cur = isStreamDay(today, c) ? today : assignStreamDay(now, c);
  const next = nextStreamAfter(r, cur);
  const number = r.state.ownerJid ? `+${r.state.ownerJid.replace(/@.*/, "")}` : "\u043D\u043E\u043C\u0435\u0440 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u0435\u043D";
  const link = waGroupLink(now, false);
  const ev = r.state.event;
  const lines = [
    `WhatsApp-\u043C\u043E\u0434\u0443\u043B\u044C: ${r.state.paused ? `\u043D\u0430 \u043F\u0430\u0443\u0437\u0435 (${r.state.pausedReason || "\u043F\u0440\u0438\u0447\u0438\u043D\u0430 \u043D\u0435 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u0430"})` : "\u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442"}, \u0442\u0438\u043F ${r.cfg.target === "community" ? "\u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E" : "\u0433\u0440\u0443\u043F\u043F\u0430"}`,
    r.state.mode === "event" ? `\u0420\u0435\u0436\u0438\u043C: \u0436\u0438\u0432\u043E\u0439 \u044D\u0444\u0438\u0440${ev.date ? ` ${ddmm4(ev.date)} \u0432 ${ev.start}, \u043D\u0430\u0431\u043E\u0440 \u0441 ${ddmm4(ev.recruitFrom)}` : ", \u0434\u0430\u0442\u0430 \u044D\u0444\u0438\u0440\u0430 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u0430"}` : `\u0420\u0435\u0436\u0438\u043C: \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0439, \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 ${r.state.daily.enabled ? "\u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E" : "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E"}`,
    `\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435: ${conn}${conn === "open" ? `, ${number}` : ""}`,
    ...r.state.mode === "event" ? [ev.date ? eventTarget(r) ? targetLine(r, "\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u044D\u0444\u0438\u0440\u0430", ev.date, now) : `\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u044D\u0444\u0438\u0440\u0430 ${ddmm4(ev.date)}: \u043F\u043E\u043A\u0430 \u043D\u0435\u0442, \u0441\u043E\u0437\u0434\u0430\u043C ${ddmm4(ev.recruitFrom)} \u0432 ${EVENT_CREATE_AT}` : "\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u044D\u0444\u0438\u0440\u0430: \u043F\u043E\u043A\u0430 \u043D\u0435\u0442"] : [targetLine(r, "\u042D\u0444\u0438\u0440", cur, now), targetLine(r, "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u044D\u0444\u0438\u0440", next, now)],
    `\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u0441\u0435\u0439\u0447\u0430\u0441: ${link ?? "\u0441\u0442\u0430\u0440\u0430\u044F \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u0430\u044F (\u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0435\u0433\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u043D\u0435\u0442)"}`,
    `\u0411\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435: ${nextMessageText(r, now)}`,
    `\u041D\u043E\u0432\u044B\u0445 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432 \u0437\u0430 \u0441\u0443\u0442\u043A\u0438: ${dayCreations(r, now)} \u0438\u0437 ${r.cfg.maxNewPerDay}`,
    `\u041E\u0448\u0438\u0431\u043E\u043A \u043F\u043E\u0434\u0440\u044F\u0434: ${r.state.failStreak} \u0438\u0437 ${r.cfg.retry.pauseAfter}`,
    // Строка про ассистента только когда он включён: при выключенном вывод /wa прежний.
    ...r.state.assistant.enabled ? ["\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u0432 \u043B\u0438\u0447\u043A\u0435: \u0432\u043A\u043B\u044E\u0447\u0451\u043D (/wa_ai \u043F\u043E\u043A\u0430\u0436\u0435\u0442 \u0441\u0447\u0451\u0442\u0447\u0438\u043A\u0438 \u0437\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F)"] : [],
    ...r.state.dozhim.enabled ? ["\u0414\u043E\u0436\u0438\u043C WABA: \u0432\u043A\u043B\u044E\u0447\u0451\u043D (/wa_dozhim \u043F\u043E\u043A\u0430\u0436\u0435\u0442 \u0441\u0447\u0451\u0442\u0447\u0438\u043A\u0438 \u0437\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F)"] : []
  ];
  return { text: lines.join("\n") };
}
function nextStreamAfter(r, day) {
  const c = tcfg(r);
  let d = addDays(day, 1);
  for (let i = 0; i < 400 && !isStreamDay(d, c); i++) d = addDays(d, 1);
  return d;
}
async function cmdQr(r, now) {
  const wait = r.state.lastQrAt + MIN3 - now;
  if (wait > 0) return { text: `QR \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u0442\u044C \u0440\u0430\u0437 \u0432 \u043C\u0438\u043D\u0443\u0442\u0443, \u043F\u043E\u0434\u043E\u0436\u0434\u0438 \u0435\u0449\u0451 ${Math.ceil(wait / 1e3)} \u0441.` };
  r.state.lastQrAt = now;
  save(r);
  return exclusive(r, async () => {
    const cs = await connectionState();
    if (!cs.ok) return { text: `Evolution \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442: ${cs.error}` };
    if (cs.data.state === "open") {
      const i = await fetchInstance();
      return { text: `WhatsApp \u0443\u0436\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D${i.ok && i.data.ownerJid ? `, \u043D\u043E\u043C\u0435\u0440 +${i.data.ownerJid.replace(/@.*/, "")}` : ""}. QR \u043D\u0435 \u043D\u0443\u0436\u0435\u043D.` };
    }
    let qr;
    if (cs.data.state === "absent") {
      const c = await createInstance();
      if (!c.ok) return { text: `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435: ${c.error}` };
      qr = c.data?.qrcode;
    } else {
      const c = await connectInstance();
      if (!c.ok) return { text: `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u044C QR: ${c.error}` };
      qr = c.data;
    }
    if (!qr?.base64) {
      await r.deps.sleep(3e3);
      const again = await connectInstance();
      if (again.ok) qr = again.data;
    }
    const b64 = typeof qr?.base64 === "string" ? qr.base64.replace(/^data:image\/\w+;base64,/, "") : "";
    if (!b64) return { text: "QR \u043F\u043E\u043A\u0430 \u043D\u0435 \u0433\u043E\u0442\u043E\u0432. \u041F\u043E\u0434\u043E\u0436\u0434\u0438 \u043C\u0438\u043D\u0443\u0442\u0443 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438 /wa_qr." };
    journal(r, { ev: "qr" });
    return {
      text: "QR \u0434\u043B\u044F \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F. \u041D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435 \u0441 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0439 SIM: WhatsApp, \u0421\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430, \u041F\u0440\u0438\u0432\u044F\u0437\u0430\u0442\u044C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E, \u043D\u0430\u0432\u0435\u0441\u0442\u0438 \u043A\u0430\u043C\u0435\u0440\u0443. \u0414\u0435\u0440\u0436\u0438\u0442\u0441\u044F \u043E\u043A\u043E\u043B\u043E \u043C\u0438\u043D\u0443\u0442\u044B, \u043D\u0435 \u043F\u0435\u0440\u0435\u0441\u044B\u043B\u0430\u0439 \u0435\u0433\u043E \u043D\u0438\u043A\u043E\u043C\u0443.",
      photo: { data: Buffer.from(b64, "base64"), caption: "QR \u0434\u043B\u044F \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F WhatsApp" }
    };
  });
}
function cmdPause(r, now, by = "bot") {
  if (r.state.paused) return { text: "\u041C\u043E\u0434\u0443\u043B\u044C \u0443\u0436\u0435 \u043D\u0430 \u043F\u0430\u0443\u0437\u0435." };
  r.state.paused = true;
  r.state.pausedAt = now;
  r.state.pausedReason = by === "panel" ? "\u0432\u0440\u0443\u0447\u043D\u0443\u044E, \u0438\u0437 \u043F\u0443\u043B\u044C\u0442\u0430" : "\u0432\u0440\u0443\u0447\u043D\u0443\u044E, /wa_pause";
  save(r);
  journal(r, { ev: "pause", reason: r.state.pausedReason });
  return { text: by === "panel" ? "\u041F\u0430\u0443\u0437\u0430 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0430: \u0440\u0430\u0441\u0441\u044B\u043B\u043A\u0430, \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0438 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0435 \u0437\u0430\u044F\u0432\u043E\u043A \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B." : "\u041F\u0430\u0443\u0437\u0430 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u0430: \u0440\u0430\u0441\u0441\u044B\u043B\u043A\u0430, \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0438 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0435 \u0437\u0430\u044F\u0432\u043E\u043A \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B. \u0412\u0435\u0440\u043D\u0443\u0442\u044C: /wa_resume." };
}
function cmdResume(r) {
  const was = r.state.paused;
  r.state.paused = false;
  r.state.pausedReason = "";
  r.state.failStreak = 0;
  r.state.retryAt = 0;
  r.state.pendingCreate = null;
  save(r);
  journal(r, { ev: "resume" });
  return { text: was ? "\u041F\u0430\u0443\u0437\u0430 \u0441\u043D\u044F\u0442\u0430, \u0441\u0447\u0451\u0442\u0447\u0438\u043A \u043E\u0448\u0438\u0431\u043E\u043A \u043E\u0431\u043D\u0443\u043B\u0451\u043D. \u041C\u043E\u0434\u0443\u043B\u044C \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u043D\u0430 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u043C \u0442\u0438\u043A\u0435 (\u0434\u043E 30 \u0441\u0435\u043A\u0443\u043D\u0434)." : "\u041C\u043E\u0434\u0443\u043B\u044C \u0438 \u0442\u0430\u043A \u043D\u0435 \u043D\u0430 \u043F\u0430\u0443\u0437\u0435. \u0421\u0447\u0451\u0442\u0447\u0438\u043A \u043E\u0448\u0438\u0431\u043E\u043A \u043E\u0431\u043D\u0443\u043B\u0451\u043D." };
}
var fail3 = (code, message) => ({ ok: false, code, message });
function eventCreateCheck(r, now) {
  const ev = r.state.event;
  if (r.state.mode !== "event") return fail3("wrong_mode", "\u0421\u0435\u0439\u0447\u0430\u0441 \u0432\u043A\u043B\u044E\u0447\u0451\u043D \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C. \u041F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0441\u044C \u043D\u0430 \u0436\u0438\u0432\u043E\u0439 \u044D\u0444\u0438\u0440.");
  if (!ev.date) return fail3("no_event", "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0437\u0430\u0434\u0430\u0439 \u0434\u0430\u0442\u0443 \u044D\u0444\u0438\u0440\u0430 \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0438.");
  if (ev.done || now >= closeAtOf(r, ev.date)) return fail3("over", `\u042D\u0444\u0438\u0440 ${ddmm4(ev.date)} \u0443\u0436\u0435 \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B\u0441\u044F. \u0417\u0430\u0434\u0430\u0439 \u043D\u043E\u0432\u0443\u044E \u0434\u0430\u0442\u0443.`);
  if (r.state.pendingCreate) return fail3("pending", "\u041F\u0440\u043E\u0448\u043B\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043E. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0438 \u0441\u043D\u0438\u043C\u0438 \u043F\u0430\u0443\u0437\u0443 (\u043E\u043D\u0430 \u043E\u0431\u043D\u0443\u043B\u0438\u0442 \u043E\u0436\u0438\u0434\u0430\u043D\u0438\u0435).");
  if (r.state.paused) return fail3("paused", "\u041C\u043E\u0434\u0443\u043B\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0441\u043D\u0438\u043C\u0438 \u043F\u0430\u0443\u0437\u0443.");
  const existing = eventTarget(r);
  if (existing) {
    syncEventCommunity(r);
    return { ok: true, code: "exists", message: `\u0414\u043B\u044F \u044D\u0444\u0438\u0440\u0430 ${ddmm4(ev.date)} \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0443\u0436\u0435 \u0435\u0441\u0442\u044C: \xAB${existing.name}\xBB${existing.link ? `, \u0441\u0441\u044B\u043B\u043A\u0430 ${existing.link}` : ", \u0441\u0441\u044B\u043B\u043A\u0430 \u0435\u0449\u0451 \u043D\u0435 \u0433\u043E\u0442\u043E\u0432\u0430"}.` };
  }
  if (capReached(r, now)) return fail3("cap", `\u041B\u0438\u043C\u0438\u0442 ${r.cfg.maxNewPerDay} \u043D\u043E\u0432\u044B\u0445 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432 \u0432 \u0441\u0443\u0442\u043A\u0438 \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D. \u041F\u043E\u0434\u043E\u0436\u0434\u0438.`);
  return null;
}
async function eventCreateNow(r, now) {
  const early = eventCreateCheck(r, now);
  if (early) return early;
  return exclusive(r, async () => {
    const late = eventCreateCheck(r, Math.max(now, r.deps.now()));
    if (late) return late;
    const ev = r.state.event;
    if (!await checkConnection(r, now)) return fail3("no_connection", `WhatsApp \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D (${r.conn.state}). \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u043D\u043E\u043C\u0435\u0440 \u043F\u043E QR.`);
    const res = await createTarget(r, ev.date, 1, r.deps.now(), { source: "event", start: ev.start });
    if (!res.ok) return fail3("create_failed", r.state.paused ? "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043E, \u043C\u043E\u0434\u0443\u043B\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435. \u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438 \u0432 \u0442\u0440\u0435\u0432\u043E\u0433\u0435 \u0432 Telegram." : `\u041D\u0435 \u0441\u043E\u0437\u0434\u0430\u043B\u043E\u0441\u044C: ${res.error}`);
    syncEventCommunity(r);
    await pause(r, r.cfg.pacing.betweenStepsMs);
    const done = await setupSteps(r, res.target);
    const t = res.target;
    return { ok: true, code: isReady(t) ? "created" : "building", message: `\u0421\u043E\u0437\u0434\u0430\u043D\u043E: \xAB${t.name}\xBB. ${isReady(t) ? `\u0421\u0441\u044B\u043B\u043A\u0430: ${t.link}. \u041D\u0430 \u0441\u0430\u0439\u0442\u0435 \u043E\u043D\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u043E 00:00 \u043F\u043E\u0441\u043B\u0435 \u044D\u0444\u0438\u0440\u0430.` : done ? "\u0414\u043E\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0435\u0442\u0441\u044F." : "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043D\u0435 \u0437\u0430\u043A\u043E\u043D\u0447\u0435\u043D\u044B, \u043C\u043E\u0434\u0443\u043B\u044C \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442 \u043D\u0430 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0445 \u0442\u0438\u043A\u0430\u0445."}` };
  });
}
function cmdNewCheck(r, day, now) {
  if (r.state.pendingCreate) return { text: "\u041F\u0440\u043E\u0448\u043B\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043E. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0438 \u0441\u0434\u0435\u043B\u0430\u0439 /wa_resume." };
  if (r.state.paused) return { text: "\u041C\u043E\u0434\u0443\u043B\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 /wa_resume." };
  const existing = targetsOf(r, day)[0];
  if (existing) return { text: `\u0414\u043B\u044F \u044D\u0444\u0438\u0440\u0430 ${ddmm4(day)} \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0443\u0436\u0435 \u0435\u0441\u0442\u044C: \xAB${existing.name}\xBB${existing.link ? `, \u0441\u0441\u044B\u043B\u043A\u0430 ${existing.link}` : ", \u0441\u0441\u044B\u043B\u043A\u0430 \u0435\u0449\u0451 \u043D\u0435 \u0433\u043E\u0442\u043E\u0432\u0430"}.` };
  if (capReached(r, now)) return { text: `\u041B\u0438\u043C\u0438\u0442 ${r.cfg.maxNewPerDay} \u043D\u043E\u0432\u044B\u0445 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432 \u0432 \u0441\u0443\u0442\u043A\u0438 \u0438\u0441\u0447\u0435\u0440\u043F\u0430\u043D. \u041F\u043E\u0434\u043E\u0436\u0434\u0438.` };
  return null;
}
async function cmdNew(r, args, now) {
  if (r.state.mode === "event") return { text: (await eventCreateNow(r, now)).message };
  if (r.state.paused) return { text: "\u041C\u043E\u0434\u0443\u043B\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 /wa_resume." };
  if (r.state.pendingCreate) return { text: "\u041F\u0440\u043E\u0448\u043B\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043E. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0438 \u0441\u0434\u0435\u043B\u0430\u0439 /wa_resume." };
  const c = tcfg(r);
  const arg = args.trim();
  let day;
  if (arg) {
    if (!isDayKey(arg) || !isStreamDay(arg, c)) return { text: "\u041D\u0443\u0436\u043D\u0430 \u0434\u0430\u0442\u0430 \u044D\u0444\u0438\u0440\u0430 \u0432\u0438\u0434\u0430 2026-10-12, \u0438 \u0432 \u044D\u0442\u043E\u0442 \u0434\u0435\u043D\u044C \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u044D\u0444\u0438\u0440." };
    day = arg;
  } else {
    day = dayKeyOf(now);
    for (let i = 0; i < 400 && (!isStreamDay(day, c) || r.state.targets.some((t) => t.day === day)); i++) day = addDays(day, 1);
  }
  if (arg && day > addDays(dayKeyOf(now), 3)) return { text: `\u042D\u0444\u0438\u0440 ${ddmm4(day)} \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u0430\u043B\u0435\u043A\u043E: \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u043C\u043E\u0436\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u0435 \u0440\u0430\u043D\u044C\u0448\u0435 \u0447\u0435\u043C \u0437\u0430 \u0442\u0440\u0438 \u0434\u043D\u044F \u0434\u043E \u043D\u0435\u0433\u043E.` };
  if (!arg && day > addDays(dayKeyOf(now), 1)) return { text: `\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u043D\u0430 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0435 \u044D\u0444\u0438\u0440\u044B \u0443\u0436\u0435 \u0435\u0441\u0442\u044C. \u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u0431\u0435\u0437 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430: ${ddmm4(day)}. \u0415\u0441\u043B\u0438 \u043D\u0443\u0436\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0440\u0430\u043D\u044C\u0448\u0435 \u0441\u0440\u043E\u043A\u0430, \u0443\u043A\u0430\u0436\u0438 \u0434\u0430\u0442\u0443: /wa_new ${day}` };
  const early = cmdNewCheck(r, day, now);
  if (early) return early;
  return exclusive(r, async () => {
    const late = cmdNewCheck(r, day, Math.max(now, r.deps.now()));
    if (late) return late;
    if (!await checkConnection(r, now)) return { text: `WhatsApp \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D (${r.conn.state}). /wa_qr \u043F\u0440\u0438\u0448\u043B\u0451\u0442 QR.` };
    const res = await createTarget(r, day, 1, r.deps.now());
    if (!res.ok) return { text: r.state.paused ? "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043D\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043E, \u043C\u043E\u0434\u0443\u043B\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435. \u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438 \u0432 \u0442\u0440\u0435\u0432\u043E\u0433\u0435 \u0432\u044B\u0448\u0435." : `\u041D\u0435 \u0441\u043E\u0437\u0434\u0430\u043B\u043E\u0441\u044C: ${res.error}` };
    await pause(r, r.cfg.pacing.betweenStepsMs);
    const done = await setupSteps(r, res.target);
    const t = res.target;
    return { text: `\u0421\u043E\u0437\u0434\u0430\u043D\u043E: \xAB${t.name}\xBB. ${isReady(t) ? `\u0421\u0441\u044B\u043B\u043A\u0430: ${t.link}. \u041D\u0430 \u0441\u0430\u0439\u0442\u0435 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438\u0442\u0441\u044F \u043F\u043E \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044E (\u0432 ${hhmmOf(atTime(addDays(day, -1), c.streamStart) + (c.joinLiveMinutes ?? DEFAULT_JOIN_MINUTES) * MIN3)} \u043D\u0430\u043A\u0430\u043D\u0443\u043D\u0435 \u044D\u0444\u0438\u0440\u0430).` : done ? "\u0414\u043E\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u0435\u0442\u0441\u044F." : "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043D\u0435 \u0437\u0430\u043A\u043E\u043D\u0447\u0435\u043D\u044B, \u043C\u043E\u0434\u0443\u043B\u044C \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442 \u043D\u0430 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0445 \u0442\u0438\u043A\u0430\u0445."}` };
  });
}
function currentTargets(r, now) {
  const day = r.state.mode === "event" ? r.state.event.date : dayKeyOf(now);
  const list = day ? [...targetsOf(r, day)].reverse().filter((t) => (r.state.mode === "event" ? true : t.source !== "event") && isReady(t) && now < closeAtOf(r, t.day)) : [];
  return { day, list };
}
async function sendSeries(r, id, now) {
  const ids = r.cfg.messages.map((m) => m.id).join(", ");
  const zero = { sent: 0, skipped: 0, failed: 0, targets: 0 };
  if (!id) return { ok: false, code: "no_id", text: `\u0423\u043A\u0430\u0436\u0438 id \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F: /wa_send morning. \u0421\u043F\u0438\u0441\u043E\u043A: ${ids}`, ...zero };
  const msg = r.cfg.messages.find((m) => m.id === id);
  if (!msg) return { ok: false, code: "bad_id", text: `\u041D\u0435\u0442 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \xAB${id}\xBB. \u0421\u043F\u0438\u0441\u043E\u043A: ${ids}`, ...zero };
  if (r.state.paused) return { ok: false, code: "paused", text: "\u041C\u043E\u0434\u0443\u043B\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 /wa_resume.", ...zero };
  const { day, list: targets } = currentTargets(r, now);
  if (!targets.length) {
    const text2 = r.state.mode === "event" ? day ? `\u0414\u043B\u044F \u044D\u0444\u0438\u0440\u0430 (${ddmm4(day)}) \u043D\u0435\u0442 \u0433\u043E\u0442\u043E\u0432\u043E\u0433\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430.` : "\u0416\u0438\u0432\u043E\u0439 \u044D\u0444\u0438\u0440 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D, \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u043D\u0435\u0442." : `\u0414\u043B\u044F \u0441\u0435\u0433\u043E\u0434\u043D\u044F\u0448\u043D\u0435\u0433\u043E \u044D\u0444\u0438\u0440\u0430 (${ddmm4(dayKeyOf(now))}) \u043D\u0435\u0442 \u0433\u043E\u0442\u043E\u0432\u043E\u0433\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430.`;
    return { ok: false, code: "no_target", text: text2, ...zero };
  }
  return exclusive(r, async () => {
    if (!await checkConnection(r, now)) return { ok: false, code: "no_connection", text: `WhatsApp \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D (${r.conn.state}). \u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E.`, ...zero, targets: targets.length };
    let ok = 0;
    let skipped = 0;
    let failed = 0;
    let first = true;
    for (const t of targets) {
      if (isDone(r, msg, t, true)) {
        skipped++;
        continue;
      }
      if (r.state.paused) break;
      if (!first) await pause(r, r.cfg.pacing.betweenSendsMs);
      first = false;
      if (await sendMessageTo(r, t, msg, true)) ok++;
      else failed++;
    }
    return { ok: failed === 0, code: failed ? "partial" : "sent", text: `\xAB${id}\xBB: \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E ${ok}, \u0443\u0436\u0435 \u0431\u044B\u043B\u043E ${skipped}, \u043D\u0435 \u0443\u0448\u043B\u043E ${failed} (\u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432 ${r.state.mode === "event" ? "\u044D\u0444\u0438\u0440\u0430" : "\u0441\u0435\u0433\u043E\u0434\u043D\u044F"}: ${targets.length}).`, sent: ok, skipped, failed, targets: targets.length };
  });
}
async function cmdSend(r, args, now) {
  return { text: (await sendSeries(r, args.split(/\s+/)[0], now)).text };
}
async function waCommand(cmd, args, now) {
  const r = rt;
  if (!r) return { text: "\u041C\u043E\u0434\u0443\u043B\u044C WhatsApp \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D (\u043D\u0435\u0442 WA_GROUPS=on \u0438\u043B\u0438 \u043E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u043F\u0443\u0441\u043A\u0430, \u0441\u043C. /api/health)." };
  try {
    if (cmd === "wa") return await cmdStatus(r, now);
    if (cmd === "wa_qr") return await cmdQr(r, now);
    if (cmd === "wa_pause") return cmdPause(r, now);
    if (cmd === "wa_resume") return cmdResume(r);
    if (cmd === "wa_new") return await cmdNew(r, args, now);
    if (cmd === "wa_send") return await cmdSend(r, args, now);
    if (cmd === "wa_ai" || cmd === "wa_ai_test") return { text: await aiCommand(cmd, args) };
    if (cmd === "wa_dozhim" || cmd === "wa_dozhim_test") return { text: await dzCommand(cmd, args) };
    return { text: "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430 WhatsApp." };
  } catch (e) {
    console.error("[wa] \u043A\u043E\u043C\u0430\u043D\u0434\u0430 %s \u0443\u043F\u0430\u043B\u0430:", cmd, e?.stack || e);
    return { text: `\u041E\u0448\u0438\u0431\u043A\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u044B: ${e?.message || e}` };
  }
}
function waReportLine(day) {
  const r = rt;
  if (!r) return "";
  const ts = targetsOf(r, day);
  if (!ts.length) return "";
  const joined = ts.reduce((s, t) => s + (r.joinedCount.get(t.id) || 0), 0);
  const total = r.cfg.messages.filter((m) => m.enabled !== false).length * ts.length;
  const done = ts.reduce((s, t) => s + r.cfg.messages.filter((m) => m.enabled !== false && isDone(r, m, t, true)).length, 0);
  return `WhatsApp: \u0432\u0441\u0442\u0443\u043F\u0438\u043B\u0438 \u043F\u043E \u0437\u0430\u044F\u0432\u043A\u0430\u043C ${joined}, \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0441\u0435\u0440\u0438\u0438 \u0443\u0448\u043B\u043E ${done} \u0438\u0437 ${total}.`;
}
var MODULE_OFF3 = fail3("module_off", "\u041C\u043E\u0434\u0443\u043B\u044C WhatsApp \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D: \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 \u043D\u0435\u0442 WA_GROUPS=on \u0438\u043B\u0438 \u043E\u043D \u043D\u0435 \u0441\u0442\u0430\u0440\u0442\u043E\u0432\u0430\u043B (\u0441\u043C. /api/health).");
var clock = (r, now) => now ?? r.deps.now();
var when = (ms) => `${ddmm4(dayKeyOf(ms))} \u0432 ${hhmmOf(ms)}`;
function waSetMode(mode, nowArg) {
  const r = rt;
  if (!r) return MODULE_OFF3;
  if (mode !== "daily" && mode !== "event") return fail3("bad_request", "\u0420\u0435\u0436\u0438\u043C: daily \u0438\u043B\u0438 event.");
  if (r.state.mode === mode) return { ok: true, code: "same", message: "\u042D\u0442\u043E\u0442 \u0440\u0435\u0436\u0438\u043C \u0443\u0436\u0435 \u0432\u043A\u043B\u044E\u0447\u0451\u043D." };
  r.state.mode = mode;
  if (mode === "event") {
    r.state.daily.enabled = false;
    if (r.state.event.done) r.state.event = { ...freshEvent(), start: r.cfg.streamStart };
  }
  save(r);
  journal(r, { ev: "mode", mode, by: "panel" });
  return {
    ok: true,
    message: mode === "event" ? "\u0412\u043A\u043B\u044E\u0447\u0451\u043D \u0436\u0438\u0432\u043E\u0439 \u044D\u0444\u0438\u0440. \u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E. \u0421\u043E\u0437\u0434\u0430\u043D\u043D\u044B\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u044E\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C, \u043D\u043E \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u0442\u0435\u043F\u0435\u0440\u044C \u0432\u0435\u0434\u0451\u0442 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0436\u0438\u0432\u043E\u0433\u043E \u044D\u0444\u0438\u0440\u0430." : "\u0412\u043A\u043B\u044E\u0447\u0451\u043D \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C. \u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E, \u043F\u043E\u043A\u0430 \u043D\u0435 \u0432\u043A\u043B\u044E\u0447\u0438\u0448\u044C \u0435\u0433\u043E \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0430\u0442\u0435\u043B\u0435\u043C. \u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0436\u0438\u0432\u043E\u0433\u043E \u044D\u0444\u0438\u0440\u0430 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C."
  };
}
function waSetDaily(enabled, nowArg) {
  const r = rt;
  if (!r) return MODULE_OFF3;
  if (typeof enabled !== "boolean") return fail3("bad_request", "\u041D\u0443\u0436\u043D\u043E true \u0438\u043B\u0438 false.");
  if (!enabled && r.state.mode !== "daily") return { ok: true, code: "same", message: "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0443\u0436\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E." };
  if (r.state.mode !== "daily") return fail3("wrong_mode", "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0432 \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u043C \u0440\u0435\u0436\u0438\u043C\u0435. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438 \u0440\u0435\u0436\u0438\u043C.");
  if (r.state.daily.enabled === enabled) return { ok: true, code: "same", message: enabled ? "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0443\u0436\u0435 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E." : "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0443\u0436\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E." };
  r.state.daily.enabled = enabled;
  save(r);
  journal(r, { ev: "daily", enabled, by: "panel" });
  const now = clock(r, nowArg);
  if (!enabled) return { ok: true, message: "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E: \u043D\u043E\u0432\u044B\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u044E\u0442\u0441\u044F. \u0421\u043E\u0437\u0434\u0430\u043D\u043D\u044B\u0435 \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442 \u0434\u043E \u043A\u043E\u043D\u0446\u0430." };
  const nx = nextDailyCreate(r, now);
  return { ok: true, message: nx ? `\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E. \u0411\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E, \u044D\u0444\u0438\u0440 ${ddmm4(nx.day)}, \u0441\u043E\u0437\u0434\u0430\u043C ${when(nx.at)}.` : "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E." };
}
var START_MIN = 18 * 60;
var START_MAX = 21 * 60;
function waSetEvent(p, nowArg) {
  const r = rt;
  if (!r) return MODULE_OFF3;
  if (r.state.mode !== "event") return fail3("wrong_mode", "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0436\u0438\u0432\u043E\u0433\u043E \u044D\u0444\u0438\u0440\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0432 \u0440\u0435\u0436\u0438\u043C\u0435 \xAB\u0416\u0438\u0432\u043E\u0439 \u044D\u0444\u0438\u0440\xBB. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0435\u0440\u0435\u043A\u043B\u044E\u0447\u0438 \u0440\u0435\u0436\u0438\u043C.");
  const now = clock(r, nowArg);
  const today = dayKeyOf(now);
  const cur = r.state.event;
  if (!cur.done && cur.communityId && eventTarget(r)) return fail3("locked", "\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u044D\u0442\u043E\u0433\u043E \u044D\u0444\u0438\u0440\u0430 \u0443\u0436\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u043E, \u0434\u0430\u0442\u044B \u0438 \u0432\u0440\u0435\u043C\u044F \u043D\u0435 \u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F. \u041D\u0430\u0436\u043C\u0438 \xAB\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u044D\u0444\u0438\u0440\xBB \u0438 \u0437\u0430\u0434\u0430\u0439 \u043D\u043E\u0432\u044B\u0439.");
  if (!isDayKey(p.date)) return fail3("bad_date", "\u0423\u043A\u0430\u0436\u0438 \u0434\u0430\u0442\u0443 \u044D\u0444\u0438\u0440\u0430.");
  if (p.date < today) return fail3("bad_date", "\u0414\u0430\u0442\u0430 \u044D\u0444\u0438\u0440\u0430 \u0443\u0436\u0435 \u043F\u0440\u043E\u0448\u043B\u0430.");
  if (p.date > addDays(today, 90)) return fail3("bad_date", "\u042D\u0444\u0438\u0440 \u0434\u0430\u043B\u044C\u0448\u0435 \u0447\u0435\u043C \u0447\u0435\u0440\u0435\u0437 90 \u0434\u043D\u0435\u0439: \u043F\u0440\u043E\u0432\u0435\u0440\u044C \u0434\u0430\u0442\u0443.");
  let start;
  try {
    start = normHHMM(String(p.start || r.cfg.streamStart));
  } catch {
    return fail3("bad_start", "\u0412\u0440\u0435\u043C\u044F \u0441\u0442\u0430\u0440\u0442\u0430 \u0432\u0438\u0434\u0430 20:00.");
  }
  if (minsOf2(start) < START_MIN || minsOf2(start) > START_MAX) return fail3("bad_start", "\u0421\u0442\u0430\u0440\u0442 \u044D\u0444\u0438\u0440\u0430 \u043E\u0442 18:00 \u0434\u043E 21:00 \u043F\u043E \u0410\u043B\u043C\u0430\u0442\u044B: \u0441\u0435\u0440\u0438\u044F \u043D\u0430\u043F\u0438\u0441\u0430\u043D\u0430 \u043F\u043E\u0434 \u0432\u0435\u0447\u0435\u0440\u043D\u0438\u0439 \u044D\u0444\u0438\u0440, \u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u043D\u0435 \u0434\u043E\u043B\u0436\u043D\u044B \u0443\u0445\u043E\u0434\u0438\u0442\u044C \u0434\u043E 09:00.");
  if (!isDayKey(p.recruitFrom)) return fail3("bad_recruit", "\u0423\u043A\u0430\u0436\u0438 \u0434\u0435\u043D\u044C \u043D\u0430\u0447\u0430\u043B\u0430 \u043D\u0430\u0431\u043E\u0440\u0430.");
  if (p.recruitFrom > p.date) return fail3("bad_recruit", "\u041D\u0430\u0431\u043E\u0440 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442 \u043D\u0430\u0447\u0430\u0442\u044C\u0441\u044F \u043F\u043E\u0437\u0436\u0435 \u0434\u043D\u044F \u044D\u0444\u0438\u0440\u0430.");
  if (p.recruitFrom < addDays(p.date, -30)) return fail3("bad_recruit", "\u041D\u0430\u0431\u043E\u0440 \u0434\u043B\u0438\u043D\u043D\u0435\u0435 30 \u0434\u043D\u0435\u0439: \u043F\u0440\u043E\u0432\u0435\u0440\u044C \u0434\u0430\u0442\u0443.");
  r.state.event = { date: p.date, start, recruitFrom: p.recruitFrom };
  syncEventCommunity(r);
  save(r);
  journal(r, { ev: "event_set", date: p.date, start, recruitFrom: p.recruitFrom, by: "panel" });
  const at = eventCreateAt(r);
  const text2 = eventTarget(r) ? `\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E. \u0414\u043B\u044F \u044D\u0444\u0438\u0440\u0430 ${ddmm4(p.date)} \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0443\u0436\u0435 \u0435\u0441\u0442\u044C, \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u0432\u0435\u0434\u0451\u0442 \u0432 \u043D\u0435\u0433\u043E.` : now >= at ? daytime(now) ? `\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E: \u044D\u0444\u0438\u0440 ${ddmm4(p.date)} \u0432 ${start}. \u041D\u0430\u0431\u043E\u0440 \u0443\u0436\u0435 \u0438\u0434\u0451\u0442, \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0441\u043E\u0437\u0434\u0430\u043C \u0432 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0435 30 \u0441\u0435\u043A\u0443\u043D\u0434.` : `\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E: \u044D\u0444\u0438\u0440 ${ddmm4(p.date)} \u0432 ${start}. \u041D\u0430\u0431\u043E\u0440 \u0443\u0436\u0435 \u0438\u0434\u0451\u0442, \u043D\u043E \u0441\u0435\u0439\u0447\u0430\u0441 \u043D\u043E\u0447\u044C: \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0441\u043E\u0437\u0434\u0430\u043C \u043F\u043E\u0441\u043B\u0435 09:00 \u043F\u043E \u0410\u043B\u043C\u0430\u0442\u044B (\u0438\u043B\u0438 \u043D\u0430\u0436\u043C\u0438 \xAB\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0435\u0439\u0447\u0430\u0441\xBB).` : `\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E: \u044D\u0444\u0438\u0440 ${ddmm4(p.date)} \u0432 ${start}. \u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0441\u043E\u0437\u0434\u0430\u043C ${when(at)}, \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u043F\u043E\u0432\u0435\u0434\u0451\u0442 \u0432 \u043D\u0435\u0433\u043E \u0441\u0440\u0430\u0437\u0443 \u043F\u043E\u0441\u043B\u0435 \u044D\u0442\u043E\u0433\u043E.`;
  return { ok: true, message: text2 };
}
function waEventReset() {
  const r = rt;
  if (!r) return MODULE_OFF3;
  r.state.event = { ...freshEvent(), start: r.cfg.streamStart };
  save(r);
  journal(r, { ev: "event_reset", by: "panel" });
  return { ok: true, message: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u044D\u0444\u0438\u0440\u0430 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B. \u0421\u043E\u0437\u0434\u0430\u043D\u043D\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C, \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u0441\u043D\u043E\u0432\u0430 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u0430\u044F." };
}
async function waEventCreateNow(nowArg) {
  const r = rt;
  if (!r) return MODULE_OFF3;
  try {
    return await eventCreateNow(r, clock(r, nowArg));
  } catch (e) {
    return fail3("internal", `\u041E\u0448\u0438\u0431\u043A\u0430: ${e?.message || e}`);
  }
}
async function waDailyCreateNow(nowArg) {
  const r = rt;
  if (!r) return MODULE_OFF3;
  if (r.state.mode !== "daily") return fail3("wrong_mode", "\u0421\u0435\u0439\u0447\u0430\u0441 \u0432\u043A\u043B\u044E\u0447\u0451\u043D \u0436\u0438\u0432\u043E\u0439 \u044D\u0444\u0438\u0440: \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \xAB\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0435\u0439\u0447\u0430\u0441\xBB \u0432 \u0435\u0433\u043E \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445.");
  const text2 = (await cmdNew(r, "", clock(r, nowArg))).text;
  return { ok: /^Создано:/.test(text2) || /сообщество уже есть/.test(text2), message: text2 };
}
function waPause(nowArg) {
  const r = rt;
  if (!r) return MODULE_OFF3;
  const was = r.state.paused;
  const reply2 = cmdPause(r, clock(r, nowArg), "panel");
  return { ok: true, code: was ? "same" : "paused", message: reply2.text };
}
function waResume() {
  const r = rt;
  if (!r) return MODULE_OFF3;
  return { ok: true, message: cmdResume(r).text };
}
async function waSendSeries(id, nowArg) {
  const r = rt;
  if (!r) return { ...MODULE_OFF3, sent: 0, skipped: 0, failed: 0, targets: 0 };
  if (typeof id !== "string" || !id) return { ...fail3("bad_request", "\u0412\u044B\u0431\u0435\u0440\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0441\u0435\u0440\u0438\u0438."), sent: 0, skipped: 0, failed: 0, targets: 0 };
  const x = await sendSeries(r, id, clock(r, nowArg));
  return { ok: x.ok, code: x.code, message: x.text, sent: x.sent, skipped: x.skipped, failed: x.failed, targets: x.targets };
}
var numberOf = (r) => r.state.ownerJid ? `+${r.state.ownerJid.replace(/[:@].*$/, "")}` : "";
async function waConnection(nowArg) {
  const r = rt;
  if (!r) return MODULE_OFF3;
  return exclusive(r, async () => {
    const now = clock(r, nowArg);
    if (r.conn.at && now - r.conn.at < 3e3 && r.conn.state !== "open") return { ok: true, state: r.conn.state, number: "", profile: "" };
    const cs = await connectionState();
    if (!cs.ok) {
      setConn(r, "unreachable", now);
      return fail3("evolution", `Evolution \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442: ${cs.error}`);
    }
    setConn(r, cs.data.state, now);
    if (cs.data.state === "open") await refreshOwner(r, now);
    return { ok: true, state: cs.data.state, number: cs.data.state === "open" ? numberOf(r) : "", profile: cs.data.state === "open" ? r.profileName : "" };
  });
}
async function refreshOwner(r, now) {
  const i = await fetchInstance();
  if (i.ok && i.data.ownerJid) {
    r.state.ownerJid = i.data.ownerJid;
    r.state.ownerAt = now;
    r.profileName = i.data.profileName;
    save(r);
  }
}
var cleanQr = (x) => typeof x === "string" ? x.replace(/^data:image\/\w+;base64,/, "") : "";
async function waQr(nowArg) {
  const r = rt;
  if (!r) return MODULE_OFF3;
  return exclusive(r, async () => {
    const now = clock(r, nowArg);
    const cs = await connectionState();
    if (!cs.ok) return fail3("evolution", `Evolution \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442: ${cs.error}`);
    const st = cs.data.state;
    setConn(r, st, now);
    if (st === "open") {
      r.qrCache = null;
      await refreshOwner(r, now);
      return { ok: true, state: "open", qr: null, number: numberOf(r), profile: r.profileName };
    }
    const shown = st === "absent" ? "connecting" : st;
    if (r.qrCache && now - r.qrCache.at < 1e4 && r.qrCache.state === shown) return { ok: true, state: shown, qr: r.qrCache.data };
    let qr;
    if (st === "absent") {
      const c = await createInstance();
      if (!c.ok) return fail3("evolution", `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435: ${c.error}`);
      qr = c.data?.qrcode?.base64;
    } else {
      const c = await connectInstance();
      if (!c.ok) return fail3("evolution", `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u044C QR: ${c.error}`);
      qr = c.data?.base64;
    }
    const b64 = cleanQr(qr);
    if (!b64 || !/^[A-Za-z0-9+/=]+$/.test(b64) || b64.length > 4e5) return { ok: true, state: shown, qr: null, message: "QR \u0433\u043E\u0442\u043E\u0432\u0438\u0442\u0441\u044F, \u043E\u043D \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434." };
    const data = `data:image/png;base64,${b64}`;
    r.qrCache = { at: now, state: shown, data };
    if (now - r.qrJournalAt > 5 * MIN3) {
      r.qrJournalAt = now;
      journal(r, { ev: "qr", by: "panel" });
    }
    return { ok: true, state: shown, qr: data };
  });
}
async function waLogout(nowArg) {
  const r = rt;
  if (!r) return MODULE_OFF3;
  return exclusive(r, async () => {
    const now = clock(r, nowArg);
    const x = await logoutInstance();
    if (!x.ok) return fail3("evolution", `\u041D\u0435 \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043D\u043E\u043C\u0435\u0440: ${x.error}`);
    setConn(r, "close", now);
    r.statusCache = null;
    r.pairCache = null;
    r.state.ownerJid = "";
    r.state.ownerAt = 0;
    r.profileName = "";
    r.qrCache = null;
    r.state.lastConnAlertAt = now;
    save(r);
    journal(r, { ev: "logout", by: "panel" });
    return { ok: true, message: "\u041D\u043E\u043C\u0435\u0440 \u043E\u0442\u043A\u043B\u044E\u0447\u0451\u043D. \u0420\u0430\u0441\u0441\u044B\u043B\u043A\u0430 \u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B, \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0448\u044C \u043D\u043E\u043C\u0435\u0440 \u0437\u0430\u043D\u043E\u0432\u043E \u043F\u043E QR." };
  });
}
var maskNumber = (digits) => digits.length >= 9 ? `${digits.slice(0, 4)}***${digits.slice(-4)}` : digits ? "***" : "";
var DISCONNECT_REASON = {
  401: "\u043D\u043E\u043C\u0435\u0440 \u0432\u044B\u0448\u0435\u043B \u0438\u0437 \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0445 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432 (loggedOut)",
  402: "WhatsApp \u043E\u0442\u043A\u0430\u0437\u0430\u043B \u0432 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 (\u043A\u043E\u0434 402)",
  403: "WhatsApp \u0437\u0430\u043A\u0440\u044B\u043B \u0434\u043E\u0441\u0442\u0443\u043F \u043D\u043E\u043C\u0435\u0440\u0443 (forbidden)",
  406: "WhatsApp \u043E\u0442\u043A\u0430\u0437\u0430\u043B \u0432 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 (\u043A\u043E\u0434 406)",
  408: "WhatsApp \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u0432\u043E\u0432\u0440\u0435\u043C\u044F (timedOut)",
  411: "\u0440\u0430\u0441\u0441\u0438\u043D\u0445\u0440\u043E\u043D \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432 (multideviceMismatch)",
  428: "\u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u043E (connectionClosed)",
  440: "\u0441\u0435\u0441\u0441\u0438\u044E \u043E\u0442\u043A\u0440\u044B\u043B\u0438 \u043D\u0430 \u0434\u0440\u0443\u0433\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435 (connectionReplaced)",
  500: "\u0441\u0435\u0441\u0441\u0438\u044F \u043F\u043E\u0432\u0440\u0435\u0436\u0434\u0435\u043D\u0430 (badSession)",
  515: "\u043D\u0443\u0436\u0435\u043D \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u043A (restartRequired)"
};
var NO_RECONNECT = /* @__PURE__ */ new Set([401, 402, 403, 406]);
var BAN_RE = /\bban(ned)?\b|temporar\w*[ _-]ban|\bblocked\b|suspend|account[ _-]?(restricted|disabled)/i;
function disconnectMessage(raw) {
  let o = raw;
  for (let i = 0; i < 2 && typeof o === "string" && o; i++) {
    try {
      o = JSON.parse(o);
    } catch {
      break;
    }
  }
  const m = o?.error?.output?.payload?.message ?? o?.error?.message ?? o?.message ?? "";
  return typeof m === "string" ? m.replace(/\d{8,}/g, "***").replace(/\s+/g, " ").trim().slice(0, 100) : "";
}
function describeStatus(r, state, info, infoErr, now, evoErr = "") {
  const base = { state, number: "", profile: "", since: "", reasonCode: null, reason: "", at: now, checked: hhmmOf(now) };
  if (state === "unreachable") {
    return { ...base, kind: "unreachable", tone: "bad", title: "Evolution \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442", detail: `WhatsApp-\u0441\u0435\u0440\u0432\u0438\u0441 (Evolution) \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B: ${clip(evoErr, 120)}. \u0420\u0430\u0441\u0441\u044B\u043B\u043A\u0430, \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432 \u0438 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0435 \u0437\u0430\u044F\u0432\u043E\u043A \u0441\u0442\u043E\u044F\u0442, \u043F\u043E\u043A\u0430 \u043E\u043D \u043D\u0435 \u0432\u0435\u0440\u043D\u0451\u0442\u0441\u044F. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0441\u0435\u0440\u0432\u0435\u0440.` };
  }
  if (state === "open") {
    const owner = info?.ownerJid || r.state.ownerJid;
    return {
      ...base,
      kind: "connected",
      tone: "ok",
      title: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D",
      detail: "\u041D\u043E\u043C\u0435\u0440 \u043D\u0430 \u0441\u0432\u044F\u0437\u0438. \u0420\u0430\u0441\u0441\u044B\u043B\u043A\u0430 \u0438 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u0435 \u0437\u0430\u044F\u0432\u043E\u043A \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442.",
      number: maskNumber(digitsOf2(owner)),
      profile: clip(info?.profileName || r.profileName, 60),
      since: r.state.connSince ? when(r.state.connSince) : ""
    };
  }
  if (state === "absent") {
    return { ...base, kind: "waiting", tone: "wait", title: "\u0416\u0434\u0451\u0442 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F", detail: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0435\u0449\u0451 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u043E. \u041D\u0430\u0436\u043C\u0438 \xAB\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u043F\u043E QR\xBB \u0438\u043B\u0438 \u0432\u0432\u0435\u0434\u0438 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u0438 \u043F\u043E\u043B\u0443\u0447\u0438 \u043A\u043E\u0434." };
  }
  if (state === "connecting") {
    const paired = !!info?.ownerJid;
    return {
      ...base,
      kind: "waiting",
      tone: "wait",
      title: "\u0416\u0434\u0451\u0442 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F",
      detail: paired ? "\u041D\u043E\u043C\u0435\u0440 \u0443\u0436\u0435 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D, \u0438\u0434\u0451\u0442 \u043F\u0435\u0440\u0435\u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435. \u0415\u0441\u043B\u0438 \u0441\u0442\u0430\u0442\u0443\u0441 \u043D\u0435 \u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u0431\u043E\u043B\u044C\u0448\u0435 \u043C\u0438\u043D\u0443\u0442\u044B, \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u043D\u043E\u043C\u0435\u0440 \u0437\u0430\u043D\u043E\u0432\u043E." : "QR \u0438\u043B\u0438 \u043A\u043E\u0434 \u0435\u0449\u0451 \u043D\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u044B. \u041E\u0442\u0441\u043A\u0430\u043D\u0438\u0440\u0443\u0439 QR \u0438\u043B\u0438 \u0432\u0432\u0435\u0434\u0438 \u043A\u043E\u0434 \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435."
    };
  }
  if (state !== "close") {
    return { ...base, kind: "disconnected", tone: "bad", title: "\u041E\u0442\u043A\u043B\u044E\u0447\u0451\u043D", detail: `Evolution \u043D\u0430\u0437\u0432\u0430\u043B \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \xAB${clip(state, 30)}\xBB. \u041D\u0430\u0436\u043C\u0438 \xAB\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u0435\u0439\u0447\u0430\u0441\xBB, \u0435\u0441\u043B\u0438 \u0441\u0442\u0430\u0442\u0443\u0441 \u043D\u0435 \u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F, \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u043D\u043E\u043C\u0435\u0440 \u0437\u0430\u043D\u043E\u0432\u043E.`, reason: "\u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u043E" };
  }
  if (!info) {
    return { ...base, kind: "disconnected", tone: "bad", title: "\u041E\u0442\u043A\u043B\u044E\u0447\u0451\u043D", detail: `\u041F\u0440\u0438\u0447\u0438\u043D\u0443 \u0443\u0437\u043D\u0430\u0442\u044C \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C: ${clip(infoErr, 100) || "Evolution \u043D\u0435 \u043E\u0442\u0434\u0430\u043B \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u043D\u0441\u0442\u0430\u043D\u0441\u0430"}. \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u043D\u043E\u043C\u0435\u0440 \u0437\u0430\u043D\u043E\u0432\u043E.`, reason: "\u043F\u0440\u0438\u0447\u0438\u043D\u0430 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430" };
  }
  const code = info.disconnectionReasonCode;
  const ms = info.disconnectionAt ? Date.parse(info.disconnectionAt) : NaN;
  const at = Number.isFinite(ms) ? ` (${when(ms)})` : "";
  const msg = disconnectMessage(info.disconnectionObject);
  const tail = msg ? ` \u041E\u0442\u0432\u0435\u0442 WhatsApp: ${msg}.` : "";
  if (code === 403 || BAN_RE.test(info.disconnectionObject)) {
    return {
      ...base,
      kind: "banned",
      tone: "bad",
      title: "\u041D\u043E\u043C\u0435\u0440 \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D WhatsApp",
      detail: `WhatsApp \u0437\u0430\u043A\u0440\u044B\u043B \u0434\u043E\u0441\u0442\u0443\u043F \u044D\u0442\u043E\u043C\u0443 \u043D\u043E\u043C\u0435\u0440\u0443${code ? ` (\u043A\u043E\u0434 ${code})` : ""}${at}. \u0420\u0430\u0441\u0441\u044B\u043B\u043A\u0430 \u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u044B. \u0421\u043A\u043E\u0440\u0435\u0435 \u0432\u0441\u0435\u0433\u043E, \u044D\u0442\u043E\u0442 \u043D\u043E\u043C\u0435\u0440 \u0443\u0436\u0435 \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C: \u043D\u0443\u0436\u0435\u043D \u0434\u0440\u0443\u0433\u043E\u0439 \u043D\u043E\u043C\u0435\u0440 \u0438\u043B\u0438 \u043E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u0435 \u0432 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0443 WhatsApp.${tail}`,
      reasonCode: code,
      reason: "\u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D"
    };
  }
  if (code === 401) {
    return {
      ...base,
      kind: "logged_out",
      tone: "bad",
      title: "\u041D\u043E\u043C\u0435\u0440 \u0432\u044B\u0448\u0435\u043B \u0438\u0437 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 (logout), \u043D\u0443\u0436\u043D\u043E \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0437\u0430\u043D\u043E\u0432\u043E",
      detail: `\u0421\u0435\u0441\u0441\u0438\u044E \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0438${at}: \u043D\u043E\u043C\u0435\u0440 \u0443\u0431\u0440\u0430\u043B\u0438 \u0438\u0437 \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0445 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432 \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435 \u0438\u043B\u0438 \u0432\u044B\u0448\u043B\u0438 \u0447\u0435\u0440\u0435\u0437 logout. \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u0435\u0433\u043E \u0437\u0430\u043D\u043E\u0432\u043E: \u043F\u043E QR \u0438\u043B\u0438 \u043F\u043E \u043D\u043E\u043C\u0435\u0440\u0443 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430.${tail}`,
      reasonCode: code,
      reason: "logout (401)"
    };
  }
  const why = code === null ? "\u043F\u0440\u0438\u0447\u0438\u043D\u0430 \u043D\u0435 \u0437\u0430\u043F\u0438\u0441\u0430\u043D\u0430" : DISCONNECT_REASON[code] || `\u043A\u043E\u0434 ${code}`;
  const hint = code !== null && NO_RECONNECT.has(code) ? "Evolution \u0441\u0430\u043C \u043D\u0435 \u043F\u0435\u0440\u0435\u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0441\u044F: \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u043D\u043E\u043C\u0435\u0440 \u0437\u0430\u043D\u043E\u0432\u043E." : code === null ? "\u0415\u0441\u043B\u0438 Evolution \u043D\u0435 \u0432\u0435\u0440\u043D\u0443\u043B \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0441\u0430\u043C, \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u043D\u043E\u043C\u0435\u0440 \u0437\u0430\u043D\u043E\u0432\u043E." : "Evolution \u043F\u0440\u043E\u0431\u0443\u0435\u0442 \u043F\u0435\u0440\u0435\u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F \u0441\u0430\u043C; \u0435\u0441\u043B\u0438 \u0441\u0442\u0430\u0442\u0443\u0441 \u043D\u0435 \u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F, \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u043D\u043E\u043C\u0435\u0440 \u0437\u0430\u043D\u043E\u0432\u043E.";
  return { ...base, kind: "disconnected", tone: "bad", title: "\u041E\u0442\u043A\u043B\u044E\u0447\u0451\u043D", detail: `\u041F\u0440\u0438\u0447\u0438\u043D\u0430: ${why}${at}. ${hint}${tail}`, reasonCode: code, reason: why };
}
async function waStatus(nowArg) {
  const r = rt;
  if (!r) return MODULE_OFF3;
  return exclusive(r, async () => {
    const now = clock(r, nowArg);
    const cached = r.statusCache;
    if (cached && now - cached.at < 3e3) return { ok: true, ...cached.value };
    const cs = await connectionState();
    let value;
    if (!cs.ok) {
      setConn(r, "unreachable", now);
      value = describeStatus(r, "unreachable", null, "", now, cs.error);
    } else {
      const st = cs.data.state;
      setConn(r, st, now);
      let info = null;
      let infoErr = "";
      if (st !== "absent") {
        const i = await fetchInstance();
        if (i.ok) info = i.data;
        else infoErr = i.error;
      }
      if (st === "open" && info?.ownerJid) {
        r.state.ownerJid = info.ownerJid;
        r.state.ownerAt = now;
        r.profileName = info.profileName;
        save(r);
      }
      value = describeStatus(r, st, info, infoErr, now);
    }
    r.statusCache = { at: now, value };
    return { ok: true, ...value };
  });
}
var PAIR_MIN_GAP_MS = 15e3;
var PAIR_TTL_SEC = 60;
async function waPairing(numberRaw, nowArg) {
  const r = rt;
  if (!r) return MODULE_OFF3;
  const text2 = typeof numberRaw === "number" ? String(numberRaw) : typeof numberRaw === "string" ? numberRaw : "";
  const digits = /^[\d\s+()-]+$/.test(text2) ? text2.replace(/\D/g, "") : "";
  if (digits.length < 11 || digits.length > 15) return fail3("bad_number", "\u041D\u043E\u043C\u0435\u0440: \u0442\u043E\u043B\u044C\u043A\u043E \u0446\u0438\u0444\u0440\u044B, \u043E\u0442 11 \u0434\u043E 15, \u0441 \u043A\u043E\u0434\u043E\u043C \u0441\u0442\u0440\u0430\u043D\u044B.");
  return exclusive(r, async () => {
    const now = clock(r, nowArg);
    const pc = r.pairCache;
    if (pc && pc.digits === digits && now - pc.at < PAIR_MIN_GAP_MS) {
      const left = Math.ceil((PAIR_MIN_GAP_MS - (now - pc.at)) / 1e3);
      return { ok: true, state: "connecting", pairingCode: pc.code, number: maskNumber(digits), ttlSec: PAIR_TTL_SEC, cached: true, message: `\u041A\u043E\u0434 \u0435\u0449\u0451 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442. \u041D\u043E\u0432\u044B\u0439 \u043C\u043E\u0436\u043D\u043E \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0447\u0435\u0440\u0435\u0437 ${left} \u0441.` };
    }
    const cs = await connectionState();
    if (!cs.ok) {
      setConn(r, "unreachable", now);
      return fail3("evolution", `Evolution \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442: ${cs.error}`);
    }
    const st = cs.data.state;
    setConn(r, st, now);
    r.statusCache = null;
    if (st === "open") return fail3("connected", "\u041D\u043E\u043C\u0435\u0440 \u0443\u0436\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D. \u0427\u0442\u043E\u0431\u044B \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0434\u0440\u0443\u0433\u043E\u0439, \u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u043E\u0442\u043A\u043B\u044E\u0447\u0438 \u044D\u0442\u043E\u0442.");
    const codeOf = (x) => String(x ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    let code = "";
    if (st === "absent") {
      const c = await createInstance(digits);
      if (!c.ok) return fail3("evolution", `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435: ${c.error}`);
      code = codeOf(c.data?.qrcode?.pairingCode);
    } else {
      if (st === "connecting") {
        const i = await fetchInstance();
        if (i.ok && i.data.ownerJid) return fail3("reconnecting", "\u041D\u043E\u043C\u0435\u0440 \u0443\u0436\u0435 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D, \u0438\u0434\u0451\u0442 \u043F\u0435\u0440\u0435\u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435. \u041F\u043E\u0434\u043E\u0436\u0434\u0438 \u043C\u0438\u043D\u0443\u0442\u0443 \u0438 \u043D\u0430\u0436\u043C\u0438 \xAB\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u0435\u0439\u0447\u0430\u0441\xBB.");
        await logoutInstance();
      }
      for (let attempt = 0; attempt < 3 && !code; attempt++) {
        if (attempt) await r.deps.sleep(2500);
        const c = await connectInstance(digits);
        if (!c.ok) return fail3("evolution", `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u044C \u043A\u043E\u0434: ${c.error}`);
        if (c.data?.instance?.state === "open") return { ok: true, state: "open", pairingCode: "", number: maskNumber(digits), ttlSec: 0, cached: false };
        code = codeOf(c.data?.pairingCode);
      }
    }
    if (code.length !== 8) return fail3("no_code", "Evolution \u043D\u0435 \u0432\u044B\u0434\u0430\u043B \u043A\u043E\u0434. \u041F\u043E\u0434\u043E\u0436\u0434\u0438 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0435\u043A\u0443\u043D\u0434 \u0438 \u043D\u0430\u0436\u043C\u0438 \xAB\u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u0434\xBB.");
    r.qrCache = null;
    r.pairCache = { at: now, digits, code };
    journal(r, { ev: "pair", by: "panel" });
    return { ok: true, state: "connecting", pairingCode: code, number: maskNumber(digits), ttlSec: PAIR_TTL_SEC, cached: false };
  });
}
var digitsOf2 = (x) => typeof x === "string" ? x.replace(/[:@].*$/, "").replace(/\D/g, "") : "";
function roleOfGroup(g, me) {
  if (!me) return "unknown";
  if (digitsOf2(g?.owner) === me) return "owner";
  if (!Array.isArray(g?.participants)) return "unknown";
  const mine = g.participants.find((p) => [p?.id, p?.jid, p?.phoneNumber, p?.lid].some((x) => digitsOf2(x) === me));
  if (!mine) return "unknown";
  return mine.admin === "superadmin" ? "owner" : mine.admin ? "admin" : "member";
}
var ROLE_LABEL = { owner: "\u0441\u043E\u0437\u0434\u0430\u0442\u0435\u043B\u044C", admin: "\u0430\u0434\u043C\u0438\u043D", member: "\u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A", unknown: "\u0440\u043E\u043B\u044C \u043D\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0430" };
var TYPE_LABEL = { community: "\u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E", announce: "\u0432\u043A\u043B\u0430\u0434\u043A\u0430 \u043E\u0431\u044A\u044F\u0432\u043B\u0435\u043D\u0438\u0439", subgroup: "\u0433\u0440\u0443\u043F\u043F\u0430 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0435", group: "\u0433\u0440\u0443\u043F\u043F\u0430" };
function groupView(r, g) {
  const type = g?.isCommunity === true ? "community" : g?.isCommunityAnnounce === true ? "announce" : g?.linkedParent ? "subgroup" : "group";
  const role = roleOfGroup(g, digitsOf2(r.state.ownerJid));
  const id = String(g?.id || "");
  const size = typeof g?.size === "number" && Number.isFinite(g.size) ? g.size : Array.isArray(g?.participants) ? g.participants.length : null;
  return {
    id,
    name: String(g?.subject || "\u0431\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F").slice(0, 120),
    size,
    type,
    typeLabel: TYPE_LABEL[type],
    role,
    roleLabel: ROLE_LABEL[role],
    announceOnly: g?.announce === true,
    ours: r.state.targets.some((t) => t.jid === id || t.sendJid === id)
  };
}
var GROUPS_CACHE_MS = 6e4;
var GROUPS_MIN_GAP_MS = 2e4;
async function waGroups(force = false, nowArg) {
  const r = rt;
  if (!r) return { ...MODULE_OFF3, items: [], at: 0, cached: false };
  const now = clock(r, nowArg);
  const c = r.groupsCache;
  if (c && (!force ? now - c.at < GROUPS_CACHE_MS : now - r.groupsCallAt < GROUPS_MIN_GAP_MS)) return { ok: true, message: "", items: c.items, at: c.at, cached: true };
  return exclusive(r, async () => {
    r.groupsCallAt = now;
    const cs = await connectionState();
    if (!cs.ok) return { ...fail3("evolution", `Evolution \u043D\u0435 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442: ${cs.error}`), items: c?.items ?? [], at: c?.at ?? 0, cached: !!c };
    setConn(r, cs.data.state, now);
    if (cs.data.state !== "open") return { ...fail3("no_connection", `WhatsApp \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D (${cs.data.state}). \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u043D\u043E\u043C\u0435\u0440 \u043F\u043E QR.`), items: c?.items ?? [], at: c?.at ?? 0, cached: !!c };
    if (!r.state.ownerJid) await refreshOwner(r, now);
    let res = await fetchAllGroups(true);
    if (!res.ok) res = await fetchAllGroups(false);
    if (!res.ok) return { ...fail3("evolution", `\u0421\u043F\u0438\u0441\u043E\u043A \u0433\u0440\u0443\u043F\u043F \u043D\u0435 \u043F\u043E\u043B\u0443\u0447\u0435\u043D: ${res.error}`), items: c?.items ?? [], at: c?.at ?? 0, cached: !!c };
    const rank = (g) => g.type === "community" ? 0 : g.type === "announce" ? 1 : g.type === "subgroup" ? 2 : 3;
    const items = res.data.slice(0, 300).map((g) => groupView(r, g)).filter((g) => g.id).sort((a, b) => rank(a) - rank(b) || (b.size ?? -1) - (a.size ?? -1) || a.name.localeCompare(b.name));
    r.groupsCache = { at: now, items };
    return { ok: true, message: "", items, at: now, cached: false };
  });
}
function readJsonlTail(file, maxBytes = 256 * 1024) {
  try {
    const size = (0, import_node_fs10.statSync)(file).size;
    const start = Math.max(0, size - maxBytes);
    const buf = Buffer.alloc(size - start);
    const fd = (0, import_node_fs10.openSync)(file, "r");
    try {
      (0, import_node_fs10.readSync)(fd, buf, 0, buf.length, start);
    } finally {
      (0, import_node_fs10.closeSync)(fd);
    }
    let text2 = buf.toString("utf8");
    if (start > 0) text2 = text2.slice(text2.indexOf("\n") + 1);
    const out = [];
    for (const line of text2.split("\n")) {
      const s = line.trim();
      if (!s) continue;
      try {
        out.push(JSON.parse(s));
      } catch {
      }
    }
    return out;
  } catch {
    return [];
  }
}
var JOURNAL_EVENTS = /* @__PURE__ */ new Set(["create", "send", "skip", "fail", "pause", "resume", "alarm", "mode", "daily", "event_set", "event_reset", "event_done", "logout", "qr", "pair", "conn", "ai_on", "ai_off", "ai_handoff", "ai_skip", "dz_on", "dz_off", "dz_hook", "dz_save", "dz_tpl"]);
var stampOf = (ms) => `${ddmm4(dayKeyOf(ms))} ${hhmmOf(ms)}`;
var clip = (s, n = 160) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}\u2026` : t;
};
function journalView(r, limit = 20) {
  const nameOfTarget = (id) => r.state.targets.find((t) => t.id === id)?.name || String(id || "");
  const topicOf = (id) => id === "welcome" ? "\u043F\u0440\u0438\u0432\u0435\u0442\u0441\u0442\u0432\u0438\u0435" : r.cfg.messages.find((m) => m.id === id)?.topic || String(id || "");
  const rows = readJsonlTail(fJournal(r)).filter((x) => x && JOURNAL_EVENTS.has(x.ev));
  return rows.slice(-limit).reverse().map((x) => {
    const ts = Date.parse(String(x.ts || "")) || 0;
    let kind = "info";
    let text2 = "";
    switch (x.ev) {
      case "create":
        kind = "ok";
        text2 = `\u0421\u043E\u0437\u0434\u0430\u043D\u043E \xAB${nameOfTarget(x.target) || x.name}\xBB`;
        break;
      case "send": {
        const part = x.part === "poll" ? ", \u043E\u043F\u0440\u043E\u0441" : x.part === "text" ? ", \u0442\u0435\u043A\u0441\u0442" : "";
        kind = x.ok ? "ok" : "error";
        text2 = x.ok ? `\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E \xAB${topicOf(x.msg)}\xBB${part} \u0432 ${nameOfTarget(x.target)}${x.manual ? " (\u0432\u0440\u0443\u0447\u043D\u0443\u044E)" : ""}` : x.unknown ? `\u041D\u0435\u044F\u0441\u043D\u043E, \u0443\u0448\u043B\u043E \u043B\u0438 \xAB${topicOf(x.msg)}\xBB${part} \u0432 ${nameOfTarget(x.target)}: ${clip(x.err, 100)}. \u041F\u043E\u0432\u0442\u043E\u0440\u043D\u043E \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F, \u043F\u0440\u043E\u0432\u0435\u0440\u044C \u0432 WhatsApp` : `\u041D\u0435 \u0443\u0448\u043B\u043E \xAB${topicOf(x.msg)}\xBB${part} \u0432 ${nameOfTarget(x.target)}: ${clip(x.err, 100)}`;
        break;
      }
      case "skip":
        text2 = `\u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E \xAB${topicOf(x.msg)}\xBB \u0432 ${nameOfTarget(x.target)}: \u043F\u043B\u0430\u043D\u043E\u0432\u043E\u0435 \u0432\u0440\u0435\u043C\u044F ${x.plan} \u0432\u043D\u0435 \u043E\u043A\u043D\u0430 \u043E\u0442 09:00 \u0434\u043E 23:45`;
        break;
      case "fail":
        kind = "error";
        text2 = `\u041E\u0448\u0438\u0431\u043A\u0430 ${x.n} \u043F\u043E\u0434\u0440\u044F\u0434: ${clip(x.what, 80)}: ${clip(x.err, 100)}`;
        break;
      case "pause":
        kind = "error";
        text2 = `\u041F\u0430\u0443\u0437\u0430: ${clip(x.reason, 120)}`;
        break;
      case "resume":
        text2 = "\u041F\u0430\u0443\u0437\u0430 \u0441\u043D\u044F\u0442\u0430";
        break;
      case "alarm":
        kind = "error";
        text2 = `\u0422\u0440\u0435\u0432\u043E\u0433\u0430: ${clip(x.text, 140)}`;
        break;
      case "mode":
        text2 = x.mode === "event" ? "\u0420\u0435\u0436\u0438\u043C: \u0436\u0438\u0432\u043E\u0439 \u044D\u0444\u0438\u0440" : "\u0420\u0435\u0436\u0438\u043C: \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0439";
        break;
      case "daily":
        text2 = `\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435: ${x.enabled ? "\u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E" : "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E"}`;
        break;
      case "event_set":
        text2 = `\u0416\u0438\u0432\u043E\u0439 \u044D\u0444\u0438\u0440: ${ddmm4(String(x.date))} \u0432 ${x.start}, \u043D\u0430\u0431\u043E\u0440 \u0441 ${ddmm4(String(x.recruitFrom))}`;
        break;
      case "event_reset":
        text2 = "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0436\u0438\u0432\u043E\u0433\u043E \u044D\u0444\u0438\u0440\u0430 \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B";
        break;
      case "event_done":
        text2 = `\u0416\u0438\u0432\u043E\u0439 \u044D\u0444\u0438\u0440 ${ddmm4(String(x.date))} \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D, \u0441\u0441\u044B\u043B\u043A\u0430 \u0441\u043D\u043E\u0432\u0430 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u0430\u044F`;
        break;
      case "logout":
        kind = "error";
        text2 = "\u041D\u043E\u043C\u0435\u0440 \u043E\u0442\u043A\u043B\u044E\u0447\u0451\u043D";
        break;
      case "qr":
        text2 = "\u0417\u0430\u043F\u0440\u043E\u0448\u0435\u043D QR \u0434\u043B\u044F \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043D\u043E\u043C\u0435\u0440\u0430";
        break;
      case "pair":
        text2 = "\u0417\u0430\u043F\u0440\u043E\u0448\u0435\u043D \u043A\u043E\u0434 \u0434\u043B\u044F \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043D\u043E\u043C\u0435\u0440\u0430 \u043F\u043E \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0443";
        break;
      case "conn":
        kind = x.state === "open" ? "ok" : "error";
        text2 = x.state === "open" ? "WhatsApp \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0451\u043D" : `\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435: ${x.state}`;
        break;
      case "ai_on":
        kind = "ok";
        text2 = "\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u0432\u043A\u043B\u044E\u0447\u0451\u043D";
        break;
      case "ai_off":
        text2 = "\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D";
        break;
      case "ai_handoff":
        text2 = `\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043F\u0435\u0440\u0435\u0434\u0430\u043B ${clip(x.who, 24)} \u0410\u044F\u043D\u0435: ${clip(x.why, 100)}. \u041C\u043E\u043B\u0447\u0438\u0442 \u0441 \u043D\u0438\u043C 12 \u0447\u0430\u0441\u043E\u0432`;
        break;
      case "ai_skip":
        text2 = `\u0418\u0418-\u0430\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B ${clip(x.who, 24)}: ${clip(x.why, 60)}`;
        break;
      case "dz_on":
        kind = "ok";
        text2 = "\u0414\u043E\u0436\u0438\u043C WABA \u0432\u043A\u043B\u044E\u0447\u0451\u043D";
        break;
      case "dz_off":
        text2 = "\u0414\u043E\u0436\u0438\u043C WABA \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D";
        break;
      case "dz_hook":
        kind = x.on ? "ok" : "info";
        text2 = x.on ? "\u0412\u0435\u0431\u0445\u0443\u043A Wazzup \u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D" : "\u0412\u0435\u0431\u0445\u0443\u043A Wazzup \u0441\u043D\u044F\u0442";
        break;
      case "dz_save":
        text2 = `\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0434\u043E\u0436\u0438\u043C\u0430 WABA \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B: \u0448\u0430\u0431\u043B\u043E\u043D \xAB${clip(x.template, 60)}\xBB`;
        break;
      case "dz_tpl":
        text2 = `\u0428\u0430\u0431\u043B\u043E\u043D WABA \xAB${clip(x.name, 60)}\xBB: \u0441\u0442\u0430\u0442\u0443\u0441 ${clip(x.status, 30) || "\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D"}`;
        break;
    }
    return { ts, t: ts ? stampOf(ts) : "", kind, text: text2 };
  });
}
function nextDailyCreate(r, now) {
  if (r.state.mode !== "daily" || !r.state.daily.enabled) return null;
  const c = tcfg(r);
  const today = dayKeyOf(now);
  for (let i = 0; i < 14; i++) {
    const day = addDays(today, i);
    if (!isStreamDay(day, c) || r.state.targets.some((t) => t.day === day)) continue;
    const at = createAtOf(r, day);
    if ((now < at || createWindowOpen(r, at, now)) && now < closeAtOf(r, day)) return { day, at };
  }
  return null;
}
function cardOf(r, t, now, serving) {
  return {
    id: t.id,
    name: t.name,
    day: t.day,
    dayLabel: ddmm4(t.day),
    kind: t.kind,
    source: t.source ?? "daily",
    ready: isReady(t),
    link: isReady(t) ? t.link : "",
    onSite: serving?.id === t.id,
    members: t.members ?? null,
    membersAgo: t.membersAt ? agoText3(now - t.membersAt) : "",
    joinedToday: r.joinedByDay.get(t.id)?.get(dayKeyOf(now)) ?? 0,
    joinedTotal: r.joinedCount.get(t.id) ?? 0
  };
}
function waPanel(nowArg) {
  const r = rt;
  if (!r) return waEnabled() ? { ok: true, enabled: true, running: false, error: initError || "\u043C\u043E\u0434\u0443\u043B\u044C \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D" } : { ok: true, enabled: false };
  const now = clock(r, nowArg);
  const today = dayKeyOf(now);
  const c = tcfg(r);
  const st = r.state;
  const ev = st.event;
  const serving = servingTarget(r, now);
  const link = waGroupLink(now, false);
  const evTarget = eventTarget(r);
  const startEff = ev.start || r.cfg.streamStart;
  const eventStart = st.mode === "event" ? evTarget?.start ?? (startEff !== r.cfg.streamStart ? startEff : void 0) : void 0;
  let evStatus = "unset";
  let evText = "\u042D\u0444\u0438\u0440 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D. \u0423\u043A\u0430\u0436\u0438 \u0434\u0430\u0442\u0443, \u0432\u0440\u0435\u043C\u044F \u0441\u0442\u0430\u0440\u0442\u0430 \u0438 \u0434\u0435\u043D\u044C \u043D\u0430\u0447\u0430\u043B\u0430 \u043D\u0430\u0431\u043E\u0440\u0430, \u043F\u043E\u0442\u043E\u043C \u0441\u043E\u0445\u0440\u0430\u043D\u0438.";
  if (ev.done) {
    evStatus = "done";
    evText = `\u042D\u0444\u0438\u0440 ${ddmm4(ev.date)} \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D${ev.doneAt ? ` (${when(ev.doneAt)})` : ""}. \u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u0441\u043D\u043E\u0432\u0430 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u0430\u044F.`;
  } else if (ev.date) {
    const startAt = atTime(ev.date, startEff);
    if (st.mode !== "event") {
      evStatus = "inactive";
      evText = `\u042D\u0444\u0438\u0440 ${ddmm4(ev.date)} \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D, \u043D\u043E \u0441\u0435\u0439\u0447\u0430\u0441 \u0432\u043A\u043B\u044E\u0447\u0451\u043D \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u044B\u0439 \u0440\u0435\u0436\u0438\u043C.`;
    } else if (!evTarget) {
      if (now < eventCreateAt(r)) {
        evStatus = "scheduled";
        evText = `\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0431\u0443\u0434\u0435\u0442 \u0441\u043E\u0437\u0434\u0430\u043D\u043E ${when(eventCreateAt(r))}. \u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u043F\u043E\u0432\u0435\u0434\u0451\u0442 \u0432 \u043D\u0435\u0433\u043E \u0441\u0440\u0430\u0437\u0443 \u043F\u043E\u0441\u043B\u0435 \u044D\u0442\u043E\u0433\u043E.`;
      } else {
        evStatus = "creating";
        evText = st.paused ? "\u0412\u0440\u0435\u043C\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043D\u0430\u0441\u0442\u0443\u043F\u0438\u043B\u043E, \u043D\u043E \u043C\u043E\u0434\u0443\u043B\u044C \u043D\u0430 \u043F\u0430\u0443\u0437\u0435. \u0421\u043D\u0438\u043C\u0438 \u043F\u0430\u0443\u0437\u0443." : !daytime(now) ? "\u0412\u0440\u0435\u043C\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043D\u0430\u0441\u0442\u0443\u043F\u0438\u043B\u043E, \u043D\u043E \u0441\u0435\u0439\u0447\u0430\u0441 \u043D\u043E\u0447\u044C: \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0441\u043E\u0437\u0434\u0430\u043C \u043F\u043E\u0441\u043B\u0435 09:00 \u043F\u043E \u0410\u043B\u043C\u0430\u0442\u044B \u0438\u043B\u0438 \u043D\u0430\u0436\u043C\u0438 \xAB\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0435\u0439\u0447\u0430\u0441\xBB." : "\u0412\u0440\u0435\u043C\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043D\u0430\u0441\u0442\u0443\u043F\u0438\u043B\u043E: \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0441\u043E\u0437\u0434\u0430\u0451\u0442\u0441\u044F (\u0434\u043E 30 \u0441\u0435\u043A\u0443\u043D\u0434) \u0438\u043B\u0438 \u043D\u0430\u0436\u043C\u0438 \xAB\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0435\u0439\u0447\u0430\u0441\xBB.";
      }
    } else if (now < startAt) {
      evStatus = "recruiting";
      evText = "\u0418\u0434\u0451\u0442 \u043D\u0430\u0431\u043E\u0440: \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u0432\u0435\u0434\u0451\u0442 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u044D\u0444\u0438\u0440\u0430.";
    } else if (now < startAt + r.cfg.streamMinutes * MIN3) {
      evStatus = "live";
      evText = "\u042D\u0444\u0438\u0440 \u0438\u0434\u0451\u0442. \u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u0432\u0441\u0451 \u0435\u0449\u0451 \u0432\u0435\u0434\u0451\u0442 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E.";
    } else {
      evStatus = "after";
      evText = `\u042D\u0444\u0438\u0440 \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B\u0441\u044F. \u041E\u0444\u0444\u0435\u0440\u044B \u0441\u0435\u0440\u0438\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u044E\u0442 \u0434\u043E 00:00, \u043F\u043E\u0442\u043E\u043C \u0440\u0435\u0436\u0438\u043C \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0441\u044F \u0438 \u0441\u0441\u044B\u043B\u043A\u0430 \u0432\u0435\u0440\u043D\u0451\u0442\u0441\u044F \u043D\u0430 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u0443\u044E.`;
    }
  }
  const dz = dzPanel(now);
  const signupsOf = (day) => dz.days?.find((x) => x.day === day) ?? null;
  const cardsOf2 = (day) => [...targetsOf(r, day)].reverse().filter((t) => st.mode === "event" || t.source !== "event").map((t) => cardOf(r, t, now, serving));
  let current = null;
  let next = null;
  if (st.mode === "event") {
    if (ev.date) {
      const cards = cardsOf2(ev.date);
      current = { title: "\u0421\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0436\u0438\u0432\u043E\u0433\u043E \u044D\u0444\u0438\u0440\u0430", day: ev.date, dayLabel: ddmm4(ev.date), cards, pending: cards.length ? "" : evText, signups: signupsOf(ev.date) };
    }
  } else {
    const cur = isStreamDay(today, c) ? today : assignStreamDay(now, c);
    const nxt = nextStreamAfter(r, cur);
    const pend = (day) => r.state.daily.enabled ? `\u0411\u0443\u0434\u0435\u0442 \u0441\u043E\u0437\u0434\u0430\u043D\u043E ${when(createAtOf(r, day))}.` : "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u043E, \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u0451\u0442\u0441\u044F.";
    const mk = (title, day) => {
      const cards = cardsOf2(day);
      return { title, day, dayLabel: ddmm4(day), cards, pending: cards.length ? "" : pend(day), signups: signupsOf(day) };
    };
    current = mk("\u042D\u0444\u0438\u0440", cur);
    next = mk("\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0439 \u044D\u0444\u0438\u0440", nxt);
  }
  const series2 = r.cfg.messages.map((m) => {
    const e = effMsg(r, { start: eventStart }, m);
    return { id: m.id, at: hhmmOf(planOf(r, { day: "2000-01-01", start: eventStart }, m)), topic: m.topic || m.id, text: e.text, media: m.media?.type ?? null, poll: m.poll ? m.poll.name : null, enabled: m.enabled !== false };
  });
  const nm = nextMessage(r, now);
  const targets = currentTargets(r, now).list;
  let templateClicks = 0;
  try {
    templateClicks = getStore().tyCount(today, "wa-template");
  } catch {
  }
  return {
    ok: true,
    enabled: true,
    running: true,
    now,
    today,
    updated: hhmmOf(now),
    tz: "Asia/Almaty",
    module: {
      paused: st.paused,
      pausedReason: st.pausedReason,
      failStreak: st.failStreak,
      failMax: r.cfg.retry.pauseAfter,
      creationsToday: dayCreations(r, now),
      creationsMax: r.cfg.maxNewPerDay,
      pendingCreate: !!st.pendingCreate,
      kind: r.cfg.target
    },
    conn: { state: r.conn.state, at: r.conn.at, ago: r.conn.at ? agoText3(now - r.conn.at) : "", number: r.conn.state === "open" ? numberOf(r) : "", profile: r.conn.state === "open" ? r.profileName : "" },
    /** Последний статус подключения из памяти (без запроса к Evolution): пульт показывает его сразу, пока приходит свежий. */
    status: r.statusCache ? r.statusCache.value : null,
    mode: st.mode,
    daily: { enabled: st.daily.enabled, next: (() => {
      const n = nextDailyCreate(r, now);
      return n ? { day: n.day, dayLabel: ddmm4(n.day), at: n.at, text: when(n.at) } : null;
    })() },
    event: {
      date: ev.date,
      dateLabel: ev.date ? ddmm4(ev.date) : "",
      start: startEff,
      startDefault: r.cfg.streamStart,
      recruitFrom: ev.recruitFrom,
      recruitLabel: ev.recruitFrom ? ddmm4(ev.recruitFrom) : "",
      createTime: EVENT_CREATE_AT,
      createAt: ev.recruitFrom ? eventCreateAt(r) : 0,
      status: evStatus,
      statusText: evText,
      locked: !!(ev.communityId && evTarget),
      hasCommunity: !!evTarget,
      done: !!ev.done
    },
    link: {
      url: link ?? "",
      kind: link ? st.mode === "event" ? "event" : "daily" : "permanent",
      text: link ? st.mode === "event" ? "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u0432\u0435\u0434\u0451\u0442 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0436\u0438\u0432\u043E\u0433\u043E \u044D\u0444\u0438\u0440\u0430." : "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u0432\u0435\u0434\u0451\u0442 \u0432 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0433\u043E \u043D\u0430\u0431\u043E\u0440\u0430." : "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0441\u0430\u0439\u0442\u0435 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u0430\u044F: \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0435\u0433\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 \u043D\u0435\u0442.",
      /** Постоянная ссылка для кнопки шаблона WABA: страница переадресует туда же, куда ведёт сайт, а при сбое на постоянную. */
      templateUrl: TEMPLATE_URL,
      templateClicksToday: templateClicks
    },
    current,
    next,
    nextMessage: nm ? { id: nm.id, topic: nm.topic, at: hhmmOf(nm.plan), dayLabel: ddmm4(nm.day), inText: inText(nm.plan - now) } : null,
    sendTo: targets.map((t) => t.name),
    series: series2,
    assistant: aiPanel(now),
    dozhim: dzPanel(now),
    journal: journalView(r, 20)
  };
}

// form-api/wa-admin.ts
var MAX_BODY = 8192;
var STATUS = {
  bad_request: 400,
  bad_number: 400,
  bad_date: 400,
  bad_start: 400,
  bad_recruit: 400,
  bad_id: 400,
  no_id: 400,
  confirm: 400,
  evolution: 502,
  wazzup: 502,
  model: 502,
  rate: 429,
  not_found: 404,
  internal: 500
};
var statusOf = (a) => a.ok ? 200 : STATUS[a.code || ""] ?? 409;
async function readBody(req) {
  const raw = await adminReadBody(req, MAX_BODY);
  if (raw === null) return null;
  if (!raw.trim()) return {};
  try {
    const x = JSON.parse(raw);
    return x && typeof x === "object" && !Array.isArray(x) ? x : null;
  } catch {
    return null;
  }
}
var NEED_CONFIRM = { ok: false, code: "confirm", message: "\u041D\u0443\u0436\u043D\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F." };
async function handleWaAdmin(req, res, path) {
  const gate = gateAdminSession(req);
  if (!gate.ok) return adminJson(res, gate.status, gate.body);
  const what = path.replace(/^\/api\/admin\/wa\//, "").replace(/\/+$/, "");
  const method = req.method || "GET";
  try {
    if (method === "GET") {
      const qs = new URL(req.url || "/", "http://localhost").searchParams;
      if (what === "state") return adminJson(res, 200, waPanel());
      if (what === "connection") {
        const x = await waConnection();
        return adminJson(res, statusOf(x), x);
      }
      if (what === "status") {
        const x = await waStatus();
        return adminJson(res, statusOf(x), x);
      }
      if (what === "groups") {
        const x = await waGroups(qs.get("refresh") === "1");
        return adminJson(res, statusOf(x), x);
      }
      if (what === "ai/number") {
        const x = aiNumber(qs.get("id"));
        return adminJson(res, statusOf(x), x);
      }
      if (what === "dozhim/templates") {
        const x = await dzTemplates(qs.get("refresh") === "1");
        return adminJson(res, statusOf(x), x);
      }
      return adminJson(res, 404, { ok: false, error: "not_found" });
    }
    if (method !== "POST") return adminJson(res, 405, { ok: false, error: "method" });
    const body = await readBody(req);
    if (body === null) return adminJson(res, 400, { ok: false, code: "bad_request", message: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0437\u0430\u043F\u0440\u043E\u0441." });
    const confirmed = body.confirm === true;
    const done = (x) => adminJson(res, statusOf(x), x);
    switch (what) {
      case "qr": {
        const x = await waQr();
        return adminJson(res, statusOf(x), x);
      }
      case "pairing": {
        const x = await waPairing(body.number);
        return adminJson(res, statusOf(x), x);
      }
      case "logout":
        return confirmed ? done(await waLogout()) : done(NEED_CONFIRM);
      case "mode":
        return confirmed ? done(waSetMode(body.mode)) : done(NEED_CONFIRM);
      case "daily":
        return body.enabled === false || confirmed ? done(waSetDaily(body.enabled)) : done(NEED_CONFIRM);
      case "daily/create":
        return confirmed ? done(await waDailyCreateNow()) : done(NEED_CONFIRM);
      case "event":
        return done(waSetEvent({ date: body.date, start: body.start, recruitFrom: body.recruitFrom }));
      case "event/create":
        return confirmed ? done(await waEventCreateNow()) : done(NEED_CONFIRM);
      case "event/reset":
        return confirmed ? done(waEventReset()) : done(NEED_CONFIRM);
      case "pause":
        return done(waPause());
      case "resume":
        return done(waResume());
      case "send": {
        if (!confirmed) return done(NEED_CONFIRM);
        const x = await waSendSeries(body.id);
        return adminJson(res, statusOf(x), x);
      }
      case "ai/toggle":
        return body.enabled === false || confirmed ? done(await aiSetEnabled(body.enabled)) : done(NEED_CONFIRM);
      case "ai/test": {
        const x = await aiTest(body.question);
        return adminJson(res, statusOf(x), x);
      }
      case "dozhim/toggle":
        return body.enabled === false || confirmed ? done(await dzSetEnabled(body.enabled)) : done(NEED_CONFIRM);
      case "dozhim/save":
        return done(await dzSave(body));
      case "dozhim/hook":
        return body.on === false || confirmed ? done(await dzHookSet(body.on)) : done(NEED_CONFIRM);
      case "dozhim/test":
        return confirmed ? done(await dzTestSend(body.number)) : done(NEED_CONFIRM);
    }
    return adminJson(res, 404, { ok: false, error: "not_found" });
  } catch (e) {
    console.error("[wa-admin] \u043E\u0448\u0438\u0431\u043A\u0430:", String(e?.message || e).slice(0, 200));
    if (!res.headersSent) adminJson(res, 500, { ok: false, code: "internal", message: "\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437." });
  }
}

// form-api/server.ts
function loadEnv() {
  try {
    const raw = (0, import_node_fs11.readFileSync)(process.env.FORM_API_ENV || (0, import_node_path11.join)(__dirname, ".env"), "utf8");
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
var MAX_BODY2 = 64 * 1024;
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
function readBody2(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY2) {
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
    return JSON.parse(await readBody2(req));
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
  const cleanName2 = name.trim();
  const cleanPhone = phone.trim();
  const cleanTelegram = normalizeTelegram(payload.telegram);
  const siteUrl = eventSourceUrl || req.headers.referer || req.headers.origin || "https://onai.academy/workshop";
  const forwarded = req.headers["x-forwarded-for"];
  const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.headers["x-real-ip"] || void 0;
  const userAgent = req.headers["user-agent"] || void 0;
  const metaEventId = eventId || (0, import_node_crypto7.randomUUID)();
  const fbclid = fbc ? fbc.split(".").slice(3).join(".") || void 0 : void 0;
  const captured = await captureLead({
    eventId: metaEventId,
    name: cleanName2,
    phone: cleanPhone,
    source,
    utm,
    fbclid,
    ...cleanTelegram ? { telegram: cleanTelegram } : {}
  });
  void Promise.allSettled([
    persistAmoLead(captured),
    sendLeadEvent({
      name: cleanName2,
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
    console.log("[lead] name=%s phone=***%s tg=%s source=%s crm=%s capi=%s", cleanName2, cleanPhone.slice(-4), cleanTelegram ? "yes" : "no", source, crmStatus, capiStatus);
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
    const { utm, telegram } = unpackUtm(row.utm);
    const lead = {
      id: row.id,
      eventId: row.event_id ?? void 0,
      name: row.name,
      phone: row.phone,
      source: row.source ?? void 0,
      utm,
      fbclid: row.fbclid ?? void 0,
      ...telegram ? { telegram } : {}
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
  return json(res, 200, { link: waGroupLink() ?? readWhatsAppLink() }, { "Cache-Control": "no-store, max-age=0" });
}
var TG_SECRET = process.env.TG_LINK_WEBHOOK_SECRET || "";
var TG_OWNER_IDS = (process.env.TG_LINK_OWNER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
function secretOk2(provided) {
  if (!TG_SECRET || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(TG_SECRET);
  if (a.length !== b.length) return false;
  return (0, import_node_crypto7.timingSafeEqual)(a, b);
}
function webhookReply(res, chatId, text2) {
  return json(res, 200, { method: "sendMessage", chat_id: chatId, text: text2, disable_web_page_preview: true });
}
function extractUrl(text2) {
  const m = text2.match(/https?:\/\/\S+/);
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
  const text2 = (msg?.text || "").trim();
  if (!fromId || TG_OWNER_IDS.length === 0 || !TG_OWNER_IDS.includes(String(fromId))) {
    return json(res, 200, { ok: true });
  }
  const url = extractUrl(text2);
  if (!url) {
    const cur = readWhatsAppRecord();
    const when2 = cur.updatedAt ? `
\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430: ${cur.updatedAt}` : "\n(\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E, \u0444\u0430\u0439\u043B \u0435\u0449\u0451 \u043D\u0435 \u043C\u0435\u043D\u044F\u043B\u0441\u044F)";
    return webhookReply(res, chatId, `\u041F\u0440\u0438\u0448\u043B\u0438 \u043D\u043E\u0432\u0443\u044E \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 WhatsApp-\u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u2014 \u043F\u043E\u0434\u0441\u0442\u0430\u0432\u043B\u044E \u0435\u0451 \u043D\u0430 thank-you \u0432\u043E\u0440\u043A\u0448\u043E\u043F\u0430.

\u0422\u0435\u043A\u0443\u0449\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430:
${cur.link}${when2}`);
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
    return (0, import_node_fs11.readFileSync)((0, import_node_path11.join)(__dirname, "VERSION"), "utf8").trim() || "dev";
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
      waGroups: waHealth(),
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
    if ((method === "GET" || method === "HEAD") && url === "/api/admin-app") return handleAdminApp(req, res);
    if ((method === "GET" || method === "HEAD") && url === "/api/tg-web-app.js") return handleTgSdk(req, res);
    if (method === "POST" && url === "/api/admin/login") return await handleAdminLogin(req, res);
    if (method === "POST" && url === "/api/wa-hook") return await handleWaHook(req, res);
    if (url === "/api/wazzup-hook") return await handleWazzupHook(req, res);
    if (url.startsWith("/api/admin/wa/")) return await handleWaAdmin(req, res, url);
    if (method === "GET" && url.startsWith("/api/admin/")) return handleAdminData(req, res, url);
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
try {
  startWaGroups();
} catch (err) {
  console.error("[form-api] \u043C\u043E\u0434\u0443\u043B\u044C WhatsApp \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D:", err);
}
server.listen(PORT, HOST, () => {
  console.log(`[form-api] listening on http://${HOST}:${PORT}`);
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  server
});
