/**
 * Минимальный Supabase REST (PostgREST) клиент через fetch — без SDK,
 * без новых npm-зависимостей. Используется как очередь/состояние для
 * системы надёжности лидов (таблица `workshop_leads`).
 *
 * ENV:
 *   SUPABASE_URL=https://dglgsasylctdighwuoib.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...   (серверный ключ, только в server env)
 *
 * Контракт never-throw: функции возвращают результат-объект, не кидают.
 */

const SUPA_URL = process.env.SUPABASE_URL || "";
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TABLE = "workshop_leads";

export function supabaseConfigured(): boolean {
  return Boolean(SUPA_URL && SUPA_KEY);
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SUPA_KEY,
    Authorization: `Bearer ${SUPA_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export type LeadRow = {
  id?: string;
  event_id?: string | null;
  name: string;
  phone: string;
  source?: string | null;
  utm?: Record<string, string> | null;
  fbclid?: string | null;
  status?: string;
  retry_count?: number;
  amocrm_lead_id?: number | null;
  last_error?: string | null;
};

/** INSERT одной строки; конфликт по PK/event_id → игнор (идемпотентно). */
export async function insertLead(
  row: LeadRow
): Promise<{ ok: boolean; reason?: string }> {
  if (!supabaseConfigured()) return { ok: false, reason: "no_config" };
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: headers({ Prefer: "resolution=ignore-duplicates,return=minimal" }),
      body: JSON.stringify(row),
    });
    if (res.ok || res.status === 409) return { ok: true };
    return { ok: false, reason: `http_${res.status}` };
  } catch {
    return { ok: false, reason: "exception" };
  }
}

/** Массовый INSERT (WAL-сверка); конфликты по PK игнорируются. */
export async function bulkInsertIgnore(
  rows: LeadRow[]
): Promise<{ ok: boolean; reason?: string }> {
  if (!supabaseConfigured()) return { ok: false, reason: "no_config" };
  if (!rows.length) return { ok: true };
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${TABLE}`, {
      method: "POST",
      headers: headers({ Prefer: "resolution=ignore-duplicates,return=minimal" }),
      body: JSON.stringify(rows),
    });
    if (res.ok || res.status === 409) return { ok: true };
    return { ok: false, reason: `http_${res.status}` };
  } catch {
    return { ok: false, reason: "exception" };
  }
}

/** PATCH по id. */
export async function updateLead(
  id: string,
  patch: Partial<LeadRow>
): Promise<{ ok: boolean; reason?: string }> {
  if (!supabaseConfigured()) return { ok: false, reason: "no_config" };
  try {
    const res = await fetch(`${SUPA_URL}/rest/v1/${TABLE}?id=eq.${id}`, {
      method: "PATCH",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    });
    return res.ok ? { ok: true } : { ok: false, reason: `http_${res.status}` };
  } catch {
    return { ok: false, reason: "exception" };
  }
}

/** Строки, которые ещё можно ретраить (pending|failed, retry_count < max). */
export async function selectRetryable(
  maxRetry: number,
  limit = 50
): Promise<LeadRow[]> {
  if (!supabaseConfigured()) return [];
  try {
    const q = `status=in.(pending,failed)&retry_count=lt.${maxRetry}&order=created_at.asc&limit=${limit}`;
    const res = await fetch(`${SUPA_URL}/rest/v1/${TABLE}?${q}`, {
      headers: headers(),
    });
    if (!res.ok) return [];
    return (await res.json().catch(() => [])) as LeadRow[];
  } catch {
    return [];
  }
}
