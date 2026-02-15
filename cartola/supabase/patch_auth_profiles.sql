-- Auth/profile patch:
-- 1) add email to public.profiles
-- 2) sync profile on auth.users insert/update
-- Run this in Supabase SQL Editor.

begin;

alter table public.profiles
  add column if not exists email text;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname = 'profiles_email_key'
  ) then
    create unique index profiles_email_key on public.profiles(email);
  end if;
end
$$;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and (p.email is distinct from u.email);

create or replace function public.handle_new_user()
returns trigger as $$
declare
  generated_username text;
begin
  generated_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    'user_' || replace(left(new.id::text, 8), '-', '')
  );

  insert into public.profiles (id, email, username, full_name)
  values (
    new.id,
    new.email,
    generated_username,
    nullif(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    username = excluded.username,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_auth_user_updated()
returns trigger as $$
begin
  update public.profiles
  set
    email = new.email,
    updated_at = now()
  where id = new.id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute function public.handle_auth_user_updated();

commit;

