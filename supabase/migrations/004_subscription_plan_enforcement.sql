alter table public.subscriptions
  add column if not exists current_period_start timestamptz,
  add column if not exists monthly_message_count int not null default 0;

create unique index if not exists idx_subscriptions_business_id_unique
  on public.subscriptions (business_id);

update public.subscriptions
set
  plan_name = case
    when lower(plan_name) = 'plus' then 'Plus'
    else 'Free'
  end,
  status = case
    when status is null or status = '' then 'active'
    else status
  end,
  amount_inr = case
    when lower(plan_name) = 'plus' then 899
    else 0
  end,
  current_period_start = coalesce(
    current_period_start,
    date_trunc('month', timezone('utc'::text, now()))
  ),
  monthly_message_count = coalesce(monthly_message_count, 0);
