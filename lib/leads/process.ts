/**
 * Единая логика «дожать лид в amoCRM» — используется и inline в /api/lead,
 * и фоновым reconciler'ом. На ретраях сначала проба существования (дедуп
 * от потерянного ответа), затем создание.
 */
import { createWorkshopLead, findExistingWorkshopLead } from "@/lib/amocrm/client";
import { markDone, type CapturedLead } from "@/lib/leads/store";

export type PushResult =
  | { ok: true; leadId?: number | null; adopted?: boolean }
  | { ok: false; error: string };

export async function pushLeadToAmo(
  lead: CapturedLead,
  opts: { probeFirst: boolean }
): Promise<PushResult> {
  // Проба идемпотентности: вдруг сделка уже создалась, а ответ потерялся.
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
    fbclid: lead.fbclid,
  });

  if (r.ok) {
    await markDone(lead.id, r.leadId);
    return { ok: true, leadId: r.leadId };
  }
  const status = "status" in r && r.status ? `:${r.status}` : "";
  return { ok: false, error: `amocrm:${r.reason}${status}` };
}
