/**
 * Персист-слой лидов (надёжность):
 *  1) Локальный JSONL write-ahead log — синхронный append, без сети,
 *     практически не может транзиентно упасть. Главная страховка «не потерять».
 *  2) Supabase `workshop_leads` — изменяемое состояние/очередь (status/retry),
 *     и то, что владелец читает для ручного пересоздания.
 *
 * ENV:
 *   LEADS_LOG_PATH=/var/lib/workshop/leads.jsonl   (на сервере; локально — ./.data/leads.jsonl)
 */
import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import {
  insertLead,
  updateLead,
  bulkInsertIgnore,
  type LeadRow,
} from "@/lib/supabase-rest";
import { normalizeTelegram, packUtm } from "@/lib/leads/telegram-nick";

const LOG_PATH = process.env.LEADS_LOG_PATH || "/var/lib/workshop/leads.jsonl";

export type CapturedLead = {
  id: string;
  eventId?: string;
  name: string;
  phone: string;
  source?: string;
  utm?: Record<string, string>;
  fbclid?: string;
  /** Ник в Telegram для связи, уже проверенный (normalizeTelegram). Не указан: поля нет. */
  telegram?: string;
};

/** Локальный write-ahead: одна строка JSON. Никогда не теряем сырьё. */
function appendWal(entry: Record<string, unknown>): void {
  try {
    mkdirSync(dirname(LOG_PATH), { recursive: true });
    appendFileSync(
      LOG_PATH,
      JSON.stringify({ ...entry, ts: new Date().toISOString() }) + "\n"
    );
  } catch (e) {
    console.error("[leads] WAL append failed:", e);
  }
}

/** Persist-first: сначала WAL, затем best-effort строка в Supabase (status=pending). */
export async function captureLead(
  input: Omit<CapturedLead, "id">
): Promise<CapturedLead> {
  const id = randomUUID();
  const lead: CapturedLead = { id, ...input };
  appendWal({ kind: "capture", ...lead });

  const row: LeadRow = {
    id,
    event_id: input.eventId ?? null,
    name: input.name,
    phone: input.phone,
    source: input.source ?? null,
    // В workshop_leads нет колонки под Telegram: ник едет в jsonb utm (ключ telegram), без миграции.
    utm: packUtm(input.utm, input.telegram),
    fbclid: input.fbclid ?? null,
    status: "pending",
    retry_count: 0,
  };
  const r = await insertLead(row);
  if (!r.ok) {
    appendWal({ kind: "supabase_insert_failed", id, reason: r.reason });
    console.error("[leads] supabase insert failed:", r.reason);
  }
  return lead;
}

export async function markDone(id: string, amocrmLeadId?: number | null): Promise<void> {
  await updateLead(id, {
    status: "done",
    amocrm_lead_id: amocrmLeadId ?? null,
    last_error: null,
  });
}

export async function markFailed(id: string, error: string): Promise<void> {
  await updateLead(id, { status: "failed", last_error: error.slice(0, 500) });
}

export async function incrementRetry(
  id: string,
  current: number,
  error?: string
): Promise<void> {
  await updateLead(id, {
    retry_count: current + 1,
    status: "failed",
    ...(error ? { last_error: error.slice(0, 500) } : {}),
  });
}

export async function markAlertSent(id: string): Promise<void> {
  await updateLead(id, { status: "alert_sent" });
}

/**
 * Сверка WAL → Supabase: гарантирует, что каждый captured-лид есть в очереди,
 * даже если Supabase-insert при захвате упал. Конфликты по id игнорируются,
 * поэтому уже обработанные строки (done/...) не сбрасываются.
 * Возвращает число captured-строк, отправленных на upsert.
 */
export async function ingestWalToSupabase(): Promise<number> {
  if (!existsSync(LOG_PATH)) return 0;
  let text = "";
  try {
    text = readFileSync(LOG_PATH, "utf8");
  } catch {
    return 0;
  }
  const rows: LeadRow[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let e: Record<string, unknown>;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    if (e.kind !== "capture") continue;
    rows.push({
      id: e.id as string,
      event_id: (e.eventId as string) ?? null,
      name: e.name as string,
      phone: e.phone as string,
      source: (e.source as string) ?? null,
      utm: packUtm((e.utm as Record<string, string>) ?? undefined, normalizeTelegram(e.telegram)),
      fbclid: (e.fbclid as string) ?? null,
      status: "pending",
      retry_count: 0,
    });
  }
  if (!rows.length) return 0;
  await bulkInsertIgnore(rows);
  return rows.length;
}
