/**
 * POST /api/reconcile — фоновый дожим лидов, не доехавших в amoCRM.
 * Дёргается system-cron'ом раз в ~5 мин (localhost, secret-gated).
 *
 *   0) сверка WAL → Supabase (любой captured-лид точно в очереди)
 *   1) берём pending|failed с retry_count < LEAD_RETRY_MAX
 *   2) дедуп-проба по телефону + повторное создание
 *   3) исчерпаны ретраи → Telegram-алерт владельцу + status=alert_sent
 *
 * ENV: RECONCILE_SECRET, LEAD_RETRY_MAX (=5)
 */
import { NextRequest, NextResponse } from "next/server";
import { selectRetryable, supabaseConfigured } from "@/lib/supabase-rest";
import {
  incrementRetry,
  markAlertSent,
  ingestWalToSupabase,
  type CapturedLead,
} from "@/lib/leads/store";
import { pushLeadToAmo } from "@/lib/leads/process";
import { sendOwnerAlert } from "@/lib/telegram/alert";

export const dynamic = "force-dynamic";

const MAX = Number(process.env.LEAD_RETRY_MAX) || 5;

export async function POST(req: NextRequest) {
  const secret = process.env.RECONCILE_SECRET;
  if (!secret || req.headers.get("x-reconcile-secret") !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!supabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "no_supabase" }, { status: 500 });
  }

  // 0) WAL → Supabase: гарантия что всё захваченное есть в очереди
  const swept = await ingestWalToSupabase().catch(() => 0);

  // 1) кандидаты на ретрай
  const rows = await selectRetryable(MAX, 50);

  let done = 0;
  let alerted = 0;
  let retrying = 0;

  for (const row of rows) {
    if (!row.id) continue;
    const lead: CapturedLead = {
      id: row.id,
      eventId: row.event_id ?? undefined,
      name: row.name,
      phone: row.phone,
      source: row.source ?? undefined,
      utm: row.utm ?? undefined,
      fbclid: row.fbclid ?? undefined,
    };

    const res = await pushLeadToAmo(lead, { probeFirst: true });
    if (res.ok) {
      done++;
      continue;
    }

    const current = row.retry_count ?? 0;
    await incrementRetry(row.id, current, res.error);
    if (current + 1 >= MAX) {
      await sendOwnerAlert(lead, res.error);
      await markAlertSent(row.id);
      alerted++;
    } else {
      retrying++;
    }
  }

  console.log(
    "[reconcile] swept=%d processed=%d done=%d alerted=%d retrying=%d",
    swept,
    rows.length,
    done,
    alerted,
    retrying
  );
  return NextResponse.json({
    ok: true,
    swept,
    processed: rows.length,
    done,
    alerted,
    retrying,
  });
}
