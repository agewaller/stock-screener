-- =====================================================================
-- JSRM (Japan Sovereignty Risk Monitor) - Supabase schema
--
-- Apply with:
--   psql "$SUPABASE_DB_URL" -f supabase/schema.sql
-- or paste into the Supabase SQL editor.
--
-- IMPORTANT (RLS):
--   This MVP performs all writes from the server using the SERVICE ROLE key,
--   which bypasses Row Level Security. Clients MUST NOT write to these
--   tables directly. See the commented-out policies near the bottom for a
--   safe future expansion.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ----- 1. subscribers --------------------------------------------------
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'pending'
    check (status in ('pending','active','unsubscribed','bounced')),
  confirm_token_hash text,
  unsubscribe_token_hash text not null,
  alert_min_level int not null default 2
    check (alert_min_level between 0 and 5),
  alert_min_score_delta_1d numeric not null default 0.35,
  alert_min_score_delta_7d numeric not null default 0.60,
  categories text[] not null default array[
    'taiwan_strait',
    'senkaku_east_china_sea',
    'china_russia_military',
    'north_korea',
    'us_japan_operational_integration',
    'legal_political_activation',
    'market_supply_chain',
    'cyber_information_warfare'
  ],
  locale text not null default 'ja',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  last_alert_sent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists subscribers_status_idx on public.subscribers (status);
create index if not exists subscribers_confirm_token_idx on public.subscribers (confirm_token_hash);
create index if not exists subscribers_unsub_token_idx on public.subscribers (unsubscribe_token_hash);

-- ----- 2. alert_deliveries --------------------------------------------
create table if not exists public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  risk_date date not null,
  alert_type text not null
    check (alert_type in ('level_threshold','daily_spike','weekly_spike','manual_critical')),
  overall_score numeric not null,
  level int not null,
  subject text not null,
  sent_at timestamptz not null default now(),
  resend_message_id text,
  status text not null default 'sent'
    check (status in ('sent','failed','skipped')),
  error_message text,
  payload jsonb not null default '{}'::jsonb,
  unique (subscriber_id, risk_date, alert_type)
);

create index if not exists alert_deliveries_subscriber_date_idx
  on public.alert_deliveries (subscriber_id, risk_date desc);

-- ----- 3. subscription_events -----------------------------------------
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.subscribers(id) on delete cascade,
  event_type text not null
    check (event_type in ('requested','confirmed','unsubscribed','alert_sent','alert_failed')),
  created_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists subscription_events_subscriber_idx
  on public.subscription_events (subscriber_id, created_at desc);

-- ----- RLS (future) ---------------------------------------------------
-- For MVP we do not enable RLS because all writes happen through the
-- service role on the server. Once we want client reads (e.g. a
-- self-service unsubscribe page using anon key + JWT), enable like this:
--
--   alter table public.subscribers enable row level security;
--   alter table public.alert_deliveries enable row level security;
--   alter table public.subscription_events enable row level security;
--
--   -- Example: only the row's owner (matched by signed JWT email claim)
--   -- can read their own subscription:
--   create policy subscribers_self_read
--     on public.subscribers for select
--     using (auth.jwt() ->> 'email' = email);
--
-- Until those policies exist, do NOT expose ANON_KEY-driven writes.
