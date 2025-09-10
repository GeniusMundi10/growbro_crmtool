-- WhatsApp Embedded Signup: per-tenant credential storage
-- Run this in Supabase SQL editor or include in your migrations

create extension if not exists pgcrypto;

create table if not exists public.whatsapp_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ai_id text not null,
  waba_id text not null,
  phone_number_id text not null unique,
  phone_number text,
  business_token text not null,
  status text default 'connected',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, ai_id)
);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.whatsapp_integrations;
create trigger set_updated_at
before update on public.whatsapp_integrations
for each row execute procedure public.set_updated_at();

-- RLS
alter table public.whatsapp_integrations enable row level security;

drop policy if exists user_select_whatsapp_integrations on public.whatsapp_integrations;
drop policy if exists user_insert_whatsapp_integrations on public.whatsapp_integrations;
drop policy if exists user_update_whatsapp_integrations on public.whatsapp_integrations;
drop policy if exists user_delete_whatsapp_integrations on public.whatsapp_integrations;

create policy user_select_whatsapp_integrations
on public.whatsapp_integrations
for select
using ( auth.uid() = user_id );

create policy user_insert_whatsapp_integrations
on public.whatsapp_integrations
for insert
with check ( auth.uid() = user_id );

create policy user_update_whatsapp_integrations
on public.whatsapp_integrations
for update
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );

create policy user_delete_whatsapp_integrations
on public.whatsapp_integrations
for delete
using ( auth.uid() = user_id );
