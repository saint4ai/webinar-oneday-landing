"use strict";

// form-api/tg-setup.ts
var import_node_fs = require("node:fs");
var import_node_path = require("node:path");

// form-api/tg-time.ts
var DEFAULT_OFFSET_MIN = 300;
var offsetMs = DEFAULT_OFFSET_MIN * 6e4;

// form-api/tg-workshop.ts
var env = (k) => (process.env[k] || "").trim();
var botToken = () => env("TG_WORKSHOP_BOT_TOKEN");
var webhookSecret = () => env("TG_WORKSHOP_WEBHOOK_SECRET");
var apiBase = () => env("TG_API_BASE").replace(/\/+$/, "") || "https://api.telegram.org";
var MAX_UPDATE_BODY = 64 * 1024;
var API_TIMEOUT_MS = 1e4;
var OTHER_THROTTLE_MS = 10 * 6e4;
var CONNECT_FAIL_CODES = /* @__PURE__ */ new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN", "ENETUNREACH", "EHOSTUNREACH", "UND_ERR_CONNECT_TIMEOUT"]);
var scrub = (s) => {
  const t = botToken();
  return t ? s.split(t).join("***") : s;
};
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

// form-api/tg-setup.ts
var WEBHOOK_URL = "https://onai.academy/workshop/api/tg-workshop";
var DESCRIPTION = "\u0411\u043E\u0442 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E\u0433\u043E \u0432\u043E\u0440\u043A\u0448\u043E\u043F\u0430 \xAB\u0412\u0430\u0439\u0431-\u043F\u0440\u043E\u0434\u0430\u043A\u0448\u0435\u043D\xBB. \u041F\u0440\u0438\u0448\u043B\u044E \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 \u044D\u0444\u0438\u0440, \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u044F \u0438 \u0443\u0441\u043B\u043E\u0432\u0438\u044F \u0434\u043B\u044F \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \xAB\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C\xBB.";
var SHORT_DESCRIPTION = "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0432\u043E\u0440\u043A\u0448\u043E\u043F \xAB\u0412\u0430\u0439\u0431-\u043F\u0440\u043E\u0434\u0430\u043A\u0448\u0435\u043D\xBB \u0438 \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u044F";
function loadEnv() {
  try {
    const raw = (0, import_node_fs.readFileSync)(process.env.FORM_API_ENV || (0, import_node_path.join)(__dirname, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const eq = s.indexOf("=");
      if (eq < 1) continue;
      const key = s.slice(0, eq).trim();
      if (process.env[key] === void 0) process.env[key] = s.slice(eq + 1).trim();
    }
  } catch {
    console.warn("[tg-setup] .env \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D, \u0440\u0430\u0431\u043E\u0442\u0430\u044E \u043D\u0430 \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F");
  }
}
var failures = 0;
function report(step, r, note = "") {
  if (r.ok) console.log(`OK    ${step}${note ? ` (${note})` : ""}`);
  else {
    failures++;
    console.log(`FAIL  ${step}: ${r.code} ${r.description}`);
  }
}
async function main() {
  loadEnv();
  if (!botToken()) {
    console.error("\u041D\u0435\u0442 TG_WORKSHOP_BOT_TOKEN: \u0434\u043E\u043F\u0438\u0441\u0430\u0442\u044C \u0432 .env \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C.");
    process.exit(1);
  }
  if (!webhookSecret()) {
    console.error("\u041D\u0435\u0442 TG_WORKSHOP_WEBHOOK_SECRET: \u0434\u043E\u043F\u0438\u0441\u0430\u0442\u044C \u0432 .env \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C.");
    process.exit(1);
  }
  report(
    `1/6 setWebhook ${WEBHOOK_URL}`,
    await botCall("setWebhook", {
      url: WEBHOOK_URL,
      secret_token: webhookSecret(),
      allowed_updates: ["message", "callback_query", "my_chat_member"]
    })
  );
  const photoPath = process.argv[2] || process.env.BOT_AVATAR_FILE || (0, import_node_path.join)(__dirname, "ava-studio.jpg");
  if ((0, import_node_fs.existsSync)(photoPath)) {
    const form = new FormData();
    form.append("photo", JSON.stringify({ type: "static", photo: "attach://avatar" }));
    form.append("avatar", new Blob([new Uint8Array((0, import_node_fs.readFileSync)(photoPath))], { type: "image/jpeg" }), (0, import_node_path.basename)(photoPath));
    report("2/6 setMyProfilePhoto", await botCall("setMyProfilePhoto", form, 3e4), (0, import_node_path.basename)(photoPath));
  } else {
    failures++;
    console.log(`FAIL  2/6 setMyProfilePhoto: \u0444\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D: ${photoPath} (\u043F\u0443\u0442\u044C \u043F\u0435\u0440\u0435\u0434\u0430\u0451\u0442\u0441\u044F \u0430\u0440\u0433\u0443\u043C\u0435\u043D\u0442\u043E\u043C)`);
  }
  report("3/6 setMyDescription", await botCall("setMyDescription", { description: DESCRIPTION }));
  report("4/6 setMyShortDescription", await botCall("setMyShortDescription", { short_description: SHORT_DESCRIPTION }));
  report(
    "5/6 setMyCommands",
    await botCall("setMyCommands", {
      commands: [
        { command: "start", description: "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F \u043D\u0430 \u0432\u043E\u0440\u043A\u0448\u043E\u043F" },
        { command: "stop", description: "\u041D\u0435 \u043F\u0440\u0438\u0441\u044B\u043B\u0430\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F" }
      ]
    })
  );
  const wh = await botCall("getWebhookInfo", {});
  report("6/6 getWebhookInfo", wh);
  if (wh.ok) {
    const w = wh.result;
    console.log(`      url: ${w.url}`);
    console.log(`      pending_update_count: ${w.pending_update_count}`);
    console.log(`      allowed_updates: ${JSON.stringify(w.allowed_updates)}`);
    console.log(`      last_error_message: ${w.last_error_message ?? "\u043D\u0435\u0442"}`);
  }
  const me = await botCall("getMe", {});
  report("      getMe", me);
  if (me.ok) console.log(`      id: ${me.result.id}, @${me.result.username}, \u0438\u043C\u044F: ${me.result.first_name}`);
  console.log(failures ? `
\u041D\u0435 \u043F\u0440\u043E\u0448\u043B\u043E \u0448\u0430\u0433\u043E\u0432: ${failures}` : "\n\u0412\u0441\u0435 \u0448\u0430\u0433\u0438 \u043F\u0440\u043E\u0448\u043B\u0438.");
  process.exitCode = failures ? 1 : 0;
}
main().catch((e) => {
  console.error("[tg-setup] \u0441\u0431\u043E\u0439:", String(e?.message || e).split(botToken() || "\0").join("***"));
  process.exitCode = 1;
});
