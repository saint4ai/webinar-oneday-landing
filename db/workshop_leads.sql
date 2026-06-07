-- Очередь надёжности лидов воркшопа (persist-first / retry / Telegram-alert).
-- Проект Supabase: dglgsasylctdighwuoib
--
-- Применить ОДНИМ из способов:
--   1) Supabase Dashboard → SQL Editor → вставить и Run.
--   2) Pooler (с сервера/локально, нужен SUPABASE_DB_PASSWORD):
--      psql "host=aws-1-eu-central-1.pooler.supabase.com port=5432 \
--            user=postgres.dglgsasylctdighwuoib dbname=postgres sslmode=require" \
--           -f db/workshop_leads.sql
--      (прямой db.<ref>.supabase.co НЕ работает — IPv6-only)

create table if not exists workshop_leads (
  id             uuid primary key default gen_random_uuid(),
  event_id       text unique,
  name           text not null,
  phone          text not null,
  source         text,
  utm            jsonb,
  fbclid         text,
  status         text not null default 'pending',   -- pending | done | failed | alert_sent
  retry_count    int  not null default 0,
  amocrm_lead_id bigint,
  last_error     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- индекс под выборку reconciler'ом (только то, что ещё ретраим)
create index if not exists workshop_leads_retryable
  on workshop_leads (status)
  where status in ('pending', 'failed');

-- PII: доступ только через service_role (он обходит RLS). anon/authenticated — ничего.
alter table workshop_leads enable row level security;
