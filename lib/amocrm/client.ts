/**
 * Минимальный amoCRM-клиент для создания лида с лендинга воркшопа.
 *
 * Использует /api/v4/leads/complex — один запрос на создание лида + контакта.
 * Email НЕ собираем (письма не доходят, домен onai.academy не прогрет в Resend).
 *
 * Лид всегда тегается «Однодневник» + источник (landing-hero / landing-final-cta)
 * для быстрой сегментации в CRM.
 *
 * Не падает без AMOCRM_ACCESS_TOKEN — логирует и возвращает skip:no_token.
 * Форма продолжает принимать лиды даже до полной настройки CRM.
 *
 * ENV:
 *   AMOCRM_DOMAIN=platformonaiacademy   (без .amocrm.ru)
 *   AMOCRM_ACCESS_TOKEN=eyJ...
 *   AMOCRM_PIPELINE_WORKSHOP=10882150   (опц., default ниже)
 *   AMOCRM_STATUS_WORKSHOP=86078458     (опц., этап «Лиды однодневник»)
 */

const DEFAULT_PIPELINE = 10882150; // воронка «Однодневник»
const TAG_WORKSHOP = "Однодневник"; // основной тег для всех лидов с этого лендинга

type LeadInput = {
  name: string;
  phone: string;
  source: string;
  utm?: Record<string, string>;
  fbclid?: string;
};

// ID кастомных tracking_data полей сделки в AmoCRM (сняты через API).
const UTM_FIELD_IDS: Record<string, number> = {
  utm_source: 2177194,
  utm_medium: 2177190,
  utm_campaign: 2177192,
  utm_content: 2177188,
  utm_term: 2177196,
  utm_referrer: 2177198,
  gclid: 2177220,
};
const FBCLID_FIELD_ID = 2177224;

type CreateResult =
  | { ok: true; leadId: number }
  | {
      ok: false;
      reason: "no_token" | "http_error" | "exception";
      status?: number;
      error?: unknown;
    };

export async function createWorkshopLead(input: LeadInput): Promise<CreateResult> {
  const token = process.env.AMOCRM_ACCESS_TOKEN;
  const domain = process.env.AMOCRM_DOMAIN || "platformonaiacademy";

  if (!token) {
    console.warn(
      "[amocrm] AMOCRM_ACCESS_TOKEN не задан — лид НЕ создан. Лид: %s ***%s",
      input.name,
      input.phone.slice(-4)
    );
    return { ok: false, reason: "no_token" };
  }

  const pipelineId = Number(process.env.AMOCRM_PIPELINE_WORKSHOP) || DEFAULT_PIPELINE;
  const statusId = process.env.AMOCRM_STATUS_WORKSHOP
    ? Number(process.env.AMOCRM_STATUS_WORKSHOP)
    : undefined;

  // UTM-метки → tracking_data поля сделки (аналитика окупаемости по меткам).
  const leadCustomFields: Array<{
    field_id: number;
    values: Array<{ value: string }>;
  }> = [];
  if (input.utm) {
    for (const [key, fieldId] of Object.entries(UTM_FIELD_IDS)) {
      const v = input.utm[key];
      if (v) leadCustomFields.push({ field_id: fieldId, values: [{ value: v }] });
    }
  }
  if (input.fbclid) {
    leadCustomFields.push({ field_id: FBCLID_FIELD_ID, values: [{ value: input.fbclid }] });
  }

  // /leads/complex — лид + контакт + связь в одном запросе.
  // Теги: «Однодневник» (основной) + source (для аналитики, где именно сабмитнули).
  const body = [
    {
      name: `Однодневник · ${input.name}`,
      pipeline_id: pipelineId,
      ...(statusId ? { status_id: statusId } : {}),
      ...(leadCustomFields.length ? { custom_fields_values: leadCustomFields } : {}),
      _embedded: {
        contacts: [
          {
            name: input.name,
            custom_fields_values: [
              {
                field_code: "PHONE",
                values: [{ value: input.phone, enum_code: "MOB" }],
              },
            ],
          },
        ],
        tags: [{ name: TAG_WORKSHOP }, { name: input.source }],
      },
    },
  ];

  const url = `https://${domain}.amocrm.ru/api/v4/leads/complex`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(
        "[amocrm] %d %s — body: %s",
        res.status,
        res.statusText,
        errText.slice(0, 500)
      );
      return { ok: false, reason: "http_error", status: res.status, error: errText };
    }

    const data = (await res.json()) as Array<{ id: number; contact_id: number }>;
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

/**
 * Идемпотентность: ищем уже созданную сделку по телефону в воронке воркшопа.
 * Используется reconciler'ом / inline-ретраем ПЕРЕД повторным созданием,
 * чтобы не плодить дубли при потерянном ответе amoCRM. Never-throw.
 * Адоптим только нашу воронку и только свежую сделку (<24ч) — ту, что мы
 * только что пытались создать, а не старую регистрацию того же номера.
 */
export async function findExistingWorkshopLead(
  phone: string
): Promise<{ ok: true; leadId: number | null } | { ok: false }> {
  const token = process.env.AMOCRM_ACCESS_TOKEN;
  const domain = process.env.AMOCRM_DOMAIN || "platformonaiacademy";
  const pipelineId =
    Number(process.env.AMOCRM_PIPELINE_WORKSHOP) || DEFAULT_PIPELINE;
  if (!token) return { ok: false };

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return { ok: true, leadId: null };

  try {
    const url = `https://${domain}.amocrm.ru/api/v4/leads?query=${encodeURIComponent(
      digits
    )}&limit=10`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204) return { ok: true, leadId: null }; // amoCRM: пусто
    if (!res.ok) return { ok: false };
    const data = (await res.json().catch(() => null)) as {
      _embedded?: {
        leads?: Array<{ id: number; pipeline_id: number; created_at: number }>;
      };
    } | null;
    const leads = data?._embedded?.leads ?? [];
    const now = Math.floor(Date.now() / 1000);
    const match = leads.find(
      (l) => l.pipeline_id === pipelineId && now - (l.created_at || 0) < 86400
    );
    return { ok: true, leadId: match ? match.id : null };
  } catch {
    return { ok: false };
  }
}
