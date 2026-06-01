create table if not exists public.inbound_message_receipts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  receipt_key text not null unique,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_inbound_message_receipts_business_id
  on public.inbound_message_receipts (business_id);

alter table public.inbound_message_receipts enable row level security;

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
