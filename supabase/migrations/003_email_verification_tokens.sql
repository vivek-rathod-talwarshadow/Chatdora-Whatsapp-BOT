create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_email_verification_tokens_user_id
  on public.email_verification_tokens (user_id);

create index if not exists idx_email_verification_tokens_email
  on public.email_verification_tokens (email);
