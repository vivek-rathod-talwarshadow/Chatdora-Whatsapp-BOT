create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do update
  set full_name = excluded.full_name,
      email = excluded.email,
      updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  business_name text not null,
  category text,
  owner_name text,
  phone text,
  email text,
  address text,
  opening_hours text,
  website text,
  instagram text,
  services text,
  short_description text,
  default_fallback_message text,
  ai_enabled boolean not null default true,
  rule_based_first boolean not null default true,
  ai_temperature numeric(3,2) not null default 0.30,
  ai_max_tokens int not null default 180,
  ai_timeout_seconds int not null default 12,
  ai_fallback_message text,
  bot_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  question text not null,
  answer text not null,
  keywords text[] default '{}',
  priority int not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.whatsapp_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade unique,
  phone_number_id text not null unique,
  access_token text not null,
  verify_token text not null,
  app_secret text,
  is_connected boolean not null default false,
  webhook_verified_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  workspace_id text unique,
  mode text not null check (mode in ('qr_login', 'meta_api')),
  status text not null default 'not_connected' check (status in ('not_connected', 'qr_ready', 'connecting', 'connected', 'disconnected', 'failed')),
  is_active boolean not null default false,
  connected_phone text,
  engine_status jsonb,
  last_error text,
  last_connected_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (business_id)
);

alter table public.whatsapp_connections add column if not exists workspace_id text;
alter table public.whatsapp_connections add column if not exists connected_phone text;
alter table public.whatsapp_connections add column if not exists engine_status jsonb;
update public.whatsapp_connections
set workspace_id = coalesce(workspace_id, 'workspace_' || business_id::text),
    connected_phone = coalesce(connected_phone, phone_number);
alter table public.whatsapp_connections drop column if exists phone_number;
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_connections_mode_check'
  ) then
    alter table public.whatsapp_connections drop constraint whatsapp_connections_mode_check;
  end if;
  if exists (
    select 1 from pg_constraint
    where conname = 'whatsapp_connections_status_check'
  ) then
    alter table public.whatsapp_connections drop constraint whatsapp_connections_status_check;
  end if;
exception when undefined_table then
  null;
end $$;
alter table public.whatsapp_connections
  add constraint whatsapp_connections_mode_check check (mode in ('qr_login', 'meta_api'));
alter table public.whatsapp_connections
  add constraint whatsapp_connections_status_check check (status in ('not_connected', 'qr_ready', 'connecting', 'connected', 'disconnected', 'failed'));

create table if not exists public.whatsapp_qr_sessions (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.whatsapp_connections(id) on delete cascade unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  session_data jsonb,
  qr_code text,
  qr_updated_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_name text,
  customer_phone text not null,
  message text not null,
  interest text,
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_phone text not null,
  customer_name text,
  incoming_message text not null,
  bot_reply text,
  reply_source text not null,
  model_used text,
  ai_provider text,
  matched_faq_id uuid references public.faqs(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  provider text not null,
  model text not null,
  status text not null,
  error text,
  latency_ms int,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  plan_name text not null,
  status text not null default 'trial',
  amount_inr int not null default 0,
  renewal_date timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.inbound_message_receipts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  receipt_key text not null unique,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_faqs_business_id on public.faqs (business_id);
create index if not exists idx_leads_business_id on public.leads (business_id);
create index if not exists idx_messages_business_phone on public.messages (business_id, customer_phone);
create index if not exists idx_ai_logs_business_id on public.ai_logs (business_id);
create index if not exists idx_whatsapp_connections_business_id on public.whatsapp_connections (business_id);
create index if not exists idx_inbound_message_receipts_business_id on public.inbound_message_receipts (business_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_businesses_updated_at on public.businesses;
create trigger set_businesses_updated_at
before update on public.businesses
for each row execute procedure public.set_updated_at();

drop trigger if exists set_faqs_updated_at on public.faqs;
create trigger set_faqs_updated_at
before update on public.faqs
for each row execute procedure public.set_updated_at();

drop trigger if exists set_whatsapp_settings_updated_at on public.whatsapp_settings;
create trigger set_whatsapp_settings_updated_at
before update on public.whatsapp_settings
for each row execute procedure public.set_updated_at();

drop trigger if exists set_whatsapp_connections_updated_at on public.whatsapp_connections;
create trigger set_whatsapp_connections_updated_at
before update on public.whatsapp_connections
for each row execute procedure public.set_updated_at();

drop trigger if exists set_whatsapp_qr_sessions_updated_at on public.whatsapp_qr_sessions;
create trigger set_whatsapp_qr_sessions_updated_at
before update on public.whatsapp_qr_sessions
for each row execute procedure public.set_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute procedure public.set_updated_at();

drop trigger if exists set_subscriptions_updated_at on public.subscriptions;
create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.faqs enable row level security;
alter table public.whatsapp_settings enable row level security;
alter table public.whatsapp_connections enable row level security;
alter table public.whatsapp_qr_sessions enable row level security;
alter table public.leads enable row level security;
alter table public.messages enable row level security;
alter table public.ai_logs enable row level security;
alter table public.subscriptions enable row level security;
alter table public.inbound_message_receipts enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id);

create policy "businesses_select_own" on public.businesses
for select using (auth.uid() = user_id);
create policy "businesses_insert_own" on public.businesses
for insert with check (auth.uid() = user_id);
create policy "businesses_update_own" on public.businesses
for update using (auth.uid() = user_id);
create policy "businesses_delete_own" on public.businesses
for delete using (auth.uid() = user_id);

create policy "faqs_select_own" on public.faqs
for select using (auth.uid() = user_id);
create policy "faqs_insert_own" on public.faqs
for insert with check (auth.uid() = user_id);
create policy "faqs_update_own" on public.faqs
for update using (auth.uid() = user_id);
create policy "faqs_delete_own" on public.faqs
for delete using (auth.uid() = user_id);

create policy "whatsapp_settings_select_own" on public.whatsapp_settings
for select using (auth.uid() = user_id);
create policy "whatsapp_settings_insert_own" on public.whatsapp_settings
for insert with check (auth.uid() = user_id);
create policy "whatsapp_settings_update_own" on public.whatsapp_settings
for update using (auth.uid() = user_id);
create policy "whatsapp_settings_delete_own" on public.whatsapp_settings
for delete using (auth.uid() = user_id);

create policy "whatsapp_connections_select_own" on public.whatsapp_connections
for select using (auth.uid() = user_id);
create policy "whatsapp_connections_insert_own" on public.whatsapp_connections
for insert with check (auth.uid() = user_id);
create policy "whatsapp_connections_update_own" on public.whatsapp_connections
for update using (auth.uid() = user_id);
create policy "whatsapp_connections_delete_own" on public.whatsapp_connections
for delete using (auth.uid() = user_id);

create policy "whatsapp_qr_sessions_select_own" on public.whatsapp_qr_sessions
for select using (auth.uid() = user_id);
create policy "whatsapp_qr_sessions_insert_own" on public.whatsapp_qr_sessions
for insert with check (auth.uid() = user_id);
create policy "whatsapp_qr_sessions_update_own" on public.whatsapp_qr_sessions
for update using (auth.uid() = user_id);
create policy "whatsapp_qr_sessions_delete_own" on public.whatsapp_qr_sessions
for delete using (auth.uid() = user_id);

create policy "leads_select_own" on public.leads
for select using (auth.uid() = user_id);
create policy "leads_insert_own" on public.leads
for insert with check (auth.uid() = user_id);
create policy "leads_update_own" on public.leads
for update using (auth.uid() = user_id);
create policy "leads_delete_own" on public.leads
for delete using (auth.uid() = user_id);

create policy "messages_select_own" on public.messages
for select using (auth.uid() = user_id);
create policy "messages_insert_own" on public.messages
for insert with check (auth.uid() = user_id);
create policy "messages_update_own" on public.messages
for update using (auth.uid() = user_id);
create policy "messages_delete_own" on public.messages
for delete using (auth.uid() = user_id);

create policy "ai_logs_select_own" on public.ai_logs
for select using (auth.uid() = user_id);
create policy "ai_logs_insert_own" on public.ai_logs
for insert with check (auth.uid() = user_id or user_id is null);
create policy "ai_logs_update_own" on public.ai_logs
for update using (auth.uid() = user_id);
create policy "ai_logs_delete_own" on public.ai_logs
for delete using (auth.uid() = user_id);

create policy "subscriptions_select_own" on public.subscriptions
for select using (auth.uid() = user_id);
create policy "subscriptions_insert_own" on public.subscriptions
for insert with check (auth.uid() = user_id);
create policy "subscriptions_update_own" on public.subscriptions
for update using (auth.uid() = user_id);
create policy "subscriptions_delete_own" on public.subscriptions
for delete using (auth.uid() = user_id);

create policy "inbound_message_receipts_select_own" on public.inbound_message_receipts
for select using (
  exists (
    select 1
    from public.businesses
    where businesses.id = inbound_message_receipts.business_id
      and businesses.user_id = auth.uid()
  )
);

create policy "inbound_message_receipts_insert_own" on public.inbound_message_receipts
for insert with check (
  exists (
    select 1
    from public.businesses
    where businesses.id = inbound_message_receipts.business_id
      and businesses.user_id = auth.uid()
  )
);

create policy "inbound_message_receipts_delete_own" on public.inbound_message_receipts
for delete using (
  exists (
    select 1
    from public.businesses
    where businesses.id = inbound_message_receipts.business_id
      and businesses.user_id = auth.uid()
  )
);
